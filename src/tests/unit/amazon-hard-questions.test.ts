/**
 * Unit tests for Amazon Working Backwards - Hard Questions Service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { HardQuestionsService } from '../../services/amazon/hard-questions';
import { QuestionContext, HardQuestion } from '../../models/questions';
import { AssumptionLedger } from '../../models/assumptions';

describe('HardQuestionsService', () => {
  let service: HardQuestionsService;
  let sampleContext: QuestionContext;

  beforeEach(() => {
    service = new HardQuestionsService();

    const sampleLedger: AssumptionLedger = {
      assumptions: [
        {
          id: 'A1',
          name: 'Market Size',
          value: 10000000,
          sourceUrls: [],
          certainty: 'Low',
          lastChecked: new Date(),
          category: 'market',
          impact: 'critical',
        },
        {
          id: 'A2',
          name: 'Development Cost',
          value: 500000,
          sourceUrls: ['http://example.com'],
          certainty: 'Medium',
          lastChecked: new Date(),
          category: 'financial',
          impact: 'critical',
        },
        {
          id: 'A3',
          name: 'Timeline',
          value: '6 months',
          sourceUrls: [],
          certainty: 'Low',
          lastChecked: new Date(),
          category: 'technical',
          impact: 'important',
        },
      ],
      coverage_pct: 33,
      lastUpdated: new Date(),
      totalClaims: 3,
      backedClaims: 1,
    };

    sampleContext = {
      ledger: sampleLedger,
      weakestIds: ['A1', 'A3'], // Low certainty assumptions
      businessContext: 'AI-powered enterprise software solution',
      competitiveContext: 'Competing with established players like Salesforce and Microsoft',
    };
  });

  describe('generateQuestions', () => {
    it('should successfully generate hard questions', async () => {
      const result = await service.generateQuestions(sampleContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const questions = result.data!;
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(10); // Should limit to 10
    });

    it('should generate questions with proper structure', async () => {
      const result = await service.generateQuestions(sampleContext);

      expect(result.success).toBe(true);
      const questions = result.data!;

      questions.forEach(question => {
        expect(question.id).toBeGreaterThan(0);
        expect(question.question).toBeDefined();
        expect(question.question.length).toBeGreaterThan(0);
        expect(question.targetAssumptions).toBeDefined();
        expect(Array.isArray(question.targetAssumptions)).toBe(true);
        expect(['market', 'financial', 'competitive', 'execution', 'timing']).toContain(
          question.category
        );
        expect(['critical', 'important', 'clarifying']).toContain(question.severity);
        expect(question.evidenceNeeded).toBeDefined();
        expect(Array.isArray(question.evidenceNeeded)).toBe(true);
      });
    });

    it('should generate assumption-specific challenges for weakest assumptions', async () => {
      const result = await service.generateQuestions(sampleContext);

      expect(result.success).toBe(true);
      const questions = result.data!;

      // Should have questions targeting weakest assumptions
      const assumptionQuestions = questions.filter(q =>
        q.targetAssumptions.some(id => sampleContext.weakestIds.includes(id))
      );

      expect(assumptionQuestions.length).toBeGreaterThan(0);

      // Check that questions have valid target assumptions
      assumptionQuestions.forEach(question => {
        expect(question.targetAssumptions.length).toBeGreaterThan(0);
        question.targetAssumptions.forEach(id => {
          const assumption = sampleContext.ledger.assumptions.find(a => a.id === id);
          expect(assumption).toBeDefined();
        });
      });
    });

    it('should generate different categories of questions', async () => {
      const result = await service.generateQuestions(sampleContext);

      expect(result.success).toBe(true);
      const questions = result.data!;

      const categories = new Set(questions.map(q => q.category));
      expect(categories.size).toBeGreaterThan(1); // Should have multiple categories

      // Should include market questions for market assumptions
      expect(questions.some(q => q.category === 'market')).toBe(true);

      // Should include financial questions for financial assumptions
      expect(questions.some(q => q.category === 'financial')).toBe(true);
    });

    it('should include competitive questions when competitive context provided', async () => {
      const result = await service.generateQuestions(sampleContext);

      expect(result.success).toBe(true);
      const questions = result.data!;

      const competitiveQuestions = questions.filter(q => q.category === 'competitive');
      expect(competitiveQuestions.length).toBeGreaterThan(0);

      // Questions should reference competitive context
      competitiveQuestions.forEach(question => {
        expect(question.question.toLowerCase()).toMatch(/compet|rival|market/);
      });
    });

    it('should assign appropriate severity levels', async () => {
      const result = await service.generateQuestions(sampleContext);

      expect(result.success).toBe(true);
      const questions = result.data!;

      // Questions targeting critical assumptions should have higher severity
      const criticalAssumptionQuestions = questions.filter(q =>
        q.targetAssumptions.some(id => {
          const assumption = sampleContext.ledger.assumptions.find(a => a.id === id);
          return assumption?.impact === 'critical';
        })
      );

      criticalAssumptionQuestions.forEach(question => {
        expect(['critical', 'important']).toContain(question.severity);
      });
    });

    it('should provide evidence recommendations for each question', async () => {
      const result = await service.generateQuestions(sampleContext);

      expect(result.success).toBe(true);
      const questions = result.data!;

      questions.forEach(question => {
        expect(question.evidenceNeeded).toBeDefined();
        expect(question.evidenceNeeded.length).toBeGreaterThan(0);

        question.evidenceNeeded.forEach(evidence => {
          expect(evidence).toBeDefined();
          expect(evidence.length).toBeGreaterThan(0);
        });
      });
    });

    it('should handle empty weakest IDs gracefully', async () => {
      const contextWithoutWeakIds: QuestionContext = {
        ...sampleContext,
        weakestIds: [],
      };

      const result = await service.generateQuestions(contextWithoutWeakIds);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0); // Should still generate other types of questions
    });

    it('should handle errors gracefully', async () => {
      const invalidContext = null as any;

      const result = await service.generateQuestions(invalidContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HARD_QUESTIONS_GENERATION_ERROR');
    });
  });

  describe('prioritizeQuestions', () => {
    it('should prioritize questions by severity', async () => {
      const questions: HardQuestion[] = [
        {
          id: 1,
          question: 'Clarifying question',
          targetAssumptions: ['A1'],
          category: 'market',
          severity: 'clarifying',
          evidenceNeeded: ['Evidence 1'],
        },
        {
          id: 2,
          question: 'Critical question',
          targetAssumptions: ['A1'],
          category: 'financial',
          severity: 'critical',
          evidenceNeeded: ['Evidence 2'],
        },
        {
          id: 3,
          question: 'Important question',
          targetAssumptions: ['A1'],
          category: 'execution',
          severity: 'important',
          evidenceNeeded: ['Evidence 3'],
        },
      ];

      const result = await service.prioritizeQuestions(questions);

      expect(result.success).toBe(true);
      const prioritized = result.data!;

      expect(prioritized[0].severity).toBe('critical');
      expect(prioritized[1].severity).toBe('important');
      expect(prioritized[2].severity).toBe('clarifying');
    });

    it('should use number of target assumptions as secondary sort', async () => {
      const questions: HardQuestion[] = [
        {
          id: 1,
          question: 'Question with one assumption',
          targetAssumptions: ['A1'],
          category: 'market',
          severity: 'important',
          evidenceNeeded: ['Evidence 1'],
        },
        {
          id: 2,
          question: 'Question with multiple assumptions',
          targetAssumptions: ['A1', 'A2', 'A3'],
          category: 'financial',
          severity: 'important',
          evidenceNeeded: ['Evidence 2'],
        },
      ];

      const result = await service.prioritizeQuestions(questions);

      expect(result.success).toBe(true);
      const prioritized = result.data!;

      // Question with more target assumptions should come first (same severity)
      expect(prioritized[0].targetAssumptions.length).toBe(3);
      expect(prioritized[1].targetAssumptions.length).toBe(1);
    });

    it('should handle empty questions array', async () => {
      const result = await service.prioritizeQuestions([]);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      const invalidQuestions = null as any;

      const result = await service.prioritizeQuestions(invalidQuestions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QUESTION_PRIORITIZATION_ERROR');
    });
  });

  describe('suggestEvidence', () => {
    it('should suggest appropriate evidence for market questions', async () => {
      const marketQuestion: HardQuestion = {
        id: 1,
        question: 'What if the market size is smaller than projected?',
        targetAssumptions: ['A1'],
        category: 'market',
        severity: 'critical',
        evidenceNeeded: ['Market research'],
      };

      const result = await service.suggestEvidence(marketQuestion);

      expect(result.success).toBe(true);
      const recommendations = result.data!;

      expect(recommendations.length).toBeGreaterThan(0);

      // Should include market-specific recommendations
      const marketRecommendations = recommendations.filter(
        r =>
          r.description.toLowerCase().includes('market') ||
          r.description.toLowerCase().includes('customer')
      );
      expect(marketRecommendations.length).toBeGreaterThan(0);
    });

    it('should suggest appropriate evidence for financial questions', async () => {
      const financialQuestion: HardQuestion = {
        id: 1,
        question: 'What if development costs are higher?',
        targetAssumptions: ['A2'],
        category: 'financial',
        severity: 'critical',
        evidenceNeeded: ['Cost analysis'],
      };

      const result = await service.suggestEvidence(financialQuestion);

      expect(result.success).toBe(true);
      const recommendations = result.data!;

      expect(recommendations.length).toBeGreaterThan(0);

      // Should include financial-specific recommendations
      const financialRecommendations = recommendations.filter(
        r =>
          r.description.toLowerCase().includes('financial') ||
          r.description.toLowerCase().includes('cost') ||
          r.description.toLowerCase().includes('model')
      );
      expect(financialRecommendations.length).toBeGreaterThan(0);
    });

    it('should suggest appropriate evidence for competitive questions', async () => {
      const competitiveQuestion: HardQuestion = {
        id: 1,
        question: 'How will competitors respond?',
        targetAssumptions: ['A1'],
        category: 'competitive',
        severity: 'important',
        evidenceNeeded: ['Competitive analysis'],
      };

      const result = await service.suggestEvidence(competitiveQuestion);

      expect(result.success).toBe(true);
      const recommendations = result.data!;

      expect(recommendations.length).toBeGreaterThan(0);

      // Should include competitive-specific recommendations
      const competitiveRecommendations = recommendations.filter(
        r =>
          r.description.toLowerCase().includes('competitive') ||
          r.description.toLowerCase().includes('competitor')
      );
      expect(competitiveRecommendations.length).toBeGreaterThan(0);
    });

    it('should suggest appropriate evidence for execution questions', async () => {
      const executionQuestion: HardQuestion = {
        id: 1,
        question: 'Do we have the technical capabilities?',
        targetAssumptions: ['A3'],
        category: 'execution',
        severity: 'important',
        evidenceNeeded: ['Technical assessment'],
      };

      const result = await service.suggestEvidence(executionQuestion);

      expect(result.success).toBe(true);
      const recommendations = result.data!;

      expect(recommendations.length).toBeGreaterThan(0);

      // Should include execution-specific recommendations
      const executionRecommendations = recommendations.filter(
        r =>
          r.description.toLowerCase().includes('technical') ||
          r.description.toLowerCase().includes('feasibility') ||
          r.description.toLowerCase().includes('resource')
      );
      expect(executionRecommendations.length).toBeGreaterThan(0);
    });

    it('should suggest appropriate evidence for timing questions', async () => {
      const timingQuestion: HardQuestion = {
        id: 1,
        question: 'Is now the right time?',
        targetAssumptions: ['A1'],
        category: 'timing',
        severity: 'important',
        evidenceNeeded: ['Market timing analysis'],
      };

      const result = await service.suggestEvidence(timingQuestion);

      expect(result.success).toBe(true);
      const recommendations = result.data!;

      expect(recommendations.length).toBeGreaterThan(0);

      // Should include timing-specific recommendations
      const timingRecommendations = recommendations.filter(
        r =>
          r.description.toLowerCase().includes('timing') ||
          r.description.toLowerCase().includes('trend') ||
          r.description.toLowerCase().includes('regulatory')
      );
      expect(timingRecommendations.length).toBeGreaterThan(0);
    });

    it('should provide structured evidence recommendations', async () => {
      const question: HardQuestion = {
        id: 1,
        question: 'Test question',
        targetAssumptions: ['A1'],
        category: 'market',
        severity: 'critical',
        evidenceNeeded: ['Evidence'],
      };

      const result = await service.suggestEvidence(question);

      expect(result.success).toBe(true);
      const recommendations = result.data!;

      recommendations.forEach(rec => {
        expect(['data_source', 'research_study', 'validation_method']).toContain(rec.type);
        expect(rec.description).toBeDefined();
        expect(rec.description.length).toBeGreaterThan(0);
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(rec.estimatedEffort).toBeDefined();
        expect(rec.estimatedEffort.length).toBeGreaterThan(0);
      });
    });

    it('should handle errors gracefully', async () => {
      const invalidQuestion = null as any;

      const result = await service.suggestEvidence(invalidQuestion);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EVIDENCE_SUGGESTION_ERROR');
    });
  });
});
