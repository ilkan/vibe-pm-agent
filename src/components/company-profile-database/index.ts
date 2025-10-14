/**
 * Company Profile Database Component
 * 
 * Manages company-specific interview patterns, culture values, and product philosophy
 * for tailored PM interview preparation.
 */

import {
  CompanyProfile,
  CompanyProfileDatabase,
  CompanyInsights,
  CompanyTier,
  CompanySize,
  TechCompanyProfiles,
  InterviewProcess,
  CultureValues,
  ProductPhilosophy,
  ProductLaunch,
  InterviewPattern,
  QuestionWeighting,
  CompanyEvaluationCriteria
} from '../../models/company-profiles';

export class CompanyProfileDatabaseImpl implements CompanyProfileDatabase {
  private profiles: Map<string, CompanyProfile> = new Map();
  private insights: Map<string, CompanyInsights> = new Map();
  private nameToIdMap: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultProfiles();
  }

  /**
   * Initialize database with major tech company profiles
   */
  private initializeDefaultProfiles(): void {
    const techProfiles = this.createTechCompanyProfiles();
    
    Object.values(techProfiles).forEach(profile => {
      this.addCompanyProfile(profile);
    });
  }

  /**
   * Create comprehensive profiles for major tech companies
   */
  private createTechCompanyProfiles(): TechCompanyProfiles {
    return {
      google: this.createGoogleProfile(),
      amazon: this.createAmazonProfile(),
      meta: this.createMetaProfile(),
      apple: this.createAppleProfile(),
      microsoft: this.createMicrosoftProfile(),
      netflix: this.createNetflixProfile(),
      uber: this.createUberProfile(),
      airbnb: this.createAirbnbProfile(),
      stripe: this.createStripeProfile(),
      salesforce: this.createSalesforceProfile()
    };
  }

  private createGoogleProfile(): CompanyProfile {
    return {
      id: 'google',
      name: 'Google',
      tier: 'FAANG',
      size: 'enterprise',
      industry: ['Search', 'Cloud Computing', 'AI/ML', 'Mobile', 'Hardware'],
      headquarters: 'Mountain View, CA',
      founded: 1998,
      employeeCount: 190000,
      
      interviewProcess: {
        totalRounds: 5,
        rounds: [
          {
            roundNumber: 1,
            name: 'Phone Screen',
            type: 'phone_screen',
            duration: 45,
            interviewers: 1,
            focus: ['Product Sense', 'Analytical Thinking'],
            commonQuestions: [
              'Design a product for elderly users',
              'How would you improve Google Maps?'
            ],
            evaluationWeight: 0.15
          },
          {
            roundNumber: 2,
            name: 'Product Design',
            type: 'case_study',
            duration: 45,
            interviewers: 1,
            focus: ['Product Design', 'User Experience', 'Technical Understanding'],
            commonQuestions: [
              'Design a product for commuters',
              'How would you design YouTube for kids?'
            ],
            evaluationWeight: 0.25
          },
          {
            roundNumber: 3,
            name: 'Analytical',
            type: 'case_study',
            duration: 45,
            interviewers: 1,
            focus: ['Data Analysis', 'Metrics', 'Problem Solving'],
            commonQuestions: [
              'YouTube views dropped 5% - investigate',
              'Estimate number of queries per day on Google'
            ],
            evaluationWeight: 0.25
          },
          {
            roundNumber: 4,
            name: 'Strategy & Leadership',
            type: 'behavioral',
            duration: 45,
            interviewers: 1,
            focus: ['Strategic Thinking', 'Leadership', 'Googleyness'],
            commonQuestions: [
              'Tell me about a time you had to influence without authority',
              'How would you prioritize features for Gmail?'
            ],
            evaluationWeight: 0.25
          },
          {
            roundNumber: 5,
            name: 'Googleyness & Leadership',
            type: 'behavioral',
            duration: 45,
            interviewers: 1,
            focus: ['Culture Fit', 'Leadership Potential', 'Innovation'],
            commonQuestions: [
              'Describe a time you took a big risk',
              'How do you handle ambiguity?'
            ],
            evaluationWeight: 0.10
          }
        ],
        averageDuration: 21,
        passRate: 0.15,
        commonFeedback: [
          'Strong analytical thinking required',
          'Focus on user-centric solutions',
          'Demonstrate technical depth',
          'Show innovation and creativity'
        ],
        uniqueAspects: [
          'Heavy emphasis on product sense',
          'Googleyness cultural evaluation',
          'Technical depth expectations',
          'Data-driven decision making'
        ]
      },

      cultureValues: {
        coreValues: [
          'Focus on the user and all else will follow',
          'It\'s best to do one thing really, really well',
          'Fast is better than slow',
          'Democracy on the web works',
          'You don\'t need to be at your desk to need an answer'
        ],
        culturalTraits: [
          'Data-driven decision making',
          'Innovation and experimentation',
          'Technical excellence',
          'User-first mentality',
          'Collaborative problem solving'
        ],
        workStyle: 'collaborative',
        decisionMaking: 'data_driven',
        riskTolerance: 'experimental',
        innovationApproach: 'technology_driven'
      },

      productPhilosophy: {
        productPrinciples: [
          'Focus on user needs first',
          'Think 10x, not 10%',
          'Launch and iterate quickly',
          'Use data to make decisions',
          'Build for everyone'
        ],
        designPhilosophy: [
          'Material Design principles',
          'Accessibility first',
          'Simple and intuitive interfaces',
          'Consistent user experience'
        ],
        developmentMethodology: 'agile',
        customerFocus: 'b2c',
        productStrategy: [
          'AI-first approach',
          'Mobile-first design',
          'Global scale solutions',
          'Open ecosystem'
        ],
        keyMetrics: [
          'Daily Active Users',
          'User engagement time',
          'Query satisfaction',
          'Revenue per user'
        ],
        competitiveAdvantages: [
          'Search technology',
          'AI and machine learning',
          'Global infrastructure',
          'Data insights'
        ]
      },

      recentLaunches: [
        {
          id: 'bard-ai',
          name: 'Bard AI',
          launchDate: new Date('2023-03-21'),
          category: 'AI Assistant',
          description: 'Conversational AI service powered by LaMDA',
          targetMarket: ['General consumers', 'Developers', 'Businesses'],
          keyFeatures: [
            'Natural language conversations',
            'Code generation',
            'Creative writing assistance',
            'Real-time information access'
          ],
          businessImpact: {
            strategicValue: 'AI leadership positioning against ChatGPT'
          },
          pmInvolvement: [
            'Product strategy and positioning',
            'User experience design',
            'Safety and ethics considerations',
            'Go-to-market planning'
          ]
        }
      ],

      interviewPatterns: [
        {
          patternId: 'google-product-design',
          name: 'Product Design Deep Dive',
          description: 'Comprehensive product design case with user research focus',
          frequency: 0.9,
          questionTypes: ['Product Design', 'User Research', 'Technical Feasibility'],
          expectedFrameworks: ['CIRCLES', 'Jobs-to-be-Done', 'Design Thinking'],
          commonMistakes: [
            'Jumping to solutions without understanding users',
            'Ignoring technical constraints',
            'Not considering global scale'
          ],
          successFactors: [
            'Strong user empathy',
            'Structured problem-solving',
            'Technical awareness',
            'Creative solutions'
          ],
          exampleQuestions: [
            'Design a product for people learning a new language',
            'How would you improve Google Photos?'
          ]
        }
      ],

      questionWeighting: {
        behavioral: 0.20,
        productSense: 0.30,
        analytical: 0.25,
        technical: 0.15,
        leadership: 0.05,
        strategy: 0.03,
        execution: 0.02,
        culture: 0.00
      },

      evaluationCriteria: {
        primaryCriteria: [
          {
            name: 'Product Sense',
            description: 'Ability to understand user needs and design solutions',
            weight: 0.30,
            evaluationMethod: 'Case study performance and product intuition',
            commonSignals: {
              positive: [
                'User-centric thinking',
                'Creative problem solving',
                'Technical feasibility awareness'
              ],
              negative: [
                'Solution-first approach',
                'Ignoring user research',
                'Unrealistic technical assumptions'
              ]
            }
          },
          {
            name: 'Analytical Thinking',
            description: 'Data-driven problem solving and metrics focus',
            weight: 0.25,
            evaluationMethod: 'Quantitative case studies and metric design',
            commonSignals: {
              positive: [
                'Structured problem breakdown',
                'Appropriate metric selection',
                'Data-driven insights'
              ],
              negative: [
                'Gut-feeling decisions',
                'Poor metric choices',
                'Lack of quantitative rigor'
              ]
            }
          }
        ],
        secondaryCriteria: [
          {
            name: 'Googleyness',
            description: 'Cultural fit and collaborative approach',
            weight: 0.15,
            evaluationMethod: 'Behavioral questions and interaction style',
            commonSignals: {
              positive: [
                'Collaborative mindset',
                'Intellectual curiosity',
                'Comfort with ambiguity'
              ],
              negative: [
                'Ego-driven behavior',
                'Rigid thinking',
                'Poor communication'
              ]
            }
          }
        ],
        dealBreakers: [
          'Poor communication skills',
          'Lack of user empathy',
          'Inability to think at scale'
        ],
        differentiators: [
          'Technical depth',
          'Global perspective',
          'AI/ML understanding',
          'Innovation mindset'
        ],
        feedbackStyle: 'structured'
      },

      lastUpdated: new Date(),
      dataFreshness: 0.95,
      sources: [
        'Glassdoor interview experiences',
        'Blind community posts',
        'Official Google careers page',
        'PM interview prep resources'
      ]
    };
  }

  private createAmazonProfile(): CompanyProfile {
    return {
      id: 'amazon',
      name: 'Amazon',
      tier: 'FAANG',
      size: 'enterprise',
      industry: ['E-commerce', 'Cloud Computing', 'AI/ML', 'Logistics', 'Entertainment'],
      headquarters: 'Seattle, WA',
      founded: 1994,
      employeeCount: 1500000,

      interviewProcess: {
        totalRounds: 6,
        rounds: [
          {
            roundNumber: 1,
            name: 'Phone Screen',
            type: 'phone_screen',
            duration: 60,
            interviewers: 1,
            focus: ['Leadership Principles', 'Product Sense', 'Customer Obsession'],
            commonQuestions: [
              'Tell me about a time you had to make a decision with incomplete information',
              'How would you improve the Amazon shopping experience?'
            ],
            evaluationWeight: 0.15
          },
          {
            roundNumber: 2,
            name: 'Product Case Study',
            type: 'case_study',
            duration: 60,
            interviewers: 1,
            focus: ['Product Strategy', 'Customer Focus', 'Working Backwards'],
            commonQuestions: [
              'Design a new product for Amazon Prime members',
              'How would you launch Amazon in a new country?'
            ],
            evaluationWeight: 0.25
          }
        ],
        averageDuration: 28,
        passRate: 0.12,
        commonFeedback: [
          'Strong focus on Leadership Principles',
          'Customer obsession is critical',
          'Working Backwards methodology',
          'Data-driven decision making'
        ],
        uniqueAspects: [
          '14 Leadership Principles evaluation',
          'Working Backwards document creation',
          'Bar Raiser involvement',
          'Customer obsession focus'
        ]
      },

      cultureValues: {
        coreValues: [
          'Customer Obsession',
          'Ownership',
          'Invent and Simplify',
          'Are Right, A Lot',
          'Learn and Be Curious'
        ],
        leadershipPrinciples: [
          'Customer Obsession',
          'Ownership',
          'Invent and Simplify',
          'Are Right, A Lot',
          'Learn and Be Curious',
          'Hire and Develop the Best',
          'Insist on the Highest Standards',
          'Think Big',
          'Bias for Action',
          'Frugality',
          'Earn Trust',
          'Dive Deep',
          'Have Backbone; Disagree and Commit',
          'Deliver Results'
        ],
        culturalTraits: [
          'Customer-first mentality',
          'Long-term thinking',
          'Operational excellence',
          'Innovation culture',
          'High performance standards'
        ],
        workStyle: 'autonomous',
        decisionMaking: 'data_driven',
        riskTolerance: 'moderate',
        innovationApproach: 'customer_driven'
      },

      productPhilosophy: {
        productPrinciples: [
          'Start with the customer and work backwards',
          'Write the press release first',
          'Focus on long-term value',
          'Maintain high standards',
          'Think big and scale globally'
        ],
        designPhilosophy: [
          'Customer-centric design',
          'Simplicity and functionality',
          'Accessibility and inclusion',
          'Data-informed decisions'
        ],
        developmentMethodology: 'agile',
        customerFocus: 'b2c',
        productStrategy: [
          'Working Backwards methodology',
          'Long-term customer value',
          'Operational excellence',
          'Global expansion'
        ],
        keyMetrics: [
          'Customer satisfaction',
          'Net Promoter Score',
          'Customer lifetime value',
          'Operational efficiency'
        ],
        competitiveAdvantages: [
          'Customer obsession',
          'Logistics network',
          'AWS infrastructure',
          'Data insights'
        ]
      },

      recentLaunches: [],
      interviewPatterns: [],
      questionWeighting: {
        behavioral: 0.40,
        productSense: 0.25,
        analytical: 0.15,
        technical: 0.10,
        leadership: 0.05,
        strategy: 0.03,
        execution: 0.02,
        culture: 0.00
      },

      evaluationCriteria: {
        primaryCriteria: [
          {
            name: 'Leadership Principles',
            description: 'Demonstration of Amazon\'s 14 Leadership Principles',
            weight: 0.40,
            evaluationMethod: 'Behavioral questions using STAR method',
            commonSignals: {
              positive: [
                'Customer obsession examples',
                'Ownership mentality',
                'Data-driven decisions'
              ],
              negative: [
                'Self-serving behavior',
                'Blame others',
                'Short-term thinking'
              ]
            }
          }
        ],
        secondaryCriteria: [],
        dealBreakers: [
          'Lack of customer focus',
          'Poor ownership examples',
          'Inability to think long-term'
        ],
        differentiators: [
          'Strong LP examples',
          'Working Backwards experience',
          'Scale thinking',
          'Operational mindset'
        ],
        feedbackStyle: 'direct'
      },

      lastUpdated: new Date(),
      dataFreshness: 0.90,
      sources: ['Amazon careers', 'Leadership Principles guide', 'Interview experiences']
    };
  }

  // Placeholder implementations for other companies
  private createMetaProfile(): CompanyProfile {
    return this.createBasicProfile('meta', 'Meta', 'FAANG', ['Social Media', 'VR/AR', 'AI/ML']);
  }

  private createAppleProfile(): CompanyProfile {
    return this.createBasicProfile('apple', 'Apple', 'FAANG', ['Consumer Electronics', 'Software', 'Services']);
  }

  private createMicrosoftProfile(): CompanyProfile {
    return this.createBasicProfile('microsoft', 'Microsoft', 'Big Tech', ['Software', 'Cloud Computing', 'Gaming']);
  }

  private createNetflixProfile(): CompanyProfile {
    return this.createBasicProfile('netflix', 'Netflix', 'FAANG', ['Streaming', 'Entertainment', 'Content']);
  }

  private createUberProfile(): CompanyProfile {
    return this.createBasicProfile('uber', 'Uber', 'Unicorn', ['Transportation', 'Logistics', 'Food Delivery']);
  }

  private createAirbnbProfile(): CompanyProfile {
    return this.createBasicProfile('airbnb', 'Airbnb', 'Unicorn', ['Travel', 'Hospitality', 'Marketplace']);
  }

  private createStripeProfile(): CompanyProfile {
    return this.createBasicProfile('stripe', 'Stripe', 'Unicorn', ['Fintech', 'Payments', 'Infrastructure']);
  }

  private createSalesforceProfile(): CompanyProfile {
    return this.createBasicProfile('salesforce', 'Salesforce', 'Enterprise', ['CRM', 'Cloud Software', 'AI']);
  }

  private createBasicProfile(id: string, name: string, tier: CompanyTier, industries: string[]): CompanyProfile {
    return {
      id,
      name,
      tier,
      size: 'large',
      industry: industries,
      headquarters: 'TBD',
      founded: 2000,
      interviewProcess: {
        totalRounds: 4,
        rounds: [],
        averageDuration: 14,
        commonFeedback: [],
        uniqueAspects: []
      },
      cultureValues: {
        coreValues: [],
        culturalTraits: [],
        workStyle: 'collaborative',
        decisionMaking: 'data_driven',
        riskTolerance: 'moderate',
        innovationApproach: 'customer_driven'
      },
      productPhilosophy: {
        productPrinciples: [],
        designPhilosophy: [],
        developmentMethodology: 'agile',
        customerFocus: 'b2c',
        productStrategy: [],
        keyMetrics: [],
        competitiveAdvantages: []
      },
      recentLaunches: [],
      interviewPatterns: [],
      questionWeighting: {
        behavioral: 0.25,
        productSense: 0.25,
        analytical: 0.20,
        technical: 0.15,
        leadership: 0.10,
        strategy: 0.03,
        execution: 0.02,
        culture: 0.00
      },
      evaluationCriteria: {
        primaryCriteria: [],
        secondaryCriteria: [],
        dealBreakers: [],
        differentiators: [],
        feedbackStyle: 'structured'
      },
      lastUpdated: new Date(),
      dataFreshness: 0.70,
      sources: ['Public information']
    };
  }

  // Database interface implementation
  getCompanyProfile(companyId: string): CompanyProfile | undefined {
    return this.profiles.get(companyId.toLowerCase());
  }

  getCompanyByName(name: string): CompanyProfile | undefined {
    const companyId = this.nameToIdMap.get(name.toLowerCase());
    return companyId ? this.profiles.get(companyId) : undefined;
  }

  getCompaniesByTier(tier: CompanyTier): CompanyProfile[] {
    return Array.from(this.profiles.values()).filter(profile => profile.tier === tier);
  }

  getCompaniesByIndustry(industry: string): CompanyProfile[] {
    return Array.from(this.profiles.values()).filter(profile => 
      profile.industry.some(ind => ind.toLowerCase().includes(industry.toLowerCase()))
    );
  }

  searchCompanies(query: string): CompanyProfile[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.profiles.values()).filter(profile =>
      profile.name.toLowerCase().includes(searchTerm) ||
      profile.industry.some(ind => ind.toLowerCase().includes(searchTerm))
    );
  }

  getAllCompanies(): CompanyProfile[] {
    return Array.from(this.profiles.values());
  }

  addCompanyProfile(profile: CompanyProfile): void {
    this.profiles.set(profile.id.toLowerCase(), profile);
    this.nameToIdMap.set(profile.name.toLowerCase(), profile.id.toLowerCase());
  }

  updateCompanyProfile(companyId: string, updates: Partial<CompanyProfile>): void {
    const existing = this.profiles.get(companyId.toLowerCase());
    if (existing) {
      const updated = { ...existing, ...updates, lastUpdated: new Date() };
      this.profiles.set(companyId.toLowerCase(), updated);
    }
  }

  getCompanyInsights(companyId: string): CompanyInsights | undefined {
    return this.insights.get(companyId.toLowerCase());
  }

  getCompanyStats() {
    const profiles = Array.from(this.profiles.values());
    
    const byTier: Record<CompanyTier, number> = {
      'FAANG': 0,
      'Big Tech': 0,
      'Unicorn': 0,
      'Growth Stage': 0,
      'Enterprise': 0,
      'Startup': 0
    };

    const bySize: Record<CompanySize, number> = {
      'startup': 0,
      'small': 0,
      'medium': 0,
      'large': 0,
      'enterprise': 0
    };

    const byIndustry: Record<string, number> = {};

    profiles.forEach(profile => {
      byTier[profile.tier]++;
      bySize[profile.size]++;
      
      profile.industry.forEach(industry => {
        byIndustry[industry] = (byIndustry[industry] || 0) + 1;
      });
    });

    return {
      totalCompanies: profiles.length,
      byTier,
      byIndustry,
      bySize
    };
  }
}

export default CompanyProfileDatabaseImpl;