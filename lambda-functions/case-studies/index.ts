// Case Studies Lambda Function
// Handles 5 PM case study practice tools

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import {
  LambdaRequest,
  LambdaResponse,
  CaseStudyArgs,
  ToolNotFoundError,
  ToolExecutionError
} from '../shared/types';
import {
  validateLambdaRequest,
  formatSuccessResponse,
  formatErrorResponse,
  formatApiGatewayResponse,
  executeTool,
  loadEnvironmentConfig,
  Logger,
  PerformanceTimer
} from '../shared/utils';

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const config = loadEnvironmentConfig();
  const logger = new Logger(config);
  const timer = new PerformanceTimer();

  try {
    logger.info('Case Studies Lambda invoked', {
      requestId: context.awsRequestId,
      functionName: context.functionName
    });

    // Parse and validate request
    let requestBody: any;
    try {
      requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return formatApiGatewayResponse(400, {
        success: false,
        error: 'Invalid JSON in request body'
      });
    }

    const request = validateLambdaRequest(requestBody);

    // Route to appropriate tool handler
    const result = await routeToTool(request.toolName, request.toolArgs, logger);

    const executionTime = timer.measure();
    logger.info('Case Studies Lambda completed', {
      requestId: context.awsRequestId,
      toolName: request.toolName,
      executionTime,
      success: result.success
    });

    const response = formatSuccessResponse(
      result,
      context.awsRequestId,
      request.toolName,
      executionTime
    );

    return formatApiGatewayResponse(200, response);

  } catch (error) {
    const executionTime = timer.measure();
    logger.error('Case Studies Lambda error', error as Error, {
      requestId: context.awsRequestId,
      executionTime
    });

    const response = formatErrorResponse(error as Error, context.awsRequestId);
    const statusCode = (error as any)?.statusCode || 500;

    return formatApiGatewayResponse(statusCode, response);
  }
};

// Tool routing and execution
async function routeToTool(toolName: string, toolArgs: Record<string, any>, logger: Logger): Promise<any> {
  const toolHandlers: Record<string, Function> = {
    'start_case_study': handleStartCaseStudy,
    'get_case_guidance': handleGetCaseGuidance,
    'evaluate_case_approach': handleEvaluateCaseApproach,
    'complete_case_study': handleCompleteCaseStudy,
    'get_company_case_scenarios': handleGetCompanyCaseScenarios
  };

  const handler = toolHandlers[toolName];
  if (!handler) {
    throw new ToolNotFoundError(toolName);
  }

  return await executeTool(toolName, toolArgs, handler);
}

// Tool Handlers

export async function handleStartCaseStudy(args: CaseStudyArgs): Promise<any> {
  const { case_type, industry, difficulty_level, time_limit, company_style, role_level } = args;

  return {
    caseStudy: {
      sessionId: `case_${Date.now()}`,
      caseType: case_type || 'product_design',
      industry: industry || 'Technology',
      difficultyLevel: difficulty_level || 3,
      timeLimit: time_limit || 45,
      companyStyle: company_style || 'Modern tech company',
      roleLevel: role_level || 'PM',

      caseBrief: {
        title: generateCaseTitle(case_type || 'product_design', industry || 'Technology'),
        background: generateCaseBackground(case_type || 'product_design', industry || 'Technology'),
        challenge: generateCaseChallenge(case_type || 'product_design'),
        objectives: [
          'Analyze the situation thoroughly',
          'Develop a structured approach',
          'Provide actionable recommendations',
          'Consider implementation feasibility'
        ],
        constraints: [
          'Limited time and resources',
          'Multiple stakeholder interests',
          'Market and competitive pressures',
          'Technical and operational limitations'
        ]
      },

      frameworkGuidance: {
        recommendedFrameworks: getRecommendedFrameworks(case_type || 'product_design'),
        structure: [
          'Clarify and understand the problem',
          'Analyze available data and information',
          'Generate multiple solution options',
          'Evaluate options using criteria',
          'Recommend solution with implementation plan'
        ],
        successCriteria: [
          'Logical and structured thinking',
          'Data-driven analysis and recommendations',
          'Clear communication of thought process',
          'Practical and actionable solutions'
        ]
      },

      evaluationCriteria: [
        {
          category: 'Problem Solving',
          weight: 30,
          criteria: [
            'Clear problem definition',
            'Structured analysis approach',
            'Logical solution development'
          ]
        },
        {
          category: 'Business Acumen',
          weight: 25,
          criteria: [
            'Understanding of business implications',
            'Market and competitive awareness',
            'Strategic thinking ability'
          ]
        },
        {
          category: 'Communication',
          weight: 25,
          criteria: [
            'Clear articulation of thoughts',
            'Structured presentation',
            'Effective use of frameworks'
          ]
        },
        {
          category: 'Leadership',
          weight: 20,
          criteria: [
            'Stakeholder consideration',
            'Implementation planning',
            'Risk assessment and mitigation'
          ]
        }
      ],

      startTime: new Date().toISOString(),
      estimatedEndTime: new Date(Date.now() + (time_limit || 45) * 60 * 1000).toISOString(),

      nextSteps: [
        'Read case brief carefully',
        'Ask clarifying questions if needed',
        'Structure your approach',
        'Begin analysis and solution development'
      ]
    }
  };
}

