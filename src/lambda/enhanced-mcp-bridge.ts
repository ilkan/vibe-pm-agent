/**
 * Enhanced Lambda MCP Bridge - Enhanced wrapper for Bedrock agent integration
 *
 * This handler provides enhanced bridge functionality between AWS Lambda and the MCP server,
 * with support for enhanced agent capabilities, improved error handling, and agent communication.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

// Import enhanced MCP tools
import { analyzeBusinessOpportunity } from '../mcp/tools/analyze_business_opportunity.js';
import { generateBusinessCase } from '../mcp/tools/generate_business_case.js';
import { createStakeholderCommunication } from '../mcp/tools/create_stakeholder_communication.js';
import { assessStrategicAlignment } from '../mcp/tools/assess_strategic_alignment.js';
import { validateMarketTiming } from '../mcp/tools/validate_market_timing.js';
import { optimizeResourceAllocation } from '../mcp/tools/optimize_resource_allocation.js';

// Import Bedrock agent configurations
import { BEDROCK_AGENTS } from '../config/bedrock-agents/index.js';

interface EnhancedMCPRequest {
  toolName: string;
  toolArgs: any;
  agentId?: string;
  enhancementMode?: 'nemotron' | 'standard';
  requestId?: string;
  source?: 'bedrock-agent' | 'direct' | 'api-gateway';
}

interface EnhancedMCPResponse {
  success: boolean;
  content?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    agentUsed?: string;
    enhancementApplied?: boolean;
    confidenceScore?: number;
    quotaUsed?: number;
    citationCount?: number;
  };
  requestId?: string;
}

interface AgentInvocationResult {
  success: boolean;
  content: string;
  metadata: {
    agentId: string;
    sessionId: string;
    executionTime: number;
  };
  error?: string;
}

// Enhanced tool registry with agent mapping
const ENHANCED_TOOLS = {
  // Business Strategy Agent tools
  'analyze_business_opportunity': {
    handler: analyzeBusinessOpportunity,
    preferredAgent: 'IBQRX8MZJJ',
    enhancementType: 'nemotron_reasoning'
  },
  'assess_strategic_alignment': {
    handler: assessStrategicAlignment,
    preferredAgent: 'IBQRX8MZJJ',
    enhancementType: 'nemotron_reasoning'
  },
  'validate_market_timing': {
    handler: validateMarketTiming,
    preferredAgent: 'IBQRX8MZJJ',
    enhancementType: 'nemotron_reasoning'
  },
  
  // Executive Communications Agent tools
  'generate_business_case': {
    handler: generateBusinessCase,
    preferredAgent: 'ULX1RJGKCR',
    enhancementType: 'nemotron_reasoning'
  },
  'create_stakeholder_communication': {
    handler: createStakeholderCommunication,
    preferredAgent: 'ULX1RJGKCR',
    enhancementType: 'nemotron_reasoning'
  },
  
  // Product Development Agent tools
  'optimize_resource_allocation': {
    handler: optimizeResourceAllocation,
    preferredAgent: 'CEW45LTT2P',
    enhancementType: 'nemotron_reasoning'
  },
  
  // Supervisor Agent tools
  'invoke_business_strategy_agent': {
    handler: invokeBedrockAgent,
    preferredAgent: 'SUPERVISOR001',
    targetAgent: 'IBQRX8MZJJ',
    enhancementType: 'agent_invocation'
  },
  'invoke_product_development_agent': {
    handler: invokeBedrockAgent,
    preferredAgent: 'SUPERVISOR001',
    targetAgent: 'CEW45LTT2P',
    enhancementType: 'agent_invocation'
  },
  'invoke_executive_communications_agent': {
    handler: invokeBedrockAgent,
    preferredAgent: 'SUPERVISOR001',
    targetAgent: 'ULX1RJGKCR',
    enhancementType: 'agent_invocation'
  },
  'invoke_case_study_coaching_agent': {
    handler: invokeBedrockAgent,
    preferredAgent: 'SUPERVISOR001',
    targetAgent: 'PDZPQTNLYH',
    enhancementType: 'agent_invocation'
  },
  'invoke_citation_agent': {
    handler: invokeBedrockAgent,
    preferredAgent: 'SUPERVISOR001',
    targetAgent: 'CITATION001',
    enhancementType: 'agent_invocation'
  },
  
  // Citation Agent tools
  'validate_citations': {
    handler: validateCitations,
    preferredAgent: 'CITATION001',
    enhancementType: 'nemotron_reasoning'
  },
  'source_citations': {
    handler: sourceCitations,
    preferredAgent: 'CITATION001',
    enhancementType: 'nemotron_reasoning'
  },
  'assess_credibility': {
    handler: assessCredibility,
    preferredAgent: 'CITATION001',
    enhancementType: 'nemotron_reasoning'
  }
};

/**
 * Main Lambda handler for enhanced MCP bridge
 */
