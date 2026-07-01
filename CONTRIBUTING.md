# Contributing to World Cup Predictor

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/worldcup-predictor.git
   cd worldcup-predictor
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes

### Making Changes
1. Create a new branch from `develop`
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run tests
   ```bash
   npm test
   npm run test:e2e
   ```
4. Commit with descriptive messages
   ```bash
   git commit -m "feat: add user authentication feature"
   ```
5. Push and create Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

## 🧪 Testing

Before submitting PR:
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Build check: `npm run build`
- Linting: `npm run lint`

## 📁 Project Structure

```
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                # Utilities and data
├── tests/              # Test files
├── public/             # Static assets
└── types/              # TypeScript definitions
```

## 🎯 Areas for Contribution

### High Priority
- [ ] User authentication system
- [ ] Database integration (Supabase)
- [ ] Real-time match updates
- [ ] League management features

### Medium Priority
- [ ] Mobile responsiveness improvements
- [ ] Performance optimizations
- [ ] Additional UI components
- [ ] Accessibility improvements

### Low Priority
- [ ] Dark mode theme
- [ ] Internationalization
- [ ] Advanced statistics
- [ ] Social sharing features

## 🤝 Code Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions
- Write tests for new features
- Keep components small and focused
- Use Tailwind CSS for styling
- Document complex logic

## 🐛 Bug Reports

When reporting bugs, please include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

## 💬 Feature Requests

- Use GitHub Issues for feature requests
- Provide clear use cases
- Consider implementation complexity
- Discuss with team before starting

## 📞 Getting Help

- Create an issue for questions
- Join our Discord (link coming soon)
- Review existing documentation
- Check closed issues for solutions

## 📜 Code of Conduct

Be respectful, inclusive, and collaborative. We're here to build something amazing together!
