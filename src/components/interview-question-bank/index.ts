/**
 * Interview Question Bank Component
 * Manages PM interview questions categorized by type, role level, and difficulty
 */

import {
  InterviewQuestion,
  QuestionBank,
  QuestionCategory,
  RoleLevel,
  QuestionFilters,
  PMFramework
} from '../../models/interview';

export class InterviewQuestionBank {
  private questions: InterviewQuestion[] = [];

  constructor() {
    this.initializeQuestionBank();
  }

  private initializeQuestionBank(): void {
    this.questions = [
      // Behavioral Questions
      {
        id: 'beh-001',
        category: 'behavioral',
        question: 'Tell me about a time when you had to make a difficult product decision with limited data.',
        followUps: [
          'How did you gather additional insights?',
          'What was the outcome?',
          'What would you do differently?'
        ],
        evaluationCriteria: [
          'Uses STAR method structure',
          'Shows data-driven thinking',
          'Demonstrates decision-making process',
          'Shows learning from experience'
        ],
        frameworks: ['STAR'],
        roleLevel: ['PM', 'Senior PM'],
        difficulty: 3,
        tags: ['decision-making', 'data-analysis', 'uncertainty']
      },
      {
        id: 'beh-002',
        category: 'behavioral',
        question: 'Describe a situation where you had to influence a team without direct authority.',
        followUps: [
          'What resistance did you encounter?',
          'How did you build consensus?',
          'What was the final result?'
        ],
        evaluationCriteria: [
          'Demonstrates leadership skills',
          'Shows stakeholder management',
          'Uses influence tactics',
          'Measures success outcomes'
        ],
        frameworks: ['STAR'],
        roleLevel: ['APM', 'PM', 'Senior PM'],
        difficulty: 2,
        tags: ['leadership', 'influence', 'stakeholder-management']
      },

      // Product Sense Questions
      {
        id: 'prod-001',
        category: 'product_sense',
        question: 'How would you improve Instagram Stories?',
        followUps: [
          'What metrics would you track?',
          'How would you prioritize these improvements?',
          'What are the potential risks?'
        ],
        evaluationCriteria: [
          'Identifies user pain points',
          'Proposes concrete solutions',
          'Considers business impact',
          'Uses product frameworks'
        ],
        frameworks: ['CIRCLES', 'Jobs-to-be-Done'],
        roleLevel: ['APM', 'PM', 'Senior PM'],
        difficulty: 3,
        tags: ['product-improvement', 'social-media', 'user-experience']
      },
      {
        id: 'prod-002',
        category: 'product_sense',
        question: 'Design a product for elderly people to stay connected with their families.',
        followUps: [
          'What are the key user needs?',
          'How would you validate this concept?',
          'What would your MVP look like?'
        ],
        evaluationCriteria: [
          'Shows user empathy',
          'Identifies market opportunity',
          'Designs appropriate solution',
          'Plans validation approach'
        ],
        frameworks: ['CIRCLES', 'Jobs-to-be-Done'],
        roleLevel: ['PM', 'Senior PM'],
        difficulty: 4,
        tags: ['product-design', 'user-research', 'accessibility']
      },

      // Analytical Questions
      {
        id: 'anal-001',
        category: 'analytical',
        question: 'How would you measure the success of a new feature launch?',
        followUps: [
          'What are your primary and secondary metrics?',
          'How would you set up the measurement framework?',
          'What would indicate failure?'
        ],
        evaluationCriteria: [
          'Defines clear success metrics',
          'Considers leading and lagging indicators',
          'Plans measurement approach',
          'Identifies potential pitfalls'
        ],
        frameworks: ['North Star'],
        roleLevel: ['APM', 'PM', 'Senior PM'],
        difficulty: 2,
        tags: ['metrics', 'measurement', 'feature-launch']
      },
      {
        id: 'anal-002',
        category: 'analytical',
        question: 'Our user engagement dropped 15% last month. How would you investigate?',
        followUps: [
          'What data would you look at first?',
          'How would you prioritize potential causes?',
          'What experiments would you run?'
        ],
        evaluationCriteria: [
          'Systematic investigation approach',
          'Identifies multiple hypotheses',
          'Plans data analysis',
          'Proposes actionable solutions'
        ],
        frameworks: ['RICE'],
        roleLevel: ['PM', 'Senior PM'],
        difficulty: 4,
        tags: ['data-analysis', 'problem-solving', 'user-engagement']
      },

      // Technical Questions
      {
        id: 'tech-001',
        category: 'technical',
        question: 'Explain how you would work with engineers to estimate the technical complexity of a new feature.',
        followUps: [
          'What factors affect complexity estimation?',
          'How do you handle uncertainty in estimates?',
          'How do you balance technical debt vs new features?'
        ],
        evaluationCriteria: [
          'Shows technical understanding',
          'Demonstrates collaboration skills',
          'Considers trade-offs',
          'Plans risk mitigation'
        ],
        frameworks: ['RICE'],
        roleLevel: ['PM', 'Senior PM'],
        difficulty: 3,
        tags: ['technical-collaboration', 'estimation', 'engineering']
      },
      {
        id: 'tech-002',
        category: 'technical',
        question: 'How would you explain APIs to a non-technical stakeholder?',
        followUps: [
          'What analogies would you use?',
          'How would you explain the business value?',
          'What are the key considerations for API design?'
        ],
        evaluationCriteria: [
          'Uses clear analogies',
          'Connects to business value',
          'Shows technical knowledge',
          'Demonstrates communication skills'
        ],
        frameworks: [],
        roleLevel: ['APM', 'PM', 'Senior PM'],
        difficulty: 2,
        tags: ['technical-communication', 'apis', 'stakeholder-management']
      }
    ];
  }

