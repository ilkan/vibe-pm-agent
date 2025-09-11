/**
 * Integration tests for upgraded MCP handlers with Amazon mechanism integration
 * Tests task 8: Upgrade MCP tool handlers with mechanism integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { generateBusinessCase } from '../../mcp/tools/generate_business_case';
import { createStakeholderCommunication } from '../../mcp/tools/create_stakeholder_communication';
import {
  MCPToolContext,
  GenerateBusinessCaseArgs,
  CreateStakeholderCommunicationArgs,
} from '../../models/mcp';

// Mock the Amazon services
jest.mock('../../services/amazon', () => {
  const mockAssumptionLedgerService = {
    normalizeLedger: jest.fn(),
  };
  const mockConfidenceService = {
    computeConfidence: jest.fn(),
  };
  const mockScenarioService = {
    runScenarios: jest.fn(),
  };
  const mockHardQuestionsService = {
    generateQuestions: jest.fn(),
  };
  const mockSteeringWriter = {
    writeSteering: jest.fn(),
  };

  return {
    AssumptionLedgerService: jest.fn(() => mockAssumptionLedgerService),
    ConfidenceService: jest.fn(() => mockConfidenceService),
    ScenarioService: jest.fn(() => mockScenarioService),
    HardQuestionsService: jest.fn(() => mockHardQuestionsService),
    SteeringWriter: jest.fn(() => mockSteeringWriter),
  };
});

// Mock the AI Agent Pipeline
jest.mock('../../pipeline/ai-agent-pipeline', () => {
  const mockPipeline = {
    generateBusinessCase: jest.fn(),
    generatePRFAQ: jest.fn(),
    generateManagementOnePager: jest.fn(),
  };

  return {
    AIAgentPipeline: jest.fn(() => mockPipeline),
  };
});

describe('Amazon MCP Handlers Integration', () => {
  let mockContext: MCPToolContext;

  beforeEach(() => {
    mockContext = {
      toolName: 'test_tool',
      sessionId: 'test-session-123',
      timestamp: Date.now(),
      requestId: 'req-123',
      traceId: 'trace-123',
    };

    // Clear all mocks
    jest.clearAllMocks();

    // Set up default mock return values
    const {
      AssumptionLedgerService,
      ConfidenceService,
      ScenarioService,
      HardQuestionsService,
      SteeringWriter,
    } = require('../../services/amazon');
    const { AIAgentPipeline } = require('../../pipeline/ai-agent-pipeline');

    // Mock Amazon services
    const mockLedgerService = new AssumptionLedgerService();
    mockLedgerService.normalizeLedger.mockResolvedValue({
      success: true,
      data: {
        assumptions: [
          {
            id: 'A1',
            name: 'Market Size',
            value: 1000000000,
            unit: 'USD',
            sourceUrls: ['https://example.com/market-report'],
            certainty: 'High',
            lastChecked: new Date(),
            category: 'market',
            impact: 'critical',
          },
          {
            id: 'A2',
            name: 'Development Cost',
            value: 500000,
            unit: 'USD',
            sourceUrls: [],
            certainty: 'Medium',
            lastChecked: new Date(),
            category: 'financial',
            impact: 'critical',
          },
        ],
        coverage_pct: 75,
        lastUpdated: new Date(),
        totalClaims: 4,
        backedClaims: 3,
      },
    });

    const mockConfidenceService = new ConfidenceService();
    mockConfidenceService.computeConfidence.mockResolvedValue({
      success: true,
      data: {
        total: 78,
        breakdown: {
          evidence: 85,
          recency: 75,
          diversity: 70,
          agreement: 80,
          coverage: 75,
          sensitivity: 85,
        },
        explanation: 'Moderate confidence with good evidence quality',
        lowConfidence: false,
      },
    });

    const mockScenarioService = new ScenarioService();
    mockScenarioService.runScenarios.mockResolvedValue({
      success: true,
      data: {
        scenarios: {
          bear: [
            { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000, unit: 'USD' },
            { metric: 'ROI', bear: 60, base: 100, bull: 140, unit: '%' },
          ],
          base: [
            { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000, unit: 'USD' },
            { metric: 'ROI', bear: 60, base: 100, bull: 140, unit: '%' },
          ],
          bull: [
            { metric: 'Revenue', bear: 800000, base: 1000000, bull: 1200000, unit: 'USD' },
            { metric: 'ROI', bear: 60, base: 100, bull: 140, unit: '%' },
          ],
        },
        elasticities: [
          {
            assumption: 'Market Size',
            assumptionChange: '±20%',
            outcomeMetric: 'Revenue',
            outcomeChange: '±15%',
            sensitivity: 15,
          },
        ],
        keyDrivers: [
          {
            assumption: 'Market Size',
            assumptionId: 'A1',
            impact: 15,
            description: 'Market Size shows moderate sensitivity (±15% impact on Revenue)',
          },
        ],
        sensitivityPct: 20,
      },
    });

    const mockQuestionsService = new HardQuestionsService();
    mockQuestionsService.generateQuestions.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          question:
            'How do you know that Market Size ($1B) is accurate? What evidence supports this critical assumption?',
          targetAssumptions: ['A1'],
          category: 'market',
          severity: 'critical',
          evidenceNeeded: ['Third-party market research', 'Bottom-up market sizing analysis'],
        },
        {
          id: 2,
          question:
            'What if development costs are 50% higher than estimated? How does this affect ROI and payback period?',
          targetAssumptions: ['A2'],
          category: 'financial',
          severity: 'critical',
          evidenceNeeded: ['Historical cost analysis', 'Vendor quotes'],
        },
      ],
    });

    const mockSteeringWriter = new SteeringWriter();
    mockSteeringWriter.writeSteering.mockResolvedValue({
      success: true,
      data: {
        success: true,
        featureSlug: 'business-case',
        artifactPath: '.kiro/steering/working-backwards/business-case/business-case-abc123.md',
        attachmentPaths: [],
        inputsHash: 'abc123',
        message: 'Success',
        filename: 'business-case-abc123.md',
        fullPath: '.kiro/steering/working-backwards/business-case/business-case-abc123.md',
      },
    });

    // Mock AI Pipeline
    const mockPipeline = new AIAgentPipeline();
    mockPipeline.generateBusinessCase.mockResolvedValue(`# Business Case: Test Feature

## Executive Summary
This is a comprehensive business case for the test feature targeting enterprise customers.

## Market Opportunity
- Target Market: Enterprise customers
- Market Size: $1B
- Key Competitors: CompetitorA, CompetitorB

## Financial Analysis
- Development Cost: $500K
- Expected Revenue: $1M
- ROI: 100%

## Recommendation
Proceed with development based on strong market opportunity and financial projections.`);

    mockPipeline.generatePRFAQ.mockResolvedValue({
      press_release_markdown: `# Press Release: Test Feature Launch

We are excited to announce the launch of Test Feature, designed specifically for enterprise customers.

## Key Benefits
- Improved efficiency by 50%
- Cost reduction of $100K annually
- Enhanced user experience`,
      faq_markdown: `## Frequently Asked Questions

**Q1: Who is this for?**
A1: Enterprise customers looking to improve operational efficiency.

**Q2: When will it be available?**
A2: Q2 2024.`,
      launch_checklist_markdown: `## Launch Checklist

- [ ] Complete development
- [ ] Conduct user testing
- [ ] Prepare marketing materials
- [ ] Train support team`,
    });

    mockPipeline.generateManagementOnePager.mockResolvedValue({
      one_pager_markdown: `# Decision One-Pager: Test Feature

## Context
Enterprise customers need improved operational efficiency.

## Options
1. **Status Quo**: Continue with current solution
2. **Proposal**: Build Test Feature
3. **Alternative**: Partner with third-party

## Recommendation
**GO** - Build Test Feature

## ROI Analysis
- Investment: $500K
- Return: $1M
- Payback: 6 months`,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generate_business_case handler', () => {
    it('should generate business case with Amazon mechanisms', async () => {
      const args: GenerateBusinessCaseArgs = {
        opportunity_analysis: `# Business Opportunity Analysis

## Feature Overview
Feature: Test Feature
Customer: Enterprise customers
Market Size: $1B
Competitors: CompetitorA, CompetitorB

## Market Analysis
The enterprise market shows strong demand for efficiency solutions.
We assume that 10% market penetration is achievable within 2 years.
We believe that customers will pay $10K annually for this solution.

## Competitive Landscape
Current solutions are outdated and expensive.
We expect to capture market share through superior UX and pricing.`,
        financial_inputs: {
          development_cost: 500000,
          operational_cost: 100000,
          expected_revenue: 1000000,
          time_to_market: 12,
        },
        steering_options: {
          create_steering_files: true,
          feature_name: 'test-feature',
        },
      };

      const result = await generateBusinessCase(args, mockContext);

      // Verify successful execution
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('# Generated-by: Kiro Spec Mode');
      expect(result.content[0].markdown).toContain('Business Case: Test Feature');

      // Verify Amazon mechanisms are included
      expect(result.content[0].markdown).toContain('## Evidence Mechanisms');
      expect(result.content[0].markdown).toContain('### Assumption Ledger');
      expect(result.content[0].markdown).toContain('### Confidence Assessment');
      expect(result.content[0].markdown).toContain('### Scenario Analysis');
      expect(result.content[0].markdown).toContain('### Hard Questions');

      // Verify confidence score in metadata (requirement 8.4)
      expect(result.metadata?.confidenceScore).toBe(78);
      expect(result.metadata?.quotaUsed).toBe(4);
      expect(result.metadata?.steeringFileCreated).toBe(true);

      // Verify assumption ledger table format
      expect(result.content[0].markdown).toContain('| ID | Name | Value | Certainty | Sources |');
      expect(result.content[0].markdown).toContain(
        '| A1 | Market Size | 1000000000 USD | High | 1 |'
      );
      expect(result.content[0].markdown).toContain(
        '| A2 | Development Cost | 500000 USD | Medium | 0 |'
      );

      // Verify confidence breakdown
      expect(result.content[0].markdown).toContain('**Overall Confidence**: 78/100 ✅');
      expect(result.content[0].markdown).toContain('- Evidence Quality: 85/100');
      expect(result.content[0].markdown).toContain('- Data Recency: 75/100');

      // Verify scenario analysis table
      expect(result.content[0].markdown).toContain(
        '| Metric | Bear Case | Base Case | Bull Case | Unit |'
      );
      expect(result.content[0].markdown).toContain(
        '| Revenue | 800000 | **1000000** | 1200000 | USD |'
      );

      // Verify hard questions
      expect(result.content[0].markdown).toContain('**Q1**: How do you know that Market Size');
      expect(result.content[0].markdown).toContain(
        '*Evidence needed*: Third-party market research'
      );
    });

    it('should handle missing financial inputs gracefully', async () => {
      const args: GenerateBusinessCaseArgs = {
        opportunity_analysis: 'Basic opportunity analysis without detailed financial data.',
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].markdown).toContain('Business Case');
      expect(result.metadata?.confidenceScore).toBe(78);
    });

    it('should handle mechanism service failures gracefully', async () => {
      // Mock a service failure
      const { AssumptionLedgerService } = require('../../services/amazon');
      const mockService = new AssumptionLedgerService();
      mockService.normalizeLedger.mockResolvedValue({
        success: false,
        error: { message: 'Service unavailable' },
      });

      const args: GenerateBusinessCaseArgs = {
        opportunity_analysis: 'Test opportunity analysis',
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json?.message).toContain('Assumption ledger generation failed');
    });
  });

  describe('create_stakeholder_communication handler', () => {
    const baseBusinesCase = `# Business Case: Test Feature

## Executive Summary
Comprehensive business case for Test Feature targeting enterprise customers.

## Market Analysis
Feature: Test Feature
Customer: Enterprise customers
Market Size: $1B
Development Cost: $500K
Revenue: $1M
Timeline: 12 months

## Assumptions
We assume 10% market penetration is achievable.
We believe customers will pay $10K annually.
We expect minimal competitive response.`;

    it('should route to PR/FAQ template correctly', async () => {
      const args: CreateStakeholderCommunicationArgs = {
        business_case: baseBusinesCase,
        communication_type: 'pr_faq',
        audience: 'customers',
        steering_options: {
          create_steering_files: true,
          feature_name: 'test-feature',
        },
      };

      const result = await createStakeholderCommunication(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].markdown).toContain('# Press Release');
      expect(result.content[0].markdown).toContain('# FAQ');
      expect(result.content[0].markdown).toContain('# Launch Checklist');
      expect(result.content[0].markdown).toContain(
        '## Amazon Working Backwards Evidence Mechanisms'
      );
      expect(result.metadata?.confidenceScore).toBe(78);
    });

    it('should route to Decision One-Pager template correctly', async () => {
      const args: CreateStakeholderCommunicationArgs = {
        business_case: baseBusinesCase,
        communication_type: 'executive_onepager',
        audience: 'executives',
      };

      const result = await createStakeholderCommunication(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].markdown).toContain('# Decision One-Pager: Test Feature');
      expect(result.content[0].markdown).toContain('## Context');
      expect(result.content[0].markdown).toContain('## Options');
      expect(result.content[0].markdown).toContain('## Recommendation');
      expect(result.content[0].markdown).toContain(
        '## Amazon Working Backwards Evidence Mechanisms'
      );
    });

    it('should generate Board Presentation correctly', async () => {
      const args: CreateStakeholderCommunicationArgs = {
        business_case: baseBusinesCase,
        communication_type: 'board_presentation',
        audience: 'board',
      };

      const result = await createStakeholderCommunication(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].markdown).toContain('# Board Presentation: Test Feature');
      expect(result.content[0].markdown).toContain('## Executive Summary');
      expect(result.content[0].markdown).toContain('**Recommendation**: PROCEED');
      expect(result.content[0].markdown).toContain('## Market Opportunity');
      expect(result.content[0].markdown).toContain('## Financial Projections');
      expect(result.content[0].markdown).toContain('## Risk Assessment');
    });

    it('should generate Team Announcement correctly', async () => {
      const args: CreateStakeholderCommunicationArgs = {
        business_case: baseBusinesCase,
        communication_type: 'team_announcement',
        audience: 'engineering_team',
      };

      const result = await createStakeholderCommunication(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].markdown).toContain('# Team Announcement: Test Feature');
      expect(result.content[0].markdown).toContain("## What We're Building");
      expect(result.content[0].markdown).toContain('## Why Now');
      expect(result.content[0].markdown).toContain('## What Success Looks Like');
      expect(result.content[0].markdown).toContain("## How We'll Execute");
    });

    it('should maintain API compatibility', async () => {
      const args: CreateStakeholderCommunicationArgs = {
        business_case: baseBusinesCase,
        communication_type: 'pr_faq',
        audience: 'customers',
      };

      const result = await createStakeholderCommunication(args, mockContext);

      // Verify API contract is maintained
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('metadata');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]).toHaveProperty('type');
      expect(result.content[0]).toHaveProperty('markdown');
    });

    it('should handle unsupported communication type', async () => {
      const args = {
        business_case: baseBusinesCase,
        communication_type: 'unsupported_type' as any,
        audience: 'customers' as any,
      };

      const result = await createStakeholderCommunication(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json?.message).toContain('Unsupported communication type');
    });

    it('should include steering write-through functionality', async () => {
      const args: CreateStakeholderCommunicationArgs = {
        business_case: baseBusinesCase,
        communication_type: 'pr_faq',
        audience: 'customers',
        steering_options: {
          create_steering_files: true,
          feature_name: 'test-feature',
          inclusion_rule: 'manual',
        },
      };

      const result = await createStakeholderCommunication(args, mockContext);

      expect(result.metadata?.steeringFileCreated).toBe(true);
      expect(result.metadata?.steeringFiles).toHaveLength(1);
      expect(result.metadata?.steeringFiles?.[0]).toEqual({
        filename: 'business-case-abc123.md',
        action: 'created',
        fullPath: '.kiro/steering/working-backwards/business-case/business-case-abc123.md',
      });
    });
  });

  describe('Integration with existing handlers', () => {
    it('should not break existing API contracts', async () => {
      // Test that new handlers don't interfere with existing functionality
      const businessCaseArgs: GenerateBusinessCaseArgs = {
        opportunity_analysis: 'Test analysis',
      };

      const communicationArgs: CreateStakeholderCommunicationArgs = {
        business_case: 'Test business case',
        communication_type: 'pr_faq',
        audience: 'customers',
      };

      const [businessResult, communicationResult] = await Promise.all([
        generateBusinessCase(businessCaseArgs, mockContext),
        createStakeholderCommunication(communicationArgs, mockContext),
      ]);

      // Both should succeed without interference
      expect(businessResult.isError).toBeFalsy();
      expect(communicationResult.isError).toBeFalsy();

      // Both should have required metadata
      expect(businessResult.metadata?.confidenceScore).toBeDefined();
      expect(communicationResult.metadata?.confidenceScore).toBeDefined();
    });

    it('should handle concurrent mechanism service calls', async () => {
      const args1: GenerateBusinessCaseArgs = {
        opportunity_analysis: 'Analysis 1',
      };

      const args2: GenerateBusinessCaseArgs = {
        opportunity_analysis: 'Analysis 2',
      };

      // Run multiple handlers concurrently
      const results = await Promise.all([
        generateBusinessCase(args1, { ...mockContext, sessionId: 'session-1' }),
        generateBusinessCase(args2, { ...mockContext, sessionId: 'session-2' }),
      ]);

      results.forEach(result => {
        expect(result.isError).toBeFalsy();
        expect(result.metadata?.confidenceScore).toBeDefined();
      });
    });
  });

  describe('Error handling and graceful degradation', () => {
    it('should provide meaningful error messages when mechanisms fail', async () => {
      // Mock all services to fail
      const { AssumptionLedgerService } = require('../../services/amazon');
      const mockService = new AssumptionLedgerService();
      mockService.normalizeLedger.mockResolvedValue({
        success: false,
        error: { message: 'Service failure' },
      });

      const args: GenerateBusinessCaseArgs = {
        opportunity_analysis: 'Test analysis',
      };

      const result = await generateBusinessCase(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json?.message).toContain('failed');
      expect(result.content[0].json?.message).not.toContain('Unknown error');
    });

    it('should handle steering write failures gracefully', async () => {
      const { SteeringWriter } = require('../../services/amazon');
      const mockWriter = new SteeringWriter();
      mockWriter.writeSteering.mockRejectedValue(new Error('Steering write failed'));

      const args: GenerateBusinessCaseArgs = {
        opportunity_analysis: 'Test analysis',
        steering_options: {
          create_steering_files: true,
          feature_name: 'test',
        },
      };

      const result = await generateBusinessCase(args, mockContext);

      // Should still succeed even if steering write fails
      expect(result.isError).toBeFalsy();
      expect(result.metadata?.steeringFileCreated).toBe(false);
    });
  });
});
