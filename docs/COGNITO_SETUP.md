# AWS Cognito Authentication Setup

This guide walks you through setting up AWS Cognito authentication for the Vibe PM Agent web UI.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws sts get-caller-identity
   ```

2. **Node.js and npm** (for the web UI)
   ```bash
   node --version
   npm --version
   ```

## Quick Setup

Run the automated setup script:

```bash
./scripts/setup-auth.sh dev http://localhost:3000
```

This will:
- Deploy AWS Cognito User Pool and App Client
- Configure the web UI with environment variables
- Install necessary dependencies

## Manual Setup

### 1. Deploy Cognito Resources

```bash
./scripts/deploy-cognito.sh dev http://localhost:3000 http://localhost:3000/logout
```

### 2. Install Dependencies

```bash
cd web-ui
npm install
```

### 3. Configure Environment

Copy the generated `.env.local` file or create it manually:

```bash
cp web-ui/.env.template web-ui/.env.local
```

Fill in the values from the CloudFormation stack outputs.

### 4. Create Test User

```bash
./scripts/create-test-user.sh dev testuser@example.com TempPass123!
```

### 5. Start Development Server

```bash
cd web-ui
npm run dev
```

## Architecture

### Authentication Flow

1. **User clicks "Sign in with AWS Cognito"**
2. **Redirect to Cognito Hosted UI** - User enters credentials
3. **OAuth callback** - Cognito redirects back with authorization code
4. **Token exchange** - AWS Amplify handles token exchange automatically
5. **User session** - App receives user info and access tokens

### Components

- **`/src/services/auth.ts`** - Authentication service using AWS Amplify
- **`/src/components/Login.tsx`** - Login page with Cognito integration
- **`/src/components/AuthCallback.tsx`** - Handles OAuth callback
- **`/src/App.tsx`** - Main app with authentication state management

### AWS Resources

- **Cognito User Pool** - Manages users and authentication
- **User Pool Client** - OAuth 2.0 client configuration
- **User Pool Domain** - Hosted UI domain for authentication

## Configuration

### Environment Variables

```bash
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=https://your-domain.auth.us-east-1.amazoncognito.com
VITE_CALLBACK_URL=http://localhost:3000
VITE_LOGOUT_URL=http://localhost:3000/logout
```

### Cognito Configuration

- **OAuth Flows**: Authorization Code Grant
- **OAuth Scopes**: `email`, `openid`, `profile`
- **Callback URLs**: Your web app URL
- **Logout URLs**: Your web app logout URL
- **Identity Providers**: Cognito User Pool

## User Management

### Create User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

### Set Permanent Password

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username user@example.com \
  --password NewPassword123! \
  --permanent
```

### Delete User

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username user@example.com
```

## Troubleshooting

### Common Issues

1. **"User does not exist" error**
   - Make sure the user is created in the correct User Pool
   - Check that email verification is not required

2. **Redirect URI mismatch**
   - Verify callback URLs in User Pool Client settings
   - Ensure environment variables match your local development URL

3. **CORS errors**
   - Check that your domain is properly configured in Cognito
   - Verify the Cognito domain URL is correct

4. **Token validation errors**
   - Ensure AWS region is correctly configured
   - Check that User Pool ID and Client ID are correct

### Debug Authentication

Enable debug logging in the browser console:

```javascript
// In browser dev tools
localStorage.setItem('aws-amplify:debug', 'true');
```

### Check Cognito Configuration

```bash
# Get User Pool details
aws cognito-idp describe-user-pool --user-pool-id us-east-1_xxxxxxxxx

# Get User Pool Client details
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_xxxxxxxxx \
  --client-id xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Production Deployment

### Update Callback URLs

For production deployment, update the CloudFormation parameters:

```bash
./scripts/deploy-cognito.sh prod https://your-domain.com https://your-domain.com/logout
```

### Environment Variables

Update production environment variables:

```bash
VITE_CALLBACK_URL=https://your-domain.com
VITE_LOGOUT_URL=https://your-domain.com/logout
```

### Security Considerations

1. **Use HTTPS in production**
2. **Configure proper CORS settings**
3. **Set up CloudWatch logging for Cognito events**
4. **Enable MFA for sensitive accounts**
5. **Configure password policies appropriately**

## Next Steps

1. **Customize the login UI** - Modify the Login component styling
2. **Add user profile management** - Allow users to update their profiles
3. **Implement role-based access** - Add user groups and permissions
4. **Set up MFA** - Enable multi-factor authentication
5. **Add social providers** - Configure Google, Facebook, etc.

## Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Auth Documentation](https://docs.amplify.aws/javascript/build-a-backend/auth/)
- [Cognito Hosted UI Customization](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-ui-customization.html)