import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { readStoredUser } from '../utils/user';

const EXPANDED_W  = 220;
const COLLAPSED_W = 52;
const LS_KEY      = 'dk-sidebar-collapsed';

const ITEM_H  = 40;
const ITEM_VM = 2;
const NAV_PAD = 8;
const PILL_STEP = ITEM_H + ITEM_VM - 0.5; // slight correction for sub-pixel drift

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconLibrary = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconClassroom = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 9 12 5 2 9l10 4 10-4z"/>
    <path d="M6 11.5v4C6 17.433 8.686 19 12 19s6-1.567 6-3.5v-4"/>
    <path d="M22 9v4"/>
  </svg>
);
const IconCompete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
);
const IconCreate = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconChevronLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const NAV_ITEMS = [
  { label: 'Home',      path: '/home',      Icon: IconHome      },
  { label: 'Library',   path: '/library',   Icon: IconLibrary   },
  { label: 'Classroom', path: '/classroom', Icon: IconClassroom },
  { label: 'Compete',   path: '/compete',   Icon: IconCompete   },
  { label: 'Create',    path: '/create',    Icon: IconCreate    },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const user        = readStoredUser();
  const initials    = user?.username?.slice(0, 2).toUpperCase() ?? '>_';
  const displayName = user?.username?.split('.')[0] ?? 'duckling';

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
  });

  const toggle = () =>
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem(LS_KEY, next ? '1' : '0'); } catch {
        // Ignore storage failures in private browsing or locked-down environments.
      }
      return next;
    });

  const w = collapsed ? COLLAPSED_W : EXPANDED_W;

  const labelFade = collapsed ? 'opacity 0.08s ease' : 'opacity 0.15s ease 0.12s';

  const activeIdx = NAV_ITEMS.findIndex(item => item.path === pathname);
  const pillTop = NAV_PAD + activeIdx * PILL_STEP + 1;

  return (
    <nav style={{
      width: w,
      minWidth: w,
      height: '100vh',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* Brand */}
      <Link to="/home" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        height: 68,
        padding: '0 16px',
        textDecoration: 'none',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <div style={{ width: 28, height: 28, color: '#FD6D03', flexShrink: 0 }}>
          <svg viewBox="0 0 1514 1514" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M862.5 304C985.616 304 1087.39 395.37 1103.71 514H1208.99C1208.67 590.681 1151.68 653.171 1080.13 656.829C1062.64 691.577 1037.08 721.561 1005.9 744.316C1092.38 781.22 1153 867.03 1153 967C1153 1100.65 1044.65 1209 911 1209H548C414.347 1209 306 1100.65 306 967C306 963.283 306.084 959.585 306.25 955.908V580.613L532.977 725.46C537.945 725.156 542.955 725 548 725H695.809C648.529 680.583 619 617.49 619 547.5C619 413.019 728.019 304 862.5 304Z"/>
          </svg>
        </div>
        <span style={{
          fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.02em',
          opacity: collapsed ? 0 : 1,
          transition: labelFade,
          pointerEvents: 'none',
        }}>
          ducklings.dev
        </span>
      </Link>

      {/* Nav */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: `${NAV_PAD}px 0`, position: 'relative' }}
      >
        {activeIdx >= 0 && (
          <div style={{
            position: 'absolute',
            left: 6,
            right: 6,
            height: ITEM_H,
            background: 'rgba(253,109,3,0.1)',
            border: '1px solid rgba(253,109,3,0.18)',
            borderRadius: 6,
            top: pillTop,
            transition: 'top 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}

        {NAV_ITEMS.map(({ label, path, Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`sidebar-item${active ? ' sidebar-item-active' : ''}`}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                height: ITEM_H,
                margin: '1px 6px',
                padding: '0 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 6,
                textDecoration: 'none',
                background: 'transparent',
                color: active ? '#FD6D03' : 'var(--text-muted)',
                transition: 'color 0.18s ease',
              }}
            >
              <span style={{ flexShrink: 0, display: 'inline-flex' }}><Icon /></span>
              <span style={{
                fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                fontSize: '0.9rem',
                fontWeight: active ? 500 : 400,
                whiteSpace: 'nowrap',
                opacity: collapsed ? 0 : 1,
                transition: labelFade,
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '6px' }}>
        <Link
          to="/account"
          className="sidebar-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            height: 40,
            padding: '0 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 6,
            textDecoration: 'none',
            color: pathname === '/account' ? '#FD6D03' : 'var(--text-muted)',
            transition: 'background 0.12s ease, color 0.18s ease',
          }}
        >
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: 'var(--surface-2)',
            border: `1px solid ${pathname === '/account' ? 'rgba(253,109,3,0.5)' : 'rgba(253,109,3,0.35)'}`,
            color: '#FD6D03',
            display: 'grid',
            placeItems: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.58rem',
            fontWeight: 900,
            flexShrink: 0,
            transition: 'border-color 0.18s ease',
          }}>
            {initials}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 600,
            color: pathname === '/account' ? '#FD6D03' : 'var(--text-subtle)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            opacity: collapsed ? 0 : 1,
            transition: `${labelFade}, color 0.18s ease`,
          }}>
            {displayName}
          </span>
        </Link>

        <button
          onClick={toggle}
          className="sidebar-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            height: 40,
            width: '100%',
            padding: '0 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 6,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'background 0.12s ease, color 0.12s ease',
          }}
        >
          <span style={{
            display: 'inline-flex',
            flexShrink: 0,
            transform: `rotate(${collapsed ? 180 : 0}deg)`,
            transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <IconChevronLeft />
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            transition: labelFade,
          }}>
            Collapse
          </span>
        </button>
      </div>
    </nav>
  );
}
