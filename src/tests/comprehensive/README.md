# Amazon Working Backwards - Comprehensive Test Suite

This directory contains the comprehensive test suite for Amazon Working Backwards functionality, implementing **Task 11** from the Amazon Working Backwards specification.

## Test Suite Overview

The comprehensive test suite covers all requirements from Task 11:

### ✅ Unit Tests for All Mechanism Services with Edge Cases and Error Conditions

**Location**: `amazon-working-backwards-comprehensive.test.ts` (Unit Tests section)

- **AssumptionLedgerService Edge Cases**:
  - Malformed citations handling
  - Extremely large assumption sets (100+ assumptions)
  - Missing required fields
  - Circular citation references

- **ConfidenceService Edge Cases**:
  - No citations scenarios
  - Extreme confidence scenarios (50+ A-tier sources)
  - Invalid date formats in citations
  - Confidence calculation overflow scenarios

- **ScenarioService Edge Cases**:
  - Zero or negative base values
  - Extreme sensitivity values (90% perturbation)
  - Empty assumption ledger
  - Mathematical edge cases (NaN, Infinity)

- **HardQuestionsService Edge Cases**:
  - Empty assumption ledger
  - Extremely long business context (10,000+ characters)
  - Invalid assumption references
  - Edge case question generation

### ✅ Integration Tests for Complete Amazon Working Backwards Workflow

**Location**: `amazon-working-backwards-comprehensive.test.ts` (Integration Tests section)

- **End-to-End Workflow**: Complete pipeline from business inputs through all mechanism services to final template rendering
- **Partial Failure Handling**: Graceful degradation when some services succeed and others fail
- **Service Chaining**: Proper data flow between assumption ledger → confidence → scenarios → hard questions → templates
- **MCP Handler Integration**: Full integration with `generate_business_case` and `create_stakeholder_communication` handlers

### ✅ Snapshot Tests for Both PR/FAQ and Decision One-Pager Templates with Fixed Seed

**Location**: `amazon-template-snapshots.test.ts`

- **Fixed Seed Data**: Deterministic test data with fixed timestamp (2024-01-01T00:00:00.000Z)
- **PR/FAQ Template Snapshots**:
  - Standard rendering with full data
  - Low confidence warning scenarios
  - Empty assumptions handling
  - Maximum data scenarios
  - Special characters in content
- **Decision One-Pager Template Snapshots**:
  - Standard rendering
  - High confidence scenarios
  - Comprehensive ROI analysis
  - Minimal data scenarios
- **Front-matter Consistency**: Validates deterministic YAML front-matter generation
- **Edge Case Handling**: Long content, numeric edge cases, empty citations

### ✅ Performance Tests Validating <2min End-to-End Generation Requirement

**Location**: `amazon-comprehensive-performance.test.ts`

- **Individual Service Benchmarks**: Each service must complete within 500ms target
  - AssumptionLedgerService: <500ms (tested with 10 iterations)
  - ConfidenceService: <500ms (tested with 10 iterations)
  - ScenarioService: <500ms (tested with 5 iterations)
  - HardQuestionsService: <500ms (tested with 10 iterations)
  - Template Rendering: <500ms per template (tested with 10 iterations)

- **End-to-End Performance**: Complete workflow within 2 minutes (120,000ms)
  - Tested with 3 iterations for consistency
  - Average performance target: <1 minute
  - Maximum performance target: <2 minutes

- **Caching Performance**: Demonstrates performance improvements with warm cache
- **MCP Handler Performance**: Both handlers complete within 1 minute target
- **Stress Testing**: Large datasets (100 assumptions, 50 citations) within 10 seconds
- **Concurrent Load**: 5 concurrent requests within 2 seconds each

### ✅ Error Handling Tests Ensuring Graceful Degradation and Meaningful Error Messages

**Location**: `amazon-error-handling-comprehensive.test.ts`

- **Input Validation and Sanitization**:
  - Null/undefined inputs
  - Malicious input content (XSS, injection attempts)
  - Extremely large input values
  - Invalid data types

