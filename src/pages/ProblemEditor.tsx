import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Panel, CARD_BG, DefaultButton } from '../components/ui';
import { ALL_PROBLEMS, type Difficulty, type Language } from '../data/problems';
import { PROBLEM_DETAILS } from '../data/problemDetails';
import { EDITOR_LANGUAGES, getStarterCode } from '../data/problemStarterCode';
import { readStoredUser, gradientFromId } from '../utils/user';
import { markSolved } from '../utils/progress';

const PAGE_BG  = '#141414';
const TAB_BG   = '#181818';
const PILL_CLR = '#4D4D4D';
const GAP      = 10;

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

const LEFT_TABS = ['Description', 'Hints']    as const;
const BOT_TABS  = ['Testcase', 'Test Result'] as const;
const CODE_API_BASE_URL = import.meta.env.VITE_CODE_API_BASE_URL ?? '';
const MONACO_THEME = 'duckling-vscode-dark';

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
  const detail  = PROBLEM_DETAILS[Number(id)];

  const storedUser     = readStoredUser();
  const avatarGradient = storedUser ? gradientFromId(storedUser.id) : 'linear-gradient(135deg, #6366f1, #a855f7)';

  const [activeLanguage, setActiveLanguage] = useState<Language>(problem?.language ?? 'Java');
  const [code, setCode]           = useState(problem ? getStarterCode(problem.id, problem.language) : '// Start coding here');
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [running, setRunning]     = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [leftTab, setLeftTab]     = useState<typeof LEFT_TABS[number]>('Description');
  const [botTab,  setBotTab]      = useState<typeof BOT_TABS[number]>('Testcase');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  const [hSplit, setHSplit]           = useState(0.44);
  const [vSplit, setVSplit]           = useState(0.60);
  const [draggingH, setDraggingH]     = useState(false);
  const [draggingV, setDraggingV]     = useState(false);

  const containerRef    = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<Parameters<OnMount>[0] | null>(null);
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
    setActiveLanguage(problem.language);
    setCode(getStarterCode(problem.id, problem.language));
    setRunResult(null);
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

  const trackCursor = useCallback(() => {
    const position = monacoEditorRef.current?.getPosition();
    if (!position) return;
    setCursorPos({ line: position.lineNumber, col: position.column });
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monacoEditorRef.current = editor;

    monaco.editor.defineTheme(MONACO_THEME, {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'type.identifier', foreground: '4EC9B0' },
        { token: 'identifier', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'predefined', foreground: '569CD6' },
      ],
      colors: {
        'editor.background': '#1f1f1f',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#4b4b4b',
        'editorLineNumber.activeForeground': '#8b8b8b',
        'editorCursor.foreground': '#FFC91A',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorIndentGuide.background1': '#2a2a2a',
        'editor.lineHighlightBackground': '#252526',
        'editorBracketMatch.background': '#3a3d41',
        'editorBracketMatch.border': '#7a7a7a',
        'scrollbarSlider.background': '#3f3f4660',
        'scrollbarSlider.hoverBackground': '#52525b80',
        'scrollbarSlider.activeBackground': '#71717a90',
      },
    });

    monaco.editor.setTheme(MONACO_THEME);

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
        body: JSON.stringify({
          problemId: problem?.id,
          language: activeLanguage,
          sourceCode: code,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as RunResult & { error?: string; ok?: boolean };

      if (!response.ok || data.ok === false) {
        throw new Error(data.error ?? 'Code execution failed.');
      }

      const finalResult: RunResult = {
        status: data.status,
        stdout: data.stdout,
        stderr: data.stderr,
        compileOutput: data.compileOutput,
        message: data.message,
        time: data.time,
        memory: data.memory,
        summary: data.summary,
        cases: data.cases ?? [],
      };
      setRunResult(finalResult);
      if (finalResult.status === 'Accepted' && problem) {
        markSolved(problem.id, code, activeLanguage);
      }
    } catch (error) {
      setRunResult({
        status: 'Error',
        stdout: '',
        stderr: '',
        compileOutput: '',
        message: error instanceof Error ? error.message : 'Code execution failed.',
        time: null,
        memory: null,
        summary: '',
        cases: [],
      });
    } finally {
      setRunning(false);
    }
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
  const monacoLanguage =
    activeLanguage === 'Java'
      ? 'java'
      : activeLanguage === 'Python'
        ? 'python'
        : 'cpp';

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
        <Link to="/account" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarGradient, cursor: 'pointer' }} />
        </Link>
      </div>

      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}
      >

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
                <h1 style={{ ...TEXT, fontWeight: 700, fontSize: '1.15rem', color: '#fff', margin: '0 0 0.875rem' }}>
                  {problem.id}. {problem.title}
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}>
                    {problem.difficulty}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    {problem.topic}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                    {activeLanguage}
                  </span>
                </div>

                <p style={{ ...TEXT, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, margin: '0 0 1.5rem' }}>
                  {detail.description}
                </p>

                {detail.note && (
                  <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(255,201,26,0.05)', border: '1px solid rgba(255,201,26,0.12)', borderRadius: '8px' }}>
                    <p style={{ ...TEXT, fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>
                      <strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Note: </strong>{detail.note}
                    </p>
                  </div>
                )}

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

        <HPillDivider onMouseDown={onHMouseDown} active={draggingH} />

        <div
          ref={rightContentRef}
          style={{
            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: isDragging ? 'none' : undefined,
          }}
        >

          <Panel style={{ flex: vSplit * 100, display: 'flex', flexDirection: 'column', minHeight: 0, background: CARD_BG }}>

            <div style={{
              height: 46, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              padding: '0 1rem', gap: '0.75rem',
              background: TAB_BG,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div ref={languageMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setLanguageMenuOpen((open) => !open)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    ...TEXT, fontSize: '0.875rem', fontWeight: 500, color: '#fff',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '7px', padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  {activeLanguage}
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>▾</span>
                </button>
                {languageMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 30,
                      minWidth: 140,
                      background: '#111',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      overflow: 'hidden',
                      boxShadow: '0 14px 28px rgba(0,0,0,0.45)',
                    }}
                  >
                    {EDITOR_LANGUAGES.map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => {
                          setActiveLanguage(language);
                          setCode(getStarterCode(problem.id, language));
                          setRunResult(null);
                          setLanguageMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.7rem 0.85rem',
                          background: language === activeLanguage ? 'rgba(255,201,26,0.08)' : '#111',
                          color: language === activeLanguage ? '#FFC91A' : '#E8E8E8',
                          border: 'none',
                          borderBottom: language === EDITOR_LANGUAGES[EDITOR_LANGUAGES.length - 1] ? 'none' : '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          fontSize: '0.86rem',
                          fontWeight: 600,
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
                background: running ? 'rgba(255,255,255,0.08)' : '#fff',
                color: running ? 'rgba(255,255,255,0.35)' : '#000',
                border: 'none', borderRadius: '7px',
                cursor: running ? 'default' : 'pointer', outline: 'none',
              }}>
                {running ? 'Running…' : 'Run'}
              </button>
            </div>

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
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  },
                }}
              />
            </div>

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

          <VPillDivider onMouseDown={onVMouseDown} active={draggingV} />

          <Panel style={{ flex: (1 - vSplit) * 100, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <TabBar tabs={BOT_TABS} active={botTab} onSelect={setBotTab} />

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
              {botTab === 'Testcase' ? (
                <div>
                  <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.5rem' }}>
                    Sample case
                  </div>
                  <pre style={{ ...MONO, fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {detail.sampleInput}
                  </pre>
                  <p style={{ ...TEXT, fontSize: '0.8rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.7, marginTop: '0.75rem' }}>
                    Run executes your method against built-in test cases on the
                    backend. The sample above is the visible example for this
                    problem.
                  </p>
                </div>
              ) : running ? (
                <span style={{ ...TEXT, fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>Running…</span>
              ) : runResult ? (
                <div>
                  <div style={{ ...TEXT, fontSize: '0.95rem', fontWeight: 700, color: runResult.status === 'Accepted' ? '#4ade80' : runResult.status === 'Error' ? '#f87171' : '#FFC91A', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>
                    {runResult.status}
                  </div>
                  {(runResult.time || runResult.memory) && (
                    <div style={{ ...TEXT, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.75rem' }}>
                      {runResult.time ? `Time: ${runResult.time}s` : null}
                      {runResult.time && runResult.memory ? ' · ' : null}
                      {runResult.memory ? `Memory: ${runResult.memory} KB` : null}
                    </div>
                  )}
                  {runResult.summary && (
                    <div style={{ ...TEXT, fontSize: '0.84rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.75rem' }}>
                      {runResult.summary}
                    </div>
                  )}
                  {runResult.message && (
                    <div style={{ ...TEXT, fontSize: '0.84rem', color: '#f0c674', marginBottom: '0.75rem' }}>
                      {runResult.message}
                    </div>
                  )}
                  {runResult.cases.length > 0 && (
                    <div
                      style={{
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        overflow: 'hidden',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1.8fr) 120px 72px 16px',
                          background: '#161616',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ ...TEXT, padding: '0.75rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, color: '#f1f1f1' }}>
                          Expected
                        </div>
                        <div style={{ ...TEXT, padding: '0.75rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, color: '#f1f1f1', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                          Run
                        </div>
                        <div style={{ ...TEXT, padding: '0.75rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, color: '#f1f1f1', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                          Check
                        </div>
                        <div />
                      </div>
                      {runResult.cases.map((testCase, index) => (
                        <div
                          key={`${testCase.expected}-${index}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1.8fr) 120px 72px 16px',
                            borderBottom:
                              index === runResult.cases.length - 1
                                ? 'none'
                                : '1px solid rgba(255,255,255,0.06)',
                            background: index % 2 === 0 ? '#121212' : '#151515',
                          }}
                        >
                          <div
                            style={{
                              ...MONO,
                              padding: '0.85rem 0.9rem',
                              color: 'rgba(255,255,255,0.84)',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {testCase.expected}
                          </div>
                          <div
                            style={{
                              ...MONO,
                              padding: '0.85rem 0.9rem',
                              color: testCase.passed ? 'rgba(255,255,255,0.84)' : '#fca5a5',
                              borderLeft: '1px solid rgba(255,255,255,0.06)',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {testCase.actual}
                          </div>
                          <div
                            style={{
                              ...TEXT,
                              padding: '0.85rem 0.9rem',
                              color: testCase.passed ? '#4ade80' : '#f87171',
                              borderLeft: '1px solid rgba(255,255,255,0.06)',
                              fontWeight: 700,
                            }}
                          >
                            {testCase.verdict}
                          </div>
                          <div
                            style={{
                              background: testCase.passed ? '#0f8b0f' : '#c41e1e',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {runResult.compileOutput && (
                      <div>
                        <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.5rem' }}>
                          Compile output
                        </div>
                        <pre style={{ ...MONO, fontSize: '0.78rem', color: '#fca5a5', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {runResult.compileOutput}
                        </pre>
                      </div>
                    )}
                    {runResult.stderr && (
                      <div>
                        <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.5rem' }}>
                          stderr
                        </div>
                        <pre style={{ ...MONO, fontSize: '0.78rem', color: '#fca5a5', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {runResult.stderr}
                        </pre>
                      </div>
                    )}
                    <div>
                      <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.5rem' }}>
                        stdout
                      </div>
                      <pre style={{ ...MONO, fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {runResult.stdout || runResult.summary || 'No output.'}
                      </pre>
                    </div>
                  </div>
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
