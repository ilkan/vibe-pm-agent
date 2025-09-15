# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Vibe PM Agent MCP server in production environments.

## Prerequisites

### System Requirements
- **Node.js:** >= 18.0.0
- **npm:** >= 8.0.0
- **Memory:** Minimum 512MB RAM, recommended 1GB+
- **Storage:** 100MB for application, additional space for logs and cache
- **Network:** Outbound internet access for citation validation and competitive analysis

### Operating System Support
- Linux (Ubuntu 18.04+, CentOS 7+, RHEL 7+)
- macOS (10.15+)
- Windows (10+, Windows Server 2019+)

## Installation Methods

### Method 1: Global NPM Installation (Recommended)

```bash
# Install globally
npm install -g vibe-pm-agent

# Verify installation
vibe-pm-agent --version

# Start server
vibe-pm-agent
```

### Method 2: Local Project Installation

```bash
# Create project directory
mkdir vibe-pm-server && cd vibe-pm-server

# Initialize package.json
npm init -y

# Install as dependency
npm install vibe-pm-agent

# Start server
npx vibe-pm-agent
```

### Method 3: From Source (Development)

```bash
# Clone repository
git clone https://github.com/ilkan/vibe-pm-agent.git
cd vibe-pm-agent

# Install dependencies
npm install

# Build project
npm run build

# Start server
npm start
```

## Configuration Selection

Choose the appropriate configuration based on your use case:

### 1. Basic Production (`mcp-basic-production.json`)
- **Use Case:** Small teams, standard PM workflows
- **Features:** Essential tools, citation system, health checks
- **Resources:** Low to medium resource usage
- **Auto-approved tools:** Core workflow tools

### 2. Enterprise (`mcp-enterprise-config.json`)
- **Use Case:** Large organizations, comprehensive analysis
- **Features:** All tools, enhanced security, performance optimization
- **Resources:** Medium to high resource usage
- **Auto-approved tools:** Extended business intelligence tools

### 3. Kiro IDE Integration (`kiro-ide-integration.json`)
- **Use Case:** Development teams using Kiro IDE
- **Features:** Optimized for Kiro, steering files, all PM tools
- **Resources:** Medium resource usage
- **Auto-approved tools:** Complete PM workflow suite

### 4. High Performance (`mcp-high-performance.json`)
- **Use Case:** Heavy workloads, fast response requirements
- **Features:** Optimized caching, high concurrency, minimal logging
- **Resources:** High resource usage, optimized performance
- **Auto-approved tools:** Core business intelligence tools

### 5. Minimal (`mcp-minimal-config.json`)
- **Use Case:** Resource-constrained environments
- **Features:** Core tools only, minimal features
- **Resources:** Very low resource usage
- **Auto-approved tools:** Essential workflow tools only

## Step-by-Step Deployment

### Step 1: Environment Setup

1. **Create deployment directory:**
   ```bash
   mkdir /opt/vibe-pm-agent
   cd /opt/vibe-pm-agent
   ```

2. **Copy configuration files:**
   ```bash
   # Copy your chosen configuration
   cp examples/production-deployment/mcp-enterprise-config.json ./mcp-config.json
   
   # Copy environment variables template
   cp examples/production-deployment/environment-variables.env ./.env
   ```

3. **Customize environment variables:**
   ```bash
   # Edit .env file with your settings
   nano .env
   ```

### Step 2: Install and Configure

1. **Install the package:**
   ```bash
   npm install -g vibe-pm-agent
   ```

2. **Test installation:**
   ```bash
   vibe-pm-agent --help
   ```

3. **Validate configuration:**
   ```bash
   # Load environment variables
   export $(cat .env | xargs)
   
   # Test server startup (Ctrl+C to stop)
   vibe-pm-agent
   ```

### Step 3: Production Startup

1. **Using deployment scripts:**
   ```bash
   # Copy deployment scripts
   cp -r examples/production-deployment/deployment-scripts ./scripts
   chmod +x ./scripts/*.sh
   
   # Start server
   ./scripts/start-production.sh
   ```

2. **Manual startup with environment:**
   ```bash
   # Load environment variables
   export $(cat .env | xargs)
   
   # Start server in background
   nohup vibe-pm-agent > logs/server.log 2>&1 &
   
   # Save PID for later management
   echo $! > /tmp/vibe-pm-agent.pid
   ```

### Step 4: Verify Deployment

1. **Health check:**
   ```bash
   # Using script
   ./scripts/health-check.sh
   
   # Manual check
   curl http://localhost:3001/health
   ```

2. **Test MCP integration:**
   ```bash
   # Configure your MCP client with the chosen configuration
   # Test a simple tool call through your MCP client
   ```

## Process Management

### Using systemd (Linux)

1. **Create service file:**
   ```bash
   sudo nano /etc/systemd/system/vibe-pm-agent.service
   ```

   ```ini
   [Unit]
   Description=Vibe PM Agent MCP Server
   After=network.target
   
   [Service]
   Type=simple
   User=vibe-pm
   WorkingDirectory=/opt/vibe-pm-agent
   EnvironmentFile=/opt/vibe-pm-agent/.env
   ExecStart=/usr/local/bin/vibe-pm-agent
   ExecReload=/bin/kill -HUP $MAINPID
   Restart=always
   RestartSec=10
   StandardOutput=journal
   StandardError=journal
   
   [Install]
   WantedBy=multi-user.target
   ```

