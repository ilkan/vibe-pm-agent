# Lambda Function Deployment and Operations Guide

## Overview
This document provides comprehensive guidance for deploying, operating, and maintaining the Vibe PM Agent Lambda functions in AWS environments.

## Architecture Overview

### Lambda Function Structure
- **Unified Router**: Single Lambda function handling all 32 PM tools
- **Tool Categories**:
  - Business Analysis (8 tools)
  - Communications (4 tools)
  - Requirements (4 tools)
  - Market Intelligence (4 tools)
  - Interview Prep (6 tools)
  - Case Studies (5 tools)

### AWS Services Used
- **Lambda**: Core compute service
- **API Gateway**: HTTP API endpoints
- **CloudFormation**: Infrastructure as Code
- **CloudWatch**: Monitoring and logging
- **S3**: Deployment package storage
- **IAM**: Access management

## Deployment Procedures

### Pre-deployment Checklist
- [ ] AWS CLI configured with appropriate credentials
- [ ] Node.js 18.x or later installed
- [ ] npm packages installed
- [ ] TypeScript compilation successful
- [ ] S3 bucket created for deployment packages
- [ ] IAM roles and policies configured

### Deployment Steps

#### 1. Package Lambda Function
```bash
# Navigate to project root
cd /path/to/vibe-pm-agent

# Set AWS profile (if using named profiles)
export AWS_PROFILE=your-profile-name

# Package for development environment
./deployment-scripts/package-lambda.sh dev

# Package for production environment
./deployment-scripts/package-lambda.sh prod
```

**What happens during packaging:**
- Installs Node.js dependencies
- Compiles TypeScript to JavaScript
- Creates deployment package ZIP file
- Uploads package to S3 bucket
- Generates package information for CloudFormation

#### 2. Deploy Lambda Function
```bash
# Deploy to development environment
./deployment-scripts/deploy-lambda.sh dev

# Deploy to production environment
./deployment-scripts/deploy-lambda.sh prod
```

**What happens during deployment:**
- Validates CloudFormation template
- Creates/updates Lambda function
- Configures environment variables
- Sets up CloudWatch logging
- Creates monitoring alarms
- Configures IAM permissions

#### 3. Deploy API Gateway (Optional)
```bash
# Deploy API Gateway integration
./deployment-scripts/deploy-api-gateway.sh dev
```

## Environment Configuration

### Environment Variables
The Lambda function uses the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node.js environment | `dev` or `prod` |
| `ENVIRONMENT` | Deployment environment | `dev` or `prod` |
| `LOG_LEVEL` | Logging level | `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `BEDROCK_REGION` | AWS Bedrock region | `us-east-1` |
| `API_GATEWAY_URL` | API Gateway endpoint URL | `https://api.example.com` |
| `ENABLE_CACHING` | Enable response caching | `true` or `false` |
| `CACHE_TIMEOUT` | Cache timeout in seconds | `300` |

### Environment-specific Configuration

#### Development Environment
```yaml
environment: dev
logLevel: DEBUG
enableCaching: false
bedrockRegion: us-west-2
```

#### Production Environment
```yaml
environment: prod
logLevel: INFO
enableCaching: true
cacheTimeout: 300
bedrockRegion: us-east-1
```

## Monitoring and Alerting

### CloudWatch Dashboards
The deployment creates a comprehensive CloudWatch dashboard with:
- Lambda function metrics (errors, duration, invocations)
- API Gateway metrics (latency, error rates)
- Custom business metrics (tool usage, performance)

### Alarms Configuration
- **Error Rate**: Alerts when error rate exceeds 1%
- **Duration**: Alerts when average duration exceeds 250 seconds
- **Throttles**: Alerts when function throttling occurs

### Log Groups
- Lambda function logs: `/aws/lambda/{environment}-vibe-pm-agent-lambda`
- API Gateway logs: `API_GATEWAY_EXECUTION_LOGS`

## Rollback Procedures

### Emergency Rollback
If critical issues occur, perform immediate rollback:

```bash
# 1. Identify previous working version
aws s3 ls s3://vibe-pm-agent-lambda-packages/lambda-packages/dev/ --recursive

# 2. Update function code with previous version
aws lambda update-function-code \
  --function-name dev-vibe-pm-agent-lambda \
  --s3-bucket vibe-pm-agent-lambda-packages \
  --s3-key "lambda-packages/dev/previous-working-version.zip"

# 3. Test function
aws lambda invoke --function-name dev-vibe-pm-agent-lambda \
  --payload '{"toolName":"health_check","toolArgs":{}}' response.json
```

### Standard Rollback Process
1. **Identify Issue**: Determine the nature and scope of the problem
2. **Locate Previous Version**: Find the last known working deployment
3. **Deploy Previous Version**: Use CloudFormation or direct Lambda update
4. **Verify Rollback**: Test critical functionality
5. **Monitor**: Watch error rates and performance metrics for 15 minutes

### Rollback Verification Checklist
- [ ] Health check endpoint responds correctly
- [ ] All tool categories function properly
- [ ] Error rates return to normal levels
- [ ] Performance metrics are within acceptable ranges
- [ ] No new errors introduced by rollback

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Lambda Function Timeout
**Symptoms**: Function times out after 300 seconds
**Causes**:
- Complex tool execution taking too long
- External API calls hanging
- Memory exhaustion

**Solutions**:
1. Check CloudWatch logs for timeout patterns
2. Optimize tool execution logic
3. Increase memory allocation if needed
4. Implement timeout handling in tool code

#### 2. High Error Rates
**Symptoms**: Error rate exceeds alarm threshold
**Causes**:
- Invalid input parameters
- External service failures
- Code bugs

