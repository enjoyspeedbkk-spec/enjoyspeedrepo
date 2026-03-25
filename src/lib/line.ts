// ========================================
// LINE Messaging API helpers
// Used by server actions to send push notifications
// ========================================

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

interface LineMessage {
  type: "text" | "flex";
  text?: string;
  altText?: string;
  contents?: unknown;
}

/**
 * Send a push message to a LINE user
 */
export async function linePush(lineUserId: string, messages: LineMessage[]) {
  if (!CHANNEL_ACCESS_TOKEN || !lineUserId) {
    throw new Error("LINE push: missing token or userId");
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: lineUserId, messages }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("LINE push failed:", errorText);
    // Detect blocked user — LINE returns 400 with specific error
    if (errorText.includes("blocked") || res.status === 403) {
      throw new Error("LINE_USER_BLOCKED");
    }
    throw new Error(`LINE push failed: ${res.status} ${errorText}`);
  }
}

/**
 * Send a booking confirmation via LINE
 */
export async function sendBookingConfirmation(
  lineUserId: string,
  booking: {
    bookingId: string;
    contactName: string;
    date: string;
    timeSlot: string;
    groupType: string;
    riderCount: number;
    amount: number;
  }
) {
  await linePush(lineUserId, [
    {
      type: "text",
      text: `✅ Booking Confirmed!\n\nHi ${booking.contactName}!\n\n📅 ${booking.date}\n🕐 ${booking.timeSlot}\n👥 ${booking.groupType} (${booking.riderCount} riders)\n💰 ${booking.amount.toLocaleString()} THB\n\nBooking #${booking.bookingId.slice(0, 8).toUpperCase()}\n\n📋 What to bring:\n• Sport shoes (closed-toe)\n• Athletic socks & top\n• Sunscreen + sunglasses\n• Water bottle\n\n🎁 We'll have your Starter Kit ready!\n\nSee your booking: https://enjoyspeedbkk.com/bookings`,
    },
  ]);
}

/**
 * Send a pre-ride reminder (24 hours before)
 */
export async function sendPreRideReminder(
  lineUserId: string,
  booking: {
    contactName: string;
    date: string;
    timeSlot: string;
    meetingPoint: string;
  }
) {
  await linePush(lineUserId, [
    {
      type: "text",
      text: `🚴 Ride Tomorrow!\n\nHi ${booking.contactName}, your ride is tomorrow!\n\n📅 ${booking.date}\n🕐 ${booking.timeSlot}\n📍 ${booking.meetingPoint}\n\n✅ Ready-to-Ride Checklist:\n☐ Sport shoes (closed-toe)\n☐ Athletic socks\n☐ Breathable athletic top\n☐ Sunscreen + sunglasses\n☐ Water bottle\n\nWe'll have your helmet & Starter Kit ready.\n\nSee you there! 🌅`,
    },
  ]);
}

/**
 * Send a weather alert (heads-up — ride still on, but rain possible/likely)
 */
export async function sendWeatherAlert(
  lineUserId: string,
  booking: {
    contactName: string;
    date: string;
    timeSlot: string;
    severity: "watch" | "warning";
    weatherMessage: string;
  }
) {
  const isWarning = booking.severity === "warning";
  const emoji = isWarning ? "⚠️" : "🌤️";
  const status = isWarning
    ? "We're monitoring closely. If it worsens, we'll reach out about rescheduling."
    : "Your ride is still on! We'll update you if conditions change.";

  await linePush(lineUserId, [
    {
      type: "text",
      text: `${emoji} Weather Update\n\nHi ${booking.contactName},\n\nHeads-up about your ride on ${booking.date} (${booking.timeSlot}):\n\n${booking.weatherMessage}\n\n${status}\n\n📋 View booking: https://enjoyspeedbkk.com/bookings`,
    },
  ]);
}

/**
 * Send a weather cancellation notice
 */
export async function sendWeatherCancellation(
  lineUserId: string,
  booking: {
    contactName: string;
    date: string;
    timeSlot: string;
  }
) {
  await linePush(lineUserId, [
    {
      type: "text",
      text: `🌧️ Weather Update\n\nHi ${booking.contactName},\n\nDue to weather conditions, your ride on ${booking.date} (${booking.timeSlot}) has been cancelled for safety.\n\n📋 Your options:\n• Reschedule to another date (free)\n• Rain credit (valid 90 days)\n• Refund per our rain policy\n\nReply here or visit:\nhttps://enjoyspeedbkk.com/bookings\n\nSorry for the inconvenience! 🙏`,
    },
  ]);
}

/**
 * Send a post-ride thank you with review link
 */
export async function sendPostRideThankYou(
  lineUserId: string,
  booking: {
    contactName: string;
    bookingId: string;
  }
) {
  await linePush(lineUserId, [
    {
      type: "text",
      text: `🎉 Great Ride!\n\nThanks for riding with En-Joy Speed, ${booking.contactName}!\n\nWe'd love to hear how it went:\n👉 https://enjoyspeedbkk.com/bookings\n\nLeave a quick review — it helps us improve and helps other riders discover us.\n\nSee you on the next ride! 🚴‍♂️`,
    },
  ]);
}

/**
 * Send a payment issue notice with re-payment link
 */
export async function sendPaymentIssueNotice(
  lineUserId: string,
  booking: {
    contactName: string;
    bookingId: string;
    date: string;
    timeSlot: string;
    amount: number;
  }
) {
  await linePush(lineUserId, [
    {
      type: "text",
      text: `⚠️ Payment Issue\n\nHi ${booking.contactName},\n\nWe couldn't verify your payment for your En-Joy Speed booking.\n\n📅 ${booking.date} • ${booking.timeSlot}\nBooking #${booking.bookingId.slice(0, 8).toUpperCase()}\n💰 ฿${booking.amount.toLocaleString()}\n\nYour booking is still reserved! Please re-submit your payment:\n👉 https://www.enjoyspeedbkk.com/bookings/${booking.bookingId}/pay\n\nNeed help? Reply here or message us on LINE. We're here to assist! 🙏`,
    },
  ]);
}
