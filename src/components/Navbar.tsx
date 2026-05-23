import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MainButton, DefaultButton } from './ui';

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

  const navBtnOverride: React.CSSProperties = {
    height: '42px',
    padding: '0 1.375rem',
    fontSize: '0.95rem',
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
          ducklings.dev
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isLanding ? (
          <>
            <DefaultButton style={navBtnOverride}>Log In</DefaultButton>
            <Link to="/library" style={{ textDecoration: 'none' }}>
              <MainButton style={navBtnOverride}>Get Started</MainButton>
            </Link>
          </>
        ) : (
          showHome && (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <DefaultButton style={navBtnOverride}>← Home</DefaultButton>
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
