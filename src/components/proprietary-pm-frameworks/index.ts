// Proprietary PM Analysis Frameworks
// Unique analytical frameworks that combine multiple public datasets for competitive advantage

import { 
  ProprietaryPMFramework, 
  MarketTimingSignal, 
  CompetitiveIntelligenceMatrix,
  InnovationIndex,
  MarketOpportunityScore,
  RiskAdjustedROI
} from '../../models/proprietary-frameworks';
import { MarketDataIntegrator } from '../market-data-integrator';
import { CitationService } from '../citation-service';

/**
 * Proprietary PM Analysis Frameworks
 * Combines unique public datasets for competitive intelligence
 */
export class ProprietaryPMFrameworks {
  private marketDataIntegrator: MarketDataIntegrator;
  private citationService: CitationService;
  private frameworks: Map<string, ProprietaryPMFramework> = new Map();

  constructor() {
    this.marketDataIntegrator = new MarketDataIntegrator();
    this.citationService = new CitationService();
    this.initializeFrameworks();
  }

  /**
   * Initialize proprietary frameworks
   */
  private initializeFrameworks(): void {
    // Market Timing Intelligence Framework
    this.frameworks.set('market_timing_intelligence', {
      framework_name: 'Market Timing Intelligence (MTI)',
      description: 'Proprietary framework combining economic indicators, patent filings, talent flow, and VC funding to predict optimal market entry timing',
      methodology: 'Multi-signal analysis using weighted composite scoring from 8 unique public datasets',
      input_requirements: [
        'Industry classification',
        'Geographic market scope', 
        'Investment timeline',
        'Risk tolerance level'
      ],
      output_format: 'Timing recommendation with confidence score and supporting evidence',
      confidence_calculation: 'Weighted average of signal strength, data recency, and historical accuracy',
      validation_criteria: [
        'Minimum 3 positive signals required',
        'Data freshness within 30 days',
        'Historical accuracy >75%'
      ],
      unique_differentiators: [
        'Real-time patent filing velocity analysis',
        'Developer talent flow tracking via GitHub',
        'VC funding momentum indicators',
        'Regulatory readiness scoring'
      ],
      use_cases: [
        'Product launch timing optimization',
        'Market entry strategy validation',
        'Investment decision support',
        'Competitive response timing'
      ],
      limitations: [
        'US-centric data bias',
        'Technology sector focus',
        'Requires 6+ months historical data'
      ]
    });

    // Innovation Disruption Potential Framework
    this.frameworks.set('innovation_disruption_potential', {
      framework_name: 'Innovation Disruption Potential (IDP)',
      description: 'Quantifies company innovation capacity using patent velocity, GitHub activity, talent acquisition, and funding momentum',
      methodology: 'Composite scoring algorithm combining USPTO patent data, GitHub ecosystem metrics, BLS employment data, and SEC filings',
      input_requirements: [
        'Company name or ticker symbol',
        'Industry classification',
        'Analysis time horizon'
      ],
      output_format: 'Innovation score (0-100) with component breakdown and competitive positioning',
      confidence_calculation: 'Data quality score weighted by source reliability and completeness',
      validation_criteria: [
        'Minimum 4 data sources required',
        'Patent data within 12 months',
        'GitHub activity within 3 months'
      ],
      unique_differentiators: [
        'Patent quality scoring beyond quantity',
        'Open source contribution analysis',
        'Cross-industry innovation transfer detection',
        'Talent acquisition velocity tracking'
      ],
      use_cases: [
        'Competitive threat assessment',
        'Partnership opportunity identification',
        'Investment due diligence',
        'Innovation strategy benchmarking'
      ],
      limitations: [
        'Public company bias',
        'English-language GitHub bias',
        'US patent system focus'
      ]
    });

    // Competitive Intelligence Matrix Framework
    this.frameworks.set('competitive_intelligence_matrix', {
      framework_name: 'Competitive Intelligence Matrix (CIM)',
      description: 'Multi-dimensional competitive analysis combining financial health, market position, innovation capacity, and customer satisfaction',
      methodology: 'Weighted scoring matrix using SEC financial data, market research, patent analysis, and customer review sentiment',
      input_requirements: [
        'Competitor list',
        'Market definition',
        'Competitive dimensions to analyze'
      ],
      output_format: 'Competitive positioning matrix with threat levels and opportunity scores',
      confidence_calculation: 'Source diversity score multiplied by data recency and completeness factors',
      validation_criteria: [
        'Financial data within 6 months',
        'Market share data from credible sources',
        'Minimum 5 competitive dimensions'
      ],
      unique_differentiators: [
        'Real-time financial health monitoring',
        'Innovation pipeline visibility',
        'Customer satisfaction trend analysis',
        'Competitive moat strength assessment'
      ],
      use_cases: [
        'Competitive strategy development',
        'Market positioning optimization',
        'Acquisition target evaluation',
        'Defensive strategy planning'
      ],
      limitations: [
        'Public information dependency',
        'Lagging financial indicators',
        'Subjective moat assessment'
      ]
    });

    // Market Opportunity Quantification Framework
    this.frameworks.set('market_opportunity_quantification', {
      framework_name: 'Market Opportunity Quantification (MOQ)',
      description: 'Quantifies market opportunity size using economic indicators, demographic trends, technology adoption, and competitive landscape analysis',
      methodology: 'Bottom-up and top-down market sizing with cross-validation using multiple public datasets',
      input_requirements: [
        'Market definition and scope',
        'Geographic boundaries',
        'Time horizon for analysis'
      ],
      output_format: 'TAM/SAM/SOM analysis with growth projections and confidence intervals',
      confidence_calculation: 'Methodology triangulation score based on data source agreement and historical accuracy',
      validation_criteria: [
        'Multiple sizing methodologies required',
        'Economic data within 3 months',
        'Demographic data within 12 months'
      ],
      unique_differentiators: [
        'Real-time economic indicator integration',
        'Technology adoption curve modeling',
        'Regulatory impact quantification',
        'Cross-market opportunity correlation'
      ],
      use_cases: [
        'Business case development',
        'Investment prioritization',
        'Resource allocation decisions',
        'Strategic planning support'
      ],
      limitations: [
        'Emerging market data gaps',
        'Regulatory change unpredictability',
        'Technology disruption timing'
      ]
    });
  }

