/**
 * Automated NIM Testing Workflows
 * 
 * Automated testing workflows for development, CI/CD, and deployment validation
 * with scheduling, monitoring, and reporting capabilities.
 */

import { LocalNIMValidator, ValidationReport, ValidationConfig } from '../local-nim-validator';
import { createDevelopmentValidator, createPreDeploymentValidator } from '../local-nim-validator';

// ============================================================================
// Workflow Interfaces
// ============================================================================

export interface WorkflowScheduler {
  scheduleWorkflow(workflowId: string, schedule: string): Promise<void>;
  unscheduleWorkflow(workflowId: string): Promise<void>;
  getScheduledWorkflows(): ScheduledWorkflow[];
  runWorkflowNow(workflowId: string): Promise<ValidationReport>;
}

export interface ScheduledWorkflow {
  id: string;
  name: string;
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
  validator: LocalNIMValidator;
}

export interface WorkflowResult {
  workflowId: string;
  timestamp: Date;
  report: ValidationReport;
  duration: number;
  success: boolean;
}

// ============================================================================
// Pre-defined Workflows
// ============================================================================

/**
 * Development workflow - quick validation during development
 */
export async function runDevelopmentWorkflow(
  localEndpoint: string = 'http://localhost:1234'
): Promise<ValidationReport> {
  console.log('Running development workflow...');
  
  const validator = createDevelopmentValidator(localEndpoint);
  
  try {
    const report = await validator.runQuickValidation();
    
    console.log(`Development workflow completed: ${report.overallStatus}`);
    if (report.issues.length > 0) {
      console.log('Issues found:');
      report.issues.forEach(issue => {
        console.log(`  [${issue.severity}] ${issue.message}`);
      });
    }
    
    return report;
  } finally {
    await validator.cleanup();
  }
}

/**
 * Pre-commit workflow - validation before code commits
 */
export async function runPreCommitWorkflow(
  localEndpoint: string = 'http://localhost:1234'
): Promise<ValidationReport> {
  console.log('Running pre-commit workflow...');
  
  const validator = createDevelopmentValidator(localEndpoint);
  
  try {
    // Run basic functionality tests
    const report = await validator.runAutomatedWorkflow('Development Validation');
    
    if (report.overallStatus === 'failed') {
      console.error('Pre-commit validation failed - commit blocked');
      process.exit(1);
    } else if (report.overallStatus === 'warning') {
      console.warn('Pre-commit validation has warnings - review recommended');
    } else {
      console.log('Pre-commit validation passed');
    }
    
    return report;
  } finally {
    await validator.cleanup();
  }
}

/**
 * Pre-deployment workflow - comprehensive validation before AWS deployment
 */
export async function runPreDeploymentWorkflow(
  localEndpoint: string = 'http://localhost:1234'
): Promise<ValidationReport> {
  console.log('Running pre-deployment workflow...');
  
  const validator = createPreDeploymentValidator(localEndpoint);
  
  try {
    const report = await validator.runComprehensiveValidation();
    
    console.log(`Pre-deployment validation completed: ${report.overallStatus}`);
    
    if (report.overallStatus === 'failed') {
      console.error('Pre-deployment validation failed - deployment blocked');
      console.log('Critical issues:');
      report.issues
        .filter(issue => issue.severity === 'error')
        .forEach(issue => {
          console.log(`  - ${issue.message}`);
          if (issue.recommendation) {
            console.log(`    Recommendation: ${issue.recommendation}`);
          }
        });
      
      throw new Error('Pre-deployment validation failed');
    }
    
    if (report.overallStatus === 'warning') {
      console.warn('Pre-deployment validation has warnings:');
      report.issues
        .filter(issue => issue.severity === 'warning')
        .forEach(issue => {
          console.log(`  - ${issue.message}`);
        });
    }
    
    console.log('Pre-deployment validation passed - ready for AWS deployment');
    return report;
  } finally {
    await validator.cleanup();
  }
}

/**
 * CI/CD workflow - validation in continuous integration
 */
