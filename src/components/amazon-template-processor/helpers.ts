/**
 * Amazon Template Processor - Helper Functions
 * Template helper functions including {{json ...}} helper for YAML front-matter embedding
 */

export interface TemplateHelpers {
  json: (value: any) => string;
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  formatDate: (date: Date | string) => string;
  truncate: (text: string, length: number) => string;
  capitalize: (text: string) => string;
  pluralize: (count: number, singular: string, plural?: string) => string;
}

/**
 * Template helper functions for Amazon working backwards documents
 */
export class AmazonTemplateHelpers implements TemplateHelpers {
  /**
   * JSON helper for YAML front-matter embedding
   * Converts any value to JSON string for use in YAML front-matter
   */
  json(value: any): string {
    try {
      if (value === undefined) {
        return '{}';
      }
      return JSON.stringify(value, null, 0);
    } catch (error) {
      console.warn('Failed to serialize value to JSON:', error);
      return '{}';
    }
  }

  /**
   * Format number as currency
   */
  formatCurrency(value: number): string {
    if (typeof value !== 'number' || isNaN(value)) return '$0';

    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 10000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  }

  /**
   * Format number as percentage
   */
  formatPercent(value: number): string {
    if (typeof value !== 'number' || isNaN(value)) return '0%';
    return `${Math.round(value)}%`;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid Date';

    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Truncate text to specified length
   */
  truncate(text: string, length: number): string {
    if (typeof text !== 'string') return '';
    if (text.length <= length) return text;
    return text.substring(0, length - 3) + '...';
  }

  /**
   * Capitalize first letter of text
   */
  capitalize(text: string): string {
    if (typeof text !== 'string' || text.length === 0) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Pluralize word based on count
   */
  pluralize(count: number, singular: string, plural?: string): string {
    if (count === 1) return singular;
    return plural || `${singular}s`;
  }
}

/**
 * Helper function registry for template processing
 */
export class TemplateHelperRegistry {
  private helpers: Map<string, Function> = new Map();
  private amazonHelpers: AmazonTemplateHelpers;

  constructor() {
    this.amazonHelpers = new AmazonTemplateHelpers();
    this.registerDefaultHelpers();
  }

  /**
   * Register default Amazon template helpers
   */
  private registerDefaultHelpers(): void {
    this.helpers.set('json', this.amazonHelpers.json.bind(this.amazonHelpers));
    this.helpers.set('formatCurrency', this.amazonHelpers.formatCurrency.bind(this.amazonHelpers));
    this.helpers.set('formatPercent', this.amazonHelpers.formatPercent.bind(this.amazonHelpers));
    this.helpers.set('formatDate', this.amazonHelpers.formatDate.bind(this.amazonHelpers));
    this.helpers.set('truncate', this.amazonHelpers.truncate.bind(this.amazonHelpers));
    this.helpers.set('capitalize', this.amazonHelpers.capitalize.bind(this.amazonHelpers));
    this.helpers.set('pluralize', this.amazonHelpers.pluralize.bind(this.amazonHelpers));
  }

  /**
   * Register a custom helper function
   */
  registerHelper(name: string, fn: Function): void {
    this.helpers.set(name, fn);
  }

  /**
   * Get helper function by name
   */
  getHelper(name: string): Function | undefined {
    return this.helpers.get(name);
  }

  /**
   * Check if helper exists
   */
  hasHelper(name: string): boolean {
    return this.helpers.has(name);
  }

  /**
   * Get all registered helper names
   */
  getHelperNames(): string[] {
    return Array.from(this.helpers.keys());
  }

  /**
   * Process helper expression with arguments
   */
  processHelper(helperName: string, args: any[], context: any): any {
    const helper = this.getHelper(helperName);
    if (!helper) {
      throw new Error(`Unknown helper: ${helperName}`);
    }

    try {
      return helper.apply(context, args);
    } catch (error) {
      console.warn(`Helper ${helperName} failed:`, error);
      throw error;
    }
  }
}

/**
 * Parse helper expression from template
 * Examples:
 * - {{json confidence.breakdown}} -> { name: 'json', args: ['confidence.breakdown'] }
 * - {{formatCurrency 1000}} -> { name: 'formatCurrency', args: [1000] }
 * - {{truncate title 50}} -> { name: 'truncate', args: ['title', 50] }
 */
export interface HelperExpression {
  name: string;
  args: string[];
}

export function parseHelperExpression(expression: string): HelperExpression {
  const parts = expression.trim().split(/\s+/);
  const name = parts[0];
  const args = parts.slice(1);

  return { name, args };
}

/**
 * Evaluate helper arguments in context
 */
export function evaluateHelperArgs(args: string[], context: any): any[] {
  return args.map(arg => {
    // Try to parse as number
    const num = parseFloat(arg);
    if (!isNaN(num)) return num;

    // Try to parse as boolean
    if (arg === 'true') return true;
    if (arg === 'false') return false;

    // Try to parse as string literal
    if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
      return arg.slice(1, -1);
    }

    // Treat as property path
    return getNestedProperty(context, arg);
  });
}

/**
 * Get nested property from object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Template validation helpers
 */
export interface ValidationRule {
  type: 'required_section' | 'required_variable' | 'helper_usage' | 'front_matter';
  pattern: string | RegExp;
  description: string;
}

export const AMAZON_TEMPLATE_VALIDATION_RULES: ValidationRule[] = [
  {
    type: 'required_section',
    pattern: /^## Evidence Mechanisms$/m,
    description: 'Must include Evidence Mechanisms section',
  },
  {
    type: 'required_section',
    pattern: /^### Assumption Ledger$/m,
    description: 'Must include Assumption Ledger subsection',
  },
  {
    type: 'required_section',
    pattern: /^### Confidence Score$/m,
    description: 'Must include Confidence Score subsection',
  },
  {
    type: 'required_variable',
    pattern: /\{\{featureName\}\}/,
    description: 'Must include featureName variable',
  },
  {
    type: 'required_variable',
    pattern: /\{\{customer\}\}/,
    description: 'Must include customer variable',
  },
  {
    type: 'helper_usage',
    pattern: /\{\{json\s+[^}]+\}\}/,
    description: 'Must use json helper for front-matter',
  },
  {
    type: 'front_matter',
    pattern: /^---\n[\s\S]*?\n---/,
    description: 'Must include YAML front-matter',
  },
];

/**
 * Validate template against Amazon working backwards requirements
 */
export function validateAmazonTemplate(template: string): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  for (const rule of AMAZON_TEMPLATE_VALIDATION_RULES) {
    const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;

    if (!pattern.test(template)) {
      violations.push(rule.description);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}
