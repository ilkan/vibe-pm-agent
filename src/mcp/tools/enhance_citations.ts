/**
 * MCP Tool: enhance_citations
 *
 * Takes existing document content and enhances it with comprehensive citations,
 * quality validation, and confidence scoring. Supports multiple citation formats
 * and provides detailed quality assessment.
 */

import { MCPToolResult, MCPToolContext, CitationOptions } from '../../models/mcp';
import { CitationIntegration } from '../../utils/citation-integration';
import {
  AICitationDiscoveryEngine,
  CitationRequirement,
  UnsupportedClaim,
} from '../../components/ai-citation-discovery-engine';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * Input arguments for enhance_citations tool
 */
export interface EnhanceCitationsArgs {
  /** Document content to enhance with citations */
  document_content: string;
  /** Type of document for appropriate citation standards */
  document_type:
    | 'business_case'
    | 'market_analysis'
    | 'executive_onepager'
    | 'pr_faq'
    | 'competitive_analysis';
  /** Enhancement options for citation processing */
  enhancement_options?: {
    /** Minimum confidence threshold (0-100) */
    minimum_confidence?: number;
    /** Source diversity requirement (0-100) */
    source_diversity_requirement?: number;
    /** Recency requirement in months */
    recency_requirement_months?: number;
    /** Industry focus for relevant sources */
    industry_focus?: string;
    /** Geographic scope for sources */
    geographic_scope?: string;
    /** Whether to identify unsupported claims */
    identify_unsupported_claims?: boolean;
    /** Whether to suggest additional sources */
    suggest_additional_sources?: boolean;
    /** Whether to perform comprehensive quality assessment */
    perform_quality_assessment?: boolean;
  };
  /** Citation formatting and validation options */
  citation_options?: CitationOptions;
}

/**
 * MCP Tool: enhance_citations
 *
 * Enhances document content with comprehensive citations, validation, and quality assessment
 */
