# 🚀 Vibe PM Agent: PM Mode for Kiro

> **"Like having a McKinsey consultant in your IDE"** - Completes Kiro's development trinity with strategic "WHY to build" analysis.

[![MCP Integration](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![Kiro Integration](https://img.shields.io/badge/Kiro-PM%20Mode-purple)](https://kiro.ai)
[![Consulting Grade](https://img.shields.io/badge/Analysis-Consulting%20Grade-gold)](https://github.com/yourusername/vibe-pm-agent)

**Completes Kiro's development trinity:** PM Mode (WHY) + Spec Mode (WHAT) + Vibe Mode (HOW)

## 🎯 The Missing Piece

Kiro has **Spec Mode** (WHAT to build) and **Vibe Mode** (HOW to build), but lacks **PM Mode** (WHY to build). Teams jump into implementation without strategic justification:

- 💸 No business case or ROI analysis
- ⏰ Missing market timing validation  
- 🎲 No stakeholder alignment
- 📊 Lack of executive communication

## 💡 Solution: PM Mode for Kiro

**Vibe PM Agent** adds the missing **PM Mode** with professional consulting-grade analysis.

### 🎯 Kiro Development Trinity

| Mode | Purpose | Tools |
|------|---------|-------|
| **PM Mode** | WHY to build | Business analysis, ROI, strategy |
| **Spec Mode** | WHAT to build | Requirements, specifications |
| **Vibe Mode** | HOW to build | Implementation, code generation |

### 🔄 Integrated Workflow

```typescript
1. PM Mode: "Why build auth now?" → Business case + market timing
2. Spec Mode: "What auth features?" → Requirements (with PM context)  
3. Vibe Mode: "How to implement?" → Code (with Spec requirements)
```

### 🧠 Key Capabilities
- **Quick Validation**: 30-second PASS/FAIL with 3 strategic options
- **Business Analysis**: ROI, market timing, strategic alignment
- **Executive Communication**: One-pagers, PR-FAQs, board presentations
- **Kiro Steering Integration**: PM analysis becomes persistent development context

## 🛠 MCP Tools

**10 professional PM tools** accessible via MCP protocol:

### Quick Decision
- `validate_idea_quick` - Fast PASS/FAIL + 3 strategic options
- `optimize_intent` - Full business analysis + technical recommendations

### PM Workflow  
- `generate_requirements` - Business goals + MoSCoW prioritization
- `generate_design_options` - Conservative/Balanced/Bold alternatives
- `generate_task_plan` - Phased roadmap with guardrails

### Executive Communication
- `generate_management_onepager` - Executive summary with ROI
- `generate_pr_faq` - Amazon-style launch communication

### Analysis
- `analyze_workflow` - Process optimization with consulting techniques
- `generate_roi_analysis` - Multi-scenario cost comparison
- `get_consulting_summary` - Professional analysis report

## 🚀 Getting Started

### Installation
```bash
git clone https://github.com/yourusername/vibe-pm-agent
cd vibe-pm-agent
npm install && npm run build
```

### MCP Integration
```json
{
  "mcpServers": {
    "vibe-pm-agent": {
      "command": "node",
      "args": ["./bin/mcp-server.js"],
      "env": {}
    }
  }
}
```

### Quick Test
```bash
# Validate an idea in 30 seconds
echo '{"tool": "validate_idea_quick", "input": {"idea": "Build real-time analytics dashboard"}}' | node bin/mcp-server.js
```

## 📊 Example Analysis

**Input**: "Build churn prediction dashboard for customer success team"

**PM Mode Output**:
- **Conservative**: Basic weekly reports with manual review
- **Balanced**: Automated weekly reports with key metrics ✅ 
- **Bold**: Real-time dashboard with predictive analytics

**Generated Artifacts**:
- ✅ Business case with ROI analysis
- ✅ Executive one-pager with decision rationale
- ✅ PR-FAQ for stakeholder alignment
- ✅ Phased task plan with guardrails
- ✅ Kiro steering files for future development context

## 🔄 Kiro Steering Integration

**Every PM analysis becomes persistent strategic knowledge:**

- **Business Cases** → Steering files for future feature context
- **Market Analysis** → Strategic timing context for development decisions
- **Executive Communications** → Stakeholder alignment templates
- **ROI Analyses** → Investment justification benchmarks

**Self-Improving Development**: PM Mode → Steering Files → Spec Mode (with context) → Vibe Mode

## 🏆 Why This Matters

**Completes the missing dimension of product management** - where Kiro addresses WHAT (spec mode) and HOW (vibe mode), but never WHY (business justification).

**Key Innovation**: First system to unify WHY/WHAT/HOW in a single development workflow with self-improving Kiro Agent Steering integration.

**Impact**: Makes every technical decision strategically informed while building institutional knowledge that compounds over time.

## 📚 Documentation

- **[PM Workflow Guide](docs/pm-workflow-guide.md)**: Complete workflows from validation to executive communication
- **[Quick Validation Guide](docs/quick-validation-guide.md)**: Master fast idea screening
- **[Steering Integration Guide](docs/steering-file-integration-guide.md)**: How PM analysis becomes persistent Kiro guidance
- **[MCP Tools Reference](docs/mcp-tools-documentation.md)**: Complete API reference

## 🤝 Contributing

```bash
npm run dev          # Development mode
npm test            # Run tests
npm run build       # Production build
```

## 📄 License

MIT License - Built with ❤️ for strategic development decisions.