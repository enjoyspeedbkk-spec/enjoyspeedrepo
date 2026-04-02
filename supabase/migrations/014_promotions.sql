-- =============================================
-- EN-JOY SPEED — Promotions (time-based, auto-applied)
-- Different from promo_codes (which require a code).
-- Promotions are visible on the booking calendar and
-- automatically applied when a user picks a promoted date.
-- =============================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Display
  name TEXT NOT NULL,                       -- e.g. "Songkran Special"
  name_th TEXT,                             -- Thai name (optional)
  description TEXT,                         -- e.g. "20% off all packages"
  description_th TEXT,                      -- Thai description (optional)
  badge_label TEXT DEFAULT 'PROMO',         -- Short label shown on date tiles
  badge_color TEXT DEFAULT '#F59E0B',       -- Hex color for the badge

  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_per_person')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),

  -- Date range (inclusive, in Bangkok time dates — not timestamps)
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  CHECK (ends_on >= starts_on),

  -- Targeting
  applicable_packages TEXT[],               -- NULL = all packages
  min_riders INT,                           -- NULL = no minimum
  max_uses INT,                             -- NULL = unlimited
  current_uses INT NOT NULL DEFAULT 0,

  -- State
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for fast lookups during booking date rendering
CREATE INDEX IF NOT EXISTS idx_promotions_active_dates
  ON promotions (starts_on, ends_on)
  WHERE is_active = true;

-- RLS: public read for active promotions, admin write
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promotions"
  ON promotions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL
  USING (
    public.is_admin()
  );
