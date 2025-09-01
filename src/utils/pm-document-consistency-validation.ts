// Cross-document consistency validation for PM documents
// Ensures alignment between requirements, design, management one-pagers, PR-FAQs, and task plans

import { 
  ManagementOnePager, 
  PRFAQ, 
  PMRequirements, 
  DesignOptions, 
  TaskPlan,
  Task,
  DesignOption,
  PriorityItem
} from '../components/pm-document-generator';
import { ValidationError } from './validation';

export interface ConsistencyValidationResult {
  isValid: boolean;
  errors: ConsistencyError[];
  warnings: ConsistencyWarning[];
}

export interface ConsistencyError {
  type: 'alignment' | 'missing' | 'contradiction' | 'format';
  severity: 'high' | 'medium' | 'low';
  message: string;
  documents: string[];
  field?: string;
}

export interface ConsistencyWarning {
  type: 'potential_misalignment' | 'missing_detail' | 'format_issue';
  message: string;
  documents: string[];
  suggestion?: string;
}

/**
 * PM Document Consistency Validator
 * Validates alignment between requirements, design, and PM documents
 */
export class PMDocumentConsistencyValidator {
  
  /**
   * Validate consistency between management one-pager and requirements/design
   */
  validateManagementOnePagerConsistency(
    onePager: ManagementOnePager,
    requirements?: PMRequirements,
    design?: DesignOptions
  ): ConsistencyValidationResult {
    const errors: ConsistencyError[] = [];
    const warnings: ConsistencyWarning[] = [];

    // Validate against requirements if provided
    if (requirements) {
      this.validateOnePagerRequirementsAlignment(onePager, requirements, errors, warnings);
    }

    // Validate against design if provided
    if (design) {
      this.validateOnePagerDesignAlignment(onePager, design, errors, warnings);
    }

    // Validate internal consistency of one-pager
    this.validateOnePagerInternalConsistency(onePager, errors, warnings);

    return {
      isValid: errors.filter(e => e.severity === 'high').length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate consistency between PR-FAQ and requirements/design
   */
  validatePRFAQConsistency(
    prfaq: PRFAQ,
    requirements?: PMRequirements,
    design?: DesignOptions
  ): ConsistencyValidationResult {
    const errors: ConsistencyError[] = [];
    const warnings: ConsistencyWarning[] = [];

    // Validate against requirements if provided
    if (requirements) {
      this.validatePRFAQRequirementsAlignment(prfaq, requirements, errors, warnings);
    }

    // Validate against design if provided
    if (design) {
      this.validatePRFAQDesignAlignment(prfaq, design, errors, warnings);
    }

    // Validate internal consistency of PR-FAQ
    this.validatePRFAQInternalConsistency(prfaq, errors, warnings);

    return {
      isValid: errors.filter(e => e.severity === 'high').length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate consistency between task plan and design/requirements
   */
  validateTaskPlanConsistency(
    taskPlan: TaskPlan,
    design?: DesignOptions,
    requirements?: PMRequirements
  ): ConsistencyValidationResult {
    const errors: ConsistencyError[] = [];
    const warnings: ConsistencyWarning[] = [];

    // Validate against design if provided
    if (design) {
      this.validateTaskPlanDesignAlignment(taskPlan, design, errors, warnings);
    }

    // Validate against requirements if provided
    if (requirements) {
      this.validateTaskPlanRequirementsAlignment(taskPlan, requirements, errors, warnings);
    }

    // Validate internal consistency of task plan
    this.validateTaskPlanInternalConsistency(taskPlan, errors, warnings);

    return {
      isValid: errors.filter(e => e.severity === 'high').length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate consistency across all PM documents
   */
  validateCrossDocumentConsistency(
    documents: {
      requirements?: PMRequirements;
      design?: DesignOptions;
      onePager?: ManagementOnePager;
      prfaq?: PRFAQ;
      taskPlan?: TaskPlan;
    }
  ): ConsistencyValidationResult {
    const errors: ConsistencyError[] = [];
    const warnings: ConsistencyWarning[] = [];

    const { requirements, design, onePager, prfaq, taskPlan } = documents;

    // Validate one-pager consistency
    if (onePager) {
      const onePagerResult = this.validateManagementOnePagerConsistency(onePager, requirements, design);
      errors.push(...onePagerResult.errors);
      warnings.push(...onePagerResult.warnings);
    }

    // Validate PR-FAQ consistency
    if (prfaq) {
      const prfaqResult = this.validatePRFAQConsistency(prfaq, requirements, design);
      errors.push(...prfaqResult.errors);
      warnings.push(...prfaqResult.warnings);
    }

    // Validate task plan consistency
    if (taskPlan) {
      const taskPlanResult = this.validateTaskPlanConsistency(taskPlan, design, requirements);
      errors.push(...taskPlanResult.errors);
      warnings.push(...taskPlanResult.warnings);
    }

    // Cross-document validation between one-pager and PR-FAQ
    if (onePager && prfaq) {
      this.validateOnePagerPRFAQAlignment(onePager, prfaq, errors, warnings);
    }

    // Cross-document validation between design and task plan
    if (design && taskPlan) {
      this.validateDesignTaskPlanAlignment(design, taskPlan, errors, warnings);
    }

    return {
      isValid: errors.filter(e => e.severity === 'high').length === 0,
      errors,
      warnings
    };
  }

  // Private validation methods

  private validateOnePagerRequirementsAlignment(
    onePager: ManagementOnePager,
    requirements: PMRequirements,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if business goal aligns with one-pager answer
    const businessGoalKeywords = this.extractKeywords(requirements.businessGoal);
    const answerKeywords = this.extractKeywords(onePager.answer);
    
    if (!this.hasKeywordOverlap(businessGoalKeywords, answerKeywords)) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'Management one-pager answer may not align with business goal from requirements',
        documents: ['ManagementOnePager', 'PMRequirements'],
        suggestion: 'Ensure the decision statement reflects the core business objective'
      });
    }

    // Check if scope items align with functional requirements
    const functionalReqKeywords = requirements.functionalRequirements.flatMap(req => this.extractKeywords(req));
    const scopeKeywords = onePager.whatScopeToday.flatMap(scope => this.extractKeywords(scope));
    
    if (!this.hasKeywordOverlap(functionalReqKeywords, scopeKeywords)) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'Scope items in one-pager may not cover key functional requirements',
        documents: ['ManagementOnePager', 'PMRequirements'],
        suggestion: 'Verify that scope items address the most critical functional requirements'
      });
    }

    // Check if risks align with constraints/risks from requirements
    const requirementRisks = this.extractKeywords(requirements.constraintsRisks.join(' '));
    const onePagerRisks = onePager.risksAndMitigations.flatMap(rm => this.extractKeywords(rm.risk));
    
    if (requirements.constraintsRisks.length > 0 && !this.hasKeywordOverlap(requirementRisks, onePagerRisks)) {
      warnings.push({
        type: 'missing_detail',
        message: 'Key risks from requirements may not be addressed in one-pager',
        documents: ['ManagementOnePager', 'PMRequirements'],
        suggestion: 'Consider including risks identified in requirements analysis'
      });
    }

    // Check MoSCoW priority alignment with options
    const mustHaveCount = requirements.priority.must.length;
    const shouldHaveCount = requirements.priority.should.length;
    
    if (mustHaveCount > 5 && onePager.options.balanced.summary.toLowerCase().includes('conservative')) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'High number of must-have requirements may not align with conservative balanced option',
        documents: ['ManagementOnePager', 'PMRequirements'],
        suggestion: 'Consider if balanced option adequately addresses must-have requirements'
      });
    }
  }

  private validateOnePagerDesignAlignment(
    onePager: ManagementOnePager,
    design: DesignOptions,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if options align between one-pager and design
    const designOptionNames = [design.options.conservative.name, design.options.balanced.name, design.options.bold.name];
    const onePagerOptionNames = [onePager.options.conservative.name, onePager.options.balanced.name, onePager.options.bold.name];
    
    if (!this.arraysMatch(designOptionNames, onePagerOptionNames)) {
      errors.push({
        type: 'alignment',
        severity: 'medium',
        message: 'Option names do not match between design options and management one-pager',
        documents: ['ManagementOnePager', 'DesignOptions'],
        field: 'options'
      });
    }

    // Check if impact/effort alignment makes sense
    const balancedDesignOption = design.options.balanced;
    const balancedOnePagerROI = onePager.roiSnapshot.options.balanced;
    
    // Check for impact contradictions
    if (balancedDesignOption.impact === 'High' && balancedOnePagerROI.impact === 'Med') {
      errors.push({
        type: 'contradiction',
        severity: 'high',
        message: 'Balanced option shows high impact in design but medium impact in ROI snapshot',
        documents: ['ManagementOnePager', 'DesignOptions'],
        field: 'balanced.impact'
      });
    }

    if (balancedDesignOption.impact === 'Low' && balancedOnePagerROI.impact === 'High') {
      errors.push({
        type: 'contradiction',
        severity: 'high',
        message: 'Balanced option shows low impact in design but high impact in ROI snapshot',
        documents: ['ManagementOnePager', 'DesignOptions'],
        field: 'balanced.impact'
      });
    }

    // Check for effort contradictions
    if (balancedDesignOption.effort === 'Medium' && balancedOnePagerROI.effort === 'Low') {
      errors.push({
        type: 'contradiction',
        severity: 'high',
        message: 'Balanced option shows medium effort in design but low effort in ROI snapshot',
        documents: ['ManagementOnePager', 'DesignOptions'],
        field: 'balanced.effort'
      });
    }

    if (balancedDesignOption.effort === 'High' && balancedOnePagerROI.effort === 'Low') {
      errors.push({
        type: 'contradiction',
        severity: 'high',
        message: 'Balanced option shows high effort in design but low effort in ROI snapshot',
        documents: ['ManagementOnePager', 'DesignOptions'],
        field: 'balanced.effort'
      });
    }

    // Check if timing recommendation aligns
    const designTimingKeywords = this.extractKeywords(design.rightTimeRecommendation);
    const onePagerTimingKeywords = this.extractKeywords(onePager.rightTimeRecommendation);
    
    if (!this.hasKeywordOverlap(designTimingKeywords, onePagerTimingKeywords)) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'Timing recommendations may not be consistent between design and one-pager',
        documents: ['ManagementOnePager', 'DesignOptions'],
        suggestion: 'Ensure timing rationale is consistent across documents'
      });
    }
  }

  private validateOnePagerInternalConsistency(
    onePager: ManagementOnePager,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if recommended option is marked correctly
    const recommendedOptions = [
      onePager.options.conservative.recommended,
      onePager.options.balanced.recommended,
      onePager.options.bold.recommended
    ].filter(Boolean);

    if (recommendedOptions.length !== 1) {
      errors.push({
        type: 'format',
        severity: 'medium',
        message: 'Exactly one option should be marked as recommended',
        documents: ['ManagementOnePager'],
        field: 'options.recommended'
      });
    }

    // Check if ROI snapshot aligns with option descriptions
    if (onePager.options.conservative.summary.toLowerCase().includes('advanced') && 
        onePager.roiSnapshot.options.conservative.effort === 'High') {
      warnings.push({
        type: 'potential_misalignment',
        message: 'Conservative option description suggests advanced features but ROI shows high effort',
        documents: ['ManagementOnePager'],
        suggestion: 'Ensure conservative option truly represents a low-effort approach'
      });
    }

    // Check if answer length is appropriate (should be concise)
    if (onePager.answer.length > 200) {
      warnings.push({
        type: 'format_issue',
        message: 'Answer statement is quite long - consider making it more concise',
        documents: ['ManagementOnePager'],
        suggestion: 'Keep the answer to one clear, decisive line'
      });
    }

    // Check if exactly 3 reasons are provided
    if (onePager.because.length !== 3) {
      errors.push({
        type: 'format',
        severity: 'medium',
        message: 'Exactly 3 core reasons should be provided in the because section',
        documents: ['ManagementOnePager'],
        field: 'because'
      });
    }

    // Check if exactly 3 risks are provided
    if (onePager.risksAndMitigations.length !== 3) {
      errors.push({
        type: 'format',
        severity: 'medium',
        message: 'Exactly 3 key risks with mitigations should be provided',
        documents: ['ManagementOnePager'],
        field: 'risksAndMitigations'
      });
    }
  }

  private validatePRFAQRequirementsAlignment(
    prfaq: PRFAQ,
    requirements: PMRequirements,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if press release problem aligns with business goal
    const businessGoalKeywords = this.extractKeywords(requirements.businessGoal);
    const pressReleaseKeywords = this.extractKeywords(prfaq.pressRelease.body);
    
    if (!this.hasKeywordOverlap(businessGoalKeywords, pressReleaseKeywords)) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'Press release may not clearly reflect the business goal from requirements',
        documents: ['PRFAQ', 'PMRequirements'],
        suggestion: 'Ensure press release body addresses the core business objective'
      });
    }

    // Check if customer identification aligns with user needs
    const customerFAQ = prfaq.faq.find(faq => faq.question.toLowerCase().includes('customer'));
    if (customerFAQ && requirements.userNeeds.jobs.length > 0) {
      const customerKeywords = this.extractKeywords(customerFAQ.answer);
      const jobsKeywords = requirements.userNeeds.jobs.flatMap(job => this.extractKeywords(job));
      
      if (!this.hasKeywordOverlap(customerKeywords, jobsKeywords)) {
        warnings.push({
          type: 'potential_misalignment',
          message: 'Customer definition in FAQ may not align with user jobs from requirements',
          documents: ['PRFAQ', 'PMRequirements'],
          suggestion: 'Ensure customer definition reflects the jobs to be done'
        });
      }
    }

    // Check if success metrics align with business goal
    const metricsFAQ = prfaq.faq.find(faq => faq.question.toLowerCase().includes('measure success'));
    if (metricsFAQ && requirements.businessGoal) {
      const metricsText = metricsFAQ.answer.toLowerCase();
      const goalText = requirements.businessGoal.toLowerCase();
      
      if (goalText.includes('cost') && !metricsText.includes('cost') && !metricsText.includes('saving')) {
        warnings.push({
          type: 'missing_detail',
          message: 'Success metrics may not include cost-related measures despite cost-focused business goal',
          documents: ['PRFAQ', 'PMRequirements'],
          suggestion: 'Consider including cost or efficiency metrics'
        });
      }
    }
  }

  private validatePRFAQDesignAlignment(
    prfaq: PRFAQ,
    design: DesignOptions,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if press release solution aligns with recommended design option
    const solutionKeywords = this.extractKeywords(prfaq.pressRelease.body);
    const balancedOptionKeywords = this.extractKeywords(design.options.balanced.summary);
    
    if (!this.hasKeywordOverlap(solutionKeywords, balancedOptionKeywords)) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'Press release solution may not align with recommended design option',
        documents: ['PRFAQ', 'DesignOptions'],
        suggestion: 'Ensure press release describes the balanced/recommended approach'
      });
    }

    // Check if risks in FAQ align with design risks
    const risksFAQ = prfaq.faq.find(faq => faq.question.toLowerCase().includes('risk'));
    if (risksFAQ && design.options.balanced.majorRisks.length > 0) {
      const faqRiskKeywords = this.extractKeywords(risksFAQ.answer);
      const designRiskKeywords = design.options.balanced.majorRisks.flatMap(risk => this.extractKeywords(risk));
      
      if (!this.hasKeywordOverlap(faqRiskKeywords, designRiskKeywords)) {
        warnings.push({
          type: 'missing_detail',
          message: 'FAQ risks may not address key risks identified in design options',
          documents: ['PRFAQ', 'DesignOptions'],
          suggestion: 'Consider including major risks from the recommended design option'
        });
      }
    }
  }

  private validatePRFAQInternalConsistency(
    prfaq: PRFAQ,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if press release is under 250 words
    const wordCount = prfaq.pressRelease.body.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 250) {
      errors.push({
        type: 'format',
        severity: 'medium',
        message: `Press release body is ${wordCount} words, should be under 250 words`,
        documents: ['PRFAQ'],
        field: 'pressRelease.body'
      });
    }

    // Check if exactly 10 FAQ questions are provided
    const requiredQuestions = [
      'who is the customer',
      'what problem are we solving',
      'why now and why not later',
      'what is the smallest lovable version',
      'how will we measure success',
      'what are the top 3 risks',
      'what is not included',
      'how does this compare to alternatives',
      'estimated cost',
      'next 2 releases'
    ];

    const providedQuestions = prfaq.faq.map(faq => faq.question.toLowerCase());
    const missingQuestions = requiredQuestions.filter(required => 
      !providedQuestions.some(provided => provided.includes(required.split(' ')[0]))
    );

    if (missingQuestions.length > 0) {
      errors.push({
        type: 'missing',
        severity: 'high',
        message: `Missing required FAQ questions: ${missingQuestions.join(', ')}`,
        documents: ['PRFAQ'],
        field: 'faq'
      });
    }

    if (prfaq.faq.length > 20) {
      errors.push({
        type: 'format',
        severity: 'medium',
        message: `FAQ has ${prfaq.faq.length} questions, should be limited to 20 Q&As`,
        documents: ['PRFAQ'],
        field: 'faq'
      });
    }

    // Check if launch checklist has essential items
    const essentialChecklistItems = ['scope freeze', 'timeline', 'dependencies'];
    const checklistText = prfaq.launchChecklist.map(item => item.task.toLowerCase()).join(' ');
    
    const missingEssentials = essentialChecklistItems.filter(essential => 
      !checklistText.includes(essential)
    );

    if (missingEssentials.length > 0) {
      warnings.push({
        type: 'missing_detail',
        message: `Launch checklist may be missing essential items: ${missingEssentials.join(', ')}`,
        documents: ['PRFAQ'],
        suggestion: 'Consider adding scope freeze, timeline, and dependency management items'
      });
    }
  }

  private validateTaskPlanDesignAlignment(
    taskPlan: TaskPlan,
    design: DesignOptions,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if task priorities align with design option selection
    const allTasks = [
      ...taskPlan.immediateWins,
      ...taskPlan.shortTerm,
      ...taskPlan.longTerm
    ];

    const mustHaveTasks = allTasks.filter(task => task.priority === 'Must');
    const shouldHaveTasks = allTasks.filter(task => task.priority === 'Should');

    // If balanced option is low effort but many must-have tasks, flag inconsistency
    if (design.options.balanced.effort === 'Low' && mustHaveTasks.length > 8) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'High number of must-have tasks may not align with low-effort balanced design option',
        documents: ['TaskPlan', 'DesignOptions'],
        suggestion: 'Review if task priorities match the effort level of the recommended design'
      });
    }

    // Check if high-impact tasks are in immediate wins
    const highImpactTasks = allTasks.filter(task => task.impact === 'High');
    const immediateHighImpact = taskPlan.immediateWins.filter(task => task.impact === 'High');

    if (highImpactTasks.length > 0 && immediateHighImpact.length === 0) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'High-impact tasks should typically be included in immediate wins',
        documents: ['TaskPlan'],
        suggestion: 'Consider moving high-impact tasks to immediate wins phase'
      });
    }

    // Check if task descriptions align with design option features
    const balancedFeatures = this.extractKeywords(design.options.balanced.summary);
    const taskDescriptions = allTasks.flatMap(task => this.extractKeywords(task.description));

    if (!this.hasKeywordOverlap(balancedFeatures, taskDescriptions)) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'Task descriptions may not cover key features from the recommended design option',
        documents: ['TaskPlan', 'DesignOptions'],
        suggestion: 'Ensure tasks implement the features described in the balanced design option'
      });
    }
  }

  private validateTaskPlanRequirementsAlignment(
    taskPlan: TaskPlan,
    requirements: PMRequirements,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    const allTasks = [
      ...taskPlan.immediateWins,
      ...taskPlan.shortTerm,
      ...taskPlan.longTerm
    ];

    // Check if must-have requirements are covered by must-have tasks
    const mustHaveReqs = requirements.priority.must;
    const mustHaveTasks = allTasks.filter(task => task.priority === 'Must');

    if (mustHaveReqs.length > mustHaveTasks.length + 2) {
      warnings.push({
        type: 'missing_detail',
        message: 'Number of must-have tasks may not adequately cover must-have requirements',
        documents: ['TaskPlan', 'PMRequirements'],
        suggestion: 'Ensure all must-have requirements are addressed by must-have tasks'
      });
    }

    // Check if functional requirements are addressed in task descriptions
    const functionalReqKeywords = requirements.functionalRequirements.flatMap(req => this.extractKeywords(req));
    const taskKeywords = allTasks.flatMap(task => this.extractKeywords(task.description + ' ' + task.name));

    if (!this.hasKeywordOverlap(functionalReqKeywords, taskKeywords)) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'Task descriptions may not adequately address functional requirements',
        documents: ['TaskPlan', 'PMRequirements'],
        suggestion: 'Review tasks to ensure they implement the specified functional requirements'
      });
    }

    // Check if constraints are addressed in guardrails check
    if (requirements.constraintsRisks.length > 0) {
      const constraintKeywords = requirements.constraintsRisks.flatMap(constraint => this.extractKeywords(constraint));
      const guardrailKeywords = taskPlan.guardrailsCheck.checkCriteria.flatMap(criteria => this.extractKeywords(criteria));

      if (!this.hasKeywordOverlap(constraintKeywords, guardrailKeywords)) {
        warnings.push({
          type: 'missing_detail',
          message: 'Guardrails check may not address key constraints from requirements',
          documents: ['TaskPlan', 'PMRequirements'],
          suggestion: 'Consider adding constraint checks to the guardrails task'
        });
      }
    }
  }

  private validateTaskPlanInternalConsistency(
    taskPlan: TaskPlan,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if guardrails check is properly defined as Task 0
    if (!taskPlan.guardrailsCheck.id.includes('0') && !taskPlan.guardrailsCheck.name.toLowerCase().includes('guardrail')) {
      errors.push({
        type: 'format',
        severity: 'medium',
        message: 'Guardrails check should be clearly identified as Task 0',
        documents: ['TaskPlan'],
        field: 'guardrailsCheck'
      });
    }

    // Check phase distribution
    if (taskPlan.immediateWins.length === 0) {
      errors.push({
        type: 'missing',
        severity: 'high',
        message: 'Immediate wins phase should have at least 1 task',
        documents: ['TaskPlan'],
        field: 'immediateWins'
      });
    }

    if (taskPlan.immediateWins.length > 3) {
      warnings.push({
        type: 'format_issue',
        message: 'Immediate wins phase has more than 3 tasks - consider if all are truly immediate',
        documents: ['TaskPlan'],
        suggestion: 'Keep immediate wins to 1-3 high-impact, low-effort tasks'
      });
    }

    if (taskPlan.shortTerm.length > 6) {
      warnings.push({
        type: 'format_issue',
        message: 'Short-term phase has more than 6 tasks - consider moving some to long-term',
        documents: ['TaskPlan'],
        suggestion: 'Keep short-term phase to 3-6 tasks for manageable execution'
      });
    }

    // Check for task ID uniqueness
    const allTasks = [
      taskPlan.guardrailsCheck,
      ...taskPlan.immediateWins,
      ...taskPlan.shortTerm,
      ...taskPlan.longTerm
    ];

    const taskIds = allTasks.map(task => task.id);
    const duplicateIds = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
      errors.push({
        type: 'format',
        severity: 'high',
        message: `Duplicate task IDs found: ${duplicateIds.join(', ')}`,
        documents: ['TaskPlan'],
        field: 'taskIds'
      });
    }

    // Check effort/impact/priority consistency
    allTasks.forEach((task, index) => {
      if (task.priority === 'Must' && task.impact === 'Low') {
        warnings.push({
          type: 'potential_misalignment',
          message: `Task "${task.name}" is marked as Must priority but Low impact`,
          documents: ['TaskPlan'],
          suggestion: 'Review if low-impact tasks should be Must priority'
        });
      }

      if (task.effort === 'L' && task.impact === 'High' && !taskPlan.immediateWins.includes(task)) {
        warnings.push({
          type: 'potential_misalignment',
          message: `Task "${task.name}" is high-impact, low-effort but not in immediate wins`,
          documents: ['TaskPlan'],
          suggestion: 'Consider moving high-impact, low-effort tasks to immediate wins'
        });
      }
    });
  }

  private validateOnePagerPRFAQAlignment(
    onePager: ManagementOnePager,
    prfaq: PRFAQ,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    // Check if decision timing aligns between documents
    const onePagerTiming = onePager.answer.toLowerCase();
    const prfaqTiming = prfaq.pressRelease.body.toLowerCase();

    if (onePagerTiming.includes('immediately') && !prfaqTiming.includes('now') && !prfaqTiming.includes('today')) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'One-pager suggests immediate action but PR-FAQ may not emphasize urgency',
        documents: ['ManagementOnePager', 'PRFAQ'],
        suggestion: 'Ensure timing urgency is consistent across documents'
      });
    }

    // Check if risks are consistent
    const onePagerRisks = onePager.risksAndMitigations.map(rm => rm.risk.toLowerCase());
    const risksFAQ = prfaq.faq.find(faq => faq.question.toLowerCase().includes('risk'));
    
    if (risksFAQ) {
      const faqRisks = risksFAQ.answer.toLowerCase();
      const hasOverlap = onePagerRisks.some(risk => {
        const riskKeywords = this.extractKeywords(risk);
        return riskKeywords.some(keyword => faqRisks.includes(keyword));
      });

      if (!hasOverlap) {
        warnings.push({
          type: 'potential_misalignment',
          message: 'Risk assessments may not be consistent between one-pager and PR-FAQ',
          documents: ['ManagementOnePager', 'PRFAQ'],
          suggestion: 'Ensure key risks are addressed consistently in both documents'
        });
      }
    }

    // Check if scope aligns with what's not included
    const notIncludedFAQ = prfaq.faq.find(faq => faq.question.toLowerCase().includes('not included'));
    if (notIncludedFAQ && onePager.whatScopeToday.length > 0) {
      const scopeKeywords = onePager.whatScopeToday.flatMap(scope => this.extractKeywords(scope));
      const notIncludedKeywords = this.extractKeywords(notIncludedFAQ.answer);

      if (this.hasKeywordOverlap(scopeKeywords, notIncludedKeywords)) {
        errors.push({
          type: 'contradiction',
          severity: 'high',
          message: 'Items listed in scope today appear to overlap with what\'s not included in PR-FAQ',
          documents: ['ManagementOnePager', 'PRFAQ'],
          field: 'scope_vs_not_included'
        });
      }
    }
  }

  private validateDesignTaskPlanAlignment(
    design: DesignOptions,
    taskPlan: TaskPlan,
    errors: ConsistencyError[],
    warnings: ConsistencyWarning[]
  ): void {
    const allTasks = [
      ...taskPlan.immediateWins,
      ...taskPlan.shortTerm,
      ...taskPlan.longTerm
    ];

    // Check if task effort distribution aligns with design effort
    const balancedOption = design.options.balanced;
    const largeTasks = allTasks.filter(task => task.effort === 'L').length;
    const totalTasks = allTasks.length;

    if (balancedOption.effort === 'Low' && largeTasks > totalTasks * 0.3) {
      warnings.push({
        type: 'potential_misalignment',
        message: 'High proportion of large tasks may not align with low-effort design option',
        documents: ['DesignOptions', 'TaskPlan'],
        suggestion: 'Review if task sizing matches the effort level of the recommended design'
      });
    }

    // Check if high-impact design translates to high-impact tasks
    if (balancedOption.impact === 'High') {
      const highImpactTasks = allTasks.filter(task => task.impact === 'High').length;
      
      if (highImpactTasks < 3) {
        warnings.push({
          type: 'potential_misalignment',
          message: 'High-impact design option should have more high-impact tasks',
          documents: ['DesignOptions', 'TaskPlan'],
          suggestion: 'Ensure task impact levels reflect the design option impact'
        });
      }
    }

    // Check if design risks are addressed in guardrails
    if (balancedOption.majorRisks.length > 0) {
      const designRiskKeywords = balancedOption.majorRisks.flatMap(risk => this.extractKeywords(risk));
      const guardrailKeywords = taskPlan.guardrailsCheck.checkCriteria.flatMap(criteria => this.extractKeywords(criteria));

      if (!this.hasKeywordOverlap(designRiskKeywords, guardrailKeywords)) {
        warnings.push({
          type: 'missing_detail',
          message: 'Major design risks may not be addressed in guardrails check',
          documents: ['DesignOptions', 'TaskPlan'],
          suggestion: 'Consider adding checks for major design risks in the guardrails task'
        });
      }
    }
  }

  // Utility methods

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'will', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word));
  }

  private hasKeywordOverlap(keywords1: string[], keywords2: string[]): boolean {
    if (keywords1.length === 0 || keywords2.length === 0) return false;
    
    return keywords1.some(keyword1 => 
      keywords2.some(keyword2 => 
        keyword1.includes(keyword2) || keyword2.includes(keyword1) || 
        this.areSimilarWords(keyword1, keyword2)
      )
    );
  }

  private areSimilarWords(word1: string, word2: string): boolean {
    // Simple similarity check for common variations
    const synonyms = [
      ['optimize', 'optimization', 'efficient', 'efficiency'],
      ['cost', 'expense', 'budget', 'price'],
      ['user', 'customer', 'client'],
      ['workflow', 'process', 'procedure'],
      ['risk', 'danger', 'threat'],
      ['benefit', 'advantage', 'gain'],
      ['requirement', 'need', 'specification'],
      ['design', 'architecture', 'structure'],
      ['task', 'activity', 'action', 'work'],
      ['impact', 'effect', 'influence'],
      ['effort', 'work', 'labor']
    ];

    return synonyms.some(group => 
      group.includes(word1) && group.includes(word2)
    );
  }

  private arraysMatch(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => item === arr2[index]);
  }
}

