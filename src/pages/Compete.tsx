import { useState, useEffect } from 'react';

type QueueState = 'idle' | 'searching';

const MODES = [
  {
    id: '1v1',
    label: '1v1 Duel',
    desc: 'Race head-to-head against one opponent. First to solve all 3 problems wins.',
    players: '2 players',
    duration: '~20 min',
    tag: 'POPULAR',
  },
  {
    id: 'speed',
    label: 'Speed Sprint',
    desc: 'Solve as many problems as possible before the clock hits zero.',
    players: '4–8 players',
    duration: '10 min',
    tag: 'FAST',
  },
  {
    id: 'ranked',
    label: 'Ranked Match',
    desc: 'Best-of-5 format. Win matches to climb the global leaderboard.',
    players: '2 players',
    duration: '~45 min',
    tag: 'RANKED',
  },
];

const SpinnerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default function Compete() {
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [queueState, setQueueState]     = useState<QueueState>('idle');
  const [elapsed, setElapsed]           = useState(0);

  useEffect(() => {
    if (queueState !== 'searching') { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [queueState]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const mode = MODES.find(m => m.id === selectedMode)!;

  return (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
      <main style={{ padding: '2.5rem 0 4rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{
            fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 400, color: 'var(--text-primary)',
            margin: '0 0 0.35rem', lineHeight: 1.1, letterSpacing: '-0.01em',
          }}>
            Compete.
          </h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Pick a format, join the queue, and out-code your opponent.
          </p>
        </div>

        {/* ── Main panel — single bordered container ── */}
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'var(--surface)',
        }}>

          {/* Mode grid — 3 columns, landing-page step-card style */}
          <div className="compete-mode-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {MODES.map((m, i) => {
              const active = selectedMode === m.id;
              const dimmed = queueState === 'searching' && !active;
              return (
                <button
                  key={m.id}
                  onClick={() => queueState === 'idle' && setSelectedMode(m.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem',
                    textAlign: 'left',
                    background: active ? 'rgba(255,161,0,0.04)' : 'transparent',
                    border: 'none',
                    borderRight: i < MODES.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: queueState === 'idle' ? 'pointer' : 'default',
                    transition: 'background 0.15s ease, opacity 0.2s ease',
                    opacity: dimmed ? 0.3 : 1,
                    boxShadow: active ? 'inset 0 3px 0 #FFA100' : 'inset 0 3px 0 transparent',
                    position: 'relative',
                  }}
                >
                  {/* Step number — large faded, like lp-step-num */}
                  <div style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: '3.5rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    color: active ? 'rgba(255,161,0,0.2)' : 'var(--border)',
                    marginBottom: '1.25rem',
                    userSelect: 'none',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Tag badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginBottom: '0.75rem',
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: active ? '#FFA100' : 'var(--text-subtle)',
                      flexShrink: 0,
                      transition: 'background 0.15s ease',
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.65rem', fontWeight: 700,
                      color: active ? '#FFA100' : 'var(--text-subtle)',
                      letterSpacing: '0.08em',
                      transition: 'color 0.15s ease',
                    }}>
                      {m.tag}
                    </span>
                  </div>

                  {/* Mode name */}
                  <div style={{
                    fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                    fontSize: '1.15rem',
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    marginBottom: '0.6rem',
                    lineHeight: 1.2,
                  }}>
                    {m.label}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.65,
                    flex: 1,
                    marginBottom: '1.25rem',
                  }}>
                    {m.desc}
                  </div>

                  {/* Meta */}
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.72rem',
                    color: 'var(--text-subtle)',
                    display: 'flex',
                    gap: '0.5rem',
                  }}>
                    <span>{m.players}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{m.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Action bar — full-width, connected below mode grid ── */}
          {queueState === 'idle' ? (
            <div style={{
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto',
              background: 'var(--surface-2)',
            }}>
              {/* Selected mode */}
              <div style={{ padding: '1rem 1.5rem', borderRight: '1px solid var(--border)' }}>
                <div style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.68rem', fontWeight: 600,
                  color: 'var(--text-subtle)',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  marginBottom: '0.2rem',
                }}>
                  Selected
                </div>
                <div style={{
                  fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                  fontSize: '0.95rem', fontWeight: 400,
                  color: 'var(--text-primary)',
                }}>
                  {mode.label}
                </div>
              </div>

              {/* Players */}
              <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>
                  Players
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {mode.players}
                </div>
              </div>

              {/* Duration */}
              <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>
                  Duration
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {mode.duration}
                </div>
              </div>

              {/* CTA */}
              <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => setQueueState('searching')}
                  style={{
                    fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                    fontSize: '0.9rem', fontWeight: 500,
                    color: '#fff', background: '#FFA100',
                    border: '1px solid #FFA100', borderRadius: 8,
                    padding: '0.6rem 1.4rem',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'background 0.15s ease',
                  }}
                >
                  Join Queue →
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto',
              background: 'var(--surface-2)',
            }}>
              {/* Spinner */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRight: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFA100',
              }} className="animate-spin">
                <SpinnerIcon />
              </div>

              {/* Status text */}
              <div style={{ padding: '1rem 1.5rem', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                  Finding opponent
                </div>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                  {mode.label} · {mode.players}
                </div>
              </div>

              {/* Timer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderRight: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '1.25rem', fontWeight: 700,
                  color: '#FFA100', letterSpacing: '0.08em',
                }}>
                  {fmt(elapsed)}
                </span>
              </div>

              {/* Leave */}
              <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => { setQueueState('idle'); setElapsed(0); }}
                  style={{
                    fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                    fontSize: '0.9rem', fontWeight: 500,
                    color: 'var(--text-primary)', background: 'transparent',
                    border: '1px solid var(--border)', borderRadius: 8,
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  Leave Queue
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
