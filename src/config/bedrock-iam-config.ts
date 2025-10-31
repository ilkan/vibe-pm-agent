/**
 * IAM roles and policies configuration for AWS Bedrock Runtime API access
 * Supports Llama 3.1 Nemotron Nano 8B V1 model access
 */

/**
 * IAM policy document for Bedrock Runtime access
 */
export const BEDROCK_RUNTIME_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'BedrockModelInvocation',
      Effect: 'Allow',
      Action: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      Resource: [
        'arn:aws:bedrock:*::foundation-model/meta.llama3-1-nemotron-nano-8b-v1:0',
        'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1'
      ]
    },
    {
      Sid: 'BedrockModelAccess',
      Effect: 'Allow',
      Action: [
        'bedrock:GetFoundationModel',
        'bedrock:ListFoundationModels'
      ],
      Resource: '*'
    },
    {
      Sid: 'BedrockAgentAccess',
      Effect: 'Allow',
      Action: [
        'bedrock:GetAgent',
        'bedrock:UpdateAgent',
        'bedrock:ListAgents',
        'bedrock:InvokeAgent'
      ],
      Resource: [
        'arn:aws:bedrock:*:*:agent/IBQRX8MZJJ',
        'arn:aws:bedrock:*:*:agent/CEW45LTT2P',
        'arn:aws:bedrock:*:*:agent/ULX1RJGKCR',
        'arn:aws:bedrock:*:*:agent/PDZPQTNLYH',
        'arn:aws:bedrock:*:*:agent/SUPERVISOR001',
        'arn:aws:bedrock:*:*:agent/CITATION001'
      ]
    },
    {
      Sid: 'BedrockAgentRuntimeAccess',
      Effect: 'Allow',
      Action: [
        'bedrock-agent-runtime:InvokeAgent',
        'bedrock-agent-runtime:Retrieve',
        'bedrock-agent-runtime:RetrieveAndGenerate'
      ],
      Resource: [
        'arn:aws:bedrock:*:*:agent/IBQRX8MZJJ',
        'arn:aws:bedrock:*:*:agent/CEW45LTT2P',
        'arn:aws:bedrock:*:*:agent/ULX1RJGKCR',
        'arn:aws:bedrock:*:*:agent/PDZPQTNLYH',
        'arn:aws:bedrock:*:*:agent/SUPERVISOR001',
        'arn:aws:bedrock:*:*:agent/CITATION001'
      ]
    }
  ]
};

/**
 * IAM trust policy for Lambda execution role
 */
export const LAMBDA_TRUST_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: {
        Service: 'lambda.amazonaws.com'
      },
      Action: 'sts:AssumeRole'
    }
  ]
};

/**
 * IAM trust policy for Bedrock agents
 */
export const BEDROCK_AGENT_TRUST_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: {
        Service: 'bedrock.amazonaws.com'
      },
      Action: 'sts:AssumeRole'
    }
  ]
};

/**
 * Complete IAM role configuration for Bedrock integration
 */
export const BEDROCK_IAM_ROLE_CONFIG = {
  roleName: 'VibePMAgentBedrockRole',
  description: 'IAM role for Vibe PM Agent Bedrock integration with Nemotron model access',
  trustPolicy: LAMBDA_TRUST_POLICY,
  policies: [
    {
      name: 'BedrockRuntimeAccess',
      document: BEDROCK_RUNTIME_POLICY
    },
    {
      name: 'BasicLambdaExecution',
      arn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    }
  ]
};

/**
 * Bedrock agent role configuration
 */
export const BEDROCK_AGENT_ROLE_CONFIG = {
  roleName: 'VibePMAgentBedrockAgentRole',
  description: 'IAM role for Bedrock agents with Nemotron model access',
  trustPolicy: BEDROCK_AGENT_TRUST_POLICY,
  policies: [
    {
      name: 'BedrockAgentRuntimeAccess',
      document: BEDROCK_RUNTIME_POLICY
    }
  ]
};

/**
 * CloudFormation template for IAM resources
 */
