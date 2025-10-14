/**
 * MCP Tool: complete_case_study
 * 
 * Completes a case study session and provides comprehensive evaluation
 * with performance analytics and personalized recommendations.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { CaseStudyHelper } from '../../components/case-study-helper/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface CompleteCaseStudyArgs {
  session_id: string;
  include_detailed_breakdown?: boolean;
  include_recommendations?: boolean;
  include_performance_analytics?: boolean;
}

/**
 * Complete case study session and get comprehensive evaluation
 */
export async function completeCaseStudy(
  args: CompleteCaseStudyArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Completing case study session', context, {
      sessionId: args.session_id,
      includeDetailedBreakdown: args.include_detailed_breakdown,
      includeRecommendations: args.include_recommendations,
      includePerformanceAnalytics: args.include_performance_analytics
    });

    // Initialize case study helper
    const caseHelper = new CaseStudyHelper();

    // Get final progress before completion
    const finalProgress = caseHelper.getProgress(args.session_id);
    if (!finalProgress) {
      throw new Error(`Session ${args.session_id} not found`);
    }

    // Complete the case study and get evaluation
    const evaluation = await caseHelper.completeCaseStudy(args.session_id);
    if (!evaluation) {
      throw new Error(`Failed to complete case study for session ${args.session_id}`);
    }

    MCPLogger.info('Case study completed successfully', context, {
      sessionId: args.session_id,
      caseId: evaluation.caseId,
      overallScore: evaluation.overallScore,
      stepsCompleted: evaluation.stepEvaluations.length,
      timeSpent: Math.round(evaluation.timeSpent / 1000 / 60), // minutes
      frameworksProficiency: Object.keys(evaluation.frameworkProficiency).length,
      confidence: evaluation.confidence
    });

    // Build comprehensive evaluation response
    const response: any = {
      caseCompletion: {
        sessionId: args.session_id,
        caseId: evaluation.caseId,
        completedAt: new Date().toISOString(),
        totalTimeSpent: Math.round(evaluation.timeSpent / 1000 / 60), // minutes
        stepsCompleted: evaluation.stepEvaluations.length,
        hintsUsed: finalProgress.hintsUsed
      },
      overallPerformance: {
        score: Math.round(evaluation.overallScore * 10) / 10,
        scoreInterpretation: getOverallScoreInterpretation(evaluation.overallScore),
        confidence: Math.round(evaluation.confidence * 100),
        readinessLevel: getReadinessLevel(evaluation.overallScore, evaluation.timeSpent),
        performanceLevel: getPerformanceLevel(evaluation.overallScore)
      },
      executiveSummary: evaluation.executiveSummary,
      keyStrengths: evaluation.strengths.slice(0, 5),
      keyImprovements: evaluation.improvements.slice(0, 5),
      frameworkProficiency: Object.entries(evaluation.frameworkProficiency).map(([framework, score]) => ({
        framework,
        proficiency: Math.round(score * 100),
        level: getFrameworkProficiencyLevel(score),
        recommendation: generateFrameworkRecommendation(framework, score)
      })),
      nextSteps: {
        immediateActions: generateImmediateActions(evaluation),
        practiceRecommendations: evaluation.recommendedNextCases.slice(0, 3),
        skillDevelopment: generateSkillDevelopmentPlan(evaluation),
        readinessAssessment: generateReadinessAssessment(evaluation)
      }
    };

    // Add detailed step breakdown if requested
    if (args.include_detailed_breakdown) {
      response.stepByStepBreakdown = evaluation.stepEvaluations.map(stepEval => ({
        stepNumber: stepEval.stepNumber,
        score: Math.round(stepEval.score * 10) / 10,
        scoreInterpretation: getStepScoreInterpretation(stepEval.score),
        strengths: stepEval.strengths,
        improvements: stepEval.improvements,
        missingElements: stepEval.missingElements,
        frameworkUsage: stepEval.frameworkUsage.map(fu => ({
          framework: fu.framework,
          usage: fu.usage,
          score: Math.round(fu.score * 10) / 10,
          feedback: fu.feedback
        })),
        nextStepRecommendations: stepEval.nextStepRecommendations,
        confidence: Math.round(stepEval.confidence * 100)
      }));
    }

    // Add personalized recommendations if requested
    if (args.include_recommendations) {
      response.personalizedRecommendations = {
        studyPlan: generateStudyPlan(evaluation),
        practiceSchedule: generatePracticeSchedule(evaluation),
        resourceSuggestions: generateResourceSuggestions(evaluation),
        focusAreas: generateFocusAreas(evaluation),
        nextCaseTypes: generateNextCaseTypeRecommendations(evaluation),
        companySpecificPrep: generateCompanySpecificPrep(evaluation)
      };
    }

    // Add performance analytics if requested
    if (args.include_performance_analytics) {
      response.performanceAnalytics = {
        scoreDistribution: calculateScoreDistribution(evaluation.stepEvaluations),
        frameworkUsageAnalytics: calculateFrameworkUsageAnalytics(evaluation.stepEvaluations),
        timeManagementAnalysis: calculateTimeManagementAnalysis(evaluation, finalProgress),
        consistencyAnalysis: calculateConsistencyAnalysis(evaluation.stepEvaluations),
        improvementTrend: calculateImprovementTrend(evaluation.stepEvaluations),
        benchmarkComparison: generateBenchmarkComparison(evaluation)
      };
    }

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 3, // Case completion is resource intensive
      caseCompleted: true,
      overallScore: evaluation.overallScore,
      stepsCompleted: evaluation.stepEvaluations.length,
      timeSpent: Math.round(evaluation.timeSpent / 1000 / 60),
      confidence: evaluation.confidence,
      nextAction: 'Review feedback and start new case study or interview practice'
    });

  } catch (error) {
    MCPLogger.error('complete_case_study tool failed', error as Error, context, {
      sessionId: args.session_id
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in complete_case_study'),
      context
    );
  }
}

