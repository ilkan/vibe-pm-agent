/**
 * Amazon Working Backwards - Assumption Ledger Service
 * Normalizes business inputs into trackable assumptions with source validation
 */

import { BaseService, Result } from '../_base';
import { 
  AssumptionLedger, 
  Assumption, 
  AssumptionGap, 
  SourceValidation 
} from '../../models/assumptions';
import { performanceCache } from '../../utils/performance-cache';
import { performanceMonitor } from '../../utils/performance-monitor';

export interface Evidence {
  url: string;
  title: string;
  date?: string;
  rating?: 'A' | 'B' | 'C';
  snippet?: string;
  sourceType: 'industry_report' | 'financial_data' | 'news' | 'research';
}

export interface BusinessInputs {
  featureName: string;
  customer: string;
  region?: string;
  competitors?: string[];
  pricing?: number;
  users?: number;
  convRate?: number;
  devCost?: number;
  opsCost?: number;
  marketSize?: number;
  competitiveAdvantage?: string;
  timeline?: string;
  citations?: Evidence[];
  assumptions?: string[];
}

export class AssumptionLedgerService extends BaseService {
  /**
   * Normalize business inputs into trackable assumptions with [A#] format
   */
  async normalizeLedger(inputs: BusinessInputs): Promise<Result<AssumptionLedger>> {
    return this.handleAsync(async () => {
      const inputsHash = performanceCache.hashInputs(inputs);
      
      // Check for duplicate input cache
      const duplicateKey = performanceCache.getDuplicateInputKey(inputsHash);
      const cachedResult = performanceCache.get<AssumptionLedger>(duplicateKey);
      
      if (cachedResult) {
        return cachedResult;
      }

      const { result } = await performanceMonitor.timeOperation(
        'assumption_ledger_service',
        async () => {
          // Extract assumptions from business inputs
          const assumptions = await this.extractAssumptions(inputs);
          
          // Map citations to assumptions based on content relevance
          const assumptionsWithSources = this.mapCitationsToAssumptions(assumptions, inputs.citations || []);
          
          // Validate sources and assign credibility ratings
          const validatedAssumptions = await this.validateSources(assumptionsWithSources);
          
          // Calculate coverage percentage
          const coverage = this.calculateCoverage(validatedAssumptions);
          
          return {
            assumptions: validatedAssumptions,
            coverage_pct: coverage,
            lastUpdated: new Date(),
            totalClaims: validatedAssumptions.length,
            backedClaims: validatedAssumptions.filter(a => a.sourceUrls.length > 0).length
          };
        },
        inputsHash
      );

      // Cache the result for duplicate input detection
      performanceCache.set(duplicateKey, result, 'duplicate_input');
      
      return result;
    }, 'ASSUMPTION_LEDGER_ERROR');
  }

  /**
   * Calculate coverage percentage of claims backed by documented assumptions with weighted scoring
   */
  calculateCoverage(assumptions: Assumption[]): number {
    if (assumptions.length === 0) return 0;
    
    let totalWeight = 0;
    let coveredWeight = 0;
    
    for (const assumption of assumptions) {
      // Assign weights based on impact level
      const weight = this.getAssumptionWeight(assumption.impact);
      totalWeight += weight;
      
      // Check if assumption has valid sources
      if (assumption.sourceUrls.length > 0) {
        // Apply quality multiplier based on certainty
        const qualityMultiplier = this.getCertaintyMultiplier(assumption.certainty);
        coveredWeight += weight * qualityMultiplier;
      }
    }
    
    if (totalWeight === 0) return 0;
    return Math.round((coveredWeight / totalWeight) * 100);
  }

  /**
   * Get weight for assumption based on impact level
   */
  private getAssumptionWeight(impact: Assumption['impact']): number {
    switch (impact) {
      case 'critical': return 3;
      case 'important': return 2;
      case 'supporting': return 1;
      default: return 1;
    }
  }

  /**
   * Get quality multiplier based on certainty level
   */
  private getCertaintyMultiplier(certainty: Assumption['certainty']): number {
    switch (certainty) {
      case 'High': return 1.0;
      case 'Medium': return 0.7;
      case 'Low': return 0.4;
      default: return 0.4;
    }
  }

  /**
   * Validate sources and assign credibility ratings
   */
  async validateSources(assumptions: Assumption[]): Promise<Assumption[]> {
    const validatedAssumptions: Assumption[] = [];
    
    for (const assumption of assumptions) {
      const validatedSources: string[] = [];
      let highestCertainty: 'High' | 'Medium' | 'Low' = 'Low';
      
      // Validate each source URL
      for (const url of assumption.sourceUrls) {
        const validation = await this.validateSingleSource(url);
        
        if (validation.isValid) {
          validatedSources.push(url);
          
          // Update certainty based on credibility rating
          if (validation.credibilityRating === 'A' && highestCertainty !== 'High') {
            highestCertainty = 'High';
          } else if (validation.credibilityRating === 'B' && highestCertainty === 'Low') {
            highestCertainty = 'Medium';
          }
        }
      }
      
      // If no sources, keep original certainty but mark as needing validation
      if (validatedSources.length === 0 && assumption.sourceUrls.length === 0) {
        highestCertainty = 'Medium'; // Default for assumptions without sources
      }
      
      validatedAssumptions.push({
        ...assumption,
        sourceUrls: validatedSources,
        certainty: highestCertainty,
        lastChecked: new Date()
      });
    }
    
    return validatedAssumptions;
  }

