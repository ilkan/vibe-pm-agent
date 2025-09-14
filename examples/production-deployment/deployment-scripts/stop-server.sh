#!/bin/bash

# Vibe PM Agent - Server Stop Script
# This script gracefully stops the MCP server

set -e

echo "🛑 Stopping Vibe PM Agent MCP Server"
echo "===================================="

# Configuration
SERVER_NAME="vibe-pm-agent"
TIMEOUT=${STOP_TIMEOUT:-30}

# Function to find server processes
find_server_processes() {
    # Look for Node.js processes running vibe-pm-agent
    pgrep -f "$SERVER_NAME" 2>/dev/null || true
}

# Function to gracefully stop processes
graceful_stop() {
    local pids="$1"
    local count=0
    
    if [ -z "$pids" ]; then
        echo "✅ No server processes found"
        return 0
    fi
    
    echo "📋 Found server processes: $pids"
    
    # Send SIGTERM for graceful shutdown
    echo "🔄 Sending graceful shutdown signal (SIGTERM)..."
    for pid in $pids; do
        if kill -TERM "$pid" 2>/dev/null; then
            echo "   Sent SIGTERM to process $pid"
        else
            echo "   ⚠️  Could not send SIGTERM to process $pid (may have already stopped)"
        fi
    done
    
    # Wait for processes to stop gracefully
    echo "⏳ Waiting for graceful shutdown (timeout: ${TIMEOUT}s)..."
    while [ $count -lt $TIMEOUT ]; do
        local remaining_pids
        remaining_pids=$(find_server_processes)
        
        if [ -z "$remaining_pids" ]; then
            echo "✅ All processes stopped gracefully"
            return 0
        fi
        
        sleep 1
        count=$((count + 1))
        
        # Show progress every 5 seconds
        if [ $((count % 5)) -eq 0 ]; then
            echo "   Still waiting... (${count}/${TIMEOUT}s)"
        fi
    done
    
    # If we reach here, graceful shutdown failed
    return 1
}

# Function to force stop processes
force_stop() {
    local pids="$1"
    
    if [ -z "$pids" ]; then
        return 0
    fi
    
    echo "💥 Force stopping remaining processes..."
    for pid in $pids; do
        if kill -KILL "$pid" 2>/dev/null; then
            echo "   Force stopped process $pid"
        else
            echo "   ⚠️  Could not force stop process $pid"
        fi
    done
    
    sleep 2
    
    # Check if any processes remain
    local remaining_pids
    remaining_pids=$(find_server_processes)
    
    if [ -n "$remaining_pids" ]; then
        echo "❌ Some processes could not be stopped: $remaining_pids"
        return 1
    else
        echo "✅ All processes stopped"
        return 0
    fi
}

# Function to clean up resources
cleanup_resources() {
    echo "🧹 Cleaning up resources..."
    
    # Remove PID files if they exist
    if [ -f "/tmp/vibe-pm-agent.pid" ]; then
        rm -f "/tmp/vibe-pm-agent.pid"
        echo "   Removed PID file"
    fi
    
    # Clean up temporary files
    if [ -d "/tmp/vibe-pm-agent" ]; then
        rm -rf "/tmp/vibe-pm-agent"
        echo "   Removed temporary files"
    fi
    
    echo "✅ Cleanup completed"
}

# Main stop function
main() {
    local pids
    local exit_code=0
    
    # Find running processes
    pids=$(find_server_processes)
    
    if [ -z "$pids" ]; then
        echo "ℹ️  No Vibe PM Agent processes are currently running"
        cleanup_resources
        return 0
    fi
    
    # Try graceful shutdown first
    if graceful_stop "$pids"; then
        echo "🎉 Server stopped successfully"
    else
        echo "⚠️  Graceful shutdown timed out, attempting force stop..."
        
        # Get updated process list
        pids=$(find_server_processes)
        
        if force_stop "$pids"; then
            echo "🎉 Server force stopped successfully"
        else
            echo "❌ Failed to stop some processes"
            exit_code=1
        fi
    fi
    
    # Clean up resources
    cleanup_resources
    
    return $exit_code
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --force, -f    Force stop immediately (skip graceful shutdown)"
        echo "  --timeout, -t  Set graceful shutdown timeout in seconds"
        echo ""
        echo "Environment Variables:"
        echo "  STOP_TIMEOUT   Graceful shutdown timeout (default: 30 seconds)"
        exit 0
        ;;
    --force|-f)
        echo "💥 Force stopping server..."
        pids=$(find_server_processes)
        if force_stop "$pids"; then
            cleanup_resources
            echo "🎉 Server force stopped"
        else
            echo "❌ Failed to force stop server"
            exit 1
        fi
        ;;
    --timeout|-t)
        if [ -n "$2" ] && [ "$2" -gt 0 ] 2>/dev/null; then
            TIMEOUT="$2"
            echo "⏱️  Using custom timeout: ${TIMEOUT}s"
            main
        else
            echo "❌ Invalid timeout value: $2"
            echo "   Timeout must be a positive integer"
            exit 1
        fi
        ;;
    *)
        main
        ;;
esac