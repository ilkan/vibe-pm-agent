#!/bin/bash

# Update existing Cognito client for proper SPA OAuth flow
set -e

USER_POOL_ID="us-east-1_kVNzgV981"
CLIENT_ID="410s27g961agf7pprrdmoc5cur"

echo "🔧 Updating Cognito client for SPA OAuth flow..."

# Update the existing client to work properly with SPAs
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

echo "✅ Cognito client updated successfully!"
echo ""
echo "🚀 Try the authentication flow again:"
echo "1. Go to http://localhost:5173"
echo "2. Click 'Sign in with AWS Cognito'"
echo "3. Complete login and you should be redirected back"