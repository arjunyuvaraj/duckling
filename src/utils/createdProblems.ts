import type { Difficulty, Language } from '../data/problems';
import { readStoredUser } from './user';

export type { Difficulty, Language };

export interface TestCase {
  input: string;
  expected: string;
}

export interface CreatedProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  language: Language;
  topic: string;
  tags: string[];
  description: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  explanation: string;
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

function storageKey(): string {
  const user = readStoredUser();
  return user ? `dk-created-problems:${user.id}` : 'dk-created-problems';
}

export function getCreatedProblems(): CreatedProblem[] {
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveCreatedProblem(problem: CreatedProblem): void {
  const all = getCreatedProblems();
  const idx = all.findIndex(p => p.id === problem.id);
  if (idx >= 0) { all[idx] = problem; } else { all.push(problem); }
  localStorage.setItem(storageKey(), JSON.stringify(all));
}

export function deleteCreatedProblem(id: string): void {
  const all = getCreatedProblems().filter(p => p.id !== id);
  localStorage.setItem(storageKey(), JSON.stringify(all));
}

export function genProblemId(): string {
  return `cp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyProblem(): CreatedProblem {
  return {
    id: genProblemId(),
    title: '',
    difficulty: 'Easy',
    language: 'Python',
    topic: '',
    tags: [],
    description: '',
    constraints: [''],
    sampleInput: '',
    sampleOutput: '',
    explanation: '',
    starterCode: '',
    solution: '',
    testCases: [{ input: '', expected: '' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
