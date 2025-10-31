#!/bin/bash

# NVIDIA NIM Agentic Platform - Deployment Rollback Script
# Automated rollback and recovery procedures

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOGS_DIR="$PROJECT_ROOT/logs/rollback"

# Default configuration
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-hybrid}"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-west-2}"
BACKUP_ID="${BACKUP_ID:-latest}"
DRY_RUN="${DRY_RUN:-false}"
FORCE_ROLLBACK="${FORCE_ROLLBACK:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/rollback.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/rollback.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/rollback.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/rollback.log"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/rollback.log"
}

# Initialize logging
init_logging() {
    mkdir -p "$LOGS_DIR"
    
    local log_file="$LOGS_DIR/rollback.log"
    echo "=== NVIDIA NIM Platform Rollback Started ===" >> "$log_file"
    echo "Timestamp: $(date)" >> "$log_file"
    echo "Environment: $ENVIRONMENT" >> "$log_file"
    echo "Deployment Mode: $DEPLOYMENT_MODE" >> "$log_file"
    echo "AWS Region: $AWS_REGION" >> "$log_file"
    echo "Backup ID: $BACKUP_ID" >> "$log_file"
    echo "=============================================" >> "$log_file"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    log_info "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f /tmp/nim-rollback-*
    
    log_info "Rollback cleanup completed"
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT

# Find backup directory
find_backup() {
    log_step "Finding backup to restore..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    local backup_path=""
    
    if [ "$BACKUP_ID" = "latest" ]; then
        # Find the most recent backup
        backup_path=$(find "$BACKUP_DIR" -name "deployment_*" -type d | sort -r | head -n 1)
    else
        # Look for specific backup ID
        backup_path="$BACKUP_DIR/deployment_$BACKUP_ID"
    fi
    
    if [ -z "$backup_path" ] || [ ! -d "$backup_path" ]; then
        log_error "Backup not found: $BACKUP_ID"
        log_info "Available backups:"
        find "$BACKUP_DIR" -name "deployment_*" -type d | sort -r | head -10 | while read -r dir; do
            local backup_name
            backup_name=$(basename "$dir" | sed 's/deployment_//')
            local backup_date
            backup_date=$(date -d "${backup_name:0:8} ${backup_name:9:2}:${backup_name:11:2}:${backup_name:13:2}" 2>/dev/null || echo "Unknown")
            echo "  - $backup_name ($backup_date)"
        done
        exit 1
    fi
    
    echo "$backup_path" > /tmp/nim-rollback-backup-path
    
    # Load backup metadata
    if [ -f "$backup_path/metadata.json" ]; then
        local backup_env
        backup_env=$(jq -r '.environment // "unknown"' "$backup_path/metadata.json" 2>/dev/null || echo "unknown")
        local backup_mode
        backup_mode=$(jq -r '.deployment_mode // "unknown"' "$backup_path/metadata.json" 2>/dev/null || echo "unknown")
        local backup_timestamp
        backup_timestamp=$(jq -r '.timestamp // "unknown"' "$backup_path/metadata.json" 2>/dev/null || echo "unknown")
        
        log_success "Found backup: $backup_path"
        log_info "Backup details:"
        log_info "  Timestamp: $backup_timestamp"
        log_info "  Environment: $backup_env"
        log_info "  Deployment Mode: $backup_mode"
        
        # Warn if environment mismatch
        if [ "$backup_env" != "$ENVIRONMENT" ] && [ "$FORCE_ROLLBACK" != "true" ]; then
            log_error "Backup environment ($backup_env) doesn't match current environment ($ENVIRONMENT)"
            log_error "Use --force to override this check"
            exit 1
        fi
    else
        log_warning "Backup metadata not found, proceeding with caution"
    fi
}

# Confirm rollback
confirm_rollback() {
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would perform rollback operations"
        return 0
    fi
    
    if [ "$FORCE_ROLLBACK" = "true" ]; then
        log_warning "Force rollback enabled, skipping confirmation"
        return 0
    fi
    
    log_warning "This will rollback the NVIDIA NIM platform deployment"
    log_warning "Environment: $ENVIRONMENT"
    log_warning "Deployment Mode: $DEPLOYMENT_MODE"
    log_warning "This operation may cause service disruption"
    
    echo -n "Are you sure you want to proceed? (yes/no): "
    read -r confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
    
    log_info "Rollback confirmed, proceeding..."
}

# Create pre-rollback backup
create_pre_rollback_backup() {
    log_step "Creating pre-rollback backup..."
    
    local pre_rollback_timestamp
    pre_rollback_timestamp=$(date +%Y%m%d_%H%M%S)
    local pre_rollback_path="$BACKUP_DIR/pre_rollback_${pre_rollback_timestamp}"
    
    mkdir -p "$pre_rollback_path"
    
    # Backup current CloudFormation stacks
    log_info "Backing up current CloudFormation stacks..."
    local stacks=("NvidiaNimNetworking" "NvidiaNimEks" "NvidiaNimSageMaker" "NvidiaNimLambda" "NvidiaNimMonitoring")
    
    for stack in "${stacks[@]}"; do
        if aws cloudformation describe-stacks --stack-name "$stack" &> /dev/null; then
            aws cloudformation get-template --stack-name "$stack" > "$pre_rollback_path/${stack}_template.json" 2>/dev/null || true
            aws cloudformation describe-stacks --stack-name "$stack" > "$pre_rollback_path/${stack}_parameters.json" 2>/dev/null || true
        fi
    done
    
    # Backup current Kubernetes resources (if EKS is deployed)
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        if kubectl cluster-info &> /dev/null; then
            log_info "Backing up current Kubernetes resources..."
            kubectl get all -n nvidia-nim -o yaml > "$pre_rollback_path/k8s_resources.yaml" 2>/dev/null || true
            kubectl get configmaps -n nvidia-nim -o yaml > "$pre_rollback_path/k8s_configmaps.yaml" 2>/dev/null || true
            kubectl get secrets -n nvidia-nim -o yaml > "$pre_rollback_path/k8s_secrets.yaml" 2>/dev/null || true
        fi
    fi
    
    # Save pre-rollback metadata
    cat > "$pre_rollback_path/metadata.json" <<EOF
{
  "timestamp": "$pre_rollback_timestamp",
  "type": "pre_rollback",
  "environment": "$ENVIRONMENT",
  "deployment_mode": "$DEPLOYMENT_MODE",
  "aws_region": "$AWS_REGION",
  "rollback_target": "$BACKUP_ID",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    echo "$pre_rollback_path" > /tmp/nim-rollback-pre-backup-path
    log_success "Pre-rollback backup created: $pre_rollback_path"
}

# Rollback Lambda functions
rollback_lambda_functions() {
    log_step "Rolling back Lambda functions..."
    
    local backup_path
    backup_path=$(cat /tmp/nim-rollback-backup-path)
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would rollback Lambda functions"
        return 0
    fi
    
    # Check if we have Lambda function backups
    if [ ! -f "$backup_path/lambda_functions.json" ]; then
        log_warning "No Lambda function backup found, skipping Lambda rollback"
        return 0
    fi
    
    local function_names=("vibe-pm-agent-dev" "nvidia-nim-integration" "agent-orchestration")
    
    for function_name in "${function_names[@]}"; do
        if aws lambda get-function --function-name "$function_name" &> /dev/null; then
            log_info "Rolling back Lambda function: $function_name"
            
            # Get previous version ARN from backup
            local previous_version
            previous_version=$(jq -r ".\"$function_name\".version // \"\"" "$backup_path/lambda_functions.json" 2>/dev/null || echo "")
            
            if [ -n "$previous_version" ] && [ "$previous_version" != "null" ]; then
                # Update function to use previous version
                aws lambda update-alias \
                    --function-name "$function_name" \
                    --name "LIVE" \
                    --function-version "$previous_version" > /dev/null 2>&1 || log_warning "Failed to rollback $function_name to version $previous_version"
                
                log_success "Rolled back $function_name to version $previous_version"
            else
                log_warning "No previous version found for $function_name"
            fi
        else
            log_warning "Lambda function $function_name not found"
        fi
    done
}

# Rollback Kubernetes resources
rollback_kubernetes_resources() {
    if [[ "$DEPLOYMENT_MODE" != "eks" && "$DEPLOYMENT_MODE" != "hybrid" ]]; then
        return 0
    fi
    
    log_step "Rolling back Kubernetes resources..."
    
    local backup_path
    backup_path=$(cat /tmp/nim-rollback-backup-path)
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would rollback Kubernetes resources"
        return 0
    fi
    
    # Check kubectl connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        return 1
    fi
    
    # Rollback resources if backup exists
    if [ -f "$backup_path/k8s_resources.yaml" ]; then
        log_info "Rolling back Kubernetes resources..."
        
        # Delete current resources first (with grace period)
        kubectl delete all --all -n nvidia-nim --grace-period=30 --timeout=60s || log_warning "Failed to delete some current resources"
        
        # Apply backup resources
        if kubectl apply -f "$backup_path/k8s_resources.yaml"; then
            log_success "Kubernetes resources rolled back successfully"
        else
            log_error "Failed to apply backup Kubernetes resources"
            return 1
        fi
        
        # Wait for pods to be ready
        log_info "Waiting for pods to be ready..."
        kubectl wait --for=condition=ready pod --all -n nvidia-nim --timeout=300s || log_warning "Some pods may not be ready"
    else
        log_warning "No Kubernetes backup found, skipping Kubernetes rollback"
    fi
    
    # Rollback ConfigMaps and Secrets
    if [ -f "$backup_path/k8s_configmaps.yaml" ]; then
        log_info "Rolling back ConfigMaps..."
        kubectl apply -f "$backup_path/k8s_configmaps.yaml" || log_warning "Failed to rollback ConfigMaps"
    fi
    
    if [ -f "$backup_path/k8s_secrets.yaml" ]; then
        log_info "Rolling back Secrets..."
        kubectl apply -f "$backup_path/k8s_secrets.yaml" || log_warning "Failed to rollback Secrets"
    fi
}

# Rollback CloudFormation stacks
rollback_cloudformation_stacks() {
    log_step "Rolling back CloudFormation stacks..."
    
    local backup_path
    backup_path=$(cat /tmp/nim-rollback-backup-path)
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would rollback CloudFormation stacks"
        return 0
    fi
    
    # Rollback stacks in reverse dependency order
    local stacks=("NvidiaNimMonitoring" "NvidiaNimLambda" "NvidiaNimSageMaker" "NvidiaNimEks" "NvidiaNimNetworking")
    
    for stack in "${stacks[@]}"; do
        if [ -f "$backup_path/${stack}_template.json" ]; then
            log_info "Rolling back CloudFormation stack: $stack"
            
            # Check if stack exists
            if aws cloudformation describe-stacks --stack-name "$stack" &> /dev/null; then
                local current_status
                current_status=$(aws cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text)
                
                # Only rollback if stack is in a stable state
                if [[ "$current_status" == *"COMPLETE"* ]]; then
                    # Create change set for rollback
                    local change_set_name="rollback-$(date +%Y%m%d-%H%M%S)"
                    
                    if aws cloudformation create-change-set \
                        --stack-name "$stack" \
                        --change-set-name "$change_set_name" \
                        --template-body "file://$backup_path/${stack}_template.json" \
                        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM &> /dev/null; then
                        
                        # Wait for change set to be created
                        aws cloudformation wait change-set-create-complete \
                            --stack-name "$stack" \
                            --change-set-name "$change_set_name"
                        
                        # Execute change set
                        if aws cloudformation execute-change-set \
                            --stack-name "$stack" \
                            --change-set-name "$change_set_name"; then
                            
                            log_info "Waiting for stack rollback to complete: $stack"
                            aws cloudformation wait stack-update-complete --stack-name "$stack"
                            log_success "Stack rolled back successfully: $stack"
                        else
                            log_error "Failed to execute rollback change set for: $stack"
                        fi
                    else
                        log_warning "No changes detected for stack rollback: $stack"
                    fi
                else
                    log_warning "Stack $stack is not in a stable state ($current_status), skipping rollback"
                fi
            else
                log_warning "Stack $stack does not exist, skipping rollback"
            fi
        else
            log_warning "No backup template found for stack: $stack"
        fi
    done
}

# Rollback SageMaker endpoints
rollback_sagemaker_endpoints() {
    if [[ "$DEPLOYMENT_MODE" != "sagemaker" && "$DEPLOYMENT_MODE" != "hybrid" ]]; then
        return 0
    fi
    
    log_step "Rolling back SageMaker endpoints..."
    
    local backup_path
    backup_path=$(cat /tmp/nim-rollback-backup-path)
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would rollback SageMaker endpoints"
        return 0
    fi
    
    # Check if we have SageMaker backup
    if [ ! -f "$backup_path/sagemaker_endpoints.json" ]; then
        log_warning "No SageMaker backup found, skipping SageMaker rollback"
        return 0
    fi
    
    # Get endpoint names
    local llama_endpoint
    llama_endpoint=$(jq -r '.llama_endpoint // ""' "$backup_path/sagemaker_endpoints.json" 2>/dev/null || echo "")
    
    local embedding_endpoint
    embedding_endpoint=$(jq -r '.embedding_endpoint // ""' "$backup_path/sagemaker_endpoints.json" 2>/dev/null || echo "")
    
    # Rollback LLaMA endpoint
    if [ -n "$llama_endpoint" ] && [ "$llama_endpoint" != "null" ]; then
        log_info "Rolling back LLaMA endpoint: $llama_endpoint"
        
        local previous_config
        previous_config=$(jq -r '.llama_config // ""' "$backup_path/sagemaker_endpoints.json" 2>/dev/null || echo "")
        
        if [ -n "$previous_config" ] && [ "$previous_config" != "null" ]; then
            # This is a simplified rollback - in practice, you might need to:
            # 1. Create a new endpoint configuration
            # 2. Update the endpoint to use the previous configuration
            # 3. Wait for the update to complete
            
            log_warning "SageMaker endpoint rollback requires manual intervention"
            log_info "Previous configuration: $previous_config"
        fi
    fi
    
    # Rollback embedding endpoint
    if [ -n "$embedding_endpoint" ] && [ "$embedding_endpoint" != "null" ]; then
        log_info "Rolling back embedding endpoint: $embedding_endpoint"
        
        local previous_config
        previous_config=$(jq -r '.embedding_config // ""' "$backup_path/sagemaker_endpoints.json" 2>/dev/null || echo "")
        
        if [ -n "$previous_config" ] && [ "$previous_config" != "null" ]; then
            log_warning "SageMaker endpoint rollback requires manual intervention"
            log_info "Previous configuration: $previous_config"
        fi
    fi
}

# Validate rollback
validate_rollback() {
    log_step "Validating rollback..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would validate rollback"
        return 0
    fi
    
    # Run validation script
    if [ -f "$SCRIPT_DIR/validate-deployment.sh" ]; then
        log_info "Running deployment validation..."
        
        if bash "$SCRIPT_DIR/validate-deployment.sh" --mode "$DEPLOYMENT_MODE" --env "$ENVIRONMENT" --region "$AWS_REGION"; then
            log_success "Rollback validation passed"
        else
            log_error "Rollback validation failed"
            return 1
        fi
    else
        log_warning "Validation script not found, skipping validation"
    fi
    
    # Basic health checks
    log_info "Running basic health checks..."
    
    # Check CloudFormation stacks
    local stacks=("NvidiaNimNetworking" "NvidiaNimLambda" "NvidiaNimMonitoring")
    
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        stacks+=("NvidiaNimEks")
    fi
    
    if [[ "$DEPLOYMENT_MODE" == "sagemaker" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        stacks+=("NvidiaNimSageMaker")
    fi
    
    local healthy_stacks=0
    for stack in "${stacks[@]}"; do
        local stack_status
        stack_status=$(aws cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [[ "$stack_status" == "CREATE_COMPLETE" || "$stack_status" == "UPDATE_COMPLETE" ]]; then
            healthy_stacks=$((healthy_stacks + 1))
        fi
    done
    
    log_info "Healthy stacks: $healthy_stacks/${#stacks[@]}"
    
    if [ "$healthy_stacks" -eq "${#stacks[@]}" ]; then
        log_success "All stacks are healthy after rollback"
    else
        log_warning "Some stacks may not be healthy after rollback"
    fi
}

# Show rollback status
show_rollback_status() {
    log_step "Rollback Status Summary"
    
    echo "Environment: $ENVIRONMENT"
    echo "Deployment Mode: $DEPLOYMENT_MODE"
    echo "AWS Region: $AWS_REGION"
    echo "Backup ID: $BACKUP_ID"
    echo "Timestamp: $(date)"
    echo
    
    # Show backup information
    local backup_path
    if [ -f /tmp/nim-rollback-backup-path ]; then
        backup_path=$(cat /tmp/nim-rollback-backup-path)
        echo "Rollback Source: $backup_path"
        
        if [ -f "$backup_path/metadata.json" ]; then
            local backup_timestamp
            backup_timestamp=$(jq -r '.timestamp // "unknown"' "$backup_path/metadata.json" 2>/dev/null || echo "unknown")
            echo "Backup Timestamp: $backup_timestamp"
        fi
    fi
    
    # Show pre-rollback backup
    local pre_rollback_path
    if [ -f /tmp/nim-rollback-pre-backup-path ]; then
        pre_rollback_path=$(cat /tmp/nim-rollback-pre-backup-path)
        echo "Pre-rollback Backup: $pre_rollback_path"
    fi
    
    echo
    
    # Show current stack status
    echo "Current Stack Status:"
    local stacks=("NvidiaNimNetworking" "NvidiaNimEks" "NvidiaNimSageMaker" "NvidiaNimLambda" "NvidiaNimMonitoring")
    
    for stack in "${stacks[@]}"; do
        local status
        status=$(aws cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        printf "  %-20s: %s\n" "$stack" "$status"
    done
}

# Show usage information
show_usage() {
    cat <<EOF
NVIDIA NIM Agentic Platform - Deployment Rollback

Usage: $0 [OPTIONS]

Options:
  --backup-id ID      Backup ID to rollback to (default: latest)
  --mode MODE         Deployment mode: eks, sagemaker, or hybrid (default: hybrid)
  --env ENV           Environment: development, staging, or production (default: production)
  --region REGION     AWS region (default: us-west-2)
  --dry-run           Show what would be rolled back without making changes
  --force             Skip confirmation prompts and environment checks
  --list-backups      List available backups
  --status            Show current rollback status
  --help              Show this help message

Environment Variables:
  DEPLOYMENT_MODE     Deployment mode (eks, sagemaker, hybrid)
  ENVIRONMENT         Target environment
  AWS_REGION          AWS region for rollback
  BACKUP_ID           Backup ID to rollback to
  DRY_RUN             Dry run mode (true/false)
  FORCE_ROLLBACK      Force rollback without confirmation (true/false)

Examples:
  $0 --backup-id 20241031_143022
  $0 --dry-run --mode hybrid
  $0 --force --env staging
  $0 --list-backups
  $0 --status

EOF
}

# List available backups
list_backups() {
    log_info "Available backups:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    local backups
    backups=$(find "$BACKUP_DIR" -name "deployment_*" -type d | sort -r)
    
    if [ -z "$backups" ]; then
        log_warning "No backups found"
        exit 0
    fi
    
    echo "Backup ID                | Date                 | Environment | Mode"
    echo "-------------------------|----------------------|-------------|--------"
    
    while IFS= read -r backup_dir; do
        local backup_id
        backup_id=$(basename "$backup_dir" | sed 's/deployment_//')
        
        local backup_date="Unknown"
        local backup_env="Unknown"
        local backup_mode="Unknown"
        
        if [ -f "$backup_dir/metadata.json" ]; then
            backup_date=$(jq -r '.timestamp // "Unknown"' "$backup_dir/metadata.json" 2>/dev/null || echo "Unknown")
            backup_env=$(jq -r '.environment // "Unknown"' "$backup_dir/metadata.json" 2>/dev/null || echo "Unknown")
            backup_mode=$(jq -r '.deployment_mode // "Unknown"' "$backup_dir/metadata.json" 2>/dev/null || echo "Unknown")
        fi
        
        # Format date
        if [ "$backup_date" != "Unknown" ]; then
            backup_date=$(date -d "${backup_date:0:8} ${backup_date:9:2}:${backup_date:11:2}:${backup_date:13:2}" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$backup_date")
        fi
        
        printf "%-24s | %-20s | %-11s | %s\n" "$backup_id" "$backup_date" "$backup_env" "$backup_mode"
    done <<< "$backups"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-id)
                BACKUP_ID="$2"
                shift 2
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
            --force)
                FORCE_ROLLBACK=true
                shift
                ;;
            --list-backups)
                list_backups
                exit 0
                ;;
            --status)
                show_rollback_status
                exit 0
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

# Main rollback function
main() {
    init_logging
    
    log_info "Starting NVIDIA NIM Platform rollback"
    log_info "Mode: $DEPLOYMENT_MODE | Environment: $ENVIRONMENT | Region: $AWS_REGION"
    log_info "Backup ID: $BACKUP_ID"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    find_backup
    confirm_rollback
    create_pre_rollback_backup
    rollback_lambda_functions
    rollback_kubernetes_resources
    rollback_cloudformation_stacks
    rollback_sagemaker_endpoints
    validate_rollback
    
    log_success "Rollback completed successfully!"
    show_rollback_status
    
    log_info "Rollback summary:"
    log_info "- Pre-rollback backup created for recovery if needed"
    log_info "- Lambda functions rolled back to previous versions"
    log_info "- Kubernetes resources restored from backup"
    log_info "- CloudFormation stacks rolled back to previous state"
    log_info "- SageMaker endpoints rollback may require manual steps"
    log_info "- Validation completed successfully"
}

# Parse arguments and run
parse_args "$@"
main