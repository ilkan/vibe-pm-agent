#!/bin/bash

# Request model access via AWS CLI
set -e

REGION="us-east-1"

echo "🔑 Requesting model access via AWS CLI..."

# Models to request access for
models=(
    "amazon.nova-pro-v1:0"
    "amazon.nova-lite-v1:0"
    "anthropic.claude-3-haiku-20240307-v1:0"
    "anthropic.claude-3-5-sonnet-20241022-v2:0"
)

use_case="Product Management AI Assistant for business analysis, document generation, and interview preparation using Bedrock Agents with tool calling capabilities."

for model in "${models[@]}"; do
    echo "📝 Requesting access for $model..."
    
    # Try to request access using the put-use-case-for-model-access command
    if aws bedrock put-use-case-for-model-access \
        --model-id "$model" \
        --use-case "$use_case" \
        --region "$REGION" \
        --form-data '{}' 2>/dev/null; then
        echo "✅ Request submitted for $model"
    else
        echo "⚠️  Could not submit request for $model (may already have access or need console)"
    fi
done

echo ""
echo "🧪 Testing model access..."

# Test each model
for model in "${models[@]}"; do
    echo -n "Testing $model... "
    
    # Create appropriate test payload
    if [[ $model == *"nova"* ]]; then
        payload='{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":10}}'
    elif [[ $model == *"claude"* ]]; then
        payload='{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
    fi
    
    if aws bedrock-runtime invoke-model \
        --model-id "$model" \
        --body "$payload" \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        --output json > /dev/null 2>&1; then
        echo "✅ ACCESSIBLE"
    else
        echo "❌ Not accessible yet"
    fi
done

echo ""
echo "💡 If models are not accessible yet:"
echo "1. Check AWS Bedrock Console: https://console.aws.amazon.com/bedrock/"
echo "2. Go to 'Model access' in the left sidebar"
echo "3. Review and approve any pending requests"
echo "4. Some models may require additional approval steps"