// Workflow and optimization data structures

export interface Workflow {
  id: string;
  name?: string;
  description?: string;
  steps: WorkflowStep[];
  dataFlow?: DataDependency[];
  estimatedComplexity: number;
}

export interface WorkflowStep {
  id: string;
  type: 'vibe' | 'spec' | 'data_retrieval' | 'processing' | 'analysis' | 'kiro_vibe_coding' | 'kiro_spec_generation' | 'kiro_autopilot' | 'kiro_supervised';
  description: string;
  inputs?: string[];
  outputs?: string[];
  quotaCost: number;
}

export interface DataDependency {
  from: string; // step id
  to: string; // step id
  dataType: string;
  required: boolean;
}

export interface OptimizedWorkflow extends Workflow {
  optimizations: Optimization[];
  originalWorkflow: Workflow;
  efficiencyGains: EfficiencySavings;
}

export interface Optimization {
  id: string;
  type: 'batching' | 'caching' | 'decomposition' | 'vibe_to_spec' | 'kiro_autopilot' | 'kiro_optimization';
  description: string;
  stepsAffected: string[];
  estimatedSavings: {
    vibes: number;
    specs: number;
    percentage: number;
    time?: number;
  };
}

export interface EfficiencySavings {
  vibeReduction: number; // percentage
  specReduction: number; // percentage
  costSavings: number; // dollar amount
  totalSavingsPercentage: number;
}

export interface UseCaseMap {
  actor: string;
  trigger: string;
  flow: WorkflowStep[];
  alternativeFlows: WorkflowStep[][];
}

export interface EfficiencyIssue {
  type: 'redundant_query' | 'excessive_loops' | 'unnecessary_vibes' | 'missing_cache';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix: string;
  stepsAffected: string[];
}
