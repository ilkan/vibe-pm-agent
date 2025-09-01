// Jest test setup

// Test setup configuration
afterEach(() => {
  // Clear all timers after each test to prevent hanging
  jest.clearAllTimers();
  jest.clearAllMocks();
});

afterAll(() => {
  // Force cleanup of any remaining handles
  jest.clearAllTimers();
  jest.clearAllMocks();
});