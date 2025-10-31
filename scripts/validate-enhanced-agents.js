#!/usr/bin/env node

/**
 * Comprehensive Validation Script for Enhanced Bedrock Agents
 * Validates agent configurations, capabilities, and Nemotron integration
 */

const { BedrockAgentClient, GetAgentCommand, ListAgentsCommand } = require('@aws-sdk/client-bedrock-agent');
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

// Expected agent configurations
const EXPECTED_AGENTS = {
  'IBQRX8MZJJ': {
    name: 'Business Strategy Agent',
    foundationModel: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    capabilities: ['market analysis', 'strategic alignment', 'competitive analysis']
  },
  'CEW45LTT2P': {
    name: 'Product Development Agent',
    foundationModel: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    capabilities: ['requirements generation', 'design options', 'task planning']
  },
  'ULX1RJGKCR': {
    name: 'Executive Communications Agent',
    foundationModel: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    capabilities: ['business cases', 'executive communications', 'strategic documents']
  },
  'PDZPQTNLYH': {
    name: 'Case Study Coaching Agent',
    foundationModel: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    capabilities: ['case study analysis', 'strategic coaching', 'business scenarios']
  },
  'SUPERVISOR001': {
    name: 'Supervisor Agent',
    foundationModel: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    capabilities: ['multi-agent orchestration', 'workflow coordination', 'task routing']
  },
  'CITATION001': {
    name: 'Citation Agent',
    foundationModel: 'meta.llama3-1-nemotron-nano-8b-v1:0',
    capabilities: ['citation validation', 'source credibility', 'research quality']
  }
};

// Validation tests
const VALIDATION_TESTS = [
  {
    name: 'Agent Configuration Validation',
    test: validateAgentConfigurations
  },
  {
    name: 'Foundation Model Validation',
    test: validateFoundationModels
  },
  {
    name: 'Agent Capability Testing',
    test: testAgentCapabilities
  },
  {
    name: 'Nemotron Enhancement Validation',
    test: validateNemotronEnhancements
  },
  {
    name: 'Multi-Agent Coordination Test',
    test: testMultiAgentCoordination
  }
];

/**
 * Validate agent configurations
 */
