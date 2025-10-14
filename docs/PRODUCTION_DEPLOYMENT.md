# Production Deployment Guide

## Overview

This guide covers deploying the Vibe PM Agent MCP server in production environments with optimal performance, security, and reliability.

> **Deployment shortcut:** Use `deployment/aws/deploy.sh` for the official infrastructure automation pipeline. The legacy shell scripts have been retired.

## Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd vibe-pm-agent
npm install

# 2. Build for production
npm run build:prod

# 3. Verify production build
npm run verify:production

# 4. Start in production mode
NODE_ENV=production npm start
```

## Production Build Process

### Build Configuration

The production build uses `tsconfig.prod.json` with optimizations:

- **Source Maps**: Disabled for smaller bundle size
- **Comments**: Removed to reduce file size
- **Dead Code**: Eliminated through tree shaking
- **Strict Checks**: Enhanced error detection
- **Import Optimization**: Unused imports removed

### Build Commands

```bash
# Clean build
npm run clean:prod

# Production build only
npm run build:prod

# Build with analysis
npm run build:analyze

# Full verification
npm run verify:production
```

### Build Verification

The verification script checks:

- ✅ Build exists and is complete
- ✅ Bundle size is under 5MB threshold
- ✅ No demo/test content in production build
- ✅ MCP server starts successfully
- ✅ All 29 tools are available

## Environment Configuration

### Production Environment Variables

```bash
# Core Configuration
NODE_ENV=production
MCP_LOG_LEVEL=WARN
MCP_ENABLE_LOGGING=true

# Performance Settings
MCP_ENABLE_CACHING=true
MCP_MAX_CACHE_SIZE=1000
MCP_REQUEST_TIMEOUT=30000

# Security Settings
MCP_ENABLE_INPUT_VALIDATION=true
MCP_ENABLE_OUTPUT_SANITIZATION=true
MCP_MAX_REQUEST_SIZE=10485760
```

### Logging Configuration

Production logging is optimized for:

- **Level**: WARN and ERROR only
- **Format**: Structured JSON for log aggregation
- **Performance**: Minimal overhead
- **Security**: Sensitive data redaction

```typescript
// Production logger automatically:
// - Filters debug/info messages
// - Redacts sensitive information
// - Structures logs for monitoring
// - Limits log size and frequency
```

## Performance Optimization

### Bundle Analysis

Current production bundle:

- **Total Size**: 2.7MB
- **JavaScript Files**: 109
- **Main Components**: 
  - MCP Server Core: ~71KB
  - Business Analysis Pipeline: ~134KB
  - PM Document Generator: ~93KB
  - Citation System: ~56KB

### Runtime Performance

Production optimizations include:

- **Caching**: Intelligent caching of expensive operations
- **Lazy Loading**: Components loaded on demand
- **Memory Management**: Automatic cleanup and garbage collection
- **Request Batching**: Multiple operations combined efficiently

### Monitoring Metrics

Built-in metrics available via health check:

```json
{
  "status": "healthy",
  "uptime": 3600000,
  "toolsAvailable": 29,
  "performance": {
    "averageResponseTime": 150,
    "totalRequests": 1250,
    "errorRate": 0.002
  }
}
```

## Security Configuration

### Input Validation

All MCP tool inputs are validated:

- **Schema Validation**: TypeScript interfaces enforced
- **Size Limits**: Configurable request size limits
- **Sanitization**: Automatic input cleaning
- **Rate Limiting**: Built-in request throttling

### Output Sanitization

Production mode automatically:

- Redacts sensitive information from logs
- Truncates large outputs to prevent memory issues
- Removes stack traces from error responses
- Sanitizes file paths and system information

### Error Handling

Production error handling:

```typescript
// Errors are logged with context but sensitive data removed
{
  "level": "ERROR",
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "Tool execution failed",
  "error": {
    "type": "ValidationError",
    "message": "Invalid input format"
    // Stack trace omitted in production
  },
  "context": {
    "toolName": "analyze_business_opportunity",
    "sessionId": "[REDACTED]"
  }
}
```

## Deployment Options

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY bin/ ./bin/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

### Process Manager (PM2)

```json
{
  "name": "vibe-pm-agent",
  "script": "dist/mcp/cli.js",
  "env": {
    "NODE_ENV": "production",
    "MCP_LOG_LEVEL": "WARN"
  },
  "instances": 1,
  "exec_mode": "fork",
  "watch": false,
  "max_memory_restart": "500M"
}
```

### Systemd Service

```ini
[Unit]
Description=Vibe PM Agent MCP Server
After=network.target

[Service]
Type=simple
User=mcp-server
WorkingDirectory=/opt/vibe-pm-agent
ExecStart=/usr/bin/node dist/mcp/cli.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=MCP_LOG_LEVEL=WARN

[Install]
WantedBy=multi-user.target
```

## Health Monitoring

### Health Check Endpoint

```bash
# Check server health
node dist/mcp/cli.js --health

# Expected response
{
  "status": "healthy",
  "uptime": 3600000,
  "toolsAvailable": 29,
  "performance": {
    "averageResponseTime": 150,
    "totalRequests": 1250,
    "errorRate": 0.002
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Monitoring Integration

The server provides metrics for:

- **Prometheus**: Built-in metrics endpoint
- **DataDog**: StatsD compatible metrics
- **New Relic**: APM integration ready
- **Custom**: JSON structured logs for any system

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build:prod
   ```

2. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

3. **Performance Issues**
   ```bash
   # Enable performance monitoring
   MCP_ENABLE_PERFORMANCE_LOGGING=true npm start
   ```

### Debug Mode

For production debugging:

```bash
# Enable debug logging temporarily
MCP_LOG_LEVEL=DEBUG npm start

# Check specific tool performance
node dist/mcp/cli.js --health | jq '.performance'
```

## Maintenance

### Updates

```bash
# Update dependencies
npm update

# Rebuild for production
npm run clean:prod

# Verify update
npm run verify:production
```

### Backup

Important files to backup:

- `dist/` - Production build
- `package.json` - Dependencies
- `.env.production` - Configuration
- `examples/production-deployment/` - Deployment configs

## Support

For production deployment support:

- Check the [MCP Tools Reference](./MCP_TOOLS_REFERENCE.md)
- Review [Business Intelligence Guide](./BUSINESS_INTELLIGENCE_GUIDE.md)
- See [examples/production-deployment/](../examples/production-deployment/) for configurations
