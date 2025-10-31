/**
 * Local NIM Test Utilities
 * 
 * Utility functions for integrating local NIM testing with the main application
 * and providing programmatic access to testing capabilities.
 */

import { LocalNIMTester, TestResult, ValidationResult, PerformanceMetrics, LoadTestResult } from '../components/local-nim-tester';
import { NIMConfig, ChatCompletionRequest, EmbeddingRequest, NIMServiceHealth } from '../interfaces/nvidia-nim-core';
import { DEFAULT_NIM_CONFIG } from '../models/nvidia-nim';
import { NIMErrorHandler, NIMErrorCode } from '../utils/nvidia-nim-error-handling';

// ============================================================================
// Test Configuration
// ============================================================================

export interface LocalTestConfig {
    baseUrl?: string;
    timeout?: number;
    defaultModel?: string;
    enablePerformanceTests?: boolean;
    enableLoadTests?: boolean;
    testIterations?: number;
    concurrentRequests?: number;
}

export interface TestSuite {
    name: string;
    description: string;
    tests: TestCase[];
}

export interface TestCase {
    name: string;
    description: string;
    prompt: string;
    expectedTopics?: string[];
    minLength?: number;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
}

export interface TestReport {
    summary: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        successRate: number;
        totalDuration: number;
    };
    results: TestCaseResult[];
    performanceMetrics?: PerformanceMetrics;
    healthStatus?: NIMServiceHealth;
    recommendations: string[];
}

export interface TestCaseResult {
    testCase: TestCase;
    result: TestResult;
    validation?: ValidationResult;
    duration: number;
    passed: boolean;
    error?: string;
}

// ============================================================================
// Default Test Configurations
// ============================================================================

export const DEFAULT_LOCAL_TEST_CONFIG: LocalTestConfig = {
    baseUrl: 'http://localhost:1234',
    timeout: 30000,
    defaultModel: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
    enablePerformanceTests: true,
    enableLoadTests: false,
    testIterations: 5,
    concurrentRequests: 3
};

export const DEFAULT_TEST_SUITES: TestSuite[] = [
    {
        name: 'Basic Functionality',
        description: 'Test basic chat completion and model response capabilities',
        tests: [
            {
                name: 'Simple Greeting',
                description: 'Test basic conversational response',
                prompt: 'Hello, how are you today?',
                expectedTopics: ['greeting', 'well', 'good'],
                minLength: 10,
                maxTokens: 50,
                temperature: 0.7
            },
            {
                name: 'Question Answering',
                description: 'Test factual question answering',
                prompt: 'What is the capital of France?',
                expectedTopics: ['Paris', 'capital', 'France'],
                minLength: 5,
                maxTokens: 30,
                temperature: 0.3
            },
            {
                name: 'Creative Writing',
                description: 'Test creative content generation',
                prompt: 'Write a short poem about artificial intelligence.',
                expectedTopics: ['AI', 'artificial', 'intelligence', 'technology'],
                minLength: 50,
                maxTokens: 100,
                temperature: 0.8
            }
        ]
    },
    {
        name: 'Reasoning Tasks',
        description: 'Test logical reasoning and problem-solving capabilities',
        tests: [
            {
                name: 'Math Problem',
                description: 'Test basic mathematical reasoning',
                prompt: 'If I have 5 apples and give away 2, how many do I have left? Explain your reasoning.',
                expectedTopics: ['3', 'three', 'subtract', 'reasoning'],
                minLength: 20,
                maxTokens: 80,
                temperature: 0.2
            },
            {
                name: 'Logic Puzzle',
                description: 'Test logical deduction',
                prompt: 'All cats are mammals. Fluffy is a cat. What can we conclude about Fluffy?',
                expectedTopics: ['mammal', 'Fluffy', 'conclude', 'logic'],
                minLength: 15,
                maxTokens: 60,
                temperature: 0.3
            },
            {
                name: 'Cause and Effect',
                description: 'Test causal reasoning',
                prompt: 'Explain why plants need sunlight to grow.',
                expectedTopics: ['photosynthesis', 'energy', 'sunlight', 'growth'],
                minLength: 30,
                maxTokens: 100,
                temperature: 0.4
            }
        ]
    },
    {
        name: 'Context Understanding',
        description: 'Test contextual understanding and conversation flow',
        tests: [
            {
                name: 'Context Retention',
                description: 'Test ability to maintain context',
                prompt: 'I am planning a birthday party for my 8-year-old daughter. What activities would you recommend?',
                expectedTopics: ['birthday', 'party', 'activities', 'children', '8-year-old'],
                minLength: 50,
                maxTokens: 150,
                temperature: 0.6
            },
            {
                name: 'Follow-up Question',
                description: 'Test handling of follow-up questions',
                prompt: 'What are the benefits of renewable energy? Please focus on environmental aspects.',
                expectedTopics: ['renewable', 'energy', 'environment', 'benefits', 'clean'],
                minLength: 40,
                maxTokens: 120,
                temperature: 0.5
            }
        ]
    }
];

