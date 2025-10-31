#!/usr/bin/env node
/**
 * AWS CDK App for Vibe PM Agent Infrastructure
 * Deploys Lambda functions, API Gateway, DynamoDB, and S3 resources
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VibePMAgentStack } from './stacks/vibe-pm-agent-stack';
import { VibePMAgentMonitoringStack } from './stacks/vibe-pm-agent-monitoring-stack';

const app = new cdk.App();

// Get configuration from context or environment
const config = {
  account: process.env.CDK_DEFAULT_ACCOUNT || app.node.tryGetContext('account'),
  region: process.env.CDK_DEFAULT_REGION || app.node.tryGetContext('region') || 'us-east-1',
  environment: app.node.tryGetContext('environment') || 'production',
  enableMonitoring: app.node.tryGetContext('enableMonitoring') !== false,
};

const env = {
  account: config.account,
  region: config.region,
};

// Main application stack
const appStack = new VibePMAgentStack(app, 'VibePMAgent', {
  env,
  description: 'Vibe PM Agent - Strategic Business Intelligence MCP Server',
  tags: {
    Project: 'vibe-pm-agent',
    Environment: config.environment,
    ManagedBy: 'CDK',
  },
});

// Monitoring stack (optional)
if (config.enableMonitoring) {
  const monitoringStack = new VibePMAgentMonitoringStack(app, 'VibePMAgentMonitoring', {
    env,
    lambdaFunctions: appStack.lambdaFunctions,
    apiGateway: appStack.apiGateway,
    description: 'Monitoring and observability for Vibe PM Agent',
    tags: {
      Project: 'vibe-pm-agent',
      Environment: config.environment,
      ManagedBy: 'CDK',
    },
  });
  
  monitoringStack.addDependency(appStack);
}

// Output key information
new cdk.CfnOutput(app, 'Environment', {
  value: config.environment,
  description: 'Environment (development, staging, production)',
});

new cdk.CfnOutput(app, 'Region', {
  value: config.region,
  description: 'AWS region for deployment',
});

new cdk.CfnOutput(app, 'MonitoringEnabled', {
  value: config.enableMonitoring.toString(),
  description: 'Whether monitoring stack is enabled',
});