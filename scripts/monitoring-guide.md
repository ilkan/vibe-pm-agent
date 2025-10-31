# Multi-Agent Bedrock Monitoring Guide

## 🎯 Overview

This guide provides step-by-step instructions for testing your multi-agent Bedrock setup and monitoring agent-to-agent communication, tool calls, and workflow orchestration.

## 🚀 Quick Start Testing

### 1. Run Complete Test Suite
```bash
# Run all test cases with comprehensive monitoring
node scripts/test-multi-agent-console.js

# Expected output:
# 🚀 Starting Multi-Agent Bedrock Testing Suite
# 🧪 Running Test Case: TC001 - Simple Agent Invocation
# ✅ Response received in 3247ms
# 📊 Found 12 log events in /aws/bedrock/agent/IBQRX8MZJJ
# ...
```

### 2. Run Specific Test Cases
```bash
# Test simple agent invocation
node scripts/test-multi-agent-console.js TC001

# Test multi-agent workflow
node scripts/test-multi-agent-console.js TC002

# Test agent-to-agent communication
node scripts/test-multi-agent-console.js TC003
```

## 📊 Test Cases Explained

### TC001: Simple Agent Invocation
**Purpose**: Verify basic agent functionality without multi-agent collaboration
**What to Monitor**:
- Agent startup and initialization
- Tool discovery and loading
- Single response generation
- Basic error handling

**Expected CloudWatch Logs**:
```
[TIMESTAMP] Agent IBQRX8MZJJ initialized
[TIMESTAMP] Loading MCP tools: analyze_business_opportunity, assess_strategic_alignment
[TIMESTAMP] Processing user input: "Analyze the market opportunity..."
[TIMESTAMP] Tool execution: analyze_business_opportunity
[TIMESTAMP] Response generated successfully
```

### TC002: Multi-Agent Workflow - Product Development Pipeline
**Purpose**: Test complete orchestration across multiple agents
**What to Monitor**:
- Supervisor agent orchestration
- Sequential agent invocations
- Context passing between agents
- Tool execution across different agents

**Expected Flow**:
1. **Supervisor Agent** receives request
2. **Business Strategy Agent** analyzes market opportunity
3. **Product Development Agent** creates requirements
4. **Executive Communications Agent** generates business case
5. **Case Study Coaching Agent** provides implementation guidance

**Expected CloudWatch Logs**:
```
[TIMESTAMP] Supervisor ULX1RJGKCR: Orchestrating multi-agent workflow
[TIMESTAMP] Invoking Business Strategy Agent IBQRX8MZJJ
[TIMESTAMP] Agent IBQRX8MZJJ: Executing analyze_business_opportunity
[TIMESTAMP] Supervisor: Routing context to Product Development Agent
[TIMESTAMP] Agent CEW45LTT2P: Executing generate_requirements
[TIMESTAMP] Supervisor: Synthesizing responses from 4 agents
```

### TC003: Agent-to-Agent Communication
**Purpose**: Test direct communication routing through supervisor
**What to Monitor**:
- Message routing between agents
- Context preservation across calls
- Sequential execution coordination

### TC004: Parallel Agent Analysis
**Purpose**: Test concurrent agent execution
**What to Monitor**:
- Parallel agent invocations
- Resource utilization
- Response aggregation
- Performance optimization

### TC005: Tool Call Verification
**Purpose**: Verify MCP tool integration
**What to Monitor**:
- Tool discovery process
- Parameter validation
- Tool execution success
- Response formatting

### TC006: Error Handling and Recovery
**Purpose**: Test error scenarios and recovery
**What to Monitor**:
- Error detection and classification
- Error propagation between agents
- Recovery mechanisms
- Graceful degradation

## 🔍 AWS Console Monitoring

### 1. Bedrock Console Monitoring

#### Navigate to Bedrock Agents
```
AWS Console → Amazon Bedrock → Agents
```

#### Test Individual Agents
1. Select your supervisor agent (ULX1RJGKCR)
2. Click "Test" tab
3. Use test prompts from the test cases
4. Monitor real-time responses

#### Monitor Agent Metrics
```
AWS Console → Amazon Bedrock → Agents → [Agent ID] → Metrics
```
**Key Metrics**:
- Invocation count
- Average response time
- Error rate
- Token usage

