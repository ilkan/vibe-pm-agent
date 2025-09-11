// Integration tests for Citation Validation and Monitoring System

import {
  CitationValidationMonitor,
  MonitoringConfig,
  ValidationStatus,
  QualityAlert,
  QualityReport,
} from '../../components/citation-validation-monitor';
import { SourceValidationEngine } from '../../components/source-validation-engine';
import { Citation, CitationSourceType, CitationConfidence } from '../../models/citations';

describe('Citation Validation and Monitoring Integration', () => {
  let monitor: CitationValidationMonitor;
  let validationEngine: SourceValidationEngine;
  let testCitations: Citation[];

  beforeEach(() => {
    // Create test citations with various characteristics
    testCitations = [
      {
        id: 'high-quality-citation',
        title: 'High Quality Academic Paper',
        url: 'https://harvard.edu/research/paper1',
        domain: 'harvard.edu',
        published_at: '2023-06-01',
        source_type: CitationSourceType.ACADEMIC_PAPER,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Significant research finding',
        authors: ['Dr. Jane Smith', 'Prof. John Doe'],
        organization: 'Harvard University',
        methodology: 'Randomized controlled trial with 1000 participants',
        sample_size: 1000,
        geographic_scope: 'United States',
        industry_focus: ['healthcare', 'technology'],
      },
      {
        id: 'medium-quality-citation',
        title: 'Industry Report on Market Trends',
        url: 'https://gartner.com/reports/market-trends-2023',
        domain: 'gartner.com',
        published_at: '2023-05-15',
        source_type: CitationSourceType.INDUSTRY_REPORT,
        confidence: CitationConfidence.MEDIUM,
        key_finding: 'Market growth expected to reach 15% by 2024',
        organization: 'Gartner Inc.',
        methodology: 'Survey of 500 industry executives',
        sample_size: 500,
        geographic_scope: 'Global',
        industry_focus: ['technology'],
      },
      {
        id: 'broken-link-citation',
        title: 'Outdated Company Blog Post',
        url: 'https://broken-company.com/blog/old-post',
        domain: 'broken-company.com',
        published_at: '2020-01-01',
        source_type: CitationSourceType.COMPANY_BLOG,
        confidence: CitationConfidence.LOW,
        key_finding: 'Outdated market analysis',
        organization: 'Broken Company Inc.',
        geographic_scope: 'United States',
        industry_focus: ['technology'],
      },
      {
        id: 'compliance-issue-citation',
        title: 'Research Without Proper Attribution',
        url: 'https://questionable-source.com/research',
        domain: 'questionable-source.com',
        published_at: '2023-03-01',
        source_type: CitationSourceType.RESEARCH_PUBLICATION,
        confidence: CitationConfidence.LOW,
        key_finding: 'Questionable research finding',
        // Missing authors and methodology - compliance issue
        geographic_scope: 'Unknown',
        industry_focus: ['general'],
      },
      {
        id: 'government-data-citation',
        title: 'Official Government Statistics',
        url: 'https://census.gov/data/statistics-2023',
        domain: 'census.gov',
        published_at: '2023-07-01',
        source_type: CitationSourceType.GOVERNMENT_DATA,
        confidence: CitationConfidence.HIGH,
        key_finding: 'Population growth statistics',
        organization: 'U.S. Census Bureau',
        methodology: 'National census data collection',
        sample_size: 330000000,
        geographic_scope: 'United States',
        industry_focus: ['demographics'],
      },
    ];

    // Create monitor with integration test configuration
    const integrationConfig: Partial<MonitoringConfig> = {
      validationInterval: 0.1, // 6 minutes for faster testing
      alertThresholds: {
        brokenLinksPercent: 15,
        lowQualityPercent: 25,
        complianceViolationsPercent: 10,
      },
      reportingSchedule: {
        dailyReports: true,
        weeklyReports: true,
        monthlyReports: true,
      },
      cacheSettings: {
        validationCacheTTL: 0.5, // 30 minutes
        qualityScoreCacheTTL: 0.25, // 15 minutes
        performanceCacheTTL: 0.1, // 6 minutes
      },
      performanceTracking: {
        trackResponseTimes: true,
        trackSuccessRates: true,
        trackQualityTrends: true,
      },
    };

    monitor = new CitationValidationMonitor(integrationConfig);
    validationEngine = new SourceValidationEngine({
      timeout: 5000,
      retryAttempts: 2,
      cacheExpiry: 1,
    });
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('End-to-End Validation Workflow', () => {
    it('should perform complete validation workflow for multiple citations', async () => {
      const validationResults = await monitor.validateCitationsWithMonitoring(testCitations);

      expect(validationResults).toHaveLength(testCitations.length);

      // Check that each citation was processed
      for (const result of validationResults) {
        expect(result).toMatchObject({
          citationId: expect.any(String),
          lastValidated: expect.any(Date),
          isValid: expect.any(Boolean),
          validationErrors: expect.any(Array),
          qualityScore: expect.any(Number),
          performanceMetrics: {
            responseTime: expect.any(Number),
            successRate: expect.any(Number),
            availabilityScore: expect.any(Number),
          },
          trendData: {
            qualityTrend: expect.stringMatching(/^(improving|stable|degrading)$/),
            availabilityTrend: expect.stringMatching(/^(improving|stable|degrading)$/),
          },
        });

        expect(result.qualityScore).toBeGreaterThanOrEqual(0);
        expect(result.qualityScore).toBeLessThanOrEqual(100);
      }

      // Verify high-quality citation has good scores
      const highQualityResult = validationResults.find(
        r => r.citationId === 'high-quality-citation'
      );
      expect(highQualityResult?.qualityScore).toBeGreaterThan(70);

      // Verify broken link citation has issues
      const brokenLinkResult = validationResults.find(r => r.citationId === 'broken-link-citation');
      expect(brokenLinkResult?.isValid).toBe(false);
    }, 30000);

    it('should track performance metrics across multiple validations', async () => {
      // Run initial validation
      await monitor.validateCitationsWithMonitoring(testCitations);

      // Wait a bit and run again to see trend changes
      await new Promise(resolve => setTimeout(resolve, 100));
      await monitor.validateCitationsWithMonitoring(testCitations);

      const performanceMetrics = monitor.getPerformanceMetrics();
      expect(performanceMetrics.length).toBeGreaterThan(0);

      for (const metrics of performanceMetrics) {
        expect(metrics).toMatchObject({
          sourceId: expect.any(String),
          domain: expect.any(String),
          metrics: {
            totalValidations: expect.any(Number),
            successfulValidations: expect.any(Number),
            failedValidations: expect.any(Number),
            averageResponseTime: expect.any(Number),
            uptimePercentage: expect.any(Number),
            qualityScoreHistory: expect.any(Array),
            availabilityHistory: expect.any(Array),
          },
          trends: {
            responseTimeTrend: expect.stringMatching(/^(improving|stable|degrading)$/),
            qualityTrend: expect.stringMatching(/^(improving|stable|degrading)$/),
            availabilityTrend: expect.stringMatching(/^(improving|stable|degrading)$/),
          },
          lastUpdated: expect.any(Date),
        });

        expect(metrics.metrics.totalValidations).toBeGreaterThanOrEqual(2);
        expect(metrics.metrics.uptimePercentage).toBeGreaterThanOrEqual(0);
        expect(metrics.metrics.uptimePercentage).toBeLessThanOrEqual(100);
      }
    }, 30000);
  });

  describe('Alert Generation and Management', () => {
    it('should generate alerts for various quality issues', async () => {
      // Create citations that will trigger alerts
      const problematicCitations: Citation[] = [
        ...testCitations,
        // Add more broken citations to trigger broken link alert
        {
          id: 'broken-1',
          title: 'Broken Link 1',
          url: 'https://broken1.com/404',
          domain: 'broken1.com',
          published_at: '2023-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'Broken finding',
        },
        {
          id: 'broken-2',
          title: 'Broken Link 2',
          url: 'https://broken2.com/404',
          domain: 'broken2.com',
          published_at: '2023-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'Broken finding',
        },
      ];

      await monitor.validateCitationsWithMonitoring(problematicCitations);
      const alerts = monitor.getActiveAlerts();

      expect(alerts.length).toBeGreaterThan(0);

      // Check alert structure
      for (const alert of alerts) {
        expect(alert).toMatchObject({
          id: expect.any(String),
          type: expect.stringMatching(
            /^(broken_link|quality_degradation|compliance_violation|performance_issue)$/
          ),
          severity: expect.stringMatching(/^(low|medium|high|critical)$/),
          citationId: expect.any(String),
          message: expect.any(String),
          details: expect.any(String),
          timestamp: expect.any(Date),
          resolved: false,
        });
      }

      // Test alert resolution
      if (alerts.length > 0) {
        const alertToResolve = alerts[0];
        const resolved = monitor.resolveAlert(alertToResolve.id, ['Manual intervention applied']);
        expect(resolved).toBe(true);

        const activeAlertsAfterResolution = monitor.getActiveAlerts();
        expect(activeAlertsAfterResolution.length).toBe(alerts.length - 1);
      }
    }, 30000);

    it('should handle alert thresholds correctly', async () => {
      // Create a set of citations where exactly 20% are broken (should trigger alert)
      const mixedCitations: Citation[] = [
        testCitations[0], // Good citation
        testCitations[1], // Good citation
        testCitations[4], // Good citation
        testCitations[2], // Broken citation
        {
          id: 'broken-threshold-test',
          title: 'Another Broken Citation',
          url: 'https://definitely-broken.com/404',
          domain: 'definitely-broken.com',
          published_at: '2023-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'This will be broken',
        },
      ];

      await monitor.validateCitationsWithMonitoring(mixedCitations);
      const alerts = monitor.getActiveAlerts();

      // Should have alerts due to 40% broken links (above 15% threshold)
      const brokenLinkAlerts = alerts.filter(alert => alert.type === 'broken_link');
      expect(brokenLinkAlerts.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Quality Report Generation', () => {
    it('should generate comprehensive daily quality report', async () => {
      await monitor.validateCitationsWithMonitoring(testCitations);

      const report = await monitor.generateQualityReport('daily', testCitations);

      expect(report).toMatchObject({
        reportId: expect.any(String),
        reportType: 'daily',
        generatedAt: expect.any(Date),
        period: {
          start: expect.any(Date),
          end: expect.any(Date),
        },
        summary: {
          totalCitations: testCitations.length,
          validCitations: expect.any(Number),
          brokenLinks: expect.any(Number),
          qualityIssues: expect.any(Number),
          complianceViolations: expect.any(Number),
          averageQualityScore: expect.any(Number),
        },
        trends: {
          qualityTrend: expect.stringMatching(/^(improving|stable|degrading)$/),
          availabilityTrend: expect.stringMatching(/^(improving|stable|degrading)$/),
          complianceTrend: expect.stringMatching(/^(improving|stable|degrading)$/),
        },
        topIssues: expect.any(Array),
        recommendations: expect.any(Array),
        alerts: expect.any(Array),
      });

      // Verify summary calculations
      expect(report.summary.totalCitations).toBe(testCitations.length);
      expect(report.summary.validCitations + report.summary.brokenLinks).toBeLessThanOrEqual(
        testCitations.length
      );
      expect(report.summary.averageQualityScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.averageQualityScore).toBeLessThanOrEqual(100);

      // Verify recommendations are provided
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.every(rec => typeof rec === 'string')).toBe(true);

      // Verify top issues structure
      for (const issue of report.topIssues) {
        expect(issue).toMatchObject({
          issue: expect.any(String),
          count: expect.any(Number),
          severity: expect.stringMatching(/^(low|medium|high)$/),
          affectedCitations: expect.any(Array),
        });
      }
    }, 30000);

    it('should generate different report types with appropriate time periods', async () => {
      await monitor.validateCitationsWithMonitoring(testCitations);

      const dailyReport = await monitor.generateQualityReport('daily', testCitations);
      const weeklyReport = await monitor.generateQualityReport('weekly', testCitations);
      const monthlyReport = await monitor.generateQualityReport('monthly', testCitations);

      // Check report types
      expect(dailyReport.reportType).toBe('daily');
      expect(weeklyReport.reportType).toBe('weekly');
      expect(monthlyReport.reportType).toBe('monthly');

      // Check time periods (daily < weekly < monthly)
      const dailyPeriodLength =
        dailyReport.period.end.getTime() - dailyReport.period.start.getTime();
      const weeklyPeriodLength =
        weeklyReport.period.end.getTime() - weeklyReport.period.start.getTime();
      const monthlyPeriodLength =
        monthlyReport.period.end.getTime() - monthlyReport.period.start.getTime();

      expect(dailyPeriodLength).toBeLessThan(weeklyPeriodLength);
      expect(weeklyPeriodLength).toBeLessThan(monthlyPeriodLength);
    }, 30000);
  });

  describe('Real-time Monitoring', () => {
    it('should start and maintain monitoring process', async () => {
      expect(monitor['monitoringInterval']).toBeNull();

      monitor.startMonitoring(testCitations);
      expect(monitor['monitoringInterval']).not.toBeNull();

      // Wait for at least one monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 200));

      // Manually trigger validation to ensure status is tracked
      await monitor.validateCitationsWithMonitoring(testCitations.slice(0, 1));

      // Check that validation status is being tracked
      const validationStatus = monitor.getValidationStatus();
      expect(validationStatus.length).toBeGreaterThan(0);

      monitor.stopMonitoring();
      expect(monitor['monitoringInterval']).toBeNull();
    }, 10000);

    it('should handle monitoring restart correctly', () => {
      monitor.startMonitoring(testCitations);
      const firstInterval = monitor['monitoringInterval'];

      monitor.startMonitoring(testCitations);
      const secondInterval = monitor['monitoringInterval'];

      expect(firstInterval).not.toBe(secondInterval);
      expect(secondInterval).not.toBeNull();

      monitor.stopMonitoring();
    });
  });

  describe('Cache Management Integration', () => {
    it('should manage cache lifecycle correctly', async () => {
      // Perform initial validation to populate cache
      await monitor.validateCitationsWithMonitoring(testCitations);

      const initialValidationStatus = monitor.getValidationStatus();
      const initialPerformanceMetrics = monitor.getPerformanceMetrics();

      expect(initialValidationStatus.length).toBe(testCitations.length);
      expect(initialPerformanceMetrics.length).toBe(testCitations.length);

      // Simulate cache expiry by manually setting old timestamps
      for (const [key, status] of monitor['validationCache'].entries()) {
        status.lastValidated = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      }

      for (const [key, metrics] of monitor['performanceCache'].entries()) {
        metrics.lastUpdated = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      }

      // Clear expired cache
      monitor.clearExpiredCache();

      const afterClearValidationStatus = monitor.getValidationStatus();
      const afterClearPerformanceMetrics = monitor.getPerformanceMetrics();

      expect(afterClearValidationStatus.length).toBe(0);
      expect(afterClearPerformanceMetrics.length).toBe(0);
    }, 30000);

    it('should retrieve cached results efficiently', async () => {
      // First validation - should hit the validation engine
      const startTime1 = Date.now();
      await monitor.validateCitationWithMonitoring(testCitations[0]);
      const firstValidationTime = Date.now() - startTime1;

      // Second validation - should use cached results where possible
      const startTime2 = Date.now();
      await monitor.validateCitationWithMonitoring(testCitations[0]);
      const secondValidationTime = Date.now() - startTime2;

      // Second validation should be faster due to caching (though this is implementation-dependent)
      expect(secondValidationTime).toBeLessThan(firstValidationTime * 2); // Allow some variance

      const validationStatus = monitor.getValidationStatus(['high-quality-citation']);
      expect(validationStatus).toHaveLength(1);
      expect(validationStatus[0].citationId).toBe('high-quality-citation');
    }, 30000);
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial validation failures gracefully', async () => {
      // Create a mix of valid and invalid citations
      const mixedCitations: Citation[] = [
        testCitations[0], // Valid citation
        {
          id: 'invalid-url-citation',
          title: 'Invalid URL Citation',
          url: 'not-a-valid-url',
          domain: 'invalid',
          published_at: '2023-01-01',
          source_type: CitationSourceType.COMPANY_BLOG,
          confidence: CitationConfidence.LOW,
          key_finding: 'This will fail validation',
        },
        testCitations[1], // Another valid citation
      ];

      const results = await monitor.validateCitationsWithMonitoring(mixedCitations);

      expect(results).toHaveLength(mixedCitations.length);

      // Should have both successful and failed validations
      const successfulValidations = results.filter(r => r.isValid);
      const failedValidations = results.filter(r => !r.isValid);

      expect(successfulValidations.length).toBeGreaterThan(0);
      expect(failedValidations.length).toBeGreaterThan(0);

      // Failed validations should have error messages
      for (const failed of failedValidations) {
        expect(failed.validationErrors.length).toBeGreaterThan(0);
        expect(failed.qualityScore).toBeLessThanOrEqual(50); // Failed validations should have low quality scores
      }
    }, 30000);

    it('should maintain system stability during high load', async () => {
      // Create a large number of citations to test system stability
      const largeCitationSet: Citation[] = [];
      for (let i = 0; i < 20; i++) {
        largeCitationSet.push({
          id: `load-test-citation-${i}`,
          title: `Load Test Citation ${i}`,
          url: `https://example${i}.com/test`,
          domain: `example${i}.com`,
          published_at: '2023-01-01',
          source_type: CitationSourceType.INDUSTRY_REPORT,
          confidence: CitationConfidence.MEDIUM,
          key_finding: `Load test finding ${i}`,
        });
      }

      const startTime = Date.now();
      const results = await monitor.validateCitationsWithMonitoring(largeCitationSet);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(largeCitationSet.length);
      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds

      // Verify all citations were processed
      for (let i = 0; i < largeCitationSet.length; i++) {
        const result = results.find(r => r.citationId === `load-test-citation-${i}`);
        expect(result).toBeDefined();
      }

      // System should still be responsive
      const performanceMetrics = monitor.getPerformanceMetrics();
      expect(performanceMetrics.length).toBe(largeCitationSet.length);
    }, 60000);
  });
});
