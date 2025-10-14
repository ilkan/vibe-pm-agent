/**
 * MCP Tool: start_interview_preparation
 * 
 * Starts an interactive PM interview preparation session with personalized questions
 * and framework-based feedback using existing interview preparation components.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { RoleLevel, QuestionCategory } from '../../models/interview';
import { InterviewPreparationCore, InterviewPrepConfig } from '../../components/interview-preparation-core/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface StartInterviewPreparationArgs {
  role_level: RoleLevel;
  company?: string;
  focus_areas?: QuestionCategory[];
  session_duration?: number; // minutes
  question_count?: number;
}

/**
 * Start a new PM interview preparation session
 */
export async function startInterviewPreparation(
  args: StartInterviewPreparationArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Starting interview preparation session', context, {
      roleLevel: args.role_level,
      company: args.company,
      focusAreas: args.focus_areas,
      sessionDuration: args.session_duration,
      questionCount: args.question_count
    });

    // Initialize interview preparation core
    const interviewCore = new InterviewPreparationCore();

    // Configure session
    const config: InterviewPrepConfig = {
      roleLevel: args.role_level,
      company: args.company,
      focusAreas: args.focus_areas,
      sessionDuration: args.session_duration || 30,
      questionCount: args.question_count || 5
    };

    // Start interview session
    const result = await interviewCore.startInterviewSession(config);

    MCPLogger.info('Interview preparation session started successfully', context, {
      sessionId: result.session.sessionId,
      firstQuestionId: result.currentQuestion.id,
      firstQuestionCategory: result.currentQuestion.category,
      recommendationsCount: result.recommendations.length
    });

    // Format response
    const response = {
      session: {
        sessionId: result.session.sessionId,
        roleLevel: result.session.roleLevel,
        company: result.session.company,
        startTime: result.session.startTime,
        questionsCompleted: result.progress.questionsCompleted,
        averageScore: result.progress.averageScore
      },
      currentQuestion: {
        id: result.currentQuestion.id,
        category: result.currentQuestion.category,
        question: result.currentQuestion.question,
        followUps: result.currentQuestion.followUps,
        frameworks: result.currentQuestion.frameworks,
        difficulty: result.currentQuestion.difficulty
      },
      progress: result.progress,
      recommendations: result.recommendations,
      instructions: [
        'Answer the question using structured frameworks like STAR for behavioral questions',
        'Provide specific examples with quantifiable results when possible',
        'Use the evaluate_interview_response tool to get feedback on your answer',
        'Request the next question using generate_interview_question tool'
      ]
    };

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 1,
      sessionStarted: true,
      toolsToUseNext: ['evaluate_interview_response', 'generate_interview_question']
    });

  } catch (error) {
    MCPLogger.error('start_interview_preparation tool failed', error as Error, context, {
      roleLevel: args.role_level,
      company: args.company
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in start_interview_preparation'),
      context
    );
  }
}

/**
 * Input schema for start_interview_preparation tool
 */
export const startInterviewPreparationSchema = {
  type: 'object',
  properties: {
    role_level: {
      type: 'string',
      enum: ['APM', 'PM', 'Senior PM'],
      description: 'Target PM role level for interview preparation'
    },
    company: {
      type: 'string',
      description: 'Optional target company for company-specific preparation (e.g., "Google", "Amazon", "Meta")',
      examples: ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Uber', 'Airbnb']
    },
    focus_areas: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['behavioral', 'product_sense', 'analytical', 'technical']
      },
      description: 'Optional focus areas for the interview preparation session',
      maxItems: 4
    },
    session_duration: {
      type: 'number',
      description: 'Session duration in minutes (default: 30)',
      minimum: 10,
      maximum: 120,
      default: 30
    },
    question_count: {
      type: 'number',
      description: 'Number of questions to practice (default: 5)',
      minimum: 1,
      maximum: 15,
      default: 5
    }
  },
  required: ['role_level'],
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const startInterviewPreparationDescription = 
  'Starts an interactive PM interview preparation session with personalized questions based on role level and target company. Returns session details, first question, and guidance for structured practice using PM frameworks like STAR, CIRCLES, and RICE.';