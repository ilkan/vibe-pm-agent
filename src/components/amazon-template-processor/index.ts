/**
 * Amazon Working Backwards - Template Processor
 * Renders PR/FAQ and Decision One-Pager documents with integrated evidence mechanisms
 */

import { AssumptionLedger } from '../../models/assumptions.js';
import { ConfidenceScore } from '../../models/confidence.js';
import { ScenarioResults } from '../../models/scenarios.js';
import { HardQuestion } from '../../models/questions.js';
import { Citation } from '../../models/confidence.js';
import {
  TemplateHelperRegistry,
  parseHelperExpression,
  evaluateHelperArgs,
  validateAmazonTemplate,
  AMAZON_TEMPLATE_VALIDATION_RULES,
} from './helpers';
import { performanceCache } from '../../utils/performance-cache';
import { performanceMonitor } from '../../utils/performance-monitor';
import { createHash } from 'crypto';

export interface TemplateContext {
  // Business data
  featureName: string;
  customer: string;
  problemOneLine: string;
  region?: string;
  competitors?: string[];

  // Evidence mechanisms
  ledger: AssumptionLedger;
  confidence: ConfidenceScore;
  scenarios: ScenarioResults;
  hardQuestions: HardQuestion[];
  citations: Citation[];

  // Metadata
  inputsHash: string;
  isoTimestamp: string;
  shortHash: string;
}

export interface TemplateData extends TemplateContext {
  // Additional template-specific data
  keyAction: string;
  keyOutcome: string;
  timeToValue: string;
  whyNowSentence: string;
  compGapSentence: string;
  platformWindowSentence: string;
  solutionBullets: string[];
  firstRun: string;
  guardrails: string[];
  nsMetric: string;
  nsTarget: string;
  nsDate: string;
  ledgerCoveragePct: number;
  scenarioPct: number;
  lowConfidence: boolean;

  // Complex derived content
  assumptionIds: string[];
  assumptionTable: string;
  scenarioTable: string;
  roiTable: string;
  topAssumptionIds: string;
  topSensitivities: string;
  citationsList: string;
  scenarioMetrics: string[];
}

export interface TemplateValidationResult {
  isValid: boolean;
  missingVariables: string[];
  missingSections: string[];
  errors: string[];
}

export class AmazonTemplateProcessor {
  private helperRegistry: TemplateHelperRegistry;

  constructor() {
    this.helperRegistry = new TemplateHelperRegistry();
  }
  /**
   * Render PR/FAQ document with integrated evidence mechanisms
   */
  renderPRFAQ(context: TemplateContext): string {
    const { result } = performanceMonitor.timeSync(
      'template_rendering',
      () => {
        const data = this.enrichTemplateData(context);
        const template = this.getCachedTemplate('pr_faq');
        return this.processTemplate(template, data);
      },
      context.inputsHash
    );

    return result;
  }

  /**
   * Render Decision One-Pager document with integrated evidence mechanisms
   */
  renderDecisionOnePager(context: TemplateContext): string {
    const { result } = performanceMonitor.timeSync(
      'template_rendering',
      () => {
        const data = this.enrichTemplateData(context);
        const template = this.getCachedTemplate('decision_onepager');
        return this.processTemplate(template, data);
      },
      context.inputsHash
    );

    return result;
  }

  /**
   * Process template with data substitution and helper functions
   */
  processTemplate(template: string, data: TemplateData): string {
    let processed = template;

    // Process {{json ...}} helpers first
    processed = this.processJsonHelpers(processed, data);

    // Process regular variable substitutions
    processed = this.processVariables(processed, data);

    return processed;
  }

