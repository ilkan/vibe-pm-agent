/**
 * Comprehensive unit tests for Citation Service
 * Tests citation management, confidence scoring, and source validation
 */

import { CitationService } from '../../components/citation-service';
import { Citation, CitationStyle, CitationConfidence, CitationPackage } from '../../models/citations';

describe('CitationService - Comprehensive Tests', () => {
  let citationService: CitationService;

  beforeEach(() => {
    citationService = new CitationService();
  });

  describe('Citation Creation and Management', () => {
    it('should create citations with proper metadata', () => {
      const citation = citationService.createCitation({
        title: 'Market Research Report 2024',
        url: 'https://example.com/report',
        publisher: 'Research Corp',
        publicationDate: '2024-01-15',
        credibilityRating: 'A',
        sourceType: 'industry_report'
      });

      expect(citation.id).toBeDefined();
      expect(citation.title).toBe('Market Research Report 2024');
      expect(citation.credibilityRating).toBe('A');
      expect(citation.confidence).toBe('high');
      expect(citation.accessDate).toBeDefined();
    });

    it('should assign confidence levels based on credibility rating', () => {
      const highCredCitation = citationService.createCitation({
        title: 'Gartner Report',
        url: 'https://gartner.com/report',
        publisher: 'Gartner',
        credibilityRating: 'A'
      });

      const mediumCredCitation = citationService.createCitation({
        title: 'Industry Blog',
        url: 'https://blog.com/post',
        publisher: 'Tech Blog',
        credibilityRating: 'B'
      });

      const lowCredCitation = citationService.createCitation({
        title: 'Forum Post',
        url: 'https://forum.com/post',
        publisher: 'User Forum',
        credibilityRating: 'C'
      });

      expect(highCredCitation.confidence).toBe('high');
      expect(mediumCredCitation.confidence).toBe('medium');
      expect(lowCredCitation.confidence).toBe('low');
    });

    it('should validate citation URLs', () => {
      expect(() => {
        citationService.createCitation({
          title: 'Invalid URL Test',
          url: 'not-a-url',
          publisher: 'Test Publisher'
        });
      }).toThrow('Invalid URL format');
    });

    it('should handle missing publication dates gracefully', () => {
      const citation = citationService.createCitation({
        title: 'Undated Report',
        url: 'https://example.com/undated',
        publisher: 'Unknown Date Corp'
      });

      expect(citation.publicationDate).toBeNull();
      expect(citation.recencyScore).toBe(0);
    });
  });

  describe('Citation Formatting', () => {
    let testCitation: Citation;

    beforeEach(() => {
      testCitation = citationService.createCitation({
        title: 'AI Market Analysis 2024',
        url: 'https://research.com/ai-market-2024',
        publisher: 'Market Research Inc',
        publicationDate: '2024-01-15',
        credibilityRating: 'A',
        sourceType: 'industry_report',
        authors: ['Dr. Jane Smith', 'Prof. John Doe']
      });
    });

    it('should format citations in APA style', () => {
      const formatted = citationService.formatCitation(testCitation, 'apa');
      
      expect(formatted).toContain('Smith, J., & Doe, J.');
      expect(formatted).toContain('(2024)');
      expect(formatted).toContain('AI Market Analysis 2024');
      expect(formatted).toContain('Market Research Inc');
      expect(formatted).toContain('https://research.com/ai-market-2024');
    });

    it('should format citations in inline style', () => {
      const formatted = citationService.formatCitation(testCitation, 'inline');
      
      expect(formatted).toMatch(/\[.*\]/); // Should be in brackets
      expect(formatted).toContain('AI Market Analysis 2024');
      expect(formatted).toContain('2024');
    });

    it('should format citations in footnote style', () => {
      const formatted = citationService.formatCitation(testCitation, 'footnote');
      
      expect(formatted).toMatch(/^\d+\./); // Should start with number and period
      expect(formatted).toContain('AI Market Analysis 2024');
      expect(formatted).toContain('Market Research Inc');
    });

    it('should handle citations without authors', () => {
      const noAuthorCitation = citationService.createCitation({
        title: 'Anonymous Report',
        url: 'https://example.com/anon',
        publisher: 'Anonymous Corp',
        publicationDate: '2024-01-01'
      });

      const formatted = citationService.formatCitation(noAuthorCitation, 'apa');
      expect(formatted).toContain('Anonymous Corp');
      expect(formatted).not.toContain('undefined');
    });
  });

  describe('Citation Package Management', () => {
    it('should create citation packages with proper categorization', () => {
      const citations = [
        citationService.createCitation({
          title: 'Gartner Magic Quadrant',
          url: 'https://gartner.com/mq',
          publisher: 'Gartner',
          sourceType: 'industry_report',
          credibilityRating: 'A'
        }),
        citationService.createCitation({
          title: 'Company SEC Filing',
          url: 'https://sec.gov/filing',
          publisher: 'SEC',
          sourceType: 'financial_data',
          credibilityRating: 'A'
        }),
        citationService.createCitation({
          title: 'Customer Survey Results',
          url: 'https://survey.com/results',
          publisher: 'Survey Corp',
          sourceType: 'customer_research',
          credibilityRating: 'B'
        })
      ];

      const citationPackage = citationService.createCitationPackage(citations);

      expect(citationPackage.primarySources).toHaveLength(2); // A-rated sources
      expect(citationPackage.supportingSources).toHaveLength(1); // B-rated source
      expect(citationPackage.sourcesByCategory.industryReports).toHaveLength(1);
      expect(citationPackage.sourcesByCategory.financialData).toHaveLength(1);
      expect(citationPackage.sourcesByCategory.customerResearch).toHaveLength(1);
    });

    it('should calculate overall confidence score for citation package', () => {
      const highQualityCitations = [
        citationService.createCitation({
          title: 'McKinsey Report',
          publisher: 'McKinsey',
          credibilityRating: 'A',
          publicationDate: '2024-01-01'
        }),
        citationService.createCitation({
          title: 'Forrester Analysis',
          publisher: 'Forrester',
          credibilityRating: 'A',
          publicationDate: '2024-02-01'
        })
      ];

      const mixedQualityCitations = [
        ...highQualityCitations,
        citationService.createCitation({
          title: 'Blog Post',
          publisher: 'Random Blog',
          credibilityRating: 'C',
          publicationDate: '2023-01-01'
        })
      ];

      const highQualityPackage = citationService.createCitationPackage(highQualityCitations);
      const mixedQualityPackage = citationService.createCitationPackage(mixedQualityCitations);

      expect(highQualityPackage.overallConfidence).toBeGreaterThan(mixedQualityPackage.overallConfidence);
      expect(highQualityPackage.overallConfidence).toBeGreaterThan(80);
    });

    it('should identify evidence gaps in citation package', () => {
      const limitedCitations = [
        citationService.createCitation({
          title: 'Single Industry Report',
          publisher: 'Research Corp',
          sourceType: 'industry_report',
          credibilityRating: 'B'
        })
      ];

      const citationPackage = citationService.createCitationPackage(limitedCitations);

      expect(citationPackage.evidenceGaps).toContain('financial_data');
      expect(citationPackage.evidenceGaps).toContain('customer_research');
      expect(citationPackage.evidenceGaps).toContain('competitive_intelligence');
    });
  });

  describe('Source Validation', () => {
    it('should validate source credibility based on publisher', () => {
      const tierAPublishers = ['Gartner', 'Forrester', 'McKinsey', 'BCG', 'Bain'];
      const tierBPublishers = ['TechCrunch', 'VentureBeat', 'Harvard Business Review'];
      const tierCPublishers = ['Random Blog', 'Unknown Source'];

      tierAPublishers.forEach(publisher => {
        const rating = citationService.validateSourceCredibility(publisher, 'industry_report');
        expect(rating).toBe('A');
      });

      tierBPublishers.forEach(publisher => {
        const rating = citationService.validateSourceCredibility(publisher, 'news_article');
        expect(rating).toBe('B');
      });

      tierCPublishers.forEach(publisher => {
        const rating = citationService.validateSourceCredibility(publisher, 'blog_post');
        expect(rating).toBe('C');
      });
    });

    it('should calculate recency scores based on publication date', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 1); // 1 month ago

      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago

      const recentScore = citationService.calculateRecencyScore(recentDate.toISOString());
      const oldScore = citationService.calculateRecencyScore(oldDate.toISOString());

      expect(recentScore).toBeGreaterThan(oldScore);
      expect(recentScore).toBeGreaterThan(80);
      expect(oldScore).toBeLessThan(50);
    });

    it('should validate URL accessibility', async () => {
      // Mock successful URL validation
      const validUrl = 'https://example.com/valid';
      const invalidUrl = 'https://nonexistent-domain-12345.com/invalid';

      const validResult = await citationService.validateUrlAccessibility(validUrl);
      expect(validResult.accessible).toBe(true);

      // Note: In real implementation, this would make HTTP requests
      // For testing, we mock the behavior
    });
  });

  describe('Citation Search and Retrieval', () => {
    beforeEach(() => {
      // Add test citations to the service
      citationService.addCitation(citationService.createCitation({
        title: 'AI Market Report 2024',
        publisher: 'Gartner',
        sourceType: 'industry_report',
        tags: ['AI', 'market', 'technology']
      }));

      citationService.addCitation(citationService.createCitation({
        title: 'Customer Satisfaction Survey',
        publisher: 'Survey Corp',
        sourceType: 'customer_research',
        tags: ['customer', 'satisfaction', 'survey']
      }));
    });

    it('should search citations by title', () => {
      const results = citationService.searchCitations('AI Market');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('AI Market Report');
    });

    it('should search citations by tags', () => {
      const results = citationService.searchCitationsByTag('customer');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Customer Satisfaction');
    });

    it('should filter citations by source type', () => {
      const industryReports = citationService.getCitationsBySourceType('industry_report');
      const customerResearch = citationService.getCitationsBySourceType('customer_research');

      expect(industryReports).toHaveLength(1);
      expect(customerResearch).toHaveLength(1);
      expect(industryReports[0].sourceType).toBe('industry_report');
      expect(customerResearch[0].sourceType).toBe('customer_research');
    });

    it('should get citations by credibility rating', () => {
      const aTierCitations = citationService.getCitationsByCredibility('A');
      expect(aTierCitations.length).toBeGreaterThanOrEqual(1);
      expect(aTierCitations.every(c => c.credibilityRating === 'A')).toBe(true);
    });
  });

  describe('Citation Export and Import', () => {
    it('should export citations to JSON format', () => {
      const citation = citationService.createCitation({
        title: 'Test Export',
        publisher: 'Test Publisher',
        url: 'https://test.com'
      });

      citationService.addCitation(citation);
      const exported = citationService.exportCitations('json');

      expect(exported).toContain('"title":"Test Export"');
      expect(exported).toContain('"publisher":"Test Publisher"');
    });

    it('should export citations to BibTeX format', () => {
      const citation = citationService.createCitation({
        title: 'Test BibTeX Export',
        publisher: 'Academic Publisher',
        url: 'https://academic.com',
        authors: ['Dr. Test Author']
      });

      citationService.addCitation(citation);
      const exported = citationService.exportCitations('bibtex');

      expect(exported).toContain('@article{');
      expect(exported).toContain('title={Test BibTeX Export}');
      expect(exported).toContain('author={Dr. Test Author}');
    });

    it('should import citations from JSON format', () => {
      const jsonData = JSON.stringify([{
        title: 'Imported Citation',
        publisher: 'Import Publisher',
        url: 'https://import.com',
        credibilityRating: 'B'
      }]);

      const importedCount = citationService.importCitations(jsonData, 'json');
      expect(importedCount).toBe(1);

      const imported = citationService.searchCitations('Imported Citation');
      expect(imported).toHaveLength(1);
      expect(imported[0].title).toBe('Imported Citation');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed URLs gracefully', () => {
      expect(() => {
        citationService.createCitation({
          title: 'Bad URL Test',
          url: 'htp://malformed-url',
          publisher: 'Test'
        });
      }).toThrow();
    });

    it('should handle empty citation data', () => {
      expect(() => {
        citationService.createCitation({
          title: '',
          publisher: '',
          url: ''
        });
      }).toThrow('Title and publisher are required');
    });

    it('should handle duplicate citations', () => {
      const citation1 = citationService.createCitation({
        title: 'Duplicate Test',
        publisher: 'Test Publisher',
        url: 'https://test.com/duplicate'
      });

      const citation2 = citationService.createCitation({
        title: 'Duplicate Test',
        publisher: 'Test Publisher',
        url: 'https://test.com/duplicate'
      });

      citationService.addCitation(citation1);
      citationService.addCitation(citation2);

      const results = citationService.searchCitations('Duplicate Test');
      expect(results).toHaveLength(1); // Should deduplicate
    });

    it('should handle very old publication dates', () => {
      const oldCitation = citationService.createCitation({
        title: 'Very Old Report',
        publisher: 'Historical Publisher',
        url: 'https://old.com',
        publicationDate: '1990-01-01'
      });

      expect(oldCitation.recencyScore).toBeLessThan(10);
      expect(oldCitation.confidence).toBe('low');
    });

    it('should handle missing metadata gracefully', () => {
      const minimalCitation = citationService.createCitation({
        title: 'Minimal Citation',
        publisher: 'Basic Publisher'
      });

      expect(minimalCitation.url).toBeNull();
      expect(minimalCitation.publicationDate).toBeNull();
      expect(minimalCitation.authors).toEqual([]);
      expect(minimalCitation.credibilityRating).toBe('C'); // Default to lowest
    });
  });
});