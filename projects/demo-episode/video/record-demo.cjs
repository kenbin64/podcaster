// Records the demo episode with the studio itself: no person on camera and no editing afterwards.
// The studio renders the stage (host picture, graphics, captions, section cards, effects) while the narration
// plays. Each word's moment, taken from the text-to-speech timing, advances the teleprompter and fires that
// word's cues, the same way the studio's voice-advance mode follows a live speaker.
//
//   npm install
//   npm run record            (writes demo-episode.webm)
//
// Inputs, all in this folder: narration.wav and timing.json (made by tts.ps1 and the timing step; see README.md).
const puppeteer = require(process.argv[2] || 'puppeteer-core');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.resolve(process.argv[3] || 'demo-episode.webm');
const EP = '/projects/demo-episode';
const CHROME = process.env.CHROME_PATH || ({ win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }[process.platform] || '/usr/bin/google-chrome');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.wasm': 'application/wasm', '.txt': 'text/plain', '.json': 'application/json' };
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(8895);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 1500, height: 950 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
  fs.writeFileSync(OUT, Buffer.alloc(0));
  await p.exposeFunction('saveChunk', (b64) => fs.appendFileSync(OUT, Buffer.from(b64, 'base64')));
  await p.goto('http://127.0.0.1:8895/studio.html', { waitUntil: 'load' }); await sleep(2000);
  // MediaRecorder leaves the duration out of the file; this small library writes it in, so players show a timeline.
  await p.addScriptTag({ path: require.resolve('fix-webm-duration') });
  await p.evaluate(() => { const s = [...document.querySelectorAll('button')].find((x) => /Skip for now/.test(x.textContent)); if (s) s.click(); });

  // Load the episode folder exactly as "Open project folder" would, then set the look: the host picture as the
  // scene, and no studio props (the picture has its own microphone) or episode clock (it only runs in live takes).
  const assets = fs.readdirSync(path.join(ROOT, EP, 'assets')).map((f) => EP + '/assets/' + f);
  await p.evaluate(async (rels, host) => {
    const files = async (list) => { const dt = new DataTransfer(); for (const r of list) { const blob = await (await fetch(r)).blob(); dt.items.add(new File([blob], r.split('/').pop(), { type: blob.type })); } return dt.files; };
    const pick = async (id, list) => { const i = document.getElementById(id); i.files = await files(list); i.dispatchEvent(new Event('change', { bubbles: true })); };
    await pick('projFolder', rels);
    await pick('bgFile', [host]);
    for (const id of ['optMic', 'optAir', 'optPlant', 'optArt', 'optBadge']) { const c = document.getElementById(id); if (c.checked) c.click(); }
  }, [EP + '/demo-episode.cuescript.txt', ...assets], EP + '/host.png');
  await sleep(2000);

  const timing = JSON.parse(fs.readFileSync(path.join(__dirname, 'timing.json'), 'utf8'));
  if (process.env.LIMIT_MS) timing.durationMs = Number(process.env.LIMIT_MS);   // a short trial run
  const result = await p.evaluate(async (timing, wavUrl) => {
    pIndex = 0; cueFired = 0; resetOverlays(); renderWord(); layoutMarquee(true);
    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(await (await fetch(wavUrl)).arrayBuffer());
    const dest = ctx.createMediaStreamDestination();
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(dest);
    // The stage is 1920x1080; it is copied to a 1280x720 canvas so the file stays small enough to host.
    const stage = document.getElementById('cv'), small = document.createElement('canvas'); small.width = 1280; small.height = 720;
    const sx = small.getContext('2d');
    const stream = small.captureStream(30); stream.addTrack(dest.stream.getAudioTracks()[0]);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 1300000, audioBitsPerSecond: 96000, videoKeyFrameIntervalDuration: 2000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    // Two events per word: when its cues fire (a section card fires at the start of the silence before it),
    // and when it becomes the current word on the teleprompter.
    const ev = []; for (const e of timing.events) { ev.push({ t: e.fire, k: e.k, kind: 'fire' }); ev.push({ t: e.word, k: e.k, kind: 'word' }); }
    ev.sort((a, b) => a.t - b.t);
    let next = 0;
    rec.start(1000); const t0 = ctx.currentTime + 0.05; src.start(t0);
    await new Promise((done) => {
      (function frame() {
        sx.drawImage(stage, 0, 0, 1280, 720);
        const now = (ctx.currentTime - t0) * 1000;
        while (next < ev.length && ev[next].t <= now) {
          const e = ev[next++];
          if (e.kind === 'fire') fireCuesUpTo(e.k);
          else { pIndex = e.k; renderWord(); fireCuesUpTo(e.k); layoutMarquee(false); }
        }
        if (now < timing.durationMs + 2500) requestAnimationFrame(frame); else done();
      })();
    });
    rec.stop(); await new Promise((r) => rec.addEventListener('stop', r, { once: true }));
    const durationMs = Math.round((ctx.currentTime - t0) * 1000);
    const fixed = await ysFixWebmDuration(new Blob(chunks, { type: 'video/webm' }), durationMs, { logger: false });
    const bytes = new Uint8Array(await fixed.arrayBuffer());
    for (let i = 0; i < bytes.length; i += 0x100000) { let s = ''; const part = bytes.subarray(i, i + 0x100000); for (let j = 0; j < part.length; j += 0x8000) s += String.fromCharCode.apply(null, part.subarray(j, j + 0x8000)); await window.saveChunk(btoa(s)); }
    return { applied: next, of: ev.length, cuesFired: cueFired, cues: scriptCues.length };
  }, timing, EP + '/video/narration.wav');
  await b.close(); server.close();
  console.log(JSON.stringify(result), 'page errors:', errs.length ? errs.slice(0, 4) : 'none', 'size MB:', (fs.statSync(OUT).size / 1048576).toFixed(1));
})();
