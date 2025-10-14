/**
 * Interview Preparation Core Component
 * Main orchestrator for PM interview preparation functionality
 */

import {
  InterviewQuestion,
  InterviewSession,
  InterviewFeedback,
  QuestionGenerationConfig,
  ResponseEvaluation,
  RoleLevel,
  QuestionCategory,
  SessionProgress
} from '../../models/interview';
import { InterviewQuestionBank } from '../interview-question-bank/index';
import { InterviewQuestionGenerator, QuestionGenerationResult } from '../interview-question-generator/index';
import { InterviewResponseEvaluator, EvaluationConfig } from '../interview-response-evaluator/index';

export interface InterviewPrepConfig {
  roleLevel: RoleLevel;
  company?: string;
  focusAreas?: QuestionCategory[];
  sessionDuration?: number; // minutes
  questionCount?: number;
}

export interface InterviewPrepResult {
  session: InterviewSession;
  currentQuestion: InterviewQuestion;
  progress: SessionProgress;
  recommendations: string[];
}

export class InterviewPreparationCore {
  private questionBank: InterviewQuestionBank;
  private questionGenerator: InterviewQuestionGenerator;
  private responseEvaluator: InterviewResponseEvaluator;
  private activeSessions: Map<string, InterviewSession> = new Map();

  constructor() {
    this.questionBank = new InterviewQuestionBank();
    this.questionGenerator = new InterviewQuestionGenerator(this.questionBank);
    this.responseEvaluator = new InterviewResponseEvaluator();
  }

