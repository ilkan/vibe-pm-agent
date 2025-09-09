/**
 * Amazon Working Backwards - Hard Questions Service
 * Generates adversarial questions that challenge assumptions and identify evidence gaps
 */

import { BaseService, Result } from '../_base';
import { 
  HardQuestion, 
  QuestionContext, 
  EvidenceRecommendation 
} from '../../models/questions';
import { performanceCache } from '../../utils/performance-cache';
import { performanceMonitor } from '../../utils/performance-monitor';

export class HardQuestionsService extends BaseService {
  /**
   * Generate adversarial questions targeting weakest assumptions
   */
  async generateQuestions(context: QuestionContext): Promise<Result<HardQuestion[]>> {
    return this.handleAsync(async () => {
      const { result } = await performanceMonitor.timeOperation(
        'hard_questions_service',
        async () => {
          const questions: HardQuestion[] = [];
          let questionId = 1;

          // Generate assumption-specific challenges
          const assumptionQuestions = this.generateAssumptionChallenges(context, questionId);
          questions.push(...assumptionQuestions);
          questionId += assumptionQuestions.length;

          // Generate market skepticism questions
          const marketQuestions = this.generateMarketQuestions(context, questionId);
          questions.push(...marketQuestions);
          questionId += marketQuestions.length;

          // Generate financial scrutiny questions
          const financialQuestions = this.generateFinancialQuestions(context, questionId);
          questions.push(...financialQuestions);
          questionId += financialQuestions.length;

          // Generate execution doubt questions
          const executionQuestions = this.generateExecutionQuestions(context, questionId);
          questions.push(...executionQuestions);
          questionId += executionQuestions.length;

          // Generate competitive threat questions
          const competitiveQuestions = this.generateCompetitiveQuestions(context, questionId);
          questions.push(...competitiveQuestions);

          return questions.slice(0, 10); // Return top 10 questions
        },
        performanceCache.hashInputs(context)
      );

      return result;
    }, 'HARD_QUESTIONS_GENERATION_ERROR');
  }

