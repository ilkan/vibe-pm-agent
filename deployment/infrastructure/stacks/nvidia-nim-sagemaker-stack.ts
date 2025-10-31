/**
 * SageMaker stack for NVIDIA NIM platform
 * Creates SageMaker endpoints for NVIDIA NIM models with auto-scaling and monitoring
 */

import * as cdk from 'aws-cdk-lib';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { Construct } from 'constructs';

export interface NvidiaNimSageMakerStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export interface SageMakerEndpoints {
  llamaEndpoint: sagemaker.CfnEndpoint;
  embeddingEndpoint: sagemaker.CfnEndpoint;
}

export class NvidiaNimSageMakerStack extends cdk.Stack {
  public readonly endpoints: SageMakerEndpoints;
  public readonly modelBucket: s3.Bucket;
  public readonly executionRole: iam.Role;

  constructor(scope: Construct, id: string, props: NvidiaNimSageMakerStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // Create S3 bucket for model artifacts
    this.modelBucket = new s3.Bucket(this, 'NimModelBucket', {
      bucketName: `nvidia-nim-models-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create execution role for SageMaker
    this.executionRole = this.createExecutionRole();

    // Create VPC configuration for SageMaker
    const vpcConfig = this.createVpcConfig(vpc);

    // Create LLaMA model and endpoint
    const llamaModel = this.createLlamaModel();
    const llamaEndpointConfig = this.createLlamaEndpointConfig(llamaModel, vpcConfig);
    const llamaEndpoint = this.createEndpoint('nvidia-nim-llama-endpoint', llamaEndpointConfig);

    // Create embedding model and endpoint
    const embeddingModel = this.createEmbeddingModel();
    const embeddingEndpointConfig = this.createEmbeddingEndpointConfig(embeddingModel, vpcConfig);
    const embeddingEndpoint = this.createEndpoint('nvidia-nim-embedding-endpoint', embeddingEndpointConfig);

    this.endpoints = {
      llamaEndpoint,
      embeddingEndpoint,
    };

    // Set up auto-scaling for endpoints
    this.setupAutoScaling(llamaEndpoint, 'nvidia-nim-llama-endpoint');
    this.setupAutoScaling(embeddingEndpoint, 'nvidia-nim-embedding-endpoint');

    // Create data capture configuration
    this.createDataCaptureConfig();

    // Outputs
    new cdk.CfnOutput(this, 'LlamaEndpointName', {
      value: llamaEndpoint.attrEndpointName,
      description: 'NVIDIA NIM LLaMA endpoint name',
      exportName: 'NvidiaNim-LlamaEndpointName',
    });

    new cdk.CfnOutput(this, 'EmbeddingEndpointName', {
      value: embeddingEndpoint.attrEndpointName,
      description: 'NVIDIA NIM embedding endpoint name',
      exportName: 'NvidiaNim-EmbeddingEndpointName',
    });

    new cdk.CfnOutput(this, 'ModelBucketName', {
      value: this.modelBucket.bucketName,
      description: 'S3 bucket for model artifacts',
      exportName: 'NvidiaNim-ModelBucketName',
    });
  }

  private createExecutionRole(): iam.Role {
    const role = new iam.Role(this, 'SageMakerExecutionRole', {
      roleName: 'nvidia-nim-sagemaker-execution-role',
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
    });

    // Add custom policies
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          this.modelBucket.bucketArn,
          `${this.modelBucket.bucketArn}/*`,
        ],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/sagemaker/*`],
      })
    );

    return role;
  }

  private createVpcConfig(vpc: ec2.Vpc): sagemaker.CfnModel.VpcConfigProperty {
    // Create security group for SageMaker
    const sagemakerSecurityGroup = new ec2.SecurityGroup(this, 'SageMakerSecurityGroup', {
      vpc,
      description: 'Security group for SageMaker endpoints',
      allowAllOutbound: true,
    });

    sagemakerSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS access from VPC'
    );

    return {
      securityGroupIds: [sagemakerSecurityGroup.securityGroupId],
      subnets: vpc.privateSubnets.map(subnet => subnet.subnetId),
    };
  }

  private createLlamaModel(): sagemaker.CfnModel {
    return new sagemaker.CfnModel(this, 'NimLlamaModel', {
      modelName: `nvidia-nim-llama-${Date.now()}`,
      executionRoleArn: this.executionRole.roleArn,
      primaryContainer: {
        image: '763104351884.dkr.ecr.us-west-2.amazonaws.com/huggingface-pytorch-inference:2.0.0-transformers4.28.1-gpu-py310-cu118-ubuntu20.04',
        modelDataUrl: `s3://${this.modelBucket.bucketName}/llama-3.1-nemotron-nano-8b-v1/model.tar.gz`,
        environment: {
          SAGEMAKER_PROGRAM: 'inference.py',
          SAGEMAKER_SUBMIT_DIRECTORY: '/opt/ml/code',
          SAGEMAKER_CONTAINER_LOG_LEVEL: '20',
          SAGEMAKER_REGION: this.region,
          HF_MODEL_ID: 'nvidia/llama-3.1-nemotron-nano-8b-v1',
          HF_TASK: 'text-generation',
          MAX_INPUT_LENGTH: '4096',
          MAX_TOTAL_TOKENS: '8192',
        },
      },
      tags: [
        { key: 'Project', value: 'nvidia-nim-platform' },
        { key: 'Environment', value: 'production' },
        { key: 'ModelType', value: 'llama' },
      ],
    });
  }

  private createEmbeddingModel(): sagemaker.CfnModel {
    return new sagemaker.CfnModel(this, 'NimEmbeddingModel', {
      modelName: `nvidia-nim-embedding-${Date.now()}`,
      executionRoleArn: this.executionRole.roleArn,
      primaryContainer: {
        image: '763104351884.dkr.ecr.us-west-2.amazonaws.com/huggingface-pytorch-inference:2.0.0-transformers4.28.1-gpu-py310-cu118-ubuntu20.04',
        modelDataUrl: `s3://${this.modelBucket.bucketName}/nv-embedqa-e5-v5/model.tar.gz`,
        environment: {
          SAGEMAKER_PROGRAM: 'embedding_inference.py',
          SAGEMAKER_SUBMIT_DIRECTORY: '/opt/ml/code',
          SAGEMAKER_CONTAINER_LOG_LEVEL: '20',
          SAGEMAKER_REGION: this.region,
          HF_MODEL_ID: 'nvidia/nv-embedqa-e5-v5',
          HF_TASK: 'feature-extraction',
        },
      },
      tags: [
        { key: 'Project', value: 'nvidia-nim-platform' },
        { key: 'Environment', value: 'production' },
        { key: 'ModelType', value: 'embedding' },
      ],
    });
  }

  private createLlamaEndpointConfig(model: sagemaker.CfnModel, vpcConfig: sagemaker.CfnModel.VpcConfigProperty): sagemaker.CfnEndpointConfig {
    return new sagemaker.CfnEndpointConfig(this, 'NimLlamaEndpointConfig', {
      endpointConfigName: `nvidia-nim-llama-config-${Date.now()}`,
      productionVariants: [
        {
          variantName: 'primary',
          modelName: model.attrModelName,
          initialInstanceCount: 1,
          instanceType: 'ml.g5.xlarge',
          initialVariantWeight: 1.0,
        },
      ],
      dataCaptureConfig: {
        enableCapture: true,
        initialSamplingPercentage: 100,
        destinationS3Uri: `s3://${this.modelBucket.bucketName}/data-capture/llama/`,
        captureOptions: [
          { captureMode: 'Input' },
          { captureMode: 'Output' },
        ],
        captureContentTypeHeader: {
          csvContentTypes: ['text/csv'],
          jsonContentTypes: ['application/json'],
        },
      },
      asyncInferenceConfig: {
        outputConfig: {
          s3OutputPath: `s3://${this.modelBucket.bucketName}/async-inference/llama/output/`,
        },
        clientConfig: {
          maxConcurrentInvocationsPerInstance: 4,
        },
      },
      tags: [
        { key: 'Project', value: 'nvidia-nim-platform' },
        { key: 'Environment', value: 'production' },
      ],
    });
  }

  private createEmbeddingEndpointConfig(model: sagemaker.CfnModel, vpcConfig: sagemaker.CfnModel.VpcConfigProperty): sagemaker.CfnEndpointConfig {
    return new sagemaker.CfnEndpointConfig(this, 'NimEmbeddingEndpointConfig', {
      endpointConfigName: `nvidia-nim-embedding-config-${Date.now()}`,
      productionVariants: [
        {
          variantName: 'primary',
          modelName: model.attrModelName,
          initialInstanceCount: 1,
          instanceType: 'ml.g5.large',
          initialVariantWeight: 1.0,
        },
      ],
      dataCaptureConfig: {
        enableCapture: true,
        initialSamplingPercentage: 100,
        destinationS3Uri: `s3://${this.modelBucket.bucketName}/data-capture/embedding/`,
        captureOptions: [
          { captureMode: 'Input' },
          { captureMode: 'Output' },
        ],
        captureContentTypeHeader: {
          csvContentTypes: ['text/csv'],
          jsonContentTypes: ['application/json'],
        },
      },
      tags: [
        { key: 'Project', value: 'nvidia-nim-platform' },
        { key: 'Environment', value: 'production' },
      ],
    });
  }

  private createEndpoint(endpointName: string, endpointConfig: sagemaker.CfnEndpointConfig): sagemaker.CfnEndpoint {
    return new sagemaker.CfnEndpoint(this, `${endpointName}Endpoint`, {
      endpointName,
      endpointConfigName: endpointConfig.attrEndpointConfigName,
      tags: [
        { key: 'Project', value: 'nvidia-nim-platform' },
        { key: 'Environment', value: 'production' },
        { key: 'CreatedAt', value: new Date().toISOString() },
      ],
    });
  }

  private setupAutoScaling(endpoint: sagemaker.CfnEndpoint, endpointName: string): void {
    // Create scalable target
    const scalableTarget = new applicationautoscaling.ScalableTarget(this, `${endpointName}ScalableTarget`, {
      serviceNamespace: applicationautoscaling.ServiceNamespace.SAGEMAKER,
      resourceId: `endpoint/${endpoint.attrEndpointName}/variant/primary`,
      scalableDimension: 'sagemaker:variant:DesiredInstanceCount',
      minCapacity: 1,
      maxCapacity: 10,
    });

    // Create scaling policy
    new applicationautoscaling.TargetTrackingScalingPolicy(this, `${endpointName}ScalingPolicy`, {
      scalingTarget: scalableTarget,
      targetValue: 70.0,
      predefinedMetric: applicationautoscaling.PredefinedMetric.SAGEMAKER_VARIANT_INVOCATIONS_PER_INSTANCE,
      scaleOutCooldown: cdk.Duration.minutes(5),
      scaleInCooldown: cdk.Duration.minutes(5),
    });
  }

  private createDataCaptureConfig(): void {
    // Create S3 bucket for data capture
    const dataCapturePrefix = 'data-capture';
    
    // Add lifecycle rule for data capture
    this.modelBucket.addLifecycleRule({
      id: 'DataCaptureLifecycle',
      enabled: true,
      prefix: dataCapturePrefix,
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        },
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        },
      ],
      expiration: cdk.Duration.days(365),
    });
  }
}