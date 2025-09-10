# Project Structure

## Directory Organization

### Core Application Structure
```
src/
├── models/           # Data models and interfaces
│   ├── user/        # User profile and physical attributes
│   ├── exercise/    # Exercise definitions and workout models
│   ├── session/     # Workout sessions and performance tracking
│   └── analysis/    # Movement analysis and metrics models
├── engines/         # Core processing engines
│   ├── pose/        # Pose detection engine
│   ├── movement/    # Movement analysis engine
│   ├── coaching/    # Coaching logic engine
│   └── feedback/    # Feedback delivery system
├── services/        # Business logic and data services
│   ├── camera/      # Camera integration and video processing
│   ├── storage/     # Local storage and data management
│   ├── sync/        # Cloud synchronization services
│   └── session/     # Workout session management
├── ui/              # User interface components
│   ├── camera/      # Camera view and overlays
│   ├── feedback/    # Visual feedback components
│   ├── session/     # Workout session UI
│   └── settings/    # User settings and configuration
└── utils/           # Shared utilities and helpers
    ├── validation/  # Data validation functions
    ├── encryption/  # Security and encryption utilities
    └── testing/     # Testing framework and utilities
```

### Configuration and Data
```
config/              # Configuration files
├── exercises/       # Exercise definitions and form criteria
├── models/          # ML model configurations
└── settings/        # App settings and defaults

data/                # Local data storage
├── sessions/        # Workout session data
├── profiles/        # User profile data
└── cache/           # Temporary and cached data
```

## Code Organization Patterns

### Interface-First Design
- All engines implement well-defined TypeScript interfaces
- Dependency injection container manages engine instances
- Clear separation between data models and business logic

### Engine Architecture
- **PoseDetectionEngine**: Camera input → pose landmarks
- **MovementAnalysisEngine**: Pose sequences → movement analysis
- **CoachingLogicEngine**: Analysis + user profile → coaching feedback
- **FeedbackDeliverySystem**: Feedback → audio/visual output

### Data Flow
1. Camera input processed by pose detection engine
2. Pose landmarks analyzed by movement analysis engine
3. Analysis results processed by coaching logic engine
4. Feedback delivered through feedback delivery system
5. Session data stored locally with optional cloud sync

## File Naming Conventions

### TypeScript Files
- **Interfaces**: `IPoseDetectionEngine.ts`, `IMovementAnalysis.ts`
- **Classes**: `PoseDetectionEngine.ts`, `WorkoutSession.ts`
- **Models**: `UserProfile.ts`, `ExerciseDefinition.ts`
- **Services**: `CameraService.ts`, `StorageService.ts`

### Test Files
- **Unit tests**: `*.test.ts` (co-located with source files)
- **Integration tests**: `*.integration.test.ts`
- **Test data**: `test-data/` directory with mock pose sequences

## Module Dependencies

### Core Dependencies
- Pose detection engines depend on platform-specific ML frameworks
- Movement analysis depends on exercise definitions and pose data
- Coaching logic depends on user profiles and movement analysis
- All engines are coordinated by the workout session manager

### Data Dependencies
- User profiles influence coaching behavior and feedback intensity
- Exercise definitions drive movement analysis criteria
- Session data aggregates performance metrics over time
- Local storage provides offline capability with cloud sync