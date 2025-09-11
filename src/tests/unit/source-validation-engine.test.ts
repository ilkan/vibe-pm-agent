// Unit tests for Source Validation Engine

import {
  SourceValidationEngine,
  ValidationConfig,
} from '../../components/source-validation-engine';
import {
  Citation,
  CitationSourceType,
  CitationConfidence,
  AccessibilityStatus,
  CredibilityAssessment,
  ComplianceStatus,
} from '../../models/citations';

describe('SourceValidationEngine', () => {
  let engine: SourceValidationEngine;
  let mockCitation: Citation;

  beforeEach(() => {
    engine = new SourceValidationEngine();
    mockCitation = {
      id: 'test_citation_1',
      title: 'Test Research Paper on Product Management',
      url: 'https://example.com/research-paper',
      domain: 'example.com',
      published_at: '2024-01-15',
      source_type: CitationSourceType.RESEARCH_PUBLICATION,
      confidence: CitationConfidence.HIGH,
      key_finding: 'Product teams using automation show 25% improvement in efficiency',
      authors: ['Dr. Jane Smith', 'Prof. John Doe'],
      organization: 'Research Institute',
      methodology: 'Survey of 500 product managers',
      sample_size: 500,
      geographic_scope: 'Global',
      industry_focus: ['technology', 'software'],
    };
  });

  afterEach(() => {
    engine.clearCache();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new SourceValidationEngine();
      expect(defaultEngine).toBeDefined();
      expect(defaultEngine.getCacheStats()).toEqual({
        accessibility: 0,
        credibility: 0,
        domainAuthority: 0,
      });
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<ValidationConfig> = {
        timeout: 5000,
        retryAttempts: 2,
        cacheExpiry: 12,
        enableDomainAuthority: false,
        complianceStandards: ['academic'],
      };

      const customEngine = new SourceValidationEngine(customConfig);
      expect(customEngine).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig: Partial<ValidationConfig> = {
        timeout: 15000,
        retryAttempts: 5,
      };

      engine.updateConfig(newConfig);
      expect(engine).toBeDefined(); // Configuration updated internally
    });
  });

  describe('validateSourceAccessibility', () => {
    it('should validate accessible source', async () => {
      const result = await engine.validateSourceAccessibility('https://example.com/accessible');

      expect(result).toBeDefined();
      expect(result.lastChecked).toBeInstanceOf(Date);
      expect(result.alternativeAccess).toBeInstanceOf(Array);
      expect(typeof result.isAccessible).toBe('boolean');
      expect(['free', 'paywall', 'subscription', 'broken']).toContain(result.accessType);
    });

    it('should handle broken links', async () => {
      const result = await engine.validateSourceAccessibility('https://example.com/broken');

      expect(result.isAccessible).toBe(false);
      expect(result.accessType).toBe('broken');
      expect(result.httpStatus).toBe(404);
      expect(result.errorMessage).toContain('404');
    });

    it('should handle timeout errors', async () => {
      const result = await engine.validateSourceAccessibility('https://example.com/timeout');

      expect(result.isAccessible).toBe(false);
      expect(result.accessType).toBe('broken');
      expect(result.httpStatus).toBe(408);
    });

    it('should provide alternative access methods', async () => {
      const result = await engine.validateSourceAccessibility('https://example.com/test');

      expect(result.alternativeAccess).toContain(
        'https://web.archive.org/web/*/https://example.com/test'
      );
      expect(result.alternativeAccess).toContain(
        'https://webcache.googleusercontent.com/search?q=cache:https://example.com/test'
      );
    });

    it('should cache accessibility results', async () => {
      const url = 'https://example.com/cached';

      // First call
      const result1 = await engine.validateSourceAccessibility(url);
      const stats1 = engine.getCacheStats();

      // Second call should use cache
      const result2 = await engine.validateSourceAccessibility(url);
      const stats2 = engine.getCacheStats();

      expect(result1.lastChecked).toEqual(result2.lastChecked);
      expect(stats1.accessibility).toBe(stats2.accessibility);
    });
  });

  describe('assessSourceCredibility', () => {
    it('should assess high-quality academic source', async () => {
      const academicCitation: Citation = {
        ...mockCitation,
        source_type: CitationSourceType.ACADEMIC_PAPER,
        domain: 'harvard.edu',
        authors: ['Dr. PhD Smith', 'Prof. PhD Johnson'],
      };

      const result = await engine.assessSourceCredibility(academicCitation);

      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.confidenceLevel).toBe('high');
      expect(result.factors.domainAuthority).toBeGreaterThan(80);
      expect(result.factors.authorCredentials).toBeGreaterThan(70);
      expect(result.factors.peerReviewStatus).toBeGreaterThan(80);
      expect(result.assessmentDate).toBeInstanceOf(Date);
    });

    it('should assess consulting study credibility', async () => {
      const consultingCitation: Citation = {
        ...mockCitation,
        source_type: CitationSourceType.CONSULTING_STUDY,
        domain: 'mckinsey.com',
        organization: 'McKinsey & Company',
      };

      const result = await engine.assessSourceCredibility(consultingCitation);

      expect(result.overallScore).toBeGreaterThan(60);
      expect(result.factors.domainAuthority).toBeGreaterThanOrEqual(80);
      expect(result.factors.peerReviewStatus).toBeGreaterThan(60);
    });

    it('should identify risk factors', async () => {
      const lowQualityCitation: Citation = {
        ...mockCitation,
        domain: 'contentfarm.com',
        confidence: CitationConfidence.LOW,
        authors: undefined,
        organization: undefined,
        published_at: '2018-01-01', // Old publication
      };

      const result = await engine.assessSourceCredibility(lowQualityCitation);

      expect(result.overallScore).toBeLessThan(70); // Adjusted expectation
      expect(result.confidenceLevel).toBe('low');
      expect(result.riskFactors.length).toBeGreaterThan(0);
      expect(result.riskFactors).toContain('Missing author/organization information');
    });

    it('should cache credibility assessments', async () => {
      // First assessment
      await engine.assessSourceCredibility(mockCitation);
      const stats1 = engine.getCacheStats();

      // Second assessment should use cache
      await engine.assessSourceCredibility(mockCitation);
      const stats2 = engine.getCacheStats();

      expect(stats1.credibility).toBe(stats2.credibility);
    });
  });

  describe('checkComplianceRequirements', () => {
    it('should pass academic compliance for complete citation', async () => {
      const result = await engine.checkComplianceRequirements(mockCitation);

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.checkedStandards).toContain('academic');
      expect(result.checkedStandards).toContain('business');
      expect(result.checkedStandards).toContain('regulatory');
      expect(result.lastChecked).toBeInstanceOf(Date);
    });

    it('should identify academic compliance violations', async () => {
      const incompleteCitation: Citation = {
        ...mockCitation,
        authors: undefined,
        organization: undefined,
        published_at: '',
        methodology: undefined,
      };

      const result = await engine.checkComplianceRequirements(incompleteCitation);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('Missing author or organization information');
      expect(result.violations).toContain('Missing publication date');
      expect(result.violations).toContain('Missing methodology for research publication');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify business compliance violations', async () => {
      const businessCitation: Citation = {
        ...mockCitation,
        key_finding: '',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.LOW,
      };

      const result = await engine.checkComplianceRequirements(businessCitation);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('Missing key finding or insight');
      expect(result.violations).toContain('Low confidence consulting study');
    });

    it('should identify regulatory compliance violations', async () => {
      const govCitation: Citation = {
        ...mockCitation,
        domain: 'example.gov',
        last_accessed: undefined,
      };

      const result = await engine.checkComplianceRequirements(govCitation);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('Government source missing access date');
    });
  });

  describe('findAlternativeSources', () => {
    it('should find alternative sources for broken citation', async () => {
      const brokenCitation: Citation = {
        ...mockCitation,
        url: 'https://broken-site.com/article',
      };

      const alternatives = await engine.findAlternativeSources(brokenCitation);

      expect(alternatives).toBeInstanceOf(Array);
      expect(alternatives.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no alternatives found', async () => {
      const uniqueCitation: Citation = {
        ...mockCitation,
        title: 'Very Unique Research That Has No Alternatives',
        organization: 'Unique Organization',
      };

      const alternatives = await engine.findAlternativeSources(uniqueCitation);

      expect(alternatives).toBeInstanceOf(Array);
    });
  });

  describe('validateCitation', () => {
    it('should perform comprehensive citation validation', async () => {
      const result = await engine.validateCitation(mockCitation);

      expect(result.citation).toEqual(mockCitation);
      expect(result.accessibilityStatus).toBeDefined();
      expect(result.credibilityAssessment).toBeDefined();
      expect(result.complianceStatus).toBeDefined();
      expect(result.alternativeSources).toBeInstanceOf(Array);
      expect(result.validationTimestamp).toBeInstanceOf(Date);
    });

    it('should handle validation errors gracefully', async () => {
      const problematicCitation: Citation = {
        ...mockCitation,
        url: 'invalid-url',
        domain: 'invalid-domain',
      };

      const result = await engine.validateCitation(problematicCitation);

      expect(result).toBeDefined();
      expect(result.citation).toEqual(problematicCitation);
    });
  });

  describe('validateCitations', () => {
    it('should validate multiple citations in batch', async () => {
      const citations: Citation[] = [
        mockCitation,
        {
          ...mockCitation,
          id: 'test_citation_2',
          title: 'Another Research Paper',
          url: 'https://example.com/another-paper',
        },
        {
          ...mockCitation,
          id: 'test_citation_3',
          title: 'Third Research Paper',
          url: 'https://example.com/third-paper',
        },
      ];

      const results = await engine.validateCitations(citations);

      expect(results).toHaveLength(3);
      expect(results[0].citation.id).toBe('test_citation_1');
      expect(results[1].citation.id).toBe('test_citation_2');
      expect(results[2].citation.id).toBe('test_citation_3');
    });

    it('should handle empty citation array', async () => {
      const results = await engine.validateCitations([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('createEnhancedCitation', () => {
    it('should create enhanced citation with validation data', async () => {
      const enhanced = await engine.createEnhancedCitation(mockCitation);

      expect(enhanced.id).toBe(mockCitation.id);
      expect(enhanced.validationStatus).toBeDefined();
      expect(enhanced.validationStatus.lastValidated).toBeInstanceOf(Date);
      expect(enhanced.validationStatus.accessibilityStatus).toBeDefined();
      expect(enhanced.validationStatus.credibilityAssessment).toBeDefined();
      expect(enhanced.validationStatus.complianceStatus).toBeDefined();

      expect(enhanced.qualityMetrics).toBeDefined();
      expect(enhanced.qualityMetrics.credibilityScore).toBeGreaterThanOrEqual(0);
      expect(enhanced.qualityMetrics.credibilityScore).toBeLessThanOrEqual(100);
      expect(enhanced.qualityMetrics.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(enhanced.qualityMetrics.recencyScore).toBeGreaterThanOrEqual(0);
      expect(enhanced.qualityMetrics.overallQuality).toBeGreaterThanOrEqual(0);

      expect(enhanced.usageTracking).toBeDefined();
      expect(enhanced.usageTracking.timesUsed).toBe(0);
      expect(enhanced.usageTracking.documentsReferenced).toHaveLength(0);

      expect(enhanced.alternatives).toBeDefined();
      expect(enhanced.alternatives.similarSources).toBeInstanceOf(Array);
      expect(enhanced.alternatives.updatedVersions).toBeInstanceOf(Array);
      expect(enhanced.alternatives.betterAlternatives).toBeInstanceOf(Array);
    });

    it('should calculate quality metrics correctly', async () => {
      const highQualityCitation: Citation = {
        ...mockCitation,
        domain: 'harvard.edu',
        source_type: CitationSourceType.ACADEMIC_PAPER,
        confidence: CitationConfidence.HIGH,
        published_at: new Date().toISOString(), // Recent publication
      };

      const enhanced = await engine.createEnhancedCitation(highQualityCitation);

      expect(enhanced.qualityMetrics.credibilityScore).toBeGreaterThan(70);
      expect(enhanced.qualityMetrics.recencyScore).toBeGreaterThan(90);
      expect(enhanced.qualityMetrics.overallQuality).toBeGreaterThan(70);
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', async () => {
      // Populate caches
      await engine.validateSourceAccessibility('https://example.com/test1');
      await engine.assessSourceCredibility(mockCitation);

      const statsBefore = engine.getCacheStats();
      expect(statsBefore.accessibility).toBeGreaterThan(0);

      engine.clearCache();

      const statsAfter = engine.getCacheStats();
      expect(statsAfter.accessibility).toBe(0);
      expect(statsAfter.credibility).toBe(0);
      expect(statsAfter.domainAuthority).toBe(0);
    });

    it('should provide accurate cache statistics', async () => {
      const initialStats = engine.getCacheStats();
      expect(initialStats.accessibility).toBe(0);
      expect(initialStats.credibility).toBe(0);
      expect(initialStats.domainAuthority).toBe(0);

      await engine.validateSourceAccessibility('https://example.com/test');
      await engine.assessSourceCredibility(mockCitation);

      const updatedStats = engine.getCacheStats();
      expect(updatedStats.accessibility).toBeGreaterThan(0);
      expect(updatedStats.credibility).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', async () => {
      const result = await engine.validateSourceAccessibility('not-a-url');

      expect(result).toBeDefined();
      expect(result.isAccessible).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });

    it('should handle citations with missing required fields', async () => {
      const incompleteCitation: Partial<Citation> = {
        id: 'incomplete',
        title: 'Incomplete Citation',
        domain: '', // Empty domain
        url: 'https://example.com/test',
        published_at: '2024-01-01',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Test finding',
      };

      // Should not throw error and should handle gracefully
      const result = await engine.assessSourceCredibility(incompleteCitation as Citation);
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle network timeouts gracefully', async () => {
      const result = await engine.validateSourceAccessibility('https://timeout-site.com/slow');

      expect(result).toBeDefined();
      expect(result.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('Domain Authority Assessment', () => {
    it('should recognize high-quality domains', async () => {
      const highQualityDomains = ['mckinsey.com', 'harvard.edu', 'mit.edu', 'gov'];

      for (const domain of highQualityDomains) {
        const citation: Citation = {
          ...mockCitation,
          domain,
        };

        const assessment = await engine.assessSourceCredibility(citation);
        expect(assessment.factors.domainAuthority).toBeGreaterThan(70);
      }
    });

    it('should penalize low-quality domains', async () => {
      const lowQualityDomains = ['contentfarm.com', 'clickbait.net'];

      for (const domain of lowQualityDomains) {
        const citation: Citation = {
          ...mockCitation,
          domain,
        };

        const assessment = await engine.assessSourceCredibility(citation);
        expect(assessment.factors.domainAuthority).toBeLessThan(40);
        expect(assessment.riskFactors).toContain('High spam score detected');
      }
    });
  });

  describe('Recency Scoring', () => {
    it('should give high scores to recent publications', async () => {
      const recentCitation: Citation = {
        ...mockCitation,
        published_at: new Date().toISOString(),
      };

      const enhanced = await engine.createEnhancedCitation(recentCitation);
      expect(enhanced.qualityMetrics.recencyScore).toBeGreaterThan(95);
    });

    it('should penalize old publications', async () => {
      const oldCitation: Citation = {
        ...mockCitation,
        published_at: '2010-01-01',
      };

      const enhanced = await engine.createEnhancedCitation(oldCitation);
      expect(enhanced.qualityMetrics.recencyScore).toBeLessThan(50);
    });
  });

  describe('Source Type Assessment', () => {
    it('should properly assess different source types', async () => {
      // Clear cache to ensure fresh assessments
      engine.clearCache();

      // Test academic paper
      const academicCitation: Citation = {
        id: 'test_academic',
        title: 'Test Academic Paper',
        url: 'https://academic-domain.com/paper',
        domain: 'academic-domain.com',
        published_at: '2024-01-15',
        source_type: CitationSourceType.ACADEMIC_PAPER,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Test finding',
        organization: 'Test Organization',
      };

      const academicAssessment = await engine.assessSourceCredibility(academicCitation);
      expect(academicAssessment.factors.peerReviewStatus).toBe(90);

      // Test research publication with different domain
      const researchCitation: Citation = {
        id: 'test_research',
        title: 'Test Research Publication',
        url: 'https://research-domain.com/publication',
        domain: 'research-domain.com',
        published_at: '2024-01-15',
        source_type: CitationSourceType.RESEARCH_PUBLICATION,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Test finding',
        organization: 'Test Organization',
      };

      const researchAssessment = await engine.assessSourceCredibility(researchCitation);
      expect(researchAssessment.factors.peerReviewStatus).toBe(80);

      // Test consulting study with different domain
      const consultingCitation: Citation = {
        id: 'test_consulting',
        title: 'Test Consulting Study',
        url: 'https://consulting-domain.com/study',
        domain: 'consulting-domain.com',
        published_at: '2024-01-15',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Test finding',
        organization: 'Test Organization',
      };

      const consultingAssessment = await engine.assessSourceCredibility(consultingCitation);
      expect(consultingAssessment.factors.peerReviewStatus).toBe(70);

      // Test industry report with different domain
      const industryReportCitation: Citation = {
        id: 'test_industry',
        title: 'Test Industry Report',
        url: 'https://industry-domain.com/report',
        domain: 'industry-domain.com',
        published_at: '2024-01-15',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Test finding',
        organization: 'Test Organization',
      };

      const industryAssessment = await engine.assessSourceCredibility(industryReportCitation);
      expect(industryAssessment.factors.peerReviewStatus).toBe(60);
    });
  });
});
