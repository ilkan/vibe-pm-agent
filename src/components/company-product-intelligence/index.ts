/**
 * Company Product Intelligence Component
 * 
 * Manages company product philosophy, recent launches, and strategic insights
 * for interview preparation context.
 */

import {
  CompanyProfile,
  ProductPhilosophy,
  ProductLaunch,
  CompetitiveContext
} from '../../models/company-profiles';

export interface ProductIntelligence {
  companyId: string;
  productStrategy: ProductStrategyInsights;
  recentLaunches: ProductLaunchAnalysis[];
  competitivePosition: CompetitiveAnalysis;
  marketTrends: MarketTrendAnalysis;
  pmImplications: PMImplications;
  interviewContext: InterviewContextData;
}

export interface ProductStrategyInsights {
  coreStrategy: string[];
  strategicPillars: string[];
  productPrinciples: string[];
  keyMetrics: string[];
  competitiveAdvantages: string[];
  futureDirection: string[];
  pmFocus: string[];
}

export interface ProductLaunchAnalysis {
  launch: ProductLaunch;
  strategicSignificance: string;
  pmLessons: string[];
  interviewRelevance: string[];
  frameworksApplied: string[];
  successFactors: string[];
  challengesFaced: string[];
}

export interface CompetitiveAnalysis {
  marketPosition: string;
  keyCompetitors: CompetitorInsight[];
  differentiationFactors: string[];
  competitiveThreats: string[];
  marketOpportunities: string[];
  strategicResponse: string[];
}

export interface CompetitorInsight {
  name: string;
  relationship: 'direct' | 'indirect' | 'adjacent';
  strengths: string[];
  weaknesses: string[];
  recentMoves: string[];
  implications: string[];
}

export interface MarketTrendAnalysis {
  industryTrends: TrendInsight[];
  technologyTrends: TrendInsight[];
  customerBehaviorTrends: TrendInsight[];
  regulatoryTrends: TrendInsight[];
  implications: string[];
}

export interface TrendInsight {
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  companyResponse: string[];
  pmConsiderations: string[];
}

export interface PMImplications {
  keySkills: string[];
  frameworksToEmphasize: string[];
  experienceAreas: string[];
  preparationFocus: string[];
  commonChallenges: string[];
  successFactors: string[];
}

export interface InterviewContextData {
  relevantCaseStudies: string[];
  discussionTopics: string[];
  questionAreas: string[];
  exampleScenarios: string[];
  industryContext: string[];
  strategicContext: string[];
}

export class CompanyProductIntelligence {
  private productData: Map<string, ProductIntelligence> = new Map();

  constructor() {
    this.initializeProductIntelligence();
  }

  /**
   * Get comprehensive product intelligence for a company
   */
  getProductIntelligence(companyId: string): ProductIntelligence | undefined {
    return this.productData.get(companyId.toLowerCase());
  }

  /**
   * Analyze product philosophy and extract PM insights
   */
  analyzeProductPhilosophy(
    companyProfile: CompanyProfile
  ): ProductStrategyInsights {
    const philosophy = companyProfile.productPhilosophy;
    
    return {
      coreStrategy: this.extractCoreStrategy(philosophy),
      strategicPillars: this.identifyStrategicPillars(philosophy),
      productPrinciples: philosophy.productPrinciples,
      keyMetrics: philosophy.keyMetrics,
      competitiveAdvantages: philosophy.competitiveAdvantages,
      futureDirection: this.predictFutureDirection(philosophy, companyProfile),
      pmFocus: this.identifyPMFocus(philosophy)
    };
  }

  /**
   * Analyze recent product launches for interview context
   */
  analyzeRecentLaunches(
    companyProfile: CompanyProfile
  ): ProductLaunchAnalysis[] {
    return companyProfile.recentLaunches.map(launch => 
      this.analyzeSingleLaunch(launch, companyProfile)
    );
  }

