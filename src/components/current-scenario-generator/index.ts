/**
 * Current Scenario Generator Component
 * 
 * Creates dynamic case study scenarios using live market intelligence
 * and validates user assumptions against actual market metrics.
 */

import { MarketContextFetcher } from '../market-context-fetcher/index';
import {
  CaseStudy,
  CaseType,
  CaseStep,
  CaseFramework,
  CaseMarketContext,
  MarketIntelligence,
  IndustryTrends,
  MarketAssumptionValidation,
} from '../../models/interview';

export interface ScenarioGenerationConfig {
  useRealTimeData: boolean;
  includeCompetitiveContext: boolean;
  adaptToMarketConditions: boolean;
  maxScenarioComplexity: 'simple' | 'moderate' | 'complex';
  industryFocus?: string[];
}

export interface ScenarioRequest {
  caseType: CaseType;
  industry: string;
  difficulty: number;
  timeConstraint?: number;
  specificTrends?: string[];
  targetCompany?: string;
  customConstraints?: string[];
}

export interface DynamicScenario {
  baseScenario: CaseStudy;
  marketContext: CaseMarketContext;
  realTimeElements: {
    currentTrends: string[];
    competitiveMovements: string[];
    marketMetrics: Record<string, number>;
    timeSensitiveFactors: string[];
  };
  validationFramework: {
    keyAssumptions: string[];
    validationCriteria: string[];
    successMetrics: string[];
  };
}

export interface ScenarioValidationResult {
  scenarioId: string;
  userAssumptions: string[];
  validationResults: MarketAssumptionValidation[];
  marketAlignment: {
    score: number; // 0-1 scale
    alignedAssumptions: string[];
    contradictedAssumptions: string[];
    missingConsiderations: string[];
  };
  recommendations: {
    adjustments: string[];
    additionalResearch: string[];
    riskMitigation: string[];
  };
}

export class CurrentScenarioGenerator {
  private marketFetcher: MarketContextFetcher;
  private scenarioCache: Map<string, DynamicScenario> = new Map();

  constructor(private config: ScenarioGenerationConfig = {
    useRealTimeData: true,
    includeCompetitiveContext: true,
    adaptToMarketConditions: true,
    maxScenarioComplexity: 'moderate'
  }) {
    this.marketFetcher = new MarketContextFetcher({
      enableRealTimeData: config.useRealTimeData,
      cacheTimeout: 15 * 60 * 1000, // 15 minutes for scenarios
      confidenceThreshold: 0.6,
      maxRetries: 3,
    });
  }

