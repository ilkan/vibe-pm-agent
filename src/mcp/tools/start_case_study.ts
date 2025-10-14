/**
 * MCP Tool: start_case_study
 * 
 * Starts a structured PM case study practice session with step-by-step guidance
 * and framework-based evaluation using the case study helper system.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { CaseType, CaseFilters } from '../../models/interview';
import { CaseStudyHelper, CaseStudyHelperConfig } from '../../components/case-study-helper/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface StartCaseStudyArgs {
  case_type?: CaseType;
  difficulty?: number;
  industry?: string;
  company?: string;
  estimated_time?: number;
  case_id?: string;
  market_data_integration?: boolean;
  time_constraints?: boolean;
}

/**
 * Start a structured PM case study practice session
 */
export async function startCaseStudy(
  args: StartCaseStudyArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Starting case study session', context, {
      caseType: args.case_type,
      difficulty: args.difficulty,
      industry: args.industry,
      company: args.company,
      estimatedTime: args.estimated_time,
      caseId: args.case_id,
      marketDataIntegration: args.market_data_integration,
      timeConstraints: args.time_constraints
    });

    // Initialize case study helper
    const caseStudyConfig: CaseStudyHelperConfig = {
      enableHints: true,
      timeTracking: true,
      autoProgression: false,
      evaluationMode: 'step_complete',
      marketDataIntegration: args.market_data_integration ?? true,
      adaptiveDifficulty: true,
      personalizedRecommendations: true
    };

    const caseHelper = new CaseStudyHelper(caseStudyConfig);

    let caseStudy;
    let sessionResult;

    // Get or select case study
    if (args.case_id) {
      // Use specific case ID
      caseStudy = caseHelper.getCaseById(args.case_id);
      if (!caseStudy) {
        throw new Error(`Case study with ID ${args.case_id} not found`);
      }
    } else {
      // Find case based on filters
      const filters: CaseFilters = {
        type: args.case_type,
        difficulty: args.difficulty,
        industry: args.industry,
        company: args.company,
        estimatedTime: args.estimated_time
      };

      caseStudy = caseHelper.getRandomCase(filters);
      if (!caseStudy) {
        // Generate a current scenario if no existing case matches
        if (args.case_type && args.industry) {
          caseStudy = await caseHelper.generateCurrentScenario({
            caseType: args.case_type,
            industry: args.industry,
            difficulty: args.difficulty || 3,
            timeConstraint: args.estimated_time,
            targetCompany: args.company
          });
        }
        
        if (!caseStudy) {
          throw new Error('No suitable case study found for the specified criteria');
        }
      }
    }

    // Start case study session
    const customizations = {
      industry: args.industry,
      company: args.company,
      difficulty: args.difficulty,
      timeConstraints: args.time_constraints
    };

    sessionResult = await caseHelper.startCaseStudy(
      caseStudy.id,
      context.userId,
      customizations
    );

    if (!sessionResult) {
      throw new Error('Failed to start case study session');
    }

    MCPLogger.info('Case study session started successfully', context, {
      sessionId: sessionResult.session.sessionId,
      caseId: caseStudy.id,
      caseType: caseStudy.type,
      totalSteps: caseStudy.steps.length,
      firstStepType: sessionResult.firstStep.stepType,
      estimatedTime: caseStudy.estimatedTime,
      marketDataIntegrated: !!caseStudy.marketData
    });

    // Format response
    const response = {
      session: {
        sessionId: sessionResult.session.sessionId,
        caseId: caseStudy.id,
        startTime: sessionResult.session.startTime,
        currentStep: sessionResult.session.currentStep,
        totalSteps: caseStudy.steps.length
      },
      caseStudy: {
        id: caseStudy.id,
        type: caseStudy.type,
        title: caseStudy.title,
        scenario: caseStudy.scenario,
        context: caseStudy.context,
        constraints: caseStudy.constraints,
        objectives: caseStudy.objectives,
        expectedFrameworks: caseStudy.expectedFrameworks,
        difficulty: caseStudy.difficulty,
        estimatedTime: caseStudy.estimatedTime,
        industry: caseStudy.industry,
        company: caseStudy.company,
        marketData: caseStudy.marketData ? {
          industry: caseStudy.marketData.industry,
          marketSize: caseStudy.marketData.marketSize,
          competitors: caseStudy.marketData.competitors,
          trends: caseStudy.marketData.trends,
          keyMetrics: caseStudy.marketData.keyMetrics
        } : null
      },
      currentStep: {
        stepNumber: sessionResult.firstStep.stepNumber,
        stepType: sessionResult.firstStep.stepType,
        title: sessionResult.firstStep.title,
        instruction: sessionResult.firstStep.instruction,
        description: sessionResult.firstStep.description,
        frameworks: sessionResult.firstStep.frameworks,
        timeLimit: sessionResult.firstStep.timeLimit,
        evaluationCriteria: sessionResult.firstStep.evaluationCriteria,
        expectedOutputs: sessionResult.firstStep.expectedOutputs
      },
      guidance: {
        suggestedFrameworks: sessionResult.firstStep.frameworks,
        tips: [
          `This is a ${caseStudy.type} case study with ${caseStudy.difficulty}/5 difficulty`,
          `Estimated completion time: ${caseStudy.estimatedTime} minutes`,
          `Focus on these frameworks: ${sessionResult.firstStep.frameworks.join(', ')}`,
          'Structure your response clearly and provide specific reasoning'
        ],
        availableActions: [
          'Submit your response using evaluate_case_approach',
          'Request hints using get_case_guidance',
          'Get framework guidance for current step'
        ]
      },
      instructions: [
        'Read the scenario and current step carefully',
        'Apply the suggested frameworks to structure your approach',
        'Provide specific, actionable recommendations',
        'Use evaluate_case_approach to submit your response and get feedback'
      ]
    };

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 2, // Case study setup is more resource intensive
      sessionStarted: true,
      caseType: caseStudy.type,
      difficulty: caseStudy.difficulty,
      marketDataIntegrated: !!caseStudy.marketData,
      nextAction: 'Work through the current step and use evaluate_case_approach'
    });

  } catch (error) {
    MCPLogger.error('start_case_study tool failed', error as Error, context, {
      caseType: args.case_type,
      difficulty: args.difficulty,
      industry: args.industry,
      caseId: args.case_id
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in start_case_study'),
      context
    );
  }
}

