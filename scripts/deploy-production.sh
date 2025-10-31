#!/bin/bash

# NVIDIA NIM Agentic Platform - Production Deployment Pipeline
# Automated deployment with validation and rollback capabilities

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"
LOGS_DIR="$PROJECT_ROOT/logs/deployment"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Default configuration
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-hybrid}"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-west-2}"
SKIP_VALIDATION="${SKIP_VALIDATION:-false}"
DRY_RUN="${DRY_RUN:-false}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/deployment.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/deployment.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/deployment.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/deployment.log"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/deployment.log"
}

# Initialize logging
init_logging() {
    mkdir -p "$LOGS_DIR"
    mkdir -p "$BACKUP_DIR"
    
    local log_file="$LOGS_DIR/deployment.log"
    echo "=== NVIDIA NIM Platform Deployment Started ===" >> "$log_file"
    echo "Timestamp: $(date)" >> "$log_file"
    echo "Environment: $ENVIRONMENT" >> "$log_file"
    echo "Deployment Mode: $DEPLOYMENT_MODE" >> "$log_file"
    echo "AWS Region: $AWS_REGION" >> "$log_file"
    echo "=============================================" >> "$log_file"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    log_info "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f /tmp/nim-deployment-*
    
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            log_warning "Initiating automatic rollback..."
            rollback_deployment
        fi
    fi
    
    log_info "Cleanup completed"
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log_step "Checking deployment prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    local required_tools=("aws" "cdk" "node" "npm" "jq" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    # Check kubectl for EKS deployment
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        if ! command -v kubectl &> /dev/null; then
            missing_tools+=("kubectl")
        fi
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    # Check Node.js version
    local node_version
    node_version=$(node --version | sed 's/v//')
    local required_version="18.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$node_version', '$required_version') ? 0 : 1)" 2>/dev/null; then
        log_error "Node.js version $node_version is below required version $required_version"
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Pre-deployment validation
pre_deployment_validation() {
    log_step "Running pre-deployment validation..."
    
    # Validate production build
    log_info "Validating production build..."
    if ! node "$SCRIPT_DIR/verify-production-build.mjs"; then
        log_error "Production build validation failed"
        exit 1
    fi
    
    # Run comprehensive tests
    log_info "Running comprehensive test suite..."
    cd "$PROJECT_ROOT"
    if ! npm run test:integration; then
        log_error "Integration tests failed"
        exit 1
    fi
    
    # Validate CDK templates
    log_info "Validating CDK templates..."
    cd "$DEPLOYMENT_DIR/infrastructure"
    if ! npm run build; then
        log_error "CDK build failed"
        exit 1
    fi
    
    if ! cdk synth --context environment="$ENVIRONMENT" --context deploymentMode="$DEPLOYMENT_MODE" > /dev/null; then
        log_error "CDK template synthesis failed"
        exit 1
    fi
    
    log_success "Pre-deployment validation completed"
}

# Create deployment backup
create_backup() {
    log_step "Creating deployment backup..."
    
    local backup_timestamp
    backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/deployment_${backup_timestamp}"
    
    mkdir -p "$backup_path"
    
    # Backup current CloudFormation stacks
    log_info "Backing up CloudFormation stacks..."
    local stacks=("NvidiaNimNetworking" "NvidiaNimEks" "NvidiaNimSageMaker" "NvidiaNimLambda" "NvidiaNimMonitoring")
    
    for stack in "${stacks[@]}"; do
        if aws cloudformation describe-stacks --stack-name "$stack" &> /dev/null; then
            aws cloudformation get-template --stack-name "$stack" > "$backup_path/${stack}_template.json" 2>/dev/null || true
            aws cloudformation describe-stacks --stack-name "$stack" > "$backup_path/${stack}_parameters.json" 2>/dev/null || true
        fi
    done
    
    # Backup Kubernetes manifests (if EKS is deployed)
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        if kubectl cluster-info &> /dev/null; then
            log_info "Backing up Kubernetes resources..."
            kubectl get all -n nvidia-nim -o yaml > "$backup_path/k8s_resources.yaml" 2>/dev/null || true
            kubectl get configmaps -n nvidia-nim -o yaml > "$backup_path/k8s_configmaps.yaml" 2>/dev/null || true
            kubectl get secrets -n nvidia-nim -o yaml > "$backup_path/k8s_secrets.yaml" 2>/dev/null || true
        fi
    fi
    
    # Save backup metadata
    cat > "$backup_path/metadata.json" <<EOF
{
  "timestamp": "$backup_timestamp",
  "environment": "$ENVIRONMENT",
  "deployment_mode": "$DEPLOYMENT_MODE",
  "aws_region": "$AWS_REGION",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    echo "$backup_path" > /tmp/nim-deployment-backup-path
    log_success "Backup created at: $backup_path"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_step "Deploying infrastructure..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would deploy infrastructure with mode: $DEPLOYMENT_MODE"
        return 0
    fi
    
    cd "$DEPLOYMENT_DIR/infrastructure"
    
    # Install dependencies
    log_info "Installing CDK dependencies..."
    npm ci --production
    
    # Build CDK app
    log_info "Building CDK application..."
    npm run build
    
    # Deploy using the existing deploy script
    log_info "Executing infrastructure deployment..."
    DEPLOYMENT_MODE="$DEPLOYMENT_MODE" \
    ENVIRONMENT="$ENVIRONMENT" \
    AWS_REGION="$AWS_REGION" \
    bash deployment-scripts/deploy.sh
    
    log_success "Infrastructure deployment completed"
}

# Deploy application code
deploy_application() {
    log_step "Deploying application code..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would deploy application code"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Build production bundle
    log_info "Building production application..."
    npm run build:prod
    
    # Deploy Lambda functions
    log_info "Deploying Lambda functions..."
    
    # Package Lambda function
    local lambda_package="/tmp/nim-deployment-lambda.zip"
    cd dist
    zip -r "$lambda_package" . -x "*.test.*" "*.spec.*" "demo/*" "examples/*"
    
    # Update Lambda function code
    local function_names=("vibe-pm-agent-dev" "nvidia-nim-integration" "agent-orchestration")
    
    for function_name in "${function_names[@]}"; do
        if aws lambda get-function --function-name "$function_name" &> /dev/null; then
            log_info "Updating Lambda function: $function_name"
            aws lambda update-function-code \
                --function-name "$function_name" \
                --zip-file "fileb://$lambda_package" \
                --publish > /dev/null
            
            # Wait for update to complete
            aws lambda wait function-updated --function-name "$function_name"
        else
            log_warning "Lambda function $function_name not found, skipping"
        fi
    done
    
    log_success "Application deployment completed"
}

# Post-deployment validation
post_deployment_validation() {
    if [ "$SKIP_VALIDATION" = "true" ]; then
        log_warning "Skipping post-deployment validation"
        return 0
    fi
    
    log_step "Running post-deployment validation..."
    
    # Wait for services to stabilize
    log_info "Waiting for services to stabilize..."
    sleep 30
    
    # Validate infrastructure health
    validate_infrastructure_health
    
    # Validate application functionality
    validate_application_functionality
    
    # Run integration tests against deployed environment
    validate_integration_tests
    
    log_success "Post-deployment validation completed"
}

# Validate infrastructure health
validate_infrastructure_health() {
    log_info "Validating infrastructure health..."
    
    # Check CloudFormation stacks
    local stacks=("NvidiaNimNetworking" "NvidiaNimLambda" "NvidiaNimMonitoring")
    
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        stacks+=("NvidiaNimEks")
    fi
    
    if [[ "$DEPLOYMENT_MODE" == "sagemaker" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        stacks+=("NvidiaNimSageMaker")
    fi
    
    for stack in "${stacks[@]}"; do
        local stack_status
        stack_status=$(aws cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [[ "$stack_status" == "CREATE_COMPLETE" || "$stack_status" == "UPDATE_COMPLETE" ]]; then
            log_success "Stack $stack is healthy ($stack_status)"
        else
            log_error "Stack $stack is unhealthy ($stack_status)"
            return 1
        fi
    done
    
    # Check EKS cluster health
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        validate_eks_health
    fi
    
    # Check SageMaker endpoints
    if [[ "$DEPLOYMENT_MODE" == "sagemaker" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        validate_sagemaker_health
    fi
    
    # Check Lambda functions
    validate_lambda_health
}

# Validate EKS health
validate_eks_health() {
    log_info "Validating EKS cluster health..."
    
    # Check cluster status
    local cluster_status
    cluster_status=$(aws eks describe-cluster --name nvidia-nim-cluster --query 'cluster.status' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$cluster_status" != "ACTIVE" ]; then
        log_error "EKS cluster is not active (status: $cluster_status)"
        return 1
    fi
    
    # Check node group status
    local nodegroup_status
    nodegroup_status=$(aws eks describe-nodegroup --cluster-name nvidia-nim-cluster --nodegroup-name gpu-nodes --query 'nodegroup.status' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$nodegroup_status" != "ACTIVE" ]; then
        log_error "EKS node group is not active (status: $nodegroup_status)"
        return 1
    fi
    
    # Check pod status
    if kubectl get pods -n nvidia-nim &> /dev/null; then
        local running_pods
        running_pods=$(kubectl get pods -n nvidia-nim --field-selector=status.phase=Running --no-headers | wc -l)
        
        if [ "$running_pods" -lt 2 ]; then
            log_error "Insufficient running pods in nvidia-nim namespace ($running_pods)"
            kubectl get pods -n nvidia-nim
            return 1
        fi
        
        log_success "EKS cluster is healthy with $running_pods running pods"
    else
        log_error "Cannot access nvidia-nim namespace"
        return 1
    fi
}

# Validate SageMaker health
validate_sagemaker_health() {
    log_info "Validating SageMaker endpoints..."
    
    # Get endpoint names from CloudFormation outputs
    local llama_endpoint
    llama_endpoint=$(aws cloudformation describe-stacks --stack-name NvidiaNimSageMaker --query 'Stacks[0].Outputs[?OutputKey==`LlamaEndpointName`].OutputValue' --output text 2>/dev/null || echo "")
    
    local embedding_endpoint
    embedding_endpoint=$(aws cloudformation describe-stacks --stack-name NvidiaNimSageMaker --query 'Stacks[0].Outputs[?OutputKey==`EmbeddingEndpointName`].OutputValue' --output text 2>/dev/null || echo "")
    
    # Check LLaMA endpoint
    if [ -n "$llama_endpoint" ]; then
        local endpoint_status
        endpoint_status=$(aws sagemaker describe-endpoint --endpoint-name "$llama_endpoint" --query 'EndpointStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$endpoint_status" = "InService" ]; then
            log_success "LLaMA endpoint is healthy ($endpoint_status)"
        else
            log_error "LLaMA endpoint is unhealthy ($endpoint_status)"
            return 1
        fi
    fi
    
    # Check embedding endpoint
    if [ -n "$embedding_endpoint" ]; then
        local endpoint_status
        endpoint_status=$(aws sagemaker describe-endpoint --endpoint-name "$embedding_endpoint" --query 'EndpointStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$endpoint_status" = "InService" ]; then
            log_success "Embedding endpoint is healthy ($endpoint_status)"
        else
            log_error "Embedding endpoint is unhealthy ($endpoint_status)"
            return 1
        fi
    fi
}

# Validate Lambda health
validate_lambda_health() {
    log_info "Validating Lambda functions..."
    
    local function_names=("vibe-pm-agent-dev" "nvidia-nim-integration" "agent-orchestration")
    
    for function_name in "${function_names[@]}"; do
        if aws lambda get-function --function-name "$function_name" &> /dev/null; then
            # Test function invocation
            local test_payload='{"test": true, "source": "deployment-validation"}'
            local response
            response=$(aws lambda invoke --function-name "$function_name" --payload "$test_payload" /tmp/lambda-response.json 2>&1 || echo "FAILED")
            
            if [[ "$response" == *"FAILED"* ]]; then
                log_error "Lambda function $function_name failed health check"
                return 1
            else
                log_success "Lambda function $function_name is healthy"
            fi
        else
            log_warning "Lambda function $function_name not found"
        fi
    done
}

# Validate application functionality
validate_application_functionality() {
    log_info "Validating application functionality..."
    
    # Test MCP server health
    log_info "Testing MCP server health..."
    if ! node "$PROJECT_ROOT/dist/mcp/cli.js" --health; then
        log_error "MCP server health check failed"
        return 1
    fi
    
    # Test local NIM integration (if available)
    if command -v curl &> /dev/null; then
        log_info "Testing NIM integration..."
        if ! bash "$SCRIPT_DIR/test-local-nim.sh" connectivity; then
            log_warning "Local NIM connectivity test failed (may be expected in production)"
        fi
    fi
    
    log_success "Application functionality validation completed"
}

# Run integration tests
validate_integration_tests() {
    log_info "Running integration tests against deployed environment..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for integration tests
    export NODE_ENV=production
    export AWS_REGION="$AWS_REGION"
    export DEPLOYMENT_MODE="$DEPLOYMENT_MODE"
    
    # Run specific integration tests for deployed components
    if ! npm run test:integration -- --testNamePattern="deployment|production|e2e"; then
        log_error "Integration tests failed against deployed environment"
        return 1
    fi
    
    log_success "Integration tests passed"
}

# Rollback deployment
rollback_deployment() {
    log_step "Initiating deployment rollback..."
    
    local backup_path
    if [ -f /tmp/nim-deployment-backup-path ]; then
        backup_path=$(cat /tmp/nim-deployment-backup-path)
    else
        log_error "No backup path found, cannot rollback"
        return 1
    fi
    
    if [ ! -d "$backup_path" ]; then
        log_error "Backup directory not found: $backup_path"
        return 1
    fi
    
    log_info "Rolling back to backup: $backup_path"
    
    # Rollback CloudFormation stacks
    local stacks=("NvidiaNimMonitoring" "NvidiaNimLambda" "NvidiaNimSageMaker" "NvidiaNimEks" "NvidiaNimNetworking")
    
    for stack in "${stacks[@]}"; do
        if [ -f "$backup_path/${stack}_template.json" ]; then
            log_info "Rolling back stack: $stack"
            
            # This is a simplified rollback - in practice, you might want to:
            # 1. Update the stack with the previous template
            # 2. Or delete and recreate with backup
            # 3. Handle dependencies properly
            
            log_warning "Stack rollback for $stack requires manual intervention"
        fi
    done
    
    # Rollback Kubernetes resources
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]] && [ -f "$backup_path/k8s_resources.yaml" ]; then
        log_info "Rolling back Kubernetes resources..."
        kubectl apply -f "$backup_path/k8s_resources.yaml" || log_warning "Kubernetes rollback failed"
    fi
    
    log_success "Rollback completed (some manual steps may be required)"
}

# Show deployment status
show_deployment_status() {
    log_step "Deployment Status Summary"
    
    echo "Environment: $ENVIRONMENT"
    echo "Deployment Mode: $DEPLOYMENT_MODE"
    echo "AWS Region: $AWS_REGION"
    echo "Timestamp: $(date)"
    echo
    
    # Show CloudFormation stack status
    echo "CloudFormation Stacks:"
    local stacks=("NvidiaNimNetworking" "NvidiaNimEks" "NvidiaNimSageMaker" "NvidiaNimLambda" "NvidiaNimMonitoring")
    
    for stack in "${stacks[@]}"; do
        local status
        status=$(aws cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        printf "  %-20s: %s\n" "$stack" "$status"
    done
    
    echo
    
    # Show EKS status
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        echo "EKS Cluster Status:"
        local cluster_status
        cluster_status=$(aws eks describe-cluster --name nvidia-nim-cluster --query 'cluster.status' --output text 2>/dev/null || echo "NOT_FOUND")
        printf "  %-20s: %s\n" "Cluster" "$cluster_status"
        
        if kubectl get pods -n nvidia-nim &> /dev/null; then
            local pod_count
            pod_count=$(kubectl get pods -n nvidia-nim --no-headers | wc -l)
            printf "  %-20s: %s\n" "Pods" "$pod_count"
        fi
        echo
    fi
    
    # Show SageMaker status
    if [[ "$DEPLOYMENT_MODE" == "sagemaker" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        echo "SageMaker Endpoints:"
        
        local llama_endpoint
        llama_endpoint=$(aws cloudformation describe-stacks --stack-name NvidiaNimSageMaker --query 'Stacks[0].Outputs[?OutputKey==`LlamaEndpointName`].OutputValue' --output text 2>/dev/null || echo "")
        
        if [ -n "$llama_endpoint" ]; then
            local status
            status=$(aws sagemaker describe-endpoint --endpoint-name "$llama_endpoint" --query 'EndpointStatus' --output text 2>/dev/null || echo "NOT_FOUND")
            printf "  %-20s: %s\n" "LLaMA" "$status"
        fi
        echo
    fi
}

# Show usage information
show_usage() {
    cat <<EOF
NVIDIA NIM Agentic Platform - Production Deployment Pipeline

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  deploy              Full deployment pipeline (default)
  validate            Run validation only
  rollback            Rollback to previous deployment
  status              Show deployment status
  help                Show this help message

Options:
  --mode MODE         Deployment mode: eks, sagemaker, or hybrid (default: hybrid)
  --env ENV           Environment: development, staging, or production (default: production)
  --region REGION     AWS region (default: us-west-2)
  --dry-run           Show what would be deployed without making changes
  --skip-validation   Skip post-deployment validation
  --no-rollback       Disable automatic rollback on failure

Environment Variables:
  DEPLOYMENT_MODE     Deployment mode (eks, sagemaker, hybrid)
  ENVIRONMENT         Target environment
  AWS_REGION          AWS region for deployment
  SKIP_VALIDATION     Skip validation steps (true/false)
  DRY_RUN             Dry run mode (true/false)
  ROLLBACK_ON_FAILURE Enable automatic rollback (true/false)

Examples:
  $0 deploy --mode hybrid --env production
  $0 validate --env staging
  $0 rollback
  $0 status
  $0 deploy --dry-run --mode eks

EOF
}

# Parse command line arguments
parse_args() {
    COMMAND="deploy"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            deploy|validate|rollback|status|help)
                COMMAND="$1"
                shift
                ;;
            --mode)
                DEPLOYMENT_MODE="$2"
                shift 2
                ;;
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --region)
                AWS_REGION="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Main deployment pipeline
main_deploy() {
    log_info "Starting NVIDIA NIM Platform deployment pipeline"
    log_info "Mode: $DEPLOYMENT_MODE | Environment: $ENVIRONMENT | Region: $AWS_REGION"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    check_prerequisites
    pre_deployment_validation
    create_backup
    deploy_infrastructure
    deploy_application
    post_deployment_validation
    
    log_success "Deployment pipeline completed successfully!"
    show_deployment_status
}

# Main execution
main() {
    init_logging
    
    case "$COMMAND" in
        "deploy")
            main_deploy
            ;;
        "validate")
            check_prerequisites
            post_deployment_validation
            ;;
        "rollback")
            rollback_deployment
            ;;
        "status")
            show_deployment_status
            ;;
        "help")
            show_usage
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# Parse arguments and run
parse_args "$@"
main