import React, { useState, useEffect } from 'react';
import type { CoachInsight } from '../utils/aiCoach';
import { generateRuleBasedCoachTip, initLLM, generateLLMCoachTip } from '../utils/aiCoach';
import type { AdvancedStats } from '../utils/analytics';
import type { InitProgressReport } from '@mlc-ai/web-llm';

interface AICoachTipProps {
  advancedStats: AdvancedStats | null;
  stats: any;
  wpm: number;
  accuracy: number;
  timeElapsed: number;
}

export const AICoachTip: React.FC<AICoachTipProps> = ({ advancedStats, stats, wpm, accuracy, timeElapsed }) => {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [progress, setProgress] = useState<InitProgressReport | null>(null);

  useEffect(() => {
    // Show rule-based tip by default after a short delay
    const timer = setTimeout(() => {
      const defaultInsight = generateRuleBasedCoachTip(advancedStats, stats, wpm, accuracy, timeElapsed);
      setInsight(defaultInsight);
    }, 600);
    return () => clearTimeout(timer);
  }, [advancedStats, stats, wpm, accuracy, timeElapsed]);

  const loadLlamaAndGenerate = async () => {
    setIsLlmLoading(true);
    try {
      await initLLM((report) => setProgress(report));
      
      // Clear the current insight and replace with streaming AI
      setInsight({ type: 'ai', title: 'Llama 3.2 Analysis', message: '' });
      
      await generateLLMCoachTip(advancedStats, stats, wpm, accuracy, timeElapsed, (text) => {
        setInsight({ type: 'ai', title: 'Llama 3.2 Analysis', message: text });
      });
    } catch (err) {
      console.error('Failed to run Llama model', err);
      alert('Failed to load Llama 3.2. Check console for details.');
    } finally {
      setIsLlmLoading(false);
    }
  };

  if (!insight && !isLlmLoading) {
    return (
      <div style={{
        marginTop: '2rem', width: '100%', maxWidth: '800px', padding: '1.5rem',
        borderRadius: '12px', background: 'var(--sub-alt-color)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px'
      }}>
        <div style={{ color: 'var(--sub-color)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <i className="fas fa-robot fa-spin" style={{ color: 'var(--main-color)' }}></i>
          <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>AI Coach is analyzing your performance...</span>
        </div>
      </div>
    );
  }

  // If loading LLM, show progress bar
  if (isLlmLoading && progress) {
    const isDownloading = progress.text.includes('Fetching');
    return (
      <div style={{
        marginTop: '2rem', width: '100%', maxWidth: '800px', padding: '2rem',
        borderRadius: '12px', background: 'var(--sub-alt-color)',
        border: '1px solid var(--main-color)',
        display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--main-color)' }}>
          <i className="fas fa-microchip fa-spin" style={{ fontSize: '1.5rem' }}></i>
          <h3 style={{ margin: 0 }}>Initializing Llama 3.2 1B</h3>
        </div>
        <p style={{ margin: 0, color: 'var(--sub-color)', fontSize: '0.9rem' }}>
          {isDownloading ? 'Downloading model into browser cache (~800MB). This only happens once.' : progress.text}
        </p>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            background: 'var(--main-color)', 
            width: `${progress.progress * 100}%`,
            transition: 'width 0.3s'
          }}></div>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  const getIcon = () => {
    switch (insight.type) {
      case 'endurance': return 'fas fa-battery-half';
      case 'accuracy': return 'fas fa-bullseye';
      case 'technique': return 'fas fa-keyboard';
      case 'praise': return 'fas fa-star';
      case 'ai': return 'fas fa-brain';
      default: return 'fas fa-robot';
    }
  };

  const getColor = () => {
    switch (insight.type) {
      case 'endurance': return '#ffaa00'; // Orange
      case 'accuracy': return '#ff4444'; // Red
      case 'technique': return '#00ccff'; // Cyan
      case 'ai': return '#bb86fc'; // Purple for LLM
      case 'praise': return 'var(--main-color)'; // Theme color
      default: return 'var(--main-color)';
    }
  };

  const iconColor = getColor();

  return (
    <div className="fade-in" style={{
      marginTop: '2rem',
      width: '100%',
      maxWidth: '800px',
      padding: '1.5rem 2rem',
      borderRadius: '12px',
      background: 'rgba(0, 0, 0, 0.2)',
      border: `1px solid ${iconColor}40`,
      boxShadow: `0 0 20px ${iconColor}10`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, height: '3px', width: '100%',
        background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)`
      }}></div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
        <div style={{ 
          fontSize: '2rem', color: iconColor, background: `${iconColor}15`,
          width: '50px', height: '50px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <i className={getIcon()}></i>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.1rem' }}>{insight.title}</h3>
              <span style={{ 
                fontSize: '0.7rem', background: `${iconColor}20`, color: iconColor, 
                padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', letterSpacing: '1px'
              }}>{insight.type === 'ai' ? 'Llama 3.2 1B (WebGPU)' : 'Rule-based Coach'}</span>
            </div>

            {insight.type !== 'ai' && (
              <button 
                onClick={loadLlamaAndGenerate}
                style={{
                  background: 'transparent',
                  border: '1px solid #bb86fc50',
                  color: '#bb86fc',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#bb86fc15'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <i className="fas fa-brain"></i> Ask Llama 3.2
              </button>
            )}
          </div>
          
          <p style={{ margin: '0 0 1rem 0', color: 'var(--sub-color)', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
            {insight.message}
            {insight.type === 'ai' && !insight.message && <span style={{ opacity: 0.5 }}>Thinking...</span>}
          </p>

          {insight.actionableDrill && (
            <div style={{ 
              background: 'var(--sub-alt-color)', padding: '1rem', borderRadius: '8px',
              borderLeft: `3px solid ${iconColor}`
            }}>
              <strong style={{ display: 'block', color: 'var(--text-color)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                <i className="fas fa-dumbbell" style={{ marginRight: '0.5rem', color: iconColor }}></i>
                Recommended Drill
              </strong>
              <span style={{ color: 'var(--sub-color)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {insight.actionableDrill}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