// Helper functions for evaluation analysis
function getOverallScoreInterpretation(score: number): string {
  if (score >= 4.5) return 'Outstanding - Exceptional case study performance';
  if (score >= 4.0) return 'Excellent - Strong case study skills demonstrated';
  if (score >= 3.5) return 'Good - Solid performance with room for improvement';
  if (score >= 3.0) return 'Average - Basic competency shown, needs development';
  if (score >= 2.5) return 'Below Average - Significant gaps in case study approach';
  return 'Poor - Major improvement needed in case study methodology';
}

function getReadinessLevel(score: number, timeSpent: number): string {
  const timeInMinutes = timeSpent / 1000 / 60;
  const baseReadiness = score >= 4.0 ? 'Interview Ready' : 
                       score >= 3.5 ? 'Nearly Ready' : 
                       score >= 3.0 ? 'Needs Practice' : 'Significant Practice Needed';
  
  const timeEfficiency = timeInMinutes <= 45 ? ' (Efficient)' : 
                        timeInMinutes <= 60 ? ' (Good Timing)' : ' (Needs Speed)';
  
  return baseReadiness + timeEfficiency;
}

function getPerformanceLevel(score: number): string {
  if (score >= 4.0) return 'Advanced';
  if (score >= 3.5) return 'Proficient';
  if (score >= 3.0) return 'Developing';
  if (score >= 2.5) return 'Beginner';
  return 'Needs Foundation';
}

function getFrameworkProficiencyLevel(score: number): string {
  if (score >= 0.8) return 'Expert';
  if (score >= 0.6) return 'Proficient';
  if (score >= 0.4) return 'Developing';
  if (score >= 0.2) return 'Beginner';
  return 'Needs Learning';
}

function getStepScoreInterpretation(score: number): string {
  if (score >= 4.0) return 'Excellent step execution';
  if (score >= 3.5) return 'Good step performance';
  if (score >= 3.0) return 'Adequate step completion';
  if (score >= 2.5) return 'Weak step execution';
  return 'Poor step performance';
}

