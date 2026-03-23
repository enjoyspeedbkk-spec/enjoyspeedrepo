-- ========================================
-- LINE Users & Account Linking
-- Stores LINE user IDs from webhook events
-- ========================================

CREATE TABLE IF NOT EXISTS line_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id text UNIQUE NOT NULL,
  -- Link to website user (optional — linked after account connection)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Profile data from LINE (fetched via API)
  display_name text,
  picture_url text,
  -- Tracking
  followed_at timestamptz DEFAULT now(),
  unfollowed_at timestamptz,
  is_following boolean DEFAULT true,
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for quick lookup by LINE user ID
CREATE INDEX IF NOT EXISTS idx_line_users_line_id ON line_users(line_user_id);
-- Index for finding linked website users
CREATE INDEX IF NOT EXISTS idx_line_users_user_id ON line_users(user_id);

-- RLS
ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;

-- Admin can see all LINE users
CREATE POLICY "Admin full access to line_users"
  ON line_users FOR ALL
  USING (is_admin());

-- Service role (webhook) can insert/update
-- (This works because the webhook uses the admin client with service role key)

-- Add line_user_id to profiles for easy lookup
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_user_id text;
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON profiles(line_user_id);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_line_users
  BEFORE UPDATE ON line_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
