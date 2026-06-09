import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('lp-revealed'); obs.disconnect(); } },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const IconKeyboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="11" rx="2"/>
    <path d="M6 11h.01M9 11h.01M12 11h.01M15 11h.01M18 11h.01M8 14.5h8"/>
  </svg>
);
const IconLightbulb = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.686 2 6 4.462 6 7.5c0 2.054.968 3.876 2.5 5.063V14a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-1.437C17.032 11.376 18 9.554 18 7.5 18 4.462 15.314 2 12 2z"/>
    <path d="M9 18h6M10 21h4"/>
  </svg>
);
const IconGradCap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 9 12 5 2 9l10 4 10-4z"/>
    <path d="M6 11.5v4C6 17.433 8.686 19 12 19s6-1.567 6-3.5v-4"/>
    <path d="M22 9v4"/>
  </svg>
);
const IconCode = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const BLOB_CHARS = [' ', '·', '∙', '○', '◦', '+', '×', '◇'];
const BLOB_FPS = 7;
const BLOB_MS  = 1000 / BLOB_FPS;

function AsciiBlob({ cols = 22, rows = 18 }: { cols?: number; rows?: number }) {
  const preRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const buf = new Float32Array(cols * rows).fill(0);
    const nxt = new Float32Array(cols * rows).fill(0);
    let raf: number, last = 0, n = 0;
    function tick(ts: number) {
      raf = requestAnimationFrame(tick);
      if (ts - last < BLOB_MS) return;
      last = ts; n++;
      if (n % 13 === 0) {
        const cx = 1 + Math.floor(Math.random() * (cols - 2));
        const cy = 1 + Math.floor(Math.random() * (rows - 2));
        const r  = 1 + Math.floor(Math.random() * 3);
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++)
            if (dx*dx + dy*dy <= r*r + 1) {
              const nx = cx+dx, ny = cy+dy;
              if (nx>=0 && nx<cols && ny>=0 && ny<rows)
                buf[ny*cols+nx] = Math.min(1, buf[ny*cols+nx] + 0.8 + Math.random()*0.2);
            }
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let best = buf[y*cols+x];
          if (y > 0)      best = Math.max(best, buf[(y-1)*cols+x]);
          if (y < rows-1) best = Math.max(best, buf[(y+1)*cols+x]);
          if (x > 0)      best = Math.max(best, buf[y*cols+(x-1)]);
          if (x < cols-1) best = Math.max(best, buf[y*cols+(x+1)]);
          nxt[y*cols+x] = Math.max(0, best - 0.022 - Math.random()*0.004);
        }
      }
      buf.set(nxt);
      let html = '';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v = buf[y*cols+x];
          if (v < 0.02) { html += '&nbsp;'; continue; }
          const ci = Math.min(Math.floor(v * (BLOB_CHARS.length - 1)), BLOB_CHARS.length - 1);
          const op = Math.min(0.45, v * 0.52).toFixed(3);
          html += `<span style="opacity:${op}">${BLOB_CHARS[ci]}</span>`;
        }
        if (y < rows - 1) html += '\n';
      }
      if (preRef.current) preRef.current.innerHTML = html;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cols, rows]);
  return <pre ref={preRef} className="lp-ascii" aria-hidden="true" />;
}

type ShapeItem = { type: 'ring' | 'square'; size: number; style: CSSProperties };
function BgShapes({ items }: { items: ShapeItem[] }) {
  return (
    <div className="lp-shapes" aria-hidden="true">
      {items.map((s, i) => (
        <div key={i} className={`lp-shape lp-shape--${s.type}`} style={{ width: s.size, height: s.size, ...s.style }} />
      ))}
    </div>
  );
}

const STARTER_CODE = `# Edit and run — real Python!
def two_sum(nums, target):
    seen = {}
    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i

print(two_sum([2, 7, 11, 15], 9))
print("Hello from ducklings!")`;

const MAX_LINES = 10;