export async function enhanceCitations(
  args: EnhanceCitationsArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    // Validate required arguments
    if (
      !args ||
      typeof args.document_content !== 'string' ||
      args.document_content.trim().length === 0
    ) {
      throw new Error(
        'Validation failed: document_content is required and must be a non-empty string'
      );
    }

    if (!args.document_type) {
      throw new Error('Validation failed: document_type is required');
    }

    MCPLogger.debug('Starting citation enhancement', context, {
      contentLength: args.document_content.length,
      documentType: args.document_type,
      enhancementOptions: args.enhancement_options,
      citationOptions: args.citation_options,
    });

    // Initialize citation integration and AI discovery engine
    const citationIntegration = new CitationIntegration();
    const aiDiscoveryEngine = new AICitationDiscoveryEngine();

    // Set default enhancement options
    const enhancementOptions = {
      minimum_confidence: args.enhancement_options?.minimum_confidence ?? 70,
      source_diversity_requirement: args.enhancement_options?.source_diversity_requirement ?? 60,
      recency_requirement_months: args.enhancement_options?.recency_requirement_months ?? 24,
      industry_focus: args.enhancement_options?.industry_focus ?? '',
      geographic_scope: args.enhancement_options?.geographic_scope ?? 'global',
      identify_unsupported_claims: args.enhancement_options?.identify_unsupported_claims ?? true,
      suggest_additional_sources: args.enhancement_options?.suggest_additional_sources ?? true,
      perform_quality_assessment: args.enhancement_options?.perform_quality_assessment ?? true,
      ...args.enhancement_options,
    };

    // Set default citation options with enhanced validation
    const citationOptions: CitationOptions = {
      include_citations: true,
      minimum_citations: 3,
      minimum_confidence: 'medium',
      citation_style: 'business',
      include_bibliography: true,
      max_citation_age_months: enhancementOptions.recency_requirement_months,
      validate_sources: true,
      assess_quality: true,
      calculate_confidence: true,
      find_alternatives: true,
      minimum_quality_score: enhancementOptions.minimum_confidence,
      show_confidence_indicators: true,
      include_quality_report: true,
      filter_low_quality: true,
      industry_focus: enhancementOptions.industry_focus,
      geographic_scope: enhancementOptions.geographic_scope,
      ...args.citation_options,
    };

    MCPLogger.info('Citation enhancement configuration set', context, {
      minimumConfidence: enhancementOptions.minimum_confidence,
      diversityRequirement: enhancementOptions.source_diversity_requirement,
      recencyMonths: enhancementOptions.recency_requirement_months,
      validateSources: citationOptions.validate_sources,
      assessQuality: citationOptions.assess_quality,
    });

    // Step 1: Analyze citation needs using AI discovery
    let citationRequirements: CitationRequirement[] = [];
    let unsupportedClaims: UnsupportedClaim[] = [];

    if (enhancementOptions.identify_unsupported_claims) {
      MCPLogger.debug('Analyzing citation needs with AI discovery', context);

      try {
        citationRequirements = await aiDiscoveryEngine.analyzeCitationNeeds(args.document_content);
        unsupportedClaims = await aiDiscoveryEngine.identifyUnsupportedClaims(
          args.document_content
        );

        MCPLogger.info('Citation needs analysis completed', context, {
          requirementsFound: citationRequirements.length,
          unsupportedClaimsFound: unsupportedClaims.length,
          criticalClaims: unsupportedClaims.filter(c => c.severity === 'critical').length,
        });
      } catch (discoveryError) {
        MCPLogger.warn('AI citation discovery failed, proceeding with basic enhancement', context, {
          error: discoveryError instanceof Error ? discoveryError.message : 'Unknown error',
        });
      }
    }

    // Step 2: Integrate enhanced citations with validation and quality assessment
    MCPLogger.debug('Integrating enhanced citations', context);

    const citationResult = await citationIntegration.integrateCitations(
      args.document_type,
      args.document_content,
      citationOptions,
      enhancementOptions.industry_focus
    );

    // Step 3: Discover additional relevant sources if requested
    let additionalSources: any[] = [];
    if (enhancementOptions.suggest_additional_sources && citationRequirements.length > 0) {
      MCPLogger.debug('Discovering additional relevant sources', context);

      try {
        const sourceCandidates =
          await aiDiscoveryEngine.discoverRelevantSources(citationRequirements);
        additionalSources = sourceCandidates
          .filter(candidate => candidate.relevanceScore >= enhancementOptions.minimum_confidence)
          .slice(0, 5) // Limit to top 5 suggestions
          .map(candidate => ({
            source: candidate.source,
            relevanceScore: candidate.relevanceScore,
            supportedClaims: candidate.supportedClaims,
            matchingKeywords: candidate.matchingKeywords,
          }));

        MCPLogger.info('Additional sources discovered', context, {
          candidatesFound: sourceCandidates.length,
          qualifiedSources: additionalSources.length,
          averageRelevance:
            additionalSources.length > 0
              ? Math.round(
                  additionalSources.reduce((sum, s) => sum + s.relevanceScore, 0) /
                    additionalSources.length
                )
              : 0,
        });
      } catch (discoveryError) {
        MCPLogger.warn('Additional source discovery failed', context, {
          error: discoveryError instanceof Error ? discoveryError.message : 'Unknown error',
        });
      }
    }

    // Step 4: Assess overall quality and compliance
    const qualityAssessment = {
      overallScore: citationResult.qualityReport.overallScore,
      complianceStatus: citationResult.qualityReport.complianceStatus,
      strengthAreas: citationResult.qualityReport.strengthAreas,
      improvementAreas: citationResult.qualityReport.improvementAreas,
      qualityGaps: citationResult.qualityReport.qualityGaps.length,
      recommendations: citationResult.qualityReport.recommendations.length,
    };

    // Step 5: Generate enhancement summary
    const enhancementSummary = generateEnhancementSummary(
      args.document_content,
      citationResult,
      citationRequirements,
      unsupportedClaims,
      additionalSources,
      qualityAssessment
    );

    // Step 6: Create final enhanced content
    let finalContent = citationResult.enhancedContent;

    // Add enhancement summary if quality assessment was performed
    if (enhancementOptions.perform_quality_assessment) {
      finalContent += `\n\n${enhancementSummary}`;
    }

    MCPLogger.info('Citation enhancement completed successfully', context, {
      originalLength: args.document_content.length,
      enhancedLength: finalContent.length,
      citationsAdded: citationResult.citations.length,
      qualityScore: qualityAssessment.overallScore,
      complianceStatus: qualityAssessment.complianceStatus,
      confidenceScore: citationResult.confidenceScores.overallConfidence,
      validationsPassed: citationResult.validationResults.filter(
        v => v.accessibilityStatus.isAccessible
      ).length,
      validationsFailed: citationResult.validationResults.filter(
        v => !v.accessibilityStatus.isAccessible
      ).length,
    });

    // Format the response with comprehensive metadata
    return MCPResponseFormatter.formatSuccess(finalContent, 'markdown', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 3, // Citation enhancement typically uses 3 quota units
      citations: {
        total_citations: citationResult.citations.length,
        credibility_score: citationResult.metrics.credibility_score,
        recency_score: citationResult.metrics.recency_score,
        diversity_score: citationResult.metrics.diversity_score,
        bibliography_included: citationOptions.include_bibliography || false,
        quality_score: qualityAssessment.overallScore,
        overall_confidence: citationResult.confidenceScores.overallConfidence,
        compliance_status: qualityAssessment.complianceStatus,
        validations_passed: citationResult.validationResults.filter(
          (v: any) => v.accessibilityStatus.isAccessible
        ).length,
        validations_failed: citationResult.validationResults.filter(
          (v: any) => !v.accessibilityStatus.isAccessible
        ).length,
        broken_links: citationResult.validationResults.filter(
          (v: any) => v.accessibilityStatus.accessType === 'broken'
        ).length,
        alternative_sources_found: additionalSources.length,
      },
      enhancement: {
        citation_requirements_identified: citationRequirements.length,
        unsupported_claims_found: unsupportedClaims.length,
        critical_claims: unsupportedClaims.filter(c => c.severity === 'critical').length,
        additional_sources_suggested: additionalSources.length,
        quality_gaps_identified: qualityAssessment.qualityGaps,
        improvement_recommendations: qualityAssessment.recommendations,
        content_length_increase:
          (
            ((finalContent.length - args.document_content.length) / args.document_content.length) *
            100
          ).toFixed(1) + '%',
      },
    });
  } catch (error) {
    MCPLogger.error('enhance_citations tool failed', error as Error, context, {
      contentLength: args.document_content?.length,
      documentType: args.document_type,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in enhance_citations'),
      context
    );
  }
}

