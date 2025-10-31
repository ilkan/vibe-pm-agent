/**
 * Enhanced Case Study Coaching Agent with AWS Bedrock Integration
 * 
 * Extends the existing Case Study Coaching Agent (PDZPQTNLYH) with Nemotron-powered
 * case study analysis, strategic scenario coaching, and business problem-solving
 * guidance with advanced reasoning and intelligent assessment capabilities.
 * 
 * Requirements: 2.1, 2.2, 3.1
 */

import { NIMServiceManager, ChatCompletionRequest, EmbeddingRequest } from '../../interfaces/nvidia-nim-core';
import { createNIMServiceManager } from '../nim-service-manager';
import { NIMErrorHandler } from '../../utils/nvidia-nim-error-handling';

// ============================================================================
// Enhanced Case Study Coaching Agent Interfaces
// ============================================================================

export interface InterviewQuestion {
  id: string;
  type: 'behavioral' | 'technical' | 'case_study' | 'situational' | 'leadership';
  difficulty: 'junior' | 'mid' | 'senior' | 'executive';
  question: string;
  context?: string;
  expectedAnswerFramework: string[];
  evaluationCriteria: EvaluationCriterion[];
  followUpQuestions: string[];
  nimGenerated: boolean;
  industryFocus?: string;
  skillsAssessed: string[];
}

export interface EvaluationCriterion {
  criterion: string;
  weight: number;
  description: string;
  scoringRubric: ScoringLevel[];
}

export interface ScoringLevel {
  level: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor';
  score: number;
  description: string;
  indicators: string[];
}

export interface InterviewResponse {
  questionId: string;
  candidateAnswer: string;
  timestamp: string;
  audioTranscript?: string;
  nonVerbalCues?: NonVerbalCue[];
}

export interface NonVerbalCue {
  type: 'eye_contact' | 'posture' | 'gestures' | 'voice_tone' | 'confidence';
  assessment: string;
  impact: 'positive' | 'neutral' | 'negative';
}

export interface InterviewEvaluation {
  questionId: string;
  response: InterviewResponse;
  scores: CriterionScore[];
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  detailedFeedback: string;
  nimEnhanced: boolean;
  confidenceLevel: number;
  recommendations: string[];
}

export interface CriterionScore {
  criterion: string;
  score: number;
  level: string;
  feedback: string;
  evidence: string[];
}

export interface CaseStudyAnalysis {
  caseId: string;
  title: string;
  scenario: string;
  industry: string;
  complexity: 'low' | 'medium' | 'high';
  keyIssues: string[];
  analysisFramework: string[];
  expectedApproach: string[];
  evaluationDimensions: string[];
  nimEnhanced: boolean;
}

export interface CaseStudyResponse {
  caseId: string;
  candidateAnalysis: string;
  approach: string;
  recommendations: string[];
  reasoning: string;
  timeSpent: number;
}

export interface CaseStudyEvaluation {
  caseId: string;
  response: CaseStudyResponse;
  analyticalRigor: number;
  structuredThinking: number;
  businessAcumen: number;
  communicationClarity: number;
  creativeSolution: number;
  overallScore: number;
  detailedFeedback: string;
  nimInsights: string[];
  improvementAreas: string[];
}

export interface InterviewSession {
  sessionId: string;
  candidateId: string;
  position: string;
  level: string;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  evaluations: InterviewEvaluation[];
  caseStudies?: CaseStudyAnalysis[];
  caseStudyEvaluations?: CaseStudyEvaluation[];
  overallAssessment: OverallAssessment;
  sessionMetrics: SessionMetrics;
}

export interface OverallAssessment {
  overallScore: number;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  keyStrengths: string[];
  developmentAreas: string[];
  culturalFit: number;
  technicalCompetency: number;
  leadershipPotential: number;
  summary: string;
  nimEnhanced: boolean;
}

export interface SessionMetrics {
  totalQuestions: number;
  averageResponseTime: number;
  confidenceLevel: number;
  engagementScore: number;
  communicationEffectiveness: number;
}

export interface INIMEnhancedInterviewCoachingAgent {
  // NIM-powered question generation
  generateInterviewQuestionsWithNIM(
    position: string,
    level: string,
    industry?: string,
    focusAreas?: string[]
  ): Promise<InterviewQuestion[]>;

  // Advanced response evaluation
  evaluateResponseWithNIM(
    question: InterviewQuestion,
    response: InterviewResponse
  ): Promise<InterviewEvaluation>;

  // Case study generation and analysis
  generateCaseStudyWithNIM(
    industry: string,
    complexity: string,
    focusAreas: string[]
  ): Promise<CaseStudyAnalysis>;

  evaluateCaseStudyResponseWithNIM(
    caseStudy: CaseStudyAnalysis,
    response: CaseStudyResponse
  ): Promise<CaseStudyEvaluation>;

  // Comprehensive session assessment
  generateOverallAssessmentWithNIM(
    session: InterviewSession
  ): Promise<OverallAssessment>;

  // Feedback and coaching
  generatePersonalizedFeedbackWithNIM(
    evaluations: InterviewEvaluation[],
    targetRole: string
  ): Promise<string>;

  generateImprovementPlanWithNIM(
    assessment: OverallAssessment,
    targetRole: string
  ): Promise<any>;
}

// NIM-Enhanced Case Study Coaching Agent Implementation

export class NIMEnhancedCaseStudyCoachingAgent implements INIMEnhancedInterviewCoachingAgent {
  private nimService: NIMServiceManager;
  private questionCache: Map<string, InterviewQuestion[]> = new Map();
  private evaluationCache: Map<string, InterviewEvaluation> = new Map();
  private caseStudyCache: Map<string, CaseStudyAnalysis> = new Map();

