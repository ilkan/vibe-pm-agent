#!/bin/bash

# Submit Anthropic use case details for Bedrock model access
set -e

REGION="us-east-1"

echo "🚀 Submitting Anthropic use case details for Bedrock model access..."

# Create form data for Anthropic use case
cat > /tmp/anthropic-use-case.json << 'EOF'
{
    "companyName": "Vibe PM Solutions",
    "companyWebsite": "https://github.com/your-org/vibe-pm-agent",
    "intendedUsers": "Product managers, business analysts, and development teams",
    "industryOption": "Technology",
    "otherIndustryOption": "",
    "useCases": "AI-powered Product Management assistant for business analysis, document generation (PR-FAQs, one-pagers), interview preparation, and strategic planning. The system uses Bedrock Agents with tool calling capabilities to provide structured insights and recommendations for PM workflows."
}
EOF

# Convert to base64 for the API call
FORM_DATA_B64=$(cat /tmp/anthropic-use-case.json | base64)

echo "📝 Submitting use case details..."

# Submit the use case
if aws bedrock put-use-case-for-model-access \
    --form-data "$FORM_DATA_B64" \
    --region "$REGION"; then
    echo "✅ Use case submitted successfully!"
    echo ""
    echo "🎉 Anthropic models should now be accessible immediately!"
    echo ""
    echo "🧪 Testing model access..."
    
    # Test Claude 3.5 Sonnet access
    if aws bedrock-runtime invoke-model \
        --model-id "anthropic.claude-3-5-sonnet-20241022-v2:0" \
        --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        /tmp/claude-test.json >/dev/null 2>&1; then
        echo "✅ Claude 3.5 Sonnet is now accessible!"
        
        # Update your Bedrock Agent to use Claude
        echo ""
        echo "🔧 Updating your Bedrock Agent to use Claude 3.5 Sonnet..."
        aws bedrock-agent update-agent \
            --agent-id ULX1RJGKCR \
            --agent-name vibe-pm-executive-communications-agent \
            --foundation-model anthropic.claude-3-5-sonnet-20241022-v2:0 \
            --instruction "You are a specialized PM agent with orchestration capabilities. You can collaborate with other agents to provide comprehensive solutions. When users request complex analysis that spans multiple domains, coordinate with other agents. Always provide structured, actionable insights with proper citations and confidence scores. Use your specialized tools effectively and suggest when multi-agent collaboration would be beneficial." \
            --agent-resource-role-arn arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm \
            --region "$REGION"
        
        echo "🔄 Preparing agent..."
        aws bedrock-agent prepare-agent --agent-id ULX1RJGKCR --region "$REGION"
        
        echo ""
        echo "🎉 SUCCESS! Your Bedrock Agent is now ready with Claude 3.5 Sonnet!"
        echo "💬 You can now use your chat UI at http://localhost:5173"
        
    else
        echo "⚠️  Model access may take a few minutes to propagate. Try again in 2-3 minutes."
    fi
    
else
    echo "❌ Failed to submit use case. Error details above."
    echo ""
    echo "💡 Alternative: Go to AWS Bedrock Console and select an Anthropic model to submit use case via UI"
fi

# Cleanup
rm -f /tmp/anthropic-use-case.json /tmp/claude-test.json