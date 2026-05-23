import React from 'react';

// ─── Typography ───────────────────────────────────────────────────────────────

interface TextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Title({ children, style, className }: TextProps) {
  return (
    <div
      className={className}
      style={{
        fontFamily: "'Jersey 10', sans-serif",
        fontSize: 'clamp(2.8rem, 4.2vw, 5rem)',
        color: '#fff',
        lineHeight: 0.75,
        letterSpacing: '-0.025em',
        fontWeight: 100,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function H1({ children, style, className }: TextProps) {
  return (
    <div
      className={className}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '2.25rem',
        color: '#fff',
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: '-0.025em',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function H2({ children, style, className }: TextProps) {
  return (
    <div
      className={className}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '1.75rem',
        color: '#fff',
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Body({ children, style, className }: TextProps) {
  return (
    <p
      className={className}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '1.5rem',
        color: '#fff',
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        fontWeight: 500,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// ─── Panel (card) ─────────────────────────────────────────────────────────────

export const CARD_RADIUS = '10px';
export const CARD_BG = '#1E1E1E';

interface PanelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Panel({ children, style, className }: PanelProps) {
  return (
    <div
      className={className}
      style={{
        background: CARD_BG,
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '48px',
  padding: '0 1.75rem',
  fontFamily: 'Inter, sans-serif',
  fontSize: '1rem',
  fontWeight: 600,
  letterSpacing: '-0.015em',
  borderRadius: '9px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  lineHeight: 1,
  outline: 'none',
  WebkitTapHighlightColor: 'transparent',
};

export function MainButton({ children, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...btnBase,
        background: '#fff',
        color: '#000',
        border: 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function SubButton({ children, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...btnBase,
        background: '#1E1E1E',
        color: '#e0e0e0',
        border: '2px solid #4D4D4D',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function DefaultButton({ children, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...btnBase,
        background: '#1E1E1E',
        color: '#e0e0e0',
        border: 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
