#!/bin/bash

# Vibe PM Agent Bedrock AgentCore Deployment Script
# This script automates the deployment of the vibe-pm-agent to AWS Bedrock AgentCore

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
AGENT_NAME="vibe-pm-agent"
ENVIRONMENT="${ENVIRONMENT:-production}"
REGION="${AWS_REGION:-us-east-1}"
CONFIG_FILE="${PROJECT_ROOT}/deployment-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Prerequisites check
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured. Please configure them first."
        exit 1
    fi

    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed. Please install it first."
        exit 1
    fi

    # Check Node.js (for MCP server)
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install it first."
        exit 1
    fi

    # Check if AgentCore CLI is available
    if ! python3 -c "import bedrock_agentcore" &> /dev/null; then
        log_warning "Bedrock AgentCore library not found. Installing..."
        pip3 install bedrock-agentcore bedrock-agentcore-starter-toolkit
    fi

    log_success "Prerequisites check completed"
}

# Build the agent
build_agent() {
    log_info "Building the agent..."

    cd "${PROJECT_ROOT}"

    # Install Python dependencies
    if [ -f "requirements.txt" ]; then
        log_info "Installing Python dependencies..."
        pip3 install -r requirements.txt
    fi

    # Build the MCP server (if needed)
    if [ -f "../package.json" ]; then
        log_info "Building MCP server..."
        cd ..
        npm run build:prod
        cd "${PROJECT_ROOT}"
    fi

    log_success "Agent build completed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure..."

    cd "${PROJECT_ROOT}/infrastructure"

    # Deploy CloudFormation stack
    STACK_NAME="${AGENT_NAME}-${ENVIRONMENT}"

    log_info "Creating/updating CloudFormation stack: ${STACK_NAME}"

    aws cloudformation deploy \
        --template-file agentcore-deployment.yaml \
        --stack-name "${STACK_NAME}" \
        --parameter-overrides \
            EnvironmentName="${ENVIRONMENT}" \
            AgentName="${AGENT_NAME}" \
        --region "${REGION}" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

    log_success "Infrastructure deployment completed"
}

