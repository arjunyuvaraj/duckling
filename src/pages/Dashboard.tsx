import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ALL_PROBLEMS, DIFFICULTY_COLOR } from '../data/problems';
import { getSolvedIds } from '../utils/progress';
import { readStoredUser } from '../utils/user';

export default function Dashboard() {
  useEffect(() => { window.scrollTo({ top: 0, left: 0 }); }, []);

  const user        = readStoredUser();
  const solved      = getSolvedIds();
  const solvedCount = solved.size;
  const total       = ALL_PROBLEMS.length;
  const nextProblem = ALL_PROBLEMS.find(p => !solved.has(p.id)) ?? ALL_PROBLEMS[0];
  const easySolved   = ALL_PROBLEMS.filter(p => p.difficulty === 'Easy'   && solved.has(p.id)).length;
  const mediumSolved = ALL_PROBLEMS.filter(p => p.difficulty === 'Medium' && solved.has(p.id)).length;
  const hardSolved   = ALL_PROBLEMS.filter(p => p.difficulty === 'Hard'   && solved.has(p.id)).length;
  const percent = Math.round((solvedCount / total) * 100);

  const STATS: { label: string; value: number; desc: string; color?: string }[] = [
    { label: 'SOLVED',   value: solvedCount,  desc: `of ${total} total` },
    { label: 'EASY',     value: easySolved,   desc: 'solved', color: DIFFICULTY_COLOR['Easy']   },
    { label: 'MEDIUM',   value: mediumSolved, desc: 'solved', color: DIFFICULTY_COLOR['Medium'] },
    { label: 'HARD',     value: hardSolved,   desc: 'solved', color: DIFFICULTY_COLOR['Hard']   },
  ];

  const QUICK_LINKS = [
    ['Browse library',   '/library'   ],
    ['Classroom',        '/classroom' ],
    ['Compete',          '/compete'   ],
    ['Account settings', '/account'   ],
  ] as const;

  return (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
      <main style={{ padding: '2.5rem 0 4rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 0.35rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {user?.username ? `Welcome back, ${user.username.split('.')[0]}.` : 'Welcome back.'}
          </h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Pick up where you left off, browse the library, or check class work.
          </p>
        </div>

        {/* ── Main dashboard panel — single bordered container ── */}
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'var(--surface)',
        }}>

          {/* Stats strip — full-width, 4 cells */}
          <div
            className="dashboard-stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {STATS.map(({ label, value, desc, color }, i) => (
              <div key={label} style={{
                padding: '1.25rem 1.5rem',
                borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--text-subtle)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                  fontSize: '2rem',
                  fontWeight: 400,
                  color: color ?? 'var(--text-primary)',
                  lineHeight: 1,
                  marginBottom: '0.3rem',
                }}>
                  {value}
                </div>
                <div style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.8rem',
                  color: 'var(--text-subtle)',
                }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* Hero content — 2 cols, left has right divider */}
          <div
            className="dashboard-hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.3fr) minmax(260px, 0.7fr)',
              alignItems: 'stretch',
            }}
          >
            {/* Left — next problem */}
            <div style={{
              padding: '1.75rem',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 260,
              borderRight: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: DIFFICULTY_COLOR[nextProblem.difficulty],
                    border: `1px solid ${DIFFICULTY_COLOR[nextProblem.difficulty]}44`,
                    borderRadius: 5,
                    padding: '0.18rem 0.5rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}>
                    {nextProblem.difficulty}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 5,
                    padding: '0.18rem 0.5rem',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                  }}>
                    {nextProblem.language}
                  </span>
                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: 'var(--text-subtle)',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {nextProblem.topic}
                  </span>
                </div>

                <h2 style={{
                  fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                  fontSize: 'clamp(1.3rem, 2vw, 1.65rem)',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.75rem',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}>
                  {nextProblem.title}
                </h2>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, fontSize: '0.9rem' }}>
                  A focused problem is queued up for you. Open it, run the tests, and keep the feedback loop tight.
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.5rem' }}>
                <Link
                  to={`/problem/${nextProblem.id}`}
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.875rem', fontWeight: 600,
                    color: '#fff', background: '#FFA100',
                    border: '1px solid #FFA100', borderRadius: 8,
                    padding: '0.55rem 1.2rem',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                  }}
                >
                  Continue practice
                </Link>
                <Link
                  to="/library"
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.875rem', fontWeight: 500,
                    color: 'var(--text-primary)', background: 'transparent',
                    border: '1px solid var(--border)', borderRadius: 8,
                    padding: '0.55rem 1.2rem',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                  }}
                >
                  Browse library
                </Link>
              </div>
            </div>

            {/* Right — progress + quick links */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              {/* Progress section */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Progress
                  </div>
                  <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#FFA100', fontSize: '0.85rem', fontWeight: 700 }}>
                    {percent}%
                  </strong>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden', marginBottom: '0.6rem' }}>
                  <div style={{ width: `${percent}%`, height: '100%', background: '#FFA100', borderRadius: 999 }} />
                </div>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  {solvedCount} of {total} problems solved
                </div>
              </div>

              {/* Quick links — connected list */}
              <div style={{ flex: 1 }}>
                {QUICK_LINKS.map(([label, path], i) => (
                  <Link
                    key={path}
                    to={path}
                    style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: '0.875rem', fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      height: 44,
                      color: 'var(--text-primary)',
                      background: 'transparent',
                      textDecoration: 'none',
                      padding: '0 1.5rem',
                      borderBottom: i < QUICK_LINKS.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
