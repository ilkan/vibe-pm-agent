#!/bin/bash

# Test script for Vibe PM Agent Lambda Functions
# Tests both direct Lambda invocation and API Gateway endpoints

set -e

# Configuration
FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-dev-vibe-pm-agent-lambda}"
REGION="${AWS_REGION:-us-east-1}"
API_GATEWAY_URL="${API_GATEWAY_URL:-}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Vibe PM Agent Lambda Testing ===${NC}\n"

# Test 1: Health Check
test_health_check() {
    echo -e "${BLUE}Test 1: Health Check${NC}"
    
    PAYLOAD='{
        "path": "/health",
        "httpMethod": "GET",
        "body": null
    }'
    
    echo "Invoking Lambda function: $FUNCTION_NAME"
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$PAYLOAD" \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        response.json
    
    echo -e "\n${GREEN}Response:${NC}"
    cat response.json | jq '.'
    echo -e "\n"
}

# Test 2: Business Analysis - Analyze Opportunity
test_analyze_opportunity() {
    echo -e "${BLUE}Test 2: Analyze Business Opportunity${NC}"
    
    PAYLOAD='{
        "path": "/business-analysis/analyze-opportunity",
        "httpMethod": "POST",
        "body": "{\"toolName\":\"analyze_business_opportunity\",\"toolArgs\":{\"idea\":\"AI-powered code review assistant for development teams\",\"market_context\":{\"industry\":\"Developer Tools\",\"competition\":\"GitHub Copilot, CodeRabbit\",\"budget_range\":\"medium\",\"timeline\":\"6 months\"}}}"
    }'
    
    echo "Testing analyze_business_opportunity..."
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$PAYLOAD" \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        response.json
    
    echo -e "\n${GREEN}Response:${NC}"
    cat response.json | jq '.'
    echo -e "\n"
}

# Test 3: Interview Prep - Start Session
test_interview_prep() {
    echo -e "${BLUE}Test 3: Start Interview Preparation${NC}"
    
    PAYLOAD='{
        "path": "/interview-prep/start-session",
        "httpMethod": "POST",
        "body": "{\"toolName\":\"start_interview_preparation\",\"toolArgs\":{\"role_level\":\"Senior PM\",\"target_company\":\"Google\",\"preparation_timeline\":\"2 weeks\"}}"
    }'
    
    echo "Testing start_interview_preparation..."
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$PAYLOAD" \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        response.json
    
    echo -e "\n${GREEN}Response:${NC}"
    cat response.json | jq '.'
    echo -e "\n"
}

# Test 4: Generate Interview Question
test_generate_question() {
    echo -e "${BLUE}Test 4: Generate Interview Question${NC}"
    
    PAYLOAD='{
        "path": "/interview-prep/generate-question",
        "httpMethod": "POST",
        "body": "{\"toolName\":\"generate_interview_question\",\"toolArgs\":{\"role_level\":\"PM\",\"question_category\":\"product_sense\",\"difficulty_level\":3}}"
    }'
    
    echo "Testing generate_interview_question..."
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$PAYLOAD" \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        response.json
    
    echo -e "\n${GREEN}Response:${NC}"
    cat response.json | jq '.'
    echo -e "\n"
}

# Test 5: Case Study
test_case_study() {
    echo -e "${BLUE}Test 5: Start Case Study${NC}"
    
    PAYLOAD='{
        "path": "/case-studies/start-case",
        "httpMethod": "POST",
        "body": "{\"toolName\":\"start_case_study\",\"toolArgs\":{\"case_type\":\"product_design\",\"role_level\":\"Senior PM\",\"difficulty_level\":4}}"
    }'
    
    echo "Testing start_case_study..."
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$PAYLOAD" \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        response.json
    
    echo -e "\n${GREEN}Response:${NC}"
    cat response.json | jq '.'
    echo -e "\n"
}

# Test 6: Quick Validation
test_quick_validation() {
    echo -e "${BLUE}Test 6: Quick Idea Validation${NC}"
    
    PAYLOAD='{
        "path": "/business-analysis/validate-idea",
        "httpMethod": "POST",
        "body": "{\"toolName\":\"validate_idea_quick\",\"toolArgs\":{\"idea\":\"Mobile app for restaurant reservations with AI recommendations\",\"criteria\":[\"market_demand\",\"technical_feasibility\",\"competitive_advantage\"]}}"
    }'
    
    echo "Testing validate_idea_quick..."
    aws lambda invoke \
        --function-name "$FUNCTION_NAME" \
        --payload "$PAYLOAD" \
        --region "$REGION" \
        --cli-binary-format raw-in-base64-out \
        response.json
    
    echo -e "\n${GREEN}Response:${NC}"
    cat response.json | jq '.'
    echo -e "\n"
}

# Run all tests
run_all_tests() {
    echo -e "${YELLOW}Running all Lambda tests...${NC}\n"
    
    test_health_check
    sleep 2
    
    test_analyze_opportunity
    sleep 2
    
    test_interview_prep
    sleep 2
    
    test_generate_question
    sleep 2
    
    test_case_study
    sleep 2
    
    test_quick_validation
    
    echo -e "${GREEN}All tests completed!${NC}"
    
    # Cleanup
    rm -f response.json
}

# Parse command line arguments
case "${1:-all}" in
    "health")
        test_health_check
        ;;
    "opportunity")
        test_analyze_opportunity
        ;;
    "interview")
        test_interview_prep
        ;;
    "question")
        test_generate_question
        ;;
    "case")
        test_case_study
        ;;
    "validate")
        test_quick_validation
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {health|opportunity|interview|question|case|validate|all}"
        echo ""
        echo "Environment variables:"
        echo "  LAMBDA_FUNCTION_NAME - Lambda function name (default: dev-vibe-pm-agent-lambda)"
        echo "  AWS_REGION          - AWS region (default: us-east-1)"
        exit 1
        ;;
esac

# Cleanup
rm -f response.json
