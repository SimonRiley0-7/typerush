import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateAdvancedStats } from '../utils/analytics';
import { AICoachTip } from './AICoachTip';
import type { KeystrokeTiming } from '../utils/analytics';

interface ResultsProps {
  stats: { correct: number; incorrect: number; extra: number; missed: number };
  timeElapsed: number;
  mode: string;
  weakKeys: Record<string, number>;
  backspaceCount: number;
  keystrokes: KeystrokeTiming[];
  onRestart: () => void;
}

export const Results: React.FC<ResultsProps> = ({ stats, timeElapsed, mode, weakKeys, backspaceCount, keystrokes, onRestart }) => {
  const { user } = useAuth();
  const savedRef = useRef(false);

  // Calculations
  const totalKeystrokes = stats.correct + stats.incorrect + stats.extra;
  const timeInMinutes = timeElapsed / 60;
  
  // Gross WPM (All typed characters / 5) / time
  const grossWPM = timeInMinutes > 0 ? Math.round((totalKeystrokes / 5) / timeInMinutes) : 0;
  
  // Net WPM (Correct words / time) - roughly (correct chars / 5)
  const netWPM = timeInMinutes > 0 ? Math.round((stats.correct / 5) / timeInMinutes) : 0;
  
  // Accuracy
  const accuracy = totalKeystrokes > 0 
    ? Math.round((stats.correct / (totalKeystrokes + stats.missed)) * 100) 
    : 0;

  useEffect(() => {
    const saveResult = async () => {
      if (!user || savedRef.current) return;
      savedRef.current = true; // Prevent double save on strict mode
      
      try {
        const advanced_stats = calculateAdvancedStats(weakKeys, backspaceCount, keystrokes, timeElapsed);
        
        await supabase.from('tests').insert({
          user_id: user.id,
          wpm: netWPM,
          raw_wpm: grossWPM,
          accuracy: accuracy,
          mode: mode,
          chars_correct: stats.correct,
          chars_incorrect: stats.incorrect,
          chars_extra: stats.extra,
          chars_missed: stats.missed,
          time_elapsed: timeElapsed,
          advanced_stats: advanced_stats
        });
      } catch (err) {
        console.error('Failed to save test result', err);
      }
    };
    
    saveResult();
  }, [user, netWPM, grossWPM, accuracy, mode, stats, timeElapsed, weakKeys, backspaceCount, keystrokes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px', marginBottom: '2rem' }}>
        
        {/* WPM Display */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'var(--sub-color)', fontSize: '2rem' }}>wpm</div>
          <div style={{ color: 'var(--main-color)', fontSize: '4rem', fontWeight: 'bold', lineHeight: '1' }}>{netWPM}</div>
          <div style={{ color: 'var(--sub-color)', fontSize: '1.2rem', marginTop: '1rem' }}>acc</div>
          <div style={{ color: 'var(--main-color)', fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{accuracy}%</div>
        </div>

        {/* Detailed Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem', color: 'var(--text-color)' }}>
          <div>
            <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>test type</div>
            <div>{mode}</div>
          </div>
          <div>
            <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>raw</div>
            <div style={{ fontSize: '1.5rem' }}>{grossWPM}</div>
          </div>
          <div>
            <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>characters</div>
            <div>
              <span style={{ color: 'var(--text-color)' }}>{stats.correct}</span>/
              <span style={{ color: 'var(--error-color)' }}>{stats.incorrect}</span>/
              <span style={{ color: 'var(--error-extra-color)' }}>{stats.extra}</span>/
              <span style={{ color: 'var(--sub-color)' }}>{stats.missed}</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem' }}>time</div>
            <div>{Math.round(timeElapsed)}s</div>
          </div>
        </div>
      </div>

      {/* AI Coach Tip */}
      <AICoachTip 
        advancedStats={calculateAdvancedStats(weakKeys, backspaceCount, keystrokes, timeElapsed)}
        stats={stats}
        wpm={netWPM}
        accuracy={accuracy}
        timeElapsed={timeElapsed}
      />

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
        <button 
          onClick={onRestart}
          style={{
            padding: '0.8rem 2rem',
            fontSize: '1.2rem',
            background: 'var(--main-color)',
            color: 'var(--bg-color)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          className="hover-bright"
        >
          <i className="fas fa-redo"></i> Next Test
        </button>
      </div>
    </div>
  );
};
