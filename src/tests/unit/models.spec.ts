import { Assumption, AssumptionLedger, ConfidenceBreakdown, ConfidenceScore, ScenarioRow, HardQuestion } from '../../models/assumptions';

describe('Models Type Compilation Tests', () => {
  test('Assumption type should compile with all required fields', () => {
    const assumption: Assumption = {
      id: 'test-1',
      name: 'Market Size',
      value: 1000000,
      unit: 'USD',
      sourceUrls: ['https://example.com/data'],
      certainty: 'High',
      lastChecked: new Date('2025-01-01'),
      category: 'market',
      impact: 'critical'
    };
    
    expect(assumption.id).toBe('test-1');
    expect(assumption.certainty).toBe('High');
  });

  test('Assumption type should compile with minimal required fields', () => {
    const assumption: Assumption = {
      id: 'test-2',
      name: 'User Growth Rate',
      value: 0.15,
      sourceUrls: [],
      certainty: 'Medium',
      lastChecked: new Date(),
      category: 'market',
      impact: 'important'
    };
    
    expect(assumption.id).toBe('test-2');
    expect(assumption.unit).toBeUndefined();
  });

  test('AssumptionLedger type should compile', () => {
    const ledger: AssumptionLedger = {
      assumptions: [
        {
          id: 'test-3',
          name: 'Conversion Rate',
          value: 0.05,
          sourceUrls: [],
          certainty: 'Low',
          lastChecked: new Date(),
          category: 'market',
          impact: 'supporting'
        }
      ],
      coverage_pct: 85,
      lastUpdated: new Date(),
      totalClaims: 10,
      backedClaims: 8
    };
    
    expect(ledger.assumptions).toHaveLength(1);
  });

  test('ConfidenceBreakdown type should compile', () => {
    const breakdown: ConfidenceBreakdown = {
      evidence: 0.8,
      recency: 0.9,
      diversity: 0.7,
      agreement: 0.85,
      coverage: 0.75,
      sensitivity: 0.6
    };
    
    expect(breakdown.evidence).toBe(0.8);
  });

  test('ConfidenceScore type should compile', () => {
    const confidence: ConfidenceScore = {
      total: 75,
      breakdown: {
        evidence: 0.8,
        recency: 0.9,
        diversity: 0.7,
        agreement: 0.85,
        coverage: 0.75,
        sensitivity: 0.6
      },
      explanation: 'High confidence based on recent market data',
      lowConfidence: false
    };
    
    expect(confidence.total).toBe(75);
    expect(confidence.explanation).toContain('High confidence');
  });

  test('ScenarioRow type should compile with numbers', () => {
    const scenario: ScenarioRow = {
      metric: 'Revenue',
      bear: 500000,
      base: 1000000,
      bull: 2000000
    };
    
    expect(scenario.metric).toBe('Revenue');
    expect(typeof scenario.bear).toBe('number');
  });

  test('ScenarioRow type should compile with strings', () => {
    const scenario: ScenarioRow = {
      metric: 'Market Position',
      bear: 'Follower',
      base: 'Challenger',
      bull: 'Leader'
    };
    
    expect(scenario.metric).toBe('Market Position');
    expect(typeof scenario.bear).toBe('string');
  });

  test('HardQuestion type should compile with all fields', () => {
    const question: HardQuestion = {
      id: 1,
      question: 'What if our main competitor launches a similar feature?',
      targetAssumptions: ['A1', 'A2'],
      category: 'competitive',
      severity: 'critical',
      evidenceNeeded: ['competitor-analysis.pdf', 'market-research.doc']
    };
    
    expect(question.category).toBe('competitive');
    expect(question.severity).toBe('critical');
    expect(question.evidenceNeeded).toHaveLength(2);
  });

  test('HardQuestion type should compile with minimal fields', () => {
    const question: HardQuestion = {
      id: 2,
      question: 'Can we execute this in the given timeline?',
      targetAssumptions: [],
      category: 'execution',
      severity: 'important',
      evidenceNeeded: []
    };
    
    expect(question.category).toBe('execution');
    expect(question.evidenceNeeded).toHaveLength(0);
  });
});