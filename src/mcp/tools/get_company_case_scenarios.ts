/**
 * MCP Tool: get_company_case_scenarios
 * 
 * Generates company-specific case study scenarios based on actual company challenges,
 * product launches, and strategic initiatives for realistic interview practice.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { CaseType, CaseFramework } from '../../models/interview';
import { CompanyProfileDatabaseImpl } from '../../components/company-profile-database/index';
import { CompanyProductIntelligence } from '../../components/company-product-intelligence/index';
import { CurrentScenarioGenerator } from '../../components/current-scenario-generator/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface GetCompanyCaseScenariosArgs {
  company_name: string;
  case_type?: CaseType;
  difficulty?: number;
  scenario_count?: number;
  include_recent_context?: boolean;
  role_level?: 'APM' | 'PM' | 'Senior PM';
  time_constraint?: number; // minutes
  focus_frameworks?: CaseFramework[];
}

/**
 * Generate company-specific case study scenarios for interview practice
 */
export async function getCompanyCaseScenarios(
  args: GetCompanyCaseScenariosArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Getting company case scenarios', context, {
      companyName: args.company_name,
      caseType: args.case_type,
      difficulty: args.difficulty,
      scenarioCount: args.scenario_count,
      includeRecentContext: args.include_recent_context,
      roleLevel: args.role_level,
      timeConstraint: args.time_constraint,
      focusFrameworks: args.focus_frameworks
    });

    // Initialize components
    const companyDatabase = new CompanyProfileDatabaseImpl();
    const productIntelligence = new CompanyProductIntelligence();
    const scenarioGenerator = new CurrentScenarioGenerator({
      useRealTimeData: args.include_recent_context ?? true,
      includeCompetitiveContext: true,
      adaptToMarketConditions: true,
      maxScenarioComplexity: args.difficulty ? 
        (args.difficulty <= 2 ? 'simple' : args.difficulty <= 4 ? 'moderate' : 'complex') : 
        'moderate'
    });

    // Get company profile
    const companyProfile = companyDatabase.getCompanyByName(args.company_name);
    if (!companyProfile) {
      throw new Error(`Company profile not found for: ${args.company_name}. Available companies: ${companyDatabase.getAllCompanies().map(c => c.name).join(', ')}`);
    }

    // Get company product intelligence
    const productContext = await productIntelligence.getProductIntelligence(companyProfile.id);

    // Generate scenarios
    const scenarioCount = Math.min(args.scenario_count || 3, 5); // Limit to 5 scenarios
    const scenarios = [];

    for (let i = 0; i < scenarioCount; i++) {
      try {
        // Create scenario request
        const scenarioRequest = {
          caseType: args.case_type || getRandomCaseType(),
          industry: companyProfile.industry[0] || 'Technology',
          difficulty: args.difficulty || 3,
          timeConstraint: args.time_constraint,
          targetCompany: companyProfile.name,
          companyContext: {
            profile: companyProfile,
            productContext: productContext,
            recentLaunches: companyProfile.recentLaunches,
            cultureValues: companyProfile.cultureValues,
            productPhilosophy: companyProfile.productPhilosophy
          },
          focusFrameworks: args.focus_frameworks,
          roleLevel: args.role_level
        };

        // Generate scenario
        const generatedScenario = await scenarioGenerator.generateCurrentScenario(scenarioRequest);
        
        if (generatedScenario) {
          scenarios.push({
            ...generatedScenario.baseScenario,
            companySpecificContext: {
              relevantProducts: companyProfile.recentLaunches.map(l => l.name),
              recentInitiatives: companyProfile.recentLaunches.map(l => l.description),
              competitivePosition: 'Market leader in core segments',
              cultureConsiderations: companyProfile.cultureValues.culturalTraits,
              strategicPriorities: companyProfile.productPhilosophy.productStrategy
            },
            marketIntelligence: null,
            competitiveContext: null
          });
        }
      } catch (scenarioError) {
        MCPLogger.warn('Failed to generate individual scenario', context, {
          scenarioIndex: i,
          error: scenarioError instanceof Error ? scenarioError.message : 'Unknown error'
        });
        
        // Generate fallback scenario
        const fallbackScenario = generateFallbackScenario(
          companyProfile,
          args.case_type || getRandomCaseType(),
          args.difficulty || 3,
          i + 1
        );
        scenarios.push(fallbackScenario);
      }
    }

    MCPLogger.info('Company case scenarios generated successfully', context, {
      companyName: companyProfile.name,
      scenariosGenerated: scenarios.length,
      caseTypes: scenarios.map(s => s.type),
      difficulties: scenarios.map(s => s.difficulty),
      includeRecentContext: args.include_recent_context,
      productContextIncluded: !!productContext
    });

    // Format response
    const response = {
      company: {
        name: companyProfile.name,
        tier: companyProfile.tier,
        industry: companyProfile.industry,
        productFocus: productContext?.productStrategy?.coreStrategy || companyProfile.productPhilosophy.productStrategy
      },
      
      scenarios: scenarios.map((scenario, index) => ({
        scenarioId: scenario.id,
        scenarioNumber: index + 1,
        type: scenario.type,
        title: scenario.title,
        difficulty: scenario.difficulty,
        estimatedTime: scenario.estimatedTime,
        
        scenario: {
          background: scenario.scenario,
          context: scenario.context,
          yourRole: generateRoleContext(companyProfile, args.role_level, scenario.type),
          constraints: scenario.constraints,
          objectives: scenario.objectives,
          successMetrics: generateSuccessMetrics(scenario, companyProfile)
        },
        
        companyContext: {
          relevantProducts: scenario.companySpecificContext?.relevantProducts || [],
          recentInitiatives: scenario.companySpecificContext?.recentInitiatives || [],
          competitivePosition: scenario.companySpecificContext?.competitivePosition,
          cultureConsiderations: scenario.companySpecificContext?.cultureConsiderations || [],
          strategicPriorities: scenario.companySpecificContext?.strategicPriorities || []
        },
        
        frameworkGuidance: {
          recommendedFrameworks: scenario.expectedFrameworks,
          primaryFramework: scenario.expectedFrameworks[0],
          frameworkApplication: generateFrameworkApplication(scenario.expectedFrameworks, scenario.type),
          companySpecificAdaptations: generateCompanyFrameworkAdaptations(companyProfile, scenario.expectedFrameworks)
        },
        
        steps: scenario.steps.map(step => ({
          stepNumber: step.stepNumber,
          stepType: step.stepType,
          title: step.title,
          instruction: step.instruction,
          timeLimit: step.timeLimit,
          frameworks: step.frameworks,
          evaluationCriteria: step.evaluationCriteria,
          companySpecificConsiderations: generateStepCompanyConsiderations(step, companyProfile)
        })),
        
        marketIntelligence: scenario.marketIntelligence ? {
          marketSize: scenario.marketIntelligence.marketSize,
          competitors: scenario.marketIntelligence.competitors,
          trends: scenario.marketIntelligence.trends,
          keyMetrics: scenario.marketIntelligence.keyMetrics,
          competitiveInsights: scenario.marketIntelligence.competitiveInsights
        } : null,
        
        evaluationCriteria: {
          companySpecificWeights: generateCompanySpecificWeights(companyProfile, scenario.type),
          keySuccessFactors: generateKeySuccessFactors(companyProfile, scenario.type),
          commonPitfalls: generateCommonPitfalls(companyProfile, scenario.type),
          differentiators: generateDifferentiators(companyProfile, scenario.type)
        },
        
        preparationTips: {
          companyResearch: generateCompanyResearchTips(companyProfile, scenario),
          frameworkPrep: generateFrameworkPrepTips(scenario.expectedFrameworks),
          roleSpecificTips: generateRoleSpecificTips(args.role_level, scenario.type),
          timeManagement: generateTimeManagementTips(scenario.estimatedTime, scenario.steps.length)
        }
      })),
      
      practiceRecommendations: {
        practiceOrder: generatePracticeOrder(scenarios),
        timeAllocation: generateTimeAllocation(scenarios),
        progressionPath: generateProgressionPath(scenarios, args.role_level),
        additionalResources: generateAdditionalResources(companyProfile, scenarios)
      },
      
      companyInsights: {
        interviewStyle: companyProfile.evaluationCriteria.feedbackStyle,
        keyFocusAreas: getCompanyFocusAreas(companyProfile),
        culturalConsiderations: companyProfile.cultureValues.culturalTraits,
        productPhilosophyAlignment: companyProfile.productPhilosophy.productPrinciples,
        recentDevelopments: companyProfile.recentLaunches.slice(0, 3).map(launch => ({
          name: launch.name,
          relevance: `Consider how this ${launch.category} launch relates to your case solutions`
        }))
      }
    };

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 3, // Scenario generation is resource intensive
      scenariosGenerated: scenarios.length,
      company: companyProfile.name,
      caseTypes: scenarios.map(s => s.type),
      marketDataIncluded: scenarios.some(s => !!s.marketIntelligence),
      nextAction: 'Select a scenario and use start_case_study to begin practice'
    });

  } catch (error) {
    MCPLogger.error('get_company_case_scenarios tool failed', error as Error, context, {
      companyName: args.company_name,
      caseType: args.case_type,
      scenarioCount: args.scenario_count
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in get_company_case_scenarios'),
      context
    );
  }
}

