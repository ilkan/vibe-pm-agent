module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  forceExit: true,
  detectOpenHandles: true,
  // Increased timeout for complex integration tests
  testTimeout: 60000, // 60 seconds for complex tests
  roots: ['<rootDir>/src/tests'],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modelcontextprotocol/sdk/server/index.js$': '<rootDir>/src/tests/__mocks__/@modelcontextprotocol/sdk/server/index.js',
    '^@modelcontextprotocol/sdk/server/stdio.js$': '<rootDir>/src/tests/__mocks__/@modelcontextprotocol/sdk/server/stdio.js',
    '^@modelcontextprotocol/sdk/types.js$': '<rootDir>/src/tests/__mocks__/@modelcontextprotocol/sdk/types.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  globalTeardown: '<rootDir>/src/tests/global-teardown.ts',
  // Additional Jest configuration for better resource management
  maxWorkers: '50%', // Use half of available CPU cores for better performance
  // Ensure tests don't hang by forcing exit
  forceExit: true,
  // Detect open handles to identify resource leaks
  detectOpenHandles: true,
  // Clear mocks between tests
  clearMocks: true,
  // Reset modules between tests to prevent state leakage
  resetModules: true
};