/**
 * Convenience function to validate all PM documents for consistency
 */
export function validatePMDocumentConsistency(
  documents: {
    requirements?: PMRequirements;
    design?: DesignOptions;
    onePager?: ManagementOnePager;
    prfaq?: PRFAQ;
    taskPlan?: TaskPlan;
  }
): ConsistencyValidationResult {
  const validator = new PMDocumentConsistencyValidator();
  return validator.validateCrossDocumentConsistency(documents);
}

/**
 * Convenience function to validate management one-pager consistency
 */
export function validateManagementOnePager(
  onePager: ManagementOnePager,
  requirements?: PMRequirements,
  design?: DesignOptions
): ConsistencyValidationResult {
  const validator = new PMDocumentConsistencyValidator();
  return validator.validateManagementOnePagerConsistency(onePager, requirements, design);
}

/**
 * Convenience function to validate PR-FAQ consistency
 */
export function validatePRFAQ(
  prfaq: PRFAQ,
  requirements?: PMRequirements,
  design?: DesignOptions
): ConsistencyValidationResult {
  const validator = new PMDocumentConsistencyValidator();
  return validator.validatePRFAQConsistency(prfaq, requirements, design);
}

/**
 * Convenience function to validate task plan consistency
 */
export function validateTaskPlan(
  taskPlan: TaskPlan,
  design?: DesignOptions,
  requirements?: PMRequirements
): ConsistencyValidationResult {
  const validator = new PMDocumentConsistencyValidator();
  return validator.validateTaskPlanConsistency(taskPlan, design, requirements);
}