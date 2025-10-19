#!/bin/bash

# Test and fix Cognito setup
set -e

USER_POOL_ID="us-east-1_kVNzgV981"
CLIENT_ID="410s27g961agf7pprrdmoc5cur"
DOMAIN="us-east-1kvnzgv981"

echo "🔍 Testing Cognito configuration..."

# Check if domain exists and is available
echo "Checking domain status..."
aws cognito-idp describe-user-pool-domain --domain "$DOMAIN" || {
    echo "❌ Domain not found or not available"
    echo "Creating domain..."
    aws cognito-idp create-user-pool-domain \
        --user-pool-id "$USER_POOL_ID" \
        --domain "$DOMAIN"
    echo "✅ Domain created"
}

# Check client configuration
echo "Checking client configuration..."
aws cognito-idp describe-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-id "$CLIENT_ID" \
    --query 'UserPoolClient.{CallbackURLs:CallbackURLs,LogoutURLs:LogoutURLs,AllowedOAuthFlows:AllowedOAuthFlows,AllowedOAuthScopes:AllowedOAuthScopes}'

# Create a test user
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
echo "✅ Setup complete!"
echo ""
echo "🔐 Test Login:"
echo "Email: $TEST_EMAIL"
echo "Password: $TEMP_PASSWORD (you'll be asked to change it)"
echo ""
echo "🌐 Hosted UI URL:"
echo "https://$DOMAIN.auth.us-east-1.amazoncognito.com/login?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:5173"