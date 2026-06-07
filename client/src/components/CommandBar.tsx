import React from 'react';
import type { TestMode } from '../hooks/useTypingEngine';

interface CommandBarProps {
  mode: TestMode;
  setMode: (mode: TestMode) => void;
  duration: number;
  setDuration: (val: number) => void;
  wordCount: number;
  setWordCount: (val: number) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({ 
  mode, setMode, duration, setDuration, wordCount, setWordCount 
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '2rem',
      backgroundColor: 'var(--sub-alt-color)',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      marginBottom: '2rem',
      fontSize: '0.9rem'
    }}>
      <div style={{ display: 'flex', gap: '1rem', borderRight: '2px solid var(--bg-color)', paddingRight: '2rem' }}>
        <button className={mode === 'time' ? 'active-btn' : ''} onClick={() => setMode('time')}>
          time
        </button>
        <button className={mode === 'words' ? 'active-btn' : ''} onClick={() => setMode('words')}>
          words
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {mode === 'time' ? (
          <>
            {[15, 30, 60, 120].map(val => (
              <button 
                key={val} 
                className={duration === val ? 'active-btn' : ''}
                onClick={() => setDuration(val)}
              >
                {val}
              </button>
            ))}
          </>
        ) : (
          <>
            {[10, 25, 50, 100].map(val => (
              <button 
                key={val} 
                className={wordCount === val ? 'active-btn' : ''}
                onClick={() => setWordCount(val)}
              >
                {val}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
