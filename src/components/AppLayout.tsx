import { Outlet, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import AppSidebar from './AppSidebar';

const PAGE_ORDER = ['/home', '/library', '/classroom', '/account'];

export default function AppLayout() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const slideDirRef = useRef<'right' | 'left'>('right');

  if (prevPathRef.current !== location.pathname) {
    const prevIdx = PAGE_ORDER.indexOf(prevPathRef.current);
    const newIdx  = PAGE_ORDER.indexOf(location.pathname);
    slideDirRef.current = newIdx >= prevIdx ? 'right' : 'left';
    prevPathRef.current = location.pathname;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <AppSidebar />
      <div
        key={location.pathname}
        className={slideDirRef.current === 'right' ? 'slide-from-right' : 'slide-from-left'}
        style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Outlet />
      </div>
    </div>
  );
}
