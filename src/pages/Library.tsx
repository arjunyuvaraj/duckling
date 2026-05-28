import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ALL_PROBLEMS, TOPICS, DIFFICULTIES, LANGUAGES, PROBLEM_SETS, BATCHES, TAGS, DIFFICULTY_COLOR,
  type Difficulty, type Language,
} from '../data/problems';
import { getSolvedIds } from '../utils/progress';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFA100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function IconBtn({
  onClick, active = false, title, children,
}: {
  onClick?: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        background: active ? '#161616' : 'transparent',
        border: `1px solid ${active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        color: active ? '#fff' : '#888',
        outline: 'none',
        transition: 'background 0.12s ease, color 0.12s ease, border-color 0.12s ease',
      }}
    >
      {children}
    </button>
  );
}

function FilterSection({ title, items, active, onSelect, maxVisible = 99 }: {
  title: string; items: string[]; active: string;
  onSelect: (v: string) => void; maxVisible?: number;
}) {
  return (
    <div>
      <div style={{
        padding: '0.6rem 1rem 0.3rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '0.68rem', fontWeight: 600,
        color: '#555', letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        {title}
      </div>
      <div className="no-scrollbar" style={{ maxHeight: items.length > maxVisible ? '180px' : 'none', overflowY: 'auto' }}>
        {items.map(item => {
          const isActive = active === item;
          return (
            <button
              key={item}
              onClick={() => onSelect(item)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', height: 40, padding: '0 1rem',
                background: 'transparent', border: 'none',
                color: isActive ? '#FFA100' : '#c8c8c8',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.88rem', fontWeight: isActive ? 500 : 400,
                cursor: 'pointer', textAlign: 'left',
                transition: 'color 0.12s ease',
              }}
            >
              <span>{item}</span>
              {isActive && <CheckIcon />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const COL_HEADER: React.CSSProperties = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '0.68rem',
  fontWeight: 500,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: '#666',
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

  const handleShuffle   = () => { setShuffleCount(c => c + 1); setIsShuffled(true); };
  const handleUnshuffle = () => setIsShuffled(false);

  const clearFilters = () => {
    setDifficulty('All'); setLanguage('All'); setTopic('All');
    setProblemSet('All'); setBatch('All'); setTag('All');
  };

  const activeFilterCount = [
    difficulty !== 'All', language !== 'All', topic !== 'All',
    problemSet !== 'All', batch !== 'All', tag !== 'All',
  ].filter(Boolean).length;

  const GRID = '52px minmax(220px, 2.4fr) minmax(140px, 1fr) minmax(180px, 1.25fr) 92px 104px';

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 1.5rem' }}>

        <div style={{ padding: '2.5rem 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div>
              <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", color: '#fff', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', lineHeight: 1.1, fontWeight: 400, letterSpacing: '-0.01em', margin: '0 0 0.4rem' }}>
                Problem Library
              </h1>
              <p style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#888', fontSize: '0.95rem', fontWeight: 400, margin: 0, lineHeight: 1.5 }}>
                Browse and practice coding problems across all topics and difficulty levels.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, paddingTop: '0.2rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#888', fontSize: '0.72rem', fontWeight: 500, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Solved</div>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>{solved.size}<span style={{ color: '#888', fontWeight: 400 }}>/{ALL_PROBLEMS.length}</span></div>
              </div>
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#888', fontSize: '0.72rem', fontWeight: 500, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Showing</div>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#FFA100', fontSize: '1.1rem', fontWeight: 700 }}>{filtered.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 0 1rem', flexShrink: 0 }}>

          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1', maxWidth: 380 }}>
            <span style={{ position: 'absolute', left: 12, color: '#666', display: 'flex', pointerEvents: 'none' }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: '#090909',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '0 1rem 0 2.25rem',
                height: 36,
                color: '#e0e0e0',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 400,
                outline: 'none',
                caretColor: '#FFA100',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Filter pill button + dropdown */}
          <div ref={filterWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                height: 36, padding: '0 0.85rem',
                background: filterOpen || hasActiveFilter ? '#161616' : '#090909',
                border: `1px solid ${filterOpen || hasActiveFilter ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: hasActiveFilter ? '#FFA100' : '#c0c0c0',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'background 0.12s ease, border-color 0.12s ease, color 0.12s ease',
              }}
            >
              <FilterIcon />
              <span>{activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}</span>
              <span style={{
                opacity: 0.5,
                display: 'inline-flex',
                transform: filterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.18s ease',
              }}>
                <ChevronDownIcon />
              </span>
            </button>

            {filterOpen && (
              <div className="animate-dropdown-in" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                zIndex: 100,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '12px',
                width: 260,
                boxShadow: '0 20px 56px rgba(0,0,0,0.8)',
                overflow: 'hidden',
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  flexShrink: 0,
                }}>
                  <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem', fontWeight: 500, color: '#888' }}>
                    Filter by
                  </span>
                  <button
                    onClick={() => setFilterOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 4, transition: 'color 0.12s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#999')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#555')}
                  >
                    <XIcon />
                  </button>
                </div>

                {/* Sections */}
                <div className="no-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
                  <FilterSection title="Difficulty" items={DIFFICULTIES} active={difficulty} onSelect={setDifficulty} />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 1rem' }} />
                  <FilterSection title="Language" items={LANGUAGES} active={language} onSelect={setLanguage} />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 1rem' }} />
                  <FilterSection title="Topic" items={TOPICS} active={topic} onSelect={setTopic} maxVisible={5} />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 1rem' }} />
                  <FilterSection title="Set" items={PROBLEM_SETS} active={problemSet} onSelect={setProblemSet} />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 1rem' }} />
                  <FilterSection title="Batch" items={BATCHES} active={batch} onSelect={setBatch} maxVisible={5} />
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 1rem' }} />
                  <FilterSection title="Tag" items={TAGS} active={tag} onSelect={setTag} maxVisible={5} />
                  <div style={{ height: '0.5rem' }} />
                </div>

                {/* Clear all footer */}
                {hasActiveFilter && (
                  <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                    <button
                      onClick={clearFilters}
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', fontWeight: 600,
                        color: '#FFA100', background: 'transparent', border: 'none',
                        cursor: 'pointer', outline: 'none', padding: 0,
                      }}
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shuffle */}
          <IconBtn
            onClick={isShuffled ? handleUnshuffle : handleShuffle}
            active={isShuffled}
            title={isShuffled ? 'Unshuffle' : 'Shuffle'}
          >
            <ShuffleIcon />
          </IconBtn>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            padding: '0 1.5rem',
            height: 40,
            alignItems: 'center',
            background: '#070707',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <span style={COL_HEADER}>#</span>
            <span style={COL_HEADER}>Title</span>
            <span style={COL_HEADER}>Set</span>
            <span style={COL_HEADER}>Batch</span>
            <span style={COL_HEADER}>Language</span>
            <span style={{ ...COL_HEADER, textAlign: 'right' }}>Difficulty</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#777', fontSize: '0.95rem', fontWeight: 400 }}>
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
                    height: 52,
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: solved.has(p.id) ? '#4ade80' : '#666', fontWeight: 600, letterSpacing: 0 }}>
                    {solved.has(p.id) ? '✓' : p.id}
                  </span>

                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', color: '#e0e0e0',
                    fontWeight: 500, letterSpacing: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.title}
                  </span>

                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: '#888',
                    fontWeight: 400, letterSpacing: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.set}
                  </span>

                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: '#888',
                    fontWeight: 400, letterSpacing: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.batch}
                  </span>

                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem', color: '#bbb',
                    fontWeight: 400, letterSpacing: 0,
                  }}>
                    {p.language}
                  </span>

                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', fontWeight: 500,
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
  );
}
