import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_PROBLEMS, DIFFICULTY_COLOR } from '../data/problems';
import { readStoredUser } from '../utils/user';

const API_BASE_URL = import.meta.env.VITE_CODE_API_BASE_URL ?? '';

interface AssignmentStats {
  submitted: number;
  graded: number;
  averageGrade: number | null;
  accepted: number;
}

interface Submission {
  id: string;
  assignmentId: string;
  classId: string;
  userId: string;
  username: string;
  problemId: number;
  language: string;
  sourceCode: string;
  status: string;
  summary: string;
  grade: number | null;
  feedback: string;
  updatedAt: string;
}

interface Assignment {
  id: string;
  problemId: number;
  title: string;
  instructions: string;
  createdAt: string;
  stats: AssignmentStats;
  submission: Submission | null;
}

interface Student {
  userId: string;
  username: string;
  joinedAt?: string;
}

interface ClassroomItem {
  id: string;
  name: string;
  section: string;
  code: string;
  role: 'teacher' | 'student';
  assignments: Assignment[];
  students: Student[];
  submissions: Submission[];
  teacherStats: {
    students: number;
    submissions: number;
    graded: number;
    averageGrade: number | null;
  };
}

interface ClassroomResponse {
  classes: ClassroomItem[];
  selectedId?: string;
}

function chooseSelectedId(nextClasses: ClassroomItem[], preferredId: string | undefined, currentId: string) {
  if (preferredId && nextClasses.some((item) => item.id === preferredId)) return preferredId;
  if (currentId && nextClasses.some((item) => item.id === currentId)) return currentId;
  return nextClasses[0]?.id ?? '';
}

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

const TEXT: React.CSSProperties = {
  fontFamily: 'Inter, system-ui, sans-serif',
  letterSpacing: 0,
};

