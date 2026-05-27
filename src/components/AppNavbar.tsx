import { Link, useLocation } from 'react-router-dom';
import { readStoredUser } from '../utils/user';
import { GridCorner } from './ui';

const NAV_LINKS = [
  { label: 'Home',      path: '/home'      },
  { label: 'Classroom', path: '/classroom' },
  { label: 'Library',   path: '/library'   },
];

export default function AppNavbar() {
  const { pathname } = useLocation();
  const user = readStoredUser();
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '>_';

  return (
    <nav style={{
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      background: 'var(--bg)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      flexShrink: 0,
      position: 'relative',
    }}>
      <GridCorner position="bottom-left" />
      <GridCorner position="bottom-right" />

      <Link to="/home" style={{ textDecoration: 'none', marginRight: '2rem' }}>
        <span style={{
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: '0.92rem',
          fontWeight: 800,
          color: '#e0e0e0',
          letterSpacing: 0,
        }}>
          ducklings.dev
        </span>
      </Link>

      <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
        {NAV_LINKS.map(({ label, path }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: '0.82rem',
                fontWeight: 700,
                color: active ? '#FFA100' : '#666',
                textDecoration: 'none',
                padding: '0 1.1rem',
                height: 56,
                display: 'flex',
                alignItems: 'center',
                borderBottom: `2px solid ${active ? '#FFA100' : 'transparent'}`,
                letterSpacing: 0,
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <Link to="/account" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: '#080808',
          border: '1px solid rgba(255,161,0,0.45)',
          color: '#FFA100',
          display: 'grid',
          placeItems: 'center',
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: '0.78rem',
          fontWeight: 900,
          cursor: 'pointer',
        }}>
          {initials}
        </div>
      </Link>
    </nav>
  );
}
