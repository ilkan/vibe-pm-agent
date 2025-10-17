# External Access Setup Guide

This guide provides detailed instructions for setting up external access to the Vibe PM Agent MCP server with API key authentication.

## Overview

Vibe PM Agent supports two access patterns:

1. **Internal Access**: Direct Lambda ARN invocation for AWS Bedrock agents (no authentication)
2. **External Access**: Public API Gateway with API key authentication for external clients

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm installed
- Vibe PM Agent project cloned and built
- Basic understanding of AWS Lambda and API Gateway

## Step-by-Step Setup

### Step 1: Enable External Access

Set the environment variable to enable external access:

```bash
export EXTERNAL_ACCESS_ENABLED=true
```

Or add it to your shell profile for persistence:

```bash
echo 'export EXTERNAL_ACCESS_ENABLED=true' >> ~/.bashrc
source ~/.bashrc
```

### Step 2: Setup Credential Files

Run the credential setup script to create the necessary files:

```bash
# For development environment
./deployment-scripts/setup-credentials.sh dev

# For production environment
./deployment-scripts/setup-credentials.sh prod
```

This script will:
- Create `.aws/` directory structure
- Generate API key configuration template
- Create AWS credentials template
- Generate sample API keys for testing
- Update `.gitignore` to protect credential files

### Step 3: Configure API Keys

Edit the generated `.aws/api-keys.json` file:

```json
{
  "apiKeys": [
    {
      "keyId": "web-client-prod",
      "hashedKey": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
      "clientName": "Production Web Client",
      "permissions": ["all"],
      "enabled": true,
      "rateLimit": {
        "requestsPerMinute": 100,
        "requestsPerHour": 2000,
        "burstLimit": 20
      },
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "keyId": "mobile-app-prod",
      "hashedKey": "b3a8e0e1f9ab1bfe3a36f231f676f78bb30a519d2b21e6c530c0eee8ebb4a5d0",
      "clientName": "Production Mobile App",
      "permissions": ["business-analysis", "communications"],
      "enabled": true,
      "rateLimit": {
        "requestsPerMinute": 50,
        "requestsPerHour": 1000,
        "burstLimit": 10
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### API Key Configuration Options

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| `keyId` | Unique identifier for the API key | Yes | `"web-client-prod"` |
| `hashedKey` | SHA-256 hash of the actual API key | Yes | `"a665a45..."` |
| `clientName` | Human-readable name for the client | Yes | `"Production Web Client"` |
| `permissions` | Array of allowed tool categories or `["all"]` | Yes | `["business-analysis"]` |
| `enabled` | Whether the API key is active | Yes | `true` |
| `rateLimit` | Rate limiting configuration | Yes | See example above |
| `createdAt` | ISO timestamp of key creation | No | `"2024-01-15T10:00:00Z"` |
| `expiresAt` | ISO timestamp of key expiration | No | `"2024-12-31T23:59:59Z"` |

#### Generating Secure API Keys

Use OpenSSL to generate secure API keys:

```bash
# Generate a 32-byte random key
API_KEY=$(openssl rand -hex 32)
echo "Generated API Key: $API_KEY"

# Generate SHA-256 hash for storage
HASHED_KEY=$(echo -n "$API_KEY" | openssl dgst -sha256 -hex | cut -d' ' -f2)
echo "Hashed Key for config: $HASHED_KEY"
```

**Important**: Store the original API key securely and only put the hashed version in the configuration file.

### Step 4: Configure AWS Credentials

Edit the generated `.aws/credentials-{environment}` file:

```ini
[default]
aws_access_key_id = YOUR_AWS_ACCESS_KEY_ID
aws_secret_access_key = YOUR_AWS_SECRET_ACCESS_KEY
region = us-east-1

[external-api]
api_key_secret = your-secret-for-api-key-hashing
jwt_secret = your-jwt-secret-key-if-needed
oauth_client_secret = your-oauth-client-secret-if-needed
```

### Step 5: Deploy Infrastructure

Deploy the Lambda function and API Gateway:

```bash
# Deploy Lambda function first
./deployment-scripts/deploy-lambda.sh dev

