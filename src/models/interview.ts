/**
 * Interview preparation models and interfaces
 */

export type QuestionCategory = 'behavioral' | 'product_sense' | 'analytical' | 'technical';
export type RoleLevel = 'APM' | 'PM' | 'Senior PM';
export type PMFramework = 'STAR' | 'CIRCLES' | 'RICE' | 'SWOT' | 'Jobs-to-be-Done' | 'North Star';

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  followUps: string[];
  evaluationCriteria: string[];
  frameworks: PMFramework[];
  roleLevel: RoleLevel[];
  difficulty: number; // 1-5 scale
  company?: string; // Optional company-specific question
  tags: string[];
}

export interface QuestionBank {
  getQuestionsByCategory(category: QuestionCategory): InterviewQuestion[];
  getQuestionsByRole(role: RoleLevel): InterviewQuestion[];
  getQuestionsByDifficulty(difficulty: number): InterviewQuestion[];
  getRandomQuestion(filters?: QuestionFilters): InterviewQuestion;
  getAllQuestions(): InterviewQuestion[];
  getQuestionById(id: string): InterviewQuestion | undefined;
  addQuestion(question: InterviewQuestion): void;
  getQuestionStats(): {
    totalQuestions: number;
    byCategory: Record<QuestionCategory, number>;
    byRole: Record<RoleLevel, number>;
    byDifficulty: Record<number, number>;
  };
}

export interface QuestionFilters {
  category?: QuestionCategory;
  roleLevel?: RoleLevel;
  difficulty?: number;
  company?: string;
  excludeIds?: string[];
}

export interface FrameworkAnalysis {
  framework: PMFramework;
  usage: 'excellent' | 'good' | 'partial' | 'missing';
  score: number; // 0-1 scale
  feedback: string;
}

export interface CaseFrameworkAnalysis {
  framework: CaseFramework;
  usage: 'excellent' | 'good' | 'partial' | 'missing';
  score: number; // 0-1 scale
  feedback: string;
}

export interface ResponseEvaluation {
  overallScore: number; // 1-5 scale
  strengths: string[];
  improvements: string[];
  frameworkAnalysis: FrameworkAnalysis[];
  nextSteps: string[];
  confidence: number; // 0-1 scale
}

export interface InterviewFeedback {
  questionId: string;
  userResponse: string;
  evaluation: ResponseEvaluation;
  timestamp: Date;
  sessionId: string;
}

export interface InterviewSession {
  sessionId: string;
  userId?: string;
  roleLevel: RoleLevel;
  company?: string;
  startTime: Date;
  currentQuestion?: InterviewQuestion;
  questionsAsked: string[];
  responses: InterviewFeedback[];
  overallProgress: SessionProgress;
}

export interface SessionProgress {
  questionsCompleted: number;
  averageScore: number;
  categoryScores: Record<QuestionCategory, number>;
  frameworkProficiency: Record<PMFramework, number>;
  timeElapsed: number;
  recommendedFocus: string[];
}

export interface QuestionGenerationConfig {
  roleLevel: RoleLevel;
  category?: QuestionCategory;
  difficulty?: number;
  company?: string;
  previousQuestions?: string[];
  sessionContext?: InterviewSession;
}

// Case Study Models and Interfaces

export type CaseType = 'product_design' | 'strategy' | 'prioritization' | 'market_entry';
export type CaseFramework = 'CIRCLES' | 'RICE' | 'SWOT' | 'Porter_Five_Forces' | 'Jobs_to_be_Done' | 'North_Star' | 'OKRs' | 'Lean_Canvas';
export type CaseStepType = 'clarification' | 'analysis' | 'ideation' | 'prioritization' | 'metrics' | 'recommendation';

export interface CaseStudy {
  id: string;
  type: CaseType;
  title: string;
  scenario: string;
  context: string;
  constraints: string[];
  objectives: string[];
  steps: CaseStep[];
  expectedFrameworks: CaseFramework[];
  difficulty: number; // 1-5 scale
  estimatedTime: number; // minutes
  industry?: string;
  company?: string;
  tags: string[];
  marketData?: CaseMarketContext;
}

export interface CaseStep {
  stepNumber: number;
  stepType: CaseStepType;
  title: string;
  instruction: string;
  description: string;
  frameworks: CaseFramework[];
  timeLimit: number; // minutes
  evaluationCriteria: string[];
  hints: CaseHint[];
  expectedOutputs: string[];
  dependencies?: number[]; // step numbers this step depends on
}

export interface CaseHint {
  id: string;
  level: 'gentle' | 'moderate' | 'strong'; // hint strength
  trigger: 'time_elapsed' | 'user_stuck' | 'framework_missing' | 'on_request';
  content: string;
  framework?: CaseFramework;
  revealsSolution: boolean;
}

