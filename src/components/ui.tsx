import React from 'react';

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
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 'clamp(2.8rem, 4.2vw, 5rem)',
        color: '#fff',
        lineHeight: 0.95,
        letterSpacing: 0,
        fontWeight: 850,
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
        letterSpacing: 0,
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
        letterSpacing: 0,
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
        letterSpacing: 0,
        fontWeight: 500,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export const CARD_RADIUS = '8px';
export const CARD_BG = '#0d0d0d';

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
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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
  letterSpacing: 0,
  borderRadius: '8px',
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
        background: '#fbbf24',
        color: '#171100',
        border: '1px solid #fbbf24',
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
        background: '#101010',
        color: '#e0e0e0',
        border: '1px solid rgba(255,255,255,0.16)',
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
        background: '#101010',
        color: '#e0e0e0',
        border: '1px solid rgba(255,255,255,0.14)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
