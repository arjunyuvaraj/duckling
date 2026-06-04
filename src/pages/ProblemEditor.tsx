import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react';
import { Panel, CARD_BG, DefaultButton, GridCorner } from '../components/ui';
import { ALL_PROBLEMS, type Difficulty, type Language } from '../data/problems';
import { getProblemDetail } from '../data/problemDetails';
import { EDITOR_LANGUAGES, getStarterCode } from '../data/problemStarterCode';
import { readStoredUser } from '../utils/user';
import { markSolved } from '../utils/progress';
import { useTheme } from '../context/theme-core';

const GAP = 10;

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  lineHeight: '1.6rem',
};

const TEXT: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  letterSpacing: 0,
};

const DIFF_PILL: Record<Difficulty, { bg: string; border: string; color: string }> = {
  Easy:   { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  color: '#4ade80' },
  Medium: { bg: 'rgba(255,201,26,0.1)',  border: 'rgba(255,201,26,0.25)',  color: '#FFC91A' },
  Hard:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', color: '#f87171' },
};

const DARK_THEME_DEF = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment',         foreground: '6A9955' },
    { token: 'keyword',         foreground: 'C586C0' },
    { token: 'number',          foreground: 'B5CEA8' },
    { token: 'string',          foreground: 'CE9178' },
    { token: 'type.identifier', foreground: '4EC9B0' },
    { token: 'identifier',      foreground: 'D4D4D4' },
    { token: 'delimiter',       foreground: 'D4D4D4' },
    { token: 'operator',        foreground: 'D4D4D4' },
    { token: 'predefined',      foreground: '569CD6' },
  ],
  colors: {
    'editor.background':                   '#0f0f0f',
    'editor.foreground':                   '#e6e6e6',
    'editorLineNumber.foreground':         '#4b4b4b',
    'editorLineNumber.activeForeground':   '#FFA100',
    'editorCursor.foreground':             '#FFA100',
    'editor.selectionBackground':          '#3f1c0e',
    'editor.inactiveSelectionBackground':  '#2d1a10',
    'editorIndentGuide.background1':       '#2a2a2a',
    'editor.lineHighlightBackground':      '#151515',
    'editorBracketMatch.background':       '#3a3d41',
    'editorBracketMatch.border':           '#7a7a7a',
    'scrollbarSlider.background':          '#3f3f4660',
    'scrollbarSlider.hoverBackground':     '#52525b80',
    'scrollbarSlider.activeBackground':    '#71717a90',
  },
};

const LIGHT_THEME_DEF = {
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'comment',         foreground: '6A9955' },
    { token: 'keyword',         foreground: '0000ff' },
    { token: 'number',          foreground: '098658' },
    { token: 'string',          foreground: 'a31515' },
    { token: 'type.identifier', foreground: '267f99' },
    { token: 'identifier',      foreground: '1e1e1e' },
    { token: 'delimiter',       foreground: '1e1e1e' },
    { token: 'operator',        foreground: '1e1e1e' },
    { token: 'predefined',      foreground: '0000ff' },
  ],
  colors: {
    'editor.background':                  '#ffffff',
    'editor.foreground':                  '#1e1e1e',
    'editorLineNumber.foreground':        '#aaaaaa',
    'editorLineNumber.activeForeground':  '#FFA100',
    'editorCursor.foreground':            '#FFA100',
    'editor.selectionBackground':         '#ffd9b340',
    'editor.inactiveSelectionBackground': '#ffd9b320',
    'editorIndentGuide.background1':      '#e8e8e8',
    'editor.lineHighlightBackground':     '#f8f8f8',
    'editorBracketMatch.background':      '#e8e8e8',
    'editorBracketMatch.border':          '#bbbbbb',
    'scrollbarSlider.background':         '#c0c0c040',
    'scrollbarSlider.hoverBackground':    '#a0a0a060',
    'scrollbarSlider.activeBackground':   '#80808080',
  },
};

function TabBar<T extends string>({
  tabs, active, onSelect,
}: { tabs: readonly T[]; active: T; onSelect: (t: T) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end',
      height: 42, flexShrink: 0,
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)',
      paddingLeft: '1rem', gap: '0.125rem',
    }}>
      {tabs.map(t => {
        const on = t === active;
        return (
          <button key={t} onClick={() => onSelect(t)} style={{
            ...TEXT, fontSize: '0.875rem', fontWeight: 500,
            color: on ? 'var(--text-primary)' : 'var(--text-muted)',
            background: 'transparent', border: 'none',
            height: 42, padding: '0 0.75rem',
            cursor: 'pointer', outline: 'none',
            borderBottom: `2px solid ${on ? '#FFA100' : 'transparent'}`,
            marginBottom: -1,
          }}>
            {t}
          </button>
        );
      })}
    </div>
  );
}

function HPillDivider({ onMouseDown, active }: { onMouseDown: (e: React.MouseEvent) => void; active: boolean }) {
  return (
    <div style={{ width: GAP, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 4, height: 40,
          background: active ? 'var(--text-muted)' : 'var(--border-hover)',
          borderRadius: '2px',
          cursor: 'col-resize',
          transition: active ? 'none' : 'background 0.15s',
          flexShrink: 0,
        }}
      />
    </div>
  );
}

