#!/bin/bash

# Check which Bedrock models are accessible
echo "🔍 Checking model access..."

models=(
    "amazon.titan-text-lite-v1"
    "amazon.titan-text-express-v1"
    "amazon.nova-micro-v1:0"
    "amazon.nova-lite-v1:0"
    "amazon.nova-pro-v1:0"
    "anthropic.claude-3-haiku-20240307-v1:0"
    "anthropic.claude-3-5-sonnet-20241022-v2:0"
)

accessible_models=()

for model in "${models[@]}"; do
    echo -n "Testing $model... "
    
    # Create appropriate test payload based on model
    if [[ $model == *"titan"* ]]; then
        payload='{"inputText":"test","textGenerationConfig":{"maxTokenCount":10}}'
    elif [[ $model == *"nova"* ]]; then
        payload='{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":10}}'
    elif [[ $model == *"claude"* ]]; then
        payload='{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
    fi
    
    if aws bedrock-runtime invoke-model \
        --model-id "$model" \
        --body "$payload" \
        --region us-east-1 \
        --cli-binary-format raw-in-base64-out \
        --output json > /dev/null 2>&1; then
        echo "✅ ACCESSIBLE"
        accessible_models+=("$model")
    else
        echo "❌ Not accessible"
    fi
done

echo ""
echo "📋 Accessible models:"
for model in "${accessible_models[@]}"; do
    echo "  ✅ $model"
done

if [ ${#accessible_models[@]} -eq 0 ]; then
    echo "❌ No models are accessible. You need to request model access in the Bedrock console."
else
    echo ""
    echo "🎯 Recommended model for Bedrock Agent with tools:"
    for model in "${accessible_models[@]}"; do
        if [[ $model == *"nova"* ]] || [[ $model == *"claude"* ]]; then
            echo "  🚀 $model (supports tool use)"
            break
        fi
    done
fi