  /**
   * Generate a dynamic case study scenario using current market intelligence
   */
  async generateCurrentScenario(request: ScenarioRequest): Promise<DynamicScenario> {
    const cacheKey = this.generateScenarioCacheKey(request);
    
    // Check cache first
    const cached = this.scenarioCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Fetch current market intelligence
      const marketIntelligence = await this.marketFetcher.getMarketIntelligence(
        request.industry,
        ['Global'] // Default to global for scenarios
      );

      // Get industry trends
      const industryTrends = await this.marketFetcher.getIndustryTrends(request.industry);

      // Fetch detailed market context
      const marketContext = await this.marketFetcher.fetchMarketContext({
        industry: request.industry,
        featureIdea: this.generateFeatureIdeaFromRequest(request),
      });

      // Generate base scenario structure
      const baseScenario = this.createBaseScenario(request, marketIntelligence, industryTrends);

      // Enhance with real-time market elements
      const realTimeElements = this.generateRealTimeElements(marketIntelligence, industryTrends);

      // Create validation framework
      const validationFramework = this.createValidationFramework(
        request,
        marketContext,
        marketIntelligence
      );

      const dynamicScenario: DynamicScenario = {
        baseScenario,
        marketContext,
        realTimeElements,
        validationFramework,
      };

      // Cache the scenario
      this.scenarioCache.set(cacheKey, dynamicScenario);

      return dynamicScenario;
    } catch (error) {
      throw new Error(`Failed to generate current scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate user assumptions against current market metrics
   */
  async validateScenarioAssumptions(
    scenarioId: string,
    userAssumptions: string[]
  ): Promise<ScenarioValidationResult> {
    try {
      // Find the scenario
      const scenario = Array.from(this.scenarioCache.values()).find(
        s => s.baseScenario.id === scenarioId
      );

      if (!scenario) {
        throw new Error(`Scenario ${scenarioId} not found`);
      }

      // Validate assumptions against market data
      const validationResults = await this.marketFetcher.validateAssumptions({
        assumptions: userAssumptions,
        industry: scenario.marketContext.industry,
      });

      // Calculate market alignment score
      const marketAlignment = this.calculateMarketAlignment(validationResults, scenario);

      // Generate recommendations
      const recommendations = this.generateValidationRecommendations(
        validationResults,
        marketAlignment,
        scenario
      );

      return {
        scenarioId,
        userAssumptions,
        validationResults,
        marketAlignment,
        recommendations,
      };
    } catch (error) {
      throw new Error(`Failed to validate scenario assumptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update scenario with latest market trends
   */
  async refreshScenarioWithLatestTrends(scenarioId: string): Promise<DynamicScenario> {
    const scenario = Array.from(this.scenarioCache.values()).find(
      s => s.baseScenario.id === scenarioId
    );

    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    try {
      // Fetch latest trends
      const latestTrends = await this.marketFetcher.getIndustryTrends(
        scenario.marketContext.industry
      );

      // Update real-time elements
      const updatedRealTimeElements = {
        ...scenario.realTimeElements,
        currentTrends: latestTrends.currentTrends.map(t => t.name),
        timeSensitiveFactors: this.generateTimeSensitiveFactors(latestTrends),
      };

      // Update scenario context
      const updatedScenario: DynamicScenario = {
        ...scenario,
        realTimeElements: updatedRealTimeElements,
      };

      // Update cache
      const cacheKey = Array.from(this.scenarioCache.entries()).find(
        ([, value]) => value.baseScenario.id === scenarioId
      )?.[0];

      if (cacheKey) {
        this.scenarioCache.set(cacheKey, updatedScenario);
      }

      return updatedScenario;
    } catch (error) {
      throw new Error(`Failed to refresh scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate market trend integration for case context
   */
  async integrateMarketTrends(
    caseStudy: CaseStudy,
    specificTrends?: string[]
  ): Promise<CaseStudy> {
    if (!caseStudy.industry) {
      return caseStudy; // Cannot integrate without industry context
    }

    try {
      const industryTrends = await this.marketFetcher.getIndustryTrends(caseStudy.industry);
      
      // Filter trends if specific ones are requested
      const relevantTrends = specificTrends 
        ? industryTrends.currentTrends.filter(t => 
            specificTrends.some(st => t.name.toLowerCase().includes(st.toLowerCase()))
          )
        : industryTrends.currentTrends.slice(0, 3); // Top 3 trends

      // Integrate trends into scenario
      const trendContext = relevantTrends.map(trend => 
        `Current trend: ${trend.name} (${trend.impact} impact, ${trend.timeframe})`
      ).join('\n');

      // Update case study with trend integration
      const updatedCaseStudy: CaseStudy = {
        ...caseStudy,
        context: `${caseStudy.context}\n\nMarket Trends Context:\n${trendContext}`,
        constraints: [
          ...caseStudy.constraints,
          ...relevantTrends.map(t => `Consider impact of ${t.name} trend`)
        ],
        marketData: {
          ...caseStudy.marketData!,
          trends: relevantTrends.map(t => t.name),
        },
      };

      return updatedCaseStudy;
    } catch (error) {
      console.warn(`Failed to integrate market trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return caseStudy; // Return original if integration fails
    }
  }

  /**
   * Get available scenario types for industry
   */
  getAvailableScenarioTypes(industry: string): Array<{
    type: CaseType;
    description: string;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTime: number;
    requiredFrameworks: CaseFramework[];
  }> {
    const scenarioTypes = [
      {
        type: 'product_design' as CaseType,
        description: `Design a new product for the ${industry} market`,
        complexity: 'moderate' as const,
        estimatedTime: 45,
        requiredFrameworks: ['CIRCLES', 'Jobs_to_be_Done'] as CaseFramework[],
      },
      {
        type: 'strategy' as CaseType,
        description: `Develop market entry strategy for ${industry}`,
        complexity: 'complex' as const,
        estimatedTime: 60,
        requiredFrameworks: ['SWOT', 'Porter_Five_Forces'] as CaseFramework[],
      },
      {
        type: 'prioritization' as CaseType,
        description: `Prioritize features for ${industry} product`,
        complexity: 'simple' as const,
        estimatedTime: 30,
        requiredFrameworks: ['RICE', 'North_Star'] as CaseFramework[],
      },
      {
        type: 'market_entry' as CaseType,
        description: `Enter new market segment in ${industry}`,
        complexity: 'complex' as const,
        estimatedTime: 50,
        requiredFrameworks: ['Lean_Canvas', 'SWOT'] as CaseFramework[],
      },
    ];

    // Filter by complexity if configured
    return scenarioTypes.filter(scenario => {
      if (this.config.maxScenarioComplexity === 'simple') {
        return scenario.complexity === 'simple';
      }
      if (this.config.maxScenarioComplexity === 'moderate') {
        return ['simple', 'moderate'].includes(scenario.complexity);
      }
      return true; // complex allows all
    });
  }

  // Private helper methods

  private createBaseScenario(
    request: ScenarioRequest,
    marketIntelligence: MarketIntelligence,
    industryTrends: IndustryTrends
  ): CaseStudy {
    const scenarioId = `current_${request.caseType}_${request.industry}_${Date.now()}`;
    
    const baseScenario: CaseStudy = {
      id: scenarioId,
      type: request.caseType,
      title: this.generateScenarioTitle(request, marketIntelligence),
      scenario: this.generateScenarioDescription(request, marketIntelligence, industryTrends),
      context: this.generateScenarioContext(request, marketIntelligence),
      constraints: this.generateScenarioConstraints(request, marketIntelligence),
      objectives: this.generateScenarioObjectives(request.caseType),
      steps: this.generateScenarioSteps(request.caseType, request.difficulty),
      expectedFrameworks: this.getExpectedFrameworks(request.caseType),
      difficulty: request.difficulty,
      estimatedTime: request.timeConstraint || this.getEstimatedTime(request.caseType, request.difficulty),
      industry: request.industry,
      company: request.targetCompany,
      tags: ['current', 'real-time', request.caseType, request.industry],
    };

    return baseScenario;
  }

  private generateScenarioTitle(
    request: ScenarioRequest,
    marketIntelligence: MarketIntelligence
  ): string {
    const typeLabels: Record<CaseType, string> = {
      product_design: 'Product Design Challenge',
      strategy: 'Strategic Planning Case',
      prioritization: 'Feature Prioritization',
      market_entry: 'Market Entry Strategy',
    };

    const maturityContext = marketIntelligence.marketOverview.maturity === 'emerging' 
      ? 'in Emerging Market' 
      : marketIntelligence.marketOverview.maturity === 'mature'
      ? 'in Established Market'
      : 'in Growing Market';

    return `${typeLabels[request.caseType]}: ${request.industry} ${maturityContext}`;
  }

  private generateScenarioDescription(
    request: ScenarioRequest,
    marketIntelligence: MarketIntelligence,
    industryTrends: IndustryTrends
  ): string {
    const marketSize = (marketIntelligence.marketOverview.size / 1000000000).toFixed(1);
    const growthRate = (marketIntelligence.marketOverview.growthRate * 100).toFixed(1);
    const topTrends = industryTrends.currentTrends.slice(0, 2).map(t => t.name).join(' and ');

    const scenarios: Record<CaseType, string> = {
      product_design: `You are a PM at a ${request.targetCompany || 'technology company'} looking to design a new product for the ${request.industry} market. The market is worth $${marketSize}B and growing at ${growthRate}% annually. Key trends include ${topTrends}. Your challenge is to design a product that addresses current market needs while leveraging these trends.`,
      
      strategy: `As a Senior PM, you need to develop a comprehensive strategy for entering the ${request.industry} market. The market shows ${marketIntelligence.competitiveLandscape.competitiveIntensity} competitive intensity with ${marketIntelligence.competitiveLandscape.numberOfCompetitors} major players. Current trends like ${topTrends} are reshaping the landscape.`,
      
      prioritization: `You're managing a product in the ${request.industry} space with limited resources. The market is experiencing ${topTrends} trends, and you need to prioritize features that will drive the most impact. Consider the competitive landscape and current market dynamics.`,
      
      market_entry: `Your company wants to enter the ${request.industry} market, which is currently ${marketIntelligence.marketOverview.maturity} with $${marketSize}B in size. Key trends include ${topTrends}. Develop a market entry strategy considering current competitive dynamics and market opportunities.`,
    };

    return scenarios[request.caseType];
  }

  private generateScenarioContext(
    request: ScenarioRequest,
    marketIntelligence: MarketIntelligence
  ): string {
    const context = [
      `Market Overview: ${marketIntelligence.marketOverview.maturity} market with ${marketIntelligence.competitiveLandscape.competitiveIntensity} competition`,
      `Key Opportunities: ${marketIntelligence.opportunities.marketGaps.slice(0, 2).join(', ')}`,
      `Main Risks: ${marketIntelligence.risks.competitiveThreats.slice(0, 2).join(', ')}`,
    ];

    if (request.customConstraints) {
      context.push(`Additional Constraints: ${request.customConstraints.join(', ')}`);
    }

    return context.join('\n');
  }

  private generateScenarioConstraints(
    request: ScenarioRequest,
    marketIntelligence: MarketIntelligence
  ): string[] {
    const constraints = [
      `Budget considerations in ${marketIntelligence.marketOverview.maturity} market`,
      `Competitive pressure from ${marketIntelligence.competitiveLandscape.numberOfCompetitors} existing players`,
    ];

    if (request.timeConstraint) {
      constraints.push(`Time constraint: ${request.timeConstraint} minutes`);
    }

    if (marketIntelligence.risks.regulatoryRisks.length > 0) {
      constraints.push(`Regulatory considerations: ${marketIntelligence.risks.regulatoryRisks[0]}`);
    }

    return constraints.concat(request.customConstraints || []);
  }

  private generateScenarioObjectives(caseType: CaseType): string[] {
    const objectives: Record<CaseType, string[]> = {
      product_design: [
        'Define target user and use cases',
        'Design core product features',
        'Establish success metrics',
        'Consider competitive positioning',
      ],
      strategy: [
        'Analyze market opportunity',
        'Assess competitive landscape',
        'Define strategic approach',
        'Create implementation roadmap',
      ],
      prioritization: [
        'Identify prioritization criteria',
        'Evaluate feature options',
        'Create prioritized roadmap',
        'Justify decisions with data',
      ],
      market_entry: [
        'Analyze market opportunity',
        'Define entry strategy',
        'Identify key success factors',
        'Create go-to-market plan',
      ],
    };

    return objectives[caseType];
  }

  private generateScenarioSteps(caseType: CaseType, difficulty: number): CaseStep[] {
    const baseSteps: Record<CaseType, Omit<CaseStep, 'stepNumber'>[]> = {
      product_design: [
        {
          stepType: 'clarification',
          title: 'Clarify Requirements',
          instruction: 'Ask clarifying questions about the product requirements',
          description: 'Understand the problem space and constraints',
          frameworks: ['CIRCLES'],
          timeLimit: 8,
          evaluationCriteria: ['Asked relevant questions', 'Understood constraints'],
          hints: [],
          expectedOutputs: ['List of clarifying questions', 'Problem statement'],
        },
        {
          stepType: 'analysis',
          title: 'Market Analysis',
          instruction: 'Analyze the market and user needs',
          description: 'Research target users and market dynamics',
          frameworks: ['Jobs_to_be_Done', 'SWOT'],
          timeLimit: 12,
          evaluationCriteria: ['Identified target users', 'Analyzed market dynamics'],
          hints: [],
          expectedOutputs: ['User personas', 'Market analysis'],
        },
        {
          stepType: 'ideation',
          title: 'Solution Design',
          instruction: 'Design the product solution',
          description: 'Create product concept and key features',
          frameworks: ['CIRCLES'],
          timeLimit: 15,
          evaluationCriteria: ['Clear product concept', 'Well-defined features'],
          hints: [],
          expectedOutputs: ['Product concept', 'Feature list'],
        },
        {
          stepType: 'metrics',
          title: 'Success Metrics',
          instruction: 'Define success metrics and KPIs',
          description: 'Establish how to measure product success',
          frameworks: ['North_Star', 'OKRs'],
          timeLimit: 10,
          evaluationCriteria: ['Relevant metrics defined', 'Clear success criteria'],
          hints: [],
          expectedOutputs: ['Success metrics', 'KPI framework'],
        },
      ],
      strategy: [
        {
          stepType: 'analysis',
          title: 'Situation Analysis',
          instruction: 'Analyze current market situation',
          description: 'Assess market conditions and competitive landscape',
          frameworks: ['SWOT', 'Porter_Five_Forces'],
          timeLimit: 15,
          evaluationCriteria: ['Comprehensive market analysis', 'Competitive assessment'],
          hints: [],
          expectedOutputs: ['Market assessment', 'Competitive analysis'],
        },
        {
          stepType: 'ideation',
          title: 'Strategy Options',
          instruction: 'Generate strategic options',
          description: 'Develop multiple strategic approaches',
          frameworks: ['Lean_Canvas'],
          timeLimit: 12,
          evaluationCriteria: ['Multiple options considered', 'Creative thinking'],
          hints: [],
          expectedOutputs: ['Strategic options', 'Option evaluation'],
        },
        {
          stepType: 'recommendation',
          title: 'Strategic Recommendation',
          instruction: 'Recommend preferred strategy',
          description: 'Select and justify the best strategic approach',
          frameworks: ['RICE'],
          timeLimit: 18,
          evaluationCriteria: ['Clear recommendation', 'Strong justification'],
          hints: [],
          expectedOutputs: ['Strategy recommendation', 'Implementation plan'],
        },
      ],
      prioritization: [
        {
          stepType: 'clarification',
          title: 'Define Criteria',
          instruction: 'Establish prioritization criteria',
          description: 'Define what factors matter for prioritization',
          frameworks: ['RICE', 'North_Star'],
          timeLimit: 8,
          evaluationCriteria: ['Clear criteria defined', 'Criteria are measurable'],
          hints: [],
          expectedOutputs: ['Prioritization criteria', 'Weighting system'],
        },
        {
          stepType: 'analysis',
          title: 'Evaluate Options',
          instruction: 'Assess each feature option',
          description: 'Score features against defined criteria',
          frameworks: ['RICE'],
          timeLimit: 15,
          evaluationCriteria: ['Systematic evaluation', 'Data-driven scoring'],
          hints: [],
          expectedOutputs: ['Feature scoring', 'Evaluation matrix'],
        },
        {
          stepType: 'recommendation',
          title: 'Final Prioritization',
          instruction: 'Create prioritized roadmap',
          description: 'Rank features and create implementation sequence',
          frameworks: ['RICE', 'OKRs'],
          timeLimit: 12,
          evaluationCriteria: ['Clear prioritization', 'Logical sequencing'],
          hints: [],
          expectedOutputs: ['Prioritized roadmap', 'Rationale document'],
        },
      ],
      market_entry: [
        {
          stepType: 'analysis',
          title: 'Market Opportunity',
          instruction: 'Analyze market entry opportunity',
          description: 'Assess market size, growth, and attractiveness',
          frameworks: ['Porter_Five_Forces', 'SWOT'],
          timeLimit: 15,
          evaluationCriteria: ['Market size analysis', 'Opportunity assessment'],
          hints: [],
          expectedOutputs: ['Market analysis', 'Opportunity sizing'],
        },
        {
          stepType: 'analysis',
          title: 'Entry Strategy',
          instruction: 'Define market entry approach',
          description: 'Determine how to enter the market effectively',
          frameworks: ['Lean_Canvas'],
          timeLimit: 12,
          evaluationCriteria: ['Clear entry strategy', 'Risk consideration'],
          hints: [],
          expectedOutputs: ['Entry strategy', 'Risk assessment'],
        },
        {
          stepType: 'recommendation',
          title: 'Go-to-Market Plan',
          instruction: 'Create go-to-market strategy',
          description: 'Develop comprehensive launch and growth plan',
          frameworks: ['OKRs'],
          timeLimit: 18,
          evaluationCriteria: ['Comprehensive GTM plan', 'Clear milestones'],
          hints: [],
          expectedOutputs: ['GTM strategy', 'Success metrics'],
        },
      ],
    };

    const steps = baseSteps[caseType];
    
    // Adjust time limits based on difficulty
    const timeMultiplier = difficulty <= 2 ? 1.2 : difficulty >= 4 ? 0.8 : 1.0;
    
    return steps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
      timeLimit: Math.round(step.timeLimit * timeMultiplier),
    }));
  }

