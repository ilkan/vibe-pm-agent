#!/bin/bash
set -e

# Create Citation and Supervisor Agents using AWS CLI
# This script creates the two missing agents that don't exist yet

# Configuration
REGION=${REGION:-"us-east-1"}

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

# Create Citation Agent
create_citation_agent() {
    log_info "Creating Citation Agent..."
    
    local agent_response=$(aws bedrock-agent create-agent \
        --region ${REGION} \
        --cli-input-json file://scripts/create-citation-agent.json \
        --output json 2>&1)
    
    if [ $? -eq 0 ]; then
        local agent_id=$(echo "$agent_response" | jq -r '.agent.agentId')
        local agent_arn=$(echo "$agent_response" | jq -r '.agent.agentArn')
        log_success "Citation Agent created successfully!"
        log_info "Agent ID: ${agent_id}"
        log_info "Agent ARN: ${agent_arn}"
        echo "CITATION_AGENT_ID=${agent_id}" >> .env.agents
        return 0
    else
        log_error "Failed to create Citation Agent:"
        echo "$agent_response"
        return 1
    fi
}

# Create Supervisor Agent
create_supervisor_agent() {
    log_info "Creating Supervisor Agent..."
    
    local agent_response=$(aws bedrock-agent create-agent \
        --region ${REGION} \
        --cli-input-json file://scripts/create-supervisor-agent.json \
        --output json 2>&1)
    
    if [ $? -eq 0 ]; then
        local agent_id=$(echo "$agent_response" | jq -r '.agent.agentId')
        local agent_arn=$(echo "$agent_response" | jq -r '.agent.agentArn')
        log_success "Supervisor Agent created successfully!"
        log_info "Agent ID: ${agent_id}"
        log_info "Agent ARN: ${agent_arn}"
        echo "SUPERVISOR_AGENT_ID=${agent_id}" >> .env.agents
        return 0
    else
        log_error "Failed to create Supervisor Agent:"
        echo "$agent_response"
        return 1
    fi
}

# Create agent aliases for testing
create_agent_alias() {
    local agent_id=$1
    local alias_name=$2
    
    log_info "Creating alias '${alias_name}' for agent ${agent_id}..."
    
    local alias_response=$(aws bedrock-agent create-agent-alias \
        --region ${REGION} \
        --agent-id ${agent_id} \
        --agent-alias-name ${alias_name} \
        --description "Test alias for ${alias_name}" \
        --output json 2>&1)
    
    if [ $? -eq 0 ]; then
        local alias_id=$(echo "$alias_response" | jq -r '.agentAlias.agentAliasId')
        log_success "Alias '${alias_name}' created: ${alias_id}"
        return 0
    else
        log_warning "Failed to create alias for ${agent_id}:"
        echo "$alias_response"
        return 1
    fi
}

# Prepare agents for testing
prepare_agents() {
    log_info "Preparing agents for testing..."
    
    # Read agent IDs from environment file
    if [ -f ".env.agents" ]; then
        source .env.agents
        
        # Create aliases for testing
        if [ ! -z "$CITATION_AGENT_ID" ]; then
            create_agent_alias "$CITATION_AGENT_ID" "test-citation"
        fi
        
        if [ ! -z "$SUPERVISOR_AGENT_ID" ]; then
            create_agent_alias "$SUPERVISOR_AGENT_ID" "test-supervisor"
        fi
    else
        log_warning "No agent IDs found. Aliases not created."
    fi
}

# Main function
main() {
    log_info "Creating Citation and Supervisor Agents..."
    log_info "Region: ${REGION}"
    log_info "Timestamp: $(date)"
    
    # Check prerequisites
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed (required for JSON parsing)"
        exit 1
    fi
    
    # Initialize environment file
    echo "# Agent IDs created on $(date)" > .env.agents
    
    local success_count=0
    local total_count=2
    
    # Create Citation Agent
    if create_citation_agent; then
        ((success_count++))
    fi
    
    # Create Supervisor Agent
    if create_supervisor_agent; then
        ((success_count++))
    fi
    
    # Prepare agents for testing
    prepare_agents
    
    # Summary
    log_info ""
    log_info "=== Creation Summary ==="
    log_info "Successfully created: ${success_count}/${total_count} agents"
    
    if [ $success_count -eq $total_count ]; then
        log_success "🎉 All agents created successfully!"
        log_info ""
        log_info "📝 Next steps:"
        log_info "1. Wait a few minutes for agents to be fully prepared"
        log_info "2. Test the agents in the AWS Bedrock console"
        log_info "3. Create agent aliases if needed for production use"
        log_info "4. Update your application configurations with the new agent IDs"
        
        if [ -f ".env.agents" ]; then
            log_info ""
            log_info "📋 Agent IDs saved to .env.agents:"
            cat .env.agents
        fi
        
        exit 0
    else
        log_error "❌ Some agents failed to create. Check the errors above."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-create}" in
    "create")
        main
        ;;
    "citation")
        log_info "Creating Citation Agent only..."
        echo "# Citation Agent created on $(date)" > .env.agents
        if create_citation_agent; then
            log_success "Citation Agent created successfully!"
        else
            log_error "Failed to create Citation Agent"
            exit 1
        fi
        ;;
    "supervisor")
        log_info "Creating Supervisor Agent only..."
        echo "# Supervisor Agent created on $(date)" > .env.agents
        if create_supervisor_agent; then
            log_success "Supervisor Agent created successfully!"
        else
            log_error "Failed to create Supervisor Agent"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 [create|citation|supervisor]"
        echo "Environment variables:"
        echo "  REGION: AWS region (default: us-east-1)"
        echo ""
        echo "Commands:"
        echo "  create     - Create both Citation and Supervisor agents (default)"
        echo "  citation   - Create only Citation agent"
        echo "  supervisor - Create only Supervisor agent"
        exit 1
        ;;
esac