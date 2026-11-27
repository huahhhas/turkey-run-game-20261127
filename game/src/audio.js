// Gobble Dash — tiny synthesised sounds. Everything is generated with the
// Web Audio API at play time; no sound files are shipped, so the game stays
// fully offline. All calls are safe before any user gesture: the context is
// created lazily and failures are swallowed.

let context = null;
let muted = false;

function audio() {
  if (muted) return null;
  try {
    if (!context) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(freq, dur, type, vol, slideTo) {
  const ctx = audio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {
    /* sound is decoration; a failure must never break the game */
  }
}

export const sfx = {
  jump() { tone(280, 0.16, 'sine', 0.12, 620); },
  corn() { tone(660, 0.09, 'triangle', 0.12); setTimeout(() => tone(990, 0.12, 'triangle', 0.1), 70); },
  feather() { tone(520, 0.1, 'sine', 0.1, 1040); },
  stumble() { tone(180, 0.25, 'sawtooth', 0.14, 70); },
  hide() { tone(420, 0.12, 'sine', 0.08, 300); },
  caught() { tone(220, 0.5, 'sawtooth', 0.16, 55); },
  escaped() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 110));
  },
  click() { tone(440, 0.06, 'square', 0.06); },
  toggleMute() { muted = !muted; return muted; },
  isMuted() { return muted; },
};
