# Project Structure

## Root Directory Organization
```
.kiro/
├── specs/                    # Kiro specifications and project documentation
│   └── vibe-pm-agent/
│       ├── requirements.md   # Detailed requirements and user stories
│       ├── design.md        # Architecture and component design
│       └── tasks.md         # Implementation plan and task breakdown
├── steering/                 # AI assistant guidance documents
│   ├── product.md           # Product overview and purpose
│   ├── tech.md              # Technology stack and build commands
│   └── structure.md         # This file - project organization
.vscode/
└── settings.json            # VSCode configuration (MCP disabled)
```

## Planned Source Code Structure
Based on the design document, the implementation will follow this structure:

```
src/
├── components/              # Core pipeline components
│   ├── intent-interpreter/  # Natural language parsing
│   ├── business-analyzer/   # Workflow analysis and inefficiency detection
│   ├── workflow-optimizer/  # Optimization strategies implementation
│   ├── quota-forecaster/    # Cost estimation and savings calculation
│   └── spec-generator/      # Kiro spec output formatting
├── models/                  # TypeScript interfaces and data structures
│   ├── workflow.ts          # Workflow and optimization models
│   ├── intent.ts           # Intent parsing data structures
│   ├── quota.ts            # Quota and cost calculation models
│   └── spec.ts             # Kiro spec output formats
├── utils/                   # Shared utilities and helpers
├── tests/                   # Test suites
│   ├── unit/               # Component unit tests
│   ├── integration/        # Pipeline integration tests
│   └── fixtures/           # Test data and mock scenarios
└── main.ts                 # Pipeline orchestration entry point
```

## Key Architectural Principles
- **Modular Components**: Each processing stage is isolated with clear interfaces
- **Type Safety**: All data structures defined with TypeScript interfaces
- **Pipeline Flow**: Sequential processing with well-defined data handoffs
- **Error Handling**: Comprehensive validation and fallback strategies
- **Testing Strategy**: Unit tests for components, integration tests for workflows

## Configuration Files
- `.vscode/settings.json`: VSCode workspace settings (MCP disabled)
- `package.json`: Node.js dependencies and scripts (to be created)
- `tsconfig.json`: TypeScript configuration (to be created)
- `jest.config.js`: Testing framework configuration (to be created)