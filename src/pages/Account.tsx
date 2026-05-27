import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Typewriter from '../components/Typewriter';
import { clearSession, readSession } from '../utils/user';
import { GridCorner } from '../components/ui';

export default function Account() {
  const navigate = useNavigate();
  const session = readSession();
  const user = session?.user;

  function logout() {
    clearSession();
    navigate('/login');
  }

  const fields = user
    ? [
        { key: 'username', value: user.username ?? 'unknown' },
        { key: 'email', value: user.email ?? 'unknown' },
        { key: 'user_id', value: user.id ?? 'unknown' },
        {
          key: 'session_expires',
          value: session ? new Date(session.expiresAt).toLocaleString() : 'unknown',
        },
      ]
    : [];

  return (
    <div
      className="page-flow-enter"
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'none',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '600px',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Navbar showHome />

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 1.5rem 7rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="hero-copy-flow"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.32rem 0.9rem',
            borderRadius: '999px',
            border: '1px solid rgba(250,93,25,0.28)',
            background: 'rgba(250,93,25,0.07)',
            marginBottom: '1.5rem',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--orange)',
              flexShrink: 0,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              color: 'rgba(250,93,25,0.9)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            duckling.dev / account
          </span>
        </div>

        <h1
          className="hero-copy-flow"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
            fontWeight: 860,
            lineHeight: 1,
            textAlign: 'center',
            marginBottom: '0.6rem',
            color: '#ffffff',
          }}
        >
          {user ? (user.username ?? 'Account') : 'No account loaded'}
        </h1>

        <p
          className="hero-actions-flow"
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.97rem',
            marginBottom: '2.75rem',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {user
            ? 'Your session is active and secure.'
            : 'Log in or register to see your account details.'}
        </p>

        <div
          className="hero-preview-flow"
          style={{ width: '100%', maxWidth: '580px', position: 'relative' }}
        >
          <div
            style={{
              position: 'relative',
              borderRadius: '13px',
              padding: '1px',
              background: 'var(--border)',
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <GridCorner position="top-left" />
              <GridCorner position="top-right" />
              <GridCorner position="bottom-left" />
              <GridCorner position="bottom-right" />

              <div
                style={{
                  padding: '0.7rem 1.2rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.015)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: '#ff5f56',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: '#ffbd2e',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: '#27c93f',
                        display: 'inline-block',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    session.json
                  </span>
                </div>

                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.68rem',
                    color: user ? '#4ade80' : 'var(--text-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: user ? '#4ade80' : 'var(--text-subtle)',
                      display: 'inline-block',
                      boxShadow: user ? '0 0 5px #4ade80' : 'none',
                    }}
                  />
                  {user ? 'authenticated' : 'no session'}
                </span>
              </div>

              <div style={{ padding: '1.75rem' }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.78rem',
                    color: 'rgba(250,93,25,0.65)',
                    marginBottom: '1.4rem',
                  }}
                >
                  <span style={{ color: 'var(--orange)', fontWeight: 800 }}>$</span>{' '}
                  <Typewriter text="duckling account --view" speed={30} delay={200} cursor={false} />
                </div>

                {user ? (
                  <>
                    <div
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      {fields.map(({ key, value }, i) => (
                        <div
                          key={key}
                          className="fc-row"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '148px 1fr',
                            padding: '0.85rem 1rem',
                            borderBottom:
                              i < fields.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.75rem',
                              color: 'var(--orange)',
                              fontWeight: 700,
                            }}
                          >
                            {key}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.8rem',
                              color: '#e0e0e0',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginTop: '1.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Link to="/home" className="fc-btn-primary">
                        Go to main page
                      </Link>
                      <button className="fc-btn-ghost" onClick={logout}>
                        Log out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        lineHeight: 1.65,
                        marginBottom: '1.5rem',
                      }}
                    >
                      Log in or register to see your account details here.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <Link to="/login" className="fc-btn-primary">
                        Log in
                      </Link>
                      <Link to="/register" className="fc-btn-ghost">
                        Register
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
