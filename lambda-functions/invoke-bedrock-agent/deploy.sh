#!/bin/bash

# Deploy Bedrock Agent Invocation Lambda with API Gateway
set -e

# Configuration
STACK_NAME="bedrock-agent-web-api"
REGION="us-east-1"
ENVIRONMENT="dev"
BEDROCK_AGENT_ID="ULX1RJGKCR"
BEDROCK_AGENT_ALIAS_ID="TSTALIASID"
COGNITO_USER_POOL_ID="us-east-1_gFn54IyZ5"

echo "🚀 Deploying Bedrock Agent Web API..."
echo "Stack: $STACK_NAME"
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"
echo "Agent ID: $BEDROCK_AGENT_ID"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build and deploy with SAM
echo "🏗️ Building and deploying with SAM..."
sam build --use-container

sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment="$ENVIRONMENT" \
    BedrockAgentId="$BEDROCK_AGENT_ID" \
    BedrockAgentAliasId="$BEDROCK_AGENT_ALIAS_ID" \
    CognitoUserPoolId="$COGNITO_USER_POOL_ID" \
  --confirm-changeset \
  --resolve-s3

# Get the API Gateway URL
echo ""
echo "🔍 Getting API Gateway URL..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text)

if [ -n "$API_URL" ]; then
  echo "✅ Deployment successful!"
  echo ""
  echo "🌐 API Gateway URL: $API_URL"
  echo "📍 Invoke endpoint: $API_URL/invoke"
  echo ""
  echo "🔧 Add this to your React app environment:"
  echo "VITE_API_GATEWAY_URL=$API_URL"
  echo ""
  echo "🧪 Test with curl:"
  echo "curl -X POST $API_URL/invoke \\"
  echo "  -H 'Content-Type: application/json' \\"
  echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
  echo "  -d '{\"text\":\"Hello, what can you help me with?\"}'"
else
  echo "❌ Failed to get API Gateway URL"
  exit 1
fi

echo ""
echo "🎉 Ready to integrate with your React chat app!"