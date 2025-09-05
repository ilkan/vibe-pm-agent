// Consulting technique data structures and interfaces

import { 
  MarketSizingResult, 
  CompetitorAnalysisResult, 
  MarketGap as CompetitiveMarketGap,
  StrategyRecommendation as CompetitiveStrategyRecommendation,
  CompetitiveMove
} from './competitive';

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

// ============================================================================
// Enhanced Business Opportunity Models (Task 4.1)
// ============================================================================

export interface EnhancedBusinessOpportunity {
  businessOpportunity: BusinessOpportunity;
  marketSizing?: MarketSizingResult;
  competitiveAnalysis?: CompetitorAnalysisResult;
  strategicFit?: StrategicFitAssessment;
  marketTiming?: MarketTimingAnalysis;
  integratedInsights: IntegratedInsight[];
  overallRecommendation: OverallRecommendation;
}

export interface BusinessOpportunity {
  id: string;
  title: string;
  description: string;
  marketValidation: MarketValidation;
  strategicAlignment: StrategyAlignment;
  financialProjections: FinancialProjection[];
  riskAssessment: RiskAssessment;
  implementationPlan: ImplementationPhase[];
  successMetrics: SuccessMetric[];
  confidenceLevel: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

export interface MarketValidation {
  targetMarket: string[];
  marketNeed: string;
  customerSegments: CustomerSegment[];
  competitiveLandscape: string[];
  marketTrends: string[];
  validationSources: string[];
}

export interface CustomerSegment {
  name: string;
  size: number;
  characteristics: string[];
  painPoints: string[];
  willingness_to_pay: number;
}

export interface StrategyAlignment {
  companyMission: string;
  strategicPriorities: string[];
  okrAlignment: OKRAlignment[];
  competitiveAdvantage: string[];
  alignmentScore: number;
}

export interface OKRAlignment {
  objective: string;
  keyResults: string[];
  alignmentStrength: 'strong' | 'moderate' | 'weak';
}

export interface FinancialProjection {
  timeframe: string;
  revenue: number;
  costs: number;
  profit: number;
  roi: number;
  assumptions: string[];
}

export interface RiskAssessment {
  risks: BusinessRisk[];
  mitigationStrategies: MitigationStrategy[];
  overallRiskLevel: 'low' | 'medium' | 'high';
}

export interface BusinessRisk {
  category: 'market' | 'technical' | 'financial' | 'operational' | 'competitive';
  description: string;
  probability: number;
  impact: number;
  riskScore: number;
}

export interface MitigationStrategy {
  riskCategory: string;
  strategy: string;
  effectiveness: number;
  cost: number;
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  duration: string;
  deliverables: string[];
  resources: string[];
  dependencies: string[];
  milestones: string[];
}

export interface SuccessMetric {
  name: string;
  type: 'leading' | 'lagging';
  target: number;
  unit: string;
  measurementFrequency: string;
  dataSource: string;
}

// ============================================================================
// Strategic Fit Assessment Models (Task 4.2)
// ============================================================================

export interface StrategicFitAssessment {
  alignmentScore: number;
  competitiveAdvantage: string[];
  marketGaps: MarketGapAnalysis[];
  entryBarriers: EntryBarrier[];
  successFactors: SuccessFactor[];
  strategicRecommendations: StrategicRecommendation[];
  fitAnalysis: FitAnalysis;
}

export interface MarketGapAnalysis {
  gapType: 'feature' | 'segment' | 'geography' | 'price-point' | 'use-case';
  description: string;
  size: 'large' | 'medium' | 'small';
  competitorCoverage: number;
  opportunityScore: number;
  addressabilityScore: number;
  timeToMarket: string;
  resourceRequirements: string[];
}

export interface EntryBarrier {
  type: 'regulatory' | 'technical' | 'financial' | 'brand' | 'network-effects' | 'switching-costs';
  description: string;
  height: 'low' | 'medium' | 'high';
  overcomability: number;
  timeToOvercome: string;
  costToOvercome: number;
  strategicImportance: number;
}

export interface SuccessFactor {
  factor: string;
  importance: number;
  currentCapability: number;
  capabilityGap: number;
  developmentPlan: string[];
  timeToAchieve: string;
  investmentRequired: number;
}

export interface StrategicRecommendation {
  type: 'go' | 'no-go' | 'pivot' | 'delay' | 'partner';
  rationale: string[];
  conditions: string[];
  timeline: string;
  resourceRequirements: string[];
  expectedOutcomes: string[];
  riskMitigation: string[];
}

export interface FitAnalysis {
  marketFit: FitScore;
  strategicFit: FitScore;
  capabilityFit: FitScore;
  timingFit: FitScore;
  overallFit: FitScore;
  keyInsights: string[];
}

export interface FitScore {
  score: number;
  confidence: number;
  factors: FitFactor[];
  recommendation: string;
}

export interface FitFactor {
  name: string;
  weight: number;
  score: number;
  rationale: string;
}

// ============================================================================
// Market Timing Analysis Models
// ============================================================================

export interface MarketTimingAnalysis {
  timingScore: number;
  marketReadiness: MarketReadiness;
  competitiveTiming: CompetitiveTiming;
  internalReadiness: InternalReadiness;
  externalFactors: ExternalFactor[];
  timingRecommendation: TimingRecommendation;
}

export interface MarketReadiness {
  customerDemand: number;
  marketMaturity: 'early' | 'growth' | 'mature' | 'decline';
  adoptionCurve: 'innovators' | 'early-adopters' | 'early-majority' | 'late-majority' | 'laggards';
  marketSignals: MarketSignal[];
  readinessScore: number;
}

export interface MarketSignal {
  type: 'demand' | 'technology' | 'regulatory' | 'competitive' | 'economic';
  signal: string;
  strength: 'weak' | 'moderate' | 'strong';
  trend: 'increasing' | 'stable' | 'decreasing';
  impact: number;
}

export interface CompetitiveTiming {
  competitorMoves: CompetitorMove[];
  marketWindowSize: 'narrow' | 'moderate' | 'wide';
  firstMoverAdvantage: number;
  competitiveResponse: CompetitiveResponse[];
  timingAdvantage: number;
}

export interface CompetitorMove {
  competitor: string;
  move: string;
  timing: string;
  impact: number;
  responseRequired: boolean;
}

export interface CompetitiveResponse {
  scenario: string;
  probability: number;
  timeframe: string;
  impact: number;
  counterStrategy: string[];
}

export interface InternalReadiness {
  capabilityReadiness: number;
  resourceAvailability: number;
  organizationalAlignment: number;
  technicalReadiness: number;
  overallReadiness: number;
  readinessGaps: ReadinessGap[];
}

export interface ReadinessGap {
  area: string;
  currentState: string;
  requiredState: string;
  gapSize: number;
  timeToClose: string;
  effort: number;
}

export interface ExternalFactor {
  category: 'economic' | 'regulatory' | 'technological' | 'social' | 'environmental';
  factor: string;
  impact: number;
  probability: number;
  timeframe: string;
  mitigation: string[];
}

export interface TimingRecommendation {
  recommendation: 'launch-now' | 'launch-soon' | 'delay' | 'wait-and-see' | 'abandon';
  rationale: string[];
  optimalTiming: string;
  conditions: string[];
  risks: string[];
  alternatives: string[];
}

// ============================================================================
// Integrated Analysis Models
// ============================================================================

export interface IntegratedInsight {
  type: 'market-competitive' | 'strategic-timing' | 'capability-market' | 'risk-opportunity';
  insight: string;
  supportingData: InsightData[];
  implications: string[];
  actionItems: string[];
  confidence: number;
}

export interface InsightData {
  source: 'market-sizing' | 'competitive-analysis' | 'strategic-fit' | 'timing-analysis';
  dataPoint: string;
  value: number | string;
  context: string;
}

export interface OverallRecommendation {
  decision: 'strong-go' | 'conditional-go' | 'pivot' | 'delay' | 'no-go';
  confidence: number;
  keyReasons: string[];
  conditions: string[];
  nextSteps: NextStep[];
  timeline: string;
  resourceRequirements: ResourceRequirement[];
  successProbability: number;
}

export interface NextStep {
  step: string;
  owner: string;
  timeline: string;
  dependencies: string[];
  deliverables: string[];
  successCriteria: string[];
}

export interface ResourceRequirement {
  type: 'financial' | 'human' | 'technical' | 'operational';
  description: string;
  quantity: number;
  unit: string;
  timeframe: string;
  criticality: 'critical' | 'important' | 'nice-to-have';
}