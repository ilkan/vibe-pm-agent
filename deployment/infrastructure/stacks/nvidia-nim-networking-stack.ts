/**
 * Networking stack for NVIDIA NIM platform
 * Creates VPC, subnets, security groups, and networking components
 */

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class NvidiaNimNetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly eksSecurityGroup: ec2.SecurityGroup;
  public readonly sageMakerSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'NvidiaNimVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs
    const flowLogRole = new cdk.aws_iam.Role(this, 'FlowLogRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy'),
      ],
    });

    const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: '/aws/vpc/nvidia-nim-flowlogs',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Security Groups
    this.eksSecurityGroup = new ec2.SecurityGroup(this, 'EksSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EKS cluster and nodes',
      allowAllOutbound: true,
    });

    this.sageMakerSecurityGroup = new ec2.SecurityGroup(this, 'SageMakerSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for SageMaker endpoints',
      allowAllOutbound: true,
    });

    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Security group rules
    this.setupSecurityGroupRules();

    // VPC Endpoints for AWS services
    this.createVpcEndpoints();

    // Tags
    cdk.Tags.of(this.vpc).add('Name', 'nvidia-nim-vpc');
    cdk.Tags.of(this.vpc).add('kubernetes.io/role/elb', '1');

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for NVIDIA NIM platform',
      exportName: 'NvidiaNim-VpcId',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs',
      exportName: 'NvidiaNim-PrivateSubnetIds',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
      exportName: 'NvidiaNim-PublicSubnetIds',
    });
  }

  private setupSecurityGroupRules(): void {
    // EKS cluster communication
    this.eksSecurityGroup.addIngressRule(
      this.eksSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow all traffic within EKS security group'
    );

    // HTTPS access for EKS API server
    this.eksSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access to EKS API server'
    );

    // SageMaker endpoint access
    this.sageMakerSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(443),
      'Lambda to SageMaker HTTPS access'
    );

    this.sageMakerSecurityGroup.addIngressRule(
      this.eksSecurityGroup,
      ec2.Port.tcp(443),
      'EKS to SageMaker HTTPS access'
    );

    // Lambda function access
    this.lambdaSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access for Lambda functions'
    );

    // NIM service ports
    this.eksSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(8000),
      'Lambda to NIM LLaMA service'
    );

    this.eksSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(8001),
      'Lambda to NIM embedding service'
    );
  }

  private createVpcEndpoints(): void {
    // S3 Gateway endpoint
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    // DynamoDB Gateway endpoint
    this.vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    // Interface endpoints for AWS services
    const interfaceEndpoints = [
      { service: ec2.InterfaceVpcEndpointAwsService.ECR, name: 'EcrEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER, name: 'EcrDockerEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.EKS, name: 'EksEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_RUNTIME, name: 'SageMakerRuntimeEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.LAMBDA, name: 'LambdaEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME, name: 'BedrockRuntimeEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS, name: 'CloudWatchLogsEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH, name: 'CloudWatchEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.STS, name: 'StsEndpoint' },
    ];

    interfaceEndpoints.forEach(({ service, name }) => {
      this.vpc.addInterfaceEndpoint(name, {
        service,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        privateDnsEnabled: true,
        securityGroups: [this.createEndpointSecurityGroup(name)],
      });
    });
  }

  private createEndpointSecurityGroup(endpointName: string): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, `${endpointName}SecurityGroup`, {
      vpc: this.vpc,
      description: `Security group for ${endpointName}`,
      allowAllOutbound: false,
    });

    // Allow HTTPS access from VPC
    sg.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS access from VPC'
    );

    return sg;
  }
}