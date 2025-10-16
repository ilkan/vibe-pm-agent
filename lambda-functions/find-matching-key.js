#!/usr/bin/env node

const crypto = require('crypto');

const targetHash = '2688f4e126ca5efd4a60022073e6cd90017626e56c3f30b194d53e6299edfe3c';

function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Try some common test keys
const testKeys = [
  'dev-api-key-123',
  'test-key-123',
  'development-key',
  'dev-client-1-key',
  'vibe-pm-agent-dev-key',
  'test-api-key-dev',
  'dev-test-key'
];

console.log('Looking for key that produces hash:', targetHash);
console.log('');

for (const key of testKeys) {
  const hash = hashApiKey(key);
  console.log(`Key: ${key.padEnd(25)} Hash: ${hash} ${hash === targetHash ? '✅ MATCH!' : ''}`);
}

// Let's also try to reverse engineer - this is just for testing
// We'll create a new valid key for testing
const newTestKey = 'vibe-pm-test-key-2024';
const newHash = hashApiKey(newTestKey);
console.log('\n🔑 New test key for our tests:');
console.log('Key:', newTestKey);
console.log('Hash:', newHash);