#!/bin/bash

# Quick deployment check for Vibe PM Agent Lambda

set -e

FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-dev-vibe-pm-agent-lambda}"
REGION="${AWS_REGION:-us-east-1}"

echo "🔍 Checking Lambda deployment..."
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo ""

# Check if function exists
echo "1️⃣ Checking if function exists..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &>/dev/null; then
    echo "   ✅ Function exists"
else
    echo "   ❌ Function not found!"
    echo ""
    echo "Available functions:"
    aws lambda list-functions --region "$REGION" --query 'Functions[].FunctionName' --output table
    exit 1
fi

# Get function details
echo ""
echo "2️⃣ Function details:"
aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" \
    --query '{
        Runtime: Configuration.Runtime,
        Handler: Configuration.Handler,
        Timeout: Configuration.Timeout,
        Memory: Configuration.MemorySize,
        LastModified: Configuration.LastModified,
        CodeSize: Configuration.CodeSize,
        State: Configuration.State
    }' --output table

# Test health check
echo ""
echo "3️⃣ Testing health check..."
aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload '{"path":"/health","httpMethod":"GET","body":null}' \
    --region "$REGION" \
    --cli-binary-format raw-in-base64-out \
    response.json &>/dev/null

if [ -f response.json ]; then
    STATUS=$(cat response.json | jq -r '.statusCode // "unknown"')
    if [ "$STATUS" = "200" ]; then
        echo "   ✅ Health check passed"
        echo ""
        echo "   Response:"
        cat response.json | jq '.body | fromjson'
    else
        echo "   ⚠️  Health check returned status: $STATUS"
        cat response.json | jq '.'
    fi
    rm response.json
else
    echo "   ❌ Health check failed"
    exit 1
fi

# Check recent invocations
echo ""
echo "4️⃣ Recent invocations (last hour):"
INVOCATIONS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value="$FUNCTION_NAME" \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Sum \
    --region "$REGION" \
    --query 'Datapoints[0].Sum' --output text)

if [ "$INVOCATIONS" != "None" ] && [ -n "$INVOCATIONS" ]; then
    echo "   📊 $INVOCATIONS invocations"
else
    echo "   📊 No recent invocations"
fi

# Check for errors
ERRORS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions Name=FunctionName,Value="$FUNCTION_NAME" \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 3600 \
    --statistics Sum \
    --region "$REGION" \
    --query 'Datapoints[0].Sum' --output text)

if [ "$ERRORS" != "None" ] && [ -n "$ERRORS" ] && [ "$ERRORS" != "0" ]; then
    echo "   ⚠️  $ERRORS errors detected"
else
    echo "   ✅ No errors"
fi

echo ""
echo "✨ Deployment check complete!"
echo ""
echo "Next steps:"
echo "  • Run full tests: npm run test:lambda"
echo "  • View logs: aws logs tail /aws/lambda/$FUNCTION_NAME --follow"
echo "  • Test specific tool: ./test-lambda.sh <test-name>"
