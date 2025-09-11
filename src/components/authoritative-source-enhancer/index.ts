/**
 * Authoritative Source Enhancer
 *
 * Enhances business analysis prompts with context from world-class consulting
 * and research organizations to improve confidence scores and analysis quality.
 */

export interface AuthoritativeSourceContext {
  mckinsey: {
    frameworks: string[];
    industryInsights: string[];
    digitalTrends: string[];
  };
  wef: {
    globalRisks: string[];
    futureOfWork: string[];
    industryTransformation: string[];
  };
  gartner: {
    technologyTrends: string[];
    marketForecasts: string[];
    hypecycle: string[];
  };
  bcg: {
    strategicFrameworks: string[];
    innovationPatterns: string[];
  };
  bain: {
    customerInsights: string[];
    operationalExcellence: string[];
  };
}

export class AuthoritativeSourceEnhancer {
  private sourceContext: AuthoritativeSourceContext;

  constructor() {
    this.sourceContext = this.initializeSourceContext();
  }

  /**
   * Enhance business analysis prompt with authoritative source context
   */
  enhancePrompt(
    basePrompt: string,
    analysisType: 'market' | 'strategic' | 'financial' | 'operational'
  ): string {
    const contextualFrameworks = this.getRelevantFrameworks(analysisType);
    const industryBenchmarks = this.getIndustryBenchmarks(analysisType);
    const validationCriteria = this.getValidationCriteria(analysisType);

    return `${basePrompt}

## Authoritative Source Integration

Apply insights and methodologies from world-class consulting and research organizations:

### Strategic Frameworks (McKinsey, BCG, Bain)
${contextualFrameworks.join('\n')}

### Industry Benchmarks & Trends
${industryBenchmarks.join('\n')}

### Validation Criteria
${validationCriteria.join('\n')}

## Enhanced Analysis Requirements

1. **McKinsey-Style Analysis**: Use structured problem-solving approach with MECE (Mutually Exclusive, Collectively Exhaustive) framework
2. **BCG Growth-Share Matrix**: Apply portfolio analysis principles where relevant
3. **Bain Customer Insights**: Include customer-centric validation and loyalty considerations
4. **Gartner Technology Assessment**: Reference technology maturity and adoption patterns
5. **WEF Global Context**: Consider macro-economic and societal trends

## Confidence Scoring Enhancement

Rate each analysis component using consulting-grade criteria:
- **Evidence Quality**: Cite specific methodologies from authoritative sources
- **Market Validation**: Reference industry reports and benchmarks
- **Strategic Alignment**: Apply proven strategic frameworks
- **Risk Assessment**: Use established risk evaluation models
- **Financial Modeling**: Follow investment banking and consulting standards

Provide confidence scores (0-100) with explicit reasoning based on authoritative source alignment.`;
  }

  private initializeSourceContext(): AuthoritativeSourceContext {
    return {
      mckinsey: {
        frameworks: [
          '7S Framework for organizational effectiveness',
          'Three Horizons of Growth model',
          'MECE problem-solving methodology',
          'Digital transformation playbook',
          'Customer journey mapping',
          'Value creation in digital economy',
        ],
        industryInsights: [
          'Industry 4.0 transformation patterns',
          'Digital customer engagement trends',
          'Operational excellence benchmarks',
          'Innovation investment patterns',
          'Talent and skills evolution',
        ],
        digitalTrends: [
          'AI and automation adoption curves',
          'Platform business model evolution',
          'Ecosystem orchestration strategies',
          'Data monetization approaches',
        ],
      },
      wef: {
        globalRisks: [
          'Technology governance challenges',
          'Cybersecurity threat landscape',
          'Economic inequality impacts',
          'Climate change business risks',
        ],
        futureOfWork: [
          'Skills transformation requirements',
          'Remote work productivity patterns',
          'Human-AI collaboration models',
          'Workforce reskilling strategies',
        ],
        industryTransformation: [
          'Fourth Industrial Revolution impacts',
          'Stakeholder capitalism principles',
          'ESG integration requirements',
          'Global supply chain resilience',
        ],
      },
      gartner: {
        technologyTrends: [
          'Strategic technology trends',
          'Hype cycle positioning',
          'Technology adoption lifecycle',
          'Digital business transformation',
        ],
        marketForecasts: [
          'IT spending forecasts by category',
          'Emerging technology market sizing',
          'Vendor landscape analysis',
          'Technology ROI benchmarks',
        ],
        hypecycle: [
          'Innovation trigger identification',
          'Peak of inflated expectations',
          'Trough of disillusionment timing',
          'Slope of enlightenment indicators',
          'Plateau of productivity markers',
        ],
      },
      bcg: {
        strategicFrameworks: [
          'Growth-Share Matrix application',
          'Experience curve economics',
          'Time-based competition',
          'Blue ocean strategy principles',
        ],
        innovationPatterns: [
          'Innovation to impact methodology',
          'Digital acceleration patterns',
          'Ecosystem advantage creation',
          'Bionic company principles',
        ],
      },
      bain: {
        customerInsights: [
          'Net Promoter Score methodology',
          'Customer loyalty economics',
          'Customer lifetime value optimization',
          'Customer experience design',
        ],
        operationalExcellence: [
          'Full Potential Transformation',
          'Results delivery methodology',
          'Capability building approaches',
          'Performance improvement systems',
        ],
      },
    };
  }

