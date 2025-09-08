/**
 * MCP Tool: validate_and_audit_citations
 * 
 * Comprehensive citation validation and quality auditing tool that combines
 * source validation, credibility assessment, and quality auditing in a single
 * consolidated workflow. Supports both individual source validation and 
 * full document citation auditing.
 */

import { MCPToolResult, MCPToolContext, CitationOptions } from '../../models/mcp';
import { Citation, EnhancedCitation, CitationSourceType, CitationConfidence } from '../../models/citations';
import { SourceValidationEngine, ValidationResult } from '../../components/source-validation-engine';
import { QualityAssessmentSystem, QualityReport, QualityGap } from '../../components/quality-assessment-system';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

/**
 * Input arguments for validate_and_audit_citations tool
 */
export interface ValidateAndAuditCitationsArgs {
  /** Citations to validate and audit */
  citations: Citation[];
  /** Optional document content for context-aware validation */
  document_content?: string;
  /** Type of document for appropriate validation standards */
  document_type?: 'business_case' | 'market_analysis' | 'executive_onepager' | 'pr_faq' | 'competitive_analysis';
  /** Validation configuration options */
  validation_options?: {
    /** Whether to check source accessibility */
    check_accessibility?: boolean;
    /** Whether to assess source credibility */
    assess_credibility?: boolean;
    /** Whether to verify compliance requirements */
    verify_compliance?: boolean;
    /** Whether to find alternative sources for broken links */
    find_alternatives?: boolean;
    /** Timeout for accessibility checks in milliseconds */
    timeout?: number;
    /** Number of retry attempts for failed validations */
    retry_attempts?: number;
    /** Compliance standards to check against */
    compliance_standards?: string[];
  };
  /** Quality audit configuration options */
  audit_options?: {
    /** Whether to perform comprehensive quality assessment */
    perform_quality_assessment?: boolean;
    /** Whether to identify quality gaps */
    identify_quality_gaps?: boolean;
    /** Whether to generate improvement recommendations */
    generate_recommendations?: boolean;
    /** Minimum quality score threshold (0-100) */
    minimum_quality_threshold?: number;
    /** Required source diversity score (0-100) */
    required_diversity_score?: number;
    /** Maximum acceptable source age in months */
    max_source_age_months?: number;
    /** Whether to require methodology transparency */
    require_methodology?: boolean;
    /** Minimum sample size for research sources */
    minimum_sample_size?: number;
  };
  /** Evidence report generation options */
  report_options?: {
    /** Whether to generate comprehensive evidence report */
    generate_evidence_report?: boolean;
    /** Whether to include detailed validation results */
    include_validation_details?: boolean;
    /** Whether to include quality metrics breakdown */
    include_quality_metrics?: boolean;
    /** Whether to include improvement recommendations */
    include_recommendations?: boolean;
    /** Whether to include alternative source suggestions */
    include_alternatives?: boolean;
    /** Report format preference */
    report_format?: 'detailed' | 'summary' | 'executive';
  };
}

/**
 * Comprehensive validation and audit result
 */
export interface ValidationAndAuditResult {
  /** Overall validation and audit summary */
  summary: {
    total_citations: number;
    validation_passed: number;
    validation_failed: number;
    overall_quality_score: number;
    compliance_status: 'compliant' | 'warning' | 'non-compliant';
    critical_issues: number;
    high_priority_issues: number;
  };
  /** Individual citation validation results */
  validation_results: ValidationResult[];
  /** Comprehensive quality assessment report */
  quality_report: QualityReport;
  /** Evidence report with recommendations */
  evidence_report: {
    evidence_strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
    key_findings: string[];
    critical_gaps: string[];
    improvement_priorities: string[];
    alternative_sources: Citation[];
  };
  /** Detailed audit trail */
  audit_trail: {
    validation_timestamp: Date;
    validation_duration_ms: number;
    sources_checked: number;
    accessibility_checks: number;
    credibility_assessments: number;
    compliance_validations: number;
    alternatives_found: number;
  };
}