export async function runCICDWorkflow(
  localEndpoint: string = 'http://localhost:1234',
  config: {
    failOnWarnings?: boolean;
    enableLoadTesting?: boolean;
    reportPath?: string;
  } = {}
): Promise<ValidationReport> {
  console.log('Running CI/CD workflow...');
  
  const validationConfig: Partial<ValidationConfig> = {
    localEndpoint,
    enableLoadTesting: config.enableLoadTesting || false,
    validationThresholds: {
      minSuccessRate: 0.95,
      maxAverageLatency: 4000,
      maxErrorRate: 0.05,
      minThroughput: 0.8
    }
  };
  
  const validator = new LocalNIMValidator(validationConfig);
  
  try {
    const report = await validator.runComprehensiveValidation();
    
    // Save report if path provided
    if (config.reportPath) {
      await saveValidationReport(report, config.reportPath);
    }
    
    // Check results
    const shouldFail = report.overallStatus === 'failed' || 
                      (config.failOnWarnings && report.overallStatus === 'warning');
    
    if (shouldFail) {
      console.error(`CI/CD validation failed: ${report.overallStatus}`);
      process.exit(1);
    }
    
    console.log('CI/CD validation passed');
    return report;
  } finally {
    await validator.cleanup();
  }
}

/**
 * Performance monitoring workflow - continuous performance validation
 */
