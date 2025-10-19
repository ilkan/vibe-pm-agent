#!/bin/bash

# Deploy Bedrock Agent Lambda using CloudFormation directly
set -e

# Configuration
STACK_NAME="bedrock-agent-web-api-cf"
REGION="us-east-1"
ENVIRONMENT="dev"
BEDROCK_AGENT_ID="ULX1RJGKCR"
BEDROCK_AGENT_ALIAS_ID="TSTALIASID"
COGNITO_USER_POOL_ID="us-east-1_gFn54IyZ5"

echo "🚀 Deploying Bedrock Agent Web API with CloudFormation..."
echo "Stack: $STACK_NAME"
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"
echo "Agent ID: $BEDROCK_AGENT_ID"
echo ""

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "📝 Updating existing stack..."
    OPERATION="update-stack"
else
    echo "🆕 Creating new stack..."
    OPERATION="create-stack"
fi

# Deploy with CloudFormation
aws cloudformation $OPERATION \
    --stack-name "$STACK_NAME" \
    --template-body file://cloudformation-template.yaml \
    --parameters \
        ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
        ParameterKey=BedrockAgentId,ParameterValue="$BEDROCK_AGENT_ID" \
        ParameterKey=BedrockAgentAliasId,ParameterValue="$BEDROCK_AGENT_ALIAS_ID" \
        ParameterKey=CognitoUserPoolId,ParameterValue="$COGNITO_USER_POOL_ID" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION"

echo ""
echo "⏳ Waiting for stack operation to complete..."

if [ "$OPERATION" = "create-stack" ]; then
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$REGION"
else
    aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$REGION"
fi

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