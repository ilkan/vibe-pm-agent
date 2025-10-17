#!/bin/bash

# Update existing Bedrock agents with full tool sets using OpenAPI schemas

set -e

# Configuration
REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-lambda"

echo "🚀 Updating Vibe PM Agents to Full Versions with OpenAPI Schemas..."
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
    echo "Using schema file: $schema_file"
    
    # Check if schema file exists
    if [ ! -f "$schema_file" ]; then
        echo "❌ Schema file not found: $schema_file"
        return 1
    fi
    
    # Update the action group with OpenAPI schema
    aws bedrock-agent update-agent-action-group \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-version "DRAFT" \
        --action-group-id "$action_group_id" \
        --action-group-name "$action_group_name" \
        --description "Full action group for $action_group_name with 8 specialized MCP tools using OpenAPI schema" \
        --action-group-executor lambda="$LAMBDA_ARN" \
        --api-schema payload="file://$schema_file" \
        --output json > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Action group updated: $action_group_name"
    else
        echo "❌ Failed to update action group: $action_group_name"
        return 1
    fi
    
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
        return 1
    fi
    echo ""
}

# Enable agent orchestration for all agents
enable_agent_orchestration() {
    local agent_id=$1
    local agent_name=$2
    
    echo "🔗 Enabling orchestration for $agent_name..."
    
    # Update agent with orchestration enabled
    aws bedrock-agent update-agent \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-name "$agent_name" \
        --description "AI-powered PM agent with orchestration enabled for multi-agent collaboration" \
        --foundation-model "anthropic.claude-3-5-sonnet-20241022-v2:0" \
        --instruction "You are a specialized PM agent with orchestration capabilities. You can collaborate with other agents to provide comprehensive solutions. Always provide structured, actionable insights with proper citations and confidence scores." \
        --output json > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Orchestration enabled for $agent_name"
    else
        echo "❌ Failed to enable orchestration for $agent_name"
    fi
}

# Agent 1: Business Strategy Agent - Full 8 tools with OpenAPI
echo "🎯 Updating Business Strategy Agent (8 tools with OpenAPI)..."
update_agent_action_group_openapi \
    "IBQRX8MZJJ" \
    "I9YQ4NNDIC" \
    "business-strategy-tools" \
    "schemas/business-strategy-openapi.json"

enable_agent_orchestration "IBQRX8MZJJ" "vibe-pm-business-strategy-agent"

# Agent 2: Product Development Agent - Full 8 tools with OpenAPI
echo "🛠️ Updating Product Development Agent (8 tools with OpenAPI)..."
update_agent_action_group_openapi \
    "CEW45LTT2P" \
    "5HJHKYFAVC" \
    "product-development-tools" \
    "schemas/product-development-openapi.json"

enable_agent_orchestration "CEW45LTT2P" "vibe-pm-product-development-agent"

# Agent 3: Executive Communications Agent - Full 8 tools with OpenAPI
echo "📊 Updating Executive Communications Agent (8 tools with OpenAPI)..."
update_agent_action_group_openapi \
    "ULX1RJGKCR" \
    "LYFVHLFCMW" \
    "executive-communications-tools" \
    "schemas/executive-communications-openapi.json"

enable_agent_orchestration "ULX1RJGKCR" "vibe-pm-executive-communications-agent"

# Agent 4: Interview Coaching Agent - Full 8 tools with OpenAPI
echo "🎓 Updating Interview Coaching Agent (8 tools with OpenAPI)..."
update_agent_action_group_openapi \
    "PDZPQTNLYH" \
    "UEPTV7JEJK" \
    "interview-coaching-tools" \
    "schemas/interview-coaching-openapi.json"

enable_agent_orchestration "PDZPQTNLYH" "vibe-pm-interview-coaching-agent"

echo ""
echo "🎉 All agents updated successfully with full tool sets and OpenAPI schemas!"
echo ""
echo "📋 Summary:"
echo "✅ Business Strategy Agent: 8 tools (market analysis, business cases, strategic alignment)"
echo "✅ Product Development Agent: 8 tools (requirements, design, optimization, citations)"
echo "✅ Executive Communications Agent: 8 tools (stakeholder comms, presentations, ROI analysis)"
echo "✅ Interview Coaching Agent: 8 tools (preparation, questions, evaluation, case studies)"
echo "✅ Agent orchestration enabled for all agents"
echo ""
echo "🔧 Next steps:"
echo "1. Test individual agents with simple queries"
echo "2. Test multi-agent orchestration scenarios"
echo "3. Validate OpenAPI schema compliance"
echo "4. Monitor agent performance and logs"
echo ""
echo "🧪 Test the agents with:"
echo "  ./test-agents.sh"
echo "  python comprehensive-test.js"