// Integration tests for end-to-end PM workflow
// Tests complete PM workflow: raw intent → requirements → design → tasks → one-pager → PR-FAQ

import { PMDocumentGenerator } from '../../components/pm-document-generator';
import { AIAgentPipeline } from '../../pipeline/ai-agent-pipeline';

describe('PM Workflow End-to-End Tests', () => {
  let pmGenerator: PMDocumentGenerator;
  let pipeline: AIAgentPipeline;

  beforeEach(() => {
    pmGenerator = new PMDocumentGenerator();
    pipeline = new AIAgentPipeline();
  });

  describe('Complete PM Workflow Tests', () => {
    it('should execute complete workflow from raw intent to all PM documents', async () => {
      const rawIntent = 'I want to build a system that optimizes developer workflows and reduces quota consumption through intelligent analysis and consulting techniques.';
      
      // Step 1: Generate requirements from raw intent
      const requirements = await pmGenerator.generateRequirements(rawIntent, {
        roadmapTheme: 'Developer Productivity',
        budget: 500000,
        quotas: { maxVibes: 10000, maxSpecs: 1000 },
        deadlines: 'Q2 2025 launch target'
      });
      
      expect(requirements).toBeDefined();
      expect(requirements.businessGoal).toBeDefined();
      expect(requirements.priority.must.length).toBeGreaterThan(0);
      expect(requirements.rightTimeVerdict.decision).toMatch(/^(do_now|do_later)$/);
      
      // Step 2: Generate design options from requirements
      const requirementsDoc = formatRequirementsAsDocument(requirements);
      const designOptions = await pmGenerator.generateDesignOptions(requirementsDoc);
      
      expect(designOptions).toBeDefined();
      expect(designOptions.options.conservative).toBeDefined();
      expect(designOptions.options.balanced).toBeDefined();
      expect(designOptions.options.bold).toBeDefined();
      
      // Step 3: Generate task plan from design
      const designDoc = formatDesignOptionsAsDocument(designOptions);
      const taskPlan = await pmGenerator.generateTaskPlan(designDoc, {
        maxVibes: 10000,
        maxSpecs: 1000,
        budgetUSD: 500000
      });
      
      expect(taskPlan).toBeDefined();
      expect(taskPlan.guardrailsCheck.id).toBe('0');
      expect(taskPlan.immediateWins.length).toBeGreaterThan(0);
      expect(taskPlan.shortTerm.length).toBeGreaterThan(0);
      
      // Step 4: Generate management one-pager
      const tasksDoc = formatTaskPlanAsDocument(taskPlan);
      const onePager = await pmGenerator.generateManagementOnePager(
        requirementsDoc,
        designDoc,
        tasksDoc,
        { cost_naive: 100000, cost_balanced: 300000, cost_bold: 500000 }
      );
      
      expect(onePager).toBeDefined();
      expect(onePager.answer).toBeDefined();
      expect(onePager.because).toHaveLength(3);
      expect(onePager.options.balanced.recommended).toBe(true);
      
      // Step 5: Generate PR-FAQ
      const prfaq = await pmGenerator.generatePRFAQ(
        requirementsDoc,
        designDoc,
        '2025-06-01'
      );
      
      expect(prfaq).toBeDefined();
      expect(prfaq.pressRelease.date).toBe('2025-06-01');
      expect(prfaq.faq).toHaveLength(10);
      expect(prfaq.launchChecklist.length).toBeGreaterThanOrEqual(5);
      
      // Validate workflow consistency
      validateWorkflowConsistency(requirements, designOptions, taskPlan, onePager, prfaq);
    }, 30000); // Extended timeout for full workflow

    it('should maintain document consistency across workflow phases', async () => {
      const rawIntent = 'Create an AI-powered quota optimization system for developers using consulting methodologies.';
      
      // Generate all documents
      const requirements = await pmGenerator.generateRequirements(rawIntent);
      const requirementsDoc = formatRequirementsAsDocument(requirements);
      
      const designOptions = await pmGenerator.generateDesignOptions(requirementsDoc);
      const designDoc = formatDesignOptionsAsDocument(designOptions);
      
      const taskPlan = await pmGenerator.generateTaskPlan(designDoc);
      const tasksDoc = formatTaskPlanAsDocument(taskPlan);
      
      const onePager = await pmGenerator.generateManagementOnePager(requirementsDoc, designDoc, tasksDoc);
      const prfaq = await pmGenerator.generatePRFAQ(requirementsDoc, designDoc);
      
      // Check consistency across documents
      
      // Business goal consistency
      const businessGoalKeywords = extractKeywords(requirements.businessGoal);
      expect(containsKeywords(onePager.answer, businessGoalKeywords)).toBe(true);
      expect(containsKeywords(prfaq.pressRelease.headline, businessGoalKeywords)).toBe(true);
      
      // Scope consistency
      const scopeKeywords = extractKeywords(onePager.whatScopeToday.join(' '));
      const taskNames = taskPlan.immediateWins.concat(taskPlan.shortTerm).map(t => t.name).join(' ');
      expect(containsKeywords(taskNames, scopeKeywords)).toBe(true);
      
      // Risk consistency
      const riskKeywords = onePager.risksAndMitigations.map(rm => rm.risk).join(' ');
      const designRisks = Object.values(designOptions.options).flatMap(o => o.majorRisks).join(' ');
      expect(hasOverlappingConcerns(riskKeywords, designRisks)).toBe(true);
    });

    it('should handle realistic PM scenarios with stakeholder needs', async () => {
      const scenarios = [
        {
          name: 'Enterprise Integration Scenario',
          intent: 'Build an enterprise-grade system that integrates with existing developer tools and provides ROI tracking for management.',
          context: {
            roadmapTheme: 'Enterprise Integration',
            budget: 1000000,
            quotas: { maxVibes: 50000, maxSpecs: 5000 },
            deadlines: 'Q3 2025 enterprise rollout'
          }
        },
        {
          name: 'Startup MVP Scenario',
          intent: 'Create a lightweight quota optimization tool that can be built quickly with limited resources.',
          context: {
            roadmapTheme: 'MVP Launch',
            budget: 100000,
            quotas: { maxVibes: 5000, maxSpecs: 500 },
            deadlines: 'Q1 2025 beta launch'
          }
        },
        {
          name: 'Scale-up Growth Scenario',
          intent: 'Develop a comprehensive developer productivity platform with advanced analytics and optimization.',
          context: {
            roadmapTheme: 'Growth Platform',
            budget: 750000,
            quotas: { maxVibes: 25000, maxSpecs: 2500 },
            deadlines: 'Q2 2025 series A milestone'
          }
        }
      ];

      for (const scenario of scenarios) {
        const requirements = await pmGenerator.generateRequirements(scenario.intent, scenario.context);
        
        // Validate scenario-specific adaptations
        if (scenario.name.includes('Enterprise')) {
          expect(requirements.businessGoal.toLowerCase()).toMatch(/(enterprise|integration|scale|security)/);
          expect(requirements.constraintsRisks.some(r => r.toLowerCase().includes('enterprise'))).toBe(true);
        }
        
        if (scenario.name.includes('MVP')) {
          expect(requirements.priority.must.length).toBeLessThanOrEqual(3); // Focused scope
          expect(requirements.rightTimeVerdict.decision).toBe('do_now'); // Urgency for MVP
        }
        
        if (scenario.name.includes('Growth')) {
          expect(requirements.userNeeds.gains.some(g => g.toLowerCase().includes('analytics'))).toBe(true);
          expect(requirements.functionalRequirements.some(r => r.toLowerCase().includes('advanced'))).toBe(true);
        }
        
        // Generate downstream documents and validate consistency
        const requirementsDoc = formatRequirementsAsDocument(requirements);
        const designOptions = await pmGenerator.generateDesignOptions(requirementsDoc);
        
        // Budget constraints should influence design options
        if (scenario.context.budget < 200000) {
          expect(designOptions.options.conservative.effort).toBe('Low');
        }
        
        const onePager = await pmGenerator.generateManagementOnePager(requirementsDoc, formatDesignOptionsAsDocument(designOptions));
        
        // ROI should reflect budget constraints
        const roiCosts = [
          onePager.roiSnapshot.options.conservative.estimatedCost,
          onePager.roiSnapshot.options.balanced.estimatedCost,
          onePager.roiSnapshot.options.bold.estimatedCost
        ];
        
        roiCosts.forEach(cost => {
          const costValue = parseCostString(cost);
          expect(costValue).toBeLessThanOrEqual(scenario.context.budget * 1.5); // Reasonable budget alignment
        });
      }
    });
  });

  describe('PM Document Performance Tests', () => {
    it('should generate PM documents within acceptable time limits', async () => {
      const rawIntent = 'Build a quota optimization system with consulting analysis and ROI forecasting.';
      
      // Requirements generation should be fast
      const reqStart = Date.now();
      const requirements = await pmGenerator.generateRequirements(rawIntent);
      const reqTime = Date.now() - reqStart;
      expect(reqTime).toBeLessThan(10000); // 10 seconds max
      
      // Design options should be reasonable
      const designStart = Date.now();
      const requirementsDoc = formatRequirementsAsDocument(requirements);
      const designOptions = await pmGenerator.generateDesignOptions(requirementsDoc);
      const designTime = Date.now() - designStart;
      expect(designTime).toBeLessThan(15000); // 15 seconds max
      
      // Task plan should be efficient
      const taskStart = Date.now();
      const designDoc = formatDesignOptionsAsDocument(designOptions);
      const taskPlan = await pmGenerator.generateTaskPlan(designDoc);
      const taskTime = Date.now() - taskStart;
      expect(taskTime).toBeLessThan(12000); // 12 seconds max
      
      // Management one-pager should be quick
      const onePagerStart = Date.now();
      const tasksDoc = formatTaskPlanAsDocument(taskPlan);
      const onePager = await pmGenerator.generateManagementOnePager(requirementsDoc, designDoc, tasksDoc);
      const onePagerTime = Date.now() - onePagerStart;
      expect(onePagerTime).toBeLessThan(8000); // 8 seconds max
      
      // PR-FAQ should be reasonable
      const prfaqStart = Date.now();
      const prfaq = await pmGenerator.generatePRFAQ(requirementsDoc, designDoc);
      const prfaqTime = Date.now() - prfaqStart;
      expect(prfaqTime).toBeLessThan(10000); // 10 seconds max
      
      // Total workflow should complete in reasonable time
      const totalTime = reqTime + designTime + taskTime + onePagerTime + prfaqTime;
      expect(totalTime).toBeLessThan(45000); // 45 seconds total max
    });

    it('should maintain quality under various input sizes', async () => {
      const inputSizes = [
        { name: 'Short', intent: 'Build quota optimizer.' },
        { name: 'Medium', intent: 'Build a comprehensive quota optimization system that helps developers reduce costs through intelligent workflow analysis and consulting-grade recommendations.' },
        { name: 'Long', intent: 'Build an enterprise-grade quota optimization and developer productivity platform that leverages advanced AI techniques, professional consulting methodologies including MECE analysis and Pyramid Principle communication, comprehensive ROI forecasting with multiple scenario modeling, seamless integration with existing developer toolchains, real-time workflow monitoring and optimization, advanced analytics and reporting capabilities, and scalable architecture to support thousands of developers across multiple organizations with varying quota constraints and optimization requirements.' }
      ];

      for (const inputSize of inputSizes) {
        const requirements = await pmGenerator.generateRequirements(inputSize.intent);
        
        // Quality should be maintained regardless of input size
        expect(requirements.businessGoal).toBeDefined();
        expect(requirements.businessGoal.length).toBeGreaterThan(30);
        expect(requirements.priority.must.length).toBeGreaterThan(0);
        expect(requirements.userNeeds.jobs.length).toBeGreaterThan(0);
        
        // Generate downstream documents
        const requirementsDoc = formatRequirementsAsDocument(requirements);
        const designOptions = await pmGenerator.generateDesignOptions(requirementsDoc);
        
        expect(designOptions.options.conservative).toBeDefined();
        expect(designOptions.options.balanced).toBeDefined();
        expect(designOptions.options.bold).toBeDefined();
        
        // Validate consistent quality metrics
        expect(designOptions.problemFraming.split('. ').length).toBeGreaterThanOrEqual(3);
        expect(designOptions.rightTimeRecommendation.length).toBeGreaterThan(50);
      }
    });
  });
});

// Helper functions for workflow testing

function validateWorkflowConsistency(
  requirements: any,
  designOptions: any,
  taskPlan: any,
  onePager: any,
  prfaq: any
): void {
  // Business goal should be reflected across all documents
  const businessKeywords = extractKeywords(requirements.businessGoal);
  
  expect(containsKeywords(onePager.answer, businessKeywords)).toBe(true);
  expect(containsKeywords(prfaq.pressRelease.headline, businessKeywords)).toBe(true);
  
  // Must requirements should be reflected in immediate wins
  const mustRequirements = requirements.priority.must.map((r: any) => r.requirement).join(' ');
  const immediateWinNames = taskPlan.immediateWins.map((t: any) => t.name).join(' ');
  expect(hasOverlappingConcerns(mustRequirements, immediateWinNames)).toBe(true);
  
  // Design risks should align with one-pager risks
  const designRisks = Object.values(designOptions.options).flatMap((o: any) => o.majorRisks).join(' ');
  const onePagerRisks = onePager.risksAndMitigations.map((rm: any) => rm.risk).join(' ');
  expect(hasOverlappingConcerns(designRisks, onePagerRisks)).toBe(true);
  
  // Timeline consistency
  if (requirements.rightTimeVerdict.decision === 'do_now') {
    expect(onePager.roiSnapshot.options.balanced.timing).toBe('Now');
  }
  
  // Scope consistency between one-pager and task plan
  const scopeItems = onePager.whatScopeToday.join(' ').toLowerCase();
  const taskDescriptions = [
    ...taskPlan.immediateWins,
    ...taskPlan.shortTerm.slice(0, 2) // First few short-term tasks
  ].map((t: any) => t.description).join(' ').toLowerCase();
  
  expect(hasOverlappingConcerns(scopeItems, taskDescriptions)).toBe(true);
}

function formatRequirementsAsDocument(requirements: any): string {
  return `# Requirements Document

## Business Goal
${requirements.businessGoal}

## User Needs

### Jobs to be Done
${requirements.userNeeds.jobs.map((job: string) => `- ${job}`).join('\n')}

### Pains
${requirements.userNeeds.pains.map((pain: string) => `- ${pain}`).join('\n')}

### Gains
${requirements.userNeeds.gains.map((gain: string) => `- ${gain}`).join('\n')}

## Functional Requirements
${requirements.functionalRequirements.map((req: string) => `- ${req}`).join('\n')}

## Constraints and Risks
${requirements.constraintsRisks.map((risk: string) => `- ${risk}`).join('\n')}

## Priority (MoSCoW)

### Must Have
${requirements.priority.must.map((item: any) => `- ${item.requirement} (${item.justification})`).join('\n')}

### Should Have
${requirements.priority.should.map((item: any) => `- ${item.requirement} (${item.justification})`).join('\n')}

### Could Have
${requirements.priority.could.map((item: any) => `- ${item.requirement} (${item.justification})`).join('\n')}

### Won't Have
${requirements.priority.wont.map((item: any) => `- ${item.requirement} (${item.justification})`).join('\n')}

## Right-Time Verdict
**Decision:** ${requirements.rightTimeVerdict.decision}
**Reasoning:** ${requirements.rightTimeVerdict.reasoning}`;
}

function formatDesignOptionsAsDocument(designOptions: any): string {
  return `# Design Options Document

## Problem Framing
${designOptions.problemFraming}

## Design Options

### Conservative Option
**Name:** ${designOptions.options.conservative.name}
**Summary:** ${designOptions.options.conservative.summary}
**Impact:** ${designOptions.options.conservative.impact}
**Effort:** ${designOptions.options.conservative.effort}
**Key Tradeoffs:**
${designOptions.options.conservative.keyTradeoffs.map((t: string) => `- ${t}`).join('\n')}
**Major Risks:**
${designOptions.options.conservative.majorRisks.map((r: string) => `- ${r}`).join('\n')}

### Balanced Option (Recommended)
**Name:** ${designOptions.options.balanced.name}
**Summary:** ${designOptions.options.balanced.summary}
**Impact:** ${designOptions.options.balanced.impact}
**Effort:** ${designOptions.options.balanced.effort}
**Key Tradeoffs:**
${designOptions.options.balanced.keyTradeoffs.map((t: string) => `- ${t}`).join('\n')}
**Major Risks:**
${designOptions.options.balanced.majorRisks.map((r: string) => `- ${r}`).join('\n')}

### Bold Option
**Name:** ${designOptions.options.bold.name}
**Summary:** ${designOptions.options.bold.summary}
**Impact:** ${designOptions.options.bold.impact}
**Effort:** ${designOptions.options.bold.effort}
**Key Tradeoffs:**
${designOptions.options.bold.keyTradeoffs.map((t: string) => `- ${t}`).join('\n')}
**Major Risks:**
${designOptions.options.bold.majorRisks.map((r: string) => `- ${r}`).join('\n')}

## Right-Time Recommendation
${designOptions.rightTimeRecommendation}`;
}

