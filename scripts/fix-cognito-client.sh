#!/bin/bash

# Fix Cognito client configuration for SPA (no client secret)
set -e

USER_POOL_ID="us-east-1_kVNzgV981"
CLIENT_ID="410s27g961agf7pprrdmoc5cur"

echo "🔧 Updating Cognito client to remove client secret (better for SPAs)..."

# Delete the existing client
aws cognito-idp delete-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID"

echo "✅ Old client deleted"

# Create a new client without client secret
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
  --generate-secret false \
  --prevent-user-existence-errors ENABLED)

NEW_CLIENT_ID=$(echo "$NEW_CLIENT" | jq -r '.UserPoolClient.ClientId')

echo "✅ New client created without secret!"
echo "New Client ID: $NEW_CLIENT_ID"

# Update the .env.local file
sed -i.bak "s/VITE_COGNITO_CLIENT_ID=.*/VITE_COGNITO_CLIENT_ID=$NEW_CLIENT_ID/" web-ui/.env.local

echo "✅ Updated .env.local with new client ID"
echo ""
echo "🚀 Please restart your web-ui server:"
echo "cd web-ui && npm run dev"