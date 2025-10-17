#!/bin/bash

# Update existing Bedrock agents with full tool sets using OpenAPI schemas

set -e

# Configuration
REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-lambda"

echo "🚀 Updating Vibe PM Agents with OpenAPI Schemas (8 tools each)..."
echo "Region: $REGION"
echo "Lambda ARN: $LAMBDA_ARN"
echo ""

# Function to update agent action group with OpenAPI schema
update_agent_action_group_openapi() {
    local agent_id=$1
    local action_group_id=$2
    local action_group_name=$3
    local schema_file=$4
    
    echo "Updating action group: $action_group_name for agent: $agent_id"
    echo "Using schema: $schema_file"
    
    # Update the action group with OpenAPI schema
    aws bedrock-agent update-agent-action-group \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-version "DRAFT" \
        --action-group-id "$action_group_id" \
        --action-group-name "$action_group_name" \
        --description "Full action group for $action_group_name with 8 specialized MCP tools via OpenAPI" \
        --action-group-executor lambda="$LAMBDA_ARN" \
        --api-schema payload="file://$schema_file" \
        --output json > /dev/null
    
    echo "✅ Action group updated: $action_group_name"
    
    # Prepare the agent
    echo "Preparing agent..."
    aws bedrock-agent prepare-agent \
        --region $REGION \
        --agent-id "$agent_id" \
        --output json > /dev/null
    
    echo "✅ Agent prepared successfully"
    echo ""
}

# Agent 1: Business Strategy Agent - Full 8 tools via OpenAPI
echo "🎯 Updating Business Strategy Agent (8 tools via OpenAPI)..."
update_agent_action_group_openapi \
    "IBQRX8MZJJ" \
    "I9YQ4NNDIC" \
    "business-strategy-tools" \
    "bedrock-agentcore/schemas/business-strategy-openapi.json"

# Agent 2: Product Development Agent - Full 8 tools via OpenAPI
echo "🛠️ Updating Product Development Agent (8 tools via OpenAPI)..."
update_agent_action_group_openapi \
    "CEW45LTT2P" \
    "5HJHKYFAVC" \
    "product-development-tools" \
    "bedrock-agentcore/schemas/product-development-openapi.json"

echo ""
echo "🎉 Agents Updated with OpenAPI Schemas!"
echo "===================================="
echo ""
echo "📋 Update Summary:"
echo "- Business Strategy Agent: 8 tools via OpenAPI schema"
echo "- Product Development Agent: 8 tools via OpenAPI schema"
echo "- No parameter limits with OpenAPI approach"
echo "- Lambda router handles all tool routing"
echo ""
echo "📊 Tools Updated: 16 (8 per agent so far)"
echo "🤖 Agents prepared and ready for testing"
echo ""
echo "🔧 Next Steps:"
echo "1. Create remaining OpenAPI schemas for other agents"
echo "2. Update Executive Communications and Interview Coaching agents"
echo "3. Test all agents with full tool sets"
echo ""
echo "✅ OpenAPI Schema Update Complete!"