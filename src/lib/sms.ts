/**
 * SMS Provider for En-Joy Speed
 *
 * Uses Twilio for international SMS delivery (180+ countries).
 * Essential for serving both Thai locals and foreign visitors.
 *
 * Providers:
 * - "console"  — Logs OTP to console (development)
 * - "twilio"   — Twilio international SMS (production)
 *
 * Required env vars:
 *   SMS_PROVIDER=twilio
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_MESSAGING_SERVICE_SID (preferred) or TWILIO_PHONE_NUMBER
 */

type SMSProvider = "console" | "twilio";

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const provider: SMSProvider =
  (process.env.SMS_PROVIDER as SMSProvider) || "console";

/**
 * Send an SMS message to any phone number (Thai or international).
 *
 * Accepts: +CCXXXXXXXXX, 0XXXXXXXXX (Thai local), or digits-only.
 * Automatically normalizes to international format for Twilio.
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<SMSResult> {
  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  // Normalize to international format (+CCXXXXXXXXX)
  let internationalPhone: string;
  if (cleanPhone.startsWith("+")) {
    internationalPhone = cleanPhone;
  } else if (cleanPhone.startsWith("0")) {
    // Thai local → +66
    internationalPhone = `+66${cleanPhone.slice(1)}`;
  } else if (cleanPhone.startsWith("66")) {
    internationalPhone = `+${cleanPhone}`;
  } else {
    internationalPhone = `+${cleanPhone}`;
  }

  switch (provider) {
    case "twilio":
      return sendViaTwilio(internationalPhone, message);
    case "console":
    default:
      return sendViaConsole(internationalPhone, message);
  }
}

// ========================================
// Provider implementations
// ========================================

/**
 * Console provider — logs SMS to server console.
 * Used for development and early testing.
 */
async function sendViaConsole(
  phone: string,
  message: string
): Promise<SMSResult> {
  console.log(`
╔══════════════════════════════════════════╗
║  📱 SMS to ${phone}
║  ${message}
╚══════════════════════════════════════════╝
  `);
  return { success: true, messageId: `console-${Date.now()}` };
}

/**
 * Twilio provider — international SMS service.
 * Works with 180+ countries — essential for foreign visitors to Bangkok.
 *
 * Supports two sending modes:
 * - Messaging Service SID (preferred): Twilio handles sender selection
 * - Phone number: Direct from a specific number in your account
 */
async function sendViaTwilio(
  phone: string,
  message: string
): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    console.error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    return { success: false, error: "SMS provider not configured" };
  }

  if (!messagingServiceSid && !fromNumber) {
    console.error("Twilio: need either TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER");
    return { success: false, error: "SMS provider not configured" };
  }

  try {
    const body: Record<string, string> = {
      To: phone,
      Body: message,
    };

    if (messagingServiceSid) {
      body.MessagingServiceSid = messagingServiceSid;
    } else {
      body.From = fromNumber!;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", data);
      return {
        success: false,
        error: data.message || "Failed to send SMS",
      };
    }

    console.log(`📱 Twilio SMS sent to ${phone} (sid: ${data.sid})`);
    return { success: true, messageId: data.sid };
  } catch (err) {
    console.error("Twilio send error:", err);
    return { success: false, error: "Failed to send SMS" };
  }
}

/**
 * Format an OTP message for En-Joy Speed.
 */
export function formatOtpMessage(code: string): string {
  return `Your En-Joy Speed verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
}
