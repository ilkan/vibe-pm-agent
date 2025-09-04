/**
 * Unit tests for SteeringFileTemplates component
 */

import { SteeringFileTemplates } from '../../components/steering-file-templates';
import { DocumentType, SteeringFileTemplate } from '../../models/steering';

describe('SteeringFileTemplates', () => {
  let templates: SteeringFileTemplates;

  beforeEach(() => {
    templates = new SteeringFileTemplates();
  });

  describe('initialization', () => {
    it('should initialize with all document types', () => {
      expect(templates.hasTemplate(DocumentType.REQUIREMENTS)).toBe(true);
      expect(templates.hasTemplate(DocumentType.DESIGN)).toBe(true);
      expect(templates.hasTemplate(DocumentType.ONEPAGER)).toBe(true);
      expect(templates.hasTemplate(DocumentType.PRFAQ)).toBe(true);
      expect(templates.hasTemplate(DocumentType.TASKS)).toBe(true);
    });

    it('should have valid templates for all document types', () => {
      const allTemplates = templates.getAllTemplates();
      
      for (const [type, template] of allTemplates) {
        expect(template.documentType).toBe(type);
        expect(template.template).toBeDefined();
        expect(template.requiredPlaceholders).toBeDefined();
        expect(template.requiredPlaceholders.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getTemplate', () => {
    it('should return requirements template', () => {
      const template = templates.getTemplate(DocumentType.REQUIREMENTS);
      
      expect(template).toBeDefined();
      expect(template!.documentType).toBe(DocumentType.REQUIREMENTS);
      expect(template!.defaultInclusionRule).toBe('fileMatch');
      expect(template!.defaultFileMatchPattern).toContain('requirements');
    });

    it('should return design template', () => {
      const template = templates.getTemplate(DocumentType.DESIGN);
      
      expect(template).toBeDefined();
      expect(template!.documentType).toBe(DocumentType.DESIGN);
      expect(template!.defaultInclusionRule).toBe('fileMatch');
      expect(template!.defaultFileMatchPattern).toContain('design');
    });

    it('should return onepager template with manual inclusion', () => {
      const template = templates.getTemplate(DocumentType.ONEPAGER);
      
      expect(template).toBeDefined();
      expect(template!.documentType).toBe(DocumentType.ONEPAGER);
      expect(template!.defaultInclusionRule).toBe('manual');
    });

    it('should return prfaq template with manual inclusion', () => {
      const template = templates.getTemplate(DocumentType.PRFAQ);
      
      expect(template).toBeDefined();
      expect(template!.documentType).toBe(DocumentType.PRFAQ);
      expect(template!.defaultInclusionRule).toBe('manual');
    });

    it('should return tasks template', () => {
      const template = templates.getTemplate(DocumentType.TASKS);
      
      expect(template).toBeDefined();
      expect(template!.documentType).toBe(DocumentType.TASKS);
      expect(template!.defaultInclusionRule).toBe('fileMatch');
      expect(template!.defaultFileMatchPattern).toContain('tasks');
    });

    it('should return undefined for non-existent template', () => {
      // Create a new enum value that doesn't exist
      const nonExistentType = 'nonexistent' as DocumentType;
      const template = templates.getTemplate(nonExistentType);
      
      expect(template).toBeUndefined();
    });
  });

  describe('template content validation', () => {
    it('should have all required placeholders in requirements template', () => {
      const template = templates.getTemplate(DocumentType.REQUIREMENTS)!;
      
      expect(template.requiredPlaceholders).toContain('feature_name');
      expect(template.requiredPlaceholders).toContain('timestamp');
      expect(template.requiredPlaceholders).toContain('business_context');
      expect(template.requiredPlaceholders).toContain('key_requirements');
      expect(template.requiredPlaceholders).toContain('consulting_insights');
      expect(template.requiredPlaceholders).toContain('related_documents');

      // Verify placeholders exist in template
      for (const placeholder of template.requiredPlaceholders) {
        expect(template.template).toContain(`{${placeholder}}`);
      }
    });

    it('should have all required placeholders in design template', () => {
      const template = templates.getTemplate(DocumentType.DESIGN)!;
      
      expect(template.requiredPlaceholders).toContain('feature_name');
      expect(template.requiredPlaceholders).toContain('design_options');
      expect(template.requiredPlaceholders).toContain('impact_effort_matrix');
      expect(template.requiredPlaceholders).toContain('architecture_guidance');

      // Verify placeholders exist in template
      for (const placeholder of template.requiredPlaceholders) {
        expect(template.template).toContain(`{${placeholder}}`);
      }
    });

    it('should have ROI-related placeholders in onepager template', () => {
      const template = templates.getTemplate(DocumentType.ONEPAGER)!;
      
      expect(template.requiredPlaceholders).toContain('roi_analysis');
      expect(template.requiredPlaceholders).toContain('executive_summary');
      expect(template.requiredPlaceholders).toContain('pyramid_principle');

      // Verify placeholders exist in template
      for (const placeholder of template.requiredPlaceholders) {
        expect(template.template).toContain(`{${placeholder}}`);
      }
    });

    it('should have PR-FAQ specific placeholders', () => {
      const template = templates.getTemplate(DocumentType.PRFAQ)!;
      
      expect(template.requiredPlaceholders).toContain('press_release');
      expect(template.requiredPlaceholders).toContain('faq_section');
      expect(template.requiredPlaceholders).toContain('product_clarity');

      // Verify placeholders exist in template
      for (const placeholder of template.requiredPlaceholders) {
        expect(template.template).toContain(`{${placeholder}}`);
      }
    });

    it('should have implementation-related placeholders in tasks template', () => {
      const template = templates.getTemplate(DocumentType.TASKS)!;
      
      expect(template.requiredPlaceholders).toContain('task_breakdown');
      expect(template.requiredPlaceholders).toContain('best_practices');
      expect(template.requiredPlaceholders).toContain('implementation_strategy');

      // Verify placeholders exist in template
      for (const placeholder of template.requiredPlaceholders) {
        expect(template.template).toContain(`{${placeholder}}`);
      }
    });
  });

  describe('template structure validation', () => {
    it('should have proper markdown structure in all templates', () => {
      const allTemplates = templates.getAllTemplates();
      
      for (const [type, template] of allTemplates) {
        // Should have main title
        expect(template.template).toMatch(/^# .+/);
        
        // Should have sections with ## headers
        expect(template.template).toContain('##');
        
        // Should have related documents section
        expect(template.template).toContain('Related Documents');
        
        // Should have generation timestamp
        expect(template.template).toContain('{timestamp}');
        
        // Should have feature name
        expect(template.template).toContain('{feature_name}');
      }
    });

    it('should have validation functions for content', () => {
      const allTemplates = templates.getAllTemplates();
      
      for (const [type, template] of allTemplates) {
        expect(template.validateContent).toBeDefined();
        
        // Test validation function with type-specific content
        let validContent = '';
        switch (type) {
          case DocumentType.REQUIREMENTS:
            validContent = 'This is a Requirements document with sufficient content to pass validation. It contains detailed requirements and has more than 100 characters.';
            break;
          case DocumentType.DESIGN:
            validContent = 'This is a Design document with sufficient content to pass validation. It contains design details and has more than 100 characters.';
            break;
          case DocumentType.ONEPAGER:
            validContent = 'This is an Executive one-pager with ROI analysis and sufficient content to pass validation.';
            break;
          case DocumentType.PRFAQ:
            validContent = 'This document contains a Press Release and FAQ section with sufficient content to pass validation.';
            break;
          case DocumentType.TASKS:
            validContent = 'This is an Implementation document with Task breakdown and sufficient content to pass validation.';
            break;
        }
        const invalidContent = '';
        
        if (template.validateContent) {
          expect(template.validateContent(validContent)).toBe(true);
          expect(template.validateContent(invalidContent)).toBe(false);
        }
      }
    });
  });

  describe('registerTemplate', () => {
    it('should register new template', () => {
      const customTemplate: SteeringFileTemplate = {
        documentType: DocumentType.REQUIREMENTS,
        defaultInclusionRule: 'always',
        template: 'Custom template with {placeholder}',
        requiredPlaceholders: ['placeholder']
      };

      templates.registerTemplate(customTemplate);
      const retrieved = templates.getTemplate(DocumentType.REQUIREMENTS);
      
      expect(retrieved).toEqual(customTemplate);
    });

    it('should override existing template', () => {
      const originalTemplate = templates.getTemplate(DocumentType.REQUIREMENTS);
      expect(originalTemplate!.defaultInclusionRule).toBe('fileMatch');

      const customTemplate: SteeringFileTemplate = {
        documentType: DocumentType.REQUIREMENTS,
        defaultInclusionRule: 'always',
        template: 'New template',
        requiredPlaceholders: ['test']
      };

      templates.registerTemplate(customTemplate);
      const newTemplate = templates.getTemplate(DocumentType.REQUIREMENTS);
      
      expect(newTemplate!.defaultInclusionRule).toBe('always');
      expect(newTemplate!.template).toBe('New template');
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      const validTemplate: SteeringFileTemplate = {
        documentType: DocumentType.REQUIREMENTS,
        defaultInclusionRule: 'fileMatch',
        defaultFileMatchPattern: 'test*',
        template: 'Template with {name} and {value}',
        requiredPlaceholders: ['name', 'value']
      };

      const result = templates.validateTemplate(validTemplate);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing documentType', () => {
      const invalidTemplate = {
        defaultInclusionRule: 'fileMatch',
        template: 'Template',
        requiredPlaceholders: []
      } as unknown as SteeringFileTemplate;

      const result = templates.validateTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template must have a documentType');
    });

    it('should detect missing template string', () => {
      const invalidTemplate = {
        documentType: DocumentType.REQUIREMENTS,
        defaultInclusionRule: 'fileMatch',
        requiredPlaceholders: []
      } as unknown as SteeringFileTemplate;

      const result = templates.validateTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template must have a template string');
    });

    it('should detect missing placeholders in template', () => {
      const invalidTemplate: SteeringFileTemplate = {
        documentType: DocumentType.REQUIREMENTS,
        defaultInclusionRule: 'fileMatch',
        template: 'Template with {name}',
        requiredPlaceholders: ['name', 'missing']
      };

      const result = templates.validateTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Required placeholder {missing} not found in template');
    });

    it('should detect missing fileMatchPattern for fileMatch inclusion', () => {
      const invalidTemplate = {
        documentType: DocumentType.REQUIREMENTS,
        defaultInclusionRule: 'fileMatch',
        template: 'Template',
        requiredPlaceholders: []
      } as unknown as SteeringFileTemplate;

      const result = templates.validateTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template with fileMatch inclusion must have defaultFileMatchPattern');
    });
  });

  describe('getTemplateStats', () => {
    it('should return correct statistics', () => {
      const stats = templates.getTemplateStats();
      
      expect(stats.totalTemplates).toBe(5); // All document types
      expect(stats.templatesByType[DocumentType.REQUIREMENTS]).toBe(true);
      expect(stats.templatesByType[DocumentType.DESIGN]).toBe(true);
      expect(stats.templatesByType[DocumentType.ONEPAGER]).toBe(true);
      expect(stats.templatesByType[DocumentType.PRFAQ]).toBe(true);
      expect(stats.templatesByType[DocumentType.TASKS]).toBe(true);
      expect(stats.averagePlaceholders).toBeGreaterThan(0);
    });

    it('should calculate average placeholders correctly', () => {
      const allTemplates = templates.getAllTemplates();
      let totalPlaceholders = 0;
      
      for (const template of allTemplates.values()) {
        totalPlaceholders += template.requiredPlaceholders.length;
      }
      
      const expectedAverage = totalPlaceholders / allTemplates.size;
      const stats = templates.getTemplateStats();
      
      expect(stats.averagePlaceholders).toBe(expectedAverage);
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates', () => {
      const allTemplates = templates.getAllTemplates();
      
      expect(allTemplates.size).toBe(5);
      expect(allTemplates.has(DocumentType.REQUIREMENTS)).toBe(true);
      expect(allTemplates.has(DocumentType.DESIGN)).toBe(true);
      expect(allTemplates.has(DocumentType.ONEPAGER)).toBe(true);
      expect(allTemplates.has(DocumentType.PRFAQ)).toBe(true);
      expect(allTemplates.has(DocumentType.TASKS)).toBe(true);
    });

    it('should return a copy of templates map', () => {
      const allTemplates = templates.getAllTemplates();
      const originalSize = allTemplates.size;
      
      // Modify the returned map
      allTemplates.clear();
      
      // Original should be unchanged
      expect(templates.getAllTemplates().size).toBe(originalSize);
    });
  });
});