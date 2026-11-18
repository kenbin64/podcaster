// timeline.js
// One job: turn a voiced cast (the studio's voices/cast.json, or the panel demo's panel.json) into a timeline.
// The lines play one after another; each person gets their own words (shifted to the episode clock), mouth
// frames for recorded lines, notes, and the stretches where they listen to someone else and which way that is.
// Captions come from {text ...} cues. Used by the 2D panel and the 3D stage alike.
import { analyseVoice } from './voice.js';
import { direct } from './director.js';

// panel: { cast, lines }.  loadAudio(path) -> AudioBuffer.  xOf(person, index) -> seat position (for listening direction).
export async function buildTimeline(panel, loadAudio, xOf, { gapMs = 350, leadMs = 400, tailMs = 600 } = {}) {
  const people = panel.cast.map((c, i) => ({ ...c, index: i, x: xOf(c, i), words: [], notes: [], mouthFrames: [], listen: [] }));
  const byName = Object.fromEntries(people.map((p) => [p.name, p]));
  const clips = [], captions = [], lines = [];
  let t = leadMs;
  for (const line of panel.lines) {
    const who = byName[line.who];
    if (!who) throw new Error(line.who + ' speaks but is not in the cast');
    const buffer = await loadAudio(line.audio), start = t, end = start + buffer.duration * 1000;
    let words = line.words;
    if (!words) {                                 // a recording: the sound gives the mouth and the beats
      const heard = analyseVoice(buffer);
      words = heard.words;
      for (const f of heard.frames) who.mouthFrames.push({ ...f, t: f.t + start });
      who.mouthFrames.push({ t: start + heard.durationMs, open: 0, wide: 0.5, round: 0 });
    }
    for (const note of line.notes || []) who.notes.push({ at: who.words.length + note.at, note: note.note });
    for (const w of words) who.words.push({ ...w, start: w.start + start, end: w.end + start });
    for (const c of line.cues || []) {
      const m = c.cue.match(/^\{\s*text\b[^|]*\|(.*)\}$/i);
      if (m) { const w = words[c.at]; captions.push({ t: (w ? w.start : 0) + start, text: m[1].trim() }); }
    }
    for (const other of people) if (other !== who) other.listen.push({ start, end, dir: Math.sign(who.x - other.x) });
    clips.push({ buffer, start }); lines.push({ who: line.who, start, end });
    t = end + gapMs;
  }
  people.forEach((p, i) => { p.targetsAt = direct(p.words, p.notes, 7 + i * 13, { mouthFrames: p.mouthFrames, listen: p.listen }); });
  captions.sort((a, b) => a.t - b.t);
  return { people, clips, captions, lines, totalMs: t + tailMs };
}

// The caption showing at time ms, with its age, or null.
export function captionAt(captions, ms, showMs = 5500) {
  let c = null; for (const x of captions) { if (x.t <= ms) c = x; else break; }
  return c && ms - c.t <= showMs ? { text: c.text, age: ms - c.t, showMs } : null;
}

// Draws a caption as a lower-third bar that slides and fades in.
export function drawCaption(ctx, cap, scale = 1) {
  if (!cap) return;
  const k = Math.min(1, cap.age / 250) * Math.min(1, (cap.showMs - cap.age) / 300);
  ctx.save(); ctx.globalAlpha = k; ctx.font = `600 ${46 * scale}px system-ui, Segoe UI, sans-serif`;
  const w = ctx.measureText(cap.text).width + 80 * scale, x = (70 - (1 - k) * 40) * scale, y = 950 * scale, h = 82 * scale;
  ctx.fillStyle = 'rgba(8,10,16,0.82)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14 * scale); ctx.fill();
  ctx.fillStyle = '#2dd4bf'; ctx.fillRect(x, y, 10 * scale, h);
  ctx.fillStyle = '#f2f5f8'; ctx.textBaseline = 'middle'; ctx.fillText(cap.text, x + 44 * scale, y + h / 2 + scale);
  ctx.restore();
}
