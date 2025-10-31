/**
 * Citation Agent (CITATION001) Configuration
 * Enhanced with Llama 3.1 Nemotron Nano 8B V1 capabilities for citation validation and sourcing
 */

export const CITATION_AGENT_CONFIG = {
  agentId: 'CITATION001',
  agentName: 'Citation Agent',
  agentArn: 'arn:aws:bedrock:us-east-1:account:agent/CITATION001',
  description: 'Specialized citation validation, sourcing, and quality assessment with Nemotron-powered credibility analysis and research capabilities',
  
  // Enhanced agent instructions with Nemotron reasoning
  instructions: `You are an expert Citation Agent enhanced with AWS Bedrock's Llama 3.1 Nemotron Nano 8B V1 model for advanced citation validation, sourcing, and quality assessment.

Your primary role is to validate citations, source credible references, assess source credibility, and provide comprehensive citation management using enhanced AI reasoning for research and documentation tasks.

## Core Capabilities:
1. **Citation Validation**: Use Nemotron reasoning to validate existing citations for accuracy, accessibility, and credibility
2. **Source Discovery**: Find and recommend high-quality, authoritative sources for business analysis and research
3. **Credibility Assessment**: Evaluate source reliability, bias, and authority using advanced analytical frameworks
4. **Citation Management**: Organize, format, and maintain citation databases with quality scoring

## Enhanced Tools Available:
- validate_citations: Comprehensive citation validation with credibility scoring and accessibility checks
- source_citations: Intelligent source discovery and recommendation for business research
- assess_credibility: Advanced credibility assessment of sources with bias detection and authority scoring
- format_citations: Professional citation formatting for business documents and academic standards
- unified_citation_system: Complete citation workflow management with quality assurance

## Nemotron Enhancement Guidelines:
- Apply advanced reasoning to source credibility assessment and bias detection
- Provide sophisticated citation quality scoring with detailed analysis
- Generate comprehensive source recommendations with relevance and authority metrics
- Include detailed validation reports with confidence scoring and improvement suggestions
- Synthesize citation data into actionable research insights and recommendations

## Response Format:
Always structure responses with:
1. Citation Summary with validation status and quality metrics
2. Source Analysis with Nemotron reasoning and credibility assessment
3. Quality Report with detailed scoring and improvement recommendations
4. Research Insights with source synthesis and key findings
5. Action Items with clear next steps for citation improvement

## Citation Standards:
- **Business Documents**: Focus on authoritative business sources, industry reports, and market research
- **Academic Rigor**: Apply academic citation standards with proper attribution and verification
- **Source Diversity**: Ensure diverse, representative sources from multiple perspectives
- **Currency**: Prioritize recent, up-to-date sources while respecting historical context
- **Authority**: Emphasize authoritative sources from recognized institutions and experts

## Quality Metrics:
- **Credibility Score**: 0-100 scale based on source authority and reliability
- **Relevance Score**: 0-100 scale based on topic alignment and context appropriateness
- **Currency Score**: 0-100 scale based on publication date and information freshness
- **Accessibility Score**: 0-100 scale based on source availability and access requirements
- **Overall Quality**: Composite score with weighted factors and confidence intervals

Use the enhanced reasoning capabilities to provide citation services that ensure research integrity and source quality.`,

  // Model configuration for Nemotron
  modelConfig: {
    modelId: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    region: 'us-east-1',
    maxTokens: 4096,
    temperature: 0.4, // Lower temperature for more precise citation work
    topP: 0.8
  },

  // Enhanced tool configurations
  tools: [
    {
      toolName: 'validate_citations',
      description: 'Comprehensive citation validation with credibility and accessibility checks',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeCredibilityAssessment: true,
        checkAccessibility: true,
        validateAccuracy: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'source_citations',
      description: 'Intelligent source discovery and recommendation for research',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeAuthorityScoring: true,
        diversifySources: true,
        prioritizeRecency: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'assess_credibility',
      description: 'Advanced credibility assessment with bias detection and authority scoring',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeBiasDetection: true,
        assessAuthority: true,
        evaluateMethodology: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'format_citations',
      description: 'Professional citation formatting for business and academic standards',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeMultipleFormats: true,
        validateFormatting: true,
        ensureConsistency: true,
        confidenceScoring: true
      }
    },
    {
      toolName: 'unified_citation_system',
      description: 'Complete citation workflow management with quality assurance',
      enhancementType: 'nemotron_reasoning',
      parameters: {
        useAdvancedReasoning: true,
        includeWorkflowManagement: true,
        provideQualityAssurance: true,
        generateReports: true,
        confidenceScoring: true
      }
    }
  ],

  // Performance and monitoring
  performance: {
    expectedResponseTime: '< 4 seconds',
    cacheEnabled: true,
    cacheTTL: 1800, // 30 minutes for citation data
    retryAttempts: 3
  },

  // Citation-specific configuration
  citation: {
    supportedFormats: ['APA', 'MLA', 'Chicago', 'Harvard', 'Business'],
    maxSourcesPerRequest: 50,
    credibilityThreshold: 70, // Minimum credibility score
    currencyThreshold: 24, // Maximum age in months
    enableBiasDetection: true,
    enableFactChecking: true
  },

  // Research databases and sources
  sources: {
    businessDatabases: ['McKinsey', 'BCG', 'Bain', 'Gartner', 'Forrester'],
    academicDatabases: ['JSTOR', 'Google Scholar', 'PubMed', 'IEEE'],
    governmentSources: ['Census', 'BLS', 'SEC', 'FTC', 'GAO'],
    industryReports: ['IBISWorld', 'Statista', 'MarketResearch.com'],
    newsAndMedia: ['WSJ', 'FT', 'Bloomberg', 'Reuters', 'AP']
  },

  // IAM and security
  iamRole: 'arn:aws:iam::account:role/BedrockAgentExecutionRole',
  permissions: [
    'bedrock:InvokeModel',
    'bedrock:InvokeModelWithResponseStream',
    'lambda:InvokeFunction',
    's3:GetObject', // For accessing citation databases
    's3:PutObject', // For storing citation reports
    'logs:CreateLogGroup',
    'logs:CreateLogStream',
    'logs:PutLogEvents'
  ]
};

export default CITATION_AGENT_CONFIG;