import { NextRequest, NextResponse } from "next/server";
import { expireStalePendingBookings } from "@/lib/actions/booking";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron endpoint to expire stale pending bookings and test bookings.
 *
 * Call this periodically (every 5-15 min) via:
 * - Vercel Cron: add to vercel.json
 * - External cron service (e.g., cron-job.org)
 * - Supabase Edge Function scheduled trigger
 *
 * Behavior:
 * - Expires regular bookings using the existing RPC function
 * - Expires test bookings (is_test=true) older than 10 minutes
 * - Sets status to "expired" for all expired bookings
 *
 * Protected by a shared secret to prevent unauthorized calls.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret — fail-closed: reject if secret not configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireStalePendingBookings();
    let expiredTestBookings = 0;

    // Expire test bookings older than 10 minutes
    // NOTE: The 'is_test' column must exist on the bookings table for this to work:
    // ALTER TABLE bookings ADD COLUMN is_test BOOLEAN DEFAULT false;
    const admin = createAdminClient();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: testBookingsToExpire, error: selectError } = await admin
      .from("bookings")
      .select("id")
      .eq("is_test", true)
      .neq("status", "expired")
      .neq("status", "cancelled")
      .lte("created_at", tenMinutesAgo);

    if (selectError) {
      console.error("Error fetching test bookings to expire:", selectError);
    } else if (testBookingsToExpire && testBookingsToExpire.length > 0) {
      const testBookingIds = testBookingsToExpire.map((b) => b.id);
      const { error: updateError, data: updatedData } = await admin
        .from("bookings")
        .update({ status: "expired" })
        .in("id", testBookingIds)
        .select("id");

      if (updateError) {
        console.error("Error expiring test bookings:", updateError);
      } else {
        expiredTestBookings = updatedData?.length || 0;
        console.log(`Expired ${expiredTestBookings} test bookings`);
      }
    }

    return NextResponse.json({
      success: true,
      expired: result.expired,
      expiredTestBookings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron expire-bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
