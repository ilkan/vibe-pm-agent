#!/bin/bash

# Deploy Enhanced Cognito resources for Vibe PM Agent
# Enhanced with AWS Q Developer best practices
set -e

ENVIRONMENT=${1:-dev}
CALLBACK_URL=${2:-http://localhost:3000}
LOGOUT_URL=${3:-http://localhost:3000/logout}
ENABLE_MFA=${4:-OPTIONAL}
ENABLE_ADVANCED_SECURITY=${5:-ENFORCED}
STACK_NAME="vibe-pm-agent-cognito-${ENVIRONMENT}"

echo "🚀 Deploying Enhanced Cognito resources for environment: ${ENVIRONMENT}"
echo "📍 Callback URL: ${CALLBACK_URL}"
echo "🚪 Logout URL: ${LOGOUT_URL}"
echo "🔐 MFA Setting: ${ENABLE_MFA}"
echo "🛡️  Advanced Security: ${ENABLE_ADVANCED_SECURITY}"
echo ""

# Validate AWS CLI and credentials
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Deploy Enhanced CloudFormation stack
echo "🔧 Deploying CloudFormation stack with enhanced security features..."
aws cloudformation deploy \
  --template-file infrastructure/cognito-auth.yaml \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides \
    Environment="${ENVIRONMENT}" \
    CallbackURL="${CALLBACK_URL}" \
    LogoutURL="${LOGOUT_URL}" \
    EnableMFA="${ENABLE_MFA}" \
    EnableAdvancedSecurity="${ENABLE_ADVANCED_SECURITY}" \
    PasswordMinLength=8 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --tags \
    Project=vibe-pm-agent \
    Environment="${ENVIRONMENT}" \
    ManagedBy=aws-q-developer \
    SecurityLevel=enhanced

echo "✅ Cognito stack deployed successfully!"

# Get outputs
echo "📋 Getting stack outputs..."
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

USER_POOL_ARN=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolArn`].OutputValue' \
  --output text \
  --region us-east-1)

AUTHORIZE_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`AuthorizeURL`].OutputValue' \
  --output text \
  --region us-east-1)

TOKEN_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`TokenURL`].OutputValue' \
  --output text \
  --region us-east-1)

JWKS_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`JWKSUrl`].OutputValue' \
  --output text \
  --region us-east-1)

echo ""
echo "🎯 Enhanced Cognito Configuration:"
echo "User Pool ID: ${USER_POOL_ID}"
echo "User Pool ARN: ${USER_POOL_ARN}"
echo "Client ID: ${CLIENT_ID}"
echo "Domain URL: ${DOMAIN_URL}"
echo "Managed Login URL: ${HOSTED_UI_URL}"
echo "OAuth Authorize URL: ${AUTHORIZE_URL}"
echo "OAuth Token URL: ${TOKEN_URL}"
echo "JWKS URL: ${JWKS_URL}"
echo ""

# Create enhanced environment file for web-ui
ENV_FILE="web-ui/.env.local"
echo "📝 Creating enhanced environment file: ${ENV_FILE}"

cat > "${ENV_FILE}" << EOF
# AWS Cognito Configuration - Enhanced with AWS Q Developer
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=${USER_POOL_ID}
VITE_COGNITO_CLIENT_ID=${CLIENT_ID}
VITE_COGNITO_DOMAIN=${DOMAIN_URL}
VITE_CALLBACK_URL=${CALLBACK_URL}
VITE_LOGOUT_URL=${LOGOUT_URL}

# Enhanced OAuth Endpoints
VITE_OAUTH_AUTHORIZE_URL=${AUTHORIZE_URL}
VITE_OAUTH_TOKEN_URL=${TOKEN_URL}
VITE_JWKS_URL=${JWKS_URL}

# Security Configuration
VITE_MFA_ENABLED=${ENABLE_MFA}
VITE_ADVANCED_SECURITY=${ENABLE_ADVANCED_SECURITY}

# Environment
VITE_ENVIRONMENT=${ENVIRONMENT}
EOF

echo "✅ Environment file created successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Install AWS Amplify in web-ui: cd web-ui && npm install aws-amplify"
echo "2. Start the development server: cd web-ui && npm run dev"
echo "3. Test login at: ${CALLBACK_URL}"
echo ""
echo "🔐 To create a test user:"
echo "aws cognito-idp admin-create-user \\"
echo "  --user-pool-id ${USER_POOL_ID} \\"
echo "  --username testuser@example.com \\"
echo "  --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true \\"
echo "  --temporary-password TempPass123! \\"
echo "  --message-action SUPPRESS"