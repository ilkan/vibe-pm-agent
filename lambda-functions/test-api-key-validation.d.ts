#!/usr/bin/env node
/**
 * Run all tests
 */
export function runAllTests(): Promise<void>;
/**
 * Test external request with valid API key
 */
export function testValidApiKeyExternal(): Promise<boolean>;
/**
 * Test external request with invalid API key
 */
export function testInvalidApiKeyExternal(): Promise<boolean>;
/**
 * Test internal direct invocation (should bypass auth)
 */
export function testInternalDirectInvocation(): Promise<boolean>;
/**
 * Test multiple MCP tools through external API
 */
export function testMultipleMCPTools(): Promise<boolean>;
//# sourceMappingURL=test-api-key-validation.d.ts.map