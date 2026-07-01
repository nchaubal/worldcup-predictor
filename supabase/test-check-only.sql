-- Non-destructive test - only checks current state
-- Run this to identify the issue without making changes

-- Check what extensions exist
SELECT extname, extversion FROM pg_extension WHERE extname = 'uuid-ossp';

-- Check what tables currently exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if auth.users table exists and its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users' 
ORDER BY ordinal_position;

-- Check if any of our target tables already exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'leagues', 'match_results', 'group_predictions', 'knockout_predictions', 'user_points', 'prediction_predictions')
ORDER BY table_name, ordinal_position;

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'leagues', 'match_results', 'group_predictions', 'knockout_predictions', 'user_points', 'prediction_predictions')
ORDER BY tablename;
