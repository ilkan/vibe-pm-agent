/**
 * Unit tests for Interview Preparation Core Component
 */

import { InterviewPreparationCore } from '../../components/interview-preparation-core/index';
import { RoleLevel, QuestionCategory } from '../../models/interview';

describe('InterviewPreparationCore', () => {
  let interviewCore: InterviewPreparationCore;

  beforeEach(() => {
    interviewCore = new InterviewPreparationCore();
  });

  describe('startInterviewSession', () => {
    it('should create a new interview session with initial question', async () => {
      const config = {
        roleLevel: 'PM' as RoleLevel,
        company: 'Google',
        focusAreas: ['behavioral' as QuestionCategory]
      };

      const result = await interviewCore.startInterviewSession(config);

      expect(result.session).toBeDefined();
      expect(result.session.roleLevel).toBe('PM');
      expect(result.session.company).toBe('Google');
      expect(result.currentQuestion).toBeDefined();
      expect(result.currentQuestion.roleLevel).toContain('PM');
      expect(result.progress).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate appropriate question for role level', async () => {
      const config = {
        roleLevel: 'Senior PM' as RoleLevel
      };

      const result = await interviewCore.startInterviewSession(config);

      expect(result.currentQuestion.roleLevel).toContain('Senior PM');
      expect(result.currentQuestion.difficulty).toBeGreaterThanOrEqual(3);
    });
  });

  describe('submitResponse', () => {
    it('should evaluate response and provide feedback', async () => {
      // Start session
      const config = { roleLevel: 'PM' as RoleLevel };
      const sessionResult = await interviewCore.startInterviewSession(config);
      const sessionId = sessionResult.session.sessionId;

      // Submit response
      const response = 'In my previous role as a PM at TechCorp, I faced a situation where our user engagement dropped 20%. The task was to identify the root cause and implement a solution. I took action by analyzing user data, conducting interviews, and A/B testing solutions. The result was a 15% increase in engagement within 3 months.';

      const result = await interviewCore.submitResponse(sessionId, response);

      expect(result.feedback).toBeDefined();
      expect(result.feedback.evaluation.overallScore).toBeGreaterThanOrEqual(1);
      expect(result.feedback.evaluation.overallScore).toBeLessThanOrEqual(5);
      expect(result.feedback.evaluation.strengths).toBeInstanceOf(Array);
      expect(result.feedback.evaluation.improvements).toBeInstanceOf(Array);
      expect(result.progress.questionsCompleted).toBe(1);
    });

    it('should generate next question after response', async () => {
      const config = { roleLevel: 'PM' as RoleLevel };
      const sessionResult = await interviewCore.startInterviewSession(config);
      const sessionId = sessionResult.session.sessionId;

      const response = 'Sample response to the question.';
      const result = await interviewCore.submitResponse(sessionId, response);

      if (!result.sessionComplete) {
        expect(result.nextQuestion).toBeDefined();
        expect(result.nextQuestion!.id).not.toBe(sessionResult.currentQuestion.id);
      }
    });
  });

  describe('getQuestion', () => {
    it('should return question matching filters', async () => {
      const filters = {
        category: 'behavioral' as QuestionCategory,
        roleLevel: 'PM' as RoleLevel,
        difficulty: 3
      };

      const result = await interviewCore.getQuestion(filters);

      expect(result.question).toBeDefined();
      expect(result.question.category).toBe('behavioral');
      expect(result.question.roleLevel).toContain('PM');
      expect(result.question.difficulty).toBe(3);
      expect(result.reasoning).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.alternatives).toBeInstanceOf(Array);
    });
  });

  describe('evaluateStandaloneResponse', () => {
    it('should evaluate response without session context', async () => {
      const stats = interviewCore.getQuestionBankStats();
      const firstQuestionId = Object.keys(stats.byCategory)[0];
      
      // Get a question ID from the question bank
      const questionResult = await interviewCore.getQuestion({ category: 'behavioral' as QuestionCategory });
      const questionId = questionResult.question.id;

      const response = 'This is a test response using the STAR method. Situation: I was working on a product launch. Task: I needed to coordinate with multiple teams. Action: I created a detailed project plan and held daily standups. Result: We launched on time with 95% user satisfaction.';

      const evaluation = await interviewCore.evaluateStandaloneResponse(questionId, response);

      expect(evaluation.overallScore).toBeGreaterThanOrEqual(1);
      expect(evaluation.overallScore).toBeLessThanOrEqual(5);
      expect(evaluation.frameworkAnalysis).toBeInstanceOf(Array);
      expect(evaluation.strengths).toBeInstanceOf(Array);
      expect(evaluation.improvements).toBeInstanceOf(Array);
      expect(evaluation.nextSteps).toBeInstanceOf(Array);
    });
  });

  describe('getQuestionBankStats', () => {
    it('should return question bank statistics', () => {
      const stats = interviewCore.getQuestionBankStats();

      expect(stats.totalQuestions).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byRole).toBeDefined();
      expect(stats.byDifficulty).toBeDefined();
      
      // Check that we have questions in each category
      expect(stats.byCategory.behavioral).toBeGreaterThan(0);
      expect(stats.byCategory.product_sense).toBeGreaterThan(0);
      expect(stats.byCategory.analytical).toBeGreaterThan(0);
      expect(stats.byCategory.technical).toBeGreaterThan(0);
    });
  });

  describe('session management', () => {
    it('should track session progress correctly', async () => {
      const config = { roleLevel: 'PM' as RoleLevel };
      const sessionResult = await interviewCore.startInterviewSession(config);
      const sessionId = sessionResult.session.sessionId;

      // Submit multiple responses
      const responses = [
        'First response with STAR method structure.',
        'Second response focusing on product sense.',
        'Third response with analytical thinking.'
      ];

      for (const response of responses) {
        const result = await interviewCore.submitResponse(sessionId, response);
        if (result.sessionComplete) break;
      }

      const progress = interviewCore.getSessionProgress(sessionId);
      expect(progress).toBeDefined();
      expect(progress!.questionsCompleted).toBeGreaterThan(0);
      expect(progress!.averageScore).toBeGreaterThan(0);
    });

    it('should generate session summary', async () => {
      const config = { roleLevel: 'PM' as RoleLevel };
      const sessionResult = await interviewCore.startInterviewSession(config);
      const sessionId = sessionResult.session.sessionId;

      // Submit a response
      await interviewCore.submitResponse(sessionId, 'Test response for summary generation.');

      const summary = interviewCore.getSessionSummary(sessionId);
      expect(summary).toBeDefined();
      expect(summary!.session).toBeDefined();
      expect(summary!.summary.totalQuestions).toBe(1);
      expect(summary!.summary.averageScore).toBeGreaterThan(0);
      expect(summary!.summary.nextSteps).toBeInstanceOf(Array);
    });

    it('should end session properly', async () => {
      const config = { roleLevel: 'PM' as RoleLevel };
      const sessionResult = await interviewCore.startInterviewSession(config);
      const sessionId = sessionResult.session.sessionId;

      const ended = interviewCore.endSession(sessionId);
      expect(ended).toBe(true);

      const progress = interviewCore.getSessionProgress(sessionId);
      expect(progress).toBeNull();
    });
  });
});