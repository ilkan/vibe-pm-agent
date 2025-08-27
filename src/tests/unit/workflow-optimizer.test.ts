import { WorkflowOptimizer } from '../../components/workflow-optimizer';
import { Workflow, WorkflowStep, EfficiencyIssue, Optimization, OptionalParams } from '../../models';

describe('WorkflowOptimizer', () => {
  let optimizer: WorkflowOptimizer;

  beforeEach(() => {
    optimizer = new WorkflowOptimizer();
  });

  describe('identifyOptimizationOpportunities', () => {
    it('should identify caching optimization for redundant queries', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Query user data',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 10
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Query user data again',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 10
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const issues: EfficiencyIssue[] = [
        {
          type: 'redundant_query',
          severity: 'medium',
          description: 'Duplicate user data queries',
          suggestedFix: 'Cache the first query result',
          stepsAffected: ['step1', 'step2']
        }
      ];

      const optimizations = await optimizer.identifyOptimizationOpportunities(workflow, issues);

      expect(optimizations).toHaveLength(1);
      expect(optimizations[0].type).toBe('caching');
      expect(optimizations[0].stepsAffected).toEqual(['step1', 'step2']);
      expect(optimizations[0].estimatedSavings.vibes).toBe(20);
      expect(optimizations[0].estimatedSavings.percentage).toBe(25);
    });

    it('should identify batching optimization for excessive loops', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Process item 1',
            inputs: ['item1'],
            outputs: ['result1'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Process item 2',
            inputs: ['item2'],
            outputs: ['result2'],
            quotaCost: 5
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Process item 3',
            inputs: ['item3'],
            outputs: ['result3'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const issues: EfficiencyIssue[] = [
        {
          type: 'excessive_loops',
          severity: 'high',
          description: 'Multiple similar processing steps in loop',
          suggestedFix: 'Batch process all items together',
          stepsAffected: ['step1', 'step2', 'step3']
        }
      ];

      const optimizations = await optimizer.identifyOptimizationOpportunities(workflow, issues);

      expect(optimizations).toHaveLength(1);
      expect(optimizations[0].type).toBe('batching');
      expect(optimizations[0].stepsAffected).toEqual(['step1', 'step2', 'step3']);
      expect(optimizations[0].estimatedSavings.vibes).toBe(15);
      expect(optimizations[0].estimatedSavings.percentage).toBe(50);
    });

    it('should identify vibe-to-spec conversion for unnecessary vibes', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Validate email format',
            inputs: ['email'],
            outputs: ['isValid'],
            quotaCost: 3
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Validate phone format',
            inputs: ['phone'],
            outputs: ['isValid'],
            quotaCost: 3
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Validate address format',
            inputs: ['address'],
            outputs: ['isValid'],
            quotaCost: 3
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const issues: EfficiencyIssue[] = [
        {
          type: 'unnecessary_vibes',
          severity: 'medium',
          description: 'Simple validation tasks using vibes',
          suggestedFix: 'Convert to structured validation spec',
          stepsAffected: ['step1', 'step2', 'step3']
        }
      ];

      const optimizations = await optimizer.identifyOptimizationOpportunities(workflow, issues);

      expect(optimizations).toHaveLength(1);
      expect(optimizations[0].type).toBe('vibe_to_spec');
      expect(optimizations[0].stepsAffected).toEqual(['step1', 'step2', 'step3']);
      expect(optimizations[0].estimatedSavings.vibes).toBe(9);
      expect(optimizations[0].estimatedSavings.specs).toBe(1);
      expect(optimizations[0].estimatedSavings.percentage).toBe(25);
    });

    it('should identify pattern-based optimizations for complex workflows', async () => {
      const workflow: Workflow = {
        id: 'complex-workflow',
        steps: Array.from({ length: 12 }, (_, i) => ({
          id: `step${i + 1}`,
          type: 'vibe' as const,
          description: `Process data ${i + 1}`,
          inputs: [`input${i + 1}`],
          outputs: [`output${i + 1}`],
          quotaCost: 10
        })),
        dataFlow: [],
        estimatedComplexity: 12
      };

      const optimizations = await optimizer.identifyOptimizationOpportunities(workflow, []);

      expect(optimizations.length).toBeGreaterThan(0);
      
      const decompositionOpt = optimizations.find(opt => opt.type === 'decomposition');
      expect(decompositionOpt).toBeDefined();
      expect(decompositionOpt?.estimatedSavings.percentage).toBe(15);
    });

    it('should consolidate similar optimizations', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Query data',
            inputs: ['id1'],
            outputs: ['data1'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Query data',
            inputs: ['id2'],
            outputs: ['data2'],
            quotaCost: 5
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Query data',
            inputs: ['id3'],
            outputs: ['data3'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const issues: EfficiencyIssue[] = [
        {
          type: 'redundant_query',
          severity: 'medium',
          description: 'Duplicate query 1',
          suggestedFix: 'Cache result',
          stepsAffected: ['step1', 'step2']
        },
        {
          type: 'redundant_query',
          severity: 'medium',
          description: 'Duplicate query 2',
          suggestedFix: 'Cache result',
          stepsAffected: ['step2', 'step3']
        }
      ];

      const optimizations = await optimizer.identifyOptimizationOpportunities(workflow, issues);

      // Should consolidate overlapping caching optimizations
      const cachingOpts = optimizations.filter(opt => opt.type === 'caching');
      expect(cachingOpts.length).toBeLessThanOrEqual(2);
    });

    it('should handle empty workflow gracefully', async () => {
      const workflow: Workflow = {
        id: 'empty-workflow',
        steps: [],
        dataFlow: [],
        estimatedComplexity: 0
      };

      const optimizations = await optimizer.identifyOptimizationOpportunities(workflow, []);

      expect(optimizations).toHaveLength(0);
    });

    it('should handle workflow with no issues', async () => {
      const workflow: Workflow = {
        id: 'efficient-workflow',
        steps: [
          {
            id: 'step1',
            type: 'spec',
            description: 'Efficient processing',
            inputs: ['data'],
            outputs: ['result'],
            quotaCost: 2
          }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const optimizations = await optimizer.identifyOptimizationOpportunities(workflow, []);

      expect(optimizations).toHaveLength(0);
    });

    it('should adjust optimization savings for tight cost constraints', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Process data',
            inputs: ['data'],
            outputs: ['result'],
            quotaCost: 10
          }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const issues: EfficiencyIssue[] = [
        {
          type: 'unnecessary_vibes',
          severity: 'medium',
          description: 'Simple task using vibe',
          suggestedFix: 'Convert to spec',
          stepsAffected: ['step1']
        }
      ];

      const tightConstraintsParams: OptionalParams = {
        costConstraints: {
          maxVibes: 5,
          maxCostDollars: 3
        }
      };

      const optimizationsWithConstraints = await optimizer.identifyOptimizationOpportunities(workflow, issues, tightConstraintsParams);
      const optimizationsWithoutConstraints = await optimizer.identifyOptimizationOpportunities(workflow, issues);

      expect(optimizationsWithConstraints[0].estimatedSavings.percentage).toBeGreaterThan(optimizationsWithoutConstraints[0].estimatedSavings.percentage);
      expect(optimizationsWithConstraints[0].estimatedSavings.vibes).toBeGreaterThan(optimizationsWithoutConstraints[0].estimatedSavings.vibes);
    });

    it('should boost caching and batching savings for high user volume', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Query data',
            inputs: ['id'],
            outputs: ['data'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Query data',
            inputs: ['id'],
            outputs: ['data'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const issues: EfficiencyIssue[] = [
        {
          type: 'redundant_query',
          severity: 'medium',
          description: 'Duplicate queries',
          suggestedFix: 'Cache results',
          stepsAffected: ['step1', 'step2']
        }
      ];

      const highVolumeParams: OptionalParams = {
        expectedUserVolume: 10000
      };

      const optimizationsWithVolume = await optimizer.identifyOptimizationOpportunities(workflow, issues, highVolumeParams);
      const optimizationsWithoutVolume = await optimizer.identifyOptimizationOpportunities(workflow, issues);

      const cachingOptWithVolume = optimizationsWithVolume.find(opt => opt.type === 'caching');
      const cachingOptWithoutVolume = optimizationsWithoutVolume.find(opt => opt.type === 'caching');

      expect(cachingOptWithVolume?.estimatedSavings.percentage).toBeGreaterThan(cachingOptWithoutVolume?.estimatedSavings.percentage || 0);
    });

    it('should boost vibe-to-spec conversion for high performance sensitivity', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Simple validation',
            inputs: ['data'],
            outputs: ['isValid'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const issues: EfficiencyIssue[] = [
        {
          type: 'unnecessary_vibes',
          severity: 'medium',
          description: 'Simple validation using vibe',
          suggestedFix: 'Convert to spec',
          stepsAffected: ['step1']
        }
      ];

      const highPerfParams: OptionalParams = {
        performanceSensitivity: 'high'
      };

      const optimizationsWithPerf = await optimizer.identifyOptimizationOpportunities(workflow, issues, highPerfParams);
      const optimizationsWithoutPerf = await optimizer.identifyOptimizationOpportunities(workflow, issues);

      const vibeToSpecOptWithPerf = optimizationsWithPerf.find(opt => opt.type === 'vibe_to_spec');
      const vibeToSpecOptWithoutPerf = optimizationsWithoutPerf.find(opt => opt.type === 'vibe_to_spec');

      expect(vibeToSpecOptWithPerf?.estimatedSavings.percentage).toBeGreaterThan(vibeToSpecOptWithoutPerf?.estimatedSavings.percentage || 0);
    });
  });

  describe('applyBatchingStrategy', () => {
    it('should batch similar operations', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Process user data for user_123',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Process user data for user_456',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Process user data for user_789',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const batchedOps = await optimizer.applyBatchingStrategy(workflow);

      expect(batchedOps).toHaveLength(1);
      expect(batchedOps[0].originalOperations).toEqual(['step1', 'step2', 'step3']);
      expect(batchedOps[0].batchSize).toBe(3);
      expect(batchedOps[0].type).toBe('vibe');
      expect(batchedOps[0].estimatedSavings).toBeGreaterThan(0);
    });

    it('should not batch dissimilar operations', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Process user data',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'spec',
            description: 'Validate email format',
            inputs: ['email'],
            outputs: ['isValid'],
            quotaCost: 3
          },
          {
            id: 'step3',
            type: 'data_retrieval',
            description: 'Fetch configuration',
            inputs: ['configId'],
            outputs: ['config'],
            quotaCost: 2
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const batchedOps = await optimizer.applyBatchingStrategy(workflow);

      expect(batchedOps).toHaveLength(0);
    });

    it('should batch operations with similar patterns but different identifiers', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Validate email john@example.com',
            inputs: ['email'],
            outputs: ['isValid'],
            quotaCost: 3
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Validate email jane@test.org',
            inputs: ['email'],
            outputs: ['isValid'],
            quotaCost: 3
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Validate email bob@company.net',
            inputs: ['email'],
            outputs: ['isValid'],
            quotaCost: 3
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const batchedOps = await optimizer.applyBatchingStrategy(workflow);

      expect(batchedOps).toHaveLength(1);
      expect(batchedOps[0].originalOperations).toEqual(['step1', 'step2', 'step3']);
      expect(batchedOps[0].batchSize).toBe(3);
      expect(batchedOps[0].description).toContain('validate email');
    });

    it('should calculate higher savings for larger batches', async () => {
      const createWorkflow = (stepCount: number): Workflow => ({
        id: 'test-workflow',
        steps: Array.from({ length: stepCount }, (_, i) => ({
          id: `step${i + 1}`,
          type: 'vibe' as const,
          description: `Process item ${i + 1}`,
          inputs: ['itemId'],
          outputs: ['result'],
          quotaCost: 5
        })),
        dataFlow: [],
        estimatedComplexity: stepCount
      });

      const smallBatch = await optimizer.applyBatchingStrategy(createWorkflow(2));
      const largeBatch = await optimizer.applyBatchingStrategy(createWorkflow(5));

      expect(smallBatch[0].estimatedSavings).toBeLessThan(largeBatch[0].estimatedSavings);
    });

    it('should handle empty workflow', async () => {
      const workflow: Workflow = {
        id: 'empty-workflow',
        steps: [],
        dataFlow: [],
        estimatedComplexity: 0
      };

      const batchedOps = await optimizer.applyBatchingStrategy(workflow);

      expect(batchedOps).toHaveLength(0);
    });

    it('should handle single operation workflow', async () => {
      const workflow: Workflow = {
        id: 'single-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Process data',
            inputs: ['data'],
            outputs: ['result'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const batchedOps = await optimizer.applyBatchingStrategy(workflow);

      expect(batchedOps).toHaveLength(0);
    });
  });

  describe('implementCachingLayer', () => {
    it('should identify cache points for cacheable operations', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'data_retrieval',
            description: 'Fetch user configuration',
            inputs: ['userId'],
            outputs: ['config'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Analyze user behavior',
            inputs: ['userId', 'timeframe'],
            outputs: ['analysis'],
            quotaCost: 10
          },
          {
            id: 'step3',
            type: 'processing',
            description: 'Transform data format',
            inputs: ['data'],
            outputs: ['transformedData'],
            quotaCost: 3
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const cachedWorkflow = await optimizer.implementCachingLayer(workflow);

      expect(cachedWorkflow.cachePoints).toHaveLength(2); // step1 and step2 should be cacheable
      expect(cachedWorkflow.cachePoints.map(cp => cp.stepId)).toContain('step1');
      expect(cachedWorkflow.cachePoints.map(cp => cp.stepId)).toContain('step2');
      expect(cachedWorkflow.estimatedHitRate).toBeGreaterThan(0);
    });

    it('should generate appropriate cache keys', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'data_retrieval',
            description: 'Query user data',
            inputs: ['userId', 'fields'],
            outputs: ['userData'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const cachedWorkflow = await optimizer.implementCachingLayer(workflow);

      expect(cachedWorkflow.cachePoints).toHaveLength(1);
      expect(cachedWorkflow.cachePoints[0].cacheKey).toContain('data_retrieval');
      expect(cachedWorkflow.cachePoints[0].cacheKey).toContain('fields|userId'); // sorted inputs
    });

    it('should set appropriate TTL for different operation types', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'config-step',
            type: 'data_retrieval',
            description: 'Fetch system config',
            inputs: ['configId'],
            outputs: ['config'],
            quotaCost: 3
          },
          {
            id: 'data-step',
            type: 'data_retrieval',
            description: 'Fetch user data',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          },
          {
            id: 'vibe-step',
            type: 'vibe',
            description: 'Analyze sentiment',
            inputs: ['text'],
            outputs: ['sentiment'],
            quotaCost: 8
          }
        ],
        dataFlow: [],
        estimatedComplexity: 3
      };

      const cachedWorkflow = await optimizer.implementCachingLayer(workflow);

      const configCache = cachedWorkflow.cachePoints.find(cp => cp.stepId === 'config-step');
      const dataCache = cachedWorkflow.cachePoints.find(cp => cp.stepId === 'data-step');
      const vibeCache = cachedWorkflow.cachePoints.find(cp => cp.stepId === 'vibe-step');

      expect(configCache?.ttl).toBe(3600); // 1 hour for config
      expect(dataCache?.ttl).toBe(1800); // 30 minutes for data
      expect(vibeCache?.ttl).toBe(900); // 15 minutes for vibe
    });

    it('should calculate higher hit rates for frequent operations', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'data_retrieval',
            description: 'Query user data',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'data_retrieval',
            description: 'Query user data',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          },
          {
            id: 'step3',
            type: 'data_retrieval',
            description: 'Query user data',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          },
          {
            id: 'step4',
            type: 'data_retrieval',
            description: 'Query different data',
            inputs: ['dataId'],
            outputs: ['otherData'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 4
      };

      const cachedWorkflow = await optimizer.implementCachingLayer(workflow);

      const frequentOps = cachedWorkflow.cachePoints.filter(cp => 
        ['step1', 'step2', 'step3'].includes(cp.stepId)
      );
      const singleOp = cachedWorkflow.cachePoints.find(cp => cp.stepId === 'step4');

      expect(frequentOps[0].estimatedHitRate).toBeGreaterThan(singleOp!.estimatedHitRate);
    });

    it('should not cache non-cacheable operations', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'spec',
            description: 'Execute specification',
            inputs: ['specData'],
            outputs: ['result'],
            quotaCost: 2
          },
          {
            id: 'step2',
            type: 'processing',
            description: 'Random number generation',
            inputs: [],
            outputs: ['randomNumber'],
            quotaCost: 1
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const cachedWorkflow = await optimizer.implementCachingLayer(workflow);

      expect(cachedWorkflow.cachePoints).toHaveLength(0);
      expect(cachedWorkflow.estimatedHitRate).toBe(0);
    });

    it('should handle empty workflow', async () => {
      const workflow: Workflow = {
        id: 'empty-workflow',
        steps: [],
        dataFlow: [],
        estimatedComplexity: 0
      };

      const cachedWorkflow = await optimizer.implementCachingLayer(workflow);

      expect(cachedWorkflow.cachePoints).toHaveLength(0);
      expect(cachedWorkflow.estimatedHitRate).toBe(0);
    });

    it('should calculate overall hit rate correctly', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'data_retrieval',
            description: 'Query data',
            inputs: ['id'],
            outputs: ['data'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Analyze data',
            inputs: ['data'],
            outputs: ['analysis'],
            quotaCost: 8
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const cachedWorkflow = await optimizer.implementCachingLayer(workflow);

      expect(cachedWorkflow.cachePoints).toHaveLength(2);
      expect(cachedWorkflow.estimatedHitRate).toBeGreaterThan(0);
      expect(cachedWorkflow.estimatedHitRate).toBeLessThanOrEqual(1);
      
      // Should be average of individual hit rates
      const avgHitRate = cachedWorkflow.cachePoints.reduce((sum, cp) => sum + cp.estimatedHitRate, 0) / 2;
      expect(cachedWorkflow.estimatedHitRate).toBeCloseTo(avgHitRate, 2);
    });
  });

  describe('breakIntoSpecs', () => {
    it('should not decompose small workflows', async () => {
      const workflow: Workflow = {
        id: 'small-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Process data',
            inputs: ['data'],
            outputs: ['result'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Validate result',
            inputs: ['result'],
            outputs: ['isValid'],
            quotaCost: 3
          }
        ],
        dataFlow: [],
        estimatedComplexity: 2
      };

      const specs = await optimizer.breakIntoSpecs(workflow);

      expect(specs).toHaveLength(0);
    });

    it('should decompose workflow at type boundaries', async () => {
      const workflow: Workflow = {
        id: 'mixed-workflow',
        steps: [
          {
            id: 'step1',
            type: 'data_retrieval',
            description: 'Fetch user data',
            inputs: ['userId'],
            outputs: ['userData'],
            quotaCost: 5
          },
          {
            id: 'step2',
            type: 'data_retrieval',
            description: 'Fetch config data',
            inputs: ['configId'],
            outputs: ['config'],
            quotaCost: 4
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Analyze user behavior',
            inputs: ['userData'],
            outputs: ['analysis'],
            quotaCost: 10
          },
          {
            id: 'step4',
            type: 'vibe',
            description: 'Generate recommendations',
            inputs: ['analysis'],
            outputs: ['recommendations'],
            quotaCost: 8
          }
        ],
        dataFlow: [
          { from: 'step1', to: 'step3', dataType: 'userData', required: true },
          { from: 'step3', to: 'step4', dataType: 'analysis', required: true }
        ],
        estimatedComplexity: 4
      };

      const specs = await optimizer.breakIntoSpecs(workflow);

      expect(specs.length).toBeGreaterThan(0);
      expect(specs.length).toBeLessThanOrEqual(2);
      
      // Should have data retrieval spec and analysis spec
      const dataSpec = specs.find(spec => spec.name.includes('Data Retrieval'));
      const analysisSpec = specs.find(spec => spec.name.includes('Analysis'));
      
      expect(dataSpec).toBeDefined();
      expect(analysisSpec).toBeDefined();
    });

    it('should decompose workflow at functional boundaries', async () => {
      const workflow: Workflow = {
        id: 'functional-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Validate email format',
            inputs: ['email'],
            outputs: ['isValidEmail'],
            quotaCost: 3
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Validate phone format',
            inputs: ['phone'],
            outputs: ['isValidPhone'],
            quotaCost: 3
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Process user registration',
            inputs: ['userData'],
            outputs: ['userId'],
            quotaCost: 8
          },
          {
            id: 'step4',
            type: 'vibe',
            description: 'Transform user data',
            inputs: ['userData'],
            outputs: ['transformedData'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 4
      };

      const specs = await optimizer.breakIntoSpecs(workflow);

      expect(specs.length).toBeGreaterThan(0);
      
      // Should separate validation from processing/transformation
      const validationSpec = specs.find(spec => spec.name.includes('Validation'));
      const processingSpec = specs.find(spec => spec.name.includes('Processing'));
      
      expect(validationSpec || processingSpec).toBeDefined();
    });

    it('should isolate expensive operations', async () => {
      const workflow: Workflow = {
        id: 'expensive-workflow',
        steps: [
          {
            id: 'step1',
            type: 'vibe',
            description: 'Simple validation',
            inputs: ['data'],
            outputs: ['isValid'],
            quotaCost: 2
          },
          {
            id: 'step2',
            type: 'vibe',
            description: 'Complex AI analysis',
            inputs: ['data'],
            outputs: ['analysis'],
            quotaCost: 20 // Expensive operation
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Format results',
            inputs: ['analysis'],
            outputs: ['formattedResults'],
            quotaCost: 3
          },
          {
            id: 'step4',
            type: 'vibe',
            description: 'Generate report',
            inputs: ['formattedResults'],
            outputs: ['report'],
            quotaCost: 5
          }
        ],
        dataFlow: [],
        estimatedComplexity: 4
      };

      const specs = await optimizer.breakIntoSpecs(workflow);

      expect(specs.length).toBeGreaterThan(1);
      
      // The expensive operation should be in its own spec or isolated
      const expensiveSpec = specs.find(spec => 
        spec.steps.includes('step2') && spec.estimatedQuotaCost >= 20
      );
      
      expect(expensiveSpec).toBeDefined();
    });

    it('should create meaningful spec names and descriptions', async () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step1',
            type: 'data_retrieval',
            description: 'Fetch user profile',
            inputs: ['userId'],
            outputs: ['profile'],
            quotaCost: 4
          },
          {
            id: 'step2',
            type: 'data_retrieval',
            description: 'Query user preferences',
            inputs: ['userId'],
            outputs: ['preferences'],
            quotaCost: 3
          },
          {
            id: 'step3',
            type: 'vibe',
            description: 'Analyze user behavior patterns',
            inputs: ['profile', 'preferences'],
            outputs: ['patterns'],
            quotaCost: 12
          },
          {
            id: 'step4',
            type: 'vibe',
            description: 'Generate recommendations',
            inputs: ['patterns'],
            outputs: ['recommendations'],
            quotaCost: 8
          }
        ],
        dataFlow: [],
        estimatedComplexity: 4
      };

      const specs = await optimizer.breakIntoSpecs(workflow);

      expect(specs.length).toBeGreaterThan(0);
      
      for (const spec of specs) {
        expect(spec.id).toContain('test-workflow-spec-');
        expect(spec.name).toBeTruthy();
        expect(spec.description).toBeTruthy();
        expect(spec.steps.length).toBeGreaterThan(0);
        expect(spec.estimatedQuotaCost).toBeGreaterThan(0);
      }
    });

    it('should maintain reasonable spec sizes', async () => {
      const workflow: Workflow = {
        id: 'large-workflow',
        steps: Array.from({ length: 15 }, (_, i) => ({
          id: `step${i + 1}`,
          type: 'vibe' as const,
          description: `Process item ${i + 1}`,
          inputs: [`input${i + 1}`],
          outputs: [`output${i + 1}`],
          quotaCost: 5
        })),
        dataFlow: [],
        estimatedComplexity: 15
      };

      const specs = await optimizer.breakIntoSpecs(workflow);

      expect(specs.length).toBeGreaterThan(1);
      
      // Each spec should have reasonable size (2-8 steps)
      for (const spec of specs) {
        expect(spec.steps.length).toBeGreaterThanOrEqual(2);
        expect(spec.steps.length).toBeLessThanOrEqual(8);
      }
      
      // All original steps should be covered
      const allSpecSteps = specs.flatMap(spec => spec.steps);
      const originalSteps = workflow.steps.map(step => step.id);
      expect(allSpecSteps.sort()).toEqual(originalSteps.sort());
    });

    it('should handle workflow with no clear breaking points', async () => {
      const workflow: Workflow = {
        id: 'uniform-workflow',
        steps: Array.from({ length: 6 }, (_, i) => ({
          id: `step${i + 1}`,
          type: 'vibe' as const,
          description: `Similar processing step ${i + 1}`,
          inputs: ['data'],
          outputs: ['result'],
          quotaCost: 5
        })),
        dataFlow: [],
        estimatedComplexity: 6
      };

      const specs = await optimizer.breakIntoSpecs(workflow);

      // Should still create some decomposition for large uniform workflows
      expect(specs.length).toBeGreaterThanOrEqual(1);
      
      // All steps should be covered
      const allSpecSteps = specs.flatMap(spec => spec.steps);
      expect(allSpecSteps).toHaveLength(6);
    });
  });
});