export interface CaseMarketContext {
  industry: string;
  marketSize: {
    tam: number;
    sam: number;
    som: number;
    currency?: string;
    timeframe?: string;
    growthRate?: number;
  };
  competitors: string[];
  trends: string[];
  keyMetrics: Record<string, number>;
  assumptions: string[];
  competitiveInsights?: {
    marketLeader: string;
    marketGaps: string[];
    differentiationOpportunities: string[];
  };
  dataFreshness?: {
    lastUpdated: string;
    confidence: number;
    sources: string[];
  };
}

export interface MarketIntelligence {
  industry: string;
  marketOverview: {
    size: number;
    growthRate: number;
    maturity: 'emerging' | 'growth' | 'mature' | 'declining';
    keyDrivers: string[];
  };
  competitiveLandscape: {
    numberOfCompetitors: number;
    marketConcentration: 'low' | 'medium' | 'high';
    topCompetitors: string[];
    competitiveIntensity: 'low' | 'medium' | 'high';
  };
  opportunities: {
    marketGaps: string[];
    emergingTrends: string[];
    underservedSegments: string[];
  };
  risks: {
    competitiveThreats: string[];
    marketRisks: string[];
    regulatoryRisks: string[];
  };
  recommendations: {
    entryStrategy: string[];
    positioningAdvice: string[];
    timingConsiderations: string[];
  };
}

export interface IndustryTrends {
  industry: string;
  currentTrends: Array<{
    name: string;
    impact: 'low' | 'medium' | 'high';
    timeframe: string;
    confidence: number;
  }>;
  emergingTechnologies: string[];
  marketForces: string[];
  customerBehaviorShifts: string[];
  regulatoryChanges: string[];
  disruptiveFactors: string[];
}

export interface CompetitiveInsights {
  marketLeader: string;
  marketGaps: string[];
  differentiationOpportunities: string[];
  competitiveThreats: string[];
  positioningRecommendations: string[];
}

export interface MarketAssumptionValidation {
  assumption: string;
  isValid: boolean;
  confidence: number;
  evidence: string[];
  contradictions: string[];
  recommendation: string;
}

export interface FrameworkGuidance {
  framework: CaseFramework;
  description: string;
  steps: string[];
  whenToUse: string;
  examples: string[];
  commonMistakes: string[];
  templates: FrameworkTemplate[];
}

export interface FrameworkTemplate {
  name: string;
  structure: string;
  example: string;
  placeholders: Record<string, string>;
}

export interface CaseStepEvaluation {
  stepNumber: number;
  score: number; // 1-5 scale
  frameworkUsage: CaseFrameworkAnalysis[];
  strengths: string[];
  improvements: string[];
  missingElements: string[];
  nextStepRecommendations: string[];
  confidence: number; // 0-1 scale
}

export interface CaseEvaluation {
  caseId: string;
  overallScore: number; // 1-5 scale
  stepEvaluations: CaseStepEvaluation[];
  frameworkProficiency: Record<CaseFramework, number>;
  strengths: string[];
  improvements: string[];
  executiveSummary: string;
  recommendedNextCases: string[];
  timeSpent: number;
  confidence: number; // 0-1 scale
}

export interface CaseSession {
  sessionId: string;
  userId?: string;
  caseStudy: CaseStudy;
  currentStep: number;
  startTime: Date;
  stepResponses: CaseStepResponse[];
  hintsUsed: string[];
  progress: CaseProgress;
  evaluation?: CaseEvaluation;
}

export interface CaseStepResponse {
  stepNumber: number;
  userResponse: string;
  timestamp: Date;
  timeSpent: number;
  frameworksUsed: CaseFramework[];
  evaluation?: CaseStepEvaluation;
}

export interface CaseProgress {
  stepsCompleted: number;
  totalSteps: number;
  currentStepProgress: number; // 0-1 scale
  timeElapsed: number;
  hintsUsed: number;
  frameworksApplied: CaseFramework[];
  overallProgress: number; // 0-1 scale
}

export interface CaseStudyTemplate {
  type: CaseType;
  name: string;
  description: string;
  structure: CaseStep[];
  frameworks: CaseFramework[];
  variations: CaseVariation[];
}

export interface CaseVariation {
  name: string;
  description: string;
  modifications: {
    scenario?: string;
    constraints?: string[];
    objectives?: string[];
    industry?: string;
    difficulty?: number;
  };
}

export interface CaseStudyBank {
  getCasesByType(type: CaseType): CaseStudy[];
  getCasesByDifficulty(difficulty: number): CaseStudy[];
  getCasesByIndustry(industry: string): CaseStudy[];
  getRandomCase(filters?: CaseFilters): CaseStudy;
  getAllCases(): CaseStudy[];
  getCaseById(id: string): CaseStudy | undefined;
  addCase(caseStudy: CaseStudy): void;
  getCaseStats(): {
    totalCases: number;
    byType: Record<CaseType, number>;
    byDifficulty: Record<number, number>;
    byIndustry: Record<string, number>;
  };
}

export interface CaseFilters {
  type?: CaseType;
  difficulty?: number;
  industry?: string;
  company?: string;
  estimatedTime?: number;
  frameworks?: CaseFramework[];
  excludeIds?: string[];
}