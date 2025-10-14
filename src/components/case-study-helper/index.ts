/**
 * Case Study Helper System
 * Main interface for case study functionality combining templates and execution
 */

import {
  CaseStudy,
  CaseType,
  CaseSession,
  CaseStep,
  CaseStepResponse,
  CaseProgress,
  CaseHint,
  CaseStepEvaluation,
  CaseEvaluation,
  CaseFramework,
  CaseFilters,
  CaseMarketContext,
  MarketAssumptionValidation
} from '../../models/interview';
import { CaseStudyTemplates } from '../case-study-templates/index';
import { CaseStudyExecutionEngine, CaseExecutionConfig } from '../case-study-execution-engine/index';
import { FrameworkGuidanceSystem } from '../framework-guidance/index';
import { MarketContextFetcher } from '../market-context-fetcher/index';
import { CurrentScenarioGenerator } from '../current-scenario-generator/index';

export interface CaseStudyHelperConfig extends CaseExecutionConfig {
  marketDataIntegration: boolean;
  adaptiveDifficulty: boolean;
  personalizedRecommendations: boolean;
}

export class CaseStudyHelper {
  private templates: CaseStudyTemplates;
  private executionEngine: CaseStudyExecutionEngine;
  private frameworkGuidance: FrameworkGuidanceSystem;
  private marketFetcher: MarketContextFetcher;
  private scenarioGenerator: CurrentScenarioGenerator;
  private caseBank: Map<string, CaseStudy> = new Map();

  constructor(private config: CaseStudyHelperConfig = {
    enableHints: true,
    timeTracking: true,
    autoProgression: false,
    evaluationMode: 'step_complete',
    marketDataIntegration: true,
    adaptiveDifficulty: true,
    personalizedRecommendations: true
  }) {
    this.templates = new CaseStudyTemplates();
    this.executionEngine = new CaseStudyExecutionEngine(config);
    this.frameworkGuidance = new FrameworkGuidanceSystem();
    this.marketFetcher = new MarketContextFetcher({
      enableRealTimeData: config.marketDataIntegration,
      cacheTimeout: 30 * 60 * 1000, // 30 minutes
      confidenceThreshold: 0.6,
      maxRetries: 3,
    });
    this.scenarioGenerator = new CurrentScenarioGenerator({
      useRealTimeData: config.marketDataIntegration,
      includeCompetitiveContext: true,
      adaptToMarketConditions: true,
      maxScenarioComplexity: 'moderate',
    });
    this.initializeCaseBank();
  }

  /**
   * Get available case studies with optional filtering
   */
  getAvailableCases(filters?: CaseFilters): CaseStudy[] {
    let cases = Array.from(this.caseBank.values());

    if (filters) {
      if (filters.type) {
        cases = cases.filter(c => c.type === filters.type);
      }
      if (filters.difficulty) {
        cases = cases.filter(c => c.difficulty === filters.difficulty);
      }
      if (filters.industry) {
        cases = cases.filter(c => c.industry === filters.industry);
      }
      if (filters.company) {
        cases = cases.filter(c => c.company === filters.company);
      }
      if (filters.estimatedTime) {
        cases = cases.filter(c => c.estimatedTime <= filters.estimatedTime);
      }
      if (filters.frameworks) {
        cases = cases.filter(c => 
          filters.frameworks!.some(f => c.expectedFrameworks.includes(f))
        );
      }
      if (filters.excludeIds) {
        cases = cases.filter(c => !filters.excludeIds!.includes(c.id));
      }
    }

    return cases;
  }

  /**
   * Get a random case study based on filters
   */
  getRandomCase(filters?: CaseFilters): CaseStudy | null {
    const availableCases = this.getAvailableCases(filters);
    if (availableCases.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * availableCases.length);
    return availableCases[randomIndex];
  }

  /**
   * Get case study by ID
   */
  getCaseById(caseId: string): CaseStudy | null {
    return this.caseBank.get(caseId) || null;
  }

  /**
   * Start a new case study session
   */
  async startCaseStudy(
    caseId: string,
    userId?: string,
    customizations?: {
      industry?: string;
      company?: string;
      difficulty?: number;
      timeConstraints?: boolean;
    }
  ): Promise<{ session: CaseSession; firstStep: CaseStep } | null> {
    let caseStudy = this.getCaseById(caseId);
    if (!caseStudy) return null;

    // Apply customizations if provided
    if (customizations) {
      caseStudy = this.customizeCase(caseStudy, customizations);
    }

    // Integrate market data if enabled
    if (this.config.marketDataIntegration && customizations?.industry) {
      caseStudy = await this.integrateMarketData(caseStudy, customizations.industry);
    }

    const session = await this.executionEngine.initializeCaseSession(caseStudy, userId);
    const firstStep = this.executionEngine.getCurrentStep(session.sessionId);

    if (!firstStep) return null;

    return { session, firstStep };
  }

