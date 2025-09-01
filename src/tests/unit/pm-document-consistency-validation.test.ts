// Tests for PM Document Consistency Validation

import {
  PMDocumentConsistencyValidator,
  validatePMDocumentConsistency,
  validateManagementOnePager,
  validatePRFAQ,
  validateTaskPlan,
  ConsistencyValidationResult,
  ConsistencyError,
  ConsistencyWarning
} from '../../utils/pm-document-consistency-validation';
import {
  ManagementOnePager,
  PRFAQ,
  PMRequirements,
  DesignOptions,
  TaskPlan,
  Task,
  DesignOption,
  PriorityItem
} from '../../components/pm-document-generator';

describe('PMDocumentConsistencyValidator', () => {
  let validator: PMDocumentConsistencyValidator;

  beforeEach(() => {
    validator = new PMDocumentConsistencyValidator();
  });

  describe('Management One-Pager Validation', () => {
    const mockRequirements: PMRequirements = {
      businessGoal: 'Reduce developer workflow costs by 40-60% through intelligent quota optimization',
      userNeeds: {
        jobs: ['Optimize workflow efficiency', 'Reduce operational costs'],
        pains: ['High quota consumption', 'Manual optimization processes'],
        gains: ['Significant cost savings', 'Automated optimization']
      },
      functionalRequirements: [
        'Natural language intent parsing',
        'Workflow optimization with batching',
        'ROI analysis and forecasting'
      ],
      constraintsRisks: ['Technical complexity', 'User adoption challenges'],
      priority: {
        must: [
          { requirement: 'Intent parsing', justification: 'Core functionality' },
          { requirement: 'Basic optimization', justification: 'Primary value' }
        ],
        should: [
          { requirement: 'Advanced analytics', justification: 'Enhanced value' }
        ],
        could: [
          { requirement: 'Custom integrations', justification: 'Nice to have' }
        ],
        wont: [
          { requirement: 'Legacy system support', justification: 'Out of scope' }
        ]
      },
      rightTimeVerdict: {
        decision: 'do_now',
        reasoning: 'Market timing is optimal'
      }
    };

    const mockDesign: DesignOptions = {
      problemFraming: 'Current workflows consume excessive quotas due to inefficient patterns',
      options: {
        conservative: {
          name: 'Conservative',
          summary: 'Basic optimization with manual recommendations',
          keyTradeoffs: ['Lower risk', 'Limited automation'],
          impact: 'Medium',
          effort: 'Low',
          majorRisks: ['Limited value delivery']
        },
        balanced: {
          name: 'Balanced',
          summary: 'Automated optimization with consulting analysis',
          keyTradeoffs: ['Balanced risk/reward', 'Good automation'],
          impact: 'High',
          effort: 'Medium',
          majorRisks: ['Technical complexity', 'Integration challenges']
        },
        bold: {
          name: 'Bold',
          summary: 'Full AI-powered platform with advanced techniques',
          keyTradeoffs: ['High value', 'High complexity'],
          impact: 'High',
          effort: 'High',
          majorRisks: ['Development complexity', 'Resource requirements']
        }
      },
      impactEffortMatrix: {
        highImpactLowEffort: [],
        highImpactHighEffort: [],
        lowImpactLowEffort: [],
        lowImpactHighEffort: []
      },
      rightTimeRecommendation: 'Now is optimal due to market conditions and technical readiness'
    };

    const mockOnePager: ManagementOnePager = {
      answer: 'Build automated workflow optimization now to capture 40-60% cost savings opportunity',
      because: [
        'Cost optimization opportunity with measurable ROI',
        'Technical architecture is well-defined',
        'Market timing is optimal with minimal competition'
      ],
      whatScopeToday: [
        'Natural language intent parsing engine',
        'Workflow optimization with batching strategies',
        'ROI analysis and quota forecasting'
      ],
      risksAndMitigations: [
        {
          risk: 'Technical complexity may cause delays',
          mitigation: 'Implement MVP first, iterate with advanced features'
        },
        {
          risk: 'User adoption slower than expected',
          mitigation: 'Conduct pilot program with key users'
        },
        {
          risk: 'Quota optimization accuracy below expectations',
          mitigation: 'Establish clear metrics and improvement process'
        }
      ],
      options: {
        conservative: {
          name: 'Conservative',
          summary: 'Basic intent parsing with manual optimization recommendations'
        },
        balanced: {
          name: 'Balanced',
          summary: 'Automated workflow optimization with consulting analysis',
          recommended: true
        },
        bold: {
          name: 'Bold',
          summary: 'Full AI-powered consulting platform with advanced techniques'
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
      rightTimeRecommendation: 'Technical readiness supports immediate implementation with manageable risk'
    };

    it('should validate consistent management one-pager successfully', () => {
      const result = validator.validateManagementOnePagerConsistency(
        mockOnePager,
        mockRequirements,
        mockDesign
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'high')).toHaveLength(0);
    });

    it('should detect option name misalignment', () => {
      const inconsistentOnePager = {
        ...mockOnePager,
        options: {
          ...mockOnePager.options,
          conservative: {
            ...mockOnePager.options.conservative,
            name: 'Minimal' // Different from design
          }
        }
      };

      const result = validator.validateManagementOnePagerConsistency(
        inconsistentOnePager,
        mockRequirements,
        mockDesign
      );

      expect(result.errors.some(e => e.type === 'alignment' && e.field === 'options')).toBe(true);
    });

    it('should detect impact/effort contradictions', () => {
      const contradictoryOnePager = {
        ...mockOnePager,
        roiSnapshot: {
          options: {
            ...mockOnePager.roiSnapshot.options,
            balanced: {
              ...mockOnePager.roiSnapshot.options.balanced,
              impact: 'Med' as const, // Contradicts design high impact
              effort: 'Low' as const   // Contradicts design medium effort
            }
          }
        }
      };

      const result = validator.validateManagementOnePagerConsistency(
        contradictoryOnePager,
        mockRequirements,
        mockDesign
      );

      expect(result.errors.some(e => e.type === 'contradiction')).toBe(true);
    });

    it('should detect missing recommended option', () => {
      const noRecommendedOnePager = {
        ...mockOnePager,
        options: {
          conservative: { name: 'Conservative', summary: 'Basic approach' },
          balanced: { name: 'Balanced', summary: 'Balanced approach' }, // No recommended flag
          bold: { name: 'Bold', summary: 'Advanced approach' }
        }
      };

      const result = validator.validateManagementOnePagerConsistency(
        noRecommendedOnePager,
        mockRequirements,
        mockDesign
      );

      expect(result.errors.some(e => e.type === 'format' && e.field === 'options.recommended')).toBe(true);
    });

    it('should detect incorrect number of reasons', () => {
      const wrongReasonsOnePager = {
        ...mockOnePager,
        because: ['Only one reason'] // Should be exactly 3
      };

      const result = validator.validateManagementOnePagerConsistency(
        wrongReasonsOnePager,
        mockRequirements,
        mockDesign
      );

      expect(result.errors.some(e => e.type === 'format' && e.field === 'because')).toBe(true);
    });

    it('should detect incorrect number of risks', () => {
      const wrongRisksOnePager = {
        ...mockOnePager,
        risksAndMitigations: [
          { risk: 'Risk 1', mitigation: 'Mitigation 1' },
          { risk: 'Risk 2', mitigation: 'Mitigation 2' }
          // Missing third risk
        ]
      };

      const result = validator.validateManagementOnePagerConsistency(
        wrongRisksOnePager,
        mockRequirements,
        mockDesign
      );

      expect(result.errors.some(e => e.type === 'format' && e.field === 'risksAndMitigations')).toBe(true);
    });
  });

  describe('PR-FAQ Validation', () => {
    const mockPRFAQ: PRFAQ = {
      pressRelease: {
        date: '2025-05-30',
        headline: 'Revolutionary AI Agent Reduces Developer Workflow Costs by 60%',
        subHeadline: 'Advanced AI system applies consulting-grade analysis to minimize quota consumption',
        body: 'Today we announced the PM Agent Intent-to-Spec Optimizer, solving the critical problem of excessive quota consumption that has plagued developer workflows. Our breakthrough solution applies professional consulting techniques to automatically optimize workflows while preserving all functionality. The timing is optimal because market conditions are favorable and technical capabilities are mature. "This tool has transformed how we approach workflow optimization," said a beta customer. The system is available immediately through MCP integration.'
      },
      faq: [
        { question: 'Who is the customer?', answer: 'Developers and teams who want to optimize Kiro workflows' },
        { question: 'What problem are we solving now?', answer: 'Excessive quota consumption in developer workflows' },
        { question: 'Why now and why not later?', answer: 'Market timing is optimal with technical readiness' },
        { question: 'What is the smallest lovable version?', answer: 'Basic intent parsing with optimization recommendations' },
        { question: 'How will we measure success (3 metrics)?', answer: 'Quota reduction %, user adoption rate, cost savings' },
        { question: 'What are the top 3 risks and mitigations?', answer: 'Technical complexity (MVP approach), adoption (pilot program), accuracy (metrics)' },
        { question: 'What is not included?', answer: 'Legacy system support, custom enterprise integrations' },
        { question: 'How does this compare to alternatives?', answer: 'First automated solution with consulting-grade analysis' },
        { question: 'What\'s the estimated cost/quota footprint?', answer: '$150K development, 40-60% quota savings' },
        { question: 'What are the next 2 releases after v1?', answer: 'Advanced analytics (v2), enterprise features (v3)' }
      ],
      launchChecklist: [
        { task: 'Scope freeze by target date', owner: 'PM', dueDate: '2025-04-15' },
        { task: 'Technical architecture review', owner: 'Engineering', dueDate: '2025-04-20' },
        { task: 'Beta user recruitment', owner: 'Marketing', dueDate: '2025-05-01' },
        { task: 'Documentation completion', owner: 'Technical Writing', dueDate: '2025-05-15' }
      ]
    };

    const mockRequirements: PMRequirements = {
      businessGoal: 'Reduce developer workflow costs through intelligent quota optimization',
      userNeeds: {
        jobs: ['Optimize workflows', 'Reduce costs'],
        pains: ['High quota consumption', 'Manual processes'],
        gains: ['Cost savings', 'Automation']
      },
      functionalRequirements: ['Intent parsing', 'Optimization', 'ROI analysis'],
      constraintsRisks: ['Technical complexity', 'User adoption'],
      priority: {
        must: [{ requirement: 'Core functionality', justification: 'Essential' }],
        should: [],
        could: [],
        wont: []
      },
      rightTimeVerdict: {
        decision: 'do_now',
        reasoning: 'Optimal timing'
      }
    };

    it('should validate consistent PR-FAQ successfully', () => {
      const result = validator.validatePRFAQConsistency(
        mockPRFAQ,
        mockRequirements
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'high')).toHaveLength(0);
    });

    it('should detect press release word count violation', () => {
      const longPRFAQ = {
        ...mockPRFAQ,
        pressRelease: {
          ...mockPRFAQ.pressRelease,
          body: Array(300).fill('word').join(' ') // 300 words, over the 250 limit
        }
      };

      const result = validator.validatePRFAQConsistency(longPRFAQ, mockRequirements);

      expect(result.errors.some(e => e.type === 'format' && e.field === 'pressRelease.body')).toBe(true);
    });

    it('should detect missing required FAQ questions', () => {
      const incompletePRFAQ = {
        ...mockPRFAQ,
        faq: [
          { question: 'Who is the customer?', answer: 'Developers' },
          { question: 'What problem are we solving?', answer: 'Quota issues' }
          // Missing 8 required questions
        ]
      };

      const result = validator.validatePRFAQConsistency(incompletePRFAQ, mockRequirements);

      expect(result.errors.some(e => e.type === 'missing' && e.field === 'faq')).toBe(true);
    });

    it('should detect too many FAQ questions', () => {
      const tooManyFAQs = {
        ...mockPRFAQ,
        faq: Array(25).fill(null).map((_, i) => ({
          question: `Question ${i + 1}`,
          answer: `Answer ${i + 1}`
        }))
      };

      const result = validator.validatePRFAQConsistency(tooManyFAQs, mockRequirements);

      expect(result.errors.some(e => e.type === 'format' && e.field === 'faq')).toBe(true);
    });

    it('should warn about missing essential checklist items', () => {
      const incompleteChecklistPRFAQ = {
        ...mockPRFAQ,
        launchChecklist: [
          { task: 'Random task', owner: 'Someone', dueDate: '2025-05-01' }
          // Missing scope freeze, timeline, dependencies
        ]
      };

      const result = validator.validatePRFAQConsistency(incompleteChecklistPRFAQ, mockRequirements);

      expect(result.warnings.some(w => w.type === 'missing_detail')).toBe(true);
    });
  });

  describe('Task Plan Validation', () => {
    const mockTaskPlan: TaskPlan = {
      guardrailsCheck: {
        id: '0',
        name: 'Guardrails Check',
        description: 'Validate limits before proceeding',
        acceptanceCriteria: ['Budget within limits', 'Quota constraints met'],
        effort: 'S',
        impact: 'High',
        priority: 'Must',
        limits: {
          maxVibes: 1000,
          maxSpecs: 100,
          budgetUSD: 150000
        },
        checkCriteria: ['Budget check', 'Quota validation', 'Resource availability']
      },
      immediateWins: [
        {
          id: '1.1',
          name: 'Basic Intent Parsing',
          description: 'Implement core intent parsing functionality',
          acceptanceCriteria: ['Parse natural language', 'Extract requirements'],
          effort: 'S',
          impact: 'High',
          priority: 'Must'
        },
        {
          id: '1.2',
          name: 'Simple Optimization',
          description: 'Basic workflow optimization',
          acceptanceCriteria: ['Identify inefficiencies', 'Suggest improvements'],
          effort: 'M',
          impact: 'High',
          priority: 'Must'
        }
      ],
      shortTerm: [
        {
          id: '2.1',
          name: 'Advanced Analytics',
          description: 'Implement consulting techniques',
          acceptanceCriteria: ['Apply MECE framework', 'Generate ROI analysis'],
          effort: 'L',
          impact: 'Med',
          priority: 'Should'
        },
        {
          id: '2.2',
          name: 'MCP Integration',
          description: 'Build MCP server interface',
          acceptanceCriteria: ['Tool definitions', 'Handler implementation'],
          effort: 'M',
          impact: 'High',
          priority: 'Must'
        }
      ],
      longTerm: [
        {
          id: '3.1',
          name: 'Enterprise Features',
          description: 'Advanced enterprise capabilities',
          acceptanceCriteria: ['Custom integrations', 'Advanced security'],
          effort: 'L',
          impact: 'Med',
          priority: 'Could'
        }
      ]
    };

    const mockDesign: DesignOptions = {
      problemFraming: 'Workflows need optimization to reduce quota consumption',
      options: {
        conservative: {
          name: 'Conservative',
          summary: 'Basic optimization',
          keyTradeoffs: ['Low risk'],
          impact: 'Medium',
          effort: 'Low',
          majorRisks: ['Limited value']
        },
        balanced: {
          name: 'Balanced',
          summary: 'Automated optimization with analytics',
          keyTradeoffs: ['Balanced approach'],
          impact: 'High',
          effort: 'Medium',
          majorRisks: ['Technical complexity', 'Integration challenges']
        },
        bold: {
          name: 'Bold',
          summary: 'Full platform',
          keyTradeoffs: ['High value'],
          impact: 'High',
          effort: 'High',
          majorRisks: ['Development complexity']
        }
      },
      impactEffortMatrix: {
        highImpactLowEffort: [],
        highImpactHighEffort: [],
        lowImpactLowEffort: [],
        lowImpactHighEffort: []
      },
      rightTimeRecommendation: 'Now is the right time'
    };

    it('should validate consistent task plan successfully', () => {
      const result = validator.validateTaskPlanConsistency(
        mockTaskPlan,
        mockDesign
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'high')).toHaveLength(0);
    });

    it('should detect missing guardrails identification', () => {
      const badGuardrailsTaskPlan = {
        ...mockTaskPlan,
        guardrailsCheck: {
          ...mockTaskPlan.guardrailsCheck,
          id: 'random-id',
          name: 'Some Task'
        }
      };

      const result = validator.validateTaskPlanConsistency(
        badGuardrailsTaskPlan,
        mockDesign
      );

      expect(result.errors.some(e => e.type === 'format' && e.field === 'guardrailsCheck')).toBe(true);
    });

    it('should detect missing immediate wins', () => {
      const noImmediateWinsTaskPlan = {
        ...mockTaskPlan,
        immediateWins: []
      };

      const result = validator.validateTaskPlanConsistency(
        noImmediateWinsTaskPlan,
        mockDesign
      );

      expect(result.errors.some(e => e.type === 'missing' && e.field === 'immediateWins')).toBe(true);
    });

    it('should warn about too many immediate wins', () => {
      const tooManyImmediateWins = {
        ...mockTaskPlan,
        immediateWins: Array(5).fill(null).map((_, i) => ({
          id: `1.${i + 1}`,
          name: `Task ${i + 1}`,
          description: 'Description',
          acceptanceCriteria: ['Criteria'],
          effort: 'S' as const,
          impact: 'High' as const,
          priority: 'Must' as const
        }))
      };

      const result = validator.validateTaskPlanConsistency(
        tooManyImmediateWins,
        mockDesign
      );

      expect(result.warnings.some(w => w.type === 'format_issue')).toBe(true);
    });

    it('should detect duplicate task IDs', () => {
      const duplicateIDTaskPlan = {
        ...mockTaskPlan,
        shortTerm: [
          ...mockTaskPlan.shortTerm,
          {
            id: '1.1', // Duplicate of immediate win task
            name: 'Duplicate Task',
            description: 'This has a duplicate ID',
            acceptanceCriteria: ['Criteria'],
            effort: 'M' as const,
            impact: 'Med' as const,
            priority: 'Should' as const
          }
        ]
      };

      const result = validator.validateTaskPlanConsistency(
        duplicateIDTaskPlan,
        mockDesign
      );

      expect(result.errors.some(e => e.type === 'format' && e.field === 'taskIds')).toBe(true);
    });

    it('should warn about must priority with low impact', () => {
      const inconsistentPriorityTaskPlan = {
        ...mockTaskPlan,
        immediateWins: [
          {
            id: '1.1',
            name: 'Low Impact Must Task',
            description: 'This task is must but low impact',
            acceptanceCriteria: ['Criteria'],
            effort: 'S' as const,
            impact: 'Low' as const, // Low impact but Must priority
            priority: 'Must' as const
          }
        ]
      };

      const result = validator.validateTaskPlanConsistency(
        inconsistentPriorityTaskPlan,
        mockDesign
      );

      expect(result.warnings.some(w => w.type === 'potential_misalignment')).toBe(true);
    });
  });

  describe('Cross-Document Validation', () => {
    const mockRequirements: PMRequirements = {
      businessGoal: 'Reduce costs through optimization',
      userNeeds: {
        jobs: ['Optimize workflows'],
        pains: ['High costs'],
        gains: ['Savings']
      },
      functionalRequirements: ['Parsing', 'Optimization'],
      constraintsRisks: ['Complexity'],
      priority: {
        must: [{ requirement: 'Core', justification: 'Essential' }],
        should: [],
        could: [],
        wont: []
      },
      rightTimeVerdict: {
        decision: 'do_now',
        reasoning: 'Good timing'
      }
    };

    const mockOnePager: ManagementOnePager = {
      answer: 'Build immediately for cost savings',
      because: ['Cost opportunity', 'Technical readiness', 'Market timing'],
      whatScopeToday: ['Parsing engine', 'Optimization'],
      risksAndMitigations: [
        { risk: 'Complexity', mitigation: 'MVP approach' },
        { risk: 'Adoption', mitigation: 'Pilot program' },
        { risk: 'Accuracy', mitigation: 'Metrics' }
      ],
      options: {
        conservative: { name: 'Conservative', summary: 'Basic' },
        balanced: { name: 'Balanced', summary: 'Automated', recommended: true },
        bold: { name: 'Bold', summary: 'Full platform' }
      },
      roiSnapshot: {
        options: {
          conservative: { effort: 'Low', impact: 'Med', estimatedCost: '$50K', timing: 'Now' },
          balanced: { effort: 'Med', impact: 'High', estimatedCost: '$150K', timing: 'Now' },
          bold: { effort: 'High', impact: 'VeryH', estimatedCost: '$300K', timing: 'Later' }
        }
      },
      rightTimeRecommendation: 'Technical readiness supports immediate implementation'
    };

    const mockPRFAQ: PRFAQ = {
      pressRelease: {
        date: '2025-05-30',
        headline: 'Cost Optimization Tool Launched',
        subHeadline: 'Reduces workflow costs significantly',
        body: 'Today we solve cost optimization challenges with automated workflows. Market timing is perfect.'
      },
      faq: [
        { question: 'Who is the customer?', answer: 'Developers' },
        { question: 'What problem are we solving now?', answer: 'High costs' },
        { question: 'Why now and why not later?', answer: 'Perfect timing' },
        { question: 'What is the smallest lovable version?', answer: 'Basic parsing' },
        { question: 'How will we measure success (3 metrics)?', answer: 'Cost reduction, adoption, satisfaction' },
        { question: 'What are the top 3 risks and mitigations?', answer: 'Complexity (MVP), adoption (pilot), accuracy (metrics)' },
        { question: 'What is not included?', answer: 'Legacy support' },
        { question: 'How does this compare to alternatives?', answer: 'First automated solution' },
        { question: 'What\'s the estimated cost/quota footprint?', answer: '$150K investment' },
        { question: 'What are the next 2 releases after v1?', answer: 'Analytics v2, enterprise v3' }
      ],
      launchChecklist: [
        { task: 'Scope freeze', owner: 'PM', dueDate: '2025-04-15' },
        { task: 'Timeline review', owner: 'Engineering', dueDate: '2025-04-20' },
        { task: 'Dependencies check', owner: 'PM', dueDate: '2025-05-01' }
      ]
    };

    it('should validate consistent cross-document set', () => {
      const result = validatePMDocumentConsistency({
        requirements: mockRequirements,
        onePager: mockOnePager,
        prfaq: mockPRFAQ
      });

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'high')).toHaveLength(0);
    });

    it('should detect timing inconsistency between one-pager and PR-FAQ', () => {
      const urgentOnePager = {
        ...mockOnePager,
        answer: 'Build immediately due to urgent market need'
      };

      const casualPRFAQ = {
        ...mockPRFAQ,
        pressRelease: {
          ...mockPRFAQ.pressRelease,
          body: 'We are launching a nice tool when convenient. No rush.'
        }
      };

      const result = validatePMDocumentConsistency({
        requirements: mockRequirements,
        onePager: urgentOnePager,
        prfaq: casualPRFAQ
      });

      expect(result.warnings.some(w => w.type === 'potential_misalignment')).toBe(true);
    });

    it('should detect scope vs not-included contradiction', () => {
      const scopedOnePager = {
        ...mockOnePager,
        whatScopeToday: ['Legacy system integration', 'Advanced features']
      };

      const contradictoryPRFAQ = {
        ...mockPRFAQ,
        faq: mockPRFAQ.faq.map(faq => 
          faq.question.includes('not included') 
            ? { ...faq, answer: 'Legacy system integration and advanced features are not included' }
            : faq
        )
      };

      const result = validatePMDocumentConsistency({
        requirements: mockRequirements,
        onePager: scopedOnePager,
        prfaq: contradictoryPRFAQ
      });

      expect(result.errors.some(e => e.type === 'contradiction' && e.field === 'scope_vs_not_included')).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    it('should validate management one-pager through convenience function', () => {
      const mockOnePager: ManagementOnePager = {
        answer: 'Build now',
        because: ['Reason 1', 'Reason 2', 'Reason 3'],
        whatScopeToday: ['Feature 1'],
        risksAndMitigations: [
          { risk: 'Risk 1', mitigation: 'Mitigation 1' },
          { risk: 'Risk 2', mitigation: 'Mitigation 2' },
          { risk: 'Risk 3', mitigation: 'Mitigation 3' }
        ],
        options: {
          conservative: { name: 'Conservative', summary: 'Basic' },
          balanced: { name: 'Balanced', summary: 'Automated', recommended: true },
          bold: { name: 'Bold', summary: 'Advanced' }
        },
        roiSnapshot: {
          options: {
            conservative: { effort: 'Low', impact: 'Med', estimatedCost: '$50K', timing: 'Now' },
            balanced: { effort: 'Med', impact: 'High', estimatedCost: '$150K', timing: 'Now' },
            bold: { effort: 'High', impact: 'VeryH', estimatedCost: '$300K', timing: 'Later' }
          }
        },
        rightTimeRecommendation: 'Good timing'
      };

      const result = validateManagementOnePager(mockOnePager);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should validate PR-FAQ through convenience function', () => {
      const mockPRFAQ: PRFAQ = {
        pressRelease: {
          date: '2025-05-30',
          headline: 'Test Headline',
          subHeadline: 'Test Sub',
          body: 'Short body under 250 words.'
        },
        faq: [
          { question: 'Who is the customer?', answer: 'Developers' },
          { question: 'What problem are we solving now?', answer: 'Issues' },
          { question: 'Why now and why not later?', answer: 'Timing' },
          { question: 'What is the smallest lovable version?', answer: 'MVP' },
          { question: 'How will we measure success (3 metrics)?', answer: 'Metrics' },
          { question: 'What are the top 3 risks and mitigations?', answer: 'Risks' },
          { question: 'What is not included?', answer: 'Exclusions' },
          { question: 'How does this compare to alternatives?', answer: 'Comparison' },
          { question: 'What\'s the estimated cost/quota footprint?', answer: 'Cost' },
          { question: 'What are the next 2 releases after v1?', answer: 'Roadmap' }
        ],
        launchChecklist: [
          { task: 'Task 1', owner: 'Owner 1', dueDate: '2025-05-01' }
        ]
      };

      const result = validatePRFAQ(mockPRFAQ);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should validate task plan through convenience function', () => {
      const mockTaskPlan: TaskPlan = {
        guardrailsCheck: {
          id: '0',
          name: 'Guardrails Check',
          description: 'Check limits',
          acceptanceCriteria: ['Criteria'],
          effort: 'S',
          impact: 'High',
          priority: 'Must',
          limits: { maxVibes: 1000 },
          checkCriteria: ['Check 1']
        },
        immediateWins: [
          {
            id: '1.1',
            name: 'Task 1',
            description: 'Description',
            acceptanceCriteria: ['Criteria'],
            effort: 'S',
            impact: 'High',
            priority: 'Must'
          }
        ],
        shortTerm: [],
        longTerm: []
      };

      const result = validateTaskPlan(mockTaskPlan);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });
  });
});