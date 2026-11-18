// director.js
// One job: read a spoken script (each word with its start and end time) and decide what the character does
// at every moment: mouth shapes, blinks, glances, nods, hand gestures, shrugs and expressions.
// It returns a function that gives the TARGET pose at any time; rig.js then eases the character toward it.
//
// What drives what:
//   each word's letters       -> mouth shapes, timed across the word
//   a recorded voice          -> mouth frames taken from the sound itself (voice.js), in place of the letters
//   CAPS, numbers, "!", long or sentence-ending words -> a nod, raised brows, and sometimes a hand gesture
//   a sentence ending in "?"  -> a shrug: shoulders up, palms up, head tilted
//   [warm] [firm] [excited] [curious] [serious] notes -> the expression from that word on
//   [to camera]               -> eyes on the lens, no wandering glances for a while
//   [shrug] [point] [open] [explain] notes -> that gesture on the next word
//   someone else talking      -> eyes and head turn toward them, an occasional nod, a slight smile
//   between words             -> blinks every few seconds, small eye movements, breathing
//
// Words recorded from audio carry their own flags (emphasis, sentenceEnd, question), since they have no letters.

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
const isEmphasis = (w) => w.emphasis ?? EMPHASIS(w.text);
const isSentenceEnd = (w) => w.sentenceEnd ?? /[.!?]$/.test(w.text);
const isQuestion = (w) => w.question ?? /\?$/.test(w.text);

// The last item in a time-sorted list that has started by time t (binary search; lists can be thousands long).
function latest(list, t) {
  let lo = 0, hi = list.length - 1, found = null;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (list[mid].t <= t) { found = list[mid]; lo = mid + 1; } else hi = mid - 1; }
  return found;
}
const within = (list, t) => list.find((x) => t >= x.t && t <= x.until) || null;

// words: [{text, start, end}] in ms.  notes: [{at: word index, note}].
// extra.mouthFrames: [{t, open, wide, round}] from recorded voices.  extra.listen: [{start, end, dir}], dir -1 = left, 1 = right.
export function direct(words, notes = [], seed = 7, extra = {}) {
  const { mouthFrames = [], listen = [] } = extra;
  const random = seededRandom(seed);
  const end = Math.max(words.length ? words[words.length - 1].end : 0, ...listen.map((l) => l.end), 0);
  const mouthKeys = [], blinks = [], glances = [], nods = [], gestures = [], moods = [{ t: -Infinity, mood: 'neutral' }], lensHolds = [];
  const listening = listen.map((l) => ({ t: l.start, until: l.end, dir: l.dir }));

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

  // Mouth from text: each word's shapes spread evenly across its spoken time; rest in any real gap.
  words.forEach((w, i) => {
    if (w.fromAudio) return;
    const shapes = wordToVisemes(w.text), span = Math.max(90, w.end - w.start), slot = span / shapes.length;
    shapes.forEach((s, k) => mouthKeys.push({ t: w.start + k * slot, shape: s }));
    const next = words[i + 1];
    if (!next || next.start - w.end > 130) mouthKeys.push({ t: w.end, shape: 'rest' });
  });
  // Mouth from recorded voices: the frames as they are.
  for (const f of mouthFrames) mouthKeys.push({ t: f.t, m: f });

  // Nods, and gestures on emphasis (spaced out so the hands do not flap).
  let lastGesture = -1e9, cycle = 0;
  const kinds = ['open', 'explain', 'point', 'open', 'explain'];
  words.forEach((w) => {
    const sentenceEnd = isSentenceEnd(w);
    if (isEmphasis(w) || sentenceEnd) nods.push({ t: w.start, until: w.start + 260, depth: sentenceEnd ? 0.6 : 1 });
    if (isQuestion(w)) { gestures.push({ t: w.start - 200, until: w.end + 900, kind: 'shrug' }); lastGesture = w.start; }
    else if (isEmphasis(w) && w.start - lastGesture > 2200 && random() < 0.8) {
      gestures.push({ t: w.start - 250, until: w.start + 1000 + random() * 500, kind: kinds[cycle++ % kinds.length] });
      lastGesture = w.start;
    }
    if (sentenceEnd) blinks.push(w.end + 80);
  });

  // While listening: a soft nod every few seconds.
  for (const l of listening) for (let t = l.t + 700 + random() * 600; t < l.until - 200; t += 2600 + random() * 2000) nods.push({ t, until: t + 320, depth: 0.5 });

  // Blinks and small glances through the whole performance, with a little thinking look at some sentence starts.
  for (let t = 400 + random() * 1500; t < end + 2000; t += 2200 + random() * 2800) blinks.push(t);
  for (let t = 900; t < end + 2000; t += 1400 + random() * 2400) glances.push({ t, until: t + 250 + random() * 400, gx: (random() - 0.5) * 0.5, gy: (random() - 0.5) * 0.3 });
  words.forEach((w, i) => { if (i > 0 && isSentenceEnd(words[i - 1]) && random() < 0.35) glances.push({ t: w.start - 350, until: w.start + 250, gx: -0.55, gy: -0.35 }); });

  mouthKeys.sort((a, b) => a.t - b.t); gestures.sort((a, b) => a.t - b.t); moods.sort((a, b) => a.t - b.t);
  const speakingAt = (t) => words.some((w) => t >= w.start && t <= w.end);

  // The target pose at time t (milliseconds).
  return function targetsAt(t) {
    const key = latest(mouthKeys, t);
    const mouth = key ? (key.m || MOUTHS[key.shape]) : MOUTHS.rest;
    const mood = EXPRESSIONS[(latest(moods, t) || moods[0]).mood];
    const gesture = within(gestures, t);
    const nod = within(nods, t);
    const talking = speakingAt(t);
    const ear = talking ? null : within(listening, t);
    const holdingLens = within(lensHolds, t);
    const glance = holdingLens || ear ? null : within(glances, t);
    const blinking = blinks.some((b) => t >= b && t <= b + 150);
    const shrug = gesture && gesture.kind === 'shrug';
    return {
      open: mouth.open, wide: mouth.wide, round: mouth.round,
      smile: mood.smile + (shrug ? -0.15 : 0) + (ear ? 0.12 : 0),
      blink: blinking ? 1 : 0,
      gazeX: ear ? ear.dir * 0.95 : glance ? glance.gx : 0, gazeY: glance ? glance.gy : 0,
      brow: mood.brow + (nod ? 0.25 * nod.depth : 0) + (shrug ? 0.55 : 0), furrow: mood.furrow,
      headTilt: mood.tilt + (shrug ? 0.12 : 0) + Math.sin(t / 2300) * 0.035,
      headTurn: Math.sin(t / 3100) * (ear ? 0.06 : 0.18) + (ear ? ear.dir * 0.6 : 0) + (gesture && gesture.kind === 'point' ? 0.15 : 0),
      headNod: nod ? 10 * nod.depth : 0,
      talking: talking ? 1 : 0,
      shoulders: shrug ? 28 : 0,
      gesture: gesture ? gesture.kind : 'rest',
    };
  };
}