function formatTaskPlanAsDocument(taskPlan: any): string {
  return `# Task Plan Document

## Guardrails Check (Task 0)
**ID:** ${taskPlan.guardrailsCheck.id}
**Name:** ${taskPlan.guardrailsCheck.name}
**Description:** ${taskPlan.guardrailsCheck.description}
**Effort:** ${taskPlan.guardrailsCheck.effort}
**Impact:** ${taskPlan.guardrailsCheck.impact}
**Priority:** ${taskPlan.guardrailsCheck.priority}

**Limits:**
- Max Vibes: ${taskPlan.guardrailsCheck.limits.maxVibes}
- Max Specs: ${taskPlan.guardrailsCheck.limits.maxSpecs}
- Budget USD: $${taskPlan.guardrailsCheck.limits.budgetUSD}

**Check Criteria:**
${taskPlan.guardrailsCheck.checkCriteria.map((c: string) => `- ${c}`).join('\n')}

## Immediate Wins
${taskPlan.immediateWins.map((task: any) => `
### ${task.name}
**ID:** ${task.id}
**Description:** ${task.description}
**Effort:** ${task.effort}
**Impact:** ${task.impact}
**Priority:** ${task.priority}
**Acceptance Criteria:**
${task.acceptanceCriteria.map((ac: string) => `- ${ac}`).join('\n')}
`).join('\n')}

## Short-Term Tasks
${taskPlan.shortTerm.map((task: any) => `
### ${task.name}
**ID:** ${task.id}
**Description:** ${task.description}
**Effort:** ${task.effort}
**Impact:** ${task.impact}
**Priority:** ${task.priority}
**Acceptance Criteria:**
${task.acceptanceCriteria.map((ac: string) => `- ${ac}`).join('\n')}
`).join('\n')}

## Long-Term Tasks
${taskPlan.longTerm.map((task: any) => `
### ${task.name}
**ID:** ${task.id}
**Description:** ${task.description}
**Effort:** ${task.effort}
**Impact:** ${task.impact}
**Priority:** ${task.priority}
**Acceptance Criteria:**
${task.acceptanceCriteria.map((ac: string) => `- ${ac}`).join('\n')}
`).join('\n')}`;
}

function extractKeywords(text: string): string[] {
  // Extract meaningful keywords from text
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 10); // Top 10 keywords
}

function containsKeywords(text: string, keywords: string[]): boolean {
  const textLower = text.toLowerCase();
  const matchCount = keywords.filter(keyword => textLower.includes(keyword)).length;
  return matchCount >= Math.ceil(keywords.length * 0.3); // At least 30% keyword overlap
}

function hasOverlappingConcerns(text1: string, text2: string): boolean {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);
  
  const overlap = keywords1.filter(k => keywords2.includes(k)).length;
  return overlap >= Math.min(2, Math.ceil(Math.min(keywords1.length, keywords2.length) * 0.2)); // At least 20% overlap or 2 keywords
}

function parseCostString(costStr: string): number {
  // Parse cost strings like "$150K", "$1.5M", etc.
  const match = costStr.match(/\$?([\d,]+(?:\.\d+)?)\s*([KM])?/i);
  if (!match) return 0;
  
  let value = parseFloat(match[1].replace(/,/g, ''));
  const unit = match[2]?.toUpperCase();
  
  if (unit === 'K') value *= 1000;
  if (unit === 'M') value *= 1000000;
  
  return value;
}