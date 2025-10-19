#!/bin/bash

# Test Bedrock model access
echo "🧪 Testing Amazon Nova Micro model access..."

aws bedrock-runtime invoke-model \
    --model-id "amazon.nova-micro-v1:0" \
    --body '{"messages":[{"role":"user","content":[{"text":"test"}]}],"inferenceConfig":{"maxTokens":10}}' \
    --region us-east-1 \
    --cli-binary-format raw-in-base64-out \
    /tmp/bedrock-test.json

if [ $? -eq 0 ]; then
    echo "✅ Model accessible!"
    echo "Response:"
    cat /tmp/bedrock-test.json
else
    echo "❌ Model not accessible"
fi