# Deploy API Gateway with external access
./deployment-scripts/deploy-api-gateway.sh dev
```

The deployment script will:
- Validate credential files
- Package and deploy Lambda function
- Create API Gateway with authentication
- Setup CloudWatch monitoring
- Test both internal and external access

### Step 6: Test External Access

Test the deployed API with your API key:

```bash
# Get the API Gateway URL from deployment output
API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"

# Test health endpoint (no auth required)
curl "$API_URL/health"

# Test authenticated endpoint
curl -X POST "$API_URL/business-analysis/validate-idea" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-actual-api-key-here" \
  -d '{
    "idea": "AI-powered code review assistant",
    "criteria": ["market_viability", "technical_feasibility"]
  }'
```

## Advanced Configuration

### Custom Rate Limiting

Configure different rate limits for different clients:

```json
{
  "rateLimit": {
    "requestsPerMinute": 100,    // Maximum requests per minute
    "requestsPerHour": 2000,     // Maximum requests per hour
    "burstLimit": 20,            // Maximum burst requests
    "quotaPerMonth": 50000       // Monthly quota (optional)
  }
}
```

### Permission-Based Access Control

Restrict API keys to specific tool categories:

```json
{
  "permissions": [
    "business-analysis",         // Only business analysis tools
    "communications",           // Only communication tools
    "requirements"              // Only requirements tools
  ]
}
```

Available permission categories:
- `"all"` - Access to all tools
- `"business-analysis"` - Business intelligence tools
- `"communications"` - Executive communication tools
- `"requirements"` - PM workflow tools
- `"market-intelligence"` - Market analysis tools
- `"interview-prep"` - Interview preparation tools
- `"case-studies"` - Case study tools

### Environment-Specific Configuration

Use different configurations for different environments:

```bash
# Development environment
./deployment-scripts/setup-credentials.sh dev
EXTERNAL_ACCESS_ENABLED=true ./deployment-scripts/deploy-api-gateway.sh dev

# Production environment
./deployment-scripts/setup-credentials.sh prod
EXTERNAL_ACCESS_ENABLED=true ./deployment-scripts/deploy-api-gateway.sh prod
```

## Bedrock Agent Integration

### Internal Access Configuration

For AWS Bedrock agents, use direct Lambda ARN invocation:

```json
{
  "actionGroups": [
    {
      "actionGroupName": "VibePMAgent",
      "description": "Strategic business analysis and PM interview preparation tools",
      "actionGroupExecutor": {
        "lambda": "arn:aws:lambda:us-east-1:123456789012:function:dev-vibe-pm-agent-lambda"
      },
      "apiSchema": {
        "s3": {
          "s3BucketName": "your-bedrock-schema-bucket",
          "s3ObjectKey": "schemas/vibe-pm-agent-schema.json"
        }
      },
      "actionGroupState": "ENABLED"
    }
  ]
}
```

### Schema Configuration

Upload the API schema to S3 for Bedrock agent integration:

```bash
# Upload schema to S3
aws s3 cp bedrock-agentcore/interview-focused-schema.json \
  s3://your-bedrock-schema-bucket/schemas/vibe-pm-agent-schema.json
```

### IAM Permissions for Bedrock

Ensure your Bedrock agent has the necessary IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:dev-vibe-pm-agent-lambda"
    }
  ]
}
```

## Security Best Practices

### API Key Security

1. **Use Strong Keys**: Generate keys with at least 32 bytes of entropy
2. **Hash Storage**: Never store plain-text API keys in configuration
3. **Regular Rotation**: Rotate API keys every 90 days
4. **Environment Separation**: Use different keys for dev/staging/prod
5. **Principle of Least Privilege**: Grant minimal required permissions

### Credential File Security

1. **File Permissions**: Set restrictive permissions on credential files
   ```bash
   chmod 600 .aws/credentials-*
   chmod 600 .aws/api-keys.json
   ```

2. **Version Control**: Ensure `.aws/*` is in `.gitignore`
   ```gitignore
   # AWS credential files (keep private)
   .aws/*
   !.aws/.gitkeep
   ```

3. **Backup Strategy**: Securely backup credential files
4. **Access Logging**: Monitor access to credential files

### Network Security

