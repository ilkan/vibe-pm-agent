#!/bin/bash

# Create a test user in Cognito User Pool
set -e

ENVIRONMENT=${1:-dev}
EMAIL=${2:-testuser@example.com}
TEMP_PASSWORD=${3:-TempPass123!}

STACK_NAME="vibe-pm-agent-cognito-${ENVIRONMENT}"

echo "👤 Creating test user in Cognito..."
echo "   Environment: ${ENVIRONMENT}"
echo "   Email: ${EMAIL}"
echo "   Temporary Password: ${TEMP_PASSWORD}"
echo ""

# Get User Pool ID from CloudFormation stack
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --region us-east-1)

if [ -z "$USER_POOL_ID" ]; then
    echo "❌ Could not find User Pool ID. Make sure the Cognito stack is deployed."
    echo "   Run: ./scripts/deploy-cognito.sh ${ENVIRONMENT}"
    exit 1
fi

echo "🔍 Found User Pool ID: ${USER_POOL_ID}"

# Create the user
aws cognito-idp admin-create-user \
  --user-pool-id "${USER_POOL_ID}" \
  --username "${EMAIL}" \
  --user-attributes Name=email,Value="${EMAIL}" Name=email_verified,Value=true \
  --temporary-password "${TEMP_PASSWORD}" \
  --message-action SUPPRESS \
  --region us-east-1

echo ""
echo "✅ Test user created successfully!"
echo ""
echo "📋 Login Details:"
echo "   Email: ${EMAIL}"
echo "   Temporary Password: ${TEMP_PASSWORD}"
echo ""
echo "🔐 The user will be prompted to set a permanent password on first login."
echo "   Password requirements:"
echo "   - At least 8 characters"
echo "   - Must contain uppercase and lowercase letters"
echo "   - Must contain at least one number"
echo ""
echo "🌐 Test the login at your web application URL"