---
inclusion: manual
---

# Email Opt-in Form Development Standards

## Code Quality Standards

### TypeScript Requirements
- Use strict TypeScript configuration with no implicit any
- Define explicit interfaces for all data structures
- Use Zod schemas for runtime validation at API boundaries
- Implement proper error types with discriminated unions
- Export types from dedicated types files for reusability

### API Design Principles
- Follow RESTful conventions for endpoint naming
- Use consistent JSON response format with success/error structure
- Implement proper HTTP status codes (200, 400, 409, 429, 500)
- Include timestamp and error IDs in all error responses
- Use structured logging with context for debugging

### Database Standards
- Use prepared statements to prevent SQL injection
- Implement proper indexing strategy for performance
- Include created_at and updated_at timestamps on all tables
- Use database constraints for data integrity
- Handle connection pooling for concurrent requests

## Security Requirements

### Input Validation
- Validate all inputs on both client and server side
- Sanitize user inputs to prevent XSS attacks
- Use Zod schemas for consistent validation logic
- Implement rate limiting to prevent abuse
- Log suspicious activity with proper context

### Data Protection
- Store email addresses with encryption at rest
- Implement GDPR-compliant data retention policies
- Use secure HTTP headers (HSTS, CSP, X-Frame-Options)
- Audit log all subscription events
- Never expose internal error details to users

## Performance Standards

### Response Time Requirements
- API responses must be under 500ms for 95th percentile
- Database queries must use proper indexes
- Implement connection pooling for scalability
- Monitor memory usage and prevent leaks
- Use efficient algorithms for email validation

### Frontend Optimization
- Minimize JavaScript bundle size
- Implement debounced validation to reduce API calls
- Use CSS-only animations for better performance
- Cache static assets with appropriate headers
- Optimize for mobile-first responsive design

## Accessibility Standards

### WCAG Compliance
- Use semantic HTML5 elements for proper structure
- Implement ARIA labels and roles for screen readers
- Ensure proper keyboard navigation and focus management
- Provide clear error messages associated with form fields
- Use sufficient color contrast ratios

### Mobile Accessibility
- Implement appropriate touch targets (minimum 44px)
- Ensure form works with screen readers on mobile
- Test with voice control and switch navigation
- Provide clear visual feedback for all interactions
- Support zoom up to 200% without horizontal scrolling

## Testing Requirements

### Unit Testing
- Achieve minimum 80% code coverage
- Test all validation logic with edge cases
- Mock external dependencies properly
- Use descriptive test names that explain behavior
- Test error scenarios and edge cases

### Integration Testing
- Test complete user flows end-to-end
- Verify API and database integration
- Test responsive design across screen sizes
- Validate accessibility compliance
- Performance test with concurrent requests

## Error Handling Standards

### Frontend Error Handling
- Categorize errors by type (validation, network, server, rate limit)
- Provide user-friendly error messages
- Implement retry mechanisms for transient failures
- Show loading states during API calls
- Clear form state appropriately after errors

### Backend Error Handling
- Log all errors with context and error IDs
- Return consistent error response format
- Handle database connection failures gracefully
- Implement circuit breaker pattern for external services
- Never expose stack traces to users

## Development Workflow

### Code Organization
- Separate concerns between frontend and backend
- Use consistent file naming conventions
- Group related functionality in modules
- Keep functions small and focused
- Document complex business logic

### Version Control
- Use meaningful commit messages
- Create feature branches for each task
- Include tests in the same commit as implementation
- Review code before merging to main branch
- Tag releases with semantic versioning

## Deployment Standards

### Environment Configuration
- Use environment variables for configuration
- Separate development and production settings
- Implement proper secret management
- Configure monitoring and alerting
- Set up automated backups

### Production Readiness
- Implement health check endpoints
- Configure proper logging levels
- Set up error monitoring and alerting
- Use connection pooling for database
- Implement graceful shutdown handling