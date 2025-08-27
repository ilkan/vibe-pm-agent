// MCP Server implementation with protocol handling

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { AIAgentPipeline } from '../pipeline';
import { 
  MCPServerConfig,
  MCPToolResult,
  MCPError,
  MCPErrorCode,
  MCPServerStatus,
  MCPServerOptions,
  MCPToolContext,
  OptimizeIntentArgs,
  AnalyzeWorkflowArgs,
  GenerateROIArgs,
  ConsultingSummaryArgs,
  LogLevel
} from '../models/mcp';
import { MCP_SERVER_CONFIG, MCPToolRegistry } from './server-config';
import { MCPErrorHandler, MCPResponseFormatter, MCPLogger } from '../utils/mcp-error-handling';

/**
 * PM Agent MCP Server implementation
 */
export class PMAgentMCPServer {
  private server: Server;
  private pipeline: AIAgentPipeline;
  private toolRegistry: MCPToolRegistry;
  private status: MCPServerStatus;
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];

  constructor(options: MCPServerOptions = {}) {
    this.pipeline = new AIAgentPipeline();
    this.toolRegistry = MCPToolRegistry.createDefault();
    this.startTime = Date.now();
    
    // Configure logging level
    if (options.enableLogging !== false) {
      MCPLogger.setLogLevel(LogLevel.INFO);
    }
    
    this.status = {
      status: 'healthy',
      uptime: 0,
      toolsRegistered: this.toolRegistry.getAllTools().length,
      performance: {
        averageResponseTime: 0,
        totalRequests: 0,
        errorRate: 0
      }
    };

    // Initialize MCP Server
    this.server = new Server(
      {
        name: MCP_SERVER_CONFIG.name,
        version: MCP_SERVER_CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupServerHandlers();
    
    MCPLogger.info('MCP Server initialized', undefined, {
      toolsRegistered: this.toolRegistry.getAllTools().length,
      options
    });
  }

  /**
   * Setup MCP tool handlers
   */
  private setupToolHandlers(): void {
    // Register tool handlers with the MCP server
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolRegistry.getAllTools().map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();
      const context: MCPToolContext = {
        toolName: name,
        sessionId: this.generateSessionId(),
        timestamp: startTime,
        requestId: this.generateRequestId(),
        traceId: this.generateTraceId()
      };

      try {
        MCPLogger.info(`Tool call started: ${name}`, context, { args });
        
        // Validate tool exists
        const tool = this.toolRegistry.getTool(name);
        if (!tool) {
          throw MCPErrorHandler.createError(
            MCPErrorCode.TOOL_NOT_FOUND,
            `Tool '${name}' not found`,
            context,
            { availableTools: this.toolRegistry.getToolNames() }
          );
        }

        // Validate input
        const validation = this.toolRegistry.validateToolInput(name, args);
        if (!validation.valid) {
          throw MCPErrorHandler.createError(
            MCPErrorCode.VALIDATION_FAILED,
            `Invalid input: ${validation.errors?.join(', ')}`,
            context,
            { validationErrors: validation.errors, schema: tool.inputSchema }
          );
        }

        // Execute tool handler
        let result: MCPToolResult;
        switch (name) {
          case 'optimize_intent':
            result = await this.handleOptimizeIntent(args as unknown as OptimizeIntentArgs, context);
            break;
          case 'analyze_workflow':
            result = await this.handleAnalyzeWorkflow(args as unknown as AnalyzeWorkflowArgs, context);
            break;
          case 'generate_roi_analysis':
            result = await this.handleGenerateROI(args as unknown as GenerateROIArgs, context);
            break;
          case 'get_consulting_summary':
            result = await this.handleConsultingSummary(args as unknown as ConsultingSummaryArgs, context);
            break;
          default:
            throw MCPErrorHandler.createError(
              MCPErrorCode.METHOD_NOT_FOUND,
              `Tool handler for '${name}' not implemented`,
              context
            );
        }

        // Update metrics and log success
        const responseTime = Date.now() - startTime;
        this.updateMetrics(responseTime, false);
        
        MCPLogger.logToolExecution(name, context, startTime, true, undefined, {
          responseSize: JSON.stringify(result).length,
          quotaUsed: result.metadata?.quotaUsed
        });

        return {
          content: result.content,
          isError: result.isError
        };

      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.updateMetrics(responseTime, true);
        
        MCPLogger.logToolExecution(name, context, startTime, false, error as Error, {
          responseTime
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw MCPErrorHandler.createError(
          MCPErrorCode.TOOL_EXECUTION_FAILED,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          context,
          { originalError: error instanceof Error ? error.message : String(error) }
        );
      }
    });
  }

  /**
   * Setup general server handlers
   */
  private setupServerHandlers(): void {
    // Handle server errors
    this.server.onerror = (error) => {
      MCPLogger.error('MCP Server error', error, undefined, {
        serverStatus: this.status.status,
        uptime: Date.now() - this.startTime
      });
      
      this.status.status = 'degraded';
      this.status.lastError = error.message;
      
      // Attempt recovery for certain error types
      if (error.message.includes('connection') || error.message.includes('transport')) {
        MCPLogger.warn('Attempting server recovery', undefined, { errorType: 'connection' });
        // Could implement reconnection logic here
      }
    };
  }

  /**
   * Handle optimize_intent tool calls
   */
  async handleOptimizeIntent(args: OptimizeIntentArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      MCPLogger.debug('Processing intent optimization', context, { 
        intentLength: args.intent.length,
        hasParameters: !!args.parameters 
      });
      
      const result = await this.pipeline.processIntent(args.intent, args.parameters);
      
      if (!result.success) {
        MCPLogger.warn('Intent optimization failed', context, { error: result.error });
        return MCPErrorHandler.createErrorResponse(
          new Error(`Intent optimization failed: ${result.error?.message || 'Unknown error'}`),
          context
        );
      }

      MCPLogger.info('Intent optimization completed successfully', context, {
        specGenerated: !!result.enhancedKiroSpec,
        quotaSavings: result.efficiencySummary?.savings?.totalSavingsPercentage
      });

      return MCPResponseFormatter.formatSuccess(
        {
          enhancedKiroSpec: result.enhancedKiroSpec,
          efficiencySummary: result.efficiencySummary,
          metadata: {
            processingTime: Date.now() - context.timestamp,
            intentLength: args.intent.length,
            optimizationsApplied: result.enhancedKiroSpec?.metadata?.optimizationApplied?.length || 0
          }
        },
        'json',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: result.efficiencySummary?.optimizedApproach?.vibesConsumed || 0
        }
      );
    } catch (error) {
      MCPLogger.error('optimize_intent handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle analyze_workflow tool calls
   */
  async handleAnalyzeWorkflow(args: AnalyzeWorkflowArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      MCPLogger.debug('Analyzing workflow', context, { 
        workflowId: args.workflow.id,
        stepCount: args.workflow.steps.length,
        techniques: args.techniques 
      });
      
      const analysis = await this.pipeline.analyzeWorkflow(args.workflow, args.techniques);
      
      MCPLogger.info('Workflow analysis completed', context, {
        techniquesUsed: analysis.techniquesUsed?.length || 0,
        quotaSavings: analysis.totalQuotaSavings,
        complexity: analysis.implementationComplexity
      });

      return MCPResponseFormatter.formatSuccess(
        {
          analysis,
          metadata: {
            workflowComplexity: args.workflow.estimatedComplexity,
            analysisDepth: analysis.techniquesUsed?.length || 0,
            processingTime: Date.now() - context.timestamp
          }
        },
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 1 // Analysis typically uses 1 quota unit
        }
      );
    } catch (error) {
      MCPLogger.error('analyze_workflow handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle generate_roi_analysis tool calls
   */
  async handleGenerateROI(args: GenerateROIArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      MCPLogger.debug('Generating ROI analysis', context, { 
        workflowId: args.workflow.id,
        hasOptimized: !!args.optimizedWorkflow,
        hasZeroBased: !!args.zeroBasedSolution 
      });
      
      const roiAnalysis = await this.pipeline.generateROIAnalysis(
        args.workflow,
        args.optimizedWorkflow,
        args.zeroBasedSolution
      );
      
      MCPLogger.info('ROI analysis completed', context, {
        scenarioCount: roiAnalysis.scenarios?.length || 0,
        bestOption: roiAnalysis.bestOption,
        maxSavings: Math.max(...(roiAnalysis.scenarios?.map(s => s.savingsPercentage) || [0]))
      });

      return MCPResponseFormatter.formatSuccess(
        {
          roiAnalysis,
          metadata: {
            analysisType: args.zeroBasedSolution ? 'comprehensive' : 'standard',
            scenariosAnalyzed: roiAnalysis.scenarios?.length || 0,
            processingTime: Date.now() - context.timestamp
          }
        },
        'json',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 2 // ROI analysis typically uses 2 quota units
        }
      );
    } catch (error) {
      MCPLogger.error('generate_roi_analysis handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle get_consulting_summary tool calls
   */
  async handleConsultingSummary(args: ConsultingSummaryArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      MCPLogger.debug('Generating consulting summary', context, { 
        techniquesUsed: args.analysis.techniquesUsed?.length || 0,
        requestedTechniques: args.techniques?.length || 0,
        quotaSavings: args.analysis.totalQuotaSavings 
      });
      
      const summary = await this.pipeline.generateConsultingSummary(args.analysis, args.techniques);
      
      MCPLogger.info('Consulting summary completed', context, {
        recommendationCount: summary.recommendations?.length || 0,
        evidenceCount: summary.supportingEvidence?.length || 0,
        summaryLength: summary.executiveSummary?.length || 0
      });

      return MCPResponseFormatter.formatSuccess(
        {
          consultingSummary: summary,
          metadata: {
            analysisDepth: args.analysis.techniquesUsed?.length || 0,
            summaryComplexity: summary.recommendations?.length || 0,
            processingTime: Date.now() - context.timestamp
          }
        },
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 1 // Summary generation typically uses 1 quota unit
        }
      );
    } catch (error) {
      MCPLogger.error('get_consulting_summary handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.status.status = 'healthy';
      MCPLogger.info('MCP Server started successfully', undefined, {
        name: MCP_SERVER_CONFIG.name,
        version: MCP_SERVER_CONFIG.version,
        toolsRegistered: this.toolRegistry.getAllTools().length,
        startupTime: Date.now() - this.startTime
      });
      
    } catch (error) {
      this.status.status = 'unhealthy';
      this.status.lastError = error instanceof Error ? error.message : 'Unknown startup error';
      MCPLogger.fatal('Failed to start MCP Server', error as Error, undefined, {
        startupTime: Date.now() - this.startTime
      });
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    try {
      await this.server.close();
      MCPLogger.info('MCP Server stopped', undefined, {
        uptime: Date.now() - this.startTime,
        totalRequests: this.requestCount,
        errorRate: this.status.performance.errorRate
      });
    } catch (error) {
      MCPLogger.error('Error stopping MCP Server', error as Error);
      throw error;
    }
  }

  /**
   * Get server status and health information
   */
  getStatus(): MCPServerStatus {
    this.status.uptime = Date.now() - this.startTime;
    return { ...this.status };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(responseTime: number, isError: boolean): void {
    this.requestCount++;
    if (isError) {
      this.errorCount++;
    }
    
    this.responseTimes.push(responseTime);
    
    // Keep only last 100 response times for rolling average
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    this.status.performance = {
      averageResponseTime: this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length,
      totalRequests: this.requestCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
    };
  }

  /**
   * Generate unique session ID for tracking
   */
  private generateSessionId(): string {
    return `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique trace ID for distributed tracing
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}