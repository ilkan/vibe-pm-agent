/**
 * SteeringFileGenerator Component
 * 
 * Converts PM agent outputs into Kiro steering files with appropriate templates
 * and formatting for different document types.
 */

import {
  SteeringFile,
  SteeringContext,
  DocumentType,
  FrontMatter
} from '../../models/steering';
import { TemplateProcessor } from '../template-processor';
import { SteeringFileTemplates } from '../steering-file-templates';
import { FrontMatterProcessor } from '../front-matter-processor';

/**
 * Interface for the SteeringFileGenerator component
 */
export interface ISteeringFileGenerator {
  generateFromRequirements(requirements: string, context: SteeringContext): SteeringFile;
  generateFromDesign(design: string, context: SteeringContext): SteeringFile;
  generateFromOnePager(onePager: string, context: SteeringContext): SteeringFile;
  generateFromPRFAQ(prfaq: string, context: SteeringContext): SteeringFile;
  generateFromTaskPlan(taskPlan: string, context: SteeringContext): SteeringFile;
}

/**
 * SteeringFileGenerator implementation that converts PM agent documents
 * into properly formatted Kiro steering files
 */
export class SteeringFileGenerator implements ISteeringFileGenerator {
  private readonly templateProcessor: TemplateProcessor;
  private readonly steeringTemplates: SteeringFileTemplates;
  private readonly frontMatterProcessor: FrontMatterProcessor;

  constructor() {
    this.templateProcessor = new TemplateProcessor();
    this.steeringTemplates = new SteeringFileTemplates();
    this.frontMatterProcessor = new FrontMatterProcessor();
  }

  /**
   * Generate steering file from requirements document
   */
  generateFromRequirements(requirements: string, context: SteeringContext): SteeringFile {
    const template = this.steeringTemplates.getTemplate(DocumentType.REQUIREMENTS)!;
    const frontMatter = this.frontMatterProcessor.generateFrontMatter(DocumentType.REQUIREMENTS, context);
    
    const placeholders = {
      feature_name: context.featureName,
      timestamp: frontMatter.generatedAt,
      business_context: this.templateProcessor.extractBusinessContext(requirements),
      key_requirements: this.templateProcessor.extractKeyRequirements(requirements),
      consulting_insights: this.extractConsultingInsights(requirements),
      related_documents: this.templateProcessor.formatFileReferences(
        this.templateProcessor.generateFileReferences(context.relatedFiles)
      )
    };

    const content = this.templateProcessor.processTemplate(template.template, placeholders);

    return {
      filename: this.generateFilename(context.featureName, DocumentType.REQUIREMENTS),
      frontMatter,
      content,
      references: this.templateProcessor.generateFileReferences(context.relatedFiles),
      fullPath: `.kiro/steering/${this.generateFilename(context.featureName, DocumentType.REQUIREMENTS)}`
    };
  }

  /**
   * Generate steering file from design options document
   */
  generateFromDesign(design: string, context: SteeringContext): SteeringFile {
    const template = this.steeringTemplates.getTemplate(DocumentType.DESIGN)!;
    const frontMatter = this.frontMatterProcessor.generateFrontMatter(DocumentType.DESIGN, context);
    
    const placeholders = {
      feature_name: context.featureName,
      timestamp: frontMatter.generatedAt,
      design_philosophy: this.extractDesignPhilosophy(design),
      design_options: this.templateProcessor.extractDesignOptions(design),
      impact_effort_matrix: this.templateProcessor.extractImpactEffortMatrix(design),
      architecture_guidance: this.extractArchitectureGuidance(design),
      risk_assessment: this.extractRiskAssessment(design),
      related_documents: this.templateProcessor.formatFileReferences(
        this.templateProcessor.generateFileReferences(context.relatedFiles)
      )
    };

    const content = this.templateProcessor.processTemplate(template.template, placeholders);

    return {
      filename: this.generateFilename(context.featureName, DocumentType.DESIGN),
      frontMatter,
      content,
      references: this.templateProcessor.generateFileReferences(context.relatedFiles),
      fullPath: `.kiro/steering/${this.generateFilename(context.featureName, DocumentType.DESIGN)}`
    };
  }

