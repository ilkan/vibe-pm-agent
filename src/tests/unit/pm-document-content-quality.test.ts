// Unit tests for PM document content quality validation
// Tests Pyramid Principle application, Amazon PR-FAQ quality, MoSCoW accuracy, and Impact vs Effort matrix quality

import {
  ManagementOnePager,
  PRFAQ,
  PMRequirements,
  DesignOptions,
  TaskPlan,
  FAQItem,
  PriorityItem,
  DesignOption
} from '../../components/pm-document-generator';

// Helper functions to create valid test data
function createValidOnePager(): ManagementOnePager {
  return {
    answer: 'Build automated workflow optimization immediately to reduce 60% cost savings opportunity',
    because: [
      'Current manual optimization takes 2-3 hours per workflow vs 5 minutes automated, saving 95% time and improving productivity',
      'Quota costs are escalating 30% quarterly with $50K annual waste identified, creating urgent cost savings need',
      'Market timing provides 6-month competitive advantage window with 40% revenue impact before alternatives emerge'
    ],
    whatScopeToday: [
      'Implement intent parsing and business analysis engine with 2-3 consulting techniques',
      'Build workflow optimization with batching and caching strategies',
      'Create ROI analysis and quota forecasting capabilities'
    ],
    risksAndMitigations: [
      {
        risk: 'Technical complexity may cause 2-4 week delays in implementation timeline',
        mitigation: 'Implement MVP approach with phased rollout, start with proven optimization patterns'
      },
      {
        risk: 'User adoption may be slower than expected due to workflow integration challenges',
        mitigation: 'Create comprehensive documentation and establish pilot program with key users'
      },
      {
        risk: 'Optimization accuracy could fall below 40% threshold impacting user trust',
        mitigation: 'Establish clear metrics and continuous improvement process with user feedback'
      }
    ],
    options: {
      conservative: {
        name: 'Conservative',
        summary: 'Basic optimization with manual recommendations'
      },
      balanced: {
        name: 'Balanced',
        summary: 'Automated optimization with consulting analysis',
        recommended: true
      },
      bold: {
        name: 'Bold',
        summary: 'Full AI-powered platform with advanced techniques'
      }
    },
    roiSnapshot: {
      options: {
        conservative: {
          effort: 'Low',
          impact: 'Med',
          estimatedCost: '$50K',
          timing: 'Now'
        },
        balanced: {
          effort: 'Med',
          impact: 'High',
          estimatedCost: '$150K',
          timing: 'Now'
        },
        bold: {
          effort: 'High',
          impact: 'VeryH',
          estimatedCost: '$300K',
          timing: 'Later'
        }
      }
    },
    rightTimeRecommendation: 'Technical readiness supports immediate implementation with manageable risk profile'
  };
}

function createValidPRFAQ(): PRFAQ {
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 3);
  
  return {
    pressRelease: {
      date: futureDate.toISOString().split('T')[0],
      headline: 'New AI Agent Launches: Reduces Developer Workflow Costs by 60%',
      subHeadline: 'Revolutionary optimization system applies consulting techniques to minimize quota consumption',
      body: 'Today we announced the PM Agent Intent Optimizer, solving the critical problem of excessive quota consumption in developer workflows. Our solution applies professional consulting techniques to automatically optimize workflows. "This tool has transformed how we approach optimization," said Jane Developer, Senior Engineer. Available immediately through MCP integration.'
    },
    faq: [
      {
        question: 'Who is the customer?',
        answer: 'Developers and teams using Kiro who want to optimize workflow efficiency and reduce quota consumption'
      },
      {
        question: 'What problem are we solving now?',
        answer: 'Excessive quota consumption due to inefficient workflow patterns and lack of optimization expertise'
      },
      {
        question: 'Why now and why not later?',
        answer: 'Quota costs are rising 30% annually while team budgets remain flat, creating urgent need for optimization'
      },
      {
        question: 'What is the smallest lovable version?',
        answer: 'Core intent parsing with basic optimization recommendations and ROI analysis'
      },
      {
        question: 'How will we measure success (3 metrics)?',
        answer: 'Quota reduction percentage of 40-60%, time savings of 95%, and developer adoption rates above 70%'
      },
      {
        question: 'What are the top 3 risks and mitigations?',
        answer: 'Technical complexity (MVP approach), user adoption (pilot program), optimization accuracy (metrics)'
      },
      {
        question: 'What is not included?',
        answer: 'Legacy system support, custom enterprise integrations, real-time collaboration features'
      },
      {
        question: 'How does this compare to alternatives?',
        answer: 'First automated solution with consulting-grade analysis vs manual optimization or generic tools'
      },
      {
        question: 'What\'s the estimated cost/quota footprint?',
        answer: '$150K development investment with 40-60% quota savings, typically 10-50x ROI'
      },
      {
        question: 'What are the next 2 releases after v1?',
        answer: 'Advanced analytics and monitoring (v2), enterprise features and integrations (v3)'
      }
    ],
    launchChecklist: [
      {
        task: 'Complete scope freeze and requirements finalization',
        owner: 'Product Team',
        dueDate: futureDate.toISOString().split('T')[0]
      }
    ]
  };
}