export async function handleGetCaseGuidance(args: CaseStudyArgs): Promise<any> {
  const { session_id, current_step, request_type, user_progress } = args;

  return {
    caseGuidance: {
      sessionId: session_id || 'unknown',
      currentStep: current_step || 'Analysis phase',
      requestType: request_type || 'framework',
      userProgress: user_progress || 'In progress',

      guidance: {
        framework: request_type === 'framework' ? provideFrameworkGuidance(current_step || 'analysis') : undefined,
        hint: request_type === 'hint' ? provideHint(current_step || 'analysis') : undefined,
        clarification: request_type === 'clarification' ? provideClarification(current_step || 'analysis') : undefined,
        nextStep: request_type === 'next_step' ? suggestNextStep(current_step || 'analysis') : undefined
      },

      recommendedActions: [
        'Structure your analysis using PM frameworks',
        'Consider multiple stakeholder perspectives',
        'Use data-driven decision making',
        'Develop actionable implementation plan'
      ],

      commonPitfalls: [
        'Jumping to solutions without analysis',
        'Not considering implementation feasibility',
        'Ignoring stakeholder interests',
        'Lack of clear prioritization'
      ],

      timeManagement: {
        totalTime: 45,
        recommendedAllocation: {
          'Problem Analysis': '15%',
          'Solution Generation': '35%',
          'Evaluation': '25%',
          'Recommendation': '25%'
        },
        currentPace: 'on_track'
      },

      qualityIndicators: [
        'Clear problem definition',
        'Structured analysis approach',
        'Multiple solution options considered',
        'Data-driven recommendations',
        'Practical implementation plan'
      ]
    }
  };
}

export async function handleEvaluateCaseApproach(args: CaseStudyArgs): Promise<any> {
  const { session_id, step_number, user_approach, frameworks_used, request_detailed_feedback } = args;

  return {
    caseEvaluation: {
      sessionId: session_id || 'unknown',
      stepNumber: step_number || 1,
      evaluationDate: new Date().toISOString(),

      approachAssessment: {
        structure: {
          score: 8,
          feedback: 'Well-structured approach with clear framework usage',
          strengths: ['Logical flow', 'Clear methodology', 'Good use of frameworks'],
          improvements: ['Could add more depth to analysis']
        },
        content: {
          score: 7,
          feedback: 'Good content with relevant insights',
          strengths: ['Identified key issues', 'Considered multiple perspectives'],
          improvements: ['Add more quantitative analysis', 'Strengthen business case']
        },
        frameworks: {
          score: 8,
          feedback: 'Appropriate frameworks applied effectively',
          frameworksUsed: frameworks_used || ['Standard PM frameworks'],
          effectiveness: 'high',
          suggestions: ['Consider additional analytical frameworks', 'Apply prioritization matrix']
        }
      },

      overallScore: 7.5,
      grade: 'Good',

      detailedFeedback: [
        'Strong structured thinking approach',
        'Good identification of key issues',
        'Effective use of PM frameworks',
        'Clear communication of thought process'
      ],

      improvementAreas: [
        'Add more quantitative analysis',
        'Strengthen business impact assessment',
        'Consider additional stakeholder perspectives',
        'Develop more detailed implementation plan'
      ],

      strengths: [
        'Structured problem-solving approach',
        'Good framework application',
        'Clear communication style',
        'Comprehensive issue identification'
      ],

      recommendations: [
        'Continue with current structured approach',
        'Add quantitative analysis where possible',
        'Develop detailed implementation roadmap',
        'Consider stakeholder impact assessment'
      ],

      nextSteps: [
        'Proceed to solution evaluation phase',
        'Develop implementation plan',
        'Prepare final recommendations',
        'Review and refine approach'
      ]
    }
  };
}

