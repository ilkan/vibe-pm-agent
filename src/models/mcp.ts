// MCP Server interfaces and types

import { Workflow, OptimizedWorkflow } from './workflow';
import { ConsultingAnalysis } from '../components/business-analyzer';
import { ConsultingSummary } from './consulting';
import { ROIAnalysis } from './quota';
import { OptionalParams } from './intent';

/**
 * MCP Server configuration interface
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  tools: MCPTool[];
}

/**
 * MCP Tool definition interface
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (args: any) => Promise<MCPToolResult>;
}

/**
 * JSON Schema interface for tool input validation
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * MCP Tool execution result with enhanced content types
 */
export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
  metadata?: {
    executionTime?: number;
    quotaUsed?: number;
    cacheHit?: boolean;
    warnings?: string[];
    steeringFileCreated?: boolean;
    confidenceScore?: number; // Added for Amazon Working Backwards methodology
    amazonMode?: {
      enabled: boolean;
      fallbackReason?: string;
      performanceMetrics?: {
        assumptionLedgerTime?: number;
        confidenceTime?: number;
        scenarioTime?: number;
        hardQuestionsTime?: number;
        totalTime: number;
      };
    };
    steeringFiles?: Array<{
      filename: string;
      action: string;
      fullPath?: string;
    }>;
    citations?: {
      total_citations: number;
      credibility_score: number;
      recency_score: number;
      diversity_score: number;
      bibliography_included: boolean;
      quality_score?: number;
      overall_confidence?: number;
      compliance_status?: 'compliant' | 'warning' | 'non-compliant';
      validations_passed?: number;
      validations_failed?: number;
      broken_links?: number;
      alternative_sources_found?: number;
    };
    enhancement?: {
      citation_requirements_identified: number;
      unsupported_claims_found: number;
      critical_claims: number;
      additional_sources_suggested: number;
      quality_gaps_identified: number;
      improvement_recommendations: number;
      content_length_increase: string;
    };
  };
}

/**
 * MCP content types for different response formats
 */
export interface MCPContent {
  type: 'text' | 'resource' | 'image' | 'json' | 'markdown';
  text?: string;
  resource?: MCPResource;
  image?: MCPImage;
  json?: any;
  markdown?: string;
}

/**
 * MCP resource definition
 */
export interface MCPResource {
  uri: string;
  mimeType: string;
  text?: string;
  data?: string; // Base64 encoded data
  size?: number;
  lastModified?: string;
}

/**
 * MCP image content
 */