  private getExpectedFrameworks(caseType: CaseType): CaseFramework[] {
    const frameworks: Record<CaseType, CaseFramework[]> = {
      product_design: ['CIRCLES', 'Jobs_to_be_Done', 'North_Star'],
      strategy: ['SWOT', 'Porter_Five_Forces', 'Lean_Canvas'],
      prioritization: ['RICE', 'North_Star', 'OKRs'],
      market_entry: ['Porter_Five_Forces', 'SWOT', 'Lean_Canvas', 'OKRs'],
    };

    return frameworks[caseType];
  }

  private getEstimatedTime(caseType: CaseType, difficulty: number): number {
    const baseTimes: Record<CaseType, number> = {
      product_design: 45,
      strategy: 60,
      prioritization: 35,
      market_entry: 50,
    };

    const difficultyMultiplier = difficulty <= 2 ? 0.8 : difficulty >= 4 ? 1.3 : 1.0;
    return Math.round(baseTimes[caseType] * difficultyMultiplier);
  }

  private generateRealTimeElements(
    marketIntelligence: MarketIntelligence,
    industryTrends: IndustryTrends
  ): DynamicScenario['realTimeElements'] {
    return {
      currentTrends: industryTrends.currentTrends.slice(0, 3).map(t => t.name),
      competitiveMovements: [
        `${marketIntelligence.competitiveLandscape.topCompetitors[0]} expanding market presence`,
        'New entrants increasing competitive pressure',
        'Market consolidation trends emerging',
      ],
      marketMetrics: {
        growth_rate: marketIntelligence.marketOverview.growthRate,
        market_size: marketIntelligence.marketOverview.size,
        competitive_intensity: marketIntelligence.competitiveLandscape.competitiveIntensity === 'high' ? 0.8 : 0.5,
      },
      timeSensitiveFactors: this.generateTimeSensitiveFactors(industryTrends),
    };
  }