async function validateAgentConfigurations() {
  const client = new BedrockAgentClient({ region: 'us-east-1' });
  const results = [];
  
  console.log('🔍 Validating agent configurations...');
  
  for (const [agentId, expectedConfig] of Object.entries(EXPECTED_AGENTS)) {
    try {
      const command = new GetAgentCommand({ agentId });
      const response = await client.send(command);
      
      const agent = response.agent;
      const isValid = agent && 
                     agent.agentName === expectedConfig.name &&
                     agent.foundationModel === expectedConfig.foundationModel;
      
      results.push({
        agentId,
        name: expectedConfig.name,
        success: isValid,
        actualName: agent?.agentName,
        actualModel: agent?.foundationModel,
        expectedModel: expectedConfig.foundationModel,
        status: agent?.agentStatus
      });
      
      if (isValid) {
        console.log(`✅ ${expectedConfig.name}: Configuration valid`);
      } else {
        console.log(`❌ ${expectedConfig.name}: Configuration mismatch`);
        console.log(`   Expected model: ${expectedConfig.foundationModel}`);
        console.log(`   Actual model: ${agent?.foundationModel || 'N/A'}`);
      }
      
    } catch (error) {
      console.error(`❌ ${expectedConfig.name}: Error - ${error.message}`);
      results.push({
        agentId,
        name: expectedConfig.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Validate foundation models
 */
async function validateFoundationModels() {
  const client = new BedrockAgentClient({ region: 'us-east-1' });
  const results = [];
  
  console.log('🔍 Validating foundation models...');
  
  try {
    const command = new ListAgentsCommand({});
    const response = await client.send(command);
    
    const agents = response.agentSummaries || [];
    const nemotronAgents = agents.filter(agent => 
      Object.keys(EXPECTED_AGENTS).includes(agent.agentId) &&
      agent.latestAgentVersion?.foundationModel === 'meta.llama3-1-nemotron-nano-8b-v1:0'
    );
    
    console.log(`✅ Found ${nemotronAgents.length}/${Object.keys(EXPECTED_AGENTS).length} agents using Nemotron model`);
    
    results.push({
      test: 'Foundation Model Check',
      success: nemotronAgents.length === Object.keys(EXPECTED_AGENTS).length,
      nemotronAgents: nemotronAgents.length,
      totalAgents: Object.keys(EXPECTED_AGENTS).length
    });
    
  } catch (error) {
    console.error(`❌ Foundation model validation failed: ${error.message}`);
    results.push({
      test: 'Foundation Model Check',
      success: false,
      error: error.message
    });
  }
  
  return results;
}

/**
 * Test agent capabilities
 */
async function testAgentCapabilities() {
  const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
  const results = [];
  
  console.log('🔍 Testing agent capabilities...');
  
  // Quick capability tests for each agent
  const capabilityTests = {
    'IBQRX8MZJJ': 'Provide a brief market analysis for AI-powered customer service tools.',
    'CEW45LTT2P': 'Generate high-level requirements for a mobile app with user authentication.',
    'ULX1RJGKCR': 'Create an executive summary for a $100K software investment.',
    'PDZPQTNLYH': 'Analyze a case study: Should a startup focus on growth or profitability?',
    'SUPERVISOR001': 'Coordinate a simple workflow: market analysis followed by requirements.',
    'CITATION001': 'Validate the credibility of a business research source.'
  };
  
  for (const [agentId, testPrompt] of Object.entries(capabilityTests)) {
    try {
      const command = new InvokeAgentCommand({
        agentId,
        agentAliasId: 'TSTALIASID',
        sessionId: `capability-test-${Date.now()}`,
        inputText: testPrompt
      });
      
      const startTime = Date.now();
      const response = await client.send(command);
      const responseTime = Date.now() - startTime;
      
      // Extract response text
      let responseText = '';
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            const text = new TextDecoder().decode(chunk.chunk.bytes);
            responseText += text;
          }
        }
      }
      
      const isCapable = responseText.length > 50 && 
                       !responseText.toLowerCase().includes('error') &&
                       !responseText.toLowerCase().includes('cannot');
      
      results.push({
        agentId,
        name: EXPECTED_AGENTS[agentId].name,
        success: isCapable,
        responseTime,
        responseLength: responseText.length,
        testPrompt
      });
      
      if (isCapable) {
        console.log(`✅ ${EXPECTED_AGENTS[agentId].name}: Capability test passed (${responseTime}ms)`);
      } else {
        console.log(`❌ ${EXPECTED_AGENTS[agentId].name}: Capability test failed`);
      }
      
    } catch (error) {
      console.error(`❌ ${EXPECTED_AGENTS[agentId].name}: Capability test error - ${error.message}`);
      results.push({
        agentId,
        name: EXPECTED_AGENTS[agentId].name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Validate Nemotron enhancements
 */
async function validateNemotronEnhancements() {
  const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
  const results = [];
  
  console.log('🔍 Validating Nemotron enhancements...');
  
  // Test for enhanced reasoning capabilities
  const enhancementTest = {
    agentId: 'IBQRX8MZJJ', // Business Strategy Agent
    prompt: 'Analyze the strategic implications of AI adoption in healthcare, including competitive advantages, market timing, and implementation challenges. Provide detailed reasoning.',
    expectedIndicators: [
      'strategic implications',
      'competitive advantages',
      'market timing',
      'implementation challenges',
      'reasoning',
      'analysis',
      'insights'
    ]
  };
  
  try {
    const command = new InvokeAgentCommand({
      agentId: enhancementTest.agentId,
      agentAliasId: 'TSTALIASID',
      sessionId: `enhancement-test-${Date.now()}`,
      inputText: enhancementTest.prompt
    });
    
    const startTime = Date.now();
    const response = await client.send(command);
    const responseTime = Date.now() - startTime;
    
    // Extract response text
    let responseText = '';
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          responseText += text;
        }
      }
    }
    
    // Check for enhanced reasoning indicators
    const foundIndicators = enhancementTest.expectedIndicators.filter(indicator =>
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    const isEnhanced = foundIndicators.length >= 4 && // At least 4 indicators
                      responseText.length > 500 && // Substantial response
                      responseText.split('.').length > 10; // Multiple sentences/points
    
    results.push({
      test: 'Nemotron Enhancement Validation',
      success: isEnhanced,
      responseTime,
      responseLength: responseText.length,
      foundIndicators: foundIndicators.length,
      expectedIndicators: enhancementTest.expectedIndicators.length,
      indicators: foundIndicators
    });
    
    if (isEnhanced) {
      console.log(`✅ Nemotron enhancements validated (${foundIndicators.length}/${enhancementTest.expectedIndicators.length} indicators found)`);
    } else {
      console.log(`❌ Nemotron enhancements not detected`);
      console.log(`   Found indicators: ${foundIndicators.length}/${enhancementTest.expectedIndicators.length}`);
      console.log(`   Response length: ${responseText.length}`);
    }
    
  } catch (error) {
    console.error(`❌ Nemotron enhancement validation failed: ${error.message}`);
    results.push({
      test: 'Nemotron Enhancement Validation',
      success: false,
      error: error.message
    });
  }
  
  return results;
}

/**
 * Test multi-agent coordination
 */
async function testMultiAgentCoordination() {
  const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
  const results = [];
  
  console.log('🔍 Testing multi-agent coordination...');
  
  // Test supervisor agent coordination
  const coordinationTest = {
    agentId: 'SUPERVISOR001',
    prompt: 'Coordinate a workflow to analyze a new SaaS product opportunity: first conduct market analysis, then generate requirements, and finally create an executive summary.',
    expectedIndicators: [
      'coordinate',
      'workflow',
      'market analysis',
      'requirements',
      'executive summary',
      'agents'
    ]
  };
  
  try {
    const command = new InvokeAgentCommand({
      agentId: coordinationTest.agentId,
      agentAliasId: 'TSTALIASID',
      sessionId: `coordination-test-${Date.now()}`,
      inputText: coordinationTest.prompt
    });
    
    const startTime = Date.now();
    const response = await client.send(command);
    const responseTime = Date.now() - startTime;
    
    // Extract response text
    let responseText = '';
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          responseText += text;
        }
      }
    }
    
    // Check for coordination indicators
    const foundIndicators = coordinationTest.expectedIndicators.filter(indicator =>
      responseText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    const isCoordinating = foundIndicators.length >= 3 && 
                          responseText.length > 200;
    
    results.push({
      test: 'Multi-Agent Coordination',
      success: isCoordinating,
      responseTime,
      responseLength: responseText.length,
      foundIndicators: foundIndicators.length,
      expectedIndicators: coordinationTest.expectedIndicators.length
    });
    
    if (isCoordinating) {
      console.log(`✅ Multi-agent coordination working (${foundIndicators.length}/${coordinationTest.expectedIndicators.length} indicators found)`);
    } else {
      console.log(`❌ Multi-agent coordination issues detected`);
    }
    
  } catch (error) {
    console.error(`❌ Multi-agent coordination test failed: ${error.message}`);
    results.push({
      test: 'Multi-Agent Coordination',
      success: false,
      error: error.message
    });
  }
  
  return results;
}

/**
 * Run all validation tests
 */
async function runValidation() {
  console.log('🧪 Enhanced Bedrock Agents Validation Suite\n');
  console.log('=' .repeat(60));
  
  const allResults = [];
  
  for (const validationTest of VALIDATION_TESTS) {
    console.log(`\n📋 Running ${validationTest.name}...`);
    
    try {
      const results = await validationTest.test();
      allResults.push({
        testName: validationTest.name,
        results,
        success: results.every(r => r.success)
      });
    } catch (error) {
      console.error(`❌ ${validationTest.name} failed: ${error.message}`);
      allResults.push({
        testName: validationTest.name,
        results: [],
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary:');
  
  let totalTests = 0;
  let passedTests = 0;
  
  allResults.forEach(testGroup => {
    totalTests++;
    if (testGroup.success) {
      passedTests++;
      console.log(`✅ ${testGroup.testName}: PASSED`);
    } else {
      console.log(`❌ ${testGroup.testName}: FAILED`);
      if (testGroup.error) {
        console.log(`   Error: ${testGroup.error}`);
      }
    }
  });
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} test groups passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All validation tests passed! Enhanced agents are working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some validation tests failed. Please review the results above.');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  runValidation().catch(error => {
    console.error('💥 Validation suite error:', error);
    process.exit(1);
  });
}

module.exports = {
  validateAgentConfigurations,
  validateFoundationModels,
  testAgentCapabilities,
  validateNemotronEnhancements,
  testMultiAgentCoordination,
  runValidation
};