#!/bin/bash

# API Gateway Deployment Script for Vibe PM Agent
# Deploys API Gateway and Lambda functions for all 32 PM tools

set -e

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="vibe-pm-agent-${ENVIRONMENT}"
LAMBDA_FUNCTION_NAME="vibe-pm-agent-${ENVIRONMENT}"
EXTERNAL_ACCESS_ENABLED=${EXTERNAL_ACCESS_ENABLED:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting API Gateway deployment for Vibe PM Agent${NC}"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack Name: $STACK_NAME"
echo "External Access: $EXTERNAL_ACCESS_ENABLED"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please configure AWS CLI.${NC}"
    exit 1
fi

# Function to check if Lambda function exists
check_lambda_exists() {
    echo -e "${YELLOW}🔍 Checking if Lambda function exists...${NC}"
    if aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --region "$REGION" &> /dev/null; then
        echo -e "${GREEN}✅ Lambda function exists${NC}"
        return 0
    else
        echo -e "${RED}❌ Lambda function does not exist. Please deploy Lambda functions first.${NC}"
        return 1
    fi
}

# Function to get Lambda function ARN
get_lambda_arn() {
    echo -e "${YELLOW}📋 Getting Lambda function ARN...${NC}"
    LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --region "$REGION" --query 'Configuration.FunctionArn' --output text)
    echo -e "${GREEN}✅ Lambda ARN: $LAMBDA_ARN${NC}"
    echo "$LAMBDA_ARN"
}

# Function to package Lambda function
package_lambda() {
    echo -e "${YELLOW}📦 Packaging Lambda function...${NC}"
    cd lambda-functions

    # Install dependencies
    echo "Installing dependencies..."
    npm ci --production

    # Build TypeScript
    echo "Building TypeScript..."
    npm run build:prod

    # Create deployment package
    echo "Creating deployment package..."
    cd dist
    zip -r ../../lambda-function.zip . -q
    cd ..

    echo -e "${GREEN}✅ Lambda function packaged${NC}"
    cd ..
}

# Function to deploy Lambda function
deploy_lambda() {
    echo -e "${YELLOW}🚀 Deploying Lambda function...${NC}"

    # Update function code
    aws lambda update-function-code \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --zip-file fileb://lambda-function.zip \
        --region "$REGION" \
        --no-cli-pager

    echo -e "${GREEN}✅ Lambda function deployed${NC}"
}

# Function to setup API keys for external access
setup_api_keys() {
    if [ "$EXTERNAL_ACCESS_ENABLED" = "true" ]; then
        echo -e "${YELLOW}🔑 Setting up API keys for external access...${NC}"
        
        # Check if .aws/api-keys.json exists
        if [ ! -f ".aws/api-keys.json" ]; then
            echo -e "${YELLOW}⚠️  API keys file not found. Creating from template...${NC}"
            
            # Create .aws directory if it doesn't exist
            mkdir -p .aws
            
            # Copy template if it exists
            if [ -f ".aws-templates/api-keys.template.json" ]; then
                cp .aws-templates/api-keys.template.json .aws/api-keys.json
                echo -e "${GREEN}✅ API keys template copied to .aws/api-keys.json${NC}"
                echo -e "${YELLOW}⚠️  Please update .aws/api-keys.json with actual API keys before deployment${NC}"
            else
                echo -e "${RED}❌ API keys template not found. Please create .aws/api-keys.json manually${NC}"
                return 1
            fi
        else
            echo -e "${GREEN}✅ API keys file found${NC}"
        fi
        
        # Validate API keys file format
        if ! python3 -m json.tool .aws/api-keys.json > /dev/null 2>&1; then
            echo -e "${RED}❌ Invalid JSON format in .aws/api-keys.json${NC}"
            return 1
        fi
        
        echo -e "${GREEN}✅ API keys configuration validated${NC}"
    else
        echo -e "${YELLOW}⚠️  External access disabled, skipping API key setup${NC}"
    fi
}

# Function to deploy API Gateway
deploy_api_gateway() {
    echo -e "${YELLOW}🌐 Deploying API Gateway...${NC}"

    # Package CloudFormation template
    aws cloudformation package \
        --template-file infrastructure/api-gateway.yaml \
        --s3-bucket "vibe-pm-agent-${ENVIRONMENT}-deployment-bucket" \
        --output-template-file api-gateway-packaged.yaml \
        --region "$REGION"

    # Deploy CloudFormation stack
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
        echo "Updating existing stack..."
        aws cloudformation update-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://api-gateway-packaged.yaml \
            --parameters ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                         ParameterKey=LambdaFunctionArn,ParameterValue="$LAMBDA_ARN" \
                         ParameterKey=ExternalAccessEnabled,ParameterValue="$EXTERNAL_ACCESS_ENABLED" \
            --capabilities CAPABILITY_IAM \
            --region "$REGION"
    else
        echo "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://api-gateway-packaged.yaml \
            --parameters ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                         ParameterKey=LambdaFunctionArn,ParameterValue="$LAMBDA_ARN" \
                         ParameterKey=ExternalAccessEnabled,ParameterValue="$EXTERNAL_ACCESS_ENABLED" \
            --capabilities CAPABILITY_IAM \
            --region "$REGION"
    fi

    echo -e "${YELLOW}⏳ Waiting for stack deployment to complete...${NC}"
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$REGION" || \
    aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$REGION"

    echo -e "${GREEN}✅ API Gateway deployed successfully${NC}"
}

