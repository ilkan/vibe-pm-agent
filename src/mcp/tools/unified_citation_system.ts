/**
 * MCP Tool: unified_citation_system
 *
 * Unified citation system that consolidates enhance_citations, validate_and_audit_citations,
 * and trusted_citation_scraper into a single comprehensive tool with multiple operation modes.
 */

import { MCPToolResult, MCPToolContext, CitationOptions } from '../../models/mcp';
import { Citation, CitationConfidence, CitationMetrics } from '../../models/citations';
import { CitationIntegration, EnhancedCitationResult } from '../../utils/citation-integration';
import { TrustedSourceScraper, TrustedSourceScraperOptions } from '../../components/trusted-source-scraper';
import { SourceValidationEngine, ValidationResult } from '../../components/source-validation-engine';
import { QualityAssessmentSystem, QualityReport } from '../../components/quality-assessment-system';
import { AICitationDiscoveryEngine, CitationRequirement, UnsupportedClaim } from '../../components/ai-citation-discovery-engine';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * Operation modes for the unified citation system
 */
export type CitationOperationMode = 
  | 'enhance_content'      // Enhance existing content with citations
  | 'validate_citations'   // Validate and audit existing citations
  | 'discover_sources'     // Discover new trusted sources for a topic
  | 'comprehensive'        // Full workflow: discover, validate, enhance

/**
 * Input arguments for unified_citation_system tool
 */
export interface UnifiedCitationSystemArgs {
  /** Operation mode to execute */
  operation_mode: CitationOperationMode;
  
  /** Content to enhance (required for enhance_content and comprehensive modes) */
  document_content?: string;
  
  /** Existing citations to validate (required for validate_citations mode) */
  existing_citations?: Citation[];
  
  /** Search query for source discovery (required for discover_sources and comprehensive modes) */
  search_query?: string;
  
  /** Document type for appropriate citation standards */
  document_type?: 'business_case' | 'market_analysis' | 'executive_onepager' | 'pr_faq' | 'competitive_analysis';
  
  /** Citation configuration options */
  citation_options?: CitationOptions & {
    /** Maximum number of sources to discover */
    max_sources?: number;
    /** Minimum confidence level for sources */
    minimum_confidence?: 'high' | 'medium' | 'low';
    /** Industry focus for source discovery */
    industry_focus?: string;
    /** Geographic scope for sources */
    geographic_scope?: string;
    /** Include market data feeds */
    include_market_feeds?: boolean;
  };
  
  /** Validation and quality assessment options */
  validation_options?: {
    /** Whether to check source accessibility */
    check_accessibility?: boolean;
    /** Whether to assess source credibility */
    assess_credibility?: boolean;
    /** Whether to verify compliance requirements */
    verify_compliance?: boolean;
    /** Whether to find alternative sources for broken links */
    find_alternatives?: boolean;
    /** Timeout for accessibility checks */
    timeout?: number;
    /** Number of retry attempts */
    retry_attempts?: number;
    /** Minimum quality score threshold */
    minimum_quality_threshold?: number;
    /** Required source diversity score */
    required_diversity_score?: number;
    /** Maximum acceptable source age in months */
    max_source_age_months?: number;
  };
  
  /** Enhancement and discovery options */
  enhancement_options?: {
    /** Whether to identify unsupported claims */
    identify_unsupported_claims?: boolean;
    /** Whether to suggest additional sources */
    suggest_additional_sources?: boolean;
    /** Whether to perform comprehensive quality assessment */
    perform_quality_assessment?: boolean;
    /** Whether to generate improvement recommendations */
    generate_recommendations?: boolean;
  };
  
  /** Report generation options */
  report_options?: {
    /** Report format preference */
    report_format?: 'detailed' | 'summary' | 'executive';
    /** Whether to include validation details */
    include_validation_details?: boolean;
    /** Whether to include quality metrics */
    include_quality_metrics?: boolean;
    /** Whether to include recommendations */
    include_recommendations?: boolean;
    /** Whether to include alternative sources */
    include_alternatives?: boolean;
    /** Whether to generate evidence report */
    generate_evidence_report?: boolean;
  };
}

