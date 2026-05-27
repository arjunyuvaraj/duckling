import AppNavbar from '../components/AppNavbar';

export default function Classroom() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <AppNavbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
          classroom — coming soon.
        </span>
      </main>
    </div>
  );
}
