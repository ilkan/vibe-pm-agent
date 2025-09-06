// Proprietary PM Framework Models
// TypeScript interfaces for unique analytical frameworks

/**
 * Base proprietary PM framework interface
 */
export interface ProprietaryPMFramework {
  framework_name: string;
  description: string;
  methodology: string;
  input_requirements: string[];
  output_format: string;
  confidence_calculation: string;
  validation_criteria: string[];
  unique_differentiators: string[];
  use_cases: string[];
  limitations: string[];
}

/**
 * Market timing signal from proprietary analysis
 */
export interface MarketTimingSignal {
  signal_type: 'Economic' | 'Patent' | 'Talent' | 'Regulatory' | 'Market' | 'Technology' | 'Competitive' | 'Customer' | 'Investment' | 'Innovation' | 'Social';
  industry: string;
  signal_name: string;
  current_value: number;
  historical_average: number;
  trend_strength: 'Very Strong' | 'Strong Positive' | 'Moderate Positive' | 'Stable' | 'Moderate Negative' | 'Strong Negative';
  market_impact: 'Very High' | 'High' | 'Medium' | 'Low';
  timing_recommendation: 'Immediate Action' | 'Accelerate' | 'Proceed Steadily' | 'Proceed with Caution' | 'Monitor Closely' | 'Wait and See';
  confidence_score: number;
  data_sources: string[];
  weighted_score?: number;
  framework_applied?: string;
}

/**
 * Innovation index analysis result
 */
export interface InnovationIndex {
  company_name: string;
  industry: string;
  innovation_score: number;
  weighted_innovation_score: number;
  component_scores: {
    patent_velocity_score: number;
    github_activity_score: number;
    funding_momentum_score: number;
    talent_acquisition_score: number;
    market_disruption_score: number;
  };
  competitive_ranking: number;
  market_context: any;
  framework_applied: string;
  confidence_score: number;
  last_updated: string;
}

/**
 * Competitive intelligence matrix analysis
 */
export interface CompetitiveIntelligenceMatrix {
  industry: string;
  analysis_date: string;
  competitors: CompetitorAnalysis[];
  market_dynamics: MarketDynamics;
  competitive_clusters: CompetitiveCluster[];
  threat_assessment: ThreatAssessment;
  framework_applied: string;
  data_quality_score: number;
  recommendations: string[];
}

/**
 * Individual competitor analysis
 */
export interface CompetitorAnalysis {
  company_name: string;
  industry: string;
  market_share_pct: number;
  revenue_growth_rate: number;
  innovation_index: number;
  customer_satisfaction: number;
  financial_health: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-';
  competitive_moat: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak' | 'None';
  threat_level: 'Very High' | 'High' | 'Medium' | 'Low';
  opportunity_score: number;
  data_sources: string[];
  last_updated: string;
}

/**
 * Market dynamics analysis
 */
export interface MarketDynamics {
  market_concentration: number; // HHI index
  average_growth_rate: number;
  competitive_intensity: 'Very High' | 'High' | 'Medium' | 'Low';
  market_maturity: 'Emerging' | 'Growth' | 'Mature' | 'Declining';
}

/**
 * Competitive cluster identification
 */
export interface CompetitiveCluster {
  cluster_name: string;
  companies: CompetitorAnalysis[];
  characteristics: string[];
}

/**
 * Threat assessment results
 */
export interface ThreatAssessment {
  immediate_threats: ThreatProfile[];
  emerging_threats: ThreatProfile[];
  threat_summary: string;
}

/**
 * Individual threat profile
 */
export interface ThreatProfile {
  company: string;
  threat_level: 'Very High' | 'High' | 'Medium' | 'Low';
  threat_factors: string[];
  mitigation_strategies: string[];
}

/**
 * Market opportunity quantification result
 */
export interface MarketOpportunityScore {
  market_definition: string;
  geographic_scope: string;
  time_horizon: number;
  market_sizing: MarketSizing;
  growth_projections: GrowthProjection[];
  attractiveness_factors: MarketAttractiveness;
  opportunity_score: number;
  framework_applied: string;
  confidence_intervals: ConfidenceIntervals;
  last_updated: string;
}

/**
 * Market sizing analysis
 */
