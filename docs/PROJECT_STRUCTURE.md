# Vibe PM Agent - Project Structure Documentation

## 📁 Project Overview

Vibe PM Agent is an evidence-backed business intelligence MCP server that provides Kiro's missing "PM Mode" - transforming raw developer ideas into comprehensive business cases with professional citations and confidence scoring.

## 🏗️ Architecture Overview

```
vibe-pm-agent/
├── 📄 Core Documentation
│   ├── README.md                    # Main project documentation
│   ├── LICENSE                      # MIT license
│   ├── KIRO_USAGE.md               # Kiro integration examples
│   ├── TESTING.md                  # Comprehensive testing guide
│   └── package.json                # Project configuration and dependencies
│
├── 🔧 Configuration Files
│   ├── tsconfig.json               # TypeScript configuration
│   ├── jest.config.js              # Jest testing configuration
│   ├── .eslintrc.js                # ESLint code quality rules
│   ├── .prettierrc                 # Prettier code formatting
│   ├── .prettierignore             # Prettier ignore patterns
│   └── .gitignore                  # Git ignore patterns
│
├── 🚀 Executable Entry Points
│   └── bin/
│       └── mcp-server.js           # MCP server executable entry point
│
├── 💻 Source Code
│   └── src/
│       ├── 🧠 Core Components
│       │   ├── components/         # Business intelligence components
│       │   │   ├── business-analyzer/           # Market analysis and strategic assessment
│       │   │   ├── pm-document-generator/       # Executive communications generation
│       │   │   ├── citation-service/            # Evidence compilation and validation
│       │   │   ├── intent-interpreter/          # Natural language processing
│       │   │   ├── workflow-optimizer/          # Optimization strategies
│       │   │   ├── quota-forecaster/            # ROI and cost analysis
│       │   │   ├── consulting-summary-generator/ # Professional analysis formatting
│       │   │   └── steering-service/            # Kiro integration utilities
│       │   │
│       │   ├── 🔌 MCP Server Implementation
│       │   │   ├── mcp/
│       │   │   │   ├── server.ts               # Main MCP server implementation
│       │   │   │   ├── server-config.ts        # Server configuration and tool registry
│       │   │   │   ├── cli.ts                  # Command-line interface
│       │   │   │   └── tools/                  # MCP tool handlers
│       │   │   │       ├── generate_requirements.ts      # Requirements generation
│       │   │   │       ├── generate_design_options.ts    # Design alternatives
│       │   │   │       ├── generate_task_plan.ts         # Implementation planning
│       │   │   │       ├── generate_management_onepager.ts # Executive one-pagers
│       │   │   │       ├── generate_pr_faq.ts            # PR-FAQ documents
│       │   │   │       └── index.ts                      # Tool registry
│       │   │   │
│       │   │   ├── 🔄 Business Intelligence Pipeline
│       │   │   │   ├── pipeline/
│       │   │   │   │   ├── ai-agent-pipeline.ts         # Main orchestration pipeline
│       │   │   │   │   ├── performance-optimizer.ts     # Performance optimization
│       │   │   │   │   └── index.ts                     # Pipeline exports
│       │   │   │
│       │   │   ├── 📊 Data Models and Interfaces
│       │   │   │   ├── models/
│       │   │   │   │   ├── mcp.ts                       # MCP protocol interfaces
│       │   │   │   │   ├── citations.ts                 # Citation and evidence models
│       │   │   │   │   ├── competitive.ts               # Competitive analysis models
│       │   │   │   │   ├── consulting.ts                # Consulting framework models
│       │   │   │   │   ├── intent.ts                    # Intent parsing models
│       │   │   │   │   ├── market-data.ts               # Market intelligence models
│       │   │   │   │   ├── proprietary-frameworks.ts    # PM framework models
│       │   │   │   │   ├── quota.ts                     # Cost and ROI models
│       │   │   │   │   ├── spec.ts                      # Kiro specification models
│       │   │   │   │   ├── steering.ts                  # Steering file models
│       │   │   │   │   └── workflow.ts                  # Workflow optimization models
│       │   │   │
│       │   │   └── 🛠️ Utilities and Helpers
│       │   │       └── utils/
│       │   │           ├── citation-integration.ts      # Citation management
│       │   │           ├── mcp-error-handling.ts        # MCP error handling
│       │   │           ├── pm-document-validation.ts    # Document quality validation
│       │   │           ├── competitive-data-validation.ts # Competitive intelligence validation
│       │   │           ├── confidence-scoring.ts        # Evidence confidence scoring
│       │   │           ├── steering-error-handling.ts   # Steering file error handling
│       │   │           ├── error-handling.ts            # General error handling
│       │   │           ├── validation.ts                # Input validation utilities
│       │   │           └── index.ts                     # Utility exports
│       │
│       └── 🧪 Testing Suite
│           └── tests/
│               ├── unit/                    # Component unit tests
│               ├── integration/             # Pipeline integration tests
│               ├── performance/             # Performance benchmarks
│               ├── __mocks__/              # Test mocks and fixtures
│               ├── utils/                  # Test utilities
│               ├── setup.ts                # Test environment setup
│               └── global-teardown.ts      # Test cleanup
│
├── 📚 Documentation
│   └── docs/
│       ├── PROJECT_STRUCTURE.md           # This file - project organization
│       ├── mcp-tools-documentation.md     # MCP tools reference
│       ├── citation-system-integration.md # Citation system documentation
│       ├── pm-workflow-integration-guide.md # PM workflow documentation
│       ├── steering-file-integration-guide.md # Kiro steering integration
│       └── competitive-analysis-examples.md # Competitive intelligence examples
│
├── 🎯 Demo and Examples
│   └── demo/
│       ├── README.md                      # Demo documentation
│       ├── run-demo.sh                    # Comprehensive demo script
│       ├── test-mcp-server.js             # MCP server testing script
│       ├── unique-datasets-showcase.js    # Unique datasets demonstration
│       └── ai-customer-support/           # Example use case
│           ├── test-citations.js          # Citation integration demo
│           ├── test-enhanced-tools.js     # Enhanced business tools demo
│           └── run-citation-demo.sh       # Citation system demo
│
├── 📈 Data and Intelligence
│   └── data/
│       ├── quota-optimization-metrics.csv # Development efficiency data
│       ├── stakeholder-adoption-rates.csv # PM adoption metrics
│       └── unique-datasets/               # Unique public datasets
│           ├── competitive-intelligence-matrix.csv # Competitive positioning data
│           ├── market-timing-signals.csv          # Market timing indicators
│           └── pm-innovation-index.csv            # PM best practices data
│
├── 🎛️ Kiro Integration
│   └── .kiro/
│       ├── specs/                         # Kiro specifications
│       │   └── vibe-pm-agent/
│       │       ├── requirements.md        # Feature requirements
│       │       ├── design.md             # Architecture design
│       │       ├── tasks.md              # Implementation tasks
│       │       ├── vision.md             # Project vision
│       │       └── vibe_pm_agent.yaml    # Kiro spec configuration
│       │
│       └── steering/                      # Kiro steering files
│           ├── product.md                 # Product overview
│           ├── tech.md                    # Technology stack
│           ├── structure.md               # Project structure
│           ├── requirements_generation.md # Requirements templates
│           ├── task_plan_generation.md    # Task planning templates
│           ├── pr_faq_generation.md       # PR-FAQ templates
│           └── executive_onepager_generation.md # One-pager templates
│
└── 📋 Configuration and Metadata
    ├── examples/                          # Configuration examples
    │   ├── mcp-client-config.json         # MCP client configuration
    │   └── server-config.json             # Server configuration
    │
    └── reports/                           # Analysis reports
        └── spec-lint.md                   # Specification quality report
```