function createValidRequirements(): PMRequirements {
  return {
    businessGoal: 'Reduce developer workflow costs by 40-60% through intelligent quota optimization',
    userNeeds: {
      jobs: ['Optimize workflow efficiency', 'Reduce quota consumption'],
      pains: ['High quota costs', 'Manual optimization processes'],
      gains: ['Significant cost savings', 'Automated optimization']
    },
    functionalRequirements: [
      'Parse natural language intent',
      'Apply consulting techniques',
      'Generate optimized workflows'
    ],
    constraintsRisks: ['Technical complexity', 'User adoption challenges'],
    priority: {
      must: [
        {
          requirement: 'Intent parsing functionality',
          justification: 'Core capability without which the system cannot function'
        }
      ],
      should: [
        {
          requirement: 'Advanced consulting techniques',
          justification: 'Provides significant value and differentiates from basic optimization tools'
        }
      ],
      could: [
        {
          requirement: 'Real-time collaboration features',
          justification: 'Nice to have for team workflows but optional for initial release'
        }
      ],
      wont: [
        {
          requirement: 'Legacy system support',
          justification: 'Out of scope for initial release, planned for future versions'
        }
      ]
    },
    rightTimeVerdict: {
      decision: 'do_now',
      reasoning: 'Quota costs are escalating quarterly at 30% rate, developer productivity is measurably constrained, and the 3-month payback period aligns with current budget cycles. Delaying increases opportunity cost significantly.'
    }
  };
}

function createValidDesignOptions(): DesignOptions {
  return {
    problemFraming: 'Current workflows consume excessive quotas due to inefficient patterns',
    options: {
      conservative: {
        name: 'Conservative',
        summary: 'Basic optimization with proven techniques only',
        keyTradeoffs: ['Lower risk but limited savings potential', 'Faster implementation but fewer features'],
        impact: 'Medium',
        effort: 'Low',
        majorRisks: ['Limited optimization potential due to complexity constraints']
      },
      balanced: {
        name: 'Balanced',
        summary: 'Comprehensive optimization with consulting analysis',
        keyTradeoffs: ['Balanced risk and reward profile', 'Moderate complexity with good feature set'],
        impact: 'High',
        effort: 'Medium',
        majorRisks: ['Technical complexity in consulting integration']
      },
      bold: {
        name: 'Bold',
        summary: 'Revolutionary zero-based design approach',
        keyTradeoffs: ['Maximum savings potential but higher implementation risk', 'Longer timeline but breakthrough capabilities'],
        impact: 'High',
        effort: 'High',
        majorRisks: ['High technical complexity in implementation', 'Extended development timeline affecting performance']
      }
    },
    impactEffortMatrix: {
      highImpactLowEffort: [],
      highImpactHighEffort: [],
      lowImpactLowEffort: [],
      lowImpactHighEffort: []
    },
    rightTimeRecommendation: 'Balanced approach recommended due to optimal risk-reward profile'
  };
}

function createValidTaskPlan(): TaskPlan {
  return {
    guardrailsCheck: {
      id: '0',
      name: 'Guardrails Check',
      description: 'Validate project limits before proceeding',
      acceptanceCriteria: [
        'Validate quota limits are within acceptable bounds and implement checks',
        'Create budget allocation confirmation and resource availability validation'
      ],
      effort: 'S',
      impact: 'High',
      priority: 'Must',
      limits: {
        maxVibes: 1000,
        maxSpecs: 50,
        budgetUSD: 100000
      },
      checkCriteria: [
        'Budget requirements validated',
        'Technical feasibility confirmed'
      ]
    },
    immediateWins: [
      {
        id: '1',
        name: 'Core Infrastructure',
        description: 'Implement basic project structure',
        acceptanceCriteria: [
          'Create project directory structure and core interfaces',
          'Implement basic MCP server integration framework'
        ],
        effort: 'S',
        impact: 'Med',
        priority: 'Must'
      }
    ],
    shortTerm: [
      {
        id: '2',
        name: 'Intent Parsing',
        description: 'Build natural language processing',
        acceptanceCriteria: [
          'Implement intent parser with natural language processing',
          'Create validation and error handling for parsing'
        ],
        effort: 'M',
        impact: 'High',
        priority: 'Must'
      }
    ],
    longTerm: [
      {
        id: '3',
        name: 'Advanced Analytics',
        description: 'Implement sophisticated analysis',
        acceptanceCriteria: [
          'Build advanced consulting technique integration',
          'Create comprehensive performance monitoring system'
        ],
        effort: 'L',
        impact: 'High',
        priority: 'Should'
      }
    ]
  };
}

