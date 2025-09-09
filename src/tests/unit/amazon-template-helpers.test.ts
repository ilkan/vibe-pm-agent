/**
 * Amazon Template Helpers - Unit Tests
 * Tests for template helper functions including {{json ...}} helper
 */

import { 
  AmazonTemplateHelpers, 
  TemplateHelperRegistry, 
  parseHelperExpression, 
  evaluateHelperArgs,
  validateAmazonTemplate,
  AMAZON_TEMPLATE_VALIDATION_RULES
} from '../../components/amazon-template-processor/helpers';

describe('AmazonTemplateHelpers', () => {
  let helpers: AmazonTemplateHelpers;

  beforeEach(() => {
    helpers = new AmazonTemplateHelpers();
  });

  describe('json helper', () => {
    test('should serialize simple objects to JSON', () => {
      const obj = { name: 'test', value: 123 };
      const result = helpers.json(obj);
      expect(result).toBe('{"name":"test","value":123}');
    });

    test('should serialize arrays to JSON', () => {
      const arr = ['A1', 'A2', 'A3'];
      const result = helpers.json(arr);
      expect(result).toBe('["A1","A2","A3"]');
    });

    test('should handle nested objects', () => {
      const obj = {
        confidence: {
          total: 85,
          breakdown: { evidence: 90, recency: 80 }
        }
      };
      const result = helpers.json(obj);
      expect(result).toBe('{"confidence":{"total":85,"breakdown":{"evidence":90,"recency":80}}}');
    });

    test('should handle null and undefined', () => {
      expect(helpers.json(null)).toBe('null');
      expect(helpers.json(undefined)).toBe('{}');
    });

    test('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Create circular reference
      
      const result = helpers.json(obj);
      expect(result).toBe('{}'); // Should fallback to empty object
    });
  });

  describe('formatCurrency helper', () => {
    test('should format large numbers with M suffix', () => {
      expect(helpers.formatCurrency(2500000)).toBe('$2.5M');
      expect(helpers.formatCurrency(1000000)).toBe('$1.0M');
    });

    test('should format thousands with K suffix', () => {
      expect(helpers.formatCurrency(15000)).toBe('$15K');
      expect(helpers.formatCurrency(25000)).toBe('$25K');
    });

    test('should format small numbers with commas', () => {
      expect(helpers.formatCurrency(500)).toBe('$500');
      expect(helpers.formatCurrency(1234)).toBe('$1,234');
      expect(helpers.formatCurrency(5000)).toBe('$5,000'); // Below 10K threshold
    });

    test('should handle invalid inputs', () => {
      expect(helpers.formatCurrency(NaN)).toBe('$0');
      expect(helpers.formatCurrency('invalid' as any)).toBe('$0');
    });
  });

  describe('formatPercent helper', () => {
    test('should format numbers as percentages', () => {
      expect(helpers.formatPercent(85.7)).toBe('86%');
      expect(helpers.formatPercent(100)).toBe('100%');
      expect(helpers.formatPercent(0)).toBe('0%');
    });

    test('should handle invalid inputs', () => {
      expect(helpers.formatPercent(NaN)).toBe('0%');
      expect(helpers.formatPercent('invalid' as any)).toBe('0%');
    });
  });

  describe('formatDate helper', () => {
    test('should format Date objects', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(helpers.formatDate(date)).toBe('2024-01-15');
    });

    test('should format date strings', () => {
      expect(helpers.formatDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
    });

    test('should handle invalid dates', () => {
      expect(helpers.formatDate('invalid')).toBe('Invalid Date');
      expect(helpers.formatDate(new Date('invalid'))).toBe('Invalid Date');
    });
  });

  describe('truncate helper', () => {
    test('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated';
      expect(helpers.truncate(text, 20)).toBe('This is a very lo...');
    });

    test('should not truncate short text', () => {
      const text = 'Short text';
      expect(helpers.truncate(text, 20)).toBe('Short text');
    });

    test('should handle invalid inputs', () => {
      expect(helpers.truncate(null as any, 10)).toBe('');
      expect(helpers.truncate(undefined as any, 10)).toBe('');
    });
  });

  describe('capitalize helper', () => {
    test('should capitalize first letter', () => {
      expect(helpers.capitalize('hello world')).toBe('Hello world');
      expect(helpers.capitalize('test')).toBe('Test');
    });

    test('should handle empty strings', () => {
      expect(helpers.capitalize('')).toBe('');
    });

    test('should handle invalid inputs', () => {
      expect(helpers.capitalize(null as any)).toBe('');
      expect(helpers.capitalize(undefined as any)).toBe('');
    });
  });

  describe('pluralize helper', () => {
    test('should return singular for count of 1', () => {
      expect(helpers.pluralize(1, 'item')).toBe('item');
      expect(helpers.pluralize(1, 'assumption')).toBe('assumption');
    });

    test('should return plural for other counts', () => {
      expect(helpers.pluralize(0, 'item')).toBe('items');
      expect(helpers.pluralize(2, 'item')).toBe('items');
      expect(helpers.pluralize(5, 'item')).toBe('items');
    });

    test('should use custom plural form', () => {
      expect(helpers.pluralize(2, 'child', 'children')).toBe('children');
      expect(helpers.pluralize(1, 'child', 'children')).toBe('child');
    });
  });
});

