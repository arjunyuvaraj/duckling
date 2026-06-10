function indent(text, spaces = 4) {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim().length ? `${prefix}${line}` : ''))
    .join('\n');
}

function normalizeJavaMethod(sourceCode) {
  let normalized = sourceCode.replace(/^import\s+.+;\s*$/gm, '').trim();
  const classMatch = normalized.match(/class\s+\w+\s*\{([\s\S]*)\}\s*$/);

  if (classMatch) {
    normalized = classMatch[1].trim();
  }

  return normalized;
}

function normalizePythonFunction(sourceCode) {
  return sourceCode.trim();
}

function wrapJavaSolution({ body, helpers = '', runner }) {
  return `import java.util.*;

public class Main {
${helpers ? `${indent(helpers)}\n` : ''}    static class Solution {
${indent(body, 8)}
    }

    static List<String> CASES = new ArrayList<>();
    static boolean ALL_PASSED = true;

    static void recordCase(String expected, String actual, boolean pass) {
        CASES.add("__DUCKLING_CASE__|" + expected.replace("\\n", "\\\\n") + "|" + actual.replace("\\n", "\\\\n") + "|" + (pass ? "OK" : "X"));
        if (!pass) {
            ALL_PASSED = false;
        }
    }

    static String displayValue(Object value) {
        if (value == null) return "null";
        if (value instanceof int[]) return Arrays.toString((int[]) value);
        if (value instanceof char[]) return Arrays.toString((char[]) value);
        if (value instanceof boolean[]) return Arrays.toString((boolean[]) value);
        if (value instanceof Object[]) return Arrays.deepToString((Object[]) value);
        return String.valueOf(value);
    }

    static void finish() {
        System.out.println("__DUCKLING_STATUS__:" + (ALL_PASSED ? "Accepted" : "Wrong Answer"));
        if (!ALL_PASSED) {
            System.out.println("__DUCKLING_MESSAGE__:One or more test cases failed.");
        }
        for (String line : CASES) {
            System.out.println(line);
        }
    }

    public static void main(String[] args) {
${indent(runner, 8)}
    }
}
`;
}

function wrapPythonSolution({ body, helpers = '', runner }) {
  return `${body}

${helpers}
_DUCKLING_CASES = []
_DUCKLING_ALL_PASSED = True

def _duckling_display(value):
    if isinstance(value, bool):
        return str(value).lower()
    return str(value)

def _duckling_record(expected: str, actual: str, passed: bool):
    global _DUCKLING_ALL_PASSED
    expected_clean = expected.replace("\\n", "\\\\n")
    actual_clean = actual.replace("\\n", "\\\\n")
    verdict = "OK" if passed else "X"
    _DUCKLING_CASES.append(f"__DUCKLING_CASE__|{expected_clean}|{actual_clean}|{verdict}")
    if not passed:
        _DUCKLING_ALL_PASSED = False

def _duckling_finish():
    print("__DUCKLING_STATUS__:" + ("Accepted" if _DUCKLING_ALL_PASSED else "Wrong Answer"))
    if not _DUCKLING_ALL_PASSED:
        print("__DUCKLING_MESSAGE__:One or more test cases failed.")
    for line in _DUCKLING_CASES:
        print(line)

def _duckling_main():
${indent(runner)}

if __name__ == "__main__":
    _duckling_main()
`;
}

function javaHarnesses() {
  return {
    1: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] numsCases = {{2, 7, 11, 15}, {3, 2, 4}, {3, 3}};
int[] targetCases = {9, 6, 6};
int[][] expectedCases = {{0, 1}, {1, 2}, {0, 1}};
for (int i = 0; i < numsCases.length; i++) {
    int[] actual = solution.twoSum(numsCases[i], targetCases[i]);
    String expectedLabel = "twoSum(" + Arrays.toString(numsCases[i]) + ", " + targetCases[i] + ") -> " + Arrays.toString(expectedCases[i]);
    String actualLabel = displayValue(actual);
    recordCase(expectedLabel, actualLabel, Arrays.equals(actual, expectedCases[i]));
}
finish();`,
      }),
    2: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
char[][] cases = {{'h', 'e', 'l', 'l', 'o'}, {'D', 'u', 'c', 'k'}};
char[][] expected = {{'o', 'l', 'l', 'e', 'h'}, {'k', 'c', 'u', 'D'}};
for (int i = 0; i < cases.length; i++) {
    char[] actual = Arrays.copyOf(cases[i], cases[i].length);
    solution.reverseString(actual);
    String expectedLabel = "reverseString(" + Arrays.toString(cases[i]) + ") -> " + Arrays.toString(expected[i]);
    String actualLabel = displayValue(actual);
    recordCase(expectedLabel, actualLabel, Arrays.equals(actual, expected[i]));
}
finish();`,
      }),
    3: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[] inputs = {0, 1, 6, 10};
