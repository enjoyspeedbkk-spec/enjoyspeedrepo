"use server";

// ========================================
// Notification Dispatcher
// Sends via LINE → Email cascade
// ========================================
//
// Priority order:
// 1. LINE push (instant, free for push messages, highest open rate in Thailand)
// 2. Email via Brevo (permanent record, works worldwide, 300/day free tier)
//
// Each notification type has LINE + email templates.
// The dispatcher tries LINE first, falls back to email.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBookingConfirmation as lineBookingConfirmation,
  sendPreRideReminder as linePreRideReminder,
  sendWeatherCancellation as lineWeatherCancellation,
  sendPostRideThankYou as linePostRideThankYou,
} from "@/lib/line";
import {
  sendEmail,
  bookingConfirmationEmail,
  paymentPendingEmail,
  preRideReminderEmail,
  postRideEmail,
  weatherCancellationEmail,
} from "@/lib/email";

// ── Types ─────────────────────────────────────

interface NotifyResult {
  channel: "line" | "email" | "sms" | "none";
  success: boolean;
  error?: string;
}

interface UserContact {
  lineUserId?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredNotification?: "line" | "email" | "sms" | null;
}

// ── Resolve user's contact info ────────────────

async function resolveUserContact(userId: string): Promise<UserContact> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone, line_user_id, preferred_notification")
    .eq("id", userId)
    .single();

  // Also check line_users table for linked LINE account
  let lineUserId = profile?.line_user_id || null;

  if (!lineUserId) {
    const { data: lineUser } = await admin
      .from("line_users")
      .select("line_user_id, is_following")
      .eq("user_id", userId)
      .eq("is_following", true)
      .single();

    if (lineUser) {
      lineUserId = lineUser.line_user_id;
    }
  }

  return {
    lineUserId,
    email: null, // We'll get email from booking contact info
    phone: profile?.phone || null,
    preferredNotification: profile?.preferred_notification || null,
  };
}

// ── Send notification with cascade ─────────────

async function sendWithCascade(
  contact: UserContact & { contactEmail?: string },
  lineSend: (() => Promise<void>) | null,
  emailSend: (() => Promise<boolean>) | null,
): Promise<NotifyResult> {
  const hasLine = !!contact.lineUserId && !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const hasEmail = !!(contact.contactEmail || contact.email);

  // Determine priority order based on preference
  const preferred = contact.preferredNotification;
  const tryOrder: ("line" | "email")[] =
    preferred === "email" ? ["email", "line"] : ["line", "email"];

  for (const channel of tryOrder) {
    if (channel === "line" && hasLine && lineSend) {
      try {
        await lineSend();
        return { channel: "line", success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "LINE push failed";
        console.warn(`[Notify] LINE failed: ${msg} — trying next channel`);
        // If user blocked us, don't try LINE again
        if (msg === "LINE_USER_BLOCKED") continue;
      }
    }

    if (channel === "email" && hasEmail && emailSend) {
      try {
        const sent = await emailSend();
        if (sent) return { channel: "email", success: true };
      } catch (err) {
        console.warn(`[Notify] Email failed: ${err} — trying next channel`);
      }
    }
  }

  return { channel: "none", success: false, error: "No notification channel available" };
}

// ═══════════════════════════════════════════════
// Public notification functions
// ═══════════════════════════════════════════════

/**
 * Notify user of a confirmed booking
 */
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
): Promise<NotifyResult> {
  const contact = await resolveUserContact(userId);

  return sendWithCascade(
    { ...contact, contactEmail: booking.contactEmail },
    // LINE
    contact.lineUserId
      ? () =>
          lineBookingConfirmation(contact.lineUserId!, {
            bookingId: booking.bookingId,
            contactName: booking.contactName,
            date: booking.date,
            timeSlot: booking.timeSlot,
            groupType: booking.groupType,
            riderCount: booking.riderCount,
            amount: booking.totalPrice,
          })
      : null,
    // Email
    booking.contactEmail
      ? () => {
          const { subject, html } = bookingConfirmationEmail(booking);
          return sendEmail({ to: booking.contactEmail!, subject, html });
        }
      : null
  );
}

/**
 * Notify user of pending payment
 */
export async function notifyPaymentPending(
  userId: string,
  booking: {
    bookingId: string;
    contactName: string;
    contactEmail?: string;
    amount: number;
  }
): Promise<NotifyResult> {
  const contact = await resolveUserContact(userId);

  // Payment pending — only email (LINE would be too aggressive for a 30-min window)
  if (booking.contactEmail) {
    const { subject, html } = paymentPendingEmail(booking);
    const sent = await sendEmail({ to: booking.contactEmail, subject, html });
    return { channel: sent ? "email" : "none", success: sent };
  }

  return { channel: "none", success: false, error: "No email for payment reminder" };
}

/**
 * Notify user of pre-ride reminder (24h before)
 */
export async function notifyPreRideReminder(
  userId: string,
  booking: {
    contactName: string;
    contactEmail?: string;
    date: string;
    timeSlot: string;
    timeRange: string;
    meetingPoint: string;
  }
): Promise<NotifyResult> {
  const contact = await resolveUserContact(userId);

  return sendWithCascade(
    { ...contact, contactEmail: booking.contactEmail },
    // LINE
    contact.lineUserId
      ? () =>
          linePreRideReminder(contact.lineUserId!, {
            contactName: booking.contactName,
            date: booking.date,
            timeSlot: booking.timeSlot,
            meetingPoint: booking.meetingPoint,
          })
      : null,
    // Email
    booking.contactEmail
      ? () => {
          const { subject, html } = preRideReminderEmail(booking);
          return sendEmail({ to: booking.contactEmail!, subject, html });
        }
      : null
  );
}

/**
 * Notify user of weather cancellation
 */
export async function notifyWeatherCancellation(
  userId: string,
  booking: {
    bookingId: string;
    contactName: string;
    contactEmail?: string;
    date: string;
    timeSlot: string;
  }
): Promise<NotifyResult> {
  const contact = await resolveUserContact(userId);

  return sendWithCascade(
    { ...contact, contactEmail: booking.contactEmail },
    // LINE — send both for cancellations (important!)
    contact.lineUserId
      ? () =>
          lineWeatherCancellation(contact.lineUserId!, {
            contactName: booking.contactName,
            date: booking.date,
            timeSlot: booking.timeSlot,
          })
      : null,
    // Email
    booking.contactEmail
      ? () => {
          const { subject, html } = weatherCancellationEmail(booking);
          return sendEmail({ to: booking.contactEmail!, subject, html });
        }
      : null
  );
}

/**
 * Notify user with post-ride thank you + review request
 */
export async function notifyPostRide(
  userId: string,
  booking: {
    bookingId: string;
    contactName: string;
    contactEmail?: string;
  }
): Promise<NotifyResult> {
  const contact = await resolveUserContact(userId);

  return sendWithCascade(
    { ...contact, contactEmail: booking.contactEmail },
    // LINE
    contact.lineUserId
      ? () =>
          linePostRideThankYou(contact.lineUserId!, {
            contactName: booking.contactName,
            bookingId: booking.bookingId,
          })
      : null,
    // Email
    booking.contactEmail
      ? () => {
          const { subject, html } = postRideEmail(booking);
          return sendEmail({ to: booking.contactEmail!, subject, html });
        }
      : null
  );
}
