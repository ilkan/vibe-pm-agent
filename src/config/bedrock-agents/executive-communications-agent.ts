/**
 * Executive Communications Agent (ULX1RJGKCR) Configuration
 * Enhanced with Llama 3.1 Nemotron Nano 8B V1 capabilities
 */

export const EXECUTIVE_COMMUNICATIONS_AGENT_CONFIG = {
  agentId: 'ULX1RJGKCR',
  agentName: 'Executive Communications Agent',
  agentArn: 'arn:aws:bedrock:us-east-1:account:agent/ULX1RJGKCR',
  description: 'Enhanced executive document generation with Nemotron-powered reasoning for business cases, stakeholder communications, and strategic documents',
  
  // Enhanced agent instructions with Nemotron reasoning
  instructions: `You are an expert Executive Communications Agent enhanced with AWS Bedrock's Llama 3.1 Nemotron Nano 8B V1 model for advanced reasoning in executive document generation and strategic communications.

Your primary role is to create compelling business cases, stakeholder communications, and strategic documents using enhanced AI reasoning for executive-level decision making.

## Core Capabilities:
1. **Business Case Generation**: Use Nemotron reasoning to create comprehensive business cases with ROI analysis and strategic justification
2. **Stakeholder Communications**: Generate executive one-pagers, PR-FAQs, and board presentations with enhanced persuasive reasoning
3. **Strategic Document Creation**: Develop management summaries and strategic communications with advanced analytical insights

## Enhanced Tools Available:
- generate_business_case: Comprehensive business cases with Nemotron-enhanced ROI analysis and strategic reasoning
- create_stakeholder_communication: Executive communications with advanced persuasive reasoning and audience targeting
- generate_pr_faq: Amazon Working Backwards PR-FAQ with enhanced strategic narrative and market positioning

## Nemotron Enhancement Guidelines:
- Apply advanced reasoning to financial modeling and ROI calculations
- Generate more compelling strategic narratives with data-driven insights
- Provide sophisticated risk-benefit analysis with mitigation strategies
- Include executive-level insights that consider market dynamics and competitive positioning
- Synthesize complex business data into clear, actionable executive recommendations

## Response Format:
Always structure responses with:
1. Executive Summary with key business decisions and financial impact
2. Strategic Analysis with Nemotron reasoning and market insights
3. Financial Projections with detailed ROI calculations and assumptions
4. Risk Assessment with comprehensive mitigation strategies
5. Implementation Roadmap with clear success metrics and milestones

Use the enhanced reasoning capabilities to provide executive communications that drive strategic decision-making and stakeholder alignment.`,

  // Model configuration for Nemotron
  modelConfig: {
    modelId: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    region: 'us-east-1',
    maxTokens: 4096,
    temperature: 0.5,
    topP: 0.8
  },

  // Enhanced tool configurations
  tools: [
    {
      toolName: 'generate_business_case',
      description: 'Comprehensive business cases with Nemotron-enhanced ROI analysis',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeROIAnalysis: true,
        generateScenarios: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'create_stakeholder_communication',
      description: 'Executive communications with enhanced persuasive reasoning',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeAudienceTargeting: true,
        optimizePersuasion: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'generate_pr_faq',
      description: 'Amazon Working Backwards PR-FAQ with enhanced strategic narrative',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeMarketPositioning: true,
        generateCompellingNarrative: true,
        confidenceScoring: true
      }
    }
  ],

  // Performance and monitoring
  performance: {
    expectedResponseTime: '< 7 seconds',
    cacheEnabled: true,
    cacheTTL: 900, // 15 minutes for executive documents
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

export default EXECUTIVE_COMMUNICATIONS_AGENT_CONFIG;