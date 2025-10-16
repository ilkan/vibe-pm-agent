#!/usr/bin/env node

const crypto = require('crypto');

const targetHash = 'b79b376ba70a93f67050bfd64f3745018bacb4930c7490731389dcc66f6a4cf3';

function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Common test keys to try
const testKeys = [
  'test-api-key-12345678901234567890',
  'dev-client-1',
  'dev-test-key',
  'test-key',
  'api-key-123',
  'development-key',
  'vibe-pm-agent-key',
  'test-api-key'
];

console.log('Looking for API key that matches hash:', targetHash);
console.log('');

for (const key of testKeys) {
  const hash = hashApiKey(key);
  console.log(`Key: "${key}" -> Hash: ${hash} ${hash === targetHash ? '✓ MATCH!' : ''}`);
}

// Let's also try the reverse - what key would produce this hash?
// This is not feasible to brute force, but let's check if it's a simple key
console.log('\nTrying some variations...');

const variations = [
  'test-api-key-12345678901234567890',
  'test-key-123',
  'dev-key-123',
  'api-key-dev',
  'vibe-pm-test-key'
];

for (const key of variations) {
  const hash = hashApiKey(key);
  if (hash === targetHash) {
    console.log(`✓ FOUND: "${key}" produces the target hash!`);
  }
}