// All sound is synthesized with WebAudio: no audio files, nothing fetched.
// A soft pentatonic pluck climbs with the combo, a low thud marks a hit, and
// a quiet detuned pad hums underneath while the game runs.
const PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];

export function createAudio() {
  let ctx = null;
  let pad = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (muted || !ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopPad();
      return muted;
    },
    pluck(combo) {
      const c = ensure();
      if (!c) return;
      const step = PENTA[Math.min(Math.max(combo - 1, 0), PENTA.length - 1)];
      const f = 523.25 * Math.pow(2, step / 12);
      tone(f, 0.35, 'sine', 0.22);
      tone(f * 2, 0.18, 'triangle', 0.07);
    },
    thud() {
      const c = ensure();
      if (!c) return;
      tone(140, 0.3, 'sawtooth', 0.25, 0, 55);
      tone(70, 0.35, 'sine', 0.3, 0, 40);
    },
    pulse() {
      const c = ensure();
      if (!c) return;
      tone(880, 0.25, 'sine', 0.12, 0, 1760);
      tone(1320, 0.2, 'triangle', 0.06, 0.03, 660);
    },
    power() {
      const c = ensure();
      if (!c) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.06));
    },
    fanfare() {
      const c = ensure();
      if (!c) return;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.4, 'triangle', 0.16, i * 0.09));
      tone(261.6, 0.9, 'sine', 0.12, 0);
    },
    win() {
      const c = ensure();
      if (!c) return;
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) =>
        tone(f, 0.5, 'triangle', 0.15, i * 0.13),
      );
    },
    click() {
      const c = ensure();
      if (!c) return;
      tone(660, 0.08, 'square', 0.06);
    },
    startPad() {
      const c = ensure();
      if (!c || pad || muted) return;
      const g = ctx.createGain();
      g.gain.value = 0.035;
      g.connect(ctx.destination);
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sine';
      o2.type = 'sine';
      o1.frequency.value = 110;
      o2.frequency.value = 164.81;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain).connect(g.gain);
      o1.connect(g);
      o2.connect(g);
      o1.start();
      o2.start();
      lfo.start();
      pad = { g, o1, o2, lfo };
    },
    stopPad() {
      if (!pad) return;
      try {
        pad.o1.stop();
        pad.o2.stop();
        pad.lfo.stop();
        pad.g.disconnect();
      } catch {
        // Already stopped.
      }
      pad = null;
    },
  };
}
