# Lambda Troubleshooting Guide

## Error: Runtime.ImportModuleError

**Symptom:** Lambda returns `Runtime.ImportModuleError` when invoked

**Cause:** The Lambda package is missing `node_modules` dependencies

### Quick Fix

Run the quick deployment script:

```bash
cd deployment-scripts
./quick-deploy-lambda.sh
```

This will:
1. Install dependencies
2. Build TypeScript
3. Package with node_modules
4. Deploy to Lambda

### Manual Fix

If the quick script doesn't work, follow these steps:

```bash
# 1. Navigate to lambda-functions
cd lambda-functions

# 2. Install dependencies
npm install --production

# 3. Build TypeScript
npm run build

# 4. Copy dependencies to dist
cd dist
cp ../package.json .
npm install --production --no-optional

# 5. Create deployment package
zip -r ../lambda-deployment.zip .

# 6. Deploy to Lambda
cd ..
aws lambda update-function-code \
  --function-name dev-vibe-pm-agent-lambda \
  --zip-file fileb://lambda-deployment.zip \
  --region us-east-1

# 7. Wait for update
aws lambda wait function-updated \
  --function-name dev-vibe-pm-agent-lambda \
  --region us-east-1

# 8. Test
./check-deployment.sh
```

### Verify Package Contents

Before deploying, verify your package includes node_modules:

```bash
cd lambda-functions/dist
unzip -l ../lambda-deployment.zip | grep node_modules | head -10
```

You should see node_modules files listed.

## Error: Handler Not Found

**Symptom:** Lambda can't find the handler function

**Cause:** Handler path in Lambda configuration doesn't match file structure

### Fix

Check Lambda handler configuration:

```bash
aws lambda get-function-configuration \
  --function-name dev-vibe-pm-agent-lambda \
  --query 'Handler' \
  --output text
```

Should return: `index.handler`

If different, update it:

```bash
aws lambda update-function-configuration \
  --function-name dev-vibe-pm-agent-lambda \
  --handler index.handler \
  --region us-east-1
```

## Error: Module Not Found

**Symptom:** Error like "Cannot find module '@aws-sdk/client-lambda'"

**Cause:** Missing dependencies in package

### Fix

Ensure all dependencies are installed:

```bash
cd lambda-functions
npm install
npm run build

# Verify dependencies in dist
cd dist
npm install --production
```

## Error: Timeout

**Symptom:** Lambda times out after 3 seconds

**Cause:** Default timeout is too short for PM tools

### Fix

Increase Lambda timeout:

```bash
aws lambda update-function-configuration \
  --function-name dev-vibe-pm-agent-lambda \
  --timeout 300 \
  --region us-east-1
```

## Error: Out of Memory

**Symptom:** Lambda runs out of memory

**Cause:** Default memory (128MB) is too low

### Fix

Increase Lambda memory:

```bash
aws lambda update-function-configuration \
  --function-name dev-vibe-pm-agent-lambda \
  --memory-size 1024 \
  --region us-east-1
```

## Error: Permission Denied

**Symptom:** Lambda can't access AWS services

**Cause:** Missing IAM permissions

### Fix

Check Lambda execution role:

```bash
aws lambda get-function-configuration \
  --function-name dev-vibe-pm-agent-lambda \
  --query 'Role' \
  --output text
```

Ensure role has these policies:
- AWSLambdaBasicExecutionRole
- Bedrock access (if using Bedrock)
- DynamoDB access (if using DynamoDB)

## Debugging Tips

### 1. View Real-time Logs

```bash
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --follow
```

### 2. Check Recent Errors

```bash
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda \
  --since 1h \
  --filter-pattern "ERROR"
```

### 3. Test Locally

```bash
# Install SAM CLI
brew install aws-sam-cli

# Test locally
sam local invoke VibePMAgentLambda \
  --event test-events/health-check.json
```

### 4. Check Package Size

```bash
ls -lh lambda-functions/lambda-deployment.zip
```

Lambda has a 50MB limit for direct upload, 250MB for S3.

### 5. Verify Function Configuration

```bash
aws lambda get-function-configuration \
  --function-name dev-vibe-pm-agent-lambda \
  --region us-east-1
```

## Common Issues Checklist

- [ ] node_modules included in package
- [ ] Handler path is correct (index.handler)
- [ ] Timeout is sufficient (300 seconds)
- [ ] Memory is sufficient (1024 MB)
- [ ] IAM role has required permissions
- [ ] All dependencies are installed
- [ ] TypeScript is compiled
- [ ] Package size is under limits

## Getting Help

1. **Check CloudWatch Logs** - Most errors are logged here
2. **Verify Package Contents** - Ensure node_modules is included
3. **Test Locally** - Use SAM CLI for local testing
4. **Check Configuration** - Verify handler, timeout, memory
5. **Review IAM Permissions** - Ensure role has required access

## Quick Commands Reference

```bash
# Redeploy Lambda
./deployment-scripts/quick-deploy-lambda.sh

# Check deployment
./lambda-functions/check-deployment.sh

# View logs
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --follow

# Test function
npm run test:lambda

# Update configuration
aws lambda update-function-configuration \
  --function-name dev-vibe-pm-agent-lambda \
  --timeout 300 \
  --memory-size 1024 \
  --region us-east-1
```

## Still Having Issues?

1. Delete and recreate the Lambda function
2. Use the full packaging script: `./deployment-scripts/package-lambda.sh`
3. Deploy via CloudFormation for proper configuration
4. Check AWS service health dashboard
