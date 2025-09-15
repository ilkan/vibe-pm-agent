# Project Structure & Organization

## Directory Layout

```
├── src/
│   ├── backend/
│   │   ├── api/           # Hono API routes and handlers
│   │   ├── services/      # Business logic and subscription services
│   │   ├── models/        # Data models and database schemas
│   │   ├── middleware/    # Rate limiting, validation, CORS
│   │   └── utils/         # Email validation, logging utilities
│   ├── frontend/
│   │   ├── components/    # Email opt-in form components
│   │   ├── styles/        # CSS with mobile-first responsive design
│   │   ├── scripts/       # Form handling and API client
│   │   └── assets/        # Static assets and images
│   └── shared/
│       ├── types/         # TypeScript interfaces and types
│       ├── constants/     # Shared constants and enums
│       └── validators/    # Shared validation logic
├── tests/
│   ├── unit/             # Unit tests for services and components
│   ├── integration/      # API integration tests
│   └── e2e/              # End-to-end user journey tests
├── migrations/           # Database migration scripts
├── config/              # Environment-specific configurations
└── docs/                # API documentation and guides
```

## File Naming Conventions

- **TypeScript files**: `camelCase.ts` (e.g., `subscriptionService.ts`)
- **Component files**: `PascalCase.tsx` (e.g., `EmailOptinForm.tsx`)
- **Test files**: `*.test.ts` or `*.spec.ts`
- **Migration files**: `YYYY-MM-DD-description.sql`
- **Config files**: `kebab-case.json` (e.g., `database-config.json`)

## Code Organization Principles

### Backend Structure
- **API Layer**: Route handlers in `/api` with minimal business logic
- **Service Layer**: Core business logic in `/services` with dependency injection
- **Data Layer**: Database models and repositories in `/models`
- **Middleware**: Cross-cutting concerns like authentication, rate limiting
- **Utils**: Pure functions for validation, formatting, logging

### Frontend Structure
- **Components**: Reusable UI components with single responsibility
- **Styles**: Component-specific CSS with global styles separated
- **Scripts**: Form logic, API clients, and utility functions
- **Progressive Enhancement**: Core functionality works without JavaScript

### Shared Code
- **Types**: TypeScript interfaces shared between frontend and backend
- **Constants**: API endpoints, error codes, validation rules
- **Validators**: Email validation logic used by both layers

## Import/Export Patterns

```typescript
// Barrel exports for clean imports
export * from './subscriptionService';
export * from './emailValidator';

// Named imports preferred over default
import { SubscriptionService, EmailValidator } from '../services';

// Relative imports for local modules
import { validateEmail } from './validators/emailValidator';
```

## Database Schema Organization

- **Core Tables**: `subscriptions`, `subscription_events`
- **Indexes**: Email uniqueness, timestamp queries, source tracking
- **Migrations**: Versioned schema changes with rollback capability
- **Seed Data**: Development data for testing and demos