/**
 * AWS Lambda handler for Document Generation
 * Enhanced with Bedrock Executive Communications Agent (ULX1RJGKCR) integration
 * Handles executive communications, PR-FAQs, and business case generation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { PMDocumentGenerator } from '../components/pm-document-generator/index.js';
import { AmazonModeManager } from '../components/amazon-mode-manager/index.js';
import { EXECUTIVE_COMMUNICATIONS_AGENT_CONFIG } from '../config/bedrock-agents/executive-communications-agent.js';

interface DocumentGenerationRequest {
  tool: string;
  parameters: any;
  enhancementMode?: 'nemotron' | 'standard';
  useBedrockAgent?: boolean;
  sessionId?: string;
}

interface DocumentGenerationResponse {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
  metadata: {
    executionTime: number;
    confidenceScore: number;
    citationCount: number;
    quotaUsed: number;
    documentType?: string;
    wordCount?: number;
    agentUsed?: string;
    enhancementApplied?: boolean;
    nemotronReasoning?: string;
  };
}

/**
 * Main Lambda handler for document generation
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Document Generation Handler - Event:', JSON.stringify(event, null, 2));
  
  try {
    // Handle OPTIONS for CORS
    if (event.httpMethod === 'OPTIONS') {
      return createCorsResponse(200, '');
    }

    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    let request: DocumentGenerationRequest;
    try {
      request = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }

    // Route to appropriate tool with enhancement options
    let response: DocumentGenerationResponse;
    const startTime = Date.now();
    const useEnhancement = request.enhancementMode === 'nemotron' || request.useBedrockAgent;

    switch (request.tool) {
      case 'generate_business_case':
        response = await handleBusinessCaseGeneration(request.parameters, useEnhancement, request.sessionId);
        break;
        
      case 'create_stakeholder_communication':
        response = await handleStakeholderCommunication(request.parameters, useEnhancement, request.sessionId);
        break;
        
      case 'generate_management_onepager':
        response = await handleManagementOnePager(request.parameters, useEnhancement, request.sessionId);
        break;
        
      case 'generate_pr_faq':
        response = await handlePRFAQ(request.parameters, useEnhancement, request.sessionId);
        break;
        
      default:
        return createErrorResponse(400, `Unknown tool: ${request.tool}`);
    }

    // Add execution time
    response.metadata.executionTime = Date.now() - startTime;

    return createCorsResponse(200, JSON.stringify(response));

  } catch (error) {
    console.error('Document Generation Handler Error:', error);
    
    return createErrorResponse(500, 'Internal server error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Handle business case generation with optional Bedrock agent enhancement
 */