function InteractiveEditor() {
  const [code, setCode] = useState(STARTER_CODE);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCount = code.split('\n').length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.split('\n').length <= MAX_LINES) setCode(e.target.value);
  };

  const runCode = useCallback(async () => {
    setRunning(true);
    setOutput('running…');
    try {
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python', version: '3.10.0',
          files: [{ content: code }],
          run_timeout: 5000, run_memory_limit: 32000000,
        }),
      });
      const data = await res.json();
      const out = (data.run?.stdout || '') + (data.run?.stderr || '');
      setOutput(out.trim() || '(no output)');
    } catch {
      setOutput('⚠ Could not reach runtime — check your connection');
    }
    setRunning(false);
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runCode(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget, s = el.selectionStart, end = el.selectionEnd;
      const next = code.slice(0, s) + '    ' + code.slice(end);
      if (next.split('\n').length <= MAX_LINES) {
        setCode(next);
        requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
      }
    }
  };

  const isErr = output !== null && output !== 'running…' &&
    (output.includes('Error') || output.includes('Traceback') || output.startsWith('⚠'));

  return (
    <div className="lp-editor">
      <div className="lp-editor-bar">
        <div className="lp-demo-dot" style={{ background: '#ff5f57' }} />
        <div className="lp-demo-dot" style={{ background: '#febc2e' }} />
        <div className="lp-demo-dot" style={{ background: '#28c840' }} />
        <span className="lp-editor-filename">playground.py</span>
        <span className="lp-editor-linecount">{lineCount}/{MAX_LINES}</span>
        <button className={`lp-editor-run${running ? ' lp-editor-run--busy' : ''}`} onClick={runCode} disabled={running}>
          {running ? '…' : '▶ Run'}
        </button>
      </div>
      <div className="lp-editor-body">
        <div className="lp-editor-gutter">
          {code.split('\n').map((_, i) => <div key={i} className="lp-editor-linenum">{i + 1}</div>)}
        </div>
        <textarea
          ref={textareaRef}
          className="lp-editor-textarea"
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          rows={MAX_LINES}
        />
      </div>
      {output !== null && (
        <div className="lp-editor-output">
          <span className="lp-editor-output-label">▸ output</span>
          <pre className={`lp-editor-output-pre${isErr ? ' lp-editor-output-err' : ''}`}>{output}</pre>
        </div>
      )}
      <div className="lp-editor-hint-row">⌘ Enter to run · tab to indent · {MAX_LINES} lines max</div>
    </div>
  );
}

const FEATURES: { label: string; Icon: () => React.ReactElement; title: string; titleOrange: string; body: string; checks: string[] }[] = [
  {
    label: 'Smart editor', Icon: IconKeyboard,
    title: 'Real editor flow.', titleOrange: ' Full test suites, live output.',
    body: 'Syntax highlighting, test runner, and hint system in a single focused workspace. No switching tabs, no setup.',
    checks: ['Instant test feedback', 'Live error output', 'Monaco-powered editor'],
  },
  {
    label: 'Adaptive hints', Icon: IconLightbulb,
    title: 'Hints that nudge,', titleOrange: ' not spoil.',
    body: "Stuck? Get a push toward the next idea — not the answer. Build real intuition with hints calibrated to your current level.",
    checks: ['3 hint levels per problem', 'Socratic nudges', 'Never gives the full answer'],
  },
  {
    label: 'Classroom tools', Icon: IconGradCap,
    title: 'Built for teachers', titleOrange: ' and their students.',
    body: 'Assign problems to your class, track individual progress, and see exactly where students are getting stuck — all from one dashboard.',
    checks: ['Class assignment system', 'Per-student progress tracking', 'Difficulty targeting'],
  },
  {
    label: 'Languages', Icon: IconCode,
    title: 'Python and Java,', titleOrange: ' fully tested.',
    body: 'Every problem runs against a real test suite in Python 3 and Java 17. Pick the language your course uses.',
    checks: ['Python 3 runtime', 'Java 17 runtime', 'Identical test coverage'],
  },
];

const STEPS = [
  { n: '01', title: 'Choose a problem', body: 'Pick from curated topics by difficulty, or open an assignment your teacher queued up.', code: ['$ duckling problem --next', '→ arrays / two-sum  [Easy]'] },
  { n: '02', title: 'Write your solution', body: 'Code in the editor, hit run, see test output. One click gets you a nudge if you need it.', code: ['$ duckling run --test', '✓ 8/8 tests passed (0.03s)'] },
  { n: '03', title: 'Track your progress', body: 'See solved count, accuracy, and what the class is working on — all in one dashboard.', code: ['$ duckling progress --view', 'solved: 12/40   accuracy: 94%'] },
];

