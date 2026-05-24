export interface SolvedEntry {
  code: string;
  language: string;
  solvedAt: string;
}

export function getSolvedIds(): Set<number> {
  try {
    const raw = localStorage.getItem('duckling_solved');
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

export function getSolutions(): Record<number, SolvedEntry> {
  try {
    const raw = localStorage.getItem('duckling_solutions');
    return raw ? (JSON.parse(raw) as Record<number, SolvedEntry>) : {};
  } catch {
    return {};
  }
}

export function markSolved(problemId: number, code: string, language: string): void {
  const solved = getSolvedIds();
  solved.add(problemId);
  localStorage.setItem('duckling_solved', JSON.stringify([...solved]));

  const solutions = getSolutions();
  solutions[problemId] = { code, language, solvedAt: new Date().toISOString() };
  localStorage.setItem('duckling_solutions', JSON.stringify(solutions));
}
