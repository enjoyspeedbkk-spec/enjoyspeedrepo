import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWeatherForDate, assessForSlot } from "@/lib/weather";
import type { WeatherSeverity } from "@/lib/weather";
import { sendEmail } from "@/lib/email";
import { linePush } from "@/lib/line";
import { TIME_SLOTS } from "@/lib/constants";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "enjoyspeed.bkk@gmail.com";

/**
 * Weather monitoring cron — ADMIN NOTIFICATION ONLY.
 *
 * This does NOT contact customers. It:
 * 1. Checks weather for all sessions in the next 48 hours
 * 2. Updates ride_sessions.weather_status + weather_note
 * 3. Sends a summary to admin (Pailin) via email + LINE
 * 4. Admin then decides in the dashboard whether to notify/cancel
 *
 * Runs twice daily (5 AM + 1 PM Bangkok time) via external cron.
 * Also callable manually from admin dashboard.
 */
export async function GET(request: NextRequest) {
  // Auth check — accept either cron secret or admin session
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENWEATHER_API_KEY) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY not configured" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();

  interface AlertItem {
    date: string;
    slotLabel: string;
    severity: WeatherSeverity;
    message: string;
    bookingCount: number;
    sessionId: string;
  }

  const alerts: AlertItem[] = [];

  try {
    // Check next 2 days (today + tomorrow)
    const dates: string[] = [];
    for (let i = 0; i <= 1; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    for (const date of dates) {
      const forecast = await getWeatherForDate(date);

      const { data: sessions } = await admin
        .from("ride_sessions")
        .select("id, date, time_slot_id, weather_status, weather_note")
        .eq("date", date);

      if (!sessions || sessions.length === 0) continue;

      for (const session of sessions) {
        const { assessment } = assessForSlot(forecast, session.time_slot_id);

        const slot = TIME_SLOTS.find((s) => s.id === session.time_slot_id);
        const slotLabel = slot
          ? `${slot.label} (${slot.startTime}–${slot.endTime})`
          : session.time_slot_id;

        // Always update the weather status on the session
        await admin
          .from("ride_sessions")
          .update({
            weather_status: assessment.severity,
            weather_note: assessment.message,
          })
          .eq("id", session.id);

        // Only flag as alert if severity is watch or higher
        if (assessment.severity === "clear") continue;

        // Skip if already at this severity (don't re-alert admin)
        if (session.weather_status === assessment.severity) continue;

        // Count affected bookings
        const { count } = await admin
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("ride_session_id", session.id)
          .in("status", ["confirmed", "paid"]);

        alerts.push({
          date,
          slotLabel,
          severity: assessment.severity,
          message: assessment.message,
          bookingCount: count || 0,
          sessionId: session.id,
        });
      }
    }

    // If there are alerts, notify admin
    if (alerts.length > 0) {
      await notifyAdmin(alerts);
    }

    return NextResponse.json({
      success: true,
      checked: dates,
      alertCount: alerts.length,
      alerts: alerts.map((a) => ({
        date: a.date,
        slot: a.slotLabel,
        severity: a.severity,
        bookings: a.bookingCount,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Weather Cron] Error:", error);
    return NextResponse.json(
      { error: "Weather check failed", details: String(error) },
      { status: 500 }
    );
  }
}

// ── Admin notification ────────────────────────

async function notifyAdmin(alerts: Array<{
  date: string;
  slotLabel: string;
  severity: WeatherSeverity;
  message: string;
  bookingCount: number;
}>) {
  const severityEmoji: Record<WeatherSeverity, string> = {
    clear: "☀️",
    watch: "🌤️",
    warning: "⚠️",
    severe: "🌧️",
  };

  // Build summary
  const lines = alerts.map((a) =>
    `${severityEmoji[a.severity]} ${a.date} ${a.slotLabel}\n   ${a.severity.toUpperCase()} — ${a.message}\n   ${a.bookingCount} booking${a.bookingCount !== 1 ? "s" : ""} affected`
  );

  const summary = lines.join("\n\n");
  const hasSevere = alerts.some((a) => a.severity === "severe");
  const hasWarning = alerts.some((a) => a.severity === "warning");

  // LINE notification to admin (if LINE token exists)
  const adminLineId = process.env.ADMIN_LINE_USER_ID;
  if (adminLineId && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    try {
      const urgency = hasSevere
        ? "🚨 CANCELLATION NEEDED"
        : hasWarning
          ? "⚠️ Weather Warning"
          : "🌤️ Weather Watch";

      await linePush(adminLineId, [
        {
          type: "text",
          text: `${urgency}\n\n${summary}\n\n👉 Review in dashboard:\nhttps://enjoyspeedbkk.com/admin`,
        },
      ]);
    } catch (err) {
      console.error("[Weather Cron] Failed to notify admin via LINE:", err);
    }
  }

  // Email notification to admin (always)
  try {
    const subject = hasSevere
      ? `🚨 Weather Alert — Cancellation may be needed`
      : hasWarning
        ? `⚠️ Weather Warning — Upcoming rides affected`
        : `🌤️ Weather Watch — Rain possible for upcoming rides`;

    const htmlAlerts = alerts.map((a) => `
      <div style="padding: 12px; margin-bottom: 12px; border-radius: 8px; background: ${
        a.severity === "severe" ? "#fef2f2" : a.severity === "warning" ? "#fffbeb" : "#f0f9ff"
      }; border-left: 4px solid ${
        a.severity === "severe" ? "#ef4444" : a.severity === "warning" ? "#f59e0b" : "#3b82f6"
      };">
        <strong>${severityEmoji[a.severity]} ${a.date} — ${a.slotLabel}</strong><br>
        <span style="color: #6b7280;">${a.message}</span><br>
        <strong>${a.bookingCount}</strong> booking${a.bookingCount !== 1 ? "s" : ""} affected
      </div>
    `).join("");

    await sendEmail({
      to: ADMIN_EMAIL,
      subject,
      html: `
        <h2>Weather Alert for Upcoming Rides</h2>
        <p>The following rides have weather concerns:</p>
        ${htmlAlerts}
        <p style="margin-top: 20px;">
          <a href="https://enjoyspeedbkk.com/admin"
             style="display: inline-block; padding: 12px 24px; background: #1B2A4A; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Review in Dashboard
          </a>
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          ${hasSevere
            ? "Action required: Review and decide whether to cancel affected rides."
            : "No action required yet. Weather is being monitored automatically."
          }
        </p>
      `,
    });
  } catch (err) {
    console.error("[Weather Cron] Failed to notify admin via email:", err);
  }
}
