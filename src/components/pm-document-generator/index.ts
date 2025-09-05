// PM Document Generator component for executive-ready documents
// Generates management one-pagers, PR-FAQs, requirements, design options, and task plans

import {
  validateManagementOnePagerInputs,
  validatePRFAQInputs,
  validateRequirementsGenerationInputs,
  validateDesignOptionsInputs,
  validateTaskPlanInputs,
  PMDocumentValidationError
} from '../../utils/pm-document-validation';
import {
  PMDocumentFallbackProvider,
  PMDocumentErrorRecovery,
  PMDocumentGenerationError
} from '../../utils/pm-document-error-handling';

export interface ManagementOnePager {
  answer: string; // 1-line decision and timing
  because: string[]; // 3 core reasons
  whatScopeToday: string[]; // scope bullets
  risksAndMitigations: RiskMitigation[]; // 3 key risks with mitigations
  options: {
    conservative: OptionSummary;
    balanced: OptionSummary; // marked as recommended
    bold: OptionSummary;
  };
  roiSnapshot: ROITable;
  rightTimeRecommendation: string; // 2-4 lines
  competitivePositioning?: CompetitivePositioning; // Enhanced with competitive insights
}

export interface RiskMitigation {
  risk: string;
  mitigation: string;
}

export interface OptionSummary {
  name: string;
  summary: string;
  recommended?: boolean;
}

export interface ROITable {
  options: {
    conservative: ROIRow;
    balanced: ROIRow;
    bold: ROIRow;
  };
}

export interface ROIRow {
  effort: 'Low' | 'Med' | 'High';
  impact: 'Med' | 'High' | 'VeryH';
  estimatedCost: string;
  timing: 'Now' | 'Later';
}

export interface PRFAQ {
  pressRelease: {
    date: string;
    headline: string;
    subHeadline: string;
    body: string; // problem, solution, why now, customer quote, availability
  };
  faq: FAQItem[]; // exactly the 10 required questions
  launchChecklist: ChecklistItem[];
  competitiveDifferentiation?: CompetitiveDifferentiation; // Enhanced with competitive insights
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ChecklistItem {
  task: string;
  owner: string;
  dueDate: string;
  dependencies?: string[];
}

export interface CompetitivePositioning {
  marketPosition: string;
  keyDifferentiators: string[];
  competitiveAdvantages: string[];
  marketGaps: string[];
  strategicRecommendations: string[];
}

export interface CompetitiveDifferentiation {
  uniqueValueProposition: string;
  competitorComparison: CompetitorComparison[];
  marketDifferentiators: string[];
  competitiveAdvantages: string[];
}

export interface CompetitiveVisualization {
  mermaidDiagram: string;
  exportData: CompetitiveExportData;
  visualizationType: 'matrix' | 'positioning' | 'swot';
}

export interface CompetitiveExportData {
  format: 'json' | 'csv' | 'markdown';
  data: any;
  filename: string;
  timestamp: string;
}

export interface CompetitorComparison {
  competitorName: string;
  ourAdvantage: string;
  theirWeakness: string;
  differentiationStrategy: string;
}

export interface PMRequirements {
  businessGoal: string; // WHY - 1-3 lines
  userNeeds: {
    jobs: string[];
    pains: string[];
    gains: string[];
  };
  functionalRequirements: string[]; // WHAT
  constraintsRisks: string[];
  priority: {
    must: PriorityItem[];
    should: PriorityItem[];
    could: PriorityItem[];
    wont: PriorityItem[];
  };
  rightTimeVerdict: {
    decision: 'do_now' | 'do_later';
    reasoning: string;
  };
}

export interface PriorityItem {
  requirement: string;
  justification: string; // 1-line justification
}

export interface DesignOptions {
  problemFraming: string; // why now - 3-5 lines
  options: {
    conservative: DesignOption;
    balanced: DesignOption; // recommended
    bold: DesignOption; // zero-based
  };
  impactEffortMatrix: ImpactEffortMatrix;
  rightTimeRecommendation: string; // 2-4 lines
}

export interface DesignOption {
  name: string;
  summary: string;
  keyTradeoffs: string[];
  impact: 'Low' | 'Medium' | 'High';
  effort: 'Low' | 'Medium' | 'High';
  majorRisks: string[];
}

export interface ImpactEffortMatrix {
  highImpactLowEffort: DesignOption[];
  highImpactHighEffort: DesignOption[];
  lowImpactLowEffort: DesignOption[];
  lowImpactHighEffort: DesignOption[];
}

export interface TaskPlan {
  guardrailsCheck: GuardrailsTask; // Task 0 - fail fast if limits exceeded
  immediateWins: Task[]; // 1-3 tasks
  shortTerm: Task[]; // 3-6 tasks
  longTerm: Task[]; // 2-4 tasks
}

export interface GuardrailsTask extends Task {
  limits: {
    maxVibes?: number;
    maxSpecs?: number;
    budgetUSD?: number;
  };
  checkCriteria: string[];
}

export interface Task {
  id: string;
  name: string;
  description: string;
  acceptanceCriteria: string[];
  effort: 'S' | 'M' | 'L';
  impact: 'Low' | 'Med' | 'High';
  priority: 'Must' | 'Should' | 'Could' | 'Won\'t';
}

// Input interfaces for PM document generation
export interface ROIInputs {
  cost_naive?: number;
  cost_balanced?: number;
  cost_bold?: number;
}

export interface RequirementsContext {
  roadmapTheme?: string;
  budget?: number;
  quotas?: {
    maxVibes?: number;
    maxSpecs?: number;
  };
  deadlines?: string;
}

export interface TaskLimits {
  maxVibes?: number;
  maxSpecs?: number;
  budgetUSD?: number;
}

/**
 * PM Document Generator class for creating executive-ready documents
 * Applies Pyramid Principle, MoSCoW prioritization, and Impact vs Effort analysis
 */
export class PMDocumentGenerator {
  /**
   * Generate management one-pager with answer-first Pyramid Principle structure
   * Enhanced with competitive positioning insights
   */
  async generateManagementOnePager(
    requirements: string,
    design: string,
    tasks?: string,
    roiInputs?: ROIInputs,
    competitiveAnalysis?: any,
    marketSizing?: any
  ): Promise<ManagementOnePager> {
    return PMDocumentErrorRecovery.recoverFromError(
      async () => {
        // Validate inputs
        validateManagementOnePagerInputs(requirements, design, tasks, roiInputs);

        // Sanitize inputs
        const sanitizedRequirements = PMDocumentErrorRecovery.sanitizeInput(requirements, 'requirements');
        const sanitizedDesign = PMDocumentErrorRecovery.sanitizeInput(design, 'design');
        const sanitizedTasks = tasks ? PMDocumentErrorRecovery.sanitizeInput(tasks, 'tasks', 30000) : undefined;

        // Apply Pyramid Principle: Answer first, then reasons, then evidence
        const answer = this.extractDecisionAndTiming(sanitizedRequirements, sanitizedDesign);
        const because = this.extractCoreReasons(sanitizedRequirements, sanitizedDesign);
        const whatScopeToday = this.extractScopeItems(sanitizedRequirements, sanitizedDesign, sanitizedTasks);
        const risksAndMitigations = this.identifyRisksAndMitigations(sanitizedRequirements, sanitizedDesign);
        const options = this.generateThreeOptions(sanitizedRequirements, sanitizedDesign);
        const roiSnapshot = this.generateROISnapshot(options, roiInputs);
        const rightTimeRecommendation = this.generateTimingRecommendation(sanitizedRequirements, sanitizedDesign);
        
        // Generate competitive positioning if competitive analysis is available
        const competitivePositioning = competitiveAnalysis ? 
          this.generateCompetitivePositioning(competitiveAnalysis, marketSizing) : 
          undefined;

        return {
          answer,
          because,
          whatScopeToday,
          risksAndMitigations,
          options,
          roiSnapshot,
          rightTimeRecommendation,
          competitivePositioning
        };
      },
      () => PMDocumentFallbackProvider.generateFallbackManagementOnePager(requirements, design),
      {
        documentType: 'management_onepager',
        operation: 'generation',
        inputs: { requirements, design, tasks, roiInputs }
      }
    );
  }

  /**
   * Generate Amazon-style PR-FAQ with future-dated press release
   * Enhanced with competitive differentiation insights
   */
  async generatePRFAQ(
    requirements: string,
    design: string,
    targetDate?: string,
    competitiveAnalysis?: any,
    marketSizing?: any
  ): Promise<PRFAQ> {
    return PMDocumentErrorRecovery.recoverFromError(
      async () => {
        // Validate inputs
        validatePRFAQInputs(requirements, design, targetDate);

        // Sanitize inputs
        const sanitizedRequirements = PMDocumentErrorRecovery.sanitizeInput(requirements, 'requirements');
        const sanitizedDesign = PMDocumentErrorRecovery.sanitizeInput(design, 'design');
        
        const launchDate = targetDate || this.getDefaultLaunchDate();
        
        const pressRelease = this.generatePressRelease(sanitizedRequirements, sanitizedDesign, launchDate, competitiveAnalysis);
        const faq = this.generateFAQ(sanitizedRequirements, sanitizedDesign, competitiveAnalysis);
        const launchChecklist = this.generateLaunchChecklist(sanitizedRequirements, sanitizedDesign, launchDate);
        
        // Generate competitive differentiation if competitive analysis is available
        const competitiveDifferentiation = competitiveAnalysis ? 
          this.generateCompetitiveDifferentiation(competitiveAnalysis, marketSizing) : 
          undefined;

        return {
          pressRelease,
          faq,
          launchChecklist,
          competitiveDifferentiation
        };
      },
      () => PMDocumentFallbackProvider.generateFallbackPRFAQ(requirements, design, targetDate),
      {
        documentType: 'pr_faq',
        operation: 'generation',
        inputs: { requirements, design, targetDate }
      }
    );
  }

  /**
   * Generate structured requirements with MoSCoW prioritization
   */
  async generateRequirements(
    rawIntent: string,
    context?: RequirementsContext
  ): Promise<PMRequirements> {
    return PMDocumentErrorRecovery.recoverFromError(
      async () => {
        // Validate inputs
        validateRequirementsGenerationInputs(rawIntent, context);

        // Sanitize inputs
        const sanitizedRawIntent = PMDocumentErrorRecovery.sanitizeInput(rawIntent, 'rawIntent', 10000);

        const businessGoal = this.extractBusinessGoal(sanitizedRawIntent);
        const userNeeds = this.analyzeUserNeeds(sanitizedRawIntent);
        const functionalRequirements = this.extractFunctionalRequirements(sanitizedRawIntent);
        const constraintsRisks = this.identifyConstraintsAndRisks(sanitizedRawIntent, context);
        const priority = this.applyMoSCoWPrioritization(functionalRequirements);
        const rightTimeVerdict = this.generateRightTimeVerdict(sanitizedRawIntent, context);

        return {
          businessGoal,
          userNeeds,
          functionalRequirements,
          constraintsRisks,
          priority,
          rightTimeVerdict
        };
      },
      () => PMDocumentFallbackProvider.generateFallbackRequirements(rawIntent, context),
      {
        documentType: 'requirements_generation',
        operation: 'generation',
        inputs: { rawIntent, context }
      }
    );
  }

