# Java Compiler Lambda Function - Implementation Guide

## Overview

This implementation adds Java code compilation and execution support to the PROEDUVATE coding platform. The feature supports both local execution (for development) and AWS Lambda deployment (for production).

## Architecture

### Components

1. **Lambda Function Handler** (`lambda_functions/java_compiler_handler.py`)
   - Standalone AWS Lambda function for Java code execution
   - Compiles Java code using `javac`
   - Executes compiled bytecode with `java`
   - Returns standardized results with status codes

2. **CodeExecutor Service** (`app/services/code_executor.py`)
   - Enhanced to support Java execution alongside Python
   - Handles local Java compilation and execution
   - Falls back to local execution if Lambda is unavailable

3. **Configuration** (`app/core/config.py`, `.env.example`)
   - Added `AWS_JAVA_LAMBDA_FUNCTION_NAME` configuration
   - Supports separate Lambda functions for different languages

## Features

### Supported Operations

✅ **Compile Java Code**
- Automatic class name extraction
- Compilation error reporting
- Support for both public and non-public classes

✅ **Execute Java Programs**
- Standard input/output handling
- Timeout protection
- Memory and resource management

✅ **Error Handling**
- Compilation errors
- Runtime errors
- Timeout errors
- Security violations

### Status Codes

| Code | Description | Meaning |
|------|-------------|---------|
| 3 | Accepted | Successful execution |
| 5 | Time Limit Exceeded | Execution timeout |
| 6 | Compilation Error | Code failed to compile |
| 11 | Runtime Error | Program crashed during execution |
| 13 | Internal Error | System error |

## Usage

### Local Execution

The system automatically uses local Java execution when:
- AWS Lambda is not configured
- Lambda credentials are missing
- Development mode is enabled

**Example:**

```python
from app.services.code_executor import code_executor

# Simple Java Hello World
java_code = """
public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
"""

result = await code_executor.execute_code(
    code=java_code,
    language="java",
    test_input=""
)

print(result)
# {
#   "success": True,
#   "output": "Hello, World!\n",
#   "error": "",
#   "execution_time": 0.489
# }
```

### AWS Lambda Execution

To use AWS Lambda for Java execution:

1. **Deploy the Lambda function:**
   ```bash
   cd lambda_functions
   export AWS_LAMBDA_ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role"
   ./deploy.sh
   ```

2. **Configure environment variables:**
   ```bash
   AWS_REGION=eu-north-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_JAVA_LAMBDA_FUNCTION_NAME=java-code-compiler
   ```

3. **Add Java Runtime Layer:**
   - Lambda doesn't include Java by default
   - Create a custom layer with OpenJDK (see Lambda documentation)
   - Attach the layer to your function

## Testing

### Running Tests

```bash
# Test Java execution locally
python test_java_execution.py

# Test Lambda handler directly
cd lambda_functions
python java_compiler_handler.py
```

### Test Cases

1. **Simple Output**: Basic System.out.println
2. **Algorithm**: Two Sum problem with Scanner input
3. **Compilation Error**: Missing semicolon detection
4. **Runtime Error**: Division by zero, null pointer, etc.
5. **Timeout**: Infinite loops

## Security Considerations

### Local Execution
- Code runs in temporary directories
- Files are automatically cleaned up
- Timeout limits prevent infinite execution
- Process isolation via subprocess

### Lambda Execution
- Inherits Lambda's security sandbox
- Limited execution time (max 30 seconds configured)
- Isolated execution environment
- No network access by default

### Recommendations for Production

1. **Add Resource Limits**
   - Memory limits
   - CPU limits
   - Disk space restrictions

2. **Enable Monitoring**
   - CloudWatch logs
   - Execution metrics
   - Error tracking

3. **Implement Rate Limiting**
   - Per-user execution limits
   - Concurrent execution controls

4. **Code Scanning**
   - Block dangerous imports (Runtime, ProcessBuilder)
   - Restrict file system access
   - Prevent network operations

## Deployment Guide

### Prerequisites

