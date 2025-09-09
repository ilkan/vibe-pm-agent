/**
 * Performance Cache System for Amazon Working Backwards
 * Provides caching layer for source validation, confidence calculations, and template compilation
 */

import { createHash } from 'crypto';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number; // Approximate memory usage in bytes
}

export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  cacheHit?: boolean;
  inputHash?: string;
}

export class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: PerformanceMetrics[] = [];
  private hitCount = 0;
  private missCount = 0;

  // Cache TTL constants (in milliseconds)
  private static readonly SOURCE_VALIDATION_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly CONFIDENCE_CALCULATION_TTL = 60 * 60 * 1000; // 1 hour
  private static readonly TEMPLATE_COMPILATION_TTL = 30 * 60 * 1000; // 30 minutes
  private static readonly DUPLICATE_INPUT_TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Get cached value if exists and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update hit count
    entry.hits++;
    this.hitCount++;
    return entry.data;
  }

  /**
   * Set cached value with appropriate TTL
   */
  set<T>(key: string, data: T, cacheType: 'source_validation' | 'confidence' | 'template' | 'duplicate_input'): void {
    const ttl = this.getTTL(cacheType);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });

    // Clean up expired entries periodically
    if (this.cache.size % 100 === 0) {
      this.cleanupExpired();
    }
  }

  /**
   * Generate cache key for source validation
   */
  getSourceValidationKey(url: string): string {
    return `source_validation:${this.hashString(url)}`;
  }

  /**
   * Generate cache key for confidence calculation
   */
  getConfidenceKey(citationsHash: string, coveragePct: number, sensitivityRisk?: string): string {
    const keyData = `${citationsHash}:${coveragePct}:${sensitivityRisk || 'none'}`;
    return `confidence:${this.hashString(keyData)}`;
  }

  /**
   * Generate cache key for template compilation
   */
  getTemplateKey(templateName: string, templateHash: string): string {
    return `template:${templateName}:${templateHash}`;
  }

  /**
   * Generate cache key for duplicate input detection
   */
  getDuplicateInputKey(inputsHash: string): string {
    return `duplicate_input:${inputsHash}`;
  }

  /**
   * Hash input data for duplicate detection
   */
  hashInputs(inputs: any): string {
    const normalizedInputs = this.normalizeInputs(inputs);
    const inputString = JSON.stringify(normalizedInputs);
    return this.hashString(inputString);
  }

  /**
   * Hash citations for confidence caching
   */
  hashCitations(citations: any[]): string {
    const citationData = citations.map(c => ({
      url: c.url,
      title: c.title,
      date: c.date,
      rating: c.rating,
      sourceType: c.sourceType
    }));
    return this.hashString(JSON.stringify(citationData));
  }

  /**
   * Record performance metric
   */
  recordMetric(operationName: string, duration: number, cacheHit?: boolean, inputHash?: string): void {
    this.metrics.push({
      operationName,
      duration,
      timestamp: Date.now(),
      cacheHit,
      inputHash
    });

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
    
    // Estimate memory usage
    let memoryUsage = 0;
    for (const [key, entry] of this.cache) {
      memoryUsage += key.length * 2; // String characters are 2 bytes each
      memoryUsage += JSON.stringify(entry.data).length * 2;
      memoryUsage += 32; // Overhead for entry metadata
    }

    return {
      totalEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.hitCount,
      totalMisses: this.missCount,
      memoryUsage
    };
  }

  /**
   * Get performance metrics for the last N operations
   */
  getPerformanceMetrics(limit: number = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get average performance by operation
   */
  getAveragePerformance(): Record<string, { avgDuration: number; count: number; cacheHitRate: number }> {
    const operationStats: Record<string, { durations: number[]; cacheHits: number; total: number }> = {};

    for (const metric of this.metrics) {
      if (!operationStats[metric.operationName]) {
        operationStats[metric.operationName] = { durations: [], cacheHits: 0, total: 0 };
      }
      
      operationStats[metric.operationName].durations.push(metric.duration);
      operationStats[metric.operationName].total++;
      
      if (metric.cacheHit) {
        operationStats[metric.operationName].cacheHits++;
      }
    }

    const result: Record<string, { avgDuration: number; count: number; cacheHitRate: number }> = {};
    
    for (const [operation, stats] of Object.entries(operationStats)) {
      const avgDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length;
      const cacheHitRate = stats.total > 0 ? stats.cacheHits / stats.total : 0;
      
      result[operation] = {
        avgDuration: Math.round(avgDuration * 100) / 100,
        count: stats.total,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100
      };
    }

    return result;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Clear expired entries
   */
  cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
  }

  /**
   * Get TTL based on cache type
   */
  private getTTL(cacheType: 'source_validation' | 'confidence' | 'template' | 'duplicate_input'): number {
    switch (cacheType) {
      case 'source_validation':
        return PerformanceCache.SOURCE_VALIDATION_TTL;
      case 'confidence':
        return PerformanceCache.CONFIDENCE_CALCULATION_TTL;
      case 'template':
        return PerformanceCache.TEMPLATE_COMPILATION_TTL;
      case 'duplicate_input':
        return PerformanceCache.DUPLICATE_INPUT_TTL;
      default:
        return 60 * 1000; // Default 1 minute
    }
  }

  /**
   * Hash string using SHA-256
   */
  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex').substring(0, 16);
  }

  /**
   * Normalize inputs for consistent hashing
   */
  private normalizeInputs(inputs: any): any {
    if (typeof inputs !== 'object' || inputs === null) {
      return inputs;
    }

    if (Array.isArray(inputs)) {
      return inputs.map(item => this.normalizeInputs(item)).sort();
    }

    const normalized: any = {};
    const sortedKeys = Object.keys(inputs).sort();
    
    for (const key of sortedKeys) {
      // Skip undefined values and functions
      if (inputs[key] !== undefined && typeof inputs[key] !== 'function') {
        normalized[key] = this.normalizeInputs(inputs[key]);
      }
    }

    return normalized;
  }
}

// Global cache instance
export const performanceCache = new PerformanceCache();