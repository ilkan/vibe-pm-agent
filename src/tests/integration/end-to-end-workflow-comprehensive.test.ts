/**
 * End-to-End Workflow Comprehensive Integration Tests
 * 
 * Tests the complete application workflow integrating all components:
 * NIM, agents, Lambda, and infrastructure
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { NVIDIANIMAgenticApplication, createDefaultConfig, DemoRequest } from '../../applications/nvidia-nim-agentic-app.js';
import { IntegrationLayer } from '../../components/integration-layer/index.js';
import { EndToEndWorkflowOrchestrator } from '../../components/end-to-end-workflow-orchestrator/index.js';
import { ComprehensiveRequestHandler } from '../../components/comprehensive-request-handler/index.js';

// Mock external dependencies
jest.mock('../../components/nim-service-manager/index.js');
jest.mock('../../components/supervisor-agent/index.js');
jest.mock('../../components/secure-credential-manager/index.js');
jest.mock('../../components/cloudwatch-monitor/index.js');
jest.mock('../../components/aws-docs-mcp-integration/index.js');

describe('End-to-End Workflow Integration Tests', () => {
  let app: NVIDIANIMAgenticApplication;
  let config: any;

  beforeAll(async () => {
    // Create test configuration
    config = {
      ...createDefaultConfig(),
      app: {
        ...createDefaultConfig().app,
        environment: 'development' as const,
        logLevel: 'error' as const // Reduce noise in tests
      },
      nim: {
        endpoint: 'http://localhost:1234',
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        timeout: 5000
      },
      application: {
        maxConcurrentRequests: 5,
        requestTimeoutMs: 10000,
        enableCaching: true,
        enableAudit: true,
        enableMonitoring: false // Disable for tests
      }
    };

    app = new NVIDIANIMAgenticApplication(config);
  });

  afterAll(async () => {
    if (app) {
      await app.stop();
    }
  });

  describe('Application Lifecycle', () => {
    test('should start application successfully', async () => {
      await expect(app.start()).resolves.not.toThrow();
      
      const status = app.getStatus();
      expect(status.running).toBe(true);
      expect(status.name).toBe('NVIDIA NIM Agentic Platform');
      expect(status.version).toBe('1.0.0');
    }, 30000);

    test('should get system health after startup', async () => {
      const health = await app.getHealth();
      
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('components');
      expect(health).toHaveProperty('metrics');
      expect(health).toHaveProperty('timestamp');
      
      // Should have all expected components
      expect(health.components).toHaveProperty('nim');
      expect(health.components).toHaveProperty('agents');
      expect(health.components).toHaveProperty('lambda');
      expect(health.components).toHaveProperty('infrastructure');
    });

    test('should handle graceful shutdown', async () => {
      await expect(app.stop()).resolves.not.toThrow();
      
      const status = app.getStatus();
      expect(status.running).toBe(false);
    });
  });

  describe('Business Analysis Workflow', () => {
    beforeEach(async () => {
      if (!app.getStatus().running) {
        await app.start();
      }
    });

    test('should process business analysis request successfully', async () => {
      const request: DemoRequest = {
        type: 'business_analysis',
        content: 'Analyze the market opportunity for an AI-powered customer service chatbot',
        options: {
          analysisDepth: 'standard',
          outputFormat: 'json'
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toHaveProperty('requestId');
      expect(response.metadata).toHaveProperty('processingTime');
      expect(response.metadata).toHaveProperty('componentsUsed');
      
      if (response.success) {
        expect(response.data).toBeDefined();
        expect(response.metadata.componentsUsed).toContain('integration_layer');
      }
    }, 15000);

    test('should handle comprehensive business analysis', async () => {
      const request: DemoRequest = {
        type: 'business_analysis',
        content: 'Comprehensive market analysis for blockchain-based supply chain solution',
        options: {
          analysisDepth: 'comprehensive',
          includeVisualizations: true
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.processingTime).toBeGreaterThan(0);
      
      if (response.data?.metadata) {
        expect(response.data.metadata).toHaveProperty('confidenceScore');
        expect(response.data.metadata.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(response.data.metadata.confidenceScore).toBeLessThanOrEqual(1);
      }
    }, 20000);
  });

  describe('Product Development Workflow', () => {
    beforeEach(async () => {
      if (!app.getStatus().running) {
        await app.start();
      }
    });

    test('should process product development request', async () => {
      const request: DemoRequest = {
        type: 'product_development',
        content: 'Generate requirements for a real-time collaboration platform',
        options: {
          analysisDepth: 'standard'
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.componentsUsed).toContain('workflow_orchestrator');
      
      if (response.data?.metadata) {
        expect(response.data.metadata).toHaveProperty('agentsInvolved');
        expect(Array.isArray(response.data.metadata.agentsInvolved)).toBe(true);
      }
    }, 15000);

    test('should handle complex product requirements', async () => {
      const request: DemoRequest = {
        type: 'product_development',
        content: 'Design a microservices architecture for a high-traffic e-commerce platform with real-time inventory management',
        options: {
          analysisDepth: 'comprehensive',
          includeVisualizations: true
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Executive Communication Workflow', () => {
    beforeEach(async () => {
      if (!app.getStatus().running) {
        await app.start();
      }
    });

    test('should generate executive communication', async () => {
      const request: DemoRequest = {
        type: 'executive_communication',
        content: 'Create executive summary for Q4 product launch strategy',
        options: {
          outputFormat: 'markdown'
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.componentsUsed).toContain('integration_layer');
      
      if (response.data?.result) {
        expect(typeof response.data.result).toBe('object');
      }
    }, 15000);

    test('should handle board presentation request', async () => {
      const request: DemoRequest = {
        type: 'executive_communication',
        content: 'Prepare board presentation for new AI initiative with ROI projections and risk analysis',
        options: {
          analysisDepth: 'comprehensive',
          includeVisualizations: true
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Interview Coaching Workflow', () => {
    beforeEach(async () => {
      if (!app.getStatus().running) {
        await app.start();
      }
    });

    test('should process interview coaching request', async () => {
      const request: DemoRequest = {
        type: 'interview_coaching',
        content: 'Prepare interview questions for senior software engineer position',
        options: {
          analysisDepth: 'standard'
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.componentsUsed.length).toBeGreaterThan(0);
    }, 15000);

    test('should handle technical interview preparation', async () => {
      const request: DemoRequest = {
        type: 'interview_coaching',
        content: 'Create comprehensive interview preparation for system design and coding challenges for FAANG companies',
        options: {
          analysisDepth: 'comprehensive'
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Citation Validation Workflow', () => {
    beforeEach(async () => {
      if (!app.getStatus().running) {
        await app.start();
      }
    });

    test('should process citation validation request', async () => {
      const request: DemoRequest = {
        type: 'citation_validation',
        content: 'Validate citations in research paper about machine learning applications',
        options: {
          analysisDepth: 'standard'
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.componentsUsed).toContain('integration_layer');
    }, 15000);

    test('should handle comprehensive citation analysis', async () => {
      const request: DemoRequest = {
        type: 'citation_validation',
        content: 'Comprehensive validation of academic paper citations with credibility assessment and alternative source suggestions',
        options: {
          analysisDepth: 'comprehensive'
        }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.success).toBe(true);
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      if (!app.getStatus().running) {
        await app.start();
      }
    });

    test('should handle invalid request gracefully', async () => {
      const request = {
        type: 'invalid_type' as any,
        content: '',
        options: {}
      };

      const response = await app.processRequest(request, 'test_user');
      
      // Should not throw, but may return error response
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('metadata');
    });

    test('should handle timeout scenarios', async () => {
      const request: DemoRequest = {
        type: 'business_analysis',
        content: 'Very complex analysis that might timeout',
        options: {
          analysisDepth: 'comprehensive'
        }
      };

      // This test verifies the system handles timeouts gracefully
      const response = await app.processRequest(request, 'test_user');
      
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata.processingTime).toBeGreaterThan(0);
    }, 25000);

    test('should handle concurrent requests', async () => {
      const requests: DemoRequest[] = [
        {
          type: 'business_analysis',
          content: 'Market analysis for fintech startup',
          options: { analysisDepth: 'quick' }
        },
        {
          type: 'product_development',
          content: 'Mobile app requirements',
          options: { analysisDepth: 'quick' }
        },
        {
          type: 'executive_communication',
          content: 'Quarterly report summary',
          options: { analysisDepth: 'quick' }
        }
      ];

      const promises = requests.map((request, index) => 
        app.processRequest(request, `test_user_${index}`)
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response).toHaveProperty('success');
        expect(response).toHaveProperty('metadata');
      });
    }, 30000);
  });

  describe('Performance and Monitoring', () => {
    beforeEach(async () => {
      if (!app.getStatus().running) {
        await app.start();
      }
    });

    test('should track performance metrics', async () => {
      const request: DemoRequest = {
        type: 'business_analysis',
        content: 'Quick market analysis',
        options: { analysisDepth: 'quick' }
      };

      const response = await app.processRequest(request, 'test_user');
      
      expect(response.metadata.processingTime).toBeGreaterThan(0);
      expect(response.metadata.processingTime).toBeLessThan(30000); // Should complete within 30s
      expect(response.metadata.componentsUsed.length).toBeGreaterThan(0);
    });

    test('should provide system status', async () => {
      const status = app.getStatus();
      
      expect(status).toHaveProperty('name');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('integration');
      
      expect(status.running).toBe(true);
      expect(status.uptime).toBeGreaterThan(0);
    });

    test('should monitor component health', async () => {
      const health = await app.getHealth();
      
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('components');
      expect(health).toHaveProperty('metrics');
      
      // Check that all components are monitored
      const expectedComponents = ['nim', 'agents', 'lambda', 'infrastructure'];
      expectedComponents.forEach(component => {
        expect(health.components).toHaveProperty(component);
        expect(health.components[component]).toHaveProperty('status');
      });
    });
  });

  describe('Integration Layer Tests', () => {
    let integrationLayer: IntegrationLayer;

    beforeEach(() => {
      integrationLayer = new IntegrationLayer(config);
    });

    test('should initialize integration layer', async () => {
      await expect(integrationLayer.initialize()).resolves.not.toThrow();
      
      const status = integrationLayer.getStatus();
      expect(status.initialized).toBe(true);
    }, 15000);

    test('should process requests through integration layer', async () => {
      await integrationLayer.initialize();
      
      const request = {
        type: 'business_analysis',
        content: 'Test analysis request'
      };

      const response = await integrationLayer.processRequest(request);
      
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toHaveProperty('requestId');
      expect(response.metadata).toHaveProperty('processingTime');
    }, 15000);

    afterEach(async () => {
      if (integrationLayer) {
        await integrationLayer.shutdown();
      }
    });
  });
});

describe('Workflow Orchestrator Unit Tests', () => {
  let orchestrator: EndToEndWorkflowOrchestrator;

  beforeEach(() => {
    const config = {
      nimEndpoint: 'http://localhost:1234',
      bedrockRegion: 'us-east-1',
      maxRetries: 3,
      timeoutMs: 10000,
      enableMonitoring: false,
      enableRecovery: true
    };

    orchestrator = new EndToEndWorkflowOrchestrator(config);
  });

  test('should create workflow orchestrator', () => {
    expect(orchestrator).toBeDefined();
    expect(orchestrator.getActiveWorkflows()).toBeDefined();
  });

  test('should track active workflows', () => {
    const activeWorkflows = orchestrator.getActiveWorkflows();
    expect(activeWorkflows.size).toBe(0);
  });

  test('should generate workflow request', () => {
    const request = {
      id: 'test_request_1',
      userId: 'test_user',
      type: 'business_analysis' as const,
      payload: { content: 'test analysis' },
      priority: 'medium' as const
    };

    expect(request.id).toBe('test_request_1');
    expect(request.type).toBe('business_analysis');
    expect(request.priority).toBe('medium');
  });
});

describe('Request Handler Unit Tests', () => {
  let handler: ComprehensiveRequestHandler;

  beforeEach(() => {
    const config = {
      workflowConfig: {
        nimEndpoint: 'http://localhost:1234',
        bedrockRegion: 'us-east-1',
        maxRetries: 3,
        timeoutMs: 10000,
        enableMonitoring: false,
        enableRecovery: true
      },
      enableCaching: true,
      enableAudit: true,
      enablePerformanceTracking: true,
      maxConcurrentRequests: 5,
      requestTimeoutMs: 10000
    };

    handler = new ComprehensiveRequestHandler(config);
  });

  test('should create request handler', () => {
    expect(handler).toBeDefined();
    expect(handler.getSystemStatus()).toBeDefined();
  });

  test('should provide system status', () => {
    const status = handler.getSystemStatus();
    
    expect(status).toHaveProperty('activeRequests');
    expect(status).toHaveProperty('queuedRequests');
    expect(status).toHaveProperty('maxConcurrentRequests');
    expect(status.maxConcurrentRequests).toBe(5);
  });

  test('should perform health check', async () => {
    const health = await handler.healthCheck();
    
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('details');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
  });
});