// Comprehensive MCP Server integration tests

import { PMAgentMCPServer } from '../../mcp/server';
import { MCPToolRegistry, MCP_SERVER_CONFIG } from '../../mcp/server-config';
import { 
  MCPServerOptions, 
  MCPToolContext,
  OptimizeIntentArgs,
  AnalyzeWorkflowArgs,
  GenerateROIArgs,
  ConsultingSummaryArgs,
  LogLevel,
  MCPToolResult
} from '../../models/mcp';
import { Workflow, OptimizedWorkflow } from '../../models/workflow';
import { ConsultingAnalysis } from '../../components/business-analyzer';
import { MCPLogger } from '../../utils/mcp-error-handling';

// Mock the AIAgentPipeline
jest.mock('../../pipeline/ai-agent-pipeline', () => ({
  AIAgentPipeline: jest.fn().mockImplementation(() => ({
    processIntent: jest.fn(),
    analyzeWorkflow: jest.fn(),
    generateROIAnalysis: jest.fn(),
    generateConsultingSummary: jest.fn()
  }))
}));

describe('MCP Server Integration Tests', () => {
  let server: PMAgentMCPServer;
  let mockPipeline: any;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up console spies to capture logging
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Initialize server with comprehensive options
    const options: MCPServerOptions = {
      enableLogging: true,
      enableMetrics: true
    };
    
    server = new PMAgentMCPServer(options);
    mockPipeline = (server as any).pipeline;
    
    // Set debug logging for comprehensive test coverage
    MCPLogger.setLogLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('MCP Protocol Compliance', () => {
    it('should expose all required MCP tools', () => {
      const registry = MCPToolRegistry.createDefault();
      const tools = registry.getAllTools();
      
      expect(tools).toHaveLength(10);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('optimize_intent');
      expect(toolNames).toContain('analyze_workflow');
      expect(toolNames).toContain('generate_roi_analysis');
      expect(toolNames).toContain('get_consulting_summary');
    });

    it('should have valid tool schemas for MCP discovery', () => {
      const registry = MCPToolRegistry.createDefault();
      const tools = registry.getAllTools();
      
      tools.forEach(tool => {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeTruthy();
        
        if (tool.inputSchema.required) {
          expect(Array.isArray(tool.inputSchema.required)).toBe(true);
        }
      });
    });

    it('should validate tool inputs according to schemas', () => {
      const registry = MCPToolRegistry.createDefault();
      
      // Test optimize_intent validation
      const validOptimizeInput = {
        intent: 'Create a user management system with authentication',
        parameters: {
          expectedUserVolume: 1000,
          performanceSensitivity: 'high'
        }
      };
      
      const optimizeValidation = registry.validateToolInput('optimize_intent', validOptimizeInput);
      expect(optimizeValidation.valid).toBe(true);
      
      // Test invalid input
      const invalidOptimizeInput = {
        // Missing required 'intent' field
        parameters: { expectedUserVolume: 1000 }
      };
      
      const invalidValidation = registry.validateToolInput('optimize_intent', invalidOptimizeInput);
      expect(invalidValidation.valid).toBe(false);
      expect(invalidValidation.errors).toContain('Missing required field: intent');
    });

    it('should handle tool discovery requests', () => {
      const registry = MCPToolRegistry.createDefault();
      const toolNames = registry.getToolNames();
      
      expect(toolNames).toEqual([
        'optimize_intent',
        'analyze_workflow', 
        'generate_roi_analysis',
        'get_consulting_summary',
        'generate_management_onepager',
        'generate_pr_faq',
        'generate_requirements',
        'generate_design_options',
        'generate_task_plan',
        'validate_idea_quick'
      ]);
    });
  });

  describe('Realistic Developer Intent Examples', () => {
    describe('E-commerce System Intent', () => {
      const ecommerceContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'ecommerce-session',
        timestamp: Date.now(),
        requestId: 'ecommerce-req-001',
        traceId: 'ecommerce-trace-001'
      };

      it('should optimize complex e-commerce system intent', async () => {
        const args: OptimizeIntentArgs = {
          intent: `Create a comprehensive e-commerce system with user authentication, product catalog, 
                   shopping cart, payment processing, order management, inventory tracking, and admin dashboard. 
                   The system should handle 10,000 concurrent users, support multiple payment methods, 
                   send email notifications, and provide real-time inventory updates.`,
          parameters: {
            expectedUserVolume: 10000,
            costConstraints: { maxCostDollars: 500 },
            performanceSensitivity: 'high'
          }
        };

        const mockResult = {
          success: true,
          enhancedKiroSpec: {
            name: 'E-commerce Platform',
            description: 'Comprehensive e-commerce solution with optimized architecture',
            requirements: [
              { id: 'req-1', description: 'User authentication system', priority: 'high' },
              { id: 'req-2', description: 'Product catalog management', priority: 'high' },
              { id: 'req-3', description: 'Shopping cart functionality', priority: 'medium' }
            ],
            design: { 
              overview: 'Microservices architecture with optimized data flow',
              components: ['auth-service', 'catalog-service', 'cart-service', 'payment-service']
            },
            tasks: [
              { id: 'task-1', description: 'Implement authentication service', status: 'pending' },
              { id: 'task-2', description: 'Create product catalog API', status: 'pending' }
            ],
            consultingSummary: {
              executiveSummary: 'E-commerce system optimized for high concurrency with 45% quota reduction',
              keyFindings: [
                'Batching opportunities in inventory updates',
                'Caching potential for product catalog',
                'Microservices decomposition reduces complexity'
              ],
              recommendations: [
                {
                  mainRecommendation: 'Implement event-driven architecture for inventory updates',
                  supportingReasons: ['Reduces real-time processing load', 'Enables batching'],
                  evidence: [
                    {
                      type: 'quantitative',
                      description: '60% reduction in inventory update calls',
                      source: 'MECE analysis',
                      confidence: 'high'
                    }
                  ],
                  expectedOutcome: '60% reduction in inventory processing costs'
                }
              ],
              techniquesApplied: [
                {
                  techniqueName: 'MECE',
                  keyInsight: 'System components are mutually exclusive with clear boundaries',
                  supportingData: { categories: 6, coverage: 100 },
                  actionableRecommendation: 'Implement microservices with event-driven communication'
                },
                {
                  techniqueName: 'ValueDriverTree',
                  keyInsight: 'Inventory updates drive 40% of quota consumption',
                  supportingData: { primaryDrivers: 3, savingsPotential: 45 },
                  actionableRecommendation: 'Batch inventory updates and use caching'
                }
              ],
              supportingEvidence: [
                {
                  type: 'quantitative',
                  description: 'Current architecture would consume 200 vibes/day',
                  source: 'Quota analysis',
                  confidence: 'high'
                }
              ]
            },
            roiAnalysis: {
              scenarios: [
                {
                  name: 'Current Monolithic',
                  forecast: {
                    vibesConsumed: 200,
                    specsConsumed: 15,
                    estimatedCost: 1000,
                    confidenceLevel: 'high',
                    scenario: 'naive',
                    breakdown: [
                      { component: 'inventory-updates', vibes: 80, specs: 5 },
                      { component: 'user-auth', vibes: 60, specs: 4 },
                      { component: 'catalog-search', vibes: 60, specs: 6 }
                    ]
                  },
                  savingsPercentage: 0,
                  implementationEffort: 'low',
                  riskLevel: 'high'
                },
                {
                  name: 'Optimized Microservices',
                  forecast: {
                    vibesConsumed: 110,
                    specsConsumed: 25,
                    estimatedCost: 550,
                    confidenceLevel: 'high',
                    scenario: 'optimized',
                    breakdown: [
                      { component: 'inventory-service', vibes: 30, specs: 8 },
                      { component: 'auth-service', vibes: 40, specs: 7 },
                      { component: 'catalog-service', vibes: 40, specs: 10 }
                    ]
                  },
                  savingsPercentage: 45,
                  implementationEffort: 'medium',
                  riskLevel: 'low'
                }
              ],
              recommendations: [
                'Implement microservices architecture for better scalability',
                'Use event-driven patterns for inventory management',
                'Apply caching strategies for product catalog'
              ],
              bestOption: 'Optimized Microservices',
              riskAssessment: 'Low risk with proven patterns and high ROI'
            },
            alternativeOptions: {
              conservative: {
                name: 'Monolithic with Optimization',
                description: 'Keep monolithic structure but add caching and batching',
                quotaSavings: 25,
                implementationEffort: 'low',
                riskLevel: 'low',
                estimatedROI: 1.8
              },
              balanced: {
                name: 'Microservices Architecture',
                description: 'Decompose into microservices with event-driven communication',
                quotaSavings: 45,
                implementationEffort: 'medium',
                riskLevel: 'low',
                estimatedROI: 3.2
              },
              bold: {
                name: 'Serverless Event-Driven',
                description: 'Full serverless architecture with event sourcing',
                quotaSavings: 65,
                implementationEffort: 'high',
                riskLevel: 'medium',
                estimatedROI: 4.8
              }
            },
            metadata: {
              originalIntent: args.intent,
              optimizationApplied: ['microservices', 'event-driven', 'caching', 'batching'],
              consultingTechniquesUsed: ['MECE', 'ValueDriverTree', 'OptionFraming'],
              estimatedQuotaUsage: {
                vibesConsumed: 110,
                specsConsumed: 25,
                estimatedCost: 550,
                confidenceLevel: 'high',
                scenario: 'optimized',
                breakdown: []
              }
            }
          },
          efficiencySummary: {
            naiveApproach: {
              vibesConsumed: 200,
              specsConsumed: 15,
              estimatedCost: 1000,
              confidenceLevel: 'high',
              scenario: 'naive',
              breakdown: []
            },
            optimizedApproach: {
              vibesConsumed: 110,
              specsConsumed: 25,
              estimatedCost: 550,
              confidenceLevel: 'high',
              scenario: 'optimized',
              breakdown: []
            },
            savings: {
              vibeReduction: 45,
              specReduction: -67,
              costSavings: 45,
              totalSavingsPercentage: 45
            },
            optimizationNotes: [
              'Applied microservices decomposition',
              'Implemented event-driven inventory updates',
              'Added caching layer for product catalog',
              'Batched notification processing'
            ]
          }
        };

        mockPipeline.processIntent.mockResolvedValue(mockResult);

        const result = await server.handleOptimizeIntent(args, ecommerceContext);

        expect(mockPipeline.processIntent).toHaveBeenCalledWith(args.intent, args.parameters);
        expect(result.isError).toBeFalsy();
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe('json');
        
        const responseData = result.content[0].json;
        expect(responseData.success).toBe(true);
        expect(responseData.data.enhancedKiroSpec.name).toBe('E-commerce Platform');
        expect(responseData.data.enhancedKiroSpec.consultingSummary.techniquesApplied).toHaveLength(2);
        expect(responseData.data.efficiencySummary.savings.totalSavingsPercentage).toBe(45);
        
        // Verify metadata
        expect(result.metadata?.executionTime).toBeDefined();
        expect(result.metadata?.quotaUsed).toBeDefined();
      });
    });

    describe('Data Analytics Pipeline Intent', () => {
      const analyticsContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'analytics-session',
        timestamp: Date.now(),
        requestId: 'analytics-req-001',
        traceId: 'analytics-trace-001'
      };

      it('should optimize data analytics pipeline intent', async () => {
        const args: OptimizeIntentArgs = {
          intent: `Build a real-time data analytics pipeline that ingests data from multiple sources 
                   (APIs, databases, file uploads), processes it through various transformations, 
                   applies machine learning models for predictions, and outputs results to dashboards 
                   and reports. Include data validation, error handling, and monitoring.`,
          parameters: {
            expectedUserVolume: 500,
            performanceSensitivity: 'high'
          }
        };

        const mockResult = {
          success: true,
          enhancedKiroSpec: {
            name: 'Real-time Analytics Pipeline',
            description: 'Optimized data processing pipeline with ML integration',
            requirements: [
              { id: 'req-1', description: 'Multi-source data ingestion', priority: 'high' },
              { id: 'req-2', description: 'Real-time data transformation', priority: 'high' },
              { id: 'req-3', description: 'ML model integration', priority: 'medium' }
            ],
            design: { 
              overview: 'Stream processing architecture with batch optimization',
              components: ['ingestion-service', 'transform-service', 'ml-service', 'output-service']
            },
            tasks: [
              { id: 'task-1', description: 'Implement data ingestion layer', status: 'pending' },
              { id: 'task-2', description: 'Create transformation pipeline', status: 'pending' }
            ],
            consultingSummary: {
              executiveSummary: 'Analytics pipeline optimized with 55% quota reduction through batching and caching',
              keyFindings: [
                'Data transformation is the primary quota consumer',
                'ML model calls can be batched effectively',
                'Caching intermediate results reduces redundant processing'
              ],
              recommendations: [
                {
                  mainRecommendation: 'Implement micro-batching for data transformations',
                  supportingReasons: ['Reduces individual processing calls', 'Improves throughput'],
                  evidence: [
                    {
                      type: 'quantitative',
                      description: '70% reduction in transformation calls',
                      source: 'ValueDriverTree analysis',
                      confidence: 'high'
                    }
                  ],
                  expectedOutcome: '70% reduction in transformation processing costs'
                }
              ],
              techniquesApplied: [
                {
                  techniqueName: 'ValueDriverTree',
                  keyInsight: 'Data transformation drives 60% of quota consumption',
                  supportingData: { primaryDrivers: 4, savingsPotential: 55 },
                  actionableRecommendation: 'Implement micro-batching and result caching'
                }
              ],
              supportingEvidence: [
                {
                  type: 'quantitative',
                  description: 'Current pipeline would process 1000 records/hour individually',
                  source: 'Pipeline analysis',
                  confidence: 'high'
                }
              ]
            },
            roiAnalysis: {
              scenarios: [
                {
                  name: 'Individual Processing',
                  forecast: {
                    vibesConsumed: 150,
                    specsConsumed: 10,
                    estimatedCost: 750,
                    confidenceLevel: 'high',
                    scenario: 'naive',
                    breakdown: []
                  },
                  savingsPercentage: 0,
                  implementationEffort: 'low',
                  riskLevel: 'medium'
                },
                {
                  name: 'Micro-batch Processing',
                  forecast: {
                    vibesConsumed: 68,
                    specsConsumed: 18,
                    estimatedCost: 340,
                    confidenceLevel: 'high',
                    scenario: 'optimized',
                    breakdown: []
                  },
                  savingsPercentage: 55,
                  implementationEffort: 'medium',
                  riskLevel: 'low'
                }
              ],
              recommendations: [
                'Implement micro-batching for data transformations',
                'Add caching layer for ML model results',
                'Use stream processing for real-time requirements'
              ],
              bestOption: 'Micro-batch Processing',
              riskAssessment: 'Low risk with established streaming patterns'
            },
            alternativeOptions: {
              conservative: {
                name: 'Batch Processing',
                description: 'Traditional batch processing with scheduled runs',
                quotaSavings: 35,
                implementationEffort: 'low',
                riskLevel: 'low',
                estimatedROI: 2.1
              },
              balanced: {
                name: 'Micro-batch Processing',
                description: 'Small batch processing with near real-time results',
                quotaSavings: 55,
                implementationEffort: 'medium',
                riskLevel: 'low',
                estimatedROI: 3.8
              },
              bold: {
                name: 'Stream Processing',
                description: 'Full real-time stream processing with complex event processing',
                quotaSavings: 45,
                implementationEffort: 'high',
                riskLevel: 'medium',
                estimatedROI: 3.2
              }
            }
          }
        };

        mockPipeline.processIntent.mockResolvedValue(mockResult);

        const result = await server.handleOptimizeIntent(args, analyticsContext);

        expect(result.isError).toBeFalsy();
        expect(result.content[0].type).toBe('json');
        
        const responseData = result.content[0].json;
        expect(responseData.data.enhancedKiroSpec.name).toBe('Real-time Analytics Pipeline');
        expect(responseData.data.enhancedKiroSpec.roiAnalysis.scenarios).toHaveLength(2);
        expect(responseData.data.enhancedKiroSpec.roiAnalysis.scenarios[1].savingsPercentage).toBe(55);
      });
    });

    describe('IoT Device Management Intent', () => {
      it('should optimize IoT device management system intent', async () => {
        const args: OptimizeIntentArgs = {
          intent: `Create an IoT device management platform that handles device registration, 
                   real-time telemetry data collection, device configuration updates, 
                   firmware over-the-air updates, alert management, and device analytics. 
                   Support 50,000 devices sending data every 30 seconds.`,
          parameters: {
            expectedUserVolume: 50000,
            costConstraints: { maxCostDollars: 2000 },
            performanceSensitivity: 'high'
          }
        };

        const iotContext: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: 'iot-session',
          timestamp: Date.now()
        };

        const mockResult = {
          success: true,
          enhancedKiroSpec: {
            name: 'IoT Device Management Platform',
            description: 'Scalable IoT platform with optimized data ingestion',
            consultingSummary: {
              executiveSummary: 'IoT platform optimized for high-volume data ingestion with 60% quota reduction',
              keyFindings: [
                'Telemetry data ingestion is the primary cost driver',
                'Device configuration updates can be batched',
                'Alert processing can be optimized with rule engines'
              ],
              techniquesApplied: [
                {
                  techniqueName: 'MECE',
                  keyInsight: 'Device operations fall into distinct categories with no overlap',
                  supportingData: { categories: 5, coverage: 100 },
                  actionableRecommendation: 'Separate ingestion, configuration, and analytics pipelines'
                }
              ]
            },
            roiAnalysis: {
              scenarios: [
                {
                  name: 'Individual Device Processing',
                  forecast: {
                    vibesConsumed: 2400,
                    specsConsumed: 50,
                    estimatedCost: 12000,
                    confidenceLevel: 'high',
                    scenario: 'naive',
                    breakdown: []
                  },
                  savingsPercentage: 0,
                  implementationEffort: 'low',
                  riskLevel: 'high'
                },
                {
                  name: 'Batched Processing',
                  forecast: {
                    vibesConsumed: 960,
                    specsConsumed: 120,
                    estimatedCost: 4800,
                    confidenceLevel: 'high',
                    scenario: 'optimized',
                    breakdown: []
                  },
                  savingsPercentage: 60,
                  implementationEffort: 'medium',
                  riskLevel: 'low'
                }
              ],
              bestOption: 'Batched Processing',
              riskAssessment: 'Low risk with proven IoT patterns'
            }
          }
        };

        mockPipeline.processIntent.mockResolvedValue(mockResult);

        const result = await server.handleOptimizeIntent(args, iotContext);

        expect(result.isError).toBeFalsy();
        const responseData = result.content[0].json;
        expect(responseData.data.enhancedKiroSpec.name).toBe('IoT Device Management Platform');
        expect(responseData.data.enhancedKiroSpec.roiAnalysis.scenarios[1].savingsPercentage).toBe(60);
      });
    });
  });

  describe('Tool Response Validation', () => {
    it('should return properly formatted JSON responses for optimize_intent', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Simple test intent'
      };

      const mockContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Test Spec',
          description: 'Test description',
          requirements: [],
          design: { overview: 'Test design' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Test summary',
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

      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json).toBeDefined();
      expect(result.content[0].json.success).toBe(true);
      expect(result.content[0].json.data).toBeDefined();
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.quotaUsed).toBeDefined();
    });

    it('should return properly formatted markdown responses for analyze_workflow', async () => {
      const mockWorkflow: Workflow = {
        id: 'test-workflow',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'Test step', inputs: [], outputs: [], quotaCost: 5 }
        ],
        dataFlow: [],
        estimatedComplexity: 1
      };

      const args: AnalyzeWorkflowArgs = {
        workflow: mockWorkflow
      };

      const mockContext: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      const mockAnalysis: ConsultingAnalysis = {
        techniquesUsed: [
          { name: 'MECE', relevanceScore: 0.8, applicableScenarios: ['analysis'] }
        ],
        keyFindings: ['Test finding'],
        totalQuotaSavings: 20,
        implementationComplexity: 'low'
      };

      mockPipeline.analyzeWorkflow.mockResolvedValue(mockAnalysis);

      const result = await server.handleAnalyzeWorkflow(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toBeDefined();
      expect(result.content[0].markdown).toContain('Test finding');
      expect(result.metadata?.executionTime).toBeDefined();
    });

    it('should handle error responses with proper format', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Test intent that will fail'
      };

      const mockContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'test-session',
        timestamp: Date.now()
      };

      mockPipeline.processIntent.mockRejectedValue(new Error('Test error'));

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json.error).toBe(true);
      expect(result.content[0].json.message).toContain('Test error');
      expect(result.metadata?.executionTime).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle pipeline timeout gracefully', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Complex intent that times out'
      };

      const mockContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'timeout-session',
        timestamp: Date.now()
      };

      mockPipeline.processIntent.mockRejectedValue(new Error('Request timeout'));

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.message).toContain('timeout');
      
      // Verify error logging
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('optimize_intent handler failed')
      );
    });

    it('should handle invalid workflow structures', async () => {
      const invalidWorkflow = {
        // Missing required fields
        steps: []
      } as unknown as Workflow;

      const args: AnalyzeWorkflowArgs = {
        workflow: invalidWorkflow
      };

      const mockContext: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'invalid-session',
        timestamp: Date.now()
      };

      mockPipeline.analyzeWorkflow.mockRejectedValue(new Error('Invalid workflow structure'));

      const result = await server.handleAnalyzeWorkflow(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.message).toContain('Invalid workflow structure');
    });

    it('should handle resource exhaustion scenarios', async () => {
      const args: GenerateROIArgs = {
        workflow: {
          id: 'resource-test',
          steps: [
            { id: 'step-1', type: 'vibe', description: 'Test', inputs: [], outputs: [], quotaCost: 10 }
          ],
          dataFlow: [],
          estimatedComplexity: 1
        }
      };

      const mockContext: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'resource-session',
        timestamp: Date.now()
      };

      mockPipeline.generateROIAnalysis.mockRejectedValue(
        new Error('Insufficient resources: Memory limit exceeded')
      );

      const result = await server.handleGenerateROI(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].json.message).toContain('Insufficient resources');
    });
  });

  describe('Performance and Metrics', () => {
    it('should track execution times and quota usage', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Performance test intent'
      };

      const mockContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'perf-session',
        timestamp: Date.now()
      };

      const mockResult = {
        success: true,
        enhancedKiroSpec: {
          name: 'Performance Test',
          description: 'Test',
          requirements: [],
          design: { overview: 'Test' },
          tasks: [],
          consultingSummary: {
            executiveSummary: 'Test',
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
        },
        efficiencySummary: {
          optimizedApproach: {
            vibesConsumed: 10,
            specsConsumed: 5,
            estimatedCost: 50,
            confidenceLevel: 'high',
            scenario: 'optimized',
            breakdown: []
          }
        }
      };

      mockPipeline.processIntent.mockResolvedValue(mockResult);

      const result = await server.handleOptimizeIntent(args, mockContext);

      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.quotaUsed).toBeDefined();
      expect(result.metadata?.quotaUsed).toBe(10); // From efficiencySummary.optimizedApproach.vibesConsumed
    });

    it('should update server performance metrics', async () => {
      const initialStatus = server.getStatus();
      const initialRequests = initialStatus.performance.totalRequests;

      // Simulate successful request
      const updateMetrics = (server as any).updateMetrics;
      updateMetrics.call(server, 250, false); // 250ms response time, no error

      const updatedStatus = server.getStatus();
      expect(updatedStatus.performance.totalRequests).toBeGreaterThan(initialRequests);
      expect(updatedStatus.performance.averageResponseTime).toBeGreaterThan(0);
      expect(updatedStatus.performance.errorRate).toBeLessThanOrEqual(100);
    });

    it('should log performance metrics for monitoring', async () => {
      const args: GenerateROIArgs = {
        workflow: {
          id: 'metrics-test',
          steps: [
            { id: 'step-1', type: 'spec', description: 'Test', inputs: [], outputs: [], quotaCost: 3 }
          ],
          dataFlow: [],
          estimatedComplexity: 1
        }
      };

      const mockContext: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'metrics-session',
        timestamp: Date.now()
      };

      const mockROIAnalysis = {
        scenarios: [
          {
            name: 'Test Scenario',
            forecast: { vibesConsumed: 5, specsConsumed: 2, estimatedCost: 25, confidenceLevel: 'high', scenario: 'naive', breakdown: [] },
            savingsPercentage: 0,
            implementationEffort: 'none',
            riskLevel: 'none'
          }
        ],
        recommendations: ['Test recommendation'],
        bestOption: 'Test Scenario',
        riskAssessment: 'Low risk'
      };

      mockPipeline.generateROIAnalysis.mockResolvedValue(mockROIAnalysis);

      await server.handleGenerateROI(args, mockContext);

      // Verify performance logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ROI analysis completed')
      );
    });
  });

  describe('Server Health and Status', () => {
    it('should report healthy status when functioning normally', () => {
      const status = server.getStatus();

      expect(status.status).toBe('healthy');
      expect(status.toolsRegistered).toBe(10);
      expect(status.performance).toBeDefined();
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track uptime correctly', async () => {
      const initialStatus = server.getStatus();
      const initialUptime = initialStatus.uptime;

      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedStatus = server.getStatus();
      expect(updatedStatus.uptime).toBeGreaterThan(initialUptime);
    });

    it('should handle server startup and shutdown', async () => {
      // Test server startup
      await expect(server.start()).resolves.not.toThrow();

      // Verify startup logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MCP Server started successfully')
      );

      // Test server shutdown
      await expect(server.stop()).resolves.not.toThrow();

      // Verify shutdown logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MCP Server stopped')
      );
    });
  });
});