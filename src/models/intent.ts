// Intent parsing data structures and interfaces

export interface ParsedIntent {
  businessObjective: string;
  technicalRequirements: TechnicalRequirement[];
  dataSourcesNeeded: string[];
  operationsRequired: Operation[];
  potentialRisks: Risk[];
}

export interface TechnicalRequirement {
  type: 'data_retrieval' | 'processing' | 'analysis' | 'output';
  description: string;
  complexity: 'low' | 'medium' | 'high';
  quotaImpact: 'minimal' | 'moderate' | 'significant';
}

export interface Operation {
  id: string;
  type: 'vibe' | 'spec' | 'data_retrieval' | 'processing' | 'analysis';
  description: string;
  estimatedQuotaCost: number;
}

export interface Risk {
  type: 'redundant_query' | 'excessive_loops' | 'unnecessary_vibes' | 'missing_cache';
  severity: 'low' | 'medium' | 'high';
  description: string;
  likelihood: number; // 0-1
}

export interface OptionalParams {
  expectedUserVolume?: number;
  costConstraints?: {
    maxVibes?: number;
    maxSpecs?: number;
    maxCostDollars?: number;
  };
  performanceSensitivity?: 'low' | 'medium' | 'high';
}