export const BEDROCK_IAM_CLOUDFORMATION_TEMPLATE = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'IAM resources for Vibe PM Agent Bedrock integration',
  Resources: {
    BedrockExecutionRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        RoleName: BEDROCK_IAM_ROLE_CONFIG.roleName,
        Description: BEDROCK_IAM_ROLE_CONFIG.description,
        AssumeRolePolicyDocument: BEDROCK_IAM_ROLE_CONFIG.trustPolicy,
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        ],
        Policies: [
          {
            PolicyName: 'BedrockRuntimeAccess',
            PolicyDocument: BEDROCK_RUNTIME_POLICY
          }
        ]
      }
    },
    BedrockAgentRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        RoleName: BEDROCK_AGENT_ROLE_CONFIG.roleName,
        Description: BEDROCK_AGENT_ROLE_CONFIG.description,
        AssumeRolePolicyDocument: BEDROCK_AGENT_ROLE_CONFIG.trustPolicy,
        Policies: [
          {
            PolicyName: 'BedrockAgentRuntimeAccess',
            PolicyDocument: BEDROCK_RUNTIME_POLICY
          }
        ]
      }
    }
  },
  Outputs: {
    BedrockExecutionRoleArn: {
      Description: 'ARN of the Bedrock execution role',
      Value: {
        'Fn::GetAtt': ['BedrockExecutionRole', 'Arn']
      },
      Export: {
        Name: 'VibePMAgent-BedrockExecutionRoleArn'
      }
    },
    BedrockAgentRoleArn: {
      Description: 'ARN of the Bedrock agent role',
      Value: {
        'Fn::GetAtt': ['BedrockAgentRole', 'Arn']
      },
      Export: {
        Name: 'VibePMAgent-BedrockAgentRoleArn'
      }
    }
  }
};

/**
 * Terraform configuration for IAM resources
 */
export const BEDROCK_IAM_TERRAFORM_CONFIG = `
# IAM role for Lambda functions with Bedrock access
resource "aws_iam_role" "bedrock_execution_role" {
  name               = "${BEDROCK_IAM_ROLE_CONFIG.roleName}"
  description        = "${BEDROCK_IAM_ROLE_CONFIG.description}"
  assume_role_policy = jsonencode(${JSON.stringify(BEDROCK_IAM_ROLE_CONFIG.trustPolicy, null, 2)})
}

# IAM policy for Bedrock Runtime access
resource "aws_iam_policy" "bedrock_runtime_policy" {
  name        = "BedrockRuntimeAccess"
  description = "Policy for Bedrock Runtime API access"
  policy      = jsonencode(${JSON.stringify(BEDROCK_RUNTIME_POLICY, null, 2)})
}

# Attach Bedrock policy to execution role
resource "aws_iam_role_policy_attachment" "bedrock_runtime_attachment" {
  role       = aws_iam_role.bedrock_execution_role.name
  policy_arn = aws_iam_policy.bedrock_runtime_policy.arn
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.bedrock_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM role for Bedrock agents
resource "aws_iam_role" "bedrock_agent_role" {
  name               = "${BEDROCK_AGENT_ROLE_CONFIG.roleName}"
  description        = "${BEDROCK_AGENT_ROLE_CONFIG.description}"
  assume_role_policy = jsonencode(${JSON.stringify(BEDROCK_AGENT_ROLE_CONFIG.trustPolicy, null, 2)})
}

# Attach Bedrock policy to agent role
resource "aws_iam_role_policy_attachment" "bedrock_agent_runtime_attachment" {
  role       = aws_iam_role.bedrock_agent_role.name
  policy_arn = aws_iam_policy.bedrock_runtime_policy.arn
}

# Outputs
output "bedrock_execution_role_arn" {
  description = "ARN of the Bedrock execution role"
  value       = aws_iam_role.bedrock_execution_role.arn
}

output "bedrock_agent_role_arn" {
  description = "ARN of the Bedrock agent role"
  value       = aws_iam_role.bedrock_agent_role.arn
}
`;

/**
 * Environment variables for Bedrock configuration
 */
export const BEDROCK_ENVIRONMENT_VARIABLES = {
  BEDROCK_REGION: 'us-east-1',
  BEDROCK_MODEL_ID: 'meta.llama3-1-nemotron-nano-8b-v1:0',
  BEDROCK_MAX_TOKENS: '2048',
  BEDROCK_TEMPERATURE: '0.7',
  BEDROCK_EXECUTION_ROLE_ARN: '${aws_iam_role.bedrock_execution_role.arn}',
  BEDROCK_AGENT_ROLE_ARN: '${aws_iam_role.bedrock_agent_role.arn}'
};

/**
 * Validation function for IAM configuration
 */
export function validateIAMConfiguration(): boolean {
  try {
    // Validate policy documents
    JSON.stringify(BEDROCK_RUNTIME_POLICY);
    JSON.stringify(LAMBDA_TRUST_POLICY);
    JSON.stringify(BEDROCK_AGENT_TRUST_POLICY);
    
    // Validate CloudFormation template
    JSON.stringify(BEDROCK_IAM_CLOUDFORMATION_TEMPLATE);
    
    return true;
  } catch (error) {
    console.error('IAM configuration validation failed:', error);
    return false;
  }
}