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
import { SteeringService } from '../components/steering-service';
import { CitationIntegration } from '../utils/citation-integration';
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
  ManagementOnePagerArgs,
  PRFAQArgs,
  RequirementsArgs,
  DesignOptionsArgs,
  TaskPlanArgs,
  ValidateIdeaQuickArgs,
  AnalyzeBusinessOpportunityArgs,
  GenerateBusinessCaseArgs,
  CreateStakeholderCommunicationArgs,
  AssessStrategicAlignmentArgs,
  OptimizeResourceAllocationArgs,
  ValidateMarketTimingArgs,
  LogLevel
} from '../models/mcp';
import { 
  CompetitiveAnalysisArgs, 
  MarketSizingArgs, 
  EnhancedBusinessOpportunityArgs 
} from '../models/competitive';
import { MCP_SERVER_CONFIG, MCPToolRegistry } from './server-config';
import { MCPErrorHandler, MCPResponseFormatter, MCPLogger } from '../utils/mcp-error-handling';

/**
 * PM Agent MCP Server implementation
 */
export class PMAgentMCPServer {
  private server: Server;
  private pipeline: AIAgentPipeline;
  private steeringService: SteeringService;
  private citationIntegration: CitationIntegration;
  private toolRegistry: MCPToolRegistry;
  private status: MCPServerStatus;
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];

  constructor(options: MCPServerOptions = {}) {
    this.pipeline = new AIAgentPipeline();
    
    // Configure steering service with test-friendly defaults if in test environment
    const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    this.steeringService = new SteeringService({
      userPreferences: {
        autoCreate: isTestEnvironment, // Auto-create in test environment
        showPreview: false, // Skip preview in tests
        showSummary: !isTestEnvironment // Only show summary in non-test environments
      }
    });
    
    this.citationIntegration = new CitationIntegration();
    
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
          case 'generate_management_onepager':
            result = await this.handleGenerateManagementOnePager(args as unknown as ManagementOnePagerArgs, context);
            break;
          case 'generate_pr_faq':
            result = await this.handleGeneratePRFAQ(args as unknown as PRFAQArgs, context);
            break;
          case 'generate_requirements':
            result = await this.handleGenerateRequirements(args as unknown as RequirementsArgs, context);
            break;
          case 'generate_design_options':
            result = await this.handleGenerateDesignOptions(args as unknown as DesignOptionsArgs, context);
            break;
          case 'generate_task_plan':
            result = await this.handleGenerateTaskPlan(args as unknown as TaskPlanArgs, context);
            break;
          case 'validate_idea_quick':
            result = await this.handleValidateIdeaQuick(args as unknown as ValidateIdeaQuickArgs, context);
            break;
          case 'analyze_competitor_landscape':
            result = await this.handleAnalyzeCompetitorLandscape(args as unknown as CompetitiveAnalysisArgs, context);
            break;
          case 'calculate_market_sizing':
            result = await this.handleCalculateMarketSizing(args as unknown as MarketSizingArgs, context);
            break;
          case 'analyze_business_opportunity':
            result = await this.handleAnalyzeBusinessOpportunity(args as unknown as EnhancedBusinessOpportunityArgs, context);
            break;
          case 'generate_business_case':
            result = await this.handleGenerateBusinessCase(args as unknown as GenerateBusinessCaseArgs, context);
            break;
          case 'create_stakeholder_communication':
            result = await this.handleCreateStakeholderCommunication(args as unknown as CreateStakeholderCommunicationArgs, context);
            break;
          case 'assess_strategic_alignment':
            result = await this.handleAssessStrategicAlignment(args as unknown as AssessStrategicAlignmentArgs, context);
            break;
          case 'optimize_resource_allocation':
            result = await this.handleOptimizeResourceAllocation(args as unknown as OptimizeResourceAllocationArgs, context);
            break;
          case 'validate_market_timing':
            result = await this.handleValidateMarketTiming(args as unknown as ValidateMarketTimingArgs, context);
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
      // Validate required arguments
      if (!args || typeof args.intent !== 'string') {
        throw new Error('Validation failed: intent is required and must be a string');
      }

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
      // Validate required arguments
      if (!args || !args.workflow || !args.workflow.id || !Array.isArray(args.workflow.steps)) {
        throw new Error('Validation failed: workflow is required with valid id and steps array');
      }

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
      // Validate required arguments
      if (!args || !args.workflow || !args.workflow.id) {
        throw new Error('Validation failed: workflow is required with valid id');
      }

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
      // Validate required arguments
      if (!args || !args.analysis) {
        throw new Error('Validation failed: analysis is required');
      }

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
   * Handle generate_management_onepager tool calls
   */
  async handleGenerateManagementOnePager(args: ManagementOnePagerArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.requirements !== 'string' || typeof args.design !== 'string') {
        throw new Error('Validation failed: requirements and design are required strings');
      }

      MCPLogger.debug('Generating management one-pager', context, { 
        requirementsLength: args.requirements.length,
        designLength: args.design.length,
        hasTasks: !!args.tasks,
        hasROIInputs: !!args.roi_inputs,
        steeringOptions: args.steering_options
      });
      
      const onePager = await this.pipeline.generateManagementOnePager(
        args.requirements, 
        args.design, 
        args.tasks, 
        args.roi_inputs
      );

      // Integrate citations if requested
      let enhancedContent = onePager.one_pager_markdown;
      let citationMetrics;
      if (args.citation_options?.include_citations !== false) {
        const citationResult = await this.citationIntegration.integrateCitations(
          'executive_onepager',
          onePager.one_pager_markdown,
          args.citation_options
        );
        enhancedContent = citationResult.enhancedContent;
        citationMetrics = citationResult.metrics;
      }
      
      MCPLogger.info('Management one-pager generated successfully', context, {
        answerLength: enhancedContent.length,
        optionsCount: 3,
        risksCount: enhancedContent.match(/Risk:/g)?.length || 0,
        citationsIncluded: citationMetrics?.total_citations || 0
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          steeringResult = await this.steeringService.createFromOnePager(
            onePager.one_pager_markdown, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        enhancedContent,
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 2, // One-pager generation typically uses 2 quota units
          steeringFileCreated: steeringResult?.created || false,
          citations: citationMetrics ? {
            total_citations: citationMetrics.total_citations,
            credibility_score: citationMetrics.credibility_score,
            recency_score: citationMetrics.recency_score,
            diversity_score: citationMetrics.diversity_score,
            bibliography_included: args.citation_options?.include_bibliography !== false
          } : undefined
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('generate_management_onepager handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle generate_pr_faq tool calls
   */
  async handleGeneratePRFAQ(args: PRFAQArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.requirements !== 'string' || typeof args.design !== 'string') {
        throw new Error('Validation failed: requirements and design are required strings');
      }

      MCPLogger.debug('Generating PR-FAQ', context, { 
        requirementsLength: args.requirements.length,
        designLength: args.design.length,
        targetDate: args.target_date,
        steeringOptions: args.steering_options
      });
      
      const prfaq = await this.pipeline.generatePRFAQ(
        args.requirements, 
        args.design, 
        args.target_date
      );
      
      MCPLogger.info('PR-FAQ generated successfully', context, {
        pressReleaseLength: prfaq.press_release_markdown.length,
        faqCount: prfaq.faq_markdown.match(/\*\*Q\d+:/g)?.length || 0,
        checklistItems: prfaq.launch_checklist_markdown.match(/- \[ \]/g)?.length || 0
      });

      const combinedContent = `# Press Release\n\n${prfaq.press_release_markdown}\n\n# FAQ\n\n${prfaq.faq_markdown}\n\n# Launch Checklist\n\n${prfaq.launch_checklist_markdown}`;

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          steeringResult = await this.steeringService.createFromPRFAQ(
            combinedContent, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        combinedContent,
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 3, // PR-FAQ generation typically uses 3 quota units
          steeringFileCreated: steeringResult?.created || false
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('generate_pr_faq handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle generate_requirements tool calls
   */
  async handleGenerateRequirements(args: RequirementsArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.raw_intent !== 'string') {
        throw new Error('Validation failed: raw_intent is required and must be a string');
      }

      MCPLogger.debug('Generating requirements', context, { 
        intentLength: args.raw_intent.length,
        hasContext: !!args.context,
        contextKeys: args.context ? Object.keys(args.context) : [],
        steeringOptions: args.steering_options
      });
      
      const requirements = await this.pipeline.generateRequirements(args.raw_intent, args.context);
      
      MCPLogger.info('Requirements generated successfully', context, {
        businessGoalLength: requirements.businessGoal.length,
        functionalRequirementsCount: requirements.functionalRequirements.length,
        mustHaveCount: requirements.priority.must.length,
        rightTimeDecision: requirements.rightTimeVerdict.decision
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          const requirementsText = JSON.stringify(requirements, null, 2);
          steeringResult = await this.steeringService.createFromRequirements(
            requirementsText, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        requirements,
        'json',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 2, // Requirements generation typically uses 2 quota units
          steeringFileCreated: steeringResult?.created || false
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('generate_requirements handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle generate_design_options tool calls
   */
  async handleGenerateDesignOptions(args: DesignOptionsArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.requirements !== 'string') {
        throw new Error('Validation failed: requirements is required and must be a string');
      }

      MCPLogger.debug('Generating design options', context, { 
        requirementsLength: args.requirements.length,
        steeringOptions: args.steering_options
      });
      
      const designOptions = await this.pipeline.generateDesignOptions(args.requirements);
      
      MCPLogger.info('Design options generated successfully', context, {
        problemFramingLength: designOptions.problemFraming.length,
        optionsCount: 3,
        matrixQuadrants: Object.keys(designOptions.impactEffortMatrix).length
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          const designText = JSON.stringify(designOptions, null, 2);
          steeringResult = await this.steeringService.createFromDesignOptions(
            designText, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        designOptions,
        'json',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 2, // Design options generation typically uses 2 quota units
          steeringFileCreated: steeringResult?.created || false
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('generate_design_options handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle generate_task_plan tool calls
   */
  async handleGenerateTaskPlan(args: TaskPlanArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.design !== 'string') {
        throw new Error('Validation failed: design is required and must be a string');
      }

      MCPLogger.debug('Generating task plan', context, { 
        designLength: args.design.length,
        hasLimits: !!args.limits,
        limits: args.limits,
        steeringOptions: args.steering_options
      });
      
      const taskPlanResult = await this.pipeline.generateTaskPlan(args.design, args.limits);
      
      MCPLogger.info('Task plan generated successfully', context, {
        immediateWinsCount: taskPlanResult.task_plan.immediateWins.length,
        shortTermCount: taskPlanResult.task_plan.shortTerm.length,
        longTermCount: taskPlanResult.task_plan.longTerm.length,
        guardrailsLimits: taskPlanResult.task_plan.guardrailsCheck.limits
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          const taskPlanText = JSON.stringify(taskPlanResult, null, 2);
          steeringResult = await this.steeringService.createFromTaskPlan(
            taskPlanText, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        taskPlanResult,
        'json',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 2, // Task plan generation typically uses 2 quota units
          steeringFileCreated: steeringResult?.created || false
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('generate_task_plan handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle validate_idea_quick tool calls
   */
  async handleValidateIdeaQuick(args: ValidateIdeaQuickArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.idea !== 'string') {
        throw new Error('Validation failed: idea is required and must be a string');
      }

      MCPLogger.debug('Starting quick idea validation', context, { 
        ideaLength: args.idea.length,
        hasContext: !!args.context,
        urgency: args.context?.urgency,
        budgetRange: args.context?.budget_range,
        teamSize: args.context?.team_size
      });
      
      const validationResult = await this.pipeline.validateIdeaQuick(args.idea, args.context);
      
      MCPLogger.info('Quick validation completed successfully', context, {
        verdict: validationResult.verdict,
        processingTime: validationResult.processingTimeMs,
        optionsCount: validationResult.options.length,
        reasoning: validationResult.reasoning.substring(0, 100) // Log first 100 chars of reasoning
      });

      // Format the response as structured text for better readability
      const formattedResponse = this.formatQuickValidationResponse(validationResult);

      return MCPResponseFormatter.formatSuccess(
        formattedResponse,
        'text',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 1 // Quick validation uses 1 quota unit
        }
      );
    } catch (error) {
      MCPLogger.error('validate_idea_quick handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Format quick validation result for better readability
   */
  private formatQuickValidationResponse(result: any): string {
    const { verdict, reasoning, options } = result;
    
    let response = `# Quick Validation Result\n\n`;
    response += `**Verdict:** ${verdict}\n`;
    response += `**Reasoning:** ${reasoning}\n\n`;
    response += `## Next Steps (Choose One)\n\n`;
    
    options.forEach((option: any, index: number) => {
      response += `### Option ${option.id}: ${option.title}\n`;
      response += `${option.description}\n\n`;
      response += `**Trade-offs:**\n`;
      option.tradeoffs.forEach((tradeoff: string) => {
        response += `- ${tradeoff}\n`;
      });
      response += `\n**Next Step:** ${option.nextStep}\n`;
      if (index < options.length - 1) {
        response += `\n---\n\n`;
      }
    });
    
    return response;
  }

  /**
   * Handle analyze_competitor_landscape tool calls
   */
  async handleAnalyzeCompetitorLandscape(args: CompetitiveAnalysisArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.feature_idea !== 'string') {
        throw new Error('Validation failed: feature_idea is required and must be a string');
      }

      MCPLogger.debug('Analyzing competitor landscape', context, { 
        featureIdeaLength: args.feature_idea.length,
        hasMarketContext: !!args.market_context,
        analysisDepth: args.analysis_depth,
        steeringOptions: args.steering_options
      });
      
      const competitorAnalysis = await this.pipeline.analyzeCompetitorLandscape(
        args.feature_idea,
        args.market_context,
        args.analysis_depth || 'standard'
      );
      
      MCPLogger.info('Competitor landscape analysis completed', context, {
        competitorsFound: competitorAnalysis.competitiveMatrix.competitors.length,
        confidenceLevel: competitorAnalysis.confidenceLevel,
        sourcesUsed: competitorAnalysis.sourceAttribution.length,
        recommendationsCount: competitorAnalysis.strategicRecommendations.length
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          const analysisText = JSON.stringify(competitorAnalysis, null, 2);
          steeringResult = await this.steeringService.createFromCompetitiveAnalysis(
            analysisText, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        competitorAnalysis,
        'json',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: (args.analysis_depth || 'standard') === 'comprehensive' ? 4 : (args.analysis_depth || 'standard') === 'standard' ? 3 : 2,
          steeringFileCreated: steeringResult?.created || false
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('analyze_competitor_landscape handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle calculate_market_sizing tool calls
   */
  async handleCalculateMarketSizing(args: MarketSizingArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.feature_idea !== 'string' || !args.market_definition || !args.market_definition.industry) {
        throw new Error('Validation failed: feature_idea and market_definition with industry are required');
      }

      MCPLogger.debug('Calculating market sizing', context, { 
        featureIdeaLength: args.feature_idea.length,
        industry: args.market_definition.industry,
        geographyCount: args.market_definition.geography?.length || 0,
        customerSegmentsCount: args.market_definition.customer_segments?.length || 0,
        sizingMethods: args.sizing_methods,
        steeringOptions: args.steering_options
      });
      
      const marketSizing = await this.pipeline.calculateMarketSizing(
        args.feature_idea,
        args.market_definition,
        args.sizing_methods
      );
      
      MCPLogger.info('Market sizing calculation completed', context, {
        tamValue: marketSizing.tam.value,
        samValue: marketSizing.sam.value,
        somValue: marketSizing.som.value,
        methodologiesUsed: marketSizing.methodology.length,
        scenariosGenerated: marketSizing.scenarios.length,
        sourcesUsed: marketSizing.sourceAttribution.length
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          const marketSizingText = JSON.stringify(marketSizing, null, 2);
          steeringResult = await this.steeringService.createFromMarketSizing(
            marketSizingText, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        marketSizing,
        'json',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: args.sizing_methods.length * 2, // Each methodology uses ~2 quota units
          steeringFileCreated: steeringResult?.created || false
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('calculate_market_sizing handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle analyze_business_opportunity tool calls
   */
  async handleAnalyzeBusinessOpportunity(args: EnhancedBusinessOpportunityArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.feature_idea !== 'string') {
        throw new Error('Validation failed: feature_idea is required and must be a string');
      }

      MCPLogger.debug('Analyzing enhanced business opportunity', context, { 
        featureIdeaLength: args.feature_idea.length,
        hasMarketContext: !!args.market_context,
        includeCompetitive: args.include_competitive_analysis !== false,
        includeMarketSizing: args.include_market_sizing !== false,
        analysisDepth: args.analysis_depth,
        steeringOptions: args.steering_options
      });
      
      const businessOpportunity = await this.pipeline.analyzeEnhancedBusinessOpportunity(
        args.feature_idea,
        args.market_context,
        args.include_competitive_analysis !== false,
        args.include_market_sizing !== false,
        args.analysis_depth || 'standard'
      );
      
      MCPLogger.info('Enhanced business opportunity analysis completed', context, {
        hasCompetitiveAnalysis: !!businessOpportunity.competitiveAnalysis,
        hasMarketSizing: !!businessOpportunity.marketSizing,
        strategicFitScore: businessOpportunity.strategicFit?.alignmentScore,
        opportunityValue: businessOpportunity.marketSizing?.som?.value
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          const opportunityText = JSON.stringify(businessOpportunity, null, 2);
          steeringResult = await this.steeringService.createFromBusinessOpportunity(
            opportunityText, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        businessOpportunity,
        'json',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: this.calculateBusinessOpportunityQuota(args),
          steeringFileCreated: steeringResult?.created || false
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('analyze_business_opportunity handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Calculate quota usage for business opportunity analysis
   */
  private calculateBusinessOpportunityQuota(args: EnhancedBusinessOpportunityArgs): number {
    let quota = 2; // Base business analysis
    
    if (args.include_competitive_analysis !== false) {
      const depth = args.analysis_depth || 'standard';
      quota += depth === 'comprehensive' ? 4 : depth === 'standard' ? 3 : 2;
    }
    
    if (args.include_market_sizing !== false) {
      quota += 4; // Default 2 methods * 2 quota each
    }
    
    return quota;
  }

  /**
   * Handle generate_business_case tool calls
   */
  async handleGenerateBusinessCase(args: GenerateBusinessCaseArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.opportunity_analysis !== 'string') {
        throw new Error('Validation failed: opportunity_analysis is required and must be a string');
      }

      MCPLogger.debug('Generating business case', context, { 
        opportunityAnalysisLength: args.opportunity_analysis.length,
        hasFinancialInputs: !!args.financial_inputs,
        citationOptions: args.citation_options,
        steeringOptions: args.steering_options
      });
      
      const businessCase = await this.pipeline.generateBusinessCase(
        args.opportunity_analysis,
        args.financial_inputs
      );

      // Integrate citations if requested
      let enhancedContent = businessCase;
      let citationMetrics;
      if (args.citation_options?.include_citations !== false) {
        const citationResult = await this.citationIntegration.integrateCitations(
          'business_case',
          businessCase,
          args.citation_options,
          args.financial_inputs?.industry
        );
        enhancedContent = citationResult.enhancedContent;
        citationMetrics = citationResult.metrics;
      }
      
      MCPLogger.info('Business case generated successfully', context, {
        contentLength: enhancedContent.length,
        citationsIncluded: citationMetrics?.total_citations || 0,
        credibilityScore: citationMetrics?.credibility_score
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          steeringResult = await this.steeringService.createFromBusinessCase(
            enhancedContent, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        enhancedContent,
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 3, // Business case generation typically uses 3 quota units
          steeringFileCreated: steeringResult?.created || false,
          citations: citationMetrics ? {
            total_citations: citationMetrics.total_citations,
            credibility_score: citationMetrics.credibility_score,
            recency_score: citationMetrics.recency_score,
            diversity_score: citationMetrics.diversity_score,
            bibliography_included: args.citation_options?.include_bibliography !== false
          } : undefined
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('generate_business_case handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle create_stakeholder_communication tool calls
   */
  async handleCreateStakeholderCommunication(args: CreateStakeholderCommunicationArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.business_case !== 'string' || !args.communication_type || !args.audience) {
        throw new Error('Validation failed: business_case, communication_type, and audience are required');
      }

      MCPLogger.debug('Creating stakeholder communication', context, { 
        businessCaseLength: args.business_case.length,
        communicationType: args.communication_type,
        audience: args.audience,
        citationOptions: args.citation_options,
        steeringOptions: args.steering_options
      });
      
      const communication = await this.pipeline.createStakeholderCommunication(
        args.business_case,
        args.communication_type,
        args.audience
      );

      // Integrate citations if requested
      let enhancedContent = communication;
      let citationMetrics;
      if (args.citation_options?.include_citations !== false) {
        const citationResult = await this.citationIntegration.integrateCitations(
          args.communication_type,
          communication,
          args.citation_options
        );
        enhancedContent = citationResult.enhancedContent;
        citationMetrics = citationResult.metrics;
      }
      
      MCPLogger.info('Stakeholder communication created successfully', context, {
        communicationType: args.communication_type,
        audience: args.audience,
        contentLength: enhancedContent.length,
        citationsIncluded: citationMetrics?.total_citations || 0
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          steeringResult = await this.steeringService.createFromStakeholderCommunication(
            enhancedContent, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        enhancedContent,
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 2, // Stakeholder communication typically uses 2 quota units
          steeringFileCreated: steeringResult?.created || false,
          citations: citationMetrics ? {
            total_citations: citationMetrics.total_citations,
            credibility_score: citationMetrics.credibility_score,
            recency_score: citationMetrics.recency_score,
            diversity_score: citationMetrics.diversity_score,
            bibliography_included: args.citation_options?.include_bibliography !== false
          } : undefined
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('create_stakeholder_communication handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle assess_strategic_alignment tool calls
   */
  async handleAssessStrategicAlignment(args: AssessStrategicAlignmentArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.feature_concept !== 'string') {
        throw new Error('Validation failed: feature_concept is required and must be a string');
      }

      MCPLogger.debug('Assessing strategic alignment', context, { 
        featureConceptLength: args.feature_concept.length,
        hasCompanyContext: !!args.company_context,
        citationOptions: args.citation_options,
        steeringOptions: args.steering_options
      });
      
      const alignment = await this.pipeline.assessStrategicAlignment(
        args.feature_concept,
        args.company_context
      );

      // Integrate citations if requested
      let enhancedContent = alignment;
      let citationMetrics;
      if (args.citation_options?.include_citations !== false) {
        const citationResult = await this.citationIntegration.integrateCitations(
          'strategic_alignment',
          alignment,
          args.citation_options
        );
        enhancedContent = citationResult.enhancedContent;
        citationMetrics = citationResult.metrics;
      }
      
      MCPLogger.info('Strategic alignment assessment completed', context, {
        contentLength: enhancedContent.length,
        citationsIncluded: citationMetrics?.total_citations || 0,
        credibilityScore: citationMetrics?.credibility_score
      });

      // Create steering file if requested
      let steeringResult;
      if (args.steering_options?.create_steering_files) {
        try {
          steeringResult = await this.steeringService.createFromStrategicAlignment(
            enhancedContent, 
            args.steering_options
          );
          
          MCPLogger.info('Steering file creation attempted', context, {
            created: steeringResult.created,
            message: steeringResult.message
          });
        } catch (steeringError) {
          MCPLogger.warn('Steering file creation failed', context, { 
            error: steeringError instanceof Error ? steeringError.message : 'Unknown error' 
          });
        }
      }

      const result = MCPResponseFormatter.formatSuccess(
        enhancedContent,
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 2, // Strategic alignment typically uses 2 quota units
          steeringFileCreated: steeringResult?.created || false,
          citations: citationMetrics ? {
            total_citations: citationMetrics.total_citations,
            credibility_score: citationMetrics.credibility_score,
            recency_score: citationMetrics.recency_score,
            diversity_score: citationMetrics.diversity_score,
            bibliography_included: args.citation_options?.include_bibliography !== false
          } : undefined
        }
      );

      // Add steering file information to metadata if created
      if (steeringResult?.created) {
        result.metadata = {
          ...result.metadata,
          steeringFiles: steeringResult.results.map(r => ({
            filename: r.filename,
            action: r.action,
            fullPath: r.fullPath
          }))
        };
      }

      return result;
    } catch (error) {
      MCPLogger.error('assess_strategic_alignment handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle optimize_resource_allocation tool calls
   */
  async handleOptimizeResourceAllocation(args: OptimizeResourceAllocationArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || !args.current_workflow) {
        throw new Error('Validation failed: current_workflow is required');
      }

      MCPLogger.debug('Optimizing resource allocation', context, { 
        hasResourceConstraints: !!args.resource_constraints,
        optimizationGoals: args.optimization_goals,
        citationOptions: args.citation_options
      });
      
      const optimization = await this.pipeline.optimizeResourceAllocation(
        args.current_workflow,
        args.resource_constraints,
        args.optimization_goals
      );

      // Integrate citations if requested
      let enhancedContent = optimization;
      let citationMetrics;
      if (args.citation_options?.include_citations !== false) {
        const citationResult = await this.citationIntegration.integrateCitations(
          'resource_optimization',
          optimization,
          args.citation_options
        );
        enhancedContent = citationResult.enhancedContent;
        citationMetrics = citationResult.metrics;
      }
      
      MCPLogger.info('Resource allocation optimization completed', context, {
        contentLength: enhancedContent.length,
        citationsIncluded: citationMetrics?.total_citations || 0,
        credibilityScore: citationMetrics?.credibility_score
      });

      const result = MCPResponseFormatter.formatSuccess(
        enhancedContent,
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 2, // Resource optimization typically uses 2 quota units
          citations: citationMetrics ? {
            total_citations: citationMetrics.total_citations,
            credibility_score: citationMetrics.credibility_score,
            recency_score: citationMetrics.recency_score,
            diversity_score: citationMetrics.diversity_score,
            bibliography_included: args.citation_options?.include_bibliography !== false
          } : undefined
        }
      );

      return result;
    } catch (error) {
      MCPLogger.error('optimize_resource_allocation handler failed', error as Error, context);
      return MCPErrorHandler.createErrorResponse(error as Error, context);
    }
  }

  /**
   * Handle validate_market_timing tool calls
   */
  async handleValidateMarketTiming(args: ValidateMarketTimingArgs, context: MCPToolContext): Promise<MCPToolResult> {
    try {
      // Validate required arguments
      if (!args || typeof args.feature_idea !== 'string') {
        throw new Error('Validation failed: feature_idea is required and must be a string');
      }

      MCPLogger.debug('Validating market timing', context, { 
        featureIdeaLength: args.feature_idea.length,
        hasMarketSignals: !!args.market_signals,
        citationOptions: args.citation_options
      });
      
      const timingValidation = await this.pipeline.validateMarketTiming(
        args.feature_idea,
        args.market_signals
      );

      // Integrate citations if requested
      let enhancedContent = timingValidation;
      let citationMetrics;
      if (args.citation_options?.include_citations !== false) {
        const citationResult = await this.citationIntegration.integrateCitations(
          'market_timing',
          timingValidation,
          args.citation_options
        );
        enhancedContent = citationResult.enhancedContent;
        citationMetrics = citationResult.metrics;
      }
      
      MCPLogger.info('Market timing validation completed', context, {
        contentLength: enhancedContent.length,
        citationsIncluded: citationMetrics?.total_citations || 0,
        credibilityScore: citationMetrics?.credibility_score
      });

      const result = MCPResponseFormatter.formatSuccess(
        enhancedContent,
        'markdown',
        {
          executionTime: Date.now() - context.timestamp,
          quotaUsed: 1, // Market timing validation typically uses 1 quota unit
          citations: citationMetrics ? {
            total_citations: citationMetrics.total_citations,
            credibility_score: citationMetrics.credibility_score,
            recency_score: citationMetrics.recency_score,
            diversity_score: citationMetrics.diversity_score,
            bibliography_included: args.citation_options?.include_bibliography !== false
          } : undefined
        }
      );

      return result;
    } catch (error) {
      MCPLogger.error('validate_market_timing handler failed', error as Error, context);
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
      // Clean up pipeline resources first
      if (this.pipeline && typeof (this.pipeline as any).cleanup === 'function') {
        await (this.pipeline as any).cleanup();
      }
      
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
   * Public method to update metrics for testing purposes
   */
  public updateMetricsForTesting(responseTime: number, isError: boolean = false): void {
    this.updateMetrics(responseTime, isError);
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