#!/bin/bash

# Lambda Function Deployment Script for Vibe PM Agent
# This script deploys the Lambda functions using CloudFormation

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist"
ENVIRONMENT=${1:-dev}
STACK_NAME="${ENVIRONMENT}-vibe-pm-agent-lambda"
TEMPLATE_FILE="${PROJECT_ROOT}/infrastructure/lambda-deployment.yaml"

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

# Check if package-info.env exists
check_package_info() {
    PACKAGE_INFO_FILE="${DIST_DIR}/package-info.env"

    if [ ! -f "$PACKAGE_INFO_FILE" ]; then
        log_error "Package info file not found: $PACKAGE_INFO_FILE"
        log_error "Please run the packaging script first:"
        log_error "  ./deployment-scripts/package-lambda.sh $ENVIRONMENT"
        exit 1
    fi

    # Source the package information
    source "$PACKAGE_INFO_FILE"
    log_success "Package info loaded from $PACKAGE_INFO_FILE"
}

# Check AWS CLI and credentials
check_aws() {
    log_info "Checking AWS CLI configuration..."

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install AWS CLI."
        exit 1
    fi

    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured. Please run 'aws configure'."
        exit 1
    fi

    log_success "AWS CLI is configured"
}

# Validate CloudFormation template
validate_template() {
    log_info "Validating CloudFormation template..."

    if ! aws cloudformation validate-template \
        --template-body file://"$TEMPLATE_FILE" &> /dev/null; then
        log_error "CloudFormation template validation failed"
        exit 1
    fi

    log_success "CloudFormation template is valid"
}

# Check if stack exists
stack_exists() {
    if aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" &> /dev/null; then
        return 0  # Stack exists
    else
        return 1  # Stack doesn't exist
    fi
}

# Get stack status
get_stack_status() {
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].StackStatus' \
        --output text
}

# Deploy Lambda function
deploy_lambda() {
    log_info "Deploying Lambda function to environment: $ENVIRONMENT"

    # Check if stack exists
    if stack_exists; then
        log_info "Stack exists, updating..."
        OPERATION="update-stack"
    else
        log_info "Creating new stack..."
        OPERATION="create-stack"
    fi

    # Deploy using CloudFormation
    if aws cloudformation $OPERATION \
        --stack-name "$STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters \
            ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
            ParameterKey=S3BucketName,ParameterValue="$S3_BUCKET" \
            ParameterKey=S3Key,ParameterValue="$S3_KEY" \
        --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM \
        --region "us-east-1" \
        --output text; then

        log_success "CloudFormation $OPERATION initiated successfully"

        # Wait for deployment to complete
        wait_for_deployment

    else
        log_error "CloudFormation deployment failed"
        exit 1
    fi
}

# Wait for deployment to complete
wait_for_deployment() {
    log_info "Waiting for deployment to complete..."

    while true; do
        if stack_exists; then
            STATUS=$(get_stack_status)

            case "$STATUS" in
                "CREATE_COMPLETE"|"UPDATE_COMPLETE")
                    log_success "Deployment completed successfully! Status: $STATUS"
                    break
                    ;;
                "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS")
                    log_info "Deployment in progress... Status: $STATUS"
                    sleep 10
                    ;;
                "CREATE_FAILED"|"UPDATE_FAILED"|"ROLLBACK_COMPLETE")
                    log_error "Deployment failed! Status: $STATUS"
                    show_stack_events
                    exit 1
                    ;;
                *)
                    log_info "Current status: $STATUS"
                    sleep 10
                    ;;
            esac
        else
            log_info "Waiting for stack creation..."
            sleep 5
        fi
    done
}

# Show stack events for debugging
show_stack_events() {
    log_info "Recent stack events:"
    aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --max-items 10 \
        --query 'StackEvents[*].[LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
        --output table
}

# Get deployment outputs
get_outputs() {
    log_info "Getting deployment outputs..."

    if aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs' \
        --output table; then

        log_success "Stack outputs retrieved"

        # Save outputs to file for reference
        OUTPUT_FILE="${DIST_DIR}/deployment-outputs-${ENVIRONMENT}.json"
        aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --query 'Stacks[0].Outputs' \
            --output json > "$OUTPUT_FILE"

        log_success "Deployment outputs saved to: $OUTPUT_FILE"

    else
        log_warning "Could not retrieve stack outputs"
    fi
}

# Test Lambda function
test_lambda() {
    log_info "Testing Lambda function..."

    # Get Lambda function name from outputs
    LAMBDA_FUNCTION_NAME=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
        --output text)

    if [ -z "$LAMBDA_FUNCTION_NAME" ] || [ "$LAMBDA_FUNCTION_NAME" = "None" ]; then
        log_warning "Could not retrieve Lambda function name for testing"
        return
    fi

    # Test with a simple health check payload
    TEST_PAYLOAD='{
        "toolName": "health_check",
        "toolArgs": {}
    }'

    log_info "Invoking Lambda function: $LAMBDA_FUNCTION_NAME"

    if RESPONSE=$(aws lambda invoke \
        --function-name "$LAMBDA_FUNCTION_NAME" \
        --payload "$TEST_PAYLOAD" \
        --query 'LogResult' \
        --output text \
        /dev/stdout 2>/dev/null | base64 -d); then

        log_success "Lambda function test completed"
        log_info "Response: $RESPONSE"

    else
        log_warning "Lambda function test failed or returned error"
    fi
}

# Main execution
main() {
    log_info "Starting Lambda deployment process for environment: $ENVIRONMENT"

    # Pre-flight checks
    check_package_info
    check_aws
    validate_template

    # Deploy
    deploy_lambda
    get_outputs
    test_lambda

    log_success "Lambda deployment completed successfully!"
    log_info "Stack Name: $STACK_NAME"
    log_info "Environment: $ENVIRONMENT"
    log_info "Lambda Function: $LAMBDA_FUNCTION_NAME"
    echo ""
    log_info "You can now integrate this Lambda function with API Gateway using:"
    echo "  ./deployment-scripts/deploy-api-gateway.sh $ENVIRONMENT"
}

# Handle script arguments
case "${1:-}" in
    "dev"|"prod")
        ENVIRONMENT="$1"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [dev|prod]"
        echo ""
        echo "Deploys Lambda functions using CloudFormation."
        echo ""
        echo "Prerequisites:"
        echo "  - Package must be created first using package-lambda.sh"
        echo "  - AWS CLI must be configured"
        echo ""
        echo "Arguments:"
        echo "  dev    Deploy to development environment (default)"
        echo "  prod   Deploy to production environment"
        echo "  help   Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 dev"
        echo "  $0 prod"
        exit 0
        ;;
    "")
        # Default to dev environment
        ;;
    *)
        log_error "Invalid argument: $1"
        echo "Use 'help' for usage information"
        exit 1
        ;;
esac

# Run main function
main
