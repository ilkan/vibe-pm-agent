#!/bin/bash

# Vibe PM Agent - Simplified Multi-Agent Creation Script
# Creates 4 specialized Bedrock agents with one tool each for testing

set -e

# Configuration
REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-lambda"
ROLE_ARN="arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm"

echo "🚀 Creating Vibe PM Agent Multi-Agent Architecture (Simplified)..."
echo "Region: $REGION"
echo "Lambda ARN: $LAMBDA_ARN"
echo "Role ARN: $ROLE_ARN"
echo ""

# Function to create agent with action group
create_agent() {
    local agent_name=$1
    local agent_description=$2
    local instruction=$3
    local action_group_name=$4
    local tools_json=$5
    
    echo "Creating agent: $agent_name"
    
    # Create the agent
    agent_response=$(aws bedrock-agent create-agent \
        --region $REGION \
        --agent-name "$agent_name" \
        --description "$agent_description" \
        --agent-resource-role-arn "$ROLE_ARN" \
        --foundation-model "anthropic.claude-3-5-haiku-20241022-v1:0" \
        --instruction "$instruction" \
        --idle-session-ttl-in-seconds 1800 \
        --output json)
    
    agent_id=$(echo $agent_response | jq -r '.agent.agentId')
    echo "✅ Agent created with ID: $agent_id"
    
    # Create action group for the agent
    echo "Creating action group: $action_group_name"
    
    action_group_response=$(aws bedrock-agent create-agent-action-group \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-version "DRAFT" \
        --action-group-name "$action_group_name" \
        --description "Action group for $agent_name with specialized MCP tools" \
        --action-group-executor lambda="$LAMBDA_ARN" \
        --function-schema "$tools_json" \
        --output json)
    
    action_group_id=$(echo $action_group_response | jq -r '.agentActionGroup.actionGroupId')
    echo "✅ Action group created with ID: $action_group_id"
    
    # Prepare the agent
    echo "Preparing agent..."
    aws bedrock-agent prepare-agent \
        --region $REGION \
        --agent-id "$agent_id" \
        --output json > /dev/null
    
    echo "✅ Agent $agent_name prepared successfully"
    echo "Agent ID: $agent_id"
    echo "Action Group ID: $action_group_id"
    echo ""
    
    # Store agent info for later use
    echo "$agent_name,$agent_id,$action_group_id" >> bedrock-agentcore/agent-registry.csv
}

# Initialize agent registry
echo "agent_name,agent_id,action_group_id" > bedrock-agentcore/agent-registry.csv

# Agent 1: Business Strategy Agent (simplified with one function)
echo "🎯 Creating Business Strategy Agent..."
create_agent \
    "vibe-pm-business-strategy-agent" \
    "Specialized agent for strategic business analysis, market validation, and competitive intelligence" \
    "You are a strategic business analyst specializing in market opportunity assessment, competitive analysis, and business case development. You help product managers validate ideas, analyze market timing, and create compelling business justifications. Use consulting frameworks like SWOT, Porter's Five Forces, and BCG Matrix. Always provide quantitative metrics, confidence scores, and actionable recommendations." \
    "business-strategy-tools" \
    '{
        "functions": [
            {
                "name": "analyze_business_opportunity",
                "description": "Analyzes market opportunity, timing, and business justification for a feature idea",
                "parameters": {
                    "idea": {
                        "description": "Raw feature idea or business need",
                        "type": "string",
                        "required": true
                    },
                    "market_context": {
                        "description": "Market and business context information",
                        "type": "string",
                        "required": false
                    }
                }
            }
        ]
    }'

# Agent 2: Product Development Agent (simplified with one function)
echo "🛠️ Creating Product Development Agent..."
create_agent \
    "vibe-pm-product-development-agent" \
    "Specialized agent for requirements generation, design options, and resource optimization" \
    "You are a senior product development specialist focused on translating business requirements into technical specifications and optimizing development workflows. You excel at creating comprehensive requirements documents, generating multiple design approaches, and optimizing resource allocation. Always structure outputs with clear technical specifications, implementation timelines, and resource requirements." \
    "product-development-tools" \
    '{
        "functions": [
            {
                "name": "generate_requirements",
                "description": "Generates comprehensive requirements document from feature ideas",
                "parameters": {
                    "feature_idea": {
                        "description": "Feature idea to generate requirements for",
                        "type": "string",
                        "required": true
                    },
                    "context": {
                        "description": "Additional context information",
                        "type": "string",
                        "required": false
                    }
                }
            }
        ]
    }'

# Agent 3: Executive Communications Agent (simplified with one function)
echo "📊 Creating Executive Communications Agent..."
create_agent \
    "vibe-pm-executive-communications-agent" \
    "Specialized agent for stakeholder communication, executive documents, and strategic presentations" \
    "You are an executive communications specialist who creates compelling stakeholder presentations, one-pagers, and strategic documents. You excel at translating complex technical and business analysis into executive-ready communications using frameworks like the Pyramid Principle and Amazon's Working Backwards methodology. Always lead with executive summary, use clear metrics, and provide actionable recommendations." \
    "executive-communications-tools" \
    '{
        "functions": [
            {
                "name": "generate_management_onepager",
                "description": "Creates executive one-pager for management presentation",
                "parameters": {
                    "project_info": {
                        "description": "Project information to include in the one-pager",
                        "type": "string",
                        "required": true
                    },
                    "audience": {
                        "description": "Target audience for the presentation",
                        "type": "string",
                        "required": false
                    }
                }
            }
        ]
    }'

# Agent 4: Interview Coaching Agent (simplified with one function)
echo "🎓 Creating Interview Coaching Agent..."
create_agent \
    "vibe-pm-interview-coaching-agent" \
    "Specialized agent for PM interview preparation, case studies, and personalized coaching" \
    "You are an expert PM interview coach with deep knowledge of product management frameworks, interview best practices, and personalized coaching techniques. You help candidates prepare for PM interviews at top tech companies through structured practice, real-time feedback, and adaptive learning. Use frameworks like STAR method, product sense evaluation, and analytical thinking assessment. Always provide constructive feedback with specific improvement recommendations." \
    "interview-coaching-tools" \
    '{
        "functions": [
            {
                "name": "generate_interview_question",
                "description": "Generates realistic PM interview questions based on role level, company, and question type",
                "parameters": {
                    "role_level": {
                        "description": "Target PM role level (APM, PM, Senior PM, Principal PM)",
                        "type": "string",
                        "required": true
                    },
                    "question_category": {
                        "description": "Type of question to generate (behavioral, product_sense, analytical, technical, leadership)",
                        "type": "string",
                        "required": true
                    },
                    "difficulty_level": {
                        "description": "Question difficulty from 1 (easy) to 5 (hard)",
                        "type": "integer",
                        "required": false
                    }
                }
            }
        ]
    }'

echo ""
echo "🎉 Multi-Agent Architecture Created Successfully!"
echo "===================================="
echo ""
echo "📋 Deployment Summary:"
echo "- Region: $REGION"
echo "- Lambda ARN: $LAMBDA_ARN"
echo "- Role ARN: $ROLE_ARN"
echo "- Agents Created: 4"
echo "- Tools per Agent: 1 (simplified for testing)"
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
echo ""
echo "🔧 Next Steps:"
echo "1. Test agents: ./bedrock-agentcore/test-agents.sh"
echo "2. Add more tools to each agent"
echo "3. Test orchestration workflows"
echo ""
echo "✅ Deployment Complete!"