// Performance tests for citation system optimization and caching

import {
  IntelligentCache,
  AsyncBatchProcessor,
  DatabaseQueryOptimizer,
  PerformanceOptimizer,
  CacheStats,
  PerformanceMetrics,
} from '../../components/performance-optimizer';
import { SourceValidationEngine } from '../../components/source-validation-engine';
import { QualityAssessmentSystem } from '../../components/quality-assessment-system';
import {
  Citation,
  CitationSourceType,
  CitationConfidence,
} from '../../models/citations';
import { ValidationResult } from '../../components/source-validation-engine';

describe('Citation Performance Optimization', () => {
  let performanceOptimizer: PerformanceOptimizer;
  let sourceValidationEngine: SourceValidationEngine;
  let qualityAssessmentSystem: QualityAssessmentSystem;

  beforeEach(() => {
    performanceOptimizer = new PerformanceOptimizer(
      { maxSize: 1000, ttl: 60000 }, // 1 minute TTL for tests
      { batchSize: 10, maxConcurrency: 3 }
    );
    sourceValidationEngine = new SourceValidationEngine();
    qualityAssessmentSystem = new QualityAssessmentSystem();
  });

  afterEach(() => {
    performanceOptimizer.destroy();
    sourceValidationEngine.destroy();
  });

  describe('IntelligentCache', () => {
    let cache: IntelligentCache<string>;

    beforeEach(() => {
      cache = new IntelligentCache<string>({
        maxSize: 100,
        ttl: 1000, // 1 second for quick expiry tests
        cleanupInterval: 500,
      });
    });

    afterEach(() => {
      cache.destroy();
    });

    it('should cache and retrieve values correctly', () => {
      const key = 'test-key';
      const value = 'test-value';

      // Initially should not exist
      expect(cache.get(key)).toBeNull();
      expect(cache.has(key)).toBe(false);

      // Set and retrieve
      cache.set(key, value);
      expect(cache.get(key)).toBe(value);
      expect(cache.has(key)).toBe(true);
    });

    it('should track cache statistics', () => {
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);

      // Generate some cache activity
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.get('key1'); // Hit
      cache.get('key3'); // Miss
      cache.get('key1'); // Hit

      const updatedStats = cache.getStats();
      expect(updatedStats.hits).toBe(2);
      expect(updatedStats.misses).toBe(1);
      expect(updatedStats.hitRate).toBeCloseTo(66.67, 1);
      expect(updatedStats.totalEntries).toBe(2);
    });

    it('should handle cache expiry', async () => {
      const key = 'expiry-test';
      const value = 'expiry-value';

      cache.set(key, value);
      expect(cache.get(key)).toBe(value);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cache.get(key)).toBeNull();
      expect(cache.has(key)).toBe(false);
    });

    it('should evict least recently used items when at capacity', () => {
      const smallCache = new IntelligentCache<string>({ maxSize: 3 });

      // Fill cache to capacity
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      // Access key1 to make it recently used
      smallCache.get('key1');

      // Add another item, should evict key2 (least recently used)
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBe('value1'); // Should still exist
      expect(smallCache.get('key2')).toBeNull(); // Should be evicted
      expect(smallCache.get('key3')).toBe('value3'); // Should still exist
      expect(smallCache.get('key4')).toBe('value4'); // Should exist

      smallCache.destroy();
    });

    it('should support bulk operations', () => {
      const entries = new Map([
        ['bulk1', 'value1'],
        ['bulk2', 'value2'],
        ['bulk3', 'value3'],
      ]);

      cache.setBulk(entries);

      const results = cache.getBulk(['bulk1', 'bulk2', 'bulk4']);
      expect(results.size).toBe(2);
      expect(results.get('bulk1')).toBe('value1');
      expect(results.get('bulk2')).toBe('value2');
      expect(results.has('bulk4')).toBe(false);
    });

    it('should find keys matching patterns', () => {
      cache.set('user:123', 'user123');
      cache.set('user:456', 'user456');
      cache.set('post:789', 'post789');

      const userKeys = cache.getKeysMatching(/^user:/);
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:123');
      expect(userKeys).toContain('user:456');

      const postKeys = cache.getKeysMatching(/^post:/);
      expect(postKeys).toHaveLength(1);
      expect(postKeys).toContain('post:789');
    });
  });

  describe('AsyncBatchProcessor', () => {
    let batchProcessor: AsyncBatchProcessor;

    beforeEach(() => {
      batchProcessor = new AsyncBatchProcessor({
        batchSize: 5,
        maxConcurrency: 2,
        retryAttempts: 2,
        retryDelay: 100,
        timeoutMs: 1000,
      });
    });

    it('should process items in batches', async () => {
      const items = Array.from({ length: 23 }, (_, i) => i);
      const processor = jest.fn().mockImplementation(async (item: number) => item * 2);

      const results = await batchProcessor.processBatch(items, processor, 'test_operation');

      expect(results).toHaveLength(23);
      expect(results).toEqual(items.map(i => i * 2));
      expect(processor).toHaveBeenCalledTimes(23);
    });

    it('should respect concurrency limits', async () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const processor = jest.fn().mockImplementation(async (item: number) => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        concurrentCount--;
        return item * 2;
      });

      await batchProcessor.processBatch(items, processor, 'concurrency_test');

      expect(maxConcurrent).toBeLessThanOrEqual(2); // maxConcurrency is 2
    });

    it('should handle processing errors with retries', async () => {
      const items = [1, 2, 3];
      let attemptCount = 0;

      const processor = jest.fn().mockImplementation(async (item: number) => {
        attemptCount++;
        if (item === 2 && attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return item * 2;
      });

      const results = await batchProcessor.processBatch(items, processor, 'retry_test');

      expect(results).toEqual([2, 4, 6]);
      expect(attemptCount).toBeGreaterThan(3); // Should have retried for item 2
    });

    it('should track performance metrics', async () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      const processor = jest.fn().mockImplementation(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return item * 2;
      });

      await batchProcessor.processBatch(items, processor, 'metrics_test');

      const metrics = batchProcessor.getMetrics();
      expect(metrics).toHaveLength(1);

      const metric = metrics[0];
      expect(metric.operationType).toBe('metrics_test');
      expect(metric.itemsProcessed).toBe(10);
      expect(metric.duration).toBeGreaterThan(0);
      expect(metric.throughput).toBeGreaterThan(0);
      expect(metric.errors).toBe(0);
    });

    it('should calculate average metrics correctly', async () => {
      const processor = jest.fn().mockImplementation(async (item: number) => item * 2);

      // Process multiple batches
      await batchProcessor.processBatch([1, 2], processor, 'avg_test_1');
      await batchProcessor.processBatch([3, 4, 5], processor, 'avg_test_2');

      const avgMetrics = batchProcessor.getAverageMetrics();
      expect(avgMetrics.itemsProcessed).toBe(2.5); // (2 + 3) / 2
      expect(avgMetrics.duration).toBeGreaterThan(0);
      expect(avgMetrics.throughput).toBeGreaterThan(0);
    });
  });

  describe('DatabaseQueryOptimizer', () => {
    let queryOptimizer: DatabaseQueryOptimizer;

    beforeEach(() => {
      queryOptimizer = new DatabaseQueryOptimizer({
        maxSize: 100,
        ttl: 60000,
      });
    });

    it('should cache query results', async () => {
      const criteria = {
        domains: ['example.com'],
        sourceTypes: ['academic_paper'],
      };

      // First call should execute query
      const results1 = await queryOptimizer.optimizedCitationLookup(criteria);
      
      // Second call should use cache
      const results2 = await queryOptimizer.optimizedCitationLookup(criteria);

      expect(results1).toEqual(results2);

      const cacheStats = queryOptimizer.getCacheStats();
      expect(cacheStats.hits).toBe(1);
      expect(cacheStats.misses).toBe(1);
    });

    it('should track query performance statistics', async () => {
      const criteria = { domains: ['test.com'] };
      
      await queryOptimizer.optimizedCitationLookup(criteria);
      await queryOptimizer.optimizedCitationLookup(criteria); // Cache hit

      const queryStats = queryOptimizer.getQueryStats();
      const citationLookupStats = queryStats.get('citation_lookup');

      expect(citationLookupStats).toBeDefined();
      expect(citationLookupStats!.count).toBe(1); // Only one actual query executed
      expect(citationLookupStats!.avgDuration).toBeGreaterThan(0);
    });

    it('should handle batch queries efficiently', async () => {
      const citationIds = ['id1', 'id2', 'id3'];
      
      const results = await queryOptimizer.optimizedQualityLookup(citationIds);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);

      const queryStats = queryOptimizer.getQueryStats();
      expect(queryStats.has('quality_assessment')).toBe(true);
    });
  });

  describe('PerformanceOptimizer Integration', () => {
    it('should provide comprehensive caching for all citation operations', () => {
      const validationCache = performanceOptimizer.getValidationCache();
      const qualityCache = performanceOptimizer.getQualityCache();
      const citationCache = performanceOptimizer.getCitationCache();

      expect(validationCache).toBeInstanceOf(IntelligentCache);
      expect(qualityCache).toBeInstanceOf(IntelligentCache);
      expect(citationCache).toBeInstanceOf(IntelligentCache);
    });

    it('should provide batch processing capabilities', () => {
      const batchProcessor = performanceOptimizer.getBatchProcessor();
      expect(batchProcessor).toBeInstanceOf(AsyncBatchProcessor);
    });

    it('should provide query optimization', () => {
      const queryOptimizer = performanceOptimizer.getQueryOptimizer();
      expect(queryOptimizer).toBeInstanceOf(DatabaseQueryOptimizer);
    });

    it('should collect comprehensive performance statistics', async () => {
      // Generate some cache activity
      const validationCache = performanceOptimizer.getValidationCache();
      const mockValidationResult: ValidationResult = {
        citation: createMockCitation(),
        accessibilityStatus: {
          isAccessible: true,
          accessType: 'free',
          lastChecked: new Date(),
          alternativeAccess: [],
          cacheAvailable: true,
        },
        credibilityAssessment: {
          overallScore: 85,
          factors: {
            domainAuthority: 80,
            authorCredentials: 90,
            peerReviewStatus: 85,
            citationFrequency: 75,
            methodologyTransparency: 80,
          },
          riskFactors: [],
          confidenceLevel: 'high',
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

      validationCache.set('test-validation', mockValidationResult);
      validationCache.get('test-validation');
      validationCache.get('non-existent'); // Miss

      const stats = performanceOptimizer.getPerformanceStats();

      expect(stats.validation.hits).toBe(1);
      expect(stats.validation.misses).toBe(1);
      expect(stats.validation.totalEntries).toBe(1);
      expect(stats.quality).toBeDefined();
      expect(stats.citation).toBeDefined();
      expect(stats.batch).toBeDefined();
      expect(stats.query).toBeDefined();
    });

    it('should clear all caches when requested', () => {
      const validationCache = performanceOptimizer.getValidationCache();
      const qualityCache = performanceOptimizer.getQualityCache();

      // Add some data
      validationCache.set('test1', {} as any);
      qualityCache.set('test2', {} as any);

      expect(validationCache.getStats().totalEntries).toBe(1);
      expect(qualityCache.getStats().totalEntries).toBe(1);

      // Clear all caches
      performanceOptimizer.clearAllCaches();

      expect(validationCache.getStats().totalEntries).toBe(0);
      expect(qualityCache.getStats().totalEntries).toBe(0);
    });
  });

  describe('Source Validation Engine Performance', () => {
    it('should use caching for repeated accessibility checks', async () => {
      const url = 'https://example.com/test';

      // First call should execute validation
      const result1 = await sourceValidationEngine.validateSourceAccessibility(url);
      
      // Second call should use cache
      const result2 = await sourceValidationEngine.validateSourceAccessibility(url);

      expect(result1).toEqual(result2);

      const cacheStats = sourceValidationEngine.getCacheStats();
      expect(cacheStats.accessibility.hits).toBe(1);
      expect(cacheStats.accessibility.misses).toBe(1);
    });

    it('should process multiple citations in batches', async () => {
      const citations = Array.from({ length: 15 }, (_, i) => createMockCitation(`citation-${i}`));

      const startTime = Date.now();
      const results = await sourceValidationEngine.validateCitations(citations);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(15);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      const metrics = sourceValidationEngine.getPerformanceMetrics();
      expect(metrics.length).toBeGreaterThan(0);

      const validationMetric = metrics.find(m => m.operationType === 'citation_validation');
      expect(validationMetric).toBeDefined();
      expect(validationMetric!.itemsProcessed).toBe(15);
    });

    it('should handle batch accessibility validation', async () => {
      const urls = Array.from({ length: 10 }, (_, i) => `https://example${i}.com`);

      const results = await sourceValidationEngine.validateMultipleAccessibility(urls);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('isAccessible');
        expect(result).toHaveProperty('accessType');
        expect(result).toHaveProperty('lastChecked');
      });
    });

    it('should handle batch credibility assessment', async () => {
      const sources = Array.from({ length: 8 }, (_, i) => createMockCitation(`source-${i}`));

      const results = await sourceValidationEngine.assessMultipleCredibility(sources);

      expect(results).toHaveLength(8);
      results.forEach(result => {
        expect(result).toHaveProperty('overallScore');
        expect(result).toHaveProperty('factors');
        expect(result).toHaveProperty('confidenceLevel');
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance targets for cache operations', () => {
      const cache = new IntelligentCache<string>({ maxSize: 10000 });
      const iterations = 1000;

      // Benchmark cache writes
      const writeStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }
      const writeTime = Date.now() - writeStart;

      // Benchmark cache reads
      const readStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        cache.get(`key-${i}`);
      }
      const readTime = Date.now() - readStart;

      // Performance targets
      expect(writeTime).toBeLessThan(100); // Should write 1000 items in < 100ms
      expect(readTime).toBeLessThan(50);   // Should read 1000 items in < 50ms

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(100); // All reads should be hits

      cache.destroy();
    });

    it('should maintain good performance under memory pressure', () => {
      const cache = new IntelligentCache<string>({ maxSize: 100 });
      const iterations = 1000;

      // Fill cache beyond capacity
      for (let i = 0; i < iterations; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const stats = cache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(100);

      // Recent items should still be accessible
      expect(cache.get('key-999')).toBe('value-999');
      expect(cache.get('key-950')).toBe('value-950');

      // Very old items should be evicted
      expect(cache.get('key-0')).toBeNull();
      expect(cache.get('key-50')).toBeNull();

      cache.destroy();
    });

    it('should handle concurrent access efficiently', async () => {
      const cache = new IntelligentCache<string>({ maxSize: 1000 });
      const concurrentOperations = 100;

      // Create concurrent read/write operations
      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        cache.set(`concurrent-${i}`, `value-${i}`);
        return cache.get(`concurrent-${i}`);
      });

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(concurrentOperations);
      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(results.every(result => result !== null)).toBe(true);

      cache.destroy();
    });
  });

  // Helper function to create mock citations
  function createMockCitation(id: string = 'test-citation'): Citation {
    return {
      id,
      title: `Test Citation ${id}`,
      url: `https://example.com/${id}`,
      domain: 'example.com',
      published_at: '2023-01-01',
      source_type: CitationSourceType.ACADEMIC_PAPER,
      confidence: CitationConfidence.HIGH,
      key_finding: 'Test finding',
      authors: ['Test Author'],
      organization: 'Test Organization',
      methodology: 'Test methodology',
      sample_size: 1000,
      geographic_scope: 'Global',
      industry_focus: ['Technology'],
    };
  }
});