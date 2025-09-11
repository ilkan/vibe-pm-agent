// Citation Validation and Monitoring System for Enhanced Citation System

import {
  Citation,
  EnhancedCitation,
  AccessibilityStatus,
  CredibilityAssessment,
  ComplianceStatus,
  CitationConfidence,
  CitationSourceType,
} from '../../models/citations';
import { SourceValidationEngine, ValidationResult } from '../source-validation-engine';

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  validationInterval: number; // Hours between validation checks
  alertThresholds: {
    brokenLinksPercent: number;
    lowQualityPercent: number;
    complianceViolationsPercent: number;
  };
  reportingSchedule: {
    dailyReports: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  cacheSettings: {
    validationCacheTTL: number; // Hours
    qualityScoreCacheTTL: number; // Hours
    performanceCacheTTL: number; // Hours
  };
  performanceTracking: {
    trackResponseTimes: boolean;
    trackSuccessRates: boolean;
    trackQualityTrends: boolean;
  };
}

/**
 * Validation status for monitoring
 */
export interface ValidationStatus {
  citationId: string;
  lastValidated: Date;
  isValid: boolean;
  validationErrors: string[];
  qualityScore: number;
  performanceMetrics: {
    responseTime: number;
    successRate: number;
    availabilityScore: number;
  };
  trendData: {
    qualityTrend: 'improving' | 'stable' | 'degrading';
    availabilityTrend: 'improving' | 'stable' | 'degrading';
  };
}

/**
 * Quality monitoring alert
 */
export interface QualityAlert {
  id: string;
  type: 'broken_link' | 'quality_degradation' | 'compliance_violation' | 'performance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  citationId: string;
  message: string;
  details: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actionsTaken?: string[];
}

/**
 * Performance metrics for source tracking
 */
export interface SourcePerformanceMetrics {
  sourceId: string;
  domain: string;
  metrics: {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    averageResponseTime: number;
    uptimePercentage: number;
    qualityScoreHistory: Array<{ date: Date; score: number }>;
    availabilityHistory: Array<{ date: Date; available: boolean }>;
  };
  trends: {
    responseTimeTrend: 'improving' | 'stable' | 'degrading';
    qualityTrend: 'improving' | 'stable' | 'degrading';
    availabilityTrend: 'improving' | 'stable' | 'degrading';
  };
  lastUpdated: Date;
}

/**
 * Automated quality report
 */
export interface QualityReport {
  reportId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalCitations: number;
    validCitations: number;
    brokenLinks: number;
    qualityIssues: number;
    complianceViolations: number;
    averageQualityScore: number;
  };
  trends: {
    qualityTrend: 'improving' | 'stable' | 'degrading';
    availabilityTrend: 'improving' | 'stable' | 'degrading';
    complianceTrend: 'improving' | 'stable' | 'degrading';
  };
  topIssues: Array<{
    issue: string;
    count: number;
    severity: string;
    affectedCitations: string[];
  }>;
  recommendations: string[];
  alerts: QualityAlert[];
}

/**
 * Citation Validation and Monitoring System
 */