// Helper functions for scenario generation
function getRandomCaseType(): CaseType {
  const types: CaseType[] = ['product_design', 'strategy', 'prioritization', 'market_entry'];
  return types[Math.floor(Math.random() * types.length)];
}

function generateFallbackScenario(
  companyProfile: any,
  caseType: CaseType,
  difficulty: number,
  scenarioNumber: number
): any {
  const scenarioId = `${companyProfile.id}_${caseType}_fallback_${scenarioNumber}`;
  
  const scenarios = {
    product_design: {
      title: `Design a new product for ${companyProfile.name}`,
      scenario: `${companyProfile.name} is looking to expand into a new market segment. Design a product that aligns with the company's core values and product philosophy.`,
      context: `Consider ${companyProfile.name}'s existing product portfolio and strategic priorities.`
    },
    strategy: {
      title: `Strategic initiative for ${companyProfile.name}`,
      scenario: `${companyProfile.name} needs to respond to changing market conditions in their core business. Develop a strategic approach.`,
      context: `Leverage ${companyProfile.name}'s competitive advantages and market position.`
    },
    prioritization: {
      title: `Feature prioritization at ${companyProfile.name}`,
      scenario: `You're a PM at ${companyProfile.name} with limited engineering resources. Prioritize features for the next quarter.`,
      context: `Consider company OKRs and customer impact metrics.`
    },
    market_entry: {
      title: `Market expansion for ${companyProfile.name}`,
      scenario: `${companyProfile.name} is considering entering a new geographic market. Evaluate the opportunity and create an entry strategy.`,
      context: `Consider regulatory, competitive, and cultural factors.`
    }
  };

  const baseScenario = scenarios[caseType];
  
  return {
    id: scenarioId,
    type: caseType,
    title: baseScenario.title,
    scenario: baseScenario.scenario,
    context: baseScenario.context,
    constraints: [`Limited to ${companyProfile.name}'s existing capabilities`, 'Budget constraints apply'],
    objectives: ['Align with company values', 'Demonstrate strategic thinking', 'Show measurable impact'],
    expectedFrameworks: getDefaultFrameworks(caseType),
    difficulty,
    estimatedTime: 45,
    industry: companyProfile.industry[0],
    company: companyProfile.name,
    tags: ['company-specific', 'fallback', caseType],
    steps: generateDefaultSteps(caseType)
  };
}

