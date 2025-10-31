/**
 * Integration Layer
 * 
 * Integrates all components: NIM, agents, Lambda, and infrastructure
 * Provides unified interface for the complete application workflow
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { ComprehensiveRequestHandler, HandlerConfig } from '../comprehensive-request-handler/index.js';
import { NIMServiceManager } from '../nim-service-manager/index.js';
import { SupervisorAgent } from '../supervisor-agent/index.js';
import { SecureCredentialManager } from '../secure-credential-manager/index.js';
import { CloudWatchMonitor } from '../cloudwatch-monitor/index.js';
import { HealthMonitor } from '../health-monitor/index.js';
import { AWSDocsMCP } from '../aws-docs-mcp-integration/index.js';

export interface IntegrationConfig {
  // NIM Configuration
  nim: {
    endpoint: string;
    model: string;
    apiKey?: string;
    timeout: number;
  };
  
  // AWS Configuration
  aws: {
    region: string;
    credentialsPath?: string;
    bedrockAgents: {
      businessStrategy: string;
      productDevelopment: string;
      executiveCommunications: string;
      interviewCoaching: string;
      citation: string;
    };
  };
  
  // Application Configuration
  application: {
    maxConcurrentRequests: number;
    requestTimeoutMs: number;
    enableCaching: boolean;
    enableAudit: boolean;
    enableMonitoring: boolean;
  };
  
  // Security Configuration
  security: {
    encryptionEnabled: boolean;
    tokenValidation: boolean;
    rateLimiting: boolean;
  };
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    nim: ComponentHealth;
    agents: ComponentHealth;
    lambda: ComponentHealth;
    infrastructure: ComponentHealth;
    monitoring: ComponentHealth;
  };
  metrics: SystemMetrics;
  timestamp: Date;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  errorRate?: number;
  details?: any;
}

export interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface IntegrationResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata: {
    requestId: string;
    processingTime: number;
    componentsUsed: string[];
    version: string;
  };
}

export class IntegrationLayer {
  private requestHandler: ComprehensiveRequestHandler;
  private nimService: NIMServiceManager;
  private supervisorAgent: SupervisorAgent;
  private credentialManager: SecureCredentialManager;
  private monitor: CloudWatchMonitor;
  private healthMonitor: HealthMonitor;
  private awsDocs: AWSDocsMCP;
  private initialized = false;
  private startTime: Date;

  constructor(private config: IntegrationConfig) {
    this.startTime = new Date();
  }

  /**
   * Initialize all components and establish connections
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Integration layer already initialized');
    }

    try {
      console.log('Initializing NVIDIA NIM Agentic Platform Integration Layer...');

      // Step 1: Initialize credential manager
      await this.initializeCredentialManager();
      
      // Step 2: Initialize monitoring if enabled
      if (this.config.application.enableMonitoring) {
        await this.initializeMonitoring();
      }
      
      // Step 3: Initialize NIM service
      await this.initializeNIMService();
      
      // Step 4: Initialize supervisor agent
      await this.initializeSupervisorAgent();
      
      // Step 5: Initialize AWS Docs MCP
      await this.initializeAWSDocsMCP();
      
      // Step 6: Initialize request handler
      await this.initializeRequestHandler();
      
      // Step 7: Initialize health monitoring
      await this.initializeHealthMonitoring();
      
      // Step 8: Perform initial health check
      const health = await this.checkSystemHealth();
      if (health.overall === 'unhealthy') {
        throw new Error(`System health check failed: ${JSON.stringify(health)}`);
      }

      this.initialized = true;
      console.log('Integration layer initialized successfully');
      
      // Log initialization metrics
      if (this.monitor) {
        await this.monitor.logCustomMetric('system_initialized', 1, {
          initializationTime: Date.now() - this.startTime.getTime(),
          componentsCount: this.getComponentCount()
        });
      }

    } catch (error) {
      console.error('Failed to initialize integration layer:', error);
      throw error;
    }
  }

  /**
   * Process any request through the integrated system
   */
  async processRequest(request: any, context: any = {}): Promise<IntegrationResponse> {
    if (!this.initialized) {
      throw new Error('Integration layer not initialized');
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Add integration metadata to context
      const enhancedContext = {
        ...context,
        integration: {
          version: '1.0.0',
          platform: 'nvidia-nim-agentic-platform',
          requestId
        }
      };

      // Process through comprehensive request handler
      const response = await this.requestHandler.handleRequest(request, enhancedContext);
      
      // Build integration response
      const integrationResponse: IntegrationResponse = {
        success: response.success,
        data: response.data,
        error: response.error?.message,
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          componentsUsed: this.getUsedComponents(response),
          version: '1.0.0'
        }
      };

      // Log success metrics
      if (this.monitor && response.success) {
        await this.monitor.logCustomMetric('request_processed', 1, {
          requestType: this.determineRequestType(request),
          processingTime: integrationResponse.metadata.processingTime,
          componentsUsed: integrationResponse.metadata.componentsUsed.length
        });
      }

      return integrationResponse;

    } catch (error) {
      // Log error metrics
      if (this.monitor) {
        await this.monitor.logCustomMetric('request_failed', 1, {
          error: error.message,
          requestType: this.determineRequestType(request)
        });
      }

      return {
        success: false,
        error: error.message,
        metadata: {
          requestId,
          processingTime: Date.now() - startTime,
          componentsUsed: ['integration_layer'],
          version: '1.0.0'
        }
      };
    }
  }

  /**
   * Get comprehensive system health status
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const healthChecks = await Promise.allSettled([
      this.checkNIMHealth(),
      this.checkAgentsHealth(),
      this.checkLambdaHealth(),
      this.checkInfrastructureHealth(),
      this.checkMonitoringHealth()
    ]);

    const [nimHealth, agentsHealth, lambdaHealth, infraHealth, monitoringHealth] = healthChecks.map(
      result => result.status === 'fulfilled' ? result.value : { status: 'unhealthy', details: 'Check failed' }
    );

    const components = {
      nim: nimHealth,
      agents: agentsHealth,
      lambda: lambdaHealth,
      infrastructure: infraHealth,
      monitoring: monitoringHealth
    };

    // Determine overall health
    const healthyComponents = Object.values(components).filter(c => c.status === 'healthy').length;
    const totalComponents = Object.values(components).length;
    
    let overall: SystemHealth['overall'];
    if (healthyComponents === totalComponents) {
      overall = 'healthy';
    } else if (healthyComponents >= totalComponents * 0.7) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      components,
      metrics: await this.getSystemMetrics(),
      timestamp: new Date()
    };
  }

  /**
   * Shutdown the integration layer gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('Shutting down integration layer...');

    try {
      // Stop health monitoring
      if (this.healthMonitor) {
        await this.healthMonitor.stop();
      }

      // Close monitoring connections
      if (this.monitor) {
        await this.monitor.close();
      }

      // Shutdown request handler
      if (this.requestHandler) {
        // Cancel active requests
        const systemStatus = this.requestHandler.getSystemStatus();
        console.log(`Cancelling ${systemStatus.activeRequests} active requests...`);
      }

      // Close credential manager
      if (this.credentialManager) {
        await this.credentialManager.close();
      }

      this.initialized = false;
      console.log('Integration layer shutdown complete');

    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }

  // Private initialization methods
  private async initializeCredentialManager(): Promise<void> {
    console.log('Initializing credential manager...');
    
    this.credentialManager = new SecureCredentialManager({
      encryptionEnabled: this.config.security.encryptionEnabled,
      rotationIntervalHours: 24,
      awsCredentialsPath: this.config.aws.credentialsPath
    });

    await this.credentialManager.initialize();
    console.log('Credential manager initialized');
  }

  private async initializeMonitoring(): Promise<void> {
    console.log('Initializing monitoring...');
    
    this.monitor = new CloudWatchMonitor({
      namespace: 'NVIDIA-NIM-Agentic-Platform',
      region: this.config.aws.region
    });

    await this.monitor.initialize();
    console.log('Monitoring initialized');
  }

  private async initializeNIMService(): Promise<void> {
    console.log('Initializing NIM service...');
    
    this.nimService = new NIMServiceManager({
      endpoint: this.config.nim.endpoint,
      model: this.config.nim.model,
      apiKey: this.config.nim.apiKey,
      timeout: this.config.nim.timeout,
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 1000,
        exponential: true
      }
    });

    // Test NIM connection
    const health = await this.nimService.checkHealth();
    if (!health.healthy) {
      throw new Error(`NIM service unhealthy: ${health.details}`);
    }

    console.log('NIM service initialized');
  }

  private async initializeSupervisorAgent(): Promise<void> {
    console.log('Initializing supervisor agent...');
    
    this.supervisorAgent = new SupervisorAgent({
      region: this.config.aws.region,
      maxConcurrentAgents: 5,
      loadBalancing: true,
      agents: this.config.aws.bedrockAgents
    });

    await this.supervisorAgent.initialize();
    console.log('Supervisor agent initialized');
  }

  private async initializeAWSDocsMCP(): Promise<void> {
    console.log('Initializing AWS Docs MCP...');
    
    this.awsDocs = new AWSDocsMCP({
      cacheEnabled: true,
      cacheTtlMs: 300000 // 5 minutes
    });

    await this.awsDocs.initialize();
    console.log('AWS Docs MCP initialized');
  }

  private async initializeRequestHandler(): Promise<void> {
    console.log('Initializing request handler...');
    
    const handlerConfig: HandlerConfig = {
      workflowConfig: {
        nimEndpoint: this.config.nim.endpoint,
        bedrockRegion: this.config.aws.region,
        maxRetries: 3,
        timeoutMs: this.config.application.requestTimeoutMs,
        enableMonitoring: this.config.application.enableMonitoring,
        enableRecovery: true
      },
      enableCaching: this.config.application.enableCaching,
      enableAudit: this.config.application.enableAudit,
      enablePerformanceTracking: true,
      maxConcurrentRequests: this.config.application.maxConcurrentRequests,
      requestTimeoutMs: this.config.application.requestTimeoutMs
    };

    this.requestHandler = new ComprehensiveRequestHandler(handlerConfig);
    console.log('Request handler initialized');
  }

  private async initializeHealthMonitoring(): Promise<void> {
    console.log('Initializing health monitoring...');
    
    this.healthMonitor = new HealthMonitor({
      checkIntervalMs: 30000, // 30 seconds
      components: ['nim', 'agents', 'lambda', 'infrastructure'],
      alertThresholds: {
        errorRate: 0.1, // 10%
        latency: 5000, // 5 seconds
        availability: 0.95 // 95%
      }
    });

    // Set up health check callbacks
    this.healthMonitor.onHealthChange((component, status) => {
      console.log(`Component ${component} health changed to ${status}`);
      if (this.monitor) {
        this.monitor.logCustomMetric('component_health_change', 1, { component, status });
      }
    });

    await this.healthMonitor.start();
    console.log('Health monitoring initialized');
  }

  // Health check methods
  private async checkNIMHealth(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      const health = await this.nimService.checkHealth();
      const latency = Date.now() - startTime;

      return {
        status: health.healthy ? 'healthy' : 'unhealthy',
        latency,
        details: health.details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error.message
      };
    }
  }

  private async checkAgentsHealth(): Promise<ComponentHealth> {
    try {
      const startTime = Date.now();
      const health = await this.supervisorAgent.checkHealth();
      const latency = Date.now() - startTime;

      return {
        status: health.healthy ? 'healthy' : 'unhealthy',
        latency,
        details: health.details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error.message
      };
    }
  }

  private async checkLambdaHealth(): Promise<ComponentHealth> {
    try {
      // Check request handler health
      const health = await this.requestHandler.healthCheck();
      
      return {
        status: health.status === 'healthy' ? 'healthy' : 'degraded',
        details: health.details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error.message
      };
    }
  }

  private async checkInfrastructureHealth(): Promise<ComponentHealth> {
    try {
      // Check AWS services connectivity
      const awsHealth = await this.credentialManager.healthCheck();
      
      return {
        status: awsHealth.healthy ? 'healthy' : 'unhealthy',
        details: awsHealth.details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error.message
      };
    }
  }

  private async checkMonitoringHealth(): Promise<ComponentHealth> {
    if (!this.monitor) {
      return { status: 'healthy', details: 'Monitoring disabled' };
    }

    try {
      const health = await this.monitor.healthCheck();
      return {
        status: health.healthy ? 'healthy' : 'unhealthy',
        details: health.details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error.message
      };
    }
  }

  // Utility methods
  private async getSystemMetrics(): Promise<SystemMetrics> {
    const systemStatus = this.requestHandler?.getSystemStatus() || {};
    const memoryUsage = process.memoryUsage();
    
    return {
      totalRequests: 0, // Would be tracked in a real implementation
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      activeConnections: systemStatus.activeRequests || 0,
      memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
      cpuUsage: process.cpuUsage().user / 1000000 // Convert to seconds
    };
  }

  private getComponentCount(): number {
    let count = 1; // Integration layer itself
    if (this.nimService) count++;
    if (this.supervisorAgent) count++;
    if (this.credentialManager) count++;
    if (this.monitor) count++;
    if (this.healthMonitor) count++;
    if (this.awsDocs) count++;
    if (this.requestHandler) count++;
    return count;
  }

  private getUsedComponents(response: any): string[] {
    const components = ['integration_layer'];
    
    if (response.metadata?.componentsInvolved) {
      components.push(...response.metadata.componentsInvolved);
    }
    
    return [...new Set(components)];
  }

  private determineRequestType(request: any): string {
    const content = JSON.stringify(request).toLowerCase();
    
    if (content.includes('market') || content.includes('business')) return 'business_analysis';
    if (content.includes('requirements') || content.includes('design')) return 'product_development';
    if (content.includes('executive') || content.includes('presentation')) return 'executive_communication';
    if (content.includes('interview') || content.includes('coaching')) return 'interview_coaching';
    if (content.includes('citation') || content.includes('reference')) return 'citation_validation';
    
    return 'general';
  }

  private generateRequestId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get integration layer status
   */
  getStatus(): any {
    return {
      initialized: this.initialized,
      uptime: this.initialized ? Date.now() - this.startTime.getTime() : 0,
      components: {
        nim: !!this.nimService,
        supervisor: !!this.supervisorAgent,
        credentials: !!this.credentialManager,
        monitoring: !!this.monitor,
        health: !!this.healthMonitor,
        awsDocs: !!this.awsDocs,
        requestHandler: !!this.requestHandler
      },
      config: {
        maxConcurrentRequests: this.config.application.maxConcurrentRequests,
        cachingEnabled: this.config.application.enableCaching,
        auditEnabled: this.config.application.enableAudit,
        monitoringEnabled: this.config.application.enableMonitoring
      }
    };
  }
}

export default IntegrationLayer;