export interface MCPImage {
  url?: string;
  data?: string; // Base64 encoded image data
  mimeType: string;
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * MCP Error response with standard error codes
 */
export interface MCPError {
  code: MCPErrorCode;
  message: string;
  data?: any;
}

/**
 * Standard MCP error codes
 */
export enum MCPErrorCode {
  // Standard JSON-RPC error codes
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // MCP-specific error codes
  TOOL_NOT_FOUND = -32000,
  TOOL_EXECUTION_FAILED = -32001,
  VALIDATION_FAILED = -32002,
  TIMEOUT = -32003,
  RATE_LIMITED = -32004,
  INSUFFICIENT_RESOURCES = -32005,
  PIPELINE_ERROR = -32006,
}

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Structured error information for detailed error handling
 */
export interface ErrorDetails {
  code: MCPErrorCode;
  message: string;
  severity: ErrorSeverity;
  stage?: string;
  toolName?: string;
  sessionId?: string;
  timestamp: number;
  stack?: string;
  context?: Record<string, any>;
  retryable: boolean;
  suggestedAction?: string;
}

/**
 * Tool input argument interfaces
 */
export interface OptimizeIntentArgs {
  intent: string;
  parameters?: OptionalParams;
}

export interface AnalyzeWorkflowArgs {
  workflow: Workflow;
  techniques?: string[];
}

export interface GenerateROIArgs {
  workflow: Workflow;
  optimizedWorkflow?: OptimizedWorkflow;
  zeroBasedSolution?: any;
}

export interface ConsultingSummaryArgs {
  analysis: ConsultingAnalysis;
  techniques?: string[];
}

export interface ManagementOnePagerArgs {
  requirements: string;
  design: string;
  tasks?: string;
  roi_inputs?: {
    cost_naive?: number;
    cost_balanced?: number;
    cost_bold?: number;
  };
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface PRFAQArgs {
  requirements: string;
  design: string;
  target_date?: string;
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface RequirementsArgs {
  raw_intent: string;
  context?: {
    roadmap_theme?: string;
    budget?: number;
    quotas?: {
      maxVibes?: number;
      maxSpecs?: number;
    };
    deadlines?: string;
  };
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface DesignOptionsArgs {
  requirements: string;
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface TaskPlanArgs {
  design: string;
  limits?: {
    max_vibes?: number;
    max_specs?: number;
    budget_usd?: number;
  };
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface ValidateIdeaQuickArgs {
  idea: string;
  context?: {
    urgency?: 'low' | 'medium' | 'high';
    budget_range?: 'small' | 'medium' | 'large';
    team_size?: number;
  };
  citation_options?: CitationOptions;
}

export interface AnalyzeBusinessOpportunityArgs {
  idea: string;
  market_context?: {
    industry?: string;
    competition?: string;
    budget_range?: 'small' | 'medium' | 'large';
    timeline?: string;
  };
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface GenerateBusinessCaseArgs {
  opportunity_analysis: string;
  financial_inputs?: {
    development_cost?: number;
    operational_cost?: number;
    expected_revenue?: number;
    time_to_market?: number;
  };
  amazon_mode?: boolean; // Default: true
  include_evidence_mechanisms?: boolean; // Default: true
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface CreateStakeholderCommunicationArgs {
  business_case: string;
  communication_type: 'executive_onepager' | 'pr_faq' | 'board_presentation' | 'team_announcement';
  audience: 'executives' | 'board' | 'engineering_team' | 'customers' | 'investors';
  amazon_mode?: boolean; // Default: true
  include_evidence_mechanisms?: boolean; // Default: true
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface AssessStrategicAlignmentArgs {
  feature_concept: string;
  company_context?: {
    mission?: string;
    strategic_priorities?: string[];
    current_okrs?: string[];
    competitive_position?: string;
  };
  steering_options?: SteeringFileOptions;
  citation_options?: CitationOptions;
}

export interface OptimizeResourceAllocationArgs {
  current_workflow: any;
  resource_constraints?: {
    budget?: number;
    team_size?: number;
    timeline?: string;
    technical_debt?: string;
  };
  optimization_goals?: (
    | 'cost_reduction'
    | 'speed_improvement'
    | 'quality_increase'
    | 'risk_mitigation'
  )[];
  citation_options?: CitationOptions;
}

export interface ValidateMarketTimingArgs {
  feature_idea: string;
  market_signals?: {
    customer_demand?: 'low' | 'medium' | 'high';
    competitive_pressure?: 'low' | 'medium' | 'high';
    technical_readiness?: 'low' | 'medium' | 'high';
    resource_availability?: 'low' | 'medium' | 'high';
  };
  citation_options?: CitationOptions;
}

/**
 * MCP Server status and health check
 */
export interface MCPServerStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  toolsRegistered: number;
  lastError?: string;
  performance: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
}

/**
 * MCP Tool call context for logging and monitoring
 */
export interface MCPToolContext {
  toolName: string;
  sessionId: string;
  timestamp: number;
  clientInfo?: {
    name: string;
    version: string;
  };
  requestId?: string;
  userId?: string;
  traceId?: string;
}

/**
 * Logging levels for MCP server operations
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * Structured log entry for MCP operations
 */
export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  component: string;
  message: string;
  context?: MCPToolContext;
  error?: {
    message: string;
    stack?: string;
    type: string;
    code?: MCPErrorCode;
  };
  metadata?: Record<string, any>;
  duration?: number;
}

/**
 * Enhanced citation options for MCP tools with validation and quality assessment
 */
export interface CitationOptions {
  /** Whether to include citations and references */
  include_citations?: boolean;
  /** Minimum number of citations required */
  minimum_citations?: number;
  /** Required confidence level for citations */
  minimum_confidence?: 'low' | 'medium' | 'high';
  /** Industry focus for citation relevance */
  industry_focus?: string;
  /** Geographic scope for citations */
  geographic_scope?: string;
  /** Citation style for formatting */
  citation_style?: 'business' | 'apa' | 'inline';
  /** Whether to include bibliography section */
  include_bibliography?: boolean;
  /** Maximum age of citations in months */
  max_citation_age_months?: number;
  
  // Enhanced validation options
  /** Whether to validate source accessibility */
  validate_sources?: boolean;
  /** Whether to perform quality assessment */
  assess_quality?: boolean;
  /** Whether to calculate confidence scores */
  calculate_confidence?: boolean;
  /** Whether to find alternative sources for broken links */
  find_alternatives?: boolean;
  /** Minimum quality score required (0-100) */
  minimum_quality_score?: number;
  /** Whether to show confidence indicators in content */
  show_confidence_indicators?: boolean;
  /** Whether to include quality report in metadata */
  include_quality_report?: boolean;
  /** Whether to filter out low-quality sources */
  filter_low_quality?: boolean;
}

/**
 * Steering file creation options for MCP tools
 */
export interface SteeringFileOptions {
  /** Whether to create steering files from the generated documents */
  create_steering_files?: boolean;
  /** Feature name for organizing steering files */
  feature_name?: string;
  /** Custom filename prefix for steering files */
  filename_prefix?: string;
  /** Inclusion rule for the steering files */
  inclusion_rule?: 'always' | 'fileMatch' | 'manual';
  /** File match pattern when inclusion_rule is 'fileMatch' */
  file_match_pattern?: string;
  /** Whether to overwrite existing steering files */
  overwrite_existing?: boolean;
}

/**
 * MCP Server configuration options
 */
export interface MCPServerOptions {
  port?: number;
  host?: string;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  logLevel?: LogLevel;
  enableQuickValidation?: boolean;
  enablePMDocuments?: boolean;
  maxConcurrentRequests?: number;
  requestTimeout?: number;
  enablePerformanceMonitoring?: boolean;
}
