/**
 * Competitive Analysis Data Models
 * 
 * This module defines TypeScript interfaces for competitive analysis data structures,
 * market sizing models with TAM/SAM/SOM types, and source reference validation models.
 */

import { SteeringFileOptions } from './mcp';

// ============================================================================
// Core Competitive Analysis Interfaces
// ============================================================================

export interface CompetitorAnalysisResult {
  competitiveMatrix: CompetitiveMatrix;
  swotAnalysis: SWOTAnalysis[];
  marketPositioning: MarketPositioning;
  strategicRecommendations: StrategyRecommendation[];
  sourceAttribution: SourceReference[];
  confidenceLevel: 'high' | 'medium' | 'low';
  lastUpdated: string;
  dataQuality: DataQualityCheck;
}

export interface CompetitiveMatrix {
  competitors: Competitor[];
  evaluationCriteria: EvaluationCriterion[];
  rankings: CompetitorRanking[];
  differentiationOpportunities: string[];
  marketContext: MarketContext;
}

export interface Competitor {
  name: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  keyFeatures: string[];
  pricing: PricingInfo;
  targetMarket: string[];
  recentMoves: CompetitiveMove[];
  fundingStatus?: FundingInfo;
  employeeCount?: number;
  foundedYear?: number;
}

export interface EvaluationCriterion {
  name: string;
  weight: number;
  description: string;
  measurementType: 'quantitative' | 'qualitative';
}

export interface CompetitorRanking {
  competitorName: string;
  overallScore: number;
  criteriaScores: { [criterionName: string]: number };
  rank: number;
  competitiveAdvantage: string[];
}

export interface SWOTAnalysis {
  competitorName: string;
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  strategicImplications: string[];
}

export interface SWOTItem {
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  sourceReference?: string;
}

export interface MarketPositioning {
  positioningMap: PositioningAxis[];
  competitorPositions: CompetitorPosition[];
  marketGaps: MarketGap[];
  recommendedPositioning: string[];
}

export interface PositioningAxis {
  name: string;
  lowEnd: string;
  highEnd: string;
  importance: number;
}

export interface CompetitorPosition {
  competitorName: string;
  coordinates: { [axisName: string]: number };
  marketSegment: string;
}

export interface MarketGap {
  description: string;
  size: 'large' | 'medium' | 'small';
  difficulty: 'easy' | 'moderate' | 'hard';
  timeToMarket: string;
  potentialValue: number;
}

export interface StrategyRecommendation {
  type: 'differentiation' | 'cost-leadership' | 'focus' | 'blue-ocean';
  title: string;
  description: string;
  rationale: string[];
  implementation: ImplementationStep[];
  expectedOutcome: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  resourceRequirements: string[];
}

export interface ImplementationStep {
  step: number;
  action: string;
  timeline: string;
  dependencies: string[];
  successMetrics: string[];
}

// ============================================================================
// Market Sizing Models (TAM/SAM/SOM)
// ============================================================================

export interface MarketSizingResult {
  tam: MarketSize;
  sam: MarketSize;
  som: MarketSize;
  methodology: SizingMethodology[];
  scenarios: MarketScenario[];
  confidenceIntervals: ConfidenceInterval[];
  sourceAttribution: SourceReference[];
  assumptions: MarketAssumption[];
  marketDynamics: MarketDynamics;
}

export interface MarketSize {
  value: number;
  currency: string;
  timeframe: string;
  growthRate: number;
  methodology: string;
  dataQuality: 'high' | 'medium' | 'low';
  calculationDate: string;
  geographicScope: string[];
  marketSegments: string[];
}

export interface SizingMethodology {
  type: 'top-down' | 'bottom-up' | 'value-theory';
  description: string;
  dataSource: string;
  reliability: number;
  calculationSteps: CalculationStep[];
  limitations: string[];
  confidence: number;
}

export interface CalculationStep {
  step: number;
  description: string;
  formula: string;
  inputs: { [key: string]: number | string };
  output: number;
  assumptions: string[];
}

export interface MarketScenario {
  name: 'conservative' | 'balanced' | 'aggressive';
  description: string;
  tam: number;
  sam: number;
  som: number;
  probability: number;
  keyAssumptions: string[];
  riskFactors: string[];
}

export interface ConfidenceInterval {
  marketType: 'tam' | 'sam' | 'som';
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
  methodology: string;
}

export interface MarketAssumption {
  category: 'market-growth' | 'penetration-rate' | 'pricing' | 'competition' | 'regulation';
  description: string;
  value: number | string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  sourceReference?: string;
}

export interface MarketDynamics {
  growthDrivers: string[];
  marketBarriers: string[];
  seasonality: SeasonalityPattern[];
  cyclicalFactors: string[];
  disruptiveForces: string[];
}

export interface SeasonalityPattern {
  period: string;
  impact: number;
  description: string;
}

// ============================================================================
// Source Reference and Validation Models
// ============================================================================

