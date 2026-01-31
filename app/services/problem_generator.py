import google.generativeai as genai
from app.core.config import get_settings
import json
import random

settings = get_settings()

# Configure Gemini
if settings.google_api_key:
    genai.configure(api_key=settings.google_api_key)

DIFFICULTY_LEVELS = ["easy", "medium", "hard"]
TOPICS = ["arrays", "strings", "math", "loops", "conditionals", "recursion", "sorting"]

def generate_competitive_problem(difficulty: str = "easy") -> dict:
    """
    Generate a random coding problem using Gemini API for competitive mode.
    Falls back to predefined problems if API is not available.
    """
    
    if not settings.google_api_key:
        return _get_fallback_problem(difficulty)
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""Generate a competitive programming problem for difficulty level: {difficulty}.

Requirements:
1. Problem should be solvable in 5-15 minutes
2. Include clear problem description
3. Provide 3-4 test cases with input and expected output
4. Add a subtle hint
5. Include starter code for Python, C++, and Java
6. Include COMPLETE working reference solutions that pass all test cases

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{{
  "title": "Problem title",
  "description": "Clear problem description with examples",
  "difficulty": "{difficulty}",
  "examples": [
    {{"input": "example input", "output": "example output", "explanation": "why"}}
  ],
  "testCases": [
    {{"input": "test input", "expected": "expected output"}}
  ],
  "hint": "A helpful hint",
  "starterCode": {{
    "python": "def solution():\\n    pass",
    "cpp": "// C++ starter code",
    "java": "// Java starter code"
  }},
  "referenceCode": {{
    "python": "def solution():\\n    # Complete working solution\\n    return result\\n\\nif __name__ == '__main__':\\n    # Handle input/output",
    "cpp": "// Complete working C++ solution",
    "java": "// Complete working Java solution"
  }}
}}

IMPORTANT: The referenceCode must be COMPLETE, WORKING solutions that solve the problem correctly and pass all test cases. Include proper input/output handling in the reference code.

