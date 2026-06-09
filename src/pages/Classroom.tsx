import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_PROBLEMS } from '../data/problems';
import { readStoredUser } from '../utils/user';
import { GridMark } from '../components/GridMark';

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
  const selectedProblem = ALL_PROBLEMS.find((p) => p.id === Number(problemId)) ?? ALL_PROBLEMS[0];
  const packs = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const p of ALL_PROBLEMS) {
      const key = `${p.set} / ${p.batch}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    return [...grouped.entries()].slice(0, 8);
  }, []);

  function commit(next: ClassroomItem[], msg: string) {
    setClasses(next);
    saveClasses(next);
    setMessage(msg);
  }

  function createClass(e: { preventDefault(): void }) {
    e.preventDefault();
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
    commit(next, 'Class created locally.');
  }

  function joinClass(e: { preventDefault(): void }) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    const found = classes.find((item) => item.code === code);
    if (found) { setSelectedId(found.id); setJoinCode(''); setMessage('Class opened.'); return; }
    const joined: ClassroomItem = {
      id: `joined-${Date.now()}`, name: `Class ${code}`,
      section: 'Joined class', code, role: 'student', assignments: [],
    };
    const next = [joined, ...classes];
    setSelectedId(joined.id);
    setJoinCode('');
    commit(next, 'Joined class locally.');
  }

  function assignProblem(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!selected || selected.role !== 'teacher' || !selectedProblem) return;
    const assignment: Assignment = {
      id: `assignment-${Date.now()}`,
      problemId: selectedProblem.id,
      title: selectedProblem.title,
      instructions: instructions.trim() || 'Solve the problem and run your tests before submitting.',
      createdAt: new Date().toISOString(),
    };
    const next = classes.map((item) =>
      item.id === selected.id ? { ...item, assignments: [assignment, ...item.assignments] } : item,
    );
    setInstructions('');
    commit(next, 'Assignment posted.');
  }

  const METRICS = [
    { label: 'assignments', value: String(selected?.assignments.length ?? 0) },
    { label: 'pack options', value: String(packs.length) },
    { label: 'role',         value: selected?.role ?? '—' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Row 1: Header ── */}
      <div style={{ padding: '2rem 1.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h1 style={{
          fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
          fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
          fontWeight: 400, color: 'var(--text-primary)',
          margin: '0 0 0.35rem', lineHeight: 1.1, letterSpacing: '-0.01em',
        }}>
          Classroom.
        </h1>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          A focused class space for assignments, practice packs, and student-friendly progress.
        </p>
      </div>

      {/* Toast */}
      {message && (
        <div style={{ borderBottom: '1px solid rgba(253,109,3,0.22)', background: 'rgba(253,109,3,0.07)', color: '#FD6D03', padding: '0.65rem 1.75rem', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem', flexShrink: 0 }}>
          {message}
        </div>
      )}

      {/* ── Row 2: Body — sidebar | main ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div className="no-scrollbar" style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Create class */}
          <form onSubmit={createClass} style={{ padding: '1.5rem 1.5rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'grid', gap: '0.55rem', flexShrink: 0 }}>
            <div style={{ ...mono, fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Create class
            </div>
            <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Intro CS Period 3" style={inputStyle} />
            <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section or room" style={inputStyle} />
            <button type="submit" style={primaryButton}>Create</button>
          </form>

          {/* Join class */}
          <form onSubmit={joinClass} style={{ padding: '1.5rem 1.5rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'grid', gap: '0.55rem', flexShrink: 0 }}>
            <div style={{ ...mono, fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              Join class
            </div>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="CSA101" style={{ ...inputStyle, textTransform: 'uppercase' }} />
            <button type="submit" style={secondaryButton}>Join</button>
          </form>

          {/* Class list header */}
          <div style={{ ...mono, padding: '0.65rem 1.5rem', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            Classes
          </div>

          {/* Class list items */}
          {classes.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{
                display: 'flex', flexDirection: 'column',
                width: '100%', padding: '1rem 1.5rem',
                border: 'none', borderBottom: '1px solid var(--border-faint)',
                background: selected?.id === item.id ? 'rgba(253,109,3,0.05)' : 'transparent',
                boxShadow: selected?.id === item.id ? 'inset 3px 0 0 #FD6D03' : 'inset 3px 0 0 transparent',
                color: 'var(--text-primary)',
                textAlign: 'left', cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
              <span style={{ ...mono, color: 'var(--text-subtle)', fontSize: '0.68rem', marginTop: '0.2rem' }}>{item.role} / {item.code}</span>
            </button>
          ))}
        </div>

        {/* ── Main content ── */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Class header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexShrink: 0 }}>
              <div>
                <div style={{ ...mono, color: '#FD6D03', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {selected.role} view
                </div>
                <h2 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", color: 'var(--text-primary)', margin: 0, fontSize: 'clamp(1.25rem, 2vw, 1.65rem)', fontWeight: 400, letterSpacing: '-0.01em' }}>
                  {selected.name}
                </h2>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-muted)', margin: '0.3rem 0 0', fontSize: '0.88rem' }}>
                  {selected.section}
                </p>
              </div>
              <div style={{ ...mono, border: '1px solid rgba(253,109,3,0.25)', color: '#FD6D03', background: 'rgba(253,109,3,0.07)', padding: '0.55rem 0.9rem', fontSize: '0.85rem', letterSpacing: '0.06em', flexShrink: 0 }}>
                {selected.code}
              </div>
            </div>

            {/* Metrics strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}>
              <GridMark cols={['33.33%', '66.67%']} />
              {METRICS.map((m, i) => (
                <div key={m.label} style={{ padding: '1rem 2rem', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ ...mono, fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {m.label}
                  </div>
                  <div style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 400 }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Content + post form */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: selected.role === 'teacher' ? 'minmax(0, 1fr) 280px' : '1fr', overflow: 'hidden' }}>

              {/* Assignments */}
              <div className="no-scrollbar" style={{ padding: '1.5rem 2rem', borderRight: selected.role === 'teacher' ? '1px solid var(--border)' : 'none', overflowY: 'auto' }}>
                <div style={{ ...mono, fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                  Classwork
                </div>
                {selected.assignments.length === 0 ? (
                  <p style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5, fontSize: '0.9rem' }}>
                    No assignments yet.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {selected.assignments.map((a) => (
                      <Link key={a.id} to={`/problem/${a.problemId}`} style={{
                        textDecoration: 'none', color: 'inherit',
                        border: '1px solid var(--border)',
                        padding: '0.85rem 1rem',
                        display: 'grid', gridTemplateColumns: '36px 1fr auto',
                        gap: '0.75rem', alignItems: 'center',
                      }}>
                        <span style={{ ...mono, width: 36, height: 36, display: 'grid', placeItems: 'center', background: 'rgba(253,109,3,0.1)', color: '#FD6D03', fontWeight: 900, fontSize: '0.7rem' }}>
                          {'</>'}
                        </span>
                        <span>
                          <span style={{ fontFamily: 'Inter, system-ui, sans-serif', display: 'block', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</span>
                          <span style={{ fontFamily: 'Inter, system-ui, sans-serif', display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.instructions}</span>
                        </span>
                        <span style={{ ...mono, color: '#FD6D03', fontSize: '0.72rem' }}>#{a.problemId}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Post assignment — teacher only */}
              {selected.role === 'teacher' && (
                <form onSubmit={assignProblem} style={{ padding: '1.5rem', display: 'grid', gap: '0.6rem', alignContent: 'start', overflowY: 'auto' }}>
                  <div style={{ ...mono, fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Post assignment
                  </div>
                  <select value={problemId} onChange={(e) => setProblemId(e.target.value)} style={inputStyle}>
                    {ALL_PROBLEMS.map((p) => (
                      <option key={p.id} value={p.id}>#{p.id} {p.title}</option>
                    ))}
                  </select>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Instructions for students"
                    style={{ ...inputStyle, minHeight: 96, paddingTop: '0.75rem', resize: 'vertical' }}
                  />
                  <button type="submit" style={primaryButton}>Post</button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem' }}>
            Create or join a class to get started.
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 40,
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  padding: '0 0.75rem',
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '0.875rem',
};

const primaryButton: React.CSSProperties = {
  minHeight: 40,
  border: '1px solid #FD6D03',
  borderRadius: 8,
  background: '#FD6D03',
  color: '#171100',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '0.875rem',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: 'transparent',
  color: '#FD6D03',
  border: '1px solid rgba(253,109,3,0.28)',
};
