/**
 * Unit tests for SteeringFileGenerator component
 */

import { SteeringFileGenerator } from '../../components/steering-file-generator/index';
import { SteeringContext, DocumentType, InclusionRule } from '../../models/steering';

describe('SteeringFileGenerator', () => {
  let generator: SteeringFileGenerator;
  let mockContext: SteeringContext;

  beforeEach(() => {
    generator = new SteeringFileGenerator();
    mockContext = {
      featureName: 'user-authentication',
      projectName: 'test-project',
      relatedFiles: [
        '.kiro/specs/user-authentication/requirements.md',
        '.kiro/specs/user-authentication/design.md',
        '.kiro/specs/user-authentication/tasks.md'
      ],
      inclusionRule: 'fileMatch' as InclusionRule,
      fileMatchPattern: 'auth*|user*',
      description: 'Test steering file generation'
    };
  });

  describe('generateFromRequirements', () => {
    it('should generate steering file from requirements document', () => {
      const mockRequirements = `# Requirements Document

## Introduction

This feature implements user authentication with OAuth2 support for secure login and session management.

## Requirements

### Requirement 1

**User Story:** As a user, I want to log in securely, so that I can access protected resources.

#### Acceptance Criteria

1. WHEN user provides valid credentials THEN system SHALL authenticate and create session
2. WHEN user provides invalid credentials THEN system SHALL reject login attempt
3. IF user session expires THEN system SHALL require re-authentication

### Requirement 2

**User Story:** As a developer, I want OAuth2 integration, so that users can login with external providers.

#### Acceptance Criteria

1. WHEN user selects OAuth provider THEN system SHALL redirect to provider authorization
2. WHEN OAuth flow completes THEN system SHALL create authenticated session
`;

      const result = generator.generateFromRequirements(mockRequirements, mockContext);

      expect(result).toBeDefined();
      expect(result.filename).toBe('user-authentication-requirements.md');
      expect(result.frontMatter.documentType).toBe(DocumentType.REQUIREMENTS);
      expect(result.frontMatter.inclusion).toBe('fileMatch');
      expect(result.frontMatter.fileMatchPattern).toBe('auth*|user*');
      expect(result.frontMatter.featureName).toBe('user-authentication');
      expect(result.frontMatter.generatedBy).toBe('vibe-pm-agent');
      expect(result.content).toContain('Requirements Guidance: user-authentication');
      expect(result.content).toContain('OAuth2 support');
      expect(result.content).toContain('EARS (Easy Approach to Requirements Syntax)');
      expect(result.references).toHaveLength(3);
      expect(result.references[0]).toBe('#[[file:.kiro/specs/user-authentication/requirements.md]]');
    });

    it('should handle requirements without clear structure', () => {
      const mockRequirements = 'Simple requirements text without proper structure.';
      
      const result = generator.generateFromRequirements(mockRequirements, mockContext);

      expect(result).toBeDefined();
      expect(result.content).toContain('Business context not explicitly defined');
      expect(result.content).toContain('Requirements structure not found');
    });

    it('should extract consulting insights from requirements', () => {
      const mockRequirements = `
# Requirements with MoSCoW prioritization

Using EARS format for acceptance criteria.

**User Story:** As a user, I want to authenticate.

#### Acceptance Criteria
1. WHEN user logs in THEN system SHALL validate credentials
`;

      const result = generator.generateFromRequirements(mockRequirements, mockContext);

      expect(result.content).toContain('MoSCoW prioritization methodology');
      expect(result.content).toContain('EARS (Easy Approach to Requirements Syntax)');
      expect(result.content).toContain('user stories for stakeholder clarity');
    });
  });

  describe('generateFromDesign', () => {
    it('should generate steering file from design document', () => {
      const mockDesign = `# Design Document

## Design Options

### Conservative Approach
- Basic authentication with username/password
- Simple session management
- Low complexity, quick implementation

### Balanced Approach  
- OAuth2 integration with major providers
- JWT token-based sessions
- Moderate complexity, good security

### Bold Approach
- Multi-factor authentication
- Advanced session management with refresh tokens
- High complexity, enterprise-grade security

## Impact vs Effort Matrix

| Option | Impact | Effort | Recommendation |
|--------|--------|--------|----------------|
| Conservative | Low | Low | Quick wins |
| Balanced | High | Medium | Recommended |
| Bold | Very High | High | Future consideration |

## Architecture

The system uses a modular authentication service with pluggable providers.
`;

      const result = generator.generateFromDesign(mockDesign, mockContext);

      expect(result).toBeDefined();
      expect(result.filename).toBe('user-authentication-design.md');
      expect(result.frontMatter.documentType).toBe(DocumentType.DESIGN);
      expect(result.content).toContain('Design Guidance: user-authentication');
      expect(result.content).toContain('Conservative Approach');
      expect(result.content).toContain('Impact vs Effort Matrix');
      expect(result.content).toContain('modular authentication service');
    });

    it('should handle design without structured options', () => {
      const mockDesign = 'Basic design description without structured options.';
      
      const result = generator.generateFromDesign(mockDesign, mockContext);

      expect(result.content).toContain('Design options not explicitly structured');
      expect(result.content).toContain('Impact vs Effort analysis not found');
    });
  });

  describe('generateFromOnePager', () => {
    it('should generate steering file from management one-pager', () => {
      const onePagerContext = {
        ...mockContext,
        inclusionRule: undefined as any // Use template default
      };
      const mockOnePager = `# Executive Summary

User Authentication Feature will reduce security incidents by 40% and improve user experience.

## ROI Analysis

### Investment
- Development: 3 weeks
- Testing: 1 week  
- Total Cost: $50,000

### Returns
- Reduced security incidents: $200,000/year
- Improved user retention: $100,000/year
- ROI: 500% in first year

## Recommendation

Proceed with Balanced approach for optimal impact vs effort ratio.

## Pyramid Principle Structure

1. **Situation**: Current authentication is insecure
2. **Complication**: Security incidents increasing
3. **Question**: How to improve security efficiently?
4. **Answer**: Implement OAuth2 authentication
`;

      const result = generator.generateFromOnePager(mockOnePager, onePagerContext);

      expect(result).toBeDefined();
      expect(result.filename).toBe('user-authentication-onepager.md');
      expect(result.frontMatter.documentType).toBe(DocumentType.ONEPAGER);
      expect(result.frontMatter.inclusion).toBe('manual');
      expect(result.content).toContain('Executive Guidance: user-authentication');
      expect(result.content).toContain('reduce security incidents by 40%');
      expect(result.content).toContain('ROI: 500%');
      expect(result.content).toContain('Pyramid Principle Structure');
    });
  });

  describe('generateFromPRFAQ', () => {
    it('should generate steering file from PR-FAQ document', () => {
      const prfaqContext = {
        ...mockContext,
        inclusionRule: undefined as any // Use template default
      };
      const mockPRFAQ = `# Press Release

## FOR IMMEDIATE RELEASE

New User Authentication System Launches with Enhanced Security

Our new authentication system provides seamless, secure access with OAuth2 integration.

## FAQ

### Q: What authentication methods are supported?
A: Username/password, OAuth2 with Google, GitHub, and Microsoft.

### Q: Is this secure?
A: Yes, we use industry-standard OAuth2 and JWT tokens.

### Q: Will existing users need to re-register?
A: No, existing accounts will be migrated automatically.
`;

      const result = generator.generateFromPRFAQ(mockPRFAQ, prfaqContext);

      expect(result).toBeDefined();
      expect(result.filename).toBe('user-authentication-prfaq.md');
      expect(result.frontMatter.documentType).toBe(DocumentType.PRFAQ);
      expect(result.frontMatter.inclusion).toBe('manual');
      expect(result.content).toContain('Product Clarity Guidance: user-authentication');
      expect(result.content).toContain('Press release section not found');
      expect(result.content).toContain('FAQ section not found');
      expect(result.content).toContain('Customer-focused communication approach');
    });
  });

  describe('generateFromTaskPlan', () => {
    it('should generate steering file from task plan document', () => {
      const taskContext = {
        ...mockContext,
        inclusionRule: undefined as any, // Use template default
        fileMatchPattern: undefined // Use template default
      };
      const mockTaskPlan = `# Implementation Plan

## Approach

Test-driven development with incremental implementation and continuous validation.

## Tasks

- [ ] 1. Set up authentication service structure
  - Create interfaces and base classes
  - Write unit tests for core functionality
  - _Requirements: 1.1, 1.2_

- [ ] 2. Implement OAuth2 provider integration
  - Add Google OAuth2 support
  - Write integration tests
  - _Requirements: 2.1, 2.2_

- [ ] 3. Create session management
  - Implement JWT token handling
  - Add session validation middleware
  - _Requirements: 1.3, 2.3_

## Validation Strategy

Each task includes verification steps and automated testing.
`;

      const result = generator.generateFromTaskPlan(mockTaskPlan, taskContext);

      expect(result).toBeDefined();
      expect(result.filename).toBe('user-authentication-tasks.md');
      expect(result.frontMatter.documentType).toBe(DocumentType.TASKS);
      expect(result.frontMatter.fileMatchPattern).toBe('tasks*|todo*|*tasks*|implementation*');
      expect(result.content).toContain('Implementation Guidance: user-authentication');
      expect(result.content).toContain('Test-driven development');
      expect(result.content).toContain('- [ ] 1. Set up authentication service');
      expect(result.content).toContain('Test-driven development approach recommended');
      expect(result.content).toContain('Incremental implementation strategy');
    });
  });

  describe('filename generation', () => {
    it('should generate proper filenames for different document types', () => {
      const contexts = [
        { ...mockContext, featureName: 'User Authentication' },
        { ...mockContext, featureName: 'user_auth_system' },
        { ...mockContext, featureName: 'user-auth-2.0' }
      ];

      contexts.forEach(context => {
        const reqResult = generator.generateFromRequirements('test', context);
        const designResult = generator.generateFromDesign('test', context);
        
        expect(reqResult.filename).toMatch(/^[a-z0-9-]+-requirements\.md$/);
        expect(designResult.filename).toMatch(/^[a-z0-9-]+-design\.md$/);
      });
    });
  });

  describe('front-matter generation', () => {
    it('should use context inclusion rule when provided', () => {
      const customContext = {
        ...mockContext,
        inclusionRule: 'always' as InclusionRule,
        fileMatchPattern: undefined
      };

      const result = generator.generateFromRequirements('test', customContext);

      expect(result.frontMatter.inclusion).toBe('always');
      expect(result.frontMatter.fileMatchPattern).toBeUndefined();
    });

    it('should use default inclusion rules when not specified', () => {
      const minimalContext = {
        featureName: 'test-feature',
        relatedFiles: [],
        inclusionRule: undefined as any,
        fileMatchPattern: undefined
      };

      const reqResult = generator.generateFromRequirements('test', minimalContext);
      const onePagerResult = generator.generateFromOnePager('test', minimalContext);

      expect(reqResult.frontMatter.inclusion).toBe('fileMatch');
      expect(onePagerResult.frontMatter.inclusion).toBe('manual');
    });

    it('should include all required front-matter fields', () => {
      const result = generator.generateFromRequirements('test', mockContext);

      expect(result.frontMatter.inclusion).toBeDefined();
      expect(result.frontMatter.generatedBy).toBe('vibe-pm-agent');
      expect(result.frontMatter.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.frontMatter.featureName).toBe('user-authentication');
      expect(result.frontMatter.documentType).toBe(DocumentType.REQUIREMENTS);
      expect(result.frontMatter.description).toBe('Test steering file generation');
    });
  });

  describe('reference generation', () => {
    it('should generate proper file references', () => {
      const result = generator.generateFromRequirements('test', mockContext);

      expect(result.references).toHaveLength(3);
      expect(result.references).toContain('#[[file:.kiro/specs/user-authentication/requirements.md]]');
      expect(result.references).toContain('#[[file:.kiro/specs/user-authentication/design.md]]');
      expect(result.references).toContain('#[[file:.kiro/specs/user-authentication/tasks.md]]');
    });

    it('should handle empty related files', () => {
      const contextWithoutFiles = {
        ...mockContext,
        relatedFiles: []
      };

      const result = generator.generateFromRequirements('test', contextWithoutFiles);

      expect(result.references).toHaveLength(0);
      expect(result.content).toContain('*No related documents found.*');
    });
  });

  describe('content extraction edge cases', () => {
    it('should handle malformed documents gracefully', () => {
      const malformedDoc = `
Random text without structure
Some more text
# Incomplete section
`;

      const result = generator.generateFromRequirements(malformedDoc, mockContext);

      expect(result).toBeDefined();
      expect(result.content).toContain('Business context not explicitly defined');
      expect(result.content).toContain('Requirements structure not found');
    });

    it('should extract insights from various document patterns', () => {
      const docWithPatterns = `
This document uses MoSCoW prioritization.
We follow EARS format for acceptance criteria.
User Story: As a user, I want to login.
Acceptance Criteria: System shall validate.
`;

      const result = generator.generateFromRequirements(docWithPatterns, mockContext);

      expect(result.content).toContain('MoSCoW prioritization methodology');
      expect(result.content).toContain('EARS (Easy Approach to Requirements Syntax)');
      expect(result.content).toContain('user stories for stakeholder clarity');
      expect(result.content).toContain('detailed acceptance criteria');
    });
  });

  describe('template processing', () => {
    it('should replace all placeholders in templates', () => {
      const result = generator.generateFromRequirements('test content', mockContext);

      expect(result.content).not.toContain('{feature_name}');
      expect(result.content).not.toContain('{timestamp}');
      expect(result.content).not.toContain('{business_context}');
      expect(result.content).toContain('user-authentication');
    });

    it('should handle special characters in feature names', () => {
      const specialContext = {
        ...mockContext,
        featureName: 'Feature with Spaces & Special-Chars!'
      };

      const result = generator.generateFromRequirements('test', specialContext);

      expect(result.filename).toBe('feature-with-spaces---special-chars--requirements.md');
      expect(result.content).toContain('Feature with Spaces & Special-Chars!');
    });
  });
});