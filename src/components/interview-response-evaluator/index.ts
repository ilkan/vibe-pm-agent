/**
 * Interview Response Evaluator Component
 * Evaluates PM interview responses using frameworks like STAR method and product frameworks
 */

import {
  InterviewQuestion,
  ResponseEvaluation,
  FrameworkAnalysis,
  PMFramework,
  QuestionCategory
} from '../../models/interview';

export interface EvaluationConfig {
  strictMode?: boolean;
  focusFrameworks?: PMFramework[];
  roleLevel?: string;
  customCriteria?: string[];
}

export class InterviewResponseEvaluator {
  private frameworkPatterns: Record<PMFramework, RegExp[]>;
  private categoryWeights: Record<QuestionCategory, Record<string, number>>;

  constructor() {
    this.initializeFrameworkPatterns();
    this.initializeCategoryWeights();
  }

  /**
   * Evaluate a response to an interview question
   */
  async evaluateResponse(
    question: InterviewQuestion,
    response: string,
    config: EvaluationConfig = {}
  ): Promise<ResponseEvaluation> {
    try {
      const frameworkAnalysis = this.analyzeFrameworkUsage(question, response, config);
      const contentAnalysis = this.analyzeContent(question, response);
      const structureAnalysis = this.analyzeStructure(response, question.category);
      
      const overallScore = this.calculateOverallScore(
        frameworkAnalysis,
        contentAnalysis,
        structureAnalysis,
        question.category
      );

      const strengths = this.identifyStrengths(frameworkAnalysis, contentAnalysis, structureAnalysis);
      const improvements = this.identifyImprovements(frameworkAnalysis, contentAnalysis, structureAnalysis);
      const nextSteps = this.generateNextSteps(improvements, question.category);

      return {
        overallScore,
        strengths,
        improvements,
        frameworkAnalysis,
        nextSteps,
        confidence: this.calculateConfidence(response, question)
      };
    } catch (error) {
      throw new Error(`Failed to evaluate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch evaluate multiple responses
   */
  async evaluateMultipleResponses(
    questionResponsePairs: Array<{ question: InterviewQuestion; response: string }>,
    config: EvaluationConfig = {}
  ): Promise<ResponseEvaluation[]> {
    const evaluations: ResponseEvaluation[] = [];

    for (const pair of questionResponsePairs) {
      const evaluation = await this.evaluateResponse(pair.question, pair.response, config);
      evaluations.push(evaluation);
    }

    return evaluations;
  }

  private initializeFrameworkPatterns(): void {
    this.frameworkPatterns = {
      'STAR': [
        /situation|context|background/i,
        /task|responsibility|goal|objective/i,
        /action|approach|steps|did|implemented/i,
        /result|outcome|impact|achieved|learned/i
      ],
      'CIRCLES': [
        /clarify|clarification|understand|assumptions/i,
        /identify|customer|user|target/i,
        /report|stakeholder|audience/i,
        /cut|prioritize|focus|scope/i,
        /list|brainstorm|solutions|ideas/i,
        /evaluate|assess|trade.?off|pros.?cons/i,
        /summarize|recommend|conclusion/i
      ],
      'RICE': [
        /reach|users?|customers?|impact/i,
        /impact|benefit|value|improvement/i,
        /confidence|certain|sure|estimate/i,
        /effort|cost|time|resources?/i
      ],
      'SWOT': [
        /strength|advantage|good|positive/i,
        /weakness|disadvantage|challenge|negative/i,
        /opportunit|potential|growth|market/i,
        /threat|risk|competition|external/i
      ],
      'Jobs-to-be-Done': [
        /job|task|need|want|trying.to/i,
        /hire|solution|product|service/i,
        /progress|outcome|goal|success/i,
        /context|situation|circumstance/i
      ],
      'North Star': [
        /north.star|vision|mission|goal/i,
        /metric|measure|kpi|success/i,
        /align|direction|focus|priority/i,
        /long.term|strategy|objective/i
      ]
    };
  }

  private initializeCategoryWeights(): void {
    this.categoryWeights = {
      'behavioral': {
        structure: 0.3,
        specificity: 0.25,
        frameworks: 0.25,
        outcomes: 0.2
      },
      'product_sense': {
        structure: 0.2,
        creativity: 0.25,
        frameworks: 0.3,
        feasibility: 0.25
      },
      'analytical': {
        structure: 0.25,
        logic: 0.3,
        frameworks: 0.25,
        quantification: 0.2
      },
      'technical': {
        structure: 0.2,
        accuracy: 0.3,
        clarity: 0.25,
        frameworks: 0.25
      }
    };
  }

  private analyzeFrameworkUsage(
    question: InterviewQuestion,
    response: string,
    config: EvaluationConfig
  ): FrameworkAnalysis[] {
    const analyses: FrameworkAnalysis[] = [];
    const relevantFrameworks = config.focusFrameworks || question.frameworks;

    for (const framework of relevantFrameworks) {
      const analysis = this.analyzeSpecificFramework(framework, response, question.category);
      analyses.push(analysis);
    }

    // If no specific frameworks, analyze based on question category
    if (analyses.length === 0) {
      const defaultFramework = this.getDefaultFramework(question.category);
      if (defaultFramework) {
        const analysis = this.analyzeSpecificFramework(defaultFramework, response, question.category);
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  private analyzeSpecificFramework(
    framework: PMFramework,
    response: string,
    category: QuestionCategory
  ): FrameworkAnalysis {
    const patterns = this.frameworkPatterns[framework] || [];
    const matches = patterns.map(pattern => pattern.test(response));
    const matchCount = matches.filter(Boolean).length;
    const totalPatterns = patterns.length;

    let usage: 'excellent' | 'good' | 'partial' | 'missing';
    let score: number;
    let feedback: string;

    if (matchCount === totalPatterns) {
      usage = 'excellent';
      score = 1.0;
      feedback = `Excellent use of ${framework} framework with all key components present.`;
    } else if (matchCount >= totalPatterns * 0.75) {
      usage = 'good';
      score = 0.8;
      feedback = `Good use of ${framework} framework with most components covered.`;
    } else if (matchCount >= totalPatterns * 0.5) {
      usage = 'partial';
      score = 0.6;
      feedback = `Partial use of ${framework} framework. Consider including more components.`;
    } else {
      usage = 'missing';
      score = 0.3;
      feedback = `Limited evidence of ${framework} framework usage. Structure your response more clearly.`;
    }

    return {
      framework,
      usage,
      score,
      feedback
    };
  }

  private analyzeContent(question: InterviewQuestion, response: string): {
    specificity: number;
    relevance: number;
    depth: number;
    examples: number;
  } {
    const wordCount = response.split(/\s+/).length;
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Specificity: Look for specific numbers, names, dates, metrics
    const specificityPatterns = [
      /\d+%/g, // Percentages
      /\$\d+/g, // Dollar amounts
      /\d+\s*(users?|customers?|people)/gi, // User counts
      /\d+\s*(days?|weeks?|months?)/gi, // Time periods
      /[A-Z][a-z]+\s+[A-Z][a-z]+/g, // Proper names
    ];
    
    const specificityMatches = specificityPatterns.reduce(
      (count, pattern) => count + (response.match(pattern) || []).length,
      0
    );
    const specificity = Math.min(1.0, specificityMatches / 5);

    // Relevance: Check if response addresses the question
    const questionKeywords = this.extractKeywords(question.question);
    const responseKeywords = this.extractKeywords(response);
    const keywordOverlap = questionKeywords.filter(kw => 
      responseKeywords.some(rw => rw.toLowerCase().includes(kw.toLowerCase()))
    ).length;
    const relevance = Math.min(1.0, keywordOverlap / Math.max(1, questionKeywords.length));

    // Depth: Based on word count and sentence complexity
    const avgSentenceLength = wordCount / Math.max(1, sentences.length);
    const depth = Math.min(1.0, (wordCount / 200) * (avgSentenceLength / 15));

    // Examples: Look for example indicators
    const examplePatterns = [
      /for example/gi,
      /such as/gi,
      /like when/gi,
      /instance/gi,
      /specifically/gi
    ];
    const exampleCount = examplePatterns.reduce(
      (count, pattern) => count + (response.match(pattern) || []).length,
      0
    );
    const examples = Math.min(1.0, exampleCount / 3);

    return { specificity, relevance, depth, examples };
  }

  private analyzeStructure(response: string, category: QuestionCategory): {
    organization: number;
    clarity: number;
    completeness: number;
  } {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = response.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Organization: Look for transition words and logical flow
    const transitionWords = [
      'first', 'second', 'third', 'next', 'then', 'finally',
      'however', 'therefore', 'consequently', 'as a result',
      'in addition', 'furthermore', 'moreover', 'on the other hand'
    ];
    
    const transitionCount = transitionWords.reduce(
      (count, word) => count + (response.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length,
      0
    );
    const organization = Math.min(1.0, transitionCount / 3);

    // Clarity: Based on sentence length and complexity
    const avgSentenceLength = response.split(/\s+/).length / Math.max(1, sentences.length);
    const clarity = Math.max(0, 1 - (avgSentenceLength - 20) / 30); // Optimal around 20 words

    // Completeness: Check if response addresses multiple aspects
    const completenessIndicators = this.getCompletenessIndicators(category);
    const completenessScore = completenessIndicators.reduce(
      (score, indicator) => score + (new RegExp(indicator, 'i').test(response) ? 1 : 0),
      0
    ) / completenessIndicators.length;

    return {
      organization: Math.max(0, organization),
      clarity: Math.max(0, clarity),
      completeness: completenessScore
    };
  }

  private calculateOverallScore(
    frameworkAnalysis: FrameworkAnalysis[],
    contentAnalysis: any,
    structureAnalysis: any,
    category: QuestionCategory
  ): number {
    const weights = this.categoryWeights[category];
    
    // Framework score (average of all framework analyses)
    const frameworkScore = frameworkAnalysis.length > 0
      ? frameworkAnalysis.reduce((sum, fa) => sum + fa.score, 0) / frameworkAnalysis.length
      : 0.5;

    // Content score (weighted average of content metrics)
    const contentScore = (
      contentAnalysis.specificity * 0.3 +
      contentAnalysis.relevance * 0.4 +
      contentAnalysis.depth * 0.2 +
      contentAnalysis.examples * 0.1
    );

    // Structure score (weighted average of structure metrics)
    const structureScore = (
      structureAnalysis.organization * 0.4 +
      structureAnalysis.clarity * 0.3 +
      structureAnalysis.completeness * 0.3
    );

    // Calculate weighted overall score
    const overallScore = (
      frameworkScore * weights.frameworks +
      contentScore * (weights.specificity || 0.25) +
      structureScore * weights.structure +
      contentAnalysis.relevance * (weights.logic || weights.creativity || weights.accuracy || 0.25)
    );

    // Convert to 1-5 scale
    return Math.max(1, Math.min(5, Math.round(overallScore * 4) + 1));
  }

  private identifyStrengths(
    frameworkAnalysis: FrameworkAnalysis[],
    contentAnalysis: any,
    structureAnalysis: any
  ): string[] {
    const strengths: string[] = [];

    // Framework strengths
    frameworkAnalysis.forEach(fa => {
      if (fa.score >= 0.8) {
        strengths.push(`Strong use of ${fa.framework} framework`);
      }
    });

    // Content strengths
    if (contentAnalysis.specificity >= 0.7) {
      strengths.push('Provided specific, concrete examples and metrics');
    }
    if (contentAnalysis.relevance >= 0.8) {
      strengths.push('Directly addressed the question with relevant content');
    }
    if (contentAnalysis.depth >= 0.7) {
      strengths.push('Demonstrated deep thinking and comprehensive analysis');
    }

    // Structure strengths
    if (structureAnalysis.organization >= 0.7) {
      strengths.push('Well-organized response with clear logical flow');
    }
    if (structureAnalysis.clarity >= 0.8) {
      strengths.push('Clear and concise communication style');
    }

    return strengths.length > 0 ? strengths : ['Addressed the basic question requirements'];
  }

  private identifyImprovements(
    frameworkAnalysis: FrameworkAnalysis[],
    contentAnalysis: any,
    structureAnalysis: any
  ): string[] {
    const improvements: string[] = [];

    // Framework improvements
    frameworkAnalysis.forEach(fa => {
      if (fa.score < 0.6) {
        improvements.push(`Better structure using ${fa.framework} framework components`);
      }
    });

    // Content improvements
    if (contentAnalysis.specificity < 0.5) {
      improvements.push('Include more specific examples, metrics, and concrete details');
    }
    if (contentAnalysis.relevance < 0.6) {
      improvements.push('Focus more directly on answering the specific question asked');
    }
    if (contentAnalysis.depth < 0.5) {
      improvements.push('Provide deeper analysis and more comprehensive coverage');
    }

    // Structure improvements
    if (structureAnalysis.organization < 0.5) {
      improvements.push('Improve organization with clearer transitions and logical flow');
    }
    if (structureAnalysis.clarity < 0.6) {
      improvements.push('Use shorter sentences and clearer language for better communication');
    }
    if (structureAnalysis.completeness < 0.6) {
      improvements.push('Address all aspects of the question more completely');
    }

    return improvements.length > 0 ? improvements : ['Consider adding more detail and structure'];
  }

  private generateNextSteps(improvements: string[], category: QuestionCategory): string[] {
    const nextSteps: string[] = [];

    // Category-specific next steps
    switch (category) {
      case 'behavioral':
        nextSteps.push('Practice more STAR method responses');
        nextSteps.push('Prepare specific examples from your experience');
        break;
      case 'product_sense':
        nextSteps.push('Study product frameworks like CIRCLES');
        nextSteps.push('Practice product design and improvement cases');
        break;
      case 'analytical':
        nextSteps.push('Work on structured problem-solving approaches');
        nextSteps.push('Practice with metrics and data analysis scenarios');
        break;
      case 'technical':
        nextSteps.push('Review technical concepts and terminology');
        nextSteps.push('Practice explaining technical topics to non-technical audiences');
        break;
    }

    // General next steps based on improvements
    if (improvements.some(imp => imp.includes('framework'))) {
      nextSteps.push('Study and practice relevant PM frameworks');
    }
    if (improvements.some(imp => imp.includes('specific'))) {
      nextSteps.push('Prepare a bank of specific examples and metrics');
    }
    if (improvements.some(imp => imp.includes('organization'))) {
      nextSteps.push('Practice structuring responses with clear beginning, middle, and end');
    }

    return [...new Set(nextSteps)]; // Remove duplicates
  }

  private calculateConfidence(response: string, question: InterviewQuestion): number {
    const wordCount = response.split(/\s+/).length;
    const hasSpecifics = /\d+/.test(response);
    const hasExamples = /(example|instance|specifically)/i.test(response);
    
    let confidence = 0.6; // Base confidence

    // Length indicates thoughtfulness
    if (wordCount > 100) confidence += 0.1;
    if (wordCount > 200) confidence += 0.1;

    // Specifics indicate preparation
    if (hasSpecifics) confidence += 0.1;
    if (hasExamples) confidence += 0.1;

    // Framework usage indicates structure
    const frameworkUsage = question.frameworks.some(framework =>
      this.frameworkPatterns[framework]?.some(pattern => pattern.test(response))
    );
    if (frameworkUsage) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  private getDefaultFramework(category: QuestionCategory): PMFramework | null {
    switch (category) {
      case 'behavioral':
        return 'STAR';
      case 'product_sense':
        return 'CIRCLES';
      case 'analytical':
        return 'RICE';
      default:
        return null;
    }
  }

  private getCompletenessIndicators(category: QuestionCategory): string[] {
    switch (category) {
      case 'behavioral':
        return ['situation', 'task', 'action', 'result'];
      case 'product_sense':
        return ['user', 'problem', 'solution', 'impact'];
      case 'analytical':
        return ['data', 'analysis', 'conclusion', 'recommendation'];
      case 'technical':
        return ['concept', 'implementation', 'trade-off', 'outcome'];
      default:
        return ['problem', 'approach', 'solution', 'result'];
    }
  }
}