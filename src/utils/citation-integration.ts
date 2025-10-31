// Enhanced Citation integration utilities for MCP tools

import { CitationService } from '../components/citation-service';
import { SourceValidationEngine } from '../components/source-validation-engine';
import { QualityAssessmentSystem } from '../components/quality-assessment-system';
import { ConfidenceScoringEngine } from '../components/confidence-scoring-engine';
import {
  Citation,
  CitationSearchCriteria,
  CitationContext,
  ReferenceCollection,
  CitationMetrics,
  EnhancedCitation,
} from '../models/citations';
import { CitationOptions } from '../models/mcp';

/**
 * Enhanced citation integration result with validation and quality data
 */
export interface EnhancedCitationResult {
  citations: EnhancedCitation[];
  bibliography: string;
  citationContexts: CitationContext[];
  metrics: CitationMetrics;
  enhancedContent: string;
  qualityReport: any; // QualityReport from quality assessment system
  confidenceScores: any; // ConfidenceScore from confidence scoring engine
  validationResults: any[]; // ValidationResult from source validation engine
}

/**
 * Enhanced Citation integration helper for MCP tools with validation and quality assessment
 */
export class CitationIntegration {
  private citationService: CitationService;
  private sourceValidationEngine: SourceValidationEngine;
  private qualityAssessmentSystem: QualityAssessmentSystem;
  private confidenceScoringEngine: ConfidenceScoringEngine;

  constructor() {
    this.citationService = new CitationService();
    this.sourceValidationEngine = new SourceValidationEngine();
    this.qualityAssessmentSystem = new QualityAssessmentSystem();
    this.confidenceScoringEngine = new ConfidenceScoringEngine();
  }

