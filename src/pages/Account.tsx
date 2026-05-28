import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearSession, readSession } from '../utils/user';

const SUB_TABS = ['Profile', 'Security'] as const;
type SubTab = typeof SUB_TABS[number];

const ITEM_H  = 38;  // button height in px
const ITEM_GAP = 2;  // gap between buttons in px
const PAD = 6;       // container padding in px

const FieldRow = ({ label, description, value }: { label: string; description: string; value: string }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  }}>
    <div>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: '#e8e8e8', marginBottom: '0.2rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: '#888' }}>
        {description}
      </div>
    </div>
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.83rem',
      color: '#c8c8c8',
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 8,
      padding: '0.65rem 0.9rem',
      overflowWrap: 'anywhere',
    }}>
      {value}
    </div>
  </div>
);

export default function Account() {
  const navigate = useNavigate();
  const session = readSession();
  const user = session?.user;

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

          {/* Page header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: '#fff', margin: '0 0 0.4rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              Account
            </h1>
            <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: '#888', margin: 0, lineHeight: 1.5 }}>
              {user ? 'Manage your profile and session settings.' : 'Log in to manage your account.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '1.25rem', alignItems: 'start' }}>

            {/* Left sub-nav with sliding pill */}
            <div style={{
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              background: '#080808',
              padding: `${PAD}px`,
              display: 'flex',
              flexDirection: 'column',
              gap: `${ITEM_GAP}px`,
            }}>
              {/* Sliding pill indicator */}
              <div style={{
                position: 'absolute',
                left: PAD,
                right: PAD,
                height: ITEM_H,
                background: 'rgba(255,161,0,0.1)',
                border: '1px solid rgba(255,161,0,0.18)',
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
                      color: isActive ? '#FFA100' : '#c0c0c0',
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

            {/* Right content — keyed so it remounts on tab switch, sliding from direction */}
            <div
              key={activeTab}
              className={slideDir === 'right' ? 'slide-from-right' : 'slide-from-left'}
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                background: '#080808',
                overflow: 'hidden',
              }}
            >
              {!user ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: '#888', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Log in or register to view your account details.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login" className="fc-btn-primary">Log in</Link>
                    <Link to="/register" className="fc-btn-ghost">Register</Link>
                  </div>
                </div>
              ) : activeTab === 'Profile' ? (
                <>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#fff', margin: '0 0 0.2rem' }}>
                      Profile
                    </h2>
                    <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.85rem', color: '#888', margin: 0 }}>
                      Your account information.
                    </p>
                  </div>

                  <FieldRow label="Username" description="Your display name on ducklings.dev." value={user.username ?? 'unknown'} />
                  <FieldRow label="Email" description="The email address linked to your account." value={user.email ?? 'unknown'} />

                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Link to="/home" style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: '#FFA100',
                      border: '1px solid #FFA100',
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
              ) : (
                <>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#fff', margin: '0 0 0.2rem' }}>
                      Security
                    </h2>
                    <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.85rem', color: '#888', margin: 0 }}>
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
                      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', fontWeight: 500, color: '#e8e8e8', marginBottom: '0.15rem' }}>
                        Sign out
                      </div>
                      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: '#888' }}>
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