export async function handleCompleteCaseStudy(args: CaseStudyArgs): Promise<any> {
  const { session_id, include_detailed_breakdown, include_recommendations, include_performance_analytics } = args;

  return {
    caseStudyCompletion: {
      sessionId: session_id || 'unknown',
      completionDate: new Date().toISOString(),
      includeDetailedBreakdown: include_detailed_breakdown || true,
      includeRecommendations: include_recommendations || true,
      includePerformanceAnalytics: include_performance_analytics || false,

      finalEvaluation: {
        overallScore: 7.8,
        grade: 'Good',
        percentile: 75,
        strengths: [
          'Strong analytical thinking',
          'Good problem structuring',
          'Effective framework usage',
          'Clear communication'
        ],
        areasForImprovement: [
          'Quantitative analysis depth',
          'Implementation detail level',
          'Stakeholder consideration breadth'
        ]
      },

      detailedBreakdown: {
        problemSolving: { score: 8.2, weight: 30, contribution: 2.46 },
        businessAcumen: { score: 7.5, weight: 25, contribution: 1.88 },
        communication: { score: 8.0, weight: 25, contribution: 2.0 },
        leadership: { score: 7.2, weight: 20, contribution: 1.44 },
        totalWeightedScore: 7.78
      },

      recommendations: [
        'Continue practicing case studies regularly',
        'Focus on quantitative analysis skills',
        'Develop implementation planning expertise',
        'Study advanced PM frameworks',
        'Practice stakeholder management scenarios'
      ],

      studyPlan: {
        immediate: [
          'Practice 2-3 case studies per week',
          'Focus on quantitative analysis',
          'Study implementation frameworks',
          'Record practice sessions for review'
        ],
        intermediate: [
          'Advanced case study workshops',
          'Peer mock case sessions',
          'Industry-specific case studies',
          'Real project application'
        ],
        longTerm: [
          'Develop case study expertise',
          'Mentor junior PMs',
          'Contribute to case study library',
          'Lead case study sessions'
        ]
      },

      performanceAnalytics: {
        sessionsCompleted: 12,
        averageScore: 7.2,
        improvementTrend: '+8% over last 5 sessions',
        strengthAreas: ['Communication', 'Problem Solving'],
        developmentAreas: ['Quantitative Analysis', 'Implementation Planning'],
        timeToCompletion: '42 minutes (within limit)',
        frameworkUsage: 'Good variety and application'
      },

      nextMilestones: [
        'Complete 20 total case studies',
        'Achieve 8.0+ average score',
        'Master advanced frameworks',
        'Lead case study discussions'
      ]
    }
  };
}