function generateFrameworkRecommendation(framework: string, score: number): string {
  if (score >= 0.8) {
    return `Excellent ${framework} mastery. Consider teaching others or tackling advanced applications.`;
  } else if (score >= 0.6) {
    return `Good ${framework} proficiency. Practice with more complex scenarios to reach mastery.`;
  } else if (score >= 0.4) {
    return `Developing ${framework} skills. Focus on systematic application and practice.`;
  } else {
    return `Study ${framework} framework fundamentals and practice basic applications.`;
  }
}

function generateImmediateActions(evaluation: any): string[] {
  const actions: string[] = [];
  
  if (evaluation.overallScore < 3.0) {
    actions.push('Review fundamental PM case study frameworks');
    actions.push('Practice structured problem-solving approach');
  }
  
  if (evaluation.improvements.length > 0) {
    actions.push(`Focus on improving: ${evaluation.improvements.slice(0, 2).join(', ')}`);
  }
  
  // Framework-specific actions
  Object.entries(evaluation.frameworkProficiency).forEach(([framework, score]: [string, any]) => {
    if (score < 0.5) {
      actions.push(`Study and practice ${framework} framework`);
    }
  });
  
  actions.push('Practice similar case types to reinforce learning');
  
  return actions.slice(0, 5); // Limit to top 5 actions
}

function generateStudyPlan(evaluation: any): any {
  return {
    week1: {
      focus: 'Framework mastery',
      activities: ['Study weak frameworks', 'Practice structured approaches'],
      timeCommitment: '5-7 hours'
    },
    week2: {
      focus: 'Case practice',
      activities: ['Complete 3-5 similar cases', 'Focus on improvement areas'],
      timeCommitment: '6-8 hours'
    },
    week3: {
      focus: 'Advanced practice',
      activities: ['Try harder cases', 'Practice under time pressure'],
      timeCommitment: '5-7 hours'
    },
    dailyPractice: '30-45 minutes of framework review and case practice'
  };
}

function generatePracticeSchedule(evaluation: any): any {
  const schedule = {
    frequency: evaluation.overallScore < 3.0 ? 'Daily' : evaluation.overallScore < 4.0 ? '4-5 times per week' : '2-3 times per week',
    sessionLength: '45-60 minutes',
    weeklyGoals: evaluation.overallScore < 3.0 ? '3-4 cases' : evaluation.overallScore < 4.0 ? '2-3 cases' : '1-2 cases'
  };
  
  return schedule;
}

function generateResourceSuggestions(evaluation: any): any {
  const resources: any = {
    books: ['Case in Point', 'Cracking the PM Case', 'PM Case Study Workbook'],
    onlineCourses: ['PM case study masterclass', 'Framework application course'],
    practicePartners: ['Find case study practice groups', 'Schedule mock interviews']
  };
  
  // Add framework-specific resources
  Object.entries(evaluation.frameworkProficiency).forEach(([framework, score]: [string, any]) => {
    if (score < 0.6) {
      if (!resources.frameworkGuides) resources.frameworkGuides = [];
      resources.frameworkGuides.push(`${framework} framework guide and exercises`);
    }
  });
  
  return resources;
}

function generateFocusAreas(evaluation: any): string[] {
  const focusAreas: string[] = [];
  
  // Based on step performance
  const weakSteps = evaluation.stepEvaluations
    .filter((step: any) => step.score < 3.0)
    .map((step: any) => `Step ${step.stepNumber} improvement`);
  
  focusAreas.push(...weakSteps.slice(0, 2));
  
  // Based on framework proficiency
  const weakFrameworks = Object.entries(evaluation.frameworkProficiency)
    .filter(([_, score]: [string, any]) => score < 0.6)
    .map(([framework, _]: [string, any]) => `${framework} framework mastery`);
  
  focusAreas.push(...weakFrameworks.slice(0, 2));
  
  // General areas
  if (evaluation.overallScore < 3.5) {
    focusAreas.push('Structured problem-solving');
    focusAreas.push('Clear communication');
  }
  
  return focusAreas.slice(0, 5);
}

