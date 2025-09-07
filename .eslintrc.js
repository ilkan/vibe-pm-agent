module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  rules: {
    // TypeScript specific rules - relaxed for CI
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/prefer-const': 'off',
    
    // General rules - relaxed for CI
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-duplicate-imports': 'warn',
    'no-unused-expressions': 'off',
    'no-unused-vars': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',
    'no-undef': 'off',
    'prefer-const': 'off',
    'prefer-template': 'off',
    
    // Prettier integration
    'prettier/prettier': 'off', // Disable for now
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    '!.eslintrc.js',
    '!jest.config.js',
  ],
};