import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';

export default function AppLayout() {
  const location = useLocation();
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <AppSidebar />
      <div
        key={location.pathname}
        className="slide-from-right"
        style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Outlet />
      </div>
    </div>
  );
}
