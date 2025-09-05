# Competitive Analysis and Market Sizing Guide

This guide provides comprehensive documentation and examples for the competitive intelligence tools in the Vibe PM Agent.

## Overview

The Vibe PM Agent includes two powerful competitive intelligence tools that provide world-class competitive analysis and market opportunity quantification:

- **analyze_competitor_landscape** - Comprehensive competitor analysis with credible sourcing
- **calculate_market_sizing** - TAM/SAM/SOM analysis with multiple methodologies

These tools leverage authoritative sources including McKinsey Global Institute, Gartner research, and World Economic Forum reports to provide consulting-grade analysis.

## Tool 1: analyze_competitor_landscape

### Purpose
Generates comprehensive competitor analysis reports with competitive matrices, SWOT analysis, and strategic recommendations using credible sources.

### Key Features
- **Competitive Matrix**: Rankings and comparative analysis of key competitors
- **SWOT Analysis**: Strengths, weaknesses, opportunities, and threats for each competitor
- **Strategic Recommendations**: Actionable insights based on competitive gaps
- **Source Attribution**: References to McKinsey, Gartner, WEF, and other authoritative sources
- **Confidence Scoring**: Data quality indicators and reliability assessments

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `feature_idea` | string | Yes | Feature idea or product concept for analysis |
| `market_context` | object | No | Industry, geography, and target segment context |
| `analysis_depth` | enum | No | "quick", "standard", or "comprehensive" |
| `steering_options` | object | No | Steering file creation options |

### Usage Examples

#### Basic Competitive Analysis
```json
{
  "tool": "analyze_competitor_landscape",
  "input": {
    "feature_idea": "Real-time collaboration platform for remote teams"
  }
}
```

#### Comprehensive Analysis with Market Context
```json
{
  "tool": "analyze_competitor_landscape",
  "input": {
    "feature_idea": "AI-powered customer support automation platform",
    "market_context": {
      "industry": "Customer Service Technology",
      "geography": ["North America", "Europe", "Asia-Pacific"],
      "target_segment": "Enterprise SaaS companies"
    },
    "analysis_depth": "comprehensive",
    "steering_options": {
      "create_steering_files": true,
      "feature_name": "ai-customer-support",
      "inclusion_rule": "fileMatch",
      "file_match_pattern": "competitive*|support*|ai*"
    }
  }
}
```

#### Quick Competitive Check
```json
{
  "tool": "analyze_competitor_landscape",
  "input": {
    "feature_idea": "Mobile expense tracking app",
    "analysis_depth": "quick"
  }
}
```

### Output Structure

The tool returns a comprehensive competitive analysis with the following structure:

```json
{
  "competitiveMatrix": {
    "competitors": [
      {
        "name": "Competitor Name",
        "marketShare": 25.5,
        "strengths": ["Strong brand recognition", "Large user base"],
        "weaknesses": ["High pricing", "Limited mobile features"],
        "keyFeatures": ["Feature A", "Feature B"],
        "pricing": {
          "model": "subscription",
          "startingPrice": 99,
          "currency": "USD"
        },
        "targetMarket": ["Enterprise", "Mid-market"],
        "recentMoves": [
          {
            "date": "2024-01-15",
            "type": "product-launch",
            "description": "Launched AI-powered analytics",
            "impact": "medium"
          }
        ]
      }
    ],
    "evaluationCriteria": [...],
    "rankings": [...],
    "differentiationOpportunities": [...]
  },
  "swotAnalysis": [...],
  "strategicRecommendations": [...],
  "sourceAttribution": [...],
  "confidenceLevel": "high",
  "dataQuality": {...}
}
```

## Tool 2: calculate_market_sizing

### Purpose
Performs TAM/SAM/SOM market sizing analysis using multiple methodologies with confidence intervals and scenario analysis.

