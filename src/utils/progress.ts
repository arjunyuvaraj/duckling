import { readStoredUser } from './user';

export interface SolvedEntry {
  code: string;
  language: string;
  solvedAt: string;
}

function scopedKey(key: string): string {
  const user = readStoredUser();
  return user ? `${key}:${user.id}` : key;
}

export function getSolvedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(scopedKey('duckling_solved'));
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

export function getSolutions(): Record<number, SolvedEntry> {
  try {
    const raw = localStorage.getItem(scopedKey('duckling_solutions'));
    return raw ? (JSON.parse(raw) as Record<number, SolvedEntry>) : {};
  } catch {
    return {};
  }
}

export function markSolved(problemId: number, code: string, language: string): void {
  const solved = getSolvedIds();
  solved.add(problemId);
  localStorage.setItem(scopedKey('duckling_solved'), JSON.stringify([...solved]));

  const solutions = getSolutions();
  solutions[problemId] = { code, language, solvedAt: new Date().toISOString() };
  localStorage.setItem(scopedKey('duckling_solutions'), JSON.stringify(solutions));
}
