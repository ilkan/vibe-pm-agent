# Technology Stack

## Language & Runtime
- **Primary Language**: TypeScript
- **Runtime**: Node.js
- **Package Manager**: npm/yarn (standard Node.js ecosystem)

## Architecture Pattern
- **Design**: Modular pipeline architecture
- **Processing Stages**: Intent Analysis → Business Analysis → Optimization → Forecasting
- **Data Flow**: Sequential pipeline with clear component interfaces

## Core Technologies
- **AWS AI Services**: Amazon Bedrock Agent, Nova foundation models, Amazon Q Developer
- **Natural Language Processing**: AI-powered intent parsing and extraction using Bedrock
- **Business Analysis**: Fishbone methodology implementation with AI agent orchestration
- **Optimization Algorithms**: Batching, caching, and workflow decomposition
- **Quota Modeling**: Cost estimation and forecasting systems
- **Interview Coaching**: AI-powered question generation, evaluation, and personalized feedback

## Key Libraries & Frameworks
- **AWS SDK**: Bedrock Agent runtime, DynamoDB, Lambda, CloudWatch integration
- **Amazon Bedrock**: Agent orchestration, action groups, knowledge base management
- **Amazon Nova**: Foundation model for natural language understanding and generation
- **Amazon Q Developer**: Technical interview preparation and code analysis
- Testing framework for comprehensive unit and integration testing
- TypeScript for type safety and interface definitions
- Mermaid diagrams for architecture documentation

## Development Commands
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Build project
npm run build

# Run development server
npm run dev

# Deploy to AWS (NEW)
npm run deploy:aws

# Test Bedrock Agent integration (NEW)
npm run test:bedrock

# Deploy AI agents (NEW)
npm run deploy:agents

# Lint code
npm run lint

# Type checking
npm run type-check
```

## AWS Deployment Commands (NEW)
```bash
# Deploy Bedrock Agent and action groups
aws bedrock-agent create-agent --agent-name PMInterviewCoach

# Deploy Lambda functions for agent actions
sam deploy --template-file template.yaml

# Test agent functionality
aws bedrock-agent-runtime invoke-agent --agent-id <agent-id>

# Monitor agent performance
aws logs tail /aws/lambda/pm-interview-handler --follow
```

## Code Quality
- Comprehensive unit testing for all components
- Integration testing for pipeline workflows
- Performance benchmarking for processing time and memory
- Type safety with TypeScript interfaces throughout