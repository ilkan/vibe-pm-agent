# PM Agent Steering File Integration Documentation

## Overview

This documentation covers the steering file integration feature of the PM Agent Intent-to-Spec Optimizer. This feature automatically converts PM agent consulting documents into Kiro steering files, creating a self-improving development environment where PM expertise becomes persistent guidance.

## Documentation Structure

### 📚 Core Documentation

#### [Steering File Integration Guide](steering-file-integration-guide.md)
**Start here** - Comprehensive guide covering:
- What steering files are and how they work
- Complete workflow from PM document to steering file
- Document types and their steering patterns
- Using MCP tools with steering integration
- Configuration and customization options
- Troubleshooting common issues

#### [Steering File Examples](steering-file-examples.md)
**Concrete examples** of generated steering files:
- Requirements steering file from PM requirements document
- Design options steering file with Impact vs Effort analysis
- Management one-pager steering file for executives
- PR-FAQ steering file for product clarity
- Task plan steering file for implementation guidance
- Usage patterns and customization tips

#### [Best Practices Guide](steering-file-best-practices.md)
**Proven strategies** for effective steering file management:
- Organization patterns (feature-based, type-based, hybrid)
- Naming conventions and file match patterns
- Inclusion rule strategies (always, fileMatch, manual)
- Cross-reference management and maintenance
- Content quality guidelines and team collaboration
- Performance optimization and troubleshooting

#### [MCP Tool Reference](mcp-steering-tool-reference.md)
**Complete API reference** for steering integration:
- Common steering parameters across all tools
- Tool-specific documentation and examples
- Batch steering file creation patterns
- Error handling and recovery strategies
- Configuration examples for different teams/projects
- CI/CD and IDE integration patterns

### 🚀 Quick Start

1. **Read the [Integration Guide](steering-file-integration-guide.md)** to understand the concepts
2. **Try the examples** from the [Examples Documentation](steering-file-examples.md)
3. **Follow best practices** from the [Best Practices Guide](steering-file-best-practices.md)
4. **Reference the API** in the [MCP Tool Reference](mcp-steering-tool-reference.md)

### 📖 Documentation by Use Case

