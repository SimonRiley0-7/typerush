export interface KeystrokeTiming {
  char: string;
  timestamp: number;
}

export interface AdvancedStats {
  weakKeys: Record<string, number>;
  backspaceCount: number;
  endurance: {
    firstQuarterWpm: number;
    lastQuarterWpm: number;
    dropOffPercentage: number;
  };
}

export const calculateAdvancedStats = (
  weakKeys: Record<string, number>,
  backspaceCount: number,
  keystrokes: KeystrokeTiming[],
  timeElapsedSeconds: number
): AdvancedStats => {
  const totalTimeMs = timeElapsedSeconds * 1000;
  
  // Calculate endurance drop-off if we have enough time (at least 10s)
  let firstQuarterWpm = 0;
  let lastQuarterWpm = 0;
  let dropOffPercentage = 0;

  if (totalTimeMs >= 10000 && keystrokes.length > 0) {
    const q1EndMs = totalTimeMs * 0.25;
    const q4StartMs = totalTimeMs * 0.75;
    
    let q1Chars = 0;
    let q4Chars = 0;

    for (const key of keystrokes) {
      if (key.timestamp <= q1EndMs) {
        q1Chars++;
      } else if (key.timestamp >= q4StartMs) {
        q4Chars++;
      }
    }

    // WPM = (Chars / 5) / TimeInMinutes
    // Each quarter is 25% of the total time
    const quarterTimeMinutes = (timeElapsedSeconds * 0.25) / 60;
    
    firstQuarterWpm = quarterTimeMinutes > 0 ? Math.round((q1Chars / 5) / quarterTimeMinutes) : 0;
    lastQuarterWpm = quarterTimeMinutes > 0 ? Math.round((q4Chars / 5) / quarterTimeMinutes) : 0;
    
    if (firstQuarterWpm > 0) {
      dropOffPercentage = Math.round(((firstQuarterWpm - lastQuarterWpm) / firstQuarterWpm) * 100);
    }
  }

  // Filter out keys that were rarely missed or not letters
  const significantWeakKeys: Record<string, number> = {};
  for (const [key, count] of Object.entries(weakKeys)) {
    if (count > 1 && key.length === 1 && /[a-zA-Z0-9.,;'\"-]/.test(key)) {
      significantWeakKeys[key] = count;
    }
  }

  return {
    weakKeys: significantWeakKeys,
    backspaceCount,
    endurance: {
      firstQuarterWpm,
      lastQuarterWpm,
      dropOffPercentage
    }
  };
};