  /**
   * Generate steering file from management one-pager document
   */
  generateFromOnePager(onePager: string, context: SteeringContext): SteeringFile {
    const template = this.steeringTemplates.getTemplate(DocumentType.ONEPAGER)!;
    const frontMatter = this.frontMatterProcessor.generateFrontMatter(DocumentType.ONEPAGER, context);
    
    const placeholders = {
      feature_name: context.featureName,
      timestamp: frontMatter.generatedAt,
      executive_summary: this.templateProcessor.extractExecutiveSummary(onePager),
      strategic_recommendation: this.extractStrategicRecommendation(onePager),
      roi_analysis: this.templateProcessor.extractROIAnalysis(onePager),
      pyramid_principle: this.extractPyramidPrinciple(onePager),
      success_metrics: this.extractSuccessMetrics(onePager),
      decision_framework: this.extractDecisionFramework(onePager),
      related_documents: this.templateProcessor.formatFileReferences(
        this.templateProcessor.generateFileReferences(context.relatedFiles)
      )
    };

    const content = this.templateProcessor.processTemplate(template.template, placeholders);

    return {
      filename: this.generateFilename(context.featureName, DocumentType.ONEPAGER),
      frontMatter,
      content,
      references: this.templateProcessor.generateFileReferences(context.relatedFiles),
      fullPath: `.kiro/steering/${this.generateFilename(context.featureName, DocumentType.ONEPAGER)}`
    };
  }

  /**
   * Generate steering file from PR-FAQ document
   */
  generateFromPRFAQ(prfaq: string, context: SteeringContext): SteeringFile {
    const template = this.steeringTemplates.getTemplate(DocumentType.PRFAQ)!;
    const frontMatter = this.frontMatterProcessor.generateFrontMatter(DocumentType.PRFAQ, context);
    
    const placeholders = {
      feature_name: context.featureName,
      timestamp: frontMatter.generatedAt,
      press_release: this.extractPressRelease(prfaq),
      product_vision: this.extractProductVision(prfaq),
      faq_section: this.extractFAQSection(prfaq),
      product_clarity: this.extractProductClarity(prfaq),
      communication_strategy: this.extractCommunicationStrategy(prfaq),
      market_context: this.extractMarketContext(prfaq),
      related_documents: this.templateProcessor.formatFileReferences(
        this.templateProcessor.generateFileReferences(context.relatedFiles)
      )
    };

    const content = this.templateProcessor.processTemplate(template.template, placeholders);

    return {
      filename: this.generateFilename(context.featureName, DocumentType.PRFAQ),
      frontMatter,
      content,
      references: this.templateProcessor.generateFileReferences(context.relatedFiles),
      fullPath: `.kiro/steering/${this.generateFilename(context.featureName, DocumentType.PRFAQ)}`
    };
  }

  /**
   * Generate steering file from task plan document
   */
  generateFromTaskPlan(taskPlan: string, context: SteeringContext): SteeringFile {
    const template = this.steeringTemplates.getTemplate(DocumentType.TASKS)!;
    const frontMatter = this.frontMatterProcessor.generateFrontMatter(DocumentType.TASKS, context);
    
    const placeholders = {
      feature_name: context.featureName,
      timestamp: frontMatter.generatedAt,
      implementation_strategy: this.extractImplementationStrategy(taskPlan),
      task_breakdown: this.templateProcessor.extractTaskBreakdown(taskPlan),
      best_practices: this.extractBestPractices(taskPlan),
      qa_guidelines: this.extractQAGuidelines(taskPlan),
      implementation_phases: this.extractImplementationPhases(taskPlan),
      risk_mitigation: this.extractRiskMitigation(taskPlan),
      success_criteria: this.extractSuccessCriteria(taskPlan),
      related_documents: this.templateProcessor.formatFileReferences(
        this.templateProcessor.generateFileReferences(context.relatedFiles)
      )
    };

    const content = this.templateProcessor.processTemplate(template.template, placeholders);

    return {
      filename: this.generateFilename(context.featureName, DocumentType.TASKS),
      frontMatter,
      content,
      references: this.templateProcessor.generateFileReferences(context.relatedFiles),
      fullPath: `.kiro/steering/${this.generateFilename(context.featureName, DocumentType.TASKS)}`
    };
  }