/**
 * Generate comprehensive enhancement summary
 */
function generateEnhancementSummary(
  originalContent: string,
  citationResult: any,
  citationRequirements: any[],
  unsupportedClaims: any[],
  additionalSources: any[],
  qualityAssessment: any
): string {
  let summary = `## Citation Enhancement Summary\n\n`;

  // Overall enhancement metrics
  summary += `### Enhancement Metrics\n`;
  summary += `- **Citations Added**: ${citationResult.citations.length}\n`;
  summary += `- **Quality Score**: ${qualityAssessment.overallScore}/100\n`;
  summary += `- **Compliance Status**: ${qualityAssessment.complianceStatus}\n`;
  summary += `- **Overall Confidence**: ${citationResult.confidenceScores.overallConfidence}%\n`;
  summary += `- **Content Expansion**: ${(((citationResult.enhancedContent.length - originalContent.length) / originalContent.length) * 100).toFixed(1)}%\n\n`;

  // Citation quality breakdown
  if (citationResult.metrics) {
    summary += `### Citation Quality Breakdown\n`;
    summary += `- **Source Credibility**: ${citationResult.metrics.credibility_score}/100\n`;
    summary += `- **Source Diversity**: ${citationResult.metrics.diversity_score}/100\n`;
    summary += `- **Recency Score**: ${citationResult.metrics.recency_score}/100\n`;
    summary += `- **Unique Domains**: ${citationResult.metrics.unique_domains}\n\n`;
  }

  // Validation results
  if (citationResult.validationResults && citationResult.validationResults.length > 0) {
    const accessibleSources = citationResult.validationResults.filter(
      (v: any) => v.accessibilityStatus.isAccessible
    ).length;
    const brokenSources = citationResult.validationResults.filter(
      (v: any) => v.accessibilityStatus.accessType === 'broken'
    ).length;

    summary += `### Source Validation Results\n`;
    summary += `- **Accessible Sources**: ${accessibleSources}/${citationResult.validationResults.length}\n`;
    if (brokenSources > 0) {
      summary += `- **Broken Links**: ${brokenSources} (alternatives suggested)\n`;
    }
    summary += `\n`;
  }

  // Unsupported claims analysis
  if (unsupportedClaims.length > 0) {
    summary += `### Unsupported Claims Analysis\n`;
    summary += `- **Total Unsupported Claims**: ${unsupportedClaims.length}\n`;

    const criticalClaims = unsupportedClaims.filter(c => c.severity === 'critical');
    const highClaims = unsupportedClaims.filter(c => c.severity === 'high');

    if (criticalClaims.length > 0) {
      summary += `- **Critical Claims**: ${criticalClaims.length} (require immediate attention)\n`;
    }
    if (highClaims.length > 0) {
      summary += `- **High Priority Claims**: ${highClaims.length}\n`;
    }
    summary += `\n`;
  }

  // Additional source suggestions
  if (additionalSources.length > 0) {
    summary += `### Additional Source Suggestions\n`;
    summary += `Found ${additionalSources.length} additional high-relevance sources:\n\n`;

    additionalSources.slice(0, 3).forEach((source, index) => {
      summary += `${index + 1}. **${source.source.title}** (${source.relevanceScore}% relevance)\n`;
      summary += `   - Organization: ${source.source.organization}\n`;
      summary += `   - Supports: ${source.supportedClaims.slice(0, 2).join(', ')}\n`;
      summary += `   - URL: ${source.source.url}\n\n`;
    });
  }

  // Quality improvement recommendations
  if (qualityAssessment.improvementAreas && qualityAssessment.improvementAreas.length > 0) {
    summary += `### Improvement Recommendations\n`;
    qualityAssessment.improvementAreas.slice(0, 3).forEach((area: string, index: number) => {
      summary += `${index + 1}. ${area}\n`;
    });
    summary += `\n`;
  }

  // Strength areas
  if (qualityAssessment.strengthAreas && qualityAssessment.strengthAreas.length > 0) {
    summary += `### Citation Strengths\n`;
    qualityAssessment.strengthAreas.forEach((strength: string, index: number) => {
      summary += `- ${strength}\n`;
    });
    summary += `\n`;
  }

  summary += `*Enhancement completed with comprehensive validation and quality assessment.*\n`;

  return summary;
}

