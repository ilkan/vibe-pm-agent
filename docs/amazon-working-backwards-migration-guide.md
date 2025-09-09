# Amazon Working Backwards Migration Guide

## Overview

The Vibe PM Agent now uses **Amazon Working Backwards methodology by default** to provide judge-proof business intelligence with comprehensive evidence mechanisms. This guide helps you understand the changes and migrate smoothly from standard mode.

## What's New

### Amazon Working Backwards as Default Mode

Starting with this version, all MCP tools use Amazon Working Backwards methodology by default, providing:

- **Assumption Ledger**: Transparent tracking of all business assumptions with source validation
- **Confidence Scoring**: 0-100 confidence assessment with detailed breakdown
- **Scenario Analysis**: Bear/base/bull projections with sensitivity analysis
- **Hard Questions**: Adversarial questions that anticipate stakeholder challenges
- **Evidence Mechanisms**: Comprehensive documentation for executive scrutiny

### Backward Compatibility

**✅ Your existing integrations will continue to work without changes.**

The system includes automatic fallback to standard mode if Amazon mechanisms fail, ensuring reliability while providing enhanced capabilities when possible.

## Migration Options

### Option 1: Use Amazon Mode (Recommended)

**No changes required** - Amazon mode is enabled by default with graceful fallback.

```json
{
  "tool": "generate_business_case",
  "arguments": {
    "opportunity_analysis": "Your analysis here...",
    "financial_inputs": { ... }
  }
}
```

### Option 2: Explicitly Enable Amazon Mode

For maximum control, explicitly enable Amazon features:

```json
{
  "tool": "generate_business_case",
  "arguments": {
    "opportunity_analysis": "Your analysis here...",
    "amazon_mode": true,
    "include_evidence_mechanisms": true,
    "financial_inputs": { ... }
  }
}
```

### Option 3: Disable Amazon Mode (Legacy Behavior)

To use standard mode only (not recommended for new projects):

```json
{
  "tool": "generate_business_case",
  "arguments": {
    "opportunity_analysis": "Your analysis here...",
    "amazon_mode": false,
    "include_evidence_mechanisms": false,
    "financial_inputs": { ... }
  }
}
```

### Option 4: Environment Configuration

Configure mode globally via environment variables:

```bash
# Enable Amazon mode (default)
export VIBE_PM_MODE=amazon

# Use standard mode
export VIBE_PM_MODE=standard

# Use hybrid mode (Amazon with enhanced fallback)
export VIBE_PM_MODE=hybrid

# Individual settings
export VIBE_PM_AMAZON_ENABLED=true
export VIBE_PM_FALLBACK_ENABLED=true
export VIBE_PM_EVIDENCE_MECHANISMS=true
```

## API Changes

### New Parameters

Both `generate_business_case` and `create_stakeholder_communication` tools now support:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `amazon_mode` | boolean | `true` | Enable Amazon Working Backwards methodology |
| `include_evidence_mechanisms` | boolean | `true` | Include assumption ledger, confidence scoring, scenarios, and hard questions |

### Enhanced Response Metadata

Responses now include Amazon mode information:

```json
{
  "content": "Generated document...",
  "metadata": {
    "confidenceScore": 85,
    "amazonMode": {
      "enabled": true,
      "fallbackReason": null,
      "performanceMetrics": {
        "assumptionLedgerTime": 1200,
        "confidenceTime": 800,
        "scenarioTime": 1500,
        "hardQuestionsTime": 900,
        "totalTime": 4400
      }
    },
    "quotaUsed": 4,
    "executionTime": 4500
  }
}
```

### Steering File Enhancements

Steering files now include Amazon-specific front-matter:

```yaml
---
title: "Business Case — Feature Name"
artifact_type: business_case
profile: amazon
mode: amazon
confidence:
  total: 85
assumptions:
  count: 12
  coverage_pct: 75
scenarios:
  count: 3
paths:
  assumptions_json: "./attachments/assumptions-a1b2c3d4.json"
  citations_json: "./attachments/citations-a1b2c3d4.json"
  scenarios_json: "./attachments/scenarios-a1b2c3d4.json"
---
```

## Performance Considerations

### Timing Expectations

| Mode | Expected Time | Quota Usage |
|------|---------------|-------------|
| Amazon Mode | < 2 minutes | 4 units |
| Standard Mode | < 1 minute | 2 units |
| Hybrid Mode | < 2 minutes | 3-4 units |

### Timeout Handling

Amazon mode includes automatic timeout protection:

- **Assumption Ledger**: 5 seconds
- **Confidence Scoring**: 3 seconds  
- **Scenario Analysis**: 4 seconds
- **Hard Questions**: 3 seconds
- **Total Generation**: 2 minutes

If any mechanism times out, the system gracefully falls back to standard mode.

## Quality Improvements

### Evidence Mechanisms

Amazon mode provides transparent evidence tracking:

```markdown
## Evidence Mechanisms

### Assumption Ledger
| ID | Name | Value | Certainty | Sources |
|----|------|-------|-----------|---------|
| A1 | Market Size | $2.5B | High | 3 |
| A2 | Growth Rate | 15% | Medium | 2 |

### Confidence Assessment
**Overall Confidence**: 85/100 ✅

### Scenario Analysis
| Metric | Bear | Base | Bull |
|--------|------|------|------|
| Revenue | $800K | **$1.2M** | $1.8M |
| ROI | 45% | **75%** | 120% |

### Hard Questions
**Q1**: How do you know the market size assumption is accurate?
**Q2**: What if competitors respond faster than expected?
```

