#!/bin/bash

# NVIDIA NIM Agentic Platform - Deployment Validation Script
# Comprehensive validation and health checks for deployed infrastructure

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs/validation"

# Default configuration
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-hybrid}"
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-us-west-2}"
VALIDATION_TIMEOUT="${VALIDATION_TIMEOUT:-300}"
DETAILED_OUTPUT="${DETAILED_OUTPUT:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/validation.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/validation.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/validation.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/validation.log"
}

log_test() {
    echo -e "${PURPLE}[TEST]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOGS_DIR/validation.log"
}

# Initialize logging
init_logging() {
    mkdir -p "$LOGS_DIR"
    
    local log_file="$LOGS_DIR/validation.log"
    echo "=== NVIDIA NIM Platform Validation Started ===" >> "$log_file"
    echo "Timestamp: $(date)" >> "$log_file"
    echo "Environment: $ENVIRONMENT" >> "$log_file"
    echo "Deployment Mode: $DEPLOYMENT_MODE" >> "$log_file"
    echo "AWS Region: $AWS_REGION" >> "$log_file"
    echo "=============================================" >> "$log_file"
}

# Validation results tracking
validation_passed=0
validation_failed=0
validation_warnings=0

# Initialize validation tracking
init_validation_tracking() {
    mkdir -p "$LOGS_DIR"
    touch "$LOGS_DIR/validation_results.txt"
}

# Record validation result
record_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    # Save to text file for compatibility
    echo "$test_name:$result:$message:$(date +%s)" >> "$LOGS_DIR/validation_results.txt"
    
    case "$result" in
        "PASS")
            validation_passed=$((validation_passed + 1))
            log_success "✅ $test_name: $message"
            ;;
        "FAIL")
            validation_failed=$((validation_failed + 1))
            log_error "❌ $test_name: $message"
            ;;
        "WARN")
            validation_warnings=$((validation_warnings + 1))
            log_warning "⚠️  $test_name: $message"
            ;;
    esac
}

# Test AWS connectivity and credentials
test_aws_connectivity() {
    log_test "Testing AWS connectivity and credentials..."
    
    # Test AWS CLI access
    if aws sts get-caller-identity &> /dev/null; then
        local account_id
        account_id=$(aws sts get-caller-identity --query Account --output text)
        local user_arn
        user_arn=$(aws sts get-caller-identity --query Arn --output text)
        record_result "AWS_CONNECTIVITY" "PASS" "Connected as $user_arn in account $account_id"
    else
        record_result "AWS_CONNECTIVITY" "FAIL" "Cannot access AWS - check credentials"
        return 1
    fi
    
    # Test region access
    if aws ec2 describe-regions --region "$AWS_REGION" &> /dev/null; then
        record_result "AWS_REGION" "PASS" "Region $AWS_REGION is accessible"
    else
        record_result "AWS_REGION" "FAIL" "Cannot access region $AWS_REGION"
        return 1
    fi
}

# Test CloudFormation stacks
test_cloudformation_stacks() {
    log_test "Testing CloudFormation stacks..."
    
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
        
        case "$stack_status" in
            "CREATE_COMPLETE"|"UPDATE_COMPLETE")
                record_result "STACK_$stack" "PASS" "Stack is healthy ($stack_status)"
                ;;
            "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS")
                record_result "STACK_$stack" "WARN" "Stack is updating ($stack_status)"
                ;;
            "NOT_FOUND")
                record_result "STACK_$stack" "FAIL" "Stack not found"
                ;;
            *)
                record_result "STACK_$stack" "FAIL" "Stack is unhealthy ($stack_status)"
                ;;
        esac
    done
}