  /**
   * Generate filename for steering file
   */
  private generateFilename(featureName: string, documentType: DocumentType): string {
    const sanitizedName = featureName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `${sanitizedName}-${documentType}.md`;
  }

  // Enhanced content extraction methods for new template placeholders

  // Design-specific extraction methods
  private extractDesignPhilosophy(design: string): string {
    return this.templateProcessor.extractSectionByKeywords(design, [
      'philosophy', 'principles', 'approach', 'methodology'
    ]) || 'Design philosophy derived from overall approach and methodology.';
  }

  private extractRiskAssessment(design: string): string {
    return this.templateProcessor.extractSectionByKeywords(design, [
      'risk', 'risks', 'challenges', 'concerns', 'mitigation'
    ]) || 'Risk assessment based on design complexity and implementation challenges.';
  }

  // One-pager specific extraction methods
  private extractStrategicRecommendation(onePager: string): string {
    return this.templateProcessor.extractSectionByKeywords(onePager, [
      'recommendation', 'strategy', 'strategic', 'approach'
    ]) || 'Strategic recommendation derived from analysis and business case.';
  }

  private extractSuccessMetrics(onePager: string): string {
    return this.templateProcessor.extractSectionByKeywords(onePager, [
      'metrics', 'kpi', 'success', 'measurement', 'goals'
    ]) || 'Success metrics to be defined based on business objectives.';
  }

  private extractDecisionFramework(onePager: string): string {
    return this.templateProcessor.extractSectionByKeywords(onePager, [
      'decision', 'framework', 'criteria', 'evaluation'
    ]) || 'Decision framework based on ROI analysis and strategic alignment.';
  }

  // PR-FAQ specific extraction methods
  private extractProductVision(prfaq: string): string {
    return this.templateProcessor.extractSectionByKeywords(prfaq, [
      'vision', 'mission', 'purpose', 'goal'
    ]) || 'Product vision derived from press release and customer value proposition.';
  }

  private extractCommunicationStrategy(prfaq: string): string {
    return this.templateProcessor.extractSectionByKeywords(prfaq, [
      'communication', 'messaging', 'strategy', 'positioning'
    ]) || 'Communication strategy based on customer-focused messaging and value proposition.';
  }

  private extractMarketContext(prfaq: string): string {
    return this.templateProcessor.extractSectionByKeywords(prfaq, [
      'market', 'competitive', 'landscape', 'context', 'industry'
    ]) || 'Market context derived from product positioning and competitive analysis.';
  }

  // Tasks specific extraction methods
  private extractImplementationStrategy(taskPlan: string): string {
    return this.templateProcessor.extractSectionByKeywords(taskPlan, [
      'strategy', 'approach', 'methodology', 'implementation'
    ]) || 'Implementation strategy based on task structure and development methodology.';
  }

  private extractQAGuidelines(taskPlan: string): string {
    return this.templateProcessor.extractSectionByKeywords(taskPlan, [
      'quality', 'qa', 'testing', 'validation', 'verification'
    ]) || 'Quality assurance guidelines derived from testing and validation requirements.';
  }

  private extractImplementationPhases(taskPlan: string): string {
    return this.templateProcessor.extractSectionByKeywords(taskPlan, [
      'phases', 'milestones', 'stages', 'iterations'
    ]) || 'Implementation phases based on task dependencies and logical groupings.';
  }

