/**
 * Integration Tests for Vibe PM Agent Lambda Functions
 * Tests all 32 PM tools for proper functionality and integration
 */

import { expect } from 'chai';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Lambda Integration Tests', () => {
    let lambdaClient: LambdaClient;
    let apiClient: AxiosInstance;
    let lambdaFunctionName: string;
    let apiGatewayUrl: string;

    const TEST_TOOLS = [
        // Business Analysis Tools (8)
        { name: 'analyze_business_opportunity', category: 'business-analysis' },
        { name: 'generate_business_case', category: 'business-analysis' },
        { name: 'assess_strategic_alignment', category: 'business-analysis' },
        { name: 'optimize_resource_allocation', category: 'business-analysis' },
        { name: 'validate_market_timing', category: 'business-analysis' },
        { name: 'validate_idea_quick', category: 'business-analysis' },
        { name: 'analyze_competitor_landscape', category: 'business-analysis' },
        { name: 'calculate_market_sizing', category: 'business-analysis' },

        // Communications Tools (4)
        { name: 'create_stakeholder_communication', category: 'communications' },
        { name: 'generate_management_onepager', category: 'communications' },
        { name: 'generate_pr_faq', category: 'communications' },
        { name: 'generate_board_presentation', category: 'communications' },

        // Requirements Tools (4)
        { name: 'generate_requirements', category: 'requirements' },
        { name: 'generate_design_options', category: 'requirements' },
        { name: 'generate_task_plan', category: 'requirements' },
        { name: 'generate_roi_analysis', category: 'requirements' },

        // Market Intelligence Tools (4)
        { name: 'enhance_citations', category: 'market-intelligence' },
        { name: 'validate_and_audit_citations', category: 'market-intelligence' },
        { name: 'monitor_market_conditions', category: 'market-intelligence' },
        { name: 'optimize_intent', category: 'market-intelligence' },

        // Interview Prep Tools (6)
        { name: 'start_interview_preparation', category: 'interview-prep' },
        { name: 'generate_interview_question', category: 'interview-prep' },
        { name: 'evaluate_interview_response', category: 'interview-prep' },
        { name: 'get_interview_feedback', category: 'interview-prep' },
        { name: 'get_company_interview_insights', category: 'interview-prep' },
        { name: 'customize_preparation_for_company', category: 'interview-prep' },

        // Case Studies Tools (5)
        { name: 'start_case_study', category: 'case-studies' },
        { name: 'get_case_guidance', category: 'case-studies' },
        { name: 'evaluate_case_approach', category: 'case-studies' },
        { name: 'complete_case_study', category: 'case-studies' },
        { name: 'get_company_case_scenarios', category: 'case-studies' }
    ];

    before(async function() {
        // Initialize AWS Lambda client
        lambdaClient = new LambdaClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });

        // Initialize API Gateway client
        apiClient = axios.create({
            baseURL: process.env.API_GATEWAY_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Get function name from environment
        lambdaFunctionName = process.env.LAMBDA_FUNCTION_NAME || 'dev-vibe-pm-agent-lambda';
        apiGatewayUrl = process.env.API_GATEWAY_URL || '';

        console.log(`Testing Lambda function: ${lambdaFunctionName}`);
        console.log(`API Gateway URL: ${apiGatewayUrl}`);
    });

    describe('Lambda Function Health Check', () => {
        it('should respond to health check via direct Lambda invocation', async function() {
            const payload = {
                toolName: 'health_check',
                toolArgs: {}
            };

            const command = new InvokeCommand({
                FunctionName: lambdaFunctionName,
                Payload: JSON.stringify(payload)
            });

            const response = await lambdaClient.send(command);
            const result = JSON.parse(new TextDecoder().decode(response.Payload));

            expect(response.StatusCode).to.equal(200);
            expect(result).to.have.property('success', true);
        });

        it('should respond to health check via API Gateway', async function() {
            if (!apiGatewayUrl) {
                this.skip();
                return;
            }

            const response = await apiClient.get('/health');
            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('status');
        });
    });

    describe('Business Analysis Tools Integration', () => {
        const businessAnalysisTools = TEST_TOOLS.filter(tool =>
            tool.category === 'business-analysis'
        );

        businessAnalysisTools.forEach(tool => {
            it(`should execute ${tool.name} successfully`, async function() {
                const testPayload = generateTestPayload(tool.name);

                // Test via direct Lambda invocation
                const lambdaResponse = await invokeLambdaTool(tool.name, testPayload);
                expect(lambdaResponse).to.have.property('success', true);
                expect(lambdaResponse).to.have.property('data');
                expect(lambdaResponse).to.have.property('executionTime');

                // Test via API Gateway if available
                if (apiGatewayUrl) {
                    const apiResponse = await callApiTool(tool.name, testPayload);
                    expect(apiResponse).to.have.property('success', true);
                }
            });
        });
    });

    describe('Communications Tools Integration', () => {
        const communicationsTools = TEST_TOOLS.filter(tool =>
            tool.category === 'communications'
        );

        communicationsTools.forEach(tool => {
            it(`should execute ${tool.name} successfully`, async function() {
                const testPayload = generateTestPayload(tool.name);

                const lambdaResponse = await invokeLambdaTool(tool.name, testPayload);
                expect(lambdaResponse).to.have.property('success', true);

                if (apiGatewayUrl) {
                    const apiResponse = await callApiTool(tool.name, testPayload);
                    expect(apiResponse).to.have.property('success', true);
                }
            });
        });
    });

    describe('Requirements Tools Integration', () => {
        const requirementsTools = TEST_TOOLS.filter(tool =>
            tool.category === 'requirements'
        );

        requirementsTools.forEach(tool => {
            it(`should execute ${tool.name} successfully`, async function() {
                const testPayload = generateTestPayload(tool.name);

                const lambdaResponse = await invokeLambdaTool(tool.name, testPayload);
                expect(lambdaResponse).to.have.property('success', true);

                if (apiGatewayUrl) {
                    const apiResponse = await callApiTool(tool.name, testPayload);
                    expect(apiResponse).to.have.property('success', true);
                }
            });
        });
    });

    describe('Market Intelligence Tools Integration', () => {
        const marketIntelligenceTools = TEST_TOOLS.filter(tool =>
            tool.category === 'market-intelligence'
        );

        marketIntelligenceTools.forEach(tool => {
            it(`should execute ${tool.name} successfully`, async function() {
                const testPayload = generateTestPayload(tool.name);

                const lambdaResponse = await invokeLambdaTool(tool.name, testPayload);
                expect(lambdaResponse).to.have.property('success', true);

                if (apiGatewayUrl) {
                    const apiResponse = await callApiTool(tool.name, testPayload);
                    expect(apiResponse).to.have.property('success', true);
                }
            });
        });
    });

    describe('Interview Prep Tools Integration', () => {
        const interviewPrepTools = TEST_TOOLS.filter(tool =>
            tool.category === 'interview-prep'
        );

        interviewPrepTools.forEach(tool => {
            it(`should execute ${tool.name} successfully`, async function() {
                const testPayload = generateTestPayload(tool.name);

                const lambdaResponse = await invokeLambdaTool(tool.name, testPayload);
                expect(lambdaResponse).to.have.property('success', true);

                if (apiGatewayUrl) {
                    const apiResponse = await callApiTool(tool.name, testPayload);
                    expect(apiResponse).to.have.property('success', true);
                }
            });
        });
    });

    describe('Case Studies Tools Integration', () => {
        const caseStudiesTools = TEST_TOOLS.filter(tool =>
            tool.category === 'case-studies'
        );

        caseStudiesTools.forEach(tool => {
            it(`should execute ${tool.name} successfully`, async function() {
                const testPayload = generateTestPayload(tool.name);

                const lambdaResponse = await invokeLambdaTool(tool.name, testPayload);
                expect(lambdaResponse).to.have.property('success', true);

                if (apiGatewayUrl) {
                    const apiResponse = await callApiTool(tool.name, testPayload);
                    expect(apiResponse).to.have.property('success', true);
                }
            });
        });
    });

    describe('Performance Tests', () => {
        it('should complete requests within acceptable time limits', async function() {
            const toolName = 'analyze_business_opportunity';
            const testPayload = generateTestPayload(toolName);
            const startTime = Date.now();

            const response = await invokeLambdaTool(toolName, testPayload);
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response).to.have.property('success', true);
            expect(duration).to.be.below(30000); // Should complete within 30 seconds
            expect(response).to.have.property('executionTime');
        });

        it('should handle concurrent requests properly', async function() {
            const toolName = 'validate_idea_quick';
            const testPayload = generateTestPayload(toolName);
            const concurrentRequests = 5;

            const requests = Array(concurrentRequests).fill(null).map(() =>
                invokeLambdaTool(toolName, testPayload)
            );

            const responses = await Promise.all(requests);

            responses.forEach(response => {
                expect(response).to.have.property('success', true);
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid tool names gracefully', async function() {
            const response = await invokeLambdaTool('invalid_tool', {});

            expect(response).to.have.property('success', false);
            expect(response).to.have.property('error');
        });

        it('should handle malformed requests gracefully', async function() {
            const command = new InvokeCommand({
                FunctionName: lambdaFunctionName,
                Payload: 'invalid json'
            });

            try {
                await lambdaClient.send(command);
            } catch (error) {
                expect(error).to.be.an('error');
            }
        });

        it('should handle missing required parameters', async function() {
            const response = await invokeLambdaTool('analyze_business_opportunity', {});

            // Should either succeed with defaults or fail gracefully
            expect(response).to.have.property('success');
        });
    });

    describe('Security Tests', () => {
        it('should validate input size limits', async function() {
            const largePayload = {
                idea: 'x'.repeat(10000) // Very large input
            };

            const response = await invokeLambdaTool('analyze_business_opportunity', largePayload);

            // Should handle large inputs appropriately
            expect(response).to.have.property('success');
        });

        it('should sanitize inputs properly', async function() {
            const maliciousPayload = {
                idea: '<script>alert("xss")</script>Test idea'
            };

            const response = await invokeLambdaTool('analyze_business_opportunity', maliciousPayload);

            expect(response).to.have.property('success');
            // Response should not contain script tags
            expect(JSON.stringify(response)).to.not.include('<script>');
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

    async function callApiTool(toolName: string, toolArgs: any): Promise<any> {
        if (!apiGatewayUrl) {
            throw new Error('API Gateway URL not configured');
        }

        const endpoint = getApiEndpoint(toolName);
        const response = await apiClient.post(endpoint, {
            toolName,
            toolArgs
        });

        return response.data;
    }

    function getApiEndpoint(toolName: string): string {
        const endpointMap: { [key: string]: string } = {
            'analyze_business_opportunity': '/business-analysis/analyze-opportunity',
            'generate_business_case': '/business-analysis/generate-case',
            'assess_strategic_alignment': '/business-analysis/strategic-alignment',
            'optimize_resource_allocation': '/business-analysis/optimize-resources',
            'validate_market_timing': '/business-analysis/validate-timing',
            'validate_idea_quick': '/business-analysis/validate-idea',
            'analyze_competitor_landscape': '/business-analysis/competitor-analysis',
            'calculate_market_sizing': '/business-analysis/market-sizing',
            'create_stakeholder_communication': '/communications/stakeholder-communication',
            'generate_management_onepager': '/communications/executive-onepager',
            'generate_pr_faq': '/communications/pr-faq',
            'generate_board_presentation': '/communications/board-presentation',
            'generate_requirements': '/requirements/generate-requirements',
            'generate_design_options': '/requirements/design-options',
            'generate_task_plan': '/requirements/task-plan',
            'generate_roi_analysis': '/requirements/roi-analysis',
            'enhance_citations': '/market-intelligence/enhance-citations',
            'validate_and_audit_citations': '/market-intelligence/validate-citations',
            'monitor_market_conditions': '/market-intelligence/monitor-market',
            'optimize_intent': '/market-intelligence/optimize-intent',
            'start_interview_preparation': '/interview-prep/start-session',
            'generate_interview_question': '/interview-prep/generate-question',
            'evaluate_interview_response': '/interview-prep/evaluate-response',
            'get_interview_feedback': '/interview-prep/get-feedback',
            'get_company_interview_insights': '/interview-prep/company-insights',
            'customize_preparation_for_company': '/interview-prep/customize-preparation',
            'start_case_study': '/case-studies/start-case',
            'get_case_guidance': '/case-studies/get-guidance',
            'evaluate_case_approach': '/case-studies/evaluate-approach',
            'complete_case_study': '/case-studies/complete-case',
            'get_company_case_scenarios': '/case-studies/company-scenarios'
        };

        return endpointMap[toolName] || '/health';
    }

    function generateTestPayload(toolName: string): any {
        const basePayloads: { [key: string]: any } = {
            'analyze_business_opportunity': {
                idea: 'Create a mobile app for fitness tracking',
                market_context: {
                    industry: 'Health & Fitness',
                    competition: 'High',
                    budget_range: 'medium',
                    timeline: '6 months'
                }
            },
            'generate_business_case': {
                opportunity_analysis: 'Market shows 30% YoY growth in fitness apps',
                financial_inputs: {
                    development_cost: 150000,
                    operational_cost: 50000,
                    expected_revenue: 300000,
                    time_to_market: 6
                }
            },
            'create_stakeholder_communication': {
                business_case: 'Fitness app with AI-powered insights',
                communication_type: 'executive_onepager',
                audience: 'executives'
            },
            'assess_strategic_alignment': {
                feature_concept: 'AI-powered workout recommendations',
                company_context: {
                    mission: 'Make fitness accessible to everyone',
                    current_okrs: ['Increase user engagement', 'Expand market share'],
                    strategic_priorities: ['AI integration', 'User experience'],
                    competitive_position: 'Market leader in basic tracking'
                }
            },
            'optimize_resource_allocation': {
                current_workflow: 'Waterfall development with monthly sprints',
                resource_constraints: {
                    team_size: 8,
                    budget: 200000,
                    timeline: '6 months',
                    technical_debt: 'Medium'
                },
                optimization_goals: ['speed_improvement', 'quality_increase']
            },
            'validate_market_timing': {
                feature_idea: 'Social fitness challenges',
                market_signals: {
                    customer_demand: 'high',
                    competitive_pressure: 'medium',
                    technical_readiness: 'high',
                    resource_availability: 'high'
                }
            },
            'validate_idea_quick': {
                idea: 'Quick validation test',
                criteria: ['market_demand', 'technical_feasibility', 'competitive_advantage']
            },
            'analyze_competitor_landscape': {
                market_segment: 'Fitness apps',
                competitors: ['MyFitnessPal', 'Nike Training Club', 'Peloton']
            },
            'calculate_market_sizing': {
                market: 'Digital fitness solutions',
                methodology: 'TAM-SAM-SOM analysis'
            },
            'generate_requirements': {
                feature_idea: 'User authentication system',
                context: {
                    security_level: 'high',
                    user_base: '100k+',
                    integrations: ['social_media', 'wearables']
                }
            },
            'generate_design_options': {
                requirements: 'Mobile-first responsive design',
                constraints: {
                    platforms: ['iOS', 'Android', 'Web'],
                    accessibility: 'WCAG 2.1 AA',
                    performance: 'sub-3s load time'
                }
            },
            'generate_task_plan': {
                design: 'Agile development with 2-week sprints',
                requirements: 'MVP with core features'
            },
            'generate_roi_analysis': {
                investment: 150000,
                expected_returns: {
                    revenue_increase: 300000,
                    cost_savings: 50000,
                    timeline_months: 12
                }
            },
            'enhance_citations': {
                content: 'Market research shows 30% growth in fitness apps',
                sources: ['Statista', 'App Annie', 'Nielsen']
            },
            'validate_and_audit_citations': {
                content: 'AI-powered fitness recommendations improve engagement by 40%',
                strict_mode: true
            },
            'monitor_market_conditions': {
                market: 'Digital health and fitness',
                indicators: ['user_adoption', 'competitive_activity', 'regulatory_changes']
            },
            'optimize_intent': {
                user_intent: 'I need help with product strategy',
                context: {
                    role: 'product_manager',
                    experience: '5_years',
                    company_size: 'startup'
                }
            },
            'start_interview_preparation': {
                role_level: 'PM',
                target_company: 'Tech Corp',
                preparation_timeline: '2 weeks',
                experience_level: '5 years',
                focus_areas: ['product_strategy', 'analytical_thinking']
            },
            'generate_interview_question': {
                role_level: 'PM',
                question_category: 'product_sense',
                company_context: 'FAANG',
                difficulty_level: 3
            },
            'evaluate_interview_response': {
                question_id: 'prod-001',
                user_response: 'I would analyze user data and market trends to prioritize features',
                evaluation_focus: ['frameworks', 'specificity', 'structure']
            },
            'get_interview_feedback': {
                session_id: 'session-123',
                include_detailed_analysis: true,
                include_study_plan: true
            },
            'get_company_interview_insights': {
                company_name: 'Google',
                role_level: 'Senior PM',
                include_recent_changes: true,
                focus_areas: ['product_strategy', 'leadership']
            },
            'customize_preparation_for_company': {
                company_name: 'Amazon',
                role_level: 'PM',
                preparation_timeline: '1 month',
                experience_background: '5 years in e-commerce',
                preferred_study_style: 'intensive'
            },
            'start_case_study': {
                case_type: 'product_design',
                industry: 'E-commerce',
                difficulty_level: 3,
                role_level: 'PM',
                company_style: 'FAANG'
            },
            'get_case_guidance': {
                session_id: 'case-123',
                current_step: 'market_sizing',
                request_type: 'framework',
                user_progress: 'I have identified the market opportunity'
            },
            'evaluate_case_approach': {
                session_id: 'case-123',
                step_number: 2,
                user_approach: 'Using TAM-SAM-SOM framework for market sizing',
                frameworks_used: ['TAM-SAM-SOM', 'competitive_analysis']
            },
            'complete_case_study': {
                session_id: 'case-123',
                include_detailed_breakdown: true,
                include_recommendations: true,
                include_performance_analytics: true
            },
            'get_company_case_scenarios': {
                company_name: 'Netflix',
                case_type: 'strategy',
                role_level: 'Senior PM',
                use_real_products: true,
                difficulty_level: 4
            }
        };

        return basePayloads[toolName] || { test: 'data' };
    }
});
