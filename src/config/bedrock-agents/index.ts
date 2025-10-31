/**
 * Bedrock Agent Configurations
 * Enhanced with Llama 3.1 Nemotron Nano 8B V1 capabilities
 */

export { default as BUSINESS_STRATEGY_AGENT_CONFIG } from './business-strategy-agent.js';
export { default as PRODUCT_DEVELOPMENT_AGENT_CONFIG } from './product-development-agent.js';
export { default as EXECUTIVE_COMMUNICATIONS_AGENT_CONFIG } from './executive-communications-agent.js';
export { default as CASE_STUDY_COACHING_AGENT_CONFIG } from './case-study-coaching-agent.js';
export { default as SUPERVISOR_AGENT_CONFIG } from './supervisor-agent.js';
export { default as CITATION_AGENT_CONFIG } from './citation-agent.js';

// Agent registry for easy access
export const BEDROCK_AGENTS = {
  BUSINESS_STRATEGY: {
    id: 'IBQRX8MZJJ',
    name: 'Business Strategy Agent',
    config: BUSINESS_STRATEGY_AGENT_CONFIG
  },
  PRODUCT_DEVELOPMENT: {
    id: 'CEW45LTT2P',
    name: 'Product Development Agent',
    config: PRODUCT_DEVELOPMENT_AGENT_CONFIG
  },
  EXECUTIVE_COMMUNICATIONS: {
    id: 'ULX1RJGKCR',
    name: 'Executive Communications Agent',
    config: EXECUTIVE_COMMUNICATIONS_AGENT_CONFIG
  },
  CASE_STUDY_COACHING: {
    id: 'PDZPQTNLYH',
    name: 'Case Study Coaching Agent',
    config: CASE_STUDY_COACHING_AGENT_CONFIG
  },
  SUPERVISOR: {
    id: 'SUPERVISOR001',
    name: 'Supervisor Agent',
    config: SUPERVISOR_AGENT_CONFIG
  },
  CITATION: {
    id: 'CITATION001',
    name: 'Citation Agent',
    config: CITATION_AGENT_CONFIG
  }
} as const;

// Helper function to get agent config by ID
export function getAgentConfigById(agentId: string) {
  const agent = Object.values(BEDROCK_AGENTS).find(a => a.id === agentId);
  return agent?.config;
}

// Helper function to get all agent IDs
export function getAllAgentIds(): string[] {
  return Object.values(BEDROCK_AGENTS).map(a => a.id);
}

// Helper function to validate agent ID
export function isValidAgentId(agentId: string): boolean {
  return getAllAgentIds().includes(agentId);
}