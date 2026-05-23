import { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  cursorStyle?: string;
  onComplete?: () => void;
}

export default function Typewriter({
  text,
  speed = 25,
  delay = 0,
  cursor = true,
  cursorStyle = '▋',
  onComplete,
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!isStarted) return;

    let index = 0;
    let interval: ReturnType<typeof setInterval>;

    const resetTimeout = setTimeout(() => {
      setDisplayedText('');
      setIsCompleted(false);
      interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsCompleted(true);
          if (onComplete) onComplete();
        }
      }, speed);
    }, 0);

    return () => {
      clearTimeout(resetTimeout);
      clearInterval(interval);
    };
  }, [isStarted, text, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {cursor && !isCompleted && (
        <span className="terminal-caret" style={{ marginLeft: '2px' }}>
          {cursorStyle}
        </span>
      )}
    </span>
  );
}
