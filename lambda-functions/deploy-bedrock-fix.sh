#!/bin/bash

# Deploy the Bedrock agent fix to Lambda function

set -e

echo "🔧 Deploying Bedrock Agent Fix to Lambda..."
echo ""

# Build the TypeScript code
echo "📦 Building TypeScript code..."
cd lambda-functions
npm run build

if [ $? -eq 0 ]; then
    echo "✅ TypeScript build successful"
else
    echo "❌ TypeScript build failed"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ../bedrock-fix-deployment.zip . -x "*.ts" "tsconfig.json" "*.test.*" "node_modules/.cache/*"

if [ $? -eq 0 ]; then
    echo "✅ Deployment package created"
else
    echo "❌ Failed to create deployment package"
    exit 1
fi

cd ..

# Update Lambda function
echo "🚀 Updating Lambda function..."
aws lambda update-function-code \
    --function-name vibe-pm-agent-dev \
    --zip-file fileb://bedrock-fix-deployment.zip \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo "✅ Lambda function updated successfully"
else
    echo "❌ Failed to update Lambda function"
    exit 1
fi

# Clean up
rm bedrock-fix-deployment.zip

echo ""
echo "🎉 Bedrock Agent fix deployed successfully!"
echo ""
echo "🧪 Test the fix with:"
echo "  cd bedrock-agentcore"
echo "  python test-agents-simple.py"
echo "  node debug-lambda-response.js"