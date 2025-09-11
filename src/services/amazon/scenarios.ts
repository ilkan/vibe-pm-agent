/**
 * Amazon Working Backwards - Scenario Analysis Service
 * Generates bear/base/bull scenarios with sensitivity analysis and elasticity calculations
 */

import { BaseService, Result } from '../_base';
import {
  ScenarioResults,
  ScenarioContext,
  ScenarioRow,
  Elasticity,
  KeyDriver,
  FinancialModel,
} from '../../models/scenarios';
import { AssumptionLedger, Assumption } from '../../models/assumptions';
import { performanceCache } from '../../utils/performance-cache';
import { performanceMonitor } from '../../utils/performance-monitor';

export class ScenarioService extends BaseService {
  /**
   * Run bear/base/bull scenario analysis with comprehensive sensitivity calculations
   */
  async runScenarios(context: ScenarioContext): Promise<Result<ScenarioResults>> {
    return this.handleAsync(async () => {
      const { result } = await performanceMonitor.timeOperation(
        'scenario_service',
        async () => {
          // Generate scenarios by perturbing top numeric assumptions ±20%
          const scenarios = await this.generateScenarios(context);

          // Calculate elasticities showing how assumption changes impact outcomes
          const elasticities = this.calculateElasticities(context.basicCalc, scenarios, context);

          // Identify top 3-5 key drivers for tornado analysis
          const keyDrivers = this.identifyKeyDrivers(elasticities, context.ledger);

          // Validate mathematical consistency across all scenario projections
          const validationResult = await this.validateScenarios({
            scenarios,
            elasticities,
            keyDrivers,
            sensitivityPct: context.scenarioPct * 100,
          });

          if (!validationResult.success) {
            throw new Error(`Scenario validation failed: ${validationResult.error?.message}`);
          }

          return {
            scenarios,
            elasticities,
            keyDrivers,
            sensitivityPct: context.scenarioPct * 100,
          };
        },
        performanceCache.hashInputs(context)
      );

      return result;
    }, 'SCENARIO_ANALYSIS_ERROR');
  }

  /**
   * Calculate elasticities showing how assumption changes impact outcomes (e.g., "CAC ±20% → ROI ±14pp")
   */
  calculateElasticities(
    baseCase: FinancialModel,
    scenarios: { bear: ScenarioRow[]; base: ScenarioRow[]; bull: ScenarioRow[] },
    context: ScenarioContext
  ): Elasticity[] {
    const elasticities: Elasticity[] = [];

    // Get top numeric assumptions for elasticity analysis
    const topNumericAssumptions = this.getTopNumericAssumptions(context.ledger, context.topIds);

    // For each top assumption, calculate its impact on each outcome metric
    topNumericAssumptions.forEach(assumption => {
      scenarios.base.forEach(baseRow => {
        const bearRow = scenarios.bear.find(r => r.metric === baseRow.metric);
        const bullRow = scenarios.bull.find(r => r.metric === baseRow.metric);

        if (
          bearRow &&
          bullRow &&
          typeof baseRow.base === 'number' &&
          typeof bearRow.bear === 'number' &&
          typeof bullRow.bull === 'number'
        ) {
          const baseValue = baseRow.base;
          const bearValue = bearRow.bear;
          const bullValue = bullRow.bull;

          // Calculate percentage change for the outcome
          const bearChange = baseValue !== 0 ? ((bearValue - baseValue) / baseValue) * 100 : 0;
          const bullChange = baseValue !== 0 ? ((bullValue - baseValue) / baseValue) * 100 : 0;
          const avgChange = (Math.abs(bearChange) + Math.abs(bullChange)) / 2;

          // Format outcome change based on metric type
          const outcomeChange = this.formatOutcomeChange(
            baseRow.metric,
            avgChange,
            baseValue,
            bearValue,
            bullValue
          );

          elasticities.push({
            assumption: assumption.name,
            assumptionChange: `±${Math.round(context.scenarioPct * 100)}%`,
            outcomeMetric: baseRow.metric,
            outcomeChange,
            sensitivity: avgChange,
          });
        }
      });
    });

    // Sort by sensitivity (highest impact first) for tornado analysis
    return elasticities.sort((a, b) => b.sensitivity - a.sensitivity);
  }

