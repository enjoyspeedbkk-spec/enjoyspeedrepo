"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * Get the site URL for auth redirects.
 * Uses NEXT_PUBLIC_SITE_URL (set in Vercel), then VERCEL_URL, then origin header.
 */
function getSiteUrl(): string {
  // Explicit site URL (set this in Vercel env vars)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Vercel auto-sets this on deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local dev
  return "http://localhost:3000";
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Google sign-in error:", error);
    return redirect("/account?error=auth_failed");
  }

  if (data.url) {
    return redirect(data.url);
  }
}

// Password-based sign-in/sign-up removed — we use email OTP exclusively.
// See src/lib/actions/email-auth.ts for sendEmailOtp / verifyEmailOtp.

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Update the user's profile (full_name, phone, line_id, preferred_language).
 */
export async function updateProfile(data: {
  fullName?: string;
  phone?: string;
  lineId?: string;
  preferredLanguage?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.fullName !== undefined) updates.full_name = data.fullName;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.lineId !== undefined) updates.line_id = data.lineId;
  if (data.preferredLanguage !== undefined) updates.preferred_language = data.preferredLanguage;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { error: error.message };
  }

  return { success: true };
}
