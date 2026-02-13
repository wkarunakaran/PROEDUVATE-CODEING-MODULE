# Java Compiler Lambda Function

This directory contains the AWS Lambda function for compiling and executing Java code.

## Function Overview

The `java_compiler_handler.py` file provides a Lambda function that:
- Accepts Java source code as input
- Compiles the code using `javac`
- Executes the compiled bytecode with `java`
- Returns execution results, including output, errors, and timing

## Event Structure

The Lambda function expects the following event structure:

```json
{
  "code": "public class Solution { public static void main(String[] args) { System.out.println(\"Hello\"); } }",
  "language": "java",
  "input": "",
  "timeout": 10
}
```

## Response Structure

```json
{
  "success": true,
  "output": "Hello\n",
  "error": "",
  "execution_time": 0.543,
  "status": {
    "id": 3,
    "description": "Accepted"
  }
}
```

## Status Codes

- `3`: Accepted (successful execution)
- `5`: Time Limit Exceeded
- `6`: Compilation Error
- `11`: Runtime Error
- `13`: Internal Error

## Deployment

### Prerequisites

1. AWS Account with Lambda access
2. IAM role with Lambda execution permissions
3. Java runtime (OpenJDK 11 or later) in Lambda environment

### Deployment Steps

1. **Create Lambda Function**:
   ```bash
   aws lambda create-function \
     --function-name java-code-compiler \
     --runtime python3.11 \
     --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
     --handler java_compiler_handler.lambda_handler \
     --zip-file fileb://function.zip \
     --timeout 30 \
     --memory-size 512
   ```

2. **Package the Function**:
   ```bash
   cd lambda_functions
   zip function.zip java_compiler_handler.py
   ```

3. **Update Function Code**:
   ```bash
   aws lambda update-function-code \
     --function-name java-code-compiler \
     --zip-file fileb://function.zip
   ```

### Lambda Layer for Java Runtime

Since Lambda doesn't include Java by default, you'll need to create a Lambda layer with OpenJDK:

1. Download OpenJDK (e.g., Amazon Corretto)
2. Create layer structure:
   ```
   java-runtime/
   └── bin/
       ├── java
       └── javac
   ```
3. Zip and upload as a Lambda layer
4. Attach the layer to your Lambda function

### Environment Configuration

Update `app/core/config.py` to include:

```python
aws_java_lambda_function_name: str = os.getenv("AWS_JAVA_LAMBDA_FUNCTION_NAME", "java-code-compiler")
```

## Local Testing

Test the function locally:

```bash
cd lambda_functions
python java_compiler_handler.py
```

## Integration with Backend

The function integrates with the existing `CodeExecutor` service in `app/services/code_executor.py`.

## Security Considerations

- Code execution is isolated in temporary directories
- Timeout limits prevent infinite loops
- Temporary files are automatically cleaned up
- Consider additional sandboxing for production use