  getQuestionsByCategory(category: QuestionCategory): InterviewQuestion[] {
    return this.questions.filter(q => q.category === category);
  }

  getQuestionsByRole(role: RoleLevel): InterviewQuestion[] {
    return this.questions.filter(q => q.roleLevel.includes(role));
  }

  getQuestionsByDifficulty(difficulty: number): InterviewQuestion[] {
    return this.questions.filter(q => q.difficulty === difficulty);
  }

  getRandomQuestion(filters?: QuestionFilters): InterviewQuestion {
    let filteredQuestions = [...this.questions];

    if (filters) {
      if (filters.category) {
        filteredQuestions = filteredQuestions.filter(q => q.category === filters.category);
      }
      if (filters.roleLevel) {
        filteredQuestions = filteredQuestions.filter(q => q.roleLevel.includes(filters.roleLevel));
      }
      if (filters.difficulty) {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
      }
      if (filters.company) {
        filteredQuestions = filteredQuestions.filter(q => !q.company || q.company === filters.company);
      }
      if (filters.excludeIds && filters.excludeIds.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => !filters.excludeIds!.includes(q.id));
      }
    }

    if (filteredQuestions.length === 0) {
      throw new Error('No questions match the specified filters');
    }

    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    return filteredQuestions[randomIndex];
  }

  getAllQuestions(): InterviewQuestion[] {
    return [...this.questions];
  }

  getQuestionById(id: string): InterviewQuestion | undefined {
    return this.questions.find(q => q.id === id);
  }

  addQuestion(question: InterviewQuestion): void {
    if (this.questions.some(q => q.id === question.id)) {
      throw new Error(`Question with ID ${question.id} already exists`);
    }
    this.questions.push(question);
  }

  getQuestionStats(): {
    totalQuestions: number;
    byCategory: Record<QuestionCategory, number>;
    byRole: Record<RoleLevel, number>;
    byDifficulty: Record<number, number>;
  } {
    const stats = {
      totalQuestions: this.questions.length,
      byCategory: {} as Record<QuestionCategory, number>,
      byRole: {} as Record<RoleLevel, number>,
      byDifficulty: {} as Record<number, number>
    };

    // Initialize counters
    const categories: QuestionCategory[] = ['behavioral', 'product_sense', 'analytical', 'technical'];
    const roles: RoleLevel[] = ['APM', 'PM', 'Senior PM'];
    
    categories.forEach(cat => stats.byCategory[cat] = 0);
    roles.forEach(role => stats.byRole[role] = 0);
    [1, 2, 3, 4, 5].forEach(diff => stats.byDifficulty[diff] = 0);

    // Count questions
    this.questions.forEach(q => {
      stats.byCategory[q.category]++;
      q.roleLevel.forEach(role => stats.byRole[role]++);
      stats.byDifficulty[q.difficulty]++;
    });

    return stats;
  }
}