int[] expected = {0, 1, 8, 55};
for (int i = 0; i < inputs.length; i++) {
    int actual = solution.fib(inputs[i]);
    String expectedLabel = "fib(" + inputs[i] + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    4: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
String[] inputs = {"()[]{}", "(]", "{[]}"};
boolean[] expected = {true, false, true};
for (int i = 0; i < inputs.length; i++) {
    boolean actual = solution.isValid(inputs[i]);
    String expectedLabel = "isValid(\\"" + inputs[i] + "\\") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    5: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] numsCases = {{-1, 0, 3, 5, 9, 12}, {-1, 0, 3, 5, 9, 12}, {5}};
int[] targets = {9, 2, 5};
int[] expected = {4, -1, 0};
for (int i = 0; i < numsCases.length; i++) {
    int actual = solution.search(numsCases[i], targets[i]);
    String expectedLabel = "search(" + Arrays.toString(numsCases[i]) + ", " + targets[i] + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    6: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] nums1Cases = {{1, 2, 3, 0, 0, 0}, {1}, {4, 5, 6, 0, 0, 0}};
int[] mCases = {3, 1, 3};
int[][] nums2Cases = {{2, 5, 6}, {}, {1, 2, 3}};
int[] nCases = {3, 0, 3};
int[][] expected = {{1, 2, 2, 3, 5, 6}, {1}, {1, 2, 3, 4, 5, 6}};
for (int i = 0; i < nums1Cases.length; i++) {
    int[] actual = Arrays.copyOf(nums1Cases[i], nums1Cases[i].length);
    solution.merge(actual, mCases[i], nums2Cases[i], nCases[i]);
    String expectedLabel = "merge(" + Arrays.toString(nums1Cases[i]) + ", " + mCases[i] + ", " + Arrays.toString(nums2Cases[i]) + ", " + nCases[i] + ") -> " + Arrays.toString(expected[i]);
    recordCase(expectedLabel, displayValue(actual), Arrays.equals(actual, expected[i]));
}
finish();`,
      }),
    7: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] cases = {{-2, 1, -3, 4, -1, 2, 1, -5, 4}, {1}, {5, 4, -1, 7, 8}};
int[] expected = {6, 1, 23};
for (int i = 0; i < cases.length; i++) {
    int actual = solution.maxSubArray(cases[i]);
    String expectedLabel = "maxSubArray(" + Arrays.toString(cases[i]) + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    8: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        helpers: `static class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

static ListNode buildList(int[] values, int pos) {
    if (values.length == 0) return null;
    ListNode head = new ListNode(values[0]);
    ListNode current = head;
    ListNode cycleNode = pos == 0 ? head : null;
    for (int i = 1; i < values.length; i++) {
        current.next = new ListNode(values[i]);
        current = current.next;
        if (i == pos) cycleNode = current;
    }
    if (pos >= 0) current.next = cycleNode;
    return head;
}`,
        runner: `Solution solution = new Solution();
int[][] valueCases = {{3, 2, 0, -4}, {1, 2}, {1}};
int[] posCases = {1, 0, -1};
boolean[] expected = {true, true, false};
for (int i = 0; i < valueCases.length; i++) {
    ListNode head = buildList(valueCases[i], posCases[i]);
    boolean actual = solution.hasCycle(head);
    String expectedLabel = "hasCycle(" + Arrays.toString(valueCases[i]) + ", pos=" + posCases[i] + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    9: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
String[][] cases = {{"anagram", "nagaram"}, {"rat", "car"}, {"listen", "silent"}};
boolean[] expected = {true, false, true};
for (int i = 0; i < cases.length; i++) {
    boolean actual = solution.isAnagram(cases[i][0], cases[i][1]);
    String expectedLabel = "isAnagram(\\"" + cases[i][0] + "\\", \\"" + cases[i][1] + "\\") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    10: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[] inputs = {0, 10, 20};
int[] expected = {0, 4, 8};
for (int i = 0; i < inputs.length; i++) {
    int actual = solution.countPrimes(inputs[i]);
    String expectedLabel = "countPrimes(" + inputs[i] + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    11: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[] inputs = {5, 3};
String[][] expected = {{"1", "2", "Fizz", "4", "Buzz"}, {"1", "2", "Fizz"}};
for (int i = 0; i < inputs.length; i++) {
    List<String> actual = solution.fizzBuzz(inputs[i]);
    List<String> expectedList = Arrays.asList(expected[i]);
    String expectedLabel = "fizzBuzz(" + inputs[i] + ") -> " + expectedList;
    recordCase(expectedLabel, displayValue(actual), actual.equals(expectedList));
}
finish();`,
      }),
    12: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
String[] inputs = {"Hello World", "DUCKLING", "rhythm"};
int[] expected = {3, 2, 0};
for (int i = 0; i < inputs.length; i++) {
    int actual = solution.countVowels(inputs[i]);
    String expectedLabel = "countVowels(\\"" + inputs[i] + "\\") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    13: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] inputs = {{4, 3, 2, 7, 8, 2, 3, 1}, {1, 1, 2}, {1}};
Integer[][] expected = {{2, 3}, {1}, {}};
for (int i = 0; i < inputs.length; i++) {
    List<Integer> actual = solution.findDuplicates(inputs[i]);
    List<Integer> expectedList = Arrays.asList(expected[i]);
    String expectedLabel = "findDuplicates(" + Arrays.toString(inputs[i]) + ") -> " + expectedList;
    recordCase(expectedLabel, displayValue(actual), actual.equals(expectedList));
}
finish();`,
      }),
    14: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[] inputs = {16, 3, 1};
boolean[] expected = {true, false, true};
for (int i = 0; i < inputs.length; i++) {
    boolean actual = solution.isPowerOfTwo(inputs[i]);
    String expectedLabel = "isPowerOfTwo(" + inputs[i] + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    15: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
String[] inputs = {"{[()]}", "([)]", "(()"};
boolean[] expected = {true, false, false};
for (int i = 0; i < inputs.length; i++) {
    boolean actual = solution.isBalanced(inputs[i]);
    String expectedLabel = "isBalanced(\\"" + inputs[i] + "\\") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    16: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][][] inputs = {
    {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}},
    {{5}},
    {{1, 1, 1, 1}, {1, 1, 1, 1}, {1, 1, 1, 1}, {1, 1, 1, 1}}
};
int[] expected = {25, 5, 8};
for (int i = 0; i < inputs.length; i++) {
    int actual = solution.diagonalSum(inputs[i]);
    String expectedLabel = "diagonalSum(" + Arrays.deepToString(inputs[i]) + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    17: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
String[] inputs = {"cbbd", "forgeeksskeegfor", "racecar"};
String[] expected = {"bb", "geeksskeeg", "racecar"};
for (int i = 0; i < inputs.length; i++) {
    String actual = solution.longestPalindrome(inputs[i]);
    String expectedLabel = "longestPalindrome(\\"" + inputs[i] + "\\") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), Objects.equals(actual, expected[i]));
}
finish();`,
      }),
    18: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] coinCases = {{1, 5, 11}, {1, 2, 5}, {2}};
int[] amountCases = {15, 11, 3};
int[] expected = {3, 3, -1};
for (int i = 0; i < coinCases.length; i++) {
    int actual = solution.coinChange(coinCases[i], amountCases[i]);
    String expectedLabel = "coinChange(" + Arrays.toString(coinCases[i]) + ", " + amountCases[i] + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    19: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
char[][][] grids = {
    {{'1','1','0','0','0'}, {'1','1','0','0','0'}, {'0','0','1','0','0'}, {'0','0','0','1','1'}},
    {{'1','1','1'}, {'0','1','0'}, {'1','1','1'}},
    {{'0','0'}, {'0','0'}}
};
int[] expected = {3, 1, 0};
for (int i = 0; i < grids.length; i++) {
    int actual = solution.numIslands(grids[i]);
    String expectedLabel = "numIslands(" + Arrays.deepToString(grids[i]) + ") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
    20: (userCode) =>
      wrapJavaSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
char[][][] boards = {
    {{'A','B','C','E'}, {'S','F','C','S'}, {'A','D','E','E'}},
    {{'A','B','C','E'}, {'S','F','C','S'}, {'A','D','E','E'}},
    {{'A','B','C','E'}, {'S','F','C','S'}, {'A','D','E','E'}}
};
String[] words = {"ABCCED", "SEE", "ABCB"};
boolean[] expected = {true, true, false};
for (int i = 0; i < boards.length; i++) {
    boolean actual = solution.wordSearch(boards[i], words[i]);
    String expectedLabel = "wordSearch(" + Arrays.deepToString(boards[i]) + ", \\"" + words[i] + "\\") -> " + expected[i];
    recordCase(expectedLabel, displayValue(actual), actual == expected[i]);
}
finish();`,
      }),
  };
}

