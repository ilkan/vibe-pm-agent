/**
 * Unit tests for Amazon Working Backwards - Confidence Scoring Service
 */

import { ConfidenceService } from '../../services/amazon/confidence';
import { ConfidenceContext, Citation, ConfidenceScore } from '../../models/confidence';

describe('ConfidenceService', () => {
  let service: ConfidenceService;

  beforeEach(() => {
    service = new ConfidenceService();
  });

  describe('computeConfidence', () => {
    it('should calculate confidence score with all components', async () => {
      const context: ConfidenceContext = {
        citations: [
          {
            url: 'https://mckinsey.com/test-report',
            title: 'Market Analysis Report',
            date: '2024-01-15',
            rating: 'A',
            sourceType: 'industry_report',
          },
          {
            url: 'https://gartner.com/tech-trends',
            title: 'Technology Trends',
            date: '2024-02-01',
            rating: 'A',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 85,
        sensitivityRisk: 'low',
        assumptionCount: 10,
      };

      const result = await service.computeConfidence(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const score = result.data!;
      expect(score.total).toBeGreaterThan(0);
      expect(score.total).toBeLessThanOrEqual(100);
      expect(score.breakdown).toBeDefined();
      expect(score.explanation).toBeDefined();
      expect(typeof score.lowConfidence).toBe('boolean');
    });

    it('should return high confidence for excellent inputs', async () => {
      const context: ConfidenceContext = {
        citations: [
          {
            url: 'https://mckinsey.com/report1',
            title: 'Market Report',
            date: '2024-08-01',
            rating: 'A',
            sourceType: 'industry_report',
          },
          {
            url: 'https://gartner.com/report2',
            title: 'Tech Analysis',
            date: '2024-07-15',
            rating: 'A',
            sourceType: 'research',
          },
          {
            url: 'https://bloomberg.com/financial',
            title: 'Financial Data',
            date: '2024-08-10',
            rating: 'A',
            sourceType: 'financial_data',
          },
          {
            url: 'https://reuters.com/news',
            title: 'Market News',
            date: '2024-08-05',
            rating: 'A',
            sourceType: 'news',
          },
        ],
        ledgerCoveragePct: 95,
        sensitivityRisk: 'low',
        assumptionCount: 8,
      };

      const result = await service.computeConfidence(context);
      const score = result.data!;

      expect(score.total).toBeGreaterThan(80);
      expect(score.lowConfidence).toBe(false);
      expect(score.breakdown.evidence).toBeGreaterThan(80);
      expect(score.breakdown.diversity).toBe(100); // 4 different source types
    });

    it('should return low confidence for poor inputs', async () => {
      const context: ConfidenceContext = {
        citations: [
          {
            url: 'https://unknown-blog.com/post',
            title: 'Random Blog Post',
            date: '2020-01-01', // Very old
            rating: 'C',
            sourceType: 'news',
          },
        ],
        ledgerCoveragePct: 25,
        sensitivityRisk: 'high',
        assumptionCount: 15,
      };

      const result = await service.computeConfidence(context);
      const score = result.data!;

      expect(score.total).toBeLessThan(60);
      expect(score.lowConfidence).toBe(true);
      expect(score.explanation).toContain('Low confidence');
    });

    it('should handle empty citations gracefully', async () => {
      const context: ConfidenceContext = {
        citations: [],
        ledgerCoveragePct: 0,
        assumptionCount: 5,
      };

      const result = await service.computeConfidence(context);
      const score = result.data!;

      expect(score.total).toBeLessThan(60);
      expect(score.lowConfidence).toBe(true);
      expect(score.breakdown.evidence).toBe(0);
      expect(score.breakdown.diversity).toBe(0);
    });

    it('should calculate correct weighted total', async () => {
      const context: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com',
            title: 'Test',
            rating: 'A',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 80,
        sensitivityRisk: 'medium',
        assumptionCount: 5,
      };

      const result = await service.computeConfidence(context);
      const score = result.data!;
      const breakdown = score.breakdown;

      // Manually calculate expected weighted total
      const expectedTotal =
        breakdown.evidence * 0.25 +
        breakdown.recency * 0.2 +
        breakdown.diversity * 0.15 +
        breakdown.agreement * 0.15 +
        breakdown.coverage * 0.15 +
        breakdown.sensitivity * 0.1;

      expect(score.total).toBe(Math.round(expectedTotal));
    });
  });

  describe('explainScore', () => {
    it('should generate appropriate explanation for high confidence', () => {
      const score: ConfidenceScore = {
        total: 85,
        breakdown: {
          evidence: 90,
          recency: 85,
          diversity: 80,
          agreement: 85,
          coverage: 90,
          sensitivity: 75,
        },
        explanation: '',
        lowConfidence: false,
      };

      const explanation = service.explainScore(score);

      expect(explanation).toContain('High confidence');
      expect(explanation).toContain('evidence'); // Should mention strongest component
    });

    it('should generate appropriate explanation for moderate confidence', () => {
      const score: ConfidenceScore = {
        total: 70,
        breakdown: {
          evidence: 75,
          recency: 60,
          diversity: 70,
          agreement: 65,
          coverage: 80,
          sensitivity: 45, // Weakest component
        },
        explanation: '',
        lowConfidence: false,
      };

      const explanation = service.explainScore(score);

      expect(explanation).toContain('Moderate confidence');
      expect(explanation).toContain('sensitivity'); // Should mention weakest component
    });

    it('should generate appropriate explanation for low confidence', () => {
      const score: ConfidenceScore = {
        total: 45,
        breakdown: {
          evidence: 30, // Weakest
          recency: 50,
          diversity: 40,
          agreement: 60,
          coverage: 35,
          sensitivity: 55,
        },
        explanation: '',
        lowConfidence: true,
      };

      const explanation = service.explainScore(score);

      expect(explanation).toContain('Low confidence');
      expect(explanation).toContain('evidence'); // Should mention weakest component
      expect(explanation).toContain('human review recommended');
    });
  });

  describe('identifyImprovements', () => {
    it('should identify areas for improvement', () => {
      const score: ConfidenceScore = {
        total: 65,
        breakdown: {
          evidence: 50, // Needs improvement
          recency: 40, // Needs improvement
          diversity: 80, // Good
          agreement: 75, // Good
          coverage: 60, // Needs improvement
          sensitivity: 85, // Good
        },
        explanation: '',
        lowConfidence: false,
      };

      const improvements = service.identifyImprovements(score);

      expect(improvements.length).toBeGreaterThan(0);

      // Should be sorted by potential gain
      for (let i = 1; i < improvements.length; i++) {
        expect(improvements[i - 1].potentialGain).toBeGreaterThanOrEqual(
          improvements[i].potentialGain
        );
      }

      // Should include recommendations
      improvements.forEach(improvement => {
        expect(improvement.recommendation).toBeDefined();
        expect(improvement.recommendation.length).toBeGreaterThan(0);
      });
    });

    it('should not suggest improvements for high-scoring areas', () => {
      const score: ConfidenceScore = {
        total: 85,
        breakdown: {
          evidence: 90,
          recency: 85,
          diversity: 80,
          agreement: 85,
          coverage: 90,
          sensitivity: 75,
        },
        explanation: '',
        lowConfidence: false,
      };

      const improvements = service.identifyImprovements(score);

      // Should have few or no improvements for high scores
      expect(improvements.length).toBeLessThanOrEqual(2);
    });
  });

  describe('evidence scoring', () => {
    it('should score A-tier sources higher than C-tier', async () => {
      const contextA: ConfidenceContext = {
        citations: [
          {
            url: 'https://mckinsey.com/report',
            title: 'McKinsey Report',
            rating: 'A',
            sourceType: 'industry_report',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const contextC: ConfidenceContext = {
        citations: [
          {
            url: 'https://random-blog.com/post',
            title: 'Blog Post',
            rating: 'C',
            sourceType: 'news',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const resultA = await service.computeConfidence(contextA);
      const resultC = await service.computeConfidence(contextC);

      expect(resultA.data!.breakdown.evidence).toBeGreaterThan(resultC.data!.breakdown.evidence);
    });

    it('should give quantity bonus for multiple sources', async () => {
      const singleSource: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com/1',
            title: 'Report 1',
            rating: 'B',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const multipleSources: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com/1',
            title: 'Report 1',
            rating: 'B',
            sourceType: 'research',
          },
          {
            url: 'https://test.com/2',
            title: 'Report 2',
            rating: 'B',
            sourceType: 'research',
          },
          {
            url: 'https://test.com/3',
            title: 'Report 3',
            rating: 'B',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const singleResult = await service.computeConfidence(singleSource);
      const multipleResult = await service.computeConfidence(multipleSources);

      expect(multipleResult.data!.breakdown.evidence).toBeGreaterThan(
        singleResult.data!.breakdown.evidence
      );
    });
  });

  describe('recency scoring', () => {
    it('should score recent sources higher than old sources', async () => {
      const recentContext: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com/recent',
            title: 'Recent Report',
            date: '2024-08-01',
            rating: 'B',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const oldContext: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com/old',
            title: 'Old Report',
            date: '2020-01-01',
            rating: 'B',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const recentResult = await service.computeConfidence(recentContext);
      const oldResult = await service.computeConfidence(oldContext);

      expect(recentResult.data!.breakdown.recency).toBeGreaterThan(
        oldResult.data!.breakdown.recency
      );
    });

    it('should handle missing dates gracefully', async () => {
      const context: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com/no-date',
            title: 'Report Without Date',
            rating: 'B',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const result = await service.computeConfidence(context);

      expect(result.data!.breakdown.recency).toBe(50); // Default moderate recency
    });
  });

  describe('diversity scoring', () => {
    it('should score diverse source types higher', async () => {
      const diverseContext: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com/1',
            title: 'Industry Report',
            rating: 'B',
            sourceType: 'industry_report',
          },
          {
            url: 'https://test.com/2',
            title: 'Financial Data',
            rating: 'B',
            sourceType: 'financial_data',
          },
          {
            url: 'https://test.com/3',
            title: 'Research Study',
            rating: 'B',
            sourceType: 'research',
          },
          {
            url: 'https://test.com/4',
            title: 'News Article',
            rating: 'B',
            sourceType: 'news',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const singleTypeContext: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com/1',
            title: 'Report 1',
            rating: 'B',
            sourceType: 'research',
          },
          {
            url: 'https://test.com/2',
            title: 'Report 2',
            rating: 'B',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 50,
        assumptionCount: 5,
      };

      const diverseResult = await service.computeConfidence(diverseContext);
      const singleTypeResult = await service.computeConfidence(singleTypeContext);

      expect(diverseResult.data!.breakdown.diversity).toBeGreaterThan(
        singleTypeResult.data!.breakdown.diversity
      );
      expect(diverseResult.data!.breakdown.diversity).toBe(100); // 4 different types
      expect(singleTypeResult.data!.breakdown.diversity).toBe(40); // 1 type
    });
  });

  describe('coverage scoring', () => {
    it('should directly map coverage percentage', async () => {
      const context: ConfidenceContext = {
        citations: [
          {
            url: 'https://test.com',
            title: 'Test',
            rating: 'B',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 75,
        assumptionCount: 5,
      };

      const result = await service.computeConfidence(context);

      expect(result.data!.breakdown.coverage).toBe(75);
    });
  });

  describe('sensitivity scoring', () => {
    it('should score based on sensitivity risk level', async () => {
      const lowRiskContext: ConfidenceContext = {
        citations: [],
        ledgerCoveragePct: 50,
        sensitivityRisk: 'low',
        assumptionCount: 5,
      };

      const highRiskContext: ConfidenceContext = {
        citations: [],
        ledgerCoveragePct: 50,
        sensitivityRisk: 'high',
        assumptionCount: 5,
      };

      const lowRiskResult = await service.computeConfidence(lowRiskContext);
      const highRiskResult = await service.computeConfidence(highRiskContext);

      expect(lowRiskResult.data!.breakdown.sensitivity).toBeGreaterThan(
        highRiskResult.data!.breakdown.sensitivity
      );
      expect(lowRiskResult.data!.breakdown.sensitivity).toBe(85);
      expect(highRiskResult.data!.breakdown.sensitivity).toBe(35);
    });

    it('should use variance hint when provided', async () => {
      const context: ConfidenceContext = {
        citations: [],
        ledgerCoveragePct: 50,
        varianceHint: 20, // 20% variance
        assumptionCount: 5,
      };

      const result = await service.computeConfidence(context);

      expect(result.data!.breakdown.sensitivity).toBe(80); // 100 - 20
    });
  });

  describe('error handling', () => {
    it('should handle invalid input gracefully', async () => {
      const invalidContext = {
        citations: null as any,
        ledgerCoveragePct: -10,
        assumptionCount: 0,
      };

      const result = await service.computeConfidence(invalidContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('CONFIDENCE_CALCULATION_ERROR');
    });
  });

  describe('low confidence detection', () => {
    it('should flag scores below 60 as low confidence', async () => {
      const lowConfidenceContext: ConfidenceContext = {
        citations: [
          {
            url: 'https://poor-source.com',
            title: 'Poor Source',
            date: '2019-01-01',
            rating: 'C',
            sourceType: 'news',
          },
        ],
        ledgerCoveragePct: 20,
        sensitivityRisk: 'high',
        assumptionCount: 10,
      };

      const result = await service.computeConfidence(lowConfidenceContext);
      const score = result.data!;

      expect(score.total).toBeLessThan(60);
      expect(score.lowConfidence).toBe(true);
      expect(score.explanation).toContain('Low confidence');

      // Test the explainScore method for human review recommendation
      const explanation = service.explainScore(score);
      expect(explanation).toContain('human review recommended');
    });

    it('should not flag scores 60 and above as low confidence', async () => {
      const moderateConfidenceContext: ConfidenceContext = {
        citations: [
          {
            url: 'https://decent-source.com',
            title: 'Decent Source',
            date: '2024-01-01',
            rating: 'B',
            sourceType: 'research',
          },
        ],
        ledgerCoveragePct: 70,
        sensitivityRisk: 'medium',
        assumptionCount: 5,
      };

      const result = await service.computeConfidence(moderateConfidenceContext);
      const score = result.data!;

      expect(score.total).toBeGreaterThanOrEqual(60);
      expect(score.lowConfidence).toBe(false);
    });
  });
});