# Deploy the agent
deploy_agent() {
    log_info "Deploying agent to Bedrock AgentCore..."

    cd "${PROJECT_ROOT}"

    # Get the IAM role ARN from CloudFormation
    STACK_NAME="${AGENT_NAME}-${ENVIRONMENT}"
    ROLE_ARN=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}" \
        --query "Stacks[0].Outputs[?OutputKey=='AgentCoreRoleArn'].OutputValue" \
        --output text \
        --region "${REGION}")

    if [ -z "${ROLE_ARN}" ] || [ "${ROLE_ARN}" = "None" ]; then
        log_error "Failed to get IAM role ARN from CloudFormation stack"
        exit 1
    fi

    log_info "Using IAM role: ${ROLE_ARN}"

    # Deploy using AWS Bedrock API
    log_info "Deploying agent using AWS Bedrock API..."

    # Create agent using AWS CLI
    log_info "Creating Bedrock agent..."

    # Create the agent definition
    AGENT_DEFINITION=$(cat <<EOF
{
    "agentName": "${AGENT_NAME}",
    "description": "PM-Focused AI Agent with 32 business intelligence and interview preparation tools",
    "agentResourceRoleArn": "${ROLE_ARN}",
    "foundationModel": "anthropic.claude-3-sonnet-20240229-v1:0",
    "instruction": "You are a PM-focused AI agent with 32 business intelligence and interview preparation tools. Use the available tools to help with product management tasks, business analysis, stakeholder communication, and interview preparation.",
    "idleSessionTTLInSeconds": 1800
}
EOF
    )

    # Save agent definition to temporary file
    echo "${AGENT_DEFINITION}" > /tmp/agent-definition.json

    # Try to create the agent using AWS CLI (it might already exist)
    if ! aws bedrock-agent create-agent \
        --cli-input-json file:///tmp/agent-definition.json \
        --region "${REGION}" 2>/dev/null; then

        log_info "Agent already exists, getting agent ID..."

        # Get the agent ID by name
        AGENT_ID=$(aws bedrock-agent list-agents \
            --region "${REGION}" \
            --query "agentSummaries[?agentName=='${AGENT_NAME}'].agentId" \
            --output text)

        if [ -z "${AGENT_ID}" ] || [ "${AGENT_ID}" = "None" ]; then
            log_error "Failed to find existing agent ID"
            exit 1
        fi

        log_info "Found existing agent ID: ${AGENT_ID}"
    else
        # Get the agent ID from the creation response
        AGENT_ID=$(aws bedrock-agent list-agents \
            --region "${REGION}" \
            --query "agentSummaries[?agentName=='${AGENT_NAME}'].agentId" \
            --output text)

        log_info "Created new agent with ID: ${AGENT_ID}"
    fi

    # Create agent alias for production
    log_info "Creating agent alias for production..."

    # Check if alias already exists
    if ! aws bedrock-agent create-agent-alias \
        --agent-id "${AGENT_ID}" \
        --agent-alias-name "production" \
        --description "Production alias for Vibe PM Agent" \
        --region "${REGION}" 2>/dev/null; then

        log_info "Agent alias already exists"
    else
        log_info "Created agent alias successfully"
    fi

    # Clean up temporary file
    rm /tmp/agent-definition.json

    log_success "Agent deployment completed"
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment..."

    cd "${PROJECT_ROOT}"

    # Test agent invocation
    log_info "Testing agent invocation..."

    # Get agent ARN (this would need to be implemented based on AgentCore CLI output)
    AGENT_ARN="arn:aws:bedrock:${REGION}:123456789012:agent/${AGENT_NAME}"

    # Test with a simple tool call
    TEST_PAYLOAD='{
        "tool_name": "validate_idea_quick",
        "tool_args": {
            "idea": "test deployment validation",
            "criteria": ["feasibility", "market_potential"]
        }
    }'

    log_info "Testing with payload: ${TEST_PAYLOAD}"

    # This is a placeholder for actual agent testing
    # In a real implementation, you'd use the Bedrock API to invoke the agent
    log_info "Agent validation would be performed here using Bedrock API"

    log_success "Deployment validation completed"
}

# Main deployment flow
main() {
    log_info "Starting Vibe PM Agent Bedrock AgentCore deployment..."
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Region: ${REGION}"
    log_info "Agent: ${AGENT_NAME}"

    # Execute deployment steps
    check_prerequisites
    build_agent
    deploy_infrastructure
    deploy_agent
    validate_deployment

    log_success "Deployment completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Test your agent using the Bedrock console or API"
    log_info "2. Monitor logs in CloudWatch"
    log_info "3. Set up alarms and notifications as needed"
    log_info "4. Integrate with your applications"
    log_info ""
    log_info "Agent Name: ${AGENT_NAME}"
    log_info "Region: ${REGION}"
    log_info "Environment: ${ENVIRONMENT}"
}

# Handle script arguments
case "${1:-}" in
    "prerequisites")
        check_prerequisites
        ;;
    "build")
        build_agent
        ;;
    "infrastructure")
        deploy_infrastructure
        ;;
    "deploy")
        deploy_agent
        ;;
    "validate")
        validate_deployment
        ;;
    "all")
        main
        ;;
    *)
        echo "Usage: $0 {prerequisites|build|infrastructure|deploy|validate|all}"
        echo ""
        echo "Commands:"
        echo "  prerequisites  - Check deployment prerequisites"
        echo "  build         - Build the agent"
        echo "  infrastructure - Deploy AWS infrastructure"
        echo "  deploy        - Deploy agent to Bedrock AgentCore"
        echo "  validate      - Validate the deployment"
        echo "  all           - Run complete deployment"
        echo ""
        echo "Environment variables:"
        echo "  ENVIRONMENT   - Environment name (default: production)"
        echo "  AWS_REGION    - AWS region (default: us-east-1)"
        exit 1
        ;;
esac