export async function handleGetCompanyCaseScenarios(args: CaseStudyArgs): Promise<any> {
  const { company_name, case_type, role_level, use_real_products, difficulty_level } = args;

  return {
    companyCaseScenarios: {
      companyName: company_name || 'Target Company',
      caseType: case_type || 'product_design',
      roleLevel: role_level || 'PM',
      useRealProducts: use_real_products || true,
      difficultyLevel: difficulty_level || 3,

      scenarios: [
        {
          id: 'SCENARIO1',
          title: 'Product Launch Optimization',
          description: 'Optimize product launch strategy for maximum market impact',
          context: 'Company preparing to launch new flagship product',
          challenge: 'Balance speed to market with quality and market readiness',
          objectives: [
            'Maximize market penetration',
            'Optimize launch timing',
            'Minimize risk of failure',
            'Achieve revenue targets'
          ],
          constraints: [
            'Limited marketing budget',
            'Competitive time pressure',
            'Technical dependencies',
            'Resource limitations'
          ],
          data: {
            marketSize: '$2.5B',
            targetSegment: 'Enterprise customers',
            competitiveLandscape: '3 major competitors',
            timeline: '6 months to launch'
          }
        },
        {
          id: 'SCENARIO2',
          title: 'Market Expansion Strategy',
          description: 'Develop strategy for entering new geographic market',
          context: 'Company considering expansion into European market',
          challenge: 'Adapt product and strategy for new market conditions',
          objectives: [
            'Assess market opportunity',
            'Develop entry strategy',
            'Plan resource allocation',
            'Mitigate expansion risks'
          ],
          constraints: [
            'Regulatory differences',
            'Cultural adaptation needs',
            'Competitive landscape',
            'Budget limitations'
          ],
          data: {
            marketSize: '$800M',
            growthRate: '12% annually',
            localCompetition: '2 established players',
            entryBarriers: 'Medium'
          }
        },
        {
          id: 'SCENARIO3',
          title: 'Feature Prioritization',
          description: 'Prioritize product features for upcoming release',
          context: 'Product team overwhelmed with feature requests',
          challenge: 'Balance customer needs with business objectives',
          objectives: [
            'Identify high-impact features',
            'Create development roadmap',
            'Align with business strategy',
            'Manage stakeholder expectations'
          ],
          constraints: [
            'Limited development capacity',
            'Time-to-market pressure',
            'Resource constraints',
            'Multiple stakeholder interests'
          ],
          data: {
            featureRequests: '25 pending',
            developmentCapacity: '5 engineers',
            timeline: '3 months',
            successMetrics: 'User adoption, revenue impact'
          }
        }
      ],

      companyContext: {
        industry: 'SaaS Technology',
        size: 'Mid-market company',
        growthStage: 'Scaling phase',
        keyProducts: [
          'Core platform product',
          'Mobile application',
          'API ecosystem'
        ],
        strategicFocus: [
          'Product-led growth',
          'Market expansion',
          'Operational efficiency'
        ]
      },

      evaluationFramework: {
        criteria: [
          'Strategic alignment',
          'Market opportunity',
          'Implementation feasibility',
          'Risk assessment',
          'Resource requirements'
        ],
        weighting: {
          'Strategic alignment': 25,
          'Market opportunity': 30,
          'Implementation feasibility': 20,
          'Risk assessment': 15,
          'Resource requirements': 10
        }
      },

      preparationTips: [
        'Research company products and market position',
        'Understand their strategic priorities',
        'Consider their constraints and challenges',
        'Apply relevant PM frameworks',
        'Focus on practical, actionable solutions'
      ],

      successFactors: [
        'Demonstrate understanding of company context',
        'Provide data-driven recommendations',
        'Show strategic thinking ability',
        'Communicate clearly and confidently',
        'Balance multiple stakeholder interests'
      ]
    }
  };
}

// Helper functions

function generateCaseTitle(caseType: string, industry: string): string {
  const titles = {
    product_design: `${industry} Product Design Challenge`,
    strategy: `${industry} Strategic Decision Case`,
    prioritization: `${industry} Feature Prioritization Scenario`,
    market_entry: `${industry} Market Entry Strategy`,
    growth: `${industry} Growth Strategy Case`,
    monetization: `${industry} Monetization Strategy`
  };
  return titles[caseType as keyof typeof titles] || `${industry} PM Case Study`;
}

