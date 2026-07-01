-- Minimal test to identify the exact issue
-- Run this first to see what's happening

-- Test 1: Check if extension exists
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- Test 2: Try to create extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Test 3: Create a simple table first
CREATE TABLE IF NOT EXISTS test_table (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT
);

-- Test 4: Check if table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_table' 
ORDER BY ordinal_position;

-- Test 5: Try to create profiles table (no dependencies)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar TEXT DEFAULT '⚽',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test 6: Check profiles table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Test 7: Create match_results table (simple, no dependencies)
CREATE TABLE IF NOT EXISTS match_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id TEXT UNIQUE NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  actual_winner TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test 8: Check match_results table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'match_results' 
ORDER BY ordinal_position;

-- Test 9: Create group_predictions table
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

-- Test 10: Check group_predictions table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'group_predictions' 
ORDER BY ordinal_position;

-- Clean up test table
DROP TABLE IF EXISTS test_table;
