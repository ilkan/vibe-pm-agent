/**
 * Case Study Templates Component
 * Provides pre-built case study templates for different PM interview scenarios
 */

import {
  CaseStudyTemplate,
  CaseType,
  CaseFramework,
  CaseStepType,
  CaseStep,
  CaseVariation,
  CaseHint
} from '../../models/interview';

export class CaseStudyTemplates {
  private templates: Map<CaseType, CaseStudyTemplate[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    this.templates.set('product_design', this.createProductDesignTemplates());
    this.templates.set('strategy', this.createStrategyTemplates());
    this.templates.set('prioritization', this.createPrioritizationTemplates());
    this.templates.set('market_entry', this.createMarketEntryTemplates());
  }

  getTemplatesByType(type: CaseType): CaseStudyTemplate[] {
    return this.templates.get(type) || [];
  }

  getAllTemplates(): CaseStudyTemplate[] {
    return Array.from(this.templates.values()).flat();
  }

  getTemplateByName(name: string): CaseStudyTemplate | undefined {
    return this.getAllTemplates().find(template => template.name === name);
  }

  private createProductDesignTemplates(): CaseStudyTemplate[] {
    return [
      {
        type: 'product_design',
        name: 'CIRCLES Product Design',
        description: 'Design a product using the CIRCLES framework',
        frameworks: ['CIRCLES', 'Jobs_to_be_Done'],
        structure: [
          {
            stepNumber: 1,
            stepType: 'clarification',
            title: 'Comprehend the Situation',
            instruction: 'Clarify the product design challenge and constraints',
            description: 'Ask clarifying questions to understand the scope, target users, and business context',
            frameworks: ['CIRCLES'],
            timeLimit: 5,
            evaluationCriteria: [
              'Asked relevant clarifying questions',
              'Identified key constraints and assumptions',
              'Understood business context and goals'
            ],
            hints: [
              {
                id: 'circles-clarify-1',
                level: 'gentle',
                trigger: 'time_elapsed',
                content: 'Consider asking about the target user, business goals, and technical constraints',
                framework: 'CIRCLES',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'List of clarifying questions',
              'Key assumptions identified',
              'Scope definition'
            ]
          },
          {
            stepNumber: 2,
            stepType: 'analysis',
            title: 'Identify the Customer',
            instruction: 'Define and segment the target customers',
            description: 'Identify who the users are, their needs, and create user personas',
            frameworks: ['CIRCLES', 'Jobs_to_be_Done'],
            timeLimit: 8,
            evaluationCriteria: [
              'Clearly defined user segments',
              'Identified user needs and pain points',
              'Created realistic personas'
            ],
            hints: [
              {
                id: 'circles-customer-1',
                level: 'moderate',
                trigger: 'user_stuck',
                content: 'Think about different user types, their demographics, behaviors, and what jobs they\'re trying to get done',
                framework: 'Jobs_to_be_Done',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'User segments defined',
              'User personas created',
              'Jobs-to-be-done identified'
            ],
            dependencies: [1]
          },
          {
            stepNumber: 3,
            stepType: 'analysis',
            title: 'Report Customer Needs',
            instruction: 'Analyze and prioritize customer needs',
            description: 'Identify what customers need and want from the product',
            frameworks: ['CIRCLES', 'Jobs_to_be_Done'],
            timeLimit: 7,
            evaluationCriteria: [
              'Comprehensive needs analysis',
              'Prioritized needs based on impact',
              'Connected needs to business value'
            ],
            hints: [
              {
                id: 'circles-needs-1',
                level: 'gentle',
                trigger: 'framework_missing',
                content: 'Consider functional, emotional, and social jobs that users are trying to accomplish',
                framework: 'Jobs_to_be_Done',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Prioritized list of customer needs',
              'Need-to-business value mapping',
              'Pain point analysis'
            ],
            dependencies: [2]
          },
          {
            stepNumber: 4,
            stepType: 'ideation',
            title: 'Cut Through Prioritization',
            instruction: 'Generate and prioritize solution ideas',
            description: 'Brainstorm solutions and prioritize based on impact and feasibility',
            frameworks: ['CIRCLES', 'RICE'],
            timeLimit: 10,
            evaluationCriteria: [
              'Generated multiple creative solutions',
              'Used structured prioritization framework',
              'Considered feasibility and impact'
            ],
            hints: [
              {
                id: 'circles-prioritize-1',
                level: 'moderate',
                trigger: 'time_elapsed',
                content: 'Use RICE framework: Reach × Impact × Confidence ÷ Effort to prioritize features',
                framework: 'RICE',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'List of solution ideas',
              'Prioritization matrix',
              'Top 3 recommended features'
            ],
            dependencies: [3]
          },
          {
            stepNumber: 5,
            stepType: 'ideation',
            title: 'List Solutions',
            instruction: 'Detail the proposed solution',
            description: 'Describe the recommended solution in detail with user flows and features',
            frameworks: ['CIRCLES'],
            timeLimit: 8,
            evaluationCriteria: [
              'Clear solution description',
              'Defined user flows',
              'Specified key features and functionality'
            ],
            hints: [
              {
                id: 'circles-solution-1',
                level: 'gentle',
                trigger: 'user_stuck',
                content: 'Think about the user journey from discovery to completion of their job-to-be-done',
                framework: 'CIRCLES',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Detailed solution description',
              'User flow diagrams',
              'Feature specifications'
            ],
            dependencies: [4]
          },
          {
            stepNumber: 6,
            stepType: 'metrics',
            title: 'Evaluate Tradeoffs',
            instruction: 'Define success metrics and evaluate tradeoffs',
            description: 'Identify how to measure success and discuss potential tradeoffs',
            frameworks: ['CIRCLES', 'North_Star'],
            timeLimit: 7,
            evaluationCriteria: [
              'Defined clear success metrics',
              'Identified key tradeoffs',
              'Connected metrics to business goals'
            ],
            hints: [
              {
                id: 'circles-metrics-1',
                level: 'moderate',
                trigger: 'framework_missing',
                content: 'Consider leading indicators (engagement, adoption) and lagging indicators (revenue, retention)',
                framework: 'North_Star',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Success metrics defined',
              'Tradeoff analysis',
              'Measurement plan'
            ],
            dependencies: [5]
          },
          {
            stepNumber: 7,
            stepType: 'recommendation',
            title: 'Summarize Recommendation',
            instruction: 'Present final recommendation with next steps',
            description: 'Provide executive summary and implementation roadmap',
            frameworks: ['CIRCLES'],
            timeLimit: 5,
            evaluationCriteria: [
              'Clear executive summary',
              'Actionable next steps',
              'Risk mitigation strategies'
            ],
            hints: [
              {
                id: 'circles-summary-1',
                level: 'gentle',
                trigger: 'time_elapsed',
                content: 'Structure your recommendation: Problem → Solution → Impact → Next Steps',
                framework: 'CIRCLES',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Executive summary',
              'Implementation roadmap',
              'Risk assessment'
            ],
            dependencies: [6]
          }
        ],
        variations: [
          {
            name: 'Mobile App Focus',
            description: 'Design a mobile application',
            modifications: {
              constraints: ['Mobile-first design', 'iOS and Android compatibility', 'Offline functionality'],
              difficulty: 3
            }
          },
          {
            name: 'B2B Product',
            description: 'Design a product for business customers',
            modifications: {
              scenario: 'Design a B2B SaaS product for enterprise customers',
              constraints: ['Enterprise security requirements', 'Integration capabilities', 'Scalability'],
              difficulty: 4
            }
          }
        ]
      }
    ];
  }

  private createStrategyTemplates(): CaseStudyTemplate[] {
    return [
      {
        type: 'strategy',
        name: 'Market Entry Strategy',
        description: 'Develop a strategy for entering a new market',
        frameworks: ['SWOT', 'Porter_Five_Forces', 'Lean_Canvas'],
        structure: [
          {
            stepNumber: 1,
            stepType: 'clarification',
            title: 'Define Market and Objectives',
            instruction: 'Clarify the target market and strategic objectives',
            description: 'Understand the market opportunity and business goals',
            frameworks: ['Lean_Canvas'],
            timeLimit: 5,
            evaluationCriteria: [
              'Clearly defined target market',
              'Specific business objectives',
              'Success criteria established'
            ],
            hints: [
              {
                id: 'strategy-market-1',
                level: 'gentle',
                trigger: 'time_elapsed',
                content: 'Consider market size, customer segments, and competitive landscape',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Market definition',
              'Strategic objectives',
              'Success metrics'
            ]
          },
          {
            stepNumber: 2,
            stepType: 'analysis',
            title: 'Market Analysis',
            instruction: 'Analyze the competitive landscape and market dynamics',
            description: 'Use Porter\'s Five Forces to understand market structure',
            frameworks: ['Porter_Five_Forces', 'SWOT'],
            timeLimit: 12,
            evaluationCriteria: [
              'Comprehensive competitive analysis',
              'Market dynamics understood',
              'Barriers to entry identified'
            ],
            hints: [
              {
                id: 'strategy-porter-1',
                level: 'moderate',
                trigger: 'framework_missing',
                content: 'Apply Porter\'s Five Forces: competitive rivalry, supplier power, buyer power, threat of substitutes, threat of new entrants',
                framework: 'Porter_Five_Forces',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Porter\'s Five Forces analysis',
              'Competitive landscape map',
              'Market opportunity assessment'
            ],
            dependencies: [1]
          },
          {
            stepNumber: 3,
            stepType: 'analysis',
            title: 'SWOT Analysis',
            instruction: 'Conduct internal and external analysis',
            description: 'Analyze strengths, weaknesses, opportunities, and threats',
            frameworks: ['SWOT'],
            timeLimit: 10,
            evaluationCriteria: [
              'Comprehensive SWOT analysis',
              'Internal capabilities assessed',
              'External factors considered'
            ],
            hints: [
              {
                id: 'strategy-swot-1',
                level: 'gentle',
                trigger: 'user_stuck',
                content: 'Consider internal factors (strengths/weaknesses) and external factors (opportunities/threats)',
                framework: 'SWOT',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'SWOT matrix',
              'Strategic implications',
              'Key insights'
            ],
            dependencies: [2]
          },
          {
            stepNumber: 4,
            stepType: 'ideation',
            title: 'Strategy Options',
            instruction: 'Generate strategic options and entry modes',
            description: 'Develop different approaches for market entry',
            frameworks: ['Lean_Canvas'],
            timeLimit: 8,
            evaluationCriteria: [
              'Multiple strategic options generated',
              'Entry modes considered',
              'Resource requirements assessed'
            ],
            hints: [
              {
                id: 'strategy-options-1',
                level: 'moderate',
                trigger: 'time_elapsed',
                content: 'Consider organic growth, partnerships, acquisitions, or joint ventures',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Strategic options list',
              'Entry mode analysis',
              'Resource requirements'
            ],
            dependencies: [3]
          },
          {
            stepNumber: 5,
            stepType: 'prioritization',
            title: 'Strategy Selection',
            instruction: 'Evaluate and select the optimal strategy',
            description: 'Compare options and recommend the best approach',
            frameworks: ['RICE'],
            timeLimit: 8,
            evaluationCriteria: [
              'Systematic evaluation of options',
              'Clear selection criteria',
              'Justified recommendation'
            ],
            hints: [
              {
                id: 'strategy-selection-1',
                level: 'moderate',
                trigger: 'framework_missing',
                content: 'Use criteria like market potential, competitive advantage, resource requirements, and risk',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Strategy evaluation matrix',
              'Recommended strategy',
              'Rationale for selection'
            ],
            dependencies: [4]
          },
          {
            stepNumber: 6,
            stepType: 'recommendation',
            title: 'Implementation Plan',
            instruction: 'Develop implementation roadmap and risk mitigation',
            description: 'Create actionable plan with timelines and risk management',
            frameworks: ['OKRs'],
            timeLimit: 7,
            evaluationCriteria: [
              'Detailed implementation plan',
              'Risk mitigation strategies',
              'Success metrics defined'
            ],
            hints: [
              {
                id: 'strategy-implementation-1',
                level: 'gentle',
                trigger: 'time_elapsed',
                content: 'Break down the strategy into phases with specific objectives and key results',
                framework: 'OKRs',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Implementation roadmap',
              'Risk mitigation plan',
              'Success metrics and KPIs'
            ],
            dependencies: [5]
          }
        ],
        variations: [
          {
            name: 'International Expansion',
            description: 'Strategy for expanding to international markets',
            modifications: {
              scenario: 'Your company wants to expand internationally',
              constraints: ['Cultural differences', 'Regulatory requirements', 'Currency fluctuations'],
              difficulty: 4
            }
          },
          {
            name: 'Digital Transformation',
            description: 'Strategy for digital transformation initiative',
            modifications: {
              scenario: 'Traditional company needs digital transformation strategy',
              constraints: ['Legacy systems', 'Change management', 'Technology adoption'],
              difficulty: 4
            }
          }
        ]
      }
    ];
  }

  private createPrioritizationTemplates(): CaseStudyTemplate[] {
    return [
      {
        type: 'prioritization',
        name: 'Feature Prioritization',
        description: 'Prioritize product features using structured frameworks',
        frameworks: ['RICE', 'North_Star', 'OKRs'],
        structure: [
          {
            stepNumber: 1,
            stepType: 'clarification',
            title: 'Context and Constraints',
            instruction: 'Understand the prioritization context and constraints',
            description: 'Clarify business goals, resources, and timeline constraints',
            frameworks: ['North_Star', 'OKRs'],
            timeLimit: 5,
            evaluationCriteria: [
              'Clear understanding of business context',
              'Resource constraints identified',
              'Timeline and goals clarified'
            ],
            hints: [
              {
                id: 'prioritization-context-1',
                level: 'gentle',
                trigger: 'time_elapsed',
                content: 'Ask about business objectives, team capacity, and strategic priorities',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Business context summary',
              'Resource constraints',
              'Success criteria'
            ]
          },
          {
            stepNumber: 2,
            stepType: 'analysis',
            title: 'Feature Analysis',
            instruction: 'Analyze each feature option in detail',
            description: 'Break down features and understand their potential impact',
            frameworks: ['RICE', 'Jobs_to_be_Done'],
            timeLimit: 10,
            evaluationCriteria: [
              'Comprehensive feature breakdown',
              'Impact analysis completed',
              'User value assessed'
            ],
            hints: [
              {
                id: 'prioritization-analysis-1',
                level: 'moderate',
                trigger: 'user_stuck',
                content: 'Consider user impact, business value, technical complexity, and strategic alignment',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Feature analysis matrix',
              'Impact assessment',
              'User value mapping'
            ],
            dependencies: [1]
          },
          {
            stepNumber: 3,
            stepType: 'prioritization',
            title: 'RICE Scoring',
            instruction: 'Apply RICE framework to score features',
            description: 'Score each feature on Reach, Impact, Confidence, and Effort',
            frameworks: ['RICE'],
            timeLimit: 12,
            evaluationCriteria: [
              'Accurate RICE scoring',
              'Justified scoring rationale',
              'Consistent evaluation criteria'
            ],
            hints: [
              {
                id: 'prioritization-rice-1',
                level: 'moderate',
                trigger: 'framework_missing',
                content: 'RICE = (Reach × Impact × Confidence) ÷ Effort. Use consistent scales for each dimension',
                framework: 'RICE',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'RICE scores for each feature',
              'Scoring rationale',
              'Prioritized feature list'
            ],
            dependencies: [2]
          },
          {
            stepNumber: 4,
            stepType: 'analysis',
            title: 'Strategic Alignment',
            instruction: 'Evaluate alignment with strategic objectives',
            description: 'Assess how features align with company OKRs and North Star metric',
            frameworks: ['OKRs', 'North_Star'],
            timeLimit: 8,
            evaluationCriteria: [
              'Strategic alignment assessed',
              'OKR contribution evaluated',
              'North Star impact considered'
            ],
            hints: [
              {
                id: 'prioritization-alignment-1',
                level: 'gentle',
                trigger: 'framework_missing',
                content: 'Consider how each feature contributes to key objectives and the North Star metric',
                framework: 'North_Star',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Strategic alignment scores',
              'OKR contribution analysis',
              'North Star impact assessment'
            ],
            dependencies: [3]
          },
          {
            stepNumber: 5,
            stepType: 'recommendation',
            title: 'Final Prioritization',
            instruction: 'Present final prioritized roadmap',
            description: 'Combine all factors to create final prioritization with rationale',
            frameworks: ['RICE', 'OKRs'],
            timeLimit: 7,
            evaluationCriteria: [
              'Clear final prioritization',
              'Comprehensive rationale',
              'Implementation considerations'
            ],
            hints: [
              {
                id: 'prioritization-final-1',
                level: 'gentle',
                trigger: 'time_elapsed',
                content: 'Balance quantitative scores with strategic considerations and practical constraints',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Prioritized roadmap',
              'Decision rationale',
              'Next steps and timeline'
            ],
            dependencies: [4]
          }
        ],
        variations: [
          {
            name: 'Technical Debt vs Features',
            description: 'Prioritize between new features and technical debt',
            modifications: {
              scenario: 'Balance feature development with technical debt reduction',
              constraints: ['Engineering capacity', 'User expectations', 'Technical stability'],
              difficulty: 4
            }
          },
          {
            name: 'Resource Constrained',
            description: 'Prioritization with severe resource constraints',
            modifications: {
              constraints: ['Limited engineering resources', 'Tight timeline', 'Budget restrictions'],
              difficulty: 3
            }
          }
        ]
      }
    ];
  }

  private createMarketEntryTemplates(): CaseStudyTemplate[] {
    return [
      {
        type: 'market_entry',
        name: 'New Market Entry Analysis',
        description: 'Analyze opportunity and strategy for entering a new market',
        frameworks: ['Porter_Five_Forces', 'SWOT', 'Lean_Canvas'],
        structure: [
          {
            stepNumber: 1,
            stepType: 'clarification',
            title: 'Market Definition',
            instruction: 'Define the target market and entry objectives',
            description: 'Clarify market boundaries, customer segments, and business goals',
            frameworks: ['Lean_Canvas'],
            timeLimit: 6,
            evaluationCriteria: [
              'Clear market definition',
              'Customer segments identified',
              'Entry objectives specified'
            ],
            hints: [
              {
                id: 'market-entry-definition-1',
                level: 'gentle',
                trigger: 'time_elapsed',
                content: 'Consider geographic, demographic, and psychographic market boundaries',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Market definition',
              'Target customer segments',
              'Entry objectives'
            ]
          },
          {
            stepNumber: 2,
            stepType: 'analysis',
            title: 'Market Size and Opportunity',
            instruction: 'Estimate market size and opportunity potential',
            description: 'Calculate TAM, SAM, SOM and assess market attractiveness',
            frameworks: ['Lean_Canvas'],
            timeLimit: 10,
            evaluationCriteria: [
              'Market sizing methodology',
              'TAM/SAM/SOM calculations',
              'Opportunity assessment'
            ],
            hints: [
              {
                id: 'market-entry-sizing-1',
                level: 'moderate',
                trigger: 'user_stuck',
                content: 'Use top-down and bottom-up approaches to estimate TAM, SAM, and SOM',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Market size estimates',
              'Opportunity analysis',
              'Growth projections'
            ],
            dependencies: [1]
          },
          {
            stepNumber: 3,
            stepType: 'analysis',
            title: 'Competitive Landscape',
            instruction: 'Analyze competitive dynamics using Porter\'s Five Forces',
            description: 'Assess competitive intensity and market structure',
            frameworks: ['Porter_Five_Forces'],
            timeLimit: 12,
            evaluationCriteria: [
              'Complete Five Forces analysis',
              'Competitive positioning',
              'Barriers to entry identified'
            ],
            hints: [
              {
                id: 'market-entry-porter-1',
                level: 'moderate',
                trigger: 'framework_missing',
                content: 'Analyze: competitive rivalry, supplier power, buyer power, substitutes, and new entrant threats',
                framework: 'Porter_Five_Forces',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Five Forces analysis',
              'Competitive map',
              'Market attractiveness score'
            ],
            dependencies: [2]
          },
          {
            stepNumber: 4,
            stepType: 'analysis',
            title: 'Internal Capabilities Assessment',
            instruction: 'Evaluate internal strengths and weaknesses for market entry',
            description: 'Conduct SWOT analysis focusing on market entry capabilities',
            frameworks: ['SWOT'],
            timeLimit: 8,
            evaluationCriteria: [
              'Comprehensive capability assessment',
              'SWOT analysis completed',
              'Gap analysis identified'
            ],
            hints: [
              {
                id: 'market-entry-swot-1',
                level: 'gentle',
                trigger: 'framework_missing',
                content: 'Consider resources, capabilities, brand strength, and market knowledge',
                framework: 'SWOT',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'SWOT analysis',
              'Capability gaps',
              'Competitive advantages'
            ],
            dependencies: [3]
          },
          {
            stepNumber: 5,
            stepType: 'ideation',
            title: 'Entry Strategy Options',
            instruction: 'Generate and evaluate different entry strategies',
            description: 'Develop multiple entry approaches and assess their viability',
            frameworks: ['Lean_Canvas'],
            timeLimit: 10,
            evaluationCriteria: [
              'Multiple entry strategies generated',
              'Strategy evaluation criteria',
              'Risk-return analysis'
            ],
            hints: [
              {
                id: 'market-entry-strategies-1',
                level: 'moderate',
                trigger: 'time_elapsed',
                content: 'Consider organic growth, partnerships, acquisitions, licensing, or joint ventures',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Entry strategy options',
              'Strategy comparison matrix',
              'Risk assessment'
            ],
            dependencies: [4]
          },
          {
            stepNumber: 6,
            stepType: 'recommendation',
            title: 'Go/No-Go Decision',
            instruction: 'Make final recommendation with implementation plan',
            description: 'Synthesize analysis into clear go/no-go recommendation',
            frameworks: ['SWOT', 'Lean_Canvas'],
            timeLimit: 8,
            evaluationCriteria: [
              'Clear go/no-go recommendation',
              'Supporting rationale',
              'Implementation roadmap'
            ],
            hints: [
              {
                id: 'market-entry-decision-1',
                level: 'gentle',
                trigger: 'time_elapsed',
                content: 'Consider market attractiveness, competitive position, and internal capabilities',
                revealsSolution: false
              }
            ],
            expectedOutputs: [
              'Go/no-go recommendation',
              'Decision rationale',
              'Implementation plan'
            ],
            dependencies: [5]
          }
        ],
        variations: [
          {
            name: 'International Market Entry',
            description: 'Entry into international markets with cultural considerations',
            modifications: {
              scenario: 'Enter a new international market',
              constraints: ['Cultural differences', 'Regulatory requirements', 'Currency risks'],
              difficulty: 5
            }
          },
          {
            name: 'Adjacent Market Entry',
            description: 'Entry into adjacent market segments',
            modifications: {
              scenario: 'Expand into adjacent market segment',
              constraints: ['Brand positioning', 'Channel conflicts', 'Cannibalization risks'],
              difficulty: 3
            }
          }
        ]
      }
    ];
  }
}