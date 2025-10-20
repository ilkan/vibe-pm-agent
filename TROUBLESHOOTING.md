# Bedrock Proxy Troubleshooting Guide

## Quick Debug Steps

### 1. Check if the server starts correctly
```bash
node bedrock-proxy-server.js
```

Expected output:
```
🚀 Bedrock Agent Proxy Server running on http://localhost:3001
📋 Available endpoints:
   GET  /health - Health check
   POST /api/bedrock-agent - Bedrock Agent proxy
🤖 Ready to proxy requests to Claude 3.5 v2 via Bedrock Agents!
```

### 2. Test the health endpoint
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Bedrock Agent Proxy",
  "queue": {
    "pending": 0,
    "running": 0,
    "maxConcurrent": 2
  },
  "timestamp": "2024-01-XX..."
}
```

### 3. Test with a simple request
```bash
curl -X POST http://localhost:3001/api/bedrock-agent \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello test"}'
```

### 4. Run the debug script
```bash
node debug-proxy.js
```

## Common Issues & Solutions

### Issue: "No response" or empty response

**Possible causes:**
1. Server not running
2. Wrong port (should be 3001)
3. Request format incorrect
4. AWS credentials not configured

**Solutions:**
1. Check server is running: `curl http://localhost:3001/health`
2. Verify request format includes `text` field
3. Check AWS credentials: `aws sts get-caller-identity`

### Issue: Rate limiting errors

**Expected behavior:**
- Server should retry automatically with exponential backoff
- After 3 retries, should return 429 status
- Web app should fall back to mock responses

**Debug:**
```bash
# Check queue status during high load
curl http://localhost:3001/api/queue-status
```

### Issue: AWS authentication errors

**Check credentials:**
```bash
aws sts get-caller-identity
aws bedrock list-foundation-models --region us-east-1
```

**Verify agent exists:**
```bash
aws bedrock-agent get-agent --agent-id IBQRX8MZJJ --region us-east-1
```

## Debug Logs

The server logs important information:

```
🔧 Processing Bedrock request: { hasText: true, textLength: 10, sessionId: 'test-123' }
🤖 Proxying to Bedrock Agent: IBQRX8MZJJ (attempt 1/3)
💬 Input: "Hello test"
🔗 Session: proxy-session-1234567890-abc123
✅ Response: Hello! I'm Claude, an AI assistant...
```

## Testing Scripts

### Manual testing:
```bash
# Start server
node bedrock-proxy-server.js

# In another terminal, test:
node debug-proxy.js
```

### Automated testing:
```bash
# Run full test suite
./start-and-test.sh
```

## Environment Variables

The proxy server uses these environment variables:

- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_SESSION_TOKEN` - AWS session token (if using temporary credentials)

## Web UI Integration

The web UI calls the proxy at:
- URL: `http://localhost:3001/api/bedrock-agent`
- Method: POST
- Headers: `Content-Type: application/json`
- Body: `{"text": "user message", "sessionId": "optional"}`

Check the browser console for web UI debug logs:
```
🤖 Starting conversation with Claude 3.5 v2 via Bedrock Agent
💬 User: "test message"
🚀 Invoking real Bedrock Agent: IBQRX8MZJJ
✅ Real Claude 3.5 v2 response: Hello! I'm Claude...
```

## Next Steps

If the proxy is working but you're still not getting responses:

1. **Check AWS permissions** - Ensure your AWS credentials have Bedrock access
2. **Verify agent configuration** - Make sure the Bedrock Agent is properly deployed
3. **Test with AWS CLI** - Try invoking the agent directly with AWS CLI
4. **Check CloudWatch logs** - Look for errors in AWS CloudWatch

The proxy server should now handle rate limiting gracefully and provide clear error messages!