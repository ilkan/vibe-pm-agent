#!/usr/bin/env python3
"""
Lambda Integration Module for Vibe PM Agent
Provides integration between Bedrock AgentCore and AWS Lambda deployment
Supports calling Lambda functions for all 32 PM tools
"""

import json
import os
import boto3
import base64
from typing import Dict, Any, Optional
from dataclasses import dataclass
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize AWS Powertools
logger = Logger()
tracer = Tracer()


@dataclass
class LambdaConfig:
    """Configuration for Lambda integration"""
    function_name: str
    region: str = "us-east-1"
    timeout: int = 300
    api_gateway_url: Optional[str] = None


class LambdaIntegrationClient:
    """Client for calling Lambda functions through API Gateway"""

    def __init__(self, config: LambdaConfig):
        self.config = config
        self.lambda_client = boto3.client('lambda', region_name=config.region)
        self.function_name = config.function_name

    async def call_lambda_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a Lambda function tool through direct invocation
        """
        try:
            payload = {
                "toolName": tool_name,
                "toolArgs": tool_args
            }

            logger.info(f"Calling Lambda tool: {tool_name}", extra={
                "tool_name": tool_name,
                "tool_args": tool_args
            })

            response = self.lambda_client.invoke(
                FunctionName=self.function_name,
                Payload=json.dumps(payload),
                LogType='Tail'
            )

            # Parse response
            response_payload = json.loads(response['Payload'].read())

            if response.get('LogResult'):
                # Decode and log execution logs
                logs = base64.b64decode(response['LogResult']).decode('utf-8')
                logger.info(f"Lambda execution logs: {logs}")

            logger.info(f"Lambda tool call completed: {tool_name}", extra={
                "tool_name": tool_name,
                "success": response_payload.get("success", False)
            })

            return response_payload

        except Exception as e:
            logger.error(f"Error calling Lambda tool {tool_name}: {str(e)}", extra={
                "tool_name": tool_name,
                "error": str(e)
            })
            return {
                "success": False,
                "error": str(e),
                "toolName": tool_name
            }


class APIGatewayClient:
    """Client for calling Lambda functions through API Gateway"""

    def __init__(self, config: LambdaConfig):
        import aiohttp
        self.config = config
        self.api_url = config.api_gateway_url
        self.session = None

    async def __aenter__(self):
        import aiohttp
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def call_api_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a Lambda function tool through API Gateway
        """
        if not self.session:
            import aiohttp
            self.session = aiohttp.ClientSession()

        try:
            # Construct API endpoint based on tool category
            endpoint = self._get_endpoint_for_tool(tool_name)

            payload = {
                "toolName": tool_name,
                "toolArgs": tool_args
            }

            logger.info(f"Calling API Gateway tool: {tool_name}", extra={
                "tool_name": tool_name,
                "endpoint": endpoint
            })

            async with self.session.post(
                f"{self.api_url}{endpoint}",
                json=payload,
                headers={'Content-Type': 'application/json'}
            ) as response:
                response_data = await response.json()

                logger.info(f"API Gateway tool call completed: {tool_name}", extra={
                    "tool_name": tool_name,
                    "status_code": response.status,
                    "success": response_data.get("success", False)
                })

                return response_data

        except Exception as e:
            logger.error(f"Error calling API Gateway tool {tool_name}: {str(e)}", extra={
                "tool_name": tool_name,
                "error": str(e)
            })
            return {
                "success": False,
                "error": str(e),
                "toolName": tool_name
            }

    def _get_endpoint_for_tool(self, tool_name: str) -> str:
        """Map tool name to API Gateway endpoint"""
        # Map tool categories to API paths
        tool_category_map = {
            # Business Analysis tools
            "analyze_business_opportunity": "/business-analysis/analyze-opportunity",
            "generate_business_case": "/business-analysis/generate-case",
            "assess_strategic_alignment": "/business-analysis/strategic-alignment",
            "optimize_resource_allocation": "/business-analysis/optimize-resources",
            "validate_market_timing": "/business-analysis/validate-timing",
            "validate_idea_quick": "/business-analysis/validate-idea",
            "analyze_competitor_landscape": "/business-analysis/competitor-analysis",
            "calculate_market_sizing": "/business-analysis/market-sizing",

            # Communications tools
            "create_stakeholder_communication": "/communications/stakeholder-communication",
            "generate_management_onepager": "/communications/executive-onepager",
            "generate_pr_faq": "/communications/pr-faq",
            "generate_board_presentation": "/communications/board-presentation",

            # Requirements tools
            "generate_requirements": "/requirements/generate-requirements",
            "generate_design_options": "/requirements/design-options",
            "generate_task_plan": "/requirements/task-plan",
            "generate_roi_analysis": "/requirements/roi-analysis",

            # Market Intelligence tools
            "enhance_citations": "/market-intelligence/enhance-citations",
            "validate_and_audit_citations": "/market-intelligence/validate-citations",
            "monitor_market_conditions": "/market-intelligence/monitor-market",
            "optimize_intent": "/market-intelligence/optimize-intent",

            # Interview Prep tools
            "start_interview_preparation": "/interview-prep/start-session",
            "generate_interview_question": "/interview-prep/generate-question",
            "evaluate_interview_response": "/interview-prep/evaluate-response",
            "get_interview_feedback": "/interview-prep/get-feedback",
            "get_company_interview_insights": "/interview-prep/company-insights",
            "customize_preparation_for_company": "/interview-prep/customize-preparation",

            # Case Studies tools
            "start_case_study": "/case-studies/start-case",
            "get_case_guidance": "/case-studies/get-guidance",
            "evaluate_case_approach": "/case-studies/evaluate-approach",
            "complete_case_study": "/case-studies/complete-case",
            "get_company_case_scenarios": "/case-studies/company-scenarios"
        }

        return tool_category_map.get(tool_name, "/health")


