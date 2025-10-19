# Bedrock Agent Proxy Server

A local Node.js proxy server that connects your React chat app to AWS Bedrock Agent, bypassing Lambda deployment issues.

## Features

- 🔐 **Cognito JWT Authentication** - Verifies tokens from your React app
- 🤖 **Bedrock Agent Integration** - Direct connection to your agent
- 🌐 **CORS Support** - Works with your React dev server
- 📝 **Request Logging** - Monitor all interactions
- ⚡ **Fast & Lightweight** - No cold starts like Lambda

## Quick Start

1. **Install dependencies:**
```bash
cd bedrock-proxy-server
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your values (already configured)
```

3. **Start the server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

4. **Update your React app:**
```bash
# In web-ui/.env.local, set:
VITE_API_GATEWAY_URL=http://localhost:3001
```

5. **Test the connection:**
```bash
curl http://localhost:3001/health
```

## How It Works

```
React App (Port 5173) 
  ↓ (HTTP Request with Cognito JWT)
Proxy Server (Port 3001)
  ↓ (Verify JWT with Cognito JWKS)
  ↓ (BedrockAgentRuntimeClient)
Bedrock Agent (ULX1RJGKCR)
  ↓ (Action Groups)
Your MCP Lambda (vibe-pm-agent-dev)
```

## API Endpoints

### `GET /health`
Health check endpoint
```json
{
  "status": "healthy",
  "timestamp": "2024-10-19T16:30:00.000Z",
  "config": {
    "bedrockAgentId": "ULX1RJGKCR",
    "region": "us-east-1",
    "port": 3001
  }
}
```

### `POST /invoke`
Invoke Bedrock Agent (requires Authorization header)
```bash
curl -X POST http://localhost:3001/invoke \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{"text":"Hello, what can you help me with?"}'
```

## Authentication

The server verifies Cognito JWT tokens by:
1. Extracting the token from `Authorization: Bearer <token>` header
2. Fetching the JWKS from Cognito
3. Verifying the token signature and claims
4. Allowing the request if valid

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BEDROCK_AGENT_ID` | Your Bedrock Agent ID | `ULX1RJGKCR` |
| `BEDROCK_AGENT_ALIAS_ID` | Agent alias ID | `TSTALIASID` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | `us-east-1_gFn54IyZ5` |
| `COGNITO_REGION` | Cognito region | `us-east-1` |
| `PORT` | Server port | `3001` |

## AWS Credentials

The server uses your existing AWS credentials from:
- AWS CLI profile (`~/.aws/credentials`)
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- IAM roles (if running on EC2)

## Troubleshooting

### "Token verification failed"
- Check that your React app is sending the correct JWT token
- Verify the Cognito User Pool ID is correct
- Ensure the token hasn't expired

### "Failed to invoke Bedrock Agent"
- Verify your AWS credentials have Bedrock permissions
- Check that the Agent ID `ULX1RJGKCR` exists and is accessible
- Ensure the agent is in the correct region

### CORS Issues
- The server allows `localhost:5173` and `localhost:3000` by default
- Add your domain to the CORS origins if needed

## Production Deployment

For production, you can deploy this server to:
- **AWS App Runner** - Serverless container platform
- **AWS ECS/Fargate** - Container orchestration
- **AWS EC2** - Virtual machines
- **Heroku/Railway** - Platform as a Service
- **Docker** - Containerized deployment

## Next Steps

Once this is working:
1. Add request rate limiting
2. Implement request/response caching
3. Add metrics and monitoring
4. Set up SSL/TLS for production
5. Add request validation and sanitization