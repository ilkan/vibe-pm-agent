// Citation service for finding and managing references in PM documents

import { 
  Citation, 
  CitationContext, 
  ReferenceCollection, 
  CitationRequirements,
  CitationSearchCriteria,
  CitationValidation,
  FormattedCitation,
  CitationMetrics,
  CitationSourceType,
  CitationConfidence,
  CitationDatabase
} from '../models/citations';

/**
 * Service for managing citations and references in PM documents
 */
export class CitationService {
  private citationDatabase: Citation[] = [];
  private knownDatabases: CitationDatabase[] = [];
  private validationCache: Map<string, CitationValidation> = new Map();

  constructor() {
    this.initializeKnownDatabases();
    this.loadDefaultCitations();
  }

  /**
   * Initialize well-known citation databases
   */
  private initializeKnownDatabases(): void {
    this.knownDatabases = [
      {
        name: 'McKinsey Global Institute',
        base_url: 'https://www.mckinsey.com',
        specialization: ['business_strategy', 'digital_transformation', 'productivity'],
        search_capabilities: ['industry_reports', 'benchmarks', 'case_studies'],
        access_type: 'free'
      },
      {
        name: 'Harvard Business Review',
        base_url: 'https://hbr.org',
        specialization: ['management', 'leadership', 'innovation'],
        search_capabilities: ['peer_reviewed', 'case_studies', 'frameworks'],
        access_type: 'subscription'
      },
      {
        name: 'Gartner Research',
        base_url: 'https://www.gartner.com',
        specialization: ['technology', 'market_research', 'forecasting'],
        search_capabilities: ['magic_quadrants', 'hype_cycles', 'market_sizing'],
        access_type: 'subscription'
      },
      {
        name: 'Forrester Research',
        base_url: 'https://www.forrester.com',
        specialization: ['customer_experience', 'technology_adoption', 'market_trends'],
        search_capabilities: ['wave_reports', 'predictions', 'benchmarks'],
        access_type: 'subscription'
      },
      {
        name: 'Bain & Company Insights',
        base_url: 'https://www.bain.com',
        specialization: ['strategy', 'operations', 'transformation'],
        search_capabilities: ['industry_insights', 'benchmarks', 'case_studies'],
        access_type: 'free'
      },
      {
        name: 'BCG Insights',
        base_url: 'https://www.bcg.com',
        specialization: ['digital', 'sustainability', 'innovation'],
        search_capabilities: ['research_reports', 'surveys', 'frameworks'],
        access_type: 'free'
      },
      {
        name: 'Deloitte Insights',
        base_url: 'https://www2.deloitte.com',
        specialization: ['industry_trends', 'workforce', 'technology'],
        search_capabilities: ['surveys', 'benchmarks', 'predictions'],
        access_type: 'free'
      },
      {
        name: 'PwC Research',
        base_url: 'https://www.pwc.com',
        specialization: ['ceo_survey', 'digital_transformation', 'sustainability'],
        search_capabilities: ['global_surveys', 'industry_analysis', 'benchmarks'],
        access_type: 'free'
      }
    ];
  }

