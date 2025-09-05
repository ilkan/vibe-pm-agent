# Steering File Integration Issue & Fix

## Problem Identified

The steering files are being created successfully, but they contain generic template content instead of the actual competitive analysis results. 

### Root Cause
1. **MCP Server**: Passes `JSON.stringify(competitorAnalysis, null, 2)` to steering service
2. **Extraction Methods**: Use basic string matching on JSON string instead of parsing structured data
3. **Result**: Generic template content instead of actual analysis insights

### Current Extraction Method (Broken)
```typescript
private extractCompetitiveLandscape(analysis: string): string {
  const insights = [];
  
  if (analysis.includes('competitor') || analysis.includes('competitive')) {
    insights.push('- Competitive landscape analysis available');
  }
  // ... more generic checks
  
  return insights.length > 0 ? insights.join('\n') : 'Competitive landscape insights derived from analysis.';
}
```

### Expected Behavior
Steering files should contain:
- **Specific competitor names** (e.g., "GitHub Copilot, SonarQube, Snyk")
- **Actual market sizing data** (e.g., "TAM: $50M, SAM: $10M, SOM: $2M")
- **Strategic recommendations** from the analysis
- **SWOT insights** with specific strengths/weaknesses
- **Market positioning** details

## Solution Required

### 1. Update Extraction Methods
Parse JSON data and extract actual content:

```typescript
private extractCompetitiveLandscape(analysis: string): string {
  try {
    const data = JSON.parse(analysis);
    const insights = [];
    
    if (data.competitiveMatrix?.competitors) {
      const competitorNames = data.competitiveMatrix.competitors.map(c => c.name).join(', ');
      insights.push(`- Key competitors identified: ${competitorNames}`);
    }
    
    if (data.marketPositioning?.marketGaps) {
      insights.push(`- Market gaps: ${data.marketPositioning.marketGaps.join(', ')}`);
    }
    
    return insights.length > 0 ? insights.join('\n') : 'Competitive landscape analysis available';
  } catch (error) {
    return 'Competitive landscape insights derived from analysis.';
  }
}
```

### 2. Update Market Sizing Extraction
```typescript
private extractTAMSAMSOM(sizing: string): string {
  try {
    const data = JSON.parse(sizing);
    const insights = [];
    
    if (data.tam?.value) {
      insights.push(`- TAM: $${(data.tam.value / 1000000).toFixed(0)}M`);
    }
    if (data.sam?.value) {
      insights.push(`- SAM: $${(data.sam.value / 1000000).toFixed(0)}M`);
    }
    if (data.som?.value) {
      insights.push(`- SOM: $${(data.som.value / 1000000).toFixed(0)}M`);
    }
    
    return insights.length > 0 ? insights.join('\n') : 'TAM/SAM/SOM analysis available';
  } catch (error) {
    return 'Market sizing analysis available';
  }
}
```

## Implementation Priority

This is a **HIGH PRIORITY** fix because:
1. Steering files are a key integration point with Kiro's development workflow
2. Generic content provides no value to developers
3. The feature appears broken to end users
4. Real competitive intelligence should guide development decisions

## Test Validation

After fix, steering files should contain:
- ✅ Actual competitor names from analysis
- ✅ Specific market sizing figures  
- ✅ Strategic recommendations with details
- ✅ SWOT insights with specific points
- ✅ Market positioning guidance

## Files to Update

1. `src/components/steering-file-generator/index.ts` - Update extraction methods
2. `src/tests/unit/steering-file-generator.test.ts` - Add tests for JSON parsing
3. `src/tests/integration/steering-competitive-analysis-integration.test.ts` - Validate end-to-end

This fix will make the steering file integration truly valuable for developers using Kiro's PM Mode.