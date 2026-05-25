import type { Problem } from './problems';

export interface ProblemDetail {
  description: string;
  note?: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  explanation: string;
}

export const PROBLEM_DETAILS: Record<number, ProblemDetail> = {
  1: {
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume exactly one solution exists, and you may not use the same element twice.`,
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists'],
    sampleInput: `nums = [2, 7, 11, 15]\ntarget = 9`,
    sampleOutput: `[0, 1]`,
    explanation: `nums[0] + nums[1] = 2 + 7 = 9, so the answer is [0, 1].`,
  },

  2: {
    description: `Write a function that reverses a string in place. The input string is given as an array of characters. You must do this by modifying the input array in-place with O(1) extra memory.`,
    constraints: ['1 ≤ s.length ≤ 10⁵', 's[i] is a printable ASCII character'],
    sampleInput: `s = ['h','e','l','l','o']`,
    sampleOutput: `['o','l','l','e','h']`,
    explanation: `Each character is swapped with its mirror from the opposite end, working inward.`,
  },

  3: {
    description: `Given n, compute the nth Fibonacci number. The sequence is defined as F(0) = 0, F(1) = 1, and F(n) = F(n-1) + F(n-2) for n > 1.`,
    constraints: ['0 ≤ n ≤ 30'],
    sampleInput: `n = 6`,
    sampleOutput: `8`,
    explanation: `F(6) = F(5) + F(4) = 5 + 3 = 8.`,
  },

  4: {
    description: `Given a string containing just the characters '(', ')', '{', '}', '[', and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type and in the correct order.`,
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses only'],
    sampleInput: `s = "()[]{}"`,
    sampleOutput: `true`,
    explanation: `Each opening bracket has a matching closing bracket in the correct order.`,
  },

  5: {
    description: `Given a sorted array of distinct integers and a target value, return the index of the target if found, or -1 if not present. You must implement an O(log n) algorithm.`,
    constraints: ['1 ≤ nums.length ≤ 10⁴', '-10⁴ ≤ nums[i], target ≤ 10⁴', 'nums is sorted in ascending order', 'All values in nums are unique'],
    sampleInput: `nums = [-1, 0, 3, 5, 9, 12]\ntarget = 9`,
    sampleOutput: `4`,
    explanation: `9 exists in nums at index 4, so return 4.`,
  },

  6: {
    description: `You are given two integer arrays nums1 and nums2, sorted in non-decreasing order. Merge nums2 into nums1 as one sorted array in-place. nums1 has enough space at the end to hold all elements of nums2.`,
    constraints: ['nums1.length == m + n', 'nums2.length == n', '0 ≤ m, n ≤ 200', '-10⁹ ≤ nums1[i], nums2[i] ≤ 10⁹'],
    sampleInput: `nums1 = [1,2,3,0,0,0], m = 3\nnums2 = [2,5,6],       n = 3`,
    sampleOutput: `[1, 2, 2, 3, 5, 6]`,
    explanation: `Merge from the back to avoid overwriting elements still to be processed.`,
  },

  7: {
    description: `Given an integer array nums, find the contiguous subarray (containing at least one number) that has the largest sum and return that sum.`,
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    sampleInput: `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`,
    sampleOutput: `6`,
    explanation: `The subarray [4, -1, 2, 1] has the largest sum = 6.`,
  },

  8: {
    description: `Given the head of a linked list, determine if the linked list has a cycle in it. A cycle exists if a node can be reached again by continuously following the next pointer.`,
    note: `Do not modify the linked list.`,
    constraints: ['0 ≤ number of nodes ≤ 10⁴', '-10⁵ ≤ Node.val ≤ 10⁵'],
    sampleInput: `head = [3, 2, 0, -4], pos = 1`,
    sampleOutput: `true`,
    explanation: `There is a cycle — the tail connects back to the node at index 1.`,
  },

  9: {
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram uses all the same letters as the original word but in a different order.`,
    constraints: ['1 ≤ s.length, t.length ≤ 5 × 10⁴', 's and t consist of lowercase English letters'],
    sampleInput: `s = "anagram"\nt = "nagaram"`,
    sampleOutput: `true`,
    explanation: `Both strings contain the same characters with the same frequencies.`,
  },

  10: {
    description: `Given an integer n, return the number of prime numbers that are strictly less than n. A prime number is a natural number greater than 1 with no positive divisors other than 1 and itself.`,
    constraints: ['0 ≤ n ≤ 5 × 10⁶'],
    sampleInput: `n = 10`,
    sampleOutput: `4`,
    explanation: `Primes less than 10 are 2, 3, 5, and 7 — four in total.`,
  },

  11: {
    description: `Given an integer n, return a list of strings for each number from 1 to n. For multiples of 3 output "Fizz", for multiples of 5 output "Buzz", and for multiples of both output "FizzBuzz".`,
    constraints: ['1 ≤ n ≤ 10⁴'],
    sampleInput: `n = 5`,
    sampleOutput: `["1", "2", "Fizz", "4", "Buzz"]`,
    explanation: `3 is divisible by 3 → "Fizz". 5 is divisible by 5 → "Buzz".`,
  },

  12: {
    description: `Given a string s, return the number of vowels (a, e, i, o, u) it contains, case-insensitive.`,
    constraints: ['1 ≤ s.length ≤ 10⁵', 's consists of printable ASCII characters'],
    sampleInput: `s = "Hello World"`,
    sampleOutput: `3`,
    explanation: `The vowels are 'e', 'o', and 'o' — three in total.`,
  },

  13: {
    description: `Given an integer array nums of length n where all integers are in the range [1, n], return all elements that appear twice. Try to solve this without extra space and in O(n) time.`,
    note: `Each integer in nums appears once or twice.`,
    constraints: ['n == nums.length', '1 ≤ n ≤ 10⁵', '1 ≤ nums[i] ≤ n'],
    sampleInput: `nums = [4, 3, 2, 7, 8, 2, 3, 1]`,
    sampleOutput: `[2, 3]`,
    explanation: `2 appears at indices 2 and 5. 3 appears at indices 1 and 6.`,
  },

  14: {
    description: `Given an integer n, return true if n is a power of two, otherwise return false. An integer n is a power of two if there exists an integer x such that n == 2^x.`,
    constraints: ['-2³¹ ≤ n ≤ 2³¹ - 1'],
    sampleInput: `n = 16`,
    sampleOutput: `true`,
    explanation: `16 = 2⁴, so it is a power of two.`,
  },

  15: {
    description: `Given a string containing only the characters '(', ')', '{', '}', '[', ']', determine whether the brackets are balanced. Every opening bracket must have a matching closing bracket in the correct order.`,
    constraints: ['1 ≤ s.length ≤ 10⁴'],
    sampleInput: `s = "{[()]}"`,
    sampleOutput: `True`,
    explanation: `All brackets close in the correct nested order.`,
  },

  16: {
    description: `Given a square matrix mat, return the sum of the matrix diagonals. Only count elements once if they belong to both diagonals (i.e., when the matrix dimension is odd, the center element is only counted once).`,
    constraints: ['n == mat.length == mat[i].length', '1 ≤ n ≤ 100', '1 ≤ mat[i][j] ≤ 100'],
    sampleInput: `mat = [[1,2,3],\n       [4,5,6],\n       [7,8,9]]`,
    sampleOutput: `25`,
    explanation: `Primary diagonal: 1+5+9=15. Anti-diagonal: 3+5+7=15. Center 5 counted once → 15+15-5=25.`,
  },

  17: {
    description: `Given a string s, return the longest palindromic substring in s. A palindrome reads the same forward and backward.`,
    constraints: ['1 ≤ s.length ≤ 1000', 's consists of digits and English letters'],
    sampleInput: `s = "babad"`,
    sampleOutput: `"bab"`,
    explanation: `"bab" is a valid palindromic substring (so is "aba"). Either is an acceptable answer.`,
  },

  18: {
    description: `You are given an integer array coins representing coin denominations and an integer amount. Return the fewest number of coins needed to make up that amount. If the amount cannot be made up, return -1.`,
    constraints: ['1 ≤ coins.length ≤ 12', '1 ≤ coins[i] ≤ 2³¹ - 1', '0 ≤ amount ≤ 10⁴'],
    sampleInput: `coins = [1, 5, 11]\namount = 15`,
    sampleOutput: `3`,
    explanation: `15 = 5 + 5 + 5. Three coins of denomination 5 is optimal.`,
  },

  19: {
    description: `Given an m × n grid of '1' (land) and '0' (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent land cells horizontally or vertically.`,
    constraints: ['m == grid.length', 'n == grid[i].length', '1 ≤ m, n ≤ 300', 'grid[i][j] is "0" or "1"'],
    sampleInput: `grid = [["1","1","0","0","0"],\n        ["1","1","0","0","0"],\n        ["0","0","1","0","0"],\n        ["0","0","0","1","1"]]`,
    sampleOutput: `3`,
    explanation: `There are three distinct groups of connected land cells, each forming one island.`,
  },

  20: {
    description: `Given an m × n board of characters and a string word, return true if the word exists in the grid. The word can be constructed from adjacent cells (horizontally or vertically). The same cell may not be used more than once.`,
    constraints: ['m == board.length', 'n == board[i].length', '1 ≤ m, n ≤ 6', '1 ≤ word.length ≤ 15', 'board and word consist of lowercase English letters'],
    sampleInput: `board = [["A","B","C","E"],\n         ["S","F","C","S"],\n         ["A","D","E","E"]]\nword = "ABCCED"`,
    sampleOutput: `True`,
    explanation: `The word "ABCCED" can be traced through the board following adjacent cells.`,
  },
};