export interface SourceReference {
  id: string;
  type: 'mckinsey' | 'gartner' | 'wef' | 'industry-report' | 'market-research' | 'company-filing' | 'news-article';
  title: string;
  author?: string;
  organization: string;
  url?: string;
  publishDate: string;
  accessDate: string;
  reliability: number; // 0-1 scale
  relevance: number; // 0-1 scale
  dataFreshness: FreshnessStatus;
  citationFormat: string;
  keyFindings: string[];
  limitations: string[];
}

export interface FreshnessStatus {
  status: 'fresh' | 'recent' | 'stale' | 'outdated';
  ageInDays: number;
  recommendedUpdateFrequency: number;
  lastValidated: string;
}

export interface DataQualityCheck {
  sourceReliability: number;
  dataFreshness: number;
  methodologyRigor: number;
  overallConfidence: number;
  qualityIndicators: QualityIndicator[];
  recommendations: string[];
}

export interface QualityIndicator {
  metric: string;
  score: number;
  description: string;
  impact: 'critical' | 'important' | 'minor';
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  recommendations: string[];
  dataGaps: string[];
  qualityScore: number;
}

export interface UpdateRecommendation {
  type: 'data-refresh' | 'methodology-update' | 'source-verification' | 'analysis-rerun';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedEffort: string;
  expectedImpact: string;
  dueDate?: string;
}

// ============================================================================
// Supporting Data Structures
// ============================================================================

export interface MarketContext {
  industry: string;
  geography: string[];
  targetSegment: string;
  marketMaturity: 'emerging' | 'growth' | 'mature' | 'declining';
  regulatoryEnvironment: string[];
  technologyTrends: string[];
}

export interface PricingInfo {
  model: 'subscription' | 'one-time' | 'freemium' | 'usage-based' | 'tiered';
  startingPrice: number;
  currency: string;
  billingCycle?: string;
  tiers?: PricingTier[];
  valueProposition: string;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
  targetCustomer: string;
}

export interface CompetitiveMove {
  date: string;
  type: 'product-launch' | 'acquisition' | 'partnership' | 'funding' | 'expansion' | 'pricing-change';
  description: string;
  impact: 'high' | 'medium' | 'low';
  strategicImplication: string;
}

export interface FundingInfo {
  totalRaised: number;
  currency: string;
  lastRoundDate: string;
  lastRoundAmount: number;
  lastRoundType: string;
  investors: string[];
}

// ============================================================================
// MCP Tool Input/Output Interfaces
// ============================================================================

export interface CompetitiveAnalysisArgs {
  feature_idea: string;
  market_context?: {
    industry: string;
    geography: string[];
    target_segment: string;
  };
  analysis_depth?: 'quick' | 'standard' | 'comprehensive';
  steering_options?: SteeringFileOptions;
}

export interface MarketSizingArgs {
  feature_idea: string;
  market_definition: {
    industry: string;
    geography?: string[];
    customer_segments?: string[];
  };
  sizing_methods: readonly ('top-down' | 'bottom-up' | 'value-theory')[];
  steering_options?: SteeringFileOptions;
}

export interface EnhancedBusinessOpportunityArgs {
  feature_idea: string;
  market_context?: {
    industry: string;
    geography: string[];
    target_segment: string;
  };
  include_competitive_analysis?: boolean;
  include_market_sizing?: boolean;
  analysis_depth?: 'quick' | 'standard' | 'comprehensive';
  steering_options?: SteeringFileOptions;
}

// ============================================================================
// Error Handling Interfaces
// ============================================================================

export class CompetitiveAnalysisError extends Error {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_DATA' | 'STALE_DATA' | 'SOURCE_UNAVAILABLE' | 'VALIDATION_FAILED' | 'ANALYSIS_TIMEOUT',
    public suggestions: string[],
    public context?: any
  ) {
    super(message);
    this.name = 'CompetitiveAnalysisError';
  }
}

export class MarketSizingError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_MARKET_DEFINITION' | 'INSUFFICIENT_DATA' | 'CALCULATION_ERROR' | 'METHODOLOGY_UNSUPPORTED',
    public suggestions: string[],
    public context?: any
  ) {
    super(message);
    this.name = 'MarketSizingError';
  }
}

// ============================================================================
// Configuration and Constants
// ============================================================================

export const COMPETITIVE_ANALYSIS_DEFAULTS = {
  DEFAULT_ANALYSIS_DEPTH: 'standard' as const,
  MIN_COMPETITORS: 3,
  MAX_COMPETITORS: 10,
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
  STALE_DATA_THRESHOLD_DAYS: 90,
  OUTDATED_DATA_THRESHOLD_DAYS: 365,
} as const;

export const MARKET_SIZING_DEFAULTS = {
  DEFAULT_SIZING_METHODS: ['top-down', 'bottom-up'] as const,
  MIN_CONFIDENCE_LEVEL: 0.6,
  DEFAULT_TIMEFRAME: '5 years',
  DEFAULT_CURRENCY: 'USD',
  SCENARIO_CONFIDENCE_LEVELS: {
    conservative: 0.8,
    balanced: 0.7,
    aggressive: 0.5,
  },
} as const;

export const SOURCE_RELIABILITY_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
} as const;