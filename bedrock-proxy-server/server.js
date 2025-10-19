const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const https = require('https');
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID || 'ULX1RJGKCR';
const BEDROCK_AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_gFn54IyZ5';
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';

// Initialize Bedrock Agent client
const bedrockClient = new BedrockAgentRuntimeClient({ 
  region: AWS_REGION 
});

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
  
  // Convert JWK to PEM format
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
      console.error('❌ Missing or invalid authorization header:', authHeader);
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    console.log('📋 Token received (first 50 chars):', token.substring(0, 50) + '...');
    
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      console.error('❌ Invalid token format');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.log('🔍 Token info:', {
      tokenType: decoded.payload.token_use,
      audience: decoded.payload.aud,
      issuer: decoded.payload.iss,
      kid: decoded.header.kid
    });

    // Get signing key
    const signingKey = await getSigningKey(decoded.header.kid);

    // Verify token
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
    console.error('Error details:', error);
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
      bedrockAgentId: BEDROCK_AGENT_ID,
      region: AWS_REGION,
      port: PORT
    }
  });
});

// Bedrock Agent invocation endpoint
app.post('/invoke', verifyToken, async (req, res) => {
  try {
    const { text, sessionId, enableTrace = false } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `proxy-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[${new Date().toISOString()}] Invoking Bedrock Agent:`, {
      agentId: BEDROCK_AGENT_ID,
      sessionId: finalSessionId,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      user: req.user.sub
    });

    const command = new InvokeAgentCommand({
      agentId: BEDROCK_AGENT_ID,
      agentAliasId: BEDROCK_AGENT_ALIAS_ID,
      sessionId: finalSessionId,
      inputText: text,
      enableTrace: enableTrace
    });

    const response = await bedrockClient.send(command);
    
    // Process the response stream
    let fullResponse = '';
    let traces = [];
    
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
          fullResponse += chunkText;
        }
        
        if (chunk.trace && enableTrace) {
          traces.push(chunk.trace);
        }
      }
    }

    const result = {
      response: fullResponse,
      sessionId: finalSessionId,
      agentId: BEDROCK_AGENT_ID,
      timestamp: new Date().toISOString(),
      user: req.user.sub
    };

    if (enableTrace && traces.length > 0) {
      result.traces = traces;
    }

    console.log(`[${new Date().toISOString()}] Response generated:`, {
      sessionId: finalSessionId,
      responseLength: fullResponse.length,
      tracesCount: traces.length
    });

    res.json(result);

  } catch (error) {
    console.error('Error invoking Bedrock Agent:', error);
    
    res.status(500).json({ 
      error: 'Failed to invoke Bedrock Agent',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

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
  console.log(`🚀 Bedrock Agent Proxy Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Invoke endpoint: http://localhost:${PORT}/invoke`);
  console.log(`🎯 Bedrock Agent ID: ${BEDROCK_AGENT_ID}`);
  console.log(`🌍 AWS Region: ${AWS_REGION}`);
  console.log(`🔐 Cognito User Pool: ${COGNITO_USER_POOL_ID}`);
});