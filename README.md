# Vibe PM Agent - Evidence-Backed Business Intelligence MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

> **🏆 Code with Kiro Hackathon 2025 Submission**  
> Kiro's missing "PM Mode" that completes the development trinity by answering "WHY to build" questions with professional consulting-grade business analysis.

## 🎯 What is Vibe PM Agent?

Vibe PM Agent provides the missing "PM Mode" for Kiro, completing the development trinity:

- **PM Mode** (vibe-pm-agent): **WHY to build** - business justification and strategy
- **Spec Mode** (Kiro native): **WHAT to build** - requirements and specifications  
- **Vibe Mode** (Kiro native): **HOW to build** - implementation and code generation

Transform raw developer ideas into comprehensive business cases, strategic analysis, and executive-ready communications that justify technical decisions with professional consulting-grade analysis.

## ✨ Key Features

- 📊 **Business Intelligence MCP Tools**: Comprehensive market validation and strategic analysis
- 📈 **Evidence-Backed Analysis**: All outputs include citations, confidence scoring, and source validation
- 🎯 **Executive Communications**: Generate management one-pagers, PR-FAQs, and board presentations
- ⚡ **Quick Validation**: Fast go/no-go decisions with supporting evidence
- 🔄 **Automated Executive Intelligence**: Process CEO queries and generate professional responses
- 📋 **PM Document Generation**: Requirements, design options, and task plans with MoSCoW prioritization

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- **Kiro IDE** (for full integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/vibe-pm-agent.git
   cd vibe-pm-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests to verify installation**
   ```bash
   npm test
   ```

### Running the MCP Server

**Option 1: Direct execution**
```bash
npm run mcp:server
```

**Option 2: Development mode with auto-reload**
```bash
npm run dev
```

**Option 3: Using npx (for testing)**
```bash
npx vibe-pm-agent
```

The MCP server will start and be available for connections from Kiro or other MCP clients.

## 🧪 Testing Instructions for Judges

### 1. Verify Installation
```bash
# Install and build
npm install && npm run build

# Run all tests
npm test

# Verify MCP server starts
npm run mcp:server
```

### 2. Test Core Functionality

**Test Business Opportunity Analysis:**
```bash
node demo/test-mcp-server.js analyze_business_opportunity
```

**Test Executive Intelligence:**
```bash
node demo/test-mcp-server.js process_executive_query
```

**Test PM Document Generation:**
```bash
node demo/test-mcp-server.js generate_management_onepager
```

### 3. Interactive Demo

**RECOMMENDED: Complete PM Workflow Demo**
```bash
cd demo/ai-code-review-assistant
node run-complete-workflow.js   # Full PM workflow with 6 new tools
./show-analysis.sh             # View business analysis results
```
**Generates**: Business opportunity → Business case (300% ROI) → Executive one-pager → Market timing → Strategic alignment → Resource optimization

**Alternative: Citation Integration Demo**
```bash
cd demo/ai-customer-support
node test-citations.js          # New PM tools with citations
node test-enhanced-tools.js     # Enhanced existing tools
./show-results.sh              # View all results
```
**Generates**: 6 professional documents with 25+ citations from McKinsey, Gartner, BCG, HBR, PwC

**Traditional Demo Runner**
```bash
npm run demo
```

This will demonstrate:
- Complete PM workflow from opportunity to execution plan
- Business opportunity analysis with market validation
- ROI projections with comparable company data
- Executive communication generation
- Citation management and confidence scoring

### 4. Kiro Integration Test

If you have Kiro installed:
1. Add vibe-pm-agent to your MCP configuration
2. Test the tools directly in Kiro
3. See `KIRO_USAGE.md` for detailed integration examples

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with auto-reload
npm run build           # Build TypeScript to JavaScript
npm run type-check      # Run TypeScript type checking

# Testing
npm test               # Run all tests
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:watch     # Run tests in watch mode

# MCP Server
npm run mcp:server     # Start MCP server
npm run mcp:test       # Test MCP server functionality

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues automatically
npm run format         # Format code with Prettier

# Demo and Examples
npm run demo           # Run comprehensive demo
npm run demo:citations # Test citation integration
npm run demo:enhanced  # Test enhanced business tools
```

### Project Structure

```
src/
├── components/              # Core business intelligence components
│   ├── business-analyzer/   # Market analysis and strategic assessment
│   ├── pm-document-generator/ # Executive communications generation
│   ├── citation-service/    # Evidence compilation and validation
│   └── ...
├── mcp/                    # MCP Server implementation
│   ├── server.ts          # Main MCP server
│   ├── server-config.ts   # Server configuration
│   └── tools/             # MCP tool handlers
├── models/                 # TypeScript interfaces and data structures
├── pipeline/              # Business intelligence pipeline
├── utils/                 # Shared utilities
└── tests/                 # Comprehensive test suite
```

## 🔧 MCP Tools Reference

### Core Business Intelligence Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `analyze_business_opportunity` | Market validation and strategic fit assessment | Feature idea, market context | Comprehensive opportunity analysis with citations |
| `generate_business_case` | ROI analysis with multi-scenario projections | Opportunity analysis, financial inputs | Business case with risk assessment |
| `create_stakeholder_communication` | Executive communications generation | Business case, audience type | One-pagers, PR-FAQs, presentations |
| `assess_strategic_alignment` | Company OKR and mission alignment | Feature concept, company context | Strategic alignment assessment |
| `validate_market_timing` | Right-time recommendations | Feature idea, market signals | Market timing validation |
| `process_executive_query` | Automated executive intelligence | CEO question, context | Comprehensive business intelligence |

### PM Workflow Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `generate_requirements` | PM-grade requirements with MoSCoW prioritization | Raw intent, context | Structured requirements document |
| `generate_design_options` | Conservative/Balanced/Bold alternatives | Requirements | Design options with Impact vs Effort matrix |
| `generate_task_plan` | Phased implementation plan | Design, limits | Task plan with guardrails and phases |
| `generate_management_onepager` | Executive one-pager with Pyramid Principle | Requirements, design, ROI | Management one-pager |
| `generate_pr_faq` | Amazon-style PR-FAQ document | Requirements, design, target date | PR-FAQ with press release and checklist |

## 📊 Evidence & Citation System

All outputs include:
- **Comprehensive Citations**: Source URLs, publication dates, credibility ratings (A/B/C)
- **Confidence Scoring**: 0-100% confidence based on evidence quality
- **Source Validation**: Automatic verification of market research and competitive data
- **Methodology Transparency**: Clear explanation of analysis approaches

## 🎯 Hackathon Highlights

### Kiro Integration Excellence
- **Spec-Driven Development**: Built using Kiro's Spec Mode for systematic feature development
- **Steering Files**: Custom PM workflow templates and business analysis prompts
- **MCP Protocol**: Native integration with Kiro's Model Context Protocol ecosystem
- **Evidence-Backed**: All business intelligence includes citations and confidence scoring

### Unique Datasets Integration
- **Competitive Intelligence Matrix**: Public company data and market positioning
- **Market Timing Signals**: Industry trend analysis and competitive windows
- **PM Innovation Index**: Product management best practices and benchmarks
- **Quota Optimization Metrics**: Development efficiency and resource allocation data

### Technical Innovation
- **Professional Citations**: Academic-grade source validation and credibility scoring
- **Consulting Frameworks**: MECE, Pyramid Principle, Impact vs Effort analysis
- **Multi-Scenario ROI**: Conservative/Balanced/Bold financial projections
- **Automated Executive Intelligence**: CEO query processing with professional responses

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/vibe-pm-agent/issues)
- **Documentation**: See `docs/` directory for detailed guides
- **Kiro Integration**: See `KIRO_USAGE.md` for Kiro-specific examples

## 🏆 Hackathon Submission Details

**Category**: Productivity & Workflow Tools  
**Built with**: Kiro IDE, TypeScript, Node.js, MCP Protocol  
**Unique Value**: Evidence-backed business intelligence with professional citations and confidence scoring

---

*Built with ❤️ using Kiro IDE for the Code with Kiro Hackathon 2025*