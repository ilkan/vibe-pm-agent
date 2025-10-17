#!/bin/bash

# Fix function names that are too long when combined with action group names

set -e

# Configuration
REGION="us-east-1"
LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-dev"

echo "🔧 Fixing function names for Executive Communications Agent..."
echo ""

# Update Executive Communications Agent with shorter function names
aws bedrock-agent update-agent-action-group \
    --region $REGION \
    --agent-id "ULX1RJGKCR" \
    --agent-version "DRAFT" \
    --action-group-id "LYFVHLFCMW" \
    --action-group-name "executive-communications-tools" \
    --description "Full action group for executive-communications-tools with 8 specialized MCP tools" \
    --action-group-executor lambda="$LAMBDA_ARN" \
    --function-schema '{
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
                "name": "get_company_insights",
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
                    }
                }
            },
            {
                "name": "customize_company_prep",
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
                    }
                }
            },
            {
                "name": "get_case_scenarios",
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
                    }
                }
            }
        ]
    }' \
    --output json > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Executive Communications Agent function names updated"
    
    # Prepare the agent
    echo "Preparing agent..."
    aws bedrock-agent prepare-agent \
        --region $REGION \
        --agent-id "ULX1RJGKCR" \
        --output json > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Agent prepared successfully"
    else
        echo "❌ Failed to prepare agent"
    fi
else
    echo "❌ Failed to update Executive Communications Agent"
fi

echo ""
echo "🎉 Function names fixed for Executive Communications Agent!"
echo ""
echo "🧪 Test the agents with:"
echo "  node test-all-agents-comprehensive.js"