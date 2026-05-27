import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import AppNavbar from '../components/AppNavbar';
import { ALL_PROBLEMS, DIFFICULTY_COLOR } from '../data/problems';
import { getSolvedIds } from '../utils/progress';
import { readStoredUser } from '../utils/user';
import { GridCorner } from '../components/ui';

const duckAscii = "    __\n  <(o )___\n   ( ._> /\n~~~~`---'~~~~";

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8,
  background: '#080808',
  position: 'relative',
};

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
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
    <div className="grid-backdrop page-flow-enter" style={{ minHeight: '100vh', background: 'var(--bg)', color: '#fff' }}>
      <AppNavbar />
      <main style={{ width: 'min(1180px, calc(100% - 3rem))', margin: '0 auto', padding: '2rem 0 4rem' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(300px, 0.85fr)',
            gap: '1rem',
            alignItems: 'stretch',
          }}
          className="dashboard-hero-grid"
        >
          <div style={{ ...cardStyle, padding: '1.5rem', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <GridCorner position="top-left" />
            <GridCorner position="top-right" />
            <GridCorner position="bottom-left" />
            <GridCorner position="bottom-right" />
            <div>
              <pre style={{ ...mono, color: '#fa5d19', fontSize: '0.95rem', lineHeight: 1.05, margin: '0 0 1.15rem' }} aria-label="ASCII duck logo">
                {duckAscii}
              </pre>
              <div style={{ ...mono, color: '#fbe7de', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                <span style={{ color: '#fa5d19' }}>$</span> duckling home --today
              </div>
              <h1 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 'clamp(2.4rem, 5vw, 4.4rem)', lineHeight: 0.95, letterSpacing: 0, margin: 0, fontWeight: 850 }}>
                Welcome back{user?.username ? `, ${user.username.split('.')[0]}` : ''}.
              </h1>
              <p style={{ color: '#aaa', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: 620, margin: '1rem 0 0' }}>
                Pick up practice, check class work, or jump into the next problem without losing your rhythm.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Link className="hero-cta-primary glow-orange-hover" to={`/problem/${nextProblem.id}`} style={{ ...mono, display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 1.2rem', borderRadius: 8, background: '#fa5d19', color: '#fff', fontWeight: 900, textDecoration: 'none' }}>
                Continue practice
              </Link>
              <Link className="hero-cta-secondary" to="/library" style={{ ...mono, display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 1.2rem', borderRadius: 8, background: '#101010', color: '#e8e8e8', border: '1px solid rgba(255,255,255,0.14)', fontWeight: 800, textDecoration: 'none' }}>
                Browse library
              </Link>
              <Link className="hero-cta-secondary" to="/classroom" style={{ ...mono, display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 1.2rem', borderRadius: 8, background: '#101010', color: '#e8e8e8', border: '1px solid rgba(255,255,255,0.14)', fontWeight: 800, textDecoration: 'none' }}>
                Classroom
              </Link>
            </div>
          </div>

          <aside style={{ ...cardStyle, padding: '1.25rem', display: 'grid', gap: '1rem' }}>
            <GridCorner position="top-left" />
            <GridCorner position="top-right" />
            <GridCorner position="bottom-left" />
            <GridCorner position="bottom-right" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ ...mono, color: '#777', fontSize: '0.72rem', marginBottom: '0.35rem' }}>progress</div>
                <strong style={{ ...mono, color: '#fff', fontSize: '2.2rem', lineHeight: 1 }}>{percent}%</strong>
              </div>
              <div style={{ width: 88, height: 88, borderRadius: 8, border: '1px solid rgba(250,93,25,0.28)', background: 'rgba(250,93,25,0.06)', display: 'grid', placeItems: 'center' }}>
                <span style={{ ...mono, color: '#fa5d19', fontWeight: 900 }}>{solvedCount}/{ALL_PROBLEMS.length}</span>
              </div>
            </div>

            <div style={{ height: 8, borderRadius: 999, background: '#151515', overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: '#fa5d19' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              {[
                ['Easy', easySolved],
                ['Medium', mediumSolved],
                ['Hard', hardSolved],
              ].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, background: '#0d0d0d', padding: '0.75rem' }}>
                  <div style={{ ...mono, color: '#777', fontSize: '0.68rem', marginBottom: '0.35rem' }}>{label}</div>
                  <strong style={{ ...mono, color: DIFFICULTY_COLOR[label as keyof typeof DIFFICULTY_COLOR], fontSize: '1rem' }}>{value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.55fr)', gap: '1rem', marginTop: '1rem' }} className="dashboard-lower-grid">
          <div style={{ ...cardStyle }}>
            <GridCorner position="top-left" />
            <GridCorner position="top-right" />
            <GridCorner position="bottom-left" />
            <GridCorner position="bottom-right" />
            <div style={{ ...mono, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 1rem', color: '#777', fontSize: '0.75rem' }}>
              <span>next up</span>
              <span>{nextProblem.topic}</span>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                <span style={{ color: DIFFICULTY_COLOR[nextProblem.difficulty], border: `1px solid ${DIFFICULTY_COLOR[nextProblem.difficulty]}55`, borderRadius: 6, padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: 800 }}>
                  {nextProblem.difficulty}
                </span>
                <span style={{ color: '#999', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  {nextProblem.language}
                </span>
              </div>
              <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', margin: 0, fontSize: '1.65rem', lineHeight: 1.1 }}>
                {nextProblem.title}
              </h2>
              <p style={{ color: '#8b8b8b', lineHeight: 1.6, margin: '0.75rem 0 1.2rem' }}>
                A focused problem is queued up for you. Open it, run the tests, and keep the feedback loop tight.
              </p>
              <Link to={`/problem/${nextProblem.id}`} style={{ ...mono, color: '#fa5d19', fontWeight: 900, textDecoration: 'none' }}>
                open problem →
              </Link>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '1.25rem' }}>
            <GridCorner position="top-left" />
            <GridCorner position="top-right" />
            <GridCorner position="bottom-left" />
            <GridCorner position="bottom-right" />
            <div style={{ ...mono, color: '#777', fontSize: '0.75rem', marginBottom: '1rem' }}>quick actions</div>
            <div style={{ display: 'grid', gap: '0.7rem' }}>
              {[
                ['Find an easy win', '/library'],
                ['Review classroom work', '/classroom'],
                ['Account settings', '/account'],
              ].map(([label, path]) => (
                <Link key={path} to={path} style={{ ...mono, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#e8e8e8', background: '#0d0d0d', textDecoration: 'none', padding: '0 0.85rem', fontWeight: 800 }}>
                  <span>{label}</span>
                  <span style={{ color: '#fa5d19' }}>↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
