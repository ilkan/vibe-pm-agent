/**
 * MCP Tool: customize_preparation_for_company
 * 
 * Customizes interview preparation approach based on specific company requirements,
 * creating tailored practice plans and feedback criteria.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { RoleLevel, QuestionCategory } from '../../models/interview';
import { CompanyProfileDatabaseImpl } from '../../components/company-profile-database/index';
import { CompanyCustomizationEngine } from '../../components/company-customization-engine/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface CustomizePreparationForCompanyArgs {
  company_name: string;
  role_level: RoleLevel;
  preparation_timeline?: number; // weeks
  current_experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
  focus_areas?: QuestionCategory[];
  weak_areas?: string[];
  available_time_per_week?: number; // hours
  interview_date?: string; // ISO date string
  specific_role?: string; // e.g., "Senior PM - Search", "PM - Ads"
}

/**
 * Create customized interview preparation plan for specific company
 */
export async function customizePreparationForCompany(
  args: CustomizePreparationForCompanyArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Customizing preparation for company', context, {
      companyName: args.company_name,
      roleLevel: args.role_level,
      preparationTimeline: args.preparation_timeline,
      experienceLevel: args.current_experience_level,
      focusAreas: args.focus_areas,
      weakAreas: args.weak_areas,
      timePerWeek: args.available_time_per_week,
      interviewDate: args.interview_date,
      specificRole: args.specific_role
    });

    // Initialize company database and customization engine
    const companyDatabase = new CompanyProfileDatabaseImpl();
    const customizationEngine = new CompanyCustomizationEngine();

    // Get company profile
    const companyProfile = companyDatabase.getCompanyByName(args.company_name);
    if (!companyProfile) {
      throw new Error(`Company profile not found for: ${args.company_name}. Available companies: ${companyDatabase.getAllCompanies().map(c => c.name).join(', ')}`);
    }

    // Calculate preparation timeline
    const timeline = args.preparation_timeline || calculateRecommendedTimeline(
      companyProfile,
      args.interview_date,
      args.current_experience_level
    );

    // Create customization request
    const customizationRequest = {
      companyId: companyProfile.id,
      roleLevel: args.role_level,
      experienceLevel: args.current_experience_level || 'mid',
      preparationWeeks: timeline,
      availableHoursPerWeek: args.available_time_per_week || 10,
      focusAreas: args.focus_areas || [],
      weakAreas: args.weak_areas || [],
      specificRole: args.specific_role,
      interviewDate: args.interview_date ? new Date(args.interview_date) : undefined
    };

    // Generate customized preparation plan
    const customizedPlan = await customizationEngine.generateCustomizedPreparation(customizationRequest);

    MCPLogger.info('Customized preparation plan created successfully', context, {
      companyName: companyProfile.name,
      roleLevel: args.role_level,
      timelineWeeks: timeline,
      totalStudyHours: Math.ceil(customizedPlan.preparationPlan.totalDuration * customizedPlan.preparationPlan.dailyTimeCommitment / 60),
      weeklyPlansCount: 4, // Default 4-week plan
      practiceQuestionsCount: customizedPlan.focusAreas.reduce((total, area) => total + area.practiceQuestions.length, 0),
      resourcesCount: customizedPlan.focusAreas.length * 3 // Estimate resources per focus area
    });

    // Format comprehensive preparation plan
    const response = {
      preparationOverview: {
        company: companyProfile.name,
        roleLevel: args.role_level,
        specificRole: args.specific_role,
        timelineWeeks: timeline,
        totalEstimatedHours: Math.ceil(customizedPlan.preparationPlan.totalDuration * customizedPlan.preparationPlan.dailyTimeCommitment / 60),
        weeklyTimeCommitment: Math.ceil(customizedPlan.preparationPlan.dailyTimeCommitment * 7 / 60),
        difficultyLevel: 'Medium', // Default assessment
        successProbability: 0.75, // Default probability
        readinessDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      },
      
      customizedApproach: {
        priorityAreas: customizedPlan.focusAreas.map(area => ({
          area: area.area,
          importance: area.priority,
          timeAllocation: area.recommendedTime,
          reason: area.rationale,
          preparationStrategy: `Focus on ${area.frameworks.join(', ')} frameworks`
        })),
        
        companySpecificFocus: {
          cultureAlignment: customizedPlan.companyInsights.successStories,
          productPhilosophyEmphasis: customizedPlan.companyInsights.industryTrends,
          evaluationCriteriaWeighting: customizedPlan.feedbackCustomization.valueAlignment,
          uniquePreparationAspects: customizedPlan.companyInsights.competitiveContext
        },
        
        personalizedAdjustments: {
          experienceLevelAdaptations: customizedPlan.preparationPlan.phases.map(phase => phase.name),
          weakAreaMitigation: customizedPlan.focusAreas.filter(area => area.priority === 'high').map(area => area.area),
          strengthLeverage: customizedPlan.focusAreas.filter(area => area.priority === 'low').map(area => area.area),
          timeConstraintOptimizations: [`${customizedPlan.preparationPlan.dailyTimeCommitment} minutes daily`]
        }
      },

      weeklyPreparationPlan: Array.from({ length: 4 }, (_, index) => ({
        weekNumber: index + 1,
        theme: `Week ${index + 1}: Focus on ${customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.area || 'General Skills'}`,
        objectives: [`Master ${customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.area || 'core concepts'}`],
        timeAllocation: customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.recommendedTime || 300,
        dailyActivities: Array.from({ length: 5 }, (_, dayIndex) => ({
          day: dayIndex + 1,
          duration: 60,
          activity: `Practice ${customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.frameworks[0] || 'frameworks'}`,
          resources: ['Framework guides', 'Practice questions'],
          deliverables: ['Completed exercises']
        })),
        milestones: [`Complete focus area assessment`],
        assessments: [`Weekly ${customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.area || 'skills'} evaluation`]
      })),

      practiceQuestions: {
        companySpecific: customizedPlan.focusAreas.flatMap(area => 
          area.practiceQuestions.slice(0, 3).map((q, idx) => ({
            id: `company_${idx}`,
            category: area.area,
            question: q,
            companyContext: companyProfile.name,
            evaluationCriteria: area.successMetrics,
            frameworks: area.frameworks,
            difficulty: area.priority === 'high' ? 4 : area.priority === 'medium' ? 3 : 2
          }))
        ),
        
        roleSpecific: customizedPlan.focusAreas.flatMap(area => 
          area.practiceQuestions.slice(0, 2).map((q, idx) => ({
            id: `role_${idx}`,
            category: area.area,
            question: q,
            roleContext: args.role_level,
            evaluationCriteria: area.successMetrics,
            frameworks: area.frameworks,
            difficulty: area.priority === 'high' ? 4 : 3
          }))
        ),
        
        weakAreaFocus: customizedPlan.focusAreas
          .filter(area => args.weak_areas?.includes(area.area))
          .flatMap(area => 
            area.practiceQuestions.slice(0, 2).map((q, idx) => ({
              id: `weak_${idx}`,
              category: area.area,
              question: q,
              weakAreaTarget: area.area,
              improvementStrategy: area.rationale,
              frameworks: area.frameworks
            }))
          )
      },

      resources: {
        companySpecific: [
          {
            title: `${companyProfile.name} Interview Guide`,
            type: 'guide',
            url: '#',
            description: `Comprehensive interview preparation for ${companyProfile.name}`,
            priority: 'high',
            estimatedTime: 120
          }
        ],
        
        skillDevelopment: customizedPlan.focusAreas.map(area => ({
          title: `${area.area} Development Resources`,
          type: 'course',
          url: '#',
          description: `Resources for improving ${area.area}`,
          skillArea: area.area,
          difficulty: area.priority
        })),
        
        frameworks: customizedPlan.focusAreas.flatMap(area => 
          area.frameworks.map(framework => ({
            title: `${framework} Framework Guide`,
            framework: framework,
            description: `Complete guide to ${framework} framework`,
            practiceExercises: [`${framework} practice exercises`]
          }))
        )
      },

      mockInterviewPlan: {
        schedule: Array.from({ length: 4 }, (_, index) => ({
          week: index + 1,
          type: index < 2 ? 'behavioral' : 'case_study',
          focus: customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.area || 'general',
          duration: 60,
          preparation: [`Review ${customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.area || 'concepts'}`],
          evaluationCriteria: customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.successMetrics || ['Clear communication']
        })),
        
        progressMilestones: Array.from({ length: 4 }, (_, index) => ({
          week: index + 1,
          milestone: `Week ${index + 1} Assessment Complete`,
          successCriteria: [`Score above 3.5 in ${customizedPlan.focusAreas[index % customizedPlan.focusAreas.length]?.area || 'general skills'}`],
          assessmentMethod: 'Mock interview evaluation'
        }))
      },

      feedbackCustomization: {
        evaluationWeights: customizedPlan.feedbackCustomization.valueAlignment,
        companySpecificSignals: customizedPlan.companyInsights.interviewTips.map(tip => tip.category),
        roleSpecificExpectations: [`${args.role_level} level expectations`],
        personalizedImprovementAreas: customizedPlan.focusAreas.filter(area => area.priority === 'high').map(area => area.area)
      },

      successMetrics: {
        readinessIndicators: ['Consistent 4+ scores', 'Framework mastery', 'Company knowledge'],
        progressTracking: ['Weekly assessments', 'Mock interview scores', 'Self-evaluation'],
        adjustmentTriggers: ['Below 3.0 average', 'Consistent weak areas', 'Time constraints'],
        finalAssessment: 'Comprehensive mock interview with company-specific scenarios'
      },

      contingencyPlans: {
        timeConstraints: ['Focus on high-priority areas', 'Intensive weekend sessions'],
        difficultyAdjustments: ['Simplify complex frameworks', 'Add foundational practice'],
        focusAreaShifts: ['Pivot to strengths', 'Address critical gaps'],
        lastMinutePrep: ['Review key frameworks', 'Practice elevator pitch', 'Company research refresh']
      }
    };

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 3, // Customization is resource intensive
      planCustomized: true,
      company: companyProfile.name,
      timelineWeeks: timeline,
      totalHours: Math.ceil(customizedPlan.preparationPlan.totalDuration * customizedPlan.preparationPlan.dailyTimeCommitment / 60),
      questionsGenerated: customizedPlan.focusAreas.reduce((total, area) => total + area.practiceQuestions.length, 0),
      resourcesProvided: customizedPlan.focusAreas.length * 3,
      nextAction: 'Begin week 1 preparation activities'
    });

  } catch (error) {
    MCPLogger.error('customize_preparation_for_company tool failed', error as Error, context, {
      companyName: args.company_name,
      roleLevel: args.role_level,
      timeline: args.preparation_timeline
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in customize_preparation_for_company'),
      context
    );
  }
}

