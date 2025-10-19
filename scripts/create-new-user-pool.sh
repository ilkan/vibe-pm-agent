#!/bin/bash

# Create new Cognito User Pool for Vibe PM Agent
set -e

POOL_NAME="vibe-pm-agent-pool"
CLIENT_NAME="vibe-pm-agent-spa"
DOMAIN_PREFIX="vibe-pm-agent-$(date +%s)"

echo "🚀 Creating new Cognito User Pool: $POOL_NAME"

# Create User Pool
echo "Creating user pool..."
USER_POOL=$(aws cognito-idp create-user-pool \
  --pool-name "$POOL_NAME" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --verification-message-template '{
    "DefaultEmailOption": "CONFIRM_WITH_CODE",
    "EmailSubject": "Vibe PM Agent - Verify your email",
    "EmailMessage": "Your verification code is {####}"
  }' \
  --admin-create-user-config '{
    "AllowAdminCreateUserOnly": false,
    "InviteMessageTemplate": {
      "EmailSubject": "Welcome to Vibe PM Agent",
      "EmailMessage": "Your username is {username} and temporary password is {####}"
    }
  }' \
  --user-pool-tags '{
    "Project": "vibe-pm-agent",
    "Environment": "dev"
  }')

USER_POOL_ID=$(echo "$USER_POOL" | jq -r '.UserPool.Id')
echo "✅ User Pool created: $USER_POOL_ID"

# Create User Pool Client (SPA - no secret)
echo "Creating user pool client..."
CLIENT=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-name "$CLIENT_NAME" \
  --callback-urls "http://localhost:5173" \
  --logout-urls "http://localhost:5173/logout" \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "email" "openid" "profile" \
  --allowed-o-auth-flows-user-pool-client \
  --supported-identity-providers "COGNITO" \
  --explicit-auth-flows "ALLOW_USER_SRP_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
  --prevent-user-existence-errors ENABLED \
  --enable-token-revocation \
  --access-token-validity 60 \
  --id-token-validity 60 \
  --refresh-token-validity 30 \
  --token-validity-units '{
    "AccessToken": "minutes",
    "IdToken": "minutes", 
    "RefreshToken": "days"
  }')

CLIENT_ID=$(echo "$CLIENT" | jq -r '.UserPoolClient.ClientId')
echo "✅ Client created: $CLIENT_ID"

# Create User Pool Domain
echo "Creating user pool domain..."
aws cognito-idp create-user-pool-domain \
  --user-pool-id "$USER_POOL_ID" \
  --domain "$DOMAIN_PREFIX"

echo "✅ Domain created: $DOMAIN_PREFIX"

# Create test user
echo "Creating test user..."
TEST_EMAIL="test@vibepm.com"
TEMP_PASSWORD="TempPass123!"

aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$TEST_EMAIL" \
  --user-attributes Name=email,Value="$TEST_EMAIL" Name=email_verified,Value=true \
  --temporary-password "$TEMP_PASSWORD" \
  --message-action SUPPRESS

echo "✅ Test user created"

# Update .env.local
echo "Updating .env.local..."
cat > web-ui/.env.local << EOF
# AWS Cognito Configuration - Vibe PM Agent (New Pool)
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$CLIENT_ID
VITE_COGNITO_DOMAIN=https://$DOMAIN_PREFIX.auth.us-east-1.amazoncognito.com
VITE_CALLBACK_URL=http://localhost:5173
VITE_LOGOUT_URL=http://localhost:5173/logout

# Enhanced OAuth Endpoints
VITE_OAUTH_AUTHORIZE_URL=https://$DOMAIN_PREFIX.auth.us-east-1.amazoncognito.com/oauth2/authorize
VITE_OAUTH_TOKEN_URL=https://$DOMAIN_PREFIX.auth.us-east-1.amazoncognito.com/oauth2/token
VITE_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/$USER_POOL_ID/.well-known/jwks.json

# Security Configuration
VITE_MFA_ENABLED=OPTIONAL
VITE_ADVANCED_SECURITY=OFF

# Environment
VITE_ENVIRONMENT=dev

# Development mode (set to false for real auth)
VITE_DEV_MODE=false
EOF

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Configuration:"
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo "Domain: https://$DOMAIN_PREFIX.auth.us-east-1.amazoncognito.com"
echo ""
echo "🔐 Test Login:"
echo "Email: $TEST_EMAIL"
echo "Temporary Password: $TEMP_PASSWORD"
echo ""
echo "🌐 Test Hosted UI:"
echo "https://$DOMAIN_PREFIX.auth.us-east-1.amazoncognito.com/login?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:5173"
echo ""
echo "🚀 Next Steps:"
echo "1. Restart your dev server: cd web-ui && npm run dev"
echo "2. Go to http://localhost:5173"
echo "3. Click 'Sign in with AWS Cognito'"
echo "4. Use the test credentials above"
echo "5. You'll be prompted to set a permanent password"