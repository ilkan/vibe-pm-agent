/**
 * Company-specific interview preparation models and interfaces
 */

export type CompanyTier = 'FAANG' | 'Big Tech' | 'Unicorn' | 'Growth Stage' | 'Enterprise' | 'Startup';
export type InterviewStyle = 'behavioral_heavy' | 'case_heavy' | 'technical_heavy' | 'balanced' | 'culture_heavy';
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

export interface CompanyProfile {
  id: string;
  name: string;
  tier: CompanyTier;
  size: CompanySize;
  industry: string[];
  headquarters: string;
  founded: number;
  employeeCount?: number;
  
  // Interview characteristics
  interviewProcess: InterviewProcess;
  cultureValues: CultureValues;
  productPhilosophy: ProductPhilosophy;
  recentLaunches: ProductLaunch[];
  
  // Interview patterns
  interviewPatterns: InterviewPattern[];
  questionWeighting: QuestionWeighting;
  evaluationCriteria: CompanyEvaluationCriteria;
  
  // Metadata
  lastUpdated: Date;
  dataFreshness: number; // 0-1 scale
  sources: string[];
}

export interface InterviewProcess {
  totalRounds: number;
  rounds: InterviewRound[];
  averageDuration: number; // total process duration in days
  passRate?: number; // 0-1 scale if available
  commonFeedback: string[];
  uniqueAspects: string[];
}

export interface InterviewRound {
  roundNumber: number;
  name: string;
  type: 'phone_screen' | 'behavioral' | 'case_study' | 'technical' | 'presentation' | 'panel' | 'onsite' | 'virtual';
  duration: number; // minutes
  interviewers: number;
  focus: string[];
  commonQuestions: string[];
  evaluationWeight: number; // 0-1 scale
}

export interface CultureValues {
  coreValues: string[];
  leadershipPrinciples?: string[]; // Amazon-style leadership principles
  culturalTraits: string[];
  workStyle: 'collaborative' | 'autonomous' | 'hierarchical' | 'flat' | 'matrix';
  decisionMaking: 'consensus' | 'top_down' | 'data_driven' | 'fast_iteration' | 'deliberate';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | 'experimental';
  innovationApproach: 'incremental' | 'disruptive' | 'customer_driven' | 'technology_driven';
}

export interface ProductPhilosophy {
  productPrinciples: string[];
  designPhilosophy: string[];
  developmentMethodology: 'agile' | 'waterfall' | 'lean' | 'design_thinking' | 'hybrid';
  customerFocus: 'b2b' | 'b2c' | 'b2b2c' | 'platform' | 'marketplace';
  productStrategy: string[];
  keyMetrics: string[];
  competitiveAdvantages: string[];
}

export interface ProductLaunch {
  id: string;
  name: string;
  launchDate: Date;
  category: string;
  description: string;
  targetMarket: string[];
  keyFeatures: string[];
  businessImpact?: {
    revenue?: number;
    userGrowth?: number;
    marketShare?: number;
    strategicValue: string;
  };
  lessonsLearned?: string[];
  pmInvolvement: string[];
}

export interface InterviewPattern {
  patternId: string;
  name: string;
  description: string;
  frequency: number; // 0-1 scale, how often this pattern appears
  questionTypes: string[];
  expectedFrameworks: string[];
  commonMistakes: string[];
  successFactors: string[];
  exampleQuestions: string[];
}

export interface QuestionWeighting {
  behavioral: number; // 0-1 scale
  productSense: number;
  analytical: number;
  technical: number;
  leadership: number;
  strategy: number;
  execution: number;
  culture: number;
}

export interface CompanyEvaluationCriteria {
  primaryCriteria: EvaluationCriterion[];
  secondaryCriteria: EvaluationCriterion[];
  dealBreakers: string[];
  differentiators: string[];
  feedbackStyle: 'direct' | 'diplomatic' | 'coaching' | 'structured' | 'conversational';
}

export interface EvaluationCriterion {
  name: string;
  description: string;
  weight: number; // 0-1 scale
  evaluationMethod: string;
  commonSignals: {
    positive: string[];
    negative: string[];
  };
}

export interface CompanyInsights {
  companyId: string;
  interviewTips: InterviewTip[];
  preparationFocus: string[];
  commonQuestions: CompanyQuestion[];
  successStories: SuccessStory[];
  recentChanges: CompanyChange[];
  competitiveContext: CompetitiveContext;
}

export interface InterviewTip {
  category: 'preparation' | 'during_interview' | 'follow_up';
  tip: string;
  importance: 'high' | 'medium' | 'low';
  applicableRounds: number[];
}

export interface CompanyQuestion {
  question: string;
  category: string;
  frequency: number; // 0-1 scale
  difficulty: number; // 1-5 scale
  expectedFrameworks: string[];
  sampleAnswer?: string;
  evaluationNotes: string[];
}

export interface SuccessStory {
  candidateProfile: string;
  roleLevel: string;
  keyFactors: string[];
  preparationStrategy: string[];
  interviewHighlights: string[];
  lessonsLearned: string[];
}

export interface CompanyChange {
  changeDate: Date;
  type: 'process' | 'criteria' | 'structure' | 'focus' | 'culture';
  description: string;
  impact: 'high' | 'medium' | 'low';
  implications: string[];
}

export interface CompetitiveContext {
  directCompetitors: string[];
  talentCompetition: string[];
  marketPosition: string;
  differentiationFactors: string[];
  industryTrends: string[];
}

export interface CompanyProfileDatabase {
  getCompanyProfile(companyId: string): CompanyProfile | undefined;
  getCompanyByName(name: string): CompanyProfile | undefined;
  getCompaniesByTier(tier: CompanyTier): CompanyProfile[];
  getCompaniesByIndustry(industry: string): CompanyProfile[];
  searchCompanies(query: string): CompanyProfile[];
  getAllCompanies(): CompanyProfile[];
  addCompanyProfile(profile: CompanyProfile): void;
  updateCompanyProfile(companyId: string, updates: Partial<CompanyProfile>): void;
  getCompanyInsights(companyId: string): CompanyInsights | undefined;
  getCompanyStats(): {
    totalCompanies: number;
    byTier: Record<CompanyTier, number>;
    byIndustry: Record<string, number>;
    bySize: Record<CompanySize, number>;
  };
}

export interface CompanyCustomizationConfig {
  companyId: string;
  roleLevel: string;
  focusAreas: string[];
  questionWeighting: QuestionWeighting;
  feedbackStyle: string;
  culturalEmphasis: string[];
  preparationRecommendations: string[];
}

export interface CompanySpecificFeedback {
  companyId: string;
  standardFeedback: string;
  companyCustomization: {
    cultureAlignment: string;
    valueAlignment: string;
    productThinking: string;
    leadershipStyle: string;
    communicationStyle: string;
  };
  improvementSuggestions: string[];
  companySpecificTips: string[];
}

// Pre-defined company data structure for major tech companies
export interface TechCompanyProfiles {
  google: CompanyProfile;
  amazon: CompanyProfile;
  meta: CompanyProfile;
  apple: CompanyProfile;
  microsoft: CompanyProfile;
  netflix: CompanyProfile;
  uber: CompanyProfile;
  airbnb: CompanyProfile;
  stripe: CompanyProfile;
  salesforce: CompanyProfile;
}