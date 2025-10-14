/**
 * MCP Tool: evaluate_case_approach
 * 
 * Evaluates user approaches to case study steps with framework-based analysis
 * and provides step-by-step feedback for improvement.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { CaseFramework } from '../../models/interview';
import { CaseStudyHelper } from '../../components/case-study-helper/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface EvaluateCaseApproachArgs {
  session_id: string;
  user_response: string;
  frameworks_used?: CaseFramework[];
  step_number?: number;
  time_spent?: number;
}

/**
 * Evaluate user approach to current case study step
 */
export async function evaluateCaseApproach(
  args: EvaluateCaseApproachArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Evaluating case study approach', context, {
      sessionId: args.session_id,
      responseLength: args.user_response.length,
      frameworksUsed: args.frameworks_used,
      stepNumber: args.step_number,
      timeSpent: args.time_spent
    });

    // Initialize case study helper
    const caseHelper = new CaseStudyHelper();

    // Get current step to validate
    const currentStep = caseHelper.getCurrentStep(args.session_id);
    if (!currentStep) {
      throw new Error(`No active step found for session ${args.session_id}`);
    }

    // Validate step number if provided
    if (args.step_number && args.step_number !== currentStep.stepNumber) {
      throw new Error(`Step number mismatch. Current step is ${currentStep.stepNumber}, but received ${args.step_number}`);
    }

    // Submit response and get evaluation
    const result = await caseHelper.submitStepResponse(
      args.session_id,
      args.user_response,
      args.frameworks_used || []
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to evaluate case approach');
    }

    // Get updated progress
    const progress = caseHelper.getProgress(args.session_id);
    if (!progress) {
      throw new Error(`Failed to get progress for session ${args.session_id}`);
    }

    MCPLogger.info('Case study approach evaluated successfully', context, {
      sessionId: args.session_id,
      stepNumber: currentStep.stepNumber,
      stepType: currentStep.stepType,
      score: result.evaluation?.score,
      frameworksAnalyzed: result.evaluation?.frameworkUsage?.length || 0,
      hasNextStep: !!result.nextStep,
      hintsUsed: result.hints?.length || 0,
      progressPercentage: Math.round((progress.stepsCompleted / progress.totalSteps) * 100)
    });

    // Format comprehensive evaluation response
    const response: any = {
      stepEvaluation: {
        stepNumber: currentStep.stepNumber,
        stepType: currentStep.stepType,
        score: result.evaluation?.score || 0,
        scoreInterpretation: getScoreInterpretation(result.evaluation?.score || 0),
        strengths: result.evaluation?.strengths || [],
        improvements: result.evaluation?.improvements || [],
        missingElements: result.evaluation?.missingElements || [],
        confidence: result.evaluation?.confidence || 0
      },
      frameworkAnalysis: (result.evaluation?.frameworkUsage || []).map(fa => ({
        framework: fa.framework,
        usage: fa.usage,
        score: fa.score,
        feedback: fa.feedback,
        recommendation: generateFrameworkRecommendation(fa)
      })),
      progress: {
        stepsCompleted: progress.stepsCompleted,
        totalSteps: progress.totalSteps,
        currentStepProgress: progress.currentStepProgress,
        overallProgress: progress.overallProgress,
        timeElapsed: Math.round(progress.timeElapsed / 1000 / 60), // minutes
        hintsUsed: progress.hintsUsed,
        frameworksApplied: progress.frameworksApplied
      },
      nextStepRecommendations: result.evaluation?.nextStepRecommendations || [],
      sessionStatus: {
        hasNextStep: !!result.nextStep,
        isComplete: !result.nextStep && progress.stepsCompleted === progress.totalSteps,
        canContinue: !!result.nextStep
      }
    };

    // Add next step information if available
    if (result.nextStep) {
      response.nextStep = {
        stepNumber: result.nextStep.stepNumber,
        stepType: result.nextStep.stepType,
        title: result.nextStep.title,
        instruction: result.nextStep.instruction,
        frameworks: result.nextStep.frameworks,
        timeLimit: result.nextStep.timeLimit,
        evaluationCriteria: result.nextStep.evaluationCriteria
      };

      response.nextStepGuidance = {
        suggestedFrameworks: result.nextStep.frameworks,
        preparationTips: generatePreparationTips(result.nextStep, result.evaluation),
        buildOnPrevious: generateBuildOnPreviousTips(currentStep, result.nextStep, result.evaluation)
      };
    }

    // Add hints if provided
    if (result.hints && result.hints.length > 0) {
      response.hintsProvided = result.hints.map(hint => ({
        level: hint.level,
        content: hint.content,
        framework: hint.framework,
        revealsSolution: hint.revealsSolution
      }));
    }

    // Add guidance if provided
    if (result.guidance && result.guidance.length > 0) {
      response.frameworkGuidance = result.guidance.map((guidance: any) => ({
        framework: guidance.framework,
        description: guidance.description,
        steps: guidance.steps.slice(0, 3), // Limit to key steps
        whenToUse: guidance.whenToUse
      }));
    }

    // Add completion information if case is done
    if (!result.nextStep && progress.stepsCompleted === progress.totalSteps) {
      response.completionInfo = {
        message: 'Case study completed! Use complete_case_study to get final evaluation.',
        nextAction: 'complete_case_study',
        readyForFinalEvaluation: true
      };
    }

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 2, // Evaluation is resource intensive
      stepEvaluated: true,
      stepScore: result.evaluation?.score || 0,
      hasNextStep: !!result.nextStep,
      progressPercentage: Math.round((progress.stepsCompleted / progress.totalSteps) * 100),
      nextAction: result.nextStep ? 
        'Continue to next step or request guidance' : 
        'Use complete_case_study for final evaluation'
    });

  } catch (error) {
    MCPLogger.error('evaluate_case_approach tool failed', error as Error, context, {
      sessionId: args.session_id,
      responseLength: args.user_response?.length,
      stepNumber: args.step_number
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in evaluate_case_approach'),
      context
    );
  }
}

