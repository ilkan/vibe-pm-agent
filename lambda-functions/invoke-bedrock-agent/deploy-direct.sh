#!/bin/bash

# Direct AWS CLI deployment for Bedrock Agent Lambda
set -e

# Configuration
FUNCTION_NAME="invoke-bedrock-agent-dev"
REGION="us-east-1"
BEDROCK_AGENT_ID="ULX1RJGKCR"
BEDROCK_AGENT_ALIAS_ID="TSTALIASID"
COGNITO_USER_POOL_ID="us-east-1_gFn54IyZ5"

echo "🚀 Deploying Bedrock Agent Lambda directly..."
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo "Agent ID: $BEDROCK_AGENT_ID"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create deployment package
echo "📦 Creating deployment package..."
zip -r function.zip . -x "*.sh" "template.yaml" "*.md" ".aws-sam/*" "node_modules/.cache/*"

# Create IAM role for Lambda
echo "🔐 Creating IAM role..."
ROLE_NAME="InvokeBedrockAgentRole"

# Check if role exists
if aws iam get-role --role-name $ROLE_NAME --region $REGION >/dev/null 2>&1; then
    echo "Role $ROLE_NAME already exists"
else
    # Create trust policy
    cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json \
        --region $REGION

    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $REGION

    # Create and attach Bedrock policy
    cat > bedrock-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent",
        "bedrock-agent:InvokeAgent",
        "bedrock-agent-runtime:InvokeAgent",
        "bedrock-runtime:InvokeModel"
      ],
      "Resource": "*"
    }
  ]
}
EOF

    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name BedrockAgentAccess \
        --policy-document file://bedrock-policy.json \
        --region $REGION

    echo "Waiting for role to be ready..."
    sleep 10
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text --region $REGION)
echo "Role ARN: $ROLE_ARN"

# Create or update Lambda function
echo "🔧 Creating/updating Lambda function..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip \
        --region $REGION

    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment Variables="{AWS_REGION=$REGION,BEDROCK_AGENT_ID=$BEDROCK_AGENT_ID,BEDROCK_AGENT_ALIAS_ID=$BEDROCK_AGENT_ALIAS_ID}" \
        --region $REGION
else
    echo "Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler index.handler \
        --zip-file fileb://function.zip \
        --timeout 30 \
        --environment Variables="{AWS_REGION=$REGION,BEDROCK_AGENT_ID=$BEDROCK_AGENT_ID,BEDROCK_AGENT_ALIAS_ID=$BEDROCK_AGENT_ALIAS_ID}" \
        --region $REGION
fi

# Create API Gateway
echo "🌐 Creating API Gateway..."
API_NAME="bedrock-agent-api"

# Check if API exists
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text --region $REGION)

if [ "$API_ID" = "" ] || [ "$API_ID" = "None" ]; then
    echo "Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "Bedrock Agent API for web UI" \
        --query 'id' \
        --output text \
        --region $REGION)
    echo "Created API: $API_ID"
else
    echo "Using existing API: $API_ID"
fi

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text \
    --region $REGION)

# Create /invoke resource if it doesn't exist
INVOKE_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?pathPart==`invoke`].id' \
    --output text \
    --region $REGION)

if [ "$INVOKE_RESOURCE_ID" = "" ] || [ "$INVOKE_RESOURCE_ID" = "None" ]; then
    echo "Creating /invoke resource..."
    INVOKE_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part invoke \
        --query 'id' \
        --output text \
        --region $REGION)
fi

# Create Cognito authorizer
echo "🔐 Creating Cognito authorizer..."
USER_POOL_ARN="arn:aws:cognito-idp:$REGION:$(aws sts get-caller-identity --query Account --output text):userpool/$COGNITO_USER_POOL_ID"

AUTHORIZER_ID=$(aws apigateway get-authorizers \
    --rest-api-id $API_ID \
    --query 'items[?name==`CognitoAuthorizer`].id' \
    --output text \
    --region $REGION)

if [ "$AUTHORIZER_ID" = "" ] || [ "$AUTHORIZER_ID" = "None" ]; then
    AUTHORIZER_ID=$(aws apigateway create-authorizer \
        --rest-api-id $API_ID \
        --name CognitoAuthorizer \
        --type COGNITO_USER_POOLS \
        --provider-arns $USER_POOL_ARN \
        --identity-source method.request.header.Authorization \
        --query 'id' \
        --output text \
        --region $REGION)
fi

# Create POST method
echo "📝 Creating POST method..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $INVOKE_RESOURCE_ID \
    --http-method POST \
    --authorization-type COGNITO_USER_POOLS \
    --authorizer-id $AUTHORIZER_ID \
    --region $REGION >/dev/null 2>&1 || true

# Create OPTIONS method for CORS
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $INVOKE_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION >/dev/null 2>&1 || true

# Get Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function \
    --function-name $FUNCTION_NAME \
    --query 'Configuration.FunctionArn' \
    --output text \
    --region $REGION)

# Set up Lambda integration for POST
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $INVOKE_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION >/dev/null 2>&1 || true

# Set up mock integration for OPTIONS (CORS)
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $INVOKE_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region $REGION >/dev/null 2>&1 || true

# Set up integration response for OPTIONS
aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $INVOKE_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,Authorization'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
    --region $REGION >/dev/null 2>&1 || true

# Set up method response for OPTIONS
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $INVOKE_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
    --region $REGION >/dev/null 2>&1 || true

# Give API Gateway permission to invoke Lambda
echo "🔗 Setting up Lambda permissions..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*" \
    --region $REGION >/dev/null 2>&1 || true

# Deploy API
echo "🚀 Deploying API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name dev \
    --region $REGION >/dev/null

# Get API URL
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/dev"

echo ""
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

# Cleanup
rm -f function.zip trust-policy.json bedrock-policy.json

echo ""
echo "🎉 Ready to integrate with your React chat app!"