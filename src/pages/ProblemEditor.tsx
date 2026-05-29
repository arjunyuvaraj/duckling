import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react';
import { Panel, CARD_BG, DefaultButton, GridCorner } from '../components/ui';
import { ALL_PROBLEMS, type Difficulty, type Language } from '../data/problems';
import { getProblemDetail } from '../data/problemDetails';
import { EDITOR_LANGUAGES, getStarterCode } from '../data/problemStarterCode';
import { readStoredUser } from '../utils/user';
import { markSolved } from '../utils/progress';
import { useTheme } from '../context/ThemeContext';

const GAP = 10;

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  lineHeight: '1.6rem',
};

const TEXT: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  letterSpacing: 0,
};

const DIFF_PILL: Record<Difficulty, { bg: string; border: string; color: string }> = {
  Easy:   { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  color: '#4ade80' },
  Medium: { bg: 'rgba(255,201,26,0.1)',  border: 'rgba(255,201,26,0.25)',  color: '#FFC91A' },
  Hard:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', color: '#f87171' },
};

const DARK_THEME_DEF = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment',         foreground: '6A9955' },
    { token: 'keyword',         foreground: 'C586C0' },
    { token: 'number',          foreground: 'B5CEA8' },
    { token: 'string',          foreground: 'CE9178' },
    { token: 'type.identifier', foreground: '4EC9B0' },
    { token: 'identifier',      foreground: 'D4D4D4' },
    { token: 'delimiter',       foreground: 'D4D4D4' },
    { token: 'operator',        foreground: 'D4D4D4' },
    { token: 'predefined',      foreground: '569CD6' },
  ],
  colors: {
    'editor.background':                   '#0f0f0f',
    'editor.foreground':                   '#e6e6e6',
    'editorLineNumber.foreground':         '#4b4b4b',
    'editorLineNumber.activeForeground':   '#FFA100',
    'editorCursor.foreground':             '#FFA100',
    'editor.selectionBackground':          '#3f1c0e',
    'editor.inactiveSelectionBackground':  '#2d1a10',
    'editorIndentGuide.background1':       '#2a2a2a',
    'editor.lineHighlightBackground':      '#151515',
    'editorBracketMatch.background':       '#3a3d41',
    'editorBracketMatch.border':           '#7a7a7a',
    'scrollbarSlider.background':          '#3f3f4660',
    'scrollbarSlider.hoverBackground':     '#52525b80',
    'scrollbarSlider.activeBackground':    '#71717a90',
  },
};

const LIGHT_THEME_DEF = {
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'comment',         foreground: '6A9955' },
    { token: 'keyword',         foreground: '0000ff' },
    { token: 'number',          foreground: '098658' },
    { token: 'string',          foreground: 'a31515' },
    { token: 'type.identifier', foreground: '267f99' },
    { token: 'identifier',      foreground: '1e1e1e' },
    { token: 'delimiter',       foreground: '1e1e1e' },
    { token: 'operator',        foreground: '1e1e1e' },
    { token: 'predefined',      foreground: '0000ff' },
  ],
  colors: {
    'editor.background':                  '#ffffff',
    'editor.foreground':                  '#1e1e1e',
    'editorLineNumber.foreground':        '#aaaaaa',
    'editorLineNumber.activeForeground':  '#FFA100',
    'editorCursor.foreground':            '#FFA100',
    'editor.selectionBackground':         '#ffd9b340',
    'editor.inactiveSelectionBackground': '#ffd9b320',
    'editorIndentGuide.background1':      '#e8e8e8',
    'editor.lineHighlightBackground':     '#f8f8f8',
    'editorBracketMatch.background':      '#e8e8e8',
    'editorBracketMatch.border':          '#bbbbbb',
    'scrollbarSlider.background':         '#c0c0c040',
    'scrollbarSlider.hoverBackground':    '#a0a0a060',
    'scrollbarSlider.activeBackground':   '#80808080',
  },
};

