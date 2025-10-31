#!/usr/bin/env python3
"""
A/B Testing configuration for NVIDIA NIM SageMaker endpoints
Implements traffic splitting and performance monitoring
"""

import boto3
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

class NIMABTestingManager:
    def __init__(self, region: str = 'us-west-2'):
        self.region = region
        self.sagemaker = boto3.client('sagemaker', region_name=region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=region)
        
    def create_ab_endpoint_config(self, config_name: str, model_variants: List[Dict]) -> str:
        """Create endpoint configuration with multiple model variants for A/B testing"""
        
        production_variants = []
        total_weight = sum(variant['weight'] for variant in model_variants)
        
        for i, variant in enumerate(model_variants):
            production_variants.append({
                'VariantName': variant['name'],
                'ModelName': variant['model_name'],
                'InitialInstanceCount': variant.get('instance_count', 1),
                'InstanceType': variant.get('instance_type', 'ml.g5.xlarge'),
                'InitialVariantWeight': variant['weight'] / total_weight,
                'AcceleratorType': variant.get('accelerator_type', 'ml.eia2.medium')
            })
        
        try:
            response = self.sagemaker.create_endpoint_config(
                EndpointConfigName=config_name,
                ProductionVariants=production_variants,
                DataCaptureConfig={
                    'EnableCapture': True,
                    'InitialSamplingPercentage': 100,
                    'DestinationS3Uri': f's3://nvidia-nim-data-capture/{config_name}/',
                    'CaptureOptions': [
                        {'CaptureMode': 'Input'},
                        {'CaptureMode': 'Output'}
                    ],
                    'CaptureContentTypeHeader': {
                        'CsvContentTypes': ['text/csv'],
                        'JsonContentTypes': ['application/json']
                    }
                },
                Tags=[
                    {'Key': 'Project', 'Value': 'nvidia-nim-platform'},
                    {'Key': 'Environment', 'Value': 'production'},
                    {'Key': 'TestType', 'Value': 'ab-testing'}
                ]
            )
            return response['EndpointConfigArn']
            
        except Exception as e:
            print(f"Error creating A/B testing endpoint config: {str(e)}")
            raise
    
    def update_traffic_distribution(self, endpoint_name: str, 
                                  traffic_distribution: Dict[str, float]) -> bool:
        """Update traffic distribution between variants"""
        
        try:
            # Get current endpoint configuration
            endpoint_info = self.sagemaker.describe_endpoint(EndpointName=endpoint_name)
            current_config = endpoint_info['EndpointConfigName']
            
            # Create new configuration with updated weights
            new_config_name = f"{current_config}-{int(time.time())}"
            
            # Get current configuration details
            config_info = self.sagemaker.describe_endpoint_config(
                EndpointConfigName=current_config
            )
            
            # Update variant weights
            production_variants = []
            for variant in config_info['ProductionVariants']:
                variant_name = variant['VariantName']
                new_weight = traffic_distribution.get(variant_name, variant['InitialVariantWeight'])
                
                production_variants.append({
                    'VariantName': variant_name,
                    'ModelName': variant['ModelName'],
                    'InitialInstanceCount': variant['InitialInstanceCount'],
                    'InstanceType': variant['InstanceType'],
                    'InitialVariantWeight': new_weight
                })
            
            # Create new endpoint configuration
            self.sagemaker.create_endpoint_config(
                EndpointConfigName=new_config_name,
                ProductionVariants=production_variants,
                DataCaptureConfig=config_info.get('DataCaptureConfig', {}),
                Tags=config_info.get('Tags', [])
            )
            
            # Update endpoint to use new configuration
            self.sagemaker.update_endpoint(
                EndpointName=endpoint_name,
                EndpointConfigName=new_config_name
            )
            
            print(f"Updated traffic distribution for endpoint {endpoint_name}")
            return True
            
        except Exception as e:
            print(f"Error updating traffic distribution: {str(e)}")
            return False
    
    def get_variant_metrics(self, endpoint_name: str, variant_name: str, 
                          hours: int = 24) -> Dict[str, float]:
        """Get performance metrics for a specific variant"""
        
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        metrics = {}
        
        # Define metrics to collect
        metric_queries = [
            ('Invocations', 'Sum'),
            ('InvocationErrors', 'Sum'),
            ('ModelLatency', 'Average'),
            ('OverheadLatency', 'Average')
        ]
        
        for metric_name, statistic in metric_queries:
            try:
                response = self.cloudwatch.get_metric_statistics(
                    Namespace='AWS/SageMaker',
                    MetricName=metric_name,
                    Dimensions=[
                        {'Name': 'EndpointName', 'Value': endpoint_name},
                        {'Name': 'VariantName', 'Value': variant_name}
                    ],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=3600,  # 1 hour periods
                    Statistics=[statistic]
                )
                
                if response['Datapoints']:
                    if statistic == 'Sum':
                        metrics[metric_name] = sum(dp[statistic] for dp in response['Datapoints'])
                    else:
                        metrics[metric_name] = sum(dp[statistic] for dp in response['Datapoints']) / len(response['Datapoints'])
                else:
                    metrics[metric_name] = 0.0
                    
            except Exception as e:
                print(f"Error getting metric {metric_name}: {str(e)}")
                metrics[metric_name] = 0.0
        
        # Calculate derived metrics
        if metrics['Invocations'] > 0:
            metrics['ErrorRate'] = metrics['InvocationErrors'] / metrics['Invocations'] * 100
        else:
            metrics['ErrorRate'] = 0.0
        
        return metrics
    
    def compare_variants(self, endpoint_name: str, variant_names: List[str], 
                        hours: int = 24) -> Dict[str, Dict[str, float]]:
        """Compare performance metrics between variants"""
        
        comparison = {}
        
        for variant_name in variant_names:
            comparison[variant_name] = self.get_variant_metrics(endpoint_name, variant_name, hours)
        
        return comparison
    
    def auto_optimize_traffic(self, endpoint_name: str, variant_names: List[str],
                            optimization_metric: str = 'ModelLatency',
                            min_traffic_percent: float = 10.0) -> bool:
        """Automatically optimize traffic distribution based on performance metrics"""
        
        # Get metrics for all variants
        variant_metrics = self.compare_variants(endpoint_name, variant_names)
        
        # Determine best performing variant
        best_variant = None
        best_score = float('inf') if optimization_metric in ['ModelLatency', 'ErrorRate'] else 0
        
        for variant_name, metrics in variant_metrics.items():
            score = metrics.get(optimization_metric, 0)
            
            if optimization_metric in ['ModelLatency', 'ErrorRate']:
                if score < best_score:
                    best_score = score
                    best_variant = variant_name
            else:  # Higher is better (e.g., Invocations)
                if score > best_score:
                    best_score = score
                    best_variant = variant_name
        
        if not best_variant:
            print("Could not determine best variant")
            return False
        
        # Calculate new traffic distribution
        new_distribution = {}
        remaining_traffic = 100.0 - min_traffic_percent * (len(variant_names) - 1)
        
        for variant_name in variant_names:
            if variant_name == best_variant:
                new_distribution[variant_name] = remaining_traffic
            else:
                new_distribution[variant_name] = min_traffic_percent
        
        # Update traffic distribution
        return self.update_traffic_distribution(endpoint_name, new_distribution)
    
    def setup_ab_test(self, test_name: str, model_variants: List[Dict]) -> str:
        """Set up complete A/B test with monitoring"""
        
        # Create A/B testing endpoint configuration
        config_name = f"{test_name}-ab-config-{int(time.time())}"
        config_arn = self.create_ab_endpoint_config(config_name, model_variants)
        
        # Create endpoint
        endpoint_name = f"{test_name}-ab-endpoint"
        
        try:
            self.sagemaker.create_endpoint(
                EndpointName=endpoint_name,
                EndpointConfigName=config_name,
                Tags=[
                    {'Key': 'Project', 'Value': 'nvidia-nim-platform'},
                    {'Key': 'TestName', 'Value': test_name},
                    {'Key': 'TestType', 'Value': 'ab-testing'}
                ]
            )
            
            print(f"A/B test setup initiated for {test_name}")
            print(f"Endpoint: {endpoint_name}")
            print(f"Configuration: {config_name}")
            
            return endpoint_name
            
        except Exception as e:
            print(f"Error setting up A/B test: {str(e)}")
            raise

def main():
    """Example A/B test setup"""
    ab_manager = NIMABTestingManager()
    
    # Define model variants for testing
    model_variants = [
        {
            'name': 'variant-a',
            'model_name': 'nvidia-nim-llama-v1',
            'weight': 50.0,
            'instance_count': 2,
            'instance_type': 'ml.g5.xlarge'
        },
        {
            'name': 'variant-b',
            'model_name': 'nvidia-nim-llama-v2',
            'weight': 50.0,
            'instance_count': 2,
            'instance_type': 'ml.g5.xlarge'
        }
    ]
    
    # Setup A/B test
    endpoint_name = ab_manager.setup_ab_test('nim-llama-performance-test', model_variants)
    
    print(f"A/B test endpoint created: {endpoint_name}")

if __name__ == "__main__":
    main()