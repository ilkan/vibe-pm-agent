# Multi-Agent Bedrock Configuration

This directory contains scripts to configure AWS Bedrock agents for multi-agent collaboration, enabling sophisticated agent-to-agent communication for comprehensive business analysis workflows.

## 🏗️ Architecture Overview

### Agent Roles

1. **Supervisor Agent** (`ULX1RJGKCR` - Executive Communications Agent)
   - Orchestrates multi-agent workflows
   - Routes requests to appropriate specialists
   - Synthesizes responses from collaborator agents
   - Coordinates complex business analysis tasks

2. **Collaborator Agents**:
   - **Business Strategy Specialist** (`IBQRX8MZJJ`): Market analysis, competitive intelligence, strategic alignment
   - **Product Development Specialist** (`CEW45LTT2P`): Requirements, design options, implementation planning
   - **Case Study Coaching Specialist** (`PDZPQTNLYH`): Business case analysis, strategic coaching, problem-solving

### Multi-Agent Workflows

- **Sequential Processing**: Strategy → Product → Communications → Coaching
- **Parallel Analysis**: All agents analyze simultaneously for comprehensive insights
- **Iterative Refinement**: Multiple rounds of analysis and improvement
- **Context Sharing**: Agents build on each other's insights

## 🚀 Setup Instructions

### Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js** installed (v16+ recommended)
3. **AWS Bedrock agents** already created with the specified IDs
4. **Agent aliases** created and in PREPARED status

### Required AWS Permissions

Your IAM role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:GetAgent",
        "bedrock:UpdateAgent",
        "bedrock:ListAgentAliases",
        "bedrock:AssociateAgentCollaborator",
        "bedrock:PrepareAgent"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step-by-Step Setup

#### 1. Test Current Configuration
```bash
# Validate that all agents exist and have proper aliases
node scripts/test-multi-agent-config.js
```

This will check:
- ✅ All agents exist and are accessible
- ✅ All agents have aliases in PREPARED status
- ✅ Configuration is ready for multi-agent setup

#### 2. Run Multi-Agent Configuration
```bash
# Configure all agents for multi-agent collaboration
node scripts/update-bedrock-agents.js
```

This will:
1. **Update Individual Agents**: Enhance each agent with collaboration-aware instructions
2. **Configure Supervisor**: Set up the supervisor agent with orchestration capabilities
3. **Associate Collaborators**: Link all collaborator agents to the supervisor

#### 3. Verify Setup
After successful configuration, you should see:
```
🎉 Multi-Agent Bedrock configuration completed successfully!

🚀 Your agents are now ready for multi-agent collaboration!
   Supervisor Agent: ULX1RJGKCR
   Collaborator Agents: IBQRX8MZJJ, CEW45LTT2P, PDZPQTNLYH
```

## 🧪 Testing Multi-Agent Collaboration

### Test Scenarios

#### 1. Complete Product Development Pipeline
```json
{
  "sessionId": "pipeline-test-001",
  "inputText": "Develop a comprehensive analysis for an AI-powered code review feature targeting enterprise development teams. Include market opportunity, technical requirements, business case, and implementation strategy."
}
```

**Expected Flow**:
1. **Business Strategy Agent**: Analyzes market opportunity and competitive landscape
2. **Product Development Agent**: Generates technical requirements and design options
3. **Executive Communications Agent**: Creates business case and stakeholder materials
4. **Case Study Coaching Agent**: Provides implementation guidance and risk assessment

#### 2. Investment Decision Analysis
```json
{
  "sessionId": "investment-test-001",
  "inputText": "Evaluate a $5M investment in AI infrastructure expansion. Provide comprehensive analysis from strategic, technical, financial, and implementation perspectives."
}
```

**Expected Flow**: All agents analyze in parallel, supervisor synthesizes comprehensive investment recommendation.

#### 3. Competitive Response Strategy
```json
{
  "sessionId": "competitive-test-001",
  "inputText": "Major competitor launched similar AI assistant feature. Develop rapid response strategy including market impact assessment, product differentiation, and go-to-market approach."
}
```

**Expected Flow**: Sequential analysis with iterative refinement between agents.

### Testing in AWS Console

1. **Navigate to Bedrock Console**:
   ```
   AWS Console → Amazon Bedrock → Agents → Test
   ```

2. **Select Supervisor Agent**: `ULX1RJGKCR` (Executive-Communications-Agent)

3. **Run Test Scenarios**: Use the JSON examples above

4. **Monitor Agent Interactions**: Check CloudWatch logs for inter-agent communication

## 📊 Configuration Details

### Agent Configurations

| Agent ID | Role | Collaborator Name | Primary Capabilities |
|----------|------|-------------------|---------------------|
| `IBQRX8MZJJ` | Business Strategy | Business-Strategy-Specialist | Market analysis, competitive intelligence, strategic alignment |
| `CEW45LTT2P` | Product Development | Product-Development-Specialist | Requirements, design options, technical planning |
| `ULX1RJGKCR` | Supervisor | Executive-Communications-Specialist | Orchestration, business cases, stakeholder communications |
| `PDZPQTNLYH` | Case Study Coaching | Case-Study-Coaching-Specialist | Business case analysis, strategic coaching |

### Collaboration Instructions

Each collaborator agent has specific instructions defining:
- **Domain Expertise**: What types of tasks they handle
- **Collaboration Scope**: How they work with other agents
- **Output Format**: Expected response structure
- **Context Sharing**: Whether conversation history is shared

### Foundation Models

- **Supervisor Agent**: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- **All Collaborator Agents**: `anthropic.claude-3-5-sonnet-20241022-v2:0`

## 🔧 Troubleshooting

### Common Issues

#### 1. Agent Not Found
```
❌ Agent XXXXXXXXXX not found
```
**Solution**: Verify the agent ID exists in your AWS account and region.

#### 2. No Alias Available
```
❌ No alias found for agent XXXXXXXXXX
```
**Solution**: Create an alias for the agent and ensure it's in PREPARED status.

#### 3. Permission Denied
```
❌ AccessDeniedException: User is not authorized
```
**Solution**: Add required Bedrock permissions to your IAM role.

#### 4. Collaboration Already Exists
```
❌ ConflictException: This collaborator may already be associated
```
**Solution**: This is expected if re-running the script. The association already exists.

### Validation Commands

```bash
# Check agent status
aws bedrock-agent get-agent --agent-id XXXXXXXXXX --region us-east-1

# List agent aliases
aws bedrock-agent list-agent-aliases --agent-id XXXXXXXXXX --region us-east-1

# Check collaborator associations
aws bedrock-agent list-agent-collaborators --agent-id ULX1RJGKCR --agent-version DRAFT --region us-east-1
```

## 🎯 Next Steps

After successful setup:

1. **Test Individual Workflows**: Validate each agent works correctly
2. **Test Multi-Agent Scenarios**: Run complex workflows requiring multiple agents
3. **Monitor Performance**: Check response times and accuracy
4. **Iterate and Improve**: Refine collaboration instructions based on results

## 📚 Additional Resources

- [AWS Bedrock Multi-Agent Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent-collaboration.html)
- [Agent Collaboration Best Practices](https://docs.aws.amazon.com/bedrock/latest/userguide/create-multi-agent-collaboration.html)
- [Bedrock Agent API Reference](https://docs.aws.amazon.com/bedrock/latest/APIReference/Welcome.html)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs for detailed error information
3. Validate permissions and agent configurations
4. Test individual agents before multi-agent workflows