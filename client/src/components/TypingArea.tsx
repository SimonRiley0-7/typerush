import React, { useEffect, useRef, useState } from 'react';
import styles from './TypingArea.module.css';
import { useAppSettings } from '../contexts/SettingsContext';

interface TypingAreaProps {
  words: string[];
  typed: string[];
  cursor: { wordIndex: number; charIndex: number };
  status: 'idle' | 'running' | 'finished';
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const TypingArea: React.FC<TypingAreaProps> = ({ words, typed, cursor, status, onKeyDown }) => {
  const { settings } = useAppSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const paceCaretRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);

  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  // Auto focus hidden input when clicking on the area
  const handleClick = () => {
    if (status !== 'finished') {
      inputRef.current?.focus();
    }
  };

  // Caps Lock checking effect
  useEffect(() => {
    const handleCapsLockCheck = (e: KeyboardEvent) => {
      if (settings.capsLockWarning) {
        const isCapsLock = e.getModifierState('CapsLock');
        setCapsLockActive(isCapsLock);
      } else {
        setCapsLockActive(false);
      }
    };
    window.addEventListener('keydown', handleCapsLockCheck);
    window.addEventListener('keyup', handleCapsLockCheck);
    return () => {
      window.removeEventListener('keydown', handleCapsLockCheck);
      window.removeEventListener('keyup', handleCapsLockCheck);
    };
  }, [settings.capsLockWarning]);

  // Keep focus on load and add global keydown to auto-focus when typing starts
  useEffect(() => {
    if (status !== 'finished') {
      inputRef.current?.focus();
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (status === 'finished') return;
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [status]);

  // Ghost / Pace Caret Loop
  useEffect(() => {
    if (status !== 'running' || settings.paceCaret !== 'custom' || !wordsContainerRef.current || !paceCaretRef.current) {
      if (paceCaretRef.current) {
        paceCaretRef.current.style.transform = 'translate(0px, 0px)';
      }
      return;
    }

    const startTime = performance.now();
    let animationFrameId: number;

    const getWordAndCharIndex = (globalIndex: number, wordsList: string[]) => {
      let count = 0;
      for (let w = 0; w < wordsList.length; w++) {
        const word = wordsList[w];
        const wordLen = word.length + 1; // including space
        if (count + wordLen > globalIndex) {
          const charIdx = globalIndex - count;
          return { wordIndex: w, charIndex: charIdx >= word.length ? word.length : charIdx };
        }
        count += wordLen;
      }
      return { wordIndex: wordsList.length - 1, charIndex: wordsList[wordsList.length - 1].length };
    };

    const updatePaceCaret = () => {
      if (!wordsContainerRef.current || !paceCaretRef.current) return;
      const elapsed = (performance.now() - startTime) / 1000;
      const targetCharIndex = elapsed * (settings.paceCaretWpm / 12);
      
      const paceCursor = getWordAndCharIndex(Math.floor(targetCharIndex), words);
      
      const activeWordEl = wordsContainerRef.current.children[paceCursor.wordIndex] as HTMLElement;
      if (activeWordEl) {
        const activeCharEl = activeWordEl.children[paceCursor.charIndex] as HTMLElement;
        let caretTop = 0;
        let caretLeft = 0;

        if (activeCharEl) {
          caretTop = activeWordEl.offsetTop + activeCharEl.offsetTop;
          caretLeft = activeWordEl.offsetLeft + activeCharEl.offsetLeft;
        } else {
          const lastCharEl = activeWordEl.children[activeWordEl.children.length - 1] as HTMLElement;
          if (lastCharEl) {
            caretTop = activeWordEl.offsetTop + lastCharEl.offsetTop;
            caretLeft = activeWordEl.offsetLeft + lastCharEl.offsetLeft + lastCharEl.offsetWidth;
          } else {
            caretTop = activeWordEl.offsetTop;
            caretLeft = activeWordEl.offsetLeft;
          }
        }

        let scrollOffset = 0;
        const transform = wordsContainerRef.current.style.transform;
        if (transform && transform.includes('translateY(-')) {
          const match = transform.match(/translateY\(-\s*(\d+)px\)/);
          if (match) scrollOffset = parseInt(match[1], 10);
        }

        paceCaretRef.current.style.transform = `translate(${caretLeft}px, ${caretTop - scrollOffset}px)`;
      }
    };

    const loop = () => {
      updatePaceCaret();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, settings.paceCaret, settings.paceCaretWpm, words]);

  // Update caret position synchronously before browser paint
  React.useLayoutEffect(() => {
    if (!wordsContainerRef.current || !caretRef.current) return;
    
    // Find the current active character or word
    const activeWordEl = wordsContainerRef.current.children[cursor.wordIndex] as HTMLElement;
    if (activeWordEl) {
      const activeCharEl = activeWordEl.children[cursor.charIndex] as HTMLElement;
      
      let caretTop = 0;
      let caretLeft = 0;

      if (activeCharEl) {
        // Position at the start of the current character
        caretTop = activeWordEl.offsetTop + activeCharEl.offsetTop;
        caretLeft = activeWordEl.offsetLeft + activeCharEl.offsetLeft;
      } else {
        // Position at the end of the word if we are at the end
        const lastCharEl = activeWordEl.children[activeWordEl.children.length - 1] as HTMLElement;
        if (lastCharEl) {
          caretTop = activeWordEl.offsetTop + lastCharEl.offsetTop;
          caretLeft = activeWordEl.offsetLeft + lastCharEl.offsetLeft + lastCharEl.offsetWidth;
        } else {
          caretTop = activeWordEl.offsetTop;
          caretLeft = activeWordEl.offsetLeft;
        }
      }
      
      // Auto-scroll logic to keep active line in the middle of the 3 visible lines
      const lineHeight = activeWordEl.offsetHeight + 8; // approx 40-45px depending on margin
      let scrollOffset = 0;
      
      if (activeWordEl.offsetTop > lineHeight * 1.5) {
        // We are on line 3 or below
        scrollOffset = activeWordEl.offsetTop - lineHeight; // Keep one line visible above
      }

      wordsContainerRef.current.style.transform = `translateY(-${scrollOffset}px)`;
      // Apply 60fps hardware-accelerated transform to caret
      caretRef.current.style.transform = `translate(${caretLeft}px, ${caretTop - scrollOffset}px)`;
    }
  }, [cursor, typed]);

  return (
    <div className={styles.typingArea} onClick={handleClick} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        className={styles.hiddenInput}
        onKeyDown={onKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        disabled={status === 'finished'}
      />
      
      {status !== 'finished' && <div ref={caretRef} className={styles.caret} />}
      {status === 'running' && settings.paceCaret === 'custom' && <div ref={paceCaretRef} className={styles.paceCaret} />}
      
      {/* Caps Lock Warning banner */}
      {capsLockActive && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'var(--error-color)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px',
          fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem',
          zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', pointerEvents: 'none'
        }}>
          <i className="fas fa-lock" /> caps lock
        </div>
      )}

      {/* Out of Focus Warning Overlay */}
      {!isFocused && status !== 'finished' && settings.outOfFocusWarning && (
        <div 
          onClick={handleClick}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backdropFilter: 'blur(3px)', background: 'rgba(50, 52, 55, 0.6)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 100, cursor: 'pointer', borderRadius: '8px',
            color: 'var(--text-color)', fontSize: '1.1rem', transition: 'all 0.2s'
          }}
        >
          <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <i className="fas fa-mouse-pointer" style={{ color: 'var(--main-color)' }} /> Click or press any key to focus
          </div>
        </div>
      )}

