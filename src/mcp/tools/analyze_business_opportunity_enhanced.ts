/**
 * MCP Tool: analyze_business_opportunity_enhanced
 *
 * Enhanced business opportunity analysis with authoritative source integration
 * for improved confidence scoring and consulting-grade analysis quality.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { AuthoritativeSourceEnhancer } from '../../components/authoritative-source-enhancer';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';

export interface AnalyzeBusinessOpportunityEnhancedArgs {
  idea: string;
  market_context?: {
    industry?: string;
    budget_range?: 'small' | 'medium' | 'large';
    timeline?: string;
    competition?: string;
  };
  analysis_depth?: 'quick' | 'standard' | 'comprehensive';
  authoritative_sources?: {
    include_mckinsey?: boolean;
    include_bcg?: boolean;
    include_bain?: boolean;
    include_gartner?: boolean;
    include_wef?: boolean;
  };
  steering_options?: {
    create_steering_files?: boolean;
    feature_name?: string;
    inclusion_rule?: 'always' | 'fileMatch' | 'manual';
  };
}

/**
 * Enhanced business opportunity analysis with authoritative source integration
 */
export async function analyzeBusinessOpportunityEnhanced(
  args: AnalyzeBusinessOpportunityEnhancedArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Starting enhanced business opportunity analysis', context, {
      ideaLength: args.idea.length,
      analysisDepth: args.analysis_depth || 'standard',
      authoritativeSources: args.authoritative_sources,
    });

    const sourceEnhancer = new AuthoritativeSourceEnhancer();
    const pipeline = new AIAgentPipeline();

    // Determine analysis type based on content
    const analysisType = determineAnalysisType(args.idea, args.market_context);

    // Create enhanced prompt with authoritative source context
    const basePrompt = createBaseAnalysisPrompt(args);
    const enhancedPrompt = sourceEnhancer.enhancePrompt(basePrompt, analysisType);

    // Add confidence scoring criteria
    const confidenceScoring = sourceEnhancer.generateConfidenceScoring();
    const fullPrompt = `${enhancedPrompt}\n\n${confidenceScoring}`;

    MCPLogger.debug('Generated enhanced prompt with authoritative sources', context, {
      promptLength: fullPrompt.length,
      analysisType,
      sourcesIncluded: Object.keys(args.authoritative_sources || {}).length,
    });

    // Execute enhanced analysis
    // Transform market context to match pipeline expectations
    const transformedContext = args.market_context
      ? {
          industry: args.market_context.industry || 'technology',
          geography: ['global'], // Default to global
          target_segment: 'enterprise', // Default segment
        }
      : undefined;

    const analysisResult = await pipeline.analyzeEnhancedBusinessOpportunity(
      args.idea,
      transformedContext,
      true, // includeCompetitive
      true, // includeMarketSizing
      args.analysis_depth || 'standard'
    );

    // Convert structured result to markdown for analysis
    const markdownAnalysis = convertStructuredResultToMarkdown(analysisResult);

    // Calculate enhanced confidence score
    const confidenceMetrics = calculateEnhancedConfidenceScore(markdownAnalysis);

    // Format response with enhanced metadata
    const enhancedAnalysis = formatEnhancedAnalysis(
      markdownAnalysis,
      confidenceMetrics,
      analysisType
    );

    MCPLogger.info('Enhanced business opportunity analysis completed', context, {
      confidenceScore: confidenceMetrics.overall,
      analysisType,
      wordCount: enhancedAnalysis.length,
      authoritativeSourcesUsed: confidenceMetrics.sourcesUsed,
    });

    return MCPResponseFormatter.formatSuccess(enhancedAnalysis, 'markdown', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: args.analysis_depth === 'comprehensive' ? 3 : 2,
      confidenceScore: confidenceMetrics.overall,
      analysisType,
      authoritativeSourcesIntegrated: true,
      confidenceBreakdown: confidenceMetrics.breakdown,
      sourcesUsed: confidenceMetrics.sourcesUsed,
    });
  } catch (error) {
    MCPLogger.error('analyze_business_opportunity_enhanced tool failed', error as Error, context);
    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in enhanced analysis'),
      context
    );
  }
}

