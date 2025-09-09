# Implementation Plan

Convert the Amazon Working Backwards design into a series of prompts for a code-generation LLM that will implement each step in a test-driven manner. Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

- [x] 1. Create Amazon mechanism services foundation
  - Implement core TypeScript interfaces for AssumptionLedger, ConfidenceScore, ScenarioResults, and HardQuestion
  - Create base service classes with method signatures and error handling
  - Write unit tests for interface validation and basic service instantiation
  - _Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.4_

- [x] 2. Implement Assumption Ledger Service
  - Code assumption extraction logic to parse business inputs into [A#] format with name, value, unit, sourceUrls, certainty, lastChecked
  - Implement source validation with URL checking and credibility rating assignment
  - Create coverage calculation algorithm to compute percentage of claims with documented sources
  - Write comprehensive unit tests for assumption normalization, source validation, and coverage calculation
  - _Requirements: 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Implement Confidence Scoring Service
  - Code confidence calculation algorithm with 0-100 scoring and breakdown for evidence, recency, diversity, agreement, coverage, sensitivity
  - Implement scoring weights: evidence (25%), recency (20%), diversity (15%), agreement (15%), coverage (15%), sensitivity (10%)
  - Create explanation generation for confidence scores with 1-line rationale
  - Add low confidence detection (<60) with human review recommendation banner logic
  - Write unit tests for scoring algorithm accuracy and explanation generation
  - _Requirements: 2.5, 2.6, 4.1, 4.2, 4.3, 9.2_

- [x] 4. Implement Scenario Analysis Service
  - Code bear/base/bull scenario generation by perturbing top numeric assumptions ±20%
  - Implement elasticity calculation showing how assumption changes impact outcomes (e.g., "CAC ±20% → ROI ±14pp")
  - Create sensitivity ranking to identify top 3-5 key drivers for tornado analysis
  - Add mathematical consistency validation across all scenario projections
  - Write unit tests for scenario generation, elasticity calculations, and consistency validation
  - _Requirements: 2.3, 4.1, 4.2, 4.3, 4.4, 4.5, 9.3_

- [x] 5. Implement Hard Questions Service
  - Code adversarial question generation targeting weakest assumptions with specific [A#] references
  - Implement question categorization (market, financial, competitive, execution, timing) and severity ranking
  - Create evidence recommendation engine suggesting specific data sources to address each question
  - Add question prioritization by potential impact on decision-making and stakeholder likelihood
  - Write unit tests for question generation quality, assumption targeting, and evidence recommendations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.4_

- [x] 6. Create Amazon template processors
  - Implement PR/FAQ Markdown template with press release, FAQ sections, and mechanism integration
  - Code Decision One-Pager template with context, options table, ROI range, and recommendation sections
  - Create template helper functions including {{json ...}} helper for YAML front-matter embedding
  - Add template validation to ensure all required sections and variables are present
  - Write unit tests with snapshot testing using fixed seed for deterministic output validation
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 7. Implement Kiro steering integration
  - Code steering file writer to save documents to .kiro/steering/working-backwards/<feature-slug>/ with deterministic front-matter
  - Implement attachment manager for assumptions-<hash>.json, citations-<hash>.json, scenarios-<hash>.json files
  - Create latest.json pointer management for Kiro fileMatch integration
  - Add inputs_hash generation using SHA-256 for change detection and file naming
  - Write integration tests for complete steering file generation and attachment management
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 8. Upgrade MCP tool handlers with mechanism integration
  - Modify generate_business_case handler to build assumption ledger, compute confidence, run scenarios, generate hard questions
  - Update create_stakeholder_communication handler to route PR/FAQ vs Decision One-Pager based on communication_type
  - Integrate mechanism services into existing handlers without breaking API compatibility
  - Add metadata.confidenceScore return and steering write-through functionality
  - Write integration tests for upgraded handlers with mechanism service integration
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 9. Wire mechanism services into template rendering pipeline
  - Connect assumption ledger service output to template context for [A#] references
  - Integrate confidence scoring into template front-matter and mechanism sections
  - Wire scenario analysis results into bear/base/bull tables and elasticity lists
  - Connect hard questions service to appendable questions sections in both templates
  - Add comprehensive error handling with graceful degradation when mechanisms fail
  - Write end-to-end integration tests for complete pipeline from input to rendered document
  - _Requirements: 7.4, 8.3, 8.4, 9.5, 9.6_

- [x] 10. Implement performance optimizations and caching
  - Add caching layer for source validation (24-hour cache), confidence calculations, and template compilation
  - Implement performance monitoring to ensure <500ms per mechanism service and <2min total generation
  - Create hash-based caching for duplicate input detection and result reuse
  - Add performance benchmarking tests to validate timing requirements
  - Write performance tests ensuring all timing targets are met consistently
  - _Requirements: 9.6, 10.4, 10.5_

- [x] 11. Create comprehensive test suite for Amazon working backwards
  - Write unit tests for all mechanism services with edge cases and error conditions
  - Implement integration tests for complete Amazon working backwards workflow
  - Create snapshot tests for both PR/FAQ and Decision One-Pager templates with fixed seed
  - Add performance tests validating <2min end-to-end generation requirement
  - Write error handling tests ensuring graceful degradation and meaningful error messages
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 12. Integrate Amazon working backwards as default mode
  - Update existing MCP handlers to use Amazon methodology by default
  - Add configuration options to toggle between standard and Amazon modes
  - Ensure backward compatibility with existing API contracts while adding new functionality
  - Create migration guide for users upgrading to Amazon working backwards mode
  - Write compatibility tests ensuring existing functionality remains intact
  - _Requirements: 8.5, 8.6_