import '@testing-library/jest-dom'

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
})

afterAll(() => {
  // Clean up any global test configuration
})

// Mock console methods in tests to reduce noise
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
