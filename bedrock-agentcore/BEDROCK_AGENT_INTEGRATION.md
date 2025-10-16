# Bedrock Agent Integration Guide

## Overview
This guide explains how to integrate the Vibe PM Agent Lambda functions with AWS Bedrock Agents using the provided action group schema.

## Prerequisites
- ✅ Lambda function deployed to us-east-1 region
- ✅ Bedrock Agent created in AWS console
- ✅ Proper IAM permissions for Bedrock Agent to invoke Lambda

## Integration Steps

### 1. Deploy Lambda Function
First, ensure your Lambda function is deployed to us-east-1:

```bash
# Deploy to us-east-1 region
./deployment-scripts/deploy-lambda-us-east-1.sh dev
```

**Expected Output:**
- Lambda Function: `dev-vibe-pm-agent-lambda`
- Function ARN: `arn:aws:lambda:us-east-1:119370291155:function:dev-vibe-pm-agent-lambda`
- IAM Role: `arn:aws:iam::119370291155:role/dev-vibe-pm-agent-lambda-role`

### 2. Use the Action Group Schema
The `lambda-action-group-schema.json` file contains the complete OpenAPI schema for all 32 PM functions. Use this file when creating your Bedrock Agent action group.

### 3. Create Bedrock Agent Action Group

#### In AWS Console:
1. **Navigate to Bedrock Agent** in AWS Console
2. **Go to Action Groups** tab
3. **Create Action Group**
4. **Select "Define with function details"**
5. **Upload the schema file**: `bedrock-agentcore/lambda-action-group-schema.json`

#### Using AWS CLI:
```bash
# Create action group with the schema
aws bedrock-agent create-agent-action-group \
  --agent-id YOUR_AGENT_ID \
  --action-group-name "VibePMAgentTools" \
  --description "32 PM-focused tools for business analysis, communications, requirements, market intelligence, interview prep, and case studies" \
  --action-group-executor '{
    "type": "LAMBDA",
    "lambda": "arn:aws:lambda:us-east-1:119370291155:function:dev-vibe-pm-agent-lambda"
  }' \
  --function-schema file://bedrock-agentcore/lambda-action-group-schema.json
```

### 4. Configure IAM Permissions
Ensure your Bedrock Agent has permission to invoke the Lambda function:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-east-1:119370291155:function:dev-vibe-pm-agent-lambda"
    }
  ]
}
```

### 5. Test Integration
Test the integration with a simple function call:

```bash
# Test Lambda function directly
aws lambda invoke \
  --function-name dev-vibe-pm-agent-lambda \
  --region us-east-1 \
  --payload '{
    "toolName": "validate_idea_quick",
    "toolArgs": {
      "idea": "Create a mobile app for fitness tracking",
      "criteria": ["market_viability", "technical_feasibility"]
    }
  }' \
  response.json

