import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function GetStarted() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <Navbar showHome />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <h1
          style={{
            fontFamily: "'Jersey 10', sans-serif",
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            color: '#fff',
            marginBottom: '1rem',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
          }}
        >
          Coming Soon
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: '#888',
            maxWidth: 380,
            lineHeight: 1.6,
            marginBottom: '2rem',
            fontWeight: 500,
          }}
        >
          We're building something great. Sign-up will be available soon.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#1E1E1E',
            border: '2px solid #4D4D4D',
            color: '#e0e0e0',
            fontSize: '0.95rem',
            fontWeight: 600,
            fontFamily: 'Inter',
            padding: '0.65rem 1.375rem',
            borderRadius: '9px',
            textDecoration: 'none',
            letterSpacing: '-0.015em',
          }}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
