"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

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
 * Generate and send OTP to an email address.
 *
 * Uses the same OTP table (phone_otp_codes) but with email as the identifier.
 * The table column is called "phone" but we repurpose it for email — or use
 * a separate column if it exists. For simplicity, we store the email in the
 * phone column since the column is just a text identifier.
 */
export async function sendEmailOtp(
  email: string,
  contactName?: string
): Promise<OtpResult> {
  try {
    const admin = createAdminClient();

    // Validate email
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Rate limit: max 5 codes per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("phone_otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("phone", cleanEmail)
      .gte("created_at", oneHourAgo);

    if ((count || 0) >= 5) {
      return {
        success: false,
        error: "Too many verification attempts. Please try again in an hour.",
      };
    }

    // Generate 6-digit code
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const code = (100000 + (randomBytes[0] % 900000)).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB (reusing phone_otp_codes table — "phone" column holds the email)
    const { error: insertError } = await admin.from("phone_otp_codes").insert({
      phone: cleanEmail,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("OTP insert error:", insertError);

      // If the table doesn't exist or column is too narrow, try to create/fix it
      if (insertError.code === "42P01" || insertError.message?.includes("value too long")) {
        try {
          await admin.rpc("exec_sql", {
            query: `
              CREATE TABLE IF NOT EXISTS public.phone_otp_codes (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                phone text NOT NULL,
                code varchar(6) NOT NULL,
                expires_at timestamptz NOT NULL,
                verified boolean DEFAULT false,
                attempts int DEFAULT 0,
                created_at timestamptz DEFAULT now()
              );
              ALTER TABLE public.phone_otp_codes ALTER COLUMN phone TYPE text;
              ALTER TABLE public.phone_otp_codes ENABLE ROW LEVEL SECURITY;
            `,
          });
          // Retry the insert
          const { error: retryError } = await admin.from("phone_otp_codes").insert({
            phone: cleanEmail,
            code,
            expires_at: expiresAt.toISOString(),
          });
          if (retryError) {
            console.error("OTP retry insert error:", retryError);
            return { success: false, error: "Database setup required. Please run migration 011_email_otp_support.sql in Supabase." };
          }
        } catch {
          return { success: false, error: "Database setup required. Please run migration 011_email_otp_support.sql in Supabase." };
        }
      } else {
        return { success: false, error: "Failed to generate code. Please try again." };
      }
    }

    // Send OTP via email
    const name = contactName || "there";
    const emailSent = await sendEmail({
      to: cleanEmail,
      subject: `${code} — Your En-Joy Speed verification code`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1B2A4A; font-size: 24px; margin: 0 0 8px;">En-Joy Speed</h1>
            <p style="color: #7A869A; font-size: 14px; margin: 0;">Verification Code</p>
          </div>
          <p style="color: #1B2A4A; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="color: #3D4F6F; font-size: 15px; line-height: 1.6;">Your verification code is:</p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #F7F8FA; border: 2px solid #EEF0F4; border-radius: 12px; padding: 16px 32px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #E8871E;">${code}</span>
            </div>
          </div>
          <p style="color: #7A869A; font-size: 13px; text-align: center;">This code expires in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #EEF0F4; margin: 24px 0;" />
          <p style="color: #A8AEBB; font-size: 12px; text-align: center;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (!emailSent) {
      // Email delivery failed — Resend may be in test mode (onboarding@resend.dev only sends to account holder)
      // Log the code so admin can retrieve it from Vercel logs if needed
      console.warn(`📧 OTP for ${cleanEmail}: ${code} (email delivery FAILED — verify a domain in Resend to fix)`);
      return {
        success: false,
        error: "Email delivery failed. Please check your email address or try again. If this persists, contact us on LINE @EnjoySpeed.",
      };
    }

    console.log(`📧 OTP sent to ${cleanEmail} (${contactName || "Guest"}) — expires ${expiresAt.toISOString()}`);

    return { success: true };
  } catch (err) {
    console.error("Send email OTP error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Verify OTP code and create/find user account.
 *
 * Flow:
 * 1. Check if OTP is valid and not expired
 * 2. Look up existing user by email
 * 3. If exists: return that user
 * 4. If not: create a new Supabase auth user + profile
 */
export async function verifyEmailOtp(
  email: string,
  code: string,
  contactName?: string
): Promise<VerifyResult> {
  try {
    const admin = createAdminClient();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Find matching unexpired, unverified OTP
    const { data: otpRecord, error: otpError } = await admin
      .from("phone_otp_codes")
      .select("*")
      .eq("phone", cleanEmail)
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
        .eq("phone", cleanEmail)
        .eq("code", code)
        .lt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      if (expired) {
        return { success: false, error: "Code has expired. Please request a new one." };
      }

      return { success: false, error: "Invalid verification code." };
    }

    // Too many attempts
    if (otpRecord.attempts >= 5) {
      return { success: false, error: "Too many incorrect attempts. Please request a new code." };
    }

    // 2. Mark OTP as verified
    await admin
      .from("phone_otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // 3. Look up existing user by email in auth
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const existingAuth = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingAuth) {
      // Existing user — ensure profile exists and email_verified
      await admin.from("profiles").upsert({
        id: existingAuth.id,
        full_name: contactName || existingAuth.user_metadata?.full_name || "Guest",
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      });
      return { success: true, userId: existingAuth.id };
    }

    // 4. Create new user
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      email_confirm: true,
      user_metadata: {
        full_name: contactName || "Guest",
        email: cleanEmail,
        signup_method: "email_otp",
      },
    });

    if (createError || !newUser.user) {
      console.error("User creation error:", createError);
      return { success: false, error: "Could not create account. Please try again." };
    }

    // 5. Create profile
    await admin.from("profiles").upsert({
      id: newUser.user.id,
      full_name: contactName || "Guest",
      email_verified: true,
      email_verified_at: new Date().toISOString(),
    });

    return { success: true, userId: newUser.user.id };
  } catch (err) {
    console.error("Verify email OTP error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