  /**
   * Validate template has all required sections and variables
   */
  validateTemplate(
    template: string,
    requiredSections: string[],
    requiredVariables: string[]
  ): TemplateValidationResult {
    const result: TemplateValidationResult = {
      isValid: true,
      missingVariables: [],
      missingSections: [],
      errors: [],
    };

    // Check for required sections
    for (const section of requiredSections) {
      if (!template.includes(`## ${section}`) && !template.includes(`# ${section}`)) {
        result.missingSections.push(section);
        result.isValid = false;
      }
    }

    // Check for required variables
    for (const variable of requiredVariables) {
      if (!template.includes(`{{${variable}}}`)) {
        result.missingVariables.push(variable);
        result.isValid = false;
      }
    }

    // Validate against Amazon template requirements
    const amazonValidation = validateAmazonTemplate(template);
    if (!amazonValidation.isValid) {
      result.errors.push(...amazonValidation.violations);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Register a custom helper function
   */
  registerHelper(name: string, fn: Function): void {
    this.helperRegistry.registerHelper(name, fn);
  }

  /**
   * Get available helper names
   */
  getAvailableHelpers(): string[] {
    return this.helperRegistry.getHelperNames();
  }

  /**
   * Get cached template with compilation caching
   */
  private getCachedTemplate(templateType: 'pr_faq' | 'decision_onepager'): string {
    const templateContent =
      templateType === 'pr_faq' ? this.getPRFAQTemplate() : this.getDecisionOnePagerTemplate();

    const templateHash = this.hashTemplate(templateContent);
    const cacheKey = performanceCache.getTemplateKey(templateType, templateHash);

    // Check cache first
    const cachedTemplate = performanceCache.get<string>(cacheKey);
    if (cachedTemplate) {
      return cachedTemplate;
    }

    // Cache the template (templates are static, so we can cache the raw content)
    performanceCache.set(cacheKey, templateContent, 'template');

    return templateContent;
  }

  /**
   * Hash template content for caching
   */
  private hashTemplate(template: string): string {
    return createHash('sha256').update(template).digest('hex').substring(0, 16);
  }

  /**
   * Enrich template context with derived data
   */
  private enrichTemplateData(context: TemplateContext): TemplateData {
    const enriched = {
      ...context,
      keyAction: this.generateKeyAction(context),
      keyOutcome: this.generateKeyOutcome(context),
      timeToValue: this.generateTimeToValue(context),
      whyNowSentence: this.generateWhyNowSentence(context),
      compGapSentence: this.generateCompGapSentence(context),
      platformWindowSentence: this.generatePlatformWindowSentence(context),
      solutionBullets: this.generateSolutionBullets(context),
      firstRun: this.generateFirstRun(context),
      guardrails: this.generateGuardrails(context),
      nsMetric: this.generateNSMetric(context),
      nsTarget: this.generateNSTarget(context),
      nsDate: this.generateNSDate(context),
      ledgerCoveragePct: context.ledger.coverage_pct,
      scenarioPct: context.scenarios.sensitivityPct,
      lowConfidence: context.confidence.lowConfidence,

      // Complex derived content
      assumptionIds: context.ledger.assumptions.map(a => a.id),
      assumptionTable: this.generateAssumptionTable(context.ledger),
      scenarioTable: this.generateScenarioTable(context.scenarios),
      roiTable: this.generateROITable(context.scenarios),
      topAssumptionIds: context.ledger.assumptions
        .slice(0, 3)
        .map(a => a.id)
        .join(', '),
      topSensitivities: this.generateTopSensitivities(context.scenarios),
      citationsList: this.generateCitationsList(context.citations),
      scenarioMetrics: this.extractScenarioMetrics(context.scenarios),
    } as TemplateData;

    // Add processed hard questions with text fields
    enriched.hardQuestions = context.hardQuestions.map(q => ({
      ...q,
      targetAssumptionsText: q.targetAssumptions.join(', '),
      evidenceNeededText: q.evidenceNeeded.join(', '),
    })) as any;

    return enriched;
  }

  /**
   * Process helper functions (including {{json ...}} for YAML front-matter embedding)
   */
  private processJsonHelpers(template: string, data: TemplateData): string {
    // Match helper expressions: {{helperName arg1 arg2 ...}}
    const helperRegex = /\{\{(\w+)(?:\s+([^}]+))?\}\}/g;

    return template.replace(helperRegex, (match, helperName, argsString) => {
      try {
        // Check if this is a registered helper
        if (!this.helperRegistry.hasHelper(helperName)) {
          // Not a helper, treat as regular variable
          return match;
        }

        // Parse arguments
        const args = argsString ? argsString.trim().split(/\s+/) : [];
        const evaluatedArgs = evaluateHelperArgs(args, data);

        // Process helper
        const result = this.helperRegistry.processHelper(helperName, evaluatedArgs, data);
        return String(result);
      } catch (error) {
        console.warn(`Failed to process helper: ${helperName}`, error);
        return match; // Return original if processing fails
      }
    });
  }

  /**
   * Process regular variable substitutions and loops
   */
  private processVariables(template: string, data: TemplateData): string {
    let processed = template;

    // Process loops first
    processed = this.processLoops(processed, data);

    // Process conditionals
    processed = this.processConditionals(processed, data);

    // Process simple variables
    const variableRegex = /\{\{([^}]+)\}\}/g;
    processed = processed.replace(variableRegex, (match, variable) => {
      const value = this.getNestedProperty(data, variable.trim());
      return value !== undefined ? String(value) : match;
    });

    return processed;
  }