function pythonHarnesses() {
  return {
    1: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(([2, 7, 11, 15], 9), [0, 1]), (([3, 2, 4], 6), [1, 2]), (([3, 3], 6), [0, 1])]
for (nums, target), expected in cases:
    actual = twoSum(nums, target)
    expected_label = f"twoSum({nums}, {target}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    2: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(["h", "e", "l", "l", "o"], ["o", "l", "l", "e", "h"]), (["D", "u", "c", "k"], ["k", "c", "u", "D"])]
for chars, expected in cases:
    actual = chars[:]
    reverseString(actual)
    expected_label = f"reverseString({chars}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    3: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(0, 0), (1, 1), (6, 8), (10, 55)]
for value, expected in cases:
    actual = fib(value)
    expected_label = f"fib({value}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    4: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [("()[]{}", True), ("(]", False), ("{[]}", True)]
for value, expected in cases:
    actual = isValid(value)
    expected_label = f'isValid("{value}") -> {_duckling_display(expected)}'
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    5: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(([-1, 0, 3, 5, 9, 12], 9), 4), (([-1, 0, 3, 5, 9, 12], 2), -1), (([5], 5), 0)]
for (nums, target), expected in cases:
    actual = search(nums, target)
    expected_label = f"search({nums}, {target}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    6: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    (([1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3), [1, 2, 2, 3, 5, 6]),
    (([1], 1, [], 0), [1]),
    (([4, 5, 6, 0, 0, 0], 3, [1, 2, 3], 3), [1, 2, 3, 4, 5, 6]),
]
for (nums1, m, nums2, n), expected in cases:
    actual = nums1[:]
    merge(actual, m, nums2, n)
    expected_label = f"merge({nums1}, {m}, {nums2}, {n}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    7: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [([-2, 1, -3, 4, -1, 2, 1, -5, 4], 6), ([1], 1), ([5, 4, -1, 7, 8], 23)]
for nums, expected in cases:
    actual = maxSubArray(nums)
    expected_label = f"maxSubArray({nums}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    8: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        helpers: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _build_list(values, pos):
    if not values:
        return None
    nodes = [ListNode(value) for value in values]
    for index in range(len(nodes) - 1):
        nodes[index].next = nodes[index + 1]
    if pos >= 0:
        nodes[-1].next = nodes[pos]
    return nodes[0]
`,
        runner: `cases = [(([3, 2, 0, -4], 1), True), (([1, 2], 0), True), (([1], -1), False)]
for (values, pos), expected in cases:
    actual = hasCycle(_build_list(values, pos))
    expected_label = f"hasCycle({values}, pos={pos}) -> {_duckling_display(expected)}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    9: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(("anagram", "nagaram"), True), (("rat", "car"), False), (("listen", "silent"), True)]
