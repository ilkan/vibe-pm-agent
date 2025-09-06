/**
 * Unit tests for Kiro policy hooks (gates)
 * 
 * Tests the pre-codegen gate and post-spec validation hooks
 * to ensure proper spec validation and traceability.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { validateSpecSections, preCodegenGate } from '../../../.kiro/hooks/pre_codegen_gate';
import { validateAcceptanceCriteriaMapping, postSpecValidate } from '../../../.kiro/hooks/post_spec_validate';

describe('Policy Hooks Validation', () => {
  let tempDir: string;
  let testSpecPath: string;

  beforeEach(() => {
    // Create temporary directory for test specs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiro-hooks-test-'));
    testSpecPath = path.join(tempDir, 'test-spec');
    fs.mkdirSync(testSpecPath, { recursive: true });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Pre-Codegen Gate Hook', () => {
    describe('validateSpecSections', () => {
      it('should pass validation when all required sections are present', () => {
        // Create valid spec files
        const validRequirements = `# Generated-by: Kiro Spec Mode
# Requirements Document

## Introduction
Test introduction

## Requirements

### Requirement 1
**User Story:** As a user, I want to test, so that validation works

#### Acceptance Criteria
1. WHEN testing THEN validation SHALL pass`;

        const validDesign = `# Generated-by: Kiro Spec Mode
# Design Document

## Overview
Test overview

## Architecture
Test architecture

## Components and Interfaces
Test components`;

        const validTasks = `# Generated-by: Kiro Spec Mode
# Implementation Plan

- [ ] 1. Test task
  - Test task description
  - _Requirements: 1.1_`;

        fs.writeFileSync(path.join(testSpecPath, 'requirements.md'), validRequirements);
        fs.writeFileSync(path.join(testSpecPath, 'design.md'), validDesign);
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), validTasks);

        const result = validateSpecSections(testSpecPath);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail validation when required files are missing', () => {
        // Only create requirements.md, missing design.md and tasks.md
        fs.writeFileSync(path.join(testSpecPath, 'requirements.md'), '# Requirements');

        const result = validateSpecSections(testSpecPath);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2); // Missing design.md and tasks.md
        expect(result.errors[0].message).toContain('design.md');
        expect(result.errors[1].message).toContain('tasks.md');
      });

      it('should fail validation when files are empty', () => {
        // Create empty files
        fs.writeFileSync(path.join(testSpecPath, 'requirements.md'), '');
        fs.writeFileSync(path.join(testSpecPath, 'design.md'), '');
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), '');

        const result = validateSpecSections(testSpecPath);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors.every(e => e.message.includes('empty'))).toBe(true);
      });

      it('should warn about missing content patterns', () => {
        // Create files with minimal content but missing expected patterns
        fs.writeFileSync(path.join(testSpecPath, 'requirements.md'), 'Some content');
        fs.writeFileSync(path.join(testSpecPath, 'design.md'), 'Some content');
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), 'Some content');

        const result = validateSpecSections(testSpecPath);

        expect(result.isValid).toBe(true); // No errors, just warnings
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      it('should fail validation when spec directory does not exist', () => {
        const nonExistentPath = path.join(tempDir, 'non-existent');

        const result = validateSpecSections(nonExistentPath);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('does not exist');
      });
    });

    describe('preCodegenGate', () => {
      it('should throw error when validation fails', () => {
        // Create incomplete spec (missing files)
        fs.writeFileSync(path.join(testSpecPath, 'requirements.md'), '# Requirements');

        expect(() => {
          preCodegenGate(testSpecPath);
        }).toThrow('Pre-codegen gate failed');
      });

      it('should not throw when validation passes', () => {
        // Create complete spec
        const validRequirements = `# Generated-by: Kiro Spec Mode
# Requirements Document

## Introduction
Test

## Requirements

### Requirement 1
**User Story:** Test

#### Acceptance Criteria
1. Test`;

        const validDesign = `# Generated-by: Kiro Spec Mode
# Design Document

## Overview
Test

## Architecture
Test

## Components and Interfaces
Test`;

        const validTasks = `# Generated-by: Kiro Spec Mode
# Implementation Plan

- [ ] 1. Test task`;

        fs.writeFileSync(path.join(testSpecPath, 'requirements.md'), validRequirements);
        fs.writeFileSync(path.join(testSpecPath, 'design.md'), validDesign);
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), validTasks);

        expect(() => {
          preCodegenGate(testSpecPath);
        }).not.toThrow();
      });
    });
  });

  describe('Post-Spec Validation Hook', () => {
    describe('validateAcceptanceCriteriaMapping', () => {
      it('should pass validation when acceptance criteria are properly mapped', () => {
        // Create spec YAML with acceptance criteria
        const specYaml = `
id: test_spec
acceptance_criteria:
  - id: "AC001"
    description: "Test acceptance criterion"
    mapped_tasks: ["T001"]
  - id: "AC002"
    description: "Another test criterion"
    mapped_tasks: ["T002"]
`;

        // Create tasks.md with proper references
        const tasksContent = `# Implementation Plan

- [ ] T001. First task
  - Task description
  - _Requirements: 1.1_
  - _Acceptance Criteria: AC001_

- [ ] T002. Second task
  - Task description
  - _Requirements: 1.2_
  - _Acceptance Criteria: AC002_`;

        fs.writeFileSync(path.join(testSpecPath, 'vibe_pm_agent.yaml'), specYaml);
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), tasksContent);

        const result = validateAcceptanceCriteriaMapping(testSpecPath);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.coverage.coveragePercentage).toBe(100);
      });

      it('should fail validation when acceptance criteria are orphaned', () => {
        // Create spec YAML with acceptance criteria
        const specYaml = `
id: test_spec
acceptance_criteria:
  - id: "AC001"
    description: "Orphaned acceptance criterion"
  - id: "AC002"
    description: "Another orphaned criterion"
`;

        // Create tasks.md without proper references
        const tasksContent = `# Implementation Plan

- [ ] T001. Task without AC reference
  - Task description`;

        fs.writeFileSync(path.join(testSpecPath, 'vibe_pm_agent.yaml'), specYaml);
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), tasksContent);

        const result = validateAcceptanceCriteriaMapping(testSpecPath);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2); // Both AC001 and AC002 are orphaned
        expect(result.coverage.coveragePercentage).toBe(0);
      });

      it('should warn about missing test mapping', () => {
        // Create spec YAML without test_mapping
        const specYaml = `
id: test_spec
acceptance_criteria:
  - id: "AC001"
    description: "Test criterion without test mapping"
    mapped_tasks: ["T001"]
`;

        const tasksContent = `# Implementation Plan

- [ ] T001. Task with AC reference
  - _Acceptance Criteria: AC001_`;

        fs.writeFileSync(path.join(testSpecPath, 'vibe_pm_agent.yaml'), specYaml);
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), tasksContent);

        const result = validateAcceptanceCriteriaMapping(testSpecPath);

        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.type === 'missing_test_mapping')).toBe(true);
      });

      it('should handle missing spec files gracefully', () => {
        // No files created - should handle gracefully
        const result = validateAcceptanceCriteriaMapping(testSpecPath);

        expect(result.isValid).toBe(true); // No errors, but warnings about missing data
        expect(result.coverage.totalAcceptanceCriteria).toBe(0);
      });
    });

    describe('postSpecValidate', () => {
      it('should throw error when validation fails', () => {
        // Create spec with orphaned acceptance criteria
        const specYaml = `
id: test_spec
acceptance_criteria:
  - id: "AC001"
    description: "Orphaned criterion"
`;

        fs.writeFileSync(path.join(testSpecPath, 'vibe_pm_agent.yaml'), specYaml);
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), '# No tasks');

        expect(() => {
          postSpecValidate(testSpecPath);
        }).toThrow('Post-spec validation failed');
      });

      it('should not throw when validation passes', () => {
        // Create valid spec with proper mapping
        const specYaml = `
id: test_spec
acceptance_criteria:
  - id: "AC001"
    description: "Valid criterion"
    mapped_tasks: ["T001"]
`;

        const tasksContent = `# Implementation Plan

- [ ] T001. Valid task
  - _Acceptance Criteria: AC001_`;

        fs.writeFileSync(path.join(testSpecPath, 'vibe_pm_agent.yaml'), specYaml);
        fs.writeFileSync(path.join(testSpecPath, 'tasks.md'), tasksContent);

        expect(() => {
          postSpecValidate(testSpecPath);
        }).not.toThrow();
      });
    });
  });

  describe('Error Message Quality', () => {
    it('should provide clear error messages for pre-codegen failures', () => {
      // Create incomplete spec
      fs.writeFileSync(path.join(testSpecPath, 'requirements.md'), '');

      try {
        preCodegenGate(testSpecPath);
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain('Pre-codegen gate failed');
        expect(err.message).toContain('validation errors found');
        expect(err.message).toContain('requirements.md');
      }
    });

    it('should provide clear error messages for post-spec failures', () => {
      // Create spec with orphaned AC
      const specYaml = `
id: test_spec
acceptance_criteria:
  - id: "AC001"
    description: "Orphaned"
`;

      fs.writeFileSync(path.join(testSpecPath, 'vibe_pm_agent.yaml'), specYaml);

      try {
        postSpecValidate(testSpecPath);
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain('Post-spec validation failed');
        expect(err.message).toContain('AC001');
        expect(err.message).toContain('Coverage:');
      }
    });
  });
});