function VPillDivider({ onMouseDown, active }: { onMouseDown: (e: React.MouseEvent) => void; active: boolean }) {
  return (
    <div style={{ height: GAP, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        onMouseDown={onMouseDown}
        style={{
          height: 4, width: 40,
          background: active ? 'var(--text-muted)' : 'var(--border-hover)',
          borderRadius: '2px',
          cursor: 'row-resize',
          transition: active ? 'none' : 'background 0.15s',
          flexShrink: 0,
        }}
      />
    </div>
  );
}

const LEFT_TABS = ['Description', 'Hints']    as const;
const BOT_TABS  = ['Testcase', 'Test Result', 'AI Coach'] as const;
const CODE_API_BASE_URL = import.meta.env.VITE_CODE_API_BASE_URL ?? '';
const EDITOR_SETTINGS_KEY = 'duckling-editor-settings';

type AccentColor = 'yellow' | 'green' | 'blue' | 'coral';

interface EditorSettings {
  autoFill: boolean;
  wordWrap: boolean;
  minimap: boolean;
  fontSize: number;
  accent: AccentColor;
}

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  autoFill: true,
  wordWrap: false,
  minimap: false,
  fontSize: 15,
  accent: 'yellow',
};

const ACCENTS: Record<AccentColor, { label: string; color: string; soft: string; border: string }> = {
  yellow: { label: 'Duckling', color: '#FFA100', soft: 'rgba(255,161,0,0.1)', border: 'rgba(255,161,0,0.28)' },
  green: { label: 'Focus', color: '#4ade80', soft: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.28)' },
  blue: { label: 'Calm', color: '#60a5fa', soft: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.28)' },
  coral: { label: 'Energy', color: '#fb7185', soft: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.28)' },
};

function loadEditorSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(EDITOR_SETTINGS_KEY);
    if (!raw) return DEFAULT_EDITOR_SETTINGS;
    return { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_EDITOR_SETTINGS;
  }
}

function saveEditorSettings(settings: EditorSettings) {
  try {
    localStorage.setItem(EDITOR_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Editor settings still work for the current session when storage is unavailable.
  }
}

function toMethodName(title: string): string {
  const words = title.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/);
  if (words.length === 0) return 'solve';
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join('');
}

