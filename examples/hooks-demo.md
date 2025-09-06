# Policy Hooks Demo

This document demonstrates the Kiro policy hooks in action.

## Pre-Codegen Gate Hook Demo

### Example 1: Failing Validation (Missing Files)

```bash
# Create incomplete spec directory
mkdir -p /tmp/incomplete-spec
echo "# Incomplete Requirements" > /tmp/incomplete-spec/requirements.md

# Run pre-codegen gate
node .kiro/hooks/dist/pre_codegen_gate.js /tmp/incomplete-spec
```

**Expected Output:**
```
🔍 Running pre-codegen validation for spec: /tmp/incomplete-spec
❌ Spec validation failed with errors:
  - design.md: Required spec file missing: design.md
  - tasks.md: Required spec file missing: tasks.md

Error: Pre-codegen gate failed: 2 validation errors found.
Required spec sections must be complete before code generation can begin.
```

### Example 2: Passing Validation (Complete Spec)

```bash
# Test with the vibe-pm-agent spec (complete)
node .kiro/hooks/dist/pre_codegen_gate.js .kiro/specs/vibe-pm-agent
```

**Expected Output:**
```
🔍 Running pre-codegen validation for spec: .kiro/specs/vibe-pm-agent
⚠️  Spec validation warnings:
  - requirements.md: Missing provenance header in requirements.md
✅ Pre-codegen validation passed
```

## Post-Spec Validation Hook Demo

### Example 1: Failing Validation (Orphaned Acceptance Criteria)

```bash
# Create spec with orphaned acceptance criteria
mkdir -p /tmp/orphaned-spec
cat > /tmp/orphaned-spec/vibe_pm_agent.yaml << 'EOF'
id: test_spec
acceptance_criteria:
  - id: "AC001"
    description: "Orphaned acceptance criterion"
  - id: "AC002"
    description: "Another orphaned criterion"
EOF

echo "# Tasks without AC references" > /tmp/orphaned-spec/tasks.md

# Run post-spec validation
node .kiro/hooks/dist/post_spec_validate.js /tmp/orphaned-spec
```

**Expected Output:**
```
🔍 Running post-spec validation for: /tmp/orphaned-spec
📊 Acceptance Criteria Coverage: 0/2 (0.0%)
❌ Post-spec validation failed with errors:
  - AC001: Acceptance criterion AC001 is not referenced by any task
  - AC002: Acceptance criterion AC002 is not referenced by any task

Error: Post-spec validation failed: 2 validation errors found.
All acceptance criteria must be mapped to tasks with proper traceability.
```

### Example 2: Passing Validation (Proper Mapping)

```bash
# Test with the vibe-pm-agent spec (proper mapping)
node .kiro/hooks/dist/post_spec_validate.js .kiro/specs/vibe-pm-agent
```

**Expected Output:**
```
🔍 Running post-spec validation for: .kiro/specs/vibe-pm-agent
📊 Acceptance Criteria Coverage: 8/8 (100.0%)
⚠️  Spec validation warnings:
  - AC001: Acceptance criterion AC001 lacks explicit test mapping
  - AC002: Acceptance criterion AC002 lacks explicit test mapping
  [... more warnings for test mapping ...]
✅ Post-spec validation passed
```

## Integration with Kiro

The hooks are automatically triggered by Kiro during:

1. **Pre-codegen gate**: Before any code generation begins
2. **Post-spec validation**: After spec completion and before task execution

### Manual Testing

You can also run the hooks manually for testing:

```bash
# Compile the hooks
npx tsc .kiro/hooks/pre_codegen_gate.ts --outDir .kiro/hooks/dist --target es2020 --module commonjs --esModuleInterop
npx tsc .kiro/hooks/post_spec_validate.ts --outDir .kiro/hooks/dist --target es2020 --module commonjs --esModuleInterop

# Test pre-codegen gate
node .kiro/hooks/dist/pre_codegen_gate.js .kiro/specs/vibe-pm-agent

# Test post-spec validation
node .kiro/hooks/dist/post_spec_validate.js .kiro/specs/vibe-pm-agent

# Run unit tests
npm test -- --testPathPattern=hooks-validation.test.ts
```

## Quality Metrics

The hooks enforce these quality standards:

- **100% File Coverage**: All required spec files must exist (requirements.md, design.md, tasks.md)
- **Content Validation**: Files must contain expected structure and patterns
- **Traceability**: All acceptance criteria must be referenced by tasks
- **Provenance**: All files should include generation metadata
- **Guardrails**: Task plans must include Guardrails Check as Task 0

## Error Recovery

When validation fails, the hooks provide:

- **Clear Error Messages**: Specific guidance on what's missing or incorrect
- **Actionable Feedback**: Concrete steps to fix validation issues
- **Coverage Metrics**: Percentage of acceptance criteria properly mapped
- **Severity Levels**: Errors (blocking) vs warnings (informational)