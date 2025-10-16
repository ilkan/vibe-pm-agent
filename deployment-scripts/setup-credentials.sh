#!/bin/bash

# Credential Setup Script for Vibe PM Agent External Access
# This script helps set up credential files for external access

set -e

# Configuration
ENVIRONMENT=${1:-dev}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔑 Setting up credentials for Vibe PM Agent${NC}"
echo "Environment: $ENVIRONMENT"

# Function to create .aws directory structure
setup_aws_directory() {
    echo -e "${YELLOW}📁 Setting up .aws directory structure...${NC}"
    
    # Create .aws directory if it doesn't exist
    if [ ! -d ".aws" ]; then
        mkdir -p .aws
        echo -e "${GREEN}✅ Created .aws directory${NC}"
    else
        echo -e "${GREEN}✅ .aws directory already exists${NC}"
    fi
    
    # Create .gitkeep file
    touch .aws/.gitkeep
    echo -e "${GREEN}✅ Created .aws/.gitkeep${NC}"
    
    # Check if .gitignore includes .aws files
    if ! grep -q ".aws/\*" .gitignore 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Adding .aws/* to .gitignore...${NC}"
        echo "" >> .gitignore
        echo "# AWS credential files (keep private)" >> .gitignore
        echo ".aws/*" >> .gitignore
        echo "!.aws/.gitkeep" >> .gitignore
        echo -e "${GREEN}✅ Updated .gitignore${NC}"
    else
        echo -e "${GREEN}✅ .gitignore already configured for .aws files${NC}"
    fi
}

# Function to setup API keys
setup_api_keys() {
    echo -e "${YELLOW}🔐 Setting up API keys...${NC}"
    
    API_KEYS_FILE=".aws/api-keys.json"
    TEMPLATE_FILE=".aws-templates/api-keys.template.json"
    
    if [ ! -f "$API_KEYS_FILE" ]; then
        if [ -f "$TEMPLATE_FILE" ]; then
            echo -e "${YELLOW}📋 Copying API keys template...${NC}"
            cp "$TEMPLATE_FILE" "$API_KEYS_FILE"
            echo -e "${GREEN}✅ API keys template copied to $API_KEYS_FILE${NC}"
            echo -e "${YELLOW}⚠️  Please update $API_KEYS_FILE with actual API keys${NC}"
        else
            echo -e "${YELLOW}📝 Creating basic API keys file...${NC}"
            cat > "$API_KEYS_FILE" << 'EOF'
{
  "apiKeys": [
    {
      "keyId": "example-client-1",
      "hashedKey": "your-hashed-api-key-here",
      "clientName": "Example Client 1",
      "permissions": ["all"],
      "enabled": true,
      "rateLimit": {
        "requestsPerMinute": 60,
        "requestsPerHour": 1000,
        "burstLimit": 10
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
EOF
            echo -e "${GREEN}✅ Created basic API keys file${NC}"
            echo -e "${YELLOW}⚠️  Please update $API_KEYS_FILE with actual API keys${NC}"
        fi
    else
        echo -e "${GREEN}✅ API keys file already exists${NC}"
    fi
    
    # Validate JSON format
    if command -v python3 &> /dev/null; then
        if python3 -m json.tool "$API_KEYS_FILE" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ API keys file has valid JSON format${NC}"
        else
            echo -e "${RED}❌ Invalid JSON format in $API_KEYS_FILE${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Python3 not found, skipping JSON validation${NC}"
    fi
}

# Function to setup AWS credentials
setup_aws_credentials() {
    echo -e "${YELLOW}🔧 Setting up AWS credentials...${NC}"
    
    CREDENTIALS_FILE=".aws/credentials-${ENVIRONMENT}"
    TEMPLATE_FILE=".aws-templates/credentials.template"
    
    if [ ! -f "$CREDENTIALS_FILE" ]; then
        if [ -f "$TEMPLATE_FILE" ]; then
            echo -e "${YELLOW}📋 Copying credentials template...${NC}"
            cp "$TEMPLATE_FILE" "$CREDENTIALS_FILE"
            echo -e "${GREEN}✅ Credentials template copied to $CREDENTIALS_FILE${NC}"
            echo -e "${YELLOW}⚠️  Please update $CREDENTIALS_FILE with actual AWS credentials${NC}"
        else
            echo -e "${YELLOW}📝 Creating basic credentials file...${NC}"
            cat > "$CREDENTIALS_FILE" << EOF
[default]
aws_access_key_id = YOUR_ACCESS_KEY_ID
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY
region = us-east-1

[external-api]
api_key_secret = your-api-key-secret-for-hashing
jwt_secret = your-jwt-secret-key
oauth_client_secret = your-oauth-client-secret
EOF
            echo -e "${GREEN}✅ Created basic credentials file${NC}"
            echo -e "${YELLOW}⚠️  Please update $CREDENTIALS_FILE with actual credentials${NC}"
        fi
    else
        echo -e "${GREEN}✅ Credentials file already exists${NC}"
    fi
}

# Function to generate sample API key
generate_sample_api_key() {
    echo -e "${YELLOW}🎲 Generating sample API key...${NC}"
    
    # Generate a random API key
    if command -v openssl &> /dev/null; then
        SAMPLE_KEY=$(openssl rand -hex 32)
        echo -e "${GREEN}✅ Sample API key generated: $SAMPLE_KEY${NC}"
        echo -e "${YELLOW}💡 Use this key for testing (remember to hash it for storage)${NC}"
        
        # Generate hash of the key
        HASHED_KEY=$(echo -n "$SAMPLE_KEY" | openssl dgst -sha256 -hex | cut -d' ' -f2)
        echo -e "${GREEN}✅ Hashed key for storage: $HASHED_KEY${NC}"
        
        # Save to temporary file for reference
        echo "Sample API Key: $SAMPLE_KEY" > .aws/sample-api-key.txt
        echo "Hashed Key: $HASHED_KEY" >> .aws/sample-api-key.txt
        echo -e "${GREEN}✅ Sample keys saved to .aws/sample-api-key.txt${NC}"
        echo -e "${YELLOW}⚠️  Remember to delete this file after updating your configuration${NC}"
    else
        echo -e "${YELLOW}⚠️  OpenSSL not found, cannot generate sample API key${NC}"
        echo -e "${YELLOW}💡 You can generate one manually or use: openssl rand -hex 32${NC}"
    fi
}

# Function to validate setup
validate_setup() {
    echo -e "${YELLOW}✅ Validating credential setup...${NC}"
    
    local errors=0
    
    # Check .aws directory
    if [ ! -d ".aws" ]; then
        echo -e "${RED}❌ .aws directory not found${NC}"
        ((errors++))
    fi
    
    # Check API keys file
    if [ ! -f ".aws/api-keys.json" ]; then
        echo -e "${RED}❌ API keys file not found${NC}"
        ((errors++))
    fi
    
    # Check credentials file
    if [ ! -f ".aws/credentials-${ENVIRONMENT}" ]; then
        echo -e "${RED}❌ Credentials file for $ENVIRONMENT not found${NC}"
        ((errors++))
    fi
    
    # Check .gitignore
    if ! grep -q ".aws/\*" .gitignore 2>/dev/null; then
        echo -e "${RED}❌ .gitignore not configured for .aws files${NC}"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✅ All credential files are properly set up${NC}"
        return 0
    else
        echo -e "${RED}❌ Found $errors issues with credential setup${NC}"
        return 1
    fi
}

# Function to show next steps
show_next_steps() {
    echo -e "${GREEN}🎉 Credential setup completed!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Update .aws/api-keys.json with your actual API keys"
    echo "2. Update .aws/credentials-${ENVIRONMENT} with your AWS credentials"
    echo "3. Test the setup with: ./deployment-scripts/deploy-api-gateway.sh $ENVIRONMENT"
    echo "4. Delete .aws/sample-api-key.txt after updating your configuration"
    echo ""
    echo -e "${YELLOW}🔒 Security reminders:${NC}"
    echo "- Never commit .aws/* files to version control"
    echo "- Use hashed API keys in the configuration"
    echo "- Rotate API keys regularly"
    echo "- Monitor API usage and access logs"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "- See README.md for detailed setup instructions"
    echo "- Check .aws-templates/ for configuration examples"
}

# Main execution
main() {
    echo -e "${GREEN}=== Vibe PM Agent Credential Setup ===${NC}"
    
    setup_aws_directory
    setup_api_keys
    setup_aws_credentials
    generate_sample_api_key
    
    if validate_setup; then
        show_next_steps
    else
        echo -e "${RED}❌ Setup validation failed. Please check the errors above.${NC}"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "dev"|"prod")
        ENVIRONMENT="$1"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [dev|prod]"
        echo ""
        echo "Sets up credential files for external access to Vibe PM Agent."
        echo ""
        echo "Arguments:"
        echo "  dev    Setup for development environment (default)"
        echo "  prod   Setup for production environment"
        echo "  help   Show this help message"
        echo ""
        echo "This script will:"
        echo "  - Create .aws directory structure"
        echo "  - Setup API keys configuration file"
        echo "  - Setup AWS credentials file"
        echo "  - Generate sample API keys for testing"
        echo "  - Update .gitignore to protect credential files"
        echo ""
        echo "Examples:"
        echo "  $0 dev"
        echo "  $0 prod"
        exit 0
        ;;
    "")
        # Default to dev environment
        ;;
    *)
        echo -e "${RED}❌ Invalid argument: $1${NC}"
        echo "Use 'help' for usage information"
        exit 1
        ;;
esac

# Run main function
main