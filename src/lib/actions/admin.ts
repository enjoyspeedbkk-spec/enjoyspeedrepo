"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, bookingConfirmationEmail } from "@/lib/email";
import { sendBookingConfirmation } from "@/lib/line";
import { TIME_SLOTS } from "@/lib/constants";

// ========================================
// Auth guard — ensures user is admin
// ========================================
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  return { userId: user.id, admin };
}

// ========================================
// DASHBOARD STATS
// ========================================
export async function getDashboardStats() {
  const { admin } = await requireAdmin();
  const today = new Date().toISOString().split("T")[0];

  // Today's bookings
  const { data: todaySessions } = await admin
    .from("ride_sessions")
    .select("id, time_slot_id, weather_status")
    .eq("date", today);

  const sessionIds = todaySessions?.map((s) => s.id) || [];

  const { data: todayBookings } = await admin
    .from("bookings")
    .select("id, status, rider_count, total_price, ride_total")
    .in("ride_session_id", sessionIds.length > 0 ? sessionIds : ["none"])
    .not("status", "in", '("cancelled","no_show")');

  // Pending payments
  const { data: pendingPayments } = await admin
    .from("payments")
    .select("id, amount")
    .eq("status", "pending");

  // This week's revenue
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: weekPayments } = await admin
    .from("payments")
    .select("amount")
    .in("status", ["paid", "verified"])
    .gte("created_at", weekAgo.toISOString());

  // Upcoming bookings (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const { data: upcomingSessions } = await admin
    .from("ride_sessions")
    .select("id")
    .gte("date", today)
    .lte("date", nextWeek.toISOString().split("T")[0]);

  const upcomingIds = upcomingSessions?.map((s) => s.id) || [];
  const { data: upcomingBookings } = await admin
    .from("bookings")
    .select("id, rider_count")
    .in("ride_session_id", upcomingIds.length > 0 ? upcomingIds : ["none"])
    .not("status", "in", '("cancelled","no_show")');

  return {
    todayBookings: todayBookings?.length || 0,
    todayRiders: todayBookings?.reduce((sum, b) => sum + b.rider_count, 0) || 0,
    todayRevenue: todayBookings?.reduce((sum, b) => sum + b.ride_total, 0) || 0,
    pendingPayments: pendingPayments?.length || 0,
    pendingAmount: pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
    weekRevenue: weekPayments?.reduce((sum, p) => sum + p.amount, 0) || 0,
    upcomingBookings: upcomingBookings?.length || 0,
    upcomingRiders: upcomingBookings?.reduce((sum, b) => sum + b.rider_count, 0) || 0,
  };
}

// ========================================
// ALL BOOKINGS (for admin management)
// ========================================
export async function getAllBookings(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { admin } = await requireAdmin();

  let query = admin
    .from("bookings")
    .select(
      `
      *,
      profiles!bookings_user_id_fkey(full_name, phone, line_id),
      ride_sessions!inner(date, time_slot_id, weather_status),
      riders(id, name, nickname, bike_preference, bike_rental_price, waiver_accepted),
      payments(id, amount, status, method, slip_image_url, verified_at)
    `
    )
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte("ride_sessions.date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("ride_sessions.date", filters.dateTo);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error("Admin bookings error:", error);
    return [];
  }

  return data || [];
}

