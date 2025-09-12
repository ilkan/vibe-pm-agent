/**
 * Tool mappings for Kiro MCP interface
 * Maps external Kiro tool names to internal tool implementations
 */

// Kiro tool prefix
const KIRO_PREFIX = 'mcp_vibe_pm_agent_';

/**
 * Mapping of Kiro tool names to internal tool names
 */
export const KIRO_TOOL_MAPPINGS: Record<string, string> = {
  [`${KIRO_PREFIX}analyze_business_opportunity`]: 'analyze_business_opportunity_enhanced',
  [`${KIRO_PREFIX}generate_business_case`]: 'generate_business_case',
  [`${KIRO_PREFIX}create_stakeholder_communication`]: 'create_stakeholder_communication',
  [`${KIRO_PREFIX}assess_strategic_alignment`]: 'assess_strategic_alignment',
  [`${KIRO_PREFIX}validate_market_timing`]: 'validate_market_timing',
  [`${KIRO_PREFIX}optimize_resource_allocation`]: 'optimize_resource_allocation',
  [`${KIRO_PREFIX}generate_requirements`]: 'generate_requirements',
  [`${KIRO_PREFIX}generate_design_options`]: 'generate_design_options',
  [`${KIRO_PREFIX}generate_management_onepager`]: 'generate_management_onepager',
  [`${KIRO_PREFIX}generate_pr_faq`]: 'generate_pr_faq',
  [`${KIRO_PREFIX}generate_task_plan`]: 'generate_task_plan',
  [`${KIRO_PREFIX}enhance_citations`]: 'enhance_citations',
  [`${KIRO_PREFIX}validate_and_audit_citations`]: 'validate_and_audit_citations',
  [`${KIRO_PREFIX}monitor_market_conditions`]: 'monitor_market_conditions',
  [`${KIRO_PREFIX}optimize_intent`]: 'optimize_intent',
  [`${KIRO_PREFIX}analyze_workflow`]: 'analyze_workflow',
  [`${KIRO_PREFIX}generate_roi_analysis`]: 'generate_roi_analysis',
  [`${KIRO_PREFIX}get_consulting_summary`]: 'get_consulting_summary',
  [`${KIRO_PREFIX}validate_idea_quick`]: 'validate_idea_quick',
  [`${KIRO_PREFIX}analyze_competitor_landscape`]: 'analyze_competitor_landscape',
  [`${KIRO_PREFIX}calculate_market_sizing`]: 'calculate_market_sizing',
};

/**
 * Tool descriptions for Kiro tools
 */
