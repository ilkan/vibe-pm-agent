/**
 * Unit tests for Amazon Working Backwards Steering Writer Service
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SteeringWriter, BusinessInputs } from '../../services/amazon/steering-writer';
import { AssumptionLedger } from '../../models/assumptions';
import { ConfidenceScore } from '../../models/confidence';
import { ScenarioResults } from '../../models/scenarios';
import { HardQuestion } from '../../models/questions';
import { Citation } from '../../models/confidence';

describe('SteeringWriter', () => {
  let steeringWriter: SteeringWriter;
  let mockBusinessInputs: BusinessInputs;
  let mockLedger: AssumptionLedger;
  let mockConfidence: ConfidenceScore;
  let mockScenarios: ScenarioResults;
  let mockHardQuestions: HardQuestion[];
  let mockCitations: Citation[];

  beforeEach(() => {
    steeringWriter = new SteeringWriter('/tmp/test');

    mockBusinessInputs = {
      featureName: 'Test Feature',
      customer: 'Test Customer',
      pricing: 100,
      users: 1000,
      devCost: 50000,
      marketSize: 1000000,
    };

    mockLedger = {
      assumptions: [
        {
          id: 'A1',
          name: 'Test Assumption',
          value: 100,
          unit: 'USD',
          sourceUrls: ['https://example.com'],
          certainty: 'High',
          lastChecked: new Date(),
          category: 'financial',
          impact: 'critical',
        },
      ],
      coverage_pct: 90,
      lastUpdated: new Date(),
      totalClaims: 1,
      backedClaims: 1,
    };

    mockConfidence = {
      total: 85,
      breakdown: {
        evidence: 90,
        recency: 80,
        diversity: 75,
        agreement: 85,
        coverage: 90,
        sensitivity: 70,
      },
      explanation: 'High confidence with strong evidence',
      lowConfidence: false,
    };

    mockScenarios = {
      scenarios: {
        bear: [{ metric: 'Revenue', bear: 80000, base: 100000, bull: 120000, unit: 'USD' }],
        base: [{ metric: 'Revenue', bear: 80000, base: 100000, bull: 120000, unit: 'USD' }],
        bull: [{ metric: 'Revenue', bear: 80000, base: 100000, bull: 120000, unit: 'USD' }],
      },
      elasticities: [
        {
          assumption: 'Test Assumption',
          assumptionChange: '±20%',
          outcomeMetric: 'Revenue',
          outcomeChange: '±15%',
          sensitivity: 15,
        },
      ],
      keyDrivers: [
        {
          assumption: 'Test Assumption',
          assumptionId: 'A1',
          impact: 15,
          description: 'Key driver with moderate impact',
        },
      ],
      sensitivityPct: 20,
    };

    mockHardQuestions = [
      {
        id: 1,
        question: 'Test question?',
        targetAssumptions: ['A1'],
        category: 'financial',
        severity: 'critical',
        evidenceNeeded: ['Test evidence'],
      },
    ];

    mockCitations = [
      {
        url: 'https://example.com',
        title: 'Test Citation',
        date: '2024-01-01',
        rating: 'A',
        sourceType: 'industry_report',
      },
    ];
  });

  describe('generateInputsHash', () => {
    it('should generate consistent hash for same inputs', () => {
      const hash1 = steeringWriter.generateInputsHash(mockBusinessInputs);
      const hash2 = steeringWriter.generateInputsHash(mockBusinessInputs);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hash for different inputs', () => {
      const hash1 = steeringWriter.generateInputsHash(mockBusinessInputs);

      const modifiedInputs = { ...mockBusinessInputs, pricing: 200 };
      const hash2 = steeringWriter.generateInputsHash(modifiedInputs);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle undefined optional fields consistently', () => {
      const inputs1 = { ...mockBusinessInputs };
      const inputs2 = { ...mockBusinessInputs, region: undefined };

      const hash1 = steeringWriter.generateInputsHash(inputs1);
      const hash2 = steeringWriter.generateInputsHash(inputs2);

      expect(hash1).toBe(hash2);
    });

    it('should normalize arrays for consistent hashing', () => {
      const inputs1 = { ...mockBusinessInputs, competitors: ['A', 'B', 'C'] };
      const inputs2 = { ...mockBusinessInputs, competitors: ['C', 'A', 'B'] };

      const hash1 = steeringWriter.generateInputsHash(inputs1);
      const hash2 = steeringWriter.generateInputsHash(inputs2);

      expect(hash1).toBe(hash2);
    });

    it('should include citation URLs in hash but not full content', () => {
      const inputs1 = {
        ...mockBusinessInputs,
        citations: [
          { url: 'https://example.com', title: 'Title 1', sourceType: 'industry_report' as const },
        ],
      };

      const inputs2 = {
        ...mockBusinessInputs,
        citations: [
          { url: 'https://example.com', title: 'Title 2', sourceType: 'research' as const },
        ],
      };

      const hash1 = steeringWriter.generateInputsHash(inputs1);
      const hash2 = steeringWriter.generateInputsHash(inputs2);

      expect(hash1).toBe(hash2); // Same URL, different content should produce same hash
    });
  });

  describe('createSteeringPackage', () => {
    it('should create package with correct structure', () => {
      const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Test Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      expect(package_.featureSlug).toBe('test-feature');
      expect(package_.artifactType).toBe('pr_faq');
      expect(package_.bodyMarkdown).toBe('# Test Content');
      expect(package_.attachments).toHaveLength(3);
    });

    it('should generate correct front matter for PR/FAQ', () => {
      const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Test Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      expect(package_.frontMatter.title).toBe('PR/FAQ — Test Feature');
      expect(package_.frontMatter.artifact_type).toBe('pr_faq');
      expect(package_.frontMatter.inputs_hash).toBe(inputsHash);
      expect(package_.frontMatter.profile).toBe('amazon');

      expect(package_.frontMatter.confidence.total).toBe(85);
      expect(package_.frontMatter.confidence.breakdown.evidence).toBe(90);

      expect(package_.frontMatter.assumptions.ids).toEqual(['A1']);
      expect(package_.frontMatter.assumptions.coverage_pct).toBe(90);

      expect(package_.frontMatter.scenarios.pct).toBe(20);
      expect(package_.frontMatter.scenarios.metrics).toEqual(['Revenue']);
    });

    it('should generate correct front matter for Decision One-Pager', () => {
      const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'decision_onepager',
        '# Test Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      expect(package_.frontMatter.title).toBe('Decision One-Pager — Test Feature');
      expect(package_.frontMatter.artifact_type).toBe('decision_onepager');
    });

    it('should create valid JSON attachments', () => {
      const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Test Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      // Verify all attachments contain valid JSON
      package_.attachments.forEach(attachment => {
        expect(() => JSON.parse(attachment.content)).not.toThrow();
      });

      // Verify attachment types
      const attachmentTypes = package_.attachments.map(a => a.type);
      expect(attachmentTypes).toEqual(['assumptions', 'citations', 'scenarios']);

      // Verify assumptions attachment
      const assumptionsAttachment = package_.attachments.find(a => a.type === 'assumptions');
      const assumptionsData = JSON.parse(assumptionsAttachment!.content);
      expect(assumptionsData.assumptions).toHaveLength(1);
      expect(assumptionsData.coverage_pct).toBe(90);

      // Verify citations attachment
      const citationsAttachment = package_.attachments.find(a => a.type === 'citations');
      const citationsData = JSON.parse(citationsAttachment!.content);
      expect(citationsData).toHaveLength(1);
      expect(citationsData[0].url).toBe('https://example.com');

      // Verify scenarios attachment includes hard questions
      const scenariosAttachment = package_.attachments.find(a => a.type === 'scenarios');
      const scenariosData = JSON.parse(scenariosAttachment!.content);
      expect(scenariosData.scenarios).toBeDefined();
      expect(scenariosData.elasticities).toBeDefined();
      expect(scenariosData.keyDrivers).toBeDefined();
      expect(scenariosData.hardQuestions).toBeDefined();
      expect(scenariosData.hardQuestions).toHaveLength(1);
    });

    it('should generate correct attachment filenames with short hash', () => {
      const inputsHash = 'abcdef1234567890123456789012345678901234567890123456789012345678';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Test Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      const shortHash = 'abcdef12';

      expect(package_.attachments[0].filename).toBe(`assumptions-${shortHash}.json`);
      expect(package_.attachments[1].filename).toBe(`citations-${shortHash}.json`);
      expect(package_.attachments[2].filename).toBe(`scenarios-${shortHash}.json`);

      expect(package_.frontMatter.paths.assumptions_json).toBe(
        `./attachments/assumptions-${shortHash}.json`
      );
      expect(package_.frontMatter.paths.citations_json).toBe(
        `./attachments/citations-${shortHash}.json`
      );
      expect(package_.frontMatter.paths.scenarios_json).toBe(
        `./attachments/scenarios-${shortHash}.json`
      );
    });

    it('should handle empty scenarios gracefully', () => {
      const emptyScenarios: ScenarioResults = {
        scenarios: { bear: [], base: [], bull: [] },
        elasticities: [],
        keyDrivers: [],
        sensitivityPct: 20,
      };

      const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Test Content',
        mockLedger,
        mockConfidence,
        emptyScenarios,
        [],
        [],
        inputsHash
      );

      expect(package_.frontMatter.scenarios.metrics).toEqual([]);

      const scenariosAttachment = package_.attachments.find(a => a.type === 'scenarios');
      const scenariosData = JSON.parse(scenariosAttachment!.content);
      expect(scenariosData.scenarios.base).toEqual([]);
      expect(scenariosData.hardQuestions).toEqual([]);
    });
  });

  describe('Feature Slug Generation', () => {
    it('should convert feature names to kebab-case', () => {
      const testCases = [
        { input: 'Simple Feature', expected: 'simple-feature' },
        { input: 'AI-Powered Analytics Dashboard', expected: 'ai-powered-analytics-dashboard' },
        { input: 'Feature With Multiple   Spaces', expected: 'feature-with-multiple-spaces' },
        { input: 'Feature_With_Underscores', expected: 'featurewithunderscores' },
        { input: 'Feature (v2.0)!', expected: 'feature-v20' },
        { input: 'UPPERCASE FEATURE', expected: 'uppercase-feature' },
        { input: '123 Numeric Feature', expected: '123-numeric-feature' },
      ];

      testCases.forEach(({ input, expected }) => {
        const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

        const package_ = steeringWriter.createSteeringPackage(
          input,
          'pr_faq',
          '# Content',
          mockLedger,
          mockConfidence,
          mockScenarios,
          mockHardQuestions,
          mockCitations,
          inputsHash
        );

        expect(package_.featureSlug).toBe(expected);
      });
    });

    it('should handle edge cases in feature names', () => {
      const edgeCases = [
        { input: '', expected: '' },
        { input: '   ', expected: '' },
        { input: '---', expected: '' },
        { input: 'a', expected: 'a' },
        { input: 'A-B-C', expected: 'a-b-c' },
      ];

      edgeCases.forEach(({ input, expected }) => {
        const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

        const package_ = steeringWriter.createSteeringPackage(
          input,
          'pr_faq',
          '# Content',
          mockLedger,
          mockConfidence,
          mockScenarios,
          mockHardQuestions,
          mockCitations,
          inputsHash
        );

        expect(package_.featureSlug).toBe(expected);
      });
    });
  });

  describe('YAML Front Matter Formatting', () => {
    it('should format confidence breakdown correctly', () => {
      const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      // Test the private formatYamlFrontMatter method indirectly
      // by checking the structure of the front matter object
      expect(package_.frontMatter.confidence.breakdown.evidence).toBe(90);
      expect(package_.frontMatter.confidence.breakdown.recency).toBe(80);
      expect(package_.frontMatter.confidence.breakdown.diversity).toBe(75);
      expect(package_.frontMatter.confidence.breakdown.agreement).toBe(85);
      expect(package_.frontMatter.confidence.breakdown.coverage).toBe(90);
      expect(package_.frontMatter.confidence.breakdown.sensitivity).toBe(70);
    });

    it('should format assumption IDs as array', () => {
      const multiAssumptionLedger: AssumptionLedger = {
        ...mockLedger,
        assumptions: [
          ...mockLedger.assumptions,
          {
            id: 'A2',
            name: 'Second Assumption',
            value: 200,
            unit: 'USD',
            sourceUrls: [],
            certainty: 'Medium',
            lastChecked: new Date(),
            category: 'market',
            impact: 'important',
          },
        ],
      };

      const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Content',
        multiAssumptionLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      expect(package_.frontMatter.assumptions.ids).toEqual(['A1', 'A2']);
    });

    it('should format scenario metrics as array', () => {
      const multiMetricScenarios: ScenarioResults = {
        ...mockScenarios,
        scenarios: {
          bear: [
            { metric: 'Revenue', bear: 80000, base: 100000, bull: 120000, unit: 'USD' },
            { metric: 'ROI', bear: 15, base: 20, bull: 25, unit: '%' },
          ],
          base: [
            { metric: 'Revenue', bear: 80000, base: 100000, bull: 120000, unit: 'USD' },
            { metric: 'ROI', bear: 15, base: 20, bull: 25, unit: '%' },
          ],
          bull: [
            { metric: 'Revenue', bear: 80000, base: 100000, bull: 120000, unit: 'USD' },
            { metric: 'ROI', bear: 15, base: 20, bull: 25, unit: '%' },
          ],
        },
      };

      const inputsHash = 'test-hash-123456789012345678901234567890123456789012345678901234567890';

      const package_ = steeringWriter.createSteeringPackage(
        'Test Feature',
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        multiMetricScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      expect(package_.frontMatter.scenarios.metrics).toEqual(['Revenue', 'ROI']);
    });
  });
});