function registerDucklingCompletions(monaco: Monaco, problemTitle: string, problemTopic: string) {
  const javaSnippet = monaco.languages.CompletionItemKind.Snippet;
  const methodKind = monaco.languages.CompletionItemKind.Method;
  const keywordKind = monaco.languages.CompletionItemKind.Keyword;
  const functionKind = monaco.languages.CompletionItemKind.Function;
  const propertyKind = monaco.languages.CompletionItemKind.Property;
  const methodName = toMethodName(problemTitle);
  const javaReturnType = problemTopic === 'Strings' ? 'String' : 'Object';
  type CompletionProvider = Parameters<typeof monaco.languages.registerCompletionItemProvider>[1];
  type CompletionModel = Parameters<NonNullable<CompletionProvider['provideCompletionItems']>>[0];
  type CompletionPosition = Parameters<NonNullable<CompletionProvider['provideCompletionItems']>>[1];
  const topicWords = problemTopic.toLowerCase();

  function currentContext(model: CompletionModel, position: CompletionPosition) {
    const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
    const trimmed = linePrefix.trim();
    const afterDot = /\.\w*$/.test(linePrefix);
    const inMethodCall = /\w+\($/.test(linePrefix);
    const startsLine = trimmed.length === 0;
    const wantsLoop = /\b(for|while|loop|iter|range)\w*$/i.test(trimmed);
    const wantsBranch = /\b(if|else|condition|when)\w*$/i.test(trimmed);
    const wantsReturn = /\b(ret|return)\w*$/i.test(trimmed);
    return { afterDot, inMethodCall, startsLine, wantsLoop, wantsBranch, wantsReturn };
  }

  function ranked<T extends { label: string; tags?: string[]; insertText: string }>(items: T[], context: ReturnType<typeof currentContext>) {
    return items
      .filter((item) => {
        const tags = item.tags ?? [];
        if (context.afterDot) return tags.includes('method') || tags.includes('property');
        if (context.wantsLoop) return tags.includes('loop');
        if (context.wantsBranch) return tags.includes('branch');
        if (context.wantsReturn) return tags.includes('return');
        if (context.startsLine) return !tags.includes('method') && !tags.includes('property');
        if (context.inMethodCall) return tags.includes('value') || tags.includes('method');
        return true;
      })
      .map((item, index) => ({ ...item, sortText: String(index).padStart(2, '0') }));
  }

  const javaProvider = monaco.languages.registerCompletionItemProvider('java', {
    triggerCharacters: ['.', '(', ' ', '\n', 'r', 'f', 'i', 's', 'c'],
    provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
      const word = model.getWordUntilPosition(position);
      const context = currentContext(model, position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: ranked([
          {
            label: `${methodName} method`,
            kind: methodKind,
            insertText: `public ${javaReturnType} ${methodName}(` + '${1:}' + ') {\n    ' + '${0}' + '\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: `Problem-aware method stub for ${problemTitle}.`,
            tags: ['stub'],
            range,
          },
          {
            label: 'for loop',
            kind: javaSnippet,
            insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${0}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Counted loop with an index.',
            tags: ['loop'],
            range,
          },
          {
            label: 'enhanced for',
            kind: javaSnippet,
            insertText: 'for (${1:int} ${2:value} : ${3:values}) {\n    ${0}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Loop over every item in a collection or array.',
            tags: ['loop'],
            range,
          },
          {
            label: 'if / else',
            kind: javaSnippet,
            insertText: 'if (${1:condition}) {\n    ${2}\n} else {\n    ${0}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Branch on a condition.',
            tags: ['branch'],
            range,
          },
          {
            label: 'HashMap',
            kind: javaSnippet,
            insertText: 'Map<${1:Integer}, ${2:Integer}> ${3:map} = new HashMap<>();',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a HashMap for lookup problems.',
            tags: ['collection', 'hash'],
            range,
          },
          {
            label: 'ArrayList',
            kind: javaSnippet,
            insertText: 'List<${1:Integer}> ${2:result} = new ArrayList<>();',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a growable result list.',
            tags: ['collection'],
            range,
          },
          {
            label: 'containsKey',
            kind: methodKind,
            insertText: '${1:map}.containsKey(${2:key})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Check whether a map contains a key.',
            tags: ['method', 'hash'],
            range,
          },
          {
            label: 'charAt',
            kind: methodKind,
            insertText: '${1:s}.charAt(${2:i})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Read one character from a string.',
            tags: ['method', 'string'],
            range,
          },
          {
            label: 'length',
            kind: propertyKind,
            insertText: '${1:array}.length',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Array length property.',
            tags: ['property', 'array'],
            range,
          },
          {
            label: 'size',
            kind: methodKind,
            insertText: '${1:list}.size()',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Collection size method.',
            tags: ['method', 'collection'],
            range,
          },
          {
            label: 'Arrays.sort',
            kind: methodKind,
            insertText: 'Arrays.sort(${1:nums});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Sort an array in place.',
            tags: ['method', 'array', 'sort'],
            range,
          },
          {
            label: topicWords.includes('recursion') ? 'recursive base case' : 'base case',
            kind: javaSnippet,
            insertText: 'if (${1:baseCase}) {\n    return ${2:answer};\n}\n${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'A useful starting point for recursive or edge-case solutions.',
            tags: ['branch', 'return', 'recursion'],
            range,
          },
          {
            label: 'return',
            kind: keywordKind,
            insertText: 'return ${1:value};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Return a value from the method.',
            tags: ['return'],
            range,
          },
          {
            label: 'print trace',
            kind: methodKind,
            insertText: 'System.out.println("${1:trace}: " + ${2:value});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Print a quick debug trace.',
            tags: ['method'],
            range,
          },
        ], context),
      };
    },
  });

  const pythonProvider = monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', '(', ' ', '\n', ':', 'r', 'f', 'i', 'l', 'a'],
    provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
      const word = model.getWordUntilPosition(position);
      const context = currentContext(model, position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: ranked([
          {
            label: `${methodName} function`,
            kind: functionKind,
            insertText: `def ${methodName}(` + '${1:}' + '):\n    ' + '${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: `Problem-aware function stub for ${problemTitle}.`,
            tags: ['stub'],
            range,
          },
          {
            label: 'for in range',
            kind: javaSnippet,
            insertText: 'for ${1:i} in range(${2:n}):\n    ${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Counted loop with range().',
            tags: ['loop'],
            range,
          },
          {
            label: 'for each',
            kind: javaSnippet,
            insertText: 'for ${1:item} in ${2:items}:\n    ${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Loop through values.',
            tags: ['loop'],
            range,
          },
          {
            label: 'if / else',
            kind: javaSnippet,
            insertText: 'if ${1:condition}:\n    ${2}\nelse:\n    ${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Branch on a condition.',
            tags: ['branch'],
            range,
          },
          {
            label: 'dict counter',
            kind: javaSnippet,
            insertText: '${1:counts} = {}\nfor ${2:value} in ${3:values}:\n    ${1:counts}[${2:value}] = ${1:counts}.get(${2:value}, 0) + 1',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Build a frequency dictionary.',
            tags: ['collection', 'hash'],
            range,
          },
          {
            label: 'list result',
            kind: javaSnippet,
            insertText: '${1:result} = []\n${0}\nreturn ${1:result}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create and return a result list.',
            tags: ['collection', 'return'],
            range,
          },
          {
            label: 'enumerate',
            kind: functionKind,
            insertText: 'for ${1:i}, ${2:value} in enumerate(${3:values}):\n    ${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Loop with index and value.',
            tags: ['loop', 'method'],
            range,
          },
          {
            label: 'get',
            kind: methodKind,
            insertText: '${1:counts}.get(${2:key}, ${3:0})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Dictionary lookup with a default value.',
            tags: ['method', 'hash'],
            range,
          },
          {
            label: 'append',
            kind: methodKind,
            insertText: '${1:result}.append(${2:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Append a value to a list.',
            tags: ['method', 'collection'],
            range,
          },
          {
            label: 'len',
            kind: functionKind,
            insertText: 'len(${1:values})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Get the length of a list, string, or collection.',
            tags: ['method', 'value'],
            range,
          },
          {
            label: topicWords.includes('recursion') ? 'recursive base case' : 'base case',
            kind: javaSnippet,
            insertText: 'if ${1:base_case}:\n    return ${2:answer}\n${0}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'A useful starting point for recursive or edge-case solutions.',
            tags: ['branch', 'return', 'recursion'],
            range,
          },
          {
            label: 'return',
            kind: keywordKind,
            insertText: 'return ${1:value}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Return a value from the function.',
            tags: ['return'],
            range,
          },
          {
            label: 'print trace',
            kind: functionKind,
            insertText: 'print("${1:trace}:", ${2:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Print a quick debug trace.',
            tags: ['method'],
            range,
          },
        ], context),
      };
    },
  });

  return () => {
    javaProvider.dispose();
    pythonProvider.dispose();
  };
}

interface RunResult {
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  time: number | string | null;
  memory: number | null;
  summary: string;
  cases: Array<{
    expected: string;
    actual: string;
    verdict: string;
    passed: boolean;
  }>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      background: 'var(--surface-2)',
      borderRadius: 8,
      padding: '0.65rem 0.75rem',
      minWidth: 92,
    }}>
      <div style={{ ...MONO, fontSize: '0.65rem', lineHeight: 1, color: 'var(--text-subtle)', marginBottom: '0.35rem' }}>{label}</div>
      <div style={{ ...TEXT, fontSize: '0.82rem', fontWeight: 750, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.65rem' }}>
      {children}
    </div>
  );
}