  private generateTimeSensitiveFactors(industryTrends: IndustryTrends): string[] {
    const factors: string[] = [];
    
    // High-impact trends with short timeframes are time-sensitive
    industryTrends.currentTrends.forEach(trend => {
      if (trend.impact === 'high' && trend.timeframe.includes('1-2')) {
        factors.push(`${trend.name} trend requires immediate attention`);
      }
    });

    // Add regulatory changes
    if (industryTrends.regulatoryChanges.length > 0) {
      factors.push(`Regulatory changes: ${industryTrends.regulatoryChanges[0]}`);
    }

    // Add disruptive factors
    if (industryTrends.disruptiveFactors.length > 0) {
      factors.push(`Disruptive factor: ${industryTrends.disruptiveFactors[0]}`);
    }

    return factors.slice(0, 3); // Limit to top 3
  }

  private createValidationFramework(
    request: ScenarioRequest,
    marketContext: CaseMarketContext,
    marketIntelligence: MarketIntelligence
  ): DynamicScenario['validationFramework'] {
    return {
      keyAssumptions: [
        `Market growth rate of ${(marketContext.marketSize.growthRate || 0.07 * 100).toFixed(1)}%`,
        `Competitive landscape with ${marketIntelligence.competitiveLandscape.numberOfCompetitors} players`,
        `Market maturity: ${marketIntelligence.marketOverview.maturity}`,
        ...marketContext.assumptions.slice(0, 2),
      ],
      validationCriteria: [
        'Market size estimates accuracy',
        'Growth rate assumptions',
        'Competitive positioning validity',
        'Customer behavior assumptions',
        'Technology trend alignment',
      ],
      successMetrics: [
        'Assumption validation score > 70%',
        'Market alignment score > 60%',
        'Risk mitigation plan completeness',
        'Strategic recommendation quality',
      ],
    };
  }

