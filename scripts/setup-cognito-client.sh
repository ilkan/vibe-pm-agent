#!/bin/bash

# Setup Cognito client for web-ui authentication
set -e

USER_POOL_ID="us-east-1_kVNzgV981"
CLIENT_ID="410s27g961agf7pprrdmoc5cur"
CALLBACK_URL="http://localhost:5173"
LOGOUT_URL="http://localhost:5173/logout"

echo "🔧 Configuring Cognito client for OAuth..."

# Update the client with proper OAuth settings
aws cognito-idp update-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID" \
  --callback-urls "$CALLBACK_URL" \
  --logout-urls "$LOGOUT_URL" \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "email" "openid" "profile" \
  --allowed-o-auth-flows-user-pool-client \
  --supported-identity-providers "COGNITO" \
  --explicit-auth-flows "ALLOW_USER_SRP_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" "ALLOW_USER_AUTH"

echo "✅ Cognito client configured successfully!"

echo ""
echo "🔐 Creating test user..."

# Create a test user
TEST_EMAIL="test@example.com"
TEMP_PASSWORD="TempPass123!"

aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$TEST_EMAIL" \
  --user-attributes Name=email,Value="$TEST_EMAIL" Name=email_verified,Value=true \
  --temporary-password "$TEMP_PASSWORD" \
  --message-action SUPPRESS || echo "User might already exist"

echo "✅ Test user created!"
echo ""
echo "📋 Login Details:"
echo "Email: $TEST_EMAIL"
echo "Temporary Password: $TEMP_PASSWORD"
echo "Callback URL: $CALLBACK_URL"
echo ""
echo "🚀 Next steps:"
echo "1. Run: cd web-ui && npm run dev"
echo "2. Open: http://localhost:5173"
echo "3. Click 'Sign in with AWS Cognito'"
echo "4. Use the credentials above"
echo "5. You'll be prompted to set a new password on first login"