  /**
   * Find and integrate enhanced citations with validation and quality assessment
   */
  async integrateCitations(
    documentType: string,
    content: string,
    options: CitationOptions = {},
    industry?: string
  ): Promise<EnhancedCitationResult> {
    // Validate and convert input parameters
    let processedContent: string;
    if (typeof content !== 'string') {
      console.warn('integrateCitations received non-string content:', typeof content);
      // Convert object to string for processing
      if (typeof content === 'object' && content !== null) {
        processedContent = JSON.stringify(content, null, 2);
      } else {
        processedContent = String(content);
      }
    } else {
      processedContent = content;
    }

    if (!processedContent || processedContent.trim().length === 0) {
      console.warn('integrateCitations received empty content');
      return {
        citations: [],
        bibliography: '',
        citationContexts: [],
        metrics: this.citationService.calculateCitationMetrics([]),
        enhancedContent: processedContent,
        qualityReport: await this.qualityAssessmentSystem.assessCitationQuality([]),
        confidenceScores: this.confidenceScoringEngine.aggregateDocumentConfidence([]),
        validationResults: [],
      };
    }

    // Set default options
    const citationOptions = {
      include_citations: options.include_citations ?? true,
      minimum_citations: options.minimum_citations ?? 3,
      minimum_confidence: options.minimum_confidence ?? 'medium',
      industry_focus: options.industry_focus ?? industry ?? '',
      geographic_scope: options.geographic_scope ?? 'global',
      citation_style: options.citation_style ?? 'business',
      include_bibliography: options.include_bibliography ?? true,
      max_citation_age_months: options.max_citation_age_months ?? 24,
      // Enhanced validation options with defaults
      validate_sources: options.validate_sources ?? true,
      assess_quality: options.assess_quality ?? true,
      calculate_confidence: options.calculate_confidence ?? true,
      find_alternatives: options.find_alternatives ?? false,
      minimum_quality_score: options.minimum_quality_score ?? 60,
      show_confidence_indicators: options.show_confidence_indicators ?? false,
      include_quality_report: options.include_quality_report ?? false,
      filter_low_quality: options.filter_low_quality ?? false,
    };

    if (!citationOptions.include_citations) {
      return {
        citations: [],
        bibliography: '',
        citationContexts: [],
        metrics: this.citationService.calculateCitationMetrics([]),
        enhancedContent: processedContent,
        qualityReport: await this.qualityAssessmentSystem.assessCitationQuality([]),
        confidenceScores: this.confidenceScoringEngine.aggregateDocumentConfidence([]),
        validationResults: [],
      };
    }

    // Extract keywords from content for citation search
    const keywords = this.extractKeywords(processedContent, documentType);

    // Build search criteria
    const searchCriteria: CitationSearchCriteria = {
      keywords,
      industry: citationOptions.industry_focus || undefined,
      date_range: {
        start: new Date(
          Date.now() - citationOptions.max_citation_age_months * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        end: new Date().toISOString(),
      },
      minimum_confidence: citationOptions.minimum_confidence as any,
      language: 'english',
    };

    // Find relevant citations
    const baseCitations = await this.citationService.findRelevantCitations(searchCriteria);

    // Ensure minimum citation count
    const selectedBaseCitations = baseCitations.slice(
      0,
      Math.max(citationOptions.minimum_citations, baseCitations.length)
    );

    // Validate and enhance citations with quality assessment
    const validationResults =
      await this.sourceValidationEngine.validateCitations(selectedBaseCitations);
    const enhancedCitations = await Promise.all(
      selectedBaseCitations.map(citation =>
        this.sourceValidationEngine.createEnhancedCitation(citation)
      )
    );

    // Filter out citations that fail validation if required
    const validatedCitations = enhancedCitations.filter(citation => {
      if (citationOptions.minimum_confidence === 'high') {
        return citation.validationStatus.credibilityAssessment.confidenceLevel === 'high';
      }
      if (citationOptions.minimum_confidence === 'medium') {
        return ['high', 'medium'].includes(
          citation.validationStatus.credibilityAssessment.confidenceLevel
        );
      }
      return true; // Include all for 'low' confidence requirement
    });

    // Create citation contexts based on content analysis
    const citationContexts = this.createCitationContexts(content, validatedCitations, documentType);

    // Generate bibliography
    const bibliography = citationOptions.include_bibliography
      ? this.citationService.generateBibliography(
          validatedCitations,
          citationOptions.citation_style as 'business' | 'apa'
        )
      : '';

    // Calculate enhanced metrics
    const metrics = this.citationService.calculateCitationMetrics(validatedCitations);

    // Perform quality assessment
    const qualityReport =
      await this.qualityAssessmentSystem.assessCitationQuality(validatedCitations);

    // Calculate confidence scores for the document
    const claims = this.extractClaimsFromContent(content, documentType);
    const claimConfidences = claims.map(claim =>
      this.confidenceScoringEngine.calculateClaimConfidence(claim, validatedCitations)
    );
    const confidenceScores =
      this.confidenceScoringEngine.aggregateDocumentConfidence(claimConfidences);

    // Enhance content with inline citations and confidence indicators
    const enhancedContent = this.enhanceContentWithCitations(
      processedContent,
      validatedCitations,
      citationContexts,
      citationOptions.citation_style,
      citationOptions.include_bibliography ? bibliography : '',
      confidenceScores
    );

    return {
      citations: validatedCitations,
      bibliography,
      citationContexts,
      metrics,
      enhancedContent,
      qualityReport,
      confidenceScores,
      validationResults,
    };
  }

  /**
   * Extract relevant keywords from content for citation search
   */
  private extractKeywords(content: string, documentType: string): string[] {
    const baseKeywords: Record<string, string[]> = {
      business_case: ['roi', 'business case', 'investment', 'cost benefit', 'financial analysis'],
      market_analysis: ['market size', 'competition', 'market research', 'industry analysis'],
      executive_onepager: ['strategy', 'executive summary', 'business strategy'],
      pr_faq: ['product launch', 'press release', 'product announcement'],
      competitive_analysis: ['competitive analysis', 'market positioning', 'competitor research'],
      strategic_alignment: ['strategic planning', 'okr', 'company strategy', 'alignment'],
      resource_optimization: ['resource allocation', 'optimization', 'efficiency', 'productivity'],
      market_timing: ['market timing', 'product timing', 'market readiness'],
    };

    // Get base keywords for document type
    const keywords = [...(baseKeywords[documentType] || [])];

    // Extract additional keywords from content
    const contentKeywords = this.extractContentKeywords(content);
    keywords.push(...contentKeywords);

    // Add common business terms
    keywords.push('saas', 'product management', 'digital transformation', 'customer success');

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Extract keywords from content using simple text analysis
   */
  private extractContentKeywords(content: string): string[] {
    const keywords: string[] = [];

    // Ensure content is a string
    if (typeof content !== 'string') {
      console.warn('extractContentKeywords received non-string content:', typeof content);
      return keywords;
    }

    // Common business and tech terms to look for
    const businessTerms = [
      'churn',
      'retention',
      'conversion',
      'revenue',
      'growth',
      'acquisition',
      'automation',
      'ai',
      'machine learning',
      'analytics',
      'dashboard',
      'customer experience',
      'user experience',
      'agile',
      'scrum',
      'cloud',
      'api',
      'integration',
      'scalability',
      'performance',
    ];

    const lowerContent = content.toLowerCase();

    businessTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        keywords.push(term);
      }
    });

