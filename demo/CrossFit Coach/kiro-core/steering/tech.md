# Technology Stack

## Core Technologies

### Mobile Development
- **Platform**: Cross-platform mobile (iOS/Android)
- **Language**: TypeScript for business logic and interfaces
- **Native Integration**: Platform-specific camera and ML model integration

### Machine Learning & Computer Vision
- **iOS**: Core ML for on-device pose estimation
- **Android**: ML Kit for pose detection
- **Model**: MediaPipe Pose or similar lightweight model
- **Processing**: Real-time pose landmark detection and analysis

### Data & Storage
- **Local Storage**: Device-native encrypted storage
- **Cloud Sync**: End-to-end encrypted synchronization
- **Database**: Local database for workout sessions and user data

## Architecture Patterns

### Engine-Based Architecture
- **Pose Detection Engine**: Handles camera input and pose estimation
- **Movement Analysis Engine**: Analyzes pose sequences against exercise criteria
- **Coaching Logic Engine**: Generates contextual feedback
- **Feedback Delivery System**: Manages audio/visual output

### Design Principles
- **Privacy-first**: All video processing on-device, no raw video upload
- **Offline-capable**: Full functionality without internet connectivity
- **Real-time performance**: Sub-2-second feedback requirement
- **Modular design**: Dependency injection for engine management

## Performance Requirements

### Latency
- **Feedback delivery**: Maximum 2 seconds from movement completion
- **Pose detection**: Real-time processing at device camera frame rate
- **Movement analysis**: Immediate processing of pose sequences

### Resource Management
- **Memory**: Efficient pose data buffering and cleanup
- **Battery**: Adaptive frame rates and power-saving modes
- **Storage**: Automatic data compression and pruning

## Common Commands

Since this is a specification-stage project, implementation commands will depend on the chosen mobile development framework. Key development activities will include:

- Setting up pose detection model integration
- Implementing real-time camera processing pipelines
- Building movement analysis algorithms
- Creating audio/visual feedback systems
- Developing local data storage with encryption
- Testing with real CrossFit movement data