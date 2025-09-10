# Technical Stack

## Core Technologies

- **React Native** with TypeScript for cross-platform mobile development
- **TensorFlow Lite** for on-device machine learning inference
- **MediaPipe** for pose detection and computer vision
- **React Native Camera** for video stream processing

## Development Tools

- **TypeScript** for type safety and better developer experience
- **ESLint** and **Prettier** for code formatting and linting
- **Jest** for unit testing
- **React Navigation** for app navigation

## AI/ML Stack

- **MediaPipe Pose** for real-time pose estimation
- **Custom TensorFlow Lite models** for CrossFit movement classification
- **On-device inference** for privacy and performance
- **Computer vision pipeline** for form analysis

## Data & Storage

- **Local storage** with encryption for workout data
- **SQLite** or **AsyncStorage** for persistent data
- **No cloud dependencies** for core functionality

## Performance Requirements

- **15+ FPS** video processing rate
- **<200ms** feedback latency
- **Local processing** to avoid network dependencies
- **Battery optimization** for extended workout sessions

## Common Commands

```bash
# Project setup
npx react-native init CrossFitCoachAI --template react-native-template-typescript

# Install dependencies
npm install
cd ios && pod install && cd ..  # iOS only

# Development
npm start                       # Start Metro bundler
npm run android                # Run on Android
npm run ios                    # Run on iOS

# Testing
npm test                       # Run Jest tests
npm run test:watch            # Run tests in watch mode

# Code quality
npm run lint                  # Run ESLint
npm run format               # Run Prettier
npm run type-check           # TypeScript type checking

# Build
npm run build:android        # Build Android APK
npm run build:ios           # Build iOS archive
```

## Platform Targets

- **iOS 12+** (iPhone 8 and newer recommended)
- **Android API 21+** (Android 5.0+)
- **Camera permissions** required
- **Minimum 3GB RAM** recommended for optimal performance