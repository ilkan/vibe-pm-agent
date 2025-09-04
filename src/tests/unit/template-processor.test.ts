/**
 * Unit tests for TemplateProcessor component
 */

import { TemplateProcessor, TemplatePlaceholders, ContentExtractionConfig } from '../../components/template-processor';

describe('TemplateProcessor', () => {
  let processor: TemplateProcessor;

  beforeEach(() => {
    processor = new TemplateProcessor();
  });

  describe('processTemplate', () => {
    it('should replace simple placeholders', () => {
      const template = 'Hello {name}, welcome to {project}!';
      const placeholders: TemplatePlaceholders = {
        name: 'John',
        project: 'Kiro'
      };

      const result = processor.processTemplate(template, placeholders);
      expect(result).toBe('Hello John, welcome to Kiro!');
    });

    it('should handle multiple occurrences of same placeholder', () => {
      const template = '{name} loves {name}\'s work on {name}';
      const placeholders: TemplatePlaceholders = {
        name: 'Alice'
      };

      const result = processor.processTemplate(template, placeholders);
      expect(result).toBe('Alice loves Alice\'s work on Alice');
    });

    it('should handle missing placeholders gracefully', () => {
      const template = 'Hello {name}, your {missing} is ready';
      const placeholders: TemplatePlaceholders = {
        name: 'Bob'
      };

      const result = processor.processTemplate(template, placeholders);
      expect(result).toBe('Hello Bob, your  is ready');
    });

    it('should handle special regex characters in placeholders', () => {
      const template = 'Pattern: {regex_pattern}';
      const placeholders: TemplatePlaceholders = {
        regex_pattern: '.*+?^${}()|[]\\/'
      };

      const result = processor.processTemplate(template, placeholders);
      expect(result).toBe('Pattern: .*+?^${}()|[]\\/');
    });

    it('should handle empty placeholders', () => {
      const template = 'Start{empty}End';
      const placeholders: TemplatePlaceholders = {
        empty: ''
      };

      const result = processor.processTemplate(template, placeholders);
      expect(result).toBe('StartEnd');
    });
  });

  describe('validateTemplate', () => {
    it('should validate template with all required placeholders', () => {
      const template = 'Hello {name}, welcome to {project}!';
      const required = ['name', 'project'];

      const result = processor.validateTemplate(template, required);
      expect(result.valid).toBe(true);
      expect(result.missingPlaceholders).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing required placeholders', () => {
      const template = 'Hello {name}!';
      const required = ['name', 'project', 'version'];

      const result = processor.validateTemplate(template, required);
      expect(result.valid).toBe(false);
      expect(result.missingPlaceholders).toEqual(['project', 'version']);
      expect(result.errors).toContain('Missing required placeholders: project, version');
    });

    it('should detect unused placeholders', () => {
      const template = 'Hello {name}, {extra} and {another}!';
      const required = ['name'];

      const result = processor.validateTemplate(template, required);
      expect(result.valid).toBe(true); // Still valid, just has unused placeholders
      expect(result.unusedPlaceholders).toEqual(['extra', 'another']);
    });

    it('should handle template with no placeholders', () => {
      const template = 'Hello world!';
      const required = ['name'];

      const result = processor.validateTemplate(template, required);
      expect(result.valid).toBe(false);
      expect(result.missingPlaceholders).toEqual(['name']);
    });
  });

  describe('extractSections', () => {
    it('should extract sections from markdown document', () => {
      const document = `# Main Title
Content for main section.

## Subsection 1
Content for subsection 1.

### Deep Section
Deep content here.

## Subsection 2
Content for subsection 2.`;

      const sections = processor.extractSections(document);
      
      expect(sections).toHaveLength(4);
      expect(sections[0].title).toBe('Main Title');
      expect(sections[0].level).toBe(1);
      expect(sections[1].title).toBe('Subsection 1');
      expect(sections[1].level).toBe(2);
      expect(sections[2].title).toBe('Deep Section');
      expect(sections[2].level).toBe(3);
    });

    it('should handle document without headers', () => {
      const document = 'Just plain text content without any headers.';
      
      const sections = processor.extractSections(document);
      expect(sections).toHaveLength(0);
    });

    it('should handle empty document', () => {
      const document = '';
      
      const sections = processor.extractSections(document);
      expect(sections).toHaveLength(0);
    });
  });

  describe('extractSectionByKeywords', () => {
    const sampleDocument = `# Introduction
This is the introduction section with important context.

## Requirements
These are the system requirements.

## Design Options
Here are the design alternatives.

## Implementation
Implementation details go here.`;

    it('should extract section by exact keyword match', () => {
      const result = processor.extractSectionByKeywords(sampleDocument, ['requirements']);
      expect(result).toContain('These are the system requirements.');
    });

    it('should extract section by partial keyword match', () => {
      const result = processor.extractSectionByKeywords(sampleDocument, ['design']);
      expect(result).toContain('Here are the design alternatives.');
    });

    it('should return null when no matching section found', () => {
      const result = processor.extractSectionByKeywords(sampleDocument, ['nonexistent']);
      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const result = processor.extractSectionByKeywords(sampleDocument, ['INTRODUCTION']);
      expect(result).toContain('This is the introduction section');
    });
  });

  describe('extractBusinessContext', () => {
    it('should extract introduction section as business context', () => {
      const requirements = `# Requirements Document

## Introduction
This feature will revolutionize user authentication by providing seamless SSO integration.

## Requirements
1. User login functionality`;

      const context = processor.extractBusinessContext(requirements);
      expect(context).toContain('revolutionize user authentication');
    });

    it('should fallback to first content when no introduction found', () => {
      const requirements = `# Some Title
This is the first substantial content that should be extracted as context.

More content here.`;

      const context = processor.extractBusinessContext(requirements);
      expect(context).toContain('first substantial content');
    });

    it('should return default message when no context found', () => {
      const requirements = `# Title
`;

      const context = processor.extractBusinessContext(requirements);
      expect(context).toBe('Business context not explicitly defined in requirements.');
    });
  });

  describe('extractKeyRequirements', () => {
    it('should extract requirements sections', () => {
      const requirements = `# Requirements

## Requirement 1
User authentication must be secure.

### Acceptance Criteria
1. WHEN user logs in THEN system SHALL validate credentials
2. IF login fails THEN system SHALL show error message`;

      const result = processor.extractKeyRequirements(requirements);
      expect(result).toContain('Requirement 1');
      expect(result).toContain('User authentication must be secure');
    });

    it('should extract EARS format requirements', () => {
      const requirements = `Some content here.

1. WHEN user clicks login THEN system SHALL authenticate user
2. IF authentication fails THEN system SHALL display error message`;

      const result = processor.extractKeyRequirements(requirements);
      expect(result).toContain('WHEN user clicks login');
      expect(result).toContain('IF authentication fails');
    });

    it('should return fallback message when no requirements found', () => {
      const requirements = `# Some Document
Just regular content without requirements.`;

      const result = processor.extractKeyRequirements(requirements);
      expect(result).toBe('Requirements structure not found in standard format.');
    });
  });

  describe('extractDesignOptions', () => {
    it('should extract design options section', () => {
      const design = `# Design Document

## Design Options
We have three approaches:

### Conservative Approach
Low risk, basic functionality.

### Balanced Approach  
Medium risk, good features.

### Bold Approach
High risk, innovative features.`;

      const result = processor.extractDesignOptions(design);
      expect(result).toContain('three approaches');
    });

    it('should extract Conservative/Balanced/Bold pattern', () => {
      const design = `Some content.

**Conservative**: Basic implementation
**Balanced**: Standard implementation  
**Bold**: Advanced implementation`;

      const result = processor.extractDesignOptions(design);
      expect(result).toContain('Conservative');
      expect(result).toContain('Balanced');
      expect(result).toContain('Bold');
    });

    it('should return fallback when no options found', () => {
      const design = `# Design
Just regular design content.`;

      const result = processor.extractDesignOptions(design);
      expect(result).toBe('Design options not explicitly structured in document.');
    });
  });

  describe('extractImpactEffortMatrix', () => {
    it('should extract matrix section', () => {
      const design = `# Design

## Impact vs Effort Matrix

| Option | Impact | Effort |
|--------|--------|--------|
| A      | High   | Low    |
| B      | Medium | Medium |`;

      const result = processor.extractImpactEffortMatrix(design);
      expect(result).toContain('| Option | Impact | Effort |');
    });

    it('should extract table format matrix', () => {
      const design = `Content here.

| Feature | Impact | Effort |
| Login   | High   | Medium |
| SSO     | High   | High   |`;

      const result = processor.extractImpactEffortMatrix(design);
      expect(result).toContain('| Feature | Impact | Effort |');
    });

    it('should return fallback when no matrix found', () => {
      const design = `# Design
Regular content without matrix.`;

      const result = processor.extractImpactEffortMatrix(design);
      expect(result).toBe('Impact vs Effort analysis not found in structured format.');
    });
  });

  describe('extractExecutiveSummary', () => {
    it('should extract executive summary section', () => {
      const onePager = `# One Pager

## Executive Summary
This project will deliver significant value by improving user experience and reducing operational costs.

## Details
More details here.`;

      const result = processor.extractExecutiveSummary(onePager);
      expect(result).toContain('significant value');
      expect(result).toContain('operational costs');
    });

    it('should fallback to first substantial paragraph', () => {
      const onePager = `# Title

This is a substantial paragraph that should be extracted as the executive summary because it contains enough content to be meaningful.`;

      const result = processor.extractExecutiveSummary(onePager);
      expect(result).toContain('substantial paragraph');
    });

    it('should return fallback when no summary found', () => {
      const onePager = `# Title
Short.`;

      const result = processor.extractExecutiveSummary(onePager);
      expect(result).toBe('Executive summary not found in one-pager.');
    });
  });

  describe('extractROIAnalysis', () => {
    it('should extract ROI section', () => {
      const onePager = `# One Pager

## ROI Analysis
Expected savings of $100,000 annually with implementation cost of $50,000.

## Other Section
Other content.`;

      const result = processor.extractROIAnalysis(onePager);
      expect(result).toContain('$100,000 annually');
      expect(result).toContain('$50,000');
    });

    it('should extract financial data patterns', () => {
      const onePager = `Content here.

Cost: $25,000
Savings: $75,000 per year
ROI: 300% in first year`;

      const result = processor.extractROIAnalysis(onePager);
      expect(result).toContain('$25,000');
      expect(result).toContain('$75,000');
      expect(result).toContain('ROI: 300%');
    });

    it('should return fallback when no ROI found', () => {
      const onePager = `# One Pager
No financial information here.`;

      const result = processor.extractROIAnalysis(onePager);
      expect(result).toBe('ROI analysis not found in structured format.');
    });
  });

  describe('extractTaskBreakdown', () => {
    it('should extract checkbox tasks', () => {
      const taskPlan = `# Tasks

- [ ] Task 1: Implement authentication
- [x] Task 2: Setup database
- [ ] Task 3: Create UI components`;

      const result = processor.extractTaskBreakdown(taskPlan);
      expect(result).toContain('- [ ] Task 1');
      expect(result).toContain('- [x] Task 2');
      expect(result).toContain('- [ ] Task 3');
    });

    it('should extract numbered tasks', () => {
      const taskPlan = `Content here.

1. First task
2. Second task
3.1 Subtask
3.2 Another subtask`;

      const result = processor.extractTaskBreakdown(taskPlan);
      expect(result).toContain('1. First task');
      expect(result).toContain('3.1 Subtask');
    });

    it('should return fallback when no tasks found', () => {
      const taskPlan = `# Plan
Just regular content without tasks.`;

      const result = processor.extractTaskBreakdown(taskPlan);
      expect(result).toBe('Task breakdown not found in standard format.');
    });
  });

  describe('generateFileReferences', () => {
    it('should generate file references in correct format', () => {
      const files = ['spec/requirements.md', 'spec/design.md', 'spec/tasks.md'];
      
      const references = processor.generateFileReferences(files);
      
      expect(references).toEqual([
        '#[[file:spec/requirements.md]]',
        '#[[file:spec/design.md]]',
        '#[[file:spec/tasks.md]]'
      ]);
    });

    it('should filter out empty files', () => {
      const files = ['spec/requirements.md', '', '  ', 'spec/design.md'];
      
      const references = processor.generateFileReferences(files);
      
      expect(references).toEqual([
        '#[[file:spec/requirements.md]]',
        '#[[file:spec/design.md]]'
      ]);
    });

    it('should handle empty array', () => {
      const references = processor.generateFileReferences([]);
      expect(references).toEqual([]);
    });
  });

  describe('formatFileReferences', () => {
    it('should format references as markdown', () => {
      const references = [
        '#[[file:spec/requirements.md]]',
        '#[[file:spec/design.md]]'
      ];
      
      const formatted = processor.formatFileReferences(references);
      expect(formatted).toBe('#[[file:spec/requirements.md]]\n#[[file:spec/design.md]]');
    });

    it('should handle empty references', () => {
      const formatted = processor.formatFileReferences([]);
      expect(formatted).toBe('*No related documents found.*');
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const config: ContentExtractionConfig = {
        maxSectionLength: 100,
        preserveMarkdown: false
      };
      
      const customProcessor = new TemplateProcessor(config);
      expect(customProcessor.getConfig().maxSectionLength).toBe(100);
      expect(customProcessor.getConfig().preserveMarkdown).toBe(false);
    });

    it('should update configuration', () => {
      processor.updateConfig({ maxSectionLength: 200 });
      expect(processor.getConfig().maxSectionLength).toBe(200);
    });
  });
});