for (first, second), expected in cases:
    actual = isAnagram(first, second)
    expected_label = f'isAnagram("{first}", "{second}") -> {_duckling_display(expected)}'
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    10: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(0, 0), (10, 4), (20, 8)]
for value, expected in cases:
    actual = countPrimes(value)
    expected_label = f"countPrimes({value}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    11: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    (5, ["1", "2", "Fizz", "4", "Buzz"]),
    (15, ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]),
]
for value, expected in cases:
    actual = fizzBuzz(value)
    expected_label = f"fizzBuzz({value}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    12: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [("Hello World", 3), ("DUCKLING", 2), ("rhythm", 0)]
for value, expected in cases:
    actual = countVowels(value)
    expected_label = f'countVowels("{value}") -> {expected}'
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    13: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    ([4, 3, 2, 7, 8, 2, 3, 1], [2, 3]),
    ([1, 1, 2], [1]),
    ([1], []),
]
for nums, expected in cases:
    actual = findDuplicates(nums[:])
    passed = sorted(actual) == expected
    expected_label = f"findDuplicates({nums}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), passed)
_duckling_finish()`,
      }),
    14: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(16, True), (3, False), (1, True)]
for value, expected in cases:
    actual = isPowerOfTwo(value)
    expected_label = f"isPowerOfTwo({value}) -> {_duckling_display(expected)}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    15: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [("{[()]}", True), ("([)]", False), ("(()", False)]
for value, expected in cases:
    actual = isBalanced(value)
    expected_label = f'isBalanced("{value}") -> {_duckling_display(expected)}'
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    16: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    ([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 25),
    ([[5]], 5),
    ([[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]], 8),
]
for value, expected in cases:
    actual = diagonalSum(value)
    expected_label = f"diagonalSum({value}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    17: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [("cbbd", {"bb"}), ("forgeeksskeegfor", {"geeksskeeg"}), ("racecar", {"racecar"})]
for value, expected in cases:
    actual = longestPalindrome(value)
    passed = actual in expected
    expected_label = f'longestPalindrome("{value}") -> {sorted(expected)}'
    _duckling_record(expected_label, _duckling_display(actual), passed)
_duckling_finish()`,
      }),
    18: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(([1, 5, 11], 15), 3), (([1, 2, 5], 11), 3), (([2], 3), -1)]
for (coins, amount), expected in cases:
    actual = coinChange(coins, amount)
    expected_label = f"coinChange({coins}, {amount}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    19: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    ([["1","1","0","0","0"], ["1","1","0","0","0"], ["0","0","1","0","0"], ["0","0","0","1","1"]], 3),
    ([["1","1","1"], ["0","1","0"], ["1","1","1"]], 1),
    ([["0","0"], ["0","0"]], 0),
]
for grid, expected in cases:
    actual = numIslands([row[:] for row in grid])
    expected_label = f"numIslands({grid}) -> {expected}"
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
    20: (userCode) =>
      wrapPythonSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    (([["A","B","C","E"], ["S","F","C","S"], ["A","D","E","E"]], "ABCCED"), True),
    (([["A","B","C","E"], ["S","F","C","S"], ["A","D","E","E"]], "SEE"), True),
    (([["A","B","C","E"], ["S","F","C","S"], ["A","D","E","E"]], "ABCB"), False),
]
for (board, word), expected in cases:
    actual = wordSearch([row[:] for row in board], word)
    expected_label = f'wordSearch({board}, "{word}") -> {_duckling_display(expected)}'
    _duckling_record(expected_label, _duckling_display(actual), actual == expected)
_duckling_finish()`,
      }),
  };
}

// ── Compete-mode wrappers ─────────────────────────────────────────────────
// Same as regular wrappers but add recordHidden() / _duckling_record_hidden()
// so hidden test results are emitted as __DUCKLING_HIDDEN__|OK|X lines.

function wrapJavaCompeteSolution({ body, helpers = '', runner }) {
  return `import java.util.*;

public class Main {
${helpers ? `${indent(helpers)}\n` : ''}    static class Solution {
${indent(body, 8)}
    }

    static List<String> CASES = new ArrayList<>();
    static boolean VISIBLE_ALL_PASSED = true;
    static boolean HIDDEN_ALL_PASSED  = true;

    static void recordCase(String expected, String actual, boolean pass) {
        CASES.add("__DUCKLING_CASE__|" + expected.replace("\\n", "\\\\n") + "|" + actual.replace("\\n", "\\\\n") + "|" + (pass ? "OK" : "X"));
        if (!pass) VISIBLE_ALL_PASSED = false;
    }

    static void recordHidden(boolean pass) {
        if (!pass) HIDDEN_ALL_PASSED = false;
        System.out.println("__DUCKLING_HIDDEN__|" + (pass ? "OK" : "X"));
    }

    static String displayValue(Object value) {
        if (value == null) return "null";
        if (value instanceof int[]) return Arrays.toString((int[]) value);
        if (value instanceof char[]) return Arrays.toString((char[]) value);
        if (value instanceof boolean[]) return Arrays.toString((boolean[]) value);
        if (value instanceof Object[]) return Arrays.deepToString((Object[]) value);
        return String.valueOf(value);
    }

