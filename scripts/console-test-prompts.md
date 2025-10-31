# Console Test Prompts for Multi-Agent Bedrock

## 🎯 Quick Test Prompts

Copy and paste these prompts directly into the AWS Bedrock console to test your multi-agent setup.

## 📋 Test Categories

### 1. Simple Agent Tests (Individual Agents)

#### Business Strategy Agent (IBQRX8MZJJ)
```
Analyze the market opportunity for AI-powered code review tools targeting enterprise development teams. Include competitive landscape, market size, and strategic positioning recommendations.
```

#### Product Development Agent (CEW45LTT2P)  
```
Generate technical requirements for an AI-powered code review assistant. Include functional requirements, non-functional requirements, and acceptance criteria using MoSCoW prioritization.
```

#### Executive Communications Agent (ULX1RJGKCR)
```
Create a business case for investing $500K in AI-powered developer tools. Include ROI analysis, risk assessment, and executive summary for board presentation.
```

#### Case Study Coaching Agent (PDZPQTNLYH)
```
Analyze this business scenario: A startup wants to compete with GitHub Copilot by building a specialized AI assistant for code reviews. What strategic considerations should they evaluate?
```

### 2. Multi-Agent Orchestration Tests (Supervisor Agent)

#### Complete Product Development Pipeline
```
I need a comprehensive analysis for launching an AI-powered code review assistant targeting enterprise development teams. Please coordinate with all relevant specialist agents to provide:

1. Market opportunity analysis and competitive positioning
2. Technical requirements and design options  
3. Business case with ROI projections
4. Implementation strategy and risk assessment

Use multi-agent collaboration to ensure comprehensive coverage of all aspects.
```

#### Investment Decision Analysis
```
Evaluate a $2M investment in AI infrastructure expansion for our development tools platform. I need analysis from multiple perspectives:

- Strategic market analysis (competitive landscape, timing, positioning)
- Technical requirements and architecture options
- Financial business case with multi-scenario ROI modeling
- Implementation coaching and risk mitigation strategies

Please orchestrate analysis across all specialist agents and synthesize recommendations.
```

#### Competitive Response Strategy
```
Our major competitor just launched an AI-powered code assistant similar to our planned product. I need a rapid response strategy developed through multi-agent collaboration:

1. Have the Business Strategy agent analyze competitive impact and market positioning
2. Have the Product Development agent identify differentiation opportunities and technical requirements
3. Have the Executive Communications agent create a business case for accelerated development
4. Have the Case Study Coaching agent provide implementation guidance and risk assessment

Coordinate the analysis and provide integrated strategic recommendations.
```

### 3. Agent-to-Agent Communication Tests

#### Sequential Analysis Chain
```
Please coordinate a sequential analysis where each agent builds on the previous agent's work:

1. Business Strategy agent: Analyze the market for AI-powered customer service chatbots
2. Product Development agent: Create requirements based on the market analysis
3. Executive Communications agent: Generate a business case using both previous analyses
4. Case Study Coaching agent: Provide implementation guidance based on all previous work

Ensure context and insights flow between agents in this sequential chain.
```

#### Parallel Analysis Synthesis
```
I need parallel analysis of a new AI feature from multiple expert perspectives, then synthesis of all viewpoints:

Feature: AI-powered automated testing assistant for software development

Please have all specialist agents analyze this simultaneously:
- Market opportunity and competitive analysis
- Technical requirements and design considerations  
- Business case and financial projections
- Implementation strategy and coaching

Then synthesize all perspectives into unified strategic recommendations.
```

### 4. Tool Integration Tests

#### Specific Tool Execution
```
Use the analyze_business_opportunity tool to evaluate the market for AI-powered customer service chatbots. Include:
- Market sizing (TAM/SAM/SOM)
- Competitive landscape analysis
- Strategic positioning recommendations
- Confidence scoring for all recommendations

Ensure the tool is called with proper parameters and results are formatted professionally.
```

#### Multi-Tool Workflow
```
Execute a comprehensive business analysis workflow using multiple tools:

1. Use analyze_business_opportunity for market analysis
2. Use generate_requirements for technical specifications
3. Use generate_business_case for ROI modeling
4. Use create_stakeholder_communication for executive summary

Coordinate tool execution and ensure outputs build on each other logically.
```

### 5. Error Handling Tests

#### Invalid Scenario Test
```
Analyze the business opportunity for a product with intentionally vague and contradictory requirements:

"Build an AI thing that does everything for everyone with no budget and immediate deployment but also needs to be enterprise-grade and highly secure."

Test how the multi-agent system handles ambiguous requirements and provides constructive guidance.
```

#### Resource Constraint Test
```
Develop a comprehensive business strategy for an AI platform with severe constraints:
- Budget: $10,000 total
- Timeline: 2 weeks
- Team: 1 developer
- Target: Compete with Microsoft and Google

Test how agents handle unrealistic constraints and provide practical alternatives.
```

