/**
 * MCP Tool: get_company_interview_insights
 * 
 * Provides company-specific interview preparation insights including interview patterns,
 * culture values, evaluation criteria, and recent product launches for targeted preparation.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { CompanyProfileDatabaseImpl } from '../../components/company-profile-database/index';
import { CompanyInsightsProvider } from '../../components/company-insights-provider/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface GetCompanyInterviewInsightsArgs {
  company_name: string;
  insight_type?: 'overview' | 'interview_process' | 'culture_values' | 'product_philosophy' | 'recent_launches' | 'evaluation_criteria';
  role_level?: 'APM' | 'PM' | 'Senior PM';
  include_tips?: boolean;
  include_recent_changes?: boolean;
}

/**
 * Get comprehensive company-specific interview preparation insights
 */
export async function getCompanyInterviewInsights(
  args: GetCompanyInterviewInsightsArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Getting company interview insights', context, {
      companyName: args.company_name,
      insightType: args.insight_type,
      roleLevel: args.role_level,
      includeTips: args.include_tips,
      includeRecentChanges: args.include_recent_changes
    });

    // Initialize company database and insights provider
    const companyDatabase = new CompanyProfileDatabaseImpl();
    const insightsProvider = new CompanyInsightsProvider();

    // Get company profile
    const companyProfile = companyDatabase.getCompanyByName(args.company_name);
    if (!companyProfile) {
      throw new Error(`Company profile not found for: ${args.company_name}. Available companies: ${companyDatabase.getAllCompanies().map(c => c.name).join(', ')}`);
    }

    // Get enhanced insights
    const enhancedInsights = insightsProvider.getComprehensiveInsights({
      companyId: companyProfile.id,
      timeframe: args.include_recent_changes ? 'immediate' : 'long_term',
      roleLevel: args.role_level,
      focusAreas: args.insight_type ? [args.insight_type] : undefined
    });

    MCPLogger.info('Company interview insights retrieved successfully', context, {
      companyName: companyProfile.name,
      companyTier: companyProfile.tier,
      insightType: args.insight_type || 'comprehensive',
      interviewRounds: companyProfile.interviewProcess.totalRounds,
      cultureValuesCount: companyProfile.cultureValues.coreValues.length,
      recentLaunchesCount: companyProfile.recentLaunches.length,
      dataFreshness: companyProfile.dataFreshness
    });

    // Build comprehensive insights response
    const response: any = {
      company: {
        name: companyProfile.name,
        tier: companyProfile.tier,
        size: companyProfile.size,
        industry: companyProfile.industry,
        headquarters: companyProfile.headquarters,
        founded: companyProfile.founded,
        employeeCount: companyProfile.employeeCount
      },
      dataFreshness: {
        score: companyProfile.dataFreshness,
        lastUpdated: companyProfile.lastUpdated,
        sources: companyProfile.sources
      }
    };

    // Add specific insights based on request type
    if (!args.insight_type || args.insight_type === 'overview') {
      response.overview = {
        interviewDifficulty: getInterviewDifficulty(companyProfile),
        passRate: companyProfile.interviewProcess.passRate,
        averageDuration: companyProfile.interviewProcess.averageDuration,
        keyFocusAreas: getKeyFocusAreas(companyProfile),
        preparationTime: getRecommendedPrepTime(companyProfile),
        uniqueAspects: companyProfile.interviewProcess.uniqueAspects
      };
    }

    if (!args.insight_type || args.insight_type === 'interview_process') {
      response.interviewProcess = {
        totalRounds: companyProfile.interviewProcess.totalRounds,
        averageDuration: companyProfile.interviewProcess.averageDuration,
        passRate: companyProfile.interviewProcess.passRate,
        rounds: companyProfile.interviewProcess.rounds.map(round => ({
          roundNumber: round.roundNumber,
          name: round.name,
          type: round.type,
          duration: round.duration,
          interviewers: round.interviewers,
          focus: round.focus,
          evaluationWeight: round.evaluationWeight,
          commonQuestions: round.commonQuestions.slice(0, 3), // Limit examples
          preparationTips: generateRoundPreparationTips(round, companyProfile)
        })),
        commonFeedback: companyProfile.interviewProcess.commonFeedback,
        uniqueAspects: companyProfile.interviewProcess.uniqueAspects
      };
    }

    if (!args.insight_type || args.insight_type === 'culture_values') {
      response.cultureValues = {
        coreValues: companyProfile.cultureValues.coreValues,
        leadershipPrinciples: companyProfile.cultureValues.leadershipPrinciples || [],
        culturalTraits: companyProfile.cultureValues.culturalTraits,
        workStyle: companyProfile.cultureValues.workStyle,
        decisionMaking: companyProfile.cultureValues.decisionMaking,
        riskTolerance: companyProfile.cultureValues.riskTolerance,
        innovationApproach: companyProfile.cultureValues.innovationApproach,
        interviewApplication: generateCultureInterviewTips(companyProfile.cultureValues)
      };
    }

    if (!args.insight_type || args.insight_type === 'product_philosophy') {
      response.productPhilosophy = {
        productPrinciples: companyProfile.productPhilosophy.productPrinciples,
        designPhilosophy: companyProfile.productPhilosophy.designPhilosophy,
        developmentMethodology: companyProfile.productPhilosophy.developmentMethodology,
        customerFocus: companyProfile.productPhilosophy.customerFocus,
        productStrategy: companyProfile.productPhilosophy.productStrategy,
        keyMetrics: companyProfile.productPhilosophy.keyMetrics,
        competitiveAdvantages: companyProfile.productPhilosophy.competitiveAdvantages,
        interviewApplication: generateProductPhilosophyTips(companyProfile.productPhilosophy)
      };
    }

    if (!args.insight_type || args.insight_type === 'recent_launches') {
      response.recentLaunches = companyProfile.recentLaunches.map(launch => ({
        name: launch.name,
        launchDate: launch.launchDate,
        category: launch.category,
        description: launch.description,
        targetMarket: launch.targetMarket,
        keyFeatures: launch.keyFeatures.slice(0, 5), // Limit features
        businessImpact: launch.businessImpact,
        pmInvolvement: launch.pmInvolvement,
        interviewRelevance: generateLaunchInterviewRelevance(launch)
      }));
    }

    if (!args.insight_type || args.insight_type === 'evaluation_criteria') {
      response.evaluationCriteria = {
        questionWeighting: companyProfile.questionWeighting,
        primaryCriteria: companyProfile.evaluationCriteria.primaryCriteria.map(criteria => ({
          name: criteria.name,
          description: criteria.description,
          weight: criteria.weight,
          evaluationMethod: criteria.evaluationMethod,
          positiveSignals: criteria.commonSignals.positive,
          negativeSignals: criteria.commonSignals.negative,
          preparationTips: generateCriteriaPreparationTips(criteria)
        })),
        secondaryCriteria: companyProfile.evaluationCriteria.secondaryCriteria.map(criteria => ({
          name: criteria.name,
          description: criteria.description,
          weight: criteria.weight,
          evaluationMethod: criteria.evaluationMethod,
          positiveSignals: criteria.commonSignals.positive,
          negativeSignals: criteria.commonSignals.negative
        })),
        dealBreakers: companyProfile.evaluationCriteria.dealBreakers,
        differentiators: companyProfile.evaluationCriteria.differentiators,
        feedbackStyle: companyProfile.evaluationCriteria.feedbackStyle
      };
    }

    // Add interview patterns if available
    if (companyProfile.interviewPatterns.length > 0) {
      response.interviewPatterns = companyProfile.interviewPatterns.map(pattern => ({
        name: pattern.name,
        description: pattern.description,
        frequency: pattern.frequency,
        questionTypes: pattern.questionTypes,
        expectedFrameworks: pattern.expectedFrameworks,
        commonMistakes: pattern.commonMistakes,
        successFactors: pattern.successFactors,
        exampleQuestions: pattern.exampleQuestions.slice(0, 2) // Limit examples
      }));
    }

    // Add preparation tips if requested
    if (args.include_tips) {
      response.preparationTips = {
        immediate: generateImmediatePreparationTips(companyProfile, args.role_level),
        shortTerm: generateShortTermPreparationTips(companyProfile, args.role_level),
        longTerm: generateLongTermPreparationTips(companyProfile, args.role_level),
        companySpecific: generateCompanySpecificTips(companyProfile),
        commonMistakes: generateCommonMistakesToAvoid(companyProfile),
        successStrategies: generateSuccessStrategies(companyProfile)
      };
    }

    // Add enhanced insights if available
    if (enhancedInsights) {
      response.enhancedInsights = {
        marketPosition: enhancedInsights.companyOverview.marketPosition.position,
        competitiveAdvantages: enhancedInsights.companyOverview.marketPosition.competitiveAdvantages,
        recentNews: enhancedInsights.recentDevelopments.productLaunches.slice(0, 3).map(launch => launch.productName), // Limit news items
        industryTrends: enhancedInsights.companyOverview.basicInfo.industry,
        talentStrategy: enhancedInsights.companyOverview.keyDifferentiators,
        interviewTrends: enhancedInsights.interviewIntelligence.processOverview.recentChanges
      };
    }

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 2,
      companyAnalyzed: companyProfile.name,
      insightType: args.insight_type || 'comprehensive',
      dataFreshness: companyProfile.dataFreshness,
      enhancedInsightsIncluded: !!enhancedInsights,
      nextAction: 'Use insights for targeted interview preparation'
    });

  } catch (error) {
    MCPLogger.error('get_company_interview_insights tool failed', error as Error, context, {
      companyName: args.company_name,
      insightType: args.insight_type
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in get_company_interview_insights'),
      context
    );
  }
}

