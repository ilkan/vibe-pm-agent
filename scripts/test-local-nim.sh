#!/bin/bash

# NVIDIA NIM Local Testing Scripts
# 
# Comprehensive testing suite for local NVIDIA NIM deployment
# Supports testing chat completions, embeddings, and health checks

set -e

# Configuration
NIM_BASE_URL="${NIM_BASE_URL:-http://localhost:1234}"
NIM_MODEL="${NIM_MODEL:-nvidia-llama-3_1-nemotron-nano-8b-v1}"
TIMEOUT="${TIMEOUT:-30}"
VERBOSE="${VERBOSE:-false}"

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

# Check if jq is available for JSON parsing
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. JSON responses will not be formatted."
        JQ_AVAILABLE=false
    else
        JQ_AVAILABLE=true
    fi

    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed."
        exit 1
    fi
}

# Test basic connectivity
test_connectivity() {
    log_info "Testing connectivity to $NIM_BASE_URL..."
    
    if curl -s --connect-timeout 5 --max-time $TIMEOUT "$NIM_BASE_URL/health" > /dev/null 2>&1; then
        log_success "Successfully connected to NIM service"
        return 0
    elif curl -s --connect-timeout 5 --max-time $TIMEOUT "$NIM_BASE_URL/v1/models" > /dev/null 2>&1; then
        log_success "Successfully connected to NIM service (via models endpoint)"
        return 0
    else
        log_error "Failed to connect to NIM service at $NIM_BASE_URL"
        log_info "Make sure the NVIDIA NIM service is running on localhost:1234"
        return 1
    fi
}

# List available models
list_models() {
    log_info "Listing available models..."
    
    local response
    response=$(curl -s --max-time $TIMEOUT \
        -H "Content-Type: application/json" \
        "$NIM_BASE_URL/v1/models" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        log_success "Available models:"
        if [ "$JQ_AVAILABLE" = true ]; then
            echo "$response" | jq -r '.data[]?.id // "No models found"' | sed 's/^/  - /'
        else
            echo "$response"
        fi
        return 0
    else
        log_error "Failed to retrieve models list"
        return 1
    fi
}

# Test chat completion
test_chat_completion() {
    local prompt="${1:-Hello, how are you today?}"
    local temperature="${2:-0.7}"
    local max_tokens="${3:-100}"
    
    log_info "Testing chat completion with prompt: '$prompt'"
    
    local request_body
    request_body=$(cat <<EOF
{
  "model": "$NIM_MODEL",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant. Always answer in a friendly and concise manner."
    },
    {
      "role": "user",
      "content": "$prompt"
    }
  ],
  "temperature": $temperature,
  "max_tokens": $max_tokens,
  "stream": false
}
EOF
)

    local start_time=$(date +%s%3N)
    local response
    local http_code
    
    response=$(curl -s --max-time $TIMEOUT \
        -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -d "$request_body" \
        "$NIM_BASE_URL/v1/chat/completions" 2>/dev/null)
    
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    http_code="${response: -3}"
    response="${response%???}"
    
    if [ "$http_code" = "200" ] && [ -n "$response" ]; then
        log_success "Chat completion successful (${duration}ms)"
        
        if [ "$JQ_AVAILABLE" = true ]; then
            local assistant_response
            assistant_response=$(echo "$response" | jq -r '.choices[0].message.content // "No response"')
            local tokens_used
            tokens_used=$(echo "$response" | jq -r '.usage.total_tokens // 0')
            local finish_reason
            finish_reason=$(echo "$response" | jq -r '.choices[0].finish_reason // "unknown"')
            
            echo "  Response: $assistant_response"
            echo "  Tokens used: $tokens_used"
            echo "  Finish reason: $finish_reason"
            echo "  Duration: ${duration}ms"
        else
            echo "  Raw response: $response"
        fi
        
        if [ "$VERBOSE" = true ]; then
            echo "  Full response:"
            if [ "$JQ_AVAILABLE" = true ]; then
                echo "$response" | jq '.'
            else
                echo "$response"
            fi
        fi
        
        return 0
    else
        log_error "Chat completion failed (HTTP $http_code)"
        echo "  Response: $response"
        return 1
    fi
}

