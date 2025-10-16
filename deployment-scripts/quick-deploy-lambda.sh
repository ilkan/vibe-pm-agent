#!/bin/bash

# Quick Lambda Deployment Fix
# This script quickly rebuilds and deploys the Lambda function

set -e

FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-dev-vibe-pm-agent-lambda}"
REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Quick Lambda Deployment"
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo ""

# Navigate to lambda-functions directory
cd "$(dirname "$0")/../lambda-functions"

echo "1️⃣ Installing dependencies..."
npm install --production

echo ""
echo "2️⃣ Building TypeScript..."
npm run build

echo ""
echo "3️⃣ Creating deployment package..."
cd dist

# Copy node_modules to dist
echo "   Copying production dependencies..."
cp ../package.json .
npm install --production --no-optional

# Remove unnecessary files
echo "   Cleaning up unnecessary files..."
find . -name "*.ts" -type f -delete 2>/dev/null || true
find . -name "*.d.ts" -type f -delete 2>/dev/null || true
find . -name "*.map" -type f -delete 2>/dev/null || true

# Create zip
echo "   Creating ZIP archive..."
zip -r ../lambda-deployment.zip . -q

cd ..

echo ""
echo "4️⃣ Deploying to AWS Lambda..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://lambda-deployment.zip \
    --region "$REGION"

echo ""
echo "5️⃣ Waiting for update to complete..."
aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test your deployment:"
echo "  ./check-deployment.sh"
echo "  npm run test:lambda"

# Cleanup
rm -f lambda-deployment.zip
