/**
 * Local NIM Testing and Validation System
 * 
 * Comprehensive validation system for local NVIDIA NIM deployment with
 * automated testing workflows, performance validation, and integration testing.
 */

import { NIMServiceManager } from '../../interfaces/nvidia-nim-core';
import { createLocalNIMServiceManager } from '../nim-service-manager';
import { 
  LocalNIMTester, 
  TestResult, 
  ValidationResult, 
  PerformanceMetrics,
  LoadTestResult 
} from '../local-nim-tester';
import {
  LocalTestConfig,
  TestSuite,
  TestCase,
  TestReport,
  DEFAULT_LOCAL_TEST_CONFIG,
  DEFAULT_TEST_SUITES,
  createLocalTester,
  runTestSuite,
  runAllTestSuites,
  quickHealthCheck
} from '../../utils/local-nim-test-utilities';
import { NIMErrorHandler, NIMErrorCode } from '../../utils/nvidia-nim-error-handling';

// ============================================================================
// Validation System Interfaces
// ============================================================================

export interface ValidationConfig {
  localEndpoint: string;
  timeout: number;
  enableIntegrationTests: boolean;
  enablePerformanceValidation: boolean;
  enableLoadTesting: boolean;
  validationThresholds: ValidationThresholds;
  automatedWorkflows: AutomatedWorkflow[];
}

export interface ValidationThresholds {
  minSuccessRate: number; // 0-1 scale
  maxAverageLatency: number; // milliseconds
  maxErrorRate: number; // 0-1 scale
  minThroughput: number; // requests per second
  maxMemoryUsage?: number; // MB
}

export interface AutomatedWorkflow {
  name: string;
  description: string;
  schedule?: string; // cron-like schedule
  enabled: boolean;
  testSuites: string[];
  notifications: NotificationConfig[];
}

export interface NotificationConfig {
  type: 'console' | 'webhook' | 'email';
  threshold: 'error' | 'warning' | 'info';
  endpoint?: string;
}

export interface ValidationReport {
  timestamp: Date;
  config: ValidationConfig;
  serviceHealth: any;
  testResults: TestReport[];
  integrationResults?: IntegrationTestResult[];
  performanceValidation?: PerformanceValidationResult;
  loadTestResults?: LoadTestResult;
  overallStatus: 'passed' | 'failed' | 'warning';
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface IntegrationTestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

export interface PerformanceValidationResult {
  metrics: PerformanceMetrics;
  thresholdChecks: ThresholdCheck[];
  passed: boolean;
  issues: string[];
}

export interface ThresholdCheck {
  metric: string;
  value: number;
  threshold: number;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'connectivity' | 'performance' | 'functionality' | 'integration';
  message: string;
  details?: any;
  recommendation?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  localEndpoint: 'http://localhost:1234',
  timeout: 30000,
  enableIntegrationTests: true,
  enablePerformanceValidation: true,
  enableLoadTesting: false,
  validationThresholds: {
    minSuccessRate: 0.95,
    maxAverageLatency: 3000,
    maxErrorRate: 0.05,
    minThroughput: 1.0
  },
  automatedWorkflows: [
    {
      name: 'Development Validation',
      description: 'Quick validation for development workflow',
      enabled: true,
      testSuites: ['Basic Functionality'],
      notifications: [
        { type: 'console', threshold: 'error' }
      ]
    },
    {
      name: 'Pre-deployment Validation',
      description: 'Comprehensive validation before AWS deployment',
      enabled: true,
      testSuites: ['Basic Functionality', 'Reasoning Tasks', 'Context Understanding'],
      notifications: [
        { type: 'console', threshold: 'warning' }
      ]
    }
  ]
};

// ============================================================================
// Local NIM Validator Implementation
// ============================================================================

/**
 * Comprehensive local NIM validation system
 */
export class LocalNIMValidator {
  private config: ValidationConfig;
  private serviceManager: NIMServiceManager;
  private tester: LocalNIMTester;
  private validationHistory: ValidationReport[] = [];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
    
    // Initialize service manager for integration testing
    this.serviceManager = createLocalNIMServiceManager(
      this.config.localEndpoint,
      { timeout: this.config.timeout }
    );
    
