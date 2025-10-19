# AWS Q Developer Enhanced Cognito Setup Guide

This guide provides AWS Q Developer recommended best practices for implementing Amazon Cognito authentication in the Vibe PM Agent web application.

## 🎯 Architecture Overview

Our implementation follows AWS Q Developer recommendations for secure, scalable authentication:

### Authentication Flow
```
User → Web App → Cognito Managed Login → OAuth 2.0 Authorization Code Grant → JWT Tokens → Authenticated Session
```

### Security Features
- **Advanced Security**: Risk-based authentication with adaptive authentication
- **MFA Support**: SMS and TOTP (Software Token) multi-factor authentication
- **Enhanced Password Policy**: Strong password requirements with symbol requirements
- **Token Management**: Short-lived access tokens (1 hour) with secure refresh tokens (30 days)
- **Device Tracking**: Remember trusted devices and challenge new devices

## 🔧 Quick Setup

### 1. Deploy Enhanced Cognito Stack

```bash
# Development environment with optional MFA
./scripts/deploy-cognito.sh dev http://localhost:3000 http://localhost:3000/logout OPTIONAL ENFORCED

# Production environment with required MFA
./scripts/deploy-cognito.sh prod https://your-domain.com https://your-domain.com/logout ON ENFORCED
```

### 2. Install Dependencies

```bash
cd web-ui
npm install aws-amplify@^6.0.0
```

### 3. Create Test User

```bash
./scripts/create-test-user.sh dev testuser@example.com TempPass123!
```

## 🛡️ Security Best Practices (AWS Q Developer Recommended)

### 1. OAuth 2.0 Configuration
- **Grant Type**: Authorization Code Grant (most secure)
- **Scopes**: `email`, `openid`, `profile`, `aws.cognito.signin.user.admin`
- **PKCE**: Automatically handled by AWS Amplify
- **State Parameter**: Automatically included for CSRF protection

### 2. Token Security
```typescript
// Token Validity Settings (CloudFormation)
AccessTokenValidity: 60        // 1 hour (recommended)
IdTokenValidity: 60           // 1 hour (recommended)
RefreshTokenValidity: 30      // 30 days (recommended)
```

### 3. Advanced Security Features
- **Risk-Based Authentication**: Automatically detects suspicious sign-in attempts
- **Device Fingerprinting**: Tracks device characteristics for security
- **Geo-Location Blocking**: Can block sign-ins from specific regions
- **Compromised Credentials Detection**: Checks against known compromised passwords

### 4. MFA Configuration
```yaml
# CloudFormation Configuration
MfaConfiguration: OPTIONAL  # or ON for required MFA
EnabledMfas:
  - SMS_MFA
  - SOFTWARE_TOKEN_MFA
```

## 🔍 AWS Q Developer Insights

### Performance Optimizations
1. **Token Caching**: AWS Amplify automatically caches tokens in secure storage
2. **Session Management**: Automatic token refresh before expiration
3. **Connection Pooling**: Reuse HTTP connections for better performance

### Security Recommendations
1. **Environment Variables**: Never commit credentials to version control
2. **HTTPS Only**: Always use HTTPS in production
3. **Domain Validation**: Validate callback URLs match your application domain
4. **Regular Rotation**: Rotate client secrets regularly (if using confidential clients)

### Monitoring & Logging
```yaml
# CloudWatch Integration
CognitoLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: !Sub '/aws/cognito/userpool/${UserPool}'
    RetentionInDays: 30
```

## 📊 Configuration Details

### User Pool Settings
```yaml
# Enhanced User Pool Configuration
UserPool:
  Properties:
    # Authentication
    AliasAttributes: [email, preferred_username]
    UsernameAttributes: [email]
    
    # Security
    UserPoolAddOns:
      AdvancedSecurityMode: ENFORCED
    
    # Password Policy
    Policies:
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: true
        TemporaryPasswordValidityDays: 7
    
    # MFA
    MfaConfiguration: OPTIONAL
    EnabledMfas: [SMS_MFA, SOFTWARE_TOKEN_MFA]
    
    # Device Management
    DeviceConfiguration:
      ChallengeRequiredOnNewDevice: true
      DeviceOnlyRememberedOnUserPrompt: false
```

