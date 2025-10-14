/**
 * Company-Specific Customization Engine Component
 * 
 * Provides feedback customization based on company values, question weighting,
 * focus areas, and company insights for interview preparation context.
 */

import {
  CompanyProfile,
  CompanyCustomizationConfig,
  CompanySpecificFeedback,
  CompanyInsights,
  InterviewTip,
  CompanyQuestion
} from '../../models/company-profiles';
import { 
  ResponseEvaluation, 
  InterviewQuestion, 
  QuestionCategory,
  RoleLevel,
  PMFramework 
} from '../../models/interview';
import CompanyProfileDatabaseImpl from '../company-profile-database';
import CompanyCultureIntegrator from '../company-culture-integrator';

export interface CustomizationContext {
  companyId: string;
  roleLevel: RoleLevel;
  userProfile?: UserProfile;
  sessionHistory?: SessionHistory;
  weaknessAreas?: string[];
  preparationGoals?: string[];
}

export interface UserProfile {
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industryBackground: string[];
  previousCompanies?: string[];
  skillStrengths: string[];
  skillWeaknesses: string[];
  interviewHistory?: InterviewAttempt[];
}

export interface SessionHistory {
  totalSessions: number;
  averageScore: number;
  categoryPerformance: Record<QuestionCategory, number>;
  frameworkProficiency: Record<PMFramework, number>;
  improvementTrends: TrendData[];
}

export interface InterviewAttempt {
  companyId: string;
  date: Date;
  outcome: 'passed' | 'failed' | 'pending';
  feedback?: string[];
  lessonsLearned?: string[];
}

export interface TrendData {
  metric: string;
  values: number[];
  timestamps: Date[];
  trend: 'improving' | 'declining' | 'stable';
}

export interface CustomizedPreparation {
  focusAreas: FocusArea[];
  questionSelection: QuestionSelectionStrategy;
  feedbackCustomization: FeedbackCustomization;
  preparationPlan: PreparationPlan;
  companyInsights: CompanySpecificInsights;
}

export interface FocusArea {
  area: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  recommendedTime: number; // minutes
  practiceQuestions: string[];
  frameworks: PMFramework[];
  successMetrics: string[];
}

export interface QuestionSelectionStrategy {
  categoryWeights: Record<QuestionCategory, number>;
  difficultyProgression: DifficultyProgression;
  companySpecificQuestions: CompanyQuestion[];
  avoidancePatterns: string[];
  adaptiveAdjustments: AdaptiveAdjustment[];
}

export interface DifficultyProgression {
  startingDifficulty: number;
  targetDifficulty: number;
  progressionRate: number;
  adaptToPerformance: boolean;
}

export interface AdaptiveAdjustment {
  trigger: 'low_score' | 'high_score' | 'repeated_mistakes' | 'time_pressure';
  adjustment: 'increase_difficulty' | 'decrease_difficulty' | 'change_focus' | 'add_hints';
  threshold: number;
}

export interface FeedbackCustomization {
  style: 'direct' | 'diplomatic' | 'coaching' | 'structured' | 'conversational';
  culturalEmphasis: string[];
  valueAlignment: ValueAlignmentFeedback;
  improvementFocus: ImprovementFocus;
  motivationalElements: MotivationalElement[];
}

export interface ValueAlignmentFeedback {
  coreValues: string[];
  leadershipPrinciples?: string[];
  culturalTraits: string[];
  workStyleAlignment: string[];
  decisionMakingAlignment: string[];
}

export interface ImprovementFocus {
  primaryAreas: string[];
  secondaryAreas: string[];
  frameworkGaps: PMFramework[];
  communicationStyle: string[];
  strategicThinking: string[];
}

export interface MotivationalElement {
  type: 'encouragement' | 'challenge' | 'progress_highlight' | 'goal_reminder';
  message: string;
  trigger: 'low_confidence' | 'high_performance' | 'milestone_reached' | 'session_start';
}

