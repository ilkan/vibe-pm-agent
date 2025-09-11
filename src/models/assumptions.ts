/**
 * Amazon Working Backwards - Assumption tracking and validation models
 */

export interface Assumption {
  id: string; // A1, A2, A3, etc.
  name: string;
  value: string | number;
  unit?: string;
  sourceUrls: string[];
  certainty: 'High' | 'Medium' | 'Low';
  lastChecked: Date;
  category: 'market' | 'financial' | 'technical' | 'competitive';
  impact: 'critical' | 'important' | 'supporting';
}

export interface AssumptionLedger {
  assumptions: Assumption[];
  coverage_pct: number;
  lastUpdated: Date;
  totalClaims: number;
  backedClaims: number;
}

export interface AssumptionGap {
  assumptionId: string;
  gapType: 'missing_source' | 'low_certainty' | 'stale_data';
  description: string;
  suggestedAction: string;
}

export interface SourceValidation {
  url: string;
  isValid: boolean;
  credibilityRating: 'A' | 'B' | 'C';
  lastChecked: Date;
  error?: string;
}

// Re-export all model types for convenience
export * from './confidence';
export * from './scenarios';
export * from './questions';
