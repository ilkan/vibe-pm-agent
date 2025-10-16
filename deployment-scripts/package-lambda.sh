#!/bin/bash

# Lambda Function Packaging Script for Vibe PM Agent
# This script packages the Lambda functions for deployment to AWS

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LAMBDA_DIR="${PROJECT_ROOT}/lambda-functions"
DIST_DIR="${PROJECT_ROOT}/dist"
PACKAGE_DIR="${DIST_DIR}/lambda-package"
S3_BUCKET="vibe-pm-agent-lambda-packages-us-east-1"
ENVIRONMENT=${1:-dev}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="vibe-pm-agent-lambda-${ENVIRONMENT}-${TIMESTAMP}.zip"

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

# Check if Node.js is installed
check_nodejs() {
    log_info "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18.x or later."
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18 or later is required. Current version: $(node -v)"
        exit 1
    fi
    log_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    log_info "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm."
        exit 1
    fi
    log_success "npm $(npm -v) is installed"
}

# Check if AWS CLI is installed and configured
check_aws() {
    log_info "Checking AWS CLI installation..."
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

# Install Lambda dependencies
install_dependencies() {
    log_info "Installing Lambda function dependencies..."
    cd "${LAMBDA_DIR}"

    if [ ! -d "node_modules" ]; then
        log_info "Running npm install..."
        npm install
    else
        log_info "Dependencies already installed, skipping npm install"
    fi
    log_success "Dependencies installed"
}

# Build TypeScript Lambda functions
build_lambda() {
    log_info "Building Lambda functions..."
    cd "${LAMBDA_DIR}"

    # Clean previous build
    if [ -d "dist" ]; then
        log_info "Cleaning previous build..."
        rm -rf dist
    fi

    # Build TypeScript
    log_info "Compiling TypeScript..."
    npx tsc

    # Copy necessary files to dist
    log_info "Copying package.json and other necessary files..."
    cp package.json dist/
    cp -r shared dist/

    # Create Lambda entry point
    log_info "Creating Lambda entry point..."
    cat > dist/index.js << 'EOF'
// Lambda function entry point
// This file serves as the main entry point for the Lambda function

const { handler } = require('./router');

module.exports = { handler };
EOF

    log_success "Lambda functions built successfully"
}

# Create deployment package
create_package() {
    log_info "Creating deployment package..."

    # Create package directory
    mkdir -p "${PACKAGE_DIR}"

    # Copy Lambda function files to package directory
    cp -r "${LAMBDA_DIR}/dist/"* "${PACKAGE_DIR}/"

    # Create package
    cd "${DIST_DIR}"
    log_info "Creating ZIP package: ${PACKAGE_NAME}"
    zip -r "${PACKAGE_NAME}" lambda-package/

    log_success "Deployment package created: ${DIST_DIR}/${PACKAGE_NAME}"
}

# Upload to S3
upload_to_s3() {
    log_info "Uploading package to S3..."

    S3_KEY="lambda-packages/${ENVIRONMENT}/${PACKAGE_NAME}"

    if aws s3 cp "${DIST_DIR}/${PACKAGE_NAME}" "s3://${S3_BUCKET}/${S3_KEY}"; then
        log_success "Package uploaded to s3://${S3_BUCKET}/${S3_KEY}"

        # Output S3 details for CloudFormation
        echo "S3_BUCKET=${S3_BUCKET}" > "${DIST_DIR}/package-info.env"
        echo "S3_KEY=${S3_KEY}" >> "${DIST_DIR}/package-info.env"
        echo "PACKAGE_NAME=${PACKAGE_NAME}" >> "${DIST_DIR}/package-info.env"
        echo "ENVIRONMENT=${ENVIRONMENT}" >> "${DIST_DIR}/package-info.env"

        log_success "Package information saved to ${DIST_DIR}/package-info.env"
    else
        log_error "Failed to upload package to S3"
        exit 1
    fi
}

# Clean up
cleanup() {
    log_info "Cleaning up temporary files..."
    if [ -d "${PACKAGE_DIR}" ]; then
        rm -rf "${PACKAGE_DIR}"
    fi
    log_success "Cleanup completed"
}

# Main execution
main() {
    log_info "Starting Lambda packaging process for environment: ${ENVIRONMENT}"

    # Pre-flight checks
    check_nodejs
    check_npm
    check_aws

    # Build and package
    install_dependencies
    build_lambda
    create_package
    upload_to_s3
    cleanup

    log_success "Lambda packaging completed successfully!"
    log_info "Package details:"
    echo "  Environment: ${ENVIRONMENT}"
    echo "  Package: ${PACKAGE_NAME}"
    echo "  S3 Bucket: ${S3_BUCKET}"
    echo "  S3 Key: lambda-packages/${ENVIRONMENT}/${PACKAGE_NAME}"
    echo ""
    log_info "You can now deploy using the CloudFormation template:"
    echo "  aws cloudformation deploy \\"
    echo "    --template-file infrastructure/lambda-deployment.yaml \\"
    echo "    --stack-name ${ENVIRONMENT}-vibe-pm-agent-lambda \\"
    echo "    --parameter-overrides \\"
    echo "      Environment=${ENVIRONMENT} \\"
    echo "      S3BucketName=${S3_BUCKET} \\"
    echo "      S3Key=lambda-packages/${ENVIRONMENT}/${PACKAGE_NAME}"
}

# Handle script arguments
case "${1:-}" in
    "dev"|"prod")
        ENVIRONMENT="$1"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [dev|prod]"
        echo ""
        echo "Packages Lambda functions for deployment to AWS."
        echo ""
        echo "Arguments:"
        echo "  dev    Package for development environment (default)"
        echo "  prod   Package for production environment"
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
