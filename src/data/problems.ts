export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Language = 'Java' | 'Python';

export interface Problem {
  id: number;
  title: string;
  difficulty: Difficulty;
  language: Language;
  topic: string;
  acceptance: number;
}

export const ALL_PROBLEMS: Problem[] = [
  // Java — 10
  { id: 1,  title: 'Two Sum',                        difficulty: 'Easy',   language: 'Java',   topic: 'Arrays',               acceptance: 78.2 },
  { id: 2,  title: 'Reverse a String',               difficulty: 'Easy',   language: 'Java',   topic: 'Strings',              acceptance: 82.4 },
  { id: 3,  title: 'Fibonacci Number',               difficulty: 'Easy',   language: 'Java',   topic: 'Recursion',            acceptance: 75.1 },
  { id: 4,  title: 'Valid Parentheses',              difficulty: 'Medium', language: 'Java',   topic: 'Stacks',               acceptance: 61.3 },
  { id: 5,  title: 'Binary Search',                  difficulty: 'Easy',   language: 'Java',   topic: 'Binary Search',        acceptance: 69.7 },
  { id: 6,  title: 'Merge Sorted Arrays',            difficulty: 'Easy',   language: 'Java',   topic: 'Arrays',               acceptance: 64.8 },
  { id: 7,  title: 'Maximum Subarray',               difficulty: 'Medium', language: 'Java',   topic: 'Dynamic Programming',  acceptance: 53.2 },
  { id: 8,  title: 'Linked List Cycle Detection',   difficulty: 'Medium', language: 'Java',   topic: 'Linked Lists',         acceptance: 57.6 },
  { id: 9,  title: 'String Anagram Check',           difficulty: 'Easy',   language: 'Java',   topic: 'Strings',              acceptance: 71.4 },
  { id: 10, title: 'Count Primes',                   difficulty: 'Medium', language: 'Java',   topic: 'Math',                 acceptance: 48.3 },
  // Python — 10
  { id: 11, title: 'FizzBuzz',                       difficulty: 'Easy',   language: 'Python', topic: 'Loops',                acceptance: 88.6 },
  { id: 12, title: 'Count Vowels',                   difficulty: 'Easy',   language: 'Python', topic: 'Strings',              acceptance: 85.2 },
  { id: 13, title: 'Find All Duplicates',            difficulty: 'Easy',   language: 'Python', topic: 'Hash Tables',          acceptance: 67.4 },
  { id: 14, title: 'Power of Two',                   difficulty: 'Easy',   language: 'Python', topic: 'Math',                 acceptance: 72.1 },
  { id: 15, title: 'Balanced Brackets',              difficulty: 'Medium', language: 'Python', topic: 'Stacks',               acceptance: 58.9 },
  { id: 16, title: 'Matrix Diagonal Sum',            difficulty: 'Easy',   language: 'Python', topic: 'Arrays',               acceptance: 74.3 },
  { id: 17, title: 'Longest Palindromic Substring',  difficulty: 'Medium', language: 'Python', topic: 'Strings',              acceptance: 52.7 },
  { id: 18, title: 'Coin Change',                    difficulty: 'Hard',   language: 'Python', topic: 'Dynamic Programming',  acceptance: 39.4 },
  { id: 19, title: 'Number of Islands',              difficulty: 'Hard',   language: 'Python', topic: 'Graph',                acceptance: 44.1 },
  { id: 20, title: 'Word Search',                    difficulty: 'Hard',   language: 'Python', topic: 'Graph',                acceptance: 41.8 },
];

export const TOPICS = ['All', ...Array.from(new Set(ALL_PROBLEMS.map(p => p.topic))).sort()];
export const DIFFICULTIES: Array<'All' | Difficulty> = ['All', 'Easy', 'Medium', 'Hard'];
export const LANGUAGES: Array<'All' | Language> = ['All', 'Java', 'Python'];

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy:   '#4ade80',
  Medium: '#FFC91A',
  Hard:   '#f87171',
};