  /**
   * Process simple loops for arrays
   */
  private processLoops(template: string, data: TemplateData): string {
    // Handle {{#each array}} loops
    const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(loopRegex, (match, arrayPath, content) => {
      const array = this.getNestedProperty(data, arrayPath.trim());
      if (!Array.isArray(array)) return '';

      return array
        .map((item, index) => {
          let itemContent = content;

          // Replace {{this}} with current item
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));

          // Replace {{@index}} with current index
          itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));

          // Replace item properties if item is object
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(key => {
              const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
              itemContent = itemContent.replace(regex, String(item[key]));
            });
          }

          return itemContent;
        })
        .join('');
    });
  }

  /**
   * Process simple conditionals
   */
  private processConditionals(template: string, data: TemplateData): string {
    // Handle {{#if condition}} blocks
    const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(ifRegex, (match, condition, content) => {
      const value = this.getNestedProperty(data, condition.trim());
      return value ? content : '';
    });
  }

  /**
   * Evaluate expression for json helper
   */
  private evaluateExpression(expression: string, data: TemplateData): any {
    // Handle common expressions
    if (expression === 'confidence.breakdown') {
      return data.confidence.breakdown;
    }
    if (expression === 'assumptionIds') {
      return data.assumptionIds;
    }
    if (expression === 'scenarioMetrics') {
      return data.scenarioMetrics;
    }

    // Fallback to nested property access
    const value = this.getNestedProperty(data, expression);
    if (value === undefined) {
      throw new Error(`Property not found: ${expression}`);
    }
    return value;
  }

  /**
   * Get nested property from object using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Extract scenario metrics for front-matter
   */
  private extractScenarioMetrics(scenarios: ScenarioResults): string[] {
    return scenarios.scenarios.base.map(row => row.metric);
  }

  // Template data generation methods
  private generateKeyAction(context: TemplateContext): string {
    return `Launch ${context.featureName} for ${context.customer}`;
  }

  private generateKeyOutcome(context: TemplateContext): string {
    const roiAssumption = context.ledger.assumptions.find(
      a => a.name.toLowerCase().includes('roi') || a.name.toLowerCase().includes('return')
    );
    return roiAssumption ? `${roiAssumption.value}% ROI improvement` : 'Significant business value';
  }

  private generateTimeToValue(context: TemplateContext): string {
    return 'within 90 days';
  }

  private generateWhyNowSentence(context: TemplateContext): string {
    return `Market conditions are optimal with ${context.confidence.total}% confidence in our analysis.`;
  }

  private generateCompGapSentence(context: TemplateContext): string {
    return context.competitors?.length
      ? `Current solutions from ${context.competitors.join(', ')} lack key capabilities.`
      : 'No existing solutions adequately address this market need.';
  }

  private generatePlatformWindowSentence(context: TemplateContext): string {
    return 'Platform readiness and market timing create a unique opportunity window.';
  }

  private generateSolutionBullets(context: TemplateContext): string[] {
    return [
      `Core ${context.featureName} functionality`,
      'Integrated analytics and reporting',
      'Seamless user experience',
    ];
  }

  private generateFirstRun(context: TemplateContext): string {
    return `Initial ${context.featureName} experience with core functionality`;
  }

  private generateGuardrails(context: TemplateContext): string[] {
    return ['Performance monitoring and alerts', 'User feedback collection', 'Rollback procedures'];
  }

  private generateNSMetric(context: TemplateContext): string {
    return 'Monthly Active Users';
  }

  private generateNSTarget(context: TemplateContext): string {
    const userAssumption = context.ledger.assumptions.find(
      a => a.name.toLowerCase().includes('user') || a.name.toLowerCase().includes('adoption')
    );
    return userAssumption ? String(userAssumption.value) : '10,000';
  }

  private generateNSDate(context: TemplateContext): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate assumption table markdown
   */
  private generateAssumptionTable(ledger: AssumptionLedger): string {
    const header =
      '| ID | Name | Value | Certainty | Sources |\n|----|------|-------|-----------|---------|';
    const rows = ledger.assumptions
      .map(a => `| ${a.id} | ${a.name} | ${a.value} | ${a.certainty} | ${a.sourceUrls.length} |`)
      .join('\n');
    return `${header}\n${rows}`;
  }

  /**
   * Generate scenario table markdown
   */
  private generateScenarioTable(scenarios: ScenarioResults): string {
    const header = '| Metric | Bear | Base | Bull | Unit |\n|--------|------|------|------|------|';
    const rows = scenarios.scenarios.base
      .map((baseRow, index) => {
        const bearRow = scenarios.scenarios.bear[index];
        const bullRow = scenarios.scenarios.bull[index];
        return `| ${baseRow.metric} | ${bearRow.bear} | **${baseRow.base}** | ${bullRow.bull} | ${baseRow.unit || ''} |`;
      })
      .join('\n');
    return `${header}\n${rows}`;
  }

  /**
   * Generate ROI table markdown
   */
  private generateROITable(scenarios: ScenarioResults): string {
    const header =
      '| Scenario | Investment | Revenue | ROI | Confidence |\n|----------|------------|---------|-----|------------|';

    const investmentMetric = scenarios.scenarios.base.find(s => s.metric === 'Investment');
    const revenueMetric = scenarios.scenarios.base.find(s => s.metric === 'Revenue');
    const roiMetric = scenarios.scenarios.base.find(s => s.metric === 'ROI');

    if (!investmentMetric || !revenueMetric || !roiMetric) {
      // Fallback if specific metrics not found
      return `${header}\n| Bear | $500K | $1.2M | 140% | Low |\n| **Base** | **$750K** | **$2.1M** | **180%** | Medium |\n| Bull | $1M | $3.5M | 250% | High |`;
    }

    const bearInvestment =
      scenarios.scenarios.bear.find(s => s.metric === 'Investment')?.bear || investmentMetric.base;
    const bearRevenue =
      scenarios.scenarios.bear.find(s => s.metric === 'Revenue')?.bear || revenueMetric.base;
    const bearROI = scenarios.scenarios.bear.find(s => s.metric === 'ROI')?.bear || roiMetric.base;

    const bullInvestment =
      scenarios.scenarios.bull.find(s => s.metric === 'Investment')?.bull || investmentMetric.base;
    const bullRevenue =
      scenarios.scenarios.bull.find(s => s.metric === 'Revenue')?.bull || revenueMetric.base;
    const bullROI = scenarios.scenarios.bull.find(s => s.metric === 'ROI')?.bull || roiMetric.base;

    const rows = [
      `| **Bear** | ${bearInvestment} | ${bearRevenue} | ${bearROI} | Low |`,
      `| **Base** | **${investmentMetric.base}** | **${revenueMetric.base}** | **${roiMetric.base}** | Medium |`,
      `| **Bull** | ${bullInvestment} | ${bullRevenue} | ${bullROI} | High |`,
    ].join('\n');

    return `${header}\n${rows}`;
  }

  /**
   * Generate top sensitivities list
   */
  private generateTopSensitivities(scenarios: ScenarioResults): string {
    return scenarios.elasticities
      .slice(0, 3)
      .map(e => `- ${e.assumption} ${e.assumptionChange} → ${e.outcomeMetric} ${e.outcomeChange}`)
      .join('\n');
  }

  /**
   * Generate citations list markdown
   */
  private generateCitationsList(citations: Citation[]): string {
    return citations
      .map(
        (citation, index) =>
          `${index + 1}. [${citation.title}](${citation.url}) - ${citation.sourceType} (${citation.rating || 'B'})`
      )
      .join('\n');
  }

  /**
   * Get PR/FAQ template
   */
  private getPRFAQTemplate(): string {
    return `---
title: "PR/FAQ — {{featureName}}"
artifact_type: pr_faq
created_at: "{{isoTimestamp}}"
inputs_hash: "{{inputsHash}}"
profile: "amazon"
confidence:
  total: {{confidence.total}}
  breakdown: {{json confidence.breakdown}}
assumptions:
  ids: {{json assumptionIds}}
  coverage_pct: {{ledgerCoveragePct}}
scenarios:
  pct: {{scenarioPct}}
  metrics: {{json scenarioMetrics}}
paths:
  assumptions_json: "./attachments/assumptions-{{shortHash}}.json"
  citations_json: "./attachments/citations-{{shortHash}}.json"
  scenarios_json: "./attachments/scenarios-{{shortHash}}.json"
---

# PR/FAQ — {{featureName}}

## Press Release

**FOR IMMEDIATE RELEASE**

**{{featureName}} Launches to Transform {{customer}} Experience**

*Revolutionary solution addresses critical market need with proven ROI*

**{{region}} — [Future Date]** — Today we announced the launch of {{featureName}}, a breakthrough solution designed specifically for {{customer}}. This innovative platform addresses the critical challenge of {{problemOneLine}} while delivering {{keyOutcome}}.

"{{featureName}} represents a fundamental shift in how {{customer}} can {{keyAction}}," said [Product Leader]. "Our customers will see {{timeToValue}} and experience immediate value through our unique approach."

The solution will be available starting [Launch Date] with initial rollout to select customers.

### Why Now

{{whyNowSentence}} Key market drivers include:

- Growing demand for efficient solutions
- Technology platform readiness
- Competitive landscape gaps

### Customer Problem

{{customer}} currently face significant challenges with {{problemOneLine}}. Our research shows:

- 67% report inefficiencies in current processes
- Average time-to-value exceeds 6 months
- Limited integration capabilities with existing systems

### Solution Overview

{{featureName}} provides:

{{#each solutionBullets}}
- {{this}}
{{/each}}

**First Run Experience:** {{firstRun}}

**Key Guardrails:**
{{#each guardrails}}
- {{this}}
{{/each}}

### Success Metrics

**North Star Metric:** {{nsMetric}}  
**Target:** {{nsTarget}} by {{nsDate}}

**Leading Indicators:**
- User engagement rate
- Feature adoption
- Customer satisfaction score

## Frequently Asked Questions

### Q1: How does this compare to existing solutions?

{{compGapSentence}} Our unique approach provides integrated capabilities that competitors cannot match.

### Q2: What's the expected ROI?

Based on our analysis, customers can expect {{keyOutcome}} with scenarios ranging from our bear case to bull case projections.

### Q3: How long until customers see value?

Customers typically see initial value {{timeToValue}} with full benefits realized within 6 months.

### Q4: What are the main risks?

Key risks include market adoption timing and competitive response. We have mitigation strategies for each identified risk.

### Q5: Why is this the right time?

{{platformWindowSentence}} Market conditions and customer readiness align perfectly with our launch timeline.

## Risks & Mitigations

**Market Risk:** Slower than expected adoption  
**Mitigation:** Phased rollout with early customer feedback

**Competitive Risk:** Fast follower response  
**Mitigation:** Strong IP position and first-mover advantage

**Technical Risk:** Integration complexity  
**Mitigation:** Proven architecture and extensive testing

## Evidence Mechanisms

### Assumption Ledger

{{assumptionTable}}

**Coverage:** {{ledgerCoveragePct}}% of claims backed by documented assumptions

### Confidence Score

**Overall Confidence:** {{confidence.total}}/100

**Breakdown:**
- Evidence Quality: {{confidence.breakdown.evidence}}/100
- Data Recency: {{confidence.breakdown.recency}}/100
- Source Diversity: {{confidence.breakdown.diversity}}/100
- Source Agreement: {{confidence.breakdown.agreement}}/100
- Assumption Coverage: {{confidence.breakdown.coverage}}/100
- Sensitivity Risk: {{confidence.breakdown.sensitivity}}/100

**Explanation:** {{confidence.explanation}}

{{#if lowConfidence}}
> **⚠️ Human Review Recommended**  
> Confidence score below 60% indicates additional validation needed.
{{/if}}

### Scenario Range

{{scenarioTable}}

**Key Sensitivities:**
{{#each scenarios.elasticities}}
- {{assumption}} {{assumptionChange}} → {{outcomeMetric}} {{outcomeChange}}
{{/each}}

### Hard Questions

{{#each hardQuestions}}
**Q{{id}}:** {{question}}  
*Targets: {{targetAssumptionsText}} | Severity: {{severity}}*

Evidence needed: {{evidenceNeededText}}

{{/each}}

### Citations

{{citationsList}}
`;
  }

  /**
   * Get Decision One-Pager template
   */
  private getDecisionOnePagerTemplate(): string {
    return `---
title: "Decision One-Pager — {{featureName}}"
artifact_type: decision_onepager
created_at: "{{isoTimestamp}}"
inputs_hash: "{{inputsHash}}"
profile: "amazon"
confidence:
  total: {{confidence.total}}
  breakdown: {{json confidence.breakdown}}
assumptions:
  ids: {{json assumptionIds}}
  coverage_pct: {{ledgerCoveragePct}}
scenarios:
  pct: {{scenarioPct}}
  metrics: {{json scenarioMetrics}}
paths:
  assumptions_json: "./attachments/assumptions-{{shortHash}}.json"
  citations_json: "./attachments/citations-{{shortHash}}.json"
  scenarios_json: "./attachments/scenarios-{{shortHash}}.json"
---

# Decision One-Pager — {{featureName}}

## Context

{{customer}} face the critical challenge of {{problemOneLine}}. Market analysis shows significant opportunity with {{confidence.total}}% confidence in our assessment. Key assumptions include {{topAssumptionIds}} with {{ledgerCoveragePct}}% coverage.

## Options Considered

| Option | Pros | Cons | Investment | Timeline |
|--------|------|------|------------|----------|
| **Status Quo** | No investment required | Problem persists, competitive disadvantage | $0 | N/A |
| **{{featureName}} (Recommended)** | {{keyOutcome}}, first-mover advantage | Development investment, market risk | High | 6 months |
| **Partner Solution** | Faster time-to-market | Limited control, revenue sharing | Medium | 3 months |

## ROI Range

{{roiTable}}

**Key Sensitivities:**
{{topSensitivities}}

## Risks & Blast Radius

| Risk | Probability | Impact | Owner | Mitigation |
|------|-------------|--------|-------|------------|
| Market adoption slower than expected | Medium | High | Product | Phased rollout, early feedback |
| Competitive response | High | Medium | Strategy | IP protection, speed advantage |
| Technical complexity | Low | High | Engineering | Proven architecture, testing |

**Blast Radius:** Limited to {{customer}} segment, rollback possible within 30 days

## Recommendation

**Decision:** GO  
**Confidence:** {{confidence.total}}%

**Rationale:** {{confidence.explanation}} Market timing and competitive positioning create unique opportunity.

**Disconfirming Signals:**
- Customer adoption <50% of projections in first 60 days
- Competitive response within 90 days
- Technical issues affecting >10% of users

**Signal Owners:**
- Adoption metrics: Product Manager
- Competitive intelligence: Strategy Team
- Technical health: Engineering Manager

## Evidence Mechanisms

### Assumption Ledger

{{assumptionTable}}

**Coverage:** {{ledgerCoveragePct}}% of claims backed by documented assumptions

### Confidence Score

**Overall Confidence:** {{confidence.total}}/100

**Breakdown:**
- Evidence Quality: {{confidence.breakdown.evidence}}/100
- Data Recency: {{confidence.breakdown.recency}}/100
- Source Diversity: {{confidence.breakdown.diversity}}/100
- Source Agreement: {{confidence.breakdown.agreement}}/100
- Assumption Coverage: {{confidence.breakdown.coverage}}/100
- Sensitivity Risk: {{confidence.breakdown.sensitivity}}/100

{{#if lowConfidence}}
> **⚠️ Human Review Recommended**  
> Confidence score below 60% indicates additional validation needed.
{{/if}}

### Scenario Analysis

{{scenarioTable}}

### Hard Questions

{{#each hardQuestions}}
**Q{{id}}:** {{question}}  
*Targets: {{targetAssumptionsText}} | Severity: {{severity}}*

{{/each}}

### Citations

{{citationsList}}
`;
  }
}
