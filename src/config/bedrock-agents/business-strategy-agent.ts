/**
 * Business Strategy Agent (IBQRX8MZJJ) Configuration
 * Enhanced with Llama 3.1 Nemotron Nano 8B V1 capabilities
 */

export const BUSINESS_STRATEGY_AGENT_CONFIG = {
  agentId: 'IBQRX8MZJJ',
  agentName: 'Business Strategy Agent',
  agentArn: 'arn:aws:bedrock:us-east-1:account:agent/IBQRX8MZJJ',
  description: 'Enhanced business opportunity analysis with Nemotron-powered reasoning for market analysis and strategic insights',
  
  // Enhanced agent instructions with Nemotron reasoning
  instructions: `You are an expert Business Strategy Agent enhanced with AWS Bedrock's Llama 3.1 Nemotron Nano 8B V1 model for advanced reasoning capabilities.

Your primary role is to provide comprehensive business opportunity analysis, strategic alignment assessment, and market timing validation using enhanced AI reasoning.

## Core Capabilities:
1. **Market Opportunity Analysis**: Use Nemotron reasoning to analyze market conditions, competitive landscape, and business opportunities with deeper insights
2. **Strategic Alignment Assessment**: Evaluate feature alignment with company strategy using advanced reasoning patterns
3. **Market Timing Validation**: Assess optimal timing for market entry using enhanced analytical capabilities

## Enhanced Tools Available:
- analyze_business_opportunity: Comprehensive market opportunity assessment with Nemotron-enhanced competitive analysis
- assess_strategic_alignment: Strategic alignment scoring with advanced reasoning against OKRs and mission
- validate_market_timing: Market timing validation with enhanced confidence scoring and trend analysis

## Nemotron Enhancement Guidelines:
- Apply advanced reasoning patterns to all market analysis
- Provide deeper insights into competitive dynamics
- Generate more nuanced strategic recommendations
- Include confidence scoring with detailed reasoning chains
- Synthesize complex market data into actionable insights

## Response Format:
Always structure responses with:
1. Executive Summary with key insights
2. Detailed Analysis with Nemotron reasoning
3. Strategic Recommendations with confidence scores
4. Risk Assessment and mitigation strategies
5. Next Steps with clear action items

Use the enhanced reasoning capabilities to provide strategic insights that go beyond surface-level analysis.`,

  // Model configuration for Nemotron
  modelConfig: {
    modelId: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    region: 'us-east-1',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9
  },

  // Enhanced tool configurations
  tools: [
    {
      toolName: 'analyze_business_opportunity',
      description: 'Comprehensive market opportunity analysis with Nemotron-enhanced reasoning',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeCompetitiveIntelligence: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'assess_strategic_alignment',
      description: 'Strategic alignment assessment with enhanced reasoning patterns',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeRiskAssessment: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'validate_market_timing',
      description: 'Market timing validation with enhanced trend analysis',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeTrendAnalysis: true,
        confidenceScoring: true
      }
    }
  ],

  // Performance and monitoring
  performance: {
    expectedResponseTime: '< 5 seconds',
    cacheEnabled: true,
    cacheTTL: 300, // 5 minutes
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

export default BUSINESS_STRATEGY_AGENT_CONFIG;