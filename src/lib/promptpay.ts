// ========================================
// PromptPay QR Code Generation
// Follows EMVCo QR Code Specification for Thailand PromptPay
// Supports: phone number, national/tax ID, bank account
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

// Format bank account for PromptPay
// KBank = 004, SCB = 014, BBL = 002, Krungthai = 006, etc.
function formatBankAccount(account: string, bankCode: string = "004"): string {
  const cleaned = account.replace(/\D/g, "");
  return bankCode + cleaned;
}

// Detect target type from the string
type TargetType = "phone" | "tax_id" | "bank_account";

function detectTargetType(target: string): TargetType {
  const cleaned = target.replace(/\D/g, "");

  // Phone numbers: 9-10 digits (Thai mobile without +66 prefix)
  if (cleaned.length <= 10 && (cleaned.startsWith("0") || cleaned.length === 9)) {
    return "phone";
  }

  // National/Tax ID: exactly 13 digits
  if (cleaned.length === 13) {
    return "tax_id";
  }

  // Bank account: typically 10-12 digits (after stripping dashes)
  return "bank_account";
}

// PromptPay Application IDs
const PROMPTPAY_AID = {
  phone: "A000000677010111",
  tax_id: "A000000677010112",
  bank_account: "A000000677010114",
} as const;

// Map bank names to codes
export const BANK_CODES: Record<string, string> = {
  kbank: "004",
  kasikorn: "004",
  scb: "014",
  bbl: "002",
  bangkok: "002",
  krungthai: "006",
  ktb: "006",
  tmb: "011",
  ttb: "011",
  krungsri: "025",
  bay: "025",
  gsb: "030",
  cimb: "022",
};

export interface PromptPayQROptions {
  /** Phone number, Tax ID (13 digits), or bank account number */
  target: string;
  /** Amount in THB (required for dynamic QR — updates per booking) */
  amount?: number;
  /** Bank code if target is a bank account (default: "004" for KBank) */
  bankCode?: string;
}

/**
 * Generate PromptPay payload string (to be encoded as QR)
 *
 * This follows the BOT (Bank of Thailand) PromptPay specification
 * which is based on EMVCo Merchant-Presented QR Code.
 *
 * Supports three proxy types:
 * - Phone number (0812345678)
 * - National/Tax ID (1234567890123)
 * - Bank account (228-1-15365-2 with bankCode "004" for KBank)
 */
export function generatePromptPayPayload(options: PromptPayQROptions): string {
  const { target, amount, bankCode = "004" } = options;

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
    case "bank_account":
      formattedTarget = formatBankAccount(target, bankCode);
      aid = PROMPTPAY_AID.bank_account;
      targetSubTag = "01"; // Sub-tag 01 for e-wallet/bank account
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
 * Generate a QR code URL using a public API
 * In production, use a library like `qrcode` for client-side generation
 */
export function getPromptPayQRUrl(
  payload: string,
  size: number = 300
): string {
  return `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(payload)}&choe=UTF-8`;
}
