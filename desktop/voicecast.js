'use strict';
// voicecast.js
// One job: voice an episode's characters. It reads the script's cast and speaker lines, makes one audio file
// per line in the episode's voices/ folder, and writes voices/cast.json for the stage to perform.
//
// In the script:
//   {cast | Ken | host | en-AU-WilliamMultilingualNeural}   name | look | voice
//   Ken: [warm] G'day! {news | title.svg} Welcome back.        a line in that person's voice
//   Sam: <recordings/sam-01.wav> [curious]                     a real recording; the mouth follows the sound
//
// The voice decides the engine:
//   ends in .onnx         -> Piper, on this machine (offline); no word timings, so the mouth follows the sound
//   "recorded"            -> every line for this person must be a <file>
//   anything else         -> a neural voice through tts/neural-line.py, with each word's timing
// A line whose text and voice have not changed is not voiced again (the file name carries a hash of both).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PYTHON = process.env.PODCASTER_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

// Script text -> { cast: [{name, look, voice}], lines: [{who, recording, spoken, notes, cues}] }.
// notes and cues keep the index of the spoken word they sit before, so the stage can fire them on time.
function parseCast(script) {
  const cast = [], lines = [];
  for (const raw of String(script || '').split(/\r?\n/)) {
    const line = raw.trim();
    const c = line.match(/^\{\s*cast\s*\|([^}]*)\}$/i);
    if (c) {
      const [name, look, voice] = c[1].split('|').map((s) => s.trim());
      if (name) cast.push({ name, look: look || 'host', voice: voice || '' });
      continue;
    }
    const m = line.match(/^([^:{[\s][^:]{0,30}):\s*(.*)$/);
    if (!m || !cast.some((p) => p.name === m[1].trim())) continue;   // only lines from someone in the cast
    let rest = m[2];
    const rec = rest.match(/^<([^>]+)>\s*(.*)$/);
    if (rec) rest = rec[2];
    const spoken = [], notes = [], cues = [];
    for (const tok of rest.match(/\{[^}]*\}|\[[^\]]*\]|\S+/g) || []) {
      if (tok[0] === '{') cues.push({ at: spoken.length, cue: tok });
      else if (tok[0] === '[') notes.push({ at: spoken.length, note: tok.slice(1, -1) });
      else spoken.push(tok);
    }
    lines.push({ who: m[1].trim(), recording: rec ? rec[1].trim() : null, spoken, notes, cues });
  }
  return { cast, lines };
}

// Runs a program, feeds it stdin, and resolves with its stdout (rejects with its stderr on failure).
function run(cmd, args, input) {
  return new Promise((resolve, reject) => {
    let p; try { p = spawn(cmd, args); } catch (e) { return reject(new Error('could not start ' + cmd)); }
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => reject(new Error(cmd + ': ' + e.code)));
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(err.trim().split('\n').pop() || cmd + ' failed'))));
    p.stdin.end(input);
  });
}

async function voiceLine(line, voice, outDir, tools) {
  const text = line.spoken.join(' ');
  const hash = crypto.createHash('sha1').update(voice + '\n' + text).digest('hex').slice(0, 10);
  const base = path.join(outDir, line.who.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + hash);
  if (/\.onnx$/i.test(voice)) {
    const out = base + '.wav';
    if (!fs.existsSync(out)) {
      if (!tools.piperBin) throw new Error('Piper is not installed (run tts/get-voice.ps1)');
      await run(tools.piperBin, ['--model', path.join(tools.ttsDir, 'voices', path.basename(voice)), '--output_file', out], text);
    }
    return { audio: out, words: null };
  }
  const out = base + '.mp3', timing = base + '.json';
  if (!fs.existsSync(out) || !fs.existsSync(timing)) {
    const reply = await run(PYTHON, [path.join(tools.ttsDir, 'neural-line.py')], JSON.stringify({ text, voice, out }));
    fs.writeFileSync(timing, reply);
  }
  return { audio: out, words: JSON.parse(fs.readFileSync(timing, 'utf8')).words };
}

// Voices every line of the script for the episode in folder. Returns the manifest it wrote.
async function voiceCast(folder, script, tools) {
  const { cast, lines } = parseCast(script);
  if (!cast.length) throw new Error('no {cast | Name | look | voice} lines in the script');
  if (!lines.length) throw new Error('no "Name: ..." lines from the cast in the script');
  const outDir = path.join(folder, 'voices');
  fs.mkdirSync(outDir, { recursive: true });
  const voices = Object.fromEntries(cast.map((p) => [p.name, p.voice]));
  const done = [];
  for (const line of lines) {
    let audio, words = null;
    if (line.recording) {
      audio = path.resolve(folder, line.recording);
      if (!fs.existsSync(audio)) throw new Error(line.who + ': recording not found: ' + line.recording);
    } else {
      if (!line.spoken.length) continue;
      if (/^recorded$/i.test(voices[line.who])) throw new Error(line.who + ' is cast as "recorded", so each line needs a <file>');
      ({ audio, words } = await voiceLine(line, voices[line.who], outDir, tools));
    }
    done.push({ who: line.who, audio, words, notes: line.notes, cues: line.cues, text: line.spoken.join(' ') });
  }
  const manifest = { cast, lines: done };
  fs.writeFileSync(path.join(outDir, 'cast.json'), JSON.stringify(manifest, null, 1));
  return manifest;
}

module.exports = { parseCast, voiceCast };
