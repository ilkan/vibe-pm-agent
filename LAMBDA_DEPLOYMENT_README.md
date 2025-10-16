# Lambda Function Deployment Infrastructure

## Overview

This document describes the deployment infrastructure for the Vibe PM Agent Lambda functions. The infrastructure includes CloudFormation templates, deployment scripts, and configuration files for deploying 32 PM-focused tools to AWS Lambda.

## Architecture

### Lambda Function Structure
- **Unified Lambda Function**: Single Lambda function handles all 32 PM tools
- **Router Pattern**: Main router dispatches requests to appropriate tool handlers
- **Environment Support**: Separate configurations for dev/prod environments

### Tool Categories (32 total)
1. **Business Analysis** (8 tools)
   - analyze_business_opportunity
   - generate_business_case
   - assess_strategic_alignment
   - optimize_resource_allocation
   - validate_market_timing
   - validate_idea_quick
   - analyze_competitor_landscape
   - calculate_market_sizing

2. **Communications** (4 tools)
   - create_stakeholder_communication
   - generate_management_onepager
   - generate_pr_faq
   - generate_board_presentation

3. **Requirements** (4 tools)
   - generate_requirements
   - generate_design_options
   - generate_task_plan
   - generate_roi_analysis

4. **Market Intelligence** (4 tools)
   - enhance_citations
   - validate_and_audit_citations
   - monitor_market_conditions
   - optimize_intent

5. **Interview Prep** (6 tools)
   - start_interview_preparation
   - generate_interview_question
   - evaluate_interview_response
   - get_interview_feedback
   - get_company_interview_insights
   - customize_preparation_for_company

6. **Case Studies** (5 tools)
   - start_case_study
   - get_case_guidance
   - evaluate_case_approach
   - complete_case_study
   - get_company_case_scenarios

## Infrastructure Components

### CloudFormation Templates

#### `infrastructure/lambda-deployment.yaml`
Main CloudFormation template that creates:
- Lambda function with proper configuration
- IAM role with necessary permissions
- CloudWatch log groups and alarms
- SNS topics for monitoring
- Dead letter queue configuration

### Deployment Scripts

#### `deployment-scripts/package-lambda.sh`
Packages Lambda functions for deployment:
- Builds TypeScript code
- Installs dependencies
- Creates deployment package
- Uploads to S3
- Generates package information for CloudFormation

#### `deployment-scripts/deploy-lambda.sh`
Deploys Lambda functions using CloudFormation:
- Validates CloudFormation template
- Creates or updates CloudFormation stack
- Waits for deployment completion
- Tests Lambda function
- Saves deployment outputs

### Configuration Files

#### `lambda-functions/.env.lambda`
Lambda-specific environment configuration:
- Runtime settings
- AWS configuration
- Monitoring settings
- Security configuration

## Deployment Process

### Prerequisites
1. **AWS CLI**: Installed and configured with appropriate credentials
2. **Node.js 18+**: For building TypeScript Lambda functions
3. **S3 Bucket**: For storing Lambda deployment packages

### Step 1: Package Lambda Functions
```bash
# For development environment
./deployment-scripts/package-lambda.sh dev

# For production environment
./deployment-scripts/package-lambda.sh prod
```

This script will:
- Check prerequisites (Node.js, npm, AWS CLI)
- Install Lambda dependencies
- Build TypeScript code
- Create deployment package
- Upload to S3
- Generate package information

### Step 2: Deploy Lambda Infrastructure
```bash
# For development environment
./deployment-scripts/deploy-lambda.sh dev

# For production environment
./deployment-scripts/deploy-lambda.sh prod
```

This script will:
- Validate CloudFormation template
- Create/update CloudFormation stack
- Wait for deployment completion
- Test Lambda function
- Save deployment outputs

### Step 3: Integrate with API Gateway
```bash
# Deploy API Gateway integration
./deployment-scripts/deploy-api-gateway.sh dev
```

## Configuration

### Environment Variables
The Lambda function supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node.js environment | production |
| `ENVIRONMENT` | Deployment environment | prod |
| `LOG_LEVEL` | Logging level | info |
| `LOG_FORMAT` | Log format | json |
| `LAMBDA_TIMEOUT` | Function timeout in seconds | 300 |
| `LAMBDA_MEMORY` | Memory allocation in MB | 1024 |

### IAM Permissions
The Lambda function requires the following IAM permissions:
- CloudWatch Logs access for logging
- S3 access for data operations (if needed)
- SNS access for dead letter queue
- Bedrock access for AI model invocations

### Monitoring
The infrastructure includes:
- CloudWatch log groups with configurable retention
- CloudWatch alarms for errors, duration, and throttles
- SNS topics for alarm notifications
- X-Ray tracing support

## Troubleshooting

### Common Issues

#### Package Upload Failures
- Ensure S3 bucket exists and is accessible
- Check AWS credentials and permissions
- Verify bucket name in script configuration

#### Deployment Failures
- Check CloudFormation template syntax
- Verify IAM permissions for stack creation
- Check AWS service limits (Lambda concurrency, etc.)

#### Lambda Function Errors
- Check CloudWatch logs for detailed error messages
- Verify environment variables are set correctly
- Ensure all dependencies are included in the package

### Debugging Commands

```bash
# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name dev-vibe-pm-agent-lambda

# View CloudWatch logs
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --follow

# Test Lambda function locally
aws lambda invoke --function-name dev-vibe-pm-agent-lambda \
  --payload '{"toolName": "health_check", "toolArgs": {}}' \
  response.json

# Check CloudWatch alarms
aws cloudwatch describe-alarms --alarm-name-prefix dev-vibe-pm-agent-lambda
```

## Security Considerations

### VPC Configuration
- Lambda functions can be deployed in VPC for enhanced security
- Configure VPC settings in `.env.lambda` if needed
- Ensure proper subnet and security group configuration

### Encryption
- CloudWatch logs can be encrypted with KMS keys
- Enable encryption in production environments
- Configure KMS key permissions appropriately

### Access Control
- Use IAM roles with least privilege principle
- Regularly rotate access keys
- Monitor for unauthorized access attempts

## Performance Optimization

### Lambda Configuration
- **Memory**: 1024 MB (adjust based on tool requirements)
- **Timeout**: 300 seconds (5 minutes for complex operations)
- **Concurrency**: Configurable reserved concurrency

### Monitoring Metrics
- Track function duration and errors
- Monitor memory usage and optimize if needed
- Set up appropriate alarms for performance issues

## Cost Optimization

### Lambda Costs
- Pay only for execution time and memory used
- Use reserved concurrency to control costs
- Monitor and optimize function duration

### CloudWatch Costs
- Log retention affects storage costs
- Configure appropriate log retention periods
- Use log filtering to reduce ingested data

## Support

For issues or questions regarding the Lambda deployment infrastructure:

1. Check CloudWatch logs for detailed error information
2. Review CloudFormation stack events for deployment issues
3. Verify AWS service quotas and limits
4. Check IAM permissions and policies

## Version History

- **v2.0.0**: Initial release with 32 PM tools
- **v1.0.0**: Initial version with basic Lambda deployment

---

*This infrastructure supports the deployment of 32 specialized Product Management tools including business analysis, stakeholder communications, requirements generation, market intelligence, interview preparation, and case study practice tools.*
