#!/bin/bash

# Fix Cognito client for SPA (Single Page Application)
set -e

USER_POOL_ID="us-east-1_kVNzgV981"
OLD_CLIENT_ID="410s27g961agf7pprrdmoc5cur"

echo "🔧 Creating new Cognito client without secret for SPA..."

# Delete the old client with secret
echo "Deleting old client with secret..."
aws cognito-idp delete-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$OLD_CLIENT_ID"

# Create new client without secret
echo "Creating new SPA client..."
NEW_CLIENT=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-name "vibe-pm-agent-spa" \
  --callback-urls "http://localhost:5173" \
  --logout-urls "http://localhost:5173/logout" \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "email" "openid" "profile" \
  --allowed-o-auth-flows-user-pool-client \
  --supported-identity-providers "COGNITO" \
  --explicit-auth-flows "ALLOW_USER_SRP_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
  --prevent-user-existence-errors ENABLED \
  --generate-secret false)

NEW_CLIENT_ID=$(echo "$NEW_CLIENT" | jq -r '.UserPoolClient.ClientId')

echo "✅ New SPA client created!"
echo "New Client ID: $NEW_CLIENT_ID"

# Update .env.local
echo "Updating .env.local..."
sed -i.bak "s/VITE_COGNITO_CLIENT_ID=.*/VITE_COGNITO_CLIENT_ID=$NEW_CLIENT_ID/" web-ui/.env.local

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
echo "✅ Setup complete!"
echo ""
echo "🔐 Test Login Credentials:"
echo "Email: $TEST_EMAIL"
echo "Temporary Password: $TEMP_PASSWORD"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Go to http://localhost:5173"
echo "3. Click 'Sign in with AWS Cognito'"
echo "4. Use the credentials above"
echo "5. You'll be prompted to set a permanent password"