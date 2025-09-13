#!/usr/bin/env node

/**
 * Vibe PM Agent - MCP Server Executable
 * 
 * This executable starts the MCP server for integration with Kiro IDE
 * and other MCP-compatible clients.
 */

const path = require('path');
const fs = require('fs');

// Check if we're in development or production
const isDev = process.env.NODE_ENV === 'development';
const serverPath = isDev 
  ? path.join(__dirname, '..', 'src', 'mcp', 'server.ts')
  : path.join(__dirname, '..', 'dist', 'mcp', 'server.js');

// Check if server file exists
if (!fs.existsSync(serverPath)) {
  console.error('❌ MCP server file not found:', serverPath);
  console.error('');
  console.error('🔧 Troubleshooting:');
  console.error('   1. Run "npm run build" to compile TypeScript');
  console.error('   2. Ensure all dependencies are installed with "npm install"');
  console.error('   3. Check that the project built successfully');
  process.exit(1);
}

// Start the server
if (isDev) {
  // Development mode with ts-node
  require('ts-node/register');
  require(serverPath);
} else {
  // Production mode
  require(serverPath);
}