function generateNextCaseTypeRecommendations(evaluation: any): any[] {
  const recommendations = [];
  
  if (evaluation.overallScore >= 4.0) {
    recommendations.push({
      type: 'Higher difficulty',
      reason: 'Strong performance - ready for more challenging cases'
    });
    recommendations.push({
      type: 'Different industry',
      reason: 'Expand experience across different domains'
    });
  } else if (evaluation.overallScore >= 3.0) {
    recommendations.push({
      type: 'Similar difficulty',
      reason: 'Reinforce learning with similar complexity'
    });
    recommendations.push({
      type: 'Focus on weak frameworks',
      reason: 'Practice cases that emphasize improvement areas'
    });
  } else {
    recommendations.push({
      type: 'Lower difficulty',
      reason: 'Build confidence with easier cases first'
    });
    recommendations.push({
      type: 'Framework-focused',
      reason: 'Practice specific framework application'
    });
  }
  
  return recommendations;
}

function generateCompanySpecificPrep(evaluation: any): any {
  return {
    recommendation: evaluation.overallScore >= 3.5 ? 
      'Ready for company-specific case practice' : 
      'Focus on general case skills before company-specific prep',
    suggestedCompanies: evaluation.overallScore >= 4.0 ? 
      ['Google', 'Amazon', 'Meta'] : 
      evaluation.overallScore >= 3.5 ? 
      ['Microsoft', 'Uber', 'Airbnb'] : 
      ['Practice with general cases first'],
    preparationTips: [
      'Research company values and recent launches',
      'Practice company-specific case scenarios',
      'Understand company product philosophy'
    ]
  };
}

// Analytics calculation functions
function calculateScoreDistribution(stepEvaluations: any[]): any {
  const scores = stepEvaluations.map(step => step.score);
  return {
    average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
    distribution: {
      excellent: scores.filter(s => s >= 4.0).length,
      good: scores.filter(s => s >= 3.0 && s < 4.0).length,
      needsWork: scores.filter(s => s < 3.0).length
    }
  };
}

function calculateFrameworkUsageAnalytics(stepEvaluations: any[]): any {
  const frameworkUsage: any = {};
  
  stepEvaluations.forEach(step => {
    step.frameworkUsage.forEach((fu: any) => {
      if (!frameworkUsage[fu.framework]) {
        frameworkUsage[fu.framework] = { used: 0, scores: [] };
      }
      frameworkUsage[fu.framework].used++;
      frameworkUsage[fu.framework].scores.push(fu.score);
    });
  });
  
  return Object.entries(frameworkUsage).map(([framework, data]: [string, any]) => ({
    framework,
    timesUsed: data.used,
    averageScore: data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length,
    proficiency: data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length
  }));
}

function calculateTimeManagementAnalysis(evaluation: any, progress: any): any {
  const totalTime = evaluation.timeSpent / 1000 / 60; // minutes
  const stepsCompleted = evaluation.stepEvaluations.length;
  const avgTimePerStep = totalTime / stepsCompleted;
  
  return {
    totalTime: Math.round(totalTime),
    averageTimePerStep: Math.round(avgTimePerStep),
    efficiency: avgTimePerStep <= 8 ? 'Efficient' : avgTimePerStep <= 12 ? 'Good' : 'Needs Improvement',
    recommendation: avgTimePerStep > 12 ? 'Practice time management and quick decision making' : 'Good time management'
  };
}

function calculateConsistencyAnalysis(stepEvaluations: any[]): any {
  const scores = stepEvaluations.map(step => step.score);
  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    consistency: stdDev < 0.5 ? 'Very Consistent' : stdDev < 1.0 ? 'Moderately Consistent' : 'Inconsistent',
    standardDeviation: Math.round(stdDev * 100) / 100,
    recommendation: stdDev > 1.0 ? 'Focus on consistent framework application' : 'Good consistency across steps'
  };
}

