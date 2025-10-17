#!/bin/bash

# Update existing Bedrock agents with full tool sets (8 tools each)

set -e

# Configuration
REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-lambda"

echo "🚀 Updating Vibe PM Agents to Full Versions (8 tools each)..."
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

# Agent 1: Business Strategy Agent - Full 8 tools
echo "🎯 Updating Business Strategy Agent (8 tools)..."
update_agent_action_group \
    "IBQRX8MZJJ" \
    "I9YQ4NNDIC" \
    "business-strategy-tools" \
    '{
        "functions": [
            {
                "name": "analyze_business_opportunity",
                "description": "Analyzes market opportunity, timing, and business justification for a feature idea",
                "parameters": {
                    "idea": {
                        "description": "Raw feature idea or business need",
                        "type": "string",
                        "required": true
                    },
                    "market_context": {
                        "description": "Market and business context information as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "generate_business_case",
                "description": "Creates comprehensive business case with ROI analysis, risk assessment, and strategic alignment",
                "parameters": {
                    "opportunity_analysis": {
                        "description": "Business opportunity analysis",
                        "type": "string",
                        "required": true
                    },
                    "financial_inputs": {
                        "description": "Financial inputs as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "assess_strategic_alignment",
                "description": "Evaluates how a feature aligns with company strategy, OKRs, and long-term vision",
                "parameters": {
                    "feature_concept": {
                        "description": "Feature concept or business case",
                        "type": "string",
                        "required": true
                    },
                    "company_context": {
                        "description": "Company context as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "validate_market_timing",
                "description": "Fast validation of whether now is the right time to build a feature based on market conditions",
                "parameters": {
                    "feature_idea": {
                        "description": "Feature idea to validate timing for",
                        "type": "string",
                        "required": true
                    },
                    "market_signals": {
                        "description": "Market signals as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "validate_idea_quick",
                "description": "Performs quick validation of business ideas against criteria",
                "parameters": {
                    "idea": {
                        "description": "Idea to validate quickly",
                        "type": "string",
                        "required": true
                    },
                    "criteria": {
                        "description": "Validation criteria as JSON array string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "analyze_competitor_landscape",
                "description": "Analyzes competitive landscape and market positioning",
                "parameters": {
                    "market_segment": {
                        "description": "Market segment to analyze",
                        "type": "string",
                        "required": true
                    },
                    "competitors": {
                        "description": "List of competitors as JSON array string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "calculate_market_sizing",
                "description": "Calculates market sizing using TAM-SAM-SOM methodology",
                "parameters": {
                    "market": {
                        "description": "Market to size",
                        "type": "string",
                        "required": true
                    },
                    "methodology": {
                        "description": "Sizing methodology",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "monitor_market_conditions",
                "description": "Monitors and analyzes current market conditions and trends",
                "parameters": {
                    "market": {
                        "description": "Market to monitor",
                        "type": "string",
                        "required": true
                    },
                    "indicators": {
                        "description": "Key indicators as JSON array string",
                        "type": "string",
                        "required": false
                    }
                }
            }
        ]
    }'

# Agent 2: Product Development Agent - Full 8 tools
echo "🛠️ Updating Product Development Agent (8 tools)..."
update_agent_action_group \
    "CEW45LTT2P" \
    "5HJHKYFAVC" \
    "product-development-tools" \
    '{
        "functions": [
            {
                "name": "generate_requirements",
                "description": "Generates comprehensive requirements document from feature ideas",
                "parameters": {
                    "feature_idea": {
                        "description": "Feature idea to generate requirements for",
                        "type": "string",
                        "required": true
                    },
                    "context": {
                        "description": "Additional context information as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "generate_design_options",
                "description": "Creates multiple design options and architectural approaches",
                "parameters": {
                    "requirements": {
                        "description": "Requirements document",
                        "type": "string",
                        "required": true
                    },
                    "constraints": {
                        "description": "Design constraints as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "generate_task_plan",
                "description": "Creates detailed implementation task plan from design documents",
                "parameters": {
                    "design": {
                        "description": "Design document",
                        "type": "string",
                        "required": true
                    },
                    "requirements": {
                        "description": "Requirements document",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "optimize_resource_allocation",
                "description": "Analyzes resource requirements and provides optimization recommendations",
                "parameters": {
                    "current_workflow": {
                        "description": "Current development workflow as JSON string",
                        "type": "string",
                        "required": true
                    },
                    "resource_constraints": {
                        "description": "Resource constraints as JSON string",
                        "type": "string",
                        "required": false
                    },
                    "optimization_goals": {
                        "description": "Optimization goals as JSON array string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "optimize_intent",
                "description": "Optimizes user intent for better clarity and actionability",
                "parameters": {
                    "user_intent": {
                        "description": "User intent to optimize",
                        "type": "string",
                        "required": true
                    },
                    "context": {
                        "description": "Context information as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "analyze_workflow",
                "description": "Analyzes workflows for optimization opportunities",
                "parameters": {
                    "workflow_description": {
                        "description": "Workflow to analyze",
                        "type": "string",
                        "required": true
                    },
                    "optimization_goals": {
                        "description": "Optimization goals as JSON array string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "enhance_citations",
                "description": "Enhances content with authoritative citations and source validation",
                "parameters": {
                    "content": {
                        "description": "Content to enhance with citations",
                        "type": "string",
                        "required": true
                    },
                    "sources": {
                        "description": "Source materials as JSON array string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "validate_and_audit_citations",
                "description": "Validates and audits citations for accuracy and credibility",
                "parameters": {
                    "content": {
                        "description": "Content with citations to validate",
                        "type": "string",
                        "required": true
                    },
                    "strict_mode": {
                        "description": "Enable strict validation (true/false)",
                        "type": "boolean",
                        "required": false
                    }
                }
            }
        ]
    }'

# Agent 3: Executive Communications Agent - Full 8 tools
echo "📊 Updating Executive Communications Agent (8 tools)..."
update_agent_action_group \
    "ULX1RJGKCR" \
    "LYFVHLFCMW" \
    "executive-communications-tools" \
    '{
        "functions": [
            {
                "name": "create_stakeholder_communication",
                "description": "Generates executive one-pagers, PR-FAQs, and stakeholder presentations",
                "parameters": {
                    "business_case": {
                        "description": "Business case analysis",
                        "type": "string",
                        "required": true
                    },
                    "communication_type": {
                        "description": "Type of communication (executive_onepager, pr_faq, board_presentation, team_announcement)",
                        "type": "string",
                        "required": true
                    },
                    "audience": {
                        "description": "Target audience (executives, board, engineering_team, customers, investors)",
                        "type": "string",
                        "required": true
                    }
                }
            },
            {
                "name": "generate_management_onepager",
                "description": "Creates executive one-pager for management presentation",
                "parameters": {
                    "project_info": {
                        "description": "Project information to include in the one-pager",
                        "type": "string",
                        "required": true
                    },
                    "audience": {
                        "description": "Target audience for the presentation",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "generate_pr_faq",
                "description": "Generates PR-FAQ document using Amazon Working Backwards methodology",
                "parameters": {
                    "product_info": {
                        "description": "Product information",
                        "type": "string",
                        "required": true
                    },
                    "target_audience": {
                        "description": "Target audience",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "get_consulting_summary",
                "description": "Creates consulting-style executive summary from analysis data",
                "parameters": {
                    "analysis_data": {
                        "description": "Analysis data to summarize",
                        "type": "string",
                        "required": true
                    },
                    "summary_type": {
                        "description": "Type of summary needed",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "generate_roi_analysis",
                "description": "Generates comprehensive ROI analysis with financial projections",
                "parameters": {
                    "investment": {
                        "description": "Investment amount",
                        "type": "number",
                        "required": true
                    },
                    "expected_returns": {
                        "description": "Expected returns as JSON string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "get_company_interview_insights",
                "description": "Provides comprehensive company-specific interview insights and preparation guidance",
                "parameters": {
                    "company_name": {
                        "description": "Name of the target company",
                        "type": "string",
                        "required": true
                    },
                    "role_level": {
                        "description": "Target role level (APM, PM, Senior PM, Principal PM)",
                        "type": "string",
                        "required": true
                    },
                    "focus_areas": {
                        "description": "Specific areas to focus insights on as JSON array string",
                        "type": "string",
                        "required": false
                    },
                    "include_recent_changes": {
                        "description": "Include recent company developments (true/false)",
                        "type": "boolean",
                        "required": false
                    }
                }
            },
            {
                "name": "customize_preparation_for_company",
                "description": "Creates personalized interview preparation plan tailored to specific company and role",
                "parameters": {
                    "company_name": {
                        "description": "Target company name",
                        "type": "string",
                        "required": true
                    },
                    "role_level": {
                        "description": "Target role level (APM, PM, Senior PM, Principal PM)",
                        "type": "string",
                        "required": true
                    },
                    "preparation_timeline": {
                        "description": "Available preparation time (e.g., 2 weeks, 1 month)",
                        "type": "string",
                        "required": true
                    },
                    "experience_background": {
                        "description": "Candidate relevant experience and background",
                        "type": "string",
                        "required": false
                    },
                    "weak_areas": {
                        "description": "Areas needing focused improvement as JSON array string",
                        "type": "string",
                        "required": false
                    }
                }
            },
            {
                "name": "get_company_case_scenarios",
                "description": "Generates company-specific case study scenarios based on real business challenges",
                "parameters": {
                    "company_name": {
                        "description": "Target company name",
                        "type": "string",
                        "required": true
                    },
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
                        "description": "Scenario difficulty from 1 (easy) to 5 (hard)",
                        "type": "integer",
                        "required": false
                    },
                    "use_real_products": {
                        "description": "Base scenarios on actual company products (true/false)",
                        "type": "boolean",
                        "required": false
                    }
                }
            }
        ]
    }'

# Agent 4: Interview Coaching Agent - Full 8 tools
echo "🎓 Updating Interview Coaching Agent (8 tools)..."
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
                    "focus_areas": {
                        "description": "Specific areas to focus on as JSON array string",
                        "type": "string",
                        "required": false
                    },
                    "weak_areas": {
                        "description": "Areas needing improvement as JSON array string",
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
                    "evaluation_focus": {
                        "description": "Specific evaluation criteria as JSON array string",
                        "type": "string",
                        "required": false
                    },
                    "company_context": {
                        "description": "Company context for evaluation",
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
                    "include_detailed_analysis": {
                        "description": "Include detailed performance breakdown (true/false)",
                        "type": "boolean",
                        "required": false
                    },
                    "include_study_plan": {
                        "description": "Include personalized study recommendations (true/false)",
                        "type": "boolean",
                        "required": false
                    },
                    "focus_on_improvements": {
                        "description": "Focus feedback on areas needing improvement (true/false)",
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
                    },
                    "company_style": {
                        "description": "Company interview style to emulate",
                        "type": "string",
                        "required": false
                    },
                    "time_limit": {
                        "description": "Time limit in minutes",
                        "type": "integer",
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
                    "frameworks_used": {
                        "description": "PM frameworks applied as JSON array string",
                        "type": "string",
                        "required": false
                    },
                    "request_detailed_feedback": {
                        "description": "Request comprehensive feedback (true/false)",
                        "type": "boolean",
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
                    },
                    "include_recommendations": {
                        "description": "Include personalized study and practice recommendations (true/false)",
                        "type": "boolean",
                        "required": false
                    }
                }
            }
        ]
    }'

echo ""
echo "🎉 All Agents Updated to Full Versions!"
echo "===================================="
echo ""
echo "📋 Update Summary:"
echo "- Business Strategy Agent: 8 tools (market analysis, competitive intelligence)"
echo "- Product Development Agent: 8 tools (requirements, design, optimization)"
echo "- Executive Communications Agent: 8 tools (stakeholder docs, presentations)"
echo "- Interview Coaching Agent: 8 tools (PM interview prep, case studies)"
echo ""
echo "📊 Total Tools: 32 (8 per agent)"
echo "🤖 All agents prepared and ready for production use"
echo ""
echo "🔧 Next Steps:"
echo "1. Test agents with full tool sets"
echo "2. Create agent orchestrator for multi-agent workflows"
echo "3. Deploy to production environment"
echo ""
echo "✅ Full Agent Update Complete!"