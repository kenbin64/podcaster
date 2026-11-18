// director.js
// One job: read a spoken script (each word with its start and end time) and decide what the character does
// at every moment: mouth shapes, blinks, glances, nods, hand gestures, shrugs and expressions.
// It returns a function that gives the TARGET pose at any time; rig.js then eases the character toward it.
//
// What drives what:
//   each word's letters       -> mouth shapes, timed across the word
//   CAPS, numbers, "!", long or sentence-ending words -> a nod, raised brows, and sometimes a hand gesture
//   a sentence ending in "?"  -> a shrug: shoulders up, palms up, head tilted
//   [warm] [firm] [excited] [curious] [serious] notes -> the expression from that word on
//   [to camera]               -> eyes on the lens, no wandering glances for a while
//   [shrug] [point] [open] [explain] notes -> that gesture on the next word
//   between words             -> blinks every few seconds, small eye movements, breathing

import { MOUTHS, wordToVisemes } from './visemes.js';
import { seededRandom } from './random.js';

const EXPRESSIONS = {
  neutral: { smile: 0.3, brow: 0.05, furrow: 0.0, tilt: 0.0 },
  warm:    { smile: 0.55, brow: 0.15, furrow: 0.0, tilt: 0.03 },
  firm:    { smile: 0.05, brow: -0.05, furrow: 0.5, tilt: 0.0 },
  serious: { smile: 0.0, brow: -0.1, furrow: 0.6, tilt: 0.0 },
  excited: { smile: 0.75, brow: 0.45, furrow: 0.0, tilt: 0.0 },
  curious: { smile: 0.2, brow: 0.3, furrow: 0.0, tilt: 0.1 },
};
const GESTURE_NOTES = ['shrug', 'point', 'open', 'explain'];
const EMPHASIS = (w) => /[A-Z]{3,}/.test(w) || /\d/.test(w) || /!$/.test(w) || w.replace(/[^a-z]/gi, '').length >= 8;

export function direct(words, notes = [], seed = 7) {
  const random = seededRandom(seed);
  const end = words.length ? words[words.length - 1].end : 0;
  const mouthKeys = [], blinks = [], glances = [], nods = [], gestures = [], moods = [{ t: -Infinity, mood: 'neutral' }], lensHolds = [];

  // Notes come in at a word index; turn them into times.
  for (const n of notes) {
    const w = words[Math.min(n.at, words.length - 1)];
    if (!w) continue;
    const note = n.note.toLowerCase();
    const mood = Object.keys(EXPRESSIONS).find((m) => note.includes(m));
    if (mood) moods.push({ t: w.start - 150, mood });
    if (/camera|lens|eyes/.test(note)) lensHolds.push({ t: w.start - 100, until: w.start + 2500 });
    const g = GESTURE_NOTES.find((k) => note.includes(k));
    if (g) gestures.push({ t: w.start - 250, until: w.start + 1400, kind: g });
  }

  // Mouth: each word's shapes spread evenly across its spoken time; rest in any real gap.
  words.forEach((w, i) => {
    const shapes = wordToVisemes(w.text), span = Math.max(90, w.end - w.start), slot = span / shapes.length;
    shapes.forEach((s, k) => mouthKeys.push({ t: w.start + k * slot, shape: s }));
    const next = words[i + 1];
    if (!next || next.start - w.end > 130) mouthKeys.push({ t: w.end, shape: 'rest' });
  });

  // Nods, and gestures on emphasis (spaced out so the hands do not flap).
  let lastGesture = -1e9, cycle = 0;
  const kinds = ['open', 'explain', 'point', 'open', 'explain'];
  words.forEach((w, i) => {
    const sentenceEnd = /[.!?]$/.test(w.text);
    if (EMPHASIS(w.text) || sentenceEnd) nods.push({ t: w.start, until: w.start + 260, depth: sentenceEnd ? 0.6 : 1 });
    if (/\?$/.test(w.text)) { gestures.push({ t: w.start - 200, until: w.end + 900, kind: 'shrug' }); lastGesture = w.start; }
    else if (EMPHASIS(w.text) && w.start - lastGesture > 2200 && random() < 0.8) {
      gestures.push({ t: w.start - 250, until: w.start + 1000 + random() * 500, kind: kinds[cycle++ % kinds.length] });
      lastGesture = w.start;
    }
    if (sentenceEnd) blinks.push(w.end + 80);
  });

  // Blinks and small glances through the whole performance, with a little thinking look at some sentence starts.
  for (let t = 400 + random() * 1500; t < end + 2000; t += 2200 + random() * 2800) blinks.push(t);
  for (let t = 900; t < end + 2000; t += 1400 + random() * 2400) glances.push({ t, until: t + 250 + random() * 400, gx: (random() - 0.5) * 0.5, gy: (random() - 0.5) * 0.3 });
  words.forEach((w, i) => { if (i > 0 && /[.!?]$/.test(words[i - 1].text) && random() < 0.35) glances.push({ t: w.start - 350, until: w.start + 250, gx: -0.55, gy: -0.35 }); });

  mouthKeys.sort((a, b) => a.t - b.t); gestures.sort((a, b) => a.t - b.t); moods.sort((a, b) => a.t - b.t);
  const speakingAt = (t) => words.some((w) => t >= w.start && t <= w.end);
  const latest = (list, t) => { let found = null; for (const x of list) { if (x.t <= t) found = x; else break; } return found; };
  const within = (list, t) => list.find((x) => t >= x.t && t <= x.until) || null;

  // The target pose at time t (milliseconds).
  return function targetsAt(t) {
    const mouth = MOUTHS[(latest(mouthKeys, t) || { shape: 'rest' }).shape];
    const mood = EXPRESSIONS[(latest(moods, t) || moods[0]).mood];
    const gesture = within(gestures, t);
    const nod = within(nods, t);
    const holdingLens = within(lensHolds, t);
    const glance = holdingLens ? null : within(glances, t);
    const blinking = blinks.some((b) => t >= b && t <= b + 150);
    const shrug = gesture && gesture.kind === 'shrug';
    return {
      open: mouth.open, wide: mouth.wide, round: mouth.round,
      smile: mood.smile + (shrug ? -0.15 : 0),
      blink: blinking ? 1 : 0,
      gazeX: glance ? glance.gx : 0, gazeY: glance ? glance.gy : 0,
      brow: mood.brow + (nod ? 0.25 * nod.depth : 0) + (shrug ? 0.55 : 0), furrow: mood.furrow,
      headTilt: mood.tilt + (shrug ? 0.12 : 0) + Math.sin(t / 2300) * 0.035,
      headTurn: Math.sin(t / 3100) * 0.18 + (gesture && gesture.kind === 'point' ? 0.15 : 0),
      headNod: nod ? 10 * nod.depth : 0,
      talking: speakingAt(t) ? 1 : 0,
      shoulders: shrug ? 28 : 0,
      gesture: gesture ? gesture.kind : 'rest',
    };
  };
}
