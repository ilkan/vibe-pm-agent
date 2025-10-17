#!/usr/bin/env node
/**
 * Run all tests
 */
export function runAllTests(): Promise<void>;
/**
 * Test authentication with valid API key
 */
export function testValidAuthentication(): Promise<boolean>;
/**
 * Test authentication with invalid API key
 */
export function testInvalidAuthentication(): Promise<boolean>;
/**
 * Test business analysis tools
 */
export function testBusinessAnalysisTools(): Promise<boolean>;
/**
 * Test interview preparation tools
 */
export function testInterviewPrepTools(): Promise<boolean>;
/**
 * Test communication tools
 */
export function testCommunicationTools(): Promise<boolean>;
/**
 * Test error handling for malformed requests
 */
export function testErrorHandling(): Promise<boolean>;
//# sourceMappingURL=test-external-api-access.d.ts.map