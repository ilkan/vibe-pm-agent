# Technology Stack & Build System

## Core Technologies

**Backend:**
- **Framework**: Hono - lightweight, fast TypeScript web framework
- **Runtime**: Node.js with TypeScript for type safety
- **Database**: SQLite (development) / PostgreSQL (production)
- **Data Exchange**: JSON API with structured error responses

**Frontend:**
- **Markup**: HTML5 with semantic elements for accessibility
- **Styling**: CSS3 with mobile-first responsive design
- **JavaScript**: Vanilla JS or lightweight framework for form handling
- **HTTP Client**: Fetch API for backend communication

**Development Tools:**
- **Language**: TypeScript throughout the stack
- **Testing**: Unit tests for services, integration tests for APIs
- **Validation**: RFC 5322 email validation standards
- **Security**: Rate limiting, input sanitization, CSRF protection

## Common Commands

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run database migrations
npm run migrate

# Start backend API
npm run start:api
```

### Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

### Database Operations
```bash
# Create new migration
npm run migrate:create <migration_name>

# Run migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Run health checks
npm run health-check
```

## Architecture Patterns

- **API-First Design**: Backend provides RESTful JSON API
- **Progressive Enhancement**: Frontend works without JavaScript
- **Stateless Backend**: Horizontal scaling capability
- **Separation of Concerns**: Clear boundaries between layers
- **Error-First Handling**: Comprehensive error responses and logging