# View response
cat response.json
```

## Function Categories and Usage

### Business Analysis Tools (8 functions)
```json
{
  "toolName": "analyze_business_opportunity",
  "toolArgs": {
    "idea": "Your business idea",
    "market_context": {
      "industry": "Technology",
      "competition": "High",
      "budget_range": "medium",
      "timeline": "6 months"
    }
  }
}
```

### Communications Tools (4 functions)
```json
{
  "toolName": "create_stakeholder_communication",
  "toolArgs": {
    "business_case": "Project business case",
    "communication_type": "executive_onepager",
    "audience": "executives"
  }
}
```

### Requirements Tools (4 functions)
```json
{
  "toolName": "generate_requirements",
  "toolArgs": {
    "feature_idea": "User authentication system",
    "context": {
      "user_types": ["admin", "user", "guest"],
      "security_level": "high"
    }
  }
}
```

### Market Intelligence Tools (4 functions)
```json
{
  "toolName": "enhance_citations",
  "toolArgs": {
    "content": "Market analysis content to enhance",
    "sources": ["source1", "source2"]
  }
}
```

### Interview Prep Tools (6 functions)
```json
{
  "toolName": "start_interview_preparation",
  "toolArgs": {
    "role_level": "PM",
    "target_company": "Google",
    "preparation_timeline": "4 weeks",
    "focus_areas": ["Product Strategy", "Leadership"]
  }
}
```

### Case Studies Tools (5 functions)
```json
{
  "toolName": "start_case_study",
  "toolArgs": {
    "case_type": "product_design",
    "industry": "Technology",
    "difficulty_level": 3,
    "role_level": "PM"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Function Name Validation Error
**Error**: `Member must satisfy regular expression pattern: ([0-9a-zA-Z][_-]?){1,100}`

**Solution**: All function names in the schema use snake_case format which is valid:
- ✅ `analyze_business_opportunity`
- ✅ `generate_pr_faq`
- ❌ `start.interview.preparation`
- ❌ `start__interview__preparation`

#### 2. Lambda Invocation Permission Error
**Error**: `AccessDenied` when invoking Lambda

**Solution**: Ensure Bedrock Agent IAM role has `lambda:InvokeFunction` permission for the Lambda function ARN.

#### 3. Timeout Errors
**Error**: Function times out after 300 seconds

**Solution**: Lambda is configured with 300s timeout. If tools need more time, consider:
- Breaking large requests into smaller chunks
- Implementing asynchronous processing
- Using Lambda layers for shared code

#### 4. Cold Start Performance
**Solution**: Enable Lambda provisioned concurrency for predictable performance:
```bash
aws lambda put-provisioned-concurrency-config \
  --function-name dev-vibe-pm-agent-lambda \
  --provisioned-concurrent-executions 1
```

## Monitoring and Operations

### CloudWatch Logs
- **Log Group**: `/aws/lambda/dev-vibe-pm-agent-lambda`
- **Monitor for**: Errors, performance issues, function usage patterns

### Performance Metrics
- **Function Duration**: Should be < 250 seconds (alarm threshold)
- **Error Rate**: Should be < 1% (alarm threshold)
- **Invocation Count**: Track usage patterns

### Cost Optimization
- **Memory Usage**: Monitor actual usage vs. allocated 1024MB
- **Invocation Frequency**: Consider reserved instances for predictable workloads
- **Response Caching**: Implement caching for frequently used tools

## Security Best Practices

### 1. Input Validation
All functions include comprehensive input validation:
```typescript
// Validates required fields and types
const request = validateLambdaRequest(requestBody);
```

### 2. Error Handling
Sensitive information is not exposed in error messages:
```typescript
// Safe error responses
const response = formatErrorResponse(error, context.awsRequestId);
```

### 3. Least Privilege Access
IAM role follows principle of least privilege:
- CloudWatch Logs access only
- Bedrock model access only
- No unnecessary S3 or other service permissions

## API Gateway Integration (Optional)

If you need HTTP endpoints for external access:

```bash
# Deploy API Gateway
./deployment-scripts/deploy-api-gateway.sh dev
```

This creates RESTful endpoints for all Lambda functions with proper CORS configuration.

## Support and Maintenance

### Regular Tasks
- **Weekly**: Review CloudWatch metrics and logs
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance review and optimization

### Update Procedures
1. Update Lambda function code
2. Test changes locally
3. Deploy updates using deployment scripts
4. Verify integration with Bedrock Agent

### Contact Information
- **Development Team**: dev-team@company.com
- **Operations Team**: ops-team@company.com
- **Emergency Contact**: on-call@company.com

## Schema File Reference

The `lambda-action-group-schema.json` includes:
- ✅ **32 function definitions** with proper naming convention
- ✅ **Complete parameter schemas** for all function arguments
- ✅ **Proper OpenAPI 3.0 format** for Bedrock Agent compatibility
- ✅ **Detailed descriptions** for each function and parameter

## Next Steps

1. **Deploy Lambda Function**: Use the deployment script for us-east-1
2. **Create Bedrock Agent Action Group**: Use the provided schema file
3. **Test Integration**: Verify function calls work correctly
4. **Monitor Performance**: Set up CloudWatch dashboards and alarms
5. **Scale as Needed**: Adjust memory, timeout, and concurrency settings

The integration provides access to all 32 PM-focused tools through a unified Lambda function architecture, enabling powerful product management capabilities within your Bedrock Agent workflows.
