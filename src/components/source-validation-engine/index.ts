// Source Validation Engine for Enhanced Citation System

import {
  Citation,
  AccessibilityStatus,
  CredibilityAssessment,
  ComplianceStatus,
  EnhancedCitation,
  CitationSourceType,
  CitationConfidence,
} from '../../models/citations';
import { IntelligentCache, AsyncBatchProcessor, PerformanceMetrics } from '../performance-optimizer';

/**
 * Configuration for source validation
 */
export interface ValidationConfig {
  timeout: number; // Request timeout in milliseconds
  retryAttempts: number;
  cacheExpiry: number; // Cache expiry in hours
  enableDomainAuthority: boolean;
  complianceStandards: string[];
}

/**
 * Domain authority data structure
 */
interface DomainAuthority {
  domain: string;
  authorityScore: number; // 0-100
  trustScore: number; // 0-100
  spamScore: number; // 0-100
  backlinks: number;
  referringDomains: number;
  lastUpdated: Date;
}

/**
 * Source validation result
 */
export interface ValidationResult {
  citation: Citation;
  accessibilityStatus: AccessibilityStatus;
  credibilityAssessment: CredibilityAssessment;
  complianceStatus: ComplianceStatus;
  alternativeSources: Citation[];
  validationTimestamp: Date;
}

/**
 * Source Validation Engine for comprehensive citation validation
 */
