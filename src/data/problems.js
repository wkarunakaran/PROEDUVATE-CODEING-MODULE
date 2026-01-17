export const LANGUAGES = ["python", "cpp", "java"];

export const initialProblems = [
  {
    id: 1,
    title: "Sum of Two Numbers",
    difficulty: "Easy",
    topics: ["basics", "I/O"],
    videoUrl: "https://example.com/sum-two-numbers",
    referenceCode: {
      python: `def sum_two_numbers(a, b):
    return a + b

if __name__ == "__main__":
    x = int(input())
    y = int(input())
    print(sum_two_numbers(x, y))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int sum_two_numbers(int a, int b) {
    return a + b;
}

int main() {
    int x, y;
    cin >> x >> y;
    cout << sum_two_numbers(x, y) << "\\n";
    return 0;
}`,
      java: `import java.util.*;

public class Main {
    public static int sumTwoNumbers(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        int y = sc.nextInt();
        System.out.println(sumTwoNumbers(x, y));
    }
}`
    },
    explanations: {
      python: [
        "Define a function that returns the sum of two numbers.",
        "Read two integers from input.",
        "Call the function and print the result."
      ],
      cpp: [
        "Define a function that takes two ints and returns their sum.",
        "In main, read two integers from standard input.",
        "Call the function and print the result."
      ],
      java: [
        "Create a Main class with a static method to sum two integers.",
        "Use Scanner to read two integers from input.",
        "Call the method and print the result."
      ]
    },
    sampleTests: [
      { id: 1, input: "2 3", expected: "5" },
      { id: 2, input: "10 -4", expected: "6" }
    ]
  },
  {
    id: 2,
    title: "Maximum of Three Numbers",
    difficulty: "Easy",
    topics: ["conditionals"],
    videoUrl: "https://example.com/max-three",
    referenceCode: {
      python: `def max_of_three(a, b, c):
    return max(a, b, c)

if __name__ == "__main__":
    a = int(input())
    b = int(input())
    c = int(input())
    print(max_of_three(a, b, c))`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int max_of_three(int a, int b, int c) {
    int m = a;
    if (b > m) m = b;
    if (c > m) m = c;
    return m;
}

int main() {
    int a, b, c;
    cin >> a >> b >> c;
    cout << max_of_three(a, b, c) << "\\n";
    return 0;
}`,
      java: `import java.util.*;

public class Main {
    public static int maxOfThree(int a, int b, int c) {
        int m = a;
        if (b > m) m = b;
        if (c > m) m = c;
        return m;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int c = sc.nextInt();
        System.out.println(maxOfThree(a, b, c));
    }
}`
    },
    explanations: {
      python: [
        "Use Python's built-in max() to get the largest of three numbers.",
        "Read three integers from input and print the maximum."
      ],
      cpp: [
        "Track the maximum value using if conditions.",
        "Compare each of the three numbers to find the largest."
      ],
      java: [
        "Use conditional checks to update the current maximum.",
        "Read three integers using Scanner and print the largest."
      ]
    },
    sampleTests: [
      { id: 1, input: "1 2 3", expected: "3" },
      { id: 2, input: "10 5 7", expected: "10" }
    ]
  }
];
