-- Migration 006: Rider check-in and post-ride survey
-- Run after migration 005

-- 1. Add check-in columns to riders table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'riders' AND column_name = 'checked_in'
  ) THEN
    ALTER TABLE public.riders ADD COLUMN checked_in boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'riders' AND column_name = 'checked_in_at'
  ) THEN
    ALTER TABLE public.riders ADD COLUMN checked_in_at timestamptz;
  END IF;
END $$;

-- 2. Post-ride survey table
CREATE TABLE IF NOT EXISTS public.ride_surveys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),

  -- Core ratings (1-5 stars)
  overall_rating int CHECK (overall_rating BETWEEN 1 AND 5),
  guide_rating int CHECK (guide_rating BETWEEN 1 AND 5),
  route_rating int CHECK (route_rating BETWEEN 1 AND 5),
  equipment_rating int CHECK (equipment_rating BETWEEN 1 AND 5),

  -- Open feedback
  highlight text,         -- "What was the best part?"
  improvement text,       -- "What could we improve?"

  -- Would recommend?
  would_recommend boolean,

  -- Photo permission
  photo_consent boolean DEFAULT false,

  -- Meta
  submitted_at timestamptz DEFAULT now(),

  -- One survey per booking
  UNIQUE(booking_id)
);

-- RLS
ALTER TABLE public.ride_surveys ENABLE ROW LEVEL SECURITY;

-- Users can insert their own survey
CREATE POLICY "Users can submit their own survey"
  ON public.ride_surveys FOR INSERT
  WITH CHECK (true);

-- Users can view their own surveys
CREATE POLICY "Users can view own surveys"
  ON public.ride_surveys FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can view all
CREATE POLICY "Admin full access to surveys"
  ON public.ride_surveys FOR ALL
  USING (true);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_surveys_booking ON public.ride_surveys(booking_id);
CREATE INDEX IF NOT EXISTS idx_surveys_user ON public.ride_surveys(user_id);