  /**
   * Validate a single source URL and assign credibility rating
   */
  private async validateSingleSource(url: string): Promise<SourceValidation> {
    // Check cache first (24-hour cache for source validation)
    const cacheKey = performanceCache.getSourceValidationKey(url);
    const cachedValidation = performanceCache.get<SourceValidation>(cacheKey);
    
    if (cachedValidation) {
      return cachedValidation;
    }

    try {
      // Basic URL validation
      const urlObj = new URL(url);
      
      // Assign credibility rating based on domain
      const credibilityRating = this.assignCredibilityRating(urlObj.hostname);
      
      const validation: SourceValidation = {
        url,
        isValid: true,
        credibilityRating,
        lastChecked: new Date()
      };

      // Cache the validation result
      performanceCache.set(cacheKey, validation, 'source_validation');
      
      return validation;
    } catch (error) {
      const validation: SourceValidation = {
        url,
        isValid: false,
        credibilityRating: 'C',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Invalid URL format'
      };

      // Cache invalid results too (shorter TTL)
      performanceCache.set(cacheKey, validation, 'source_validation');
      
      return validation;
    }
  }

  /**
   * Assign credibility rating based on source domain and type
   */
  private assignCredibilityRating(hostname: string): 'A' | 'B' | 'C' {
    const domain = hostname.toLowerCase();
    
    // A-tier sources (highly credible)
    const aTierDomains = [
      'mckinsey.com', 'bcg.com', 'bain.com', // Top consulting firms
      'gartner.com', 'forrester.com', 'idc.com', // Research firms
      'harvard.edu', 'stanford.edu', 'mit.edu', // Academic institutions
      'sec.gov', 'census.gov', 'bls.gov', // Government sources
      'reuters.com', 'bloomberg.com', 'wsj.com', // Financial news
      'statista.com', 'pwc.com', 'deloitte.com' // Business intelligence
    ];
    
    // B-tier sources (moderately credible)
    const bTierDomains = [
      'techcrunch.com', 'venturebeat.com', 'wired.com',
      'forbes.com', 'businessinsider.com', 'cnbc.com',
      'marketwatch.com', 'yahoo.com', 'google.com',
      'wikipedia.org', 'github.com', 'stackoverflow.com'
    ];
    
    // Check for A-tier
    if (aTierDomains.some(aDomain => domain.includes(aDomain))) {
      return 'A';
    }
    
    // Check for B-tier
    if (bTierDomains.some(bDomain => domain.includes(bDomain))) {
      return 'B';
    }
    
    // Default to C-tier
    return 'C';
  }