    static void finish() {
        boolean allPassed = VISIBLE_ALL_PASSED && HIDDEN_ALL_PASSED;
        System.out.println("__DUCKLING_STATUS__:" + (allPassed ? "Accepted" : "Wrong Answer"));
        if (!allPassed) System.out.println("__DUCKLING_MESSAGE__:One or more test cases failed.");
        for (String line : CASES) System.out.println(line);
    }

    public static void main(String[] args) {
${indent(runner, 8)}
    }
}
`;
}

function wrapPythonCompeteSolution({ body, helpers = '', runner }) {
  return `${body}

${helpers}
_DUCKLING_CASES = []
_DUCKLING_ALL_PASSED = True
_DUCKLING_HIDDEN_ALL_PASSED = True

def _duckling_display(value):
    if isinstance(value, bool):
        return str(value).lower()
    return str(value)

def _duckling_record(expected: str, actual: str, passed: bool):
    global _DUCKLING_ALL_PASSED
    expected_clean = expected.replace("\\n", "\\\\n")
    actual_clean = actual.replace("\\n", "\\\\n")
    verdict = "OK" if passed else "X"
    _DUCKLING_CASES.append(f"__DUCKLING_CASE__|{expected_clean}|{actual_clean}|{verdict}")
    if not passed:
        _DUCKLING_ALL_PASSED = False

def _duckling_record_hidden(passed: bool):
    global _DUCKLING_HIDDEN_ALL_PASSED
    if not passed:
        _DUCKLING_HIDDEN_ALL_PASSED = False
    print("__DUCKLING_HIDDEN__|" + ("OK" if passed else "X"))

def _duckling_finish():
    all_passed = _DUCKLING_ALL_PASSED and _DUCKLING_HIDDEN_ALL_PASSED
    print("__DUCKLING_STATUS__:" + ("Accepted" if all_passed else "Wrong Answer"))
    if not all_passed:
        print("__DUCKLING_MESSAGE__:One or more test cases failed.")
    for line in _DUCKLING_CASES:
        print(line)

def _duckling_main():
${indent(runner)}

if __name__ == "__main__":
    _duckling_main()
`;
}

// ── Compete harnesses ─────────────────────────────────────────────────────

function javaCompeteHarnesses() {
  return {
    1: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] numsCases = {{2,7,11,15},{3,2,4},{3,3}};
int[] targetCases = {9,6,6};
int[][] expectedCases = {{0,1},{1,2},{0,1}};
for (int i = 0; i < numsCases.length; i++) {
    int[] actual = solution.twoSum(numsCases[i], targetCases[i]);
    recordCase("twoSum("+Arrays.toString(numsCases[i])+", "+targetCases[i]+") -> "+Arrays.toString(expectedCases[i]), displayValue(actual), Arrays.equals(actual, expectedCases[i]));
}
recordHidden(Arrays.equals(solution.twoSum(new int[]{1,3,4,2}, 6), new int[]{2,3}));
recordHidden(Arrays.equals(solution.twoSum(new int[]{5,1,5}, 10), new int[]{0,2}));
recordHidden(Arrays.equals(solution.twoSum(new int[]{0,0}, 0), new int[]{0,1}));
recordHidden(Arrays.equals(solution.twoSum(new int[]{1,6,7,5}, 11), new int[]{1,3}));
finish();`,
      }),
    2: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
char[][] cases = {{'h','e','l','l','o'},{'D','u','c','k'}};
char[][] expected = {{'o','l','l','e','h'},{'k','c','u','D'}};
for (int i = 0; i < cases.length; i++) {
    char[] actual = Arrays.copyOf(cases[i], cases[i].length);
    solution.reverseString(actual);
    recordCase("reverseString("+Arrays.toString(cases[i])+") -> "+Arrays.toString(expected[i]), displayValue(actual), Arrays.equals(actual, expected[i]));
}
{ char[] a = {'a'}; solution.reverseString(a); recordHidden(Arrays.equals(a, new char[]{'a'})); }
{ char[] a = {'a','b','c'}; solution.reverseString(a); recordHidden(Arrays.equals(a, new char[]{'c','b','a'})); }
{ char[] a = {'1','2','3','4'}; solution.reverseString(a); recordHidden(Arrays.equals(a, new char[]{'4','3','2','1'})); }
{ char[] a = {'m','n','o','p'}; solution.reverseString(a); recordHidden(Arrays.equals(a, new char[]{'p','o','n','m'})); }
finish();`,
      }),
    3: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[] inputs = {0,1,6,10};
int[] expected = {0,1,8,55};
for (int i = 0; i < inputs.length; i++) {
    int actual = solution.fib(inputs[i]);
    recordCase("fib("+inputs[i]+") -> "+expected[i], displayValue(actual), actual == expected[i]);
}
recordHidden(solution.fib(2)  == 1);
recordHidden(solution.fib(5)  == 5);
recordHidden(solution.fib(15) == 610);
recordHidden(solution.fib(20) == 6765);
finish();`,
      }),
    4: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
