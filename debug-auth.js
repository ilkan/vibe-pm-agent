// Debug script to test authentication flow
const jwt = require('jsonwebtoken');

// Test token decoding (without verification)
function debugToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('Token Header:', decoded.header);
    console.log('Token Payload:', decoded.payload);
    console.log('Token Type:', decoded.payload.token_use);
    console.log('Audience:', decoded.payload.aud);
    console.log('Issuer:', decoded.payload.iss);
  } catch (error) {
    console.error('Token decode error:', error.message);
  }
}

console.log('🔍 Debug Authentication');
console.log('To debug your token:');
console.log('1. Open browser dev tools');
console.log('2. Go to Network tab');
console.log('3. Send a message in chat');
console.log('4. Find the request to localhost:3001/invoke');
console.log('5. Copy the Authorization header value (without "Bearer ")');
console.log('6. Run: node debug-auth.js "YOUR_TOKEN_HERE"');

if (process.argv[2]) {
  console.log('\n📋 Analyzing token...');
  debugToken(process.argv[2]);
}