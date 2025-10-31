#!/bin/bash
set -e

# Agent Testing Runner Script
# Runs all agent-related tests and validations

# Configuration
REGION=${REGION:-"us-east-1"}
TEST_TYPE=${TEST_TYPE:-"all"}

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

# Run enhanced agent tests
run_enhanced_agent_tests() {
    log_info "Running enhanced agent functionality tests..."
    
    if [ -f "scripts/test-enhanced-agents.js" ]; then
        node scripts/test-enhanced-agents.js
        if [ $? -eq 0 ]; then
            log_success "Enhanced agent tests passed"
            return 0
        else
            log_error "Enhanced agent tests failed"
            return 1
        fi
    else
        log_error "Enhanced agent test script not found"
        return 1
    fi
}

# Run comprehensive validation
run_comprehensive_validation() {
    log_info "Running comprehensive agent validation..."
    
    if [ -f "scripts/validate-enhanced-agents.js" ]; then
        node scripts/validate-enhanced-agents.js
        if [ $? -eq 0 ]; then
            log_success "Comprehensive validation passed"
            return 0
        else
            log_error "Comprehensive validation failed"
            return 1
        fi
    else
        log_error "Validation script not found"
        return 1
    fi
}

# Run configuration tests
run_configuration_tests() {
    log_info "Running agent configuration tests..."
    
    # Test agent configurations using AWS CLI
    local agents=("IBQRX8MZJJ" "CEW45LTT2P" "ULX1RJGKCR" "PDZPQTNLYH" "SUPERVISOR001" "CITATION001")
    local passed=0
    local total=${#agents[@]}
    
    for agent_id in "${agents[@]}"; do
        log_info "Checking agent ${agent_id}..."
        
        if aws bedrock-agent get-agent --agent-id ${agent_id} --region ${REGION} &> /dev/null; then
            # Check if agent is using Nemotron model
            local model=$(aws bedrock-agent get-agent --agent-id ${agent_id} --region ${REGION} --query 'agent.foundationModel' --output text 2>/dev/null || echo "unknown")
            
            if [[ "$model" == "meta.llama3-1-nemotron-nano-8b-v1:0" ]]; then
                log_success "Agent ${agent_id}: Using Nemotron model"
                ((passed++))
            else
                log_warning "Agent ${agent_id}: Not using Nemotron model (current: ${model})"
            fi
        else
            log_error "Agent ${agent_id}: Not found or inaccessible"
        fi
    done
    
    log_info "Configuration test results: ${passed}/${total} agents properly configured"
    
    if [ $passed -eq $total ]; then
        return 0
    else
        return 1
    fi
}

# Run deployment verification
run_deployment_verification() {
    log_info "Running deployment verification..."
    
    if [ -f "deployment/aws/verify-deployment.js" ]; then
        cd deployment/aws
        node verify-deployment.js
        local result=$?
        cd ../../
        
        if [ $result -eq 0 ]; then
            log_success "Deployment verification passed"
            return 0
        else
            log_error "Deployment verification failed"
            return 1
        fi
    else
        log_error "Deployment verification script not found"
        return 1
    fi
}

# Main test runner
main() {
    log_info "Starting Agent Test Suite..."
    log_info "Test Type: ${TEST_TYPE}"
    log_info "Region: ${REGION}"
    log_info "Timestamp: $(date)"
    
    local test_results=()
    local overall_success=true
    
    case "${TEST_TYPE}" in
        "config")
            log_info "Running configuration tests only..."
            if run_configuration_tests; then
                test_results+=("Configuration Tests: PASSED")
            else
                test_results+=("Configuration Tests: FAILED")
                overall_success=false
            fi
            ;;
        "enhanced")
            log_info "Running enhanced agent tests only..."
            if run_enhanced_agent_tests; then
                test_results+=("Enhanced Agent Tests: PASSED")
            else
                test_results+=("Enhanced Agent Tests: FAILED")
                overall_success=false
            fi
            ;;
        "validation")
            log_info "Running comprehensive validation only..."
            if run_comprehensive_validation; then
                test_results+=("Comprehensive Validation: PASSED")
            else
                test_results+=("Comprehensive Validation: FAILED")
                overall_success=false
            fi
            ;;
        "deployment")
            log_info "Running deployment verification only..."
            if run_deployment_verification; then
                test_results+=("Deployment Verification: PASSED")
            else
                test_results+=("Deployment Verification: FAILED")
                overall_success=false
            fi
            ;;
        "all"|*)
            log_info "Running all tests..."
            
            # Configuration tests
            if run_configuration_tests; then
                test_results+=("Configuration Tests: PASSED")
            else
                test_results+=("Configuration Tests: FAILED")
                overall_success=false
            fi
            
            # Enhanced agent tests
            if run_enhanced_agent_tests; then
                test_results+=("Enhanced Agent Tests: PASSED")
            else
                test_results+=("Enhanced Agent Tests: FAILED")
                overall_success=false
            fi
            
            # Comprehensive validation
            if run_comprehensive_validation; then
                test_results+=("Comprehensive Validation: PASSED")
            else
                test_results+=("Comprehensive Validation: FAILED")
                overall_success=false
            fi
            
            # Deployment verification
            if run_deployment_verification; then
                test_results+=("Deployment Verification: PASSED")
            else
                test_results+=("Deployment Verification: FAILED")
                overall_success=false
            fi
            ;;
    esac
    
    # Summary
    log_info ""
    log_info "=== Test Results Summary ==="
    for result in "${test_results[@]}"; do
        if [[ "$result" == *"PASSED"* ]]; then
            log_success "$result"
        else
            log_error "$result"
        fi
    done
    
    if [ "$overall_success" = true ]; then
        log_success ""
        log_success "🎉 All tests passed! Enhanced agents are working correctly."
        exit 0
    else
        log_error ""
        log_error "❌ Some tests failed. Please review the results above."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-all}" in
    "config"|"enhanced"|"validation"|"deployment"|"all")
        TEST_TYPE="$1"
        main
        ;;
    *)
        echo "Usage: $0 [config|enhanced|validation|deployment|all]"
        echo "Environment variables:"
        echo "  REGION: AWS region (default: us-east-1)"
        echo "  TEST_TYPE: Type of tests to run (default: all)"
        echo ""
        echo "Test types:"
        echo "  config      - Agent configuration tests"
        echo "  enhanced    - Enhanced functionality tests"
        echo "  validation  - Comprehensive validation"
        echo "  deployment  - Deployment verification"
        echo "  all         - All tests (default)"
        exit 1
        ;;
esac