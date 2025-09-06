#!/usr/bin/env node

/**
 * Vibe PM Agent MCP Server Entry Point
 * 
 * This script starts the MCP server for the Vibe PM Agent.
 * It provides evidence-backed business intelligence capabilities
 * through the Model Context Protocol.
 */

const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { PMAgentMCPServer } = require('../dist/mcp/server.js');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  enableLogging: !args.includes('--no-logging'),
  enableMetrics: !args.includes('--no-metrics'),
  logLevel: args.includes('--log-level') 
    ? args[args.indexOf('--log-level') + 1] 
    : 'info',
  healthCheck: args.includes('--health-check'),
  help: args.includes('--help') || args.includes('-h')
};

// Show help information
if (options.help) {
  console.log(`
Vibe PM Agent MCP Server v2.0.0
Evidence-backed business intelligence MCP server

Usage: vibe-pm-agent [options]

Options:
  --help, -h           Show this help message
  --log-level <level>  Set logging level (debug, info, warn, error)
  --no-logging         Disable logging output
  --no-metrics         Disable performance metrics
  --health-check       Perform health check and exit

MCP Tools Available:
  - analyze_business_opportunity    Market validation and strategic assessment
  - generate_business_case         ROI analysis with multi-scenario projections
  - create_stakeholder_communication  Executive communications generation
  - assess_strategic_alignment     Company OKR and mission alignment
  - validate_market_timing         Right-time recommendations
  - process_executive_query        Automated executive intelligence
  - generate_management_onepager   Executive one-pager with Pyramid Principle
  - generate_pr_faq               Amazon-style PR-FAQ document
  - generate_requirements         PM-grade requirements with MoSCoW prioritization
  - generate_design_options       Conservative/Balanced/Bold alternatives
  - generate_task_plan           Phased implementation plan

Examples:
  vibe-pm-agent                    # Start MCP server
  vibe-pm-agent --log-level debug  # Start with debug logging
  vibe-pm-agent --health-check     # Check server health
  vibe-pm-agent --no-logging       # Start without logging

For Kiro integration, add this server to your MCP configuration:
{
  "mcpServers": {
    "vibe-pm-agent": {
      "command": "vibe-pm-agent",
      "args": [],
      "env": {}
    }
  }
}

Documentation: https://github.com/your-username/vibe-pm-agent
Issues: https://github.com/your-username/vibe-pm-agent/issues
`);
  process.exit(0);
}

async function main() {
  try {
    // Create MCP server instance
    const server = new PMAgentMCPServer(options);
    
    // Perform health check if requested
    if (options.healthCheck) {
      const health = await server.healthCheck();
      console.log('Health Check Results:');
      console.log(JSON.stringify(health, null, 2));
      
      if (health.status === 'healthy') {
        console.log('✅ Server is healthy and ready');
        process.exit(0);
      } else {
        console.log('❌ Server health check failed');
        process.exit(1);
      }
    }
    
    // Create stdio transport for MCP communication
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    if (options.enableLogging) {
      console.error('🚀 Vibe PM Agent MCP Server started successfully');
      console.error('📊 Evidence-backed business intelligence ready');
      console.error('🔗 Connected via stdio transport');
      
      // Log available tools
      const health = await server.healthCheck();
      console.error(`🛠️  ${health.toolsAvailable.length} tools available: ${health.toolsAvailable.join(', ')}`);
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      if (options.enableLogging) {
        console.error('🛑 Shutting down MCP server...');
      }
      
      try {
        await server.stop();
        if (options.enableLogging) {
          console.error('✅ Server stopped gracefully');
        }
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
      }
    });
    
    process.on('SIGTERM', async () => {
      if (options.enableLogging) {
        console.error('🛑 Received SIGTERM, shutting down...');
      }
      
      try {
        await server.stop();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error.message);
    
    if (options.enableLogging && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // Provide helpful error messages
    if (error.message.includes('ENOENT')) {
      console.error('💡 Make sure you have run "npm run build" first');
    } else if (error.message.includes('MODULE_NOT_FOUND')) {
      console.error('💡 Make sure you have run "npm install" first');
    } else if (error.message.includes('permission')) {
      console.error('💡 Check file permissions or run with appropriate privileges');
    }
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});