function calculateImprovementTrend(stepEvaluations: any[]): any {
  if (stepEvaluations.length < 2) return { trend: 'Insufficient data' };
  
  const firstHalf = stepEvaluations.slice(0, Math.floor(stepEvaluations.length / 2));
  const secondHalf = stepEvaluations.slice(Math.floor(stepEvaluations.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, step) => sum + step.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, step) => sum + step.score, 0) / secondHalf.length;
  
  const improvement = secondAvg - firstAvg;
  
  return {
    trend: improvement > 0.3 ? 'Strong Improvement' : 
           improvement > 0.1 ? 'Moderate Improvement' : 
           improvement > -0.1 ? 'Stable' : 'Declining',
    improvementValue: Math.round(improvement * 100) / 100,
    recommendation: improvement < 0 ? 'Focus on consistency and learning from feedback' : 'Good learning progression'
  };
}

function generateBenchmarkComparison(evaluation: any): any {
  // Simplified benchmark comparison
  const benchmarks = {
    beginner: 2.5,
    intermediate: 3.5,
    advanced: 4.2,
    expert: 4.7
  };
  
  let level = 'beginner';
  if (evaluation.overallScore >= benchmarks.expert) level = 'expert';
  else if (evaluation.overallScore >= benchmarks.advanced) level = 'advanced';
  else if (evaluation.overallScore >= benchmarks.intermediate) level = 'intermediate';
  
  return {
    currentLevel: level,
    scoreVsBenchmark: evaluation.overallScore - benchmarks[level as keyof typeof benchmarks],
    nextLevelTarget: level === 'expert' ? 'Maintain excellence' : 
                    `Reach ${benchmarks[Object.keys(benchmarks)[Object.keys(benchmarks).indexOf(level) + 1] as keyof typeof benchmarks]} for next level`,
    percentile: Math.round((evaluation.overallScore / 5) * 100)
  };
}

/**
 * Input schema for complete_case_study tool
 */
export const completeCaseStudySchema = {
  type: 'object',
  properties: {
    session_id: {
      type: 'string',
      description: 'Case study session ID to complete',
      minLength: 1
    },
    include_detailed_breakdown: {
      type: 'boolean',
      description: 'Include step-by-step performance breakdown (default: true)',
      default: true
    },
    include_recommendations: {
      type: 'boolean',
      description: 'Include personalized study and practice recommendations (default: true)',
      default: true
    },
    include_performance_analytics: {
      type: 'boolean',
      description: 'Include detailed performance analytics and benchmarking (default: false)',
      default: false
    }
  },
  required: ['session_id'],
  additionalProperties: false
} as const;

function generateSkillDevelopmentPlan(evaluation: any): any {
  return {
    prioritySkills: evaluation.improvements.slice(0, 3),
    developmentTimeline: '4-6 weeks',
    practiceRecommendations: [
      'Daily framework practice (15-20 minutes)',
      'Weekly case study completion',
      'Bi-weekly mock interviews'
    ],
    resourceAllocation: {
      frameworks: '40%',
      casePractice: '35%',
      industryKnowledge: '25%'
    }
  };
}

function generateReadinessAssessment(evaluation: any): any {
  const readinessScore = evaluation.overallScore;
  
  return {
    interviewReadiness: readinessScore >= 4.0 ? 'Ready' : 
                       readinessScore >= 3.5 ? 'Nearly Ready' : 
                       readinessScore >= 3.0 ? 'Needs Practice' : 'Not Ready',
    estimatedPrepTime: readinessScore >= 4.0 ? '1-2 weeks' : 
                      readinessScore >= 3.5 ? '2-4 weeks' : 
                      readinessScore >= 3.0 ? '4-8 weeks' : '8+ weeks',
    confidenceLevel: Math.round(evaluation.confidence * 100),
    recommendedNextSteps: readinessScore >= 4.0 ? 
      ['Schedule interviews', 'Practice company-specific cases'] :
      ['Continue case practice', 'Focus on weak areas', 'Build framework proficiency']
  };
}

/**
 * Tool description for MCP registration
 */
export const completeCaseStudyDescription = 
  'Completes a PM case study session and provides comprehensive evaluation with performance analytics, framework proficiency assessment, and personalized recommendations for continued improvement. Includes detailed step-by-step breakdown and benchmarking against industry standards.';