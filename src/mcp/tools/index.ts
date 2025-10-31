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
  generateRequirementsDescription,
} from './generate_requirements';

import {
  generateDesignOptions,
  generateDesignOptionsSchema,
  generateDesignOptionsDescription,
} from './generate_design_options';

import {
  generateTaskPlan,
  generateTaskPlanSchema,
  generateTaskPlanDescription,
} from './generate_task_plan';

import {
  generateManagementOnePager,
  generateManagementOnePagerSchema,
  generateManagementOnePagerDescription,
} from './generate_management_onepager';

import { generatePRFAQ, generatePRFAQSchema, generatePRFAQDescription } from './generate_pr_faq';

import {
  unifiedCitationSystem,
  unifiedCitationSystemSchema,
  unifiedCitationSystemDescription,
} from './unified_citation_system';

import {
  generateBusinessCase,
  generateBusinessCaseSchema,
  generateBusinessCaseDescription,
} from './generate_business_case';

import {
  createStakeholderCommunication,
  createStakeholderCommunicationSchema,
  createStakeholderCommunicationDescription,
} from './create_stakeholder_communication';

import {
  analyzeBusinessOpportunityEnhanced,
  analyzeBusinessOpportunityEnhancedSchema,
  analyzeBusinessOpportunityEnhancedDescription,
} from './analyze_business_opportunity_enhanced';

import {
  monitorMarketConditions,
  monitorMarketConditionsMetadata,
} from './monitor_market_conditions';

import {
  awsDocsSearch,
  awsDocsSearchSchema,
  awsDocsSearchDescription,
} from './aws_docs_search';

import {
  awsDocsRead,
  awsDocsReadSchema,
  awsDocsReadDescription,
} from './aws_docs_read';

import {
  awsDocsRecommend,
  awsDocsRecommendSchema,
  awsDocsRecommendDescription,
} from './aws_docs_recommend';

import {
  awsContextualInfo,
  awsContextualInfoSchema,
  awsContextualInfoDescription,
} from './aws_contextual_info';

import {
  awsCodeGenerator,
  awsCodeGeneratorSchema,
  awsCodeGeneratorDescription,
} from './aws_code_generator';

import {
  awsBestPractices,
  awsBestPracticesSchema,
  awsBestPracticesDescription,
} from './aws_best_practices';

import {
  assessStrategicAlignment,
} from './assess_strategic_alignment';

import {
  validateMarketTiming,
} from './validate_market_timing';

import {
  optimizeResourceAllocation,
} from './optimize_resource_allocation';

import {
  analyzeBusinessOpportunity,
} from './analyze_business_opportunity';

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
  generatePRFAQDescription,
  unifiedCitationSystem,
  unifiedCitationSystemSchema,
  unifiedCitationSystemDescription,
  generateBusinessCase,
  generateBusinessCaseSchema,
  generateBusinessCaseDescription,
  createStakeholderCommunication,
  createStakeholderCommunicationSchema,
  createStakeholderCommunicationDescription,
  analyzeBusinessOpportunityEnhanced,
  analyzeBusinessOpportunityEnhancedSchema,
  analyzeBusinessOpportunityEnhancedDescription,
  awsDocsSearch,
  awsDocsSearchSchema,
  awsDocsSearchDescription,
  awsDocsRead,
  awsDocsReadSchema,
  awsDocsReadDescription,
  awsDocsRecommend,
  awsDocsRecommendSchema,
  awsDocsRecommendDescription,
  awsContextualInfo,
  awsContextualInfoSchema,
  awsContextualInfoDescription,
  awsCodeGenerator,
  awsCodeGeneratorSchema,
  awsCodeGeneratorDescription,
  awsBestPractices,
  awsBestPracticesSchema,
  awsBestPracticesDescription,
  assessStrategicAlignment,
  validateMarketTiming,
  optimizeResourceAllocation,
  analyzeBusinessOpportunity,
};

/**
 * Registry of all available MCP tools with their metadata
 */
