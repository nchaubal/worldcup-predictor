-- Adds 7 dummy members to "Demo League 1783053469321" so the leaderboard
-- shows both Division 1 (top 6) and Division 2 (rest), with a deliberately
-- uneven mix of correct/incorrect Round of 32 picks (matching the real R32
-- results already shown in the bracket UI) so the league looks like it's
-- been active since the group stage.
--
-- CAVEATS:
-- 1. These auth.users rows are created directly via SQL (not through the
--    Auth API/signup flow) - an unofficial-but-common seeding pattern. It's
--    fine here since no one needs to actually log in as these accounts, but
--    they don't have a real usable password.
-- 2. Group-stage predictions are skipped: group_predictions doesn't exist
--    in this project, and this app only stores final group *standings*
--    (lib/tournament-data.ts), not per-match historical scores - there's
--    nothing real to seed match_results with for group games without
--    inventing scores the rest of the app doesn't know about.

DO $$
DECLARE
  v_instance_id UUID;
  v_league_id UUID := '92f25427-9638-4eff-808c-c7468e3c8fd1'; -- Demo League 1783053469321
  v_dummy_password TEXT := '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Dt3TZDDh8kkO/eKKW9kIQqmz.KG.a';
  v_users JSONB := '[
    {"username": "alex_predicts",  "avatar": "🦁"},
    {"username": "sara_the_shark", "avatar": "🦈"},
    {"username": "luca_united",    "avatar": "⚡"},
    {"username": "maya_futbol",    "avatar": "🌟"},
    {"username": "diego_derby",    "avatar": "🔥"},
    {"username": "priya_picks",    "avatar": "🎯"},
    {"username": "tom_tactics",    "avatar": "🐯"}
  ]'::jsonb;
  v_user JSONB;
  v_user_id UUID;
  v_new_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;

  FOR v_user IN SELECT * FROM jsonb_array_elements(v_users)
  LOOP
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current, reauthentication_token
    ) VALUES (
      v_instance_id, v_user_id, 'authenticated', 'authenticated',
      (v_user->>'username') || '@demo.worldcup-predictor.local',
      v_dummy_password,
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', v_user->>'username'),
      '', '', '', '', '', ''
    );

    -- on_auth_user_created trigger creates the matching profiles row
    -- automatically (see supabase/schema.sql); just set a distinct avatar.
    UPDATE public.profiles SET avatar = v_user->>'avatar' WHERE id = v_user_id;

    INSERT INTO league_members (league_id, user_id) VALUES (v_league_id, v_user_id);

    v_new_ids := array_append(v_new_ids, v_user_id);
  END LOOP;

  -- Make sure the R32 results these picks get scored against exist
  -- (matches lib/tournament-data.ts R32_MATCHES exactly).
  INSERT INTO match_results (id, match_id, home_team_id, away_team_id, home_score, away_score, actual_winner, completed_at)
  VALUES
    (gen_random_uuid(), 'r32_1', 'rsa', 'can', 0, 1, 'can', NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), 'r32_2', 'ger', 'par', 1, 1, 'par', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), 'r32_3', 'ned', 'mar', 1, 1, 'mar', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), 'r32_4', 'bra', 'jpn', 2, 1, 'bra', NOW() - INTERVAL '4 days'),
    (gen_random_uuid(), 'r32_5', 'fra', 'swe', 3, 0, 'fra', NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), 'r32_6', 'civ', 'nor', 1, 2, 'nor', NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), 'r32_7', 'mex', 'ecu', 2, 0, 'mex', NOW() - INTERVAL '2 days')
  ON CONFLICT (match_id) DO NOTHING;

  -- Knockout picks: uneven mix so the league splits meaningfully.
  -- Actual winners: r32_1 can, r32_2 par, r32_3 mar, r32_4 bra, r32_5 fra, r32_6 nor, r32_7 mex.
  INSERT INTO knockout_predictions (user_id, match_id, winner_team_id) VALUES
    -- alex_predicts: 7/7 correct
    (v_new_ids[1], 'r32_1', 'can'), (v_new_ids[1], 'r32_2', 'par'), (v_new_ids[1], 'r32_3', 'mar'),
    (v_new_ids[1], 'r32_4', 'bra'), (v_new_ids[1], 'r32_5', 'fra'), (v_new_ids[1], 'r32_6', 'nor'),
    (v_new_ids[1], 'r32_7', 'mex'),
    -- sara_the_shark: 5/7 correct
    (v_new_ids[2], 'r32_1', 'can'), (v_new_ids[2], 'r32_2', 'par'), (v_new_ids[2], 'r32_3', 'mar'),
    (v_new_ids[2], 'r32_4', 'bra'), (v_new_ids[2], 'r32_5', 'fra'), (v_new_ids[2], 'r32_6', 'civ'),
    (v_new_ids[2], 'r32_7', 'ecu'),
    -- luca_united: 5/7 correct
    (v_new_ids[3], 'r32_1', 'can'), (v_new_ids[3], 'r32_2', 'ger'), (v_new_ids[3], 'r32_3', 'mar'),
    (v_new_ids[3], 'r32_4', 'bra'), (v_new_ids[3], 'r32_5', 'swe'), (v_new_ids[3], 'r32_6', 'nor'),
    (v_new_ids[3], 'r32_7', 'mex'),
    -- maya_futbol: 5/7 correct
    (v_new_ids[4], 'r32_1', 'rsa'), (v_new_ids[4], 'r32_2', 'par'), (v_new_ids[4], 'r32_3', 'ned'),
    (v_new_ids[4], 'r32_4', 'bra'), (v_new_ids[4], 'r32_5', 'fra'), (v_new_ids[4], 'r32_6', 'nor'),
    (v_new_ids[4], 'r32_7', 'mex'),
    -- diego_derby: 0/7 correct
    (v_new_ids[5], 'r32_1', 'rsa'), (v_new_ids[5], 'r32_2', 'ger'), (v_new_ids[5], 'r32_3', 'ned'),
    (v_new_ids[5], 'r32_4', 'jpn'), (v_new_ids[5], 'r32_5', 'swe'), (v_new_ids[5], 'r32_6', 'civ'),
    (v_new_ids[5], 'r32_7', 'ecu'),
    -- priya_picks: 3/7 correct
    (v_new_ids[6], 'r32_1', 'can'), (v_new_ids[6], 'r32_2', 'par'), (v_new_ids[6], 'r32_3', 'mar'),
    (v_new_ids[6], 'r32_4', 'jpn'), (v_new_ids[6], 'r32_5', 'swe'), (v_new_ids[6], 'r32_6', 'civ'),
    (v_new_ids[6], 'r32_7', 'ecu'),
    -- tom_tactics: 0/7 correct
    (v_new_ids[7], 'r32_1', 'rsa'), (v_new_ids[7], 'r32_2', 'ger'), (v_new_ids[7], 'r32_3', 'ned'),
    (v_new_ids[7], 'r32_4', 'jpn'), (v_new_ids[7], 'r32_5', 'swe'), (v_new_ids[7], 'r32_6', 'civ'),
    (v_new_ids[7], 'r32_7', 'ecu')
  ON CONFLICT (user_id, match_id) DO NOTHING;

  -- Recompute points for every league member now that new picks exist.
  PERFORM calculate_user_points(lm.user_id, v_league_id)
  FROM league_members lm
  WHERE lm.league_id = v_league_id;
END $$;
