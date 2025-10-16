/**
 * Performance Tests for Vibe PM Agent Lambda Functions
 * Tests performance characteristics, load handling, and optimization
 */

import { expect } from 'chai';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Lambda Performance Tests', () => {
    let lambdaClient: LambdaClient;
    let cloudWatchClient: CloudWatchClient;
    let apiClient: AxiosInstance;
    let lambdaFunctionName: string;
    let apiGatewayUrl: string;

    const PERFORMANCE_THRESHOLDS = {
        COLD_START_TIME: 3000, // 3 seconds
        WARM_START_TIME: 1000, // 1 second
        MEMORY_USAGE_PERCENT: 80, // 80% of allocated memory
        ERROR_RATE_PERCENT: 5, // 5% error rate
        CONCURRENT_REQUESTS: 100
    };

    before(async function() {
        lambdaClient = new LambdaClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });

        cloudWatchClient = new CloudWatchClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });

        apiClient = axios.create({
            baseURL: process.env.API_GATEWAY_URL,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        lambdaFunctionName = process.env.LAMBDA_FUNCTION_NAME || 'dev-vibe-pm-agent-lambda';
        apiGatewayUrl = process.env.API_GATEWAY_URL || '';
    });

    describe('Cold Start Performance', () => {
        it('should initialize within acceptable cold start time', async function() {
            const startTime = Date.now();

            const response = await invokeLambdaTool('analyze_business_opportunity', {
                idea: 'Performance test idea'
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response).to.have.property('success', true);
            expect(duration).to.be.below(PERFORMANCE_THRESHOLDS.COLD_START_TIME);
            expect(response).to.have.property('executionTime');
        });

        it('should show improved performance on subsequent calls', async function() {
            // First call (potentially cold start)
            const firstCallStart = Date.now();
            await invokeLambdaTool('validate_idea_quick', { idea: 'Test 1' });
            const firstCallDuration = Date.now() - firstCallStart;

            // Second call (should be warmer)
            const secondCallStart = Date.now();
            await invokeLambdaTool('validate_idea_quick', { idea: 'Test 2' });
            const secondCallDuration = Date.now() - secondCallStart;

            // Second call should be faster (though not guaranteed due to Lambda lifecycle)
            expect(secondCallDuration).to.be.below(PERFORMANCE_THRESHOLDS.WARM_START_TIME);
        });
    });

    describe('Memory Usage Optimization', () => {
        it('should use memory efficiently', async function() {
            const response = await invokeLambdaTool('generate_business_case', {
                opportunity_analysis: 'Large opportunity analysis test',
                financial_inputs: {
                    development_cost: 1000000,
                    operational_cost: 500000,
                    expected_revenue: 3000000,
                    time_to_market: 12
                }
            });

            expect(response).to.have.property('success', true);

            // Check CloudWatch metrics for memory usage
            const memoryMetrics = await getCloudWatchMetrics('MemoryUtilization', 300);
            if (memoryMetrics.length > 0) {
                const avgMemoryUsage = memoryMetrics.reduce((sum, metric) => sum + metric.Average, 0) / memoryMetrics.length;
                expect(avgMemoryUsage).to.be.below(PERFORMANCE_THRESHOLDS.MEMORY_USAGE_PERCENT);
            }
        });
    });

    describe('Concurrent Request Handling', () => {
        it('should handle multiple concurrent requests', async function() {
            const concurrentRequests = 10;
            const toolName = 'validate_idea_quick';

            const requests = Array(concurrentRequests).fill(null).map((_, index) =>
                invokeLambdaTool(toolName, { idea: `Concurrent test ${index}` })
            );

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const totalDuration = Date.now() - startTime;

            // All requests should succeed
            responses.forEach(response => {
                expect(response).to.have.property('success', true);
            });

            // Should complete within reasonable time
            expect(totalDuration).to.be.below(30000); // 30 seconds for 10 concurrent requests
        });

        it('should maintain performance under sustained load', async function() {
            const loadTestDuration = 60000; // 1 minute
            const requestInterval = 1000; // 1 request per second
            const toolName = 'validate_idea_quick';

            const results: any[] = [];
            const errors: any[] = [];

            const startTime = Date.now();
            let requestCount = 0;

            while (Date.now() - startTime < loadTestDuration) {
                try {
                    const response = await invokeLambdaTool(toolName, {
                        idea: `Load test ${requestCount}`
                    });
                    results.push(response);
                    requestCount++;
                } catch (error) {
                    errors.push(error);
                }

                // Wait for next request
                await new Promise(resolve => setTimeout(resolve, requestInterval));
            }

            const successRate = (results.length / (results.length + errors.length)) * 100;
            expect(successRate).to.be.above(95); // 95% success rate

            // Check average response time
            const totalDuration = Date.now() - startTime;
            const avgResponseTime = totalDuration / results.length;
            expect(avgResponseTime).to.be.below(5000); // 5 seconds average
        });
    });

    describe('API Gateway Performance', () => {
        it('should respond quickly through API Gateway', async function() {
            if (!apiGatewayUrl) {
                this.skip();
                return;
            }

            const startTime = Date.now();

            const response = await apiClient.post('/business-analysis/validate-idea', {
                toolName: 'validate_idea_quick',
                toolArgs: { idea: 'API Gateway performance test' }
            });

            const duration = Date.now() - startTime;

            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('success');
            expect(duration).to.be.below(10000); // 10 seconds including network latency
        });

        it('should handle API Gateway throttling gracefully', async function() {
            if (!apiGatewayUrl) {
                this.skip();
                return;
            }

            // Make rapid requests to test throttling
            const rapidRequests = Array(20).fill(null).map((_, index) =>
                apiClient.post('/business-analysis/validate-idea', {
                    toolName: 'validate_idea_quick',
                    toolArgs: { idea: `Throttle test ${index}` }
                }).catch(error => error.response)
            );

            const responses = await Promise.all(rapidRequests);

            // Should have mostly successful responses
            const successfulResponses = responses.filter(response =>
                response && response.status === 200
            );

            expect(successfulResponses.length).to.be.above(15); // At least 75% success rate
        });
    });

    describe('Resource Utilization Monitoring', () => {
        it('should monitor CPU usage effectively', async function() {
            // Perform CPU-intensive operation
            const cpuIntensivePayload = {
                idea: 'Complex business analysis requiring significant processing',
                market_context: {
                    industry: 'Technology',
                    competition: 'High',
                    budget_range: 'large',
                    timeline: '12 months'
                }
            };

            const startTime = Date.now();
            const response = await invokeLambdaTool('analyze_business_opportunity', cpuIntensivePayload);
            const duration = Date.now() - startTime;

            expect(response).to.have.property('success', true);
            expect(duration).to.be.below(25000); // Should complete within 25 seconds

            // Check CloudWatch for CPU metrics if available
            const cpuMetrics = await getCloudWatchMetrics('CPUUtilization', 300);
            if (cpuMetrics.length > 0) {
                const avgCpuUsage = cpuMetrics.reduce((sum, metric) => sum + metric.Average, 0) / cpuMetrics.length;
                expect(avgCpuUsage).to.be.below(90); // Should not exceed 90% CPU
            }
        });

        it('should track function duration metrics', async function() {
            const durationMetrics = await getCloudWatchMetrics('Duration', 3600);

            if (durationMetrics.length > 0) {
                const avgDuration = durationMetrics.reduce((sum, metric) => sum + metric.Average, 0) / durationMetrics.length;
                expect(avgDuration).to.be.below(250000); // Should average under 250 seconds
            }
        });
    });

    describe('Error Rate Monitoring', () => {
        it('should maintain low error rates', async function() {
            const errorMetrics = await getCloudWatchMetrics('Errors', 3600);

            if (errorMetrics.length > 0) {
                const totalErrors = errorMetrics.reduce((sum, metric) => sum + metric.Sum, 0);
                const totalInvocations = await getInvocationCount();

                if (totalInvocations > 0) {
                    const errorRate = (totalErrors / totalInvocations) * 100;
                    expect(errorRate).to.be.below(PERFORMANCE_THRESHOLDS.ERROR_RATE_PERCENT);
                }
            }
        });

        it('should handle edge cases without excessive errors', async function() {
            const edgeCases = [
                { toolName: 'analyze_business_opportunity', toolArgs: {} }, // Missing required fields
                { toolName: 'invalid_tool', toolArgs: { test: 'data' } }, // Invalid tool name
                { toolName: 'validate_idea_quick', toolArgs: { idea: '' } }, // Empty input
                { toolName: 'generate_business_case', toolArgs: { invalid_field: 'test' } } // Invalid fields
            ];

            const results = await Promise.all(
                edgeCases.map(async (testCase) => {
                    try {
                        return await invokeLambdaTool(testCase.toolName, testCase.toolArgs);
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                })
            );

            // Should handle gracefully (either succeed or fail with proper error messages)
            results.forEach(result => {
                expect(result).to.have.property('success');
                if (!result.success) {
                    expect(result).to.have.property('error');
                }
            });
        });
    });

    describe('Scalability Tests', () => {
        it('should scale with increased load', async function() {
            const loadLevels = [1, 5, 10, 20];
            const results: any[] = [];

            for (const level of loadLevels) {
                const requests = Array(level).fill(null).map((_, index) =>
                    invokeLambdaTool('validate_idea_quick', { idea: `Scale test ${index}` })
                );

                const startTime = Date.now();
                const responses = await Promise.all(requests);
                const duration = Date.now() - startTime;

                results.push({
                    loadLevel: level,
                    duration: duration,
                    successCount: responses.filter(r => r.success).length,
                    avgResponseTime: duration / level
                });

                // Brief pause between load levels
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Verify performance doesn't degrade significantly with increased load
            const firstLevel = results[0];
            const lastLevel = results[results.length - 1];

            // Last level should not be more than 5x slower than first level
            expect(lastLevel.avgResponseTime).to.be.below(firstLevel.avgResponseTime * 5);
        });
    });

    // Helper functions
    async function invokeLambdaTool(toolName: string, toolArgs: any): Promise<any> {
        const payload = {
            toolName,
            toolArgs
        };

        const command = new InvokeCommand({
            FunctionName: lambdaFunctionName,
            Payload: JSON.stringify(payload)
        });

        const response = await lambdaClient.send(command);
        return JSON.parse(new TextDecoder().decode(response.Payload));
    }

    async function getCloudWatchMetrics(metricName: string, period: number): Promise<any[]> {
        try {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - (period * 1000));

            const command = new GetMetricStatisticsCommand({
                Namespace: 'AWS/Lambda',
                MetricName: metricName,
                Dimensions: [
                    {
                        Name: 'FunctionName',
                        Value: lambdaFunctionName
                    }
                ],
                StartTime: startTime,
                EndTime: endTime,
                Period: period,
                Statistics: ['Average', 'Sum', 'Maximum']
            });

            const response = await cloudWatchClient.send(command);
            return response.Datapoints || [];
        } catch (error) {
            console.warn(`Could not retrieve ${metricName} metrics:`, error.message);
            return [];
        }
    }

    async function getInvocationCount(): Promise<number> {
        try {
            const metrics = await getCloudWatchMetrics('Invocations', 3600);
            return metrics.reduce((sum, metric) => sum + (metric.Sum || 0), 0);
        } catch (error) {
            return 0;
        }
    }
});
