// AI Citation Discovery Engine for automated citation needs analysis and source discovery

import {
  Citation,
  CitationSourceType,
  CitationConfidence,
  CitationSearchCriteria,
} from '../../models/citations';
import { CitationService } from '../citation-service';

/**
 * Citation requirement identified by AI analysis
 */
export interface CitationRequirement {
  claim: string;
  claimType: 'quantitative' | 'qualitative' | 'comparative';
  evidenceStrength: 'weak' | 'moderate' | 'strong';
  requiredSourceTypes: CitationSourceType[];
  confidenceThreshold: number;
  industryRelevance: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: string;
  suggestedKeywords: string[];
}

/**
 * Source candidate with relevance scoring
 */
export interface SourceCandidate {
  source: Citation;
  relevanceScore: number;
  confidenceContribution: number;
  evidenceStrength: 'weak' | 'moderate' | 'strong';
  supportedClaims: string[];
  matchingKeywords: string[];
  contextAlignment: number;
}

/**
 * Unsupported claim identified in content
 */
export interface UnsupportedClaim {
  claim: string;
  claimType: 'quantitative' | 'qualitative' | 'comparative';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: string;
  suggestedEvidence: string[];
  riskLevel: number;
}

/**
 * Relevance score breakdown
 */
export interface RelevanceScore {
  overall: number;
  factors: {
    keywordMatch: number;
    industryAlignment: number;
    claimTypeMatch: number;
    recencyBonus: number;
    credibilityBonus: number;
    methodologyMatch: number;
  };
  explanation: string;
}

/**
 * AI Citation Discovery Engine for automated citation needs analysis
 */
export class AICitationDiscoveryEngine {
  private citationService: CitationService;
  private industryKeywords: Map<string, string[]> = new Map();
  private claimPatterns: RegExp[] = [];
  private quantitativePatterns: RegExp[] = [];
  private qualitativePatterns: RegExp[] = [];
  private comparativePatterns: RegExp[] = [];

  constructor(citationService?: CitationService) {
    this.citationService = citationService || new CitationService();
    this.initializeIndustryKeywords();
    this.initializeClaimPatterns();
  }

  /**
   * Initialize industry-specific keywords for better matching
   */
  private initializeIndustryKeywords(): void {
    this.industryKeywords = new Map([
      ['technology', ['software', 'ai', 'artificial intelligence', 'machine learning', 'cloud', 'digital transformation', 'automation', 'api', 'platform', 'saas', 'tech', 'developer', 'development']],
      ['finance', ['fintech', 'banking', 'investment', 'roi', 'revenue', 'cost', 'profit', 'valuation', 'funding', 'financial', 'money', 'economic']],
      ['healthcare', ['medical', 'patient', 'clinical', 'pharmaceutical', 'telemedicine', 'health tech', 'diagnosis', 'treatment', 'healthcare', 'hospital', 'doctor']],
      ['retail', ['ecommerce', 'consumer', 'shopping', 'conversion', 'customer experience', 'omnichannel', 'supply chain', 'retail', 'store', 'sales']],
      ['manufacturing', ['production', 'supply chain', 'quality', 'lean', 'automation', 'industry 4.0', 'operations', 'manufacturing', 'factory', 'industrial']],
      ['education', ['learning', 'student', 'curriculum', 'online education', 'edtech', 'assessment', 'training', 'education', 'school', 'university']],
      ['marketing', ['brand', 'campaign', 'customer acquisition', 'retention', 'engagement', 'social media', 'content marketing', 'advertising', 'promotion']],
    ]);
  }

  /**
   * Initialize patterns for identifying different types of claims
   */
  private initializeClaimPatterns(): void {
    // General claim patterns
    this.claimPatterns = [
      /\b(?:studies show|research indicates|data suggests|according to|evidence shows)\b/i,
      /\b(?:it is estimated|approximately|roughly|about|around)\s+\d+/i,
      /\b(?:increases?|decreases?|improves?|reduces?)\s+(?:by|up to)\s+\d+/i,
      /\b(?:compared to|versus|vs\.?|relative to)\b/i,
      /\b(?:industry standard|best practice|benchmark|average)\b/i,
    ];

    // Quantitative claim patterns
    this.quantitativePatterns = [
      /\b\d+(?:\.\d+)?%\b/i, // Percentages
      /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand|k|m|b)\b/i, // Large numbers
      /\b(?:increases?|decreases?|improves?|reduces?)\s+(?:by|up to)\s+\d+/i, // Change metrics
      /\b(?:roi|return on investment)\s+of\s+\d+/i, // ROI claims
      /\b\d+x\s+(?:faster|better|more|less)\b/i, // Multiplier claims
    ];

