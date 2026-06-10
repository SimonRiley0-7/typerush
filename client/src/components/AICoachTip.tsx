import React, { useState, useEffect } from 'react';
import type { CoachInsight } from '../utils/aiCoach';

interface AICoachTipProps {
  insight: CoachInsight;
}

export const AICoachTip: React.FC<AICoachTipProps> = ({ insight }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slight delay to make it feel like it's "analyzing"
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [insight]);

  if (!isVisible) {
    return (
      <div style={{
        marginTop: '2rem',
        width: '100%',
        maxWidth: '800px',
        padding: '1.5rem',
        borderRadius: '12px',
        background: 'var(--sub-alt-color)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px'
      }}>
        <div style={{ color: 'var(--sub-color)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <i className="fas fa-robot fa-spin" style={{ color: 'var(--main-color)' }}></i>
          <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>AI Coach is analyzing your performance...</span>
        </div>
      </div>
    );
  }

  const getIcon = () => {
    switch (insight.type) {
      case 'endurance': return 'fas fa-battery-half';
      case 'accuracy': return 'fas fa-bullseye';
      case 'technique': return 'fas fa-keyboard';
      case 'praise': return 'fas fa-star';
      default: return 'fas fa-robot';
    }
  };

  const getColor = () => {
    switch (insight.type) {
      case 'endurance': return '#ffaa00'; // Orange
      case 'accuracy': return '#ff4444'; // Red
      case 'technique': return '#00ccff'; // Cyan
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
      {/* Decorative top border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '3px',
        width: '100%',
        background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)`
      }}></div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
        <div style={{ 
          fontSize: '2rem', 
          color: iconColor,
          background: `${iconColor}15`,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <i className={getIcon()}></i>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.1rem' }}>{insight.title}</h3>
            <span style={{ 
              fontSize: '0.7rem', 
              background: `${iconColor}20`, 
              color: iconColor, 
              padding: '0.2rem 0.5rem', 
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>AI Analysis</span>
          </div>
          
          <p style={{ margin: '0 0 1rem 0', color: 'var(--sub-color)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            {insight.message}
          </p>

          {insight.actionableDrill && (
            <div style={{ 
              background: 'var(--sub-alt-color)', 
              padding: '1rem', 
              borderRadius: '8px',
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
