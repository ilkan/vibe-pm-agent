#!/usr/bin/env node
/**
 * Deployment Verification Script for Vibe PM Agent
 * Tests deployed AWS infrastructure and MCP functionality
 */

const https = require('https');
const { execSync } = require('child_process');

// Configuration
const STAGE = process.env.STAGE || 'prod';
const REGION = process.env.REGION || 'us-east-1';
const TIMEOUT = 30000; // 30 seconds

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}`);
}

/**
 * Get API Gateway URL from CloudFormation stack
 */
async function getApiUrl() {
  try {
    const command = `aws cloudformation describe-stacks --stack-name vibe-pm-agent-${STAGE} --region ${REGION} --query 'Stacks[0].Outputs[?OutputKey==\`ServiceEndpoint\`].OutputValue' --output text`;
    const url = execSync(command, { encoding: 'utf8' }).trim();
    
    if (!url || url === 'None') {
      throw new Error('API Gateway URL not found in CloudFormation outputs');
    }
    
    return url;
  } catch (error) {
    log('red', `Failed to get API URL: ${error.message}`);
    throw error;
  }
}

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, TIMEOUT);

    const req = https.request(url, options, (res) => {
      clearTimeout(timeout);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint(apiUrl) {
  log('blue', 'Testing health endpoint...');
  
  try {
    const response = await makeRequest(`${apiUrl}/mcp/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      log('green', `Health check passed - Status: ${data.status}, Version: ${data.version}`);
      log('blue', `Available tools: ${data.tools?.length || 0}`);
      return true;
    } else {
      log('red', `Health check failed - HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log('red', `Health check error: ${error.message}`);
    return false;
  }
}

/**
 * Test MCP tools list
 */
async function testMcpToolsList(apiUrl) {
  log('blue', 'Testing MCP tools list...');
  
  try {
    const requestBody = JSON.stringify({
      method: 'tools/list',
      id: 1,
    });

    const response = await makeRequest(`${apiUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
      body: requestBody,
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      
      if (data.result && data.result.tools) {
        log('green', `MCP tools list successful - ${data.result.tools.length} tools available`);
        
        // Log available tools
        data.result.tools.forEach((tool, index) => {
          log('blue', `  ${index + 1}. ${tool.name}: ${tool.description}`);
        });
        
        return true;
      } else {
        log('red', 'MCP tools list failed - Invalid response format');
        return false;
      }
    } else {
      log('red', `MCP tools list failed - HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log('red', `MCP tools list error: ${error.message}`);
    return false;
  }
}

/**
 * Test business analysis tool
 */
async function testBusinessAnalysisTool(apiUrl) {
  log('blue', 'Testing business analysis tool...');
  
  try {
    const requestBody = JSON.stringify({
      method: 'tools/call',
      params: {
        name: 'analyze_business_opportunity',
        arguments: {
          idea: 'AI-powered code review assistant for development teams',
          market_context: {
            industry: 'Developer Tools',
            target_segment: 'Enterprise development teams',
          },
          analysis_depth: 'quick',
        },
      },
      id: 2,
    });

    const response = await makeRequest(`${apiUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
      body: requestBody,
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      
      if (data.result && !data.result.isError) {
        log('green', 'Business analysis tool test successful');
        log('blue', `Execution time: ${data.result.metadata?.executionTime || 'N/A'}ms`);
        log('blue', `Confidence score: ${data.result.metadata?.confidenceScore || 'N/A'}%`);
        return true;
      } else {
        log('red', `Business analysis tool failed: ${data.error?.message || 'Unknown error'}`);
        return false;
      }
    } else {
      log('red', `Business analysis tool failed - HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log('red', `Business analysis tool error: ${error.message}`);
    return false;
  }
}

/**
 * Test AWS resources
 */
async function testAwsResources() {
  log('blue', 'Testing AWS resources...');
  
  const tests = [
    {
      name: 'DynamoDB Table',
      command: `aws dynamodb describe-table --table-name vibe-pm-agent-${STAGE}-cache --region ${REGION}`,
    },
    {
      name: 'S3 Bucket',
      command: `aws s3api head-bucket --bucket vibe-pm-agent-${STAGE}-data-$(aws sts get-caller-identity --query Account --output text) --region ${REGION}`,
    },
    {
      name: 'Lambda Functions',
      command: `aws lambda list-functions --region ${REGION} --query 'Functions[?starts_with(FunctionName, \`${STAGE}-vibe-pm-agent\`)].FunctionName' --output text`,
    },
    {
      name: 'Bedrock Agents',
      command: `aws bedrock-agent list-agents --region ${REGION} --query 'agentSummaries[?contains(agentId, \`IBQRX8MZJJ\`) || contains(agentId, \`CEW45LTT2P\`) || contains(agentId, \`ULX1RJGKCR\`) || contains(agentId, \`PDZPQTNLYH\`) || contains(agentId, \`SUPERVISOR001\`) || contains(agentId, \`CITATION001\`)].agentId' --output text`,
    },
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      const result = execSync(test.command, { stdio: 'pipe', encoding: 'utf8' });
      if (test.name === 'Bedrock Agents') {
        const agentIds = result.trim().split(/\s+/).filter(id => id);
        if (agentIds.length >= 4) { // At least the original 4 agents
          log('green', `${test.name} - OK (${agentIds.length} agents found)`);
        } else {
          log('yellow', `${test.name} - PARTIAL (${agentIds.length} agents found, expected 6)`);
        }
      } else {
        log('green', `${test.name} - OK`);
      }
    } catch (error) {
      log('red', `${test.name} - FAILED`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test enhanced Bedrock agents
 */
async function testEnhancedAgents() {
  log('blue', 'Testing enhanced Bedrock agents...');
  
  try {
    // Run the enhanced agent validation script
    const result = execSync('node ../../scripts/validate-enhanced-agents.js', { 
      stdio: 'pipe', 
      encoding: 'utf8',
      cwd: __dirname
    });
    
    log('green', 'Enhanced agent validation completed successfully');
    return true;
  } catch (error) {
    log('red', `Enhanced agent validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Main verification function
 */
async function main() {
  log('blue', `Starting deployment verification for stage: ${STAGE}, region: ${REGION}`);
  
  const results = {
    awsResources: false,
    healthEndpoint: false,
    mcpToolsList: false,
    businessAnalysisTool: false,
    enhancedAgents: false,
  };

  try {
    // Test AWS resources
    results.awsResources = await testAwsResources();

    // Get API URL
    const apiUrl = await getApiUrl();
    log('blue', `API URL: ${apiUrl}`);

    // Test endpoints
    results.healthEndpoint = await testHealthEndpoint(apiUrl);
    results.mcpToolsList = await testMcpToolsList(apiUrl);
    results.businessAnalysisTool = await testBusinessAnalysisTool(apiUrl);
    
    // Test enhanced agents
    results.enhancedAgents = await testEnhancedAgents();

  } catch (error) {
    log('red', `Verification failed: ${error.message}`);
  }

  // Summary
  log('blue', '\n=== Verification Summary ===');
  
  const testResults = [
    { name: 'AWS Resources', passed: results.awsResources },
    { name: 'Health Endpoint', passed: results.healthEndpoint },
    { name: 'MCP Tools List', passed: results.mcpToolsList },
    { name: 'Business Analysis Tool', passed: results.businessAnalysisTool },
    { name: 'Enhanced Bedrock Agents', passed: results.enhancedAgents },
  ];

  let allPassed = true;
  testResults.forEach((result) => {
    const status = result.passed ? 'PASS' : 'FAIL';
    const color = result.passed ? 'green' : 'red';
    log(color, `${result.name}: ${status}`);
    
    if (!result.passed) {
      allPassed = false;
    }
  });

  if (allPassed) {
    log('green', '\n✅ All tests passed! Deployment is working correctly.');
    process.exit(0);
  } else {
    log('red', '\n❌ Some tests failed. Please check the deployment.');
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  main().catch((error) => {
    log('red', `Verification script error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testHealthEndpoint,
  testMcpToolsList,
  testBusinessAnalysisTool,
  testAwsResources,
  testEnhancedAgents,
};