## 🔧 Key Components Explained

### MCP Server (`src/mcp/`)
- **server.ts**: Main MCP server implementation with protocol handling
- **server-config.ts**: Tool registry and server configuration
- **tools/**: Individual MCP tool handlers for business intelligence

### Business Intelligence Pipeline (`src/pipeline/`)
- **ai-agent-pipeline.ts**: Main orchestration for business analysis workflows
- **performance-optimizer.ts**: Performance monitoring and optimization

### Core Components (`src/components/`)
- **business-analyzer/**: Market analysis and strategic assessment
- **pm-document-generator/**: Executive communications (one-pagers, PR-FAQs)
- **citation-service/**: Evidence compilation and source validation
- **intent-interpreter/**: Natural language processing for business queries

### Data Models (`src/models/`)
- **mcp.ts**: MCP protocol interfaces and types
- **citations.ts**: Citation management and evidence validation
- **competitive.ts**: Competitive analysis and market intelligence
- **consulting.ts**: Professional consulting framework models

### Utilities (`src/utils/`)
- **citation-integration.ts**: Citation management and validation
- **mcp-error-handling.ts**: Comprehensive error handling for MCP operations
- **confidence-scoring.ts**: Evidence-based confidence scoring algorithms

## 🎯 Hackathon Integration Points

### Kiro Usage Evidence
- **Spec-Driven Development**: Built using Kiro's Spec Mode (see `.kiro/specs/`)
- **Steering Files**: Custom PM workflow templates (see `.kiro/steering/`)
- **MCP Integration**: Native Kiro MCP protocol support

### Unique Datasets
- **Competitive Intelligence Matrix**: Public company positioning data
- **Market Timing Signals**: Industry trend analysis indicators
- **PM Innovation Index**: Product management best practices benchmarks

### Technical Innovation
- **Evidence-Backed Analysis**: All outputs include citations and confidence scoring
- **Professional Citations**: Academic-grade source validation
- **Consulting Frameworks**: MECE, Pyramid Principle, Impact vs Effort analysis
- **Automated Executive Intelligence**: CEO query processing with professional responses

## 🚀 Getting Started

1. **Installation**: `npm install && npm run build`
2. **Testing**: `npm test` (see TESTING.md for comprehensive guide)
3. **MCP Server**: `npm run mcp:server`
4. **Demo**: `npm run demo`
5. **Kiro Integration**: Add to MCP configuration (see README.md)

## 📊 Quality Metrics

- **Test Coverage**: >80% (unit + integration tests)
- **TypeScript**: 100% type safety with strict mode
- **Code Quality**: ESLint + Prettier for consistent formatting
- **Documentation**: Comprehensive guides and examples
- **Performance**: <15s response time for complex business intelligence

## 🔗 Key Files for Judges

1. **README.md**: Main project overview and installation
2. **TESTING.md**: Comprehensive testing instructions
3. **KIRO_USAGE.md**: Evidence of Kiro usage for development
4. **src/mcp/server.ts**: Core MCP server implementation
5. **src/pipeline/ai-agent-pipeline.ts**: Business intelligence pipeline
6. **demo/**: Working demonstrations of all features

---

*This structure demonstrates systematic development using Kiro's Spec Mode with evidence-backed business intelligence capabilities for the Code with Kiro Hackathon 2025.*