  /**
   * Identify gaps in assumption coverage and evidence
   */
  async identifyGaps(ledger: AssumptionLedger): Promise<Result<AssumptionGap[]>> {
    return this.handleAsync(async () => {
      const gaps: AssumptionGap[] = [];
      
      for (const assumption of ledger.assumptions) {
        if (assumption.sourceUrls.length === 0) {
          gaps.push({
            assumptionId: assumption.id,
            gapType: 'missing_source',
            description: `Assumption "${assumption.name}" lacks supporting sources`,
            suggestedAction: 'Add credible sources to support this assumption'
          });
        }
        
        if (assumption.certainty === 'Low') {
          gaps.push({
            assumptionId: assumption.id,
            gapType: 'low_certainty',
            description: `Assumption "${assumption.name}" has low certainty rating`,
            suggestedAction: 'Gather additional evidence to increase certainty'
          });
        }
        
        const daysSinceCheck = Math.floor(
          (Date.now() - assumption.lastChecked.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCheck > 90) {
          gaps.push({
            assumptionId: assumption.id,
            gapType: 'stale_data',
            description: `Assumption "${assumption.name}" hasn't been validated in ${daysSinceCheck} days`,
            suggestedAction: 'Refresh and revalidate this assumption'
          });
        }
      }
      
      return gaps;
    }, 'GAP_IDENTIFICATION_ERROR');
  }

  /**
   * Map citations to assumptions based on content relevance
   */
  private mapCitationsToAssumptions(assumptions: Assumption[], citations: Evidence[]): Assumption[] {
    return assumptions.map(assumption => {
      const relevantCitations = this.findRelevantCitations(assumption, citations);
      return {
        ...assumption,
        sourceUrls: relevantCitations.map(c => c.url)
      };
    });
  }

  /**
   * Find citations relevant to a specific assumption
   */
  private findRelevantCitations(assumption: Assumption, citations: Evidence[]): Evidence[] {
    const relevantCitations: Evidence[] = [];
    
    for (const citation of citations) {
      if (this.isCitationRelevant(assumption, citation)) {
        relevantCitations.push(citation);
      }
    }
    
    return relevantCitations;
  }

  /**
   * Determine if a citation is relevant to an assumption
   */
  private isCitationRelevant(assumption: Assumption, citation: Evidence): boolean {
    const assumptionText = `${assumption.name} ${assumption.value}`.toLowerCase();
    const citationText = `${citation.title} ${citation.snippet || ''}`.toLowerCase();
    
    // Check for keyword matches based on assumption category
    const keywords = this.getKeywordsForAssumption(assumption);
    
    return keywords.some(keyword => 
      citationText.includes(keyword.toLowerCase()) || 
      assumptionText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Get relevant keywords for an assumption based on its category and content
   */
  private getKeywordsForAssumption(assumption: Assumption): string[] {
    const baseKeywords: string[] = [];
    
    // Add category-specific keywords
    switch (assumption.category) {
      case 'market':
        baseKeywords.push('market', 'users', 'customers', 'adoption', 'demand', 'size');
        break;
      case 'financial':
        baseKeywords.push('cost', 'price', 'revenue', 'roi', 'budget', 'investment');
        break;
      case 'technical':
        baseKeywords.push('development', 'technical', 'engineering', 'timeline', 'implementation');
        break;
      case 'competitive':
        baseKeywords.push('competitive', 'competitor', 'advantage', 'differentiation');
        break;
    }
    
    // Add assumption name keywords
    const nameWords = assumption.name.toLowerCase().split(' ');
    baseKeywords.push(...nameWords);
    
    return baseKeywords;
  }

  /**
   * Extract assumptions from business inputs
   */
  private async extractAssumptions(inputs: BusinessInputs): Promise<Assumption[]> {
    const assumptions: Assumption[] = [];
    let idCounter = 1;

    // Extract critical financial assumptions (highest priority)
    if (inputs.pricing !== undefined) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Product Pricing',
        inputs.pricing,
        'USD',
        'financial',
        'critical'
      ));
    }

    if (inputs.devCost !== undefined) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Development Cost',
        inputs.devCost,
        'USD',
        'financial',
        'critical'
      ));
    }

    if (inputs.marketSize !== undefined) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Total Addressable Market',
        inputs.marketSize,
        'USD',
        'market',
        'critical'
      ));
    }

    // Extract important market assumptions
    if (inputs.users !== undefined) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Target User Base',
        inputs.users,
        'users',
        'market',
        'critical'
      ));
    }

    if (inputs.convRate !== undefined) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Conversion Rate',
        inputs.convRate,
        '%',
        'market',
        'important'
      ));
    }

    if (inputs.opsCost !== undefined) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Operational Cost',
        inputs.opsCost,
        'USD',
        'financial',
        'important'
      ));
    }

    // Extract qualitative assumptions
    if (inputs.competitiveAdvantage) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Competitive Advantage',
        inputs.competitiveAdvantage,
        undefined,
        'competitive',
        'important'
      ));
    }

    if (inputs.timeline) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Development Timeline',
        inputs.timeline,
        undefined,
        'technical',
        'important'
      ));
    }

    // Extract regional and competitive context
    if (inputs.region) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Target Region',
        inputs.region,
        undefined,
        'market',
        'supporting'
      ));
    }

    if (inputs.competitors && inputs.competitors.length > 0) {
      assumptions.push(this.createAssumption(
        `A${idCounter++}`,
        'Key Competitors',
        inputs.competitors.join(', '),
        undefined,
        'competitive',
        'supporting'
      ));
    }

    // Add explicit assumptions if provided
    if (inputs.assumptions && inputs.assumptions.length > 0) {
      inputs.assumptions.forEach((assumption, index) => {
        assumptions.push(this.createAssumption(
          `A${idCounter++}`,
          `Business Assumption ${index + 1}`,
          assumption,
          undefined,
          'market',
          'supporting'
        ));
      });
    }

    // Sort assumptions by impact (critical first, then important, then supporting)
    return this.sortAssumptionsByPriority(assumptions);
  }

  /**
   * Sort assumptions by priority (critical > important > supporting) and reassign IDs
   */
  private sortAssumptionsByPriority(assumptions: Assumption[]): Assumption[] {
    const impactOrder = { 'critical': 0, 'important': 1, 'supporting': 2 };
    
    const sorted = assumptions.sort((a, b) => {
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0) return impactDiff;
      
      // If same impact, sort by category (financial > market > competitive > technical)
      const categoryOrder = { 'financial': 0, 'market': 1, 'competitive': 2, 'technical': 3 };
      return categoryOrder[a.category] - categoryOrder[b.category];
    });

    // Reassign sequential IDs after sorting
    return sorted.map((assumption, index) => ({
      ...assumption,
      id: `A${index + 1}`
    }));
  }

  /**
   * Create a standardized assumption object
   */
  private createAssumption(
    id: string,
    name: string,
    value: string | number,
    unit: string | undefined,
    category: Assumption['category'],
    impact: Assumption['impact']
  ): Assumption {
    return {
      id,
      name,
      value,
      unit,
      sourceUrls: [], // Will be populated from citations
      certainty: 'Medium', // Default, will be updated based on evidence
      lastChecked: new Date(),
      category,
      impact
    };
  }
}