String[] inputs = {"()[]{}", "(]", "{[]}"};
boolean[] expected = {true, false, true};
for (int i = 0; i < inputs.length; i++) {
    boolean actual = solution.isValid(inputs[i]);
    recordCase("isValid(\\""+inputs[i]+"\\") -> "+expected[i], displayValue(actual), actual == expected[i]);
}
recordHidden(solution.isValid("()") == true);
recordHidden(solution.isValid("(((") == false);
recordHidden(solution.isValid("]") == false);
recordHidden(solution.isValid("{[()]}") == true);
finish();`,
      }),
    5: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] numsCases = {{-1,0,3,5,9,12},{-1,0,3,5,9,12},{5}};
int[] targets = {9,2,5};
int[] expected = {4,-1,0};
for (int i = 0; i < numsCases.length; i++) {
    int actual = solution.search(numsCases[i], targets[i]);
    recordCase("search("+Arrays.toString(numsCases[i])+", "+targets[i]+") -> "+expected[i], displayValue(actual), actual == expected[i]);
}
recordHidden(solution.search(new int[]{1,3,5,7,9}, 1) == 0);
recordHidden(solution.search(new int[]{1,3,5,7,9}, 9) == 4);
recordHidden(solution.search(new int[]{2,4,6,8,10}, 6) == 2);
recordHidden(solution.search(new int[]{1}, 2) == -1);
finish();`,
      }),
    6: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] n1 = {{1,2,3,0,0,0},{1},{4,5,6,0,0,0}};
int[] m = {3,1,3};
int[][] n2 = {{2,5,6},{},{1,2,3}};
int[] n = {3,0,3};
int[][] exp = {{1,2,2,3,5,6},{1},{1,2,3,4,5,6}};
for (int i = 0; i < n1.length; i++) {
    int[] actual = Arrays.copyOf(n1[i], n1[i].length);
    solution.merge(actual, m[i], n2[i], n[i]);
    recordCase("merge -> "+Arrays.toString(exp[i]), displayValue(actual), Arrays.equals(actual, exp[i]));
}
{ int[] a = {0}; solution.merge(a,0,new int[]{1},1); recordHidden(Arrays.equals(a,new int[]{1})); }
{ int[] a = {2,0}; solution.merge(a,1,new int[]{1},1); recordHidden(Arrays.equals(a,new int[]{1,2})); }
{ int[] a = {1,3,5,0,0,0}; solution.merge(a,3,new int[]{2,4,6},3); recordHidden(Arrays.equals(a,new int[]{1,2,3,4,5,6})); }
{ int[] a = {2,2,2,0,0,0}; solution.merge(a,3,new int[]{2,2,2},3); recordHidden(Arrays.equals(a,new int[]{2,2,2,2,2,2})); }
finish();`,
      }),
    7: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[][] cases = {{-2,1,-3,4,-1,2,1,-5,4},{1},{5,4,-1,7,8}};
int[] expected = {6,1,23};
for (int i = 0; i < cases.length; i++) {
    int actual = solution.maxSubArray(cases[i]);
    recordCase("maxSubArray("+Arrays.toString(cases[i])+") -> "+expected[i], displayValue(actual), actual == expected[i]);
}
recordHidden(solution.maxSubArray(new int[]{-1,-2,-3,-4}) == -1);
recordHidden(solution.maxSubArray(new int[]{0}) == 0);
recordHidden(solution.maxSubArray(new int[]{2,-1,2}) == 3);
recordHidden(solution.maxSubArray(new int[]{-3,5,-3,5}) == 7);
finish();`,
      }),
    8: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        helpers: `static class ListNode {
    int val; ListNode next;
    ListNode(int val) { this.val = val; }
}
static ListNode buildList(int[] values, int pos) {
    if (values.length == 0) return null;
    ListNode head = new ListNode(values[0]), cur = head;
    ListNode cycleNode = pos == 0 ? head : null;
    for (int i = 1; i < values.length; i++) {
        cur.next = new ListNode(values[i]); cur = cur.next;
        if (i == pos) cycleNode = cur;
    }
    if (pos >= 0) cur.next = cycleNode;
    return head;
}`,
        runner: `Solution solution = new Solution();
int[][] vals = {{3,2,0,-4},{1,2},{1}};
int[] pos = {1,0,-1};
boolean[] expected = {true,true,false};
for (int i = 0; i < vals.length; i++) {
    boolean actual = solution.hasCycle(buildList(vals[i], pos[i]));
    recordCase("hasCycle(pos="+pos[i]+") -> "+expected[i], displayValue(actual), actual == expected[i]);
}
recordHidden(solution.hasCycle(buildList(new int[]{1,2,3}, -1)) == false);
recordHidden(solution.hasCycle(buildList(new int[]{1,2,3}, 1))  == true);
recordHidden(solution.hasCycle(buildList(new int[]{1,2,3,4,5}, 0)) == true);
recordHidden(solution.hasCycle(buildList(new int[]{5,10,15}, -1)) == false);
finish();`,
      }),
    9: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
String[][] cases = {{"anagram","nagaram"},{"rat","car"},{"listen","silent"}};
boolean[] expected = {true,false,true};
for (int i = 0; i < cases.length; i++) {
    boolean actual = solution.isAnagram(cases[i][0], cases[i][1]);
    recordCase("isAnagram(\\""+cases[i][0]+"\\", \\""+cases[i][1]+"\\") -> "+expected[i], displayValue(actual), actual == expected[i]);
}
recordHidden(solution.isAnagram("a","a") == true);
recordHidden(solution.isAnagram("ab","ba") == true);
recordHidden(solution.isAnagram("duck","luck") == false);
recordHidden(solution.isAnagram("aab","baa") == true);
finish();`,
      }),
    10: (userCode) =>
      wrapJavaCompeteSolution({
        body: normalizeJavaMethod(userCode),
        runner: `Solution solution = new Solution();
