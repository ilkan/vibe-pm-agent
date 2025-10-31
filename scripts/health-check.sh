#!/bin/bash

# NVIDIA NIM Agentic Platform - Health Check Script
# Continuous monitoring and health validation

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs/health"

# Default configuration
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-hybrid}"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-west-2}"
CHECK_INTERVAL="${CHECK_INTERVAL:-300}"  # 5 minutes
ALERT_THRESHOLD="${ALERT_THRESHOLD:-3}"  # Alert after 3 consecutive failures
CONTINUOUS_MODE="${CONTINUOUS_MODE:-false}"
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/health.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/health.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/health.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/health.log"
}

# Initialize logging
init_logging() {
    mkdir -p "$LOGS_DIR"
    
    local log_file="$LOGS_DIR/health.log"
    echo "=== NVIDIA NIM Platform Health Check Started ===" >> "$log_file"
    echo "Timestamp: $(date)" >> "$log_file"
    echo "Environment: $ENVIRONMENT" >> "$log_file"
    echo "Deployment Mode: $DEPLOYMENT_MODE" >> "$log_file"
    echo "AWS Region: $AWS_REGION" >> "$log_file"
    echo "Continuous Mode: $CONTINUOUS_MODE" >> "$log_file"
    echo "Check Interval: ${CHECK_INTERVAL}s" >> "$log_file"
    echo "=============================================" >> "$log_file"
}

# Health check state
health_check_count=0
last_alert_time=0

# Initialize health tracking
init_health_tracking() {
    mkdir -p "$LOGS_DIR"
    touch "$LOGS_DIR/health_state.txt"
    touch "$LOGS_DIR/failure_counts.txt"
}

# Send alert
send_alert() {
    local title="$1"
    local message="$2"
    local severity="$3"  # info, warning, critical
    
    log_error "ALERT: $title - $message"
    
    # Rate limiting: don't send alerts more than once every 15 minutes
    local current_time
    current_time=$(date +%s)
    local time_since_last_alert=$((current_time - last_alert_time))
    
    if [ $time_since_last_alert -lt 900 ] && [ "$severity" != "critical" ]; then
        log_info "Alert rate limited (${time_since_last_alert}s since last alert)"
        return 0
    fi
    
    last_alert_time=$current_time
    
    # Send webhook alert if configured
    if [ -n "$WEBHOOK_URL" ]; then
        local color=""
        case "$severity" in
            "info") color="good" ;;
            "warning") color="warning" ;;
            "critical") color="danger" ;;
        esac
        
        local payload
        payload=$(cat <<EOF
{
  "text": "🚨 NVIDIA NIM Health Alert",
  "attachments": [
    {
      "color": "$color",
      "title": "$title",
      "text": "$message",
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
          "title": "Severity",
          "value": "$severity",
          "short": true
        }
      ],
      "ts": $current_time
    }
  ]
}
EOF
)
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$WEBHOOK_URL" &> /dev/null || log_warning "Failed to send webhook alert"
    fi
}

# Check AWS connectivity
check_aws_connectivity() {
    local check_name="aws_connectivity"
    
    if aws sts get-caller-identity &> /dev/null; then
        health_state["$check_name"]="healthy"
        failure_counts["$check_name"]=0
        return 0
    else
        health_state["$check_name"]="unhealthy"
        failure_counts["$check_name"]=$((${failure_counts["$check_name"]:-0} + 1))
        
        if [ "${failure_counts["$check_name"]}" -ge "$ALERT_THRESHOLD" ]; then
            send_alert "AWS Connectivity Failed" \
                "Cannot connect to AWS services. Check credentials and network connectivity." \
                "critical"
        fi
        
        return 1
    fi
}

