import { CitationService } from '../../components/citation-service';
import {
  Citation,
  CitationSourceType,
  CitationConfidence,
  CitationSearchCriteria,
} from '../../models/citations';

describe('Expanded Citation Database', () => {
  let citationService: CitationService;

  beforeEach(() => {
    citationService = new CitationService();
  });

  describe('Database Expansion', () => {
    it('should have significantly more citations than the original database', () => {
      const stats = citationService.getDatabaseStatistics();
      expect(stats.totalCitations).toBeGreaterThan(20); // Original had 8, expanded should have 20+
    });

    it('should include citations from major consulting firms', () => {
      const mckinseyCitations = citationService.searchCitations('McKinsey');
      const bcgCitations = citationService.searchCitations('Boston Consulting Group');
      const bainCitations = citationService.searchCitations('Bain');
      const deloitteCitations = citationService.searchCitations('Deloitte');
      const pwcCitations = citationService.searchCitations('PwC');

      expect(mckinseyCitations.length).toBeGreaterThan(1);
      expect(bcgCitations.length).toBeGreaterThan(1);
      expect(bainCitations.length).toBeGreaterThan(1);
      expect(deloitteCitations.length).toBeGreaterThan(0);
      expect(pwcCitations.length).toBeGreaterThan(0);
    });

    it('should include recent industry reports and market research', async () => {
      const recentCitations = await citationService.findRelevantCitations({
        keywords: ['2024'],
        date_range: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
      });

      expect(recentCitations.length).toBeGreaterThanOrEqual(10);

      // All should be from 2024
      recentCitations.forEach(citation => {
        expect(citation.published_at).toMatch(/^2024/);
      });
    });

    it('should have diverse source types including consulting studies', () => {
      const stats = citationService.getDatabaseStatistics();

      expect(stats.sourceTypeDistribution[CitationSourceType.CONSULTING_STUDY]).toBeGreaterThan(5);
      expect(stats.sourceTypeDistribution[CitationSourceType.INDUSTRY_REPORT]).toBeGreaterThan(3);
      expect(stats.sourceTypeDistribution[CitationSourceType.RESEARCH_PUBLICATION]).toBeGreaterThan(
        2
      );
      expect(stats.sourceTypeDistribution[CitationSourceType.ACADEMIC_PAPER]).toBeGreaterThan(1);
    });

    it('should have high-quality sources with proper confidence ratings', () => {
      const stats = citationService.getDatabaseStatistics();

      expect(stats.confidenceDistribution[CitationConfidence.HIGH]).toBeGreaterThan(10);
      expect(stats.qualityMetrics.averageQualityScore).toBeGreaterThan(85);
      expect(stats.qualityMetrics.highQualitySources).toBeGreaterThan(15);
    });
  });

  describe('Source Quality Validation', () => {
    it('should validate high-quality citations correctly', () => {
      const highQualityCitation: Citation = {
        id: 'test_high_quality',
        title: 'Comprehensive Business Analysis: Market Trends and Strategic Insights 2024',
        url: 'https://www.mckinsey.com/test-report',
        domain: 'mckinsey.com',
        published_at: '2024-06-15',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding:
          'High-performing companies achieve 25% better results through strategic planning and execution',
        organization: 'McKinsey & Company',
        methodology: 'Survey of 1,000+ executives across 20 industries',
        sample_size: 1000,
        geographic_scope: 'Global',
        industry_focus: ['strategy', 'performance', 'consulting'],
      };

      const validation = citationService.validateSourceQuality(highQualityCitation);

      expect(validation.isValid).toBe(true);
      expect(validation.qualityScore).toBeGreaterThan(90);
      expect(validation.issues).toHaveLength(0);
      expect(validation.recommendations).toContain(
        'Excellent source quality - suitable for high-stakes business documents'
      );
    });

    it('should identify issues with low-quality citations', () => {
      const lowQualityCitation: Citation = {
        id: 'test_low_quality',
        title: 'Short',
        url: 'invalid-url',
        domain: 'unknown.com',
        published_at: '2020-01-01',
        source_type: CitationSourceType.COMPANY_BLOG,
        confidence: CitationConfidence.LOW,
        key_finding: 'Brief finding',
        organization: '',
        methodology: undefined,
        sample_size: undefined,
        geographic_scope: undefined,
        industry_focus: undefined,
      };

      const validation = citationService.validateSourceQuality(lowQualityCitation);

      expect(validation.isValid).toBe(false);
      expect(validation.qualityScore).toBeLessThan(60);
      expect(validation.issues.length).toBeGreaterThan(3);
      expect(validation.issues).toContain('Title is missing or too short');
      expect(validation.issues).toContain('Invalid or missing URL');
      expect(validation.issues).toContain('Missing organization information');
    });

    it('should validate methodology requirements for research sources', () => {
      const researchCitation: Citation = {
        id: 'test_research',
        title: 'Market Research Study on Consumer Behavior Trends',
        url: 'https://www.example.com/research',
        domain: 'example.com',
        published_at: '2024-03-01',
        source_type: CitationSourceType.SURVEY_DATA,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Consumer preferences have shifted significantly in the past year',
        organization: 'Research Institute',
        methodology: undefined, // Missing methodology
        sample_size: 25, // Too small
        geographic_scope: 'North America',
        industry_focus: ['consumer', 'retail'],
      };

      const validation = citationService.validateSourceQuality(researchCitation);

      expect(validation.issues).toContain('Missing methodology for research-based source');
      expect(validation.issues).toContain(
        'Sample size is missing or too small for reliable insights'
      );
    });

    it('should penalize outdated sources', () => {
      const outdatedCitation: Citation = {
        id: 'test_outdated',
        title: 'Business Trends Analysis from the Past',
        url: 'https://www.mckinsey.com/old-report',
        domain: 'mckinsey.com',
        published_at: '2020-01-01', // 4+ years old
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Historical business trends and their implications for future strategy',
        organization: 'McKinsey & Company',
        methodology: 'Historical analysis of business trends',
        sample_size: 500,
        geographic_scope: 'Global',
        industry_focus: ['strategy', 'trends'],
      };

      const validation = citationService.validateSourceQuality(outdatedCitation);

      expect(validation.issues).toContain('Source is older than 3 years');
      expect(validation.recommendations).toContain(
        'Consider finding more recent sources on this topic'
      );
    });
  });

  describe('Validated Citation Addition', () => {
    it('should successfully add high-quality citations', () => {
      const initialCount = citationService.getDatabaseStatistics().totalCitations;

      const newCitation: Citation = {
        id: 'test_new_citation',
        title: 'New Market Analysis: Emerging Technology Trends 2024',
        url: 'https://www.bcg.com/new-analysis',
        domain: 'bcg.com',
        published_at: '2024-08-01',
        source_type: CitationSourceType.CONSULTING_STUDY,
        confidence: CitationConfidence.HIGH,
        key_finding:
          'Emerging technologies will drive 40% of business value creation in the next 5 years',
        organization: 'Boston Consulting Group',
        methodology: 'Analysis of technology adoption across 500+ companies',
        sample_size: 500,
        geographic_scope: 'Global',
        industry_focus: ['technology', 'innovation', 'strategy'],
      };

      const result = citationService.addValidatedCitation(newCitation);

      expect(result.success).toBe(true);
      expect(result.validation.isValid).toBe(true);
      expect(citationService.getDatabaseStatistics().totalCitations).toBe(initialCount + 1);
    });

    it('should reject low-quality citations', () => {
      const initialCount = citationService.getDatabaseStatistics().totalCitations;

      const badCitation: Citation = {
        id: 'test_bad_citation',
        title: 'Bad',
        url: 'not-a-url',
        domain: 'bad.com',
        published_at: '2019-01-01',
        source_type: CitationSourceType.COMPANY_BLOG,
        confidence: CitationConfidence.LOW,
        key_finding: 'Bad',
        organization: '',
        methodology: undefined,
        sample_size: undefined,
        geographic_scope: undefined,
        industry_focus: undefined,
      };

      const result = citationService.addValidatedCitation(badCitation);

      expect(result.success).toBe(false);
      expect(result.validation.isValid).toBe(false);
      expect(citationService.getDatabaseStatistics().totalCitations).toBe(initialCount);
    });

    it('should handle bulk citation addition with validation', () => {
      const citations: Citation[] = [
        {
          id: 'bulk_good_1',
          title: 'Good Citation One: Comprehensive Market Analysis',
          url: 'https://www.mckinsey.com/good-1',
          domain: 'mckinsey.com',
          published_at: '2024-07-01',
          source_type: CitationSourceType.CONSULTING_STUDY,
          confidence: CitationConfidence.HIGH,
          key_finding: 'Market analysis shows strong growth potential in emerging sectors',
          organization: 'McKinsey & Company',
          methodology: 'Survey of 800+ market participants',
          sample_size: 800,
          geographic_scope: 'Global',
          industry_focus: ['market_analysis', 'growth'],
        },
        {
          id: 'bulk_bad_1',
          title: 'Bad',
          url: 'invalid',
          domain: 'bad.com',
          published_at: '2019-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'Bad finding',
          organization: '',
          methodology: undefined,
          sample_size: undefined,
          geographic_scope: undefined,
          industry_focus: undefined,
        },
      ];

      const result = citationService.addValidatedCitations(citations);

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.summary.averageQualityScore).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Enhanced Search Capabilities', () => {
    it('should find consulting firm sources by organization', () => {
      const mckinseySources = citationService.searchCitations('McKinsey');
      const bcgSources = citationService.searchCitations('Boston Consulting Group');
      const bainSources = citationService.searchCitations('Bain');

      expect(mckinseySources.length).toBeGreaterThan(0);
      expect(bcgSources.length).toBeGreaterThan(0);
      expect(bainSources.length).toBeGreaterThan(0);

      // Verify they contain the expected organizations
      mckinseySources.forEach(citation => {
        expect(citation.organization?.toLowerCase()).toContain('mckinsey');
      });
    });

    it('should find sources by industry focus', async () => {
      const aiSources = await citationService.findRelevantCitations({
        keywords: ['ai', 'artificial intelligence'],
      });

      const digitalSources = await citationService.findRelevantCitations({
        keywords: ['digital transformation'],
      });

      expect(aiSources.length).toBeGreaterThan(0);
      expect(digitalSources.length).toBeGreaterThan(0);

      // Verify industry focus includes relevant terms
      aiSources.forEach(citation => {
        const hasAIFocus =
          citation.industry_focus?.some(
            (focus: string) =>
              focus.toLowerCase().includes('ai') || focus.toLowerCase().includes('technology')
          ) || citation.key_finding.toLowerCase().includes('ai');
        expect(hasAIFocus).toBe(true);
      });
    });

    it('should filter by source type effectively', async () => {
      const consultingStudies = await citationService.findRelevantCitations({
        keywords: ['strategy'],
        source_types: [CitationSourceType.CONSULTING_STUDY],
      });

      const industryReports = await citationService.findRelevantCitations({
        keywords: ['market'],
        source_types: [CitationSourceType.INDUSTRY_REPORT],
      });

      expect(consultingStudies.length).toBeGreaterThan(0);
      expect(industryReports.length).toBeGreaterThan(0);

      consultingStudies.forEach(citation => {
        expect(citation.source_type).toBe(CitationSourceType.CONSULTING_STUDY);
      });

      industryReports.forEach(citation => {
        expect(citation.source_type).toBe(CitationSourceType.INDUSTRY_REPORT);
      });
    });

    it('should filter by confidence level', async () => {
      const highConfidenceSources = await citationService.findRelevantCitations({
        keywords: ['business'],
        minimum_confidence: CitationConfidence.HIGH,
      });

      expect(highConfidenceSources.length).toBeGreaterThan(0);
      highConfidenceSources.forEach(citation => {
        expect(citation.confidence).toBe(CitationConfidence.HIGH);
      });
    });

    it('should filter by date range', async () => {
      const recent2024Sources = await citationService.findRelevantCitations({
        keywords: ['technology'],
        date_range: {
          start: '2024-06-01',
          end: '2024-12-31',
        },
      });

      expect(recent2024Sources.length).toBeGreaterThan(0);
      recent2024Sources.forEach(citation => {
        const citationDate = new Date(citation.published_at);
        expect(citationDate.getFullYear()).toBe(2024);
        expect(citationDate.getMonth()).toBeGreaterThanOrEqual(5); // June = 5 (0-indexed)
      });
    });
  });

  describe('Database Statistics and Quality Metrics', () => {
    it('should provide comprehensive database statistics', () => {
      const stats = citationService.getDatabaseStatistics();

      expect(stats.totalCitations).toBeGreaterThan(20);
      expect(stats.sourceTypeDistribution).toBeDefined();
      expect(stats.confidenceDistribution).toBeDefined();
      expect(stats.organizationDistribution).toBeDefined();
      expect(stats.industryDistribution).toBeDefined();
      expect(stats.averageAge).toBeGreaterThan(0);
      expect(stats.qualityMetrics).toBeDefined();
    });

    it('should show high average quality scores', () => {
      const stats = citationService.getDatabaseStatistics();

      expect(stats.qualityMetrics.averageQualityScore).toBeGreaterThan(80);
      expect(stats.qualityMetrics.highQualitySources).toBeGreaterThan(10);
      expect(
        stats.qualityMetrics.highQualitySources + stats.qualityMetrics.mediumQualitySources
      ).toBeGreaterThan(stats.qualityMetrics.lowQualitySources);
    });

    it('should show proper distribution of consulting firms', () => {
      const stats = citationService.getDatabaseStatistics();

      expect(stats.organizationDistribution['McKinsey & Company']).toBeGreaterThan(1);
      expect(stats.organizationDistribution['Boston Consulting Group']).toBeGreaterThan(1);
      expect(stats.organizationDistribution['Bain & Company']).toBeGreaterThan(1);
    });

    it('should show diverse industry coverage', () => {
      const stats = citationService.getDatabaseStatistics();

      expect(Object.keys(stats.industryDistribution).length).toBeGreaterThan(10);
      expect(stats.industryDistribution['technology']).toBeGreaterThan(5);
      expect(stats.industryDistribution['strategy']).toBeGreaterThan(3);
      expect(stats.industryDistribution['ai']).toBeGreaterThan(2);
    });

    it('should show recent average age for sources', () => {
      const stats = citationService.getDatabaseStatistics();

      // Average age should be less than 18 months for a 2024-focused database
      expect(stats.averageAge).toBeLessThan(18);
    });
  });

  describe('Integration with Existing Functionality', () => {
    it('should maintain compatibility with existing citation requirements', async () => {
      const businessCaseReqs = citationService.getCitationRequirements('business_case');
      const marketAnalysisReqs = citationService.getCitationRequirements('market_analysis');

      expect(businessCaseReqs.minimum_citations).toBe(5);
      expect(marketAnalysisReqs.minimum_citations).toBe(8);

      // Should be able to find enough citations to meet requirements
      const businessCaseCitations = await citationService.findRelevantCitations({
        keywords: ['business', 'strategy'],
        source_types: businessCaseReqs.required_source_types,
        minimum_confidence: businessCaseReqs.minimum_confidence_level,
      });

      expect(businessCaseCitations.length).toBeGreaterThanOrEqual(3); // Should have at least some citations
    });

    it('should work with existing formatting methods', async () => {
      const citations = await citationService.findRelevantCitations({
        keywords: ['business', 'strategy'],
      });

      expect(citations.length).toBeGreaterThan(0);

      const formattedBusiness = citationService.formatCitation(citations[0], 'business');
      const formattedAPA = citationService.formatCitation(citations[0], 'apa');
      const formattedInline = citationService.formatCitation(citations[0], 'inline');

      expect(formattedBusiness.style).toBe('business');
      expect(formattedAPA.style).toBe('apa');
      expect(formattedInline.style).toBe('inline');

      expect(formattedBusiness.formatted_text).toBeDefined();
      expect(formattedBusiness.hyperlink).toBe(citations[0].url);
    });

    it('should generate proper bibliography with expanded sources', async () => {
      const citations = await citationService.findRelevantCitations({
        keywords: ['digital transformation'],
        source_types: [CitationSourceType.CONSULTING_STUDY],
      });

      expect(citations.length).toBeGreaterThan(0);

      const bibliography = citationService.generateBibliography(citations.slice(0, 3));

      expect(bibliography).toContain('## References');
      expect(bibliography.split('\n').length).toBeGreaterThanOrEqual(3); // Header + citations
    });

    it('should calculate proper citation metrics for expanded database', async () => {
      const allCitations = await citationService.findRelevantCitations({
        keywords: ['business', 'strategy', 'technology', 'ai', 'digital'],
      });

      const metrics = citationService.calculateCitationMetrics(allCitations);

      expect(metrics.total_citations).toBeGreaterThanOrEqual(10);
      expect(metrics.unique_domains).toBeGreaterThan(5);
      expect(metrics.average_confidence).toBeGreaterThan(2); // Should be mostly medium/high
      expect(metrics.credibility_score).toBeGreaterThan(70);
      expect(metrics.diversity_score).toBeGreaterThan(25);
      expect(metrics.recency_score).toBeGreaterThan(70); // 2024 sources should be recent
    });
  });
});
