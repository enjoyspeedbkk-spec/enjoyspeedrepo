// ========================================
// PromptPay QR Code Generation
// Follows EMVCo QR Code Specification for Thailand PromptPay
// Supports: phone number, national/tax ID (NOT bank accounts)
// ========================================

// CRC-16/CCITT-FALSE calculation (required by EMVCo spec)
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Format a TLV (Tag-Length-Value) field
function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

// Format Thai phone number for PromptPay
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  // Convert leading 0 to country code 66
  if (cleaned.startsWith("0")) {
    cleaned = "66" + cleaned.slice(1);
  }
  // Prepend 00 + country code prefix per spec
  return "0066" + cleaned.slice(2);
}

// Format Tax/National ID for PromptPay
function formatTaxId(taxId: string): string {
  return taxId.replace(/\D/g, "");
}

// NOTE: Bank account numbers are NOT valid PromptPay targets.
// PromptPay only supports phone numbers and 13-digit national/tax IDs.
// If a bank account is passed, we fall back to phone-style formatting,
// but the resulting QR will NOT work. The env var MUST be set to a
// PromptPay-registered phone number or national ID.

// Detect target type from the string
type TargetType = "phone" | "tax_id";

function detectTargetType(target: string): TargetType {
  const cleaned = target.replace(/\D/g, "");

  // National/Tax ID: exactly 13 digits
  if (cleaned.length === 13) {
    return "tax_id";
  }

  // Everything else treated as phone (9-12 digits typical)
  // PromptPay only supports phone + national ID. Bank accounts are NOT supported.
  return "phone";
}

// PromptPay Application IDs (Bank of Thailand / EMVCo spec)
// Only phone and national/tax ID are valid proxies.
const PROMPTPAY_AID = {
  phone: "A000000677010111",
  tax_id: "A000000677010112",
} as const;


export interface PromptPayQROptions {
  /** Phone number or Tax ID (13 digits) registered with PromptPay */
  target: string;
  /** Amount in THB (required for dynamic QR — updates per booking) */
  amount?: number;
}

/**
 * Generate PromptPay payload string (to be encoded as QR)
 *
 * This follows the BOT (Bank of Thailand) PromptPay specification
 * which is based on EMVCo Merchant-Presented QR Code.
 *
 * Supports two proxy types (per BOT spec):
 * - Phone number (0812345678)
 * - National/Tax ID (1234567890123)
 *
 * NOTE: Bank account numbers are NOT valid PromptPay proxies.
 * The env var must contain a phone or national ID registered with PromptPay.
 */
export function generatePromptPayPayload(options: PromptPayQROptions): string {
  const { target, amount } = options;

  const targetType = detectTargetType(target);

  // Format the target based on type
  let formattedTarget: string;
  let aid: string;
  let targetSubTag: string;

  switch (targetType) {
    case "phone":
      formattedTarget = formatPhoneNumber(target);
      aid = PROMPTPAY_AID.phone;
      targetSubTag = "01"; // Sub-tag 01 for phone
      break;
    case "tax_id":
      formattedTarget = formatTaxId(target);
      aid = PROMPTPAY_AID.tax_id;
      targetSubTag = "02"; // Sub-tag 02 for tax ID
      break;
  }

  // Build the Merchant Account Information (tag 29)
  const aidField = tlv("00", aid);
  const targetField = tlv(targetSubTag, formattedTarget);
  const merchantAccount = tlv("29", aidField + targetField);

  // Build the full payload
  let payload = "";
  payload += tlv("00", "01"); // Payload Format Indicator
  payload += tlv("01", amount ? "12" : "11"); // 11 = static, 12 = dynamic (with amount)
  payload += merchantAccount;
  payload += tlv("53", "764"); // Transaction Currency: THB
  payload += tlv("58", "TH"); // Country Code: Thailand

  if (amount && amount > 0) {
    payload += tlv("54", amount.toFixed(2)); // Transaction Amount
  }

  // CRC placeholder — include CRC tag+length in the calculation
  const crcInput = payload + "6304";
  const crcValue = crc16(crcInput);
  payload += "6304" + crcValue;

  return payload;
}

/**
 * Generate a QR code as a data URL (base64 PNG).
 * Uses the `qrcode` library — no external API dependency.
 */
export async function getPromptPayQRDataUrl(
  payload: string,
  size: number = 300
): Promise<string> {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 2,
    color: { dark: "#1B2A4A", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
}
