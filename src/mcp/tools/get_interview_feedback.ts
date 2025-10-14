/**
 * MCP Tool: get_interview_feedback
 * 
 * Retrieves comprehensive performance summaries and analytics for interview
 * preparation sessions with personalized recommendations.
 */

import { MCPToolResult, MCPToolContext } from '../../models/mcp';
import { InterviewPreparationCore } from '../../components/interview-preparation-core/index';
import { MCPResponseFormatter, MCPLogger, MCPErrorHandler } from '../../utils/mcp-error-handling';

export interface GetInterviewFeedbackArgs {
  session_id: string;
  include_detailed_analysis?: boolean;
  include_recommendations?: boolean;
  include_question_breakdown?: boolean;
}

/**
 * Get comprehensive interview preparation feedback and performance summary
 */
export async function getInterviewFeedback(
  args: GetInterviewFeedbackArgs,
  context: MCPToolContext
): Promise<MCPToolResult> {
  try {
    MCPLogger.debug('Getting interview feedback', context, {
      sessionId: args.session_id,
      includeDetailedAnalysis: args.include_detailed_analysis,
      includeRecommendations: args.include_recommendations,
      includeQuestionBreakdown: args.include_question_breakdown
    });

    // Initialize interview preparation core
    const interviewCore = new InterviewPreparationCore();

    // Get session summary
    const sessionSummary = interviewCore.getSessionSummary(args.session_id);
    if (!sessionSummary) {
      throw new Error(`Session ${args.session_id} not found`);
    }

    const { session, summary } = sessionSummary;

    MCPLogger.info('Interview feedback retrieved successfully', context, {
      sessionId: args.session_id,
      totalQuestions: summary.totalQuestions,
      averageScore: summary.averageScore,
      strongAreasCount: summary.strongAreas.length,
      improvementAreasCount: summary.improvementAreas.length
    });

    // Build comprehensive feedback response
    const response: any = {
      sessionOverview: {
        sessionId: session.sessionId,
        roleLevel: session.roleLevel,
        company: session.company,
        startTime: session.startTime,
        duration: Math.round((Date.now() - session.startTime.getTime()) / 1000 / 60), // minutes
        questionsCompleted: summary.totalQuestions,
        status: session.currentQuestion ? 'active' : 'completed'
      },
      performanceSummary: {
        overallScore: Math.round(summary.averageScore * 10) / 10,
        scoreInterpretation: getScoreInterpretation(summary.averageScore),
        strongAreas: summary.strongAreas,
        improvementAreas: summary.improvementAreas,
        categoryPerformance: session.overallProgress.categoryScores,
        frameworkProficiency: session.overallProgress.frameworkProficiency
      },
      keyInsights: {
        topStrengths: summary.strongAreas.slice(0, 3),
        primaryFocusAreas: summary.improvementAreas.slice(0, 3),
        frameworkGaps: Object.entries(session.overallProgress.frameworkProficiency)
          .filter(([_, score]) => score < 0.6)
          .map(([framework, _]) => framework)
          .slice(0, 3),
        readinessLevel: getReadinessLevel(summary.averageScore, summary.totalQuestions)
      },
      nextSteps: summary.nextSteps
    };

    // Add detailed analysis if requested
    if (args.include_detailed_analysis) {
      response.detailedAnalysis = {
        categoryBreakdown: Object.entries(session.overallProgress.categoryScores).map(([category, score]) => ({
          category,
          score: Math.round(score * 10) / 10,
          performance: getPerformanceLevel(score),
          questionsAnswered: session.responses.filter(r => {
            const question = interviewCore.getQuestionBankStats(); // This would need to be enhanced
            return true; // Simplified for now
          }).length
        })),
        frameworkAnalysis: Object.entries(session.overallProgress.frameworkProficiency).map(([framework, score]) => ({
          framework,
          proficiency: Math.round(score * 100),
          level: getFrameworkLevel(score),
          recommendation: score < 0.6 ? 
            `Study ${framework} framework structure and practice application` :
            score < 0.8 ?
            `Continue practicing ${framework} with more complex scenarios` :
            `Excellent ${framework} proficiency - help others or tackle advanced cases`
        })),
        progressTrend: {
          improvement: calculateImprovementTrend(session.responses),
          consistency: calculateConsistency(session.responses),
          timeManagement: calculateTimeManagement(session)
        }
      };
    }

    // Add personalized recommendations if requested
    if (args.include_recommendations) {
      response.personalizedRecommendations = {
        immediateActions: generateImmediateActions(session, summary),
        studyPlan: generateStudyPlan(session.overallProgress),
        practiceQuestions: generatePracticeRecommendations(session),
        resourceSuggestions: generateResourceSuggestions(summary.improvementAreas),
        companySpecificTips: session.company ? 
          generateCompanySpecificTips(session.company, session.overallProgress) : 
          null
      };
    }

    // Add question-by-question breakdown if requested
    if (args.include_question_breakdown) {
      response.questionBreakdown = session.responses.map((response, index) => ({
        questionNumber: index + 1,
        questionId: response.questionId,
        category: 'Unknown', // Would need to fetch from question bank
        score: response.evaluation.overallScore,
        timeSpent: 'Unknown', // Would need time tracking
        keyStrengths: response.evaluation.strengths.slice(0, 2),
        keyImprovements: response.evaluation.improvements.slice(0, 2),
        frameworksUsed: response.evaluation.frameworkAnalysis
          .filter(fa => fa.usage === 'good' || fa.usage === 'excellent')
          .map(fa => fa.framework),
        frameworksMissed: response.evaluation.frameworkAnalysis
          .filter(fa => fa.usage === 'missing' || fa.usage === 'partial')
          .map(fa => fa.framework)
      }));
    }

    return MCPResponseFormatter.formatSuccess(response, 'json', {
      executionTime: Date.now() - context.timestamp,
      quotaUsed: 1,
      feedbackGenerated: true,
      sessionAnalyzed: true,
      questionsAnalyzed: summary.totalQuestions,
      nextAction: 'Review feedback and continue practice or start new session'
    });

  } catch (error) {
    MCPLogger.error('get_interview_feedback tool failed', error as Error, context, {
      sessionId: args.session_id
    });

    return MCPErrorHandler.createErrorResponse(
      error instanceof Error ? error : new Error('Unknown error in get_interview_feedback'),
      context
    );
  }
}