  /**
   * Generate interview-relevant insights from product data
   */
  generateInterviewContext(
    companyProfile: CompanyProfile
  ): InterviewContextData {
    const productStrategy = this.analyzeProductPhilosophy(companyProfile);
    const launchAnalyses = this.analyzeRecentLaunches(companyProfile);
    
    return {
      relevantCaseStudies: this.generateRelevantCaseStudies(companyProfile),
      discussionTopics: this.generateDiscussionTopics(productStrategy, launchAnalyses),
      questionAreas: this.identifyQuestionAreas(companyProfile),
      exampleScenarios: this.generateExampleScenarios(companyProfile),
      industryContext: this.extractIndustryContext(companyProfile),
      strategicContext: this.extractStrategicContext(productStrategy)
    };
  }

  /**
   * Get PM-specific implications for interview preparation
   */
  getPMImplications(companyProfile: CompanyProfile): PMImplications {
    const philosophy = companyProfile.productPhilosophy;
    const culture = companyProfile.cultureValues;
    
    return {
      keySkills: this.identifyKeySkills(philosophy, culture),
      frameworksToEmphasize: this.identifyRelevantFrameworks(philosophy),
      experienceAreas: this.identifyExperienceAreas(companyProfile),
      preparationFocus: this.identifyPreparationFocus(companyProfile),
      commonChallenges: this.identifyCommonChallenges(companyProfile),
      successFactors: this.identifySuccessFactors(companyProfile)
    };
  }

  /**
   * Update product intelligence with new launch data
   */
  updateProductLaunch(
    companyId: string,
    launch: ProductLaunch
  ): void {
    const intelligence = this.productData.get(companyId.toLowerCase());
    if (intelligence) {
      const analysis = this.analyzeSingleLaunch(launch, { id: companyId } as CompanyProfile);
      intelligence.recentLaunches.push(analysis);
      intelligence.interviewContext = this.updateInterviewContext(intelligence);
    }
  }

  /**
   * Get competitive context for interview discussions
   */
  getCompetitiveContext(companyProfile: CompanyProfile): CompetitiveAnalysis {
    return {
      marketPosition: this.determineMarketPosition(companyProfile),
      keyCompetitors: this.analyzeKeyCompetitors(companyProfile),
      differentiationFactors: companyProfile.productPhilosophy.competitiveAdvantages,
      competitiveThreats: this.identifyCompetitiveThreats(companyProfile),
      marketOpportunities: this.identifyMarketOpportunities(companyProfile),
      strategicResponse: this.analyzeStrategicResponse(companyProfile)
    };
  }

  // Private helper methods
  private initializeProductIntelligence(): void {
    // Initialize with major tech companies
    const companies = ['google', 'amazon', 'meta', 'apple', 'microsoft'];
    
    companies.forEach(companyId => {
      this.productData.set(companyId, this.createBasicProductIntelligence(companyId));
    });
  }

  private createBasicProductIntelligence(companyId: string): ProductIntelligence {
    return {
      companyId,
      productStrategy: {
        coreStrategy: [],
        strategicPillars: [],
        productPrinciples: [],
        keyMetrics: [],
        competitiveAdvantages: [],
        futureDirection: [],
        pmFocus: []
      },
      recentLaunches: [],
      competitivePosition: {
        marketPosition: 'TBD',
        keyCompetitors: [],
        differentiationFactors: [],
        competitiveThreats: [],
        marketOpportunities: [],
        strategicResponse: []
      },
      marketTrends: {
        industryTrends: [],
        technologyTrends: [],
        customerBehaviorTrends: [],
        regulatoryTrends: [],
        implications: []
      },
      pmImplications: {
        keySkills: [],
        frameworksToEmphasize: [],
        experienceAreas: [],
        preparationFocus: [],
        commonChallenges: [],
        successFactors: []
      },
      interviewContext: {
        relevantCaseStudies: [],
        discussionTopics: [],
        questionAreas: [],
        exampleScenarios: [],
        industryContext: [],
        strategicContext: []
      }
    };
  }