function getDefaultFrameworks(caseType: CaseType): CaseFramework[] {
  switch (caseType) {
    case 'product_design':
      return ['CIRCLES', 'Jobs_to_be_Done'];
    case 'strategy':
      return ['SWOT', 'Porter_Five_Forces'];
    case 'prioritization':
      return ['RICE', 'North_Star'];
    case 'market_entry':
      return ['Porter_Five_Forces', 'SWOT'];
    default:
      return ['SWOT'];
  }
}

function generateDefaultSteps(caseType: CaseType): any[] {
  const baseSteps = [
    {
      stepNumber: 1,
      stepType: 'clarification',
      title: 'Clarify the Problem',
      instruction: 'Ask clarifying questions to understand the scope and constraints',
      timeLimit: 8,
      frameworks: ['CIRCLES'],
      evaluationCriteria: ['Clear problem understanding', 'Relevant questions asked']
    },
    {
      stepNumber: 2,
      stepType: 'analysis',
      title: 'Analyze the Situation',
      instruction: 'Break down the problem and analyze key factors',
      timeLimit: 12,
      frameworks: getDefaultFrameworks(caseType),
      evaluationCriteria: ['Structured analysis', 'Framework application']
    },
    {
      stepNumber: 3,
      stepType: 'recommendation',
      title: 'Provide Recommendations',
      instruction: 'Present your solution with clear rationale',
      timeLimit: 10,
      frameworks: ['North_Star'],
      evaluationCriteria: ['Clear recommendations', 'Strong rationale', 'Implementation considerations']
    }
  ];

  return baseSteps;
}