    // Qualitative claim patterns
    this.qualitativePatterns = [
      /\b(?:significantly|substantially|dramatically|considerably)\s+(?:better|worse|faster|slower)\b/i,
      /\b(?:most|majority of|many|few|some)\s+(?:companies|organizations|users|customers)\b/i,
      /\b(?:leading|top|best|worst|popular|common)\s+(?:practice|approach|solution|method)\b/i,
      /\b(?:trend|tendency|pattern|behavior)\b/i,
    ];

    // Comparative claim patterns
    this.comparativePatterns = [
      /\b(?:compared to|versus|vs\.?|relative to|in contrast to)\b/i,
      /\b(?:better|worse|faster|slower|more|less)\s+than\b/i,
      /\b(?:outperforms?|underperforms?|exceeds?|falls short)\b/i,
      /\b(?:competitive advantage|market leader|industry leader)\b/i,
    ];
  }

  /**
   * Analyze document content to identify citation needs
   */
  async analyzeCitationNeeds(content: string): Promise<CitationRequirement[]> {
    const requirements: CitationRequirement[] = [];
    const sentences = this.splitIntoSentences(content);
    
    for (const sentence of sentences) {
      const claimType = this.identifyClaimType(sentence);
      if (claimType) {
        const requirement = await this.createCitationRequirement(sentence, claimType, content);
        if (requirement) {
          requirements.push(requirement);
        }
      }
    }

    // Deduplicate and prioritize requirements
    return this.deduplicateAndPrioritize(requirements);
  }

  /**
   * Split content into sentences for analysis
   */
  private splitIntoSentences(content: string): string[] {
    // Simple sentence splitting - could be enhanced with NLP library
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short fragments
  }

  /**
   * Identify the type of claim in a sentence
   */
  private identifyClaimType(sentence: string): 'quantitative' | 'qualitative' | 'comparative' | null {
    // Reset regex lastIndex to avoid issues with global flags
    this.quantitativePatterns.forEach(pattern => pattern.lastIndex = 0);
    this.comparativePatterns.forEach(pattern => pattern.lastIndex = 0);
    this.qualitativePatterns.forEach(pattern => pattern.lastIndex = 0);
    
    if (this.quantitativePatterns.some(pattern => pattern.test(sentence))) {
      return 'quantitative';
    }
    if (this.comparativePatterns.some(pattern => pattern.test(sentence))) {
      return 'comparative';
    }
    if (this.qualitativePatterns.some(pattern => pattern.test(sentence))) {
      return 'qualitative';
    }
    
    // Additional simple checks for common patterns
    if (/\d+%|\d+x|\d+\s*(?:times|fold)|\d+\s*(?:million|billion|thousand)/i.test(sentence)) {
      return 'quantitative';
    }
    if (/(?:better|worse|faster|slower|more|less)\s+than|compared\s+to|versus|vs\.?/i.test(sentence)) {
      return 'comparative';
    }
    if (/(?:most|many|few|some|generally|typically|usually|often|rarely)/i.test(sentence)) {
      return 'qualitative';
    }
    
    return null;
  }

  /**
   * Create a citation requirement from a claim
   */
  private async createCitationRequirement(
    claim: string,
    claimType: 'quantitative' | 'qualitative' | 'comparative',
    fullContent: string
  ): Promise<CitationRequirement | null> {
    const keywords = this.extractKeywords(claim);
    const industries = this.identifyIndustries(fullContent);
    const evidenceStrength = this.assessRequiredEvidenceStrength(claim, claimType);
    const priority = this.assessClaimPriority(claim, claimType);

    if (keywords.length === 0) {
      return null; // Skip claims without clear keywords
    }

    return {
      claim: claim.trim(),
      claimType,
      evidenceStrength,
      requiredSourceTypes: this.getRequiredSourceTypes(claimType, evidenceStrength),
      confidenceThreshold: this.getConfidenceThreshold(claimType, evidenceStrength),
      industryRelevance: industries,
      priority,
      context: this.extractContext(claim, fullContent),
      suggestedKeywords: keywords,
    };
  }

  /**
   * Extract keywords from a claim
   */
  private extractKeywords(claim: string): string[] {
    const words = claim.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common stop words
    const stopWords = new Set(['this', 'that', 'with', 'from', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'which', 'will', 'would', 'could', 'should', 'have', 'been', 'were', 'said', 'each', 'than', 'more', 'most', 'some', 'very', 'also', 'just', 'only', 'even', 'much', 'such', 'well', 'like', 'back', 'over', 'after', 'before', 'through', 'during', 'above', 'below', 'between', 'among']);
    
    return words.filter(word => !stopWords.has(word));
  }

  /**
   * Identify relevant industries from content
   */
  private identifyIndustries(content: string): string[] {
    const industries: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const [industry, keywords] of this.industryKeywords.entries()) {
      const matchCount = keywords.filter(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      ).length;
      
      if (matchCount >= 1) { // Require at least 1 keyword match
        industries.push(industry);
      }
    }

    return industries.length > 0 ? industries : ['general'];
  }

  /**
   * Assess required evidence strength for a claim
   */
  private assessRequiredEvidenceStrength(
    claim: string,
    claimType: 'quantitative' | 'qualitative' | 'comparative'
  ): 'weak' | 'moderate' | 'strong' {
    const lowerClaim = claim.toLowerCase();
    
    // Strong evidence required for specific numbers or strong claims
    if (claimType === 'quantitative' || 
        lowerClaim.includes('significantly') || 
        lowerClaim.includes('dramatically') ||
        lowerClaim.includes('proven') ||
        lowerClaim.includes('guarantee')) {
      return 'strong';
    }
    
    // Moderate evidence for comparative claims
    if (claimType === 'comparative' || 
        lowerClaim.includes('better') || 
        lowerClaim.includes('faster') ||
        lowerClaim.includes('more effective')) {
      return 'moderate';
    }
    
    return 'weak';
  }

  /**
   * Assess claim priority based on content and type
   */
  private assessClaimPriority(
    claim: string,
    claimType: 'quantitative' | 'qualitative' | 'comparative'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const lowerClaim = claim.toLowerCase();
    
    // Critical priority for financial or safety claims
    if (lowerClaim.includes('roi') || 
        lowerClaim.includes('revenue') || 
        lowerClaim.includes('cost') ||
        lowerClaim.includes('safety') ||
        lowerClaim.includes('security')) {
      return 'critical';
    }
    
    // High priority for quantitative claims
    if (claimType === 'quantitative') {
      return 'high';
    }
    
    // Medium priority for comparative claims
    if (claimType === 'comparative') {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Get required source types based on claim characteristics
   */
  private getRequiredSourceTypes(
    claimType: 'quantitative' | 'qualitative' | 'comparative',
    evidenceStrength: 'weak' | 'moderate' | 'strong'
  ): CitationSourceType[] {
    const baseTypes = [CitationSourceType.INDUSTRY_REPORT];
    
    if (evidenceStrength === 'strong') {
      baseTypes.push(
        CitationSourceType.ACADEMIC_PAPER,
        CitationSourceType.CONSULTING_STUDY,
        CitationSourceType.RESEARCH_PUBLICATION
      );
    }
    
    if (claimType === 'quantitative') {
      baseTypes.push(
        CitationSourceType.SURVEY_DATA,
        CitationSourceType.BENCHMARK_STUDY,
        CitationSourceType.GOVERNMENT_DATA
      );
    }
    
    if (claimType === 'comparative') {
      baseTypes.push(
        CitationSourceType.BENCHMARK_STUDY,
        CitationSourceType.CASE_STUDY
      );
    }
    
    return [...new Set(baseTypes)]; // Remove duplicates
  }

  /**
   * Get confidence threshold based on claim characteristics
   */
  private getConfidenceThreshold(
    claimType: 'quantitative' | 'qualitative' | 'comparative',
    evidenceStrength: 'weak' | 'moderate' | 'strong'
  ): number {
    let threshold = 60; // Base threshold
    
    if (evidenceStrength === 'strong') threshold += 20;
    if (evidenceStrength === 'moderate') threshold += 10;
    
    if (claimType === 'quantitative') threshold += 15;
    if (claimType === 'comparative') threshold += 10;
    
    return Math.min(95, threshold); // Cap at 95%
  }

  /**
   * Extract context around a claim
   */
  private extractContext(claim: string, fullContent: string): string {
    const claimIndex = fullContent.indexOf(claim);
    if (claimIndex === -1) return claim;
    
    const start = Math.max(0, claimIndex - 200);
    const end = Math.min(fullContent.length, claimIndex + claim.length + 200);
    
    return fullContent.substring(start, end).trim();
  }

  /**
   * Deduplicate and prioritize citation requirements
   */
  private deduplicateAndPrioritize(requirements: CitationRequirement[]): CitationRequirement[] {
    // Simple deduplication based on similar claims
    const unique = requirements.filter((req, index) => {
      return !requirements.slice(0, index).some(existing => 
        this.calculateSimilarity(req.claim, existing.claim) > 0.8
      );
    });
    
    // Sort by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return unique.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  /**
   * Calculate similarity between two claims (simple implementation)
   */
  private calculateSimilarity(claim1: string, claim2: string): number {
    const words1 = new Set(claim1.toLowerCase().split(/\s+/));
    const words2 = new Set(claim2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Discover relevant sources for citation requirements
   */
  async discoverRelevantSources(requirements: CitationRequirement[]): Promise<SourceCandidate[]> {
    const candidates: SourceCandidate[] = [];
    
    for (const requirement of requirements) {
      const searchCriteria: CitationSearchCriteria = {
        keywords: requirement.suggestedKeywords,
        industry: requirement.industryRelevance[0],
        source_types: requirement.requiredSourceTypes,
        minimum_confidence: this.mapConfidenceThresholdToLevel(requirement.confidenceThreshold),
        date_range: {
          start: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years ago
          end: new Date().toISOString(),
        },
      };
      
      const sources = await this.citationService.findRelevantCitations(searchCriteria);
      
      for (const source of sources) {
        const relevanceScore = await this.scoreSourceRelevance(source, requirement.claim);
        
        if (relevanceScore.overall >= (requirement.confidenceThreshold * 0.6)) { // Lower threshold for discovery
          candidates.push({
            source,
            relevanceScore: relevanceScore.overall,
            confidenceContribution: this.calculateConfidenceContribution(source, requirement),
            evidenceStrength: this.assessSourceEvidenceStrength(source),
            supportedClaims: [requirement.claim],
            matchingKeywords: this.findMatchingKeywords(source, requirement.suggestedKeywords),
            contextAlignment: this.calculateContextAlignment(source, requirement.context),
          });
        }
      }
    }
    
    // Sort by relevance score and remove duplicates
    return this.deduplicateSourceCandidates(candidates)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20); // Return top 20 candidates
  }

  /**
   * Map confidence threshold to citation confidence level
   */
  private mapConfidenceThresholdToLevel(threshold: number): CitationConfidence {
    if (threshold >= 80) return CitationConfidence.HIGH;
    if (threshold >= 60) return CitationConfidence.MEDIUM;
    return CitationConfidence.LOW;
  }

  /**
   * Score source relevance for a specific context
   */
  async scoreSourceRelevance(source: Citation, context: string): Promise<RelevanceScore> {
    const contextWords = new Set(context.toLowerCase().split(/\s+/));
    const sourceWords = new Set([
      ...source.title.toLowerCase().split(/\s+/),
      ...source.key_finding.toLowerCase().split(/\s+/),
      ...(source.industry_focus?.join(' ').toLowerCase().split(/\s+/) || []),
    ]);
    
    // Calculate keyword match score
    const intersection = new Set([...contextWords].filter(word => sourceWords.has(word)));
    const keywordMatch = (intersection.size / Math.max(contextWords.size, 1)) * 100;
    
    // Industry alignment score
    const industryAlignment = this.calculateIndustryAlignment(source, context);
    
    // Claim type match score
    const claimTypeMatch = this.calculateClaimTypeMatch(source, context);
    
    // Recency bonus
    const monthsOld = (Date.now() - new Date(source.published_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
    const recencyBonus = Math.max(0, 20 - monthsOld); // Bonus decreases with age
    
    // Credibility bonus
    const credibilityBonus = source.confidence === CitationConfidence.HIGH ? 15 : 
                           source.confidence === CitationConfidence.MEDIUM ? 10 : 5;
    
    // Methodology match
    const methodologyMatch = source.methodology ? 10 : 0;
    
    const factors = {
      keywordMatch,
      industryAlignment,
      claimTypeMatch,
      recencyBonus,
      credibilityBonus,
      methodologyMatch,
    };
    
    const overall = (
      keywordMatch * 0.3 +
      industryAlignment * 0.2 +
      claimTypeMatch * 0.2 +
      recencyBonus * 0.1 +
      credibilityBonus * 0.1 +
      methodologyMatch * 0.1
    );
    
    return {
      overall: Math.round(overall),
      factors,
      explanation: this.generateRelevanceExplanation(factors, overall),
    };
  }

  /**
   * Calculate industry alignment score
   */
  private calculateIndustryAlignment(source: Citation, context: string): number {
    if (!source.industry_focus) return 50; // Neutral score if no industry info
    
    const contextIndustries = this.identifyIndustries(context);
    const matchingIndustries = source.industry_focus.filter(industry =>
      contextIndustries.some(contextInd => 
        industry.toLowerCase().includes(contextInd.toLowerCase()) ||
        contextInd.toLowerCase().includes(industry.toLowerCase())
      )
    );
    
    return (matchingIndustries.length / Math.max(source.industry_focus.length, 1)) * 100;
  }

  /**
   * Calculate claim type match score
   */
  private calculateClaimTypeMatch(source: Citation, context: string): number {
    const hasQuantitativeData = source.sample_size || source.methodology || 
                               source.key_finding.match(/\d+%|\d+x|\d+\s*(?:million|billion)/);
    const contextHasQuantitative = this.quantitativePatterns.some(pattern => pattern.test(context));
    
    if (hasQuantitativeData && contextHasQuantitative) return 90;
    if (!hasQuantitativeData && !contextHasQuantitative) return 70;
    return 50;
  }

  /**
   * Generate explanation for relevance score
   */
  private generateRelevanceExplanation(factors: any, overall: number): string {
    const explanations = [];
    
    if (factors.keywordMatch > 70) explanations.push('strong keyword alignment');
    if (factors.industryAlignment > 70) explanations.push('excellent industry match');
    if (factors.recencyBonus > 15) explanations.push('recent publication');
    if (factors.credibilityBonus >= 15) explanations.push('high credibility source');
    if (factors.methodologyMatch > 0) explanations.push('clear methodology');
    
    if (explanations.length === 0) {
      return `Moderate relevance (${overall}%) - basic alignment with requirements`;
    }
    
    return `High relevance (${overall}%) - ${explanations.join(', ')}`;
  }

  /**
   * Calculate confidence contribution of a source
   */
  private calculateConfidenceContribution(source: Citation, requirement: CitationRequirement): number {
    let contribution = 50; // Base contribution
    
    // Boost for high confidence sources
    if (source.confidence === CitationConfidence.HIGH) contribution += 30;
    else if (source.confidence === CitationConfidence.MEDIUM) contribution += 15;
    
    // Boost for appropriate source types
    if (requirement.requiredSourceTypes.includes(source.source_type)) {
      contribution += 20;
    }
    
    // Boost for methodology transparency
    if (source.methodology) contribution += 10;
    if (source.sample_size && source.sample_size > 100) contribution += 10;
    
    return Math.min(100, contribution);
  }

  /**
   * Assess evidence strength of a source
   */
  private assessSourceEvidenceStrength(source: Citation): 'weak' | 'moderate' | 'strong' {
    let score = 0;
    
    if (source.confidence === CitationConfidence.HIGH) score += 3;
    else if (source.confidence === CitationConfidence.MEDIUM) score += 2;
    else score += 1;
    
    if (source.methodology) score += 2;
    if (source.sample_size && source.sample_size > 500) score += 2;
    else if (source.sample_size && source.sample_size > 100) score += 1;
    
    const strongTypes = [
      CitationSourceType.ACADEMIC_PAPER,
      CitationSourceType.CONSULTING_STUDY,
      CitationSourceType.RESEARCH_PUBLICATION,
    ];
    if (strongTypes.includes(source.source_type)) score += 2;
    
    if (score >= 7) return 'strong';
    if (score >= 4) return 'moderate';
    return 'weak';
  }

  /**
   * Find matching keywords between source and requirements
   */
  private findMatchingKeywords(source: Citation, keywords: string[]): string[] {
    const sourceText = [
      source.title,
      source.key_finding,
      source.organization || '',
      ...(source.industry_focus || []),
    ].join(' ').toLowerCase();
    
    return keywords.filter(keyword => 
      sourceText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Calculate context alignment score
   */
  private calculateContextAlignment(source: Citation, context: string): number {
    const contextWords = new Set(context.toLowerCase().split(/\s+/));
    const sourceWords = new Set([
      ...source.title.toLowerCase().split(/\s+/),
      ...source.key_finding.toLowerCase().split(/\s+/),
    ]);
    
    const intersection = new Set([...contextWords].filter(word => sourceWords.has(word)));
    return (intersection.size / Math.max(contextWords.size, 1)) * 100;
  }

  /**
   * Remove duplicate source candidates
   */
  private deduplicateSourceCandidates(candidates: SourceCandidate[]): SourceCandidate[] {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      if (seen.has(candidate.source.id)) {
        return false;
      }
      seen.add(candidate.source.id);
      return true;
    });
  }

  /**
   * Identify unsupported claims in content
   */
  async identifyUnsupportedClaims(content: string): Promise<UnsupportedClaim[]> {
    const claims: UnsupportedClaim[] = [];
    const sentences = this.splitIntoSentences(content);
    
    for (const sentence of sentences) {
      const claimType = this.identifyClaimType(sentence);
      if (claimType) {
        // Check if this claim appears to be unsupported
        const hasNearbyReference = this.hasNearbyReference(sentence, content);
        if (!hasNearbyReference) {
          const severity = this.assessClaimSeverity(sentence, claimType);
          const riskLevel = this.calculateRiskLevel(sentence, claimType, severity);
          
          claims.push({
            claim: sentence.trim(),
            claimType,
            severity,
            context: this.extractContext(sentence, content),
            suggestedEvidence: this.suggestEvidenceTypes(sentence, claimType),
            riskLevel,
          });
        }
      }
    }
    
    return claims.sort((a, b) => b.riskLevel - a.riskLevel);
  }

  /**
   * Check if a claim has nearby reference indicators
   */
  private hasNearbyReference(claim: string, content: string): boolean {
    const claimIndex = content.indexOf(claim);
    if (claimIndex === -1) return false;
    
    const contextStart = Math.max(0, claimIndex - 100);
    const contextEnd = Math.min(content.length, claimIndex + claim.length + 100);
    const context = content.substring(contextStart, contextEnd);
    
    const referencePatterns = [
      /\[[\d\w]+\]/i, // [1], [ref1], etc.
      /\([\d\w\s,]+\)/i, // (Smith, 2024)
      /according to/i,
      /source:/i,
      /reference:/i,
      /study by/i,
      /research from/i,
    ];
    
    return referencePatterns.some(pattern => pattern.test(context));
  }

  /**
   * Assess severity of an unsupported claim
   */
  private assessClaimSeverity(
    claim: string,
    claimType: 'quantitative' | 'qualitative' | 'comparative'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const lowerClaim = claim.toLowerCase();
    
    // Critical for financial or legal claims
    if (lowerClaim.includes('guarantee') || 
        lowerClaim.includes('proven') ||
        lowerClaim.includes('roi') ||
        lowerClaim.includes('compliance') ||
        lowerClaim.includes('regulation')) {
      return 'critical';
    }
    
    // High for specific quantitative claims
    if (claimType === 'quantitative' && 
        (lowerClaim.includes('%') || lowerClaim.includes('times') || lowerClaim.includes('increase'))) {
      return 'high';
    }
    
    // Medium for comparative claims
    if (claimType === 'comparative') {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Calculate risk level for unsupported claims
   */
  private calculateRiskLevel(
    claim: string,
    claimType: 'quantitative' | 'qualitative' | 'comparative',
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): number {
    const severityScores = { low: 25, medium: 50, high: 75, critical: 100 };
    const typeScores = { qualitative: 0, comparative: 10, quantitative: 20 };
    
    return severityScores[severity] + typeScores[claimType];
  }

  /**
   * Suggest evidence types for unsupported claims
   */
  private suggestEvidenceTypes(
    claim: string,
    claimType: 'quantitative' | 'qualitative' | 'comparative'
  ): string[] {
    const suggestions = ['Industry report', 'Research study'];
    
    if (claimType === 'quantitative') {
      suggestions.push('Survey data', 'Benchmark study', 'Statistical analysis');
    }
    
    if (claimType === 'comparative') {
      suggestions.push('Competitive analysis', 'Case study', 'Benchmark comparison');
    }
    
    if (claim.toLowerCase().includes('customer') || claim.toLowerCase().includes('user')) {
      suggestions.push('Customer survey', 'User research', 'Feedback analysis');
    }
    
    return suggestions;
  }
}