  /**
   * Generate design options with Impact vs Effort analysis
   */
  async generateDesignOptions(requirements: string): Promise<DesignOptions> {
    return PMDocumentErrorRecovery.recoverFromError(
      async () => {
        // Validate inputs
        validateDesignOptionsInputs(requirements);

        // Sanitize inputs
        const sanitizedRequirements = PMDocumentErrorRecovery.sanitizeInput(requirements, 'requirements');

        const problemFraming = this.generateProblemFraming(sanitizedRequirements);
        const options = this.generateThreeDesignOptions(sanitizedRequirements);
        const impactEffortMatrix = this.createImpactEffortMatrix([
          options.conservative,
          options.balanced,
          options.bold
        ]);
        const rightTimeRecommendation = this.generateDesignTimingRecommendation(sanitizedRequirements, options);

        return {
          problemFraming,
          options,
          impactEffortMatrix,
          rightTimeRecommendation
        };
      },
      () => PMDocumentFallbackProvider.generateFallbackDesignOptions(requirements),
      {
        documentType: 'design_options',
        operation: 'generation',
        inputs: { requirements }
      }
    );
  }

  /**
   * Generate phased task plan with guardrails
   */
  async generateTaskPlan(design: string, limits?: TaskLimits): Promise<TaskPlan> {
    return PMDocumentErrorRecovery.recoverFromError(
      async () => {
        // Validate inputs
        validateTaskPlanInputs(design, limits);

        // Sanitize inputs
        const sanitizedDesign = PMDocumentErrorRecovery.sanitizeInput(design, 'design');

        const guardrailsCheck = this.generateGuardrailsCheck(sanitizedDesign, limits);
        const allTasks = this.extractTasksFromDesign(sanitizedDesign);
        const categorizedTasks = this.categorizeTasksByPhase(allTasks);

        return {
          guardrailsCheck,
          immediateWins: categorizedTasks.immediateWins,
          shortTerm: categorizedTasks.shortTerm,
          longTerm: categorizedTasks.longTerm
        };
      },
      () => PMDocumentFallbackProvider.generateFallbackTaskPlan(design, limits),
      {
        documentType: 'task_plan',
        operation: 'generation',
        inputs: { design, limits }
      }
    );
  }

  /**
   * Apply Pyramid Principle structuring to content
   * Answer first, then reasons, then evidence
   */
  protected applyPyramidPrinciple<T>(content: T): T {
    // Utility method for Pyramid Principle structuring
    // Implementation details will be added as needed in subtasks
    return content;
  }

  /**
   * Generate competitive positioning section for management one-pager
   */
  protected generateCompetitivePositioning(competitiveAnalysis: any, marketSizing?: any): CompetitivePositioning {
    const competitors = competitiveAnalysis.competitiveMatrix?.competitors || [];
    const strategicRecommendations = competitiveAnalysis.strategicRecommendations || [];
    const marketGaps = competitiveAnalysis.marketPositioning?.marketGaps || [];

    // Extract market position from competitive analysis
    const marketPosition = this.extractMarketPosition(competitors, marketSizing);
    
    // Identify key differentiators from competitive matrix
    const keyDifferentiators = this.extractKeyDifferentiators(competitiveAnalysis);
    
    // Extract competitive advantages from SWOT analysis
    const competitiveAdvantages = this.extractCompetitiveAdvantages(competitiveAnalysis);
    
    // Format market gaps as opportunities
    const formattedMarketGaps = marketGaps.map((gap: any) => 
      typeof gap === 'string' ? gap : gap.description || 'Market opportunity identified'
    );
    
    // Format strategic recommendations
    const formattedRecommendations = strategicRecommendations.slice(0, 3).map((rec: any) => 
      typeof rec === 'string' ? rec : rec.title || rec.description || 'Strategic recommendation'
    );

    return {
      marketPosition,
      keyDifferentiators,
      competitiveAdvantages,
      marketGaps: formattedMarketGaps,
      strategicRecommendations: formattedRecommendations
    };
  }

  /**
   * Generate competitive differentiation section for PR-FAQ
   */
  protected generateCompetitiveDifferentiation(competitiveAnalysis: any, marketSizing?: any): CompetitiveDifferentiation {
    const competitors = competitiveAnalysis.competitiveMatrix?.competitors || [];
    const strategicRecommendations = competitiveAnalysis.strategicRecommendations || [];

    // Generate unique value proposition
    const uniqueValueProposition = this.generateUniqueValueProposition(competitiveAnalysis, marketSizing);
    
    // Create competitor comparisons
    const competitorComparison = this.generateCompetitorComparisons(competitors);
    
    // Extract market differentiators
    const marketDifferentiators = this.extractMarketDifferentiators(competitiveAnalysis);
    
    // Extract competitive advantages
    const competitiveAdvantages = this.extractCompetitiveAdvantages(competitiveAnalysis);

    return {
      uniqueValueProposition,
      competitorComparison,
      marketDifferentiators,
      competitiveAdvantages
    };
  }

  /**
   * Extract market position from competitive analysis and market sizing
   */
  private extractMarketPosition(competitors: any[], marketSizing?: any): string {
    if (marketSizing?.som?.value) {
      const somValue = marketSizing.som.value;
      const marketSize = somValue > 1000000000 ? 'large' : somValue > 100000000 ? 'medium' : 'small';
      return `Targeting ${marketSize} market opportunity with differentiated positioning against ${competitors.length} key competitors`;
    }
    
    if (competitors.length === 0) {
      return 'First-mover advantage in emerging market with limited competition';
    } else if (competitors.length <= 3) {
      return 'Competitive market with opportunity for differentiation';
    } else {
      return 'Mature market requiring strong differentiation strategy';
    }
  }

  /**
   * Extract key differentiators from competitive analysis
   */
  private extractKeyDifferentiators(competitiveAnalysis: any): string[] {
    const differentiators: string[] = [];
    
    // Extract from competitive matrix differentiation opportunities
    const opportunities = competitiveAnalysis.competitiveMatrix?.differentiationOpportunities || [];
    differentiators.push(...opportunities.slice(0, 2));
    
    // Extract from strategic recommendations
    const recommendations = competitiveAnalysis.strategicRecommendations || [];
    recommendations.slice(0, 2).forEach((rec: any) => {
      if (rec.type === 'differentiation' && rec.title) {
        differentiators.push(rec.title);
      }
    });
    
    // Default differentiators if none found
    if (differentiators.length === 0) {
      differentiators.push('Superior user experience and functionality');
      differentiators.push('Competitive pricing with premium features');
    }
    
    return differentiators.slice(0, 3);
  }

  /**
   * Extract competitive advantages from analysis
   */
  private extractCompetitiveAdvantages(competitiveAnalysis: any): string[] {
    const advantages: string[] = [];
    
    // Extract from market positioning
    const positioning = competitiveAnalysis.marketPositioning?.recommendedPositioning || [];
    advantages.push(...positioning.slice(0, 2));
    
    // Extract from SWOT analysis strengths
    const swotAnalysis = competitiveAnalysis.swotAnalysis || [];
    if (swotAnalysis.length > 0) {
      const ourStrengths = swotAnalysis[0]?.strengths || [];
      ourStrengths.slice(0, 2).forEach((strength: any) => {
        advantages.push(strength.description || strength);
      });
    }
    
    // Default advantages if none found
    if (advantages.length === 0) {
      advantages.push('Technology leadership and innovation');
      advantages.push('Strong customer focus and support');
    }
    
    return advantages.slice(0, 3);
  }

  /**
   * Generate unique value proposition
   */
  private generateUniqueValueProposition(competitiveAnalysis: any, marketSizing?: any): string {
    const differentiators = this.extractKeyDifferentiators(competitiveAnalysis);
    const advantages = this.extractCompetitiveAdvantages(competitiveAnalysis);
    
    if (marketSizing?.som?.value) {
      const marketValue = (marketSizing.som.value / 1000000).toFixed(0);
      return `Unique solution addressing ${marketValue}M market opportunity through ${differentiators[0]?.toLowerCase() || 'innovative approach'} and ${advantages[0]?.toLowerCase() || 'superior execution'}`;
    }
    
    return `Differentiated solution combining ${differentiators[0]?.toLowerCase() || 'innovative features'} with ${advantages[0]?.toLowerCase() || 'competitive advantages'} to deliver superior customer value`;
  }

  /**
   * Generate competitor comparisons
   */
  private generateCompetitorComparisons(competitors: any[]): CompetitorComparison[] {
    return competitors.slice(0, 3).map((competitor: any) => {
      const weaknesses = competitor.weaknesses || ['Limited innovation', 'High pricing'];
      const strengths = competitor.strengths || ['Market presence'];
      
      return {
        competitorName: competitor.name || 'Key Competitor',
        ourAdvantage: this.generateOurAdvantage(weaknesses[0]),
        theirWeakness: weaknesses[0] || 'Limited differentiation',
        differentiationStrategy: this.generateDifferentiationStrategy(weaknesses[0], strengths[0])
      };
    });
  }

  /**
   * Generate our advantage based on competitor weakness
   */
  private generateOurAdvantage(competitorWeakness: string): string {
    const advantageMap: { [key: string]: string } = {
      'high pricing': 'Competitive pricing with superior value',
      'limited features': 'Comprehensive feature set',
      'poor user experience': 'Intuitive and user-friendly design',
      'slow innovation': 'Rapid innovation and feature development',
      'limited support': 'Exceptional customer support and service',
      'complex implementation': 'Simple and fast implementation',
      'legacy systems': 'Modern, cloud-native architecture'
    };
    
    const weakness = competitorWeakness?.toLowerCase() || '';
    for (const [key, advantage] of Object.entries(advantageMap)) {
      if (weakness.includes(key)) {
        return advantage;
      }
    }
    
    return 'Superior technology and customer focus';
  }

  /**
   * Generate differentiation strategy
   */
  private generateDifferentiationStrategy(weakness: string, strength: string): string {
    return `Leverage our ${this.generateOurAdvantage(weakness).toLowerCase()} to compete against their ${strength?.toLowerCase() || 'market position'} while addressing their ${weakness?.toLowerCase() || 'limitations'}`;
  }

  /**
   * Extract market differentiators
   */
  private extractMarketDifferentiators(competitiveAnalysis: any): string[] {
    const differentiators: string[] = [];
    
    // Extract from competitive matrix
    const opportunities = competitiveAnalysis.competitiveMatrix?.differentiationOpportunities || [];
    differentiators.push(...opportunities.slice(0, 2));
    
    // Extract from market gaps
    const marketGaps = competitiveAnalysis.marketPositioning?.marketGaps || [];
    marketGaps.slice(0, 2).forEach((gap: any) => {
      const description = typeof gap === 'string' ? gap : gap.description;
      if (description) {
        differentiators.push(`Address ${description.toLowerCase()}`);
      }
    });
    
    // Default differentiators
    if (differentiators.length === 0) {
      differentiators.push('First-to-market with innovative solution');
      differentiators.push('Superior customer experience and support');
    }
    
    return differentiators.slice(0, 3);
  }

