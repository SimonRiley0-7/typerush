import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
  theme: string;
  caretStyle: 'line' | 'block' | 'outline' | 'underline' | 'none';
  caretAnimation: 'blink' | 'smooth' | 'off';
  fontFamily: string;
  fontSize: string;
  quickRestart: boolean;
  blindMode: boolean;
  smoothCaret: boolean;
  clickSound: 'off' | 'mechanical' | 'clicky' | 'beep';
  difficulty: 'normal' | 'expert' | 'master';
  paceCaret: 'off' | 'custom';
  paceCaretWpm: number;
  confidenceMode: boolean;
  capsLockWarning: boolean;
  outOfFocusWarning: boolean;
  liveWpm: boolean;
  liveAccuracy: boolean;
  showRestartButton: boolean;
  soundVolume: number;
  timerPosition: 'above' | 'below';
  timerSize: 'small' | 'normal' | 'large';
  colorfulMode: boolean;
  lazyMode: boolean;
  strictSpace: boolean;
  stopOnError: 'off' | 'letter' | 'word';
  hideExtraLetters: boolean;
  oppositeShift: boolean;
  showKeymap: boolean;
  keymapLayout: 'qwerty' | 'colemak' | 'dvorak';
  keymapStyle: 'none' | 'static' | 'react';
  lineHeight: '1' | '1.25' | '1.5' | '2';
  wordSpacing: 'normal' | 'wide' | 'extra-wide';
  pageWidth: 'small' | 'medium' | 'large' | 'full';
  fontWeight: 'light' | 'normal' | 'medium' | 'bold';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'type-rush-dark',
  caretStyle: 'line',
  caretAnimation: 'blink',
  fontFamily: 'JetBrains Mono',
  fontSize: '2rem',
  quickRestart: true,
  blindMode: false,
  smoothCaret: true,
  clickSound: 'off',
  difficulty: 'normal',
  paceCaret: 'off',
  paceCaretWpm: 60,
  confidenceMode: false,
  capsLockWarning: true,
  outOfFocusWarning: true,
  liveWpm: false,
  liveAccuracy: false,
  showRestartButton: true,
  soundVolume: 0.5,
  timerPosition: 'above',
  timerSize: 'normal',
  colorfulMode: false,
  lazyMode: false,
  strictSpace: false,
  stopOnError: 'off',
  hideExtraLetters: false,
  oppositeShift: false,
  showKeymap: false,
  keymapLayout: 'qwerty',
  keymapStyle: 'static',
  lineHeight: '1.25',
  wordSpacing: 'normal',
  pageWidth: 'medium',
  fontWeight: 'normal',
};

export const themes: Record<string, Record<string, string>> = {
  'type-rush-dark': {
    '--bg-color': '#323437',
    '--main-color': '#e2b714',
    '--caret-color': '#e2b714',
    '--sub-color': '#646669',
    '--sub-alt-color': '#2c2e31',
    '--text-color': '#d1d0c5',
    '--error-color': '#ca4754',
    '--error-extra-color': '#7e2a33',
  },
  'serika-dark': {
    '--bg-color': '#151515',
    '--main-color': '#e2b714',
    '--caret-color': '#e2b714',
    '--sub-color': '#666666',
    '--sub-alt-color': '#1c1c1c',
    '--text-color': '#e1e1e1',
    '--error-color': '#ca4754',
    '--error-extra-color': '#7e2a33',
  },
  'carbon': {
    '--bg-color': '#2b2b2b',
    '--main-color': '#f57500',
    '--caret-color': '#f57500',
    '--sub-color': '#616161',
    '--sub-alt-color': '#212121',
    '--text-color': '#e6e6e6',
    '--error-color': '#da3333',
    '--error-extra-color': '#7a1a1a',
  },
  'nord': {
    '--bg-color': '#2e3440',
    '--main-color': '#88c0d0',
    '--caret-color': '#88c0d0',
    '--sub-color': '#4c566a',
    '--sub-alt-color': '#3b4252',
    '--text-color': '#d8dee9',
    '--error-color': '#bf616a',
    '--error-extra-color': '#4c566a',
  },
  'sakura': {
    '--bg-color': '#f5e6e8',
    '--main-color': '#e86f88',
    '--caret-color': '#e86f88',
    '--sub-color': '#b8a1a4',
    '--sub-alt-color': '#ebd2d5',
    '--text-color': '#5c3d42',
    '--error-color': '#de3b5a',
    '--error-extra-color': '#a82c44',
  },
  'matrix': {
    '--bg-color': '#000000',
    '--main-color': '#15ff00',
    '--caret-color': '#15ff00',
    '--sub-color': '#003b00',
    '--sub-alt-color': '#001100',
    '--text-color': '#00dd00',
    '--error-color': '#ff0000',
    '--error-extra-color': '#550000',
  },
  'laser': {
    '--bg-color': '#090514',
    '--main-color': '#00e5ff',
    '--caret-color': '#00e5ff',
    '--sub-color': '#4d328c',
    '--sub-alt-color': '#190e34',
    '--text-color': '#f0eff5',
    '--error-color': '#ff0055',
    '--error-extra-color': '#990033',
  }
};