### 2. CloudWatch Logs Monitoring

#### Access Bedrock Agent Logs
```
AWS Console → CloudWatch → Log groups → /aws/bedrock/agent/
```

#### Key Log Groups to Monitor
- `/aws/bedrock/agent/IBQRX8MZJJ` - Business Strategy Agent
- `/aws/bedrock/agent/CEW45LTT2P` - Product Development Agent  
- `/aws/bedrock/agent/ULX1RJGKCR` - Executive Communications/Supervisor Agent
- `/aws/bedrock/agent/PDZPQTNLYH` - Case Study Coaching Agent

#### Log Analysis Commands
```bash
# Filter logs by session ID
aws logs filter-log-events \
  --log-group-name "/aws/bedrock/agent/ULX1RJGKCR" \
  --filter-pattern "test-session-" \
  --start-time 1640995200000

# Get recent agent invocations
aws logs filter-log-events \
  --log-group-name "/aws/bedrock/agent/IBQRX8MZJJ" \
  --filter-pattern "InvokeAgent" \
  --start-time $(date -d '1 hour ago' +%s)000
```

### 3. X-Ray Tracing

#### Enable X-Ray Tracing
```bash
# Enable tracing for Bedrock agents
aws bedrock-agent update-agent \
  --agent-id ULX1RJGKCR \
  --enable-tracing
```

#### View Traces
```
AWS Console → X-Ray → Traces
```
**Filter by**:
- Service: `bedrock-agent`
- Time range: Last hour
- Response time: > 1000ms (for detailed analysis)

### 4. CloudWatch Metrics

#### Custom Metrics Dashboard
```
AWS Console → CloudWatch → Dashboards → Create dashboard
```

**Key Metrics to Track**:
- `AWS/Bedrock/Agent/InvocationCount`
- `AWS/Bedrock/Agent/InvocationLatency`
- `AWS/Bedrock/Agent/InvocationErrors`
- `AWS/Bedrock/Agent/TokensUsed`

## 🔧 Detailed Monitoring Commands

### 1. Real-Time Log Monitoring
```bash
# Monitor supervisor agent logs in real-time
aws logs tail /aws/bedrock/agent/ULX1RJGKCR --follow

# Monitor all agent logs simultaneously
aws logs tail /aws/bedrock/agent/IBQRX8MZJJ --follow &
aws logs tail /aws/bedrock/agent/CEW45LTT2P --follow &
aws logs tail /aws/bedrock/agent/ULX1RJGKCR --follow &
aws logs tail /aws/bedrock/agent/PDZPQTNLYH --follow &
```

### 2. Performance Analysis
```bash
# Get agent performance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock/Agent \
  --metric-name InvocationLatency \
  --dimensions Name=AgentId,Value=ULX1RJGKCR \
  --start-time $(date -d '1 hour ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average,Maximum
```

### 3. Error Analysis
```bash
# Find error patterns in logs
aws logs filter-log-events \
  --log-group-name "/aws/bedrock/agent/ULX1RJGKCR" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# Count errors by agent
for agent in IBQRX8MZJJ CEW45LTT2P ULX1RJGKCR PDZPQTNLYH; do
  echo "Agent $agent errors:"
  aws logs filter-log-events \
    --log-group-name "/aws/bedrock/agent/$agent" \
    --filter-pattern "ERROR" \
    --start-time $(date -d '1 hour ago' +%s)000 \
    --query 'length(events)'
done
```

## 📈 Expected Results and Benchmarks

### Performance Benchmarks
- **Simple Agent Response**: < 5 seconds
- **Multi-Agent Workflow**: < 15 seconds
- **Tool Execution**: < 3 seconds per tool
- **Agent-to-Agent Communication**: < 2 seconds routing time

### Success Indicators
✅ **Agent Invocation**: Response received without errors
✅ **Tool Calls**: MCP tools execute successfully
✅ **Multi-Agent Flow**: Sequential/parallel execution works
✅ **Context Sharing**: Information passes between agents
✅ **Error Handling**: Graceful failure and recovery

### Warning Signs
⚠️ **High Latency**: > 10 seconds for simple requests
⚠️ **Tool Failures**: MCP tools not found or failing
⚠️ **Context Loss**: Agents not sharing information
⚠️ **Memory Issues**: Agents running out of context window
⚠️ **Rate Limiting**: Too many concurrent requests