# Function to get API Gateway URL
get_api_url() {
    echo -e "${YELLOW}🔗 Getting API Gateway URL...${NC}"
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text)

    echo -e "${GREEN}✅ API Gateway URL: $API_URL${NC}"
    echo "$API_URL"
}

# Function to test API Gateway
test_api_gateway() {
    echo -e "${YELLOW}🧪 Testing API Gateway...${NC}"

    # Test health endpoint
    echo "Testing health endpoint..."
    RESPONSE=$(curl -s "$API_URL/health" || echo "Curl failed")

    if [[ $RESPONSE == *"healthy"* ]]; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check response: $RESPONSE${NC}"
    fi

    # Test external access if enabled
    if [ "$EXTERNAL_ACCESS_ENABLED" = "true" ]; then
        echo "Testing external access with API key..."
        
        # Extract first API key from config for testing
        if [ -f ".aws/api-keys.json" ]; then
            TEST_API_KEY=$(python3 -c "
import json
with open('.aws/api-keys.json', 'r') as f:
    data = json.load(f)
    if 'apiKeys' in data and len(data['apiKeys']) > 0:
        print(data['apiKeys'][0].get('keyId', 'test-key'))
    else:
        print('test-key')
" 2>/dev/null || echo "test-key")
        else
            TEST_API_KEY="test-key"
        fi
        
        # Test a sample tool endpoint with API key
        SAMPLE_PAYLOAD='{
            "toolName": "validate_idea_quick",
            "toolArgs": {
                "idea": "Test idea for API validation",
                "criteria": ["market_viability", "technical_feasibility"]
            }
        }'

        RESPONSE=$(curl -s -X POST "$API_URL/business-analysis/validate-idea" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $TEST_API_KEY" \
            -d "$SAMPLE_PAYLOAD" || echo "Curl failed")

        if [[ $RESPONSE == *"success"* ]]; then
            echo -e "${GREEN}✅ External API access test passed${NC}"
        else
            echo -e "${YELLOW}⚠️  External API response: $RESPONSE${NC}"
            echo -e "${YELLOW}⚠️  Note: This may fail if API keys are not properly configured${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  External access disabled, skipping API key tests${NC}"
    fi
}

# Function to cleanup deployment artifacts
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up deployment artifacts...${NC}"
    rm -f lambda-function.zip api-gateway-packaged.yaml
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main deployment flow
main() {
    echo -e "${GREEN}=== Vibe PM Agent API Gateway Deployment ===${NC}"

    # Check prerequisites
    check_lambda_exists || exit 1

    # Get Lambda ARN
    LAMBDA_ARN=$(get_lambda_arn)

    # Setup API keys for external access
    setup_api_keys

    # Package Lambda function
    package_lambda

    # Deploy Lambda function
    deploy_lambda

    # Deploy API Gateway
    deploy_api_gateway

    # Get API URL
    API_URL=$(get_api_url)

    # Test API Gateway
    test_api_gateway

    # Cleanup
    cleanup

    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}📋 API Gateway URL: $API_URL${NC}"
    echo ""
    echo -e "${YELLOW}📚 Available endpoints:${NC}"
    echo "Health check: $API_URL/health"
    echo "Business Analysis: $API_URL/business-analysis/"
    echo "Communications: $API_URL/communications/"
    echo "Requirements: $API_URL/requirements/"
    echo "Market Intelligence: $API_URL/market-intelligence/"
    echo "Interview Prep: $API_URL/interview-prep/"
    echo "Case Studies: $API_URL/case-studies/"
    echo ""
    echo -e "${YELLOW}🔧 Total tools available: 32${NC}"
    echo ""
    if [ "$EXTERNAL_ACCESS_ENABLED" = "true" ]; then
        echo -e "${YELLOW}🔑 External Access Configuration:${NC}"
        echo "- External access is ENABLED"
        echo "- API keys are required for external requests"
        echo "- Configure API keys in .aws/api-keys.json"
        echo "- Use X-API-Key header for authentication"
        echo ""
        echo -e "${YELLOW}🔒 Internal Access:${NC}"
        echo "- Bedrock agents can access directly via Lambda ARN"
        echo "- No authentication required for internal requests"
        echo "- Lambda ARN: $LAMBDA_ARN"
    else
        echo -e "${YELLOW}🔒 Access Configuration:${NC}"
        echo "- External access is DISABLED"
        echo "- Only internal AWS access via Lambda ARN"
        echo "- Set EXTERNAL_ACCESS_ENABLED=true to enable external access"
    fi
}

# Run main function
main "$@"
