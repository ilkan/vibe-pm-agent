# Vibe PM Agent - Multi-Agent Architecture

## Overview

This directory contains the complete multi-agent architecture for the Vibe PM Agent system using Amazon Bedrock. The system distributes 32 MCP tools across 4 specialized agents, each handling 8 tools maximum for optimal performance and maintainability.

## Architecture

### 🎯 Agent Distribution

| Agent | Specialization | Tools | Purpose |
|-------|---------------|-------|---------|
| **Business Strategy Agent** | Market Analysis & Strategy | 8 | Market opportunity, competitive analysis, business cases |
| **Product Development Agent** | Requirements & Development | 8 | Requirements, design options, resource optimization |
| **Executive Communications Agent** | Stakeholder Communications | 8 | Executive documents, presentations, company insights |
| **Interview Coaching Agent** | PM Interview Preparation | 8 | Interview practice, case studies, personalized coaching |

### 🔧 Tool Distribution

**Business Strategy Agent (8 tools):**
- `analyze_business_opportunity` - Market opportunity assessment
- `generate_business_case` - ROI analysis and business justification
- `assess_strategic_alignment` - Company strategy alignment scoring
- `validate_market_timing` - Market timing signals analysis
- `validate_idea_quick` - Rapid go/no-go validation
- `analyze_competitor_landscape` - Competitive positioning analysis
- `calculate_market_sizing` - TAM/SAM/SOM calculations
- `monitor_market_conditions` - Real-time market intelligence

**Product Development Agent (8 tools):**
- `generate_requirements` - Comprehensive requirements documentation
- `generate_design_options` - Multiple architectural approaches
- `generate_task_plan` - Implementation task breakdown
- `optimize_resource_allocation` - Resource planning and optimization
- `optimize_intent` - User intent clarification and optimization
- `analyze_workflow` - Workflow analysis and optimization
- `enhance_citations` - Content enhancement with authoritative sources
- `validate_and_audit_citations` - Citation accuracy validation

**Executive Communications Agent (8 tools):**
- `create_stakeholder_communication` - Role-specific communications
- `generate_management_onepager` - Executive one-pagers
- `generate_pr_faq` - Amazon Working Backwards PR-FAQ
- `get_consulting_summary` - Consulting-style executive summaries
- `generate_roi_analysis` - Financial projections and ROI modeling
- `get_company_interview_insights` - Company-specific insights
- `customize_preparation_for_company` - Tailored preparation plans
- `get_company_case_scenarios` - Company-specific case studies

**Interview Coaching Agent (8 tools):**
- `start_interview_preparation` - Personalized interview coaching sessions
- `generate_interview_question` - Dynamic question generation
- `evaluate_interview_response` - Framework-based response evaluation
- `get_interview_feedback` - Comprehensive performance feedback
- `start_case_study` - Interactive case study practice
- `get_case_guidance` - Real-time case study guidance
- `evaluate_case_approach` - Case study methodology evaluation
- `complete_case_study` - Performance analytics and recommendations

## Quick Start

### 1. Prerequisites

```bash
# Install required tools
brew install awscli jq node

# Configure AWS credentials
aws configure

# Verify Node.js version (18+ required)
node --version
```

### 2. Configuration

Update the configuration in `deploy-multi-agent.sh`:

```bash
# Edit these values in deploy-multi-agent.sh
AWS_ACCOUNT_ID="123456789012"  # Your AWS account ID
AWS_REGION="us-east-1"         # Your preferred region
LAMBDA_FUNCTION_NAME="vibe-pm-agent-lambda"
BEDROCK_ROLE_NAME="AmazonBedrockExecutionRoleForAgents_vibe-pm"
```

### 3. Deploy Everything

```bash
# Full deployment (recommended)
./deploy-multi-agent.sh

# Or deploy components separately
./deploy-multi-agent.sh lambda-only    # Deploy Lambda function only
./deploy-multi-agent.sh agents-only    # Create Bedrock agents only
./deploy-multi-agent.sh test-only      # Run tests only
```

### 4. Test the System

```bash
# Test all agents
./test-agents.sh

# Comprehensive testing
node comprehensive-test.js

# Check results
cat test-results.json
```

## Files Overview

### Core Files
- `agent-architecture.md` - Detailed architecture documentation
- `agent-config.json` - Agent configuration and settings
- `agent-orchestrator.ts` - Multi-agent orchestration logic
- `agent-registry.csv` - Generated agent IDs (after deployment)