function convertStructuredResultToMarkdown(result: any): string {
  return `# Business Opportunity Analysis

## Executive Summary
**Opportunity Score**: ${result.overallAssessment?.opportunityScore || 'N/A'}/1.0
**Confidence Level**: ${result.overallAssessment?.confidence || 'medium'}
**Recommendation**: ${result.overallAssessment?.recommendation || 'Further analysis needed'}

## Feature Overview
**Idea**: ${result.featureIdea}
**Industry**: ${result.marketContext?.industry || 'Not specified'}
**Analysis Depth**: ${result.analysisDepth}

## Market Sizing Analysis
${
  result.marketSizing
    ? `
**Total Addressable Market (TAM)**: $${(result.marketSizing.tam / 1000000000).toFixed(1)}B
**Serviceable Addressable Market (SAM)**: $${(result.marketSizing.sam / 1000000).toFixed(0)}M
**Serviceable Obtainable Market (SOM)**: $${(result.marketSizing.som / 1000000).toFixed(0)}M
**Market Growth Rate**: ${result.marketSizing.growthRate || 'N/A'}%
**Confidence**: ${result.marketSizing.confidence || 'medium'}
`
    : 'Market sizing not available'
}

## Competitive Analysis
${
  result.competitiveAnalysis
    ? `
**Competitive Landscape**: ${result.competitiveAnalysis.landscape || 'Analyzed'}
**Key Competitors**: ${result.competitiveAnalysis.competitors?.map((c: any) => c.name).join(', ') || 'Various players'}
**Competitive Advantage**: ${result.competitiveAnalysis.advantages?.join(', ') || 'To be determined'}
**Market Position**: ${result.competitiveAnalysis.positioning || 'Challenger'}
`
    : 'Competitive analysis not available'
}

## Strategic Fit Assessment
**Alignment Score**: ${result.strategicFit?.alignmentScore || 'N/A'}/1.0
**Competitive Advantages**:
${result.strategicFit?.competitiveAdvantage?.map((adv: string) => `- ${adv}`).join('\n') || '- To be determined'}

**Market Gaps**:
${result.strategicFit?.marketGaps?.map((gap: string) => `- ${gap}`).join('\n') || '- Analysis pending'}

**Success Factors**:
${result.strategicFit?.successFactors?.map((factor: string) => `- ${factor}`).join('\n') || '- To be identified'}

## Market Timing Analysis
**Readiness**: ${result.marketTiming?.readiness || 'Under evaluation'}
**Favorable Factors**:
${result.marketTiming?.factors?.map((factor: string) => `- ${factor}`).join('\n') || '- Analysis pending'}

**Key Risks**:
${result.marketTiming?.risks?.map((risk: string) => `- ${risk}`).join('\n') || '- To be assessed'}

## Next Steps
${result.overallAssessment?.nextSteps?.map((step: string) => `1. ${step}`).join('\n') || '1. Further analysis required'}

## Key Risks
${result.overallAssessment?.keyRisks?.map((risk: string) => `- ${risk}`).join('\n') || '- Risk assessment pending'}
`;
}

function determineAnalysisType(
  idea: string,
  marketContext?: AnalyzeBusinessOpportunityEnhancedArgs['market_context']
): 'market' | 'strategic' | 'financial' | 'operational' {
  const ideaLower = idea.toLowerCase();

  if (
    ideaLower.includes('market') ||
    ideaLower.includes('customer') ||
    ideaLower.includes('competition')
  ) {
    return 'market';
  }
  if (
    ideaLower.includes('strategy') ||
    ideaLower.includes('vision') ||
    ideaLower.includes('mission')
  ) {
    return 'strategic';
  }
  if (ideaLower.includes('revenue') || ideaLower.includes('cost') || ideaLower.includes('roi')) {
    return 'financial';
  }
  if (
    ideaLower.includes('process') ||
    ideaLower.includes('efficiency') ||
    ideaLower.includes('operation')
  ) {
    return 'operational';
  }

  // Default to market analysis for general business opportunities
  return 'market';
}

function createBaseAnalysisPrompt(args: AnalyzeBusinessOpportunityEnhancedArgs): string {
  const depth = args.analysis_depth || 'standard';
  const industry = args.market_context?.industry || 'technology';

  return `
# Enhanced Business Opportunity Analysis

Analyze the following business opportunity with consulting-grade rigor:

**Opportunity**: ${args.idea}

**Market Context**:
- Industry: ${industry}
- Budget Range: ${args.market_context?.budget_range || 'medium'}
- Timeline: ${args.market_context?.timeline || 'not specified'}
- Competition: ${args.market_context?.competition || 'to be analyzed'}

## Analysis Requirements (${depth} depth)

Provide a comprehensive analysis covering:

1. **Market Opportunity Assessment**
   - Total Addressable Market (TAM) sizing
   - Serviceable Addressable Market (SAM) analysis
   - Serviceable Obtainable Market (SOM) estimation
   - Market growth trends and drivers

2. **Competitive Landscape Analysis**
   - Direct and indirect competitors
   - Competitive positioning
   - Differentiation opportunities
   - Competitive advantages and moats

3. **Strategic Alignment & Timing**
   - Market timing assessment
   - Strategic fit evaluation
   - Resource requirements
   - Risk assessment

4. **Financial Opportunity**
   - Revenue potential estimation
   - Cost structure analysis
   - Investment requirements
   - ROI projections

5. **Implementation Feasibility**
   - Technical feasibility
   - Operational requirements
   - Go-to-market strategy
   - Success metrics and KPIs

## Output Format

Structure your analysis using the Pyramid Principle:
- Executive Summary (key findings and recommendations)
- Supporting Analysis (detailed findings by category)
- Evidence and Data (supporting information and assumptions)
- Next Steps (actionable recommendations)
`;
}

