// AWS Lambda function for Bedrock Agent Proxy with Rate Limiting
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const REGION = process.env.AWS_REGION || 'us-east-1';
const agentClient = new BedrockAgentRuntimeClient({ region: REGION });
const bedrockClient = new BedrockRuntimeClient({ region: REGION });

// Rate limiting state (Lambda container reuse)
let lastRequestTime = 0;
const CLAUDE_HAIKU_MODEL_ID = 'anthropic.claude-3-5-haiku-20241022-v1:0';
const CLAUDE_SONNET_V2_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

// Model configurations with rate limits
const MODEL_CONFIGS = {
  'haiku': {
    modelId: CLAUDE_HAIKU_MODEL_ID,
    requestsPerMinute: 10,
    minIntervalMs: 6000, // 60000ms / 10 requests = 6s between requests
    crossRegionMultiplier: 2
  },
  'sonnet-v2': {
    modelId: CLAUDE_SONNET_V2_MODEL_ID,
    requestsPerMinute: 1,
    minIntervalMs: 60000, // 60000ms / 1 request = 60s between requests
    crossRegionMultiplier: 2
  }
};

// Default to Claude 3.5 Haiku for better rate limits
const CURRENT_MODEL = process.env.BEDROCK_MODEL || 'haiku';
const ENABLE_CROSS_REGION = process.env.ENABLE_CROSS_REGION !== 'false';

console.log(`🚀 Bedrock Proxy initialized with ${CURRENT_MODEL} model`);
console.log(`🌍 Cross-region inference: ${ENABLE_CROSS_REGION ? 'ENABLED' : 'DISABLED'}`);

/**
 * Rate limiting function
 */
async function waitForRateLimit() {
  const config = MODEL_CONFIGS[CURRENT_MODEL];
  const minInterval = ENABLE_CROSS_REGION ? 
    config.minIntervalMs / config.crossRegionMultiplier : 
    config.minIntervalMs;
  
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  const waitTime = Math.max(0, minInterval - timeSinceLastRequest);
  
  if (waitTime > 0) {
    console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime / 1000)}s`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Health check
  if (event.path === '/health' && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'healthy',
        service: 'Bedrock Agent Proxy Lambda',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })
    };
  }

  // Handle Bedrock Agent requests with rate limiting
  if (event.path === '/api/bedrock-agent' && event.httpMethod === 'POST') {
    try {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const { text, sessionId, agentId, agentAliasId, enableTrace, useDirectModel } = body;
      
      if (!text) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required field: text' })
        };
      }

      // Apply rate limiting
      await waitForRateLimit();

      const finalSessionId = sessionId || `lambda-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Choose between Agent or direct model invocation
      if (useDirectModel) {
        return await invokeDirectModel(text, finalSessionId, enableTrace);
      } else {
        return await invokeBedrockAgent(text, finalSessionId, agentId, agentAliasId, enableTrace);
      }

    } catch (error) {
      console.error('❌ Bedrock error:', error);
      
      // Handle different error types
      let statusCode = 500;
      let errorMessage = 'Failed to invoke Bedrock';
      
      if (error.name === 'ThrottlingException') {
        statusCode = 429;
        errorMessage = `Rate limit exceeded for ${CURRENT_MODEL}. Please wait ${Math.ceil(MODEL_CONFIGS[CURRENT_MODEL].minIntervalMs / 1000)}s and try again.`;
      } else if (error.name === 'ExpiredTokenException') {
        statusCode = 401;
        errorMessage = 'AWS credentials expired. Please refresh and try again.';
      }
      
      return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: errorMessage,
          message: error.message,
          model: CURRENT_MODEL,
          crossRegion: ENABLE_CROSS_REGION,
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  // New endpoint for model status
  if (event.path === '/api/bedrock-status' && event.httpMethod === 'GET') {
    const config = MODEL_CONFIGS[CURRENT_MODEL];
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    const minInterval = ENABLE_CROSS_REGION ? 
      config.minIntervalMs / config.crossRegionMultiplier : 
      config.minIntervalMs;
    const nextRequestIn = Math.max(0, minInterval - timeSinceLastRequest);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        currentModel: CURRENT_MODEL,
        modelId: config.modelId,
        crossRegionEnabled: ENABLE_CROSS_REGION,
        requestsPerMinute: ENABLE_CROSS_REGION ? 
          config.requestsPerMinute * config.crossRegionMultiplier : 
          config.requestsPerMinute,
        nextRequestInMs: nextRequestIn,
        nextRequestInSeconds: Math.ceil(nextRequestIn / 1000),
        lastRequestTime: new Date(lastRequestTime).toISOString()
      })
    };
  }

  // Default response for unknown paths
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not found' })
  };
};

/**
 * Invoke Bedrock Agent with rate limiting
 */
async function invokeBedrockAgent(text, sessionId, agentId, agentAliasId, enableTrace) {
  console.log(`🤖 Invoking Bedrock Agent: ${agentId || 'IBQRX8MZJJ'}`);
  console.log(`💬 Input: "${text}"`);
  console.log(`🔗 Session: ${sessionId}`);

  const command = new InvokeAgentCommand({
    agentId: agentId || 'IBQRX8MZJJ', // Default to business strategy agent
    agentAliasId: agentAliasId || 'TSTALIASID',
    sessionId: sessionId,
    inputText: text,
    enableTrace: enableTrace || false
  });

  const response = await agentClient.send(command);
  
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

  console.log(`✅ Agent Response: ${fullResponse.substring(0, 200)}...`);

  const result = {
    response: fullResponse,
    sessionId: sessionId,
    agentId: agentId || 'IBQRX8MZJJ',
    model: 'bedrock-agent',
    timestamp: new Date().toISOString()
  };

  if (enableTrace && traces.length > 0) {
    result.traces = traces;
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(result)
  };
}

/**
 * Invoke Claude model directly with rate limiting and cross-region support
 */
async function invokeDirectModel(text, sessionId, enableTrace) {
  const config = MODEL_CONFIGS[CURRENT_MODEL];
  
  console.log(`🤖 Invoking ${CURRENT_MODEL} directly: ${config.modelId}`);
  console.log(`💬 Input: "${text}"`);
  console.log(`🌍 Cross-region: ${ENABLE_CROSS_REGION}`);

  // Prepare the request body for Claude
  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.9,
    messages: [
      {
        role: "user",
        content: text
      }
    ]
  };

  const command = new InvokeModelCommand({
    modelId: config.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(requestBody)
  });

  // Add cross-region inference configuration if enabled
  if (ENABLE_CROSS_REGION) {
    command.input.inferenceConfig = {
      crossRegionInferenceEnabled: true
    };
  }

  const response = await bedrockClient.send(command);
  
  // Parse the response
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const fullResponse = responseBody.content[0].text;

  console.log(`✅ Direct Model Response: ${fullResponse.substring(0, 200)}...`);

  const result = {
    response: fullResponse,
    sessionId: sessionId,
    model: CURRENT_MODEL,
    modelId: config.modelId,
    crossRegion: ENABLE_CROSS_REGION,
    usage: responseBody.usage,
    timestamp: new Date().toISOString()
  };

  if (enableTrace) {
    result.requestBody = requestBody;
    result.responseMetadata = {
      inputTokens: responseBody.usage?.input_tokens,
      outputTokens: responseBody.usage?.output_tokens,
      stopReason: responseBody.stop_reason
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(result)
  };
}