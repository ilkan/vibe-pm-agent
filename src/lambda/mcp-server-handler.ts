/**
 * AWS Lambda handler for MCP Server
 * Provides HTTP interface for MCP protocol communication
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Import MCP tools
import { analyzeBusinessOpportunity } from '../mcp/tools/analyze_business_opportunity.js';
import { generateBusinessCase } from '../mcp/tools/generate_business_case.js';
import { createStakeholderCommunication } from '../mcp/tools/create_stakeholder_communication.js';
import { assessStrategicAlignment } from '../mcp/tools/assess_strategic_alignment.js';
import { validateMarketTiming } from '../mcp/tools/validate_market_timing.js';
import { optimizeResourceAllocation } from '../mcp/tools/optimize_resource_allocation.js';

interface MCPRequest {
  method: string;
  params: any;
  id?: string | number;
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string | number;
}

// Enhanced tool registry with Bedrock agent integration
const TOOLS = {
  // Business Strategy Agent tools
  'analyze_business_opportunity': analyzeBusinessOpportunity,
  'assess_strategic_alignment': assessStrategicAlignment,
  'validate_market_timing': validateMarketTiming,
  
  // Executive Communications Agent tools
  'generate_business_case': generateBusinessCase,
  'create_stakeholder_communication': createStakeholderCommunication,
  
  // Product Development Agent tools
  'optimize_resource_allocation': optimizeResourceAllocation,
  
  // Supervisor Agent tools (placeholders - would route to actual agent invocations)
  'invoke_business_strategy_agent': analyzeBusinessOpportunity, // Placeholder
  'invoke_product_development_agent': optimizeResourceAllocation, // Placeholder
  'invoke_executive_communications_agent': generateBusinessCase, // Placeholder
  'invoke_case_study_coaching_agent': assessStrategicAlignment, // Placeholder
  'invoke_citation_agent': analyzeBusinessOpportunity, // Placeholder
  
  // Citation Agent tools (placeholders)
  'validate_citations': analyzeBusinessOpportunity, // Placeholder
  'source_citations': analyzeBusinessOpportunity, // Placeholder
  'assess_credibility': analyzeBusinessOpportunity, // Placeholder
};

/**
 * Main Lambda handler for MCP server
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('MCP Server Handler - Event:', JSON.stringify(event, null, 2));
  
  try {
    // Handle health check
    if (event.httpMethod === 'GET' && event.path === '/mcp/health') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify({
          status: 'healthy',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          tools: Object.keys(TOOLS),
        }),
      };
    }

    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: '',
      };
    }

    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    let mcpRequest: MCPRequest;
    try {
      mcpRequest = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    // Handle different MCP methods
    let response: MCPResponse;
    
    switch (mcpRequest.method) {
      case 'tools/list':
        response = await handleListTools(mcpRequest);
        break;
        
      case 'tools/call':
        response = await handleCallTool(mcpRequest);
        break;
        
      default:
        response = {
          error: {
            code: -32601,
            message: `Method not found: ${mcpRequest.method}`,
          },
          id: mcpRequest.id,
        };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('MCP Server Handler Error:', error);
    
    return createErrorResponse(500, 'Internal server error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
};

/**
 * Handle tools/list method
 */
async function handleListTools(request: MCPRequest): Promise<MCPResponse> {
  const tools = [
    {
      name: 'analyze_business_opportunity',
      description: 'Analyzes market opportunity, timing, and business justification for a feature idea',
      inputSchema: {
        type: 'object',
        properties: {
          idea: {
            type: 'string',
            description: 'Raw feature idea or business need to analyze',
          },
          market_context: {
            type: 'object',
            description: 'Market and business context for the analysis',
          },
        },
        required: ['idea'],
      },
    },
    {
      name: 'generate_business_case',
      description: 'Creates comprehensive business case with ROI analysis and risk assessment',
      inputSchema: {
        type: 'object',
        properties: {
          opportunity_analysis: {
            type: 'string',
            description: 'Business opportunity analysis from analyze_business_opportunity',
          },
          financial_inputs: {
            type: 'object',
            description: 'Optional financial inputs for ROI calculations',
          },
        },
        required: ['opportunity_analysis'],
      },
    },
    {
      name: 'create_stakeholder_communication',
      description: 'Generates executive one-pagers, PR-FAQs, and stakeholder presentations',
      inputSchema: {
        type: 'object',
        properties: {
          business_case: {
            type: 'string',
            description: 'Business case analysis from generate_business_case',
          },
          communication_type: {
            type: 'string',
            enum: ['executive_onepager', 'pr_faq', 'board_presentation', 'team_announcement'],
          },
          audience: {
            type: 'string',
            enum: ['executives', 'board', 'engineering_team', 'customers', 'investors'],
          },
        },
        required: ['business_case', 'communication_type', 'audience'],
      },
    },
    // Add other tools...
  ];

  return {
    result: { tools },
    id: request.id,
  };
}

/**
 * Handle tools/call method
 */
async function handleCallTool(request: MCPRequest): Promise<MCPResponse> {
  try {
    // Validate request structure
    const callRequest = CallToolRequestSchema.parse(request);
    const { name, arguments: args } = callRequest.params;

    // Check if tool exists
    const toolHandler = TOOLS[name as keyof typeof TOOLS];
    if (!toolHandler) {
      return {
        error: {
          code: -32602,
          message: `Unknown tool: ${name}`,
        },
        id: request.id,
      };
    }

    // Execute tool
    const startTime = Date.now();
    const result = await toolHandler(args as any);
    const executionTime = Date.now() - startTime;

    // Add execution metadata
    const response = {
      content: result.content || [{ type: 'text', text: result.text || 'No content' }],
      isError: result.isError || false,
      metadata: {
        executionTime,
        quotaUsed: result.quotaUsed || 1,
        confidenceScore: result.confidenceScore || 0,
        citationCount: result.citationCount || 0,
        ...result.metadata,
      },
    };

    return {
      result: response,
      id: request.id,
    };

  } catch (error) {
    console.error('Tool execution error:', error);
    
    return {
      error: {
        code: -32603,
        message: 'Tool execution failed',
        data: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      id: request.id,
    };
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  data?: any
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: JSON.stringify({
      error: {
        code: statusCode,
        message,
        data,
      },
      timestamp: new Date().toISOString(),
    }),
  };
}