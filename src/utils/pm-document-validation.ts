// PM Document specific input validation utilities

import { ValidationError } from './validation';
import { ROIInputs, RequirementsContext, TaskLimits } from '../components/pm-document-generator';

/**
 * Validation utilities for PM document generation inputs
 */
export class PMDocumentValidationError extends ValidationError {
  constructor(message: string, public documentType?: string, field?: string) {
    super(message, field);
    this.name = 'PMDocumentValidationError';
  }
}

/**
 * Validate inputs for management one-pager generation
 */
export function validateManagementOnePagerInputs(
  requirements: string,
  design: string,
  tasks?: string,
  roiInputs?: ROIInputs
): void {
  // Validate requirements document
  if (!requirements || typeof requirements !== 'string') {
    throw new PMDocumentValidationError(
      'Requirements document must be a non-empty string',
      'management_onepager',
      'requirements'
    );
  }

  if (requirements.trim().length < 50) {
    throw new PMDocumentValidationError(
      'Requirements document is too short. Must be at least 50 characters for meaningful analysis.',
      'management_onepager',
      'requirements'
    );
  }

  if (requirements.length > 50000) {
    throw new PMDocumentValidationError(
      'Requirements document is too long. Must be under 50,000 characters.',
      'management_onepager',
      'requirements'
    );
  }

  // Validate design document
  if (!design || typeof design !== 'string') {
    throw new PMDocumentValidationError(
      'Design document must be a non-empty string',
      'management_onepager',
      'design'
    );
  }

  if (design.trim().length < 50) {
    throw new PMDocumentValidationError(
      'Design document is too short. Must be at least 50 characters for meaningful analysis.',
      'management_onepager',
      'design'
    );
  }

  if (design.length > 50000) {
    throw new PMDocumentValidationError(
      'Design document is too long. Must be under 50,000 characters.',
      'management_onepager',
      'design'
    );
  }

  // Validate optional tasks document
  if (tasks !== undefined) {
    if (typeof tasks !== 'string') {
      throw new PMDocumentValidationError(
        'Tasks document must be a string if provided',
        'management_onepager',
        'tasks'
      );
    }

    if (tasks.length > 30000) {
      throw new PMDocumentValidationError(
        'Tasks document is too long. Must be under 30,000 characters.',
        'management_onepager',
        'tasks'
      );
    }
  }

  // Validate ROI inputs
  if (roiInputs !== undefined) {
    validateROIInputs(roiInputs, 'management_onepager');
  }

  // Content validation - check for essential elements
  validateRequirementsContent(requirements, 'management_onepager');
  validateDesignContent(design, 'management_onepager');
}

/**
 * Validate inputs for PR-FAQ generation
 */
export function validatePRFAQInputs(
  requirements: string,
  design: string,
  targetDate?: string
): void {
  // Validate requirements document
  if (!requirements || typeof requirements !== 'string') {
    throw new PMDocumentValidationError(
      'Requirements document must be a non-empty string',
      'pr_faq',
      'requirements'
    );
  }

  if (requirements.trim().length < 50) {
    throw new PMDocumentValidationError(
      'Requirements document is too short. Must be at least 50 characters for meaningful PR-FAQ generation.',
      'pr_faq',
      'requirements'
    );
  }

  if (requirements.length > 50000) {
    throw new PMDocumentValidationError(
      'Requirements document is too long. Must be under 50,000 characters.',
      'pr_faq',
      'requirements'
    );
  }

  // Validate design document
  if (!design || typeof design !== 'string') {
    throw new PMDocumentValidationError(
      'Design document must be a non-empty string',
      'pr_faq',
      'design'
    );
  }

  if (design.trim().length < 50) {
    throw new PMDocumentValidationError(
      'Design document is too short. Must be at least 50 characters for meaningful PR-FAQ generation.',
      'pr_faq',
      'design'
    );
  }

  if (design.length > 50000) {
    throw new PMDocumentValidationError(
      'Design document is too long. Must be under 50,000 characters.',
      'pr_faq',
      'design'
    );
  }

  // Validate target date
  if (targetDate !== undefined) {
    if (typeof targetDate !== 'string') {
      throw new PMDocumentValidationError(
        'Target date must be a string if provided',
        'pr_faq',
        'targetDate'
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      throw new PMDocumentValidationError(
        'Target date must be in YYYY-MM-DD format',
        'pr_faq',
        'targetDate'
      );
    }

    // Validate date is not in the past
    const targetDateObj = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (targetDateObj < today) {
      throw new PMDocumentValidationError(
        'Target date cannot be in the past',
        'pr_faq',
        'targetDate'
      );
    }

    // Validate date is not too far in the future (max 2 years)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);

    if (targetDateObj > maxDate) {
      throw new PMDocumentValidationError(
        'Target date cannot be more than 2 years in the future',
        'pr_faq',
        'targetDate'
      );
    }
  }

  // Content validation
  validateRequirementsContent(requirements, 'pr_faq');
  validateDesignContent(design, 'pr_faq');
}

/**
 * Validate inputs for requirements generation
 */
export function validateRequirementsGenerationInputs(
  rawIntent: string,
  context?: RequirementsContext
): void {
  // Validate raw intent
  if (!rawIntent || typeof rawIntent !== 'string') {
    throw new PMDocumentValidationError(
      'Raw intent must be a non-empty string',
      'requirements_generation',
      'rawIntent'
    );
  }

  if (rawIntent.trim().length < 20) {
    throw new PMDocumentValidationError(
      'Raw intent is too short. Must be at least 20 characters for meaningful requirements generation.',
      'requirements_generation',
      'rawIntent'
    );
  }

  if (rawIntent.length > 10000) {
    throw new PMDocumentValidationError(
      'Raw intent is too long. Must be under 10,000 characters.',
      'requirements_generation',
      'rawIntent'
    );
  }

  // Check for meaningful content
  const suspiciousPatterns = [
    /^\s*test\s*$/i,
    /^\s*hello\s*$/i,
    /^\s*hi\s*$/i,
    /^\s*[a-z]\s*$/i,
    /^\s*example\s*$/i,
    /^\s*sample\s*$/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(rawIntent))) {
    throw new PMDocumentValidationError(
      'Raw intent appears to be a test or placeholder. Please provide a clear description of what you want to build.',
      'requirements_generation',
      'rawIntent'
    );
  }

  // Validate context if provided
  if (context !== undefined) {
    validateRequirementsContext(context);
  }
}

