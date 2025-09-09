---
inclusion: always
---

# Project Structure & Architecture Guidelines

## Core Architecture Patterns

### Component Organization
- **Components**: `src/components/{component-name}/index.ts` - Each component in its own folder with index.ts entry point
- **MCP Tools**: `src/mcp/tools/{action}_{subject}.ts` - MCP server tools following action_subject naming
- **Models**: `src/models/{domain}.ts` - TypeScript interfaces grouped by business domain
- **Pipeline**: `src/pipeline/` - Orchestration and data flow management
- **Utils**: `src/utils/` - Shared utilities and validation functions

### File Naming Conventions
- Use kebab-case for directories: `competitive-intelligence-updater/`
- Use kebab-case for TypeScript files: `pm-document-generator.ts`
- Use PascalCase for interfaces and classes: `BusinessOpportunity`, `MarketAnalysis`
- Use camelCase for functions and variables: `analyzeMarketOpportunity()`

### MCP Server Structure
```
src/mcp/
├── server.ts              # Main MCP server implementation
├── tools/                 # Individual MCP tool handlers
│   ├── analyze_business_opportunity.ts
│   ├── generate_business_case.ts
│   └── validate_market_timing.ts
└── index.ts              # MCP exports and tool registration
```

### Component Architecture
- Each component exports a default class with clear public methods
- Components should be stateless and accept configuration via constructor
- Use dependency injection pattern for external services
- Implement proper error handling with custom error types

### Data Flow Pattern
```
MCP Tool → Pipeline Component → Business Logic → Formatted Output
```

## Code Organization Rules

### Import Structure
```typescript
// External libraries first
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Internal imports by category
import { BusinessAnalyzer } from '../components/business-analyzer/index.js';
import { MarketAnalysis } from '../models/competitive.js';
import { validateInput } from '../utils/validation.js';
```

### Error Handling Pattern
- Use custom error classes extending Error
- Include error codes and user-friendly messages
- Implement graceful degradation for external dependencies
- Log errors with context but avoid exposing sensitive data

### Testing Structure
- Unit tests: `src/tests/unit/{component-name}.test.ts`
- Integration tests: `src/tests/integration/{workflow-name}.test.ts`
- Mock external dependencies in `src/tests/__mocks__/`
- Use descriptive test names: `should generate business case when given valid opportunity analysis`

## Key Directories

### Documentation
- `docs/` - Comprehensive documentation and guides
- `.kiro/specs/` - Kiro specifications for features
- `.kiro/steering/` - AI assistant guidance documents

### Data & Configuration
- `data/` - CSV datasets and market intelligence
- `examples/` - Configuration examples and demos
- `coverage/` - Test coverage reports (generated)

### Build & Deployment
- `dist/` - Compiled TypeScript output
- `bin/` - Executable scripts
- `scripts/` - Build and maintenance scripts

## Development Workflow

### File Creation Guidelines
- Create components in dedicated folders with index.ts
- Add corresponding test files for all new components
- Update models when adding new data structures
- Document public APIs with JSDoc comments

### Dependency Management
- Keep external dependencies minimal and well-justified
- Use TypeScript strict mode for all files
- Implement proper async/await patterns
- Avoid callback-based patterns in favor of Promises