int[] inputs = {0,10,20};
int[] expected = {0,4,8};
for (int i = 0; i < inputs.length; i++) {
    int actual = solution.countPrimes(inputs[i]);
    recordCase("countPrimes("+inputs[i]+") -> "+expected[i], displayValue(actual), actual == expected[i]);
}
recordHidden(solution.countPrimes(1)   == 0);
recordHidden(solution.countPrimes(2)   == 0);
recordHidden(solution.countPrimes(3)   == 1);
recordHidden(solution.countPrimes(100) == 25);
finish();`,
      }),
  };
}

function pythonCompeteHarnesses() {
  return {
    11: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    (5, ["1","2","Fizz","4","Buzz"]),
    (15, ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]),
]
for value, expected in cases:
    actual = fizzBuzz(value)
    _duckling_record(f"fizzBuzz({value}) -> {expected}", _duckling_display(actual), actual == expected)
_duckling_record_hidden(fizzBuzz(1) == ["1"])
_duckling_record_hidden(fizzBuzz(3) == ["1","2","Fizz"])
_duckling_record_hidden(fizzBuzz(6) == ["1","2","Fizz","4","Buzz","Fizz"])
_duckling_record_hidden(fizzBuzz(9) == ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz"])
_duckling_finish()`,
      }),
    12: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [("Hello World", 3), ("DUCKLING", 2), ("rhythm", 0)]
for value, expected in cases:
    actual = countVowels(value)
    _duckling_record(f'countVowels("{value}") -> {expected}', _duckling_display(actual), actual == expected)
_duckling_record_hidden(countVowels("") == 0)
_duckling_record_hidden(countVowels("aeiou") == 5)
_duckling_record_hidden(countVowels("AEIOU") == 5)
_duckling_record_hidden(countVowels("bcdfg") == 0)
_duckling_finish()`,
      }),
    13: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    ([4,3,2,7,8,2,3,1], [2,3]),
    ([1,1,2], [1]),
    ([1], []),
]
for nums, expected in cases:
    actual = findDuplicates(nums[:])
    _duckling_record(f"findDuplicates({nums}) -> {expected}", _duckling_display(actual), sorted(actual) == expected)
_duckling_record_hidden(sorted(findDuplicates([2,2,3,4])) == [2])
_duckling_record_hidden(sorted(findDuplicates([1,2,3,4])) == [])
_duckling_record_hidden(sorted(findDuplicates([3,4,3,4])) == [3,4])
_duckling_record_hidden(sorted(findDuplicates([5,5])) == [5])
_duckling_finish()`,
      }),
    14: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(16, True), (3, False), (1, True)]
for value, expected in cases:
    actual = isPowerOfTwo(value)
    _duckling_record(f"isPowerOfTwo({value}) -> {_duckling_display(expected)}", _duckling_display(actual), actual == expected)
_duckling_record_hidden(isPowerOfTwo(0) == False)
_duckling_record_hidden(isPowerOfTwo(2) == True)
_duckling_record_hidden(isPowerOfTwo(1024) == True)
_duckling_record_hidden(isPowerOfTwo(5) == False)
_duckling_finish()`,
      }),
    15: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [("{[()]}", True), ("([)]", False), ("(()", False)]
for value, expected in cases:
    actual = isBalanced(value)
    _duckling_record(f'isBalanced("{value}") -> {_duckling_display(expected)}', _duckling_display(actual), actual == expected)
_duckling_record_hidden(isBalanced("()") == True)
_duckling_record_hidden(isBalanced("(((") == False)
_duckling_record_hidden(isBalanced("{}") == True)
_duckling_record_hidden(isBalanced("]") == False)
_duckling_finish()`,
      }),
    16: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    ([[1,2,3],[4,5,6],[7,8,9]], 25),
    ([[5]], 5),
    ([[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]], 8),
]
for value, expected in cases:
    actual = diagonalSum(value)
    _duckling_record(f"diagonalSum({value}) -> {expected}", _duckling_display(actual), actual == expected)
_duckling_record_hidden(diagonalSum([[1,0],[0,1]]) == 2)
_duckling_record_hidden(diagonalSum([[2,3],[4,5]]) == 14)
_duckling_record_hidden(diagonalSum([[0]]) == 0)
_duckling_record_hidden(diagonalSum([[1,2,3],[0,0,0],[3,2,1]]) == 8)
_duckling_finish()`,
      }),
    17: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [("cbbd", {"bb"}), ("forgeeksskeegfor", {"geeksskeeg"}), ("racecar", {"racecar"})]
for value, expected in cases:
    actual = longestPalindrome(value)
    _duckling_record(f'longestPalindrome("{value}") -> {sorted(expected)}', _duckling_display(actual), actual in expected)
_duckling_record_hidden(longestPalindrome("a") == "a")
_duckling_record_hidden(longestPalindrome("aa") == "aa")
_duckling_record_hidden(longestPalindrome("abad") in {"aba"})
_duckling_record_hidden(longestPalindrome("abba") == "abba")
_duckling_finish()`,
      }),
    18: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [(([1,5,11], 15), 3), (([1,2,5], 11), 3), (([2], 3), -1)]
for (coins, amount), expected in cases:
    actual = coinChange(coins, amount)
    _duckling_record(f"coinChange({coins}, {amount}) -> {expected}", _duckling_display(actual), actual == expected)