  private calculateMarketAlignment(
    validationResults: MarketAssumptionValidation[],
    scenario: DynamicScenario
  ): ScenarioValidationResult['marketAlignment'] {
    const validAssumptions = validationResults.filter(r => r.isValid);
    const invalidAssumptions = validationResults.filter(r => !r.isValid);
    
    const score = validAssumptions.length / validationResults.length;
    
    return {
      score,
      alignedAssumptions: validAssumptions.map(r => r.assumption),
      contradictedAssumptions: invalidAssumptions.map(r => r.assumption),
      missingConsiderations: this.identifyMissingConsiderations(validationResults, scenario),
    };
  }

  private identifyMissingConsiderations(
    validationResults: MarketAssumptionValidation[],
    scenario: DynamicScenario
  ): string[] {
    const considerations: string[] = [];
    
    // Check if competitive analysis was considered
    const hasCompetitiveAssumptions = validationResults.some(r => 
      r.assumption.toLowerCase().includes('compet')
    );
    if (!hasCompetitiveAssumptions) {
      considerations.push('Competitive landscape analysis');
    }

    // Check if market trends were considered
    const hasTrendAssumptions = validationResults.some(r =>
      scenario.realTimeElements.currentTrends.some(trend =>
        r.assumption.toLowerCase().includes(trend.toLowerCase())
      )
    );
    if (!hasTrendAssumptions) {
      considerations.push('Current market trends impact');
    }

    // Check if regulatory factors were considered
    const hasRegulatoryAssumptions = validationResults.some(r =>
      r.assumption.toLowerCase().includes('regulat')
    );
    if (!hasRegulatoryAssumptions) {
      considerations.push('Regulatory environment considerations');
    }

    return considerations;
  }

