import AppSidebar from '../components/AppSidebar';

export default function Classroom() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <AppSidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#888', fontSize: '0.85rem' }}>
          classroom — coming soon.
        </span>
      </main>
    </div>
  );
}
