# 🚀 Deployment Guide

This guide will help you deploy your World Cup Predictor to production and set up the necessary infrastructure.

## 📋 Prerequisites

- Node.js 18+ installed
- GitHub account
- Vercel account (recommended) or alternative hosting
- Supabase account (for database)

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Choose organization and create new project
4. Wait for project to be ready (2-3 minutes)

### 2. Database Schema
Run these SQL commands in Supabase SQL Editor:

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

### 3. Get Supabase Credentials
1. Go to Project Settings → API
2. Copy Project URL and anon key
3. Create service role key in Settings → API

## 🔐 Authentication Setup

### Install NextAuth
```bash
npm install next-auth @auth/supabase-adapter
```

### Create Auth Configuration
Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import GoogleProvider from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: "jwt",
  },
})
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add NEXTAUTH_SECRET
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   ```

### Option 2: Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=.next
   ```

### Option 3: Self-hosted VPS

1. **Install dependencies on server**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx
   ```

2. **Clone and build**
   ```bash
   git clone your-repo
   cd worldcup-predictor
   npm install
   npm run build
   ```

3. **Setup PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start npm --name "worldcup-predictor" -- start
   ```

4. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔄 CI/CD Setup

### GitHub Actions (Already Configured)
The `.github/workflows/ci.yml` file includes:
- Automated testing on push/PR
- Coverage reporting
- Build verification
- Automatic deployment to Vercel on main branch

### Manual Deployment Steps
1. Push to main branch
2. GitHub Actions will run tests
3. If tests pass, automatic deployment occurs
4. Monitor deployment in Vercel dashboard

## 📊 Monitoring and Analytics

### Add Analytics (Optional)
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🔍 Performance Optimization

### Enable Image Optimization
Next.js automatically optimizes images. Use `next/image` for all images.

### Enable Caching
Add to `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  compress: true,
}

module.exports = nextConfig
```

## 🚨 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Configure properly in Supabase
3. **Rate Limiting**: Implement API rate limiting
4. **HTTPS**: Always use HTTPS in production
5. **Content Security Policy**: Already configured in vercel.json

## 📱 Mobile Optimization

The app is already responsive, but consider:
- PWA capabilities
- Touch-friendly interactions
- Offline functionality

## 🔄 Backup Strategy

### Database Backups
- Supabase automatically backs up data
- Enable point-in-time recovery in Supabase settings
- Export data regularly using Supabase dashboard

### Code Backups
- GitHub hosts your code
- Regular commits to main branch
- Tag releases for major versions

## 📞 Support and Monitoring

### Error Tracking
Consider adding Sentry for error tracking:
```bash
npm install @sentry/nextjs
```

### Uptime Monitoring
- Use UptimeRobot or similar service
- Monitor API endpoints
- Set up alerts for downtime

## 🎯 Post-Deployment Checklist

- [ ] Test all user flows
- [ ] Verify database connections
- [ ] Check authentication flow
- [ ] Test mobile responsiveness
- [ ] Verify SEO meta tags
- [ ] Set up domain and SSL
- [ ] Configure analytics
- [ ] Test error pages
- [ ] Verify performance scores
- [ ] Set up monitoring alerts

## 🚀 Going Live

1. **DNS Configuration**: Point your domain to Vercel/netlify
2. **SSL Certificate**: Auto-configured by hosting provider
3. **Social Media**: Create accounts and share
4. **User Testing**: Invite friends to test
5. **Feedback Collection**: Set up feedback mechanism

Congratulations! Your World Cup Predictor is now live! 🎉
