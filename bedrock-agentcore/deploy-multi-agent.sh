#!/bin/bash

# Vibe PM Agent - Complete Multi-Agent Deployment Script
# Deploys Lambda function, creates Bedrock agents, and sets up orchestration

set -e

# Configuration - UPDATE THESE VALUES
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="119370291155"  # Your AWS account ID
LAMBDA_FUNCTION_NAME="vibe-pm-agent-lambda"
BEDROCK_ROLE_NAME="AmazonBedrockExecutionRoleForAgents_vibe-pm"

# Derived values
LAMBDA_ARN="arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:${LAMBDA_FUNCTION_NAME}"
ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${BEDROCK_ROLE_NAME}"

echo "🚀 Vibe PM Agent Multi-Agent Deployment"
echo "========================================"
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo "Lambda: $LAMBDA_FUNCTION_NAME"
echo "Role: $BEDROCK_ROLE_NAME"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ AWS credentials not configured. Please run 'aws configure'."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        echo "❌ jq not found. Please install jq for JSON processing."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js."
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
}

# Function to deploy Lambda function
deploy_lambda() {
    echo "📦 Deploying Lambda function..."
    
    cd lambda-functions
    
    # Install dependencies
    echo "  Installing dependencies..."
    npm install
    
    # Build TypeScript
    echo "  Building TypeScript..."
    npm run build
    
    # Create deployment package
    echo "  Creating deployment package..."
    zip -r lambda-deployment.zip . -x "*.ts" "tsconfig*.json" "test*" "*.test.js" "node_modules/@types/*" "*.md"
    
    # Check if Lambda function exists
    if aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --region "$AWS_REGION" &> /dev/null; then
        echo "  Updating existing Lambda function..."
        aws lambda update-function-code \
            --function-name "$LAMBDA_FUNCTION_NAME" \
            --zip-file fileb://lambda-deployment.zip \
            --region "$AWS_REGION" > /dev/null
    else
        echo "  Creating new Lambda function..."
        aws lambda create-function \
            --function-name "$LAMBDA_FUNCTION_NAME" \
            --runtime nodejs18.x \
            --role "$ROLE_ARN" \
            --handler "router.handler" \
            --zip-file fileb://lambda-deployment.zip \
            --timeout 300 \
            --memory-size 512 \
            --environment "Variables={NODE_ENV=production,EXTERNAL_ACCESS_ENABLED=true,DEPLOYMENT_REGION=$AWS_REGION}" \
            --region "$AWS_REGION" > /dev/null
    fi
    
    # Clean up
    rm lambda-deployment.zip
    cd ..
    
    echo "✅ Lambda function deployed successfully"
}

# Function to create IAM role for Bedrock agents
create_bedrock_role() {
    echo "🔐 Creating Bedrock execution role..."
    
    # Check if role exists
    if aws iam get-role --role-name "$BEDROCK_ROLE_NAME" &> /dev/null; then
        echo "  Role already exists: $BEDROCK_ROLE_NAME"
        return
    fi
    
    # Create trust policy
    cat > bedrock-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "bedrock.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name "$BEDROCK_ROLE_NAME" \
        --assume-role-policy-document file://bedrock-trust-policy.json \
        --region "$AWS_REGION" > /dev/null
    
    # Attach policies
    aws iam attach-role-policy \
        --role-name "$BEDROCK_ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
    
    # Create and attach Lambda invoke policy
    cat > lambda-invoke-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": "$LAMBDA_ARN"
        }
    ]
}
EOF

    aws iam put-role-policy \
        --role-name "$BEDROCK_ROLE_NAME" \
        --policy-name "LambdaInvokePolicy" \
        --policy-document file://lambda-invoke-policy.json
    
    # Clean up
    rm bedrock-trust-policy.json lambda-invoke-policy.json
    
    echo "✅ Bedrock execution role created"
    echo "  Waiting 10 seconds for role propagation..."
    sleep 10
}

# Function to create agents
create_agents() {
    echo "🤖 Creating Bedrock agents..."
    
    # Update create-agents.sh with actual values
    sed -i.bak "s|LAMBDA_ARN=\".*\"|LAMBDA_ARN=\"$LAMBDA_ARN\"|g" bedrock-agentcore/create-agents.sh
    sed -i.bak "s|ROLE_ARN=\".*\"|ROLE_ARN=\"$ROLE_ARN\"|g" bedrock-agentcore/create-agents.sh
    sed -i.bak "s|REGION=\".*\"|REGION=\"$AWS_REGION\"|g" bedrock-agentcore/create-agents.sh
    
    # Make script executable and run
    chmod +x bedrock-agentcore/create-agents.sh
    ./bedrock-agentcore/create-agents.sh
    
    echo "✅ Bedrock agents created"
}

