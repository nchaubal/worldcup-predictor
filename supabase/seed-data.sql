-- Seed data for World Cup Predictor
-- Run this after creating the schema

-- Insert mock users (these would normally be created via Auth, but for demo purposes)
-- Note: In production, you'd create these users through Supabase Auth first
INSERT INTO profiles (id, username, avatar) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'alex_martinez', '🏆'),
('550e8400-e29b-41d4-a716-446655440002', 'sarah_chen', '🎯'),
('550e8400-e29b-41d4-a716-446655440003', 'marcus_johnson', '⚽'),
('550e8400-e29b-41d4-a716-446655440004', 'emily_rodriguez', '🌟'),
('550e8400-e29b-41d4-a716-446655440005', 'david_kim', '🔥')
ON CONFLICT (id) DO NOTHING;

-- Create demo league
INSERT INTO leagues (id, name, code, created_by) VALUES
('demo-league-2026', 'World Cup 2026 Demo League', 'DEMO26', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- Add users to demo league
INSERT INTO league_members (league_id, user_id) VALUES
('demo-league-2026', '550e8400-e29b-41d4-a716-446655440001'),
('demo-league-2026', '550e8400-e29b-41d4-a716-446655440002'),
('demo-league-2026', '550e8400-e29b-41d4-a716-446655440003'),
('demo-league-2026', '550e8400-e29b-41d4-a716-446655440004'),
('demo-league-2026', '550e8400-e29b-41d4-a716-446655440005')
ON CONFLICT (league_id, user_id) DO NOTHING;

-- Insert some mock predictions for each user
-- Alex Martinez predictions
INSERT INTO group_predictions (user_id, match_id, home_score, away_score, predicted_winner) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'r32_1', 2, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440001', 'r32_2', 1, 1, 'draw'),
('550e8400-e29b-41d4-a716-446655440001', 'r32_3', 3, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440001', 'r32_4', 2, 2, 'draw'),
('550e8400-e29b-41d4-a716-446655440001', 'r32_5', 1, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440001', 'r32_6', 2, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440001', 'r32_7', 1, 2, 'away'),
('550e8400-e29b-41d4-a716-446655440001', 'r32_8', 0, 1, 'away')
ON CONFLICT (user_id, match_id) DO NOTHING;

-- Sarah Chen predictions
INSERT INTO group_predictions (user_id, match_id, home_score, away_score, predicted_winner) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'r32_1', 1, 1, 'draw'),
('550e8400-e29b-41d4-a716-446655440002', 'r32_2', 2, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440002', 'r32_3', 2, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440002', 'r32_4', 1, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440002', 'r32_5', 2, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440002', 'r32_6', 1, 1, 'draw'),
('550e8400-e29b-41d4-a716-446655440002', 'r32_7', 2, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440002', 'r32_8', 1, 0, 'home')
ON CONFLICT (user_id, match_id) DO NOTHING;

-- Marcus Johnson predictions (top performer)
INSERT INTO group_predictions (user_id, match_id, home_score, away_score, predicted_winner) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'r32_1', 2, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440003', 'r32_2', 1, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440003', 'r32_3', 3, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440003', 'r32_4', 2, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440003', 'r32_5', 1, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440003', 'r32_6', 3, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440003', 'r32_7', 1, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440003', 'r32_8', 2, 0, 'home')
ON CONFLICT (user_id, match_id) DO NOTHING;

-- Emily Rodriguez predictions
INSERT INTO group_predictions (user_id, match_id, home_score, away_score, predicted_winner) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'r32_1', 0, 1, 'away'),
('550e8400-e29b-41d4-a716-446655440004', 'r32_2', 0, 2, 'away'),
('550e8400-e29b-41d4-a716-446655440004', 'r32_3', 1, 2, 'away'),
('550e8400-e29b-41d4-a716-446655440004', 'r32_4', 0, 1, 'away'),
('550e8400-e29b-41d4-a716-446655440004', 'r32_5', 1, 2, 'away'),
('550e8400-e29b-41d4-a716-446655440004', 'r32_6', 0, 1, 'away'),
('550e8400-e29b-41d4-a716-446655440004', 'r32_7', 0, 2, 'away'),
('550e8400-e29b-41d4-a716-446655440004', 'r32_8', 1, 2, 'away')
ON CONFLICT (user_id, match_id) DO NOTHING;

-- David Kim predictions
INSERT INTO group_predictions (user_id, match_id, home_score, away_score, predicted_winner) VALUES
('550e8400-e29b-41d4-a716-446655440005', 'r32_1', 1, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440005', 'r32_2', 2, 2, 'draw'),
('550e8400-e29b-41d4-a716-446655440005', 'r32_3', 2, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440005', 'r32_4', 1, 1, 'draw'),
('550e8400-e29b-41d4-a716-446655440005', 'r32_5', 2, 1, 'home'),
('550e8400-e29b-41d4-a716-446655440005', 'r32_6', 1, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440005', 'r32_7', 2, 0, 'home'),
('550e8400-e29b-41d4-a716-446655440005', 'r32_8', 0, 0, 'draw')
ON CONFLICT (user_id, match_id) DO NOTHING;

-- Insert some knockout predictions
INSERT INTO knockout_predictions (user_id, match_id, winner_team_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'r16_1', 'mex'),
('550e8400-e29b-41d4-a716-446655440001', 'r16_2', 'fra'),
('550e8400-e29b-41d4-a716-446655440001', 'r16_3', 'bra'),
('550e8400-e29b-41d4-a716-446655440001', 'r16_4', 'eng'),
('550e8400-e29b-41d4-a716-446655440002', 'r16_1', 'can'),
('550e8400-e29b-41d4-a716-446655440002', 'r16_2', 'par'),
('550e8400-e29b-41d4-a716-446655440002', 'r16_3', 'nor'),
('550e8400-e29b-41d4-a716-446655440002', 'r16_4', 'eng'),
('550e8400-e29b-41d4-a716-446655440003', 'r16_1', 'mex'),
('550e8400-e29b-41d4-a716-446655440003', 'r16_2', 'fra'),
('550e8400-e29b-41d4-a716-446655440003', 'r16_3', 'bra'),
('550e8400-e29b-41d4-a716-446655440003', 'r16_4', 'eng')
ON CONFLICT (user_id, match_id) DO NOTHING;

-- Insert some mock match results for scoring
INSERT INTO match_results (match_id, home_score, away_score, actual_winner, completed_at) VALUES
('r32_1', 2, 1, 'home', NOW() - INTERVAL '2 hours'),
('r32_2', 1, 1, 'draw', NOW() - INTERVAL '4 hours'),
('r32_3', 3, 0, 'home', NOW() - INTERVAL '6 hours'),
('r32_4', 2, 2, 'draw', NOW() - INTERVAL '8 hours')
ON CONFLICT (match_id) DO NOTHING;

-- Calculate initial points for all users in the demo league
SELECT calculate_user_points(user_id, 'demo-league-2026')
FROM league_members 
WHERE league_id = 'demo-league-2026';
