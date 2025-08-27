// Consulting technique data structures and interfaces

export interface ConsultingTechnique {
  name: 'MECE' | 'Pyramid' | 'ValueDriverTree' | 'ZeroBased' | 'ImpactEffort' | 'ValueProp' | 'OptionFraming';
  relevanceScore: number;
  applicableScenarios: string[];
}

export interface MECEAnalysis {
  categories: QuotaDriverCategory[];
  totalCoverage: number;
  overlaps: string[];
}

export interface QuotaDriverCategory {
  name: string;
  drivers: string[];
  quotaImpact: number;
  optimizationPotential: number;
}

export interface ValueDriverAnalysis {
  primaryDrivers: ValueDriver[];
  secondaryDrivers: ValueDriver[];
  rootCauses: string[];
}

export interface ValueDriver {
  name: string;
  currentCost: number;
  optimizedCost: number;
  savingsPotential: number;
}

export interface ZeroBasedSolution {
  radicalApproach: string;
  assumptionsChallenged: string[];
  potentialSavings: number;
  implementationRisk: 'low' | 'medium' | 'high';
}

export interface ThreeOptionAnalysis {
  conservative: OptimizationOption;
  balanced: OptimizationOption;
  bold: OptimizationOption;
}

export interface OptimizationOption {
  name: string;
  description: string;
  quotaSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  estimatedROI: number;
}

export interface TechniqueInsight {
  techniqueName: string;
  keyInsight: string;
  supportingData: any;
  actionableRecommendation: string;
}

export interface ConsultingSummary {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: StructuredRecommendation[];
  techniquesApplied: TechniqueInsight[];
  supportingEvidence: Evidence[];
}

export interface StructuredRecommendation {
  mainRecommendation: string;
  supportingReasons: string[];
  evidence: Evidence[];
  expectedOutcome: string;
}

export interface Evidence {
  type: 'quantitative' | 'qualitative';
  description: string;
  source: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface PrioritizedOptimizations {
  highImpactLowEffort: OptimizationOption[];
  highImpactHighEffort: OptimizationOption[];
  lowImpactLowEffort: OptimizationOption[];
  lowImpactHighEffort: OptimizationOption[];
}

export interface ValueProposition {
  userJobs: string[];
  painPoints: string[];
  gainCreators: string[];
  painRelievers: string[];
  valuePropositionStatement: string;
}