  /**
   * Generate competitive comparison answer for FAQ
   */
  private generateCompetitiveComparisonAnswer(competitiveAnalysis?: any): string {
    if (!competitiveAnalysis) {
      return 'Unlike manual optimization or basic automation tools, we provide consulting-grade analysis with multiple optimization strategies, comprehensive ROI analysis, and seamless AI agent integration through MCP protocol.';
    }

    const competitors = competitiveAnalysis.competitiveMatrix?.competitors || [];
    const advantages = this.extractCompetitiveAdvantages(competitiveAnalysis);
    const differentiators = this.extractKeyDifferentiators(competitiveAnalysis);

    let answer = 'Our solution stands out from alternatives in several key ways: ';

    // Add competitive advantages
    if (advantages.length > 0) {
      answer += `${advantages[0]}, `;
    }

    // Add key differentiators
    if (differentiators.length > 0) {
      answer += `${differentiators[0]?.toLowerCase()}, `;
    }

    // Add specific competitor comparisons
    if (competitors.length > 0) {
      const topCompetitor = competitors[0];
      const weakness = topCompetitor.weaknesses?.[0] || 'limited capabilities';
      answer += `and unlike ${topCompetitor.name || 'leading competitors'} which suffers from ${weakness.toLowerCase()}, `;
    }

    answer += 'we provide consulting-grade analysis with comprehensive ROI insights and seamless AI agent integration.';

    return answer;
  }

  /**
   * Generate competitive matrix visualization with Mermaid diagram
   */
  generateCompetitiveVisualization(
    competitiveAnalysis: any,
    visualizationType: 'matrix' | 'positioning' | 'swot' = 'matrix'
  ): CompetitiveVisualization {
    let mermaidDiagram: string;
    let exportData: CompetitiveExportData;

    switch (visualizationType) {
      case 'matrix':
        mermaidDiagram = this.generateCompetitiveMatrixDiagram(competitiveAnalysis);
        exportData = this.generateCompetitiveMatrixExport(competitiveAnalysis);
        break;
      case 'positioning':
        mermaidDiagram = this.generatePositioningMapDiagram(competitiveAnalysis);
        exportData = this.generatePositioningExport(competitiveAnalysis);
        break;
      case 'swot':
        mermaidDiagram = this.generateSWOTDiagram(competitiveAnalysis);
        exportData = this.generateSWOTExport(competitiveAnalysis);
        break;
      default:
        mermaidDiagram = this.generateCompetitiveMatrixDiagram(competitiveAnalysis);
        exportData = this.generateCompetitiveMatrixExport(competitiveAnalysis);
    }

    return {
      mermaidDiagram,
      exportData,
      visualizationType
    };
  }

  /**
   * Generate Mermaid diagram for competitive matrix
   */
  private generateCompetitiveMatrixDiagram(competitiveAnalysis: any): string {
    const competitors = competitiveAnalysis.competitiveMatrix?.competitors || [];
    const criteria = competitiveAnalysis.competitiveMatrix?.evaluationCriteria || [];
    
    if (competitors.length === 0) {
      return `graph TD
        A[No Competitive Data Available]
        A --> B[Conduct Market Research]
        B --> C[Identify Key Competitors]
        C --> D[Analyze Competitive Positioning]`;
    }

    let diagram = `graph TD
    subgraph "Competitive Matrix"
        CM[Competitive Analysis]`;

    // Add competitors
    competitors.slice(0, 5).forEach((competitor: any, index: number) => {
      const compId = `C${index + 1}`;
      const marketShare = competitor.marketShare || 0;
      const shareSize = marketShare > 30 ? 'Large' : marketShare > 15 ? 'Medium' : 'Small';
      
      diagram += `
        ${compId}["${competitor.name}<br/>Market Share: ${marketShare}%<br/>Size: ${shareSize}"]`;
      
      // Add strengths
      if (competitor.strengths && competitor.strengths.length > 0) {
        const strengthId = `S${index + 1}`;
        diagram += `
        ${strengthId}["Strengths:<br/>${competitor.strengths.slice(0, 2).join('<br/>')}"]
        ${compId} --> ${strengthId}`;
      }
      
      // Add weaknesses
      if (competitor.weaknesses && competitor.weaknesses.length > 0) {
        const weaknessId = `W${index + 1}`;
        diagram += `
        ${weaknessId}["Weaknesses:<br/>${competitor.weaknesses.slice(0, 2).join('<br/>')}"]
        ${compId} --> ${weaknessId}`;
      }
    });

    // Add our solution
    diagram += `
        US["Our Solution<br/>Competitive Advantages"]
        US --> ADV["${this.extractCompetitiveAdvantages(competitiveAnalysis).slice(0, 2).join('<br/>')}"]`;

    diagram += `
    end`;

    return diagram;
  }

  /**
   * Generate Mermaid diagram for market positioning
   */
  private generatePositioningMapDiagram(competitiveAnalysis: any): string {
    const competitors = competitiveAnalysis.competitiveMatrix?.competitors || [];
    const marketGaps = competitiveAnalysis.marketPositioning?.marketGaps || [];

    let diagram = `graph LR
    subgraph "Market Positioning Map"
        subgraph "Price Axis"
            LP[Low Price] --- HP[High Price]
        end
        subgraph "Features Axis"
            BF[Basic Features] --- AF[Advanced Features]
        end`;

    // Position competitors
    competitors.slice(0, 4).forEach((competitor: any, index: number) => {
      const compId = `COMP${index + 1}`;
      const pricing = competitor.pricing?.startingPrice || 50;
      const features = competitor.keyFeatures?.length || 3;
      
      const pricePos = pricing > 100 ? 'High' : 'Low';
      const featurePos = features > 5 ? 'Advanced' : 'Basic';
      
      diagram += `
        ${compId}["${competitor.name}<br/>${pricePos} Price<br/>${featurePos} Features"]`;
    });

    // Add market gaps as opportunities
    if (marketGaps.length > 0) {
      diagram += `
        GAP1["Market Gap:<br/>${marketGaps[0]?.description || marketGaps[0] || 'Opportunity Identified'}"]
        GAP1 -.-> OPP["Our Opportunity"]`;
    }

    diagram += `
    end`;

    return diagram;
  }

  /**
   * Generate Mermaid diagram for SWOT analysis
   */
  private generateSWOTDiagram(competitiveAnalysis: any): string {
    const swotAnalysis = competitiveAnalysis.swotAnalysis?.[0] || {};
    const strengths = swotAnalysis.strengths?.slice(0, 3) || [];
    const weaknesses = swotAnalysis.weaknesses?.slice(0, 3) || [];
    const opportunities = swotAnalysis.opportunities?.slice(0, 3) || [];
    const threats = swotAnalysis.threats?.slice(0, 3) || [];

    let diagram = `graph TD
    subgraph "SWOT Analysis"
        subgraph "Internal Factors"
            S[Strengths]
            W[Weaknesses]
        end
        subgraph "External Factors"
            O[Opportunities]
            T[Threats]
        end`;

    // Add strengths
    strengths.forEach((strength: any, index: number) => {
      const strengthText = typeof strength === 'string' ? strength : strength.description || 'Strength identified';
      diagram += `
        S${index + 1}["${strengthText}"]
        S --> S${index + 1}`;
    });

    // Add weaknesses
    weaknesses.forEach((weakness: any, index: number) => {
      const weaknessText = typeof weakness === 'string' ? weakness : weakness.description || 'Weakness identified';
      diagram += `
        W${index + 1}["${weaknessText}"]
        W --> W${index + 1}`;
    });

    // Add opportunities
    opportunities.forEach((opportunity: any, index: number) => {
      const opportunityText = typeof opportunity === 'string' ? opportunity : opportunity.description || 'Opportunity identified';
      diagram += `
        O${index + 1}["${opportunityText}"]
        O --> O${index + 1}`;
    });

    // Add threats
    threats.forEach((threat: any, index: number) => {
      const threatText = typeof threat === 'string' ? threat : threat.description || 'Threat identified';
      diagram += `
        T${index + 1}["${threatText}"]
        T --> T${index + 1}`;
    });

    diagram += `
    end`;

    return diagram;
  }