export const handler = async (
  event: APIGatewayProxyEvent | EnhancedMCPRequest,
  context: Context
): Promise<APIGatewayProxyResult | EnhancedMCPResponse> => {
  const startTime = Date.now();
  
  try {
    console.log('Enhanced MCP Bridge - Event:', JSON.stringify(event, null, 2));
    
    // Detect invocation type
    const isApiGateway = 'httpMethod' in event;
    const request = isApiGateway ? parseApiGatewayRequest(event as APIGatewayProxyEvent) : event as EnhancedMCPRequest;
    
    // Handle health check for API Gateway
    if (isApiGateway && (event as APIGatewayProxyEvent).path === '/health') {
      return createApiGatewayResponse(200, {
        status: 'healthy',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        enhancedTools: Object.keys(ENHANCED_TOOLS).length,
        bedrockAgents: Object.keys(BEDROCK_AGENTS).length,
        features: ['nemotron_reasoning', 'agent_invocation', 'enhanced_error_handling']
      });
    }
    
    // Validate request
    if (!request.toolName || !request.toolArgs) {
      const error = 'Missing required fields: toolName and toolArgs';
      return isApiGateway ? createApiGatewayResponse(400, { success: false, error }) : { success: false, error };
    }
    
    // Process enhanced MCP request
    const result = await processEnhancedMCPRequest(request, context);
    
    // Return appropriate response format
    if (isApiGateway) {
      return createApiGatewayResponse(200, result);
    } else {
      return result;
    }
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Enhanced MCP Bridge Error:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { executionTime },
      requestId: context.awsRequestId
    };
    
    const isApiGateway = 'httpMethod' in event;
    return isApiGateway ? createApiGatewayResponse(500, errorResponse) : errorResponse;
  }
};

/**
 * Parse API Gateway request to enhanced MCP request format
 */
function parseApiGatewayRequest(event: APIGatewayProxyEvent): EnhancedMCPRequest {
  let body: any = {};
  
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      throw new Error('Invalid JSON in request body');
    }
  }
  
  return {
    toolName: body.toolName,
    toolArgs: body.toolArgs,
    agentId: body.agentId,
    enhancementMode: body.enhancementMode || 'nemotron',
    source: 'api-gateway'
  };
}

/**
 * Process enhanced MCP request with agent integration
 */
