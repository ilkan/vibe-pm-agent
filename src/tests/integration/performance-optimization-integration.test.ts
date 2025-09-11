// Integration tests for performance optimization and caching system

import { PerformanceOptimizer } from '../../components/performance-optimizer';
import { SourceValidationEngine } from '../../components/source-validation-engine';
import { QualityAssessmentSystem } from '../../components/quality-assessment-system';
import { CitationService } from '../../components/citation-service';
import {
  Citation,
  CitationSourceType,
  CitationConfidence,
  EnhancedCitation,
} from '../../models/citations';

describe('Performance Optimization Integration', () => {
  let performanceOptimizer: PerformanceOptimizer;
  let sourceValidationEngine: SourceValidationEngine;
  let qualityAssessmentSystem: QualityAssessmentSystem;
  let citationService: CitationService;

  beforeEach(() => {
    performanceOptimizer = new PerformanceOptimizer(
      {
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        compressionEnabled: true,
        cleanupInterval: 60000, // 1 minute
      },
      {
        batchSize: 25,
        maxConcurrency: 8,
        retryAttempts: 3,
        timeoutMs: 15000,
      }
    );

    sourceValidationEngine = new SourceValidationEngine({
      timeout: 10000,
      retryAttempts: 3,
      cacheExpiry: 24,
      enableDomainAuthority: true,
    });

    qualityAssessmentSystem = new QualityAssessmentSystem();
    citationService = new CitationService();
  });

  afterEach(() => {
    performanceOptimizer.destroy();
    sourceValidationEngine.destroy();
  });

  describe('End-to-End Citation Enhancement with Caching', () => {
    it('should efficiently enhance multiple documents with citation caching', async () => {
      const documents = [
        'Market analysis shows significant growth in AI adoption across enterprises.',
        'Cloud computing revenue increased by 35% year-over-year according to recent studies.',
        'Digital transformation initiatives are accelerating in the post-pandemic era.',
      ];

      const startTime = Date.now();

      // Process documents with citation enhancement
      const enhancedDocuments = await Promise.all(
        documents.map(async (content, index) => {
          const citations = await citationService.findRelevantCitations({
            keywords: [`market analysis ${index}`, `growth trends ${index}`],
          });

          // Validate citations with caching
          const validationResults = await sourceValidationEngine.validateCitations(citations);

          // Assess quality with caching
          const qualityReport = await qualityAssessmentSystem.assessCitationQuality(citations);

          return {
            content,
            citations,
            validationResults,
            qualityReport,
          };
        })
      );

      const processingTime = Date.now() - startTime;

      // Verify results
      expect(enhancedDocuments).toHaveLength(3);
      enhancedDocuments.forEach(doc => {
        expect(doc.citations).toBeDefined();
        expect(doc.validationResults).toBeDefined();
        expect(doc.qualityReport).toBeDefined();
      });

      // Performance assertions
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Check cache utilization
      const cacheStats = sourceValidationEngine.getCacheStats();
      expect(cacheStats.accessibility.totalEntries).toBeGreaterThan(0);
      expect(cacheStats.credibility.totalEntries).toBeGreaterThan(0);

      console.log(`Enhanced ${documents.length} documents in ${processingTime}ms`);
      console.log('Cache stats:', cacheStats);
    });

    it('should demonstrate cache effectiveness with repeated operations', async () => {
      const testCitations = Array.from({ length: 20 }, (_, i) => createMockCitation(`test-${i}`));

      // First pass - populate caches
      const firstPassStart = Date.now();
      const firstResults = await sourceValidationEngine.validateCitations(testCitations);
      const firstPassTime = Date.now() - firstPassStart;

      // Second pass - should use cached results
      const secondPassStart = Date.now();
      const secondResults = await sourceValidationEngine.validateCitations(testCitations);
      const secondPassTime = Date.now() - secondPassStart;

      // Verify results are consistent
      expect(firstResults).toHaveLength(testCitations.length);
      expect(secondResults).toHaveLength(testCitations.length);

      // Second pass should be significantly faster due to caching
      expect(secondPassTime).toBeLessThan(firstPassTime * 0.5);

      const cacheStats = sourceValidationEngine.getCacheStats();
      expect(cacheStats.accessibility.hitRate).toBeGreaterThan(50);

      console.log(`First pass: ${firstPassTime}ms, Second pass: ${secondPassTime}ms`);
      console.log(`Cache hit rate: ${cacheStats.accessibility.hitRate}%`);
    });

    it('should handle large-scale batch processing efficiently', async () => {
      const largeCitationSet = Array.from({ length: 100 }, (_, i) =>
        createMockCitation(`large-set-${i}`)
      );

      const startTime = Date.now();

      // Process in batches
      const batchProcessor = performanceOptimizer.getBatchProcessor();
      const validationResults = await batchProcessor.processBatch(
        largeCitationSet,
        async citation => {
          const validation = await sourceValidationEngine.validateCitation(citation);
          const quality = await qualityAssessmentSystem.assessCitationQuality([citation]);
          return { citation, validation, quality };
        },
        'large_scale_processing'
      );

      const processingTime = Date.now() - startTime;

      expect(validationResults).toHaveLength(100);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds

      const metrics = batchProcessor.getMetrics();
      const processingMetric = metrics.find(m => m.operationType === 'large_scale_processing');

      expect(processingMetric).toBeDefined();
      expect(processingMetric!.itemsProcessed).toBe(100);
      expect(processingMetric!.throughput).toBeGreaterThan(1); // At least 1 item per second

      console.log(`Processed ${largeCitationSet.length} citations in ${processingTime}ms`);
      console.log(`Throughput: ${processingMetric!.throughput.toFixed(2)} items/second`);
    });

    it('should optimize database queries with intelligent caching', async () => {
      const queryOptimizer = performanceOptimizer.getQueryOptimizer();

      // Simulate multiple similar queries
      const queries = [
        { domains: ['mckinsey.com', 'bcg.com'], sourceTypes: ['consulting_study'] },
        { domains: ['mckinsey.com', 'bcg.com'], sourceTypes: ['consulting_study'] }, // Duplicate
        { domains: ['harvard.edu'], sourceTypes: ['academic_paper'] },
        { domains: ['mckinsey.com', 'bcg.com'], sourceTypes: ['consulting_study'] }, // Another duplicate
      ];

      const startTime = Date.now();

      const results = await Promise.all(
        queries.map(criteria => queryOptimizer.optimizedCitationLookup(criteria))
      );

      const queryTime = Date.now() - startTime;

      expect(results).toHaveLength(4);
      expect(queryTime).toBeLessThan(1000); // Should be fast due to caching

      const cacheStats = queryOptimizer.getCacheStats();
      expect(cacheStats.hits).toBe(2); // Two cache hits from duplicates
      expect(cacheStats.misses).toBe(2); // Two unique queries

      const queryStats = queryOptimizer.getQueryStats();
      expect(queryStats.has('citation_lookup')).toBe(true);

      console.log(`Executed ${queries.length} queries in ${queryTime}ms`);
      console.log(`Cache hit rate: ${cacheStats.hitRate}%`);
    });

    it('should maintain performance under memory pressure', async () => {
      // Create a cache with limited size to test eviction
      const limitedOptimizer = new PerformanceOptimizer(
        { maxSize: 50, ttl: 300000 }, // Small cache size
        { batchSize: 10, maxConcurrency: 3 }
      );

      const validationCache = limitedOptimizer.getValidationCache();

      // Fill cache beyond capacity
      const citations = Array.from({ length: 100 }, (_, i) => createMockCitation(`pressure-${i}`));

      for (const citation of citations) {
        const mockValidation = {
          citation,
          accessibilityStatus: {
            isAccessible: true,
            accessType: 'free' as const,
            lastChecked: new Date(),
            alternativeAccess: [],
            cacheAvailable: true,
          },
          credibilityAssessment: {
            overallScore: 80,
            factors: {
              domainAuthority: 75,
              authorCredentials: 85,
              peerReviewStatus: 80,
              citationFrequency: 70,
              methodologyTransparency: 85,
            },
            riskFactors: [],
            confidenceLevel: 'high' as const,
            assessmentDate: new Date(),
          },
          complianceStatus: {
            isCompliant: true,
            checkedStandards: ['academic'],
            violations: [],
            recommendations: [],
            lastChecked: new Date(),
          },
          alternativeSources: [],
          validationTimestamp: new Date(),
        };

        validationCache.set(`validation-${citation.id}`, mockValidation);
      }

      const stats = validationCache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(50); // Should respect max size

      // Recent items should still be accessible
      expect(validationCache.get('validation-pressure-99')).toBeTruthy();
      expect(validationCache.get('validation-pressure-95')).toBeTruthy();

      // Very old items should be evicted
      expect(validationCache.get('validation-pressure-0')).toBeNull();
      expect(validationCache.get('validation-pressure-10')).toBeNull();

      limitedOptimizer.destroy();
    });

    it('should provide comprehensive performance monitoring', async () => {
      const citations = Array.from({ length: 30 }, (_, i) => createMockCitation(`monitor-${i}`));

      // Perform various operations to generate metrics
      await sourceValidationEngine.validateCitations(citations.slice(0, 10));
      await sourceValidationEngine.validateMultipleAccessibility(
        citations.slice(10, 20).map(c => c.url)
      );
      await sourceValidationEngine.assessMultipleCredibility(citations.slice(20, 30));

      // Get comprehensive performance statistics
      const performanceStats = performanceOptimizer.getPerformanceStats();
      const validationMetrics = sourceValidationEngine.getPerformanceMetrics();

      // Verify comprehensive monitoring data
      expect(performanceStats.validation).toBeDefined();
      expect(performanceStats.quality).toBeDefined();
      expect(performanceStats.citation).toBeDefined();
      expect(performanceStats.batch).toBeDefined();
      expect(performanceStats.query).toBeDefined();

      expect(validationMetrics.length).toBeGreaterThan(0);

      // Check that metrics contain useful information
      validationMetrics.forEach(metric => {
        expect(metric.operationType).toBeDefined();
        expect(metric.duration).toBeGreaterThan(0);
        expect(metric.itemsProcessed).toBeGreaterThan(0);
        expect(metric.throughput).toBeGreaterThan(0);
      });

      console.log('Performance Statistics:');
      console.log('- Validation cache:', performanceStats.validation);
      console.log('- Quality cache:', performanceStats.quality);
      console.log('- Citation cache:', performanceStats.citation);
      console.log('- Batch metrics:', performanceStats.batch.length, 'operations');
      console.log('- Query stats:', performanceStats.query.size, 'query types');
    });

    it('should handle concurrent operations without performance degradation', async () => {
      const concurrentOperations = 20;
      const citationsPerOperation = 10;

      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        const citations = Array.from({ length: citationsPerOperation }, (_, j) =>
          createMockCitation(`concurrent-${i}-${j}`)
        );

        const startTime = Date.now();
        const results = await sourceValidationEngine.validateCitations(citations);
        const duration = Date.now() - startTime;

        return { results, duration, operationId: i };
      });

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      // Verify all operations completed successfully
      expect(results).toHaveLength(concurrentOperations);
      results.forEach(result => {
        expect(result.results).toHaveLength(citationsPerOperation);
        expect(result.duration).toBeGreaterThan(0);
      });

      // Check that concurrent execution was efficient
      const averageOperationTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const sequentialEstimate = averageOperationTime * concurrentOperations;

      // Concurrent execution should be significantly faster than sequential
      expect(totalTime).toBeLessThan(sequentialEstimate * 0.7);

      console.log(`Concurrent execution: ${totalTime}ms`);
      console.log(`Sequential estimate: ${sequentialEstimate}ms`);
      console.log(
        `Efficiency gain: ${(((sequentialEstimate - totalTime) / sequentialEstimate) * 100).toFixed(1)}%`
      );
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain sub-second response times for single citation validation', async () => {
      const citation = createMockCitation('performance-test');

      const startTime = Date.now();
      const result = await sourceValidationEngine.validateCitation(citation);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle 100 citations within 10 seconds', async () => {
      const citations = Array.from({ length: 100 }, (_, i) =>
        createMockCitation(`batch-performance-${i}`)
      );

      const startTime = Date.now();
      const results = await sourceValidationEngine.validateCitations(citations);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      const throughput = citations.length / (duration / 1000);
      expect(throughput).toBeGreaterThan(5); // At least 5 citations per second
    });

    it('should maintain cache hit rates above 80% for repeated operations', async () => {
      const citations = Array.from({ length: 20 }, (_, i) => createMockCitation(`cache-test-${i}`));

      // First pass to populate cache
      await sourceValidationEngine.validateCitations(citations);

      // Second pass to test cache effectiveness
      await sourceValidationEngine.validateCitations(citations);

      // Third pass with some new citations
      const mixedCitations = [
        ...citations.slice(0, 15), // 15 cached citations
        ...Array.from({ length: 5 }, (_, i) => createMockCitation(`new-${i}`)), // 5 new citations
      ];

      await sourceValidationEngine.validateCitations(mixedCitations);

      const cacheStats = sourceValidationEngine.getCacheStats();
      expect(cacheStats.accessibility.hitRate).toBeGreaterThan(80);
    });
  });

  // Helper function to create mock citations
  function createMockCitation(id: string): Citation {
    return {
      id,
      title: `Test Citation ${id}`,
      url: `https://example.com/${id}`,
      domain: 'example.com',
      published_at: new Date().toISOString(),
      source_type: CitationSourceType.ACADEMIC_PAPER,
      confidence: CitationConfidence.HIGH,
      key_finding: `Key finding for ${id}`,
      authors: [`Author ${id}`],
      organization: 'Test Organization',
      methodology: 'Test methodology',
      sample_size: Math.floor(Math.random() * 1000) + 100,
      geographic_scope: 'Global',
      industry_focus: ['Technology', 'Business'],
    };
  }
});
