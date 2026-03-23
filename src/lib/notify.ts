// =============================================
// Notification Router — LINE → SMS → Email fallback
// =============================================

import { linePush } from "@/lib/line";
import { sendSMS } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

export type NotificationChannel = "line" | "sms" | "email";

interface NotifyContact {
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
  name?: string;
}

interface NotifyResult {
  success: boolean;
  channel: NotificationChannel | "none";
  error?: string;
}

/**
 * Send a notification through the best available channel.
 *
 * Priority: LINE → SMS → Email
 * Falls through to next channel if the current one fails.
 */
export async function notify(
  contact: NotifyContact,
  message: string,
  subject?: string
): Promise<NotifyResult> {
  // 1. Try LINE Push
  if (contact.lineUserId) {
    try {
      await linePush(contact.lineUserId, [{ type: "text", text: message }]);
      return { success: true, channel: "line" };
    } catch (err) {
      console.warn(
        `LINE push failed for ${contact.lineUserId}:`,
        err instanceof Error ? err.message : err
      );
      // Fall through to SMS
    }
  }

  // 2. Try SMS
  if (contact.phone) {
    try {
      // Truncate message for SMS (160 chars max for single SMS)
      const smsText = message.length > 300
        ? message.slice(0, 297) + "..."
        : message;
      const smsResult = await sendSMS(contact.phone, smsText);
      if (smsResult.success) {
        return { success: true, channel: "sms" };
      }
      console.warn("SMS failed:", smsResult.error);
    } catch (err) {
      console.warn("SMS send error:", err);
    }
  }

  // 3. Try Email
  if (contact.email) {
    try {
      const emailSubject = subject || "En-Joy Speed Notification";
      // Convert plain text to simple HTML paragraphs
      const html = message
        .split("\n")
        .map((line) => (line.trim() ? `<p>${line}</p>` : ""))
        .join("");
      const sent = await sendEmail({
        to: contact.email,
        subject: emailSubject,
        html,
      });
      if (sent) return { success: true, channel: "email" };
    } catch (err) {
      console.warn("Email failed:", err);
    }
  }

  // No channel worked
  console.error("All notification channels failed for:", {
    hasLine: !!contact.lineUserId,
    hasPhone: !!contact.phone,
    hasEmail: !!contact.email,
  });

  return {
    success: false,
    channel: "none",
    error: "All notification channels failed",
  };
}

/**
 * Send a booking confirmation through the best channel.
 */
export async function notifyBookingConfirmation(
  contact: NotifyContact,
  booking: {
    bookingId: string;
    date: string;
    timeSlot: string;
    groupType: string;
    riderCount: number;
    amount: number;
  }
) {
  const message = `✅ Booking Confirmed!\n\nHi ${contact.name || "there"}!\n\n📅 ${booking.date}\n🕐 ${booking.timeSlot}\n👥 ${booking.groupType} (${booking.riderCount} riders)\n💰 ${booking.amount.toLocaleString()} THB\n\nBooking #${booking.bookingId.slice(0, 8).toUpperCase()}\n\n📋 What to bring:\n• Sport shoes (closed-toe)\n• Athletic socks & top\n• Sunscreen + sunglasses\n• Water bottle\n\n🎁 We'll have your Starter Kit ready!\n\nSee your booking: https://enjoyspeedbkk.com/bookings`;

  return notify(contact, message, "Booking Confirmed — En-Joy Speed");
}

/**
 * Send a payment reminder through the best channel.
 */
export async function notifyPaymentReminder(
  contact: NotifyContact,
  booking: { bookingId: string; amount: number; expiresIn: string }
) {
  const message = `💳 Payment Reminder\n\nHi ${contact.name || "there"}, your booking #${booking.bookingId.slice(0, 8).toUpperCase()} is waiting for payment.\n\n💰 Amount: ${booking.amount.toLocaleString()} THB\n⏰ Pay within: ${booking.expiresIn}\n\nComplete payment: https://enjoyspeedbkk.com/bookings`;

  return notify(contact, message, "Payment Reminder — En-Joy Speed");
}
