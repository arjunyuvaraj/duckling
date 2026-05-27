import React, { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveUserSession } from '../utils/user';

type AuthMode = 'login' | 'register';
type AuthStatus = 'idle' | 'loading' | 'success' | 'error';
interface AuthPageProps { mode: AuthMode; }
interface AuthResponse {
  status?: string; user_id?: string; username?: string; email?: string;
  message?: string; detail?: string; access_token?: string;
  token_type?: string; expires_in?: number;
}

const API_BASE_URL     = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const AUTH_API_ENABLED = import.meta.env.VITE_ENABLE_AUTH_API !== 'false';

interface LineGeom {
  cardLeft: number; cardRight: number;
  cardTop: number;  cardBottom: number;
  outerL: number;   outerR: number;
  outerT: number;   outerB: number;
}

function useBlueprintLines(cardRef: React.RefObject<HTMLDivElement | null>, containerRef: React.RefObject<HTMLDivElement | null>) {
  const [geom, setGeom] = useState<LineGeom | null>(null);

  useLayoutEffect(() => {
    function measure() {
      const card = cardRef.current;
      const wrap = containerRef.current;
      if (!card || !wrap) return;
      const cr = card.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      const cLeft  = cr.left  - wr.left;
      const cRight = cr.right - wr.left;
      const cTop   = cr.top   - wr.top;
      const cBot   = cr.bottom - wr.top;
      setGeom({
        cardLeft:  cLeft,
        cardRight: cRight,
        cardTop:   cTop,
        cardBottom: cBot,
        outerL: cLeft  * 0.38,
        outerR: cRight + (wr.width  - cRight) * 0.62,
        outerT: cTop   * 0.32,
        outerB: cBot   + (wr.height - cBot)   * 0.68,
      });
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (cardRef.current)      ro.observe(cardRef.current);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [cardRef, containerRef]);

  return geom;
}

function Field({ label, name, type = 'text', value, placeholder, autoComplete, onChange }: {
  label: string; name: string; type?: string; value: string; placeholder: string;
  autoComplete: string; onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: 'grid', gap: '0.4rem' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <input
        id={name} name={name} type={type} value={value} placeholder={placeholder}
        autoComplete={autoComplete} onChange={e => onChange(e.target.value)} required
        style={{ width: '100%', height: 42, background: '#181818', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#E2E2E2', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.88rem', padding: '0 0.875rem', outline: 'none', transition: 'border-color 0.15s ease' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#FFA100')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
      />
    </label>
  );
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus]     = useState<AuthStatus>('idle');
  const [message, setMessage]   = useState('');
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const prevMode = useRef(mode);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef      = useRef<HTMLDivElement>(null);
  const geom         = useBlueprintLines(cardRef, containerRef);

  useEffect(() => {
    if (prevMode.current !== mode) {
      setSlideDir(mode === 'register' ? 'left' : 'right');
      prevMode.current = mode;
    }
  }, [mode]);

  const isRegister = mode === 'register';
  const copy = useMemo(() => isRegister
    ? { button: 'Create account', switchPrompt: 'Already have an account?', switchAction: 'Log in', switchTo: '/login' }
    : { button: 'Log in', switchPrompt: "New to Duckling?", switchAction: 'Sign up', switchTo: '/register' },
  [isRegister]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    const derivedUsername = email.split('@')[0]?.trim() || 'duckling-user';

    if (!AUTH_API_ENABLED) {
      saveUserSession({ user: { id: `local-${Date.now()}`, username: derivedUsername, email }, accessToken: `local-${crypto.randomUUID()}`, expiresIn: 60 * 60 * 24 * 7 });
      setStatus('success');
      navigate('/home', { replace: true });
      return;
    }
    try {
      const endpoint = isRegister ? '/auth/signup' : '/auth/login';
      const payload  = isRegister ? { email, username: derivedUsername, password } : { email, password };
      const res  = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = (await res.json().catch(() => ({}))) as AuthResponse;
      if (!res.ok) throw new Error(data.detail ?? data.message ?? 'Something went wrong.');
      if (!data.access_token) throw new Error('Login succeeded but no session token was returned.');
      saveUserSession({ user: { id: data.user_id ?? `remote-${Date.now()}`, username: data.username ?? derivedUsername, email: data.email ?? email }, accessToken: data.access_token, expiresIn: data.expires_in ?? 3600 });
      setStatus('success');
      navigate('/home', { replace: true });
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const LINE_BRIGHT = 'rgba(255,255,255,0.13)';
  const LINE_DIM    = 'rgba(255,255,255,0.06)';
  const PLUS_STYLE: React.CSSProperties = {
    position: 'absolute', width: 14, height: 14,
    transform: 'translate(-50%, -50%)',
    color: 'rgba(255,255,255,0.25)',
    fontSize: '14px', lineHeight: 1, textAlign: 'center',
    pointerEvents: 'none', userSelect: 'none',
    fontWeight: 300,
  };

  const tabLink = (active: boolean): React.CSSProperties => ({
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 36, borderRadius: 6,
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', fontWeight: 700,
    textDecoration: 'none', letterSpacing: 0,
    background: 'transparent',
    color: active ? '#E2E2E2' : '#555',
    transition: 'color 0.22s',
  });

  return (
    <div
      ref={containerRef}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0C0C0C', position: 'relative', padding: '2rem 1.5rem', color: '#E2E2E2', overflow: 'hidden' }}
    >
      {geom && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, animation: 'auth-line-in 0.6s ease 0.15s both' }}>

          <div style={{ position: 'absolute', left: geom.outerL, top: 0, bottom: 0, width: 1, background: LINE_DIM }} />
          <div style={{ position: 'absolute', left: geom.outerR, top: 0, bottom: 0, width: 1, background: LINE_DIM }} />
          <div style={{ position: 'absolute', left: geom.cardLeft,  top: 0, bottom: 0, width: 1, background: LINE_BRIGHT }} />
          <div style={{ position: 'absolute', left: geom.cardRight, top: 0, bottom: 0, width: 1, background: LINE_BRIGHT }} />

          <div style={{ position: 'absolute', top: geom.outerT, left: 0, right: 0, height: 1, background: LINE_DIM }} />
          <div style={{ position: 'absolute', top: geom.outerB, left: 0, right: 0, height: 1, background: LINE_DIM }} />
          <div style={{ position: 'absolute', top: geom.cardTop,    left: 0, right: 0, height: 1, background: LINE_BRIGHT }} />
          <div style={{ position: 'absolute', top: geom.cardBottom, left: 0, right: 0, height: 1, background: LINE_BRIGHT }} />

          {[
            [geom.cardLeft,  geom.cardTop],
            [geom.cardRight, geom.cardTop],
            [geom.cardLeft,  geom.cardBottom],
            [geom.cardRight, geom.cardBottom],
          ].map(([x, y], i) => (
            <span key={i} style={{ ...PLUS_STYLE, left: x, top: y, color: 'rgba(255,255,255,0.35)' }}>+</span>
          ))}
          {[
            [geom.outerL, geom.outerT],
            [geom.outerR, geom.outerT],
            [geom.outerL, geom.outerB],
            [geom.outerR, geom.outerB],
          ].map(([x, y], i) => (
            <span key={`o${i}`} style={{ ...PLUS_STYLE, left: x, top: y }}>+</span>
          ))}
          {[
            [geom.outerL, geom.cardTop],    [geom.outerR, geom.cardTop],
            [geom.outerL, geom.cardBottom], [geom.outerR, geom.cardBottom],
            [geom.cardLeft,  geom.outerT],  [geom.cardRight, geom.outerT],
            [geom.cardLeft,  geom.outerB],  [geom.cardRight, geom.outerB],
          ].map(([x, y], i) => (
            <span key={`m${i}`} style={{ ...PLUS_STYLE, left: x, top: y, color: 'rgba(255,255,255,0.15)' }}>+</span>
          ))}
        </div>
      )}

      <Link
        to="/"
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', textDecoration: 'none', position: 'relative', zIndex: 3, animation: 'flow-rise 0.4s ease 0.05s both' }}
      >
        <div style={{ width: 40, height: 40, color: '#FFA100', flexShrink: 0 }}>
          <svg viewBox="0 0 1514 1514" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M862.5 304C985.616 304 1087.39 395.37 1103.71 514H1208.99C1208.67 590.681 1151.68 653.171 1080.13 656.829C1062.64 691.577 1037.08 721.561 1005.9 744.316C1092.38 781.22 1153 867.03 1153 967C1153 1100.65 1044.65 1209 911 1209H548C414.347 1209 306 1100.65 306 967C306 963.283 306.084 959.585 306.25 955.908V580.613L532.977 725.46C537.945 725.156 542.955 725 548 725H695.809C648.529 680.583 619 617.49 619 547.5C619 413.019 728.019 304 862.5 304Z"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: '2rem', fontWeight: 400, color: '#E2E2E2', letterSpacing: '-0.01em', lineHeight: 1 }}>
          ducklings.dev
        </span>
      </Link>

      <div
        ref={cardRef}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, background: '#0C0C0C', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.5rem', animation: 'flow-scale-in 0.35s ease 0.1s both' }}
      >
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 3, marginBottom: '1.5rem' }}>
          <div style={{
            position: 'absolute',
            top: 3, bottom: 3, left: 3,
            width: 'calc(50% - 3px)',
            background: '#1E1E1E',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            transform: isRegister ? 'translateX(100%)' : 'translateX(0)',
            transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none',
          }} />
          <Link to="/login"    style={tabLink(!isRegister)}>Log In</Link>
          <Link to="/register" style={tabLink(isRegister)}>Sign Up</Link>
        </div>

        <div
          key={mode}
          style={{ animation: `${slideDir === 'left' ? 'auth-slide-from-left' : 'auth-slide-from-right'} 0.25s ease both` }}
        >
          <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: '1.4rem', fontWeight: 400, color: '#E2E2E2', lineHeight: 1.2, marginBottom: '0.35rem' }}>
            {isRegister ? 'Create your account.' : 'Welcome back.'}
          </h1>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {isRegister ? 'One account for students and teachers.' : 'Jump back into practice.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ animation: 'flow-rise 0.3s ease 0.05s both' }}>
              <Field label="Email" name="email" type="email" value={email} placeholder="you@school.edu" autoComplete="email" onChange={setEmail} />
            </div>
            <div style={{ animation: 'flow-rise 0.3s ease 0.1s both' }}>
              <Field label="Password" name="password" type="password" value={password} placeholder="••••••••" autoComplete={isRegister ? 'new-password' : 'current-password'} onChange={setPassword} />
            </div>

            <div style={{ animation: 'flow-rise 0.3s ease 0.15s both' }}>
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ marginTop: '0.25rem', height: 44, border: 'none', borderRadius: 8, background: status === 'loading' ? 'rgba(255,161,0,0.55)' : '#FFA100', color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.88rem', fontWeight: 700, cursor: status === 'loading' ? 'wait' : 'pointer', transition: 'background 0.15s ease', width: '100%' }}
                onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.background = '#FFB833'; }}
                onMouseLeave={e => { e.currentTarget.style.background = status === 'loading' ? 'rgba(255,161,0,0.55)' : '#FFA100'; }}
              >
                {status === 'loading' ? 'Working...' : copy.button}
              </button>
            </div>
          </form>

          {message && (
            <div
              role="status"
              style={{ marginTop: '1rem', padding: '0.65rem 0.875rem', borderRadius: 7, fontSize: '0.8rem', lineHeight: 1.45, fontFamily: "'JetBrains Mono', monospace", animation: 'flow-rise 0.2s ease both', ...(status === 'error' ? { color: '#f87171', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.14)' } : { color: '#4ade80', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.14)' }) }}
            >
              {message}
            </div>
          )}

          <p style={{ marginTop: '1.25rem', color: '#555', fontSize: '0.82rem', textAlign: 'center', animation: 'flow-rise 0.3s ease 0.2s both' }}>
            {copy.switchPrompt}{' '}
            <Link to={copy.switchTo} style={{ color: '#FFA100', fontWeight: 700, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              {copy.switchAction}
            </Link>
          </p>
        </div>
      </div>

      <p style={{ marginTop: '2rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#333', position: 'relative', zIndex: 1, animation: 'flow-rise 0.4s ease 0.3s both' }}>
        © 2025 ducklings.dev
      </p>
    </div>
  );
}
