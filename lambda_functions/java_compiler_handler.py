"""
AWS Lambda function handler for Java code compilation and execution.

This function compiles and runs Java code in a secure, isolated environment.
It supports standard input/output and has timeout controls for safety.
"""

import json
import subprocess
import tempfile
import os
import time
import shutil
from pathlib import Path


def lambda_handler(event, context):
    """
    AWS Lambda handler for Java code execution.
    
    Expected event structure:
    {
        "code": "public class Solution { ... }",
        "language": "java",
        "input": "test input data",
        "timeout": 10
    }
    
    Returns:
    {
        "success": bool,
        "output": str,
        "error": str,
        "execution_time": float,
        "status": {
            "id": int,  # 3 = Accepted, others = Error
            "description": str
        }
    }
    """
    start_time = time.time()
    
    try:
        # Extract parameters
        code = event.get('code', '')
        language = event.get('language', 'java').lower()
        test_input = event.get('input', '')
        timeout = event.get('timeout', 10)
        
        # Validate language
        if language != 'java':
            return {
                'success': False,
                'output': '',
                'error': f'Unsupported language: {language}. Only Java is supported.',
                'execution_time': 0,
                'status': {
                    'id': 5,  # Compilation Error
                    'description': 'Unsupported Language'
                }
            }
        
        # Execute Java code
        result = execute_java_code(code, test_input, timeout)
        result['execution_time'] = time.time() - start_time
        
        return result
        
    except Exception as e:
        return {
            'success': False,
            'output': '',
            'error': f'Lambda handler error: {str(e)}',
            'execution_time': time.time() - start_time,
            'status': {
                'id': 13,  # Internal Error
                'description': 'Internal Error'
            }
        }


def execute_java_code(code, test_input, timeout=10):
    """
    Compile and execute Java code with the given input.
    
    Args:
        code: Java source code
        test_input: Input data for the program
        timeout: Maximum execution time in seconds
        
    Returns:
        Dict with execution results
    """
    temp_dir = None
    
    try:
        # Create temporary directory for Java files
        temp_dir = tempfile.mkdtemp()
        
        # Extract class name from code
        class_name = extract_class_name(code)
        if not class_name:
            return {
                'success': False,
                'output': '',
                'error': 'Could not find public class in code. Ensure your code has a public class.',
                'status': {
                    'id': 6,  # Compilation Error
                    'description': 'Compilation Error'
                }
            }
        
        # Write code to file
        java_file = os.path.join(temp_dir, f"{class_name}.java")
        with open(java_file, 'w', encoding='utf-8') as f:
            f.write(code)
        
        # Compile Java code
        compile_result = subprocess.run(
            ['javac', java_file],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=temp_dir
        )
        
        if compile_result.returncode != 0:
            return {
                'success': False,
                'output': compile_result.stdout,
                'error': compile_result.stderr,
                'status': {
                    'id': 6,  # Compilation Error
                    'description': 'Compilation Error'
                }
            }
        
        # Execute compiled Java code
        execute_result = subprocess.run(
            ['java', class_name],
            input=test_input,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=temp_dir
        )
        
        if execute_result.returncode == 0:
            return {
                'success': True,
                'output': execute_result.stdout,
                'error': execute_result.stderr,
                'status': {
                    'id': 3,  # Accepted
                    'description': 'Accepted'
                }
            }
        else:
            return {
                'success': False,
                'output': execute_result.stdout,
                'error': execute_result.stderr or 'Runtime error occurred',
                'status': {
                    'id': 11,  # Runtime Error
                    'description': 'Runtime Error'
                }
            }
            
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'output': '',
            'error': f'Execution timed out after {timeout} seconds',
            'status': {
                'id': 5,  # Time Limit Exceeded
                'description': 'Time Limit Exceeded'
            }
        }
    except Exception as e:
        return {
            'success': False,
            'output': '',
            'error': f'Execution error: {str(e)}',
            'status': {
                'id': 13,  # Internal Error
                'description': 'Internal Error'
            }
        }
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except Exception:
                pass


def extract_class_name(code):
    """
    Extract the public class name from Java code.
    
    Args:
        code: Java source code
        
    Returns:
        Class name or None if not found
    """
    import re
    
    # Look for public class declaration
    match = re.search(r'public\s+class\s+(\w+)', code)
    if match:
        return match.group(1)
    
    # Fallback: look for any class declaration
    match = re.search(r'class\s+(\w+)', code)
    if match:
        return match.group(1)
    
    return None


# For local testing
if __name__ == '__main__':
    # Test with a simple Java program
    test_event = {
        'code': '''
public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
        ''',
        'language': 'java',
        'input': '',
        'timeout': 10
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))
