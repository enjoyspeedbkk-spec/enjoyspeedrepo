import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// =============================================
// LIFF API — Links LINE identity to Supabase user
// =============================================

/**
 * POST /api/liff — Link or lookup a LINE userId
 *
 * Called from the booking page when LIFF detects the user is inside LINE.
 * Two modes:
 *
 * 1. "lookup" — Check if this LINE userId is already linked to a Supabase user
 *    Body: { action: "lookup", lineUserId, displayName, pictureUrl }
 *    Returns: { linked: boolean, userId?, profile? }
 *
 * 2. "link" — Link this LINE userId to the currently authenticated Supabase user
 *    Body: { action: "link", lineUserId, displayName, pictureUrl }
 *    Requires: Active Supabase session (auth cookie)
 *    Returns: { linked: true, userId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, lineUserId, displayName, pictureUrl } = body;

    if (!lineUserId || !action) {
      return NextResponse.json(
        { error: "Missing lineUserId or action" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── LOOKUP ──────────────────────────────────
    if (action === "lookup") {
      // Check line_users for this LINE userId
      const { data: lineUser } = await admin
        .from("line_users")
        .select("line_user_id, user_id, display_name, linked_at")
        .eq("line_user_id", lineUserId)
        .single();

      if (!lineUser) {
        // LINE user not in our system yet (hasn't followed OA or is new)
        // Create a placeholder entry
        await admin.from("line_users").upsert(
          {
            line_user_id: lineUserId,
            display_name: displayName || null,
            picture_url: pictureUrl || null,
            followed_at: new Date().toISOString(),
            is_following: true,
          },
          { onConflict: "line_user_id" }
        );

        return NextResponse.json({ linked: false });
      }

      // LINE user exists — check if linked to a Supabase user
      if (!lineUser.user_id) {
        // Update display name if we have it
        if (displayName && displayName !== lineUser.display_name) {
          await admin
            .from("line_users")
            .update({ display_name: displayName, picture_url: pictureUrl })
            .eq("line_user_id", lineUserId);
        }
        return NextResponse.json({ linked: false });
      }

      // Linked — fetch the profile
      const { data: profile } = await admin
        .from("profiles")
        .select("id, full_name, phone, phone_verified, preferred_notification")
        .eq("id", lineUser.user_id)
        .single();

      return NextResponse.json({
        linked: true,
        userId: lineUser.user_id,
        profile: profile
          ? {
              name: profile.full_name,
              phone: profile.phone,
              phoneVerified: profile.phone_verified,
            }
          : null,
      });
    }

    // ── LINK ────────────────────────────────────
    if (action === "link") {
      // Requires authenticated Supabase session
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Not authenticated. Please verify your phone first." },
          { status: 401 }
        );
      }

      // Link the LINE userId to this Supabase user
      // 1. Update or create line_users entry
      await admin.from("line_users").upsert(
        {
          line_user_id: lineUserId,
          user_id: user.id,
          display_name: displayName || null,
          picture_url: pictureUrl || null,
          linked_at: new Date().toISOString(),
          linked_via: "liff",
          is_following: true,
        },
        { onConflict: "line_user_id" }
      );

      // 2. Update profile with LINE user ID
      await admin
        .from("profiles")
        .update({
          line_user_id: lineUserId,
          line_linked_at: new Date().toISOString(),
          preferred_notification: "line",
        })
        .eq("id", user.id);

      return NextResponse.json({
        linked: true,
        userId: user.id,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("LIFF API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