@tracer.capture_method
async def call_lambda_tool(
    tool_name: str,
    tool_args: Dict[str, Any],
    use_api_gateway: bool = True,
    lambda_config: Optional[LambdaConfig] = None
) -> Dict[str, Any]:
    """
    Unified function to call Lambda tools either directly or through API Gateway

    Args:
        tool_name: Name of the tool to call
        tool_args: Arguments for the tool
        use_api_gateway: Whether to use API Gateway (True) or direct Lambda invocation (False)
        lambda_config: Configuration for Lambda integration

    Returns:
        Tool execution result
    """
    if lambda_config is None:
        # Get configuration from environment
        environment = os.getenv("ENVIRONMENT", "dev")
        lambda_config = LambdaConfig(
            function_name=f"{environment}-vibe-pm-agent-lambda",
            region=os.getenv("AWS_REGION", "us-east-1"),
            api_gateway_url=os.getenv("API_GATEWAY_URL")
        )

    try:
        if use_api_gateway and lambda_config.api_gateway_url:
            async with APIGatewayClient(lambda_config) as client:
                return await client.call_api_tool(tool_name, tool_args)
        else:
            client = LambdaIntegrationClient(lambda_config)
            return await client.call_lambda_tool(tool_name, tool_args)

    except Exception as e:
        logger.error(f"Failed to call Lambda tool {tool_name}: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "toolName": tool_name
        }


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    AWS Lambda handler for Bedrock AgentCore integration
    This function serves as a bridge between Bedrock agents and the Lambda-deployed PM tools
    """
    try:
        # Extract tool call from event
        tool_name = event.get("toolName")
        tool_args = event.get("toolArgs", {})

        if not tool_name:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "error": "toolName is required"
                })
            }

        logger.info(f"Lambda handler called for tool: {tool_name}", extra={
            "tool_name": tool_name,
            "tool_args": tool_args,
            "request_id": context.aws_request_id
        })

        # Get integration configuration
        use_api_gateway = os.getenv("USE_API_GATEWAY", "false").lower() == "true"
        environment = os.getenv("ENVIRONMENT", "dev")

        lambda_config = LambdaConfig(
            function_name=f"{environment}-vibe-pm-agent-lambda",
            region=os.getenv("AWS_REGION", "us-east-1"),
            api_gateway_url=os.getenv("API_GATEWAY_URL")
        )

        # Call the tool
        result = asyncio.run(
            call_lambda_tool(tool_name, tool_args, use_api_gateway, lambda_config)
        )

        logger.info(f"Tool execution completed: {tool_name}", extra={
            "tool_name": tool_name,
            "success": result.get("success", False),
            "request_id": context.aws_request_id
        })

        return {
            "statusCode": 200,
            "body": json.dumps(result),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }

    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}", extra={
            "error": str(e),
            "request_id": context.aws_request_id
        })

        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "error": str(e),
                "toolName": event.get("toolName")
            }),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }


# Standalone execution for testing
if __name__ == "__main__":
    # Test the integration
    async def test_integration():
        config = LambdaConfig(
            function_name="dev-vibe-pm-agent-lambda",
            api_gateway_url="https://your-api-gateway-url.amazonaws.com/dev"
        )

        result = await call_lambda_tool(
            "analyze_business_opportunity",
            {"idea": "Test idea"},
            lambda_config=config
        )

        print(f"Test result: {json.dumps(result, indent=2)}")

    asyncio.run(test_integration())
