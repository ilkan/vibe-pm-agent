// Unit tests for Business Analyzer component

import { BusinessAnalyzer } from '../../components/business-analyzer';
import { ParsedIntent, Workflow, WorkflowStep, Optimization, OptionalParams } from '../../models';

describe('BusinessAnalyzer', () => {
  let analyzer: BusinessAnalyzer;
  
  beforeEach(() => {
    analyzer = new BusinessAnalyzer();
  });

  describe('selectTechniques', () => {
    it('should always include MECE and OptionFraming techniques', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Simple data processing',
        technicalRequirements: [{
          type: 'data_retrieval',
          description: 'Get user data',
          complexity: 'low',
          quotaImpact: 'minimal'
        }],
        dataSourcesNeeded: ['users'],
        operationsRequired: [{
          id: '1',
          type: 'data_retrieval',
          description: 'Fetch user data',
          estimatedQuotaCost: 10
        }],
        potentialRisks: []
      };

      const techniques = analyzer.selectTechniques(intent);
      
      expect(techniques).toHaveLength(3);
      expect(techniques.some(t => t.name === 'MECE')).toBe(true);
      expect(techniques.some(t => t.name === 'OptionFraming')).toBe(true);
      expect(techniques.every(t => t.relevanceScore > 0)).toBe(true);
    });

    it('should select ValueDriverTree for complex workflows', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Complex data analysis pipeline',
        technicalRequirements: Array(6).fill(null).map((_, i) => ({
          type: 'processing' as const,
          description: `Processing step ${i}`,
          complexity: 'high' as const,
          quotaImpact: 'significant' as const
        })),
        dataSourcesNeeded: ['db1', 'db2', 'api1'],
        operationsRequired: Array(8).fill(null).map((_, i) => ({
          id: `op-${i}`,
          type: 'vibe' as const,
          description: `Operation ${i}`,
          estimatedQuotaCost: 50
        })),
        potentialRisks: [
          {
            type: 'excessive_loops',
            severity: 'high',
            description: 'Multiple nested loops',
            likelihood: 0.8
          },
          {
            type: 'redundant_query',
            severity: 'medium',
            description: 'Redundant queries',
            likelihood: 0.6
          }
        ]
      };

      const techniques = analyzer.selectTechniques(intent);
      
      expect(techniques.some(t => t.name === 'ValueDriverTree')).toBe(true);
      expect(techniques.some(t => t.name === 'ZeroBased')).toBe(true);
    });

    it('should return techniques sorted by relevance score', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Test workflow',
        technicalRequirements: [],
        dataSourcesNeeded: [],
        operationsRequired: [],
        potentialRisks: []
      };

      const techniques = analyzer.selectTechniques(intent);
      
      for (let i = 1; i < techniques.length; i++) {
        expect(techniques[i-1].relevanceScore).toBeGreaterThanOrEqual(techniques[i].relevanceScore);
      }
    });

    it('should boost Zero-Based Design relevance for tight cost constraints', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Data processing system',
        technicalRequirements: [],
        dataSourcesNeeded: [],
        operationsRequired: [],
        potentialRisks: []
      };

      const tightConstraintsParams: OptionalParams = {
        costConstraints: {
          maxVibes: 5,
          maxCostDollars: 3
        }
      };

      const techniquesWithConstraints = analyzer.selectTechniques(intent, tightConstraintsParams);
      const techniquesWithoutConstraints = analyzer.selectTechniques(intent);

      const zeroBasedWithConstraints = techniquesWithConstraints.find(t => t.name === 'ZeroBased');
      const zeroBasedWithoutConstraints = techniquesWithoutConstraints.find(t => t.name === 'ZeroBased');

      if (zeroBasedWithConstraints && zeroBasedWithoutConstraints) {
        expect(zeroBasedWithConstraints.relevanceScore).toBeGreaterThan(zeroBasedWithoutConstraints.relevanceScore);
      }
    });

    it('should boost Impact vs Effort Matrix for high user volume', () => {
      const intent: ParsedIntent = {
        businessObjective: 'User management system',
        technicalRequirements: [],
        dataSourcesNeeded: [],
        operationsRequired: Array(5).fill(null).map((_, i) => ({
          id: `op-${i}`,
          type: 'processing' as const,
          description: `Operation ${i}`,
          estimatedQuotaCost: 20
        })),
        potentialRisks: []
      };

      const highVolumeParams: OptionalParams = {
        expectedUserVolume: 5000
      };

      const techniquesWithVolume = analyzer.selectTechniques(intent, highVolumeParams);
      const techniquesWithoutVolume = analyzer.selectTechniques(intent);

      const impactEffortWithVolume = techniquesWithVolume.find(t => t.name === 'ImpactEffort');
      const impactEffortWithoutVolume = techniquesWithoutVolume.find(t => t.name === 'ImpactEffort');

      if (impactEffortWithVolume && impactEffortWithoutVolume) {
        expect(impactEffortWithVolume.relevanceScore).toBeGreaterThan(impactEffortWithoutVolume.relevanceScore);
      }
    });
  });

  describe('applyMECE', () => {
    it('should categorize workflow steps into mutually exclusive categories', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Generate analysis',
            inputs: [],
            outputs: ['analysis'],
            quotaCost: 100
          },
          {
            id: 'step2',
            type: 'data_retrieval',
            description: 'Fetch user data',
            inputs: [],
            outputs: ['userData'],
            quotaCost: 50
          },
          {
            id: 'step3',
            type: 'spec',
            description: 'Process data',
            inputs: ['userData'],
            outputs: ['processedData'],
            quotaCost: 25
          }
        ],
        dataFlow: [],
        estimatedComplexity: 5
      };

      const analysis = analyzer.applyMECE(workflow);
      
      expect(analysis.categories).toHaveLength(3);
      expect(analysis.categories.some(cat => cat.name === 'Vibe Operations')).toBe(true);
      expect(analysis.categories.some(cat => cat.name === 'Data Retrieval')).toBe(true);
      expect(analysis.categories.some(cat => cat.name === 'Spec Operations')).toBe(true);
      expect(analysis.totalCoverage).toBe(100);
    });

    it('should calculate quota impact correctly for each category', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Analysis 1',
            inputs: [],
            outputs: [],
            quotaCost: 100
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Analysis 2',
            inputs: [],
            outputs: [],
            quotaCost: 150
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const analysis = analyzer.applyMECE(workflow);
      const vibeCategory = analysis.categories.find(cat => cat.name === 'Vibe Operations');
      
      expect(vibeCategory).toBeDefined();
      expect(vibeCategory!.quotaImpact).toBe(250);
      expect(vibeCategory!.drivers).toHaveLength(2);
      expect(vibeCategory!.optimizationPotential).toBeGreaterThan(0);
    });

    it('should identify optimization potential based on step types', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Vibe operation',
            inputs: [],
            outputs: [],
            quotaCost: 100
          },
          {
            id: 'step2',
            type: 'analysis',
            description: 'Analysis operation',
            inputs: [],
            outputs: [],
            quotaCost: 50
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const analysis = analyzer.applyMECE(workflow);
      const vibeCategory = analysis.categories.find(cat => cat.name === 'Vibe Operations');
      const analysisCategory = analysis.categories.find(cat => cat.name === 'Analysis Operations');
      
      expect(vibeCategory!.optimizationPotential).toBeGreaterThan(analysisCategory!.optimizationPotential);
    });
  });

  describe('applyValueDriverTree', () => {
    it('should identify primary and secondary value drivers', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'High cost vibe',
            inputs: [],
            outputs: [],
            quotaCost: 200 // High cost - should be primary driver
          },
          {
            id: 'step2',
            type: 'spec',
            description: 'Low cost spec',
            inputs: [],
            outputs: [],
            quotaCost: 20 // Low cost - should be secondary driver
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const analysis = analyzer.applyValueDriverTree(workflow);
      
      expect(analysis.primaryDrivers.length).toBeGreaterThan(0);
      expect(analysis.primaryDrivers[0].currentCost).toBeGreaterThan(analysis.secondaryDrivers[0]?.currentCost || 0);
      expect(analysis.primaryDrivers.every(driver => driver.savingsPotential > 0)).toBe(true);
    });

    it('should calculate savings potential correctly', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Vibe operation',
            inputs: [],
            outputs: [],
            quotaCost: 100
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const analysis = analyzer.applyValueDriverTree(workflow);
      const vibeDriver = analysis.primaryDrivers.find(driver => driver.name.includes('Vibe'));
      
      expect(vibeDriver).toBeDefined();
      expect(vibeDriver!.savingsPotential).toBeGreaterThan(0);
      expect(vibeDriver!.optimizedCost).toBeLessThan(vibeDriver!.currentCost);
    });

    it('should identify root causes for inefficiencies', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: Array(10).fill(null).map((_, i) => ({
          id: `step${i}`,
          type: 'vibe',
          description: `Vibe ${i}`,
          inputs: [],
          outputs: [],
          quotaCost: 50
        })),
        dataFlow: Array(15).fill(null).map((_, i) => ({
          from: `step${i % 10}`,
          to: `step${(i + 1) % 10}`,
          dataType: 'data',
          required: true
        })),
        estimatedComplexity: 9
      };

      const analysis = analyzer.applyValueDriverTree(workflow);
      
      expect(analysis.rootCauses.length).toBeGreaterThan(0);
      expect(analysis.rootCauses.some(cause => cause.includes('vibe operations'))).toBe(true);
    });
  });

  describe('applyZeroBasedDesign', () => {
    it('should challenge assumptions and propose radical approaches', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Complex data processing',
        technicalRequirements: [{
          type: 'processing',
          description: 'Complex processing',
          complexity: 'high',
          quotaImpact: 'significant'
        }],
        dataSourcesNeeded: ['db1', 'db2', 'api1', 'api2'],
        operationsRequired: [{
          id: '1',
          type: 'vibe',
          description: 'Complex analysis',
          estimatedQuotaCost: 200
        }],
        potentialRisks: [
          {
            type: 'excessive_loops',
            severity: 'high',
            description: 'Multiple loops',
            likelihood: 0.8
          },
          {
            type: 'redundant_query',
            severity: 'medium',
            description: 'Redundant queries',
            likelihood: 0.6
          },
          {
            type: 'unnecessary_vibes',
            severity: 'high',
            description: 'Too many vibes',
            likelihood: 0.9
          }
        ]
      };

      const solution = analyzer.applyZeroBasedDesign(intent);
      
      expect(solution.assumptionsChallenged.length).toBeGreaterThan(0);
      expect(solution.radicalApproach).toBeTruthy();
      expect(solution.potentialSavings).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(solution.implementationRisk);
    });

    it('should provide conservative approach when no major issues found', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Simple task',
        technicalRequirements: [],
        dataSourcesNeeded: [],
        operationsRequired: [],
        potentialRisks: []
      };

      const solution = analyzer.applyZeroBasedDesign(intent);
      
      expect(solution.implementationRisk).toBe('low');
      expect(solution.potentialSavings).toBeLessThan(50);
      expect(solution.assumptionsChallenged.length).toBe(1);
    });
  });

  describe('applyImpactEffortMatrix', () => {
    it('should categorize optimizations into impact/effort matrix', () => {
      const optimizations: Optimization[] = [
        {
          type: 'caching',
          description: 'Add caching layer',
          stepsAffected: ['step1'],
          estimatedSavings: { vibes: 50, specs: 0, percentage: 40 }
        },
        {
          type: 'decomposition',
          description: 'Break into smaller specs',
          stepsAffected: ['step1', 'step2', 'step3'],
          estimatedSavings: { vibes: 100, specs: 20, percentage: 60 }
        },
        {
          type: 'batching',
          description: 'Batch similar operations',
          stepsAffected: ['step1', 'step2'],
          estimatedSavings: { vibes: 20, specs: 5, percentage: 25 }
        }
      ];

      const matrix = analyzer.applyImpactEffortMatrix(optimizations);
      
      expect(matrix.highImpactLowEffort.length + matrix.highImpactHighEffort.length).toBeGreaterThan(0);
      expect(matrix.lowImpactLowEffort.length + matrix.lowImpactHighEffort.length).toBeGreaterThan(0);
      
      // Caching should be low effort
      const cachingOption = [...matrix.highImpactLowEffort, ...matrix.lowImpactLowEffort]
        .find(opt => opt.name === 'caching');
      expect(cachingOption).toBeDefined();
      
      // Decomposition should be high effort
      const decompositionOption = [...matrix.highImpactHighEffort, ...matrix.lowImpactHighEffort]
        .find(opt => opt.name === 'decomposition');
      expect(decompositionOption).toBeDefined();
      
      // Batching should be low impact (25% < 30% threshold)
      const batchingOption = [...matrix.lowImpactLowEffort, ...matrix.lowImpactHighEffort]
        .find(opt => opt.name === 'batching');
      expect(batchingOption).toBeDefined();
    });
  });

  describe('applyValuePropositionCanvas', () => {
    it('should extract user jobs from business objective', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Automate customer data analysis',
        technicalRequirements: [{
          type: 'analysis',
          description: 'Analyze customer behavior',
          complexity: 'medium',
          quotaImpact: 'moderate'
        }],
        dataSourcesNeeded: ['customers', 'transactions'],
        operationsRequired: [],
        potentialRisks: []
      };

      const canvas = analyzer.applyValuePropositionCanvas(intent);
      
      expect(canvas.userJobs).toContain('Automate customer data analysis');
      expect(canvas.userJobs.some(job => job.includes('analysis'))).toBe(true);
      expect(canvas.valuePropositionStatement).toContain('automate customer data analysis');
    });

    it('should identify pain points from risks', () => {
      const intent: ParsedIntent = {
        businessObjective: 'Process data',
        technicalRequirements: [],
        dataSourcesNeeded: ['db1', 'db2', 'api1'],
        operationsRequired: Array(8).fill(null).map((_, i) => ({
          id: `op${i}`,
          type: 'vibe',
          description: `Operation ${i}`,
          estimatedQuotaCost: 50
        })),
        potentialRisks: [{
          type: 'excessive_loops',
          severity: 'high',
          description: 'Too many loops',
          likelihood: 0.8
        }]
      };

      const canvas = analyzer.applyValuePropositionCanvas(intent);
      
      expect(canvas.painPoints.some(pain => pain.includes('Too many loops'))).toBe(true);
      expect(canvas.painPoints.some(pain => pain.includes('complex workflow'))).toBe(true);
      expect(canvas.painPoints.some(pain => pain.includes('multiple sources'))).toBe(true);
    });
  });

  describe('generateOptionFraming', () => {
    it('should generate three distinct optimization options', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Analysis',
            inputs: [],
            outputs: [],
            quotaCost: 100
          },
          {
            id: 'step2',
            type: 'data_retrieval',
            description: 'Data fetch',
            inputs: [],
            outputs: [],
            quotaCost: 50
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const options = analyzer.generateOptionFraming(workflow);
      
      expect(options.conservative.implementationEffort).toBe('low');
      expect(options.conservative.riskLevel).toBe('low');
      expect(options.balanced.implementationEffort).toBe('medium');
      expect(options.balanced.riskLevel).toBe('medium');
      expect(options.bold.implementationEffort).toBe('high');
      expect(options.bold.riskLevel).toBe('high');
      
      expect(options.conservative.quotaSavings).toBeLessThan(options.balanced.quotaSavings);
      expect(options.balanced.quotaSavings).toBeLessThan(options.bold.quotaSavings);
    });

    it('should calculate ROI for each option', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [{
          id: 'step1',
          type: 'vibe',
          description: 'Test',
          inputs: [],
          outputs: [],
          quotaCost: 200
        }],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const options = analyzer.generateOptionFraming(workflow);
      
      expect(options.conservative.estimatedROI).toBeGreaterThan(0);
      expect(options.balanced.estimatedROI).toBeGreaterThan(0);
      expect(options.bold.estimatedROI).toBeGreaterThan(0);
    });

    it('should adjust option savings for tight cost constraints', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [{
          id: 'step1',
          type: 'vibe',
          description: 'Test',
          inputs: [],
          outputs: [],
          quotaCost: 100
        }],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const tightConstraintsParams: OptionalParams = {
        costConstraints: {
          maxVibes: 10,
          maxCostDollars: 5
        }
      };

      const optionsWithConstraints = analyzer.generateOptionFraming(workflow, tightConstraintsParams);
      const optionsWithoutConstraints = analyzer.generateOptionFraming(workflow);

      expect(optionsWithConstraints.conservative.quotaSavings).toBeGreaterThan(optionsWithoutConstraints.conservative.quotaSavings);
      expect(optionsWithConstraints.conservative.description).toContain('cost reduction');
    });

    it('should adjust implementation effort for performance sensitivity', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [{
          id: 'step1',
          type: 'vibe',
          description: 'Test',
          inputs: [],
          outputs: [],
          quotaCost: 100
        }],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const highPerfParams: OptionalParams = {
        performanceSensitivity: 'high'
      };

      const lowPerfParams: OptionalParams = {
        performanceSensitivity: 'low'
      };

      const highPerfOptions = analyzer.generateOptionFraming(workflow, highPerfParams);
      const lowPerfOptions = analyzer.generateOptionFraming(workflow, lowPerfParams);

      expect(highPerfOptions.balanced.implementationEffort).toBe('high');
      expect(lowPerfOptions.conservative.implementationEffort).toBe('low');
      expect(highPerfOptions.balanced.description).toContain('performance optimization');
      expect(lowPerfOptions.conservative.description).toContain('minimal complexity');
    });
  });
});