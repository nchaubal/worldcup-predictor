-- ============================================
-- COMPLETE SETUP FOR WORLD CUP PREDICTOR
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- 1. Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exact_scores INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correct_margins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correct_results INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correct_winners INTEGER DEFAULT 0;

-- 2. Add knockout prediction columns to group_predictions
-- All knockout matches require: 90min score + ET result (if 90min draw) + Penalty winner (if ET draw)
ALTER TABLE group_predictions ADD COLUMN IF NOT EXISTS knockout_winner TEXT; -- DEPRECATED - keeping for backwards compat
ALTER TABLE group_predictions ADD COLUMN IF NOT EXISTS et_result TEXT; -- 'home', 'away', or 'draw' (required if 90min is draw)
ALTER TABLE group_predictions ADD COLUMN IF NOT EXISTS penalty_winner TEXT; -- 'home' or 'away' (required if ET is draw)

-- 3. Create allowed_emails table (for controlling who can sign up)
CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on allowed_emails
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for allowed_emails
DROP POLICY IF EXISTS "Anyone can check allowed emails" ON allowed_emails;
CREATE POLICY "Anyone can check allowed emails" ON allowed_emails
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage allowed emails" ON allowed_emails;
CREATE POLICY "Admins can manage allowed emails" ON allowed_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 5. Create admin_prediction_logs table (tracks when admin adds predictions for users)
CREATE TABLE IF NOT EXISTS admin_prediction_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  target_user_id UUID REFERENCES profiles(id) NOT NULL,
  match_id TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_prediction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage prediction logs" ON admin_prediction_logs;
CREATE POLICY "Admins can manage prediction logs" ON admin_prediction_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 6. Update RLS policies for admin access to predictions
-- Admins can insert/update predictions for any user (for users who missed deadline)
DROP POLICY IF EXISTS "Users can update own predictions" ON group_predictions;
DROP POLICY IF EXISTS "Users can update own predictions or admins can update any" ON group_predictions;
CREATE POLICY "Users can update own predictions or admins can update any" ON group_predictions
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can insert own predictions" ON group_predictions;
DROP POLICY IF EXISTS "Users can insert own predictions or admins can insert any" ON group_predictions;
CREATE POLICY "Users can insert own predictions or admins can insert any" ON group_predictions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 7. SET ADMIN: nchaubal16@gmail.com
UPDATE profiles 
SET is_admin = true, updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'nchaubal16@gmail.com'
);

-- 8. Verify setup
SELECT 
  'Setup complete!' as status,
  (SELECT COUNT(*) FROM profiles WHERE is_admin = true) as admin_count,
  (SELECT email FROM auth.users WHERE id = (SELECT id FROM profiles WHERE is_admin = true LIMIT 1)) as admin_email;
