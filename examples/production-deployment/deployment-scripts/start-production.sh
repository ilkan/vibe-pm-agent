#!/bin/bash

# Vibe PM Agent - Production Startup Script
# This script sets up and starts the MCP server in production mode

set -e  # Exit on any error

echo "🚀 Starting Vibe PM Agent MCP Server in Production Mode"
echo "=================================================="

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Error: Node.js version $NODE_VERSION is not supported"
    echo "   Required: Node.js >= $REQUIRED_VERSION"
    echo "   Please upgrade Node.js and try again"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check if package is installed
if ! command -v vibe-pm-agent &> /dev/null; then
    echo "📦 Installing vibe-pm-agent..."
    npm install -g vibe-pm-agent
else
    echo "✅ vibe-pm-agent is installed"
fi

# Set production environment variables
export NODE_ENV=production
export LOG_LEVEL=${LOG_LEVEL:-info}
export ENABLE_HEALTH_CHECK=${ENABLE_HEALTH_CHECK:-true}
export MCP_SERVER_PORT=${MCP_SERVER_PORT:-3001}
export MAX_CONCURRENT_REQUESTS=${MAX_CONCURRENT_REQUESTS:-10}
export CACHE_ENABLED=${CACHE_ENABLED:-true}
export ENABLE_CITATIONS=${ENABLE_CITATIONS:-true}
export KIRO_INTEGRATION_MODE=${KIRO_INTEGRATION_MODE:-true}

echo "🔧 Configuration:"
echo "   Environment: $NODE_ENV"
echo "   Log Level: $LOG_LEVEL"
echo "   Health Check: $ENABLE_HEALTH_CHECK"
echo "   Port: $MCP_SERVER_PORT"
echo "   Max Concurrent Requests: $MAX_CONCURRENT_REQUESTS"
echo "   Cache Enabled: $CACHE_ENABLED"
echo "   Citations Enabled: $ENABLE_CITATIONS"
echo "   Kiro Integration: $KIRO_INTEGRATION_MODE"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the server with process management
echo "🎯 Starting MCP server..."
echo "   Use Ctrl+C to stop the server"
echo "   Health check available at: http://localhost:$MCP_SERVER_PORT/health"
echo ""

# Start the server
exec vibe-pm-agent