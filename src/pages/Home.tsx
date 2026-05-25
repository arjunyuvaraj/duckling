import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Typewriter from '../components/Typewriter';
import { useState, useEffect } from 'react';

const primaryYellow = '#fbbf24';
const duckAscii = "    __\n  <(o )___\n   ( ._> /\n~~~~`---'~~~~";

function PracticePreview() {
  const [stage, setStage] = useState<'typing_cmd' | 'showing_problem' | 'typing_code' | 'running_tests' | 'success'>('typing_cmd');
  const [typedCmd, setTypedCmd] = useState('');
  const [typedCode, setTypedCode] = useState('');
  const [testsRun, setTestsRun] = useState<string[]>([]);
  const [testCount, setTestCount] = useState(0);

  const commandText = 'solve next_rep --topic arrays';
  const codeText = 'seen[target - value] = index';

  useEffect(() => {
    if (stage === 'typing_cmd') {
      let index = 0;
      const interval = setInterval(() => {
        if (index < commandText.length) {
          setTypedCmd(commandText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => setStage('showing_problem'), 1000);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'showing_problem') {
      const timeout = setTimeout(() => {
        setStage('typing_code');
      }, 2200);
      return () => clearTimeout(timeout);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'typing_code') {
      let index = 0;
      const interval = setInterval(() => {
        if (index < codeText.length) {
          setTypedCode(codeText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setStage('running_tests');
            setTestsRun([]);
            setTestCount(0);
          }, 800);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'running_tests') {
      const testNames = [
        '✓ test_empty_array',
        '✓ test_positive_match',
        '✓ test_negative_match',
        '✓ test_multiple_pairs'
      ];
      let currentTest = 0;
      const interval = setInterval(() => {
        if (currentTest < testNames.length) {
          setTestsRun((prev) => [...prev, testNames[currentTest]]);
          setTestCount((c) => c + 2);
          currentTest++;
        } else {
          clearInterval(interval);
          setTimeout(() => setStage('success'), 600);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'success') {
      const timeout = setTimeout(() => {
        setStage('typing_cmd');
        setTypedCmd('');
        setTypedCode('');
        setTestsRun([]);
        setTestCount(0);
      }, 4500);
      return () => clearTimeout(timeout);
    }
  }, [stage]);

  return (
    <div
      className="practice-preview terminal-window terminal-scanlines glass-panel"
      aria-label="Student coding practice preview"
      style={{
        width: '100%',
        maxWidth: '580px',
        height: '470px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="terminal-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="terminal-dots">
            <span className="terminal-dot terminal-dot-red" />
            <span className="terminal-dot terminal-dot-yellow" />
            <span className="terminal-dot terminal-dot-green" />
          </div>
          <span>/arrays/two-sum</span>
        </div>
        <span>class: intro-cs</span>
      </div>

      <div className="terminal-tabs">
        <div className="terminal-tab active">
          <span className="terminal-tab-dot"></span>
          <span>student.py</span>
        </div>
        <div className="terminal-tab">
          <span>output.log</span>
        </div>
      </div>

      <div className="practice-preview-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="practice-stage">
          <div className="practice-prompt">
            <span>$</span> {typedCmd}
            {stage === 'typing_cmd' && <span className="terminal-caret-blink">▋</span>}
          </div>

          {stage !== 'typing_cmd' && (
            <div
              className="practice-text"
              aria-label="Practice text"
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.45,
                color: '#777',
                marginBottom: '1rem',
                height: '74px',
                overflow: 'hidden',
              }}
            >
              <span className="practice-done" style={{ color: '#aaa' }}>
                for each number, store its complement.
              </span>{' '}
              <span
                className="practice-active"
                style={{
                  color: stage === 'showing_problem' ? '#fff' : '#777',
                  borderBottom: stage === 'showing_problem' ? '2px solid var(--yellow)' : 'none',
                  paddingBottom: '2px',
                }}
              >
                if the complement appears, return both indexes.
              </span>{' '}
              <span style={{ color: '#444' }}>explain why this is O(n).</span>
            </div>
          )}

          {(stage === 'typing_code' || stage === 'running_tests' || stage === 'success') && (
            <div
              className="practice-code-line"
              style={{
                marginTop: '0.5rem',
                background: '#040404',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '0.85rem',
              }}
            >
              <span style={{ color: '#555' }}>student.py</span>
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                {typedCode}
              </strong>
            </div>
          )}

          {stage === 'running_tests' && (
            <div
              style={{
                marginTop: '0.85rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.76rem',
                background: '#020202',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ color: 'var(--yellow)', marginBottom: '0.3rem', fontWeight: 600 }}>
                Running tests...
              </div>
              {testsRun.map((test, i) => (
                <div key={i} className="terminal-success-text" style={{ paddingLeft: '0.4rem', lineHeight: 1.4 }}>
                  {test}
                </div>
              ))}
            </div>
          )}

          {stage === 'success' && (
            <div
              style={{
                marginTop: '0.85rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.76rem',
                background: 'rgba(74, 222, 128, 0.04)',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid rgba(74, 222, 128, 0.18)',
              }}
            >
              <div className="terminal-success-text" style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✓</span> SUCCESS: 8/8 tests passed (0.03s)
              </div>
              <div style={{ color: '#7bb38e', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                Engine trace: feedback loop completed successfully.
              </div>
            </div>
          )}
        </div>

        <div className="practice-meter" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
          <div>
            <span>accuracy</span>
            <strong>{stage === 'success' ? '100%' : stage === 'running_tests' ? `${80 + testCount * 2.5}%` : '94%'}</strong>
          </div>
          <div>
            <span>tests</span>
            <strong>{stage === 'success' ? '8/8' : stage === 'running_tests' ? `${testCount}/8` : '0/8'}</strong>
          </div>
          <div>
            <span>hint level</span>
            <strong>{stage === 'success' ? 'none' : 'nudge'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="grid-backdrop page-flow-enter" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            position: 'relative',
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '4rem 2.5rem',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '4rem',
            alignItems: 'center',
          }}
          className="home-hero-grid"
        >
          <div className="hero-copy-flow">
            <pre className="home-duck-ascii" aria-label="ASCII duck logo">{duckAscii}</pre>
            <div className="home-terminal-kicker">
              <span>$</span> <Typewriter text="duckling classroom --practice" speed={30} delay={100} cursor={false} />
            </div>
            <h1
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 'clamp(2.5rem, 4.5vw, 5.2rem)',
                fontWeight: 850,
                color: '#fff',
                marginBottom: '1.25rem',
                lineHeight: 0.95,
                letterSpacing: 0,
              }}
            >
              Practice code.
              <br />
              <span style={{ color: primaryYellow }}>Get unstuck.</span>
            </h1>

            <p
              style={{
                fontSize: '1.25rem',
                color: '#aaa',
                maxWidth: 580,
                lineHeight: 1.5,
                marginBottom: '2rem',
                fontWeight: 500,
              }}
            >
              Short problems, useful hints, and class-ready progress.
            </p>

            <div className="hero-actions-flow" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link
                to="/get-started"
                className="hero-cta-primary glow-yellow-hover"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '48px',
                  padding: '0 1.75rem',
                  background: primaryYellow,
                  color: '#171100',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
                  borderRadius: '8px',
                  textDecoration: 'none',
                  letterSpacing: 0,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 10px rgba(251, 191, 36, 0.15)',
                  transition: 'all 0.15s ease',
                }}
              >
                Start Practicing
              </Link>
              <Link
                to="/login"
                className="hero-cta-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '48px',
                  padding: '0 1.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#e0e0e0',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
                  letterSpacing: 0,
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Log In
              </Link>
            </div>

            <div className="home-terminal-badges" aria-label="Duckling product highlights">
              <span>students: practice</span>
              <span>teachers: assign</span>
              <span>feedback: hint-first</span>
            </div>
          </div>

          <div className="hero-preview-flow" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <PracticePreview />
          </div>
        </div>
      </section>

      <section
        className="home-terminal-section"
        style={{
          padding: '5rem 2.5rem',
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div className="terminal-line">
          <span>$</span> <Typewriter text="duckling about --audience" speed={30} delay={200} cursor={false} />
        </div>
        <h2
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 'clamp(2rem, 3.2vw, 3.2rem)',
            fontWeight: 850,
            color: '#fff',
            lineHeight: 1.05,
            marginBottom: '1.25rem',
            maxWidth: 850,
            letterSpacing: 0,
          }}
        >
          A practice workspace that works for both sides of the classroom.
        </h2>
        <p
          style={{
            fontFamily: 'Inter',
            fontSize: '1.15rem',
            color: '#a0a0a0',
            lineHeight: 1.6,
            fontWeight: 500,
            maxWidth: 820,
          }}
        >
          Students get a calm coding environment with feedback that nudges them forward.
          Teachers get a clearer way to assign practice, review progress, and keep everyone moving.
        </p>
      </section>

      <section style={{ padding: '3rem 2.5rem 8rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '3.5rem' }}>
          <div className="terminal-line">
            <span>$</span> <Typewriter text="duckling workflow --short" speed={30} delay={200} cursor={false} />
          </div>
          <h2
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 'clamp(2rem, 3.2vw, 3.2rem)',
              fontWeight: 850,
              color: '#fff',
              lineHeight: 1.05,
              marginTop: '0.75rem',
              letterSpacing: 0,
            }}
          >
            Focused practice, classroom ready.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}
        >
          {[
            {
              n: '01',
              title: 'Assign or choose a problem',
              body: 'Teachers can frame practice around class goals. Students can also jump into curated problems by topic and difficulty.',
            },
            {
              n: '02',
              title: 'Solve in a real editor flow',
              body: 'The workspace keeps the prompt, code, tests, and feedback close together so students stay focused.',
            },
            {
              n: '03',
              title: 'Learn from the attempt',
              body: 'Hints and test results point students toward the next idea without turning practice into copy-paste.',
            },
          ].map((step) => (
            <div
              key={step.n}
              className="terminal-window terminal-scanlines glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div className="terminal-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="terminal-dots">
                    <span className="terminal-dot terminal-dot-red" />
                    <span className="terminal-dot terminal-dot-yellow" />
                    <span className="terminal-dot terminal-dot-green" />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#666' }}>workflow/{step.n}</span>
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div
                    className="jersey-header"
                    style={{
                      fontSize: '3.6rem',
                      fontWeight: 800,
                      color: primaryYellow,
                      lineHeight: 1,
                      marginBottom: '0.75rem',
                      userSelect: 'none',
                    }}
                  >
                    {step.n}
                  </div>
                  <h3
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 700,
                      fontSize: '1.35rem',
                      color: '#fff',
                      marginBottom: '0.75rem',
                      lineHeight: 1.2,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'Inter',
                      fontSize: '0.95rem',
                      color: '#999',
                      lineHeight: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