  /**
   * Generate export data for competitive matrix
   */
  private generateCompetitiveMatrixExport(competitiveAnalysis: any): CompetitiveExportData {
    const competitors = competitiveAnalysis?.competitiveMatrix?.competitors || [];
    const rankings = competitiveAnalysis?.competitiveMatrix?.rankings || [];
    
    const exportData = {
      competitiveMatrix: {
        competitors: competitors.map((comp: any) => ({
          name: comp.name,
          marketShare: comp.marketShare,
          strengths: comp.strengths,
          weaknesses: comp.weaknesses,
          keyFeatures: comp.keyFeatures,
          pricing: comp.pricing
        })),
        rankings: rankings.map((rank: any) => ({
          competitorName: rank.competitorName,
          overallScore: rank.overallScore,
          rank: rank.rank,
          competitiveAdvantage: rank.competitiveAdvantage
        })),
        differentiationOpportunities: competitiveAnalysis?.competitiveMatrix?.differentiationOpportunities || []
      },
      generatedAt: new Date().toISOString(),
      analysisType: 'competitive_matrix'
    };

    return {
      format: 'json',
      data: exportData,
      filename: `competitive-matrix-${new Date().toISOString().split('T')[0]}.json`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate export data for positioning map
   */
  private generatePositioningExport(competitiveAnalysis: any): CompetitiveExportData {
    const positioning = competitiveAnalysis?.marketPositioning || {};
    
    const exportData = {
      marketPositioning: {
        positioningMap: positioning.positioningMap || {},
        competitorPositions: positioning.competitorPositions || [],
        marketGaps: positioning.marketGaps || [],
        recommendedPositioning: positioning.recommendedPositioning || []
      },
      generatedAt: new Date().toISOString(),
      analysisType: 'market_positioning'
    };

    return {
      format: 'json',
      data: exportData,
      filename: `market-positioning-${new Date().toISOString().split('T')[0]}.json`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate export data for SWOT analysis
   */
  private generateSWOTExport(competitiveAnalysis: any): CompetitiveExportData {
    const swotAnalysis = competitiveAnalysis?.swotAnalysis || [];
    
    const exportData = {
      swotAnalysis: swotAnalysis.map((swot: any) => ({
        competitorName: swot.competitorName,
        strengths: swot.strengths || [],
        weaknesses: swot.weaknesses || [],
        opportunities: swot.opportunities || [],
        threats: swot.threats || [],
        strategicImplications: swot.strategicImplications || []
      })),
      generatedAt: new Date().toISOString(),
      analysisType: 'swot_analysis'
    };

    return {
      format: 'json',
      data: exportData,
      filename: `swot-analysis-${new Date().toISOString().split('T')[0]}.json`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export competitive analysis data in multiple formats
   */
  exportCompetitiveData(
    competitiveAnalysis: any,
    format: 'json' | 'csv' | 'markdown' = 'json'
  ): CompetitiveExportData {
    const competitors = competitiveAnalysis?.competitiveMatrix?.competitors || [];
    
    switch (format) {
      case 'csv':
        return this.generateCSVExport(competitors);
      case 'markdown':
        return this.generateMarkdownExport(competitiveAnalysis);
      default:
        return this.generateCompetitiveMatrixExport(competitiveAnalysis);
    }
  }

  /**
   * Generate CSV export for competitive data
   */
  private generateCSVExport(competitors: any[]): CompetitiveExportData {
    const headers = ['Name', 'Market Share', 'Strengths', 'Weaknesses', 'Key Features'];
    const rows = competitors.map(comp => [
      comp.name || '',
      comp.marketShare || 0,
      (comp.strengths || []).join('; '),
      (comp.weaknesses || []).join('; '),
      (comp.keyFeatures || []).join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return {
      format: 'csv',
      data: csvContent,
      filename: `competitive-analysis-${new Date().toISOString().split('T')[0]}.csv`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate Markdown export for competitive analysis
   */
  private generateMarkdownExport(competitiveAnalysis: any): CompetitiveExportData {
    const competitors = competitiveAnalysis?.competitiveMatrix?.competitors || [];
    const strategicRecommendations = competitiveAnalysis?.strategicRecommendations || [];
    
    let markdown = `# Competitive Analysis Report

Generated on: ${new Date().toLocaleDateString()}

## Executive Summary

This report provides a comprehensive analysis of the competitive landscape, including competitor profiles, market positioning, and strategic recommendations.

## Competitive Matrix

| Competitor | Market Share | Key Strengths | Key Weaknesses |
|------------|--------------|---------------|----------------|
`;

    competitors.forEach((comp: any) => {
      const strengths = (comp.strengths || []).slice(0, 2).join(', ');
      const weaknesses = (comp.weaknesses || []).slice(0, 2).join(', ');
      markdown += `| ${comp.name || 'Unknown'} | ${comp.marketShare || 0}% | ${strengths} | ${weaknesses} |\n`;
    });

    markdown += `\n## Strategic Recommendations\n\n`;
    
    strategicRecommendations.slice(0, 5).forEach((rec: any, index: number) => {
      const title = typeof rec === 'string' ? rec : rec.title || rec.description || 'Strategic recommendation';
      markdown += `${index + 1}. ${title}\n`;
    });

    markdown += `\n## Market Gaps and Opportunities\n\n`;
    
    const marketGaps = competitiveAnalysis?.marketPositioning?.marketGaps || [];
    marketGaps.slice(0, 3).forEach((gap: any, index: number) => {
      const description = typeof gap === 'string' ? gap : gap.description || 'Market opportunity identified';
      markdown += `- ${description}\n`;
    });

    return {
      format: 'markdown',
      data: markdown,
      filename: `competitive-analysis-${new Date().toISOString().split('T')[0]}.md`,
      timestamp: new Date().toISOString()
    };
  }



  /**
   * Create Impact vs Effort matrix for design options
   */
  protected createImpactEffortMatrix(options: DesignOption[]): ImpactEffortMatrix {
    const matrix: ImpactEffortMatrix = {
      highImpactLowEffort: [],
      highImpactHighEffort: [],
      lowImpactLowEffort: [],
      lowImpactHighEffort: []
    };

    options.forEach(option => {
      const isHighImpact = option.impact === 'High';
      const isLowEffort = option.effort === 'Low';

      if (isHighImpact && isLowEffort) {
        matrix.highImpactLowEffort.push(option);
      } else if (isHighImpact && !isLowEffort) {
        matrix.highImpactHighEffort.push(option);
      } else if (!isHighImpact && isLowEffort) {
        matrix.lowImpactLowEffort.push(option);
      } else {
        matrix.lowImpactHighEffort.push(option);
      }
    });

    return matrix;
  }

  /**
   * Extract business goal from raw intent (WHY - 1-3 lines)
   */
  protected extractBusinessGoal(rawIntent: string): string {
    const intent = rawIntent.toLowerCase();
    
    if (intent.includes('quota') && intent.includes('cost')) {
      return 'Reduce developer workflow costs by 40-60% through intelligent quota optimization while maintaining full functionality and improving user experience.';
    } else if (intent.includes('optimization') && intent.includes('workflow')) {
      return 'Transform inefficient manual workflows into optimized automated processes that deliver better results with less effort and resource consumption.';
    } else if (intent.includes('intent') && intent.includes('spec')) {
      return 'Enable developers to create sophisticated Kiro specifications from natural language intent without requiring deep optimization expertise.';
    } else if (intent.includes('consulting') && intent.includes('analysis')) {
      return 'Provide professional-grade business analysis and optimization recommendations through AI-powered consulting techniques accessible to all developers.';
    } else if (intent.includes('efficiency') || intent.includes('productivity')) {
      return 'Maximize developer productivity and system efficiency by eliminating waste and optimizing resource utilization across all workflows.';
    } else {
      return 'Deliver measurable value through intelligent automation that reduces complexity while improving outcomes and user satisfaction.';
    }
  }

  /**
   * Analyze user needs (Jobs, Pains, Gains) from intent
   */
  protected analyzeUserNeeds(rawIntent: string): {
    jobs: string[];
    pains: string[];
    gains: string[];
  } {
    const intent = rawIntent.toLowerCase();
    const jobs: string[] = [];
    const pains: string[] = [];
    const gains: string[] = [];

    // Jobs to be Done
    if (intent.includes('optimize') || intent.includes('improve')) {
      jobs.push('Optimize workflow efficiency and resource utilization');
    }
    if (intent.includes('reduce') || intent.includes('minimize')) {
      jobs.push('Reduce operational costs and quota consumption');
    }
    if (intent.includes('automate') || intent.includes('streamline')) {
      jobs.push('Automate repetitive tasks and streamline processes');
    }
    if (intent.includes('analyze') || intent.includes('understand')) {
      jobs.push('Analyze performance and understand optimization opportunities');
    }
    if (intent.includes('generate') || intent.includes('create')) {
      jobs.push('Generate high-quality specifications and documentation');
    }

    // Default jobs if none identified
    if (jobs.length === 0) {
      jobs.push('Create efficient workflows that deliver value');
      jobs.push('Reduce manual effort and improve automation');
      jobs.push('Make better decisions with data-driven insights');
    }

    // Pain Points
    if (intent.includes('quota') || intent.includes('cost')) {
      pains.push('High quota consumption leading to budget overruns');
    }
    if (intent.includes('manual') || intent.includes('time-consuming')) {
      pains.push('Manual optimization processes that are time-consuming and error-prone');
    }
    if (intent.includes('complex') || intent.includes('difficult')) {
      pains.push('Complex workflow design requiring specialized expertise');
    }
    if (intent.includes('inefficient') || intent.includes('waste')) {
      pains.push('Inefficient processes that waste resources and time');
    }
    if (intent.includes('lack') || intent.includes('missing')) {
      pains.push('Lack of visibility into optimization opportunities and ROI');
    }

    // Default pains if none identified
    if (pains.length === 0) {
      pains.push('Inefficient workflows consuming excessive resources');
      pains.push('Manual processes that don\'t scale with demand');
      pains.push('Limited visibility into performance and optimization opportunities');
    }

    // Gain Creators
    if (intent.includes('save') || intent.includes('reduce')) {
      gains.push('Significant cost savings through intelligent optimization');
    }
    if (intent.includes('fast') || intent.includes('quick')) {
      gains.push('Faster development cycles with automated optimization');
    }
    if (intent.includes('quality') || intent.includes('better')) {
      gains.push('Higher quality outputs with professional-grade analysis');
    }
    if (intent.includes('insight') || intent.includes('analysis')) {
      gains.push('Actionable insights and data-driven recommendations');
    }
    if (intent.includes('scale') || intent.includes('growth')) {
      gains.push('Scalable solutions that grow with business needs');
    }

    // Default gains if none identified
    if (gains.length === 0) {
      gains.push('Measurable cost reductions and efficiency improvements');
      gains.push('Professional-quality analysis and recommendations');
      gains.push('Automated optimization that scales with usage');
    }

    return { jobs, pains, gains };
  }

  /**
   * Generate the 10 required FAQ questions for PR-FAQ
   */
  protected generateRequiredFAQQuestions(): string[] {
    return [
      'Who is the customer?',
      'What problem are we solving now?',
      'Why now and why not later?',
      'What is the smallest lovable version?',
      'How will we measure success (3 metrics)?',
      'What are the top 3 risks and mitigations?',
      'What is not included?',
      'How does this compare to alternatives?',
      'What\'s the estimated cost/quota footprint?',
      'What are the next 2 releases after v1?'
    ];
  }

  // Management One-Pager helper methods

  /**
   * Extract decision and timing in one clear line (Pyramid Principle: Answer first)
   */
  protected extractDecisionAndTiming(requirements: string, design: string): string {
    // Analyze requirements and design to determine the decision
    const hasUrgentNeed = requirements.toLowerCase().includes('urgent') || 
                         requirements.toLowerCase().includes('critical') ||
                         requirements.toLowerCase().includes('immediate');
    
    const hasMarketOpportunity = requirements.toLowerCase().includes('market') ||
                                requirements.toLowerCase().includes('opportunity') ||
                                requirements.toLowerCase().includes('competitive');

    const hasTechnicalReadiness = design.toLowerCase().includes('ready') ||
                                 design.toLowerCase().includes('feasible') ||
                                 design.toLowerCase().includes('architecture');

    if (hasUrgentNeed && hasTechnicalReadiness) {
      return 'Build this feature immediately to capture critical market opportunity and prevent competitive disadvantage';
    } else if (hasMarketOpportunity && hasTechnicalReadiness) {
      return 'Proceed with development now to capitalize on favorable market timing and technical readiness';
    } else if (hasTechnicalReadiness) {
      return 'Move forward with implementation to deliver value while technical foundation is solid';
    } else {
      return 'Initiate development with phased approach to balance opportunity capture with risk management';
    }
  }

  /**
   * Extract exactly 3 core reasons supporting the decision
   */
  protected extractCoreReasons(requirements: string, design: string): string[] {
    const reasons: string[] = [];

    // Reason 1: Market/Business justification
    if (requirements.toLowerCase().includes('cost') || requirements.toLowerCase().includes('efficiency')) {
      reasons.push('Cost optimization opportunity with measurable ROI and efficiency gains');
    } else if (requirements.toLowerCase().includes('user') || requirements.toLowerCase().includes('customer')) {
      reasons.push('Strong user demand and clear customer value proposition');
    } else {
      reasons.push('Strategic business value aligned with organizational priorities');
    }

    // Reason 2: Technical readiness
    if (design.toLowerCase().includes('architecture') || design.toLowerCase().includes('component')) {
      reasons.push('Technical architecture is well-defined and implementation path is clear');
    } else if (design.toLowerCase().includes('integration') || design.toLowerCase().includes('mcp')) {
      reasons.push('Integration approach is proven and technical risks are manageable');
    } else {
      reasons.push('Technical foundation supports reliable implementation and scalability');
    }

    // Reason 3: Timing/Opportunity
    if (requirements.toLowerCase().includes('quota') || requirements.toLowerCase().includes('optimization')) {
      reasons.push('Immediate impact on quota efficiency creates compound value over time');
    } else if (requirements.toLowerCase().includes('workflow') || requirements.toLowerCase().includes('automation')) {
      reasons.push('Workflow optimization benefits increase with early adoption and usage');
    } else {
      reasons.push('Market timing is optimal with minimal competitive pressure');
    }

    return reasons;
  }

  /**
   * Extract scope items for what will be delivered today
   */
  protected extractScopeItems(requirements: string, design: string, tasks?: string): string[] {
    const scopeItems: string[] = [];

    // Core functionality from requirements
    if (requirements.toLowerCase().includes('intent') || requirements.toLowerCase().includes('parsing')) {
      scopeItems.push('Natural language intent parsing and analysis engine');
    }
    
    if (requirements.toLowerCase().includes('optimization') || requirements.toLowerCase().includes('workflow')) {
      scopeItems.push('Workflow optimization with batching, caching, and decomposition strategies');
    }

    if (requirements.toLowerCase().includes('roi') || requirements.toLowerCase().includes('analysis')) {
      scopeItems.push('ROI analysis and quota consumption forecasting');
    }

    if (requirements.toLowerCase().includes('spec') || requirements.toLowerCase().includes('kiro')) {
      scopeItems.push('Enhanced Kiro spec generation with consulting insights');
    }

    // Integration capabilities from design
    if (design.toLowerCase().includes('mcp') || design.toLowerCase().includes('server')) {
      scopeItems.push('MCP server integration for seamless AI agent interaction');
    }

    // If we have tasks, extract key deliverables
    if (tasks) {
      if (tasks.toLowerCase().includes('document') || tasks.toLowerCase().includes('pm')) {
        scopeItems.push('PM document generation (one-pagers, PR-FAQs, requirements)');
      }
    }

    // Ensure we have at least 3 scope items
    while (scopeItems.length < 3) {
      if (scopeItems.length === 0) {
        scopeItems.push('Core system architecture and foundational components');
      } else if (scopeItems.length === 1) {
        scopeItems.push('User interface and integration capabilities');
      } else {
        scopeItems.push('Testing framework and quality assurance processes');
      }
    }

    return scopeItems.slice(0, 6); // Limit to reasonable number
  }

  /**
   * Identify exactly 3 key risks with specific mitigations
   */
  protected identifyRisksAndMitigations(requirements: string, design: string): RiskMitigation[] {
    const risks: RiskMitigation[] = [];

    // Technical complexity risk
    if (design.toLowerCase().includes('complex') || design.toLowerCase().includes('pipeline')) {
      risks.push({
        risk: 'Technical complexity of multi-stage AI pipeline may cause development delays',
        mitigation: 'Implement MVP with core functionality first, then iterate with advanced features'
      });
    } else {
      risks.push({
        risk: 'Integration challenges with existing systems may impact timeline',
        mitigation: 'Create comprehensive integration testing suite and fallback strategies'
      });
    }

    // Market/User adoption risk
    if (requirements.toLowerCase().includes('user') || requirements.toLowerCase().includes('adoption')) {
      risks.push({
        risk: 'User adoption may be slower than expected due to workflow changes',
        mitigation: 'Conduct pilot program with key users and provide comprehensive onboarding'
      });
    } else {
      risks.push({
        risk: 'Market timing uncertainty could affect value realization',
        mitigation: 'Implement phased rollout with early feedback loops and pivot capability'
      });
    }

    // Resource/Execution risk
    if (requirements.toLowerCase().includes('quota') || requirements.toLowerCase().includes('cost')) {
      risks.push({
        risk: 'Quota optimization accuracy may not meet user expectations initially',
        mitigation: 'Establish clear success metrics and continuous improvement process'
      });
    } else {
      risks.push({
        risk: 'Resource constraints during development may impact feature completeness',
        mitigation: 'Secure dedicated team allocation and define clear scope boundaries'
      });
    }

    return risks;
  }

  /**
   * Generate Conservative, Balanced, and Bold options
   */
  protected generateThreeOptions(requirements: string, design: string): {
    conservative: OptionSummary;
    balanced: OptionSummary;
    bold: OptionSummary;
  } {
    return {
      conservative: {
        name: 'Conservative',
        summary: 'Basic intent parsing with manual optimization recommendations and simple ROI reporting'
      },
      balanced: {
        name: 'Balanced',
        summary: 'Automated workflow optimization with consulting analysis and comprehensive PM document generation',
        recommended: true
      },
      bold: {
        name: 'Bold (Zero-Based)',
        summary: 'Full AI-powered consulting platform with advanced techniques and real-time optimization'
      }
    };
  }

  /**
   * Generate ROI snapshot table with effort, impact, cost, and timing
   */
  protected generateROISnapshot(
    options: { conservative: OptionSummary; balanced: OptionSummary; bold: OptionSummary },
    roiInputs?: ROIInputs
  ): ROITable {
    return {
      options: {
        conservative: {
          effort: 'Low',
          impact: 'Med',
          estimatedCost: roiInputs?.cost_naive ? `$${(roiInputs.cost_naive / 1000).toFixed(0)}K` : '$50K',
          timing: 'Now'
        },
        balanced: {
          effort: 'Med',
          impact: 'High',
          estimatedCost: roiInputs?.cost_balanced ? `$${(roiInputs.cost_balanced / 1000).toFixed(0)}K` : '$150K',
          timing: 'Now'
        },
        bold: {
          effort: 'High',
          impact: 'VeryH',
          estimatedCost: roiInputs?.cost_bold ? `$${(roiInputs.cost_bold / 1000).toFixed(0)}K` : '$300K',
          timing: 'Later'
        }
      }
    };
  }

  /**
   * Generate 2-4 lines explaining why now vs later
   */
  protected generateTimingRecommendation(requirements: string, design: string): string {
    const hasUrgency = requirements.toLowerCase().includes('urgent') || 
                      requirements.toLowerCase().includes('critical') ||
                      requirements.toLowerCase().includes('immediate');

    const hasOpportunity = requirements.toLowerCase().includes('opportunity') ||
                          requirements.toLowerCase().includes('market') ||
                          requirements.toLowerCase().includes('competitive');

    const hasTechnicalReadiness = design.toLowerCase().includes('ready') ||
                                 design.toLowerCase().includes('architecture') ||
                                 design.toLowerCase().includes('feasible');

    let recommendation = '';

    if (hasUrgency && hasTechnicalReadiness) {
      recommendation = 'Now is the critical time to act because urgent business needs align with technical readiness. ';
      recommendation += 'Delaying would mean missing the immediate value opportunity and potentially falling behind competitors. ';
      recommendation += 'The technical foundation is solid and the business case is compelling. ';
      recommendation += 'Waiting would only increase the cost of inaction while the opportunity window narrows.';
    } else if (hasOpportunity && hasTechnicalReadiness) {
      recommendation = 'The timing is optimal because market conditions are favorable and technical capabilities are mature. ';
      recommendation += 'Moving now allows us to capture first-mover advantage while implementation risks are manageable. ';
      recommendation += 'The balanced approach provides the best risk-adjusted return on investment.';
    } else if (hasTechnicalReadiness) {
      recommendation = 'Technical readiness supports immediate implementation with manageable risk. ';
      recommendation += 'Starting now allows for iterative development and early user feedback. ';
      recommendation += 'The phased approach ensures value delivery while building toward the full vision.';
    } else {
      recommendation = 'While some technical challenges remain, the business opportunity justifies moving forward. ';
      recommendation += 'A conservative start with rapid iteration will validate assumptions and build momentum. ';
      recommendation += 'Waiting for perfect conditions would mean missing the current market window.';
    }

    return recommendation;
  }

  // PR-FAQ helper methods

  /**
   * Get default launch date (3 months from now)
   */
  protected getDefaultLaunchDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate future-dated press release with headline, sub-headline, and body
   * Enhanced with competitive positioning
   */
  protected generatePressRelease(requirements: string, design: string, launchDate: string, competitiveAnalysis?: any): {
    date: string;
    headline: string;
    subHeadline: string;
    body: string;
  } {
    const headline = this.generatePressReleaseHeadline(requirements, competitiveAnalysis);
    const subHeadline = this.generatePressReleaseSubHeadline(requirements, design, competitiveAnalysis);
    const body = this.generatePressReleaseBody(requirements, design, competitiveAnalysis);

    return {
      date: launchDate,
      headline,
      subHeadline,
      body
    };
  }

  /**
   * Generate compelling headline for press release
   * Enhanced with competitive differentiation
   */
  protected generatePressReleaseHeadline(requirements: string, competitiveAnalysis?: any): string {
    // Extract competitive advantage for headline
    const competitiveAdvantage = competitiveAnalysis ? 
      this.extractCompetitiveAdvantages(competitiveAnalysis)[0] : null;
    
    if (requirements.toLowerCase().includes('quota') && requirements.toLowerCase().includes('optimization')) {
      const advantage = competitiveAdvantage ? ` with ${competitiveAdvantage}` : '';
      return `Revolutionary AI Agent Reduces Developer Workflow Costs by 60%${advantage}`;
    } else if (requirements.toLowerCase().includes('intent') && requirements.toLowerCase().includes('spec')) {
      const advantage = competitiveAdvantage ? ` Through ${competitiveAdvantage}` : '';
      return `Breakthrough PM Agent Transforms Natural Language Intent${advantage}`;
    } else if (requirements.toLowerCase().includes('consulting') && requirements.toLowerCase().includes('analysis')) {
      const advantage = competitiveAdvantage ? ` Featuring ${competitiveAdvantage}` : '';
      return `AI-Powered Consulting Platform Delivers Professional-Grade Analysis${advantage}`;
    } else {
      const advantage = competitiveAdvantage ? ` Leveraging ${competitiveAdvantage}` : '';
      return `Next-Generation PM Agent Revolutionizes Developer Workflow${advantage}`;
    }
  }

  /**
   * Generate sub-headline that explains the key benefit
   * Enhanced with competitive positioning
   */
  protected generatePressReleaseSubHeadline(requirements: string, design: string, competitiveAnalysis?: any): string {
    if (requirements.toLowerCase().includes('quota') || requirements.toLowerCase().includes('cost')) {
      return 'Advanced AI system applies consulting-grade analysis to minimize quota consumption while maintaining all required functionality';
    } else if (design.toLowerCase().includes('mcp') || design.toLowerCase().includes('integration')) {
      return 'Seamless MCP integration enables AI agents to optimize workflows with professional consulting techniques';
    } else {
      return 'Intelligent automation combines natural language processing with business analysis to deliver optimized specifications';
    }
  }

  /**
   * Generate press release body with problem, solution, why now, customer quote, and availability
   * Enhanced with competitive differentiation
   */
  protected generatePressReleaseBody(requirements: string, design: string, competitiveAnalysis?: any): string {
    let body = '';

    // Problem statement
    if (requirements.toLowerCase().includes('quota') || requirements.toLowerCase().includes('cost')) {
      body += 'Today we announced the PM Agent Intent-to-Spec Optimizer, solving the critical problem of excessive quota consumption that has plagued developer workflows. ';
    } else {
      body += 'Today we announced the PM Agent Intent-to-Spec Optimizer, addressing the widespread challenge of inefficient workflow design and manual optimization processes. ';
    }

    // Solution
    if (requirements.toLowerCase().includes('consulting') || requirements.toLowerCase().includes('analysis')) {
      body += 'Our breakthrough solution applies 2-3 professional consulting techniques from a comprehensive arsenal to automatically optimize workflows while preserving all functionality. ';
    } else {
      body += 'Our innovative solution transforms natural language intent into optimized Kiro specifications using advanced AI and business analysis techniques. ';
    }

    // Why now
    if (requirements.toLowerCase().includes('urgent') || requirements.toLowerCase().includes('critical')) {
      body += 'With rising infrastructure costs and increasing demand for efficiency, now is the critical time for intelligent workflow optimization. ';
    } else {
      body += 'As organizations seek to maximize developer productivity while controlling costs, automated optimization has become essential. ';
    }

    // Customer quote
    body += '"This tool has completely transformed how we approach workflow automation," said Sarah Chen, Senior Engineering Manager at TechFlow Solutions. ';
    body += '"We\'ve reduced our quota consumption by over 50% while actually improving functionality. The ROI analysis alone has saved us countless hours of manual calculation." ';

    // Availability
    if (design.toLowerCase().includes('mcp') || design.toLowerCase().includes('server')) {
      body += 'The PM Agent is available now through MCP server integration, enabling seamless adoption across existing AI agent workflows.';
    } else {
      body += 'The PM Agent is available now for immediate integration into developer workflows and automation pipelines.';
    }

    return body;
  }

  /**
   * Generate FAQ with exactly the 10 required questions and structured answers
   * Enhanced with competitive differentiation
   */
  protected generateFAQ(requirements: string, design: string, competitiveAnalysis?: any): FAQItem[] {
    const questions = this.generateRequiredFAQQuestions();
    const answers = this.generateFAQAnswers(requirements, design, competitiveAnalysis);

    return questions.map((question, index) => ({
      question,
      answer: answers[index] || 'Answer to be provided based on specific implementation details.'
    }));
  }

  /**
   * Generate answers for the 10 required FAQ questions
   * Enhanced with competitive insights
   */
  protected generateFAQAnswers(requirements: string, design: string, competitiveAnalysis?: any): string[] {
    return [
      // Who is the customer?
      'Developers, engineering teams, and organizations using Kiro who want to optimize their workflow efficiency and reduce quota consumption while maintaining full functionality.',

      // What problem are we solving now?
      requirements.toLowerCase().includes('quota') 
        ? 'Excessive vibe and spec quota consumption due to inefficient workflow design, lack of optimization expertise, and manual processes that lead to redundant operations and cost overruns.'
        : 'Inefficient workflow design and manual optimization processes that consume excessive resources and require specialized expertise to improve.',

      // Why now and why not later?
      requirements.toLowerCase().includes('urgent') || requirements.toLowerCase().includes('critical')
        ? 'Rising infrastructure costs and increasing demand for efficiency make this critical now. Waiting means continued waste and competitive disadvantage as others optimize their operations.'
        : 'Market conditions are optimal with proven technical foundation. Early adoption provides compound benefits as usage scales, while delaying means missing the current opportunity window.',

      // What is the smallest lovable version?
      'Core intent parsing with basic workflow optimization (batching and caching), ROI analysis comparing naive vs optimized approaches, and enhanced Kiro spec generation with consulting insights.',

      // How will we measure success (3 metrics)?
      '1) Quota consumption reduction: Target 40-60% reduction in vibe/spec usage. 2) User adoption rate: 80% of pilot users continue using after 30 days. 3) ROI accuracy: Optimization predictions within 15% of actual savings.',

      // What are the top 3 risks and mitigations?
      '1) Technical complexity of AI pipeline - Mitigate with MVP approach and iterative development. 2) Optimization accuracy concerns - Address with comprehensive testing and feedback loops. 3) User adoption challenges - Solve with pilot program and extensive onboarding support.',

      // What is not included?
      'Real-time collaboration features, advanced workflow debugging tools, custom consulting technique development, integration with non-Kiro platforms, and enterprise-specific compliance features.',

      // How does this compare to alternatives?
      this.generateCompetitiveComparisonAnswer(competitiveAnalysis),

      // What's the estimated cost/quota footprint?
      design.toLowerCase().includes('mcp') || design.toLowerCase().includes('server')
        ? 'Minimal operational overhead through MCP server architecture. Processing costs scale with usage but are offset by 40-60% quota savings. Typical ROI positive within first month of usage.'
        : 'Low operational overhead with processing costs offset by significant quota savings. Expected positive ROI within 30-60 days of implementation.',

      // What are the next 2 releases after v1?
      'v2: Advanced consulting techniques (Value Driver Tree, Zero-Based Design), real-time optimization monitoring, and custom technique configuration. v3: Multi-platform support, team collaboration features, and enterprise analytics dashboard.'
    ];
  }

  /**
   * Generate launch checklist with scope freeze, owners, timeline, dependencies
   */
  protected generateLaunchChecklist(requirements: string, design: string, launchDate: string): ChecklistItem[] {
    const launchDateObj = new Date(launchDate);
    const milestones = this.generateLaunchMilestones(launchDateObj);

    return [
      // Scope freeze
      {
        task: 'Scope freeze and requirements lock',
        owner: 'Product Team',
        dueDate: milestones.scopeFreeze,
        dependencies: ['Stakeholder alignment', 'Technical feasibility confirmation']
      },
      
      // Development milestones
      {
        task: 'Complete MVP development (core optimization engine)',
        owner: 'Engineering Team',
        dueDate: milestones.mvpComplete,
        dependencies: ['Scope freeze', 'Technical architecture approval']
      },

      {
        task: 'Implement MCP server integration and tool handlers',
        owner: 'Engineering Team',
        dueDate: milestones.integrationComplete,
        dependencies: ['MVP development', 'MCP protocol testing']
      },

      // Testing and validation
      {
        task: 'Complete comprehensive testing suite (unit, integration, performance)',
        owner: 'QA Team',
        dueDate: milestones.testingComplete,
        dependencies: ['Integration complete', 'Test data preparation']
      },

      {
        task: 'Conduct pilot testing with 3-5 key customers',
        owner: 'Product Team',
        dueDate: milestones.pilotComplete,
        dependencies: ['Testing complete', 'Customer recruitment']
      },

      // Documentation and training
      {
        task: 'Complete user documentation and onboarding materials',
        owner: 'Technical Writing Team',
        dueDate: milestones.docsComplete,
        dependencies: ['Pilot feedback', 'Feature finalization']
      },

      {
        task: 'Prepare launch communications and marketing materials',
        owner: 'Marketing Team',
        dueDate: milestones.marketingReady,
        dependencies: ['Documentation complete', 'Success metrics defined']
      },

      // Launch preparation
      {
        task: 'Production deployment and monitoring setup',
        owner: 'DevOps Team',
        dueDate: milestones.deploymentReady,
        dependencies: ['All testing complete', 'Infrastructure provisioning']
      },

      {
        task: 'Final launch readiness review and go/no-go decision',
        owner: 'Leadership Team',
        dueDate: milestones.launchReview,
        dependencies: ['All previous tasks', 'Success criteria validation']
      },

      // Launch
      {
        task: 'Official product launch and announcement',
        owner: 'Product Team',
        dueDate: launchDate,
        dependencies: ['Launch readiness approval', 'Communications ready']
      }
    ];
  }

  /**
   * Generate launch milestone dates based on target launch date
   */
  protected generateLaunchMilestones(launchDate: Date): {
    scopeFreeze: string;
    mvpComplete: string;
    integrationComplete: string;
    testingComplete: string;
    pilotComplete: string;
    docsComplete: string;
    marketingReady: string;
    deploymentReady: string;
    launchReview: string;
  } {
    const milestones = {
      scopeFreeze: new Date(launchDate.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 75 days before
      mvpComplete: new Date(launchDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days before
      integrationComplete: new Date(launchDate.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days before
      testingComplete: new Date(launchDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days before
      pilotComplete: new Date(launchDate.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 21 days before
      docsComplete: new Date(launchDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days before
      marketingReady: new Date(launchDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days before
      deploymentReady: new Date(launchDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days before
      launchReview: new Date(launchDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days before
    };

    return milestones;
  }

  // Requirements generation helper methods

  /**
   * Extract functional requirements (WHAT) from raw intent
   */
  protected extractFunctionalRequirements(rawIntent: string): string[] {
    const intent = rawIntent.toLowerCase();
    const requirements: string[] = [];

    // Core functionality requirements
    if (intent.includes('parse') || intent.includes('intent') || intent.includes('language')) {
      requirements.push('Parse natural language developer intent into structured requirements');
    }
    if (intent.includes('optimize') || intent.includes('improve')) {
      requirements.push('Apply optimization strategies to reduce resource consumption');
    }
    if (intent.includes('analyze') || intent.includes('consulting')) {
      requirements.push('Perform business analysis using professional consulting techniques');
    }
    if (intent.includes('roi') || intent.includes('cost') || intent.includes('savings')) {
      requirements.push('Generate comprehensive ROI analysis with multiple scenarios');
    }
    if (intent.includes('spec') || intent.includes('generate')) {
      requirements.push('Generate optimized Kiro specifications ready for execution');
    }
    if (intent.includes('document') || intent.includes('report')) {
      requirements.push('Create executive-ready documentation and reports');
    }
    if (intent.includes('integration') || intent.includes('mcp')) {
      requirements.push('Provide seamless integration through MCP server protocol');
    }

    // Quality and performance requirements
    if (intent.includes('accurate') || intent.includes('reliable')) {
      requirements.push('Ensure optimization accuracy within 15% of actual results');
    }
    if (intent.includes('fast') || intent.includes('performance')) {
      requirements.push('Process requests within acceptable response time limits');
    }
    if (intent.includes('scale') || intent.includes('volume')) {
      requirements.push('Scale to handle varying workload volumes efficiently');
    }

    // User experience requirements
    if (intent.includes('easy') || intent.includes('simple')) {
      requirements.push('Provide intuitive interface requiring minimal learning curve');
    }
    if (intent.includes('feedback') || intent.includes('explanation')) {
      requirements.push('Deliver clear explanations and actionable recommendations');
    }

    // Default requirements if none identified
    if (requirements.length === 0) {
      requirements.push('Process user input and generate optimized output');
      requirements.push('Provide analysis and recommendations for improvement');
      requirements.push('Integrate with existing systems and workflows');
      requirements.push('Deliver measurable value and cost savings');
    }

    return requirements;
  }

  /**
   * Identify constraints and risks from intent and context
   */
  protected identifyConstraintsAndRisks(rawIntent: string, context?: RequirementsContext): string[] {
    const constraintsRisks: string[] = [];
    const intent = rawIntent.toLowerCase();

    // Budget constraints
    if (context?.budget) {
      constraintsRisks.push(`Budget constraint of $${context.budget.toLocaleString()} limits scope and timeline`);
    } else if (intent.includes('budget') || intent.includes('cost')) {
      constraintsRisks.push('Budget limitations may impact feature completeness and timeline');
    }

    // Quota constraints
    if (context?.quotas?.maxVibes || context?.quotas?.maxSpecs) {
      constraintsRisks.push(`Quota limits (${context.quotas.maxVibes || 'unlimited'} vibes, ${context.quotas.maxSpecs || 'unlimited'} specs) constrain processing capacity`);
    } else if (intent.includes('quota') || intent.includes('limit')) {
      constraintsRisks.push('Quota consumption limits may restrict optimization capabilities');
    }

    // Timeline constraints
    if (context?.deadlines) {
      constraintsRisks.push(`Timeline constraint (${context.deadlines}) may require scope reduction or phased delivery`);
    } else if (intent.includes('urgent') || intent.includes('deadline')) {
      constraintsRisks.push('Aggressive timeline may impact quality or require reduced scope');
    }

    // Technical risks
    if (intent.includes('complex') || intent.includes('advanced')) {
      constraintsRisks.push('Technical complexity of AI pipeline may cause development delays');
    }
    if (intent.includes('integration') || intent.includes('mcp')) {
      constraintsRisks.push('Integration challenges with existing systems may impact timeline');
    }
    if (intent.includes('accuracy') || intent.includes('optimization')) {
      constraintsRisks.push('Optimization accuracy requirements may need iterative refinement');
    }

    // Market/adoption risks
    if (intent.includes('user') || intent.includes('adoption')) {
      constraintsRisks.push('User adoption may be slower than expected due to workflow changes');
    }
    if (intent.includes('competitive') || intent.includes('market')) {
      constraintsRisks.push('Market timing uncertainty could affect value realization');
    }

    // Default constraints/risks if none identified
    if (constraintsRisks.length === 0) {
      constraintsRisks.push('Resource availability may impact development timeline');
      constraintsRisks.push('Technical complexity requires careful scope management');
      constraintsRisks.push('User adoption depends on clear value demonstration');
    }

    return constraintsRisks;
  }

  /**
   * Apply MoSCoW prioritization to requirements with 1-line justifications
   */
  protected applyMoSCoWPrioritization(requirements: string[]): {
    must: PriorityItem[];
    should: PriorityItem[];
    could: PriorityItem[];
    wont: PriorityItem[];
  } {
    const must: PriorityItem[] = [];
    const should: PriorityItem[] = [];
    const could: PriorityItem[] = [];
    const wont: PriorityItem[] = [];

    requirements.forEach(req => {
      const reqLower = req.toLowerCase();

      // Must Have - Core functionality without which system cannot function
      if (reqLower.includes('parse') && reqLower.includes('intent')) {
        must.push({
          requirement: req,
          justification: 'Core capability without which the system cannot function'
        });
      } else if (reqLower.includes('optimize') && (reqLower.includes('workflow') || reqLower.includes('resource'))) {
        must.push({
          requirement: req,
          justification: 'Primary value proposition that justifies the entire system'
        });
      } else if (reqLower.includes('generate') && reqLower.includes('spec')) {
        must.push({
          requirement: req,
          justification: 'Essential output format required for user workflow integration'
        });
      } else if (reqLower.includes('mcp') || reqLower.includes('integration')) {
        must.push({
          requirement: req,
          justification: 'Required for system to be usable in target environment'
        });

      // Should Have - Important for user satisfaction and value
      } else if (reqLower.includes('roi') || reqLower.includes('analysis')) {
        should.push({
          requirement: req,
          justification: 'Critical for user decision-making and value demonstration'
        });
      } else if (reqLower.includes('consulting') || reqLower.includes('business')) {
        should.push({
          requirement: req,
          justification: 'Differentiating feature that provides professional-grade value'
        });
      } else if (reqLower.includes('accurate') || reqLower.includes('reliable')) {
        should.push({
          requirement: req,
          justification: 'Essential for user trust and system credibility'
        });
      } else if (reqLower.includes('document') || reqLower.includes('report')) {
        should.push({
          requirement: req,
          justification: 'Important for stakeholder communication and adoption'
        });

      // Could Have - Nice to have but not essential for MVP
      } else if (reqLower.includes('scale') || reqLower.includes('volume')) {
        could.push({
          requirement: req,
          justification: 'Nice to have for future growth but not essential for MVP'
        });
      } else if (reqLower.includes('performance') || reqLower.includes('fast')) {
        could.push({
          requirement: req,
          justification: 'Desirable for user experience but acceptable if basic performance met'
        });
      } else if (reqLower.includes('intuitive') || reqLower.includes('easy')) {
        could.push({
          requirement: req,
          justification: 'Improves adoption but core functionality more important'
        });

      // Won't Have - Out of scope for initial release
      } else if (reqLower.includes('real-time') || reqLower.includes('collaboration')) {
        wont.push({
          requirement: req,
          justification: 'Out of scope for initial release, focus on core optimization'
        });
      } else if (reqLower.includes('custom') || reqLower.includes('enterprise')) {
        wont.push({
          requirement: req,
          justification: 'Enterprise features deferred to future releases'
        });
      } else {
        // Default categorization based on keywords
        if (reqLower.includes('provide') || reqLower.includes('deliver')) {
          should.push({
            requirement: req,
            justification: 'Important for overall value delivery and user satisfaction'
          });
        } else {
          could.push({
            requirement: req,
            justification: 'Valuable addition but not critical for core functionality'
          });
        }
      }
    });

    // Ensure we have at least one item in Must category
    if (must.length === 0 && requirements.length > 0) {
      must.push({
        requirement: requirements[0],
        justification: 'Core system capability required for basic functionality'
      });
    }

    return { must, should, could, wont };
  }

  /**
   * Generate Go/No-Go timing decision based on value and timing analysis
   */
  protected generateRightTimeVerdict(rawIntent: string, context?: RequirementsContext): {
    decision: 'do_now' | 'do_later';
    reasoning: string;
  } {
    const intent = rawIntent.toLowerCase();
    let score = 0;
    let reasoning = '';

    // Factors favoring "do now"
    if (intent.includes('urgent') || intent.includes('critical')) {
      score += 3;
      reasoning += 'Urgent business need creates immediate value opportunity. ';
    }
    if (intent.includes('cost') || intent.includes('savings')) {
      score += 2;
      reasoning += 'Cost savings compound over time, making early implementation valuable. ';
    }
    if (intent.includes('ready') || intent.includes('feasible')) {
      score += 2;
      reasoning += 'Technical readiness reduces implementation risk. ';
    }
    if (context?.budget && context.budget > 50000) {
      score += 1;
      reasoning += 'Adequate budget supports proper implementation. ';
    }

    // Factors favoring "do later"
    if (intent.includes('complex') || intent.includes('challenging')) {
      score -= 2;
      reasoning += 'Technical complexity suggests need for more preparation. ';
    }
    if (context?.deadlines && context.deadlines.toLowerCase().includes('tight')) {
      score -= 1;
      reasoning += 'Tight timeline may compromise quality. ';
    }
    if (intent.includes('uncertain') || intent.includes('unclear')) {
      score -= 2;
      reasoning += 'Requirements uncertainty increases implementation risk. ';
    }

    // Market timing factors
    if (intent.includes('opportunity') || intent.includes('competitive')) {
      score += 2;
      reasoning += 'Market opportunity window supports immediate action. ';
    }

    // Make decision based on score
    const decision: 'do_now' | 'do_later' = score >= 2 ? 'do_now' : 'do_later';

    // Complete reasoning based on decision
    if (decision === 'do_now') {
      if (!reasoning.includes('Market opportunity')) {
        reasoning += 'Current conditions favor immediate implementation with manageable risk.';
      }
    } else {
      reasoning += 'Waiting allows for better preparation and risk mitigation, improving success probability.';
    }

    return { decision, reasoning: reasoning.trim() };
  }

  // Design options generation helper methods

  /**
   * Generate problem framing explaining why now (3-5 lines)
   */
  protected generateProblemFraming(requirements: string): string {
    const req = requirements.toLowerCase();
    let framing = '';

    // Identify the core problem
    if (req.includes('quota') && req.includes('cost')) {
      framing += 'Current developer workflows consume excessive quotas due to inefficient patterns and lack of optimization expertise. ';
      framing += 'Rising infrastructure costs and increasing demand for efficiency make this a critical business problem. ';
    } else if (req.includes('manual') && req.includes('optimization')) {
      framing += 'Manual workflow optimization requires specialized expertise and consumes significant developer time. ';
      framing += 'The lack of automated optimization tools creates bottlenecks and inconsistent results. ';
    } else if (req.includes('intent') && req.includes('spec')) {
      framing += 'Developers struggle to translate natural language requirements into efficient Kiro specifications. ';
      framing += 'The gap between intent and optimized implementation leads to suboptimal resource utilization. ';
    } else {
      framing += 'Current workflows lack intelligent optimization and consume more resources than necessary. ';
      framing += 'The absence of professional-grade analysis tools limits efficiency improvements. ';
    }

    // Why now timing
    if (req.includes('urgent') || req.includes('critical')) {
      framing += 'Immediate action is required now to prevent further resource waste and competitive disadvantage. ';
    } else if (req.includes('opportunity') || req.includes('market')) {
      framing += 'Market timing and opportunity conditions are favorable with proven technical approaches available for implementation. ';
    } else {
      framing += 'Technical foundation is mature and user demand is validated, making now the optimal time to act. ';
    }

    // Business impact
    if (req.includes('roi') || req.includes('savings')) {
      framing += 'The compound effect of optimization savings makes early implementation highly valuable. ';
    } else {
      framing += 'Early adoption provides competitive advantage and establishes market leadership position.';
    }

    return framing.trim();
  }

  /**
   * Generate Conservative, Balanced, and Bold design options
   */
  protected generateThreeDesignOptions(requirements: string): {
    conservative: DesignOption;
    balanced: DesignOption;
    bold: DesignOption;
  } {
    const req = requirements.toLowerCase();

    // Conservative option - minimal risk, basic functionality
    const conservative: DesignOption = {
      name: 'Conservative',
      summary: 'Basic intent parsing with simple optimization rules and manual review processes',
      keyTradeoffs: [
        'Lower implementation risk but limited automation capabilities',
        'Faster initial delivery but requires more manual intervention',
        'Proven technology stack but less sophisticated analysis'
      ],
      impact: 'Medium',
      effort: 'Low',
      majorRisks: [
        'May not meet user expectations for automation level',
        'Limited scalability as usage grows',
        'Competitive disadvantage due to basic feature set'
      ]
    };

    // Balanced option - optimal risk/reward balance
    const balanced: DesignOption = {
      name: 'Balanced',
      summary: 'Automated workflow optimization with consulting techniques and comprehensive ROI analysis',
      keyTradeoffs: [
        'Good balance of features and implementation complexity',
        'Moderate development timeline with high user value',
        'Professional-grade analysis with manageable technical risk'
      ],
      impact: 'High',
      effort: 'Medium',
      majorRisks: [
        'Integration complexity may cause minor delays',
        'Consulting technique accuracy requires fine-tuning',
        'User adoption depends on clear value demonstration'
      ]
    };

    // Bold option - maximum impact, higher risk
    let boldSummary = 'Full AI-powered consulting platform with advanced techniques and real-time optimization';
    let boldTradeoffs = [
      'Maximum impact and competitive differentiation',
      'Comprehensive feature set with professional-grade capabilities',
      'Future-proof architecture supporting advanced use cases'
    ];
    let boldRisks = [
      'High technical complexity may extend development timeline',
      'Advanced features may overwhelm initial users',
      'Significant resource investment with execution risk'
    ];

    // Customize bold option based on requirements
    if (req.includes('zero-based') || req.includes('radical')) {
      boldSummary = 'Revolutionary zero-based design approach with radical workflow reimagining';
      boldTradeoffs = [
        'Challenges all assumptions for maximum optimization potential',
        'Breakthrough approach that could redefine industry standards',
        'Highest possible ROI if successfully implemented'
      ];
      boldRisks = [
        'Unproven approach with significant technical and market risk',
        'May require fundamental changes to user workflows',
        'Long development cycle with uncertain outcomes'
      ];
    } else if (req.includes('ai') || req.includes('machine learning')) {
      boldSummary = 'Advanced AI platform with machine learning optimization and predictive analytics';
      boldTradeoffs = [
        'Cutting-edge AI capabilities for superior optimization',
        'Self-improving system that gets better with usage',
        'Market-leading differentiation through advanced technology'
      ];
    }

    const bold: DesignOption = {
      name: 'Bold (Zero-Based)',
      summary: boldSummary,
      keyTradeoffs: boldTradeoffs,
      impact: 'High',
      effort: 'High',
      majorRisks: boldRisks
    };

    return { conservative, balanced, bold };
  }

  /**
   * Generate right-time recommendation for design approach (2-4 lines)
   */
  protected generateDesignTimingRecommendation(
    requirements: string,
    options: { conservative: DesignOption; balanced: DesignOption; bold: DesignOption }
  ): string {
    const req = requirements.toLowerCase();
    let recommendation = '';

    // Analyze requirements for timing signals
    const hasUrgency = req.includes('urgent') || req.includes('critical') || req.includes('immediate');
    const hasComplexity = req.includes('complex') || req.includes('advanced') || req.includes('sophisticated');
    const hasRiskTolerance = req.includes('bold') || req.includes('innovative') || req.includes('breakthrough') || req.includes('leadership') || req.includes('revolutionary') || (req.includes('risk') && req.includes('appetite'));
    const hasResourceConstraints = req.includes('tight') || req.includes('limited') || (req.includes('budget') && !req.includes('significant')) || (req.includes('timeline') && req.includes('tight'));

    if (hasUrgency && !hasComplexity) {
      recommendation = 'Conservative approach is recommended now due to urgent timeline requirements. ';
      recommendation += 'This delivers immediate value while minimizing implementation risk. ';
      recommendation += 'Future iterations can add advanced features once core functionality is proven.';
    } else if (hasRiskTolerance && !hasResourceConstraints) {
      recommendation = 'Bold approach is justified given the appetite for innovation and breakthrough results. ';
      recommendation += 'The potential for market leadership and revolutionary impact outweighs the higher implementation risk. ';
      recommendation += 'Strong technical foundation and adequate timeline support this ambitious approach.';
    } else {
      recommendation = 'Balanced approach is recommended as the optimal choice for current conditions. ';
      recommendation += 'It provides high impact while managing implementation risk effectively. ';
      recommendation += 'This approach delivers professional-grade capabilities with reasonable timeline and resource requirements. ';
      recommendation += 'The risk-adjusted ROI is superior to both conservative and bold alternatives.';
    }

    return recommendation;
  }

  // Task plan generation helper methods

  /**
   * Generate Guardrails Check as Task 0 to fail fast if limits exceeded
   */
  protected generateGuardrailsCheck(design: string, limits?: TaskLimits): GuardrailsTask {
    const defaultLimits = {
      maxVibes: limits?.maxVibes || 1000,
      maxSpecs: limits?.maxSpecs || 50,
      budgetUSD: limits?.budgetUSD || 100000
    };

    return {
      id: '0',
      name: 'Guardrails Check',
      description: 'Validate that project limits are not exceeded before proceeding with implementation',
      acceptanceCriteria: [
        'Estimated quota consumption stays within defined limits',
        'Budget requirements are confirmed and approved',
        'Technical complexity is manageable with available resources',
        'Timeline expectations are realistic and achievable',
        'Team capacity is confirmed for the planned scope'
      ],
      effort: 'S',
      impact: 'High',
      priority: 'Must',
      limits: defaultLimits,
      checkCriteria: [
        `Estimated vibe consumption < ${Math.floor(defaultLimits.maxVibes * 0.8)} (80% of ${defaultLimits.maxVibes} limit)`,
        `Estimated spec consumption < ${Math.floor(defaultLimits.maxSpecs * 0.8)} (80% of ${defaultLimits.maxSpecs} limit)`,
        `Total project cost < $${defaultLimits.budgetUSD.toLocaleString()} budget allocation`,
        'Technical dependencies are identified and resolved',
        'Team availability confirmed for project timeline',
        'Risk mitigation strategies are in place for major risks'
      ]
    };
  }

  /**
   * Extract tasks from design document
   */
  protected extractTasksFromDesign(design: string): Task[] {
    const tasks: Task[] = [];
    const designLower = design.toLowerCase();
    let taskId = 1;

    // Core infrastructure tasks
    if (designLower.includes('architecture') || designLower.includes('component')) {
      tasks.push({
        id: (taskId++).toString(),
        name: 'Setup project architecture and core components',
        description: 'Create foundational project structure with core interfaces and component definitions',
        acceptanceCriteria: [
          'Project directory structure is created',
          'Core interfaces are defined and documented',
          'Component architecture is implemented',
          'Basic configuration files are in place'
        ],
        effort: 'M',
        impact: 'High',
        priority: 'Must'
      });
    }

    // Data model tasks
    if (designLower.includes('model') || designLower.includes('interface')) {
      tasks.push({
        id: (taskId++).toString(),
        name: 'Implement data models and interfaces',
        description: 'Create TypeScript interfaces and data structures for all system components',
        acceptanceCriteria: [
          'All data models are defined with proper typing',
          'Interface contracts are documented',
          'Validation logic is implemented',
          'Unit tests for models are created'
        ],
        effort: 'M',
        impact: 'High',
        priority: 'Must'
      });
    }

    // Intent parsing tasks
    if (designLower.includes('intent') || designLower.includes('parsing')) {
      tasks.push({
        id: (taskId++).toString(),
        name: 'Build intent parsing engine',
        description: 'Implement natural language processing for developer intent extraction',
        acceptanceCriteria: [
          'Intent parser can extract structured data from natural language',
          'Business objective identification is functional',
          'Technical requirements extraction works correctly',
          'Comprehensive test coverage is achieved'
        ],
        effort: 'L',
        impact: 'High',
        priority: 'Must'
      });
    }

    // Optimization tasks
    if (designLower.includes('optimization') || designLower.includes('workflow')) {
      tasks.push({
        id: (taskId++).toString(),
        name: 'Implement workflow optimization engine',
        description: 'Build optimization strategies including batching, caching, and decomposition',
        acceptanceCriteria: [
          'Batching strategy is implemented and tested',
          'Caching layer is functional with proper invalidation',
          'Workflow decomposition logic works correctly',
          'Optimization effectiveness is measurable'
        ],
        effort: 'L',
        impact: 'High',
        priority: 'Must'
      });
    }

    // Analysis tasks
    if (designLower.includes('analysis') || designLower.includes('consulting')) {
      tasks.push({
        id: (taskId++).toString(),
        name: 'Implement business analysis capabilities',
        description: 'Build consulting technique application and analysis generation',
        acceptanceCriteria: [
          'Multiple consulting techniques are supported',
          'Analysis quality meets professional standards',
          'Technique selection logic is effective',
          'Output formatting is consistent and clear'
        ],
        effort: 'L',
        impact: 'Med',
        priority: 'Should'
      });
    }

    // ROI and forecasting tasks
    if (designLower.includes('roi') || designLower.includes('forecast')) {
      tasks.push({
        id: (taskId++).toString(),
        name: 'Build ROI analysis and forecasting',
        description: 'Implement quota consumption estimation and ROI calculation',
        acceptanceCriteria: [
          'Quota consumption estimation is accurate within 15%',
          'ROI calculations include multiple scenarios',
          'Forecasting models are validated with test data',
          'Reporting format is clear and actionable'
        ],
        effort: 'M',
        impact: 'High',
        priority: 'Should'
      });
    }

    // Integration tasks
    if (designLower.includes('mcp') || designLower.includes('server')) {
      tasks.push({
        id: (taskId++).toString(),
        name: 'Implement MCP server integration',
        description: 'Build MCP protocol support and tool handlers for AI agent integration',
        acceptanceCriteria: [
          'MCP server is functional and discoverable',
          'All tool handlers are implemented and tested',
          'Protocol compliance is verified',
          'Error handling is comprehensive'
        ],
        effort: 'M',
        impact: 'High',
        priority: 'Must'
      });
    }

    // PM document tasks
    if (designLower.includes('document') || designLower.includes('pm')) {
      tasks.push({
        id: (taskId++).toString(),
        name: 'Build PM document generation',
        description: 'Implement management one-pagers, PR-FAQs, and requirements generation',
        acceptanceCriteria: [
          'Management one-pager generation is functional',
          'PR-FAQ format compliance is verified',
          'Requirements with MoSCoW prioritization work correctly',
          'Document quality meets professional standards'
        ],
        effort: 'L',
        impact: 'Med',
        priority: 'Could'
      });
    }

    // Testing tasks
    tasks.push({
      id: (taskId++).toString(),
      name: 'Create comprehensive test suite',
      description: 'Build unit, integration, and end-to-end tests for all components',
      acceptanceCriteria: [
        'Unit test coverage exceeds 80%',
        'Integration tests cover all major workflows',
        'Performance tests validate response times',
        'Error scenarios are thoroughly tested'
      ],
      effort: 'M',
      impact: 'Med',
      priority: 'Should'
    });

    // Documentation tasks
    tasks.push({
      id: (taskId++).toString(),
      name: 'Create user documentation and guides',
      description: 'Write comprehensive documentation for users and developers',
      acceptanceCriteria: [
        'User guide covers all major features',
        'API documentation is complete and accurate',
        'Setup and configuration guides are clear',
        'Troubleshooting section addresses common issues'
      ],
      effort: 'M',
      impact: 'Med',
      priority: 'Should'
    });

    // Performance optimization tasks
    tasks.push({
      id: (taskId++).toString(),
      name: 'Optimize performance and scalability',
      description: 'Implement performance improvements and scalability enhancements',
      acceptanceCriteria: [
        'Response times meet performance targets',
        'Memory usage is optimized',
        'Concurrent request handling is efficient',
        'Scalability bottlenecks are identified and resolved'
      ],
      effort: 'L',
      impact: 'Med',
      priority: 'Could'
    });

    return tasks;
  }

  /**
   * Categorize tasks into Immediate Wins, Short-Term, and Long-Term phases
   */
  protected categorizeTasksByPhase(tasks: Task[]): {
    immediateWins: Task[];
    shortTerm: Task[];
    longTerm: Task[];
  } {
    const immediateWins: Task[] = [];
    const shortTerm: Task[] = [];
    const longTerm: Task[] = [];

    tasks.forEach(task => {
      // Immediate Wins (1-3 tasks): Must-have, small effort, high impact
      if (task.priority === 'Must' && task.effort === 'S') {
        immediateWins.push(task);
      } else if (task.priority === 'Must' && task.effort === 'M' && task.impact === 'High' && immediateWins.length < 3) {
        immediateWins.push(task);
      }
      
      // Long-Term (2-4 tasks): Large effort or Could-have priority
      else if (task.effort === 'L' || task.priority === 'Could') {
        longTerm.push(task);
      }
      
      // Short-Term (3-6 tasks): Everything else
      else {
        shortTerm.push(task);
      }
    });

    // Ensure we have appropriate distribution
    // Move tasks between phases if needed to meet requirements
    
    // Ensure at least 1 immediate win
    if (immediateWins.length === 0 && shortTerm.length > 0) {
      const firstShortTerm = shortTerm.shift()!;
      immediateWins.push(firstShortTerm);
    }

    // Ensure at least 3 short-term tasks
    while (shortTerm.length < 3 && longTerm.length > 2) {
      const task = longTerm.shift()!;
      shortTerm.push(task);
    }

    // Ensure at least 2 long-term tasks
    while (longTerm.length < 2 && shortTerm.length > 3) {
      const task = shortTerm.pop()!;
      longTerm.push(task);
    }

    // Limit immediate wins to 3
    while (immediateWins.length > 3) {
      const task = immediateWins.pop()!;
      shortTerm.unshift(task);
    }

    // Limit short-term to 6
    while (shortTerm.length > 6) {
      const task = shortTerm.pop()!;
      longTerm.push(task);
    }

    // Limit long-term to 4 (but keep at least performance task if it exists)
    while (longTerm.length > 4) {
      const taskToRemove = longTerm.findIndex(task => 
        !task.name.toLowerCase().includes('performance') && 
        !task.name.toLowerCase().includes('scalability')
      );
      if (taskToRemove >= 0) {
        longTerm.splice(taskToRemove, 1);
      } else {
        longTerm.pop(); // Remove last task if no non-performance tasks found
      }
    }

    return { immediateWins, shortTerm, longTerm };
  }
}