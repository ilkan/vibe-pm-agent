#!/usr/bin/env node

/**
 * Test Runner Script for CI/CD Pipeline
 * Runs tests with proper error handling and reporting
 */

import { spawn } from 'child_process';
import { writeFileSync, existsSync } from 'fs';

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      coverage: { lines: 0, statements: 0, functions: 0, branches: 0 },
      performance: { avgP50: 0, avgP95: 0, toolsCount: 0 }
    };
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runUnitTests() {
    console.log('🧪 Running unit tests...');
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:unit', '--', '--passWithNoTests']);
      
      // Parse test results from output
      const testMatch = result.stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (testMatch) {
        this.results.unit.failed = parseInt(testMatch[1]);
        this.results.unit.passed = parseInt(testMatch[2]);
        this.results.unit.total = parseInt(testMatch[3]);
      }

      console.log(`✅ Unit tests completed: ${this.results.unit.passed}/${this.results.unit.total} passed`);
      return result.success;
    } catch (error) {
      console.error('❌ Unit tests failed:', error.message);
      return false;
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:integration', '--', '--passWithNoTests']);
      
      // Parse test results from output
      const testMatch = result.stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (testMatch) {
        this.results.integration.failed = parseInt(testMatch[1]);
        this.results.integration.passed = parseInt(testMatch[2]);
        this.results.integration.total = parseInt(testMatch[3]);
      }

      console.log(`✅ Integration tests completed: ${this.results.integration.passed}/${this.results.integration.total} passed`);
      return result.success;
    } catch (error) {
      console.error('❌ Integration tests failed:', error.message);
      return false;
    }
  }

  async generateCoverage() {
    console.log('📊 Generating coverage report...');
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:coverage', '--', '--passWithNoTests']);
      
      // Try to read coverage summary
      if (existsSync('coverage/coverage-summary.json')) {
        const fs = await import('fs');
        const coverageData = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
        const total = coverageData.total;
        
        this.results.coverage = {
          lines: total.lines.pct,
          statements: total.statements.pct,
          functions: total.functions.pct,
          branches: total.branches.pct
        };
        
        console.log(`✅ Coverage generated: ${Math.round((total.lines.pct + total.statements.pct + total.functions.pct + total.branches.pct) / 4)}% average`);
      } else {
        console.log('⚠️ Coverage summary not available');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Coverage generation failed:', error.message);
      return false;
    }
  }

  async runPerformanceBenchmarks() {
    console.log('⚡ Running performance benchmarks...');
    
    try {
      const result = await this.runCommand('node', ['scripts/bench.mjs']);
      
      // Try to read performance results
      if (existsSync('.evidence/perf.json')) {
        const fs = await import('fs');
        const perfData = JSON.parse(fs.readFileSync('.evidence/perf.json', 'utf8'));
        
        this.results.performance = {
          avgP50: perfData.summary.avg_p50 || 0,
          avgP95: perfData.summary.avg_p95 || 0,
          toolsCount: perfData.summary.benchmarked_tools || 0
        };
        
        console.log(`✅ Performance benchmarks completed: ${this.results.performance.toolsCount} tools, avg P95: ${this.results.performance.avgP95}ms`);
      } else {
        console.log('⚠️ Performance data not available');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Performance benchmarks failed:', error.message);
      return false;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.unit.total + this.results.integration.total,
        totalPassed: this.results.unit.passed + this.results.integration.passed,
        totalFailed: this.results.unit.failed + this.results.integration.failed,
        coverageAverage: Math.round((
          this.results.coverage.lines + 
          this.results.coverage.statements + 
          this.results.coverage.functions + 
          this.results.coverage.branches
        ) / 4),
        performanceP95: this.results.performance.avgP95
      },
      details: this.results,
      status: {
        tests: this.results.unit.failed + this.results.integration.failed === 0 ? 'PASS' : 'FAIL',
        coverage: this.results.coverage.lines >= 80 ? 'PASS' : 'WARN',
        performance: this.results.performance.avgP95 < 2000 ? 'PASS' : 'WARN'
      }
    };

    writeFileSync('.evidence/test-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📋 Test Report Summary');
    console.log('======================');
    console.log(`Tests: ${report.summary.totalPassed}/${report.summary.totalTests} passed (${report.status.tests})`);
    console.log(`Coverage: ${report.summary.coverageAverage}% average (${report.status.coverage})`);
    console.log(`Performance: ${report.summary.performanceP95}ms P95 (${report.status.performance})`);
    console.log(`Report saved: .evidence/test-report.json`);

    return report;
  }

  async runAll() {
    console.log('🚀 Starting comprehensive test suite...\n');
    
    const startTime = Date.now();
    
    // Run all test phases
    const unitSuccess = await this.runUnitTests();
    const integrationSuccess = await this.runIntegrationTests();
    const coverageSuccess = await this.generateCoverage();
    const performanceSuccess = await this.runPerformanceBenchmarks();
    
    const totalTime = Date.now() - startTime;
    
    // Generate final report
    const report = this.generateReport();
    
    console.log(`\n⏱️ Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
    
    // Determine overall success
    const overallSuccess = unitSuccess && integrationSuccess && coverageSuccess && performanceSuccess;
    
    if (overallSuccess) {
      console.log('✅ All test phases completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Some test phases failed. Check the report for details.');
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner();
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Test run interrupted');
    process.exit(1);
  });
  
  runner.runAll().catch(console.error);
}

export default TestRunner;