/**
 * Input schema for start_case_study tool
 */
export const startCaseStudySchema = {
  type: 'object',
  properties: {
    case_type: {
      type: 'string',
      enum: ['product_design', 'strategy', 'prioritization', 'market_entry'],
      description: 'Type of case study to practice (optional - random selection if not specified)'
    },
    difficulty: {
      type: 'number',
      minimum: 1,
      maximum: 5,
      description: 'Case difficulty level from 1 (easy) to 5 (hard)'
    },
    industry: {
      type: 'string',
      description: 'Industry focus for the case study (e.g., "Technology", "Healthcare", "Finance")',
      examples: ['Technology', 'Healthcare', 'Finance', 'E-commerce', 'Transportation', 'Entertainment']
    },
    company: {
      type: 'string',
      description: 'Target company context for the case study (optional)',
      examples: ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Uber', 'Airbnb']
    },
    estimated_time: {
      type: 'number',
      description: 'Maximum time to spend on case study in minutes',
      minimum: 15,
      maximum: 120
    },
    case_id: {
      type: 'string',
      description: 'Specific case study ID to use (optional - overrides other filters)'
    },
    market_data_integration: {
      type: 'boolean',
      description: 'Whether to integrate real market data for realistic scenarios (default: true)',
      default: true
    },
    time_constraints: {
      type: 'boolean',
      description: 'Whether to apply time pressure similar to real interviews (default: false)',
      default: false
    }
  },
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const startCaseStudyDescription = 
  'Starts a structured PM case study practice session with step-by-step guidance. Supports product design, strategy, prioritization, and market entry cases with real market data integration. Provides framework guidance and structured evaluation throughout the case.';