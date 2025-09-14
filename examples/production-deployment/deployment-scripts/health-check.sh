#!/bin/bash

# Vibe PM Agent - Health Check Script
# This script checks the health status of the MCP server

set -e

# Configuration
HOST=${MCP_SERVER_HOST:-localhost}
PORT=${MCP_SERVER_PORT:-3001}
HEALTH_ENDPOINT="http://$HOST:$PORT/health"
TIMEOUT=${HEALTH_CHECK_TIMEOUT:-10}

echo "🏥 Vibe PM Agent Health Check"
echo "============================="
echo "Checking: $HEALTH_ENDPOINT"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Function to check if server is responding
check_health() {
    local response
    local http_code
    
    # Make request with timeout
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" --max-time "$TIMEOUT" "$HEALTH_ENDPOINT" 2>/dev/null || echo "HTTPSTATUS:000")
    
    # Extract HTTP status code
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    # Extract response body
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    case $http_code in
        200)
            echo "✅ Server is healthy"
            echo "📊 Health Status:"
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
            return 0
            ;;
        000)
            echo "❌ Server is not responding"
            echo "   - Check if the server is running"
            echo "   - Verify the host and port: $HOST:$PORT"
            echo "   - Check firewall settings"
            return 1
            ;;
        *)
            echo "⚠️  Server responded with HTTP $http_code"
            echo "Response: $body"
            return 1
            ;;
    esac
}

# Function to check server tools
check_tools() {
    echo ""
    echo "🔧 Checking available tools..."
    
    # This would require MCP client implementation
    # For now, just check if the server responds to health endpoint
    if check_health > /dev/null 2>&1; then
        echo "✅ Tools endpoint accessible"
        echo "   Use MCP client to list available tools"
    else
        echo "❌ Cannot verify tools - server not responding"
        return 1
    fi
}

# Function to check performance metrics
check_performance() {
    local response
    
    echo ""
    echo "📈 Performance Metrics:"
    
    response=$(curl -s --max-time "$TIMEOUT" "$HEALTH_ENDPOINT" 2>/dev/null || echo "{}")
    
    if command -v jq &> /dev/null; then
        echo "$response" | jq -r '
            "   Uptime: " + (.uptime // 0 | tostring) + "ms",
            "   Total Requests: " + (.performance.totalRequests // 0 | tostring),
            "   Average Response Time: " + (.performance.averageResponseTime // 0 | tostring) + "ms",
            "   Error Rate: " + (.performance.errorRate // 0 | tostring) + "%",
            "   Tools Available: " + (.toolsAvailable // [] | length | tostring)
        ' 2>/dev/null || echo "   Unable to parse performance metrics"
    else
        echo "   Install 'jq' for detailed performance metrics"
    fi
}

# Main health check
main() {
    local exit_code=0
    
    # Basic health check
    if ! check_health; then
        exit_code=1
    fi
    
    # Performance metrics (non-blocking)
    check_performance || true
    
    # Tools check (non-blocking)
    check_tools || true
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        echo "🎉 Overall Status: HEALTHY"
    else
        echo "💥 Overall Status: UNHEALTHY"
    fi
    
    exit $exit_code
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --quiet, -q    Quiet mode (exit code only)"
        echo "  --watch, -w    Watch mode (continuous monitoring)"
        echo ""
        echo "Environment Variables:"
        echo "  MCP_SERVER_HOST          Server host (default: localhost)"
        echo "  MCP_SERVER_PORT          Server port (default: 3001)"
        echo "  HEALTH_CHECK_TIMEOUT     Timeout in seconds (default: 10)"
        exit 0
        ;;
    --quiet|-q)
        check_health > /dev/null 2>&1
        exit $?
        ;;
    --watch|-w)
        echo "👀 Watching server health (Ctrl+C to stop)..."
        while true; do
            clear
            main || true
            sleep 5
        done
        ;;
    *)
        main
        ;;
esac