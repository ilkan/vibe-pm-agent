// Integration tests for PM Document Generator integration with AI Agent Pipeline
// Tests combined optimization and PM document workflows

import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { OptionalParams } from '../../models/intent';

describe('PM Document Pipeline Integration', () => {
  let pipeline: AIAgentPipeline;

  beforeEach(() => {
    pipeline = new AIAgentPipeline();
  });

  describe('processIntent with PM document generation', () => {
    it('should generate all PM documents when requested', async () => {
      const rawIntent = 'Create a user authentication system with OAuth integration and role-based access control';
      const params: OptionalParams = {
        expectedUserVolume: 1000,
        costConstraints: {
          maxVibes: 50,
          maxSpecs: 20,
          maxCostDollars: 100
        },
        performanceSensitivity: 'medium',
        generatePMDocuments: {
          managementOnePager: true,
          prfaq: true,
          requirements: true,
          designOptions: true,
          taskPlan: true,
          targetDate: '2024-06-01',
          context: {
            roadmapTheme: 'Security Enhancement',
            budget: 50000,
            deadlines: 'Q2 2024'
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      expect(result.consultingSummary).toBeDefined();
      expect(result.roiAnalysis).toBeDefined();
      expect(result.pmDocuments).toBeDefined();

      // Verify all requested PM documents were generated
      expect(result.pmDocuments!.requirements).toBeDefined();
      expect(result.pmDocuments!.designOptions).toBeDefined();
      expect(result.pmDocuments!.taskPlan).toBeDefined();
      expect(result.pmDocuments!.managementOnePager).toBeDefined();
      expect(result.pmDocuments!.prfaq).toBeDefined();

      // Verify PM document structure
      expect(result.pmDocuments!.prfaq!.pressRelease).toContain('**2024-06-01**');
      expect(result.pmDocuments!.prfaq!.faq).toContain('Q1:');
      expect(result.pmDocuments!.prfaq!.launchChecklist).toContain('- [ ]');

      expect(result.pmDocuments!.managementOnePager).toContain('# Management One-Pager');
      expect(result.pmDocuments!.managementOnePager).toContain('## Answer');
      expect(result.pmDocuments!.managementOnePager).toContain('## ROI Snapshot');

      // Verify metadata includes PM document generation
      expect(result.metadata!.quotaUsed).toBeGreaterThan(7); // Base pipeline + PM documents
    }, 30000);

    it('should generate partial PM documents when some fail', async () => {
      const rawIntent = 'Simple data processing workflow';
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          designOptions: true,
          managementOnePager: true,
          // Intentionally missing dependencies for some documents
          context: {
            roadmapTheme: 'Data Processing',
            budget: 10000
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeDefined();
      expect(result.pmDocuments!.requirements).toBeDefined();
      expect(result.pmDocuments!.designOptions).toBeDefined();
    }, 20000);

    it('should work without PM document generation', async () => {
      const rawIntent = 'Create a simple API endpoint for user data';
      const params: OptionalParams = {
        expectedUserVolume: 100,
        performanceSensitivity: 'low'
        // No generatePMDocuments specified
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      expect(result.consultingSummary).toBeDefined();
      expect(result.roiAnalysis).toBeDefined();
      expect(result.pmDocuments).toBeUndefined();
    }, 15000);

    it('should generate only requested PM documents', async () => {
      const rawIntent = 'Build a notification system with email and SMS support';
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          managementOnePager: true,
          // Only request specific documents
          context: {
            roadmapTheme: 'Communication Enhancement',
            budget: 25000
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeDefined();
      expect(result.pmDocuments!.requirements).toBeDefined();
      expect(result.pmDocuments!.managementOnePager).toBeDefined();
      
      // Should not generate unrequested documents
      expect(result.pmDocuments!.prfaq).toBeUndefined();
      expect(result.pmDocuments!.designOptions).toBeUndefined();
      expect(result.pmDocuments!.taskPlan).toBeUndefined();
    }, 20000);
  });

  describe('PM document dependency handling', () => {
    it('should handle document dependencies correctly', async () => {
      const rawIntent = 'Create a file upload service with virus scanning';
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          designOptions: true,
          taskPlan: true,
          managementOnePager: true,
          context: {
            roadmapTheme: 'Security & Storage',
            budget: 40000
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeDefined();

      // Verify dependency chain: requirements → design options → task plan → management one-pager
      expect(result.pmDocuments!.requirements).toBeDefined();
      expect(result.pmDocuments!.designOptions).toBeDefined();
      expect(result.pmDocuments!.taskPlan).toBeDefined();
      expect(result.pmDocuments!.managementOnePager).toBeDefined();

      // Verify content consistency
      const requirements = result.pmDocuments!.requirements as any;
      const designOptions = result.pmDocuments!.designOptions as any;
      
      expect(requirements.businessGoal).toBeTruthy();
      expect(designOptions.problemFraming).toBeTruthy();
      expect(designOptions.options.conservative).toBeDefined();
      expect(designOptions.options.balanced).toBeDefined();
      expect(designOptions.options.bold).toBeDefined();
    }, 25000);

    it('should skip dependent documents when prerequisites are missing', async () => {
      const rawIntent = 'Simple calculator application';
      const params: OptionalParams = {
        generatePMDocuments: {
          // Request management one-pager without requirements/design
          managementOnePager: true,
          taskPlan: true,
          context: {
            budget: 5000
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeDefined();
      
      // Should not generate documents that require missing prerequisites
      expect(result.pmDocuments!.managementOnePager).toBeUndefined();
      expect(result.pmDocuments!.taskPlan).toBeUndefined();
    }, 15000);
  });

  describe('error handling and recovery', () => {
    it('should handle PM document generation errors gracefully', async () => {
      const rawIntent = ''; // Invalid empty intent
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          managementOnePager: true
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      // Should fail at intent parsing stage, before PM documents
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.stage).toBe('intent');
    }, 10000);

    it('should return partial PM documents on partial failure', async () => {
      const rawIntent = 'Create a basic web scraper';
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          designOptions: true,
          // This should work for the first two documents
          context: {
            roadmapTheme: 'Data Collection'
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.pmDocuments).toBeDefined();
      expect(result.pmDocuments!.requirements).toBeDefined();
    }, 15000);
  });

  describe('performance and caching', () => {
    it('should cache PM document results', async () => {
      const rawIntent = 'Create a task management system';
      const params: OptionalParams = {
        generatePMDocuments: {
          requirements: true,
          designOptions: true,
          context: {
            roadmapTheme: 'Productivity Tools',
            budget: 30000
          }
        }
      };

      // First call
      const startTime1 = Date.now();
      const result1 = await pipeline.processIntent(rawIntent, params);
      const executionTime1 = Date.now() - startTime1;

      expect(result1.success).toBe(true);
      expect(result1.pmDocuments).toBeDefined();

      // Second call with same parameters should be faster (cached)
      const startTime2 = Date.now();
      const result2 = await pipeline.processIntent(rawIntent, params);
      const executionTime2 = Date.now() - startTime2;

      expect(result2.success).toBe(true);
      expect(result2.pmDocuments).toBeDefined();
      
      // Second call should be significantly faster due to caching
      expect(executionTime2).toBeLessThan(executionTime1 * 0.5);
    }, 30000);

    it('should handle quota tracking with PM documents', async () => {
      const rawIntent = 'Build a real-time chat application';
      const params: OptionalParams = {
        costConstraints: {
          maxVibes: 100,
          maxSpecs: 50,
          maxCostDollars: 200
        },
        generatePMDocuments: {
          requirements: true,
          designOptions: true,
          taskPlan: true,
          managementOnePager: true,
          prfaq: true,
          context: {
            roadmapTheme: 'Real-time Communication',
            budget: 75000
          }
        }
      };

      const result = await pipeline.processIntent(rawIntent, params);

      expect(result.success).toBe(true);
      expect(result.metadata!.quotaUsed).toBeGreaterThan(10); // Base pipeline + 5 PM documents
      expect(result.metadata!.quotaUsed).toBeLessThan(20); // Should be reasonable
    }, 25000);
  });
});