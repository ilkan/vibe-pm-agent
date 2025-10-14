/**
 * Case Study Execution Engine
 * Manages case study progression, hints, and evaluation
 */

import {
  CaseStudy,
  CaseSession,
  CaseStep,
  CaseStepResponse,
  CaseProgress,
  CaseHint,
  CaseStepEvaluation,
  CaseEvaluation,
  CaseFramework,
  CaseFrameworkAnalysis,
  CaseMarketContext
} from '../../models/interview';
import { FrameworkGuidanceSystem } from '../framework-guidance/index';

export interface CaseExecutionConfig {
  enableHints: boolean;
  timeTracking: boolean;
  autoProgression: boolean;
  evaluationMode: 'immediate' | 'step_complete' | 'case_complete';
}

export class CaseStudyExecutionEngine {
  private frameworkGuidance: FrameworkGuidanceSystem;
  private activeSessions: Map<string, CaseSession> = new Map();

  constructor(private config: CaseExecutionConfig = {
    enableHints: true,
    timeTracking: true,
    autoProgression: false,
    evaluationMode: 'step_complete'
  }) {
    this.frameworkGuidance = new FrameworkGuidanceSystem();
  }

  /**
   * Initialize a new case study session
   */
  async initializeCaseSession(
    caseStudy: CaseStudy,
    userId?: string,
    sessionId?: string
  ): Promise<CaseSession> {
    const session: CaseSession = {
      sessionId: sessionId || this.generateSessionId(),
      userId,
      caseStudy,
      currentStep: 1,
      startTime: new Date(),
      stepResponses: [],
      hintsUsed: [],
      progress: this.initializeProgress(caseStudy)
    };

    this.activeSessions.set(session.sessionId, session);
    return session;
  }

