/**
 * Framework Guidance System
 * Provides structured guidance for PM frameworks used in case studies
 */

import {
  CaseFramework,
  FrameworkGuidance,
  FrameworkTemplate,
  CaseStep,
  CaseStepType
} from '../../models/interview';

export class FrameworkGuidanceSystem {
  private guidanceMap: Map<CaseFramework, FrameworkGuidance> = new Map();

  constructor() {
    this.initializeFrameworkGuidance();
  }

  getFrameworkGuidance(framework: CaseFramework): FrameworkGuidance | undefined {
    return this.guidanceMap.get(framework);
  }

  getGuidanceForStep(step: CaseStep): FrameworkGuidance[] {
    return step.frameworks
      .map(framework => this.getFrameworkGuidance(framework))
      .filter((guidance): guidance is FrameworkGuidance => guidance !== undefined);
  }

  getRecommendedFrameworks(stepType: CaseStepType): CaseFramework[] {
    const recommendations: Record<CaseStepType, CaseFramework[]> = {
      'clarification': ['CIRCLES', 'Jobs_to_be_Done'],
      'analysis': ['SWOT', 'Porter_Five_Forces', 'CIRCLES'],
      'ideation': ['CIRCLES', 'Jobs_to_be_Done', 'Lean_Canvas'],
      'prioritization': ['RICE', 'North_Star', 'OKRs'],
      'metrics': ['North_Star', 'OKRs'],
      'recommendation': ['CIRCLES', 'SWOT', 'Lean_Canvas']
    };

    return recommendations[stepType] || [];
  }

  getAllFrameworks(): CaseFramework[] {
    return Array.from(this.guidanceMap.keys());
  }

  private initializeFrameworkGuidance(): void {
    this.guidanceMap.set('CIRCLES', this.createCirclesGuidance());
    this.guidanceMap.set('RICE', this.createRiceGuidance());
    this.guidanceMap.set('SWOT', this.createSwotGuidance());
    this.guidanceMap.set('Porter_Five_Forces', this.createPorterGuidance());
    this.guidanceMap.set('Jobs_to_be_Done', this.createJobsToBeeDoneGuidance());
    this.guidanceMap.set('North_Star', this.createNorthStarGuidance());
    this.guidanceMap.set('OKRs', this.createOkrsGuidance());
    this.guidanceMap.set('Lean_Canvas', this.createLeanCanvasGuidance());
  }

  private createCirclesGuidance(): FrameworkGuidance {
    return {
      framework: 'CIRCLES',
      description: 'A structured approach to product design questions covering Comprehend, Identify, Report, Cut, List, Evaluate, Summarize',
      steps: [
        'Comprehend the situation - Ask clarifying questions',
        'Identify the customer - Define user segments and personas',
        'Report customer needs - Analyze what users need',
        'Cut through prioritization - Prioritize features and solutions',
        'List solutions - Detail the proposed solution',
        'Evaluate tradeoffs - Define metrics and assess tradeoffs',
        'Summarize recommendation - Present final recommendation'
      ],
      whenToUse: 'Product design questions, feature development, user experience problems',
      examples: [
        'Design a product for busy parents',
        'How would you improve the checkout experience?',
        'Design a fitness app for seniors'
      ],
      commonMistakes: [
        'Skipping clarifying questions',
        'Not defining user segments clearly',
        'Jumping to solutions without understanding needs',
        'Forgetting to define success metrics'
      ],
      templates: [
        {
          name: 'CIRCLES Template',
          structure: `
**Comprehend**: [Clarifying questions and assumptions]
**Identify**: [User segments and personas]
**Report**: [Customer needs and pain points]
**Cut**: [Prioritized features/solutions]
**List**: [Detailed solution description]
**Evaluate**: [Success metrics and tradeoffs]
**Summarize**: [Final recommendation and next steps]
          `,
          example: `
**Comprehend**: What's the target demographic? Any technical constraints?
**Identify**: Primary users: Working parents aged 25-45
**Report**: Need: Quick, healthy meal planning
**Cut**: Top priority: Meal planning with grocery integration
**List**: App with meal suggestions, shopping lists, nutrition tracking
**Evaluate**: Success metrics: Daily active users, meal completion rate
**Summarize**: Recommend MVP with core meal planning features
          `,
          placeholders: {
            'situation': 'Define the problem or opportunity',
            'users': 'Identify target user segments',
            'needs': 'List customer needs and pain points',
            'solutions': 'Prioritized list of solutions',
            'details': 'Detailed solution description',
            'metrics': 'Success metrics and tradeoffs',
            'recommendation': 'Final recommendation'
          }
        }
      ]
    };
  }