export interface MarketSizing {
  tam: number; // Total Addressable Market
  sam: number; // Serviceable Addressable Market
  som: number; // Serviceable Obtainable Market
  sizing_confidence: number;
}

/**
 * Growth projection data
 */
export interface GrowthProjection {
  year: number;
  projected_size: number;
  growth_rate: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

/**
 * Market attractiveness factors
 */
export interface MarketAttractiveness {
  market_growth_rate: number;
  competitive_intensity: 'Very High' | 'High' | 'Medium' | 'Low';
  barriers_to_entry: 'Very High' | 'High' | 'Moderate' | 'Low';
  customer_concentration: 'Very High' | 'High' | 'Medium' | 'Low';
  regulatory_risk: 'Very High' | 'High' | 'Medium' | 'Low';
  technology_risk: 'Very High' | 'High' | 'Medium' | 'Low';
  overall_attractiveness: 'Very High' | 'High' | 'Medium' | 'Low';
}

/**
 * Confidence intervals for market analysis
 */
export interface ConfidenceIntervals {
  tam: ConfidenceInterval;
  sam: ConfidenceInterval;
  [key: string]: ConfidenceInterval;
}

/**
 * Individual confidence interval
 */
export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence_level: number;
}

/**
 * Risk-adjusted ROI analysis
 */
export interface RiskAdjustedROI {
  base_case_roi: number;
  risk_adjusted_roi: number;
  risk_factors: RiskFactor[];
  sensitivity_analysis: SensitivityAnalysis;
  monte_carlo_results?: MonteCarloResults;
  confidence_score: number;
}

/**
 * Risk factor analysis
 */
export interface RiskFactor {
  risk_name: string;
  probability: number; // 0-100%
  impact: number; // -100 to +100%
  mitigation_strategies: string[];
  residual_risk: number;
}

/**
 * Sensitivity analysis results
 */
export interface SensitivityAnalysis {
  key_variables: SensitivityVariable[];
  tornado_chart_data: TornadoChartData[];
  break_even_analysis: BreakEvenPoint[];
}

/**
 * Sensitivity variable
 */
export interface SensitivityVariable {
  variable_name: string;
  base_value: number;
  low_case: number;
  high_case: number;
  roi_impact_low: number;
  roi_impact_high: number;
}

/**
 * Tornado chart data point
 */
export interface TornadoChartData {
  variable: string;
  low_impact: number;
  high_impact: number;
  range: number;
}

/**
 * Break-even analysis point
 */
export interface BreakEvenPoint {
  variable: string;
  break_even_value: number;
  current_value: number;
  margin_of_safety: number;
}

/**
 * Monte Carlo simulation results
 */
export interface MonteCarloResults {
  iterations: number;
  mean_roi: number;
  median_roi: number;
  standard_deviation: number;
  percentiles: {
    p5: number;
    p10: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
  };
  probability_of_positive_roi: number;
  value_at_risk: number; // 5% VaR
}

/**
 * Patent landscape analysis
 */
export interface PatentLandscapeAnalysis {
  technology_area: string;
  analysis_period: string;
  patent_metrics: PatentMetrics;
  innovation_trends: InnovationTrend[];
  competitive_patent_position: CompetitivePatentPosition[];
  white_space_opportunities: WhiteSpaceOpportunity[];
  patent_quality_analysis: PatentQualityAnalysis;
  framework_applied: string;
  confidence_score: number;
}

/**
 * Patent metrics
 */
export interface PatentMetrics {
  total_patents: number;
  patents_by_year: Record<string, number>;
  patent_families: number;
  continuation_rate: number;
  average_claims_per_patent: number;
  international_filing_rate: number;
}

/**
 * Innovation trend analysis
 */
export interface InnovationTrend {
  trend_name: string;
  patent_count: number;
  growth_rate: number;
  key_players: string[];
  technology_maturity: 'Emerging' | 'Growing' | 'Mature' | 'Declining';
  commercial_potential: 'Very High' | 'High' | 'Medium' | 'Low';
}

/**
 * Competitive patent position
 */
export interface CompetitivePatentPosition {
  company_name: string;
  patent_count: number;
  patent_share: number;
  quality_score: number;
  citation_impact: number;
  blocking_potential: number;
  freedom_to_operate_risk: 'High' | 'Medium' | 'Low';
}

/**
 * White space opportunity
 */
