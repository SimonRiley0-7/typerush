import React, { useEffect, useState } from 'react';
import { useAppSettings } from '../contexts/SettingsContext';

interface KeyInfo {
  code: string;
  label: string;
}

const layouts: Record<'qwerty' | 'colemak' | 'dvorak', KeyInfo[][]> = {
  qwerty: [
    [
      { code: 'KeyQ', label: 'q' }, { code: 'KeyW', label: 'w' }, { code: 'KeyE', label: 'e' }, { code: 'KeyR', label: 'r' },
      { code: 'KeyT', label: 't' }, { code: 'KeyY', label: 'y' }, { code: 'KeyU', label: 'u' }, { code: 'KeyI', label: 'i' },
      { code: 'KeyO', label: 'o' }, { code: 'KeyP', label: 'p' }, { code: 'BracketLeft', label: '[' }, { code: 'BracketRight', label: ']' }
    ],
    [
      { code: 'KeyA', label: 'a' }, { code: 'KeyS', label: 's' }, { code: 'KeyD', label: 'd' }, { code: 'KeyF', label: 'f' },
      { code: 'KeyG', label: 'g' }, { code: 'KeyH', label: 'h' }, { code: 'KeyJ', label: 'j' }, { code: 'KeyK', label: 'k' },
      { code: 'KeyL', label: 'l' }, { code: 'Semicolon', label: ';' }, { code: 'Quote', label: '\'' }
    ],
    [
      { code: 'KeyZ', label: 'z' }, { code: 'KeyX', label: 'x' }, { code: 'KeyC', label: 'c' }, { code: 'KeyV', label: 'v' },
      { code: 'KeyB', label: 'b' }, { code: 'KeyN', label: 'n' }, { code: 'KeyM', label: 'm' }, { code: 'Comma', label: ',' },
      { code: 'Period', label: '.' }, { code: 'Slash', label: '/' }
    ],
    [
      { code: 'Space', label: 'space' }
    ]
  ],
  colemak: [
    [
      { code: 'KeyQ', label: 'q' }, { code: 'KeyW', label: 'w' }, { code: 'KeyF', label: 'f' }, { code: 'KeyP', label: 'p' },
      { code: 'KeyG', label: 'g' }, { code: 'KeyJ', label: 'j' }, { code: 'KeyL', label: 'l' }, { code: 'KeyU', label: 'u' },
      { code: 'KeyY', label: 'y' }, { code: 'Semicolon', label: ';' }, { code: 'BracketLeft', label: '[' }, { code: 'BracketRight', label: ']' }
    ],
    [
      { code: 'KeyA', label: 'a' }, { code: 'KeyR', label: 'r' }, { code: 'KeyS', label: 's' }, { code: 'KeyT', label: 't' },
      { code: 'KeyD', label: 'd' }, { code: 'KeyH', label: 'h' }, { code: 'KeyN', label: 'n' }, { code: 'KeyE', label: 'e' },
      { code: 'KeyI', label: 'i' }, { code: 'KeyO', label: 'o' }, { code: 'Quote', label: '\'' }
    ],
    [
      { code: 'KeyZ', label: 'z' }, { code: 'KeyX', label: 'x' }, { code: 'KeyC', label: 'c' }, { code: 'KeyV', label: 'v' },
      { code: 'KeyB', label: 'b' }, { code: 'KeyK', label: 'k' }, { code: 'KeyM', label: 'm' }, { code: 'Comma', label: ',' },
      { code: 'Period', label: '.' }, { code: 'Slash', label: '/' }
    ],
    [
      { code: 'Space', label: 'space' }
    ]
  ],
  dvorak: [
    [
      { code: 'Quote', label: '\'' }, { code: 'Comma', label: ',' }, { code: 'Period', label: '.' }, { code: 'KeyP', label: 'p' },
      { code: 'KeyY', label: 'y' }, { code: 'KeyF', label: 'f' }, { code: 'KeyG', label: 'g' }, { code: 'KeyC', label: 'c' },
      { code: 'KeyR', label: 'r' }, { code: 'KeyL', label: 'l' }, { code: 'Slash', label: '/' }, { code: 'Equal', label: '=' }
    ],
    [
      { code: 'KeyA', label: 'a' }, { code: 'KeyO', label: 'o' }, { code: 'KeyE', label: 'e' }, { code: 'KeyU', label: 'u' },
      { code: 'KeyI', label: 'i' }, { code: 'KeyD', label: 'd' }, { code: 'KeyH', label: 'h' }, { code: 'KeyT', label: 't' },
      { code: 'KeyN', label: 'n' }, { code: 'KeyS', label: 's' }, { code: 'Minus', label: '-' }
    ],
    [
      { code: 'Semicolon', label: ';' }, { code: 'KeyQ', label: 'q' }, { code: 'KeyJ', label: 'j' }, { code: 'KeyK', label: 'k' },
      { code: 'KeyX', label: 'x' }, { code: 'KeyB', label: 'b' }, { code: 'KeyM', label: 'm' }, { code: 'KeyW', label: 'w' },
      { code: 'KeyV', label: 'v' }, { code: 'KeyZ', label: 'z' }
    ],
    [
      { code: 'Space', label: 'space' }
    ]
  ]
};

export const Keymap: React.FC = () => {
  const { settings } = useAppSettings();
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (settings.keymapStyle !== 'react') {
      setActiveKeys(new Set());
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };

    const handleBlur = () => {
      setActiveKeys(new Set());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [settings.keymapStyle]);

  if (settings.keymapStyle === 'none') return null;

  const currentLayout = layouts[settings.keymapLayout] || layouts.qwerty;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      marginTop: '2.5rem',
      padding: '1rem',
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      maxWidth: '650px',
      width: '100%',
      boxSizing: 'border-box',
      border: '1px solid rgba(255, 255, 255, 0.02)',
      alignItems: 'center'
    }} className="fade-in">
      {currentLayout.map((row, rIdx) => {
        // Compute horizontal offset / stagger margin for rows
        let stagger = '0px';
        if (rIdx === 1) stagger = '10px';
        if (rIdx === 2) stagger = '25px';

        return (
          <div 
            key={rIdx} 
            style={{ 
              display: 'flex', 
              gap: '5px', 
              width: '100%', 
              justifyContent: rIdx === 3 ? 'center' : 'flex-start',
              paddingLeft: rIdx !== 3 ? stagger : '0px'
            }}
          >
            {row.map((key) => {
              const isSpace = key.code === 'Space';
              const isActive = activeKeys.has(key.code);

              return (
                <div
                  key={key.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isSpace ? '180px' : '36px',
                    height: '36px',
                    borderRadius: '4px',
                    background: isActive ? 'var(--main-color)' : 'var(--sub-alt-color)',
                    color: isActive ? 'var(--bg-color)' : 'var(--sub-color)',
                    border: `1px solid ${isActive ? 'var(--main-color)' : 'rgba(255,255,255,0.05)'}`,
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'bold',
                    textTransform: 'lowercase',
                    transition: 'all 0.08s ease',
                    boxShadow: isActive ? '0 0 10px var(--main-color)' : 'none',
                    transform: isActive ? 'scale(0.95)' : 'none',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                >
                  {key.label}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
