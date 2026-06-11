import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearSession, readSession } from '../utils/user';
import { useTheme, type ThemePreference } from '../context/theme-core';

const SUB_TABS = ['Profile', 'Appearance', 'Security'] as const;
type SubTab = typeof SUB_TABS[number];

const ITEM_H  = 38;
const ITEM_GAP = 2;
const PAD = 6;

const FieldRow = ({ label, description, value }: { label: string; description: string; value: string }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border)',
  }}>
    <div>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {description}
      </div>
    </div>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.83rem',
      color: 'var(--text-primary)',
      background: 'var(--editor-bg)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '0.65rem 0.9rem',
      overflowWrap: 'anywhere',
    }}>
      {value}
    </div>
  </div>
);

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light',  label: 'Light',  icon: '☀' },
  { value: 'dark',   label: 'Dark',   icon: '◑' },
  { value: 'system', label: 'System', icon: '⊙' },
];

export default function Account() {
  const navigate = useNavigate();
  const session = readSession();
  const user = session?.user;
  const { preference, setPreference } = useTheme();

  const [activeTab, setActiveTab] = useState<SubTab>('Profile');
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const prevTabRef = useRef<SubTab>('Profile');

  function switchTab(tab: SubTab) {
    if (tab === activeTab) return;
    const prevIdx = SUB_TABS.indexOf(prevTabRef.current);
    const newIdx  = SUB_TABS.indexOf(tab);
    setSlideDir(newIdx > prevIdx ? 'right' : 'left');
    prevTabRef.current = tab;
    setActiveTab(tab);
  }

  function logout() {
    clearSession();
    navigate('/login');
  }

  const activeIdx = SUB_TABS.indexOf(activeTab);
  const pillTop = PAD + activeIdx * (ITEM_H + ITEM_GAP);

  return (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
      <main style={{ width: 'min(860px, calc(100% - 3rem))', margin: '0 auto', padding: '2.5rem 0 4rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 0.4rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            Account
          </h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {user ? 'Manage your profile and session settings.' : 'Log in to manage your account.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '1.25rem', alignItems: 'start' }}>
          <div style={{
            position: 'relative',
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: 'var(--surface)',
            padding: `${PAD}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${ITEM_GAP}px`,
          }}>
            <div style={{
              position: 'absolute',
              left: PAD,
              right: PAD,
              height: ITEM_H,
              background: 'rgba(253,109,3,0.1)',
              border: '1px solid rgba(253,109,3,0.18)',
              borderRadius: 7,
              top: pillTop,
              transition: 'top 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents: 'none',
            }} />

            {SUB_TABS.map(tab => {
              const isActive = tab === activeTab;
              return (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    height: ITEM_H,
                    padding: '0 0.85rem',
                    borderRadius: 7,
                    border: 'none',
                    background: 'transparent',
                    color: isActive ? '#FD6D03' : 'var(--text-muted)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.18s ease',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <div
            key={activeTab}
            className={slideDir === 'right' ? 'slide-from-right' : 'slide-from-left'}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 10,
              background: 'var(--surface)',
              overflow: 'hidden',
            }}
          >
            {!user ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Log in or register to view your account details.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/login" className="fc-btn-primary">Log in</Link>
                  <Link to="/register" className="fc-btn-ghost">Register</Link>
                </div>
              </div>
            ) : activeTab === 'Profile' ? (
              <>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.2rem' }}>
                    Profile
                  </h2>
                  <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Your account information.
                  </p>
                </div>

                <FieldRow label="Username" description="Your display name on ducklings.dev." value={user.username ?? 'unknown'} />
                <FieldRow label="Email" description="The email address linked to your account." value={user.email ?? 'unknown'} />
                <FieldRow label="Feathers" description="Your duckling rating — earned by solving problems." value={String(user.feathers ?? 0)} />

                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to="/home" style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#fff',
                    background: '#FD6D03',
                    border: '1px solid #FD6D03',
                    borderRadius: 8,
                    padding: '0.55rem 1.2rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}>
                    Go to dashboard
                  </Link>
                </div>
              </>
            ) : activeTab === 'Appearance' ? (
              <>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.2rem' }}>
                    Appearance
                  </h2>
                  <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Control how ducklings.dev looks to you.
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      Theme
                    </div>
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Select light, dark, or follow your system setting.
                    </div>
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    border: '1px solid var(--border)',
                    borderRadius: 9,
                    overflow: 'hidden',
                    background: 'var(--surface-2)',
                    alignSelf: 'center',
                    justifySelf: 'end',
                  }}>
                    {THEME_OPTIONS.map(({ value, label, icon }, i) => {
                      const active = preference === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setPreference(value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 1rem',
                            background: active ? 'rgba(253,109,3,0.12)' : 'transparent',
                            border: 'none',
                            borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                            color: active ? '#FD6D03' : 'var(--text-muted)',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: '0.875rem',
                            fontWeight: active ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'background 0.15s ease, color 0.15s ease',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>{icon}</span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: 'var(--text-subtle)', margin: 0, lineHeight: 1.6 }}>
                    Your preference is saved locally. <b style={{ color: 'var(--text-muted)', fontWeight: 500 }}>System</b> follows your OS setting automatically.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.2rem' }}>
                    Security
                  </h2>
                  <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Your active session details.
                  </p>
                </div>

                <FieldRow label="User ID" description="Your unique account identifier." value={user.id ?? 'unknown'} />
                <FieldRow
                  label="Session Expires"
                  description="When your current session will end."
                  value={session ? new Date(session.expiresAt).toLocaleString() : 'unknown'}
                />

                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                      Sign out
                    </div>
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      End your current session.
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#f87171',
                      background: 'rgba(248,113,113,0.08)',
                      border: '1px solid rgba(248,113,113,0.25)',
                      borderRadius: 8,
                      padding: '0.55rem 1.2rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