2. **Enable and start service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable vibe-pm-agent
   sudo systemctl start vibe-pm-agent
   sudo systemctl status vibe-pm-agent
   ```

### Using PM2 (Cross-platform)

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 configuration:**
   ```bash
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'vibe-pm-agent',
       script: 'vibe-pm-agent',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env_file: '.env',
       log_file: 'logs/combined.log',
       out_file: 'logs/out.log',
       error_file: 'logs/error.log',
       time: true
     }]
   };
   EOF
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Monitoring and Maintenance

### Health Monitoring

1. **Automated health checks:**
   ```bash
   # Add to crontab for regular health checks
   */5 * * * * /opt/vibe-pm-agent/scripts/health-check.sh --quiet || echo "Health check failed" | mail -s "Vibe PM Agent Alert" admin@company.com
   ```

2. **Log monitoring:**
   ```bash
   # Monitor logs for errors
   tail -f logs/server.log | grep -i error
   
   # Monitor performance metrics
   ./scripts/health-check.sh --watch
   ```

### Performance Tuning

1. **Memory optimization:**
   - Adjust `MAX_CACHE_SIZE` based on available memory
   - Monitor memory usage with `ps aux | grep vibe-pm-agent`
   - Set appropriate `MEMORY_THRESHOLD` for alerts

2. **Concurrency tuning:**
   - Start with `MAX_CONCURRENT_REQUESTS=10`
   - Increase gradually while monitoring response times
   - Monitor with health check performance metrics

3. **Cache optimization:**
   - Enable caching for production: `CACHE_ENABLED=true`
   - Adjust `CACHE_TTL_MS` based on data freshness requirements
   - Monitor cache hit rates in health check output

### Security Considerations

1. **Network security:**
   - Run server on internal network only
   - Use reverse proxy (nginx, Apache) for external access
   - Configure firewall to restrict access to health check port

2. **Input validation:**
   - Keep `ENABLE_INPUT_SANITIZATION=true`
   - Monitor logs for suspicious input patterns
   - Consider rate limiting for public-facing deployments

3. **Updates and patches:**
   ```bash
   # Check for updates
   npm outdated -g vibe-pm-agent
   
   # Update to latest version
   npm update -g vibe-pm-agent
   
   # Restart service after updates
   sudo systemctl restart vibe-pm-agent
   ```

## Troubleshooting

### Common Issues

1. **Server won't start:**
   ```bash
   # Check Node.js version
   node --version
   
   # Check for port conflicts
   lsof -i :3001
   
   # Check permissions
   ls -la /opt/vibe-pm-agent
   ```

2. **High memory usage:**
   ```bash
   # Reduce cache size
   export MAX_CACHE_SIZE=50
   
   # Disable caching temporarily
   export CACHE_ENABLED=false
   
   # Restart server
   ./scripts/stop-server.sh && ./scripts/start-production.sh
   ```

3. **Slow response times:**
   ```bash
   # Check concurrent requests
   export MAX_CONCURRENT_REQUESTS=5
   
   # Increase timeout
   export REQUEST_TIMEOUT_MS=45000
   
   # Monitor performance
   ./scripts/health-check.sh
   ```

### Log Analysis

1. **Error patterns:**
   ```bash
   # Find recent errors
   grep -i error logs/server.log | tail -20
   
   # Count error types
   grep -i error logs/server.log | cut -d' ' -f4- | sort | uniq -c
   ```

2. **Performance analysis:**
   ```bash
   # Find slow requests
   grep "response time" logs/server.log | awk '$NF > 5000'
   
   # Monitor tool usage
   grep "Tool call" logs/server.log | cut -d' ' -f6 | sort | uniq -c
   ```

## Backup and Recovery

### Configuration Backup
```bash
# Backup configuration
tar -czf vibe-pm-agent-config-$(date +%Y%m%d).tar.gz .env mcp-config.json

# Backup logs (optional)
tar -czf vibe-pm-agent-logs-$(date +%Y%m%d).tar.gz logs/
```

### Recovery Process
```bash
# Stop server
./scripts/stop-server.sh

# Restore configuration
tar -xzf vibe-pm-agent-config-YYYYMMDD.tar.gz

# Restart server
./scripts/start-production.sh

# Verify health
./scripts/health-check.sh
```

## Support and Resources

- **Documentation:** [Main README](../../README.md)
- **MCP Tools Reference:** [MCP_TOOLS_REFERENCE.md](../../docs/MCP_TOOLS_REFERENCE.md)
- **Business Intelligence Guide:** [BUSINESS_INTELLIGENCE_GUIDE.md](../../docs/BUSINESS_INTELLIGENCE_GUIDE.md)
- **Issues:** GitHub Issues page
- **Community:** Kiro IDE community forums