/**
 * MCP Tool: validate_and_audit_citations
 * 
 * Performs comprehensive validation and quality auditing of citations with
 * detailed reporting and improvement recommendations
 */
export async function validateAndAuditCitations(
  args: ValidateAndAuditCitationsArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  const startTime = Date.now();
  
  try {
    // Validate required arguments
    if (!args || !args.citations || !Array.isArray(args.citations) || args.citations.length === 0) {
      throw new Error('Validation failed: citations array is required and must contain at least one citation');
    }

    MCPLogger.debug('Starting comprehensive citation validation and audit', context, {
      citationCount: args.citations.length,
      documentType: args.document_type,
      hasDocumentContent: !!args.document_content,
      validationOptions: args.validation_options,
      auditOptions: args.audit_options,
      reportOptions: args.report_options,
    });

    // Set default options
    const validationOptions = {
      check_accessibility: true,
      assess_credibility: true,
      verify_compliance: true,
      find_alternatives: true,
      timeout: 10000,
      retry_attempts: 3,
      compliance_standards: ['academic', 'business', 'regulatory'],
      ...args.validation_options,
    };

    const auditOptions = {
      perform_quality_assessment: true,
      identify_quality_gaps: true,
      generate_recommendations: true,
      minimum_quality_threshold: 70,
      required_diversity_score: 60,
      max_source_age_months: 36,
      require_methodology: false,
      minimum_sample_size: 100,
      ...args.audit_options,
    };

    const reportOptions = {
      generate_evidence_report: true,
      include_validation_details: true,
      include_quality_metrics: true,
      include_recommendations: true,
      include_alternatives: true,
      report_format: 'detailed' as const,
      ...args.report_options,
    };

    MCPLogger.info('Configuration set for validation and audit', context, {
      checkAccessibility: validationOptions.check_accessibility,
      assessCredibility: validationOptions.assess_credibility,
      verifyCompliance: validationOptions.verify_compliance,
      qualityThreshold: auditOptions.minimum_quality_threshold,
      diversityRequirement: auditOptions.required_diversity_score,
      maxAgeMonths: auditOptions.max_source_age_months,
      reportFormat: reportOptions.report_format,
    });

    // Initialize validation and assessment engines
    const validationEngine = new SourceValidationEngine({
      timeout: validationOptions.timeout,
      retryAttempts: validationOptions.retry_attempts,
      complianceStandards: validationOptions.compliance_standards,
    });

    const qualityAssessmentSystem = new QualityAssessmentSystem();

    // Step 1: Perform comprehensive source validation
    MCPLogger.debug('Starting source validation phase', context);
    
    const validationResults: ValidationResult[] = [];
    let accessibilityChecks = 0;
    let credibilityAssessments = 0;
    let complianceValidations = 0;
    let alternativesFound = 0;

    for (const citation of args.citations) {
      try {
        const validationResult = await validationEngine.validateCitation(citation);
        validationResults.push(validationResult);

        // Count validation activities
        if (validationOptions.check_accessibility) accessibilityChecks++;
        if (validationOptions.assess_credibility) credibilityAssessments++;
        if (validationOptions.verify_compliance) complianceValidations++;
        alternativesFound += validationResult.alternativeSources.length;

        MCPLogger.debug('Citation validated', context, {
          citationId: citation.id,
          accessible: validationResult.accessibilityStatus.isAccessible,
          credibilityScore: validationResult.credibilityAssessment.overallScore,
          compliant: validationResult.complianceStatus.isCompliant,
          alternativesFound: validationResult.alternativeSources.length,
        });
      } catch (validationError) {
        MCPLogger.warn('Citation validation failed', context, {
          citationId: citation.id,
          error: validationError instanceof Error ? validationError.message : 'Unknown error',
        });

        // Create failed validation result
        validationResults.push({
          citation,
          accessibilityStatus: {
            isAccessible: false,
            accessType: 'broken',
            lastChecked: new Date(),
            alternativeAccess: [],
            cacheAvailable: false,
            errorMessage: validationError instanceof Error ? validationError.message : 'Validation failed',
          },
          credibilityAssessment: {
            overallScore: 0,
            factors: {
              domainAuthority: 0,
              authorCredentials: 0,
              peerReviewStatus: 0,
              citationFrequency: 0,
              methodologyTransparency: 0,
            },
            riskFactors: ['Validation failed'],
            confidenceLevel: 'low',
            assessmentDate: new Date(),
          },
          complianceStatus: {
            isCompliant: false,
            checkedStandards: validationOptions.compliance_standards,
            violations: ['Validation failed'],
            recommendations: ['Fix validation issues'],
            lastChecked: new Date(),
          },
          alternativeSources: [],
          validationTimestamp: new Date(),
        });
      }
    }

    const validationPassed = validationResults.filter(r => r.accessibilityStatus.isAccessible).length;
    const validationFailed = validationResults.length - validationPassed;

    MCPLogger.info('Source validation completed', context, {
      totalCitations: args.citations.length,
      validationPassed,
      validationFailed,
      accessibilityChecks,
      credibilityAssessments,
      complianceValidations,
      alternativesFound,
    });

    // Step 2: Perform comprehensive quality assessment
    MCPLogger.debug('Starting quality assessment phase', context);
    
    let qualityReport: QualityReport;
    
    if (auditOptions.perform_quality_assessment) {
      qualityReport = await qualityAssessmentSystem.assessCitationQuality(args.citations);
      
      MCPLogger.info('Quality assessment completed', context, {
        overallScore: qualityReport.overallScore,
        complianceStatus: qualityReport.complianceStatus,
        qualityGaps: qualityReport.qualityGaps.length,
        recommendations: qualityReport.recommendations.length,
        strengthAreas: qualityReport.strengthAreas.length,
        improvementAreas: qualityReport.improvementAreas.length,
      });
    } else {
      // Create minimal quality report
      qualityReport = {
        overallScore: 0,
        metrics: {
          sourceCredibility: 0,
          evidenceDiversity: 0,
          recencyScore: 0,
          methodologyTransparency: 0,
          sampleSizeAdequacy: 0,
          accessibilityScore: 0,
          complianceScore: 0,
        },
        qualityGaps: [],
        recommendations: [],
        complianceStatus: 'non-compliant',
        assessmentDate: new Date(),
        citationCount: args.citations.length,
        strengthAreas: [],
        improvementAreas: [],
      };
    }

    // Step 3: Generate evidence report
    MCPLogger.debug('Generating evidence report', context);
    
    const evidenceReport = generateEvidenceReport(
      args.citations,
      validationResults,
      qualityReport,
      args.document_content,
      reportOptions
    );

    // Step 4: Create comprehensive audit trail
    const validationDuration = Date.now() - startTime;
    const auditTrail = {
      validation_timestamp: new Date(),
      validation_duration_ms: validationDuration,
      sources_checked: args.citations.length,
      accessibility_checks: accessibilityChecks,
      credibility_assessments: credibilityAssessments,
      compliance_validations: complianceValidations,
      alternatives_found: alternativesFound,
    };

    // Step 5: Create summary
    const criticalIssues = qualityReport.qualityGaps.filter(gap => gap.severity === 'critical').length;
    const highPriorityIssues = qualityReport.qualityGaps.filter(gap => gap.severity === 'high').length;

    const summary = {
      total_citations: args.citations.length,
      validation_passed: validationPassed,
      validation_failed: validationFailed,
      overall_quality_score: qualityReport.overallScore,
      compliance_status: qualityReport.complianceStatus,
      critical_issues: criticalIssues,
      high_priority_issues: highPriorityIssues,
    };

    // Step 6: Compile final result
    const result: ValidationAndAuditResult = {
      summary,
      validation_results: validationResults,
      quality_report: qualityReport,
      evidence_report: evidenceReport,
      audit_trail: auditTrail,
    };

    MCPLogger.info('Citation validation and audit completed successfully', context, {
      totalCitations: summary.total_citations,
      validationPassed: summary.validation_passed,
      validationFailed: summary.validation_failed,
      qualityScore: summary.overall_quality_score,
      complianceStatus: summary.compliance_status,
      criticalIssues: summary.critical_issues,
      highPriorityIssues: summary.high_priority_issues,
      processingTime: validationDuration,
    });

    // Step 7: Format response based on report options
    const responseContent = formatValidationAndAuditResponse(result, reportOptions);

    return MCPResponseFormatter.formatSuccess(responseContent, 'markdown', {
      executionTime: validationDuration,
      quotaUsed: Math.ceil(args.citations.length / 5) + 2, // Base cost + per-citation cost
      validation: {
        total_citations: summary.total_citations,
        validation_passed: summary.validation_passed,
        validation_failed: summary.validation_failed,
        accessibility_checks: accessibilityChecks,
        credibility_assessments: credibilityAssessments,
        compliance_validations: complianceValidations,
        alternatives_found: alternativesFound,
      },
      quality: {
        overall_score: summary.overall_quality_score,
        compliance_status: summary.compliance_status,
        critical_issues: summary.critical_issues,
        high_priority_issues: summary.high_priority_issues,
        quality_gaps: qualityReport.qualityGaps.length,
        recommendations: qualityReport.recommendations.length,
      },
      evidence: {
        evidence_strength: evidenceReport.evidence_strength,
        critical_gaps: evidenceReport.critical_gaps.length,
        improvement_priorities: evidenceReport.improvement_priorities.length,
        alternative_sources: evidenceReport.alternative_sources.length,
      },
    });

  } catch (error) {
    MCPLogger.error('validate_and_audit_citations tool failed', error as Error, context, {
      citationCount: args.citations?.length,
      documentType: args.document_type,
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in validate_and_audit_citations'),
      context
    );
  }
}

/**
 * Generate comprehensive evidence report
 */
function generateEvidenceReport(
  citations: Citation[],
  validationResults: ValidationResult[],
  qualityReport: QualityReport,
  documentContent?: string,
  reportOptions?: any
): ValidationAndAuditResult['evidence_report'] {
  // Determine evidence strength based on quality metrics
  let evidenceStrength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  const overallScore = qualityReport.overallScore;
  
  if (overallScore >= 85) evidenceStrength = 'very_strong';
  else if (overallScore >= 70) evidenceStrength = 'strong';
  else if (overallScore >= 55) evidenceStrength = 'moderate';
  else evidenceStrength = 'weak';

  // Extract key findings from citations
  const keyFindings = citations
    .filter(c => c.key_finding && c.key_finding.trim().length > 0)
    .map(c => c.key_finding)
    .slice(0, 5); // Top 5 key findings

  // Identify critical gaps from quality assessment
  const criticalGaps = qualityReport.qualityGaps
    .filter(gap => gap.severity === 'critical' || gap.severity === 'high')
    .map(gap => gap.description)
    .slice(0, 3); // Top 3 critical gaps

  // Extract improvement priorities from recommendations
  const improvementPriorities = qualityReport.recommendations
    .filter(rec => rec.priority === 'critical' || rec.priority === 'high')
    .map(rec => rec.description)
    .slice(0, 3); // Top 3 priorities

  // Collect alternative sources from validation results
  const alternativeSources = validationResults
    .flatMap(result => result.alternativeSources)
    .filter((source, index, array) => 
      // Remove duplicates based on URL
      array.findIndex(s => s.url === source.url) === index
    )
    .slice(0, 5); // Top 5 alternatives

  return {
    evidence_strength: evidenceStrength,
    key_findings: keyFindings,
    critical_gaps: criticalGaps,
    improvement_priorities: improvementPriorities,
    alternative_sources: alternativeSources,
  };
}

/**
 * Format validation and audit response based on report options
 */
function formatValidationAndAuditResponse(
  result: ValidationAndAuditResult,
  reportOptions: any
): string {
  let response = '';

  // Executive Summary
  response += `# Citation Validation and Quality Audit Report\n\n`;
  
  response += `## Executive Summary\n\n`;
  response += `**Overall Assessment**: ${result.summary.overall_quality_score}/100 (${result.evidence_report.evidence_strength.toUpperCase()} evidence)\n`;
  response += `**Compliance Status**: ${result.summary.compliance_status.toUpperCase()}\n`;
  response += `**Citations Processed**: ${result.summary.total_citations}\n`;
  response += `**Validation Success Rate**: ${Math.round((result.summary.validation_passed / result.summary.total_citations) * 100)}%\n`;
  
  if (result.summary.critical_issues > 0) {
    response += `**⚠️ Critical Issues**: ${result.summary.critical_issues} require immediate attention\n`;
  }
  if (result.summary.high_priority_issues > 0) {
    response += `**⚡ High Priority Issues**: ${result.summary.high_priority_issues} should be addressed soon\n`;
  }
  response += `\n`;

  // Validation Results Summary
  if (reportOptions.include_validation_details) {
    response += `## Validation Results\n\n`;
    response += `### Accessibility Status\n`;
    response += `- ✅ **Accessible Sources**: ${result.summary.validation_passed}/${result.summary.total_citations}\n`;
    response += `- ❌ **Inaccessible Sources**: ${result.summary.validation_failed}/${result.summary.total_citations}\n`;
    
    if (result.audit_trail.alternatives_found > 0) {
      response += `- 🔄 **Alternative Sources Found**: ${result.audit_trail.alternatives_found}\n`;
    }
    response += `\n`;

    // Show failed validations if any
    if (result.summary.validation_failed > 0) {
      response += `### Failed Validations\n`;
      const failedValidations = result.validation_results.filter(r => !r.accessibilityStatus.isAccessible);
      failedValidations.slice(0, 3).forEach((validation, index) => {
        response += `${index + 1}. **${validation.citation.title}**\n`;
        response += `   - URL: ${validation.citation.url}\n`;
        response += `   - Issue: ${validation.accessibilityStatus.errorMessage || 'Accessibility check failed'}\n`;
        if (validation.alternativeSources.length > 0) {
          response += `   - Alternative: ${validation.alternativeSources[0].url}\n`;
        }
        response += `\n`;
      });
    }
  }

  // Quality Metrics
  if (reportOptions.include_quality_metrics) {
    response += `## Quality Assessment\n\n`;
    response += `### Quality Metrics Breakdown\n`;
    response += `- **Source Credibility**: ${result.quality_report.metrics.sourceCredibility}/100\n`;
    response += `- **Evidence Diversity**: ${result.quality_report.metrics.evidenceDiversity}/100\n`;
    response += `- **Source Recency**: ${result.quality_report.metrics.recencyScore}/100\n`;
    response += `- **Methodology Transparency**: ${result.quality_report.metrics.methodologyTransparency}/100\n`;
    response += `- **Sample Size Adequacy**: ${result.quality_report.metrics.sampleSizeAdequacy}/100\n`;
    response += `- **Accessibility Score**: ${result.quality_report.metrics.accessibilityScore}/100\n`;
    response += `- **Compliance Score**: ${result.quality_report.metrics.complianceScore}/100\n`;
    response += `\n`;

    // Strength Areas
    if (result.quality_report.strengthAreas.length > 0) {
      response += `### Strength Areas\n`;
      result.quality_report.strengthAreas.forEach(strength => {
        response += `- ✅ ${strength}\n`;
      });
      response += `\n`;
    }

    // Quality Gaps
    if (result.quality_report.qualityGaps.length > 0) {
      response += `### Quality Gaps Identified\n`;
      result.quality_report.qualityGaps.slice(0, 5).forEach((gap, index) => {
        const severityIcon = gap.severity === 'critical' ? '🚨' : gap.severity === 'high' ? '⚠️' : '⚡';
        response += `${index + 1}. ${severityIcon} **${gap.description}** (${gap.severity.toUpperCase()})\n`;
        response += `   - Impact: ${gap.impact}\n`;
        if (gap.recommendedActions.length > 0) {
          response += `   - Action: ${gap.recommendedActions[0]}\n`;
        }
        response += `\n`;
      });
    }
  }

  // Evidence Report
  if (reportOptions.generate_evidence_report) {
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
      response += `### Critical Evidence Gaps\n`;
      result.evidence_report.critical_gaps.forEach((gap, index) => {
        response += `${index + 1}. ${gap}\n`;
      });
      response += `\n`;
    }
  }

  // Recommendations
  if (reportOptions.include_recommendations && result.quality_report.recommendations.length > 0) {
    response += `## Improvement Recommendations\n\n`;
    
    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    const sortedRecommendations = result.quality_report.recommendations.sort((a, b) => 
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    );

    sortedRecommendations.slice(0, 5).forEach((rec, index) => {
      const priorityIcon = rec.priority === 'critical' ? '🚨' : rec.priority === 'high' ? '⚠️' : '📋';
      response += `### ${index + 1}. ${priorityIcon} ${rec.description} (${rec.priority.toUpperCase()})\n`;
      response += `**Expected Impact**: ${rec.expectedImpact}\n`;
      response += `**Effort Required**: ${rec.estimatedEffort}\n`;
      
      if (rec.specificActions.length > 0) {
        response += `**Actions**:\n`;
        rec.specificActions.slice(0, 3).forEach(action => {
          response += `- ${action}\n`;
        });
      }
      
      if (rec.targetMetrics) {
        response += `**Target Improvements**:\n`;
        if (rec.targetMetrics.credibilityIncrease) {
          response += `- Credibility: +${rec.targetMetrics.credibilityIncrease} points\n`;
        }
        if (rec.targetMetrics.diversityIncrease) {
          response += `- Diversity: +${rec.targetMetrics.diversityIncrease} points\n`;
        }
        if (rec.targetMetrics.recencyImprovement) {
          response += `- Recency: +${rec.targetMetrics.recencyImprovement} points\n`;
        }
      }
      response += `\n`;
    });
  }

  // Alternative Sources
  if (reportOptions.include_alternatives && result.evidence_report.alternative_sources.length > 0) {
    response += `## Alternative Source Suggestions\n\n`;
    result.evidence_report.alternative_sources.slice(0, 3).forEach((source, index) => {
      response += `### ${index + 1}. ${source.title}\n`;
      response += `- **Organization**: ${source.organization}\n`;
      response += `- **Type**: ${source.source_type}\n`;
      response += `- **Published**: ${source.published_at}\n`;
      response += `- **URL**: ${source.url}\n`;
      if (source.key_finding) {
        response += `- **Key Finding**: ${source.key_finding}\n`;
      }
      response += `\n`;
    });
  }

  // Audit Trail
  response += `## Audit Trail\n\n`;
  response += `- **Validation Timestamp**: ${result.audit_trail.validation_timestamp.toISOString()}\n`;
  response += `- **Processing Time**: ${result.audit_trail.validation_duration_ms}ms\n`;
  response += `- **Sources Processed**: ${result.audit_trail.sources_checked}\n`;
  response += `- **Accessibility Checks**: ${result.audit_trail.accessibility_checks}\n`;
  response += `- **Credibility Assessments**: ${result.audit_trail.credibility_assessments}\n`;
  response += `- **Compliance Validations**: ${result.audit_trail.compliance_validations}\n`;
  response += `- **Alternative Sources Found**: ${result.audit_trail.alternatives_found}\n`;
  response += `\n`;

  response += `---\n`;
  response += `*Report generated by Enhanced Citation System - Validation and Audit Tool*\n`;

  return response;
}

