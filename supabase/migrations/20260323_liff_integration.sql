-- =============================================
-- LIFF Integration Migration
-- Links LINE users to Supabase auth users
-- Adds communication fallback, admin phones
-- =============================================

-- 1. Link line_users to Supabase users
ALTER TABLE line_users ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE line_users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE line_users ADD COLUMN IF NOT EXISTS picture_url TEXT;
ALTER TABLE line_users ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ;
ALTER TABLE line_users ADD COLUMN IF NOT EXISTS linked_via TEXT DEFAULT 'manual'
  CHECK (linked_via IN ('liff', 'manual', 'webhook', 'admin'));

CREATE INDEX IF NOT EXISTS idx_line_users_user_id ON line_users(user_id);
CREATE INDEX IF NOT EXISTS idx_line_users_line_user_id ON line_users(line_user_id);

-- 2. Add LINE user ID to profiles for quick lookup
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_user_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_linked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_notification TEXT DEFAULT 'line'
  CHECK (preferred_notification IN ('line', 'sms', 'email'));

CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON profiles(line_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- 3. Track notification channel per booking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notification_channel TEXT DEFAULT 'line'
  CHECK (notification_channel IN ('line', 'sms', 'email'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booker_line_id TEXT;

-- 4. Admin phone numbers configuration table
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert admin phone numbers
INSERT INTO app_config (key, value) VALUES
  ('admin_phones', '["0955709465", "0954922135"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 5. Set admin role for these phone numbers (if profiles exist)
UPDATE profiles SET role = 'admin'
WHERE phone IN ('0955709465', '0954922135')
  AND (role IS NULL OR role != 'admin');

-- 6. RLS policies for new columns
-- line_users: admins can read all, users can read own
ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own line_users" ON line_users;
CREATE POLICY "Users can view own line_users" ON line_users
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access line_users" ON line_users;
CREATE POLICY "Service role full access line_users" ON line_users
  FOR ALL USING (auth.role() = 'service_role');

-- app_config: read-only for authenticated, write for service role
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read app_config" ON app_config;
CREATE POLICY "Authenticated can read app_config" ON app_config
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can write app_config" ON app_config;
CREATE POLICY "Service role can write app_config" ON app_config
  FOR ALL USING (auth.role() = 'service_role');