      <div ref={wordsContainerRef} style={{ display: 'flex', flexWrap: 'wrap', transition: 'transform 0.2s ease' }}>
        {words.map((word, wIdx) => {
          const typedWord = typed[wIdx] || '';
          
          return (
            <div key={wIdx} className={styles.word}>
              {/* Render actual word characters */}
              {word.split('').map((char, cIdx) => {
                let charClass = '';
                let isIncorrect = false;
                if (wIdx < cursor.wordIndex) {
                  const isCorrect = typedWord[cIdx] === char;
                  charClass = isCorrect ? styles.correct : (settings.blindMode ? styles.correct : styles.incorrect);
                  isIncorrect = !isCorrect;
                } else if (wIdx === cursor.wordIndex && cIdx < cursor.charIndex) {
                  const isCorrect = typedWord[cIdx] === char;
                  charClass = isCorrect ? styles.correct : (settings.blindMode ? styles.correct : styles.incorrect);
                  isIncorrect = !isCorrect;
                }
                
                const showColorfulError = isIncorrect && !settings.blindMode && settings.colorfulMode;

                return (
                  <span 
                    key={cIdx} 
                    className={`${styles.char} ${charClass}`}
                    style={showColorfulError ? { backgroundColor: 'var(--error-color)', color: '#fff', borderRadius: '2px', padding: '0 2px' } : undefined}
                  >
                    {char}
                  </span>
                );
              })}
              
              {/* Render extra typed characters that aren't in the original word */}
              {typedWord.length > word.length && !settings.blindMode && !settings.hideExtraLetters && (
                typedWord.slice(word.length).split('').map((char, eIdx) => {
                  return (
                    <span 
                      key={`extra-${eIdx}`} 
                      className={`${styles.char} ${styles.extra}`}
                      style={settings.colorfulMode ? { backgroundColor: 'var(--error-extra-color)', color: '#fff', borderRadius: '2px', padding: '0 2px' } : undefined}
                    >
                      {char}
                    </span>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