### App Client Settings
```yaml
# Public Client Configuration (Web App)
UserPoolClient:
  Properties:
    GenerateSecret: false  # Public client
    
    # OAuth 2.0
    AllowedOAuthFlows: [code]
    AllowedOAuthScopes: 
      - email
      - openid
      - profile
      - aws.cognito.signin.user.admin
    
    # Security
    PreventUserExistenceErrors: ENABLED
    EnableTokenRevocation: true
    
    # Token Validity
    AccessTokenValidity: 60    # 1 hour
    IdTokenValidity: 60       # 1 hour
    RefreshTokenValidity: 30  # 30 days
```

## 🔧 Implementation Examples

### 1. Enhanced Auth Service
```typescript
// Enhanced Cognito Configuration
const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: process.env.VITE_COGNITO_DOMAIN?.replace('https://', ''),
          scopes: ['email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: [process.env.VITE_CALLBACK_URL],
          redirectSignOut: [process.env.VITE_LOGOUT_URL],
          responseType: 'code',
        },
      },
    },
  },
};
```

### 2. Error Handling
```typescript
// Comprehensive Error Handling
try {
  await signInWithRedirect({ provider: 'Cognito' });
} catch (error) {
  if (error.name === 'UserNotConfirmedException') {
    // Handle unconfirmed user
  } else if (error.name === 'NotAuthorizedException') {
    // Handle invalid credentials
  } else if (error.name === 'TooManyRequestsException') {
    // Handle rate limiting
  }
}
```

### 3. Token Validation
```typescript
// Validate JWT Tokens
import { fetchAuthSession } from 'aws-amplify/auth';

const validateToken = async () => {
  try {
    const session = await fetchAuthSession();
    const { accessToken, idToken } = session.tokens ?? {};
    
    // Verify token expiration
    if (accessToken?.payload.exp < Date.now() / 1000) {
      // Token expired, refresh automatically handled by Amplify
    }
    
    return session;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw error;
  }
};
```

## 🚀 Production Deployment

### 1. Environment Configuration
```bash
# Production deployment
./scripts/deploy-cognito.sh prod https://app.vibe-pm-agent.com https://app.vibe-pm-agent.com/logout ON ENFORCED
```

### 2. Custom Domain (Optional)
```yaml
# Custom Domain Configuration
UserPoolDomain:
  Type: AWS::Cognito::UserPoolDomain
  Properties:
    Domain: auth.vibe-pm-agent.com
    UserPoolId: !Ref UserPool
    CustomDomainConfig:
      CertificateArn: !Ref SSLCertificate
```

### 3. Monitoring Setup
```bash
# Enable CloudWatch monitoring
aws logs create-log-group --log-group-name /aws/cognito/userpool/vibe-pm-agent-prod
aws logs put-retention-policy --log-group-name /aws/cognito/userpool/vibe-pm-agent-prod --retention-in-days 30
```

## 🔍 Troubleshooting

### Common Issues

1. **Invalid Redirect URI**
   ```
   Error: redirect_uri_mismatch
   Solution: Verify callback URLs in User Pool Client settings
   ```

2. **Token Validation Errors**
   ```
   Error: Invalid JWT token
   Solution: Check JWKS URL and token expiration
   ```

3. **MFA Setup Issues**
   ```
   Error: MFA token invalid
   Solution: Verify TOTP app time synchronization
   ```

### Debug Commands
```bash
# Check User Pool configuration
aws cognito-idp describe-user-pool --user-pool-id us-east-1_xxxxxxxxx

# Check User Pool Client settings
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_xxxxxxxxx \
  --client-id xxxxxxxxxxxxxxxxxxxxxxxxxx

# Test OAuth endpoints
curl -X GET "https://your-domain.auth.us-east-1.amazoncognito.com/.well-known/openid_configuration"
```

## 📚 Additional Resources

- [AWS Cognito Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings-security.html)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [AWS Amplify Auth Documentation](https://docs.amplify.aws/javascript/build-a-backend/auth/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

## 🎯 Next Steps

1. **Enable Social Providers**: Add Google, Facebook, Apple sign-in
2. **Custom Attributes**: Add business-specific user attributes
3. **Lambda Triggers**: Implement custom authentication flows
4. **API Gateway Integration**: Secure your APIs with Cognito authorizers
5. **Advanced Analytics**: Integrate with Amazon Pinpoint for user analytics