#!/bin/bash
set -e

# Vibe PM Agent AWS Deployment Script
# Deploys the MCP server to AWS using Serverless Framework

# Configuration
STAGE=${STAGE:-"prod"}
REGION=${REGION:-"us-east-1"}
LOG_LEVEL=${LOG_LEVEL:-"info"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18 or higher is required"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    # Check Serverless Framework
    if ! command -v serverless &> /dev/null && ! command -v sls &> /dev/null; then
        log_warning "Serverless Framework not found globally, installing locally..."
        npm install serverless
    fi
    
    log_success "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install root dependencies
    cd ../../
    npm install
    
    # Install deployment dependencies
    cd deployment/aws
    npm install
    
    log_success "Dependencies installed"
}

# Build the project
build_project() {
    log_info "Building project..."
    
    cd ../../
    
    # Clean previous build
    npm run clean
    
    # Build TypeScript
    npm run build:prod
    
    # Verify build
    if [ ! -f "dist/mcp/server.js" ]; then
        log_error "Build failed - server.js not found"
        exit 1
    fi
    
    log_success "Project built successfully"
}

# Deploy to AWS
deploy_to_aws() {
    log_info "Deploying to AWS..."
    log_info "Stage: ${STAGE}"
    log_info "Region: ${REGION}"
    
    cd deployment/aws
    
    # Deploy using Serverless Framework
    if command -v serverless &> /dev/null; then
        SLS_CMD="serverless"
    elif command -v sls &> /dev/null; then
        SLS_CMD="sls"
    else
        SLS_CMD="npx serverless"
    fi
    
    $SLS_CMD deploy \
        --stage ${STAGE} \
        --region ${REGION} \
        --verbose
    
    log_success "Deployment completed"
}

# Get deployment info
get_deployment_info() {
    log_info "Getting deployment information..."
    
    cd deployment/aws
    
    if command -v serverless &> /dev/null; then
        SLS_CMD="serverless"
    elif command -v sls &> /dev/null; then
        SLS_CMD="sls"
    else
        SLS_CMD="npx serverless"
    fi
    
    $SLS_CMD info --stage ${STAGE} --region ${REGION}
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Get API Gateway URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name vibe-pm-agent-${STAGE} \
        --region ${REGION} \
        --query 'Stacks[0].Outputs[?OutputKey==`ServiceEndpoint`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$API_URL" ]; then
        log_warning "Could not retrieve API Gateway URL"
        return
    fi
    
    log_info "Testing health endpoint: ${API_URL}/mcp/health"
    
    # Test health endpoint
    HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "${API_URL}/mcp/health" || echo "000")
    HTTP_CODE="${HEALTH_RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Health check passed"
    else
        log_warning "Health check failed with HTTP code: $HTTP_CODE"
    fi
    
    # Test MCP tools list
    log_info "Testing MCP tools list..."
    
    TOOLS_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"method":"tools/list","id":1}' \
        "${API_URL}/mcp" || echo "")
    
    if echo "$TOOLS_RESPONSE" | grep -q "analyze_business_opportunity"; then
        log_success "MCP tools endpoint working"
    else
        log_warning "MCP tools endpoint may have issues"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here if needed
}

# Main deployment function
main() {
    log_info "Starting Vibe PM Agent AWS deployment..."
    log_info "Timestamp: $(date)"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    build_project
    deploy_to_aws
    get_deployment_info
    test_deployment
    
    log_success "Vibe PM Agent deployed successfully to AWS!"
    log_info "Next steps:"
    log_info "1. Configure your MCP client to use the deployed API"
    log_info "2. Set up monitoring and alerts"
    log_info "3. Configure custom domain (optional)"
    log_info "4. Run integration tests"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "remove")
        log_warning "Removing Vibe PM Agent from AWS..."
        cd deployment/aws
        if command -v serverless &> /dev/null; then
            serverless remove --stage ${STAGE} --region ${REGION}
        elif command -v sls &> /dev/null; then
            sls remove --stage ${STAGE} --region ${REGION}
        else
            npx serverless remove --stage ${STAGE} --region ${REGION}
        fi
        log_success "Deployment removed"
        ;;
    "info")
        log_info "Getting deployment information..."
        cd deployment/aws
        if command -v serverless &> /dev/null; then
            serverless info --stage ${STAGE} --region ${REGION}
        elif command -v sls &> /dev/null; then
            sls info --stage ${STAGE} --region ${REGION}
        else
            npx serverless info --stage ${STAGE} --region ${REGION}
        fi
        ;;
    "logs")
        log_info "Fetching logs..."
        cd deployment/aws
        if command -v serverless &> /dev/null; then
            serverless logs -f mcpServer --stage ${STAGE} --region ${REGION} -t
        elif command -v sls &> /dev/null; then
            sls logs -f mcpServer --stage ${STAGE} --region ${REGION} -t
        else
            npx serverless logs -f mcpServer --stage ${STAGE} --region ${REGION} -t
        fi
        ;;
    "test")
        test_deployment
        ;;
    *)
        echo "Usage: $0 [deploy|remove|info|logs|test]"
        echo "Environment variables:"
        echo "  STAGE: deployment stage (default: prod)"
        echo "  REGION: AWS region (default: us-east-1)"
        echo "  LOG_LEVEL: logging level (default: info)"
        exit 1
        ;;
esac