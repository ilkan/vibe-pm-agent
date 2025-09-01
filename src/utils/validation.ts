// Input validation utilities

import { OptionalParams, ParsedIntent, Workflow, ConsultingTechnique } from '../models';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRawIntent(rawIntent: string): void {
  if (!rawIntent || typeof rawIntent !== 'string') {
    throw new ValidationError('Raw intent must be a non-empty string');
  }

  if (rawIntent.trim().length < 10) {
    throw new ValidationError('Intent description is too short. Please provide more detail.');
  }

  if (rawIntent.length > 5000) {
    throw new ValidationError('Intent description is too long. Please keep it under 5000 characters.');
  }

  // Check for potentially problematic content
  const suspiciousPatterns = [
    /^\s*test\s*$/i,
    /^\s*hello\s*$/i,
    /^\s*hi\s*$/i,
    /^\s*[a-z]\s*$/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(rawIntent))) {
    throw new ValidationError('Intent appears to be a test or greeting. Please provide a clear description of what you want to build.');
  }
}

export function validateOptionalParams(params: OptionalParams): void {
  if (params.expectedUserVolume !== undefined) {
    if (typeof params.expectedUserVolume !== 'number' || params.expectedUserVolume < 0) {
      throw new ValidationError('Expected user volume must be a non-negative number', 'expectedUserVolume');
    }

    if (params.expectedUserVolume > 1000000) {
      throw new ValidationError('Expected user volume seems unreasonably high. Please verify the number.', 'expectedUserVolume');
    }
  }

  if (params.costConstraints) {
    const { maxVibes, maxSpecs, maxCostDollars } = params.costConstraints;

    if (maxVibes !== undefined && (typeof maxVibes !== 'number' || maxVibes < 0)) {
      throw new ValidationError('Max vibes must be a non-negative number', 'costConstraints.maxVibes');
    }

    if (maxSpecs !== undefined && (typeof maxSpecs !== 'number' || maxSpecs < 0)) {
      throw new ValidationError('Max specs must be a non-negative number', 'costConstraints.maxSpecs');
    }

    if (maxCostDollars !== undefined && (typeof maxCostDollars !== 'number' || maxCostDollars < 0)) {
      throw new ValidationError('Max cost must be a non-negative number', 'costConstraints.maxCostDollars');
    }

    // Validate reasonable constraints
    if (maxVibes !== undefined && maxVibes > 10000) {
      throw new ValidationError('Max vibes constraint seems unreasonably high', 'costConstraints.maxVibes');
    }

    if (maxSpecs !== undefined && maxSpecs > 1000) {
      throw new ValidationError('Max specs constraint seems unreasonably high', 'costConstraints.maxSpecs');
    }

    if (maxCostDollars !== undefined && maxCostDollars > 100000) {
      throw new ValidationError('Max cost constraint seems unreasonably high', 'costConstraints.maxCostDollars');
    }
  }

  if (params.performanceSensitivity !== undefined) {
    const validSensitivities = ['low', 'medium', 'high'];
    if (!validSensitivities.includes(params.performanceSensitivity)) {
      throw new ValidationError('Performance sensitivity must be low, medium, or high', 'performanceSensitivity');
    }
  }
}

export function validateParsedIntent(intent: ParsedIntent): void {
  if (!intent) {
    throw new ValidationError('Parsed intent cannot be null or undefined');
  }

  if (!intent.businessObjective || typeof intent.businessObjective !== 'string' || intent.businessObjective.trim().length === 0) {
    throw new ValidationError('Business objective must be a non-empty string', 'businessObjective');
  }

  if (!Array.isArray(intent.technicalRequirements)) {
    throw new ValidationError('Technical requirements must be an array', 'technicalRequirements');
  }

  if (!Array.isArray(intent.dataSourcesNeeded)) {
    throw new ValidationError('Data sources needed must be an array', 'dataSourcesNeeded');
  }

  if (!Array.isArray(intent.operationsRequired)) {
    throw new ValidationError('Operations required must be an array', 'operationsRequired');
  }

  if (intent.operationsRequired.length === 0) {
    throw new ValidationError('At least one operation must be identified from the intent', 'operationsRequired');
  }

  if (!Array.isArray(intent.potentialRisks)) {
    throw new ValidationError('Potential risks must be an array', 'potentialRisks');
  }

  // Validate each operation
  intent.operationsRequired.forEach((operation, index) => {
    if (!operation.id || typeof operation.id !== 'string') {
      throw new ValidationError(`Operation ${index} must have a valid ID`, `operationsRequired[${index}].id`);
    }

    if (!operation.type || !['vibe', 'spec', 'data_retrieval', 'processing', 'analysis'].includes(operation.type)) {
      throw new ValidationError(`Operation ${index} must have a valid type`, `operationsRequired[${index}].type`);
    }

    if (!operation.description || typeof operation.description !== 'string') {
      throw new ValidationError(`Operation ${index} must have a description`, `operationsRequired[${index}].description`);
    }

    if (typeof operation.estimatedQuotaCost !== 'number' || operation.estimatedQuotaCost < 0) {
      throw new ValidationError(`Operation ${index} must have a non-negative quota cost`, `operationsRequired[${index}].estimatedQuotaCost`);
    }
  });

  // Validate technical requirements
  intent.technicalRequirements.forEach((requirement, index) => {
    if (!requirement.type || !['data_retrieval', 'processing', 'analysis', 'output'].includes(requirement.type)) {
      throw new ValidationError(`Technical requirement ${index} must have a valid type`, `technicalRequirements[${index}].type`);
    }

    if (!requirement.complexity || !['low', 'medium', 'high'].includes(requirement.complexity)) {
      throw new ValidationError(`Technical requirement ${index} must have a valid complexity level`, `technicalRequirements[${index}].complexity`);
    }

    if (!requirement.quotaImpact || !['minimal', 'moderate', 'significant'].includes(requirement.quotaImpact)) {
      throw new ValidationError(`Technical requirement ${index} must have a valid quota impact level`, `technicalRequirements[${index}].quotaImpact`);
    }
  });
}

export function validateWorkflow(workflow: Workflow): void {
  if (!workflow) {
    throw new ValidationError('Workflow cannot be null or undefined');
  }

  if (!workflow.id || typeof workflow.id !== 'string') {
    throw new ValidationError('Workflow must have a valid ID', 'id');
  }

  if (!Array.isArray(workflow.steps)) {
    throw new ValidationError('Workflow steps must be an array', 'steps');
  }

  if (workflow.steps.length === 0) {
    throw new ValidationError('Workflow must have at least one step', 'steps');
  }

  if (typeof workflow.estimatedComplexity !== 'number' || workflow.estimatedComplexity < 0) {
    throw new ValidationError('Workflow must have a non-negative estimated complexity', 'estimatedComplexity');
  }

  // Validate each step
  workflow.steps.forEach((step, index) => {
    if (!step.id || typeof step.id !== 'string') {
      throw new ValidationError(`Workflow step ${index} must have a valid ID`, `steps[${index}].id`);
    }

    if (!step.type || !['vibe', 'spec', 'data_retrieval', 'processing', 'analysis'].includes(step.type)) {
      throw new ValidationError(`Workflow step ${index} must have a valid type`, `steps[${index}].type`);
    }

    if (!step.description || typeof step.description !== 'string') {
      throw new ValidationError(`Workflow step ${index} must have a description`, `steps[${index}].description`);
    }

    if (typeof step.quotaCost !== 'number' || step.quotaCost < 0) {
      throw new ValidationError(`Workflow step ${index} must have a non-negative quota cost`, `steps[${index}].quotaCost`);
    }

    if (!Array.isArray(step.inputs)) {
      throw new ValidationError(`Workflow step ${index} inputs must be an array`, `steps[${index}].inputs`);
    }

    if (!Array.isArray(step.outputs)) {
      throw new ValidationError(`Workflow step ${index} outputs must be an array`, `steps[${index}].outputs`);
    }
  });
}

export function validateConsultingTechniques(techniques: ConsultingTechnique[]): void {
  if (!Array.isArray(techniques)) {
    throw new ValidationError('Consulting techniques must be an array');
  }

  if (techniques.length === 0) {
    throw new ValidationError('At least one consulting technique must be provided');
  }

  const validTechniqueNames = ['MECE', 'Pyramid', 'ValueDriverTree', 'ZeroBased', 'ImpactEffort', 'ValueProp', 'OptionFraming'];

  techniques.forEach((technique, index) => {
    if (!technique.name || !validTechniqueNames.includes(technique.name)) {
      throw new ValidationError(`Technique ${index} must have a valid name`, `techniques[${index}].name`);
    }

    if (typeof technique.relevanceScore !== 'number' || technique.relevanceScore < 0 || technique.relevanceScore > 1) {
      throw new ValidationError(`Technique ${index} relevance score must be between 0 and 1`, `techniques[${index}].relevanceScore`);
    }

    if (!Array.isArray(technique.applicableScenarios)) {
      throw new ValidationError(`Technique ${index} applicable scenarios must be an array`, `techniques[${index}].applicableScenarios`);
    }
  });
}

export function validateStringArray(arr: string[], fieldName: string): void {
  if (!Array.isArray(arr)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  arr.forEach((item, index) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new ValidationError(`${fieldName}[${index}] must be a non-empty string`);
    }
  });
}

export function validatePositiveNumber(value: number, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`);
  }
}

export function validateNonEmptyString(value: string, fieldName: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }
}