    return keywords;
  }

  /**
   * Create citation contexts based on content analysis
   */
  private createCitationContexts(
    content: string,
    citations: Citation[],
    documentType: string
  ): CitationContext[] {
    const contexts: CitationContext[] = [];

    // Map citations to relevant sections based on content
    const sections = this.identifyContentSections(content, documentType);

    citations.forEach((citation, index) => {
      // Find the most relevant section for this citation
      const relevantSection = this.findRelevantSection(citation, sections);

      contexts.push(
        this.citationService.addCitationContext(
          citation.id,
          relevantSection,
          citation.key_finding,
          'supporting'
        )
      );
    });

    return contexts;
  }

  /**
   * Identify content sections for citation placement
   */
  private identifyContentSections(content: string, documentType: string): string[] {
    const sectionPatterns: Record<string, string[]> = {
      business_case: ['Problem', 'Solution', 'ROI Analysis', 'Risk Assessment', 'Recommendation'],
      market_analysis: ['Market Size', 'Competition', 'Trends', 'Opportunities', 'Threats'],
      executive_onepager: ['Executive Summary', 'Problem', 'Solution', 'Investment', 'Returns'],
      competitive_analysis: [
        'Market Overview',
        'Competitor Analysis',
        'Positioning',
        'Recommendations',
      ],
      strategic_alignment: ['Strategic Context', 'Alignment Assessment', 'Recommendations'],
    };

    return sectionPatterns[documentType] || ['Overview', 'Analysis', 'Recommendations'];
  }

  /**
   * Find the most relevant section for a citation
   */
  private findRelevantSection(citation: Citation, sections: string[]): string {
    const keyFinding = citation.key_finding.toLowerCase();

    // Simple keyword matching to determine relevance
    if (
      keyFinding.includes('roi') ||
      keyFinding.includes('cost') ||
      keyFinding.includes('revenue')
    ) {
      return (
        sections.find(
          s => s.toLowerCase().includes('roi') || s.toLowerCase().includes('investment')
        ) || sections[0]
      );
    }

    if (keyFinding.includes('market') || keyFinding.includes('competition')) {
      return (
        sections.find(
          s => s.toLowerCase().includes('market') || s.toLowerCase().includes('competition')
        ) || sections[0]
      );
    }

    if (keyFinding.includes('churn') || keyFinding.includes('retention')) {
      return (
        sections.find(
          s => s.toLowerCase().includes('problem') || s.toLowerCase().includes('analysis')
        ) || sections[0]
      );
    }

    return sections[0]; // Default to first section
  }

  /**
   * Extract claims from content for confidence scoring
   */
  private extractClaimsFromContent(content: string, documentType: string): string[] {
    const claims: string[] = [];

    // Split content into sentences and identify claim-like statements
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Look for quantitative claims (containing numbers or percentages)
    const quantitativeClaims = sentences.filter(sentence =>
      /\d+%|\d+\.\d+%|\$\d+|\d+x|increase|decrease|growth|reduction/i.test(sentence)
    );
    claims.push(...quantitativeClaims.slice(0, 5)); // Limit to top 5

    // Look for comparative claims
    const comparativeClaims = sentences.filter(sentence =>
      /better|worse|faster|slower|more|less|higher|lower|superior|inferior/i.test(sentence)
    );
    claims.push(...comparativeClaims.slice(0, 3)); // Limit to top 3

    // Look for definitive statements
    const definitiveClaims = sentences.filter(sentence =>
      /will|must|should|proven|demonstrated|shows|indicates|reveals/i.test(sentence)
    );
    claims.push(...definitiveClaims.slice(0, 3)); // Limit to top 3

    return [...new Set(claims)]; // Remove duplicates
  }

  /**
   * Enhance content with inline citations, bibliography, and confidence indicators
   */
  private enhanceContentWithCitations(
    content: string,
    citations: EnhancedCitation[],
    contexts: CitationContext[],
    style: 'business' | 'apa' | 'inline',
    bibliography: string,
    confidenceScores?: any
  ): string {
    let enhancedContent = content;

    // Add inline citations at relevant points
    contexts.forEach(context => {
      const citation = citations.find(c => c.id === context.citation_id);
      if (citation) {
        const formattedCitation = this.citationService.formatCitation(citation, style);

        // Find a good place to insert the citation
        const claimText = context.specific_claim.substring(0, 50); // First 50 chars
        const insertionPoint = enhancedContent.toLowerCase().indexOf(claimText.toLowerCase());

        if (insertionPoint !== -1) {
          const endOfSentence = enhancedContent.indexOf('.', insertionPoint);
          if (endOfSentence !== -1) {
            enhancedContent = `${enhancedContent.substring(
              0,
              endOfSentence
            )} ${formattedCitation.in_text_citation}${enhancedContent.substring(endOfSentence)}`;
          }
        }
      }
    });

    // Add confidence scoring summary if available
    if (confidenceScores && confidenceScores.overallConfidence > 0) {
      const confidenceSection = this.generateConfidenceSection(confidenceScores);
      enhancedContent += `\n\n${confidenceSection}`;
    }

    // Add bibliography at the end if requested
    if (bibliography) {
      enhancedContent += `\n\n${bibliography}`;
    }

    return enhancedContent;
  }

  /**
   * Get citation requirements for a document type
   */
  getCitationRequirements(documentType: string) {
    return this.citationService.getCitationRequirements(documentType);
  }

  /**
   * Enhanced citation quality validation using quality assessment system
   */
  async validateCitationQuality(
    citations: Citation[],
    documentType: string
  ): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    qualityScore: number;
    qualityReport: any;
  }> {
    // Use the enhanced quality assessment system
    const qualityReport = await this.qualityAssessmentSystem.assessCitationQuality(citations);

    const issues = qualityReport.qualityGaps.map(gap => gap.description);
    const recommendations = qualityReport.recommendations.map(rec => rec.description);

    return {
      isValid: qualityReport.complianceStatus === 'compliant',
      issues,
      recommendations,
      qualityScore: qualityReport.overallScore,
      qualityReport,
    };
  }

  /**
   * Generate confidence section for enhanced content
   */
  private generateConfidenceSection(confidenceScores: any): string {
    const confidence = confidenceScores.overallConfidence;
    let confidenceLevel = 'Low';
    let confidenceColor = '🔴';

    if (confidence >= 80) {
      confidenceLevel = 'High';
      confidenceColor = '🟢';
    } else if (confidence >= 60) {
      confidenceLevel = 'Medium';
      confidenceColor = '🟡';
    }

    let section = `## Evidence Confidence Assessment\n\n`;
    section += `${confidenceColor} **Overall Confidence: ${confidenceLevel} (${confidence}%)**\n\n`;

    if (confidenceScores.weakestClaims && confidenceScores.weakestClaims.length > 0) {
      section += `**Areas for Improvement:**\n`;
      confidenceScores.weakestClaims.slice(0, 2).forEach((claim: any) => {
        section += `- ${claim.claim}: ${claim.confidence}% confidence\n`;
      });
      section += `\n`;
    }

    if (confidenceScores.strongestClaims && confidenceScores.strongestClaims.length > 0) {
      section += `**Well-Supported Claims:**\n`;
      confidenceScores.strongestClaims.slice(0, 2).forEach((claim: any) => {
        section += `- ${claim.claim}: ${claim.confidence}% confidence\n`;
      });
      section += `\n`;
    }

    section += `*Confidence scores are based on source quality, evidence strength, methodology transparency, and data recency.*\n`;

    return section;
  }

  /**
   * Get enhanced citation requirements with validation criteria
   */
  getEnhancedCitationRequirements(documentType: string) {
    const baseRequirements = this.citationService.getCitationRequirements(documentType);

    return {
      ...baseRequirements,
      validation: {
        requireAccessibilityCheck: true,
        requireCredibilityAssessment: true,
        requireComplianceCheck: true,
        minimumQualityScore: 70,
        maximumBrokenLinks: 0,
      },
      confidence: {
        minimumOverallConfidence: 60,
        requireConfidenceScoring: true,
        showConfidenceIndicators: true,
      },
    };
  }

  /**
   * Batch process citations with enhanced validation
   */
  async batchProcessCitations(
    citations: Citation[],
    options: {
      validateSources?: boolean;
      assessQuality?: boolean;
      calculateConfidence?: boolean;
      findAlternatives?: boolean;
    } = {}
  ): Promise<{
    enhancedCitations: EnhancedCitation[];
    validationResults: any[];
    qualityReport: any;
    processingStats: {
      totalProcessed: number;
      validationsPassed: number;
      validationsFailed: number;
      averageQualityScore: number;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    const defaultOptions = {
      validateSources: true,
      assessQuality: true,
      calculateConfidence: true,
      findAlternatives: false,
      ...options,
    };

    let enhancedCitations: EnhancedCitation[] = [];
    let validationResults: any[] = [];
    let qualityReport: any = null;

    // Validate sources if requested
    if (defaultOptions.validateSources) {
      validationResults = await this.sourceValidationEngine.validateCitations(citations);
      enhancedCitations = await Promise.all(
        citations.map(citation => this.sourceValidationEngine.createEnhancedCitation(citation))
      );
    } else {
      enhancedCitations = citations as EnhancedCitation[];
    }

    // Assess quality if requested
    if (defaultOptions.assessQuality) {
      qualityReport = await this.qualityAssessmentSystem.assessCitationQuality(citations);
    }

    // Calculate processing statistics
    const validationsPassed = validationResults.filter(
      result =>
        result.accessibilityStatus.isAccessible &&
        result.credibilityAssessment.confidenceLevel !== 'low'
    ).length;

    const averageQualityScore = qualityReport ? qualityReport.overallScore : 0;
    const processingTime = Date.now() - startTime;

    return {
      enhancedCitations,
      validationResults,
      qualityReport,
      processingStats: {
        totalProcessed: citations.length,
        validationsPassed,
        validationsFailed: citations.length - validationsPassed,
        averageQualityScore,
        processingTime,
      },
    };
  }
}
