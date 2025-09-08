// Performance Optimization and Caching System for Enhanced Citation System

import { Citation, EnhancedCitation } from '../../models/citations';

// Forward declarations to avoid circular imports
interface ValidationResult {
  citation: Citation;
  accessibilityStatus: any;
  credibilityAssessment: any;
  complianceStatus: any;
  alternativeSources: Citation[];
  validationTimestamp: Date;
}

interface QualityReport {
  overallScore: number;
  metrics: any;
  qualityGaps: any[];
  recommendations: any[];
  complianceStatus: string;
  assessmentDate: Date;
  citationCount: number;
  strengthAreas: string[];
  improvementAreas: string[];
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  maxSize: number; // Maximum number of entries
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionEnabled: boolean;
  persistToDisk: boolean;
  diskCachePath?: string;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
  compressed?: boolean;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
  averageAccessCount: number;
}

/**
 * Batch processing configuration
 */
export interface BatchConfig {
  batchSize: number;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
  timeoutMs: number;
}

/**
 * Performance metrics tracking
 */
export interface PerformanceMetrics {
  operationType: string;
  startTime: number;
  endTime: number;
  duration: number;
  itemsProcessed: number;
  throughput: number; // items per second
  memoryUsage: number;
  cacheHitRate: number;
  errors: number;
}

/**
 * Intelligent caching system for source validation results
 */
export class IntelligentCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 10000,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      compressionEnabled: true,
      persistToDisk: false,
      ...config,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: 0,
      newestEntry: 0,
      averageAccessCount: 0,
    };

    this.startCleanupTimer();
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T): void {
    // Check if we need to evict entries (evict multiple if needed)
    while (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const size = this.estimateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      compressed: false,
    };

    // Compress large entries if enabled
    if (this.config.compressionEnabled && size > 1024) {
      entry.compressed = true;
      // In real implementation, would compress the data
    }

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Check if cache has key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.updateStats();
    }
    return result;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache keys matching pattern
   */
  getKeysMatching(pattern: RegExp): string[] {
    return Array.from(this.cache.keys()).filter(key => pattern.test(key));
  }

  /**
   * Bulk get operation
   */
  getBulk(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        results.set(key, value);
      }
    }
    
    return results;
  }

  /**
   * Bulk set operation
   */
  setBulk(entries: Map<string, T>): void {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  // Private methods

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.updateStats();
    }
  }

  private estimateSize(data: T): number {
    // Simple size estimation - in real implementation, would be more sophisticated
    return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (this.cache.size > 0) {
      const entries = Array.from(this.cache.values());
      this.stats.oldestEntry = Math.min(...entries.map(e => e.timestamp));
      this.stats.newestEntry = Math.max(...entries.map(e => e.timestamp));
      this.stats.averageAccessCount = entries
        .reduce((sum, e) => sum + e.accessCount, 0) / entries.length;
    }
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: 0,
      newestEntry: 0,
      averageAccessCount: 0,
    };
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    this.updateStats();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

/**
 * Asynchronous batch processor for citation operations
 */
export class AsyncBatchProcessor {
  private config: BatchConfig;
  private activeJobs: Map<string, Promise<any>> = new Map();
  private metrics: PerformanceMetrics[] = [];

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      batchSize: 50,
      maxConcurrency: 10,
      retryAttempts: 3,
      retryDelay: 1000,
      timeoutMs: 30000,
      ...config,
    };
  }

  /**
   * Process items in batches with concurrency control
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    operationType: string = 'batch_process'
  ): Promise<R[]> {
    const startTime = Date.now();
    const results: R[] = new Array(items.length);
    const errors: Error[] = [];

    // Process items with concurrency control
    const semaphore = new Semaphore(this.config.maxConcurrency);
    
    const itemPromises = items.map(async (item, index) => {
      await semaphore.acquire();
      
      try {
        const result = await this.withTimeout(processor(item), this.config.timeoutMs);
        results[index] = result;
      } catch (error) {
        errors.push(error as Error);
        throw error;
      } finally {
        semaphore.release();
      }
    });

    await Promise.allSettled(itemPromises);

    // Filter out undefined results from failed operations
    const validResults = results.filter(r => r !== undefined);

    // Record performance metrics
    const endTime = Date.now();
    const duration = endTime - startTime;
    const metrics: PerformanceMetrics = {
      operationType,
      startTime,
      endTime,
      duration,
      itemsProcessed: items.length,
      throughput: duration > 0 ? items.length / (duration / 1000) : 0,
      memoryUsage: this.getMemoryUsage(),
      cacheHitRate: 0, // Would be set by calling code
      errors: errors.length,
    };

    this.metrics.push(metrics);

    if (errors.length > 0) {
      console.warn(`Batch processing completed with ${errors.length} errors`);
    }

    return validResults;
  }

  /**
   * Process single batch with retry logic
   */
  private async processSingleBatch<T, R>(
    batch: T[],
    processor: (item: T) => Promise<R>,
    operationType: string
  ): Promise<R[]> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.config.retryAttempts) {
      try {
        const promises = batch.map(item => 
          this.withTimeout(processor(item), this.config.timeoutMs)
        );
        
        return await Promise.all(promises);
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error(`Batch processing failed after ${this.config.retryAttempts} attempts`);
  }

  /**
   * Create batches from items array
   */
  private createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      batches.push(items.slice(i, i + this.config.batchSize));
    }
    
    return batches;
  }

  /**
   * Add timeout to promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get average performance metrics
   */
  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) {
      return {};
    }

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        duration: acc.duration + metric.duration,
        itemsProcessed: acc.itemsProcessed + metric.itemsProcessed,
        throughput: acc.throughput + metric.throughput,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        errors: acc.errors + metric.errors,
      }),
      { duration: 0, itemsProcessed: 0, throughput: 0, memoryUsage: 0, errors: 0 }
    );

    const count = this.metrics.length;
    return {
      duration: totals.duration / count,
      itemsProcessed: totals.itemsProcessed / count,
      throughput: totals.throughput / count,
      memoryUsage: totals.memoryUsage / count,
      errors: totals.errors / count,
    };
  }
}

