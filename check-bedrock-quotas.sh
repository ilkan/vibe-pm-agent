#!/bin/bash

echo "=== Amazon Bedrock Quota Check ==="
echo "Date: $(date)"
echo

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"
echo "Account: $(aws sts get-caller-identity --query Account --output text)"
echo "Region: $(aws configure get region)"
echo

# List Bedrock service quotas
echo "📊 Fetching Bedrock service quotas..."
aws service-quotas list-service-quotas --service-code bedrock --query 'Quotas[?contains(QuotaName, `Claude`) || contains(QuotaName, `Token`) || contains(QuotaName, `Request`)].{Name:QuotaName,Value:Value,Adjustable:Adjustable}' --output table

echo
echo "🔍 To check specific quota usage:"
echo "1. Visit: https://console.aws.amazon.com/servicequotas/home/services/bedrock/quotas"
echo "2. Or use: aws service-quotas get-service-quota --service-code bedrock --quota-code <QUOTA_CODE>"

echo
echo "📈 To monitor token usage:"
echo "aws bedrock-runtime count-tokens --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 --input-text 'test'"