#!/bin/bash

# Quick setup script for AWS Cognito authentication
set -e

echo "🚀 Setting up AWS Cognito Authentication for Vibe PM Agent"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Get environment and URLs
ENVIRONMENT=${1:-dev}
CALLBACK_URL=${2:-http://localhost:3000}

echo "📋 Configuration:"
echo "   Environment: ${ENVIRONMENT}"
echo "   Callback URL: ${CALLBACK_URL}"
echo ""

# Deploy Cognito resources
echo "🔧 Deploying AWS Cognito resources..."
./scripts/deploy-cognito.sh "${ENVIRONMENT}" "${CALLBACK_URL}"

# Install dependencies
echo "📦 Installing web-ui dependencies..."
cd web-ui
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Copy web-ui/.env.template to web-ui/.env.local (already done by deploy script)"
echo "2. Create a test user:"
echo "   aws cognito-idp admin-create-user \\"
echo "     --user-pool-id \$(grep VITE_COGNITO_USER_POOL_ID web-ui/.env.local | cut -d'=' -f2) \\"
echo "     --username testuser@example.com \\"
echo "     --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true \\"
echo "     --temporary-password TempPass123! \\"
echo "     --message-action SUPPRESS"
echo ""
echo "3. Start the development server:"
echo "   cd web-ui && npm run dev"
echo ""
echo "4. Open ${CALLBACK_URL} and test the login!"