### Confidence Scoring Breakdown

- **Evidence Quality (25%)**: Source credibility and quantity
- **Data Recency (20%)**: How recent the supporting data is
- **Source Diversity (15%)**: Variety of source types
- **Source Agreement (15%)**: Consistency across sources
- **Assumption Coverage (15%)**: Percentage with documented sources
- **Sensitivity Analysis (10%)**: Impact of assumption changes

## Testing Your Migration

### 1. Verify Amazon Mode Works

```bash
curl -X POST http://localhost:3000/mcp/tools/generate_business_case \
  -H "Content-Type: application/json" \
  -d '{
    "opportunity_analysis": "Test analysis with market size $1B and 20% growth",
    "amazon_mode": true
  }'
```

Expected response should include `"amazonMode": {"enabled": true}` in metadata.

### 2. Test Fallback Behavior

```bash
curl -X POST http://localhost:3000/mcp/tools/generate_business_case \
  -H "Content-Type: application/json" \
  -d '{
    "opportunity_analysis": "Test analysis",
    "amazon_mode": false
  }'
```

Expected response should include `"amazonMode": {"enabled": false}` in metadata.

### 3. Verify Steering Files

Check that steering files are created with Amazon profile:

```bash
ls .kiro/steering/working-backwards/
cat .kiro/steering/working-backwards/*/latest.json
```

## Troubleshooting

### Common Issues

#### 1. Amazon Mode Not Working

**Symptoms**: No evidence mechanisms in output, standard mode used unexpectedly

**Solutions**:
- Check `amazon_mode` parameter is not explicitly set to `false`
- Verify environment variables: `echo $VIBE_PM_MODE`
- Check logs for timeout or error messages

#### 2. Performance Issues

**Symptoms**: Slow response times, timeouts

**Solutions**:
- Reduce input complexity for faster processing
- Use `include_evidence_mechanisms: false` for faster generation
- Check system resources and network connectivity

#### 3. Confidence Scores Too Low

**Symptoms**: Confidence scores consistently below 60

**Solutions**:
- Provide more detailed opportunity analysis with sources
- Include financial inputs for better scenario analysis
- Add competitive context and market data

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Amazon mode disabled and no standard generator provided" | Amazon mode disabled without fallback | Enable `amazon_mode` or ensure fallback is available |
| "Operation timed out after 120000ms" | Amazon mechanisms taking too long | Reduce input complexity or disable specific mechanisms |
| "Assumption ledger generation failed" | Invalid business inputs | Provide more structured opportunity analysis |

## Best Practices

### 1. Optimize for Amazon Mode

- **Provide structured inputs**: Include clear assumptions, market data, and financial projections
- **Add source references**: Include URLs and citations in opportunity analysis
- **Use specific metrics**: Quantify market size, growth rates, and financial projections

### 2. Monitor Performance

- **Check confidence scores**: Aim for scores above 70 for executive presentations
- **Review assumption coverage**: Target 80%+ coverage for judge-proof documents
- **Validate hard questions**: Ensure questions address real stakeholder concerns

### 3. Leverage Steering Integration

- **Enable steering files**: Use `create_steering_files: true` for workflow automation
- **Organize by feature**: Use meaningful `feature_name` for steering organization
- **Review attachments**: Check JSON attachments for detailed mechanism data

## Support

### Documentation

- [Amazon Working Backwards Design](./amazon-working-backwards-design.md)
- [Evidence Mechanisms Guide](./evidence-mechanisms-guide.md)
- [Performance Optimization](./performance-optimization.md)

### Configuration Reference

- [Amazon Mode Configuration](../src/models/amazon-config.ts)
- [MCP Tool Schemas](../src/mcp/tools/)
- [Environment Variables](./environment-configuration.md)

### Getting Help

1. **Check logs**: Review MCP server logs for detailed error information
2. **Test with minimal inputs**: Start with simple examples to isolate issues
3. **Verify configuration**: Ensure environment variables and parameters are correct
4. **Review performance metrics**: Check timing and quota usage in response metadata

## Migration Checklist

- [ ] **Test Amazon mode** with existing inputs
- [ ] **Verify fallback behavior** works as expected
- [ ] **Update integration tests** to handle new response format
- [ ] **Review confidence scores** and optimize inputs if needed
- [ ] **Enable steering files** for workflow automation
- [ ] **Monitor performance** and adjust timeouts if necessary
- [ ] **Train team** on new evidence mechanisms and confidence scoring
- [ ] **Update documentation** to reflect Amazon Working Backwards capabilities

## Conclusion

Amazon Working Backwards mode provides significant value through transparent evidence mechanisms and judge-proof documentation. The migration is designed to be seamless with automatic fallback ensuring reliability.

**Recommended approach**: Start with default Amazon mode and optimize inputs based on confidence scores and performance metrics. The enhanced capabilities will improve stakeholder trust and decision-making quality without breaking existing workflows.