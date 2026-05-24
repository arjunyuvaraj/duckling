import AppNavbar from '../components/AppNavbar';

export default function Classroom() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <AppNavbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', color: '#333', fontSize: '0.9rem' }}>
          Classroom — coming soon.
        </span>
      </main>
    </div>
  );
}
