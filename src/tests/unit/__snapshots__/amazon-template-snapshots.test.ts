/**
 * Snapshot Tests for Amazon Working Backwards Templates
 * Tests deterministic template rendering with fixed seed data
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  AmazonTemplateProcessor,
  TemplateContext,
} from '../../components/amazon-template-processor/index';

describe('Amazon Template Snapshots', () => {
  let templateProcessor: AmazonTemplateProcessor;

  const FIXED_TIMESTAMP = 1704067200000; // 2024-01-01T00:00:00.000Z

  beforeEach(() => {
    templateProcessor = new AmazonTemplateProcessor();

    // Mock Date for deterministic testing
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIMESTAMP);
    jest.spyOn(global, 'Date').mockImplementation(() => new Date(FIXED_TIMESTAMP) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createFixedTemplateContext = (): TemplateContext => ({
    featureName: 'AI-Powered Code Assistant',
    customer: 'Software Development Teams',
    problemOneLine: 'Inefficient coding workflows and context switching',
    region: 'North America',
    competitors: ['GitHub Copilot', 'Tabnine', 'CodeWhisperer'],
    ledger: {
      assumptions: [
        {
          id: 'A1',
          name: 'Developer Productivity Increase',
          value: 30,
          unit: '%',
          sourceUrls: ['https://gartner.com/ai-development-tools-2024'],
          certainty: 'High',
          lastChecked: new Date(FIXED_TIMESTAMP),
          category: 'market',
          impact: 'critical',
        },
        {
          id: 'A2',
          name: 'Market Adoption Rate',
          value: 18,
          unit: '%',
          sourceUrls: ['https://stackoverflow.com/developer-survey-2024'],
          certainty: 'High',
          lastChecked: new Date(FIXED_TIMESTAMP),
          category: 'market',
          impact: 'critical',
        },
        {
          id: 'A3',
          name: 'Premium Pricing Acceptance',
          value: 49.99,
          unit: 'USD',
          sourceUrls: [],
          certainty: 'Medium',
          lastChecked: new Date(FIXED_TIMESTAMP),
          category: 'financial',
          impact: 'important',
        },
      ],
      coverage_pct: 67,
      lastUpdated: new Date(FIXED_TIMESTAMP),
      totalClaims: 3,
      backedClaims: 2,
    },
    confidence: {
      total: 78,
      breakdown: {
        evidence: 85,
        recency: 90,
        diversity: 70,
        agreement: 80,
        coverage: 67,
        sensitivity: 75,
      },
      explanation: 'Moderate confidence with strong evidence quality and recent data',
      lowConfidence: false,
    },
    scenarios: {
      scenarios: {
        bear: [
          { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
          { metric: 'Costs', bear: 2160000, base: 1800000, bull: 1440000, unit: 'USD' },
          { metric: 'ROI', bear: 39, base: 108, bull: 213, unit: '%' },
          { metric: 'NPV', bear: 840000, base: 1950000, bull: 3060000, unit: 'USD' },
        ],
        base: [
          { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
          { metric: 'Costs', bear: 2160000, base: 1800000, bull: 1440000, unit: 'USD' },
          { metric: 'ROI', bear: 39, base: 108, bull: 213, unit: '%' },
          { metric: 'NPV', bear: 840000, base: 1950000, bull: 3060000, unit: 'USD' },
        ],
        bull: [
          { metric: 'Revenue', bear: 3000000, base: 3750000, bull: 4500000, unit: 'USD' },
          { metric: 'Costs', bear: 2160000, base: 1800000, bull: 1440000, unit: 'USD' },
          { metric: 'ROI', bear: 39, base: 108, bull: 213, unit: '%' },
          { metric: 'NPV', bear: 840000, base: 1950000, bull: 3060000, unit: 'USD' },
        ],
      },
      elasticities: [
        {
          assumption: 'Market Adoption Rate',
          assumptionChange: '±20%',
          outcomeMetric: 'Revenue',
          outcomeChange: '±15%',
          sensitivity: 15,
        },
        {
          assumption: 'Developer Productivity Increase',
          assumptionChange: '±20%',
          outcomeMetric: 'ROI',
          outcomeChange: '±12%',
          sensitivity: 12,
        },
      ],
      keyDrivers: [
        {
          assumption: 'Market Adoption Rate',
          assumptionId: 'A2',
          impact: 15,
          description:
            'Market Adoption Rate shows moderate sensitivity (±15% impact on Revenue) - drives market opportunity sizing',
        },
        {
          assumption: 'Developer Productivity Increase',
          assumptionId: 'A1',
          impact: 12,
          description:
            'Developer Productivity Increase shows moderate sensitivity (±12% impact on ROI) - drives market opportunity sizing',
        },
      ],
      sensitivityPct: 20,
    },
    hardQuestions: [
      {
        id: 1,
        question:
          'How do you know that Developer Productivity Increase (30%) is accurate? What evidence supports this critical assumption?',
        targetAssumptions: ['A1'],
        category: 'market',
        severity: 'critical',
        evidenceNeeded: [
          'Credible sources for Developer Productivity Increase',
          'Independent validation of the assumption',
        ],
      },
      {
        id: 2,
        question:
          'What if the market adoption rate is significantly lower than projected? How would this impact the business case?',
        targetAssumptions: ['A2'],
        category: 'market',
        severity: 'critical',
        evidenceNeeded: [
          'Third-party market research',
          'Bottom-up market sizing analysis',
          'Customer demand validation',
        ],
      },
      {
        id: 3,
        question:
          'What if development costs are 50% higher than estimated? How does this affect ROI and payback period?',
        targetAssumptions: ['A3'],
        category: 'financial',
        severity: 'critical',
        evidenceNeeded: ['Historical cost analysis', 'Vendor quotes', 'Resource planning details'],
      },
    ],
    citations: [
      {
        url: 'https://gartner.com/ai-development-tools-2024',
        title: 'AI Development Tools Market Analysis 2024',
        date: '2024-01-15',
        rating: 'A',
        sourceType: 'industry_report',
        snippet: 'AI coding tools market expected to reach $15B by 2026',
      },
      {
        url: 'https://stackoverflow.com/developer-survey-2024',
        title: 'Stack Overflow Developer Survey 2024',
        date: '2024-02-01',
        rating: 'A',
        sourceType: 'research',
        snippet: '68% of developers use or plan to use AI coding tools',
      },
      {
        url: 'https://techcrunch.com/ai-coding-adoption',
        title: 'Enterprise AI Coding Tool Adoption Trends',
        date: '2024-01-20',
        rating: 'B',
        sourceType: 'news',
        snippet: 'Enterprise adoption growing 25% quarterly',
      },
    ],
    inputsHash: 'fixed-seed-hash-123',
    isoTimestamp: '2024-01-01T00:00:00.000Z',
    shortHash: 'fixed123',
  });

  describe('PR/FAQ Template Snapshots', () => {
    it('should render PR/FAQ template consistently', () => {
      const context = createFixedTemplateContext();
      const result = templateProcessor.renderPRFAQ(context);

      expect(result).toMatchSnapshot('amazon-pr-faq-template');
    });

    it('should render PR/FAQ with low confidence warning', () => {
      const context = createFixedTemplateContext();
      context.confidence.total = 45;
      context.confidence.lowConfidence = true;
      context.confidence.explanation = 'Low confidence due to insufficient evidence';

      const result = templateProcessor.renderPRFAQ(context);

      expect(result).toContain('⚠️ Human Review Recommended');
      expect(result).toMatchSnapshot('amazon-pr-faq-low-confidence');
    });

    it('should render PR/FAQ with empty assumptions', () => {
      const context = createFixedTemplateContext();
      context.ledger.assumptions = [];
      context.ledger.coverage_pct = 0;
      context.ledger.backedClaims = 0;
      context.hardQuestions = [];

      const result = templateProcessor.renderPRFAQ(context);

      expect(result).toMatchSnapshot('amazon-pr-faq-empty-assumptions');
    });

    it('should render PR/FAQ with maximum data', () => {
      const context = createFixedTemplateContext();

      // Add more assumptions
      context.ledger.assumptions.push(
        {
          id: 'A4',
          name: 'Customer Retention Rate',
          value: 95,
          unit: '%',
          sourceUrls: ['https://example.com/retention-study'],
          certainty: 'High',
          lastChecked: new Date(FIXED_TIMESTAMP),
          category: 'market',
          impact: 'important',
        },
        {
          id: 'A5',
          name: 'Support Cost per User',
          value: 5,
          unit: 'USD',
          sourceUrls: ['https://example.com/support-costs'],
          certainty: 'Medium',
          lastChecked: new Date(FIXED_TIMESTAMP),
          category: 'financial',
          impact: 'supporting',
        }
      );

      // Add more hard questions
      context.hardQuestions.push(
        {
          id: 4,
          question:
            'How will competitors respond to this launch? What if they launch a similar solution first?',
          targetAssumptions: ['A1', 'A2'],
          category: 'competitive',
          severity: 'important',
          evidenceNeeded: ['Competitive intelligence analysis', 'Competitor roadmap research'],
        },
        {
          id: 5,
          question: 'Do we have the technical capabilities to execute this successfully?',
          targetAssumptions: ['A3'],
          category: 'execution',
          severity: 'important',
          evidenceNeeded: ['Technical feasibility study', 'Resource capacity analysis'],
        }
      );

      context.ledger.coverage_pct = 80;
      context.ledger.totalClaims = 5;
      context.ledger.backedClaims = 4;

      const result = templateProcessor.renderPRFAQ(context);

      expect(result).toMatchSnapshot('amazon-pr-faq-maximum-data');
    });
  });

  describe('Decision One-Pager Template Snapshots', () => {
    it('should render Decision One-Pager template consistently', () => {
      const context = createFixedTemplateContext();
      const result = templateProcessor.renderDecisionOnePager(context);

      expect(result).toMatchSnapshot('amazon-decision-onepager-template');
    });

    it('should render Decision One-Pager with high confidence', () => {
      const context = createFixedTemplateContext();
      context.confidence.total = 92;
      context.confidence.lowConfidence = false;
      context.confidence.explanation = 'High confidence with excellent evidence quality';
      context.confidence.breakdown = {
        evidence: 95,
        recency: 98,
        diversity: 90,
        agreement: 92,
        coverage: 85,
        sensitivity: 88,
      };

      const result = templateProcessor.renderDecisionOnePager(context);

      expect(result).not.toContain('⚠️ Human Review Recommended');
      expect(result).toMatchSnapshot('amazon-decision-onepager-high-confidence');
    });

    it('should render Decision One-Pager with comprehensive ROI analysis', () => {
      const context = createFixedTemplateContext();

      // Add Investment metric for ROI table
      context.scenarios.scenarios.bear.unshift({
        metric: 'Investment',
        bear: 2160000,
        base: 1800000,
        bull: 1440000,
        unit: 'USD',
      });
      context.scenarios.scenarios.base.unshift({
        metric: 'Investment',
        bear: 2160000,
        base: 1800000,
        bull: 1440000,
        unit: 'USD',
      });
      context.scenarios.scenarios.bull.unshift({
        metric: 'Investment',
        bear: 2160000,
        base: 1800000,
        bull: 1440000,
        unit: 'USD',
      });

      const result = templateProcessor.renderDecisionOnePager(context);

      expect(result).toContain('## ROI Range');
      expect(result).toMatchSnapshot('amazon-decision-onepager-comprehensive-roi');
    });

    it('should render Decision One-Pager with minimal data', () => {
      const context = createFixedTemplateContext();

      // Minimal data scenario
      context.ledger.assumptions = context.ledger.assumptions.slice(0, 1);
      context.hardQuestions = context.hardQuestions.slice(0, 1);
      context.scenarios.elasticities = context.scenarios.elasticities.slice(0, 1);
      context.scenarios.keyDrivers = context.scenarios.keyDrivers.slice(0, 1);
      context.citations = context.citations.slice(0, 1);

      const result = templateProcessor.renderDecisionOnePager(context);

      expect(result).toMatchSnapshot('amazon-decision-onepager-minimal-data');
    });
  });

  describe('Template Edge Cases', () => {
    it('should handle special characters in feature names', () => {
      const context = createFixedTemplateContext();
      context.featureName = 'AI-Powered Code Assistant™ (Beta) & More';
      context.customer = 'Enterprise Teams @ Fortune 500';

      const prfaqResult = templateProcessor.renderPRFAQ(context);
      const onepagerResult = templateProcessor.renderDecisionOnePager(context);

      expect(prfaqResult).toContain('AI-Powered Code Assistant™ (Beta) & More');
      expect(onepagerResult).toContain('Enterprise Teams @ Fortune 500');

      expect(prfaqResult).toMatchSnapshot('amazon-pr-faq-special-characters');
      expect(onepagerResult).toMatchSnapshot('amazon-decision-onepager-special-characters');
    });

    it('should handle very long assumption names and values', () => {
      const context = createFixedTemplateContext();
      context.ledger.assumptions[0].name =
        'Very Long Assumption Name That Exceeds Normal Length Expectations And Contains Multiple Technical Terms And Detailed Descriptions';
      context.ledger.assumptions[0].value =
        'This is an extremely long assumption value that contains detailed explanations, multiple clauses, and comprehensive descriptions that might cause formatting issues in tables and other display elements';

      const result = templateProcessor.renderPRFAQ(context);

      expect(result).toMatchSnapshot('amazon-pr-faq-long-content');
    });

    it('should handle empty citations gracefully', () => {
      const context = createFixedTemplateContext();
      context.citations = [];

      const prfaqResult = templateProcessor.renderPRFAQ(context);
      const onepagerResult = templateProcessor.renderDecisionOnePager(context);

      expect(prfaqResult).toContain('### Citations');
      expect(onepagerResult).toContain('### Citations');

      expect(prfaqResult).toMatchSnapshot('amazon-pr-faq-no-citations');
      expect(onepagerResult).toMatchSnapshot('amazon-decision-onepager-no-citations');
    });

    it('should handle numeric edge cases in scenarios', () => {
      const context = createFixedTemplateContext();

      // Add edge case numbers
      context.scenarios.scenarios.bear[0].bear = 0;
      context.scenarios.scenarios.base[0].base = 999999999;
      context.scenarios.scenarios.bull[0].bull = -1000000;

      const result = templateProcessor.renderDecisionOnePager(context);

      expect(result).toMatchSnapshot('amazon-decision-onepager-numeric-edge-cases');
    });
  });

  describe('Front-matter Consistency', () => {
    it('should generate consistent front-matter for PR/FAQ', () => {
      const context = createFixedTemplateContext();
      const result = templateProcessor.renderPRFAQ(context);

      // Extract front-matter
      const frontMatterMatch = result.match(/^---\n([\s\S]*?)\n---/);
      expect(frontMatterMatch).toBeTruthy();

      const frontMatter = frontMatterMatch![1];
      expect(frontMatter).toContain('title: "PR/FAQ — AI-Powered Code Assistant"');
      expect(frontMatter).toContain('artifact_type: pr_faq');
      expect(frontMatter).toContain('created_at: "2024-01-01T00:00:00.000Z"');
      expect(frontMatter).toContain('inputs_hash: "fixed-seed-hash-123"');
      expect(frontMatter).toContain('profile: "amazon"');
      expect(frontMatter).toContain('total: 78');
      expect(frontMatter).toContain('coverage_pct: 67');
      expect(frontMatter).toContain('pct: 20');

      expect(frontMatter).toMatchSnapshot('amazon-pr-faq-front-matter');
    });

    it('should generate consistent front-matter for Decision One-Pager', () => {
      const context = createFixedTemplateContext();
      const result = templateProcessor.renderDecisionOnePager(context);

      // Extract front-matter
      const frontMatterMatch = result.match(/^---\n([\s\S]*?)\n---/);
      expect(frontMatterMatch).toBeTruthy();

      const frontMatter = frontMatterMatch![1];
      expect(frontMatter).toContain('title: "Decision One-Pager — AI-Powered Code Assistant"');
      expect(frontMatter).toContain('artifact_type: decision_onepager');
      expect(frontMatter).toContain('created_at: "2024-01-01T00:00:00.000Z"');
      expect(frontMatter).toContain('inputs_hash: "fixed-seed-hash-123"');

      expect(frontMatter).toMatchSnapshot('amazon-decision-onepager-front-matter');
    });
  });
});
