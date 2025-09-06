# Testing Guide for Vibe PM Agent

This document provides comprehensive testing instructions for judges and developers evaluating the Vibe PM Agent MCP Server.

## 🚀 Quick Start Testing

### 1. Installation Verification

```bash
# Clone and install
git clone https://github.com/your-username/vibe-pm-agent.git
cd vibe-pm-agent
npm install

# Build the project
npm run build

# Verify installation
npm test
```

**Expected Output**: All tests should pass, confirming the installation is successful.

### 2. MCP Server Health Check

```bash
# Check server health
npm run mcp:server -- --health-check
```

**Expected Output**:
```json
{
  "status": "healthy",
  "uptime": 0,
  "toolsAvailable": [
    "analyze_business_opportunity",
    "generate_business_case",
    "create_stakeholder_communication",
    "assess_strategic_alignment",
    "validate_market_timing",
    "process_executive_query",
    "generate_management_onepager",
    "generate_pr_faq",
    "generate_requirements",
    "generate_design_options",
    "generate_task_plan"
  ],
  "performance": {
    "averageResponseTime": 0,
    "totalRequests": 0,
    "errorRate": 0
  },
  "timestamp": "2025-01-09T..."
}
```

## 🧪 Core Functionality Tests

### Test 1: Business Opportunity Analysis

```bash
node demo/test-mcp-server.js analyze_business_opportunity
```

**What it tests**: Market validation, competitive analysis, and strategic fit assessment with evidence-backed citations.

**Expected Features**:
- Comprehensive market opportunity analysis
- Competitive landscape assessment
- Customer validation data with confidence scoring
- Strategic fit evaluation with company alignment
- Comprehensive citations with credibility ratings (A/B/C scale)
- Confidence scores (0-100%) for all recommendations

### Test 2: Executive Intelligence Processing

```bash
node demo/test-mcp-server.js process_executive_query
```

**What it tests**: Automated CEO query processing with comprehensive business intelligence generation.

**Expected Features**:
- Intent analysis and business question categorization
- Market intelligence aggregation with verified sources
- Financial modeling with comparable company data
- Risk assessment with probability estimates and mitigation strategies
- Executive communication formatting with professional structure
- Evidence compilation with methodology transparency

### Test 3: PM Document Generation

```bash
node demo/test-mcp-server.js generate_management_onepager
```

**What it tests**: Executive-ready document generation with Pyramid Principle structure.

**Expected Features**:
- Answer-first structure with clear recommendation and confidence score
- Exactly 3 supporting reasons with evidence-backed rationale
- Risk assessment with specific mitigation strategies and owners
- Options analysis (Conservative/Balanced/Bold) with ROI comparison
- Right-time recommendation with market rationale
- Professional formatting under 120 lines (one page equivalent)

## 🎯 Advanced Testing Scenarios

### Scenario 1: Complete PM Workflow

Test the full PM workflow from idea to execution:

```bash
# 1. Generate requirements from raw idea
node -e "
const { PMAgentMCPServer } = require('./dist/mcp/server.js');
const server = new PMAgentMCPServer();

async function testWorkflow() {
  const rawIdea = 'Build an AI-powered customer support chatbot that reduces response time by 50%';
  
  // Step 1: Generate requirements
  const requirements = await server.handleGenerateRequirements({
    raw_intent: rawIdea,
    context: { industry: 'SaaS', budget: 100000, timeline: '6 months' }
  });
  
  console.log('✅ Requirements generated');
  console.log('Business Goal:', requirements.content[0].text.split('\n')[0]);
  
  // Step 2: Generate design options
  const design = await server.handleGenerateDesignOptions({
    requirements: requirements.content[0].text
  });
  
  console.log('✅ Design options generated');
  console.log('Recommended approach:', design.content[0].text.includes('Balanced') ? 'Balanced' : 'Other');
  
  // Step 3: Generate management one-pager
  const onePager = await server.handleGenerateManagementOnePager({
    requirements: requirements.content[0].text,
    design: design.content[0].text,
    roi_inputs: { cost_naive: 150000, cost_balanced: 100000, cost_bold: 200000 }
  });
  
  console.log('✅ Management one-pager generated');
  console.log('Length:', onePager.content[0].text.split('\n').length, 'lines (should be ≤120)');
}

testWorkflow().catch(console.error);
"
```

### Scenario 2: Citation and Evidence Validation

Test the evidence-backed analysis capabilities:

```bash
node demo/ai-customer-support/test-citations.js
```

**What it validates**:
- All quantitative claims include source citations
- Market data references A-tier sources (Gartner, Forrester, McKinsey)
- Competitive intelligence cites verifiable public sources
- Financial projections include confidence intervals
- Methodology transparency for all analysis approaches

### Scenario 3: Kiro Integration Test

If you have Kiro installed, test the MCP integration:

1. **Add to Kiro MCP Configuration**:
   ```json
   {
     "mcpServers": {
       "vibe-pm-agent": {
         "command": "node",
         "args": ["./bin/mcp-server.js"],
         "cwd": "/path/to/vibe-pm-agent",
         "env": {}
       }
     }
   }
   ```

2. **Test in Kiro**:
   - Open Kiro IDE
   - Use the MCP tools directly in chat
   - Test business opportunity analysis with a real feature idea
   - Generate executive communications for stakeholder review

## 📊 Performance Benchmarks

### Response Time Expectations

