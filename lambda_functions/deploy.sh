#!/bin/bash
# Deploy Java Compiler Lambda Function to AWS

set -e

echo "🚀 Deploying Java Compiler Lambda Function"

# Configuration
FUNCTION_NAME="${AWS_JAVA_LAMBDA_FUNCTION_NAME:-java-code-compiler}"
REGION="${AWS_REGION:-eu-north-1}"
ROLE_ARN="${AWS_LAMBDA_ROLE_ARN}"

if [ -z "$ROLE_ARN" ]; then
    echo "❌ Error: AWS_LAMBDA_ROLE_ARN environment variable is required"
    echo "   Example: arn:aws:iam::123456789012:role/lambda-execution-role"
    exit 1
fi

# Navigate to lambda_functions directory
cd "$(dirname "$0")"

echo "📦 Packaging Lambda function..."
zip -q function.zip java_compiler_handler.py

echo "☁️  Checking if function exists..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "🔄 Updating existing function..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://function.zip \
        --region "$REGION"
    
    echo "⚙️  Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --timeout 30 \
        --memory-size 512 \
        --region "$REGION"
else
    echo "✨ Creating new function..."
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime python3.11 \
        --role "$ROLE_ARN" \
        --handler java_compiler_handler.lambda_handler \
        --zip-file fileb://function.zip \
        --timeout 30 \
        --memory-size 512 \
        --region "$REGION"
fi

echo "🧹 Cleaning up..."
rm -f function.zip

echo "✅ Deployment complete!"
echo "📝 Function name: $FUNCTION_NAME"
echo "🌍 Region: $REGION"
echo ""
echo "⚠️  Note: You need to add a Java runtime layer to this function"
echo "   Follow the instructions in lambda_functions/README.md"
