#!/bin/bash

# Update existing Bedrock agents with full tool sets (8 tools each) - Fixed for parameter limits

set -e

# Configuration
REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-lambda"

echo "🚀 Updating Vibe PM Agents to Full Versions (8 tools each) - Fixed..."
echo "Region: $REGION"
echo "Lambda ARN: $LAMBDA_ARN"
echo ""

# Function to update agent action group with full tool set
update_agent_action_group() {
    local agent_id=$1
    local action_group_id=$2
    local action_group_name=$3
    local tools_json=$4
    
    echo "Updating action group: $action_group_name for agent: $agent_id"
    
    # Update the action group with full tools
    aws bedrock-agent update-agent-action-group \
        --region $REGION \
        --agent-id "$agent_id" \
        --agent-version "DRAFT" \
        --action-group-id "$action_group_id" \
        --action-group-name "$action_group_name" \
        --description "Full action group for $action_group_name with 8 specialized MCP tools" \
        --action-group-executor lambda="$LAMBDA_ARN" \
        --function-schema "$tools_json" \
        --output json > /dev/null
    
    echo "✅ Action group updated: $action_group_name"
    
    # Prepare the agent
    echo "Preparing agent..."
    aws bedrock-agent prepare-agent \
        --region $REGION \
        --agent-id "$agent_id" \
        --output json > /dev/null
    
    echo "✅ Agent prepared successfully"
    echo ""
}

# Agent 4: Interview Coaching Agent - Full 8 tools (Fixed parameter limits)
echo "🎓 Updating Interview Coaching Agent (8 tools) - Fixed..."
update_agent_action_group \
    "PDZPQTNLYH" \
    "UEPTV7JEJK" \
    "interview-coaching-tools" \
    '{
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
                    },
                    "additional_context": {
                        "description": "Additional context including focus areas and weak areas as JSON string",
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
                    },
                    "session_id": {
                        "description": "Interview preparation session ID",
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
                    "evaluation_context": {
                        "description": "Evaluation context including focus areas and company context as JSON string",
                        "type": "string",
                        "required": false
                    },
                    "session_id": {
                        "description": "Interview preparation session ID",
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
                    "feedback_options": {
                        "description": "Feedback options as JSON string (detailed_analysis, study_plan, focus_on_improvements)",
                        "type": "string",
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
                    "case_context": {
                        "description": "Case context including industry, company style, and time limit as JSON string",
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
                    },
                    "user_progress": {
                        "description": "Summary of progress so far",
                        "type": "string",
                        "required": false
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
                    "evaluation_options": {
                        "description": "Evaluation options including frameworks used and feedback level as JSON string",
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
                    "completion_options": {
                        "description": "Completion options including detailed breakdown, analytics, and recommendations as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            }
        ]
    }'

echo ""
echo "🎉 Interview Coaching Agent Updated to Full Version!"
echo "===================================="
echo ""
echo "📋 Update Summary:"
echo "- Interview Coaching Agent: 8 tools (PM interview prep, case studies)"
echo "- All parameters optimized to stay within AWS limits (max 5 per function)"
echo ""
echo "📊 Total Tools: 32 (8 per agent)"
echo "🤖 All agents prepared and ready for production use"
echo ""
echo "✅ Full Agent Update Complete!"