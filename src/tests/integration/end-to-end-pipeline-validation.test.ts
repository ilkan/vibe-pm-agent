// End-to-end validation tests for AI agent pipeline

import { PMAgentMCPServer } from '../../mcp/server';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { 
  MCPServerOptions,
  MCPToolContext,
  OptimizeIntentArgs,
  AnalyzeWorkflowArgs,
  GenerateROIArgs,
  ConsultingSummaryArgs
} from '../../models/mcp';
import { Workflow, OptimizedWorkflow } from '../../models/workflow';
import { ConsultingAnalysis } from '../../components/business-analyzer';
import { QuotaForecast, ROIAnalysis } from '../../models/quota';
import { ConsultingSummary } from '../../models/consulting';
import { EnhancedKiroSpec } from '../../models/spec';

// Real pipeline integration (no mocks for end-to-end testing)
describe('End-to-End Pipeline Validation', () => {
  let server: PMAgentMCPServer;
  let pipeline: AIAgentPipeline;

  beforeEach(() => {
    const options: MCPServerOptions = {
      enableLogging: false,
      enableMetrics: true
    };
    
    server = new PMAgentMCPServer(options);
    pipeline = new AIAgentPipeline();
  });

  describe('Performance Benchmarks', () => {
    it('should complete simple intent optimization within performance thresholds', async () => {
      const startTime = Date.now();
      
      const args: OptimizeIntentArgs = {
        intent: 'Create a simple user registration system with email verification',
        parameters: {
          expectedUserVolume: 100,
          performanceSensitivity: 'medium'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'perf-test-simple',
        timestamp: startTime,
        requestId: 'perf-req-001',
        traceId: 'perf-trace-001'
      };

      const result = await server.handleOptimizeIntent(args, context);
      const executionTime = Date.now() - startTime;

      // Performance assertions
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.isError).toBeFalsy();
      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.executionTime).toBeLessThan(5000);

      // Validate response structure
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json.success).toBe(true);
      expect(result.content[0].json.data.enhancedKiroSpec).toBeDefined();
    });

    it('should handle complex intent optimization within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const complexIntent = `
        Create a comprehensive e-commerce platform with the following features:
        - Multi-tenant architecture supporting 1000+ merchants
        - Real-time inventory management across multiple warehouses
        - Advanced search with ML-powered recommendations
        - Payment processing with multiple gateways and fraud detection
        - Order management with complex fulfillment workflows
        - Customer service integration with chatbots and human agents
        - Analytics dashboard with real-time reporting
        - Mobile app with offline capabilities
        - Integration with 20+ third-party services (shipping, accounting, marketing)
        - Multi-language and multi-currency support
        - Advanced security with OAuth2, rate limiting, and audit logging
      `;

      const args: OptimizeIntentArgs = {
        intent: complexIntent,
        parameters: {
          expectedUserVolume: 10000,
          costConstraints: { maxCostDollars: 1000 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'perf-test-complex',
        timestamp: startTime,
        requestId: 'perf-req-002',
        traceId: 'perf-trace-002'
      };

      const result = await server.handleOptimizeIntent(args, context);
      const executionTime = Date.now() - startTime;

      // Performance assertions for complex scenarios
      expect(executionTime).toBeLessThan(15000); // Should complete within 15 seconds for complex intent
      expect(result.isError).toBeFalsy();
      expect(result.metadata?.executionTime).toBeDefined();

      // Validate comprehensive response
      const responseData = result.content[0].json;
      expect(responseData.data.enhancedKiroSpec.consultingSummary).toBeDefined();
      expect(responseData.data.enhancedKiroSpec.roiAnalysis).toBeDefined();
      expect(responseData.data.enhancedKiroSpec.alternativeOptions).toBeDefined();
      expect(responseData.data.efficiencySummary).toBeDefined();
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentRequests = 5;
      const startTime = Date.now();

      const requests = Array.from({ length: concurrentRequests }, (_, index) => {
        const args: OptimizeIntentArgs = {
          intent: `Create a microservice for ${['user management', 'product catalog', 'order processing', 'payment handling', 'notification service'][index]}`,
          parameters: {
            expectedUserVolume: 1000,
            performanceSensitivity: 'medium'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `concurrent-session-${index}`,
          timestamp: Date.now(),
          requestId: `concurrent-req-${index}`,
          traceId: `concurrent-trace-${index}`
        };

        return server.handleOptimizeIntent(args, context);
      });

      const results = await Promise.all(requests);
      const totalExecutionTime = Date.now() - startTime;

      // Performance assertions for concurrent processing
      expect(totalExecutionTime).toBeLessThan(20000); // All requests should complete within 20 seconds
      
      // Validate all requests succeeded
      results.forEach((result, index) => {
        expect(result.isError).toBeFalsy();
        expect(result.content[0].json.success).toBe(true);
        expect(result.metadata?.executionTime).toBeDefined();
      });

      // Verify server metrics were updated
      const serverStatus = server.getStatus();
      expect(serverStatus.performance.totalRequests).toBeGreaterThanOrEqual(concurrentRequests);
      expect(serverStatus.performance.averageResponseTime).toBeGreaterThan(0);
    });

    it('should benchmark workflow analysis performance', async () => {
      const complexWorkflow: Workflow = {
        id: 'complex-benchmark-workflow',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'User input validation', inputs: [], outputs: ['validated-input'], quotaCost: 3 },
          { id: 'step-2', type: 'vibe', description: 'Business logic processing', inputs: ['validated-input'], outputs: ['processed-data'], quotaCost: 5 },
          { id: 'step-3', type: 'spec', description: 'Data transformation', inputs: ['processed-data'], outputs: ['transformed-data'], quotaCost: 2 },
          { id: 'step-4', type: 'vibe', description: 'ML model inference', inputs: ['transformed-data'], outputs: ['predictions'], quotaCost: 8 },
          { id: 'step-5', type: 'spec', description: 'Result formatting', inputs: ['predictions'], outputs: ['formatted-results'], quotaCost: 1 },
          { id: 'step-6', type: 'vibe', description: 'Notification sending', inputs: ['formatted-results'], outputs: [], quotaCost: 4 },
          { id: 'step-7', type: 'spec', description: 'Audit logging', inputs: ['formatted-results'], outputs: [], quotaCost: 1 },
          { id: 'step-8', type: 'vibe', description: 'Cache update', inputs: ['formatted-results'], outputs: [], quotaCost: 2 }
        ],
        dataFlow: [
          { from: 'step-1', to: 'step-2', dataType: 'validated-input', required: true },
          { from: 'step-2', to: 'step-3', dataType: 'processed-data', required: true },
          { from: 'step-3', to: 'step-4', dataType: 'transformed-data', required: true },
          { from: 'step-4', to: 'step-5', dataType: 'predictions', required: true },
          { from: 'step-5', to: 'step-6', dataType: 'formatted-results', required: true },
          { from: 'step-5', to: 'step-7', dataType: 'formatted-results', required: false },
          { from: 'step-5', to: 'step-8', dataType: 'formatted-results', required: false }
        ],
        estimatedComplexity: 8
      };

      const startTime = Date.now();

      const args: AnalyzeWorkflowArgs = {
        workflow: complexWorkflow,
        techniques: ['MECE', 'ValueDriverTree', 'ImpactEffort']
      };

      const context: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'workflow-perf-test',
        timestamp: startTime,
        requestId: 'workflow-perf-req-001',
        traceId: 'workflow-perf-trace-001'
      };

      const result = await server.handleAnalyzeWorkflow(args, context);
      const executionTime = Date.now() - startTime;

      // Performance assertions
      expect(executionTime).toBeLessThan(8000); // Should complete within 8 seconds
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toBeDefined();
      expect(result.metadata?.executionTime).toBeDefined();
    });
  });

  describe('Quota Estimation Accuracy', () => {
    it('should provide accurate quota estimates for simple workflows', async () => {
      const simpleIntent = 'Create a basic CRUD API for user management with authentication';
      
      const args: OptimizeIntentArgs = {
        intent: simpleIntent,
        parameters: {
          expectedUserVolume: 500,
          performanceSensitivity: 'medium'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'quota-accuracy-simple',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const efficiencySummary = responseData.data.efficiencySummary;

      // Validate quota estimates are reasonable for simple CRUD API
      expect(efficiencySummary.naiveApproach.vibesConsumed).toBeGreaterThan(0);
      expect(efficiencySummary.naiveApproach.vibesConsumed).toBeLessThan(50); // Should be reasonable for simple API
      expect(efficiencySummary.optimizedApproach.vibesConsumed).toBeLessThan(efficiencySummary.naiveApproach.vibesConsumed);
      
      // Validate cost estimates
      expect(efficiencySummary.naiveApproach.estimatedCost).toBeGreaterThan(0);
      expect(efficiencySummary.optimizedApproach.estimatedCost).toBeLessThan(efficiencySummary.naiveApproach.estimatedCost);
      
      // Validate savings calculations
      expect(efficiencySummary.savings.totalSavingsPercentage).toBeGreaterThan(0);
      expect(efficiencySummary.savings.totalSavingsPercentage).toBeLessThan(100);
      expect(efficiencySummary.savings.costSavings).toBeGreaterThan(0);
    });

    it('should provide accurate quota estimates for complex data processing workflows', async () => {
      const dataProcessingIntent = `
        Build a real-time data processing pipeline that:
        - Ingests data from 5 different APIs every minute
        - Processes 10,000 records per hour through ML models
        - Stores results in multiple databases
        - Sends notifications for anomalies
        - Generates hourly reports
        - Maintains data quality checks
      `;

      const args: OptimizeIntentArgs = {
        intent: dataProcessingIntent,
        parameters: {
          expectedUserVolume: 10000,
          costConstraints: { maxCostDollars: 500 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'quota-accuracy-complex',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const efficiencySummary = responseData.data.efficiencySummary;

      // Validate quota estimates reflect complexity
      expect(efficiencySummary.naiveApproach.vibesConsumed).toBeGreaterThan(50); // Should be higher for complex processing
      expect(efficiencySummary.naiveApproach.vibesConsumed).toBeLessThan(1000); // But still reasonable
      
      // Validate optimization provides significant savings for complex workflows
      const savingsPercentage = efficiencySummary.savings.totalSavingsPercentage;
      expect(savingsPercentage).toBeGreaterThan(20); // Should achieve at least 20% savings
      expect(savingsPercentage).toBeLessThan(80); // But not unrealistically high
      
      // Validate cost constraints are considered
      expect(efficiencySummary.optimizedApproach.estimatedCost).toBeLessThanOrEqual((args.parameters!.costConstraints as any).maxCostDollars * 1.1); // Allow 10% tolerance
    });

    it('should validate quota breakdown accuracy', async () => {
      const workflow: Workflow = {
        id: 'quota-breakdown-test',
        steps: [
          { id: 'step-1', type: 'vibe', description: 'Data ingestion', inputs: [], outputs: ['raw-data'], quotaCost: 10 },
          { id: 'step-2', type: 'vibe', description: 'Data validation', inputs: ['raw-data'], outputs: ['validated-data'], quotaCost: 5 },
          { id: 'step-3', type: 'spec', description: 'Data transformation', inputs: ['validated-data'], outputs: ['transformed-data'], quotaCost: 3 },
          { id: 'step-4', type: 'vibe', description: 'ML processing', inputs: ['transformed-data'], outputs: ['results'], quotaCost: 15 },
          { id: 'step-5', type: 'spec', description: 'Result storage', inputs: ['results'], outputs: [], quotaCost: 2 }
        ],
        dataFlow: [],
        estimatedComplexity: 5
      };

      const args: GenerateROIArgs = {
        workflow
      };

      const context: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'quota-breakdown-test',
        timestamp: Date.now()
      };

      const result = await server.handleGenerateROI(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const roiAnalysis = responseData.data.roiAnalysis;

      // Validate ROI scenarios
      expect(roiAnalysis.scenarios).toHaveLength(2); // Should have at least current and optimized scenarios
      
      const currentScenario = roiAnalysis.scenarios.find((s: any) => s.name.toLowerCase().includes('current') || s.name.toLowerCase().includes('naive'));
      const optimizedScenario = roiAnalysis.scenarios.find((s: any) => s.name.toLowerCase().includes('optimized'));
      
      expect(currentScenario).toBeDefined();
      expect(optimizedScenario).toBeDefined();
      
      // Validate quota calculations match workflow steps
      const totalQuotaCost = workflow.steps.reduce((sum, step) => sum + step.quotaCost, 0);
      expect(currentScenario.forecast.vibesConsumed + currentScenario.forecast.specsConsumed).toBeGreaterThanOrEqual(totalQuotaCost * 0.8); // Allow some variance
      
      // Validate optimization provides savings
      expect(optimizedScenario.savingsPercentage).toBeGreaterThan(0);
      expect(optimizedScenario.forecast.estimatedCost).toBeLessThan(currentScenario.forecast.estimatedCost);
    });
  });

  describe('Consulting Analysis Accuracy', () => {
    it('should apply appropriate consulting techniques based on intent complexity', async () => {
      const strategicIntent = `
        Design a digital transformation strategy for a traditional retail company 
        moving to e-commerce. Include organizational change management, technology 
        modernization, customer experience optimization, and operational efficiency improvements.
      `;

      const args: OptimizeIntentArgs = {
        intent: strategicIntent,
        parameters: {
          expectedUserVolume: 5000,
          performanceSensitivity: 'medium'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'consulting-accuracy-strategic',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const consultingSummary = responseData.data.enhancedKiroSpec.consultingSummary;

      // Validate appropriate techniques were selected for strategic intent
      expect(consultingSummary.techniquesApplied).toHaveLength(2); // Should apply 2-3 techniques as per requirements
      
      const techniqueNames = consultingSummary.techniquesApplied.map((t: any) => t.techniqueName);
      expect(techniqueNames).toContain('MECE'); // Should use MECE for complex strategic analysis
      
      // Validate executive summary quality
      expect(consultingSummary.executiveSummary).toBeDefined();
      expect(consultingSummary.executiveSummary.length).toBeGreaterThan(50); // Should be substantial
      expect(consultingSummary.executiveSummary.toLowerCase()).toContain('transformation'); // Should reference the intent
      
      // Validate recommendations are actionable
      expect(consultingSummary.recommendations).toHaveLength(1); // Should have at least one recommendation
      consultingSummary.recommendations.forEach((rec: any) => {
        expect(rec.mainRecommendation).toBeDefined();
        expect(rec.supportingReasons).toHaveLength(2); // Should have supporting reasons
        expect(rec.expectedOutcome).toBeDefined();
      });
    });

    it('should provide accurate technique insights for technical workflows', async () => {
      const technicalWorkflow: Workflow = {
        id: 'technical-analysis-test',
        steps: [
          { id: 'api-call-1', type: 'vibe', description: 'Fetch user data', inputs: [], outputs: ['user-data'], quotaCost: 3 },
          { id: 'api-call-2', type: 'vibe', description: 'Fetch user preferences', inputs: [], outputs: ['preferences'], quotaCost: 3 },
          { id: 'api-call-3', type: 'vibe', description: 'Fetch user history', inputs: [], outputs: ['history'], quotaCost: 4 },
          { id: 'processing-1', type: 'vibe', description: 'Merge user data', inputs: ['user-data', 'preferences', 'history'], outputs: ['merged-data'], quotaCost: 5 },
          { id: 'ml-inference', type: 'vibe', description: 'Generate recommendations', inputs: ['merged-data'], outputs: ['recommendations'], quotaCost: 8 },
          { id: 'formatting', type: 'spec', description: 'Format response', inputs: ['recommendations'], outputs: ['formatted-response'], quotaCost: 2 }
        ],
        dataFlow: [],
        estimatedComplexity: 6
      };

      const args: AnalyzeWorkflowArgs = {
        workflow: technicalWorkflow,
        techniques: ['ValueDriverTree', 'ImpactEffort']
      };

      const context: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'technical-analysis-test',
        timestamp: Date.now()
      };

      const result = await server.handleAnalyzeWorkflow(args, context);
      expect(result.isError).toBeFalsy();

      const markdownContent = result.content[0].markdown;
      
      // Validate analysis identifies key optimization opportunities
      expect(markdownContent).toContain('optimization'); // Should mention optimization opportunities
      expect(markdownContent).toContain('batching'); // Should identify batching opportunities for multiple API calls
      expect(markdownContent).toContain('25'); // Should show quota savings (totalQuotaSavings from workflow)
      
      // Validate technique-specific insights
      expect(markdownContent).toContain('ValueDriverTree'); // Should reference applied technique
      expect(markdownContent).toContain('API calls'); // Should identify API calls as cost drivers
    });

    it('should validate option framing provides realistic alternatives', async () => {
      const scalabilityIntent = `
        Build a system that can handle 1 million concurrent users with real-time 
        messaging, live updates, and complex business logic processing.
      `;

      const args: OptimizeIntentArgs = {
        intent: scalabilityIntent,
        parameters: {
          expectedUserVolume: 1000000,
          costConstraints: { maxCostDollars: 5000 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'option-framing-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const alternativeOptions = responseData.data.enhancedKiroSpec.alternativeOptions;

      // Validate three options are provided
      expect(alternativeOptions.conservative).toBeDefined();
      expect(alternativeOptions.balanced).toBeDefined();
      expect(alternativeOptions.bold).toBeDefined();

      // Validate option characteristics
      expect(alternativeOptions.conservative.riskLevel).toBe('low');
      expect(alternativeOptions.conservative.implementationEffort).toBe('low');
      expect(alternativeOptions.conservative.quotaSavings).toBeLessThan(alternativeOptions.balanced.quotaSavings);

      expect(alternativeOptions.balanced.riskLevel).toBe('low');
      expect(alternativeOptions.balanced.implementationEffort).toBe('medium');
      expect(alternativeOptions.balanced.quotaSavings).toBeLessThan(alternativeOptions.bold.quotaSavings);

      expect(alternativeOptions.bold.implementationEffort).toBe('high');
      expect(alternativeOptions.bold.quotaSavings).toBeGreaterThan(alternativeOptions.balanced.quotaSavings);
      expect(alternativeOptions.bold.estimatedROI).toBeGreaterThan(alternativeOptions.conservative.estimatedROI);

      // Validate ROI calculations are realistic
      expect(alternativeOptions.conservative.estimatedROI).toBeGreaterThan(1.0);
      expect(alternativeOptions.conservative.estimatedROI).toBeLessThan(10.0);
      expect(alternativeOptions.bold.estimatedROI).toBeLessThan(20.0); // Should be ambitious but realistic
    });
  });

  describe('Spec Format Compliance', () => {
    it('should generate Kiro-compliant spec format', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Create a task management system with user authentication and real-time collaboration',
        parameters: {
          expectedUserVolume: 1000,
          performanceSensitivity: 'medium'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'spec-compliance-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate required Kiro spec fields
      expect(enhancedKiroSpec.name).toBeDefined();
      expect(enhancedKiroSpec.name).toBeTruthy();
      expect(enhancedKiroSpec.description).toBeDefined();
      expect(enhancedKiroSpec.description).toBeTruthy();
      
      expect(enhancedKiroSpec.requirements).toBeDefined();
      expect(Array.isArray(enhancedKiroSpec.requirements)).toBe(true);
      
      expect(enhancedKiroSpec.design).toBeDefined();
      expect(enhancedKiroSpec.design.overview).toBeDefined();
      
      expect(enhancedKiroSpec.tasks).toBeDefined();
      expect(Array.isArray(enhancedKiroSpec.tasks)).toBe(true);

      // Validate enhanced fields
      expect(enhancedKiroSpec.consultingSummary).toBeDefined();
      expect(enhancedKiroSpec.roiAnalysis).toBeDefined();
      expect(enhancedKiroSpec.alternativeOptions).toBeDefined();

      // Validate metadata
      expect(enhancedKiroSpec.metadata).toBeDefined();
      expect(enhancedKiroSpec.metadata.originalIntent).toBe(args.intent);
      expect(enhancedKiroSpec.metadata.optimizationApplied).toBeDefined();
      expect(Array.isArray(enhancedKiroSpec.metadata.optimizationApplied)).toBe(true);
      expect(enhancedKiroSpec.metadata.consultingTechniquesUsed).toBeDefined();
      expect(Array.isArray(enhancedKiroSpec.metadata.consultingTechniquesUsed)).toBe(true);
    });

    it('should validate spec completeness for complex requirements', async () => {
      const complexIntent = `
        Build a multi-tenant SaaS platform for project management with:
        - Role-based access control with custom permissions
        - Real-time collaboration with conflict resolution
        - Advanced reporting with custom dashboards
        - Integration with 15+ third-party tools
        - Mobile apps for iOS and Android
        - API for external integrations
        - Advanced search with full-text indexing
        - Automated workflows and notifications
        - Data export/import capabilities
        - Compliance with SOC2 and GDPR
      `;

      const args: OptimizeIntentArgs = {
        intent: complexIntent,
        parameters: {
          expectedUserVolume: 50000,
          costConstraints: { maxCostDollars: 2000 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'spec-completeness-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate comprehensive requirements coverage
      expect(enhancedKiroSpec.requirements.length).toBeGreaterThan(5); // Should have multiple requirements for complex system
      
      // Validate requirements reference key aspects of the intent
      const requirementTexts = enhancedKiroSpec.requirements.map((req: any) => req.description.toLowerCase()).join(' ');
      expect(requirementTexts).toContain('authentication'); // Should cover auth requirements
      expect(requirementTexts).toContain('integration'); // Should cover integration requirements
      expect(requirementTexts).toContain('mobile'); // Should cover mobile requirements

      // Validate design addresses complexity
      expect(enhancedKiroSpec.design.overview).toBeDefined();
      expect(enhancedKiroSpec.design.overview.length).toBeGreaterThan(100); // Should be detailed for complex system
      
      // Validate tasks are comprehensive
      expect(enhancedKiroSpec.tasks.length).toBeGreaterThan(8); // Should have multiple tasks for complex system
      
      // Validate consulting analysis addresses complexity
      expect(enhancedKiroSpec.consultingSummary.keyFindings.length).toBeGreaterThan(2); // Should have multiple findings
      expect(enhancedKiroSpec.consultingSummary.techniquesApplied.length).toBeGreaterThanOrEqual(2); // Should apply 2-3 techniques
    });

    it('should ensure spec actionability and implementation readiness', async () => {
      const args: OptimizeIntentArgs = {
        intent: 'Create a REST API for a blog platform with CRUD operations, authentication, and search',
        parameters: {
          expectedUserVolume: 500,
          performanceSensitivity: 'medium'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'spec-actionability-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate tasks are actionable
      enhancedKiroSpec.tasks.forEach((task: any) => {
        expect(task.description).toBeDefined();
        expect(task.description.length).toBeGreaterThan(10); // Should be descriptive
        expect(task.status).toBeDefined(); // Should have status
      });

      // Validate requirements have clear acceptance criteria
      enhancedKiroSpec.requirements.forEach((req: any) => {
        expect(req.description).toBeDefined();
        expect(req.priority).toBeDefined(); // Should have priority
      });

      // Validate design provides implementation guidance
      expect(enhancedKiroSpec.design.overview).toBeDefined();
      if (enhancedKiroSpec.design.components) {
        expect(Array.isArray(enhancedKiroSpec.design.components)).toBe(true);
        expect(enhancedKiroSpec.design.components.length).toBeGreaterThan(0);
      }

      // Validate optimization notes are practical
      const efficiencySummary = responseData.data.efficiencySummary;
      expect(efficiencySummary.optimizationNotes).toBeDefined();
      expect(Array.isArray(efficiencySummary.optimizationNotes)).toBe(true);
      expect(efficiencySummary.optimizationNotes.length).toBeGreaterThan(0);
      
      efficiencySummary.optimizationNotes.forEach((note: string) => {
        expect(note.length).toBeGreaterThan(5); // Should be meaningful
        expect(note.toLowerCase()).toMatch(/(batch|cach|optim|effic|reduc)/); // Should contain optimization keywords
      });
    });
  });

  describe('Real-World Scenario Validation', () => {
    it('should handle fintech application requirements', async () => {
      const fintechIntent = `
        Build a personal finance management app with:
        - Bank account aggregation from multiple institutions
        - Transaction categorization with ML
        - Budget tracking and alerts
        - Investment portfolio analysis
        - Bill payment scheduling
        - Credit score monitoring
        - Financial goal setting and tracking
        - Secure document storage
        - Multi-factor authentication
        - Regulatory compliance (PCI DSS, SOX)
      `;

      const args: OptimizeIntentArgs = {
        intent: fintechIntent,
        parameters: {
          expectedUserVolume: 25000,
          costConstraints: { maxCostDollars: 1500 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'fintech-scenario-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate fintech-specific requirements are addressed
      const requirementTexts = enhancedKiroSpec.requirements.map((req: any) => req.description.toLowerCase()).join(' ');
      expect(requirementTexts).toContain('security'); // Should address security requirements
      expect(requirementTexts).toContain('compliance'); // Should address regulatory compliance
      expect(requirementTexts).toContain('authentication'); // Should address auth requirements

      // Validate consulting analysis addresses fintech complexity
      expect(enhancedKiroSpec.consultingSummary.techniquesApplied.length).toBeGreaterThanOrEqual(2);
      expect(enhancedKiroSpec.consultingSummary.keyFindings.length).toBeGreaterThan(3);

      // Validate ROI analysis considers high-volume scenario
      const roiAnalysis = enhancedKiroSpec.roiAnalysis;
      expect(roiAnalysis.scenarios.length).toBeGreaterThanOrEqual(2);
      
      // For high-volume fintech app, should show significant savings potential
      const optimizedScenario = roiAnalysis.scenarios.find((s: any) => s.name.toLowerCase().includes('balanced') || s.name.toLowerCase().includes('optimized'));
      expect(optimizedScenario?.savingsPercentage).toBeGreaterThan(15); // Should achieve meaningful savings for complex fintech app
    });

    it('should handle e-commerce platform requirements', async () => {
      const ecommerceIntent = `
        Build a comprehensive e-commerce platform with:
        - Multi-vendor marketplace functionality
        - Real-time inventory management across warehouses
        - Advanced product search with ML recommendations
        - Payment processing with multiple gateways
        - Order management with complex fulfillment workflows
        - Customer service integration with chatbots
        - Analytics dashboard with real-time reporting
        - Mobile app with offline capabilities
        - Integration with shipping providers and accounting systems
        - Multi-language and multi-currency support
      `;

      const args: OptimizeIntentArgs = {
        intent: ecommerceIntent,
        parameters: {
          expectedUserVolume: 50000,
          costConstraints: { maxCostDollars: 3000 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'ecommerce-scenario-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate e-commerce specific requirements
      expect(enhancedKiroSpec.requirements.length).toBeGreaterThan(6); // Should have comprehensive requirements
      
      const requirementTexts = enhancedKiroSpec.requirements.map((req: any) => req.description.toLowerCase()).join(' ');
      expect(requirementTexts).toContain('inventory'); // Should address inventory management
      expect(requirementTexts).toContain('payment'); // Should address payment processing
      expect(requirementTexts).toContain('search'); // Should address search functionality

      // Validate design addresses scalability
      expect(enhancedKiroSpec.design.overview.length).toBeGreaterThan(200); // Should be detailed for complex platform
      
      // Validate tasks are comprehensive for e-commerce complexity
      expect(enhancedKiroSpec.tasks.length).toBeGreaterThan(10); // Should have many tasks for complex platform

      // Validate efficiency summary shows significant optimization for complex system
      const efficiencySummary = responseData.data.efficiencySummary;
      expect(efficiencySummary.savings.totalSavingsPercentage).toBeGreaterThan(20); // Should achieve good savings for complex system
      expect(efficiencySummary.optimizationNotes.length).toBeGreaterThan(3); // Should have multiple optimization strategies
    });

    it('should handle healthcare application requirements with compliance focus', async () => {
      const healthcareIntent = `
        Create a healthcare management system with:
        - Patient record management with HIPAA compliance
        - Appointment scheduling and telemedicine integration
        - Electronic health records (EHR) with interoperability
        - Prescription management and drug interaction checking
        - Insurance verification and billing integration
        - Medical imaging storage and viewing
        - Clinical decision support systems
        - Audit logging for compliance tracking
        - Role-based access control for medical staff
        - Integration with laboratory and pharmacy systems
      `;

      const args: OptimizeIntentArgs = {
        intent: healthcareIntent,
        parameters: {
          expectedUserVolume: 10000,
          costConstraints: { maxCostDollars: 2000 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'healthcare-scenario-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate healthcare-specific compliance requirements
      const requirementTexts = enhancedKiroSpec.requirements.map((req: any) => req.description.toLowerCase()).join(' ');
      expect(requirementTexts).toContain('hipaa'); // Should address HIPAA compliance
      expect(requirementTexts).toContain('audit'); // Should address audit requirements
      expect(requirementTexts).toContain('access control'); // Should address security requirements

      // Validate consulting analysis addresses healthcare complexity and compliance
      const consultingSummary = enhancedKiroSpec.consultingSummary;
      expect(consultingSummary.techniquesApplied.length).toBeGreaterThanOrEqual(2);
      
      // Should mention compliance or regulatory considerations
      const summaryText = consultingSummary.executiveSummary.toLowerCase();
      expect(summaryText).toMatch(/(compliance|regulatory|security|privacy)/);

      // Validate tasks address compliance requirements
      const taskTexts = enhancedKiroSpec.tasks.map((task: any) => task.description.toLowerCase()).join(' ');
      expect(taskTexts).toMatch(/(security|compliance|audit|access)/);
    });

    it('should handle IoT platform requirements with scalability focus', async () => {
      const iotIntent = `
        Build an IoT device management platform with:
        - Device registration and provisioning at scale
        - Real-time data ingestion from millions of sensors
        - Time-series data storage and analytics
        - Device firmware update management
        - Alert and notification systems for anomalies
        - Dashboard for monitoring device health and metrics
        - API for third-party integrations
        - Edge computing support for local processing
        - Data retention and archival policies
        - Security management for device authentication
      `;

      const args: OptimizeIntentArgs = {
        intent: iotIntent,
        parameters: {
          expectedUserVolume: 1000000, // High volume for IoT
          costConstraints: { maxCostDollars: 5000 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'iot-scenario-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate IoT-specific scalability requirements
      const requirementTexts = enhancedKiroSpec.requirements.map((req: any) => req.description.toLowerCase()).join(' ');
      expect(requirementTexts).toContain('scale'); // Should address scalability
      expect(requirementTexts).toContain('real-time'); // Should address real-time processing
      expect(requirementTexts).toContain('device'); // Should address device management

      // For high-volume IoT, optimization should be significant
      const efficiencySummary = responseData.data.efficiencySummary;
      expect(efficiencySummary.savings.totalSavingsPercentage).toBeGreaterThan(25); // Should achieve high savings for high-volume system
      
      // Should have multiple optimization strategies for scalability
      expect(efficiencySummary.optimizationNotes.length).toBeGreaterThan(4);
      const optimizationText = efficiencySummary.optimizationNotes.join(' ').toLowerCase();
      expect(optimizationText).toMatch(/(batch|cach|parallel|async)/); // Should mention scalability techniques
    });

    it('should handle educational platform requirements', async () => {
      const educationIntent = `
        Create an online learning management system with:
        - Course creation and content management
        - Student enrollment and progress tracking
        - Interactive assignments and quizzing
        - Video streaming and content delivery
        - Discussion forums and collaboration tools
        - Gradebook and assessment management
        - Integration with external learning tools (LTI)
        - Mobile app for offline learning
        - Analytics for learning outcomes
        - Multi-tenant support for institutions
      `;

      const args: OptimizeIntentArgs = {
        intent: educationIntent,
        parameters: {
          expectedUserVolume: 20000,
          costConstraints: { maxCostDollars: 1000 },
          performanceSensitivity: 'medium'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'education-scenario-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      expect(result.isError).toBeFalsy();

      const responseData = result.content[0].json;
      const enhancedKiroSpec = responseData.data.enhancedKiroSpec;

      // Validate education-specific requirements
      const requirementTexts = enhancedKiroSpec.requirements.map((req: any) => req.description.toLowerCase()).join(' ');
      expect(requirementTexts).toContain('course'); // Should address course management
      expect(requirementTexts).toContain('student'); // Should address student management
      expect(requirementTexts).toContain('assessment'); // Should address assessment features

      // Validate design addresses educational workflow
      expect(enhancedKiroSpec.design.overview).toBeDefined();
      expect(enhancedKiroSpec.design.overview.length).toBeGreaterThan(100);

      // Should provide balanced optimization for medium performance sensitivity
      const efficiencySummary = responseData.data.efficiencySummary;
      expect(efficiencySummary.savings.totalSavingsPercentage).toBeGreaterThan(10);
      expect(efficiencySummary.savings.totalSavingsPercentage).toBeLessThan(60); // Should be moderate for medium sensitivity
    });
  });

  describe('Cross-Domain Validation', () => {
    it('should maintain consistency across different domain complexities', async () => {
      const testCases = [
        {
          name: 'Simple CRUD API',
          intent: 'Create a basic REST API for user management with CRUD operations',
          expectedComplexity: 'low',
          expectedSavings: { min: 5, max: 30 }
        },
        {
          name: 'Medium Complexity Service',
          intent: 'Build a notification service with email, SMS, and push notifications, including templates and scheduling',
          expectedComplexity: 'medium',
          expectedSavings: { min: 15, max: 45 }
        },
        {
          name: 'Complex Enterprise System',
          intent: 'Create a comprehensive ERP system with inventory, accounting, HR, and CRM modules with advanced reporting',
          expectedComplexity: 'high',
          expectedSavings: { min: 25, max: 65 }
        }
      ];

      const results = [];

      for (const testCase of testCases) {
        const args: OptimizeIntentArgs = {
          intent: testCase.intent,
          parameters: {
            expectedUserVolume: 1000,
            performanceSensitivity: 'medium'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `cross-domain-${testCase.name.toLowerCase().replace(/\s+/g, '-')}`,
          timestamp: Date.now()
        };

        const result = await server.handleOptimizeIntent(args, context);
        expect(result.isError).toBeFalsy();

        const responseData = result.content[0].json;
        results.push({
          name: testCase.name,
          complexity: testCase.expectedComplexity,
          savings: responseData.data.efficiencySummary.savings.totalSavingsPercentage,
          requirements: responseData.data.enhancedKiroSpec.requirements.length,
          tasks: responseData.data.enhancedKiroSpec.tasks.length,
          techniques: responseData.data.enhancedKiroSpec.consultingSummary.techniquesApplied.length
        });
      }

      // Validate complexity correlation
      expect(results[0].requirements).toBeLessThan(results[1].requirements); // Simple < Medium
      expect(results[1].requirements).toBeLessThan(results[2].requirements); // Medium < Complex
      
      expect(results[0].tasks).toBeLessThan(results[1].tasks); // Simple < Medium
      expect(results[1].tasks).toBeLessThan(results[2].tasks); // Medium < Complex

      // Validate savings are within expected ranges
      results.forEach((result, index) => {
        const expectedRange = testCases[index].expectedSavings;
        expect(result.savings).toBeGreaterThanOrEqual(expectedRange.min);
        expect(result.savings).toBeLessThanOrEqual(expectedRange.max);
      });

      // Validate consulting techniques scale with complexity
      expect(results[0].techniques).toBeGreaterThanOrEqual(2); // At least 2 techniques for simple
      expect(results[2].techniques).toBeGreaterThanOrEqual(2); // At least 2 techniques for complex
    });

    it('should handle edge cases and error scenarios gracefully', async () => {
      const edgeCases = [
        {
          name: 'Very short intent',
          intent: 'API',
          shouldSucceed: true,
          expectedBehavior: 'Should expand minimal intent into workable spec'
        },
        {
          name: 'Very long intent',
          intent: 'Create a ' + 'comprehensive '.repeat(100) + 'system with ' + 'advanced '.repeat(50) + 'features',
          shouldSucceed: true,
          expectedBehavior: 'Should handle long intent without performance degradation'
        },
        {
          name: 'Ambiguous intent',
          intent: 'Build something that does things for users in a way that works',
          shouldSucceed: true,
          expectedBehavior: 'Should provide clarifying assumptions and generic implementation'
        },
        {
          name: 'Technical jargon heavy',
          intent: 'Implement microservices architecture with event sourcing, CQRS, saga patterns, distributed caching, and polyglot persistence',
          shouldSucceed: true,
          expectedBehavior: 'Should understand technical concepts and provide appropriate optimization'
        }
      ];

      for (const edgeCase of edgeCases) {
        const args: OptimizeIntentArgs = {
          intent: edgeCase.intent,
          parameters: {
            expectedUserVolume: 1000,
            performanceSensitivity: 'medium'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `edge-case-${edgeCase.name.toLowerCase().replace(/\s+/g, '-')}`,
          timestamp: Date.now()
        };

        const startTime = Date.now();
        const result = await server.handleOptimizeIntent(args, context);
        const executionTime = Date.now() - startTime;

        if (edgeCase.shouldSucceed) {
          expect(result.isError).toBeFalsy();
          expect(executionTime).toBeLessThan(20000); // Should complete within 20 seconds even for edge cases
          
          const responseData = result.content[0].json;
          expect(responseData.data.enhancedKiroSpec).toBeDefined();
          expect(responseData.data.enhancedKiroSpec.requirements.length).toBeGreaterThan(0);
          expect(responseData.data.enhancedKiroSpec.tasks.length).toBeGreaterThan(0);
        } else {
          expect(result.isError).toBeTruthy();
        }
      }
    });
  });

  describe('Performance Regression Testing', () => {
    it('should maintain performance benchmarks over multiple runs', async () => {
      const benchmarkIntent = 'Create a social media platform with user profiles, posts, comments, likes, and real-time messaging';
      const runs = 5;
      const executionTimes: number[] = [];
      const quotaUsages: number[] = [];

      for (let i = 0; i < runs; i++) {
        const args: OptimizeIntentArgs = {
          intent: benchmarkIntent,
          parameters: {
            expectedUserVolume: 5000,
            performanceSensitivity: 'medium'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `benchmark-run-${i + 1}`,
          timestamp: Date.now()
        };

        const startTime = Date.now();
        const result = await server.handleOptimizeIntent(args, context);
        const executionTime = Date.now() - startTime;

        expect(result.isError).toBeFalsy();
        
        executionTimes.push(executionTime);
        quotaUsages.push(result.metadata?.quotaUsed || 0);
      }

      // Calculate performance statistics
      const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / runs;
      const maxExecutionTime = Math.max(...executionTimes);
      const minExecutionTime = Math.min(...executionTimes);
      const executionTimeVariance = executionTimes.reduce((acc, time) => acc + Math.pow(time - avgExecutionTime, 2), 0) / runs;

      // Performance assertions
      expect(avgExecutionTime).toBeLessThan(10000); // Average should be under 10 seconds
      expect(maxExecutionTime).toBeLessThan(15000); // Max should be under 15 seconds
      expect(executionTimeVariance).toBeLessThan(Math.pow(5000, 2)); // Variance should be reasonable (std dev < 5 seconds)

      // Quota usage should be consistent
      const avgQuotaUsage = quotaUsages.reduce((a, b) => a + b, 0) / runs;
      const quotaVariance = quotaUsages.reduce((acc, quota) => acc + Math.pow(quota - avgQuotaUsage, 2), 0) / runs;
      expect(quotaVariance).toBeLessThan(4); // Quota usage should be very consistent (std dev < 2)

      console.log(`Performance Benchmark Results:
        Average Execution Time: ${avgExecutionTime.toFixed(2)}ms
        Min/Max Execution Time: ${minExecutionTime}ms / ${maxExecutionTime}ms
        Execution Time Std Dev: ${Math.sqrt(executionTimeVariance).toFixed(2)}ms
        Average Quota Usage: ${avgQuotaUsage.toFixed(2)}
        Quota Usage Std Dev: ${Math.sqrt(quotaVariance).toFixed(2)}`);
    });

    it('should handle memory usage efficiently during extended operation', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const args: OptimizeIntentArgs = {
          intent: `Create microservice ${i + 1} for handling user data processing with caching and validation`,
          parameters: {
            expectedUserVolume: 1000,
            performanceSensitivity: 'medium'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `memory-test-${i + 1}`,
          timestamp: Date.now()
        };

        const result = await server.handleOptimizeIntent(args, context);
        expect(result.isError).toBeFalsy();

        // Force garbage collection if available (for testing)
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerIteration = memoryIncrease / iterations;

      // Memory usage should not grow excessively
      expect(memoryIncreasePerIteration).toBeLessThan(10 * 1024 * 1024); // Less than 10MB per iteration
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Total increase less than 50MB

      console.log(`Memory Usage Analysis:
        Initial Heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Final Heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Total Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
        Per Iteration: ${(memoryIncreasePerIteration / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Integration Validation', () => {
    it('should validate complete MCP tool integration workflow', async () => {
      // Step 1: Optimize intent
      const optimizeArgs: OptimizeIntentArgs = {
        intent: 'Create a task management API with user authentication, task CRUD operations, and team collaboration features',
        parameters: {
          expectedUserVolume: 2000,
          performanceSensitivity: 'medium'
        }
      };

      const optimizeContext: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'integration-workflow-test',
        timestamp: Date.now()
      };

      const optimizeResult = await server.handleOptimizeIntent(optimizeArgs, optimizeContext);
      expect(optimizeResult.isError).toBeFalsy();

      const optimizeData = optimizeResult.content[0].json;
      const enhancedSpec = optimizeData.data.enhancedKiroSpec;

      // Step 2: Analyze the generated workflow
      const workflow: Workflow = {
        id: 'integration-test-workflow',
        steps: enhancedSpec.tasks.slice(0, 5).map((task: any, index: number) => ({
          id: `step-${index + 1}`,
          type: index % 2 === 0 ? 'vibe' : 'spec',
          description: task.description,
          inputs: [],
          outputs: [],
          quotaCost: 3 + index
        })),
        dataFlow: [],
        estimatedComplexity: 5
      };

      const analyzeArgs: AnalyzeWorkflowArgs = {
        workflow,
        techniques: ['MECE', 'ValueDriverTree']
      };

      const analyzeContext: MCPToolContext = {
        toolName: 'analyze_workflow',
        sessionId: 'integration-workflow-test',
        timestamp: Date.now()
      };

      const analyzeResult = await server.handleAnalyzeWorkflow(analyzeArgs, analyzeContext);
      expect(analyzeResult.isError).toBeFalsy();

      // Step 3: Generate ROI analysis
      const roiArgs: GenerateROIArgs = {
        workflow
      };

      const roiContext: MCPToolContext = {
        toolName: 'generate_roi_analysis',
        sessionId: 'integration-workflow-test',
        timestamp: Date.now()
      };

      const roiResult = await server.handleGenerateROI(roiArgs, roiContext);
      expect(roiResult.isError).toBeFalsy();

      const roiData = roiResult.content[0].json;
      const roiAnalysis = roiData.data.roiAnalysis;

      // Step 4: Generate consulting summary
      const summaryArgs: ConsultingSummaryArgs = {
        analysis: {
          techniquesUsed: [
            { name: 'MECE', relevanceScore: 0.8, applicableScenarios: ['workflow analysis'] },
            { name: 'ValueDriverTree', relevanceScore: 0.7, applicableScenarios: ['cost optimization'] }
          ],
          keyFindings: ['Workflow has optimization potential', 'Batching opportunities identified'],
          totalQuotaSavings: 25,
          implementationComplexity: 'medium',
          zeroBasedSolution: undefined
        },
        techniques: ['MECE', 'ValueDriverTree']
      };

      const summaryContext: MCPToolContext = {
        toolName: 'get_consulting_summary',
        sessionId: 'integration-workflow-test',
        timestamp: Date.now()
      };

      const summaryResult = await server.handleConsultingSummary(summaryArgs, summaryContext);
      expect(summaryResult.isError).toBeFalsy();

      // Validate integration workflow results
      expect(enhancedSpec.name).toBeDefined();
      expect(enhancedSpec.requirements.length).toBeGreaterThan(0);
      expect(enhancedSpec.tasks.length).toBeGreaterThan(0);
      expect(roiAnalysis.scenarios.length).toBeGreaterThanOrEqual(2);
      expect(summaryResult.content[0].markdown).toBeDefined();
      expect(summaryResult.content[0].markdown!.length).toBeGreaterThan(100);

      // Validate data consistency across tools
      expect(roiAnalysis.scenarios.some((s: any) => s.savingsPercentage > 0)).toBe(true);
      expect(summaryResult.content[0].markdown!).toContain('MECE');
      expect(summaryResult.content[0].markdown!).toContain('ValueDriverTree');
    });
  });
});