  constructor(nimConfig?: any) {
    this.nimService = createNIMServiceManager(nimConfig);
    console.log('NIM-Enhanced Case Study Coaching Agent initialized');
  }

  // ============================================================================
  // NIM-Powered Question Generation
  // ============================================================================

  /**
   * Generate interview questions with NIM-powered intelligence
   * Requirements: 2.1, 2.2, 3.1
   */
  async generateInterviewQuestionsWithNIM(
    position: string,
    level: string,
    industry?: string,
    focusAreas?: string[]
  ): Promise<InterviewQuestion[]> {
    try {
      const cacheKey = `${position}-${level}-${industry}-${focusAreas?.join(',')}`;
      
      if (this.questionCache.has(cacheKey)) {
        return this.questionCache.get(cacheKey)!;
      }

      const questionPrompt = this.buildQuestionGenerationPrompt(position, level, industry, focusAreas);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are a senior talent acquisition specialist and interview expert with deep knowledge of behavioral interviewing, technical assessment, and leadership evaluation. Generate high-quality, role-specific interview questions.'
          },
          {
            role: 'user',
            content: questionPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2500
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      const questions = this.parseGeneratedQuestions(response.choices[0].message.content, position, level, industry);
      
      this.questionCache.set(cacheKey, questions);
      return questions;
    } catch (error) {
      console.error('NIM question generation failed:', error);
      
      // Return fallback questions
      return this.generateFallbackQuestions(position, level, industry);
    }
  }