/**
 * Semaphore for concurrency control
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      if (resolve) {
        this.permits--;
        resolve();
      }
    }
  }
}

/**
 * Database query optimizer for citation lookups
 */
export class DatabaseQueryOptimizer {
  private queryCache: IntelligentCache<any>;
  private indexHints: Map<string, string[]> = new Map();
  private queryStats: Map<string, { count: number; avgDuration: number }> = new Map();

  constructor(cacheConfig?: Partial<CacheConfig>) {
    this.queryCache = new IntelligentCache(cacheConfig);
    this.initializeIndexHints();
  }

  /**
   * Initialize database index hints for common queries
   */
  private initializeIndexHints(): void {
    this.indexHints.set('citation_lookup', ['domain', 'source_type', 'published_at']);
    this.indexHints.set('quality_assessment', ['confidence', 'credibility_score', 'last_validated']);
    this.indexHints.set('validation_results', ['url', 'last_checked', 'accessibility_status']);
    this.indexHints.set('usage_tracking', ['citation_id', 'last_used', 'times_used']);
  }

  /**
   * Optimize citation lookup queries
   */
  async optimizedCitationLookup(
    criteria: {
      domains?: string[];
      sourceTypes?: string[];
      dateRange?: { start: Date; end: Date };
      keywords?: string[];
    }
  ): Promise<Citation[]> {
    const cacheKey = this.generateCacheKey('citation_lookup', criteria);
    
    // Check cache first
    const cached = this.queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    
    // Build optimized query
    const query = this.buildOptimizedQuery('citations', criteria, 'citation_lookup');
    
    // Execute query (simulated)
    const results = await this.executeQuery(query);
    
    // Cache results
    this.queryCache.set(cacheKey, results);
    
    // Update query statistics
    this.updateQueryStats('citation_lookup', Date.now() - startTime);
    
    return results;
  }

  /**
   * Optimize quality assessment queries
   */
  async optimizedQualityLookup(citationIds: string[]): Promise<QualityReport[]> {
    const cacheKey = this.generateCacheKey('quality_assessment', { citationIds });
    
    const cached = this.queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    
    // Use batch query for multiple citations
    const query = this.buildBatchQuery('quality_reports', citationIds, 'quality_assessment');
    const results = await this.executeQuery(query);
    
    this.queryCache.set(cacheKey, results);
    this.updateQueryStats('quality_assessment', Date.now() - startTime);
    
    return results;
  }

  /**
   * Optimize validation result queries
   */
  async optimizedValidationLookup(urls: string[]): Promise<ValidationResult[]> {
    const cacheKey = this.generateCacheKey('validation_results', { urls });
    
    const cached = this.queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    
    const query = this.buildBatchQuery('validation_results', urls, 'validation_results');
    const results = await this.executeQuery(query);
    
    this.queryCache.set(cacheKey, results);
    this.updateQueryStats('validation_results', Date.now() - startTime);
    
    return results;
  }

