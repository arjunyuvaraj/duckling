import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface NavbarProps {
  showHome?: boolean;
}

export default function Navbar({ showHome = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isLanding = location.pathname === '/';

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: '42px',
    padding: '0 1.25rem',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: '0.86rem',
    fontWeight: 700,
    letterSpacing: '-0.2px',
    borderRadius: '6px',
    textDecoration: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    transition: 'all 0.15s ease',
  };

  const primaryBtn: React.CSSProperties = {
    ...btnBase,
    background: '#fbbf24',
    color: '#171100',
    border: '1px solid #fbbf24',
  };

  const secondaryBtn: React.CSSProperties = {
    ...btnBase,
    background: '#080808',
    color: '#e0e0e0',
    border: '1px solid rgba(255,255,255,0.16)',
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        height: '64px',
        background: '#000',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'all 0.25s ease',
        flexShrink: 0,
      }}
    >
      <Link
        to="/"
        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: '#080808',
            border: '1px solid rgba(251,191,36,0.55)',
            borderRadius: '6px',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#fbbf24',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: '0.72rem',
            fontWeight: 800,
          }}
        >
          &gt;_
        </div>
        <span
          className="logo-pixel"
          style={{
            color: '#e8e8e8',
            marginTop: '3px'
          }}
        >
          ducklings.dev
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isLanding ? (
          <>
            <Link to="/login" style={secondaryBtn} className="nav-secondary-btn">
              Log In
            </Link>
            <Link to="/register" style={primaryBtn} className="nav-primary-btn">
              Register
            </Link>
          </>
        ) : (
          showHome && (
            <Link to="/" style={secondaryBtn} className="nav-secondary-btn">
              ← Home
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