  /**
   * Evaluate interview response with NIM-powered analysis
   */
  async evaluateResponseWithNIM(
    question: InterviewQuestion,
    response: InterviewResponse
  ): Promise<InterviewEvaluation> {
    try {
      const evaluationPrompt = this.buildEvaluationPrompt(question, response);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview evaluator with deep experience in candidate assessment, behavioral analysis, and competency evaluation. Provide detailed, fair, and constructive evaluation of interview responses.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      };

      const response_nim = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseEvaluationResponse(response_nim.choices[0].message.content, question, response);
    } catch (error) {
      console.error('NIM response evaluation failed:', error);
      
      // Return fallback evaluation
      return this.generateFallbackEvaluation(question, response);
    }
  }

  // ============================================================================
  // Case Study Generation and Analysis
  // ============================================================================

  /**
   * Generate case study with NIM-powered scenario creation
   */
  async generateCaseStudyWithNIM(
    industry: string,
    complexity: string,
    focusAreas: string[]
  ): Promise<CaseStudyAnalysis> {
    try {
      const caseStudyPrompt = this.buildCaseStudyGenerationPrompt(industry, complexity, focusAreas);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: `You are a business case study expert with deep knowledge of ${industry} industry challenges, strategic thinking, and problem-solving frameworks. Create realistic, engaging case studies that test analytical and strategic thinking.`
          },
          {
            role: 'user',
            content: caseStudyPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseCaseStudyResponse(response.choices[0].message.content, industry, complexity);
    } catch (error) {
      console.error('NIM case study generation failed:', error);
      
      // Return fallback case study
      return this.generateFallbackCaseStudy(industry, complexity, focusAreas);
    }
  }

  /**
   * Evaluate case study response with NIM analysis
   */
  async evaluateCaseStudyResponseWithNIM(
    caseStudy: CaseStudyAnalysis,
    response: CaseStudyResponse
  ): Promise<CaseStudyEvaluation> {
    try {
      const evaluationPrompt = this.buildCaseStudyEvaluationPrompt(caseStudy, response);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are a senior business consultant and case study evaluator. Assess analytical thinking, business acumen, structured problem-solving, and communication clarity with detailed feedback.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      };

      const nim_response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseCaseStudyEvaluation(nim_response.choices[0].message.content, caseStudy, response);
    } catch (error) {
      console.error('NIM case study evaluation failed:', error);
      
      // Return fallback evaluation
      return this.generateFallbackCaseStudyEvaluation(caseStudy, response);
    }
  }

  // ============================================================================
  // Comprehensive Session Assessment
  // ============================================================================

  /**
   * Generate overall assessment with NIM-powered holistic analysis
   */
  async generateOverallAssessmentWithNIM(
    session: InterviewSession
  ): Promise<OverallAssessment> {
    try {
      const assessmentPrompt = this.buildOverallAssessmentPrompt(session);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are a senior hiring manager with extensive experience in candidate evaluation, talent assessment, and hiring decisions. Provide comprehensive, fair, and actionable overall assessments.'
          },
          {
            role: 'user',
            content: assessmentPrompt
          }
        ],
        temperature: 0.25,
        max_tokens: 1200
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseOverallAssessment(response.choices[0].message.content, session);
    } catch (error) {
      console.error('NIM overall assessment failed:', error);
      
      // Return fallback assessment
      return this.generateFallbackOverallAssessment(session);
    }
  }

  // ============================================================================
  // Feedback and Coaching
  // ============================================================================

  /**
   * Generate personalized feedback with NIM insights
   */
  async generatePersonalizedFeedbackWithNIM(
    evaluations: InterviewEvaluation[],
    targetRole: string
  ): Promise<string> {
    try {
      const feedbackPrompt = this.buildPersonalizedFeedbackPrompt(evaluations, targetRole);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are an executive coach and career development specialist. Provide constructive, actionable, and encouraging feedback that helps candidates improve their interview performance and career development.'
          },
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parsePersonalizedFeedback(response.choices[0].message.content);
    } catch (error) {
      console.error('NIM personalized feedback generation failed:', error);
      
      return 'Feedback generation failed. Please review your interview performance manually and focus on clear communication, specific examples, and structured responses.';
    }
  }

  /**
   * Generate improvement plan with NIM recommendations
   */
  async generateImprovementPlanWithNIM(
    assessment: OverallAssessment,
    targetRole: string
  ): Promise<any> {
    try {
      const improvementPrompt = this.buildImprovementPlanPrompt(assessment, targetRole);

      const chatRequest: ChatCompletionRequest = {
        model: 'nvidia-llama-3_1-nemotron-nano-8b-v1',
        messages: [
          {
            role: 'system',
            content: 'You are a career development coach specializing in interview preparation and professional skill development. Create actionable improvement plans with specific steps, resources, and timelines.'
          },
          {
            role: 'user',
            content: improvementPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      };

      const response = await this.nimService.generateChatCompletion(chatRequest);
      
      return this.parseImprovementPlan(response.choices[0].message.content);
    } catch (error) {
      console.error('NIM improvement plan generation failed:', error);
      
      return {
        developmentAreas: assessment.developmentAreas,
        recommendations: ['Focus on structured responses', 'Practice behavioral examples', 'Improve technical knowledge'],
        timeline: '4-6 weeks',
        resources: ['Interview preparation books', 'Online courses', 'Practice sessions']
      };
    }
  }

  // Prompt Builders

  private buildQuestionGenerationPrompt(
    position: string,
    level: string,
    industry?: string,
    focusAreas?: string[]
  ): string {
    return `
# Interview Question Generation Request

Generate high-quality interview questions for the following role:

## Role Details
- **Position**: ${position}
- **Level**: ${level}
- **Industry**: ${industry || 'General'}
- **Focus Areas**: ${focusAreas?.join(', ') || 'General competencies'}

## Question Requirements

Generate 8-10 interview questions covering:

1. **Behavioral Questions** (3-4 questions)
   - Past experience and decision-making
   - Leadership and teamwork scenarios
   - Problem-solving and conflict resolution

2. **Technical/Functional Questions** (2-3 questions)
   - Role-specific technical knowledge
   - Industry expertise and trends
   - Practical application scenarios

3. **Situational Questions** (2-3 questions)
   - Hypothetical scenarios relevant to the role
   - Decision-making under pressure
   - Strategic thinking and planning

4. **Leadership/Culture Questions** (1-2 questions)
   - Leadership philosophy and style
   - Cultural fit and values alignment
   - Vision and strategic thinking

## Output Format

For each question, provide:
- **Question Type**: (behavioral/technical/situational/leadership)
- **Difficulty**: (junior/mid/senior/executive)
- **Question**: The actual interview question
- **Context**: Brief setup or background (if needed)
- **Expected Framework**: Key elements of a strong answer
- **Evaluation Criteria**: What to assess in the response
- **Follow-up Questions**: 2-3 potential follow-up questions
- **Skills Assessed**: Key competencies being evaluated

Focus on questions that are:
- Role-specific and relevant to ${position}
- Appropriate for ${level} level
- Industry-relevant for ${industry || 'general business'}
- Designed to elicit specific examples and detailed responses
`;
  }

  private buildEvaluationPrompt(question: InterviewQuestion, response: InterviewResponse): string {
    return `
# Interview Response Evaluation

Evaluate the following interview response with detailed analysis:

## Question Details
- **Type**: ${question.type}
- **Difficulty**: ${question.difficulty}
- **Question**: ${question.question}
- **Context**: ${question.context || 'None provided'}

## Expected Answer Framework
${question.expectedAnswerFramework.map((item, i) => `${i + 1}. ${item}`).join('\n')}

## Evaluation Criteria
${question.evaluationCriteria.map(criterion => `- **${criterion.criterion}** (${criterion.weight}%): ${criterion.description}`).join('\n')}

## Candidate Response
**Answer**: ${response.candidateAnswer}
**Response Time**: ${new Date(response.timestamp).toLocaleTimeString()}

## Evaluation Requirements

Provide comprehensive evaluation covering:

1. **Criterion-by-Criterion Assessment**
   - Score each evaluation criterion (0-100)
   - Provide specific feedback for each criterion
   - Identify evidence supporting the score

2. **Overall Performance Analysis**
   - Calculate weighted overall score
   - Identify key strengths demonstrated
   - Highlight areas needing improvement

3. **Detailed Feedback**
   - Specific examples from the response
   - Constructive improvement suggestions
   - Recognition of positive elements

4. **Recommendations**
   - Specific actions for improvement
   - Additional questions to explore
   - Development suggestions

## Output Format

Provide structured evaluation with:
- Criterion scores and feedback
- Overall score (0-100)
- Strengths and improvement areas
- Detailed constructive feedback
- Confidence level in assessment (0-100)
- Specific recommendations

Focus on fair, constructive, and actionable evaluation.
`;
  }

  private buildCaseStudyGenerationPrompt(
    industry: string,
    complexity: string,
    focusAreas: string[]
  ): string {
    return `
# Business Case Study Generation

Create a realistic business case study for interview assessment:

## Case Study Requirements
- **Industry**: ${industry}
- **Complexity**: ${complexity}
- **Focus Areas**: ${focusAreas.join(', ')}

## Case Study Components

Generate a comprehensive case study including:

1. **Scenario Setup**
   - Company background and context
   - Industry situation and market dynamics
   - Key stakeholders and their interests
   - Timeline and urgency factors

2. **Business Challenge**
   - Primary problem or opportunity
   - Contributing factors and root causes
   - Constraints and limitations
   - Success criteria and objectives

3. **Available Information**
   - Market data and trends
   - Financial information
   - Competitive landscape
   - Internal capabilities and resources

4. **Analysis Framework**
   - Recommended analytical approaches
   - Key questions to explore
   - Frameworks to consider (SWOT, Porter's Five Forces, etc.)
   - Decision criteria and trade-offs

5. **Expected Approach**
   - Structured problem-solving methodology
   - Key analysis areas to cover
   - Stakeholder considerations
   - Implementation factors

## Evaluation Dimensions

Define how responses should be assessed:
- **Analytical Rigor**: Depth and quality of analysis
- **Structured Thinking**: Logical flow and organization
- **Business Acumen**: Commercial understanding and insights
- **Communication Clarity**: Clear presentation of ideas
- **Creative Solutions**: Innovative thinking and alternatives

## Output Requirements

Create a case study that:
- Is realistic and relevant to ${industry}
- Matches ${complexity} complexity level
- Tests ${focusAreas.join(', ')} competencies
- Can be analyzed in 20-30 minutes
- Has multiple valid solution approaches
- Allows for differentiation between candidates

Provide clear scenario, key issues, analysis framework, and evaluation criteria.
`;
  }

  private buildCaseStudyEvaluationPrompt(
    caseStudy: CaseStudyAnalysis,
    response: CaseStudyResponse
  ): string {
    return `
# Case Study Response Evaluation

Evaluate the candidate's case study analysis:

## Case Study Details
- **Title**: ${caseStudy.title}
- **Industry**: ${caseStudy.industry}
- **Complexity**: ${caseStudy.complexity}
- **Key Issues**: ${caseStudy.keyIssues.join(', ')}

## Expected Approach
${caseStudy.expectedApproach.map((item, i) => `${i + 1}. ${item}`).join('\n')}

## Candidate Response
- **Analysis**: ${response.candidateAnalysis}
- **Approach**: ${response.approach}
- **Recommendations**: ${response.recommendations.join('; ')}
- **Reasoning**: ${response.reasoning}
- **Time Spent**: ${response.timeSpent} minutes

## Evaluation Dimensions

Assess the response across these dimensions (0-100 scale):

1. **Analytical Rigor** (25%)
   - Depth of analysis and insight
   - Use of frameworks and structured thinking
   - Quality of data interpretation

2. **Structured Thinking** (20%)
   - Logical flow and organization
   - Clear problem definition
   - Systematic approach to solution

3. **Business Acumen** (25%)
   - Commercial understanding
   - Market and industry insights
   - Stakeholder considerations

4. **Communication Clarity** (15%)
   - Clear presentation of ideas
   - Effective use of examples
   - Professional communication style

5. **Creative Solutions** (15%)
   - Innovative thinking and alternatives
   - Out-of-the-box approaches
   - Practical implementation ideas

## Required Output

Provide comprehensive evaluation including:
- Score for each dimension (0-100)
- Overall weighted score
- Detailed feedback for each dimension
- Key strengths demonstrated
- Areas for improvement
- Specific NIM insights and observations
- Recommendations for development

Focus on constructive, specific, and actionable feedback.
`;
  }

  private buildOverallAssessmentPrompt(session: InterviewSession): string {
    return `
# Overall Interview Assessment

Provide comprehensive assessment of the candidate's interview performance:

## Session Overview
- **Position**: ${session.position}
- **Level**: ${session.level}
- **Total Questions**: ${session.questions.length}
- **Questions Answered**: ${session.responses.length}

## Individual Question Performance
${session.evaluations.map((eval, i) => `
**Question ${i + 1}** (${session.questions[i]?.type}):
- Score: ${eval.overallScore}/100
- Strengths: ${eval.strengths.join(', ')}
- Improvements: ${eval.areasForImprovement.join(', ')}
`).join('\n')}

## Case Study Performance
${session.caseStudyEvaluations?.map((eval, i) => `
**Case Study ${i + 1}**:
- Overall Score: ${eval.overallScore}/100
- Analytical Rigor: ${eval.analyticalRigor}/100
- Business Acumen: ${eval.businessAcumen}/100
`).join('\n') || 'No case studies completed'}

## Assessment Requirements

Provide holistic assessment covering:

1. **Overall Performance Score** (0-100)
   - Weighted average across all evaluations
   - Consider question difficulty and importance
   - Account for consistency across responses

2. **Hiring Recommendation**
   - Strong Hire (90-100): Exceptional candidate
   - Hire (70-89): Good candidate, meets requirements
   - No Hire (50-69): Does not meet requirements
   - Strong No Hire (0-49): Significant concerns

3. **Key Competency Assessment** (0-100 each)
   - Technical Competency: Role-specific skills and knowledge
   - Cultural Fit: Alignment with values and culture
   - Leadership Potential: Leadership and growth capability

4. **Comprehensive Summary**
   - Overall strengths and unique value
   - Key development areas and concerns
   - Specific examples supporting assessment
   - Recommendations for role fit

## Output Format

Provide structured assessment with:
- Overall score and recommendation
- Competency scores with rationale
- Key strengths (3-5 items)
- Development areas (3-5 items)
- Detailed summary paragraph
- Confidence level in assessment

Focus on fair, comprehensive, and actionable assessment for hiring decisions.
`;
  }

  private buildPersonalizedFeedbackPrompt(
    evaluations: InterviewEvaluation[],
    targetRole: string
  ): string {
    return `
# Personalized Interview Feedback

Generate constructive, personalized feedback for interview improvement:

## Interview Performance Summary
${evaluations.map((eval, i) => `
**Question ${i + 1}**:
- Score: ${eval.overallScore}/100
- Strengths: ${eval.strengths.join(', ')}
- Areas for Improvement: ${eval.areasForImprovement.join(', ')}
- Key Feedback: ${eval.detailedFeedback}
`).join('\n')}

## Target Role
**Position**: ${targetRole}

## Feedback Requirements

Create personalized feedback that:

1. **Acknowledges Strengths**
   - Recognize positive performance areas
   - Highlight unique capabilities demonstrated
   - Build confidence and motivation

2. **Identifies Development Opportunities**
   - Specific areas for improvement
   - Common patterns across responses
   - Skills gaps relative to target role

3. **Provides Actionable Recommendations**
   - Specific steps for improvement
   - Practice suggestions and techniques
   - Resources for skill development

4. **Maintains Encouraging Tone**
   - Constructive and supportive language
   - Focus on growth and development
   - Motivational and forward-looking

## Output Format

Structure feedback as:
- Opening acknowledgment of effort and strengths
- Specific performance highlights with examples
- Development areas with improvement strategies
- Actionable next steps and recommendations
- Encouraging closing with growth mindset focus

Keep feedback specific, actionable, and encouraging while being honest about areas needing improvement.
`;
  }

  private buildImprovementPlanPrompt(assessment: OverallAssessment, targetRole: string): string {
    return `
# Interview Improvement Plan

Create a comprehensive improvement plan based on assessment results:

## Assessment Summary
- **Overall Score**: ${assessment.overallScore}/100
- **Recommendation**: ${assessment.recommendation}
- **Key Strengths**: ${assessment.keyStrengths.join(', ')}
- **Development Areas**: ${assessment.developmentAreas.join(', ')}
- **Target Role**: ${targetRole}

## Competency Scores
- **Technical Competency**: ${assessment.technicalCompetency}/100
- **Cultural Fit**: ${assessment.culturalFit}/100
- **Leadership Potential**: ${assessment.leadershipPotential}/100

## Improvement Plan Requirements

Create a structured development plan including:

1. **Priority Development Areas** (Top 3-4)
   - Specific skills or competencies to improve
   - Current level vs. required level for target role
   - Impact on overall interview performance

2. **Actionable Development Steps**
   - Specific actions and activities
   - Practice exercises and techniques
   - Skill-building approaches

3. **Resources and Tools**
   - Books, courses, and learning materials
   - Practice platforms and tools
   - Coaching or mentoring opportunities

4. **Timeline and Milestones**
   - Short-term goals (2-4 weeks)
   - Medium-term objectives (1-3 months)
   - Long-term development targets (3-6 months)

5. **Progress Measurement**
   - Success metrics and indicators
   - Self-assessment techniques
   - Practice interview checkpoints

## Output Format

Provide structured improvement plan with:
- Priority areas ranked by importance
- Specific development actions for each area
- Recommended resources and tools
- Timeline with milestones
- Progress tracking methods

Focus on practical, achievable improvements that directly impact interview performance for the target role.
`;
  }

  // Parsing and Utility Methods

  private parseGeneratedQuestions(
    content: string,
    position: string,
    level: string,
    industry?: string
  ): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    const sections = content.split(/(?=\*\*Question|\d+\.|Question)/i);

    for (let i = 1; i < sections.length && questions.length < 10; i++) {
      const section = sections[i];
      
      const question: InterviewQuestion = {
        id: `q-${Date.now()}-${i}`,
        type: this.extractQuestionType(section),
        difficulty: level as any,
        question: this.extractQuestionText(section),
        context: this.extractContext(section),
        expectedAnswerFramework: this.extractFramework(section),
        evaluationCriteria: this.extractEvaluationCriteria(section),
        followUpQuestions: this.extractFollowUpQuestions(section),
        nimGenerated: true,
        industryFocus: industry,
        skillsAssessed: this.extractSkillsAssessed(section)
      };

      if (question.question && question.question.length > 10) {
        questions.push(question);
      }
    }

    // Ensure we have at least some questions
    if (questions.length === 0) {
      return this.generateFallbackQuestions(position, level, industry);
    }

    return questions;
  }

  private parseEvaluationResponse(
    content: string,
    question: InterviewQuestion,
    response: InterviewResponse
  ): InterviewEvaluation {
    const scores = this.extractCriterionScores(content, question.evaluationCriteria);
    const overallScore = this.calculateOverallScore(scores);
    
    return {
      questionId: question.id,
      response,
      scores,
      overallScore,
      strengths: this.extractStrengths(content),
      areasForImprovement: this.extractImprovementAreas(content),
      detailedFeedback: this.extractDetailedFeedback(content),
      nimEnhanced: true,
      confidenceLevel: this.extractConfidenceLevel(content),
      recommendations: this.extractRecommendations(content)
    };
  }

  private parseCaseStudyResponse(
    content: string,
    industry: string,
    complexity: string
  ): CaseStudyAnalysis {
    return {
      caseId: `case-${Date.now()}`,
      title: this.extractCaseTitle(content) || `${industry} Business Challenge`,
      scenario: this.extractScenario(content) || 'Business scenario analysis required',
      industry,
      complexity: complexity as any,
      keyIssues: this.extractKeyIssues(content),
      analysisFramework: this.extractAnalysisFramework(content),
      expectedApproach: this.extractExpectedApproach(content),
      evaluationDimensions: ['Analytical Rigor', 'Structured Thinking', 'Business Acumen', 'Communication Clarity', 'Creative Solutions'],
      nimEnhanced: true
    };
  }

  private parseCaseStudyEvaluation(
    content: string,
    caseStudy: CaseStudyAnalysis,
    response: CaseStudyResponse
  ): CaseStudyEvaluation {
    return {
      caseId: caseStudy.caseId,
      response,
      analyticalRigor: this.extractScore(content, 'Analytical Rigor') || 70,
      structuredThinking: this.extractScore(content, 'Structured Thinking') || 70,
      businessAcumen: this.extractScore(content, 'Business Acumen') || 70,
      communicationClarity: this.extractScore(content, 'Communication Clarity') || 70,
      creativeSolution: this.extractScore(content, 'Creative Solutions') || 70,
      overallScore: this.extractOverallScore(content) || 70,
      detailedFeedback: this.extractDetailedFeedback(content),
      nimInsights: this.extractNIMInsights(content),
      improvementAreas: this.extractImprovementAreas(content)
    };
  }

  private parseOverallAssessment(content: string, session: InterviewSession): OverallAssessment {
    const overallScore = this.extractOverallScore(content) || this.calculateSessionScore(session);
    
    return {
      overallScore,
      recommendation: this.determineRecommendation(overallScore),
      keyStrengths: this.extractStrengths(content),
      developmentAreas: this.extractImprovementAreas(content),
      culturalFit: this.extractScore(content, 'Cultural Fit') || 75,
      technicalCompetency: this.extractScore(content, 'Technical Competency') || 75,
      leadershipPotential: this.extractScore(content, 'Leadership Potential') || 75,
      summary: this.extractSummary(content) || 'Comprehensive interview assessment completed',
      nimEnhanced: true
    };
  }

  private parsePersonalizedFeedback(content: string): string {
    // Extract the main feedback content, removing any headers or formatting
    const lines = content.split('\n').filter(line => 
      line.trim().length > 0 && 
      !line.startsWith('#') && 
      !line.startsWith('**') &&
      line.length > 20
    );
    
    return lines.join(' ').substring(0, 1000);
  }

  private parseImprovementPlan(content: string): any {
    return {
      developmentAreas: this.extractDevelopmentAreas(content),
      actionItems: this.extractActionItems(content),
      resources: this.extractResources(content),
      timeline: this.extractTimeline(content),
      milestones: this.extractMilestones(content)
    };
  }

  // ============================================================================
  // Extraction Helper Methods
  // ============================================================================

  private extractQuestionType(section: string): InterviewQuestion['type'] {
    const content = section.toLowerCase();
    if (content.includes('behavioral')) return 'behavioral';
    if (content.includes('technical')) return 'technical';
    if (content.includes('case') || content.includes('situational')) return 'case_study';
    if (content.includes('leadership')) return 'leadership';
    return 'situational';
  }

  private extractQuestionText(section: string): string {
    const questionMatch = section.match(/(?:Question|Q):\s*([^*\n]+)/i);
    if (questionMatch) return questionMatch[1].trim();
    
    // Try to find the actual question in the text
    const lines = section.split('\n').filter(line => line.trim().length > 20);
    for (const line of lines) {
      if (line.includes('?') && !line.includes('**') && !line.includes('#')) {
        return line.trim();
      }
    }
    
    return 'Interview question not properly extracted';
  }

  private extractContext(section: string): string | undefined {
    const contextMatch = section.match(/Context:\s*([^*\n]+)/i);
    return contextMatch ? contextMatch[1].trim() : undefined;
  }

  private extractFramework(section: string): string[] {
    const framework = [];
    const lines = section.split('\n');
    let inFramework = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('framework') || line.toLowerCase().includes('expected')) {
        inFramework = true;
        continue;
      }
      
      if (inFramework && line.trim().startsWith('-')) {
        framework.push(line.trim().substring(1).trim());
      } else if (inFramework && line.trim() === '') {
        break;
      }
    }
    
    return framework.length > 0 ? framework : ['Provide specific examples', 'Explain your reasoning', 'Discuss outcomes and learnings'];
  }

  private extractEvaluationCriteria(section: string): EvaluationCriterion[] {
    // Simplified extraction - in production would be more sophisticated
    return [
      {
        criterion: 'Content Quality',
        weight: 40,
        description: 'Quality and relevance of the response content',
        scoringRubric: [
          { level: 'excellent', score: 90, description: 'Exceptional response with deep insights', indicators: ['Specific examples', 'Clear reasoning'] },
          { level: 'good', score: 75, description: 'Good response with relevant content', indicators: ['Some examples', 'Logical flow'] },
          { level: 'satisfactory', score: 60, description: 'Adequate response meeting basic requirements', indicators: ['Basic content', 'Understandable'] },
          { level: 'needs_improvement', score: 45, description: 'Response lacks depth or clarity', indicators: ['Vague examples', 'Unclear reasoning'] },
          { level: 'poor', score: 25, description: 'Inadequate response', indicators: ['No examples', 'Confusing'] }
        ]
      },
      {
        criterion: 'Communication Skills',
        weight: 30,
        description: 'Clarity and effectiveness of communication',
        scoringRubric: [
          { level: 'excellent', score: 90, description: 'Clear, articulate, and engaging communication', indicators: ['Well-structured', 'Confident delivery'] },
          { level: 'good', score: 75, description: 'Good communication with minor issues', indicators: ['Mostly clear', 'Good pace'] },
          { level: 'satisfactory', score: 60, description: 'Adequate communication', indicators: ['Understandable', 'Some hesitation'] },
          { level: 'needs_improvement', score: 45, description: 'Communication issues affecting understanding', indicators: ['Unclear', 'Disorganized'] },
          { level: 'poor', score: 25, description: 'Poor communication', indicators: ['Very unclear', 'Difficult to follow'] }
        ]
      },
      {
        criterion: 'Relevance and Examples',
        weight: 30,
        description: 'Use of relevant examples and practical application',
        scoringRubric: [
          { level: 'excellent', score: 90, description: 'Highly relevant examples with clear application', indicators: ['Perfect examples', 'Clear connection'] },
          { level: 'good', score: 75, description: 'Good examples with some relevance', indicators: ['Relevant examples', 'Good connection'] },
          { level: 'satisfactory', score: 60, description: 'Some examples provided', indicators: ['Basic examples', 'Some relevance'] },
          { level: 'needs_improvement', score: 45, description: 'Limited or irrelevant examples', indicators: ['Weak examples', 'Poor connection'] },
          { level: 'poor', score: 25, description: 'No relevant examples', indicators: ['No examples', 'No connection'] }
        ]
      }
    ];
  }

  private extractFollowUpQuestions(section: string): string[] {
    const followUps = [];
    const lines = section.split('\n');
    let inFollowUp = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('follow') || line.toLowerCase().includes('follow-up')) {
        inFollowUp = true;
        continue;
      }
      
      if (inFollowUp && line.trim().startsWith('-')) {
        followUps.push(line.trim().substring(1).trim());
      } else if (inFollowUp && line.trim() === '') {
        break;
      }
    }
    
    return followUps.length > 0 ? followUps : ['Can you provide another example?', 'What would you do differently?', 'How did this experience change your approach?'];
  }

  private extractSkillsAssessed(section: string): string[] {
    const skills = [];
    const lines = section.split('\n');
    let inSkills = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('skills') || line.toLowerCase().includes('competenc')) {
        inSkills = true;
        continue;
      }
      
      if (inSkills && line.trim().startsWith('-')) {
        skills.push(line.trim().substring(1).trim());
      } else if (inSkills && line.trim() === '') {
        break;
      }
    }
    
    return skills.length > 0 ? skills : ['Communication', 'Problem-solving', 'Leadership'];
  }

  private extractCriterionScores(content: string, criteria: EvaluationCriterion[]): CriterionScore[] {
    return criteria.map(criterion => ({
      criterion: criterion.criterion,
      score: this.extractScore(content, criterion.criterion) || 70,
      level: 'good',
      feedback: `Assessment for ${criterion.criterion}`,
      evidence: ['Response analysis completed']
    }));
  }

  private extractScore(content: string, criterion: string): number | null {
    const scoreMatch = content.match(new RegExp(`${criterion}[:\\s]*([0-9]+)`, 'i'));
    return scoreMatch ? parseInt(scoreMatch[1]) : null;
  }

  private extractOverallScore(content: string): number | null {
    const overallMatch = content.match(/Overall[\\s\\w]*Score[:\\s]*([0-9]+)/i);
    return overallMatch ? parseInt(overallMatch[1]) : null;
  }

  private extractStrengths(content: string): string[] {
    return this.extractListFromContent(content, 'Strengths') || ['Good communication', 'Relevant experience', 'Clear examples'];
  }

  private extractImprovementAreas(content: string): string[] {
    return this.extractListFromContent(content, 'Improvement') || ['More specific examples', 'Clearer structure', 'Deeper analysis'];
  }

  private extractDetailedFeedback(content: string): string {
    const feedbackMatch = content.match(/(?:Detailed )?Feedback[:\\s]*([^#]*?)(?=\n\n|\n#|$)/is);
    return feedbackMatch ? feedbackMatch[1].trim() : 'Detailed feedback analysis completed';
  }

  private extractConfidenceLevel(content: string): number {
    const confidenceMatch = content.match(/Confidence[\\s\\w]*[:\\s]*([0-9]+)/i);
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 80;
  }

  private extractRecommendations(content: string): string[] {
    return this.extractListFromContent(content, 'Recommendations') || ['Practice with more examples', 'Focus on structure', 'Improve clarity'];
  }

  private extractListFromContent(content: string, sectionName: string): string[] | null {
    const lines = content.split('\n');
    const list = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes(sectionName.toLowerCase())) {
        inSection = true;
        continue;
      }
      
      if (inSection && line.trim().startsWith('-')) {
        list.push(line.trim().substring(1).trim());
      } else if (inSection && line.trim() === '') {
        break;
      }
    }
    
    return list.length > 0 ? list : null;
  }

  // Additional extraction methods...
  private extractCaseTitle(content: string): string | null {
    const titleMatch = content.match(/Title[:\\s]*([^\\n]+)/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  private extractScenario(content: string): string | null {
    const scenarioMatch = content.match(/Scenario[:\\s]*([^#]*?)(?=\n\n|\n#|$)/is);
    return scenarioMatch ? scenarioMatch[1].trim() : null;
  }

  private extractKeyIssues(content: string): string[] {
    return this.extractListFromContent(content, 'Issues') || ['Strategic challenge', 'Market dynamics', 'Resource constraints'];
  }

  private extractAnalysisFramework(content: string): string[] {
    return this.extractListFromContent(content, 'Framework') || ['Problem definition', 'Analysis', 'Recommendations'];
  }

  private extractExpectedApproach(content: string): string[] {
    return this.extractListFromContent(content, 'Approach') || ['Structured analysis', 'Data-driven insights', 'Actionable recommendations'];
  }

  private extractNIMInsights(content: string): string[] {
    return this.extractListFromContent(content, 'Insights') || ['Analysis demonstrates good business thinking'];
  }

  private extractSummary(content: string): string | null {
    const summaryMatch = content.match(/Summary[:\\s]*([^#]*?)(?=\n\n|\n#|$)/is);
    return summaryMatch ? summaryMatch[1].trim() : null;
  }

  private extractDevelopmentAreas(content: string): string[] {
    return this.extractListFromContent(content, 'Development') || ['Communication skills', 'Technical knowledge', 'Leadership presence'];
  }

  private extractActionItems(content: string): string[] {
    return this.extractListFromContent(content, 'Action') || ['Practice behavioral examples', 'Study technical concepts', 'Work on presentation skills'];
  }

  private extractResources(content: string): string[] {
    return this.extractListFromContent(content, 'Resources') || ['Interview preparation books', 'Online courses', 'Practice platforms'];
  }

  private extractTimeline(content: string): string {
    const timelineMatch = content.match(/Timeline[:\\s]*([^\\n]+)/i);
    return timelineMatch ? timelineMatch[1].trim() : '4-6 weeks';
  }

  private extractMilestones(content: string): string[] {
    return this.extractListFromContent(content, 'Milestones') || ['Week 2: Complete practice sessions', 'Week 4: Mock interview', 'Week 6: Final assessment'];
  }

  // ============================================================================
  // Utility and Fallback Methods
  // ============================================================================

  private calculateOverallScore(scores: CriterionScore[]): number {
    if (scores.length === 0) return 70;
    return Math.round(scores.reduce((sum, score) => sum + score.score, 0) / scores.length);
  }

  private calculateSessionScore(session: InterviewSession): number {
    if (session.evaluations.length === 0) return 70;
    return Math.round(session.evaluations.reduce((sum, eval) => sum + eval.overallScore, 0) / session.evaluations.length);
  }

  private determineRecommendation(score: number): OverallAssessment['recommendation'] {
    if (score >= 90) return 'strong_hire';
    if (score >= 70) return 'hire';
    if (score >= 50) return 'no_hire';
    return 'strong_no_hire';
  }

  private generateFallbackQuestions(position: string, level: string, industry?: string): InterviewQuestion[] {
    return [
      {
        id: 'fallback-1',
        type: 'behavioral',
        difficulty: level as any,
        question: `Tell me about a challenging project you worked on in your ${position} role. How did you approach it?`,
        expectedAnswerFramework: ['Situation description', 'Task and challenges', 'Actions taken', 'Results achieved'],
        evaluationCriteria: this.extractEvaluationCriteria(''),
        followUpQuestions: ['What would you do differently?', 'How did this experience change your approach?'],
        nimGenerated: false,
        skillsAssessed: ['Problem-solving', 'Communication', 'Results orientation']
      },
      {
        id: 'fallback-2',
        type: 'situational',
        difficulty: level as any,
        question: `How would you handle a situation where you disagreed with your manager's approach to a ${position} initiative?`,
        expectedAnswerFramework: ['Understand the disagreement', 'Communicate respectfully', 'Find common ground', 'Execute professionally'],
        evaluationCriteria: this.extractEvaluationCriteria(''),
        followUpQuestions: ['Can you give a specific example?', 'How do you typically handle conflict?'],
        nimGenerated: false,
        skillsAssessed: ['Conflict resolution', 'Communication', 'Professional maturity']
      }
    ];
  }

  private generateFallbackEvaluation(question: InterviewQuestion, response: InterviewResponse): InterviewEvaluation {
    return {
      questionId: question.id,
      response,
      scores: question.evaluationCriteria.map(criterion => ({
        criterion: criterion.criterion,
        score: 70,
        level: 'good',
        feedback: 'Standard evaluation completed',
        evidence: ['Response provided']
      })),
      overallScore: 70,
      strengths: ['Response provided', 'Attempted to answer'],
      areasForImprovement: ['More specific examples needed', 'Clearer structure recommended'],
      detailedFeedback: 'Evaluation completed with standard assessment criteria',
      nimEnhanced: false,
      confidenceLevel: 60,
      recommendations: ['Practice with more examples', 'Focus on structure']
    };
  }

  private generateFallbackCaseStudy(industry: string, complexity: string, focusAreas: string[]): CaseStudyAnalysis {
    return {
      caseId: `fallback-case-${Date.now()}`,
      title: `${industry} Strategic Challenge`,
      scenario: `A ${industry} company faces strategic challenges requiring analysis and recommendations.`,
      industry,
      complexity: complexity as any,
      keyIssues: ['Market competition', 'Resource allocation', 'Strategic direction'],
      analysisFramework: ['Problem identification', 'Root cause analysis', 'Solution development'],
      expectedApproach: ['Structured analysis', 'Data-driven insights', 'Actionable recommendations'],
      evaluationDimensions: ['Analytical Rigor', 'Structured Thinking', 'Business Acumen', 'Communication Clarity'],
      nimEnhanced: false
    };
  }

  private generateFallbackCaseStudyEvaluation(caseStudy: CaseStudyAnalysis, response: CaseStudyResponse): CaseStudyEvaluation {
    return {
      caseId: caseStudy.caseId,
      response,
      analyticalRigor: 70,
      structuredThinking: 70,
      businessAcumen: 70,
      communicationClarity: 70,
      creativeSolution: 70,
      overallScore: 70,
      detailedFeedback: 'Case study evaluation completed with standard assessment',
      nimInsights: ['Standard case study analysis completed'],
      improvementAreas: ['More detailed analysis', 'Clearer recommendations', 'Better structure']
    };
  }

  private generateFallbackOverallAssessment(session: InterviewSession): OverallAssessment {
    const avgScore = this.calculateSessionScore(session);
    
    return {
      overallScore: avgScore,
      recommendation: this.determineRecommendation(avgScore),
      keyStrengths: ['Participated in interview', 'Provided responses', 'Professional demeanor'],
      developmentAreas: ['More specific examples', 'Clearer communication', 'Deeper analysis'],
      culturalFit: 75,
      technicalCompetency: 70,
      leadershipPotential: 70,
      summary: 'Interview assessment completed with standard evaluation criteria',
      nimEnhanced: false
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.questionCache.clear();
    this.evaluationCache.clear();
    this.caseStudyCache.clear();
    console.log('NIM-Enhanced Case Study Coaching Agent cleaned up');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create NIM-enhanced case study coaching agent
 */
export function createNIMEnhancedCaseStudyCoachingAgent(nimConfig?: any): INIMEnhancedInterviewCoachingAgent {
  return new NIMEnhancedCaseStudyCoachingAgent(nimConfig);
}

/**
 * Create NIM-enhanced case study coaching agent for local testing
 */
export function createLocalNIMEnhancedCaseStudyCoachingAgent(
  localEndpoint: string = 'http://localhost:1234'
): INIMEnhancedInterviewCoachingAgent {
  return new NIMEnhancedCaseStudyCoachingAgent({
    localTestingEnabled: true,
    localEndpoint,
    timeout: 30000
  });
}