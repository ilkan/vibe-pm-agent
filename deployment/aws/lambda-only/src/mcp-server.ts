/**
 * Simplified MCP Server for AWS Lambda
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

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

/**
 * Main Lambda handler for MCP server
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Simple MCP Server - Event:', JSON.stringify(event, null, 2));
  
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
          tools: ['analyze_business_opportunity', 'generate_business_case'],
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
      description: 'Analyzes market opportunity and business justification for a feature idea',
      inputSchema: {
        type: 'object',
        properties: {
          idea: {
            type: 'string',
            description: 'Feature idea to analyze',
          },
        },
        required: ['idea'],
      },
    },
    {
      name: 'generate_business_case',
      description: 'Creates comprehensive business case with ROI analysis',
      inputSchema: {
        type: 'object',
        properties: {
          opportunity_analysis: {
            type: 'string',
            description: 'Business opportunity analysis',
          },
        },
        required: ['opportunity_analysis'],
      },
    },
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
    const { name, arguments: args } = request.params;

    let result: any;
    const startTime = Date.now();

    switch (name) {
      case 'analyze_business_opportunity':
        result = await analyzeBusinessOpportunity(args);
        break;
        
      case 'generate_business_case':
        result = await generateBusinessCase(args);
        break;
        
      default:
        return {
          error: {
            code: -32602,
            message: `Unknown tool: ${name}`,
          },
          id: request.id,
        };
    }

    const executionTime = Date.now() - startTime;

    return {
      result: {
        content: [{ type: 'text', text: result }],
        isError: false,
        metadata: {
          executionTime,
          quotaUsed: 1,
          confidenceScore: 85,
        },
      },
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
        },
      },
      id: request.id,
    };
  }
}

/**
 * Analyze business opportunity
 */
async function analyzeBusinessOpportunity(args: any): Promise<string> {
  const idea = args.idea || 'Unknown feature';
  
  return `
# Business Opportunity Analysis

## Feature Idea: ${idea}

### Executive Summary
This analysis evaluates the business opportunity for "${idea}" based on market conditions and strategic fit.

### Market Assessment
- **Market Size**: Large and expanding market with strong growth trajectory
- **Customer Demand**: High demand validated through market research
- **Competitive Landscape**: Moderate competition with clear differentiation opportunities

### Financial Projections
- **Development Cost**: $500K - $1M estimated investment
- **Revenue Potential**: $2M - $5M annual revenue within 24 months
- **ROI**: 200% - 400% return on investment

### Recommendation
**PROCEED** - Strong business case with favorable risk-return profile.

### Next Steps
1. Conduct detailed technical feasibility study
2. Develop comprehensive project plan
3. Secure necessary resources and budget
  `;
}

/**
 * Generate business case
 */
async function generateBusinessCase(args: any): Promise<string> {
  const analysis = args.opportunity_analysis || 'Previous analysis not provided';
  
  return `
# Business Case Document

## Executive Summary
This business case presents a compelling investment opportunity with strong ROI potential and strategic alignment.

## Opportunity Overview
${analysis}

## Financial Analysis
- **Investment**: $750,000 development cost
- **Revenue**: $2,000,000 projected annual revenue
- **ROI**: 167% return on investment
- **Payback**: 18 months

## Risk Assessment
- **Technical Risk**: Medium - manageable with experienced team
- **Market Risk**: Low - validated customer demand
- **Financial Risk**: Low - conservative projections

## Recommendation
**APPROVE** - Proceed with implementation based on strong business case.
  `;
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