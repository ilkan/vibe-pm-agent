/**
 * MCP Tool: get_case_guidance
 * 
 * Provides framework-based hints and guidance for PM case study steps
 * without revealing solutions, helping users get unstuck while learning.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { CaseStudyHelper } from '../../components/case-study-helper/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface GetCaseGuidanceArgs {
  session_id: string;
  guidance_type?: 'hint' | 'framework' | 'structure' | 'examples';
  hint_level?: 'gentle' | 'moderate' | 'strong';
  specific_framework?: string;
}

/**
 * Get framework-based hints and guidance for current case study step
 */
export async function getCaseGuidance(
  args: GetCaseGuidanceArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Getting case study guidance', context, {
      sessionId: args.session_id,
      guidanceType: args.guidance_type,
      hintLevel: args.hint_level,
      specificFramework: args.specific_framework
    });

    // Initialize case study helper
    const caseHelper = new CaseStudyHelper();

    // Get current step
    const currentStep = caseHelper.getCurrentStep(args.session_id);
    if (!currentStep) {
      throw new Error(`No active step found for session ${args.session_id}`);
    }

    // Get session progress to understand context
    const progress = caseHelper.getProgress(args.session_id);
    if (!progress) {
      throw new Error(`Session ${args.session_id} not found`);
    }

    let guidance: any = {};

    // Provide different types of guidance based on request
    switch (args.guidance_type) {
      case 'hint':
        const hint = caseHelper.getHint(args.session_id, args.hint_level || 'gentle');
        if (hint) {
          guidance.hint = {
            level: hint.level,
            content: hint.content,
            framework: hint.framework,
            revealsSolution: hint.revealsSolution
          };
        } else {
          guidance.hint = {
            level: 'gentle',
            content: 'Consider breaking down the problem into smaller components and applying the suggested frameworks systematically.',
            framework: null,
            revealsSolution: false
          };
        }
        break;

      case 'framework':
        const frameworkGuidance = caseHelper.getFrameworkGuidance(args.session_id);
        guidance.frameworks = frameworkGuidance.map((fg: any) => ({
          framework: fg.framework,
          description: fg.description,
          steps: fg.steps,
          whenToUse: fg.whenToUse,
          examples: fg.examples.slice(0, 2), // Limit examples
          commonMistakes: fg.commonMistakes
        }));
        break;

      case 'structure':
        guidance.structure = {
          recommendedApproach: generateStructuralGuidance(currentStep),
          stepBreakdown: currentStep.expectedOutputs,
          timeAllocation: generateTimeAllocation(currentStep),
          checkpoints: generateCheckpoints(currentStep)
        };
        break;

      case 'examples':
        guidance.examples = generateExampleGuidance(currentStep);
        break;

      default:
        // Provide comprehensive guidance
        const allHint = caseHelper.getHint(args.session_id, args.hint_level || 'gentle');
        const allFrameworkGuidance = caseHelper.getFrameworkGuidance(args.session_id);
        
        guidance = {
          hint: allHint ? {
            level: allHint.level,
            content: allHint.content,
            framework: allHint.framework
          } : null,
          frameworks: allFrameworkGuidance.slice(0, 2), // Limit to top 2 frameworks
          structure: {
            recommendedApproach: generateStructuralGuidance(currentStep),
            timeAllocation: generateTimeAllocation(currentStep)
          },
          quickTips: generateQuickTips(currentStep, progress)
        };
    }

    // Check if user needs help
    const helpCheck = caseHelper.checkIfUserNeedsHelp(args.session_id);

    MCPLogger.info('Case study guidance provided successfully', context, {
      sessionId: args.session_id,
      guidanceType: args.guidance_type || 'comprehensive',
      stepNumber: currentStep.stepNumber,
      stepType: currentStep.stepType,
      userIsStuck: helpCheck.isStuck,
      hintsAvailable: helpCheck.availableHints.length,
      suggestionsCount: helpCheck.suggestions.length
    });

    // Format response
    const response = {
      currentStep: {
        stepNumber: currentStep.stepNumber,
        stepType: currentStep.stepType,
        title: currentStep.title,
        instruction: currentStep.instruction,
        frameworks: currentStep.frameworks,
        timeLimit: currentStep.timeLimit
      },
      guidance,
      userStatus: {
        isStuck: helpCheck.isStuck,
        suggestions: helpCheck.suggestions,
        availableHints: helpCheck.availableHints.length,
        progressPercentage: Math.round((progress.stepsCompleted / progress.totalSteps) * 100)
      },
      nextActions: [
        'Apply the guidance to structure your response',
        'Use the suggested frameworks to organize your thinking',
        'Submit your approach using evaluate_case_approach',
        'Request more specific guidance if needed'
      ],
      warningNote: guidance.hint?.revealsSolution ? 
        'This hint reveals part of the solution. Use it only if you\'re truly stuck.' : 
        null
    };

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 1,
      guidanceProvided: true,
      guidanceType: args.guidance_type || 'comprehensive',
      userIsStuck: helpCheck.isStuck,
      nextAction: 'Apply guidance and continue with case study'
    });

  } catch (error) {
    MCPLogger.error('get_case_guidance tool failed', error as Error, context, {
      sessionId: args.session_id,
      guidanceType: args.guidance_type
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in get_case_guidance'),
      context
    );
  }
}