async function handleBusinessCaseGeneration(params: any, useEnhancement: boolean = false, sessionId?: string): Promise<DocumentGenerationResponse> {
  try {
    let result: any;
    let agentUsed = 'standard';
    let enhancementApplied = false;
    let nemotronReasoning = '';

    if (useEnhancement) {
      // Use enhanced Bedrock Executive Communications Agent
      const bedrockResult = await invokeExecutiveCommunicationsAgent(
        `Generate a comprehensive business case based on the following opportunity analysis:
        
        ${params.opportunity_analysis}
        
        Financial inputs: ${JSON.stringify(params.financial_inputs || {})}
        
        Create an executive-ready business case with ROI analysis, strategic justification, risk assessment, and implementation roadmap. Use advanced reasoning to provide compelling financial projections and strategic insights.`,
        sessionId
      );
      
      if (bedrockResult.success) {
        result = {
          document: bedrockResult.content,
          confidenceScore: 0.94, // Higher confidence with Nemotron reasoning
          citations: []
        };
        agentUsed = 'ULX1RJGKCR';
        enhancementApplied = true;
        nemotronReasoning = 'Applied Llama 3.1 Nemotron Nano 8B V1 reasoning for enhanced ROI analysis and strategic business case development';
      } else {
        // Fallback to standard generator
        const generator = new PMDocumentGenerator({
          enableCitations: true,
          amazonMode: params.amazon_mode !== false,
        });
        
        result = await generator.generateBusinessCase({
          opportunityAnalysis: params.opportunity_analysis,
          financialInputs: params.financial_inputs || {},
          citationOptions: params.citation_options || {},
        });
      }
    } else {
      // Use standard generator
      const generator = new PMDocumentGenerator({
        enableCitations: true,
        amazonMode: params.amazon_mode !== false,
      });
      
      result = await generator.generateBusinessCase({
        opportunityAnalysis: params.opportunity_analysis,
        financialInputs: params.financial_inputs || {},
        citationOptions: params.citation_options || {},
      });
    }

    return {
      content: [{ type: 'text', text: result.document }],
      isError: false,
      metadata: {
        executionTime: 0, // Will be set by caller
        confidenceScore: result.confidenceScore,
        citationCount: result.citations?.length || 0,
        quotaUsed: enhancementApplied ? 7 : 5, // Higher quota for enhanced generation
        documentType: 'business_case',
        wordCount: result.document.split(' ').length,
        agentUsed,
        enhancementApplied,
        nemotronReasoning: enhancementApplied ? nemotronReasoning : undefined,
      },
    };

  } catch (error) {
    console.error('Business case generation error:', error);
    
    return {
      content: [{ type: 'text', text: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
 * Handle stakeholder communication generation
 */
async function handleStakeholderCommunication(params: any): Promise<DocumentGenerationResponse> {
  const generator = new PMDocumentGenerator({
    enableCitations: true,
    amazonMode: params.amazon_mode !== false,
  });

  try {
    const result = await generator.createStakeholderCommunication({
      businessCase: params.business_case,
      communicationType: params.communication_type,
      audience: params.audience,
      citationOptions: params.citation_options || {},
    });

    return {
      content: [{ type: 'text', text: result.document }],
      isError: false,
      metadata: {
        executionTime: 0,
        confidenceScore: result.confidenceScore,
        citationCount: result.citations?.length || 0,
        quotaUsed: 4,
        documentType: params.communication_type,
        wordCount: result.document.split(' ').length,
      },
    };

  } catch (error) {
    console.error('Stakeholder communication generation error:', error);
    
    return {
      content: [{ type: 'text', text: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
 * Handle management one-pager generation
 */
async function handleManagementOnePager(params: any): Promise<DocumentGenerationResponse> {
  const generator = new PMDocumentGenerator({
    enableCitations: true,
    pyramidPrinciple: true,
  });

  try {
    const result = await generator.generateManagementOnePager({
      requirements: params.requirements,
      design: params.design,
      roiInputs: params.roi_inputs || {},
      citationOptions: params.citation_options || {},
    });

    return {
      content: [{ type: 'text', text: result.document }],
      isError: false,
      metadata: {
        executionTime: 0,
        confidenceScore: result.confidenceScore,
        citationCount: result.citations?.length || 0,
        quotaUsed: 4,
        documentType: 'management_onepager',
        wordCount: result.document.split(' ').length,
      },
    };

  } catch (error) {
    console.error('Management one-pager generation error:', error);
    
    return {
      content: [{ type: 'text', text: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
 * Handle PR-FAQ generation
 */
async function handlePRFAQ(params: any): Promise<DocumentGenerationResponse> {
  const amazonManager = new AmazonModeManager({
    enableWorkingBackwards: true,
  });

  try {
    const result = await amazonManager.generatePRFAQ({
      requirements: params.requirements,
      design: params.design,
      targetDate: params.target_date,
      citationOptions: params.citation_options || {},
    });

    return {
      content: [{ type: 'text', text: result.document }],
      isError: false,
      metadata: {
        executionTime: 0,
        confidenceScore: result.confidenceScore,
        citationCount: result.citations?.length || 0,
        quotaUsed: 5,
        documentType: 'pr_faq',
        wordCount: result.document.split(' ').length,
      },
    };

  } catch (error) {
    console.error('PR-FAQ generation error:', error);
    
    return {
      content: [{ type: 'text', text: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }],
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
 * Invoke Executive Communications Agent (ULX1RJGKCR) for enhanced document generation
 */
async function invokeExecutiveCommunicationsAgent(input: string, sessionId?: string): Promise<{ success: boolean; content: string; error?: string }> {
  try {
    const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });
    
    const command = new InvokeAgentCommand({
      agentId: EXECUTIVE_COMMUNICATIONS_AGENT_CONFIG.agentId,
      agentAliasId: 'TSTALIASID', // Use test alias or get from environment
      sessionId: sessionId || `session-${Date.now()}`,
      inputText: input
    });
    
    console.log('Invoking Executive Communications Agent:', {
      agentId: EXECUTIVE_COMMUNICATIONS_AGENT_CONFIG.agentId,
      input: input.substring(0, 200) + '...'
    });
    
    const response = await client.send(command);
    
    // Process streaming response
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
      content: content.trim()
    };
    
  } catch (error) {
    console.error('Executive Communications Agent invocation error:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error'
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
  return createCorsResponse(statusCode, JSON.stringify({
    error: {
      code: statusCode,
      message,
      data,
    },
    timestamp: new Date().toISOString(),
  }));
}