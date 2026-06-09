import { Link, useLocation } from 'react-router-dom';
import { readStoredUser } from '../utils/user';
import { GridCorner } from './ui';

const NAV_LINKS = [
  { label: 'Home',      path: '/home'      },
  { label: 'Classroom', path: '/classroom' },
  { label: 'Compete',   path: '/compete'   },
  { label: 'Library',   path: '/library'   },
  { label: 'Create',    path: '/create'    },
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
      borderBottom: '1px solid var(--border)',
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
          color: 'var(--text-primary)',
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
                fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 500,
                color: active ? '#FD6D03' : 'var(--text-muted)',
                textDecoration: 'none',
                padding: '0 1.1rem',
                height: 56,
                display: 'flex',
                alignItems: 'center',
                borderBottom: `2px solid ${active ? '#FD6D03' : 'transparent'}`,
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
          background: 'var(--surface)',
          border: '1px solid rgba(253,109,3,0.45)',
          color: '#FD6D03',
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
