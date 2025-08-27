// Unit tests for MCP tool handlers

import { PMAgentMCPServer } from '../../mcp/server';
import { 
  OptimizeIntentArgs, 
  AnalyzeWorkflowArgs, 
  GenerateROIArgs, 
  ConsultingSummaryArgs,
  MCPToolContext
} from '../../models/mcp';
import { Workflow, OptimizedWorkflow } from '../../models/workflow';
import { ConsultingAnalysis } from '../../components/business-analyzer';

// Mock the AIAgentPipeline
jest.mock('../../main', () => ({
  AIAgentPipeline: jest.fn().mockImplementation(() => ({
    processIntent: jest.fn(),
    analyzeWorkflow: jest.fn(),
    generateROIAnalysis: jest.fn(),
    generateConsultingSummary: jest.fn()
  }))
}));

describe('MCP Tool Handlers', () => {
  let server: PMAgentMCPServer;
  let mockPipeline: any;

  beforeEach(() => {
    server = new PMAgentMCPServer();
    // Access the private pipeline property for mocking
    mockPipeline = (server as any).pipeline;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleOptimizeIntent', () => {
    const mockContext: MCPToolContext = {
      toolName: 'optimize_intent',
      sessionId: 'test-session',
      timestamp: Date.now()
    };

    it('should handle successful intent optimization', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Create a user authentication system with JWT tokens',
        parameters: {
          expectedUserVolume: 1000,
          performanceSensitivity: 'high'
        }
      };

      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'User Authentication System',
          description: 'JWT-based authentication',
          requirements: [],
          design: { overview: 'Test design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Test summary',
            keyFindings: ['Finding 1'],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low risk'
          },
          alternativeOptions: {
            conservative: {
              name: 'Conservative',
              description: 'Low risk approach',
              quotaSavings: 10,
              implementationEffort: 'low',
              riskLevel: 'low',
              estimatedROI: 1.5
            },
            balanced: {
              name: 'Balanced',
              description: 'Moderate approach',
              quotaSavings: 25,
              implementationEffort: 'medium',
              riskLevel: 'low',
              estimatedROI: 2.5
            },
            bold: {
              name: 'Bold',
              description: 'High impact approach',
              quotaSavings: 50,
              implementationEffort: 'high',
              riskLevel: 'medium',
              estimatedROI: 4.0
            }
          }
        },
        efficiencySummary: {
          naiveApproach: {
            vibesConsumed: 20,
            specsConsumed: 5,
            estimatedCost: 100,
            confidenceLevel: 'medium',
            scenario: 'naive',
            breakdown: []
          },
          optimizedApproach: {
            vibesConsumed: 10,
            specsConsumed: 8,
            estimatedCost: 60,
            confidenceLevel: 'high',
            scenario: 'optimized',
            breakdown: []
          },
          savings: {
            vibeReduction: 50,
            specReduction: -60,
            costSavings: 40,
            totalSavingsPercentage: 40
          },
          optimizationNotes: ['Applied batching optimization']
        }
      };

      mockPipeline.processIntent.mockResolvedValue(mockResult);

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(mockPipeline.processIntent).toHaveBeenCalledWith(args.intent, args.parameters);
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      
      const responseData = result.content[0].json;
      expect(responseData.success).toBe(true);
      expect(responseData.data.enhancedKiroSpec).toBeDefined();
      expect(responseData.data.efficiencySummary).toBeDefined();
    });

    it('should handle pipeline failure gracefully', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Invalid intent'
      };

      const mockResult = {
        success: false,
        error: {
          stage: 'intent',
          type: 'validation_failed',
          message: 'Intent too short',
          suggestedAction: 'Provide more detailed intent',
          fallbackAvailable: false
        }
      };

      mockPipeline.processIntent.mockResolvedValue(mockResult);

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      
      const responseData = result.content[0].json;
      expect(responseData.error).toBe(true);
      expect(responseData.message).toBeDefined();
    });

    it('should handle pipeline exceptions', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Test intent'
      };

      mockPipeline.processIntent.mockRejectedValue(new Error('Pipeline crashed'));

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      
      const responseData = result.content[0].json;
      expect(responseData.error).toBe(true);
      expect(responseData.message).toContain('Pipeline crashed');
    });

    it('should handle intent without parameters', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Simple intent without parameters'
      };

      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Simple Feature',
          description: 'Basic implementation',
          requirements: [],
          design: { overview: 'Simple design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Simple analysis',
            keyFindings: [],
            recommendations: [],
            techniquesApplied: [],
            supportingEvidence: []
          },
          roiAnalysis: {
            scenarios: [],
            recommendations: [],
            bestOption: 'Balanced',
            riskAssessment: 'Low'
          },
          alternativeOptions: {
            conservative: { name: 'Conservative', description: 'Safe', quotaSavings: 5, implementationEffort: 'low', riskLevel: 'low', estimatedROI: 1.2 },
            balanced: { name: 'Balanced', description: 'Moderate', quotaSavings: 15, implementationEffort: 'medium', riskLevel: 'low', estimatedROI: 2.0 },
            bold: { name: 'Bold', description: 'Aggressive', quotaSavings: 30, implementationEffort: 'high', riskLevel: 'medium', estimatedROI: 3.5 }
          }
        }
      };

      mockPipeline.processIntent.mockResolvedValue(mockResult);

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(mockPipeline.processIntent).toHaveBeenCalledWith(args.intent, undefined);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('json');
    });
  });

  describe('handleAnalyzeWorkflow', () => {
    const mockContext: MCPToolContext = {
      toolName: 'analyze_workflow',
      sessionId: 'test-session',
      timestamp: Date.now()
    };

    const mockWorkflow: Workflow = {
      id: 'test-workflow',
      steps: [
        {
          id: 'step-1',
          type: 'vibe',
          description: 'Analyze user input',
          inputs: [],
          outputs: ['analysis'],
          quotaCost: 5
        },
        {
          id: 'step-2',
          type: 'spec',
          description: 'Generate response',
          inputs: ['analysis'],
          outputs: ['response'],
          quotaCost: 3
        }
      ],
      dataFlow: [],
      estimatedComplexity: 2
    };

    it('should analyze workflow successfully', async () => {
      const args: AnalyzeWorkflowArgs = {
        workflow: mockWorkflow,
        techniques: ['MECE', 'ValueDriverTree']
      };

      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.9, applicableScenarios: ['workflow analysis'] },
          { name: 'ValueDriverTree', relevanceScore: 0.8, applicableScenarios: ['cost optimization'] }
        ],
        keyFindings: [
          'Workflow has redundant vibe calls',
          'Batching opportunity identified'
        ],
        totalQuotaSavings: 35,
        implementationComplexity: 'medium',
        meceAnalysis: {
          categories: [
            {
              name: 'Processing Steps',
              drivers: ['vibe calls', 'spec executions'],
              quotaImpact: 8,
              optimizationPotential: 40
            }
          ],
          totalCoverage: 100,
          overlaps: []
        },
        valueDriverAnalysis: {
          primaryDrivers: [
            { name: 'Vibe Usage', currentCost: 5, optimizedCost: 2, savingsPotential: 60 }
          ],
          secondaryDrivers: [],
          rootCauses: ['Inefficient processing']
        }
      };

      mockPipeline.analyzeWorkflow.mockResolvedValue(mockAnalysis);

      const result = await server.handleAnalyzeWorkflow(args, mockContext);

      expect(mockPipeline.analyzeWorkflow).toHaveBeenCalledWith(mockWorkflow, ['MECE', 'ValueDriverTree']);
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');
      
      expect(result.content[0].markdown).toBeDefined();
      expect(result.content[0].markdown).toContain('35'); // totalQuotaSavings
    });

    it('should handle workflow analysis without specific techniques', async () => {
      const args: AnalyzeWorkflowArgs = {
        workflow: mockWorkflow
      };

      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.7, applicableScenarios: ['general analysis'] }
        ],
        keyFindings: ['General optimization opportunities found'],
        totalQuotaSavings: 20,
        implementationComplexity: 'low'
      };

      mockPipeline.analyzeWorkflow.mockResolvedValue(mockAnalysis);

      const result = await server.handleAnalyzeWorkflow(args, mockContext);

      expect(mockPipeline.analyzeWorkflow).toHaveBeenCalledWith(mockWorkflow, undefined);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
    });

    it('should handle analysis errors', async () => {
      const args: AnalyzeWorkflowArgs = {
        workflow: mockWorkflow
      };

      mockPipeline.analyzeWorkflow.mockRejectedValue(new Error('Analysis failed'));

      const result = await server.handleAnalyzeWorkflow(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      
      const responseData = result.content[0].json;
      expect(responseData.error).toBe(true);
      expect(responseData.message).toContain('Analysis failed');
    });
  });

  describe('handleGenerateROI', () => {
    const mockContext: MCPToolContext = {
      toolName: 'generate_roi_analysis',
      sessionId: 'test-session',
      timestamp: Date.now()
    };

    const mockWorkflow: Workflow = {
      id: 'test-workflow',
      steps: [
        { id: 'step-1', type: 'vibe', description: 'Process', inputs: [], outputs: [], quotaCost: 10 }
      ],
      dataFlow: [],
      estimatedComplexity: 1
    };

    it('should generate ROI analysis successfully', async () => {
      const args: GenerateROIArgs = {
        workflow: mockWorkflow
      };

      const mockROIAnalysis = {
        scenarios: [
          {
            name: 'Current',
            forecast: {
              vibesConsumed: 10,
              specsConsumed: 0,
              estimatedCost: 50,
              confidenceLevel: 'high',
              scenario: 'naive',
              breakdown: []
            },
            savingsPercentage: 0,
            implementationEffort: 'none',
            riskLevel: 'none'
          },
          {
            name: 'Optimized',
            forecast: {
              vibesConsumed: 5,
              specsConsumed: 2,
              estimatedCost: 30,
              confidenceLevel: 'high',
              scenario: 'optimized',
              breakdown: []
            },
            savingsPercentage: 40,
            implementationEffort: 'medium',
            riskLevel: 'low'
          }
        ],
        recommendations: ['Apply batching optimization'],
        bestOption: 'Optimized',
        riskAssessment: 'Low risk with high reward'
      };

      mockPipeline.generateROIAnalysis.mockResolvedValue(mockROIAnalysis);

      const result = await server.handleGenerateROI(args, mockContext);

      expect(mockPipeline.generateROIAnalysis).toHaveBeenCalledWith(mockWorkflow, undefined, undefined);
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      
      const responseData = result.content[0].json;
      expect(responseData.success).toBe(true);
      expect(responseData.data.roiAnalysis).toBeDefined();
      expect(responseData.data.roiAnalysis.scenarios).toHaveLength(2);
    });

    it('should handle ROI analysis with optimized workflow', async () => {
      const optimizedWorkflow: OptimizedWorkflow = {
        ...mockWorkflow,
        optimizations: [
          {
            type: 'batching',
            description: 'Batch similar operations',
            stepsAffected: ['step-1'],
            estimatedSavings: { vibes: 5, specs: 0, percentage: 50 }
          }
        ],
        originalWorkflow: mockWorkflow,
        efficiencyGains: {
          totalSavingsPercentage: 50,
          vibeReduction: 50,
          specReduction: 0,
          costSavings: 25
        }
      };

      const args: GenerateROIArgs = {
        workflow: mockWorkflow,
        optimizedWorkflow
      };

      const mockROIAnalysis = {
        scenarios: [
          {
            name: 'Current',
            forecast: { vibesConsumed: 10, specsConsumed: 0, estimatedCost: 50, confidenceLevel: 'high', scenario: 'naive', breakdown: [] },
            savingsPercentage: 0,
            implementationEffort: 'none',
            riskLevel: 'none'
          },
          {
            name: 'Optimized',
            forecast: { vibesConsumed: 5, specsConsumed: 2, estimatedCost: 25, confidenceLevel: 'high', scenario: 'optimized', breakdown: [] },
            savingsPercentage: 50,
            implementationEffort: 'medium',
            riskLevel: 'low'
          }
        ],
        recommendations: ['Implement batching for 50% savings'],
        bestOption: 'Optimized',
        riskAssessment: 'Low risk, high reward'
      };

      mockPipeline.generateROIAnalysis.mockResolvedValue(mockROIAnalysis);

      const result = await server.handleGenerateROI(args, mockContext);

      expect(mockPipeline.generateROIAnalysis).toHaveBeenCalledWith(mockWorkflow, optimizedWorkflow, undefined);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('json');
    });

    it('should handle ROI analysis errors', async () => {
      const args: GenerateROIArgs = {
        workflow: mockWorkflow
      };

      mockPipeline.generateROIAnalysis.mockRejectedValue(new Error('ROI calculation failed'));

      const result = await server.handleGenerateROI(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      
      const responseData = result.content[0].json;
      expect(responseData.error).toBe(true);
      expect(responseData.message).toContain('ROI calculation failed');
    });
  });

  describe('handleConsultingSummary', () => {
    const mockContext: MCPToolContext = {
      toolName: 'get_consulting_summary',
      sessionId: 'test-session',
      timestamp: Date.now()
    };

    const mockAnalysis: ConsultingAnalysis = {
      techniquesUsed: [
        { name: 'MECE', relevanceScore: 0.9, applicableScenarios: ['analysis'] },
        { name: 'Pyramid', relevanceScore: 0.8, applicableScenarios: ['communication'] }
      ],
      keyFindings: [
        'Significant optimization opportunities identified',
        'Current workflow has 40% waste'
      ],
      totalQuotaSavings: 40,
      implementationComplexity: 'medium'
    };

    it('should generate consulting summary successfully', async () => {
      const args: ConsultingSummaryArgs = {
        analysis: mockAnalysis,
        techniques: ['MECE', 'Pyramid']
      };

      const mockSummary = {
        executiveSummary: 'Analysis reveals 40% optimization potential through systematic improvements.',
        keyFindings: [
          'Workflow inefficiencies identified',
          'Batching opportunities available'
        ],
        recommendations: [
          {
            mainRecommendation: 'Implement batching optimization',
            supportingReasons: ['Reduces redundant calls', 'Improves efficiency'],
            evidence: [
              {
                type: 'quantitative',
                description: '40% quota reduction possible',
                source: 'MECE analysis',
                confidence: 'high'
              }
            ],
            expectedOutcome: '40% cost reduction'
          }
        ],
        techniquesApplied: [
          {
            techniqueName: 'MECE',
            keyInsight: 'Workflow categories are mutually exclusive',
            supportingData: { categories: 2, coverage: 100 },
            actionableRecommendation: 'Apply batching to processing category'
          }
        ],
        supportingEvidence: [
          {
            type: 'quantitative',
            description: 'Current quota usage analysis',
            source: 'Workflow analysis',
            confidence: 'high'
          }
        ]
      };

      mockPipeline.generateConsultingSummary.mockResolvedValue(mockSummary);

      const result = await server.handleConsultingSummary(args, mockContext);

      expect(mockPipeline.generateConsultingSummary).toHaveBeenCalledWith(mockAnalysis, ['MECE', 'Pyramid']);
      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');
      
      expect(result.content[0].markdown).toBeDefined();
      expect(result.content[0].markdown).toContain('40%');
    });

    it('should handle consulting summary without specific techniques', async () => {
      const args: ConsultingSummaryArgs = {
        analysis: mockAnalysis
      };

      const mockSummary = {
        executiveSummary: 'General analysis completed with optimization recommendations.',
        keyFindings: ['Optimization opportunities found'],
        recommendations: [],
        techniquesApplied: [],
        supportingEvidence: []
      };

      mockPipeline.generateConsultingSummary.mockResolvedValue(mockSummary);

      const result = await server.handleConsultingSummary(args, mockContext);

      expect(mockPipeline.generateConsultingSummary).toHaveBeenCalledWith(mockAnalysis, undefined);
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
    });

    it('should handle consulting summary errors', async () => {
      const args: ConsultingSummaryArgs = {
        analysis: mockAnalysis
      };

      mockPipeline.generateConsultingSummary.mockRejectedValue(new Error('Summary generation failed'));

      const result = await server.handleConsultingSummary(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      
      const responseData = result.content[0].json;
      expect(responseData.error).toBe(true);
      expect(responseData.message).toContain('Summary generation failed');
    });
  });
});