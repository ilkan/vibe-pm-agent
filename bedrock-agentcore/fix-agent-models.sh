#!/bin/bash

# Fix agent models to use supported foundation model

set -e

# Configuration
REGION="us-east-1"
AGENT_ROLE_ARN="arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm"
SUPPORTED_MODEL="anthropic.claude-3-5-sonnet-20240620-v1:0"

echo "🔧 Fixing agent models to use supported foundation model..."
echo "Model: $SUPPORTED_MODEL"
echo ""

# Function to update agent model
update_agent_model() {
    local agent_id=$1
    local agent_name=$2
    
    echo "Updating model for $agent_name..."
    
    aws bedrock-agent update-agent \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-name "$agent_name" \
        --agent-resource-role-arn "$AGENT_ROLE_ARN" \
        --description "AI-powered PM agent with multi-agent orchestration capabilities for comprehensive business analysis and interview preparation" \
        --foundation-model "$SUPPORTED_MODEL" \
        --instruction "You are a specialized PM agent with orchestration capabilities. You can collaborate with other agents to provide comprehensive solutions. When users request complex analysis that spans multiple domains, coordinate with other agents. Always provide structured, actionable insights with proper citations and confidence scores. Use your specialized tools effectively and suggest when multi-agent collaboration would be beneficial." \
        --output json > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Model updated for $agent_name"
        
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
        echo "❌ Failed to update model for $agent_name"
    fi
    echo ""
}

# Update all agents
update_agent_model "IBQRX8MZJJ" "vibe-pm-business-strategy-agent"
update_agent_model "CEW45LTT2P" "vibe-pm-product-development-agent"
update_agent_model "ULX1RJGKCR" "vibe-pm-executive-communications-agent"
update_agent_model "PDZPQTNLYH" "vibe-pm-interview-coaching-agent"

echo "🎉 All agent models updated to supported foundation model!"
echo "Model: $SUPPORTED_MODEL"
echo ""
echo "🧪 Test the agents with:"
echo "  node test-all-agents-comprehensive.js"