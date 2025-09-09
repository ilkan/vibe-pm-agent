/**
 * Amazon Mode Manager
 * 
 * Manages integration between standard and Amazon Working Backwards modes
 * Provides backward compatibility while enabling Amazon methodology by default
 */

import { 
  AmazonModeConfig, 
  DEFAULT_AMAZON_CONFIG, 
  getConfigFromEnvironment, 
  mergeConfig 
} from '../../models/amazon-config';
import { 
  AssumptionLedgerService, 
  ConfidenceService, 
  ScenarioService, 
  HardQuestionsService,
  BusinessInputs 
} from '../../services/amazon';
import { AmazonTemplateProcessor } from '../amazon-template-processor';
import { MCPLogger } from '../../utils/mcp-error-handling';
import { performanceMonitor } from '../../utils/performance-monitor';

export interface AmazonModeResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  usedAmazonMode: boolean;
  fallbackReason?: string;
  performanceMetrics?: {
    assumptionLedgerTime?: number;
    confidenceTime?: number;
    scenarioTime?: number;
    hardQuestionsTime?: number;
    totalTime: number;
  };
}

export interface EnhancedContent {
  content: string;
  metadata: {
    confidenceScore?: number;
    assumptionCount?: number;
    coveragePercent?: number;
    scenarioCount?: number;
    hardQuestionCount?: number;
    usedAmazonMode: boolean;
    fallbackReason?: string;
  };
  attachments?: Array<{
    filename: string;
    content: string;
    type: 'assumptions' | 'citations' | 'scenarios';
  }>;
}

/**
 * Amazon Mode Manager
 * Orchestrates Amazon Working Backwards integration with fallback to standard mode
 */
export class AmazonModeManager {
  private config: AmazonModeConfig;
  private assumptionLedgerService: AssumptionLedgerService;
  private confidenceService: ConfidenceService;
  private scenarioService: ScenarioService;
  private hardQuestionsService: HardQuestionsService;
  private templateProcessor: AmazonTemplateProcessor;

  constructor(config?: Partial<AmazonModeConfig>) {
    // Merge configuration with environment overrides and defaults
    const envConfig = getConfigFromEnvironment();
    this.config = mergeConfig(DEFAULT_AMAZON_CONFIG, { ...envConfig, ...config });
    
    // Initialize Amazon mechanism services
    this.assumptionLedgerService = new AssumptionLedgerService();
    this.confidenceService = new ConfidenceService();
    this.scenarioService = new ScenarioService();
    this.hardQuestionsService = new HardQuestionsService();
    this.templateProcessor = new AmazonTemplateProcessor();
    
    MCPLogger.info('Amazon Mode Manager initialized', undefined, {
      enabled: this.config.enabled,
      fallbackEnabled: this.config.fallbackToStandard,
      evidenceMechanisms: this.config.includeEvidenceMechanisms,
    });
  }

  /**
   * Check if Amazon mode is enabled
   */
  public isAmazonModeEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current configuration
   */
  public getConfig(): AmazonModeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime
   */
  public updateConfig(updates: Partial<AmazonModeConfig>): void {
    this.config = mergeConfig(this.config, updates);
    MCPLogger.info('Amazon Mode Manager configuration updated', undefined, updates);
  }

