# Vibe PM Agent - Deployment Guide

Complete deployment guide for the Vibe PM Agent MCP server with AWS Bedrock Agent integration and Llama 3.1 Nemotron Nano 8B V1 enhancement.

## 🚀 Quick Deployment

### Prerequisites

1. **Node.js 18+** and npm
2. **AWS CLI** configured with appropriate permissions
3. **Serverless Framework** (installed automatically if needed)
4. **AWS Bedrock access** in your target region

### One-Command Deployment

```bash
# Deploy to production
npm run deploy:aws

# Deploy to staging
npm run deploy:aws:staging

# Deploy to development
npm run deploy:aws:dev
```

## 📋 Detailed Setup

### 1. Environment Setup

#### AWS Credentials Configuration
```bash
# Configure AWS CLI
aws configure

# Verify access
aws sts get-caller-identity

# Check Bedrock access
aws bedrock list-foundation-models --region us-east-1
```

#### Required AWS Permissions
Your AWS user/role needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "apigateway:*",
        "iam:*",
        "s3:*",
        "dynamodb:*",
        "logs:*",
        "bedrock:*",
        "bedrock-agent:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Project Setup

```bash
# Clone and setup
git clone <repository-url>
cd vibe-pm-agent

# Install dependencies
npm install

# Build the project
npm run build:prod

# Verify build
ls -la dist/mcp/server.js
```

### 3. Bedrock Agent Configuration

#### Current Agent Configuration
The system includes 4 enhanced Bedrock agents:

| Agent | ID | Purpose | Model |
|-------|----|---------| ------|
| Business Strategy | IBQRX8MZJJ | Market analysis with enhanced reasoning | Nemotron Nano 8B V1 |
| Product Development | CEW45LTT2P | Requirements and design with intelligent planning | Nemotron Nano 8B V1 |
| Executive Communications | ULX1RJGKCR | Business cases with advanced ROI analysis | Nemotron Nano 8B V1 |
| Case Study Coaching | PDZPQTNLYH | Strategic coaching with Nemotron insights | Nemotron Nano 8B V1 |

#### Agent Configuration Files
```
src/config/bedrock-agents/
├── business-strategy-agent.ts      # IBQRX8MZJJ
├── product-development-agent.ts    # CEW45LTT2P
├── executive-communications-agent.ts # ULX1RJGKCR
├── case-study-coaching-agent.ts    # PDZPQTNLYH
└── index.ts                        # Agent registry
```

### 4. Deployment Process

#### Standard Deployment
```bash
# Navigate to deployment directory
cd deployment/aws

# Deploy with enhanced logging
STAGE=prod REGION=us-east-1 ./deploy.sh deploy
```

#### Custom Deployment Options
```bash
# Deploy to specific stage and region
STAGE=staging REGION=eu-west-1 ./deploy.sh deploy

# Deploy with debug logging
LOG_LEVEL=debug ./deploy.sh deploy

# Deploy without Bedrock agent updates
SKIP_BEDROCK_AGENTS=true ./deploy.sh deploy
```

### 5. Post-Deployment Verification

#### Test MCP Server
```bash
# Test all 27 tools
node test-mcp-server.js

# Expected output:
# ✅ MCP Server initialized successfully
# ✅ Tool invocation successful
# ✅ All tests completed successfully!
```

#### Test Bedrock Agents
```bash
# Test enhanced agents
npm run agents:test

# Expected output:
# ✅ Business Strategy Agent (IBQRX8MZJJ) - Working
# ✅ Product Development Agent (CEW45LTT2P) - Working
# ✅ Executive Communications Agent (ULX1RJGKCR) - Working
# ✅ Case Study Coaching Agent (PDZPQTNLYH) - Working
```

#### Verify Deployment
```bash
# Get deployment information
./deploy.sh info

# Test API endpoints
./deploy.sh test

# View logs
./deploy.sh logs
```

## 🏗️ Architecture Overview

### AWS Resources Created

#### Lambda Functions
- **mcpServer** - Main MCP server handler
- **businessAnalysis** - Business opportunity analysis
- **documentGeneration** - Executive communications
- **marketIntelligence** - Real-time market analysis
- **citationService** - Professional citation management

#### Supporting Resources
- **API Gateway** - REST API for MCP protocol
- **DynamoDB Table** - Caching and session storage
- **S3 Bucket** - Data storage and artifacts
- **CloudWatch Logs** - Centralized logging
- **IAM Roles** - Secure access management

#### Bedrock Integration
- **4 Enhanced Agents** - With Nemotron model integration
- **Model Access** - Llama 3.1 Nemotron Nano 8B V1
- **Agent Runtime** - For enhanced reasoning capabilities

### Network Architecture
```
Internet → API Gateway → Lambda Functions → Bedrock Agents → Nemotron Model
                    ↓
                DynamoDB (Cache)
                    ↓
                S3 (Storage)
```

## 🔧 Configuration Options

### Environment Variables

#### MCP Server Configuration
```bash
# Core settings
NODE_ENV=production
LOG_LEVEL=info
STAGE=prod
REGION=us-east-1

# Bedrock configuration
BEDROCK_REGION=us-east-1
NEMOTRON_MODEL_ID=meta.llama3-1-nemotron-nano-8b-v1:0

# Agent IDs
BUSINESS_STRATEGY_AGENT_ID=IBQRX8MZJJ
PRODUCT_DEVELOPMENT_AGENT_ID=CEW45LTT2P
EXECUTIVE_COMMUNICATIONS_AGENT_ID=ULX1RJGKCR
CASE_STUDY_COACHING_AGENT_ID=PDZPQTNLYH
```

