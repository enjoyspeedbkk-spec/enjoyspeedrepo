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
 * Generate and send OTP to a phone number.
 *
 * Accepts both Thai numbers (0XXXXXXXXX) and international (+CCXXXXXXXXX).
 * Thai numbers are auto-converted to +66 format for Twilio.
 *
 * For dev: OTP is stored in DB and logged to console.
 * For production: sent via Twilio (international, 180+ countries).
 */
export async function sendPhoneOtp(
  phone: string,
  contactName?: string
): Promise<OtpResult> {
  try {
    const admin = createAdminClient();

    // Clean and validate phone number
    const cleanPhone = phone.replace(/[\s\-()]/g, "");

    // Accept: Thai local (0XXXXXXXXX), or international (+CCXX... or 00CCXX...)
    const isThaiLocal = /^0[689]\d{8}$/.test(cleanPhone);
    const isInternational = /^\+\d{7,15}$/.test(cleanPhone);
    const isInternationalNoPlus = /^00\d{7,15}$/.test(cleanPhone);

    if (!isThaiLocal && !isInternational && !isInternationalNoPlus) {
      return {
        success: false,
        error: "Please enter a valid phone number (e.g. 09XXXXXXXX or +44XXXXXXXXXX)",
      };
    }

    // Normalize to international format for storage and SMS
    let normalizedPhone = cleanPhone;
    if (isThaiLocal) {
      normalizedPhone = `+66${cleanPhone.slice(1)}`;
    } else if (isInternationalNoPlus) {
      normalizedPhone = `+${cleanPhone.slice(2)}`;
    }
    // cleanPhone for DB storage (strip + for consistency)
    const dbPhone = normalizedPhone.replace("+", "");

    // Rate limit: max 3 codes per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("phone_otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("phone", dbPhone)
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

    // Store in DB (using normalized phone without +)
    const { error: insertError } = await admin.from("phone_otp_codes").insert({
      phone: dbPhone,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("OTP insert error:", insertError);
      return { success: false, error: "Failed to generate code. Please try again." };
    }

    // --- SMS SENDING ---
    // Send to the international format number (Twilio needs +CC format)
    const smsResult = await sendSMS(normalizedPhone, formatOtpMessage(code));

    if (!smsResult.success) {
      console.error("SMS send failed:", smsResult.error);
      if (process.env.SMS_PROVIDER && process.env.SMS_PROVIDER !== "console") {
        return { success: false, error: "Could not send verification code. Please try again." };
      }
    }

    const smsProvider = process.env.SMS_PROVIDER || "console";
    console.log(`📱 OTP sent to ${normalizedPhone} (${contactName || "Guest"}) via ${smsProvider} — expires ${expiresAt.toISOString()}`);

    // In console mode, return the code hint so the user can test
    if (smsProvider === "console") {
      return {
        success: true,
        error: `[Dev Mode] Your code is: ${code}. In production, this will be sent via SMS.`,
      };
    }

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

    // Normalize phone to match DB format (digits only, no +)
    const cleaned = phone.replace(/[\s\-()]/g, "");
    let dbPhone: string;
    if (/^0[689]\d{8}$/.test(cleaned)) {
      dbPhone = `66${cleaned.slice(1)}`;
    } else if (cleaned.startsWith("+")) {
      dbPhone = cleaned.slice(1);
    } else if (cleaned.startsWith("00")) {
      dbPhone = cleaned.slice(2);
    } else {
      dbPhone = cleaned;
    }

    // 1. Find matching unexpired, unverified OTP
    const { data: otpRecord, error: otpError } = await admin
      .from("phone_otp_codes")
      .select("*")
      .eq("phone", dbPhone)
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
        .eq("phone", dbPhone)
        .eq("code", code)
        .lt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      if (expired) {
        return { success: false, error: "Code has expired. Please request a new one." };
      }

      // Increment attempts on all recent unverified codes for this phone
      const { data: recentCodes } = await admin
        .from("phone_otp_codes")
        .select("id, attempts")
        .eq("phone", dbPhone)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString());

      if (recentCodes) {
        for (const rc of recentCodes) {
          await admin
            .from("phone_otp_codes")
            .update({ attempts: (rc.attempts || 0) + 1 })
            .eq("id", rc.id);
        }
      }

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

    // 3. Look up existing profile by phone (try both formats for backwards compat)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .or(`phone.eq.${dbPhone},phone.eq.0${dbPhone.slice(2)}`)
      .limit(1)
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
    const intlPhone = `+${dbPhone}`;
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      phone: intlPhone,
      phone_confirm: true,
      user_metadata: {
        full_name: contactName || "Guest",
        phone: dbPhone,
        signup_method: "phone_otp",
      },
    });

    if (createError || !newUser.user) {
      console.error("User creation error:", createError);

      const duplicateMatch = createError?.message?.match(/already registered/i);
      if (duplicateMatch) {
        // The user exists in auth — find them
        const { data: { users } } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 50,
        });
        const existingAuth = users?.find(
          (u) => u.phone === intlPhone || u.phone === dbPhone
        );

        if (existingAuth) {
          await admin.from("profiles").upsert({
            id: existingAuth.id,
            full_name: contactName || "Guest",
            phone: dbPhone,
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          });
          return { success: true, userId: existingAuth.id };
        }
      }

      return {
        success: false,
        error: "Could not create account. Please try again.",
      };
    }

    // 5. Create profile record — auto-assign admin role for configured admin phones
    const adminPhones = (process.env.ADMIN_PHONE_NUMBERS || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    // Check against both local and international formats
    const localPhone = dbPhone.startsWith("66") ? `0${dbPhone.slice(2)}` : dbPhone;
    const isAdmin = adminPhones.includes(localPhone) || adminPhones.includes(dbPhone);

    const { error: profileError } = await admin.from("profiles").upsert({
      id: newUser.user.id,
      full_name: contactName || "Guest",
      phone: dbPhone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      ...(isAdmin ? { role: "admin" } : {}),
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