  /**
   * Prioritize questions by potential impact and stakeholder likelihood
   */
  async prioritizeQuestions(questions: HardQuestion[]): Promise<Result<HardQuestion[]>> {
    return this.handleAsync(async () => {
      return questions.sort((a, b) => {
        // Priority order: critical > important > clarifying
        const severityOrder = { 'critical': 3, 'important': 2, 'clarifying': 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        
        if (severityDiff !== 0) return severityDiff;
        
        // Secondary sort by number of target assumptions (more assumptions = higher impact)
        return b.targetAssumptions.length - a.targetAssumptions.length;
      });
    }, 'QUESTION_PRIORITIZATION_ERROR');
  }

  /**
   * Suggest specific evidence to address each question
   */
  async suggestEvidence(question: HardQuestion): Promise<Result<EvidenceRecommendation[]>> {
    return this.handleAsync(async () => {
      const recommendations: EvidenceRecommendation[] = [];

      switch (question.category) {
        case 'market':
          recommendations.push(
            {
              type: 'data_source',
              description: 'Industry market research reports from Gartner, IDC, or Forrester',
              priority: 'high',
              estimatedEffort: '1-2 weeks'
            },
            {
              type: 'validation_method',
              description: 'Customer interviews and surveys to validate demand assumptions',
              priority: 'high',
              estimatedEffort: '2-3 weeks'
            }
          );
          break;

        case 'financial':
          recommendations.push(
            {
              type: 'data_source',
              description: 'Comparable company financial analysis and benchmarking data',
              priority: 'high',
              estimatedEffort: '1 week'
            },
            {
              type: 'validation_method',
              description: 'Financial model sensitivity analysis and Monte Carlo simulation',
              priority: 'medium',
              estimatedEffort: '1-2 weeks'
            }
          );
          break;

        case 'competitive':
          recommendations.push(
            {
              type: 'research_study',
              description: 'Competitive intelligence analysis and market positioning study',
              priority: 'high',
              estimatedEffort: '2-3 weeks'
            },
            {
              type: 'data_source',
              description: 'Patent analysis and competitive feature comparison',
              priority: 'medium',
              estimatedEffort: '1 week'
            }
          );
          break;

        case 'execution':
          recommendations.push(
            {
              type: 'validation_method',
              description: 'Technical feasibility assessment and prototype development',
              priority: 'high',
              estimatedEffort: '3-4 weeks'
            },
            {
              type: 'data_source',
              description: 'Resource capacity analysis and team skill assessment',
              priority: 'medium',
              estimatedEffort: '1 week'
            }
          );
          break;

        case 'timing':
          recommendations.push(
            {
              type: 'data_source',
              description: 'Market timing signals and trend analysis data',
              priority: 'high',
              estimatedEffort: '1-2 weeks'
            },
            {
              type: 'validation_method',
              description: 'Regulatory and compliance timeline assessment',
              priority: 'medium',
              estimatedEffort: '1 week'
            }
          );
          break;
      }

      return recommendations;
    }, 'EVIDENCE_SUGGESTION_ERROR');
  }

  /**
   * Generate questions challenging specific assumptions
   */
  private generateAssumptionChallenges(context: QuestionContext, startId: number): HardQuestion[] {
    const questions: HardQuestion[] = [];
    let id = startId;

    // Target weakest assumptions
    context.weakestIds.slice(0, 3).forEach(assumptionId => {
      const assumption = context.ledger.assumptions.find(a => a.id === assumptionId);
      if (assumption) {
        questions.push({
          id: id++,
          question: `How do you know that ${assumption.name} (${assumption.value}) is accurate? What evidence supports this critical assumption?`,
          targetAssumptions: [assumptionId],
          category: this.mapAssumptionCategoryToQuestionCategory(assumption.category),
          severity: assumption.impact === 'critical' ? 'critical' : 'important',
          evidenceNeeded: [`Credible sources for ${assumption.name}`, 'Independent validation of the assumption']
        });
      }
    });

    return questions;
  }

  /**
   * Generate market skepticism questions
   */
  private generateMarketQuestions(context: QuestionContext, startId: number): HardQuestion[] {
    const questions: HardQuestion[] = [];
    let id = startId;

    const marketAssumptions = context.ledger.assumptions.filter(a => a.category === 'market');
    const marketIds = marketAssumptions.map(a => a.id);

    if (marketAssumptions.length > 0) {
      questions.push({
        id: id++,
        question: 'What if the market size is significantly smaller than projected? How would this impact the business case?',
        targetAssumptions: marketIds,
        category: 'market',
        severity: 'critical',
        evidenceNeeded: ['Third-party market research', 'Bottom-up market sizing analysis', 'Customer demand validation']
      });

      questions.push({
        id: id++,
        question: 'Why is now the right time for this solution? What if market timing assumptions are wrong?',
        targetAssumptions: marketIds,
        category: 'timing',
        severity: 'important',
        evidenceNeeded: ['Market trend analysis', 'Competitive timing assessment', 'Customer readiness indicators']
      });
    }

    return questions;
  }

  /**
   * Generate financial scrutiny questions
   */
  private generateFinancialQuestions(context: QuestionContext, startId: number): HardQuestion[] {
    const questions: HardQuestion[] = [];
    let id = startId;

    const financialAssumptions = context.ledger.assumptions.filter(a => a.category === 'financial');
    const financialIds = financialAssumptions.map(a => a.id);

    if (financialAssumptions.length > 0) {
      questions.push({
        id: id++,
        question: 'What if development costs are 50% higher than estimated? How does this affect ROI and payback period?',
        targetAssumptions: financialIds,
        category: 'financial',
        severity: 'critical',
        evidenceNeeded: ['Historical cost analysis', 'Vendor quotes', 'Resource planning details']
      });

      questions.push({
        id: id++,
        question: 'How confident are we in the revenue projections? What are the key risks to achieving these numbers?',
        targetAssumptions: financialIds,
        category: 'financial',
        severity: 'critical',
        evidenceNeeded: ['Revenue model validation', 'Customer willingness-to-pay research', 'Pricing sensitivity analysis']
      });
    }

    return questions;
  }

  /**
   * Generate execution doubt questions
   */
  private generateExecutionQuestions(context: QuestionContext, startId: number): HardQuestion[] {
    const questions: HardQuestion[] = [];
    let id = startId;

    const technicalAssumptions = context.ledger.assumptions.filter(a => a.category === 'technical');
    const technicalIds = technicalAssumptions.map(a => a.id);

    questions.push({
      id: id++,
      question: 'Do we have the technical capabilities and resources to execute this successfully? What are the key execution risks?',
      targetAssumptions: technicalIds,
      category: 'execution',
      severity: 'important',
      evidenceNeeded: ['Technical feasibility study', 'Resource capacity analysis', 'Risk assessment matrix']
    });

    questions.push({
      id: id++,
      question: 'What if the timeline is unrealistic? How would delays impact the business case and competitive position?',
      targetAssumptions: technicalIds,
      category: 'timing',
      severity: 'important',
      evidenceNeeded: ['Detailed project timeline', 'Historical delivery performance', 'Critical path analysis']
    });

    return questions;
  }

  /**
   * Map assumption category to question category
   */
  private mapAssumptionCategoryToQuestionCategory(assumptionCategory: 'market' | 'financial' | 'technical' | 'competitive'): 'market' | 'financial' | 'competitive' | 'execution' | 'timing' {
    switch (assumptionCategory) {
      case 'technical':
        return 'execution';
      case 'market':
        return 'market';
      case 'financial':
        return 'financial';
      case 'competitive':
        return 'competitive';
      default:
        return 'market';
    }
  }

  /**
   * Generate competitive threat questions
   */
  private generateCompetitiveQuestions(context: QuestionContext, startId: number): HardQuestion[] {
    const questions: HardQuestion[] = [];
    let id = startId;

    const competitiveAssumptions = context.ledger.assumptions.filter(a => a.category === 'competitive');
    const competitiveIds = competitiveAssumptions.map(a => a.id);

    if (context.competitiveContext) {
      questions.push({
        id: id++,
        question: 'How will competitors respond to this launch? What if they launch a similar solution first or at the same time?',
        targetAssumptions: competitiveIds,
        category: 'competitive',
        severity: 'important',
        evidenceNeeded: ['Competitive intelligence analysis', 'Competitor roadmap research', 'Market response scenarios']
      });
    }

    questions.push({
      id: id++,
      question: 'What makes this solution defensible against competitive threats? How sustainable is our competitive advantage?',
      targetAssumptions: competitiveIds,
      category: 'competitive',
      severity: 'important',
      evidenceNeeded: ['Competitive differentiation analysis', 'Intellectual property assessment', 'Moat sustainability study']
    });

    return questions;
  }
}