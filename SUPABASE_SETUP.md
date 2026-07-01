# Supabase Setup Guide

Follow these steps to set up Supabase for your World Cup Predictor app.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign in with GitHub
4. Click "New Project"
5. Select your organization
6. Enter project details:
   - **Name**: `worldcup-predictor`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
7. Click "Create new project"
8. Wait for project to be created (2-3 minutes)

## 2. Get Project Credentials

1. Go to Project Settings → API
2. Copy the **Project URL** and **anon key**
3. Create a `.env.local` file in your project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## 3. Set Up Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL script
4. This will create all necessary tables and functions

## 4. Set Up Authentication

1. Go to Authentication → Settings
2. Configure email settings (optional, for development you can skip)
3. Enable providers you want (Email is enabled by default)

## 5. Create Mock Users

### Option A: Via Supabase Dashboard (Recommended for testing)

1. Go to Authentication → Users
2. Click "Add user"
3. Create these test users:

| Email | Password | Username |
|-------|----------|----------|
| alex@worldcup.com | password123 | alex_martinez |
| sarah@worldcup.com | password123 | sarah_chen |
| marcus@worldcup.com | password123 | marcus_johnson |
| emily@worldcup.com | password123 | emily_rodriguez |
| david@worldcup.com | password123 | david_kim |

### Option B: Via SQL Script

1. Go to SQL Editor
2. Copy the contents of `supabase/seed-data.sql`
3. Run the script (this will create profiles and mock data)

## 6. Set Up Row Level Security (RLS)

The schema.sql already includes RLS policies, but verify:

1. Go to Authentication → Settings
2. Ensure "Enable Row Level Security (RLS)" is ON
3. Go to Database → Tables
4. Click on each table and verify RLS is enabled

## 7. Test the Connection

1. Install dependencies if needed:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Test locally:
   ```bash
   npm run dev
   ```

3. Visit the app and test authentication

## 8. Deploy Environment Variables

For Vercel deployment:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add the same variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 9. Verify Everything Works

1. **Authentication**: Try signing in with test users
2. **Leagues**: Create/join leagues should work
3. **Predictions**: Making predictions should save to database
4. **Analytics**: Leaderboard should show real data

## Troubleshooting

### Common Issues:

1. **"Invalid JWT" errors**: 
   - Check your environment variables
   - Ensure user is authenticated

2. **"Row level security" errors**:
   - Verify RLS policies are set up correctly
   - Check user has proper permissions

3. **Database connection issues**:
   - Verify Supabase URL and keys are correct
   - Check network connectivity

### Reset Database:

If you need to start fresh:

1. Go to SQL Editor
2. Run: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
3. Re-run the schema.sql script
4. Re-run the seed-data.sql script

## Next Steps

Once Supabase is set up:

1. The app will automatically use Supabase instead of mock data
2. Real user authentication will work
3. Data will persist across sessions
4. Multiple users can interact simultaneously

## Production Considerations

For production:

1. Enable proper email delivery in Auth settings
2. Set up custom domain (optional)
3. Configure database backups
4. Monitor usage and performance
5. Set up proper CORS if needed
