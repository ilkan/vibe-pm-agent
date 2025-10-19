#!/bin/bash

# Start the web-ui development server
set -e

echo "🚀 Starting Vibe PM Agent Web UI..."
echo ""

# Check if .env.local exists
if [ ! -f "web-ui/.env.local" ]; then
    echo "❌ Missing web-ui/.env.local file"
    echo "Please run the Cognito setup first"
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Check if node_modules exists
if [ ! -d "web-ui/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd web-ui && npm install && cd ..
fi

echo "🌐 Starting development server on http://localhost:5173"
echo ""
echo "📋 Available commands:"
echo "  - Press 'o' to open in browser"
echo "  - Press 'q' to quit"
echo "  - Press 'r' to restart"
echo ""

cd web-ui && npm run dev