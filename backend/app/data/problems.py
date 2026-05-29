from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Problem:
    id: int
    title: str
    difficulty: str
    language: str
    topic: str
    acceptance: float
    set: str
    batch: str
    tags: list[str]


def problem(
    id: int,
    title: str,
    difficulty: str,
    language: str,
    topic: str,
    acceptance: float,
    set: str,
    batch: str,
    tags: list[str],
) -> Problem:
    return Problem(id, title, difficulty, language, topic, acceptance, set, batch, tags)


def acceptance_for(id: int, difficulty: str) -> float:
    base = {"Easy": 82, "Medium": 63, "Hard": 44}[difficulty]
    return round(base + ((id * 7) % 17) - 8 + ((id % 10) / 10), 1)


ORIGINAL_PROBLEMS = [
    problem(1, "Two Sum", "Easy", "Java", "Arrays", 78.2, "Core Skills", "Starter Classics", ["arrays", "hash-map"]),
    problem(2, "Reverse a String", "Easy", "Java", "Strings", 82.4, "Core Skills", "Starter Classics", ["strings", "two-pointers"]),
    problem(3, "Fibonacci Number", "Easy", "Java", "Recursion", 75.1, "Core Skills", "Starter Classics", ["recursion", "math"]),
    problem(4, "Valid Parentheses", "Medium", "Java", "Stacks", 61.3, "Core Skills", "Starter Classics", ["stacks", "strings"]),
    problem(5, "Binary Search", "Easy", "Java", "Binary Search", 69.7, "Core Skills", "Starter Classics", ["binary-search"]),
    problem(6, "Merge Sorted Arrays", "Easy", "Java", "Arrays", 64.8, "Core Skills", "Starter Classics", ["arrays", "two-pointers"]),
    problem(7, "Maximum Subarray", "Medium", "Java", "Dynamic Programming", 53.2, "Algorithms Lab", "Dynamic Programming", ["dynamic-programming", "arrays"]),
    problem(8, "Linked List Cycle Detection", "Medium", "Java", "Linked Lists", 57.6, "Algorithms Lab", "Data Structures", ["linked-lists", "two-pointers"]),
    problem(9, "String Anagram Check", "Easy", "Java", "Strings", 71.4, "Core Skills", "Starter Classics", ["strings", "hash-map"]),
    problem(10, "Count Primes", "Medium", "Java", "Math", 48.3, "Algorithms Lab", "Number Theory", ["math", "sieve"]),
    problem(11, "FizzBuzz", "Easy", "Python", "Loops", 88.6, "Python Practice", "Python Fundamentals", ["python", "loops"]),
    problem(12, "Count Vowels", "Easy", "Python", "Strings", 85.2, "Python Practice", "Python Fundamentals", ["python", "strings"]),
    problem(13, "Find All Duplicates", "Easy", "Python", "Hash Tables", 67.4, "Python Practice", "Python Data Tools", ["python", "hash-map"]),
    problem(14, "Power of Two", "Easy", "Python", "Math", 72.1, "Python Practice", "Python Fundamentals", ["python", "math"]),
    problem(15, "Balanced Brackets", "Medium", "Python", "Stacks", 58.9, "Python Practice", "Python Data Tools", ["python", "stacks"]),
    problem(16, "Matrix Diagonal Sum", "Easy", "Python", "Arrays", 74.3, "Python Practice", "Python Fundamentals", ["python", "2d-arrays"]),
    problem(17, "Longest Palindromic Substring", "Medium", "Python", "Strings", 52.7, "Python Practice", "Python Data Tools", ["python", "strings"]),
    problem(18, "Coin Change", "Hard", "Python", "Dynamic Programming", 39.4, "Algorithms Lab", "Dynamic Programming", ["python", "dynamic-programming"]),
    problem(19, "Number of Islands", "Hard", "Python", "Graph", 44.1, "Algorithms Lab", "Graphs and Grids", ["python", "graphs", "dfs"]),
    problem(20, "Word Search", "Hard", "Python", "Graph", 41.8, "Algorithms Lab", "Graphs and Grids", ["python", "backtracking", "grids"]),
]


