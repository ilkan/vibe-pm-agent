#!/bin/bash

# Fix Lambda permissions for Bedrock agents

set -e

# Configuration
REGION="us-east-1"
LAMBDA_FUNCTION="vibe-pm-agent-lambda"
ACCOUNT_ID="119370291155"

echo "🔧 Adding Bedrock agent permissions to Lambda function..."
echo "Function: $LAMBDA_FUNCTION"
echo "Region: $REGION"
echo ""

# Add permission for Bedrock agents to invoke Lambda
aws lambda add-permission \
    --function-name "$LAMBDA_FUNCTION" \
    --statement-id "bedrock-agents-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "bedrock.amazonaws.com" \
    --source-account "$ACCOUNT_ID" \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo "✅ Lambda permissions added successfully"
else
    echo "❌ Failed to add Lambda permissions (may already exist)"
fi

# Verify the policy
echo ""
echo "📋 Current Lambda policy:"
aws lambda get-policy \
    --function-name "$LAMBDA_FUNCTION" \
    --region "$REGION" \
    --query 'Policy' \
    --output text | jq .

echo ""
echo "🎉 Lambda permissions configured for Bedrock agents!"