describe('TemplateHelperRegistry', () => {
  let registry: TemplateHelperRegistry;

  beforeEach(() => {
    registry = new TemplateHelperRegistry();
  });

  test('should register default helpers', () => {
    const helpers = registry.getHelperNames();
    expect(helpers).toContain('json');
    expect(helpers).toContain('formatCurrency');
    expect(helpers).toContain('formatPercent');
    expect(helpers).toContain('formatDate');
    expect(helpers).toContain('truncate');
    expect(helpers).toContain('capitalize');
    expect(helpers).toContain('pluralize');
  });

  test('should register custom helpers', () => {
    const customHelper = (text: string) => text.toUpperCase();
    registry.registerHelper('uppercase', customHelper);
    
    expect(registry.hasHelper('uppercase')).toBe(true);
    expect(registry.getHelperNames()).toContain('uppercase');
  });

  test('should process helpers with arguments', () => {
    const result = registry.processHelper('json', [{ test: 'value' }], {});
    expect(result).toBe('{"test":"value"}');
  });

  test('should handle unknown helpers', () => {
    expect(() => registry.processHelper('unknown', [], {})).toThrow('Unknown helper: unknown');
  });

  test('should handle helper errors gracefully', () => {
    const errorHelper = () => { throw new Error('Test error'); };
    registry.registerHelper('errorHelper', errorHelper);
    
    expect(() => registry.processHelper('errorHelper', [], {})).toThrow('Test error');
  });
});

describe('Helper Expression Parsing', () => {
  test('should parse simple helper expressions', () => {
    const expr = parseHelperExpression('json confidence.breakdown');
    expect(expr.name).toBe('json');
    expect(expr.args).toEqual(['confidence.breakdown']);
  });

  test('should parse helpers with multiple arguments', () => {
    const expr = parseHelperExpression('truncate title 50');
    expect(expr.name).toBe('truncate');
    expect(expr.args).toEqual(['title', '50']);
  });

  test('should parse helpers with no arguments', () => {
    const expr = parseHelperExpression('getCurrentDate');
    expect(expr.name).toBe('getCurrentDate');
    expect(expr.args).toEqual([]);
  });

  test('should handle extra whitespace', () => {
    const expr = parseHelperExpression('  json   confidence.breakdown  ');
    expect(expr.name).toBe('json');
    expect(expr.args).toEqual(['confidence.breakdown']);
  });
});

describe('Helper Argument Evaluation', () => {
  const context = {
    confidence: { total: 85 },
    title: 'Test Title',
    count: 5
  };

  test('should evaluate numeric arguments', () => {
    const args = evaluateHelperArgs(['50', '3.14'], context);
    expect(args).toEqual([50, 3.14]);
  });

  test('should evaluate boolean arguments', () => {
    const args = evaluateHelperArgs(['true', 'false'], context);
    expect(args).toEqual([true, false]);
  });

  test('should evaluate string literals', () => {
    const args = evaluateHelperArgs(['"hello"', "'world'"], context);
    expect(args).toEqual(['hello', 'world']);
  });

  test('should evaluate property paths', () => {
    const args = evaluateHelperArgs(['confidence.total', 'title'], context);
    expect(args).toEqual([85, 'Test Title']);
  });

  test('should handle undefined properties', () => {
    const args = evaluateHelperArgs(['nonexistent.property'], context);
    expect(args).toEqual([undefined]);
  });

  test('should handle mixed argument types', () => {
    const args = evaluateHelperArgs(['title', '50', 'true', '"suffix"'], context);
    expect(args).toEqual(['Test Title', 50, true, 'suffix']);
  });
});

describe('Amazon Template Validation', () => {
  test('should validate complete Amazon template', () => {
    const validTemplate = `---
title: "PR/FAQ — Test Feature"
confidence:
  total: 85
---

# PR/FAQ — {{featureName}}

## Press Release

{{customer}} announcement

## Evidence Mechanisms

### Assumption Ledger

| ID | Name |
|----|------|
| A1 | Test |

### Confidence Score

Total: {{json confidence.breakdown}}

## Frequently Asked Questions

Q1: Test question?
`;

    const result = validateAmazonTemplate(validTemplate);
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('should identify missing required sections', () => {
    const incompleteTemplate = `---
title: "Test"
---

# Test

{{featureName}} and {{customer}}
`;

    const result = validateAmazonTemplate(incompleteTemplate);
    expect(result.isValid).toBe(false);
    expect(result.violations).toContain('Must include Evidence Mechanisms section');
    expect(result.violations).toContain('Must include Assumption Ledger subsection');
  });

  test('should identify missing json helper usage', () => {
    const templateWithoutJson = `---
title: "Test"
---

# Test

## Evidence Mechanisms

### Assumption Ledger

### Confidence Score

{{featureName}} and {{customer}}
`;

    const result = validateAmazonTemplate(templateWithoutJson);
    expect(result.isValid).toBe(false);
    expect(result.violations).toContain('Must use json helper for front-matter');
  });

  test('should identify missing front-matter', () => {
    const templateWithoutFrontMatter = `
# Test

## Evidence Mechanisms

### Assumption Ledger

### Confidence Score

{{featureName}} and {{customer}} and {{json test}}
`;

    const result = validateAmazonTemplate(templateWithoutFrontMatter);
    expect(result.isValid).toBe(false);
    expect(result.violations).toContain('Must include YAML front-matter');
  });
});

describe('Validation Rules', () => {
  test('should have all required validation rules', () => {
    const ruleTypes = AMAZON_TEMPLATE_VALIDATION_RULES.map(rule => rule.type);
    
    expect(ruleTypes).toContain('required_section');
    expect(ruleTypes).toContain('required_variable');
    expect(ruleTypes).toContain('helper_usage');
    expect(ruleTypes).toContain('front_matter');
  });

  test('should have descriptive messages for all rules', () => {
    for (const rule of AMAZON_TEMPLATE_VALIDATION_RULES) {
      expect(rule.description).toBeTruthy();
      expect(rule.description.length).toBeGreaterThan(10);
    }
  });
});