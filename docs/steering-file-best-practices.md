# Steering File Best Practices Guide

## Overview

This guide provides proven strategies for organizing, maintaining, and maximizing the effectiveness of steering files generated from PM Agent outputs.

## Organization Strategies

### Directory Structure Patterns

#### Pattern 1: Feature-Based Organization
```
.kiro/steering/
├── core/                           # Always-included guidance
│   ├── coding-standards.md
│   ├── architecture-principles.md
│   └── security-guidelines.md
├── features/                       # Feature-specific guidance
│   ├── authentication/
│   │   ├── auth-requirements.md
│   │   ├── auth-design.md
│   │   └── auth-implementation.md
│   ├── user-dashboard/
│   │   ├── dashboard-requirements.md
│   │   └── dashboard-design.md
│   └── payment-processing/
│       ├── payment-requirements.md
│       ├── payment-design.md
│       └── payment-security.md
└── reference/                      # Manual reference materials
    ├── stakeholder-communications.md
    ├── executive-summaries.md
    └── product-roadmap.md
```

**When to Use:**
- Large projects with distinct feature areas
- Teams organized by feature ownership
- Need for feature-specific guidance isolation

**Benefits:**
- Clear feature boundaries
- Easy to find related guidance
- Supports feature team autonomy

#### Pattern 2: Document Type Organization
```
.kiro/steering/
├── requirements/
│   ├── auth-requirements.md
│   ├── dashboard-requirements.md
│   └── payment-requirements.md
├── design/
│   ├── auth-architecture.md
│   ├── dashboard-design.md
│   └── payment-design.md
├── implementation/
│   ├── auth-implementation.md
│   ├── dashboard-tasks.md
│   └── payment-tasks.md
└── executive/
    ├── auth-onepager.md
    ├── dashboard-prfaq.md
    └── payment-business-case.md
```

**When to Use:**
- Teams with role-based responsibilities (architects, PMs, developers)
- Need to find all documents of a specific type quickly
- Workflow-based development processes

**Benefits:**
- Role-based access to relevant guidance
- Consistent document type handling
- Easy to audit completeness across features

#### Pattern 3: Hybrid Organization
```
.kiro/steering/
├── always/                         # Core guidance (inclusion: always)
│   ├── coding-standards.md
│   └── architecture-principles.md
├── projects/                       # Project-specific (inclusion: fileMatch)
│   ├── user-management/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── implementation.md
│   └── analytics-platform/
│       ├── requirements.md
│       └── design.md
└── reference/                      # Manual reference (inclusion: manual)
    ├── executive-summaries/
    ├── stakeholder-communications/
    └── compliance-documentation/
```

**When to Use:**
- Mixed project sizes and types
- Need for both always-active and contextual guidance
- Balance between organization and simplicity

**Benefits:**
- Flexible inclusion rule management
- Clear separation of guidance types
- Scalable as projects grow

### Naming Conventions

#### Descriptive Naming Pattern
```
{feature}-{document-type}-{version}.md

Examples:
- user-auth-requirements-v1.md
- payment-flow-design-balanced.md
- dashboard-implementation-guide.md
- mobile-app-executive-summary.md
```

#### Semantic Naming Pattern
```
{verb}-{noun}-{context}.md

Examples:
- implement-authentication-oauth.md
- design-dashboard-responsive.md
- analyze-payment-security.md
- communicate-roadmap-stakeholders.md
```

#### Hierarchical Naming Pattern
```
{level}-{area}-{type}.md

Examples:
- 01-core-architecture.md
- 02-auth-requirements.md
- 03-auth-design.md
- 04-auth-implementation.md
```

### File Match Pattern Strategies

#### Broad Patterns (High Activation)
```yaml
# Activates for many files
fileMatchPattern: 'src/*|tests/*|docs/*'
```
**Use for:** Core principles, coding standards, architecture guidelines

#### Specific Patterns (Targeted Activation)
```yaml
# Activates for specific feature areas
fileMatchPattern: 'src/auth/*|tests/auth/*|docs/auth/*'
```
**Use for:** Feature-specific requirements, design decisions, implementation guidance

#### File Type Patterns (Role-Based Activation)
```yaml
# Activates for specific file types
fileMatchPattern: '*.test.ts|*.spec.ts|test/*'
```
**Use for:** Testing guidelines, quality standards, debugging practices

