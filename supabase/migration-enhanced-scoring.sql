-- Migration for Enhanced Scoring System
-- Run this in your Supabase SQL Editor to update existing project

-- 1. Add new columns to user_points table for enhanced scoring
ALTER TABLE user_points 
ADD COLUMN IF NOT EXISTS margin_predictions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prediction_predictions INTEGER DEFAULT 0;

-- 2. Create prediction_predictions table for users to predict other users' predictions
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

-- 3. Enable RLS for new table
ALTER TABLE prediction_predictions ENABLE ROW LEVEL SECURITY;

-- 4. Add trigger for updated_at
CREATE TRIGGER update_prediction_predictions_updated_at BEFORE UPDATE ON prediction_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_predictions_predictor ON prediction_predictions(predictor_user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_predictions_predicted ON prediction_predictions(predicted_user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_predictions_match ON prediction_predictions(match_id);

-- 6. Add RLS policies for prediction_predictions
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

-- 7. Update calculate_user_points function with enhanced scoring
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

-- 8. Recalculate all existing user points with new scoring system
-- This will update all users' points based on the enhanced scoring
DO $$
DECLARE
    user_record RECORD;
    league_record RECORD;
BEGIN
    FOR league_record IN SELECT id FROM leagues LOOP
        FOR user_record IN SELECT user_id FROM league_members WHERE league_id = league_record.id LOOP
            PERFORM calculate_user_points(user_record.user_id, league_record.id);
        END LOOP;
    END LOOP;
END $$;

-- Migration complete!
-- Your Supabase project now supports:
-- - 5 points for exact score predictions
-- - 2 points for correct win margin predictions  
-- - 1 point for correct result only
-- - 3 points for correctly predicting other users' predictions
