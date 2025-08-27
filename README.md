# PM Agent Intent Optimizer

An AI-powered MCP (Model Context Protocol) server that transforms raw developer intent expressed in natural language into structured, efficient Kiro specifications using consulting-grade business analysis techniques.

## Overview

The PM Agent Intent Optimizer is designed as an MCP Server that provides intelligent consulting-grade analysis through well-defined tools. It applies 2-3 consulting techniques from a comprehensive arsenal (MECE, Pyramid Principle, Value Driver Tree, Zero-Based Design, Impact vs Effort Matrix, Value Proposition Canvas, Option Framing) to minimize vibe/spec quota consumption while preserving all required functionality.

## Features

- **Natural Language Processing**: Parses unstructured developer intent into structured requirements
- **Consulting Techniques**: Applies professional business analysis methodologies
- **Workflow Optimization**: Restructures operations for efficiency (batching, caching, spec decomposition)
- **ROI Analysis**: Provides comprehensive cost-benefit analysis with multiple optimization scenarios
- **MCP Integration**: Seamlessly integrates with AI systems like Kiro through Model Context Protocol

## MCP Server Setup

### Installation

1. **Clone and build the project:**
   ```bash
   git clone <repository-url>
   cd pm-agent-intent-optimizer
   npm install
   npm run build
   ```

2. **Make the MCP server executable:**
   ```bash
   chmod +x bin/mcp-server.js
   ```

### Running the MCP Server

#### Basic Usage
```bash
# Start with default settings
npm run mcp:start

# Or directly
node bin/mcp-server.js
```

#### Advanced Usage
```bash
# Start with debug logging
npm run mcp:start:debug

# Start with health check endpoint
npm run mcp:start:health

# Start with custom log level
node bin/mcp-server.js --log-level warn

# Start with configuration file
node bin/mcp-server.js --config config.json

# Disable logging and metrics
node bin/mcp-server.js --no-logging --no-metrics
```

#### Command Line Options
```
Options:
  -l, --log-level <level>    Set logging level (debug, info, warn, error, fatal)
  --no-logging              Disable logging
  --no-metrics              Disable performance metrics collection
  -h, --health-check        Enable HTTP health check endpoint on port 3001
  -c, --config <file>       Load configuration from JSON file
  -v, --version             Show version information
  --help                    Show help message

Environment Variables:
  HEALTH_PORT               Port for health check endpoint (default: 3001)
  LOG_LEVEL                 Default log level if not specified via --log-level
```

### MCP Client Configuration

Add this server to your MCP client configuration (e.g., in Kiro):

#### Basic Configuration
```json
{
  "mcpServers": {
    "pm-agent-intent-optimizer": {
      "command": "node",
      "args": ["path/to/pm-agent-intent-optimizer/bin/mcp-server.js"],
      "env": {}
    }
  }
}
```

