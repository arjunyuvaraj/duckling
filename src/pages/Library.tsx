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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FD6D03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function IconBtn({ onClick, active = false, title, children }: {
  onClick?: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 36, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      background: active ? 'var(--surface-3)' : 'transparent',
      border: `1px solid var(--border)`,
      borderRadius: '8px',
      cursor: 'pointer',
      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      outline: 'none',
      transition: 'background 0.12s ease, color 0.12s ease',
    }}>
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
      <div style={{ padding: '0.6rem 1rem 0.3rem', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-subtle)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div className="no-scrollbar" style={{ maxHeight: items.length > maxVisible ? '180px' : 'none', overflowY: 'auto' }}>
        {items.map(item => {
          const isActive = active === item;
          return (
            <button key={item} onClick={() => onSelect(item)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', height: 40, padding: '0 1rem',
              background: 'transparent', border: 'none',
              color: isActive ? '#FD6D03' : 'var(--text-primary)',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.88rem', fontWeight: isActive ? 500 : 400,
              cursor: 'pointer', textAlign: 'left',
              transition: 'color 0.12s ease',
            }}>
              <span>{item}</span>
              {isActive && <CheckIcon />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
    difficulty !== 'All' || language !== 'All' || topic !== 'All' ||
    problemSet !== 'All' || batch !== 'All' || tag !== 'All';

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
    if (isShuffled) {
      list = shuffleArray(list);
      if (shuffleCount % 2 === 1) list.reverse();
    }
    return list;
  }, [search, difficulty, language, topic, problemSet, batch, tag, isShuffled, shuffleCount]);

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '2rem 1.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', lineHeight: 1.1, fontWeight: 400, letterSpacing: '-0.01em', margin: '0 0 0.4rem' }}>
            Problem Library
          </h1>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 400, margin: 0, lineHeight: 1.5 }}>
            Browse and practice coding problems across all topics and difficulty levels.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0, paddingTop: '0.2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Solved</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>
              {solved.size}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/{ALL_PROBLEMS.length}</span>
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Showing</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#FD6D03', fontSize: '1rem', fontWeight: 700 }}>{filtered.length}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1', maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0 1rem 0 2.25rem',
              height: 36,
              color: 'var(--text-primary)',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.875rem',
              outline: 'none',
              caretColor: '#FD6D03',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
        <div ref={filterWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              height: 36, padding: '0 0.85rem',
              background: filterOpen || hasActiveFilter ? 'var(--surface-3)' : 'var(--surface)',
              border: `1px solid ${filterOpen || hasActiveFilter ? 'var(--border-hover)' : 'var(--border)'}`,
              borderRadius: '8px',
              color: hasActiveFilter ? '#FD6D03' : 'var(--text-muted)',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.875rem', fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'background 0.12s ease, border-color 0.12s ease, color 0.12s ease',
            }}
          >
            <FilterIcon />
            <span>{activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}</span>
            <span style={{ opacity: 0.5, display: 'inline-flex', transform: filterOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}>
              <ChevronDownIcon />
            </span>
          </button>

          {filterOpen && (
            <div className="animate-dropdown-in" style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 100,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', width: 260,
              boxShadow: '0 20px 56px rgba(0,0,0,0.18)',
              overflow: 'hidden', maxHeight: '70vh',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-muted)' }}>Filter by</span>
                <button onClick={() => setFilterOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 4, transition: 'color 0.12s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
                >
                  <XIcon />
                </button>
              </div>
              <div className="no-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
                <FilterSection title="Difficulty" items={DIFFICULTIES} active={difficulty} onSelect={(v) => setDifficulty(v as Difficulty | 'All')} />
                <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem' }} />
                <FilterSection title="Language" items={LANGUAGES} active={language} onSelect={(v) => setLanguage(v as Language | 'All')} />
                <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem' }} />
                <FilterSection title="Topic" items={TOPICS} active={topic} onSelect={setTopic} maxVisible={5} />
                <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem' }} />
                <FilterSection title="Set" items={PROBLEM_SETS} active={problemSet} onSelect={setProblemSet} />
                <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem' }} />
                <FilterSection title="Batch" items={BATCHES} active={batch} onSelect={setBatch} maxVisible={5} />
                <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem' }} />
                <FilterSection title="Tag" items={TAGS} active={tag} onSelect={setTag} maxVisible={5} />
                <div style={{ height: '0.5rem' }} />
              </div>
              {hasActiveFilter && (
                <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                  <button onClick={clearFilters} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: '#FD6D03', background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', padding: 0 }}>
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <IconBtn onClick={isShuffled ? () => setIsShuffled(false) : () => { setShuffleCount(c => c + 1); setIsShuffled(true); }} active={isShuffled} title={isShuffled ? 'Unshuffle' : 'Shuffle'}>
          <ShuffleIcon />
        </IconBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '0 1.75rem', height: 40, alignItems: 'center', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {(['#', 'Title', 'Set', 'Batch', 'Language', 'Difficulty'] as const).map((h, i) => (
          <span key={h} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-subtle)', userSelect: 'none', textAlign: i === 5 ? 'right' : 'left' }}>
            {h}
          </span>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
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
                padding: '0 1.75rem',
                height: 52,
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-faint)' : 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: solved.has(p.id) ? '#45c46f' : 'var(--text-subtle)', fontWeight: 600 }}>
                {solved.has(p.id) ? 'Done' : p.id}
              </span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title}
              </span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.set}
              </span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.batch}
              </span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {p.language}
              </span>
              <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', fontWeight: 500, color: DIFFICULTY_COLOR[p.difficulty], textAlign: 'right' }}>
                {p.difficulty}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
