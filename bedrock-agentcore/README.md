# Vibe PM Agent - AWS Bedrock AgentCore Deployment

This directory contains everything needed to deploy the Vibe PM Agent to AWS Bedrock AgentCore, transforming your existing MCP server into a scalable, production-ready AI agent.

## Overview

The deployment transforms your Node.js/TypeScript MCP server (with 32 PM-focused tools) into a Bedrock AgentCore-compatible agent that can be invoked through AWS Bedrock services while maintaining all existing functionality.

### Key Features

- **32 PM Tools**: All existing business intelligence and interview preparation tools
- **Bedrock Integration**: Native integration with Bedrock models and services
- **Production Ready**: Auto-scaling, monitoring, logging, and enterprise features
- **MCP Compatibility**: Maintains compatibility with existing MCP clients
- **Cost Effective**: Pay-per-use model with Bedrock

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Clients   │───▶│  Bedrock         │───▶│   Vibe PM       │
│   (Kiro, etc.)  │    │  AgentCore       │    │   Agent         │
└─────────────────┘    │                  │    │                 │
                       │  - Auto-scaling  │    │  - 32 PM Tools  │
┌─────────────────┐    │  - Load balancer │    │  - Node.js MCP  │
│  Direct API     │───▶│  - Monitoring    │───▶│  - Bedrock AI   │
│  Integration    │    │  - Logging       │    │  - Business     │
└─────────────────┘    └──────────────────┘    │    Intelligence │
                                              └─────────────────┘
```

## Quick Start

### Prerequisites

1. **AWS Account** with Bedrock access
2. **AWS CLI** configured with appropriate credentials
3. **Python 3.9+** for AgentCore runtime
4. **Node.js 18+** for MCP server
5. **Vibe PM Agent** source code

### One-Command Deployment

```bash
# From the bedrock-agentcore directory
./deployment-scripts/deploy.sh all
```

This will:
1. ✅ Check all prerequisites
2. ✅ Build the agent components
3. ✅ Deploy AWS infrastructure (IAM, CloudWatch, etc.)
4. ✅ Deploy agent to Bedrock AgentCore
5. ✅ Validate the deployment

## Manual Deployment Steps

### Step 1: Prerequisites Check

```bash
./deployment-scripts/deploy.sh prerequisites
```

### Step 2: Build Agent

```bash
./deployment-scripts/deploy.sh build
```

### Step 3: Deploy Infrastructure

```bash
./deployment-scripts/deploy.sh infrastructure
```

### Step 4: Deploy Agent

```bash
./deployment-scripts/deploy.sh deploy
```

### Step 5: Validate Deployment

```bash
./deployment-scripts/deploy.sh validate
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Environment name | `production` | No |
| `AWS_REGION` | AWS region | `us-east-1` | No |
| `BEDROCK_REGION` | Bedrock region | `us-east-1` | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |

### Deployment Configuration

Edit `deployment-config.json` to customize:

```json
{
  "agentName": "vibe-pm-agent",
  "deployment": {
    "region": "us-east-1",
    "autoScaling": {
      "enabled": true,
      "minInstances": 1,
      "maxInstances": 10
    }
  },
  "tools": {
    "autoApprove": ["validate_idea_quick", "optimize_intent"]
  }
}
```

## Testing Your Deployment

### Test Individual Tools

```bash
# Test business opportunity analysis
aws bedrock-agent invoke \
  --agent-id your-agent-id \
  --input '{"tool_name": "analyze_business_opportunity", "tool_args": {"idea": "AI-powered project management"}}'

# Test market timing validation
aws bedrock-agent invoke \
  --agent-id your-agent-id \
  --input '{"tool_name": "validate_market_timing", "tool_args": {"feature_idea": "new feature"}}'
```

### Test with MCP Clients

Your deployed agent remains compatible with existing MCP clients:

```bash
# Update your MCP client configuration to point to the Bedrock agent
# The agent will handle MCP protocol requests through Bedrock
```

## Monitoring & Operations

### CloudWatch Dashboards

The deployment automatically creates CloudWatch monitoring:

- **Error Rate**: Monitor tool call failures
- **Latency**: Track response times
- **Request Count**: Monitor usage patterns
- **Custom Metrics**: Tool-specific performance metrics

### Logs

View agent logs in CloudWatch:

```bash
aws logs tail /aws/bedrock/agentcore/vibe-pm-agent --follow
```

### Alarms

Pre-configured alarms for:
- Error rate > 5%
- Latency > 3 seconds
- Custom thresholds based on your requirements

## Troubleshooting

### Common Issues

1. **Agent Not Responding**
   ```bash
   # Check CloudWatch logs
   aws logs describe-log-groups --log-group-name-prefix vibe-pm-agent

   # Verify agent status
   aws bedrock-agent get-agent --agent-id your-agent-id
   ```

2. **Tool Call Failures**
   ```bash
   # Check IAM permissions
   aws iam get-role --role-name VibePMAgentCoreRole-production

   # Verify Bedrock model access
   aws bedrock list-foundation-models
   ```

3. **Performance Issues**
   ```bash
   # Check auto-scaling configuration
   aws application-autoscaling describe-scalable-targets --service-namespace bedrock

   # Monitor CloudWatch metrics
   aws cloudwatch get-metric-statistics --namespace AWS/Bedrock/AgentCore
   ```

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=DEBUG
./deployment-scripts/deploy.sh deploy
```

## Cost Optimization

### Monitoring Costs

- **CloudWatch**: ~$0.30/GB logs ingested
- **Bedrock**: Pay-per-use model for tool calls
- **Auto-scaling**: Minimal cost when idle

### Optimization Tips

1. **Right-size instances** based on usage patterns
2. **Use auto-scaling** to handle traffic spikes
3. **Monitor and alert** on cost thresholds
4. **Archive old logs** to reduce storage costs

## Security Considerations

### IAM Permissions

The deployment creates least-privilege IAM roles:

- **Bedrock Access**: Model invocation and agent management
- **CloudWatch**: Logging and monitoring
- **VPC Access**: Optional network isolation

### Network Security

- **VPC Deployment**: Optional VPC isolation
- **Private Endpoints**: Secure AWS service communication
- **Encryption**: All data encrypted in transit and at rest

## Advanced Configuration

### Custom Tool Registration

Add new tools by extending `pm_agent.py`:

```python
def register_custom_tool(self, tool_name: str, schema: Dict, handler: Callable):
    """Register additional custom tools"""
    self.app.register_tool(Tool(
        name=tool_name,
        description=f"Custom tool: {tool_name}",
        input_schema=schema,
        handler=handler
    ))
```

### Environment-Specific Settings

Create environment-specific configurations:

```bash
# Development
ENVIRONMENT=dev ./deployment-scripts/deploy.sh all

# Staging
ENVIRONMENT=staging ./deployment-scripts/deploy.sh all

# Production
ENVIRONMENT=prod ./deployment-scripts/deploy.sh all
```

## Support & Maintenance

### Regular Tasks

1. **Monitor Performance**: Review CloudWatch metrics weekly
2. **Update Dependencies**: Keep Bedrock AgentCore libraries current
3. **Security Updates**: Apply AWS security patches
4. **Cost Review**: Monitor and optimize costs monthly

### Getting Help

1. **AWS Documentation**: [Bedrock AgentCore Guide](https://docs.aws.amazon.com/bedrock-agentcore/)
2. **CloudWatch Logs**: Check `/aws/bedrock/agentcore/vibe-pm-agent`
3. **AWS Support**: Use your AWS support plan for issues

## Next Steps

After successful deployment:

1. **Test all 32 PM tools** through Bedrock interface
2. **Integrate with applications** using Bedrock API
3. **Set up monitoring dashboards** for key metrics
4. **Configure alerts** for critical issues
5. **Plan for scaling** based on usage patterns

## API Reference

### Bedrock Agent Invocation

```python
import boto3

bedrock_agent = boto3.client('bedrock-agent')

response = bedrock_agent.invoke_agent(
    agentId='your-agent-id',
    agentAliasId='your-alias-id',
    inputText='Call analyze_business_opportunity tool',
    sessionId='unique-session-id'
)
```

### MCP Client Integration

```json
{
  "mcpServers": {
    "vibe-pm-agent": {
      "type": "bedrock-agent",
      "agentId": "your-agent-id",
      "region": "us-east-1"
    }
  }
}
```

---

**Deployment Status**: Ready for production use
**Tools Available**: 32 PM-focused tools
**Scalability**: Auto-scaling enabled
**Monitoring**: CloudWatch integration active
