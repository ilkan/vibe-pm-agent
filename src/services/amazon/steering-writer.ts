/**
 * Amazon Working Backwards - Kiro Steering Integration Service
 * Saves documents to .kiro/steering/working-backwards/<feature-slug>/ with deterministic front-matter
 */

import { BaseService, Result } from '../_base';
import { createHash } from 'crypto';
import { writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { AssumptionLedger } from '../../models/assumptions';
import { ConfidenceScore } from '../../models/confidence';
import { ScenarioResults } from '../../models/scenarios';
import { HardQuestion } from '../../models/questions';
import { Citation } from '../../models/confidence';

export interface BusinessInputs {
  featureName: string;
  customer: string;
  region?: string;
  competitors?: string[];
  pricing?: number;
  users?: number;
  convRate?: number;
  devCost?: number;
  opsCost?: number;
  marketSize?: number;
  competitiveAdvantage?: string;
  timeline?: string;
  citations?: Citation[];
  assumptions?: string[];
}

export interface SteeringPackage {
  featureSlug: string;
  artifactType: 'pr_faq' | 'decision_onepager' | 'business_case' | 'board_presentation' | 'team_announcement';
  frontMatter: FrontMatter;
  bodyMarkdown: string;
  attachments: Attachment[];
}

export interface FrontMatter {
  title: string;
  artifact_type: string;
  created_at: string;
  inputs_hash: string;
  profile: string;
  confidence: {
    total: number;
    breakdown: {
      evidence: number;
      recency: number;
      diversity: number;
      agreement: number;
      coverage: number;
      sensitivity: number;
    };
  };
  assumptions: {
    ids: string[];
    coverage_pct: number;
  };
  scenarios: {
    pct: number;
    metrics: string[];
  };
  paths: {
    assumptions_json: string;
    citations_json: string;
    scenarios_json: string;
  };
}

export interface Attachment {
  filename: string;
  content: string;
  type: 'assumptions' | 'citations' | 'scenarios';
}

export interface SteeringResult {
  success: boolean;
  featureSlug: string;
  artifactPath: string;
  attachmentPaths: string[];
  inputsHash: string;
  message: string;
  filename?: string;
  fullPath?: string;
}

export class SteeringWriter extends BaseService {
  private readonly workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd()) {
    super();
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Write steering package to .kiro/steering/working-backwards/<feature-slug>/
   */
  async writeSteering(pack: SteeringPackage): Promise<Result<SteeringResult>> {
    return this.handleAsync(async () => {
      const baseDir = join(
        this.workspaceRoot,
        '.kiro',
        'steering',
        'working-backwards',
        pack.featureSlug
      );

      // Ensure directory exists
      await this.ensureDirectory(baseDir);
      await this.ensureDirectory(join(baseDir, 'attachments'));

      // Generate short hash for filenames
      const shortHash = pack.frontMatter.inputs_hash.substring(0, 8);

      // Write main document
      const artifactFilename = `${pack.artifactType}-${shortHash}.md`;
      const artifactPath = join(baseDir, artifactFilename);
      const documentContent = this.formatDocument(pack.frontMatter, pack.bodyMarkdown);
      
      await writeFile(artifactPath, documentContent, 'utf-8');

      // Write attachments
      const attachmentPaths: string[] = [];
      for (const attachment of pack.attachments) {
        const attachmentFilename = `${attachment.type}-${shortHash}.json`;
        const attachmentPath = join(baseDir, 'attachments', attachmentFilename);
        await writeFile(attachmentPath, attachment.content, 'utf-8');
        attachmentPaths.push(attachmentPath);
      }

      // Update latest.json pointer
      await this.updateLatest(pack.featureSlug, artifactFilename, attachmentPaths);

      return {
        success: true,
        featureSlug: pack.featureSlug,
        artifactPath,
        attachmentPaths,
        inputsHash: pack.frontMatter.inputs_hash,
        message: `Successfully wrote ${pack.artifactType} to ${artifactPath}`,
        filename: artifactFilename,
        fullPath: artifactPath
      };
    }, 'STEERING_WRITE_ERROR');
  }

  /**
   * Generate SHA-256 hash from business inputs for change detection
   */
  generateInputsHash(inputs: BusinessInputs): string {
    // Create normalized input object for consistent hashing
    const normalizedInputs = {
      featureName: inputs.featureName,
      customer: inputs.customer,
      region: inputs.region || '',
      competitors: (inputs.competitors || []).sort(),
      pricing: inputs.pricing || 0,
      users: inputs.users || 0,
      convRate: inputs.convRate || 0,
      devCost: inputs.devCost || 0,
      opsCost: inputs.opsCost || 0,
      marketSize: inputs.marketSize || 0,
      competitiveAdvantage: inputs.competitiveAdvantage || '',
      timeline: inputs.timeline || '',
      assumptions: (inputs.assumptions || []).sort(),
      // Include citation URLs for hash but not full content
      citationUrls: (inputs.citations || []).map(c => c.url).sort()
    };

    const inputString = JSON.stringify(normalizedInputs, null, 0);
    return createHash('sha256').update(inputString).digest('hex');
  }

  /**
   * Create steering package from Amazon mechanism outputs
   */
  createSteeringPackage(
    featureName: string,
    artifactType: 'pr_faq' | 'decision_onepager' | 'business_case' | 'board_presentation' | 'team_announcement',
    bodyMarkdown: string,
    ledger: AssumptionLedger,
    confidence: ConfidenceScore,
    scenarios: ScenarioResults,
    hardQuestions: HardQuestion[],
    citations: Citation[],
    inputsHash: string
  ): SteeringPackage {
    const featureSlug = this.generateFeatureSlug(featureName);
    const shortHash = inputsHash.substring(0, 8);
    const isoTimestamp = new Date().toISOString();

    // Create front matter
    const frontMatter: FrontMatter = {
      title: `${artifactType === 'pr_faq' ? 'PR/FAQ' : 'Decision One-Pager'} — ${featureName}`,
      artifact_type: artifactType,
      created_at: isoTimestamp,
      inputs_hash: inputsHash,
      profile: 'amazon',
      confidence: {
        total: confidence.total,
        breakdown: confidence.breakdown
      },
      assumptions: {
        ids: ledger.assumptions.map(a => a.id),
        coverage_pct: ledger.coverage_pct
      },
      scenarios: {
        pct: scenarios.sensitivityPct,
        metrics: this.extractScenarioMetrics(scenarios)
      },
      paths: {
        assumptions_json: `./attachments/assumptions-${shortHash}.json`,
        citations_json: `./attachments/citations-${shortHash}.json`,
        scenarios_json: `./attachments/scenarios-${shortHash}.json`
      }
    };

    // Create attachments
    const attachments: Attachment[] = [
      {
        filename: `assumptions-${shortHash}.json`,
        content: JSON.stringify(ledger, null, 2),
        type: 'assumptions'
      },
      {
        filename: `citations-${shortHash}.json`,
        content: JSON.stringify(citations, null, 2),
        type: 'citations'
      },
      {
        filename: `scenarios-${shortHash}.json`,
        content: JSON.stringify({
          scenarios: scenarios.scenarios,
          elasticities: scenarios.elasticities,
          keyDrivers: scenarios.keyDrivers,
          hardQuestions
        }, null, 2),
        type: 'scenarios'
      }
    ];

    return {
      featureSlug,
      artifactType,
      frontMatter,
      bodyMarkdown,
      attachments
    };
  }

  /**
   * Update latest.json pointer for Kiro fileMatch integration
   */
  private async updateLatest(
    featureSlug: string,
    artifactFilename: string,
    attachmentPaths: string[]
  ): Promise<void> {
    const baseDir = join(
      this.workspaceRoot,
      '.kiro',
      'steering',
      'working-backwards',
      featureSlug
    );

    const latestPath = join(baseDir, 'latest.json');
    const latestData = {
      lastUpdated: new Date().toISOString(),
      artifactFilename,
      attachmentPaths: attachmentPaths.map(path => path.replace(baseDir + '/', '')),
      featureSlug
    };

    await writeFile(latestPath, JSON.stringify(latestData, null, 2), 'utf-8');
  }

  /**
   * Generate feature slug from feature name (kebab-case)
   */
  private generateFeatureSlug(featureName: string): string {
    return featureName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Format document with YAML front matter and markdown body
   */
  private formatDocument(frontMatter: FrontMatter, bodyMarkdown: string): string {
    const yamlFrontMatter = this.formatYamlFrontMatter(frontMatter);
    return `---\n${yamlFrontMatter}---\n\n${bodyMarkdown}`;
  }

  /**
   * Format front matter as YAML
   */
  private formatYamlFrontMatter(frontMatter: FrontMatter): string {
    const yaml = [
      `title: "${frontMatter.title}"`,
      `artifact_type: ${frontMatter.artifact_type}`,
      `created_at: "${frontMatter.created_at}"`,
      `inputs_hash: "${frontMatter.inputs_hash}"`,
      `profile: "${frontMatter.profile}"`,
      `confidence:`,
      `  total: ${frontMatter.confidence.total}`,
      `  breakdown:`,
      `    evidence: ${frontMatter.confidence.breakdown.evidence}`,
      `    recency: ${frontMatter.confidence.breakdown.recency}`,
      `    diversity: ${frontMatter.confidence.breakdown.diversity}`,
      `    agreement: ${frontMatter.confidence.breakdown.agreement}`,
      `    coverage: ${frontMatter.confidence.breakdown.coverage}`,
      `    sensitivity: ${frontMatter.confidence.breakdown.sensitivity}`,
      `assumptions:`,
      `  ids: [${frontMatter.assumptions.ids.map(id => `"${id}"`).join(', ')}]`,
      `  coverage_pct: ${frontMatter.assumptions.coverage_pct}`,
      `scenarios:`,
      `  pct: ${frontMatter.scenarios.pct}`,
      `  metrics: [${frontMatter.scenarios.metrics.map(m => `"${m}"`).join(', ')}]`,
      `paths:`,
      `  assumptions_json: "${frontMatter.paths.assumptions_json}"`,
      `  citations_json: "${frontMatter.paths.citations_json}"`,
      `  scenarios_json: "${frontMatter.paths.scenarios_json}"`
    ];

    return yaml.join('\n') + '\n';
  }

  /**
   * Extract scenario metrics for front matter
   */
  private extractScenarioMetrics(scenarios: ScenarioResults): string[] {
    return scenarios.scenarios.base.map(row => row.metric);
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await access(dirPath);
    } catch {
      await mkdir(dirPath, { recursive: true });
    }
  }
}