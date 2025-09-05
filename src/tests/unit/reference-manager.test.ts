/**
 * Unit Tests for Reference Manager Component
 * 
 * Tests the reference manager for McKinsey, Gartner, and WEF sources,
 * including source validation and citation formatting as specified in requirements 1.5 and 1.6.
 */

import {
  ReferenceManager,
  createReferenceManager,
  validateAndFormatSources,
  checkSourceUpdates
} from '../../components/reference-manager';
import {
  SourceReference,
  FreshnessStatus,
  UpdateRecommendation,
  ValidationResult
} from '../../models/competitive';

describe('Reference Manager', () => {
  let referenceManager: ReferenceManager;

  beforeEach(() => {
    referenceManager = createReferenceManager();
  });

  describe('Source Validation (Requirement 1.5)', () => {
    it('should validate McKinsey sources as credible', () => {
      const mcKinseyUrl = 'https://mckinsey.com/industries/technology/our-insights/tech-trends-2024';
      const mcKinseyName = 'McKinsey Global Institute Report';

      expect(referenceManager.validateSource(mcKinseyUrl)).toBe(true);
      expect(referenceManager.validateSource(mcKinseyName)).toBe(true);
    });

    it('should validate Gartner sources as credible', () => {
      const gartnerUrl = 'https://gartner.com/research/magic-quadrant-2024';
      const gartnerName = 'Gartner Magic Quadrant Analysis';

      expect(referenceManager.validateSource(gartnerUrl)).toBe(true);
      expect(referenceManager.validateSource(gartnerName)).toBe(true);
    });

    it('should validate World Economic Forum sources as credible', () => {
      const wefUrl = 'https://weforum.org/reports/future-of-jobs-2024';
      const wefName = 'World Economic Forum Industry Report';

      expect(referenceManager.validateSource(wefUrl)).toBe(true);
      expect(referenceManager.validateSource(wefName)).toBe(true);
    });

    it('should validate other trusted consulting sources', () => {
      const trustedSources = [
        'https://bcg.com/publications/industry-insights',
        'https://bain.com/insights/market-analysis',
        'https://deloitte.com/research/technology-trends',
        'https://forrester.com/research/technology-market'
      ];

      trustedSources.forEach(source => {
        expect(referenceManager.validateSource(source)).toBe(true);
      });
    });

    it('should reject non-credible sources', () => {
      const untrustedSources = [
        'https://random-blog.com/market-analysis',
        'https://unknown-site.net/industry-report',
        'Personal opinion blog',
        'Unverified market research'
      ];

      untrustedSources.forEach(source => {
        expect(referenceManager.validateSource(source)).toBe(false);
      });
    });

    it('should validate SourceReference objects', () => {
      const validSource: SourceReference = {
        id: 'test-source-1',
        type: 'mckinsey',
        title: 'Technology Trends 2024',
        organization: 'McKinsey & Company',
        publishDate: '2024-01-15',
        accessDate: '2024-02-01',
        reliability: 0.95,
        relevance: 0.90,
        dataFreshness: {
          status: 'fresh',
          ageInDays: 15,
          recommendedUpdateFrequency: 90,
          lastValidated: '2024-02-01'
        },
        citationFormat: 'McKinsey & Company (2024). Technology Trends 2024.',
        keyFindings: ['AI adoption trends', 'Digital transformation insights'],
        limitations: ['Limited geographic scope']
      };

      expect(referenceManager.validateSource(validSource)).toBe(true);
    });

    it('should reject invalid SourceReference objects', () => {
      const invalidSources = [
        // Missing required fields
        {
          id: 'invalid-1',
          type: 'mckinsey',
          // Missing title, organization, publishDate
        },
        // Invalid reliability score
        {
          id: 'invalid-2',
          type: 'gartner',
          title: 'Test Report',
          organization: 'Gartner Inc.',
          publishDate: '2024-01-01',
          reliability: 1.5, // Invalid - should be 0-1
        },
        // Invalid date
        {
          id: 'invalid-3',
          type: 'wef',
          title: 'Test Report',
          organization: 'World Economic Forum',
          publishDate: 'invalid-date',
          reliability: 0.8,
        }
      ];

      invalidSources.forEach(source => {
        expect(referenceManager.validateSource(source as SourceReference)).toBe(false);
      });
    });
  });

  describe('Citation Formatting (Requirement 1.6)', () => {
    it('should format McKinsey citations correctly', () => {
      const mcKinseySource: SourceReference = {
        id: 'mckinsey-test',
        type: 'mckinsey',
        title: 'The Future of Technology in Business',
        organization: 'McKinsey & Company',
        publishDate: '2024-01-15',
        accessDate: '2024-02-01',
        reliability: 0.95,
        relevance: 0.90,
        url: 'https://mckinsey.com/test-report',
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const citation = referenceManager.formatCitation(mcKinseySource);
      
      expect(citation).toContain('McKinsey & Company');
      expect(citation).toContain('2024');
      expect(citation).toContain('The Future of Technology in Business');
      expect(citation).toMatch(/McKinsey & Company \(2024\)\. The Future of Technology in Business\. Retrieved from https:\/\/mckinsey\.com\/test-report/);
    });

    it('should format Gartner citations correctly', () => {
      const gartnerSource: SourceReference = {
        id: 'gartner-test',
        type: 'gartner',
        title: 'Magic Quadrant for CRM Platforms',
        organization: 'Gartner Inc.',
        publishDate: '2024-02-01',
        accessDate: '2024-02-15',
        reliability: 0.90,
        relevance: 0.95,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const citation = referenceManager.formatCitation(gartnerSource);
      
      expect(citation).toContain('Gartner');
      expect(citation).toContain('2024');
      expect(citation).toContain('Magic Quadrant for CRM Platforms');
      expect(citation).toMatch(/Gartner \(2024\)\. Magic Quadrant for CRM Platforms\. Gartner Research\./);
    });

    it('should format WEF citations correctly', () => {
      const wefSource: SourceReference = {
        id: 'wef-test',
        type: 'wef',
        title: 'Global Technology Governance Report 2024',
        organization: 'World Economic Forum',
        publishDate: '2024-01-30',
        accessDate: '2024-02-10',
        reliability: 0.85,
        relevance: 0.80,
        url: 'https://weforum.org/reports/tech-governance-2024',
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const citation = referenceManager.formatCitation(wefSource);
      
      expect(citation).toContain('World Economic Forum');
      expect(citation).toContain('2024');
      expect(citation).toContain('Global Technology Governance Report 2024');
      expect(citation).toMatch(/World Economic Forum \(2024\)\. Global Technology Governance Report 2024\. Retrieved from https:\/\/weforum\.org\/reports\/tech-governance-2024/);
    });

    it('should generate generic citations for unknown source types', () => {
      const genericSource: SourceReference = {
        id: 'generic-test',
        type: 'industry-report',
        title: 'Industry Analysis Report',
        organization: 'Research Institute',
        publishDate: '2024-01-01',
        accessDate: '2024-02-01',
        reliability: 0.70,
        relevance: 0.75,
        url: 'https://research-institute.com/report',
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const citation = referenceManager.formatCitation(genericSource);
      
      expect(citation).toContain('Research Institute');
      expect(citation).toContain('2024');
      expect(citation).toContain('Industry Analysis Report');
      expect(citation).toContain('Retrieved from https://research-institute.com/report');
    });
  });

  describe('Data Freshness Tracking', () => {
    it('should correctly assess fresh data', () => {
      const freshDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 15 days ago
      
      const freshSource: SourceReference = {
        id: 'fresh-test',
        type: 'mckinsey',
        title: 'Recent Market Analysis',
        organization: 'McKinsey & Company',
        publishDate: freshDate,
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.95,
        relevance: 0.90,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const freshness = referenceManager.checkDataFreshness(freshSource);
      
      expect(freshness.status).toBe('fresh');
      expect(freshness.ageInDays).toBe(15);
      expect(freshness.recommendedUpdateFrequency).toBe(90);
    });

    it('should correctly assess stale data', () => {
      const staleDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 200 days ago
      
      const staleSource: SourceReference = {
        id: 'stale-test',
        type: 'gartner',
        title: 'Older Market Analysis',
        organization: 'Gartner Inc.',
        publishDate: staleDate,
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.90,
        relevance: 0.85,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const freshness = referenceManager.checkDataFreshness(staleSource);
      
      expect(freshness.status).toBe('stale');
      expect(freshness.ageInDays).toBe(200);
    });

    it('should correctly assess outdated data', () => {
      const outdatedDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 400 days ago
      
      const outdatedSource: SourceReference = {
        id: 'outdated-test',
        type: 'wef',
        title: 'Very Old Report',
        organization: 'World Economic Forum',
        publishDate: outdatedDate,
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.85,
        relevance: 0.70,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const freshness = referenceManager.checkDataFreshness(outdatedSource);
      
      expect(freshness.status).toBe('outdated');
      expect(freshness.ageInDays).toBe(400);
    });

    it('should have different freshness thresholds for different source types', () => {
      const testDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 45 days ago
      
      const mcKinseySource: SourceReference = {
        id: 'mckinsey-freshness',
        type: 'mckinsey',
        title: 'Test Report',
        organization: 'McKinsey & Company',
        publishDate: testDate,
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.95,
        relevance: 0.90,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const wefSource: SourceReference = {
        ...mcKinseySource,
        id: 'wef-freshness',
        type: 'wef',
        organization: 'World Economic Forum'
      };

      const mcKinseyFreshness = referenceManager.checkDataFreshness(mcKinseySource);
      const wefFreshness = referenceManager.checkDataFreshness(wefSource);
      
      // McKinsey should be 'recent' at 45 days, WEF should be 'fresh'
      expect(mcKinseyFreshness.status).toBe('recent');
      expect(wefFreshness.status).toBe('fresh');
    });
  });

  describe('Update Recommendations', () => {
    it('should suggest updates for outdated sources', () => {
      const outdatedSource: SourceReference = {
        id: 'outdated-source',
        type: 'mckinsey',
        title: 'Old Market Report',
        organization: 'McKinsey & Company',
        publishDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.95,
        relevance: 0.90,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const recommendations = referenceManager.suggestUpdates([outdatedSource]);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBe('data-refresh');
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].description).toContain('outdated');
    });

    it('should suggest verification for stale sources', () => {
      const staleSource: SourceReference = {
        id: 'stale-source',
        type: 'gartner',
        title: 'Somewhat Old Report',
        organization: 'Gartner Inc.',
        publishDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.90,
        relevance: 0.85,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const recommendations = referenceManager.suggestUpdates([staleSource]);
      
      expect(recommendations.length).toBeGreaterThan(0);
      const verificationRec = recommendations.find(r => r.type === 'source-verification');
      expect(verificationRec).toBeDefined();
      expect(verificationRec!.priority).toBe('medium');
    });

    it('should recommend adding authoritative sources when missing', () => {
      const nonAuthoritativeSource: SourceReference = {
        id: 'non-auth-source',
        type: 'industry-report',
        title: 'Generic Industry Report',
        organization: 'Some Research Firm',
        publishDate: new Date().toISOString().split('T')[0],
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.70,
        relevance: 0.80,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const recommendations = referenceManager.suggestUpdates([nonAuthoritativeSource]);
      
      const authRec = recommendations.find(r => r.type === 'methodology-update');
      expect(authRec).toBeDefined();
      expect(authRec!.description).toContain('authoritative sources');
      expect(authRec!.priority).toBe('high');
    });

    it('should prioritize recommendations correctly', () => {
      const sources: SourceReference[] = [
        {
          id: 'outdated',
          type: 'mckinsey',
          title: 'Very Old Report',
          organization: 'McKinsey & Company',
          publishDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          accessDate: new Date().toISOString().split('T')[0],
          reliability: 0.95,
          relevance: 0.90,
          dataFreshness: {} as FreshnessStatus,
          citationFormat: '',
          keyFindings: [],
          limitations: []
        },
        {
          id: 'stale',
          type: 'industry-report',
          title: 'Stale Report',
          organization: 'Research Firm',
          publishDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          accessDate: new Date().toISOString().split('T')[0],
          reliability: 0.70,
          relevance: 0.75,
          dataFreshness: {} as FreshnessStatus,
          citationFormat: '',
          keyFindings: [],
          limitations: []
        }
      ];

      const recommendations = referenceManager.suggestUpdates(sources);
      
      // High priority recommendations should come first
      expect(recommendations[0].priority).toBe('high');
      if (recommendations.length > 1) {
        expect(['high', 'medium']).toContain(recommendations[1].priority);
      }
    });
  });

  describe('Source Creation Methods', () => {
    it('should create McKinsey source references correctly', () => {
      const mcKinseyRef = referenceManager.createMcKinseyReference(
        'Technology Transformation in Financial Services',
        '2024-01-15',
        'https://mckinsey.com/industries/financial-services/tech-transformation'
      );

      expect(mcKinseyRef.type).toBe('mckinsey');
      expect(mcKinseyRef.organization).toBe('McKinsey & Company');
      expect(mcKinseyRef.title).toBe('Technology Transformation in Financial Services');
      expect(mcKinseyRef.reliability).toBe(0.95);
      expect(mcKinseyRef.url).toBe('https://mckinsey.com/industries/financial-services/tech-transformation');
    });

    it('should create Gartner source references correctly', () => {
      const gartnerRef = referenceManager.createGartnerReference(
        'Magic Quadrant for Enterprise Software Platforms',
        '2024-02-01'
      );

      expect(gartnerRef.type).toBe('gartner');
      expect(gartnerRef.organization).toBe('Gartner Inc.');
      expect(gartnerRef.title).toBe('Magic Quadrant for Enterprise Software Platforms');
      expect(gartnerRef.reliability).toBe(0.90);
    });

    it('should create WEF source references correctly', () => {
      const wefRef = referenceManager.createWEFReference(
        'Future of Work in the Digital Economy',
        '2024-01-30',
        'https://weforum.org/reports/future-of-work-digital-economy'
      );

      expect(wefRef.type).toBe('wef');
      expect(wefRef.organization).toBe('World Economic Forum');
      expect(wefRef.title).toBe('Future of Work in the Digital Economy');
      expect(wefRef.reliability).toBe(0.85);
      expect(wefRef.url).toBe('https://weforum.org/reports/future-of-work-digital-economy');
    });
  });

  describe('Source Collection Validation', () => {
    it('should validate a high-quality source collection', () => {
      const highQualitySources: SourceReference[] = [
        referenceManager.createMcKinseyReference('Industry Report 1', '2024-01-15'),
        referenceManager.createGartnerReference('Technology Analysis', '2024-01-20'),
        referenceManager.createWEFReference('Global Trends Report', '2024-01-25')
      ];

      const validation = referenceManager.validateSourceCollection(highQualitySources);
      
      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThanOrEqual(0.8);
      // Allow for some warnings as the validation logic may flag certain conditions
      expect(validation.warnings.length).toBeLessThanOrEqual(1);
    });

    it('should identify issues with low-quality source collections', () => {
      const lowQualitySources: SourceReference[] = [
        {
          id: 'low-quality',
          type: 'news-article',
          title: 'Random News Article',
          organization: 'Unknown Blog',
          publishDate: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Very old
          accessDate: new Date().toISOString().split('T')[0],
          reliability: 0.3, // Low reliability
          relevance: 0.5,
          dataFreshness: {} as FreshnessStatus,
          citationFormat: '',
          keyFindings: [],
          limitations: []
        }
      ];

      const validation = referenceManager.validateSourceCollection(lowQualitySources);
      
      expect(validation.isValid).toBe(false);
      expect(validation.confidence).toBeLessThan(0.5);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.dataGaps.length).toBeGreaterThan(0);
    });

    it('should provide appropriate recommendations for improvement', () => {
      const mediocreSource: SourceReference = {
        id: 'mediocre',
        type: 'industry-report',
        title: 'Basic Industry Report',
        organization: 'Generic Research',
        publishDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        accessDate: new Date().toISOString().split('T')[0],
        reliability: 0.65,
        relevance: 0.70,
        dataFreshness: {} as FreshnessStatus,
        citationFormat: '',
        keyFindings: [],
        limitations: []
      };

      const validation = referenceManager.validateSourceCollection([mediocreSource]);
      
      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.recommendations.some(r => 
        r.toLowerCase().includes('mckinsey') || r.toLowerCase().includes('gartner')
      )).toBe(true);
    });
  });

  describe('Source Attribution Generation', () => {
    it('should generate appropriate sources for competitive analysis', () => {
      const sources = referenceManager.generateSourceAttribution('Technology', 'competitive');
      
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some(s => s.type === 'mckinsey')).toBe(true);
      expect(sources.some(s => s.type === 'gartner')).toBe(true);
      
      sources.forEach(source => {
        expect(source.title).toContain('Technology');
        expect(source.reliability).toBeGreaterThan(0.7);
      });
    });

    it('should generate appropriate sources for market sizing', () => {
      const sources = referenceManager.generateSourceAttribution('Healthcare', 'market-sizing');
      
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some(s => s.type === 'mckinsey')).toBe(true);
      expect(sources.some(s => s.type === 'wef')).toBe(true);
      
      sources.forEach(source => {
        expect(source.title).toContain('Healthcare');
      });
    });

    it('should generate industry-specific source titles', () => {
      const industries = ['Financial Services', 'Healthcare', 'Manufacturing', 'Retail'];
      
      industries.forEach(industry => {
        const sources = referenceManager.generateSourceAttribution(industry, 'business-opportunity');
        
        expect(sources.length).toBeGreaterThan(0);
        expect(sources.some(s => s.title.includes(industry))).toBe(true);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should validate and format sources correctly', () => {
      const testSources: SourceReference[] = [
        referenceManager.createMcKinseyReference('Test Report 1', '2024-01-15'),
        referenceManager.createGartnerReference('Test Report 2', '2024-01-20'),
        {
          id: 'invalid',
          type: 'mckinsey',
          title: '', // Invalid - empty title
          organization: 'McKinsey & Company',
          publishDate: '2024-01-01',
          accessDate: '2024-02-01',
          reliability: 0.95,
          relevance: 0.90,
          dataFreshness: {} as FreshnessStatus,
          citationFormat: '',
          keyFindings: [],
          limitations: []
        }
      ];

      const result = validateAndFormatSources(testSources);
      
      expect(result.validSources.length).toBe(2); // Only valid sources
      expect(result.formattedCitations.length).toBe(2);
      expect(result.validationResult.isValid).toBe(true);
      
      result.formattedCitations.forEach(citation => {
        expect(typeof citation).toBe('string');
        expect(citation.length).toBeGreaterThan(10);
      });
    });

    it('should check source updates correctly', () => {
      const testSources: SourceReference[] = [
        {
          id: 'old-source',
          type: 'mckinsey',
          title: 'Old Report',
          organization: 'McKinsey & Company',
          publishDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          accessDate: new Date().toISOString().split('T')[0],
          reliability: 0.95,
          relevance: 0.90,
          dataFreshness: {} as FreshnessStatus,
          citationFormat: '',
          keyFindings: [],
          limitations: []
        }
      ];

      const updates = checkSourceUpdates(testSources);
      
      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].type).toBe('data-refresh');
      expect(updates[0].priority).toBe('high');
    });
  });

  describe('Factory Function', () => {
    it('should create ReferenceManager instance correctly', () => {
      const manager = createReferenceManager();
      
      expect(manager).toBeInstanceOf(ReferenceManager);
      expect(manager.validateSource('https://mckinsey.com/test')).toBe(true);
      expect(manager.validateSource('https://random-site.com/test')).toBe(false);
    });
  });
});