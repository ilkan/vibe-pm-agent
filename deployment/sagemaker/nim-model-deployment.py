#!/usr/bin/env python3
"""
SageMaker deployment script for NVIDIA NIM models
Deploys llama-3.1-nemotron-nano-8b-v1 and embedding models to SageMaker endpoints
"""

import boto3
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

class NIMSageMakerDeployer:
    def __init__(self, region: str = 'us-west-2'):
        self.region = region
        self.sagemaker = boto3.client('sagemaker', region_name=region)
        self.iam = boto3.client('iam', region_name=region)
        self.s3 = boto3.client('s3', region_name=region)
        
    def create_execution_role(self, role_name: str) -> str:
        """Create IAM execution role for SageMaker"""
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "sagemaker.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        try:
            response = self.iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description='Execution role for NVIDIA NIM SageMaker endpoints'
            )
            
            # Attach required policies
            policies = [
                'arn:aws:iam::aws:policy/AmazonSageMakerFullAccess',
                'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
                'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess'
            ]
            
            for policy in policies:
                self.iam.attach_role_policy(
                    RoleName=role_name,
                    PolicyArn=policy
                )
            
            return response['Role']['Arn']
            
        except self.iam.exceptions.EntityAlreadyExistsException:
            response = self.iam.get_role(RoleName=role_name)
            return response['Role']['Arn']
    
    def create_model(self, model_name: str, model_type: str, execution_role_arn: str) -> str:
        """Create SageMaker model"""
        
        if model_type == 'llama':
            image_uri = '763104351884.dkr.ecr.us-west-2.amazonaws.com/huggingface-pytorch-inference:2.0.0-transformers4.28.1-gpu-py310-cu118-ubuntu20.04'
            model_data_url = 's3://nvidia-nim-models/llama-3.1-nemotron-nano-8b-v1/model.tar.gz'
            environment = {
                'SAGEMAKER_PROGRAM': 'inference.py',
                'SAGEMAKER_SUBMIT_DIRECTORY': '/opt/ml/code',
                'SAGEMAKER_CONTAINER_LOG_LEVEL': '20',
                'SAGEMAKER_REGION': self.region,
                'HF_MODEL_ID': 'nvidia/llama-3.1-nemotron-nano-8b-v1',
                'HF_TASK': 'text-generation',
                'MAX_INPUT_LENGTH': '4096',
                'MAX_TOTAL_TOKENS': '8192'
            }
        else:  # embedding
            image_uri = '763104351884.dkr.ecr.us-west-2.amazonaws.com/huggingface-pytorch-inference:2.0.0-transformers4.28.1-gpu-py310-cu118-ubuntu20.04'
            model_data_url = 's3://nvidia-nim-models/nv-embedqa-e5-v5/model.tar.gz'
            environment = {
                'SAGEMAKER_PROGRAM': 'embedding_inference.py',
                'SAGEMAKER_SUBMIT_DIRECTORY': '/opt/ml/code',
                'SAGEMAKER_CONTAINER_LOG_LEVEL': '20',
                'SAGEMAKER_REGION': self.region,
                'HF_MODEL_ID': 'nvidia/nv-embedqa-e5-v5',
                'HF_TASK': 'feature-extraction'
            }
        
        try:
            response = self.sagemaker.create_model(
                ModelName=model_name,
                PrimaryContainer={
                    'Image': image_uri,
                    'ModelDataUrl': model_data_url,
                    'Environment': environment
                },
                ExecutionRoleArn=execution_role_arn,
                Tags=[
                    {'Key': 'Project', 'Value': 'nvidia-nim-platform'},
                    {'Key': 'Environment', 'Value': 'production'},
                    {'Key': 'ModelType', 'Value': model_type}
                ]
            )
            return response['ModelArn']
            
        except self.sagemaker.exceptions.ValidationException as e:
            if 'already exists' in str(e):
                print(f"Model {model_name} already exists")
                return f"arn:aws:sagemaker:{self.region}:*:model/{model_name}"
            raise
    
    def create_endpoint_config(self, config_name: str, model_name: str, 
                             instance_type: str = 'ml.g5.xlarge',
                             initial_instance_count: int = 1) -> str:
        """Create SageMaker endpoint configuration"""
        
        try:
            response = self.sagemaker.create_endpoint_config(
                EndpointConfigName=config_name,
                ProductionVariants=[
                    {
                        'VariantName': 'primary',
                        'ModelName': model_name,
                        'InitialInstanceCount': initial_instance_count,
                        'InstanceType': instance_type,
                        'InitialVariantWeight': 1.0,
                        'AcceleratorType': 'ml.eia2.medium'
                    }
                ],
                AsyncInferenceConfig={
                    'OutputConfig': {
                        'S3OutputPath': f's3://nvidia-nim-async-inference/{config_name}/output'
                    },
                    'ClientConfig': {
                        'MaxConcurrentInvocationsPerInstance': 4
                    }
                },
                Tags=[
                    {'Key': 'Project', 'Value': 'nvidia-nim-platform'},
                    {'Key': 'Environment', 'Value': 'production'}
                ]
            )
            return response['EndpointConfigArn']
            
        except self.sagemaker.exceptions.ValidationException as e:
            if 'already exists' in str(e):
                print(f"Endpoint config {config_name} already exists")
                return f"arn:aws:sagemaker:{self.region}:*:endpoint-config/{config_name}"
            raise
    
    def create_endpoint(self, endpoint_name: str, config_name: str) -> str:
        """Create SageMaker endpoint"""
        
        try:
            response = self.sagemaker.create_endpoint(
                EndpointName=endpoint_name,
                EndpointConfigName=config_name,
                Tags=[
                    {'Key': 'Project', 'Value': 'nvidia-nim-platform'},
                    {'Key': 'Environment', 'Value': 'production'},
                    {'Key': 'CreatedAt', 'Value': datetime.now().isoformat()}
                ]
            )
            return response['EndpointArn']
            
        except self.sagemaker.exceptions.ValidationException as e:
            if 'already exists' in str(e):
                print(f"Endpoint {endpoint_name} already exists")
                return f"arn:aws:sagemaker:{self.region}:*:endpoint/{endpoint_name}"
            raise
    
    def wait_for_endpoint(self, endpoint_name: str, timeout: int = 1800) -> bool:
        """Wait for endpoint to be in service"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            response = self.sagemaker.describe_endpoint(EndpointName=endpoint_name)
            status = response['EndpointStatus']
            
            print(f"Endpoint {endpoint_name} status: {status}")
            
            if status == 'InService':
                return True
            elif status == 'Failed':
                print(f"Endpoint creation failed: {response.get('FailureReason', 'Unknown error')}")
                return False
            
            time.sleep(30)
        
        print(f"Timeout waiting for endpoint {endpoint_name}")
        return False
    
    def setup_auto_scaling(self, endpoint_name: str, variant_name: str = 'primary'):
        """Setup auto-scaling for the endpoint"""
        autoscaling = boto3.client('application-autoscaling', region_name=self.region)
        
        # Register scalable target
        autoscaling.register_scalable_target(
            ServiceNamespace='sagemaker',
            ResourceId=f'endpoint/{endpoint_name}/variant/{variant_name}',
            ScalableDimension='sagemaker:variant:DesiredInstanceCount',
            MinCapacity=1,
            MaxCapacity=10,
            RoleArn=f'arn:aws:iam::{boto3.client("sts").get_caller_identity()["Account"]}:role/application-autoscaling-sagemaker-role'
        )
        
        # Create scaling policy
        autoscaling.put_scaling_policy(
            PolicyName=f'{endpoint_name}-scaling-policy',
            ServiceNamespace='sagemaker',
            ResourceId=f'endpoint/{endpoint_name}/variant/{variant_name}',
            ScalableDimension='sagemaker:variant:DesiredInstanceCount',
            PolicyType='TargetTrackingScaling',
            TargetTrackingScalingPolicyConfiguration={
                'TargetValue': 70.0,
                'PredefinedMetricSpecification': {
                    'PredefinedMetricType': 'SageMakerVariantInvocationsPerInstance'
                },
                'ScaleOutCooldown': 300,
                'ScaleInCooldown': 300
            }
        )
    
    def deploy_nim_models(self) -> Dict[str, str]:
        """Deploy both LLaMA and embedding models"""
        
        # Create execution role
        role_arn = self.create_execution_role('nvidia-nim-sagemaker-role')
        print(f"Created execution role: {role_arn}")
        
        # Wait for role to propagate
        time.sleep(10)
        
        endpoints = {}
        
        # Deploy LLaMA model
        llama_model_name = f'nvidia-nim-llama-{int(time.time())}'
        llama_config_name = f'nvidia-nim-llama-config-{int(time.time())}'
        llama_endpoint_name = 'nvidia-nim-llama-endpoint'
        
        print("Creating LLaMA model...")
        self.create_model(llama_model_name, 'llama', role_arn)
        
        print("Creating LLaMA endpoint configuration...")
        self.create_endpoint_config(llama_config_name, llama_model_name, 'ml.g5.xlarge', 1)
        
        print("Creating LLaMA endpoint...")
        llama_endpoint_arn = self.create_endpoint(llama_endpoint_name, llama_config_name)
        endpoints['llama'] = llama_endpoint_arn
        
        # Deploy embedding model
        embedding_model_name = f'nvidia-nim-embedding-{int(time.time())}'
        embedding_config_name = f'nvidia-nim-embedding-config-{int(time.time())}'
        embedding_endpoint_name = 'nvidia-nim-embedding-endpoint'
        
        print("Creating embedding model...")
        self.create_model(embedding_model_name, 'embedding', role_arn)
        
        print("Creating embedding endpoint configuration...")
        self.create_endpoint_config(embedding_config_name, embedding_model_name, 'ml.g5.large', 1)
        
        print("Creating embedding endpoint...")
        embedding_endpoint_arn = self.create_endpoint(embedding_endpoint_name, embedding_config_name)
        endpoints['embedding'] = embedding_endpoint_arn
        
        # Wait for endpoints to be ready
        print("Waiting for LLaMA endpoint to be ready...")
        if self.wait_for_endpoint(llama_endpoint_name):
            print("Setting up auto-scaling for LLaMA endpoint...")
            self.setup_auto_scaling(llama_endpoint_name)
        
        print("Waiting for embedding endpoint to be ready...")
        if self.wait_for_endpoint(embedding_endpoint_name):
            print("Setting up auto-scaling for embedding endpoint...")
            self.setup_auto_scaling(embedding_endpoint_name)
        
        return endpoints

def main():
    """Main deployment function"""
    deployer = NIMSageMakerDeployer()
    
    print("Starting NVIDIA NIM SageMaker deployment...")
    endpoints = deployer.deploy_nim_models()
    
    print("\nDeployment completed!")
    print("Endpoints created:")
    for model_type, endpoint_arn in endpoints.items():
        print(f"  {model_type}: {endpoint_arn}")

if __name__ == "__main__":
    main()