import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ALL_PROBLEMS, DIFFICULTY_COLOR } from '../data/problems';
import { getSolvedIds } from '../utils/progress';
import { readStoredUser } from '../utils/user';

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  background: '#080808',
  position: 'relative',
};

export default function Dashboard() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  const user = readStoredUser();
  const solved = getSolvedIds();
  const solvedCount = solved.size;
  const nextProblem = ALL_PROBLEMS.find((problem) => !solved.has(problem.id)) ?? ALL_PROBLEMS[0];
  const easySolved = ALL_PROBLEMS.filter((problem) => problem.difficulty === 'Easy' && solved.has(problem.id)).length;
  const mediumSolved = ALL_PROBLEMS.filter((problem) => problem.difficulty === 'Medium' && solved.has(problem.id)).length;
  const hardSolved = ALL_PROBLEMS.filter((problem) => problem.difficulty === 'Hard' && solved.has(problem.id)).length;
  const percent = Math.round((solvedCount / ALL_PROBLEMS.length) * 100);

  return (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
      <main style={{ padding: '2.5rem 0 4rem' }}>

          {/* Page header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: '#fff', margin: '0 0 0.4rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {user?.username ? `Welcome back, ${user.username.split('.')[0]}.` : 'Welcome back.'}
            </h1>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: '#888', margin: 0, lineHeight: 1.5 }}>
              Pick up where you left off, browse the library, or check class work.
            </p>
          </div>

          {/* Hero grid */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
              gap: '1rem',
              alignItems: 'stretch',
            }}
            className="dashboard-hero-grid"
          >
            {/* Next problem card */}
            <div style={{ ...cardStyle, padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: DIFFICULTY_COLOR[nextProblem.difficulty],
                    border: `1px solid ${DIFFICULTY_COLOR[nextProblem.difficulty]}55`,
                    borderRadius: 6,
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}>
                    {nextProblem.difficulty}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#888',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}>
                    {nextProblem.language}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#666',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {nextProblem.topic}
                  </span>
                </div>
                <h2 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: '1.6rem', fontWeight: 400, color: '#fff', margin: '0 0 0.75rem', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                  {nextProblem.title}
                </h2>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#888', lineHeight: 1.6, margin: 0, fontSize: '0.9rem' }}>
                  A focused problem is queued up for you. Open it, run the tests, and keep the feedback loop tight.
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '1.5rem' }}>
                <Link
                  to={`/problem/${nextProblem.id}`}
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#fff',
                    background: '#FFA100',
                    border: '1px solid #FFA100',
                    borderRadius: 8,
                    padding: '0.55rem 1.2rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  Continue practice
                </Link>
                <Link
                  to="/library"
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#c8c8c8',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    padding: '0.55rem 1.2rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  Browse library
                </Link>
              </div>
            </div>

            {/* Progress card */}
            <div style={{ ...cardStyle, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: '#666', marginBottom: '0.3rem', fontWeight: 500 }}>
                    Progress
                  </div>
                  <strong style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>
                    {percent}%
                  </strong>
                </div>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 10,
                  border: '1px solid rgba(255,161,0,0.25)',
                  background: 'rgba(255,161,0,0.06)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#FFA100', fontWeight: 700, fontSize: '0.9rem' }}>
                    {solvedCount}/{ALL_PROBLEMS.length}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 999, background: '#151515', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: '#FFA100', borderRadius: 999 }} />
              </div>

              {/* Difficulty breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                {([
                  ['Easy', easySolved],
                  ['Medium', mediumSolved],
                  ['Hard', hardSolved],
                ] as const).map(([label, value]) => (
                  <div key={label} style={{
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8,
                    background: '#0d0d0d',
                    padding: '0.85rem 0.75rem',
                  }}>
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#666', fontSize: '0.75rem', marginBottom: '0.35rem', fontWeight: 500 }}>
                      {label}
                    </div>
                    <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: DIFFICULTY_COLOR[label as keyof typeof DIFFICULTY_COLOR], fontSize: '1rem' }}>
                      {value}
                    </strong>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.1rem', display: 'grid', gap: '0.55rem' }}>
                {([
                  ['Browse library', '/library'],
                  ['Classroom', '/classroom'],
                  ['Account settings', '/account'],
                ] as const).map(([label, path]) => (
                  <Link
                    key={path}
                    to={path}
                    style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: 38,
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 7,
                      color: '#c8c8c8',
                      background: '#0d0d0d',
                      textDecoration: 'none',
                      padding: '0 0.85rem',
                      transition: 'border-color 0.15s ease, color 0.15s ease',
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ color: '#FFA100', fontSize: '0.8rem' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
      </main>
    </div>
  );
}