### Deployment Scripts
- `deploy-multi-agent.sh` - Complete deployment automation
- `create-agents.sh` - Bedrock agent creation script
- `test-agents.sh` - Basic agent testing script
- `comprehensive-test.js` - Full test suite with scenarios

### Generated Files (after deployment)
- `agent-registry.csv` - Agent IDs and metadata
- `test-results.json` - Comprehensive test results
- `*.bak` - Backup files from configuration updates

## Usage Examples

### Direct Agent Invocation

```bash
# Test Business Strategy Agent
aws bedrock-agent-runtime invoke-agent \
  --agent-id "YOUR_BUSINESS_AGENT_ID" \
  --agent-alias-id "TSTALIASID" \
  --session-id "test-session-123" \
  --input-text "Analyze the market opportunity for AI-powered project management tools"
```

### Using the Orchestrator

```typescript
import { createAgentOrchestrator } from './agent-orchestrator';

const orchestrator = createAgentOrchestrator('us-east-1');

const response = await orchestrator.orchestrate({
  userIntent: "Create a comprehensive business case with executive presentation",
  requiresMultiAgent: true
});
```

### Lambda Integration

```javascript
// Direct Lambda invocation for internal use
const payload = {
  toolName: "analyze_business_opportunity",
  toolArgs: {
    idea: "AI-powered customer service chatbot",
    market_context: {
      industry: "SaaS",
      competition: "High",
      timeline: "6 months",
      budget_range: "medium"
    }
  }
};

const result = await lambda.invoke({
  FunctionName: "vibe-pm-agent-lambda",
  Payload: JSON.stringify(payload)
}).promise();
```

## Monitoring & Troubleshooting

### CloudWatch Logs

```bash
# Monitor agent execution
aws logs tail /aws/lambda/vibe-pm-agent-lambda --follow

# Check Bedrock agent logs
aws logs describe-log-groups --log-group-name-prefix "/aws/bedrock"
```

### Performance Metrics

The system automatically logs performance metrics:
- Request count by agent and tool
- Execution time distribution
- Success/failure rates
- Cross-agent collaboration patterns

### Common Issues

1. **Agent ID not configured**: Update `agent-config.json` with actual agent IDs
2. **Permission denied**: Verify Bedrock execution role has Lambda invoke permissions
3. **Timeout errors**: Increase timeout in agent configuration
4. **Tool not found**: Check tool distribution in agent action groups

## Development

### Adding New Tools

1. Add tool to appropriate agent's action group schema
2. Update `agent-config.json` with new tool name
3. Implement tool handler in Lambda function
4. Update orchestrator routing logic
5. Add test cases to `comprehensive-test.js`

### Modifying Agent Behavior

1. Update agent instructions in `create-agents.sh`
2. Modify action group schemas as needed
3. Redeploy agents: `./deploy-multi-agent.sh agents-only`
4. Test changes: `./deploy-multi-agent.sh test-only`

### Cross-Agent Workflows

The orchestrator supports complex workflows spanning multiple agents:

```typescript
// Example: End-to-end product launch workflow
const workflow = await orchestrator.orchestrate({
  userIntent: "Complete product launch analysis from market research to executive presentation",
  requiresMultiAgent: true,
  context: {
    product: "AI Analytics Dashboard",
    timeline: "Q2 2024",
    budget: "$2M"
  }
});
```

## Security Considerations

- All agents use IAM roles with least-privilege access
- API keys for external access are hashed and stored securely
- Cross-agent communication is logged for audit trails
- Sensitive data is not logged in CloudWatch

## Cost Optimization

- Agents are configured with appropriate timeout limits
- Caching is enabled for repeated requests
- Session management prevents unnecessary agent invocations
- Performance metrics help identify optimization opportunities

## Support

For issues or questions:
1. Check CloudWatch logs for detailed error messages
2. Review test results in `test-results.json`
3. Verify configuration in `agent-config.json`
4. Run diagnostic tests: `node comprehensive-test.js`

## Next Steps

After successful deployment:
1. Integrate with your application using the Lambda ARN
2. Set up monitoring dashboards in CloudWatch
3. Configure alerts for agent failures or performance issues
4. Implement custom workflows using the orchestrator
5. Scale agent resources based on usage patterns