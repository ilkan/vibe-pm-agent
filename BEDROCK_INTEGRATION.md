# Bedrock Agent Integration Guide

This guide walks you through connecting your React chat app to your existing Bedrock Agent.

## Prerequisites

- AWS CLI configured with appropriate permissions
- SAM CLI installed (`pip install aws-sam-cli`)
- Your Bedrock Agent ID: `ULX1RJGKCR`
- Your Cognito User Pool ID: `us-east-1_gFn54IyZ5`

## Step 1: Deploy the Lambda Function

Navigate to the Lambda function directory and deploy:

```bash
cd lambda-functions/invoke-bedrock-agent
chmod +x deploy.sh
./deploy.sh
```

This will:
- Install dependencies
- Build and deploy the Lambda function with SAM
- Create an API Gateway with Cognito authorization
- Output the API Gateway URL

## Step 2: Update Environment Variables

After deployment, copy the API Gateway URL and add it to your React app:

```bash
# In web-ui/.env.local, add:
VITE_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

## Step 3: Test the Integration

1. Start your React app:
```bash
cd web-ui
npm run dev
```

2. Open http://localhost:5173
3. Sign in with your Cognito credentials
4. Send a message in the chat

The app will now call your Bedrock Agent instead of showing mock responses.

## Step 4: Verify the Connection

Check the browser console for:
- "Bedrock Agent Service Status" log
- Any authentication or API errors

The header should show "online" status when properly configured.

## Troubleshooting

### "Bedrock Agent not configured" Error
- Ensure VITE_API_GATEWAY_URL is set in .env.local
- Restart your dev server after adding the environment variable

### Authentication Errors
- Verify your Cognito user pool ID matches in both the Lambda template and .env.local
- Check that your user is properly authenticated

### Lambda Deployment Issues
- Ensure AWS CLI is configured with proper permissions
- Check that SAM CLI is installed and working
- Verify the Bedrock Agent ID exists and is accessible

### API Gateway CORS Issues
- The Lambda function includes CORS headers
- If issues persist, check the API Gateway CORS configuration

## Testing Commands

Test the API directly with curl:

```bash
# Get your JWT token from the browser dev tools (localStorage or sessionStorage)
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/invoke \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{"text":"Hello, what can you help me with?"}'
```

## Next Steps

Once the basic integration is working:

1. **Add Streaming**: Implement streaming responses for better UX
2. **Error Handling**: Enhance error messages and retry logic  
3. **Citations**: Extract and display citations from agent responses
4. **Tool Tracking**: Show which MCP tools the agent is using
5. **Session Management**: Implement proper conversation persistence

## Architecture

```
React App (Port 5173) 
  ↓ (Authenticated with Cognito JWT)
API Gateway 
  ↓ (Cognito Authorizer)
Lambda Function (invoke-bedrock-agent)
  ↓ (BedrockAgentRuntimeClient)
Bedrock Agent (ULX1RJGKCR)
  ↓ (Action Groups)
Your MCP Lambda (vibe-pm-agent-dev)
```

Your chat app is now connected to your Bedrock Agent! 🎉