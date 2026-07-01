# ⚽ Live Scores Integration Setup Guide

This guide will help you set up real-time live scores for your World Cup Predictor using API-Football.

## 🏆 API Options

### Recommended: API-Football
- **Coverage**: World Cup 2026 + 1000+ competitions
- **Features**: Live scores, fixtures, standings, statistics
- **Free Tier**: 100 calls/day (good for testing)
- **Paid Plans**: From €9.99/month
- **Real-time**: Updates every 10 seconds

### Alternative Options
- **Football-Data.org**: 10 calls/minute, €15/month
- **SportMonks**: 500 requests/month, €25/month

## 🚀 Quick Setup with API-Football

### 1. Get API-Football Account
1. Go to [api-football.com](https://www.api-football.com)
2. Sign up for free account
3. Choose the free plan to start
4. Verify your email

### 2. Get Your API Key
1. Go to your dashboard
2. Find your API key (looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
3. Copy the key

### 3. Add Environment Variables
Add this to your `.env.local` file:
```env
NEXT_PUBLIC_API_FOOTBALL_KEY=your_api_key_here
```

### 4. Deploy with Live Scores
```bash
git add .
git commit -m "Add live scores integration"
git push origin main
vercel --prod
```

## 🔧 Configuration Options

### Polling Interval
The live scores update every 30 seconds by default. You can change this:

```typescript
// In hooks/useLiveScores.ts
const { matches } = useLiveScores(15000); // 15 seconds
```

### Supported Competitions
The system is configured for World Cup (league ID: 2) but can be extended:

```typescript
// In lib/live-scores.ts
// Change league ID for different competitions
await fetch(`${this.baseUrl}/fixtures?live=all&league=39`); // Premier League
```

## 📱 Features Available

### ✅ Currently Implemented
- **Live Match Updates**: Real-time scores every 30 seconds
- **Match Status**: LIVE, HALF-TIME, FULL TIME, etc.
- **Live/Upcoming Toggle**: Switch between live and all matches
- **Auto-refresh**: Manual refresh button
- **Error Handling**: Graceful fallback when API is down
- **Responsive Design**: Works on all devices

### 🚧 Future Enhancements
- **Push Notifications**: Webhook support for instant updates
- **Match Highlights**: Video clips integration
- **Detailed Statistics**: Player stats, possession, etc.
- **Audio Commentary**: Live audio feed
- **Betting Odds Integration**: Real-time odds updates

## 🌍 API Endpoints Used

### Live Matches
```
GET https://v3.football.api-sports.io/fixtures?live=all&league=2
```

### Specific Match
```
GET https://v3.football.api-sports.io/fixtures?id={fixtureId}
```

### World Cup Fixtures
```
GET https://v3.football.api-sports.io/fixtures?league=2&season=2026
```

## 📊 Rate Limits & Usage

### Free Tier (100 calls/day)
- **Recommended**: Poll every 15 minutes (96 calls/day)
- **Live Mode**: Poll every 5 minutes during matches only
- **Backup**: Use cached data when limit reached

### Paid Tier (€9.99/month)
- **10,000 calls/day**
- **Real-time polling**: Every 10 seconds
- **Full coverage**: All competitions

## 🔍 Troubleshooting

### Common Issues

**"API_FOOTBALL_KEY environment variable is required"**
- Add the key to `.env.local`
- Restart your development server
- Deploy to Vercel with environment variables

**"HTTP error! status: 403"**
- Check your API key is correct
- Verify you haven't exceeded rate limits
- Ensure your subscription is active

**"No live matches at the moment"**
- This is normal when no World Cup matches are currently live
- Toggle "All Matches" to see scheduled games
- Check match schedule for upcoming fixtures

### Debug Mode
Enable debug logging:
```typescript
// In lib/live-scores.ts
console.log('Fetching live matches:', response);
```

## 💰 Cost Analysis

### Free Plan (Testing)
- **Cost**: $0
- **Calls**: 100/day
- **Refresh**: Every 15 minutes
- **Good for**: Development and small-scale testing

### Basic Plan ($9.99/month)
- **Cost**: ~$0.33/day
- **Calls**: 10,000/day
- **Refresh**: Every 10 seconds
- **Good for**: Production with live updates

### Pro Plan ($49.99/month)
- **Cost**: ~$1.67/day
- **Calls**: 100,000/day
- **Features**: Push notifications, webhooks
- **Good for**: Large-scale applications

## 🚀 Production Deployment

### Vercel Environment Variables
Add these in Vercel dashboard:
```
NEXT_PUBLIC_API_FOOTBALL_KEY=your_production_key
```

### Monitoring
- Monitor API usage in API-Football dashboard
- Set up alerts for rate limit approaching
- Use Vercel Analytics to track performance

## 🎯 Best Practices

1. **Start with Free Plan**: Test thoroughly before upgrading
2. **Implement Caching**: Reduce API calls with smart caching
3. **Error Handling**: Graceful degradation when API is down
4. **Rate Limiting**: Respect API limits to avoid suspension
5. **User Experience**: Show loading states and error messages

## 📞 Support

- **API-Football Support**: support@api-football.com
- **Documentation**: [api-football.com/documentation](https://www.api-football.com/documentation)
- **Community**: Discord server available

## 🔄 Alternative Setup

If API-Football doesn't work for you, the code is structured to easily switch providers:

1. Update `lib/live-scores.ts` with new API endpoints
2. Modify the interface types to match new API response
3. Update environment variables
4. Test and deploy

The hook `useLiveScores.ts` will work with any API that follows the same pattern!