# Function to update configuration with actual agent IDs
update_configuration() {
    echo "⚙️  Updating configuration with agent IDs..."
    
    if [ ! -f "bedrock-agentcore/agent-registry.csv" ]; then
        echo "❌ Agent registry not found. Agent creation may have failed."
        return 1
    fi
    
    # Read agent IDs from registry and update config
    while IFS=',' read -r agent_name agent_id action_group_id; do
        if [ "$agent_name" != "agent_name" ]; then  # Skip header
            case "$agent_name" in
                "vibe-pm-business-strategy-agent")
                    jq --arg id "$agent_id" '.agents["business-strategy"].agentId = $id' bedrock-agentcore/agent-config.json > tmp.json && mv tmp.json bedrock-agentcore/agent-config.json
                    ;;
                "vibe-pm-product-development-agent")
                    jq --arg id "$agent_id" '.agents["product-development"].agentId = $id' bedrock-agentcore/agent-config.json > tmp.json && mv tmp.json bedrock-agentcore/agent-config.json
                    ;;
                "vibe-pm-executive-communications-agent")
                    jq --arg id "$agent_id" '.agents["executive-communications"].agentId = $id' bedrock-agentcore/agent-config.json > tmp.json && mv tmp.json bedrock-agentcore/agent-config.json
                    ;;
                "vibe-pm-interview-coaching-agent")
                    jq --arg id "$agent_id" '.agents["interview-coaching"].agentId = $id' bedrock-agentcore/agent-config.json > tmp.json && mv tmp.json bedrock-agentcore/agent-config.json
                    ;;
            esac
        fi
    done < bedrock-agentcore/agent-registry.csv
    
    echo "✅ Configuration updated with agent IDs"
}

# Function to run tests
run_tests() {
    echo "🧪 Running comprehensive tests..."
    
    # Make test script executable
    chmod +x bedrock-agentcore/comprehensive-test.js
    
    # Run tests
    node bedrock-agentcore/comprehensive-test.js
    
    echo "✅ Tests completed"
}

# Function to display deployment summary
display_summary() {
    echo ""
    echo "🎉 Multi-Agent Deployment Complete!"
    echo "===================================="
    echo ""
    echo "📋 Deployment Summary:"
    echo "- Lambda Function: $LAMBDA_FUNCTION_NAME"
    echo "- Bedrock Role: $BEDROCK_ROLE_NAME"
    echo "- Region: $AWS_REGION"
    echo "- Agents Created: 4"
    echo "- Tools Distributed: 32 (8 per agent)"
    echo ""
    echo "🤖 Agents:"
    if [ -f "bedrock-agentcore/agent-registry.csv" ]; then
        tail -n +2 bedrock-agentcore/agent-registry.csv | while IFS=',' read -r agent_name agent_id action_group_id; do
            echo "  - $agent_name: $agent_id"
        done
    fi
    echo ""
    echo "📁 Files Created:"
    echo "  - bedrock-agentcore/agent-registry.csv (Agent IDs)"
    echo "  - bedrock-agentcore/agent-config.json (Configuration)"
    echo "  - bedrock-agentcore/test-results.json (Test Results)"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Test individual agents: ./bedrock-agentcore/test-agents.sh"
    echo "2. Test orchestration: node bedrock-agentcore/comprehensive-test.js"
    echo "3. Monitor CloudWatch logs for agent performance"
    echo "4. Update API Gateway for external access (if needed)"
    echo ""
    echo "📖 Documentation:"
    echo "  - Architecture: bedrock-agentcore/agent-architecture.md"
    echo "  - Configuration: bedrock-agentcore/agent-config.json"
    echo "  - Test Results: bedrock-agentcore/test-results.json"
}

# Main deployment flow
main() {
    echo "Starting deployment process..."
    echo ""
    
    check_prerequisites
    echo ""
    
    deploy_lambda
    echo ""
    
    create_bedrock_role
    echo ""
    
    create_agents
    echo ""
    
    update_configuration
    echo ""
    
    run_tests
    echo ""
    
    display_summary
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "test-only")
        run_tests
        ;;
    "agents-only")
        create_agents
        update_configuration
        ;;
    "lambda-only")
        deploy_lambda
        ;;
    "help")
        echo "Usage: $0 [deploy|test-only|agents-only|lambda-only|help]"
        echo ""
        echo "Commands:"
        echo "  deploy      - Full deployment (default)"
        echo "  test-only   - Run tests only"
        echo "  agents-only - Create agents only"
        echo "  lambda-only - Deploy Lambda only"
        echo "  help        - Show this help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac