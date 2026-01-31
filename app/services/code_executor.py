import subprocess
import tempfile
import os
import time
from typing import Dict, Any, List
from app.core.config import get_settings

settings = get_settings()

class CodeExecutor:
    def __init__(self):
        # Force local execution for now - AWS Lambda has output capture issues
        self.use_local = True
        print(f"🔧 CodeExecutor initialized - use_local: {self.use_local} (Forced local execution)")
        
        if not self.use_local:
            try:
                import boto3
                self.lambda_client = boto3.client(
                    'lambda',
                    region_name=settings.aws_region,
                    aws_access_key_id=settings.aws_access_key_id,
                    aws_secret_access_key=settings.aws_secret_access_key
                )
                self.function_name = settings.aws_lambda_function_name
                print(f"✅ AWS Lambda client initialized: {self.function_name}")
            except Exception as e:
                print(f"⚠️ AWS Lambda unavailable, using local execution: {e}")
                self.use_local = True
    
    async def execute_code_locally(
        self, 
        code: str, 
        language: str, 
        test_input: str,
        timeout: int = 10
    ) -> Dict[str, Any]:
        """Execute code locally using subprocess"""
        print(f"🐍 Executing locally: {language}")
        try:
            start_time = time.time()
            
            if language.lower() == "python":
                # Create temporary Python file
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                    f.write(code)
                    temp_file = f.name
                
                print(f"📝 Temp file: {temp_file}")
                
                try:
                    # Execute Python code
                    result = subprocess.run(
                        ['python', temp_file],
                        input=test_input,
                        capture_output=True,
                        text=True,
                        timeout=timeout
                    )
                    
                    execution_time = time.time() - start_time
                    
                    print(f"📊 Return code: {result.returncode}")
                    print(f"📤 Stdout: {result.stdout}")
                    print(f"📤 Stderr: {result.stderr}")
                    
                    if result.returncode == 0:
                        return {
                            "success": True,
                            "output": result.stdout,
                            "error": result.stderr if result.stderr else "",
                            "execution_time": execution_time
                        }
                    else:
                        return {
                            "success": False,
                            "output": result.stdout,
                            "error": result.stderr or "Execution failed",
                            "execution_time": execution_time
                        }
                finally:
                    # Clean up temp file
                    try:
                        os.unlink(temp_file)
                    except:
                        pass
            
            else:
                return {
                    "success": False,
                    "output": "",
                    "error": f"Language '{language}' not supported in local execution mode. Only Python is supported.",
                    "execution_time": 0
                }
                
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "",
                "error": f"Execution timed out after {timeout} seconds",
                "execution_time": timeout
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": f"Execution error: {str(e)}",
                "execution_time": 0
            }
    
    async def execute_code(
        self, 
        code: str, 
        language: str, 
        test_input: str,
        timeout: int = 10
    ) -> Dict[str, Any]:
        """
        Execute code using AWS Lambda or locally.
        
        Args:
            code: The source code to execute
            language: Programming language (python, cpp, java)
            test_input: Input data for the program
            timeout: Execution timeout in seconds
            
        Returns:
            Dict with keys: success, output, error, execution_time
        """
        # Use local execution if AWS is not configured
        if self.use_local:
            print("🏠 Using local execution")
            return await self.execute_code_locally(code, language, test_input, timeout)
        
        # Use AWS Lambda
        print("☁️ Attempting AWS Lambda execution")
        try:
            import json
            payload = {
                "code": code,
                "language": language,
                "input": test_input,
                "timeout": timeout
            }
            
            response = self.lambda_client.invoke(
                FunctionName=self.function_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )
            
            result = json.loads(response['Payload'].read())
            print(f"☁️ Lambda result: {result}")
            
            # Transform Lambda response to expected format
            # Lambda returns: {stdout, stderr, status: {id, description}, timme, memory}
            status_id = result.get('status', {}).get('id', -1) if isinstance(result.get('status'), dict) else -1
            is_success = status_id == 3  # Status 3 = Accepted
            
            return {
                "success": is_success,
                "output": result.get("stdout", "") or "",
                "error": result.get("stderr", "") or "",
                "execution_time": float(result.get("timme", result.get("time", 0)) or 0)
            }
            
        except Exception as e:
            # Fallback to local execution if Lambda fails
            print(f"⚠️ Lambda failed, falling back to local: {e}")
            return await self.execute_code_locally(code, language, test_input, timeout)
    
    async def run_test_cases(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Run multiple test cases against the code.
        
        Args:
            code: The source code to test
            language: Programming language
            test_cases: List of dicts with 'input' and 'expected' keys
            
        Returns:
            Dict with keys: passed, failed, total, results
        """
        results = []
        passed = 0
        failed = 0
        
        for i, test_case in enumerate(test_cases):
            test_input = test_case.get("input", "")
            expected_output = test_case.get("expected", "").strip()
            
            result = await self.execute_code(code, language, test_input)
            
            actual_output = result.get("output", "").strip()
            test_passed = result.get("success", False) and actual_output == expected_output
            
            if test_passed:
                passed += 1
            else:
                failed += 1
            
            results.append({
                "test_id": test_case.get("id", i + 1),
                "input": test_input,
                "expected": expected_output,
                "actual": actual_output,
                "passed": test_passed,
                "error": result.get("error", ""),
                "execution_time": result.get("execution_time", 0)
            })
        
        return {
            "passed": passed,
            "failed": failed,
            "total": len(test_cases),
            "results": results,
            "all_passed": failed == 0
        }

code_executor = CodeExecutor()