  private extractCoreStrategy(philosophy: ProductPhilosophy): string[] {
    const strategy: string[] = [];
    
    // Extract strategy from product principles
    philosophy.productPrinciples.forEach(principle => {
      if (principle.toLowerCase().includes('customer') || principle.toLowerCase().includes('user')) {
        strategy.push('Customer-centric approach');
      }
      if (principle.toLowerCase().includes('data')) {
        strategy.push('Data-driven decisions');
      }
      if (principle.toLowerCase().includes('scale') || principle.toLowerCase().includes('global')) {
        strategy.push('Global scale focus');
      }
    });
    
    return [...new Set(strategy)];
  }

  private identifyStrategicPillars(philosophy: ProductPhilosophy): string[] {
    const pillars: string[] = [];
    
    // Map development methodology to strategic pillars
    switch (philosophy.developmentMethodology) {
      case 'agile':
        pillars.push('Rapid iteration', 'Customer feedback integration');
        break;
      case 'lean':
        pillars.push('Minimum viable products', 'Validated learning');
        break;
      case 'design_thinking':
        pillars.push('Human-centered design', 'Empathy-driven solutions');
        break;
    }
    
    // Add customer focus pillars
    switch (philosophy.customerFocus) {
      case 'b2c':
        pillars.push('Consumer experience', 'Mass market appeal');
        break;
      case 'b2b':
        pillars.push('Enterprise solutions', 'Business value delivery');
        break;
      case 'platform':
        pillars.push('Ecosystem development', 'Developer experience');
        break;
    }
    
    return pillars;
  }

  private predictFutureDirection(
    philosophy: ProductPhilosophy,
    companyProfile: CompanyProfile
  ): string[] {
    const directions: string[] = [];
    
    // Predict based on company tier and industry
    if (companyProfile.tier === 'FAANG') {
      directions.push('AI/ML integration', 'Global expansion', 'Platform consolidation');
    }
    
    // Predict based on industry
    if (companyProfile.industry.includes('AI/ML')) {
      directions.push('Advanced AI capabilities', 'Autonomous systems');
    }
    
    if (companyProfile.industry.includes('Cloud Computing')) {
      directions.push('Edge computing', 'Serverless architecture');
    }
    
    return directions;
  }

  private identifyPMFocus(philosophy: ProductPhilosophy): string[] {
    const focus: string[] = [];
    
    // Map philosophy to PM focus areas
    if (philosophy.productPrinciples.some(p => p.toLowerCase().includes('user'))) {
      focus.push('User research and empathy');
    }
    
    if (philosophy.keyMetrics.length > 0) {
      focus.push('Metrics and analytics');
    }
    
    if (philosophy.developmentMethodology === 'agile') {
      focus.push('Agile product management');
    }
    
    return focus;
  }

  private analyzeSingleLaunch(
    launch: ProductLaunch,
    companyProfile: CompanyProfile
  ): ProductLaunchAnalysis {
    return {
      launch,
      strategicSignificance: this.assessStrategicSignificance(launch, companyProfile),
      pmLessons: this.extractPMLessons(launch),
      interviewRelevance: this.assessInterviewRelevance(launch),
      frameworksApplied: this.identifyFrameworksApplied(launch),
      successFactors: this.identifyLaunchSuccessFactors(launch),
      challengesFaced: this.identifyLaunchChallenges(launch)
    };
  }

  private assessStrategicSignificance(
    launch: ProductLaunch,
    companyProfile: CompanyProfile
  ): string {
    if (launch.businessImpact?.strategicValue) {
      return launch.businessImpact.strategicValue;
    }
    
    // Assess based on category and company focus
    if (companyProfile.industry.includes('AI/ML') && launch.category.includes('AI')) {
      return 'Critical AI strategy advancement';
    }
    
    return 'Strategic product expansion';
  }

