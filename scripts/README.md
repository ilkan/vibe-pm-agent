# NVIDIA NIM Agentic Platform - Deployment Scripts

This directory contains comprehensive deployment, validation, and rollback scripts for the NVIDIA NIM Agentic Platform.

## Scripts Overview

### 🚀 `deployment-pipeline.sh` - Main Orchestrator
The primary deployment pipeline orchestrator that manages the entire deployment lifecycle.

**Usage:**
```bash
# Full deployment pipeline (recommended)
./scripts/deployment-pipeline.sh full --env production --mode hybrid

# Deploy-only (skip validation)
./scripts/deployment-pipeline.sh deploy --env staging --auto-approve

# Validate existing deployment
./scripts/deployment-pipeline.sh validate --env production

# Rollback to previous deployment
./scripts/deployment-pipeline.sh rollback --env production

# Show pipeline status
./scripts/deployment-pipeline.sh status
```

**Features:**
- Complete deployment orchestration
- Approval gates for production deployments
- Automatic rollback on failure
- Slack/webhook notifications
- Comprehensive logging and reporting

### 🏗️ `deploy-production.sh` - Infrastructure Deployment
Handles the actual deployment of infrastructure and application components.

**Usage:**
```bash
# Deploy infrastructure
./scripts/deploy-production.sh deploy --mode hybrid --env production

# Show deployment status
./scripts/deploy-production.sh status

# Destroy infrastructure (use with caution)
./scripts/deploy-production.sh destroy
```

**Features:**
- AWS CDK infrastructure deployment
- Kubernetes manifest deployment
- Lambda function updates
- Automatic backup creation
- Health checks and validation

### ✅ `validate-deployment.sh` - Comprehensive Validation
Performs thorough validation of deployed infrastructure and applications.

**Usage:**
```bash
# Run full validation
./scripts/validate-deployment.sh --env production --mode hybrid

# Detailed validation output
./scripts/validate-deployment.sh --detailed --timeout 600

# Validate specific environment
./scripts/validate-deployment.sh --env staging --region us-east-1
```

**Features:**
- CloudFormation stack validation
- EKS cluster and pod health checks
- SageMaker endpoint validation
- Lambda function testing
- Application functionality tests
- Performance benchmarking
- Comprehensive reporting

### ⏪ `rollback-deployment.sh` - Rollback and Recovery
Provides automated rollback capabilities with multiple recovery options.

**Usage:**
```bash
# Rollback to latest backup
./scripts/rollback-deployment.sh --env production

# Rollback to specific backup
./scripts/rollback-deployment.sh --backup-id 20241031_143022 --env production

# List available backups
./scripts/rollback-deployment.sh --list-backups

# Dry run rollback
./scripts/rollback-deployment.sh --dry-run --backup-id latest
```

**Features:**
- Automated backup discovery
- CloudFormation stack rollback
- Kubernetes resource restoration
- Lambda function version rollback
- Pre-rollback backup creation
- Rollback validation

### 🏥 `health-check.sh` - Continuous Monitoring
Provides continuous health monitoring and alerting capabilities.

**Usage:**
```bash
# Single health check
./scripts/health-check.sh check --env production

# Continuous monitoring
./scripts/health-check.sh monitor --interval 300 --webhook https://hooks.slack.com/...

# Show current health status
./scripts/health-check.sh status
```

**Features:**
- AWS service health monitoring
- Application health validation
- Continuous monitoring mode
- Alert thresholds and notifications
- Webhook integration for alerts
- Comprehensive health reporting

## Deployment Modes

### EKS Mode (`--mode eks`)
- Deploys NVIDIA NIM on Amazon EKS
- Uses Kubernetes for container orchestration
- Supports GPU node pools and auto-scaling
- Includes Istio service mesh

### SageMaker Mode (`--mode sagemaker`)
- Deploys models as SageMaker endpoints
- Managed inference with auto-scaling
- A/B testing capabilities
- Direct integration with Bedrock

### Hybrid Mode (`--mode hybrid`) - **Recommended**
- Combines EKS and SageMaker deployment
- Maximum flexibility and redundancy
- Load balancing between inference methods
- Optimal for production environments

## Environment Configuration

### Development
```bash
export ENVIRONMENT=development
export DEPLOYMENT_MODE=hybrid
export AWS_REGION=us-west-2
export AUTO_APPROVE=true
```

### Staging
```bash
export ENVIRONMENT=staging
export DEPLOYMENT_MODE=hybrid
export AWS_REGION=us-west-2
export SKIP_VALIDATION=false
```