  private createRiceGuidance(): FrameworkGuidance {
    return {
      framework: 'RICE',
      description: 'Prioritization framework using Reach × Impact × Confidence ÷ Effort to score initiatives',
      steps: [
        'Define Reach - How many users will be affected?',
        'Assess Impact - How much will it impact each user?',
        'Estimate Confidence - How confident are you in your estimates?',
        'Calculate Effort - How much work is required?',
        'Compute RICE Score - (Reach × Impact × Confidence) ÷ Effort',
        'Rank and prioritize based on scores'
      ],
      whenToUse: 'Feature prioritization, roadmap planning, resource allocation decisions',
      examples: [
        'Prioritizing product features for next quarter',
        'Choosing between different growth initiatives',
        'Allocating engineering resources across projects'
      ],
      commonMistakes: [
        'Inconsistent scoring scales across items',
        'Overestimating confidence without data',
        'Not considering opportunity costs',
        'Ignoring strategic alignment'
      ],
      templates: [
        {
          name: 'RICE Scoring Template',
          structure: `
| Feature | Reach | Impact | Confidence | Effort | RICE Score |
|---------|-------|--------|------------|--------|------------|
| [Feature Name] | [Users/month] | [1-3 scale] | [0-100%] | [Person-months] | [Calculated] |
          `,
          example: `
| Feature | Reach | Impact | Confidence | Effort | RICE Score |
|---------|-------|--------|------------|--------|------------|
| Push Notifications | 10,000 | 2 | 80% | 2 | 8,000 |
| Dark Mode | 5,000 | 1 | 90% | 1 | 4,500 |
| Social Sharing | 8,000 | 3 | 60% | 3 | 4,800 |
          `,
          placeholders: {
            'reach': 'Number of users affected per time period',
            'impact': 'Impact per user (1=minimal, 2=low, 3=medium, 4=high, 5=massive)',
            'confidence': 'Confidence percentage (0-100%)',
            'effort': 'Development effort in person-months',
            'score': '(Reach × Impact × Confidence) ÷ Effort'
          }
        }
      ]
    };
  }

  private createSwotGuidance(): FrameworkGuidance {
    return {
      framework: 'SWOT',
      description: 'Strategic analysis framework examining Strengths, Weaknesses, Opportunities, and Threats',
      steps: [
        'Identify Strengths - Internal positive factors',
        'Identify Weaknesses - Internal negative factors',
        'Identify Opportunities - External positive factors',
        'Identify Threats - External negative factors',
        'Analyze intersections and strategic implications',
        'Develop strategies based on SWOT insights'
      ],
      whenToUse: 'Strategic planning, competitive analysis, market entry decisions, business planning',
      examples: [
        'Analyzing market entry opportunity',
        'Strategic planning for new product launch',
        'Competitive positioning analysis'
      ],
      commonMistakes: [
        'Confusing internal vs external factors',
        'Being too generic or vague',
        'Not prioritizing factors by importance',
        'Failing to develop actionable strategies'
      ],
      templates: [
        {
          name: 'SWOT Matrix',
          structure: `
| Strengths (Internal Positive) | Weaknesses (Internal Negative) |
|-------------------------------|--------------------------------|
| [List internal advantages]    | [List internal disadvantages]  |

| Opportunities (External Positive) | Threats (External Negative) |
|-----------------------------------|------------------------------|
| [List external opportunities]     | [List external threats]      |
          `,
          example: `
| Strengths | Weaknesses |
|-----------|------------|
| Strong brand recognition | Limited technical expertise |
| Large user base | Slow product development |

| Opportunities | Threats |
|---------------|---------|
| Growing mobile market | New competitors entering |
| AI/ML technology trends | Regulatory changes |
          `,
          placeholders: {
            'strengths': 'Internal positive factors and advantages',
            'weaknesses': 'Internal negative factors and limitations',
            'opportunities': 'External positive factors and market opportunities',
            'threats': 'External negative factors and potential risks'
          }
        }
      ]
    };
  }

  private createPorterGuidance(): FrameworkGuidance {
    return {
      framework: 'Porter_Five_Forces',
      description: 'Framework for analyzing competitive forces: rivalry, supplier power, buyer power, substitutes, new entrants',
      steps: [
        'Analyze Competitive Rivalry - Intensity of competition',
        'Assess Supplier Power - Bargaining power of suppliers',
        'Evaluate Buyer Power - Bargaining power of customers',
        'Examine Threat of Substitutes - Alternative solutions',
        'Consider Threat of New Entrants - Barriers to entry',
        'Synthesize overall industry attractiveness'
      ],
      whenToUse: 'Industry analysis, market entry decisions, competitive strategy, business planning',
      examples: [
        'Analyzing attractiveness of entering ride-sharing market',
        'Understanding competitive dynamics in SaaS industry',
        'Evaluating market position for strategic planning'
      ],
      commonMistakes: [
        'Analyzing forces in isolation',
        'Not considering digital disruption',
        'Focusing only on direct competitors',
        'Ignoring changing market dynamics'
      ],
      templates: [
        {
          name: 'Five Forces Analysis',
          structure: `
**Competitive Rivalry**: [High/Medium/Low]
- [Key competitive factors]

**Supplier Power**: [High/Medium/Low]
- [Supplier concentration and switching costs]

**Buyer Power**: [High/Medium/Low]
- [Customer concentration and alternatives]

**Threat of Substitutes**: [High/Medium/Low]
- [Alternative solutions and switching costs]

**Threat of New Entrants**: [High/Medium/Low]
- [Barriers to entry and capital requirements]

**Overall Industry Attractiveness**: [High/Medium/Low]
          `,
          example: `
**Competitive Rivalry**: High
- Many established players, price competition

**Supplier Power**: Low
- Multiple technology vendors available

**Buyer Power**: Medium
- Customers have alternatives but switching costs exist

**Threat of Substitutes**: High
- Multiple alternative solutions available

**Threat of New Entrants**: Medium
- Moderate barriers due to technology requirements

**Overall Industry Attractiveness**: Medium
          `,
          placeholders: {
            'rivalry': 'Intensity and nature of competitive rivalry',
            'suppliers': 'Supplier concentration and bargaining power',
            'buyers': 'Customer power and alternatives',
            'substitutes': 'Alternative solutions and threat level',
            'entrants': 'Barriers to entry and new competitor threats',
            'attractiveness': 'Overall industry attractiveness assessment'
          }
        }
      ]
    };
  }

  private createJobsToBeeDoneGuidance(): FrameworkGuidance {
    return {
      framework: 'Jobs_to_be_Done',
      description: 'Framework focusing on the functional, emotional, and social jobs customers hire products to do',
      steps: [
        'Identify the core functional job',
        'Understand emotional jobs (feelings)',
        'Consider social jobs (perception by others)',
        'Map the customer journey and job steps',
        'Identify pain points and desired outcomes',
        'Design solutions that get the job done better'
      ],
      whenToUse: 'Product development, user research, innovation, market segmentation',
      examples: [
        'Understanding why people buy milkshakes',
        'Designing a better commuting experience',
        'Improving online shopping experience'
      ],
      commonMistakes: [
        'Focusing only on functional jobs',
        'Confusing jobs with solutions',
        'Not considering the full job journey',
        'Ignoring emotional and social dimensions'
      ],
      templates: [
        {
          name: 'Jobs-to-be-Done Canvas',
          structure: `
**Functional Job**: [What task is the customer trying to accomplish?]

**Emotional Job**: [How does the customer want to feel?]

**Social Job**: [How does the customer want to be perceived?]

**Job Steps**: [What are the steps in completing the job?]

**Pain Points**: [What frustrates customers in each step?]

**Desired Outcomes**: [What would success look like?]

**Solution Opportunities**: [How can we help get the job done better?]
          `,
          example: `
**Functional Job**: Get to work on time

**Emotional Job**: Feel relaxed and prepared for the day

**Social Job**: Be seen as reliable and professional

**Job Steps**: Plan route → Travel → Arrive → Park/Enter

**Pain Points**: Traffic uncertainty, parking difficulty, stress

**Desired Outcomes**: Predictable commute time, low stress

**Solution Opportunities**: Real-time traffic optimization, reserved parking
          `,
          placeholders: {
            'functional': 'Core task or objective to accomplish',
            'emotional': 'Desired emotional state or feeling',
            'social': 'Desired social perception or status',
            'steps': 'Sequential steps in the job process',
            'pains': 'Frustrations and obstacles in each step',
            'outcomes': 'Ideal end state and success criteria',
            'opportunities': 'Ways to improve job completion'
          }
        }
      ]
    };
  }

  private createNorthStarGuidance(): FrameworkGuidance {
    return {
      framework: 'North_Star',
      description: 'Framework for defining the key metric that captures the core value delivered to customers',
      steps: [
        'Identify core customer value proposition',
        'Define the North Star Metric that captures this value',
        'Identify supporting input metrics',
        'Set targets and track progress',
        'Align team efforts around the North Star',
        'Regularly review and adjust as needed'
      ],
      whenToUse: 'Product strategy, team alignment, metric definition, growth planning',
      examples: [
        'Spotify: Time spent listening',
        'Airbnb: Nights booked',
        'Slack: Messages sent by teams'
      ],
      commonMistakes: [
        'Choosing vanity metrics over value metrics',
        'Having multiple North Star metrics',
        'Not connecting to customer value',
        'Ignoring leading indicators'
      ],
      templates: [
        {
          name: 'North Star Framework',
          structure: `
**North Star Metric**: [Single metric that captures customer value]

**Why This Metric**: [Connection to customer value and business success]

**Input Metrics**: [Leading indicators that drive the North Star]
- [Metric 1]: [Description and target]
- [Metric 2]: [Description and target]
- [Metric 3]: [Description and target]

**Current Performance**: [Current metric values]

**Targets**: [Short-term and long-term goals]

**Action Plan**: [Key initiatives to improve the metric]
          `,
          example: `
**North Star Metric**: Weekly Active Users completing core workflow

**Why This Metric**: Captures both engagement and value realization

**Input Metrics**:
- New user activation rate: 60%
- Feature adoption rate: 40%
- User retention (Week 1): 70%

**Current Performance**: 10,000 WAU completing workflow

**Targets**: 15,000 WAU by Q2, 25,000 WAU by year-end

**Action Plan**: Improve onboarding, enhance core features, reduce friction
          `,
          placeholders: {
            'metric': 'Single metric capturing core customer value',
            'rationale': 'Why this metric represents success',
            'inputs': 'Leading indicators that drive the North Star',
            'current': 'Current performance baseline',
            'targets': 'Specific goals and timeline',
            'actions': 'Key initiatives to improve performance'
          }
        }
      ]
    };
  }

