// Jest test setup

import { cleanupAfterTest } from './utils/test-cleanup';

// Test setup configuration
afterEach(async () => {
  // Clear all timers after each test to prevent hanging
  jest.clearAllTimers();
  jest.clearAllMocks();
  
  // Clean up any test artifacts created during this test
  try {
    await cleanupAfterTest();
  } catch (error) {
    console.warn('Test cleanup warning:', error instanceof Error ? error.message : error);
  }
});

afterAll(async () => {
  // Force cleanup of any remaining handles
  jest.clearAllTimers();
  jest.clearAllMocks();
  
  // Final cleanup
  try {
    await cleanupAfterTest();
  } catch (error) {
    console.warn('Final cleanup warning:', error instanceof Error ? error.message : error);
  }
});