function generateRoleContext(companyProfile: any, roleLevel?: string, caseType?: CaseType): string {
  const level = roleLevel || 'PM';
  const company = companyProfile.name;
  
  const contexts = {
    product_design: `You are a ${level} at ${company} tasked with designing a new product that aligns with the company's product philosophy and user-centric approach.`,
    strategy: `You are a ${level} at ${company} responsible for developing strategic initiatives that support the company's long-term vision and competitive position.`,
    prioritization: `You are a ${level} at ${company} managing a product roadmap with competing priorities and limited resources.`,
    market_entry: `You are a ${level} at ${company} evaluating new market opportunities and developing go-to-market strategies.`
  };
  
  return contexts[caseType as CaseType] || `You are a ${level} at ${company} working on a strategic product challenge.`;
}

function generateSuccessMetrics(scenario: any, companyProfile: any): string[] {
  const metrics = [
    'Alignment with company values and culture',
    'Clear problem-solving methodology',
    'Data-driven decision making',
    'Consideration of user impact'
  ];
  
  // Add company-specific metrics
  if (companyProfile.productPhilosophy.keyMetrics) {
    metrics.push(`Focus on ${companyProfile.productPhilosophy.keyMetrics.slice(0, 2).join(' and ')}`);
  }
  
  return metrics;
}

function generateFrameworkApplication(frameworks: CaseFramework[], caseType: CaseType): any[] {
  return frameworks.map(framework => ({
    framework,
    application: `Apply ${framework} to structure your ${caseType} analysis`,
    keySteps: getFrameworkSteps(framework),
    companyRelevance: `Particularly relevant for ${caseType} cases at this company`
  }));
}

function getFrameworkSteps(framework: CaseFramework): string[] {
  const steps: Partial<Record<CaseFramework, string[]>> = {
    'CIRCLES': ['Comprehend', 'Identify', 'Report', 'Cut', 'List', 'Evaluate', 'Summarize'],
    'RICE': ['Reach', 'Impact', 'Confidence', 'Effort'],
    'SWOT': ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
    'Porter_Five_Forces': ['Competitive Rivalry', 'Supplier Power', 'Buyer Power', 'Threat of Substitution', 'Threat of New Entry'],
    'Jobs_to_be_Done': ['Job Definition', 'Job Mapping', 'Outcome Expectations', 'Solution Design'],
    'North_Star': ['North Star Metric', 'Input Metrics', 'Success Metrics', 'Counter Metrics'],
    'OKRs': ['Objectives', 'Key Results', 'Initiatives', 'Tracking'],
    'Lean_Canvas': ['Problem', 'Solution', 'Key Metrics', 'Unique Value Proposition', 'Unfair Advantage', 'Channels', 'Customer Segments', 'Cost Structure', 'Revenue Streams']
  };
  
  return steps[framework] || ['Define', 'Analyze', 'Evaluate', 'Recommend'];
}

function generateCompanyFrameworkAdaptations(companyProfile: any, frameworks: CaseFramework[]): any[] {
  return frameworks.map(framework => ({
    framework,
    companyAdaptation: `At ${companyProfile.name}, emphasize ${getCompanyFrameworkEmphasis(companyProfile, framework)}`,
    culturalAlignment: `Align with ${companyProfile.cultureValues.coreValues[0] || 'company values'}`,
    productPhilosophyIntegration: `Consider ${companyProfile.productPhilosophy.productPrinciples[0] || 'product principles'}`
  }));
}

function getCompanyFrameworkEmphasis(companyProfile: any, framework: CaseFramework): string {
  const emphases: Record<string, Partial<Record<CaseFramework, string>>> = {
    'Google': {
      'CIRCLES': 'user research and technical feasibility',
      'RICE': 'data-driven impact measurement',
      'SWOT': 'innovation opportunities and technical strengths'
    },
    'Amazon': {
      'CIRCLES': 'customer obsession and working backwards',
      'RICE': 'customer impact and long-term value',
      'SWOT': 'customer-centric opportunities'
    }
  };
  
  return emphases[companyProfile.name]?.[framework] || 'systematic analysis and clear reasoning';
}

