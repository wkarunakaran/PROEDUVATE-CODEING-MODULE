"""
Test script for Java code execution in the CodeExecutor service
"""

import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.code_executor import code_executor


async def test_java_execution():
    """Test Java code execution"""
    print("🧪 Testing Java Code Execution\n")
    
    # Test 1: Simple Hello World
    print("Test 1: Simple Hello World")
    print("-" * 50)
    
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
    
    print(f"Success: {result['success']}")
    print(f"Output: {result['output']}")
    print(f"Error: {result['error']}")
    print(f"Time: {result['execution_time']:.3f}s\n")
    
    # Test 2: Two Sum Problem
    print("Test 2: Two Sum Problem")
    print("-" * 50)
    
    java_code = """
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = scanner.nextInt();
        }
        int target = scanner.nextInt();
        
        int[] result = twoSum(nums, target);
        System.out.println(result[0] + " " + result[1]);
    }
    
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] { -1, -1 };
    }
}
"""
    
    test_input = "4\n2 7 11 15\n9"
    
    result = await code_executor.execute_code(
        code=java_code,
        language="java",
        test_input=test_input
    )
    
    print(f"Success: {result['success']}")
    print(f"Output: {result['output']}")
    print(f"Error: {result['error']}")
    print(f"Time: {result['execution_time']:.3f}s\n")
    
    # Test 3: Compilation Error
    print("Test 3: Compilation Error (Missing semicolon)")
    print("-" * 50)
    
    java_code = """
public class Solution {
    public static void main(String[] args) {
        System.out.println("Missing semicolon")  // Error here
    }
}
"""
    
    result = await code_executor.execute_code(
        code=java_code,
        language="java",
        test_input=""
    )
    
    print(f"Success: {result['success']}")
    print(f"Error contains expected message: {';' in result['error']}")
    print(f"Time: {result['execution_time']:.3f}s\n")
    
    print("✅ All tests completed!")


if __name__ == "__main__":
    asyncio.run(test_java_execution())