// Helper function to calculate recommended timeline
function calculateRecommendedTimeline(
  companyProfile: any,
  interviewDate?: string,
  experienceLevel?: string
): number {
  let baseWeeks = 4; // Default timeline
  
  // Adjust based on company difficulty
  if (companyProfile.interviewProcess.passRate <= 0.1) baseWeeks = 8;
  else if (companyProfile.interviewProcess.passRate <= 0.15) baseWeeks = 6;
  else if (companyProfile.interviewProcess.passRate <= 0.25) baseWeeks = 5;
  
  // Adjust based on experience level
  switch (experienceLevel) {
    case 'entry':
      baseWeeks += 2;
      break;
    case 'senior':
      baseWeeks -= 1;
      break;
    case 'executive':
      baseWeeks -= 2;
      break;
  }
  
  // Adjust based on interview date if provided
  if (interviewDate) {
    const weeksUntilInterview = Math.floor(
      (new Date(interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)
    );
    
    if (weeksUntilInterview < baseWeeks) {
      return Math.max(weeksUntilInterview, 2); // Minimum 2 weeks
    }
  }
  
  return Math.min(baseWeeks, 12); // Maximum 12 weeks
}

/**
 * Input schema for customize_preparation_for_company tool
 */
export const customizePreparationForCompanySchema = {
  type: 'object',
  properties: {
    company_name: {
      type: 'string',
      description: 'Name of the target company for customized preparation',
      examples: ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Uber', 'Airbnb']
    },
    role_level: {
      type: 'string',
      enum: ['APM', 'PM', 'Senior PM'],
      description: 'Target PM role level'
    },
    preparation_timeline: {
      type: 'number',
      description: 'Preparation timeline in weeks (auto-calculated if not provided)',
      minimum: 2,
      maximum: 12
    },
    current_experience_level: {
      type: 'string',
      enum: ['entry', 'mid', 'senior', 'executive'],
      description: 'Current experience level for tailored preparation (default: mid)',
      default: 'mid'
    },
    focus_areas: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['behavioral', 'product_sense', 'analytical', 'technical']
      },
      description: 'Specific areas to focus preparation on (optional)',
      maxItems: 4
    },
    weak_areas: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Areas needing improvement (e.g., "framework application", "metrics design")',
      maxItems: 5
    },
    available_time_per_week: {
      type: 'number',
      description: 'Available study time per week in hours (default: 10)',
      minimum: 3,
      maximum: 40,
      default: 10
    },
    interview_date: {
      type: 'string',
      description: 'Target interview date in ISO format (YYYY-MM-DD) for timeline optimization',
      format: 'date'
    },
    specific_role: {
      type: 'string',
      description: 'Specific role title for additional customization (e.g., "Senior PM - Search")',
      examples: ['Senior PM - Search', 'PM - Ads', 'PM - Infrastructure', 'APM - Consumer Products']
    }
  },
  required: ['company_name', 'role_level'],
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const customizePreparationForCompanyDescription = 
  'Creates comprehensive, personalized interview preparation plans tailored to specific companies and roles. Generates weekly study schedules, company-specific practice questions, customized feedback criteria, and adaptive learning paths based on individual strengths, weaknesses, and time constraints.';