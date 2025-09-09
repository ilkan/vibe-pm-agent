/**
 * Integration tests for Amazon Working Backwards Kiro Steering Integration
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SteeringWriter, BusinessInputs, SteeringPackage } from '../../services/amazon/steering-writer';
import { AssumptionLedger } from '../../models/assumptions';
import { ConfidenceScore } from '../../models/confidence';
import { ScenarioResults } from '../../models/scenarios';
import { HardQuestion } from '../../models/questions';
import { Citation } from '../../models/confidence';
import { readFile, rm, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp } from 'fs/promises';

describe('Amazon Steering Integration', () => {
  let steeringWriter: SteeringWriter;
  let tempDir: string;
  let mockBusinessInputs: BusinessInputs;
  let mockLedger: AssumptionLedger;
  let mockConfidence: ConfidenceScore;
  let mockScenarios: ScenarioResults;
  let mockHardQuestions: HardQuestion[];
  let mockCitations: Citation[];

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await mkdtemp(join(tmpdir(), 'amazon-steering-test-'));
    steeringWriter = new SteeringWriter(tempDir);

    // Mock business inputs
    mockBusinessInputs = {
      featureName: 'AI-Powered Analytics Dashboard',
      customer: 'Enterprise Data Teams',
      region: 'North America',
      competitors: ['Tableau', 'PowerBI', 'Looker'],
      pricing: 299,
      users: 50000,
      convRate: 0.15,
      devCost: 2500000,
      opsCost: 500000,
      marketSize: 15000000000,
      competitiveAdvantage: 'Real-time AI insights with natural language queries',
      timeline: '18 months',
      assumptions: ['Market demand for AI analytics is growing 40% YoY']
    };

    // Mock assumption ledger
    mockLedger = {
      assumptions: [
        {
          id: 'A1',
          name: 'Product Pricing',
          value: 299,
          unit: 'USD',
          sourceUrls: ['https://example.com/pricing-research'],
          certainty: 'High',
          lastChecked: new Date(),
          category: 'financial',
          impact: 'critical'
        },
        {
          id: 'A2',
          name: 'Target User Base',
          value: 50000,
          unit: 'users',
          sourceUrls: ['https://example.com/market-research'],
          certainty: 'Medium',
          lastChecked: new Date(),
          category: 'market',
          impact: 'critical'
        }
      ],
      coverage_pct: 85,
      lastUpdated: new Date(),
      totalClaims: 2,
      backedClaims: 2
    };

    // Mock confidence score
    mockConfidence = {
      total: 78,
      breakdown: {
        evidence: 80,
        recency: 75,
        diversity: 70,
        agreement: 85,
        coverage: 85,
        sensitivity: 65
      },
      explanation: 'Moderate confidence with good evidence quality',
      lowConfidence: false
    };

    // Mock scenarios
    mockScenarios = {
      scenarios: {
        bear: [
          { metric: 'Revenue', bear: 8000000, base: 10000000, bull: 12000000, unit: 'USD' },
          { metric: 'ROI', bear: 15, base: 25, bull: 35, unit: '%' }
        ],
        base: [
          { metric: 'Revenue', bear: 8000000, base: 10000000, bull: 12000000, unit: 'USD' },
          { metric: 'ROI', bear: 15, base: 25, bull: 35, unit: '%' }
        ],
        bull: [
          { metric: 'Revenue', bear: 8000000, base: 10000000, bull: 12000000, unit: 'USD' },
          { metric: 'ROI', bear: 15, base: 25, bull: 35, unit: '%' }
        ]
      },
      elasticities: [
        {
          assumption: 'Product Pricing',
          assumptionChange: '±20%',
          outcomeMetric: 'Revenue',
          outcomeChange: '±18%',
          sensitivity: 18
        }
      ],
      keyDrivers: [
        {
          assumption: 'Product Pricing',
          assumptionId: 'A1',
          impact: 18,
          description: 'Product Pricing shows moderate sensitivity (±18% impact on Revenue) - critical for financial projections'
        }
      ],
      sensitivityPct: 20
    };

    // Mock hard questions
    mockHardQuestions = [
      {
        id: 1,
        question: 'How do you know that Product Pricing ($299) is accurate? What evidence supports this critical assumption?',
        targetAssumptions: ['A1'],
        category: 'financial',
        severity: 'critical',
        evidenceNeeded: ['Credible sources for Product Pricing', 'Independent validation of the assumption']
      }
    ];

    // Mock citations
    mockCitations = [
      {
        url: 'https://example.com/pricing-research',
        title: 'Enterprise Analytics Pricing Study 2024',
        date: '2024-01-15',
        rating: 'A',
        snippet: 'Average pricing for enterprise analytics tools ranges from $200-400 per user',
        sourceType: 'industry_report'
      }
    ];
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Inputs Hash Generation', () => {
    it('should generate consistent SHA-256 hash for identical inputs', () => {
      const hash1 = steeringWriter.generateInputsHash(mockBusinessInputs);
      const hash2 = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64-character hex string
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const modifiedInputs = { ...mockBusinessInputs, pricing: 399 };
      const hash2 = steeringWriter.generateInputsHash(modifiedInputs);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should normalize inputs for consistent hashing', () => {
      const inputs1 = { ...mockBusinessInputs, competitors: ['Tableau', 'PowerBI'] };
      const inputs2 = { ...mockBusinessInputs, competitors: ['PowerBI', 'Tableau'] };
      
      const hash1 = steeringWriter.generateInputsHash(inputs1);
      const hash2 = steeringWriter.generateInputsHash(inputs2);
      
      expect(hash1).toBe(hash2); // Should be same despite different order
    });
  });

  describe('Steering Package Creation', () => {
    it('should create complete steering package with all components', () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Sample PR/FAQ Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      expect(package_.featureSlug).toBe('ai-powered-analytics-dashboard');
      expect(package_.artifactType).toBe('pr_faq');
      expect(package_.bodyMarkdown).toBe('# Sample PR/FAQ Content');
      
      // Validate front matter
      expect(package_.frontMatter.title).toBe('PR/FAQ — AI-Powered Analytics Dashboard');
      expect(package_.frontMatter.artifact_type).toBe('pr_faq');
      expect(package_.frontMatter.inputs_hash).toBe(inputsHash);
      expect(package_.frontMatter.profile).toBe('amazon');
      
      // Validate confidence data
      expect(package_.frontMatter.confidence.total).toBe(78);
      expect(package_.frontMatter.confidence.breakdown.evidence).toBe(80);
      
      // Validate assumptions data
      expect(package_.frontMatter.assumptions.ids).toEqual(['A1', 'A2']);
      expect(package_.frontMatter.assumptions.coverage_pct).toBe(85);
      
      // Validate scenarios data
      expect(package_.frontMatter.scenarios.pct).toBe(20);
      expect(package_.frontMatter.scenarios.metrics).toEqual(['Revenue', 'ROI']);
      
      // Validate attachments
      expect(package_.attachments).toHaveLength(3);
      expect(package_.attachments.map(a => a.type)).toEqual(['assumptions', 'citations', 'scenarios']);
    });

    it('should create decision one-pager package correctly', () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'decision_onepager',
        '# Sample Decision One-Pager Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      expect(package_.artifactType).toBe('decision_onepager');
      expect(package_.frontMatter.title).toBe('Decision One-Pager — AI-Powered Analytics Dashboard');
      expect(package_.frontMatter.artifact_type).toBe('decision_onepager');
    });

    it('should generate valid JSON for all attachments', () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Sample Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      // Validate all attachments contain valid JSON
      package_.attachments.forEach(attachment => {
        expect(() => JSON.parse(attachment.content)).not.toThrow();
      });

      // Validate assumptions attachment structure
      const assumptionsAttachment = package_.attachments.find(a => a.type === 'assumptions');
      const assumptionsData = JSON.parse(assumptionsAttachment!.content);
      expect(assumptionsData.assumptions).toHaveLength(2);
      expect(assumptionsData.coverage_pct).toBe(85);

      // Validate citations attachment structure
      const citationsAttachment = package_.attachments.find(a => a.type === 'citations');
      const citationsData = JSON.parse(citationsAttachment!.content);
      expect(citationsData).toHaveLength(1);
      expect(citationsData[0].url).toBe('https://example.com/pricing-research');

      // Validate scenarios attachment structure
      const scenariosAttachment = package_.attachments.find(a => a.type === 'scenarios');
      const scenariosData = JSON.parse(scenariosAttachment!.content);
      expect(scenariosData.scenarios).toBeDefined();
      expect(scenariosData.elasticities).toBeDefined();
      expect(scenariosData.keyDrivers).toBeDefined();
      expect(scenariosData.hardQuestions).toBeDefined();
    });
  });

  describe('File System Operations', () => {
    it('should write complete steering package to file system', async () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Sample PR/FAQ Content\n\nThis is the body content.',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      const result = await steeringWriter.writeSteering(package_);

      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.featureSlug).toBe('ai-powered-analytics-dashboard');
      expect(result.data?.inputsHash).toBe(inputsHash);

      // Verify main document was written
      const artifactPath = result.data!.artifactPath;
      const artifactContent = await readFile(artifactPath, 'utf-8');
      
      expect(artifactContent).toContain('---');
      expect(artifactContent).toContain('title: "PR/FAQ — AI-Powered Analytics Dashboard"');
      expect(artifactContent).toContain('artifact_type: pr_faq');
      expect(artifactContent).toContain(`inputs_hash: "${inputsHash}"`);
      expect(artifactContent).toContain('# Sample PR/FAQ Content');
      expect(artifactContent).toContain('This is the body content.');

      // Verify attachments were written
      expect(result.data!.attachmentPaths).toHaveLength(3);
      
      for (const attachmentPath of result.data!.attachmentPaths) {
        await expect(access(attachmentPath)).resolves.not.toThrow();
        const attachmentContent = await readFile(attachmentPath, 'utf-8');
        expect(() => JSON.parse(attachmentContent)).not.toThrow();
      }
    });

    it('should create proper directory structure', async () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      await steeringWriter.writeSteering(package_);

      // Verify directory structure
      const baseDir = join(tempDir, '.kiro', 'steering', 'working-backwards', 'ai-powered-analytics-dashboard');
      const attachmentsDir = join(baseDir, 'attachments');
      
      await expect(access(baseDir)).resolves.not.toThrow();
      await expect(access(attachmentsDir)).resolves.not.toThrow();
    });

    it('should create and update latest.json pointer', async () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      await steeringWriter.writeSteering(package_);

      // Verify latest.json was created
      const latestPath = join(
        tempDir,
        '.kiro',
        'steering',
        'working-backwards',
        'ai-powered-analytics-dashboard',
        'latest.json'
      );
      
      await expect(access(latestPath)).resolves.not.toThrow();
      
      const latestContent = await readFile(latestPath, 'utf-8');
      const latestData = JSON.parse(latestContent);
      
      expect(latestData.featureSlug).toBe('ai-powered-analytics-dashboard');
      expect(latestData.artifactFilename).toMatch(/^pr_faq-[a-f0-9]{8}\.md$/);
      expect(latestData.attachmentPaths).toHaveLength(3);
      expect(latestData.lastUpdated).toBeDefined();
    });

    it('should handle feature names with special characters', async () => {
      const specialInputs = {
        ...mockBusinessInputs,
        featureName: 'AI-Powered Analytics & Reporting Dashboard (v2.0)!'
      };
      
      const inputsHash = steeringWriter.generateInputsHash(specialInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        specialInputs.featureName,
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      const result = await steeringWriter.writeSteering(package_);

      expect(result.success).toBe(true);
      expect(result.data?.featureSlug).toBe('ai-powered-analytics-reporting-dashboard-v20');
      
      // Verify files were created with sanitized names
      const artifactPath = result.data!.artifactPath;
      expect(artifactPath).toContain('ai-powered-analytics-reporting-dashboard-v20');
    });
  });

  describe('Front Matter Formatting', () => {
    it('should generate valid YAML front matter', async () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      const result = await steeringWriter.writeSteering(package_);
      const artifactContent = await readFile(result.data!.artifactPath, 'utf-8');
      
      // Extract YAML front matter
      const yamlMatch = artifactContent.match(/^---\n([\s\S]*?)\n---/);
      expect(yamlMatch).toBeTruthy();
      
      const yamlContent = yamlMatch![1];
      
      // Verify key YAML structure
      expect(yamlContent).toContain('title: "PR/FAQ — AI-Powered Analytics Dashboard"');
      expect(yamlContent).toContain('artifact_type: pr_faq');
      expect(yamlContent).toContain('profile: "amazon"');
      expect(yamlContent).toContain('confidence:');
      expect(yamlContent).toContain('  total: 78');
      expect(yamlContent).toContain('assumptions:');
      expect(yamlContent).toContain('  ids: ["A1", "A2"]');
      expect(yamlContent).toContain('  coverage_pct: 85');
      expect(yamlContent).toContain('scenarios:');
      expect(yamlContent).toContain('  pct: 20');
      expect(yamlContent).toContain('paths:');
      expect(yamlContent).toContain('assumptions_json:');
      expect(yamlContent).toContain('citations_json:');
      expect(yamlContent).toContain('scenarios_json:');
    });

    it('should include all confidence breakdown values', async () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      const result = await steeringWriter.writeSteering(package_);
      const artifactContent = await readFile(result.data!.artifactPath, 'utf-8');
      
      expect(artifactContent).toContain('evidence: 80');
      expect(artifactContent).toContain('recency: 75');
      expect(artifactContent).toContain('diversity: 70');
      expect(artifactContent).toContain('agreement: 85');
      expect(artifactContent).toContain('coverage: 85');
      expect(artifactContent).toContain('sensitivity: 65');
    });
  });

  describe('Error Handling', () => {
    it('should handle write errors gracefully', async () => {
      // Create steering writer with invalid path
      const invalidSteeringWriter = new SteeringWriter('/invalid/path/that/does/not/exist');
      
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      const result = await invalidSteeringWriter.writeSteering(package_);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('STEERING_WRITE_ERROR');
    });

    it('should validate required package components', async () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      // Create package with missing components
      const incompletePackage: SteeringPackage = {
        featureSlug: 'test-feature',
        artifactType: 'pr_faq',
        frontMatter: {} as any, // Invalid front matter
        bodyMarkdown: '# Content',
        attachments: []
      };

      const result = await steeringWriter.writeSteering(incompletePackage);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration with Kiro fileMatch', () => {
    it('should create files that support Kiro fileMatch pattern', async () => {
      const inputsHash = steeringWriter.generateInputsHash(mockBusinessInputs);
      
      const package_ = steeringWriter.createSteeringPackage(
        mockBusinessInputs.featureName,
        'pr_faq',
        '# Content',
        mockLedger,
        mockConfidence,
        mockScenarios,
        mockHardQuestions,
        mockCitations,
        inputsHash
      );

      const result = await steeringWriter.writeSteering(package_);

      // Verify latest.json structure supports fileMatch
      const latestPath = join(
        tempDir,
        '.kiro',
        'steering',
        'working-backwards',
        'ai-powered-analytics-dashboard',
        'latest.json'
      );
      
      const latestContent = await readFile(latestPath, 'utf-8');
      const latestData = JSON.parse(latestContent);
      
      expect(latestData.artifactFilename).toBeDefined();
      expect(latestData.featureSlug).toBe('ai-powered-analytics-dashboard');
      expect(latestData.lastUpdated).toBeDefined();
      
      // Verify file naming supports pattern matching
      expect(latestData.artifactFilename).toMatch(/^pr_faq-[a-f0-9]{8}\.md$/);
    });
  });
});