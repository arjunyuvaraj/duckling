import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Typewriter from '../components/Typewriter';

type AuthMode = 'login' | 'register';
type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

interface AuthPageProps {
  mode: AuthMode;
}

interface AuthResponse {
  status?: string;
  user_id?: string;
  username?: string;
  email?: string;
  message?: string;
  detail?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const duck = String.raw`    __
  <(o )___
   ( ._> /
~~~~` + '`---' + String.raw`~~~~`;

function Field({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  autoComplete,
  onChange,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="auth-field" htmlFor={name}>
      <span>{label}</span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [message, setMessage] = useState('');
  const panelContentRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  const isRegister = mode === 'register';
  const copy = useMemo(
    () =>
      isRegister
        ? {
            title: 'Register for Duckling',
            eyebrow: 'new account',
            body: 'One account works for students solving problems and teachers building classes.',
            button: 'Create account',
            switchPrompt: 'Already have an account?',
            switchAction: 'Log in',
            switchTo: '/login',
          }
        : {
            title: 'Log in',
            eyebrow: 'welcome back',
            body: 'Jump back into your practice, classes, and problem sets.',
            button: 'Log in',
            switchPrompt: 'New to Duckling?',
            switchAction: 'Register',
            switchTo: '/register',
          },
    [isRegister],
  );

  useEffect(() => {
    const node = panelContentRef.current;
    if (!node) return;

    const updateHeight = () => setPanelHeight(node.offsetHeight);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    updateHeight();

    return () => observer.disconnect();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const endpoint = isRegister ? '/auth/signup' : '/auth/login';
    const payload = isRegister ? { email, username, password } : { email, password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as AuthResponse;

      if (!response.ok) {
        throw new Error(data.detail ?? data.message ?? 'Something went wrong. Please try again.');
      }

      localStorage.setItem(
        'duckling_user',
        JSON.stringify({
          id: data.user_id,
          username: data.username,
          email: data.email,
        }),
      );
      setStatus('success');
      setMessage(data.message ?? (isRegister ? 'Account created successfully.' : 'Logged in successfully.'));
      navigate('/account', { replace: true });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="auth-shell page-flow-enter">
      <Navbar showHome />
      <main className="auth-layout">
        <section
          className={`terminal-window auth-form-panel terminal-scanlines ${isRegister ? 'auth-register' : 'auth-login'}`}
          style={{ height: panelHeight ? `${panelHeight}px` : undefined }}
        >
          <div ref={panelContentRef} className="auth-panel-content">
            <div className="terminal-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="terminal-dots">
                  <span className="terminal-dot terminal-dot-red" />
                  <span className="terminal-dot terminal-dot-yellow" />
                  <span className="terminal-dot terminal-dot-green" />
                </div>
                <span>duckling.codes/auth</span>
              </div>
              <span>{mode}</span>
            </div>
            <div className="auth-form-heading">
              <pre className="auth-duck" aria-label="ASCII duck logo">{duck}</pre>
              <p className="auth-typed-welcome">
                <Typewriter text="welcome to" speed={25} delay={150} cursor={false} />
              </p>
              <h1 className="auth-typed-title">
                <Typewriter text="DUCKLING" speed={40} delay={450} cursor={false} />
              </h1>
              <div className="auth-command">
                <span>$</span> <Typewriter text={`duckling auth --${mode}`} speed={30} delay={800} cursor={false} />
              </div>
              <p className="auth-subcopy">{isRegister ? copy.body : copy.eyebrow}</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className={`auth-field-slot ${isRegister ? 'auth-field-slot-open' : ''}`} aria-hidden={!isRegister}>
                <Field
                  label="Username"
                  name="username"
                  value={username}
                  placeholder="alex.codes"
                  autoComplete="username"
                  onChange={setUsername}
                  required={isRegister}
                />
              </div>
              <Field
                label="Email"
                name="email"
                type="email"
                value={email}
                placeholder="you@school.edu"
                autoComplete="email"
                onChange={setEmail}
              />
              <Field
                label="Password"
                name="password"
                type="password"
                value={password}
                placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                onChange={setPassword}
              />

              <button className="auth-submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Working...' : copy.button}
              </button>
            </form>

            {message && (
              <div className={`auth-message auth-message-${status}`} role="status">
                {message}
              </div>
            )}

            <p className="auth-switch">
              {copy.switchPrompt}{' '}
              <Link to={copy.switchTo}>{copy.switchAction}</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
