#!/bin/bash

# Update Interview Coaching Agent only

set -e

# Configuration
REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-lambda"
AGENT_ROLE_ARN="arn:aws:iam::119370291155:role/AmazonBedrockExecutionRoleForAgents_vibe-pm"

echo "🎓 Updating Interview Coaching Agent (8 tools)..."

# Update the action group with full tools
aws bedrock-agent update-agent-action-group \
    --region $REGION \
    --agent-id "PDZPQTNLYH" \
    --agent-version "DRAFT" \
    --action-group-id "UEPTV7JEJK" \
    --action-group-name "interview-coaching-tools" \
    --description "Full action group for interview-coaching-tools with 8 specialized MCP tools" \
    --action-group-executor lambda="$LAMBDA_ARN" \
    --function-schema '{
        "functions": [
            {
                "name": "start_interview_preparation",
                "description": "Initiates a comprehensive PM interview preparation session with personalized coaching",
                "parameters": {
                    "role_level": {
                        "description": "Target PM role level (APM, PM, Senior PM, Principal PM)",
                        "type": "string",
                        "required": true
                    },
                    "target_company": {
                        "description": "Company you are interviewing with",
                        "type": "string",
                        "required": false
                    },
                    "experience_level": {
                        "description": "Years of PM experience",
                        "type": "string",
                        "required": false
                    },
                    "preparation_timeline": {
                        "description": "Available preparation time (e.g., 2 weeks, 1 month)",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "generate_interview_question",
                "description": "Generates realistic PM interview questions based on role level, company, and question type",
                "parameters": {
                    "role_level": {
                        "description": "Target PM role level (APM, PM, Senior PM, Principal PM)",
                        "type": "string",
                        "required": true
                    },
                    "question_category": {
                        "description": "Type of question (behavioral, product_sense, analytical, technical, leadership)",
                        "type": "string",
                        "required": true
                    },
                    "difficulty_level": {
                        "description": "Question difficulty from 1 (easy) to 5 (hard)",
                        "type": "integer",
                        "required": false
                    },
                    "company_context": {
                        "description": "Target company for customization",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "evaluate_interview_response",
                "description": "Evaluates PM interview responses using framework-based analysis and provides detailed feedback",
                "parameters": {
                    "question_id": {
                        "description": "ID of the question being answered",
                        "type": "string",
                        "required": true
                    },
                    "user_response": {
                        "description": "The candidate response to evaluate",
                        "type": "string",
                        "required": true
                    },
                    "evaluation_focus": {
                        "description": "Specific evaluation criteria as JSON array string",
                        "type": "string",
                        "required": false
                    },
                    "company_context": {
                        "description": "Company context for evaluation",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "get_interview_feedback",
                "description": "Provides comprehensive feedback and improvement recommendations based on interview performance",
                "parameters": {
                    "session_id": {
                        "description": "Interview preparation session ID",
                        "type": "string",
                        "required": true
                    },
                    "include_detailed_analysis": {
                        "description": "Include detailed performance breakdown (true/false)",
                        "type": "boolean",
                        "required": false
                    },
                    "include_study_plan": {
                        "description": "Include personalized study recommendations (true/false)",
                        "type": "boolean",
                        "required": false
                    }
                }
            },
            {
                "name": "start_case_study",
                "description": "Initiates a PM case study practice session with realistic business scenarios",
                "parameters": {
                    "case_type": {
                        "description": "Type of case study (product_design, strategy, prioritization, market_entry, growth, monetization)",
                        "type": "string",
                        "required": true
                    },
                    "role_level": {
                        "description": "Target role level (APM, PM, Senior PM, Principal PM)",
                        "type": "string",
                        "required": true
                    },
                    "difficulty_level": {
                        "description": "Case difficulty from 1 (easy) to 5 (hard)",
                        "type": "integer",
                        "required": false
                    },
                    "industry": {
                        "description": "Industry context for the case",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "get_case_guidance",
                "description": "Provides framework-based guidance and hints during case study execution",
                "parameters": {
                    "session_id": {
                        "description": "Case study session ID",
                        "type": "string",
                        "required": true
                    },
                    "current_step": {
                        "description": "Current step or challenge in the case",
                        "type": "string",
                        "required": true
                    },
                    "request_type": {
                        "description": "Type of guidance needed (hint, framework, clarification, next_step)",
                        "type": "string",
                        "required": true
                    }
                }
            },
            {
                "name": "evaluate_case_approach",
                "description": "Evaluates case study approach and provides real-time feedback on methodology and thinking",
                "parameters": {
                    "session_id": {
                        "description": "Case study session ID",
                        "type": "string",
                        "required": true
                    },
                    "step_number": {
                        "description": "Current step number in the case",
                        "type": "integer",
                        "required": true
                    },
                    "user_approach": {
                        "description": "User approach or solution for this step",
                        "type": "string",
                        "required": true
                    },
                    "frameworks_used": {
                        "description": "PM frameworks applied as JSON array string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "complete_case_study",
                "description": "Completes case study session and provides comprehensive evaluation with performance analytics",
                "parameters": {
                    "session_id": {
                        "description": "Case study session ID to complete",
                        "type": "string",
                        "required": true
                    },
                    "include_detailed_breakdown": {
                        "description": "Include step-by-step performance breakdown (true/false)",
                        "type": "boolean",
                        "required": false
                    },
                    "include_performance_analytics": {
                        "description": "Include detailed performance analytics and benchmarking (true/false)",
                        "type": "boolean",
                        "required": false
                    }
                }
            }
        ]
    }' \
    --output json > /dev/null

echo "✅ Action group updated: interview-coaching-tools"

# Prepare the agent
echo "Preparing agent..."
aws bedrock-agent prepare-agent \
    --region $REGION \
    --agent-id "PDZPQTNLYH" \
    --output json > /dev/null

echo "✅ Agent prepared successfully"

# Enable orchestration
echo "🔗 Enabling orchestration for vibe-pm-interview-coaching-agent..."

aws bedrock-agent update-agent \
    --region $REGION \
    --agent-id "PDZPQTNLYH" \
    --agent-name "vibe-pm-interview-coaching-agent" \
    --agent-resource-role-arn "$AGENT_ROLE_ARN" \
    --description "AI-powered PM agent with multi-agent orchestration capabilities for comprehensive business analysis and interview preparation" \
    --foundation-model "anthropic.claude-3-5-sonnet-20241022-v2:0" \
    --instruction "You are a specialized PM agent with orchestration capabilities. You can collaborate with other agents to provide comprehensive solutions. When users request complex analysis that spans multiple domains, coordinate with other agents. Always provide structured, actionable insights with proper citations and confidence scores. Use your specialized tools effectively and suggest when multi-agent collaboration would be beneficial." \
    --output json > /dev/null

echo "✅ Orchestration enabled for vibe-pm-interview-coaching-agent"
echo "🎉 Interview Coaching Agent updated successfully!"