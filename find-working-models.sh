#!/bin/bash

# Find working Bedrock models that support tools
echo "🔍 Finding accessible Bedrock models that support tools..."

# Get all available models
echo "📋 Getting all available models..."
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[].{ModelId:modelId,Provider:providerName,InputModalities:inputModalities,OutputModalities:outputModalities}' --output json > /tmp/all-models.json

# Test models that might support tools (text input/output)
text_models=$(cat /tmp/all-models.json | jq -r '.[] | select(.InputModalities | contains(["TEXT"])) | select(.OutputModalities | contains(["TEXT"])) | .ModelId')

accessible_models=()
tool_capable_models=()

echo ""
echo "🧪 Testing text-capable models for access..."

for model in $text_models; do
    echo -n "Testing $model... "
    
    # Create appropriate test payload based on model
    if [[ $model == *"titan"* ]]; then
        payload='{"inputText":"test","textGenerationConfig":{"maxTokenCount":10}}'
    elif [[ $model == *"nova"* ]]; then
        payload='{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":10}}'
    elif [[ $model == *"claude"* ]]; then
        payload='{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
    elif [[ $model == *"ai21"* ]]; then
        payload='{"prompt":"test","maxTokens":10}'
    elif [[ $model == *"cohere"* ]]; then
        payload='{"message":"test","max_tokens":10}'
    elif [[ $model == *"meta"* ]]; then
        payload='{"prompt":"test","max_gen_len":10}'
    else
        echo "❓ Unknown format, skipping"
        continue
    fi
    
    # Test model access
    if aws bedrock-runtime invoke-model \
        --model-id "$model" \
        --body "$payload" \
        --region us-east-1 \
        --cli-binary-format raw-in-base64-out \
        /tmp/test-output.json >/dev/null 2>&1; then
        echo "✅ ACCESSIBLE"
        accessible_models+=("$model")
        
        # Check if it's likely to support tools (Nova, Claude, or newer models)
        if [[ $model == *"nova"* ]] || [[ $model == *"claude-3"* ]] || [[ $model == *"claude-sonnet"* ]] || [[ $model == *"claude-haiku"* ]]; then
            tool_capable_models+=("$model")
        fi
    else
        echo "❌ Not accessible"
    fi
done

echo ""
echo "📊 RESULTS:"
echo "============"

if [ ${#accessible_models[@]} -eq 0 ]; then
    echo "❌ No models are accessible. You need to request model access."
    echo ""
    echo "💡 To request access:"
    echo "1. Go to AWS Bedrock Console: https://console.aws.amazon.com/bedrock/"
    echo "2. Navigate to 'Model access' (or follow IAM redirect)"
    echo "3. Request access to Nova and Claude models"
else
    echo "✅ Accessible models (${#accessible_models[@]} total):"
    for model in "${accessible_models[@]}"; do
        echo "  📦 $model"
    done
fi

echo ""
if [ ${#tool_capable_models[@]} -eq 0 ]; then
    echo "❌ No tool-capable models accessible"
    echo "🎯 Need access to: Nova Pro, Nova Lite, Claude 3.x models"
else
    echo "🛠️  Tool-capable models (${#tool_capable_models[@]} total):"
    for model in "${tool_capable_models[@]}"; do
        echo "  🚀 $model (supports Bedrock Agents with tools)"
    done
    
    echo ""
    echo "🎯 RECOMMENDED for your Bedrock Agent:"
    echo "  Model: ${tool_capable_models[0]}"
    echo ""
    echo "📝 To update your agent:"
    echo "  aws bedrock-agent update-agent \\"
    echo "    --agent-id ULX1RJGKCR \\"
    echo "    --agent-name vibe-pm-executive-communications-agent \\"
    echo "    --foundation-model ${tool_capable_models[0]} \\"
    echo "    --agent-resource-role-arn arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm \\"
    echo "    --region us-east-1"
fi

# Cleanup
rm -f /tmp/all-models.json /tmp/test-output.json