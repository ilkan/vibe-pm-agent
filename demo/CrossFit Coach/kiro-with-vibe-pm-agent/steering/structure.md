# Project Structure

## Root Directory Organization

```
CrossFitCoachAI/
├── src/                    # Main source code
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
├── __tests__/            # Test files
├── assets/               # Static assets (images, models)
├── .kiro/                # Kiro configuration and specs
└── package.json          # Dependencies and scripts
```

## Source Code Structure (`src/`)

```
src/
├── components/           # Reusable UI components
│   ├── camera/          # Camera-related components
│   ├── feedback/        # Feedback display components
│   ├── common/          # Shared UI components
│   └── charts/          # Progress visualization
├── screens/             # Screen components
│   ├── WorkoutScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── ProgressScreen.tsx
│   └── SettingsScreen.tsx
├── services/            # Business logic and external integrations
│   ├── camera/          # Camera interface service
│   ├── ai/              # AI/ML processing services
│   ├── storage/         # Data persistence services
│   └── feedback/        # Feedback generation service
├── models/              # TypeScript interfaces and types
│   ├── pose.ts          # Pose detection types
│   ├── movement.ts      # Movement classification types
│   ├── workout.ts       # Workout session types
│   └── user.ts          # User profile types
├── utils/               # Utility functions
│   ├── math.ts          # Mathematical calculations
│   ├── validation.ts    # Data validation helpers
│   └── constants.ts     # App constants
├── hooks/               # Custom React hooks
├── navigation/          # Navigation configuration
└── assets/              # Local assets and ML models
```

## Key Architecture Patterns

- **Component-based architecture** with React Native
- **Service layer pattern** for business logic separation
- **Hook-based state management** for UI state
- **TypeScript interfaces** for type safety
- **Modular AI pipeline** with separate services for each ML task

## File Naming Conventions

- **Components**: PascalCase (e.g., `WorkoutScreen.tsx`, `CameraView.tsx`)
- **Services**: camelCase (e.g., `poseDetection.ts`, `movementClassifier.ts`)
- **Types/Models**: camelCase with descriptive names (e.g., `workoutSession.ts`)
- **Utilities**: camelCase (e.g., `mathUtils.ts`, `validationHelpers.ts`)
- **Constants**: UPPER_SNAKE_CASE in constants files

## Import Organization

```typescript
// External libraries first
import React from 'react';
import { View, Text } from 'react-native';

// Internal services and utilities
import { poseDetectionService } from '../services/ai/poseDetection';
import { MovementType } from '../models/movement';

// Local components last
import { CameraView } from './CameraView';
```

## Testing Structure

- **Unit tests**: Co-located with source files (`*.test.ts`)
- **Integration tests**: In `__tests__/integration/`
- **E2E tests**: In `__tests__/e2e/`
- **Mock data**: In `__tests__/mocks/`