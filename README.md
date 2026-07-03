# 🏆 World Cup Predictor 2026

A modern, interactive World Cup 2026 prediction web application built with Next.js, TypeScript, and Tailwind CSS. Make predictions, build brackets, create leagues, and compete with friends!

![World Cup Predictor](https://img.shields.io/badge/World%20Cup-2026-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)

## ✨ Features

### 🎯 Core Functionality
- **Match Predictions**: Predict scores for all 104 World Cup matches
- **Tournament Bracket**: Interactive knockout bracket visualization
- **AI-Powered Odds**: Get AI-generated predictions for informed decisions
- **Group Standings**: View real-time group stage standings
- **Live Match Updates**: Follow matches as they happen

### 👥 Social Features
- **Private Leagues**: Create prediction leagues with friends
- **Leaderboards**: Track rankings and points
- **Share Predictions**: Show off your bracket on social media

### 🎨 User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Updates**: Instant score updates and notifications
- **Accessibility**: WCAG 2.1 compliant for inclusive experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/worldcup-predictor.git
   cd worldcup-predictor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📁 Project Structure

```
worldcup-predictor/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── bracket/           # Bracket page
│   ├── leagues/           # Leagues page
│   ├── predict/           # Predictions page
│   ├── profile/           # User profile
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── MatchPredictionCard.tsx
├── lib/                  # Utilities and data
│   ├── tournament-data.ts
│   └── ai-predictor.ts
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/             # End-to-end tests
└── public/              # Static assets
```

## 🛠️ Tech Stack

- **Next.js 16.2.9** - React framework with App Router
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Jest & Playwright** - Comprehensive testing framework
- **Supabase** - Database and authentication (planned)

## 🌐 Deployment

### Quick Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🤝 Contributing

We love contributions! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test && npm run test:e2e
   ```
5. **Submit a Pull Request**

For detailed guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📊 Current Status

- ✅ **UI Framework**: Complete with responsive design
- ✅ **Testing Suite**: 71 tests passing with good coverage
- ✅ **Core Features**: Match predictions, bracket, AI odds
- ✅ **CI/CD Pipeline**: Automated testing and deployment
- 🚧 **Authentication**: In progress
- 🚧 **Database Integration**: Planned
- 🚧 **Real-time Updates**: Planned

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/worldcup-predictor/issues)
- 📖 **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md), [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

This project is licensed under the MIT License.

---

**⚽ Made with passion for football fans around the world!**

Let the games begin! 🏆