  /**
   * Load default high-quality citations for common PM topics
   */
  private loadDefaultCitations(): void {
    this.citationDatabase = [
      // Product Management Benchmarks
      {
        id: 'pm_benchmarks_2024',
        title: 'Product Management Benchmarks and Insights 2024',
        url: 'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/product-management-benchmarks',
        domain: 'mckinsey.com',
        published_at: '2024-01-22',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding: 'High-performing product teams spend 25% less time on documentation through automation',
        organization: 'McKinsey & Company',
        methodology: 'Survey of 1,200+ product managers across industries',
        sample_size: 1200,
        geographic_scope: 'Global',
        industry_focus: ['technology', 'financial_services', 'healthcare', 'retail']
      },
      
      // SaaS Metrics
      {
        id: 'saas_metrics_2024',
        title: 'SaaS Metrics That Matter: 2024 Industry Benchmarks',
        url: 'https://www.klipfolio.com/resources/articles/saas-metrics-guide',
        domain: 'klipfolio.com',
        published_at: '2024-02-08',
        source_type: CitationSourceType.BENCHMARK_STUDY,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Average SaaS churn rate: 5-7% monthly for SMBs, 1-2% for enterprise',
        organization: 'Klipfolio',
        methodology: 'Analysis of 500+ SaaS companies',
        sample_size: 500,
        geographic_scope: 'North America',
        industry_focus: ['saas', 'software']
      },

      // Customer Success
      {
        id: 'customer_success_benchmarks_2024',
        title: 'Customer Success Metrics and Benchmarks Report 2024',
        url: 'https://www.gainsight.com/customer-success-metrics-benchmarks-2024/',
        domain: 'gainsight.com',
        published_at: '2024-07-10',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Proactive customer success reduces churn by 25-40% compared to reactive approaches',
        organization: 'Gainsight',
        methodology: 'Analysis of customer success data from 800+ companies',
        sample_size: 800,
        geographic_scope: 'Global',
        industry_focus: ['saas', 'technology', 'financial_services']
      },

      // AI in Product Management
      {
        id: 'ai_product_management_2024',
        title: 'The Business Case for AI in Product Management',
        url: 'https://www.gartner.com/en/insights/ai-product-management-2024',
        domain: 'gartner.com',
        published_at: '2024-06-12',
        source_type: CitationSourceType.RESEARCH_PUBLICATION,
        confidence: CitationConfidence.HIGH,
        key_finding: 'AI-assisted document generation reduces PM administrative time by 35-50%',
        organization: 'Gartner Inc.',
        methodology: 'Survey and interviews with 300+ product leaders',
        sample_size: 300,
        geographic_scope: 'Global',
        industry_focus: ['technology', 'software', 'ai']
      },

      // E-commerce Conversion
      {
        id: 'ecommerce_conversion_2024',
        title: 'E-commerce Conversion Rate Optimization: Industry Report 2024',
        url: 'https://baymard.com/lists/cart-abandonment-rate',
        domain: 'baymard.com',
        published_at: '2024-05-20',
        source_type: CitationSourceType.BENCHMARK_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Average e-commerce conversion rate: 2.86% across industries, 69.8% cart abandonment rate',
        organization: 'Baymard Institute',
        methodology: 'Analysis of 50+ large-scale usability studies',
        sample_size: 50,
        geographic_scope: 'Global',
        industry_focus: ['ecommerce', 'retail']
      },

      // Product-Led Growth
      {
        id: 'plg_benchmarks_2024',
        title: 'Product-Led Growth Benchmarks and Insights 2024',
        url: 'https://openviewpartners.com/product-led-growth-benchmarks-2024/',
        domain: 'openviewpartners.com',
        published_at: '2024-04-18',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Top quartile PLG companies achieve 15-20% monthly growth rates',
        organization: 'OpenView Partners',
        methodology: 'Analysis of 200+ PLG companies',
        sample_size: 200,
        geographic_scope: 'North America, Europe',
        industry_focus: ['saas', 'technology', 'software']
      },

      // Digital Transformation ROI
      {
        id: 'digital_transformation_roi_2024',
        title: 'Digital Transformation ROI: What Works and What Doesn\'t',
        url: 'https://www.bcg.com/insights/digital-transformation-roi-2024',
        domain: 'bcg.com',
        published_at: '2024-03-15',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Companies with clear digital strategies achieve 2.5x higher ROI on technology investments',
        organization: 'Boston Consulting Group',
        methodology: 'Survey of 1,500+ executives across industries',
        sample_size: 1500,
        geographic_scope: 'Global',
        industry_focus: ['technology', 'manufacturing', 'financial_services', 'healthcare']
      },

      // Agile Development Productivity
      {
        id: 'agile_productivity_2024',
        title: 'State of Agile Development: Productivity and Performance Metrics 2024',
        url: 'https://www.atlassian.com/agile/project-management/metrics',
        domain: 'atlassian.com',
        published_at: '2024-01-30',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Teams using automated testing and CI/CD show 40% faster delivery times',
        organization: 'Atlassian',
        methodology: 'Analysis of development teams using Atlassian tools',
        sample_size: 1000,
        geographic_scope: 'Global',
        industry_focus: ['software', 'technology']
      }
    ];
  }

