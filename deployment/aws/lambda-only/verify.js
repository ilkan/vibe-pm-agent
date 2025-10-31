#!/usr/bin/env node
/**
 * Simple verification script for Lambda-only deployment
 */

const https = require('https');

// Configuration
const API_URL = 'https://befppfo09a.execute-api.us-east-1.amazonaws.com/dev';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}`);
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint() {
  log('blue', 'Testing health endpoint...');
  
  try {
    const response = await makeRequest(`${API_URL}/mcp/health`);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      log('green', `Health check passed - Status: ${data.status}, Version: ${data.version}`);
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
async function testMcpToolsList() {
  log('blue', 'Testing MCP tools list...');
  
  try {
    const requestBody = JSON.stringify({
      method: 'tools/list',
      id: 1,
    });

    const response = await makeRequest(`${API_URL}/mcp`, {
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
async function testBusinessAnalysisTool() {
  log('blue', 'Testing business analysis tool...');
  
  try {
    const requestBody = JSON.stringify({
      method: 'tools/call',
      params: {
        name: 'analyze_business_opportunity',
        arguments: {
          idea: 'AI-powered code review assistant for development teams',
        },
      },
      id: 2,
    });

    const response = await makeRequest(`${API_URL}/mcp`, {
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
 * Main verification function
 */
async function main() {
  log('blue', 'Starting Vibe PM Agent deployment verification...');
  
  const results = {
    healthEndpoint: false,
    mcpToolsList: false,
    businessAnalysisTool: false,
  };

  try {
    results.healthEndpoint = await testHealthEndpoint();
    results.mcpToolsList = await testMcpToolsList();
    results.businessAnalysisTool = await testBusinessAnalysisTool();

  } catch (error) {
    log('red', `Verification failed: ${error.message}`);
  }

  // Summary
  log('blue', '\n=== Verification Summary ===');
  
  const testResults = [
    { name: 'Health Endpoint', passed: results.healthEndpoint },
    { name: 'MCP Tools List', passed: results.mcpToolsList },
    { name: 'Business Analysis Tool', passed: results.businessAnalysisTool },
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
    log('blue', `\nAPI URL: ${API_URL}`);
    log('blue', 'Health endpoint: GET /mcp/health');
    log('blue', 'MCP endpoint: POST /mcp');
    process.exit(0);
  } else {
    log('red', '\n❌ Some tests failed. Please check the deployment.');
    process.exit(1);
  }
}

main().catch((error) => {
  log('red', `Verification script error: ${error.message}`);
  process.exit(1);
});