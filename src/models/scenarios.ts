/**
 * Amazon Working Backwards - Scenario modeling and analysis models
 */

export interface ScenarioRow {
  metric: string;
  bear: number | string;
  base: number | string;
  bull: number | string;
  unit?: string;
}

export interface ScenarioResults {
  scenarios: {
    bear: ScenarioRow[];
    base: ScenarioRow[];
    bull: ScenarioRow[];
  };
  elasticities: Elasticity[];
  keyDrivers: KeyDriver[];
  sensitivityPct: number; // Default 20%
}

export interface Elasticity {
  assumption: string; // e.g., "Customer Acquisition Cost"
  assumptionChange: string; // e.g., "±20%"
  outcomeMetric: string; // e.g., "ROI"
  outcomeChange: string; // e.g., "±14pp"
  sensitivity: number; // Impact magnitude
}

export interface KeyDriver {
  assumption: string;
  assumptionId: string;
  impact: number;
  description: string;
}

export interface ScenarioContext {
  ledger: import('./assumptions').AssumptionLedger;
  basicCalc: FinancialModel;
  topIds: string[]; // Most impactful assumption IDs
  scenarioPct: number; // Default 0.2 (±20%)
}

export interface FinancialModel {
  revenue: number;
  costs: number;
  roi: number;
  npv: number;
  [key: string]: number;
}