export default function Classroom() {
  const user = readStoredUser();
  const username = user?.username ?? 'student';
  const userId = user?.id ?? 'local-student';
  const [classes, setClasses] = useState<ClassroomItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [tab, setTab] = useState<'stream' | 'classwork' | 'review'>('stream');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [problemId, setProblemId] = useState(String(ALL_PROBLEMS[0]?.id ?? 1));
  const [instructions, setInstructions] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const selected = useMemo(
    () => classes.find((item) => item.id === selectedId) ?? null,
    [classes, selectedId],
  );
  const activeTab = selected?.role !== 'teacher' && tab === 'review' ? 'classwork' : tab;
  const selectedProblem = ALL_PROBLEMS.find((problem) => problem.id === Number(problemId)) ?? ALL_PROBLEMS[0];

  const request = useCallback(async (path: string, init?: RequestInit): Promise<ClassroomResponse> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error ?? 'Classroom request failed.');
    return data as ClassroomResponse;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ userId, username });

    request(`/api/classroom?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setClasses(data.classes);
        setSelectedId((currentId) => chooseSelectedId(data.classes, data.selectedId, currentId));
        setMessage('');
      })
      .catch((error) => {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : 'Could not load classroom.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [request, userId, username]);

  function applyClassroom(data: ClassroomResponse, nextMessage: string) {
    setClasses(data.classes);
    setSelectedId((currentId) => chooseSelectedId(data.classes, data.selectedId, currentId));
    setMessage(nextMessage);
  }

  async function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = className.trim();
    if (!name || busy) return;

    setBusy('create');
    try {
      const data = await request('/api/classroom/classes', {
        method: 'POST',
        body: JSON.stringify({ userId, username, name, section }),
      });
      setClassName('');
      setSection('');
      setTab('stream');
      applyClassroom(data, 'Class created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create class.');
    } finally {
      setBusy(null);
    }
  }

  async function joinClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || busy) return;

    setBusy('join');
    try {
      const data = await request('/api/classroom/join', {
        method: 'POST',
        body: JSON.stringify({ userId, username, code }),
      });
      setJoinCode('');
      setTab('stream');
      applyClassroom(data, 'Class joined.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not join class.');
    } finally {
      setBusy(null);
    }
  }

  async function assignProblem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || selected.role !== 'teacher' || !selectedProblem || busy) return;

    setBusy('assign');
    try {
      const data = await request(`/api/classroom/classes/${encodeURIComponent(selected.id)}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          username,
          problemId: selectedProblem.id,
          title: selectedProblem.title,
          instructions,
        }),
      });
      setInstructions('');
      setTab('classwork');
      applyClassroom(data, 'Assignment posted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not post assignment.');
    } finally {
      setBusy(null);
    }
  }

  async function gradeSubmission(submissionId: string, grade: string, feedback: string) {
    if (!selected || busy) return;

    setBusy(`grade-${submissionId}`);
    try {
      const data = await request(`/api/classroom/submissions/${encodeURIComponent(submissionId)}/grade`, {
        method: 'PATCH',
        body: JSON.stringify({ userId, username, grade, feedback }),
      });
      setTab('review');
      applyClassroom(data, 'Grade saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save grade.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
      <main style={{ padding: '2.5rem 0 4rem' }}>
        <header style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 0.35rem', lineHeight: 1.1, letterSpacing: 0 }}>
            Classroom
          </h1>
          <p style={{ ...TEXT, fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Assign practice, review submissions, and keep class progress synced on the backend.
          </p>
        </header>

        <div className="classroom-workspace" style={workspaceStyle}>
          <aside className="classroom-sidebar" style={sidebarStyle}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ ...MONO, color: '#FD6D03', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                api / classroom
              </div>
              <form onSubmit={createClass} style={{ display: 'grid', gap: '0.65rem', marginBottom: '1rem' }}>
                <input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Class name" style={inputStyle} />
                <input value={section} onChange={(event) => setSection(event.target.value)} placeholder="Section or room" style={inputStyle} />
                <button disabled={busy === 'create'} style={primaryButton}>{busy === 'create' ? 'Creating...' : 'Create class'}</button>
              </form>
              <form onSubmit={joinClass} style={{ display: 'grid', gap: '0.65rem' }}>
                <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="Join code" style={{ ...inputStyle, textTransform: 'uppercase' }} />
                <button disabled={busy === 'join'} style={secondaryButton}>{busy === 'join' ? 'Joining...' : 'Join class'}</button>
              </form>
            </div>

            <div>
              <div style={{ ...sectionLabel, padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)' }}>
                classes
              </div>
              {loading && <div style={emptyListText}>Loading classes...</div>}
              {!loading && classes.length === 0 && <div style={emptyListText}>No classes yet.</div>}
              {classes.map((item) => (
                <button key={item.id} onClick={() => setSelectedId(item.id)} style={classButton(selected?.id === item.id)}>
                  <span style={classMark}>{item.name.slice(0, 1).toUpperCase()}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ ...MONO, display: 'block', color: 'var(--text-subtle)', fontSize: '0.68rem', marginTop: '0.25rem' }}>{item.role} / {item.code}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section style={{ minWidth: 0 }}>
            {message && (
              <div style={messageStyle}>
                {message}
              </div>
            )}

            {selected ? (
              <div>
                <ClassHeader selected={selected} />
                <StatsStrip selected={selected} />

                <nav style={{ display: 'flex', gap: '0.2rem', borderBottom: '1px solid var(--border)', padding: '0 1rem' }}>
                  <TabButton active={activeTab === 'stream'} onClick={() => setTab('stream')}>Stream</TabButton>
                  <TabButton active={activeTab === 'classwork'} onClick={() => setTab('classwork')}>Classwork</TabButton>
                  {selected.role === 'teacher' && <TabButton active={activeTab === 'review'} onClick={() => setTab('review')}>Grades</TabButton>}
                </nav>

                <div style={{ padding: '1rem' }}>
                  {activeTab === 'stream' && <StreamView selected={selected} />}
                  {activeTab === 'classwork' && (
                    <ClassworkView
                      selected={selected}
                      problemId={problemId}
                      instructions={instructions}
                      setProblemId={setProblemId}
                      setInstructions={setInstructions}
                      assignProblem={assignProblem}
                      posting={busy === 'assign'}
                    />
                  )}
                  {activeTab === 'review' && selected.role === 'teacher' && (
                    <ReviewView selected={selected} savingId={busy?.startsWith('grade-') ? busy.slice(6) : null} onGrade={gradeSubmission} />
                  )}
                </div>
              </div>
            ) : (
              <EmptyClassroom loading={loading} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ClassHeader({ selected }: { selected: ClassroomItem }) {
  return (
    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...MONO, color: '#FD6D03', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.55rem' }}>
            {selected.role} view
          </div>
          <h2 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", color: 'var(--text-primary)', fontSize: 'clamp(1.45rem, 3vw, 2rem)', lineHeight: 1.15, fontWeight: 400, margin: 0, letterSpacing: 0 }}>
            {selected.name}
          </h2>
          <p style={{ ...TEXT, color: 'var(--text-muted)', margin: '0.45rem 0 0', fontSize: '0.9rem' }}>
            {selected.section}
          </p>
        </div>
        <div style={{ ...MONO, color: '#FD6D03', border: '1px solid rgba(253,109,3,0.35)', background: 'rgba(253,109,3,0.08)', borderRadius: 8, padding: '0.55rem 0.75rem', fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
          {selected.code}
        </div>
      </div>
    </div>
  );
}

function StatsStrip({ selected }: { selected: ClassroomItem }) {
  const stats = [
    ['ASSIGNMENTS', selected.assignments.length.toString()],
    ['STUDENTS', selected.teacherStats.students.toString()],
    ['TURNED IN', selected.teacherStats.submissions.toString()],
    ['AVG GRADE', selected.teacherStats.averageGrade === null ? '--' : `${selected.teacherStats.averageGrade}%`],
  ] as const;

  return (
    <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border)' }}>
      {stats.map(([label, value], index) => (
        <div key={label} style={{ padding: '1rem 1.25rem', borderRight: index < stats.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={sectionLabel}>{label}</div>
          <div style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", color: label === 'AVG GRADE' && value !== '--' ? '#FD6D03' : 'var(--text-primary)', fontSize: '1.75rem', lineHeight: 1, fontWeight: 400, marginTop: '0.45rem' }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function StreamView({ selected }: { selected: ClassroomItem }) {
  const latest = selected.assignments.slice(0, 4);

  return (
    <div className="classroom-stream-grid" style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: '1rem', alignItems: 'start' }}>
      <div style={panelStyle}>
        <div style={sectionLabel}>CLASS CODE</div>
        <div style={{ ...MONO, color: '#FD6D03', fontSize: '1.25rem', fontWeight: 800 }}>{selected.code}</div>
        <p style={smallMuted}>{selected.teacherStats.students} enrolled student{selected.teacherStats.students === 1 ? '' : 's'}</p>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={panelStyle}>
          <div style={sectionLabel}>LATEST</div>
          <p style={{ ...TEXT, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55, fontSize: '0.9rem' }}>
            {selected.role === 'teacher'
              ? 'Recent classwork and submissions will collect here as students run assigned problems.'
              : 'Open assigned problems from classwork; your latest run is submitted back to your teacher.'}
          </p>
        </div>
        {latest.length === 0 ? (
          <EmptyPanel text="No classwork posted yet." />
        ) : latest.map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} role={selected.role} />
        ))}
      </div>
    </div>
  );
}

function ClassworkView({
  selected,
  problemId,
  instructions,
  setProblemId,
  setInstructions,
  assignProblem,
  posting,
}: {
  selected: ClassroomItem;
  problemId: string;
  instructions: string;
  setProblemId: (value: string) => void;
  setInstructions: (value: string) => void;
  assignProblem: (event: React.FormEvent<HTMLFormElement>) => void;
  posting: boolean;
}) {
  return (
    <div className="classroom-classwork-grid" style={{ display: 'grid', gridTemplateColumns: selected.role === 'teacher' ? 'minmax(0, 1fr) 320px' : '1fr', gap: '1rem', alignItems: 'start' }}>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {selected.assignments.length === 0 ? (
          <EmptyPanel text={selected.role === 'teacher' ? 'Post the first assignment from the panel on the right.' : 'No assignments have been posted yet.'} />
        ) : selected.assignments.map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} role={selected.role} />
        ))}
      </div>

      {selected.role === 'teacher' && (
        <form onSubmit={assignProblem} style={panelStyle}>
          <div>
            <div style={sectionLabel}>POST ASSIGNMENT</div>
            <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.35rem', fontWeight: 650 }}>Choose a problem</strong>
          </div>
          <select value={problemId} onChange={(event) => setProblemId(event.target.value)} style={inputStyle}>
            {ALL_PROBLEMS.map((problem) => (
              <option key={problem.id} value={problem.id}>#{problem.id} {problem.title}</option>
            ))}
          </select>
          <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Instructions for students" style={{ ...inputStyle, minHeight: 96, paddingTop: '0.75rem', resize: 'vertical' }} />
          <button disabled={posting} style={primaryButton}>{posting ? 'Posting...' : 'Post assignment'}</button>
        </form>
      )}
    </div>
  );
}

function ReviewView({
  selected,
  savingId,
  onGrade,
}: {
  selected: ClassroomItem;
  savingId: string | null;
  onGrade: (submissionId: string, grade: string, feedback: string) => Promise<void>;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {selected.students.length === 0 ? (
        <EmptyPanel text="No students have joined this class yet." />
      ) : selected.submissions.length === 0 ? (
        <EmptyPanel text="Students are enrolled, but no submissions have come in yet." />
      ) : selected.submissions.map((submission) => (
        <SubmissionCard key={`${submission.id}-${submission.grade ?? ''}-${submission.feedback}`} submission={submission} saving={savingId === submission.id} onGrade={onGrade} />
      ))}
    </div>
  );
}

function SubmissionCard({
  submission,
  saving,
  onGrade,
}: {
  submission: Submission;
  saving: boolean;
  onGrade: (submissionId: string, grade: string, feedback: string) => Promise<void>;
}) {
  const [grade, setGrade] = useState(submission.grade?.toString() ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const problem = ALL_PROBLEMS.find((entry) => entry.id === submission.problemId);
  const canSave = grade.trim() === '' || (Number.isFinite(Number(grade)) && Number(grade) >= 0 && Number(grade) <= 100);

  return (
    <article style={panelStyle}>
      <div className="classroom-submission-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 92px minmax(190px, 260px)', gap: '0.85rem', alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{submission.username}</strong>
            <span style={tinyPill}>{submission.status}</span>
            <span style={tinyPill}>{submission.language || 'code'}</span>
          </div>
          <p style={{ ...smallMuted, marginTop: '0.35rem' }}>
            {problem?.title ?? `Problem ${submission.problemId}`} / {formatDate(submission.updatedAt)}
          </p>
          {submission.summary && <p style={{ ...smallMuted, color: '#FD6D03', marginTop: '0.35rem' }}>{submission.summary}</p>}
          <pre style={codePreview}>{submission.sourceCode}</pre>
        </div>
        <input value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="0-100" style={inputStyle} />
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Feedback" style={{ ...inputStyle, minHeight: 86, paddingTop: '0.65rem', resize: 'vertical' }} />
          <button type="button" disabled={!canSave || saving} onClick={() => void onGrade(submission.id, grade, feedback)} style={{ ...primaryButton, opacity: !canSave || saving ? 0.55 : 1 }}>
            {saving ? 'Saving...' : 'Save grade'}
          </button>
        </div>
      </div>
    </article>
  );
}

function AssignmentCard({ assignment, role }: { assignment: Assignment; role: ClassroomItem['role'] }) {
  const problem = ALL_PROBLEMS.find((entry) => entry.id === assignment.problemId);
  const submission = assignment.submission;
  const accent = problem ? DIFFICULTY_COLOR[problem.difficulty] : '#FD6D03';
  const meta = role === 'teacher'
    ? `${assignment.stats.submitted} turned in / ${assignment.stats.graded} graded / ${assignment.stats.averageGrade === null ? 'no average' : `${assignment.stats.averageGrade}% avg`}`
    : submission
      ? `${submission.status}${submission.grade === null ? '' : ` / ${submission.grade}%`}`
      : 'Not submitted';

  return (
    <Link to={`/problem/${assignment.problemId}?assignment=${encodeURIComponent(assignment.id)}`} style={assignmentStyle}>
      <span style={{ ...assignmentIcon, color: accent, borderColor: `${accent}55`, background: `${accent}18` }}>{"</>"}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 700 }}>{assignment.title}</span>
        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assignment.instructions}</span>
        <span style={{ ...MONO, color: role === 'student' && submission?.grade !== null ? '#FD6D03' : 'var(--text-subtle)', fontSize: '0.7rem', marginTop: '0.4rem', display: 'block' }}>
          {meta}
        </span>
        {role === 'student' && submission?.feedback && (
          <span style={{ ...TEXT, display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Feedback: {submission.feedback}
          </span>
        )}
      </span>
      <span style={{ ...MONO, color: '#FD6D03', fontSize: '0.72rem' }}>#{assignment.problemId}</span>
    </Link>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ ...TEXT, border: 'none', borderBottom: active ? '2px solid #FD6D03' : '2px solid transparent', background: 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-muted)', padding: '0.9rem 0.9rem 0.75rem', fontSize: '0.86rem', fontWeight: 650, cursor: 'pointer' }}>
      {children}
    </button>
  );
}

function EmptyClassroom({ loading }: { loading: boolean }) {
  return (
    <div style={{ minHeight: 520, display: 'grid', placeItems: 'center', padding: '1.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ ...MONO, color: '#FD6D03', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.65rem' }}>
          {loading ? 'loading' : 'no classes'}
        </div>
        <h2 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", color: 'var(--text-primary)', fontWeight: 400, margin: 0, fontSize: '1.7rem', letterSpacing: 0 }}>
          {loading ? 'Loading classroom.' : 'Create or join a class.'}
        </h2>
        <p style={{ ...TEXT, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0.65rem 0 0', fontSize: '0.92rem' }}>
          {loading ? 'Pulling your class list from the backend.' : 'Use the controls on the left to start a teacher workspace or join with a class code.'}
        </p>
      </div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div style={panelStyle}>
      <p style={{ ...TEXT, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5, fontSize: '0.9rem' }}>{text}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const workspaceStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  overflow: 'hidden',
  background: 'var(--surface)',
  display: 'grid',
  gridTemplateColumns: '300px minmax(0, 1fr)',
  minHeight: 680,
};

const sidebarStyle: React.CSSProperties = {
  borderRight: '1px solid var(--border)',
  background: 'var(--surface)',
};

const panelStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--surface)',
  padding: '1rem',
  display: 'grid',
  gap: '0.75rem',
};

const sectionLabel: React.CSSProperties = {
  ...TEXT,
  color: 'var(--text-subtle)',
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  ...TEXT,
  width: '100%',
  minHeight: 38,
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  padding: '0 0.7rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontSize: '0.86rem',
};

const primaryButton: React.CSSProperties = {
  ...TEXT,
  minHeight: 38,
  border: '1px solid #FD6D03',
  borderRadius: 8,
  background: '#FD6D03',
  color: '#fff',
  fontWeight: 650,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
};

const classMark: React.CSSProperties = {
  ...MONO,
  width: 34,
  height: 34,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid rgba(253,109,3,0.28)',
  background: 'rgba(253,109,3,0.08)',
  color: '#FD6D03',
  fontWeight: 800,
  flexShrink: 0,
};

const classButton = (active: boolean): React.CSSProperties => ({
  border: 'none',
  borderBottom: '1px solid var(--border-faint)',
  background: active ? 'rgba(253,109,3,0.08)' : 'transparent',
  color: 'var(--text-primary)',
  padding: '0.85rem 1rem',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  width: '100%',
});

const assignmentStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  borderRadius: 8,
  padding: '0.9rem 1rem',
  display: 'grid',
  gridTemplateColumns: '42px 1fr auto',
  gap: '0.85rem',
  alignItems: 'center',
};

const assignmentIcon: React.CSSProperties = {
  ...MONO,
  width: 42,
  height: 42,
  borderRadius: 8,
  border: '1px solid rgba(253,109,3,0.35)',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 800,
};

const messageStyle: React.CSSProperties = {
  ...TEXT,
  borderBottom: '1px solid rgba(253,109,3,0.2)',
  background: 'rgba(253,109,3,0.07)',
  color: '#FD6D03',
  padding: '0.75rem 1rem',
  fontSize: '0.88rem',
};

const emptyListText: React.CSSProperties = {
  ...TEXT,
  padding: '1rem',
  color: 'var(--text-subtle)',
  fontSize: '0.86rem',
};

const smallMuted: React.CSSProperties = {
  ...TEXT,
  color: 'var(--text-muted)',
  margin: 0,
  fontSize: '0.84rem',
  lineHeight: 1.45,
};

const tinyPill: React.CSSProperties = {
  ...MONO,
  color: 'var(--text-subtle)',
  border: '1px solid var(--border)',
  borderRadius: 5,
  padding: '0.12rem 0.45rem',
  fontSize: '0.66rem',
};

const codePreview: React.CSSProperties = {
  ...MONO,
  margin: '0.75rem 0 0',
  maxHeight: 190,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  background: 'var(--surface-2)',
  border: '1px solid var(--border-faint)',
  borderRadius: 8,
  padding: '0.75rem',
  color: 'var(--text-muted)',
  fontSize: '0.76rem',
};
