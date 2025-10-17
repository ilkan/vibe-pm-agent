export interface LambdaRequest {
    toolName: string;
    toolArgs: Record<string, any>;
    requestId?: string;
    environment?: 'dev' | 'prod';
}
export interface LambdaResponse {
    success: boolean;
    data?: any;
    error?: string;
    requestId?: string;
    executionTime?: number;
    toolName?: string;
}
export interface OpenAICompatibleResponse {
    data: any;
    toolName?: string | undefined;
    toolArgs?: Record<string, any> | undefined;
    requestId?: string | undefined;
    executionTime?: number | undefined;
}
export interface ToolDefinition {
    name: string;
    description: string;
    category: 'business-analysis' | 'communications' | 'requirements' | 'market-intelligence' | 'interview-prep' | 'case-studies';
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
}
export interface LambdaContext {
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: number;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
    identity?: {
        cognitoIdentityId?: string;
        cognitoIdentityPoolId?: string;
    };
    clientContext?: {
        client?: {
            installationId?: string;
            appTitle?: string;
            appVersionName?: string;
            appVersionCode?: string;
            appPackageName?: string;
        };
        env?: {
            platformVersion?: string;
            platform?: string;
            make?: string;
            model?: string;
            locale?: string;
        };
        custom?: Record<string, any>;
    };
    remainingTimeInMillis: number;
}
export interface EnvironmentConfig {
    environment: 'dev' | 'prod';
    logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    mcpServerPath?: string | undefined;
    bedrockRegion?: string | undefined;
    apiGatewayUrl?: string | undefined;
    enableCaching?: boolean;
    cacheTimeout?: number;
}
export interface ToolExecutionResult {
    toolName: string;
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    cached?: boolean;
}
export declare class LambdaError extends Error {
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
export declare class ToolNotFoundError extends LambdaError {
    constructor(toolName: string);
}
export declare class ToolExecutionError extends LambdaError {
    constructor(toolName: string, message: string);
}
export interface BusinessAnalysisArgs {
    idea?: string;
    market_context?: {
        industry?: string;
        competition?: string;
        budget_range?: 'small' | 'medium' | 'large';
        timeline?: string;
    };
    opportunity_analysis?: string;
    financial_inputs?: {
        development_cost?: number;
        operational_cost?: number;
        expected_revenue?: number;
        time_to_market?: number;
    };
    feature_concept?: string;
    company_context?: {
        mission?: string;
        current_okrs?: string[];
        strategic_priorities?: string[];
        competitive_position?: string;
    };
    current_workflow?: any;
    resource_constraints?: {
        team_size?: number;
        budget?: number;
        timeline?: string;
        technical_debt?: string;
    };
    optimization_goals?: string[];
    feature_idea?: string;
    market_signals?: {
        customer_demand?: 'low' | 'medium' | 'high';
        competitive_pressure?: 'low' | 'medium' | 'high';
        technical_readiness?: 'low' | 'medium' | 'high';
        resource_availability?: 'low' | 'medium' | 'high';
    };
    criteria?: string[];
    market_segment?: string;
    competitors?: string[];
    market?: string;
    methodology?: string;
}
export interface CommunicationsArgs {
    business_case?: string;
    communication_type?: 'executive_onepager' | 'pr_faq' | 'board_presentation' | 'team_announcement';
    audience?: 'executives' | 'board' | 'engineering_team' | 'customers' | 'investors';
    project_info?: string;
    product_info?: string;
    target_audience?: string;
    analysis_data?: string;
    summary_type?: string;
}
export interface RequirementsArgs {
    feature_idea?: string;
    context?: any;
    requirements?: string;
    constraints?: any;
    design?: string;
    workflow_description?: string;
    optimization_goals?: string[];
    user_intent?: string;
}
export interface MarketIntelligenceArgs {
    content?: string;
    sources?: string[];
    strict_mode?: boolean;
    market?: string;
    indicators?: string[];
    investment?: number;
    expected_returns?: any;
    analysis_data?: string;
    summary_type?: string;
    idea?: string;
    criteria?: string[];
    market_segment?: string;
    competitors?: string[];
    workflow_description?: string;
    optimization_goals?: string[];
}
export interface InterviewPrepArgs {
    role_level?: 'APM' | 'PM' | 'Senior PM' | 'Principal PM';
    target_company?: string;
    preparation_timeline?: string;
    focus_areas?: string[];
    experience_level?: string;
    weak_areas?: string[];
    question_category?: 'behavioral' | 'product_sense' | 'analytical' | 'technical' | 'leadership';
    company_context?: string;
    difficulty_level?: number;
    session_id?: string;
    question_id?: string;
    user_response?: string;
    evaluation_focus?: string[];
    include_detailed_analysis?: boolean;
    include_study_plan?: boolean;
    focus_on_improvements?: boolean;
    company_name?: string;
    include_recent_changes?: boolean;
    experience_background?: string;
    preferred_study_style?: string;
}
export interface CaseStudyArgs {
    case_type?: 'product_design' | 'strategy' | 'prioritization' | 'market_entry' | 'growth' | 'monetization';
    industry?: string;
    difficulty_level?: number;
    time_limit?: number;
    company_style?: string;
    role_level?: 'APM' | 'PM' | 'Senior PM' | 'Principal PM';
    current_step?: string;
    request_type?: 'hint' | 'framework' | 'clarification' | 'next_step';
    user_progress?: string;
    step_number?: number;
    user_approach?: string;
    frameworks_used?: string[];
    request_detailed_feedback?: boolean;
    include_detailed_breakdown?: boolean;
    include_recommendations?: boolean;
    include_performance_analytics?: boolean;
    company_name?: string;
    use_real_products?: boolean;
    session_id?: string;
}
//# sourceMappingURL=types.d.ts.map