#### For Product Managers
- [Integration Guide: Document Types](steering-file-integration-guide.md#document-types-and-steering-patterns)
- [Examples: Requirements and One-Pagers](steering-file-examples.md#example-1-requirements-steering-file)
- [Best Practices: Content Quality](steering-file-best-practices.md#content-quality-guidelines)

#### For Developers
- [Integration Guide: Using MCP Tools](steering-file-integration-guide.md#using-mcp-tools-with-steering-integration)
- [Examples: Design and Implementation](steering-file-examples.md#example-2-design-options-steering-file)
- [MCP Reference: Tool Parameters](mcp-steering-tool-reference.md#tool-specific-documentation)

#### For Team Leads
- [Best Practices: Organization Strategies](steering-file-best-practices.md#organization-strategies)
- [Best Practices: Team Collaboration](steering-file-best-practices.md#team-collaboration-strategies)
- [Integration Guide: Configuration](steering-file-integration-guide.md#configuration-and-customization)

#### For Architects
- [Examples: Design Options](steering-file-examples.md#example-2-design-options-steering-file)
- [Best Practices: Cross-Reference Management](steering-file-best-practices.md#cross-reference-management)
- [MCP Reference: Advanced Usage](mcp-steering-tool-reference.md#advanced-usage)

## Key Features

### 🔄 Automatic Conversion
- Transform PM agent outputs into properly formatted steering files
- Smart front-matter generation with appropriate inclusion rules
- Automatic cross-reference creation between related documents

### 🎯 Contextual Activation
- **Always**: Core principles active in every interaction
- **FileMatch**: Feature-specific guidance activated by file patterns
- **Manual**: Executive summaries and reference materials on-demand

### 🏗️ Flexible Organization
- **Feature-based**: Organize by project features
- **Type-based**: Organize by document types
- **Hybrid**: Mix of always-active, contextual, and manual guidance

### 🔗 Smart Cross-References
- Automatic linking between requirements, design, and implementation
- References to related specs and documentation
- Bidirectional relationship management

## Common Workflows

### Basic Workflow: Single Document
```typescript
// Generate requirements with steering file
const result = await mcp_pm_agent_intent_optimizer_generate_requirements({
  raw_intent: "Create user authentication system",
  context: {
    createSteeringFile: true,
    featureName: "user-authentication"
  }
});
```

### Advanced Workflow: Complete Feature Suite
```typescript
// Generate complete workflow with steering files
const workflow = await createCompleteWorkflowWithSteering(
  "Create user authentication with OAuth and RBAC",
  "user-authentication"
);
// Creates: requirements, design, tasks, and onepager steering files
```

### Team Workflow: Collaborative Development
1. **PM**: Generate requirements and one-pager with steering files
2. **Architect**: Generate design options with steering files
3. **Tech Lead**: Generate task plan with steering files
4. **Developers**: Implementation guided by contextual steering files

## Integration Points

### 🛠️ MCP Tools
All PM Agent MCP tools support steering file creation:
- `generate_requirements` → Requirements steering files
- `generate_design_options` → Design guidance steering files
- `generate_management_onepager` → Executive steering files
- `generate_pr_faq` → Product clarity steering files
- `generate_task_plan` → Implementation steering files

### 🔧 Development Tools
- **Kiro IDE**: Native steering file support with contextual activation
- **VSCode**: Extension support for steering file management
- **CI/CD**: Automated steering file generation and validation
- **Git**: Version control integration with steering file workflows

### 📊 Analytics and Management
- Usage tracking for steering file effectiveness
- Broken reference detection and repair
- Content freshness monitoring
- Team collaboration metrics

## Benefits

### 🎯 For Development Teams
- **Persistent Expertise**: PM consulting insights become ongoing guidance
- **Contextual Help**: Relevant guidance appears when working on related files
- **Consistency**: Shared understanding across team members
- **Self-Improving**: Guidance evolves with project requirements

### 📈 For Organizations
- **Knowledge Retention**: Capture and preserve PM consulting expertise
- **Onboarding**: New team members get contextual guidance automatically
- **Quality**: Consistent application of best practices and standards
- **Efficiency**: Reduce repeated consulting and decision-making overhead

### 🔄 For Project Management
- **Traceability**: Clear links between requirements, design, and implementation
- **Visibility**: Executive summaries and business context readily available
- **Alignment**: Ensure implementation matches original intent and requirements
- **Evolution**: Update guidance as requirements and understanding evolve

## Getting Started

### Prerequisites
- PM Agent Intent-to-Spec Optimizer installed and configured
- Kiro workspace with `.kiro/steering/` directory
- Basic understanding of Kiro steering file concepts

### Quick Setup
1. **Enable steering integration** in your PM Agent configuration
2. **Choose organization strategy** (feature-based recommended for most teams)
3. **Generate your first steering file** using any PM Agent MCP tool
4. **Review and customize** the generated steering file
5. **Test activation** by working on related files

### Next Steps
1. **Read the [Integration Guide](steering-file-integration-guide.md)** for comprehensive understanding
2. **Try the examples** from the [Examples Documentation](steering-file-examples.md)
3. **Establish team practices** using the [Best Practices Guide](steering-file-best-practices.md)
4. **Integrate with your workflow** using the [MCP Tool Reference](mcp-steering-tool-reference.md)

## Support and Troubleshooting

### Common Issues
- **Steering files not activating**: Check inclusion rules and file patterns
- **Broken cross-references**: Validate file paths and update when files move
- **Performance impact**: Review always-included files and optimize patterns
- **Content quality**: Follow content guidelines and review regularly

### Getting Help
- Review the [troubleshooting sections](steering-file-integration-guide.md#troubleshooting) in each guide
- Check the [error handling documentation](mcp-steering-tool-reference.md#error-handling)
- Follow the [best practices](steering-file-best-practices.md) for common scenarios

### Contributing
- Report issues with steering file generation or activation
- Suggest improvements to documentation and examples
- Share successful patterns and configurations with the community
- Contribute to steering file templates and best practices

## Version History

### Current Version: 1.0.0
- Complete steering file integration with all PM Agent tools
- Comprehensive documentation and examples
- Best practices guide based on real-world usage
- Full MCP tool API reference with error handling

### Roadmap
- Enhanced analytics and usage tracking
- Advanced template system for custom steering files
- IDE integration improvements
- Team collaboration features

---

**Ready to get started?** Begin with the [Steering File Integration Guide](steering-file-integration-guide.md) to understand the concepts, then try the examples and follow the best practices for your team's workflow.