/**
 * Unified citation system result
 */
export interface UnifiedCitationResult {
  /** Operation mode that was executed */
  operation_mode: CitationOperationMode;
  
  /** Enhanced content (for enhance_content and comprehensive modes) */
  enhanced_content?: string;
  
  /** Discovered citations (for discover_sources and comprehensive modes) */
  discovered_citations?: Citation[];
  
  /** Validation results (for validate_citations and comprehensive modes) */
  validation_results?: ValidationResult[];
  
  /** Quality assessment report */
  quality_report?: QualityReport;
  
  /** Citation metrics */
  metrics?: CitationMetrics;
  
  /** Bibliography */
  bibliography?: string;
  
  /** Evidence report */
  evidence_report?: {
    evidence_strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
    key_findings: string[];
    critical_gaps: string[];
    improvement_priorities: string[];
    alternative_sources: Citation[];
  };
  
  /** Processing summary */
  summary: {
    total_citations_processed: number;
    citations_discovered: number;
    citations_validated: number;
    validation_success_rate: number;
    overall_quality_score: number;
    compliance_status: 'compliant' | 'warning' | 'non-compliant';
    processing_time_ms: number;
  };
  
  /** Recommendations for improvement */
  recommendations?: string[];
}

/**
 * MCP Tool: unified_citation_system
 *
 * Comprehensive citation management system with multiple operation modes
 */
