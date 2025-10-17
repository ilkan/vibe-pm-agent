#!/bin/bash

# Vibe PM Agent - Multi-Agent Testing Script
# Tests all 4 specialized Bedrock agents with sample requests

set -e

# Configuration
REGION="us-east-1"
AGENT_REGISTRY="bedrock-agentcore/agent-registry.csv"

echo "🧪 Testing Vibe PM Agent Multi-Agent Architecture..."
echo "Region: $REGION"
echo ""

# Check if agent registry exists
if [ ! -f "$AGENT_REGISTRY" ]; then
    echo "❌ Agent registry not found: $AGENT_REGISTRY"
    echo "Please run create-agents.sh first"
    exit 1
fi

# Function to test agent
test_agent() {
    local agent_name=$1
    local agent_id=$2
    local test_input=$3
    local test_description=$4
    
    echo "🔍 Testing: $agent_name"
    echo "Description: $test_description"
    echo "Agent ID: $agent_id"
    
    # Create test session
    session_response=$(aws bedrock-agent-runtime invoke-agent \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-alias-id "TSTALIASID" \
        --session-id "test-session-$(date +%s)" \
        --input-text "$test_input" \
        --output json 2>/dev/null || echo '{"error": "Failed to invoke agent"}')
    
    if echo "$session_response" | grep -q '"error"'; then
        echo "❌ Test failed for $agent_name"
        echo "Error: $(echo $session_response | jq -r '.error // "Unknown error"')"
    else
        echo "✅ Test successful for $agent_name"
        # Extract and display response (if available)
        if echo "$session_response" | jq -e '.completion' > /dev/null 2>&1; then
            echo "Response preview: $(echo $session_response | jq -r '.completion' | head -c 100)..."
        fi
    fi
    echo ""
}

# Read agent registry and test each agent
echo "📖 Reading agent registry..."
tail -n +2 "$AGENT_REGISTRY" | while IFS=',' read -r agent_name agent_id action_group_id; do
    case "$agent_name" in
        "vibe-pm-business-strategy-agent")
            test_agent "$agent_name" "$agent_id" \
                "Analyze the business opportunity for a new AI-powered project management tool targeting remote teams. The market context includes high competition from Asana and Monday.com, a 6-month timeline, and a medium budget range." \
                "Business opportunity analysis with market context"
            ;;
        "vibe-pm-product-development-agent")
            test_agent "$agent_name" "$agent_id" \
                "Generate comprehensive requirements for a mobile app feature that allows users to create and share custom workout routines with social elements and progress tracking." \
                "Requirements generation for mobile app feature"
            ;;
        "vibe-pm-executive-communications-agent")
            test_agent "$agent_name" "$agent_id" \
                "Create an executive one-pager for a new customer analytics platform that will increase user retention by 25% and reduce churn by 15%. The project requires 6 months and $2M investment." \
                "Executive one-pager creation"
            ;;
        "vibe-pm-interview-coaching-agent")
            test_agent "$agent_name" "$agent_id" \
                "Start an interview preparation session for a Senior PM role at Google. I have 5 years of PM experience and want to focus on product sense and analytical questions." \
                "PM interview preparation session"
            ;;
        *)
            echo "⚠️  Unknown agent: $agent_name"
            ;;
    esac
done

echo "🎯 Agent Testing Summary:"
echo "- Business Strategy Agent: Market opportunity analysis"
echo "- Product Development Agent: Requirements generation"
echo "- Executive Communications Agent: Executive document creation"
echo "- Interview Coaching Agent: PM interview preparation"
echo ""
echo "📊 Next Steps:"
echo "1. Review test results above"
echo "2. Check CloudWatch logs for detailed execution traces"
echo "3. Test cross-agent collaboration scenarios"
echo "4. Monitor agent performance metrics"
echo ""
echo "🔧 Troubleshooting:"
echo "- Ensure agents are in PREPARED state"
echo "- Verify Lambda function permissions"
echo "- Check Bedrock execution role policies"
echo "- Validate action group configurations"