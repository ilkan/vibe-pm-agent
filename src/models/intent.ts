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
  generatePMDocuments?: {
    managementOnePager?: boolean;
    prfaq?: boolean;
    requirements?: boolean;
    designOptions?: boolean;
    taskPlan?: boolean;
    targetDate?: string; // For PR-FAQ
    context?: {
      roadmapTheme?: string;
      budget?: number;
      deadlines?: string;
    };
    steeringOptions?: import('./mcp').SteeringFileOptions;
  };
}

// Quick validation interfaces
export interface QuickValidationContext {
  urgency?: 'low' | 'medium' | 'high';
  budget_range?: 'small' | 'medium' | 'large';
  team_size?: number;
}

export interface QuickValidationOption {
  id: 'A' | 'B' | 'C';
  title: string;
  description: string;
  tradeoffs: string[];
  nextStep: string;
}

export interface QuickValidationResult {
  verdict: 'PASS' | 'FAIL';
  reasoning: string;
  options: [QuickValidationOption, QuickValidationOption, QuickValidationOption];
  processingTimeMs: number;
}