// Performance optimization utilities for AI Agent Pipeline

import { 
  ParsedIntent, 
  OptimizedWorkflow, 
  ROIAnalysis, 
  ConsultingSummary,
  Workflow 
} from '../models';
import { ConsultingAnalysis } from '../components/business-analyzer';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageExecutionTime: number;
  parallelOperationsCount: number;
  memoryUsage: number;
  errorRate: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
}

/**
 * High-performance cache implementation with LRU eviction and TTL support
 */
export class PipelineCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 300000, // 5 minutes
      cleanupInterval: config.cleanupInterval || 60000 // 1 minute
    };

    this.startCleanupTimer();
  }

  /**
   * Get cached value with automatic TTL checking
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data as T;
  }

  /**
   * Set cached value with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce cache size limit with LRU eviction
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; memoryUsage: number } {
    const totalAccesses = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
    const hits = Array.from(this.cache.values()).reduce((sum, entry) => sum + (entry.accessCount - 1), 0);
    
    return {
      size: this.cache.size,
      hitRate: totalAccesses > 0 ? hits / totalAccesses : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 64; // Overhead for entry metadata
    }
    return totalSize;
  }
}

/**
 * Parallel processing utilities for independent operations
 */
export class ParallelProcessor {
  private maxConcurrency: number;
  private activeOperations = 0;
  private queue: Array<() => Promise<any>> = [];

  constructor(maxConcurrency: number = 4) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Execute operations in parallel with concurrency control
   */
  async executeParallel<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = new Array(operations.length);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < operations.length; i++) {
      const promise = this.executeWithConcurrencyControl(operations[i], i, results);
      promises.push(promise);
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * Execute operations in batches
   */
  async executeBatched<T>(operations: Array<() => Promise<T>>, batchSize: number = 3): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }

    return results;
  }

  private async executeWithConcurrencyControl<T>(
    operation: () => Promise<T>, 
    index: number, 
    results: T[]
  ): Promise<void> {
    // Wait for available slot
    while (this.activeOperations >= this.maxConcurrency) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.activeOperations++;
    
    try {
      results[index] = await operation();
    } finally {
      this.activeOperations--;
    }
  }
}

/**
 * Performance monitoring and metrics collection
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageExecutionTime: 0,
    parallelOperationsCount: 0,
    memoryUsage: 0,
    errorRate: 0
  };
  
  private executionTimes: number[] = [];
  private errorCount = 0;
  private maxHistorySize = 1000;

  /**
   * Record request execution
   */
  recordExecution(executionTime: number, cacheHit: boolean = false, parallelOps: number = 0): void {
    this.metrics.totalRequests++;
    
    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    this.metrics.parallelOperationsCount += parallelOps;
    
    // Track execution times with rolling window
    this.executionTimes.push(executionTime);
    if (this.executionTimes.length > this.maxHistorySize) {
      this.executionTimes.shift();
    }
    
    // Update average execution time
    this.metrics.averageExecutionTime = 
      this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length;
    
    // Update memory usage
    this.metrics.memoryUsage = this.getMemoryUsage();
  }

  /**
   * Record error occurrence
   */
  recordError(): void {
    this.errorCount++;
    this.metrics.errorRate = this.metrics.totalRequests > 0 
      ? (this.errorCount / this.metrics.totalRequests) * 100 
      : 0;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    status: 'excellent' | 'good' | 'acceptable' | 'poor';
    recommendations: string[];
    metrics: PerformanceMetrics;
  } {
    const cacheHitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;
    
    let status: 'excellent' | 'good' | 'acceptable' | 'poor' = 'excellent';
    const recommendations: string[] = [];

    // Evaluate performance
    if (this.metrics.averageExecutionTime > 5000) {
      status = 'poor';
      recommendations.push('Consider optimizing slow operations or increasing parallelization');
    } else if (this.metrics.averageExecutionTime > 3000) {
      status = 'acceptable';
      recommendations.push('Monitor execution times and consider performance optimizations');
    } else if (this.metrics.averageExecutionTime > 1000) {
      status = 'good';
    }

    if (cacheHitRate < 30) {
      recommendations.push('Low cache hit rate - consider increasing cache TTL or improving cache keys');
    }

    if (this.metrics.errorRate > 5) {
      status = 'poor';
      recommendations.push('High error rate detected - investigate error causes');
    } else if (this.metrics.errorRate > 2) {
      if (status === 'excellent') status = 'good';
      recommendations.push('Monitor error rate and improve error handling');
    }

    if (this.metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('High memory usage - consider cache cleanup or size limits');
    }

    return {
      status,
      recommendations,
      metrics: this.getMetrics()
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageExecutionTime: 0,
      parallelOperationsCount: 0,
      memoryUsage: 0,
      errorRate: 0
    };
    this.executionTimes = [];
    this.errorCount = 0;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
}

