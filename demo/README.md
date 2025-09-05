# 🎬 Vibe PM Agent Demonstrations

Real-world scenarios showing PM Mode in action - from raw developer intent to executive-ready business cases.

## 🎯 Demo Scenarios

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

## 📚 Data Sources & Methodology

All scenarios use **real industry data** from authoritative sources:
- **SaaS Metrics**: Klipfolio, Gainsight benchmarks [3,8]
- **E-commerce Data**: Baymard Institute conversion studies [7]  
- **PM Benchmarks**: ProductPlan, Gartner research [1,4]
- **No fictional metrics or hallucinated data**

See `references-and-methodology.md` for complete citation details and validation process.

*Demonstrates evidence-based WHY → WHAT → HOW development workflow*