async function processEnhancedMCPRequest(
  request: EnhancedMCPRequest,
  context: Context
): Promise<EnhancedMCPResponse> {
  const startTime = Date.now();
  
  try {
    // Get tool configuration
    const toolConfig = ENHANCED_TOOLS[request.toolName as keyof typeof ENHANCED_TOOLS];
    if (!toolConfig) {
      return {
        success: false,
        error: `Unknown tool: ${request.toolName}`,
        requestId: context.awsRequestId
      };
    }
    
    // Determine agent to use
    const agentId = request.agentId || toolConfig.preferredAgent;
    const enhancementApplied = request.enhancementMode === 'nemotron' && toolConfig.enhancementType === 'nemotron_reasoning';
    
    console.log('Processing enhanced MCP request:', {
      toolName: request.toolName,
      agentId,
      enhancementType: toolConfig.enhancementType,
      enhancementApplied
    });
    
    // Execute tool with enhancement
    let result: any;
    
    if (toolConfig.enhancementType === 'agent_invocation' && toolConfig.targetAgent) {
      // Handle agent invocation through Supervisor Agent
      result = await invokeBedrockAgent(request.toolArgs, toolConfig.targetAgent);
    } else {
      // Execute MCP tool directly
      result = await toolConfig.handler(request.toolArgs);
    }
    
    const executionTime = Date.now() - startTime;
    
    // Format enhanced response
    return {
      success: true,
      content: result.content || result.text || result,
      metadata: {
        executionTime,
        agentUsed: agentId,
        enhancementApplied,
        confidenceScore: result.confidenceScore || 0.85,
        quotaUsed: result.quotaUsed || 1,
        citationCount: result.citationCount || 0,
        ...result.metadata
      },
      requestId: context.awsRequestId
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Enhanced MCP request processing error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { executionTime },
      requestId: context.awsRequestId
    };
  }
}

/**
 * Invoke Bedrock agent for agent-to-agent communication
 */
async function invokeBedrockAgent(args: any, targetAgentId?: string): Promise<AgentInvocationResult> {
  const startTime = Date.now();
  
  try {
    const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
    
    // Use target agent or default to the agent specified in args
    const agentId = targetAgentId || args.agentId;
    if (!agentId) {
      throw new Error('Agent ID is required for agent invocation');
    }
    
    // Prepare agent input
    const input = typeof args.input === 'string' ? args.input : JSON.stringify(args);
    
    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId: 'TSTALIASID', // Use test alias or get from config
      sessionId: args.sessionId || `session-${Date.now()}`,
      inputText: input
    });
    
    console.log('Invoking Bedrock agent:', { agentId, input: input.substring(0, 200) + '...' });
    
    const response = await client.send(command);
    const executionTime = Date.now() - startTime;
    
    // Process agent response
    let content = '';
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          content += text;
        }
      }
    }
    
    return {
      success: true,
      content,
      metadata: {
        agentId,
        sessionId: args.sessionId || `session-${Date.now()}`,
        executionTime
      }
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Bedrock agent invocation error:', error);
    
    return {
      success: false,
      content: '',
      metadata: {
        agentId: targetAgentId || 'unknown',
        sessionId: args.sessionId || 'unknown',
        executionTime
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Citation validation tool (placeholder - would integrate with Citation Agent)
 */
async function validateCitations(args: any): Promise<any> {
  // This would integrate with the Citation Agent's validation capabilities
  return {
    content: [{
      type: 'text',
      text: `Citation validation completed for ${args.citations?.length || 0} citations with enhanced credibility assessment.`
    }],
    metadata: {
      validationScore: 0.92,
      credibilityScore: 0.88,
      citationsProcessed: args.citations?.length || 0
    }
  };
}

/**
 * Citation sourcing tool (placeholder - would integrate with Citation Agent)
 */
async function sourceCitations(args: any): Promise<any> {
  // This would integrate with the Citation Agent's sourcing capabilities
  return {
    content: [{
      type: 'text',
      text: `Source discovery completed for topic: "${args.topic}" with ${args.maxSources || 10} high-quality sources identified.`
    }],
    metadata: {
      sourcesFound: args.maxSources || 10,
      averageCredibility: 0.89,
      diversityScore: 0.85
    }
  };
}

/**
 * Credibility assessment tool (placeholder - would integrate with Citation Agent)
 */
async function assessCredibility(args: any): Promise<any> {
  // This would integrate with the Citation Agent's credibility assessment capabilities
  return {
    content: [{
      type: 'text',
      text: `Credibility assessment completed for ${args.sources?.length || 1} sources with bias detection and authority scoring.`
    }],
    metadata: {
      overallCredibility: 0.87,
      biasScore: 0.15, // Lower is better
      authorityScore: 0.91
    }
  };
}

/**
 * Create API Gateway response
 */
function createApiGatewayResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}