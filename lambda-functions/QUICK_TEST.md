# Quick Lambda Testing Reference

## 🚀 Fastest Way to Test

```bash
cd lambda-functions
npm run test:lambda
```

## 📋 Quick Commands

### Using npm scripts:
```bash
npm run test:lambda          # Run all tests (Node.js)
npm run test:lambda:health   # Quick health check
npm run test:lambda:all      # Run all tests (Bash)
```

### Using scripts directly:
```bash
./test-lambda.sh all         # All tests (Bash)
./test-lambda.sh health      # Health check only
node test-lambda.js          # All tests (Node.js)
node test-lambda.js interview # Interview prep test
```

### Using AWS CLI:
```bash
# Set your function name
export LAMBDA_FUNCTION_NAME="dev-vibe-pm-agent-lambda"

# Quick health check
aws lambda invoke \
  --function-name $LAMBDA_FUNCTION_NAME \
  --payload '{"path":"/health","httpMethod":"GET"}' \
  response.json && cat response.json | jq '.'
```

## 🎯 Test Individual Tools

### Business Analysis
```bash
./test-lambda.sh opportunity  # Analyze business opportunity
./test-lambda.sh validate     # Quick idea validation
```

### Interview Prep
```bash
./test-lambda.sh interview    # Start interview prep
./test-lambda.sh question     # Generate question
```

### Case Studies
```bash
./test-lambda.sh case         # Start case study
```

## 📊 View Logs

```bash
# Real-time logs
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --follow

# Last hour
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --since 1h

# Errors only
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --filter-pattern "ERROR"
```

## 🔧 Environment Setup

```bash
# Required environment variables
export LAMBDA_FUNCTION_NAME="dev-vibe-pm-agent-lambda"
export AWS_REGION="us-east-1"

# Optional: API Gateway URL
export API_GATEWAY_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"
```

## ✅ Expected Results

All tests should return:
- ✅ `statusCode: 200`
- ✅ `success: true` in response body
- ✅ Execution time < 10 seconds

## 🐛 Troubleshooting

**Function not found?**
```bash
aws lambda list-functions | grep vibe-pm-agent
```

**Permission denied?**
```bash
aws sts get-caller-identity
```

**Timeout?**
- Check CloudWatch logs
- Increase Lambda timeout
- Verify tool implementation

## 📚 Full Documentation

See `TEST_GUIDE.md` for complete testing documentation.
