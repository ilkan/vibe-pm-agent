#!/bin/bash

# Check Bedrock access and marketplace permissions
set -e

REGION="us-east-1"

echo "🔍 Checking Bedrock access and marketplace permissions..."

# Check if we can access Bedrock service
echo "1. Testing Bedrock service access..."
if aws bedrock list-foundation-models --region "$REGION" --max-items 1 >/dev/null 2>&1; then
    echo "✅ Bedrock service is accessible"
else
    echo "❌ Bedrock service is not accessible"
    exit 1
fi

# Check AWS Marketplace permissions
echo ""
echo "2. Testing AWS Marketplace permissions..."
if aws marketplace-entitlement get-entitlements --product-code test --region "$REGION" >/dev/null 2>&1; then
    echo "✅ AWS Marketplace is accessible"
else
    echo "⚠️  AWS Marketplace access may be limited (this is normal)"
fi

# Check if we can invoke any model (try a simple one first)
echo ""
echo "3. Testing direct model invocation..."

# Try Amazon Titan first (should have fewer restrictions)
echo "   Testing Amazon Titan Text Express..."
if aws bedrock-runtime invoke-model \
    --model-id "amazon.titan-text-express-v1" \
    --body '{"inputText":"test","textGenerationConfig":{"maxTokenCount":10}}' \
    --region "$REGION" \
    --cli-binary-format raw-in-base64-out \
    /tmp/titan-test.json >/dev/null 2>&1; then
    echo "✅ Amazon Titan is accessible"
    TITAN_WORKS=true
else
    echo "❌ Amazon Titan not accessible"
    TITAN_WORKS=false
fi

# Try Claude models
echo "   Testing Claude 3.5 Sonnet..."
if aws bedrock-runtime invoke-model \
    --model-id "anthropic.claude-3-5-sonnet-20241022-v2:0" \
    --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
    --region "$REGION" \
    --cli-binary-format raw-in-base64-out \
    /tmp/claude-test.json >/dev/null 2>&1; then
    echo "✅ Claude 3.5 Sonnet is accessible"
    CLAUDE_WORKS=true
else
    echo "❌ Claude 3.5 Sonnet not accessible"
    CLAUDE_WORKS=false
fi

# Try Nova models
echo "   Testing Amazon Nova Pro..."
if aws bedrock-runtime invoke-model \
    --model-id "amazon.nova-pro-v1:0" \
    --body '{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":10}}' \
    --region "$REGION" \
    --cli-binary-format raw-in-base64-out \
    /tmp/nova-test.json >/dev/null 2>&1; then
    echo "✅ Amazon Nova Pro is accessible"
    NOVA_WORKS=true
else
    echo "❌ Amazon Nova Pro not accessible"
    NOVA_WORKS=false
fi

echo ""
echo "📊 SUMMARY:"
echo "==========="

if [ "$TITAN_WORKS" = true ] || [ "$CLAUDE_WORKS" = true ] || [ "$NOVA_WORKS" = true ]; then
    echo "🎉 SUCCESS! At least one model is accessible."
    
    if [ "$CLAUDE_WORKS" = true ]; then
        echo "🚀 Recommended: Use Claude 3.5 Sonnet for your Bedrock Agent"
        echo ""
        echo "📝 Update your agent:"
        echo "aws bedrock-agent update-agent \\"
        echo "  --agent-id ULX1RJGKCR \\"
        echo "  --foundation-model anthropic.claude-3-5-sonnet-20241022-v2:0 \\"
        echo "  --agent-resource-role-arn arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm \\"
        echo "  --region us-east-1"
    elif [ "$NOVA_WORKS" = true ]; then
        echo "🚀 Recommended: Use Amazon Nova Pro for your Bedrock Agent"
        echo ""
        echo "📝 Update your agent:"
        echo "aws bedrock-agent update-agent \\"
        echo "  --agent-id ULX1RJGKCR \\"
        echo "  --foundation-model amazon.nova-pro-v1:0 \\"
        echo "  --agent-resource-role-arn arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm \\"
        echo "  --region us-east-1"
    elif [ "$TITAN_WORKS" = true ]; then
        echo "⚠️  Only Titan is accessible, but it doesn't support tools"
        echo "🎯 You need Claude or Nova models for Bedrock Agents with tools"
    fi
else
    echo "❌ No models are accessible"
    echo ""
    echo "💡 Possible solutions:"
    echo "1. Go to AWS Bedrock Console: https://console.aws.amazon.com/bedrock/"
    echo "2. Check 'Model access' section"
    echo "3. Enable access to foundation models"
    echo "4. For Anthropic models, you may need to submit use case details"
fi

# Cleanup
rm -f /tmp/titan-test.json /tmp/claude-test.json /tmp/nova-test.json