-- Check existing table structures to identify the exact issue
-- This will show us what columns actually exist in the existing tables

-- Check the structure of existing tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('leagues', 'match_results')
ORDER BY table_name, ordinal_position;

-- Also check what other tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