// Helper functions for generating insights
function getInterviewDifficulty(profile: any): string {
  if (profile.interviewProcess.passRate <= 0.1) return 'Very High';
  if (profile.interviewProcess.passRate <= 0.15) return 'High';
  if (profile.interviewProcess.passRate <= 0.25) return 'Moderate-High';
  if (profile.interviewProcess.passRate <= 0.35) return 'Moderate';
  return 'Moderate-Low';
}

function getKeyFocusAreas(profile: any): string[] {
  const focusAreas: string[] = [];
  
  // Based on question weighting
  const weights = profile.questionWeighting;
  if (weights.behavioral >= 0.3) focusAreas.push('Behavioral/Leadership');
  if (weights.productSense >= 0.25) focusAreas.push('Product Sense');
  if (weights.analytical >= 0.2) focusAreas.push('Analytical Thinking');
  if (weights.technical >= 0.15) focusAreas.push('Technical Understanding');
  
  // Based on culture
  if (profile.cultureValues.leadershipPrinciples?.length > 10) {
    focusAreas.push('Leadership Principles');
  }
  
  return focusAreas;
}

function getRecommendedPrepTime(profile: any): string {
  const difficulty = getInterviewDifficulty(profile);
  const rounds = profile.interviewProcess.totalRounds;
  
  if (difficulty === 'Very High' || rounds >= 6) return '6-8 weeks';
  if (difficulty === 'High' || rounds >= 5) return '4-6 weeks';
  if (difficulty === 'Moderate-High' || rounds >= 4) return '3-4 weeks';
  return '2-3 weeks';
}