### Production
```bash
export ENVIRONMENT=production
export DEPLOYMENT_MODE=hybrid
export AWS_REGION=us-west-2
export AUTO_APPROVE=false
export ROLLBACK_ON_FAILURE=true
```

## Prerequisites

### Required Tools
- AWS CLI v2.x
- AWS CDK v2.x
- Node.js 18+
- kubectl (for EKS deployments)
- jq (for JSON processing)
- curl (for API testing)

### AWS Permissions
The deployment requires the following AWS permissions:
- CloudFormation: Full access
- EKS: Full access (for EKS mode)
- SageMaker: Full access (for SageMaker mode)
- Lambda: Full access
- IAM: Role and policy management
- VPC: Network resource management
- S3: Bucket and object management

### Installation
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install AWS CDK
npm install -g aws-cdk

# Install kubectl (for EKS)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install jq
sudo apt-get install jq  # Ubuntu/Debian
# or
brew install jq  # macOS
```

## Quick Start

### 1. Configure AWS Credentials
```bash
aws configure
# or
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-west-2
```

### 2. Run Full Deployment Pipeline
```bash
# Production deployment with approval gates
./scripts/deployment-pipeline.sh full --env production --mode hybrid

# Staging deployment with auto-approval
./scripts/deployment-pipeline.sh full --env staging --auto-approve
```

### 3. Monitor Deployment Health
```bash
# Start continuous monitoring
./scripts/health-check.sh monitor --interval 300 --webhook $SLACK_WEBHOOK_URL
```

## Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Required
```bash
# Error: CDK not bootstrapped
# Solution:
cdk bootstrap aws://ACCOUNT-ID/REGION
```

#### 2. kubectl Connection Issues
```bash
# Error: kubectl cannot connect
# Solution:
aws eks update-kubeconfig --region us-west-2 --name nvidia-nim-cluster
```

#### 3. Lambda Function Not Found
```bash
# Error: Lambda function does not exist
# Solution: Check if the function was created in the correct region
aws lambda list-functions --region us-west-2
```

#### 4. SageMaker Endpoint Not Ready
```bash
# Error: Endpoint is not InService
# Solution: Check endpoint status and wait for deployment
aws sagemaker describe-endpoint --endpoint-name your-endpoint-name
```

### Log Locations
- Pipeline logs: `logs/pipeline/`
- Deployment logs: `logs/deployment/`
- Validation logs: `logs/validation/`
- Health check logs: `logs/health/`
- Rollback logs: `logs/rollback/`

### Getting Help
```bash
# Show help for any script
./scripts/deployment-pipeline.sh help
./scripts/deploy-production.sh --help
./scripts/validate-deployment.sh --help
./scripts/rollback-deployment.sh --help
./scripts/health-check.sh --help
```

## Best Practices

### 1. Always Use the Pipeline Orchestrator
Use `deployment-pipeline.sh` instead of individual scripts for production deployments.

### 2. Test in Staging First
Always deploy to staging environment before production:
```bash
./scripts/deployment-pipeline.sh full --env staging --auto-approve
./scripts/deployment-pipeline.sh full --env production
```

### 3. Monitor Continuously
Set up continuous health monitoring for production:
```bash
./scripts/health-check.sh monitor --interval 300 --webhook $WEBHOOK_URL &
```

### 4. Regular Backups
The deployment scripts automatically create backups, but verify they exist:
```bash
./scripts/rollback-deployment.sh --list-backups
```

### 5. Use Notifications
Configure Slack or webhook notifications for deployment events:
```bash
export SLACK_WEBHOOK=https://hooks.slack.com/services/...
./scripts/deployment-pipeline.sh full --slack-webhook $SLACK_WEBHOOK
```

## Security Considerations

### 1. Credential Management
- Use IAM roles instead of access keys when possible
- Store credentials securely (AWS Secrets Manager, etc.)
- Rotate credentials regularly

### 2. Network Security
- Deploy in private subnets when possible
- Use security groups to restrict access
- Enable VPC Flow Logs for monitoring

### 3. Encryption
- Enable encryption at rest for all storage
- Use TLS for all communications
- Encrypt sensitive environment variables

### 4. Audit Logging
- Enable CloudTrail for API logging
- Monitor deployment logs regularly
- Set up alerts for suspicious activities

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in the `logs/` directory
3. Run validation scripts to identify issues
4. Check AWS CloudFormation console for stack status
5. Verify AWS service limits and quotas

## Contributing

When adding new deployment features:
1. Follow the existing script patterns
2. Add comprehensive error handling
3. Include logging and monitoring
4. Update this README
5. Test in all deployment modes
6. Add validation checks