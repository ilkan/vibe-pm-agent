/**
 * Dedicated Citation Agent with NVIDIA NIM Integration
 * 
 * A specialized Bedrock agent for citation validation, sourcing, and quality assessment
 * with NIM-powered citation quality assessment and validation capabilities.
 * 
 * Requirements: 2.1, 3.1, 4.3
 */

import { EnhancedCitationSystem } from '../enhanced-citation-system';
import { NIMServiceManager, ChatCompletionRequest, EmbeddingRequest } from '../../interfaces/nvidia-nim-core';
import { createNIMServiceManager } from '../nim-service-manager';
import {
  Citation,
  CitationSourceType,
  CitationConfidence,
  CitationSearchCriteria,
  AccessibilityStatus,
  CredibilityAssessment,
  ComplianceStatus,
} from '../../models/citations';
import { NIMErrorHandler } from '../../utils/nvidia-nim-error-handling';

// ============================================================================
// Citation Agent Interfaces
// ============================================================================

export interface CitationRequest {
  requestId: string;
  requestType: 'validate' | 'source' | 'enhance' | 'audit';
  content?: string;
  citations?: Citation[];
  criteria?: CitationSearchCriteria;
  requesterAgent: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: {
    documentType?: string;
    industry?: string;
    audience?: string;
    confidenceThreshold?: number;
  };
}

export interface CitationResponse {
  requestId: string;
  success: boolean;
  citations: Citation[];
  qualityScore: number;
  confidence: number;
  recommendations: string[];
  validationResults?: CitationValidationResult[];
  auditResults?: CitationAuditResult;
  processingTime: number;
  nimEnhanced: boolean;
  error?: string;
}

export interface CitationValidationResult {
  citation: Citation;
  isValid: boolean;
  accessibility: AccessibilityStatus;
  credibility: CredibilityAssessment;
  compliance: ComplianceStatus;
  issues: string[];
  alternatives?: Citation[];
  nimAssessment?: {
    qualityScore: number;
    relevanceScore: number;
    trustworthiness: number;
    recommendations: string[];
  };
}

export interface CitationAuditResult {
  auditId: string;
  totalCitations: number;
  validCitations: number;
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  keyIssues: string[];
  recommendations: string[];
  overallScore: number;
}

export interface ICitationAgent {
  // Core citation services
  processCitationRequest(request: CitationRequest): Promise<CitationResponse>;
  
  // Validation services
  validateCitations(citations: Citation[], context?: any): Promise<CitationValidationResult[]>;
  
  // Sourcing services
  findRelevantCitations(criteria: CitationSearchCriteria): Promise<Citation[]>;
  
  // Enhancement services
  enhanceDocumentCitations(content: string, documentType: string): Promise<CitationResponse>;
  
  // Audit services
  auditCitationQuality(citations: Citation[], criteria?: any): Promise<CitationAuditResult>;
  
  // NIM-powered services
  assessCitationQualityWithNIM(citation: Citation): Promise<any>;
  generateCitationRecommendationsWithNIM(content: string, context?: any): Promise<Citation[]>;
  
  // Agent communication
  registerWithSupervisor(supervisorEndpoint: string): Promise<boolean>;
  handleAgentRequest(fromAgent: string, request: any): Promise<any>;
}

// ============================================================================
// Citation Agent Implementation
// ============================================================================

export class CitationAgent implements ICitationAgent {
  private nimService: NIMServiceManager;
  private citationSystem: EnhancedCitationSystem;
  private requestQueue: Map<string, CitationRequest> = new Map();
  private processingQueue: Set<string> = new Set();
  private agentId: string;
  private supervisorEndpoint?: string;
  private registeredAgents: Set<string> = new Set();

  constructor(nimConfig?: any) {
    this.agentId = `citation-agent-${Date.now()}`;
    this.nimService = createNIMServiceManager(nimConfig);
    this.citationSystem = new EnhancedCitationSystem({
      enableRealTimeValidation: true,
      enableQualityMonitoring: true,
      enableAuditTrail: true,
      cacheValidationResults: true,
      maxConcurrentValidations: 15,
      qualityThresholds: {
        minimum: 70,
        target: 85,
        excellent: 95
      }
    });
    
    console.log(`Citation Agent initialized with ID: ${this.agentId}`);
  }

  // ============================================================================
  // Core Citation Request Processing
  // ============================================================================

