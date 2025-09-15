---
inclusion: fileMatch
fileMatchPattern: "*.ts"
---

# Hono.js Best Practices

## Application Structure

### Middleware Organization
- Apply CORS middleware before route handlers
- Use rate limiting middleware for public endpoints
- Implement logging middleware for all requests
- Add error handling middleware as the last middleware
- Chain middleware in logical order for proper execution

### Route Organization
```typescript
// Preferred structure
const app = new Hono()

// Middleware
app.use('*', cors())
app.use('/api/*', rateLimiter)
app.use('*', logger())

// Routes
app.post('/api/subscribe', subscribeHandler)

// Error handling
app.onError(errorHandler)
```

## Request/Response Patterns

### Request Validation
- Use Zod schemas for request validation
- Validate at the route handler level
- Return 400 status for validation errors
- Include field-specific error messages
- Log validation failures for monitoring

```typescript
const subscribeSchema = z.object({
  email: z.string().email().trim().toLowerCase()
})

app.post('/api/subscribe', async (c) => {
  const result = subscribeSchema.safeParse(await c.req.json())
  if (!result.success) {
    return c.json({ success: false, errors: result.error.issues }, 400)
  }
  // Process valid request
})
```

### Response Formatting
- Use consistent response structure across all endpoints
- Include success boolean in all responses
- Add timestamps to responses for debugging
- Use appropriate HTTP status codes
- Include error codes for programmatic handling

```typescript
// Success response
return c.json({
  success: true,
  message: 'Subscription successful',
  data: { email, subscribedAt: new Date().toISOString() }
}, 200)

// Error response
return c.json({
  success: false,
  error: 'Email already exists',
  code: 'DUPLICATE_EMAIL',
  timestamp: new Date().toISOString()
}, 409)
```

## Error Handling

### Global Error Handler
```typescript
app.onError((error, c) => {
  const errorId = crypto.randomUUID()
  
  console.error('API Error:', {
    errorId,
    message: error.message,
    stack: error.stack,
    path: c.req.path,
    method: c.req.method
  })

  return c.json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    errorId,
    timestamp: new Date().toISOString()
  }, 500)
})
```

### Custom Error Types
```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class DuplicateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DuplicateError'
  }
}
```

## Database Integration

### Connection Management
- Use connection pooling for production
- Handle connection errors gracefully
- Implement retry logic for transient failures
- Close connections properly
- Monitor connection pool metrics

### Query Patterns
```typescript
// Use prepared statements
const insertSubscriber = db.prepare(`
  INSERT INTO subscribers (email, ip_address, user_agent, subscribed_at)
  VALUES (?, ?, ?, ?)
`)

// Handle database errors
try {
  const result = insertSubscriber.run(email, ipAddress, userAgent, new Date())
  return { id: result.lastInsertRowid, email }
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    throw new DuplicateError('Email already exists')
  }
  throw error
}
```

## Security Considerations

### Input Sanitization
- Sanitize all user inputs
- Use parameterized queries
- Validate content types
- Implement request size limits
- Check for malicious patterns

### Rate Limiting
```typescript
const rateLimiter = async (c, next) => {
  const key = c.req.header('x-forwarded-for') || 'unknown'
  const requests = await getRequestCount(key)
  
  if (requests > 5) {
    return c.json({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT',
      retryAfter: 900 // 15 minutes
    }, 429)
  }
  
  await incrementRequestCount(key)
  await next()
}
```

## Performance Optimization

### Response Compression
```typescript
import { compress } from 'hono/compress'

app.use('*', compress())
```

### Caching Headers
```typescript
app.get('/static/*', async (c) => {
  c.header('Cache-Control', 'public, max-age=31536000')
  // Serve static content
})
```

### Async/Await Best Practices
- Always await database operations
- Use Promise.all for parallel operations
- Handle async errors properly
- Avoid blocking the event loop
- Use streaming for large responses

## Testing Patterns

### Unit Testing
```typescript
describe('POST /api/subscribe', () => {
  test('should accept valid email', async () => {
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    })
    
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
```

### Integration Testing
- Test with real database connections
- Verify middleware execution order
- Test error scenarios
- Validate response formats
- Check security headers