/**
 * Performance Monitor for Amazon Working Backwards
 * Monitors timing requirements and provides performance benchmarking
 */

import { performanceCache, PerformanceMetrics } from './performance-cache';

export interface PerformanceTarget {
  operationName: string;
  maxDuration: number; // in milliseconds
  description: string;
}

export interface PerformanceReport {
  operationName: string;
  actualDuration: number;
  targetDuration: number;
  passed: boolean;
  cacheHit?: boolean;
  timestamp: number;
}

export interface PerformanceSummary {
  totalOperations: number;
  passedOperations: number;
  failedOperations: number;
  overallPassRate: number;
  averageDuration: number;
  cacheHitRate: number;
  reports: PerformanceReport[];
}

export class PerformanceMonitor {
  private static readonly PERFORMANCE_TARGETS: PerformanceTarget[] = [
    {
      operationName: 'assumption_ledger_service',
      maxDuration: 500,
      description: 'Assumption ledger normalization and validation',
    },
    {
      operationName: 'confidence_service',
      maxDuration: 500,
      description: 'Confidence score calculation with breakdown',
    },
    {
      operationName: 'scenario_service',
      maxDuration: 500,
      description: 'Bear/base/bull scenario analysis',
    },
    {
      operationName: 'hard_questions_service',
      maxDuration: 500,
      description: 'Hard questions generation',
    },
    {
      operationName: 'template_rendering',
      maxDuration: 500,
      description: 'Template compilation and rendering',
    },
    {
      operationName: 'total_generation',
      maxDuration: 120000, // 2 minutes
      description: 'Complete Amazon working backwards document generation',
    },
  ];

  private reports: PerformanceReport[] = [];

  /**
   * Time an operation and check against performance targets
   */
  async timeOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    inputHash?: string
  ): Promise<{ result: T; report: PerformanceReport }> {
    const startTime = Date.now();
    let cacheHit = false;

    try {
      const result = await operation();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Check if this was a cache hit (heuristic: very fast operations likely hit cache)
      cacheHit = duration < 10;

      // Record metric in cache
      performanceCache.recordMetric(operationName, duration, cacheHit, inputHash);

      // Create performance report
      const target = this.getTarget(operationName);
      const report: PerformanceReport = {
        operationName,
        actualDuration: duration,
        targetDuration: target?.maxDuration || 1000,
        passed: target ? duration <= target.maxDuration : true,
        cacheHit,
        timestamp: Date.now(),
      };

      this.reports.push(report);

      // Keep only last 500 reports
      if (this.reports.length > 500) {
        this.reports = this.reports.slice(-500);
      }

      return { result, report };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Record failed operation
      performanceCache.recordMetric(operationName, duration, false, inputHash);

      const target = this.getTarget(operationName);
      const report: PerformanceReport = {
        operationName,
        actualDuration: duration,
        targetDuration: target?.maxDuration || 1000,
        passed: false,
        cacheHit: false,
        timestamp: Date.now(),
      };

      this.reports.push(report);
      throw error;
    }
  }

  /**
   * Time a synchronous operation
   */
  timeSync<T>(
    operationName: string,
    operation: () => T,
    inputHash?: string
  ): { result: T; report: PerformanceReport } {
    const startTime = Date.now();

    try {
      const result = operation();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Check if this was a cache hit
      const cacheHit = duration < 5;

      // Record metric in cache
      performanceCache.recordMetric(operationName, duration, cacheHit, inputHash);

      // Create performance report
      const target = this.getTarget(operationName);
      const report: PerformanceReport = {
        operationName,
        actualDuration: duration,
        targetDuration: target?.maxDuration || 1000,
        passed: target ? duration <= target.maxDuration : true,
        cacheHit,
        timestamp: Date.now(),
      };

      this.reports.push(report);

      return { result, report };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Record failed operation
      performanceCache.recordMetric(operationName, duration, false, inputHash);

      const target = this.getTarget(operationName);
      const report: PerformanceReport = {
        operationName,
        actualDuration: duration,
        targetDuration: target?.maxDuration || 1000,
        passed: false,
        cacheHit: false,
        timestamp: Date.now(),
      };

      this.reports.push(report);
      throw error;
    }
  }

  /**
   * Get performance summary for recent operations
   */
  getPerformanceSummary(limit: number = 100): PerformanceSummary {
    const recentReports = this.reports.slice(-limit);

    const totalOperations = recentReports.length;
    const passedOperations = recentReports.filter(r => r.passed).length;
    const failedOperations = totalOperations - passedOperations;
    const overallPassRate = totalOperations > 0 ? passedOperations / totalOperations : 0;

    const totalDuration = recentReports.reduce((sum, r) => sum + r.actualDuration, 0);
    const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0;

    const cacheHits = recentReports.filter(r => r.cacheHit).length;
    const cacheHitRate = totalOperations > 0 ? cacheHits / totalOperations : 0;

    return {
      totalOperations,
      passedOperations,
      failedOperations,
      overallPassRate: Math.round(overallPassRate * 100) / 100,
      averageDuration: Math.round(averageDuration * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      reports: recentReports,
    };
  }

  /**
   * Get performance summary by operation type
   */
  getPerformanceByOperation(): Record<
    string,
    {
      avgDuration: number;
      passRate: number;
      count: number;
      cacheHitRate: number;
      target: number;
    }
  > {
    const operationStats: Record<
      string,
      {
        durations: number[];
        passed: number;
        total: number;
        cacheHits: number;
        target: number;
      }
    > = {};

    for (const report of this.reports) {
      if (!operationStats[report.operationName]) {
        const target = this.getTarget(report.operationName);
        operationStats[report.operationName] = {
          durations: [],
          passed: 0,
          total: 0,
          cacheHits: 0,
          target: target?.maxDuration || 1000,
        };
      }

      const stats = operationStats[report.operationName];
      stats.durations.push(report.actualDuration);
      stats.total++;

      if (report.passed) {
        stats.passed++;
      }

      if (report.cacheHit) {
        stats.cacheHits++;
      }
    }

    const result: Record<
      string,
      {
        avgDuration: number;
        passRate: number;
        count: number;
        cacheHitRate: number;
        target: number;
      }
    > = {};

    for (const [operation, stats] of Object.entries(operationStats)) {
      const avgDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length;
      const passRate = stats.total > 0 ? stats.passed / stats.total : 0;
      const cacheHitRate = stats.total > 0 ? stats.cacheHits / stats.total : 0;

      result[operation] = {
        avgDuration: Math.round(avgDuration * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        count: stats.total,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        target: stats.target,
      };
    }

    return result;
  }

  /**
   * Check if all performance targets are being met
   */
  areTargetsMet(): boolean {
    const summary = this.getPerformanceSummary();
    return summary.overallPassRate >= 0.95; // 95% pass rate required
  }

  /**
   * Get performance violations (operations exceeding targets)
   */
  getPerformanceViolations(): PerformanceReport[] {
    return this.reports.filter(r => !r.passed);
  }

  /**
   * Get performance targets
   */
  getTargets(): PerformanceTarget[] {
    return [...PerformanceMonitor.PERFORMANCE_TARGETS];
  }

  /**
   * Clear all performance reports
   */
  clear(): void {
    this.reports = [];
  }

  /**
   * Get target for operation name
   */
  private getTarget(operationName: string): PerformanceTarget | undefined {
    return PerformanceMonitor.PERFORMANCE_TARGETS.find(t => t.operationName === operationName);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
