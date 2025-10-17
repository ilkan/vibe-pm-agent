#!/bin/bash

# Fix Lambda function ARN and permissions for Bedrock agents

set -e

# Configuration
REGION="us-east-1"
OLD_LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-lambda"
NEW_LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-dev"
LAMBDA_FUNCTION="vibe-pm-agent-dev"
ACCOUNT_ID="119370291155"

echo "🔧 Fixing Lambda function ARN and permissions for Bedrock agents..."
echo "Old Lambda: $OLD_LAMBDA_ARN"
echo "New Lambda: $NEW_LAMBDA_ARN"
echo ""

# Add permission for Bedrock agents to invoke Lambda
echo "Adding Bedrock permissions to Lambda function..."
aws lambda add-permission \
    --function-name "$LAMBDA_FUNCTION" \
    --statement-id "bedrock-agents-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "bedrock.amazonaws.com" \
    --source-account "$ACCOUNT_ID" \
    --region "$REGION" 2>/dev/null || echo "Permission may already exist"

echo "✅ Lambda permissions configured"

# Function to update agent action group Lambda ARN
update_agent_lambda() {
    local agent_id=$1
    local action_group_id=$2
    local action_group_name=$3
    local agent_name=$4
    
    echo "Updating Lambda ARN for $agent_name..."
    
    # Get current function schema
    local function_schema=$(aws bedrock-agent get-agent-action-group \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-version "DRAFT" \
        --action-group-id "$action_group_id" \
        --query 'agentActionGroup.functionSchema' \
        --output json)
    
    # Update the action group with new Lambda ARN
    aws bedrock-agent update-agent-action-group \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-version "DRAFT" \
        --action-group-id "$action_group_id" \
        --action-group-name "$action_group_name" \
        --description "Full action group for $action_group_name with 8 specialized MCP tools" \
        --action-group-executor lambda="$NEW_LAMBDA_ARN" \
        --function-schema "$function_schema" \
        --output json > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Lambda ARN updated for $agent_name"
        
        # Prepare the agent
        echo "Preparing agent..."
        aws bedrock-agent prepare-agent \
            --region $REGION \
            --agent-id "$agent_id" \
            --output json > /dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ Agent prepared successfully"
        else
            echo "❌ Failed to prepare agent"
        fi
    else
        echo "❌ Failed to update Lambda ARN for $agent_name"
    fi
    echo ""
}

# Update all agents
update_agent_lambda "IBQRX8MZJJ" "I9YQ4NNDIC" "business-strategy-tools" "Business Strategy Agent"
update_agent_lambda "CEW45LTT2P" "5HJHKYFAVC" "product-development-tools" "Product Development Agent"
update_agent_lambda "ULX1RJGKCR" "LYFVHLFCMW" "executive-communications-tools" "Executive Communications Agent"
update_agent_lambda "PDZPQTNLYH" "UEPTV7JEJK" "interview-coaching-tools" "Interview Coaching Agent"

echo "🎉 All agents updated with correct Lambda function!"
echo "Lambda: $NEW_LAMBDA_ARN"
echo ""
echo "🧪 Test the agents with:"
echo "  node test-all-agents-comprehensive.js"