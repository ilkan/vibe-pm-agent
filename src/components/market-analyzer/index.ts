/**
 * Market Analyzer Component
 * 
 * Provides TAM/SAM/SOM market sizing analysis with multiple methodologies
 * including top-down, bottom-up, and value-theory calculations.
 */

import {
  MarketSizingResult,
  MarketSize,
  SizingMethodology,
  MarketScenario,
  ConfidenceInterval,
  MarketAssumption,
  MarketDynamics,
  CalculationStep,
  SourceReference,
  MarketSizingArgs,
  MarketSizingError,
  MARKET_SIZING_DEFAULTS,
  DataQualityCheck,
  ValidationResult
} from '../../models/competitive';

export interface MarketAnalyzerConfig {
  defaultTimeframe: string;
  defaultCurrency: string;
  confidenceThreshold: number;
  enableScenarioAnalysis: boolean;
  maxCalculationTime: number;
}

export class MarketAnalyzer {
  private config: MarketAnalyzerConfig;

  constructor(config?: Partial<MarketAnalyzerConfig>) {
    this.config = {
      defaultTimeframe: MARKET_SIZING_DEFAULTS.DEFAULT_TIMEFRAME,
      defaultCurrency: MARKET_SIZING_DEFAULTS.DEFAULT_CURRENCY,
      confidenceThreshold: MARKET_SIZING_DEFAULTS.MIN_CONFIDENCE_LEVEL,
      enableScenarioAnalysis: true,
      maxCalculationTime: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Performs comprehensive market sizing analysis using multiple methodologies
   */
  async analyzeMarketSize(args: MarketSizingArgs): Promise<MarketSizingResult> {
    try {
      const startTime = Date.now();
      
      // Validate input arguments
      this.validateMarketSizingArgs(args);

      // Extract market context
      const marketContext = this.extractMarketContext(args);

      // Determine methodologies to use
      const methodologies = (args.sizing_methods && args.sizing_methods.length > 0) ? 
        [...args.sizing_methods] : 
        [...MARKET_SIZING_DEFAULTS.DEFAULT_SIZING_METHODS];

      // Calculate TAM using specified methodologies
      const tamResults = await this.calculateTAM(args, marketContext);
      
      // Calculate SAM based on TAM and business constraints
      const samResults = await this.calculateSAM(tamResults, args, marketContext);
      
      // Calculate SOM based on SAM and competitive factors
      const somResults = await this.calculateSOM(samResults, args, marketContext);

      // Generate methodologies documentation
      const methodologyDocs = this.generateMethodologies(methodologies, tamResults, samResults, somResults);

      // Generate scenarios if enabled
      const scenarios = this.config.enableScenarioAnalysis 
        ? this.generateScenarios(tamResults, samResults, somResults, marketContext)
        : [];

      // Calculate confidence intervals
      const confidenceIntervals = this.calculateConfidenceIntervals(tamResults, samResults, somResults);

      // Generate market assumptions
      const assumptions = this.generateMarketAssumptions(args, marketContext);

      // Create market dynamics analysis
      const marketDynamics = this.analyzeMarketDynamics(args, marketContext);

      // Generate source attribution
      const sourceAttribution = this.generateSourceAttribution(args, methodologyDocs);

      const result: MarketSizingResult = {
        tam: tamResults,
        sam: samResults,
        som: somResults,
        methodology: methodologyDocs,
        scenarios,
        confidenceIntervals,
        sourceAttribution,
        assumptions,
        marketDynamics
      };

      // Validate calculation time
      const calculationTime = Date.now() - startTime;
      if (calculationTime > this.config.maxCalculationTime) {
        console.warn(`Market sizing calculation took ${calculationTime}ms, exceeding threshold of ${this.config.maxCalculationTime}ms`);
      }

      return result;

    } catch (error) {
      if (error instanceof MarketSizingError) {
        throw error;
      }
      throw new MarketSizingError(
        `Market sizing analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CALCULATION_ERROR',
        ['Check input parameters', 'Verify market definition', 'Try with different methodologies'],
        { originalError: error }
      );
    }
  }

  /**
   * Calculates Total Addressable Market using multiple methodologies
   */
  private async calculateTAM(args: MarketSizingArgs, marketContext: any): Promise<MarketSize> {
    const methodologies = (args.sizing_methods && args.sizing_methods.length > 0) ? 
      [...args.sizing_methods] : 
      [...MARKET_SIZING_DEFAULTS.DEFAULT_SIZING_METHODS];
    const results: MarketSize[] = [];

    for (const methodology of methodologies) {
      let tamValue: number;
      let confidence: number;

      switch (methodology) {
        case 'top-down':
          ({ value: tamValue, confidence } = this.calculateTopDownTAM(args, marketContext));
          break;
        case 'bottom-up':
          ({ value: tamValue, confidence } = this.calculateBottomUpTAM(args, marketContext));
          break;
        case 'value-theory':
          ({ value: tamValue, confidence } = this.calculateValueTheoryTAM(args, marketContext));
          break;
        default:
          throw new MarketSizingError(
            `Unsupported methodology: ${methodology}`,
            'METHODOLOGY_UNSUPPORTED',
            ['Use supported methodologies: top-down, bottom-up, value-theory']
          );
      }

      results.push({
        value: tamValue,
        currency: this.config.defaultCurrency,
        timeframe: this.config.defaultTimeframe,
        growthRate: this.estimateGrowthRate(args, marketContext),
        methodology,
        dataQuality: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
        calculationDate: new Date().toISOString(),
        geographicScope: args.market_definition.geography || ['Global'],
        marketSegments: args.market_definition.customer_segments || ['All segments']
      });
    }

    // Return the result with highest confidence or average if similar confidence
    return this.selectBestTAMResult(results);
  }

  /**
   * Top-down TAM calculation using industry reports and market research
   */
  private calculateTopDownTAM(args: MarketSizingArgs, marketContext: any): { value: number; confidence: number } {
    // Simulate industry-based TAM calculation
    const industryMultipliers: { [key: string]: number } = {
      'technology': 500000000000, // $500B
      'healthcare': 300000000000, // $300B
      'finance': 400000000000,    // $400B
      'retail': 600000000000,     // $600B
      'manufacturing': 350000000000, // $350B
      'default': 200000000000     // $200B
    };

    const baseMarketSize = industryMultipliers[args.market_definition.industry.toLowerCase()] || 
                          industryMultipliers['default'];

    // Apply geographic multiplier
    const geographicMultiplier = this.calculateGeographicMultiplier(args.market_definition.geography || ['Global']);
    
    // Apply segment multiplier
    const segmentMultiplier = this.calculateSegmentMultiplier(args.market_definition.customer_segments || ['All segments']);

    const tamValue = baseMarketSize * geographicMultiplier * segmentMultiplier;
    
    // Confidence based on data availability and market maturity
    const confidence = this.calculateMethodologyConfidence('top-down', args, marketContext);

    return { value: tamValue, confidence };
  }

  /**
   * Bottom-up TAM calculation using customer segments and pricing
   */
  private calculateBottomUpTAM(args: MarketSizingArgs, marketContext: any): { value: number; confidence: number } {
    // Simulate bottom-up calculation based on customer segments
    let totalTAM = 0;
    
    for (const segment of (args.market_definition.customer_segments || ['All segments'])) {
      const segmentSize = this.estimateSegmentSize(segment, args.market_definition.geography || ['Global']);
      const averageSpending = this.estimateAverageSpending(segment, args.market_definition.industry);
      totalTAM += segmentSize * averageSpending;
    }

    const confidence = this.calculateMethodologyConfidence('bottom-up', args, marketContext);

    return { value: totalTAM, confidence };
  }

  /**
   * Value-theory TAM calculation based on value creation potential
   */
  private calculateValueTheoryTAM(args: MarketSizingArgs, marketContext: any): { value: number; confidence: number } {
    // Simulate value-theory calculation
    const problemValueMultipliers: { [key: string]: number } = {
      'efficiency': 1.5,
      'cost-reduction': 2.0,
      'revenue-generation': 2.5,
      'risk-mitigation': 1.2,
      'compliance': 1.0,
      'default': 1.3
    };

    // Extract value proposition from feature idea
    const valueType = this.extractValueType(args.feature_idea);
    const valueMultiplier = problemValueMultipliers[valueType] || problemValueMultipliers['default'];

    // Base calculation on potential value creation
    const baseValue = this.estimateBaseValue(args.feature_idea, args.market_definition);
    const tamValue = baseValue * valueMultiplier;

    const confidence = this.calculateMethodologyConfidence('value-theory', args, marketContext);

    return { value: tamValue, confidence };
  }

  /**
   * Calculates Serviceable Addressable Market based on business constraints
   */
  private async calculateSAM(tam: MarketSize, args: MarketSizingArgs, marketContext: any): Promise<MarketSize> {
    // SAM is typically 10-30% of TAM based on business model and constraints
    const businessConstraints = this.analyzeBusinessConstraints(args, marketContext);
    const samPercentage = this.calculateSAMPercentage(businessConstraints);
    
    const samValue = tam.value * samPercentage;

    return {
      ...tam,
      value: samValue,
      methodology: `SAM derived from ${tam.methodology} (${(samPercentage * 100).toFixed(1)}% of TAM)`,
      dataQuality: tam.dataQuality
    };
  }

  /**
   * Calculates Serviceable Obtainable Market based on competitive factors
   */
  private async calculateSOM(sam: MarketSize, args: MarketSizingArgs, marketContext: any): Promise<MarketSize> {
    // SOM is typically 1-10% of SAM based on competitive positioning and execution
    const competitiveFactors = this.analyzeCompetitiveFactors(args, marketContext);
    const somPercentage = this.calculateSOMPercentage(competitiveFactors);
    
    const somValue = sam.value * somPercentage;

    return {
      ...sam,
      value: somValue,
      methodology: `SOM derived from ${sam.methodology} (${(somPercentage * 100).toFixed(1)}% of SAM)`,
      dataQuality: sam.dataQuality
    };
  }

  // Helper methods for calculations

  private calculateGeographicMultiplier(geography: string[]): number {
    const regionMultipliers: { [key: string]: number } = {
      'global': 1.0,
      'north america': 0.35,
      'europe': 0.25,
      'asia pacific': 0.30,
      'latin america': 0.08,
      'middle east': 0.05,
      'africa': 0.03
    };

    if (geography.includes('global')) return 1.0;
    
    return geography.reduce((total, region) => {
      return total + (regionMultipliers[region.toLowerCase()] || 0.1);
    }, 0);
  }

  private calculateSegmentMultiplier(segments: string[]): number {
    // Segment multiplier based on breadth of target segments
    const baseMultiplier = 0.1; // 10% base for specific segment
    const additionalSegmentBonus = 0.05; // 5% for each additional segment
    
    return Math.min(1.0, baseMultiplier + (segments.length - 1) * additionalSegmentBonus);
  }

  private estimateSegmentSize(segment: string, geography: string[]): number {
    // Simplified segment size estimation
    const segmentSizes: { [key: string]: number } = {
      'enterprise': 50000,
      'mid-market': 200000,
      'small business': 1000000,
      'consumer': 100000000,
      'government': 10000,
      'default': 100000
    };

    const baseSize = segmentSizes[segment.toLowerCase()] || segmentSizes['default'];
    const geoMultiplier = this.calculateGeographicMultiplier(geography);
    
    return baseSize * geoMultiplier;
  }

  private estimateAverageSpending(segment: string, industry: string): number {
    // Simplified spending estimation per customer
    const spendingBySegment: { [key: string]: number } = {
      'enterprise': 100000,
      'mid-market': 25000,
      'small business': 5000,
      'consumer': 100,
      'government': 150000,
      'default': 10000
    };

    const industryMultipliers: { [key: string]: number } = {
      'technology': 1.5,
      'healthcare': 1.3,
      'finance': 2.0,
      'retail': 0.8,
      'manufacturing': 1.2,
      'default': 1.0
    };

    const baseSpending = spendingBySegment[segment.toLowerCase()] || spendingBySegment['default'];
    const industryMultiplier = industryMultipliers[industry.toLowerCase()] || industryMultipliers['default'];
    
    return baseSpending * industryMultiplier;
  }

  private extractValueType(featureIdea: string): string {
    const valueKeywords: { [key: string]: string[] } = {
      'efficiency': ['automate', 'streamline', 'optimize', 'faster', 'efficient'],
      'cost-reduction': ['reduce cost', 'save money', 'cheaper', 'cost-effective'],
      'revenue-generation': ['increase revenue', 'monetize', 'sales', 'profit'],
      'risk-mitigation': ['secure', 'compliance', 'risk', 'safety'],
      'compliance': ['regulatory', 'audit', 'compliance', 'standards']
    };

    const lowerIdea = featureIdea.toLowerCase();
    
    for (const [valueType, keywords] of Object.entries(valueKeywords)) {
      if (keywords.some(keyword => lowerIdea.includes(keyword))) {
        return valueType;
      }
    }
    
    return 'default';
  }

  private estimateBaseValue(featureIdea: string, marketDefinition: any): number {
    // Simplified base value estimation
    const industryBaseValues: { [key: string]: number } = {
      'technology': 10000000000,
      'healthcare': 15000000000,
      'finance': 20000000000,
      'retail': 8000000000,
      'manufacturing': 12000000000,
      'default': 5000000000
    };

    return industryBaseValues[marketDefinition.industry.toLowerCase()] || 
           industryBaseValues['default'];
  }

  private estimateGrowthRate(args: MarketSizingArgs, marketContext: any): number {
    // Industry-based growth rate estimation
    const industryGrowthRates: { [key: string]: number } = {
      'technology': 0.15,
      'healthcare': 0.08,
      'finance': 0.06,
      'retail': 0.04,
      'manufacturing': 0.05,
      'default': 0.07
    };

    return industryGrowthRates[args.market_definition.industry.toLowerCase()] || 
           industryGrowthRates['default'];
  }

  private calculateMethodologyConfidence(methodology: string, args: MarketSizingArgs, marketContext: any): number {
    // Base confidence by methodology
    const baseConfidence: { [key: string]: number } = {
      'top-down': 0.7,
      'bottom-up': 0.8,
      'value-theory': 0.6
    };

    let confidence = baseConfidence[methodology] || 0.6;

    // Adjust based on data availability
    if ((args.market_definition.geography || []).includes('global')) confidence += 0.1;
    if ((args.market_definition.customer_segments || []).length > 2) confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }

  private selectBestTAMResult(results: MarketSize[]): MarketSize {
    if (results.length === 1) return results[0];
    
    // Select result with highest data quality, or average if similar
    const highQualityResults = results.filter(r => r.dataQuality === 'high');
    if (highQualityResults.length > 0) {
      return highQualityResults[0];
    }

    // Return average of medium quality results
    const mediumQualityResults = results.filter(r => r.dataQuality === 'medium');
    if (mediumQualityResults.length > 0) {
      const avgValue = mediumQualityResults.reduce((sum, r) => sum + r.value, 0) / mediumQualityResults.length;
      return {
        ...mediumQualityResults[0],
        value: avgValue,
        methodology: `Average of ${mediumQualityResults.map(r => r.methodology).join(', ')}`
      };
    }

    // Fallback to first result
    return results[0];
  }

  private analyzeBusinessConstraints(args: MarketSizingArgs, marketContext: any): any {
    return {
      geographicReach: (args.market_definition.geography || []).length,
      segmentFocus: (args.market_definition.customer_segments || []).length,
      industrySpecialization: 1,
      resourceConstraints: 0.7
    };
  }

  private calculateSAMPercentage(constraints: any): number {
    // SAM percentage based on business constraints
    let percentage = 0.2; // Base 20%
    
    if (constraints.geographicReach > 3) percentage += 0.05;
    if (constraints.segmentFocus > 2) percentage += 0.03;
    
    return Math.min(0.4, percentage); // Cap at 40%
  }

  private analyzeCompetitiveFactors(args: MarketSizingArgs, marketContext: any): any {
    return {
      competitionLevel: 0.7,
      marketMaturity: 0.6,
      executionCapability: 0.8,
      timeToMarket: 0.7
    };
  }

  private calculateSOMPercentage(factors: any): number {
    // SOM percentage based on competitive factors
    let percentage = 0.05; // Base 5%
    
    if (factors.executionCapability > 0.8) percentage += 0.02;
    if (factors.competitionLevel < 0.5) percentage += 0.03;
    
    return Math.min(0.15, percentage); // Cap at 15%
  }

  private generateMethodologies(methods: readonly string[], tam: MarketSize, sam: MarketSize, som: MarketSize): SizingMethodology[] {
    return methods.map(method => ({
      type: method as 'top-down' | 'bottom-up' | 'value-theory',
      description: this.getMethodologyDescription(method),
      dataSource: this.getMethodologyDataSource(method),
      reliability: this.getMethodologyReliability(method),
      calculationSteps: this.getCalculationSteps(method),
      limitations: this.getMethodologyLimitations(method),
      confidence: this.getMethodologyConfidence(method)
    }));
  }

  private getMethodologyDescription(method: string): string {
    const descriptions: { [key: string]: string } = {
      'top-down': 'Industry-wide market analysis using published research and reports',
      'bottom-up': 'Customer segment analysis with pricing and adoption modeling',
      'value-theory': 'Value-based sizing using problem quantification and solution impact'
    };
    return descriptions[method] || 'Unknown methodology';
  }

  private getMethodologyDataSource(method: string): string {
    const sources: { [key: string]: string } = {
      'top-down': 'Industry reports, market research, analyst publications',
      'bottom-up': 'Customer surveys, segment analysis, pricing studies',
      'value-theory': 'Value assessment, ROI analysis, problem quantification'
    };
    return sources[method] || 'Internal analysis';
  }

  private getMethodologyReliability(method: string): number {
    const reliability: { [key: string]: number } = {
      'top-down': 0.7,
      'bottom-up': 0.8,
      'value-theory': 0.6
    };
    return reliability[method] || 0.6;
  }

  private getCalculationSteps(method: string): CalculationStep[] {
    // Simplified calculation steps for each methodology
    const steps: { [key: string]: CalculationStep[] } = {
      'top-down': [
        {
          step: 1,
          description: 'Identify total industry market size',
          formula: 'Industry Size × Geographic Scope',
          inputs: { industrySize: 'Market research data', geographicScope: 'Target regions' },
          output: 0,
          assumptions: ['Industry growth continues', 'Geographic data is accurate']
        }
      ],
      'bottom-up': [
        {
          step: 1,
          description: 'Calculate segment sizes and spending',
          formula: 'Σ(Segment Size × Average Spending)',
          inputs: { segmentSize: 'Customer counts', averageSpending: 'Pricing analysis' },
          output: 0,
          assumptions: ['Segment data is representative', 'Spending patterns remain stable']
        }
      ],
      'value-theory': [
        {
          step: 1,
          description: 'Quantify value creation potential',
          formula: 'Problem Value × Solution Impact × Market Reach',
          inputs: { problemValue: 'Value assessment', solutionImpact: 'Impact analysis' },
          output: 0,
          assumptions: ['Value can be captured', 'Market will adopt solution']
        }
      ]
    };
    return steps[method] || [];
  }

  private getMethodologyLimitations(method: string): string[] {
    const limitations: { [key: string]: string[] } = {
      'top-down': ['Relies on industry averages', 'May not reflect specific market dynamics'],
      'bottom-up': ['Requires detailed customer data', 'May miss market expansion opportunities'],
      'value-theory': ['Subjective value assessment', 'Difficult to validate assumptions']
    };
    return limitations[method] || ['Limited data availability'];
  }

  private getMethodologyConfidence(method: string): number {
    const confidence: { [key: string]: number } = {
      'top-down': 0.7,
      'bottom-up': 0.8,
      'value-theory': 0.6
    };
    return confidence[method] || 0.6;
  }

  private generateScenarios(tam: MarketSize, sam: MarketSize, som: MarketSize, marketContext: any): MarketScenario[] {
    return [
      {
        name: 'conservative',
        description: 'Conservative growth assumptions with higher competition',
        tam: tam.value * 0.7,
        sam: sam.value * 0.6,
        som: som.value * 0.5,
        probability: 0.3,
        keyAssumptions: ['Slower market adoption', 'Increased competition', 'Economic headwinds'],
        riskFactors: ['Market saturation', 'Regulatory changes', 'Economic downturn']
      },
      {
        name: 'balanced',
        description: 'Balanced scenario with expected market conditions',
        tam: tam.value,
        sam: sam.value,
        som: som.value,
        probability: 0.5,
        keyAssumptions: ['Normal market growth', 'Expected competition', 'Stable conditions'],
        riskFactors: ['Market volatility', 'Competitive pressure', 'Technology changes']
      },
      {
        name: 'aggressive',
        description: 'Optimistic scenario with accelerated growth',
        tam: tam.value * 1.5,
        sam: sam.value * 1.4,
        som: som.value * 1.8,
        probability: 0.2,
        keyAssumptions: ['Rapid market expansion', 'First-mover advantage', 'Strong execution'],
        riskFactors: ['Execution challenges', 'Market overestimation', 'Resource constraints']
      }
    ];
  }

  private calculateConfidenceIntervals(tam: MarketSize, sam: MarketSize, som: MarketSize): ConfidenceInterval[] {
    return [
      {
        marketType: 'tam',
        lowerBound: tam.value * 0.7,
        upperBound: tam.value * 1.3,
        confidenceLevel: 0.8,
        methodology: tam.methodology
      },
      {
        marketType: 'sam',
        lowerBound: sam.value * 0.6,
        upperBound: sam.value * 1.4,
        confidenceLevel: 0.7,
        methodology: sam.methodology
      },
      {
        marketType: 'som',
        lowerBound: som.value * 0.5,
        upperBound: som.value * 2.0,
        confidenceLevel: 0.6,
        methodology: som.methodology
      }
    ];
  }

  private generateMarketAssumptions(args: MarketSizingArgs, marketContext: any): MarketAssumption[] {
    return [
      {
        category: 'market-growth',
        description: 'Annual market growth rate',
        value: '7-15%',
        confidence: 0.7,
        impact: 'high',
        sourceReference: 'Industry analysis'
      },
      {
        category: 'penetration-rate',
        description: 'Market penetration achievable',
        value: '5-15%',
        confidence: 0.6,
        impact: 'high',
        sourceReference: 'Competitive analysis'
      },
      {
        category: 'pricing',
        description: 'Average customer spending',
        value: 'Varies by segment',
        confidence: 0.8,
        impact: 'medium',
        sourceReference: 'Pricing research'
      }
    ];
  }

  private analyzeMarketDynamics(args: MarketSizingArgs, marketContext: any): MarketDynamics {
    return {
      growthDrivers: [
        'Digital transformation trends',
        'Increasing market demand',
        'Technology advancement',
        'Regulatory support'
      ],
      marketBarriers: [
        'High competition',
        'Customer acquisition costs',
        'Technology complexity',
        'Regulatory compliance'
      ],
      seasonality: [
        {
          period: 'Q4',
          impact: 1.2,
          description: 'Higher spending in Q4'
        }
      ],
      cyclicalFactors: [
        'Economic cycles',
        'Technology adoption cycles',
        'Budget cycles'
      ],
      disruptiveForces: [
        'AI and automation',
        'New business models',
        'Regulatory changes',
        'Market consolidation'
      ]
    };
  }

  private generateSourceAttribution(args: MarketSizingArgs, methodologies: SizingMethodology[]): SourceReference[] {
    return [
      {
        id: 'market-research-001',
        type: 'market-research',
        title: `${args.market_definition.industry} Market Analysis 2024`,
        organization: 'Industry Research Institute',
        publishDate: '2024-01-15',
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.8,
        relevance: 0.9,
        dataFreshness: {
          status: 'recent',
          ageInDays: 30,
          recommendedUpdateFrequency: 90,
          lastValidated: new Date().toISOString()
        },
        citationFormat: 'Industry Research Institute. (2024). Market Analysis Report.',
        keyFindings: ['Market size estimates', 'Growth projections', 'Competitive landscape'],
        limitations: ['Limited geographic coverage', 'Methodology assumptions']
      }
    ];
  }

  private validateMarketSizingArgs(args: MarketSizingArgs): void {
    if (!args.feature_idea || args.feature_idea.trim().length < 10) {
      throw new MarketSizingError(
        'Feature idea must be at least 10 characters long',
        'INVALID_MARKET_DEFINITION',
        ['Provide a detailed feature description', 'Include problem statement and solution approach']
      );
    }

    if (!args.market_definition.industry) {
      throw new MarketSizingError(
        'Industry must be specified in market definition',
        'INVALID_MARKET_DEFINITION',
        ['Specify target industry', 'Use standard industry classifications']
      );
    }

    if (!args.market_definition.geography || args.market_definition.geography.length === 0) {
      throw new MarketSizingError(
        'Geographic scope must be specified',
        'INVALID_MARKET_DEFINITION',
        ['Specify target geographic markets', 'Include at least one region']
      );
    }

    if (!args.market_definition.customer_segments || args.market_definition.customer_segments.length === 0) {
      throw new MarketSizingError(
        'Customer segments must be specified',
        'INVALID_MARKET_DEFINITION',
        ['Define target customer segments', 'Include at least one segment']
      );
    }
  }

  private extractMarketContext(args: MarketSizingArgs): any {
    return {
      industry: args.market_definition.industry,
      geography: args.market_definition.geography,
      segments: args.market_definition.customer_segments,
      featureType: this.extractValueType(args.feature_idea)
    };
  }
}

export default MarketAnalyzer;