/**
 * Validate inputs for design options generation
 */
export function validateDesignOptionsInputs(requirements: string): void {
  if (!requirements || typeof requirements !== 'string') {
    throw new PMDocumentValidationError(
      'Requirements document must be a non-empty string',
      'design_options',
      'requirements'
    );
  }

  if (requirements.trim().length < 50) {
    throw new PMDocumentValidationError(
      'Requirements document is too short. Must be at least 50 characters for meaningful design options generation.',
      'design_options',
      'requirements'
    );
  }

  if (requirements.length > 50000) {
    throw new PMDocumentValidationError(
      'Requirements document is too long. Must be under 50,000 characters.',
      'design_options',
      'requirements'
    );
  }

  validateRequirementsContent(requirements, 'design_options');
}

/**
 * Validate inputs for task plan generation
 */
export function validateTaskPlanInputs(design: string, limits?: TaskLimits): void {
  if (!design || typeof design !== 'string') {
    throw new PMDocumentValidationError(
      'Design document must be a non-empty string',
      'task_plan',
      'design'
    );
  }

  if (design.trim().length < 50) {
    throw new PMDocumentValidationError(
      'Design document is too short. Must be at least 50 characters for meaningful task plan generation.',
      'task_plan',
      'design'
    );
  }

  if (design.length > 50000) {
    throw new PMDocumentValidationError(
      'Design document is too long. Must be under 50,000 characters.',
      'task_plan',
      'design'
    );
  }

  // Validate limits if provided
  if (limits !== undefined) {
    validateTaskLimits(limits);
  }

  validateDesignContent(design, 'task_plan');
}

/**
 * Validate ROI inputs structure and values
 */
function validateROIInputs(roiInputs: ROIInputs, documentType: string): void {
  if (typeof roiInputs !== 'object' || roiInputs === null) {
    throw new PMDocumentValidationError(
      'ROI inputs must be an object',
      documentType,
      'roiInputs'
    );
  }

  // Validate cost values
  if (roiInputs.cost_naive !== undefined) {
    if (typeof roiInputs.cost_naive !== 'number' || roiInputs.cost_naive < 0) {
      throw new PMDocumentValidationError(
        'Naive cost must be a non-negative number',
        documentType,
        'roiInputs.cost_naive'
      );
    }

    if (roiInputs.cost_naive > 10000000) { // $10M max
      throw new PMDocumentValidationError(
        'Naive cost seems unreasonably high (max $10M)',
        documentType,
        'roiInputs.cost_naive'
      );
    }
  }

  if (roiInputs.cost_balanced !== undefined) {
    if (typeof roiInputs.cost_balanced !== 'number' || roiInputs.cost_balanced < 0) {
      throw new PMDocumentValidationError(
        'Balanced cost must be a non-negative number',
        documentType,
        'roiInputs.cost_balanced'
      );
    }

    if (roiInputs.cost_balanced > 10000000) { // $10M max
      throw new PMDocumentValidationError(
        'Balanced cost seems unreasonably high (max $10M)',
        documentType,
        'roiInputs.cost_balanced'
      );
    }
  }

  if (roiInputs.cost_bold !== undefined) {
    if (typeof roiInputs.cost_bold !== 'number' || roiInputs.cost_bold < 0) {
      throw new PMDocumentValidationError(
        'Bold cost must be a non-negative number',
        documentType,
        'roiInputs.cost_bold'
      );
    }

    if (roiInputs.cost_bold > 10000000) { // $10M max
      throw new PMDocumentValidationError(
        'Bold cost seems unreasonably high (max $10M)',
        documentType,
        'roiInputs.cost_bold'
      );
    }
  }

  // Validate logical relationships between costs
  if (roiInputs.cost_naive !== undefined && roiInputs.cost_balanced !== undefined) {
    if (roiInputs.cost_balanced > roiInputs.cost_naive * 5) {
      throw new PMDocumentValidationError(
        'Balanced cost should not be more than 5x the naive cost',
        documentType,
        'roiInputs'
      );
    }
  }

  if (roiInputs.cost_balanced !== undefined && roiInputs.cost_bold !== undefined) {
    if (roiInputs.cost_bold < roiInputs.cost_balanced) {
      throw new PMDocumentValidationError(
        'Bold cost should typically be higher than balanced cost',
        documentType,
        'roiInputs'
      );
    }
  }
}

/**
 * Validate requirements context structure and values
 */
function validateRequirementsContext(context: RequirementsContext): void {
  if (typeof context !== 'object' || context === null) {
    throw new PMDocumentValidationError(
      'Requirements context must be an object',
      'requirements_generation',
      'context'
    );
  }

  if (context.roadmapTheme !== undefined) {
    if (typeof context.roadmapTheme !== 'string' || context.roadmapTheme.trim().length === 0) {
      throw new PMDocumentValidationError(
        'Roadmap theme must be a non-empty string if provided',
        'requirements_generation',
        'context.roadmapTheme'
      );
    }

    if (context.roadmapTheme.length > 500) {
      throw new PMDocumentValidationError(
        'Roadmap theme is too long (max 500 characters)',
        'requirements_generation',
        'context.roadmapTheme'
      );
    }
  }

  if (context.budget !== undefined) {
    if (typeof context.budget !== 'number' || context.budget < 0) {
      throw new PMDocumentValidationError(
        'Budget must be a non-negative number if provided',
        'requirements_generation',
        'context.budget'
      );
    }

    if (context.budget > 100000000) { // $100M max
      throw new PMDocumentValidationError(
        'Budget seems unreasonably high (max $100M)',
        'requirements_generation',
        'context.budget'
      );
    }
  }

  if (context.quotas !== undefined) {
    if (typeof context.quotas !== 'object' || context.quotas === null) {
      throw new PMDocumentValidationError(
        'Quotas must be an object if provided',
        'requirements_generation',
        'context.quotas'
      );
    }

    if (context.quotas.maxVibes !== undefined) {
      if (typeof context.quotas.maxVibes !== 'number' || context.quotas.maxVibes < 0) {
        throw new PMDocumentValidationError(
          'Max vibes must be a non-negative number if provided',
          'requirements_generation',
          'context.quotas.maxVibes'
        );
      }

      if (context.quotas.maxVibes > 100000) {
        throw new PMDocumentValidationError(
          'Max vibes seems unreasonably high (max 100,000)',
          'requirements_generation',
          'context.quotas.maxVibes'
        );
      }
    }

    if (context.quotas.maxSpecs !== undefined) {
      if (typeof context.quotas.maxSpecs !== 'number' || context.quotas.maxSpecs < 0) {
        throw new PMDocumentValidationError(
          'Max specs must be a non-negative number if provided',
          'requirements_generation',
          'context.quotas.maxSpecs'
        );
      }

      if (context.quotas.maxSpecs > 10000) {
        throw new PMDocumentValidationError(
          'Max specs seems unreasonably high (max 10,000)',
          'requirements_generation',
          'context.quotas.maxSpecs'
        );
      }
    }
  }

  if (context.deadlines !== undefined) {
    if (typeof context.deadlines !== 'string' || context.deadlines.trim().length === 0) {
      throw new PMDocumentValidationError(
        'Deadlines must be a non-empty string if provided',
        'requirements_generation',
        'context.deadlines'
      );
    }

    if (context.deadlines.length > 1000) {
      throw new PMDocumentValidationError(
        'Deadlines description is too long (max 1000 characters)',
        'requirements_generation',
        'context.deadlines'
      );
    }
  }
}

/**
 * Validate task limits structure and values
 */
function validateTaskLimits(limits: TaskLimits): void {
  if (typeof limits !== 'object' || limits === null) {
    throw new PMDocumentValidationError(
      'Task limits must be an object',
      'task_plan',
      'limits'
    );
  }

  if (limits.maxVibes !== undefined) {
    if (typeof limits.maxVibes !== 'number' || limits.maxVibes < 0) {
      throw new PMDocumentValidationError(
        'Max vibes limit must be a non-negative number if provided',
        'task_plan',
        'limits.maxVibes'
      );
    }

    if (limits.maxVibes > 100000) {
      throw new PMDocumentValidationError(
        'Max vibes limit seems unreasonably high (max 100,000)',
        'task_plan',
        'limits.maxVibes'
      );
    }
  }

  if (limits.maxSpecs !== undefined) {
    if (typeof limits.maxSpecs !== 'number' || limits.maxSpecs < 0) {
      throw new PMDocumentValidationError(
        'Max specs limit must be a non-negative number if provided',
        'task_plan',
        'limits.maxSpecs'
      );
    }

    if (limits.maxSpecs > 10000) {
      throw new PMDocumentValidationError(
        'Max specs limit seems unreasonably high (max 10,000)',
        'task_plan',
        'limits.maxSpecs'
      );
    }
  }

  if (limits.budgetUSD !== undefined) {
    if (typeof limits.budgetUSD !== 'number' || limits.budgetUSD < 0) {
      throw new PMDocumentValidationError(
        'Budget USD limit must be a non-negative number if provided',
        'task_plan',
        'limits.budgetUSD'
      );
    }

    if (limits.budgetUSD > 100000000) { // $100M max
      throw new PMDocumentValidationError(
        'Budget USD limit seems unreasonably high (max $100M)',
        'task_plan',
        'limits.budgetUSD'
      );
    }
  }
}

/**
 * Validate requirements document content for essential elements
 */
function validateRequirementsContent(requirements: string, documentType: string): void {
  const content = requirements.toLowerCase();

  // Check for basic requirement elements
  const hasUserStory = content.includes('user') || content.includes('customer') || content.includes('stakeholder');
  const hasFunctionality = content.includes('function') || content.includes('feature') || content.includes('capability') || content.includes('requirement');
  const hasObjective = content.includes('goal') || content.includes('objective') || content.includes('purpose') || content.includes('need');

  if (!hasUserStory && !hasFunctionality && !hasObjective) {
    throw new PMDocumentValidationError(
      'Requirements document should contain user stories, functionality descriptions, or objectives',
      documentType,
      'requirements'
    );
  }

  // Warn about very generic content
  const genericPatterns = [
    /build\s+a\s+system/i,
    /create\s+an?\s+app/i,
    /make\s+something/i,
    /develop\s+software/i
  ];

  if (genericPatterns.some(pattern => pattern.test(requirements))) {
    // This is a warning, not an error - we can still process generic requirements
    console.warn(`Warning: Requirements document for ${documentType} appears to be generic. More specific requirements will produce better results.`);
  }
}

/**
 * Validate design document content for essential elements
 */
function validateDesignContent(design: string, documentType: string): void {
  const content = design.toLowerCase();

  // Check for basic design elements
  const hasArchitecture = content.includes('architecture') || content.includes('component') || content.includes('system');
  const hasImplementation = content.includes('implement') || content.includes('build') || content.includes('develop');
  const hasTechnical = content.includes('technical') || content.includes('technology') || content.includes('framework');

  if (!hasArchitecture && !hasImplementation && !hasTechnical) {
    throw new PMDocumentValidationError(
      'Design document should contain architecture, implementation details, or technical specifications',
      documentType,
      'design'
    );
  }

  // Warn about very generic content
  const genericPatterns = [
    /standard\s+architecture/i,
    /typical\s+design/i,
    /basic\s+implementation/i,
    /simple\s+system/i
  ];

  if (genericPatterns.some(pattern => pattern.test(design))) {
    // This is a warning, not an error - we can still process generic designs
    console.warn(`Warning: Design document for ${documentType} appears to be generic. More specific design details will produce better results.`);
  }
}

/**
 * Validate that a document contains structured content (not just plain text)
 */
export function validateStructuredDocument(document: string, documentType: string, fieldName: string): void {
  if (!document || typeof document !== 'string') {
    throw new PMDocumentValidationError(
      `${fieldName} must be a non-empty string`,
      documentType,
      fieldName
    );
  }

  const content = document.trim();
  
  if (content.length < 10) {
    throw new PMDocumentValidationError(
      `${fieldName} is too short for meaningful analysis`,
      documentType,
      fieldName
    );
  }

  // Check for some structure indicators (headers, lists, etc.)
  const hasStructure = /^#|\n#|\*|\-|\d+\.|\n\n/.test(content);
  
  if (!hasStructure && content.length > 500) {
    console.warn(`Warning: ${fieldName} for ${documentType} appears to lack structure. Consider using headers, lists, or paragraphs for better results.`);
  }
}