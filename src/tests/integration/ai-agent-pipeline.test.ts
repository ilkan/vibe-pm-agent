// Integration tests for AI Agent Pipeline orchestration

import { AIAgentPipeline } from '../../main';
import { OptionalParams } from '../../models';

describe('AIAgentPipeline Integration Tests', () => {
  let pipeline: AIAgentPipeline;

  beforeEach(() => {
    pipeline = new AIAgentPipeline();
  });

  describe('processIntent', () => {
    it('should process simple intent and return enhanced Kiro spec', async () => {
      const intent = 'Create a user authentication system that validates credentials and manages sessions';
      
      const result = await pipeline.processIntent(intent);
      
      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      expect(result.enhancedKiroSpec?.consultingSummary).toBeDefined();
      expect(result.enhancedKiroSpec?.roiAnalysis).toBeDefined();
      expect(result.enhancedKiroSpec?.alternativeOptions).toBeDefined();
      expect(result.efficiencySummary).toBeDefined();
    });

    it('should process complex intent with multiple operations', async () => {
      const intent = 'Build a data processing pipeline that fetches user data from multiple APIs, validates it, transforms it, and stores it in a database with caching';
      
      const result = await pipeline.processIntent(intent);
      
      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      
      // Check that consulting techniques were applied
      const consultingSummary = result.enhancedKiroSpec?.consultingSummary;
      expect(consultingSummary?.techniquesApplied).toBeDefined();
      expect(consultingSummary?.techniquesApplied.length).toBeGreaterThan(0);
      
      // Check that ROI analysis includes multiple scenarios
      const roiAnalysis = result.enhancedKiroSpec?.roiAnalysis;
      expect(roiAnalysis?.scenarios).toBeDefined();
      expect(roiAnalysis?.scenarios.length).toBeGreaterThanOrEqual(2);
    });

    it('should process intent with optional parameters', async () => {
      const intent = 'Create a reporting system that generates monthly sales reports';
      const params: OptionalParams = {
        expectedUserVolume: 1000,
        costConstraints: {
          maxVibes: 50,
          maxSpecs: 10,
          maxCostDollars: 25
        },
        performanceSensitivity: 'high'
      };
      
      const result = await pipeline.processIntent(intent, params);
      
      expect(result.success).toBe(true);
      expect(result.enhancedKiroSpec).toBeDefined();
      
      // Check that parameters influenced the analysis
      const consultingSummary = result.enhancedKiroSpec?.consultingSummary;
      expect(consultingSummary?.keyFindings.some(finding => 
        finding.includes('cost') || finding.includes('performance')
      )).toBe(true);
    });

    it('should handle workflow analysis for existing workflows', async () => {
      const workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe' as const,
            description: 'Analyze user input',
            inputs: ['user_input'],
            outputs: ['analysis_result'],
            quotaCost: 15
          },
          {
            id: 'step2',
            type: 'data_retrieval' as const,
            description: 'Fetch user profile',
            inputs: ['user_id'],
            outputs: ['user_profile'],
            quotaCost: 8
          },
          {
            id: 'step3',
            type: 'vibe' as const,
            description: 'Generate recommendation',
            inputs: ['analysis_result', 'user_profile'],
            outputs: ['recommendation'],
            quotaCost: 12
          }
        ],
        dataFlow: [
          { from: 'step1', to: 'step3', dataType: 'analysis_result', required: true },
          { from: 'step2', to: 'step3', dataType: 'user_profile', required: true }
        ],
        estimatedComplexity: 6
      };

      const analysis = await pipeline.analyzeWorkflow(workflow);
      
      expect(analysis).toBeDefined();
      expect(analysis.techniquesUsed).toBeDefined();
      expect(analysis.techniquesUsed.length).toBeGreaterThan(0);
      expect(analysis.keyFindings).toBeDefined();
      expect(analysis.totalQuotaSavings).toBeGreaterThan(0);
    });

    it('should generate ROI analysis for workflow comparison', async () => {
      const workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe' as const,
            description: 'Process data',
            inputs: [],
            outputs: ['result'],
            quotaCost: 20
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const roiAnalysis = await pipeline.generateROIAnalysis(workflow);
      
      expect(roiAnalysis).toBeDefined();
      expect(roiAnalysis.scenarios).toBeDefined();
      expect(roiAnalysis.scenarios.length).toBeGreaterThanOrEqual(2);
      expect(roiAnalysis.recommendations).toBeDefined();
      expect(roiAnalysis.bestOption).toBeDefined();
    });

    it('should generate consulting summary from analysis', async () => {
      const mockAnalysis = {
        techniquesUsed: [
          { name: 'MECE' as const, relevanceScore: 0.9, applicableScenarios: ['quota optimization'] },
          { name: 'ValueDriverTree' as const, relevanceScore: 0.8, applicableScenarios: ['cost analysis'] }
        ],
        keyFindings: ['High optimization potential identified', 'Multiple cost drivers found'],
        totalQuotaSavings: 45,
        implementationComplexity: 'medium' as const,
        meceAnalysis: {
          categories: [
            { name: 'Vibe Operations', drivers: ['analysis', 'processing'], quotaImpact: 30, optimizationPotential: 60 }
          ],
          totalCoverage: 95,
          overlaps: []
        }
      };

      const summary = await pipeline.generateConsultingSummary(mockAnalysis);
      
      expect(summary).toBeDefined();
      expect(summary.executiveSummary).toBeDefined();
      expect(summary.keyFindings).toBeDefined();
      expect(summary.recommendations).toBeDefined();
      expect(summary.techniquesApplied).toBeDefined();
      expect(summary.techniquesApplied.length).toBe(2);
    });

    it('should handle pipeline errors gracefully', async () => {
      const invalidIntent = ''; // Empty intent should cause parsing error
      
      const result = await pipeline.processIntent(invalidIntent);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.stage).toBeDefined();
      expect(result.error?.message).toBeDefined();
      expect(result.error?.suggestedAction).toBeDefined();
    });

    it('should maintain data flow consistency through pipeline stages', async () => {
      const intent = 'Create a simple data validation workflow';
      
      const result = await pipeline.processIntent(intent);
      
      expect(result.success).toBe(true);
      
      // Verify that the enhanced spec contains all required components
      const spec = result.enhancedKiroSpec!;
      expect(spec.name).toBeDefined();
      expect(spec.description).toBeDefined();
      expect(spec.requirements).toBeDefined();
      expect(spec.design).toBeDefined();
      expect(spec.tasks).toBeDefined();
      expect(spec.metadata).toBeDefined();
      
      // Verify consulting analysis integration
      expect(spec.consultingSummary.techniquesApplied.length).toBeGreaterThan(0);
      expect(spec.roiAnalysis.scenarios.length).toBeGreaterThan(0);
      expect(spec.alternativeOptions.conservative).toBeDefined();
      expect(spec.alternativeOptions.balanced).toBeDefined();
      expect(spec.alternativeOptions.bold).toBeDefined();
    });

    it('should apply different consulting techniques based on intent complexity', async () => {
      const simpleIntent = 'Validate user email';
      const complexIntent = 'Build a comprehensive user management system with authentication, authorization, profile management, and audit logging';
      
      const simpleResult = await pipeline.processIntent(simpleIntent);
      const complexResult = await pipeline.processIntent(complexIntent);
      
      expect(simpleResult.success).toBe(true);
      expect(complexResult.success).toBe(true);
      
      // Complex intent should trigger more techniques
      const simpleTechniques = simpleResult.enhancedKiroSpec?.consultingSummary.techniquesApplied.length || 0;
      const complexTechniques = complexResult.enhancedKiroSpec?.consultingSummary.techniquesApplied.length || 0;
      
      expect(complexTechniques).toBeGreaterThanOrEqual(simpleTechniques);
      
      // Complex intent should have higher potential savings
      const simpleSavings = simpleResult.efficiencySummary?.savings.totalSavingsPercentage || 0;
      const complexSavings = complexResult.efficiencySummary?.savings.totalSavingsPercentage || 0;
      
      expect(complexSavings).toBeGreaterThanOrEqual(simpleSavings);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle intent parsing failures', async () => {
      const malformedIntent = 'asdf qwerty 123 !@#'; // Nonsensical input
      
      const result = await pipeline.processIntent(malformedIntent);
      
      expect(result.success).toBe(false);
      expect(result.error?.stage).toBe('intent');
      expect(result.error?.suggestedAction).toBeDefined();
    });

    it('should handle business analysis failures', async () => {
      // Mock a scenario where business analysis might fail
      const edgeCaseIntent = 'Do something with nothing using everything';
      
      const result = await pipeline.processIntent(edgeCaseIntent);
      
      // Should either succeed with basic analysis or fail gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error?.suggestedAction).toBeDefined();
      } else {
        expect(result.enhancedKiroSpec).toBeDefined();
      }
    });

    it('should provide meaningful error messages', async () => {
      const result = await pipeline.processIntent('');
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
      expect(result.error?.message.length).toBeGreaterThan(0);
      expect(result.error?.suggestedAction).toBeDefined();
      expect(result.error?.suggestedAction.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should complete processing within reasonable time', async () => {
      const intent = 'Create a user registration system';
      const startTime = Date.now();
      
      const result = await pipeline.processIntent(intent);
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent requests', async () => {
      const intents = [
        'Create user authentication',
        'Build data processing pipeline',
        'Generate reports system'
      ];
      
      const promises = intents.map(intent => pipeline.processIntent(intent));
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.enhancedKiroSpec).toBeDefined();
      });
    });
  });
});