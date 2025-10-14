/**
 * MCP Tool: evaluate_interview_response
 * 
 * Evaluates PM interview responses using framework-based analysis and provides
 * structured feedback with improvement recommendations.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { InterviewPreparationCore } from '../../components/interview-preparation-core/index';
import { EvaluationConfig } from '../../components/interview-response-evaluator/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface EvaluateInterviewResponseArgs {
  question_id: string;
  user_response: string;
  session_id?: string;
  evaluation_focus?: ('frameworks' | 'specificity' | 'structure' | 'metrics')[];
  company_context?: string;
}

/**
 * Evaluate a PM interview response with framework-based feedback
 */
export async function evaluateInterviewResponse(
  args: EvaluateInterviewResponseArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Evaluating interview response', context, {
      questionId: args.question_id,
      responseLength: args.user_response.length,
      sessionId: args.session_id,
      evaluationFocus: args.evaluation_focus,
      companyContext: args.company_context
    });

    // Initialize interview preparation core
    const interviewCore = new InterviewPreparationCore();

    // Configure evaluation
    const evaluationConfig: EvaluationConfig = {
      customCriteria: args.evaluation_focus || ['frameworks', 'specificity', 'structure', 'metrics'],
      roleLevel: 'PM', // Default role level
      strictMode: false
    };

    // Evaluate response
    const evaluation = await interviewCore.evaluateStandaloneResponse(
      args.question_id,
      args.user_response,
      evaluationConfig
    );

    MCPLogger.info('Interview response evaluated successfully', context, {
      questionId: args.question_id,
      overallScore: evaluation.overallScore,
      frameworksAnalyzed: evaluation.frameworkAnalysis.length,
      strengthsCount: evaluation.strengths.length,
      improvementsCount: evaluation.improvements.length,
      confidence: evaluation.confidence
    });

    // Format detailed feedback
    const response = {
      evaluation: {
        overallScore: evaluation.overallScore,
        scoreBreakdown: {
          structure: Math.round(evaluation.overallScore * 0.3 * 10) / 10,
          content: Math.round(evaluation.overallScore * 0.4 * 10) / 10,
          frameworks: Math.round(evaluation.overallScore * 0.3 * 10) / 10
        },
        confidence: evaluation.confidence
      },
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      frameworkAnalysis: evaluation.frameworkAnalysis.map(fa => ({
        framework: fa.framework,
        usage: fa.usage,
        score: fa.score,
        feedback: fa.feedback,
        recommendation: fa.usage === 'missing' ? 
          `Consider incorporating ${fa.framework} framework structure` :
          fa.usage === 'partial' ?
          `Strengthen your ${fa.framework} framework application` :
          `Excellent use of ${fa.framework} framework`
      })),
      nextSteps: evaluation.nextSteps,
      detailedFeedback: {
        whatWorkedWell: evaluation.strengths.slice(0, 3),
        keyImprovements: evaluation.improvements.slice(0, 3),
        frameworkGaps: evaluation.frameworkAnalysis
          .filter(fa => fa.usage === 'missing' || fa.usage === 'partial')
          .map(fa => fa.framework),
        specificSuggestions: [
          ...evaluation.nextSteps,
          'Practice with similar questions to reinforce learning',
          'Review framework structures before next question'
        ]
      },
      scoreInterpretation: {
        5: 'Excellent - Ready for this type of question',
        4: 'Good - Minor improvements needed',
        3: 'Average - Some gaps to address',
        2: 'Below Average - Significant improvement needed',
        1: 'Poor - Major restructuring required'
      }[Math.round(evaluation.overallScore)] || 'Score interpretation unavailable'
    };

    // Add session context if provided
    if (args.session_id) {
      const sessionProgress = interviewCore.getSessionProgress(args.session_id);
      if (sessionProgress) {
        (response as any).sessionContext = {
          questionsCompleted: sessionProgress.questionsCompleted + 1,
          averageScore: sessionProgress.averageScore,
          categoryProgress: sessionProgress.categoryScores,
          recommendedFocus: sessionProgress.recommendedFocus
        };
      }
    }

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 2, // Evaluation is more resource intensive
      evaluationCompleted: true,
      overallScore: evaluation.overallScore,
      confidence: evaluation.confidence,
      nextAction: 'Review feedback and practice with generate_interview_question'
    });

  } catch (error) {
    MCPLogger.error('evaluate_interview_response tool failed', error as Error, context, {
      questionId: args.question_id,
      responseLength: args.user_response?.length,
      sessionId: args.session_id
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in evaluate_interview_response'),
      context
    );
  }
}

/**
 * Input schema for evaluate_interview_response tool
 */
export const evaluateInterviewResponseSchema = {
  type: 'object',
  properties: {
    question_id: {
      type: 'string',
      description: 'ID of the interview question being answered',
      minLength: 1
    },
    user_response: {
      type: 'string',
      description: 'User\'s response to the interview question',
      minLength: 10,
      maxLength: 5000
    },
    session_id: {
      type: 'string',
      description: 'Optional session ID to track progress across questions'
    },
    evaluation_focus: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['frameworks', 'specificity', 'structure', 'metrics']
      },
      description: 'Areas to focus evaluation on (default: all areas)',
      default: ['frameworks', 'specificity', 'structure', 'metrics']
    },
    company_context: {
      type: 'string',
      description: 'Company context for tailored evaluation (e.g., "Google", "Amazon")',
      examples: ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft']
    }
  },
  required: ['question_id', 'user_response'],
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const evaluateInterviewResponseDescription = 
  'Evaluates PM interview responses using framework-based analysis (STAR, CIRCLES, RICE, etc.). Provides structured feedback with scores, strengths, improvements, and specific recommendations for better performance. Supports company-specific evaluation criteria.';