// Helper functions for feedback analysis
function getScoreInterpretation(score: number): string {
  if (score >= 4.5) return 'Excellent - Interview ready';
  if (score >= 4.0) return 'Good - Minor polish needed';
  if (score >= 3.5) return 'Above Average - Some improvement needed';
  if (score >= 3.0) return 'Average - Moderate preparation required';
  if (score >= 2.5) return 'Below Average - Significant practice needed';
  return 'Needs Improvement - Extensive preparation required';
}

function getReadinessLevel(score: number, questionsCompleted: number): string {
  const baseReadiness = score >= 4.0 ? 'Ready' : score >= 3.5 ? 'Nearly Ready' : 'Needs Practice';
  const experienceBonus = questionsCompleted >= 10 ? ' (Experienced)' : questionsCompleted >= 5 ? ' (Practiced)' : ' (Beginner)';
  return baseReadiness + experienceBonus;
}

function getPerformanceLevel(score: number): string {
  if (score >= 4.0) return 'Strong';
  if (score >= 3.0) return 'Adequate';
  if (score >= 2.0) return 'Developing';
  return 'Needs Focus';
}

function getFrameworkLevel(score: number): string {
  if (score >= 0.8) return 'Advanced';
  if (score >= 0.6) return 'Proficient';
  if (score >= 0.4) return 'Developing';
  return 'Beginner';
}

function calculateImprovementTrend(responses: any[]): string {
  if (responses.length < 2) return 'Insufficient data';
  
  const firstHalf = responses.slice(0, Math.floor(responses.length / 2));
  const secondHalf = responses.slice(Math.floor(responses.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, r) => sum + r.evaluation.overallScore, 0) / secondHalf.length;
  
  const improvement = secondAvg - firstAvg;
  
  if (improvement > 0.5) return 'Strong improvement';
  if (improvement > 0.2) return 'Moderate improvement';
  if (improvement > -0.2) return 'Stable performance';
  return 'Declining performance';
}

function calculateConsistency(responses: any[]): string {
  if (responses.length < 2) return 'Insufficient data';
  
  const scores = responses.map(r => r.evaluation.overallScore);
  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev < 0.5) return 'Very consistent';
  if (stdDev < 1.0) return 'Moderately consistent';
  return 'Inconsistent performance';
}

function calculateTimeManagement(session: any): string {
  // Simplified time management assessment
  const duration = Date.now() - session.startTime.getTime();
  const questionsCompleted = session.responses.length;
  const avgTimePerQuestion = duration / questionsCompleted / 1000 / 60; // minutes
  
  if (avgTimePerQuestion < 3) return 'Very efficient';
  if (avgTimePerQuestion < 5) return 'Good pacing';
  if (avgTimePerQuestion < 8) return 'Adequate timing';
  return 'Needs to improve speed';
}

