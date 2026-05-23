import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Title, H1, Body, MainButton, SubButton } from '../components/ui';

const kw  = (t: string) => <span style={{ color: '#ff7b72' }}>{t}</span>;
const ty  = (t: string) => <span style={{ color: '#79c0ff' }}>{t}</span>;
const fn  = (t: string) => <span style={{ color: '#d2a8ff' }}>{t}</span>;
const num = (t: string) => <span style={{ color: '#f2cc60' }}>{t}</span>;
const dim = (t: string) => <span style={{ color: '#6e7681' }}>{t}</span>;

function EditorPreview() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 640 }}>
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
              ducklings.dev
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1.15fr', height: 360 }}>
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

          <div style={{ background: 'rgba(255,255,255,0.05)' }} />

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
          <div>
            <Title style={{ marginBottom: '1.5rem' }}>
              Practice coding with
              <br />
              <span style={{ color: '#FFC91A' }}>today's </span>
              tools.
            </Title>

            <Body style={{ maxWidth: 560, marginBottom: '2.25rem' }}>
              Most practice platforms throw problems at you and wait. Duckling is
              different. Every problem is a chance to actually learn, compete, and
              improve your coding skills, targeted for students.
            </Body>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/library" style={{ textDecoration: 'none' }}>
                <MainButton>Try Ducklings Free</MainButton>
              </Link>
              <SubButton>Learn More</SubButton>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: '40px' }}>
            <EditorPreview />
          </div>
        </div>
      </section>

      <div aria-hidden style={{ height: 80 }} />

      <section style={{ padding: '4rem 4rem', maxWidth: '1440px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
        <Title style={{ fontSize: 'clamp(2.8rem, 4vw, 4.5rem)', lineHeight: 0.95, marginBottom: '1.75rem' }}>
          Built by students, for
          <span style={{ color: '#FFC91A' }}> students. </span>
        </Title>
        <Body style={{ maxWidth: 600, margin: '0 auto' }}>
          We've been utilizing computer science practice websites from the start of our computer science career. However, all of these tools were lacking in some way or the other. Ducklings is our attempt.
        </Body>
      </section>

      <section style={{ padding: '0 4rem 10rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '5rem' }}>
          <span
            style={{
              fontFamily: 'Inter',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#FFC91A',
            }}
          >
            How it works
          </span>
          <Title style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.5rem)', lineHeight: 0.95, marginTop: '0.75rem' }}>
            Three steps.<br />
            No fluff.
          </Title>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            {
              n: '01',
              title: 'Pick a problem',
              body: 'Browse a curated set of problems sorted by difficulty and topic. Every problem is chosen because it trains a real pattern, not just to inflate a number.',
            },
            {
              n: '02',
              title: 'Write your solution',
              body: 'Work in a clean split-pane editor — problem statement on the left, your code on the right. Five languages supported. No setup, no IDE required.',
            },
            {
              n: '03',
              title: 'Get unstuck, not just answers',
              body: 'When you hit a wall, ask for a hint. You get a nudge toward the right thinking, not a solution to copy. That\'s the difference between practicing and actually learning.',
            },
          ].map((step) => (
            <div
              key={step.n}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: '0 4rem',
                alignItems: 'start',
                paddingBottom: '4rem',
                marginBottom: '4rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  fontFamily: "'Jersey 10', sans-serif",
                  fontSize: '7.5rem',
                  color: '#FFC91A',
                  lineHeight: 0.85,
                  letterSpacing: '-0.02em',
                  userSelect: 'none',
                }}
              >
                {step.n}
              </div>

              <div style={{ paddingTop: '0.5rem' }}>
                <H1 style={{ fontSize: '1.9rem', marginBottom: '0.875rem' }}>
                  {step.title}
                </H1>
                <Body style={{ fontSize: '1.3rem', lineHeight: 1.7, maxWidth: 560 }}>
                  {step.body}
                </Body>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
