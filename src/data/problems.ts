export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Language = 'Java' | 'Python';

export interface Problem {
  id: number;
  title: string;
  difficulty: Difficulty;
  language: Language;
  topic: string;
  acceptance: number;
  set: string;
  batch: string;
  tags: string[];
}

interface BatchSeed {
  set: string;
  batch: string;
  difficulty: Difficulty;
  language: Language;
  topic: string;
  tags: string[];
  titles: string[];
}

function p(
  id: number,
  title: string,
  difficulty: Difficulty,
  language: Language,
  topic: string,
  acceptance: number,
  set: string,
  batch: string,
  tags: string[],
): Problem {
  return { id, title, difficulty, language, topic, acceptance, set, batch, tags };
}

function acceptanceFor(id: number, difficulty: Difficulty): number {
  const base = difficulty === 'Easy' ? 82 : difficulty === 'Medium' ? 63 : 44;
  return Number((base + ((id * 7) % 17) - 8 + ((id % 10) / 10)).toFixed(1));
}

function expandBatches(startId: number, batches: BatchSeed[]): Problem[] {
  let id = startId;
  return batches.flatMap((batch) =>
    batch.titles.map((title) => {
      const problem = p(
        id,
        title,
        batch.difficulty,
        batch.language,
        batch.topic,
        acceptanceFor(id, batch.difficulty),
        batch.set,
        batch.batch,
        batch.tags,
      );
      id += 1;
      return problem;
    }),
  );
}

const ORIGINAL_PROBLEMS: Problem[] = [
  p(1, 'Two Sum', 'Easy', 'Java', 'Arrays', 78.2, 'Core Skills', 'Starter Classics', ['arrays', 'hash-map']),
  p(2, 'Reverse a String', 'Easy', 'Java', 'Strings', 82.4, 'Core Skills', 'Starter Classics', ['strings', 'two-pointers']),
  p(3, 'Fibonacci Number', 'Easy', 'Java', 'Recursion', 75.1, 'Core Skills', 'Starter Classics', ['recursion', 'math']),
  p(4, 'Valid Parentheses', 'Medium', 'Java', 'Stacks', 61.3, 'Core Skills', 'Starter Classics', ['stacks', 'strings']),
  p(5, 'Binary Search', 'Easy', 'Java', 'Binary Search', 69.7, 'Core Skills', 'Starter Classics', ['binary-search']),
  p(6, 'Merge Sorted Arrays', 'Easy', 'Java', 'Arrays', 64.8, 'Core Skills', 'Starter Classics', ['arrays', 'two-pointers']),
  p(7, 'Maximum Subarray', 'Medium', 'Java', 'Dynamic Programming', 53.2, 'Algorithms Lab', 'Dynamic Programming', ['dynamic-programming', 'arrays']),
  p(8, 'Linked List Cycle Detection', 'Medium', 'Java', 'Linked Lists', 57.6, 'Algorithms Lab', 'Data Structures', ['linked-lists', 'two-pointers']),
  p(9, 'String Anagram Check', 'Easy', 'Java', 'Strings', 71.4, 'Core Skills', 'Starter Classics', ['strings', 'hash-map']),
  p(10, 'Count Primes', 'Medium', 'Java', 'Math', 48.3, 'Algorithms Lab', 'Number Theory', ['math', 'sieve']),
  p(11, 'FizzBuzz', 'Easy', 'Python', 'Loops', 88.6, 'Python Practice', 'Python Fundamentals', ['python', 'loops']),
  p(12, 'Count Vowels', 'Easy', 'Python', 'Strings', 85.2, 'Python Practice', 'Python Fundamentals', ['python', 'strings']),
  p(13, 'Find All Duplicates', 'Easy', 'Python', 'Hash Tables', 67.4, 'Python Practice', 'Python Data Tools', ['python', 'hash-map']),
  p(14, 'Power of Two', 'Easy', 'Python', 'Math', 72.1, 'Python Practice', 'Python Fundamentals', ['python', 'math']),
  p(15, 'Balanced Brackets', 'Medium', 'Python', 'Stacks', 58.9, 'Python Practice', 'Python Data Tools', ['python', 'stacks']),
  p(16, 'Matrix Diagonal Sum', 'Easy', 'Python', 'Arrays', 74.3, 'Python Practice', 'Python Fundamentals', ['python', '2d-arrays']),
  p(17, 'Longest Palindromic Substring', 'Medium', 'Python', 'Strings', 52.7, 'Python Practice', 'Python Data Tools', ['python', 'strings']),
  p(18, 'Coin Change', 'Hard', 'Python', 'Dynamic Programming', 39.4, 'Algorithms Lab', 'Dynamic Programming', ['python', 'dynamic-programming']),
  p(19, 'Number of Islands', 'Hard', 'Python', 'Graph', 44.1, 'Algorithms Lab', 'Graphs and Grids', ['python', 'graphs', 'dfs']),
  p(20, 'Word Search', 'Hard', 'Python', 'Graph', 41.8, 'Algorithms Lab', 'Graphs and Grids', ['python', 'backtracking', 'grids']),
];

