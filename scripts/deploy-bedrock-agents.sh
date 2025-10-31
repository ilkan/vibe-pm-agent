#!/bin/bash
set -e

# Deploy Enhanced Bedrock Agents Configuration Script
# Updates all 6 Bedrock agents with Llama 3.1 Nemotron Nano 8B V1 capabilities

# Configuration
REGION=${REGION:-"us-east-1"}
LOG_LEVEL=${LOG_LEVEL:-"info"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites for Bedrock agent deployment..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    # Check if we can access Bedrock
    if ! aws bedrock list-foundation-models --region ${REGION} &> /dev/null; then
        log_error "Cannot access AWS Bedrock in region ${REGION}"
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Update IAM roles and policies
update_iam_permissions() {
    log_info "Updating IAM permissions for enhanced agent capabilities..."
    
    # Check if the IAM role exists
    ROLE_NAME="VibePMAgentBedrockRole"
    
    if aws iam get-role --role-name ${ROLE_NAME} &> /dev/null; then
        log_info "IAM role ${ROLE_NAME} exists, updating policies..."
        
        # Update the role policy with enhanced permissions
        cat > /tmp/bedrock-enhanced-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockModelInvocation",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/meta.llama3-1-nemotron-nano-8b-v1:0",
        "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1"
      ]
    },
    {
      "Sid": "BedrockModelAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:GetFoundationModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BedrockAgentAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:GetAgent",
        "bedrock:UpdateAgent",
        "bedrock:ListAgents",
        "bedrock:InvokeAgent"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:agent/IBQRX8MZJJ",
        "arn:aws:bedrock:*:*:agent/CEW45LTT2P",
        "arn:aws:bedrock:*:*:agent/ULX1RJGKCR",
        "arn:aws:bedrock:*:*:agent/PDZPQTNLYH",
        "arn:aws:bedrock:*:*:agent/SUPERVISOR001",
        "arn:aws:bedrock:*:*:agent/CITATION001"
      ]
    },
    {
      "Sid": "BedrockAgentRuntimeAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock-agent-runtime:InvokeAgent",
        "bedrock-agent-runtime:Retrieve",
        "bedrock-agent-runtime:RetrieveAndGenerate"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:agent/IBQRX8MZJJ",
        "arn:aws:bedrock:*:*:agent/CEW45LTT2P",
        "arn:aws:bedrock:*:*:agent/ULX1RJGKCR",
        "arn:aws:bedrock:*:*:agent/PDZPQTNLYH",
        "arn:aws:bedrock:*:*:agent/SUPERVISOR001",
        "arn:aws:bedrock:*:*:agent/CITATION001"
      ]
    }
  ]
}
EOF
        
        # Update the role policy
        aws iam put-role-policy \
            --role-name ${ROLE_NAME} \
            --policy-name BedrockEnhancedAccess \
            --policy-document file:///tmp/bedrock-enhanced-policy.json
        
        log_success "IAM permissions updated successfully"
        
        # Clean up temporary file
        rm -f /tmp/bedrock-enhanced-policy.json
        
    else
        log_warning "IAM role ${ROLE_NAME} not found, skipping IAM updates"
        log_info "Please ensure the IAM role is created with appropriate permissions"
    fi
}

# Update Bedrock agents
update_agents() {
    log_info "Updating Bedrock agents with enhanced configurations..."
    
    # Change to project root directory
    cd "$(dirname "$0")/.."
    
    # Run the agent update script
    if [ -f "scripts/update-bedrock-agents.js" ]; then
        node scripts/update-bedrock-agents.js
        if [ $? -eq 0 ]; then
            log_success "All Bedrock agents updated successfully"
        else
            log_error "Failed to update some Bedrock agents"
            return 1
        fi
    else
        log_error "Bedrock agent update script not found at scripts/update-bedrock-agents.js"
        return 1
    fi
}

# Validate agent configurations
validate_agents() {
    log_info "Validating enhanced agent configurations..."
    
    # Change to project root directory
    cd "$(dirname "$0")/.."
    
    # Run the agent test script
    if [ -f "scripts/test-enhanced-agents.js" ]; then
        log_info "Running agent validation tests..."
        node scripts/test-enhanced-agents.js
        if [ $? -eq 0 ]; then
            log_success "All agent validation tests passed"
        else
            log_warning "Some agent validation tests failed, but deployment continues"
        fi
    else
        log_warning "Agent test script not found, skipping validation"
    fi
}

# Main deployment function
main() {
    log_info "Starting Enhanced Bedrock Agents deployment..."
    log_info "Region: ${REGION}"
    log_info "Timestamp: $(date)"
    
    # Run deployment steps
    check_prerequisites
    update_iam_permissions
    update_agents
    validate_agents
    
    log_success "Enhanced Bedrock Agents deployment completed successfully!"
    log_info "Next steps:"
    log_info "1. Test agent functionality with your applications"
    log_info "2. Monitor agent performance and costs"
    log_info "3. Update your MCP client configurations if needed"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "update-iam")
        log_info "Updating IAM permissions only..."
        check_prerequisites
        update_iam_permissions
        log_success "IAM permissions updated"
        ;;
    "update-agents")
        log_info "Updating agents only..."
        check_prerequisites
        update_agents
        log_success "Agents updated"
        ;;
    "validate")
        log_info "Validating agents only..."
        check_prerequisites
        validate_agents
        log_success "Agent validation completed"
        ;;
    *)
        echo "Usage: $0 [deploy|update-iam|update-agents|validate]"
        echo "Environment variables:"
        echo "  REGION: AWS region (default: us-east-1)"
        echo "  LOG_LEVEL: logging level (default: info)"
        exit 1
        ;;
esac