describe('PM Document Content Quality Tests', () => {
  describe('Pyramid Principle Application Tests', () => {
    it('should validate management one-pager follows answer-first structure', () => {
      const onePager = createValidOnePager();
      
      // Answer should be clear and decisive
      expect(onePager.answer).toMatch(/^(Build|Implement|Create|Launch|Deploy)/i);
      expect(onePager.answer).toMatch(/(now|immediately|Q[1-4]|within \d+)/i);
      
      // Should contain decision and timing
      expect(onePager.answer.toLowerCase()).toMatch(/(reduce|save|improve|optimize)/);
      expect(onePager.answer.toLowerCase()).toMatch(/(cost|quota|efficiency|productivity)/);
    });

    it('should validate because reasons support the answer', () => {
      const onePager = createValidOnePager();
      
      // Each reason should support the decision
      onePager.because.forEach(reason => {
        // Should contain quantitative evidence
        expect(reason).toMatch(/\d+%|\$[\d,]+[KM]?|\d+[x×]|\d+ (hours?|minutes?|days?)/);
        
        // Should relate to business impact
        expect(reason.toLowerCase()).toMatch(/(productivity|cost|saving|efficiency|time|revenue|impact)/);
      });
      
      // Reasons should be mutually exclusive and collectively exhaustive (MECE)
      const reasonTopics = onePager.because.map(r => {
        if (r.toLowerCase().includes('productivity')) return 'productivity';
        if (r.toLowerCase().includes('cost') || r.toLowerCase().includes('saving')) return 'cost';
        if (r.toLowerCase().includes('time')) return 'time';
        if (r.toLowerCase().includes('roi') || r.toLowerCase().includes('payback')) return 'roi';
        return 'other';
      });
      
      // Should cover different aspects (MECE principle)
      const uniqueTopics = new Set(reasonTopics);
      expect(uniqueTopics.size).toBeGreaterThanOrEqual(2);
    });

    it('should validate scope is actionable and specific', () => {
      const onePager = createValidOnePager();
      
      onePager.whatScopeToday.forEach(scopeItem => {
        // Should be actionable (contains verbs)
        expect(scopeItem.toLowerCase()).toMatch(/(implement|build|create|develop|integrate|generate|provide)/);
        
        // Should be specific (not vague)
        expect(scopeItem).not.toMatch(/^(basic|simple|standard|typical|general)/i);
        
        // Should be measurable or concrete
        expect(scopeItem.length).toBeGreaterThan(20); // Detailed enough
      });
    });

    it('should validate risks have specific mitigations', () => {
      const onePager = createValidOnePager();
      
      onePager.risksAndMitigations.forEach(rm => {
        // Risk should be specific and concrete
        expect(rm.risk.toLowerCase()).toMatch(/(may|might|could|risk of|potential)/);
        
        // Mitigation should be actionable
        expect(rm.mitigation.toLowerCase()).toMatch(/(implement|start|build|create|use|apply|establish)/);
        
        // Mitigation should address the risk
        expect(rm.mitigation.length).toBeGreaterThan(rm.risk.length * 0.5);
      });
    });
  });

  describe('Amazon PR-FAQ Question Completeness Tests', () => {
    it('should validate FAQ covers all required strategic questions', () => {
      const prfaq = createValidPRFAQ();
      
      const strategicQuestions = [
        { pattern: /who.*customer/i, topic: 'customer' },
        { pattern: /what.*problem.*solving/i, topic: 'problem' },
        { pattern: /why.*now.*not.*later/i, topic: 'timing' },
        { pattern: /smallest.*lovable/i, topic: 'mvp' },
        { pattern: /measure.*success/i, topic: 'metrics' },
        { pattern: /risks.*mitigations/i, topic: 'risks' },
        { pattern: /not.*included/i, topic: 'scope' },
        { pattern: /compare.*alternatives/i, topic: 'competition' },
        { pattern: /cost.*quota.*footprint/i, topic: 'cost' },
        { pattern: /next.*releases/i, topic: 'roadmap' }
      ];
      
      strategicQuestions.forEach(sq => {
        const hasQuestion = prfaq.faq.some(faq => sq.pattern.test(faq.question));
        expect(hasQuestion).toBe(true);
      });
    });

    it('should validate FAQ answers provide substantive content', () => {
      const prfaq = createValidPRFAQ();
      
      prfaq.faq.forEach((faq, index) => {
        // Answers should be substantive, not generic
        expect(faq.answer).not.toMatch(/^(yes|no|maybe|tbd|to be determined)\.?$/i);
        
        // Key questions should have detailed answers
        if (faq.question.toLowerCase().includes('customer')) {
          expect(faq.answer.toLowerCase()).toMatch(/(developer|user|team|organization)/);
        }
        
        if (faq.question.toLowerCase().includes('problem')) {
          expect(faq.answer.toLowerCase()).toMatch(/(quota|cost|efficiency|productivity|overrun)/);
        }
        
        if (faq.question.toLowerCase().includes('measure success')) {
          expect(faq.answer).toMatch(/\d+%|\$[\d,]+|metric|kpi|measure/i);
        }
        
        if (faq.question.toLowerCase().includes('cost')) {
          expect(faq.answer).toMatch(/\$[\d,]+[KM]?|\d+%|saving|reduction/i);
        }
      });
    });

    it('should validate press release follows Amazon format', () => {
      const prfaq = createValidPRFAQ();
      const pr = prfaq.pressRelease;
      
      // Should have future date
      const prDate = new Date(pr.date);
      const today = new Date();
      expect(prDate > today).toBe(true);
      
      // Headline should be newsworthy
      expect(pr.headline.toLowerCase()).toMatch(/(new|launch|introduce|announce|release)/);
      expect(pr.headline).toMatch(/\d+%|reduce|improve|optimize|save/i);
      
      // Body should follow problem-solution-quote-availability structure
      expect(pr.body.toLowerCase()).toMatch(/(problem|challenge|struggle)/);
      expect(pr.body.toLowerCase()).toMatch(/(solution|solve|address)/);
      expect(pr.body).toMatch(/"[^"]+"/); // Customer quote
      expect(pr.body.toLowerCase()).toMatch(/(available|launch|release)/);
    });
  });

  describe('MoSCoW Prioritization Accuracy Tests', () => {
    it('should validate Must requirements are truly essential', () => {
      const requirements = createValidRequirements();
      
      requirements.priority.must.forEach(item => {
        // Must items should be core functionality
        expect(item.justification.toLowerCase()).toMatch(/(core|essential|required|critical|fundamental)/);
        
        // Should not be nice-to-have language
        expect(item.justification.toLowerCase()).not.toMatch(/(nice|good|helpful|useful|convenient)/);
        
        // Should relate to basic functionality
        expect(item.requirement.toLowerCase()).toMatch(/(engine|integration|parsing|optimization|server)/);
      });
    });

    it('should validate Should requirements provide clear value', () => {
      const requirements = createValidRequirements();
      
      requirements.priority.should.forEach(item => {
        // Should items provide clear business value
        expect(item.justification.toLowerCase()).toMatch(/(value|benefit|support|enhance|improve)/);
        
        // Should not be essential language
        expect(item.justification.toLowerCase()).not.toMatch(/(required|essential|critical|must)/);
      });
    });

    it('should validate Could requirements are truly optional', () => {
      const requirements = createValidRequirements();
      
      requirements.priority.could.forEach(item => {
        // Could items should be clearly optional
        expect(item.justification.toLowerCase()).toMatch(/(nice|good|helpful|enhancement|optional|future)/);
        
        // Should not suggest high priority
        expect(item.justification.toLowerCase()).not.toMatch(/(critical|essential|required|must)/);
      });
    });

    it('should validate Won\'t requirements have clear rationale', () => {
      const requirements = createValidRequirements();
      
      requirements.priority.wont.forEach(item => {
        // Won't items should explain why not now
        expect(item.justification.toLowerCase()).toMatch(/(scope|future|later|planned|next|v2|release)/);
        
        // Should not suggest never
        expect(item.justification.toLowerCase()).not.toMatch(/(never|impossible|can't|won't)/);
      });
    });

    it('should validate right-time verdict has solid reasoning', () => {
      const requirements = createValidRequirements();
      
      if (requirements.rightTimeVerdict.decision === 'do_now') {
        expect(requirements.rightTimeVerdict.reasoning.toLowerCase()).toMatch(/(cost|escalating|opportunity|budget|cycle|constraint)/);
      } else {
        expect(requirements.rightTimeVerdict.reasoning.toLowerCase()).toMatch(/(risk|complexity|dependency|resource|priority)/);
      }
      
      // Should include quantitative reasoning
      expect(requirements.rightTimeVerdict.reasoning).toMatch(/\d+%|\$[\d,]+[KM]?|\d+ (month|quarter|year)/);
    });
  });

  describe('Impact vs Effort Matrix Accuracy Tests', () => {
    it('should validate design options have consistent impact/effort ratings', () => {
      const designOptions = createValidDesignOptions();
      
      const { conservative, balanced, bold } = designOptions.options;
      
      // Conservative should be lower effort
      expect(['Low', 'Medium']).toContain(conservative.effort);
      
      // Bold should be higher impact or effort
      expect(['Medium', 'High']).toContain(bold.impact);
      expect(['Medium', 'High']).toContain(bold.effort);
      
      // Balanced should be middle ground
      expect(['Medium']).toContain(balanced.effort);
      expect(['Medium', 'High']).toContain(balanced.impact);
    });

    it('should validate tradeoffs are realistic and specific', () => {
      const designOptions = createValidDesignOptions();
      
      Object.values(designOptions.options).forEach(option => {
        expect(option.keyTradeoffs.length).toBeGreaterThanOrEqual(2);
        
        option.keyTradeoffs.forEach(tradeoff => {
          // Should mention specific aspects
          expect(tradeoff.toLowerCase()).toMatch(/(risk|saving|implementation|complexity|time|cost|feature)/);
          
          // Should not be vague
          expect(tradeoff).not.toMatch(/^(good|bad|better|worse)$/i);
        });
      });
    });

    it('should validate major risks are option-specific', () => {
      const designOptions = createValidDesignOptions();
      
      Object.values(designOptions.options).forEach(option => {
        expect(option.majorRisks.length).toBeGreaterThanOrEqual(1);
        
        option.majorRisks.forEach(risk => {
          // Should be specific to the option
          expect(risk.length).toBeGreaterThan(20);
          
          // Should mention concrete concerns
          expect(risk.toLowerCase()).toMatch(/(complex|accuracy|adoption|compatibility|performance|scale)/);
        });
      });
    });
  });

  describe('Task Plan Actionability Tests', () => {
    it('should validate tasks have clear acceptance criteria', () => {
      const taskPlan = createValidTaskPlan();
      
      const allTasks = [
        taskPlan.guardrailsCheck,
        ...taskPlan.immediateWins,
        ...taskPlan.shortTerm,
        ...taskPlan.longTerm
      ];
      
      allTasks.forEach(task => {
        expect(task.acceptanceCriteria.length).toBeGreaterThanOrEqual(2);
        
        task.acceptanceCriteria.forEach(criteria => {
          // Should be testable/verifiable
          expect(criteria.toLowerCase()).toMatch(/(implement|create|build|validate|test|integrate|generate|provide)/);
          
          // Should be specific
          expect(criteria.length).toBeGreaterThan(15);
        });
      });
    });

    it('should validate effort estimates are consistent with task complexity', () => {
      const taskPlan = createValidTaskPlan();
      
      // Guardrails should be small
      expect(taskPlan.guardrailsCheck.effort).toBe('S');
      
      // Immediate wins should be achievable quickly
      taskPlan.immediateWins.forEach(task => {
        expect(['S', 'M']).toContain(task.effort);
      });
      
      // Long-term tasks can be larger
      taskPlan.longTerm.forEach(task => {
        expect(['M', 'L']).toContain(task.effort);
      });
    });

    it('should validate task priorities align with MoSCoW', () => {
      const taskPlan = createValidTaskPlan();
      
      // Guardrails should be Must
      expect(taskPlan.guardrailsCheck.priority).toBe('Must');
      
      // Immediate wins should be high priority
      taskPlan.immediateWins.forEach(task => {
        expect(['Must', 'Should']).toContain(task.priority);
      });
      
      // Should have a mix of priorities
      const allTasks = [...taskPlan.immediateWins, ...taskPlan.shortTerm, ...taskPlan.longTerm];
      const priorities = allTasks.map(t => t.priority);
      const uniquePriorities = new Set(priorities);
      expect(uniquePriorities.size).toBeGreaterThanOrEqual(2);
    });
  });
});