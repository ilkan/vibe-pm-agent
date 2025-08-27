module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
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
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts']
};