# Implementation Plan

- [x] 1. Set up credential management with .aws files
  - Create .aws directory structure with gitignore configuration
  - Implement simple API key loading from .aws credential files
  - Add basic credential validation
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 1.1 Create .aws directory and credential files
  - Create .aws directory with api-keys.json file
  - Update .gitignore to exclude .aws/* but keep .aws/.gitkeep
  - Create template files for API key configuration
  - _Requirements: 3.1, 3.3_

- [x] 1.2 Implement API key loading and validation
  - Write simple function to load API keys from .aws/api-keys.json
  - Add API key validation with basic security checks
  - Create error handling for missing or invalid credential files
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 2. Create simple authentication service
  - Implement basic API key authentication
  - Add request logging for security monitoring
  - Create authentication bypass detection for internal requests
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

- [x] 2.1 Implement API key authentication
  - Create AuthService class with API key validation
  - Add X-API-Key header parsing and validation
  - Implement simple client identification from API keys
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 2.2 Add request logging and monitoring
  - Implement CloudWatch logging for authentication attempts
  - Log successful and failed authentication with client details
  - Add basic request metrics tracking
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Update Lambda handler for dual access patterns
  - Add context detection to identify API Gateway vs direct invocation
  - Implement authentication bypass for internal AWS requests
  - Route requests appropriately based on invocation source
  - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2_

- [x] 3.1 Add context detection to existing Lambda handler
  - Modify lambda-functions/router.ts to detect invocation context
  - Check for API Gateway event structure vs direct invocation
  - Add environment variable EXTERNAL_ACCESS_ENABLED check
  - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2_

- [x] 3.2 Implement authentication for external requests
  - Add API key validation for requests from API Gateway
  - Skip authentication for direct Lambda invocations
  - Return proper error responses for authentication failures
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

- [x] 3.3 Add logging for both access patterns
  - Log external requests with client identification
  - Log internal requests as Bedrock agent access
  - Use existing CloudWatch logging infrastructure
  - _Requirements: 4.1, 4.2, 7.3, 7.4_

- [x] 4. Update API Gateway for external access
  - Add API key requirement to existing API Gateway endpoints
  - Configure proper error responses for authentication failures
  - Update deployment scripts to handle external access configuration
  - _Requirements: 1.1, 1.3, 5.1, 5.2, 6.1, 6.2_

- [x] 4.1 Add API key authentication to API Gateway
  - Modify infrastructure/api-gateway.yaml to require API keys
  - Add API key validation to all external endpoints
  - Configure usage plans for API key management
  - _Requirements: 1.1, 3.1, 6.1, 6.2_

- [x] 4.2 Update error handling and responses
  - Configure proper 401/403 error responses
  - Add descriptive error messages for authentication failures
  - Ensure CORS headers are included in error responses
  - _Requirements: 1.3, 5.1, 5.2_

- [x] 5. Update deployment and configuration
  - Modify deployment scripts to support external access configuration
  - Add environment variables for enabling/disabling external access
  - Create simple documentation for setup and usage
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4_

- [x] 5.1 Update deployment scripts
  - Modify deployment-scripts/deploy-api-gateway.sh for API key setup
  - Add EXTERNAL_ACCESS_ENABLED environment variable support
  - Create simple credential file deployment process
  - _Requirements: 6.1, 6.2, 8.1, 8.2_

- [x] 5.2 Create setup documentation
  - Write README section for external access configuration
  - Document API key setup process using .aws files
  - Add examples for Bedrock agent ARN configuration
  - _Requirements: 5.3, 5.4, 6.3, 6.4_

- [ ] 6. Test and validate implementation
  - Test external API access with API keys
  - Verify internal Bedrock agent access still works
  - Validate environment variable configuration
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 7.1, 7.2, 8.3, 8.4_

- [x] 6.1 Test external API access
  - Create test script for API key authentication
  - Verify all MCP tools work through external API
  - Test error handling for invalid API keys
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

- [x] 6.2 Verify internal access unchanged
  - Test direct Lambda invocation from Bedrock agent
  - Ensure no performance impact on internal requests
  - Validate context detection works correctly
  - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2_