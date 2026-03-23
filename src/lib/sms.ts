/**
 * SMS Provider Abstraction for En-Joy Speed
 *
 * Supports multiple Thai SMS providers. Set SMS_PROVIDER env var to switch.
 *
 * Providers:
 * - "console"       — Logs OTP to console (development/MVP)
 * - "twilio"        — Twilio (international, ~2 THB/SMS)
 * - "thaibulksms"   — ThaiBulkSMS (Thai local, ~0.25 THB/SMS)
 *
 * Required env vars per provider:
 *
 * Twilio:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *
 * ThaiBulkSMS:
 *   THAIBULKSMS_USERNAME, THAIBULKSMS_PASSWORD, THAIBULKSMS_SENDER
 */

type SMSProvider = "console" | "twilio" | "thaibulksms";

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const provider: SMSProvider =
  (process.env.SMS_PROVIDER as SMSProvider) || "console";

/**
 * Convert a phone number to international format (+66...).
 * Handles Thai local (0XX), plain 66XX, and already-formatted +66XX.
 */
function toInternational(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) return `+66${clean.slice(1)}`;
  if (clean.startsWith("66")) return `+${clean}`;
  return `+${clean}`;
}

/**
 * Send an SMS message to a Thai phone number.
 *
 * Phone number should be in local format (0XXXXXXXXX).
 * Automatically converts to international format (+66XXXXXXXXX) for providers that need it.
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<SMSResult> {
  const cleanPhone = phone.replace(/\D/g, "");
  const internationalPhone = toInternational(cleanPhone);

  switch (provider) {
    case "twilio":
      return sendViaTwilio(internationalPhone, message);
    case "thaibulksms":
      return sendViaThaiBulkSMS(cleanPhone, message);
    case "console":
    default:
      return sendViaConsole(cleanPhone, message);
  }
}

/**
 * Console provider — logs SMS to server console.
 * Used for development and early MVP testing.
 * Admin can see codes in Vercel function logs.
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
 * More expensive (~2 THB/SMS) but extremely reliable.
 * Good for mixed international + Thai audience.
 *
 * Supports two modes:
 * - Messaging Service (recommended): set TWILIO_MESSAGING_SERVICE_SID
 *   Twilio auto-selects the best sender number from your pool.
 * - Direct number: set TWILIO_PHONE_NUMBER
 *
 * Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 * Plus one of: TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER
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
    console.error("Twilio credentials not configured (need TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN)");
    return { success: false, error: "SMS provider not configured" };
  }

  if (!messagingServiceSid && !fromNumber) {
    console.error("Twilio sender not configured (need TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER)");
    return { success: false, error: "SMS sender not configured" };
  }

  try {
    // Build params — use Messaging Service if available, otherwise direct number
    const params: Record<string, string> = {
      To: phone,
      Body: message,
    };

    if (messagingServiceSid) {
      params.MessagingServiceSid = messagingServiceSid;
    } else {
      params.From = fromNumber!;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
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

    console.log(`[SMS] Twilio sent to ${phone} — SID: ${data.sid}`);
    return { success: true, messageId: data.sid };
  } catch (err) {
    console.error("Twilio send error:", err);
    return { success: false, error: "Failed to send SMS" };
  }
}

/**
 * ThaiBulkSMS provider — Thai local SMS service.
 * Much cheaper (~0.25 THB/SMS), Thai-specific.
 * Best for production with Thai-only audience.
 *
 * Setup:
 * 1. Register at thaibulksms.com
 * 2. Get username, password
 * 3. Register a sender name (e.g., "EnjoySpeed")
 * 4. Set env vars: THAIBULKSMS_USERNAME, THAIBULKSMS_PASSWORD, THAIBULKSMS_SENDER
 *
 * API docs: https://www.thaibulksms.com/sms-api-spec
 */
async function sendViaThaiBulkSMS(
  phone: string,
  message: string
): Promise<SMSResult> {
  const username = process.env.THAIBULKSMS_USERNAME;
  const password = process.env.THAIBULKSMS_PASSWORD;
  const sender = process.env.THAIBULKSMS_SENDER || "EnjoySpeed";

  if (!username || !password) {
    console.error("ThaiBulkSMS credentials not configured");
    return { success: false, error: "SMS provider not configured" };
  }

  try {
    const response = await fetch("https://api-v2.thaibulksms.com/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      },
      body: JSON.stringify({
        msisdn: phone,
        message,
        sender,
        force: "corporate", // Use corporate route for OTP reliability
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status?.code !== "1000") {
      console.error("ThaiBulkSMS error:", data);
      return {
        success: false,
        error: data.status?.description || "Failed to send SMS",
      };
    }

    return { success: true, messageId: data.id || `tbs-${Date.now()}` };
  } catch (err) {
    console.error("ThaiBulkSMS send error:", err);
    return { success: false, error: "Failed to send SMS" };
  }
}

/**
 * Format an OTP message for En-Joy Speed.
 */
export function formatOtpMessage(code: string): string {
  return `Your En-Joy Speed verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
}
