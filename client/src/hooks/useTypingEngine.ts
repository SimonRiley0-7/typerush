import { useState, useEffect, useCallback, useRef } from 'react';
import { generateWords } from '../utils/words';
import { useAppSettings } from '../contexts/SettingsContext';
import { playClickSound } from '../utils/audio';

const cleanAccents = (str: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export type TestMode = 'time' | 'words';
export type TestStatus = 'idle' | 'running' | 'finished';

interface UseTypingEngineProps {
  mode: TestMode;
  duration: number;
  wordCount: number;
}

export const useTypingEngine = ({ mode, duration, wordCount }: UseTypingEngineProps) => {
  const { settings } = useAppSettings();
  const [status, setStatus] = useState<TestStatus>('idle');
  const [words, setWords] = useState<string[]>([]);
  const [typed, setTyped] = useState<string[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(duration);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const [cursor, setCursor] = useState({ wordIndex: 0, charIndex: 0 });
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, extra: 0, missed: 0 });
  const [isFailed, setIsFailed] = useState(false);
  
  // Advanced Analytics
  const [weakKeys, setWeakKeys] = useState<Record<string, number>>({});
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [keystrokes, setKeystrokes] = useState<{ char: string; timestamp: number }[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const shiftLeftPressed = useRef(false);
  const shiftRightPressed = useRef(false);

  useEffect(() => {
    const handleShiftCheck = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft') {
        shiftLeftPressed.current = e.type === 'keydown';
      }
      if (e.code === 'ShiftRight') {
        shiftRightPressed.current = e.type === 'keydown';
      }
    };
    window.addEventListener('keydown', handleShiftCheck);
    window.addEventListener('keyup', handleShiftCheck);
    return () => {
      window.removeEventListener('keydown', handleShiftCheck);
      window.removeEventListener('keyup', handleShiftCheck);
    };
  }, []);

  const failTest = useCallback(() => {
    setIsFailed(true);
    setStatus('finished');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Initialize test
  const initializeTest = useCallback(() => {
    const initialWordCount = mode === 'time' ? 300 : wordCount;
    setWords(generateWords(initialWordCount));
    setTyped(['']);
    setCursor({ wordIndex: 0, charIndex: 0 });
    setStatus('idle');
    setTimeLeft(duration);
    setTimeElapsed(0);
    setStats({ correct: 0, incorrect: 0, extra: 0, missed: 0 });
    setIsFailed(false);
    
    // Reset Advanced Analytics
    setWeakKeys({});
    setBackspaceCount(0);
    setKeystrokes([]);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    startTimeRef.current = null;
  }, [mode, duration, wordCount]);

  useEffect(() => {
    initializeTest();
  }, [initializeTest]);

  const startTimer = useCallback(() => {
    if (status === 'idle') {
      setStatus('running');
      startTimeRef.current = performance.now();
      timerRef.current = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
        if (mode === 'time') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              setStatus('finished');
              if (startTimeRef.current) {
                 setTimeElapsed((performance.now() - startTimeRef.current) / 1000);
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
  }, [status, mode]);

  const finishTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('finished');
    if (startTimeRef.current) {
       setTimeElapsed((performance.now() - startTimeRef.current) / 1000);
    }
    
    // Calculate missed characters for words left untyped if mode is words
    if (mode === 'words') {
       let missed = 0;
       for (let i = 0; i < words.length; i++) {
         const expected = words[i];
         const actual = typed[i] || '';
         if (actual.length < expected.length) {
            missed += expected.length - actual.length;
         }
       }
       setStats(s => ({ ...s, missed }));
    }
  }, [mode, words, typed]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement> | KeyboardEvent) => {
      if (status === 'finished') {
        if (e.key === 'Tab' || e.key === 'Enter') {
          e.preventDefault();
          initializeTest();
        }
        return;
      }

      if (e.key === 'Escape') {
        initializeTest();
        return;
      }

      // Ignore meta/ctrl/alt combinations
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== ' ') return;

      if (status === 'idle') {
        startTimer();
      }

      const { wordIndex, charIndex } = cursor;
      const currentWord = words[wordIndex];
      const currentTypedWord = typed[wordIndex] || '';

      // Stop On Error: letter (block further typing if there is a typo in the current word)
      if (settings.stopOnError === 'letter') {
        const hasTypo = currentTypedWord.split('').some((char, idx) => {
          const target = currentWord[idx];
          if (settings.lazyMode) {
            return cleanAccents(char) !== cleanAccents(target);
          }
          return char !== target;
        });
        if (hasTypo) {
          if (e.key !== 'Backspace' && e.key !== 'Escape' && e.key !== 'Tab' && e.key !== 'Enter') {
            e.preventDefault();
            return;
          }
        }
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (settings.confidenceMode) return; // Ignore backspace in confidence mode

        playClickSound(settings.clickSound, settings.soundVolume);
        setBackspaceCount(prev => prev + 1);
        
        if (charIndex > 0) {
          // Delete character in current word
          const newTypedWord = currentTypedWord.slice(0, -1);
          const newTyped = [...typed];
          newTyped[wordIndex] = newTypedWord;
          setTyped(newTyped);
          setCursor({ wordIndex, charIndex: charIndex - 1 });
        } else if (wordIndex > 0) {
          // Move back to previous word if it was incorrect
          const prevWord = words[wordIndex - 1];
          const prevTypedWord = typed[wordIndex - 1];
          if (prevTypedWord !== prevWord) {
            setCursor({ wordIndex: wordIndex - 1, charIndex: prevTypedWord.length });
          }
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (currentTypedWord.length === 0) return; // Don't allow multiple spaces or skipping empty words

        playClickSound(settings.clickSound, settings.soundVolume);

        const hasTypo = currentTypedWord.split('').some((char, idx) => {
          const target = currentWord[idx];
          if (settings.lazyMode) {
            return cleanAccents(char) !== cleanAccents(target);
          }
          return char !== target;
        }) || currentTypedWord.length < currentWord.length;

        // Strict Space: must match current word exactly to press space
        if (settings.strictSpace && currentTypedWord !== currentWord) {
          return;
        }

        // Stop on Error: word (cannot advance space if word has typo)
        if (settings.stopOnError === 'word' && hasTypo) {
          return;
        }

        const isWordCorrect = settings.lazyMode
          ? cleanAccents(currentTypedWord) === cleanAccents(currentWord)
          : currentTypedWord === currentWord;

        if (settings.difficulty === 'expert' && !isWordCorrect) {
          failTest();
          return;
        }

        // Check if finished (words mode)
        if (mode === 'words' && wordIndex === words.length - 1) {
          finishTest();
          return;
        }

        const newTyped = [...typed];
        newTyped[wordIndex + 1] = '';
        setTyped(newTyped);
        setCursor({ wordIndex: wordIndex + 1, charIndex: 0 });
        
        // Add to missed stats if word was incomplete
        if (currentTypedWord.length < currentWord.length) {
           setStats(s => ({ ...s, missed: s.missed + (currentWord.length - currentTypedWord.length) }));
        } else {
           // Successfully finished a correct word, count space as correct keystroke
           if (isWordCorrect) {
             setStats(s => ({ ...s, correct: s.correct + 1 }));
           } else {
             setStats(s => ({ ...s, incorrect: s.incorrect + 1 }));
           }
        }
        return;
      }

      // Regular character input
      if (e.key.length === 1) {
        e.preventDefault();
        
        // Prevent typing too many extra characters
        if (currentTypedWord.length >= currentWord.length + 10) return;

        playClickSound(settings.clickSound, settings.soundVolume);

        let isCorrect = charIndex < currentWord.length && (
          settings.lazyMode 
            ? cleanAccents(e.key) === cleanAccents(currentWord[charIndex]) 
            : e.key === currentWord[charIndex]
        );

        // Verify opposite shift
        if (isCorrect && settings.oppositeShift) {
          const targetChar = currentWord[charIndex];
          const isUpper = /[A-Z]/.test(targetChar);
          if (isUpper) {
            const leftHandChars = 'qwertasedfgzxcvb';
            const isLeftHand = leftHandChars.includes(targetChar.toLowerCase());
            if (isLeftHand && !shiftRightPressed.current) {
              isCorrect = false;
            } else if (!isLeftHand && !shiftLeftPressed.current) {
              isCorrect = false;
            }
          }
        }

        if (settings.difficulty === 'master' && !isCorrect) {
          const newTypedWord = currentTypedWord + e.key;
          const newTyped = [...typed];
          newTyped[wordIndex] = newTypedWord;
          setTyped(newTyped);
          setCursor({ wordIndex, charIndex: charIndex + 1 });
          setStats(s => ({ ...s, incorrect: s.incorrect + 1 }));
          failTest();
          return;
        }

        const newTypedWord = currentTypedWord + e.key;
        const newTyped = [...typed];
        newTyped[wordIndex] = newTypedWord;
        setTyped(newTyped);
        setCursor({ wordIndex, charIndex: charIndex + 1 });

        // Update stats
        if (charIndex < currentWord.length) {
          if (isCorrect) {
            setStats(s => ({ ...s, correct: s.correct + 1 }));
            setKeystrokes(prev => [...prev, { char: e.key, timestamp: performance.now() - (startTimeRef.current || performance.now()) }]);
          } else {
            setStats(s => ({ ...s, incorrect: s.incorrect + 1 }));
            setWeakKeys(prev => {
              const expectedChar = currentWord[charIndex];
              return { ...prev, [expectedChar]: (prev[expectedChar] || 0) + 1 };
            });
          }
        } else {
          setStats(s => ({ ...s, extra: s.extra + 1 }));
        }
        
        // Auto-finish word mode on last char
        const isMatch = settings.lazyMode 
          ? cleanAccents(newTypedWord) === cleanAccents(currentWord)
          : newTypedWord === currentWord;
        if (mode === 'words' && wordIndex === words.length - 1 && isMatch) {
            finishTest();
        }
      }
    },
    [status, cursor, words, typed, mode, startTimer, initializeTest, finishTest]
  );

  return {
    status,
    words,
    typed,
    cursor,
    timeLeft,
    timeElapsed,
    stats,
    weakKeys,
    backspaceCount,
    keystrokes,
    handleKeyDown,
    restart: initializeTest,
    isFailed
  };
};
