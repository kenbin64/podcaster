// Records the walkthrough: the real studio, on screen, being used. The narration's timeline (timeline.json)
// says when each on-screen action happens; during the episode part each spoken word advances the teleprompter
// and fires that word's cues, as the studio's voice-follow mode does with a live speaker. The whole browser tab
// is recorded with the narration.
//   npm install
//   python narrate.py
//   npm run record             (writes walkthrough.webm)
const puppeteer = require('puppeteer-core');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.resolve(process.argv[2] || 'walkthrough.webm');
const EP = '/projects/walkthrough-episode', W = 1440, H = 810;
const CHROME = process.env.CHROME_PATH || ({ win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }[process.platform] || '/usr/bin/google-chrome');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.txt': 'text/plain', '.json': 'application/json' };
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(8896);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--auto-accept-this-tab-capture', '--autoplay-policy=no-user-gesture-required', `--window-size=${W},${H}`] });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
  fs.writeFileSync(OUT, Buffer.alloc(0));
  await p.exposeFunction('saveChunk', (b64) => fs.appendFileSync(OUT, Buffer.from(b64, 'base64')));
  await p.goto('http://127.0.0.1:8896/studio.html', { waitUntil: 'load' }); await sleep(2000);
  await p.addScriptTag({ path: require.resolve('fix-webm-duration') });
  await p.evaluate(() => {
    const s = [...document.querySelectorAll('button')].find((x) => /Skip for now/.test(x.textContent)); if (s) s.click();
    const coach = document.getElementById('coachOn'); if (coach && coach.checked) coach.click();   // the coach face is for the host, not the viewer
    window.scrollTo(0, 0);
  });
  await sleep(800);

  const assets = fs.readdirSync(path.join(ROOT, EP, 'assets')).map((f) => EP + '/assets/' + f);
  const timeline = JSON.parse(fs.readFileSync(path.join(__dirname, 'timeline.json'), 'utf8'));
  const result = await p.evaluate(async (timeline, folder, host, base, W, H) => {
    const $ = (id) => document.getElementById(id);
    const tab = (label) => [...document.querySelectorAll('#footerTabs button')].find((b) => b.textContent.includes(label));
    const files = async (list) => { const dt = new DataTransfer(); for (const r of list) { const blob = await (await fetch(r)).blob(); dt.items.add(new File([blob], r.split('/').pop(), { type: blob.type })); } return dt.files; };
    const pick = async (id, list) => { const i = $(id); i.files = await files(list); i.dispatchEvent(new Event('change', { bubbles: true })); };
    const glow = (el) => { if (el) { el.style.transition = 'box-shadow .3s'; el.style.boxShadow = '0 0 0 4px #ffd166, 0 0 28px 8px rgba(255,209,102,.75)'; } };
    const folderFiles = await files(folder), hostFiles = await files([host]);

    // The things a person does in the studio, one per narrated step.
    const ACTIONS = {
      intro: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      openFiles: () => tab('Files').click(),
      loadFolder: () => { const i = $('projFolder'); i.files = folderFiles; i.dispatchEvent(new Event('change', { bubbles: true })); },
      showScript: () => tab('Script').click(),
      selectCue: () => { const t = $('script'), at = t.value.indexOf('{news'); t.focus({ preventScroll: true }); t.setSelectionRange(at, t.value.indexOf('}', at) + 1); glow(t); t.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
      openLook: () => { $('script').style.boxShadow = ''; tab('Look').click(); },
      setBackdrop: () => { const i = $('bgFile'); i.files = hostFiles; i.dispatchEvent(new Event('change', { bubbles: true }));
        for (const id of ['optMic', 'optAir', 'optPlant', 'optArt', 'optBadge']) { const c = $(id); if (c.checked) c.click(); } },
      goStage: () => { $('script').blur(); window.scrollTo({ top: 0, behavior: 'smooth' }); pIndex = 0; cueFired = 0; resetOverlays(); renderWord(); layoutMarquee(true); },
      episode: () => {},
      highlightSave: () => { const save = [...document.querySelectorAll('button')].find((x) => /Save to Video/.test(x.textContent)); glow(save); if (save) save.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
      endCard: () => { const c = document.createElement('div');
        c.style.cssText = 'position:fixed;inset:0;z-index:2000000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:radial-gradient(circle at 50% 40%,#16324a,#070b12 70%);color:#eaf6ff;font-family:Segoe UI,Arial,sans-serif;opacity:0;transition:opacity .8s';
        c.innerHTML = '<div style="font-size:64px;font-weight:800">ButterflyFx Podcast Creator</div><div style="font-size:30px;color:#7fe0c4">A finished episode, with no post-production</div><div style="font-size:24px;color:#9fb6cc;margin-top:18px">Free and open source &middot; github.com/kenbin64/podcaster</div><div style="font-size:20px;color:#6f8aa3">A portfolio project by Kenneth W. Bingham</div>';
        document.body.appendChild(c); requestAnimationFrame(() => { c.style.opacity = '1'; }); },
    };

    const ctx = new AudioContext(), dest = ctx.createMediaStreamDestination();
    const clips = await Promise.all(timeline.clips.map(async (c) => ({ start: c.start, buf: await ctx.decodeAudioData(await (await fetch(base + c.file)).arrayBuffer()) })));
    const screen = await navigator.mediaDevices.getDisplayMedia({ video: { width: W, height: H, frameRate: 30 }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include' });
    const stream = new MediaStream([screen.getVideoTracks()[0], dest.stream.getAudioTracks()[0]]);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 2200000, audioBitsPerSecond: 128000, videoKeyFrameIntervalDuration: 2000 });
    const chunks = []; rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

    const ev = [];
    for (const a of timeline.actions) ev.push({ t: a.t, run: () => ACTIONS[a.do]() });
    for (const e of timeline.episode) { ev.push({ t: e.fire, run: () => fireCuesUpTo(e.k) }); ev.push({ t: e.word, run: () => { pIndex = e.k; renderWord(); fireCuesUpTo(e.k); layoutMarquee(false); } }); }
    ev.sort((a, b) => a.t - b.t);

    rec.start(1000);
    const t0 = ctx.currentTime + 0.3;
    for (const c of clips) { const s = ctx.createBufferSource(); s.buffer = c.buf; s.connect(dest); s.start(t0 + c.start / 1000); }
    let next = 0;
    await new Promise((done) => { (function frame() {
      const now = (ctx.currentTime - t0) * 1000;
      while (next < ev.length && ev[next].t <= now) ev[next++].run();
      if (now < timeline.totalMs) requestAnimationFrame(frame); else done();
    })(); });
    rec.stop(); await new Promise((r) => rec.addEventListener('stop', r, { once: true })); screen.getTracks().forEach((t) => t.stop());
    const durationMs = Math.round((ctx.currentTime - t0) * 1000) + 300;
    const fixed = await ysFixWebmDuration(new Blob(chunks, { type: 'video/webm' }), durationMs, { logger: false });
    const bytes = new Uint8Array(await fixed.arrayBuffer());
    for (let i = 0; i < bytes.length; i += 0x100000) { let s = ''; const part = bytes.subarray(i, i + 0x100000); for (let j = 0; j < part.length; j += 0x8000) s += String.fromCharCode.apply(null, part.subarray(j, j + 0x8000)); await window.saveChunk(btoa(s)); }
    return { events: ev.length, applied: next, cuesFired: cueFired, cues: scriptCues.length, scriptLoaded: $('script').value.length };
  }, timeline, [EP + '/walkthrough-episode.cuescript.txt', ...assets], EP + '/host.png', EP + '/video/', W, H);
  await b.close(); server.close();
  console.log(JSON.stringify(result), 'page errors:', errs.length ? errs.slice(0, 4) : 'none', 'size MB:', (fs.statSync(OUT).size / 1048576).toFixed(1));
})();
