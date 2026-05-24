import { Link, useLocation } from 'react-router-dom';
import { readStoredUser, gradientFromId } from '../utils/user';

const NAV_LINKS = [
  { label: 'Home',      path: '/'          },
  { label: 'Classroom', path: '/classroom' },
  { label: 'Library',   path: '/library'   },
];

export default function AppNavbar() {
  const { pathname } = useLocation();
  const user = readStoredUser();
  const avatarGradient = user ? gradientFromId(user.id) : 'linear-gradient(135deg, #6366f1, #a855f7)';

  return (
    <nav style={{
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      background: '#080808',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      <Link to="/" style={{ textDecoration: 'none', marginRight: '2rem' }}>
        <span style={{
          fontFamily: "'Jersey 10', sans-serif",
          fontSize: '1.15rem',
          color: '#e0e0e0',
          letterSpacing: '0.02em',
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
                fontFamily: 'Inter',
                fontSize: '0.92rem',
                fontWeight: 500,
                color: active ? '#fff' : '#505050',
                textDecoration: 'none',
                padding: '0 1.1rem',
                height: 56,
                display: 'flex',
                alignItems: 'center',
                borderBottom: `2px solid ${active ? '#FFC91A' : 'transparent'}`,
                letterSpacing: '-0.01em',
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
          borderRadius: '50%',
          background: avatarGradient,
          cursor: 'pointer',
        }} />
      </Link>
    </nav>
  );
}