export interface WhiteSpaceOpportunity {
  opportunity_area: string;
  patent_gap_size: number;
  commercial_potential: number;
  technical_feasibility: number;
  competitive_advantage_potential: number;
  recommended_action: string;
}

/**
 * Patent quality analysis
 */
export interface PatentQualityAnalysis {
  average_citation_count: number;
  forward_citation_rate: number;
  backward_citation_diversity: number;
  claim_breadth_score: number;
  prosecution_complexity: number;
  maintenance_rate: number;
  overall_quality_score: number;
}

/**
 * Developer ecosystem analysis
 */
export interface DeveloperEcosystemAnalysis {
  ecosystem_name: string;
  analysis_scope: string;
  developer_metrics: DeveloperMetrics;
  technology_adoption: TechnologyAdoption[];
  community_health: CommunityHealth;
  innovation_indicators: InnovationIndicator[];
  competitive_positioning: EcosystemCompetitivePosition;
  framework_applied: string;
  confidence_score: number;
}

/**
 * Developer metrics
 */
export interface DeveloperMetrics {
  active_developers: number;
  developer_growth_rate: number;
  contribution_frequency: number;
  project_diversity: number;
  geographic_distribution: Record<string, number>;
  experience_distribution: Record<string, number>;
}

/**
 * Technology adoption tracking
 */
export interface TechnologyAdoption {
  technology: string;
  adoption_rate: number;
  growth_velocity: number;
  maturity_stage: 'Experimental' | 'Early Adoption' | 'Mainstream' | 'Legacy';
  ecosystem_impact: 'Transformative' | 'Significant' | 'Moderate' | 'Minimal';
}

/**
 * Community health metrics
 */
export interface CommunityHealth {
  engagement_score: number;
  contributor_retention_rate: number;
  issue_resolution_time: number;
  documentation_quality: number;
  mentorship_activity: number;
  diversity_index: number;
}

/**
 * Innovation indicators
 */
export interface InnovationIndicator {
  indicator_name: string;
  current_value: number;
  trend_direction: 'Increasing' | 'Stable' | 'Decreasing';
  innovation_impact: 'High' | 'Medium' | 'Low';
  predictive_value: number;
}

/**
 * Ecosystem competitive position
 */
export interface EcosystemCompetitivePosition {
  market_position: 'Leader' | 'Challenger' | 'Follower' | 'Niche';
  competitive_advantages: string[];
  vulnerability_areas: string[];
  strategic_recommendations: string[];
}

/**
 * Funding pattern analysis
 */
export interface FundingPatternAnalysis {
  market_segment: string;
  analysis_period: string;
  funding_metrics: FundingMetrics;
  investor_behavior: InvestorBehavior;
  valuation_trends: ValuationTrend[];
  exit_patterns: ExitPattern[];
  market_signals: FundingMarketSignal[];
  framework_applied: string;
  confidence_score: number;
}

/**
 * Funding metrics
 */
export interface FundingMetrics {
  total_funding: number;
  deal_count: number;
  average_deal_size: number;
  median_deal_size: number;
  funding_velocity: number;
  stage_distribution: Record<string, number>;
}

/**
 * Investor behavior analysis
 */
export interface InvestorBehavior {
  active_investors: number;
  repeat_investment_rate: number;
  follow_on_rate: number;
  geographic_preferences: Record<string, number>;
  sector_preferences: Record<string, number>;
  risk_appetite: 'Conservative' | 'Moderate' | 'Aggressive';
}

/**
 * Valuation trend
 */
export interface ValuationTrend {
  funding_stage: string;
  median_valuation: number;
  valuation_growth_rate: number;
  revenue_multiple: number;
  market_conditions_impact: number;
}

/**
 * Exit pattern analysis
 */
export interface ExitPattern {
  exit_type: 'IPO' | 'Acquisition' | 'Merger' | 'Buyout';
  exit_count: number;
  median_exit_value: number;
  time_to_exit: number;
  success_rate: number;
}

/**
 * Funding market signal
 */
export interface FundingMarketSignal {
  signal_name: string;
  signal_strength: 'Strong' | 'Moderate' | 'Weak';
  market_implication: string;
  timing_impact: 'Accelerate' | 'Maintain' | 'Delay';
  confidence_level: number;
}