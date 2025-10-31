/**
 * NVIDIA NIM Agentic Application
 * 
 * Main application entry point that demonstrates the complete workflow
 * integrating all components: NIM, agents, Lambda, and infrastructure.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { IntegrationLayer, IntegrationConfig } from '../components/integration-layer/index.js';
import { SecureCredentialManager } from '../components/secure-credential-manager/index.js';

export interface ApplicationConfig extends IntegrationConfig {
  // Application-specific settings
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    port?: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

export interface DemoRequest {
  type: 'business_analysis' | 'product_development' | 'executive_communication' | 'interview_coaching' | 'citation_validation';
  content: string;
  options?: {
    analysisDepth?: 'quick' | 'standard' | 'comprehensive';
    includeVisualizations?: boolean;
    outputFormat?: 'json' | 'markdown' | 'html';
  };
}

export class NVIDIANIMAgenticApplication {
  private integrationLayer: IntegrationLayer;
  private isRunning = false;
  private startTime: Date;

  constructor(private config: ApplicationConfig) {
    this.integrationLayer = new IntegrationLayer(config);
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Application is already running');
    }

    console.log(`Starting ${this.config.app.name} v${this.config.app.version}...`);
    console.log(`Environment: ${this.config.app.environment}`);
    
    this.startTime = new Date();

    try {
      // Initialize the integration layer
      await this.integrationLayer.initialize();
      
      // Perform initial system health check
      const health = await this.integrationLayer.checkSystemHealth();
      console.log('System Health:', JSON.stringify(health, null, 2));
      
      if (health.overall === 'unhealthy') {
        throw new Error('System health check failed - cannot start application');
      }

      this.isRunning = true;
      console.log(`${this.config.app.name} started successfully`);
      console.log(`Startup time: ${Date.now() - this.startTime.getTime()}ms`);

      // Run demonstration if in development mode
      if (this.config.app.environment === 'development') {
        await this.runDemonstration();
      }

    } catch (error) {
      console.error('Failed to start application:', error);
      throw error;
    }
  }

  /**
   * Stop the application
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(`Stopping ${this.config.app.name}...`);

    try {
      await this.integrationLayer.shutdown();
      this.isRunning = false;
      console.log('Application stopped successfully');
    } catch (error) {
      console.error('Error stopping application:', error);
      throw error;
    }
  }

  /**
   * Process a request through the complete system
   */
  async processRequest(request: DemoRequest, userId?: string): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Application is not running');
    }

    console.log(`Processing ${request.type} request...`);
    
    const context = {
      userId: userId || 'demo_user',
      sessionId: `session_${Date.now()}`,
      preferences: {
        analysisDepth: request.options?.analysisDepth || 'standard',
        includeVisualizations: request.options?.includeVisualizations || true,
        confidenceThreshold: 0.7,
        outputFormat: request.options?.outputFormat || 'json'
      }
    };

    const startTime = Date.now();
    
    try {
      const response = await this.integrationLayer.processRequest(request, context);
      const processingTime = Date.now() - startTime;
      
      console.log(`Request processed in ${processingTime}ms`);
      console.log('Response metadata:', response.metadata);
      
      return response;
    } catch (error) {
      console.error('Request processing failed:', error);
      throw error;
    }
  }

  /**
   * Get application status
   */
  getStatus(): any {
    return {
      name: this.config.app.name,
      version: this.config.app.version,
      environment: this.config.app.environment,
      running: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime.getTime() : 0,
      integration: this.integrationLayer.getStatus()
    };
  }

  /**
   * Get system health
   */
  async getHealth(): Promise<any> {
    if (!this.isRunning) {
      return { status: 'stopped' };
    }

    return await this.integrationLayer.checkSystemHealth();
  }

  /**
   * Run comprehensive demonstration of all capabilities
   */
  private async runDemonstration(): Promise<void> {
    console.log('\n=== Running NVIDIA NIM Agentic Platform Demonstration ===\n');

    const demoRequests: DemoRequest[] = [
      {
        type: 'business_analysis',
        content: 'Analyze the market opportunity for an AI-powered customer service chatbot in the e-commerce industry',
        options: { analysisDepth: 'comprehensive' }
      },
      {
        type: 'product_development',
        content: 'Generate requirements for a real-time collaboration platform with video conferencing capabilities',
        options: { analysisDepth: 'standard' }
      },
      {
        type: 'executive_communication',
        content: 'Create an executive summary for a new mobile app launch targeting millennials',
        options: { outputFormat: 'markdown' }
      },
      {
        type: 'interview_coaching',
        content: 'Prepare interview questions for a senior software engineer position focusing on system design',
        options: { analysisDepth: 'standard' }
      },
      {
        type: 'citation_validation',
        content: 'Validate citations in a research paper about machine learning applications in healthcare',
        options: { analysisDepth: 'comprehensive' }
      }
    ];

    for (let i = 0; i < demoRequests.length; i++) {
      const request = demoRequests[i];
      console.log(`\n--- Demo ${i + 1}: ${request.type.toUpperCase()} ---`);
      console.log(`Request: ${request.content}`);
      
      try {
        const response = await this.processRequest(request, 'demo_user');
        
        console.log(`✅ Success: ${response.success}`);
        console.log(`Processing Time: ${response.metadata.processingTime}ms`);
        console.log(`Components Used: ${response.metadata.componentsUsed.join(', ')}`);
        
        if (response.data?.metadata) {
          console.log(`Confidence Score: ${response.data.metadata.confidenceScore || 'N/A'}`);
          console.log(`Agents Involved: ${response.data.metadata.agentsInvolved?.length || 0}`);
          console.log(`NIM Invocations: ${response.data.metadata.nimInvocations || 0}`);
        }
        
        // Show sample of response data
        if (response.data?.result) {
          const resultPreview = JSON.stringify(response.data.result, null, 2).substring(0, 200);
          console.log(`Result Preview: ${resultPreview}...`);
        }
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
      
      // Wait between requests to avoid overwhelming the system
      if (i < demoRequests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n=== Demonstration Complete ===\n');
    
    // Show final system health
    const finalHealth = await this.getHealth();
    console.log('Final System Health:', JSON.stringify(finalHealth, null, 2));
  }
}

/**
 * Create default configuration for the application
 */
export function createDefaultConfig(): ApplicationConfig {
  return {
    app: {
      name: 'NVIDIA NIM Agentic Platform',
      version: '1.0.0',
      environment: 'development',
      logLevel: 'info'
    },
    nim: {
      endpoint: process.env.NIM_ENDPOINT || 'http://localhost:1234',
      model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
      timeout: 30000
    },
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      credentialsPath: process.env.AWS_CREDENTIALS_PATH || '~/.aws/credentials',
      bedrockAgents: {
        businessStrategy: process.env.BUSINESS_STRATEGY_AGENT_ID || 'IBQRX8MZJJ',
        productDevelopment: process.env.PRODUCT_DEVELOPMENT_AGENT_ID || 'CEW45LTT2P',
        executiveCommunications: process.env.EXECUTIVE_COMMUNICATIONS_AGENT_ID || 'ULX1RJGKCR',
        caseStudyCoaching: process.env.CASE_STUDY_COACHING_AGENT_ID || 'PDZPQTNLYH',
        citation: process.env.CITATION_AGENT_ID || 'CITATION001'
      }
    },
    application: {
      maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
      requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '60000'),
      enableCaching: process.env.ENABLE_CACHING !== 'false',
      enableAudit: process.env.ENABLE_AUDIT !== 'false',
      enableMonitoring: process.env.ENABLE_MONITORING !== 'false'
    },
    security: {
      encryptionEnabled: process.env.ENCRYPTION_ENABLED !== 'false',
      tokenValidation: process.env.TOKEN_VALIDATION !== 'false',
      rateLimiting: process.env.RATE_LIMITING !== 'false'
    }
  };
}

/**
 * Main entry point for running the application
 */
export async function main(): Promise<void> {
  const config = createDefaultConfig();
  const app = new NVIDIANIMAgenticApplication(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    try {
      await app.stop();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    try {
      await app.stop();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  try {
    await app.start();
    
    // Keep the application running
    console.log('Application is running. Press Ctrl+C to stop.');
    
    // In a real application, you might start an HTTP server here
    // For now, we'll just keep the process alive
    await new Promise(() => {}); // Keep running indefinitely
    
  } catch (error) {
    console.error('Application failed to start:', error);
    process.exit(1);
  }
}

// Export the application class and utilities
export default NVIDIANIMAgenticApplication;

// Run the application if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}