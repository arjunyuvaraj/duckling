import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const kw  = (t: string) => <span style={{ color: '#ff7b72' }}>{t}</span>;
const ty  = (t: string) => <span style={{ color: '#79c0ff' }}>{t}</span>;
const fn  = (t: string) => <span style={{ color: '#d2a8ff' }}>{t}</span>;
const num = (t: string) => <span style={{ color: '#f2cc60' }}>{t}</span>;
const dim = (t: string) => <span style={{ color: '#6e7681' }}>{t}</span>;

function EditorPreview() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 640 }}>
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: '-40px',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 48px 96px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04) inset',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.78rem',
          lineHeight: 1.75,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            background: '#111',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
              <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#444', fontFamily: 'Inter' }}>
              duckling.codes — solution.cpp
            </span>
          </div>
        </div>

        {/* Split: problem | code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1.15fr', height: 360 }}>
          {/* Problem pane */}
          <div style={{ padding: '14px', overflowY: 'hidden', fontSize: '0.66rem', lineHeight: 1.8 }}>
            <div style={{ color: '#e8e8e8', fontFamily: 'Inter', fontWeight: 600, marginBottom: '3px', fontSize: '0.75rem' }}>
              Ice Cream Parlor
            </div>
            <div style={{ color: '#444', fontFamily: 'Inter', marginBottom: '10px', fontSize: '0.63rem' }}>
              Easy · Arrays
            </div>
            <div style={{ color: '#555', fontFamily: 'Inter', lineHeight: 1.7, marginBottom: '10px' }}>
              Each time Sunny and Johnny visit, they pool{' '}
              <span style={{ color: '#888', fontFamily: 'JetBrains Mono' }}>m</span> dollars. Given
              flavor costs, find which two they buy.
            </div>
            <div style={{ color: '#333', fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.58rem', marginBottom: '6px' }}>
              Constraints
            </div>
            {['1 ≤ t ≤ 50', '2 ≤ m ≤ 10⁹', '2 ≤ n ≤ 10⁵'].map((c) => (
              <div key={c} style={{ color: '#3a3a3a', fontFamily: 'Inter', fontSize: '0.62rem' }}>· {c}</div>
            ))}
            <div style={{ marginTop: '12px', color: '#333', fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.58rem', marginBottom: '4px' }}>
              Sample Input
            </div>
            <pre style={{ margin: 0, color: '#3a3a3a', fontSize: '0.62rem', fontFamily: 'JetBrains Mono' }}>{`2\n4 5\n1 4 5 3 2`}</pre>
          </div>

          {/* Divider */}
          <div style={{ background: 'rgba(255,255,255,0.05)' }} />

          {/* Code pane */}
          <div style={{ padding: '14px', overflowY: 'hidden', color: '#c9d1d9' }}>
            <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>
              {dim('#include <bits/stdc++.h>')}{'\n'}
              {dim('using namespace std;')}{'\n'}
              {'\n'}
              {ty('vector')}&lt;{ty('int')}&gt; {fn('solve')}({ty('int')} m, {ty('vector')}&lt;{ty('int')}&gt; arr) {'{'}{'\n'}
              {'  '}{ty('map')}&lt;{ty('int')},{ty('int')}&gt; seen;{'\n'}
              {'  '}{kw('for')} ({ty('int')} i={num('0')}; i&lt;arr.size(); i++) {'{'}{'\n'}
              {'    '}{ty('int')} need = m - arr[i];{'\n'}
              {'    '}{kw('if')} (seen.count(need)){'\n'}
              {'      '}{kw('return')} {'{'}{dim('seen')}[need]+{num('1')}, i+{num('1')}{'}'};{'\n'}
              {'    '}seen[arr[i]] = i+{num('1')};{'\n'}
              {'  '}{'}'}{'\n'}
              {'}'}{'\n'}
              {'\n'}
              {ty('int')} {fn('main')}() {'{'}{'\n'}
              {'  '}{ty('int')} t; cin &gt;&gt; t;{'\n'}
              {'  '}{kw('while')} (t--) {'{'}{'\n'}
              {'    '}{ty('int')} m, n; cin &gt;&gt; m &gt;&gt; n;{'\n'}
              {'    '}{ty('vector')}&lt;{ty('int')}&gt; arr(n);{'\n'}
              {'    '}{kw('for')} ({kw('auto')}&amp; x : arr) cin &gt;&gt; x;{'\n'}
            </pre>
          </div>
        </div>

        {/* Status bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 14px',
            background: '#0a0a0a',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            fontSize: '0.62rem',
            fontFamily: 'Inter',
            color: '#333',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>C++ 17</span>
            <span>UTF-8</span>
          </div>
          <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            3 / 3 tests passing
          </span>
        </div>
      </div>

      {/* Floating hint card */}
      <div
        style={{
          position: 'absolute',
          bottom: '-18px',
          right: '-16px',
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '0.7rem',
          fontFamily: 'Inter',
          color: '#888',
          maxWidth: 210,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 2,
        }}
      >
        Hint: try a hash map for O(n) time!
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <Navbar />

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >

        {/* Bottom fade into next section */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to bottom, transparent, #000)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '5rem 4rem',
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: '5rem',
            alignItems: 'center',
          }}
        >
          {/* Left: copy */}
          <div>
            <h1
              style={{
                fontFamily: "'Jersey 10', sans-serif",
                fontSize: 'clamp(2.8rem, 4.2vw, 5rem)',
                color: '#fff',
                marginBottom: '1.5rem',
                lineHeight: 0.92,
                letterSpacing: '-0.025em',
              }}
            >
              The coding practice
              <br />
              platform that{' '}
              <span style={{ color: '#0045FF' }}>actually</span>
              <br />
              teaches you.
            </h1>

            <p
              style={{
                fontSize: '1.5rem',
                color: '#c0c0c0',
                maxWidth: 560,
                lineHeight: 1.5,
                letterSpacing: '-0.02em',
                marginBottom: '2.25rem',
                fontWeight: 500,
              }}
            >
              Most practice platforms throw problems at you and wait. Duckling is
              different. Every problem is a chance to actually learn, compete, and
              improve your coding skills, targeted for students.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link
                to="/get-started"
                className="hero-cta-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '48px',
                  padding: '0 1.75rem',
                  background: '#fff',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: '1rem',
                  fontFamily: 'Inter',
                  borderRadius: '9px',
                  textDecoration: 'none',
                  letterSpacing: '-0.015em',
                  whiteSpace: 'nowrap',
                }}
              >
                Get Started For Free
              </Link>
              <button
                className="hero-cta-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '48px',
                  padding: '0 1.75rem',
                  background: '#1E1E1E',
                  color: '#e0e0e0',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: '2px solid #4D4D4D',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  letterSpacing: '-0.015em',
                  whiteSpace: 'nowrap',
                }}
              >
                Learn More
              </button>
            </div>

          </div>

          {/* Right: editor */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: '40px' }}>
            <EditorPreview />
          </div>
        </div>
      </section>
    </div>
  );
}
