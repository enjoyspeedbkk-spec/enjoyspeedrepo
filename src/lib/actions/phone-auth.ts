"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSMS, formatOtpMessage } from "@/lib/sms";

interface OtpResult {
  success: boolean;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Generate and send OTP to a Thai phone number.
 *
 * For MVP/pilot: OTP is stored in DB and logged to console.
 * In production: integrate with Thai SMS provider (ThaiBulkSMS, SMSMKT, or Twilio).
 *
 * Supabase's built-in phone auth uses Twilio which works great but costs more.
 * For Thai market, a local SMS provider is cheaper (0.2-0.5 THB/SMS vs 2+ THB via Twilio).
 */
export async function sendPhoneOtp(
  phone: string,
  contactName?: string
): Promise<OtpResult> {
  try {
    const admin = createAdminClient();

    // Validate Thai phone number
    const cleanPhone = phone.replace(/\D/g, "");
    if (!/^0[689]\d{8}$/.test(cleanPhone)) {
      return { success: false, error: "Invalid Thai phone number" };
    }

    // Rate limit: max 3 codes per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("phone_otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("phone", cleanPhone)
      .gte("created_at", oneHourAgo);

    if ((count || 0) >= 3) {
      return {
        success: false,
        error: "Too many verification attempts. Please try again in an hour.",
      };
    }

    // Generate 6-digit code using cryptographically secure random
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const code = (100000 + (randomBytes[0] % 900000)).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    const { error: insertError } = await admin.from("phone_otp_codes").insert({
      phone: cleanPhone,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("OTP insert error:", insertError);
      return { success: false, error: "Failed to generate code. Please try again." };
    }

    // --- SMS SENDING ---
    // Uses the configured SMS_PROVIDER (default: "console" for dev/MVP)
    // Set SMS_PROVIDER=twilio or SMS_PROVIDER=thaibulksms in env for production
    const smsResult = await sendSMS(cleanPhone, formatOtpMessage(code));

    if (!smsResult.success) {
      console.error("SMS send failed:", smsResult.error);
      // Don't fail silently — if SMS fails, the code was still stored.
      // In console mode this always succeeds. In production, surface the error.
      if (process.env.SMS_PROVIDER && process.env.SMS_PROVIDER !== "console") {
        return { success: false, error: "Could not send verification code. Please try again." };
      }
    }

    console.log(`📱 OTP sent to ${cleanPhone} (${contactName || "Guest"}) via ${process.env.SMS_PROVIDER || "console"} — expires ${expiresAt.toISOString()}`);

    return { success: true };
  } catch (err) {
    console.error("Send OTP error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Verify OTP code and create/find user account.
 *
 * Flow:
 * 1. Check if OTP is valid and not expired
 * 2. Look up existing profile by phone number
 * 3. If exists: return that user
 * 4. If not: create a new Supabase auth user + profile (phone-based)
 */
export async function verifyPhoneOtp(
  phone: string,
  code: string,
  contactName?: string
): Promise<VerifyResult> {
  try {
    const admin = createAdminClient();
    const cleanPhone = phone.replace(/\D/g, "");

    // 1. Find matching unexpired, unverified OTP
    const { data: otpRecord, error: otpError } = await admin
      .from("phone_otp_codes")
      .select("*")
      .eq("phone", cleanPhone)
      .eq("code", code)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      // Check if code exists but expired
      const { data: expired } = await admin
        .from("phone_otp_codes")
        .select("id")
        .eq("phone", cleanPhone)
        .eq("code", code)
        .lt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      if (expired) {
        return { success: false, error: "Code has expired. Please request a new one." };
      }

      // Increment attempts on all recent codes for this phone
      await admin
        .from("phone_otp_codes")
        .update({ attempts: otpRecord?.attempts ? otpRecord.attempts + 1 : 1 })
        .eq("phone", cleanPhone)
        .eq("verified", false);

      return { success: false, error: "Invalid verification code." };
    }

    // Too many attempts on this code
    if (otpRecord.attempts >= 5) {
      return {
        success: false,
        error: "Too many incorrect attempts. Please request a new code.",
      };
    }

    // 2. Mark OTP as verified
    await admin
      .from("phone_otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // 3. Look up existing profile by phone
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", cleanPhone)
      .single();

    if (existingProfile) {
      // Existing user — update phone_verified
      await admin
        .from("profiles")
        .update({
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq("id", existingProfile.id);

      return { success: true, userId: existingProfile.id };
    }

    // 4. Create new user via Supabase Auth admin API
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      phone: cleanPhone,
      phone_confirm: true,
      user_metadata: {
        full_name: contactName || "Guest",
        phone: cleanPhone,
        signup_method: "phone_otp",
      },
    });

    if (createError || !newUser.user) {
      console.error("User creation error:", createError);
      // If user already exists with this phone in auth but not profiles
      // Try to find by phone in auth
      const { data: authUsers } = await admin.auth.admin.listUsers();
      const existingAuth = authUsers?.users?.find((u) => u.phone === cleanPhone);
      if (existingAuth) {
        // Create profile for existing auth user
        await admin.from("profiles").upsert({
          id: existingAuth.id,
          full_name: contactName || "Guest",
          phone: cleanPhone,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        });
        return { success: true, userId: existingAuth.id };
      }

      return {
        success: false,
        error: "Could not create account. Please try again.",
      };
    }

    // 5. Create profile record
    const { error: profileError } = await admin.from("profiles").upsert({
      id: newUser.user.id,
      full_name: contactName || "Guest",
      phone: cleanPhone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Non-fatal — user exists, profile can be fixed later
    }

    return { success: true, userId: newUser.user.id };
  } catch (err) {
    console.error("Verify OTP error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
