import { useState, useEffect, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { ALL_PROBLEMS } from '../data/problems';
import { getProblemDetail } from '../data/problemDetails';
import { getStarterCode } from '../data/problemStarterCode';
import { readSession, saveSession, type StoredSession } from '../utils/user';
import { useTheme } from '../context/theme-core';

const API  = import.meta.env.VITE_COMPETE_API_BASE_URL ?? '/api';
const CODE = import.meta.env.VITE_CODE_API_BASE_URL ?? '';

const MONO: React.CSSProperties  = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const SANS: React.CSSProperties  = { fontFamily: 'Inter, system-ui, sans-serif' };
const STACK: React.CSSProperties = { fontFamily: "'Stack', 'Geist', 'Inter', sans-serif" };

type View = 'home' | 'lobby-room' | 'match' | 'result';
type Mode = 'casual' | 'ranked';

interface Lobby {
  id: string; code: string; host_id: string; mode: string;
  status: 'waiting' | 'active' | 'completed';
  max_players: number; problem_id: number | null;
  started_at: string | null;
}
interface LobbyPlayer {
  user_id: string; username: string; feathers: number; place: number | null;
}
interface Submission {
  user_id: string;
  passed_visible: number; total_visible: number;
  passed_hidden: number;  total_hidden: number;
  all_passed: boolean; submitted_at: string;
}
interface TestCase { passed: boolean; expected: string; actual: string; }
interface RunResult {
  ok: boolean; allPassed: boolean;
  passedVisible: number; totalVisible: number;
  passedHidden: number;  totalHidden: number;
  visibleCases: TestCase[];
  status: string; stderr?: string; compileOutput?: string;
}

const DARK_THEME = {
  base: 'vs-dark' as const, inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' }, { token: 'keyword', foreground: 'C586C0' },
    { token: 'number',  foreground: 'B5CEA8' }, { token: 'string',  foreground: 'CE9178' },
    { token: 'type.identifier', foreground: '4EC9B0' },
  ],
  colors: {
    'editor.background': '#0f0f0f', 'editor.foreground': '#e6e6e6',
    'editorLineNumber.foreground': '#4b4b4b', 'editorLineNumber.activeForeground': '#FD6D03',
    'editorCursor.foreground': '#FD6D03', 'editor.selectionBackground': '#3f1c0e',
    'editor.lineHighlightBackground': '#151515', 'scrollbarSlider.background': '#3f3f4660',
  },
};
const LIGHT_THEME = {
  base: 'vs' as const, inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' }, { token: 'keyword', foreground: '0000ff' },
    { token: 'number',  foreground: '098658' }, { token: 'string',  foreground: 'a31515' },
    { token: 'type.identifier', foreground: '267f99' },
  ],
  colors: {
    'editor.background': '#ffffff', 'editor.foreground': '#1e1e1e',
    'editorLineNumber.foreground': '#aaaaaa', 'editorLineNumber.activeForeground': '#FD6D03',
    'editorCursor.foreground': '#FD6D03', 'editor.selectionBackground': '#ffd9b340',
    'editor.lineHighlightBackground': '#f8f8f8', 'scrollbarSlider.background': '#c0c0c040',
  },
};

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function authJson(session: StoredSession | null) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.accessToken ?? ''}`,
    'X-Duckling-User-Id': session?.user.id ?? '',
    'X-Duckling-Username': session?.user.username ?? '',
    'X-Duckling-Feathers': String(session?.user.feathers ?? 100),
  };
}
function diffColor(d: string) {
  return d === 'Easy' ? '#4ade80' : d === 'Medium' ? '#FFC91A' : '#f87171';
}
function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}
function placeLabel(n: number) {
  return ['🥇', '🥈', '🥉', '4th'][n - 1] ?? `${n}th`;
}

function HomeView({
  onCreateLobby, onJoinLobby, joinError, joining,
}: {
  onCreateLobby: (mode: Mode) => void;
  onJoinLobby: (code: string) => void;
  joinError: string; joining: boolean;
}) {
  const [mode, setMode] = useState<Mode>('casual');
  const [code, setCode] = useState('');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '2rem 1.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h1 style={{ ...STACK, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 0.3rem', letterSpacing: '-0.01em' }}>
          Compete.
        </h1>
        <p style={{ ...SANS, fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
          Host a lobby, share the code, and race to solve the same problem first.
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid var(--border)', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          <div>
            <div style={{ ...MONO, fontSize: '0.65rem', color: 'var(--text-subtle)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CREATE LOBBY</div>
            <div style={{ ...STACK, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Host a game</div>
            <div style={{ ...SANS, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Create a lobby and get a 6-digit code. Share it with up to 3 friends. You decide when to start.
            </div>
          </div>
          <div>
            <div style={{ ...SANS, fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>Mode</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['casual', 'ranked'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1, padding: '0.6rem', border: `1px solid ${mode === m ? 'var(--accent, #FD6D03)' : 'var(--border)'}`,
                    background: mode === m ? 'rgba(253,109,3,0.08)' : 'transparent',
                    borderRadius: 6, cursor: 'pointer',
                    color: mode === m ? 'var(--accent, #FD6D03)' : 'var(--text-muted)',
                    ...SANS, fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s',
                  }}
                >
                  {m === 'casual' ? '🎮 Casual' : '🪶 Ranked'}
                </button>
              ))}
            </div>
            <div style={{ ...SANS, fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
              {mode === 'casual' ? 'No feathers at stake — just compete for fun.' : 'Feathers up for grabs. Win to climb.'}
            </div>
          </div>

          <button
            onClick={() => onCreateLobby(mode)}
            style={{
              ...SANS, fontSize: '0.95rem', fontWeight: 500,
              background: 'var(--accent, #FD6D03)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '0.75rem 1.5rem',
              cursor: 'pointer', transition: 'opacity 0.15s', marginTop: 'auto',
            }}
          >
            Create Lobby →
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Up to 4 players', '30 min time limit', 'Same problem for all'].map(t => (
              <span key={t} style={{
                ...MONO, fontSize: '0.67rem', color: 'var(--text-subtle)',
                border: '1px solid var(--border)', borderRadius: 4, padding: '0.2rem 0.5rem',
              }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          <div>
            <div style={{ ...MONO, fontSize: '0.65rem', color: 'var(--text-subtle)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>JOIN LOBBY</div>
            <div style={{ ...STACK, fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>Enter a code</div>
            <div style={{ ...SANS, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Got a 6-digit code from a friend? Enter it below to jump into their lobby.
            </div>
          </div>

          <div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              onKeyDown={e => e.key === 'Enter' && code.length === 6 && onJoinLobby(code)}
              style={{
                width: '100%', padding: '1rem 1.25rem', boxSizing: 'border-box',
                ...MONO, fontSize: '2rem', letterSpacing: '0.3em', textAlign: 'center',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-primary)', outline: 'none',
              }}
            />
            {joinError && (
              <div style={{ ...SANS, fontSize: '0.8rem', color: '#f87171', marginTop: '0.5rem' }}>{joinError}</div>
            )}
          </div>

          <button
            onClick={() => onJoinLobby(code)}
            disabled={code.length !== 6 || joining}
            style={{
              ...SANS, fontSize: '0.95rem', fontWeight: 500,
              background: code.length === 6 && !joining ? 'var(--surface)' : 'transparent',
              color: code.length === 6 ? 'var(--text-primary)' : 'var(--text-subtle)',
              border: `1px solid ${code.length === 6 ? 'var(--border)' : 'transparent'}`,
              borderRadius: 8, padding: '0.75rem 1.5rem',
              cursor: code.length === 6 && !joining ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s', marginTop: 'auto',
            }}
          >
            {joining ? 'Joining…' : 'Join Game →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LobbyRoomView({
  lobby, players, userId, onLeave, onStart, starting,
}: {
  lobby: Lobby; players: LobbyPlayer[]; userId: string;
  onLeave: () => void; onStart: () => void; starting: boolean;
}) {
  const isHost    = lobby.host_id === userId;
  const canStart  = isHost && players.length >= 1 && !starting;
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(lobby.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayCode = `${lobby.code.slice(0, 3)} ${lobby.code.slice(3)}`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        borderBottom: '1px solid var(--border)', padding: '1rem 1.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ ...MONO, fontSize: '0.65rem', color: lobby.mode === 'ranked' ? '#FD6D03' : '#4ade80', border: `1px solid ${lobby.mode === 'ranked' ? '#FD6D0340' : '#4ade8040'}`, padding: '0.15rem 0.5rem', borderRadius: 4, letterSpacing: '0.08em' }}>
            {lobby.mode.toUpperCase()}
          </span>
          <span style={{ ...SANS, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {players.length}/{lobby.max_players} players
          </span>
        </div>
        <button
          onClick={onLeave}
          style={{ ...SANS, fontSize: '0.8rem', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '0.35rem 0.9rem', cursor: 'pointer' }}
        >
          Leave
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        <div style={{
          width: 280, flexShrink: 0, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '1.25rem', padding: '2rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...SANS, fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.5rem', letterSpacing: '0.06em' }}>
              GAME PIN
            </div>
            <div style={{
              ...MONO, fontSize: '3rem', fontWeight: 900, letterSpacing: '0.15em',
              color: 'var(--text-primary)', lineHeight: 1,
            }}>
              {displayCode}
            </div>
          </div>

          <button
            onClick={copyCode}
            style={{
              ...SANS, fontSize: '0.8rem', fontWeight: 500,
              color: copied ? '#4ade80' : 'var(--text-muted)',
              background: 'var(--surface)', border: `1px solid ${copied ? '#4ade8040' : 'var(--border)'}`,
              borderRadius: 6, padding: '0.4rem 1rem', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : '⎘ Copy code'}
          </button>

          <div style={{ ...SANS, fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'center', lineHeight: 1.6 }}>
            Share this code with friends. They go to Compete → Enter Code.
          </div>
          <div style={{ marginTop: 'auto', width: '100%' }}>
            {isHost ? (
              <button
                onClick={onStart}
                disabled={!canStart}
                style={{
                  width: '100%', ...SANS, fontSize: '0.95rem', fontWeight: 500,
                  color: canStart ? '#fff' : 'var(--text-subtle)',
                  background: canStart ? 'var(--accent, #FD6D03)' : 'var(--border)',
                  border: 'none', borderRadius: 8, padding: '0.75rem',
                  cursor: canStart ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                }}
              >
                {starting ? 'Starting…' : 'Start Game →'}
              </button>
            ) : (
              <div style={{ ...SANS, fontSize: '0.8rem', color: 'var(--text-subtle)', textAlign: 'center', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 8 }}>
                Waiting for host to start…
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div style={{ ...SANS, fontSize: '0.72rem', color: 'var(--text-subtle)', letterSpacing: '0.07em', marginBottom: '1.25rem' }}>
            PLAYERS IN LOBBY
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {players.map(p => (
              <div key={p.user_id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--surface)', border: `1px solid ${p.user_id === userId ? 'var(--accent, #FD6D03)' : 'var(--border)'}`,
                borderRadius: 8, transition: 'border-color 0.15s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: p.user_id === userId ? 'rgba(253,109,3,0.15)' : 'var(--surface-2)',
                  border: `1px solid ${p.user_id === userId ? 'rgba(253,109,3,0.4)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...MONO, fontSize: '0.75rem', fontWeight: 700,
                  color: p.user_id === userId ? '#FD6D03' : 'var(--text-muted)',
                }}>
                  {initials(p.username)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ ...SANS, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {p.username}
                    </span>
                    {p.user_id === userId && (
                      <span style={{ ...MONO, fontSize: '0.6rem', color: '#FD6D03', letterSpacing: '0.08em' }}>YOU</span>
                    )}
                    {p.user_id === lobby.host_id && (
                      <span style={{ ...MONO, fontSize: '0.6rem', color: 'var(--text-subtle)', letterSpacing: '0.06em' }}>HOST</span>
                    )}
                  </div>
                  <div style={{ ...MONO, fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    🪶 {p.feathers}
                  </div>
                </div>

                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite', flexShrink: 0 }} />
              </div>
            ))}
            {Array.from({ length: lobby.max_players - players.length }).map((_, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: '1px dashed var(--border)',
                borderRadius: 8, opacity: 0.5,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                }} />
                <span style={{ ...SANS, fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                  Waiting for player…
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
    </div>
  );
}

function MatchView({
  lobby, players, submissions, userId, timeLeft,
  onSubmit,
}: {
  lobby: Lobby; players: LobbyPlayer[]; submissions: Submission[];
  userId: string; timeLeft: number;
  onSubmit: (result: RunResult, sourceCode: string, lang: string) => Promise<void>;
}) {
  const { resolved } = useTheme();
  const problem    = ALL_PROBLEMS.find(p => p.id === lobby.problem_id)!;
  const detail     = problem ? getProblemDetail(problem) : null;
  const language   = problem?.language ?? 'Java';
  const editorLang = language === 'Java' ? 'java' : 'python';

  const [code, setCode]       = useState(problem ? getStarterCode(problem.id, language) : '');
  const [running, setRunning] = useState(false);
  const [result, setResult]   = useState<RunResult | null>(null);

  const handleEditorMount: OnMount = (_ed, monaco) => {
    monaco.editor.defineTheme('compete-dark', DARK_THEME);
    monaco.editor.defineTheme('compete-light', LIGHT_THEME);
    monaco.editor.setTheme(resolved === 'dark' ? 'compete-dark' : 'compete-light');
  };

  const handleSubmit = async () => {
    if (running || !problem) return;
    setRunning(true);
    setResult(null);
    try {
      const res  = await fetch(`${CODE}/api/code/compete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, sourceCode: code, problemId: problem.id }),
      });
      const data: RunResult = await res.json();
      setResult(data);
      if (data.ok) await onSubmit(data, code, language);
    } catch {
      setResult({
        ok: false,
        allPassed: false,
        passedVisible: 0,
        totalVisible: 0,
        passedHidden: 0,
        totalHidden: 0,
        visibleCases: [],
        status: 'Network error',
        stderr: 'The code runner is not reachable.',
      });
    }
    finally { setRunning(false); }
  };

  const opponents  = players.filter(p => p.user_id !== userId);
  const isUrgent   = timeLeft < 300;
  const subMap     = Object.fromEntries(submissions.map(s => [s.user_id, s]));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        height: 52, flexShrink: 0, display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--border)', padding: '0 1rem', gap: '1rem',
        background: 'var(--surface)', overflow: 'hidden',
      }}>
        <span style={{
          ...MONO, fontSize: '0.65rem', fontWeight: 700,
          color: lobby.mode === 'ranked' ? '#FD6D03' : '#4ade80',
          border: `1px solid ${lobby.mode === 'ranked' ? '#FD6D0340' : '#4ade8040'}`,
          padding: '0.2rem 0.45rem', borderRadius: 4, letterSpacing: '0.08em', flexShrink: 0,
        }}>
          {lobby.mode.toUpperCase()}
        </span>

        <span style={{ ...MONO, fontSize: '1rem', fontWeight: 700, color: isUrgent ? '#f87171' : 'var(--text-primary)', minWidth: 56, flexShrink: 0 }}>
          {fmt(timeLeft)}
        </span>
        <div style={{ flex: 1, display: 'flex', gap: '0.75rem', overflow: 'hidden', alignItems: 'center' }}>
          {opponents.map(opp => {
            const sub      = subMap[opp.user_id];
            const total    = (sub?.total_visible ?? 0) + (sub?.total_hidden ?? 0);
            const passed   = (sub?.passed_visible ?? 0) + (sub?.passed_hidden ?? 0);
            const pct      = total > 0 ? (passed / total) * 100 : 0;
            return (
              <div key={opp.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flexShrink: 1 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...MONO, fontSize: '0.55rem', color: 'var(--text-subtle)',
                }}>
                  {initials(opp.username)}
                </div>
                <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2, flexShrink: 0 }}>
                  <div style={{ height: '100%', borderRadius: 2, background: sub?.all_passed ? '#4ade80' : '#FD6D03', width: `${pct}%`, transition: 'width 0.5s' }} />
                </div>
                <span style={{ ...MONO, fontSize: '0.65rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                  {passed}/{total}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={running}
          style={{
            ...SANS, fontSize: '0.875rem', fontWeight: 500,
            color: running ? 'var(--text-subtle)' : '#fff',
            background: running ? 'var(--border)' : 'var(--accent, #FD6D03)',
            border: 'none', borderRadius: 6, padding: '0.45rem 1.25rem',
            cursor: running ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {running ? 'Running…' : 'Submit →'}
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        <div style={{ width: '37%', flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {problem && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...MONO, fontSize: '0.65rem', color: 'var(--text-subtle)' }}>#{problem.id}</span>
                <span style={{ ...MONO, fontSize: '0.7rem', fontWeight: 700, color: diffColor(problem.difficulty), border: `1px solid ${diffColor(problem.difficulty)}40`, padding: '0.12rem 0.45rem', borderRadius: 4 }}>
                  {problem.difficulty}
                </span>
                <span style={{ ...MONO, fontSize: '0.65rem', color: 'var(--text-subtle)' }}>{problem.language}</span>
              </div>

              <h2 style={{ ...STACK, fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 0.9rem' }}>
                {problem.title}
              </h2>

              {detail && (
                <>
                  <p style={{ ...SANS, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.75, margin: '0 0 1rem' }}>
                    {detail.description}
                  </p>
                  {detail.constraints.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ ...MONO, fontSize: '0.65rem', color: 'var(--text-subtle)', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>CONSTRAINTS</div>
                      {detail.constraints.map((c, i) => (
                        <div key={i} style={{ ...SANS, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>· {c}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '0.65rem 0.9rem', marginBottom: '0.5rem' }}>
                    <div style={{ ...MONO, fontSize: '0.62rem', color: 'var(--text-subtle)', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>EXAMPLE INPUT</div>
                    <pre style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{detail.sampleInput}</pre>
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '0.65rem 0.9rem', marginBottom: '0.75rem' }}>
                    <div style={{ ...MONO, fontSize: '0.62rem', color: 'var(--text-subtle)', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>EXAMPLE OUTPUT</div>
                    <pre style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-primary)', margin: 0 }}>{detail.sampleOutput}</pre>
                  </div>
                  {detail.explanation && (
                    <p style={{ ...SANS, fontSize: '0.78rem', color: 'var(--text-subtle)', lineHeight: 1.65, margin: 0 }}>
                      💡 {detail.explanation}
                    </p>
                  )}
                </>
              )}

              <div style={{ marginTop: '1rem', padding: '0.65rem 0.9rem', background: 'rgba(253,109,3,0.06)', borderRadius: 6, border: '1px solid rgba(253,109,3,0.15)' }}>
                <div style={{ ...MONO, fontSize: '0.62rem', color: '#FD6D03', marginBottom: '0.25rem' }}>COMPETE RULES</div>
                <div style={{ ...SANS, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Pass all hidden tests to win instantly. At time's up, most tests passed wins.
                </div>
              </div>
            </>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Editor
            height={result ? 'calc(100% - 130px)' : '100%'}
            language={editorLang}
            value={code}
            onChange={v => setCode(v ?? '')}
            onMount={handleEditorMount}
            options={{
              fontSize: 13, lineHeight: 20, minimap: { enabled: false },
              scrollBeyondLastLine: false, tabSize: 4,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 14, bottom: 14 }, wordWrap: 'on',
            }}
          />
          {result && (
            <div style={{ height: 130, flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--surface)', overflowY: 'auto', padding: '0.65rem 1rem' }}>
              {!result.ok ? (
                <div>
                  <div style={{ ...MONO, fontSize: '0.7rem', color: '#f87171', marginBottom: '0.2rem' }}>ERROR</div>
                  <pre style={{ ...MONO, fontSize: '0.72rem', color: '#f87171', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {result.compileOutput || result.stderr || 'Execution failed'}
                  </pre>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.4rem' }}>
                    {result.visibleCases.map((c, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.18rem 0.45rem',
                        background: c.passed ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                        border: `1px solid ${c.passed ? '#4ade8030' : '#f8717130'}`,
                        borderRadius: 4,
                      }}>
                        <span style={{ fontSize: '0.7rem' }}>{c.passed ? '✓' : '✗'}</span>
                        <span style={{ ...MONO, fontSize: '0.68rem', color: c.passed ? '#4ade80' : '#f87171' }}>Case {i + 1}</span>
                      </div>
                    ))}
                    {result.totalHidden > 0 && (
                      <span style={{ ...MONO, fontSize: '0.68rem', color: 'var(--text-subtle)', padding: '0.18rem 0.45rem', border: '1px solid var(--border)', borderRadius: 4 }}>
                        Hidden: {result.passedHidden}/{result.totalHidden}
                      </span>
                    )}
                    {result.allPassed && (
                      <span style={{ ...MONO, fontSize: '0.7rem', color: '#4ade80', fontWeight: 700 }}>✓ ALL PASSED!</span>
                    )}
                  </div>
                  {(() => {
                    const fail = result.visibleCases.find(c => !c.passed);
                    if (!fail) return null;
                    return (
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div>
                          <div style={{ ...MONO, fontSize: '0.6rem', color: 'var(--text-subtle)', marginBottom: '0.15rem' }}>EXPECTED</div>
                          <pre style={{ ...MONO, fontSize: '0.72rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>{fail.expected}</pre>
                        </div>
                        <div>
                          <div style={{ ...MONO, fontSize: '0.6rem', color: 'var(--text-subtle)', marginBottom: '0.15rem' }}>GOT</div>
                          <pre style={{ ...MONO, fontSize: '0.72rem', color: '#f87171', margin: 0, whiteSpace: 'pre-wrap' }}>{fail.actual}</pre>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultView({
  lobby, players, submissions, rankings, featherChanges, userId, onPlayAgain,
}: {
  lobby: Lobby; players: LobbyPlayer[]; submissions: Submission[];
  rankings: Record<string, number>; featherChanges: Record<string, number>;
  userId: string; onPlayAgain: () => void;
}) {
  const problem = ALL_PROBLEMS.find(p => p.id === lobby.problem_id);
  const subMap  = Object.fromEntries(submissions.map(s => [s.user_id, s]));

  const sorted = [...players].sort((a, b) => (rankings[a.user_id] ?? 99) - (rankings[b.user_id] ?? 99));
  const myPlace = rankings[userId] ?? players.length;
  const iWon    = myPlace === 1;

  const totalTests = submissions[0]
    ? submissions[0].total_visible + submissions[0].total_hidden
    : 7;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', overflow: 'auto', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, ${iWon ? '#4ade8010' : '#FD6D0308'}, transparent 70%)`,
      }} />

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>{placeLabel(myPlace)}</div>
        <div style={{ ...STACK, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
          {iWon ? 'You crushed it.' : myPlace === 2 ? 'So close.' : 'Keep grinding.'}
        </div>
        {problem && (
          <div style={{ ...SANS, fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            {problem.title} · <span style={{ color: diffColor(problem.difficulty) }}>{problem.difficulty}</span> · {lobby.mode === 'ranked' ? 'Ranked' : 'Casual'}
          </div>
        )}
      </div>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
        {sorted.map((p, idx) => {
          const sub        = subMap[p.user_id];
          const passed     = sub ? sub.passed_visible + sub.passed_hidden : 0;
          const change     = featherChanges[p.user_id] ?? 0;
          const isMe       = p.user_id === userId;
          const place      = rankings[p.user_id] ?? idx + 1;

          return (
            <div key={p.user_id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.9rem 1rem',
              background: isMe ? 'rgba(253,109,3,0.06)' : 'var(--surface)',
              border: `1px solid ${isMe ? 'rgba(253,109,3,0.25)' : 'var(--border)'}`,
              borderRadius: 8,
            }}>
              <div style={{ ...MONO, fontSize: '1.2rem', width: 32, textAlign: 'center', flexShrink: 0 }}>
                {placeLabel(place)}
              </div>

              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: isMe ? 'rgba(253,109,3,0.15)' : 'var(--surface-2)',
                border: `1px solid ${isMe ? 'rgba(253,109,3,0.4)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...MONO, fontSize: '0.7rem', color: isMe ? '#FD6D03' : 'var(--text-muted)',
              }}>
                {initials(p.username)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ ...SANS, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{p.username}</span>
                  {isMe && <span style={{ ...MONO, fontSize: '0.58rem', color: '#FD6D03', letterSpacing: '0.06em' }}>YOU</span>}
                  {sub?.all_passed && <span style={{ ...MONO, fontSize: '0.58rem', color: '#4ade80' }}>✓ ALL</span>}
                </div>
                <div style={{ ...MONO, fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                  {passed}/{totalTests} tests passed
                </div>
              </div>
              {lobby.mode === 'ranked' && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ ...MONO, fontSize: '0.8rem', fontWeight: 700, color: change >= 0 ? '#4ade80' : '#f87171' }}>
                    {change >= 0 ? `+${change}` : change}
                  </div>
                  <div style={{ ...MONO, fontSize: '0.65rem', color: 'var(--text-subtle)' }}>🪶 {Math.max(0, p.feathers + change)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={onPlayAgain} style={{ ...SANS, fontSize: '0.9rem', fontWeight: 500, color: '#fff', background: 'var(--accent, #FD6D03)', border: 'none', borderRadius: 8, padding: '0.65rem 1.5rem', cursor: 'pointer' }}>
          Play Again →
        </button>
        <button onClick={onPlayAgain} style={{ ...SANS, fontSize: '0.9rem', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '0.65rem 1.25rem', cursor: 'pointer' }}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}

export default function Compete() {
  const [session, setSession] = useState<StoredSession | null>(() => readSession());
  const userId  = session?.user.id ?? '';

  const [view, setView]     = useState<View>('home');
  const [code, setCode]     = useState('');
  const [lobby, setLobby]   = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [subs, setSubs]       = useState<Submission[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [starting, setStarting] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining]     = useState(false);
  const [resultData, setResultData] = useState<{
    rankings: Record<string, number>; featherChanges: Record<string, number>;
  } | null>(null);

  const headers = useCallback(() => authJson(session), [session]);

  const fetchLobby = useCallback(async (lobbyCode: string) => {
    try {
      const res  = await fetch(`${API}/compete/lobby/${lobbyCode}`, { headers: headers() });
      if (!res.ok) return null;
      const data = await res.json();
      return data as { lobby: Lobby; players: LobbyPlayer[]; submissions: Submission[] };
    } catch { return null; }
  }, [headers]);

  useEffect(() => {
    if (view !== 'lobby-room' || !code) return;

    const poll = setInterval(async () => {
      const data = await fetchLobby(code);
      if (!data) return;
      setLobby(data.lobby);
      setPlayers(data.players);
      setSubs(data.submissions);

      if (data.lobby.status === 'active') {
        clearInterval(poll);
        setTimeLeft(data.lobby.started_at
          ? Math.max(0, 1800 - Math.floor((Date.now() - new Date(data.lobby.started_at).getTime()) / 1000))
          : 1800);
        setView('match');
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [view, code, fetchLobby]);

  const handleTimeUp = useCallback(async () => {
    if (!code) return;
    try {
      const res  = await fetch(`${API}/compete/lobby/${code}/end`, { method: 'POST', headers: headers() });
      const data = await res.json();
      if (session && lobby?.mode === 'ranked') {
        const myChange = data.feather_changes?.[userId] ?? 0;
        if (myChange !== 0) {
          const myPlayer = players.find(p => p.user_id === userId);
          if (myPlayer) {
            const nextSession = { ...session, user: { ...session.user, feathers: Math.max(0, myPlayer.feathers + myChange) } } as StoredSession;
            saveSession(nextSession);
            setSession(nextSession);
          }
        }
      }
      setResultData({ rankings: data.rankings ?? {}, featherChanges: data.feather_changes ?? {} });
      setView('result');
    } catch { setView('result'); }
  }, [code, headers, session, lobby, userId, players]);

  useEffect(() => {
    if (view !== 'match' || !code) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleTimeUp(); return 0; }
        return prev - 1;
      });
    }, 1000);

    const poll = setInterval(async () => {
      const data = await fetchLobby(code);
      if (!data) return;
      setPlayers(data.players);
      setSubs(data.submissions);

      if (data.lobby.status === 'completed') {
        clearInterval(timer);
        clearInterval(poll);
        const endRes  = await fetch(`${API}/compete/lobby/${code}/end`, { method: 'POST', headers: headers() });
        const endData = await endRes.json();
        setResultData({ rankings: endData.rankings, featherChanges: endData.feather_changes ?? {} });
        setLobby(data.lobby);
        setPlayers(data.players);
        setSubs(data.submissions);
        setView('result');
      }
    }, 3000);

    return () => { clearInterval(timer); clearInterval(poll); };
  }, [view, code, fetchLobby, handleTimeUp, headers]);

  const handleSubmitResult = useCallback(async (runResult: RunResult, sourceCode: string, lang: string) => {
    if (!code) return;
    try {
      const res  = await fetch(`${API}/compete/lobby/${code}/submit`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          code: sourceCode,
          language: lang,
          passed_visible: runResult.passedVisible,
          total_visible:  runResult.totalVisible,
          passed_hidden:  runResult.passedHidden,
          total_hidden:   runResult.totalHidden,
          all_passed:     runResult.allPassed,
        }),
      });
      const data = await res.json();

      if (data.status === 'winner') {
        if (session && lobby?.mode === 'ranked') {
          const myChange = data.feather_changes?.[userId] ?? 0;
          const myPlayer = players.find(p => p.user_id === userId);
          if (myChange !== 0 && myPlayer) {
            const nextSession = { ...session, user: { ...session.user, feathers: Math.max(0, myPlayer.feathers + myChange) } } as StoredSession;
            saveSession(nextSession);
            setSession(nextSession);
          }
        }
        const finalRes  = await fetch(`${API}/compete/lobby/${code}/end`, { method: 'POST', headers: headers() });
        const finalData = await finalRes.json();
        setResultData({ rankings: finalData.rankings ?? { [userId]: 1 }, featherChanges: finalData.feather_changes ?? {} });
        const snapshot = await fetchLobby(code);
        if (snapshot) { setLobby(snapshot.lobby); setPlayers(snapshot.players); setSubs(snapshot.submissions); }
        setView('result');
      }
    } catch {
      return;
    }
  }, [code, headers, lobby, session, userId, fetchLobby, players]);

  const handleCreateLobby = useCallback(async (selectedMode: Mode) => {
    try {
      const res  = await fetch(`${API}/compete/lobby/create`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ mode: selectedMode }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setCode(data.code);
      const snapshot = await fetchLobby(data.code);
      if (snapshot) { setLobby(snapshot.lobby); setPlayers(snapshot.players); setSubs([]); }
      setView('lobby-room');
    } catch {
      setJoinError('Could not create lobby. Start the backend and try again.');
    }
  }, [headers, fetchLobby]);

  const handleJoinLobby = useCallback(async (enteredCode: string) => {
    setJoining(true);
    setJoinError('');
    try {
      const res  = await fetch(`${API}/compete/lobby/join`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ code: enteredCode }),
      });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.detail ?? 'Could not join lobby.'); return; }
      setCode(data.code);
      const snapshot = await fetchLobby(data.code);
      if (snapshot) { setLobby(snapshot.lobby); setPlayers(snapshot.players); setSubs([]); }
      setView('lobby-room');
    } catch { setJoinError('Network error. Try again.'); }
    finally { setJoining(false); }
  }, [headers, fetchLobby]);

  const handleStartGame = useCallback(async () => {
    if (!code) return;
    setStarting(true);
    try {
      await fetch(`${API}/compete/lobby/${code}/start`, { method: 'POST', headers: headers() });
      const snapshot = await fetchLobby(code);
      if (snapshot?.lobby.status === 'active') {
        setLobby(snapshot.lobby);
        setPlayers(snapshot.players);
        setSubs(snapshot.submissions);
        setTimeLeft(1800);
        setView('match');
      }
    } catch {
      setJoinError('Could not start game. Try again.');
    }
    finally { setStarting(false); }
  }, [code, headers, fetchLobby]);

  const handleLeave = useCallback(async () => {
    if (code) {
      try {
        await fetch(`${API}/compete/lobby/${code}/leave`, { method: 'POST', headers: headers() });
      } catch {
        setJoinError('');
      }
    }
    setLobby(null); setPlayers([]); setSubs([]); setCode(''); setResultData(null);
    setView('home');
  }, [code, headers]);

  const handlePlayAgain = useCallback(() => {
    setLobby(null); setPlayers([]); setSubs([]); setCode('');
    setResultData(null); setTimeLeft(1800); setStarting(false);
    setView('home');
  }, []);

  if (view === 'home') {
    return (
      <HomeView
        onCreateLobby={handleCreateLobby}
        onJoinLobby={handleJoinLobby}
        joinError={joinError}
        joining={joining}
      />
    );
  }

  if (view === 'lobby-room' && lobby) {
    return (
      <LobbyRoomView
        lobby={lobby} players={players} userId={userId}
        onLeave={handleLeave} onStart={handleStartGame} starting={starting}
      />
    );
  }

  if (view === 'match' && lobby) {
    return (
      <MatchView
        lobby={lobby} players={players} submissions={subs}
        userId={userId} timeLeft={timeLeft}
        onSubmit={handleSubmitResult}
      />
    );
  }

  if (view === 'result' && lobby && resultData) {
    return (
      <ResultView
        lobby={lobby} players={players} submissions={subs}
        rankings={resultData.rankings} featherChanges={resultData.featherChanges}
        userId={userId} onPlayAgain={handlePlayAgain}
      />
    );
  }

  return <HomeView onCreateLobby={handleCreateLobby} onJoinLobby={handleJoinLobby} joinError={joinError} joining={joining} />;
}