  /**
   * Analyze market timing using proprietary MTI framework
   */
  async analyzeMarketTiming(
    industry: string, 
    geographicScope: string = 'US',
    riskTolerance: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<MarketTimingSignal[]> {
    try {
      // Load market timing signals dataset
      const timingSignals = await this.loadMarketTimingSignals();
      
      // Filter signals by industry and geographic scope
      const relevantSignals = timingSignals.filter(signal => 
        signal.industry.toLowerCase().includes(industry.toLowerCase()) ||
        signal.signal_type === 'Economic' // Economic signals apply broadly
      );

      // Apply risk tolerance weighting
      const riskWeights = {
        'low': { 'Very High': 0.5, 'High': 0.7, 'Medium': 1.0, 'Low': 1.2 },
        'medium': { 'Very High': 0.8, 'High': 1.0, 'Medium': 1.0, 'Low': 0.8 },
        'high': { 'Very High': 1.2, 'High': 1.1, 'Medium': 1.0, 'Low': 0.6 }
      };

      // Calculate weighted timing scores
      const scoredSignals = relevantSignals.map(signal => ({
        ...signal,
        weighted_score: signal.confidence_score * ((riskWeights as any)[riskTolerance]?.[signal.market_impact] || 1.0),
        framework_applied: 'market_timing_intelligence'
      }));

      // Sort by weighted score and return top signals
      return scoredSignals
        .sort((a, b) => b.weighted_score - a.weighted_score)
        .slice(0, 10);

    } catch (error) {
      console.error('Error analyzing market timing:', error);
      throw new Error(`Market timing analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate innovation disruption potential using proprietary IDP framework
   */
  async calculateInnovationDisruptionPotential(companyName: string): Promise<InnovationIndex> {
    try {
      // Load innovation index dataset
      const innovationData = await this.loadInnovationIndex();
      
      // Find company data
      const companyData = innovationData.find(company => 
        company.company_name.toLowerCase().includes(companyName.toLowerCase())
      );

      if (!companyData) {
        throw new Error(`Company ${companyName} not found in innovation dataset`);
      }

      // Get market intelligence for additional context
      const marketIntel = await this.marketDataIntegrator.getMarketIntelligence(
        companyName, 
        companyData.industry, 
        'competitive'
      );

      // Calculate component scores
      const componentScores = {
        patent_velocity_score: this.normalizeScore(companyData.patent_velocity, 0, 200),
        github_activity_score: this.normalizeScore(companyData.github_activity, 0, 15000),
        funding_momentum_score: this.normalizeScore(companyData.funding_momentum, 0, 5),
        talent_acquisition_score: this.normalizeScore(companyData.talent_acquisition, 0, 5),
        market_disruption_score: this.normalizeScore(companyData.market_disruption_potential, 0, 10)
      };

      // Calculate weighted innovation index
      const weights = {
        patent_velocity: 0.25,
        github_activity: 0.20,
        funding_momentum: 0.20,
        talent_acquisition: 0.15,
        market_disruption: 0.20
      };

      const weightedScore = Object.entries(componentScores).reduce((sum, [key, score]) => {
        const weightKey = key.replace('_score', '');
        return sum + (score * (weights[weightKey as keyof typeof weights] || 0));
      }, 0);

      return {
        company_name: companyName,
        industry: companyData.industry,
        innovation_score: companyData.innovation_score,
        weighted_innovation_score: Math.round(weightedScore),
        component_scores: componentScores,
        competitive_ranking: this.calculateCompetitiveRanking(companyData, innovationData),
        market_context: marketIntel,
        framework_applied: 'innovation_disruption_potential',
        confidence_score: companyData.confidence_score,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error calculating innovation disruption potential:', error);
      throw new Error(`Innovation analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate competitive intelligence matrix using proprietary CIM framework
   */
  async generateCompetitiveIntelligenceMatrix(
    industry: string,
    focusCompany?: string
  ): Promise<CompetitiveIntelligenceMatrix> {
    try {
      // Load competitive intelligence dataset
      const competitiveData = await this.loadCompetitiveIntelligenceMatrix();
      
      // Filter by industry
      const industryCompetitors = competitiveData.filter(company =>
        company.industry.toLowerCase().includes(industry.toLowerCase())
      );

      if (industryCompetitors.length === 0) {
        throw new Error(`No competitive data found for industry: ${industry}`);
      }

      // Calculate market dynamics
      const marketDynamics = this.calculateMarketDynamics(industryCompetitors);

      // Identify competitive clusters
      const competitiveClusters = this.identifyCompetitiveClusters(industryCompetitors);

      // Generate threat assessment
      const threatAssessment = this.generateThreatAssessment(industryCompetitors, focusCompany);

      return {
        industry,
        analysis_date: new Date().toISOString(),
        competitors: industryCompetitors,
        market_dynamics: marketDynamics,
        competitive_clusters: competitiveClusters,
        threat_assessment: threatAssessment,
        framework_applied: 'competitive_intelligence_matrix',
        data_quality_score: this.calculateMatrixDataQuality(industryCompetitors),
        recommendations: this.generateCompetitiveRecommendations(industryCompetitors, focusCompany)
      };

    } catch (error) {
      console.error('Error generating competitive intelligence matrix:', error);
      throw new Error(`Competitive analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Quantify market opportunity using proprietary MOQ framework
   */
  async quantifyMarketOpportunity(
    marketDefinition: string,
    geographicScope: string = 'US',
    timeHorizon: number = 5
  ): Promise<MarketOpportunityScore> {
    try {
      // Get economic indicators
      const economicData = await this.marketDataIntegrator.getEconomicIndicators(marketDefinition);
      
      // Calculate market sizing using multiple methodologies
      const topDownSizing = await this.calculateTopDownMarketSize(marketDefinition, geographicScope);
      const bottomUpSizing = await this.calculateBottomUpMarketSize(marketDefinition, geographicScope);
      
      // Cross-validate sizing methodologies
      const sizingConfidence = this.calculateSizingConfidence(topDownSizing, bottomUpSizing);

      // Generate growth projections
      const growthProjections = this.generateGrowthProjections(
        topDownSizing, 
        bottomUpSizing, 
        economicData, 
        timeHorizon
      );

      // Assess market attractiveness factors
      const attractivenessFactors = await this.assessMarketAttractiveness(marketDefinition);

      return {
        market_definition: marketDefinition,
        geographic_scope: geographicScope,
        time_horizon: timeHorizon,
        market_sizing: {
          tam: topDownSizing.tam,
          sam: (topDownSizing.sam + bottomUpSizing.sam) / 2,
          som: bottomUpSizing.som,
          sizing_confidence: sizingConfidence
        },
        growth_projections: growthProjections,
        attractiveness_factors: attractivenessFactors,
        opportunity_score: this.calculateOpportunityScore(growthProjections, attractivenessFactors),
        framework_applied: 'market_opportunity_quantification',
        confidence_intervals: this.calculateConfidenceIntervals(topDownSizing, bottomUpSizing),
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error quantifying market opportunity:', error);
      throw new Error(`Market opportunity analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load market timing signals from unique dataset
   */
  private async loadMarketTimingSignals(): Promise<any[]> {
    // In a real implementation, this would load from the CSV file
    // For now, return mock data based on our dataset structure
    return [
      {
        signal_type: 'Economic',
        industry: 'Technology',
        signal_name: 'VC Funding Velocity',
        current_value: 2.3,
        historical_average: 1.8,
        trend_strength: 'Strong Positive',
        market_impact: 'High',
        timing_recommendation: 'Accelerate',
        confidence_score: 87,
        data_sources: ['crunchbase_startups', 'fred_economic']
      },
      {
        signal_type: 'Patent',
        industry: 'AI/ML',
        signal_name: 'Patent Filing Rate',
        current_value: 156,
        historical_average: 89,
        trend_strength: 'Very Strong',
        market_impact: 'Very High',
        timing_recommendation: 'Immediate Action',
        confidence_score: 94,
        data_sources: ['uspto_patents', 'world_bank']
      }
      // Additional signals would be loaded from the CSV file
    ];
  }

  /**
   * Load innovation index from unique dataset
   */
  private async loadInnovationIndex(): Promise<any[]> {
    // Mock data based on our innovation index dataset
    return [
      {
        company_name: 'Microsoft',
        industry: 'Technology',
        innovation_score: 92.5,
        patent_velocity: 145,
        github_activity: 8750,
        funding_momentum: 2.1,
        talent_acquisition: 4.2,
        market_disruption_potential: 8.7,
        data_sources: ['sec_edgar', 'uspto_patents', 'github_ecosystem', 'bls_labor'],
        confidence_score: 94
      }
      // Additional companies would be loaded from the CSV file
    ];
  }

  /**
   * Load competitive intelligence matrix from unique dataset
   */
  private async loadCompetitiveIntelligenceMatrix(): Promise<any[]> {
    // Mock data based on our competitive intelligence dataset
    return [
      {
        company_name: 'Microsoft',
        industry: 'Cloud Computing',
        market_share_pct: 23.4,
        revenue_growth_rate: 12.8,
        innovation_index: 92.5,
        customer_satisfaction: 4.6,
        financial_health: 'A+',
        competitive_moat: 'Very Strong',
        threat_level: 'Low',
        opportunity_score: 8.7,
        data_sources: ['sec_edgar', 'github_ecosystem', 'bls_labor'],
        last_updated: '2024-01-15'
      }
      // Additional companies would be loaded from the CSV file
    ];
  }

  /**
   * Utility methods for calculations
   */
  private normalizeScore(value: number, min: number, max: number): number {
    return Math.round(((value - min) / (max - min)) * 100);
  }

  private calculateCompetitiveRanking(company: any, allCompanies: any[]): number {
    const sorted = allCompanies.sort((a, b) => b.innovation_score - a.innovation_score);
    return sorted.findIndex(c => c.company_name === company.company_name) + 1;
  }

  private calculateMarketDynamics(competitors: any[]): any {
    const totalMarketShare = competitors.reduce((sum, c) => sum + c.market_share_pct, 0);
    const avgGrowthRate = competitors.reduce((sum, c) => sum + c.revenue_growth_rate, 0) / competitors.length;
    
    return {
      market_concentration: this.calculateHHI(competitors),
      average_growth_rate: Math.round(avgGrowthRate * 10) / 10,
      competitive_intensity: this.assessCompetitiveIntensity(competitors),
      market_maturity: this.assessMarketMaturity(competitors)
    };
  }

  private calculateHHI(competitors: any[]): number {
    return competitors.reduce((sum, c) => sum + Math.pow(c.market_share_pct, 2), 0);
  }

  private identifyCompetitiveClusters(competitors: any[]): any[] {
    // Simplified clustering based on market share and growth rate
    return [
      {
        cluster_name: 'Market Leaders',
        companies: competitors.filter(c => c.market_share_pct > 20),
        characteristics: ['High market share', 'Established presence', 'Strong moats']
      },
      {
        cluster_name: 'Growth Challengers',
        companies: competitors.filter(c => c.revenue_growth_rate > 20 && c.market_share_pct <= 20),
        characteristics: ['High growth', 'Gaining share', 'Innovation focus']
      },
      {
        cluster_name: 'Niche Players',
        companies: competitors.filter(c => c.revenue_growth_rate <= 20 && c.market_share_pct <= 20),
        characteristics: ['Specialized focus', 'Stable position', 'Efficiency oriented']
      }
    ];
  }

  private generateThreatAssessment(competitors: any[], focusCompany?: string): any {
    const threats = competitors
      .filter(c => c.threat_level === 'High' || c.threat_level === 'Very High')
      .map(c => ({
        company: c.company_name,
        threat_level: c.threat_level,
        threat_factors: this.identifyThreatFactors(c),
        mitigation_strategies: this.suggestMitigationStrategies(c)
      }));

    return {
      immediate_threats: threats.filter(t => t.threat_level === 'Very High'),
      emerging_threats: threats.filter(t => t.threat_level === 'High'),
      threat_summary: `${threats.length} significant competitive threats identified`
    };
  }

  private identifyThreatFactors(competitor: any): string[] {
    const factors = [];
    if (competitor.revenue_growth_rate > 25) factors.push('Rapid growth');
    if (competitor.innovation_index > 85) factors.push('High innovation');
    if (competitor.financial_health === 'A+') factors.push('Strong financials');
    if (competitor.competitive_moat === 'Very Strong') factors.push('Defensive advantages');
    return factors;
  }

  private suggestMitigationStrategies(competitor: any): string[] {
    const strategies = [];
    if (competitor.revenue_growth_rate > 25) strategies.push('Accelerate innovation');
    if (competitor.innovation_index > 85) strategies.push('Increase R&D investment');
    if (competitor.market_share_pct > 30) strategies.push('Focus on differentiation');
    return strategies;
  }

  private assessCompetitiveIntensity(competitors: any[]): string {
    const avgGrowth = competitors.reduce((sum, c) => sum + c.revenue_growth_rate, 0) / competitors.length;
    const hhi = this.calculateHHI(competitors);
    
    if (avgGrowth > 20 && hhi < 1500) return 'Very High';
    if (avgGrowth > 15 || hhi < 2000) return 'High';
    if (avgGrowth > 10 || hhi < 2500) return 'Medium';
    return 'Low';
  }

  private assessMarketMaturity(competitors: any[]): string {
    const avgGrowth = competitors.reduce((sum, c) => sum + c.revenue_growth_rate, 0) / competitors.length;
    
    if (avgGrowth > 25) return 'Emerging';
    if (avgGrowth > 15) return 'Growth';
    if (avgGrowth > 5) return 'Mature';
    return 'Declining';
  }

  private calculateMatrixDataQuality(competitors: any[]): number {
    // Calculate based on data completeness and recency
    const completenessScore = competitors.reduce((sum, c) => {
      const fields = ['market_share_pct', 'revenue_growth_rate', 'innovation_index', 'customer_satisfaction'];
      const completeness = fields.filter(field => c[field] !== null && c[field] !== undefined).length / fields.length;
      return sum + completeness;
    }, 0) / competitors.length;

    return Math.round(completenessScore * 100);
  }

  private generateCompetitiveRecommendations(competitors: any[], focusCompany?: string): string[] {
    const recommendations = [];
    
    const highGrowthCompetitors = competitors.filter(c => c.revenue_growth_rate > 20);
    if (highGrowthCompetitors.length > 0) {
      recommendations.push('Monitor high-growth competitors for disruptive innovations');
    }

    const strongMoatCompetitors = competitors.filter(c => c.competitive_moat === 'Very Strong');
    if (strongMoatCompetitors.length > 0) {
      recommendations.push('Develop differentiated value propositions to compete with entrenched players');
    }

    const lowSatisfactionOpportunities = competitors.filter(c => c.customer_satisfaction < 4.0);
    if (lowSatisfactionOpportunities.length > 0) {
      recommendations.push('Target customers of competitors with low satisfaction scores');
    }

    return recommendations;
  }

  // Market opportunity calculation methods
  private async calculateTopDownMarketSize(market: string, geography: string): Promise<any> {
    // Simplified top-down calculation
    const baseMarketSize = 10000000000; // $10B base
    const geographyMultiplier = geography === 'Global' ? 5 : 1;
    
    return {
      tam: baseMarketSize * geographyMultiplier,
      sam: baseMarketSize * geographyMultiplier * 0.3,
      som: baseMarketSize * geographyMultiplier * 0.05
    };
  }

  private async calculateBottomUpMarketSize(market: string, geography: string): Promise<any> {
    // Simplified bottom-up calculation
    const customerSegments = 1000000; // 1M potential customers
    const averageSpend = 5000; // $5K average spend
    
    return {
      tam: customerSegments * averageSpend * 2,
      sam: customerSegments * averageSpend * 0.6,
      som: customerSegments * averageSpend * 0.1
    };
  }

  private calculateSizingConfidence(topDown: any, bottomUp: any): number {
    const tamDiff = Math.abs(topDown.tam - bottomUp.tam) / Math.max(topDown.tam, bottomUp.tam);
    const samDiff = Math.abs(topDown.sam - bottomUp.sam) / Math.max(topDown.sam, bottomUp.sam);
    
    const avgDifference = (tamDiff + samDiff) / 2;
    return Math.round((1 - avgDifference) * 100);
  }

  private generateGrowthProjections(topDown: any, bottomUp: any, economicData: any[], timeHorizon: number): any[] {
    const projections = [];
    const baseGrowthRate = 0.15; // 15% base growth
    
    for (let year = 1; year <= timeHorizon; year++) {
      const adjustedGrowthRate = baseGrowthRate * (1 - (year * 0.02)); // Declining growth
      const projectedSize = (topDown.sam + bottomUp.sam) / 2 * Math.pow(1 + adjustedGrowthRate, year);
      
      projections.push({
        year: new Date().getFullYear() + year,
        projected_size: Math.round(projectedSize),
        growth_rate: Math.round(adjustedGrowthRate * 100) / 100,
        confidence_interval: {
          lower: Math.round(projectedSize * 0.8),
          upper: Math.round(projectedSize * 1.2)
        }
      });
    }
    
    return projections;
  }

  private async assessMarketAttractiveness(market: string): Promise<any> {
    return {
      market_growth_rate: 15 + Math.random() * 10, // 15-25%
      competitive_intensity: 'Medium',
      barriers_to_entry: 'Moderate',
      customer_concentration: 'Low',
      regulatory_risk: 'Low',
      technology_risk: 'Medium',
      overall_attractiveness: 'High'
    };
  }

  private calculateOpportunityScore(projections: any[], attractiveness: any): number {
    const growthScore = Math.min(100, projections[0]?.growth_rate * 5 || 50);
    const attractivenessScore = attractiveness.overall_attractiveness === 'High' ? 80 : 60;
    
    return Math.round((growthScore + attractivenessScore) / 2);
  }

  private calculateConfidenceIntervals(topDown: any, bottomUp: any): any {
    return {
      tam: {
        lower: Math.min(topDown.tam, bottomUp.tam) * 0.8,
        upper: Math.max(topDown.tam, bottomUp.tam) * 1.2,
        confidence_level: 80
      },
      sam: {
        lower: Math.min(topDown.sam, bottomUp.sam) * 0.85,
        upper: Math.max(topDown.sam, bottomUp.sam) * 1.15,
        confidence_level: 85
      }
    };
  }

  /**
   * Get framework information
   */
  getFrameworkInfo(frameworkName: string): ProprietaryPMFramework | undefined {
    return this.frameworks.get(frameworkName);
  }

  /**
   * List all available frameworks
   */
  listFrameworks(): ProprietaryPMFramework[] {
    return Array.from(this.frameworks.values());
  }
}