#### Advanced Configuration with Options
```json
{
  "mcpServers": {
    "pm-agent-intent-optimizer": {
      "command": "node",
      "args": [
        "path/to/pm-agent-intent-optimizer/bin/mcp-server.js",
        "--log-level", "info",
        "--health-check"
      ],
      "env": {
        "HEALTH_PORT": "3001",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Using with uvx (Python Package Manager)
If you publish this as a Python package:
```json
{
  "mcpServers": {
    "pm-agent-intent-optimizer": {
      "command": "uvx",
      "args": ["pm-agent-intent-optimizer@latest"],
      "env": {}
    }
  }
}
```

## Available MCP Tools

The server exposes the following tools through the Model Context Protocol:

### 1. `optimize_intent`
**Description**: Main tool that takes raw developer intent and returns optimized Kiro spec with consulting analysis.

**Input Schema**:
```json
{
  "intent": "string (required) - Raw developer intent in natural language",
  "parameters": {
    "expectedUserVolume": "number (optional) - Expected number of users",
    "costConstraints": "number (optional) - Budget constraints",
    "performanceSensitivity": "string (optional) - low|medium|high"
  }
}
```

**Example Usage**:
```json
{
  "intent": "I want to create a system that analyzes user feedback and generates reports",
  "parameters": {
    "expectedUserVolume": 1000,
    "costConstraints": 500,
    "performanceSensitivity": "medium"
  }
}
```

### 2. `analyze_workflow`
**Description**: Analyzes existing workflow definitions for optimization opportunities.

**Input Schema**:
```json
{
  "workflow": "object (required) - Existing workflow definition",
  "techniques": "array (optional) - Specific consulting techniques to apply"
}
```

### 3. `generate_roi_analysis`
**Description**: Generates comprehensive ROI analysis comparing different optimization approaches.

**Input Schema**:
```json
{
  "workflow": "object (required) - Original workflow",
  "optimizedWorkflow": "object (optional) - Optimized version",
  "zeroBasedSolution": "object (optional) - Zero-based redesign"
}
```

### 4. `get_consulting_summary`
**Description**: Provides detailed consulting-style summary using Pyramid Principle.

**Input Schema**:
```json
{
  "analysis": "object (required) - Analysis results",
  "techniques": "array (optional) - Techniques used in analysis"
}
```

## Configuration File Format

Create a `config.json` file for advanced configuration:

```json
{
  "logLevel": "info",
  "enableLogging": true,
  "enableMetrics": true,
  "enableHealthCheck": true,
  "customSettings": {
    "maxConcurrentRequests": 10,
    "requestTimeout": 30000,
    "cacheEnabled": true
  }
}
```

## Health Monitoring

When started with `--health-check`, the server provides a health endpoint:

```bash
# Check server health
curl http://localhost:3001/health
```

Response format:
```json
{
  "status": "healthy",
  "uptime": 12345,
  "toolsRegistered": 4,
  "performance": {
    "averageResponseTime": 150,
    "totalRequests": 42,
    "errorRate": 0.5
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Development

### Building the Project
```bash
npm run build
```

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Development Mode
```bash
npm run dev
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run type-check
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Ensure the project is built: `npm run build`
   - Check that Node.js version is compatible (>= 16)
   - Verify all dependencies are installed: `npm install`

2. **MCP client can't connect**
   - Verify the path to `bin/mcp-server.js` is correct in your MCP configuration
   - Check that the script is executable: `chmod +x bin/mcp-server.js`
   - Review server logs for startup errors

3. **Tool calls failing**
   - Enable debug logging: `--log-level debug`
   - Check the health endpoint if enabled
   - Verify input schemas match the expected format

### Logging

Enable detailed logging for troubleshooting:
```bash
node bin/mcp-server.js --log-level debug --health-check
```

Log levels (from most to least verbose):
- `debug`: Detailed execution information
- `info`: General operational messages
- `warn`: Warning conditions
- `error`: Error conditions
- `fatal`: Critical errors that cause shutdown

## Project Structure

```
src/
├── components/              # Core pipeline components
│   ├── intent-interpreter/  # Natural language parsing
│   ├── business-analyzer/   # Workflow analysis with consulting techniques
│   ├── workflow-optimizer/  # Optimization strategies implementation
│   ├── quota-forecaster/    # Cost estimation and ROI analysis
│   ├── consulting-summary-generator/  # Professional consulting summaries
│   └── spec-generator/      # Enhanced Kiro spec output formatting
├── models/                  # TypeScript interfaces and data structures
├── pipeline/                # AI agent pipeline orchestration
├── mcp/                     # MCP server implementation
├── utils/                   # Shared utilities and error handling
├── tests/                   # Comprehensive test suites
│   ├── unit/               # Component unit tests
│   ├── integration/        # Pipeline integration tests
│   └── performance/        # Performance benchmarks
└── main.ts                 # Main entry point
bin/
└── mcp-server.js           # MCP server executable
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Submit a pull request

This project follows the Kiro spec-driven development methodology. See the `.kiro/specs/pm-agent-intent-optimizer/` directory for detailed requirements, design, and implementation tasks.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review server logs with debug logging enabled
- Open an issue on the project repository