  /**
   * Get current step for a session
   */
  getCurrentStep(sessionId: string): CaseStep | null {
    return this.executionEngine.getCurrentStep(sessionId);
  }

  /**
   * Submit response for current step
   */
  async submitStepResponse(
    sessionId: string,
    response: string,
    frameworksUsed: CaseFramework[] = []
  ): Promise<{
    success: boolean;
    evaluation?: CaseStepEvaluation;
    nextStep?: CaseStep;
    hints?: CaseHint[];
    guidance?: any[];
    error?: string;
  }> {
    const result = await this.executionEngine.submitStepResponse(sessionId, response, frameworksUsed);
    
    const enhancedResult = {
      ...result,
      guidance: undefined as any[] | undefined
    };
    
    if (result.success && result.nextStep) {
      // Provide framework guidance for next step
      enhancedResult.guidance = this.frameworkGuidance.getGuidanceForStep(result.nextStep);
    }

    return enhancedResult;
  }

  /**
   * Request hint for current step
   */
  getHint(sessionId: string, hintLevel: 'gentle' | 'moderate' | 'strong' = 'gentle'): CaseHint | null {
    return this.executionEngine.getHint(sessionId, hintLevel);
  }

  /**
   * Get framework guidance for current step
   */
  getFrameworkGuidance(sessionId: string): any[] {
    return this.executionEngine.getFrameworkGuidanceForStep(sessionId);
  }

  /**
   * Get session progress
   */
  getProgress(sessionId: string): CaseProgress | null {
    return this.executionEngine.getSessionProgress(sessionId);
  }

  /**
   * Check if user needs help
   */
  checkIfUserNeedsHelp(sessionId: string): {
    isStuck: boolean;
    suggestions: string[];
    availableHints: CaseHint[];
  } {
    const isStuck = this.executionEngine.isUserStuck(sessionId);
    const suggestions: string[] = [];
    const availableHints: CaseHint[] = [];

    if (isStuck) {
      suggestions.push('Consider requesting a hint to get unstuck');
      suggestions.push('Review the framework guidance for this step');
      
      const hint = this.getHint(sessionId, 'gentle');
      if (hint) {
        availableHints.push(hint);
      }
    }

    const currentStep = this.getCurrentStep(sessionId);
    if (currentStep) {
      const recommendedFrameworks = this.frameworkGuidance.getRecommendedFrameworks(currentStep.stepType);
      if (recommendedFrameworks.length > 0) {
        suggestions.push(`Consider using these frameworks: ${recommendedFrameworks.join(', ')}`);
      }
    }

    return { isStuck, suggestions, availableHints };
  }

  /**
   * Complete case study and get final evaluation
   */
  async completeCaseStudy(sessionId: string): Promise<CaseEvaluation | null> {
    const evaluation = await this.executionEngine.completeCaseStudy(sessionId);
    
    if (evaluation && this.config.personalizedRecommendations) {
      // Enhance recommendations based on performance
      evaluation.recommendedNextCases = this.generatePersonalizedRecommendations(evaluation);
    }

    return evaluation;
  }

  /**
   * Get case study statistics
   */
  getCaseStatistics(): {
    totalCases: number;
    byType: Record<CaseType, number>;
    byDifficulty: Record<number, number>;
    byFramework: Record<CaseFramework, number>;
  } {
    const cases = Array.from(this.caseBank.values());
    
    const byType: Record<CaseType, number> = {
      'product_design': 0,
      'strategy': 0,
      'prioritization': 0,
      'market_entry': 0
    };

    const byDifficulty: Record<number, number> = {};
    const byFramework: Record<CaseFramework, number> = {} as Record<CaseFramework, number>;

    cases.forEach(caseStudy => {
      byType[caseStudy.type]++;
      
      byDifficulty[caseStudy.difficulty] = (byDifficulty[caseStudy.difficulty] || 0) + 1;
      
      caseStudy.expectedFrameworks.forEach(framework => {
        byFramework[framework] = (byFramework[framework] || 0) + 1;
      });
    });

    return {
      totalCases: cases.length,
      byType,
      byDifficulty,
      byFramework
    };
  }