function generateRoundPreparationTips(round: any, profile: any): string[] {
  const tips: string[] = [];
  
  switch (round.type) {
    case 'phone_screen':
      tips.push('Prepare elevator pitch and key examples');
      tips.push('Practice clear communication over phone');
      break;
    case 'case_study':
      tips.push('Master relevant frameworks for this focus area');
      tips.push('Practice structured problem-solving');
      break;
    case 'behavioral':
      tips.push('Prepare STAR method examples');
      if (profile.cultureValues.leadershipPrinciples) {
        tips.push('Map examples to leadership principles');
      }
      break;
    case 'technical':
      tips.push('Review technical concepts relevant to PM role');
      tips.push('Practice explaining technical concepts simply');
      break;
  }
  
  // Add focus-specific tips
  round.focus.forEach((focus: string) => {
    switch (focus.toLowerCase()) {
      case 'product sense':
        tips.push('Practice product design and user empathy');
        break;
      case 'analytical thinking':
        tips.push('Prepare for metrics and data analysis questions');
        break;
      case 'leadership':
        tips.push('Prepare examples of influence without authority');
        break;
    }
  });
  
  return [...new Set(tips)]; // Remove duplicates
}

function generateCultureInterviewTips(cultureValues: any): string[] {
  const tips: string[] = [];
  
  tips.push('Prepare examples that demonstrate core values alignment');
  tips.push(`Emphasize ${cultureValues.workStyle} working style in examples`);
  tips.push(`Show ${cultureValues.decisionMaking} decision-making approach`);
  
  if (cultureValues.leadershipPrinciples?.length > 0) {
    tips.push('Map your examples to specific leadership principles');
    tips.push('Use the leadership principles as response structure');
  }
  
  return tips;
}

function generateProductPhilosophyTips(productPhilosophy: any): string[] {
  const tips: string[] = [];
  
  tips.push('Align your product thinking with company principles');
  tips.push(`Emphasize ${productPhilosophy.customerFocus} focus in responses`);
  tips.push('Reference company\'s key metrics in your analysis');
  
  productPhilosophy.competitiveAdvantages.forEach((advantage: string) => {
    tips.push(`Understand and reference ${advantage} in product discussions`);
  });
  
  return tips;
}

function generateLaunchInterviewRelevance(launch: any): string[] {
  const relevance: string[] = [];
  
  relevance.push(`Study ${launch.name} as example of company product strategy`);
  relevance.push('Understand the PM role in this launch');
  relevance.push('Be prepared to discuss similar product challenges');
  
  if (launch.businessImpact?.strategicValue) {
    relevance.push(`Understand strategic importance: ${launch.businessImpact.strategicValue}`);
  }
  
  return relevance;
}

