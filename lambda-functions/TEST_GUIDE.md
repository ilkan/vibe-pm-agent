# Lambda Testing Guide

Complete guide for testing your deployed Vibe PM Agent Lambda functions.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js installed (for Node.js test script)
- `jq` installed (for bash script pretty printing)
- Lambda function deployed to AWS

## Quick Start

### 1. Set Environment Variables

```bash
export LAMBDA_FUNCTION_NAME="dev-vibe-pm-agent-lambda"
export AWS_REGION="us-east-1"
```

### 2. Run Tests

**Option A: Bash Script (Recommended for quick tests)**
```bash
cd lambda-functions
chmod +x test-lambda.sh
./test-lambda.sh all
```

**Option B: Node.js Script (Recommended for detailed output)**
```bash
cd lambda-functions
npm install @aws-sdk/client-lambda  # If not already installed
node test-lambda.js
```

## Testing Methods

### Method 1: AWS CLI Direct Invocation

Test individual tools directly:

```bash
# Health Check
aws lambda invoke \
  --function-name dev-vibe-pm-agent-lambda \
  --payload '{"path":"/health","httpMethod":"GET","body":null}' \
  --region us-east-1 \
  response.json && cat response.json | jq '.'

# Analyze Business Opportunity
aws lambda invoke \
  --function-name dev-vibe-pm-agent-lambda \
  --payload '{
    "path": "/business-analysis/analyze-opportunity",
    "httpMethod": "POST",
    "body": "{\"toolName\":\"analyze_business_opportunity\",\"toolArgs\":{\"idea\":\"AI code review tool\"}}"
  }' \
  --region us-east-1 \
  response.json && cat response.json | jq '.'
```

### Method 2: Using Test Scripts

**Run all tests:**
```bash
./test-lambda.sh all
# or
node test-lambda.js
```

**Run specific test:**
```bash
# Bash
./test-lambda.sh health
./test-lambda.sh opportunity
./test-lambda.sh interview

# Node.js
node test-lambda.js health
node test-lambda.js interview
```

### Method 3: AWS Console

1. Go to AWS Lambda Console
2. Select your function: `dev-vibe-pm-agent-lambda`
3. Click "Test" tab
4. Create test events using the payloads below

### Method 4: API Gateway (if deployed)

```bash
export API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"

# Health Check
curl -X GET "$API_URL/health"

# Analyze Opportunity
curl -X POST "$API_URL/business-analysis/analyze-opportunity" \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "analyze_business_opportunity",
    "toolArgs": {
      "idea": "AI-powered code review assistant"
    }
  }'
```

## Test Payloads

### Business Analysis Tools

#### 1. Analyze Business Opportunity
```json
{
  "path": "/business-analysis/analyze-opportunity",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"analyze_business_opportunity\",\"toolArgs\":{\"idea\":\"AI-powered code review assistant\",\"market_context\":{\"industry\":\"Developer Tools\",\"competition\":\"GitHub Copilot\",\"budget_range\":\"medium\"}}}"
}
```

#### 2. Generate Business Case
```json
{
  "path": "/business-analysis/generate-case",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"generate_business_case\",\"toolArgs\":{\"opportunity_analysis\":\"Strong market demand\",\"financial_inputs\":{\"development_cost\":500000,\"expected_revenue\":2000000}}}"
}
```

#### 3. Quick Validation
```json
{
  "path": "/business-analysis/validate-idea",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"validate_idea_quick\",\"toolArgs\":{\"idea\":\"Mobile restaurant reservation app\",\"criteria\":[\"market_demand\",\"technical_feasibility\"]}}"
}
```

### Interview Preparation Tools

#### 4. Start Interview Preparation
```json
{
  "path": "/interview-prep/start-session",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"start_interview_preparation\",\"toolArgs\":{\"role_level\":\"Senior PM\",\"target_company\":\"Google\",\"preparation_timeline\":\"2 weeks\"}}"
}
```

#### 5. Generate Interview Question
```json
{
  "path": "/interview-prep/generate-question",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"generate_interview_question\",\"toolArgs\":{\"role_level\":\"PM\",\"question_category\":\"product_sense\",\"difficulty_level\":3}}"
}
```

#### 6. Evaluate Interview Response
```json
{
  "path": "/interview-prep/evaluate-response",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"evaluate_interview_response\",\"toolArgs\":{\"question_id\":\"q123\",\"user_response\":\"I would start by understanding the user needs...\"}}"
}
```

### Case Study Tools

#### 7. Start Case Study
```json
{
  "path": "/case-studies/start-case",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"start_case_study\",\"toolArgs\":{\"case_type\":\"product_design\",\"role_level\":\"Senior PM\",\"difficulty_level\":4}}"
}
```

#### 8. Get Case Guidance
```json
{
  "path": "/case-studies/get-guidance",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"get_case_guidance\",\"toolArgs\":{\"session_id\":\"case123\",\"current_step\":\"market analysis\",\"request_type\":\"hint\"}}"
}
```

### Communications Tools

#### 9. Generate PR-FAQ
```json
{
  "path": "/communications/pr-faq",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"generate_pr_faq\",\"toolArgs\":{\"product_info\":\"AI code review assistant\",\"target_audience\":\"Development teams\"}}"
}
```

#### 10. Generate Executive One-Pager
```json
{
  "path": "/communications/executive-onepager",
  "httpMethod": "POST",
  "body": "{\"toolName\":\"generate_management_onepager\",\"toolArgs\":{\"project_info\":\"AI code review tool launch\"}}"
}
```

## Monitoring & Debugging

### View Lambda Logs
```bash
# Tail logs in real-time
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --follow

# View recent logs
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --since 1h

# Filter for errors
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --filter-pattern "ERROR"
```

### Check Lambda Metrics
```bash
# Get invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=dev-vibe-pm-agent-lambda \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Get error count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=dev-vibe-pm-agent-lambda \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Test Lambda Locally (Before Deployment)

```bash
# Using SAM CLI
sam local invoke VibePMAgentLambda \
  --event test-events/health-check.json

# Using Lambda Runtime Interface Emulator
docker run -p 9000:8080 \
  -v $(pwd)/lambda-functions:/var/task \
  public.ecr.aws/lambda/nodejs:20 \
  lambda-functions/dist/index.handler
```

## Common Issues & Solutions

### Issue 1: Function Not Found
```bash
# List all Lambda functions
aws lambda list-functions --region us-east-1 | grep vibe-pm-agent

# Check if function exists
aws lambda get-function --function-name dev-vibe-pm-agent-lambda
```

### Issue 2: Permission Denied
```bash
# Check your AWS credentials
aws sts get-caller-identity

# Verify IAM permissions
aws iam get-user
```

### Issue 3: Timeout Errors
- Increase Lambda timeout in CloudFormation template
- Check CloudWatch logs for slow operations
- Optimize tool handlers

### Issue 4: Invalid Response Format
- Check Lambda logs for errors
- Verify request payload format
- Ensure toolName matches registry

## Performance Benchmarks

Expected execution times:
- Health Check: < 100ms
- Business Analysis: 2-5 seconds
- Interview Prep: 1-3 seconds
- Case Studies: 2-4 seconds
- Communications: 3-6 seconds

## Next Steps

1. **Load Testing**: Use tools like `artillery` or `k6` for load testing
2. **Integration Testing**: Test with Bedrock Agent integration
3. **Monitoring**: Set up CloudWatch dashboards and alarms
4. **CI/CD**: Integrate tests into deployment pipeline

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review Lambda configuration
3. Verify IAM permissions
4. Test with simplified payloads
