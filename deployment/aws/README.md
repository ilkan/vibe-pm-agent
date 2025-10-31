# AWS Deployment Guide for Vibe PM Agent

This guide covers deploying the Vibe PM Agent MCP server to AWS using either Serverless Framework or AWS CDK.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **AWS CLI** configured with appropriate credentials
- **npm** package manager
- **AWS Account** with appropriate permissions

### Option 1: Serverless Framework (Recommended)

```bash
# 1. Navigate to deployment directory
cd deployment/aws

# 2. Install dependencies
npm install

# 3. Deploy to production
./deploy.sh

# 4. Deploy to specific stage
STAGE=dev ./deploy.sh
```

### Option 2: AWS CDK

```bash
# 1. Navigate to CDK directory
cd deployment/aws/cdk

# 2. Install dependencies
npm install

# 3. Bootstrap CDK (first time only)
npm run bootstrap

# 4. Deploy
npm run deploy:prod
```

## 📋 Deployment Options

### Serverless Framework Deployment

The Serverless Framework provides a simple, configuration-driven approach:

**Features:**
- Automatic API Gateway setup
- Lambda function deployment
- DynamoDB and S3 resource creation
- Built-in monitoring and logging
- Easy rollback capabilities

**Commands:**
```bash
# Deploy to different stages
./deploy.sh                    # Production
STAGE=dev ./deploy.sh         # Development
STAGE=staging ./deploy.sh     # Staging

# Get deployment info
./deploy.sh info

# View logs
./deploy.sh logs

# Remove deployment
./deploy.sh remove

# Test deployment
./deploy.sh test
```

### AWS CDK Deployment

AWS CDK provides more control and type safety:

**Features:**
- TypeScript-based infrastructure as code
- Advanced resource configuration
- Custom monitoring stack
- Fine-grained IAM permissions
- CloudFormation integration

**Commands:**
```bash
# Deploy to different environments
npm run deploy:dev        # Development
npm run deploy:staging    # Staging
npm run deploy:prod       # Production

# View changes before deployment
npm run diff

# Generate CloudFormation templates
npm run synth

# Destroy infrastructure
npm run destroy
```

## 🏗️ Architecture Overview

### AWS Resources Created

1. **Lambda Functions** (5 functions):
   - `mcp-server`: Main MCP protocol handler
   - `business-analysis`: Business opportunity analysis
   - `document-generation`: Executive communications
   - `market-intelligence`: Real-time market analysis
   - `citation-service`: Professional citation management

2. **API Gateway**:
   - RESTful API with CORS enabled
   - Rate limiting and throttling
   - Request/response logging
   - Custom domain support (optional)

3. **DynamoDB Table**:
   - Caching layer for analysis results
   - TTL-enabled for automatic cleanup
   - Pay-per-request billing
   - Point-in-time recovery (production)

4. **S3 Bucket**:
   - Data storage for documents and artifacts
   - Versioning enabled
   - Server-side encryption
   - Lifecycle policies for cost optimization

5. **CloudWatch**:
   - Log groups for each Lambda function
   - Custom metrics and alarms
   - X-Ray tracing for performance monitoring

### Network Architecture

```
Internet → API Gateway → Lambda Functions → DynamoDB/S3
                    ↓
              CloudWatch Logs
                    ↓
               X-Ray Tracing
```

## ⚙️ Configuration

### Environment Variables

Configure deployment through environment variables:

```bash
# Deployment configuration
export STAGE=prod                    # Deployment stage
export REGION=us-east-1             # AWS region
export LOG_LEVEL=info               # Logging level

# Performance tuning
export LAMBDA_MEMORY=1024           # Lambda memory (MB)
export LAMBDA_TIMEOUT=300           # Lambda timeout (seconds)

# Feature flags
export ENABLE_XRAY=true             # X-Ray tracing
export ENABLE_MONITORING=true      # CloudWatch monitoring
```

### Serverless Configuration

Edit `serverless.yml` for custom configuration:

```yaml
# Custom memory and timeout per function
functions:
  mcpServer:
    memorySize: 2048
    timeout: 600
    
# Custom VPC configuration
provider:
  vpc:
    securityGroupIds:
      - sg-12345678
    subnetIds:
      - subnet-12345678
      - subnet-87654321
```

### CDK Configuration

Edit `cdk/app.ts` for custom configuration:

```typescript
// Custom configuration
const config = {
  environment: 'production',
  enableMonitoring: true,
  lambdaMemory: 1024,
  lambdaTimeout: 300,
};
```

## 🔧 Advanced Configuration

### Custom Domain Setup

1. **Create SSL Certificate** (ACM):
```bash
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --validation-method DNS
```

2. **Configure Custom Domain** in `serverless.yml`:
```yaml
custom:
  customDomain:
    domainName: api.yourdomain.com
    certificateName: api.yourdomain.com
    createRoute53Record: true
```

### VPC Configuration

For enhanced security, deploy Lambda functions in a VPC:

```yaml
provider:
  vpc:
    securityGroupIds:
      - ${env:VPC_SECURITY_GROUP_ID}
    subnetIds:
      - ${env:VPC_SUBNET_ID_1}
      - ${env:VPC_SUBNET_ID_2}
```

### Database Configuration

#### DynamoDB Optimization

```yaml
resources:
  Resources:
    CacheTable:
      Properties:
        BillingMode: PROVISIONED
        ProvisionedThroughput:
          ReadCapacityUnits: 5
          WriteCapacityUnits: 5
        GlobalSecondaryIndexes:
          - IndexName: GSI1
            Keys:
              PartitionKey: gsi1pk
              SortKey: gsi1sk
```

#### S3 Configuration

```yaml
resources:
  Resources:
    DataBucket:
      Properties:
        LifecycleConfiguration:
          Rules:
            - Id: ArchiveOldData
              Status: Enabled
              Transitions:
                - StorageClass: STANDARD_IA
                  TransitionInDays: 30
                - StorageClass: GLACIER
                  TransitionInDays: 90
```

## 📊 Monitoring and Observability

### CloudWatch Dashboards

The deployment creates custom CloudWatch dashboards for:

- **API Performance**: Request count, latency, error rates
- **Lambda Metrics**: Duration, memory usage, error rates
- **Database Performance**: Read/write capacity, throttling
- **Cost Monitoring**: Lambda invocations, data transfer

### Alarms and Notifications

Automatic alarms for:

- High error rates (>5%)
- High latency (>5 seconds)
- Lambda function failures
- DynamoDB throttling
- S3 access errors

### X-Ray Tracing

Enable distributed tracing:

```yaml
provider:
  tracing:
    lambda: true
    apiGateway: true
```

View traces in AWS X-Ray console for performance analysis.

## 🔒 Security Best Practices

### IAM Permissions

Lambda functions use least-privilege IAM roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:region:account:table/cache-table"
    }
  ]
}
```

### Encryption

- **DynamoDB**: Encryption at rest using AWS managed keys
- **S3**: Server-side encryption (SSE-S3)
- **Lambda**: Environment variables encrypted with KMS
- **API Gateway**: HTTPS only with TLS 1.2+

### Network Security

- **API Gateway**: Rate limiting and throttling
- **Lambda**: VPC deployment (optional)
- **S3**: Block public access
- **DynamoDB**: VPC endpoints for private access

## 💰 Cost Optimization

### Pricing Estimates

**Monthly costs for typical usage:**

| Component | Usage | Cost |
|-----------|-------|------|
| Lambda | 1M requests, 1GB-sec | $20 |
| API Gateway | 1M requests | $3.50 |
| DynamoDB | 1M reads/writes | $1.25 |
| S3 | 10GB storage, 1M requests | $2.50 |
| CloudWatch | Logs and metrics | $5 |
| **Total** | | **~$32/month** |

### Cost Optimization Tips

1. **Use Reserved Capacity** for predictable DynamoDB workloads
2. **Enable S3 Intelligent Tiering** for automatic cost optimization
3. **Set CloudWatch Log Retention** to 30 days or less
4. **Use Lambda Provisioned Concurrency** only when needed
5. **Monitor and optimize** Lambda memory allocation

## 🚨 Troubleshooting

### Common Issues

#### Deployment Failures

```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify permissions
aws iam get-user

# Check region configuration
aws configure get region
```

#### Lambda Function Errors

```bash
# View function logs
aws logs tail /aws/lambda/prod-vibe-pm-agent-mcp-server --follow

# Test function directly
aws lambda invoke \
  --function-name prod-vibe-pm-agent-mcp-server \
  --payload '{"test": true}' \
  response.json
```

#### API Gateway Issues

```bash
# Test API endpoint
curl -X POST https://api-id.execute-api.region.amazonaws.com/prod/mcp/health

# Check API Gateway logs
aws logs tail /aws/apigateway/api-id --follow
```

### Performance Issues

1. **High Latency**:
   - Increase Lambda memory allocation
   - Enable Lambda provisioned concurrency
   - Optimize DynamoDB queries

2. **High Error Rates**:
   - Check CloudWatch logs for error details
   - Verify IAM permissions
   - Check resource limits

3. **Throttling**:
   - Increase DynamoDB capacity
   - Implement exponential backoff
   - Use DynamoDB auto-scaling

## 📚 Additional Resources

### AWS Documentation

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [CloudWatch User Guide](https://docs.aws.amazon.com/cloudwatch/)

### Serverless Framework

- [Serverless Framework Documentation](https://www.serverless.com/framework/docs/)
- [AWS Lambda Plugin](https://www.serverless.com/plugins/serverless-webpack)

### AWS CDK

- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/)
- [CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/)

## 🆘 Support

For deployment issues:

1. **Check the logs** in CloudWatch
2. **Review the troubleshooting section** above
3. **Open an issue** in the GitHub repository
4. **Contact support** for enterprise customers

---

**Ready to deploy your Vibe PM Agent to AWS?**

```bash
cd deployment/aws
./deploy.sh
```

*Professional business intelligence in the cloud.*