function TabBar<T extends string>({
  tabs, active, onSelect,
}: { tabs: readonly T[]; active: T; onSelect: (t: T) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end',
      height: 42, flexShrink: 0,
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)',
      paddingLeft: '1rem', gap: '0.125rem',
    }}>
      {tabs.map(t => {
        const on = t === active;
        return (
          <button key={t} onClick={() => onSelect(t)} style={{
            ...TEXT, fontSize: '0.875rem', fontWeight: 500,
            color: on ? 'var(--text-primary)' : 'var(--text-muted)',
            background: 'transparent', border: 'none',
            height: 42, padding: '0 0.75rem',
            cursor: 'pointer', outline: 'none',
            borderBottom: `2px solid ${on ? '#FFA100' : 'transparent'}`,
            marginBottom: -1,
          }}>
            {t}
          </button>
        );
      })}
    </div>
  );
}

function HPillDivider({ onMouseDown, active }: { onMouseDown: (e: React.MouseEvent) => void; active: boolean }) {
  return (
    <div style={{ width: GAP, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 4, height: 40,
          background: active ? 'var(--text-muted)' : 'var(--border-hover)',
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
          background: active ? 'var(--text-muted)' : 'var(--border-hover)',
          borderRadius: '2px',
          cursor: 'row-resize',
          transition: active ? 'none' : 'background 0.15s',
          flexShrink: 0,
        }}
      />
    </div>
  );
}

const LEFT_TABS = ['Description', 'Hints']    as const;
const BOT_TABS  = ['Testcase', 'Test Result'] as const;
const CODE_API_BASE_URL = import.meta.env.VITE_CODE_API_BASE_URL ?? '';

interface RunResult {
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  time: number | string | null;
  memory: number | null;
  summary: string;
  cases: Array<{
    expected: string;
    actual: string;
    verdict: string;
    passed: boolean;
  }>;
}

