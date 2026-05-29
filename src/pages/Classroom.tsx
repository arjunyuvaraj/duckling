import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Problem } from '../data/problems';
import { apiFetch } from '../utils/api';

interface ClassAssignment {
  id?: string;
  problem_id: number;
  problem_title: string;
  title?: string;
  instructions?: string;
  due_at?: string | null;
}

interface ProblemPack {
  id: string;
  set: string;
  batch: string;
  language: string;
  topic: string;
  difficulty: string;
  tags: string[];
  problem_ids: number[];
  count: number;
}

interface ClassRoom {
  id: string;
  name: string;
  description: string;
  code: string;
  language_focus: string;
  role: 'teacher' | 'student';
  student_count: number;
  assignments: ClassAssignment[];
}

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

export default function Classroom() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'pack' | 'single'>('pack');
  const [problemId, setProblemId] = useState('');
  const [packId, setPackId] = useState('');
  const [packs, setPacks] = useState<ProblemPack[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [instructions, setInstructions] = useState('');
  const [activePanel, setActivePanel] = useState<'stream' | 'classwork'>('stream');

  const selected = useMemo(
    () => classes.find((classroom) => classroom.id === selectedId) ?? classes[0] ?? null,
    [classes, selectedId],
  );
  const selectedPack = packs.find((pack) => pack.id === packId);
  const selectedProblem = problems.find((problem) => problem.id === Number(problemId));

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch<{ packs: ProblemPack[] }>('/problems/packs'),
      apiFetch<{ problems: Problem[] }>('/problems'),
    ])
      .then(([packData, problemData]) => {
        if (cancelled) return;
        setPacks(packData.packs);
        setProblems(problemData.problems);
        setPackId((current) => current || packData.packs[0]?.id || '');
        setProblemId((current) => current || String(problemData.problems[0]?.id ?? ''));
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : 'Could not load backend problem packs.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ classes: ClassRoom[] }>('/classes')
      .then((data) => {
        if (cancelled) return;
        setClasses(data.classes);
        setSelectedId(data.classes[0]?.id ?? null);
      })
      .catch((error) => {
        if (cancelled) return;
        setClasses([]);
        setSelectedId(null);
        setMessage(error instanceof Error ? error.message : 'Could not load classes from the backend.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = className.trim();
    if (!name) return;

    try {
      const data = await apiFetch<{ class: ClassRoom }>('/classes', {
        method: 'POST',
        body: JSON.stringify({ name, description, language_focus: 'Mixed' }),
      });
      const next = [data.class, ...classes.filter((item) => item.id !== data.class.id)];
      setClasses(next);
      setSelectedId(data.class.id);
      setActivePanel('stream');
      setMessage('Class created in the database.');
      setClassName('');
      setDescription('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Class creation failed.');
    }
  }

  async function joinClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    try {
      const data = await apiFetch<{ class: ClassRoom }>('/classes/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setClasses([data.class, ...classes.filter((item) => item.id !== data.class.id)]);
      setSelectedId(data.class.id);
      setActivePanel('stream');
      setJoinCode('');
      setMessage('Joined class from the database.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Class code not found.');
    }
  }

  async function assignProblem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const problemIds = assignmentMode === 'pack'
      ? selectedPack?.problem_ids ?? []
      : [Number(problemId)];
    const selectedProblems = problemIds
      .map((id) => problems.find((item) => item.id === id))
      .filter((problem): problem is Problem => Boolean(problem));

    if (selectedProblems.length === 0) {
      setMessage('Choose a valid problem or pack.');
      return;
    }

    try {
      const data = await apiFetch<{ assignments?: ClassAssignment[]; assignment?: ClassAssignment }>(`/classes/${selected.id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          problem_ids: selectedProblems.map((problem) => problem.id),
          pack_id: assignmentMode === 'pack' ? packId : undefined,
          instructions,
        }),
      });
      const created = data.assignments ?? (data.assignment ? [data.assignment] : []);
      setClasses(classes.map((item) => item.id === selected.id ? { ...item, assignments: [...created, ...item.assignments] } : item));
      setInstructions('');
      setActivePanel('classwork');
      setMessage(`${created.length || selectedProblems.length} assignment${(created.length || selectedProblems.length) === 1 ? '' : 's'} posted to the database.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Assignment failed.');
    }
  }

  return (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', background: '#050505' }}>
      <main style={{ width: 'min(1220px, calc(100% - 2rem))', margin: '0 auto', padding: '2rem 0 4rem' }}>
        <header className="classroom-page-header" style={pageHeader}>
          <div>
            <div style={{ ...mono, color: '#ffc72c', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.55rem' }}>
              $ duckling classroom --live
            </div>
            <h1 style={pageTitle}>Classroom</h1>
            <p style={pageCopy}>Manage classes, assign problem packs, and keep students moving without leaving the Duckling workspace.</p>
          </div>
          <div style={statusPill}>database synced</div>
        </header>

        {message && <div style={notice}>{message}</div>}

        <section className="classroom-layout" style={layoutGrid}>
          <aside className="classroom-sidebar" style={sidebar}>
            <form onSubmit={createClass} style={compactPanel}>
              <div>
                <strong style={panelTitle}>Create class</strong>
                <p style={panelHint}>For teachers setting up a new section.</p>
              </div>
              <input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Intro CS Period 3" style={inputStyle} />
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short class description" style={{ ...inputStyle, minHeight: 76, paddingTop: '0.7rem', resize: 'vertical' }} />
              <button style={primaryButton}>Create</button>
            </form>

            <form onSubmit={joinClass} style={compactPanel}>
              <div>
                <strong style={panelTitle}>Join class</strong>
                <p style={panelHint}>Students can enter a teacher code.</p>
              </div>
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="ABC123" style={{ ...inputStyle, textTransform: 'uppercase' }} />
              <button style={secondaryButton}>Join</button>
            </form>

            <div style={classList}>
              <div style={listHeader}>Classes</div>
              {classes.length === 0 ? (
                <div style={emptyState}>Create or join your first class.</div>
              ) : classes.map((classroom) => (
                <button
                  key={classroom.id}
                  onClick={() => {
                    setSelectedId(classroom.id);
                    setActivePanel('stream');
                  }}
                  style={{
                    ...classButton,
                    ...(selected?.id === classroom.id ? selectedClassButton : {}),
                  }}
                >
                  <span style={classStripe} />
                  <span style={{ minWidth: 0 }}>
                    <span style={classNameStyle}>{classroom.name}</span>
                    <span style={classMeta}>{classroom.role} / {classroom.assignments.length} assignments</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section style={contentPanel}>
            {selected ? (
              <>
                <div className="classroom-banner" style={classBanner}>
                  <div style={{ minWidth: 0 }}>
                    <div style={bannerEyebrow}>{selected.role === 'teacher' ? 'Teacher view' : 'Student view'}</div>
                    <h2 style={bannerTitle}>{selected.name}</h2>
                    <p style={bannerCopy}>{selected.description || 'A shared space for assignments, practice, and class updates.'}</p>
                  </div>
                  <div style={classCodeBox}>
                    <span style={codeLabel}>class code</span>
                    <strong>{selected.code}</strong>
                  </div>
                </div>

                <nav style={tabs}>
                  <button onClick={() => setActivePanel('stream')} style={activePanel === 'stream' ? activeTab : tab}>Stream</button>
                  <button onClick={() => setActivePanel('classwork')} style={activePanel === 'classwork' ? activeTab : tab}>Classwork</button>
                </nav>

                <div className="classroom-main-columns" style={mainColumns}>
                  <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
                    <div style={summaryCard}>
                      <div style={summaryNumber}>{selected.assignments.length}</div>
                      <div>
                        <strong style={{ color: '#fff' }}>Active assignments</strong>
                        <p style={panelHint}>Pulled from the backend for this class.</p>
                      </div>
                    </div>
                    <div style={summaryCard}>
                      <div style={summaryNumber}>{selected.student_count || (selected.role === 'student' ? 1 : 0)}</div>
                      <div>
                        <strong style={{ color: '#fff' }}>Students</strong>
                        <p style={panelHint}>Enrollment-aware class roster.</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '1rem', minWidth: 0 }}>
                    {selected.role === 'teacher' && (
                      <form onSubmit={assignProblem} style={assignmentComposer}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start', flexWrap: 'wrap' }}>
                          <div>
                            <strong style={panelTitle}>Create assignment</strong>
                            <p style={panelHint}>Assign one problem or a full pack from the database catalog.</p>
                          </div>
                          <div style={segmentedControl}>
                            <button type="button" onClick={() => setAssignmentMode('pack')} style={assignmentMode === 'pack' ? segmentActive : segmentButton}>Pack</button>
                            <button type="button" onClick={() => setAssignmentMode('single')} style={assignmentMode === 'single' ? segmentActive : segmentButton}>Single</button>
                          </div>
                        </div>

                        {assignmentMode === 'pack' ? (
                          <select value={packId} onChange={(event) => setPackId(event.target.value)} style={inputStyle}>
                            {packs.map((pack) => (
                              <option key={pack.id} value={pack.id}>
                                {pack.set} / {pack.batch} ({pack.count})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select value={problemId} onChange={(event) => setProblemId(event.target.value)} style={inputStyle}>
                            {problems.map((problem) => (
                              <option key={problem.id} value={problem.id}>
                                #{problem.id} {problem.title}
                              </option>
                            ))}
                          </select>
                        )}

                        <div style={previewBox}>
                          <span style={previewIcon}>{assignmentMode === 'pack' ? '[]' : '#!'}</span>
                          <div>
                            <strong style={{ color: '#fff' }}>
                              {assignmentMode === 'pack' ? selectedPack?.batch ?? 'Choose a pack' : selectedProblem?.title ?? 'Choose a problem'}
                            </strong>
                            <p style={panelHint}>
                              {assignmentMode === 'pack'
                                ? `${selectedPack?.count ?? 0} problems / ${selectedPack?.topic ?? 'mixed'}`
                                : `${selectedProblem?.difficulty ?? 'Practice'} / ${selectedProblem?.topic ?? 'coding'}`}
                            </p>
                          </div>
                        </div>

                        <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Instructions students should see" style={{ ...inputStyle, minHeight: 84, paddingTop: '0.8rem', resize: 'vertical' }} />
                        <button style={primaryButton}>Post assignment</button>
                      </form>
                    )}

                    {activePanel === 'stream' ? (
                      <Stream assignments={selected.assignments} />
                    ) : (
                      <Classwork assignments={selected.assignments} />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={noClassState}>
                <strong style={{ color: '#fff', fontSize: '1.1rem' }}>No class selected</strong>
                <p style={{ color: '#8d8d8d', margin: '0.5rem 0 0' }}>Create or join a class to see your stream and assignments.</p>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

function Stream({ assignments }: { assignments: ClassAssignment[] }) {
  const latest = assignments.slice(0, 4);
  return (
    <section style={feedPanel}>
      <strong style={panelTitle}>Class stream</strong>
      {latest.length === 0 ? (
        <p style={emptyText}>No posts yet. New assignments will show up here.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.9rem' }}>
          {latest.map((assignment) => (
            <AssignmentCard key={assignment.id ?? `${assignment.problem_id}-${assignment.problem_title}`} assignment={assignment} />
          ))}
        </div>
      )}
    </section>
  );
}

function Classwork({ assignments }: { assignments: ClassAssignment[] }) {
  return (
    <section style={feedPanel}>
      <strong style={panelTitle}>Classwork</strong>
      {assignments.length === 0 ? (
        <p style={emptyText}>No assignments yet. Teachers can post a pack to start the queue.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.9rem' }}>
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id ?? `${assignment.problem_id}-${assignment.problem_title}`} assignment={assignment} />
          ))}
        </div>
      )}
    </section>
  );
}

function AssignmentCard({ assignment }: { assignment: ClassAssignment }) {
  return (
    <Link to={`/problem/${assignment.problem_id}`} style={assignmentCard}>
      <span style={assignmentIcon}>{"</>"}</span>
      <span style={{ minWidth: 0 }}>
        <span style={assignmentTitle}>{assignment.problem_title || assignment.title}</span>
        <span style={assignmentMeta}>{assignment.instructions || 'Practice and submit your best attempt.'}</span>
      </span>
      <span style={problemBadge}>#{assignment.problem_id}</span>
    </Link>
  );
}

const pageHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1.5rem',
  alignItems: 'flex-end',
  marginBottom: '1.25rem',
};

const pageTitle: React.CSSProperties = {
  fontFamily: 'Inter, system-ui, sans-serif',
  color: '#fff',
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  lineHeight: 1,
  fontWeight: 850,
  letterSpacing: 0,
  margin: 0,
};

const pageCopy: React.CSSProperties = {
  color: '#a0a0a0',
  margin: '0.75rem 0 0',
  lineHeight: 1.55,
  maxWidth: 620,
};

const statusPill: React.CSSProperties = {
  ...mono,
  border: '1px solid rgba(74,222,128,0.22)',
  borderRadius: 999,
  padding: '0.65rem 0.9rem',
  color: '#4ade80',
  background: '#071009',
  fontSize: '0.78rem',
  whiteSpace: 'nowrap',
};

const notice: React.CSSProperties = {
  border: '1px solid rgba(255,199,44,0.24)',
  borderRadius: 8,
  background: '#141006',
  color: '#f8e7ad',
  padding: '0.85rem 1rem',
  marginBottom: '1rem',
};

const layoutGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '330px minmax(0, 1fr)',
  gap: '1rem',
  alignItems: 'start',
};

const sidebar: React.CSSProperties = {
  display: 'grid',
  gap: '1rem',
  position: 'sticky',
  top: '1rem',
};

const compactPanel: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  background: '#0a0a0a',
  padding: '1rem',
  display: 'grid',
  gap: '0.75rem',
};

const panelTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '1rem',
};

const panelHint: React.CSSProperties = {
  color: '#8c8c8c',
  margin: '0.25rem 0 0',
  lineHeight: 1.45,
  fontSize: '0.9rem',
};

const classList: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  background: '#0a0a0a',
  overflow: 'hidden',
};

const listHeader: React.CSSProperties = {
  ...mono,
  padding: '0.8rem 1rem',
  color: '#8f8f8f',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  fontSize: '0.75rem',
};

const emptyState: React.CSSProperties = {
  color: '#777',
  padding: '1rem',
  lineHeight: 1.45,
};

const classButton: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  background: 'transparent',
  color: '#fff',
  padding: '0.95rem 1rem',
  cursor: 'pointer',
  display: 'grid',
  gridTemplateColumns: '4px minmax(0, 1fr)',
  gap: '0.85rem',
  alignItems: 'center',
  transition: 'background 160ms ease, transform 160ms ease',
};

const selectedClassButton: React.CSSProperties = {
  background: '#171306',
};

const classStripe: React.CSSProperties = {
  width: 4,
  height: 38,
  borderRadius: 999,
  background: '#ffc72c',
};

const classNameStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 750,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const classMeta: React.CSSProperties = {
  ...mono,
  display: 'block',
  color: '#7c7c7c',
  fontSize: '0.72rem',
  marginTop: '0.25rem',
};

const contentPanel: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  background: '#080808',
  minHeight: 620,
  overflow: 'hidden',
  transition: 'min-height 220ms ease',
};

const classBanner: React.CSSProperties = {
  padding: '1.35rem',
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  alignItems: 'flex-start',
  background: '#111',
  borderBottom: '1px solid rgba(255,255,255,0.09)',
};

const bannerEyebrow: React.CSSProperties = {
  ...mono,
  color: '#ffc72c',
  fontSize: '0.75rem',
  marginBottom: '0.45rem',
};

const bannerTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
  lineHeight: 1.1,
  margin: 0,
};

const bannerCopy: React.CSSProperties = {
  color: '#aaa',
  margin: '0.55rem 0 0',
  lineHeight: 1.5,
  maxWidth: 640,
};

const classCodeBox: React.CSSProperties = {
  ...mono,
  border: '1px solid rgba(255,199,44,0.28)',
  borderRadius: 8,
  padding: '0.7rem 0.85rem',
  color: '#ffc72c',
  background: '#090700',
  display: 'grid',
  gap: '0.2rem',
  minWidth: 128,
  textAlign: 'center',
};

const codeLabel: React.CSSProperties = {
  color: '#7f744f',
  fontSize: '0.68rem',
};

const tabs: React.CSSProperties = {
  display: 'flex',
  gap: '0.35rem',
  padding: '0.75rem 1.25rem 0',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const tab: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#8f8f8f',
  padding: '0.85rem 0.9rem',
  cursor: 'pointer',
  fontWeight: 750,
  borderBottom: '2px solid transparent',
};

const activeTab: React.CSSProperties = {
  ...tab,
  color: '#fff',
  borderBottom: '2px solid #ffc72c',
};

const mainColumns: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '210px minmax(0, 1fr)',
  gap: '1rem',
  padding: '1.25rem',
};

const summaryCard: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8,
  background: '#0d0d0d',
  padding: '1rem',
  display: 'grid',
  gap: '0.75rem',
};

const summaryNumber: React.CSSProperties = {
  ...mono,
  width: 44,
  height: 44,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  background: '#171306',
  color: '#ffc72c',
  fontWeight: 900,
};

const assignmentComposer: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  background: '#0d0d0d',
  padding: '1rem',
  display: 'grid',
  gap: '0.8rem',
};

