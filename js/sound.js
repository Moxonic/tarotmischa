/* Soft synthesized sounds (no audio files). Silent until enabled. */
(function (g) {
  'use strict';

  let ctx = null, master = null, wet = null, noiseBuf = null;
  let enabled = false;

  function init() {
    if (ctx) return true;
    const AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    // A gentle feedback echo gives the chimes some air.
    wet = ctx.createGain();
    wet.gain.value = 0.35;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.19;
    const fb = ctx.createGain();
    fb.gain.value = 0.3;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    wet.connect(delay);
    delay.connect(lp);
    lp.connect(fb);
    fb.connect(delay);
    lp.connect(ctx.destination);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  function ready() {
    if (!enabled || !init()) return false;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function noise(t, dur, type, f0, f1, q, gain) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.08, dur * 0.3));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  function bell(t, freq, gain, dur = 1.8) {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    env.connect(master);
    env.connect(wet);
    [[1, 1], [2.76, 0.25], [5.4, 0.08]].forEach(([mult, amp]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      const a = ctx.createGain();
      a.gain.value = amp;
      osc.connect(a);
      a.connect(env);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  const api = {
    get enabled() { return enabled; },
    setEnabled(v) {
      enabled = !!v;
      if (enabled && ready()) bell(ctx.currentTime + 0.02, 1318.5, 0.03, 1.2);
    },
    flip() {
      if (!ready()) return;
      const t = ctx.currentTime;
      noise(t, 0.55, 'bandpass', 320, 2400, 0.9, 0.16);
      [1318.5, 1975.5, 2637].forEach((f, i) => bell(t + 0.4 + i * 0.075, f, 0.045 - i * 0.012));
    },
    pass() {
      if (!ready()) return;
      noise(ctx.currentTime, 0.32, 'bandpass', 1700, 420, 0.8, 0.09);
    },
    split() {
      if (!ready()) return;
      noise(ctx.currentTime, 0.25, 'bandpass', 600, 1400, 0.7, 0.06);
    },
    riffle(count, gapMs) {
      if (!ready()) return;
      const t = ctx.currentTime;
      for (let i = 0; i < count; i++) {
        const at = t + (i * gapMs) / 1000 + Math.random() * 0.012;
        noise(at, 0.035, 'highpass', 2600, 3200, 0.7, 0.12);
        noise(at, 0.05, 'lowpass', 500, 300, 0.5, 0.05);
      }
    },
  };

  g.TAROT_SFX = api;
})(window);