# Test EKS cluster
test_eks_cluster() {
    if [[ "$DEPLOYMENT_MODE" != "eks" && "$DEPLOYMENT_MODE" != "hybrid" ]]; then
        return 0
    fi
    
    log_test "Testing EKS cluster..."
    
    # Test cluster status
    local cluster_status
    cluster_status=$(aws eks describe-cluster --name nvidia-nim-cluster --query 'cluster.status' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$cluster_status" = "ACTIVE" ]; then
        record_result "EKS_CLUSTER" "PASS" "Cluster is active"
    else
        record_result "EKS_CLUSTER" "FAIL" "Cluster is not active ($cluster_status)"
        return 1
    fi
    
    # Test kubectl connectivity
    if kubectl cluster-info &> /dev/null; then
        record_result "EKS_KUBECTL" "PASS" "kubectl connectivity successful"
    else
        record_result "EKS_KUBECTL" "FAIL" "kubectl cannot connect to cluster"
        return 1
    fi
    
    # Test node group
    local nodegroup_status
    nodegroup_status=$(aws eks describe-nodegroup --cluster-name nvidia-nim-cluster --nodegroup-name gpu-nodes --query 'nodegroup.status' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$nodegroup_status" = "ACTIVE" ]; then
        record_result "EKS_NODEGROUP" "PASS" "Node group is active"
    else
        record_result "EKS_NODEGROUP" "FAIL" "Node group is not active ($nodegroup_status)"
    fi
    
    # Test pods
    if kubectl get pods -n nvidia-nim &> /dev/null; then
        local running_pods
        running_pods=$(kubectl get pods -n nvidia-nim --field-selector=status.phase=Running --no-headers | wc -l)
        local total_pods
        total_pods=$(kubectl get pods -n nvidia-nim --no-headers | wc -l)
        
        if [ "$running_pods" -ge 2 ]; then
            record_result "EKS_PODS" "PASS" "$running_pods/$total_pods pods running"
        elif [ "$running_pods" -gt 0 ]; then
            record_result "EKS_PODS" "WARN" "Only $running_pods/$total_pods pods running"
        else
            record_result "EKS_PODS" "FAIL" "No pods running in nvidia-nim namespace"
        fi
        
        # Test pod health
        test_pod_health
    else
        record_result "EKS_NAMESPACE" "FAIL" "Cannot access nvidia-nim namespace"
    fi
}

# Test individual pod health
test_pod_health() {
    log_test "Testing pod health..."
    
    local pods
    pods=$(kubectl get pods -n nvidia-nim --no-headers -o custom-columns=":metadata.name" 2>/dev/null || echo "")
    
    if [ -z "$pods" ]; then
        record_result "POD_HEALTH" "FAIL" "No pods found"
        return 1
    fi
    
    local healthy_pods=0
    local total_pods=0
    
    while IFS= read -r pod; do
        if [ -n "$pod" ]; then
            total_pods=$((total_pods + 1))
            
            local pod_status
            pod_status=$(kubectl get pod "$pod" -n nvidia-nim -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
            
            local ready_containers
            ready_containers=$(kubectl get pod "$pod" -n nvidia-nim -o jsonpath='{.status.containerStatuses[*].ready}' 2>/dev/null | grep -o "true" | wc -l || echo "0")
            
            local total_containers
            total_containers=$(kubectl get pod "$pod" -n nvidia-nim -o jsonpath='{.spec.containers[*].name}' 2>/dev/null | wc -w || echo "0")
            
            if [ "$pod_status" = "Running" ] && [ "$ready_containers" -eq "$total_containers" ] && [ "$total_containers" -gt 0 ]; then
                healthy_pods=$((healthy_pods + 1))
                if [ "$DETAILED_OUTPUT" = "true" ]; then
                    record_result "POD_$pod" "PASS" "Pod is healthy ($ready_containers/$total_containers containers ready)"
                fi
            else
                if [ "$DETAILED_OUTPUT" = "true" ]; then
                    record_result "POD_$pod" "FAIL" "Pod is unhealthy (status: $pod_status, ready: $ready_containers/$total_containers)"
                fi
            fi
        fi
    done <<< "$pods"
    
    if [ "$healthy_pods" -eq "$total_pods" ] && [ "$total_pods" -gt 0 ]; then
        record_result "POD_HEALTH" "PASS" "All $total_pods pods are healthy"
    elif [ "$healthy_pods" -gt 0 ]; then
        record_result "POD_HEALTH" "WARN" "$healthy_pods/$total_pods pods are healthy"
    else
        record_result "POD_HEALTH" "FAIL" "No healthy pods found"
    fi
}

# Test SageMaker endpoints
test_sagemaker_endpoints() {
    if [[ "$DEPLOYMENT_MODE" != "sagemaker" && "$DEPLOYMENT_MODE" != "hybrid" ]]; then
        return 0
    fi
    
    log_test "Testing SageMaker endpoints..."
    
    # Get endpoint names from CloudFormation outputs
    local llama_endpoint
    llama_endpoint=$(aws cloudformation describe-stacks --stack-name NvidiaNimSageMaker --query 'Stacks[0].Outputs[?OutputKey==`LlamaEndpointName`].OutputValue' --output text 2>/dev/null || echo "")
    
    local embedding_endpoint
    embedding_endpoint=$(aws cloudformation describe-stacks --stack-name NvidiaNimSageMaker --query 'Stacks[0].Outputs[?OutputKey==`EmbeddingEndpointName`].OutputValue' --output text 2>/dev/null || echo "")
    
    # Test LLaMA endpoint
    if [ -n "$llama_endpoint" ]; then
        local endpoint_status
        endpoint_status=$(aws sagemaker describe-endpoint --endpoint-name "$llama_endpoint" --query 'EndpointStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$endpoint_status" = "InService" ]; then
            record_result "SAGEMAKER_LLAMA" "PASS" "LLaMA endpoint is in service"
            
            # Test endpoint invocation
            test_sagemaker_invocation "$llama_endpoint" "llama"
        else
            record_result "SAGEMAKER_LLAMA" "FAIL" "LLaMA endpoint is not in service ($endpoint_status)"
        fi
    else
        record_result "SAGEMAKER_LLAMA" "FAIL" "LLaMA endpoint not found"
    fi
    
    # Test embedding endpoint
    if [ -n "$embedding_endpoint" ]; then
        local endpoint_status
        endpoint_status=$(aws sagemaker describe-endpoint --endpoint-name "$embedding_endpoint" --query 'EndpointStatus' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$endpoint_status" = "InService" ]; then
            record_result "SAGEMAKER_EMBEDDING" "PASS" "Embedding endpoint is in service"
            
            # Test endpoint invocation
            test_sagemaker_invocation "$embedding_endpoint" "embedding"
        else
            record_result "SAGEMAKER_EMBEDDING" "FAIL" "Embedding endpoint is not in service ($endpoint_status)"
        fi
    else
        record_result "SAGEMAKER_EMBEDDING" "FAIL" "Embedding endpoint not found"
    fi
}

# Test SageMaker endpoint invocation
test_sagemaker_invocation() {
    local endpoint_name="$1"
    local endpoint_type="$2"
    
    log_test "Testing $endpoint_type endpoint invocation..."
    
    local test_payload
    if [ "$endpoint_type" = "llama" ]; then
        test_payload='{"inputs": "Hello, how are you?", "parameters": {"max_new_tokens": 10, "temperature": 0.1}}'
    else
        test_payload='{"inputs": "Test embedding generation"}'
    fi
    
    local response_file="/tmp/sagemaker-response-$endpoint_type.json"
    
    if aws sagemaker-runtime invoke-endpoint \
        --endpoint-name "$endpoint_name" \
        --content-type "application/json" \
        --body "$test_payload" \
        "$response_file" &> /dev/null; then
        
        if [ -s "$response_file" ]; then
            record_result "SAGEMAKER_${endpoint_type^^}_INVOKE" "PASS" "Endpoint invocation successful"
        else
            record_result "SAGEMAKER_${endpoint_type^^}_INVOKE" "FAIL" "Endpoint returned empty response"
        fi
        
        rm -f "$response_file"
    else
        record_result "SAGEMAKER_${endpoint_type^^}_INVOKE" "FAIL" "Endpoint invocation failed"
    fi
}

# Test Lambda functions
test_lambda_functions() {
    log_test "Testing Lambda functions..."
    
    local function_names=("vibe-pm-agent-dev" "nvidia-nim-integration" "agent-orchestration")
    
    for function_name in "${function_names[@]}"; do
        # Check if function exists
        if aws lambda get-function --function-name "$function_name" &> /dev/null; then
            record_result "LAMBDA_${function_name^^}_EXISTS" "PASS" "Function exists"
            
            # Test function configuration
            local runtime
            runtime=$(aws lambda get-function --function-name "$function_name" --query 'Configuration.Runtime' --output text 2>/dev/null || echo "unknown")
            
            local state
            state=$(aws lambda get-function --function-name "$function_name" --query 'Configuration.State' --output text 2>/dev/null || echo "unknown")
            
            if [ "$state" = "Active" ]; then
                record_result "LAMBDA_${function_name^^}_STATE" "PASS" "Function is active (runtime: $runtime)"
            else
                record_result "LAMBDA_${function_name^^}_STATE" "FAIL" "Function is not active (state: $state)"
            fi
            
            # Test function invocation
            test_lambda_invocation "$function_name"
        else
            record_result "LAMBDA_${function_name^^}_EXISTS" "FAIL" "Function does not exist"
        fi
    done
}

# Test Lambda function invocation
test_lambda_invocation() {
    local function_name="$1"
    
    log_test "Testing $function_name invocation..."
    
    local test_payload='{"test": true, "source": "validation-script", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
    local response_file="/tmp/lambda-response-$function_name.json"
    
    if aws lambda invoke \
        --function-name "$function_name" \
        --payload "$test_payload" \
        "$response_file" &> /dev/null; then
        
        if [ -s "$response_file" ]; then
            local status_code
            status_code=$(jq -r '.StatusCode // 200' "$response_file" 2>/dev/null || echo "200")
            
            if [ "$status_code" = "200" ]; then
                record_result "LAMBDA_${function_name^^}_INVOKE" "PASS" "Invocation successful"
            else
                record_result "LAMBDA_${function_name^^}_INVOKE" "FAIL" "Invocation returned status $status_code"
            fi
        else
            record_result "LAMBDA_${function_name^^}_INVOKE" "FAIL" "Invocation returned empty response"
        fi
        
        rm -f "$response_file"
    else
        record_result "LAMBDA_${function_name^^}_INVOKE" "FAIL" "Invocation failed"
    fi
}

# Test API Gateway endpoints
test_api_gateway() {
    log_test "Testing API Gateway endpoints..."
    
    # Get API Gateway URL from CloudFormation outputs
    local api_url
    api_url=$(aws cloudformation describe-stacks --stack-name NvidiaNimLambda --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text 2>/dev/null || echo "")
    
    if [ -n "$api_url" ]; then
        record_result "API_GATEWAY_EXISTS" "PASS" "API Gateway URL found: $api_url"
        
        # Test health endpoint
        if curl -s --max-time 30 "$api_url/health" > /dev/null 2>&1; then
            record_result "API_GATEWAY_HEALTH" "PASS" "Health endpoint accessible"
        else
            record_result "API_GATEWAY_HEALTH" "FAIL" "Health endpoint not accessible"
        fi
        
        # Test MCP endpoint
        if curl -s --max-time 30 -H "Content-Type: application/json" -d '{"test": true}' "$api_url/mcp" > /dev/null 2>&1; then
            record_result "API_GATEWAY_MCP" "PASS" "MCP endpoint accessible"
        else
            record_result "API_GATEWAY_MCP" "WARN" "MCP endpoint may not be accessible (expected for some configurations)"
        fi
    else
        record_result "API_GATEWAY_EXISTS" "FAIL" "API Gateway URL not found"
    fi
}

# Test monitoring and logging
test_monitoring() {
    log_test "Testing monitoring and logging..."
    
    # Test CloudWatch log groups
    local log_groups=("/aws/lambda/vibe-pm-agent-dev" "/aws/lambda/nvidia-nim-integration" "/aws/eks/nvidia-nim-cluster/cluster")
    
    for log_group in "${log_groups[@]}"; do
        if aws logs describe-log-groups --log-group-name-prefix "$log_group" --query 'logGroups[0].logGroupName' --output text 2>/dev/null | grep -q "$log_group"; then
            record_result "CLOUDWATCH_LOG_${log_group//\//_}" "PASS" "Log group exists"
        else
            record_result "CLOUDWATCH_LOG_${log_group//\//_}" "WARN" "Log group not found (may be created on first use)"
        fi
    done
    
    # Test CloudWatch metrics
    local namespace="AWS/Lambda"
    local metric_name="Invocations"
    
    if aws cloudwatch list-metrics --namespace "$namespace" --metric-name "$metric_name" --query 'Metrics[0].MetricName' --output text 2>/dev/null | grep -q "$metric_name"; then
        record_result "CLOUDWATCH_METRICS" "PASS" "CloudWatch metrics available"
    else
        record_result "CLOUDWATCH_METRICS" "WARN" "CloudWatch metrics not yet available"
    fi
}

# Test security and compliance
test_security() {
    log_test "Testing security and compliance..."
    
    # Test IAM roles
    local roles=("NvidiaNimLambdaRole" "NvidiaNimEksRole" "NvidiaNimSageMakerRole")
    
    for role in "${roles[@]}"; do
        if aws iam get-role --role-name "$role" &> /dev/null; then
            record_result "IAM_ROLE_$role" "PASS" "IAM role exists"
        else
            record_result "IAM_ROLE_$role" "WARN" "IAM role not found (may use different naming)"
        fi
    done
    
    # Test VPC security groups
    local vpc_id
    vpc_id=$(aws cloudformation describe-stacks --stack-name NvidiaNimNetworking --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text 2>/dev/null || echo "")
    
    if [ -n "$vpc_id" ]; then
        local sg_count
        sg_count=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpc_id" --query 'SecurityGroups | length(@)' --output text 2>/dev/null || echo "0")
        
        if [ "$sg_count" -gt 0 ]; then
            record_result "VPC_SECURITY_GROUPS" "PASS" "$sg_count security groups found"
        else
            record_result "VPC_SECURITY_GROUPS" "FAIL" "No security groups found"
        fi
    else
        record_result "VPC_SECURITY_GROUPS" "FAIL" "VPC ID not found"
    fi
}

# Test application functionality
test_application_functionality() {
    log_test "Testing application functionality..."
    
    # Test MCP server health
    cd "$PROJECT_ROOT"
    
    if [ -f "dist/mcp/cli.js" ]; then
        if timeout 30 node dist/mcp/cli.js --health &> /dev/null; then
            record_result "MCP_SERVER_HEALTH" "PASS" "MCP server health check passed"
        else
            record_result "MCP_SERVER_HEALTH" "FAIL" "MCP server health check failed"
        fi
    else
        record_result "MCP_SERVER_HEALTH" "FAIL" "MCP server CLI not found"
    fi
    
    # Test local NIM integration (if available)
    if command -v curl &> /dev/null && [ -f "$SCRIPT_DIR/test-local-nim.sh" ]; then
        if timeout 30 bash "$SCRIPT_DIR/test-local-nim.sh" connectivity &> /dev/null; then
            record_result "LOCAL_NIM_CONNECTIVITY" "PASS" "Local NIM connectivity successful"
        else
            record_result "LOCAL_NIM_CONNECTIVITY" "WARN" "Local NIM not available (expected in production)"
        fi
    fi
}

# Run performance tests
test_performance() {
    log_test "Running performance tests..."
    
    # Test Lambda cold start times
    local function_name="vibe-pm-agent-dev"
    
    if aws lambda get-function --function-name "$function_name" &> /dev/null; then
        local start_time
        start_time=$(date +%s%3N)
        
        if aws lambda invoke --function-name "$function_name" --payload '{"test": true}' /tmp/perf-test.json &> /dev/null; then
            local end_time
            end_time=$(date +%s%3N)
            local duration=$((end_time - start_time))
            
            if [ "$duration" -lt 5000 ]; then
                record_result "LAMBDA_PERFORMANCE" "PASS" "Lambda response time: ${duration}ms"
            elif [ "$duration" -lt 10000 ]; then
                record_result "LAMBDA_PERFORMANCE" "WARN" "Lambda response time: ${duration}ms (slow)"
            else
                record_result "LAMBDA_PERFORMANCE" "FAIL" "Lambda response time: ${duration}ms (too slow)"
            fi
            
            rm -f /tmp/perf-test.json
        else
            record_result "LAMBDA_PERFORMANCE" "FAIL" "Lambda performance test failed"
        fi
    fi
}

# Generate validation report
generate_report() {
    log_info "Generating validation report..."
    
    local report_file="$LOGS_DIR/validation_report_$(date +%Y%m%d_%H%M%S).json"
    local summary_file="$LOGS_DIR/validation_summary.txt"
    
    # Create JSON report
    cat > "$report_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "deployment_mode": "$DEPLOYMENT_MODE",
  "aws_region": "$AWS_REGION",
  "validation_timeout": $VALIDATION_TIMEOUT,
  "summary": {
    "total_tests": $((validation_passed + validation_failed + validation_warnings)),
    "passed": $validation_passed,
    "failed": $validation_failed,
    "warnings": $validation_warnings,
    "success_rate": $(( validation_passed * 100 / (validation_passed + validation_failed + validation_warnings) ))
  },
  "results": {
EOF
    
    local first=true
    for test_name in "${!validation_results[@]}"; do
        local result="${validation_results[$test_name]}"
        local status="${result%%:*}"
        local message="${result#*:}"
        
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi
        
        echo "    \"$test_name\": {\"status\": \"$status\", \"message\": \"$message\"}" >> "$report_file"
    done
    
    cat >> "$report_file" <<EOF
  }
}
EOF
    
    # Create summary report
    cat > "$summary_file" <<EOF
NVIDIA NIM Platform Validation Summary
=====================================

Timestamp: $(date)
Environment: $ENVIRONMENT
Deployment Mode: $DEPLOYMENT_MODE
AWS Region: $AWS_REGION

Test Results:
  Total Tests: $((validation_passed + validation_failed + validation_warnings))
  Passed: $validation_passed
  Failed: $validation_failed
  Warnings: $validation_warnings
  Success Rate: $(( validation_passed * 100 / (validation_passed + validation_failed + validation_warnings) ))%

Status: $([ $validation_failed -eq 0 ] && echo "HEALTHY" || echo "UNHEALTHY")

Detailed Results:
EOF
    
    for test_name in "${!validation_results[@]}"; do
        local result="${validation_results[$test_name]}"
        local status="${result%%:*}"
        local message="${result#*:}"
        
        case "$status" in
            "PASS") echo "  ✅ $test_name: $message" >> "$summary_file" ;;
            "FAIL") echo "  ❌ $test_name: $message" >> "$summary_file" ;;
            "WARN") echo "  ⚠️  $test_name: $message" >> "$summary_file" ;;
        esac
    done
    
    log_success "Validation report generated: $report_file"
    log_success "Validation summary: $summary_file"
    
    # Display summary
    cat "$summary_file"
}

# Show usage information
show_usage() {
    cat <<EOF
NVIDIA NIM Agentic Platform - Deployment Validation

Usage: $0 [OPTIONS]

Options:
  --mode MODE         Deployment mode: eks, sagemaker, or hybrid (default: hybrid)
  --env ENV           Environment: development, staging, or production (default: production)
  --region REGION     AWS region (default: us-west-2)
  --timeout SECONDS   Validation timeout (default: 300)
  --detailed          Enable detailed output for all tests
  --help              Show this help message

Environment Variables:
  DEPLOYMENT_MODE     Deployment mode (eks, sagemaker, hybrid)
  ENVIRONMENT         Target environment
  AWS_REGION          AWS region for validation
  VALIDATION_TIMEOUT  Timeout for validation tests
  DETAILED_OUTPUT     Enable detailed output (true/false)

Examples:
  $0 --mode hybrid --env production
  $0 --detailed --timeout 600
  $0 --env staging --region us-east-1

EOF
}

# Parse command line arguments
parse_args() {
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
            --timeout)
                VALIDATION_TIMEOUT="$2"
                shift 2
                ;;
            --detailed)
                DETAILED_OUTPUT=true
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

# Main validation function
main() {
    init_logging
    init_validation_tracking
    
    log_info "Starting NVIDIA NIM Platform validation"
    log_info "Mode: $DEPLOYMENT_MODE | Environment: $ENVIRONMENT | Region: $AWS_REGION"
    log_info "Timeout: ${VALIDATION_TIMEOUT}s | Detailed: $DETAILED_OUTPUT"
    
    # Run validation tests
    test_aws_connectivity
    test_cloudformation_stacks
    test_eks_cluster
    test_sagemaker_endpoints
    test_lambda_functions
    test_api_gateway
    test_monitoring
    test_security
    test_application_functionality
    test_performance
    
    # Generate report
    generate_report
    
    # Exit with appropriate code
    if [ $validation_failed -eq 0 ]; then
        log_success "All validation tests passed!"
        exit 0
    else
        log_error "$validation_failed validation tests failed"
        exit 1
    fi
}

# Parse arguments and run
parse_args "$@"
main