// Helper functions for evaluation analysis
function getScoreInterpretation(score: number): string {
  if (score >= 4.5) return 'Excellent - Strong framework application and insights';
  if (score >= 4.0) return 'Good - Solid approach with minor gaps';
  if (score >= 3.5) return 'Above Average - Good structure, some improvements needed';
  if (score >= 3.0) return 'Average - Basic framework usage, needs development';
  if (score >= 2.5) return 'Below Average - Weak structure, significant gaps';
  return 'Poor - Major improvements needed in approach and frameworks';
}

function generateFrameworkRecommendation(frameworkAnalysis: any): string {
  switch (frameworkAnalysis.usage) {
    case 'excellent':
      return `Outstanding use of ${frameworkAnalysis.framework}. Your application demonstrates mastery.`;
    case 'good':
      return `Good application of ${frameworkAnalysis.framework}. Minor refinements could strengthen it further.`;
    case 'partial':
      return `You started using ${frameworkAnalysis.framework} but didn't complete the full structure. Review the framework steps.`;
    case 'missing':
      return `Consider applying ${frameworkAnalysis.framework} framework to strengthen your analysis for this type of problem.`;
    default:
      return `Review ${frameworkAnalysis.framework} framework application.`;
  }
}

function generatePreparationTips(nextStep: any, currentEvaluation: any): string[] {
  const tips: string[] = [];
  
  // Step-type specific tips
  switch (nextStep.stepType) {
    case 'clarification':
      tips.push('Prepare thoughtful questions to understand the problem deeply');
      tips.push('Focus on identifying key stakeholders and their needs');
      break;
    case 'analysis':
      tips.push('Build on your clarification to break down the problem systematically');
      tips.push('Use data and frameworks to support your analysis');
      break;
    case 'ideation':
      tips.push('Generate multiple creative solutions before evaluating');
      tips.push('Consider both incremental and breakthrough approaches');
      break;
    case 'prioritization':
      tips.push('Define clear criteria for evaluation');
      tips.push('Use structured frameworks like RICE or impact/effort matrix');
      break;
    case 'metrics':
      tips.push('Define both leading and lagging indicators');
      tips.push('Consider user, business, and technical metrics');
      break;
    case 'recommendation':
      tips.push('Synthesize your analysis into clear, actionable recommendations');
      tips.push('Address implementation challenges and risks');
      break;
  }
  
  // Performance-based tips
  if (currentEvaluation && currentEvaluation.score < 3.5) {
    tips.push('Focus on applying frameworks more systematically');
    tips.push('Provide more specific examples and reasoning');
  }
  
  return tips;
}

function generateBuildOnPreviousTips(currentStep: any, nextStep: any, evaluation: any): string[] {
  const tips: string[] = [];
  
  tips.push(`Build on your ${currentStep.stepType} analysis for the ${nextStep.stepType} step`);
  
  if (evaluation && evaluation.strengths && evaluation.strengths.length > 0) {
    tips.push(`Leverage your strength in: ${evaluation.strengths[0]}`);
  }
  
  if (evaluation && evaluation.improvements && evaluation.improvements.length > 0) {
    tips.push(`Address the gap in: ${evaluation.improvements[0]}`);
  }
  
  // Step transition specific tips
  if (currentStep.stepType === 'clarification' && nextStep.stepType === 'analysis') {
    tips.push('Use the insights from your clarifying questions to guide your analysis');
  } else if (currentStep.stepType === 'analysis' && nextStep.stepType === 'ideation') {
    tips.push('Let your analysis insights inspire creative solution options');
  } else if (currentStep.stepType === 'ideation' && nextStep.stepType === 'prioritization') {
    tips.push('Evaluate your solution options against clear criteria');
  }
  
  return tips;
}

/**
 * Input schema for evaluate_case_approach tool
 */
export const evaluateCaseApproachSchema = {
  type: 'object',
  properties: {
    session_id: {
      type: 'string',
      description: 'Case study session ID',
      minLength: 1
    },
    user_response: {
      type: 'string',
      description: 'User\'s response to the current case study step',
      minLength: 10,
      maxLength: 10000
    },
    frameworks_used: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['CIRCLES', 'RICE', 'SWOT', 'Porter_Five_Forces', 'Jobs_to_be_Done', 'North_Star', 'OKRs', 'Lean_Canvas']
      },
      description: 'Frameworks explicitly used in the response (optional)',
      maxItems: 5
    },
    step_number: {
      type: 'number',
      description: 'Step number being evaluated (optional - for validation)',
      minimum: 1
    },
    time_spent: {
      type: 'number',
      description: 'Time spent on this step in minutes (optional)',
      minimum: 0
    }
  },
  required: ['session_id', 'user_response'],
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const evaluateCaseApproachDescription = 
  'Evaluates user approaches to PM case study steps with framework-based analysis. Provides detailed feedback on structure, content, framework usage, and specific recommendations for improvement. Guides progression through multi-step case studies with contextual feedback.';