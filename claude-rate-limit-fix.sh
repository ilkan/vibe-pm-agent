#!/bin/bash

echo "=== Claude 3.5 Sonnet v2 Rate Limit Analysis ==="
echo "Current Limits:"
echo "  • On-demand: 1 request/minute (NOT adjustable)"
echo "  • Cross-region: 2 requests/minute (NOT adjustable)"
echo "  • Tokens: 400K/minute on-demand, 800K/minute cross-region"
echo

echo "🚨 CRITICAL: You're hitting the 1 request/minute limit!"
echo

echo "💡 Immediate Solutions:"
echo "1. Switch to Claude 3.5 Haiku (10 requests/minute):"
echo "   Model ID: anthropic.claude-3-5-haiku-20241022-v1:0"
echo

echo "2. Enable cross-region inference (doubles your limit to 2/min):"
echo "   Add --inference-config '{\"crossRegionInferenceEnabled\": true}' to your calls"
echo

echo "3. Implement rate limiting in your code:"
echo "   - Wait 60+ seconds between requests"
echo "   - Use exponential backoff on 429 errors"
echo

echo "4. Contact AWS Support for enterprise limits discussion"
echo

echo "🔍 Check current usage:"
echo "aws logs filter-log-events --log-group-name /aws/bedrock/modelinvocations --start-time \$(date -d '1 hour ago' +%s)000"