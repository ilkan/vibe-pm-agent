/**
 * MCP Tool: generate_interview_question
 * 
 * Generates PM interview questions with role and company filtering using
 * the interview question generation system.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { RoleLevel, QuestionCategory } from '../../models/interview';
import { InterviewPreparationCore } from '../../components/interview-preparation-core/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface GenerateInterviewQuestionArgs {
  role_level?: RoleLevel;
  category?: QuestionCategory;
  difficulty?: number;
  company?: string;
  session_id?: string;
  exclude_previous?: boolean;
}

/**
 * Generate a PM interview question with specified filters
 */
export async function generateInterviewQuestion(
  args: GenerateInterviewQuestionArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Generating interview question', context, {
      roleLevel: args.role_level,
      category: args.category,
      difficulty: args.difficulty,
      company: args.company,
      sessionId: args.session_id,
      excludePrevious: args.exclude_previous
    });

    // Initialize interview preparation core
    const interviewCore = new InterviewPreparationCore();

    // Build filters
    const filters = {
      roleLevel: args.role_level || 'PM',
      category: args.category,
      difficulty: args.difficulty,
      company: args.company
    };

    // Generate question
    const questionResult = await interviewCore.getQuestion(filters);

    MCPLogger.info('Interview question generated successfully', context, {
      questionId: questionResult.question.id,
      category: questionResult.question.category,
      difficulty: questionResult.question.difficulty,
      roleLevel: questionResult.question.roleLevel,
      company: questionResult.question.company,
      frameworksCount: questionResult.question.frameworks.length
    });

    // Format response
    const response = {
      question: {
        id: questionResult.question.id,
        category: questionResult.question.category,
        question: questionResult.question.question,
        followUps: questionResult.question.followUps,
        evaluationCriteria: questionResult.question.evaluationCriteria,
        frameworks: questionResult.question.frameworks,
        roleLevel: questionResult.question.roleLevel,
        difficulty: questionResult.question.difficulty,
        company: questionResult.question.company,
        tags: questionResult.question.tags
      },
      metadata: {
        generationReason: (questionResult as any).metadata?.reason || 'User request',
        suggestedFrameworks: questionResult.question.frameworks,
        estimatedTime: (questionResult as any).metadata?.estimatedTime || '5-10 minutes',
        tips: [
          `This is a ${questionResult.question.category} question for ${questionResult.question.roleLevel.join('/')} level`,
          `Consider using these frameworks: ${questionResult.question.frameworks.join(', ')}`,
          'Structure your response clearly with specific examples',
          'Include quantifiable results when possible'
        ]
      },
      instructions: [
        'Take time to think through your response structure',
        'Use the suggested frameworks to organize your answer',
        'Provide specific examples from your experience',
        'Use evaluate_interview_response tool to get feedback on your answer'
      ]
    };

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 1,
      questionGenerated: true,
      nextAction: 'Answer the question and use evaluate_interview_response for feedback'
    });

  } catch (error) {
    MCPLogger.error('generate_interview_question tool failed', error as Error, context, {
      roleLevel: args.role_level,
      category: args.category,
      company: args.company
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in generate_interview_question'),
      context
    );
  }
}

/**
 * Input schema for generate_interview_question tool
 */
export const generateInterviewQuestionSchema = {
  type: 'object',
  properties: {
    role_level: {
      type: 'string',
      enum: ['APM', 'PM', 'Senior PM'],
      description: 'Target PM role level (default: PM)',
      default: 'PM'
    },
    category: {
      type: 'string',
      enum: ['behavioral', 'product_sense', 'analytical', 'technical'],
      description: 'Question category filter (optional)'
    },
    difficulty: {
      type: 'number',
      minimum: 1,
      maximum: 5,
      description: 'Question difficulty level from 1 (easy) to 5 (hard)'
    },
    company: {
      type: 'string',
      description: 'Target company for company-specific questions (optional)',
      examples: ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Uber', 'Airbnb']
    },
    session_id: {
      type: 'string',
      description: 'Session ID to continue existing interview preparation session (optional)'
    },
    exclude_previous: {
      type: 'boolean',
      description: 'Whether to exclude previously asked questions in the session (default: true)',
      default: true
    }
  },
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const generateInterviewQuestionDescription = 
  'Generates PM interview questions with role and company filtering. Supports behavioral, product sense, analytical, and technical questions with difficulty levels and company-specific variations. Returns structured questions with evaluation criteria and suggested frameworks.';