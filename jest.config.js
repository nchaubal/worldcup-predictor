/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',  // Playwright tests - run separately
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

module.exports = config;
