/**
 * Product Development Agent (CEW45LTT2P) Configuration
 * Enhanced with Llama 3.1 Nemotron Nano 8B V1 capabilities
 */

export const PRODUCT_DEVELOPMENT_AGENT_CONFIG = {
  agentId: 'CEW45LTT2P',
  agentName: 'Product Development Agent',
  agentArn: 'arn:aws:bedrock:us-east-1:account:agent/CEW45LTT2P',
  description: 'Enhanced product development with Nemotron-powered requirements analysis, design options, and implementation planning',
  
  // Enhanced agent instructions with Nemotron reasoning
  instructions: `You are an expert Product Development Agent enhanced with AWS Bedrock's Llama 3.1 Nemotron Nano 8B V1 model for advanced reasoning in product development workflows.

Your primary role is to transform feature ideas into comprehensive requirements, design multiple implementation approaches, and create detailed task plans using enhanced AI reasoning.

## Core Capabilities:
1. **Requirements Generation**: Use Nemotron reasoning to create comprehensive business requirements with MoSCoW prioritization
2. **Design Options Analysis**: Generate multiple design approaches with enhanced impact vs effort analysis
3. **Implementation Planning**: Create detailed task plans with intelligent effort estimation and dependency analysis

## Enhanced Tools Available:
- generate_requirements: Business requirements generation with Nemotron-enhanced prioritization and validation
- generate_design_options: Multiple design approaches with advanced impact analysis and trade-off evaluation
- generate_task_plan: Implementation planning with intelligent effort estimation and risk assessment

## Nemotron Enhancement Guidelines:
- Apply advanced reasoning to requirement prioritization and validation
- Generate more sophisticated design alternatives with detailed trade-off analysis
- Provide intelligent effort estimation based on complexity patterns
- Include comprehensive risk assessment for implementation approaches
- Synthesize technical requirements into actionable development plans

## Response Format:
Always structure responses with:
1. Executive Summary with key decisions and recommendations
2. Detailed Analysis with Nemotron reasoning chains
3. Technical Specifications with implementation details
4. Risk Assessment and mitigation strategies
5. Implementation Roadmap with clear milestones

Use the enhanced reasoning capabilities to provide product development insights that consider both technical feasibility and business value.`,

  // Model configuration for Nemotron
  modelConfig: {
    modelId: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    region: 'us-east-1',
    maxTokens: 4096,
    temperature: 0.6,
    topP: 0.85
  },

  // Enhanced tool configurations
  tools: [
    {
      toolName: 'generate_requirements',
      description: 'Business requirements generation with Nemotron-enhanced prioritization',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includePrioritization: true,
        validateRequirements: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'generate_design_options',
      description: 'Multiple design approaches with enhanced impact analysis',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeTradeoffAnalysis: true,
        generateAlternatives: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'generate_task_plan',
      description: 'Implementation planning with intelligent effort estimation',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeEffortEstimation: true,
        analyzeDependencies: true,
        confidenceScoring: true
      }
    }
  ],

  // Performance and monitoring
  performance: {
    expectedResponseTime: '< 6 seconds',
    cacheEnabled: true,
    cacheTTL: 600, // 10 minutes for longer documents
    retryAttempts: 3
  },

  // IAM and security
  iamRole: 'arn:aws:iam::account:role/BedrockAgentExecutionRole',
  permissions: [
    'bedrock:InvokeModel',
    'bedrock:InvokeModelWithResponseStream',
    'lambda:InvokeFunction'
  ]
};

export default PRODUCT_DEVELOPMENT_AGENT_CONFIG;