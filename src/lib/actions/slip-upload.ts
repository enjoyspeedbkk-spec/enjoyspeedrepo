"use server";

import { createAdminClient } from "@/lib/supabase/admin";

interface UploadResult {
  success: boolean;
  slipUrl?: string;
  error?: string;
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

    // 6. Update the payment record
    const { error: updateError } = await admin
      .from("payments")
      .update({
        slip_url: slipUrl,
        slip_uploaded_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId);

    if (updateError) {
      console.error("Payment update error:", updateError);
      // Non-fatal — file is uploaded, admin can still see it
    }

    // 7. Update booking status to indicate slip was uploaded
    await admin
      .from("bookings")
      .update({ status: "pending" }) // Keep as pending until admin verifies
      .eq("id", bookingId);

    console.log(`📎 Payment slip uploaded for booking ${bookingId}: ${slipUrl}`);

    return { success: true, slipUrl };
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