BATCHES = [
    ("Core Skills", "Warmup Logic", "Easy", "Java", "Conditionals", ["conditionals", "booleans", "warmup"], ["Leap Year Checker", "Grade Letter Converter", "Triangle Type", "Ticket Price Calculator", "Alarm Clock Rules", "Speeding Fine", "Number Sign Classifier", "Valid Date Basics"]),
    ("Core Skills", "Loop Builders", "Easy", "Java", "Loops", ["loops", "iteration", "math"], ["Sum Range", "Count Factors", "Digit Sum", "Multiplication Table", "Collatz Steps", "Perfect Number", "Armstrong Number", "Draw Number Pyramid"]),
    ("Core Skills", "Array Basics", "Easy", "Java", "Arrays", ["arrays", "traversal"], ["Average Without Extremes", "Count Evens", "Find Second Largest", "Rotate Array Right", "Array Is Sorted", "Remove Duplicates Sorted", "Move Zeroes", "Running Total"]),
    ("Core Skills", "String Gym", "Easy", "Java", "Strings", ["strings", "loops"], ["Initials Builder", "Remove Vowels", "Title Case Words", "Compress Runs", "Is Pangram", "Mirror Ends", "String Score", "License Plate Formatter"]),
    ("AP Computer Science A", "AP CSA Unit 1: Primitive Types", "Easy", "Java", "Primitive Types", ["ap-csa", "primitive-types", "expressions"], ["Minutes To Hours", "Integer Division Lab", "Temperature Converter", "Compound Interest Step", "Random Range Formula", "Pizza Slice Math", "BMI Category Calculator", "Rounding Practice"]),
    ("AP Computer Science A", "AP CSA Unit 2: Using Objects", "Easy", "Java", "Objects", ["ap-csa", "objects", "strings"], ["String Method Mixup", "Rectangle Object Math", "Student Email Formatter", "Math Class Distance", "Wrapper Parse Practice", "Book Title Cleaner", "Name Tag Builder", "Object Reference Trace"]),
    ("AP Computer Science A", "AP CSA Unit 3: Boolean Expressions", "Easy", "Java", "Conditionals", ["ap-csa", "conditionals", "booleans"], ["Can Vote", "Scholarship Eligibility", "De Morgan Practice", "Leap Day Rules", "Quadrant Finder", "Course Placement", "Password Strength Basic", "Nested If Tracer"]),
    ("AP Computer Science A", "AP CSA Unit 4: Iteration", "Medium", "Java", "Loops", ["ap-csa", "loops", "iteration"], ["AP Free Response Digits", "Count Matching Pairs", "Sentinel Sum", "Nested Loop Box", "Prime Check Loop", "String Repeater", "Find First Divisor", "Iteration Trace Table"]),
    ("AP Computer Science A", "AP CSA Unit 5: Writing Classes", "Medium", "Java", "Classes", ["ap-csa", "classes", "objects"], ["BankAccount Deposit", "Student GPA Tracker", "Scoreboard Class", "LightBulb Toggle", "Car Odometer", "Recipe Serving Scaler", "Counter Class", "Appointment Overlap"]),
    ("AP Computer Science A", "AP CSA Unit 6: Arrays", "Medium", "Java", "Arrays", ["ap-csa", "arrays"], ["Array Statistics", "Shift Left AP Style", "Longest Streak", "Mode Finder Small", "Pair Sum Exists", "Remove Below Threshold", "Merge Scores", "Array FRQ Practice"]),
    ("AP Computer Science A", "AP CSA Unit 7: ArrayList", "Medium", "Java", "ArrayList", ["ap-csa", "arraylist", "lists"], ["Filter Passing Scores", "Remove Short Words", "Insert In Order", "Playlist Deduper", "Reverse ArrayList", "Inventory Restock", "Team Roster Cleanup", "ArrayList FRQ Practice"]),
    ("AP Computer Science A", "AP CSA Unit 8: 2D Arrays", "Medium", "Java", "2D Arrays", ["ap-csa", "2d-arrays", "matrices"], ["Row Sums", "Column Max", "Checkerboard Count", "Seating Chart Lookup", "Matrix Border Sum", "Diagonal Difference", "Crop Image Grid", "2D Array FRQ Practice"]),
    ("AP Computer Science A", "AP CSA Unit 9: Inheritance", "Medium", "Java", "Inheritance", ["ap-csa", "inheritance", "oop"], ["Animal Sound Override", "Employee Payroll", "Shape Area Hierarchy", "Library Item Types", "Constructor Chain Trace", "Polymorphic Dispatch", "Vehicle Inheritance", "Inheritance FRQ Practice"]),
    ("AP Computer Science A", "AP CSA Unit 10: Recursion", "Hard", "Java", "Recursion", ["ap-csa", "recursion"], ["Recursive Digit Sum", "Recursive Binary Search", "Count Stars Recursive", "Palindrome Recursion", "Recursive Power", "String Clean Recursive", "Maze Path Count", "Recursion FRQ Practice"]),
    ("Algorithms Lab", "Searching and Sorting", "Medium", "Java", "Sorting", ["sorting", "searching"], ["Selection Sort Pass", "Insertion Sort Count", "Merge Two Sorted Lists", "Find In Rotated Array", "Lower Bound", "Sort Colors", "K Closest Scores", "Stable Sort Names"]),
    ("Algorithms Lab", "Recursion Patterns", "Medium", "Java", "Recursion", ["recursion", "backtracking"], ["Generate Parentheses Lite", "Subsets Of Small Set", "Recursive Sum Array", "Flood Fill Recursive", "Permutations Of Three", "Count Paths Grid", "Tower Moves Count", "Recursive String Decode"]),
    ("Algorithms Lab", "Dynamic Programming", "Hard", "Java", "Dynamic Programming", ["dynamic-programming", "optimization"], ["Climb Stairs Ways", "House Robber Lite", "Min Path Sum", "Longest Increasing Subsequence", "Edit Distance Lite", "Partition Equal Subset", "Unique Paths Obstacles", "Decode Ways"]),
    ("Algorithms Lab", "Graphs and Grids", "Hard", "Java", "Graph", ["graphs", "dfs", "bfs"], ["Course Schedule Lite", "Shortest Path Grid", "Count Connected Components", "Clone Graph Lite", "Rotting Oranges", "Bipartite Check", "Island Perimeter", "Word Ladder Lite"]),
    ("Python Practice", "Python Fundamentals", "Easy", "Python", "Loops", ["python", "loops", "conditionals"], ["Even Index Characters", "List Squares", "Dictionary Counts", "Tuple Swap", "Range Filter", "Nested List Flatten", "Word Length Map", "Simple Caesar Shift"]),
    ("Python Practice", "Python Data Tools", "Medium", "Python", "Hash Tables", ["python", "dict", "sets"], ["Most Common Word", "Group Anagrams", "Two Set Difference", "Invert Dictionary", "Frequency Sort", "Unique Email Count", "Shopping Cart Total", "Sparse Vector Dot"]),
    ("Python Practice", "Python Recursion and Grids", "Hard", "Python", "Recursion", ["python", "recursion", "grids"], ["Recursive List Sum", "Nested Depth", "Grid Flood Fill", "Island Sizes", "Path Exists Grid", "Backtracking Word Tiles", "Memoized Fibonacci", "Recursive Flatten"]),
]


