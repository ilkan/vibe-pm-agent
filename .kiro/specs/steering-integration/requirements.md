# Requirements Document

## Introduction

The PM Agent Intent-to-Spec Optimizer generates high-quality consulting documents (requirements, design options, management one-pagers, PR-FAQs, task plans) that contain valuable guidance for development work. Currently, these documents are generated as outputs but not leveraged as Kiro steering files to guide future development. This feature will automatically save PM agent outputs as steering files, creating a self-improving system where the PM agent's consulting expertise becomes guidance for subsequent development work.

## Requirements

### Requirement 1

**User Story:** As a developer using the PM agent, I want the generated consulting documents to automatically become steering files, so that future development work benefits from the PM agent's consulting analysis and recommendations.

#### Acceptance Criteria

1. WHEN the PM agent generates a requirements document THEN the system SHALL save it as a steering file with appropriate front-matter configuration
2. WHEN the PM agent generates a design options document THEN the system SHALL save it as a steering file that activates when design-related files are in context
3. WHEN the PM agent generates a management one-pager THEN the system SHALL save it as a steering file for executive-level guidance
4. WHEN the PM agent generates a PR-FAQ document THEN the system SHALL save it as a steering file for product clarity guidance

### Requirement 2

**User Story:** As a developer, I want steering files to be automatically organized and named based on the project context, so that I can easily identify and manage PM agent guidance for different features.

#### Acceptance Criteria

1. WHEN steering files are created from PM agent outputs THEN the system SHALL use descriptive names based on the feature or project being analyzed
2. WHEN multiple PM documents exist for the same feature THEN the system SHALL organize them with consistent naming conventions
3. WHEN steering files are created THEN the system SHALL include appropriate front-matter to control when they are included in context
4. IF a steering file already exists for the same feature THEN the system SHALL either update it or create a versioned variant

### Requirement 3

**User Story:** As a developer, I want the steering files to include references to related documents and specs, so that the guidance is comprehensive and interconnected.

#### Acceptance Criteria

1. WHEN creating steering files from PM documents THEN the system SHALL include file references using the #[[file:path]] syntax for related specs
2. WHEN a requirements steering file is created THEN it SHALL reference the corresponding design and task files if they exist
3. WHEN a design options steering file is created THEN it SHALL reference the requirements and implementation files
4. WHEN steering files reference external documents THEN the references SHALL use relative paths from the workspace root

### Requirement 4

**User Story:** As a developer, I want to control which PM agent outputs become steering files, so that I can maintain a clean and relevant steering directory.

#### Acceptance Criteria

1. WHEN the PM agent generates documents THEN the system SHALL provide an option to automatically save as steering files
2. WHEN saving as steering files THEN the system SHALL allow the user to customize the steering file names and inclusion rules
3. WHEN steering files are created THEN the system SHALL provide a summary of what was saved and how it will be used
4. IF the user declines to save as steering files THEN the system SHALL still generate the documents normally

### Requirement 5

**User Story:** As a developer, I want steering files created from PM agent outputs to follow Kiro steering conventions, so that they integrate seamlessly with the existing steering system.

#### Acceptance Criteria

1. WHEN creating steering files THEN the system SHALL use proper front-matter with inclusion rules (always, fileMatch, or manual)
2. WHEN creating steering files THEN the system SHALL format content appropriately for steering guidance
3. WHEN creating steering files THEN the system SHALL include metadata about when and how the file was generated
4. WHEN steering files are created THEN they SHALL be saved in the .kiro/steering/ directory with .md extension