export async function unifiedCitationSystem(
  args: UnifiedCitationSystemArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  const startTime = Date.now();

  try {
    // Validate arguments based on operation mode
    validateArguments(args);

    MCPLogger.debug('Starting unified citation system operation', context, {
      operationMode: args.operation_mode,
      documentType: args.document_type,
      hasContent: !!args.document_content,
      hasCitations: !!args.existing_citations,
      hasQuery: !!args.search_query,
      citationOptions: args.citation_options,
      validationOptions: args.validation_options,
      enhancementOptions: args.enhancement_options,
    });

    // Initialize components
    const citationIntegration = new CitationIntegration();
    const trustedScraper = new TrustedSourceScraper();
    const validationEngine = new SourceValidationEngine();
    const qualityAssessment = new QualityAssessmentSystem();
    const aiDiscovery = new AICitationDiscoveryEngine();

    // Set default options
    const citationOptions = setDefaultCitationOptions(args.citation_options);
    const validationOptions = setDefaultValidationOptions(args.validation_options);
    const enhancementOptions = setDefaultEnhancementOptions(args.enhancement_options);
    const reportOptions = setDefaultReportOptions(args.report_options);

    let result: UnifiedCitationResult;

    // Execute based on operation mode
    switch (args.operation_mode) {
      case 'enhance_content':
        result = await executeEnhanceContent(
          args,
          citationIntegration,
          aiDiscovery,
          citationOptions,
          enhancementOptions,
          context
        );
        break;

      case 'validate_citations':
        result = await executeValidateCitations(
          args,
          validationEngine,
          qualityAssessment,
          validationOptions,
          reportOptions,
          context
        );
        break;

      case 'discover_sources':
        result = await executeDiscoverSources(
          args,
          trustedScraper,
          validationEngine,
          citationOptions,
          validationOptions,
          context
        );
        break;

      case 'comprehensive':
        result = await executeComprehensiveWorkflow(
          args,
          citationIntegration,
          trustedScraper,
          validationEngine,
          qualityAssessment,
          aiDiscovery,
          citationOptions,
          validationOptions,
          enhancementOptions,
          reportOptions,
          context
        );
        break;

      default:
        throw new Error(`Unsupported operation mode: ${args.operation_mode}`);
    }

    // Add processing time to summary
    result.summary.processing_time_ms = Date.now() - startTime;

    MCPLogger.info('Unified citation system operation completed', context, {
      operationMode: args.operation_mode,
      totalCitations: result.summary.total_citations_processed,
      citationsDiscovered: result.summary.citations_discovered,
      citationsValidated: result.summary.citations_validated,
      validationSuccessRate: result.summary.validation_success_rate,
      qualityScore: result.summary.overall_quality_score,
      complianceStatus: result.summary.compliance_status,
      processingTime: result.summary.processing_time_ms,
    });

    // Format response based on operation mode and report options
    const responseContent = formatUnifiedCitationResponse(result, reportOptions);

    // Direct return with correct MCP format to fix Kiro interface compatibility
    return {
      content: [{
        type: 'text',
        text: responseContent,
      }],
      isError: false,
      metadata: {
        executionTime: result.summary.processing_time_ms,
        quotaUsed: calculateQuotaUsage(args.operation_mode, result.summary.total_citations_processed),
        operation: {
          mode: result.operation_mode,
          total_citations: result.summary.total_citations_processed,
          discovered: result.summary.citations_discovered,
          validated: result.summary.citations_validated,
          success_rate: result.summary.validation_success_rate,
          quality_score: result.summary.overall_quality_score,
          compliance_status: result.summary.compliance_status,
        },
        citations: result.metrics ? {
          total_citations: result.metrics.total_citations,
          unique_domains: result.metrics.unique_domains,
          credibility_score: result.metrics.credibility_score,
          recency_score: result.metrics.recency_score,
          diversity_score: result.metrics.diversity_score,
          average_confidence: result.metrics.average_confidence,
        } : undefined,
      },
    };

  } catch (error) {
    MCPLogger.error('unified_citation_system tool failed', error as Error, context, {
      operationMode: args?.operation_mode,
      documentType: args?.document_type,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in unified_citation_system'),
      context
    );
  }
}

/**
 * Execute enhance_content operation
 */
async function executeEnhanceContent(
  args: UnifiedCitationSystemArgs,
  citationIntegration: CitationIntegration,
  aiDiscovery: AICitationDiscoveryEngine,
  citationOptions: any,
  enhancementOptions: any,
  context: MCPToolContext
): Promise<UnifiedCitationResult> {
  if (!args.document_content) {
    throw new Error('document_content is required for enhance_content mode');
  }

  MCPLogger.debug('Executing enhance_content operation', context);

  // Analyze citation needs if requested
  let citationRequirements: CitationRequirement[] = [];
  let unsupportedClaims: UnsupportedClaim[] = [];

  if (enhancementOptions.identify_unsupported_claims) {
    try {
      citationRequirements = await aiDiscovery.analyzeCitationNeeds(args.document_content);
      unsupportedClaims = await aiDiscovery.identifyUnsupportedClaims(args.document_content);
    } catch (error) {
      MCPLogger.warn('AI citation analysis failed, proceeding with basic enhancement', context, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Integrate citations
  const citationResult = await citationIntegration.integrateCitations(
    args.document_type || 'business_case',
    args.document_content,
    citationOptions,
    citationOptions.industry_focus
  );

  // Discover additional sources if requested
  let additionalSources: Citation[] = [];
  if (enhancementOptions.suggest_additional_sources && citationRequirements.length > 0) {
    try {
      const sourceCandidates = await aiDiscovery.discoverRelevantSources(citationRequirements);
      additionalSources = sourceCandidates
        .filter(candidate => candidate.relevanceScore >= 70)
        .slice(0, 5)
        .map(candidate => candidate.source);
    } catch (error) {
      MCPLogger.warn('Additional source discovery failed', context, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    operation_mode: 'enhance_content',
    enhanced_content: citationResult.enhancedContent,
    discovered_citations: [...citationResult.citations, ...additionalSources],
    quality_report: citationResult.qualityReport,
    metrics: citationResult.metrics,
    bibliography: citationResult.bibliography,
    evidence_report: {
      evidence_strength: determineEvidenceStrength(citationResult.qualityReport.overallScore),
      key_findings: citationResult.citations.map(c => c.key_finding).filter(Boolean).slice(0, 5),
      critical_gaps: unsupportedClaims.filter(c => c.severity === 'critical').map(c => c.claim).slice(0, 3),
      improvement_priorities: citationResult.qualityReport.recommendations.slice(0, 3).map(r => r.description),
      alternative_sources: additionalSources,
    },
    summary: {
      total_citations_processed: citationResult.citations.length,
      citations_discovered: citationResult.citations.length,
      citations_validated: citationResult.validationResults.filter(v => v.accessibilityStatus.isAccessible).length,
      validation_success_rate: citationResult.validationResults.length > 0 
        ? Math.round((citationResult.validationResults.filter(v => v.accessibilityStatus.isAccessible).length / citationResult.validationResults.length) * 100)
        : 0,
      overall_quality_score: citationResult.qualityReport.overallScore,
      compliance_status: citationResult.qualityReport.complianceStatus,
      processing_time_ms: 0, // Will be set by caller
    },
    recommendations: citationResult.qualityReport.recommendations.map(r => r.description),
  };
}

/**
 * Execute validate_citations operation
 */
async function executeValidateCitations(
  args: UnifiedCitationSystemArgs,
  validationEngine: SourceValidationEngine,
  qualityAssessment: QualityAssessmentSystem,
  validationOptions: any,
  reportOptions: any,
  context: MCPToolContext
): Promise<UnifiedCitationResult> {
  if (!args.existing_citations || args.existing_citations.length === 0) {
    throw new Error('existing_citations is required for validate_citations mode');
  }

  MCPLogger.debug('Executing validate_citations operation', context);

  // Validate citations
  const validationResults = await validationEngine.validateCitations(args.existing_citations);
  
  // Assess quality
  const qualityReport = await qualityAssessment.assessCitationQuality(args.existing_citations);

  // Calculate metrics
  const citationIntegration = new CitationIntegration();
  const metrics = citationIntegration.getCitationRequirements(args.document_type || 'business_case');

  const validationsPassed = validationResults.filter(r => r.accessibilityStatus.isAccessible).length;
  const validationsFailed = validationResults.length - validationsPassed;

  return {
    operation_mode: 'validate_citations',
    validation_results: validationResults,
    quality_report: qualityReport,
    evidence_report: {
      evidence_strength: determineEvidenceStrength(qualityReport.overallScore),
      key_findings: args.existing_citations.map(c => c.key_finding).filter(Boolean).slice(0, 5),
      critical_gaps: qualityReport.qualityGaps.filter(g => g.severity === 'critical').map(g => g.description).slice(0, 3),
      improvement_priorities: qualityReport.recommendations.slice(0, 3).map(r => r.description),
      alternative_sources: validationResults.flatMap(r => r.alternativeSources).slice(0, 5),
    },
    summary: {
      total_citations_processed: args.existing_citations.length,
      citations_discovered: 0,
      citations_validated: args.existing_citations.length,
      validation_success_rate: Math.round((validationsPassed / args.existing_citations.length) * 100),
      overall_quality_score: qualityReport.overallScore,
      compliance_status: normalizeComplianceStatus(qualityReport.complianceStatus),
      processing_time_ms: 0, // Will be set by caller
    },
    recommendations: qualityReport.recommendations.map(r => r.description),
  };
}

/**
 * Execute discover_sources operation
 */
async function executeDiscoverSources(
  args: UnifiedCitationSystemArgs,
  trustedScraper: TrustedSourceScraper,
  validationEngine: SourceValidationEngine,
  citationOptions: any,
  validationOptions: any,
  context: MCPToolContext
): Promise<UnifiedCitationResult> {
  if (!args.search_query) {
    throw new Error('search_query is required for discover_sources mode');
  }

  MCPLogger.debug('Executing discover_sources operation', context);

  // Configure scraper options
  const scraperOptions: TrustedSourceScraperOptions = {
    industry: citationOptions.industry_focus,
    maxResults: citationOptions.max_sources || 6,
    minConfidence: mapConfidenceLevel(citationOptions.minimum_confidence || 'medium'),
    includeMarketFeeds: citationOptions.include_market_feeds || false,
  };

  // Discover trusted sources
  const trustedResult = await trustedScraper.collectTrustedCitations(args.search_query, scraperOptions);

  // Validate discovered sources if requested
  let validationResults: ValidationResult[] = [];
  if (validationOptions.check_accessibility || validationOptions.assess_credibility) {
    validationResults = await validationEngine.validateCitations(trustedResult.citations);
  }

  // Assess quality
  const qualityAssessment = new QualityAssessmentSystem();
  const qualityReport = await qualityAssessment.assessCitationQuality(trustedResult.citations);

  const validationsPassed = validationResults.length > 0 
    ? validationResults.filter(r => r.accessibilityStatus.isAccessible).length
    : trustedResult.citations.length; // Assume all pass if not validated

  return {
    operation_mode: 'discover_sources',
    discovered_citations: trustedResult.citations,
    validation_results: validationResults,
    quality_report: qualityReport,
    evidence_report: {
      evidence_strength: determineEvidenceStrength(qualityReport.overallScore),
      key_findings: trustedResult.citations.map(c => c.key_finding).filter(Boolean).slice(0, 5),
      critical_gaps: qualityReport.qualityGaps.filter(g => g.severity === 'critical').map(g => g.description).slice(0, 3),
      improvement_priorities: qualityReport.recommendations.slice(0, 3).map(r => r.description),
      alternative_sources: [],
    },
    summary: {
      total_citations_processed: trustedResult.citations.length,
      citations_discovered: trustedResult.citations.length,
      citations_validated: validationResults.length,
      validation_success_rate: validationResults.length > 0 
        ? Math.round((validationsPassed / validationResults.length) * 100)
        : 100,
      overall_quality_score: qualityReport.overallScore,
      compliance_status: normalizeComplianceStatus(qualityReport.complianceStatus),
      processing_time_ms: 0, // Will be set by caller
    },
    recommendations: qualityReport.recommendations.map(r => r.description),
  };
}

/**
 * Execute comprehensive workflow
 */
async function executeComprehensiveWorkflow(
  args: UnifiedCitationSystemArgs,
  citationIntegration: CitationIntegration,
  trustedScraper: TrustedSourceScraper,
  validationEngine: SourceValidationEngine,
  qualityAssessment: QualityAssessmentSystem,
  aiDiscovery: AICitationDiscoveryEngine,
  citationOptions: any,
  validationOptions: any,
  enhancementOptions: any,
  reportOptions: any,
  context: MCPToolContext
): Promise<UnifiedCitationResult> {
  MCPLogger.debug('Executing comprehensive workflow', context);

  let allCitations: Citation[] = [];
  let allValidationResults: ValidationResult[] = [];
  let enhancedContent = args.document_content || '';

  // Step 1: Discover sources if query provided
  if (args.search_query) {
    const discoverResult = await executeDiscoverSources(
      args,
      trustedScraper,
      validationEngine,
      citationOptions,
      validationOptions,
      context
    );
    allCitations.push(...(discoverResult.discovered_citations || []));
    allValidationResults.push(...(discoverResult.validation_results || []));
  }

  // Step 2: Validate existing citations if provided
  if (args.existing_citations && args.existing_citations.length > 0) {
    const validateResult = await executeValidateCitations(
      args,
      validationEngine,
      qualityAssessment,
      validationOptions,
      reportOptions,
      context
    );
    allCitations.push(...args.existing_citations);
    allValidationResults.push(...(validateResult.validation_results || []));
  }

  // Step 3: Enhance content if provided
  if (args.document_content) {
    // Use discovered and existing citations for enhancement
    const tempArgs = { ...args, existing_citations: allCitations };
    const enhanceResult = await executeEnhanceContent(
      tempArgs,
      citationIntegration,
      aiDiscovery,
      citationOptions,
      enhancementOptions,
      context
    );
    enhancedContent = enhanceResult.enhanced_content || enhancedContent;
    if (enhanceResult.discovered_citations) {
      allCitations.push(...enhanceResult.discovered_citations);
    }
  }

  // Final quality assessment
  const finalQualityReport = await qualityAssessment.assessCitationQuality(allCitations);

  const totalValidated = allValidationResults.length;
  const validationsPassed = allValidationResults.filter(r => r.accessibilityStatus.isAccessible).length;

  return {
    operation_mode: 'comprehensive',
    enhanced_content: enhancedContent,
    discovered_citations: allCitations,
    validation_results: allValidationResults,
    quality_report: finalQualityReport,
    evidence_report: {
      evidence_strength: determineEvidenceStrength(finalQualityReport.overallScore),
      key_findings: allCitations.map(c => c.key_finding).filter(Boolean).slice(0, 5),
      critical_gaps: finalQualityReport.qualityGaps.filter(g => g.severity === 'critical').map(g => g.description).slice(0, 3),
      improvement_priorities: finalQualityReport.recommendations.slice(0, 3).map(r => r.description),
      alternative_sources: allValidationResults.flatMap(r => r.alternativeSources).slice(0, 5),
    },
    summary: {
      total_citations_processed: allCitations.length,
      citations_discovered: allCitations.length - (args.existing_citations?.length || 0),
      citations_validated: totalValidated,
      validation_success_rate: totalValidated > 0 ? Math.round((validationsPassed / totalValidated) * 100) : 0,
      overall_quality_score: finalQualityReport.overallScore,
      compliance_status: normalizeComplianceStatus(finalQualityReport.complianceStatus),
      processing_time_ms: 0, // Will be set by caller
    },
    recommendations: finalQualityReport.recommendations.map(r => r.description),
  };
}

// Helper functions
function validateArguments(args: UnifiedCitationSystemArgs): void {
  if (!args || !args.operation_mode) {
    throw new Error('operation_mode is required');
  }

  switch (args.operation_mode) {
    case 'enhance_content':
      if (!args.document_content) {
        throw new Error('document_content is required for enhance_content mode');
      }
      break;
    case 'validate_citations':
      if (!args.existing_citations || args.existing_citations.length === 0) {
        throw new Error('existing_citations is required for validate_citations mode');
      }
      break;
    case 'discover_sources':
      if (!args.search_query) {
        throw new Error('search_query is required for discover_sources mode');
      }
      break;
    case 'comprehensive':
      if (!args.document_content && !args.existing_citations && !args.search_query) {
        throw new Error('At least one of document_content, existing_citations, or search_query is required for comprehensive mode');
      }
      break;
  }
}

function setDefaultCitationOptions(options: any = {}): any {
  return {
    include_citations: true,
    minimum_citations: 3,
    minimum_confidence: 'medium',
    citation_style: 'business',
    include_bibliography: true,
    max_citation_age_months: 24,
    validate_sources: true,
    assess_quality: true,
    calculate_confidence: true,
    max_sources: 6,
    geographic_scope: 'global',
    include_market_feeds: false,
    ...options,
  };
}

function setDefaultValidationOptions(options: any = {}): any {
  return {
    check_accessibility: true,
    assess_credibility: true,
    verify_compliance: true,
    find_alternatives: true,
    timeout: 10000,
    retry_attempts: 3,
    minimum_quality_threshold: 70,
    required_diversity_score: 60,
    max_source_age_months: 36,
    ...options,
  };
}

function setDefaultEnhancementOptions(options: any = {}): any {
  return {
    identify_unsupported_claims: true,
    suggest_additional_sources: true,
    perform_quality_assessment: true,
    generate_recommendations: true,
    ...options,
  };
}

function setDefaultReportOptions(options: any = {}): any {
  return {
    report_format: 'detailed',
    include_validation_details: true,
    include_quality_metrics: true,
    include_recommendations: true,
    include_alternatives: true,
    generate_evidence_report: true,
    ...options,
  };
}

function mapConfidenceLevel(confidence: string): CitationConfidence {
  switch (confidence.toLowerCase()) {
    case 'high': return CitationConfidence.HIGH;
    case 'low': return CitationConfidence.LOW;
    default: return CitationConfidence.MEDIUM;
  }
}

function determineEvidenceStrength(qualityScore: number): 'weak' | 'moderate' | 'strong' | 'very_strong' {
  if (qualityScore >= 85) return 'very_strong';
  if (qualityScore >= 70) return 'strong';
  if (qualityScore >= 55) return 'moderate';
  return 'weak';
}

function calculateQuotaUsage(mode: CitationOperationMode, citationCount: number): number {
  const baseQuota = {
    enhance_content: 3,
    validate_citations: 2,
    discover_sources: 2,
    comprehensive: 5,
  };
  
  return baseQuota[mode] + Math.ceil(citationCount / 5);
}

function normalizeComplianceStatus(status: string): 'compliant' | 'warning' | 'non-compliant' {
  if (status === 'non_compliant') return 'non-compliant';
  return status as 'compliant' | 'warning' | 'non-compliant';
}

function formatUnifiedCitationResponse(result: UnifiedCitationResult, reportOptions: any): string {
  let response = `# Unified Citation System Report\n\n`;
  
  // Executive Summary
  response += `## Executive Summary\n\n`;
  response += `**Operation Mode**: ${result.operation_mode.toUpperCase()}\n`;
  response += `**Overall Quality Score**: ${result.summary.overall_quality_score}/100\n`;
  response += `**Compliance Status**: ${result.summary.compliance_status.toUpperCase()}\n`;
  response += `**Citations Processed**: ${result.summary.total_citations_processed}\n`;
  
  if (result.summary.citations_discovered > 0) {
    response += `**Sources Discovered**: ${result.summary.citations_discovered}\n`;
  }
  
  if (result.summary.citations_validated > 0) {
    response += `**Validation Success Rate**: ${result.summary.validation_success_rate}%\n`;
  }
  
  response += `**Processing Time**: ${result.summary.processing_time_ms}ms\n\n`;

  // Enhanced Content
  if (result.enhanced_content && reportOptions.report_format !== 'summary') {
    response += `## Enhanced Content\n\n${result.enhanced_content}\n\n`;
  }

  // Quality Metrics
  if (result.quality_report && reportOptions.include_quality_metrics) {
    response += `## Quality Assessment\n\n`;
    response += `- **Source Credibility**: ${result.quality_report.metrics.sourceCredibility}/100\n`;
    response += `- **Evidence Diversity**: ${result.quality_report.metrics.evidenceDiversity}/100\n`;
    response += `- **Source Recency**: ${result.quality_report.metrics.recencyScore}/100\n`;
    response += `- **Methodology Transparency**: ${result.quality_report.metrics.methodologyTransparency}/100\n`;
    response += `- **Accessibility Score**: ${result.quality_report.metrics.accessibilityScore}/100\n`;
    response += `- **Compliance Score**: ${result.quality_report.metrics.complianceScore}/100\n\n`;
  }

  // Evidence Report
  if (result.evidence_report && reportOptions.generate_evidence_report) {
    response += `## Evidence Analysis\n\n`;
    response += `**Evidence Strength**: ${result.evidence_report.evidence_strength.toUpperCase()}\n\n`;
    
    if (result.evidence_report.key_findings.length > 0) {
      response += `### Key Findings\n`;
      result.evidence_report.key_findings.forEach((finding, index) => {
        response += `${index + 1}. ${finding}\n`;
      });
      response += `\n`;
    }
    
    if (result.evidence_report.critical_gaps.length > 0) {
      response += `### Critical Gaps\n`;
      result.evidence_report.critical_gaps.forEach((gap, index) => {
        response += `${index + 1}. ${gap}\n`;
      });
      response += `\n`;
    }
  }

  // Recommendations
  if (result.recommendations && result.recommendations.length > 0 && reportOptions.include_recommendations) {
    response += `## Recommendations\n\n`;
    result.recommendations.slice(0, 5).forEach((rec, index) => {
      response += `${index + 1}. ${rec}\n`;
    });
    response += `\n`;
  }

  // Bibliography
  if (result.bibliography) {
    response += `${result.bibliography}\n`;
  }

  response += `---\n*Report generated by Unified Citation System*\n`;
  
  return response;
}

/**
 * Input schema for unified_citation_system tool
 */
export const unifiedCitationSystemSchema = {
  type: 'object',
  properties: {
    operation_mode: {
      type: 'string',
      enum: ['enhance_content', 'validate_citations', 'discover_sources', 'comprehensive'],
      description: 'Operation mode to execute',
    },
    document_content: {
      type: 'string',
      description: 'Content to enhance (required for enhance_content and comprehensive modes)',
      maxLength: 50000,
    },
    existing_citations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
          domain: { type: 'string' },
          authors: { type: 'array', items: { type: 'string' } },
          organization: { type: 'string' },
          published_at: { type: 'string' },
          source_type: { type: 'string' },
          confidence: { type: 'string' },
          key_finding: { type: 'string' },
        },
        required: ['id', 'title', 'url', 'source_type', 'confidence'],
      },
      description: 'Existing citations to validate (required for validate_citations mode)',
    },
    search_query: {
      type: 'string',
      description: 'Search query for source discovery (required for discover_sources and comprehensive modes)',
      minLength: 5,
      maxLength: 500,
    },
    document_type: {
      type: 'string',
      enum: ['business_case', 'market_analysis', 'executive_onepager', 'pr_faq', 'competitive_analysis'],
      description: 'Document type for appropriate citation standards',
    },
    citation_options: {
      type: 'object',
      properties: {
        include_citations: { type: 'boolean', default: true },
        minimum_citations: { type: 'number', minimum: 1, maximum: 20, default: 3 },
        minimum_confidence: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium' },
        citation_style: { type: 'string', enum: ['business', 'apa', 'inline'], default: 'business' },
        include_bibliography: { type: 'boolean', default: true },
        max_citation_age_months: { type: 'number', minimum: 1, maximum: 120, default: 24 },
        max_sources: { type: 'number', minimum: 3, maximum: 12, default: 6 },
        industry_focus: { type: 'string' },
        geographic_scope: { type: 'string', default: 'global' },
        include_market_feeds: { type: 'boolean', default: false },
      },
    },
    validation_options: {
      type: 'object',
      properties: {
        check_accessibility: { type: 'boolean', default: true },
        assess_credibility: { type: 'boolean', default: true },
        verify_compliance: { type: 'boolean', default: true },
        find_alternatives: { type: 'boolean', default: true },
        timeout: { type: 'number', minimum: 1000, maximum: 30000, default: 10000 },
        retry_attempts: { type: 'number', minimum: 1, maximum: 5, default: 3 },
        minimum_quality_threshold: { type: 'number', minimum: 0, maximum: 100, default: 70 },
        required_diversity_score: { type: 'number', minimum: 0, maximum: 100, default: 60 },
        max_source_age_months: { type: 'number', minimum: 1, maximum: 120, default: 36 },
      },
    },
    enhancement_options: {
      type: 'object',
      properties: {
        identify_unsupported_claims: { type: 'boolean', default: true },
        suggest_additional_sources: { type: 'boolean', default: true },
        perform_quality_assessment: { type: 'boolean', default: true },
        generate_recommendations: { type: 'boolean', default: true },
      },
    },
    report_options: {
      type: 'object',
      properties: {
        report_format: { type: 'string', enum: ['detailed', 'summary', 'executive'], default: 'detailed' },
        include_validation_details: { type: 'boolean', default: true },
        include_quality_metrics: { type: 'boolean', default: true },
        include_recommendations: { type: 'boolean', default: true },
        include_alternatives: { type: 'boolean', default: true },
        generate_evidence_report: { type: 'boolean', default: true },
      },
    },
  },
  required: ['operation_mode'],
} as const;

/**
 * Tool description for MCP registration
 */
export const unifiedCitationSystemDescription = 
  'Unified citation management system with multiple operation modes: enhance_content (add citations to content), validate_citations (audit existing citations), discover_sources (find new trusted sources), and comprehensive (full workflow). Provides source validation, quality assessment, compliance checking, and evidence reporting in a single integrated tool.';