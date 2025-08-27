#!/usr/bin/env node

/**
 * Simple PM Agent MCP Server for testing with Claude Desktop
 */

const { SimplePMAgentMCPServer } = require('../dist/mcp/simple-server');

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
    server = new SimplePMAgentMCPServer();
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