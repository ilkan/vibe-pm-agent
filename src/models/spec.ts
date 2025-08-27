// Kiro spec output format interfaces

import { QuotaForecast, ROIAnalysis } from './quota';
import { EfficiencySavings } from './workflow';
import { ConsultingSummary, ThreeOptionAnalysis } from './consulting';

export interface KiroSpec {
  name: string;
  description: string;
  requirements: SpecRequirement[];
  design: SpecDesign;
  tasks: SpecTask[];
  metadata: SpecMetadata;
}

export interface SpecRequirement {
  id: string;
  userStory: string;
  acceptanceCriteria: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface SpecDesign {
  overview: string;
  architecture: string;
  components: ComponentDescription[];
  dataModels: string[];
}

export interface ComponentDescription {
  name: string;
  purpose: string;
  interfaces: string[];
  dependencies: string[];
}

export interface SpecTask {
  id: string;
  description: string;
  subtasks?: SpecTask[];
  requirements: string[]; // requirement ids
  estimatedEffort: 'small' | 'medium' | 'large';
}

export interface SpecMetadata {
  originalIntent: string;
  optimizationApplied: string[];
  estimatedQuotaUsage: QuotaForecast;
  generatedAt: Date;
  version: string;
}

export interface EfficiencySummary {
  naiveApproach: QuotaForecast;
  optimizedApproach: QuotaForecast;
  savings: EfficiencySavings;
  optimizationNotes?: string[];
}

export interface EnhancedKiroSpec extends KiroSpec {
  consultingSummary: ConsultingSummary;
  roiAnalysis: ROIAnalysis;
  alternativeOptions: ThreeOptionAnalysis;
}

export interface ProcessingError {
  stage: 'intent' | 'analysis' | 'optimization' | 'forecasting';
  type: string;
  message: string;
  suggestedAction: string;
  fallbackAvailable: boolean;
}