  /**
   * Process citation requests from other agents
   * Requirements: 2.1, 3.1, 4.3
   */
  async processCitationRequest(request: CitationRequest): Promise<CitationResponse> {
    const startTime = Date.now();
    
    try {
      // Add to request queue
      this.requestQueue.set(request.requestId, request);
      this.processingQueue.add(request.requestId);

      console.log(`Processing citation request ${request.requestId} from ${request.requesterAgent}`);

      let response: CitationResponse;

      switch (request.requestType) {
        case 'validate':
          response = await this.handleValidationRequest(request);
          break;
        case 'source':
          response = await this.handleSourcingRequest(request);
          break;
        case 'enhance':
          response = await this.handleEnhancementRequest(request);
          break;
        case 'audit':
          response = await this.handleAuditRequest(request);
          break;
        default:
          throw new Error(`Unknown request type: ${request.requestType}`);
      }

      // Calculate processing time
      response.processingTime = Date.now() - startTime;
      response.nimEnhanced = true;

      // Clean up
      this.requestQueue.delete(request.requestId);
      this.processingQueue.delete(request.requestId);

      console.log(`Completed citation request ${request.requestId} in ${response.processingTime}ms`);
      
      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`Citation request ${request.requestId} failed:`, error);

      // Clean up
      this.requestQueue.delete(request.requestId);
      this.processingQueue.delete(request.requestId);

      return {
        requestId: request.requestId,
        success: false,
        citations: [],
        qualityScore: 0,
        confidence: 0,
        recommendations: ['Citation processing failed. Please try again.'],
        processingTime,
        nimEnhanced: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Handle citation validation requests
   */
  private async handleValidationRequest(request: CitationRequest): Promise<CitationResponse> {
    if (!request.citations || request.citations.length === 0) {
      throw new Error('Citations are required for validation requests');
    }

    const validationResults = await this.validateCitations(request.citations, request.context);
    const validCitations = validationResults.filter(result => result.isValid).map(result => result.citation);
    
    // Calculate overall quality score
    const qualityScore = this.calculateOverallQualityScore(validationResults);
    
    // Generate NIM-powered recommendations
    const recommendations = await this.generateValidationRecommendations(validationResults);

    return {
      requestId: request.requestId,
      success: true,
      citations: validCitations,
      qualityScore,
      confidence: this.calculateConfidenceScore(validationResults),
      recommendations,
      validationResults,
      processingTime: 0, // Will be set by caller
      nimEnhanced: true
    };
  }

  /**
   * Handle citation sourcing requests
   */
  private async handleSourcingRequest(request: CitationRequest): Promise<CitationResponse> {
    if (!request.criteria) {
      throw new Error('Search criteria are required for sourcing requests');
    }

    const citations = await this.findRelevantCitations(request.criteria);
    
    // Enhance citations with NIM-powered quality assessment
    const enhancedCitations = await Promise.all(
      citations.map(async (citation) => {
        const nimAssessment = await this.assessCitationQualityWithNIM(citation);
        return {
          ...citation,
          nimAssessment
        };
      })
    );

    // Calculate quality score
    const qualityScore = this.calculateCitationQualityScore(enhancedCitations);
    
    // Generate recommendations
    const recommendations = await this.generateSourcingRecommendations(enhancedCitations, request.criteria);

    return {
      requestId: request.requestId,
      success: true,
      citations: enhancedCitations,
      qualityScore,
      confidence: this.calculateSourceConfidence(enhancedCitations),
      recommendations,
      processingTime: 0,
      nimEnhanced: true
    };
  }

  /**
   * Handle citation enhancement requests
   */
  private async handleEnhancementRequest(request: CitationRequest): Promise<CitationResponse> {
    if (!request.content) {
      throw new Error('Content is required for enhancement requests');
    }

    const documentType = request.context?.documentType || 'business_document';
    const enhancementResult = await this.enhanceDocumentCitations(request.content, documentType);

    return enhancementResult;
  }

  /**
   * Handle citation audit requests
   */
  private async handleAuditRequest(request: CitationRequest): Promise<CitationResponse> {
    if (!request.citations || request.citations.length === 0) {
      throw new Error('Citations are required for audit requests');
    }

    const auditResults = await this.auditCitationQuality(request.citations, request.context);
    
    return {
      requestId: request.requestId,
      success: true,
      citations: request.citations,
      qualityScore: auditResults.overallScore,
      confidence: this.calculateAuditConfidence(auditResults),
      recommendations: auditResults.recommendations,
      auditResults,
      processingTime: 0,
      nimEnhanced: true
    };
  }

  // ============================================================================
  // Citation Validation Services
  // ============================================================================

  /**
   * Validate citations with NIM-powered quality assessment
   */
  async validateCitations(citations: Citation[], context?: any): Promise<CitationValidationResult[]> {
    const validationResults: CitationValidationResult[] = [];

    for (const citation of citations) {
      try {
        // Basic validation
        const isValid = await this.performBasicValidation(citation);
        const accessibility = await this.checkAccessibility(citation);
        const credibility = await this.assessCredibility(citation);
        const compliance = await this.checkCompliance(citation, context);
        
        // NIM-powered assessment
        const nimAssessment = await this.assessCitationQualityWithNIM(citation);
        
        // Identify issues
        const issues = this.identifyValidationIssues(citation, accessibility, credibility, compliance);
        
        // Find alternatives if needed
        const alternatives = issues.length > 0 ? await this.findAlternativeCitations(citation) : undefined;

        validationResults.push({
          citation,
          isValid,
          accessibility,
          credibility,
          compliance,
          issues,
          alternatives,
          nimAssessment
        });
      } catch (error) {
        console.error(`Validation failed for citation ${citation.id}:`, error);
        
        validationResults.push({
          citation,
          isValid: false,
          accessibility: AccessibilityStatus.UNKNOWN,
          credibility: { score: 0, factors: [], issues: ['Validation failed'] },
          compliance: ComplianceStatus.UNKNOWN,
          issues: [`Validation error: ${error instanceof Error ? error.message : String(error)}`]
        });
      }
    }

    return validationResults;
  }

  /**
   * Perform basic citation validation
   */
  private async performBasicValidation(citation: Citation): Promise<boolean> {
    // Check required fields
    if (!citation.url || !citation.title || !citation.source_type) {
      return false;
    }

    // Check URL format
    try {
      new URL(citation.url);
    } catch {
      return false;
    }

    // Check if URL is accessible
    return await this.isUrlAccessible(citation.url);
  }

  /**
   * Check citation accessibility
   */
  private async checkAccessibility(citation: Citation): Promise<AccessibilityStatus> {
    try {
      const isAccessible = await this.isUrlAccessible(citation.url);
      return isAccessible ? AccessibilityStatus.ACCESSIBLE : AccessibilityStatus.INACCESSIBLE;
    } catch {
      return AccessibilityStatus.UNKNOWN;
    }
  }

  /**
   * Assess citation credibility
   */
  private async assessCredibility(citation: Citation): Promise<CredibilityAssessment> {
    const factors: string[] = [];
    const issues: string[] = [];
    let score = 50; // Base score

    // Domain-based credibility
    const domain = citation.domain || new URL(citation.url).hostname;
    
    if (domain.endsWith('.edu') || domain.endsWith('.gov')) {
      score += 30;
      factors.push('Academic or government domain');
    } else if (domain.endsWith('.org')) {
      score += 20;
      factors.push('Non-profit organization domain');
    } else if (this.isKnownAuthoritativeDomain(domain)) {
      score += 25;
      factors.push('Known authoritative source');
    }

    // Source type credibility
    switch (citation.source_type) {
      case CitationSourceType.ACADEMIC_PAPER:
        score += 25;
        factors.push('Academic research paper');
        break;
      case CitationSourceType.GOVERNMENT_REPORT:
        score += 30;
        factors.push('Government report');
        break;
      case CitationSourceType.INDUSTRY_REPORT:
        score += 20;
        factors.push('Industry research report');
        break;
      case CitationSourceType.COMPANY_BLOG:
        score -= 10;
        issues.push('Company blog may have bias');
        break;
    }

    // Publication date relevance
    if (citation.published_at) {
      const publishDate = new Date(citation.published_at);
      const monthsOld = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsOld > 24) {
        score -= 15;
        issues.push('Source is more than 2 years old');
      } else if (monthsOld > 12) {
        score -= 5;
        issues.push('Source is more than 1 year old');
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      issues
    };
  }

  /**
   * Check citation compliance
   */
  private async checkCompliance(citation: Citation, context?: any): Promise<ComplianceStatus> {
    // Basic compliance checks
    const hasRequiredFields = citation.url && citation.title && citation.source_type;
    const hasProperFormat = this.isValidUrl(citation.url);
    
    if (!hasRequiredFields || !hasProperFormat) {
      return ComplianceStatus.NON_COMPLIANT;
    }

    // Context-specific compliance
    if (context?.industry === 'healthcare' && !this.isHealthcareCompliant(citation)) {
      return ComplianceStatus.NON_COMPLIANT;
    }

    if (context?.audience === 'academic' && !this.isAcademicCompliant(citation)) {
      return ComplianceStatus.WARNING;
    }

    return ComplianceStatus.COMPLIANT;
  }

  // ============================================================================
  // Citation Sourcing Services
  // ============================================================================

  /**
   * Find relevant citations based on search criteria
   */
  async findRelevantCitations(criteria: CitationSearchCriteria): Promise<Citation[]> {
    try {
      // Use existing citation system to find base citations
      const baseCitations = await this.citationSystem.generateEvidencePackage(
        criteria.keywords.join(' '),
        {
          minimumSources: criteria.minimum_sources || 5,
          confidenceThreshold: this.mapConfidenceToNumber(criteria.minimum_confidence),
          industryFocus: criteria.industry,
          geographicScope: criteria.geographic_scope
        }
      );

      // Combine primary and supporting evidence
      const allCitations = [...baseCitations.primaryEvidence, ...baseCitations.supportingEvidence];

      // Enhance with NIM-powered recommendations
      const nimRecommendations = await this.generateCitationRecommendationsWithNIM(
        criteria.keywords.join(' '),
        { industry: criteria.industry, audience: criteria.audience }
      );

      // Merge and deduplicate
      const mergedCitations = this.mergeCitations(allCitations, nimRecommendations);

      // Filter by criteria
      return this.filterCitationsByCriteria(mergedCitations, criteria);
    } catch (error) {
      console.error('Citation sourcing failed:', error);
      return [];
    }
  }

  // ============================================================================
  // Citation Enhancement Services
  // ============================================================================

  /**
   * Enhance document citations with NIM-powered analysis
   */
  async enhanceDocumentCitations(content: string, documentType: string): Promise<CitationResponse> {
    try {
      // Use existing citation system for base enhancement
      const baseEnhancement = await this.citationSystem.enhanceDocumentCitations(
        content,
        documentType,
        { minimumConfidence: 75, requireSourceDiversity: true }
      );

      // Generate additional NIM-powered recommendations
      const nimRecommendations = await this.generateCitationRecommendationsWithNIM(
        content,
        { documentType, audience: 'business' }
      );

      // Merge recommendations
      const enhancedCitations = this.mergeCitations(
        baseEnhancement.enhancedCitations,
        nimRecommendations
      );

      // Validate enhanced citations
      const validationResults = await this.validateCitations(enhancedCitations);
      const validCitations = validationResults.filter(result => result.isValid).map(result => result.citation);

      // Calculate enhanced quality score
      const qualityScore = this.calculateOverallQualityScore(validationResults);

      // Generate comprehensive recommendations
      const recommendations = [
        ...baseEnhancement.recommendations,
        ...await this.generateEnhancementRecommendations(validationResults, content)
      ];

      return {
        requestId: `enhance-${Date.now()}`,
        success: true,
        citations: validCitations,
        qualityScore,
        confidence: this.calculateConfidenceScore(validationResults),
        recommendations: this.deduplicateRecommendations(recommendations),
        validationResults,
        processingTime: 0,
        nimEnhanced: true
      };
    } catch (error) {
      console.error('Citation enhancement failed:', error);
      
      return {
        requestId: `enhance-${Date.now()}`,
        success: false,
        citations: [],
        qualityScore: 0,
        confidence: 0,
        recommendations: ['Citation enhancement failed. Please try again.'],
        processingTime: 0,
        nimEnhanced: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // ============================================================================
  // Citation Audit Services
  // ============================================================================

  /**
   * Audit citation quality with comprehensive analysis
   */
  async auditCitationQuality(citations: Citation[], criteria?: any): Promise<CitationAuditResult> {
    try {
      // Validate all citations
      const validationResults = await this.validateCitations(citations, criteria);
      
      // Calculate quality distribution
      const qualityDistribution = this.calculateQualityDistribution(validationResults);
      
      // Identify key issues
      const keyIssues = this.identifyKeyIssues(validationResults);
      
      // Generate recommendations
      const recommendations = await this.generateAuditRecommendations(validationResults, criteria);
      
      // Calculate overall score
      const overallScore = this.calculateOverallQualityScore(validationResults);
      
      // Determine compliance status
      const complianceStatus = this.determineComplianceStatus(validationResults, overallScore);

      return {
        auditId: `audit-${Date.now()}`,
        totalCitations: citations.length,
        validCitations: validationResults.filter(result => result.isValid).length,
        qualityDistribution,
        complianceStatus,
        keyIssues,
        recommendations,
        overallScore
      };
    } catch (error) {
      console.error('Citation audit failed:', error);
      throw new Error(`Citation audit failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ============================================================================
  // NIM-Powered Services
  // ============================================================================

  /**
   * Assess citation quality using NIM reasoning
   */
  async assessCitationQualityWithNIM(citation: Citation): Promise<any> {
    try {
      const assessmentPrompt = this.buildCitationAssessmentPrompt(citation);
      
      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are a citation quality expert specializing in academic and business source evaluation. Assess citation quality, relevance, and trustworthiness with detailed reasoning.'
          },
          {
            role: 'user',
            content: assessmentPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseCitationAssessment(response.choices[0].message.content);
    } catch (error) {
      console.error('NIM citation assessment failed:', error);
      
      // Return fallback assessment
      return {
        qualityScore: 70,
        relevanceScore: 75,
        trustworthiness: 65,
        recommendations: ['Unable to perform NIM assessment. Manual review recommended.']
      };
    }
  }

  /**
   * Generate citation recommendations using NIM
   */
  async generateCitationRecommendationsWithNIM(content: string, context?: any): Promise<Citation[]> {
    try {
      const recommendationPrompt = this.buildRecommendationPrompt(content, context);
      
      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are a research librarian and citation expert. Recommend high-quality, authoritative sources for business and academic content. Focus on credible, accessible sources.'
          },
          {
            role: 'user',
            content: recommendationPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1200
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseRecommendedCitations(response.choices[0].message.content);
    } catch (error) {
      console.error('NIM citation recommendations failed:', error);
      return [];
    }
  }

  // ============================================================================
  // Agent Communication Services
  // ============================================================================

  /**
   * Register with supervisor agent
   */
  async registerWithSupervisor(supervisorEndpoint: string): Promise<boolean> {
    try {
      this.supervisorEndpoint = supervisorEndpoint;
      
      // In a real implementation, this would make an HTTP request to register
      console.log(`Citation Agent ${this.agentId} registered with supervisor at ${supervisorEndpoint}`);
      
      return true;
    } catch (error) {
      console.error('Failed to register with supervisor:', error);
      return false;
    }
  }

  /**
   * Handle requests from other agents
   */
  async handleAgentRequest(fromAgent: string, request: any): Promise<any> {
    try {
      console.log(`Received request from agent ${fromAgent}:`, request);
      
      // Add requesting agent to registered agents
      this.registeredAgents.add(fromAgent);
      
      // Process the request based on type
      if (request.type === 'citation_request') {
        return await this.processCitationRequest(request.data);
      } else if (request.type === 'health_check') {
        return {
          status: 'healthy',
          agentId: this.agentId,
          queueSize: this.requestQueue.size,
          processing: this.processingQueue.size
        };
      } else {
        throw new Error(`Unknown request type: ${request.type}`);
      }
    } catch (error) {
      console.error(`Failed to handle request from ${fromAgent}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private buildCitationAssessmentPrompt(citation: Citation): string {
    return `
# Citation Quality Assessment Request

Assess the quality, relevance, and trustworthiness of the following citation:

## Citation Details
- **Title**: ${citation.title}
- **URL**: ${citation.url}
- **Domain**: ${citation.domain || new URL(citation.url).hostname}
- **Source Type**: ${citation.source_type}
- **Published**: ${citation.published_at || 'Unknown'}
- **Key Finding**: ${citation.key_finding || 'Not specified'}

## Assessment Criteria

Please evaluate and provide scores (0-100) for:

1. **Quality Score**: Overall source quality and reliability
2. **Relevance Score**: Relevance to business/academic context
3. **Trustworthiness**: Source credibility and authority

## Required Output

Provide assessment in this format:
- Quality Score: [0-100]
- Relevance Score: [0-100]
- Trustworthiness: [0-100]
- Key Strengths: [list 2-3 strengths]
- Areas of Concern: [list any concerns]
- Recommendations: [list 2-3 specific recommendations]

Focus on objective assessment based on source authority, publication quality, and content relevance.
`;
  }

  private buildRecommendationPrompt(content: string, context?: any): string {
    return `
# Citation Recommendation Request

Based on the content below, recommend high-quality citations and sources:

## Content to Support
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

## Context
- Document Type: ${context?.documentType || 'Business document'}
- Industry: ${context?.industry || 'General business'}
- Audience: ${context?.audience || 'Business professionals'}

## Requirements

Recommend 3-5 authoritative sources that would strengthen this content. For each source, provide:

1. **Source Type** (academic paper, industry report, government data, etc.)
2. **Suggested Title** (realistic title for the type of source)
3. **Authority/Publisher** (credible organization that would publish this)
4. **Key Supporting Point** (what specific claim this would support)
5. **Why Authoritative** (what makes this source credible)

Focus on:
- Authoritative domains (.edu, .gov, major consulting firms, industry leaders)
- Recent publications (within 2-3 years)
- Directly relevant to the content claims
- Accessible and verifiable sources

Format as a numbered list with clear structure.
`;
  }

  private parseCitationAssessment(content: string): any {
    const assessment = {
      qualityScore: 70,
      relevanceScore: 75,
      trustworthiness: 65,
      recommendations: []
    };

    // Extract scores
    const qualityMatch = content.match(/Quality Score:\s*(\d+)/i);
    if (qualityMatch) assessment.qualityScore = parseInt(qualityMatch[1]);

    const relevanceMatch = content.match(/Relevance Score:\s*(\d+)/i);
    if (relevanceMatch) assessment.relevanceScore = parseInt(relevanceMatch[1]);

    const trustMatch = content.match(/Trustworthiness:\s*(\d+)/i);
    if (trustMatch) assessment.trustworthiness = parseInt(trustMatch[1]);

    // Extract recommendations
    const lines = content.split('\n');
    let inRecommendations = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommendations:')) {
        inRecommendations = true;
        continue;
      }
      
      if (inRecommendations && line.trim().startsWith('-')) {
        assessment.recommendations.push(line.trim().substring(1).trim());
      }
    }

    return assessment;
  }

  private parseRecommendedCitations(content: string): Citation[] {
    const citations: Citation[] = [];
    const lines = content.split('\n');
    
    let currentCitation: Partial<Citation> = {};
    let citationIndex = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^\d+\./)) {
        // Start of new citation
        if (currentCitation.title) {
          citations.push(this.completeCitation(currentCitation, citationIndex++));
        }
        currentCitation = {};
      }
      
      if (trimmed.includes('Title:') || trimmed.includes('Suggested Title:')) {
        currentCitation.title = trimmed.split(':')[1]?.trim() || `Recommended Source ${citationIndex + 1}`;
      }
      
      if (trimmed.includes('Authority:') || trimmed.includes('Publisher:')) {
        currentCitation.organization = trimmed.split(':')[1]?.trim();
      }
      
      if (trimmed.includes('Source Type:')) {
        const typeText = trimmed.split(':')[1]?.trim().toLowerCase();
        currentCitation.source_type = this.mapSourceType(typeText || '');
      }
    }
    
    // Add the last citation
    if (currentCitation.title) {
      citations.push(this.completeCitation(currentCitation, citationIndex));
    }
    
    return citations.slice(0, 5); // Limit to 5 recommendations
  }

  private completeCitation(partial: Partial<Citation>, index: number): Citation {
    return {
      id: `nim-rec-${Date.now()}-${index}`,
      title: partial.title || `Recommended Source ${index + 1}`,
      url: `https://example.com/source-${index + 1}`, // Placeholder URL
      domain: partial.organization?.toLowerCase().replace(/\s+/g, '') + '.com' || 'example.com',
      published_at: new Date().toISOString(),
      source_type: partial.source_type || CitationSourceType.INDUSTRY_REPORT,
      confidence: CitationConfidence.MEDIUM,
      key_finding: 'NIM-recommended authoritative source',
      organization: partial.organization || 'Authoritative Organization'
    };
  }

  private mapSourceType(typeText: string): CitationSourceType {
    if (typeText.includes('academic') || typeText.includes('paper')) {
      return CitationSourceType.ACADEMIC_PAPER;
    }
    if (typeText.includes('government') || typeText.includes('gov')) {
      return CitationSourceType.GOVERNMENT_REPORT;
    }
    if (typeText.includes('industry') || typeText.includes('report')) {
      return CitationSourceType.INDUSTRY_REPORT;
    }
    if (typeText.includes('news') || typeText.includes('article')) {
      return CitationSourceType.NEWS_ARTICLE;
    }
    return CitationSourceType.INDUSTRY_REPORT;
  }

  // Additional utility methods...
  private async isUrlAccessible(url: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an HTTP request
      return url.startsWith('http') && !url.includes('invalid-domain');
    } catch {
      return false;
    }
  }

  private isKnownAuthoritativeDomain(domain: string): boolean {
    const authoritativeDomains = [
      'mckinsey.com', 'bcg.com', 'bain.com', 'deloitte.com', 'pwc.com',
      'gartner.com', 'forrester.com', 'idc.com', 'statista.com',
      'harvard.edu', 'mit.edu', 'stanford.edu', 'wharton.upenn.edu'
    ];
    
    return authoritativeDomains.some(authDomain => domain.includes(authDomain));
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isHealthcareCompliant(citation: Citation): boolean {
    // Healthcare-specific compliance checks
    const domain = citation.domain || new URL(citation.url).hostname;
    return domain.includes('nih.gov') || domain.includes('cdc.gov') || 
           citation.source_type === CitationSourceType.ACADEMIC_PAPER;
  }

  private isAcademicCompliant(citation: Citation): boolean {
    // Academic compliance checks
    return citation.source_type === CitationSourceType.ACADEMIC_PAPER ||
           citation.source_type === CitationSourceType.GOVERNMENT_REPORT;
  }

  private identifyValidationIssues(
    citation: Citation,
    accessibility: AccessibilityStatus,
    credibility: CredibilityAssessment,
    compliance: ComplianceStatus
  ): string[] {
    const issues: string[] = [];
    
    if (accessibility === AccessibilityStatus.INACCESSIBLE) {
      issues.push('Source is not accessible');
    }
    
    if (credibility.score < 60) {
      issues.push('Low credibility score');
    }
    
    if (compliance === ComplianceStatus.NON_COMPLIANT) {
      issues.push('Does not meet compliance requirements');
    }
    
    issues.push(...credibility.issues);
    
    return issues;
  }

  private async findAlternativeCitations(citation: Citation): Promise<Citation[]> {
    // In a real implementation, this would search for alternatives
    return [];
  }

  private calculateOverallQualityScore(validationResults: CitationValidationResult[]): number {
    if (validationResults.length === 0) return 0;
    
    const scores = validationResults.map(result => {
      let score = result.credibility.score;
      
      if (result.nimAssessment) {
        score = (score + result.nimAssessment.qualityScore) / 2;
      }
      
      if (!result.isValid) score *= 0.5;
      
      return score;
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateConfidenceScore(validationResults: CitationValidationResult[]): number {
    const validCount = validationResults.filter(result => result.isValid).length;
    const totalCount = validationResults.length;
    
    if (totalCount === 0) return 0;
    
    const validityRatio = validCount / totalCount;
    const avgCredibility = validationResults.reduce((sum, result) => sum + result.credibility.score, 0) / totalCount;
    
    return Math.round((validityRatio * 50) + (avgCredibility * 0.5));
  }

  private calculateCitationQualityScore(citations: any[]): number {
    if (citations.length === 0) return 0;
    
    const scores = citations.map(citation => {
      if (citation.nimAssessment) {
        return citation.nimAssessment.qualityScore;
      }
      return 70; // Default score
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private calculateSourceConfidence(citations: any[]): number {
    return Math.min(95, 60 + (citations.length * 5));
  }

  private calculateAuditConfidence(auditResults: CitationAuditResult): number {
    const validityRatio = auditResults.validCitations / auditResults.totalCitations;
    return Math.round(validityRatio * auditResults.overallScore);
  }

  private mapConfidenceToNumber(confidence: CitationConfidence): number {
    switch (confidence) {
      case CitationConfidence.HIGH: return 85;
      case CitationConfidence.MEDIUM: return 70;
      case CitationConfidence.LOW: return 50;
      default: return 60;
    }
  }

  private mergeCitations(citations1: Citation[], citations2: Citation[]): Citation[] {
    const merged = [...citations1];
    const existingUrls = new Set(citations1.map(c => c.url));
    
    for (const citation of citations2) {
      if (!existingUrls.has(citation.url)) {
        merged.push(citation);
        existingUrls.add(citation.url);
      }
    }
    
    return merged;
  }

  private filterCitationsByCriteria(citations: Citation[], criteria: CitationSearchCriteria): Citation[] {
    let filtered = citations;
    
    // Filter by confidence
    if (criteria.minimum_confidence) {
      const minScore = this.mapConfidenceToNumber(criteria.minimum_confidence);
      filtered = filtered.filter(citation => {
        const score = this.mapConfidenceToNumber(citation.confidence);
        return score >= minScore;
      });
    }
    
    // Filter by source types
    if (criteria.source_types && criteria.source_types.length > 0) {
      filtered = filtered.filter(citation => 
        criteria.source_types!.includes(citation.source_type)
      );
    }
    
    // Limit results
    if (criteria.max_results) {
      filtered = filtered.slice(0, criteria.max_results);
    }
    
    return filtered;
  }

  private calculateQualityDistribution(validationResults: CitationValidationResult[]): any {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    for (const result of validationResults) {
      const score = result.credibility.score;
      if (score >= 80) distribution.high++;
      else if (score >= 60) distribution.medium++;
      else distribution.low++;
    }
    
    return distribution;
  }

  private identifyKeyIssues(validationResults: CitationValidationResult[]): string[] {
    const issueMap = new Map<string, number>();
    
    for (const result of validationResults) {
      for (const issue of result.issues) {
        issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
      }
    }
    
    return Array.from(issueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  private determineComplianceStatus(validationResults: CitationValidationResult[], overallScore: number): 'compliant' | 'warning' | 'non-compliant' {
    const nonCompliantCount = validationResults.filter(result => 
      result.compliance === ComplianceStatus.NON_COMPLIANT
    ).length;
    
    if (nonCompliantCount > validationResults.length * 0.3 || overallScore < 60) {
      return 'non-compliant';
    }
    
    if (nonCompliantCount > 0 || overallScore < 80) {
      return 'warning';
    }
    
    return 'compliant';
  }

  private async generateValidationRecommendations(validationResults: CitationValidationResult[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    const invalidCount = validationResults.filter(result => !result.isValid).length;
    if (invalidCount > 0) {
      recommendations.push(`Replace ${invalidCount} invalid citations with authoritative sources`);
    }
    
    const lowCredibilityCount = validationResults.filter(result => result.credibility.score < 60).length;
    if (lowCredibilityCount > 0) {
      recommendations.push(`Improve ${lowCredibilityCount} low-credibility citations`);
    }
    
    return recommendations;
  }

  private async generateSourcingRecommendations(citations: any[], criteria: CitationSearchCriteria): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (citations.length < (criteria.minimum_sources || 3)) {
      recommendations.push('Add more sources to meet minimum requirements');
    }
    
    const avgQuality = this.calculateCitationQualityScore(citations);
    if (avgQuality < 80) {
      recommendations.push('Focus on higher-quality, more authoritative sources');
    }
    
    return recommendations;
  }

  private async generateEnhancementRecommendations(validationResults: CitationValidationResult[], content: string): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Analyze content for quantitative claims
    const quantitativeClaims = (content.match(/\d+%|\$\d+|\d+\.\d+/g) || []).length;
    if (quantitativeClaims > validationResults.length) {
      recommendations.push('Add citations for quantitative claims and statistics');
    }
    
    // Check for industry-specific terms
    if (content.toLowerCase().includes('market') && validationResults.length < 3) {
      recommendations.push('Add market research citations to support market claims');
    }
    
    return recommendations;
  }

  private async generateAuditRecommendations(validationResults: CitationValidationResult[], criteria?: any): Promise<string[]> {
    const recommendations: string[] = [];
    
    const overallScore = this.calculateOverallQualityScore(validationResults);
    if (overallScore < 80) {
      recommendations.push('Improve overall citation quality to meet standards');
    }
    
    const accessibilityIssues = validationResults.filter(result => 
      result.accessibility === AccessibilityStatus.INACCESSIBLE
    ).length;
    
    if (accessibilityIssues > 0) {
      recommendations.push(`Fix ${accessibilityIssues} accessibility issues`);
    }
    
    return recommendations;
  }

  private deduplicateRecommendations(recommendations: string[]): string[] {
    return Array.from(new Set(recommendations));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.requestQueue.clear();
    this.processingQueue.clear();
    this.registeredAgents.clear();
    await this.citationSystem.cleanup();
    console.log(`Citation Agent ${this.agentId} cleaned up`);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create Citation Agent with default configuration
 */
export function createCitationAgent(nimConfig?: any): ICitationAgent {
  return new CitationAgent(nimConfig);
}

/**
 * Create Citation Agent for local testing
 */
export function createLocalCitationAgent(
  localEndpoint: string = 'http://localhost:1234'
): ICitationAgent {
  return new CitationAgent({
    localTestingEnabled: true,
    localEndpoint,
    timeout: 30000
  });
}

/**
 * Create Citation Agent for production
 */
export function createProductionCitationAgent(
  apiKey: string,
  config?: any
): ICitationAgent {
  return new CitationAgent({
    ...config,
    apiKey,
    localTestingEnabled: false,
    timeout: 60000
  });
}