#!/usr/bin/env node

const crypto = require('crypto');

const testApiKey = 'test-api-key-12345678901234567890';
const expectedHash = '2688f4e126ca5efd4a60022073e6cd90017626e56c3f30b194d53e6299edfe3c';

function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

const actualHash = hashApiKey(testApiKey);

console.log('Test API Key:', testApiKey);
console.log('Expected Hash:', expectedHash);
console.log('Actual Hash:  ', actualHash);
console.log('Match:', actualHash === expectedHash);

// Let's also test what hash we need for our test key
const correctTestKey = 'dev-test-key-123';
const correctHash = hashApiKey(correctTestKey);
console.log('\nAlternative test key:', correctTestKey);
console.log('Alternative hash:', correctHash);