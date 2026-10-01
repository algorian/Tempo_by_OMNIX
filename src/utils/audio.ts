/**
 * TEMPO Web Audio Synthesizer
 * Native Web Audio API chime for session and break completions.
 * Pure synthesized multi-harmonic sine chime with smooth exponential decay.
 * Zero external audio files or dependencies.
 */

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }

  return audioCtx;
}

/**
 * Unlocks the Web Audio Context during a user gesture.
 * Crucial for modern browser autoplay policies.
 */
export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // Ignore audio unlock error
  }
}

// Global user interaction listener to proactively unlock AudioContext on first click/key/touch
if (typeof window !== 'undefined') {
  const handleUserInteraction = () => {
    unlockAudio();
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
    }
  };

  window.addEventListener('click', handleUserInteraction, { passive: true });
  window.addEventListener('keydown', handleUserInteraction, { passive: true });
  window.addEventListener('touchstart', handleUserInteraction, { passive: true });
  window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
}

/**
 * Plays a calm, minimalist multi-harmonic completion chime.
 * Major triad: D5 (587.33 Hz), A5 (880.00 Hz), and D6 (1174.66 Hz).
 * Soft attack, balanced audible volume, exponential decay (~1.6s).
 */
export async function playCompletionChime(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master gain: Comfortable audible volume (~0.32)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.32, now);

    // 1. Fundamental tone (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    // 2. Harmonic fifth (880.00 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now);

    // 3. Octave harmonic (1174.66 Hz - D6)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1174.66, now);

    // Envelopes:
    // Fundamental tone: 15ms attack, smooth 1.5s exponential decay
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.7, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    // Fifth: subtle warm body
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    // Octave: gentle initial chime sparkle
    gain3.gain.setValueAtTime(0.0001, now);
    gain3.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    // Connections
    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc3.connect(gain3);
    gain3.connect(masterGain);

    masterGain.connect(ctx.destination);

    // Start & Stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 1.6);
    osc2.stop(now + 1.6);
    osc3.stop(now + 1.6);
  } catch {
    // Gracefully handle any browser audio constraints
  }
}

/**
 * Plays a quick, gentle test/preview chime (~0.6s) to verify audio feedback.
 */
export async function playPreviewChime(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, now);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880.00, now); // A5

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(gain);
    gain.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch {
    // Gracefully handle constraints
  }
}