function AICoachPanel({
  problem,
  code,
  runResult,
  onRun,
  running,
}: {
  problem: NonNullable<(typeof ALL_PROBLEMS)[number]>;
  code: string;
  runResult: RunResult | null;
  onRun: () => void;
  running: boolean;
}) {
  const signal = runResult
    ? runResult.status === 'Accepted'
      ? 'Ready for explanation review'
      : 'Ready to debug with run context'
    : 'Waiting for your first run';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: '1rem', minHeight: '100%' }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 260 }}>
        <div style={{ padding: '0.95rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ ...TEXT, color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.95rem' }}>Duckling AI Coach</div>
            <div style={{ ...TEXT, color: 'var(--text-subtle)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{signal}</div>
          </div>
          <span style={{ ...MONO, color: '#FFA100', border: '1px solid rgba(255,161,0,0.22)', background: 'rgba(255,161,0,0.07)', borderRadius: 999, padding: '0.35rem 0.55rem', fontSize: '0.68rem', lineHeight: 1 }}>
            model slot
          </span>
        </div>

        <div style={{ padding: '1rem', display: 'grid', gap: '0.8rem', flex: 1, alignContent: 'start' }}>
          {[
            ['Understand', `Explain the key idea for ${problem.title} without giving away full code.`],
            ['Debug', 'Use my latest test output to point me at the smallest next fix.'],
            ['Review', 'Check my solution for edge cases, clarity, and runtime.'],
          ].map(([title, copy]) => (
            <button key={title} type="button" style={{
              textAlign: 'left',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface)',
              padding: '0.85rem 0.95rem',
              cursor: 'default',
            }}>
              <div style={{ ...TEXT, color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.86rem', marginBottom: '0.25rem' }}>{title}</div>
              <div style={{ ...TEXT, color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{copy}</div>
            </button>
          ))}
        </div>

        <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.65rem' }}>
          <input
            disabled
            value="Ask for a hint, trace, or review..."
            readOnly
            style={{
              minHeight: 38,
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface)',
              color: 'var(--text-subtle)',
              padding: '0 0.8rem',
              outline: 'none',
            }}
          />
          <button type="button" disabled style={{ ...TEXT, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-3)', color: 'var(--text-subtle)', padding: '0 0.9rem', fontWeight: 800 }}>
            Soon
          </button>
        </div>
      </div>

      <aside style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', padding: '0.9rem' }}>
          <SectionLabel>Context sent</SectionLabel>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            {[
              `${problem.id}. ${problem.title}`,
              `${problem.language} / ${problem.topic}`,
              `${code.split('\n').length} code lines`,
              runResult ? `Last run: ${runResult.status}` : 'No run yet',
            ].map((item) => (
              <div key={item} style={{ ...MONO, color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: 1.45, borderBottom: '1px solid var(--border-faint)', paddingBottom: '0.4rem' }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={onRun} disabled={running} style={{
          ...TEXT,
          minHeight: 42,
          border: running ? '1px solid var(--border)' : '1px solid rgba(255,161,0,0.55)',
          borderRadius: 8,
          background: running ? 'var(--surface-3)' : 'rgba(255,161,0,0.1)',
          color: running ? 'var(--text-subtle)' : '#FFA100',
          fontWeight: 850,
          cursor: running ? 'default' : 'pointer',
        }}>
          {running ? 'Running...' : 'Run before asking AI'}
        </button>
      </aside>
    </div>
  );
}

export default function ProblemEditor() {
  const { id }  = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const problem = ALL_PROBLEMS.find(p => p.id === Number(id));
  const detail  = problem ? getProblemDetail(problem) : null;
  const { resolved } = useTheme();

  const storedUser = readStoredUser();
  const assignmentId = searchParams.get('assignment');
  const initials = storedUser?.username?.slice(0, 2).toUpperCase() ?? '>_';

  const [activeLanguage, setActiveLanguage] = useState<Language>(problem?.language ?? 'Java');
  const [code, setCode]           = useState(problem ? getStarterCode(problem.id, problem.language, problem) : '// Start coding here');
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [running, setRunning]     = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [leftTab, setLeftTab]     = useState<typeof LEFT_TABS[number]>('Description');
  const [botTab,  setBotTab]      = useState<typeof BOT_TABS[number]>('Testcase');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(loadEditorSettings);

  const [hSplit, setHSplit]       = useState(0.44);
  const [vSplit, setVSplit]       = useState(0.60);
  const [draggingH, setDraggingH] = useState(false);
  const [draggingV, setDraggingV] = useState(false);

  const containerRef    = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef       = useRef<Monaco | null>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const completionCleanupRef = useRef<(() => void) | null>(null);
  const suggestTimeoutRef = useRef<number | null>(null);

  const onHMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); setDraggingH(true); }, []);

  useEffect(() => {
    if (!draggingH) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, width } = containerRef.current.getBoundingClientRect();
      setHSplit(Math.min(Math.max((e.clientX - left) / width, 0.2), 0.75));
    };
    const onUp = () => setDraggingH(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingH]);

  const onVMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); setDraggingV(true); }, []);

  useEffect(() => {
    if (!draggingV) return;
    const onMove = (e: MouseEvent) => {
      if (!rightContentRef.current) return;
      const { top, height } = rightContentRef.current.getBoundingClientRect();
      setVSplit(Math.min(Math.max((e.clientY - top) / height, 0.15), 0.85));
    };
    const onUp = () => setDraggingV(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingV]);

  useEffect(() => {
    if (!problem) return;
    const timeout = setTimeout(() => {
      setActiveLanguage(problem.language);
      setCode(getStarterCode(problem.id, problem.language, problem));
      setRunResult(null);
    }, 0);
    return () => clearTimeout(timeout);
  }, [problem]);

  useEffect(() => {
    if (!languageMenuOpen) return;
    function onOutside(event: MouseEvent) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [languageMenuOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    function onOutside(event: MouseEvent) {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [settingsOpen]);

  useEffect(() => {
    saveEditorSettings(editorSettings);
  }, [editorSettings]);

  // Switch Monaco theme when app theme changes
  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(
      resolved === 'light' ? 'duckling-light' : 'duckling-dark'
    );
  }, [resolved]);

  const trackCursor = useCallback(() => {
    const position = monacoEditorRef.current?.getPosition();
    if (!position) return;
    setCursorPos({ line: position.lineNumber, col: position.column });
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monacoEditorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('duckling-dark',  DARK_THEME_DEF);
    monaco.editor.defineTheme('duckling-light', LIGHT_THEME_DEF);
    monaco.editor.setTheme(resolved === 'light' ? 'duckling-light' : 'duckling-dark');
    completionCleanupRef.current?.();
    completionCleanupRef.current = registerDucklingCompletions(monaco, problem?.title ?? 'Solve', problem?.topic ?? 'Algorithms');

    editor.onDidChangeCursorPosition(trackCursor);
    trackCursor();
  };

  useEffect(() => () => {
    completionCleanupRef.current?.();
    if (suggestTimeoutRef.current) window.clearTimeout(suggestTimeoutRef.current);
  }, []);

  const updateEditorSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setEditorSettings((current) => ({ ...current, [key]: value }));
  };

  const fillStarterCode = () => {
    if (!problem) return;
    setCode(getStarterCode(problem.id, activeLanguage, problem));
    setRunResult(null);
  };

  const insertTraceLine = () => {
    const trace = activeLanguage === 'Python'
      ? '\n    print("trace:", )'
      : '\n    System.out.println("trace: " + );';
    const editor = monacoEditorRef.current;
    if (!editor) {
      setCode((current) => `${current}${trace}`);
      return;
    }
    const selection = editor.getSelection();
    const position = editor.getPosition();
    const range = selection ?? {
      startLineNumber: position?.lineNumber ?? 1,
      startColumn: position?.column ?? 1,
      endLineNumber: position?.lineNumber ?? 1,
      endColumn: position?.column ?? 1,
    };
    editor.executeEdits('duckling-trace', [{ range, text: trace, forceMoveMarkers: true }]);
    setCode(editor.getValue());
    editor.focus();
  };

  const triggerSuggest = () => {
    monacoEditorRef.current?.focus();
    monacoEditorRef.current?.trigger('duckling-toolbar', 'editor.action.triggerSuggest', {});
  };

  const handleCodeChange = (value: string | undefined) => {
    const next = value ?? '';
    setCode(next);
    if (!editorSettings.autoFill) return;

    const last = next.at(-1) ?? '';
    if (!/[A-Za-z._(:\s]/.test(last)) return;
    if (suggestTimeoutRef.current) window.clearTimeout(suggestTimeoutRef.current);
    suggestTimeoutRef.current = window.setTimeout(() => {
      monacoEditorRef.current?.trigger('duckling-typing', 'editor.action.triggerSuggest', {});
    }, last === '.' ? 20 : 120);
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    setBotTab('Test Result');

    try {
      const response = await fetch(`${CODE_API_BASE_URL}/api/code/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem?.id, language: activeLanguage, sourceCode: code }),
      });
      const data = (await response.json().catch(() => ({}))) as RunResult & { error?: string; ok?: boolean };

      if (!response.ok || data.ok === false) throw new Error(data.error ?? 'Code execution failed.');

      const finalResult: RunResult = {
        status: data.status, stdout: data.stdout, stderr: data.stderr,
        compileOutput: data.compileOutput, message: data.message,
        time: data.time, memory: data.memory, summary: data.summary,
        cases: data.cases ?? [],
      };
      setRunResult(finalResult);
      if (finalResult.status === 'Accepted' && problem) markSolved(problem.id, code, activeLanguage);
      if (assignmentId && problem && storedUser) {
        void fetch(`${CODE_API_BASE_URL}/api/classroom/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId,
            userId: storedUser.id,
            username: storedUser.username,
            problemId: problem.id,
            language: activeLanguage,
            sourceCode: code,
            status: finalResult.status,
            summary: finalResult.summary || finalResult.message || '',
          }),
        }).catch(() => {});
      }
    } catch (error) {
      setRunResult({
        status: 'Error', stdout: '', stderr: '', compileOutput: '',
        message: error instanceof Error ? error.message : 'Code execution failed.',
        time: null, memory: null, summary: '', cases: [],
      });
    } finally {
      setRunning(false);
    }
  };

  if (!problem || !detail) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <span style={{ ...TEXT, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Problem not found.</span>
      </div>
    );
  }

  const isDragging = draggingH || draggingV;
  const pill = DIFF_PILL[problem.difficulty];
  const monacoLanguage = activeLanguage === 'Java' ? 'java' : activeLanguage === 'Python' ? 'python' : 'cpp';
  const accent = ACCENTS[editorSettings.accent];

  return (
    <div style={{
      height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
      padding: 8, gap: 8,
      overflow: 'hidden', boxSizing: 'border-box',
      cursor: draggingH ? 'col-resize' : draggingV ? 'row-resize' : undefined,
      userSelect: isDragging ? 'none' : undefined,
    }}>

      {/* Top bar */}
      <div style={{
        flexShrink: 0, minHeight: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 0.65rem', gap: '0.85rem',
      }}>
        <Link to="/home" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Stack', 'Geist', 'Inter', sans-serif", fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            ducklings.dev
          </span>
        </Link>
        <div style={{ display: 'grid', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
          <span style={{ color: 'var(--text-subtle)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>/</span>
          <span style={{ ...MONO, color: '#FFA100', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
            solve problem-{problem.id}
          </span>
          <span style={{ ...TEXT, color: 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {problem.title}
          </span>
          </div>
          <span style={{ ...TEXT, color: 'var(--text-subtle)', fontSize: '0.72rem', marginTop: '0.15rem' }}>
            {problem.set} / {problem.batch}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setBotTab('AI Coach')}
          style={{
            ...TEXT,
            height: 34,
            border: '1px solid rgba(255,161,0,0.22)',
            background: 'rgba(255,161,0,0.07)',
            color: '#FFA100',
            borderRadius: 8,
            padding: '0 0.9rem',
            fontWeight: 850,
            cursor: 'pointer',
          }}
        >
          AI Coach
        </button>
        <Link to="/library" style={{ textDecoration: 'none' }}>
          <DefaultButton style={{ height: 34, fontSize: '0.875rem', padding: '0 1rem', letterSpacing: 0 }}>
            Library
          </DefaultButton>
        </Link>
        <Link to="/account" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid rgba(255,161,0,0.45)', color: '#FFA100', display: 'grid', placeItems: 'center', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}>
            {initials}
          </div>
        </Link>
      </div>

      {/* Main split area */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left — description panel */}
        <Panel style={{
          width: `${hSplit * 100}%`, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          pointerEvents: isDragging ? 'none' : undefined,
          overflow: 'visible', position: 'relative',
        }}>
          <GridCorner position="top-left" />
          <GridCorner position="top-right" />
          <GridCorner position="bottom-left" />
          <GridCorner position="bottom-right" />
          <TabBar tabs={LEFT_TABS} active={leftTab} onSelect={setLeftTab} />

          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem 3rem' }}>
            {leftTab === 'Description' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ ...MONO, color: '#FFA100', fontSize: '0.72rem', marginBottom: '0.45rem' }}>problem {problem.id}</div>
                    <h1 style={{ ...TEXT, fontWeight: 850, fontSize: 'clamp(1.35rem, 2vw, 1.85rem)', lineHeight: 1.08, color: 'var(--text-primary)', margin: 0 }}>
                      {problem.title}
                    </h1>
                  </div>
                  <span style={{ ...TEXT, flexShrink: 0, fontSize: '0.75rem', fontWeight: 800, padding: '5px 10px', borderRadius: '999px', background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}>
                    {problem.difficulty}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.55rem', marginBottom: '1.25rem' }}>
                  <MiniMetric label="acceptance" value={`${problem.acceptance}%`} />
                  <MiniMetric label="topic" value={problem.topic} />
                  <MiniMetric label="language" value={activeLanguage} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,161,0,0.06)', border: '1px solid rgba(255,161,0,0.18)', color: '#FFA100' }}>
                    {problem.set}
                  </span>
                  <span style={{ ...TEXT, fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-subtle)' }}>
                    {problem.batch}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                  {problem.tags.map((tag) => (
                    <span key={tag} style={{ ...MONO, fontSize: '0.68rem', lineHeight: 1, color: 'var(--text-subtle)', padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', padding: '1rem 1.05rem' }}>
                  <SectionLabel>Prompt</SectionLabel>
                  <p style={{ ...TEXT, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.82, margin: 0 }}>
                    {detail.description}
                  </p>
                </div>

                {detail.note && (
                  <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(255,201,26,0.05)', border: '1px solid rgba(255,201,26,0.15)', borderRadius: '8px' }}>
                    <p style={{ ...TEXT, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Note: </strong>{detail.note}
                    </p>
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ ...TEXT, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.625rem' }}>Example 1:</p>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-subtle)' }}>Input: </span>{detail.sampleInput}
                    </div>
                    <div style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-subtle)' }}>Output: </span>{detail.sampleOutput}
                    </div>
                    <div style={{ ...TEXT, fontSize: '0.8rem', color: 'var(--text-subtle)', lineHeight: 1.6, marginTop: '0.25rem' }}>
                      <span style={{ color: 'var(--text-subtle)' }}>Explanation: </span>{detail.explanation}
                    </div>
                  </div>
                </div>

                <div>
                  <p style={{ ...TEXT, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.625rem' }}>Constraints:</p>
                  <ul style={{ margin: 0, padding: '0 0 0 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {detail.constraints.map((c, i) => (
                      <li key={i} style={{ ...TEXT, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {[
                  ['1', 'Name the shape', 'Write down the input type, output type, and the smallest valid case.'],
                  ['2', 'Pick a pattern', `This is a ${problem.topic.toLowerCase()} problem, so start from the common pattern before optimizing.`],
                  ['3', 'Trace first', 'Run through the sample by hand and compare each variable update to your code.'],
                ].map(([step, title, copy]) => (
                  <div key={step} style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-2)', padding: '0.95rem 1rem', display: 'grid', gridTemplateColumns: '34px 1fr', gap: '0.8rem' }}>
                    <span style={{ ...MONO, width: 34, height: 34, borderRadius: 8, background: 'rgba(255,161,0,0.1)', color: '#FFA100', display: 'grid', placeItems: 'center', fontWeight: 900 }}>{step}</span>
                    <span>
                      <strong style={{ ...TEXT, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{title}</strong>
                      <p style={{ ...TEXT, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0.25rem 0 0' }}>{copy}</p>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <HPillDivider onMouseDown={onHMouseDown} active={draggingH} />

        {/* Right — editor + results */}
        <div
          ref={rightContentRef}
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: isDragging ? 'none' : undefined }}
        >
          {/* Editor panel */}
          <Panel style={{ flex: vSplit * 100, display: 'flex', flexDirection: 'column', minHeight: 0, background: CARD_BG, overflow: 'visible', position: 'relative' }}>
            <GridCorner position="top-left" />
            <GridCorner position="top-right" />
            <GridCorner position="bottom-left" />
            <GridCorner position="bottom-right" />

            {/* Editor toolbar */}
            <div style={{
              height: 46, flexShrink: 0,
              display: 'flex', alignItems: 'center',
              padding: '0 1rem', gap: '0.75rem',
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border)',
            }}>
              <div ref={languageMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setLanguageMenuOpen(open => !open)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    ...TEXT, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)',
                    background: 'var(--surface-3)', border: '1px solid var(--border)',
                    borderRadius: '7px', padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  {activeLanguage}
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.7rem' }}>▾</span>
                </button>
                {languageMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 30,
                    minWidth: 140,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10, overflow: 'hidden',
                    boxShadow: '0 14px 28px rgba(0,0,0,0.15)',
                  }}>
                    {EDITOR_LANGUAGES.map((language) => (
                      <button
                        key={language} type="button"
                        onClick={() => { setActiveLanguage(language); setCode(getStarterCode(problem.id, language, problem)); setRunResult(null); setLanguageMenuOpen(false); }}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '0.7rem 0.85rem',
                          background: language === activeLanguage ? 'rgba(255,161,0,0.08)' : 'transparent',
                          color: language === activeLanguage ? '#FFA100' : 'var(--text-primary)',
                          border: 'none',
                          borderBottom: language === EDITOR_LANGUAGES[EDITOR_LANGUAGES.length - 1] ? 'none' : '1px solid var(--border-faint)',
                          cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600,
                        }}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={fillStarterCode}
                style={{
                  ...TEXT,
                  height: 30,
                  border: `1px solid ${accent.border}`,
                  background: accent.soft,
                  color: accent.color,
                  borderRadius: 7,
                  padding: '0 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 850,
                  cursor: 'pointer',
                }}
              >
                Autofill starter
              </button>
              <button
                type="button"
                onClick={insertTraceLine}
                style={{
                  ...TEXT,
                  height: 30,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-3)',
                  color: 'var(--text-muted)',
                  borderRadius: 7,
                  padding: '0 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Add trace
              </button>
              <button
                type="button"
                onClick={triggerSuggest}
                style={{
                  ...TEXT,
                  height: 30,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-3)',
                  color: 'var(--text-muted)',
                  borderRadius: 7,
                  padding: '0 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Complete
              </button>
              <div style={{ flex: 1 }} />
              <div ref={settingsMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(open => !open)}
                  style={{
                    ...TEXT,
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    height: 30,
                    padding: '0 0.85rem',
                    background: settingsOpen ? accent.soft : 'var(--surface-3)',
                    color: settingsOpen ? accent.color : 'var(--text-muted)',
                    border: `1px solid ${settingsOpen ? accent.border : 'var(--border)'}`,
                    borderRadius: 7,
                    cursor: 'pointer',
                  }}
                >
                  Settings
                </button>
                {settingsOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    zIndex: 40,
                    width: 300,
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: 'var(--surface)',
                    boxShadow: '0 18px 34px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ ...TEXT, color: 'var(--text-primary)', fontWeight: 850, fontSize: '0.92rem' }}>Editor settings</div>
                      <div style={{ ...TEXT, color: 'var(--text-subtle)', fontSize: '0.76rem', marginTop: '0.25rem' }}>Saved on this device.</div>
                    </div>
                    <div style={{ padding: '0.9rem 1rem', display: 'grid', gap: '0.8rem' }}>
                      {[
                        ['autoFill', 'Autofill & suggestions', 'Autocomplete, bracket closing, and tab completion.'],
                        ['wordWrap', 'Word wrap', 'Keep long lines visible without horizontal scrolling.'],
                        ['minimap', 'Minimap', 'Show the code overview rail.'],
                      ].map(([key, label, copy]) => {
                        const settingKey = key as 'autoFill' | 'wordWrap' | 'minimap';
                        return (
                          <label key={key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center', cursor: 'pointer' }}>
                            <span>
                              <span style={{ ...TEXT, display: 'block', color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 750 }}>{label}</span>
                              <span style={{ ...TEXT, display: 'block', color: 'var(--text-subtle)', fontSize: '0.72rem', lineHeight: 1.35, marginTop: '0.15rem' }}>{copy}</span>
                            </span>
                            <input
                              type="checkbox"
                              checked={Boolean(editorSettings[settingKey])}
                              onChange={(event) => updateEditorSetting(settingKey, event.target.checked)}
                            />
                          </label>
                        );
                      })}
                      <label style={{ display: 'grid', gap: '0.45rem' }}>
                        <span style={{ ...TEXT, color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 750 }}>Text size</span>
                        <input
                          type="range"
                          min={13}
                          max={18}
                          value={editorSettings.fontSize}
                          onChange={(event) => updateEditorSetting('fontSize', Number(event.target.value))}
                          style={{ accentColor: accent.color }}
                        />
                      </label>
                      <div>
                        <span style={{ ...TEXT, display: 'block', color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 750, marginBottom: '0.5rem' }}>Accent color</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
                          {(Object.keys(ACCENTS) as AccentColor[]).map((key) => {
                            const option = ACCENTS[key];
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => updateEditorSetting('accent', key)}
                                title={option.label}
                                style={{
                                  height: 34,
                                  borderRadius: 8,
                                  border: `1px solid ${editorSettings.accent === key ? option.color : 'var(--border)'}`,
                                  background: option.soft,
                                  color: option.color,
                                  cursor: 'pointer',
                                  fontWeight: 900,
                                }}
                              >
                                ●
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBotTab('AI Coach')}
                style={{
                  ...TEXT,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  height: 30,
                  padding: '0 0.85rem',
                  background: 'var(--surface-3)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  cursor: 'pointer',
                }}
              >
                Ask AI
              </button>
              <button onClick={handleRun} disabled={running} style={{
                ...TEXT, fontSize: '0.85rem', fontWeight: 600,
                height: 30, padding: '0 1.25rem',
                background: running ? 'var(--surface-3)' : '#FFA100',
                color: running ? 'var(--text-subtle)' : '#fff',
                border: running ? '1px solid var(--border)' : '1px solid #FFA100',
                borderRadius: '7px',
                cursor: running ? 'default' : 'pointer', outline: 'none',
              }} className="glow-orange-hover">
                {running ? 'Running...' : 'Run tests'}
              </button>
            </div>

            {/* Monaco editor */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Editor
                height="100%"
                defaultLanguage={monacoLanguage}
                language={monacoLanguage}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: editorSettings.minimap },
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: editorSettings.fontSize,
                  lineHeight: Math.round(editorSettings.fontSize * 1.85),
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: editorSettings.wordWrap ? 'on' : 'off',
                  tabSize: 4,
                  insertSpaces: true,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'line',
                  bracketPairColorization: { enabled: true },
                  guides: { indentation: true, bracketPairs: true },
                  quickSuggestions: editorSettings.autoFill,
                  suggestOnTriggerCharacters: editorSettings.autoFill,
                  acceptSuggestionOnEnter: editorSettings.autoFill ? 'on' : 'off',
                  tabCompletion: editorSettings.autoFill ? 'on' : 'off',
                  autoClosingBrackets: editorSettings.autoFill ? 'always' : 'never',
                  autoClosingQuotes: editorSettings.autoFill ? 'always' : 'never',
                  glyphMargin: false,
                  folding: false,
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                }}
              />
            </div>

            {/* Status bar */}
            <div style={{
              height: 24, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 1rem',
              borderTop: '1px solid var(--border-faint)',
              background: 'var(--surface-2)',
            }}>
              <span style={{ ...TEXT, fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                Saved / Autofill {editorSettings.autoFill ? 'on' : 'off'} / {activeLanguage}
              </span>
              <span style={{ ...TEXT, fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                {editorSettings.wordWrap ? 'Wrap' : 'No wrap'} / {editorSettings.fontSize}px / Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
            </div>
          </Panel>

          <VPillDivider onMouseDown={onVMouseDown} active={draggingV} />

          {/* Bottom — test results panel */}
          <Panel style={{ flex: (1 - vSplit) * 100, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'visible', position: 'relative' }}>
            <GridCorner position="top-left" />
            <GridCorner position="top-right" />
            <GridCorner position="bottom-left" />
            <GridCorner position="bottom-right" />
            <TabBar tabs={BOT_TABS} active={botTab} onSelect={setBotTab} />

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
              {botTab === 'Testcase' ? (
                <div>
                  <SectionLabel>Sample case</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.75rem' }}>
                    <div>
                      <div style={{ ...TEXT, color: 'var(--text-subtle)', fontSize: '0.75rem', fontWeight: 750, marginBottom: '0.4rem' }}>Input</div>
                      <pre style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap', minHeight: 82 }}>
                        {detail.sampleInput}
                      </pre>
                    </div>
                    <div>
                      <div style={{ ...TEXT, color: 'var(--text-subtle)', fontSize: '0.75rem', fontWeight: 750, marginBottom: '0.4rem' }}>Expected</div>
                      <pre style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap', minHeight: 82 }}>
                        {detail.sampleOutput}
                      </pre>
                    </div>
                  </div>
                  <p style={{ ...TEXT, fontSize: '0.8rem', color: 'var(--text-subtle)', lineHeight: 1.7, marginTop: '0.75rem' }}>
                    Run executes your method against built-in backend tests. The AI Coach will use this sample, your latest code, and the test result context once connected.
                  </p>
                </div>
              ) : botTab === 'AI Coach' ? (
                <AICoachPanel
                  problem={problem}
                  code={code}
                  runResult={runResult}
                  onRun={handleRun}
                  running={running}
                />
              ) : running ? (
                <span style={{ ...TEXT, fontSize: '0.875rem', color: 'var(--text-subtle)' }}>Running...</span>
              ) : runResult ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.9rem' }}>
                    <div style={{ ...TEXT, fontSize: '1rem', fontWeight: 850, color: runResult.status === 'Accepted' ? '#4ade80' : runResult.status === 'Error' ? '#f87171' : '#FFA100', letterSpacing: 0 }}>
                      {runResult.status}
                    </div>
                    <button type="button" onClick={() => setBotTab('AI Coach')} style={{ ...TEXT, border: '1px solid rgba(255,161,0,0.22)', background: 'rgba(255,161,0,0.07)', color: '#FFA100', borderRadius: 8, minHeight: 32, padding: '0 0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                      Review with AI
                    </button>
                  </div>
                  {(runResult.time || runResult.memory) && (
                    <div style={{ ...TEXT, fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
                      {runResult.time ? `Time: ${runResult.time}s` : null}
                      {runResult.time && runResult.memory ? ' · ' : null}
                      {runResult.memory ? `Memory: ${runResult.memory} KB` : null}
                    </div>
                  )}
                  {runResult.summary && (
                    <div style={{ ...TEXT, fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {runResult.summary}
                    </div>
                  )}
                  {runResult.message && (
                    <div style={{ ...TEXT, fontSize: '0.84rem', color: '#f0c674', marginBottom: '0.75rem' }}>
                      {runResult.message}
                    </div>
                  )}
                  {runResult.cases.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: '0.85rem' }}>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) 120px 72px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        {['Expected', 'Run', 'Check'].map((h, i) => (
                          <div key={h} style={{ ...TEXT, padding: '0.75rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                            {h}
                          </div>
                        ))}
                        <div />
                      </div>
                      {/* Table rows */}
                      {runResult.cases.map((tc, idx) => (
                        <div key={`${tc.expected}-${idx}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) 120px 72px 16px', borderBottom: idx === runResult.cases.length - 1 ? 'none' : '1px solid var(--border)', background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                          <div style={{ ...MONO, padding: '0.85rem 0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {tc.expected}
                          </div>
                          <div style={{ ...MONO, padding: '0.85rem 0.9rem', color: tc.passed ? 'var(--text-primary)' : '#f87171', borderLeft: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {tc.actual}
                          </div>
                          <div style={{ ...TEXT, padding: '0.85rem 0.9rem', color: tc.passed ? '#4ade80' : '#f87171', borderLeft: '1px solid var(--border)', fontWeight: 700 }}>
                            {tc.verdict}
                          </div>
                          <div style={{ background: tc.passed ? '#0f8b0f' : '#c41e1e' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {runResult.compileOutput && (
                      <div>
                        <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>Compile output</div>
                        <pre style={{ ...MONO, fontSize: '0.78rem', color: '#f87171', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>{runResult.compileOutput}</pre>
                      </div>
                    )}
                    {runResult.stderr && (
                      <div>
                        <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>stderr</div>
                        <pre style={{ ...MONO, fontSize: '0.78rem', color: '#f87171', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>{runResult.stderr}</pre>
                      </div>
                    )}
                    <div>
                      <div style={{ ...TEXT, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>stdout</div>
                      <pre style={{ ...MONO, fontSize: '0.78rem', color: 'var(--text-primary)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.75rem 1rem', margin: 0, whiteSpace: 'pre-wrap' }}>{runResult.stdout || runResult.summary || 'No output.'}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <span style={{ ...TEXT, fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
                  Click Run to test your code.
                </span>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
