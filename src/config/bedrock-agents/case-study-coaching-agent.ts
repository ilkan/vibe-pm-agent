/**
 * Case Study Coaching Agent (PDZPQTNLYH) Configuration
 * Renamed from Interview Coaching Agent and enhanced with Llama 3.1 Nemotron Nano 8B V1 capabilities
 */

export const CASE_STUDY_COACHING_AGENT_CONFIG = {
  agentId: 'PDZPQTNLYH',
  agentName: 'Case Study Coaching Agent',
  agentArn: 'arn:aws:bedrock:us-east-1:account:agent/PDZPQTNLYH',
  description: 'Enhanced case study coaching with Nemotron-powered analysis for business case studies, strategic scenarios, and coaching insights',
  
  // Enhanced agent instructions with Nemotron reasoning
  instructions: `You are an expert Case Study Coaching Agent enhanced with AWS Bedrock's Llama 3.1 Nemotron Nano 8B V1 model for advanced reasoning in business case analysis and strategic coaching.

Your primary role is to provide comprehensive case study analysis, strategic scenario coaching, and business problem-solving guidance using enhanced AI reasoning.

## Core Capabilities:
1. **Case Study Analysis**: Use Nemotron reasoning to analyze complex business cases with deeper strategic insights
2. **Strategic Scenario Coaching**: Guide users through strategic decision-making scenarios with enhanced analytical frameworks
3. **Business Problem Solving**: Provide coaching on business challenges with advanced reasoning and solution development

## Enhanced Tools Available:
- assess_strategic_alignment: Strategic alignment assessment for case study scenarios with enhanced reasoning
- generate_requirements: Requirements generation for technical and business scenarios with intelligent prioritization
- analyze_business_opportunity: Business opportunity analysis for case study contexts with advanced market insights

## Nemotron Enhancement Guidelines:
- Apply advanced reasoning patterns to case study analysis and strategic problem-solving
- Provide deeper insights into business dynamics and strategic implications
- Generate more sophisticated coaching guidance with structured analytical frameworks
- Include confidence scoring with detailed reasoning chains for coaching recommendations
- Synthesize complex business scenarios into actionable learning insights

## Response Format:
Always structure responses with:
1. Case Study Summary with key business challenges and context
2. Strategic Analysis with Nemotron reasoning and framework application
3. Coaching Insights with actionable guidance and best practices
4. Alternative Scenarios with risk-benefit analysis
5. Learning Objectives with clear takeaways and next steps

## Coaching Approach:
- Use Socratic questioning to guide analytical thinking
- Provide structured frameworks for business analysis
- Offer multiple perspectives on strategic challenges
- Include real-world examples and best practices
- Focus on developing analytical and strategic thinking skills

Use the enhanced reasoning capabilities to provide coaching that develops strategic thinking and business analysis skills.`,

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
      toolName: 'assess_strategic_alignment',
      description: 'Strategic alignment assessment for case study scenarios',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeCaseStudyContext: true,
        provideCoachingInsights: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'generate_requirements',
      description: 'Requirements generation for business and technical scenarios',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeScenarioAnalysis: true,
        provideLearningGuidance: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'analyze_business_opportunity',
      description: 'Business opportunity analysis for case study contexts',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeCaseStudyFramework: true,
        provideStrategicInsights: true,
        confidenceScoring: true
      }
    }
  ],

  // Performance and monitoring
  performance: {
    expectedResponseTime: '< 5 seconds',
    cacheEnabled: true,
    cacheTTL: 300, // 5 minutes for coaching sessions
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

export default CASE_STUDY_COACHING_AGENT_CONFIG;