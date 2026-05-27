import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import {
  ALL_PROBLEMS, TOPICS, DIFFICULTIES, LANGUAGES, PROBLEM_SETS, BATCHES, TAGS, DIFFICULTY_COLOR,
  type Difficulty, type Language,
} from '../data/problems';
import { getSolvedIds } from '../utils/progress';
import { GridCorner } from '../components/ui';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
  </svg>
);

function IconBtn({
  onClick, active = false, title, dot = false, children,
}: {
  onClick?: () => void; active?: boolean; title?: string; dot?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        position: 'relative',
        width: 42, height: 42,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        background: active ? '#1c1c1c' : '#111',
        border: `1px solid ${active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#fff',
        outline: 'none',
      }}
    >
      {children}
      {dot && (
        <span style={{
          position: 'absolute', top: 7, right: 7,
          width: 6, height: 6, borderRadius: '50%',
          background: '#fa5d19',
        }} />
      )}
    </button>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'Inter', fontSize: '0.82rem', fontWeight: 500,
        padding: '5px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        outline: 'none',
        background: active ? '#222' : 'transparent',
        color: active ? '#e0e0e0' : '#505050',
        border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

const COL_HEADER: React.CSSProperties = {
  fontFamily: 'Inter',
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#444',
  userSelect: 'none',
};

export default function Library() {
  const [search, setSearch]             = useState('');
  const [difficulty, setDifficulty]     = useState<'All' | Difficulty>('All');
  const [language, setLanguage]         = useState<'All' | Language>('All');
  const [topic, setTopic]               = useState('All');
  const [problemSet, setProblemSet]     = useState('All');
  const [batch, setBatch]               = useState('All');
  const [tag, setTag]                   = useState('All');
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isShuffled, setIsShuffled]     = useState(false);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [solved]                        = useState<Set<number>>(getSolvedIds);
  const navigate = useNavigate();

  const filterWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    function onOutside(e: MouseEvent) {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [filterOpen]);

  const hasActiveFilter =
    difficulty !== 'All' ||
    language !== 'All' ||
    topic !== 'All' ||
    problemSet !== 'All' ||
    batch !== 'All' ||
    tag !== 'All';

  const filtered = useMemo(() => {
    let list = ALL_PROBLEMS.filter(p => {
      if (difficulty !== 'All' && p.difficulty !== difficulty) return false;
      if (language !== 'All' && p.language !== language) return false;
      if (topic !== 'All' && p.topic !== topic) return false;
      if (problemSet !== 'All' && p.set !== problemSet) return false;
      if (batch !== 'All' && p.batch !== batch) return false;
      if (tag !== 'All' && !p.tags.includes(tag)) return false;
      if (search) {
        const haystack = [p.title, p.topic, p.set, p.batch, p.language, p.difficulty, ...p.tags].join(' ').toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    if (isShuffled) list = shuffleArray(list);
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, difficulty, language, topic, problemSet, batch, tag, isShuffled, shuffleCount]);

  const handleShuffle = () => { setShuffleCount(c => c + 1); setIsShuffled(true); };
  const handleUnshuffle = () => setIsShuffled(false);

  const GRID = '52px minmax(220px, 2.4fr) minmax(140px, 1fr) minmax(180px, 1.25fr) 92px 104px';

  return (
    <div className="grid-backdrop" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <AppNavbar />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', padding: '0 1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', padding: '1.35rem 0 0.25rem', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: '#fa5d19', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.45rem' }}>
              <span style={{ color: '#fa5d19' }}>$</span> duckling library --practice
            </div>
            <h1 style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', fontSize: 'clamp(1.8rem, 3vw, 2.65rem)', lineHeight: 1, fontWeight: 850, letterSpacing: 0, margin: 0 }}>
              Choose your next problem.
            </h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(92px, 1fr))', gap: '0.65rem', flexShrink: 0 }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, background: '#080808', padding: '0.7rem 0.85rem' }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: '#777', fontSize: '0.68rem', marginBottom: '0.25rem' }}>solved</div>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: '#fff', fontSize: '1rem', fontWeight: 900 }}>{solved.size}/{ALL_PROBLEMS.length}</div>
            </div>
            <div style={{ border: '1px solid rgba(250,93,25,0.18)', borderRadius: 8, background: 'rgba(250,93,25,0.06)', padding: '0.7rem 0.85rem' }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: '#c44810', fontSize: '0.68rem', marginBottom: '0.25rem' }}>showing</div>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: '#fa5d19', fontSize: '1rem', fontWeight: 900 }}>{filtered.length}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '1.25rem 0', flexShrink: 0 }}>

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 14, color: '#444', display: 'flex', pointerEvents: 'none' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search questions"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '8px',
                padding: '0 1rem 0 2.5rem',
                height: 44,
                color: '#e0e0e0',
                fontFamily: 'Inter',
                fontSize: '0.95rem',
                outline: 'none',
                caretColor: '#fa5d19',
              }}
            />
          </div>

          <div ref={filterWrapRef} style={{ position: 'relative' }}>
            <IconBtn
              onClick={() => setFilterOpen(o => !o)}
              active={filterOpen || hasActiveFilter}
              dot={hasActiveFilter && !filterOpen}
              title="Filter"
            >
              <FilterIcon />
            </IconBtn>

            {filterOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                left: 0,
                zIndex: 100,
                background: '#0f0f0f',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '8px',
                padding: '1.25rem',
                width: 320,
                boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}>
                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Set</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {PROBLEM_SETS.map(s => (
                      <FilterChip key={s} label={s} active={problemSet === s} onClick={() => setProblemSet(s)} />
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Batch</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: 112, overflow: 'auto' }}>
                    {BATCHES.map(b => (
                      <FilterChip key={b} label={b} active={batch === b} onClick={() => setBatch(b)} />
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Difficulty</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {DIFFICULTIES.map(d => (
                      <FilterChip key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Language</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {LANGUAGES.map(l => (
                      <FilterChip key={l} label={l} active={language === l} onClick={() => setLanguage(l)} />
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Tag</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: 112, overflow: 'auto' }}>
                    {TAGS.map(t => (
                      <FilterChip key={t} label={t} active={tag === t} onClick={() => setTag(t)} />
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Topic</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {TOPICS.map(t => (
                      <FilterChip key={t} label={t} active={topic === t} onClick={() => setTopic(t)} />
                    ))}
                  </div>
                </div>

                {hasActiveFilter && (
                  <button
                    onClick={() => {
                      setDifficulty('All');
                      setLanguage('All');
                      setTopic('All');
                      setProblemSet('All');
                      setBatch('All');
                      setTag('All');
                    }}
                    style={{
                      fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 600,
                      color: '#fa5d19', background: 'transparent', border: 'none',
                      cursor: 'pointer', outline: 'none', textAlign: 'left', padding: 0,
                    }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          <IconBtn
            onClick={isShuffled ? handleUnshuffle : handleShuffle}
            active={isShuffled}
            title={isShuffled ? 'Unshuffle' : 'Shuffle'}
          >
            <ShuffleIcon />
          </IconBtn>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.09)', background: '#080808', position: 'relative' }}>
          <GridCorner position="top-left" />
          <GridCorner position="top-right" />
          <GridCorner position="bottom-left" />
          <GridCorner position="bottom-right" />

          <div style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            padding: '0 1.5rem',
            height: 44,
            alignItems: 'center',
            background: '#0a0a0a',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={COL_HEADER}>#</span>
            <span style={COL_HEADER}>Title</span>
            <span style={COL_HEADER}>Set</span>
            <span style={COL_HEADER}>Batch</span>
            <span style={COL_HEADER}>Language</span>
            <span style={{ ...COL_HEADER, textAlign: 'right' }}>Difficulty</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center', background: '#0a0a0a' }}>
              <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#777', fontSize: '1.05rem', fontWeight: 650 }}>
                No problems match your filters.
              </div>
            </div>
          ) : (
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map((p, i) => (
                <div
                  key={p.id}
                  className="library-problem-row"
                  onClick={() => navigate(`/problem/${p.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID,
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    height: 58,
                    background: i % 2 === 0 ? '#101010' : '#0a0a0a',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.88rem', color: solved.has(p.id) ? '#4ade80' : '#555', fontWeight: 800, letterSpacing: 0 }}>
                    {solved.has(p.id) ? '✓' : p.id}
                  </span>

                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.95rem', color: '#fff',
                    fontWeight: 650, letterSpacing: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.title}
                  </span>

                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.82rem', color: '#bbb',
                    fontWeight: 650, letterSpacing: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.set}
                  </span>

                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.82rem', color: '#777',
                    fontWeight: 600, letterSpacing: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.batch}
                  </span>

                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.95rem', color: '#ddd',
                    fontWeight: 500, letterSpacing: 0,
                  }}>
                    {p.language}
                  </span>

                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.95rem', fontWeight: 600,
                    color: DIFFICULTY_COLOR[p.difficulty],
                    letterSpacing: 0,
                    textAlign: 'right',
                  }}>
                    {p.difficulty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: '1.25rem', flexShrink: 0 }} />
      </div>
    </div>
  );
}