## 🎯 Step-by-Step Testing Workflow

### Phase 1: Basic Validation (5 minutes)
```bash
# 1. Test individual agents
node scripts/test-multi-agent-console.js TC001

# 2. Check CloudWatch logs
aws logs tail /aws/bedrock/agent/IBQRX8MZJJ --since 5m

# 3. Verify tool execution
# Look for "Tool execution: analyze_business_opportunity" in logs
```

### Phase 2: Multi-Agent Testing (10 minutes)
```bash
# 1. Test supervisor orchestration
node scripts/test-multi-agent-console.js TC002

# 2. Monitor all agent logs
# Open multiple terminal windows for each agent log group

# 3. Verify agent-to-agent communication
# Look for "Invoking [Agent]" and "Routing context" messages
```

### Phase 3: Advanced Scenarios (15 minutes)
```bash
# 1. Test parallel execution
node scripts/test-multi-agent-console.js TC004

# 2. Test error handling
node scripts/test-multi-agent-console.js TC006

# 3. Performance analysis
# Check response times and resource usage
```

### Phase 4: Production Readiness (10 minutes)
```bash
# 1. Run complete test suite
node scripts/test-multi-agent-console.js

# 2. Analyze results
# Review success rates, performance metrics, error patterns

# 3. Generate monitoring dashboard
# Create CloudWatch dashboard with key metrics
```

## 🚨 Troubleshooting Common Issues

### Issue: Agent Not Responding
**Symptoms**: Timeout errors, no response
**Check**:
1. Agent status in Bedrock console
2. IAM permissions for agent execution role
3. Model availability in region

**Commands**:
```bash
aws bedrock-agent get-agent --agent-id ULX1RJGKCR
aws iam get-role --role-name AmazonBedrockExecutionRoleForAgents_vibe-pm
```

### Issue: Tool Calls Failing
**Symptoms**: "Tool not found" errors
**Check**:
1. MCP server status
2. Tool registration in agent configuration
3. Lambda function permissions

**Commands**:
```bash
# Check MCP server
node test-mcp-server.js

# Check Lambda logs
aws logs tail /aws/lambda/vibe-pm-agent --follow
```

### Issue: Multi-Agent Communication Failing
**Symptoms**: Agents not calling each other
**Check**:
1. Collaborator associations
2. Agent instructions for collaboration
3. Context sharing configuration

**Commands**:
```bash
aws bedrock-agent list-agent-collaborators \
  --agent-id ULX1RJGKCR \
  --agent-version DRAFT
```

## 📊 Monitoring Dashboard Setup

### Create CloudWatch Dashboard
```bash
# Create dashboard JSON configuration
cat > bedrock-agents-dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Bedrock/Agent", "InvocationCount", "AgentId", "ULX1RJGKCR"],
          [".", ".", ".", "IBQRX8MZJJ"],
          [".", ".", ".", "CEW45LTT2P"],
          [".", ".", ".", "PDZPQTNLYH"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Agent Invocations"
      }
    },
    {
      "type": "metric", 
      "properties": {
        "metrics": [
          ["AWS/Bedrock/Agent", "InvocationLatency", "AgentId", "ULX1RJGKCR"],
          [".", ".", ".", "IBQRX8MZJJ"],
          [".", ".", ".", "CEW45LTT2P"],
          [".", ".", ".", "PDZPQTNLYH"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Response Times"
      }
    }
  ]
}
EOF

# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "Bedrock-Multi-Agent-Monitoring" \
  --dashboard-body file://bedrock-agents-dashboard.json
```

## 🎉 Success Validation

After running tests, you should see:

### Console Output
```
🎉 Testing completed: 6/6 tests passed
✅ Successful Tests: 6/6
🤖 Total Agent Invocations: 15
🔧 Total Tool Calls: 23
⚠️  Total Errors: 0
```

### CloudWatch Logs
- Agent initialization messages
- Tool execution logs
- Inter-agent communication traces
- Performance metrics

### Bedrock Console
- Agent metrics showing successful invocations
- Response time graphs
- Error rate at 0%

Your multi-agent system is ready for production use! 🚀