function generateCaseBackground(caseType: string, industry: string): string {
  const backgrounds = {
    product_design: `Leading ${industry} company facing product design decisions for next-generation offering`,
    strategy: `${industry} company at strategic inflection point requiring major strategic decisions`,
    prioritization: `Growing ${industry} company overwhelmed with feature requests and prioritization challenges`,
    market_entry: `${industry} company considering expansion into new markets`,
    growth: `Successful ${industry} company planning next phase of growth`,
    monetization: `${industry} company developing monetization strategy for new product line`
  };
  return backgrounds[caseType as keyof typeof backgrounds] || `PM case study in ${industry} sector`;
}

function generateCaseChallenge(caseType: string): string {
  const challenges = {
    product_design: 'Design optimal product solution balancing user needs, technical feasibility, and business objectives',
    strategy: 'Develop strategic direction that maximizes opportunities while managing risks and resource constraints',
    prioritization: 'Prioritize features and initiatives to maximize business impact within resource limitations',
    market_entry: 'Develop market entry strategy that balances speed with risk mitigation and resource optimization',
    growth: 'Scale operations while maintaining quality, culture, and competitive advantage',
    monetization: 'Develop monetization strategy that maximizes revenue while maintaining user value and market position'
  };
  return challenges[caseType as keyof typeof challenges] || 'Strategic PM challenge requiring structured analysis';
}

function getRecommendedFrameworks(caseType: string): string[] {
  const frameworks = {
    product_design: ['Design Thinking', 'User-Centered Design', 'Jobs-to-be-Done'],
    strategy: ['SWOT Analysis', 'Porter\'s Five Forces', 'Blue Ocean Strategy'],
    prioritization: ['MoSCoW Method', 'Kano Model', 'RICE Framework'],
    market_entry: ['Market Entry Framework', '4Ps of Marketing', 'Customer Segmentation'],
    growth: ['Growth Loops', 'AARRR Framework', 'Scaling Frameworks'],
    monetization: ['Value-Based Pricing', 'Monetization Canvas', 'Revenue Modeling']
  };
  return frameworks[caseType as keyof typeof frameworks] || ['General PM frameworks'];
}

function provideFrameworkGuidance(step: string): string {
  const guidance = {
    analysis: 'Use MECE framework to break down the problem into mutually exclusive, collectively exhaustive components',
    solution: 'Apply design thinking principles: empathize, define, ideate, prototype, test',
    evaluation: 'Use weighted scoring matrix with criteria: impact, feasibility, cost, timeline',
    recommendation: 'Structure recommendation with: clear choice, rationale, implementation plan, success metrics'
  };
  return guidance[step as keyof typeof guidance] || 'Apply appropriate PM frameworks for current step';
}

function provideHint(step: string): string {
  const hints = {
    analysis: 'Focus on understanding the root cause and key drivers of the situation',
    solution: 'Generate 3-4 distinct solution options before evaluating them',
    evaluation: 'Consider both quantitative metrics and qualitative factors',
    recommendation: 'Make your recommendation specific and actionable with clear next steps'
  };
  return hints[step as keyof typeof hints] || 'Think systematically about the current challenge';
}

function provideClarification(step: string): string {
  const clarifications = {
    analysis: 'Break down the problem into: market factors, internal capabilities, competitive landscape, customer needs',
    solution: 'Consider solutions across: product, process, people, technology dimensions',
    evaluation: 'Evaluate using: strategic fit, financial impact, implementation feasibility, risk assessment',
    recommendation: 'Structure as: recommended approach, alternatives considered, implementation roadmap, success metrics'
  };
  return clarifications[step as keyof typeof clarifications] || 'Clarify your thinking for the current phase';
}

function suggestNextStep(step: string): string {
  const nextSteps = {
    analysis: 'Move to solution generation phase with multiple options',
    solution: 'Proceed to evaluation and comparison of alternatives',
    evaluation: 'Develop final recommendation with implementation plan',
    recommendation: 'Prepare presentation and defend your approach'
  };
  return nextSteps[step as keyof typeof nextSteps] || 'Continue with structured PM approach';
}
