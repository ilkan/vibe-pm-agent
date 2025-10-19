#!/bin/bash

# Simple fix for existing Cognito client
set -e

USER_POOL_ID="us-east-1_kVNzgV981"
CLIENT_ID="410s27g961agf7pprrdmoc5cur"
DOMAIN="us-east-1kvnzgv981"

echo "🔧 Fixing existing Cognito client configuration..."

# First, make sure the domain exists
echo "Ensuring domain exists..."
aws cognito-idp describe-user-pool-domain --domain "$DOMAIN" 2>/dev/null || {
    echo "Creating domain..."
    aws cognito-idp create-user-pool-domain \
        --user-pool-id "$USER_POOL_ID" \
        --domain "$DOMAIN"
    echo "✅ Domain created"
}

# Update the existing client to work with OAuth
echo "Updating client configuration..."
aws cognito-idp update-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID" \
  --client-name "vibe-pm-agent" \
  --callback-urls "http://localhost:5173" \
  --logout-urls "http://localhost:5173/logout" \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "email" "openid" "profile" \
  --allowed-o-auth-flows-user-pool-client \
  --supported-identity-providers "COGNITO" \
  --explicit-auth-flows "ALLOW_USER_SRP_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
  --prevent-user-existence-errors ENABLED \
  --enable-token-revocation

# Create test user
echo "Creating test user..."
TEST_EMAIL="test@vibepm.com"
TEMP_PASSWORD="TempPass123!"

aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$TEST_EMAIL" \
  --user-attributes Name=email,Value="$TEST_EMAIL" Name=email_verified,Value=true \
  --temporary-password "$TEMP_PASSWORD" \
  --message-action SUPPRESS || echo "User might already exist"

echo ""
echo "✅ Configuration updated!"
echo ""
echo "🔐 Test Login:"
echo "Email: $TEST_EMAIL"
echo "Password: $TEMP_PASSWORD (change on first login)"
echo ""
echo "🌐 Test the hosted UI directly:"
echo "https://$DOMAIN.auth.us-east-1.amazoncognito.com/login?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:5173"
echo ""
echo "🚀 Restart your dev server and try again!"