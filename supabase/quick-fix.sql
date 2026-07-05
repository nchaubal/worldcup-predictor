-- Quick fix: Add missing columns to profiles table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- Add is_admin column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add points columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exact_scores INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correct_margins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS correct_results INTEGER DEFAULT 0;

-- Create allowed_emails table
CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on allowed_emails
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check if email is allowed
CREATE POLICY IF NOT EXISTS "Anyone can check allowed emails" ON allowed_emails
  FOR SELECT USING (true);

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
