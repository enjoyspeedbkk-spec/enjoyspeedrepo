-- =============================================
-- Migration 011: Email OTP support
-- =============================================
-- The phone_otp_codes table was created with phone varchar(20)
-- but we now reuse it for email OTP where the "phone" column
-- stores email addresses (which can be much longer than 20 chars).
-- Widen the column to accommodate emails.

-- 1. Widen the "phone" column to text (no length limit)
ALTER TABLE public.phone_otp_codes
  ALTER COLUMN phone TYPE text;

-- 2. Add email_verified columns to profiles if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified_at timestamptz;
  END IF;
END $$;
