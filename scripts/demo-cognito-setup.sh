#!/bin/bash

# Demo: Complete Cognito Setup with AWS Q Developer Best Practices
# This script demonstrates the full setup process
set -e

echo "🚀 Vibe PM Agent - AWS Cognito Setup Demo"
echo "Enhanced with AWS Q Developer Best Practices"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
    echo ""
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo ""
}

info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
    echo ""
}

# Configuration
ENVIRONMENT="dev"
CALLBACK_URL="http://localhost:3000"
LOGOUT_URL="http://localhost:3000/logout"
TEST_EMAIL="testuser@example.com"
TEST_PASSWORD="TempPass123!"

step "1" "Prerequisites Check"
echo "Checking AWS CLI and credentials..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")
success "AWS CLI configured (Account: ${ACCOUNT_ID}, Region: ${REGION})"

step "2" "Deploy Enhanced Cognito Infrastructure"
info "Deploying CloudFormation stack with enhanced security features..."
echo "Command: ./scripts/deploy-cognito.sh ${ENVIRONMENT} ${CALLBACK_URL} ${LOGOUT_URL} OPTIONAL ENFORCED"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

./scripts/deploy-cognito.sh "${ENVIRONMENT}" "${CALLBACK_URL}" "${LOGOUT_URL}" OPTIONAL ENFORCED

success "Cognito infrastructure deployed successfully!"

step "3" "Install Web UI Dependencies"
info "Installing AWS Amplify and other dependencies..."
cd web-ui
npm install
cd ..
success "Dependencies installed!"

step "4" "Test Cognito Configuration"
info "Running comprehensive configuration tests..."
./scripts/test-cognito-setup.sh "${ENVIRONMENT}"
success "Configuration tests completed!"

step "5" "Create Test User"
info "Creating a test user for authentication testing..."
echo "Email: ${TEST_EMAIL}"
echo "Temporary Password: ${TEST_PASSWORD}"
echo ""
read -p "Press Enter to create test user or Ctrl+C to skip..."
echo ""

./scripts/create-test-user.sh "${ENVIRONMENT}" "${TEST_EMAIL}" "${TEST_PASSWORD}"
success "Test user created!"

step "6" "Configuration Summary"
STACK_NAME="vibe-pm-agent-cognito-${ENVIRONMENT}"

USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --region us-east-1)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text \
  --region us-east-1)

DOMAIN_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolDomain`].OutputValue' \
  --output text \
  --region us-east-1)

HOSTED_UI_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`HostedUIURL`].OutputValue' \
  --output text \
  --region us-east-1)

echo "🎯 Your Cognito Configuration:"
echo "=============================="
echo "Environment: ${ENVIRONMENT}"
echo "User Pool ID: ${USER_POOL_ID}"
echo "Client ID: ${CLIENT_ID}"
echo "Domain: ${DOMAIN_URL}"
echo "Managed Login URL: ${HOSTED_UI_URL}"
echo ""
echo "Test User:"
echo "Email: ${TEST_EMAIL}"
echo "Temporary Password: ${TEST_PASSWORD}"
echo ""

step "7" "Start Development Server"
info "Ready to start the development server!"
echo "Commands to run:"
echo "  cd web-ui"
echo "  npm run dev"
echo ""
echo "Then open: ${CALLBACK_URL}"
echo ""

read -p "Start development server now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting development server..."
    cd web-ui
    npm run dev
else
    echo ""
    success "Setup completed! Run 'cd web-ui && npm run dev' when ready."
fi

echo ""
echo "🎉 Cognito Setup Demo Completed!"
echo ""
echo "📚 Additional Resources:"
echo "- AWS Q Developer Guide: docs/AWS_Q_DEVELOPER_COGNITO_GUIDE.md"
echo "- Setup Documentation: docs/COGNITO_SETUP.md"
echo "- Test Configuration: ./scripts/test-cognito-setup.sh ${ENVIRONMENT}"
echo ""
echo "🔧 Useful Commands:"
echo "- List users: aws cognito-idp list-users --user-pool-id ${USER_POOL_ID}"
echo "- View logs: aws logs tail /aws/cognito/userpool/${USER_POOL_ID} --follow"
echo "- Update stack: ./scripts/deploy-cognito.sh ${ENVIRONMENT}"
echo ""