function articleFor(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

export function getProblemDetail(problem: Problem): ProblemDetail {
  const existing = PROBLEM_DETAILS[problem.id];
  if (existing) return existing;

  const tagList = problem.tags.length > 0 ? problem.tags.join(', ') : problem.topic.toLowerCase();
  const article = articleFor(problem.topic);

  return {
    description: `Build a solution for "${problem.title}", ${article} ${problem.topic.toLowerCase()} practice problem from the ${problem.batch} batch. Focus on writing clear ${problem.language} code, handling edge cases, and explaining the main idea in a few sentences.`,
    note: problem.set === 'AP Computer Science A'
      ? 'This problem is part of the AP Computer Science A track and is designed to match the style of skills practiced across the College Board course units.'
      : `This problem belongs to the ${problem.set} set.`,
    constraints: [
      `Primary topic: ${problem.topic}`,
      `Tags: ${tagList}`,
      `Expected level: ${problem.difficulty}`,
      'Write a method or function with clear names and test it against small edge cases first.',
    ],
    sampleInput: problem.language === 'Java'
      ? `// Example values will depend on your method design.\ninput = sample case for "${problem.title}"`
      : `input = "sample case for ${problem.title}"`,
    sampleOutput: problem.difficulty === 'Hard' ? `optimized result` : `expected result`,
    explanation: `Use the ${problem.topic.toLowerCase()} idea from this batch, then walk through the sample step by step. A strong solution should be readable before it is clever.`,
  };
}
