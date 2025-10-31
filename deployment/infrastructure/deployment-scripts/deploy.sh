#!/bin/bash
set -e

# NVIDIA NIM Platform Deployment Script
# Deploys complete infrastructure using AWS CDK

# Configuration
DEPLOYMENT_MODE=${DEPLOYMENT_MODE:-"hybrid"}  # eks, sagemaker, or hybrid
ENVIRONMENT=${ENVIRONMENT:-"production"}
AWS_REGION=${AWS_REGION:-"us-west-2"}
CLUSTER_NAME="nvidia-nim-cluster"

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
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        log_error "AWS CDK is not installed"
        exit 1
    fi
    
    # Check kubectl (for EKS deployment)
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        if ! command -v kubectl &> /dev/null; then
            log_error "kubectl is not installed"
            exit 1
        fi
    fi
    
    # Check Docker (for building custom images)
    if ! command -v docker &> /dev/null; then
        log_warning "Docker is not installed - some features may not work"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Bootstrap CDK
bootstrap_cdk() {
    log_info "Bootstrapping CDK..."
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    cdk bootstrap aws://${ACCOUNT_ID}/${AWS_REGION} \
        --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
        --trust ${ACCOUNT_ID} \
        --tags Project=nvidia-nim-platform Environment=${ENVIRONMENT}
    
    log_success "CDK bootstrap completed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying NVIDIA NIM infrastructure..."
    log_info "Deployment mode: ${DEPLOYMENT_MODE}"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Region: ${AWS_REGION}"
    
    # Set CDK context
    CDK_CONTEXT="--context environment=${ENVIRONMENT} --context deploymentMode=${DEPLOYMENT_MODE}"
    
    # Deploy stacks in order
    log_info "Deploying networking stack..."
    cdk deploy NvidiaNimNetworking ${CDK_CONTEXT} --require-approval never
    
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        log_info "Deploying EKS stack..."
        cdk deploy NvidiaNimEks ${CDK_CONTEXT} --require-approval never
    fi
    
    if [[ "$DEPLOYMENT_MODE" == "sagemaker" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        log_info "Deploying SageMaker stack..."
        cdk deploy NvidiaNimSageMaker ${CDK_CONTEXT} --require-approval never
    fi
    
    log_info "Deploying Lambda integration stack..."
    cdk deploy NvidiaNimLambda ${CDK_CONTEXT} --require-approval never
    
    log_info "Deploying monitoring stack..."
    cdk deploy NvidiaNimMonitoring ${CDK_CONTEXT} --require-approval never
    
    log_success "Infrastructure deployment completed"
}

# Configure kubectl for EKS
configure_kubectl() {
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        log_info "Configuring kubectl for EKS cluster..."
        
        aws eks update-kubeconfig \
            --region ${AWS_REGION} \
            --name ${CLUSTER_NAME}
        
        # Verify connection
        if kubectl cluster-info &> /dev/null; then
            log_success "kubectl configured successfully"
        else
            log_error "Failed to configure kubectl"
            exit 1
        fi
    fi
}

# Deploy Kubernetes manifests
deploy_k8s_manifests() {
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        log_info "Deploying Kubernetes manifests..."
        
        # Apply manifests in order
        kubectl apply -f ../eks/nvidia-nim-namespace.yaml
        kubectl apply -f ../eks/nvidia-nim-secrets.yaml
        kubectl apply -f ../eks/nvidia-nim-storage.yaml
        kubectl apply -f ../eks/nvidia-nim-services.yaml
        kubectl apply -f ../eks/nvidia-nim-deployment.yaml
        kubectl apply -f ../eks/nvidia-nim-hpa.yaml
        kubectl apply -f ../eks/istio-service-mesh.yaml
        
        # Wait for deployments to be ready
        log_info "Waiting for deployments to be ready..."
        kubectl wait --for=condition=available --timeout=600s deployment/nvidia-nim-llama -n nvidia-nim
        kubectl wait --for=condition=available --timeout=600s deployment/nvidia-nim-embedding -n nvidia-nim
        
        log_success "Kubernetes manifests deployed successfully"
    fi
}

# Upload model artifacts to S3
upload_model_artifacts() {
    if [[ "$DEPLOYMENT_MODE" == "sagemaker" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        log_info "Uploading model artifacts to S3..."
        
        # Get bucket name from CDK output
        BUCKET_NAME=$(aws cloudformation describe-stacks \
            --stack-name NvidiaNimSageMaker \
            --query 'Stacks[0].Outputs[?OutputKey==`ModelBucketName`].OutputValue' \
            --output text)
        
        if [[ -z "$BUCKET_NAME" ]]; then
            log_error "Could not find model bucket name"
            exit 1
        fi
        
        # Upload inference scripts
        aws s3 cp ../sagemaker/inference.py s3://${BUCKET_NAME}/code/
        aws s3 cp ../sagemaker/embedding_inference.py s3://${BUCKET_NAME}/code/
        
        # Create tar.gz files for model artifacts (placeholder)
        log_warning "Model artifacts need to be uploaded manually to:"
        log_warning "  s3://${BUCKET_NAME}/llama-3.1-nemotron-nano-8b-v1/model.tar.gz"
        log_warning "  s3://${BUCKET_NAME}/nv-embedqa-e5-v5/model.tar.gz"
        
        log_success "Model artifact upload preparation completed"
    fi
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    # Check EKS deployment
    if [[ "$DEPLOYMENT_MODE" == "eks" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        log_info "Validating EKS deployment..."
        
        # Check if pods are running
        if kubectl get pods -n nvidia-nim | grep -q "Running"; then
            log_success "EKS pods are running"
        else
            log_error "EKS pods are not running properly"
            kubectl get pods -n nvidia-nim
        fi
        
        # Check services
        kubectl get services -n nvidia-nim
    fi
    
    # Check SageMaker endpoints
    if [[ "$DEPLOYMENT_MODE" == "sagemaker" || "$DEPLOYMENT_MODE" == "hybrid" ]]; then
        log_info "Validating SageMaker endpoints..."
        
        # Check endpoint status
        LLAMA_ENDPOINT=$(aws cloudformation describe-stacks \
            --stack-name NvidiaNimSageMaker \
            --query 'Stacks[0].Outputs[?OutputKey==`LlamaEndpointName`].OutputValue' \
            --output text)
        
        if [[ -n "$LLAMA_ENDPOINT" ]]; then
            ENDPOINT_STATUS=$(aws sagemaker describe-endpoint \
                --endpoint-name ${LLAMA_ENDPOINT} \
                --query 'EndpointStatus' \
                --output text)
            
            log_info "LLaMA endpoint status: ${ENDPOINT_STATUS}"
        fi
    fi
    
    log_success "Deployment validation completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here if needed
}

# Main deployment function
main() {
    log_info "Starting NVIDIA NIM platform deployment..."
    log_info "Timestamp: $(date)"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    bootstrap_cdk
    deploy_infrastructure
    configure_kubectl
    deploy_k8s_manifests
    upload_model_artifacts
    validate_deployment
    
    log_success "NVIDIA NIM platform deployment completed successfully!"
    log_info "Next steps:"
    log_info "1. Upload model artifacts to S3 (for SageMaker deployment)"
    log_info "2. Configure DNS and SSL certificates"
    log_info "3. Set up monitoring dashboards"
    log_info "4. Run integration tests"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "destroy")
        log_warning "Destroying NVIDIA NIM infrastructure..."
        cdk destroy --all --force
        log_success "Infrastructure destroyed"
        ;;
    "diff")
        log_info "Showing infrastructure diff..."
        cdk diff --context environment=${ENVIRONMENT} --context deploymentMode=${DEPLOYMENT_MODE}
        ;;
    "synth")
        log_info "Synthesizing CloudFormation templates..."
        cdk synth --context environment=${ENVIRONMENT} --context deploymentMode=${DEPLOYMENT_MODE}
        ;;
    *)
        echo "Usage: $0 [deploy|destroy|diff|synth]"
        echo "Environment variables:"
        echo "  DEPLOYMENT_MODE: eks, sagemaker, or hybrid (default: hybrid)"
        echo "  ENVIRONMENT: development, staging, or production (default: production)"
        echo "  AWS_REGION: AWS region (default: us-west-2)"
        exit 1
        ;;
esac