- AWS Account with Lambda access
- IAM role for Lambda execution
- Java Development Kit (JDK 11+) in Lambda environment

### Step-by-Step Deployment

1. **Create IAM Role**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": { "Service": "lambda.amazonaws.com" },
       "Action": "sts:AssumeRole"
     }]
   }
   ```

2. **Attach Policies**
   - AWSLambdaBasicExecutionRole
   - CloudWatchLogsFullAccess (for debugging)

3. **Create Lambda Layer** (for Java Runtime)
   ```bash
   # Download OpenJDK
   wget https://download.java.net/java/GA/jdk11/openjdk-11_linux-x64_bin.tar.gz
   
   # Extract and prepare layer
   mkdir -p java-runtime/bin
   tar -xzf openjdk-11_linux-x64_bin.tar.gz
   cp -r jdk-11*/bin/* java-runtime/bin/
   
   # Create layer zip
   zip -r java-runtime-layer.zip java-runtime
   
   # Upload layer
   aws lambda publish-layer-version \
     --layer-name java-runtime \
     --zip-file fileb://java-runtime-layer.zip \
     --compatible-runtimes python3.11
   ```

4. **Deploy Function**
   ```bash
   cd lambda_functions
   export AWS_LAMBDA_ROLE_ARN="arn:aws:iam::123456789012:role/lambda-execution-role"
   ./deploy.sh
   ```

5. **Attach Layer to Function**
   ```bash
   aws lambda update-function-configuration \
     --function-name java-code-compiler \
     --layers arn:aws:lambda:REGION:ACCOUNT:layer:java-runtime:1
   ```

6. **Test the Function**
   ```bash
   aws lambda invoke \
     --function-name java-code-compiler \
     --payload '{"code":"public class Test { public static void main(String[] args) { System.out.println(\"Hello\"); } }", "language":"java", "input":""}' \
     response.json
   
   cat response.json
   ```

### Backend Configuration

Update your backend's `.env` file:

```bash
# AWS Lambda Configuration
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_JAVA_LAMBDA_FUNCTION_NAME=java-code-compiler
```

## Troubleshooting

### Common Issues

**1. "javac: command not found"**
- Ensure JDK is installed in Lambda layer
- Check PATH includes Java binaries

**2. "Could not find public class"**
- Verify code has a public class
- Check class name matches filename requirements

**3. "Permission denied"**
- Verify Lambda execution role permissions
- Check temporary directory write access

**4. Lambda timeout**
- Increase timeout in Lambda configuration
- Optimize code for faster execution
- Consider increasing memory allocation

### Debug Mode

Enable verbose logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Performance

### Benchmarks (Local Execution)

| Operation | Time | Notes |
|-----------|------|-------|
| Simple Hello World | ~0.5s | Includes compilation |
| Algorithm (Two Sum) | ~0.6s | With input parsing |
| Compilation Error | ~0.3s | Fast failure |

### Optimization Tips

1. **Lambda Warm-up**: Keep functions warm to avoid cold starts
2. **Provisioned Concurrency**: For high-traffic scenarios
3. **Memory Allocation**: Higher memory = faster CPU
4. **Code Caching**: Consider caching compiled bytecode (advanced)

## Future Enhancements

### Planned Features

- [ ] Support for additional Java versions (8, 17, 21)
- [ ] Maven/Gradle dependency management
- [ ] Multiple file/class compilation
- [ ] JUnit test execution
- [ ] Code coverage analysis
- [ ] Performance profiling

### Community Contributions

We welcome contributions! Areas for improvement:

1. Additional language support (C++, Go, Rust)
2. Enhanced security sandboxing
3. Better error messages
4. Code quality analysis
5. Memory usage tracking

## License

This implementation is part of the PROEDUVATE platform.

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/wkarunakaran/PROEDUVATE-CODEING-MODULE/issues)
- Documentation: See `lambda_functions/README.md`

## Changelog

### Version 1.0.0 (2026-02-13)
- Initial implementation
- Java compilation and execution support
- Local and Lambda execution modes
- Comprehensive error handling
- Deployment automation
- Test suite
