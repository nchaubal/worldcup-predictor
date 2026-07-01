# 🚀 Step-by-Step Deployment Guide

Follow these exact steps to deploy your World Cup Predictor to production.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account created
- GitHub account created
- Vercel account created

## 🔐 Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Choose organization (create if needed)
4. Enter project name: `worldcup-predictor`
5. Set database password (save it securely)
6. Choose region closest to your users
7. Click "Create new project"
8. Wait 2-3 minutes for project to be ready

### 1.2 Get Supabase Credentials
1. In your Supabase project, go to **Settings → API**
2. Copy these values (you'll need them later):
   - **Project URL** (looks like: `https://xxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 1.3 Run Database Schema
1. In Supabase, go to **SQL Editor**
2. Click "New query"
3. Copy and paste this entire SQL script:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id VARCHAR(50) NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  predicted_winner VARCHAR(50),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);

-- League members table
CREATE TABLE league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- Match results table
CREATE TABLE match_results (
  id VARCHAR(50) PRIMARY KEY,
  home_team_id VARCHAR(50) NOT NULL,
  away_team_id VARCHAR(50) NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  status VARCHAR(20) DEFAULT 'upcoming',
  venue TEXT,
  match_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own predictions" ON predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON predictions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Leagues are publicly viewable" ON leagues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join leagues" ON league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
```

4. Click "Run" to execute the schema
5. You should see "Success" message

### 1.4 Set Up Authentication
1. In Supabase, go to **Authentication → Settings**
2. Under **Site URL**, enter: `http://localhost:3000` (for now)
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`
4. Go to **Authentication → Providers**
5. Enable **Google** provider (if you want Google login)
6. Save your Google Client ID and Secret (you'll need to create these in Google Console)

## 🐙 Step 2: GitHub Setup

### 2.1 Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "+" → "New repository"
3. Repository name: `worldcup-predictor`
4. Description: `Interactive World Cup 2026 prediction web app`
5. Choose **Public** (so friends can contribute)
6. Check "Add a README file"
7. Click "Create repository"

### 2.2 Push Your Code
Open your terminal and run these commands:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: World Cup Predictor with testing framework"

# Add remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/worldcup-predictor.git

# Push to GitHub
git push -u origin main
```

### 2.3 Set Up GitHub Secrets for Deployment
1. In your GitHub repository, go to **Settings → Secrets and variables → Actions**
2. Click "New repository secret" and add these:
   - `VERCEL_TOKEN`: Your Vercel token (get from Vercel dashboard → Settings → Tokens)
   - `ORG_ID`: Your Vercel organization ID
   - `PROJECT_ID`: Your Vercel project ID

## 🌐 Step 3: Vercel Setup

### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 3.2 Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate in your browser.

### 3.3 Deploy to Vercel
```bash
# From your project directory
vercel --prod
```

### 3.4 Set Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Go to **Settings → Environment Variables**
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate_random_secret_here
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

## 🔧 Step 4: Local Environment Setup

### 4.1 Create Local Environment File
```bash
cp env.example .env.local
```

### 4.2 Edit .env.local
Open `.env.local` and add your credentials:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=World Cup Predictor 2026

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Development
NODE_ENV=development
```

## 🧪 Step 5: Test Local Setup

### 5.1 Install Additional Dependencies
```bash
npm install @supabase/supabase-js next-auth @auth/supabase-adapter
```

### 5.2 Test Your App
```bash
npm run dev
```
Open http://localhost:3000 and verify everything works.

## 🚀 Step 6: Final Deployment

### 6.1 Commit and Push Changes
```bash
git add .
git commit -m "Add Supabase integration and deployment configuration"
git push origin main
```

### 6.2 Deploy to Production
```bash
vercel --prod
```

### 6.3 Update Supabase URLs
1. Go back to Supabase → Authentication → Settings
2. Update **Site URL** to your Vercel URL: `https://your-app.vercel.app`
3. Update **Redirect URLs** to: `https://your-app.vercel.app/auth/callback`

### 6.4 Redeploy
```bash
vercel --prod
```

## ✅ Step 7: Verify Deployment

1. **Visit your app**: Go to your Vercel URL
2. **Test functionality**: Try making predictions
3. **Check database**: Verify data is being saved in Supabase
4. **Test authentication**: Try logging in with Google

## 🤝 Step 8: Invite Collaborators

### 8.1 Add Friends as Collaborators
1. In GitHub, go to **Settings → Collaborators**
2. Add your friends' GitHub usernames
3. They'll receive invitations to contribute

### 8.2 Share with Friends
Share your Vercel URL and GitHub repository link with friends!

## 🔧 Troubleshooting

### Common Issues:

**Build fails on Vercel:**
- Check environment variables are set correctly
- Verify all dependencies are installed
- Check the build logs for specific errors

**Database connection issues:**
- Verify Supabase URL and keys are correct
- Check RLS policies are properly set
- Ensure authentication is configured

**Authentication not working:**
- Verify NextAuth secret is set
- Check redirect URLs in Supabase
- Ensure Google OAuth is configured properly

## 🎉 Success!

Your World Cup Predictor is now live and ready for friends to contribute! 

**Next steps:**
- Share the GitHub repo with friends
- Start collaborating on new features
- Monitor your app's performance
- Gather feedback and iterate

**Need help?** Check the logs in Vercel and Supabase for any issues.