  /**
   * Get current step for a session
   */
  getCurrentStep(sessionId: string): CaseStep | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return session.caseStudy.steps.find(step => step.stepNumber === session.currentStep) || null;
  }

  /**
   * Submit response for current step
   */
  async submitStepResponse(
    sessionId: string,
    response: string,
    frameworksUsed: CaseFramework[] = []
  ): Promise<{
    success: boolean;
    evaluation?: CaseStepEvaluation;
    nextStep?: CaseStep;
    hints?: CaseHint[];
    error?: string;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const currentStep = this.getCurrentStep(sessionId);
    if (!currentStep) {
      return { success: false, error: 'Current step not found' };
    }

    // Create step response
    const stepResponse: CaseStepResponse = {
      stepNumber: session.currentStep,
      userResponse: response,
      timestamp: new Date(),
      timeSpent: this.calculateTimeSpent(session, currentStep),
      frameworksUsed
    };

    // Evaluate the response if configured
    let evaluation: CaseStepEvaluation | undefined;
    if (this.config.evaluationMode === 'immediate' || this.config.evaluationMode === 'step_complete') {
      evaluation = await this.evaluateStepResponse(currentStep, stepResponse, session);
      stepResponse.evaluation = evaluation;
    }

    // Add response to session
    session.stepResponses.push(stepResponse);

    // Update progress
    this.updateProgress(session);

    // Check if we should provide hints
    const hints = this.shouldProvideHints(session, currentStep, evaluation);

    // Determine next step
    const nextStep = this.getNextStep(session, currentStep, evaluation);
    if (nextStep) {
      session.currentStep = nextStep.stepNumber;
    }

    return {
      success: true,
      evaluation,
      nextStep,
      hints
    };
  }

  /**
   * Request hint for current step
   */
  getHint(sessionId: string, hintLevel: 'gentle' | 'moderate' | 'strong' = 'gentle'): CaseHint | null {
    if (!this.config.enableHints) return null;

    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const currentStep = this.getCurrentStep(sessionId);
    if (!currentStep) return null;

    // Find appropriate hint
    const availableHints = currentStep.hints.filter(hint => 
      hint.level === hintLevel && 
      !session.hintsUsed.includes(hint.id)
    );

    if (availableHints.length === 0) {
      // Try next level if no hints available
      const nextLevel = hintLevel === 'gentle' ? 'moderate' : 'strong';
      if (nextLevel !== hintLevel) {
        return this.getHint(sessionId, nextLevel);
      }
      return null;
    }

    const hint = availableHints[0];
    session.hintsUsed.push(hint.id);

    return hint;
  }

  /**
   * Get framework guidance for current step
   */
  getFrameworkGuidanceForStep(sessionId: string): any[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];

    const currentStep = this.getCurrentStep(sessionId);
    if (!currentStep) return [];

    return this.frameworkGuidance.getGuidanceForStep(currentStep);
  }

  /**
   * Complete case study and generate final evaluation
   */
  async completeCaseStudy(sessionId: string): Promise<CaseEvaluation | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const evaluation = await this.generateFinalEvaluation(session);
    session.evaluation = evaluation;

    return evaluation;
  }

  /**
   * Get session progress
   */
  getSessionProgress(sessionId: string): CaseProgress | null {
    const session = this.activeSessions.get(sessionId);
    return session?.progress || null;
  }

  /**
   * Check if user appears stuck and needs guidance
   */
  isUserStuck(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const currentStep = this.getCurrentStep(sessionId);
    if (!currentStep) return false;

    const timeSpent = this.calculateTimeSpent(session, currentStep);
    const timeLimit = currentStep.timeLimit * 60 * 1000; // Convert to milliseconds

    // User is stuck if they've spent more than 1.5x the time limit
    return timeSpent > timeLimit * 1.5;
  }

  private generateSessionId(): string {
    return `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeProgress(caseStudy: CaseStudy): CaseProgress {
    return {
      stepsCompleted: 0,
      totalSteps: caseStudy.steps.length,
      currentStepProgress: 0,
      timeElapsed: 0,
      hintsUsed: 0,
      frameworksApplied: [],
      overallProgress: 0
    };
  }

  private calculateTimeSpent(session: CaseSession, step: CaseStep): number {
    const stepStartTime = session.stepResponses
      .filter(r => r.stepNumber === step.stepNumber)
      .reduce((earliest, response) => 
        response.timestamp < earliest ? response.timestamp : earliest, 
        new Date()
      );

    return Date.now() - Math.min(stepStartTime.getTime(), session.startTime.getTime());
  }

  private updateProgress(session: CaseSession): void {
    const completedSteps = session.stepResponses.length;
    const totalSteps = session.caseStudy.steps.length;
    
    session.progress = {
      stepsCompleted: completedSteps,
      totalSteps,
      currentStepProgress: session.currentStep / totalSteps,
      timeElapsed: Date.now() - session.startTime.getTime(),
      hintsUsed: session.hintsUsed.length,
      frameworksApplied: this.getUniqueFrameworksUsed(session),
      overallProgress: completedSteps / totalSteps
    };
  }

  private getUniqueFrameworksUsed(session: CaseSession): CaseFramework[] {
    const frameworks = new Set<CaseFramework>();
    session.stepResponses.forEach(response => {
      response.frameworksUsed.forEach(framework => frameworks.add(framework));
    });
    return Array.from(frameworks);
  }

  private async evaluateStepResponse(
    step: CaseStep,
    response: CaseStepResponse,
    session: CaseSession
  ): Promise<CaseStepEvaluation> {
    // Analyze framework usage
    const frameworkAnalysis = this.analyzeFrameworkUsage(step, response);
    
    // Calculate score based on multiple factors
    const score = this.calculateStepScore(step, response, frameworkAnalysis);
    
    // Generate feedback
    const { strengths, improvements, missingElements } = this.generateStepFeedback(
      step, 
      response, 
      frameworkAnalysis
    );

    // Generate next step recommendations
    const nextStepRecommendations = this.generateNextStepRecommendations(
      step, 
      response, 
      session
    );

    return {
      stepNumber: step.stepNumber,
      score,
      frameworkUsage: frameworkAnalysis,
      strengths,
      improvements,
      missingElements,
      nextStepRecommendations,
      confidence: this.calculateConfidenceScore(step, response, frameworkAnalysis)
    };
  }

  private analyzeFrameworkUsage(step: CaseStep, response: CaseStepResponse): CaseFrameworkAnalysis[] {
    return step.frameworks.map(framework => {
      const wasUsed = response.frameworksUsed.includes(framework);
      const guidance = this.frameworkGuidance.getFrameworkGuidance(framework);
      
      // Simple analysis - in a real implementation, this would use NLP
      const usage = this.determineFrameworkUsage(framework, response.userResponse, wasUsed);
      
      return {
        framework,
        usage,
        score: this.scoreFrameworkUsage(usage),
        feedback: this.generateFrameworkFeedback(framework, usage, guidance?.description || '')
      };
    });
  }

  private determineFrameworkUsage(
    framework: CaseFramework, 
    response: string, 
    explicitlyUsed: boolean
  ): 'excellent' | 'good' | 'partial' | 'missing' {
    if (explicitlyUsed) {
      // Check if response contains framework-specific keywords
      const frameworkKeywords = this.getFrameworkKeywords(framework);
      const keywordMatches = frameworkKeywords.filter(keyword => 
        response.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      if (keywordMatches >= frameworkKeywords.length * 0.8) return 'excellent';
      if (keywordMatches >= frameworkKeywords.length * 0.5) return 'good';
      return 'partial';
    }
    
    return 'missing';
  }

  private getFrameworkKeywords(framework: CaseFramework): string[] {
    const keywords: Record<CaseFramework, string[]> = {
      'CIRCLES': ['comprehend', 'identify', 'report', 'cut', 'list', 'evaluate', 'summarize'],
      'RICE': ['reach', 'impact', 'confidence', 'effort', 'score'],
      'SWOT': ['strengths', 'weaknesses', 'opportunities', 'threats'],
      'Porter_Five_Forces': ['rivalry', 'suppliers', 'buyers', 'substitutes', 'entrants'],
      'Jobs_to_be_Done': ['functional job', 'emotional job', 'social job', 'hire'],
      'North_Star': ['north star', 'key metric', 'customer value'],
      'OKRs': ['objective', 'key results', 'measurable'],
      'Lean_Canvas': ['problem', 'solution', 'value proposition', 'customer segments']
    };
    
    return keywords[framework] || [];
  }

  private scoreFrameworkUsage(usage: 'excellent' | 'good' | 'partial' | 'missing'): number {
    const scores = { excellent: 1.0, good: 0.8, partial: 0.5, missing: 0.0 };
    return scores[usage];
  }

  private generateFrameworkFeedback(
    framework: CaseFramework, 
    usage: 'excellent' | 'good' | 'partial' | 'missing',
    description: string
  ): string {
    const feedbackTemplates = {
      excellent: `Excellent use of ${framework}! You demonstrated strong understanding of the framework.`,
      good: `Good application of ${framework}. Consider incorporating more elements of the framework.`,
      partial: `Partial use of ${framework}. ${description} Try to apply the complete framework structure.`,
      missing: `Consider using ${framework} for this step. ${description}`
    };
    
    return feedbackTemplates[usage];
  }

  private calculateStepScore(
    step: CaseStep, 
    response: CaseStepResponse, 
    frameworkAnalysis: CaseFrameworkAnalysis[]
  ): number {
    // Base score from response quality (simplified)
    let baseScore = Math.min(response.userResponse.length / 200, 1.0); // Longer responses get higher base score
    
    // Framework usage score
    const frameworkScore = frameworkAnalysis.reduce((sum, analysis) => sum + analysis.score, 0) / 
                          Math.max(frameworkAnalysis.length, 1);
    
    // Time efficiency score
    const timeScore = this.calculateTimeEfficiencyScore(response.timeSpent, step.timeLimit);
    
    // Weighted average
    const finalScore = (baseScore * 0.4 + frameworkScore * 0.4 + timeScore * 0.2) * 5; // Scale to 1-5
    
    return Math.max(1, Math.min(5, finalScore));
  }

  private calculateTimeEfficiencyScore(timeSpent: number, timeLimit: number): number {
    const timeLimitMs = timeLimit * 60 * 1000;
    if (timeSpent <= timeLimitMs) return 1.0;
    if (timeSpent <= timeLimitMs * 1.5) return 0.8;
    if (timeSpent <= timeLimitMs * 2) return 0.6;
    return 0.4;
  }

  private generateStepFeedback(
    step: CaseStep, 
    response: CaseStepResponse, 
    frameworkAnalysis: CaseFrameworkAnalysis[]
  ): { strengths: string[]; improvements: string[]; missingElements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const missingElements: string[] = [];

    // Analyze framework usage
    frameworkAnalysis.forEach(analysis => {
      if (analysis.usage === 'excellent' || analysis.usage === 'good') {
        strengths.push(`Strong application of ${analysis.framework}`);
      } else if (analysis.usage === 'partial') {
        improvements.push(`Consider more complete use of ${analysis.framework}`);
      } else {
        missingElements.push(`${analysis.framework} framework not applied`);
      }
    });

    // Check against evaluation criteria
    step.evaluationCriteria.forEach(criteria => {
      // Simplified check - in real implementation would use NLP
      if (response.userResponse.toLowerCase().includes(criteria.toLowerCase().split(' ')[0])) {
        strengths.push(`Addressed: ${criteria}`);
      } else {
        missingElements.push(criteria);
      }
    });

    // Add generic feedback based on response length and structure
    if (response.userResponse.length > 500) {
      strengths.push('Comprehensive and detailed response');
    } else if (response.userResponse.length < 100) {
      improvements.push('Consider providing more detailed analysis');
    }

    return { strengths, improvements, missingElements };
  }

  private generateNextStepRecommendations(
    step: CaseStep, 
    response: CaseStepResponse, 
    session: CaseSession
  ): string[] {
    const recommendations: string[] = [];
    
    // Based on current step performance
    if (response.evaluation && response.evaluation.score < 3) {
      recommendations.push('Consider revisiting this step with additional framework application');
    }
    
    // Based on next step requirements
    const nextStep = session.caseStudy.steps.find(s => s.stepNumber === step.stepNumber + 1);
    if (nextStep) {
      recommendations.push(`Next: ${nextStep.title} - Focus on ${nextStep.frameworks.join(', ')}`);
      
      if (nextStep.dependencies?.includes(step.stepNumber)) {
        recommendations.push('Ensure your current analysis is solid as the next step builds on it');
      }
    }
    
    return recommendations;
  }

  private calculateConfidenceScore(
    step: CaseStep, 
    response: CaseStepResponse, 
    frameworkAnalysis: CaseFrameworkAnalysis[]
  ): number {
    // Confidence based on framework usage completeness and response quality
    const frameworkConfidence = frameworkAnalysis.reduce((sum, analysis) => sum + analysis.score, 0) / 
                               Math.max(frameworkAnalysis.length, 1);
    
    const responseQuality = Math.min(response.userResponse.length / 300, 1.0);
    
    return (frameworkConfidence * 0.7 + responseQuality * 0.3);
  }

  private shouldProvideHints(
    session: CaseSession, 
    step: CaseStep, 
    evaluation?: CaseStepEvaluation
  ): CaseHint[] {
    if (!this.config.enableHints) return [];
    
    const hints: CaseHint[] = [];
    
    // Time-based hints
    if (this.isUserStuck(session.sessionId)) {
      const timeHints = step.hints.filter(h => h.trigger === 'time_elapsed');
      hints.push(...timeHints);
    }
    
    // Performance-based hints
    if (evaluation && evaluation.score < 3) {
      const stuckHints = step.hints.filter(h => h.trigger === 'user_stuck');
      hints.push(...stuckHints);
    }
    
    // Framework-based hints
    if (evaluation) {
      const missingFrameworks = evaluation.frameworkUsage
        .filter(f => f.usage === 'missing' || f.usage === 'partial')
        .map(f => f.framework);
      
      const frameworkHints = step.hints.filter(h => 
        h.trigger === 'framework_missing' && 
        h.framework && 
        missingFrameworks.includes(h.framework)
      );
      hints.push(...frameworkHints);
    }
    
    // Filter out already used hints
    return hints.filter(hint => !session.hintsUsed.includes(hint.id));
  }

  private getNextStep(
    session: CaseSession, 
    currentStep: CaseStep, 
    evaluation?: CaseStepEvaluation
  ): CaseStep | null {
    if (!this.config.autoProgression) return null;
    
    // Check if current step is satisfactory
    if (evaluation && evaluation.score < 2) {
      return null; // Don't progress if score is too low
    }
    
    // Find next step
    const nextStepNumber = currentStep.stepNumber + 1;
    return session.caseStudy.steps.find(step => step.stepNumber === nextStepNumber) || null;
  }

  private async generateFinalEvaluation(session: CaseSession): Promise<CaseEvaluation> {
    const stepEvaluations = session.stepResponses
      .map(response => response.evaluation)
      .filter((evaluation): evaluation is CaseStepEvaluation => evaluation !== undefined);

    const overallScore = stepEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / 
                        Math.max(stepEvaluations.length, 1);

    const frameworkProficiency = this.calculateFrameworkProficiency(stepEvaluations);
    
    const strengths = this.consolidateStrengths(stepEvaluations);
    const improvements = this.consolidateImprovements(stepEvaluations);
    
    const executiveSummary = this.generateExecutiveSummary(session, overallScore, frameworkProficiency);
    
    const recommendedNextCases = this.recommendNextCases(session, frameworkProficiency);
    
    return {
      caseId: session.caseStudy.id,
      overallScore,
      stepEvaluations,
      frameworkProficiency,
      strengths,
      improvements,
      executiveSummary,
      recommendedNextCases,
      timeSpent: session.progress.timeElapsed,
      confidence: this.calculateOverallConfidence(stepEvaluations)
    };
  }

  private calculateFrameworkProficiency(evaluations: CaseStepEvaluation[]): Record<CaseFramework, number> {
    const proficiency: Record<string, number[]> = {};
    
    evaluations.forEach(evaluation => {
      evaluation.frameworkUsage.forEach(analysis => {
        if (!proficiency[analysis.framework]) {
          proficiency[analysis.framework] = [];
        }
        proficiency[analysis.framework].push(analysis.score);
      });
    });
    
    const result: Record<CaseFramework, number> = {} as Record<CaseFramework, number>;
    Object.entries(proficiency).forEach(([framework, scores]) => {
      result[framework as CaseFramework] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    return result;
  }

  private consolidateStrengths(evaluations: CaseStepEvaluation[]): string[] {
    const allStrengths = evaluations.flatMap(evaluation => evaluation.strengths);
    return [...new Set(allStrengths)]; // Remove duplicates
  }

  private consolidateImprovements(evaluations: CaseStepEvaluation[]): string[] {
    const allImprovements = evaluations.flatMap(evaluation => evaluation.improvements);
    return [...new Set(allImprovements)]; // Remove duplicates
  }

  private generateExecutiveSummary(
    session: CaseSession, 
    overallScore: number, 
    frameworkProficiency: Record<CaseFramework, number>
  ): string {
    const performance = overallScore >= 4 ? 'excellent' : overallScore >= 3 ? 'good' : 'needs improvement';
    const timeEfficiency = session.progress.timeElapsed <= session.caseStudy.estimatedTime * 60 * 1000 ? 
                          'efficient' : 'could be more efficient';
    
    const strongFrameworks = Object.entries(frameworkProficiency)
      .filter(([_, score]) => score >= 0.8)
      .map(([framework, _]) => framework);
    
    return `Overall ${performance} performance on ${session.caseStudy.title}. ` +
           `Time management was ${timeEfficiency}. ` +
           `Strong proficiency demonstrated in: ${strongFrameworks.join(', ') || 'none'}.`;
  }

  private recommendNextCases(
    session: CaseSession, 
    frameworkProficiency: Record<CaseFramework, number>
  ): string[] {
    // Simple recommendation logic - in practice would be more sophisticated
    const weakFrameworks = Object.entries(frameworkProficiency)
      .filter(([_, score]) => score < 0.6)
      .map(([framework, _]) => framework);
    
    const recommendations: string[] = [];
    
    if (weakFrameworks.includes('RICE')) {
      recommendations.push('Feature Prioritization case to improve RICE framework usage');
    }
    
    if (weakFrameworks.includes('SWOT')) {
      recommendations.push('Strategic Analysis case to strengthen SWOT analysis skills');
    }
    
    if (session.caseStudy.difficulty < 4) {
      recommendations.push('Higher difficulty case in the same category');
    }
    
    return recommendations;
  }

  private calculateOverallConfidence(evaluations: CaseStepEvaluation[]): number {
    if (evaluations.length === 0) return 0;
    
    return evaluations.reduce((sum, evaluation) => sum + evaluation.confidence, 0) / evaluations.length;
  }
}