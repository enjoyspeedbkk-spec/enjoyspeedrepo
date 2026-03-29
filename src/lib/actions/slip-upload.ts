"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/actions/admin";

interface UploadResult {
  success: boolean;
  slipUrl?: string;
  error?: string;
  /** "verified" = auto-verified via slip API, "pending" = uploaded but needs manual review */
  verification?: "verified" | "pending" | "failed";
}

// ── EasySlip API integration ──────────────────────────
// Verifies Thai bank transfer slips by reading the embedded QR code.
// Sign up at https://developer.easyslip.com/ to get an API key.
// Set EASYSLIP_API_KEY in your environment variables.
const EASYSLIP_API_KEY = process.env.EASYSLIP_API_KEY || "";
const EASYSLIP_ENDPOINT = "https://developer.easyslip.com/api/v1/verify";

interface EasySlipResponse {
  status: number;
  data?: {
    transactionId?: string;
    date?: string;
    amount?: number;
    sender?: { name?: string };
    receiver?: {
      name?: string;
      phone?: string;
      bank?: string;
      accountName?: string;
    };
  };
}

/**
 * Verify a slip image against the EasySlip API.
 * Returns the parsed transaction data, or null if verification fails.
 */
async function verifySlipWithEasySlip(
  base64Image: string,
  expectedAmount: number
): Promise<{ verified: boolean; transactionId?: string; amount?: number; error?: string }> {
  if (!EASYSLIP_API_KEY) {
    console.log("[SlipVerify] No EASYSLIP_API_KEY configured — skipping auto-verification");
    return { verified: false, error: "no_api_key" };
  }

  try {
    const res = await fetch(EASYSLIP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EASYSLIP_API_KEY}`,
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!res.ok) {
      console.error("[SlipVerify] EasySlip API error:", res.status, await res.text());
      return { verified: false, error: "api_error" };
    }

    const result: EasySlipResponse = await res.json();

    if (result.status !== 200 || !result.data) {
      console.log("[SlipVerify] Slip could not be read:", result);
      return { verified: false, error: "unreadable" };
    }

    const slipAmount = result.data.amount || 0;

    // Check if amount matches (allow ±1 THB tolerance for rounding)
    if (Math.abs(slipAmount - expectedAmount) > 1) {
      console.log(`[SlipVerify] Amount mismatch: slip=${slipAmount}, expected=${expectedAmount}`);
      return {
        verified: false,
        amount: slipAmount,
        transactionId: result.data.transactionId,
        error: "amount_mismatch",
      };
    }

    console.log(`[SlipVerify] ✅ Verified: ${slipAmount} THB, txn=${result.data.transactionId}`);
    return {
      verified: true,
      amount: slipAmount,
      transactionId: result.data.transactionId,
    };
  } catch (err) {
    console.error("[SlipVerify] Request failed:", err);
    return { verified: false, error: "network_error" };
  }
}

/**
 * Upload a payment slip to Supabase Storage and update the payment record.
 *
 * We receive base64 because server actions can't receive File objects directly.
 * The file is uploaded to the 'payment-slips' bucket with the booking ID as filename.
 */
export async function uploadPaymentSlip(
  bookingId: string,
  base64Data: string,
  mimeType: string,
  originalName: string
): Promise<UploadResult> {
  try {
    const admin = createAdminClient();

    // 1. Verify the booking exists
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return { success: false, error: "Booking not found." };
    }

    // 2. Get file extension from mime type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
    };
    const ext = extMap[mimeType] || "jpg";
    const fileName = `${bookingId}.${ext}`;

    // 3. Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // 4. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("payment-slips")
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true, // Overwrite if re-uploading
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: "Failed to upload slip. Please try again." };
    }

    // 5. Get the public/signed URL
    const { data: urlData } = admin.storage
      .from("payment-slips")
      .getPublicUrl(fileName);

    const slipUrl = urlData?.publicUrl || uploadData?.path || fileName;

    // 6. Update the payment record with slip URL
    const { data: payment, error: updateError } = await admin
      .from("payments")
      .update({
        slip_url: slipUrl,
        slip_uploaded_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId)
      .select("id, amount")
      .single();

    if (updateError) {
      console.error("Payment update error:", updateError);
    }

    console.log(`📎 Payment slip uploaded for booking ${bookingId}: ${slipUrl}`);

    // 7. Try auto-verification via EasySlip API
    const expectedAmount = payment?.amount || 0;
    const slipCheck = await verifySlipWithEasySlip(base64Data, expectedAmount);

    // Store EasySlip results on the payment record (regardless of outcome)
    if (payment?.id && slipCheck.transactionId) {
      await admin
        .from("payments")
        .update({
          easyslip_txn_id: slipCheck.transactionId,
          easyslip_amount: slipCheck.amount,
          slip_qr_verified: slipCheck.verified,
        })
        .eq("id", payment.id)
        .then(() => {}, () => {}); // Non-blocking — don't fail upload
    }

    if (slipCheck.verified && payment?.id) {
      // Slip verified! Auto-confirm the payment + booking
      console.log(`✅ Auto-verifying payment for booking ${bookingId}`);
      const verifyResult = await verifyPayment(payment.id, bookingId, "easyslip_auto");

      if (verifyResult.success) {
        return { success: true, slipUrl, verification: "verified" };
      }
      // If verify action failed, fall through to pending
    }

    // Not auto-verified — keep as pending for manual admin review
    return {
      success: true,
      slipUrl,
      verification: "pending",
    };
  } catch (err) {
    console.error("Slip upload error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Get the slip URL for a booking (for admin viewing).
 */
export async function getPaymentSlipUrl(
  bookingId: string
): Promise<string | null> {
  try {
    const admin = createAdminClient();

    const { data: payment } = await admin
      .from("payments")
      .select("slip_url")
      .eq("booking_id", bookingId)
      .single();

    return payment?.slip_url || null;
  } catch {
    return null;
  }
}
