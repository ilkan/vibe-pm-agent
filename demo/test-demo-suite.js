#!/usr/bin/env node

/**
 * Demo Suite Test Runner
 * 
 * This script validates that all demos run successfully and generate expected outputs.
 * Used for CI/CD validation and hackathon judging.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Test configurations
const DEMO_TESTS = [
  {
    name: "AI Code Review Assistant",
    directory: "ai-code-review-assistant",
    script: "run-complete-workflow.js",
    expectedFiles: [
      "outputs/business-opportunity-analysis.md",
      "outputs/business-case.md",
      "outputs/executive-onepager.md",
      "outputs/strategic-alignment.json",
      "outputs/market-timing.json",
      "outputs/resource-optimization.json",
      "outputs/workflow-summary.json"
    ],
    expectedMetrics: {
      minConfidence: 80,
      minCitations: 20,
      minDocuments: 6
    }
  },
  {
    name: "Real-time Collaboration Platform",
    directory: "realtime-collaboration", 
    script: "run-analysis.js",
    expectedFiles: [
      "outputs/market-timing-analysis.json",
      "outputs/strategic-alignment-analysis.json",
      "outputs/resource-optimization-analysis.json",
      "outputs/business-opportunity-analysis.json",
      "outputs/strategic-summary.json"
    ],
    expectedMetrics: {
      minConfidence: 75,
      minCitations: 8,
      minDocuments: 5
    }
  },
  {
    name: "Customer Support Automation",
    directory: "customer-support-automation",
    script: "run-business-case.js",
    expectedFiles: [
      "outputs/comprehensive-business-case.md",
      "outputs/comprehensive-business-case.json",
      "outputs/executive-onepager.json",
      "outputs/technical-brief.json",
      "outputs/market-opportunity-analysis.json",
      "outputs/strategic-alignment.json",
      "outputs/business-case-summary.json"
    ],
    expectedMetrics: {
      minConfidence: 80,
      minCitations: 15,
      minDocuments: 7
    }
  }
];

// Test utilities
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateJsonFile(filePath, expectedStructure = {}) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Basic validation
    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: 'Invalid JSON structure' };
    }
    
    // Check for expected fields
    const missingFields = [];
    for (const field of Object.keys(expectedStructure)) {
      if (!(field in data)) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return { valid: false, error: `Missing fields: ${missingFields.join(', ')}` };
    }
    
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function extractMetrics(outputDir) {
  const metrics = {
    totalFiles: 0,
    jsonFiles: 0,
    markdownFiles: 0,
    totalCitations: 0,
    averageConfidence: 0,
    confidenceScores: []
  };
  
  try {
    const files = await fs.readdir(outputDir);
    metrics.totalFiles = files.length;
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const ext = path.extname(file);
      
      if (ext === '.json') {
        metrics.jsonFiles++;
        
        // Extract confidence and citations from JSON files
        const validation = await validateJsonFile(filePath);
        if (validation.valid) {
          const data = validation.data;
          
          // Look for confidence scores
          const confidence = 
            data.evidence?.confidence_score ||
            data.timing_assessment?.confidence_score ||
            data.alignment_assessment?.overall_score ||
            data.executive_summary?.confidence_score ||
            data.average_confidence;
            
          if (confidence && typeof confidence === 'number') {
            metrics.confidenceScores.push(confidence);
          }
          
          // Count citations
          if (data.evidence?.citations && Array.isArray(data.evidence.citations)) {
            metrics.totalCitations += data.evidence.citations.length;
          }
          
          // Check for total citations in summary files
          if (data.total_citations && typeof data.total_citations === 'number') {
            metrics.totalCitations = Math.max(metrics.totalCitations, data.total_citations);
          }
        }
      } else if (ext === '.md') {
        metrics.markdownFiles++;
      }
    }
    
    // Calculate average confidence
    if (metrics.confidenceScores.length > 0) {
      metrics.averageConfidence = Math.round(
        metrics.confidenceScores.reduce((sum, score) => sum + score, 0) / metrics.confidenceScores.length
      );
    }
    
  } catch (error) {
    console.warn(`Warning: Could not extract metrics from ${outputDir}: ${error.message}`);
  }
  
  return metrics;
}

async function testDemo(demoTest) {
  const results = {
    name: demoTest.name,
    success: false,
    duration: 0,
    filesGenerated: 0,
    filesExpected: demoTest.expectedFiles.length,
    missingFiles: [],
    metrics: {},
    errors: []
  };
  
  const demoPath = path.join(__dirname, demoTest.directory);
  const outputPath = path.join(demoPath, 'outputs');
  
  console.log(`\n🧪 Testing: ${demoTest.name}`);
  console.log(`📁 Directory: ${demoTest.directory}`);
  console.log(`📄 Expected Files: ${demoTest.expectedFiles.length}`);
  
  const startTime = Date.now();
  
  try {
    // Clean up previous outputs
    try {
      await fs.rm(outputPath, { recursive: true, force: true });
    } catch {
      // Directory might not exist, that's okay
    }
    
    // Run the demo
    console.log(`⚡ Running demo script...`);
    const result = await runCommand('node', [demoTest.script], demoPath);
    
    results.duration = Date.now() - startTime;
    
    // Check if outputs directory was created
    const outputExists = await fileExists(outputPath);
    if (!outputExists) {
      results.errors.push('Outputs directory not created');
      return results;
    }
    
    // Validate expected files
    console.log(`📋 Validating expected files...`);
    for (const expectedFile of demoTest.expectedFiles) {
      const filePath = path.join(demoPath, expectedFile);
      const exists = await fileExists(filePath);
      
      if (exists) {
        results.filesGenerated++;
        
        // Additional validation for JSON files
        if (expectedFile.endsWith('.json')) {
          const validation = await validateJsonFile(filePath);
          if (!validation.valid) {
            results.errors.push(`Invalid JSON in ${expectedFile}: ${validation.error}`);
          }
        }
      } else {
        results.missingFiles.push(expectedFile);
      }
    }
    
    // Extract metrics
    console.log(`📊 Extracting metrics...`);
    results.metrics = await extractMetrics(outputPath);
    
    // Validate metrics against expectations
    const { minConfidence, minCitations, minDocuments } = demoTest.expectedMetrics;
    
    if (results.metrics.averageConfidence < minConfidence) {
      results.errors.push(`Low confidence: ${results.metrics.averageConfidence}% < ${minConfidence}%`);
    }
    
    if (results.metrics.totalCitations < minCitations) {
      results.errors.push(`Insufficient citations: ${results.metrics.totalCitations} < ${minCitations}`);
    }
    
    if (results.filesGenerated < minDocuments) {
      results.errors.push(`Insufficient documents: ${results.filesGenerated} < ${minDocuments}`);
    }
    
    // Success if no errors and all files generated
    results.success = results.errors.length === 0 && results.missingFiles.length === 0;
    
    if (results.success) {
      console.log(`✅ Test passed: ${results.filesGenerated}/${results.filesExpected} files, ${results.metrics.averageConfidence}% confidence`);
    } else {
      console.log(`❌ Test failed: ${results.errors.length} errors, ${results.missingFiles.length} missing files`);
    }
    
  } catch (error) {
    results.duration = Date.now() - startTime;
    results.errors.push(`Execution failed: ${error.message}`);
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  return results;
}

async function runDemoTests() {
  console.log(`🧪 Vibe PM Agent - Demo Suite Test Runner`);
  console.log(`========================================`);
  console.log(`\nValidating all demo scenarios for hackathon submission...`);
  console.log(`\n📊 Test Plan:`);
  DEMO_TESTS.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name} (${test.expectedFiles.length} files expected)`);
  });
  
  const testResults = [];
  let totalDuration = 0;
  
  for (const demoTest of DEMO_TESTS) {
    const result = await testDemo(demoTest);
    testResults.push(result);
    totalDuration += result.duration;
  }
  
  // Generate test summary
  const passedTests = testResults.filter(r => r.success).length;
  const totalFiles = testResults.reduce((sum, r) => sum + r.filesGenerated, 0);
  const totalExpected = testResults.reduce((sum, r) => sum + r.filesExpected, 0);
  const totalCitations = testResults.reduce((sum, r) => sum + (r.metrics.totalCitations || 0), 0);
  const avgConfidence = Math.round(
    testResults.reduce((sum, r) => sum + (r.metrics.averageConfidence || 0), 0) / testResults.length
  );
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 TEST SUITE SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`✅ Passed Tests: ${passedTests}/${DEMO_TESTS.length}`);
  console.log(`⏱️  Total Duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`📄 Files Generated: ${totalFiles}/${totalExpected}`);
  console.log(`📚 Total Citations: ${totalCitations}`);
  console.log(`🎯 Average Confidence: ${avgConfidence}%`);
  
  console.log(`\n📋 Individual Test Results:`);
  testResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const duration = Math.round(result.duration / 1000);
    console.log(`   ${status} ${result.name}: ${result.filesGenerated}/${result.filesExpected} files, ${duration}s`);
    
    if (!result.success) {
      result.errors.forEach(error => {
        console.log(`      • Error: ${error}`);
      });
      result.missingFiles.forEach(file => {
        console.log(`      • Missing: ${file}`);
      });
    }
  });
  
  // Save test report
  const testReport = {
    execution_time: new Date().toISOString(),
    total_duration_ms: totalDuration,
    passed_tests: passedTests,
    total_tests: DEMO_TESTS.length,
    files_generated: totalFiles,
    files_expected: totalExpected,
    total_citations: totalCitations,
    average_confidence: avgConfidence,
    test_results: testResults,
    success: passedTests === DEMO_TESTS.length
  };
  
  try {
    await fs.writeFile(
      path.join(__dirname, 'test-report.json'),
      JSON.stringify(testReport, null, 2)
    );
    console.log(`\n📄 Test report saved: demo/test-report.json`);
  } catch (error) {
    console.log(`\n⚠️  Could not save test report: ${error.message}`);
  }
  
  if (testReport.success) {
    console.log(`\n🎉 All tests passed! Demo suite is ready for hackathon submission.`);
    console.log(`\n🏆 Hackathon Validation:`);
    console.log(`   • Professional PM artifacts: ✅`);
    console.log(`   • Evidence-backed analysis: ✅`);
    console.log(`   • Citation management: ✅`);
    console.log(`   • Confidence scoring: ✅`);
    console.log(`   • Real-world scenarios: ✅`);
    
    return 0; // Success exit code
  } else {
    console.log(`\n❌ Some tests failed. Review errors above and fix issues.`);
    return 1; // Failure exit code
  }
}

// Run tests
if (require.main === module) {
  runDemoTests()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error(`\n💥 Test suite crashed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runDemoTests, DEMO_TESTS };