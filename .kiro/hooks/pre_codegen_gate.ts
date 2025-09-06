/**
 * Pre-Codegen Gate Hook
 * 
 * This hook validates that all required spec sections are present before code generation begins.
 * It ensures that the spec is complete and ready for implementation.
 * 
 * Generated-by: Kiro Spec Mode
 * Spec-ID: vibe_pm_agent_v2_hackathon
 * Model: claude-3.5-sonnet
 * Timestamp: 2025-01-09T10:30:00Z
 */

import * as fs from 'fs';
import * as path from 'path';

interface SpecValidationError {
  section: string;
  message: string;
  severity: 'error' | 'warning';
}

interface SpecValidationResult {
  isValid: boolean;
  errors: SpecValidationError[];
  warnings: SpecValidationError[];
}

/**
 * Required sections that must be present in a complete spec
 */
const REQUIRED_SPEC_SECTIONS = [
  'requirements.md',
  'design.md', 
  'tasks.md'
];

/**
 * Required content within each spec file
 */
const REQUIRED_CONTENT_PATTERNS = {
  'requirements.md': [
    /# Requirements Document/i,
    /## Introduction/i,
    /## Requirements/i,
    /### Requirement \d+/i,
    /\*\*User Story:\*\*/i,
    /#### Acceptance Criteria/i
  ],
  'design.md': [
    /# Design Document/i,
    /## Overview/i,
    /## Architecture/i,
    /## Components and Interfaces/i
  ],
  'tasks.md': [
    /# Implementation Plan/i,
    /- \[[ x-]\] \d+\./i  // Task items with checkboxes
  ]
};

/**
 * Validates that a spec directory contains all required sections
 */
export function validateSpecSections(specPath: string): SpecValidationResult {
  const errors: SpecValidationError[] = [];
  const warnings: SpecValidationError[] = [];

  // Check if spec directory exists
  if (!fs.existsSync(specPath)) {
    errors.push({
      section: 'directory',
      message: `Spec directory does not exist: ${specPath}`,
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Check for required spec files
  for (const requiredFile of REQUIRED_SPEC_SECTIONS) {
    const filePath = path.join(specPath, requiredFile);
    
    if (!fs.existsSync(filePath)) {
      errors.push({
        section: requiredFile,
        message: `Required spec file missing: ${requiredFile}`,
        severity: 'error'
      });
      continue;
    }

    // Validate file content
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (content.trim().length === 0) {
        errors.push({
          section: requiredFile,
          message: `Spec file is empty: ${requiredFile}`,
          severity: 'error'
        });
        continue;
      }

      // Check for required content patterns
      const requiredPatterns = REQUIRED_CONTENT_PATTERNS[requiredFile as keyof typeof REQUIRED_CONTENT_PATTERNS];
      if (requiredPatterns) {
        for (const pattern of requiredPatterns) {
          if (!pattern.test(content)) {
            warnings.push({
              section: requiredFile,
              message: `Missing expected content pattern in ${requiredFile}: ${pattern.source}`,
              severity: 'warning'
            });
          }
        }
      }

      // Check for provenance header
      if (!content.includes('Generated-by: Kiro Spec Mode')) {
        warnings.push({
          section: requiredFile,
          message: `Missing provenance header in ${requiredFile}`,
          severity: 'warning'
        });
      }

    } catch (error) {
      errors.push({
        section: requiredFile,
        message: `Error reading spec file ${requiredFile}: ${error}`,
        severity: 'error'
      });
    }
  }

  // Additional validation for tasks.md - check for acceptance criteria mapping
  const tasksPath = path.join(specPath, 'tasks.md');
  if (fs.existsSync(tasksPath)) {
    try {
      const tasksContent = fs.readFileSync(tasksPath, 'utf-8');
      
      // Check if tasks reference requirements
      if (!tasksContent.includes('_Requirements:')) {
        warnings.push({
          section: 'tasks.md',
          message: 'Tasks do not reference requirements - ensure traceability',
          severity: 'warning'
        });
      }

      // Check for guardrails task
      if (!tasksContent.includes('Guardrails Check')) {
        warnings.push({
          section: 'tasks.md',
          message: 'Missing Guardrails Check as Task 0',
          severity: 'warning'
        });
      }

    } catch (error) {
      // Already handled above
    }
  }

  const isValid = errors.length === 0;
  return { isValid, errors, warnings };
}

/**
 * Main hook function that throws if validation fails
 */
export function preCodegenGate(specPath: string): void {
  console.log(`🔍 Running pre-codegen validation for spec: ${specPath}`);
  
  const validation = validateSpecSections(specPath);
  
  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Spec validation warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`  - ${warning.section}: ${warning.message}`);
    });
  }

  // Throw on errors
  if (!validation.isValid) {
    console.error('❌ Spec validation failed with errors:');
    validation.errors.forEach(error => {
      console.error(`  - ${error.section}: ${error.message}`);
    });
    
    const errorMessage = `Pre-codegen gate failed: ${validation.errors.length} validation errors found. ` +
      `Required spec sections must be complete before code generation can begin.\n\n` +
      `Errors:\n${validation.errors.map(e => `- ${e.section}: ${e.message}`).join('\n')}`;
    
    throw new Error(errorMessage);
  }

  console.log('✅ Pre-codegen validation passed');
}

/**
 * Hook entry point - called by Kiro before code generation
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
      preCodegenGate(fullSpecPath);
    }
  } else {
    // Validate single spec directory
    preCodegenGate(specPath);
  }
}