/**
 * Cache key generation utilities
 */
export class CacheKeyGenerator {
  /**
   * Generate cache key for intent parsing
   */
  static forIntentParsing(rawIntent: string, params?: any): string {
    const paramsHash = params ? this.hashObject(params) : 'no-params';
    const intentHash = this.hashString(rawIntent);
    return `intent:${intentHash}:${paramsHash}`;
  }

  /**
   * Generate cache key for business analysis
   */
  static forBusinessAnalysis(parsedIntent: ParsedIntent, techniques?: string[]): string {
    const intentHash = this.hashObject(parsedIntent);
    const techniquesHash = techniques ? this.hashObject(techniques.sort()) : 'all-techniques';
    return `analysis:${intentHash}:${techniquesHash}`;
  }

  /**
   * Generate cache key for workflow optimization
   */
  static forWorkflowOptimization(workflow: Workflow, analysis: ConsultingAnalysis): string {
    const workflowHash = this.hashObject(workflow);
    const analysisHash = this.hashObject(analysis);
    return `optimization:${workflowHash}:${analysisHash}`;
  }

  /**
   * Generate cache key for ROI analysis
   */
  static forROIAnalysis(workflow: Workflow, optimizedWorkflow?: OptimizedWorkflow): string {
    const workflowHash = this.hashObject(workflow);
    const optimizedHash = optimizedWorkflow ? this.hashObject(optimizedWorkflow) : 'no-optimization';
    return `roi:${workflowHash}:${optimizedHash}`;
  }

  /**
   * Generate cache key for consulting summary
   */
  static forConsultingSummary(analysis: ConsultingAnalysis, techniques?: string[]): string {
    const analysisHash = this.hashObject(analysis);
    const techniquesHash = techniques ? this.hashObject(techniques.sort()) : 'all-techniques';
    return `summary:${analysisHash}:${techniquesHash}`;
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private static hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return this.hashString(str);
  }
}

/**
 * Optimized operations that can be parallelized
 */
export interface ParallelizableOperations {
  intentValidation: () => Promise<boolean>;
  riskAssessment: () => Promise<any[]>;
  techniqueSelection: () => Promise<any[]>;
  quotaEstimation: () => Promise<any>;
  specValidation: () => Promise<boolean>;
}

/**
 * Factory for creating parallelizable operations
 */
export class ParallelOperationFactory {
  static createForIntentProcessing(
    rawIntent: string,
    parsedIntent: ParsedIntent
  ): Partial<ParallelizableOperations> {
    return {
      intentValidation: async () => {
        // Validate intent structure and completeness
        return !!(parsedIntent.businessObjective && 
                 parsedIntent.operationsRequired.length > 0);
      },
      
      riskAssessment: async () => {
        // Assess potential risks in parallel
        const risks = [];
        
        // Check for quota-intensive operations
        if (parsedIntent.operationsRequired.some(op => op.estimatedQuotaCost > 10)) {
          risks.push({ type: 'high_quota_usage', severity: 'medium' });
        }
        
        // Check for complex operations
        if (parsedIntent.technicalRequirements.some(req => req.complexity === 'high')) {
          risks.push({ type: 'high_complexity', severity: 'low' });
        }
        
        return risks;
      }
    };
  }

  static createForAnalysisProcessing(
    parsedIntent: ParsedIntent
  ): Partial<ParallelizableOperations> {
    return {
      techniqueSelection: async () => {
        // Select appropriate consulting techniques in parallel
        const techniques = [];
        
        // MECE is always applicable
        techniques.push({ name: 'MECE', relevanceScore: 0.8 });
        
        // Value Driver Tree for cost-focused intents
        if (parsedIntent.businessObjective.toLowerCase().includes('cost') ||
            parsedIntent.businessObjective.toLowerCase().includes('efficiency')) {
          techniques.push({ name: 'ValueDriverTree', relevanceScore: 0.9 });
        }
        
        // Impact vs Effort for complex workflows
        if (parsedIntent.operationsRequired.length > 3) {
          techniques.push({ name: 'ImpactEffort', relevanceScore: 0.7 });
        }
        
        return techniques;
      },
      
      quotaEstimation: async () => {
        // Estimate quota usage in parallel
        const totalQuota = parsedIntent.operationsRequired.reduce(
          (sum, op) => sum + op.estimatedQuotaCost, 0
        );
        
        return {
          naive: totalQuota,
          optimized: Math.round(totalQuota * 0.7), // Assume 30% optimization
          zeroBased: Math.round(totalQuota * 0.5)   // Assume 50% with radical redesign
        };
      }
    };
  }
}