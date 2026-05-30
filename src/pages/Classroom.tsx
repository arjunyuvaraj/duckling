import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_PROBLEMS } from '../data/problems';
import { readStoredUser } from '../utils/user';

interface Assignment {
  id: string;
  problemId: number;
  title: string;
  instructions: string;
  createdAt: string;
}

interface ClassroomItem {
  id: string;
  name: string;
  section: string;
  code: string;
  role: 'teacher' | 'student';
  assignments: Assignment[];
}

const STORAGE_KEY = 'duckling_classrooms';

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

function defaultClasses(username: string): ClassroomItem[] {
  return [
    {
      id: 'demo-ap-csa',
      name: 'AP Computer Science A',
      section: `${username}'s workspace`,
      code: 'CSA101',
      role: 'teacher',
      assignments: [
        {
          id: 'a-recursion',
          problemId: 104,
          title: 'Recursive Digit Sum',
          instructions: 'Focus on the base case first, then trace one recursive call chain.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'a-arrays',
          problemId: 72,
          title: 'Array Statistics',
          instructions: 'Practice array traversal and return clear helper values.',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ];
}

function loadClasses(username: string): ClassroomItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = defaultClasses(username);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ClassroomItem[];
    return Array.isArray(parsed) ? parsed : defaultClasses(username);
  } catch {
    return defaultClasses(username);
  }
}

function saveClasses(classes: ClassroomItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  } catch {
    // Local classroom state is best-effort until the backend classroom API is wired back in.
  }
}

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function Classroom() {
  const user = readStoredUser();
  const username = user?.username?.split('.')[0] ?? 'student';
  const [classes, setClasses] = useState<ClassroomItem[]>(() => loadClasses(username));
  const [selectedId, setSelectedId] = useState(classes[0]?.id ?? '');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [problemId, setProblemId] = useState(String(ALL_PROBLEMS[0]?.id ?? 1));
  const [instructions, setInstructions] = useState('');
  const [message, setMessage] = useState('');

  const selected = useMemo(
    () => classes.find((item) => item.id === selectedId) ?? classes[0] ?? null,
    [classes, selectedId],
  );
  const selectedProblem = ALL_PROBLEMS.find((problem) => problem.id === Number(problemId)) ?? ALL_PROBLEMS[0];
  const packs = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const problem of ALL_PROBLEMS) {
      const key = `${problem.set} / ${problem.batch}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    return [...grouped.entries()].slice(0, 8);
  }, []);

  function commit(next: ClassroomItem[], nextMessage: string) {
    setClasses(next);
    saveClasses(next);
    setMessage(nextMessage);
  }

  function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = className.trim();
    if (!name) return;

    const created: ClassroomItem = {
      id: `class-${Date.now()}`,
      name,
      section: section.trim() || 'Duckling classroom',
      code: makeCode(),
      role: 'teacher',
      assignments: [],
    };
    const next = [created, ...classes];
    setSelectedId(created.id);
    setClassName('');
    setSection('');
    commit(next, 'Class created locally. Backend sync can attach here next.');
  }

  function joinClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    const found = classes.find((item) => item.code === code);
    if (found) {
      setSelectedId(found.id);
      setJoinCode('');
      setMessage('Class opened.');
      return;
    }

    const joined: ClassroomItem = {
      id: `joined-${Date.now()}`,
      name: `Class ${code}`,
      section: 'Joined class',
      code,
      role: 'student',
      assignments: [],
    };
    const next = [joined, ...classes];
    setSelectedId(joined.id);
    setJoinCode('');
    commit(next, 'Joined class locally.');
  }

  function assignProblem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || selected.role !== 'teacher' || !selectedProblem) return;

    const assignment: Assignment = {
      id: `assignment-${Date.now()}`,
      problemId: selectedProblem.id,
      title: selectedProblem.title,
      instructions: instructions.trim() || 'Solve the problem and run your tests before submitting.',
      createdAt: new Date().toISOString(),
    };
    const next = classes.map((item) => item.id === selected.id ? { ...item, assignments: [assignment, ...item.assignments] } : item);
    setInstructions('');
    commit(next, 'Assignment posted.');
  }

  return (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      <main style={{ width: 'min(1180px, calc(100% - 2rem))', margin: '0 auto', padding: '2rem 0 4rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ ...mono, color: '#FFA100', fontSize: '0.76rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              $ duckling classroom --sync
            </div>
            <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", color: 'var(--text-primary)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 500, margin: 0 }}>
              Classroom
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.65rem 0 0', lineHeight: 1.55 }}>
              A focused class space for assignments, practice packs, and student-friendly progress.
            </p>
          </div>
          <span style={{ ...mono, color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.08)', borderRadius: 999, padding: '0.55rem 0.8rem', fontSize: '0.72rem' }}>
            {classes.length} class{classes.length === 1 ? '' : 'es'}
          </span>
        </header>

        {message && (
          <div style={{ border: '1px solid rgba(255,161,0,0.22)', background: 'rgba(255,161,0,0.07)', color: '#FFA100', borderRadius: 8, padding: '0.75rem 0.9rem', marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '1rem', alignItems: 'start' }}>
          <aside style={{ display: 'grid', gap: '1rem' }}>
            <form onSubmit={createClass} style={panelStyle}>
              <strong style={panelTitle}>Create class</strong>
              <input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Intro CS Period 3" style={inputStyle} />
              <input value={section} onChange={(event) => setSection(event.target.value)} placeholder="Section or room" style={inputStyle} />
              <button style={primaryButton}>Create</button>
            </form>

            <form onSubmit={joinClass} style={panelStyle}>
              <strong style={panelTitle}>Join class</strong>
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="CSA101" style={{ ...inputStyle, textTransform: 'uppercase' }} />
              <button style={secondaryButton}>Join</button>
            </form>

            <div style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ ...mono, padding: '0.8rem 1rem', color: 'var(--text-subtle)', borderBottom: '1px solid var(--border)', fontSize: '0.72rem' }}>
                classes
              </div>
              {classes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid var(--border-faint)',
                    background: selected?.id === item.id ? 'rgba(255,161,0,0.08)' : 'transparent',
                    color: 'var(--text-primary)',
                    padding: '0.95rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'block', fontWeight: 800 }}>{item.name}</span>
                  <span style={{ ...mono, display: 'block', color: 'var(--text-subtle)', fontSize: '0.68rem', marginTop: '0.3rem' }}>{item.role} / {item.code}</span>
                </button>
              ))}
            </div>
          </aside>

          <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden', minHeight: 620 }}>
            {selected ? (
              <>
                <div style={{ padding: '1.4rem', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ ...mono, color: '#FFA100', fontSize: '0.72rem', marginBottom: '0.45rem' }}>{selected.role} view</div>
                    <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 'clamp(1.45rem, 3vw, 2.15rem)' }}>{selected.name}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.45rem 0 0' }}>{selected.section}</p>
                  </div>
                  <div style={{ ...mono, border: '1px solid rgba(255,161,0,0.25)', color: '#FFA100', background: 'rgba(255,161,0,0.07)', borderRadius: 8, padding: '0.65rem 0.85rem', height: 'fit-content' }}>
                    {selected.code}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: selected.role === 'teacher' ? 'minmax(0, 1fr) 320px' : '1fr', gap: '1rem', padding: '1rem' }}>
                  <div style={{ display: 'grid', gap: '0.8rem', alignContent: 'start' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
                      <Metric label="assignments" value={String(selected.assignments.length)} />
                      <Metric label="pack options" value={String(packs.length)} />
                      <Metric label="role" value={selected.role} />
                    </div>

                    <div style={panelStyle}>
                      <strong style={panelTitle}>Classwork</strong>
                      {selected.assignments.length === 0 ? (
                        <p style={{ color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5 }}>No assignments yet.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: '0.65rem' }}>
                          {selected.assignments.map((assignment) => (
                            <Link key={assignment.id} to={`/problem/${assignment.problemId}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: 8, padding: '0.85rem', display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                              <span style={{ ...mono, width: 42, height: 42, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,161,0,0.1)', color: '#FFA100', fontWeight: 900 }}>{"</>"}</span>
                              <span style={{ minWidth: 0 }}>
                                <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 850 }}>{assignment.title}</span>
                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assignment.instructions}</span>
                              </span>
                              <span style={{ ...mono, color: '#FFA100', fontSize: '0.72rem' }}>#{assignment.problemId}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {selected.role === 'teacher' && (
                    <form onSubmit={assignProblem} style={panelStyle}>
                      <strong style={panelTitle}>Post assignment</strong>
                      <select value={problemId} onChange={(event) => setProblemId(event.target.value)} style={inputStyle}>
                        {ALL_PROBLEMS.map((problem) => (
                          <option key={problem.id} value={problem.id}>#{problem.id} {problem.title}</option>
                        ))}
                      </select>
                      <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Instructions for students" style={{ ...inputStyle, minHeight: 96, paddingTop: '0.75rem', resize: 'vertical' }} />
                      <button style={primaryButton}>Post</button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div style={{ minHeight: 620, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>Create or join a class.</div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: 8, padding: '0.85rem' }}>
      <div style={{ ...mono, color: 'var(--text-subtle)', fontSize: '0.68rem', marginBottom: '0.35rem' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: 850 }}>{value}</div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--surface)',
  padding: '1rem',
  display: 'grid',
  gap: '0.75rem',
};

const panelTitle: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontWeight: 850,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  padding: '0 0.75rem',
  outline: 'none',
};

const primaryButton: React.CSSProperties = {
  minHeight: 40,
  border: '1px solid #FFA100',
  borderRadius: 8,
  background: '#FFA100',
  color: '#171100',
  fontWeight: 850,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: 'var(--surface-2)',
  color: '#FFA100',
  border: '1px solid rgba(255,161,0,0.28)',
};
