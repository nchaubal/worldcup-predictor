-- Remove all predictions for user igolu16
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM profiles WHERE username = 'igolu16';
  
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User igolu16 not found';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user ID: %', target_user_id;
  
  -- Delete knockout predictions
  DELETE FROM knockout_predictions WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted knockout predictions';
  
  -- Delete group predictions
  DELETE FROM group_predictions WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted group predictions';
  
  -- Delete prediction predictions (predictor_user_id is the column name)
  DELETE FROM prediction_predictions WHERE predictor_user_id = target_user_id;
  RAISE NOTICE 'Deleted prediction predictions';
  
  -- Reset user points
  DELETE FROM user_points WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted user points';
  
  RAISE NOTICE 'All predictions removed for user igolu16';
END $$;