export const KIRO_TOOL_DESCRIPTIONS: Record<string, string> = {
  [`${KIRO_PREFIX}analyze_business_opportunity`]:
    "Analyzes market opportunity, timing, and business justification for a feature idea using consulting frameworks (Porter's Five Forces, SWOT, TAM/SAM/SOM). Integrates authoritative sources from McKinsey, BCG, Bain, Gartner, and WEF. Returns comprehensive analysis with confidence scoring, competitive landscape, market sizing, and strategic recommendations.",
  [`${KIRO_PREFIX}generate_business_case`]:
    'Creates comprehensive business case with ROI analysis, risk assessment, and strategic alignment from opportunity analysis. Uses Amazon Working Backwards methodology by default with assumption ledger, confidence scoring, bear/base/bull scenario analysis, and hard questions. Returns executive-ready document with financial projections and evidence mechanisms.',
  [`${KIRO_PREFIX}create_stakeholder_communication`]:
    'Generates executive one-pagers, PR-FAQs, and stakeholder presentations from business case analysis. Routes to appropriate template based on communication_type (executive_onepager, pr_faq, board_presentation, team_announcement) and audience (executives, board, engineering_team, customers, investors). Uses Amazon Working Backwards methodology with evidence mechanisms.',
  [`${KIRO_PREFIX}assess_strategic_alignment`]:
    'Evaluates how a feature aligns with company strategy, OKRs, and long-term vision',
  [`${KIRO_PREFIX}validate_market_timing`]:
    'Fast validation of whether now is the right time to build a feature based on market conditions',
  [`${KIRO_PREFIX}optimize_resource_allocation`]:
    'Analyzes resource requirements and provides optimization recommendations for development efficiency',
  [`${KIRO_PREFIX}generate_requirements`]:
    "Generates comprehensive business requirements document from feature ideas with Business Goal extraction, MoSCoW prioritization (Must/Should/Could/Won't Have), and Go/No-Go timing recommendations. Outputs structured JSON with functional requirements, constraints, risks, and evidence-backed analysis using consulting frameworks.",
  [`${KIRO_PREFIX}generate_design_options`]:
    'Creates multiple design options and architectural approaches from requirements document. Generates Conservative/Balanced/Bold alternatives with Impact vs Effort matrix analysis, problem framing, implementation complexity assessment, and right-time recommendations using consulting frameworks.',
  [`${KIRO_PREFIX}generate_management_onepager`]:
    'Creates executive one-pager for management presentation using Pyramid Principle with answer-first clarity, ROI analysis, risk assessment, and timing rationale. Includes Conservative/Balanced/Bold options with cost-benefit analysis and comprehensive citations for executive decision-making.',
  [`${KIRO_PREFIX}generate_pr_faq`]:
    'Generates PR-FAQ document using Amazon Working Backwards methodology with future-dated press release, comprehensive FAQ section with 10 required questions, and detailed launch checklist. Includes market validation, customer benefits, and comprehensive citations for stakeholder alignment.',
  [`${KIRO_PREFIX}generate_task_plan`]:
    'Creates detailed implementation task plan from design documents with Guardrails Check as Task 0, followed by phased Immediate Wins, Short-Term, and Long-Term tasks. Each task includes ID, name, description, acceptance criteria, effort estimation, impact assessment, and priority ranking.',
  [`${KIRO_PREFIX}enhance_citations`]:
    'Enhances content with authoritative citations and source validation. Analyzes citation needs, validates source accessibility and credibility, identifies unsupported claims, suggests additional sources, and provides comprehensive quality assessment with confidence scoring and improvement recommendations.',
  [`${KIRO_PREFIX}validate_and_audit_citations`]:
    'Validates and audits citations for accuracy and credibility with comprehensive quality assessment. Checks source accessibility, assesses credibility, verifies compliance, finds alternative sources for broken links, identifies quality gaps, and generates detailed improvement recommendations with audit trail.',
  [`${KIRO_PREFIX}monitor_market_conditions`]:
    'Monitors and analyzes current market conditions and trends with real-time data, competitive intelligence, and predictive analysis. Detects market changes, tracks competitor movements, provides market sizing validation, and generates actionable recommendations for business opportunity assessment.',
  [`${KIRO_PREFIX}optimize_intent`]: 'Optimizes user intent for better clarity and actionability',
  [`${KIRO_PREFIX}analyze_workflow`]: 'Analyzes workflows for optimization opportunities',
  [`${KIRO_PREFIX}generate_roi_analysis`]:
    'Generates comprehensive ROI analysis with financial projections',
  [`${KIRO_PREFIX}get_consulting_summary`]:
    'Creates consulting-style executive summary from analysis data',
  [`${KIRO_PREFIX}validate_idea_quick`]:
    'Performs quick validation of business ideas against criteria',
  [`${KIRO_PREFIX}analyze_competitor_landscape`]:
    'Analyzes competitive landscape and market positioning',
  [`${KIRO_PREFIX}calculate_market_sizing`]:
    'Calculates market sizing using TAM-SAM-SOM methodology',
};

/**
 * Check if a tool name is a Kiro tool
 */
export function isKiroTool(toolName: string): boolean {
  return toolName.startsWith(KIRO_PREFIX);
}

/**
 * Get internal tool name from Kiro tool name
 */
export function getInternalToolName(kiroToolName: string): string | undefined {
  return KIRO_TOOL_MAPPINGS[kiroToolName];
}

/**
 * Get all Kiro tool names
 */
export function getAllKiroToolNames(): string[] {
  return Object.keys(KIRO_TOOL_MAPPINGS);
}

/**
 * Get Kiro tool description
 */
export function getKiroToolDescription(kiroToolName: string): string {
  return KIRO_TOOL_DESCRIPTIONS[kiroToolName] || 'Tool description not available';
}
