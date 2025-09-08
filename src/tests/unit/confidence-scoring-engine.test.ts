/**
 * Unit tests for ConfidenceScoringEngine
 */

import { ConfidenceScoringEngine, ConfidenceScore, DocumentConfidence, ConfidenceFactor } from '../../components/confidence-scoring-engine';
import { Citation, CitationSourceType, CitationConfidence } from '../../models/citations';

describe('ConfidenceScoringEngine', () => {
  let engine: ConfidenceScoringEngine;

  beforeEach(() => {
    engine = new ConfidenceScoringEngine();
  });

  describe('calculateClaimConfidence', () => {
    it('should return zero confidence for no sources', () => {
      const result = engine.calculateClaimConfidence('Test claim', []);
      
      expect(result.overall).toBe(0);
      expect(result.uncertaintyFactors).toContain('No supporting sources provided');
      expect(result.breakdown.sourceQuality).toBe(0);
      expect(result.breakdown.evidenceStrength).toBe(0);
    });

    it('should calculate confidence for single high-quality source', () => {
      const sources: Citation[] = [{
        id: '1',
        title: 'High Quality Research',
        url: 'https://mckinsey.com/research',
        domain: 'mckinsey.com',
        published_at: '2024-01-01',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Test claim shows 85% improvement',
        methodology: 'Comprehensive survey of 1000 companies across 10 industries',
        sample_size: 1000,
        geographic_scope: 'Global',
      }];

      const result = engine.calculateClaimConfidence('Test claim improvement', sources);
      
      expect(result.overall).toBeGreaterThan(65);
      expect(result.breakdown.sourceQuality).toBeGreaterThan(80);
      expect(result.breakdown.evidenceStrength).toBeGreaterThanOrEqual(60);
      expect(result.breakdown.methodologyClarity).toBeGreaterThan(75);
      expect(result.breakdown.sampleSizeAdequacy).toBe(100);
      expect(result.confidenceInterval.level).toBe(95);
    });

    it('should calculate confidence for multiple diverse sources', () => {
      const sources: Citation[] = [
        {
          id: '1',
          title: 'McKinsey Study',
          url: 'https://mckinsey.com/study',
          domain: 'mckinsey.com',
          published_at: '2024-01-01',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Market growth of 25%',
          methodology: 'Survey methodology',
          sample_size: 500,
        },
        {
          id: '2',
          title: 'Academic Research',
          url: 'https://university.edu/paper',
          domain: 'university.edu',
          published_at: '2023-12-01',
          source_type: CitationSourceType.ACADEMIC_PAPER,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Confirms 25% growth trend',
          methodology: 'Longitudinal study',
          sample_size: 1200,
        },
        {
          id: '3',
          title: 'Government Data',
          url: 'https://gov.org/data',
          domain: 'gov.org',
          published_at: '2024-02-01',
          source_type: CitationSourceType.GOVERNMENT_DATA,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Official statistics show 24% growth',
          sample_size: 10000,
        }
      ];

      const result = engine.calculateClaimConfidence('Market growth of 25%', sources);
      
      expect(result.overall).toBeGreaterThan(75);
      expect(result.breakdown.sourceQuality).toBeGreaterThan(80);
      expect(result.breakdown.evidenceStrength).toBeGreaterThan(60);
      expect(result.uncertaintyFactors.length).toBeLessThan(2);
    });

    it('should penalize low-quality sources', () => {
      const sources: Citation[] = [{
        id: '1',
        title: 'Blog Post',
        url: 'https://random-blog.com/post',
        domain: 'random-blog.com',
        published_at: '2020-01-01', // Old source
        source_type: CitationSourceType.COMPANY_BLOG,
        confidence: CitationConfidence.LOW,
        key_finding: 'Unverified claim',
        // No methodology or sample size
      }];

      const result = engine.calculateClaimConfidence('Unverified claim', sources);
      
      expect(result.overall).toBeLessThan(50);
      expect(result.breakdown.sourceQuality).toBeLessThan(60);
      expect(result.breakdown.recencyFactor).toBeLessThan(30);
      expect(result.uncertaintyFactors.length).toBeGreaterThan(2);
    });

    it('should identify uncertainty factors correctly', () => {
      const sources: Citation[] = [
        {
          id: '1',
          title: 'Limited Study',
          url: 'https://example.com/study',
          domain: 'example.com',
          published_at: '2020-01-01', // Old
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'Some finding',
          // No methodology or sample size
        }
      ];

      const result = engine.calculateClaimConfidence('Test claim', sources);
      
      expect(result.uncertaintyFactors).toContain('Limited sources: Only 1 sources supporting this claim');
      expect(result.uncertaintyFactors).toContain('Outdated sources: More than half of sources are older than 24 months');
      expect(result.uncertaintyFactors).toContain('Methodology gaps: Less than half of sources document their methodology');
      expect(result.uncertaintyFactors).toContain('Sample size uncertainty: Less than half of sources report sample sizes');
    });

    it('should calculate confidence intervals based on source variance', () => {
      const sources: Citation[] = [
        {
          id: '1',
          title: 'High Quality',
          url: 'https://mckinsey.com/study',
          domain: 'mckinsey.com',
          published_at: '2024-01-01',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Finding',
        },
        {
          id: '2',
          title: 'Low Quality',
          url: 'https://blog.com/post',
          domain: 'blog.com',
          published_at: '2024-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'Finding',
        }
      ];

      const result = engine.calculateClaimConfidence('Test claim', sources);
      
      expect(result.confidenceInterval.lower).toBeLessThan(result.overall);
      expect(result.confidenceInterval.upper).toBeGreaterThan(result.overall);
      expect(result.confidenceInterval.level).toBe(95);
      expect(result.confidenceInterval.upper - result.confidenceInterval.lower).toBeGreaterThan(0);
    });
  });

  describe('aggregateDocumentConfidence', () => {
    it('should return zero confidence for empty claims', () => {
      const result = engine.aggregateDocumentConfidence([]);
      
      expect(result.overallConfidence).toBe(0);
      expect(result.claimConfidences.size).toBe(0);
      expect(result.weakestClaims).toHaveLength(0);
      expect(result.strongestClaims).toHaveLength(0);
      expect(result.recommendationReliability).toBe('low');
    });

    it('should aggregate multiple claim confidences correctly', () => {
      const claimConfidences: ConfidenceScore[] = [
        {
          overall: 85,
          breakdown: { sourceQuality: 90, evidenceStrength: 80, methodologyClarity: 85, sampleSizeAdequacy: 90, recencyFactor: 80 },
          confidenceInterval: { lower: 80, upper: 90, level: 95 },
          uncertaintyFactors: [],
        },
        {
          overall: 65,
          breakdown: { sourceQuality: 70, evidenceStrength: 60, methodologyClarity: 65, sampleSizeAdequacy: 70, recencyFactor: 60 },
          confidenceInterval: { lower: 60, upper: 70, level: 95 },
          uncertaintyFactors: ['Limited sources'],
        },
        {
          overall: 45,
          breakdown: { sourceQuality: 50, evidenceStrength: 40, methodologyClarity: 45, sampleSizeAdequacy: 50, recencyFactor: 40 },
          confidenceInterval: { lower: 40, upper: 50, level: 95 },
          uncertaintyFactors: ['Low quality sources', 'Outdated data'],
        }
      ];

      const result = engine.aggregateDocumentConfidence(claimConfidences);
      
      expect(result.overallConfidence).toBe(65); // Average of 85, 65, 45
      expect(result.claimConfidences.size).toBe(3);
      expect(result.weakestClaims[0].confidence).toBe(45);
      expect(result.strongestClaims[0].confidence).toBe(85);
      expect(result.recommendationReliability).toBe('medium');
    });

    it('should determine recommendation reliability correctly', () => {
      const highConfidenceScores: ConfidenceScore[] = [
        { overall: 85, breakdown: {} as any, confidenceInterval: {} as any, uncertaintyFactors: [] },
        { overall: 90, breakdown: {} as any, confidenceInterval: {} as any, uncertaintyFactors: [] },
      ];

      const mediumConfidenceScores: ConfidenceScore[] = [
        { overall: 65, breakdown: {} as any, confidenceInterval: {} as any, uncertaintyFactors: [] },
        { overall: 70, breakdown: {} as any, confidenceInterval: {} as any, uncertaintyFactors: [] },
      ];

      const lowConfidenceScores: ConfidenceScore[] = [
        { overall: 35, breakdown: {} as any, confidenceInterval: {} as any, uncertaintyFactors: [] },
        { overall: 40, breakdown: {} as any, confidenceInterval: {} as any, uncertaintyFactors: [] },
      ];

      expect(engine.aggregateDocumentConfidence(highConfidenceScores).recommendationReliability).toBe('high');
      expect(engine.aggregateDocumentConfidence(mediumConfidenceScores).recommendationReliability).toBe('medium');
      expect(engine.aggregateDocumentConfidence(lowConfidenceScores).recommendationReliability).toBe('low');
    });
  });

  describe('trackConfidenceFactors', () => {
    it('should track confidence factors for diverse sources', () => {
      const sources: Citation[] = [
        {
          id: '1',
          title: 'McKinsey Study',
          url: 'https://mckinsey.com/study',
          domain: 'mckinsey.com',
          published_at: '2024-01-01',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Finding',
          methodology: 'Detailed survey methodology',
          sample_size: 1000,
        },
        {
          id: '2',
          title: 'Academic Paper',
          url: 'https://university.edu/paper',
          domain: 'university.edu',
          published_at: '2023-12-01',
          source_type: CitationSourceType.ACADEMIC_PAPER,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Finding',
          methodology: 'Experimental design',
          sample_size: 500,
        }
      ];

      const factors = engine.trackConfidenceFactors(sources);
      
      expect(factors).toHaveLength(5);
      expect(factors.find(f => f.name === 'Source Diversity')).toBeDefined();
      expect(factors.find(f => f.name === 'Source Credibility')).toBeDefined();
      expect(factors.find(f => f.name === 'Data Recency')).toBeDefined();
      expect(factors.find(f => f.name === 'Methodology Transparency')).toBeDefined();
      expect(factors.find(f => f.name === 'Sample Size Adequacy')).toBeDefined();

      const diversityFactor = factors.find(f => f.name === 'Source Diversity')!;
      expect(diversityFactor.score).toBe(100); // 2 unique domains out of 2 sources

      const credibilityFactor = factors.find(f => f.name === 'Source Credibility')!;
      expect(credibilityFactor.score).toBeGreaterThan(80);
    });

    it('should identify low diversity in sources', () => {
      const sources: Citation[] = [
        {
          id: '1',
          title: 'Study 1',
          url: 'https://same-domain.com/study1',
          domain: 'same-domain.com',
          published_at: '2024-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Finding 1',
        },
        {
          id: '2',
          title: 'Study 2',
          url: 'https://same-domain.com/study2',
          domain: 'same-domain.com',
          published_at: '2024-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Finding 2',
        }
      ];

      const factors = engine.trackConfidenceFactors(sources);
      const diversityFactor = factors.find(f => f.name === 'Source Diversity')!;
      
      expect(diversityFactor.score).toBe(50); // 1 unique domain out of 2 sources
      expect(diversityFactor.impact).toBe('high');
    });
  });

  describe('generateConfidenceReport', () => {
    it('should generate comprehensive confidence report', () => {
      const claims = [
        {
          claim: 'Market is growing at 25%',
          sources: [{
            id: '1',
            title: 'Market Research',
            url: 'https://research.com/market',
            domain: 'research.com',
            published_at: '2024-01-01',
            source_type: CitationSourceType.INDUSTRY_REPORT,
            confidence: CitationConfidence.HIGH,
            key_finding: 'Market growth of 25%',
            methodology: 'Survey of 500 companies',
            sample_size: 500,
          }]
        },
        {
          claim: 'Customer satisfaction is high',
          sources: [{
            id: '2',
            title: 'Customer Survey',
            url: 'https://survey.com/results',
            domain: 'survey.com',
            published_at: '2024-02-01',
            source_type: CitationSourceType.SURVEY_DATA,
            confidence: CitationConfidence.MEDIUM,
            key_finding: 'High satisfaction scores',
            sample_size: 1000,
          }]
        }
      ];

      const report = engine.generateConfidenceReport('Test document content', claims);
      
      expect(report.documentId).toMatch(/^doc_[a-f0-9]+$/);
      expect(report.claimAnalysis).toHaveLength(2);
      expect(report.overallConfidence.overallConfidence).toBeGreaterThan(0);
      expect(report.methodologyTransparency.scoringMethod).toBe('Weighted Multi-Factor Analysis');
      expect(report.methodologyTransparency.assumptions).toHaveLength(4);
      expect(report.methodologyTransparency.limitations).toHaveLength(4);
      expect(report.generatedAt).toBeInstanceOf(Date);

      // Check claim analysis details
      const firstClaimAnalysis = report.claimAnalysis[0];
      expect(firstClaimAnalysis.claim).toBe('Market is growing at 25%');
      expect(firstClaimAnalysis.confidence.overall).toBeGreaterThan(0);
      expect(firstClaimAnalysis.supportingSources).toHaveLength(1);
      expect(firstClaimAnalysis.recommendations).toBeInstanceOf(Array);
    });

    it('should provide recommendations for low confidence claims', () => {
      const claims = [
        {
          claim: 'Weak claim',
          sources: [{
            id: '1',
            title: 'Blog Post',
            url: 'https://blog.com/post',
            domain: 'blog.com',
            published_at: '2020-01-01', // Old
            source_type: CitationSourceType.COMPANY_BLOG,
            confidence: CitationConfidence.LOW,
            key_finding: 'Weak finding',
            // No methodology or sample size
          }]
        }
      ];

      const report = engine.generateConfidenceReport('Test document', claims);
      const claimAnalysis = report.claimAnalysis[0];
      
      expect(claimAnalysis.recommendations.length).toBeGreaterThan(0);
      expect(claimAnalysis.recommendations).toContain('Consider adding more authoritative sources to strengthen this claim');
      expect(claimAnalysis.recommendations).toContain('Seek higher-quality sources from established institutions or peer-reviewed publications');
      expect(claimAnalysis.recommendations).toContain('Update with more recent sources to improve relevance');
    });
  });

  describe('custom configuration', () => {
    it('should use custom weights and thresholds', () => {
      const customEngine = new ConfidenceScoringEngine({
        weights: {
          sourceQuality: 0.5,
          evidenceStrength: 0.3,
          methodologyClarity: 0.1,
          sampleSizeAdequacy: 0.05,
          recencyFactor: 0.05,
        },
        thresholds: {
          highConfidence: 90,
          mediumConfidence: 70,
          lowConfidence: 50,
        }
      });

      const sources: Citation[] = [{
        id: '1',
        title: 'High Quality Source',
        url: 'https://mckinsey.com/study',
        domain: 'mckinsey.com',
        published_at: '2024-01-01',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Test finding',
        methodology: 'Comprehensive methodology',
        sample_size: 1000,
      }];

      const result = customEngine.calculateClaimConfidence('Test claim', sources);
      
      // With higher weight on source quality, should get different score
      expect(result.overall).toBeGreaterThan(0);
      expect(result.breakdown.sourceQuality).toBeGreaterThan(80);
    });
  });

  describe('edge cases', () => {
    it('should handle sources with missing data gracefully', () => {
      const sources: Citation[] = [{
        id: '1',
        title: 'Incomplete Source',
        url: 'https://example.com/incomplete',
        domain: 'example.com',
        published_at: '2024-01-01',
        source_type: CitationSourceType.COMPANY_BLOG,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Some finding',
        // Missing methodology, sample_size, etc.
      }];

      const result = engine.calculateClaimConfidence('Test claim', sources);
      
      expect(result.overall).toBeGreaterThan(0);
      expect(result.breakdown.methodologyClarity).toBeLessThan(50);
      expect(result.breakdown.sampleSizeAdequacy).toBe(0);
    });

    it('should handle invalid dates gracefully', () => {
      const sources: Citation[] = [{
        id: '1',
        title: 'Invalid Date Source',
        url: 'https://example.com/source',
        domain: 'example.com',
        published_at: 'invalid-date',
        source_type: CitationSourceType.COMPANY_BLOG,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Finding',
      }];

      expect(() => {
        engine.calculateClaimConfidence('Test claim', sources);
      }).not.toThrow();
    });

    it('should handle very large numbers of sources', () => {
      const sources: Citation[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        title: `Source ${i}`,
        url: `https://example${i}.com/source`,
        domain: `example${i}.com`,
        published_at: '2024-01-01',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.MEDIUM,
        key_finding: `Finding ${i}`,
      }));

      const result = engine.calculateClaimConfidence('Test claim', sources);
      
      expect(result.overall).toBeGreaterThan(0);
      expect(result.breakdown.sourceQuality).toBeGreaterThan(50);
      expect(result.breakdown.evidenceStrength).toBeGreaterThan(50); // Should be decent due to many sources
    });
  });
});