| Tool | Expected Response Time | Complexity |
|------|----------------------|------------|
| `validate_market_timing` | < 2 seconds | Low |
| `analyze_business_opportunity` | < 10 seconds | Medium |
| `generate_business_case` | < 15 seconds | High |
| `process_executive_query` | < 15 seconds | High |
| `generate_management_onepager` | < 8 seconds | Medium |
| `generate_pr_faq` | < 12 seconds | High |

### Quality Metrics

Run the comprehensive test suite to validate quality:

```bash
# Run all tests with coverage
npm run test:coverage

# Expected coverage targets:
# - Statements: >80%
# - Branches: >75%
# - Functions: >85%
# - Lines: >80%
```

## 🔍 Error Handling Tests

### Test Invalid Inputs

```bash
# Test with missing required parameters
node -e "
const { PMAgentMCPServer } = require('./dist/mcp/server.js');
const server = new PMAgentMCPServer();

async function testErrorHandling() {
  try {
    await server.handleAnalyzeBusinessOpportunity({});
    console.log('❌ Should have thrown validation error');
  } catch (error) {
    console.log('✅ Validation error caught:', error.message);
  }
  
  try {
    await server.handleGenerateRequirements({ raw_intent: '' });
    console.log('❌ Should have thrown empty input error');
  } catch (error) {
    console.log('✅ Empty input error caught:', error.message);
  }
}

testErrorHandling().catch(console.error);
"
```

### Test Resource Limits

```bash
# Test with very large inputs
node -e "
const { PMAgentMCPServer } = require('./dist/mcp/server.js');
const server = new PMAgentMCPServer();

async function testLimits() {
  const largeInput = 'A'.repeat(100000); // 100KB input
  
  try {
    const result = await server.handleGenerateRequirements({
      raw_intent: largeInput
    });
    console.log('✅ Large input handled gracefully');
    console.log('Response size:', JSON.stringify(result).length, 'bytes');
  } catch (error) {
    console.log('⚠️ Large input error:', error.message);
  }
}

testLimits().catch(console.error);
"
```

## 🏆 Hackathon Evaluation Criteria

### 1. Potential Value (33.3%)

**Test Commands**:
```bash
# Test business value generation
npm run demo:enhanced

# Test unique dataset integration
npm run demo:unique-datasets

# Test executive communication quality
node demo/test-mcp-server.js generate_management_onepager
```

**Evaluation Points**:
- ✅ Solves real PM workflow pain points
- ✅ Generates professional-grade business documents
- ✅ Provides evidence-backed analysis with citations
- ✅ Integrates unique public datasets for competitive intelligence
- ✅ Accessible through standard MCP protocol

### 2. Implementation Quality (33.3%)

**Test Commands**:
```bash
# Test Kiro integration
npm run test:integration

# Test MCP protocol compliance
npm run mcp:test

# Test error handling robustness
npm run test:unit
```

**Evaluation Points**:
- ✅ Leverages Kiro's Spec Mode for systematic development
- ✅ Uses MCP protocol for seamless integration
- ✅ Implements comprehensive error handling
- ✅ Provides professional citation management
- ✅ Includes confidence scoring for all recommendations

### 3. Creativity and Innovation (33.3%)

**Test Commands**:
```bash
# Test unique PM frameworks
node demo/test-mcp-server.js assess_strategic_alignment

# Test automated executive intelligence
node demo/test-mcp-server.js process_executive_query

# Test evidence-backed analysis
npm run demo:citations
```

**Evaluation Points**:
- ✅ Novel approach to PM automation with evidence backing
- ✅ Unique integration of consulting frameworks (MECE, Pyramid Principle)
- ✅ Innovative citation management with credibility scoring
- ✅ Creative use of public datasets for competitive intelligence
- ✅ Automated executive intelligence processing

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**:
   ```bash
   # Clean and rebuild
   npm run clean
   npm install
   npm run build
   ```

2. **Test Failures**:
   ```bash
   # Run tests with verbose output
   npm test -- --verbose
   
   # Run specific test category
   npm run test:unit
   npm run test:integration
   ```

3. **MCP Connection Issues**:
   ```bash
   # Test MCP server directly
   npm run mcp:server:debug
   
   # Check health status
   npm run mcp:server -- --health-check
   ```

4. **Performance Issues**:
   ```bash
   # Run with performance monitoring
   npm run mcp:server -- --log-level debug
   
   # Check memory usage
   node --inspect dist/mcp/server.js
   ```

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/your-username/vibe-pm-agent/issues)
- **Documentation**: See `docs/` directory for detailed guides
- **Kiro Integration**: See `KIRO_USAGE.md` for Kiro-specific examples

## ✅ Success Criteria Checklist

For judges evaluating the submission:

- [ ] **Installation**: Project installs and builds without errors
- [ ] **Functionality**: All MCP tools respond correctly to test inputs
- [ ] **Integration**: Works with Kiro IDE through MCP protocol
- [ ] **Quality**: Generates professional-grade business documents
- [ ] **Innovation**: Demonstrates unique approach to PM automation
- [ ] **Evidence**: All outputs include proper citations and confidence scoring
- [ ] **Performance**: Meets response time benchmarks
- [ ] **Error Handling**: Gracefully handles invalid inputs and edge cases
- [ ] **Documentation**: Clear usage instructions and examples provided
- [ ] **Kiro Usage**: Demonstrates effective use of Kiro for development

---

*This testing guide ensures comprehensive evaluation of the Vibe PM Agent's capabilities for the Code with Kiro Hackathon 2025.*