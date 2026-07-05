-- World Cup Predictor - Schema Simplification Migration
-- Run this in Supabase SQL Editor
-- This removes unused tables and adds email allowlist

-- ============================================
-- STEP 1: Create allowed_emails table
-- ============================================

CREATE TABLE IF NOT EXISTS allowed_emails (
  email TEXT PRIMARY KEY,
  name TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Anyone can check if an email is allowed (needed for login flow)
CREATE POLICY "Anyone can check allowed emails" ON allowed_emails
  FOR SELECT USING (true);

-- ============================================
-- STEP 2: Add your friends' emails here
-- ============================================

-- IMPORTANT: Replace these with your actual friends' emails!
INSERT INTO allowed_emails (email, name) VALUES
  ('your-email@gmail.com', 'You (Admin)')
  -- Add more friends:
  -- ('friend1@gmail.com', 'Friend 1'),
  -- ('friend2@company.com', 'Friend 2'),
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- STEP 3: Remove unused tables
-- ============================================

-- Drop prediction_predictions (meta-game feature)
DROP TABLE IF EXISTS prediction_predictions CASCADE;

-- Drop user_points (will calculate client-side)
DROP TABLE IF EXISTS user_points CASCADE;

-- Drop league_members (no more private leagues)
DROP TABLE IF EXISTS league_members CASCADE;

-- Drop leagues (single global leaderboard)
DROP TABLE IF EXISTS leagues CASCADE;

-- ============================================
-- STEP 4: Drop unused functions and triggers
-- ============================================

DROP FUNCTION IF EXISTS calculate_user_points(UUID, UUID) CASCADE;

-- Drop triggers for removed tables (if they exist)
DROP TRIGGER IF EXISTS update_prediction_predictions_updated_at ON prediction_predictions;

-- ============================================
-- STEP 5: Simplify RLS policies
-- ============================================

-- Profiles: Users can view all profiles (for leaderboard)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

-- Profiles: Users can only update their own
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Group predictions: Users can view all (for leaderboard comparison)
DROP POLICY IF EXISTS "Users can manage own predictions" ON group_predictions;
CREATE POLICY "Users can view all predictions" ON group_predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own predictions" ON group_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON group_predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions" ON group_predictions
  FOR DELETE USING (auth.uid() = user_id);

-- Knockout predictions: Same pattern
DROP POLICY IF EXISTS "Users can manage own knockout predictions" ON knockout_predictions;
CREATE POLICY "Users can view all knockout predictions" ON knockout_predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own knockout predictions" ON knockout_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knockout predictions" ON knockout_predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knockout predictions" ON knockout_predictions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 6: Clean up unused indexes
-- ============================================

DROP INDEX IF EXISTS idx_prediction_predictions_predictor;
DROP INDEX IF EXISTS idx_prediction_predictions_predicted;
DROP INDEX IF EXISTS idx_prediction_predictions_match;
DROP INDEX IF EXISTS idx_user_points_league;
DROP INDEX IF EXISTS idx_user_points_user;
DROP INDEX IF EXISTS idx_leagues_code;
DROP INDEX IF EXISTS idx_league_members_league;
DROP INDEX IF EXISTS idx_league_members_user;

-- ============================================
-- DONE! Your simplified schema now has:
-- - profiles
-- - group_predictions  
-- - knockout_predictions
-- - match_results
-- - allowed_emails (new)
-- ============================================
