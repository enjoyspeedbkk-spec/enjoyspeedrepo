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
    locale?: "en" | "th";
  }
) {
  const isTh = booking.locale === "th";

  await linePush(lineUserId, [
    {
      type: "text",
      text: `${isTh ? "✅ การจองยืนยันแล้ว!" : "✅ Booking Confirmed!"}\n\n${isTh ? "สวัสดี" : "Hi"} ${booking.contactName}!\n\n📅 ${booking.date}\n🕐 ${booking.timeSlot}\n👥 ${booking.groupType} (${booking.riderCount} ${isTh ? "ผู้ปั่น" : "riders"})\n💰 ${booking.amount.toLocaleString()} THB\n\n${isTh ? "การจอง" : "Booking"} #${booking.bookingId.slice(0, 8).toUpperCase()}\n\n📋 ${isTh ? "สิ่งที่ต้องนำมา:" : "What to bring:"}\n• ${isTh ? "รองเท้าสปอร์ต (ปิดปลาย)" : "Sport shoes (closed-toe)"}\n• ${isTh ? "ถุงเท้า & เสื้อกีฬา" : "Athletic socks & top"}\n• ${isTh ? "ครีมกันแดด + แว่นกันแดด" : "Sunscreen + sunglasses"}\n• ${isTh ? "กระติกน้ำ" : "Water bottle"}\n\n🎁 ${isTh ? "เราจะเตรียมPro-packให้พร้อม!" : "We'll have your Pro-pack ready!"}\n\n${isTh ? "ดูการจองของคุณ" : "See your booking"}: https://enjoyspeedbkk.com/bookings`,
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
    locale?: "en" | "th";
  }
) {
  const isTh = booking.locale === "th";

  await linePush(lineUserId, [
    {
      type: "text",
      text: `🚴 ${isTh ? "การปั่นพรุ่งนี้!" : "Ride Tomorrow!"}\n\n${isTh ? "สวัสดี" : "Hi"} ${booking.contactName}, ${isTh ? "การปั่นของคุณคือพรุ่งนี้!" : "your ride is tomorrow!"}\n\n📅 ${booking.date}\n🕐 ${booking.timeSlot}\n📍 ${booking.meetingPoint}\n\n✅ ${isTh ? "เช็คลิสต์ก่อนปั่น:" : "Ready-to-Ride Checklist:"}\n☐ ${isTh ? "รองเท้าสปอร์ต (ปิดปลาย)" : "Sport shoes (closed-toe)"}\n☐ ${isTh ? "ถุงเท้ากีฬา" : "Athletic socks"}\n☐ ${isTh ? "เสื้อกีฬาระบายอากาศ" : "Breathable athletic top"}\n☐ ${isTh ? "ครีมกันแดด + แว่นกันแดด" : "Sunscreen + sunglasses"}\n☐ ${isTh ? "กระติกน้ำ" : "Water bottle"}\n\n${isTh ? "เราจะเตรียมหมวก & Pro-packให้พร้อม" : "We'll have your helmet & Pro-pack ready."}\n\n${isTh ? "พบกันที่นั่น! 🌅" : "See you there! 🌅"}`,
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
    locale?: "en" | "th";
  }
) {
  const isTh = booking.locale === "th";
  const isWarning = booking.severity === "warning";
  const emoji = isWarning ? "⚠️" : "🌤️";
  const status = isWarning
    ? isTh ? "เรากำลังตรวจสอบอย่างใกล้ชิด หากเลวร้ายลง เราจะติดต่อคุณเกี่ยวกับการเลื่อนการปั่น" : "We're monitoring closely. If it worsens, we'll reach out about rescheduling."
    : isTh ? "การปั่นของคุณยังคงดำเนินการ! เราจะแจ้งให้คุณทราบหากมีการเปลี่ยนแปลง" : "Your ride is still on! We'll update you if conditions change.";

  await linePush(lineUserId, [
    {
      type: "text",
      text: `${emoji} ${isTh ? "อัปเดตสภาพอากาศ" : "Weather Update"}\n\n${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},\n\n${isTh ? "แจ้งเตือนเกี่ยวกับการปั่นของคุณเมื่อ" : "Heads-up about your ride on"} ${booking.date} (${booking.timeSlot}):\n\n${booking.weatherMessage}\n\n${status}\n\n📋 ${isTh ? "ดูการจอง" : "View booking"}: https://enjoyspeedbkk.com/bookings`,
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
    locale?: "en" | "th";
  }
) {
  const isTh = booking.locale === "th";

  await linePush(lineUserId, [
    {
      type: "text",
      text: `🌧️ ${isTh ? "อัปเดตสภาพอากาศ" : "Weather Update"}\n\n${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},\n\n${isTh ? "เนื่องจากสภาพอากาศ การปั่นของคุณเมื่อ" : "Due to weather conditions, your ride on"} ${booking.date} (${booking.timeSlot}) ${isTh ? "ถูกยกเลิกเพื่อความปลอดภัย" : "has been cancelled for safety."}\n\n📋 ${isTh ? "ตัวเลือกของคุณ:" : "Your options:"}\n• ${isTh ? "เลื่อนไปวันอื่น (ฟรี)" : "Reschedule to another date (free)"}\n• ${isTh ? "เครดิตฝน (ใช้ได้ 90 วัน)" : "Rain credit (valid 90 days)"}\n• ${isTh ? "คืนเงินตามนโยบายฝน" : "Refund per our rain policy"}\n\n${isTh ? "ตอบกลับที่นี่หรือเยี่ยมชม:" : "Reply here or visit:"}\nhttps://enjoyspeedbkk.com/bookings\n\n${isTh ? "ขออภัยสำหรับความไม่สะดวก! 🙏" : "Sorry for the inconvenience! 🙏"}`,
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
    locale?: "en" | "th";
  }
) {
  const isTh = booking.locale === "th";

  const surveyUrl = `https://enjoyspeedbkk.com/survey?booking=${booking.bookingId}&name=${encodeURIComponent(booking.contactName)}`;

  await linePush(lineUserId, [
    {
      type: "text",
      text: `🎉 ${isTh ? "ปั่นสนุกมาก!" : "Great Ride!"}\n\n${isTh ? "ขอบคุณที่ปั่นกับ En-Joy Speed" : "Thanks for riding with En-Joy Speed"}, ${booking.contactName}!\n\n${isTh ? "เราอยากรู้ว่ามันเป็นอย่างไร:" : "We'd love to hear how it went:"}\n👉 ${surveyUrl}\n\n${isTh ? "ให้คะแนนอย่างรวดเร็ว — ช่วยเราปรับปรุงและช่วยผู้ปั่นคนอื่นค้นพบเรา" : "Leave a quick review — it helps us improve and helps other riders discover us."}\n\n${isTh ? "พบกันในการปั่นครั้งต่อไป! 🚴‍♂️" : "See you on the next ride! 🚴‍♂️"}`,
    },
  ]);
}

// ── Admin Notifications ────────────────────────────────

const ADMIN_LINE_USER_ID = process.env.ADMIN_LINE_USER_ID || "";

/**
 * Notify the admin via LINE when a new booking is created.
 * Fires immediately — gives admin a heads-up that payment is pending.
 */
export async function notifyAdminNewBooking(booking: {
  bookingId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  date: string;
  timeSlot: string;
  groupType: string;
  riderCount: number;
  rideTotal: number;
  totalPrice: number;
}) {
  if (!ADMIN_LINE_USER_ID) {
    console.warn("[AdminNotify] ADMIN_LINE_USER_ID not set — skipping");
    return;
  }

  const shortId = booking.bookingId.slice(0, 8).toUpperCase();

  await linePush(ADMIN_LINE_USER_ID, [
    {
      type: "text",
      text: `🆕 New Booking!\n\n👤 ${booking.contactName}\n📧 ${booking.contactEmail}${booking.contactPhone ? `\n📱 ${booking.contactPhone}` : ""}\n\n📅 ${booking.date}\n🕐 ${booking.timeSlot}\n👥 ${booking.groupType} × ${booking.riderCount}\n💰 ฿${booking.rideTotal.toLocaleString()} ride + ฿${(booking.totalPrice - booking.rideTotal).toLocaleString()} rental\n\n🔖 #${shortId}\n⏳ Payment pending — slip not yet uploaded.\n\n🔗 https://enjoyspeedbkk.com/admin/bookings`,
    },
  ]);
}

/**
 * Notify the admin when a payment slip is uploaded (or auto-verified).
 */
export async function notifyAdminSlipUploaded(booking: {
  bookingId: string;
  contactName: string;
  amount: number;
  slipUploaded: boolean;
  autoVerified: boolean;
}) {
  if (!ADMIN_LINE_USER_ID) return;

  const shortId = booking.bookingId.slice(0, 8).toUpperCase();
  const status = booking.autoVerified
    ? "✅ Auto-verified via EasySlip"
    : booking.slipUploaded
      ? "📎 Slip uploaded — needs manual review"
      : "⚠️ No slip uploaded";

  await linePush(ADMIN_LINE_USER_ID, [
    {
      type: "text",
      text: `💳 Payment Update\n\n👤 ${booking.contactName}\n🔖 #${shortId}\n💰 ฿${booking.amount.toLocaleString()}\n\n${status}\n\n🔗 https://enjoyspeedbkk.com/admin/payments`,
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
    locale?: "en" | "th";
  }
) {
  const isTh = booking.locale === "th";

  await linePush(lineUserId, [
    {
      type: "text",
      text: `⚠️ ${isTh ? "ปัญหาการชำระเงิน" : "Payment Issue"}\n\n${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},\n\n${isTh ? "เราไม่สามารถตรวจสอบการชำระเงินของคุณสำหรับการจอง En-Joy Speed ของคุณ" : "We couldn't verify your payment for your En-Joy Speed booking."}\n\n📅 ${booking.date} • ${booking.timeSlot}\n${isTh ? "การจอง" : "Booking"} #${booking.bookingId.slice(0, 8).toUpperCase()}\n💰 ฿${booking.amount.toLocaleString()}\n\n${isTh ? "การจองของคุณยังคงสงวนไว้! กรุณาส่งการชำระเงินของคุณใหม่:" : "Your booking is still reserved! Please re-submit your payment:"}\n👉 https://www.enjoyspeedbkk.com/bookings/${booking.bookingId}/pay\n\n${isTh ? "ต้องการความช่วยเหลือ? ตอบกลับที่นี่หรือส่งข้อความหาเราบน LINE เราพร้อมที่จะช่วยเหลือ! 🙏" : "Need help? Reply here or message us on LINE. We're here to assist! 🙏"}`,
    },
  ]);
}
