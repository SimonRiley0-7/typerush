import React, { useState } from 'react';
import { useAppSettings, themes } from '../contexts/SettingsContext';

type Tab = 'appearance' | 'typing';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  category: 'appearance' | 'typing';
  control: React.ReactNode;
}

export function Settings() {
  const { settings, updateSetting } = useAppSettings();
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [searchQuery, setSearchQuery] = useState('');

  // Sleek Reusable Control components
  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button 
      onClick={onChange}
      style={{
        width: '50px', height: '26px', borderRadius: '13px', 
        background: value ? 'var(--main-color)' : 'var(--bg-color)',
        position: 'relative', transition: 'background 0.2s', cursor: 'pointer', padding: 0, border: 'none',
        flexShrink: 0
      }}
    >
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', background: value ? 'var(--bg-color)' : 'var(--sub-color)',
        position: 'absolute', top: '3px', left: value ? '27px' : '3px', transition: 'all 0.2s'
      }} />
    </button>
  );

  const Selector = <T extends string>({ options, active, onChange }: { options: readonly T[] | T[]; active: T; onChange: (val: T) => void }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'flex-end' }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: '0.4rem 0.8rem',
            background: active === opt ? 'var(--main-color)' : 'var(--bg-color)',
            color: active === opt ? 'var(--bg-color)' : 'var(--text-color)',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            textTransform: 'capitalize',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.1s'
          }}
        >
          {opt.replace(/-/g, ' ')}
        </button>
      ))}
    </div>
  );

  // Settings Items Schema Definition
  const settingItems: SettingItem[] = [
    // BEHAVIOR / TYPING
    {
      id: 'quickRestart',
      title: 'Quick Restart',
      description: 'Press Tab to instantly restart the typing test.',
      category: 'typing',
      control: <Toggle value={settings.quickRestart} onChange={() => updateSetting('quickRestart', !settings.quickRestart)} />
    },
    {
      id: 'blindMode',
      title: 'Blind Mode',
      description: 'Errors are hidden during typing. Typing stats and WPM calculations are shown at the end.',
      category: 'typing',
      control: <Toggle value={settings.blindMode} onChange={() => updateSetting('blindMode', !settings.blindMode)} />
    },
    {
      id: 'confidenceMode',
      title: 'Confidence Mode',
      description: 'Backspace is disabled entirely. Forces you to keep moving forward without editing.',
      category: 'typing',
      control: <Toggle value={settings.confidenceMode} onChange={() => updateSetting('confidenceMode', !settings.confidenceMode)} />
    },
    {
      id: 'lazyMode',
      title: 'Lazy Mode',
      description: 'Ignores accents, replacing them with normal characters (e.g., Café -> Cafe).',
      category: 'typing',
      control: <Toggle value={settings.lazyMode} onChange={() => updateSetting('lazyMode', !settings.lazyMode)} />
    },
    {
      id: 'strictSpace',
      title: 'Strict Space',
      description: 'Prevents pressing space unless the current word is correct.',
      category: 'typing',
      control: <Toggle value={settings.strictSpace} onChange={() => updateSetting('strictSpace', !settings.strictSpace)} />
    },
    {
      id: 'stopOnError',
      title: 'Stop on Error',
      description: 'Stop cursor flow: letter (cannot type past a typo) or word (cannot press space on a typo).',
      category: 'typing',
      control: <Selector options={['off', 'letter', 'word'] as const} active={settings.stopOnError} onChange={(val) => updateSetting('stopOnError', val)} />
    },
    {
      id: 'hideExtraLetters',
      title: 'Hide Extra Letters',
      description: 'Hides extra letters typed beyond the word length, rather than rendering them.',
      category: 'typing',
      control: <Toggle value={settings.hideExtraLetters} onChange={() => updateSetting('hideExtraLetters', !settings.hideExtraLetters)} />
    },
    {
      id: 'oppositeShift',
      title: 'Opposite Shift',
      description: 'Requires using the opposite shift key for capitalized letters (e.g., ShiftRight for Q, ShiftLeft for P).',
      category: 'typing',
      control: <Toggle value={settings.oppositeShift} onChange={() => updateSetting('oppositeShift', !settings.oppositeShift)} />
    },
    {
      id: 'capsLockWarning',
      title: 'Caps Lock Warning',
      description: 'Displays a warning banner when caps lock is active.',
      category: 'typing',
      control: <Toggle value={settings.capsLockWarning} onChange={() => updateSetting('capsLockWarning', !settings.capsLockWarning)} />
    },
    {
      id: 'outOfFocusWarning',
      title: 'Out of Focus Blur Warning',
      description: 'Displays a blur overlay and pauses the test when the browser window loses focus.',
      category: 'typing',
      control: <Toggle value={settings.outOfFocusWarning} onChange={() => updateSetting('outOfFocusWarning', !settings.outOfFocusWarning)} />
    },
    {
      id: 'liveWpm',
      title: 'Live WPM',
      description: 'Displays typing speed (WPM) in real-time during the test.',
      category: 'typing',
      control: <Toggle value={settings.liveWpm} onChange={() => updateSetting('liveWpm', !settings.liveWpm)} />
    },
    {
      id: 'liveAccuracy',
      title: 'Live Accuracy',
      description: 'Displays accuracy percentage in real-time during the test.',
      category: 'typing',
      control: <Toggle value={settings.liveAccuracy} onChange={() => updateSetting('liveAccuracy', !settings.liveAccuracy)} />
    },
    {
      id: 'showRestartButton',
      title: 'Show Restart Button',
      description: 'Shows a dedicated restart button below the typing test.',
      category: 'typing',
      control: <Toggle value={settings.showRestartButton} onChange={() => updateSetting('showRestartButton', !settings.showRestartButton)} />
    },
    {
      id: 'difficulty',
      title: 'Difficulty / Strictness',
      description: 'Normal: standard. Expert: fails test on space of incorrect word. Master: fails test on any typo.',
      category: 'typing',
      control: <Selector options={['normal', 'expert', 'master'] as const} active={settings.difficulty} onChange={(val) => updateSetting('difficulty', val)} />
    },
    {
      id: 'clickSound',
      title: 'Keyclick Sound',
      description: 'Play a synthesizer click sound as you type characters.',
      category: 'typing',
      control: <Selector options={['off', 'mechanical', 'clicky', 'beep'] as const} active={settings.clickSound} onChange={(val) => updateSetting('clickSound', val)} />
    },
    {
      id: 'soundVolume',
      title: 'Keyclick Sound Volume',
      description: 'Adjust the volume level of keyclick sound effects.',
      category: 'typing',
      control: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '220px' }}>
          <span style={{ color: 'var(--main-color)', fontWeight: 'bold', minWidth: '40px', fontSize: '0.85rem' }}>{Math.round(settings.soundVolume * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.soundVolume}
            onChange={(e) => updateSetting('soundVolume', parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--main-color)', cursor: 'pointer' }}
          />
        </div>
      )
    },
    {
      id: 'paceCaret',
      title: 'Pace Caret (Ghost Target)',
      description: 'Displays a secondary, semi-transparent ghost caret moving at a target speed.',
      category: 'typing',
      control: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '220px', alignItems: 'flex-end' }}>
          <Selector options={['off', 'custom'] as const} active={settings.paceCaret} onChange={(val) => updateSetting('paceCaret', val)} />
          {settings.paceCaret === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%' }}>
              <span style={{ color: 'var(--main-color)', fontWeight: 'bold', fontSize: '0.8rem', minWidth: '60px' }}>{settings.paceCaretWpm} WPM</span>
              <input
                type="range"
                min="20"
                max="220"
                step="5"
                value={settings.paceCaretWpm}
                onChange={(e) => updateSetting('paceCaretWpm', parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: 'var(--main-color)', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>
      )
    },

    // APPEARANCE
    {
      id: 'caretStyle',
      title: 'Caret Style',
      description: 'Choose the visual cursor representation.',
      category: 'appearance',
      control: <Selector options={['line', 'block', 'outline', 'underline', 'none'] as const} active={settings.caretStyle} onChange={(val) => updateSetting('caretStyle', val)} />
    },
    {
      id: 'caretAnimation',
      title: 'Caret Animation',
      description: 'Adjust the cursor blinking effect.',
      category: 'appearance',
      control: <Selector options={['blink', 'smooth', 'off'] as const} active={settings.caretAnimation} onChange={(val) => updateSetting('caretAnimation', val)} />
    },
    {
      id: 'smoothCaret',
      title: 'Smooth Caret Transition',
      description: 'Smoothly slide the cursor character-by-character rather than instant jumps.',
      category: 'appearance',
      control: <Toggle value={settings.smoothCaret} onChange={() => updateSetting('smoothCaret', !settings.smoothCaret)} />
    },
    {
      id: 'timerPosition',
      title: 'Timer / Stat Position',
      description: 'Place the timer status display above or below the typing text box.',
      category: 'appearance',
      control: <Selector options={['above', 'below'] as const} active={settings.timerPosition} onChange={(val) => updateSetting('timerPosition', val)} />
    },
    {
      id: 'timerSize',
      title: 'Timer Size',
      description: 'Change the font scale of the timer and live stat text.',
      category: 'appearance',
      control: <Selector options={['small', 'normal', 'large'] as const} active={settings.timerSize} onChange={(val) => updateSetting('timerSize', val)} />
    },
    {
      id: 'colorfulMode',
      title: 'Colorful Errors',
      description: 'Renders typos with a solid colored block background for high visibility.',
      category: 'appearance',
      control: <Toggle value={settings.colorfulMode} onChange={() => updateSetting('colorfulMode', !settings.colorfulMode)} />
    },
    {
      id: 'fontFamily',
      title: 'Font Family',
      description: 'Change the monospaced or sans-serif font family used in the typing test.',
      category: 'appearance',
      control: (
        <select
          value={settings.fontFamily}
          onChange={(e) => updateSetting('fontFamily', e.target.value)}
          style={{
            padding: '0.4rem 0.8rem', background: 'var(--bg-color)', color: 'var(--text-color)',
            border: '1px solid var(--sub-color)', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {['JetBrains Mono', 'Lexend Deca', 'Fira Code', 'Roboto Mono', 'Courier New'].map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      )
    },
    {
      id: 'fontSize',
      title: 'Font Size',
      description: 'Scale the text size inside the typing container.',
      category: 'appearance',
      control: <Selector options={['1.5rem', '2rem', '2.5rem', '3rem'] as const} active={settings.fontSize} onChange={(val) => updateSetting('fontSize', val)} />
    },
    {
      id: 'fontWeight',
      title: 'Font Weight',
      description: 'Thickness of the typing text.',
      category: 'appearance',
      control: <Selector options={['light', 'normal', 'medium', 'bold'] as const} active={settings.fontWeight} onChange={(val) => updateSetting('fontWeight', val)} />
    },
    {
      id: 'lineHeight',
      title: 'Line Height',
      description: 'Vertical spacing between lines of typing text.',
      category: 'appearance',
      control: <Selector options={['1', '1.25', '1.5', '2'] as const} active={settings.lineHeight} onChange={(val) => updateSetting('lineHeight', val)} />
    },
    {
      id: 'wordSpacing',
      title: 'Word Spacing',
      description: 'Horizontal spacing between typing words.',
      category: 'appearance',
      control: <Selector options={['normal', 'wide', 'extra-wide'] as const} active={settings.wordSpacing} onChange={(val) => updateSetting('wordSpacing', val)} />
    },
    {
      id: 'pageWidth',
      title: 'Page Layout Max-Width',
      description: 'Set maximum horizontal width constraint for the typing area.',
      category: 'appearance',
      control: <Selector options={['small', 'medium', 'large', 'full'] as const} active={settings.pageWidth} onChange={(val) => updateSetting('pageWidth', val)} />
    },
    {
      id: 'showKeymap',
      title: 'Display Visual Keyboard',
      description: 'Show a visual representation of the keyboard below the typing test.',
      category: 'appearance',
      control: <Toggle value={settings.showKeymap} onChange={() => updateSetting('showKeymap', !settings.showKeymap)} />
    },
    {
      id: 'keymapLayout',
      title: 'Visual Keyboard Layout',
      description: 'Select layout to display in visual keyboard (QWERTY, Colemak, Dvorak).',
      category: 'appearance',
      control: <Selector options={['qwerty', 'colemak', 'dvorak'] as const} active={settings.keymapLayout} onChange={(val) => updateSetting('keymapLayout', val)} />
    },
    {
      id: 'keymapStyle',
      title: 'Visual Keyboard Feedback Style',
      description: 'Static: display layout. React: highlight keys dynamically in real-time as you press them. None: hides keyboard.',
      category: 'appearance',
      control: <Selector options={['none', 'static', 'react'] as const} active={settings.keymapStyle} onChange={(val) => updateSetting('keymapStyle', val)} />
    }
  ];

  // Client-side search filtration
  const isSearching = searchQuery.trim().length > 0;
  const query = searchQuery.toLowerCase();

  const filteredItems = settingItems.filter(
    (item) => item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
  );

  const renderConfigRow = (item: SettingItem) => (
    <div 
      key={item.id} 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.2rem 1.5rem', 
        background: 'var(--sub-alt-color)', 
        borderRadius: '8px',
        gap: '2rem'
      }}
      className="fade-in"
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ color: 'var(--text-color)', margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 'normal' }}>
          {item.title}
        </h3>
        <p style={{ color: 'var(--sub-color)', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
          {item.description}
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: '150px' }}>
        {item.control}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (isSearching) {
      return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ color: 'var(--main-color)', fontSize: '1.2rem', fontWeight: 'normal', margin: 0 }}>
            Search Results for "{searchQuery}"
          </h2>

          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--sub-color)', padding: '2rem' }}>
              No settings matched your search query.
            </div>
          )}

          {filteredItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredItems.map(renderConfigRow)}
            </div>
          )}
        </div>
      );
    }

    switch (activeTab) {
      case 'appearance':
        return (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-color)', fontWeight: 'normal', fontSize: '1.5rem' }}>Appearance</h2>
            
            {/* Custom Theme Picker Grid */}
            <div style={{ background: 'var(--sub-alt-color)', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ color: 'var(--sub-color)', margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 'normal' }}>Theme Preset</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem' }}>
                {Object.keys(themes).map((tName) => {
                  const themeColors = themes[tName];
                  const isActive = settings.theme === tName;
                  return (
                    <button
                      key={tName}
                      onClick={() => updateSetting('theme', tName)}
                      style={{
                        background: isActive ? 'var(--bg-color)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? 'var(--main-color)' : 'var(--sub-alt-color)'}`,
                        borderRadius: '6px',
                        padding: '0.6rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        width: '100%'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: isActive ? 'var(--main-color)' : 'var(--text-color)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                        {tName.replace(/-/g, ' ')}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: themeColors['--bg-color'], border: '1px solid rgba(255,255,255,0.1)' }} />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: themeColors['--main-color'] }} />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: themeColors['--text-color'] }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Config rows */}
            {settingItems.filter(i => i.category === 'appearance').map(renderConfigRow)}
          </div>
        );

      case 'typing':
        return (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontWeight: 'normal', fontSize: '1.5rem' }}>Behavior & Typing</h2>
            {settingItems.filter(i => i.category === 'typing').map(renderConfigRow)}
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2.5rem', maxWidth: '1150px', margin: '0 auto', width: '100%', paddingBottom: '4rem' }}>
      
      {/* Sidebar Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
        <h1 style={{ color: 'var(--text-color)', margin: '0 0 1.5rem 0', fontSize: '1.6rem', fontWeight: 'normal' }}>Settings</h1>
        
        <button 
          onClick={() => { setActiveTab('appearance'); setSearchQuery(''); }}
          style={{ 
            textAlign: 'left', padding: '0.75rem 1rem', background: activeTab === 'appearance' && !isSearching ? 'var(--sub-alt-color)' : 'transparent',
            color: activeTab === 'appearance' && !isSearching ? 'var(--text-color)' : 'var(--sub-color)', border: 'none', borderRadius: '6px', 
            cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}
        >
          <i className="fas fa-palette" style={{ width: '18px' }}></i> Appearance
        </button>

        <button 
          onClick={() => { setActiveTab('typing'); setSearchQuery(''); }}
          style={{ 
            textAlign: 'left', padding: '0.75rem 1rem', background: activeTab === 'typing' && !isSearching ? 'var(--sub-alt-color)' : 'transparent',
            color: activeTab === 'typing' && !isSearching ? 'var(--text-color)' : 'var(--sub-color)', border: 'none', borderRadius: '6px', 
            cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.8rem'
          }}
        >
          <i className="fas fa-keyboard" style={{ width: '18px' }}></i> Typing
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
        
        {/* Real-time search filter input */}
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--sub-color)' }} />
          <input
            type="text"
            placeholder="Type to search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem 0.8rem 2.8rem',
              background: 'var(--sub-alt-color)',
              border: '1px solid rgba(255,255,255,0.02)',
              borderRadius: '8px',
              color: 'var(--text-color)',
              fontSize: '0.95rem',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--main-color)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.02)'}
          />
        </div>

        <div style={{ flex: 1 }}>
          {renderTabContent()}
        </div>
      </div>

    </div>
  );
}