1. **HTTPS Only**: Always use HTTPS for external API calls
2. **CORS Configuration**: Restrict CORS to trusted domains
3. **IP Whitelisting**: Consider IP-based restrictions for sensitive clients
4. **Rate Limiting**: Implement appropriate rate limits

### Monitoring and Alerting

1. **Authentication Failures**: Monitor failed authentication attempts
2. **Rate Limit Violations**: Alert on rate limit breaches
3. **Unusual Patterns**: Detect anomalous usage patterns
4. **Performance Monitoring**: Track response times and error rates

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

**Symptom**: `401 Unauthorized` responses

**Solutions**:
- Verify API key is included in `X-API-Key` header
- Check that the API key hash matches the configuration
- Ensure the API key is enabled in the configuration
- Verify the API key hasn't expired

#### 2. Permission Denied

**Symptom**: `403 Forbidden` responses

**Solutions**:
- Check the `permissions` array in API key configuration
- Verify the requested tool is allowed for the API key
- Ensure rate limits haven't been exceeded

#### 3. CORS Errors

**Symptom**: Browser CORS errors

**Solutions**:
- Verify CORS configuration in API Gateway
- Check that your domain is allowed in CORS settings
- Ensure preflight OPTIONS requests are handled

#### 4. Internal Access Issues

**Symptom**: Bedrock agent can't invoke Lambda

**Solutions**:
- Verify Lambda ARN is correct in Bedrock configuration
- Check IAM permissions for Bedrock agent role
- Ensure Lambda function is deployed and active

### Debugging Tools

#### Test API Key Authentication

```bash
# Test with curl
curl -v -X POST "$API_URL/business-analysis/validate-idea" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"idea": "test", "criteria": ["feasibility"]}'
```

#### Check CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/dev-vibe-pm-agent-lambda --follow

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs_$API_ID/dev --follow
```

#### Validate Configuration Files

```bash
# Validate JSON format
python3 -m json.tool .aws/api-keys.json

# Check file permissions
ls -la .aws/
```

## Production Deployment

### Production Checklist

- [ ] Use strong, unique API keys for production
- [ ] Configure appropriate rate limits
- [ ] Set up monitoring and alerting
- [ ] Enable CloudWatch logging
- [ ] Configure backup and disaster recovery
- [ ] Document API keys and access procedures
- [ ] Set up key rotation schedule
- [ ] Configure CORS for production domains only

### Scaling Considerations

1. **Lambda Concurrency**: Configure reserved concurrency for predictable performance
2. **API Gateway Throttling**: Set appropriate throttling limits
3. **CloudWatch Monitoring**: Set up comprehensive monitoring
4. **Cost Optimization**: Monitor and optimize AWS costs

### Maintenance

1. **Regular Updates**: Keep dependencies and runtime updated
2. **Security Patches**: Apply security updates promptly
3. **Performance Monitoring**: Continuously monitor performance metrics
4. **Capacity Planning**: Plan for growth and scaling needs

## Support

For additional support:

1. Check the [main README](../README.md) for general setup
2. Review [troubleshooting documentation](../TROUBLESHOOTING.md)
3. Check CloudWatch logs for detailed error information
4. Open an issue on the GitHub repository

## Examples

### Complete Setup Example

```bash
# 1. Enable external access
export EXTERNAL_ACCESS_ENABLED=true

# 2. Setup credentials
./deployment-scripts/setup-credentials.sh prod

# 3. Edit API keys (use your actual hashed keys)
vim .aws/api-keys.json

# 4. Deploy infrastructure
./deployment-scripts/deploy-lambda.sh prod
./deployment-scripts/deploy-api-gateway.sh prod

# 5. Test external access
API_URL=$(aws cloudformation describe-stacks \
  --stack-name vibe-pm-agent-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text)

curl -X POST "$API_URL/business-analysis/analyze-opportunity" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-production-api-key" \
  -d '{
    "idea": "AI-powered customer support automation",
    "market_context": {
      "industry": "saas",
      "budget_range": "large"
    }
  }'
```

This completes the external access setup for Vibe PM Agent. The system now supports both internal Bedrock agent access and secure external API access with comprehensive authentication and monitoring.