#!/bin/bash

# Emote Backend Deployment Script

set -e

# Configuration
STACK_NAME="emote-backend"
REGION="us-east-1"
ENVIRONMENT="dev"
S3_BUCKET="emote-backend-deployment-bucket-$(date +%s)"
AWS_PROFILE="030878370429_AWSAdministratorAccess"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    print_error "SAM CLI is not installed. Please install it first."
    exit 1
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -e|--environment)
            ENVIRONMENT="$2"
            shift
            shift
            ;;
        -r|--region)
            REGION="$2"
            shift
            shift
            ;;
        -s|--stack-name)
            STACK_NAME="$2"
            shift
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -e, --environment    Environment (dev, staging, prod) [default: dev]"
            echo "  -r, --region         AWS region [default: us-east-1]"
            echo "  -s, --stack-name     CloudFormation stack name [default: emote-backend]"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Update stack name with environment
STACK_NAME="${STACK_NAME}-${ENVIRONMENT}"

print_status "Starting deployment of Emote Backend..."
print_status "Environment: $ENVIRONMENT"
print_status "Region: $REGION"
print_status "Stack Name: $STACK_NAME"

# Create S3 bucket for deployment artifacts
print_status "Creating S3 bucket for deployment artifacts..."
aws s3 mb s3://$S3_BUCKET --region $REGION --profile $AWS_PROFILE 2>/dev/null || print_warning "S3 bucket might already exist"

# Navigate to the script directory
cd "$(dirname "$0")"

# Install Lambda dependencies
print_status "Installing Lambda dependencies..."
cd ../src/functions
npm install
cd ../../infrastructure

# Build and deploy with SAM
print_status "Building SAM application..."
sam build --template-file template.yaml

print_status "Deploying SAM application..."
sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name $STACK_NAME \
    --s3-bucket $S3_BUCKET \
    --capabilities CAPABILITY_IAM \
    --region $REGION \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
    --profile $AWS_PROFILE \
    --confirm-changeset

# Get outputs
print_status "Retrieving stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs' \
    --output table)

echo "$OUTPUTS"

# Extract important values
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`EmoteApiUrl`].OutputValue' \
    --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`EmoteCognitoUserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs[?OutputKey==`EmoteCognitoUserPoolClientId`].OutputValue' \
    --output text)

print_status "Deployment completed successfully!"
print_status "API URL: $API_URL"
print_status "User Pool ID: $USER_POOL_ID"
print_status "User Pool Client ID: $USER_POOL_CLIENT_ID"

# Save configuration for easy access
CONFIG_FILE="../config.json"
print_status "Saving configuration to $CONFIG_FILE..."
cat > $CONFIG_FILE << EOF
{
  "environment": "$ENVIRONMENT",
  "region": "$REGION",
  "stackName": "$STACK_NAME",
  "apiUrl": "$API_URL",
  "userPoolId": "$USER_POOL_ID",
  "userPoolClientId": "$USER_POOL_CLIENT_ID"
}
EOF

print_status "Configuration saved to $CONFIG_FILE"
print_status "You can now test the API endpoints:"
print_status "  GET $API_URL/emotion"
print_status "  GET $API_URL/emotions"

# Clean up S3 bucket (optional)
read -p "Do you want to clean up the deployment S3 bucket? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Cleaning up S3 bucket..."
    aws s3 rb s3://$S3_BUCKET --force --profile $AWS_PROFILE
    print_status "S3 bucket cleaned up."
fi

print_status "Deployment script completed!"