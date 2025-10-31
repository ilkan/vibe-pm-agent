/**
 * AWS Lambda handler for Business Analysis tools
 * Handles business opportunity analysis, strategic assessment, and market validation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BusinessAnalyzer } from '../components/business-analyzer/index.js';
import { MarketAnalyzer } from '../components/market-analyzer/index.js';
import { StrategicAlignmentAssessor } from '../components/strategic-alignment-assessor/index.js';

interface BusinessAnalysisRequest {
  tool: string;
  parameters: any;
}

interface BusinessAnalysisResponse {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
  metadata: {
    executionTime: number;
    confidenceScore: number;
    citationCount: number;
    quotaUsed: number;
  };
}

/**
 * Main Lambda handler for business analysis
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Business Analysis Handler - Event:', JSON.stringify(event, null, 2));
  
  try {
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
      return createCorsResponse(200, '');
    }

    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    let request: BusinessAnalysisRequest;
    try {
      request = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    // Route to appropriate tool
    let response: BusinessAnalysisResponse;
    const startTime = Date.now();

    switch (request.tool) {
      case 'analyze_business_opportunity':
        response = await handleBusinessOpportunityAnalysis(request.parameters);
        break;
        
      case 'assess_strategic_alignment':
        response = await handleStrategicAlignment(request.parameters);
        break;
        
      case 'validate_market_timing':
        response = await handleMarketTiming(request.parameters);
        break;
        
      default:
        return createErrorResponse(400, `Unknown tool: ${request.tool}`);
    }

    // Add execution time
    response.metadata.executionTime = Date.now() - startTime;

    return createCorsResponse(200, JSON.stringify(response));

  } catch (error) {
    console.error('Business Analysis Handler Error:', error);
    
    return createErrorResponse(500, 'Internal server error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Handle business opportunity analysis
 */
async function handleBusinessOpportunityAnalysis(params: any): Promise<BusinessAnalysisResponse> {
  const analyzer = new BusinessAnalyzer({
    enableCaching: true,
    cacheTimeout: 3600,
  });

  try {
    const result = await analyzer.analyzeOpportunity({
      idea: params.idea,
      marketContext: params.market_context || {},
      analysisDepth: params.analysis_depth || 'standard',
    });

    return {
      content: [{ type: 'text', text: result.analysis }],
      isError: false,
      metadata: {
        executionTime: 0, // Will be set by caller
        confidenceScore: result.confidenceScore,
        citationCount: result.citations?.length || 0,
        quotaUsed: 3,
      },
    };

  } catch (error) {
    console.error('Business opportunity analysis error:', error);
    
    return {
      content: [{ type: 'text', text: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
      metadata: {
        executionTime: 0,
        confidenceScore: 0,
        citationCount: 0,
        quotaUsed: 1,
      },
    };
  }
}

/**
 * Handle strategic alignment assessment
 */
async function handleStrategicAlignment(params: any): Promise<BusinessAnalysisResponse> {
  const assessor = new StrategicAlignmentAssessor({
    enableCaching: true,
  });

  try {
    const result = await assessor.assessAlignment({
      featureConcept: params.feature_concept,
      companyContext: params.company_context || {},
    });

    return {
      content: [{ type: 'text', text: result.assessment }],
      isError: false,
      metadata: {
        executionTime: 0,
        confidenceScore: result.alignmentScore,
        citationCount: result.citations?.length || 0,
        quotaUsed: 2,
      },
    };

  } catch (error) {
    console.error('Strategic alignment assessment error:', error);
    
    return {
      content: [{ type: 'text', text: `Assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
      metadata: {
        executionTime: 0,
        confidenceScore: 0,
        citationCount: 0,
        quotaUsed: 1,
      },
    };
  }
}

/**
 * Handle market timing validation
 */
async function handleMarketTiming(params: any): Promise<BusinessAnalysisResponse> {
  const analyzer = new MarketAnalyzer({
    enableRealTimeData: true,
  });

  try {
    const result = await analyzer.validateTiming({
      featureIdea: params.feature_idea,
      marketSignals: params.market_signals || {},
    });

    return {
      content: [{ type: 'text', text: result.analysis }],
      isError: false,
      metadata: {
        executionTime: 0,
        confidenceScore: result.confidenceScore,
        citationCount: result.citations?.length || 0,
        quotaUsed: 2,
      },
    };

  } catch (error) {
    console.error('Market timing validation error:', error);
    
    return {
      content: [{ type: 'text', text: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
      metadata: {
        executionTime: 0,
        confidenceScore: 0,
        citationCount: 0,
        quotaUsed: 1,
      },
    };
  }
}

/**
 * Create CORS-enabled response
 */
function createCorsResponse(statusCode: number, body: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body,
  };
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  data?: any
): APIGatewayProxyResult {
  return createCorsResponse(statusCode, JSON.stringify({
    error: {
      code: statusCode,
      message,
      data,
    },
    timestamp: new Date().toISOString(),
  }));
}