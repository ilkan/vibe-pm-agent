// Performance benchmarks for AI Agent Pipeline

import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';
import { PMAgentMCPServer } from '../../mcp/server';
import { 
  OptimizeIntentArgs,
  MCPToolContext,
  MCPServerOptions
} from '../../models/mcp';

describe('AI Agent Pipeline Performance Benchmarks', () => {
  let pipeline: AIAgentPipeline;
  let server: PMAgentMCPServer;

  beforeEach(() => {
    const options: MCPServerOptions = {
      enableLogging: false,
      enableMetrics: true
    };
    
    pipeline = new AIAgentPipeline();
    server = new PMAgentMCPServer(options);
  });

  describe('Throughput Benchmarks', () => {
    it('should handle high-frequency requests efficiently', async () => {
      const requestCount = 10;
      const maxConcurrency = 3;
      const startTime = Date.now();
      
      const requests = Array.from({ length: requestCount }, (_, index) => ({
        intent: `Create microservice ${index + 1} for data processing with validation and caching`,
        parameters: {
          expectedUserVolume: 1000,
          performanceSensitivity: 'medium' as const
        }
      }));

      // Process requests in batches to control concurrency
      const results: any[] = [];
      for (let i = 0; i < requestCount; i += maxConcurrency) {
        const batch = requests.slice(i, i + maxConcurrency);
        const batchPromises = batch.map(async (req, batchIndex) => {
          const args: OptimizeIntentArgs = req;
          const context: MCPToolContext = {
            toolName: 'optimize_intent',
            sessionId: `throughput-test-${i + batchIndex}`,
            timestamp: Date.now()
          };
          
          return server.handleOptimizeIntent(args, context);
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const totalTime = Date.now() - startTime;
      const averageTimePerRequest = totalTime / requestCount;
      const requestsPerSecond = (requestCount / totalTime) * 1000;

      // Performance assertions
      expect(averageTimePerRequest).toBeLessThan(10000); // Average under 10 seconds per request
      expect(requestsPerSecond).toBeGreaterThan(0.05); // At least 0.05 requests per second
      expect(results.every(r => !r.isError)).toBe(true); // All requests should succeed

      console.log(`Throughput Benchmark Results:
        Total Requests: ${requestCount}
        Total Time: ${totalTime}ms
        Average Time per Request: ${averageTimePerRequest.toFixed(2)}ms
        Requests per Second: ${requestsPerSecond.toFixed(3)}
        Success Rate: ${(results.filter(r => !r.isError).length / requestCount * 100).toFixed(1)}%`);
    });

    it('should maintain performance under memory pressure', async () => {
      const largeIntentBase = `
        Create a comprehensive enterprise system with the following components:
        - User management with role-based access control and multi-factor authentication
        - Document management with version control and collaboration features
        - Workflow automation with complex business rules and approval processes
        - Reporting and analytics with real-time dashboards and data visualization
        - Integration with external systems via REST APIs and message queues
        - Audit logging and compliance tracking for regulatory requirements
        - Mobile applications for iOS and Android with offline capabilities
        - Email and notification systems with template management
        - Search functionality with full-text indexing and advanced filtering
        - Data backup and disaster recovery with automated failover
      `;

      // Create large intents to test memory handling
      const largeIntents = Array.from({ length: 3 }, (_, index) => 
        largeIntentBase + ` Additional requirements for system ${index + 1}: ` + 
        Array.from({ length: 10 }, (_, reqIndex) => 
          `Requirement ${reqIndex + 1} with detailed specifications and complex business logic.`
        ).join(' ')
      );

      const results: any[] = [];
      const memoryUsages: number[] = [];

      for (let i = 0; i < largeIntents.length; i++) {
        const initialMemory = process.memoryUsage();
        
        const args: OptimizeIntentArgs = {
          intent: largeIntents[i],
          parameters: {
            expectedUserVolume: 10000,
            costConstraints: { maxCostDollars: 2000 },
            performanceSensitivity: 'high'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `memory-pressure-test-${i + 1}`,
          timestamp: Date.now()
        };

        const startTime = Date.now();
        const result = await server.handleOptimizeIntent(args, context);
        const executionTime = Date.now() - startTime;

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        results.push({
          success: !result.isError,
          executionTime,
          memoryIncrease,
          intentLength: largeIntents[i].length
        });

        memoryUsages.push(finalMemory.heapUsed);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Performance assertions
      const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
      const maxMemoryIncrease = Math.max(...results.map(r => r.memoryIncrease));
      const successRate = results.filter(r => r.success).length / results.length;

      expect(avgExecutionTime).toBeLessThan(25000); // Average under 25 seconds for large intents
      expect(maxMemoryIncrease).toBeLessThan(100 * 1024 * 1024); // Max 100MB increase per request
      expect(successRate).toBeGreaterThanOrEqual(0.8); // At least 80% success rate

      console.log(`Memory Pressure Test Results:
        Average Execution Time: ${avgExecutionTime.toFixed(2)}ms
        Max Memory Increase: ${(maxMemoryIncrease / 1024 / 1024).toFixed(2)}MB
        Success Rate: ${(successRate * 100).toFixed(1)}%
        Average Intent Length: ${(results.reduce((sum, r) => sum + r.intentLength, 0) / results.length).toFixed(0)} chars`);
    });
  });

  describe('Latency Benchmarks', () => {
    it('should achieve target latency for different complexity levels', async () => {
      const testCases = [
        {
          name: 'Simple',
          intent: 'Create a basic REST API for user authentication',
          targetLatency: 8000, // 8 seconds
          volume: 100
        },
        {
          name: 'Medium',
          intent: 'Build a content management system with user roles, file uploads, and search functionality',
          targetLatency: 12000, // 12 seconds
          volume: 1000
        },
        {
          name: 'Complex',
          intent: 'Create an enterprise resource planning system with inventory, accounting, HR, and CRM modules',
          targetLatency: 20000, // 20 seconds
          volume: 10000
        }
      ];

      const results: any[] = [];

      for (const testCase of testCases) {
        const iterations = 2;
        const latencies = [];

        for (let i = 0; i < iterations; i++) {
          const args: OptimizeIntentArgs = {
            intent: testCase.intent,
            parameters: {
              expectedUserVolume: testCase.volume,
              performanceSensitivity: 'medium'
            }
          };

          const context: MCPToolContext = {
            toolName: 'optimize_intent',
            sessionId: `latency-test-${testCase.name.toLowerCase()}-${i + 1}`,
            timestamp: Date.now()
          };

          const startTime = Date.now();
          const result = await server.handleOptimizeIntent(args, context);
          const latency = Date.now() - startTime;

          expect(result.isError).toBeFalsy();
          latencies.push(latency);
        }

        const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / iterations;
        const maxLatency = Math.max(...latencies);
        const minLatency = Math.min(...latencies);

        results.push({
          name: testCase.name,
          avgLatency,
          maxLatency,
          minLatency,
          targetLatency: testCase.targetLatency,
          meetsTarget: avgLatency <= testCase.targetLatency
        });

        // Performance assertions
        expect(avgLatency).toBeLessThanOrEqual(testCase.targetLatency);
        expect(maxLatency).toBeLessThanOrEqual(testCase.targetLatency * 1.5); // Allow 50% variance for max
      }

      console.log('Latency Benchmark Results:');
      results.forEach(result => {
        console.log(`  ${result.name}:
          Average: ${result.avgLatency.toFixed(2)}ms
          Min/Max: ${result.minLatency}ms / ${result.maxLatency}ms
          Target: ${result.targetLatency}ms
          Meets Target: ${result.meetsTarget ? '✓' : '✗'}`);
      });
    });

    it('should maintain consistent latency under load', async () => {
      const baseIntent = 'Create a social media platform with user profiles, posts, and messaging';
      const loadLevels = [1, 2]; // Concurrent requests
      const results: any[] = [];

      for (const concurrency of loadLevels) {
        const iterations = 2;
        const latencies = [];

        for (let iteration = 0; iteration < iterations; iteration++) {
          const promises = Array.from({ length: concurrency }, (_, index) => {
            const args: OptimizeIntentArgs = {
              intent: `${baseIntent} - Load test ${iteration + 1}-${index + 1}`,
              parameters: {
                expectedUserVolume: 2000,
                performanceSensitivity: 'medium'
              }
            };

            const context: MCPToolContext = {
              toolName: 'optimize_intent',
              sessionId: `load-test-${concurrency}-${iteration + 1}-${index + 1}`,
              timestamp: Date.now()
            };

            const startTime = Date.now();
            return server.handleOptimizeIntent(args, context).then(result => ({
              result,
              latency: Date.now() - startTime
            }));
          });

          const batchResults = await Promise.all(promises);
          const batchLatencies = batchResults.map(r => r.latency);
          const batchSuccess = batchResults.every(r => !r.result.isError);

          expect(batchSuccess).toBe(true);
          latencies.push(...batchLatencies);
        }

        const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
        const latencyStdDev = Math.sqrt(
          latencies.reduce((sum, l) => sum + Math.pow(l - avgLatency, 2), 0) / latencies.length
        );

        results.push({
          concurrency,
          avgLatency,
          latencyStdDev,
          minLatency: Math.min(...latencies),
          maxLatency: Math.max(...latencies)
        });

        // Consistency assertions
        expect(latencyStdDev).toBeLessThan(avgLatency * 0.8); // Standard deviation should be reasonable
      }

      // Validate that latency doesn't degrade significantly with load
      const baselineLatency = results[0].avgLatency;
      results.forEach((result, index) => {
        if (index > 0) {
          const latencyIncrease = (result.avgLatency - baselineLatency) / baselineLatency;
          expect(latencyIncrease).toBeLessThan(3.0); // Latency shouldn't more than quadruple under load
        }
      });

      console.log('Load Latency Results:');
      results.forEach(result => {
        console.log(`  Concurrency ${result.concurrency}:
          Average: ${result.avgLatency.toFixed(2)}ms
          Std Dev: ${result.latencyStdDev.toFixed(2)}ms
          Min/Max: ${result.minLatency}ms / ${result.maxLatency}ms`);
      });
    });
  });

  describe('Resource Utilization Benchmarks', () => {
    it('should optimize CPU usage during intensive operations', async () => {
      const cpuIntensiveIntent = `
        Create a machine learning platform with:
        - Real-time data processing pipelines
        - Model training and inference capabilities
        - Feature engineering and data transformation
        - A/B testing framework for model comparison
        - Automated hyperparameter tuning
        - Model versioning and deployment automation
        - Performance monitoring and alerting
        - Data quality validation and anomaly detection
        - Distributed computing for large-scale processing
        - Integration with cloud ML services
      `;

      const startCpuUsage = process.cpuUsage();
      const startTime = Date.now();

      const args: OptimizeIntentArgs = {
        intent: cpuIntensiveIntent,
        parameters: {
          expectedUserVolume: 50000,
          costConstraints: { maxCostDollars: 5000 },
          performanceSensitivity: 'high'
        }
      };

      const context: MCPToolContext = {
        toolName: 'optimize_intent',
        sessionId: 'cpu-intensive-test',
        timestamp: Date.now()
      };

      const result = await server.handleOptimizeIntent(args, context);
      
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const executionTime = Date.now() - startTime;
      const cpuEfficiency = (endCpuUsage.user + endCpuUsage.system) / (executionTime * 1000); // CPU time / wall time

      expect(result.isError).toBeFalsy();
      expect(cpuEfficiency).toBeLessThan(2.0); // CPU efficiency should be reasonable
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds

      console.log(`CPU Utilization Results:
        Execution Time: ${executionTime}ms
        CPU User Time: ${(endCpuUsage.user / 1000).toFixed(2)}ms
        CPU System Time: ${(endCpuUsage.system / 1000).toFixed(2)}ms
        CPU Efficiency: ${cpuEfficiency.toFixed(3)}`);
    });

    it('should handle garbage collection efficiently', async () => {
      const iterations = 5;
      const gcStats: any[] = [];
      
      // Enable GC monitoring if available
      let gcCount = 0;
      if (global.gc) {
        const originalGc = global.gc;
        global.gc = async () => {
          gcCount++;
          return originalGc();
        };
      }

      for (let i = 0; i < iterations; i++) {
        const initialMemory = process.memoryUsage();
        const initialGcCount = gcCount;

        const args: OptimizeIntentArgs = {
          intent: `Create data processing service ${i + 1} with complex transformations and validations`,
          parameters: {
            expectedUserVolume: 5000,
            performanceSensitivity: 'medium'
          }
        };

        const context: MCPToolContext = {
          toolName: 'optimize_intent',
          sessionId: `gc-test-${i + 1}`,
          timestamp: Date.now()
        };

        const result = await server.handleOptimizeIntent(args, context);
        expect(result.isError).toBeFalsy();

        const finalMemory = process.memoryUsage();
        const gcTriggered = gcCount - initialGcCount;

        gcStats.push({
          iteration: i + 1,
          heapUsedBefore: initialMemory.heapUsed,
          heapUsedAfter: finalMemory.heapUsed,
          heapIncrease: finalMemory.heapUsed - initialMemory.heapUsed,
          gcTriggered
        });

        // Periodic cleanup
        if (i % 2 === 1 && global.gc) {
          global.gc();
        }
      }

      // Analyze GC efficiency
      const avgHeapIncrease = gcStats.reduce((sum, stat) => sum + stat.heapIncrease, 0) / iterations;
      const totalGcCount = gcStats.reduce((sum, stat) => sum + stat.gcTriggered, 0);

      expect(avgHeapIncrease).toBeLessThan(50 * 1024 * 1024); // Average heap increase should be reasonable
      expect(totalGcCount).toBeLessThan(iterations * 5); // GC shouldn't be triggered excessively

      console.log(`Garbage Collection Analysis:
        Total Iterations: ${iterations}
        Average Heap Increase: ${(avgHeapIncrease / 1024 / 1024).toFixed(2)}MB
        Total GC Triggered: ${totalGcCount}
        GC per Iteration: ${(totalGcCount / iterations).toFixed(2)}`);
    });
  });
});