const GENERATED_BATCHES: BatchSeed[] = [
  {
    set: 'Core Skills',
    batch: 'Warmup Logic',
    difficulty: 'Easy',
    language: 'Java',
    topic: 'Conditionals',
    tags: ['conditionals', 'booleans', 'warmup'],
    titles: ['Leap Year Checker', 'Grade Letter Converter', 'Triangle Type', 'Ticket Price Calculator', 'Alarm Clock Rules', 'Speeding Fine', 'Number Sign Classifier', 'Valid Date Basics'],
  },
  {
    set: 'Core Skills',
    batch: 'Loop Builders',
    difficulty: 'Easy',
    language: 'Java',
    topic: 'Loops',
    tags: ['loops', 'iteration', 'math'],
    titles: ['Sum Range', 'Count Factors', 'Digit Sum', 'Multiplication Table', 'Collatz Steps', 'Perfect Number', 'Armstrong Number', 'Draw Number Pyramid'],
  },
  {
    set: 'Core Skills',
    batch: 'Array Basics',
    difficulty: 'Easy',
    language: 'Java',
    topic: 'Arrays',
    tags: ['arrays', 'traversal'],
    titles: ['Average Without Extremes', 'Count Evens', 'Find Second Largest', 'Rotate Array Right', 'Array Is Sorted', 'Remove Duplicates Sorted', 'Move Zeroes', 'Running Total'],
  },
  {
    set: 'Core Skills',
    batch: 'String Gym',
    difficulty: 'Easy',
    language: 'Java',
    topic: 'Strings',
    tags: ['strings', 'loops'],
    titles: ['Initials Builder', 'Remove Vowels', 'Title Case Words', 'Compress Runs', 'Is Pangram', 'Mirror Ends', 'String Score', 'License Plate Formatter'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 1: Primitive Types',
    difficulty: 'Easy',
    language: 'Java',
    topic: 'Primitive Types',
    tags: ['ap-csa', 'primitive-types', 'expressions'],
    titles: ['Minutes To Hours', 'Integer Division Lab', 'Temperature Converter', 'Compound Interest Step', 'Random Range Formula', 'Pizza Slice Math', 'BMI Category Calculator', 'Rounding Practice'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 2: Using Objects',
    difficulty: 'Easy',
    language: 'Java',
    topic: 'Objects',
    tags: ['ap-csa', 'objects', 'strings'],
    titles: ['String Method Mixup', 'Rectangle Object Math', 'Student Email Formatter', 'Math Class Distance', 'Wrapper Parse Practice', 'Book Title Cleaner', 'Name Tag Builder', 'Object Reference Trace'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 3: Boolean Expressions',
    difficulty: 'Easy',
    language: 'Java',
    topic: 'Conditionals',
    tags: ['ap-csa', 'conditionals', 'booleans'],
    titles: ['Can Vote', 'Scholarship Eligibility', 'De Morgan Practice', 'Leap Day Rules', 'Quadrant Finder', 'Course Placement', 'Password Strength Basic', 'Nested If Tracer'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 4: Iteration',
    difficulty: 'Medium',
    language: 'Java',
    topic: 'Loops',
    tags: ['ap-csa', 'loops', 'iteration'],
    titles: ['AP Free Response Digits', 'Count Matching Pairs', 'Sentinel Sum', 'Nested Loop Box', 'Prime Check Loop', 'String Repeater', 'Find First Divisor', 'Iteration Trace Table'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 5: Writing Classes',
    difficulty: 'Medium',
    language: 'Java',
    topic: 'Classes',
    tags: ['ap-csa', 'classes', 'objects'],
    titles: ['BankAccount Deposit', 'Student GPA Tracker', 'Scoreboard Class', 'LightBulb Toggle', 'Car Odometer', 'Recipe Serving Scaler', 'Counter Class', 'Appointment Overlap'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 6: Arrays',
    difficulty: 'Medium',
    language: 'Java',
    topic: 'Arrays',
    tags: ['ap-csa', 'arrays'],
    titles: ['Array Statistics', 'Shift Left AP Style', 'Longest Streak', 'Mode Finder Small', 'Pair Sum Exists', 'Remove Below Threshold', 'Merge Scores', 'Array FRQ Practice'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 7: ArrayList',
    difficulty: 'Medium',
    language: 'Java',
    topic: 'ArrayList',
    tags: ['ap-csa', 'arraylist', 'lists'],
    titles: ['Filter Passing Scores', 'Remove Short Words', 'Insert In Order', 'Playlist Deduper', 'Reverse ArrayList', 'Inventory Restock', 'Team Roster Cleanup', 'ArrayList FRQ Practice'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 8: 2D Arrays',
    difficulty: 'Medium',
    language: 'Java',
    topic: '2D Arrays',
    tags: ['ap-csa', '2d-arrays', 'matrices'],
    titles: ['Row Sums', 'Column Max', 'Checkerboard Count', 'Seating Chart Lookup', 'Matrix Border Sum', 'Diagonal Difference', 'Crop Image Grid', '2D Array FRQ Practice'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 9: Inheritance',
    difficulty: 'Medium',
    language: 'Java',
    topic: 'Inheritance',
    tags: ['ap-csa', 'inheritance', 'oop'],
    titles: ['Animal Sound Override', 'Employee Payroll', 'Shape Area Hierarchy', 'Library Item Types', 'Constructor Chain Trace', 'Polymorphic Dispatch', 'Vehicle Inheritance', 'Inheritance FRQ Practice'],
  },
  {
    set: 'AP Computer Science A',
    batch: 'AP CSA Unit 10: Recursion',
    difficulty: 'Hard',
    language: 'Java',
    topic: 'Recursion',
    tags: ['ap-csa', 'recursion'],
    titles: ['Recursive Digit Sum', 'Recursive Binary Search', 'Count Stars Recursive', 'Palindrome Recursion', 'Recursive Power', 'String Clean Recursive', 'Maze Path Count', 'Recursion FRQ Practice'],
  },
  {
    set: 'Algorithms Lab',
    batch: 'Searching and Sorting',
    difficulty: 'Medium',
    language: 'Java',
    topic: 'Sorting',
    tags: ['sorting', 'searching'],
    titles: ['Selection Sort Pass', 'Insertion Sort Count', 'Merge Two Sorted Lists', 'Find In Rotated Array', 'Lower Bound', 'Sort Colors', 'K Closest Scores', 'Stable Sort Names'],
  },
  {
    set: 'Algorithms Lab',
    batch: 'Recursion Patterns',
    difficulty: 'Medium',
    language: 'Java',
    topic: 'Recursion',
    tags: ['recursion', 'backtracking'],
    titles: ['Generate Parentheses Lite', 'Subsets Of Small Set', 'Recursive Sum Array', 'Flood Fill Recursive', 'Permutations Of Three', 'Count Paths Grid', 'Tower Moves Count', 'Recursive String Decode'],
  },
  {
    set: 'Algorithms Lab',
    batch: 'Dynamic Programming',
    difficulty: 'Hard',
    language: 'Java',
    topic: 'Dynamic Programming',
    tags: ['dynamic-programming', 'optimization'],
    titles: ['Climb Stairs Ways', 'House Robber Lite', 'Min Path Sum', 'Longest Increasing Subsequence', 'Edit Distance Lite', 'Partition Equal Subset', 'Unique Paths Obstacles', 'Decode Ways'],
  },
  {
    set: 'Algorithms Lab',
    batch: 'Graphs and Grids',
    difficulty: 'Hard',
    language: 'Java',
    topic: 'Graph',
    tags: ['graphs', 'dfs', 'bfs'],
    titles: ['Course Schedule Lite', 'Shortest Path Grid', 'Count Connected Components', 'Clone Graph Lite', 'Rotting Oranges', 'Bipartite Check', 'Island Perimeter', 'Word Ladder Lite'],
  },
  {
    set: 'Python Practice',
    batch: 'Python Fundamentals',
    difficulty: 'Easy',
    language: 'Python',
    topic: 'Loops',
    tags: ['python', 'loops', 'conditionals'],
    titles: ['Even Index Characters', 'List Squares', 'Dictionary Counts', 'Tuple Swap', 'Range Filter', 'Nested List Flatten', 'Word Length Map', 'Simple Caesar Shift'],
  },
  {
    set: 'Python Practice',
    batch: 'Python Data Tools',
    difficulty: 'Medium',
    language: 'Python',
    topic: 'Hash Tables',
    tags: ['python', 'dict', 'sets'],
    titles: ['Most Common Word', 'Group Anagrams', 'Two Set Difference', 'Invert Dictionary', 'Frequency Sort', 'Unique Email Count', 'Shopping Cart Total', 'Sparse Vector Dot'],
  },
  {
    set: 'Python Practice',
    batch: 'Python Recursion and Grids',
    difficulty: 'Hard',
    language: 'Python',
    topic: 'Recursion',
    tags: ['python', 'recursion', 'grids'],
    titles: ['Recursive List Sum', 'Nested Depth', 'Grid Flood Fill', 'Island Sizes', 'Path Exists Grid', 'Backtracking Word Tiles', 'Memoized Fibonacci', 'Recursive Flatten'],
  },
];

export const ALL_PROBLEMS: Problem[] = [
  ...ORIGINAL_PROBLEMS,
  ...expandBatches(21, GENERATED_BATCHES),
];

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort();

export const TOPICS = ['All', ...uniqueSorted(ALL_PROBLEMS.map(p => p.topic))];
export const PROBLEM_SETS = ['All', ...uniqueSorted(ALL_PROBLEMS.map(p => p.set))];
export const BATCHES = ['All', ...uniqueSorted(ALL_PROBLEMS.map(p => p.batch))];
export const TAGS = ['All', ...uniqueSorted(ALL_PROBLEMS.flatMap(p => p.tags))];
export const DIFFICULTIES: Array<'All' | Difficulty> = ['All', 'Easy', 'Medium', 'Hard'];
export const LANGUAGES: Array<'All' | Language> = ['All', 'Java', 'Python'];

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: '#4ade80',
  Medium: '#FFC91A',
  Hard: '#f87171',
};
