let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playClickSound = (type: 'off' | 'mechanical' | 'clicky' | 'beep', volume: number = 0.5) => {
  if (type === 'off') return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'mechanical') {
      // Deep brown/red switch tactile keypress simulation
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);

      gain.gain.setValueAtTime(0.18 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.005 * volume, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'clicky') {
      // Sharp mechanical blue switch click sound
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(950, now);
      osc1.frequency.exponentialRampToValueAtTime(150, now + 0.03);

      gain1.gain.setValueAtTime(0.06 * volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.005 * volume, now + 0.03);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.03);
    } else if (type === 'beep') {
      // Clean electronic beep sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);

      gain.gain.setValueAtTime(0.04 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.005 * volume, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (error) {
    console.warn('AudioContext failed to initialize or play click sound:', error);
  }
};
