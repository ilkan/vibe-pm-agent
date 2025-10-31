# 🚀 Vibe PM Agent - AWS Deployment Guide

Deploy your Vibe PM Agent MCP server to AWS in minutes with professional-grade infrastructure.

## Quick Deploy

```bash
# 1. Install dependencies
npm install

# 2. Configure AWS credentials
aws configure

# 3. Deploy to production
npm run deploy:aws

# 4. Verify deployment
npm run deploy:verify
```

## 📋 Prerequisites

- **Node.js** 18.0.0+ ([download](https://nodejs.org))
- **AWS CLI** configured ([setup guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- **AWS Account** with appropriate permissions
- **npm** package manager (included with Node.js)

## 🎯 Deployment Options

### Option 1: Serverless Framework (Recommended)

**Best for:** Quick deployment, automatic scaling, minimal configuration

```bash
# Production deployment
npm run deploy:aws

# Development environment
npm run deploy:aws:dev

# Staging environment  
npm run deploy:aws:staging

# View deployment info
npm run deploy:aws:info

# View logs
npm run deploy:aws:logs

# Remove deployment
npm run deploy:aws:remove
```

### Option 2: AWS CDK

**Best for:** Advanced configuration, enterprise deployments, infrastructure as code

```bash
# Navigate to CDK directory
cd deployment/aws/cdk

# Install CDK dependencies
npm install

# Bootstrap CDK (first time only)
npm run bootstrap

# Deploy to production
npm run deploy:prod

# Deploy to development
npm run deploy:dev
```

## 🏗️ What Gets Deployed

### AWS Infrastructure

| Resource | Purpose | Configuration |
|----------|---------|---------------|
| **5 Lambda Functions** | MCP server and business intelligence tools | 1GB memory, 5min timeout |
| **API Gateway** | RESTful API with CORS | Rate limiting, logging enabled |
| **DynamoDB Table** | Caching layer for analysis results | Pay-per-request, TTL enabled |
| **S3 Bucket** | Document and artifact storage | Versioned, encrypted |
| **CloudWatch** | Logging and monitoring | 30-day retention, X-Ray tracing |

### API Endpoints

After deployment, you'll have these endpoints:

```
https://your-api-id.execute-api.region.amazonaws.com/prod/
├── /mcp/health          # Health check
├── /mcp                 # Main MCP protocol endpoint
└── /api/
    ├── /business/analyze    # Business analysis
    ├── /documents/generate  # Document generation
    ├── /market/analyze     # Market intelligence
    └── /citations/validate # Citation service
```

## ⚙️ Configuration

### Environment Variables

```bash
# Deployment stage
export STAGE=prod              # prod, staging, dev

# AWS region
export REGION=us-east-1        # Your preferred region

# Logging level
export LOG_LEVEL=info          # debug, info, warn, error

# Performance tuning
export LAMBDA_MEMORY=1024      # Lambda memory in MB
export LAMBDA_TIMEOUT=300      # Lambda timeout in seconds
```

### Custom Configuration

Edit `deployment/aws/serverless.yml` for advanced configuration:

```yaml
# Custom memory per function
functions:
  mcpServer:
    memorySize: 2048
    timeout: 600
    
# VPC configuration (optional)
provider:
  vpc:
    securityGroupIds:
      - sg-12345678
    subnetIds:
      - subnet-12345678
```

## 🔧 Post-Deployment Setup

### 1. Configure MCP Client

Add to your Kiro MCP configuration (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "vibe-pm-agent": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", "@-",
        "https://your-api-id.execute-api.region.amazonaws.com/prod/mcp"
      ],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 2. Test Deployment

```bash
# Automated verification
npm run deploy:verify

# Manual health check
curl https://your-api-id.execute-api.region.amazonaws.com/prod/mcp/health

# Test MCP tools
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list","id":1}' \
  https://your-api-id.execute-api.region.amazonaws.com/prod/mcp
```

### 3. Monitor Performance

- **CloudWatch Dashboard**: View metrics and logs
- **X-Ray Tracing**: Analyze performance bottlenecks
- **Cost Explorer**: Monitor AWS costs

## 💰 Cost Estimation

**Typical monthly costs:**

| Usage Level | Lambda | API Gateway | DynamoDB | S3 | Total |
|-------------|--------|-------------|----------|----|----|
| **Light** (10K requests) | $2 | $0.35 | $0.25 | $0.50 | **~$3** |
| **Medium** (100K requests) | $20 | $3.50 | $1.25 | $2.50 | **~$27** |
| **Heavy** (1M requests) | $200 | $35 | $12.50 | $25 | **~$273** |

*Costs may vary by region and usage patterns*

## 🔒 Security Features

- **IAM Roles**: Least-privilege access for Lambda functions
- **Encryption**: Data encrypted at rest and in transit
- **VPC Support**: Optional private network deployment
- **API Security**: Rate limiting and request validation
- **Audit Logging**: Complete request/response logging

## 🚨 Troubleshooting

### Common Issues

**Deployment Fails:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify permissions
aws iam get-user

# Check region
aws configure get region
```

**Lambda Errors:**
```bash
# View logs
npm run deploy:aws:logs

# Test function directly
aws lambda invoke \
  --function-name prod-vibe-pm-agent-mcp-server \
  --payload '{}' \
  response.json
```

**API Gateway Issues:**
```bash
# Test health endpoint
curl https://api-id.execute-api.region.amazonaws.com/prod/mcp/health

# Check API Gateway logs
aws logs tail /aws/apigateway/api-id --follow
```

### Performance Optimization

1. **Increase Lambda Memory**: Higher memory = faster CPU
2. **Enable Provisioned Concurrency**: Reduce cold starts
3. **Optimize DynamoDB**: Use appropriate read/write capacity
4. **Cache Responses**: Implement application-level caching

## 📊 Monitoring

### CloudWatch Metrics

Monitor these key metrics:

- **Lambda Duration**: Function execution time
- **API Gateway Latency**: Request response time
- **Error Rate**: Failed requests percentage
- **DynamoDB Throttling**: Capacity exceeded events

### Alarms

Automatic alarms for:

- High error rates (>5%)
- High latency (>5 seconds)
- Lambda function failures
- DynamoDB throttling

### Cost Monitoring

- **AWS Cost Explorer**: Track spending trends
- **Budget Alerts**: Get notified of cost overruns
- **Resource Tagging**: Organize costs by project

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run deploy:aws
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  image: node:18
  script:
    - npm install
    - npm run deploy:aws
  only:
    - main
```

## 📚 Next Steps

1. **Custom Domain**: Set up a custom domain for your API
2. **Monitoring**: Configure advanced monitoring and alerting
3. **Scaling**: Implement auto-scaling for high traffic
4. **Security**: Add API authentication and authorization
5. **Backup**: Set up automated backups for DynamoDB

## 🆘 Support

Need help with deployment?

- **Documentation**: Check [deployment/aws/README.md](deployment/aws/README.md)
- **Issues**: Open a GitHub issue
- **Community**: Join our discussions
- **Enterprise**: Contact for enterprise support

---

**Ready to deploy?**

```bash
npm run deploy:aws
```

*Your business intelligence platform awaits in the cloud.*