## 🔍 What to Monitor During Testing

### In AWS Bedrock Console
1. **Response Times**: Should be < 10 seconds for most requests
2. **Response Quality**: Look for structured, professional outputs
3. **Error Messages**: Should be informative and actionable
4. **Token Usage**: Monitor consumption for cost optimization

### In CloudWatch Logs
1. **Agent Initialization**: Look for successful startup messages
2. **Tool Execution**: Verify MCP tools are being called
3. **Inter-Agent Communication**: Check for agent-to-agent calls
4. **Error Patterns**: Identify any recurring issues

### Expected Log Patterns
```
[TIMESTAMP] Agent ULX1RJGKCR: Processing multi-agent request
[TIMESTAMP] Orchestrating workflow across 4 specialist agents
[TIMESTAMP] Invoking Business Strategy Agent IBQRX8MZJJ
[TIMESTAMP] Agent IBQRX8MZJJ: Executing analyze_business_opportunity tool
[TIMESTAMP] Tool execution successful: market analysis completed
[TIMESTAMP] Routing context to Product Development Agent CEW45LTT2P
[TIMESTAMP] Agent CEW45LTT2P: Executing generate_requirements tool
[TIMESTAMP] Synthesizing responses from all agents
[TIMESTAMP] Multi-agent workflow completed successfully
```

## 📊 Success Criteria

### ✅ Successful Test Indicators
- **Response Generated**: Agent provides structured response
- **Tool Calls Work**: MCP tools execute successfully  
- **Multi-Agent Flow**: Agents communicate and coordinate
- **Context Preserved**: Information flows between agents
- **Professional Output**: Business-ready documents generated

### ⚠️ Warning Signs
- **Timeout Errors**: Responses take > 30 seconds
- **Tool Failures**: "Tool not found" or execution errors
- **Context Loss**: Agents don't reference previous work
- **Generic Responses**: Lack of specific analysis or insights
- **Error Messages**: Frequent failures or unclear errors

## 🚀 Advanced Testing Scenarios

### Real-World Business Scenario
```
Our SaaS company (50 employees, $5M ARR) is considering building an AI-powered analytics dashboard to compete with Tableau and PowerBI. We have 6 months and $1M budget.

Please coordinate comprehensive analysis across all specialist agents:
1. Market opportunity and competitive positioning analysis
2. Technical architecture and development requirements
3. Business case with detailed financial projections
4. Implementation roadmap with risk assessment and mitigation strategies

Provide executive-ready recommendations with confidence scoring and evidence-based insights.
```

### Crisis Response Scenario
```
URGENT: Our main competitor just acquired a major AI company and announced they're launching a direct competitor to our core product in 3 months. 

I need immediate strategic response analysis:
1. Competitive threat assessment and market impact analysis
2. Product differentiation opportunities and technical requirements
3. Emergency business case for accelerated development or strategic pivot
4. Crisis management and implementation guidance

Time is critical - please coordinate rapid multi-agent analysis and provide actionable recommendations within minutes.
```

### Innovation Opportunity Scenario
```
We've identified a potential breakthrough opportunity: AI-powered automated software architecture generation. This could revolutionize how developers build applications.

Please conduct comprehensive innovation analysis:
1. Market opportunity assessment for disruptive technology
2. Technical feasibility and development requirements analysis
3. Business case for innovation investment with multiple scenarios
4. Strategic implementation guidance for breakthrough innovation

Focus on both opportunity maximization and risk management for this high-potential, high-risk innovation.
```

## 📝 Testing Checklist

### Pre-Test Setup
- [ ] All agents are in PREPARED status
- [ ] Agent aliases are configured correctly
- [ ] Multi-agent collaboration is enabled
- [ ] CloudWatch logging is enabled
- [ ] IAM permissions are properly configured

### During Testing
- [ ] Monitor response times in console
- [ ] Check CloudWatch logs for agent activity
- [ ] Verify tool execution in logs
- [ ] Observe agent-to-agent communication
- [ ] Note any error messages or warnings

### Post-Test Analysis
- [ ] Review response quality and completeness
- [ ] Analyze performance metrics
- [ ] Check error rates and patterns
- [ ] Validate multi-agent coordination
- [ ] Document any issues or improvements needed

## 🎯 Next Steps After Testing

1. **Performance Optimization**: Tune agent parameters based on results
2. **Error Resolution**: Fix any identified issues or configuration problems
3. **Monitoring Setup**: Create CloudWatch dashboards for ongoing monitoring
4. **Production Deployment**: Deploy to production environment if tests pass
5. **User Training**: Prepare documentation and training for end users

Your multi-agent Bedrock system is ready for comprehensive testing! 🚀