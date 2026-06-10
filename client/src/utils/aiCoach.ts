import type { AdvancedStats } from './analytics';

export interface CoachInsight {
  type: 'endurance' | 'accuracy' | 'technique' | 'praise';
  title: string;
  message: string;
  actionableDrill?: string;
}

export const generateAICoachTip = (
  advancedStats: AdvancedStats | null,
  stats: { correct: number; incorrect: number; extra: number; missed: number },
  wpm: number,
  accuracy: number,
  timeElapsed: number
): CoachInsight => {
  if (!advancedStats) {
    return {
      type: 'praise',
      title: 'Keep it up!',
      message: `You hit ${wpm} WPM with ${accuracy}% accuracy. Keep practicing to build muscle memory!`
    };
  }

  const { weakKeys, backspaceCount, endurance } = advancedStats;
  const totalKeystrokes = stats.correct + stats.incorrect + stats.extra + stats.missed;

  // 1. Analyze Endurance (Fatigue)
  if (timeElapsed >= 30 && endurance && endurance.dropOffPercentage > 15 && endurance.lastQuarterWpm < endurance.firstQuarterWpm) {
    return {
      type: 'endurance',
      title: 'Finger Fatigue Detected',
      message: `Your speed dropped by ${endurance.dropOffPercentage}% in the final stretch (from ${endurance.firstQuarterWpm} to ${endurance.lastQuarterWpm} WPM). You're starting out hot but losing stamina.`,
      actionableDrill: 'Try a 60-second test but consciously type 10% slower than your max speed. Focus entirely on maintaining a steady rhythm without pausing.'
    };
  }

  // 2. Analyze Backspace Reliance / Accuracy vs Speed
  // High backspace use compared to total keystrokes (e.g., > 8%)
  const backspaceRatio = totalKeystrokes > 0 ? (backspaceCount / totalKeystrokes) : 0;
  if (backspaceRatio > 0.08 || accuracy < 90) {
    return {
      type: 'accuracy',
      title: 'Over-relying on Backspace',
      message: `You hit backspace ${backspaceCount} times. You're typing faster than your current accuracy threshold allows, causing a \"burst and correct\" pattern that actually lowers your net WPM.`,
      actionableDrill: 'Enable \"Stop on Error\" mode in Settings. This forces you to type with 100% confidence instead of relying on the safety net of the backspace key.'
    };
  }

  // 3. Analyze Weak Keys (Technique)
  const weakKeyEntries = Object.entries(weakKeys).sort((a, b) => b[1] - a[1]);
  if (weakKeyEntries.length > 0) {
    // Group weak keys by hand/finger roughly
    const leftPinky = ['q', 'a', 'z', '1', '2'];
    const rightPinky = ['p', ';', '/', '-', '=', '[', ']', '\\', '0'];
    const leftRing = ['w', 's', 'x', '3'];
    const rightRing = ['o', 'l', '.', '9'];

    const topMistake = weakKeyEntries[0];
    const key = topMistake[0].toLowerCase();
    
    let fingerAdvice = '';
    if (leftPinky.includes(key)) fingerAdvice = 'This is a left pinky stretch. Make sure you aren\'t twisting your wrist to reach it.';
    else if (rightPinky.includes(key)) fingerAdvice = 'This is a right pinky stretch. It\'s the weakest finger, so focus on keeping your hand anchored on the home row.';
    else if (leftRing.includes(key) || rightRing.includes(key)) fingerAdvice = 'Ring fingers are notoriously dependent on the middle finger. Practice isolating this movement.';

    return {
      type: 'technique',
      title: `Struggling with '${topMistake[0]}'`,
      message: `You missed the '${topMistake[0]}' key ${topMistake[1]} times. ${fingerAdvice}`,
      actionableDrill: `Create a custom text test containing words heavy in '${topMistake[0]}' and practice it slowly until the muscle memory locks in.`
    };
  }

  // 4. Praise for good performance
  if (accuracy >= 98 && wpm > 40) {
    return {
      type: 'praise',
      title: 'Incredible Precision',
      message: `A blazing ${wpm} WPM with ${accuracy}% accuracy! Your rhythm is highly consistent and your error rate is negligible.`,
      actionableDrill: 'You\'ve mastered your current speed. Time to push your boundaries—try intentionally typing 10-15 WPM faster on short 15s bursts to build new neural pathways.'
    };
  }

  // Fallback
  return {
    type: 'praise',
    title: 'Solid Session',
    message: `You're holding a steady pace at ${wpm} WPM. Consistency is the key to breaking through plateaus.`,
    actionableDrill: 'Try mixing up your practice with different text lengths (15s for raw speed bursts, 60s for endurance).'
  };
};