  private extractRiskMitigation(taskPlan: string): string {
    return this.templateProcessor.extractSectionByKeywords(taskPlan, [
      'risk', 'mitigation', 'contingency', 'fallback'
    ]) || 'Risk mitigation strategies based on implementation complexity and dependencies.';
  }

  private extractSuccessCriteria(taskPlan: string): string {
    return this.templateProcessor.extractSectionByKeywords(taskPlan, [
      'success', 'criteria', 'completion', 'done', 'acceptance'
    ]) || 'Success criteria derived from task completion requirements and acceptance criteria.';
  }

  // Legacy extraction methods that are still needed
  private extractArchitectureGuidance(design: string): string {
    return this.templateProcessor.extractSectionByKeywords(design, [
      'architecture', 'components', 'interfaces', 'system', 'structure'
    ]) || 'Architecture guidance derived from design components and system structure.';
  }

  private extractConsultingInsights(requirements: string): string {
    // Look for patterns that indicate consulting methodology
    const insights = [];
    
    if (requirements.includes('MoSCoW')) {
      insights.push('- Uses MoSCoW prioritization methodology');
    }
    if (requirements.includes('EARS') || requirements.includes('WHEN') && requirements.includes('THEN') && requirements.includes('SHALL')) {
      insights.push('- Follows EARS (Easy Approach to Requirements Syntax) format');
    }
    if (requirements.includes('User Story') || requirements.includes('As a')) {
      insights.push('- Structured with user stories for stakeholder clarity');
    }
    if (requirements.includes('Acceptance Criteria')) {
      insights.push('- Includes detailed acceptance criteria for validation');
    }
    
    return insights.length > 0 ? insights.join('\n') : 'Standard requirements analysis applied.';
  }

  // Legacy extraction methods using old extractSection helper

  private extractPyramidPrinciple(onePager: string): string {
    return this.templateProcessor.extractSectionByKeywords(onePager, [
      'pyramid', 'principle', 'structure', 'recommendation'
    ]) || 'Pyramid Principle structure not explicitly defined.';
  }

  // Content extraction methods for PR-FAQ
  private extractPressRelease(prfaq: string): string {
    return this.templateProcessor.extractSectionByKeywords(prfaq, [
      'press release', 'announcement', 'launch'
    ]) || 'Press release section not found.';
  }

  private extractFAQSection(prfaq: string): string {
    return this.templateProcessor.extractSectionByKeywords(prfaq, [
      'faq', 'frequently asked', 'questions'
    ]) || 'FAQ section not found.';
  }

  private extractProductClarity(prfaq: string): string {
    // Extract insights about product clarity and communication
    const insights = [];
    
    if (prfaq.includes('customer') || prfaq.includes('user')) {
      insights.push('- Customer-focused communication approach');
    }
    if (prfaq.includes('benefit') || prfaq.includes('value')) {
      insights.push('- Clear value proposition articulation');
    }
    if (prfaq.includes('launch') || prfaq.includes('release')) {
      insights.push('- Launch-ready product positioning');
    }
    
    return insights.length > 0 ? insights.join('\n') : 'Product clarity insights derived from PR-FAQ structure.';
  }

  // Legacy task extraction methods (now handled by TemplateProcessor)

  private extractBestPractices(taskPlan: string): string {
    const insights = [];
    
    if (taskPlan.includes('test') || taskPlan.includes('TDD')) {
      insights.push('- Test-driven development approach recommended');
    }
    if (taskPlan.includes('incremental') || taskPlan.includes('iterative')) {
      insights.push('- Incremental implementation strategy');
    }
    if (taskPlan.includes('validation') || taskPlan.includes('verify')) {
      insights.push('- Continuous validation and verification');
    }
    
    return insights.length > 0 ? insights.join('\n') : 'Best practices derived from task structure and methodology.';
  }
}

export default SteeringFileGenerator;