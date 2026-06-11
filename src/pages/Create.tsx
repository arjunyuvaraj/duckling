import { useState, useRef, useCallback } from 'react';
import type { Difficulty, Language } from '../data/problems';
import {
  saveCreatedProblem, getCreatedProblems, deleteCreatedProblem,
  emptyProblem, type CreatedProblem, type TestCase,
} from '../utils/createdProblems';

const TABS = ['Problem', 'Test Cases', 'Code'] as const;
type Tab = typeof TABS[number];

const DIFF_OPTIONS: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const LANG_OPTIONS: Language[]   = ['Python', 'Java'];
const DIFF_COLOR: Record<Difficulty, string> = {
  Easy: '#45c46f', Medium: '#FD6D03', Hard: '#e05252',
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: '0.68rem', fontWeight: 600,
  color: 'var(--text-subtle)',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  marginBottom: '0.5rem',
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={LABEL_STYLE}>{children}</div>
);

const FieldWrap = ({ children, last }: { children: React.ReactNode; last?: boolean }) => (
  <div style={{ padding: '1rem 1.25rem', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
    {children}
  </div>
);

const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    style={{
      width: '100%', background: 'transparent', border: 'none',
      borderBottom: '1px solid var(--border)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '0.9rem', fontWeight: 400,
      padding: '0.35rem 0', outline: 'none',
      caretColor: '#FD6D03',
      transition: 'border-color 0.15s ease',
      ...props.style,
    }}
    onFocus={e => { e.currentTarget.style.borderColor = '#FD6D03'; props.onFocus?.(e); }}
    onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)'; props.onBlur?.(e); }}
  />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) => {
  const { mono, ...rest } = props;
  return (
    <textarea
      {...rest}
      style={{
        width: '100%', background: 'var(--surface-2)',
        border: '1px solid var(--border)', borderRadius: 6,
        color: 'var(--text-primary)',
        fontFamily: mono ? "'JetBrains Mono', ui-monospace, monospace" : 'Inter, system-ui, sans-serif',
        fontSize: mono ? '0.82rem' : '0.9rem',
        lineHeight: 1.65,
        padding: '0.65rem 0.75rem', outline: 'none', resize: 'vertical',
        caretColor: '#FD6D03',
        transition: 'border-color 0.15s ease',
        minHeight: 90,
        ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = '#FD6D03'; props.onFocus?.(e); }}
      onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)'; props.onBlur?.(e); }}
    />
  );
};

const PillGroup = <T extends string>({
  options, value, onChange, colorMap,
}: {
  options: T[]; value: T; onChange: (v: T) => void;
  colorMap?: Record<string, string>;
}) => (
  <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)' }}>
    {options.map((opt, i) => {
      const active = value === opt;
      return (
        <button key={opt} type="button" onClick={() => onChange(opt)} style={{
          padding: '0.35rem 0.85rem',
          background: active ? 'rgba(253,109,3,0.1)' : 'transparent',
          border: 'none',
          borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
          color: active ? (colorMap?.[opt] ?? '#FD6D03') : 'var(--text-muted)',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.82rem', fontWeight: active ? 600 : 400,
          cursor: 'pointer',
          transition: 'background 0.12s ease, color 0.12s ease',
        }}>
          {opt}
        </button>
      );
    })}
  </div>
);

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState('');

  function commit() {
    const val = draft.trim().toLowerCase().replace(/\s+/g, '-');
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setDraft('');
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
    if (e.key === 'Backspace' && !draft && tags.length) onChange(tags.slice(0, -1));
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border)', minHeight: 34 }}>
      {tags.map(t => (
        <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(253,109,3,0.08)', border: '1px solid rgba(253,109,3,0.25)', borderRadius: 4, padding: '0.1rem 0.45rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#FD6D03' }}>
          {t}
          <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FD6D03', padding: 0, lineHeight: 1, fontSize: '0.8rem' }}>×</button>
        </span>
      ))}
      <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKey} onBlur={commit}
        placeholder={tags.length ? '' : 'e.g. arrays, two-pointers…'}
        style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem', color: 'var(--text-primary)', caretColor: '#FD6D03', minWidth: 120, flex: 1 }}
      />
    </div>
  );
}

