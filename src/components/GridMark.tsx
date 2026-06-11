import type { CSSProperties } from 'react';

const S: CSSProperties = {
  position: 'absolute',
  color: 'var(--border-hover)',
  fontSize: 11,
  lineHeight: 1,
  userSelect: 'none',
  pointerEvents: 'none',
  fontFamily: 'monospace',
  fontWeight: 300,
  zIndex: 2,
};

export function GridMark({ cols }: { cols: string[] }) {
  return (
    <>
      {cols.flatMap((x, i) => [
        <span key={`t${i}`} aria-hidden style={{ ...S, top: 0, left: x, transform: 'translate(-50%, -50%)' }}>+</span>,
        <span key={`b${i}`} aria-hidden style={{ ...S, bottom: 0, left: x, transform: 'translate(-50%, 50%)' }}>+</span>,
      ])}
    </>
  );
}
