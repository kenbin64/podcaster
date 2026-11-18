'use strict';
// Manifold music: a generative intro/bed synthesized live from the manifold z = x*y.
// There are NO audio files. The saddle field's own coordinates choose the notes, so every
// cold-open is the manifold's sound, captured straight into the recording.
//
// How the math becomes music (honest, not mystical):
//   - We walk a smooth path (x(t), y(t)) across the saddle and read z = x*y at each step.
//   - z is quantized to a major-pentatonic scale, so it is pleasant rather than random.
//   - z = x*y  drives the melody; the quadratic reading z = x*y^2 drives a slower bass pulse.
//   - A sustained drone (root + fifth + octave) fills it out. One master gain does hold + fade.
// It connects to both your speakers (so you hear it) and the recording destination (so it is
// captured), exactly where the old file-based jingle used to go.

(function (global) {
  const SCALE = [0, 2, 4, 7, 9];                         // major pentatonic (semitones)
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);  // MIDI note -> Hz

  // value in [-1,1] -> a pentatonic note around `root`, spanning `octaves`
  function quantize(value, root, octaves) {
    const span = SCALE.length * octaves;
    let i = Math.round(((value + 1) / 2) * (span - 1));
    i = Math.max(0, Math.min(span - 1, i));
    return root + Math.floor(i / SCALE.length) * 12 + SCALE[i % SCALE.length];
  }

  class ManifoldMusic {
    // destinations: a node or array of nodes to feed (e.g. [recordingDest, ctx.destination])
    constructor(ctx, destinations, opts = {}) {
      this.ctx = ctx;
      this.opts = Object.assign({ root: 45, rate: 2.2, bright: 0.5, vol: 0.8 }, opts); // root A2=45, rate=notes/sec
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      (Array.isArray(destinations) ? destinations : [destinations]).forEach((d) => d && this.master.connect(d));
      this.t = 0;
      this.step = 0;
      this._timer = null;
      this._drone();
    }

    _drone() {
      const r = midi(this.opts.root);
      const g = this.ctx.createGain(); g.gain.value = this.opts.butterfly ? 0.10 : 0.18; g.connect(this.master);
      const voices = this.opts.butterfly
        ? [[1, 'sine', 0.35], [2, 'sine', 0.22], [3, 'triangle', 0.10]]   // airier and higher for a butterfly shimmer
        : [[1, 'sine', 0.5], [1.5, 'sine', 0.3], [2, 'triangle', 0.12]];
      for (const [mult, type, lvl] of voices) {
        const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = r * mult;
        const og = this.ctx.createGain(); og.gain.value = lvl;
        o.connect(og); og.connect(g); o.start();
        (this._drones || (this._drones = [])).push(o);
      }
    }

    _pluck(freq, dur, level, type, delay) {
      const now = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(level, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(this.master);
      o.start(now); o.stop(now + dur + 0.05);
    }

    _tick() {
      this.t += 0.13;
      const x = Math.sin(this.t * 0.70), y = Math.cos(this.t * 0.41);
      const z = x * y;        // manifold -> melody
      const zq = x * y * y;   // quadratic reading -> bass
      const b = this.opts.bright;
      // Butterfly mode: light, airy, fluttering. A soft high lead plus quick wingbeat grace notes,
      // with only a gentle low cushion (no driving drum), so it flutters rather than thumps.
      if (this.opts.butterfly) {
        const lead = midi(quantize(z, this.opts.root + 12, 2));
        this._pluck(lead, 0.45, 0.10, 'triangle');                      // gentle lead note
        this._pluck(lead * 2, 0.10, 0.045, 'sine', 0.05);              // wingbeat shimmer (octave up)
        this._pluck(lead * 1.5, 0.08, 0.035, 'sine', 0.11);           // second, lighter flutter
        if (this.step % 4 === 0) this._pluck(midi(quantize(zq, this.opts.root, 1)), 1.1, 0.10, 'sine');  // soft cushion
        // manifold-driven drums: a soft kick on the beat and a light tick off it, all synthesized (no files)
        if (this.step % 2 === 0) this._pluck(midi(this.opts.root - 24), 0.16, 0.34, 'sine');
        else this._pluck(midi(this.opts.root + 24), 0.05, 0.05, 'square');
        this.step++; return;
      }
      this._pluck(midi(quantize(z, this.opts.root + 12, 2)), 0.9, 0.14 + b * 0.10, b > 0.5 ? 'sawtooth' : 'triangle');
      if (this.step % 2 === 0) this._pluck(midi(quantize(zq, this.opts.root - 12, 1)), 1.4, 0.22, 'sine');
      // Intro mode: a driving low pulse on every step + an octave-up sparkle, for a catchy techy feel.
      if (this.opts.intro) {
        this._pluck(midi(this.opts.root - 12), 0.12, 0.42, 'sine');
        if (this.step % 4 === 0) this._pluck(midi(quantize(z, this.opts.root + 24, 2)), 0.5, 0.10, 'square');
      }
      this.step++;
    }

    start() {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const t0 = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t0);
      this.master.gain.setValueAtTime(0, t0);
      this.master.gain.linearRampToValueAtTime(this.opts.vol, t0 + 0.4);
      if (this.opts.signature) this._signature();    // the fixed brand hook, same every episode
      this._tick();
      this._timer = setInterval(() => this._tick(), 1000 / this.opts.rate);
    }
    // A short, fixed, recognizable theme over the generative bed, identical every time, so the channel
    // has one consistent opening signature for branding.
    _signature() {
      // The sung jingle melody, in a comfortable range, so it doubles as your pitch guide.
      // Scale degrees do-re-mi-sol / sol-mi-re-do over the root: "But-ter-fly-Fx / set the truth free".
      const r = this.opts.root, motif = [0, 2, 4, 7, 7, 4, 2, 0], dt = 0.42;
      motif.forEach((n, k) => {
        this._pluck(midi(r + n), 0.55, 0.17, 'triangle', k * dt);     // the lead you sing to
        this._pluck(midi(r + n + 12), 0.10, 0.045, 'sine', k * dt + 0.02);  // light octave shimmer
      });
    }

    holdThenFade(holdSec, fadeSec) {
      const t0 = this.ctx.currentTime, v = this.opts.vol;
      this.master.gain.cancelScheduledValues(t0);
      this.master.gain.setValueAtTime(v, t0 + Math.max(0.01, holdSec));
      this.master.gain.linearRampToValueAtTime(0.0001, t0 + holdSec + fadeSec);
      setTimeout(() => this.stop(), (holdSec + fadeSec + 0.4) * 1000);
    }

    fadeNow(fadeSec) {
      const t0 = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t0);
      this.master.gain.setValueAtTime(this.master.gain.value, t0);
      this.master.gain.linearRampToValueAtTime(0.0001, t0 + fadeSec);
      setTimeout(() => this.stop(), (fadeSec + 0.4) * 1000);
    }

    stop() {
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
      try { (this._drones || []).forEach((o) => o.stop()); } catch (_) {}
    }
  }

  global.ManifoldMusic = ManifoldMusic;
})(window);