export class CitationValidationMonitor {
  private config: MonitoringConfig;
  private validationEngine: SourceValidationEngine;
  private validationCache: Map<string, ValidationStatus> = new Map();
  private performanceCache: Map<string, SourcePerformanceMetrics> = new Map();
  private alertsCache: Map<string, QualityAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      validationInterval: 24, // 24 hours
      alertThresholds: {
        brokenLinksPercent: 10,
        lowQualityPercent: 20,
        complianceViolationsPercent: 5,
      },
      reportingSchedule: {
        dailyReports: true,
        weeklyReports: true,
        monthlyReports: true,
      },
      cacheSettings: {
        validationCacheTTL: 24,
        qualityScoreCacheTTL: 12,
        performanceCacheTTL: 6,
      },
      performanceTracking: {
        trackResponseTimes: true,
        trackSuccessRates: true,
        trackQualityTrends: true,
      },
      ...config,
    };

    this.validationEngine = new SourceValidationEngine({
      timeout: 10000,
      retryAttempts: 3,
      cacheExpiry: this.config.cacheSettings.validationCacheTTL,
    });
  }

  /**
   * Start real-time monitoring of citations
   */
  startMonitoring(citations: Citation[]): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    // Initial validation
    this.validateCitationsWithMonitoring(citations);

    // Set up periodic validation
    this.monitoringInterval = setInterval(
      () => {
        this.validateCitationsWithMonitoring(citations);
      },
      this.config.validationInterval * 60 * 60 * 1000
    ); // Convert hours to milliseconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Validate citations with monitoring and alerting
   */
  async validateCitationsWithMonitoring(citations: Citation[]): Promise<ValidationStatus[]> {
    const validationPromises = citations.map(citation =>
      this.validateCitationWithMonitoring(citation)
    );
    const results = await Promise.all(validationPromises);

    // Check for alerts
    await this.checkForAlerts(results);

    // Update performance metrics
    await this.updatePerformanceMetrics(results);

    return results;
  }

  /**
   * Validate single citation with monitoring
   */
  async validateCitationWithMonitoring(citation: Citation): Promise<ValidationStatus> {
    const startTime = Date.now();

    try {
      const validationResult = await this.validationEngine.validateCitation(citation);
      const responseTime = Date.now() - startTime;

      const status: ValidationStatus = {
        citationId: citation.id,
        lastValidated: new Date(),
        isValid:
          validationResult.accessibilityStatus.isAccessible &&
          validationResult.complianceStatus.isCompliant,
        validationErrors: this.extractValidationErrors(validationResult),
        qualityScore: this.calculateQualityScore(validationResult),
        performanceMetrics: {
          responseTime,
          successRate: this.calculateSuccessRate(citation.id),
          availabilityScore: this.calculateAvailabilityScore(validationResult),
        },
        trendData: {
          qualityTrend: this.calculateQualityTrend(citation.id),
          availabilityTrend: this.calculateAvailabilityTrend(citation.id),
        },
      };

      // Cache the validation status
      this.validationCache.set(citation.id, status);

      return status;
    } catch (error) {
      const errorStatus: ValidationStatus = {
        citationId: citation.id,
        lastValidated: new Date(),
        isValid: false,
        validationErrors: [error instanceof Error ? error.message : 'Unknown validation error'],
        qualityScore: 0,
        performanceMetrics: {
          responseTime: Date.now() - startTime,
          successRate: 0,
          availabilityScore: 0,
        },
        trendData: {
          qualityTrend: 'degrading',
          availabilityTrend: 'degrading',
        },
      };

      this.validationCache.set(citation.id, errorStatus);
      return errorStatus;
    }
  }

  /**
   * Check for quality alerts based on validation results
   */
  private async checkForAlerts(validationResults: ValidationStatus[]): Promise<void> {
    const totalCitations = validationResults.length;
    const brokenLinks = validationResults.filter(r => !r.isValid).length;
    const lowQuality = validationResults.filter(r => r.qualityScore < 60).length;
    const complianceViolations = validationResults.filter(r =>
      r.validationErrors.some(error => error.includes('compliance'))
    ).length;

    // Check broken links threshold
    const brokenLinksPercent = (brokenLinks / totalCitations) * 100;
    if (brokenLinksPercent > this.config.alertThresholds.brokenLinksPercent) {
      await this.createAlert({
        type: 'broken_link',
        severity: brokenLinksPercent > 25 ? 'critical' : 'high',
        message: `High percentage of broken links detected: ${brokenLinksPercent.toFixed(1)}%`,
        details: `${brokenLinks} out of ${totalCitations} citations have broken links`,
        citationId: 'multiple',
      });
    }

    // Check quality threshold
    const lowQualityPercent = (lowQuality / totalCitations) * 100;
    if (lowQualityPercent > this.config.alertThresholds.lowQualityPercent) {
      await this.createAlert({
        type: 'quality_degradation',
        severity: lowQualityPercent > 40 ? 'critical' : 'medium',
        message: `High percentage of low-quality citations: ${lowQualityPercent.toFixed(1)}%`,
        details: `${lowQuality} out of ${totalCitations} citations have quality scores below 60`,
        citationId: 'multiple',
      });
    }

    // Check compliance violations
    const complianceViolationsPercent = (complianceViolations / totalCitations) * 100;
    if (complianceViolationsPercent > this.config.alertThresholds.complianceViolationsPercent) {
      await this.createAlert({
        type: 'compliance_violation',
        severity: 'high',
        message: `Compliance violations detected: ${complianceViolationsPercent.toFixed(1)}%`,
        details: `${complianceViolations} out of ${totalCitations} citations have compliance issues`,
        citationId: 'multiple',
      });
    }

    // Check individual citation performance issues
    for (const result of validationResults) {
      if (result.performanceMetrics.responseTime > 30000) {
        // 30 seconds
        await this.createAlert({
          type: 'performance_issue',
          severity: 'medium',
          message: `Slow response time for citation ${result.citationId}`,
          details: `Response time: ${result.performanceMetrics.responseTime}ms`,
          citationId: result.citationId,
        });
      }
    }
  }

  /**
   * Create a quality alert
   */
  private async createAlert(
    alertData: Omit<QualityAlert, 'id' | 'timestamp' | 'resolved'>
  ): Promise<QualityAlert> {
    const alert: QualityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alertsCache.set(alert.id, alert);

    // In a real implementation, this would send notifications
    console.warn(`Citation Quality Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);

    return alert;
  }

  /**
   * Update performance metrics for sources
   */
  private async updatePerformanceMetrics(validationResults: ValidationStatus[]): Promise<void> {
    for (const result of validationResults) {
      const existingMetrics = this.performanceCache.get(result.citationId);
      const now = new Date();

      if (existingMetrics) {
        // Update existing metrics
        existingMetrics.metrics.totalValidations++;
        if (result.isValid) {
          existingMetrics.metrics.successfulValidations++;
        } else {
          existingMetrics.metrics.failedValidations++;
        }

        // Update averages
        existingMetrics.metrics.averageResponseTime =
          (existingMetrics.metrics.averageResponseTime + result.performanceMetrics.responseTime) /
          2;

        existingMetrics.metrics.uptimePercentage =
          (existingMetrics.metrics.successfulValidations /
            existingMetrics.metrics.totalValidations) *
          100;

        // Add to history (keep last 30 entries)
        existingMetrics.metrics.qualityScoreHistory.push({ date: now, score: result.qualityScore });
        if (existingMetrics.metrics.qualityScoreHistory.length > 30) {
          existingMetrics.metrics.qualityScoreHistory.shift();
        }

        existingMetrics.metrics.availabilityHistory.push({ date: now, available: result.isValid });
        if (existingMetrics.metrics.availabilityHistory.length > 30) {
          existingMetrics.metrics.availabilityHistory.shift();
        }

        // Update trends
        existingMetrics.trends = {
          responseTimeTrend: this.calculateResponseTimeTrend(
            existingMetrics.metrics.qualityScoreHistory
          ),
          qualityTrend: result.trendData.qualityTrend,
          availabilityTrend: result.trendData.availabilityTrend,
        };

        existingMetrics.lastUpdated = now;
      } else {
        // Create new metrics
        const newMetrics: SourcePerformanceMetrics = {
          sourceId: result.citationId,
          domain: 'unknown', // Would be extracted from citation in real implementation
          metrics: {
            totalValidations: 1,
            successfulValidations: result.isValid ? 1 : 0,
            failedValidations: result.isValid ? 0 : 1,
            averageResponseTime: result.performanceMetrics.responseTime,
            uptimePercentage: result.isValid ? 100 : 0,
            qualityScoreHistory: [{ date: now, score: result.qualityScore }],
            availabilityHistory: [{ date: now, available: result.isValid }],
          },
          trends: {
            responseTimeTrend: 'stable',
            qualityTrend: result.trendData.qualityTrend,
            availabilityTrend: result.trendData.availabilityTrend,
          },
          lastUpdated: now,
        };

        this.performanceCache.set(result.citationId, newMetrics);
      }
    }
  }

  /**
   * Generate automated quality report
   */
  async generateQualityReport(
    reportType: 'daily' | 'weekly' | 'monthly',
    citations: Citation[]
  ): Promise<QualityReport> {
    const now = new Date();
    const period = this.calculateReportPeriod(reportType, now);

    // Get validation results for the period
    const validationResults = await this.validateCitationsWithMonitoring(citations);

    // Calculate summary statistics
    const summary = {
      totalCitations: citations.length,
      validCitations: validationResults.filter(r => r.isValid).length,
      brokenLinks: validationResults.filter(r => !r.isValid).length,
      qualityIssues: validationResults.filter(r => r.qualityScore < 60).length,
      complianceViolations: validationResults.filter(r =>
        r.validationErrors.some(error => error.includes('compliance'))
      ).length,
      averageQualityScore:
        validationResults.reduce((sum, r) => sum + r.qualityScore, 0) / validationResults.length,
    };

    // Calculate trends
    const trends = {
      qualityTrend: this.calculateOverallQualityTrend(validationResults),
      availabilityTrend: this.calculateOverallAvailabilityTrend(validationResults),
      complianceTrend: this.calculateComplianceTrend(validationResults),
    };

    // Identify top issues
    const topIssues = this.identifyTopIssues(validationResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, trends, topIssues);

    // Get recent alerts
    const alerts = Array.from(this.alertsCache.values())
      .filter(alert => alert.timestamp >= period.start)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const report: QualityReport = {
      reportId: `report_${reportType}_${now.getTime()}`,
      reportType,
      generatedAt: now,
      period,
      summary,
      trends,
      topIssues,
      recommendations,
      alerts,
    };

    return report;
  }

  /**
   * Get current validation status for citations
   */
  getValidationStatus(citationIds?: string[]): ValidationStatus[] {
    if (citationIds) {
      return citationIds
        .map(id => this.validationCache.get(id))
        .filter((status): status is ValidationStatus => status !== undefined);
    }

    return Array.from(this.validationCache.values());
  }

  /**
   * Get performance metrics for sources
   */
  getPerformanceMetrics(sourceIds?: string[]): SourcePerformanceMetrics[] {
    if (sourceIds) {
      return sourceIds
        .map(id => this.performanceCache.get(id))
        .filter((metrics): metrics is SourcePerformanceMetrics => metrics !== undefined);
    }

    return Array.from(this.performanceCache.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): QualityAlert[] {
    return Array.from(this.alertsCache.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, actionsTaken?: string[]): boolean {
    const alert = this.alertsCache.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.actionsTaken = actionsTaken;
      return true;
    }
    return false;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();

    // Clear expired validation cache
    for (const [key, status] of this.validationCache.entries()) {
      const hoursOld = (now - status.lastValidated.getTime()) / (1000 * 60 * 60);
      if (hoursOld > this.config.cacheSettings.validationCacheTTL) {
        this.validationCache.delete(key);
      }
    }

    // Clear expired performance cache
    for (const [key, metrics] of this.performanceCache.entries()) {
      const hoursOld = (now - metrics.lastUpdated.getTime()) / (1000 * 60 * 60);
      if (hoursOld > this.config.cacheSettings.performanceCacheTTL) {
        this.performanceCache.delete(key);
      }
    }

    // Clear old alerts (keep for 30 days)
    for (const [key, alert] of this.alertsCache.entries()) {
      const daysOld = (now - alert.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld > 30) {
        this.alertsCache.delete(key);
      }
    }
  }

  // Private helper methods

  private extractValidationErrors(validationResult: ValidationResult): string[] {
    const errors: string[] = [];

    if (!validationResult.accessibilityStatus.isAccessible) {
      errors.push(
        `Source not accessible: ${validationResult.accessibilityStatus.errorMessage || 'Unknown error'}`
      );
    }

    if (!validationResult.complianceStatus.isCompliant) {
      errors.push(...validationResult.complianceStatus.violations);
    }

    if (validationResult.credibilityAssessment.riskFactors.length > 0) {
      errors.push(...validationResult.credibilityAssessment.riskFactors);
    }

    return errors;
  }

  private calculateQualityScore(validationResult: ValidationResult): number {
    const weights = {
      credibility: 0.4,
      accessibility: 0.3,
      compliance: 0.3,
    };

    const credibilityScore = validationResult.credibilityAssessment.overallScore;
    const accessibilityScore = validationResult.accessibilityStatus.isAccessible ? 100 : 0;
    const complianceScore = validationResult.complianceStatus.isCompliant ? 100 : 50;

    return Math.round(
      credibilityScore * weights.credibility +
        accessibilityScore * weights.accessibility +
        complianceScore * weights.compliance
    );
  }

  private calculateSuccessRate(citationId: string): number {
    const metrics = this.performanceCache.get(citationId);
    if (!metrics) return 100; // First validation

    return (metrics.metrics.successfulValidations / metrics.metrics.totalValidations) * 100;
  }

  private calculateAvailabilityScore(validationResult: ValidationResult): number {
    if (!validationResult.accessibilityStatus.isAccessible) return 0;

    const responseTime = validationResult.accessibilityStatus.responseTime || 5000;
    if (responseTime < 2000) return 100;
    if (responseTime < 5000) return 80;
    if (responseTime < 10000) return 60;
    return 40;
  }

  private calculateQualityTrend(citationId: string): 'improving' | 'stable' | 'degrading' {
    const metrics = this.performanceCache.get(citationId);
    if (!metrics || metrics.metrics.qualityScoreHistory.length < 3) return 'stable';

    const recent = metrics.metrics.qualityScoreHistory.slice(-3);
    const trend = recent[2].score - recent[0].score;

    if (trend > 5) return 'improving';
    if (trend < -5) return 'degrading';
    return 'stable';
  }

  private calculateAvailabilityTrend(citationId: string): 'improving' | 'stable' | 'degrading' {
    const metrics = this.performanceCache.get(citationId);
    if (!metrics || metrics.metrics.availabilityHistory.length < 5) return 'stable';

    const recent = metrics.metrics.availabilityHistory.slice(-5);
    const availableCount = recent.filter(h => h.available).length;

    if (availableCount >= 4) return 'improving';
    if (availableCount <= 2) return 'degrading';
    return 'stable';
  }

  private calculateResponseTimeTrend(
    history: Array<{ date: Date; score: number }>
  ): 'improving' | 'stable' | 'degrading' {
    if (history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const trend = recent[2].score - recent[0].score;

    if (trend > 0) return 'improving';
    if (trend < 0) return 'degrading';
    return 'stable';
  }

  private calculateReportPeriod(
    reportType: 'daily' | 'weekly' | 'monthly',
    now: Date
  ): { start: Date; end: Date } {
    const end = new Date(now);
    const start = new Date(now);

    switch (reportType) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return { start, end };
  }

  private calculateOverallQualityTrend(
    results: ValidationStatus[]
  ): 'improving' | 'stable' | 'degrading' {
    const improvingCount = results.filter(r => r.trendData.qualityTrend === 'improving').length;
    const degradingCount = results.filter(r => r.trendData.qualityTrend === 'degrading').length;

    if (improvingCount > degradingCount * 1.5) return 'improving';
    if (degradingCount > improvingCount * 1.5) return 'degrading';
    return 'stable';
  }

  private calculateOverallAvailabilityTrend(
    results: ValidationStatus[]
  ): 'improving' | 'stable' | 'degrading' {
    const improvingCount = results.filter(
      r => r.trendData.availabilityTrend === 'improving'
    ).length;
    const degradingCount = results.filter(
      r => r.trendData.availabilityTrend === 'degrading'
    ).length;

    if (improvingCount > degradingCount * 1.5) return 'improving';
    if (degradingCount > improvingCount * 1.5) return 'degrading';
    return 'stable';
  }

  private calculateComplianceTrend(
    results: ValidationStatus[]
  ): 'improving' | 'stable' | 'degrading' {
    const complianceIssues = results.filter(r =>
      r.validationErrors.some(error => error.includes('compliance'))
    ).length;

    const complianceRate = (results.length - complianceIssues) / results.length;

    if (complianceRate > 0.95) return 'improving';
    if (complianceRate < 0.85) return 'degrading';
    return 'stable';
  }

  private identifyTopIssues(results: ValidationStatus[]): Array<{
    issue: string;
    count: number;
    severity: string;
    affectedCitations: string[];
  }> {
    const issueMap = new Map<string, { count: number; citations: string[] }>();

    for (const result of results) {
      for (const error of result.validationErrors) {
        const existing = issueMap.get(error) || { count: 0, citations: [] };
        existing.count++;
        existing.citations.push(result.citationId);
        issueMap.set(error, existing);
      }
    }

    return Array.from(issueMap.entries())
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        severity:
          data.count > results.length * 0.2
            ? 'high'
            : data.count > results.length * 0.1
              ? 'medium'
              : 'low',
        affectedCitations: data.citations,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateRecommendations(
    summary: QualityReport['summary'],
    trends: QualityReport['trends'],
    topIssues: QualityReport['topIssues']
  ): string[] {
    const recommendations: string[] = [];

    // Quality recommendations
    if (summary.averageQualityScore < 70) {
      recommendations.push(
        'Consider replacing low-quality sources with more authoritative alternatives'
      );
    }

    if (trends.qualityTrend === 'degrading') {
      recommendations.push('Quality trend is degrading - review and update citation sources');
    }

    // Availability recommendations
    if (summary.brokenLinks > summary.totalCitations * 0.1) {
      recommendations.push(
        'High number of broken links detected - implement automated link checking'
      );
    }

    if (trends.availabilityTrend === 'degrading') {
      recommendations.push(
        'Source availability is degrading - consider archiving important sources'
      );
    }

    // Compliance recommendations
    if (summary.complianceViolations > 0) {
      recommendations.push('Address compliance violations to meet regulatory requirements');
    }

    // Issue-specific recommendations
    for (const issue of topIssues.slice(0, 3)) {
      if (issue.severity === 'high') {
        recommendations.push(
          `Address high-priority issue: ${issue.issue} (affects ${issue.count} citations)`
        );
      }
    }

    return recommendations;
  }
}