### Key Features
- **TAM Calculation**: Total Addressable Market using industry data
- **SAM Estimation**: Serviceable Addressable Market based on business constraints
- **SOM Projection**: Serviceable Obtainable Market considering competitive factors
- **Multiple Methodologies**: Top-down, bottom-up, and value-theory approaches
- **Scenario Analysis**: Conservative, balanced, and aggressive projections
- **Confidence Intervals**: Statistical confidence ranges for estimates

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `feature_idea` | string | Yes | Feature idea for market sizing |
| `market_definition` | object | Yes | Industry, geography, and customer segments |
| `sizing_methods` | array | No | Methodologies to apply (defaults to all) |
| `steering_options` | object | No | Steering file creation options |

### Usage Examples

#### Basic Market Sizing
```json
{
  "tool": "calculate_market_sizing",
  "input": {
    "feature_idea": "Cloud-based project management platform",
    "market_definition": {
      "industry": "Project Management Software",
      "geography": ["North America"],
      "customer_segments": ["Enterprise", "Mid-market"]
    }
  }
}
```

#### Multi-Methodology Analysis
```json
{
  "tool": "calculate_market_sizing",
  "input": {
    "feature_idea": "AI-powered code review assistant",
    "market_definition": {
      "industry": "Developer Tools",
      "geography": ["Global"],
      "customer_segments": ["Enterprise", "SMB", "Individual Developers"]
    },
    "sizing_methods": ["top-down", "bottom-up", "value-theory"],
    "steering_options": {
      "create_steering_files": true,
      "feature_name": "ai-code-review",
      "inclusion_rule": "fileMatch"
    }
  }
}
```

#### Geographic Market Analysis
```json
{
  "tool": "calculate_market_sizing",
  "input": {
    "feature_idea": "Fintech mobile payment solution",
    "market_definition": {
      "industry": "Financial Technology",
      "geography": ["United States", "Canada", "United Kingdom", "Germany"],
      "customer_segments": ["Consumers", "Small Businesses", "E-commerce"]
    },
    "sizing_methods": ["top-down", "bottom-up"]
  }
}
```

### Output Structure

The tool returns comprehensive market sizing analysis:

```json
{
  "tam": {
    "value": 50000000000,
    "currency": "USD",
    "timeframe": "2024",
    "growthRate": 0.15,
    "methodology": "top-down",
    "dataQuality": "high"
  },
  "sam": {
    "value": 5000000000,
    "currency": "USD",
    "methodology": "SAM derived from TAM (10.0%)",
    "dataQuality": "high"
  },
  "som": {
    "value": 500000000,
    "currency": "USD",
    "methodology": "SOM derived from SAM (10.0%)",
    "dataQuality": "high"
  },
  "methodology": [...],
  "scenarios": [
    {
      "name": "conservative",
      "tam": 35000000000,
      "sam": 3000000000,
      "som": 250000000,
      "probability": 0.3
    }
  ],
  "confidenceIntervals": [...],
  "sourceAttribution": [...],
  "assumptions": [...]
}
```

## Integration Workflows

### Complete Competitive Intelligence Workflow

This workflow combines both tools for comprehensive market and competitive analysis:

```bash
# Step 1: Analyze competitive landscape
analyze_competitor_landscape → Competitive positioning + strategic gaps

# Step 2: Size market opportunity  
calculate_market_sizing → TAM/SAM/SOM + growth projections

# Step 3: Synthesize insights
analyze_business_opportunity → Combined competitive + market analysis

# Step 4: Create executive communication
create_stakeholder_communication → Strategic presentation with competitive advantage
```

### Market Entry Analysis

For new market entry decisions:

```bash
# 1. Quick competitive check
analyze_competitor_landscape (depth: "quick") → Competitive landscape overview

# 2. Market opportunity sizing
calculate_market_sizing → Market size validation

# 3. Market timing validation
validate_market_timing → Right-time assessment

# 4. Strategic alignment check
assess_strategic_alignment → Company fit analysis
```

### Product Positioning Workflow

For product positioning and differentiation:

```bash
# 1. Comprehensive competitive analysis
analyze_competitor_landscape (depth: "comprehensive") → Detailed competitive intelligence

# 2. Market segmentation analysis
calculate_market_sizing (multiple segments) → Segment-specific opportunities

# 3. Business case development
generate_business_case → ROI with competitive context

# 4. Positioning communication
create_stakeholder_communication → Competitive positioning materials
```

## Steering File Integration

Both tools automatically create steering files when enabled, providing persistent competitive intelligence that guides future development:

### Competitive Analysis Steering Files

When `analyze_competitor_landscape` creates steering files, they include:

- **Competitive Landscape Guidance**: Key competitors and market positioning
- **Strategic Recommendations**: Actionable insights for development teams
- **Competitive Monitoring**: Areas to track for ongoing intelligence
- **Differentiation Opportunities**: Market gaps to exploit

### Market Sizing Steering Files

When `calculate_market_sizing` creates steering files, they include:

- **Market Opportunity Context**: TAM/SAM/SOM insights for investment decisions
- **Market Assumptions**: Key assumptions to validate through development
- **Market Validation Framework**: Metrics to track market assumptions
- **Investment Considerations**: Financial implications of market size

### Steering File Configuration

```json
{
  "steering_options": {
    "create_steering_files": true,
    "feature_name": "your-feature-name",
    "inclusion_rule": "fileMatch",
    "file_match_pattern": "competitive*|market*|analysis*"
  }
}
```

## Best Practices

### For Competitive Analysis

1. **Provide Market Context**: Include industry, geography, and target segment for more accurate analysis
2. **Use Appropriate Depth**: 
   - "quick" for initial validation
   - "standard" for regular analysis  
   - "comprehensive" for strategic decisions
3. **Enable Steering Files**: Create persistent competitive intelligence
4. **Regular Updates**: Competitive landscapes change - plan for periodic refresh
5. **Validate Sources**: Review source attribution and confidence levels

### For Market Sizing

1. **Define Market Clearly**: Be specific about industry, geography, and customer segments
2. **Use Multiple Methodologies**: Combine top-down and bottom-up for validation
3. **Consider Scenarios**: Use conservative, balanced, and aggressive projections
4. **Document Assumptions**: Track key assumptions for future validation
5. **Update Regularly**: Market conditions change - refresh sizing periodically

### Integration Best Practices

1. **Sequential Analysis**: Start with competitive analysis, then market sizing
2. **Cross-Validate**: Use competitive insights to inform market assumptions
3. **Combine with Business Tools**: Integrate with business opportunity and strategic alignment analysis
4. **Create Comprehensive Documentation**: Use steering files to build institutional knowledge
5. **Monitor and Update**: Set up regular review cycles for competitive and market intelligence

## Error Handling and Troubleshooting

### Common Issues

1. **Insufficient Market Context**: Provide industry and geographic information for better analysis
2. **Vague Feature Ideas**: Be specific about the product or feature concept
3. **Limited Data Availability**: Tool will indicate confidence levels and data gaps
4. **Geographic Limitations**: Some regions may have limited market data

### Data Quality Indicators

Both tools provide data quality indicators:

- **High**: Reliable sources, recent data, comprehensive coverage
- **Medium**: Good sources with some limitations or moderate data age
- **Low**: Limited sources, older data, or significant data gaps

### Confidence Levels

- **High**: Strong source attribution, recent data, comprehensive analysis
- **Medium**: Good analysis with some limitations or assumptions
- **Low**: Limited data availability, significant assumptions, or data quality concerns

## Source Attribution

Both tools reference authoritative sources including:

- **McKinsey Global Institute**: Market research and industry analysis
- **Gartner**: Technology market research and competitive intelligence
- **World Economic Forum**: Industry reports and economic analysis
- **Industry Research Organizations**: Sector-specific market data
- **Financial Research Firms**: Market sizing and growth projections

All outputs include proper source attribution with reliability and relevance scores.