    // Initialize tester for functional testing
    this.tester = createLocalTester({
      baseUrl: this.config.localEndpoint,
      timeout: this.config.timeout,
      enablePerformanceTests: this.config.enablePerformanceValidation,
      enableLoadTests: this.config.enableLoadTesting
    });

    console.log('Local NIM Validator initialized', {
      endpoint: this.config.localEndpoint,
      integrationTests: this.config.enableIntegrationTests,
      performanceValidation: this.config.enablePerformanceValidation
    });
  }

  // ============================================================================
  // Main Validation Methods
  // ============================================================================

  /**
   * Run comprehensive validation
   */
  async runComprehensiveValidation(): Promise<ValidationReport> {
    const startTime = Date.now();
    console.log('Starting comprehensive local NIM validation...');

    const report: ValidationReport = {
      timestamp: new Date(),
      config: this.config,
      serviceHealth: null,
      testResults: [],
      overallStatus: 'passed',
      issues: [],
      recommendations: []
    };

    try {
      // 1. Service Health Check
      console.log('Checking service health...');
      report.serviceHealth = await this.serviceManager.checkHealth();
      
      if (report.serviceHealth.status !== 'healthy') {
        report.issues.push({
          severity: 'error',
          category: 'connectivity',
          message: `Service is ${report.serviceHealth.status}`,
          recommendation: 'Ensure local NIM service is running and accessible'
        });
      }

      // 2. Functional Testing
      console.log('Running functional tests...');
      report.testResults = await runAllTestSuites({
        baseUrl: this.config.localEndpoint,
        timeout: this.config.timeout,
        enablePerformanceTests: this.config.enablePerformanceValidation
      });

      // 3. Integration Testing
      if (this.config.enableIntegrationTests) {
        console.log('Running integration tests...');
        report.integrationResults = await this.runIntegrationTests();
      }

      // 4. Performance Validation
      if (this.config.enablePerformanceValidation) {
        console.log('Running performance validation...');
        report.performanceValidation = await this.validatePerformance();
      }

      // 5. Load Testing
      if (this.config.enableLoadTesting) {
        console.log('Running load tests...');
        report.loadTestResults = await this.tester.runLoadTest(3, 15, 'Load test prompt');
      }

      // 6. Analyze Results
      this.analyzeValidationResults(report);

      const duration = Date.now() - startTime;
      console.log(`Validation completed in ${duration}ms with status: ${report.overallStatus}`);

      // Store in history
      this.validationHistory.push(report);
      
      return report;
    } catch (error) {
      report.overallStatus = 'failed';
      report.issues.push({
        severity: 'error',
        category: 'functionality',
        message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        recommendation: 'Check service availability and configuration'
      });
      
      return report;
    }
  }

  /**
   * Run quick validation for development workflow
   */
  async runQuickValidation(): Promise<ValidationReport> {
    console.log('Running quick validation...');

    const report: ValidationReport = {
      timestamp: new Date(),
      config: this.config,
      serviceHealth: null,
      testResults: [],
      overallStatus: 'passed',
      issues: [],
      recommendations: []
    };

    try {
      // Quick health check
      const healthCheck = await quickHealthCheck({
        baseUrl: this.config.localEndpoint,
        timeout: this.config.timeout
      });

      if (!healthCheck.healthy) {
        report.issues.push({
          severity: 'error',
          category: 'connectivity',
          message: healthCheck.message,
          details: healthCheck.details,
          recommendation: 'Ensure local NIM service is running'
        });
        report.overallStatus = 'failed';
        return report;
      }

      // Run basic functionality tests only
      const basicSuite = DEFAULT_TEST_SUITES.find(s => s.name === 'Basic Functionality');
      if (basicSuite) {
        const testReport = await runTestSuite(this.tester, basicSuite, {
          enablePerformanceTests: false,
          testIterations: 1
        });
        report.testResults = [testReport];

        if (testReport.summary.successRate < 100) {
          report.issues.push({
            severity: 'warning',
            category: 'functionality',
            message: `Basic tests failed: ${testReport.summary.failedTests}/${testReport.summary.totalTests}`,
            recommendation: 'Review failed test cases'
          });
          report.overallStatus = 'warning';
        }
      }

      return report;
    } catch (error) {
      report.overallStatus = 'failed';
      report.issues.push({
        severity: 'error',
        category: 'functionality',
        message: `Quick validation failed: ${error instanceof Error ? error.message : String(error)}`
      });
      return report;
    }
  }

