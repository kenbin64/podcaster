// voice.js
// One job: read a RECORDED voice (any person, any microphone) and turn it into what the director needs, with
// no script and no transcript:
//   frames - every 10 ms, how open the mouth is, how wide, and how round, taken from the sound itself
//   words  - the spoken stretches between pauses ("beats"), so nods, blinks, gestures and sentence ends still happen
//
// How the sound becomes a mouth:
//   loudness                -> how open the jaw is (silence closes it, so "m", "b" and "p" close it too)
//   energy in the low band  -> "oh" and "oo" sounds, which round the lips
//   energy in the high band -> "ee" and "s" sounds, which stretch the lips wide and keep the jaw nearly closed
// This is an approximation from the sound alone. It follows the real voice exactly in time, which is what the
// eye checks first; it does not know which word is being said.

const HOP_MS = 10;

export function analyseVoice(buffer) {
  const data = buffer.getChannelData(0), rate = buffer.sampleRate, hop = Math.round(rate * HOP_MS / 1000);
  const a = Math.exp(-2 * Math.PI * 900 / rate);      // a simple filter splits the sound at about 900 Hz
  let low = 0;
  const loud = [], ratio = [], crossings = [];
  for (let i = 0; i + hop <= data.length; i += hop) {
    let all = 0, lowE = 0, highE = 0, z = 0;
    for (let j = i; j < i + hop; j++) {
      const x = data[j]; low = (1 - a) * x + a * low;
      const high = x - low;
      all += x * x; lowE += low * low; highE += high * high;
      if (j > i && (x >= 0) !== (data[j - 1] >= 0)) z++;
    }
    loud.push(Math.sqrt(all / hop)); ratio.push(highE / (lowE + highE + 1e-12)); crossings.push(z / hop);
  }

  // Scale loudness to this recording: its quiet floor maps to 0 and its loud speech to 1.
  const sorted = [...loud].sort((x, y) => x - y);
  const floor = sorted[Math.floor(sorted.length * 0.1)] * 1.5 + 1e-4, top = sorted[Math.floor(sorted.length * 0.95)] || 1;
  const level = loud.map((v) => Math.min(1, Math.max(0, (v - floor) / (top - floor))));

  const frames = level.map((lv, i) => {
    const t = i * HOP_MS, r = ratio[i];
    if (lv < 0.08) return { t, open: 0, wide: 0.5, round: 0 };
    const hiss = crossings[i] > 0.25 && r > 0.6;           // "s", "sh", "f": teeth nearly together, lips wide
    const open = hiss ? 0.15 : Math.pow(lv, 0.7) * 0.85;
    return { t, open, wide: hiss ? 0.85 : 0.3 + 0.6 * r, round: hiss ? 0 : Math.min(1, Math.max(0, (0.35 - r) * 2.5)) * lv };
  });

  return { frames, words: beatsFrom(level), durationMs: level.length * HOP_MS };
}

// The spoken stretches: runs of voiced frames, joined across short dips (between syllables) and split at pauses.
function beatsFrom(level) {
  const voiced = level.map((v) => v > 0.12), beats = [];
  let start = -1, lastOn = -1;
  for (let i = 0; i <= voiced.length; i++) {
    if (i < voiced.length && voiced[i]) { if (start < 0) start = i; lastOn = i; continue; }
    if (start >= 0 && (i === voiced.length || i - lastOn > 6)) {          // a dip longer than 60 ms ends the beat
      if (lastOn - start >= 6) beats.push({ start: start * HOP_MS, end: (lastOn + 1) * HOP_MS, peak: Math.max(...level.slice(start, lastOn + 1)) });
      start = -1;
    }
  }
  const peaks = beats.map((b) => b.peak).sort((x, y) => x - y), strong = peaks[Math.floor(peaks.length * 0.85)] ?? 1;
  return beats.map((b, i) => ({
    text: '', start: b.start, end: b.end, fromAudio: true,
    emphasis: b.peak >= strong && b.end - b.start > 150,
    sentenceEnd: !beats[i + 1] || beats[i + 1].start - b.end > 450,
    question: false,
  }));
}
