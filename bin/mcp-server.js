#!/usr/bin/env node

/**
 * PM Agent Intent Optimizer MCP Server
 * Executable entry point for the MCP server
 */

const { PMAgentMCPServer } = require('../dist/mcp/server');
const { MCPLogger } = require('../dist/utils/mcp-error-handling');
const { LogLevel } = require('../dist/models/mcp');

// Command line argument parsing
const args = process.argv.slice(2);
const config = {
  logLevel: LogLevel.INFO,
  enableLogging: true,
  enableMetrics: true,
  enableHealthCheck: false,
  port: null, // MCP uses stdio by default
  configFile: null
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--log-level':
    case '-l':
      const level = args[++i];
      if (level && Object.values(LogLevel).includes(level)) {
        config.logLevel = level;
      } else {
        console.error(`Invalid log level: ${level}. Valid levels: ${Object.values(LogLevel).join(', ')}`);
        process.exit(1);
      }
      break;
      
    case '--no-logging':
      config.enableLogging = false;
      break;
      
    case '--no-metrics':
      config.enableMetrics = false;
      break;
      
    case '--health-check':
    case '-h':
      config.enableHealthCheck = true;
      break;
      
    case '--config':
    case '-c':
      config.configFile = args[++i];
      break;
      
    case '--help':
      printHelp();
      process.exit(0);
      break;
      
    case '--version':
    case '-v':
      const packageJson = require('../package.json');
      console.log(`${packageJson.name} v${packageJson.version}`);
      process.exit(0);
      break;
      
    default:
      if (arg.startsWith('-')) {
        console.error(`Unknown option: ${arg}`);
        console.error('Use --help for usage information');
        process.exit(1);
      }
      break;
  }
}

// Load configuration from file if specified
if (config.configFile) {
  try {
    const fs = require('fs');
    const fileConfig = JSON.parse(fs.readFileSync(config.configFile, 'utf8'));
    Object.assign(config, fileConfig);
  } catch (error) {
    console.error(`Failed to load config file ${config.configFile}:`, error.message);
    process.exit(1);
  }
}

// Initialize logging
if (config.enableLogging) {
  MCPLogger.setLogLevel(config.logLevel);
}

// Global error handlers
process.on('uncaughtException', (error) => {
  if (config.enableLogging) {
    MCPLogger.fatal('Uncaught exception', error);
  } else {
    console.error('Uncaught exception:', error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  if (config.enableLogging) {
    MCPLogger.error('Unhandled promise rejection', new Error(String(reason)), undefined, { promise });
  } else {
    console.error('Unhandled promise rejection:', reason);
  }
  process.exit(1);
});

// Graceful shutdown handling
let server = null;
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    if (config.enableLogging) {
      MCPLogger.warn('Force shutdown requested');
    }
    process.exit(1);
  }
  
  isShuttingDown = true;
  
  if (config.enableLogging) {
    MCPLogger.info(`Received ${signal}, shutting down gracefully...`);
  } else {
    console.log(`Received ${signal}, shutting down gracefully...`);
  }
  
  if (server) {
    try {
      await server.stop();
      if (config.enableLogging) {
        MCPLogger.info('Server stopped successfully');
      } else {
        console.log('Server stopped successfully');
      }
    } catch (error) {
      if (config.enableLogging) {
        MCPLogger.error('Error during server shutdown', error);
      } else {
        console.error('Error during server shutdown:', error);
      }
    }
  }
  
  process.exit(0);
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Health check endpoint (if enabled)
if (config.enableHealthCheck) {
  const http = require('http');
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      const status = server ? server.getStatus() : { status: 'starting' };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ...status,
        timestamp: new Date().toISOString(),
        version: require('../package.json').version
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  
  const healthPort = process.env.HEALTH_PORT || 3001;
  healthServer.listen(healthPort, () => {
    if (config.enableLogging) {
      MCPLogger.info(`Health check endpoint available at http://localhost:${healthPort}/health`);
    }
  });
}

// Start the MCP server
async function startServer() {
  try {
    if (config.enableLogging) {
      MCPLogger.info('Starting PM Agent Intent Optimizer MCP Server...', undefined, config);
    } else {
      console.log('Starting PM Agent Intent Optimizer MCP Server...');
    }
    
    // Create server instance with configuration
    server = new PMAgentMCPServer({
      enableLogging: config.enableLogging,
      enableMetrics: config.enableMetrics,
      logLevel: config.logLevel
    });
    
    // Start the server
    await server.start();
    
    if (config.enableLogging) {
      MCPLogger.info('MCP Server is running and ready to accept connections');
    } else {
      console.log('MCP Server is running and ready to accept connections');
    }
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    if (config.enableLogging) {
      MCPLogger.fatal('Failed to start MCP Server', error);
    } else {
      console.error('Failed to start MCP Server:', error);
    }
    process.exit(1);
  }
}

function printHelp() {
  const packageJson = require('../package.json');
  console.log(`
${packageJson.name} v${packageJson.version}
${packageJson.description}

Usage: mcp-server [options]

Options:
  -l, --log-level <level>    Set logging level (debug, info, warn, error, fatal)
  --no-logging              Disable logging
  --no-metrics              Disable performance metrics collection
  -h, --health-check        Enable HTTP health check endpoint on port 3001
  -c, --config <file>       Load configuration from JSON file
  -v, --version             Show version information
  --help                    Show this help message

Environment Variables:
  HEALTH_PORT               Port for health check endpoint (default: 3001)
  LOG_LEVEL                 Default log level if not specified via --log-level

Examples:
  mcp-server                           # Start with default settings
  mcp-server --log-level debug        # Start with debug logging
  mcp-server --health-check           # Start with health check endpoint
  mcp-server --config config.json     # Start with custom configuration
  mcp-server --no-logging             # Start without logging

MCP Client Configuration:
  Add this server to your MCP client configuration:
  {
    "mcpServers": {
      "pm-agent-intent-optimizer": {
        "command": "node",
        "args": ["path/to/bin/mcp-server.js"],
        "env": {}
      }
    }
  }

For more information, visit: https://github.com/your-org/pm-agent-intent-optimizer
`);
}

// Start the server
startServer().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});