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
    padding: '0 1.375rem',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 600,
    letterSpacing: '-0.015em',
    borderRadius: '9px',
    textDecoration: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  };

  const primaryBtn: React.CSSProperties = {
    ...btnBase,
    background: '#fff',
    color: '#000',
    border: 'none',
  };

  const secondaryBtn: React.CSSProperties = {
    ...btnBase,
    background: '#1E1E1E',
    color: '#e0e0e0',
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        height: '64px',
        background: scrolled ? 'rgba(0,0,0,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'all 0.25s ease',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '7px',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Jersey 10', sans-serif",
            fontSize: '1.2rem',
            color: '#e8e8e8',
            letterSpacing: '0.02em',
          }}
        >
          duckling.codes
        </span>
      </Link>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isLanding ? (
          <>
            {/* Log In styled like the secondary (Learn More) button */}
            <button style={secondaryBtn} className="nav-secondary-btn">
              Log In
            </button>
            {/* Get Started styled like the primary button */}
            <Link to="/get-started" style={primaryBtn} className="nav-primary-btn">
              Get Started
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
