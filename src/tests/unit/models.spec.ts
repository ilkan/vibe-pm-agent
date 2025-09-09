import { Assumption, AssumptionLedger, ConfidenceBreakdown, ConfidenceOut, ScenarioRow, HardQuestion } from '../../models/assumptions';

describe('Models Type Compilation Tests', () => {
  test('Assumption type should compile with all required fields', () => {
    const assumption: Assumption = {
      id: 'test-1',
      name: 'Market Size',
      value: 1000000,
      unit: 'USD',
      sourceUrls: ['https://example.com/data'],
      certainty: 'high',
      lastChecked: '2025-01-01'
    };
    
    expect(assumption.id).toBe('test-1');
    expect(assumption.certainty).toBe('high');
  });

  test('Assumption type should compile with minimal required fields', () => {
    const assumption: Assumption = {
      id: 'test-2',
      name: 'User Growth Rate',
      value: 0.15,
      certainty: 'medium'
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
          certainty: 'low'
        }
      ]
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

  test('ConfidenceOut type should compile', () => {
    const confidence: ConfidenceOut = {
      total: 0.75,
      breakdown: {
        evidence: 0.8,
        recency: 0.9,
        diversity: 0.7,
        agreement: 0.85,
        coverage: 0.75,
        sensitivity: 0.6
      },
      explanation: 'High confidence based on recent market data'
    };
    
    expect(confidence.total).toBe(0.75);
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
      text: 'What if our main competitor launches a similar feature?',
      category: 'competitive',
      severity: 2,
      refs: ['competitor-analysis.pdf', 'market-research.doc']
    };
    
    expect(question.category).toBe('competitive');
    expect(question.severity).toBe(2);
    expect(question.refs).toHaveLength(2);
  });

  test('HardQuestion type should compile with minimal fields', () => {
    const question: HardQuestion = {
      text: 'Can we execute this in the given timeline?',
      category: 'execution',
      severity: 3
    };
    
    expect(question.category).toBe('execution');
    expect(question.refs).toBeUndefined();
  });
});