# Test embedding generation
test_embedding() {
    local text="${1:-This is a test sentence for embedding generation.}"
    local model="${2:-text-embedding-ada-002}"
    
    log_info "Testing embedding generation with text: '$text'"
    
    local request_body
    request_body=$(cat <<EOF
{
  "input": "$text",
  "model": "$model",
  "encoding_format": "float"
}
EOF
)

    local start_time=$(date +%s%3N)
    local response
    local http_code
    
    response=$(curl -s --max-time $TIMEOUT \
        -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -d "$request_body" \
        "$NIM_BASE_URL/v1/embeddings" 2>/dev/null)
    
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    http_code="${response: -3}"
    response="${response%???}"
    
    if [ "$http_code" = "200" ] && [ -n "$response" ]; then
        log_success "Embedding generation successful (${duration}ms)"
        
        if [ "$JQ_AVAILABLE" = true ]; then
            local embedding_dimensions
            embedding_dimensions=$(echo "$response" | jq -r '.data[0].embedding | length')
            local tokens_used
            tokens_used=$(echo "$response" | jq -r '.usage.total_tokens // 0')
            
            echo "  Embedding dimensions: $embedding_dimensions"
            echo "  Tokens used: $tokens_used"
            echo "  Duration: ${duration}ms"
        else
            echo "  Raw response: $response"
        fi
        
        return 0
    else
        log_error "Embedding generation failed (HTTP $http_code)"
        echo "  Response: $response"
        return 1
    fi
}

# Run performance test
test_performance() {
    local iterations="${1:-5}"
    local prompt="${2:-Explain quantum computing in simple terms.}"
    
    log_info "Running performance test with $iterations iterations..."
    
    local total_time=0
    local successful_requests=0
    local failed_requests=0
    local min_time=999999
    local max_time=0
    
    for i in $(seq 1 $iterations); do
        echo -n "  Request $i/$iterations... "
        
        local start_time=$(date +%s%3N)
        local response
        local http_code
        
        response=$(curl -s --max-time $TIMEOUT \
            -w "%{http_code}" \
            -H "Content-Type: application/json" \
            -d "{\"model\":\"$NIM_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"$prompt\"}],\"max_tokens\":50}" \
            "$NIM_BASE_URL/v1/chat/completions" 2>/dev/null)
        
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            echo "${duration}ms ✓"
            successful_requests=$((successful_requests + 1))
            total_time=$((total_time + duration))
            
            if [ $duration -lt $min_time ]; then
                min_time=$duration
            fi
            if [ $duration -gt $max_time ]; then
                max_time=$duration
            fi
        else
            echo "FAILED (HTTP $http_code)"
            failed_requests=$((failed_requests + 1))
        fi
        
        # Small delay between requests
        sleep 0.1
    done
    
    if [ $successful_requests -gt 0 ]; then
        local avg_time=$((total_time / successful_requests))
        local success_rate=$((successful_requests * 100 / iterations))
        
        log_success "Performance test completed"
        echo "  Successful requests: $successful_requests/$iterations ($success_rate%)"
        echo "  Average response time: ${avg_time}ms"
        echo "  Min response time: ${min_time}ms"
        echo "  Max response time: ${max_time}ms"
        echo "  Total time: ${total_time}ms"
        
        return 0
    else
        log_error "All performance test requests failed"
        return 1
    fi
}

# Health check
health_check() {
    log_info "Performing comprehensive health check..."
    
    local overall_status=0
    
    # Test connectivity
    if ! test_connectivity; then
        overall_status=1
    fi
    
    # List models
    if ! list_models; then
        overall_status=1
    fi
    
    # Test basic chat completion
    if ! test_chat_completion "Health check test" 0.1 10; then
        overall_status=1
    fi
    
    # Test embedding (optional)
    log_info "Testing embedding generation (optional)..."
    if test_embedding "Health check"; then
        log_success "Embedding service is available"
    else
        log_warning "Embedding service is not available (this may be expected)"
    fi
    
    if [ $overall_status -eq 0 ]; then
        log_success "Health check passed - NIM service is functioning correctly"
    else
        log_error "Health check failed - Some services are not working properly"
    fi
    
    return $overall_status
}

# Interactive test mode
interactive_mode() {
    log_info "Entering interactive test mode. Type 'help' for commands or 'quit' to exit."
    
    while true; do
        echo -n "nim-test> "
        read -r command args
        
        case "$command" in
            "help")
                echo "Available commands:"
                echo "  chat <prompt>     - Test chat completion with custom prompt"
                echo "  embed <text>      - Test embedding generation with custom text"
                echo "  models            - List available models"
                echo "  health            - Run health check"
                echo "  perf [iterations] - Run performance test"
                echo "  connect           - Test connectivity"
                echo "  quit              - Exit interactive mode"
                ;;
            "chat")
                test_chat_completion "$args"
                ;;
            "embed")
                test_embedding "$args"
                ;;
            "models")
                list_models
                ;;
            "health")
                health_check
                ;;
            "perf")
                test_performance "${args:-5}"
                ;;
            "connect")
                test_connectivity
                ;;
            "quit"|"exit")
                log_info "Exiting interactive mode"
                break
                ;;
            "")
                # Empty command, do nothing
                ;;
            *)
                log_error "Unknown command: $command. Type 'help' for available commands."
                ;;
        esac
    done
}

# Show usage information
show_usage() {
    cat <<EOF
NVIDIA NIM Local Testing Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  connectivity    Test basic connectivity to NIM service
  models         List available models
  chat           Test chat completion
  embed          Test embedding generation
  performance    Run performance benchmarks
  health         Run comprehensive health check
  interactive    Enter interactive testing mode
  help           Show this help message

Options:
  --url URL      Set NIM base URL (default: http://localhost:1234)
  --model MODEL  Set model name (default: nvidia-llama-3_1-nemotron-nano-8b-v1)
  --timeout SEC  Set request timeout (default: 30)
  --verbose      Enable verbose output

Environment Variables:
  NIM_BASE_URL   Base URL for NIM service
  NIM_MODEL      Model name to use for testing
  TIMEOUT        Request timeout in seconds
  VERBOSE        Enable verbose output (true/false)

Examples:
  $0 health                                    # Run health check
  $0 chat --verbose                           # Test chat with verbose output
  $0 performance                              # Run performance test
  $0 --url http://localhost:8080 connectivity # Test different URL
  $0 interactive                              # Enter interactive mode

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --url)
                NIM_BASE_URL="$2"
                shift 2
                ;;
            --model)
                NIM_MODEL="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                COMMAND="$1"
                shift
                ;;
        esac
    done
}

# Main execution
main() {
    local command="${COMMAND:-health}"
    
    log_info "NVIDIA NIM Local Testing Suite"
    log_info "Target: $NIM_BASE_URL"
    log_info "Model: $NIM_MODEL"
    log_info "Timeout: ${TIMEOUT}s"
    echo
    
    check_dependencies
    
    case "$command" in
        "connectivity"|"connect")
            test_connectivity
            ;;
        "models"|"model")
            list_models
            ;;
        "chat"|"completion")
            test_chat_completion
            ;;
        "embed"|"embedding")
            test_embedding
            ;;
        "performance"|"perf"|"benchmark")
            test_performance
            ;;
        "health"|"check")
            health_check
            ;;
        "interactive"|"i")
            interactive_mode
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Parse arguments and run main function
parse_args "$@"
main