  private createOkrsGuidance(): FrameworkGuidance {
    return {
      framework: 'OKRs',
      description: 'Objectives and Key Results framework for setting and tracking ambitious goals',
      steps: [
        'Define inspiring Objectives (what you want to achieve)',
        'Set measurable Key Results (how you\'ll know you succeeded)',
        'Ensure Key Results are specific, measurable, and time-bound',
        'Align OKRs across teams and levels',
        'Track progress regularly',
        'Review and learn from results'
      ],
      whenToUse: 'Goal setting, strategic planning, team alignment, performance tracking',
      examples: [
        'Improve user engagement',
        'Expand market presence',
        'Enhance product quality'
      ],
      commonMistakes: [
        'Setting too many objectives',
        'Making Key Results too easy or too hard',
        'Not aligning across teams',
        'Treating OKRs as performance reviews'
      ],
      templates: [
        {
          name: 'OKR Template',
          structure: `
**Objective**: [Inspiring, qualitative goal]

**Key Results**:
1. [Specific, measurable outcome with target and deadline]
2. [Specific, measurable outcome with target and deadline]
3. [Specific, measurable outcome with target and deadline]

**Initiatives**: [Key projects/actions to achieve the objective]

**Success Criteria**: [How to measure overall success]
          `,
          example: `
**Objective**: Become the go-to platform for remote team collaboration

**Key Results**:
1. Increase daily active teams from 1,000 to 2,500 by Q4
2. Achieve 90% user satisfaction score in quarterly survey
3. Launch 3 new collaboration features with >60% adoption

**Initiatives**: Enhanced video calling, improved file sharing, mobile app

**Success Criteria**: 70% achievement across all Key Results
          `,
          placeholders: {
            'objective': 'Inspiring, qualitative goal statement',
            'kr1': 'First measurable key result with target',
            'kr2': 'Second measurable key result with target',
            'kr3': 'Third measurable key result with target',
            'initiatives': 'Key projects to achieve the objective',
            'success': 'Overall success measurement approach'
          }
        }
      ]
    };
  }

  private createLeanCanvasGuidance(): FrameworkGuidance {
    return {
      framework: 'Lean_Canvas',
      description: 'One-page business model focusing on problems, solutions, and key metrics',
      steps: [
        'Identify the Problem and target Customer Segments',
        'Define your Unique Value Proposition',
        'Describe your Solution approach',
        'Identify Revenue Streams and Cost Structure',
        'Define Key Metrics and Unfair Advantage',
        'Plan Channels and validate assumptions'
      ],
      whenToUse: 'Business model design, startup planning, product strategy, market validation',
      examples: [
        'New product launch planning',
        'Business model pivot analysis',
        'Market entry strategy'
      ],
      commonMistakes: [
        'Being too generic in problem definition',
        'Not validating assumptions with customers',
        'Overcomplicating the solution',
        'Ignoring cost structure and unit economics'
      ],
      templates: [
        {
          name: 'Lean Canvas',
          structure: `
| Problem | Solution | Unique Value Proposition | Unfair Advantage | Customer Segments |
|---------|----------|-------------------------|------------------|-------------------|
| [Top 3 problems] | [Top 3 features] | [Single, clear message] | [Can't be copied] | [Target users] |

| Key Metrics | Channels | Revenue Streams | Cost Structure |
|-------------|----------|-----------------|----------------|
| [Key numbers] | [Path to customers] | [Revenue model] | [Key costs] |
          `,
          example: `
| Problem | Solution | Unique Value Proposition | Unfair Advantage | Customer Segments |
|---------|----------|-------------------------|------------------|-------------------|
| Hard to find parking | Mobile parking app | Find and pay for parking in 30 seconds | Real-time data partnerships | Urban commuters |

| Key Metrics | Channels | Revenue Streams | Cost Structure |
|-------------|----------|-----------------|----------------|
| Bookings per user | App stores, partnerships | Transaction fees, subscriptions | Technology, partnerships |
          `,
          placeholders: {
            'problem': 'Top 3 customer problems you solve',
            'solution': 'Top 3 features that solve problems',
            'value_prop': 'Single, compelling value proposition',
            'advantage': 'Unfair advantage that can\'t be copied',
            'segments': 'Target customer segments',
            'metrics': 'Key metrics that matter',
            'channels': 'How you reach customers',
            'revenue': 'How you make money',
            'costs': 'Key cost drivers'
          }
        }
      ]
    };
  }
}