  /**
   * Create custom case study from template
   */
  createCustomCase(
    templateName: string,
    customizations: {
      scenario?: string;
      industry?: string;
      company?: string;
      constraints?: string[];
      difficulty?: number;
    }
  ): CaseStudy | null {
    const template = this.templates.getTemplateByName(templateName);
    if (!template) return null;

    const caseId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const customCase: CaseStudy = {
      id: caseId,
      type: template.type,
      title: `Custom ${template.name}`,
      scenario: customizations.scenario || `Custom scenario for ${template.name}`,
      context: `Custom case study based on ${template.name} template`,
      constraints: customizations.constraints || [],
      objectives: [`Complete the ${template.name} framework`],
      steps: template.structure,
      expectedFrameworks: template.frameworks,
      difficulty: customizations.difficulty || 3,
      estimatedTime: template.structure.reduce((sum, step) => sum + step.timeLimit, 0),
      industry: customizations.industry,
      company: customizations.company,
      tags: ['custom', template.type]
    };

    // Add to case bank
    this.caseBank.set(caseId, customCase);

    return customCase;
  }

  /**
   * Generate current market-based case study scenario
   */
  async generateCurrentScenario(request: {
    caseType: CaseType;
    industry: string;
    difficulty: number;
    timeConstraint?: number;
    targetCompany?: string;
  }): Promise<CaseStudy | null> {
    if (!this.config.marketDataIntegration) {
      return null; // Market integration disabled
    }

    try {
      const dynamicScenario = await this.scenarioGenerator.generateCurrentScenario(request);
      
      // Add to case bank
      this.caseBank.set(dynamicScenario.baseScenario.id, dynamicScenario.baseScenario);
      
      return dynamicScenario.baseScenario;
    } catch (error) {
      console.warn(`Failed to generate current scenario: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Validate user assumptions against real market data
   */
  async validateCaseAssumptions(
    caseId: string,
    userAssumptions: string[]
  ): Promise<MarketAssumptionValidation[] | null> {
    if (!this.config.marketDataIntegration) {
      return null;
    }

    const caseStudy = this.getCaseById(caseId);
    if (!caseStudy || !caseStudy.industry) {
      return null;
    }

    try {
      return await this.marketFetcher.validateAssumptions({
        assumptions: userAssumptions,
        industry: caseStudy.industry,
      });
    } catch (error) {
      console.warn(`Failed to validate assumptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Get market intelligence for case study context
   */
  async getMarketIntelligence(industry: string): Promise<any | null> {
    if (!this.config.marketDataIntegration) {
      return null;
    }

    try {
      return await this.marketFetcher.getMarketIntelligence(industry);
    } catch (error) {
      console.warn(`Failed to get market intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Enhance existing case with current market trends
   */
  async enhanceCaseWithMarketTrends(
    caseId: string,
    specificTrends?: string[]
  ): Promise<CaseStudy | null> {
    if (!this.config.marketDataIntegration) {
      return null;
    }

    const caseStudy = this.getCaseById(caseId);
    if (!caseStudy) {
      return null;
    }

    try {
      const enhancedCase = await this.scenarioGenerator.integrateMarketTrends(
        caseStudy,
        specificTrends
      );
      
      // Update in case bank
      this.caseBank.set(caseId, enhancedCase);
      
      return enhancedCase;
    } catch (error) {
      console.warn(`Failed to enhance case with market trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return caseStudy; // Return original case if enhancement fails
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
    return this.scenarioGenerator.getAvailableScenarioTypes(industry);
  }

  private initializeCaseBank(): void {
    // Generate cases from templates
    this.templates.getAllTemplates().forEach(template => {
      // Create base case from template
      const baseCase = this.createCaseFromTemplate(template);
      this.caseBank.set(baseCase.id, baseCase);

      // Create variations
      template.variations.forEach(variation => {
        const variationCase = this.createCaseVariation(baseCase, variation);
        this.caseBank.set(variationCase.id, variationCase);
      });
    });
  }

  private createCaseFromTemplate(template: any): CaseStudy {
    return {
      id: `${template.type}_${template.name.toLowerCase().replace(/\s+/g, '_')}`,
      type: template.type,
      title: template.name,
      scenario: template.description,
      context: `Practice case study for ${template.name}`,
      constraints: [],
      objectives: [`Master the ${template.frameworks.join(', ')} framework(s)`],
      steps: template.structure,
      expectedFrameworks: template.frameworks,
      difficulty: 3,
      estimatedTime: template.structure.reduce((sum: number, step: any) => sum + step.timeLimit, 0),
      tags: [template.type, 'template']
    };
  }

  private createCaseVariation(baseCase: CaseStudy, variation: any): CaseStudy {
    return {
      ...baseCase,
      id: `${baseCase.id}_${variation.name.toLowerCase().replace(/\s+/g, '_')}`,
      title: `${baseCase.title} - ${variation.name}`,
      scenario: variation.modifications.scenario || baseCase.scenario,
      constraints: variation.modifications.constraints || baseCase.constraints,
      objectives: variation.modifications.objectives || baseCase.objectives,
      difficulty: variation.modifications.difficulty || baseCase.difficulty,
      industry: variation.modifications.industry || baseCase.industry,
      tags: [...baseCase.tags, 'variation']
    };
  }

  private customizeCase(caseStudy: CaseStudy, customizations: any): CaseStudy {
    return {
      ...caseStudy,
      industry: customizations.industry || caseStudy.industry,
      company: customizations.company || caseStudy.company,
      difficulty: customizations.difficulty || caseStudy.difficulty,
      // Apply time constraints if requested
      steps: customizations.timeConstraints ? 
        caseStudy.steps.map(step => ({ ...step, timeLimit: Math.floor(step.timeLimit * 0.8) })) :
        caseStudy.steps
    };
  }

  private async integrateMarketData(caseStudy: CaseStudy, industry: string): Promise<CaseStudy> {
    if (!this.config.marketDataIntegration) {
      // Fallback to mock data if market integration is disabled
      const mockMarketData: CaseMarketContext = {
        industry,
        marketSize: {
          tam: 100000000, // $100M
          sam: 10000000,  // $10M
          som: 1000000    // $1M
        },
        competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
        trends: ['Digital transformation', 'Remote work adoption', 'AI integration'],
        keyMetrics: {
          'growth_rate': 0.15,
          'market_penetration': 0.05,
          'customer_acquisition_cost': 100
        },
        assumptions: [
          'Market continues to grow at current rate',
          'No major regulatory changes',
          'Technology adoption continues'
        ]
      };

      return {
        ...caseStudy,
        marketData: mockMarketData,
        context: `${caseStudy.context}\n\nMarket Context: ${industry} industry with $${(mockMarketData.marketSize.tam / 1000000).toFixed(0)}M TAM.`
      };
    }

    try {
      // Fetch real market data using market context fetcher
      const marketContext = await this.marketFetcher.fetchMarketContext({
        industry,
        featureIdea: `Case study for ${caseStudy.title}`,
      });

      return {
        ...caseStudy,
        marketData: marketContext,
        context: `${caseStudy.context}\n\nMarket Context: ${industry} industry with $${(marketContext.marketSize.tam / 1000000000).toFixed(1)}B TAM, growing at ${((marketContext.marketSize.growthRate || 0.07) * 100).toFixed(1)}% annually.`
      };
    } catch (error) {
      console.warn(`Failed to fetch real market data, using fallback: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to mock data if real data fetch fails
      const mockMarketData: CaseMarketContext = {
        industry,
        marketSize: {
          tam: 100000000,
          sam: 10000000,
          som: 1000000
        },
        competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
        trends: ['Digital transformation', 'Remote work adoption', 'AI integration'],
        keyMetrics: {
          'growth_rate': 0.15,
          'market_penetration': 0.05,
          'customer_acquisition_cost': 100
        },
        assumptions: [
          'Market continues to grow at current rate',
          'No major regulatory changes',
          'Technology adoption continues'
        ]
      };

      return {
        ...caseStudy,
        marketData: mockMarketData,
        context: `${caseStudy.context}\n\nMarket Context: ${industry} industry with $${(mockMarketData.marketSize.tam / 1000000).toFixed(0)}M TAM.`
      };
    }
  }

  private generatePersonalizedRecommendations(evaluation: CaseEvaluation): string[] {
    const recommendations: string[] = [];
    
    // Based on framework proficiency
    Object.entries(evaluation.frameworkProficiency).forEach(([framework, score]) => {
      if (score < 0.6) {
        recommendations.push(`Practice more cases focusing on ${framework} framework`);
      }
    });

    // Based on overall performance
    if (evaluation.overallScore >= 4) {
      recommendations.push('Try higher difficulty cases in the same category');
      recommendations.push('Explore cases in different industries');
    } else if (evaluation.overallScore < 3) {
      recommendations.push('Practice similar cases to reinforce learning');
      recommendations.push('Focus on framework application before advancing');
    }

    // Based on time performance
    if (evaluation.timeSpent > 60 * 60 * 1000) { // More than 1 hour
      recommendations.push('Practice time management with shorter cases');
    }

    return recommendations;
  }
}