#!/usr/bin/env node

/**
 * Vibe PM Agent - MCP Server Executable
 * 
 * Simple and stable MCP server for integration with Kiro IDE
 * and other MCP-compatible clients.
 */

const { PMAgentMCPServer } = require('../dist/mcp/server');

// Global error handlers - no console output for MCP
process.on('uncaughtException', (error) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});

// Graceful shutdown
let server = null;

async function gracefulShutdown(signal) {
  if (server) {
    try {
      await server.stop();
    } catch (error) {
      // Silent error handling for MCP
    }
  }
  
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
async function startServer() {
  try {
    server = new PMAgentMCPServer();
    await server.start();
    
    // Keep the process alive - no console output for MCP
    process.stdin.resume();
    
  } catch (error) {
    process.exit(1);
  }
}

startServer().catch((error) => {
  process.exit(1);
});