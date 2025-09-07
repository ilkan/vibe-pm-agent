#!/usr/bin/env node

const { SteeringService } = require('./dist/components/steering-service');

async function testSteeringService() {
  console.log('Testing SteeringService...');
  
  const steeringService = new SteeringService({
    enabled: true,
    userPreferences: {
      autoCreate: true,
      showPreview: false,
      showSummary: false
    }
  });

  const testAnalysis = `# Business Opportunity Analysis

## Executive Summary
**Opportunity:** Test feature for steering file creation
**Market Timing:** Optimal timing for testing
**Strategic Fit:** Strong alignment with testing goals

## Market Analysis
This is a test analysis to verify steering file creation works properly.

## Recommendation
**Decision:** GO - Proceed with testing`;

  const steeringOptions = {
    feature_name: 'test_feature',
    create_steering_files: true,
    inclusion_rule: 'manual'
  };

  try {
    console.log('Creating steering file with options:', steeringOptions);
    const result = await steeringService.createFromOnePager(testAnalysis, steeringOptions);
    console.log('Steering result:', result);
    
    if (result.created) {
      console.log('✅ SUCCESS: Steering file created successfully!');
      console.log('Files created:', result.results.map(r => r.filename));
    } else {
      console.log('❌ FAILED: Steering file was not created');
      console.log('Message:', result.message);
      console.log('Warnings:', result.warnings);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testSteeringService().catch(console.error);