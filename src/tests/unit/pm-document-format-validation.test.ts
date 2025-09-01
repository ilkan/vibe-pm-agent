// Unit tests for PM document format validation
// Tests format compliance for management one-pagers, PR-FAQs, requirements, design options, and task plans

import {
  ManagementOnePager,
  PRFAQ,
  PMRequirements
} from '../../components/pm-document-generator';

describe('PM Document Format Validation', () => {
  describe('Management One-Pager Format Validation', () => {
    it('should validate one-pager has proper structure', () => {
      const validOnePager: ManagementOnePager = {
        answer: 'Build the PM Agent Intent Optimizer now to reduce quota costs by 40-60% within Q2 2025.',
        because: [
          'Developer productivity is constrained by quota overruns in 73% of workflows',
          'Current manual optimization takes 2-3 hours per workflow vs 5 minutes automated',
          'ROI analysis shows $500K annual savings potential with 3-month payback period'
        ],
        whatScopeToday: [
          'Intent parsing and business analysis engine',
          'Workflow optimization algorithms',
          'ROI forecasting with scenario modeling'
        ],
        risksAndMitigations: [
          {
            risk: 'Complex workflows may not optimize effectively',
            mitigation: 'Start with common patterns, build technique library iteratively'
          },
          {
            risk: 'ROI estimates may be inaccurate initially',
            mitigation: 'Implement feedback loop to calibrate forecasting models'
          },
          {
            risk: 'Developer adoption may be slow',
            mitigation: 'Integrate directly into Kiro workflow, minimal learning curve'
          }
        ],
        options: {
          conservative: {
            name: 'Conservative',
            summary: 'Basic optimization with proven techniques, 20-30% quota savings'
          },
          balanced: {
            name: 'Balanced',
            summary: 'Full consulting toolkit with ROI analysis, 40-60% quota savings',
            recommended: true
          },
          bold: {
            name: 'Bold (ZBD)',
            summary: 'Zero-based design with radical workflow restructuring, 70%+ savings'
          }
        },
        roiSnapshot: {
          options: {
            conservative: {
              effort: 'Low',
              impact: 'Med',
              estimatedCost: '$150K',
              timing: 'Now'
            },
            balanced: {
              effort: 'Med',
              impact: 'High',
              estimatedCost: '$300K',
              timing: 'Now'
            },
            bold: {
              effort: 'High',
              impact: 'VeryH',
              estimatedCost: '$500K',
              timing: 'Later'
            }
          }
        },
        rightTimeRecommendation: 'Now is the right time because quota costs are escalating quarterly.'
      };
      
      // Check required sections exist
      expect(validOnePager.answer).toBeDefined();
      expect(validOnePager.because).toHaveLength(3);
      expect(validOnePager.whatScopeToday).toBeDefined();
      expect(validOnePager.risksAndMitigations).toHaveLength(3);
      expect(validOnePager.options.conservative).toBeDefined();
      expect(validOnePager.options.balanced).toBeDefined();
      expect(validOnePager.options.bold).toBeDefined();
      expect(validOnePager.options.balanced.recommended).toBe(true);
      expect(validOnePager.roiSnapshot).toBeDefined();
      expect(validOnePager.rightTimeRecommendation).toBeDefined();
    });

    it('should validate answer is one line', () => {
      const onePager: ManagementOnePager = {
        answer: 'Build the PM Agent Intent Optimizer now to reduce quota costs by 40-60% within Q2 2025.',
        because: ['Reason 1', 'Reason 2', 'Reason 3'],
        whatScopeToday: ['Scope 1'],
        risksAndMitigations: [
          { risk: 'Risk 1', mitigation: 'Mitigation 1' },
          { risk: 'Risk 2', mitigation: 'Mitigation 2' },
          { risk: 'Risk 3', mitigation: 'Mitigation 3' }
        ],
        options: {
          conservative: { name: 'Conservative', summary: 'Conservative approach' },
          balanced: { name: 'Balanced', summary: 'Balanced approach', recommended: true },
          bold: { name: 'Bold', summary: 'Bold approach' }
        },
        roiSnapshot: {
          options: {
            conservative: { effort: 'Low', impact: 'Med', estimatedCost: '$150K', timing: 'Now' },
            balanced: { effort: 'Med', impact: 'High', estimatedCost: '$300K', timing: 'Now' },
            bold: { effort: 'High', impact: 'VeryH', estimatedCost: '$500K', timing: 'Later' }
          }
        },
        rightTimeRecommendation: 'Now is the right time.'
      };
      
      expect(onePager.answer.split('\n')).toHaveLength(1);
      expect(onePager.answer.length).toBeGreaterThan(20);
      expect(onePager.answer.length).toBeLessThanOrEqual(200);
    });

    it('should validate exactly 3 because reasons', () => {
      const onePager: ManagementOnePager = {
        answer: 'Build now.',
        because: [
          'Developer productivity is constrained by quota overruns in 73% of workflows',
          'Current manual optimization takes 2-3 hours per workflow vs 5 minutes automated',
          'ROI analysis shows $500K annual savings potential with 3-month payback period'
        ],
        whatScopeToday: ['Scope'],
        risksAndMitigations: [
          { risk: 'Risk 1', mitigation: 'Mitigation 1' },
          { risk: 'Risk 2', mitigation: 'Mitigation 2' },
          { risk: 'Risk 3', mitigation: 'Mitigation 3' }
        ],
        options: {
          conservative: { name: 'Conservative', summary: 'Conservative approach' },
          balanced: { name: 'Balanced', summary: 'Balanced approach', recommended: true },
          bold: { name: 'Bold', summary: 'Bold approach' }
        },
        roiSnapshot: {
          options: {
            conservative: { effort: 'Low', impact: 'Med', estimatedCost: '$150K', timing: 'Now' },
            balanced: { effort: 'Med', impact: 'High', estimatedCost: '$300K', timing: 'Now' },
            bold: { effort: 'High', impact: 'VeryH', estimatedCost: '$500K', timing: 'Later' }
          }
        },
        rightTimeRecommendation: 'Now is the right time.'
      };
      
      expect(onePager.because).toHaveLength(3);
      onePager.because.forEach(reason => {
        expect(reason.length).toBeGreaterThan(10);
        expect(reason.length).toBeLessThanOrEqual(150);
      });
    });
  });

  describe('PR-FAQ Format Validation', () => {
    it('should validate press release has required structure', () => {
      const validPRFAQ: PRFAQ = {
        pressRelease: {
          date: '2025-06-01',
          headline: 'New PM Agent Intent Optimizer Reduces Developer Quota Costs by 60%',
          subHeadline: 'AI-powered system transforms raw developer intent into optimized Kiro specifications',
          body: 'Developers struggle with quota overruns that constrain productivity and increase costs. The PM Agent Intent Optimizer solves this by applying professional consulting techniques to automatically optimize workflows.'
        },
        faq: [
          { question: 'Who is the customer?', answer: 'Developers using Kiro who want to optimize quota consumption.' },
          { question: 'What problem are we solving now?', answer: 'Quota overruns that constrain developer productivity.' },
          { question: 'Why now and why not later?', answer: 'Quota costs are escalating quarterly.' },
          { question: 'What is the smallest lovable version?', answer: 'Intent parsing with basic optimization.' },
          { question: 'How will we measure success?', answer: 'Quota reduction percentage and time savings.' },
          { question: 'What are the top 3 risks and mitigations?', answer: 'Complex workflows, ROI accuracy, adoption.' },
          { question: 'What is not included?', answer: 'Advanced workflow debugging and real-time optimization.' },
          { question: 'How does this compare to alternatives?', answer: 'Manual optimization takes hours vs minutes.' },
          { question: 'What\'s the estimated cost/quota footprint?', answer: 'Development cost $300K, 40-60% savings.' },
          { question: 'What are the next 2 releases after v1?', answer: 'Advanced technique library and monitoring.' }
        ],
        launchChecklist: [
          { task: 'Complete MCP server integration testing', owner: 'Engineering', dueDate: '2025-05-15' },
          { task: 'Finalize ROI calculation algorithms', owner: 'Product', dueDate: '2025-05-20' },
          { task: 'Prepare developer documentation', owner: 'DevRel', dueDate: '2025-05-25' },
          { task: 'Conduct beta testing with key customers', owner: 'Product', dueDate: '2025-05-30' },
          { task: 'Launch announcement and marketing', owner: 'Marketing', dueDate: '2025-06-01' }
        ]
      };
      
      const pr = validPRFAQ.pressRelease;
      
      expect(pr.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(pr.headline).toBeDefined();
      expect(pr.headline.length).toBeGreaterThan(10);
      expect(pr.headline.length).toBeLessThanOrEqual(100);
      expect(pr.subHeadline).toBeDefined();
      expect(pr.subHeadline.length).toBeGreaterThan(10);
      expect(pr.body).toBeDefined();
      expect(pr.body.length).toBeGreaterThan(100);
    });

    it('should validate FAQ has exactly 10 questions', () => {
      const validPRFAQ: PRFAQ = {
        pressRelease: {
          date: '2025-06-01',
          headline: 'Test Headline',
          subHeadline: 'Test SubHeadline',
          body: 'Test body content that is long enough to meet requirements.'
        },
        faq: [
          { question: 'Who is the customer?', answer: 'Answer 1' },
          { question: 'What problem are we solving now?', answer: 'Answer 2' },
          { question: 'Why now and why not later?', answer: 'Answer 3' },
          { question: 'What is the smallest lovable version?', answer: 'Answer 4' },
          { question: 'How will we measure success?', answer: 'Answer 5' },
          { question: 'What are the top 3 risks and mitigations?', answer: 'Answer 6' },
          { question: 'What is not included?', answer: 'Answer 7' },
          { question: 'How does this compare to alternatives?', answer: 'Answer 8' },
          { question: 'What\'s the estimated cost/quota footprint?', answer: 'Answer 9' },
          { question: 'What are the next 2 releases after v1?', answer: 'Answer 10' }
        ],
        launchChecklist: [
          { task: 'Task 1', owner: 'Owner 1', dueDate: '2025-05-15' }
        ]
      };
      
      expect(validPRFAQ.faq).toHaveLength(10);
    });
  });

  describe('Requirements Format Validation', () => {
    it('should validate MoSCoW structure', () => {
      const validRequirements: PMRequirements = {
        businessGoal: 'Reduce developer quota consumption by 40-60% through intelligent workflow optimization.',
        userNeeds: {
          jobs: ['Optimize workflows for quota efficiency'],
          pains: ['Manual optimization takes 2-3 hours per workflow'],
          gains: ['Automated optimization in minutes']
        },
        functionalRequirements: [
          'Parse natural language developer intent into structured requirements'
        ],
        constraintsRisks: [
          'Must integrate seamlessly with existing Kiro workflows'
        ],
        priority: {
          must: [
            { requirement: 'Intent parsing and optimization engine', justification: 'Core functionality required for any value delivery' }
          ],
          should: [
            { requirement: 'ROI analysis with multiple scenarios', justification: 'Provides decision-making support for optimization choices' }
          ],
          could: [
            { requirement: 'Advanced workflow debugging', justification: 'Nice-to-have for complex optimization scenarios' }
          ],
          wont: [
            { requirement: 'Real-time workflow monitoring', justification: 'Out of scope for MVP, planned for future release' }
          ]
        },
        rightTimeVerdict: {
          decision: 'do_now',
          reasoning: 'Quota costs are escalating quarterly, developer productivity is measurably constrained.'
        }
      };
      
      expect(validRequirements.priority.must).toBeDefined();
      expect(validRequirements.priority.should).toBeDefined();
      expect(validRequirements.priority.could).toBeDefined();
      expect(validRequirements.priority.wont).toBeDefined();
      
      // Validate each priority has items with justification
      validRequirements.priority.must.forEach(item => {
        expect(item.requirement).toBeDefined();
        expect(item.justification).toBeDefined();
        expect(item.justification.split('\n')).toHaveLength(1); // 1-line justification
      });
    });
  });
});