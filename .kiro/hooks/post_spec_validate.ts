/**
 * Post-Spec Validation Hook
 * 
 * This hook validates that every acceptance criterion has proper test mapping
 * and that the spec maintains traceability from requirements to tasks to tests.
 * 
 * Generated-by: Kiro Spec Mode
 * Spec-ID: vibe_pm_agent_v2_hackathon
 * Model: claude-3.5-sonnet
 * Timestamp: 2025-01-09T10:30:00Z
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface AcceptanceCriterion {
  id: string;
  description: string;
  mapped_tasks?: string[];
  test_mapping?: string[];
}

interface SpecYaml {
  acceptance_criteria?: AcceptanceCriterion[];
  [key: string]: any;
}

interface TaskReference {
  taskId: string;
  taskName: string;
  requirements: string[];
  acceptanceCriteria: string[];
}

interface ValidationError {
  type: 'missing_test_mapping' | 'orphaned_ac' | 'missing_task_reference' | 'invalid_format';
  acceptanceCriterion?: string;
  task?: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  coverage: {
    totalAcceptanceCriteria: number;
    mappedAcceptanceCriteria: number;
    coveragePercentage: number;
  };
}

/**
 * Extracts acceptance criteria from spec YAML file
 */
function extractAcceptanceCriteria(specPath: string): AcceptanceCriterion[] {
  const yamlFiles = ['vibe_pm_agent.yaml', 'spec.yaml', 'specification.yaml'];
  
  for (const yamlFile of yamlFiles) {
    const yamlPath = path.join(specPath, yamlFile);
    if (fs.existsSync(yamlPath)) {
      try {
        const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
        const spec = yaml.load(yamlContent) as SpecYaml;
        return spec.acceptance_criteria || [];
      } catch (error) {
        console.warn(`Warning: Could not parse YAML file ${yamlFile}: ${error}`);
      }
    }
  }
  
  return [];
}

/**
 * Extracts task references from tasks.md file
 */
function extractTaskReferences(specPath: string): TaskReference[] {
  const tasksPath = path.join(specPath, 'tasks.md');
  if (!fs.existsSync(tasksPath)) {
    return [];
  }

  const tasksContent = fs.readFileSync(tasksPath, 'utf-8');
  const tasks: TaskReference[] = [];
  
  // Match task patterns like "- [ ] 1. Task name" or "- [x] T001. Task name"
  const taskPattern = /^- \[[ x-]\] ([T]?\d+(?:\.\d+)?)\.\s*(.+?)$/gm;
  let match;
  
  while ((match = taskPattern.exec(tasksContent)) !== null) {
    const taskId = match[1];
    const taskName = match[2];
    
    // Find the task content block
    const taskStart = match.index + match[0].length;
    const nextTaskMatch = taskPattern.exec(tasksContent);
    const taskEnd = nextTaskMatch ? nextTaskMatch.index : tasksContent.length;
    
    // Reset regex for next iteration
    taskPattern.lastIndex = taskStart;
    
    const taskContent = tasksContent.substring(taskStart, taskEnd);
    
    // Extract requirements references
    const requirementsMatches = taskContent.match(/_Requirements?:\s*([^_\n]+)/g) || [];
    const requirements = requirementsMatches.flatMap(match => 
      match.replace(/_Requirements?:\s*/, '').split(',').map(r => r.trim())
    );
    
    // Extract acceptance criteria references
    const acMatches = taskContent.match(/_Acceptance Criteria?:\s*([^_\n]+)/g) || [];
    const acceptanceCriteria = acMatches.flatMap(match =>
      match.replace(/_Acceptance Criteria?:\s*/, '').split(',').map(ac => ac.trim())
    );
    
    tasks.push({
      taskId,
      taskName,
      requirements,
      acceptanceCriteria
    });
  }
  
  return tasks;
}

/**
 * Extracts test references from requirements.md file
 */
function extractTestReferences(specPath: string): string[] {
  const requirementsPath = path.join(specPath, 'requirements.md');
  if (!fs.existsSync(requirementsPath)) {
    return [];
  }

  const requirementsContent = fs.readFileSync(requirementsPath, 'utf-8');
  
  // Look for acceptance criteria patterns
  const acPattern = /#### Acceptance Criteria[\s\S]*?(?=###|##|$)/g;
  const testReferences: string[] = [];
  
  let match;
  while ((match = acPattern.exec(requirementsContent)) !== null) {
    const acSection = match[0];
    
    // Extract individual criteria
    const criteriaPattern = /^\d+\.\s+(.+?)$/gm;
    let criteriaMatch;
    
    while ((criteriaMatch = criteriaPattern.exec(acSection)) !== null) {
      testReferences.push(criteriaMatch[1].trim());
    }
  }
  
  return testReferences;
}

/**
 * Validates acceptance criteria to task mapping
 */