Make it competitive and engaging!"""

        response = model.generate_content(prompt)
        problem_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if problem_text.startswith("```"):
            problem_text = problem_text.split("```")[1]
            if problem_text.startswith("json"):
                problem_text = problem_text[4:]
            problem_text = problem_text.strip()
        
        problem_data = json.loads(problem_text)
        
        # Validate required fields
        required_fields = ["title", "description", "testCases"]
        if not all(field in problem_data for field in required_fields):
            raise ValueError("Missing required fields in generated problem")
        
        return problem_data
        
    except Exception as e:
        print(f"⚠️ Gemini problem generation failed: {e}")
        return _get_fallback_problem(difficulty)

def _get_fallback_problem(difficulty: str = "easy") -> dict:
    """Fallback problems when Gemini API is not available"""
    
    easy_problems = [
        {
            "title": "Double the Number",
            "description": "Write a function that takes an integer and returns it doubled.",
            "difficulty": "easy",
            "examples": [
                {"input": "5", "output": "10", "explanation": "5 * 2 = 10"}
            ],
            "testCases": [
                {"input": "5", "expected": "10"},
                {"input": "0", "expected": "0"},
                {"input": "-3", "expected": "-6"},
                {"input": "100", "expected": "200"}
            ],
            "hint": "Simply multiply the input by 2",
            "starterCode": {
                "python": "def solution(n):\n    # Your code here\n    pass\n\nif __name__ == '__main__':\n    n = int(input())\n    print(solution(n))",
                "cpp": "#include <iostream>\nusing namespace std;\n\nint solution(int n) {\n    // Your code here\n    return 0;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << solution(n);\n    return 0;\n}",
                "java": "import java.util.Scanner;\n\npublic class Main {\n    public static int solution(int n) {\n        // Your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(solution(n));\n    }\n}"
            },
            "referenceCode": {
                "python": "def solution(n):\n    return n * 2\n\nif __name__ == '__main__':\n    n = int(input())\n    print(solution(n))",
                "cpp": "#include <iostream>\nusing namespace std;\n\nint solution(int n) {\n    return n * 2;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    cout << solution(n);\n    return 0;\n}",
                "java": "import java.util.Scanner;\n\npublic class Main {\n    public static int solution(int n) {\n        return n * 2;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(solution(n));\n    }\n}"
            }
        },
        {
            "title": "Sum of Array",
            "description": "Calculate the sum of all elements in an array of integers.",
            "difficulty": "easy",
            "examples": [
                {"input": "3\n1 2 3", "output": "6", "explanation": "1 + 2 + 3 = 6"}
            ],
            "testCases": [
                {"input": "3\n1 2 3", "expected": "6"},
                {"input": "4\n10 20 30 40", "expected": "100"},
                {"input": "1\n5", "expected": "5"},
                {"input": "5\n-1 -2 3 4 5", "expected": "9"}
            ],
            "hint": "Use a loop to add each element to a running total",
            "starterCode": {
                "python": "def solution(arr):\n    # Your code here\n    pass\n\nif __name__ == '__main__':\n    n = int(input())\n    arr = list(map(int, input().split()))\n    print(solution(arr))",
                "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint solution(vector<int>& arr) {\n    // Your code here\n    return 0;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> arr(n);\n    for(int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    cout << solution(arr);\n    return 0;\n}",
                "java": "import java.util.*;\n\npublic class Main {\n    public static int solution(int[] arr) {\n        // Your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) {\n            arr[i] = sc.nextInt();\n        }\n        System.out.println(solution(arr));\n    }\n}"
            },
            "referenceCode": {
                "python": "def solution(arr):\n    return sum(arr)\n\nif __name__ == '__main__':\n    n = int(input())\n    arr = list(map(int, input().split()))\n    print(solution(arr))",
                "cpp": "#include <iostream>\n#include <vector>\n#include <numeric>\nusing namespace std;\n\nint solution(vector<int>& arr) {\n    return accumulate(arr.begin(), arr.end(), 0);\n}\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> arr(n);\n    for(int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    cout << solution(arr);\n    return 0;\n}",
                "java": "import java.util.*;\n\npublic class Main {\n    public static int solution(int[] arr) {\n        int sum = 0;\n        for(int num : arr) {\n            sum += num;\n        }\n        return sum;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) {\n            arr[i] = sc.nextInt();\n        }\n        System.out.println(solution(arr));\n    }\n}"
            }
        },
        {
            "title": "Reverse String",
            "description": "Given a string, return it reversed.",
            "difficulty": "easy",
            "examples": [
                {"input": "hello", "output": "olleh", "explanation": "The string is reversed"}
            ],
            "testCases": [
                {"input": "hello", "expected": "olleh"},
                {"input": "world", "expected": "dlrow"},
                {"input": "a", "expected": "a"},
                {"input": "racecar", "expected": "racecar"}
            ],
            "hint": "Python has a built-in way to reverse strings using slicing",
            "starterCode": {
                "python": "def solution(s):\n    # Your code here\n    pass\n\nif __name__ == '__main__':\n    s = input()\n    print(solution(s))",
                "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nstring solution(string s) {\n    // Your code here\n    return \"\";\n}\n\nint main() {\n    string s;\n    cin >> s;\n    cout << solution(s);\n    return 0;\n}",
                "java": "import java.util.Scanner;\n\npublic class Main {\n    public static String solution(String s) {\n        // Your code here\n        return \"\";\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(solution(s));\n    }\n}"
            },
            "referenceCode": {
                "python": "def solution(s):\n    return s[::-1]\n\nif __name__ == '__main__':\n    s = input()\n    print(solution(s))",
                "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nstring solution(string s) {\n    reverse(s.begin(), s.end());\n    return s;\n}\n\nint main() {\n    string s;\n    cin >> s;\n    cout << solution(s);\n    return 0;\n}",
                "java": "import java.util.Scanner;\n\npublic class Main {\n    public static String solution(String s) {\n        return new StringBuilder(s).reverse().toString();\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(solution(s));\n    }\n}"
            }
        }
    ]
    
    medium_problems = [
        {
            "title": "Find Maximum",
            "description": "Find the maximum element in an array of integers.",
            "difficulty": "medium",
            "examples": [
                {"input": "5\n3 7 2 9 1", "output": "9", "explanation": "9 is the largest number"}
            ],
            "testCases": [
                {"input": "5\n3 7 2 9 1", "expected": "9"},
                {"input": "3\n-5 -2 -8", "expected": "-2"},
                {"input": "1\n42", "expected": "42"},
                {"input": "4\n100 200 50 150", "expected": "200"}
            ],
            "hint": "Keep track of the maximum value as you iterate",
            "starterCode": {
                "python": "def solution(arr):\n    # Your code here\n    pass\n\nif __name__ == '__main__':\n    n = int(input())\n    arr = list(map(int, input().split()))\n    print(solution(arr))",
                "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint solution(vector<int>& arr) {\n    // Your code here\n    return 0;\n}\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> arr(n);\n    for(int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    cout << solution(arr);\n    return 0;\n}",
                "java": "import java.util.*;\n\npublic class Main {\n    public static int solution(int[] arr) {\n        // Your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) {\n            arr[i] = sc.nextInt();\n        }\n        System.out.println(solution(arr));\n    }\n}"
            },
            "referenceCode": {
                "python": "def solution(arr):\n    return max(arr)\n\nif __name__ == '__main__':\n    n = int(input())\n    arr = list(map(int, input().split()))\n    print(solution(arr))",
                "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint solution(vector<int>& arr) {\n    return *max_element(arr.begin(), arr.end());\n}\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> arr(n);\n    for(int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    cout << solution(arr);\n    return 0;\n}",
                "java": "import java.util.*;\n\npublic class Main {\n    public static int solution(int[] arr) {\n        int max = arr[0];\n        for(int i = 1; i < arr.length; i++) {\n            if(arr[i] > max) {\n                max = arr[i];\n            }\n        }\n        return max;\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) {\n            arr[i] = sc.nextInt();\n        }\n        System.out.println(solution(arr));\n    }\n}"
            }
        }
    ]
    
    # Select problems based on difficulty
    if difficulty.lower() == "easy":
        return random.choice(easy_problems)
    elif difficulty.lower() == "medium":
        return random.choice(medium_problems)
    else:
        return random.choice(easy_problems + medium_problems)