  private extractPMLessons(launch: ProductLaunch): string[] {
    const lessons: string[] = [];
    
    if (launch.lessonsLearned) {
      lessons.push(...launch.lessonsLearned);
    }
    
    // Extract lessons from PM involvement
    launch.pmInvolvement.forEach(involvement => {
      if (involvement.includes('strategy')) {
        lessons.push('Strategic product planning importance');
      }
      if (involvement.includes('user experience')) {
        lessons.push('User-centric design critical for success');
      }
    });
    
    return lessons;
  }

  private assessInterviewRelevance(launch: ProductLaunch): string[] {
    const relevance: string[] = [];
    
    relevance.push(`Recent ${launch.category} launch demonstrates company priorities`);
    relevance.push(`PM role in ${launch.name} launch showcases expected responsibilities`);
    
    if (launch.businessImpact) {
      relevance.push('Business impact measurement and tracking');
    }
    
    return relevance;
  }

  private identifyFrameworksApplied(launch: ProductLaunch): string[] {
    const frameworks: string[] = [];
    
    // Infer frameworks from PM involvement
    launch.pmInvolvement.forEach(involvement => {
      if (involvement.includes('strategy')) {
        frameworks.push('Strategic planning frameworks');
      }
      if (involvement.includes('user experience')) {
        frameworks.push('Design thinking', 'User journey mapping');
      }
      if (involvement.includes('market')) {
        frameworks.push('Go-to-market strategy', 'Market analysis');
      }
    });
    
    return frameworks;
  }

  private identifyLaunchSuccessFactors(launch: ProductLaunch): string[] {
    const factors: string[] = [];
    
    if (launch.keyFeatures.length > 0) {
      factors.push('Clear feature differentiation');
    }
    
    if (launch.targetMarket.length > 0) {
      factors.push('Well-defined target market');
    }
    
    if (launch.businessImpact) {
      factors.push('Measurable business impact');
    }
    
    return factors;
  }

  private identifyLaunchChallenges(launch: ProductLaunch): string[] {
    // Common launch challenges based on category and market
    const challenges: string[] = [];
    
    if (launch.category.includes('AI')) {
      challenges.push('AI ethics and safety considerations', 'User trust and adoption');
    }
    
    if (launch.targetMarket.includes('Enterprise')) {
      challenges.push('Enterprise sales cycle', 'Integration complexity');
    }
    
    return challenges;
  }

  private generateRelevantCaseStudies(companyProfile: CompanyProfile): string[] {
    const caseStudies: string[] = [];
    
    // Generate based on company industry
    companyProfile.industry.forEach(industry => {
      switch (industry) {
        case 'Search':
          caseStudies.push('Improve search relevance for mobile users');
          break;
        case 'E-commerce':
          caseStudies.push('Design checkout flow for international markets');
          break;
        case 'Social Media':
          caseStudies.push('Increase user engagement on platform');
          break;
        case 'Cloud Computing':
          caseStudies.push('Launch new cloud service for developers');
          break;
      }
    });
    
    return caseStudies;
  }

  private generateDiscussionTopics(
    productStrategy: ProductStrategyInsights,
    launchAnalyses: ProductLaunchAnalysis[]
  ): string[] {
    const topics: string[] = [];
    
    // Add strategy-based topics
    productStrategy.strategicPillars.forEach(pillar => {
      topics.push(`How ${pillar} influences product decisions`);
    });
    
    // Add launch-based topics
    launchAnalyses.forEach(analysis => {
      topics.push(`Lessons from ${analysis.launch.name} launch`);
    });
    
    return topics;
  }

  private identifyQuestionAreas(companyProfile: CompanyProfile): string[] {
    const areas: string[] = [];
    
    // Add based on product philosophy
    if (companyProfile.productPhilosophy.customerFocus === 'b2c') {
      areas.push('Consumer product design', 'User experience optimization');
    }
    
    if (companyProfile.productPhilosophy.customerFocus === 'b2b') {
      areas.push('Enterprise product strategy', 'B2B go-to-market');
    }
    
    return areas;
  }