export function validateAcceptanceCriteriaMapping(specPath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Extract data from spec files
  const acceptanceCriteria = extractAcceptanceCriteria(specPath);
  const tasks = extractTaskReferences(specPath);
  const testReferences = extractTestReferences(specPath);
  
  if (acceptanceCriteria.length === 0) {
    warnings.push({
      type: 'missing_task_reference',
      message: 'No acceptance criteria found in spec YAML file',
      severity: 'warning'
    });
  }

  let mappedCount = 0;
  
  // Validate each acceptance criterion
  for (const ac of acceptanceCriteria) {
    let isMapped = false;
    
    // Check if AC is referenced in tasks
    const referencingTasks = tasks.filter(task => 
      task.acceptanceCriteria.includes(ac.id) ||
      task.requirements.some(req => req.includes(ac.id))
    );
    
    if (referencingTasks.length === 0) {
      // Check if AC has mapped_tasks in YAML
      if (ac.mapped_tasks && ac.mapped_tasks.length > 0) {
        // Verify that mapped tasks actually exist
        const existingTasks = ac.mapped_tasks.filter(taskId =>
          tasks.some(task => task.taskId === taskId)
        );
        
        if (existingTasks.length === 0) {
          errors.push({
            type: 'orphaned_ac',
            acceptanceCriterion: ac.id,
            message: `Acceptance criterion ${ac.id} has mapped_tasks but none exist in tasks.md`,
            severity: 'error'
          });
        } else {
          isMapped = true;
        }
      } else {
        errors.push({
          type: 'orphaned_ac',
          acceptanceCriterion: ac.id,
          message: `Acceptance criterion ${ac.id} is not referenced by any task`,
          severity: 'error'
        });
      }
    } else {
      isMapped = true;
    }
    
    // Check for test mapping
    if (!ac.test_mapping || ac.test_mapping.length === 0) {
      warnings.push({
        type: 'missing_test_mapping',
        acceptanceCriterion: ac.id,
        message: `Acceptance criterion ${ac.id} lacks explicit test mapping`,
        severity: 'warning'
      });
    }
    
    if (isMapped) {
      mappedCount++;
    }
  }
  
  // Check for tasks that don't reference any acceptance criteria
  for (const task of tasks) {
    if (task.acceptanceCriteria.length === 0 && task.requirements.length === 0) {
      warnings.push({
        type: 'missing_task_reference',
        task: task.taskId,
        message: `Task ${task.taskId} does not reference any requirements or acceptance criteria`,
        severity: 'warning'
      });
    }
  }
  
  const coveragePercentage = acceptanceCriteria.length > 0 
    ? (mappedCount / acceptanceCriteria.length) * 100 
    : 0;
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    warnings,
    coverage: {
      totalAcceptanceCriteria: acceptanceCriteria.length,
      mappedAcceptanceCriteria: mappedCount,
      coveragePercentage
    }
  };
}

/**
 * Main hook function that fails if validation doesn't pass
 */
export function postSpecValidate(specPath: string): void {
  console.log(`🔍 Running post-spec validation for: ${specPath}`);
  
  const validation = validateAcceptanceCriteriaMapping(specPath);
  
  // Log coverage information
  console.log(`📊 Acceptance Criteria Coverage: ${validation.coverage.mappedAcceptanceCriteria}/${validation.coverage.totalAcceptanceCriteria} (${validation.coverage.coveragePercentage.toFixed(1)}%)`);
  
  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Spec validation warnings:');
    validation.warnings.forEach(warning => {
      const location = warning.acceptanceCriterion || warning.task || 'general';
      console.warn(`  - ${location}: ${warning.message}`);
    });
  }
  
  // Fail on errors
  if (!validation.isValid) {
    console.error('❌ Post-spec validation failed with errors:');
    validation.errors.forEach(error => {
      const location = error.acceptanceCriterion || error.task || 'general';
      console.error(`  - ${location}: ${error.message}`);
    });
    
    const errorMessage = `Post-spec validation failed: ${validation.errors.length} validation errors found. ` +
      `All acceptance criteria must be mapped to tasks with proper traceability.\n\n` +
      `Errors:\n${validation.errors.map(e => {
        const location = e.acceptanceCriterion || e.task || 'general';
        return `- ${location}: ${e.message}`;
      }).join('\n')}\n\n` +
      `Coverage: ${validation.coverage.mappedAcceptanceCriteria}/${validation.coverage.totalAcceptanceCriteria} (${validation.coverage.coveragePercentage.toFixed(1)}%)`;
    
    throw new Error(errorMessage);
  }
  
  console.log('✅ Post-spec validation passed');
  
  // Warn if coverage is low
  if (validation.coverage.coveragePercentage < 80) {
    console.warn(`⚠️  Low acceptance criteria coverage: ${validation.coverage.coveragePercentage.toFixed(1)}% (recommended: >80%)`);
  }
}

/**
 * Hook entry point - called by Kiro after spec completion
 */
export default function(context: { specPath?: string } = {}): void {
  const specPath = context.specPath || '.kiro/specs';
  
  // If specPath is a directory containing multiple specs, validate all of them
  if (fs.existsSync(specPath) && fs.statSync(specPath).isDirectory()) {
    const entries = fs.readdirSync(specPath);
    const specDirs = entries.filter(entry => {
      const fullPath = path.join(specPath, entry);
      return fs.statSync(fullPath).isDirectory();
    });

    if (specDirs.length === 0) {
      throw new Error(`No spec directories found in ${specPath}`);
    }

    // Validate each spec directory
    for (const specDir of specDirs) {
      const fullSpecPath = path.join(specPath, specDir);
      postSpecValidate(fullSpecPath);
    }
  } else {
    // Validate single spec directory
    postSpecValidate(specPath);
  }
}