# Check CloudFormation stacks
check_cloudformation_stacks() {
    local check_name="cloudformation_stacks"
    local unhealthy_stacks=()
    
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
        
        if [[ "$stack_status" != "CREATE_COMPLETE" && "$stack_status" != "UPDATE_COMPLETE" ]]; then
            unhealthy_stacks+=("$stack:$stack_status")
        fi
    done
    
    if [ ${#unhealthy_stacks[@]} -eq 0 ]; then
        health_state["$check_name"]="healthy"
        failure_counts["$check_name"]=0
        return 0
    else
        health_state["$check_name"]="unhealthy"
        failure_counts["$check_name"]=$((${failure_counts["$check_name"]:-0} + 1))
        
        if [ "${failure_counts["$check_name"]}" -ge "$ALERT_THRESHOLD" ]; then
            local stack_list
            stack_list=$(printf "%s, " "${unhealthy_stacks[@]}")
            stack_list=${stack_list%, }
            
            send_alert "CloudFormation Stacks Unhealthy" \
                "Unhealthy stacks: $stack_list" \
                "critical"
        fi
        
        return 1
    fi
}

# Check EKS cluster
check_eks_cluster() {
    if [[ "$DEPLOYMENT_MODE" != "eks" && "$DEPLOYMENT_MODE" != "hybrid" ]]; then
        return 0
    fi
    
    local check_name="eks_cluster"
    local issues=()
    
    # Check cluster status
    local cluster_status
    cluster_status=$(aws eks describe-cluster --name nvidia-nim-cluster --query 'cluster.status' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$cluster_status" != "ACTIVE" ]; then
        issues+=("cluster:$cluster_status")
    fi
    
    # Check node group
    local nodegroup_status
    nodegroup_status=$(aws eks describe-nodegroup --cluster-name nvidia-nim-cluster --nodegroup-name gpu-nodes --query 'nodegroup.status' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$nodegroup_status" != "ACTIVE" ]; then
        issues+=("nodegroup:$nodegroup_status")
    fi
    
    # Check pods if kubectl is available
    if kubectl cluster-info &> /dev/null; then
        local running_pods
        running_pods=$(kubectl get pods -n nvidia-nim --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l || echo "0")
        
        if [ "$running_pods" -lt 2 ]; then
            issues+=("pods:$running_pods")
        fi
    else
        issues+=("kubectl:unavailable")
    fi
    
    if [ ${#issues[@]} -eq 0 ]; then
        health_state["$check_name"]="healthy"
        failure_counts["$check_name"]=0
        return 0
    else
        health_state["$check_name"]="unhealthy"
        failure_counts["$check_name"]=$((${failure_counts["$check_name"]:-0} + 1))
        
        if [ "${failure_counts["$check_name"]}" -ge "$ALERT_THRESHOLD" ]; then
            local issue_list
            issue_list=$(printf "%s, " "${issues[@]}")
            issue_list=${issue_list%, }
            
            send_alert "EKS Cluster Issues" \
                "EKS cluster problems detected: $issue_list" \
                "critical"
        fi
        
        return 1
    fi
}

# Check SageMaker endpoints
check_sagemaker_endpoints() {
    if [[ "$DEPLOYMENT_MODE" != "sagemaker" && "$DEPLOYMENT_MODE" != "hybrid" ]]; then
        return 0
    fi
    
    local check_name="sagemaker_endpoints"
    local unhealthy_endpoints=()
    
    # Get endpoint names from CloudFormation outputs
    local llama_endpoint
    llama_endpoint=$(aws cloudformation describe-stacks --stack-name NvidiaNimSageMaker --query 'Stacks[0].Outputs[?OutputKey==`LlamaEndpointName`].OutputValue' --output text 2>/dev/null || echo "")
    
    local embedding_endpoint
    embedding_endpoint=$(aws cloudformation describe-stacks --stack-name NvidiaNimSageMaker --query 'Stacks[0].Outputs[?OutputKey==`EmbeddingEndpointName`].OutputValue' --output text 2>/dev/null || echo "")
    
    # Check LLaMA endpoint
    if [ -n "$llama_endpoint" ]; then
        local endpoint_status
        endpoint_status=$(aws sagemaker describe-endpoint --endpoint-name "$llama_endpoint" --query 'EndpointStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$endpoint_status" != "InService" ]; then
            unhealthy_endpoints+=("llama:$endpoint_status")
        fi
    fi
    
    # Check embedding endpoint
    if [ -n "$embedding_endpoint" ]; then
        local endpoint_status
        endpoint_status=$(aws sagemaker describe-endpoint --endpoint-name "$embedding_endpoint" --query 'EndpointStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$endpoint_status" != "InService" ]; then
            unhealthy_endpoints+=("embedding:$endpoint_status")
        fi
    fi
    
    if [ ${#unhealthy_endpoints[@]} -eq 0 ]; then
        health_state["$check_name"]="healthy"
        failure_counts["$check_name"]=0
        return 0
    else
        health_state["$check_name"]="unhealthy"
        failure_counts["$check_name"]=$((${failure_counts["$check_name"]:-0} + 1))
        
        if [ "${failure_counts["$check_name"]}" -ge "$ALERT_THRESHOLD" ]; then
            local endpoint_list
            endpoint_list=$(printf "%s, " "${unhealthy_endpoints[@]}")
            endpoint_list=${endpoint_list%, }
            
            send_alert "SageMaker Endpoints Unhealthy" \
                "Unhealthy endpoints: $endpoint_list" \
                "critical"
        fi
        
        return 1
    fi
}

# Check Lambda functions
check_lambda_functions() {
    local check_name="lambda_functions"
    local unhealthy_functions=()
    
    local function_names=("vibe-pm-agent-dev" "nvidia-nim-integration" "agent-orchestration")
    
    for function_name in "${function_names[@]}"; do
        if aws lambda get-function --function-name "$function_name" &> /dev/null; then
            local state
            state=$(aws lambda get-function --function-name "$function_name" --query 'Configuration.State' --output text 2>/dev/null || echo "unknown")
            
            if [ "$state" != "Active" ]; then
                unhealthy_functions+=("$function_name:$state")
            fi
            
            # Test function invocation
            local test_payload='{"test": true, "source": "health-check"}'
            local response_file="/tmp/health-lambda-$function_name.json"
            
            if ! aws lambda invoke --function-name "$function_name" --payload "$test_payload" "$response_file" &> /dev/null; then
                unhealthy_functions+=("$function_name:invocation_failed")
            fi
            
            rm -f "$response_file"
        else
            unhealthy_functions+=("$function_name:not_found")
        fi
    done
    
    if [ ${#unhealthy_functions[@]} -eq 0 ]; then
        health_state["$check_name"]="healthy"
        failure_counts["$check_name"]=0
        return 0
    else
        health_state["$check_name"]="unhealthy"
        failure_counts["$check_name"]=$((${failure_counts["$check_name"]:-0} + 1))
        
        if [ "${failure_counts["$check_name"]}" -ge "$ALERT_THRESHOLD" ]; then
            local function_list
            function_list=$(printf "%s, " "${unhealthy_functions[@]}")
            function_list=${function_list%, }
            
            send_alert "Lambda Functions Unhealthy" \
                "Unhealthy functions: $function_list" \
                "critical"
        fi
        
        return 1
    fi
}

# Check application health
check_application_health() {
    local check_name="application_health"
    local issues=()
    
    # Test MCP server health
    cd "$PROJECT_ROOT"
    
    if [ -f "dist/mcp/cli.js" ]; then
        if ! timeout 30 node dist/mcp/cli.js --health &> /dev/null; then
            issues+=("mcp_server:unhealthy")
        fi
    else
        issues+=("mcp_server:not_found")
    fi
    
    # Test local NIM integration (if available)
    if command -v curl &> /dev/null && [ -f "$SCRIPT_DIR/test-local-nim.sh" ]; then
        if timeout 10 bash "$SCRIPT_DIR/test-local-nim.sh" connectivity &> /dev/null; then
            # Local NIM is available (development/testing)
            log_info "Local NIM is available"
        else
            # This is expected in production, so don't treat as an issue
            log_info "Local NIM not available (expected in production)"
        fi
    fi
    
    if [ ${#issues[@]} -eq 0 ]; then
        health_state["$check_name"]="healthy"
        failure_counts["$check_name"]=0
        return 0
    else
        health_state["$check_name"]="unhealthy"
        failure_counts["$check_name"]=$((${failure_counts["$check_name"]:-0} + 1))
        
        if [ "${failure_counts["$check_name"]}" -ge "$ALERT_THRESHOLD" ]; then
            local issue_list
            issue_list=$(printf "%s, " "${issues[@]}")
            issue_list=${issue_list%, }
            
            send_alert "Application Health Issues" \
                "Application problems detected: $issue_list" \
                "warning"
        fi
        
        return 1
    fi
}

# Run single health check
run_health_check() {
    health_check_count=$((health_check_count + 1))
    local start_time
    start_time=$(date +%s)
    
    log_info "Running health check #$health_check_count"
    
    local checks_passed=0
    local checks_total=0
    
    # Run all health checks
    local checks=(
        "check_aws_connectivity"
        "check_cloudformation_stacks"
        "check_eks_cluster"
        "check_sagemaker_endpoints"
        "check_lambda_functions"
        "check_application_health"
    )
    
    for check in "${checks[@]}"; do
        checks_total=$((checks_total + 1))
        
        if $check; then
            checks_passed=$((checks_passed + 1))
        fi
    done
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Generate health report
    local health_file="$LOGS_DIR/health_status.json"
    cat > "$health_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "deployment_mode": "$DEPLOYMENT_MODE",
  "aws_region": "$AWS_REGION",
  "check_number": $health_check_count,
  "duration_seconds": $duration,
  "checks_passed": $checks_passed,
  "checks_total": $checks_total,
  "success_rate": $(( checks_passed * 100 / checks_total )),
  "overall_status": "$([ $checks_passed -eq $checks_total ] && echo "healthy" || echo "unhealthy")",
  "components": {
EOF
    
    local first=true
    for component in "${!health_state[@]}"; do
        local status="${health_state[$component]}"
        local failures="${failure_counts[$component]:-0}"
        
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$health_file"
        fi
        
        echo "    \"$component\": {\"status\": \"$status\", \"consecutive_failures\": $failures}" >> "$health_file"
    done
    
    cat >> "$health_file" <<EOF
  }
}
EOF
    
    # Log summary
    if [ $checks_passed -eq $checks_total ]; then
        log_success "Health check #$health_check_count completed: $checks_passed/$checks_total checks passed (${duration}s)"
    else
        log_warning "Health check #$health_check_count completed: $checks_passed/$checks_total checks passed (${duration}s)"
    fi
    
    # Send recovery notification if system recovered
    local failed_components=0
    for component in "${!health_state[@]}"; do
        if [ "${health_state[$component]}" = "unhealthy" ]; then
            failed_components=$((failed_components + 1))
        fi
    done
    
    if [ $failed_components -eq 0 ] && [ $health_check_count -gt 1 ]; then
        # Check if we had failures before
        local had_previous_failures=false
        for component in "${!failure_counts[@]}"; do
            if [ "${failure_counts[$component]}" -gt 0 ]; then
                had_previous_failures=true
                break
            fi
        done
        
        if [ "$had_previous_failures" = true ]; then
            send_alert "System Recovery" \
                "All health checks are now passing. System has recovered." \
                "info"
            
            # Reset failure counts
            for component in "${!failure_counts[@]}"; do
                failure_counts["$component"]=0
            done
        fi
    fi
}

# Continuous monitoring mode
continuous_monitoring() {
    log_info "Starting continuous health monitoring (interval: ${CHECK_INTERVAL}s)"
    
    # Handle signals for graceful shutdown
    trap 'log_info "Stopping continuous monitoring..."; exit 0' SIGINT SIGTERM
    
    while true; do
        run_health_check
        
        if [ "$CONTINUOUS_MODE" = "true" ]; then
            log_info "Waiting ${CHECK_INTERVAL}s until next check..."
            sleep "$CHECK_INTERVAL"
        else
            break
        fi
    done
}

# Show current health status
show_health_status() {
    local health_file="$LOGS_DIR/health_status.json"
    
    if [ -f "$health_file" ]; then
        echo "=== NVIDIA NIM Platform Health Status ==="
        echo
        echo "Environment: $(jq -r '.environment' "$health_file")"
        echo "Deployment Mode: $(jq -r '.deployment_mode' "$health_file")"
        echo "AWS Region: $(jq -r '.aws_region' "$health_file")"
        echo "Last Check: $(jq -r '.timestamp' "$health_file")"
        echo "Overall Status: $(jq -r '.overall_status' "$health_file" | tr '[:lower:]' '[:upper:]')"
        echo "Success Rate: $(jq -r '.success_rate' "$health_file")%"
        echo
        echo "Component Status:"
        
        jq -r '.components | to_entries[] | "  \(.key | gsub("_"; " ") | ascii_upcase): \(.value.status | ascii_upcase) (failures: \(.value.consecutive_failures))"' "$health_file"
    else
        echo "No health status available. Run a health check first."
    fi
}

# Show usage information
show_usage() {
    cat <<EOF
NVIDIA NIM Agentic Platform - Health Check

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  check               Run single health check (default)
  monitor             Start continuous monitoring
  status              Show current health status
  help                Show this help message

Options:
  --mode MODE         Deployment mode: eks, sagemaker, or hybrid (default: hybrid)
  --env ENV           Environment: development, staging, or production (default: production)
  --region REGION     AWS region (default: us-west-2)
  --interval SECONDS  Check interval for continuous monitoring (default: 300)
  --threshold COUNT   Alert threshold for consecutive failures (default: 3)
  --webhook URL       Webhook URL for alerts

Environment Variables:
  DEPLOYMENT_MODE     Deployment mode (eks, sagemaker, hybrid)
  ENVIRONMENT         Target environment
  AWS_REGION          AWS region for health checks
  CHECK_INTERVAL      Check interval in seconds
  ALERT_THRESHOLD     Alert threshold for consecutive failures
  CONTINUOUS_MODE     Enable continuous monitoring (true/false)
  WEBHOOK_URL         Webhook URL for alerts

Examples:
  $0 check --env production
  $0 monitor --interval 60 --webhook https://hooks.slack.com/...
  $0 status
  $0 check --mode eks --env staging

Health Checks:
  - AWS connectivity and credentials
  - CloudFormation stack status
  - EKS cluster and pod health (if applicable)
  - SageMaker endpoint status (if applicable)
  - Lambda function health and invocation
  - Application health (MCP server)

EOF
}

# Parse command line arguments
parse_args() {
    local command="check"
    
    if [ $# -gt 0 ] && [[ ! "$1" =~ ^-- ]]; then
        command="$1"
        shift
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
            --interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            --threshold)
                ALERT_THRESHOLD="$2"
                shift 2
                ;;
            --webhook)
                WEBHOOK_URL="$2"
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
    
    case "$command" in
        "check")
            CONTINUOUS_MODE=false
            ;;
        "monitor")
            CONTINUOUS_MODE=true
            ;;
        "status")
            show_health_status
            exit 0
            ;;
        "help")
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Main execution
main() {
    init_logging
    init_health_tracking
    
    log_info "NVIDIA NIM Platform Health Check"
    log_info "Mode: $DEPLOYMENT_MODE | Environment: $ENVIRONMENT | Region: $AWS_REGION"
    
    if [ "$CONTINUOUS_MODE" = "true" ]; then
        log_info "Continuous monitoring enabled (interval: ${CHECK_INTERVAL}s, threshold: $ALERT_THRESHOLD)"
        continuous_monitoring
    else
        run_health_check
    fi
}

# Parse arguments and run
parse_args "$@"
main