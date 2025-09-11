/**
 * Jest test setup with enhanced resource management
 *
 * This setup ensures proper cleanup of timers, resources, and test artifacts
 * to prevent hanging tests and memory leaks.
 */

// Internal imports - test utilities
import { cleanupAfterTest } from './utils/test-cleanup';

// Internal imports - utilities
import { ResourceManager } from '../utils/resource-manager';

// Configure Jest timeout for tests that might take longer
jest.setTimeout(30000); // 30 seconds

// Test setup configuration
beforeEach(() => {
  // Use fake timers to prevent real timers from causing issues
  jest.useFakeTimers();

  // Reset resource manager state
  ResourceManager.getInstance().reset();
});

afterEach(async () => {
  // Run only pending timers and then use real timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();

  // Clear all Jest mocks and timers
  jest.clearAllTimers();
  jest.clearAllMocks();

  // Clean up all tracked resources
  try {
    ResourceManager.getInstance().cleanup();
  } catch (error) {
    console.warn('Resource cleanup warning:', error instanceof Error ? error.message : error);
  }

  // Clean up any test artifacts created during this test with timeout
  try {
    const cleanupPromise = cleanupAfterTest();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cleanup timeout')), 10000)
    );
    await Promise.race([cleanupPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Test cleanup warning:', error instanceof Error ? error.message : error);
  }
}, 15000);

afterAll(async () => {
  // Force cleanup of any remaining handles
  jest.clearAllTimers();
  jest.clearAllMocks();

  // Final resource cleanup
  try {
    ResourceManager.getInstance().destroy();
  } catch (error) {
    console.warn('Final resource cleanup warning:', error instanceof Error ? error.message : error);
  }

  // Final test artifact cleanup
  try {
    await cleanupAfterTest();
  } catch (error) {
    console.warn('Final cleanup warning:', error instanceof Error ? error.message : error);
  }
});
