import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { Body } from '../components/ui';
import {
  ALL_PROBLEMS, TOPICS, DIFFICULTIES, LANGUAGES, DIFFICULTY_COLOR,
  type Difficulty, type Language,
} from '../data/problems';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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

// ─── Small components ─────────────────────────────────────────────────────────

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
        borderRadius: '10px',
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
          background: '#FFC91A',
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Library() {
  const [search, setSearch]             = useState('');
  const [difficulty, setDifficulty]     = useState<'All' | Difficulty>('All');
  const [language, setLanguage]         = useState<'All' | Language>('All');
  const [topic, setTopic]               = useState('All');
  const [shuffleCount, setShuffleCount] = useState(0);
  const [isShuffled, setIsShuffled]     = useState(false);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [solved]                        = useState<Set<number>>(new Set());
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

  const hasActiveFilter = difficulty !== 'All' || language !== 'All' || topic !== 'All';

  const filtered = useMemo(() => {
    let list = ALL_PROBLEMS.filter(p => {
      if (difficulty !== 'All' && p.difficulty !== difficulty) return false;
      if (language !== 'All' && p.language !== language) return false;
      if (topic !== 'All' && p.topic !== topic) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (isShuffled) list = shuffleArray(list);
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, difficulty, language, topic, isShuffled, shuffleCount]);

  const handleShuffle = () => { setShuffleCount(c => c + 1); setIsShuffled(true); };
  const handleUnshuffle = () => setIsShuffled(false);

  // columns: [52px #] [title flex-3] [language flex-1] [acceptance flex-1] [difficulty flex-1]
  const GRID = '52px 3fr 1fr 1fr 1fr';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
      <AppNavbar />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', padding: '0 1.5rem' }}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '1.25rem 0', flexShrink: 0 }}>

          {/* Search */}
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
                borderRadius: '10px',
                padding: '0 1rem 0 2.5rem',
                height: 44,
                color: '#e0e0e0',
                fontFamily: 'Inter',
                fontSize: '0.95rem',
                outline: 'none',
                caretColor: '#FFC91A',
              }}
            />
          </div>

          {/* Filter button + popup */}
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
                borderRadius: '14px',
                padding: '1.25rem',
                width: 320,
                boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}>
                {/* Difficulty */}
                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Difficulty</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {DIFFICULTIES.map(d => (
                      <FilterChip key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Language</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {LANGUAGES.map(l => (
                      <FilterChip key={l} label={l} active={language === l} onClick={() => setLanguage(l)} />
                    ))}
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <div style={{ ...COL_HEADER, marginBottom: '0.5rem' }}>Topic</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {TOPICS.map(t => (
                      <FilterChip key={t} label={t} active={topic === t} onClick={() => setTopic(t)} />
                    ))}
                  </div>
                </div>

                {/* Clear */}
                {hasActiveFilter && (
                  <button
                    onClick={() => { setDifficulty('All'); setLanguage('All'); setTopic('All'); }}
                    style={{
                      fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 600,
                      color: '#FFC91A', background: 'transparent', border: 'none',
                      cursor: 'pointer', outline: 'none', textAlign: 'left', padding: 0,
                    }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Solved count */}
          <Body style={{ fontSize: '0.9rem', color: '#3a3a3a', whiteSpace: 'nowrap' }}>
            {solved.size}/{filtered.length} solved
          </Body>

          {/* Shuffle */}
          <IconBtn
            onClick={isShuffled ? handleUnshuffle : handleShuffle}
            active={isShuffled}
            title={isShuffled ? 'Unshuffle' : 'Shuffle'}
          >
            <ShuffleIcon />
          </IconBtn>
        </div>

        {/* ── Problem table ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>

          {/* Header */}
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
            <span style={COL_HEADER}>Language</span>
            <span style={{ ...COL_HEADER, textAlign: 'right' }}>Acceptance</span>
            <span style={{ ...COL_HEADER, textAlign: 'right' }}>Difficulty</span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center', background: '#0a0a0a' }}>
              <Body style={{ color: '#2e2e2e' }}>No problems match your filters.</Body>
            </div>
          ) : (
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/problem/${p.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID,
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    height: 58,
                    background: i % 2 === 0 ? '#131313' : '#0a0a0a',
                    cursor: 'pointer',
                  }}
                >
                  {/* Number */}
                  <span style={{ fontFamily: 'Inter', fontSize: '0.95rem', color: '#444', fontWeight: 500, letterSpacing: '-0.02em' }}>
                    {p.id}
                  </span>

                  {/* Title */}
                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.95rem', color: '#fff',
                    fontWeight: 500, letterSpacing: '-0.02em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.title}
                  </span>

                  {/* Language */}
                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.95rem', color: '#fff',
                    fontWeight: 500, letterSpacing: '-0.02em',
                  }}>
                    {p.language}
                  </span>

                  {/* Acceptance */}
                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.95rem', color: '#fff',
                    fontWeight: 500, letterSpacing: '-0.02em',
                    textAlign: 'right',
                  }}>
                    {p.acceptance.toFixed(1)}%
                  </span>

                  {/* Difficulty */}
                  <span style={{
                    fontFamily: 'Inter', fontSize: '0.95rem', fontWeight: 600,
                    color: DIFFICULTY_COLOR[p.difficulty],
                    letterSpacing: '-0.02em',
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
