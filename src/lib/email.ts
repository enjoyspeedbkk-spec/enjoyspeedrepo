// ========================================
// Email Service — Resend integration
// Handles all transactional emails
// ========================================

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = "En-Joy Speed";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email via Resend API
 * Falls back gracefully if API key is not set (dev/staging)
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("[EMAIL] Skipping — no RESEND_API_KEY set");
    console.log(`[EMAIL] Would send to: ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo || "enjoyspeed.bkk@gmail.com",
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
      <p>LINE: @EnjoySpeed · enjoyspeed.bkk@gmail.com</p>
    </div>
  </div>
</body>
</html>
`;

// ========================================
// Booking Confirmation Email
// ========================================
export function bookingConfirmationEmail(booking: {
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
}) {
  const content = `
    <h1>Booking Confirmed! ✅</h1>
    <p>Hi ${booking.contactName},</p>
    <p>Your En-Joy Speed cycling session is confirmed. Here are the details:</p>

    <div class="divider"></div>

    <table style="width: 100%; border-collapse: collapse;">
      <tr><td class="muted" style="padding: 8px 0;">Booking ID</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">#${booking.bookingId.slice(0, 8).toUpperCase()}</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">Date</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.date}</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">Time</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.timeSlot} (${booking.timeRange})</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">Package</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.groupType}</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">Riders</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.riderCount}</td></tr>
      <tr style="border-top: 1px solid #E8E0D8;"><td class="muted" style="padding: 8px 0;">Ride Total</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">฿${booking.rideTotal.toLocaleString()}</td></tr>
      ${booking.rentalTotal > 0 ? `<tr><td class="muted" style="padding: 8px 0;">Bike Rental (at track)</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">฿${booking.rentalTotal.toLocaleString()}</td></tr>` : ""}
    </table>

    <div class="divider"></div>

    <div class="highlight">
      <h2>🎁 Your Starter Kit</h2>
      <p class="muted" style="margin-bottom: 0;">Every rider receives: padded cycling liner shorts, energy gel, and a reusable eco mesh bag. Yours to keep!</p>
    </div>

    <div class="divider"></div>

    <h2>📋 What to Bring</h2>
    <p>
      Sport shoes (closed-toe) · Athletic socks · Breathable top · Sunscreen + sunglasses · Water bottle
    </p>
    <p class="muted">We provide helmets and bikes (if you're renting).</p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">View My Booking</a>
    </div>

    <div class="divider"></div>
    <p class="muted">Questions? Reply to this email or message us on LINE (@EnjoySpeed).</p>
  `;

  return {
    subject: `✅ Booking Confirmed — ${booking.date} ${booking.timeSlot}`,
    html: emailWrapper(content),
  };
}

// ========================================
// Payment Pending Reminder
// ========================================
export function paymentPendingEmail(booking: {
  contactName: string;
  bookingId: string;
  amount: number;
}) {
  const content = `
    <h1>Complete Your Payment</h1>
    <p>Hi ${booking.contactName},</p>
    <p>Your booking #${booking.bookingId.slice(0, 8).toUpperCase()} is reserved. Please complete payment of <strong>฿${booking.amount.toLocaleString()}</strong> to confirm your spot.</p>

    <div class="highlight">
      <p style="margin-bottom: 0;"><strong>⏰ Please pay within 30 minutes</strong> to keep your booking. After that, the slot may be released for other riders.</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">Complete Payment</a>
    </div>

    <div class="divider"></div>
    <p class="muted">Having trouble? Message us on LINE (@EnjoySpeed) or reply to this email.</p>
  `;

  return {
    subject: `⏰ Complete Payment — Booking #${booking.bookingId.slice(0, 8).toUpperCase()}`,
    html: emailWrapper(content),
  };
}

// ========================================
// Pre-Ride Reminder (24 hours before)
// ========================================
export function preRideReminderEmail(booking: {
  contactName: string;
  date: string;
  timeSlot: string;
  timeRange: string;
  meetingPoint: string;
}) {
  const content = `
    <h1>Your Ride is Tomorrow! 🚴</h1>
    <p>Hi ${booking.contactName},</p>
    <p>Just a reminder — your En-Joy Speed cycling session is <strong>tomorrow</strong>.</p>

    <table style="width: 100%; border-collapse: collapse;">
      <tr><td class="muted" style="padding: 8px 0;">Date</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.date}</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">Time</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.timeSlot} (${booking.timeRange})</td></tr>
      <tr><td class="muted" style="padding: 8px 0;">Meet at</td><td style="text-align: right; font-weight: 600; padding: 8px 0;">${booking.meetingPoint}</td></tr>
    </table>

    <div class="divider"></div>

    <h2>✅ Ready-to-Ride Checklist</h2>
    <p>
      ☐ Sport shoes (closed-toe mandatory)<br>
      ☐ Athletic socks<br>
      ☐ Breathable athletic top<br>
      ☐ Sun protection (sunscreen + sunglasses)<br>
      ☐ Water bottle<br>
    </p>
    <p class="muted">We'll have your helmet, bike, and Starter Kit ready when you arrive.</p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">View Ride Details</a>
    </div>

    <div class="divider"></div>
    <p class="muted">Weather looking uncertain? We'll notify you if there are any changes. Check LINE (@EnjoySpeed) for real-time updates.</p>
  `;

  return {
    subject: `🚴 Ride Tomorrow — ${booking.timeSlot} at Skylane`,
    html: emailWrapper(content),
  };
}

// ========================================
// Post-Ride Thank You + Review Request
// ========================================
export function postRideEmail(booking: {
  contactName: string;
  bookingId: string;
}) {
  const content = `
    <h1>Great Ride! 🎉</h1>
    <p>Hi ${booking.contactName},</p>
    <p>Thanks for riding with En-Joy Speed! We hope you had an amazing time on the Skylane.</p>

    <div class="highlight">
      <h2>📝 Quick Feedback</h2>
      <p style="margin-bottom: 0;">Help us improve and help future riders discover En-Joy Speed. It takes less than a minute!</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">Leave a Review</a>
    </div>

    <div class="divider"></div>

    <h2>🚴 Ready for Your Next Ride?</h2>
    <p>Book your next session and bring a friend! The Skylane is even better the second time.</p>

    <div style="text-align: center; margin-top: 16px;">
      <a href="https://enjoyspeedbkk.com/booking" style="color: #E85D3A; font-weight: 600; text-decoration: none;">Book Another Ride →</a>
    </div>

    <div class="divider"></div>
    <p class="muted">See you on the next ride! 🌅</p>
  `;

  return {
    subject: `🎉 Thanks for Riding with En-Joy Speed!`,
    html: emailWrapper(content),
  };
}

// ========================================
// Weather Cancellation
// ========================================
export function weatherCancellationEmail(booking: {
  contactName: string;
  date: string;
  timeSlot: string;
  bookingId: string;
}) {
  const content = `
    <h1>Weather Update 🌧️</h1>
    <p>Hi ${booking.contactName},</p>
    <p>Due to weather conditions, your ride on <strong>${booking.date}</strong> (${booking.timeSlot}) has been cancelled for safety.</p>

    <div class="highlight">
      <h2>Your Options</h2>
      <p>
        • <strong>Reschedule</strong> — pick a new date for free<br>
        • <strong>Rain Credit</strong> — valid for 90 days<br>
        • <strong>Refund</strong> — per our rain policy
      </p>
      <p class="muted" style="margin-bottom: 0;">Reply to this email or message us on LINE to arrange your preference.</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://enjoyspeedbkk.com/bookings" class="btn">Manage Booking</a>
    </div>

    <div class="divider"></div>
    <p class="muted">We're sorry for the inconvenience. Safety is our top priority.</p>
  `;

  return {
    subject: `🌧️ Ride Cancelled — ${booking.date} (Weather)`,
    html: emailWrapper(content),
  };
}
