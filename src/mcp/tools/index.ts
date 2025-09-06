/**
 * Generated-by: Kiro Spec Mode
 * Spec-ID: vibe_pm_agent_v2_hackathon
 * Spec-Hash: sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 * Model: claude-3.5-sonnet
 * Timestamp: 2025-01-09T10:30:00Z
 */

// Export all MCP tool implementations and schemas

import {
  generateRequirements,
  generateRequirementsSchema,
  generateRequirementsDescription
} from './generate_requirements';

import {
  generateDesignOptions,
  generateDesignOptionsSchema,
  generateDesignOptionsDescription
} from './generate_design_options';

import {
  generateTaskPlan,
  generateTaskPlanSchema,
  generateTaskPlanDescription
} from './generate_task_plan';

import {
  generateManagementOnePager,
  generateManagementOnePagerSchema,
  generateManagementOnePagerDescription
} from './generate_management_onepager';

import {
  generatePRFAQ,
  generatePRFAQSchema,
  generatePRFAQDescription
} from './generate_pr_faq';

// Re-export for external use
export {
  generateRequirements,
  generateRequirementsSchema,
  generateRequirementsDescription,
  generateDesignOptions,
  generateDesignOptionsSchema,
  generateDesignOptionsDescription,
  generateTaskPlan,
  generateTaskPlanSchema,
  generateTaskPlanDescription,
  generateManagementOnePager,
  generateManagementOnePagerSchema,
  generateManagementOnePagerDescription,
  generatePRFAQ,
  generatePRFAQSchema,
  generatePRFAQDescription
};

/**
 * Registry of all available MCP tools with their metadata
 */
export const MCP_TOOLS_REGISTRY = {
  generate_requirements: {
    handler: generateRequirements,
    schema: generateRequirementsSchema,
    description: generateRequirementsDescription
  },
  generate_design_options: {
    handler: generateDesignOptions,
    schema: generateDesignOptionsSchema,
    description: generateDesignOptionsDescription
  },
  generate_task_plan: {
    handler: generateTaskPlan,
    schema: generateTaskPlanSchema,
    description: generateTaskPlanDescription
  },
  generate_management_onepager: {
    handler: generateManagementOnePager,
    schema: generateManagementOnePagerSchema,
    description: generateManagementOnePagerDescription
  },
  generate_pr_faq: {
    handler: generatePRFAQ,
    schema: generatePRFAQSchema,
    description: generatePRFAQDescription
  }
} as const;

/**
 * Get list of all available tool names
 */
export function getAvailableToolNames(): string[] {
  return Object.keys(MCP_TOOLS_REGISTRY);
}

/**
 * Get tool metadata by name
 */
export function getToolMetadata(toolName: string) {
  return MCP_TOOLS_REGISTRY[toolName as keyof typeof MCP_TOOLS_REGISTRY];
}

/**
 * Validate if a tool name is supported
 */
export function isValidToolName(toolName: string): boolean {
  return toolName in MCP_TOOLS_REGISTRY;
}