  private getRelevantFrameworks(analysisType: string): string[] {
    const frameworks = [];

    switch (analysisType) {
      case 'market':
        frameworks.push(
          "- Apply Porter's Five Forces for competitive landscape analysis",
          '- Use TAM/SAM/SOM sizing with Gartner market forecasting methodology',
          "- Reference McKinsey's digital transformation benchmarks",
          '- Apply BCG Growth-Share Matrix for portfolio positioning'
        );
        break;
      case 'strategic':
        frameworks.push(
          '- Use McKinsey 7S Framework for organizational alignment',
          '- Apply Three Horizons of Growth for innovation portfolio',
          '- Reference WEF Future of Work insights for capability requirements',
          "- Use Bain's Full Potential Transformation methodology"
        );
        break;
      case 'financial':
        frameworks.push(
          '- Apply McKinsey value creation principles',
          '- Use BCG experience curve for cost modeling',
          '- Reference Gartner ROI benchmarks for technology investments',
          '- Apply Bain customer lifetime value optimization'
        );
        break;
      case 'operational':
        frameworks.push(
          '- Use McKinsey operational excellence benchmarks',
          '- Apply Bain Results Delivery methodology',
          '- Reference Gartner technology adoption lifecycle',
          '- Use WEF Industry 4.0 transformation patterns'
        );
        break;
    }

    return frameworks;
  }

  private getIndustryBenchmarks(analysisType: string): string[] {
    return [
      '- Reference McKinsey Global Institute research for macro trends',
      '- Use Gartner Magic Quadrant positioning for vendor analysis',
      '- Apply WEF Global Competitiveness Index for market context',
      '- Reference BCG innovation surveys for R&D benchmarks',
      '- Use Bain customer loyalty benchmarks for retention modeling',
    ];
  }

  private getValidationCriteria(analysisType: string): string[] {
    return [
      '- Validate assumptions against McKinsey industry reports',
      '- Cross-reference with Gartner technology forecasts',
      '- Align with WEF global risk assessments',
      '- Benchmark against BCG digital transformation studies',
      '- Validate customer insights with Bain NPS methodology',
    ];
  }

  /**
   * Generate confidence scoring criteria based on authoritative sources
   */
  generateConfidenceScoring(): string {
    return `
## Authoritative Source-Based Confidence Scoring

### Evidence Quality (0-100)
- **90-100**: Direct citation of recent McKinsey, BCG, Bain, or Gartner research
- **70-89**: Alignment with established consulting frameworks and methodologies
- **50-69**: Reference to industry best practices and benchmarks
- **30-49**: General business principles without specific source validation
- **0-29**: Unsupported assumptions or outdated information

### Methodology Rigor (0-100)
- **90-100**: Follows MECE problem-solving with multiple framework validation
- **70-89**: Uses established strategic frameworks (Porter, BCG Matrix, etc.)
- **50-69**: Applies standard business analysis techniques
- **30-49**: Basic analysis without structured methodology
- **0-29**: Ad-hoc analysis without clear framework

### Market Validation (0-100)
- **90-100**: Validated against Gartner forecasts and McKinsey industry studies
- **70-89**: Benchmarked against consulting firm industry reports
- **50-69**: Compared to general market research and trends
- **30-49**: Limited market validation or outdated sources
- **0-29**: No market validation or contradicts authoritative sources

### Strategic Alignment (0-100)
- **90-100**: Aligns with WEF global trends and consulting firm strategic insights
- **70-89**: Consistent with established strategic principles
- **50-69**: Generally aligned with business best practices
- **30-49**: Partial alignment with strategic frameworks
- **0-29**: Conflicts with established strategic wisdom
`;
  }
}
