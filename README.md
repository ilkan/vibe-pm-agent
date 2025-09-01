# Vibe PM Agent

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
   cd vibe-pm-agent
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
    "vibe-pm-agent": {
      "command": "node",
      "args": ["path/to/vibe-pm-agent/bin/mcp-server.js"],
      "env": {}
    }
  }
}
```

#### Advanced Configuration with Options
```json
{
  "mcpServers": {
    "vibe-pm-agent": {
      "command": "node",
      "args": [
        "path/to/vibe-pm-agent/bin/mcp-server.js",
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
    "vibe-pm-agent": {
      "command": "uvx",
      "args": ["vibe-pm-agent@latest"],
      "env": {}
    }
  }
}
```

## Available MCP Tools

The server exposes the following tools through the Model Context Protocol:

| Tool | Purpose | Use Case |
|------|---------|----------|
| `validate_idea_quick` | Fast PASS/FAIL validation with 3 options | Idea screening, brainstorming |
| `optimize_intent` | Full optimization with ROI analysis | Technical implementation |
| `generate_requirements` | Structured requirements with MoSCoW | Problem definition |
| `generate_design_options` | Conservative/Balanced/Bold alternatives | Solution exploration |
| `generate_task_plan` | Phased implementation roadmap | Project planning |
| `generate_management_onepager` | Executive summary with Pyramid Principle | Leadership approval |
| `generate_pr_faq` | Amazon-style product communication | Launch planning |
| `analyze_workflow` | Existing process optimization | Efficiency improvement |
| `generate_roi_analysis` | Multi-scenario cost comparison | Investment decisions |
| `get_consulting_summary` | Professional analysis report | Stakeholder communication |

### Quick Validation Tool

#### `validate_idea_quick`
**Description**: Fast unit-test-like validation that provides PASS/FAIL verdict with 3 structured options for next steps.

**Input Schema**:
```json
{
  "idea": "string (required, 5-2000 chars) - Raw idea or intent to validate",
  "context": {
    "urgency": "string (optional) - low|medium|high",
    "budget_range": "string (optional) - small|medium|large", 
    "team_size": "number (optional, 1-100) - Size of team working on this"
  }
}
```

**Example Usage**:
```json
{
  "idea": "Create an automated system to generate daily reports from our database and email them to stakeholders",
  "context": {
    "urgency": "medium",
    "budget_range": "small",
    "team_size": 3
  }
}
```

### Core Optimization Tools

#### `optimize_intent`
**Description**: Main tool that takes raw developer intent and returns optimized Kiro spec with consulting analysis.

**Input Schema**:
```json
{
  "intent": "string (required) - Raw developer intent in natural language",
  "parameters": {
    "expectedUserVolume": "number (optional) - Expected number of users",
    "costConstraints": "object (optional) - Budget constraints",
    "performanceSensitivity": "string (optional) - low|medium|high"
  }
}
```

#### `analyze_workflow`
**Description**: Analyzes existing workflow definitions for optimization opportunities.

#### `generate_roi_analysis`
**Description**: Generates comprehensive ROI analysis comparing different optimization approaches.

#### `get_consulting_summary`
**Description**: Provides detailed consulting-style summary using Pyramid Principle.

### PM Workflow Tools

#### `generate_requirements`
**Description**: Creates PM-grade requirements with Business Goal extraction, MoSCoW prioritization, and Go/No-Go timing decision.

#### `generate_design_options`
**Description**: Translates approved requirements into Conservative/Balanced/Bold design options with Impact vs Effort analysis.

#### `generate_task_plan`
**Description**: Creates phased implementation plan with Guardrails Check, Immediate Wins, Short-Term, and Long-Term tasks.

#### `generate_management_onepager`
**Description**: Creates executive-ready management one-pager using Pyramid Principle with answer-first clarity and timing rationale.

#### `generate_pr_faq`
**Description**: Generates Amazon-style PR-FAQ document with future-dated press release and comprehensive FAQ.

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

## Documentation

Comprehensive guides and best practices:

- **[MCP Tools Documentation](docs/mcp-tools-documentation.md)**: Complete tool reference with input/output examples
- **[PM Workflow Guide](docs/pm-workflow-guide.md)**: Step-by-step workflow patterns for product management
- **[Quick Validation Guide](docs/quick-validation-guide.md)**: Best practices for fast idea validation
- **[PM Document Best Practices](docs/pm-document-best-practices.md)**: Quality standards and guidelines for executive communication

### Workflow Patterns

#### Quick Validation Workflow
1. **Validate Idea** → Get PASS/FAIL + 3 options (A/B/C)
2. **Select Option** → Choose based on constraints and risk tolerance
3. **Deep Analysis** → Use full PM workflow tools if needed

#### Full PM Workflow
1. **Requirements** → Structure problem with MoSCoW prioritization
2. **Design Options** → Explore Conservative/Balanced/Bold alternatives
3. **Task Planning** → Create phased implementation with guardrails
4. **Communication** → Generate one-pager and PR-FAQ for stakeholders

#### Technical Optimization
1. **Intent Analysis** → Parse requirements and identify opportunities
2. **Workflow Analysis** → Apply consulting techniques for efficiency
3. **ROI Validation** → Compare naive vs optimized vs zero-based approaches
4. **Implementation** → Generate optimized Kiro specifications

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

This project follows the Kiro spec-driven development methodology. See the `.kiro/specs/vibe-pm-agent/` directory for detailed requirements, design, and implementation tasks.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review server logs with debug logging enabled
- Open an issue on the project repository