#### Serverless Configuration
Located in `deployment/aws/serverless.yml`:

```yaml
provider:
  name: aws
  runtime: nodejs18.x
  region: ${opt:region, 'us-east-1'}
  stage: ${opt:stage, 'prod'}
  memorySize: 2048  # Enhanced for Bedrock integration
  timeout: 300
```

### Custom Domain Setup (Optional)

```bash
# Install serverless domain manager
npm install serverless-domain-manager --save-dev

# Configure custom domain in serverless.yml
customDomain:
  domainName: api.yourdomain.com
  basePath: vibe-pm-agent
  stage: ${self:provider.stage}
  createRoute53Record: true

# Create domain
serverless create_domain --stage prod

# Deploy with custom domain
serverless deploy --stage prod
```

## 🔍 Monitoring & Troubleshooting

### CloudWatch Monitoring

#### Key Metrics to Monitor
- **Lambda Duration** - Function execution time
- **Lambda Errors** - Error rate and types
- **API Gateway 4XX/5XX** - Client and server errors
- **DynamoDB Throttles** - Database performance
- **Bedrock Invocations** - Model usage and costs

#### Setting Up Alarms
```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "VibePMAgent-HighErrorRate" \
  --alarm-description "High error rate in Vibe PM Agent" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### Log Analysis

#### Viewing Logs
```bash
# Real-time logs
./deploy.sh logs

# Specific function logs
aws logs tail /aws/lambda/prod-vibe-pm-agent-mcp-server --follow

# Filter logs by error level
aws logs filter-log-events \
  --log-group-name /aws/lambda/prod-vibe-pm-agent-mcp-server \
  --filter-pattern "ERROR"
```

#### Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Cold Start Timeout | Intermittent timeouts | Increase memory allocation |
| Bedrock Access Denied | 403 errors from agents | Check IAM permissions |
| High Latency | Slow response times | Enable caching, optimize queries |
| Memory Issues | Out of memory errors | Increase Lambda memory |
| Rate Limiting | 429 errors | Implement exponential backoff |

### Performance Optimization

#### Lambda Optimization
```yaml
# Optimized Lambda configuration
functions:
  mcpServer:
    memorySize: 2048  # Higher memory for better performance
    timeout: 300      # Adequate timeout for complex analysis
    reservedConcurrency: 10  # Prevent runaway costs
    environment:
      NODE_OPTIONS: '--max-old-space-size=1792'
```

#### Caching Strategy
```typescript
// DynamoDB caching configuration
const cacheConfig = {
  tableName: 'vibe-pm-agent-prod-cache',
  ttl: 300, // 5 minutes for business analysis
  keyPrefix: 'mcp-tool-',
  enableCompression: true
};
```

## 🚀 Advanced Deployment Scenarios

### Multi-Region Deployment

```bash
# Deploy to multiple regions
REGION=us-east-1 ./deploy.sh deploy
REGION=eu-west-1 ./deploy.sh deploy
REGION=ap-southeast-1 ./deploy.sh deploy

# Configure Route 53 for global load balancing
aws route53 create-health-check \
  --caller-reference vibe-pm-agent-us-east-1 \
  --health-check-config Type=HTTPS,ResourcePath=/mcp/health
```

### Blue-Green Deployment

```bash
# Deploy to staging
STAGE=staging ./deploy.sh deploy

# Test staging environment
STAGE=staging ./deploy.sh test

# Promote to production
STAGE=prod ./deploy.sh deploy

# Rollback if needed
STAGE=prod-backup ./deploy.sh deploy
```

### CI/CD Integration

#### GitHub Actions Example
```yaml
name: Deploy Vibe PM Agent
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
      - run: npm run build:prod
      - run: npm run deploy:aws
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 🔒 Security Considerations

### IAM Best Practices

#### Least Privilege Access
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:foundation-model/meta.llama3-1-nemotron-nano-8b-v1:0"
      ]
    }
  ]
}
```

#### API Security
- Enable API Gateway authentication
- Use AWS WAF for DDoS protection
- Implement rate limiting
- Enable CloudTrail logging

### Data Protection
- Enable encryption at rest for DynamoDB and S3
- Use HTTPS/TLS for all communications
- Implement data retention policies
- Regular security audits

## 💰 Cost Optimization

### Bedrock Costs
- **Nemotron Model**: ~$0.0002 per 1K input tokens
- **Agent Invocations**: ~$0.00001 per invocation
- **Estimated Monthly Cost**: $50-200 for moderate usage

### Lambda Costs
- **Compute**: ~$0.0000166667 per GB-second
- **Requests**: ~$0.20 per 1M requests
- **Estimated Monthly Cost**: $20-100 for moderate usage

### Cost Monitoring
```bash
# Set up billing alerts
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json
```

## 📞 Support & Troubleshooting

### Getting Help
- **Documentation**: [docs/](docs/) directory
- **Issues**: [GitHub Issues](https://github.com/ilkan/vibe-pm-agent/issues)
- **Examples**: [examples/](examples/) directory

### Emergency Procedures

#### Rollback Deployment
```bash
# Quick rollback
./deploy.sh remove
STAGE=prod-backup ./deploy.sh deploy
```

#### Scale Down for Cost Control
```bash
# Reduce Lambda concurrency
aws lambda put-provisioned-concurrency-config \
  --function-name vibe-pm-agent-prod-mcpServer \
  --provisioned-concurrency-config ProvisionedConcurrencyConfig=0
```

---

**Ready to deploy your enhanced Vibe PM Agent with Bedrock integration?** 🚀

Follow this guide for a smooth deployment experience with all 27 MCP tools and 4 enhanced Bedrock agents!