# Testing Your Lambda Deployment 🚀

Your MCP server has been deployed to AWS Lambda! Here's how to test it.

## 🎯 Quick Start (30 seconds)

```bash
cd lambda-functions

# 1. Check if Lambda is deployed
./check-deployment.sh

# 2. Run all tests
npm run test:lambda
```

That's it! You'll see results for all 32 PM tools.

## 📁 Testing Files Created

- **`check-deployment.sh`** - Verify Lambda is deployed and healthy
- **`test-lambda.sh`** - Bash script for testing (uses AWS CLI)
- **`test-lambda.js`** - Node.js script for testing (detailed output)
- **`TEST_GUIDE.md`** - Complete testing documentation
- **`QUICK_TEST.md`** - Quick reference card

## 🔧 Setup (One-time)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
```bash
export LAMBDA_FUNCTION_NAME="dev-vibe-pm-agent-lambda"
export AWS_REGION="us-east-1"
```

### 3. Verify AWS Credentials
```bash
aws sts get-caller-identity
```

## 🧪 Testing Options

### Option 1: Quick Health Check (Fastest)
```bash
./check-deployment.sh
```
**Use when:** You want to verify Lambda is working

### Option 2: Node.js Test Suite (Recommended)
```bash
npm run test:lambda
```
**Use when:** You want detailed test results with timing

### Option 3: Bash Test Suite
```bash
./test-lambda.sh all
```
**Use when:** You prefer bash or need quick CLI testing

### Option 4: Individual Tests
```bash
# Test specific functionality
./test-lambda.sh health
./test-lambda.sh opportunity
./test-lambda.sh interview
./test-lambda.sh case

# Or with Node.js
node test-lambda.js health
node test-lambda.js interview
```
**Use when:** You're debugging a specific tool

### Option 5: AWS CLI Direct
```bash
aws lambda invoke \
  --function-name dev-vibe-pm-agent-lambda \
  --payload '{"path":"/health","httpMethod":"GET"}' \
  response.json && cat response.json | jq '.'
```
**Use when:** You need maximum control

## 📊 What Gets Tested

The test suite covers all 32 tools across 6 categories:

### Business Analysis (8 tools)
- ✅ analyze_business_opportunity
- ✅ generate_business_case
- ✅ assess_strategic_alignment
- ✅ optimize_resource_allocation
- ✅ validate_market_timing
- ✅ validate_idea_quick
- ✅ analyze_competitor_landscape
- ✅ calculate_market_sizing

### Communications (4 tools)
- ✅ create_stakeholder_communication
- ✅ generate_management_onepager
- ✅ generate_pr_faq
- ✅ get_consulting_summary

### Requirements (4 tools)
- ✅ generate_requirements
- ✅ generate_design_options
- ✅ generate_task_plan
- ✅ optimize_intent

### Market Intelligence (4 tools)
- ✅ enhance_citations
- ✅ validate_and_audit_citations
- ✅ monitor_market_conditions
- ✅ analyze_workflow

### Interview Prep (6 tools)
- ✅ start_interview_preparation
- ✅ generate_interview_question
- ✅ evaluate_interview_response
- ✅ get_interview_feedback
- ✅ get_company_interview_insights
- ✅ customize_preparation_for_company

### Case Studies (5 tools)
- ✅ start_case_study
- ✅ get_case_guidance
- ✅ evaluate_case_approach
- ✅ complete_case_study
- ✅ get_company_case_scenarios

## 📈 Monitoring

### View Real-time Logs
```bash
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --follow
```

### View Recent Logs
```bash
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --since 1h
```

### Filter for Errors
```bash
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --filter-pattern "ERROR"
```

### Check Metrics
```bash
# Invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=dev-vibe-pm-agent-lambda \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## ✅ Expected Results

Successful tests should show:
- **Status Code:** 200
- **Success:** true
- **Execution Time:** < 10 seconds
- **Response:** Tool-specific data

Example successful response:
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "result": {
      "analysis": "...",
      "recommendations": "..."
    },
    "metadata": {
      "toolName": "analyze_business_opportunity",
      "executionTime": 2341,
      "requestId": "abc-123"
    }
  }
}
```

## 🐛 Troubleshooting

### Lambda Not Found
```bash
# List all functions
aws lambda list-functions --region us-east-1 | grep vibe

# Check specific function
aws lambda get-function --function-name dev-vibe-pm-agent-lambda
```

### Permission Errors
```bash
# Verify credentials
aws sts get-caller-identity

# Check IAM permissions
aws iam get-user
```

### Timeout Errors
- Check CloudWatch logs for slow operations
- Increase Lambda timeout in CloudFormation
- Optimize tool implementations

### Invalid Response
- Verify request payload format
- Check toolName matches registry
- Review Lambda logs for errors

## 🎓 Next Steps

1. **Integration Testing**
   - Test with Bedrock Agent
   - Test API Gateway endpoints
   - Load testing with artillery/k6

2. **Monitoring Setup**
   - CloudWatch dashboards
   - Alarms for errors/timeouts
   - X-Ray tracing

3. **CI/CD Integration**
   - Add tests to deployment pipeline
   - Automated smoke tests
   - Performance regression tests

## 📚 Additional Resources

- **TEST_GUIDE.md** - Comprehensive testing guide
- **QUICK_TEST.md** - Quick reference card
- **AWS Lambda Docs** - https://docs.aws.amazon.com/lambda/
- **CloudWatch Logs** - https://console.aws.amazon.com/cloudwatch/

## 💡 Pro Tips

1. **Use npm scripts** for convenience:
   ```bash
   npm run test:lambda        # Full test suite
   npm run test:lambda:health # Quick check
   ```

2. **Set up aliases** in your shell:
   ```bash
   alias lambda-test='cd lambda-functions && npm run test:lambda'
   alias lambda-logs='aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --follow'
   ```

3. **Create test events** in AWS Console for quick manual testing

4. **Monitor costs** - Lambda has generous free tier but watch invocations

## 🤝 Support

Having issues? Check:
1. CloudWatch logs for errors
2. Lambda configuration (timeout, memory)
3. IAM permissions
4. Request payload format

Happy testing! 🎉
