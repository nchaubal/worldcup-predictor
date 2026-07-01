# Testing Framework for World Cup Predictor

This document outlines the comprehensive testing framework implemented for the World Cup Predictor application.

## Overview

The testing framework includes:
- **Unit Tests**: Component-level testing with Jest and React Testing Library
- **Integration Tests**: Page-level functionality testing
- **E2E Tests**: Full user workflow testing with Playwright

## Test Structure

```
tests/
├── unit/
│   └── components/
│       ├── Navbar.test.tsx
│       ├── MatchPredictionCard.test.tsx
│       └── ui/
│           ├── Button.test.tsx
│           └── Card.test.tsx
├── integration/
│   └── HomePage.test.tsx
├── e2e/
│   ├── homepage.spec.ts
│   ├── prediction-workflow.spec.ts
│   ├── navigation.spec.ts
│   └── league-workflow.spec.ts
├── helpers/
│   └── test-utils.tsx
└── setup.ts
```

## Running Tests

### Unit & Integration Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

## Test Coverage Areas

### 1. Homepage Features
- Hero section rendering
- Tournament statistics display
- Match results and live updates
- Group standings
- Navigation functionality
- Responsive design

### 2. Navigation System
- Active state management
- Route navigation
- Mobile responsiveness
- Browser back/forward support
- Direct URL access

### 3. Match Prediction System
- Score input validation
- Prediction persistence
- AI prediction toggle
- Real-time updates
- Error handling

### 4. Bracket Building
- Match selection
- Progress tracking
- Round navigation
- Validation logic
- Visual feedback

### 5. League Management
- League creation
- Member management
- Invite functionality
- Social features
- Settings configuration

### 6. UI Components
- Button variants and states
- Card component structure
- Form inputs
- Modal dialogs
- Responsive behavior

## Testing Best Practices

### Unit Tests
- Test component behavior in isolation
- Mock external dependencies
- Test user interactions
- Verify state changes
- Check accessibility

### Integration Tests
- Test component interactions
- Mock API calls
- Test routing behavior
- Verify data flow
- Check error boundaries

### E2E Tests
- Test complete user workflows
- Use realistic test data
- Test across multiple browsers
- Verify responsive design
- Check performance

## Configuration Files

### Jest Configuration (`jest.config.js`)
- Next.js integration
- Path aliases
- Coverage thresholds
- Test environment setup

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing
- Mobile viewport testing
- Screenshot/video capture
- Dev server integration

## Mock Data

The test suite includes comprehensive mock data:
- Team information
- Match schedules
- Tournament brackets
- User predictions
- League data

## Continuous Integration

Configure CI to run:
1. Unit and integration tests on all PRs
2. E2E tests on merge to main
3. Coverage reporting
4. Performance regression testing

## Debugging Tests

### Unit Tests
- Use `npm run test:watch` for interactive debugging
- Add `console.log` statements for temporary debugging
- Use VS Code debugger with Jest extension

### E2E Tests
- Use `npm run test:e2e:debug` for step-by-step execution
- Enable headful mode for visual debugging
- Use Playwright Inspector for element inspection

## Adding New Tests

1. **Unit Tests**: Add to `tests/unit/components/`
2. **Integration Tests**: Add to `tests/integration/`
3. **E2E Tests**: Add to `tests/e2e/`
4. **Helpers**: Add utilities to `tests/helpers/`

Follow the established patterns and naming conventions for consistency.

## Test Data Management

- Use factory functions for test data creation
- Keep test data isolated and predictable
- Use consistent naming conventions
- Document complex test scenarios

## Performance Considerations

- Use `screen` queries efficiently
- Avoid unnecessary waits
- Mock heavy computations
- Use appropriate selectors
- Clean up after tests

## Accessibility Testing

- Verify ARIA labels
- Test keyboard navigation
- Check color contrast
- Validate semantic HTML
- Test screen reader compatibility