_duckling_record_hidden(coinChange([1], 5) == 5)
_duckling_record_hidden(coinChange([2,5], 0) == 0)
_duckling_record_hidden(coinChange([1,4,6], 8) == 2)
_duckling_record_hidden(coinChange([3], 7) == -1)
_duckling_finish()`,
      }),
    19: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    ([["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]], 3),
    ([["1","1","1"],["0","1","0"],["1","1","1"]], 1),
    ([["0","0"],["0","0"]], 0),
]
for grid, expected in cases:
    actual = numIslands([row[:] for row in grid])
    _duckling_record(f"numIslands -> {expected}", _duckling_display(actual), actual == expected)
_duckling_record_hidden(numIslands([["1"]]) == 1)
_duckling_record_hidden(numIslands([["0"]]) == 0)
_duckling_record_hidden(numIslands([["1","0"],["0","1"]]) == 2)
_duckling_record_hidden(numIslands([["1","1"],["1","0"]]) == 1)
_duckling_finish()`,
      }),
    20: (userCode) =>
      wrapPythonCompeteSolution({
        body: normalizePythonFunction(userCode),
        runner: `cases = [
    (([["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"), True),
    (([["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "SEE"), True),
    (([["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCB"), False),
]
for (board, word), expected in cases:
    actual = wordSearch([row[:] for row in board], word)
    _duckling_record(f'wordSearch board, "{word}") -> {_duckling_display(expected)}', _duckling_display(actual), actual == expected)
_duckling_record_hidden(wordSearch([["A"]], "A") == True)
_duckling_record_hidden(wordSearch([["A"]], "B") == False)
_duckling_record_hidden(wordSearch([["A","B"],["C","D"]], "AB") == True)
_duckling_record_hidden(wordSearch([["A","B"],["C","D"]], "DCAB") == True)
_duckling_finish()`,
      }),
  };
}

const JAVA_COMPETE_HARNESSES   = javaCompeteHarnesses();
const PYTHON_COMPETE_HARNESSES = pythonCompeteHarnesses();

export function buildCompeteHarness(problemId, language, sourceCode) {
  if (language === 'Java' && JAVA_COMPETE_HARNESSES[problemId]) {
    return JAVA_COMPETE_HARNESSES[problemId](sourceCode);
  }
  if (language === 'Python' && PYTHON_COMPETE_HARNESSES[problemId]) {
    return PYTHON_COMPETE_HARNESSES[problemId](sourceCode);
  }
  return null;
}

export function extractCompeteOutput(stdout) {
  if (!stdout) return null;

  const lines = stdout.split(/\r?\n/);
  let status = null;
  let message = '';
  const visibleCases = [];
  const hiddenResults = [];

  for (const line of lines) {
    if (line.startsWith('__DUCKLING_STATUS__:')) {
      status = line.replace('__DUCKLING_STATUS__:', '').trim();
      continue;
    }
    if (line.startsWith('__DUCKLING_MESSAGE__:')) {
      message = line.replace('__DUCKLING_MESSAGE__:', '').trim();
      continue;
    }
    if (line.startsWith('__DUCKLING_CASE__|')) {
      const [, expected = '', actual = '', verdict = 'X'] = line.split('|');
      visibleCases.push({
        expected: expected.replace(/\\n/g, '\n'),
        actual:   actual.replace(/\\n/g, '\n'),
        verdict,
        passed: verdict === 'OK',
      });
      continue;
    }
    if (line.startsWith('__DUCKLING_HIDDEN__|')) {
      const verdict = line.split('|')[1] ?? 'X';
      hiddenResults.push({ passed: verdict === 'OK' });
    }
  }

  if (!status) return null;

  const passedVisible = visibleCases.filter(c => c.passed).length;
  const passedHidden  = hiddenResults.filter(c => c.passed).length;
  const allPassed     = passedVisible === visibleCases.length && passedHidden === hiddenResults.length;

  return {
    status,
    message,
    allPassed,
    passedVisible,
    totalVisible: visibleCases.length,
    passedHidden,
    totalHidden: hiddenResults.length,
    visibleCases,
  };
}

const JAVA_HARNESSES = javaHarnesses();
const PYTHON_HARNESSES = pythonHarnesses();

export function buildHarness(problemId, language, sourceCode) {
  if (language === 'Java' && JAVA_HARNESSES[problemId]) {
    return JAVA_HARNESSES[problemId](sourceCode);
  }

  if (language === 'Python' && PYTHON_HARNESSES[problemId]) {
    return PYTHON_HARNESSES[problemId](sourceCode);
  }

  return null;
}

export function extractHarnessOutput(stdout) {
  if (!stdout) {
    return null;
  }

  const lines = stdout.split(/\r?\n/);
  let status = null;
  let message = '';
  const cleaned = [];
  const cases = [];

  for (const line of lines) {
    if (line.startsWith('__DUCKLING_STATUS__:')) {
      status = line.replace('__DUCKLING_STATUS__:', '').trim();
      continue;
    }

    if (line.startsWith('__DUCKLING_MESSAGE__:')) {
      message = line.replace('__DUCKLING_MESSAGE__:', '').trim();
      continue;
    }

    if (line.startsWith('__DUCKLING_CASE__|')) {
      const [, expected = '', actual = '', verdict = 'X'] = line.split('|');
      cases.push({
        expected: expected.replace(/\\n/g, '\n'),
        actual: actual.replace(/\\n/g, '\n'),
        verdict,
        passed: verdict === 'OK',
      });
      continue;
    }

    cleaned.push(line);
  }

  if (!status) {
    return null;
  }

  return {
    status,
    message,
    stdout: cleaned.join('\n').trim(),
    cases,
  };
}