- **Service Failure Scenarios**:
  - Database connection failures
  - Mathematical calculation errors
  - Network timeouts
  - Invalid context handling

- **Template Rendering Error Handling**:
  - Corrupted data handling
  - Helper function errors
  - Template structure validation

- **Network and External Service Errors**:
  - Source validation timeouts
  - Invalid URL formats
  - Steering writer failures

- **Memory and Resource Management**:
  - Memory pressure handling
  - Resource cleanup after errors

- **Recovery and Fallback Mechanisms**:
  - Fallback content generation
  - Retry logic with exponential backoff
  - Diagnostic information for troubleshooting

## Test Execution

### Run All Amazon Tests
```bash
npm test -- --testPathPattern="amazon" --run
```

### Run Specific Test Categories
```bash
# Unit tests only
npm test -- --testPathPattern="amazon.*unit" --run

# Integration tests only
npm test -- --testPathPattern="amazon.*integration" --run

# Performance tests only
npm test -- --testPathPattern="amazon.*performance" --run

# Snapshot tests only
npm test -- --testPathPattern="amazon.*snapshot" --run

# Comprehensive test suite
npm test -- --testPathPattern="amazon.*comprehensive" --run
```

### Run Test Validation
```bash
npm test -- --testPathPattern="amazon-test-runner" --run
```

## Test Data and Fixtures

### Fixed Seed Data
All snapshot and deterministic tests use fixed seed data:
- **Timestamp**: 2024-01-01T00:00:00.000Z (1704067200000)
- **Feature**: AI-Powered Code Assistant
- **Customer**: Software Development Teams
- **Consistent Assumptions**: 3 assumptions with known IDs (A1, A2, A3)
- **Predictable Citations**: 3 citations with A/A/B ratings
- **Deterministic Scenarios**: Fixed bear/base/bull values

### Performance Test Data
Large-scale test data for performance validation:
- **20 assumptions** with detailed descriptions
- **15 citations** from various source types
- **Complex business context** for realistic testing
- **Multiple competitors** and market factors

## Coverage Requirements

The test suite ensures:

1. **100% Service Coverage**: All Amazon mechanism services tested
2. **Edge Case Coverage**: Comprehensive edge case and error condition testing
3. **Integration Coverage**: Complete workflow integration testing
4. **Performance Coverage**: All performance targets validated
5. **Error Handling Coverage**: Graceful degradation and meaningful errors
6. **Template Coverage**: Both PR/FAQ and Decision One-Pager templates
7. **Snapshot Coverage**: Deterministic template rendering validation

## Quality Assurance

### Validation Checklist
- ✅ All mechanism services have comprehensive unit tests
- ✅ Integration tests cover complete workflow
- ✅ Snapshot tests ensure template consistency
- ✅ Performance tests validate <2min requirement
- ✅ Error handling ensures graceful degradation
- ✅ Fixed seed data ensures deterministic testing
- ✅ Edge cases and error conditions covered
- ✅ MCP handler integration tested
- ✅ Caching and performance optimization validated
- ✅ Memory management and resource cleanup tested

### Test Metrics
- **Total Test Files**: 4 comprehensive test files
- **Test Categories**: Unit, Integration, Performance, Error Handling, Snapshots
- **Performance Targets**: All services <500ms, end-to-end <2min
- **Error Scenarios**: 20+ error conditions tested
- **Edge Cases**: 15+ edge cases covered
- **Snapshot Tests**: 10+ template variations

## Maintenance

### Adding New Tests
1. Follow existing patterns in comprehensive test files
2. Use fixed seed data for deterministic tests
3. Include performance validation for new services
4. Add error handling tests for new failure modes
5. Update snapshots when template changes occur

### Performance Monitoring
- Monitor test execution times
- Update performance targets as needed
- Add new performance tests for new features
- Validate caching effectiveness

### Error Handling Updates
- Add new error scenarios as they're discovered
- Ensure meaningful error messages
- Test graceful degradation paths
- Validate diagnostic information quality

This comprehensive test suite ensures the Amazon Working Backwards functionality is robust, performant, and reliable for production use.