/**
 * Input schema for enhance_citations tool
 */
export const enhanceCitationsSchema = {
  type: 'object',
  properties: {
    document_content: {
      type: 'string',
      description: 'Document content to enhance with citations',
      minLength: 50,
      maxLength: 50000,
    },
    document_type: {
      type: 'string',
      enum: [
        'business_case',
        'market_analysis',
        'executive_onepager',
        'pr_faq',
        'competitive_analysis',
      ],
      description: 'Type of document for appropriate citation standards',
    },
    enhancement_options: {
      type: 'object',
      properties: {
        minimum_confidence: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Minimum confidence threshold for citations (0-100)',
          default: 70,
        },
        source_diversity_requirement: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Required source diversity score (0-100)',
          default: 60,
        },
        recency_requirement_months: {
          type: 'number',
          minimum: 1,
          maximum: 120,
          description: 'Maximum age of sources in months',
          default: 24,
        },
        industry_focus: {
          type: 'string',
          description: 'Industry focus for relevant sources',
        },
        geographic_scope: {
          type: 'string',
          description: 'Geographic scope for sources (e.g., global, US, Europe)',
          default: 'global',
        },
        identify_unsupported_claims: {
          type: 'boolean',
          description: 'Whether to identify claims lacking citation support',
          default: true,
        },
        suggest_additional_sources: {
          type: 'boolean',
          description: 'Whether to suggest additional relevant sources',
          default: true,
        },
        perform_quality_assessment: {
          type: 'boolean',
          description: 'Whether to perform comprehensive quality assessment',
          default: true,
        },
      },
      description: 'Enhancement options for citation processing',
    },
    citation_options: {
      type: 'object',
      properties: {
        include_citations: {
          type: 'boolean',
          description: 'Whether to include citations and references',
          default: true,
        },
        minimum_citations: {
          type: 'number',
          minimum: 1,
          maximum: 20,
          description: 'Minimum number of citations required',
          default: 3,
        },
        minimum_confidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Required confidence level for citations',
          default: 'medium',
        },
        citation_style: {
          type: 'string',
          enum: ['business', 'apa', 'inline'],
          description: 'Citation formatting style',
          default: 'business',
        },
        include_bibliography: {
          type: 'boolean',
          description: 'Whether to include bibliography section',
          default: true,
        },
        validate_sources: {
          type: 'boolean',
          description: 'Whether to validate source accessibility',
          default: true,
        },
        assess_quality: {
          type: 'boolean',
          description: 'Whether to perform quality assessment',
          default: true,
        },
        calculate_confidence: {
          type: 'boolean',
          description: 'Whether to calculate confidence scores',
          default: true,
        },
        show_confidence_indicators: {
          type: 'boolean',
          description: 'Whether to show confidence indicators in content',
          default: true,
        },
        filter_low_quality: {
          type: 'boolean',
          description: 'Whether to filter out low-quality sources',
          default: true,
        },
      },
      description: 'Citation formatting and validation options',
    },
  },
  required: ['document_content', 'document_type'],
} as const;

/**
 * Tool description for MCP registration
 */
export const enhanceCitationsDescription =
  'Enhances content with authoritative citations and source validation. Analyzes citation needs, validates source accessibility and credibility, identifies unsupported claims, suggests additional sources, and provides comprehensive quality assessment with confidence scoring and improvement recommendations.';
