/**
 * Case Study Helper Tests
 */

import { CaseStudyHelper } from '../../components/case-study-helper/index';
import { CaseType, CaseFramework } from '../../models/interview';

describe('CaseStudyHelper', () => {
  let caseStudyHelper: CaseStudyHelper;

  beforeEach(() => {
    caseStudyHelper = new CaseStudyHelper({
      enableHints: true,
      timeTracking: true,
      autoProgression: false,
      evaluationMode: 'step_complete',
      marketDataIntegration: false,
      adaptiveDifficulty: false,
      personalizedRecommendations: true
    });
  });

  describe('Case Management', () => {
    it('should return available cases', () => {
      const cases = caseStudyHelper.getAvailableCases();
      expect(cases.length).toBeGreaterThan(0);
      expect(cases[0]).toHaveProperty('id');
      expect(cases[0]).toHaveProperty('type');
      expect(cases[0]).toHaveProperty('title');
    });

    it('should filter cases by type', () => {
      const productDesignCases = caseStudyHelper.getAvailableCases({ type: 'product_design' });
      expect(productDesignCases.length).toBeGreaterThan(0);
      productDesignCases.forEach(caseStudy => {
        expect(caseStudy.type).toBe('product_design');
      });
    });

    it('should filter cases by difficulty', () => {
      const easyCases = caseStudyHelper.getAvailableCases({ difficulty: 3 });
      easyCases.forEach(caseStudy => {
        expect(caseStudy.difficulty).toBe(3);
      });
    });

    it('should get random case', () => {
      const randomCase = caseStudyHelper.getRandomCase();
      expect(randomCase).toBeTruthy();
      expect(randomCase).toHaveProperty('id');
    });

    it('should get case by ID', () => {
      const cases = caseStudyHelper.getAvailableCases();
      const firstCase = cases[0];
      const retrievedCase = caseStudyHelper.getCaseById(firstCase.id);
      expect(retrievedCase).toEqual(firstCase);
    });
  });

  describe('Case Study Session', () => {
    it('should start a case study session', async () => {
      const cases = caseStudyHelper.getAvailableCases();
      const testCase = cases[0];
      
      const result = await caseStudyHelper.startCaseStudy(testCase.id, 'test-user');
      
      expect(result).toBeTruthy();
      expect(result!.session).toHaveProperty('sessionId');
      expect(result!.session.caseStudy.id).toBe(testCase.id);
      expect(result!.firstStep).toHaveProperty('stepNumber', 1);
    });

    it('should get current step', async () => {
      const cases = caseStudyHelper.getAvailableCases();
      const testCase = cases[0];
      
      const result = await caseStudyHelper.startCaseStudy(testCase.id);
      const currentStep = caseStudyHelper.getCurrentStep(result!.session.sessionId);
      
      expect(currentStep).toBeTruthy();
      expect(currentStep!.stepNumber).toBe(1);
    });

    it('should submit step response', async () => {
      const cases = caseStudyHelper.getAvailableCases();
      const testCase = cases[0];
      
      const result = await caseStudyHelper.startCaseStudy(testCase.id);
      const sessionId = result!.session.sessionId;
      
      const response = await caseStudyHelper.submitStepResponse(
        sessionId,
        'This is a test response analyzing the problem using structured thinking.',
        ['CIRCLES']
      );
      
      expect(response.success).toBe(true);
      expect(response.evaluation).toBeTruthy();
      expect(response.evaluation!.score).toBeGreaterThan(0);
    });

    it('should provide hints', async () => {
      const cases = caseStudyHelper.getAvailableCases();
      const testCase = cases[0];
      
      const result = await caseStudyHelper.startCaseStudy(testCase.id);
      const sessionId = result!.session.sessionId;
      
      const hint = caseStudyHelper.getHint(sessionId, 'gentle');
      expect(hint).toBeTruthy();
      expect(hint!).toHaveProperty('content');
      expect(hint!).toHaveProperty('level', 'gentle');
    });

    it('should get framework guidance', async () => {
      const cases = caseStudyHelper.getAvailableCases();
      const testCase = cases[0];
      
      const result = await caseStudyHelper.startCaseStudy(testCase.id);
      const sessionId = result!.session.sessionId;
      
      const guidance = caseStudyHelper.getFrameworkGuidance(sessionId);
      expect(Array.isArray(guidance)).toBe(true);
    });

    it('should track progress', async () => {
      const cases = caseStudyHelper.getAvailableCases();
      const testCase = cases[0];
      
      const result = await caseStudyHelper.startCaseStudy(testCase.id);
      const sessionId = result!.session.sessionId;
      
      const progress = caseStudyHelper.getProgress(sessionId);
      expect(progress).toBeTruthy();
      expect(progress!.stepsCompleted).toBe(0);
      expect(progress!.totalSteps).toBeGreaterThan(0);
      expect(progress!.overallProgress).toBe(0);
    });
  });

  describe('Case Statistics', () => {
    it('should return case statistics', () => {
      const stats = caseStudyHelper.getCaseStatistics();
      
      expect(stats).toHaveProperty('totalCases');
      expect(stats.totalCases).toBeGreaterThan(0);
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byDifficulty');
      expect(stats).toHaveProperty('byFramework');
    });
  });

  describe('Custom Cases', () => {
    it('should create custom case from template', () => {
      const customCase = caseStudyHelper.createCustomCase('CIRCLES Product Design', {
        scenario: 'Design a mobile app for pet owners',
        industry: 'Pet Care',
        company: 'PetTech Inc',
        difficulty: 4
      });
      
      expect(customCase).toBeTruthy();
      expect(customCase!.title).toContain('Custom');
      expect(customCase!.industry).toBe('Pet Care');
      expect(customCase!.company).toBe('PetTech Inc');
      expect(customCase!.difficulty).toBe(4);
    });
  });

  describe('User Help Detection', () => {
    it('should detect when user needs help', async () => {
      const cases = caseStudyHelper.getAvailableCases();
      const testCase = cases[0];
      
      const result = await caseStudyHelper.startCaseStudy(testCase.id);
      const sessionId = result!.session.sessionId;
      
      const helpStatus = caseStudyHelper.checkIfUserNeedsHelp(sessionId);
      
      expect(helpStatus).toHaveProperty('isStuck');
      expect(helpStatus).toHaveProperty('suggestions');
      expect(helpStatus).toHaveProperty('availableHints');
      expect(Array.isArray(helpStatus.suggestions)).toBe(true);
      expect(Array.isArray(helpStatus.availableHints)).toBe(true);
    });
  });
});