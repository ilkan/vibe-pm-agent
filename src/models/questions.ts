/**
 * Amazon Working Backwards - Hard questions and risk assessment models
 */

export interface HardQuestion {
  id: number;
  question: string;
  targetAssumptions: string[]; // [A#] references
  category: 'market' | 'financial' | 'competitive' | 'execution' | 'timing';
  severity: 'critical' | 'important' | 'clarifying';
  evidenceNeeded: string[];
}

export interface QuestionContext {
  ledger: import('./assumptions').AssumptionLedger;
  weakestIds: string[]; // Assumptions with lowest certainty
  businessContext: string;
  competitiveContext?: string;
}

export interface EvidenceRecommendation {
  type: 'data_source' | 'research_study' | 'validation_method';
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
}