  private generateValidationRecommendations(
    validationResults: MarketAssumptionValidation[],
    marketAlignment: ScenarioValidationResult['marketAlignment'],
    scenario: DynamicScenario
  ): ScenarioValidationResult['recommendations'] {
    const adjustments: string[] = [];
    const additionalResearch: string[] = [];
    const riskMitigation: string[] = [];

    // Generate adjustments based on contradicted assumptions
    marketAlignment.contradictedAssumptions.forEach(assumption => {
      const validation = validationResults.find(r => r.assumption === assumption);
      if (validation) {
        adjustments.push(validation.recommendation);
      }
    });

    // Suggest additional research for missing considerations
    marketAlignment.missingConsiderations.forEach(consideration => {
      additionalResearch.push(`Research ${consideration.toLowerCase()}`);
    });

    // Generate risk mitigation based on market context
    if (scenario.marketContext.marketSize.growthRate < 0.05) {
      riskMitigation.push('Develop strategies for slow-growth market conditions');
    }

    if (scenario.realTimeElements.marketMetrics.competitive_intensity > 0.7) {
      riskMitigation.push('Create differentiation strategy for high-competition environment');
    }

    return {
      adjustments: adjustments.slice(0, 3),
      additionalResearch: additionalResearch.slice(0, 3),
      riskMitigation: riskMitigation.slice(0, 3),
    };
  }

  private generateFeatureIdeaFromRequest(request: ScenarioRequest): string {
    const ideas: Record<CaseType, string> = {
      product_design: `New product solution for ${request.industry} market`,
      strategy: `Strategic initiative in ${request.industry} sector`,
      prioritization: `Feature prioritization for ${request.industry} product`,
      market_entry: `Market entry opportunity in ${request.industry}`,
    };

    return ideas[request.caseType];
  }

  private generateScenarioCacheKey(request: ScenarioRequest): string {
    return `scenario_${request.caseType}_${request.industry}_${request.difficulty}_${request.targetCompany || 'generic'}`;
  }
}

export default CurrentScenarioGenerator;