export class SourceValidationEngine {
  private config: ValidationConfig;
  private accessibilityCache: IntelligentCache<AccessibilityStatus>;
  private credibilityCache: IntelligentCache<CredibilityAssessment>;
  private domainAuthorityCache: IntelligentCache<DomainAuthority>;
  private batchProcessor: AsyncBatchProcessor;
  private knownHighQualityDomains: Set<string> = new Set();
  private knownLowQualityDomains: Set<string> = new Set();

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      cacheExpiry: 24, // 24 hours
      enableDomainAuthority: true,
      complianceStandards: ['academic', 'business', 'regulatory'],
      ...config,
    };

    // Initialize intelligent caches
    const cacheConfig = {
      ttl: this.config.cacheExpiry * 60 * 60 * 1000, // Convert hours to milliseconds
      maxSize: 5000,
      compressionEnabled: true,
    };

    this.accessibilityCache = new IntelligentCache<AccessibilityStatus>(cacheConfig);
    this.credibilityCache = new IntelligentCache<CredibilityAssessment>(cacheConfig);
    this.domainAuthorityCache = new IntelligentCache<DomainAuthority>(cacheConfig);

    // Initialize batch processor
    this.batchProcessor = new AsyncBatchProcessor({
      batchSize: 20,
      maxConcurrency: 5,
      retryAttempts: this.config.retryAttempts,
      timeoutMs: this.config.timeout,
    });

    this.initializeKnownDomains();
  }

  /**
   * Initialize known high and low quality domains
   */
  private initializeKnownDomains(): void {
    // High quality domains
    this.knownHighQualityDomains.add('mckinsey.com');
    this.knownHighQualityDomains.add('bcg.com');
    this.knownHighQualityDomains.add('bain.com');
    this.knownHighQualityDomains.add('deloitte.com');
    this.knownHighQualityDomains.add('pwc.com');
    this.knownHighQualityDomains.add('accenture.com');
    this.knownHighQualityDomains.add('hbr.org');
    this.knownHighQualityDomains.add('gartner.com');
    this.knownHighQualityDomains.add('forrester.com');
    this.knownHighQualityDomains.add('mit.edu');
    this.knownHighQualityDomains.add('harvard.edu');
    this.knownHighQualityDomains.add('stanford.edu');
    this.knownHighQualityDomains.add('wharton.upenn.edu');
    this.knownHighQualityDomains.add('gov');
    this.knownHighQualityDomains.add('edu');
    this.knownHighQualityDomains.add('org');

    // Low quality domains (known spam or unreliable sources)
    this.knownLowQualityDomains.add('contentfarm.com');
    this.knownLowQualityDomains.add('clickbait.net');
    this.knownLowQualityDomains.add('spamsite.org');
  }

  /**
   * Validate source accessibility with HTTP status checking
   */
  async validateSourceAccessibility(url: string): Promise<AccessibilityStatus> {
    const cacheKey = `accessibility_${url}`;
    const cached = this.accessibilityCache.get(cacheKey);

    // Return cached result if available
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    let status: AccessibilityStatus = {
      isAccessible: false,
      accessType: 'broken',
      lastChecked: new Date(),
      alternativeAccess: [],
      cacheAvailable: false,
    };

    try {
      // Simulate HTTP request (in real implementation, use fetch or axios)
      const response = await this.makeHttpRequest(url);
      const responseTime = Date.now() - startTime;

      status = {
        isAccessible: response.ok,
        accessType: this.determineAccessType(response),
        lastChecked: new Date(),
        alternativeAccess: await this.findAlternativeAccess(url, response),
        cacheAvailable: await this.checkCacheAvailability(url),
        httpStatus: response.status,
        responseTime,
      };

      if (!response.ok) {
        status.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      status.alternativeAccess = await this.findAlternativeAccess(url);
    }

    // Cache the result
    this.accessibilityCache.set(cacheKey, status);
    return status;
  }

  /**
   * Assess source credibility with domain authority analysis
   */
  async assessSourceCredibility(source: Citation): Promise<CredibilityAssessment> {
    const cacheKey = `credibility_${source.domain}`;
    const cached = this.credibilityCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const domainAuthority = await this.getDomainAuthority(source.domain);
    const authorCredentials = this.assessAuthorCredentials(source);
    const peerReviewStatus = this.assessPeerReviewStatus(source);
    const citationFrequency = await this.getCitationFrequency(source);
    const methodologyTransparency = this.assessMethodologyTransparency(source);

    const factors = {
      domainAuthority: domainAuthority.authorityScore,
      authorCredentials,
      peerReviewStatus,
      citationFrequency,
      methodologyTransparency,
    };

    const overallScore = this.calculateOverallCredibilityScore(factors);
    const riskFactors = this.identifyRiskFactors(source, domainAuthority);
    const confidenceLevel = this.determineConfidenceLevel(overallScore, riskFactors);

    const assessment: CredibilityAssessment = {
      overallScore,
      factors,
      riskFactors,
      confidenceLevel,
      assessmentDate: new Date(),
    };

    this.credibilityCache.set(cacheKey, assessment);
    return assessment;
  }

  /**
   * Check compliance requirements for regulatory standards
   */
  async checkComplianceRequirements(source: Citation): Promise<ComplianceStatus> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check academic compliance
    if (this.config.complianceStandards.includes('academic')) {
      if (!source.authors && !source.organization) {
        violations.push('Missing author or organization information');
        recommendations.push('Add author or organization details for academic compliance');
      }

      if (!source.published_at) {
        violations.push('Missing publication date');
        recommendations.push('Include publication date for temporal context');
      }

      if (!source.methodology && source.source_type === CitationSourceType.RESEARCH_PUBLICATION) {
        violations.push('Missing methodology for research publication');
        recommendations.push('Include methodology details for research transparency');
      }
    }

    // Check business compliance
    if (this.config.complianceStandards.includes('business')) {
      if (!source.key_finding) {
        violations.push('Missing key finding or insight');
        recommendations.push('Include specific key finding for business relevance');
      }

      if (source.confidence === CitationConfidence.LOW && source.source_type === CitationSourceType.CONSULTING_STUDY) {
        violations.push('Low confidence consulting study');
        recommendations.push('Verify consulting study credibility or find alternative source');
      }
    }

    // Check regulatory compliance
    if (this.config.complianceStandards.includes('regulatory')) {
      if (source.domain.includes('gov') && !source.last_accessed) {
        violations.push('Government source missing access date');
        recommendations.push('Include access date for government sources');
      }
    }

    return {
      isCompliant: violations.length === 0,
      checkedStandards: this.config.complianceStandards,
      violations,
      recommendations,
      lastChecked: new Date(),
    };
  }

  /**
   * Find alternative sources for broken or inaccessible links
   */
  async findAlternativeSources(originalSource: Citation): Promise<Citation[]> {
    const alternatives: Citation[] = [];

    // Try to find archived versions
    const archivedVersions = await this.findArchivedVersions(originalSource.url);
    alternatives.push(...archivedVersions);

    // Find similar sources by title and organization
    const similarSources = await this.findSimilarSources(originalSource);
    alternatives.push(...similarSources);

    // Find updated versions from the same organization
    const updatedVersions = await this.findUpdatedVersions(originalSource);
    alternatives.push(...updatedVersions);

    // Remove duplicates and limit results
    const uniqueAlternatives = this.removeDuplicateSources(alternatives);
    return uniqueAlternatives.slice(0, 5);
  }

  /**
   * Perform comprehensive validation of a citation
   */
  async validateCitation(citation: Citation): Promise<ValidationResult> {
    const [accessibilityStatus, credibilityAssessment, complianceStatus, alternativeSources] =
      await Promise.all([
        this.validateSourceAccessibility(citation.url),
        this.assessSourceCredibility(citation),
        this.checkComplianceRequirements(citation),
        this.findAlternativeSources(citation),
      ]);

    return {
      citation,
      accessibilityStatus,
      credibilityAssessment,
      complianceStatus,
      alternativeSources,
      validationTimestamp: new Date(),
    };
  }

  /**
   * Batch validate multiple citations with optimized processing
   */
  async validateCitations(citations: Citation[]): Promise<ValidationResult[]> {
    return this.batchProcessor.processBatch(
      citations,
      (citation) => this.validateCitation(citation),
      'citation_validation'
    );
  }

  /**
   * Batch validate multiple URLs for accessibility
   */
  async validateMultipleAccessibility(urls: string[]): Promise<AccessibilityStatus[]> {
    return this.batchProcessor.processBatch(
      urls,
      (url) => this.validateSourceAccessibility(url),
      'accessibility_validation'
    );
  }

  /**
   * Batch assess credibility for multiple sources
   */
  async assessMultipleCredibility(sources: Citation[]): Promise<CredibilityAssessment[]> {
    return this.batchProcessor.processBatch(
      sources,
      (source) => this.assessSourceCredibility(source),
      'credibility_assessment'
    );
  }

  /**
   * Create enhanced citation with validation data
   */
  async createEnhancedCitation(citation: Citation): Promise<EnhancedCitation> {
    const validationResult = await this.validateCitation(citation);

    const qualityMetrics = {
      credibilityScore: validationResult.credibilityAssessment.overallScore,
      relevanceScore: this.calculateRelevanceScore(citation),
      recencyScore: this.calculateRecencyScore(citation),
      methodologyScore: validationResult.credibilityAssessment.factors.methodologyTransparency,
      overallQuality: this.calculateOverallQuality(validationResult),
    };

    return {
      ...citation,
      validationStatus: {
        lastValidated: validationResult.validationTimestamp,
        accessibilityStatus: validationResult.accessibilityStatus,
        credibilityAssessment: validationResult.credibilityAssessment,
        complianceStatus: validationResult.complianceStatus,
      },
      qualityMetrics,
      usageTracking: {
        timesUsed: 0,
        documentsReferenced: [],
        lastUsed: new Date(),
        effectivenessRating: 0,
      },
      alternatives: {
        similarSources: validationResult.alternativeSources.filter(s => s.organization === citation.organization),
        updatedVersions: validationResult.alternativeSources.filter(s => 
          new Date(s.published_at) > new Date(citation.published_at)
        ),
        betterAlternatives: validationResult.alternativeSources.filter(s => 
          s.confidence === CitationConfidence.HIGH
        ),
      },
    };
  }

  // Private helper methods

  private async makeHttpRequest(url: string): Promise<{ ok: boolean; status: number; statusText: string }> {
    // Simulate HTTP request - in real implementation, use fetch or axios
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Handle malformed URLs
        if (!url || !url.startsWith('http')) {
          reject(new Error('Invalid URL format'));
          return;
        }

        // Simulate different response types based on URL patterns
        if (url.includes('broken') || url.includes('404')) {
          resolve({ ok: false, status: 404, statusText: 'Not Found' });
        } else if (url.includes('paywall')) {
          resolve({ ok: true, status: 200, statusText: 'OK' });
        } else if (url.includes('timeout')) {
          resolve({ ok: false, status: 408, statusText: 'Request Timeout' });
        } else {
          resolve({ ok: true, status: 200, statusText: 'OK' });
        }
      }, Math.random() * 1000); // Random delay up to 1 second
    });
  }

  private determineAccessType(response: { ok: boolean; status: number }): 'free' | 'paywall' | 'subscription' | 'broken' {
    if (!response.ok) return 'broken';
    
    // In real implementation, analyze response content for paywall indicators
    if (Math.random() < 0.2) return 'paywall';
    if (Math.random() < 0.1) return 'subscription';
    return 'free';
  }

  private async findAlternativeAccess(url: string, response?: any): Promise<string[]> {
    const alternatives: string[] = [];
    
    // Add archive.org link
    alternatives.push(`https://web.archive.org/web/*/${url}`);
    
    // Add cached Google link
    alternatives.push(`https://webcache.googleusercontent.com/search?q=cache:${url}`);
    
    return alternatives;
  }

  private async checkCacheAvailability(url: string): Promise<boolean> {
    // Simulate cache availability check
    return Math.random() > 0.3; // 70% chance of cache availability
  }

  private async getDomainAuthority(domain: string): Promise<DomainAuthority> {
    const cached = this.domainAuthorityCache.get(domain);
    if (cached) {
      return cached;
    }

    // Handle undefined or null domain
    if (!domain) {
      domain = 'unknown.com';
    }

    // Simulate domain authority calculation
    let authorityScore = 50; // Default score
    let trustScore = 50;
    let spamScore = 10;

    if (this.knownHighQualityDomains.has(domain) || domain.endsWith('.edu') || domain.endsWith('.gov')) {
      authorityScore = 80 + Math.random() * 20;
      trustScore = 85 + Math.random() * 15;
      spamScore = Math.random() * 5;
    } else if (this.knownLowQualityDomains.has(domain)) {
      authorityScore = Math.random() * 30;
      trustScore = Math.random() * 25;
      spamScore = 70 + Math.random() * 30;
    } else {
      authorityScore = 30 + Math.random() * 40;
      trustScore = 40 + Math.random() * 40;
      spamScore = Math.random() * 30;
    }

    const domainAuthority: DomainAuthority = {
      domain,
      authorityScore: Math.round(authorityScore),
      trustScore: Math.round(trustScore),
      spamScore: Math.round(spamScore),
      backlinks: Math.floor(Math.random() * 10000),
      referringDomains: Math.floor(Math.random() * 1000),
      lastUpdated: new Date(),
    };

    this.domainAuthorityCache.set(domain, domainAuthority);
    return domainAuthority;
  }

  private assessAuthorCredentials(source: Citation): number {
    let score = 50; // Default score

    if (source.authors && source.authors.length > 0) {
      score += 20; // Has authors
      if (source.authors.some(author => author.includes('PhD') || author.includes('Dr.'))) {
        score += 15; // Has PhD authors
      }
    }

    if (source.organization) {
      if (this.knownHighQualityDomains.has(source.domain)) {
        score += 20; // Reputable organization
      }
    }

    return Math.min(100, score);
  }

  private assessPeerReviewStatus(source: Citation): number {
    if (source.source_type === CitationSourceType.ACADEMIC_PAPER) {
      return 90; // Academic papers are typically peer-reviewed
    }
    if (source.source_type === CitationSourceType.RESEARCH_PUBLICATION) {
      return 80; // Research publications often peer-reviewed
    }
    if (source.source_type === CitationSourceType.CONSULTING_STUDY) {
      return 70; // Consulting studies have internal review
    }
    if (source.source_type === CitationSourceType.INDUSTRY_REPORT) {
      return 60; // Industry reports have some review
    }
    if (source.source_type === CitationSourceType.GOVERNMENT_DATA) {
      return 75; // Government data has official review
    }
    return 40; // Other sources have limited peer review
  }

  private async getCitationFrequency(source: Citation): Promise<number> {
    // Simulate citation frequency calculation
    if (source.source_type === CitationSourceType.ACADEMIC_PAPER) {
      return 60 + Math.random() * 40;
    }
    if (source.source_type === CitationSourceType.CONSULTING_STUDY) {
      return 70 + Math.random() * 30;
    }
    return 30 + Math.random() * 50;
  }

  private assessMethodologyTransparency(source: Citation): number {
    let score = 30; // Base score

    if (source.methodology) {
      score += 40; // Has methodology description
    }

    if (source.sample_size && source.sample_size > 0) {
      score += 20; // Has sample size
      if (source.sample_size > 1000) {
        score += 10; // Large sample size
      }
    }

    return Math.min(100, score);
  }

  private calculateOverallCredibilityScore(factors: CredibilityAssessment['factors']): number {
    const weights = {
      domainAuthority: 0.3,
      authorCredentials: 0.2,
      peerReviewStatus: 0.2,
      citationFrequency: 0.15,
      methodologyTransparency: 0.15,
    };

    return Math.round(
      factors.domainAuthority * weights.domainAuthority +
      factors.authorCredentials * weights.authorCredentials +
      factors.peerReviewStatus * weights.peerReviewStatus +
      factors.citationFrequency * weights.citationFrequency +
      factors.methodologyTransparency * weights.methodologyTransparency
    );
  }

  private identifyRiskFactors(source: Citation, domainAuthority: DomainAuthority): string[] {
    const riskFactors: string[] = [];

    if (domainAuthority.spamScore > 50) {
      riskFactors.push('High spam score detected');
    }

    if (domainAuthority.authorityScore < 30) {
      riskFactors.push('Low domain authority');
    }

    if (!source.authors && !source.organization) {
      riskFactors.push('Missing author/organization information');
    }

    if (source.confidence === CitationConfidence.LOW) {
      riskFactors.push('Low confidence rating');
    }

    const publicationDate = new Date(source.published_at);
    const monthsOld = (Date.now() - publicationDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld > 60) {
      riskFactors.push('Source is over 5 years old');
    }

    return riskFactors;
  }

  private determineConfidenceLevel(overallScore: number, riskFactors: string[]): 'high' | 'medium' | 'low' {
    if (overallScore >= 80 && riskFactors.length === 0) return 'high';
    if (overallScore >= 60 && riskFactors.length <= 2) return 'medium';
    return 'low';
  }

  private async findArchivedVersions(url: string): Promise<Citation[]> {
    // Simulate finding archived versions
    return []; // In real implementation, query archive.org API
  }

  private async findSimilarSources(originalSource: Citation): Promise<Citation[]> {
    // Simulate finding similar sources
    return []; // In real implementation, use search APIs or databases
  }

  private async findUpdatedVersions(originalSource: Citation): Promise<Citation[]> {
    // Simulate finding updated versions
    return []; // In real implementation, search for newer publications from same organization
  }

  private removeDuplicateSources(sources: Citation[]): Citation[] {
    const seen = new Set<string>();
    return sources.filter(source => {
      const key = `${source.url}_${source.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateRelevanceScore(citation: Citation): number {
    // Simulate relevance calculation based on citation properties
    let score = 50;
    
    if (citation.industry_focus && citation.industry_focus.length > 0) {
      score += 20;
    }
    
    if (citation.key_finding) {
      score += 15;
    }
    
    if (citation.methodology) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  private calculateRecencyScore(citation: Citation): number {
    const publicationDate = new Date(citation.published_at);
    const monthsOld = (Date.now() - publicationDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(0, 100 - monthsOld * 2); // Lose 2 points per month
  }

  private calculateOverallQuality(validationResult: ValidationResult): number {
    const weights = {
      credibility: 0.4,
      accessibility: 0.2,
      compliance: 0.2,
      recency: 0.2,
    };

    const accessibilityScore = validationResult.accessibilityStatus.isAccessible ? 100 : 0;
    const complianceScore = validationResult.complianceStatus.isCompliant ? 100 : 50;
    const recencyScore = this.calculateRecencyScore(validationResult.citation);

    return Math.round(
      validationResult.credibilityAssessment.overallScore * weights.credibility +
      accessibilityScore * weights.accessibility +
      complianceScore * weights.compliance +
      recencyScore * weights.recency
    );
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.accessibilityCache.destroy();
    this.credibilityCache.destroy();
    this.domainAuthorityCache.destroy();
  }

  /**
   * Clear validation caches
   */
  clearCache(): void {
    this.accessibilityCache.clear();
    this.credibilityCache.clear();
    this.domainAuthorityCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { 
    accessibility: any; 
    credibility: any; 
    domainAuthority: any;
    batch: PerformanceMetrics[];
  } {
    return {
      accessibility: this.accessibilityCache.getStats(),
      credibility: this.credibilityCache.getStats(),
      domainAuthority: this.domainAuthorityCache.getStats(),
      batch: this.batchProcessor.getMetrics(),
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return this.batchProcessor.getMetrics();
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.batchProcessor.clearMetrics();
  }

  /**
   * Update validation configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}