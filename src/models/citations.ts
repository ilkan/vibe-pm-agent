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
  RESEARCH_PUBLICATION = 'research_publication',
}

/**
 * Citation confidence levels based on source credibility
 */
export enum CitationConfidence {
  HIGH = 'high', // Peer-reviewed, established institutions
  MEDIUM = 'medium', // Industry reports, reputable companies
  LOW = 'low', // Blog posts, unverified sources
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

/**
 * Source accessibility status for validation
 */
export interface AccessibilityStatus {
  isAccessible: boolean;
  accessType: 'free' | 'paywall' | 'subscription' | 'broken';
  lastChecked: Date;
  alternativeAccess: string[];
  cacheAvailable: boolean;
  httpStatus?: number;
  responseTime?: number;
  errorMessage?: string;
}

/**
 * Source credibility assessment
 */
export interface CredibilityAssessment {
  overallScore: number; // 0-100
  factors: {
    domainAuthority: number;
    authorCredentials: number;
    peerReviewStatus: number;
    citationFrequency: number;
    methodologyTransparency: number;
  };
  riskFactors: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  assessmentDate: Date;
}

/**
 * Compliance status for regulatory requirements
 */
export interface ComplianceStatus {
  isCompliant: boolean;
  checkedStandards: string[];
  violations: string[];
  recommendations: string[];
  lastChecked: Date;
}

/**
 * Enhanced citation with validation data
 */
export interface EnhancedCitation extends Citation {
  validationStatus: {
    lastValidated: Date;
    accessibilityStatus: AccessibilityStatus;
    credibilityAssessment: CredibilityAssessment;
    complianceStatus: ComplianceStatus;
  };
  qualityMetrics: {
    credibilityScore: number;
    relevanceScore: number;
    recencyScore: number;
    methodologyScore: number;
    overallQuality: number;
  };
  usageTracking: {
    timesUsed: number;
    documentsReferenced: string[];
    lastUsed: Date;
    effectivenessRating: number;
  };
  alternatives: {
    similarSources: Citation[];
    updatedVersions: Citation[];
    betterAlternatives: Citation[];
  };
}

/**
 * Source quality validation result
 */
export interface SourceQualityValidation {
  isValid: boolean;
  qualityScore: number;
  issues: string[];
  recommendations: string[];
}

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
}

/**
 * Quality gap in citation coverage
 */
export interface QualityGap {
  gapType: 'insufficient_sources' | 'low_credibility' | 'outdated_sources' | 'methodology_unclear';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedClaims: string[];
  recommendedActions: string[];
}

/**
 * Quality assessment report
 */
export interface QualityReport {
  overallScore: number; // 0-100
  metrics: {
    sourceCredibility: number;
    evidenceDiversity: number;
    recencyScore: number;
    methodologyTransparency: number;
    sampleSizeAdequacy: number;
  };
  qualityGaps: QualityGap[];
  recommendations: string[];
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
}

/**
 * Confidence score for a citation or claim
 */
export interface ConfidenceScore {
  overall: number; // 0-100
  breakdown: {
    sourceQuality: number;
    evidenceStrength: number;
    methodologyClarity: number;
    sampleSizeAdequacy: number;
    recencyFactor: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number; // e.g., 95 for 95% confidence
  };
  uncertaintyFactors: string[];
}

/**
 * Validation result for a citation
 */
export interface ValidationResult {
  citationId: string;
  isValid: boolean;
  accessibility: AccessibilityStatus;
  credibility: CredibilityAssessment;
  alternatives: Citation[];
  validatedAt: Date;
  error?: string;
}

/**
 * Evidence package for comprehensive analysis
 */
export interface EvidencePackage {
  topic: string;
  evidenceStrength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  overallConfidence: number;
  primaryEvidence: {
    citations: Citation[];
    keyFindings: string[];
    methodologyNotes: string[];
  };
  supportingEvidence: {
    citations: Citation[];
    contextualSupport: string[];
    comparativeData: string[];
  };
  contradictoryEvidence: {
    citations: Citation[];
    conflictingFindings: string[];
    resolutionNotes: string[];
  };
  qualityAssessment: QualityReport;
  confidenceAnalysis: {
    overallConfidence: number;
    claimConfidences: Map<string, ConfidenceScore>;
    weakestClaims: Array<{claim: string; confidence: number}>;
    strongestClaims: Array<{claim: string; confidence: number}>;
    recommendationReliability: 'high' | 'medium' | 'low';
  };
  recommendations: string[];
}

/**
 * Citation enhancement options
 */
export interface CitationEnhancementOptions {
  userId?: string;
  minimumConfidence?: number;
  requireSourceDiversity?: boolean;
  recencyRequirementMonths?: number;
  industryFocus?: string;
  geographicScope?: string;
}

/**
 * Citation audit report
 */
export interface CitationAuditReport {
  auditId: string;
  auditDate: Date;
  totalCitations: number;
  validCitations: number;
  qualityScore: number;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  issues: string[];
  recommendations: string[];
  detailedResults: {
    validationResults: ValidationResult[];
    qualityReport: QualityReport;
    confidenceScores: Map<string, ConfidenceScore>;
  };
  summary: string;
}