const HERO_SHAPES: ShapeItem[] = [
  { type: 'ring',   size: 520, style: { top: -140, left: -100, '--dur': '70s' } as CSSProperties },
  { type: 'ring',   size: 360, style: { top: '35%', right: -80, '--dur': '48s', animationDirection: 'reverse' } as CSSProperties },
  { type: 'square', size: 190, style: { bottom: '12%', left: '6%', '--dur': '34s', '--rot': '38deg' } as CSSProperties },
  { type: 'ring',   size: 820, style: { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', '--dur': '110s' } as CSSProperties },
  { type: 'square', size: 120, style: { top: '15%', right: '22%', '--dur': '26s', '--rot': '20deg' } as CSSProperties },
];

export default function Home() {
  const featRef  = useReveal();
  const stepsRef = useReveal();
  const ctaRef   = useReveal();

  return (
    <div className="lp">
      <Navbar />

      <section className="lp-hero lp-grid">
        <BgShapes items={HERO_SHAPES} />
        <div className="lp-ascii-left"><AsciiBlob rows={28} cols={20} /></div>
        <div className="lp-ascii-right"><AsciiBlob rows={28} cols={20} /></div>
        <div className="lp-rail" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <span className="lp-corner lp-corner-tl">[ arrays ]</span>
          <span className="lp-corner lp-corner-tr">[ python ]</span>
          <span className="lp-corner lp-corner-bl">[ easy ]</span>
          <span className="lp-corner lp-corner-br">[ 8/8 ✓ ]</span>
        </div>
        <span className="lp-plus" style={{ top: 110, left: '20%' }}>+</span>
        <span className="lp-plus" style={{ top: 200, right: '20%' }}>+</span>
        <span className="lp-plus" style={{ bottom: 120, left: '32%' }}>+</span>

        <div className="lp-hero-inner">
          <div className="lp-hero-left">
            <h1 className="lp-h1">
              Practice code.<br />
              <span className="lp-h1-orange">Get unstuck.</span>
            </h1>
            <p className="lp-sub">
              Short problems, useful hints, and class-ready progress tracking —
              for students who want to improve and teachers who want to see it.
            </p>
            <div className="lp-hero-btns">
              <Link to="/get-started" className="lp-btn-primary">Start Practicing <IconArrow /></Link>
              <Link to="/login" className="lp-btn-ghost">Log In</Link>
            </div>
          </div>
          <div className="lp-hero-right">
            <InteractiveEditor />
          </div>
        </div>
      </section>

      <section className="lp-logos">
        <p className="lp-logos-label">Built for courses using</p>
        <div style={{ overflow: 'hidden' }}>
          <div className="lp-marquee">
            {['Python 3','Java 17','Data Structures','Algorithms','CS 101','LeetCode-style','Test-driven','AP CS','Interview Prep','Object-Oriented','Python 3','Java 17','Data Structures','Algorithms','CS 101','LeetCode-style','Test-driven','AP CS','Interview Prep','Object-Oriented'].map((l, i) => (
              <span key={i} className="lp-marquee-item">
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#FD6D03', opacity: 0.7, display: 'inline-block', flexShrink: 0 }} />
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-grid lp-section-pos" ref={featRef} style={{ opacity: 0, transform: 'translateY(16px)', transition: 'opacity 0.55s ease, transform 0.55s ease' }}>
        <div className="lp-ascii-tr"><AsciiBlob rows={12} cols={16} /></div>
        <div className="lp-ascii-bl"><AsciiBlob rows={10} cols={14} /></div>
        <BgShapes items={[
          { type: 'ring',   size: 280, style: { top: -60, right: -60, '--dur': '55s' } as CSSProperties },
          { type: 'square', size: 140, style: { bottom: '5%', left: '2%', '--dur': '28s', '--rot': '25deg' } as CSSProperties },
        ]} />
        <div className="lp-rail" style={{ maxWidth: 1120, width: '100%', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', padding: 'clamp(3rem,6vw,5rem) 2rem 2rem' }}>
            <div className="lp-section-badge">
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FD6D03', display: 'inline-block' }} />
              Features
            </div>
            <h2 className="lp-section-h2">Everything a coding class needs.</h2>
          </div>
        </div>
        <div style={{ maxWidth: 1120, width: '100%', margin: '0 auto', borderTop: '1px solid var(--lp-border)', borderBottom: '1px solid var(--lp-border)' }}>
          <div className="lp-panel-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-panel" style={{ borderBottom: i < 2 ? '1px solid var(--lp-border)' : undefined }}>
                <div className="lp-panel-label">
                  <f.Icon />
                  {f.label}
                </div>
                <h3 className="lp-panel-h2">{f.title}<span>{f.titleOrange}</span></h3>
                <p className="lp-panel-body">{f.body}</p>
                <ul className="lp-check-list">
                  {f.checks.map(c => <li key={c}>{c}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-code-section lp-grid lp-section-pos">
        <div className="lp-ascii-bl"><AsciiBlob rows={10} cols={16} /></div>
        <div className="lp-ascii-tr"><AsciiBlob rows={8} cols={12} /></div>
        <div style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: 'clamp(3rem,6vw,5rem) 2rem 0', position: 'relative', zIndex: 1 }}>
          <div className="lp-section-badge">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FD6D03', display: 'inline-block' }} />
            Live Demo
          </div>
          <h2 className="lp-section-h2" style={{ marginBottom: '2rem' }}>
            Fast feedback. <span>No hand-holding.</span>
          </h2>
        </div>
        <div className="lp-code-inner" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-code-left">
            <div className="lp-code-tabs">
              <div className="lp-code-tab active">Python</div>
              <div className="lp-code-tab">Java</div>
            </div>
            <div className="lp-code-body">
              {([
                ['# Two Sum — find indices of two numbers that add to target', 'comment'],
                ['from duckling import run_tests', 'orange'],
                ['', ''],
                ['def two_sum(nums, target):', 'white'],
                ['    seen = {}', 'white'],
                ['    for index, value in enumerate(nums):', 'white'],
                ['        if target - value in seen:', 'white'],
                ['            return [seen[target - value], index]', 'white'],
                ['        seen[target - value] = index', 'white'],
                ['    return []', 'white'],
                ['', ''],
                ['run_tests(two_sum)', 'orange'],
              ] as [string, string][]).map(([line, type], i) => (
                <div key={i} style={{ display: 'flex' }}>
                  <span className="lp-code-num">{i + 1}</span>
                  <span className={type === 'orange' ? 'lp-code-orange' : type === 'white' ? 'lp-code-white' : ''} style={type === 'comment' ? { color: '#444', fontStyle: 'italic' } : {}}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-code-right">
            <div style={{ background: 'var(--lp-bg)', border: '1px solid var(--lp-border)', borderRadius: 10, overflow: 'hidden' }}>
              <div className="lp-code-header">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                <span className="lp-output-label" style={{ flex: 1 }}>output.log</span>
                <span className="lp-output-ok">8/8 ✓</span>
              </div>
              <div style={{ padding: '1rem 1.25rem', fontFamily: "'Geist Mono', monospace", fontSize: '0.78rem', lineHeight: 1.8 }}>
                {([
                  { text: '$ duckling run --test two_sum.py', color: '#555' },
                  { text: 'Running test suite…', color: '#777' },
                  { text: '✓ test_empty_array (2ms)',    color: '#16a34a' },
                  { text: '✓ test_basic_case (1ms)',     color: '#16a34a' },
                  { text: '✓ test_negative_nums (1ms)',  color: '#16a34a' },
                  { text: '✓ test_duplicates (2ms)',     color: '#16a34a' },
                  { text: '✓ test_large_input (3ms)',    color: '#16a34a' },
                  { text: '✓ test_no_solution (1ms)',    color: '#16a34a' },
                  { text: '✓ test_single_pair (1ms)',    color: '#16a34a' },
                  { text: '✓ test_multiple_pairs (2ms)', color: '#16a34a' },
                  { text: '', color: '' },
                  { text: 'PASS  8/8 tests  0.03s', color: '#FD6D03', bold: true },
                ] as { text: string; color: string; bold?: boolean }[]).map(({ text, color, bold }, i) => (
                  <div key={i} style={{ color, fontWeight: bold ? 500 : 400 }}>{text || ' '}</div>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--lp-muted)', lineHeight: 1.7 }}>
              The editor runs real test suites. When tests fail, you see exactly which case broke — and a nudge toward the why, not the answer.
            </p>
            <ul className="lp-check-list">
              {['Full test suite on every submission', 'Hints that nudge — not spoil', 'Accuracy tracked across problems'].map(c => <li key={c}>{c}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="lp-steps lp-grid lp-section-pos" ref={stepsRef} style={{ opacity: 0, transform: 'translateY(16px)', transition: 'opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s' }}>
        <div className="lp-ascii-tl"><AsciiBlob rows={12} cols={16} /></div>
        <div className="lp-ascii-br"><AsciiBlob rows={10} cols={14} /></div>
        <BgShapes items={[
          { type: 'ring', size: 320, style: { bottom: -80, right: -60, '--dur': '60s' } as CSSProperties },
        ]} />
        <div className="lp-steps-inner" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-section-badge">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FD6D03', display: 'inline-block' }} />
            How it works
          </div>
          <h2 className="lp-section-h2">Focused practice, <span>classroom ready.</span></h2>
          <div className="lp-steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{s.n}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-body">{s.body}</p>
                <div className="lp-step-code">
                  {s.code.map((line, j) => (
                    <div key={j} style={{ color: j === 1 ? '#4ade80' : '#666' }}>
                      {j === 0 && <span style={{ color: '#FD6D03', fontWeight: 500 }}>$ </span>}
                      {j === 0 ? line.slice(2) : line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta lp-section-pos" ref={ctaRef} style={{ opacity: 0, transform: 'translateY(16px)', transition: 'opacity 0.55s ease 0.2s, transform 0.55s ease 0.2s' }}>
        <div className="lp-cta-ascii-l"><AsciiBlob rows={16} cols={18} /></div>
        <div className="lp-cta-ascii-r"><AsciiBlob rows={16} cols={18} /></div>
        <BgShapes items={[
          { type: 'ring',   size: 450, style: { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', '--dur': '80s' } as CSSProperties },
          { type: 'square', size: 160, style: { top: '10%', left: '8%', '--dur': '22s', '--rot': '30deg' } as CSSProperties },
        ]} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-cta-badge">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FD6D03', display: 'inline-block' }} />
            Ready to build habits?
          </div>
          <h2>Start practicing<br /><span>today.</span></h2>
          <p>Free to use. No setup. Just pick a problem and go.</p>
          <div className="lp-cta-btns">
            <Link to="/get-started" className="lp-btn-cta">Get started free <IconArrow /></Link>
            <Link to="/login" className="lp-btn-cta-ghost">Log In</Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <Link to="/" className="lp-footer-logo">
            <div className="lp-footer-logo-icon">
              <svg viewBox="0 0 1514 1514" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M862.5 304C985.616 304 1087.39 395.37 1103.71 514H1208.99C1208.67 590.681 1151.68 653.171 1080.13 656.829C1062.64 691.577 1037.08 721.561 1005.9 744.316C1092.38 781.22 1153 867.03 1153 967C1153 1100.65 1044.65 1209 911 1209H548C414.347 1209 306 1100.65 306 967C306 963.283 306.084 959.585 306.25 955.908V580.613L532.977 725.46C537.945 725.156 542.955 725 548 725H695.809C648.529 680.583 619 617.49 619 547.5C619 413.019 728.019 304 862.5 304Z"/>
              </svg>
            </div>
            ducklings.dev
          </Link>
          <div className="lp-footer-links">
            {[['Library', '/library'], ['Log In', '/login'], ['Register', '/register']].map(([l, to]) => (
              <Link key={to} to={to} className="lp-footer-link">{l}</Link>
            ))}
          </div>
          <p className="lp-footer-copy">© 2025 ducklings.dev</p>
        </div>
      </footer>
    </div>
  );
}
