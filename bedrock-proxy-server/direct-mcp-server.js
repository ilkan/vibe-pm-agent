const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const https = require('https');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Configuration
const MCP_LAMBDA_FUNCTION = process.env.MCP_LAMBDA_FUNCTION || 'vibe-pm-agent-dev';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_gFn54IyZ5';
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';

// Initialize Lambda client
const lambdaClient = new LambdaClient({ region: AWS_REGION });

// JWKS cache for Cognito token verification
const jwksUri = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
let jwksCache = null;

// Fetch JWKS
async function getJWKS() {
  if (jwksCache) return jwksCache;
  
  return new Promise((resolve, reject) => {
    https.get(jwksUri, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          jwksCache = JSON.parse(data);
          resolve(jwksCache);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Get signing key from JWKS
async function getSigningKey(kid) {
  const jwks = await getJWKS();
  const key = jwks.keys.find(k => k.kid === kid);
  if (!key) throw new Error(`Unable to find a signing key that matches '${kid}'`);
  
  const jwkToPem = require('jwk-to-pem');
  return jwkToPem(key);
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// JWT verification middleware
const verifyToken = async (req, res, next) => {
  try {
    console.log('🔐 Verifying token...');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      console.error('❌ Invalid token format');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Get signing key and verify token
    const signingKey = await getSigningKey(decoded.header.kid);
    const verified = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
      audience: decoded.payload.aud
    });

    console.log('✅ Token verified successfully for user:', verified.sub);
    req.user = verified;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ 
      error: 'Token verification failed',
      details: error.message 
    });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    config: {
      mcpLambdaFunction: MCP_LAMBDA_FUNCTION,
      region: AWS_REGION,
      port: PORT,
      mode: 'direct-mcp'
    }
  });
});

// Direct MCP tool invocation endpoint
app.post('/invoke', verifyToken, async (req, res) => {
  try {
    const { text, sessionId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    const finalSessionId = sessionId || `direct-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[${new Date().toISOString()}] Direct MCP invocation:`, {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      sessionId: finalSessionId,
      user: req.user.sub
    });

    // Analyze the user input to determine which MCP tool to call
    const toolCall = analyzeUserInput(text);
    
    // Prepare MCP request
    const mcpRequest = {
      method: 'tools/call',
      params: {
        name: toolCall.name,
        arguments: toolCall.arguments
      }
    };

    // Invoke the MCP Lambda function
    const command = new InvokeCommand({
      FunctionName: MCP_LAMBDA_FUNCTION,
      Payload: JSON.stringify(mcpRequest),
    });

    const lambdaResponse = await lambdaClient.send(command);
    const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));

    // Format the response
    let formattedResponse = '';
    if (responsePayload.result && responsePayload.result.content) {
      if (Array.isArray(responsePayload.result.content)) {
        formattedResponse = responsePayload.result.content
          .map(item => item.text || JSON.stringify(item))
          .join('\n\n');
      } else {
        formattedResponse = responsePayload.result.content.text || JSON.stringify(responsePayload.result.content);
      }
    } else {
      formattedResponse = JSON.stringify(responsePayload, null, 2);
    }

    const result = {
      response: formattedResponse,
      sessionId: finalSessionId,
      toolUsed: toolCall.name,
      timestamp: new Date().toISOString(),
      user: req.user.sub
    };

    console.log(`[${new Date().toISOString()}] Response generated:`, {
      sessionId: finalSessionId,
      toolUsed: toolCall.name,
      responseLength: formattedResponse.length
    });

    res.json(result);

  } catch (error) {
    console.error('Error invoking MCP tool:', error);
    
    res.status(500).json({ 
      error: 'Failed to invoke MCP tool',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Analyze user input to determine which MCP tool to call
function analyzeUserInput(text) {
  const lowerText = text.toLowerCase();
  
  // Business analysis patterns
  if (lowerText.includes('analyze') && (lowerText.includes('business') || lowerText.includes('opportunity'))) {
    return {
      name: 'mcp_vibe_pm_agent_analyze_business_opportunity',
      arguments: {
        idea: text,
        market_context: {
          industry: 'technology',
          budget_range: 'medium',
          timeline: '6 months'
        }
      }
    };
  }
  
  // PR-FAQ generation
  if (lowerText.includes('pr-faq') || lowerText.includes('press release')) {
    return {
      name: 'mcp_vibe_pm_agent_generate_pr_faq',
      arguments: {
        product_info: text,
        target_audience: 'general'
      }
    };
  }
  
  // One-pager generation
  if (lowerText.includes('one-pager') || lowerText.includes('onepager') || lowerText.includes('executive')) {
    return {
      name: 'mcp_vibe_pm_agent_generate_management_onepager',
      arguments: {
        project_info: text,
        audience: 'executives'
      }
    };
  }
  
  // Interview preparation
  if (lowerText.includes('interview') && lowerText.includes('pm')) {
    return {
      name: 'mcp_vibe_pm_agent_start_interview_preparation',
      arguments: {
        role_level: 'PM',
        preparation_timeline: '2 weeks'
      }
    };
  }
  
  // Business case generation
  if (lowerText.includes('business case') || lowerText.includes('roi')) {
    return {
      name: 'mcp_vibe_pm_agent_generate_business_case',
      arguments: {
        opportunity_analysis: text,
        financial_inputs: {
          development_cost: 100000,
          expected_revenue: 500000,
          operational_cost: 50000,
          time_to_market: 6
        }
      }
    };
  }
  
  // Default: business opportunity analysis
  return {
    name: 'mcp_vibe_pm_agent_analyze_business_opportunity',
    arguments: {
      idea: text,
      market_context: {
        industry: 'technology',
        budget_range: 'medium',
        timeline: '3 months'
      }
    }
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Direct MCP Proxy Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Invoke endpoint: http://localhost:${PORT}/invoke`);
  console.log(`🎯 MCP Lambda Function: ${MCP_LAMBDA_FUNCTION}`);
  console.log(`🌍 AWS Region: ${AWS_REGION}`);
  console.log(`🔐 Cognito User Pool: ${COGNITO_USER_POOL_ID}`);
  console.log(`💡 Mode: Direct MCP (bypassing Bedrock Agent)`);
});