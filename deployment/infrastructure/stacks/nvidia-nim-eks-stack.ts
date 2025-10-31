/**
 * EKS stack for NVIDIA NIM platform
 * Creates EKS cluster with GPU node groups for NVIDIA NIM inference services
 */

import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface NvidiaNimEksStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class NvidiaNimEksStack extends cdk.Stack {
  public readonly cluster: eks.Cluster;
  public readonly gpuNodeGroup: eks.Nodegroup;
  public readonly cpuNodeGroup: eks.Nodegroup;

  constructor(scope: Construct, id: string, props: NvidiaNimEksStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // Create EKS cluster
    this.cluster = new eks.Cluster(this, 'NvidiaNimCluster', {
      clusterName: 'nvidia-nim-cluster',
      version: eks.KubernetesVersion.V1_28,
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      defaultCapacity: 0, // We'll add node groups manually
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
      outputClusterName: true,
      outputConfigCommand: true,
    });

    // Add essential add-ons
    this.addClusterAddOns();

    // Create GPU node group for NVIDIA NIM workloads
    this.gpuNodeGroup = this.cluster.addNodegroupCapacity('GpuNodeGroup', {
      nodegroupName: 'gpu-nodes',
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.G5, ec2.InstanceSize.XLARGE),
        ec2.InstanceType.of(ec2.InstanceClass.G5, ec2.InstanceSize.XLARGE2),
      ],
      minSize: 1,
      maxSize: 8,
      desiredSize: 2,
      diskSize: 100,
      amiType: eks.NodegroupAmiType.AL2_X86_64_GPU,
      capacityType: eks.CapacityType.ON_DEMAND,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      labels: {
        'node-type': 'gpu',
        'nvidia.com/gpu.present': 'true',
      },
      taints: [
        {
          key: 'nvidia.com/gpu',
          value: 'true',
          effect: eks.TaintEffect.NO_SCHEDULE,
        },
      ],
      tags: {
        'k8s.io/cluster-autoscaler/enabled': 'true',
        'k8s.io/cluster-autoscaler/nvidia-nim-cluster': 'owned',
      },
    });

    // Create CPU node group for general workloads
    this.cpuNodeGroup = this.cluster.addNodegroupCapacity('CpuNodeGroup', {
      nodegroupName: 'cpu-nodes',
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
        ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE),
      ],
      minSize: 2,
      maxSize: 10,
      desiredSize: 3,
      diskSize: 50,
      amiType: eks.NodegroupAmiType.AL2_X86_64,
      capacityType: eks.CapacityType.ON_DEMAND,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      labels: {
        'node-type': 'cpu',
      },
      tags: {
        'k8s.io/cluster-autoscaler/enabled': 'true',
        'k8s.io/cluster-autoscaler/nvidia-nim-cluster': 'owned',
      },
    });

    // Install cluster autoscaler
    this.installClusterAutoscaler();

    // Install NVIDIA device plugin
    this.installNvidiaDevicePlugin();

    // Install Istio service mesh
    this.installIstioServiceMesh();

    // Create NVIDIA NIM namespace and resources
    this.createNimNamespace();

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'EKS cluster name',
      exportName: 'NvidiaNim-EksClusterName',
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint,
      description: 'EKS cluster endpoint',
      exportName: 'NvidiaNim-EksClusterEndpoint',
    });

    new cdk.CfnOutput(this, 'ClusterArn', {
      value: this.cluster.clusterArn,
      description: 'EKS cluster ARN',
      exportName: 'NvidiaNim-EksClusterArn',
    });
  }

  private addClusterAddOns(): void {
    // VPC CNI add-on
    new eks.CfnAddon(this, 'VpcCniAddon', {
      clusterName: this.cluster.clusterName,
      addonName: 'vpc-cni',
      addonVersion: 'v1.15.1-eksbuild.1',
      resolveConflicts: 'OVERWRITE',
    });

    // CoreDNS add-on
    new eks.CfnAddon(this, 'CoreDnsAddon', {
      clusterName: this.cluster.clusterName,
      addonName: 'coredns',
      addonVersion: 'v1.10.1-eksbuild.5',
      resolveConflicts: 'OVERWRITE',
    });

    // kube-proxy add-on
    new eks.CfnAddon(this, 'KubeProxyAddon', {
      clusterName: this.cluster.clusterName,
      addonName: 'kube-proxy',
      addonVersion: 'v1.28.2-eksbuild.2',
      resolveConflicts: 'OVERWRITE',
    });

    // EBS CSI driver add-on
    new eks.CfnAddon(this, 'EbsCsiAddon', {
      clusterName: this.cluster.clusterName,
      addonName: 'aws-ebs-csi-driver',
      addonVersion: 'v1.24.0-eksbuild.1',
      resolveConflicts: 'OVERWRITE',
      serviceAccountRoleArn: this.createEbsCsiServiceAccountRole().roleArn,
    });
  }

  private createEbsCsiServiceAccountRole(): iam.Role {
    const role = new iam.Role(this, 'EbsCsiServiceAccountRole', {
      assumedBy: new iam.WebIdentityPrincipal(
        this.cluster.openIdConnectProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            [`${this.cluster.openIdConnectProvider.openIdConnectProviderIssuer}:sub`]:
              'system:serviceaccount:kube-system:ebs-csi-controller-sa',
            [`${this.cluster.openIdConnectProvider.openIdConnectProviderIssuer}:aud`]: 'sts.amazonaws.com',
          },
        }
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEBSCSIDriverPolicy'),
      ],
    });

    return role;
  }

  private installClusterAutoscaler(): void {
    // Create service account for cluster autoscaler
    const clusterAutoscalerServiceAccount = this.cluster.addServiceAccount('ClusterAutoscalerServiceAccount', {
      name: 'cluster-autoscaler',
      namespace: 'kube-system',
    });

    // Add IAM policy for cluster autoscaler
    clusterAutoscalerServiceAccount.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'autoscaling:DescribeAutoScalingGroups',
          'autoscaling:DescribeAutoScalingInstances',
          'autoscaling:DescribeLaunchConfigurations',
          'autoscaling:DescribeTags',
          'autoscaling:SetDesiredCapacity',
          'autoscaling:TerminateInstanceInAutoScalingGroup',
          'ec2:DescribeLaunchTemplateVersions',
        ],
        resources: ['*'],
      })
    );

    // Install cluster autoscaler
    const clusterAutoscalerChart = this.cluster.addHelmChart('ClusterAutoscaler', {
      chart: 'cluster-autoscaler',
      repository: 'https://kubernetes.github.io/autoscaler',
      namespace: 'kube-system',
      values: {
        autoDiscovery: {
          clusterName: this.cluster.clusterName,
        },
        awsRegion: this.region,
        serviceAccount: {
          create: false,
          name: 'cluster-autoscaler',
        },
        extraArgs: {
          'scale-down-delay-after-add': '10m',
          'scale-down-unneeded-time': '10m',
          'skip-nodes-with-local-storage': false,
          'skip-nodes-with-system-pods': false,
        },
      },
    });

    clusterAutoscalerChart.node.addDependency(clusterAutoscalerServiceAccount);
  }

  private installNvidiaDevicePlugin(): void {
    // Install NVIDIA device plugin for GPU support
    const nvidiaDevicePlugin = this.cluster.addManifest('NvidiaDevicePlugin', {
      apiVersion: 'apps/v1',
      kind: 'DaemonSet',
      metadata: {
        name: 'nvidia-device-plugin-daemonset',
        namespace: 'kube-system',
      },
      spec: {
        selector: {
          matchLabels: {
            name: 'nvidia-device-plugin-ds',
          },
        },
        updateStrategy: {
          type: 'RollingUpdate',
        },
        template: {
          metadata: {
            labels: {
              name: 'nvidia-device-plugin-ds',
            },
          },
          spec: {
            tolerations: [
              {
                key: 'nvidia.com/gpu',
                operator: 'Exists',
                effect: 'NoSchedule',
              },
            ],
            priorityClassName: 'system-node-critical',
            containers: [
              {
                image: 'nvcr.io/nvidia/k8s-device-plugin:v0.14.1',
                name: 'nvidia-device-plugin-ctr',
                env: [
                  {
                    name: 'FAIL_ON_INIT_ERROR',
                    value: 'false',
                  },
                ],
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities: {
                    drop: ['ALL'],
                  },
                },
                volumeMounts: [
                  {
                    name: 'device-plugin',
                    mountPath: '/var/lib/kubelet/device-plugins',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'device-plugin',
                hostPath: {
                  path: '/var/lib/kubelet/device-plugins',
                },
              },
            ],
          },
        },
      },
    });
  }

  private installIstioServiceMesh(): void {
    // Install Istio using Helm
    const istioBase = this.cluster.addHelmChart('IstioBase', {
      chart: 'base',
      repository: 'https://istio-release.storage.googleapis.com/charts',
      namespace: 'istio-system',
      createNamespace: true,
      values: {
        defaultRevision: 'default',
      },
    });

    const istiod = this.cluster.addHelmChart('Istiod', {
      chart: 'istiod',
      repository: 'https://istio-release.storage.googleapis.com/charts',
      namespace: 'istio-system',
      values: {
        global: {
          meshID: 'nvidia-nim-mesh',
          multiCluster: {
            clusterName: 'nvidia-nim-cluster',
          },
          network: 'nvidia-nim-network',
        },
      },
    });

    istiod.node.addDependency(istioBase);

    // Install Istio ingress gateway
    const istioIngressGateway = this.cluster.addHelmChart('IstioIngressGateway', {
      chart: 'gateway',
      repository: 'https://istio-release.storage.googleapis.com/charts',
      namespace: 'istio-ingress',
      createNamespace: true,
      values: {
        service: {
          type: 'LoadBalancer',
          ports: [
            { port: 80, targetPort: 8080, name: 'http2' },
            { port: 443, targetPort: 8443, name: 'https' },
          ],
        },
      },
    });

    istioIngressGateway.node.addDependency(istiod);
  }

  private createNimNamespace(): void {
    // Create NVIDIA NIM namespace
    const nimNamespace = this.cluster.addManifest('NimNamespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'nvidia-nim',
        labels: {
          'istio-injection': 'enabled',
          'name': 'nvidia-nim',
          'app.kubernetes.io/name': 'nvidia-nim-platform',
        },
      },
    });

    // Create resource quota for the namespace
    const resourceQuota = this.cluster.addManifest('NimResourceQuota', {
      apiVersion: 'v1',
      kind: 'ResourceQuota',
      metadata: {
        name: 'nvidia-nim-quota',
        namespace: 'nvidia-nim',
      },
      spec: {
        hard: {
          'requests.cpu': '20',
          'requests.memory': '40Gi',
          'requests.nvidia.com/gpu': '8',
          'limits.cpu': '40',
          'limits.memory': '80Gi',
          'limits.nvidia.com/gpu': '8',
          'persistentvolumeclaims': '10',
        },
      },
    });

    resourceQuota.node.addDependency(nimNamespace);
  }
}