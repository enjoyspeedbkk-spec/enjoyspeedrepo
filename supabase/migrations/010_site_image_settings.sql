-- Site Image Settings
-- Stores positioning/cropping data for all images used across the site
-- Allows admin to control object-position, crop area, and image replacement

CREATE TABLE IF NOT EXISTS site_image_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_key TEXT UNIQUE NOT NULL,          -- e.g. "hero-still", "team-udorn", "gallery-morning"
  label TEXT NOT NULL,                      -- Human-readable label: "Hero Still Image"
  category TEXT NOT NULL DEFAULT 'general', -- hero, team, gallery, venue, equipment, etc.
  current_url TEXT NOT NULL,                -- The image URL currently in use (could be local path or Supabase URL)
  object_position TEXT DEFAULT '50% 50%',   -- CSS object-position value
  object_fit TEXT DEFAULT 'cover',          -- CSS object-fit value
  brightness REAL DEFAULT 1.0,             -- CSS brightness filter (0.0 - 2.0)
  contrast REAL DEFAULT 1.0,               -- CSS contrast filter (0.0 - 2.0)
  saturate REAL DEFAULT 1.0,               -- CSS saturate filter (0.0 - 2.0)
  custom_css TEXT,                          -- Any additional CSS to apply
  notes TEXT,                               -- Admin notes
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_image_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admin can view site_image_settings"
  ON site_image_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can manage site_image_settings"
  ON site_image_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Public read access for rendering (unauthenticated users need to see image settings)
CREATE POLICY "Public can view site_image_settings"
  ON site_image_settings FOR SELECT
  TO anon
  USING (true);

-- Seed with all current site images
INSERT INTO site_image_settings (image_key, label, category, current_url) VALUES
  -- Hero
  ('hero-still', 'Hero Still Image', 'hero', '/images/hero-golden-hour-still.jpg'),

  -- Team
  ('team-pailin-profile', 'Coach Pailin Profile', 'team', '/images/team/pailin-1.jpg'),
  ('team-udorn-profile', 'Coach Udorn Profile', 'team', '/images/team/udorn-1.jpg'),
  ('team-group-photo', 'Team Group Photo', 'team', '/images/team/team-dawn.jpg'),

  -- Equipment / What's Included
  ('equipment-uniform', 'Team Uniform', 'equipment', '/images/team-uniform.jpg'),
  ('equipment-bag', 'Branded Bag', 'equipment', '/images/branded-bag.jpg'),
  ('equipment-gel', 'Energy Gel', 'equipment', '/images/energy-gel.jpg'),
  ('equipment-gloves', 'Cycling Gloves', 'equipment', '/images/cycling-gloves.jpg'),

  -- Gallery
  ('gallery-morning-ride', 'Morning Ride', 'gallery', '/images/gallery/morning-ride.jpg'),
  ('gallery-ride-group-1', 'Ride Group 1', 'gallery', '/images/gallery/ride-group-1.jpg'),
  ('gallery-skylane', 'Skylane Architecture', 'gallery', '/images/gallery/skylane-architecture.jpg'),
  ('gallery-ride-action', 'Ride Action', 'gallery', '/images/gallery/ride-action-1.jpg'),
  ('gallery-ride-group-2', 'Ride Group 2', 'gallery', '/images/gallery/ride-group-2.jpg'),
  ('gallery-rider-portrait', 'Rider Portrait', 'gallery', '/images/gallery/rider-portrait.jpg'),
  ('gallery-sunrise', 'Sunrise', 'gallery', '/images/gallery/sunrise-2.jpg'),

  -- Venue
  ('venue-meeting-point', 'Meeting Point', 'venue', '/images/venue/meeting-point.jpg'),
  ('venue-group-ride', 'Group Ride Scene', 'venue', '/images/group-ride.jpg'),

  -- Booking
  ('booking-pants-sizing', 'Pants Sizing Reference', 'booking', '/images/pants-sizing.jpg'),

  -- Logo
  ('logo', 'Site Logo', 'branding', '/images/logo.jpg')
ON CONFLICT (image_key) DO NOTHING;

-- Function to update timestamp on update
CREATE OR REPLACE FUNCTION update_site_image_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_image_settings_updated
  BEFORE UPDATE ON site_image_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_image_timestamp();
