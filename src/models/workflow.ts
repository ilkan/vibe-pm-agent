// Workflow and optimization data structures

export interface Workflow {
  id: string;
  steps: WorkflowStep[];
  dataFlow: DataDependency[];
  estimatedComplexity: number;
}

export interface WorkflowStep {
  id: string;
  type: 'vibe' | 'spec' | 'data_retrieval' | 'processing' | 'analysis';
  description: string;
  inputs: string[];
  outputs: string[];
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
  type: 'batching' | 'caching' | 'decomposition' | 'vibe_to_spec';
  description: string;
  stepsAffected: string[];
  estimatedSavings: {
    vibes: number;
    specs: number;
    percentage: number;
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