export const MCP_TOOLS_REGISTRY = {
  generate_requirements: {
    handler: generateRequirements,
    schema: generateRequirementsSchema,
    description: generateRequirementsDescription,
  },
  generate_design_options: {
    handler: generateDesignOptions,
    schema: generateDesignOptionsSchema,
    description: generateDesignOptionsDescription,
  },
  generate_task_plan: {
    handler: generateTaskPlan,
    schema: generateTaskPlanSchema,
    description: generateTaskPlanDescription,
  },
  generate_management_onepager: {
    handler: generateManagementOnePager,
    schema: generateManagementOnePagerSchema,
    description: generateManagementOnePagerDescription,
  },
  generate_pr_faq: {
    handler: generatePRFAQ,
    schema: generatePRFAQSchema,
    description: generatePRFAQDescription,
  },
  unified_citation_system: {
    handler: unifiedCitationSystem,
    schema: unifiedCitationSystemSchema,
    description: unifiedCitationSystemDescription,
  },
  generate_business_case: {
    handler: generateBusinessCase,
    schema: generateBusinessCaseSchema,
    description: generateBusinessCaseDescription,
  },
  create_stakeholder_communication: {
    handler: createStakeholderCommunication,
    schema: createStakeholderCommunicationSchema,
    description: createStakeholderCommunicationDescription,
  },
  analyze_business_opportunity_enhanced: {
    handler: analyzeBusinessOpportunityEnhanced,
    schema: analyzeBusinessOpportunityEnhancedSchema,
    description: analyzeBusinessOpportunityEnhancedDescription,
  },
  monitor_market_conditions: {
    handler: monitorMarketConditions,
    schema: monitorMarketConditionsMetadata.inputSchema,
    description: monitorMarketConditionsMetadata.description,
  },
  aws_docs_search: {
    handler: awsDocsSearch,
    schema: awsDocsSearchSchema,
    description: awsDocsSearchDescription,
  },
  aws_docs_read: {
    handler: awsDocsRead,
    schema: awsDocsReadSchema,
    description: awsDocsReadDescription,
  },
  aws_docs_recommend: {
    handler: awsDocsRecommend,
    schema: awsDocsRecommendSchema,
    description: awsDocsRecommendDescription,
  },
  aws_contextual_info: {
    handler: awsContextualInfo,
    schema: awsContextualInfoSchema,
    description: awsContextualInfoDescription,
  },
  aws_code_generator: {
    handler: awsCodeGenerator,
    schema: awsCodeGeneratorSchema,
    description: awsCodeGeneratorDescription,
  },
  aws_best_practices: {
    handler: awsBestPractices,
    schema: awsBestPracticesSchema,
    description: awsBestPracticesDescription,
  },
  assess_strategic_alignment: {
    handler: assessStrategicAlignment,
    schema: {
      type: 'object',
      properties: {
        feature_concept: { type: 'string', description: 'Feature concept to assess' },
        company_context: {
          type: 'object',
          properties: {
            mission: { type: 'string' },
            current_okrs: { type: 'array', items: { type: 'string' } },
            strategic_priorities: { type: 'array', items: { type: 'string' } },
            competitive_position: { type: 'string' }
          }
        }
      },
      required: ['feature_concept']
    },
    description: 'Evaluates how a feature aligns with company strategy, OKRs, and long-term vision',
  },
  validate_market_timing: {
    handler: validateMarketTiming,
    schema: {
      type: 'object',
      properties: {
        feature_idea: { type: 'string', description: 'Feature idea to validate timing for' },
        market_signals: {
          type: 'object',
          properties: {
            trends: { type: 'array', items: { type: 'string' } },
            competitive_moves: { type: 'array', items: { type: 'string' } },
            customer_feedback: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['feature_idea']
    },
    description: 'Fast validation of whether now is the right time to build a feature based on market conditions',
  },
  optimize_resource_allocation: {
    handler: optimizeResourceAllocation,
    schema: {
      type: 'object',
      properties: {
        current_workflow: {
          type: 'object',
          properties: {
            tasks: { type: 'array', items: { type: 'object' } },
            resources: { type: 'array', items: { type: 'object' } },
            timeline: { type: 'string' }
          }
        },
        resource_constraints: {
          type: 'object',
          properties: {
            budget: { type: 'number' },
            team_size: { type: 'number' },
            timeline: { type: 'string' }
          }
        },
        optimization_goals: { type: 'array', items: { type: 'string' } }
      },
      required: ['current_workflow']
    },
    description: 'Analyzes resource requirements and provides optimization recommendations for development efficiency',
  },
  analyze_business_opportunity: {
    handler: analyzeBusinessOpportunity,
    schema: {
      type: 'object',
      properties: {
        idea: { type: 'string', description: 'Business idea or feature to analyze' },
        market_context: { type: 'object', description: 'Market context and background information' },
        analysis_depth: { type: 'string', enum: ['quick', 'standard', 'comprehensive'], default: 'standard' }
      },
      required: ['idea']
    },
    description: 'Analyzes market opportunity, timing, and business justification for a feature idea',
  },
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
