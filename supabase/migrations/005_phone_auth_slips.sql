-- Migration 005: Phone-based auth, slip uploads, guest booking support
-- Run this after migrations 001-004

-- 1. Add phone columns to profiles (if not already present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone varchar(20);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_verified_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_verified_at timestamptz;
  END IF;
END $$;

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles(phone) WHERE phone IS NOT NULL;

-- 2. Add phone_verified flag to bookings for guest bookings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;
END $$;

-- 3. Add payment_slip_url to payments table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'slip_url'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN slip_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'slip_uploaded_at'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN slip_uploaded_at timestamptz;
  END IF;
END $$;

-- 4. OTP verification codes table
CREATE TABLE IF NOT EXISTS public.phone_otp_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone varchar(20) NOT NULL,
  code varchar(6) NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Clean up expired codes automatically
CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON public.phone_otp_codes(phone, code) WHERE verified = false;
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.phone_otp_codes(expires_at);

-- RLS for OTP table (service role only — no browser access)
ALTER TABLE public.phone_otp_codes ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role can access (which is what we want)

-- 5. Create storage bucket for payment slips (run in Supabase dashboard if this fails)
-- Note: Storage bucket creation via SQL may not work in all Supabase setups.
-- If this fails, manually create a 'payment-slips' bucket in Supabase Storage dashboard.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-slips',
  'payment-slips',
  false,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can upload to their booking folder, admins can read all
CREATE POLICY "Anyone can upload payment slips"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-slips');

CREATE POLICY "Admins can view all payment slips"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-slips');

CREATE POLICY "Admins can delete payment slips"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'payment-slips');
