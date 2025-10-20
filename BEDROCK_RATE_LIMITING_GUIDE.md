# Bedrock Rate Limiting Solutions

## What's Happening
Your Bedrock Agent is hitting **Tokens Per Minute (TPM)** quotas because:
- Claude 3.5 Sonnet v2 has a **5x burndown rate** (1 output token = 5 quota tokens)
- Multiple concurrent requests exhaust quotas quickly
- The `max_tokens` parameter is deducted upfront

## Immediate Fixes Applied

### 1. ✅ Exponential Backoff with Jitter
- Automatic retry with increasing delays (1s → 2s → 4s)
- Random jitter prevents thundering herd
- Max 3 retries before fallback

### 2. ✅ Request Queuing
- Max 2 concurrent requests
- 2-second minimum interval between requests
- Prevents API overwhelming

### 3. ✅ Graceful Degradation
- Falls back to mock responses when rate limited
- User sees helpful error messages
- Service remains available

## Monitor Your Usage

Check queue status:
```bash
curl http://localhost:3001/api/queue-status
```

Check health:
```bash
curl http://localhost:3001/health
```

## Long-term Optimizations

### 1. Request a Quota Increase
```bash
# View current quotas
aws service-quotas get-service-quota \
  --service-code bedrock \
  --quota-code L-12345678

# Request increase
aws service-quotas request-service-quota-increase \
  --service-code bedrock \
  --quota-code L-12345678 \
  --desired-value 10000
```

### 2. Optimize Token Usage
- Reduce `max_tokens` in agent configuration
- Use shorter prompts when possible
- Implement prompt caching for repeated content

### 3. Use Provisioned Throughput
For high-volume production:
```bash
aws bedrock create-provisioned-model-throughput \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --provisioned-model-name my-claude-throughput \
  --model-units 1
```

### 4. Implement Circuit Breaker
Add circuit breaker pattern to fail fast during outages:
```javascript
// In your service layer
if (circuitBreaker.isOpen()) {
  return mockResponse();
}
```

## Testing the Fix

1. **Start the proxy server:**
   ```bash
   node bedrock-proxy-server.js
   ```

2. **Test with multiple requests:**
   ```bash
   # Send several requests quickly
   for i in {1..5}; do
     curl -X POST http://localhost:3001/api/bedrock-agent \
       -H "Content-Type: application/json" \
       -d '{"text": "Test message '$i'"}' &
   done
   ```

3. **Check queue status:**
   ```bash
   curl http://localhost:3001/api/queue-status
   ```

## Expected Behavior

- ✅ Requests are queued and processed sequentially
- ✅ Rate limited requests retry automatically
- ✅ After max retries, graceful fallback to mock responses
- ✅ Users see helpful error messages
- ✅ Service remains available during rate limiting

## Monitoring Commands

```bash
# Watch queue status
watch -n 1 'curl -s http://localhost:3001/api/queue-status | jq'

# Monitor logs
tail -f bedrock-proxy.log

# Check AWS CloudWatch metrics
aws logs tail /aws/lambda/bedrock-agent --follow
```

The rate limiting issue should now be resolved with graceful degradation!