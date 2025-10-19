#!/bin/bash

# Fix Bedrock permissions using AWS managed policies
set -e

echo "🔧 Fixing Bedrock permissions using AWS managed policies..."

# Since you're using root credentials, we need to create a custom policy
# that includes all the necessary permissions from AmazonBedrockFullAccess

echo "📝 Creating comprehensive Bedrock access policy..."

cat > bedrock-full-access-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockAll",
      "Effect": "Allow",
      "Action": [
        "bedrock:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BedrockRuntime",
      "Effect": "Allow",
      "Action": [
        "bedrock-runtime:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BedrockAgent",
      "Effect": "Allow",
      "Action": [
        "bedrock-agent:*",
        "bedrock-agent-runtime:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DescribeKey",
      "Effect": "Allow",
      "Action": [
        "kms:DescribeKey"
      ],
      "Resource": "arn:*:kms:*:*:*"
    },
    {
      "Sid": "APIsWithAllResourceAccess",
      "Effect": "Allow",
      "Action": [
        "iam:ListRoles",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    },
    {
      "Sid": "MarketplaceAccess",
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:Subscribe",
        "aws-marketplace:Unsubscribe",
        "aws-marketplace:ViewSubscriptions"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create the policy
POLICY_NAME="BedrockFullAccessCustom"
POLICY_ARN="arn:aws:iam::119370291155:policy/$POLICY_NAME"

echo "🔨 Creating IAM policy: $POLICY_NAME"

# Delete existing policy if it exists
aws iam delete-policy --policy-arn "$POLICY_ARN" 2>/dev/null || echo "Policy doesn't exist yet"

# Create new policy
aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file://bedrock-full-access-policy.json \
    --description "Full access to Amazon Bedrock services including foundation models"

echo "✅ Policy created successfully!"

echo ""
echo "🧪 Testing Bedrock access..."

# Wait a moment for policy to propagate
sleep 5

# Test foundation model access
echo "Testing Amazon Nova Pro..."
if aws bedrock-runtime invoke-model \
    --model-id "amazon.nova-pro-v1:0" \
    --body '{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":10}}' \
    --region us-east-1 \
    --cli-binary-format raw-in-base64-out \
    /tmp/nova-test.json >/dev/null 2>&1; then
    echo "✅ Amazon Nova Pro is accessible!"
    NOVA_WORKS=true
else
    echo "❌ Amazon Nova Pro not accessible yet"
    NOVA_WORKS=false
fi

echo "Testing Claude 3.5 Sonnet..."
if aws bedrock-runtime invoke-model \
    --model-id "anthropic.claude-3-5-sonnet-20241022-v2:0" \
    --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}' \
    --region us-east-1 \
    --cli-binary-format raw-in-base64-out \
    /tmp/claude-test.json >/dev/null 2>&1; then
    echo "✅ Claude 3.5 Sonnet is accessible!"
    CLAUDE_WORKS=true
else
    echo "❌ Claude 3.5 Sonnet not accessible yet"
    CLAUDE_WORKS=false
fi

echo ""
if [ "$NOVA_WORKS" = true ] || [ "$CLAUDE_WORKS" = true ]; then
    echo "🎉 SUCCESS! Bedrock models are now accessible!"
    
    if [ "$CLAUDE_WORKS" = true ]; then
        echo "🚀 Updating your Bedrock Agent to use Claude 3.5 Sonnet..."
        aws bedrock-agent update-agent \
            --agent-id ULX1RJGKCR \
            --agent-name vibe-pm-executive-communications-agent \
            --foundation-model anthropic.claude-3-5-sonnet-20241022-v2:0 \
            --instruction "You are a specialized PM agent with orchestration capabilities. You can collaborate with other agents to provide comprehensive solutions. When users request complex analysis that spans multiple domains, coordinate with other agents. Always provide structured, actionable insights with proper citations and confidence scores. Use your specialized tools effectively and suggest when multi-agent collaboration would be beneficial." \
            --agent-resource-role-arn arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm \
            --region us-east-1
    elif [ "$NOVA_WORKS" = true ]; then
        echo "🚀 Updating your Bedrock Agent to use Amazon Nova Pro..."
        aws bedrock-agent update-agent \
            --agent-id ULX1RJGKCR \
            --agent-name vibe-pm-executive-communications-agent \
            --foundation-model amazon.nova-pro-v1:0 \
            --instruction "You are a specialized PM agent with orchestration capabilities. You can collaborate with other agents to provide comprehensive solutions. When users request complex analysis that spans multiple domains, coordinate with other agents. Always provide structured, actionable insights with proper citations and confidence scores. Use your specialized tools effectively and suggest when multi-agent collaboration would be beneficial." \
            --agent-resource-role-arn arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm \
            --region us-east-1
    fi
    
    echo "🔄 Preparing agent..."
    aws bedrock-agent prepare-agent --agent-id ULX1RJGKCR --region us-east-1
    
    echo ""
    echo "🎉 COMPLETE! Your Bedrock Agent is ready!"
    echo "💬 Test your chat UI at: http://localhost:5173"
    echo "🔧 Make sure your proxy server is running on port 3001"
    
else
    echo "⚠️  Models may need additional time to become accessible"
    echo "💡 Try running this script again in 2-3 minutes"
    echo "🌐 Or go to AWS Bedrock Console to manually enable model access"
fi

# Cleanup
rm -f bedrock-full-access-policy.json /tmp/nova-test.json /tmp/claude-test.json