export default function ProblemEditor() {
  const { id }  = useParams<{ id: string }>();
  const problem = ALL_PROBLEMS.find(p => p.id === Number(id));
  const detail  = problem ? getProblemDetail(problem) : null;
  const { resolved } = useTheme();

  const storedUser = readStoredUser();
  const initials = storedUser?.username?.slice(0, 2).toUpperCase() ?? '>_';

  const [activeLanguage, setActiveLanguage] = useState<Language>(problem?.language ?? 'Java');
  const [code, setCode]           = useState(problem ? getStarterCode(problem.id, problem.language, problem) : '// Start coding here');
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [running, setRunning]     = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [leftTab, setLeftTab]     = useState<typeof LEFT_TABS[number]>('Description');
  const [botTab,  setBotTab]      = useState<typeof BOT_TABS[number]>('Testcase');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  const [hSplit, setHSplit]       = useState(0.44);
  const [vSplit, setVSplit]       = useState(0.60);
  const [draggingH, setDraggingH] = useState(false);
  const [draggingV, setDraggingV] = useState(false);

  const containerRef    = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef       = useRef<Monaco | null>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!problem) return;
    const timeout = setTimeout(() => {
      setActiveLanguage(problem.language);
      setCode(getStarterCode(problem.id, problem.language, problem));
      setRunResult(null);
    }, 0);
    return () => clearTimeout(timeout);
  }, [problem]);

  useEffect(() => {
    if (!languageMenuOpen) return;
    function onOutside(event: MouseEvent) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [languageMenuOpen]);

  // Switch Monaco theme when app theme changes
  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(
      resolved === 'light' ? 'duckling-light' : 'duckling-dark'
    );
  }, [resolved]);

  const trackCursor = useCallback(() => {
    const position = monacoEditorRef.current?.getPosition();
    if (!position) return;
    setCursorPos({ line: position.lineNumber, col: position.column });
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monacoEditorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('duckling-dark',  DARK_THEME_DEF);
    monaco.editor.defineTheme('duckling-light', LIGHT_THEME_DEF);
    monaco.editor.setTheme(resolved === 'light' ? 'duckling-light' : 'duckling-dark');

    editor.onDidChangeCursorPosition(trackCursor);
    trackCursor();
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    setBotTab('Test Result');

    try {
      const response = await fetch(`${CODE_API_BASE_URL}/api/code/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem?.id, language: activeLanguage, sourceCode: code }),
      });
      const data = (await response.json().catch(() => ({}))) as RunResult & { error?: string; ok?: boolean };

      if (!response.ok || data.ok === false) throw new Error(data.error ?? 'Code execution failed.');

      const finalResult: RunResult = {
        status: data.status, stdout: data.stdout, stderr: data.stderr,
        compileOutput: data.compileOutput, message: data.message,
        time: data.time, memory: data.memory, summary: data.summary,
        cases: data.cases ?? [],
      };
      setRunResult(finalResult);
      if (finalResult.status === 'Accepted' && problem) markSolved(problem.id, code, activeLanguage);
    } catch (error) {
      setRunResult({
        status: 'Error', stdout: '', stderr: '', compileOutput: '',
        message: error instanceof Error ? error.message : 'Code execution failed.',
        time: null, memory: null, summary: '', cases: [],
      });
    } finally {
      setRunning(false);
    }
  };

  if (!problem || !detail) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ ...TEXT, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Problem not found.</span>
      </div>
    );
  }

  const isDragging = draggingH || draggingV;
  const pill = DIFF_PILL[problem.difficulty];
  const monacoLanguage = activeLanguage === 'Java' ? 'java' : activeLanguage === 'Python' ? 'python' : 'cpp';

  return (
    <div style={{
      height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
      padding: 8, gap: 8,
      overflow: 'hidden', boxSizing: 'border-box',
      cursor: draggingH ? 'col-resize' : draggingV ? 'row-resize' : undefined,
      userSelect: isDragging ? 'none' : undefined,
    }}>

      {/* Top bar */}
      <div style={{
        flexShrink: 0, height: 48,
        display: 'flex', alignItems: 'center',
        padding: '0 0.5rem', gap: '0.75rem',
      }}>
        <Link to="/home" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: '0.92rem', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            ducklings.dev
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
          <span style={{ color: 'var(--text-subtle)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>/</span>
          <span style={{ ...MONO, color: '#FFA100', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
            solve problem-{problem.id}
          </span>
          <span style={{ ...TEXT, color: 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {problem.title}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <Link to="/library" style={{ textDecoration: 'none' }}>
          <DefaultButton style={{ height: 34, fontSize: '0.875rem', padding: '0 1rem', letterSpacing: 0 }}>
            Library
          </DefaultButton>
        </Link>
        <Link to="/account" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid rgba(255,161,0,0.45)', color: '#FFA100', display: 'grid', placeItems: 'center', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}>
            {initials}
          </div>
        </Link>
      </div>

      {/* Main split area */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left — description panel */}
        <Panel style={{
          width: `${hSplit * 100}%`, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          pointerEvents: isDragging ? 'none' : undefined,
          overflow: 'visible', position: 'relative',
        }}>
          <GridCorner position="top-left" />
          <GridCorner position="top-right" />
          <GridCorner position="bottom-left" />
          <GridCorner position="bottom-right" />
          <TabBar tabs={LEFT_TABS} active={leftTab} onSelect={setLeftTab} />

          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem 3rem' }}>
            {leftTab === 'Description' ? (
              <>
                <h1 style={{ ...TEXT, fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 0.875rem' }}>
                  {problem.id}. {problem.title}
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}>
                    {problem.difficulty}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {problem.topic}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {activeLanguage}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,161,0,0.06)', border: '1px solid rgba(255,161,0,0.18)', color: '#FFA100' }}>
                    {problem.set}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-subtle)' }}>
                    {problem.batch}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                  {problem.tags.map((tag) => (
                    <span key={tag} style={{ ...MONO, fontSize: '0.68rem', lineHeight: 1, color: 'var(--text-subtle)', padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                <p style={{ ...TEXT, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.8, margin: '0 0 1.5rem' }}>
                  {detail.description}
                </p>

                {detail.note && (
                  <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(255,201,26,0.05)', border: '1px solid rgba(255,201,26,0.15)', borderRadius: '8px' }}>
                    <p style={{ ...TEXT, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Note: </strong>{detail.note}
                    </p>
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ ...TEXT, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.625rem' }}>Example 1:</p>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-subtle)' }}>Input: </span>{detail.sampleInput}
                    </div>
                    <div style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-subtle)' }}>Output: </span>{detail.sampleOutput}
                    </div>
                    <div style={{ ...TEXT, fontSize: '0.8rem', color: 'var(--text-subtle)', lineHeight: 1.6, marginTop: '0.25rem' }}>
                      <span style={{ color: 'var(--text-subtle)' }}>Explanation: </span>{detail.explanation}
                    </div>
                  </div>
                </div>

                <div>
                  <p style={{ ...TEXT, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.625rem' }}>Constraints:</p>
                  <ul style={{ margin: 0, padding: '0 0 0 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {detail.constraints.map((c, i) => (
                      <li key={i} style={{ ...TEXT, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p style={{ ...TEXT, fontSize: '0.875rem', color: 'var(--text-subtle)', lineHeight: 1.7 }}>
                Try writing down the input shape, the return value, and one simple example before you code. The best first move is usually smaller than it feels.
              </p>
            )}
          </div>
        </Panel>

        <HPillDivider onMouseDown={onHMouseDown} active={draggingH} />

        {/* Right — editor + results */}
        <div
          ref={rightContentRef}
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: isDragging ? 'none' : undefined }}
        >
          {/* Editor panel */}
          <Panel style={{ flex: vSplit * 100, display: 'flex', flexDirection: 'column', minHeight: 0, background: CARD_BG, overflow: 'visible', position: 'relative' }}>
            <GridCorner position="top-left" />
            <GridCorner position="top-right" />
            <GridCorner position="bottom-left" />
            <GridCorner position="bottom-right" />

            {/* Editor toolbar */}
            <div style={{
              height: 46, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              padding: '0 1rem', gap: '0.75rem',
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border)',
            }}>
              <div ref={languageMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setLanguageMenuOpen(open => !open)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    ...TEXT, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)',
                    background: 'var(--surface-3)', border: '1px solid var(--border)',
                    borderRadius: '7px', padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  {activeLanguage}
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.7rem' }}>▾</span>
                </button>
                {languageMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 30,
                    minWidth: 140,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10, overflow: 'hidden',
                    boxShadow: '0 14px 28px rgba(0,0,0,0.15)',
                  }}>
                    {EDITOR_LANGUAGES.map((language) => (
                      <button
                        key={language} type="button"
                        onClick={() => { setActiveLanguage(language); setCode(getStarterCode(problem.id, language, problem)); setRunResult(null); setLanguageMenuOpen(false); }}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '0.7rem 0.85rem',
                          background: language === activeLanguage ? 'rgba(255,161,0,0.08)' : 'transparent',
                          color: language === activeLanguage ? '#FFA100' : 'var(--text-primary)',
                          border: 'none',
                          borderBottom: language === EDITOR_LANGUAGES[EDITOR_LANGUAGES.length - 1] ? 'none' : '1px solid var(--border-faint)',
                          cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600,
                        }}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={handleRun} disabled={running} style={{
                ...TEXT, fontSize: '0.85rem', fontWeight: 600,
                height: 30, padding: '0 1.25rem',
                background: running ? 'var(--surface-3)' : '#FFA100',
                color: running ? 'var(--text-subtle)' : '#fff',
                border: running ? '1px solid var(--border)' : '1px solid #FFA100',
                borderRadius: '7px',
                cursor: running ? 'default' : 'pointer', outline: 'none',
              }} className="glow-orange-hover">
                {running ? 'Running...' : 'Run tests'}
              </button>
            </div>

            {/* Monaco editor */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Editor
                height="100%"
                defaultLanguage={monacoLanguage}
                language={monacoLanguage}
                value={code}
                onChange={(value) => setCode(value ?? '')}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 15,
                  lineHeight: 28,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'off',
                  tabSize: 4,
                  insertSpaces: true,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'line',
                  bracketPairColorization: { enabled: true },
                  guides: { indentation: true, bracketPairs: true },
                  glyphMargin: false,
                  folding: false,
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                }}
              />
            </div>

            {/* Status bar */}
            <div style={{
              height: 24, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 1rem',
              borderTop: '1px solid var(--border-faint)',
              background: 'var(--surface-2)',
            }}>
              <span style={{ ...TEXT, fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Saved</span>
              <span style={{ ...TEXT, fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            </div>
          </Panel>

          <VPillDivider onMouseDown={onVMouseDown} active={draggingV} />

          {/* Bottom — test results panel */}
          <Panel style={{ flex: (1 - vSplit) * 100, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'visible', position: 'relative' }}>
            <GridCorner position="top-left" />
            <GridCorner position="top-right" />
            <GridCorner position="bottom-left" />
            <GridCorner position="bottom-right" />
            <TabBar tabs={BOT_TABS} active={botTab} onSelect={setBotTab} />

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
              {botTab === 'Testcase' ? (
                <div>
                  <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>
                    Sample case
                  </div>
                  <pre style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {detail.sampleInput}
                  </pre>
                  <p style={{ ...TEXT, fontSize: '0.8rem', color: 'var(--text-subtle)', lineHeight: 1.7, marginTop: '0.75rem' }}>
                    Run executes your method against built-in test cases on the backend. The sample above is the visible example for this problem.
                  </p>
                </div>
              ) : running ? (
                <span style={{ ...TEXT, fontSize: '0.875rem', color: 'var(--text-subtle)' }}>Running...</span>
              ) : runResult ? (
                <div>
                  <div style={{ ...TEXT, fontSize: '0.95rem', fontWeight: 700, color: runResult.status === 'Accepted' ? '#4ade80' : runResult.status === 'Error' ? '#f87171' : '#FFA100', letterSpacing: 0, marginBottom: '0.875rem' }}>
                    {runResult.status}
                  </div>
                  {(runResult.time || runResult.memory) && (
                    <div style={{ ...TEXT, fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
                      {runResult.time ? `Time: ${runResult.time}s` : null}
                      {runResult.time && runResult.memory ? ' · ' : null}
                      {runResult.memory ? `Memory: ${runResult.memory} KB` : null}
                    </div>
                  )}
                  {runResult.summary && (
                    <div style={{ ...TEXT, fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {runResult.summary}
                    </div>
                  )}
                  {runResult.message && (
                    <div style={{ ...TEXT, fontSize: '0.84rem', color: '#f0c674', marginBottom: '0.75rem' }}>
                      {runResult.message}
                    </div>
                  )}
                  {runResult.cases.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: '0.85rem' }}>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) 120px 72px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        {['Expected', 'Run', 'Check'].map((h, i) => (
                          <div key={h} style={{ ...TEXT, padding: '0.75rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                            {h}
                          </div>
                        ))}
                        <div />
                      </div>
                      {/* Table rows */}
                      {runResult.cases.map((tc, idx) => (
                        <div key={`${tc.expected}-${idx}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) 120px 72px 16px', borderBottom: idx === runResult.cases.length - 1 ? 'none' : '1px solid var(--border)', background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                          <div style={{ ...MONO, padding: '0.85rem 0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {tc.expected}
                          </div>
                          <div style={{ ...MONO, padding: '0.85rem 0.9rem', color: tc.passed ? 'var(--text-primary)' : '#f87171', borderLeft: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {tc.actual}
                          </div>
                          <div style={{ ...TEXT, padding: '0.85rem 0.9rem', color: tc.passed ? '#4ade80' : '#f87171', borderLeft: '1px solid var(--border)', fontWeight: 700 }}>
                            {tc.verdict}
                          </div>
                          <div style={{ background: tc.passed ? '#0f8b0f' : '#c41e1e' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {runResult.compileOutput && (
                      <div>
                        <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>Compile output</div>
                        <pre style={{ ...MONO, fontSize: '0.78rem', color: '#f87171', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>{runResult.compileOutput}</pre>
                      </div>
                    )}
                    {runResult.stderr && (
                      <div>
                        <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>stderr</div>
                        <pre style={{ ...MONO, fontSize: '0.78rem', color: '#f87171', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>{runResult.stderr}</pre>
                      </div>
                    )}
                    <div>
                      <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>stdout</div>
                      <pre style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-primary)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>{runResult.stdout || runResult.summary || 'No output.'}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <span style={{ ...TEXT, fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
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