/**
 * Input schema for validate_and_audit_citations tool
 */
export const validateAndAuditCitationsSchema = {
  type: 'object',
  properties: {
    citations: {
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
          methodology: { type: 'string' },
          sample_size: { type: 'number' },
          industry_focus: { type: 'array', items: { type: 'string' } },
          last_accessed: { type: 'string' },
        },
        required: ['id', 'title', 'url', 'source_type', 'confidence'],
      },
      minItems: 1,
      maxItems: 50,
      description: 'Array of citations to validate and audit',
    },
    document_content: {
      type: 'string',
      description: 'Optional document content for context-aware validation',
      maxLength: 50000,
    },
    document_type: {
      type: 'string',
      enum: ['business_case', 'market_analysis', 'executive_onepager', 'pr_faq', 'competitive_analysis'],
      description: 'Type of document for appropriate validation standards',
    },
    validation_options: {
      type: 'object',
      properties: {
        check_accessibility: {
          type: 'boolean',
          description: 'Whether to check source accessibility',
          default: true,
        },
        assess_credibility: {
          type: 'boolean',
          description: 'Whether to assess source credibility',
          default: true,
        },
        verify_compliance: {
          type: 'boolean',
          description: 'Whether to verify compliance requirements',
          default: true,
        },
        find_alternatives: {
          type: 'boolean',
          description: 'Whether to find alternative sources for broken links',
          default: true,
        },
        timeout: {
          type: 'number',
          minimum: 1000,
          maximum: 30000,
          description: 'Timeout for accessibility checks in milliseconds',
          default: 10000,
        },
        retry_attempts: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Number of retry attempts for failed validations',
          default: 3,
        },
        compliance_standards: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['academic', 'business', 'regulatory'],
          },
          description: 'Compliance standards to check against',
          default: ['academic', 'business', 'regulatory'],
        },
      },
      description: 'Validation configuration options',
    },
    audit_options: {
      type: 'object',
      properties: {
        perform_quality_assessment: {
          type: 'boolean',
          description: 'Whether to perform comprehensive quality assessment',
          default: true,
        },
        identify_quality_gaps: {
          type: 'boolean',
          description: 'Whether to identify quality gaps',
          default: true,
        },
        generate_recommendations: {
          type: 'boolean',
          description: 'Whether to generate improvement recommendations',
          default: true,
        },
        minimum_quality_threshold: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Minimum quality score threshold (0-100)',
          default: 70,
        },
        required_diversity_score: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Required source diversity score (0-100)',
          default: 60,
        },
        max_source_age_months: {
          type: 'number',
          minimum: 1,
          maximum: 120,
          description: 'Maximum acceptable source age in months',
          default: 36,
        },
        require_methodology: {
          type: 'boolean',
          description: 'Whether to require methodology transparency',
          default: false,
        },
        minimum_sample_size: {
          type: 'number',
          minimum: 1,
          description: 'Minimum sample size for research sources',
          default: 100,
        },
      },
      description: 'Quality audit configuration options',
    },
    report_options: {
      type: 'object',
      properties: {
        generate_evidence_report: {
          type: 'boolean',
          description: 'Whether to generate comprehensive evidence report',
          default: true,
        },
        include_validation_details: {
          type: 'boolean',
          description: 'Whether to include detailed validation results',
          default: true,
        },
        include_quality_metrics: {
          type: 'boolean',
          description: 'Whether to include quality metrics breakdown',
          default: true,
        },
        include_recommendations: {
          type: 'boolean',
          description: 'Whether to include improvement recommendations',
          default: true,
        },
        include_alternatives: {
          type: 'boolean',
          description: 'Whether to include alternative source suggestions',
          default: true,
        },
        report_format: {
          type: 'string',
          enum: ['detailed', 'summary', 'executive'],
          description: 'Report format preference',
          default: 'detailed',
        },
      },
      description: 'Evidence report generation options',
    },
  },
  required: ['citations'],
} as const;

/**
 * Tool description for MCP registration
 */
export const validateAndAuditCitationsDescription = 
  'Comprehensive citation validation and quality auditing tool that combines source validation, credibility assessment, compliance checking, and quality auditing. Provides detailed evidence reports with accessibility validation, quality metrics, improvement recommendations, and alternative source suggestions for both individual citations and full document audits.';