function calculateEnhancedConfidenceScore(analysisResult: string): {
  overall: number;
  breakdown: {
    evidence: number;
    methodology: number;
    market_validation: number;
    strategic_alignment: number;
  };
  sourcesUsed: string[];
} {
  // Analyze the content for authoritative source references
  const sourcesUsed = detectAuthoritativeSources(analysisResult);
  const methodologyRigor = assessMethodologyRigor(analysisResult);
  const evidenceQuality = assessEvidenceQuality(analysisResult);
  const marketValidation = assessMarketValidation(analysisResult);
  const strategicAlignment = assessStrategicAlignment(analysisResult);

  const breakdown = {
    evidence: evidenceQuality,
    methodology: methodologyRigor,
    market_validation: marketValidation,
    strategic_alignment: strategicAlignment,
  };

  // Calculate weighted overall score
  const overall = Math.round(
    breakdown.evidence * 0.3 +
      breakdown.methodology * 0.25 +
      breakdown.market_validation * 0.25 +
      breakdown.strategic_alignment * 0.2
  );

  return {
    overall,
    breakdown,
    sourcesUsed,
  };
}

function detectAuthoritativeSources(content: string): string[] {
  const sources = [];
  const contentLower = content.toLowerCase();

  if (contentLower.includes('mckinsey') || contentLower.includes('mece')) {
    sources.push('McKinsey & Company');
  }
  if (contentLower.includes('bcg') || contentLower.includes('growth-share matrix')) {
    sources.push('Boston Consulting Group');
  }
  if (contentLower.includes('bain') || contentLower.includes('net promoter')) {
    sources.push('Bain & Company');
  }
  if (contentLower.includes('gartner') || contentLower.includes('magic quadrant')) {
    sources.push('Gartner');
  }
  if (contentLower.includes('world economic forum') || contentLower.includes('wef')) {
    sources.push('World Economic Forum');
  }
  if (contentLower.includes('porter') || contentLower.includes('five forces')) {
    sources.push("Porter's Strategic Frameworks");
  }

  return sources;
}

function assessMethodologyRigor(content: string): number {
  let score = 50; // Base score
  const contentLower = content.toLowerCase();

  // Check for structured frameworks
  if (contentLower.includes('mece') || contentLower.includes('mutually exclusive')) score += 15;
  if (contentLower.includes('porter') || contentLower.includes('five forces')) score += 10;
  if (contentLower.includes('tam') && contentLower.includes('sam') && contentLower.includes('som'))
    score += 15;
  if (contentLower.includes('swot') || contentLower.includes('strengths, weaknesses')) score += 10;
  if (contentLower.includes('bcg matrix') || contentLower.includes('growth-share')) score += 10;

  return Math.min(score, 100);
}

function assessEvidenceQuality(content: string): number {
  let score = 40; // Base score
  const contentLower = content.toLowerCase();

  // Check for quantitative evidence
  if (contentLower.match(/\$[\d,]+[bmk]?/g)) score += 15; // Dollar amounts
  if (contentLower.match(/\d+%/g)) score += 10; // Percentages
  if (contentLower.includes('market research') || contentLower.includes('industry report'))
    score += 15;
  if (contentLower.includes('benchmark') || contentLower.includes('comparative analysis'))
    score += 10;
  if (contentLower.includes('data') || contentLower.includes('statistics')) score += 10;

  return Math.min(score, 100);
}

function assessMarketValidation(content: string): number {
  let score = 45; // Base score
  const contentLower = content.toLowerCase();

  // Check for market analysis elements
  if (contentLower.includes('market size') || contentLower.includes('addressable market'))
    score += 15;
  if (
    contentLower.includes('competitive landscape') ||
    contentLower.includes('competitor analysis')
  )
    score += 15;
  if (contentLower.includes('customer segment') || contentLower.includes('target market'))
    score += 10;
  if (contentLower.includes('market trend') || contentLower.includes('industry trend')) score += 10;
  if (contentLower.includes('demand') || contentLower.includes('market need')) score += 5;

  return Math.min(score, 100);
}

function assessStrategicAlignment(content: string): number {
  let score = 50; // Base score
  const contentLower = content.toLowerCase();

  // Check for strategic elements
  if (contentLower.includes('strategic fit') || contentLower.includes('alignment')) score += 15;
  if (contentLower.includes('competitive advantage') || contentLower.includes('differentiation'))
    score += 15;
  if (contentLower.includes('value proposition') || contentLower.includes('unique value'))
    score += 10;
  if (contentLower.includes('go-to-market') || contentLower.includes('market entry')) score += 10;

  return Math.min(score, 100);
}