export async function runPerformanceMonitoringWorkflow(
  localEndpoint: string = 'http://localhost:1234',
  duration: number = 300000 // 5 minutes
): Promise<ValidationReport[]> {
  console.log(`Running performance monitoring workflow for ${duration}ms...`);
  
  const validator = createPreDeploymentValidator(localEndpoint);
  const reports: ValidationReport[] = [];
  const interval = 30000; // 30 seconds
  const iterations = Math.floor(duration / interval);
  
  try {
    for (let i = 0; i < iterations; i++) {
      console.log(`Performance check ${i + 1}/${iterations}`);
      
      const report = await validator.runQuickValidation();
      reports.push(report);
      
      // Check for performance degradation
      if (report.performanceValidation && !report.performanceValidation.passed) {
        console.warn('Performance degradation detected');
        report.performanceValidation.issues.forEach(issue => {
          console.warn(`  - ${issue}`);
        });
      }
      
      // Wait for next iteration
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // Analyze trends
    const avgSuccessRate = reports.reduce((sum, r) => 
      sum + (r.testResults[0]?.summary.successRate || 0), 0) / reports.length;
    
    console.log(`Performance monitoring completed. Average success rate: ${avgSuccessRate.toFixed(1)}%`);
    
    return reports;
  } finally {
    await validator.cleanup();
  }
}

// ============================================================================
// Workflow Scheduler Implementation
// ============================================================================

/**
 * Simple workflow scheduler for automated testing
 */
export class SimpleWorkflowScheduler implements WorkflowScheduler {
  private scheduledWorkflows: Map<string, ScheduledWorkflow> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule a workflow to run at specified intervals
   */
  async scheduleWorkflow(workflowId: string, schedule: string): Promise<void> {
    const workflow = this.scheduledWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Parse simple schedule format (e.g., "*/5 * * * *" for every 5 minutes)
    const intervalMs = this.parseSchedule(schedule);
    
    // Clear existing timer
    const existingTimer = this.timers.get(workflowId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Schedule new timer
    const timer = setInterval(async () => {
      try {
        console.log(`Running scheduled workflow: ${workflow.name}`);
        await this.runWorkflowNow(workflowId);
      } catch (error) {
        console.error(`Scheduled workflow ${workflowId} failed:`, error);
      }
    }, intervalMs);

    this.timers.set(workflowId, timer);
    workflow.enabled = true;
    workflow.schedule = schedule;
    workflow.nextRun = new Date(Date.now() + intervalMs);

    console.log(`Workflow ${workflowId} scheduled to run every ${intervalMs}ms`);
  }

  /**
   * Unschedule a workflow
   */
  async unscheduleWorkflow(workflowId: string): Promise<void> {
    const timer = this.timers.get(workflowId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(workflowId);
    }

    const workflow = this.scheduledWorkflows.get(workflowId);
    if (workflow) {
      workflow.enabled = false;
      workflow.nextRun = undefined;
    }

    console.log(`Workflow ${workflowId} unscheduled`);
  }

  /**
   * Get all scheduled workflows
   */
  getScheduledWorkflows(): ScheduledWorkflow[] {
    return Array.from(this.scheduledWorkflows.values());
  }

  /**
   * Run a workflow immediately
   */
  async runWorkflowNow(workflowId: string): Promise<ValidationReport> {
    const workflow = this.scheduledWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const startTime = Date.now();
    
    try {
      let report: ValidationReport;
      
      switch (workflowId) {
        case 'development':
          report = await workflow.validator.runQuickValidation();
          break;
        case 'pre-deployment':
          report = await workflow.validator.runComprehensiveValidation();
          break;
        default:
          report = await workflow.validator.runAutomatedWorkflow(workflow.name);
          break;
      }

      workflow.lastRun = new Date();
      
      // Calculate next run time
      if (workflow.schedule) {
        const intervalMs = this.parseSchedule(workflow.schedule);
        workflow.nextRun = new Date(Date.now() + intervalMs);
      }

      console.log(`Workflow ${workflowId} completed in ${Date.now() - startTime}ms: ${report.overallStatus}`);
      
      return report;
    } catch (error) {
      console.error(`Workflow ${workflowId} failed:`, error);
      throw error;
    }
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: ScheduledWorkflow): void {
    this.scheduledWorkflows.set(workflow.id, workflow);
    console.log(`Workflow ${workflow.id} registered: ${workflow.name}`);
  }

  /**
   * Parse simple schedule format
   */
  private parseSchedule(schedule: string): number {
    // Simple parser for basic intervals
    // Format: "interval_minutes" (e.g., "5" for every 5 minutes)
    const minutes = parseInt(schedule, 10);
    if (isNaN(minutes) || minutes <= 0) {
      throw new Error(`Invalid schedule format: ${schedule}`);
    }
    return minutes * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Cleanup all scheduled workflows
   */
  async cleanup(): Promise<void> {
    for (const workflowId of this.timers.keys()) {
      await this.unscheduleWorkflow(workflowId);
    }
    
    for (const workflow of this.scheduledWorkflows.values()) {
      await workflow.validator.cleanup();
    }
    
    console.log('Workflow scheduler cleaned up');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Save validation report to file
 */
async function saveValidationReport(report: ValidationReport, filePath: string): Promise<void> {
  const fs = await import('fs/promises');
  const reportJson = JSON.stringify(report, null, 2);
  await fs.writeFile(filePath, reportJson, 'utf-8');
  console.log(`Validation report saved to ${filePath}`);
}

/**
 * Create and configure a workflow scheduler with default workflows
 */
export function createWorkflowScheduler(localEndpoint: string = 'http://localhost:1234'): SimpleWorkflowScheduler {
  const scheduler = new SimpleWorkflowScheduler();
  
  // Register default workflows
  scheduler.registerWorkflow({
    id: 'development',
    name: 'Development Validation',
    schedule: '',
    enabled: false,
    validator: createDevelopmentValidator(localEndpoint)
  });
  
  scheduler.registerWorkflow({
    id: 'pre-deployment',
    name: 'Pre-deployment Validation',
    schedule: '',
    enabled: false,
    validator: createPreDeploymentValidator(localEndpoint)
  });
  
  return scheduler;
}

/**
 * Run workflow based on environment or command line argument
 */
export async function runWorkflowByName(
  workflowName: string,
  localEndpoint: string = 'http://localhost:1234',
  options: any = {}
): Promise<ValidationReport> {
  switch (workflowName.toLowerCase()) {
    case 'development':
    case 'dev':
      return await runDevelopmentWorkflow(localEndpoint);
      
    case 'pre-commit':
    case 'precommit':
      return await runPreCommitWorkflow(localEndpoint);
      
    case 'pre-deployment':
    case 'predeployment':
    case 'deploy':
      return await runPreDeploymentWorkflow(localEndpoint);
      
    case 'ci':
    case 'cicd':
      return await runCICDWorkflow(localEndpoint, options);
      
    case 'performance':
    case 'perf':
      const reports = await runPerformanceMonitoringWorkflow(localEndpoint, options.duration);
      return reports[reports.length - 1]; // Return latest report
      
    default:
      throw new Error(`Unknown workflow: ${workflowName}`);
  }
}