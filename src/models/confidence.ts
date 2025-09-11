/**
 * Amazon Working Backwards - Confidence scoring and breakdown models
 */

export interface ConfidenceBreakdown {
  evidence: number; // Quality and quantity of sources (25%)
  recency: number; // How recent the data is (20%)
  diversity: number; // Variety of source types (15%)
  agreement: number; // Consistency across sources (15%)
  coverage: number; // Percentage of claims with sources (15%)
  sensitivity: number; // Impact of assumption changes (10%)
}

export interface ConfidenceScore {
  total: number; // 0-100
  breakdown: ConfidenceBreakdown;
  explanation: string;
  lowConfidence: boolean; // true if total < 60
}

export interface ConfidenceContext {
  citations: Citation[];
  ledgerCoveragePct: number;
  varianceHint?: number;
  sensitivityRisk?: 'low' | 'medium' | 'high';
  assumptionCount: number;
}

export interface Citation {
  url: string;
  title: string;
  date?: string;
  rating?: 'A' | 'B' | 'C';
  snippet?: string;
  sourceType: 'industry_report' | 'financial_data' | 'news' | 'research';
}

export interface Improvement {
  area: keyof ConfidenceBreakdown;
  currentScore: number;
  potentialGain: number;
  recommendation: string;
}
