// Quota and cost calculation data structures

import { Workflow } from './workflow';

export interface QuotaForecast {
  vibesConsumed: number;
  specsConsumed: number;
  estimatedCost: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  scenario: 'naive' | 'optimized' | 'zero-based';
  breakdown: QuotaBreakdown[];
}

export interface QuotaBreakdown {
  stepId: string;
  stepDescription: string;
  vibes: number;
  specs: number;
  cost: number;
}

export interface QuotaCostModel {
  vibeUnitCost: number; // cost per vibe
  specUnitCost: number; // cost per spec
  operationCosts: Map<string, number>; // operation type -> base cost
}

export interface BatchedOperation {
  id: string;
  originalOperations: string[]; // original operation ids
  type: string;
  description: string;
  batchSize: number;
  estimatedSavings: number; // percentage
}

export interface CachedWorkflow extends Workflow {
  cachePoints: CachePoint[];
  estimatedHitRate: number; // 0-1
}

export interface CachePoint {
  stepId: string;
  cacheKey: string;
  ttl?: number; // time to live in seconds
  estimatedHitRate: number;
}

export interface ROIAnalysis {
  scenarios: OptimizationScenario[];
  recommendations: string[];
  bestOption: string;
  riskAssessment: string;
}

export interface OptimizationScenario {
  name: string;
  forecast: QuotaForecast;
  savingsPercentage: number;
  implementationEffort: string;
  riskLevel: string;
}

export interface ComprehensiveSavings {
  conservativeSavings: number;
  balancedSavings: number;
  boldSavings: number;
  recommendedApproach: string;
}