  private generateExampleScenarios(companyProfile: CompanyProfile): string[] {
    const scenarios: string[] = [];
    
    // Generate based on recent launches
    companyProfile.recentLaunches.forEach(launch => {
      scenarios.push(`How would you have approached the ${launch.name} launch differently?`);
    });
    
    return scenarios;
  }

  private extractIndustryContext(companyProfile: CompanyProfile): string[] {
    return companyProfile.industry.map(industry => 
      `Current trends and challenges in ${industry}`
    );
  }

  private extractStrategicContext(productStrategy: ProductStrategyInsights): string[] {
    return productStrategy.coreStrategy.map(strategy =>
      `Strategic implications of ${strategy}`
    );
  }

  private updateInterviewContext(intelligence: ProductIntelligence): InterviewContextData {
    // Update interview context based on new data
    return intelligence.interviewContext; // Simplified for now
  }

  private determineMarketPosition(companyProfile: CompanyProfile): string {
    switch (companyProfile.tier) {
      case 'FAANG':
        return 'Market leader';
      case 'Big Tech':
        return 'Major player';
      case 'Unicorn':
        return 'Emerging leader';
      default:
        return 'Growing company';
    }
  }

  private analyzeKeyCompetitors(companyProfile: CompanyProfile): CompetitorInsight[] {
    // Simplified competitor analysis
    return [];
  }

  private identifyCompetitiveThreats(companyProfile: CompanyProfile): string[] {
    const threats: string[] = [];
    
    if (companyProfile.industry.includes('AI/ML')) {
      threats.push('AI disruption from new entrants');
    }
    
    return threats;
  }

  private identifyMarketOpportunities(companyProfile: CompanyProfile): string[] {
    const opportunities: string[] = [];
    
    companyProfile.industry.forEach(industry => {
      if (industry === 'AI/ML') {
        opportunities.push('Enterprise AI adoption', 'AI democratization');
      }
    });
    
    return opportunities;
  }

  private analyzeStrategicResponse(companyProfile: CompanyProfile): string[] {
    return companyProfile.productPhilosophy.productStrategy;
  }

  private identifyKeySkills(
    philosophy: ProductPhilosophy,
    culture: any
  ): string[] {
    const skills: string[] = [];
    
    if (philosophy.developmentMethodology === 'agile') {
      skills.push('Agile product management');
    }
    
    if (philosophy.keyMetrics.length > 0) {
      skills.push('Analytics and metrics');
    }
    
    return skills;
  }

  private identifyRelevantFrameworks(philosophy: ProductPhilosophy): string[] {
    const frameworks: string[] = [];
    
    switch (philosophy.developmentMethodology) {
      case 'agile':
        frameworks.push('Scrum', 'Kanban');
        break;
      case 'lean':
        frameworks.push('Lean Startup', 'Build-Measure-Learn');
        break;
      case 'design_thinking':
        frameworks.push('Design Thinking', 'Human-Centered Design');
        break;
    }
    
    return frameworks;
  }

  private identifyExperienceAreas(companyProfile: CompanyProfile): string[] {
    return companyProfile.industry.map(industry => 
      `${industry} product experience`
    );
  }

  private identifyPreparationFocus(companyProfile: CompanyProfile): string[] {
    const focus: string[] = [];
    
    focus.push(`Study ${companyProfile.name}'s product portfolio`);
    focus.push(`Understand ${companyProfile.name}'s competitive landscape`);
    
    return focus;
  }

  private identifyCommonChallenges(companyProfile: CompanyProfile): string[] {
    const challenges: string[] = [];
    
    if (companyProfile.tier === 'FAANG') {
      challenges.push('Scale and complexity management');
    }
    
    return challenges;
  }

  private identifySuccessFactors(companyProfile: CompanyProfile): string[] {
    return companyProfile.productPhilosophy.competitiveAdvantages;
  }
}

export default CompanyProductIntelligence;