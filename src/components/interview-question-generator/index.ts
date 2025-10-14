/**
 * Interview Question Generator Component
 * Generates PM interview questions with role-level filtering and intelligent selection
 */

import {
  InterviewQuestion,
  QuestionGenerationConfig,
  QuestionCategory,
  RoleLevel,
  QuestionFilters,
  InterviewSession
} from '../../models/interview';
import { InterviewQuestionBank } from '../interview-question-bank/index';

export interface QuestionGenerationResult {
  question: InterviewQuestion;
  reasoning: string;
  confidence: number;
  alternatives: InterviewQuestion[];
}

export class InterviewQuestionGenerator {
  private questionBank: InterviewQuestionBank;

  constructor(questionBank?: InterviewQuestionBank) {
    this.questionBank = questionBank || new InterviewQuestionBank();
  }

  /**
   * Generate a question based on configuration and session context
   */
  async generateQuestion(config: QuestionGenerationConfig): Promise<QuestionGenerationResult> {
    try {
      const filters = this.buildFilters(config);
      const question = this.selectOptimalQuestion(filters, config);
      const alternatives = this.getAlternativeQuestions(question, filters, 3);
      
      return {
        question,
        reasoning: this.generateReasoning(question, config),
        confidence: this.calculateConfidence(question, config),
        alternatives
      };
    } catch (error) {
      throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple questions for a session
   */
  async generateQuestionSet(
    config: QuestionGenerationConfig,
    count: number = 5
  ): Promise<InterviewQuestion[]> {
    const questions: InterviewQuestion[] = [];
    const usedIds: string[] = [...(config.previousQuestions || [])];

    // Ensure variety across categories for comprehensive assessment
    const categories: QuestionCategory[] = ['behavioral', 'product_sense', 'analytical', 'technical'];
    const questionsPerCategory = Math.ceil(count / categories.length);

    for (const category of categories) {
      const categoryConfig = { ...config, category };
      const categoryFilters = this.buildFilters(categoryConfig);
      categoryFilters.excludeIds = usedIds;

      for (let i = 0; i < questionsPerCategory && questions.length < count; i++) {
        try {
          const question = this.selectOptimalQuestion(categoryFilters, categoryConfig);
          questions.push(question);
          usedIds.push(question.id);
          categoryFilters.excludeIds = usedIds;
        } catch (error) {
          // If no more questions in this category, continue to next
          break;
        }
      }
    }

    // Fill remaining slots with any available questions
    while (questions.length < count) {
      try {
        const generalFilters = this.buildFilters(config);
        generalFilters.excludeIds = usedIds;
        const question = this.selectOptimalQuestion(generalFilters, config);
        questions.push(question);
        usedIds.push(question.id);
      } catch (error) {
        // No more questions available
        break;
      }
    }

    return questions;
  }

  /**
   * Get next question based on session progress
   */
  async getNextQuestion(session: InterviewSession): Promise<QuestionGenerationResult> {
    const config = this.buildConfigFromSession(session);
    return this.generateQuestion(config);
  }

  private buildFilters(config: QuestionGenerationConfig): QuestionFilters {
    return {
      roleLevel: config.roleLevel,
      category: config.category,
      difficulty: config.difficulty,
      company: config.company,
      excludeIds: config.previousQuestions || []
    };
  }

  private selectOptimalQuestion(filters: QuestionFilters, config: QuestionGenerationConfig): InterviewQuestion {
    // Get all matching questions
    let candidates = this.questionBank.getAllQuestions();

    // Apply filters
    if (filters.roleLevel) {
      candidates = candidates.filter(q => q.roleLevel.includes(filters.roleLevel!));
    }
    if (filters.category) {
      candidates = candidates.filter(q => q.category === filters.category);
    }
    if (filters.difficulty) {
      candidates = candidates.filter(q => q.difficulty === filters.difficulty);
    }
    if (filters.company) {
      candidates = candidates.filter(q => !q.company || q.company === filters.company);
    }
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      candidates = candidates.filter(q => !filters.excludeIds!.includes(q.id));
    }

    if (candidates.length === 0) {
      throw new Error('No questions match the specified criteria');
    }

    // Score and rank candidates
    const scoredCandidates = candidates.map(question => ({
      question,
      score: this.scoreQuestion(question, config)
    }));

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Add some randomness to avoid always picking the same "best" question
    const topCandidates = scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    
    return topCandidates[randomIndex].question;
  }

  private scoreQuestion(question: InterviewQuestion, config: QuestionGenerationConfig): number {
    let score = 0;

    // Role level match (higher weight for exact match)
    if (question.roleLevel.includes(config.roleLevel)) {
      score += 10;
    }

    // Difficulty appropriateness based on role level
    const targetDifficulty = this.getTargetDifficulty(config.roleLevel);
    const difficultyDiff = Math.abs(question.difficulty - targetDifficulty);
    score += Math.max(0, 5 - difficultyDiff);

    // Category preference (if specified)
    if (config.category && question.category === config.category) {
      score += 8;
    }

    // Company-specific bonus
    if (config.company && question.company === config.company) {
      score += 5;
    }

    // Framework coverage (prefer questions that test important frameworks)
    const importantFrameworks = ['STAR', 'CIRCLES', 'RICE'];
    const frameworkBonus = question.frameworks.filter(f => importantFrameworks.includes(f)).length;
    score += frameworkBonus * 2;

    // Session context considerations
    if (config.sessionContext) {
      // Avoid repetitive categories if session has many questions
      const categoryCount = config.sessionContext.responses.filter(
        r => this.questionBank.getQuestionById(r.questionId)?.category === question.category
      ).length;
      if (categoryCount > 2) {
        score -= 3;
      }

      // Prefer questions that test weak areas
      const avgCategoryScore = config.sessionContext.overallProgress.categoryScores[question.category];
      if (avgCategoryScore && avgCategoryScore < 3) {
        score += 4;
      }
    }

    return score;
  }

  private getTargetDifficulty(roleLevel: RoleLevel): number {
    switch (roleLevel) {
      case 'APM':
        return 2;
      case 'PM':
        return 3;
      case 'Senior PM':
        return 4;
      default:
        return 3;
    }
  }

  private getAlternativeQuestions(
    selectedQuestion: InterviewQuestion,
    filters: QuestionFilters,
    count: number
  ): InterviewQuestion[] {
    const alternatives: InterviewQuestion[] = [];
    const excludeIds = [...(filters.excludeIds || []), selectedQuestion.id];

    // Get questions from the same category first
    const sameCategory = this.questionBank.getQuestionsByCategory(selectedQuestion.category)
      .filter(q => !excludeIds.includes(q.id) && q.roleLevel.includes(filters.roleLevel!))
      .slice(0, count);

    alternatives.push(...sameCategory);

    // Fill remaining slots with questions from other categories
    if (alternatives.length < count) {
      const remaining = count - alternatives.length;
      const otherQuestions = this.questionBank.getAllQuestions()
        .filter(q => 
          !excludeIds.includes(q.id) && 
          !alternatives.some(alt => alt.id === q.id) &&
          q.roleLevel.includes(filters.roleLevel!)
        )
        .slice(0, remaining);

      alternatives.push(...otherQuestions);
    }

    return alternatives;
  }

  private generateReasoning(question: InterviewQuestion, config: QuestionGenerationConfig): string {
    const reasons: string[] = [];

    reasons.push(`Selected ${question.category} question for ${config.roleLevel} level`);

    if (question.difficulty) {
      const difficultyLabels = ['', 'Basic', 'Intermediate', 'Advanced', 'Expert', 'Master'];
      reasons.push(`Difficulty: ${difficultyLabels[question.difficulty]} (${question.difficulty}/5)`);
    }

    if (question.frameworks.length > 0) {
      reasons.push(`Tests frameworks: ${question.frameworks.join(', ')}`);
    }

    if (config.company && question.company === config.company) {
      reasons.push(`Company-specific question for ${config.company}`);
    }

    if (config.sessionContext) {
      const categoryCount = config.sessionContext.responses.filter(
        r => this.questionBank.getQuestionById(r.questionId)?.category === question.category
      ).length;
      
      if (categoryCount === 0) {
        reasons.push(`First ${question.category} question in session`);
      } else if (categoryCount > 0) {
        reasons.push(`Building on previous ${question.category} questions`);
      }
    }

    return reasons.join('. ');
  }

  private calculateConfidence(question: InterviewQuestion, config: QuestionGenerationConfig): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for exact role match
    if (question.roleLevel.includes(config.roleLevel)) {
      confidence += 0.2;
    }

    // Higher confidence for appropriate difficulty
    const targetDifficulty = this.getTargetDifficulty(config.roleLevel);
    const difficultyMatch = 1 - (Math.abs(question.difficulty - targetDifficulty) / 5);
    confidence += difficultyMatch * 0.1;

    // Higher confidence for category match
    if (config.category && question.category === config.category) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  private buildConfigFromSession(session: InterviewSession): QuestionGenerationConfig {
    return {
      roleLevel: session.roleLevel,
      company: session.company,
      previousQuestions: session.questionsAsked,
      sessionContext: session
    };
  }
}