**Solutions**:
1. Review CloudWatch logs for error patterns
2. Check API Gateway error logs
3. Validate input schemas
4. Test individual tools for issues

#### 3. Cold Start Performance Issues
**Symptoms**: First request after idle period is slow
**Causes**:
- Lambda cold start
- Large package size
- Initialization overhead

**Solutions**:
1. Enable Lambda provisioned concurrency
2. Optimize package size
3. Implement connection pooling
4. Use Lambda layers for shared code

#### 4. API Gateway Integration Issues
**Symptoms**: 4xx/5xx responses from API Gateway
**Causes**:
- CORS configuration issues
- Integration timeout
- Invalid response format

**Solutions**:
1. Check API Gateway logs in CloudWatch
2. Verify Lambda function response format
3. Check CORS configuration
4. Validate integration settings

### Debugging Tools

#### CloudWatch Logs Insights Queries
```sql
# Find errors in Lambda logs
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

# Analyze function performance
fields @timestamp, @message
| filter @message like /executionTime/
| stats avg(executionTime) by bin(5m)
```

#### Lambda Function Testing
```bash
# Test function locally
npm test

# Test specific tool
aws lambda invoke --function-name dev-vibe-pm-agent-lambda \
  --payload '{"toolName":"validate_idea_quick","toolArgs":{"idea":"test"}}' \
  response.json

# Check function configuration
aws lambda get-function --function-name dev-vibe-pm-agent-lambda
```

## Performance Optimization

### Memory and CPU Optimization
- **Current Configuration**: 1024 MB memory
- **Recommended**: Monitor actual usage and adjust as needed
- **Optimization Tips**:
  - Use connection pooling for external services
  - Implement response caching
  - Optimize package size

### Concurrency Management
- **Reserved Concurrency**: Not set (uses account default)
- **Provisioned Concurrency**: Not configured (on-demand scaling)
- **Burst Limits**: Default AWS limits apply

### Cost Optimization
- **Monitoring**: Track function invocations and duration
- **Optimization Strategies**:
  - Implement response caching
  - Use appropriate memory allocation
  - Consider reserved instances for predictable workloads

## Security Considerations

### IAM Permissions
The Lambda function uses the following IAM permissions:
- **CloudWatch Logs**: Write logs and create log groups
- **S3**: Read deployment packages (if needed)
- **Bedrock**: Invoke models for AI-powered tools
- **SNS**: Send alarm notifications

### Data Protection
- All sensitive data should be encrypted in transit and at rest
- Use AWS KMS for encryption keys
- Implement proper input validation and sanitization
- Follow principle of least privilege for IAM roles

### Compliance
- Ensure logging captures all necessary audit events
- Implement proper error handling without exposing sensitive information
- Regular security reviews and updates

## Maintenance Procedures

### Regular Tasks
- **Weekly**: Review CloudWatch metrics and logs
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance review and optimization
- **Annually**: Architecture review and updates

### Update Procedures
1. **Code Updates**:
   ```bash
   # Update source code
   git pull origin main

   # Install new dependencies
   npm install

   # Test changes
   npm test

   # Deploy updates
   ./deployment-scripts/package-lambda.sh dev
   ./deployment-scripts/deploy-lambda.sh dev
   ```

2. **Configuration Updates**:
   - Update environment variables in CloudFormation template
   - Deploy configuration changes
   - Verify new configuration works correctly

### Backup and Recovery
- **Code Backup**: Git repository with version history
- **Configuration Backup**: CloudFormation templates in version control
- **Data Backup**: S3 bucket for deployment packages
- **Recovery**: Automated deployment scripts enable quick recovery

## Support and Escalation

### Contact Information
- **Development Team**: dev-team@company.com
- **Operations Team**: ops-team@company.com
- **Emergency Contact**: on-call@company.com

### Escalation Procedures
1. **Level 1**: Check documentation and troubleshooting guide
2. **Level 2**: Contact development team
3. **Level 3**: Contact operations team
4. **Level 4**: Engage AWS support if needed

### Service Level Agreements
- **Availability**: 99.5% uptime for production environment
- **Response Time**: < 2 seconds for 95% of requests
- **Error Rate**: < 1% for production environment
- **Support Response**: 4-hour response for critical issues

## Appendices

### API Reference
Complete API documentation available at:
- **Development**: `https://dev-api.company.com/docs`
- **Production**: `https://api.company.com/docs`

### Tool Categories and Endpoints

#### Business Analysis Tools
- `analyze_business_opportunity`
- `generate_business_case`
- `assess_strategic_alignment`
- `optimize_resource_allocation`
- `validate_market_timing`
- `validate_idea_quick`
- `analyze_competitor_landscape`
- `calculate_market_sizing`

#### Communications Tools
- `create_stakeholder_communication`
- `generate_management_onepager`
- `generate_pr_faq`
- `get_consulting_summary`

#### Requirements Tools
- `generate_requirements`
- `generate_design_options`
- `generate_task_plan`
- `optimize_intent`

#### Market Intelligence Tools
- `enhance_citations`
- `validate_and_audit_citations`
- `monitor_market_conditions`
- `analyze_workflow`

#### Interview Prep Tools
- `start_interview_preparation`
- `generate_interview_question`
- `evaluate_interview_response`
- `get_interview_feedback`
- `get_company_interview_insights`
- `customize_preparation_for_company`

#### Case Studies Tools
- `start_case_study`
- `get_case_guidance`
- `evaluate_case_approach`
- `complete_case_study`
- `get_company_case_scenarios`

### CloudFormation Template Parameters
- `Environment`: `dev` or `prod`
- `S3BucketName`: S3 bucket for deployment packages
- `S3Key`: S3 key for specific package version

This documentation should be reviewed and updated regularly to reflect changes in the system architecture, deployment processes, and operational procedures.