export interface PreparationPlan {
  totalDuration: number; // days
  dailyTimeCommitment: number; // minutes
  phases: PreparationPhase[];
  milestones: Milestone[];
  resources: Resource[];
}

export interface PreparationPhase {
  name: string;
  duration: number; // days
  objectives: string[];
  activities: Activity[];
  successCriteria: string[];
}

export interface Activity {
  type: 'study' | 'practice' | 'mock_interview' | 'case_study' | 'reflection';
  description: string;
  timeRequired: number; // minutes
  resources: string[];
  deliverables: string[];
}

export interface Milestone {
  name: string;
  targetDate: Date;
  criteria: string[];
  reward?: string;
}

export interface Resource {
  type: 'article' | 'video' | 'book' | 'course' | 'practice_set';
  title: string;
  url?: string;
  description: string;
  estimatedTime: number; // minutes
  priority: 'high' | 'medium' | 'low';
}

export interface CompanySpecificInsights {
  interviewTips: InterviewTip[];
  commonPitfalls: string[];
  successStories: string[];
  recentChanges: string[];
  competitiveContext: string[];
  industryTrends: string[];
}

export class CompanyCustomizationEngine {
  private companyDatabase: CompanyProfileDatabaseImpl;
  private cultureIntegrator: CompanyCultureIntegrator;

  constructor() {
    this.companyDatabase = new CompanyProfileDatabaseImpl();
    this.cultureIntegrator = new CompanyCultureIntegrator();
  }

  /**
   * Generate comprehensive customized preparation plan
   */
  generateCustomizedPreparation(
    context: CustomizationContext
  ): CustomizedPreparation {
    const companyProfile = this.companyDatabase.getCompanyProfile(context.companyId);
    if (!companyProfile) {
      throw new Error(`Company profile not found: ${context.companyId}`);
    }

    const focusAreas = this.determineFocusAreas(companyProfile, context);
    const questionSelection = this.createQuestionSelectionStrategy(companyProfile, context);
    const feedbackCustomization = this.createFeedbackCustomization(companyProfile, context);
    const preparationPlan = this.createPreparationPlan(companyProfile, context, focusAreas);
    const companyInsights = this.generateCompanyInsights(companyProfile, context);

    return {
      focusAreas,
      questionSelection,
      feedbackCustomization,
      preparationPlan,
      companyInsights
    };
  }

  /**
   * Customize feedback based on company values and culture
   */
  customizeFeedback(
    standardEvaluation: ResponseEvaluation,
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): CompanySpecificFeedback {
    const cultureAlignment = this.cultureIntegrator.analyzeCultureAlignment(
      '', // response text would be passed here
      standardEvaluation,
      companyProfile
    );

    const cultureBasedFeedback = this.cultureIntegrator.generateCultureBasedFeedback(
      standardEvaluation,
      cultureAlignment,
      companyProfile
    );

    return {
      companyId: companyProfile.id,
      standardFeedback: standardEvaluation.improvements.join('. '),
      companyCustomization: {
        cultureAlignment: cultureBasedFeedback.cultureSpecificFeedback,
        valueAlignment: cultureBasedFeedback.valueAlignmentFeedback,
        productThinking: this.generateProductThinkingFeedback(companyProfile, standardEvaluation),
        leadershipStyle: this.generateLeadershipFeedback(companyProfile, standardEvaluation),
        communicationStyle: this.generateCommunicationFeedback(companyProfile, standardEvaluation)
      },
      improvementSuggestions: this.generateCustomizedImprovements(companyProfile, standardEvaluation, context),
      companySpecificTips: this.generateCompanySpecificTips(companyProfile, context)
    };
  }

