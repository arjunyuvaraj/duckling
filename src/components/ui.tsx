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
export const CARD_BG = 'var(--surface, #0d0d0d)';

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
        background: '#FFA100',
        color: '#fff',
        border: '1px solid #FFA100',
        boxShadow: '0 0 10px rgba(250, 93, 25, 0.15)',
        ...style,
      }}
      className={`glow-orange-hover ${props.className || ''}`}
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

export function GridCorner({ position = 'top-left' }: { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const styles: Record<string, React.CSSProperties> = {
    'top-left': { top: -10.5, left: -11 },
    'top-right': { top: -10.5, right: -11 },
    'bottom-left': { bottom: -10.5, left: -11 },
    'bottom-right': { bottom: -10.5, right: -11 },
  };

  return (
    <svg
      fill="none"
      height="21"
      viewBox="0 0 22 21"
      width="22"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 10,
        ...styles[position],
      }}
    >
      <path
        d="M10.5 4C10.5 7.31371 7.81371 10 4.5 10H0.5V11H4.5C7.81371 11 10.5 13.6863 10.5 17V21H11.5V17C11.5 13.6863 14.1863 11 17.5 11H21.5V10H17.5C14.1863 10 11.5 7.31371 11.5 4V0H10.5V4Z"
        fill="var(--border)"
      />
    </svg>
  );
}

