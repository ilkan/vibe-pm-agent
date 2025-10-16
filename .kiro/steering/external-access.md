---
inclusion: always
---

# External MCP Access Guidelines

## Overview
The Vibe PM Agent supports dual access patterns: external API access with authentication and internal AWS access via direct Lambda ARN invocation.

## Implementation Principles

### Keep It Simple
- Use API keys for external authentication (avoid JWT/OAuth complexity)
- Store credentials in `.aws/` files with gitignore protection
- Detect context automatically (API Gateway vs direct invocation)
- Environment variable toggle: `EXTERNAL_ACCESS_ENABLED=true/false`

### Security First
- All credential files must be gitignored
- API keys should be hashed when stored
- Log all authentication attempts for monitoring
- Separate external and internal request handling

### Performance Priority
- Internal requests (Bedrock agents) bypass authentication entirely
- Context detection should be fast and reliable
- No performance impact on existing internal workflows
- Cache authentication results when possible

## Code Patterns

### Context Detection
```typescript
function detectInvocationContext(event: any): 'external' | 'internal' {
  // Check for API Gateway event structure
  if (event.requestContext && event.headers) {
    return 'external';
  }
  // Direct Lambda invocation
  return 'internal';
}
```

### Authentication Flow
```typescript
async function handleRequest(event: any) {
  const context = detectInvocationContext(event);
  
  if (context === 'external') {
    const authResult = await validateApiKey(event.headers['x-api-key']);
    if (!authResult.valid) {
      return unauthorizedResponse();
    }
  }
  
  // Process MCP request normally
  return await processMCPRequest(event);
}
```

### Credential Management
```typescript
// Load from .aws/api-keys.json
interface ApiKeyConfig {
  keyId: string;
  hashedKey: string;
  clientName: string;
  enabled: boolean;
}
```

## File Structure
```
.aws/
├── .gitkeep
├── api-keys.json          # Gitignored
├── credentials-dev        # Gitignored
└── credentials-prod       # Gitignored

.aws-templates/
├── api-keys.template.json # Committed template
└── credentials.template   # Committed template
```

## Deployment Considerations

### Environment Variables
- `EXTERNAL_ACCESS_ENABLED`: Enable/disable external API access
- `AWS_REGION`: AWS region for services
- `NODE_ENV`: Environment (dev/prod)

### Infrastructure Updates
- API Gateway requires API key configuration
- Lambda function needs dual-context handling
- CloudWatch logging for both access patterns
- IAM roles for internal access

### Testing Strategy
- Test external API with valid/invalid API keys
- Verify internal access unchanged
- Performance benchmarks for both patterns
- Security validation for authentication bypass

## Common Pitfalls to Avoid

### Overengineering
- Don't implement multiple auth methods initially
- Avoid complex permission systems
- Skip rate limiting in first iteration
- Don't build custom authorizer Lambdas

### Security Issues
- Never commit credential files
- Don't log API keys in plaintext
- Avoid hardcoded credentials
- Don't skip authentication validation

### Performance Problems
- Don't add auth overhead to internal requests
- Avoid synchronous credential loading
- Don't cache credentials indefinitely
- Skip complex context detection logic

## Migration Path
1. Add `.aws/` directory with gitignore
2. Update Lambda handler for context detection
3. Implement simple API key authentication
4. Update API Gateway configuration
5. Test both access patterns
6. Deploy with feature flag enabled