function generateCriteriaPreparationTips(criteria: any): string[] {
  const tips: string[] = [];
  
  tips.push(`Focus ${Math.round(criteria.weight * 100)}% of preparation on ${criteria.name}`);
  tips.push(`Evaluation method: ${criteria.evaluationMethod}`);
  
  criteria.positiveSignals.forEach((signal: string) => {
    tips.push(`Demonstrate: ${signal}`);
  });
  
  criteria.negativeSignals.forEach((signal: string) => {
    tips.push(`Avoid: ${signal}`);
  });
  
  return tips;
}

function generateImmediatePreparationTips(profile: any, roleLevel?: string): string[] {
  const tips: string[] = [];
  
  tips.push(`Research ${profile.name} recent news and product launches`);
  tips.push('Review company mission, values, and culture');
  tips.push('Understand the interview process and timeline');
  
  if (profile.cultureValues.leadershipPrinciples?.length > 0) {
    tips.push('Study leadership principles and prepare examples');
  }
  
  return tips;
}

function generateShortTermPreparationTips(profile: any, roleLevel?: string): string[] {
  const tips: string[] = [];
  
  tips.push('Practice company-specific case studies');
  tips.push('Mock interviews with company focus');
  tips.push('Deep dive into company product portfolio');
  tips.push('Network with current employees if possible');
  
  return tips;
}

function generateLongTermPreparationTips(profile: any, roleLevel?: string): string[] {
  const tips: string[] = [];
  
  tips.push('Build expertise in company\'s key focus areas');
  tips.push('Develop portfolio projects relevant to company');
  tips.push('Follow company thought leaders and publications');
  tips.push('Understand industry trends affecting the company');
  
  return tips;
}

function generateCompanySpecificTips(profile: any): string[] {
  const tips: string[] = [];
  
  switch (profile.name.toLowerCase()) {
    case 'google':
      tips.push('Focus on user-centric solutions and scale thinking');
      tips.push('Demonstrate technical depth and innovation');
      tips.push('Practice Googleyness behavioral questions');
      break;
    case 'amazon':
      tips.push('Master all 14 Leadership Principles with examples');
      tips.push('Practice Working Backwards methodology');
      tips.push('Emphasize customer obsession in all responses');
      break;
    case 'meta':
      tips.push('Focus on growth, engagement, and community building');
      tips.push('Understand social product challenges');
      tips.push('Demonstrate global scale thinking');
      break;
    default:
      tips.push('Study company-specific frameworks and methodologies');
      tips.push('Understand unique aspects of company culture');
  }
  
  return tips;
}

function generateCommonMistakesToAvoid(profile: any): string[] {
  const mistakes: string[] = [];
  
  mistakes.push('Not researching company thoroughly');
  mistakes.push('Generic responses without company context');
  mistakes.push('Ignoring company values in examples');
  
  if (profile.evaluationCriteria.dealBreakers) {
    profile.evaluationCriteria.dealBreakers.forEach((dealBreaker: string) => {
      mistakes.push(`Avoid: ${dealBreaker}`);
    });
  }
  
  return mistakes;
}

function generateSuccessStrategies(profile: any): string[] {
  const strategies: string[] = [];
  
  strategies.push('Align all responses with company values');
  strategies.push('Use company-specific terminology and frameworks');
  strategies.push('Reference recent company initiatives');
  
  if (profile.evaluationCriteria.differentiators) {
    profile.evaluationCriteria.differentiators.forEach((differentiator: string) => {
      strategies.push(`Highlight: ${differentiator}`);
    });
  }
  
  return strategies;
}

/**
 * Input schema for get_company_interview_insights tool
 */
export const getCompanyInterviewInsightsSchema = {
  type: 'object',
  properties: {
    company_name: {
      type: 'string',
      description: 'Name of the target company for interview preparation',
      examples: ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Salesforce']
    },
    insight_type: {
      type: 'string',
      enum: ['overview', 'interview_process', 'culture_values', 'product_philosophy', 'recent_launches', 'evaluation_criteria'],
      description: 'Specific type of insights to retrieve (default: comprehensive overview)'
    },
    role_level: {
      type: 'string',
      enum: ['APM', 'PM', 'Senior PM'],
      description: 'Target role level for tailored insights (optional)'
    },
    include_tips: {
      type: 'boolean',
      description: 'Include detailed preparation tips and strategies (default: true)',
      default: true
    },
    include_recent_changes: {
      type: 'boolean',
      description: 'Include recent changes and updates to interview process (default: true)',
      default: true
    }
  },
  required: ['company_name'],
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const getCompanyInterviewInsightsDescription = 
  'Provides comprehensive company-specific interview preparation insights including interview process, culture values, product philosophy, recent launches, and evaluation criteria. Offers targeted preparation tips and strategies for major tech companies with real-time updates.';