-- Step-by-Step Database Setup for World Cup Predictor
-- Run each section separately in your Supabase SQL Editor

-- STEP 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 2: Create basic tables (no dependencies)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar TEXT DEFAULT '⚽',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id TEXT UNIQUE NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  actual_winner TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: Create dependent tables
CREATE TABLE IF NOT EXISTS league_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE TABLE IF NOT EXISTS knockout_predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  winner_team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  exact_predictions INTEGER DEFAULT 0,
  margin_predictions INTEGER DEFAULT 0,
  result_predictions INTEGER DEFAULT 0,
  prediction_predictions INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, league_id)
);

CREATE TABLE IF NOT EXISTS prediction_predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  predictor_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  predicted_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  predicted_home_score INTEGER NOT NULL,
  predicted_away_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(predictor_user_id, predicted_user_id, match_id),
  CHECK(predictor_user_id != predicted_user_id)
);

-- STEP 4: Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_predictions_updated_at BEFORE UPDATE ON group_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knockout_predictions_updated_at BEFORE UPDATE ON knockout_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prediction_predictions_updated_at BEFORE UPDATE ON prediction_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 5: Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view leagues" ON leagues
    FOR SELECT USING (
        creator_id = auth.uid() OR 
        id IN (
            SELECT league_id FROM league_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own leagues" ON leagues
    FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "Users can view league members" ON league_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        league_id IN (
            SELECT league_id FROM league_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own league membership" ON league_members
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own group predictions" ON group_predictions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own knockout predictions" ON knockout_predictions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prediction predictions" ON prediction_predictions
    FOR ALL USING (auth.uid() = predictor_user_id);

CREATE POLICY "Users can view league prediction predictions" ON prediction_predictions
    FOR SELECT USING (
        predictor_user_id = auth.uid() OR 
        predictor_user_id IN (
            SELECT user_id FROM league_members 
            WHERE league_id IN (
                SELECT league_id FROM league_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Authenticated users can view match results" ON match_results
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own league points" ON user_points
    FOR SELECT USING (
        user_id = auth.uid() OR 
        user_id IN (
            SELECT user_id FROM league_members 
            WHERE league_id = user_points.league_id AND user_id = auth.uid()
        )
    );

-- STEP 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_leagues_code ON leagues(code);
CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_predictions_user ON group_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_group_predictions_match ON group_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_knockout_predictions_user ON knockout_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_knockout_predictions_match ON knockout_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_user_points_league ON user_points(league_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_match_results_match ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_prediction_predictions_predictor ON prediction_predictions(predictor_user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_predictions_predicted ON prediction_predictions(predicted_user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_predictions_match ON prediction_predictions(match_id);

-- STEP 8: Create scoring function (run this last)
CREATE OR REPLACE FUNCTION calculate_user_points(p_user_id UUID, p_league_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER := 0;
    exact_count INTEGER := 0;
    margin_count INTEGER := 0;
    result_count INTEGER := 0;
    prediction_count INTEGER := 0;
BEGIN
    -- Calculate points from group predictions with enhanced scoring
    SELECT 
        COALESCE(SUM(
            CASE 
                -- Exact score: 5 points
                WHEN mr.home_score = gp.home_score AND mr.away_score = gp.away_score THEN 5
                -- Correct margin: 2 points
                WHEN (mr.home_score - mr.away_score) = (gp.home_score - gp.away_score) THEN 2
                -- Correct result only: 1 point
                WHEN SIGN(mr.home_score - mr.away_score) = SIGN(gp.home_score - gp.away_score) THEN 1
                ELSE 0
            END
        ), 0),
        COALESCE(SUM(CASE WHEN mr.home_score = gp.home_score AND mr.away_score = gp.away_score THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN (mr.home_score - mr.away_score) = (gp.home_score - gp.away_score)
                         AND NOT (mr.home_score = gp.home_score AND mr.away_score = gp.away_score) THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN SIGN(mr.home_score - mr.away_score) = SIGN(gp.home_score - gp.away_score) 
                         AND NOT (mr.home_score = gp.home_score AND mr.away_score = gp.away_score)
                         AND NOT ((mr.home_score - mr.away_score) = (gp.home_score - gp.away_score)) THEN 1 ELSE 0 END), 0)
    INTO total_points, exact_count, margin_count, result_count
    FROM group_predictions gp
    LEFT JOIN match_results mr ON gp.match_id = mr.match_id
    WHERE gp.user_id = p_user_id AND mr.completed_at IS NOT NULL;
    
    -- Calculate points from knockout predictions
    SELECT 
        COALESCE(total_points, 0) + COALESCE(SUM(
            CASE 
                WHEN kp.winner_team_id = mr.actual_winner THEN 2
                ELSE 0
            END
        ), 0)
    INTO total_points
    FROM knockout_predictions kp
    LEFT JOIN match_results mr ON kp.match_id = mr.match_id
    WHERE kp.user_id = p_user_id AND mr.completed_at IS NOT NULL;
    
    -- Calculate points from predicting other users' predictions (3 points per correct prediction)
    SELECT 
        COALESCE(total_points, 0) + COALESCE(SUM(
            CASE 
                WHEN pp.predicted_home_score = gp.home_score AND pp.predicted_away_score = gp.away_score THEN 3
                ELSE 0
            END
        ), 0),
        COALESCE(SUM(CASE WHEN pp.predicted_home_score = gp.home_score AND pp.predicted_away_score = gp.away_score THEN 1 ELSE 0 END), 0)
    INTO total_points, prediction_count
    FROM prediction_predictions pp
    INNER JOIN group_predictions gp ON pp.predicted_user_id = gp.user_id AND pp.match_id = gp.match_id
    WHERE pp.predictor_user_id = p_user_id;
    
    -- Update user points table with enhanced breakdown
    INSERT INTO user_points (user_id, league_id, total_points, exact_predictions, margin_predictions, result_predictions, prediction_predictions, last_calculated_at)
    VALUES (p_user_id, p_league_id, total_points, exact_count, margin_count, result_count, prediction_count, NOW())
    ON CONFLICT (user_id, league_id)
    DO UPDATE SET 
        total_points = EXCLUDED.total_points,
        exact_predictions = EXCLUDED.exact_predictions,
        margin_predictions = EXCLUDED.margin_predictions,
        result_predictions = EXCLUDED.result_predictions,
        prediction_predictions = EXCLUDED.prediction_predictions,
        last_calculated_at = EXCLUDED.last_calculated_at;
    
    RETURN total_points;
END;
$$ LANGUAGE plpgsql;