  /**
   * Start a new interview preparation session
   */
  async startInterviewSession(config: InterviewPrepConfig): Promise<InterviewPrepResult> {
    try {
      const sessionId = this.generateSessionId();
      const session: InterviewSession = {
        sessionId,
        roleLevel: config.roleLevel,
        company: config.company,
        startTime: new Date(),
        questionsAsked: [],
        responses: [],
        overallProgress: this.initializeProgress()
      };

      // Generate first question
      const questionConfig: QuestionGenerationConfig = {
        roleLevel: config.roleLevel,
        company: config.company,
        category: config.focusAreas?.[0]
      };

      const questionResult = await this.questionGenerator.generateQuestion(questionConfig);
      session.currentQuestion = questionResult.question;
      session.questionsAsked.push(questionResult.question.id);

      this.activeSessions.set(sessionId, session);

      return {
        session,
        currentQuestion: questionResult.question,
        progress: session.overallProgress,
        recommendations: this.generateInitialRecommendations(config)
      };
    } catch (error) {
      throw new Error(`Failed to start interview session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit a response and get the next question
   */
  async submitResponse(
    sessionId: string,
    response: string,
    evaluationConfig?: EvaluationConfig
  ): Promise<{
    feedback: InterviewFeedback;
    nextQuestion?: InterviewQuestion;
    sessionComplete: boolean;
    progress: SessionProgress;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.currentQuestion) {
      throw new Error('Invalid session or no current question');
    }

    try {
      // Evaluate the response
      const evaluation = await this.responseEvaluator.evaluateResponse(
        session.currentQuestion,
        response,
        evaluationConfig
      );

      // Create feedback record
      const feedback: InterviewFeedback = {
        questionId: session.currentQuestion.id,
        userResponse: response,
        evaluation,
        timestamp: new Date(),
        sessionId
      };

      // Update session
      session.responses.push(feedback);
      session.overallProgress = this.updateProgress(session);

      // Determine if session should continue
      const sessionComplete = this.shouldEndSession(session);
      let nextQuestion: InterviewQuestion | undefined;

      if (!sessionComplete) {
        // Generate next question
        const nextQuestionResult = await this.questionGenerator.getNextQuestion(session);
        nextQuestion = nextQuestionResult.question;
        session.currentQuestion = nextQuestion;
        session.questionsAsked.push(nextQuestion.id);
      } else {
        session.currentQuestion = undefined;
      }

      // Update stored session
      this.activeSessions.set(sessionId, session);

      return {
        feedback,
        nextQuestion,
        sessionComplete,
        progress: session.overallProgress
      };
    } catch (error) {
      throw new Error(`Failed to submit response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific question by ID or filters
   */
  async getQuestion(filters?: {
    category?: QuestionCategory;
    roleLevel?: RoleLevel;
    difficulty?: number;
    company?: string;
  }): Promise<QuestionGenerationResult> {
    const config: QuestionGenerationConfig = {
      roleLevel: filters?.roleLevel || 'PM',
      category: filters?.category,
      difficulty: filters?.difficulty,
      company: filters?.company
    };

    return this.questionGenerator.generateQuestion(config);
  }

  /**
   * Evaluate a standalone response
   */
  async evaluateStandaloneResponse(
    questionId: string,
    response: string,
    config?: EvaluationConfig
  ): Promise<ResponseEvaluation> {
    const question = this.questionBank.getQuestionById(questionId);
    if (!question) {
      throw new Error(`Question with ID ${questionId} not found`);
    }

    return this.responseEvaluator.evaluateResponse(question, response, config);
  }

  /**
   * Get session progress and analytics
   */
  getSessionProgress(sessionId: string): SessionProgress | null {
    const session = this.activeSessions.get(sessionId);
    return session ? session.overallProgress : null;
  }

  /**
   * Get session summary and recommendations
   */
  getSessionSummary(sessionId: string): {
    session: InterviewSession;
    summary: {
      totalQuestions: number;
      averageScore: number;
      strongAreas: string[];
      improvementAreas: string[];
      nextSteps: string[];
    };
  } | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    const totalQuestions = session.responses.length;
    const averageScore = totalQuestions > 0
      ? session.responses.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / totalQuestions
      : 0;

    // Analyze performance by category
    const categoryPerformance = this.analyzeCategoryPerformance(session);
    const strongAreas = Object.entries(categoryPerformance)
      .filter(([_, score]) => score >= 4)
      .map(([category, _]) => category);
    
    const improvementAreas = Object.entries(categoryPerformance)
      .filter(([_, score]) => score < 3)
      .map(([category, _]) => category);

    // Generate next steps
    const nextSteps = this.generateSessionNextSteps(session);

    return {
      session,
      summary: {
        totalQuestions,
        averageScore,
        strongAreas,
        improvementAreas,
        nextSteps
      }
    };
  }

  /**
   * Get question bank statistics
   */
  getQuestionBankStats() {
    return this.questionBank.getQuestionStats();
  }

  /**
   * End a session
   */
  endSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeProgress(): SessionProgress {
    return {
      questionsCompleted: 0,
      averageScore: 0,
      categoryScores: {
        behavioral: 0,
        product_sense: 0,
        analytical: 0,
        technical: 0
      },
      frameworkProficiency: {
        STAR: 0,
        CIRCLES: 0,
        RICE: 0,
        SWOT: 0,
        'Jobs-to-be-Done': 0,
        'North Star': 0
      },
      timeElapsed: 0,
      recommendedFocus: []
    };
  }

  private updateProgress(session: InterviewSession): SessionProgress {
    const responses = session.responses;
    const progress = { ...session.overallProgress };

    progress.questionsCompleted = responses.length;
    progress.timeElapsed = Date.now() - session.startTime.getTime();

    if (responses.length > 0) {
      // Calculate average score
      progress.averageScore = responses.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / responses.length;

      // Calculate category scores
      const categoryGroups = this.groupResponsesByCategory(responses);
      Object.entries(categoryGroups).forEach(([category, categoryResponses]) => {
        const avgScore = categoryResponses.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / categoryResponses.length;
        progress.categoryScores[category as QuestionCategory] = avgScore;
      });

      // Calculate framework proficiency
      const frameworkScores = this.calculateFrameworkProficiency(responses);
      progress.frameworkProficiency = { ...progress.frameworkProficiency, ...frameworkScores };

      // Generate recommendations
      progress.recommendedFocus = this.generateFocusRecommendations(progress);
    }

    return progress;
  }

  private shouldEndSession(session: InterviewSession): boolean {
    // End session after 5 questions or 30 minutes
    const maxQuestions = 5;
    const maxDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

    const questionLimit = session.responses.length >= maxQuestions;
    const timeLimit = (Date.now() - session.startTime.getTime()) >= maxDuration;

    return questionLimit || timeLimit;
  }

  private generateInitialRecommendations(config: InterviewPrepConfig): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Preparing for ${config.roleLevel} level interviews`);
    
    if (config.company) {
      recommendations.push(`Focus on ${config.company}-specific interview patterns`);
    }

    if (config.focusAreas && config.focusAreas.length > 0) {
      recommendations.push(`Emphasizing ${config.focusAreas.join(', ')} questions`);
    }

    recommendations.push('Use structured frameworks like STAR for behavioral questions');
    recommendations.push('Practice with specific examples from your experience');

    return recommendations;
  }

  private analyzeCategoryPerformance(session: InterviewSession): Record<string, number> {
    const categoryGroups = this.groupResponsesByCategory(session.responses);
    const performance: Record<string, number> = {};

    Object.entries(categoryGroups).forEach(([category, responses]) => {
      const avgScore = responses.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / responses.length;
      performance[category] = avgScore;
    });

    return performance;
  }

  private groupResponsesByCategory(responses: InterviewFeedback[]): Record<string, InterviewFeedback[]> {
    const groups: Record<string, InterviewFeedback[]> = {};

    responses.forEach(response => {
      const question = this.questionBank.getQuestionById(response.questionId);
      if (question) {
        const category = question.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(response);
      }
    });

    return groups;
  }

  private calculateFrameworkProficiency(responses: InterviewFeedback[]): Record<string, number> {
    const frameworkScores: Record<string, number[]> = {};

    responses.forEach(response => {
      response.evaluation.frameworkAnalysis.forEach(fa => {
        if (!frameworkScores[fa.framework]) {
          frameworkScores[fa.framework] = [];
        }
        frameworkScores[fa.framework].push(fa.score);
      });
    });

    const proficiency: Record<string, number> = {};
    Object.entries(frameworkScores).forEach(([framework, scores]) => {
      proficiency[framework] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    return proficiency;
  }

  private generateFocusRecommendations(progress: SessionProgress): string[] {
    const recommendations: string[] = [];

    // Identify weak categories
    const weakCategories = Object.entries(progress.categoryScores)
      .filter(([_, score]) => score < 3)
      .map(([category, _]) => category);

    if (weakCategories.length > 0) {
      recommendations.push(`Focus on improving: ${weakCategories.join(', ')}`);
    }

    // Identify weak frameworks
    const weakFrameworks = Object.entries(progress.frameworkProficiency)
      .filter(([_, score]) => score < 0.6)
      .map(([framework, _]) => framework);

    if (weakFrameworks.length > 0) {
      recommendations.push(`Practice frameworks: ${weakFrameworks.join(', ')}`);
    }

    // General recommendations based on overall performance
    if (progress.averageScore < 3) {
      recommendations.push('Focus on providing more specific examples and metrics');
      recommendations.push('Practice structuring responses with clear frameworks');
    }

    return recommendations;
  }

  private generateSessionNextSteps(session: InterviewSession): string[] {
    const nextSteps: string[] = [];
    const progress = session.overallProgress;

    // Category-specific next steps
    Object.entries(progress.categoryScores).forEach(([category, score]) => {
      if (score < 3) {
        switch (category) {
          case 'behavioral':
            nextSteps.push('Practice more STAR method responses with specific examples');
            break;
          case 'product_sense':
            nextSteps.push('Study product frameworks and practice product design cases');
            break;
          case 'analytical':
            nextSteps.push('Work on structured problem-solving and metrics analysis');
            break;
          case 'technical':
            nextSteps.push('Review technical concepts and practice clear explanations');
            break;
        }
      }
    });

    // Framework-specific next steps
    Object.entries(progress.frameworkProficiency).forEach(([framework, score]) => {
      if (score < 0.6) {
        nextSteps.push(`Study and practice ${framework} framework structure`);
      }
    });

    // General next steps
    if (progress.averageScore < 3.5) {
      nextSteps.push('Prepare a bank of specific examples with quantifiable results');
      nextSteps.push('Practice mock interviews with peers or mentors');
    }

    return [...new Set(nextSteps)]; // Remove duplicates
  }
}