#### Multi-Pattern Combinations
```yaml
# Activates for multiple related contexts
fileMatchPattern: 'auth*|user*|login*|security*'
```
**Use for:** Cross-cutting concerns, related feature areas

## Inclusion Rule Best Practices

### Always Inclusion (`inclusion: always`)

**Use For:**
- Coding standards and style guides
- Architecture principles
- Security guidelines
- Team communication protocols

**Example:**
```markdown
---
inclusion: always
generatedBy: pm-agent-intent-optimizer
generatedAt: 2024-03-15T10:00:00Z
documentType: standards
---

# Core Development Standards

These standards apply to all development work and should be followed consistently across the codebase.
```

**Benefits:**
- Ensures consistent application of core principles
- Reduces need to remember to include guidance
- Creates shared understanding across team

**Risks:**
- Can create noise if overused
- May slow down AI responses with too much context
- Harder to customize for specific situations

### File Match Inclusion (`inclusion: fileMatch`)

**Use For:**
- Feature-specific requirements and design
- Domain-specific implementation guidance
- Context-sensitive best practices
- Technology-specific guidelines

**Example:**
```markdown
---
inclusion: fileMatch
fileMatchPattern: 'src/api/*|tests/api/*|docs/api/*'
generatedBy: pm-agent-intent-optimizer
generatedAt: 2024-03-15T10:00:00Z
documentType: implementation
---

# API Development Guidance

This guidance applies when working on API-related code and documentation.
```

**Benefits:**
- Provides relevant guidance when needed
- Reduces cognitive load by filtering context
- Allows for specialized guidance per domain

**Best Practices:**
- Use specific patterns to avoid over-activation
- Test patterns with your actual file structure
- Document pattern logic for team understanding

### Manual Inclusion (`inclusion: manual`)

**Use For:**
- Executive summaries and business context
- One-time reference materials
- Sensitive or confidential guidance
- Experimental or draft guidance

**Example:**
```markdown
---
inclusion: manual
generatedBy: pm-agent-intent-optimizer
generatedAt: 2024-03-15T10:00:00Z
documentType: executive
---

# Executive Summary: Q2 Platform Strategy

This summary is for stakeholder communication and should be referenced manually when needed.
```

**Benefits:**
- Explicit control over when guidance is included
- Prevents accidental exposure of sensitive information
- Allows for experimental guidance without affecting normal workflow

**Usage Tips:**
- Reference with `#steering-filename` in chat
- Use for high-level strategic guidance
- Good for templates and examples

## Cross-Reference Management

### Reference Patterns

#### Bidirectional References
```markdown
# In requirements.md
## Related Documents
#[[file:.kiro/specs/user-auth/design.md]]
#[[file:.kiro/specs/user-auth/tasks.md]]

# In design.md  
## Related Documents
#[[file:.kiro/specs/user-auth/requirements.md]]
#[[file:.kiro/specs/user-auth/tasks.md]]
```

#### Hierarchical References
```markdown
# Parent document references children
## Implementation Details
#[[file:.kiro/specs/user-auth/oauth-integration.md]]
#[[file:.kiro/specs/user-auth/rbac-system.md]]

# Child documents reference parent
## Parent Context
#[[file:.kiro/specs/user-auth/requirements.md]]
```

#### External References
```markdown
## External Documentation
#[[file:docs/api/authentication.md]]
#[[file:src/auth/README.md]]
#[[file:tests/auth/integration.test.ts]]
```

### Reference Maintenance

#### Automated Validation
```typescript
// Example validation script
async function validateReferences(steeringFile: string) {
  const references = extractFileReferences(steeringFile);
  const brokenRefs = [];
  
  for (const ref of references) {
    if (!await fileExists(ref.path)) {
      brokenRefs.push(ref);
    }
  }
  
  return brokenRefs;
}
```

#### Reference Update Strategies
1. **Manual Updates**: Update references when files are moved
2. **Automated Scanning**: Regular scripts to check reference validity
3. **IDE Integration**: Use IDE refactoring tools when available
4. **Version Control Hooks**: Validate references on commit

## Content Quality Guidelines

### Writing Effective Steering Content

#### Structure Template
```markdown
---
# Front-matter with proper inclusion rules
---

# Clear, Descriptive Title

## Context Section
Brief explanation of when and why this guidance applies.

## Core Guidance
The main recommendations, best practices, or requirements.

## Examples
Concrete examples showing how to apply the guidance.

## Anti-Patterns
What NOT to do, with explanations of why.

## Related Documents
Cross-references to related steering files and documentation.

## Validation Criteria
How to verify the guidance is being followed correctly.
```

