import type { Language } from './problems';

export const EDITOR_LANGUAGES: Language[] = ['Java', 'Python'];

type StarterCodeMap = Record<number, Record<Language, string>>;

export const STARTER_CODE_BY_LANGUAGE: StarterCodeMap = {
  1: {
    Java: `public int[] twoSum(int[] nums, int target) {

}`,
    Python: `def twoSum(nums: list[int], target: int) -> list[int]:
    pass`,
  },
  2: {
    Java: `public void reverseString(char[] s) {

}`,
    Python: `def reverseString(s: list[str]) -> None:
    pass`,
  },
  3: {
    Java: `public int fib(int n) {

}`,
    Python: `def fib(n: int) -> int:
    pass`,
  },
  4: {
    Java: `public boolean isValid(String s) {

}`,
    Python: `def isValid(s: str) -> bool:
    pass`,
  },
  5: {
    Java: `public int search(int[] nums, int target) {

}`,
    Python: `def search(nums: list[int], target: int) -> int:
    pass`,
  },
  6: {
    Java: `public void merge(int[] nums1, int m, int[] nums2, int n) {

}`,
    Python: `def merge(nums1: list[int], m: int, nums2: list[int], n: int) -> None:
    pass`,
  },
  7: {
    Java: `public int maxSubArray(int[] nums) {

}`,
    Python: `def maxSubArray(nums: list[int]) -> int:
    pass`,
  },
  8: {
    Java: `public boolean hasCycle(ListNode head) {

}`,
    Python: `def hasCycle(head) -> bool:
    pass`,
  },
  9: {
    Java: `public boolean isAnagram(String s, String t) {

}`,
    Python: `def isAnagram(s: str, t: str) -> bool:
    pass`,
  },
  10: {
    Java: `public int countPrimes(int n) {

}`,
    Python: `def countPrimes(n: int) -> int:
    pass`,
  },
  11: {
    Java: `public List<String> fizzBuzz(int n) {

}`,
    Python: `def fizzBuzz(n: int) -> list[str]:
    result = []

    return result`,
  },
  12: {
    Java: `public int countVowels(String s) {

}`,
    Python: `def countVowels(s: str) -> int:
    pass`,
  },
  13: {
    Java: `public List<Integer> findDuplicates(int[] nums) {

}`,
    Python: `def findDuplicates(nums: list[int]) -> list[int]:
    pass`,
  },
  14: {
    Java: `public boolean isPowerOfTwo(int n) {

}`,
    Python: `def isPowerOfTwo(n: int) -> bool:
    pass`,
  },
  15: {
    Java: `public boolean isBalanced(String s) {

}`,
    Python: `def isBalanced(s: str) -> bool:
    pass`,
  },
  16: {
    Java: `public int diagonalSum(int[][] mat) {

}`,
    Python: `def diagonalSum(mat: list[list[int]]) -> int:
    pass`,
  },
  17: {
    Java: `public String longestPalindrome(String s) {

}`,
    Python: `def longestPalindrome(s: str) -> str:
    pass`,
  },
  18: {
    Java: `public int coinChange(int[] coins, int amount) {

}`,
    Python: `def coinChange(coins: list[int], amount: int) -> int:
    pass`,
  },
  19: {
    Java: `public int numIslands(char[][] grid) {

}`,
    Python: `def numIslands(grid: list[list[str]]) -> int:
    pass`,
  },
  20: {
    Java: `public boolean wordSearch(char[][] board, String word) {

}`,
    Python: `def wordSearch(board: list[list[str]], word: str) -> bool:
    pass`,
  },
};

export function getStarterCode(problemId: number, language: Language) {
  return STARTER_CODE_BY_LANGUAGE[problemId]?.[language] ?? '// Starter code unavailable.';
}