const segmentedControl: React.CSSProperties = {
  display: 'flex',
  background: '#050505',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: 3,
};

const segmentButton: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#8f8f8f',
  borderRadius: 6,
  padding: '0.45rem 0.7rem',
  cursor: 'pointer',
  fontWeight: 800,
};

const segmentActive: React.CSSProperties = {
  ...segmentButton,
  background: '#ffc72c',
  color: '#171100',
};

const previewBox: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  background: '#080808',
  padding: '0.85rem',
  display: 'flex',
  gap: '0.8rem',
  alignItems: 'center',
};

const previewIcon: React.CSSProperties = {
  ...mono,
  width: 42,
  height: 42,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  background: '#151515',
  color: '#ffc72c',
  fontWeight: 900,
};

const feedPanel: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  background: '#0d0d0d',
  padding: '1rem',
};

const emptyText: React.CSSProperties = {
  color: '#8c8c8c',
  margin: '0.85rem 0 0',
  lineHeight: 1.5,
};

const assignmentCard: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8,
  background: '#080808',
  padding: '0.9rem',
  color: '#fff',
  textDecoration: 'none',
  display: 'grid',
  gridTemplateColumns: '42px minmax(0, 1fr) auto',
  gap: '0.85rem',
  alignItems: 'center',
  transition: 'border-color 160ms ease, transform 160ms ease',
};

const assignmentIcon: React.CSSProperties = {
  ...mono,
  width: 42,
  height: 42,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  background: '#151515',
  color: '#ffc72c',
  fontWeight: 900,
};

const assignmentTitle: React.CSSProperties = {
  display: 'block',
  fontWeight: 800,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const assignmentMeta: React.CSSProperties = {
  display: 'block',
  color: '#8c8c8c',
  marginTop: '0.25rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const problemBadge: React.CSSProperties = {
  ...mono,
  color: '#ffc72c',
  border: '1px solid rgba(255,199,44,0.2)',
  borderRadius: 999,
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
};

const noClassState: React.CSSProperties = {
  minHeight: 620,
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  padding: '2rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 42,
  background: '#050505',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#fff',
  padding: '0 0.75rem',
  outline: 'none',
};

const primaryButton: React.CSSProperties = {
  minHeight: 42,
  background: '#ffc72c',
  color: '#171100',
  border: '1px solid #ffc72c',
  borderRadius: 8,
  fontWeight: 850,
  padding: '0 1rem',
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: '#111',
  color: '#f8e7ad',
  border: '1px solid rgba(255,255,255,0.14)',
};
