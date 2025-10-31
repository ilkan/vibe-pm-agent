#!/bin/bash

# NVIDIA NIM Agentic Platform - Deployment Pipeline Orchestrator
# Comprehensive deployment automation with validation and rollback capabilities

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs/pipeline"

# Default configuration
PIPELINE_MODE="${PIPELINE_MODE:-full}"  # full, deploy-only, validate-only, rollback
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-hybrid}"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-west-2}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/pipeline.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/pipeline.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/pipeline.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/pipeline.log"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/pipeline.log"
}

log_pipeline() {
    echo -e "${CYAN}[PIPELINE]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/pipeline.log"
}

# Initialize logging
init_logging() {
    mkdir -p "$LOGS_DIR"
    
    local log_file="$LOGS_DIR/pipeline.log"
    echo "=== NVIDIA NIM Platform Deployment Pipeline Started ===" >> "$log_file"
    echo "Timestamp: $(date)" >> "$log_file"
    echo "Pipeline Mode: $PIPELINE_MODE" >> "$log_file"
    echo "Environment: $ENVIRONMENT" >> "$log_file"
    echo "Deployment Mode: $DEPLOYMENT_MODE" >> "$log_file"
    echo "AWS Region: $AWS_REGION" >> "$log_file"
    echo "Auto Approve: $AUTO_APPROVE" >> "$log_file"
    echo "=============================================" >> "$log_file"
}

# Pipeline state tracking
pipeline_start_time=$(date +%s)
pipeline_steps_completed=0
pipeline_steps_total=0

# Initialize state tracking (compatible with older bash)
init_pipeline_state() {
    mkdir -p "$LOGS_DIR"
    touch "$LOGS_DIR/pipeline_state.txt"
}

# Update pipeline state
update_pipeline_state() {
    local step="$1"
    local status="$2"
    local message="$3"
    
    # Save to simple text file for compatibility
    echo "$step:$status:$message:$(date +%s)" >> "$LOGS_DIR/pipeline_state.txt"
    
    if [ "$status" = "completed" ]; then
        pipeline_steps_completed=$((pipeline_steps_completed + 1))
    fi
    
    # Save state to JSON file
    local state_file="$LOGS_DIR/pipeline_state.json"
    cat > "$state_file" <<EOF
{
  "pipeline_mode": "$PIPELINE_MODE",
  "environment": "$ENVIRONMENT",
  "deployment_mode": "$DEPLOYMENT_MODE",
  "aws_region": "$AWS_REGION",
  "start_time": "$pipeline_start_time",
  "current_time": "$(date +%s)",
  "steps_completed": $pipeline_steps_completed,
  "steps_total": $pipeline_steps_total,
  "last_step": "$step",
  "last_status": "$status",
  "last_message": "$message"
}
EOF
}

# Send notification
send_notification() {
    local title="$1"
    local message="$2"
    local status="$3"  # success, warning, error
    local color=""
    
    case "$status" in
        "success") color="good" ;;
        "warning") color="warning" ;;
        "error") color="danger" ;;
        *) color="good" ;;
    esac
    
    # Send Slack notification if webhook is configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        local payload
        payload=$(cat <<EOF
{
  "text": "$title",
  "attachments": [
    {
      "color": "$color",
      "fields": [
        {
          "title": "Environment",
          "value": "$ENVIRONMENT",
          "short": true
        },
        {
          "title": "Deployment Mode",
          "value": "$DEPLOYMENT_MODE",
          "short": true
        },
        {
          "title": "AWS Region",
          "value": "$AWS_REGION",
          "short": true
        },
        {
          "title": "Pipeline Mode",
          "value": "$PIPELINE_MODE",
          "short": true
        }
      ],
      "text": "$message",
      "ts": $(date +%s)
    }
  ]
}
EOF
)
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK" &> /dev/null || log_warning "Failed to send Slack notification"
    fi
    
    # Send generic webhook notification if configured
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        local payload
        payload=$(cat <<EOF
{
  "title": "$title",
  "message": "$message",
  "status": "$status",
  "environment": "$ENVIRONMENT",
  "deployment_mode": "$DEPLOYMENT_MODE",
  "aws_region": "$AWS_REGION",
  "pipeline_mode": "$PIPELINE_MODE",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$NOTIFICATION_WEBHOOK" &> /dev/null || log_warning "Failed to send webhook notification"
    fi
}

# Cleanup function
cleanup() {
    local exit_code=$?
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - pipeline_start_time))
    
    log_pipeline "Pipeline cleanup started"
    
    # Remove temporary files
    rm -f /tmp/nim-pipeline-*
    
    # Generate final report
    generate_pipeline_report "$exit_code" "$duration"
    
    # Send final notification
    if [ $exit_code -eq 0 ]; then
        send_notification "✅ NVIDIA NIM Pipeline Completed" \
            "Deployment pipeline completed successfully in ${duration}s" \
            "success"
        log_success "Pipeline completed successfully in ${duration}s"
    else
        send_notification "❌ NVIDIA NIM Pipeline Failed" \
            "Deployment pipeline failed after ${duration}s" \
            "error"
        log_error "Pipeline failed after ${duration}s"
    fi
    
    log_pipeline "Pipeline cleanup completed"
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT

# Generate pipeline report
generate_pipeline_report() {
    local exit_code="$1"
    local duration="$2"
    
    local report_file="$LOGS_DIR/pipeline_report_$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" <<EOF
{
  "pipeline_mode": "$PIPELINE_MODE",
  "environment": "$ENVIRONMENT",
  "deployment_mode": "$DEPLOYMENT_MODE",
  "aws_region": "$AWS_REGION",
  "start_time": "$pipeline_start_time",
  "end_time": "$(date +%s)",
  "duration_seconds": $duration,
  "exit_code": $exit_code,
  "status": "$([ $exit_code -eq 0 ] && echo "success" || echo "failed")",
  "steps_completed": $pipeline_steps_completed,
  "steps_total": $pipeline_steps_total,
  "completion_rate": $([ $pipeline_steps_total -gt 0 ] && echo $(( pipeline_steps_completed * 100 / pipeline_steps_total )) || echo 0),
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    log_success "Pipeline report generated: $report_file"
}

# Pre-flight checks
pre_flight_checks() {
    log_step "Running pre-flight checks..."
    update_pipeline_state "pre_flight_checks" "running" "Checking prerequisites"
    
    # Check required scripts exist
    local required_scripts=("deploy-production.sh" "validate-deployment.sh" "rollback-deployment.sh")
    
    for script in "${required_scripts[@]}"; do
        if [ ! -f "$SCRIPT_DIR/$script" ]; then
            log_error "Required script not found: $script"
            update_pipeline_state "pre_flight_checks" "failed" "Missing required script: $script"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        update_pipeline_state "pre_flight_checks" "failed" "AWS credentials not configured"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("aws" "cdk" "node" "npm" "jq" "curl")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        update_pipeline_state "pre_flight_checks" "failed" "Missing tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check project structure
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_error "Project package.json not found"
        update_pipeline_state "pre_flight_checks" "failed" "Project package.json not found"
        exit 1
    fi
    
    if [ ! -d "$PROJECT_ROOT/deployment" ]; then
        log_error "Deployment directory not found"
        update_pipeline_state "pre_flight_checks" "failed" "Deployment directory not found"
        exit 1
    fi
    
    log_success "Pre-flight checks completed"
    update_pipeline_state "pre_flight_checks" "completed" "All prerequisites satisfied"
}

# Approval gate
approval_gate() {
    if [ "$AUTO_APPROVE" = "true" ]; then
        log_info "Auto-approval enabled, skipping approval gate"
        return 0
    fi
    
    log_step "Deployment approval gate"
    update_pipeline_state "approval_gate" "waiting" "Waiting for user approval"
    
    echo
    log_warning "=== DEPLOYMENT APPROVAL REQUIRED ==="
    echo "Environment: $ENVIRONMENT"
    echo "Deployment Mode: $DEPLOYMENT_MODE"
    echo "AWS Region: $AWS_REGION"
    echo "Pipeline Mode: $PIPELINE_MODE"
    echo
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_warning "⚠️  This is a PRODUCTION deployment!"
        log_warning "⚠️  This operation may cause service disruption!"
        echo
    fi
    
    echo -n "Do you approve this deployment? (yes/no): "
    read -r approval
    
    if [ "$approval" != "yes" ]; then
        log_info "Deployment cancelled by user"
        update_pipeline_state "approval_gate" "cancelled" "Deployment cancelled by user"
        exit 0
    fi
    
    log_success "Deployment approved"
    update_pipeline_state "approval_gate" "completed" "Deployment approved by user"
}

# Execute deployment
execute_deployment() {
    log_step "Executing deployment..."
    update_pipeline_state "deployment" "running" "Deploying infrastructure and application"
    
    # Set environment variables for deployment script
    export DEPLOYMENT_MODE="$DEPLOYMENT_MODE"
    export ENVIRONMENT="$ENVIRONMENT"
    export AWS_REGION="$AWS_REGION"
    
    if bash "$SCRIPT_DIR/deploy-production.sh" deploy; then
        log_success "Deployment completed successfully"
        update_pipeline_state "deployment" "completed" "Infrastructure and application deployed"
    else
        log_error "Deployment failed"
        update_pipeline_state "deployment" "failed" "Deployment script failed"
        return 1
    fi
}

# Execute validation
execute_validation() {
    log_step "Executing post-deployment validation..."
    update_pipeline_state "validation" "running" "Validating deployed infrastructure"
    
    # Set environment variables for validation script
    export DEPLOYMENT_MODE="$DEPLOYMENT_MODE"
    export ENVIRONMENT="$ENVIRONMENT"
    export AWS_REGION="$AWS_REGION"
    
    if bash "$SCRIPT_DIR/validate-deployment.sh"; then
        log_success "Validation completed successfully"
        update_pipeline_state "validation" "completed" "All validation tests passed"
    else
        log_error "Validation failed"
        update_pipeline_state "validation" "failed" "Some validation tests failed"
        return 1
    fi
}

# Execute rollback
execute_rollback() {
    local backup_id="${1:-latest}"
    
    log_step "Executing rollback to backup: $backup_id"
    update_pipeline_state "rollback" "running" "Rolling back to backup: $backup_id"
    
    # Set environment variables for rollback script
    export DEPLOYMENT_MODE="$DEPLOYMENT_MODE"
    export ENVIRONMENT="$ENVIRONMENT"
    export AWS_REGION="$AWS_REGION"
    export BACKUP_ID="$backup_id"
    export FORCE_ROLLBACK="true"  # Skip confirmation in pipeline mode
    
    if bash "$SCRIPT_DIR/rollback-deployment.sh"; then
        log_success "Rollback completed successfully"
        update_pipeline_state "rollback" "completed" "Rollback to $backup_id successful"
    else
        log_error "Rollback failed"
        update_pipeline_state "rollback" "failed" "Rollback to $backup_id failed"
        return 1
    fi
}

# Full pipeline execution
execute_full_pipeline() {
    log_pipeline "Starting full deployment pipeline"
    pipeline_steps_total=4
    
    send_notification "🚀 NVIDIA NIM Pipeline Started" \
        "Full deployment pipeline started" \
        "success"
    
    # Step 1: Pre-flight checks
    pre_flight_checks
    
    # Step 2: Approval gate
    approval_gate
    
    # Step 3: Deployment
    if ! execute_deployment; then
        log_error "Deployment failed, pipeline aborted"
        return 1
    fi
    
    # Step 4: Validation
    if ! execute_validation; then
        log_error "Validation failed"
        
        # Ask for rollback approval
        if [ "$AUTO_APPROVE" != "true" ]; then
            echo -n "Validation failed. Do you want to rollback? (yes/no): "
            read -r rollback_approval
            
            if [ "$rollback_approval" = "yes" ]; then
                execute_rollback
            fi
        fi
        
        return 1
    fi
    
    log_success "Full pipeline completed successfully"
}

# Deploy-only pipeline
execute_deploy_only_pipeline() {
    log_pipeline "Starting deploy-only pipeline"
    pipeline_steps_total=3
    
    send_notification "🚀 NVIDIA NIM Deploy-Only Started" \
        "Deploy-only pipeline started" \
        "success"
    
    pre_flight_checks
    approval_gate
    execute_deployment
    
    log_success "Deploy-only pipeline completed"
}

# Validate-only pipeline
execute_validate_only_pipeline() {
    log_pipeline "Starting validate-only pipeline"
    pipeline_steps_total=2
    
    send_notification "🔍 NVIDIA NIM Validation Started" \
        "Validation-only pipeline started" \
        "success"
    
    pre_flight_checks
    execute_validation
    
    log_success "Validate-only pipeline completed"
}

# Rollback pipeline
execute_rollback_pipeline() {
    local backup_id="${1:-latest}"
    
    log_pipeline "Starting rollback pipeline"
    pipeline_steps_total=3
    
    send_notification "⏪ NVIDIA NIM Rollback Started" \
        "Rollback pipeline started for backup: $backup_id" \
        "warning"
    
    pre_flight_checks
    
    # Rollback approval gate
    if [ "$AUTO_APPROVE" != "true" ]; then
        log_warning "=== ROLLBACK APPROVAL REQUIRED ==="
        echo "Environment: $ENVIRONMENT"
        echo "Backup ID: $backup_id"
        echo
        log_warning "⚠️  This will rollback the current deployment!"
        echo
        
        echo -n "Do you approve this rollback? (yes/no): "
        read -r approval
        
        if [ "$approval" != "yes" ]; then
            log_info "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    execute_rollback "$backup_id"
    
    log_success "Rollback pipeline completed"
}

# Show pipeline status
show_pipeline_status() {
    log_info "Pipeline Status"
    
    if [ -f "$LOGS_DIR/pipeline_state.json" ]; then
        local state_file="$LOGS_DIR/pipeline_state.json"
        
        echo "Pipeline Mode: $(jq -r '.pipeline_mode' "$state_file")"
        echo "Environment: $(jq -r '.environment' "$state_file")"
        echo "Deployment Mode: $(jq -r '.deployment_mode' "$state_file")"
        echo "AWS Region: $(jq -r '.aws_region' "$state_file")"
        echo "Steps Completed: $(jq -r '.steps_completed' "$state_file")/$(jq -r '.steps_total' "$state_file")"
        echo
        
        echo "Step Status:"
        jq -r '.state | to_entries[] | "  \(.key): \(.value.status) - \(.value.message)"' "$state_file"
    else
        echo "No pipeline state found"
    fi
}

# Show usage information
show_usage() {
    cat <<EOF
NVIDIA NIM Agentic Platform - Deployment Pipeline Orchestrator

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  full                Full deployment pipeline (deploy + validate)
  deploy              Deploy-only pipeline
  validate            Validate-only pipeline
  rollback [ID]       Rollback pipeline (default: latest backup)
  status              Show pipeline status
  help                Show this help message

Options:
  --mode MODE         Deployment mode: eks, sagemaker, or hybrid (default: hybrid)
  --env ENV           Environment: development, staging, or production (default: production)
  --region REGION     AWS region (default: us-west-2)
  --auto-approve      Skip approval gates
  --slack-webhook URL Slack webhook URL for notifications
  --webhook URL       Generic webhook URL for notifications

Environment Variables:
  PIPELINE_MODE       Pipeline mode (full, deploy-only, validate-only, rollback)
  DEPLOYMENT_MODE     Deployment mode (eks, sagemaker, hybrid)
  ENVIRONMENT         Target environment
  AWS_REGION          AWS region for deployment
  AUTO_APPROVE        Skip approval gates (true/false)
  SLACK_WEBHOOK       Slack webhook URL for notifications
  NOTIFICATION_WEBHOOK Generic webhook URL for notifications

Examples:
  $0 full --env production --mode hybrid
  $0 deploy --auto-approve --env staging
  $0 validate --env production
  $0 rollback 20241031_143022 --env production
  $0 status

Pipeline Modes:
  full        - Complete deployment with validation
  deploy-only - Deploy infrastructure and application only
  validate-only - Run validation tests only
  rollback    - Rollback to previous deployment

EOF
}

# Parse command line arguments
parse_args() {
    PIPELINE_MODE="full"
    ROLLBACK_BACKUP_ID="latest"
    
    if [ $# -eq 0 ]; then
        PIPELINE_MODE="full"
    else
        case $1 in
            full|deploy|validate|rollback|status|help)
                PIPELINE_MODE="$1"
                shift
                
                # Handle rollback backup ID
                if [ "$PIPELINE_MODE" = "rollback" ] && [ $# -gt 0 ] && [[ ! "$1" =~ ^-- ]]; then
                    ROLLBACK_BACKUP_ID="$1"
                    shift
                fi
                ;;
            *)
                # First argument is not a command, assume it's an option
                ;;
        esac
    fi
    
    while [[ $# -gt 0 ]]; do
        case $1 in
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
            --auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            --slack-webhook)
                SLACK_WEBHOOK="$2"
                shift 2
                ;;
            --webhook)
                NOTIFICATION_WEBHOOK="$2"
                shift 2
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

# Main execution
main() {
    init_logging
    init_pipeline_state
    
    case "$PIPELINE_MODE" in
        "full")
            execute_full_pipeline
            ;;
        "deploy")
            execute_deploy_only_pipeline
            ;;
        "validate")
            execute_validate_only_pipeline
            ;;
        "rollback")
            execute_rollback_pipeline "$ROLLBACK_BACKUP_ID"
            ;;
        "status")
            show_pipeline_status
            ;;
        "help")
            show_usage
            ;;
        *)
            log_error "Unknown pipeline mode: $PIPELINE_MODE"
            show_usage
            exit 1
            ;;
    esac
}

# Parse arguments and run
parse_args "$@"
main