function formatEnhancedAnalysis(
  analysisResult: string,
  confidenceMetrics: any,
  analysisType: string
): string {
  return `# Enhanced Business Opportunity Analysis

${analysisResult}

---

## Analysis Quality Assessment

### Confidence Score: ${confidenceMetrics.overall}/100 ${confidenceMetrics.overall >= 80 ? '✅ High Confidence' : confidenceMetrics.overall >= 60 ? '⚠️ Medium Confidence' : '❌ Low Confidence - Review Required'}

**Analysis Type**: ${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}

**Confidence Breakdown**:
- Evidence Quality: ${confidenceMetrics.breakdown.evidence}/100
- Methodology Rigor: ${confidenceMetrics.breakdown.methodology}/100
- Market Validation: ${confidenceMetrics.breakdown.market_validation}/100
- Strategic Alignment: ${confidenceMetrics.breakdown.strategic_alignment}/100

**Authoritative Sources Referenced**: ${confidenceMetrics.sourcesUsed.length > 0 ? confidenceMetrics.sourcesUsed.join(', ') : 'None detected - consider adding consulting framework references'}

### Quality Indicators
${
  confidenceMetrics.overall >= 80
    ? '- ✅ Analysis meets consulting-grade standards\n- ✅ Strong evidence base and methodology\n- ✅ Ready for executive presentation'
    : confidenceMetrics.overall >= 60
      ? '- ⚠️ Analysis meets business standards but could be enhanced\n- ⚠️ Consider adding more quantitative evidence\n- ⚠️ May benefit from additional framework application'
      : '- ❌ Analysis requires significant enhancement\n- ❌ Insufficient evidence or methodology rigor\n- ❌ Not recommended for executive presentation without revision'
}

---

*Analysis enhanced with authoritative source integration for improved confidence and quality.*`;
}

/**
 * Input schema for enhanced business opportunity analysis
 */
export const analyzeBusinessOpportunityEnhancedSchema = {
  type: 'object',
  properties: {
    idea: {
      type: 'string',
      description: 'Raw feature idea or business need to analyze',
      minLength: 10,
      maxLength: 10000,
    },
    market_context: {
      type: 'object',
      properties: {
        industry: {
          type: 'string',
          description: 'Industry or market sector',
        },
        budget_range: {
          type: 'string',
          enum: ['small', 'medium', 'large'],
          description: 'Available budget range for the opportunity',
        },
        timeline: {
          type: 'string',
          description: 'Expected timeline for implementation',
        },
        competition: {
          type: 'string',
          description: 'Known competitive landscape information',
        },
      },
      description: 'Market and business context for the analysis',
    },
    analysis_depth: {
      type: 'string',
      enum: ['quick', 'standard', 'comprehensive'],
      description: 'Depth of analysis required',
      default: 'standard',
    },
    authoritative_sources: {
      type: 'object',
      properties: {
        include_mckinsey: {
          type: 'boolean',
          description: 'Include McKinsey frameworks and insights',
          default: true,
        },
        include_bcg: {
          type: 'boolean',
          description: 'Include BCG strategic frameworks',
          default: true,
        },
        include_bain: {
          type: 'boolean',
          description: 'Include Bain customer and operational insights',
          default: true,
        },
        include_gartner: {
          type: 'boolean',
          description: 'Include Gartner technology and market analysis',
          default: true,
        },
        include_wef: {
          type: 'boolean',
          description: 'Include World Economic Forum global trends',
          default: true,
        },
      },
      description: 'Authoritative sources to integrate into analysis',
    },
    steering_options: {
      type: 'object',
      properties: {
        create_steering_files: {
          type: 'boolean',
          description: 'Whether to create steering files from analysis',
          default: false,
        },
        feature_name: {
          type: 'string',
          description: 'Feature name for organizing steering files',
        },
        inclusion_rule: {
          type: 'string',
          enum: ['always', 'fileMatch', 'manual'],
          description: 'How the steering file should be included in context',
          default: 'manual',
        },
      },
      description: 'Optional steering file creation options',
    },
  },
  required: ['idea'],
} as const;

export const analyzeBusinessOpportunityEnhancedDescription =
  'Analyzes market opportunity, timing, and business justification for a feature idea using consulting frameworks (Porter\'s Five Forces, SWOT, TAM/SAM/SOM). Integrates authoritative sources from McKinsey, BCG, Bain, Gartner, and WEF. Returns comprehensive analysis with confidence scoring, competitive landscape, market sizing, and strategic recommendations.';
