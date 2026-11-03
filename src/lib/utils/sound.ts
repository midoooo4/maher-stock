/**
 * Sound notification utility using Web Audio API
 * Plays a pleasant 2-tone chime without external file dependencies.
 */

let lastPlayedTime = 0;

export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  
  // Throttle to avoid repeated screeching if multiple events fire at once
  const nowMs = Date.now();
  if (nowMs - lastPlayedTime < 1000) return;
  lastPlayedTime = nowMs;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First note: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second note: B5 (987.77 Hz), starts slightly later for a crystal-clear chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);

    // Close audio context after playback completes
    setTimeout(() => {
      try {
        ctx.close();
      } catch (_) {}
    }, 1000);
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}