// ============================================================================
// Test Utility Functions
// ============================================================================

/**
 * Create a LocalNIMTester instance with configuration
 */
export function createLocalTester(config: Partial<LocalTestConfig> = {}): LocalNIMTester {
    const finalConfig = { ...DEFAULT_LOCAL_TEST_CONFIG, ...config };

    return new LocalNIMTester(
        finalConfig.baseUrl!,
        finalConfig.timeout!,
        finalConfig.defaultModel!
    );
}

/**
 * Run a single test case
 */
export async function runTestCase(
    tester: LocalNIMTester,
    testCase: TestCase
): Promise<TestCaseResult> {
    const startTime = Date.now();

    try {
        // Run the chat completion test
        const result = await tester.testChatCompletion(testCase.prompt, {
            max_tokens: testCase.maxTokens || 100,
            temperature: testCase.temperature || 0.7
        });

        // Validate the response if criteria provided
        let validation: ValidationResult | undefined;
        if (testCase.expectedTopics || testCase.minLength) {
            validation = await tester.validateModelResponse(
                testCase.prompt,
                testCase.expectedTopics,
                testCase.minLength
            );
        }

        const duration = Date.now() - startTime;
        const passed = result.success && (validation ? validation.valid : true);

        return {
            testCase,
            result,
            validation,
            duration,
            passed,
            error: result.error
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            testCase,
            result: {
                success: false,
                message: 'Test case execution failed',
                duration,
                error: error instanceof Error ? error.message : String(error)
            },
            duration,
            passed: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Run a complete test suite
 */
export async function runTestSuite(
    tester: LocalNIMTester,
    testSuite: TestSuite,
    config: Partial<LocalTestConfig> = {}
): Promise<TestReport> {
    const startTime = Date.now();
    const results: TestCaseResult[] = [];
    const recommendations: string[] = [];

    console.log(`Running test suite: ${testSuite.name}`);
    console.log(`Description: ${testSuite.description}`);
    console.log(`Total tests: ${testSuite.tests.length}`);

    // Run each test case
    for (const testCase of testSuite.tests) {
        console.log(`Running test: ${testCase.name}`);
        const result = await runTestCase(tester, testCase);
        results.push(result);

        if (!result.passed) {
            console.warn(`Test failed: ${testCase.name} - ${result.error}`);
        } else {
            console.log(`Test passed: ${testCase.name}`);
        }
    }

    // Calculate summary statistics
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const totalDuration = Date.now() - startTime;

    // Run performance tests if enabled
    let performanceMetrics: PerformanceMetrics | undefined;
    if (config.enablePerformanceTests) {
        console.log('Running performance benchmarks...');
        try {
            performanceMetrics = await tester.benchmarkPerformance(
                testSuite.tests.map(t => ({ prompt: t.prompt, maxTokens: t.maxTokens })),
                config.testIterations || 5
            );
        } catch (error) {
            console.warn('Performance benchmarking failed:', error);
            recommendations.push('Performance benchmarking failed - check service stability');
        }
    }

    // Get health status
    let healthStatus: NIMServiceHealth | undefined;
    try {
        healthStatus = await tester.getServiceHealth();
    } catch (error) {
        console.warn('Health check failed:', error);
        recommendations.push('Service health check failed - verify service availability');
    }

    // Generate recommendations
    if (successRate < 80) {
        recommendations.push('Low success rate detected - review failed test cases and model configuration');
    }

    if (performanceMetrics && performanceMetrics.errorRate > 0.1) {
        recommendations.push('High error rate detected - check service stability and network connectivity');
    }

    if (performanceMetrics && performanceMetrics.averageLatency > 5000) {
        recommendations.push('High latency detected - consider optimizing model configuration or hardware');
    }

    const failedValidations = results.filter(r => r.validation && !r.validation.valid);
    if (failedValidations.length > 0) {
        recommendations.push(`${failedValidations.length} tests failed validation - review response quality and expected criteria`);
    }

    return {
        summary: {
            totalTests,
            passedTests,
            failedTests,
            successRate,
            totalDuration
        },
        results,
        performanceMetrics,
        healthStatus,
        recommendations
    };
}

/**
 * Run all default test suites
 */
export async function runAllTestSuites(
    config: Partial<LocalTestConfig> = {}
): Promise<TestReport[]> {
    const tester = createLocalTester(config);
    const reports: TestReport[] = [];

    console.log('Starting comprehensive local NIM testing...');
    console.log(`Configuration: ${JSON.stringify({ ...DEFAULT_LOCAL_TEST_CONFIG, ...config }, null, 2)}`);

    for (const testSuite of DEFAULT_TEST_SUITES) {
        try {
            const report = await runTestSuite(tester, testSuite, config);
            reports.push(report);

            console.log(`\nTest Suite: ${testSuite.name}`);
            console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`);
            console.log(`Duration: ${report.summary.totalDuration}ms`);

            if (report.recommendations.length > 0) {
                console.log('Recommendations:');
                report.recommendations.forEach(rec => console.log(`  - ${rec}`));
            }
        } catch (error) {
            console.error(`Failed to run test suite ${testSuite.name}:`, error);
        }
    }

    return reports;
}

/**
 * Generate a comprehensive test report
 */
export async function generateComprehensiveReport(
    config: Partial<LocalTestConfig> = {}
): Promise<{
    overall: {
        totalSuites: number;
        totalTests: number;
        overallSuccessRate: number;
        totalDuration: number;
    };
    suiteReports: TestReport[];
    systemHealth: NIMServiceHealth | null;
    recommendations: string[];
}> {
    const tester = createLocalTester(config);
    const suiteReports = await runAllTestSuites(config);

    // Calculate overall statistics
    const totalSuites = suiteReports.length;
    const totalTests = suiteReports.reduce((sum, report) => sum + report.summary.totalTests, 0);
    const totalPassed = suiteReports.reduce((sum, report) => sum + report.summary.passedTests, 0);
    const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    const totalDuration = suiteReports.reduce((sum, report) => sum + report.summary.totalDuration, 0);

    // Get system health
    let systemHealth: NIMServiceHealth | null = null;
    try {
        systemHealth = await tester.getServiceHealth();
    } catch (error) {
        console.warn('System health check failed:', error);
    }

    // Aggregate recommendations
    const allRecommendations = suiteReports.flatMap(report => report.recommendations);
    const uniqueRecommendations = Array.from(new Set(allRecommendations));

    // Add overall recommendations
    if (overallSuccessRate < 90) {
        uniqueRecommendations.unshift('Overall success rate is below 90% - comprehensive review recommended');
    }

    if (systemHealth?.status !== 'healthy') {
        uniqueRecommendations.unshift('System health is not optimal - check service configuration');
    }

    return {
        overall: {
            totalSuites,
            totalTests,
            overallSuccessRate,
            totalDuration
        },
        suiteReports,
        systemHealth,
        recommendations: uniqueRecommendations
    };
}

/**
 * Quick health check utility
 */
export async function quickHealthCheck(config: Partial<LocalTestConfig> = {}): Promise<{
    healthy: boolean;
    message: string;
    details: any;
}> {
    try {
        const tester = createLocalTester(config);
        const health = await tester.getServiceHealth();

        const healthy = health.status === 'healthy';
        const message = healthy
            ? 'Local NIM service is healthy and ready for testing'
            : `Local NIM service is ${health.status}`;

        return {
            healthy,
            message,
            details: {
                status: health.status,
                chatService: health.chatService,
                embeddingService: health.embeddingService,
                lastChecked: health.lastChecked,
                uptime: health.uptime
            }
        };
    } catch (error) {
        return {
            healthy: false,
            message: 'Failed to connect to local NIM service',
            details: {
                error: error instanceof Error ? error.message : String(error),
                endpoint: config.baseUrl || DEFAULT_LOCAL_TEST_CONFIG.baseUrl
            }
        };
    }
}

/**
 * Load testing utility
 */
export async function runLoadTest(
    config: Partial<LocalTestConfig & {
        prompt?: string;
        duration?: number;
    }> = {}
): Promise<LoadTestResult> {
    const tester = createLocalTester(config);
    const finalConfig = { ...DEFAULT_LOCAL_TEST_CONFIG, ...config };

    const prompt = config.prompt || 'Generate a response about artificial intelligence and its applications.';
    const concurrentRequests = finalConfig.concurrentRequests || 3;
    const totalRequests = Math.max(concurrentRequests * 5, 20); // At least 20 requests

    console.log(`Starting load test with ${totalRequests} requests and ${concurrentRequests} concurrent connections`);

    return await tester.runLoadTest(concurrentRequests, totalRequests, prompt);
}

/**
 * Validate local NIM configuration
 */
export function validateLocalConfig(config: Partial<LocalTestConfig>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate base URL
    if (config.baseUrl) {
        try {
            const url = new URL(config.baseUrl);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                errors.push('Base URL must use HTTP or HTTPS protocol');
            }
            if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                warnings.push('Using localhost - ensure local NIM service is running');
            }
        } catch {
            errors.push('Invalid base URL format');
        }
    }

    // Validate timeout
    if (config.timeout !== undefined) {
        if (config.timeout < 1000) {
            warnings.push('Timeout is very low - may cause premature failures');
        }
        if (config.timeout > 120000) {
            warnings.push('Timeout is very high - may cause long waits');
        }
    }

    // Validate test iterations
    if (config.testIterations !== undefined) {
        if (config.testIterations < 1) {
            errors.push('Test iterations must be at least 1');
        }
        if (config.testIterations > 100) {
            warnings.push('High number of test iterations - may take a long time');
        }
    }

    // Validate concurrent requests
    if (config.concurrentRequests !== undefined) {
        if (config.concurrentRequests < 1) {
            errors.push('Concurrent requests must be at least 1');
        }
        if (config.concurrentRequests > 20) {
            warnings.push('High concurrent requests - may overwhelm local service');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// ============================================================================
// Integration with Main Application
// ============================================================================

/**
 * Integration utility for main application testing workflows
 */
export class LocalNIMTestIntegration {
    private tester: LocalNIMTester;
    private config: LocalTestConfig;

    constructor(config: Partial<LocalTestConfig> = {}) {
        this.config = { ...DEFAULT_LOCAL_TEST_CONFIG, ...config };
        this.tester = createLocalTester(this.config);
    }

    /**
     * Pre-deployment validation
     */
    async validateBeforeDeployment(): Promise<{
        ready: boolean;
        issues: string[];
        recommendations: string[];
    }> {
        const issues: string[] = [];
        const recommendations: string[] = [];

        try {
            // Quick health check
            const healthCheck = await quickHealthCheck(this.config);
            if (!healthCheck.healthy) {
                issues.push(`Health check failed: ${healthCheck.message}`);
                recommendations.push('Ensure local NIM service is running and accessible');
            }

            // Run basic functionality tests
            const basicSuite = DEFAULT_TEST_SUITES.find(s => s.name === 'Basic Functionality');
            if (basicSuite) {
                const report = await runTestSuite(this.tester, basicSuite, this.config);
                if (report.summary.successRate < 100) {
                    issues.push(`Basic functionality tests failed: ${report.summary.failedTests}/${report.summary.totalTests} tests failed`);
                    recommendations.push('Review failed basic functionality tests before deployment');
                }
            }

            // Performance check
            if (this.config.enablePerformanceTests) {
                const perfMetrics = await this.tester.benchmarkPerformance([], 3);
                if (perfMetrics.errorRate > 0) {
                    issues.push(`Performance test errors detected: ${(perfMetrics.errorRate * 100).toFixed(1)}% error rate`);
                    recommendations.push('Investigate performance issues before deployment');
                }
            }

        } catch (error) {
            issues.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
            recommendations.push('Fix validation errors before proceeding with deployment');
        }

        return {
            ready: issues.length === 0,
            issues,
            recommendations
        };
    }

    /**
     * Development workflow integration
     */
    async runDevelopmentTests(): Promise<TestReport[]> {
        console.log('Running development-focused test suite...');

        // Run a subset of tests optimized for development
        const devTestSuite: TestSuite = {
            name: 'Development Validation',
            description: 'Quick validation tests for development workflow',
            tests: [
                DEFAULT_TEST_SUITES[0].tests[0], // Simple greeting
                DEFAULT_TEST_SUITES[1].tests[0], // Math problem
                DEFAULT_TEST_SUITES[2].tests[0]  // Context retention
            ]
        };

        const report = await runTestSuite(this.tester, devTestSuite, {
            ...this.config,
            enablePerformanceTests: false, // Skip performance tests in dev
            testIterations: 1
        });

        return [report];
    }

    /**
     * Get testing recommendations based on current state
     */
    async getTestingRecommendations(): Promise<string[]> {
        const recommendations: string[] = [];

        try {
            const health = await this.tester.getServiceHealth();

            if (health.status !== 'healthy') {
                recommendations.push('Service is not healthy - check logs and configuration');
            }

            if (health.chatService.responseTime > 3000) {
                recommendations.push('High response time detected - consider optimizing model or hardware');
            }

            if (health.chatService.errorRate > 0.05) {
                recommendations.push('Error rate is elevated - investigate service stability');
            }

            // Add configuration-based recommendations
            if (this.config.timeout && this.config.timeout < 10000) {
                recommendations.push('Consider increasing timeout for more reliable testing');
            }

            if (!this.config.enablePerformanceTests) {
                recommendations.push('Enable performance testing for comprehensive validation');
            }

        } catch (error) {
            recommendations.push('Unable to assess service - ensure local NIM is running');
        }

        return recommendations;
    }
}