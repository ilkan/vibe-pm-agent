const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");

const client = new BedrockAgentRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

// CORS headers for web requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Parse request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { text, sessionId, enableTrace = false } = body;

    if (!text) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: text' })
      };
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `web-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`Invoking Bedrock Agent with text: "${text}" and sessionId: "${finalSessionId}"`);

    const command = new InvokeAgentCommand({
      agentId: process.env.BEDROCK_AGENT_ID,
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID',
      sessionId: finalSessionId,
      inputText: text,
      enableTrace: enableTrace
    });

    const response = await client.send(command);
    
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
      agentId: process.env.BEDROCK_AGENT_ID,
      timestamp: new Date().toISOString()
    };

    if (enableTrace && traces.length > 0) {
      result.traces = traces;
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error invoking Bedrock Agent:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to invoke Bedrock Agent',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};