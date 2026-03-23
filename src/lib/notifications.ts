"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { linePush } from "@/lib/line";
import { sendEmail, bookingConfirmationEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";

// ========================================
// Notification Dispatcher
// Cascade: LINE → Email → SMS
// ========================================

interface UserContact {
  lineUserId?: string;
  email?: string;
  phone?: string;
  preferredNotification?: "line" | "email" | "sms";
}

/**
 * Look up a user's contact methods from profiles + line_users tables.
 */
async function resolveUserContact(userId: string): Promise<UserContact> {
  const admin = createAdminClient();

  // Get profile
  const { data: profile } = await admin
    .from("profiles")
    .select("phone, preferred_notification")
    .eq("id", userId)
    .single();

  // Get email from auth
  const { data: authUser } = await admin.auth.admin.getUserById(userId);

  // Get LINE user ID if linked
  const { data: lineUser } = await admin
    .from("line_users")
    .select("line_user_id, is_following")
    .eq("supabase_user_id", userId)
    .eq("is_following", true)
    .single();

  return {
    lineUserId: lineUser?.line_user_id || undefined,
    email: authUser?.user?.email || undefined,
    phone: profile?.phone || undefined,
    preferredNotification: profile?.preferred_notification || undefined,
  };
}

/**
 * Send a notification using the cascade: LINE → Email → SMS.
 * Respects user's preferred_notification if set.
 */
async function sendWithCascade(
  contact: UserContact,
  lineMessage: string,
  emailOpts?: { to: string; subject: string; html: string },
  smsMessage?: string
): Promise<{ sent: boolean; via: string }> {
  const preferred = contact.preferredNotification;

  // Try LINE first (or if preferred)
  if (contact.lineUserId && (!preferred || preferred === "line")) {
    try {
      await linePush(contact.lineUserId, [{ type: "text", text: lineMessage }]);
      return { sent: true, via: "line" };
    } catch (err) {
      console.error("[Notify] LINE failed, falling back:", err);
    }
  }

  // Try email (or if preferred)
  if (emailOpts && contact.email && (!preferred || preferred === "email")) {
    try {
      const sent = await sendEmail({ ...emailOpts, to: contact.email });
      if (sent) return { sent: true, via: "email" };
    } catch (err) {
      console.error("[Notify] Email failed, falling back:", err);
    }
  }

  // Try SMS as last resort (or if preferred)
  if (smsMessage && contact.phone && (!preferred || preferred === "sms")) {
    try {
      const result = await sendSMS(contact.phone, smsMessage);
      if (result.success) return { sent: true, via: "sms" };
    } catch (err) {
      console.error("[Notify] SMS failed:", err);
    }
  }

  return { sent: false, via: "none" };
}

// ========================================
// Public notification functions
// ========================================

export async function notifyBookingConfirmation(
  userId: string,
  booking: {
    bookingId: string;
    contactName: string;
    contactEmail?: string;
    date: string;
    timeSlot: string;
    timeRange: string;
    groupType: string;
    riderCount: number;
    rideTotal: number;
    rentalTotal: number;
    totalPrice: number;
  }
) {
  const contact = await resolveUserContact(userId);

  // Override email if provided in booking
  if (booking.contactEmail) contact.email = booking.contactEmail;

  const lineMsg = `✅ Booking Confirmed!\n\nHi ${booking.contactName}!\n\n📅 ${booking.date}\n🕐 ${booking.timeSlot} (${booking.timeRange})\n👥 ${booking.groupType} (${booking.riderCount} riders)\n💰 ฿${booking.totalPrice.toLocaleString()}\n\nBooking #${booking.bookingId.slice(0, 8).toUpperCase()}\n\nView: https://enjoyspeedbkk.com/bookings`;

  const emailData = bookingConfirmationEmail(booking);

  const smsMsg = `En-Joy Speed: Booking confirmed! ${booking.date} ${booking.timeSlot}, ${booking.riderCount} riders. #${booking.bookingId.slice(0, 8).toUpperCase()}. Details: https://enjoyspeedbkk.com/bookings`;

  const result = await sendWithCascade(
    contact,
    lineMsg,
    contact.email ? { to: contact.email, subject: emailData.subject, html: emailData.html } : undefined,
    smsMsg
  );

  console.log(`[Notify] Booking confirmation for ${booking.contactName} — sent via ${result.via}`);
  return result;
}

export async function notifyPreRideReminder(
  userId: string,
  booking: {
    contactName: string;
    date: string;
    timeSlot: string;
    timeRange: string;
    meetingPoint: string;
  }
) {
  const contact = await resolveUserContact(userId);

  const lineMsg = `🚴 Ride Tomorrow!\n\nHi ${booking.contactName}!\n\n📅 ${booking.date}\n🕐 ${booking.timeSlot} (${booking.timeRange})\n📍 ${booking.meetingPoint}\n\n✅ Checklist:\n• Sport shoes (closed-toe)\n• Athletic socks & top\n• Sunscreen + sunglasses\n• Water bottle\n\nSee you there! 🌅`;

  const smsMsg = `En-Joy Speed: Ride tomorrow! ${booking.timeSlot} at ${booking.meetingPoint}. Bring sport shoes, sunscreen, water. See you there!`;

  return sendWithCascade(contact, lineMsg, undefined, smsMsg);
}

export async function notifyWeatherCancellation(
  userId: string,
  booking: {
    contactName: string;
    date: string;
    timeSlot: string;
    bookingId: string;
  }
) {
  const contact = await resolveUserContact(userId);

  const lineMsg = `🌧️ Weather Update\n\nHi ${booking.contactName},\n\nYour ride on ${booking.date} (${booking.timeSlot}) has been cancelled for safety.\n\nYour options:\n• Reschedule (free)\n• Rain credit (90 days)\n• Refund\n\nReply here or visit:\nhttps://enjoyspeedbkk.com/bookings`;

  const smsMsg = `En-Joy Speed: Ride cancelled (weather) — ${booking.date}. Free reschedule, rain credit, or refund available. Reply or visit enjoyspeedbkk.com`;

  return sendWithCascade(contact, lineMsg, undefined, smsMsg);
}

export async function notifyPostRide(
  userId: string,
  booking: {
    contactName: string;
    bookingId: string;
  }
) {
  const contact = await resolveUserContact(userId);

  const lineMsg = `🎉 Great Ride!\n\nThanks for riding with us, ${booking.contactName}!\n\nWe'd love your feedback:\n👉 https://enjoyspeedbkk.com/bookings\n\nSee you on the next ride! 🚴‍♂️`;

  return sendWithCascade(contact, lineMsg);
}
