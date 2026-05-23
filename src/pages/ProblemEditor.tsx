import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Panel, CARD_BG, DefaultButton } from '../components/ui';
import { ALL_PROBLEMS, type Difficulty } from '../data/problems';
import { PROBLEM_DETAILS } from '../data/problemDetails';

// ─── Design tokens ────────────────────────────────────────────────────────────

const PAGE_BG  = '#141414';
const TAB_BG   = '#181818';
const PILL_CLR = '#4D4D4D';
const GAP      = 10; // px between cards

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  lineHeight: '1.6rem',
};

const TEXT: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  letterSpacing: '-0.015em',
};

const DIFF_PILL: Record<Difficulty, { bg: string; border: string; color: string }> = {
  Easy:   { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  color: '#4ade80' },
  Medium: { bg: 'rgba(255,201,26,0.1)',  border: 'rgba(255,201,26,0.25)',  color: '#FFC91A' },
  Hard:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', color: '#f87171' },
};

// ─── Shared tab bar (renders inside a card) ───────────────────────────────────

function TabBar<T extends string>({
  tabs, active, onSelect,
}: { tabs: readonly T[]; active: T; onSelect: (t: T) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end',
      height: 42, flexShrink: 0,
      background: TAB_BG,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      paddingLeft: '1rem', gap: '0.125rem',
    }}>
      {tabs.map(t => {
        const on = t === active;
        return (
          <button key={t} onClick={() => onSelect(t)} style={{
            ...TEXT, fontSize: '0.875rem', fontWeight: 500,
            color: on ? '#fff' : '#505050',
            background: 'transparent', border: 'none',
            height: 42, padding: '0 0.75rem',
            cursor: 'pointer', outline: 'none',
            borderBottom: `2px solid ${on ? '#FFC91A' : 'transparent'}`,
            marginBottom: -1,
          }}>
            {t}
          </button>
        );
      })}
    </div>
  );
}

// ─── Pill drag dividers ───────────────────────────────────────────────────────

function HPillDivider({ onMouseDown, active }: { onMouseDown: (e: React.MouseEvent) => void; active: boolean }) {
  return (
    <div style={{ width: GAP, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 4, height: 40,
          background: active ? 'rgba(255,255,255,0.55)' : PILL_CLR,
          borderRadius: '2px',
          cursor: 'col-resize',
          transition: active ? 'none' : 'background 0.15s',
          flexShrink: 0,
        }}
      />
    </div>
  );
}