  /**
   * Adjust question weighting based on company priorities
   */
  getCustomizedQuestionWeighting(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): Record<QuestionCategory, number> {
    const baseWeights = companyProfile.questionWeighting;
    const adjustedWeights: Record<QuestionCategory, number> = {
      behavioral: baseWeights.behavioral,
      product_sense: baseWeights.productSense,
      analytical: baseWeights.analytical,
      technical: baseWeights.technical
    };

    // Adjust based on user weaknesses
    if (context.weaknessAreas) {
      context.weaknessAreas.forEach(weakness => {
        const category = this.mapWeaknessToCategory(weakness);
        if (category && adjustedWeights[category] !== undefined) {
          adjustedWeights[category] += 0.1; // Increase focus on weak areas
        }
      });
    }

    // Adjust based on role level
    if (context.roleLevel === 'Senior PM') {
      adjustedWeights.behavioral += 0.1; // Leadership through behavioral questions
    } else if (context.roleLevel === 'APM') {
      adjustedWeights.product_sense += 0.1;
      adjustedWeights.analytical += 0.1;
    }

    // Normalize weights to sum to 1
    const total = Object.values(adjustedWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(adjustedWeights).forEach(key => {
      adjustedWeights[key as QuestionCategory] /= total;
    });

    return adjustedWeights;
  }

  /**
   * Generate company-specific interview insights
   */
  generateCompanyInsights(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): CompanySpecificInsights {
    return {
      interviewTips: this.generateInterviewTips(companyProfile, context),
      commonPitfalls: this.identifyCommonPitfalls(companyProfile),
      successStories: this.generateSuccessStories(companyProfile, context),
      recentChanges: this.identifyRecentChanges(companyProfile),
      competitiveContext: this.generateCompetitiveContext(companyProfile),
      industryTrends: this.generateIndustryTrends(companyProfile)
    };
  }

  /**
   * Create adaptive question selection strategy
   */
  createQuestionSelectionStrategy(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): QuestionSelectionStrategy {
    const categoryWeights = this.getCustomizedQuestionWeighting(companyProfile, context);
    
    return {
      categoryWeights,
      difficultyProgression: {
        startingDifficulty: this.determineStartingDifficulty(context),
        targetDifficulty: this.determineTargetDifficulty(context),
        progressionRate: 0.2,
        adaptToPerformance: true
      },
      companySpecificQuestions: this.getCompanySpecificQuestions(companyProfile),
      avoidancePatterns: this.identifyAvoidancePatterns(context),
      adaptiveAdjustments: [
        {
          trigger: 'low_score',
          adjustment: 'decrease_difficulty',
          threshold: 0.6
        },
        {
          trigger: 'high_score',
          adjustment: 'increase_difficulty',
          threshold: 0.85
        }
      ]
    };
  }

  // Private helper methods
  private determineFocusAreas(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): FocusArea[] {
    const focusAreas: FocusArea[] = [];

    // Add company-specific focus areas
    companyProfile.evaluationCriteria.primaryCriteria.forEach(criterion => {
      if (criterion.weight > 0.2) {
        focusAreas.push({
          area: criterion.name,
          priority: 'high',
          rationale: `${companyProfile.name} heavily weights ${criterion.name} (${Math.round(criterion.weight * 100)}%)`,
          recommendedTime: Math.round(criterion.weight * 120), // minutes
          practiceQuestions: this.generatePracticeQuestions(criterion.name),
          frameworks: this.mapCriterionToFrameworks(criterion.name),
          successMetrics: [`Score above ${Math.round(criterion.weight * 5)} in ${criterion.name}`]
        });
      }
    });

    // Add user weakness areas
    if (context.weaknessAreas) {
      context.weaknessAreas.forEach(weakness => {
        focusAreas.push({
          area: weakness,
          priority: 'high',
          rationale: 'Identified as user weakness area',
          recommendedTime: 90,
          practiceQuestions: this.generatePracticeQuestions(weakness),
          frameworks: this.mapWeaknessToFrameworks(weakness),
          successMetrics: [`Improve ${weakness} score by 20%`]
        });
      });
    }

    return focusAreas;
  }

  private createFeedbackCustomization(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): FeedbackCustomization {
    return {
      style: companyProfile.evaluationCriteria.feedbackStyle,
      culturalEmphasis: this.identifyCulturalEmphasis(companyProfile),
      valueAlignment: {
        coreValues: companyProfile.cultureValues.coreValues,
        leadershipPrinciples: companyProfile.cultureValues.leadershipPrinciples,
        culturalTraits: companyProfile.cultureValues.culturalTraits,
        workStyleAlignment: [companyProfile.cultureValues.workStyle],
        decisionMakingAlignment: [companyProfile.cultureValues.decisionMaking]
      },
      improvementFocus: {
        primaryAreas: context.weaknessAreas || [],
        secondaryAreas: this.identifySecondaryAreas(companyProfile),
        frameworkGaps: this.identifyFrameworkGaps(context),
        communicationStyle: this.identifyCommunicationImprovements(companyProfile),
        strategicThinking: this.identifyStrategicThinkingAreas(companyProfile)
      },
      motivationalElements: this.createMotivationalElements(companyProfile, context)
    };
  }

  private createPreparationPlan(
    companyProfile: CompanyProfile,
    context: CustomizationContext,
    focusAreas: FocusArea[]
  ): PreparationPlan {
    const totalDuration = this.calculatePreparationDuration(context);
    
    return {
      totalDuration,
      dailyTimeCommitment: 60, // 1 hour per day
      phases: this.createPreparationPhases(companyProfile, focusAreas, totalDuration),
      milestones: this.createMilestones(totalDuration),
      resources: this.generateResources(companyProfile, focusAreas)
    };
  }

  private generateProductThinkingFeedback(
    companyProfile: CompanyProfile,
    evaluation: ResponseEvaluation
  ): string {
    const philosophy = companyProfile.productPhilosophy;
    
    if (philosophy.customerFocus === 'b2c') {
      return 'Focus more on consumer needs and user experience in your product thinking.';
    } else if (philosophy.customerFocus === 'b2b') {
      return 'Emphasize business value and enterprise considerations in your product approach.';
    }
    
    return 'Align your product thinking with the company\'s product philosophy.';
  }

  private generateLeadershipFeedback(
    companyProfile: CompanyProfile,
    evaluation: ResponseEvaluation
  ): string {
    if (companyProfile.cultureValues.leadershipPrinciples) {
      return `Demonstrate specific examples that align with ${companyProfile.name}'s leadership principles.`;
    }
    
    return 'Show leadership qualities that align with the company culture.';
  }

  private generateCommunicationFeedback(
    companyProfile: CompanyProfile,
    evaluation: ResponseEvaluation
  ): string {
    switch (companyProfile.evaluationCriteria.feedbackStyle) {
      case 'direct':
        return 'Be more direct and concise in your communication.';
      case 'structured':
        return 'Use a more structured approach in presenting your ideas.';
      case 'conversational':
        return 'Adopt a more conversational and collaborative tone.';
      default:
        return 'Adapt your communication style to match company expectations.';
    }
  }

  private generateCustomizedImprovements(
    companyProfile: CompanyProfile,
    evaluation: ResponseEvaluation,
    context: CustomizationContext
  ): string[] {
    const improvements: string[] = [];
    
    // Add company-specific improvements
    improvements.push(`Study ${companyProfile.name}'s recent product launches and strategic direction`);
    improvements.push(`Practice examples that demonstrate ${companyProfile.name}'s core values`);
    
    // Add role-specific improvements
    if (context.roleLevel === 'Senior PM') {
      improvements.push('Prepare strategic leadership examples');
    }
    
    return improvements;
  }

  private generateCompanySpecificTips(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): string[] {
    const tips: string[] = [];
    
    // Add company-specific tips
    switch (companyProfile.id) {
      case 'google':
        tips.push('Emphasize user impact and technical innovation');
        tips.push('Show collaborative problem-solving approach');
        break;
      case 'amazon':
        tips.push('Start every answer with customer impact');
        tips.push('Use STAR method for behavioral questions');
        break;
      case 'meta':
        tips.push('Focus on connecting people and building community');
        tips.push('Demonstrate comfort with rapid iteration');
        break;
    }
    
    return tips;
  }

  private generateInterviewTips(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): InterviewTip[] {
    const tips: InterviewTip[] = [];
    
    // Add preparation tips
    tips.push({
      category: 'preparation',
      tip: `Research ${companyProfile.name}'s recent product launches and strategic initiatives`,
      importance: 'high',
      applicableRounds: [1, 2, 3, 4, 5]
    });
    
    // Add company-specific tips
    if (companyProfile.cultureValues.leadershipPrinciples) {
      tips.push({
        category: 'during_interview',
        tip: 'Prepare specific examples for each leadership principle',
        importance: 'high',
        applicableRounds: [2, 3, 4]
      });
    }
    
    return tips;
  }

  private identifyCommonPitfalls(companyProfile: CompanyProfile): string[] {
    const pitfalls: string[] = [];
    
    // Add company-specific pitfalls
    switch (companyProfile.id) {
      case 'google':
        pitfalls.push('Focusing on features instead of user problems');
        pitfalls.push('Not considering global scale implications');
        break;
      case 'amazon':
        pitfalls.push('Not starting with customer needs');
        pitfalls.push('Weak leadership principle examples');
        break;
    }
    
    return pitfalls;
  }

  private generateSuccessStories(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): string[] {
    return [
      `Successful candidates at ${companyProfile.name} typically demonstrate strong alignment with company values`,
      'Focus on specific, measurable impact in your examples'
    ];
  }

  private identifyRecentChanges(companyProfile: CompanyProfile): string[] {
    return companyProfile.recentLaunches.map(launch => 
      `Recent launch of ${launch.name} shows focus on ${launch.category}`
    );
  }

  private generateCompetitiveContext(companyProfile: CompanyProfile): string[] {
    return [
      `${companyProfile.name} competes primarily in ${companyProfile.industry.join(', ')} markets`,
      'Understanding competitive landscape is crucial for strategic discussions'
    ];
  }

  private generateIndustryTrends(companyProfile: CompanyProfile): string[] {
    const trends: string[] = [];
    
    companyProfile.industry.forEach(industry => {
      switch (industry) {
        case 'AI/ML':
          trends.push('AI democratization and enterprise adoption');
          break;
        case 'Cloud Computing':
          trends.push('Edge computing and serverless architecture');
          break;
        case 'E-commerce':
          trends.push('Social commerce and personalization');
          break;
      }
    });
    
    return trends;
  }

  // Additional helper methods
  private mapWeaknessToCategory(weakness: string): QuestionCategory | undefined {
    const mapping: Record<string, QuestionCategory> = {
      'product_sense': 'product_sense',
      'analytical': 'analytical',
      'behavioral': 'behavioral',
      'technical': 'technical'
    };
    
    return mapping[weakness.toLowerCase()];
  }

  private determineStartingDifficulty(context: CustomizationContext): number {
    if (context.userProfile?.experienceLevel === 'entry') return 2;
    if (context.userProfile?.experienceLevel === 'senior') return 4;
    return 3;
  }

  private determineTargetDifficulty(context: CustomizationContext): number {
    if (context.roleLevel === 'Senior PM') return 5;
    if (context.roleLevel === 'APM') return 3;
    return 4;
  }

  private getCompanySpecificQuestions(companyProfile: CompanyProfile): CompanyQuestion[] {
    // Return company-specific questions from the profile
    return []; // Simplified for now
  }

  private identifyAvoidancePatterns(context: CustomizationContext): string[] {
    // Identify question patterns to avoid based on user history
    return [];
  }

  private generatePracticeQuestions(area: string): string[] {
    return [`Practice question for ${area}`];
  }

  private mapCriterionToFrameworks(criterion: string): PMFramework[] {
    const mapping: Record<string, PMFramework[]> = {
      'Product Sense': ['CIRCLES', 'Jobs-to-be-Done'],
      'Analytical Thinking': ['RICE', 'SWOT'],
      'Leadership': ['STAR']
    };
    
    return mapping[criterion] || [];
  }

  private mapWeaknessToFrameworks(weakness: string): PMFramework[] {
    return this.mapCriterionToFrameworks(weakness);
  }

  private identifySecondaryAreas(companyProfile: CompanyProfile): string[] {
    return companyProfile.evaluationCriteria.secondaryCriteria.map(c => c.name);
  }

  private identifyFrameworkGaps(context: CustomizationContext): PMFramework[] {
    // Identify framework gaps from session history
    return [];
  }

  private identifyCommunicationImprovements(companyProfile: CompanyProfile): string[] {
    return ['Clear structure', 'Concise delivery'];
  }

  private identifyStrategicThinkingAreas(companyProfile: CompanyProfile): string[] {
    return ['Long-term vision', 'Market analysis'];
  }

  private createMotivationalElements(
    companyProfile: CompanyProfile,
    context: CustomizationContext
  ): MotivationalElement[] {
    return [
      {
        type: 'encouragement',
        message: `You're preparing for ${companyProfile.name} - focus on their core values!`,
        trigger: 'session_start'
      }
    ];
  }

  private calculatePreparationDuration(context: CustomizationContext): number {
    // Calculate based on user profile and goals
    return 14; // 2 weeks default
  }

  private createPreparationPhases(
    companyProfile: CompanyProfile,
    focusAreas: FocusArea[],
    totalDuration: number
  ): PreparationPhase[] {
    return [
      {
        name: 'Foundation',
        duration: Math.round(totalDuration * 0.3),
        objectives: ['Understand company culture', 'Learn core frameworks'],
        activities: [],
        successCriteria: ['Complete company research', 'Framework proficiency test']
      },
      {
        name: 'Practice',
        duration: Math.round(totalDuration * 0.5),
        objectives: ['Practice interview questions', 'Develop examples'],
        activities: [],
        successCriteria: ['Complete practice sessions', 'Improve scores']
      },
      {
        name: 'Polish',
        duration: Math.round(totalDuration * 0.2),
        objectives: ['Refine responses', 'Mock interviews'],
        activities: [],
        successCriteria: ['Mock interview success', 'Confidence building']
      }
    ];
  }

  private createMilestones(totalDuration: number): Milestone[] {
    return [
      {
        name: 'Company Research Complete',
        targetDate: new Date(Date.now() + (totalDuration * 0.3 * 24 * 60 * 60 * 1000)),
        criteria: ['Company profile studied', 'Recent launches reviewed']
      }
    ];
  }

  private generateResources(
    companyProfile: CompanyProfile,
    focusAreas: FocusArea[]
  ): Resource[] {
    return [
      {
        type: 'article',
        title: `${companyProfile.name} Product Philosophy Guide`,
        description: `Understanding ${companyProfile.name}'s approach to product development`,
        estimatedTime: 30,
        priority: 'high'
      }
    ];
  }

  private identifyCulturalEmphasis(companyProfile: CompanyProfile): string[] {
    const emphasis: string[] = [];
    
    // Add emphasis based on core values
    companyProfile.cultureValues.coreValues.forEach(value => {
      if (value.toLowerCase().includes('customer')) {
        emphasis.push('customer_focus');
      }
      if (value.toLowerCase().includes('innovation')) {
        emphasis.push('innovation');
      }
      if (value.toLowerCase().includes('data')) {
        emphasis.push('data_driven');
      }
    });
    
    return [...new Set(emphasis)];
  }
}

export default CompanyCustomizationEngine;