#### Content Principles

**Be Specific and Actionable**
```markdown
# Good
WHEN implementing OAuth flows THEN use PKCE for public clients and validate state parameters to prevent CSRF attacks.

# Bad  
Use secure OAuth practices.
```

**Include Context and Rationale**
```markdown
# Good
Cache user roles for 15 minutes to balance performance and security. Longer caching risks stale permissions, shorter caching creates database load.

# Bad
Cache user roles.
```

**Provide Examples and Anti-Patterns**
```markdown
# Good
## Example: Secure Token Storage
```typescript
// DO: Use httpOnly cookies
res.cookie('auth_token', token, { 
  httpOnly: true, 
  secure: true, 
  sameSite: 'strict' 
});

// DON'T: Store in localStorage (XSS risk)
localStorage.setItem('auth_token', token);
```

### Content Maintenance

#### Regular Review Schedule
- **Monthly**: Review always-included steering files for relevance
- **Quarterly**: Audit file match patterns for accuracy
- **Per Release**: Update implementation guidance based on lessons learned
- **Annually**: Comprehensive review of all steering files

#### Quality Metrics
- **Activation Rate**: How often steering files are included in context
- **Reference Accuracy**: Percentage of working cross-references
- **Content Freshness**: Time since last update
- **User Feedback**: Developer satisfaction with guidance quality

#### Update Triggers
- Requirements changes
- Architecture decisions
- Lessons learned from implementation
- New team members joining
- Technology stack changes

## Team Collaboration Strategies

### Shared Ownership Model

#### Roles and Responsibilities
- **Product Managers**: Maintain requirements and business context steering files
- **Architects**: Maintain design and architecture steering files  
- **Tech Leads**: Maintain implementation and best practices steering files
- **All Developers**: Contribute updates based on implementation experience

#### Review Process
1. **Draft**: Create steering file from PM Agent output
2. **Review**: Team reviews content for accuracy and completeness
3. **Approve**: Designated owner approves final content
4. **Monitor**: Track usage and effectiveness
5. **Update**: Regular updates based on feedback and changes

### Version Control Integration

#### Commit Message Conventions
```bash
# Adding new steering file
git commit -m "steering: add auth requirements guidance"

# Updating existing steering file
git commit -m "steering: update auth design with caching strategy"

# Fixing broken references
git commit -m "steering: fix broken references in payment docs"
```

#### Branch Strategy
- Include steering file updates in feature branches
- Review steering changes alongside code changes
- Merge steering updates with related feature work

#### Documentation in Pull Requests
```markdown
## Steering File Changes
- Added `auth-requirements.md` with OAuth guidance
- Updated `core-architecture.md` with new security patterns
- Fixed broken references in `payment-design.md`

## Impact Assessment
- New guidance will activate for all auth-related files
- Existing guidance updated to reflect new architecture decisions
- No breaking changes to existing steering file structure
```

## Performance Optimization

### Steering File Size Management

#### Content Size Guidelines
- **Always-included files**: Keep under 2KB for fast loading
- **FileMatch files**: Can be larger (5-10KB) since they're contextual
- **Manual files**: Size less critical, focus on completeness

#### Content Optimization Techniques
```markdown
# Use concise, scannable format
## Quick Reference
- OAuth: Use PKCE for public clients
- Sessions: 15-minute timeout for security
- Caching: Cache roles, not permissions

## Detailed Guidance
[Expandable sections with full details]
```

### Inclusion Pattern Optimization

#### Pattern Specificity Balance
```yaml
# Too broad (performance impact)
fileMatchPattern: '*'

# Too narrow (misses relevant files)  
fileMatchPattern: 'src/auth/oauth.ts'

# Just right (relevant without noise)
fileMatchPattern: 'src/auth/*|tests/auth/*'
```

#### Performance Monitoring
- Track steering file activation frequency
- Monitor AI response time impact
- Measure context size and relevance

## Troubleshooting Common Issues

### Steering Files Not Activating

#### Diagnostic Steps
1. **Check Inclusion Rule**: Verify `inclusion` field is correct
2. **Test File Pattern**: Ensure `fileMatchPattern` matches your files
3. **Validate Syntax**: Check front-matter YAML syntax
4. **Verify Location**: Confirm file is in `.kiro/steering/` directory

#### Common Fixes
```yaml
# Fix: Incorrect inclusion rule
inclusion: fileMatch  # not 'file-match'

