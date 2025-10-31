#!/usr/bin/env node
/**
 * AWS CDK App for NVIDIA NIM Agentic Platform Infrastructure
 * Deploys complete infrastructure including EKS, SageMaker, Lambda, and Bedrock integration
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NvidiaNimEksStack } from './stacks/nvidia-nim-eks-stack';
import { NvidiaNimSageMakerStack } from './stacks/nvidia-nim-sagemaker-stack';
import { NvidiaNimLambdaStack } from './stacks/nvidia-nim-lambda-stack';
import { NvidiaNimNetworkingStack } from './stacks/nvidia-nim-networking-stack';
import { NvidiaNimMonitoringStack } from './stacks/nvidia-nim-monitoring-stack';

const app = new cdk.App();

// Get configuration from context or environment
const config = {
  account: process.env.CDK_DEFAULT_ACCOUNT || app.node.tryGetContext('account'),
  region: process.env.CDK_DEFAULT_REGION || app.node.tryGetContext('region') || 'us-west-2',
  environment: app.node.tryGetContext('environment') || 'production',
  deploymentMode: app.node.tryGetContext('deploymentMode') || 'hybrid', // 'eks', 'sagemaker', or 'hybrid'
};

const env = {
  account: config.account,
  region: config.region,
};

// Networking stack (VPC, subnets, security groups)
const networkingStack = new NvidiaNimNetworkingStack(app, 'NvidiaNimNetworking', {
  env,
  description: 'Networking infrastructure for NVIDIA NIM platform',
  tags: {
    Project: 'nvidia-nim-platform',
    Environment: config.environment,
  },
});

// EKS stack (if EKS deployment is enabled)
let eksStack: NvidiaNimEksStack | undefined;
if (config.deploymentMode === 'eks' || config.deploymentMode === 'hybrid') {
  eksStack = new NvidiaNimEksStack(app, 'NvidiaNimEks', {
    env,
    vpc: networkingStack.vpc,
    description: 'EKS cluster for NVIDIA NIM inference services',
    tags: {
      Project: 'nvidia-nim-platform',
      Environment: config.environment,
    },
  });
  
  eksStack.addDependency(networkingStack);
}

// SageMaker stack (if SageMaker deployment is enabled)
let sageMakerStack: NvidiaNimSageMakerStack | undefined;
if (config.deploymentMode === 'sagemaker' || config.deploymentMode === 'hybrid') {
  sageMakerStack = new NvidiaNimSageMakerStack(app, 'NvidiaNimSageMaker', {
    env,
    vpc: networkingStack.vpc,
    description: 'SageMaker endpoints for NVIDIA NIM models',
    tags: {
      Project: 'nvidia-nim-platform',
      Environment: config.environment,
    },
  });
  
  sageMakerStack.addDependency(networkingStack);
}

// Lambda integration stack
const lambdaStack = new NvidiaNimLambdaStack(app, 'NvidiaNimLambda', {
  env,
  vpc: networkingStack.vpc,
  eksCluster: eksStack?.cluster,
  sageMakerEndpoints: sageMakerStack?.endpoints,
  description: 'Lambda functions for NVIDIA NIM integration',
  tags: {
    Project: 'nvidia-nim-platform',
    Environment: config.environment,
  },
});

lambdaStack.addDependency(networkingStack);
if (eksStack) lambdaStack.addDependency(eksStack);
if (sageMakerStack) lambdaStack.addDependency(sageMakerStack);

// Monitoring stack
const monitoringStack = new NvidiaNimMonitoringStack(app, 'NvidiaNimMonitoring', {
  env,
  eksCluster: eksStack?.cluster,
  lambdaFunctions: lambdaStack.functions,
  sageMakerEndpoints: sageMakerStack?.endpoints,
  description: 'Monitoring and observability for NVIDIA NIM platform',
  tags: {
    Project: 'nvidia-nim-platform',
    Environment: config.environment,
  },
});

monitoringStack.addDependency(lambdaStack);

// Output key information
new cdk.CfnOutput(app, 'DeploymentMode', {
  value: config.deploymentMode,
  description: 'Deployment mode (eks, sagemaker, or hybrid)',
});

new cdk.CfnOutput(app, 'Region', {
  value: config.region,
  description: 'AWS region for deployment',
});

new cdk.CfnOutput(app, 'Environment', {
  value: config.environment,
  description: 'Environment (development, staging, production)',
});