const caretStyles: Record<string, Record<string, string>> = {
  line: {
    '--caret-width': '2px',
    '--caret-height': '2.2rem',
    '--caret-bg': 'var(--caret-color)',
    '--caret-border': 'none',
    '--caret-top': '3px',
  },
  block: {
    '--caret-width': '0.65em',
    '--caret-height': '1.3em',
    '--caret-bg': 'var(--caret-color)',
    '--caret-border': 'none',
    '--caret-top': '6px',
  },
  outline: {
    '--caret-width': '0.65em',
    '--caret-height': '1.3em',
    '--caret-bg': 'transparent',
    '--caret-border': '2px solid var(--caret-color)',
    '--caret-top': '6px',
  },
  underline: {
    '--caret-width': '0.65em',
    '--caret-height': '4px',
    '--caret-bg': 'var(--caret-color)',
    '--caret-border': 'none',
    '--caret-top': '2rem',
  },
  none: {
    '--caret-width': '0px',
    '--caret-height': '0px',
    '--caret-bg': 'transparent',
    '--caret-border': 'none',
    '--caret-top': '0px',
  }
};

const caretAnimations: Record<string, Record<string, string>> = {
  blink: {
    '--caret-animation': 'blink 1s infinite'
  },
  smooth: {
    '--caret-animation': 'smooth-blink 1s infinite'
  },
  off: {
    '--caret-animation': 'none'
  }
};

const fontFamilies: Record<string, string> = {
  'Lexend Deca': "'Lexend Deca', 'Roboto', 'Segoe UI', sans-serif",
  'JetBrains Mono': "'JetBrains Mono', 'Fira Code', monospace",
  'Fira Code': "'Fira Code', 'JetBrains Mono', monospace",
  'Roboto Mono': "'Roboto Mono', monospace",
  'Courier New': "'Courier New', Courier, monospace"
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('typerush_app_settings');
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('typerush_app_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('typerush_app_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  // Apply CSS variables to root based on current settings
  useEffect(() => {
    const root = document.documentElement;

    // 1. Theme Colors
    const themeColors = themes[settings.theme] || themes['type-rush-dark'];
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // 2. Caret Styles
    const caretVars = caretStyles[settings.caretStyle] || caretStyles['line'];
    Object.entries(caretVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // 3. Caret Animations
    const animVars = caretAnimations[settings.caretAnimation] || caretAnimations['blink'];
    Object.entries(animVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // 4. Font Family
    const fontVal = fontFamilies[settings.fontFamily] || fontFamilies['JetBrains Mono'];
    root.style.setProperty('--font-mono', fontVal);

    // 5. Font Size
    root.style.setProperty('--typing-font-size', settings.fontSize);

    // 6. Smooth Caret Transition
    root.style.setProperty('--caret-transition', settings.smoothCaret ? 'transform 0.12s ease-out' : 'none');

    // 7. Line Height
    root.style.setProperty('--typing-line-height', settings.lineHeight);

    // 8. Word Spacing
    const spacingMap = { normal: '0.5rem', wide: '1rem', 'extra-wide': '1.8rem' };
    root.style.setProperty('--typing-word-spacing', spacingMap[settings.wordSpacing] || '0.5rem');

    // 9. Font Weight
    const weightMap = { light: '300', normal: '400', medium: '500', bold: '700' };
    root.style.setProperty('--typing-font-weight', weightMap[settings.fontWeight] || '400');

    // 10. Page Width
    const widthMap = { small: '800px', medium: '1000px', large: '1250px', full: '100%' };
    root.style.setProperty('--typing-page-width', widthMap[settings.pageWidth] || '1000px');

  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within a SettingsProvider');
  }
  return context;
};
