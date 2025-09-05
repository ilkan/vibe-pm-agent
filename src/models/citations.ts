// Citation and referencing system for vibe-pm-agent tools

/**
 * Citation source types for different kinds of references
 */
export enum CitationSourceType {
  ACADEMIC_PAPER = 'academic_paper',
  INDUSTRY_REPORT = 'industry_report',
  CONSULTING_STUDY = 'consulting_study',
  GOVERNMENT_DATA = 'government_data',
  COMPANY_BLOG = 'company_blog',
  SURVEY_DATA = 'survey_data',
  BENCHMARK_STUDY = 'benchmark_study',
  CASE_STUDY = 'case_study',
  WHITE_PAPER = 'white_paper',
  RESEARCH_PUBLICATION = 'research_publication'
}

/**
 * Citation confidence levels based on source credibility
 */
export enum CitationConfidence {
  HIGH = 'high',      // Peer-reviewed, established institutions
  MEDIUM = 'medium',  // Industry reports, reputable companies
  LOW = 'low'         // Blog posts, unverified sources
}

/**
 * Individual citation entry
 */
export interface Citation {
  id: string;
  title: string;
  url: string;
  domain: string;
  published_at: string;
  source_type: CitationSourceType;
  confidence: CitationConfidence;
  key_finding: string;
  authors?: string[];
  organization?: string;
  methodology?: string;
  sample_size?: number;
  geographic_scope?: string;
  industry_focus?: string[];
  last_accessed?: string;
  doi?: string;
  isbn?: string;
}

/**
 * Citation context for specific use in documents
 */
export interface CitationContext {
  citation_id: string;
  used_in_section: string;
  specific_claim: string;
  page_number?: string;
  quote?: string;
  context_relevance: 'direct' | 'supporting' | 'comparative';
}

/**
 * Reference collection for a specific analysis or document
 */
export interface ReferenceCollection {
  document_type: string;
  document_id: string;
  citations: Citation[];
  citation_contexts: CitationContext[];
  bibliography_style: 'apa' | 'mla' | 'chicago' | 'harvard' | 'business';
  last_updated: string;
  total_citations: number;
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Citation requirements for different PM document types
 */
export interface CitationRequirements {
  document_type: string;
  minimum_citations: number;
  required_source_types: CitationSourceType[];
  minimum_confidence_level: CitationConfidence;
  industry_specific: boolean;
  recency_requirement_months: number;
  geographic_relevance?: string[];
}

/**
 * Citation search criteria for finding relevant references
 */
export interface CitationSearchCriteria {
  keywords: string[];
  industry?: string;
  geographic_scope?: string;
  date_range?: {
    start: string;
    end: string;
  };
  source_types?: CitationSourceType[];
  minimum_confidence?: CitationConfidence;
  exclude_domains?: string[];
  language?: string;
}

/**
 * Citation validation result
 */
export interface CitationValidation {
  citation_id: string;
  is_valid: boolean;
  accessibility_status: 'accessible' | 'paywall' | 'broken' | 'restricted';
  last_checked: string;
  validation_errors?: string[];
  alternative_sources?: Citation[];
}

/**
 * Formatted citation for different output styles
 */
export interface FormattedCitation {
  citation_id: string;
  formatted_text: string;
  in_text_citation: string;
  bibliography_entry: string;
  style: string;
  hyperlink?: string;
}

/**
 * Citation metrics for quality assessment
 */
export interface CitationMetrics {
  total_citations: number;
  unique_domains: number;
  average_confidence: number;
  source_type_distribution: Record<CitationSourceType, number>;
  recency_score: number; // 0-100 based on how recent citations are
  diversity_score: number; // 0-100 based on source diversity
  credibility_score: number; // 0-100 based on source credibility
}

/**
 * Well-known citation databases and their access patterns
 */
export interface CitationDatabase {
  name: string;
  base_url: string;
  api_endpoint?: string;
  access_type: 'free' | 'subscription' | 'institutional';
  specialization: string[];
  search_capabilities: string[];
  rate_limits?: {
    requests_per_minute: number;
    requests_per_day: number;
  };
}

/**
 * Citation enrichment data from external sources
 */
export interface CitationEnrichment {
  citation_id: string;
  altmetric_score?: number;
  citation_count?: number;
  h_index_author?: number;
  journal_impact_factor?: number;
  peer_review_status: boolean;
  open_access: boolean;
  funding_sources?: string[];
  conflicts_of_interest?: string[];
}