// Helper functions for generating guidance
function generateStructuralGuidance(step: any): string[] {
  const guidance: string[] = [];
  
  switch (step.stepType) {
    case 'clarification':
      guidance.push('Start by asking clarifying questions about the problem');
      guidance.push('Identify key stakeholders and their needs');
      guidance.push('Define success metrics and constraints');
      break;
    case 'analysis':
      guidance.push('Break down the problem into components');
      guidance.push('Analyze the current state vs desired state');
      guidance.push('Identify root causes and key factors');
      break;
    case 'ideation':
      guidance.push('Generate multiple solution options');
      guidance.push('Consider different approaches and perspectives');
      guidance.push('Think about both short-term and long-term solutions');
      break;
    case 'prioritization':
      guidance.push('Define clear evaluation criteria');
      guidance.push('Score options against criteria');
      guidance.push('Consider impact vs effort trade-offs');
      break;
    case 'metrics':
      guidance.push('Define leading and lagging indicators');
      guidance.push('Consider user, business, and technical metrics');
      guidance.push('Establish baseline and target values');
      break;
    case 'recommendation':
      guidance.push('Summarize your analysis and rationale');
      guidance.push('Present clear, actionable recommendations');
      guidance.push('Address potential risks and mitigation strategies');
      break;
    default:
      guidance.push('Structure your response with clear logic');
      guidance.push('Support your points with data and reasoning');
      guidance.push('Consider multiple perspectives and trade-offs');
  }
  
  return guidance;
}

function generateTimeAllocation(step: any): any {
  const totalTime = step.timeLimit;
  
  switch (step.stepType) {
    case 'clarification':
      return {
        understanding: Math.round(totalTime * 0.3),
        questioning: Math.round(totalTime * 0.4),
        summarizing: Math.round(totalTime * 0.3)
      };
    case 'analysis':
      return {
        problemBreakdown: Math.round(totalTime * 0.4),
        dataAnalysis: Math.round(totalTime * 0.4),
        synthesis: Math.round(totalTime * 0.2)
      };
    case 'ideation':
      return {
        brainstorming: Math.round(totalTime * 0.6),
        evaluation: Math.round(totalTime * 0.3),
        selection: Math.round(totalTime * 0.1)
      };
    default:
      return {
        thinking: Math.round(totalTime * 0.4),
        structuring: Math.round(totalTime * 0.4),
        reviewing: Math.round(totalTime * 0.2)
      };
  }
}

function generateCheckpoints(step: any): string[] {
  const checkpoints: string[] = [];
  
  checkpoints.push('Have I understood the problem correctly?');
  checkpoints.push('Am I using the right framework for this step?');
  checkpoints.push('Is my reasoning clear and logical?');
  checkpoints.push('Have I considered all key stakeholders?');
  checkpoints.push('Are my recommendations actionable?');
  
  return checkpoints;
}

function generateExampleGuidance(step: any): any {
  return {
    goodExample: `For a ${step.stepType} step, a strong response would include structured analysis using ${step.frameworks.join(' or ')} framework, specific examples, and clear reasoning.`,
    commonMistakes: [
      'Jumping to solutions without proper analysis',
      'Not using structured frameworks',
      'Vague or generic recommendations',
      'Ignoring constraints or stakeholder needs'
    ],
    improvementTips: [
      'Be specific with examples and metrics',
      'Show your thinking process clearly',
      'Consider multiple options before deciding',
      'Address potential counterarguments'
    ]
  };
}

function generateQuickTips(step: any, progress: any): string[] {
  const tips: string[] = [];
  
  // Step-specific tips
  tips.push(`For ${step.stepType} steps, focus on ${step.frameworks.join(' and ')} frameworks`);
  
  // Progress-based tips
  if (progress.stepsCompleted === 0) {
    tips.push('Take time to understand the scenario thoroughly');
  } else if (progress.stepsCompleted < progress.totalSteps / 2) {
    tips.push('Build on your previous analysis');
  } else {
    tips.push('Start connecting your analysis to actionable recommendations');
  }
  
  // Time-based tips
  if (progress.timeElapsed > step.timeLimit * 0.7) {
    tips.push('Focus on key points - time is running short');
  }
  
  return tips;
}

/**
 * Input schema for get_case_guidance tool
 */
export const getCaseGuidanceSchema = {
  type: 'object',
  properties: {
    session_id: {
      type: 'string',
      description: 'Case study session ID to get guidance for',
      minLength: 1
    },
    guidance_type: {
      type: 'string',
      enum: ['hint', 'framework', 'structure', 'examples'],
      description: 'Type of guidance to provide (default: comprehensive guidance)',
      default: 'comprehensive'
    },
    hint_level: {
      type: 'string',
      enum: ['gentle', 'moderate', 'strong'],
      description: 'Level of hint to provide (default: gentle)',
      default: 'gentle'
    },
    specific_framework: {
      type: 'string',
      description: 'Request guidance for a specific framework (optional)',
      examples: ['CIRCLES', 'RICE', 'SWOT', 'Porter Five Forces', 'Jobs-to-be-Done']
    }
  },
  required: ['session_id'],
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const getCaseGuidanceDescription = 
  'Provides framework-based hints and guidance for PM case study steps without revealing solutions. Offers structured approach recommendations, framework guidance, time management tips, and progressive hints to help users learn while staying challenged.';