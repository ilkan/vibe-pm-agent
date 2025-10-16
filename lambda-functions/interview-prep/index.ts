// Interview Prep Lambda Function
// Handles 6 PM interview preparation tools

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import {
  LambdaRequest,
  LambdaResponse,
  InterviewPrepArgs,
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
    logger.info('Interview Prep Lambda invoked', {
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
    logger.info('Interview Prep Lambda completed', {
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
    logger.error('Interview Prep Lambda error', error as Error, {
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
    'start_interview_preparation': handleStartInterviewPreparation,
    'generate_interview_question': handleGenerateInterviewQuestion,
    'evaluate_interview_response': handleEvaluateInterviewResponse,
    'get_interview_feedback': handleGetInterviewFeedback,
    'get_company_interview_insights': handleGetCompanyInterviewInsights,
    'customize_preparation_for_company': handleCustomizePreparationForCompany
  };

  const handler = toolHandlers[toolName];
  if (!handler) {
    throw new ToolNotFoundError(toolName);
  }

  return await executeTool(toolName, toolArgs, handler);
}

// Tool Handlers

export async function handleStartInterviewPreparation(args: InterviewPrepArgs): Promise<any> {
  const { role_level, target_company, preparation_timeline, focus_areas, experience_level, weak_areas } = args;

  return {
    interviewPreparation: {
      sessionId: `session_${Date.now()}`,
      roleLevel: role_level || 'PM',
      targetCompany: target_company || 'General',
      preparationTimeline: preparation_timeline || '4 weeks',
      experienceLevel: experience_level || 'Intermediate',

      preparationPlan: {
        overall: {
          duration: preparation_timeline || '4 weeks',
          sessionsPerWeek: 3,
          totalSessions: 12,
          dailyTimeCommitment: '1-2 hours'
        },

        weeklySchedule: [
          {
            week: 1,
            focus: 'Foundation and Behavioral Questions',
            activities: [
              'Review PM fundamentals and frameworks',
              'Practice behavioral questions using STAR method',
              'Study company background and values',
              'Mock interview with peer'
            ]
          },
          {
            week: 2,
            focus: 'Product Sense and Strategy',
            activities: [
              'Product design case studies',
              'Product strategy frameworks',
              'Market analysis practice',
              'Product metrics deep dive'
            ]
          },
          {
            week: 3,
            focus: 'Analytical and Technical Skills',
            activities: [
              'SQL and data analysis practice',
              'A/B testing scenarios',
              'Technical architecture discussions',
              'Metrics and experimentation'
            ]
          },
          {
            week: 4,
            focus: 'Leadership and Communication',
            activities: [
              'Leadership case studies',
              'Stakeholder communication practice',
              'Cross-functional collaboration scenarios',
              'Final mock interviews'
            ]
          }
        ],

        focusAreas: focus_areas || [
          'Product Strategy',
          'Data Analysis',
          'Leadership',
          'Communication'
        ],

        weakAreas: weak_areas || [
          'System design questions',
          'Technical architecture'
        ],

        recommendedResources: [
          'Cracking the PM Interview',
          'Decode and Conquer',
          'PM Interview Questions',
          'Company career page',
          'Industry blogs and podcasts'
        ]
      },

      successMetrics: [
        'Complete all 12 practice sessions',
        'Score 80%+ on mock interviews',
        'Demonstrate clear improvement in weak areas',
        'Feel confident discussing all PM topics'
      ],

      nextSteps: [
        'Set up practice schedule',
        'Find mock interview partners',
        'Gather company-specific information',
        'Begin with behavioral questions'
      ],

      sessionStartDate: new Date().toISOString(),
      estimatedCompletionDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
}

export async function handleGenerateInterviewQuestion(args: InterviewPrepArgs): Promise<any> {
  const { role_level, question_category, company_context, difficulty_level, session_id } = args;

  const questions = {
    behavioral: [
      'Tell me about a time when you had to influence stakeholders who disagreed with your product direction.',
      'Describe a situation where you had to make a tough product decision with limited data.',
      'Walk me through how you handled a failed product launch and what you learned.'
    ],
    product_sense: [
      'How would you improve the user experience of our mobile app?',
      'Design a product feature that helps users discover new content.',
      'What metrics would you use to evaluate the success of a social media platform?'
    ],
    analytical: [
      'How would you analyze the impact of removing a core feature from our product?',
      'Design an experiment to test pricing changes for our subscription service.',
      'Calculate the potential revenue impact of entering a new market segment.'
    ],
    technical: [
      'Explain how you would approach debugging a performance issue in a web application.',
      'How would you design a system to handle real-time notifications for millions of users?',
      'What considerations would you take into account when scaling a database?'
    ],
    leadership: [
      'Tell me about a time when you had to manage conflicting priorities across multiple teams.',
      'How would you approach building alignment between engineering and business stakeholders?',
      'Describe how you would handle a situation where your team is resistant to change.'
    ]
  };

  const categoryQuestions = questions[question_category as keyof typeof questions] || questions.behavioral;
  const selectedQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];

  return {
    interviewQuestion: {
      questionId: `q_${Date.now()}`,
      sessionId: session_id || `session_${Date.now()}`,
      roleLevel: role_level || 'PM',
      category: question_category || 'behavioral',
      difficulty: difficulty_level || 3,
      companyContext: company_context || 'General PM',

      question: {
        text: selectedQuestion,
        category: question_category || 'behavioral',
        expectedFramework: getExpectedFramework(question_category || 'behavioral'),
        timeLimit: '3-5 minutes',
        followUpQuestions: [
          'What was the outcome?',
          'What would you do differently?',
          'How did you measure success?'
        ]
      },

      preparationTips: [
        'Use the STAR method (Situation, Task, Action, Result)',
        'Focus on your specific contributions',
        'Quantify impact where possible',
        'Be concise but comprehensive'
      ],

      evaluationCriteria: [
        'Clarity of communication',
        'Structured thinking',
        'Leadership and ownership',
        'Data-driven decision making',
        'Learning and growth mindset'
      ],

      sampleResponse: {
        structure: 'STAR method',
        keyPoints: [
          'Set context clearly',
          'Explain your specific role',
          'Detail actions taken',
          'Quantify results achieved'
        ]
      },

      generatedAt: new Date().toISOString()
    }
  };
}

export async function handleEvaluateInterviewResponse(args: InterviewPrepArgs): Promise<any> {
  const { question_id, user_response, session_id, evaluation_focus, company_context } = args;

  return {
    responseEvaluation: {
      questionId: question_id || 'unknown',
      sessionId: session_id || 'unknown',
      evaluationDate: new Date().toISOString(),

      overallScore: 7.5,
      grade: 'Good',

      detailedEvaluation: {
        structure: {
          score: 8,
          feedback: 'Well-structured response using clear framework',
          strengths: ['Clear beginning, middle, end', 'Logical flow'],
          improvements: ['Could be more concise in setup']
        },
        content: {
          score: 7,
          feedback: 'Good depth of content with relevant examples',
          strengths: ['Specific examples provided', 'Showed leadership'],
          improvements: ['Add more quantifiable metrics', 'Connect to business impact']
        },
        communication: {
          score: 8,
          feedback: 'Clear and confident communication style',
          strengths: ['Good pacing', 'Professional tone'],
          improvements: ['Vary vocabulary more', 'Add more enthusiasm']
        },
        frameworks: {
          score: 7,
          feedback: 'Applied PM frameworks appropriately',
          strengths: ['Used data-driven approach', 'Considered user impact'],
          improvements: ['Reference specific PM methodologies', 'Connect to company context']
        }
      },

      specificFeedback: [
        'Strong leadership example - clearly showed ownership',
        'Good use of metrics to quantify impact',
        'Could strengthen business outcome connection',
        'Consider adding stakeholder management perspective'
      ],

      improvementAreas: [
        'Add more specific metrics and KPIs',
        'Strengthen the business impact narrative',
        'Include stakeholder management aspects',
        'Reference relevant PM frameworks'
      ],

      strengths: [
        'Clear communication and structure',
        'Good example selection',
        'Demonstrated leadership capabilities',
        'Data-driven thinking approach'
      ],

      nextSteps: [
        'Practice quantifying impact with specific numbers',
        'Study company-specific PM frameworks',
        'Record practice responses for self-review',
        'Focus on business outcome storytelling'
      ],

      recommendedPractice: [
        'Practice 5 more responses in this category',
        'Focus on adding quantitative metrics',
        'Study the company\'s product and strategy',
        'Practice with timer to improve pacing'
      ]
    }
  };
}

export async function handleGetInterviewFeedback(args: InterviewPrepArgs): Promise<any> {
  const { session_id, include_detailed_analysis, include_study_plan, focus_on_improvements } = args;

  return {
    interviewFeedback: {
      sessionId: session_id || 'unknown',
      feedbackDate: new Date().toISOString(),
      includeDetailedAnalysis: include_detailed_analysis || true,
      includeStudyPlan: include_study_plan || true,
      focusOnImprovements: focus_on_improvements || false,

      performanceSummary: {
        overallScore: 7.2,
        trend: 'improving',
        sessionsCompleted: 8,
        averageScore: 6.8,
        improvementRate: '+5% per session'
      },

      categoryBreakdown: {
        behavioral: { score: 7.8, trend: 'stable', strength: 'high' },
        product_sense: { score: 7.0, trend: 'improving', strength: 'medium' },
        analytical: { score: 6.5, trend: 'improving', strength: 'medium' },
        technical: { score: 6.8, trend: 'stable', strength: 'medium' },
        leadership: { score: 7.5, trend: 'improving', strength: 'high' }
      },

      strengths: [
        'Strong leadership examples and storytelling',
        'Clear communication and structured thinking',
        'Good understanding of PM fundamentals',
        'Consistent improvement across sessions'
      ],

      improvementAreas: [
        'Technical architecture knowledge',
        'Advanced metrics and experimentation',
        'System design thinking',
        'Strategic thinking depth'
      ],

      studyPlan: {
        immediate: [
          'Review system design patterns (2 hours)',
          'Practice technical architecture questions (3 sessions)',
          'Study advanced PM metrics (1 hour)',
          'Mock interviews focusing on weak areas (2 sessions)'
        ],
        weekly: [
          '2-3 hours of targeted practice',
          '1 mock interview session',
          'Review recordings and feedback',
          'Study company-specific materials'
        ],
        monthly: [
          'Track progress against goals',
          'Adjust study plan based on improvement',
          'Expand network for more interview opportunities',
          'Consider PM course or workshop'
        ]
      },

      recommendations: [
        'Continue practicing 3x per week',
        'Focus 60% of time on improvement areas',
        'Record all practice sessions',
        'Seek feedback from multiple sources',
        'Study real PM case studies',
        'Network with PMs at target companies'
      ],

      nextMilestones: [
        'Complete 15 total practice sessions',
        'Achieve 8.0+ average score',
        'Master technical PM questions',
        'Schedule real interviews confidently'
      ]
    }
  };
}

export async function handleGetCompanyInterviewInsights(args: InterviewPrepArgs): Promise<any> {
  const { company_name, role_level, include_recent_changes, focus_areas } = args;

  return {
    companyInterviewInsights: {
      companyName: company_name || 'Target Company',
      roleLevel: role_level || 'PM',
      lastUpdated: new Date().toISOString(),
      includeRecentChanges: include_recent_changes || true,

      interviewProcess: {
        stages: [
          'Recruiter Screen (30 minutes)',
          'Hiring Manager Interview (45 minutes)',
          'Case Study/Presentation (1 hour)',
          'Panel Interview (2-3 hours)',
          'Final Round with Leadership (1 hour)'
        ],
        timeline: '2-4 weeks',
        format: 'Mix of behavioral, case studies, and technical questions',
        successRate: '15-20% overall'
      },

      commonQuestionTypes: [
        {
          category: 'Product Strategy',
          frequency: 'high',
          examples: [
            'How would you improve our core product?',
            'Design a feature for [specific user segment]',
            'What metrics matter most for our business?'
          ]
        },
        {
          category: 'Technical/Architecture',
          frequency: 'medium',
          examples: [
            'How would you scale our platform?',
            'Design a system for [specific use case]',
            'Explain your approach to technical debt'
          ]
        },
        {
          category: 'Leadership',
          frequency: 'high',
          examples: [
            'Tell me about influencing without authority',
            'How do you handle conflicting stakeholder priorities?',
            'Describe building high-performing teams'
          ]
        }
      ],

      companySpecifics: {
        culture: 'Data-driven, customer-focused, innovation-oriented',
        values: ['Customer obsession', 'Data-driven decisions', 'Innovation culture'],
        recentNews: [
          'Launched new AI-powered features',
          'Expanded into international markets',
          'Acquired complementary technology company'
        ],
        products: [
          'Core platform product',
          'Mobile applications',
          'API ecosystem',
          'Enterprise solutions'
        ]
      },

      preparationTips: [
        'Research their recent product launches and strategy',
        'Understand their target market and competition',
        'Study their engineering blog and technical approach',
        'Practice explaining complex PM concepts simply',
        'Prepare questions about their PM processes'
      ],

      redFlags: [
        'Not researching the company products',
        'Generic answers without company context',
        'Poor understanding of their market',
        'Not asking thoughtful questions'
      ],

      successFactors: [
        'Demonstrate product sense with their specific products',
        'Show understanding of their technical challenges',
        'Exhibit leadership and stakeholder management skills',
        'Ask intelligent questions about their strategy'
      ]
    }
  };
}

export async function handleCustomizePreparationForCompany(args: InterviewPrepArgs): Promise<any> {
  const { company_name, role_level, preparation_timeline, experience_background, weak_areas, preferred_study_style } = args;

  return {
    customizedPreparation: {
      companyName: company_name || 'Target Company',
      roleLevel: role_level || 'PM',
      preparationTimeline: preparation_timeline || '4 weeks',
      experienceBackground: experience_background || 'General PM experience',
      preferredStudyStyle: preferred_study_style || 'balanced',

      customizedPlan: {
        dailyCommitment: '1.5-2 hours',
        sessionsPerWeek: 4,
        totalSessions: 16,
        focusDistribution: {
          'Company Research': '20%',
          'Product Knowledge': '25%',
          'Technical Skills': '20%',
          'Behavioral Practice': '20%',
          'Mock Interviews': '15%'
        }
      },

      weeklySchedule: [
        {
          week: 1,
          theme: 'Company and Product Deep Dive',
          hours: 8,
          activities: [
            'Research company history, culture, values',
            'Study their products in detail',
            'Analyze their market position',
            'Review recent news and announcements'
          ]
        },
        {
          week: 2,
          theme: 'Technical and Analytical Preparation',
          hours: 8,
          activities: [
            'Study their technical architecture',
            'Practice relevant analytical questions',
            'Review their engineering blog',
            'Understand their data infrastructure'
          ]
        },
        {
          week: 3,
          theme: 'Leadership and Strategy Focus',
          hours: 8,
          activities: [
            'Practice leadership case studies',
            'Study their strategic direction',
            'Prepare stakeholder management examples',
            'Review their organizational structure'
          ]
        },
        {
          week: 4,
          theme: 'Intensive Practice and Refinement',
          hours: 8,
          activities: [
            'Multiple mock interviews',
            'Refine weak areas',
            'Practice company-specific questions',
            'Final preparation and confidence building'
          ]
        }
      ],

      companySpecificResources: [
        'Company career page and blog',
        'Product documentation and demos',
        'Engineering team interviews',
        'Industry analyst reports',
        'Competitor analysis'
      ],

      practicePriorities: [
        'Product improvement questions',
        'Technical architecture discussions',
        'Leadership and influence scenarios',
        'Data-driven decision making',
        'Strategic thinking questions'
      ],

      weakAreaFocus: (weak_areas || ['Technical skills']).map(area => ({
        area,
        recommendedPractice: `2-3 sessions focused on ${area}`,
        resources: `Company-specific ${area} resources`,
        timeline: 'Week 2-3 intensive focus'
      })),

      successMetrics: [
        'Demonstrate deep company knowledge',
        'Provide product-specific examples',
        'Show understanding of their challenges',
        'Ask intelligent, researched questions',
        'Exhibit cultural fit and enthusiasm'
      ],

      milestones: [
        'Complete company research (End of Week 1)',
        'Master product knowledge (End of Week 2)',
        'Achieve 8.0+ in mock interviews (End of Week 4)',
        'Feel confident discussing all topics (Ongoing)'
      ]
    }
  };
}

// Helper function
function getExpectedFramework(category: string): string {
  switch (category) {
    case 'behavioral': return 'STAR method (Situation, Task, Action, Result)';
    case 'product_sense': return 'Product design thinking and user-centered approach';
    case 'analytical': return 'Data-driven analysis with clear metrics';
    case 'technical': return 'Systematic problem-solving approach';
    case 'leadership': return 'Leadership principles and stakeholder management';
    default: return 'Structured PM thinking';
  }
}