  /**
   * Identify top 3-5 key drivers for tornado analysis based on sensitivity ranking
   */
  identifyKeyDrivers(elasticities: Elasticity[], ledger: AssumptionLedger): KeyDriver[] {
    const keyDrivers: KeyDriver[] = [];

    // Group elasticities by assumption to get max impact per assumption
    const assumptionImpacts = new Map<string, number>();
    elasticities.forEach(elasticity => {
      const currentMax = assumptionImpacts.get(elasticity.assumption) || 0;
      assumptionImpacts.set(elasticity.assumption, Math.max(currentMax, elasticity.sensitivity));
    });

    // Convert to array and sort by impact
    const sortedAssumptions = Array.from(assumptionImpacts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 key drivers

    // Create key drivers with detailed descriptions
    sortedAssumptions.forEach(([assumptionName, impact]) => {
      const assumption = ledger.assumptions.find(a => a.name === assumptionName);
      const assumptionId = assumption?.id || 'Unknown';

      // Find the most impactful elasticity for this assumption
      const topElasticity = elasticities
        .filter(e => e.assumption === assumptionName)
        .sort((a, b) => b.sensitivity - a.sensitivity)[0];

      keyDrivers.push({
        assumption: assumptionName,
        assumptionId,
        impact,
        description: this.generateKeyDriverDescription(assumptionName, topElasticity, assumption),
      });
    });

    return keyDrivers;
  }

  /**
   * Generate bear/base/bull scenario tables by perturbing top numeric assumptions ±20%
   */
  private async generateScenarios(
    context: ScenarioContext
  ): Promise<{ bear: ScenarioRow[]; base: ScenarioRow[]; bull: ScenarioRow[] }> {
    const { basicCalc, scenarioPct } = context;

    // Base case scenarios with all key financial metrics
    const baseMetrics = this.extractFinancialMetrics(basicCalc);

    // Create base scenarios
    const baseScenarios: ScenarioRow[] = baseMetrics.map(metric => ({
      metric: metric.name,
      base: metric.value,
      bear: metric.value, // Will be updated below
      bull: metric.value, // Will be updated below
      unit: metric.unit,
    }));

    // Generate bear scenarios (pessimistic case)
    const bearScenarios: ScenarioRow[] = baseScenarios.map(row => ({
      ...row,
      bear: this.applyScenarioChange(row.base as number, row.metric, 'bear', scenarioPct),
    }));

    // Generate bull scenarios (optimistic case)
    const bullScenarios: ScenarioRow[] = baseScenarios.map(row => ({
      ...row,
      bull: this.applyScenarioChange(row.base as number, row.metric, 'bull', scenarioPct),
    }));

    // Combine all scenarios with proper cross-references
    const scenarios = {
      bear: bearScenarios,
      base: baseScenarios,
      bull: bullScenarios,
    };

    return scenarios;
  }

  /**
   * Apply scenario percentage change to a metric
   */
  private applyScenarioChange(
    baseValue: number,
    metric: string,
    scenario: 'bear' | 'bull',
    scenarioPct: number
  ): number {
    if (baseValue === 0) return 0;

    const isPositiveMetric = ['Revenue', 'ROI', 'NPV'].includes(metric);
    const isCostMetric = metric === 'Costs';

    if (scenario === 'bear') {
      if (isPositiveMetric) {
        if (baseValue > 0) {
          // For positive values, bear case is worse (lower value)
          return Math.round(baseValue * (1 - scenarioPct));
        } else {
          // For negative values, bear case is worse (more negative = lower value)
          return Math.round(baseValue * (1 + scenarioPct));
        }
      } else if (isCostMetric) {
        // For costs, bear case is worse (higher costs)
        return Math.round(baseValue * (1 + scenarioPct));
      }
    } else if (scenario === 'bull') {
      if (isPositiveMetric) {
        if (baseValue > 0) {
          // For positive values, bull case is better (higher value)
          return Math.round(baseValue * (1 + scenarioPct));
        } else {
          // For negative values, bull case is better (less negative = higher value)
          return Math.round(baseValue * (1 - scenarioPct));
        }
      } else if (isCostMetric) {
        // For costs, bull case is better (lower costs)
        return Math.round(baseValue * (1 - scenarioPct));
      }
    }

    return baseValue;
  }

  /**
   * Validate mathematical consistency across all scenario projections
   */
  async validateScenarios(results: ScenarioResults): Promise<Result<boolean>> {
    return this.handleAsync(async () => {
      // Check that bear ≤ base ≤ bull for positive metrics (revenue, ROI, NPV)
      // Check that bear ≥ base ≥ bull for negative metrics (costs, risks)
      for (const baseRow of results.scenarios.base) {
        const bearRow = results.scenarios.bear.find(r => r.metric === baseRow.metric);
        const bullRow = results.scenarios.bull.find(r => r.metric === baseRow.metric);

        if (
          bearRow &&
          bullRow &&
          typeof baseRow.base === 'number' &&
          typeof bearRow.bear === 'number' &&
          typeof bullRow.bull === 'number'
        ) {
          const bearVal = bearRow.bear;
          const baseVal = baseRow.base;
          const bullVal = bullRow.bull;

          const isPositiveMetric = this.isPositiveMetric(baseRow.metric);
          const isCostMetric = this.isCostMetric(baseRow.metric);

          if (isPositiveMetric) {
            // For positive metrics: bear ≤ base ≤ bull (when base is positive)
            // But when base is negative (like negative ROI), bear should be more negative, bull less negative
            if (baseVal >= 0) {
              // Normal positive case: bear ≤ base ≤ bull
              if (!(bearVal <= baseVal && baseVal <= bullVal)) {
                throw new Error(
                  `Scenario consistency violation for positive metric ${baseRow.metric}: ` +
                    `bear(${bearVal}) <= base(${baseVal}) <= bull(${bullVal}) expected`
                );
              }
            } else {
              // Negative base case: bear ≤ base ≤ bull (more negative ≤ base ≤ less negative)
              if (!(bearVal <= baseVal && baseVal <= bullVal)) {
                throw new Error(
                  `Scenario consistency violation for negative positive metric ${baseRow.metric}: ` +
                    `bear(${bearVal}) <= base(${baseVal}) <= bull(${bullVal}) expected`
                );
              }
            }
          } else if (isCostMetric) {
            // For cost metrics: bear ≥ base ≥ bull (higher costs are worse)
            if (!(bearVal >= baseVal && baseVal >= bullVal)) {
              throw new Error(
                `Scenario consistency violation for cost metric ${baseRow.metric}: ` +
                  `bear(${bearVal}) >= base(${baseVal}) >= bull(${bullVal}) expected`
              );
            }
          }
        }
      }

      // Validate elasticity calculations are reasonable (not exceeding 1000% change)
      for (const elasticity of results.elasticities) {
        if (elasticity.sensitivity > 1000) {
          throw new Error(
            `Unrealistic elasticity detected: ${elasticity.assumption} → ${elasticity.outcomeMetric} ` +
              `shows ${elasticity.sensitivity}% sensitivity, which exceeds reasonable bounds`
          );
        }
      }

      // Validate key drivers are properly ranked
      for (let i = 0; i < results.keyDrivers.length - 1; i++) {
        if (results.keyDrivers[i].impact < results.keyDrivers[i + 1].impact) {
          throw new Error(
            `Key drivers not properly sorted by impact: ${results.keyDrivers[i].assumption} ` +
              `(${results.keyDrivers[i].impact}) should have higher impact than ` +
              `${results.keyDrivers[i + 1].assumption} (${results.keyDrivers[i + 1].impact})`
          );
        }
      }

      return true;
    }, 'SCENARIO_VALIDATION_ERROR');
  }

  /**
   * Get top numeric assumptions for scenario perturbation
   */
  private getTopNumericAssumptions(ledger: AssumptionLedger, topIds: string[]): Assumption[] {
    return ledger.assumptions
      .filter(assumption => {
        // Include if in topIds or if it's a critical numeric assumption
        const isInTopIds = topIds.includes(assumption.id);
        const isNumeric = typeof assumption.value === 'number';
        const isCritical = assumption.impact === 'critical';

        return (isInTopIds || isCritical) && isNumeric;
      })
      .slice(0, 7); // Limit to top 7 for manageable scenario complexity
  }

  /**
   * Extract financial metrics from the financial model
   */
  private extractFinancialMetrics(
    basicCalc: FinancialModel
  ): Array<{ name: string; value: number; unit: string }> {
    const metrics = [
      { name: 'Revenue', value: basicCalc.revenue, unit: 'USD' },
      { name: 'Costs', value: basicCalc.costs, unit: 'USD' },
      { name: 'ROI', value: basicCalc.roi, unit: '%' },
      { name: 'NPV', value: basicCalc.npv, unit: 'USD' },
    ];

    // Add any additional metrics from the financial model
    Object.entries(basicCalc).forEach(([key, value]) => {
      if (
        !['revenue', 'costs', 'roi', 'npv'].includes(key.toLowerCase()) &&
        typeof value === 'number'
      ) {
        metrics.push({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value,
          unit: this.inferUnit(key),
        });
      }
    });

    return metrics;
  }

  /**
   * Format outcome change based on metric type (percentage vs. percentage points)
   */
  private formatOutcomeChange(
    metric: string,
    avgChange: number,
    baseValue: number,
    bearValue: number,
    bullValue: number
  ): string {
    const isPercentageMetric =
      metric.toLowerCase().includes('roi') ||
      metric.toLowerCase().includes('rate') ||
      metric.toLowerCase().includes('margin');

    if (isPercentageMetric) {
      // For percentage metrics, show percentage points (pp)
      const avgAbsoluteChange =
        (Math.abs(bearValue - baseValue) + Math.abs(bullValue - baseValue)) / 2;
      return `±${Math.round(avgAbsoluteChange)}pp`;
    } else {
      // For other metrics, show percentage change
      return `±${Math.round(avgChange)}%`;
    }
  }

  /**
   * Generate descriptive text for key drivers
   */
  private generateKeyDriverDescription(
    assumptionName: string,
    topElasticity: Elasticity | undefined,
    assumption: Assumption | undefined
  ): string {
    if (!topElasticity) {
      return `${assumptionName} is a key driver with significant impact on business outcomes`;
    }

    const impactLevel =
      topElasticity.sensitivity > 50 ? 'high' : topElasticity.sensitivity > 25 ? 'moderate' : 'low';

    const categoryContext = assumption ? this.getCategoryContext(assumption.category) : '';

    return `${assumptionName} shows ${impactLevel} sensitivity (${topElasticity.outcomeChange} impact on ${topElasticity.outcomeMetric})${categoryContext}`;
  }

  /**
   * Get contextual description for assumption category
   */
  private getCategoryContext(category: Assumption['category']): string {
    switch (category) {
      case 'financial':
        return ' - critical for financial projections';
      case 'market':
        return ' - drives market opportunity sizing';
      case 'competitive':
        return ' - affects competitive positioning';
      case 'technical':
        return ' - impacts delivery timeline and costs';
      default:
        return '';
    }
  }

  /**
   * Check if a metric is positive (higher is better)
   */
  private isPositiveMetric(metric: string): boolean {
    const positiveMetrics = [
      'revenue',
      'profit',
      'roi',
      'npv',
      'margin',
      'growth',
      'users',
      'conversion',
      'retention',
      'satisfaction',
    ];
    return positiveMetrics.some(positive => metric.toLowerCase().includes(positive));
  }

  /**
   * Check if a metric is a cost metric (lower is better)
   */
  private isCostMetric(metric: string): boolean {
    const costMetrics = [
      'cost',
      'expense',
      'spend',
      'investment',
      'budget',
      'churn',
      'risk',
      'time',
      'effort',
    ];
    return costMetrics.some(cost => metric.toLowerCase().includes(cost));
  }

  /**
   * Infer unit for a metric based on its name
   */
  private inferUnit(metricName: string): string {
    const name = metricName.toLowerCase();

    if (
      name.includes('revenue') ||
      name.includes('cost') ||
      name.includes('npv') ||
      name.includes('value')
    ) {
      return 'USD';
    } else if (
      name.includes('rate') ||
      name.includes('roi') ||
      name.includes('margin') ||
      name.includes('percent')
    ) {
      return '%';
    } else if (name.includes('user') || name.includes('customer') || name.includes('count')) {
      return 'count';
    } else if (name.includes('time') || name.includes('day') || name.includes('month')) {
      return 'days';
    }

    return 'units';
  }
}