function generateStepCompanyConsiderations(step: any, companyProfile: any): string[] {
  const considerations = [
    `Apply ${companyProfile.name}'s ${step.stepType} best practices`,
    `Consider company culture and values in your approach`
  ];
  
  if (companyProfile.cultureValues.leadershipPrinciples?.length > 0) {
    considerations.push(`Reference relevant leadership principles`);
  }
  
  return considerations;
}

function generateCompanySpecificWeights(companyProfile: any, caseType: CaseType): any {
  const baseWeights = companyProfile.questionWeighting;
  
  // Adjust weights based on case type
  const adjustments: Record<CaseType, any> = {
    'product_design': { productSense: 0.4, analytical: 0.3, technical: 0.2, behavioral: 0.1 },
    'strategy': { analytical: 0.4, productSense: 0.3, behavioral: 0.2, technical: 0.1 },
    'prioritization': { analytical: 0.5, productSense: 0.3, behavioral: 0.2 },
    'market_entry': { analytical: 0.4, strategy: 0.3, productSense: 0.2, behavioral: 0.1 }
  };
  
  return { ...baseWeights, ...adjustments[caseType] };
}

function generateKeySuccessFactors(companyProfile: any, caseType: CaseType): string[] {
  const factors = [
    'Clear structured thinking',
    'Data-driven analysis',
    'User-centric approach'
  ];
  
  // Add company-specific factors
  factors.push(`Alignment with ${companyProfile.name} values`);
  
  if (companyProfile.productPhilosophy.competitiveAdvantages.length > 0) {
    factors.push(`Leverage ${companyProfile.productPhilosophy.competitiveAdvantages[0]}`);
  }
  
  return factors;
}

function generateCommonPitfalls(companyProfile: any, caseType: CaseType): string[] {
  const pitfalls = [
    'Jumping to solutions without analysis',
    'Ignoring company culture and values',
    'Not considering technical feasibility',
    'Weak quantitative analysis'
  ];
  
  // Add company-specific pitfalls
  if (companyProfile.evaluationCriteria.dealBreakers) {
    pitfalls.push(...companyProfile.evaluationCriteria.dealBreakers.slice(0, 2));
  }
  
  return pitfalls;
}

function generateDifferentiators(companyProfile: any, caseType: CaseType): string[] {
  const differentiators = [
    'Deep company knowledge',
    'Framework mastery',
    'Creative problem-solving'
  ];
  
  // Add company-specific differentiators
  if (companyProfile.evaluationCriteria.differentiators) {
    differentiators.push(...companyProfile.evaluationCriteria.differentiators.slice(0, 2));
  }
  
  return differentiators;
}

function generateCompanyResearchTips(companyProfile: any, scenario: any): string[] {
  return [
    `Study ${companyProfile.name}'s recent product launches`,
    'Understand company mission and values',
    'Research competitive landscape',
    'Review company blog and thought leadership'
  ];
}

function generateFrameworkPrepTips(frameworks: CaseFramework[]): string[] {
  return frameworks.map(framework => 
    `Master ${framework} framework structure and application`
  );
}

function generateRoleSpecificTips(roleLevel?: string, caseType?: CaseType): string[] {
  const tips = [`Demonstrate ${roleLevel || 'PM'} level thinking and scope`];
  
  switch (roleLevel) {
    case 'APM':
      tips.push('Focus on learning and structured thinking');
      tips.push('Show curiosity and analytical skills');
      break;
    case 'Senior PM':
      tips.push('Demonstrate strategic thinking and leadership');
      tips.push('Consider cross-functional impact and stakeholder management');
      break;
    default:
      tips.push('Balance tactical execution with strategic thinking');
  }
  
  return tips;
}

function generateTimeManagementTips(estimatedTime: number, stepCount: number): string[] {
  const timePerStep = Math.floor(estimatedTime / stepCount);
  
  return [
    `Allocate approximately ${timePerStep} minutes per step`,
    'Spend 30% of time on problem understanding',
    'Reserve 20% of time for final recommendations',
    'Practice with timer to build time awareness'
  ];
}

