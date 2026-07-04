-- Admin and Points System Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. ALLOWED EMAILS TABLE
-- ============================================
-- Controls who can sign up/sign in to the app
CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Anyone can check if their email is allowed (for sign-in)
CREATE POLICY "Anyone can check allowed emails" ON allowed_emails
  FOR SELECT USING (true);

-- Only admins can manage allowed emails
CREATE POLICY "Admins can manage allowed emails" ON allowed_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 2. ADD ADMIN AND POINTS COLUMNS TO PROFILES
-- ============================================
-- Add is_admin column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add total_points column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_points INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add points breakdown columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'exact_scores'
  ) THEN
    ALTER TABLE profiles ADD COLUMN exact_scores INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'correct_margins'
  ) THEN
    ALTER TABLE profiles ADD COLUMN correct_margins INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'correct_results'
  ) THEN
    ALTER TABLE profiles ADD COLUMN correct_results INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 3. FUNCTION TO CALCULATE POINTS FOR A MATCH
-- ============================================
CREATE OR REPLACE FUNCTION calculate_match_points(
  p_home_score INTEGER,
  p_away_score INTEGER,
  a_home_score INTEGER,
  a_away_score INTEGER
) RETURNS TABLE (points INTEGER, point_type TEXT) AS $$
BEGIN
  -- Exact score: 3 points
  IF p_home_score = a_home_score AND p_away_score = a_away_score THEN
    RETURN QUERY SELECT 3, 'exact'::TEXT;
    RETURN;
  END IF;
  
  -- Correct margin: 2 points
  IF (p_home_score - p_away_score) = (a_home_score - a_away_score) THEN
    RETURN QUERY SELECT 2, 'margin'::TEXT;
    RETURN;
  END IF;
  
  -- Correct result (win/draw/loss): 1 point
  IF (
    (p_home_score > p_away_score AND a_home_score > a_away_score) OR
    (p_home_score < p_away_score AND a_home_score < a_away_score) OR
    (p_home_score = p_away_score AND a_home_score = a_away_score)
  ) THEN
    RETURN QUERY SELECT 1, 'result'::TEXT;
    RETURN;
  END IF;
  
  -- No points
  RETURN QUERY SELECT 0, 'none'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FUNCTION TO UPDATE ALL USER POINTS AFTER A MATCH
-- ============================================
CREATE OR REPLACE FUNCTION update_points_for_match(match_id_param TEXT) 
RETURNS void AS $$
DECLARE
  result_record RECORD;
  prediction_record RECORD;
  point_result RECORD;
BEGIN
  -- Get the match result
  SELECT * INTO result_record 
  FROM match_results 
  WHERE match_id = match_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match result not found for match_id: %', match_id_param;
  END IF;
  
  -- Loop through all predictions for this match
  FOR prediction_record IN 
    SELECT * FROM group_predictions WHERE match_id = match_id_param
  LOOP
    -- Calculate points
    SELECT * INTO point_result 
    FROM calculate_match_points(
      prediction_record.home_score,
      prediction_record.away_score,
      result_record.home_score,
      result_record.away_score
    );
    
    -- Update user's total points
    UPDATE profiles 
    SET 
      total_points = total_points + point_result.points,
      exact_scores = exact_scores + CASE WHEN point_result.point_type = 'exact' THEN 1 ELSE 0 END,
      correct_margins = correct_margins + CASE WHEN point_result.point_type = 'margin' THEN 1 ELSE 0 END,
      correct_results = correct_results + CASE WHEN point_result.point_type = 'result' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE id = prediction_record.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGER TO AUTO-UPDATE POINTS WHEN RESULT IS ADDED
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_points_on_result() 
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_points_for_match(NEW.match_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_match_result_insert ON match_results;

-- Create trigger
CREATE TRIGGER on_match_result_insert
  AFTER INSERT ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_points_on_result();

-- ============================================
-- 6. ADMIN PREDICTION OVERRIDE TABLE
-- ============================================
-- Track when admins add predictions on behalf of users
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

-- Enable RLS
ALTER TABLE admin_prediction_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/insert logs
CREATE POLICY "Admins can manage prediction logs" ON admin_prediction_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 7. UPDATE RLS POLICIES FOR ADMIN ACCESS
-- ============================================
-- Allow admins to update any user's predictions
DROP POLICY IF EXISTS "Users can update own predictions" ON group_predictions;

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

CREATE POLICY "Users can insert own predictions or admins can insert any" ON group_predictions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 8. HELPER FUNCTION TO ADD ALLOWED EMAIL
-- ============================================
CREATE OR REPLACE FUNCTION add_allowed_email(email_to_add TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO allowed_emails (email, added_by)
  VALUES (LOWER(email_to_add), auth.uid())
  ON CONFLICT (email) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. HELPER FUNCTION TO SET ADMIN STATUS
-- ============================================
CREATE OR REPLACE FUNCTION set_admin_status(user_email TEXT, admin_status BOOLEAN)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET is_admin = admin_status, updated_at = NOW()
  WHERE id = (
    SELECT id FROM auth.users WHERE email = LOWER(user_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. VIEW FOR LEADERBOARD
-- ============================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id,
  p.username,
  p.avatar,
  p.total_points,
  p.exact_scores,
  p.correct_margins,
  p.correct_results,
  RANK() OVER (ORDER BY p.total_points DESC) as rank
FROM profiles p
WHERE p.username IS NOT NULL
ORDER BY p.total_points DESC;

-- ============================================
-- USAGE EXAMPLES (run manually as needed):
-- ============================================

-- Add allowed emails:
-- INSERT INTO allowed_emails (email) VALUES ('user@example.com');

-- Set a user as admin (replace with actual email):
-- SELECT set_admin_status('admin@example.com', true);

-- Manually trigger points update for a match:
-- SELECT update_points_for_match('r32_1');

-- View leaderboard:
-- SELECT * FROM leaderboard;
