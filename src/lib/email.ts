// ========================================
// Email Service — Brevo (formerly Sendinblue) integration
// Handles all transactional emails
// Free tier: 300 emails/day, ~9,000/month
// ========================================

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@enjoyspeedbkk.com";
const FROM_NAME = "En-Joy Speed";

// Clickable LINE link for email templates (extracted to avoid colon issues in template ternaries)
const LINE_LINK = `<a href="https://line.me/R/ti/p/@enjoyspeed" style="color: #06C755; text-decoration: underline;">@enjoyspeed</a>`;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email via Brevo API
 * Falls back gracefully if API key is not set (dev/staging)
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.log("[EMAIL] Skipping — no BREVO_API_KEY set");
    console.log(`[EMAIL] Would send to: ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    return false;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        replyTo: { email: options.replyTo || "enjoyspeed.bkk@gmail.com" },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("[EMAIL] Send failed:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[EMAIL] Error:", error);
    return false;
  }
}

// ========================================
// Email Templates
// ========================================

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF8F5; color: #1A1A1A; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .card { background: white; border-radius: 16px; padding: 32px; border: 1px solid #E8E0D8; }
    .logo { font-weight: 800; font-size: 20px; letter-spacing: -0.02em; }
    .logo span { color: #E85D3A; }
    .divider { height: 1px; background: #E8E0D8; margin: 24px 0; }
    .btn { display: inline-block; padding: 14px 28px; background: #1A1A1A; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; }
    .muted { color: #8A8076; font-size: 13px; }
    .highlight { background: #FFF5F2; border: 1px solid #FFDDD4; border-radius: 12px; padding: 16px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F5F0EB; font-size: 14px; }
    .detail-label { color: #8A8076; }
    .detail-value { font-weight: 600; }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
    h2 { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    p { line-height: 1.6; margin: 0 0 16px; font-size: 14px; }
    .footer { text-align: center; padding-top: 32px; }
    .footer p { color: #B0A89E; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center; margin-bottom: 24px;">
      <div class="logo">En-Joy <span>Speed</span></div>
      <p class="muted" style="margin-top: 4px;">Premium Guided Cycling · Skylane, Bangkok</p>
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>En-Joy Speed · Skylane (Happy and Healthy Bike Lane), Suvarnabhumi</p>
      <p>LINE: ${LINE_LINK} · enjoyspeed.bkk@gmail.com</p>
    </div>
  </div>
</body>
</html>
`;

// ========================================
// Booking Confirmation Email
// ========================================
export function bookingConfirmationEmail(
  booking: {
    contactName: string;
    bookingId: string;
    date: string;
    timeSlot: string;
    timeRange: string;
    groupType: string;
    riderCount: number;
    rideTotal: number;
    rentalTotal: number;
    totalPrice: number;
  },
  locale?: "en" | "th"
) {
  const isTh = locale === "th";

  const content = `
    <h1>${isTh ? "การจองยืนยันแล้ว! ✅" : "Booking Confirmed! ✅"}</h1>
    <p>${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},</p>
    <p>${isTh ? "เซสชันปั่นจักรยาน En-Joy Speed ของคุณยืนยันแล้ว รายละเอียดดังนี้:" : "Your En-Joy Speed cycling session is confirmed. Here are the details:"}</p>

    <div class="divider"></div>

    <table style="width: 100%; border-collapse: collapse;">
      <tr><td class="muted" style="padding: 8px 0;">${isTh ? "รหัสจอง" : "Booking ID"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">#${booking.bookingId.slice(0, 8).toUpperCase()}</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">${isTh ? "วันที่" : "Date"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.date}</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">${isTh ? "เวลา" : "Time"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.timeSlot} (${booking.timeRange})</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">${isTh ? "แพ็กเกจ" : "Package"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.groupType}</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">${isTh ? "ผู้ปั่น" : "Riders"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.riderCount}</td></tr>
      <tr style="border-top: 1px solid #E8E0D8;"><td class="muted" style="padding: 8px 0;">${isTh ? "ค่าปั่นรวม" : "Ride Total"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">฿${booking.rideTotal.toLocaleString()}</td></tr>
      ${booking.rentalTotal > 0 ? `<tr><td class="muted" style="padding: 8px 0;">${isTh ? "ค่าเช่าจักรยาน (จ่ายที่แทร็ก)" : "Bike Rental (at track)"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">฿${booking.rentalTotal.toLocaleString()}</td></tr>` : ""}
    </table>

    <div class="divider"></div>

    <div class="highlight">
      <h2>🎁 ${isTh ? "Pro-packของคุณ" : "Your En-Joy Speed Pro-pack"}</h2>
      <p class="muted" style="margin-bottom: 0;">${isTh ? "ผู้ปั่นทุกคนจะได้รับ: กางเกงรองปั่นเจลเบาะ เจลพลังงาน และถุงตาข่ายรีไซเคิล เป็นของคุณเพื่อเก็บ!" : "Every rider receives: padded cycling liner shorts, energy gel, and a reusable eco mesh bag. Yours to keep!"}</p>
    </div>

    <div class="divider"></div>

    <h2>📋 ${isTh ? "สิ่งที่ต้องนำมา" : "What to Bring"}</h2>
    <p>
      ${isTh ? "รองเท้าสปอร์ต (ปิดปลาย) · ถุงเท้ากีฬา · เสื้อระบายอากาศ · ครีมกันแดด + แว่นกันแดด · กระติกน้ำ" : "Sport shoes (closed-toe) · Athletic socks · Breathable top · Sunscreen + sunglasses · Water bottle"}
    </p>
    <p class="muted">${isTh ? "เรามีหมวกกันน็อคและจักรยานให้ (หากเช่า)" : "We provide helmets and bikes (if you're renting)."}</p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">${isTh ? "ดูการจองของฉัน" : "View My Booking"}</a>
    </div>

    <div class="divider"></div>
    <p class="muted">${isTh ? "มีคำถาม? ตอบกลับอีเมลนี้หรือส่งข้อความหาเราบน LINE (${LINE_LINK})" : "Questions? Reply to this email or message us on LINE (${LINE_LINK})."}</p>
  `;

  return {
    subject: `${isTh ? "การจองยืนยันแล้ว" : "✅ Booking Confirmed"} — ${booking.date} ${booking.timeSlot}`,
    html: emailWrapper(content),
  };
}

// ========================================
// Payment Pending Reminder
// ========================================
export function paymentPendingEmail(
  booking: {
    contactName: string;
    bookingId: string;
    amount: number;
  },
  locale?: "en" | "th"
) {
  const isTh = locale === "th";

  const content = `
    <h1>${isTh ? "ชำระเงินให้เสร็จ" : "Complete Your Payment"}</h1>
    <p>${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},</p>
    <p>${isTh ? "การจองของคุณ #" : "Your booking #"}${booking.bookingId.slice(0, 8).toUpperCase()} ${isTh ? "จองไว้แล้ว กรุณาชำระเงินจำนวน" : "is reserved. Please complete payment of"} <strong>฿${booking.amount.toLocaleString()}</strong> ${isTh ? "เพื่อยืนยันที่นั่งของคุณ" : "to confirm your spot."}</p>

    <div class="highlight">
      <p style="margin-bottom: 0;"><strong>⏰ ${isTh ? "กรุณาชำระเงินภายใน 30 นาที" : "Please pay within 30 minutes"}</strong> ${isTh ? "เพื่อรักษาการจอง หลังจากนั้นคิวอาจถูกปล่อยให้ผู้อื่น" : "to keep your booking. After that, the slot may be released for other riders."}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">${isTh ? "ชำระเงิน" : "Complete Payment"}</a>
    </div>

    <div class="divider"></div>
    <p class="muted">${isTh ? "มีปัญหา? ส่งข้อความหาเราบน LINE (${LINE_LINK}) หรือตอบกลับอีเมลนี้" : "Having trouble? Message us on LINE (${LINE_LINK}) or reply to this email."}</p>
  `;

  return {
    subject: `${isTh ? "ชำระเงิน" : "⏰ Complete Payment"} — Booking #${booking.bookingId.slice(0, 8).toUpperCase()}`,
    html: emailWrapper(content),
  };
}

// ========================================
// Pre-Ride Reminder (24 hours before)
// ========================================
export function preRideReminderEmail(
  booking: {
    contactName: string;
    date: string;
    timeSlot: string;
    timeRange: string;
    meetingPoint: string;
  },
  locale?: "en" | "th"
) {
  const isTh = locale === "th";

  const content = `
    <h1>${isTh ? "การปั่นของคุณคือพรุ่งนี้! 🚴" : "Your Ride is Tomorrow! 🚴"}</h1>
    <p>${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},</p>
    <p>${isTh ? "แจ้งเตือน — เซสชันปั่นจักรยาน En-Joy Speed ของคุณคือพรุ่งนี้" : "Just a reminder — your En-Joy Speed cycling session is"} <strong>${isTh ? "พรุ่งนี้" : "tomorrow"}</strong>.</p>

    <table style="width: 100%; border-collapse: collapse;">
      <tr><td class="muted" style="padding: 8px 0;">${isTh ? "วันที่" : "Date"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.date}</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">${isTh ? "เวลา" : "Time"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.timeSlot} (${booking.timeRange})</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">${isTh ? "จุดนัดพบ" : "Meet at"}</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.meetingPoint}</td></tr>
    </table>

    <div class="divider"></div>

    <h2>✅ ${isTh ? "เช็คลิสต์ก่อนปั่น" : "Ready-to-Ride Checklist"}</h2>
    <p>
      ☐ ${isTh ? "รองเท้าสปอร์ต (ปิดปลายบังคับ)" : "Sport shoes (closed-toe mandatory)"}<br>
      ☐ ${isTh ? "ถุงเท้ากีฬา" : "Athletic socks"}<br>
      ☐ ${isTh ? "เสื้อกีฬาระบายอากาศ" : "Breathable athletic top"}<br>
      ☐ ${isTh ? "ป้องกันแสงแดด (ครีมกันแดด + แว่น)" : "Sun protection (sunscreen + sunglasses)"}<br>
      ☐ ${isTh ? "กระติกน้ำ" : "Water bottle"}<br>
    </p>
    <p class="muted">${isTh ? "เราจะเตรียมหมวก จักรยาน และPro-packให้พร้อม" : "We'll have your helmet, bike, and Pro-pack ready when you arrive."}</p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">${isTh ? "ดูรายละเอียดการปั่น" : "View Ride Details"}</a>
    </div>

    <div class="divider"></div>
    <p class="muted">${isTh ? "สภาพอากาศไม่แน่นอน? เราจะแจ้งคุณหากมีเปลี่ยนแปลง ตรวจสอบ LINE (${LINE_LINK}) เพื่อรับการอัปเดตแบบเรียลไทม์" : "Weather looking uncertain? We'll notify you if there are any changes. Check LINE (${LINE_LINK}) for real-time updates."}</p>
  `;

  return {
    subject: `${isTh ? "ปั่นพรุ่งนี้" : "🚴 Ride Tomorrow"} — ${booking.timeSlot} at Skylane`,
    html: emailWrapper(content),
  };
}

// ========================================
// Post-Ride Thank You + Review Request
// ========================================
export function postRideEmail(
  booking: {
    contactName: string;
    bookingId: string;
  },
  locale?: "en" | "th"
) {
  const isTh = locale === "th";

  const content = `
    <h1>${isTh ? "ปั่นสนุกมาก! 🎉" : "Great Ride! 🎉"}</h1>
    <p>${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},</p>
    <p>${isTh ? "ขอบคุณที่ปั่นกับ En-Joy Speed! หวังว่าคุณจะสนุกบน Skylane" : "Thanks for riding with En-Joy Speed! We hope you had an amazing time on the Skylane"}</p>

    <div class="highlight">
      <h2>📝 ${isTh ? "แบบสอบถามสั้นๆ" : "Quick Feedback"}</h2>
      <p style="margin-bottom: 0;">${isTh ? "ช่วยเราปรับปรุง และช่วยผู้ปั่นคนอื่นค้นพบ En-Joy Speed ใช้เวลาน้อยกว่าหนึ่งนาที" : "Help us improve and help future riders discover En-Joy Speed. It takes less than a minute!"}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/survey?booking=${booking.bookingId}&name=${encodeURIComponent(booking.contactName)}" class="btn">${isTh ? "ให้คะแนน" : "Leave a Review"}</a>
    </div>

    <div class="divider"></div>

    <h2>🚴 ${isTh ? "พร้อมสำหรับการปั่นครั้งต่อไป?" : "Ready for Your Next Ride?"}</h2>
    <p>${isTh ? "จองเซสชันถัดไปและพาเพื่อมมา! Skylane จะดียิ่งขึ้นในครั้งที่สอง" : "Book your next session and bring a friend! The Skylane is even better the second time."}</p>

    <div style="text-align: center; margin-top: 16px;">
      <a href="https://enjoyspeedbkk.com/booking" style="color: #E85D3A; font-weight: 600; text-decoration: none;">${isTh ? "จองการปั่นอีกครั้ง →" : "Book Another Ride →"}</a>
    </div>

    <div class="divider"></div>
    <p class="muted">${isTh ? "พบกันในการปั่นครั้งต่อไป! 🌅" : "See you on the next ride! 🌅"}</p>
  `;

  return {
    subject: `${isTh ? "ขอบคุณที่ปั่นกับ En-Joy Speed!" : "🎉 Thanks for Riding with En-Joy Speed!"}`,
    html: emailWrapper(content),
  };
}

// ========================================
// Weather Alert (heads-up — ride still on, but rain possible/likely)
// ========================================
export function weatherAlertEmail(
  booking: {
    contactName: string;
    date: string;
    timeSlot: string;
    severity: "watch" | "warning";
    weatherMessage: string;
  },
  locale?: "en" | "th"
) {
  const isTh = locale === "th";
  const isWarning = booking.severity === "warning";

  const content = `
    <h1>${isWarning ? (isTh ? "⚠️ คำเตือนเกี่ยวกับสภาพอากาศ" : "⚠️ Weather Warning") : (isTh ? "🌤️ แจ้งเตือนสภาพอากาศ" : "🌤️ Weather Heads-Up")}</h1>
    <p>${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},</p>
    <p>${isTh ? "การอัปเดตด่วนเกี่ยวกับการปั่นของคุณเมื่อ" : "Quick update about your ride on"} <strong>${booking.date}</strong> (${booking.timeSlot}):</p>

    <div class="highlight">
      <p>${booking.weatherMessage}</p>
      ${isWarning
        ? `<p class="muted" style="margin-bottom: 0;">${isTh ? "เรากำลังตรวจสอบสภาพอากาศอย่างใกล้ชิด หากเลวร้ายลง เราจะติดต่อคุณเกี่ยวกับตัวเลือกการเลื่อนการปั่น" : "We're monitoring conditions closely. If things worsen, we'll reach out about rescheduling options."}</p>`
        : `<p class="muted" style="margin-bottom: 0;">${isTh ? "การปั่นของคุณยังคงดำเนินการ! เราจะแจ้งให้คุณทราบหากมีการเปลี่ยนแปลง" : "Your ride is still on! We'll update you if conditions change."}</p>`
      }
    </div>

    ${isWarning ? `
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">${isTh ? "ดูการจอง" : "View Booking"}</a>
    </div>
    ` : ""}

    <div class="divider"></div>
    <p class="muted">${isTh ? "ความปลอดภัยเป็นลำดับแรกของเรา เราตรวจสอบการพยากรณ์สภาพอากาศรายวันสำหรับการปั่นที่จะมาถึง" : "Safety is our top priority. We check weather forecasts daily for upcoming rides."}</p>
  `;

  return {
    subject: `${isWarning ? "⚠️" : "🌤️"} ${isTh ? "อัปเดตสภาพอากาศ" : "Weather Update"} — ${booking.date}`,
    html: emailWrapper(content),
  };
}

// ========================================
// Weather Cancellation
// ========================================
export function weatherCancellationEmail(
  booking: {
    contactName: string;
    date: string;
    timeSlot: string;
    bookingId: string;
  },
  locale?: "en" | "th"
) {
  const isTh = locale === "th";

  const content = `
    <h1>${isTh ? "อัปเดตสภาพอากาศ 🌧️" : "Weather Update 🌧️"}</h1>
    <p>${isTh ? "สวัสดี" : "Hi"} ${booking.contactName},</p>
    <p>${isTh ? "เนื่องจากสภาพอากาศ การปั่นของคุณเมื่อ" : "Due to weather conditions, your ride on"} <strong>${booking.date}</strong> (${booking.timeSlot}) ${isTh ? "ถูกยกเลิกเพื่อความปลอดภัย" : "has been cancelled for safety."}</p>

    <div class="highlight">
      <h2>${isTh ? "ตัวเลือกของคุณ" : "Your Options"}</h2>
      <p>
        • <strong>${isTh ? "เลื่อนไปวันอื่น" : "Reschedule"}</strong> — ${isTh ? "เลือกวันใหม่ฟรี" : "pick a new date for free"}<br>
        • <strong>${isTh ? "เครดิตฝน" : "Rain Credit"}</strong> — ${isTh ? "ใช้ได้ 90 วัน" : "valid for 90 days"}<br>
        • <strong>${isTh ? "คืนเงิน" : "Refund"}</strong> — ${isTh ? "ตามนโยบายฝนของเรา" : "per our rain policy"}
      </p>
      <p class="muted" style="margin-bottom: 0;">${isTh ? "ตอบกลับอีเมลนี้หรือส่งข้อความหาเราบน LINE เพื่อจัดเรียงตัวเลือกของคุณ" : "Reply to this email or message us on LINE to arrange your preference."}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">${isTh ? "จัดการการจอง" : "Manage Booking"}</a>
    </div>

    <div class="divider"></div>
    <p class="muted">${isTh ? "ขออภัยสำหรับความไม่สะดวก ความปลอดภัยเป็นลำดับแรกของเรา" : "We're sorry for the inconvenience. Safety is our top priority."}</p>
  `;

  return {
    subject: `🌧️ ${isTh ? "ยกเลิกการปั่น" : "Ride Cancelled"} — ${booking.date}`,
    html: emailWrapper(content),
  };
}

// ========================================
// Payment Rejection Notice
// ========================================
export function paymentRejectionEmail(booking: {
  contactName: string;
  bookingId: string;
  date: string;
  timeSlot: string;
  amount: number;
}) {
  const content = `
    <h1>Payment Issue — Action Needed</h1>
    <p>Hi ${booking.contactName},</p>
    <p>We encountered an issue verifying your payment for your En-Joy Speed booking. Don't worry — your booking is still reserved, and we'd love to help you get back on track.</p>

    <div class="highlight">
      <p style="margin-bottom: 0;"><strong>Booking #${booking.bookingId.slice(0, 8).toUpperCase()}</strong><br>
      ${booking.date} • ${booking.timeSlot}<br>
      Amount: <strong>฿${booking.amount.toLocaleString()}</strong></p>
    </div>

    <div class="divider"></div>

    <h2>What Happened?</h2>
    <p>We couldn't verify your payment, which could happen for several reasons:</p>
    <p>
      • Bank transfer details didn't match our records<br>
      • Payment reference was incomplete<br>
      • An issue with your payment slip image
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://www.enjoyspeedbkk.com/bookings/${booking.bookingId}/pay" class="btn">Re-Submit Payment</a>
    </div>

    <div class="divider"></div>

    <h2>Need Help?</h2>
    <p>Reply to this email or message us on LINE (${LINE_LINK}). We're here to help!</p>

    <div class="divider"></div>
    <p class="muted">Your booking expires if payment isn't verified within 30 minutes. Please re-submit as soon as possible.</p>
  `;

  return {
    subject: `Payment Issue — Action Needed for Your En-Joy Speed Ride`,
    html: emailWrapper(content),
  };
}