  /**
   * Generate business case with Amazon methodology or fallback to standard
   */
  public async generateBusinessCase(
    opportunityAnalysis: string,
    financialInputs?: any,
    standardGenerator?: (analysis: string, inputs?: any) => Promise<string>
  ): Promise<AmazonModeResult<EnhancedContent>> {
    const startTime = Date.now();
    
    if (!this.config.enabled) {
      // Use standard mode
      if (standardGenerator) {
        try {
          const content = await standardGenerator(opportunityAnalysis, financialInputs);
          return {
            success: true,
            data: {
              content,
              metadata: {
                usedAmazonMode: false,
              },
            },
            usedAmazonMode: false,
            performanceMetrics: {
              totalTime: Date.now() - startTime,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error as Error,
            usedAmazonMode: false,
          };
        }
      }
      
      return {
        success: false,
        error: new Error('Amazon mode disabled and no standard generator provided'),
        usedAmazonMode: false,
      };
    }

    // Try Amazon mode with timeout and fallback
    try {
      const result = await this.executeWithTimeout(
        () => this.generateAmazonBusinessCase(opportunityAnalysis, financialInputs),
        this.config.performanceThresholds.totalTimeout
      );
      
      if (result.success) {
        return {
          ...result,
          usedAmazonMode: true,
          performanceMetrics: {
            ...result.performanceMetrics,
            totalTime: Date.now() - startTime,
          },
        };
      }
      
      // Amazon mode failed, try fallback if enabled
      if (this.config.fallbackToStandard && standardGenerator) {
        MCPLogger.warn('Amazon mode failed, falling back to standard mode', undefined, {
          error: result.error?.message,
        });
        
        const content = await standardGenerator(opportunityAnalysis, financialInputs);
        return {
          success: true,
          data: {
            content,
            metadata: {
              usedAmazonMode: false,
              fallbackReason: result.error?.message || 'Amazon mode execution failed',
            },
          },
          usedAmazonMode: false,
          fallbackReason: result.error?.message || 'Amazon mode execution failed',
          performanceMetrics: {
            totalTime: Date.now() - startTime,
          },
        };
      }
      
      return result;
    } catch (error) {
      // Timeout or other error, try fallback
      if (this.config.fallbackToStandard && standardGenerator) {
        MCPLogger.warn('Amazon mode timed out, falling back to standard mode', undefined, {
          error: (error as Error).message,
        });
        
        const content = await standardGenerator(opportunityAnalysis, financialInputs);
        return {
          success: true,
          data: {
            content,
            metadata: {
              usedAmazonMode: false,
              fallbackReason: (error as Error).message,
            },
          },
          usedAmazonMode: false,
          fallbackReason: (error as Error).message,
          performanceMetrics: {
            totalTime: Date.now() - startTime,
          },
        };
      }
      
      return {
        success: false,
        error: error as Error,
        usedAmazonMode: false,
      };
    }
  }

  /**
   * Generate stakeholder communication with Amazon methodology or fallback
   */
  public async generateStakeholderCommunication(
    businessCase: string,
    communicationType: string,
    audience: string,
    standardGenerator?: (businessCase: string, type: string, audience: string) => Promise<string>
  ): Promise<AmazonModeResult<EnhancedContent>> {
    const startTime = Date.now();
    
    if (!this.config.enabled) {
      // Use standard mode
      if (standardGenerator) {
        try {
          const content = await standardGenerator(businessCase, communicationType, audience);
          return {
            success: true,
            data: {
              content,
              metadata: {
                usedAmazonMode: false,
              },
            },
            usedAmazonMode: false,
            performanceMetrics: {
              totalTime: Date.now() - startTime,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error as Error,
            usedAmazonMode: false,
          };
        }
      }
      
      return {
        success: false,
        error: new Error('Amazon mode disabled and no standard generator provided'),
        usedAmazonMode: false,
      };
    }

    // Try Amazon mode
    try {
      const result = await this.executeWithTimeout(
        () => this.generateAmazonStakeholderCommunication(businessCase, communicationType, audience),
        this.config.performanceThresholds.totalTimeout
      );
      
      if (result.success) {
        return {
          ...result,
          usedAmazonMode: true,
          performanceMetrics: {
            ...result.performanceMetrics,
            totalTime: Date.now() - startTime,
          },
        };
      }
      
      // Amazon mode failed, try fallback
      if (this.config.fallbackToStandard && standardGenerator) {
        MCPLogger.warn('Amazon stakeholder communication failed, falling back to standard mode', undefined, {
          error: result.error?.message,
        });
        
        const content = await standardGenerator(businessCase, communicationType, audience);
        return {
          success: true,
          data: {
            content,
            metadata: {
              usedAmazonMode: false,
              fallbackReason: result.error?.message || 'Amazon mode execution failed',
            },
          },
          usedAmazonMode: false,
          fallbackReason: result.error?.message || 'Amazon mode execution failed',
          performanceMetrics: {
            totalTime: Date.now() - startTime,
          },
        };
      }
      
      return result;
    } catch (error) {
      // Timeout or other error, try fallback
      if (this.config.fallbackToStandard && standardGenerator) {
        MCPLogger.warn('Amazon stakeholder communication timed out, falling back to standard mode', undefined, {
          error: (error as Error).message,
        });
        
        const content = await standardGenerator(businessCase, communicationType, audience);
        return {
          success: true,
          data: {
            content,
            metadata: {
              usedAmazonMode: false,
              fallbackReason: (error as Error).message,
            },
          },
          usedAmazonMode: false,
          fallbackReason: (error as Error).message,
          performanceMetrics: {
            totalTime: Date.now() - startTime,
          },
        };
      }
      
      return {
        success: false,
        error: error as Error,
        usedAmazonMode: false,
      };
    }
  }

  /**
   * Enhance standard content with Amazon mechanisms (hybrid mode)
   */
  public async enhanceWithAmazonMechanisms(
    standardContent: string,
    businessInputs: BusinessInputs
  ): Promise<AmazonModeResult<EnhancedContent>> {
    if (!this.config.includeEvidenceMechanisms) {
      return {
        success: true,
        data: {
          content: standardContent,
          metadata: {
            usedAmazonMode: false,
          },
        },
        usedAmazonMode: false,
      };
    }

    try {
      const mechanisms = await this.generateEvidenceMechanisms(businessInputs);
      
      if (!mechanisms.success) {
        // Return standard content if mechanisms fail
        return {
          success: true,
          data: {
            content: standardContent,
            metadata: {
              usedAmazonMode: false,
              fallbackReason: 'Evidence mechanisms generation failed',
            },
          },
          usedAmazonMode: false,
          fallbackReason: 'Evidence mechanisms generation failed',
        };
      }

      const enhancedContent = this.appendEvidenceMechanisms(standardContent, mechanisms.data!);
      
      return {
        success: true,
        data: {
          content: enhancedContent,
          metadata: {
            confidenceScore: mechanisms.data!.confidence?.total,
            assumptionCount: mechanisms.data!.ledger?.assumptions?.length,
            coveragePercent: mechanisms.data!.ledger?.coverage_pct,
            scenarioCount: 3, // bear/base/bull
            hardQuestionCount: mechanisms.data!.hardQuestions?.length,
            usedAmazonMode: true,
          },
          attachments: mechanisms.data!.attachments,
        },
        usedAmazonMode: true,
        performanceMetrics: mechanisms.performanceMetrics,
      };
    } catch (error) {
      return {
        success: true,
        data: {
          content: standardContent,
          metadata: {
            usedAmazonMode: false,
            fallbackReason: (error as Error).message,
          },
        },
        usedAmazonMode: false,
        fallbackReason: (error as Error).message,
      };
    }
  }

  /**
   * Execute Amazon business case generation
   */
  private async generateAmazonBusinessCase(
    opportunityAnalysis: string,
    financialInputs?: any
  ): Promise<AmazonModeResult<EnhancedContent>> {
    // Extract business inputs from opportunity analysis
    const businessInputs = await this.extractBusinessInputs(opportunityAnalysis, financialInputs);
    
    // Generate evidence mechanisms
    const mechanisms = await this.generateEvidenceMechanisms(businessInputs);
    
    if (!mechanisms.success) {
      return {
        success: false,
        error: mechanisms.error,
        usedAmazonMode: true,
        performanceMetrics: mechanisms.performanceMetrics,
      };
    }

    // Generate business case content using standard pipeline
    // This would integrate with existing pipeline logic
    const baseContent = await this.generateBaseBusinessCase(opportunityAnalysis, financialInputs);
    
    // Enhance with Amazon mechanisms
    const enhancedContent = this.appendEvidenceMechanisms(baseContent, mechanisms.data!);
    
    return {
      success: true,
      data: {
        content: enhancedContent,
        metadata: {
          confidenceScore: mechanisms.data!.confidence?.total,
          assumptionCount: mechanisms.data!.ledger?.assumptions?.length,
          coveragePercent: mechanisms.data!.ledger?.coverage_pct,
          scenarioCount: 3,
          hardQuestionCount: mechanisms.data!.hardQuestions?.length,
          usedAmazonMode: true,
        },
        attachments: mechanisms.data!.attachments,
      },
      usedAmazonMode: true,
      performanceMetrics: mechanisms.performanceMetrics,
    };
  }

  /**
   * Execute Amazon stakeholder communication generation
   */
  private async generateAmazonStakeholderCommunication(
    businessCase: string,
    communicationType: string,
    audience: string
  ): Promise<AmazonModeResult<EnhancedContent>> {
    // Extract business inputs from business case
    const businessInputs = await this.extractBusinessInputsFromBusinessCase(businessCase);
    
    // Generate evidence mechanisms
    const mechanisms = await this.generateEvidenceMechanisms(businessInputs);
    
    if (!mechanisms.success) {
      return {
        success: false,
        error: mechanisms.error,
        usedAmazonMode: true,
        performanceMetrics: mechanisms.performanceMetrics,
      };
    }

    // Generate document using Amazon templates
    const templateContext = {
      featureName: businessInputs.featureName,
      customer: businessInputs.customer,
      problemOneLine: this.extractProblemStatement(businessCase),
      ledger: mechanisms.data!.ledger,
      confidence: mechanisms.data!.confidence,
      scenarios: mechanisms.data!.scenarios,
      hardQuestions: mechanisms.data!.hardQuestions,
      citations: businessInputs.citations || [],
      inputsHash: await this.generateInputsHash(businessInputs),
      isoTimestamp: new Date().toISOString(),
      shortHash: (await this.generateInputsHash(businessInputs)).slice(0, 8),
    };

    let content: string;
    switch (communicationType) {
      case 'pr_faq':
        content = this.templateProcessor.renderPRFAQ(templateContext);
        break;
      case 'executive_onepager':
        content = this.templateProcessor.renderDecisionOnePager(templateContext);
        break;
      default:
        // Generate basic document with mechanisms
        content = this.generateBasicDocument(templateContext, communicationType, audience);
        break;
    }
    
    return {
      success: true,
      data: {
        content,
        metadata: {
          confidenceScore: mechanisms.data!.confidence?.total,
          assumptionCount: mechanisms.data!.ledger?.assumptions?.length,
          coveragePercent: mechanisms.data!.ledger?.coverage_pct,
          scenarioCount: 3,
          hardQuestionCount: mechanisms.data!.hardQuestions?.length,
          usedAmazonMode: true,
        },
        attachments: mechanisms.data!.attachments,
      },
      usedAmazonMode: true,
      performanceMetrics: mechanisms.performanceMetrics,
    };
  }

  /**
   * Generate evidence mechanisms with performance monitoring
   */
  private async generateEvidenceMechanisms(businessInputs: BusinessInputs): Promise<AmazonModeResult<{
    ledger: any;
    confidence: any;
    scenarios: any;
    hardQuestions: any[];
    attachments: Array<{
      filename: string;
      content: string;
      type: 'assumptions' | 'citations' | 'scenarios';
    }>;
  }>> {
    const performanceMetrics: any = {};
    
    try {
      // 1. Generate assumption ledger
      let ledger;
      if (this.config.evidenceMechanisms.assumptionLedger) {
        const { result: ledgerResult, report } = await performanceMonitor.timeOperation(
          'assumption_ledger',
          () => this.assumptionLedgerService.normalizeLedger(businessInputs),
          JSON.stringify(businessInputs)
        );
        
        performanceMetrics.assumptionLedgerTime = report.actualDuration;
        
        if (!ledgerResult.success) {
          throw new Error(`Assumption ledger failed: ${ledgerResult.error?.message}`);
        }
        ledger = ledgerResult.data;
      }

      // 2. Generate confidence score
      let confidence;
      if (this.config.evidenceMechanisms.confidenceScoring && ledger) {
        const { result: confidenceResult, report } = await performanceMonitor.timeOperation(
          'confidence_scoring',
          () => this.confidenceService.computeConfidence({
            citations: businessInputs.citations || [],
            ledgerCoveragePct: ledger.coverage_pct,
            assumptionCount: ledger.assumptions.length,
            sensitivityRisk: 'medium' as const,
          }),
          JSON.stringify({ ledgerCoverage: ledger.coverage_pct })
        );
        
        performanceMetrics.confidenceTime = report.actualDuration;
        
        if (!confidenceResult.success) {
          throw new Error(`Confidence scoring failed: ${confidenceResult.error?.message}`);
        }
        confidence = confidenceResult.data;
      }

      // 3. Generate scenarios
      let scenarios;
      if (this.config.evidenceMechanisms.scenarioAnalysis && ledger) {
        const { result: scenarioResult, report } = await performanceMonitor.timeOperation(
          'scenario_analysis',
          () => this.scenarioService.runScenarios({
            ledger,
            basicCalc: this.extractFinancialModel(businessInputs),
            topIds: ledger.assumptions.slice(0, 5).map((a: any) => a.id),
            scenarioPct: 0.2,
          }),
          JSON.stringify({ assumptionCount: ledger.assumptions.length })
        );
        
        performanceMetrics.scenarioTime = report.actualDuration;
        
        if (!scenarioResult.success) {
          throw new Error(`Scenario analysis failed: ${scenarioResult.error?.message}`);
        }
        scenarios = scenarioResult.data;
      }

      // 4. Generate hard questions
      let hardQuestions: any[] = [];
      if (this.config.evidenceMechanisms.hardQuestions && ledger) {
        const { result: questionsResult, report } = await performanceMonitor.timeOperation(
          'hard_questions',
          () => this.hardQuestionsService.generateQuestions({
            ledger,
            weakestIds: ledger.assumptions
              .filter((a: any) => a.certainty === 'Low' || a.sourceUrls.length === 0)
              .slice(0, 5)
              .map((a: any) => a.id),
            businessContext: JSON.stringify(businessInputs),
            competitiveContext: businessInputs.competitors?.join(', '),
          }),
          JSON.stringify({ weakAssumptions: ledger.assumptions.length })
        );
        
        performanceMetrics.hardQuestionsTime = report.actualDuration;
        
        if (!questionsResult.success) {
          throw new Error(`Hard questions failed: ${questionsResult.error?.message}`);
        }
        hardQuestions = questionsResult.data || [];
      }

      // Create attachments
      const inputsHash = await this.generateInputsHash(businessInputs);
      const shortHash = inputsHash.slice(0, 8);
      
      const attachments = [
        {
          filename: `assumptions-${shortHash}.json`,
          content: JSON.stringify(ledger || {}, null, 2),
          type: 'assumptions' as const,
        },
        {
          filename: `citations-${shortHash}.json`,
          content: JSON.stringify(businessInputs.citations || [], null, 2),
          type: 'citations' as const,
        },
        {
          filename: `scenarios-${shortHash}.json`,
          content: JSON.stringify(scenarios || {}, null, 2),
          type: 'scenarios' as const,
        },
      ];

      return {
        success: true,
        data: {
          ledger,
          confidence,
          scenarios,
          hardQuestions,
          attachments,
        },
        usedAmazonMode: true,
        performanceMetrics,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        usedAmazonMode: true,
        performanceMetrics,
      };
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Append evidence mechanisms to content
   */
  private appendEvidenceMechanisms(content: string, mechanisms: any): string {
    const mechanismsSections = `

## Evidence Mechanisms

### Assumption Ledger

${this.generateAssumptionLedgerTable(mechanisms.ledger)}

**Coverage**: ${mechanisms.ledger?.coverage_pct || 0}% of business claims backed by documented assumptions

### Confidence Assessment

**Overall Confidence**: ${mechanisms.confidence?.total || 0}/100 ${mechanisms.confidence?.lowConfidence ? '⚠️ Human review recommended' : '✅'}

${mechanisms.confidence?.explanation || 'No confidence analysis available'}

### Scenario Analysis

${this.generateScenarioTable(mechanisms.scenarios)}

### Hard Questions

${mechanisms.hardQuestions?.map((q: any) => 
  `**Q${q.id}**: ${q.question}\n*Evidence needed*: ${q.evidenceNeeded?.join(', ') || 'None specified'}\n`
).join('\n') || 'No hard questions generated'}

### Citations

*Citations would be listed here based on assumption sources*
`;

    return content + mechanismsSections;
  }

  // Helper methods (simplified implementations)
  private async extractBusinessInputs(opportunityAnalysis: string, financialInputs?: any): Promise<BusinessInputs> {
    return {
      featureName: this.extractFeatureName(opportunityAnalysis) || 'New Feature',
      customer: this.extractCustomer(opportunityAnalysis) || 'Target Customer',
      competitors: this.extractCompetitors(opportunityAnalysis),
      devCost: financialInputs?.development_cost,
      opsCost: financialInputs?.operational_cost,
      marketSize: this.extractMarketSize(opportunityAnalysis),
      timeline: this.extractTimeline(opportunityAnalysis),
      citations: [],
      assumptions: this.extractAssumptions(opportunityAnalysis),
    };
  }

  private async extractBusinessInputsFromBusinessCase(businessCase: string): Promise<BusinessInputs> {
    return {
      featureName: this.extractFeatureName(businessCase) || 'Feature',
      customer: this.extractCustomer(businessCase) || 'Customer',
      competitors: this.extractCompetitors(businessCase),
      marketSize: this.extractMarketSize(businessCase),
      timeline: this.extractTimeline(businessCase),
      citations: [],
      assumptions: this.extractAssumptions(businessCase),
    };
  }

  private async generateBaseBusinessCase(opportunityAnalysis: string, financialInputs?: any): Promise<string> {
    // This would integrate with existing pipeline logic
    return `# Business Case\n\n${opportunityAnalysis}\n\n## Financial Analysis\n\n${JSON.stringify(financialInputs, null, 2)}`;
  }

  private generateBasicDocument(templateContext: any, communicationType: string, audience: string): string {
    return `# ${communicationType.replace('_', ' ').toUpperCase()}: ${templateContext.featureName}

## Overview
**Problem**: ${templateContext.problemOneLine}
**Confidence**: ${templateContext.confidence?.total || 0}/100

## Evidence Mechanisms
${this.generateAssumptionLedgerTable(templateContext.ledger)}

### Scenario Analysis
${this.generateScenarioTable(templateContext.scenarios)}

### Hard Questions
${templateContext.hardQuestions?.map((q: any) => `**Q${q.id}**: ${q.question}`).join('\n') || 'No questions generated'}`;
  }

  private generateAssumptionLedgerTable(ledger: any): string {
    if (!ledger?.assumptions) return 'No assumptions available';
    
    const header = '| ID | Name | Value | Certainty | Sources |\n|----|----|-------|-----------|---------|';
    const rows = ledger.assumptions.map((a: any) => 
      `| ${a.id} | ${a.name} | ${a.value} | ${a.certainty} | ${a.sourceUrls?.length || 0} |`
    ).join('\n');
    return header + '\n' + rows;
  }

  private generateScenarioTable(scenarios: any): string {
    if (!scenarios?.scenarios) return 'No scenarios available';
    
    const header = '| Metric | Bear | Base | Bull |\n|--------|------|------|------|';
    const rows = scenarios.scenarios.base?.map((row: any, i: number) => 
      `| ${row.metric} | ${scenarios.scenarios.bear?.[i]?.bear || 'N/A'} | **${row.base}** | ${scenarios.scenarios.bull?.[i]?.bull || 'N/A'} |`
    ).join('\n') || '';
    return header + '\n' + rows;
  }

  private extractProblemStatement(text: string): string {
    const patterns = [
      /problem:\s*([^\n.]+)/i,
      /challenge:\s*([^\n.]+)/i,
      /issue:\s*([^\n.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return 'Address key business challenges';
  }

  private extractFinancialModel(businessInputs: BusinessInputs): any {
    const revenue = businessInputs.marketSize || 1000000;
    const costs = businessInputs.devCost || 500000;
    return {
      revenue,
      costs,
      roi: ((revenue - costs) / costs) * 100,
      npv: revenue - costs,
    };
  }

  private async generateInputsHash(inputs: BusinessInputs): Promise<string> {
    const crypto = await import('crypto');
    const inputString = JSON.stringify(inputs, Object.keys(inputs).sort());
    return crypto.createHash('sha256').update(inputString).digest('hex');
  }

  // Simple extraction methods
  private extractFeatureName(text: string): string | undefined {
    const match = text.match(/(?:feature|product|solution):\s*([^\n.]+)/i);
    return match?.[1]?.trim();
  }

  private extractCustomer(text: string): string | undefined {
    const match = text.match(/(?:customer|user|target):\s*([^\n.]+)/i);
    return match?.[1]?.trim();
  }

  private extractCompetitors(text: string): string[] | undefined {
    const match = text.match(/(?:competitor|competition)s?:\s*([^\n.]+)/i);
    return match?.[1]?.split(',').map(c => c.trim());
  }

  private extractMarketSize(text: string): number | undefined {
    const match = text.match(/market size:\s*\$?([0-9,]+(?:\.[0-9]+)?)\s*([bmk]?)/i);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      const multiplier = match[2]?.toLowerCase();
      if (multiplier === 'b') return value * 1000000000;
      if (multiplier === 'm') return value * 1000000;
      if (multiplier === 'k') return value * 1000;
      return value;
    }
    return undefined;
  }

  private extractTimeline(text: string): string | undefined {
    const match = text.match(/(?:timeline|timeframe):\s*([^\n.]+)/i);
    return match?.[1]?.trim();
  }

  private extractAssumptions(text: string): string[] {
    const assumptions: string[] = [];
    const assumptionPatterns = [
      /assume[s]?\s+(?:that\s+)?([^.]+)/gi,
      /we believe\s+(?:that\s+)?([^.]+)/gi,
      /expect\s+(?:that\s+)?([^.]+)/gi,
      /estimate\s+(?:that\s+)?([^.]+)/gi
    ];
    
    assumptionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        assumptions.push(match[1].trim());
      }
    });
    
    return assumptions;
  }
}