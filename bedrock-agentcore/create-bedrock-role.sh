#!/bin/bash

# Create IAM role for Bedrock agents with proper permissions

set -e

ROLE_NAME="AmazonBedrockExecutionRoleForAgents_vibe-pm"
LAMBDA_ARN="arn:aws:lambda:us-east-1:119370291155:function:vibe-pm-agent-lambda"

echo "🔐 Creating Bedrock execution role: $ROLE_NAME"

# Create trust policy for Bedrock
cat > bedrock-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "bedrock.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

# Create the role
aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document file://bedrock-trust-policy.json \
    --description "Execution role for Vibe PM Agent Bedrock agents"

echo "✅ Role created: $ROLE_NAME"

# Attach AWS managed policy for Bedrock
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"

echo "✅ Attached AmazonBedrockFullAccess policy"

# Create custom policy for Lambda invocation
cat > lambda-invoke-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": "$LAMBDA_ARN"
        }
    ]
}
EOF

# Attach Lambda invoke policy
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "LambdaInvokePolicy" \
    --policy-document file://lambda-invoke-policy.json

echo "✅ Attached Lambda invoke policy"

# Create policy for Bedrock model invocation
cat > bedrock-model-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
                "arn:aws:bedrock:*::foundation-model/*"
            ]
        }
    ]
}
EOF

# Attach Bedrock model policy
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "BedrockModelInvokePolicy" \
    --policy-document file://bedrock-model-policy.json

echo "✅ Attached Bedrock model invoke policy"

# Clean up temporary files
rm bedrock-trust-policy.json lambda-invoke-policy.json bedrock-model-policy.json

echo ""
echo "🎉 Bedrock execution role created successfully!"
echo "Role ARN: arn:aws:iam::119370291155:role/$ROLE_NAME"
echo ""
echo "Waiting 10 seconds for role propagation..."
sleep 10
echo "✅ Role should be ready for use"