# 🎬 Vibe PM Agent Demonstrations

Real-world scenarios showing PM Mode in action - from raw developer intent to executive-ready business cases **with authoritative citations**.

## 🎯 Demo Scenarios

### 🆕 **AI Customer Support Platform** (`ai-customer-support/`) ⭐ **NEW**
**Context**: SaaS company building AI-powered customer support automation
**Demonstrates**: **Citation integration across all PM tools** with McKinsey, Gartner, BCG, HBR sources
**Features**: 6 professional documents, 25+ authoritative citations, executive-ready quality
```bash
cd demo/ai-customer-support
node test-citations.js          # Test new PM tools with citations
node test-enhanced-tools.js     # Test enhanced existing tools
./show-results.sh              # View all generated documents
```

### 1. **SaaS Churn Prevention** (`churn-prediction/`)
**Context**: SaaS company with above-average churn (based on Klipfolio benchmarks [3])
**Demonstrates**: Market timing validation, ROI analysis using real SaaS metrics, stakeholder communication

### 2. **E-commerce Personalization** (`ecommerce-personalization/`)
**Context**: Online retailer considering AI-powered product recommendations
**Demonstrates**: Competitive analysis, resource optimization, phased rollout planning

### 3. **FinTech Compliance** (`fintech-compliance/`)
**Context**: Financial startup needs automated compliance monitoring before Series B
**Demonstrates**: Risk assessment, regulatory timing, executive communication

### 4. **Developer Tools Integration** (`devtools-integration/`)
**Context**: Engineering team wants to build internal CI/CD optimization platform
**Demonstrates**: Technical ROI, developer productivity metrics, build-vs-buy analysis

## 🚀 How to Run Demos

### 🎯 **Citation Integration Demo** (Recommended)
```bash
cd demo/ai-customer-support
node test-citations.js          # New PM tools with citations
node test-enhanced-tools.js     # Enhanced existing tools
./show-results.sh              # View all results
```
**Generates**: 6 professional documents with 25+ citations from McKinsey, Gartner, BCG, HBR, PwC

### Traditional Demos
Each demo folder contains:
- `input.json` - Raw developer intent and context
- `analysis/` - Step-by-step PM Mode analysis
- `outputs/` - Generated business cases, one-pagers, PR-FAQs
- `kiro-integration/` - How results integrate with Spec and Vibe modes

### Quick Demo
```bash
cd demo/churn-prediction
cat input.json | node ../../bin/mcp-server.js --tool analyze_business_opportunity
```

## 📊 Expected Outcomes

Each demo shows:
- ✅ **Market Timing**: Analysis using real industry benchmarks and timing factors
- ✅ **Business Case**: ROI calculations based on authoritative industry data  
- ✅ **Executive Communication**: Documents following proven PM frameworks
- ✅ **Kiro Integration**: Steering files for persistent strategic context
- ✅ **Implementation Roadmap**: Phased approach with industry-standard practices
- ✅ **🆕 Authoritative Citations**: Every document includes references from McKinsey, Gartner, BCG, HBR, PwC
- ✅ **🆕 Professional Quality**: Executive-ready documents with consulting-grade backing

## 📚 Data Sources & Methodology

All scenarios use **real industry data** from authoritative sources:
- **SaaS Metrics**: Klipfolio, Gainsight benchmarks [3,8]
- **E-commerce Data**: Baymard Institute conversion studies [7]  
- **PM Benchmarks**: ProductPlan, Gartner research [1,4]
- **🆕 Citation Integration**: McKinsey, Gartner, BCG, Harvard Business Review, PwC, Bain, Deloitte
- **No fictional metrics or hallucinated data**

### 🎯 **Citation Quality Standards**
- **15 high-authority sources** from top consulting firms and research organizations
- **100% from 2024** ensuring recency and relevance
- **Global scope** with industry-specific focus
- **Detailed methodology** and sample sizes for each source

See `docs/citations.json` for complete citation database and `demo/ai-customer-support/DEMO-RESULTS.md` for validation results.

*Demonstrates evidence-based WHY → WHAT → HOW development workflow **with authoritative backing***