#!/usr/bin/env python3
"""
Integration script for connecting SageMaker endpoints with Bedrock agents and Lambda functions
Provides seamless integration between NVIDIA NIM models and existing AWS services
"""

import boto3
import json
import os
from typing import Dict, List, Any, Optional

class BedrockLambdaIntegrator:
    def __init__(self, region: str = 'us-west-2'):
        self.region = region
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.bedrock_agent = boto3.client('bedrock-agent', region_name=region)
        self.sagemaker_runtime = boto3.client('sagemaker-runtime', region_name=region)
        self.iam = boto3.client('iam', region_name=region)
        
    def create_sagemaker_integration_layer(self, function_name: str) -> str:
        """Create Lambda layer for SageMaker integration utilities"""
        
        # Create deployment package with integration utilities
        layer_code = '''
import boto3
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class SageMakerNIMClient:
    def __init__(self, region: str = 'us-west-2'):
        self.sagemaker_runtime = boto3.client('sagemaker-runtime', region_name=region)
        self.llama_endpoint = os.environ.get('LLAMA_ENDPOINT_NAME', 'nvidia-nim-llama-endpoint')
        self.embedding_endpoint = os.environ.get('EMBEDDING_ENDPOINT_NAME', 'nvidia-nim-embedding-endpoint')
    
    def chat_completion(self, messages: List[Dict], **kwargs) -> Dict[str, Any]:
        """Send chat completion request to SageMaker endpoint"""
        payload = {
            'messages': messages,
            'temperature': kwargs.get('temperature', 0.7),
            'max_tokens': kwargs.get('max_tokens', 1024),
            'top_p': kwargs.get('top_p', 0.9),
            'stream': kwargs.get('stream', False)
        }
        
        try:
            response = self.sagemaker_runtime.invoke_endpoint(
                EndpointName=self.llama_endpoint,
                ContentType='application/json',
                Body=json.dumps(payload)
            )
            
            result = json.loads(response['Body'].read().decode())
            return result
            
        except Exception as e:
            logger.error(f"Error calling SageMaker endpoint: {str(e)}")
            raise
    
    def generate_embeddings(self, texts: List[str], **kwargs) -> Dict[str, Any]:
        """Generate embeddings using SageMaker endpoint"""
        payload = {
            'input': texts,
            'model': kwargs.get('model', 'nvidia-nv-embedqa-e5-v5')
        }
        
        try:
            response = self.sagemaker_runtime.invoke_endpoint(
                EndpointName=self.embedding_endpoint,
                ContentType='application/json',
                Body=json.dumps(payload)
            )
            
            result = json.loads(response['Body'].read().decode())
            return result
            
        except Exception as e:
            logger.error(f"Error calling embedding endpoint: {str(e)}")
            raise
'''
        
        # Create layer zip file (simplified for example)
        layer_arn = self._create_lambda_layer('sagemaker-nim-integration', layer_code)
        return layer_arn
    
    def update_lambda_function(self, function_name: str, layer_arn: str) -> bool:
        """Update existing Lambda function to use SageMaker integration layer"""
        
        try:
            # Get current function configuration
            function_config = self.lambda_client.get_function_configuration(
                FunctionName=function_name
            )
            
            # Add layer to existing layers
            current_layers = function_config.get('Layers', [])
            layer_arns = [layer['Arn'] for layer in current_layers]
            
            if layer_arn not in layer_arns:
                layer_arns.append(layer_arn)
            
            # Update function configuration
            self.lambda_client.update_function_configuration(
                FunctionName=function_name,
                Layers=layer_arns,
                Environment={
                    'Variables': {
                        **function_config.get('Environment', {}).get('Variables', {}),
                        'LLAMA_ENDPOINT_NAME': 'nvidia-nim-llama-endpoint',
                        'EMBEDDING_ENDPOINT_NAME': 'nvidia-nim-embedding-endpoint',
                        'SAGEMAKER_REGION': self.region
                    }
                }
            )
            
            print(f"Updated Lambda function {function_name} with SageMaker integration")
            return True
            
        except Exception as e:
            print(f"Error updating Lambda function: {str(e)}")
            return False
    
    def create_bedrock_agent_action_group(self, agent_id: str, agent_version: str) -> str:
        """Create action group for Bedrock agent to use SageMaker endpoints"""
        
        action_group_name = "nvidia-nim-actions"
        
        # Define action group schema
        api_schema = {
            "openapi": "3.0.0",
            "info": {
                "title": "NVIDIA NIM Actions API",
                "version": "1.0.0",
                "description": "Actions for interacting with NVIDIA NIM models via SageMaker"
            },
            "paths": {
                "/chat/completions": {
                    "post": {
                        "summary": "Generate chat completion using NVIDIA NIM LLaMA model",
                        "operationId": "chatCompletion",
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "messages": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "role": {"type": "string"},
                                                        "content": {"type": "string"}
                                                    }
                                                }
                                            },
                                            "temperature": {"type": "number", "default": 0.7},
                                            "max_tokens": {"type": "integer", "default": 1024}
                                        },
                                        "required": ["messages"]
                                    }
                                }
                            }
                        },
                        "responses": {
                            "200": {
                                "description": "Successful response",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "choices": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "message": {
                                                                "type": "object",
                                                                "properties": {
                                                                    "role": {"type": "string"},
                                                                    "content": {"type": "string"}
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/embeddings": {
                    "post": {
                        "summary": "Generate embeddings using NVIDIA NIM embedding model",
                        "operationId": "generateEmbeddings",
                        "requestBody": {
                            "required": True,
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "input": {
                                                "type": "array",
                                                "items": {"type": "string"}
                                            }
                                        },
                                        "required": ["input"]
                                    }
                                }
                            }
                        },
                        "responses": {
                            "200": {
                                "description": "Successful response",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "data": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object",
                                                        "properties": {
                                                            "embedding": {
                                                                "type": "array",
                                                                "items": {"type": "number"}
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        try:
            # Create action group
            response = self.bedrock_agent.create_agent_action_group(
                agentId=agent_id,
                agentVersion=agent_version,
                actionGroupName=action_group_name,
                description="Actions for NVIDIA NIM model integration",
                actionGroupExecutor={
                    'lambda': {
                        'lambdaArn': f'arn:aws:lambda:{self.region}:*:function:nvidia-nim-bedrock-integration'
                    }
                },
                apiSchema={
                    'payload': json.dumps(api_schema)
                },
                actionGroupState='ENABLED'
            )
            
            return response['agentActionGroup']['actionGroupId']
            
        except Exception as e:
            print(f"Error creating Bedrock agent action group: {str(e)}")
            raise
    
    def create_integration_lambda(self, function_name: str = 'nvidia-nim-bedrock-integration') -> str:
        """Create Lambda function for Bedrock-SageMaker integration"""
        
        # Lambda function code
        lambda_code = '''
import json
import boto3
import os
from typing import Dict, Any

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Handle Bedrock agent requests and route to SageMaker endpoints"""
    
    try:
        # Parse the event
        action_group = event.get('actionGroup', '')
        api_path = event.get('apiPath', '')
        http_method = event.get('httpMethod', '')
        request_body = event.get('requestBody', {})
        
        # Initialize SageMaker runtime client
        sagemaker_runtime = boto3.client('sagemaker-runtime')
        
        if api_path == '/chat/completions' and http_method == 'POST':
            return handle_chat_completion(sagemaker_runtime, request_body)
        elif api_path == '/embeddings' and http_method == 'POST':
            return handle_embeddings(sagemaker_runtime, request_body)
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Unsupported action'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_chat_completion(sagemaker_runtime, request_body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle chat completion requests"""
    
    endpoint_name = os.environ.get('LLAMA_ENDPOINT_NAME', 'nvidia-nim-llama-endpoint')
    
    try:
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=json.dumps(request_body)
        )
        
        result = json.loads(response['Body'].read().decode())
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'SageMaker invocation failed: {str(e)}'})
        }

def handle_embeddings(sagemaker_runtime, request_body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle embedding generation requests"""
    
    endpoint_name = os.environ.get('EMBEDDING_ENDPOINT_NAME', 'nvidia-nim-embedding-endpoint')
    
    try:
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=json.dumps(request_body)
        )
        
        result = json.loads(response['Body'].read().decode())
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'SageMaker invocation failed: {str(e)}'})
        }
'''
        
        # Create execution role
        role_arn = self._create_lambda_execution_role(f'{function_name}-role')
        
        # Create Lambda function
        try:
            response = self.lambda_client.create_function(
                FunctionName=function_name,
                Runtime='python3.9',
                Role=role_arn,
                Handler='index.lambda_handler',
                Code={'ZipFile': lambda_code.encode()},
                Description='Integration layer between Bedrock agents and NVIDIA NIM SageMaker endpoints',
                Timeout=300,
                MemorySize=512,
                Environment={
                    'Variables': {
                        'LLAMA_ENDPOINT_NAME': 'nvidia-nim-llama-endpoint',
                        'EMBEDDING_ENDPOINT_NAME': 'nvidia-nim-embedding-endpoint'
                    }
                },
                Tags={
                    'Project': 'nvidia-nim-platform',
                    'Environment': 'production'
                }
            )
            
            return response['FunctionArn']
            
        except Exception as e:
            print(f"Error creating integration Lambda function: {str(e)}")
            raise
    
    def _create_lambda_layer(self, layer_name: str, code: str) -> str:
        """Create Lambda layer (simplified implementation)"""
        # In a real implementation, this would create a proper zip file
        # For now, return a placeholder ARN
        return f"arn:aws:lambda:{self.region}:*:layer:{layer_name}:1"
    
    def _create_lambda_execution_role(self, role_name: str) -> str:
        """Create IAM execution role for Lambda function"""
        
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        try:
            response = self.iam.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description='Execution role for NVIDIA NIM Bedrock integration Lambda'
            )
            
            # Attach required policies
            policies = [
                'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                'arn:aws:iam::aws:policy/AmazonSageMakerReadOnly'
            ]
            
            for policy in policies:
                self.iam.attach_role_policy(
                    RoleName=role_name,
                    PolicyArn=policy
                )
            
            # Add custom policy for SageMaker invoke endpoint
            custom_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sagemaker:InvokeEndpoint"
                        ],
                        "Resource": [
                            f"arn:aws:sagemaker:{self.region}:*:endpoint/nvidia-nim-*"
                        ]
                    }
                ]
            }
            
            self.iam.put_role_policy(
                RoleName=role_name,
                PolicyName='SageMakerInvokeEndpoint',
                PolicyDocument=json.dumps(custom_policy)
            )
            
            return response['Role']['Arn']
            
        except self.iam.exceptions.EntityAlreadyExistsException:
            response = self.iam.get_role(RoleName=role_name)
            return response['Role']['Arn']

def main():
    """Setup complete Bedrock-Lambda-SageMaker integration"""
    integrator = BedrockLambdaIntegrator()
    
    # Create integration Lambda function
    lambda_arn = integrator.create_integration_lambda()
    print(f"Created integration Lambda: {lambda_arn}")
    
    # Create SageMaker integration layer
    layer_arn = integrator.create_sagemaker_integration_layer('sagemaker-nim-integration')
    print(f"Created integration layer: {layer_arn}")
    
    # Update existing Lambda functions (example)
    existing_functions = ['vibe-pm-agent-dev']  # Add your existing function names
    
    for function_name in existing_functions:
        try:
            success = integrator.update_lambda_function(function_name, layer_arn)
            if success:
                print(f"Updated {function_name} with SageMaker integration")
        except Exception as e:
            print(f"Could not update {function_name}: {str(e)}")

if __name__ == "__main__":
    main()