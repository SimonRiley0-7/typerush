import React, { useState } from 'react';
import { CommandBar } from '../components/CommandBar';
import { TypingArea } from '../components/TypingArea';
import { Results } from '../components/Results';
import { useTypingEngine } from '../hooks/useTypingEngine';
import type { TestMode } from '../hooks/useTypingEngine';
import { useAppSettings } from '../contexts/SettingsContext';
import { Keymap } from '../components/Keymap';

export function Home() {
  const { settings } = useAppSettings();
  const [mode, setMode] = useState<TestMode>('time');
  const [duration, setDuration] = useState(30);
  const [wordCount, setWordCount] = useState(25);

  const engine = useTypingEngine({ mode, duration, wordCount });

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (settings.quickRestart) {
          engine.restart();
        } else {
          const btn = document.getElementById('restart-btn');
          if (btn) btn.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <>
      {engine.status !== 'finished' && (
        <CommandBar 
          mode={mode} 
          setMode={setMode} 
          duration={duration} 
          setDuration={setDuration}
          wordCount={wordCount}
          setWordCount={setWordCount}
        />
      )}

      {/* Main Content Area */}
      <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {engine.status !== 'finished' && settings.timerPosition === 'above' && (
          <div style={{ 
            color: 'var(--main-color)', 
            fontSize: settings.timerSize === 'small' ? '1.1rem' : settings.timerSize === 'large' ? '2.5rem' : '1.6rem', 
            alignSelf: 'flex-start', 
            marginBottom: '1rem', 
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontFamily: 'var(--font-mono)'
          }}>
             {engine.status === 'running' && (
               <>
                 {mode === 'time' && <span style={{ color: 'var(--main-color)' }}>{engine.timeLeft}</span>}
                 {mode === 'words' && <span style={{ color: 'var(--sub-color)' }}>{engine.cursor.wordIndex}/{engine.words.length}</span>}
                 {settings.liveWpm && <span style={{ color: 'var(--sub-color)' }}>wpm: <span style={{ color: 'var(--text-color)' }}>{Math.round((engine.stats.correct * 12) / (engine.timeElapsed || 0.1))}</span></span>}
                 {settings.liveAccuracy && <span style={{ color: 'var(--sub-color)' }}>acc: <span style={{ color: 'var(--text-color)' }}>{Math.round((engine.stats.correct / ((engine.stats.correct + engine.stats.incorrect) || 1)) * 100)}%</span></span>}
               </>
             )}
          </div>
        )}

        {engine.status !== 'finished' ? (
          <div key={engine.words[0]} className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <TypingArea 
              words={engine.words}
              typed={engine.typed}
              cursor={engine.cursor}
              status={engine.status}
              onKeyDown={engine.handleKeyDown}
            />

            {settings.timerPosition === 'below' && (
              <div style={{ 
                color: 'var(--main-color)', 
                fontSize: settings.timerSize === 'small' ? '1.1rem' : settings.timerSize === 'large' ? '2.5rem' : '1.6rem', 
                alignSelf: 'flex-start', 
                marginTop: '1.5rem', 
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                fontFamily: 'var(--font-mono)'
              }}>
                 {engine.status === 'running' && (
                   <>
                     {mode === 'time' && <span style={{ color: 'var(--main-color)' }}>{engine.timeLeft}</span>}
                     {mode === 'words' && <span style={{ color: 'var(--sub-color)' }}>{engine.cursor.wordIndex}/{engine.words.length}</span>}
                     {settings.liveWpm && <span style={{ color: 'var(--sub-color)' }}>wpm: <span style={{ color: 'var(--text-color)' }}>{Math.round((engine.stats.correct * 12) / (engine.timeElapsed || 0.1))}</span></span>}
                     {settings.liveAccuracy && <span style={{ color: 'var(--sub-color)' }}>acc: <span style={{ color: 'var(--text-color)' }}>{Math.round((engine.stats.correct / ((engine.stats.correct + engine.stats.incorrect) || 1)) * 100)}%</span></span>}
                   </>
                 )}
              </div>
            )}

            {settings.showRestartButton && (
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button 
                  id="restart-btn"
                  onClick={engine.restart}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--sub-color)', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer', 
                    transition: 'color 0.2s',
                    padding: '1rem',
                    outline: 'none'
                  }}
                  title="Restart Test (Tab + Enter)"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sub-color)'}
                  onFocus={(e) => e.currentTarget.style.color = 'var(--text-color)'}
                  onBlur={(e) => e.currentTarget.style.color = 'var(--sub-color)'}
                >
                  <i className="fas fa-redo"></i>
                </button>
                
                <div style={{ color: 'var(--sub-color)', fontSize: '0.8rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>tab</span>
                  <span>+</span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>enter</span>
                  <span>- restart test</span>
                </div>
              </div>
            )}
            
            <Keymap />
          </div>
        ) : engine.isFailed ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center', padding: '3rem 0' }}>
            <h1 style={{ color: 'var(--error-color)', fontSize: '2.5rem', margin: 0, fontWeight: 'normal' }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.8rem' }} /> Test Failed
            </h1>
            <p style={{ color: 'var(--sub-color)', margin: 0, maxWidth: '450px', fontSize: '1rem', lineHeight: '1.5' }}>
              You made an error while typing in <span style={{ color: 'var(--main-color)' }}>{settings.difficulty}</span> difficulty mode.
            </p>
            <button 
              onClick={engine.restart}
              style={{
                padding: '0.8rem 1.8rem', background: 'var(--main-color)', color: 'var(--bg-color)',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                marginTop: '1rem', transition: 'all 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Try Again
            </button>
          </div>
        ) : (
          <Results 
            stats={engine.stats} 
            timeElapsed={engine.timeElapsed} 
            mode={`${mode} ${mode === 'time' ? duration : wordCount}`}
            onRestart={engine.restart} 
          />
        )}
      </div>
    </>
  );
}