function generateImmediateActions(session: any, summary: any): string[] {
  const actions: string[] = [];
  
  if (summary.averageScore < 3.0) {
    actions.push('Review fundamental PM frameworks (STAR, CIRCLES, RICE)');
    actions.push('Practice structuring responses with clear frameworks');
  }
  
  if (summary.improvementAreas.length > 0) {
    actions.push(`Focus practice on: ${summary.improvementAreas.slice(0, 2).join(', ')}`);
  }
  
  actions.push('Prepare 3-5 specific examples with quantifiable results');
  actions.push('Practice mock interviews with peers or mentors');
  
  return actions;
}

function generateStudyPlan(progress: any): any {
  return {
    week1: 'Framework mastery and example preparation',
    week2: 'Category-specific practice and mock interviews',
    week3: 'Company-specific preparation and final polish',
    dailyPractice: '30 minutes of structured question practice',
    weeklyGoals: 'Complete 10-15 practice questions with feedback'
  };
}

function generatePracticeRecommendations(session: any): string[] {
  const recommendations: string[] = [];
  
  // Based on weak categories
  Object.entries(session.overallProgress.categoryScores).forEach(([category, score]: [string, any]) => {
    if (score < 3.0) {
      recommendations.push(`Practice more ${category} questions`);
    }
  });
  
  // Based on weak frameworks
  Object.entries(session.overallProgress.frameworkProficiency).forEach(([framework, score]: [string, any]) => {
    if (score < 0.6) {
      recommendations.push(`Study and practice ${framework} framework`);
    }
  });
  
  return recommendations;
}

function generateResourceSuggestions(improvementAreas: string[]): any {
  const resources: any = {
    general: [
      'Cracking the PM Interview book',
      'Decode and Conquer PM interview guide',
      'PM interview preparation courses'
    ]
  };
  
  improvementAreas.forEach(area => {
    switch (area) {
      case 'behavioral':
        resources.behavioral = ['STAR method guide', 'Leadership stories preparation'];
        break;
      case 'product_sense':
        resources.product_sense = ['Product design frameworks', 'User research methods'];
        break;
      case 'analytical':
        resources.analytical = ['Metrics and KPIs guide', 'Data analysis frameworks'];
        break;
      case 'technical':
        resources.technical = ['Technical PM resources', 'System design basics'];
        break;
    }
  });
  
  return resources;
}

function generateCompanySpecificTips(company: string, progress: any): string[] {
  const tips: string[] = [];
  
  switch (company.toLowerCase()) {
    case 'google':
      tips.push('Focus on user-centric solutions and data-driven decisions');
      tips.push('Demonstrate technical depth and innovation mindset');
      tips.push('Practice Googleyness behavioral questions');
      break;
    case 'amazon':
      tips.push('Master all 14 Leadership Principles with specific examples');
      tips.push('Practice Working Backwards methodology');
      tips.push('Focus on customer obsession in all responses');
      break;
    case 'meta':
      tips.push('Emphasize growth mindset and user engagement');
      tips.push('Practice social product design questions');
      tips.push('Focus on global scale and community building');
      break;
    default:
      tips.push('Research company values and recent product launches');
      tips.push('Practice company-specific case studies');
  }
  
  return tips;
}

/**
 * Input schema for get_interview_feedback tool
 */
export const getInterviewFeedbackSchema = {
  type: 'object',
  properties: {
    session_id: {
      type: 'string',
      description: 'Session ID to get feedback for',
      minLength: 1
    },
    include_detailed_analysis: {
      type: 'boolean',
      description: 'Include detailed category and framework analysis (default: true)',
      default: true
    },
    include_recommendations: {
      type: 'boolean',
      description: 'Include personalized study recommendations (default: true)',
      default: true
    },
    include_question_breakdown: {
      type: 'boolean',
      description: 'Include question-by-question performance breakdown (default: false)',
      default: false
    }
  },
  required: ['session_id'],
  additionalProperties: false
} as const;

/**
 * Tool description for MCP registration
 */
export const getInterviewFeedbackDescription = 
  'Retrieves comprehensive performance summaries and analytics for PM interview preparation sessions. Provides detailed analysis of strengths, improvement areas, framework proficiency, and personalized recommendations for continued practice.';