function SavedRow({ p, onEdit, onDelete }: { p: CreatedProblem; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.title || '(untitled)'}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', fontWeight: 700, color: DIFF_COLOR[p.difficulty] }}>{p.difficulty}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--text-subtle)' }}>{p.language}</span>
            {p.topic && <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.68rem', color: 'var(--text-subtle)' }}>{p.topic}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
          <button type="button" onClick={onEdit} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 5, padding: '0.2rem 0.6rem', cursor: 'pointer' }}>
            Edit
          </button>
          <button type="button" onClick={onDelete} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', fontWeight: 500, color: '#e05252', background: 'transparent', border: '1px solid var(--danger-border)', borderRadius: 5, padding: '0.2rem 0.6rem', cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Create() {
  const [form, setForm]           = useState<CreatedProblem>(emptyProblem);
  const [activeTab, setActiveTab] = useState<Tab>('Problem');
  const [slideDir, setSlideDir]   = useState<'right' | 'left'>('right');
  const [saved, setSaved]         = useState<CreatedProblem[]>(getCreatedProblems);
  const [saveMsg, setSaveMsg]     = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const tabContentRef = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof CreatedProblem>(key: K, val: CreatedProblem[K]) =>
    setForm(f => ({ ...f, [key]: val })), []);

  function switchTab(t: Tab) {
    if (t === activeTab) return;
    const prev = TABS.indexOf(activeTab);
    const next = TABS.indexOf(t);
    setSlideDir(next > prev ? 'right' : 'left');
    setActiveTab(t);
  }

  function setConstraint(i: number, val: string) {
    const c = [...form.constraints]; c[i] = val; set('constraints', c);
  }
  function addConstraint()             { set('constraints', [...form.constraints, '']); }
  function removeConstraint(i: number) { set('constraints', form.constraints.filter((_, j) => j !== i)); }

  function setTestCase(i: number, field: keyof TestCase, val: string) {
    set('testCases', form.testCases.map((t, j) => j === i ? { ...t, [field]: val } : t));
  }
  function addTestCase()             { set('testCases', [...form.testCases, { input: '', expected: '' }]); }
  function removeTestCase(i: number) { set('testCases', form.testCases.filter((_, j) => j !== i)); }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim())       e.title = 'Title is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.testCases.filter(t => t.input.trim() && t.expected.trim()).length)
      e.testCases = 'At least one complete test case is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now = new Date().toISOString();
    saveCreatedProblem({ ...form, updatedAt: now });
    setSaved(getCreatedProblems());
    setSaveMsg(`"${form.title}" saved.`);
    setForm({ ...emptyProblem(), createdAt: now });
    setErrors({});
    setTimeout(() => setSaveMsg(''), 4000);
  }

  function handleEdit(p: CreatedProblem) { setForm(p); setActiveTab('Problem'); }
  function handleDelete(id: string)      { deleteCreatedProblem(id); setSaved(getCreatedProblems()); }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '2rem 1.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h1 style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 0.35rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
          Create a Problem.
        </h1>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Design a coding problem — write the prompt, add test cases, and provide a reference solution.
        </p>
      </div>
      {saveMsg && (
        <div style={{ padding: '0.65rem 1.75rem', borderBottom: '1px solid var(--success-border)', background: 'var(--success-soft)', color: '#45c46f', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', flexShrink: 0 }}>
          {saveMsg}
        </div>
      )}
      <div
        className="create-grid"
        style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr) 280px', overflow: 'hidden' }}
      >
        <div className="no-scrollbar" style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          <FieldWrap>
            <Label>Title</Label>
            <TextInput placeholder="e.g. Two Sum" value={form.title} onChange={e => set('title', e.target.value)} />
            {errors.title && <div style={{ color: '#e05252', fontSize: '0.75rem', marginTop: '0.35rem', fontFamily: 'Inter, system-ui, sans-serif' }}>{errors.title}</div>}
          </FieldWrap>

          <FieldWrap>
            <Label>Difficulty</Label>
            <PillGroup options={DIFF_OPTIONS} value={form.difficulty} onChange={v => set('difficulty', v)} colorMap={DIFF_COLOR} />
          </FieldWrap>

          <FieldWrap>
            <Label>Language</Label>
            <PillGroup options={LANG_OPTIONS} value={form.language} onChange={v => set('language', v)} />
          </FieldWrap>

          <FieldWrap>
            <Label>Topic</Label>
            <TextInput placeholder="e.g. Arrays" value={form.topic} onChange={e => set('topic', e.target.value)} />
          </FieldWrap>

          <FieldWrap last>
            <Label>Tags</Label>
            <TagInput tags={form.tags} onChange={t => set('tags', t)} />
            <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
              Press Enter or comma to add
            </div>
          </FieldWrap>

          <div style={{ flex: 1 }} />

          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button type="button" onClick={handleSave} style={{
              width: '100%',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.875rem', fontWeight: 600,
              color: '#fff', background: '#FD6D03',
              border: '1px solid #FD6D03', borderRadius: 8,
              padding: '0.65rem 1rem',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}>
              Save Problem
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {TABS.map(t => {
              const active = t === activeTab;
              return (
                <button key={t} type="button" onClick={() => switchTab(t)} style={{
                  height: 44, padding: '0 1.25rem',
                  background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${active ? '#FD6D03' : 'transparent'}`,
                  color: active ? '#FD6D03' : 'var(--text-muted)',
                  fontFamily: "'Stack', 'Geist', 'Inter', sans-serif",
                  fontSize: '0.95rem', fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}>
                  {t}
                  {t === 'Test Cases' && (
                    <span style={{
                      marginLeft: '0.4rem',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.65rem', fontWeight: 700,
                      color: active ? '#FD6D03' : 'var(--text-subtle)',
                      background: active ? 'rgba(253,109,3,0.12)' : 'var(--surface-3)',
                      border: `1px solid ${active ? 'rgba(253,109,3,0.25)' : 'var(--border)'}`,
                      borderRadius: 4, padding: '0.05rem 0.35rem',
                    }}>
                      {form.testCases.filter(tc => tc.input || tc.expected).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div
            ref={tabContentRef}
            key={activeTab}
            className={`no-scrollbar ${slideDir === 'right' ? 'slide-from-right' : 'slide-from-left'}`}
            style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}
          >
            {activeTab === 'Problem' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the problem clearly. What is the input? What should the output be? What edge cases exist?"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    style={{ minHeight: 140 }}
                  />
                  {errors.description && <div style={{ color: '#e05252', fontSize: '0.75rem', marginTop: '0.35rem', fontFamily: 'Inter, system-ui, sans-serif' }}>{errors.description}</div>}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <Label>Constraints</Label>
                    <button type="button" onClick={addConstraint} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', fontWeight: 500, color: '#FD6D03', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                      + Add
                    </button>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    {form.constraints.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderBottom: i < form.constraints.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--surface-2)' }}>
                        <span style={{ color: '#FD6D03', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', flexShrink: 0 }}>•</span>
                        <input value={c} onChange={e => setConstraint(i, e.target.value)} placeholder="e.g. 1 ≤ n ≤ 10⁴"
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: 'var(--text-primary)', caretColor: '#FD6D03' }}
                        />
                        {form.constraints.length > 1 && (
                          <button type="button" onClick={() => removeConstraint(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: '0.9rem', flexShrink: 0, padding: '0 0.25rem' }}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Example</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ padding: '0.85rem 1rem', borderRight: '1px solid var(--border)' }}>
                      <Label>Sample Input</Label>
                      <Textarea mono value={form.sampleInput} onChange={e => set('sampleInput', e.target.value)} style={{ minHeight: 70 }} placeholder={'nums = [2,7,11,15]\ntarget = 9'} />
                    </div>
                    <div style={{ padding: '0.85rem 1rem' }}>
                      <Label>Sample Output</Label>
                      <Textarea mono value={form.sampleOutput} onChange={e => set('sampleOutput', e.target.value)} style={{ minHeight: 70 }} placeholder="[0, 1]" />
                    </div>
                  </div>
                  <div style={{ padding: '0.85rem 1rem' }}>
                    <Label>Explanation</Label>
                    <Textarea value={form.explanation} onChange={e => set('explanation', e.target.value)} style={{ minHeight: 60 }} placeholder="Brief explanation of why the output is correct." />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Test Cases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {errors.testCases && (
                  <div style={{ color: '#e05252', fontSize: '0.82rem', fontFamily: 'Inter, system-ui, sans-serif', padding: '0.6rem 0.85rem', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', borderRadius: 7 }}>
                    {errors.testCases}
                  </div>
                )}
                {form.testCases.map((tc, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.06em' }}>
                        TEST CASE {i + 1}
                      </span>
                      {form.testCases.length > 1 && (
                        <button type="button" onClick={() => removeTestCase(i)} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.75rem', color: '#e05252', background: 'transparent', border: '1px solid var(--danger-border)', borderRadius: 5, padding: '0.2rem 0.6rem', cursor: 'pointer' }}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      <div style={{ padding: '0.85rem 1rem', borderRight: '1px solid var(--border)' }}>
                        <Label>Input</Label>
                        <Textarea mono value={tc.input} onChange={e => setTestCase(i, 'input', e.target.value)} placeholder="[2, 7, 11, 15], 9" style={{ minHeight: 80 }} />
                      </div>
                      <div style={{ padding: '0.85rem 1rem' }}>
                        <Label>Expected Output</Label>
                        <Textarea mono value={tc.expected} onChange={e => setTestCase(i, 'expected', e.target.value)} placeholder="[0, 1]" style={{ minHeight: 80 }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addTestCase} style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '0.65rem 1rem', cursor: 'pointer', width: '100%', transition: 'border-color 0.15s ease, color 0.15s ease' }}>
                  + Add Test Case
                </button>
              </div>
            )}
            {activeTab === 'Code' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Starter Code</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: 'var(--text-subtle)', marginLeft: 'auto' }}>{form.language}</span>
                  </div>
                  <div style={{ padding: '0.85rem 1rem' }}>
                    <Textarea mono value={form.starterCode} onChange={e => set('starterCode', e.target.value)}
                      placeholder={form.language === 'Python' ? 'def solution(nums: list[int], target: int) -> list[int]:\n    pass' : 'public int[] solution(int[] nums, int target) {\n    \n}'}
                      style={{ minHeight: 160 }}
                    />
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
                      The skeleton code shown to players when they first open the problem.
                    </div>
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Reference Solution</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: 'var(--text-subtle)', marginLeft: 'auto' }}>{form.language}</span>
                  </div>
                  <div style={{ padding: '0.85rem 1rem' }}>
                    <Textarea mono value={form.solution} onChange={e => set('solution', e.target.value)}
                      placeholder={form.language === 'Python'
                        ? 'def solution(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i'
                        : 'public int[] solution(int[] nums, int target) {\n    Map<Integer,Integer> seen = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        int comp = target - nums[i];\n        if (seen.containsKey(comp)) return new int[]{seen.get(comp), i};\n        seen.put(nums[i], i);\n    }\n    return new int[]{};\n}'}
                      style={{ minHeight: 200 }}
                    />
                    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
                      The correct implementation used to verify test cases.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>My Problems</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-subtle)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.1rem 0.45rem' }}>
              {saved.length}
            </span>
          </div>
          {saved.length > 0 ? (
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              {saved.map(p => (
                <SavedRow key={p.id} p={p} onEdit={() => handleEdit(p)} onDelete={() => handleDelete(p.id)} />
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-subtle)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.88rem' }}>
              No problems yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
