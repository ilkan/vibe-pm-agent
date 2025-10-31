/**
 * Supervisor Agent (SUPERVISOR001) Configuration
 * Enhanced with Llama 3.1 Nemotron Nano 8B V1 capabilities for multi-agent orchestration
 */

export const SUPERVISOR_AGENT_CONFIG = {
  agentId: 'SUPERVISOR001',
  agentName: 'Supervisor Agent',
  agentArn: 'arn:aws:bedrock:us-east-1:account:agent/SUPERVISOR001',
  description: 'Multi-agent orchestration and coordination with Nemotron-powered task distribution and workflow management',
  
  // Enhanced agent instructions with Nemotron reasoning
  instructions: `You are an expert Supervisor Agent enhanced with AWS Bedrock's Llama 3.1 Nemotron Nano 8B V1 model for advanced multi-agent orchestration and coordination.

Your primary role is to orchestrate multiple Bedrock agents, manage task distribution, route messages between agents, and coordinate complex workflows using enhanced AI reasoning.

## Core Capabilities:
1. **Agent Orchestration**: Use Nemotron reasoning to intelligently distribute tasks across multiple specialized agents
2. **Workflow Coordination**: Manage complex multi-step workflows with intelligent task sequencing and dependency management
3. **Message Routing**: Route requests to appropriate agents based on capability matching and workload balancing
4. **Quality Assurance**: Monitor and validate agent responses for consistency and quality

## Enhanced Tools Available:
- invoke_business_strategy_agent: Call Business Strategy Agent (IBQRX8MZJJ) for market analysis and strategic insights
- invoke_product_development_agent: Call Product Development Agent (CEW45LTT2P) for requirements and design tasks
- invoke_executive_communications_agent: Call Executive Communications Agent (ULX1RJGKCR) for business cases and communications
- invoke_case_study_coaching_agent: Call Case Study Coaching Agent (PDZPQTNLYH) for case analysis and coaching
- invoke_citation_agent: Call Citation Agent (CITATION001) for citation validation and sourcing
- coordinate_multi_agent_workflow: Orchestrate complex workflows requiring multiple agent collaboration
- route_agent_communication: Facilitate direct agent-to-agent communication and context sharing

## Nemotron Enhancement Guidelines:
- Apply advanced reasoning to task decomposition and agent selection
- Provide intelligent load balancing and resource optimization across agents
- Generate sophisticated workflow orchestration with dependency analysis
- Include comprehensive monitoring and quality assurance with confidence scoring
- Synthesize multi-agent responses into coherent, actionable outputs

## Response Format:
Always structure responses with:
1. Orchestration Summary with task distribution and agent assignments
2. Workflow Analysis with Nemotron reasoning and dependency mapping
3. Coordination Plan with clear execution steps and timelines
4. Quality Metrics with confidence scores and validation results
5. Status Updates with real-time monitoring and progress tracking

## Agent Communication Architecture:
- **Agent Invocation**: Direct calls to specialized agents (Business Strategy, Product Development, Executive Communications, Case Study Coaching, Citation)
- **Inter-Agent Communication**: Enable agents to call each other through supervisor coordination
- **Workflow Orchestration**: Manage complex multi-agent workflows with intelligent task sequencing
- **Context Sharing**: Preserve and share context between agent interactions
- **Communication Routing**: Route messages and requests between agents based on capabilities and availability

## Communication Patterns:
- **Hub-and-Spoke**: Supervisor coordinates all agent interactions
- **Direct Agent Calls**: Agents can request calls to other agents through supervisor
- **Workflow Chains**: Sequential agent calls with context preservation
- **Parallel Processing**: Concurrent agent execution for independent tasks
- **Feedback Loops**: Agents can iterate and refine outputs through multi-agent collaboration

Use the enhanced reasoning capabilities to provide orchestration that optimizes multi-agent collaboration and workflow efficiency.`,

  // Model configuration for Nemotron
  modelConfig: {
    modelId: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    region: 'us-east-1',
    maxTokens: 4096,
    temperature: 0.6,
    topP: 0.85
  },

  // Enhanced tool configurations - Agent invocation tools
  tools: [
    {
      toolName: 'invoke_business_strategy_agent',
      description: 'Call Business Strategy Agent for market analysis and strategic insights',
      enhancementType: 'agent_invocation',
      parameters: {
        targetAgentId: 'IBQRX8MZJJ',
        agentName: 'Business Strategy Agent',
        capabilities: ['analyze_business_opportunity', 'assess_strategic_alignment', 'validate_market_timing'],
        useAdvancedReasoning: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'invoke_product_development_agent',
      description: 'Call Product Development Agent for requirements and design tasks',
      enhancementType: 'agent_invocation',
      parameters: {
        targetAgentId: 'CEW45LTT2P',
        agentName: 'Product Development Agent',
        capabilities: ['generate_requirements', 'generate_design_options', 'generate_task_plan'],
        useAdvancedReasoning: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'invoke_executive_communications_agent',
      description: 'Call Executive Communications Agent for business cases and communications',
      enhancementType: 'agent_invocation',
      parameters: {
        targetAgentId: 'ULX1RJGKCR',
        agentName: 'Executive Communications Agent',
        capabilities: ['generate_business_case', 'create_stakeholder_communication', 'generate_pr_faq'],
        useAdvancedReasoning: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'invoke_case_study_coaching_agent',
      description: 'Call Case Study Coaching Agent for case analysis and coaching',
      enhancementType: 'agent_invocation',
      parameters: {
        targetAgentId: 'PDZPQTNLYH',
        agentName: 'Case Study Coaching Agent',
        capabilities: ['assess_strategic_alignment', 'generate_requirements', 'analyze_business_opportunity'],
        useAdvancedReasoning: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'invoke_citation_agent',
      description: 'Call Citation Agent for citation validation and sourcing',
      enhancementType: 'agent_invocation',
      parameters: {
        targetAgentId: 'CITATION001',
        agentName: 'Citation Agent',
        capabilities: ['validate_citations', 'source_citations', 'assess_credibility'],
        useAdvancedReasoning: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'coordinate_multi_agent_workflow',
      description: 'Orchestrate complex workflows requiring multiple agent collaboration',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeWorkflowOptimization: true,
        enableAgentToAgentCommunication: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'route_agent_communication',
      description: 'Facilitate direct agent-to-agent communication and context sharing',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeContextPreservation: true,
        enableDirectAgentCalls: true,
        confidenceScoring: true
      }
    }
  ],

  // Performance and monitoring
  performance: {
    expectedResponseTime: '< 3 seconds',
    cacheEnabled: true,
    cacheTTL: 180, // 3 minutes for orchestration decisions
    retryAttempts: 3
  },

  // Orchestration-specific configuration
  orchestration: {
    maxConcurrentTasks: 10,
    maxAgentsPerTask: 5,
    workflowTimeout: 300, // 5 minutes
    enableLoadBalancing: true,
    enableFailover: true
  },

  // IAM and security
  iamRole: 'arn:aws:iam::account:role/BedrockAgentExecutionRole',
  permissions: [
    'bedrock:InvokeModel',
    'bedrock:InvokeModelWithResponseStream',
    'bedrock:InvokeAgent',
    'lambda:InvokeFunction',
    'logs:CreateLogGroup',
    'logs:CreateLogStream',
    'logs:PutLogEvents'
  ]
};

export default SUPERVISOR_AGENT_CONFIG;