function VPillDivider({ onMouseDown, active }: { onMouseDown: (e: React.MouseEvent) => void; active: boolean }) {
  return (
    <div style={{ height: GAP, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onMouseDown={onMouseDown}
        style={{
          height: 4, width: 40,
          background: active ? 'rgba(255,255,255,0.55)' : PILL_CLR,
          borderRadius: '2px',
          cursor: 'row-resize',
          transition: active ? 'none' : 'background 0.15s',
          flexShrink: 0,
        }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LEFT_TABS = ['Description', 'Hints']    as const;
const BOT_TABS  = ['Testcase', 'Test Result'] as const;

export default function ProblemEditor() {
  const { id }  = useParams<{ id: string }>();
  const problem = ALL_PROBLEMS.find(p => p.id === Number(id));
  const detail  = PROBLEM_DETAILS[Number(id)];

  const [code, setCode]           = useState(detail?.starterCode ?? '// Start coding here');
  const [output, setOutput]       = useState<string | null>(null);
  const [running, setRunning]     = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [leftTab, setLeftTab]     = useState<typeof LEFT_TABS[number]>('Description');
  const [botTab,  setBotTab]      = useState<typeof BOT_TABS[number]>('Testcase');

  const [hSplit, setHSplit]           = useState(0.44);
  const [vSplit, setVSplit]           = useState(0.60);
  const [draggingH, setDraggingH]     = useState(false);
  const [draggingV, setDraggingV]     = useState(false);

  const containerRef    = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);
  const codeRef         = useRef<HTMLTextAreaElement>(null);
  const lineNumRef      = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');

  // ── Horizontal drag ───────────────────────────────────────────────────────
  const onHMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); setDraggingH(true); }, []);

  useEffect(() => {
    if (!draggingH) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, width } = containerRef.current.getBoundingClientRect();
      setHSplit(Math.min(Math.max((e.clientX - left) / width, 0.2), 0.75));
    };
    const onUp = () => setDraggingH(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingH]);

  // ── Vertical drag ─────────────────────────────────────────────────────────
  const onVMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); setDraggingV(true); }, []);

  useEffect(() => {
    if (!draggingV) return;
    const onMove = (e: MouseEvent) => {
      if (!rightContentRef.current) return;
      const { top, height } = rightContentRef.current.getBoundingClientRect();
      setVSplit(Math.min(Math.max((e.clientY - top) / height, 0.15), 0.85));
    };
    const onUp = () => setDraggingV(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingV]);

  const syncScroll = useCallback(() => {
    if (lineNumRef.current && codeRef.current) lineNumRef.current.scrollTop = codeRef.current.scrollTop;
  }, []);

  const trackCursor = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const before = ta.value.substring(0, ta.selectionStart ?? 0);
    const ls = before.split('\n');
    setCursorPos({ line: ls.length, col: ls[ls.length - 1].length + 1 });
  }, []);

  const handleRun = () => {
    setRunning(true);
    setOutput(null);
    setBotTab('Test Result');
    setTimeout(() => { setRunning(false); setOutput(detail?.sampleOutput ?? 'Done.'); }, 1000);
  };

  if (!problem || !detail) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
        <span style={{ ...TEXT, color: '#555', fontSize: '0.95rem' }}>Problem not found.</span>
      </div>
    );
  }

  const isDragging = draggingH || draggingV;
  const pill = DIFF_PILL[problem.difficulty];

  return (
    <div style={{
      height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: PAGE_BG,
      padding: 8, gap: 8,
      overflow: 'hidden', boxSizing: 'border-box',
      cursor: draggingH ? 'col-resize' : draggingV ? 'row-resize' : undefined,
      userSelect: isDragging ? 'none' : undefined,
    }}>

      {/* ── Top bar (floats on page bg) ── */}
      <div style={{
        flexShrink: 0, height: 48,
        display: 'flex', alignItems: 'center',
        padding: '0 0.5rem', gap: '0.75rem',
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Jersey 10', sans-serif", fontSize: '1.15rem', color: '#fff', letterSpacing: '0.02em' }}>
            ducklings.dev
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <Link to="/library" style={{ textDecoration: 'none' }}>
          <DefaultButton style={{ height: 34, fontSize: '0.875rem', padding: '0 1rem', letterSpacing: '-0.01em' }}>
            Library
          </DefaultButton>
        </Link>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', flexShrink: 0, cursor: 'pointer' }} />
      </div>

      {/* ── Main split (takes all remaining height) ── */}
      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}
      >

        {/* ══ Left card — Problem ══ */}
        <Panel
          style={{
            width: `${hSplit * 100}%`, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            pointerEvents: isDragging ? 'none' : undefined,
          }}
        >
          <TabBar tabs={LEFT_TABS} active={leftTab} onSelect={setLeftTab} />

          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem 3rem' }}>
            {leftTab === 'Description' ? (
              <>
                {/* Title */}
                <h1 style={{ ...TEXT, fontWeight: 700, fontSize: '1.15rem', color: '#fff', margin: '0 0 0.875rem' }}>
                  {problem.id}. {problem.title}
                </h1>

                {/* Pill row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}>
                    {problem.difficulty}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    {problem.topic}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    {problem.language}
                  </span>
                </div>

                {/* Description */}
                <p style={{ ...TEXT, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, margin: '0 0 1.5rem' }}>
                  {detail.description}
                </p>

                {/* Note */}
                {detail.note && (
                  <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(255,201,26,0.05)', border: '1px solid rgba(255,201,26,0.12)', borderRadius: '8px' }}>
                    <p style={{ ...TEXT, fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>
                      <strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Note: </strong>{detail.note}
                    </p>
                  </div>
                )}

                {/* Example 1 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ ...TEXT, fontSize: '0.875rem', fontWeight: 700, color: '#fff', margin: '0 0 0.625rem' }}>Example 1:</p>
                  <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={{ ...MONO, fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>Input: </span>{detail.sampleInput}
                    </div>
                    <div style={{ ...MONO, fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>Output: </span>{detail.sampleOutput}
                    </div>
                    <div style={{ ...TEXT, fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginTop: '0.25rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.25)' }}>Explanation: </span>{detail.explanation}
                    </div>
                  </div>
                </div>

                {/* Constraints */}
                <div>
                  <p style={{ ...TEXT, fontSize: '0.875rem', fontWeight: 700, color: '#fff', margin: '0 0 0.625rem' }}>Constraints:</p>
                  <ul style={{ margin: 0, padding: '0 0 0 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {detail.constraints.map((c, i) => (
                      <li key={i} style={{ ...TEXT, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p style={{ ...TEXT, fontSize: '0.875rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
                No hints available yet for this problem.
              </p>
            )}
          </div>
        </Panel>

        {/* ── Horizontal pill divider ── */}
        <HPillDivider onMouseDown={onHMouseDown} active={draggingH} />

        {/* ══ Right column ══ */}
        <div
          ref={rightContentRef}
          style={{
            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: isDragging ? 'none' : undefined,
          }}
        >

          {/* ── Code editor card ── */}
          <Panel style={{ flex: vSplit * 100, display: 'flex', flexDirection: 'column', minHeight: 0, background: CARD_BG }}>

            {/* Toolbar */}
            <div style={{
              height: 46, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              padding: '0 1rem', gap: '0.75rem',
              background: TAB_BG,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                ...TEXT, fontSize: '0.875rem', fontWeight: 500, color: '#fff',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '7px', padding: '4px 10px',
              }}>
                {problem.language}
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>▾</span>
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={handleRun} disabled={running} style={{
                ...TEXT, fontSize: '0.85rem', fontWeight: 600,
                height: 30, padding: '0 1.25rem',
                background: running ? 'rgba(255,255,255,0.08)' : '#fff',
                color: running ? 'rgba(255,255,255,0.35)' : '#000',
                border: 'none', borderRadius: '7px',
                cursor: running ? 'default' : 'pointer', outline: 'none',
              }}>
                {running ? 'Running…' : 'Run'}
              </button>
            </div>

            {/* Line numbers + textarea */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
              <div ref={lineNumRef} className="no-scrollbar" style={{
                width: 48, flexShrink: 0, overflowY: 'hidden',
                paddingTop: '1rem', textAlign: 'right', paddingRight: '0.875rem',
                ...MONO, color: '#444', userSelect: 'none',
              }}>
                {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <div style={{ width: 1, flexShrink: 0, background: 'rgba(255,255,255,0.05)' }} />
              <textarea
                ref={codeRef}
                className="no-scrollbar"
                value={code}
                onChange={e => setCode(e.target.value)}
                onScroll={syncScroll}
                onClick={trackCursor}
                onKeyUp={trackCursor}
                spellCheck={false} autoComplete="off" autoCapitalize="off"
                style={{
                  flex: 1, minWidth: 0, resize: 'none',
                  border: 'none', outline: 'none',
                  background: 'transparent', color: '#e8e8e8',
                  ...MONO, padding: '1rem 1.25rem', overflowY: 'auto', tabSize: 4,
                }}
              />
            </div>

            {/* Status bar */}
            <div style={{
              height: 24, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 1rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: TAB_BG,
            }}>
              <span style={{ ...TEXT, fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Saved</span>
              <span style={{ ...TEXT, fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            </div>
          </Panel>

          {/* ── Vertical pill divider ── */}
          <VPillDivider onMouseDown={onVMouseDown} active={draggingV} />

          {/* ── Output card ── */}
          <Panel style={{ flex: (1 - vSplit) * 100, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <TabBar tabs={BOT_TABS} active={botTab} onSelect={setBotTab} />

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
              {botTab === 'Testcase' ? (
                <div>
                  <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.5rem' }}>
                    Input
                  </div>
                  <pre style={{ ...MONO, fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0 }}>
                    {detail.sampleInput}
                  </pre>
                </div>
              ) : running ? (
                <span style={{ ...TEXT, fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>Running…</span>
              ) : output ? (
                <div>
                  <div style={{ ...TEXT, fontSize: '0.95rem', fontWeight: 700, color: '#4ade80', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>
                    Accepted
                  </div>
                  <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.5rem' }}>
                    Output
                  </div>
                  <pre style={{ ...MONO, fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0 }}>
                    {output}
                  </pre>
                </div>
              ) : (
                <span style={{ ...TEXT, fontSize: '0.875rem', color: 'rgba(255,255,255,0.2)' }}>
                  Click Run to test your code.
                </span>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