  /**
   * Run automated workflow
   */
  async runAutomatedWorkflow(workflowName: string): Promise<ValidationReport> {
    const workflow = this.config.automatedWorkflows.find(w => w.name === workflowName);
    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow '${workflowName}' is disabled`);
    }

    console.log(`Running automated workflow: ${workflowName}`);

    const report: ValidationReport = {
      timestamp: new Date(),
      config: this.config,
      serviceHealth: null,
      testResults: [],
      overallStatus: 'passed',
      issues: [],
      recommendations: []
    };

    try {
      // Run specified test suites
      for (const suiteName of workflow.testSuites) {
        const testSuite = DEFAULT_TEST_SUITES.find(s => s.name === suiteName);
        if (testSuite) {
          const testReport = await runTestSuite(this.tester, testSuite);
          report.testResults.push(testReport);
        }
      }

      // Analyze results
      this.analyzeValidationResults(report);

      // Send notifications
      await this.sendNotifications(workflow.notifications, report);

      return report;
    } catch (error) {
      report.overallStatus = 'failed';
      report.issues.push({
        severity: 'error',
        category: 'functionality',
        message: `Workflow failed: ${error instanceof Error ? error.message : String(error)}`
      });
      return report;
    }
  }

  // ============================================================================
  // Integration Testing
  // ============================================================================

  /**
   * Run integration tests with the service manager
   */
  private async runIntegrationTests(): Promise<IntegrationTestResult[]> {
    const results: IntegrationTestResult[] = [];

    // Test 1: Service Manager Chat Completion
    results.push(await this.testServiceManagerChatCompletion());

    // Test 2: Service Manager Embedding Generation
    results.push(await this.testServiceManagerEmbeddings());

    // Test 3: Configuration Management
    results.push(await this.testConfigurationManagement());

    // Test 4: Error Handling
    results.push(await this.testErrorHandling());

    return results;
  }

  /**
   * Test service manager chat completion
   */
  private async testServiceManagerChatCompletion(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.serviceManager.generateChatCompletion({
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          { role: 'user', content: 'Integration test: What is 2+2?' }
        ],
        max_tokens: 50,
        temperature: 0.1
      });

      const duration = Date.now() - startTime;

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No choices in response');
      }

      return {
        testName: 'Service Manager Chat Completion',
        success: true,
        duration,
        details: {
          model: response.model,
          tokensUsed: response.usage?.total_tokens,
          response: response.choices[0].message.content
        }
      };
    } catch (error) {
      return {
        testName: 'Service Manager Chat Completion',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test service manager embedding generation
   */
  private async testServiceManagerEmbeddings(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.serviceManager.generateEmbeddings({
        model: 'text-embedding-ada-002',
        input: 'Integration test embedding',
        encoding_format: 'float'
      });

      const duration = Date.now() - startTime;

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data in response');
      }

      return {
        testName: 'Service Manager Embedding Generation',
        success: true,
        duration,
        details: {
          model: response.model,
          dimensions: response.data[0].embedding.length,
          tokensUsed: response.usage?.total_tokens
        }
      };
    } catch (error) {
      return {
        testName: 'Service Manager Embedding Generation',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test configuration management
   */
  private async testConfigurationManagement(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      // Get current config
      const currentConfig = this.serviceManager.getConfiguration();
      
      // Update config
      await this.serviceManager.updateConfiguration({
        timeout: currentConfig.timeout + 1000
      });
      
      // Verify update
      const updatedConfig = this.serviceManager.getConfiguration();
      
      if (updatedConfig.timeout !== currentConfig.timeout + 1000) {
        throw new Error('Configuration update failed');
      }

      // Restore original config
      await this.serviceManager.updateConfiguration(currentConfig);

      return {
        testName: 'Configuration Management',
        success: true,
        duration: Date.now() - startTime,
        details: {
          originalTimeout: currentConfig.timeout,
          updatedTimeout: updatedConfig.timeout
        }
      };
    } catch (error) {
      return {
        testName: 'Configuration Management',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      // Test invalid request
      let errorCaught = false;
      try {
        await this.serviceManager.generateChatCompletion({
          model: '',
          messages: [],
          max_tokens: -1
        });
      } catch (error) {
        errorCaught = true;
        if (!(error instanceof Error) || !error.message.includes('required')) {
          throw new Error('Expected validation error not thrown');
        }
      }

      if (!errorCaught) {
        throw new Error('Expected error was not thrown');
      }

      return {
        testName: 'Error Handling',
        success: true,
        duration: Date.now() - startTime,
        details: {
          errorHandlingWorking: true
        }
      };
    } catch (error) {
      return {
        testName: 'Error Handling',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // ============================================================================
  // Performance Validation
  // ============================================================================

  /**
   * Validate performance against thresholds
   */
  private async validatePerformance(): Promise<PerformanceValidationResult> {
    try {
      // Get performance metrics from service manager
      const metrics = await this.serviceManager.getMetrics();
      
      // Run additional performance tests
      const perfMetrics = await this.tester.benchmarkPerformance([], 5);
      
      // Combine metrics
      const combinedMetrics: PerformanceMetrics = {
        ...metrics,
        ...perfMetrics
      };

      // Check against thresholds
      const thresholdChecks: ThresholdCheck[] = [
        {
          metric: 'averageLatency',
          value: combinedMetrics.averageLatency,
          threshold: this.config.validationThresholds.maxAverageLatency,
          passed: combinedMetrics.averageLatency <= this.config.validationThresholds.maxAverageLatency,
          severity: 'error'
        },
        {
          metric: 'errorRate',
          value: combinedMetrics.errorRate,
          threshold: this.config.validationThresholds.maxErrorRate,
          passed: combinedMetrics.errorRate <= this.config.validationThresholds.maxErrorRate,
          severity: 'error'
        },
        {
          metric: 'throughput',
          value: combinedMetrics.throughput,
          threshold: this.config.validationThresholds.minThroughput,
          passed: combinedMetrics.throughput >= this.config.validationThresholds.minThroughput,
          severity: 'warning'
        }
      ];

      const failedChecks = thresholdChecks.filter(check => !check.passed);
      const issues = failedChecks.map(check => 
        `${check.metric}: ${check.value} (threshold: ${check.threshold})`
      );

      return {
        metrics: combinedMetrics,
        thresholdChecks,
        passed: failedChecks.length === 0,
        issues
      };
    } catch (error) {
      return {
        metrics: {
          averageLatency: 0,
          p95Latency: 0,
          p99Latency: 0,
          throughput: 0,
          tokensPerSecond: 0,
          errorRate: 1
        },
        thresholdChecks: [],
        passed: false,
        issues: [`Performance validation failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  // ============================================================================
  // Analysis and Reporting
  // ============================================================================

  /**
   * Analyze validation results and set overall status
   */
  private analyzeValidationResults(report: ValidationReport): void {
    let hasErrors = false;
    let hasWarnings = false;

    // Check service health
    if (report.serviceHealth && report.serviceHealth.status !== 'healthy') {
      hasErrors = true;
    }

    // Check test results
    for (const testReport of report.testResults) {
      if (testReport.summary.successRate < this.config.validationThresholds.minSuccessRate) {
        if (testReport.summary.successRate < 0.8) {
          hasErrors = true;
        } else {
          hasWarnings = true;
        }
      }
    }

    // Check integration results
    if (report.integrationResults) {
      const failedIntegrationTests = report.integrationResults.filter(r => !r.success);
      if (failedIntegrationTests.length > 0) {
        hasErrors = true;
        report.issues.push({
          severity: 'error',
          category: 'integration',
          message: `${failedIntegrationTests.length} integration tests failed`,
          details: failedIntegrationTests,
          recommendation: 'Review integration test failures'
        });
      }
    }

    // Check performance validation
    if (report.performanceValidation && !report.performanceValidation.passed) {
      const errorChecks = report.performanceValidation.thresholdChecks.filter(
        c => !c.passed && c.severity === 'error'
      );
      const warningChecks = report.performanceValidation.thresholdChecks.filter(
        c => !c.passed && c.severity === 'warning'
      );

      if (errorChecks.length > 0) {
        hasErrors = true;
        report.issues.push({
          severity: 'error',
          category: 'performance',
          message: 'Performance thresholds exceeded',
          details: errorChecks,
          recommendation: 'Optimize service configuration or hardware'
        });
      }

      if (warningChecks.length > 0) {
        hasWarnings = true;
        report.issues.push({
          severity: 'warning',
          category: 'performance',
          message: 'Performance warnings detected',
          details: warningChecks,
          recommendation: 'Consider performance optimizations'
        });
      }
    }

    // Set overall status
    if (hasErrors) {
      report.overallStatus = 'failed';
    } else if (hasWarnings) {
      report.overallStatus = 'warning';
    } else {
      report.overallStatus = 'passed';
    }

    // Generate recommendations
    if (report.overallStatus === 'failed') {
      report.recommendations.push('Address critical issues before proceeding with deployment');
    }
    if (report.overallStatus === 'warning') {
      report.recommendations.push('Consider addressing warnings for optimal performance');
    }
    if (report.testResults.length > 0) {
      const avgSuccessRate = report.testResults.reduce((sum, r) => sum + r.summary.successRate, 0) / report.testResults.length;
      if (avgSuccessRate < 95) {
        report.recommendations.push('Improve test success rate for better reliability');
      }
    }
  }

  /**
   * Send notifications based on validation results
   */
  private async sendNotifications(notifications: NotificationConfig[], report: ValidationReport): Promise<void> {
    for (const notification of notifications) {
      const shouldNotify = this.shouldSendNotification(notification, report);
      
      if (shouldNotify) {
        switch (notification.type) {
          case 'console':
            this.sendConsoleNotification(report);
            break;
          case 'webhook':
            if (notification.endpoint) {
              await this.sendWebhookNotification(notification.endpoint, report);
            }
            break;
          // Add other notification types as needed
        }
      }
    }
  }

  /**
   * Check if notification should be sent
   */
  private shouldSendNotification(notification: NotificationConfig, report: ValidationReport): boolean {
    switch (notification.threshold) {
      case 'error':
        return report.overallStatus === 'failed';
      case 'warning':
        return report.overallStatus === 'warning' || report.overallStatus === 'failed';
      case 'info':
        return true;
      default:
        return false;
    }
  }

  /**
   * Send console notification
   */
  private sendConsoleNotification(report: ValidationReport): void {
    console.log('\n=== VALIDATION NOTIFICATION ===');
    console.log(`Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`Timestamp: ${report.timestamp.toISOString()}`);
    
    if (report.issues.length > 0) {
      console.log('\nIssues:');
      report.issues.forEach(issue => {
        console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    console.log('===============================\n');
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(endpoint: string, report: ValidationReport): Promise<void> {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: report.overallStatus,
          timestamp: report.timestamp,
          issues: report.issues,
          recommendations: report.recommendations
        })
      });
    } catch (error) {
      console.warn('Failed to send webhook notification:', error);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get validation history
   */
  getValidationHistory(): ValidationReport[] {
    return [...this.validationHistory];
  }

  /**
   * Get latest validation report
   */
  getLatestValidationReport(): ValidationReport | null {
    return this.validationHistory.length > 0 
      ? this.validationHistory[this.validationHistory.length - 1]
      : null;
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Validation configuration updated');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.serviceManager && 'cleanup' in this.serviceManager) {
      await (this.serviceManager as any).cleanup();
    }
    console.log('Local NIM Validator cleaned up');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a local NIM validator with default configuration
 */
export function createLocalNIMValidator(config: Partial<ValidationConfig> = {}): LocalNIMValidator {
  return new LocalNIMValidator(config);
}

/**
 * Create a validator for development workflow
 */
export function createDevelopmentValidator(localEndpoint: string = 'http://localhost:1234'): LocalNIMValidator {
  return new LocalNIMValidator({
    localEndpoint,
    enableIntegrationTests: false,
    enablePerformanceValidation: false,
    enableLoadTesting: false,
    validationThresholds: {
      minSuccessRate: 0.8,
      maxAverageLatency: 5000,
      maxErrorRate: 0.1,
      minThroughput: 0.5
    }
  });
}

/**
 * Create a validator for pre-deployment validation
 */
export function createPreDeploymentValidator(localEndpoint: string = 'http://localhost:1234'): LocalNIMValidator {
  return new LocalNIMValidator({
    localEndpoint,
    enableIntegrationTests: true,
    enablePerformanceValidation: true,
    enableLoadTesting: true,
    validationThresholds: {
      minSuccessRate: 0.95,
      maxAverageLatency: 3000,
      maxErrorRate: 0.05,
      minThroughput: 1.0
    }
  });
}