// ========================================
// VERIFY PAYMENT
// ========================================
export async function verifyPayment(
  paymentId: string,
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const { userId, admin } = await requireAdmin();

  const { error: paymentError } = await admin
    .from("payments")
    .update({
      status: "verified",
      verified_by: userId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (paymentError) {
    return { success: false, error: "Could not verify payment" };
  }

  // Update booking status
  const { error: bookingError } = await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);

  if (bookingError) {
    return { success: false, error: "Payment verified but booking status update failed" };
  }

  // Send confirmation email + LINE message (fire-and-forget, don't block)
  try {
    const { data: booking } = await admin
      .from("bookings")
      .select(`
        id, contact_name, contact_email, contact_line_id,
        group_type, rider_count, ride_total, rental_total, total_price,
        ride_sessions!inner(date, time_slot_id)
      `)
      .eq("id", bookingId)
      .single();

    if (booking) {
      const session = (booking as any).ride_sessions;
      const slot = TIME_SLOTS.find((s) => s.id === session?.time_slot_id);
      const dateStr = new Date(session.date + "T12:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // Send confirmation email
      if (booking.contact_email) {
        const email = bookingConfirmationEmail({
          contactName: booking.contact_name,
          bookingId: booking.id,
          date: dateStr,
          timeSlot: slot?.label || session.time_slot_id,
          timeRange: slot ? `${slot.startTime}–${slot.endTime}` : "",
          groupType: booking.group_type,
          riderCount: booking.rider_count,
          rideTotal: booking.ride_total,
          rentalTotal: booking.rental_total || 0,
          totalPrice: booking.total_price,
        });
        sendEmail({ to: booking.contact_email, ...email }).catch(console.error);
      }

      // Send LINE confirmation if user has LINE linked
      if (booking.contact_line_id) {
        // Look up LINE user ID from line_users table
        const { data: lineUser } = await admin
          .from("line_users")
          .select("line_user_id")
          .eq("user_id", booking.contact_line_id)
          .single();

        if (lineUser) {
          sendBookingConfirmation(lineUser.line_user_id, {
            bookingId: booking.id,
            contactName: booking.contact_name,
            date: dateStr,
            timeSlot: slot?.label || session.time_slot_id,
            groupType: booking.group_type,
            riderCount: booking.rider_count,
            amount: booking.ride_total,
          }).catch(console.error);
        }
      }
    }
  } catch (notifError) {
    // Don't fail the payment verification if notifications fail
    console.error("Notification error (non-blocking):", notifError);
  }

  return { success: true };
}

// ========================================
// REJECT PAYMENT
// ========================================
export async function rejectPayment(
  paymentId: string,
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { userId, admin } = await requireAdmin();

  const { error: paymentError } = await admin
    .from("payments")
    .update({
      status: "failed",
      notes: reason || "Rejected by admin",
      verified_by: userId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (paymentError) {
    return { success: false, error: "Could not reject payment" };
  }

  // Revert booking status back to pending so customer can re-submit
  await admin
    .from("bookings")
    .update({ status: "pending" })
    .eq("id", bookingId);

  revalidatePath("/admin/payments");
  return { success: true };
}

// ========================================
// UPDATE BOOKING STATUS
// ========================================
export async function updateBookingStatus(
  bookingId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();

  const update: Record<string, unknown> = { status };
  if (notes) update.admin_notes = notes;
  if (status === "cancelled") {
    update.cancelled_at = new Date().toISOString();
    update.cancellation_reason = notes || "Admin cancelled";
  }

  const { error } = await admin
    .from("bookings")
    .update(update)
    .eq("id", bookingId);

  if (error) {
    return { success: false, error: "Could not update booking" };
  }

  return { success: true };
}

// ========================================
// MANAGE RIDE SESSIONS (availability)
// ========================================
export async function getUpcomingSessions(daysAhead: number = 14) {
  const { admin } = await requireAdmin();
  const today = new Date().toISOString().split("T")[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  const { data: sessions } = await admin
    .from("ride_sessions")
    .select("*")
    .gte("date", today)
    .lte("date", endDate.toISOString().split("T")[0])
    .order("date")
    .order("time_slot_id");

  // Also get bookings for these sessions
  const sessionIds = sessions?.map((s) => s.id) || [];
  const { data: bookings } = await admin
    .from("bookings")
    .select("ride_session_id, status, rider_count, group_type, contact_name")
    .in("ride_session_id", sessionIds.length > 0 ? sessionIds : ["none"])
    .not("status", "in", '("cancelled","no_show")');

  // Get blackout dates
  const { data: blackouts } = await admin
    .from("blackout_dates")
    .select("*")
    .gte("date", today)
    .lte("date", endDate.toISOString().split("T")[0]);

  return { sessions: sessions || [], bookings: bookings || [], blackouts: blackouts || [] };
}

export async function toggleSessionAvailability(
  sessionId: string,
  isAvailable: boolean
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();

  const { error } = await admin
    .from("ride_sessions")
    .update({ is_available: isAvailable })
    .eq("id", sessionId);

  return { success: !error };
}

export async function updateWeatherStatus(
  sessionId: string,
  status: "clear" | "warning" | "cancelled",
  note?: string
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();

  const { error } = await admin
    .from("ride_sessions")
    .update({ weather_status: status, weather_note: note || null })
    .eq("id", sessionId);

  return { success: !error };
}

export async function addBlackoutDate(
  date: string,
  reason: string,
  slots?: string[]
): Promise<{ success: boolean }> {
  const { userId, admin } = await requireAdmin();

  const { error } = await admin.from("blackout_dates").insert({
    date,
    reason,
    affects_slots: slots || [],
    created_by: userId,
  });

  return { success: !error };
}

// ========================================
// SITE CONFIG
// ========================================
export async function getSiteConfig() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("site_config")
    .select("*")
    .order("category");
  return data || [];
}

export async function updateSiteConfig(
  key: string,
  value: unknown
): Promise<{ success: boolean }> {
  const { userId, admin } = await requireAdmin();

  const { error } = await admin
    .from("site_config")
    .update({
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("key", key);

  return { success: !error };
}

// ========================================
// PACKAGE MANAGEMENT
// ========================================
export async function getPackagesConfig() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("ride_packages_config")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function updatePackage(
  id: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("ride_packages_config")
    .update(updates)
    .eq("id", id);
  if (!error) {
    revalidatePath("/admin/settings");
    revalidatePath("/booking");
  }
  return { success: !error };
}

export async function createPackage(
  pkg: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("ride_packages_config").insert(pkg);
  return { success: !error };
}

// ========================================
// PENDING PAYMENTS (for quick verification)
// ========================================
export async function getPendingPayments() {
  const { admin } = await requireAdmin();

  const { data } = await admin
    .from("payments")
    .select(
      `
      *,
      bookings!inner(
        id, contact_name, contact_phone, rider_count, group_type, ride_total, total_price,
        ride_sessions!inner(date, time_slot_id)
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return data || [];
}

// ========================================
// ALL PAYMENTS (for payments page)
// ========================================
export async function getAllPayments() {
  const { admin } = await requireAdmin();

  const { data } = await admin
    .from("payments")
    .select(
      `
      *,
      bookings!inner(
        id, contact_name, contact_phone, contact_email, rider_count, group_type, ride_total, total_price,
        ride_sessions!inner(date, time_slot_id)
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return data || [];
}

// ========================================
// TIME SLOTS CONFIG
// ========================================
export async function getTimeSlotsConfig() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("time_slots_config")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function updateTimeSlot(
  id: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("time_slots_config")
    .update(updates)
    .eq("id", id);
  return { success: !error };
}

// ========================================
// BIKE RENTALS CONFIG
// ========================================
export async function getBikeRentalsConfig() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("bike_rentals_config")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function updateBikeRental(
  id: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("bike_rentals_config")
    .update(updates)
    .eq("id", id);
  if (!error) {
    revalidatePath("/admin/settings");
    revalidatePath("/booking");
  }
  return { success: !error };
}

// ========================================
// STARTER KIT CONFIG
// ========================================
export async function getStarterKitConfig() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("starter_kit_config")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function updateStarterKitItem(
  id: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("starter_kit_config")
    .update(updates)
    .eq("id", id);
  return { success: !error };
}

export async function createStarterKitItem(
  item: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("starter_kit_config").insert(item);
  return { success: !error };
}

// ========================================
// STAFF MEMBERS
// ========================================
export async function getStaffMembers() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("staff_members")
    .select("*")
    .order("role")
    .order("name");
  return data || [];
}

export async function updateStaffMember(
  id: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("staff_members")
    .update(updates)
    .eq("id", id);
  return { success: !error };
}

export async function createStaffMember(
  member: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("staff_members").insert(member);
  return { success: !error };
}

// ========================================
// PROMO CODES
// ========================================
export async function getPromoCodes() {
  const { admin } = await requireAdmin();
  const { data } = await admin
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function updatePromoCode(
  id: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("promo_codes")
    .update(updates)
    .eq("id", id);
  return { success: !error };
}

export async function createPromoCode(
  code: Record<string, unknown>
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("promo_codes").insert(code);
  return { success: !error };
}

export async function deleteBlackoutDate(
  id: string
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("blackout_dates")
    .delete()
    .eq("id", id);
  return { success: !error };
}

// ========================================
// TODAY'S RIDES — full operational view
// ========================================
export async function getTodayRides() {
  const { admin } = await requireAdmin();
  const today = new Date().toISOString().split("T")[0];

  // Get all sessions for today
  const { data: sessions } = await admin
    .from("ride_sessions")
    .select("id, date, time_slot_id, weather_status, is_available, is_blackout")
    .eq("date", today);

  const sessionIds = sessions?.map((s) => s.id) || [];

  // Get bookings with riders for today
  const { data: bookings } = await admin
    .from("bookings")
    .select(`
      id, status, contact_name, contact_phone, contact_email, contact_line_id,
      group_type, rider_count, ride_total, rental_total, special_requests,
      ride_session_id,
      riders(id, name, nickname, bike_preference, clothing_size, cycling_experience,
             emergency_contact_name, emergency_contact_phone, checked_in, checked_in_at),
      payments(id, amount, status, slip_url)
    `)
    .in("ride_session_id", sessionIds.length > 0 ? sessionIds : ["none"])
    .not("status", "in", '("cancelled","no_show")');

  // Map bookings to sessions
  const slotMap: Record<string, {
    session: any;
    bookings: any[];
  }> = {};

  // Build slot entries for all time slots (even if no session exists)
  for (const slot of TIME_SLOTS) {
    const session = sessions?.find((s) => s.time_slot_id === slot.id);
    const slotBookings = bookings?.filter(
      (b) => session && b.ride_session_id === session.id
    ) || [];

    slotMap[slot.id] = {
      session: session || null,
      bookings: slotBookings,
    };
  }

  return slotMap;
}

// ========================================
// MANUAL WEATHER CHECK (admin-triggered)
// ========================================
export async function checkWeatherNow(): Promise<{
  success: boolean;
  alerts: Array<{
    date: string;
    slotLabel: string;
    severity: string;
    message: string;
    bookingCount: number;
    sessionId: string;
    timeSlotId: string;
  }>;
  error?: string;
}> {
  const { admin } = await requireAdmin();

  try {
    const { getWeatherForDate, assessForSlot } = await import("@/lib/weather");

    const dates: string[] = [];
    for (let i = 0; i <= 1; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const alerts: Array<{
      date: string;
      slotLabel: string;
      severity: string;
      message: string;
      bookingCount: number;
      sessionId: string;
      timeSlotId: string;
    }> = [];

    for (const date of dates) {
      const forecast = await getWeatherForDate(date);

      const { data: sessions } = await admin
        .from("ride_sessions")
        .select("id, date, time_slot_id, weather_status")
        .eq("date", date);

      if (!sessions) continue;

      for (const session of sessions) {
        const { assessment } = assessForSlot(forecast, session.time_slot_id);

        const slot = TIME_SLOTS.find((s) => s.id === session.time_slot_id);
        const slotLabel = slot
          ? `${slot.label} (${slot.startTime}–${slot.endTime})`
          : session.time_slot_id;

        // Update session weather
        await admin
          .from("ride_sessions")
          .update({
            weather_status: assessment.severity,
            weather_note: assessment.message,
          })
          .eq("id", session.id);

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
          timeSlotId: session.time_slot_id,
        });
      }
    }

    revalidatePath("/admin");
    return { success: true, alerts };
  } catch (err) {
    console.error("[checkWeatherNow] Error:", err);
    return { success: false, alerts: [], error: String(err) };
  }
}

// ========================================
// SEND WEATHER ALERT TO CUSTOMERS (admin-approved)
// ========================================
export async function sendWeatherAlertToCustomers(
  sessionId: string,
  severity: "watch" | "warning",
  message: string
): Promise<{ success: boolean; notified: number; error?: string }> {
  const { admin } = await requireAdmin();

  // Get session details
  const { data: session } = await admin
    .from("ride_sessions")
    .select("id, date, time_slot_id")
    .eq("id", sessionId)
    .single();

  if (!session) return { success: false, notified: 0, error: "Session not found" };

  const slot = TIME_SLOTS.find((s) => s.id === session.time_slot_id);
  const slotLabel = slot
    ? `${slot.label} (${slot.startTime}–${slot.endTime})`
    : session.time_slot_id;

  // Get confirmed bookings
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, user_id, contact_name, contact_email")
    .eq("ride_session_id", sessionId)
    .in("status", ["confirmed", "paid"]);

  if (!bookings || bookings.length === 0) {
    return { success: true, notified: 0 };
  }

  const { notifyWeatherAlert } = await import("@/lib/notifications");
  let notified = 0;

  for (const booking of bookings) {
    try {
      await notifyWeatherAlert(booking.user_id, {
        bookingId: booking.id,
        contactName: booking.contact_name,
        contactEmail: booking.contact_email || undefined,
        date: session.date,
        timeSlot: slotLabel,
        severity,
        weatherMessage: message,
      });
      notified++;
    } catch (err) {
      console.error(`[sendWeatherAlert] Failed for booking ${booking.id}:`, err);
    }
  }

  revalidatePath("/admin");
  return { success: true, notified };
}

// ========================================
// BULK WEATHER CANCELLATION
// ========================================
export async function bulkWeatherCancel(
  date: string,
  slotIds: string[],
  reason: string
): Promise<{ success: boolean; cancelledBookings: number; error?: string }> {
  const { admin } = await requireAdmin();
  let cancelledCount = 0;

  for (const slotId of slotIds) {
    // Update or create session with cancelled weather
    const { data: session } = await admin
      .from("ride_sessions")
      .select("id")
      .eq("date", date)
      .eq("time_slot_id", slotId)
      .single();

    if (session) {
      await admin
        .from("ride_sessions")
        .update({ weather_status: "cancelled" })
        .eq("id", session.id);

      // Cancel all active bookings for this session
      const { data: activeBookings } = await admin
        .from("bookings")
        .select("id, contact_name, contact_email, contact_line_id, contact_phone")
        .eq("ride_session_id", session.id)
        .not("status", "in", '("cancelled","no_show","completed")');

      if (activeBookings && activeBookings.length > 0) {
        const bookingIds = activeBookings.map((b) => b.id);

        // Mark all as cancelled with reason and timestamp
        await admin
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: `Weather cancellation: ${reason}`,
          })
          .in("id", bookingIds);

        // Also mark any pending payments as failed (prevents stale payment records)
        await admin
          .from("payments")
          .update({ status: "failed", notes: `Weather cancellation: ${reason}` })
          .in("booking_id", bookingIds)
          .eq("status", "pending");

        cancelledCount += activeBookings.length;

        // Send notifications (fire-and-forget)
        for (const booking of activeBookings) {
          const slotInfo = TIME_SLOTS.find((s) => s.id === slotId);
          const notifText = `Weather cancellation: Your ${slotInfo?.label || slotId} ride on ${date} has been cancelled due to ${reason}. We'll contact you about rescheduling.`;

          if (booking.contact_email) {
            sendEmail({
              to: booking.contact_email,
              subject: `Ride Cancelled — ${date}`,
              html: `<p>Hi ${booking.contact_name},</p><p>${notifText}</p><p>We apologize for the inconvenience. Please reply to reschedule or request a refund.</p><p>— En-Joy Speed Team</p>`,
            }).catch(console.error);
          }

          if (booking.contact_line_id) {
            import("@/lib/line").then(({ linePush }) => {
              linePush(booking.contact_line_id!, [{ type: "text", text: notifText }]).catch(console.error);
            });
          }
        }
      }
    }
  }

  return { success: true, cancelledBookings: cancelledCount };
}

// ========================================
// ADMIN CANCEL BOOKING (any reason)
// ========================================
export async function adminCancelBooking(
  bookingId: string,
  reason: string,
  notifyCustomer: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();

  // Get booking details
  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select(`
      id, status, contact_name, contact_email, contact_line_id, contact_phone,
      ride_total, group_type, rider_count,
      ride_sessions!inner(date, time_slot_id)
    `)
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found" };
  }

  if (booking.status === "cancelled") {
    return { success: false, error: "Booking is already cancelled" };
  }

  // Cancel booking with metadata
  await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq("id", bookingId);

  // Mark any pending payments as failed
  await admin
    .from("payments")
    .update({ status: "failed", notes: `Admin cancelled: ${reason}` })
    .eq("booking_id", bookingId)
    .eq("status", "pending");

  // Notify customer
  if (notifyCustomer) {
    const session = Array.isArray(booking.ride_sessions)
      ? booking.ride_sessions[0]
      : booking.ride_sessions;
    const slotInfo = TIME_SLOTS.find((s) => s.id === session?.time_slot_id);
    const msg = `Hi ${booking.contact_name}, your ${slotInfo?.label || ""} ride on ${session?.date} has been cancelled. Reason: ${reason}. We'll be in touch about rescheduling or a refund.`;

    if (booking.contact_email) {
      sendEmail({
        to: booking.contact_email,
        subject: `Booking Cancelled — ${booking.contact_name}`,
        html: `<p>${msg}</p><p>— En-Joy Speed Team</p>`,
      }).catch(console.error);
    }

    if (booking.contact_line_id) {
      import("@/lib/line").then(({ linePush }) => {
        linePush(booking.contact_line_id!, [{ type: "text", text: msg }]).catch(console.error);
      });
    }
  }

  return { success: true };
}

// ========================================
// RIDER CHECK-IN
// ========================================
export async function checkInRider(
  riderId: string,
  checkedIn: boolean
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("riders")
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .eq("id", riderId);
  return { success: !error };
}

// ========================================
// BULK CHECK-IN (all riders for a booking)
// ========================================
export async function bulkCheckInBooking(
  bookingId: string,
  checkedIn: boolean
): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("riders")
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .eq("booking_id", bookingId);

  if (!error && checkedIn) {
    // Also update booking status to "ready" if checking in
    await admin
      .from("bookings")
      .update({ status: "ready" })
      .eq("id", bookingId);
  }

  return { success: !error };
}

// ========================================
// ADMIN ACCESS MANAGEMENT
// ========================================
export async function listAdmins() {
  const { admin } = await requireAdmin();

  const { data, error } = await admin.rpc("list_admins");

  if (error) {
    console.error("Error listing admins:", error);
    return [];
  }

  return data || [];
}

export async function grantAdminAccess(email: string) {
  const { admin } = await requireAdmin();

  const { data, error } = await admin.rpc("grant_admin_by_email", {
    p_email: email.toLowerCase().trim(),
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: data };
}

export async function revokeAdminAccess(email: string) {
  const { admin, userId } = await requireAdmin();

  // Prevent revoking the owner account
  const ownerEmail = "enjoyspeed.bkk@gmail.com";
  if (email.toLowerCase().trim() === ownerEmail) {
    return { success: false, message: "Cannot revoke the owner account." };
  }

  const { data, error } = await admin.rpc("revoke_admin_by_email", {
    p_email: email.toLowerCase().trim(),
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: data };
}