  /**
   * Find relevant citations based on search criteria
   */
  async findRelevantCitations(criteria: CitationSearchCriteria): Promise<Citation[]> {
    let relevantCitations = this.citationDatabase.filter(citation => {
      // Filter by keywords
      const keywordMatch = criteria.keywords.some(keyword => 
        citation.title.toLowerCase().includes(keyword.toLowerCase()) ||
        citation.key_finding.toLowerCase().includes(keyword.toLowerCase()) ||
        citation.industry_focus?.some(industry => 
          industry.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (!keywordMatch) return false;

      // Filter by source types
      if (criteria.source_types && !criteria.source_types.includes(citation.source_type)) {
        return false;
      }

      // Filter by confidence level
      if (criteria.minimum_confidence) {
        const confidenceOrder = { low: 0, medium: 1, high: 2 };
        if (confidenceOrder[citation.confidence] < confidenceOrder[criteria.minimum_confidence]) {
          return false;
        }
      }

      // Filter by industry
      if (criteria.industry && citation.industry_focus) {
        const industryMatch = citation.industry_focus.some(industry =>
          industry.toLowerCase().includes(criteria.industry!.toLowerCase())
        );
        if (!industryMatch) return false;
      }

      // Filter by date range
      if (criteria.date_range) {
        const citationDate = new Date(citation.published_at);
        const startDate = new Date(criteria.date_range.start);
        const endDate = new Date(criteria.date_range.end);
        if (citationDate < startDate || citationDate > endDate) {
          return false;
        }
      }

      // Exclude domains
      if (criteria.exclude_domains?.includes(citation.domain)) {
        return false;
      }

      return true;
    });

    // Sort by confidence and recency
    relevantCitations.sort((a, b) => {
      const confidenceOrder = { low: 0, medium: 1, high: 2 };
      const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      if (confidenceDiff !== 0) return confidenceDiff;
      
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return relevantCitations.slice(0, 10); // Return top 10 most relevant
  }

  /**
   * Get citation requirements for specific document types
   */
  getCitationRequirements(documentType: string): CitationRequirements {
    const requirements: Record<string, CitationRequirements> = {
      'business_case': {
        document_type: 'business_case',
        minimum_citations: 5,
        required_source_types: [
          CitationSourceType.CONSULTING_STUDY,
          CitationSourceType.INDUSTRY_REPORT,
          CitationSourceType.BENCHMARK_STUDY
        ],
        minimum_confidence_level: CitationConfidence.MEDIUM,
        industry_specific: true,
        recency_requirement_months: 24
      },
      'market_analysis': {
        document_type: 'market_analysis',
        minimum_citations: 8,
        required_source_types: [
          CitationSourceType.INDUSTRY_REPORT,
          CitationSourceType.SURVEY_DATA,
          CitationSourceType.BENCHMARK_STUDY,
          CitationSourceType.CONSULTING_STUDY
        ],
        minimum_confidence_level: CitationConfidence.HIGH,
        industry_specific: true,
        recency_requirement_months: 18
      },
      'executive_onepager': {
        document_type: 'executive_onepager',
        minimum_citations: 3,
        required_source_types: [
          CitationSourceType.CONSULTING_STUDY,
          CitationSourceType.INDUSTRY_REPORT
        ],
        minimum_confidence_level: CitationConfidence.HIGH,
        industry_specific: false,
        recency_requirement_months: 12
      },
      'pr_faq': {
        document_type: 'pr_faq',
        minimum_citations: 2,
        required_source_types: [
          CitationSourceType.INDUSTRY_REPORT,
          CitationSourceType.BENCHMARK_STUDY
        ],
        minimum_confidence_level: CitationConfidence.MEDIUM,
        industry_specific: false,
        recency_requirement_months: 18
      },
      'competitive_analysis': {
        document_type: 'competitive_analysis',
        minimum_citations: 6,
        required_source_types: [
          CitationSourceType.INDUSTRY_REPORT,
          CitationSourceType.CONSULTING_STUDY,
          CitationSourceType.CASE_STUDY,
          CitationSourceType.BENCHMARK_STUDY
        ],
        minimum_confidence_level: CitationConfidence.HIGH,
        industry_specific: true,
        recency_requirement_months: 12
      }
    };

    return requirements[documentType] || {
      document_type: documentType,
      minimum_citations: 3,
      required_source_types: [CitationSourceType.INDUSTRY_REPORT],
      minimum_confidence_level: CitationConfidence.MEDIUM,
      industry_specific: false,
      recency_requirement_months: 24
    };
  }

  /**
   * Format citations for different output styles
   */
  formatCitation(citation: Citation, style: 'apa' | 'business' | 'inline' = 'business'): FormattedCitation {
    const year = new Date(citation.published_at).getFullYear();
    
    switch (style) {
      case 'apa':
        const authors = citation.authors?.join(', ') || citation.organization || citation.domain;
        return {
          citation_id: citation.id,
          formatted_text: `${authors} (${year}). ${citation.title}. Retrieved from ${citation.url}`,
          in_text_citation: `(${authors}, ${year})`,
          bibliography_entry: `${authors} (${year}). ${citation.title}. Retrieved from ${citation.url}`,
          style: 'apa',
          hyperlink: citation.url
        };
        
      case 'inline':
        return {
          citation_id: citation.id,
          formatted_text: `[${citation.id}]`,
          in_text_citation: `[${citation.id}]`,
          bibliography_entry: `[${citation.id}] ${citation.title} (${year}). ${citation.organization}. ${citation.url}`,
          style: 'inline',
          hyperlink: citation.url
        };
        
      case 'business':
      default:
        return {
          citation_id: citation.id,
          formatted_text: `${citation.title} (${citation.organization}, ${year})`,
          in_text_citation: `[${citation.id}]`,
          bibliography_entry: `[${citation.id}] ${citation.title}. ${citation.organization} (${year}). ${citation.key_finding}. Available: ${citation.url}`,
          style: 'business',
          hyperlink: citation.url
        };
    }
  }

  /**
   * Create a reference collection for a document
   */
  createReferenceCollection(
    documentType: string,
    documentId: string,
    citations: Citation[],
    citationContexts: CitationContext[]
  ): ReferenceCollection {
    const confidenceDistribution = citations.reduce(
      (acc, citation) => {
        acc[citation.confidence]++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );

    return {
      document_type: documentType,
      document_id: documentId,
      citations,
      citation_contexts: citationContexts,
      bibliography_style: 'business',
      last_updated: new Date().toISOString(),
      total_citations: citations.length,
      confidence_distribution: confidenceDistribution
    };
  }

  /**
   * Calculate citation metrics for quality assessment
   */
  calculateCitationMetrics(citations: Citation[]): CitationMetrics {
    const uniqueDomains = new Set(citations.map(c => c.domain)).size;
    const confidenceScores = { high: 3, medium: 2, low: 1 };
    const averageConfidence = citations.reduce((sum, c) => sum + confidenceScores[c.confidence], 0) / citations.length;
    
    // Calculate recency score (0-100)
    const now = new Date();
    const recencyScores = citations.map(c => {
      const monthsOld = (now.getTime() - new Date(c.published_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return Math.max(0, 100 - (monthsOld * 2)); // Lose 2 points per month
    });
    const recencyScore = recencyScores.reduce((sum, score) => sum + score, 0) / recencyScores.length;

    // Calculate source type distribution
    const sourceTypeDistribution = citations.reduce((acc, citation) => {
      acc[citation.source_type] = (acc[citation.source_type] || 0) + 1;
      return acc;
    }, {} as Record<CitationSourceType, number>);

    // Diversity score based on source type variety
    const diversityScore = Math.min(100, (Object.keys(sourceTypeDistribution).length / Object.keys(CitationSourceType).length) * 100);

    // Credibility score based on confidence levels and source types
    const highCredibilityTypes = [
      CitationSourceType.ACADEMIC_PAPER,
      CitationSourceType.CONSULTING_STUDY,
      CitationSourceType.GOVERNMENT_DATA,
      CitationSourceType.RESEARCH_PUBLICATION
    ];
    const credibilityScore = citations.reduce((score, citation) => {
      let points = confidenceScores[citation.confidence] * 10;
      if (highCredibilityTypes.includes(citation.source_type)) {
        points += 20;
      }
      return score + points;
    }, 0) / (citations.length * 50); // Normalize to 0-100

    return {
      total_citations: citations.length,
      unique_domains: uniqueDomains,
      average_confidence: averageConfidence,
      source_type_distribution: sourceTypeDistribution,
      recency_score: Math.round(recencyScore),
      diversity_score: Math.round(diversityScore),
      credibility_score: Math.round(credibilityScore * 100)
    };
  }

  /**
   * Generate bibliography section for documents
   */
  generateBibliography(citations: Citation[], style: 'business' | 'apa' = 'business'): string {
    const formattedCitations = citations.map(citation => 
      this.formatCitation(citation, style)
    );

    const bibliography = formattedCitations
      .map(fc => fc.bibliography_entry)
      .join('\n\n');

    return `## References\n\n${bibliography}`;
  }

  /**
   * Add citation context to track how citations are used
   */
  addCitationContext(
    citationId: string,
    section: string,
    claim: string,
    relevance: 'direct' | 'supporting' | 'comparative' = 'supporting'
  ): CitationContext {
    return {
      citation_id: citationId,
      used_in_section: section,
      specific_claim: claim,
      context_relevance: relevance
    };
  }
}