# Fix: Overly specific pattern
fileMatchPattern: 'auth*'  # not 'src/auth/oauth.ts'

# Fix: Missing pattern for fileMatch
inclusion: fileMatch
fileMatchPattern: 'src/*'  # required for fileMatch
```

### Broken Cross-References

#### Detection Methods
```bash
# Find broken references
grep -r "#\[\[file:" .kiro/steering/ | while read line; do
  file=$(echo "$line" | sed 's/.*#\[\[file:\([^]]*\)\]\].*/\1/')
  if [ ! -f "$file" ]; then
    echo "Broken reference: $line"
  fi
done
```

#### Resolution Strategies
1. **Update Path**: Fix the reference path
2. **Create Missing File**: Add the referenced file
3. **Remove Reference**: Delete if no longer relevant
4. **Replace with Alternative**: Link to equivalent document

### Content Quality Issues

#### Common Problems and Solutions

**Problem**: Steering file too generic
```markdown
# Bad
Use good security practices.

# Good  
WHEN handling OAuth tokens THEN store in httpOnly cookies with secure and sameSite flags to prevent XSS and CSRF attacks.
```

**Problem**: Outdated guidance
```markdown
# Bad (outdated)
Use OAuth 1.0 for authentication.

# Good (current)
Use OAuth 2.0 with PKCE extension for secure authentication flows.
```

**Problem**: Conflicting guidance
```markdown
# Resolve by consolidating or clarifying scope
# File 1: For public APIs
Use API keys for authentication.

# File 2: For user authentication  
Use OAuth 2.0 for user authentication.
```

## Advanced Techniques

### Dynamic Content Generation

#### Template-Based Steering Files
```markdown
---
inclusion: fileMatch
fileMatchPattern: '{{FEATURE_NAME}}*'
generatedBy: pm-agent-intent-optimizer
generatedAt: {{TIMESTAMP}}
featureName: {{FEATURE_NAME}}
---

# {{FEATURE_NAME}} Implementation Guidance

This guidance applies to the {{FEATURE_NAME}} feature implementation.

## Requirements Reference
#[[file:.kiro/specs/{{FEATURE_NAME}}/requirements.md]]
```

#### Conditional Content
```markdown
## Database Guidance
{{#if USE_POSTGRES}}
Use PostgreSQL with proper indexing for user lookups.
{{else}}
Use MongoDB with compound indexes for user queries.
{{/if}}
```

### Analytics and Optimization

#### Usage Tracking
```typescript
interface SteeringFileAnalytics {
  filename: string;
  activationCount: number;
  lastActivated: Date;
  averageContextSize: number;
  userSatisfactionScore: number;
}
```

#### Optimization Strategies
- Remove rarely activated steering files
- Consolidate overlapping guidance
- Split overly broad steering files
- Update patterns based on usage data

### Integration with Development Workflow

#### CI/CD Integration
```yaml
# .github/workflows/steering-validation.yml
name: Validate Steering Files
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Steering Files
        run: |
          npm run validate-steering-files
          npm run check-steering-references
```

#### IDE Integration
- Syntax highlighting for steering file front-matter
- Auto-completion for file reference patterns
- Validation warnings for broken references
- Quick actions to create referenced files

## Conclusion

Effective steering file management requires balancing comprehensiveness with performance, specificity with maintainability, and automation with human oversight. By following these best practices, teams can create a self-improving development environment where PM Agent expertise becomes persistent, contextual guidance that evolves with the project.

### Key Takeaways

1. **Choose the Right Organization Pattern** for your team size and project structure
2. **Use Specific File Match Patterns** to provide relevant guidance without noise
3. **Maintain Cross-References Actively** to keep guidance interconnected and current
4. **Review and Update Regularly** to ensure guidance remains accurate and valuable
5. **Monitor Performance Impact** to balance comprehensiveness with responsiveness
6. **Collaborate on Content Quality** to leverage team expertise and experience

### Next Steps

1. **Assess Current State**: Audit existing steering files for organization and quality
2. **Choose Patterns**: Select organization and naming patterns that fit your workflow
3. **Implement Gradually**: Start with core guidance and expand based on needs
4. **Monitor and Iterate**: Track usage and effectiveness, adjusting based on feedback
5. **Train Team**: Ensure all team members understand steering file best practices