function generatePracticeOrder(scenarios: any[]): string[] {
  return scenarios
    .sort((a, b) => a.difficulty - b.difficulty)
    .map((scenario, index) => 
      `${index + 1}. ${scenario.title} (Difficulty: ${scenario.difficulty}/5)`
    );
}

function generateTimeAllocation(scenarios: any[]): any {
  const totalTime = scenarios.reduce((sum, s) => sum + s.estimatedTime, 0);
  
  return {
    totalEstimatedTime: totalTime,
    recommendedSessions: Math.ceil(scenarios.length / 2),
    timePerSession: Math.ceil(totalTime / Math.ceil(scenarios.length / 2)),
    practiceFrequency: 'Every 2-3 days for optimal retention'
  };
}

function generateProgressionPath(scenarios: any[], roleLevel?: string): any[] {
  return scenarios.map((scenario, index) => ({
    order: index + 1,
    scenario: scenario.title,
    focus: `Master ${scenario.expectedFrameworks[0]} framework application`,
    milestone: `Complete ${scenario.type} case with confidence`,
    readinessIndicator: `Score 4+ on framework application and company alignment`
  }));
}

function generateAdditionalResources(companyProfile: any, scenarios: any[]): any[] {
  const resources = [
    {
      type: 'Company Research',
      resource: `${companyProfile.name} careers page and blog`,
      relevance: 'Understanding company culture and recent initiatives'
    },
    {
      type: 'Framework Practice',
      resource: 'PM framework guides and practice exercises',
      relevance: 'Mastering frameworks used in scenarios'
    }
  ];
  
  // Add scenario-specific resources
  const uniqueFrameworks = [...new Set(scenarios.flatMap(s => s.expectedFrameworks))];
  uniqueFrameworks.forEach(framework => {
    resources.push({
      type: 'Framework Guide',
      resource: `${framework} framework deep dive`,
      relevance: `Essential for ${framework}-based scenarios`
    });
  });
  
  return resources;
}

function getCompanyFocusAreas(companyProfile: any): string[] {
  const focusAreas = [];
  
  const weights = companyProfile.questionWeighting;
  if (weights.behavioral >= 0.3) focusAreas.push('Behavioral/Culture Fit');
  if (weights.productSense >= 0.25) focusAreas.push('Product Sense');
  if (weights.analytical >= 0.2) focusAreas.push('Analytical Thinking');
  
  return focusAreas;
}

/**
 * Input schema for get_company_case_scenarios tool
 */
export const getCompanyCaseScenariosSchema = {
  type: 'object',
  properties: {
    company_name: {
      type: 'string',
      description: 'Name of the target company for case scenarios',
      examples: ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Uber', 'Airbnb']
    },
    case_type: {
      type: 'string',
      enum: ['product_design', 'strategy', 'prioritization', 'market_entry'],
      description: 'Specific type of case study (optional - generates mixed types if not specified)'
    },
    difficulty: {
      type: 'number',
      minimum: 1,
      maximum: 5,
      description: 'Case difficulty level from 1 (easy) to 5 (hard) (default: 3)',
      default: 3
    },
    scenario_count: {
      type: 'number',
      minimum: 1,
      maximum: 5,
      description: 'Number of scenarios to generate (default: 3)',
      default: 3
    },
    include_recent_context: {
      type: 'boolean',
      description: 'Include recent company developments and market context (default: true)',
      default: true
    },
    role_level: {
      type: 'string',
      enum: ['APM', 'PM', 'Senior PM'],
      description: 'Target role level for scenario complexity (optional)'
    },
    time_constraint: {
      type: 'number',
      description: 'Time constraint for scenarios in minutes (default: 45)',
      minimum: 20,
      maximum: 90,
      default: 45
    },
    focus_frameworks: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['CIRCLES', 'RICE', 'SWOT', 'Porter_Five_Forces', 'Jobs_to_be_Done', 'North_Star', 'OKRs', 'Lean_Canvas']
      },
      description: 'Specific frameworks to emphasize in scenarios (optional)',
      maxItems: 3
    }
  },
  required: ['company_name'],
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const getCompanyCaseScenariosDescription = 
  'Generates realistic, company-specific case study scenarios based on actual company challenges, product launches, and strategic initiatives. Includes market intelligence, competitive context, and company-specific evaluation criteria for authentic interview practice.';