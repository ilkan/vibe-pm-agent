# Production Deployment Examples

This directory contains production-ready configuration examples for deploying the Vibe PM Agent MCP server in various environments.

## Quick Start

1. **Install the package:**
   ```bash
   npm install vibe-pm-agent
   ```

2. **Choose a configuration example** from the files below
3. **Set environment variables** as documented
4. **Start the MCP server** using your chosen configuration

## Configuration Examples

### Basic Production Configuration
- **File:** `mcp-basic-production.json`
- **Use Case:** Simple production deployment with essential tools
- **Best For:** Small teams, basic PM workflows

### Enterprise Configuration
- **File:** `mcp-enterprise-config.json`
- **Use Case:** Full-featured enterprise deployment
- **Best For:** Large organizations, comprehensive business analysis

### Kiro IDE Integration
- **File:** `kiro-ide-integration.json`
- **Use Case:** Optimized for Kiro IDE integration
- **Best For:** Development teams using Kiro IDE

### High Performance Configuration
- **File:** `mcp-high-performance.json`
- **Use Case:** Optimized for heavy workloads and fast response times
- **Best For:** High-traffic environments, enterprise deployments

### Minimal Configuration
- **File:** `mcp-minimal-config.json`
- **Use Case:** Resource-constrained environments with core tools only
- **Best For:** Small deployments, testing environments

### Development Configuration
- **File:** `mcp-development-config.json`
- **Use Case:** Development and testing with debug features
- **Best For:** Local development, debugging, testing

## Environment Variables

### Core Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | No |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` | No |
| `MCP_SERVER_PORT` | Health check port | `3001` | No |
| `MCP_SERVER_HOST` | Server host binding | `localhost` | No |

### Performance & Scaling
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MAX_CONCURRENT_REQUESTS` | Maximum concurrent tool requests | `10` | No |
| `REQUEST_TIMEOUT_MS` | Request timeout in milliseconds | `30000` | No |
| `CACHE_ENABLED` | Enable response caching | `true` | No |
| `CACHE_TTL_MS` | Cache time-to-live in milliseconds | `300000` | No |
| `MAX_CACHE_SIZE` | Maximum cache entries | `100` | No |

### Security & Rate Limiting
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_RATE_LIMITING` | Enable rate limiting | `false` | No |
| `MAX_REQUESTS_PER_MINUTE` | Rate limit threshold | `60` | No |
| `ENABLE_INPUT_SANITIZATION` | Enable input sanitization | `true` | No |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` | No |

### Monitoring & Health Checks
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_HEALTH_CHECK` | Enable health check endpoint | `true` | No |
| `HEALTH_CHECK_PATH` | Health check endpoint path | `/health` | No |
| `ENABLE_METRICS` | Enable performance metrics | `true` | No |
| `METRICS_COLLECTION_INTERVAL` | Metrics collection interval (ms) | `60000` | No |

### Business Intelligence Features
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_CITATIONS` | Enable citation system | `true` | No |
| `MIN_CITATION_CONFIDENCE` | Minimum citation confidence level | `high` | No |
| `MAX_CITATION_AGE_MONTHS` | Maximum citation age in months | `18` | No |
| `ENABLE_COMPETITIVE_ANALYSIS` | Enable competitive analysis tools | `true` | No |
| `ENABLE_MARKET_SIZING` | Enable market sizing tools | `true` | No |

### Integration Settings
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `KIRO_INTEGRATION_MODE` | Enable Kiro-specific optimizations | `true` | No |
| `AUTO_APPROVE_TOOLS` | Comma-separated list of auto-approved tools | `` | No |
| `STEERING_FILES_ENABLED` | Enable steering file generation | `true` | No |
| `DEFAULT_CITATION_STYLE` | Default citation style (business, apa, inline) | `business` | No |

## Usage Examples

### Basic Usage
```bash
# Set environment variables
export NODE_ENV=production
export LOG_LEVEL=info

# Start the MCP server
npx vibe-pm-agent
```

### With Custom Configuration
```bash
# Using environment file
export $(cat .env | xargs)
npx vibe-pm-agent

# Or inline
NODE_ENV=production LOG_LEVEL=debug npx vibe-pm-agent
```

### Using Deployment Scripts
```bash
# Start server in production mode
./examples/production-deployment/deployment-scripts/start-production.sh

# Check server health
./examples/production-deployment/deployment-scripts/health-check.sh

# Stop server gracefully
./examples/production-deployment/deployment-scripts/stop-server.sh
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check that Node.js >= 18.0.0 is installed
   - Verify all required dependencies are installed: `npm install`
   - Check for port conflicts on health check port

2. **Tools not responding**
   - Verify MCP client configuration matches server setup
   - Check logs for authentication or permission errors
   - Ensure auto-approved tools are configured correctly

3. **Performance issues**
   - Adjust `MAX_CONCURRENT_REQUESTS` based on system resources
   - Enable caching with `CACHE_ENABLED=true`
   - Monitor memory usage and adjust `MAX_CACHE_SIZE`

4. **Citation system errors**
   - Check internet connectivity for citation validation
   - Adjust `MIN_CITATION_CONFIDENCE` if too restrictive
   - Verify `MAX_CITATION_AGE_MONTHS` setting

### Health Check
Access the health check endpoint to verify server status:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 12345,
  "toolsAvailable": ["mcp_vibe_pm_agent_analyze_business_opportunity", ...],
  "performance": {
    "averageResponseTime": 150,
    "totalRequests": 42,
    "errorRate": 0.5
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Support

For production deployment support:
- Check the [main README](../../README.md) for general setup
- Review [MCP Tools Reference](../../docs/MCP_TOOLS_REFERENCE.md) for tool documentation
- See [Business Intelligence Guide](../../docs/BUSINESS_INTELLIGENCE_GUIDE.md) for feature details