  /**
   * Build optimized query with index hints
   */
  private buildOptimizedQuery(table: string, criteria: any, queryType: string): string {
    const hints = this.indexHints.get(queryType) || [];
    let query = `SELECT * FROM ${table}`;
    
    // Add index hints
    if (hints.length > 0) {
      query += ` USE INDEX (${hints.join(', ')})`;
    }
    
    // Add WHERE clauses based on criteria
    const conditions: string[] = [];
    
    if (criteria.domains && criteria.domains.length > 0) {
      conditions.push(`domain IN (${criteria.domains.map((d: string) => `'${d}'`).join(', ')})`);
    }
    
    if (criteria.sourceTypes && criteria.sourceTypes.length > 0) {
      conditions.push(`source_type IN (${criteria.sourceTypes.map((t: string) => `'${t}'`).join(', ')})`);
    }
    
    if (criteria.dateRange) {
      conditions.push(`published_at BETWEEN '${criteria.dateRange.start.toISOString()}' AND '${criteria.dateRange.end.toISOString()}'`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add optimization hints
    query += ' ORDER BY published_at DESC LIMIT 1000';
    
    return query;
  }

  /**
   * Build batch query for multiple IDs
   */
  private buildBatchQuery(table: string, ids: string[], queryType: string): string {
    const hints = this.indexHints.get(queryType) || [];
    let query = `SELECT * FROM ${table}`;
    
    if (hints.length > 0) {
      query += ` USE INDEX (${hints.join(', ')})`;
    }
    
    query += ` WHERE id IN (${ids.map(id => `'${id}'`).join(', ')})`;
    
    return query;
  }

  /**
   * Execute query (simulated)
   */
  private async executeQuery(query: string): Promise<any[]> {
    // Simulate database query execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Return mock results
    return [];
  }

  /**
   * Generate cache key from criteria
   */
  private generateCacheKey(operation: string, criteria: any): string {
    return `${operation}_${JSON.stringify(criteria)}`;
  }

  /**
   * Update query performance statistics
   */
  private updateQueryStats(queryType: string, duration: number): void {
    const stats = this.queryStats.get(queryType) || { count: 0, avgDuration: 0 };
    
    stats.count++;
    stats.avgDuration = (stats.avgDuration * (stats.count - 1) + duration) / stats.count;
    
    this.queryStats.set(queryType, stats);
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): Map<string, { count: number; avgDuration: number }> {
    return new Map(this.queryStats);
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.queryCache.getStats();
  }
}

/**
 * Main performance optimization coordinator
 */
export class PerformanceOptimizer {
  private validationCache: IntelligentCache<ValidationResult>;
  private qualityCache: IntelligentCache<QualityReport>;
  private citationCache: IntelligentCache<EnhancedCitation>;
  private batchProcessor: AsyncBatchProcessor;
  private queryOptimizer: DatabaseQueryOptimizer;

  constructor(
    cacheConfig?: Partial<CacheConfig>,
    batchConfig?: Partial<BatchConfig>
  ) {
    this.validationCache = new IntelligentCache<ValidationResult>(cacheConfig);
    this.qualityCache = new IntelligentCache<QualityReport>(cacheConfig);
    this.citationCache = new IntelligentCache<EnhancedCitation>(cacheConfig);
    this.batchProcessor = new AsyncBatchProcessor(batchConfig);
    this.queryOptimizer = new DatabaseQueryOptimizer(cacheConfig);
  }

  /**
   * Get validation cache
   */
  getValidationCache(): IntelligentCache<ValidationResult> {
    return this.validationCache;
  }

  /**
   * Get quality cache
   */
  getQualityCache(): IntelligentCache<QualityReport> {
    return this.qualityCache;
  }

  /**
   * Get citation cache
   */
  getCitationCache(): IntelligentCache<EnhancedCitation> {
    return this.citationCache;
  }

  /**
   * Get batch processor
   */
  getBatchProcessor(): AsyncBatchProcessor {
    return this.batchProcessor;
  }

  /**
   * Get query optimizer
   */
  getQueryOptimizer(): DatabaseQueryOptimizer {
    return this.queryOptimizer;
  }

  /**
   * Get comprehensive performance statistics
   */
  getPerformanceStats(): {
    validation: CacheStats;
    quality: CacheStats;
    citation: CacheStats;
    batch: PerformanceMetrics[];
    query: Map<string, { count: number; avgDuration: number }>;
  } {
    return {
      validation: this.validationCache.getStats(),
      quality: this.qualityCache.getStats(),
      citation: this.citationCache.getStats(),
      batch: this.batchProcessor.getMetrics(),
      query: this.queryOptimizer.getQueryStats(),
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.validationCache.clear();
    this.qualityCache.clear();
    this.citationCache.clear();
    this.queryOptimizer.clearCache();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.validationCache.destroy();
    this.qualityCache.destroy();
    this.citationCache.destroy();
  }
}