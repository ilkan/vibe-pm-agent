// Unit tests for Quality Assessment System

import {
  QualityAssessmentSystem,
  QualityGapType,
  QualityGapSeverity,
  QualityReport,
  QualityGap,
  QualityRecommendation,
  EvidenceStrength,
} from '../../components/quality-assessment-system';

import { Citation, CitationSourceType, CitationConfidence } from '../../models/citations';

describe('QualityAssessmentSystem', () => {
  let qualityAssessment: QualityAssessmentSystem;
  let mockCitations: Citation[];
  let highQualityCitations: Citation[];
  let lowQualityCitations: Citation[];

  beforeEach(() => {
    qualityAssessment = new QualityAssessmentSystem();

    // Mock high-quality citations
    highQualityCitations = [
      {
        id: 'hq1',
        title: 'Market Analysis 2024',
        url: 'https://mckinsey.com/market-analysis-2024',
        domain: 'mckinsey.com',
        published_at: '2024-01-15',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Market growth expected to reach 15% by 2025',
        authors: ['Dr. Jane Smith', 'Prof. John Doe'],
        organization: 'McKinsey & Company',
        methodology: 'Survey of 1,500 industry executives across 25 countries',
        sample_size: 1500,
        geographic_scope: 'Global',
        industry_focus: ['Technology', 'Healthcare'],
      },
      {
        id: 'hq2',
        title: 'Digital Transformation Trends',
        url: 'https://hbr.org/digital-transformation-2024',
        domain: 'hbr.org',
        published_at: '2024-03-10',
        source_type: CitationSourceType.ACADEMIC_PAPER,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Companies investing in AI see 23% productivity gains',
        authors: ['Dr. Sarah Johnson'],
        organization: 'Harvard Business Review',
        methodology: 'Longitudinal study of 500 companies over 3 years',
        sample_size: 500,
        geographic_scope: 'North America',
        industry_focus: ['Technology'],
      },
      {
        id: 'hq3',
        title: 'Industry Benchmark Report 2024',
        url: 'https://gartner.com/benchmark-report-2024',
        domain: 'gartner.com',
        published_at: '2024-02-20',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Cloud adoption rates increased by 40% in 2023',
        organization: 'Gartner Inc.',
        methodology: 'Analysis of 2,000 enterprise IT departments',
        sample_size: 2000,
        geographic_scope: 'Global',
        industry_focus: ['Technology', 'Cloud Computing'],
      },
    ];

    // Mock low-quality citations
    lowQualityCitations = [
      {
        id: 'lq1',
        title: 'Random Blog Post',
        url: 'https://broken-link.com/blog-post',
        domain: 'broken-link.com',
        published_at: '2020-01-01',
        source_type: CitationSourceType.COMPANY_BLOG,
        confidence: CitationConfidence.LOW,
        key_finding: 'Some random claim without evidence',
      },
      {
        id: 'lq2',
        title: 'Outdated Study',
        url: 'https://old-site.com/study',
        domain: 'old-site.com',
        published_at: '2019-05-15',
        source_type: CitationSourceType.RESEARCH_PUBLICATION,
        confidence: CitationConfidence.LOW,
        key_finding: 'Old findings that may not be relevant',
        // Missing methodology, sample_size, authors
      },
    ];

    // Mixed quality citations for most tests
    mockCitations = [...highQualityCitations.slice(0, 2), ...lowQualityCitations.slice(0, 1)];
  });

  describe('assessCitationQuality', () => {
    it('should return empty report for no citations', async () => {
      const result = await qualityAssessment.assessCitationQuality([]);

      expect(result.overallScore).toBe(0);
      expect(result.citationCount).toBe(0);
      expect(result.complianceStatus).toBe('non-compliant');
      expect(result.qualityGaps).toHaveLength(1);
      expect(result.qualityGaps[0].gapType).toBe(QualityGapType.INSUFFICIENT_SOURCES);
      expect(result.qualityGaps[0].severity).toBe(QualityGapSeverity.CRITICAL);
    });

    it('should assess high-quality citations correctly', async () => {
      const result = await qualityAssessment.assessCitationQuality(highQualityCitations);

      expect(result.overallScore).toBeGreaterThan(80);
      expect(result.citationCount).toBe(3);
      expect(result.complianceStatus).toBe('compliant');
      expect(result.metrics.sourceCredibility).toBeGreaterThan(75);
      expect(result.metrics.evidenceDiversity).toBeGreaterThan(70);
      expect(result.metrics.recencyScore).toBeGreaterThan(60);
      expect(result.strengthAreas).toContain('High-quality, credible sources');
      expect(result.strengthAreas).toContain('Recent, up-to-date sources');
    });

    it('should identify quality issues in low-quality citations', async () => {
      const result = await qualityAssessment.assessCitationQuality(lowQualityCitations);

      expect(result.overallScore).toBeLessThan(50);
      expect(result.complianceStatus).toBe('non-compliant');
      expect(result.qualityGaps.length).toBeGreaterThan(2);

      const gapTypes = result.qualityGaps.map(gap => gap.gapType);
      expect(gapTypes).toContain(QualityGapType.INSUFFICIENT_SOURCES);
      expect(gapTypes).toContain(QualityGapType.LOW_CREDIBILITY);
      expect(gapTypes).toContain(QualityGapType.OUTDATED_SOURCES);
    });

    it('should calculate metrics correctly for mixed citations', async () => {
      const result = await qualityAssessment.assessCitationQuality(mockCitations);

      expect(result.citationCount).toBe(3);
      expect(result.metrics.sourceCredibility).toBeGreaterThan(0);
      expect(result.metrics.evidenceDiversity).toBeGreaterThan(0);
      expect(result.metrics.recencyScore).toBeGreaterThan(0);
      expect(result.metrics.methodologyTransparency).toBeGreaterThan(0);
      expect(result.assessmentDate).toBeInstanceOf(Date);
    });

    it('should provide actionable recommendations', async () => {
      const result = await qualityAssessment.assessCitationQuality(lowQualityCitations);

      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
      expect(result.recommendations.length).toBeGreaterThan(0);

      const recommendation = result.recommendations[0];
      expect(recommendation.type).toBeDefined();
      expect(recommendation.priority).toBeDefined();
      expect(recommendation.description).toBeDefined();
      expect(recommendation.specificActions.length).toBeGreaterThan(0);
      expect(recommendation.expectedImpact).toBeDefined();
      expect(recommendation.estimatedEffort).toBeDefined();
    });
  });

  describe('identifyQualityGaps', () => {
    it('should identify insufficient sources gap', async () => {
      const singleCitation = [highQualityCitations[0]];
      const gaps = await qualityAssessment.identifyQualityGaps(singleCitation);

      const insufficientGap = gaps.find(gap => gap.gapType === QualityGapType.INSUFFICIENT_SOURCES);
      expect(insufficientGap).toBeDefined();
      expect(insufficientGap!.severity).toBe(QualityGapSeverity.HIGH);
      expect(insufficientGap!.recommendedActions).toContain('Add at least 2 more credible sources');
    });

    it('should identify low credibility gap', async () => {
      const gaps = await qualityAssessment.identifyQualityGaps(lowQualityCitations);

      const credibilityGap = gaps.find(gap => gap.gapType === QualityGapType.LOW_CREDIBILITY);
      expect(credibilityGap).toBeDefined();
      expect(credibilityGap!.severity).toBe(QualityGapSeverity.HIGH);
      expect(credibilityGap!.affectedCitations).toHaveLength(2);
    });

    it('should identify outdated sources gap', async () => {
      const gaps = await qualityAssessment.identifyQualityGaps(lowQualityCitations);

      const outdatedGap = gaps.find(gap => gap.gapType === QualityGapType.OUTDATED_SOURCES);
      expect(outdatedGap).toBeDefined();
      expect(outdatedGap!.severity).toBe(QualityGapSeverity.MEDIUM);
    });

    it('should identify methodology gaps', async () => {
      const citationsWithoutMethodology = [
        {
          ...highQualityCitations[0],
          methodology: undefined,
          source_type: CitationSourceType.RESEARCH_PUBLICATION,
        },
      ];

      const gaps = await qualityAssessment.identifyQualityGaps(citationsWithoutMethodology);

      const methodologyGap = gaps.find(gap => gap.gapType === QualityGapType.METHODOLOGY_UNCLEAR);
      expect(methodologyGap).toBeDefined();
      expect(methodologyGap!.recommendedActions).toContain(
        'Find sources with clear methodology descriptions'
      );
    });

    it('should identify diversity gaps', async () => {
      const sameDomainCitations = [
        { ...highQualityCitations[0], id: 'same1' },
        { ...highQualityCitations[0], id: 'same2' },
        { ...highQualityCitations[0], id: 'same3' },
      ];

      const gaps = await qualityAssessment.identifyQualityGaps(sameDomainCitations);

      const diversityGap = gaps.find(gap => gap.gapType === QualityGapType.LACK_DIVERSITY);
      expect(diversityGap).toBeDefined();
      expect(diversityGap!.recommendedActions).toContain(
        'Add sources from different organizations and perspectives'
      );
    });

    it('should identify broken links', async () => {
      const brokenLinkCitations = [
        {
          ...highQualityCitations[0],
          url: 'https://broken-site.com/404',
        },
      ];

      const gaps = await qualityAssessment.identifyQualityGaps(brokenLinkCitations);

      const brokenLinkGap = gaps.find(gap => gap.gapType === QualityGapType.BROKEN_LINKS);
      expect(brokenLinkGap).toBeDefined();
      expect(brokenLinkGap!.severity).toBe(QualityGapSeverity.HIGH);
    });

    it('should sort gaps by priority', async () => {
      const gaps = await qualityAssessment.identifyQualityGaps(lowQualityCitations);

      // Verify gaps are sorted by priority (descending)
      for (let i = 1; i < gaps.length; i++) {
        expect(gaps[i - 1].priority).toBeGreaterThanOrEqual(gaps[i].priority);
      }
    });
  });

  describe('recommendImprovements', () => {
    it('should recommend adding sources for insufficient citations', async () => {
      const gaps: QualityGap[] = [
        {
          gapType: QualityGapType.INSUFFICIENT_SOURCES,
          severity: QualityGapSeverity.CRITICAL,
          affectedClaims: ['All claims'],
          affectedCitations: [],
          description: 'Only 1 source provided',
          impact: 'Insufficient evidence',
          recommendedActions: ['Add more sources'],
          priority: 9,
        },
      ];

      const mockMetrics = {
        sourceCredibility: 50,
        evidenceDiversity: 30,
        recencyScore: 70,
        methodologyTransparency: 60,
        sampleSizeAdequacy: 80,
        accessibilityScore: 90,
        complianceScore: 70,
      };

      const recommendations = await qualityAssessment.recommendImprovements(
        [highQualityCitations[0]],
        gaps,
        mockMetrics
      );

      const addSourcesRec = recommendations.find(rec => rec.type === 'add_sources');
      expect(addSourcesRec).toBeDefined();
      expect(addSourcesRec!.priority).toBe('critical');
      expect(addSourcesRec!.targetMetrics?.credibilityIncrease).toBeDefined();
    });

    it('should recommend replacing low-credibility sources', async () => {
      const gaps: QualityGap[] = [
        {
          gapType: QualityGapType.LOW_CREDIBILITY,
          severity: QualityGapSeverity.HIGH,
          affectedClaims: ['Key claims'],
          affectedCitations: ['lq1'],
          description: 'Low credibility sources',
          impact: 'Reduces trustworthiness',
          recommendedActions: ['Replace sources'],
          priority: 8,
        },
      ];

      const mockMetrics = {
        sourceCredibility: 40,
        evidenceDiversity: 60,
        recencyScore: 70,
        methodologyTransparency: 60,
        sampleSizeAdequacy: 80,
        accessibilityScore: 90,
        complianceScore: 70,
      };

      const recommendations = await qualityAssessment.recommendImprovements(
        lowQualityCitations,
        gaps,
        mockMetrics
      );

      const replaceSourcesRec = recommendations.find(rec => rec.type === 'replace_sources');
      expect(replaceSourcesRec).toBeDefined();
      expect(replaceSourcesRec!.priority).toBe('high');
      expect(replaceSourcesRec!.specificActions).toContain(
        'Identify and remove sources with credibility scores below 60'
      );
    });

    it('should recommend updating outdated sources', async () => {
      const gaps: QualityGap[] = [
        {
          gapType: QualityGapType.OUTDATED_SOURCES,
          severity: QualityGapSeverity.MEDIUM,
          affectedClaims: ['Historical claims'],
          affectedCitations: ['lq2'],
          description: 'Outdated sources',
          impact: 'May not reflect current conditions',
          recommendedActions: ['Update sources'],
          priority: 6,
        },
      ];

      const mockMetrics = {
        sourceCredibility: 70,
        evidenceDiversity: 60,
        recencyScore: 30,
        methodologyTransparency: 60,
        sampleSizeAdequacy: 80,
        accessibilityScore: 90,
        complianceScore: 70,
      };

      const recommendations = await qualityAssessment.recommendImprovements(
        lowQualityCitations,
        gaps,
        mockMetrics
      );

      const updateSourcesRec = recommendations.find(rec => rec.type === 'update_sources');
      expect(updateSourcesRec).toBeDefined();
      expect(updateSourcesRec!.priority).toBe('medium');
      expect(updateSourcesRec!.targetMetrics?.recencyImprovement).toBeDefined();
    });

    it('should sort recommendations by priority', async () => {
      const gaps: QualityGap[] = [
        {
          gapType: QualityGapType.INSUFFICIENT_SOURCES,
          severity: QualityGapSeverity.CRITICAL,
          affectedClaims: [],
          affectedCitations: [],
          description: '',
          impact: '',
          recommendedActions: [],
          priority: 9,
        },
        {
          gapType: QualityGapType.OUTDATED_SOURCES,
          severity: QualityGapSeverity.MEDIUM,
          affectedClaims: [],
          affectedCitations: [],
          description: '',
          impact: '',
          recommendedActions: [],
          priority: 6,
        },
      ];

      const mockMetrics = {
        sourceCredibility: 50,
        evidenceDiversity: 50,
        recencyScore: 50,
        methodologyTransparency: 50,
        sampleSizeAdequacy: 50,
        accessibilityScore: 50,
        complianceScore: 50,
      };

      const recommendations = await qualityAssessment.recommendImprovements(
        mockCitations,
        gaps,
        mockMetrics
      );

      // Verify recommendations are sorted by priority
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      for (let i = 1; i < recommendations.length; i++) {
        const prevPriority = priorityOrder[recommendations[i - 1].priority];
        const currPriority = priorityOrder[recommendations[i].priority];
        expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
      }
    });
  });

  describe('calculateEvidenceStrength', () => {
    it('should calculate strong evidence for high-quality citations', () => {
      const claim = 'Market growth expected to reach 15%';
      const result = qualityAssessment.calculateEvidenceStrength(highQualityCitations, claim);

      expect(['strong', 'very_strong']).toContain(result.overall);
      expect(result.factors.sourceQuality).toBeGreaterThanOrEqual(70);
      expect(result.factors.sourceDiversity).toBeGreaterThan(0);
      expect(result.supportingEvidence.length).toBeGreaterThan(0);
    });

    it('should calculate weak evidence for low-quality citations', () => {
      const claim = 'Some random claim';
      const result = qualityAssessment.calculateEvidenceStrength(lowQualityCitations, claim);

      expect(['weak', 'moderate']).toContain(result.overall);
      expect(result.factors.sourceQuality).toBeLessThan(70);
      expect(result.evidenceGaps.length).toBeGreaterThan(0);
    });

    it('should identify evidence gaps correctly', () => {
      const claim = 'Quantitative claim with 25% increase';
      const citationsWithoutSampleSize = highQualityCitations.map(c => ({
        ...c,
        sample_size: undefined,
      }));

      const result = qualityAssessment.calculateEvidenceStrength(citationsWithoutSampleSize, claim);

      expect(result.evidenceGaps).toContain('Quantitative claim lacks statistical evidence');
    });

    it('should handle empty citations gracefully', () => {
      const claim = 'Any claim';
      const result = qualityAssessment.calculateEvidenceStrength([], claim);

      expect(result.overall).toBe('weak');
      expect(result.factors.sourceQuantity).toBe(0);
      expect(result.supportingEvidence).toHaveLength(0);
      expect(result.evidenceGaps).toContain('Insufficient number of supporting sources');
    });
  });

  describe('Configuration Management', () => {
    it('should update quality thresholds', () => {
      const newThresholds = { excellent: 95, good: 80 };
      qualityAssessment.updateQualityThresholds(newThresholds);

      const currentThresholds = qualityAssessment.getQualityThresholds();
      expect(currentThresholds.excellent).toBe(95);
      expect(currentThresholds.good).toBe(80);
      expect(currentThresholds.acceptable).toBe(60); // Should remain unchanged
    });

    it('should update source type weights', () => {
      const newWeights = new Map([
        [CitationSourceType.ACADEMIC_PAPER, 1.2],
        [CitationSourceType.COMPANY_BLOG, 0.2],
      ]);

      qualityAssessment.updateSourceTypeWeights(newWeights);

      const currentWeights = qualityAssessment.getSourceTypeWeights();
      expect(currentWeights.get(CitationSourceType.ACADEMIC_PAPER)).toBe(1.2);
      expect(currentWeights.get(CitationSourceType.COMPANY_BLOG)).toBe(0.2);
    });

    it('should get current source type weights', () => {
      const weights = qualityAssessment.getSourceTypeWeights();

      expect(weights).toBeInstanceOf(Map);
      expect(weights.get(CitationSourceType.ACADEMIC_PAPER)).toBe(1.0);
      expect(weights.get(CitationSourceType.CONSULTING_STUDY)).toBe(0.9);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle citations with missing fields gracefully', async () => {
      const incompleteCitations: Citation[] = [
        {
          id: 'incomplete1',
          title: 'Incomplete Citation',
          url: '',
          domain: '',
          published_at: '',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: '',
        },
      ];

      const result = await qualityAssessment.assessCitationQuality(incompleteCitations);

      expect(result.overallScore).toBeLessThan(50);
      expect(result.complianceStatus).toBe('non-compliant');
      expect(result.qualityGaps.length).toBeGreaterThan(0);
    });

    it('should handle null and undefined values in citations', async () => {
      const citationWithNulls: Citation[] = [
        {
          id: 'null-test',
          title: 'Test Citation',
          url: 'https://example.com',
          domain: 'example.com',
          published_at: '2024-01-01',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: 'Test finding',
          authors: undefined,
          organization: undefined,
          methodology: undefined,
          sample_size: undefined,
        },
      ];

      const result = await qualityAssessment.assessCitationQuality(citationWithNulls);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.citationCount).toBe(1);
    });

    it('should handle very large citation collections', async () => {
      const largeCitationCollection = Array.from({ length: 100 }, (_, i) => ({
        ...highQualityCitations[0],
        id: `large-${i}`,
        title: `Citation ${i}`,
      }));

      const result = await qualityAssessment.assessCitationQuality(largeCitationCollection);

      expect(result.citationCount).toBe(100);
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.assessmentDate).toBeInstanceOf(Date);
    });

    it('should handle citations with extreme dates', async () => {
      const extremeDateCitations: Citation[] = [
        {
          ...highQualityCitations[0],
          id: 'future-date',
          published_at: '2030-01-01', // Future date
        },
        {
          ...highQualityCitations[0],
          id: 'very-old',
          published_at: '1990-01-01', // Very old date
        },
      ];

      const result = await qualityAssessment.assessCitationQuality(extremeDateCitations);

      expect(result).toBeDefined();
      expect(result.metrics.recencyScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.recencyScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete assessment within reasonable time', async () => {
      const startTime = Date.now();
      await qualityAssessment.assessCitationQuality(highQualityCitations);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent assessments', async () => {
      const assessmentPromises = Array.from({ length: 5 }, () =>
        qualityAssessment.assessCitationQuality(mockCitations)
      );

      const results = await Promise.all(assessmentPromises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.citationCount).toBe(3);
        expect(result.overallScore).toBeGreaterThan(0);
      });
    });
  });
});