def build_problems() -> list[Problem]:
    problems = list(ORIGINAL_PROBLEMS)
    next_id = 21
    for set_name, batch, difficulty, language, topic, tags, titles in BATCHES:
        for title in titles:
            problems.append(problem(next_id, title, difficulty, language, topic, acceptance_for(next_id, difficulty), set_name, batch, tags))
            next_id += 1
    return problems


PROBLEMS = build_problems()


def problem_to_dict(problem_item: Problem) -> dict:
    tag_list = ", ".join(problem_item.tags)
    description = (
        f'Build a solution for "{problem_item.title}", a {problem_item.topic.lower()} '
        f"practice problem from the {problem_item.batch} batch."
    )
    return {
        "id": problem_item.id,
        "title": problem_item.title,
        "difficulty": problem_item.difficulty,
        "language": problem_item.language,
        "topic": problem_item.topic,
        "acceptance": problem_item.acceptance,
        "set": problem_item.set,
        "batch": problem_item.batch,
        "tags": problem_item.tags,
        "description": description,
        "constraints": [
            f"Primary topic: {problem_item.topic}",
            f"Tags: {tag_list}",
            f"Expected level: {problem_item.difficulty}",
        ],
        "sample_input": f'input = sample case for "{problem_item.title}"',
        "sample_output": "expected result",
        "explanation": "Use the core idea from this batch, then walk through the sample step by step.",
    }


PROBLEM_DICTS = [problem_to_dict(item) for item in PROBLEMS]
