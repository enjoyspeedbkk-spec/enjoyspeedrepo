import { NextRequest, NextResponse } from "next/server";
import { expireStalePendingBookings } from "@/lib/actions/booking";

/**
 * Cron endpoint to expire stale pending bookings.
 *
 * Call this periodically (every 15-30 min) via:
 * - Vercel Cron: add to vercel.json
 * - External cron service (e.g., cron-job.org)
 * - Supabase Edge Function scheduled trigger
 *
 * Protected by a shared secret to prevent unauthorized calls.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireStalePendingBookings();
    return NextResponse.json({
      success: true,
      expired: result.expired,
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
