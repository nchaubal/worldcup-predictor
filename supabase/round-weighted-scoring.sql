-- Round-weighted, standings-adjusted knockout scoring.
-- Run this once in the Supabase SQL Editor against the existing schema.
--
-- Rule: knockout-round correct picks are worth more as the tournament goes
-- on (R16 1.25x, QF 1.5x, SF 2x, Final 3x; R32/group stage unaffected), and
-- that multiplier is further scaled by a "punish the leader" adjustment
-- locked in once per league when the knockout stage begins:
--   standingMultiplier = 0.7 + 0.8 x normalizedRank
--   normalizedRank = (yourRank - 1) / (totalPlayers - 1)   -- 0 = 1st, 1 = last
-- So in a 10-player league, 1st place gets 0.7x on knockout points, last
-- place gets 1.5x, everyone else interpolated smoothly in between.

-- 1. Stores each member's locked-in multiplier. Snapshotted once via
--    snapshot_knockout_standings() below - there's no automatic
--    round-transition trigger in this app (match results are entered
--    manually), so this must be called explicitly when the knockout stage
--    starts for a league (exposed as a button for the league creator).
CREATE TABLE IF NOT EXISTS knockout_standing_snapshot (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_rank INTEGER NOT NULL,
  total_players INTEGER NOT NULL,
  standing_multiplier NUMERIC(4,3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

ALTER TABLE knockout_standing_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own league snapshot" ON knockout_standing_snapshot;
CREATE POLICY "Users can view own league snapshot" ON knockout_standing_snapshot
  FOR SELECT USING (
    user_id = auth.uid() OR
    league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
  );

-- 2. Knockout points now vary per-pick (round weight x standing multiplier),
--    so they can't be reconstructed in the UI as count x fixed-weight the
--    way exact/margin/result/prediction can. Track the total separately.
ALTER TABLE user_points ADD COLUMN IF NOT EXISTS knockout_points INTEGER DEFAULT 0;

-- 3. Locks in each member's standing multiplier for the rest of the
--    tournament based on current total_points rank at call time.
CREATE OR REPLACE FUNCTION snapshot_knockout_standings(p_league_id UUID)
RETURNS void AS $$
DECLARE
  member_count INTEGER;
BEGIN
  -- Refresh everyone's total first so ranking reflects current standings.
  PERFORM calculate_user_points(lm.user_id, p_league_id)
  FROM league_members lm
  WHERE lm.league_id = p_league_id;

  SELECT COUNT(*) INTO member_count FROM league_members WHERE league_id = p_league_id;

  INSERT INTO knockout_standing_snapshot (league_id, user_id, snapshot_rank, total_players, standing_multiplier)
  SELECT
    p_league_id,
    ranked.user_id,
    ranked.rnk,
    member_count,
    0.7 + 0.8 * ((ranked.rnk - 1)::numeric / GREATEST(member_count - 1, 1))
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) AS rnk
    FROM user_points
    WHERE league_id = p_league_id
  ) ranked
  ON CONFLICT (league_id, user_id) DO UPDATE SET
    snapshot_rank = EXCLUDED.snapshot_rank,
    total_players = EXCLUDED.total_players,
    standing_multiplier = EXCLUDED.standing_multiplier,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. calculate_user_points, updated: group-stage scoring (exact/margin/
--    result) and prediction-predictions are unchanged. Knockout points are
--    now round-weighted then multiplied by the locked-in standing
--    multiplier (defaults to 1.0 - no adjustment - until a snapshot exists).
--    MUST stay SECURITY DEFINER (see LANGUAGE clause at the end) - it
--    writes to user_points on behalf of every league member, not just the
--    caller, which plain callers have no RLS grant to do. CREATE OR REPLACE
--    does not preserve this from a prior version, so any future edit to
--    this function must keep re-specifying it.
CREATE OR REPLACE FUNCTION calculate_user_points(p_user_id UUID, p_league_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER := 0;
    exact_count INTEGER := 0;
    margin_count INTEGER := 0;
    result_count INTEGER := 0;
    prediction_count INTEGER := 0;
    knockout_points_raw NUMERIC := 0;
    knockout_points_val INTEGER := 0;
    standing_multiplier NUMERIC := 1.0;
BEGIN
    -- Calculate points from group predictions
    SELECT
        COALESCE(SUM(
            CASE
                WHEN mr.home_score = gp.home_score AND mr.away_score = gp.away_score THEN 5
                WHEN (mr.home_score - mr.away_score) = (gp.home_score - gp.away_score) THEN 2
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

    -- Standing multiplier locked in via snapshot_knockout_standings(); 1.0
    -- (no adjustment) until a snapshot has been taken for this league.
    SELECT kss.standing_multiplier INTO standing_multiplier
    FROM knockout_standing_snapshot kss
    WHERE kss.league_id = p_league_id AND kss.user_id = p_user_id;
    standing_multiplier := COALESCE(standing_multiplier, 1.0);

    -- Calculate points from knockout predictions: round-weighted, then
    -- standing-adjusted.
    SELECT COALESCE(SUM(
        CASE
            WHEN kp.winner_team_id = mr.actual_winner THEN
                2 * (
                    CASE
                        WHEN kp.match_id LIKE 'r16_%' THEN 1.25
                        WHEN kp.match_id LIKE 'qf_%'  THEN 1.5
                        WHEN kp.match_id LIKE 'sf_%'  THEN 2.0
                        WHEN kp.match_id = 'final'    THEN 3.0
                        ELSE 1.0
                    END
                ) * standing_multiplier
            ELSE 0
        END
    ), 0)
    INTO knockout_points_raw
    FROM knockout_predictions kp
    LEFT JOIN match_results mr ON kp.match_id = mr.match_id
    WHERE kp.user_id = p_user_id AND mr.completed_at IS NOT NULL;

    knockout_points_val := ROUND(knockout_points_raw)::INTEGER;
    total_points := total_points + knockout_points_val;

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

    -- Update user points table
    INSERT INTO user_points (user_id, league_id, total_points, exact_predictions, margin_predictions, result_predictions, prediction_predictions, knockout_points, last_calculated_at)
    VALUES (p_user_id, p_league_id, total_points, exact_count, margin_count, result_count, prediction_count, knockout_points_val, NOW())
    ON CONFLICT (user_id, league_id)
    DO UPDATE SET
        total_points = EXCLUDED.total_points,
        exact_predictions = EXCLUDED.exact_predictions,
        margin_predictions = EXCLUDED.margin_predictions,
        result_predictions = EXCLUDED.result_predictions,
        prediction_predictions = EXCLUDED.prediction_predictions,
        knockout_points = EXCLUDED.knockout_points,
        last_calculated_at = EXCLUDED.last_calculated_at;

    RETURN total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
