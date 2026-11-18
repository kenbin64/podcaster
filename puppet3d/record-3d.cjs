// Serves the 3D stage and records or checks it in Chrome.
//   node record-3d.cjs <node_modules folder parent> <manifest cast.json> stills <out.jpg> <t1,t2,...>
//   node record-3d.cjs <node_modules folder parent> <manifest cast.json> speed
//   node record-3d.cjs <node_modules folder parent> <manifest cast.json> record <out.webm>
// three.js and the models are served from the Chomp game folder (CHOMP_DIR, default C:/projects/chomp-3d) at
// /js and /models, so they are used where they live and not copied. Everything else comes from this repo.
const path = require('path'), http = require('http'), fs = require('fs');
const [MODS_DIR, MANIFEST, MODE, ...ARGS] = process.argv.slice(2);
const MODS = path.resolve(MODS_DIR, 'node_modules');
const puppeteer = require(path.join(MODS, 'puppeteer-core'));
const CHOMP = process.env.CHOMP_DIR || 'C:/projects/chomp-3d', REPO = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.wasm': 'application/wasm' };
const server = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x'), p = decodeURIComponent(u.pathname);
  const f = p === '/abs' ? path.normalize(u.searchParams.get('path')) : /^\/(js|models)\//.test(p) ? path.join(CHOMP, p) : path.join(REPO, p);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
}).listen(8911);

(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn') errs.push(m.text()); });
  await p.setViewport({ width: 1280, height: 720 });
  await p.goto('http://127.0.0.1:8911/puppet3d/stage.html?manifest=' + encodeURIComponent(MANIFEST));
  const ok = await p.waitForFunction(() => window.ready, { timeout: 180000 }).then(() => true, () => false);
  if (!ok) { console.log('the stage never got ready:', errs); await b.close(); server.close(); process.exit(1); }
  console.log('gpu:', await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const d = g && g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; }));
  if (MODE === 'stills') {
    const [OUT, TIMES] = ARGS, times = TIMES.split(',').map(Number), shots = [];
    for (const t of times) { await p.evaluate((t) => window.renderAt(t), t); shots.push(await p.evaluate(() => document.getElementById('out').toDataURL('image/jpeg', 0.8))); }
    const sheet = await p.evaluate(async (shots, times) => {
      const c = document.createElement('canvas'), cols = 2, w = 960, h = 540; c.width = cols * w; c.height = Math.ceil(shots.length / cols) * h; const g = c.getContext('2d');
      for (let i = 0; i < shots.length; i++) { const im = new Image(); im.src = shots[i]; await im.decode(); g.drawImage(im, (i % cols) * w, Math.floor(i / cols) * h, w, h); g.fillStyle = '#000a'; g.fillRect((i % cols) * w, Math.floor(i / cols) * h, 120, 40); g.fillStyle = '#fff'; g.font = '28px sans-serif'; g.fillText(times[i] + ' s', (i % cols) * w + 10, Math.floor(i / cols) * h + 30); }
      return c.toDataURL('image/jpeg', 0.82);
    }, shots, times);
    fs.writeFileSync(OUT, Buffer.from(sheet.split(',')[1], 'base64'));
  } else if (MODE === 'speed') {
    console.log('ms per frame:', await p.evaluate(() => { const a = performance.now(); for (let i = 0; i < 60; i++) window.renderAt(10 + i / 30); return ((performance.now() - a) / (60 * 47)).toFixed(1); }));
  } else if (MODE === 'record') {
    const OUT = ARGS[0];
    fs.writeFileSync(OUT, Buffer.alloc(0));
    await p.exposeFunction('saveChunk', (b64) => fs.appendFileSync(OUT, Buffer.from(b64, 'base64')));
    await p.addScriptTag({ path: path.join(MODS, 'fix-webm-duration', 'fix-webm-duration.js') });
    const res = await p.evaluate(async () => {
      const r = await window.play(true);
      const fixed = await ysFixWebmDuration(r.blob, Math.round(r.seconds * 1000), { logger: false });
      const bytes = new Uint8Array(await fixed.arrayBuffer());
      for (let i = 0; i < bytes.length; i += 0x100000) { let s = ''; const part = bytes.subarray(i, i + 0x100000); for (let j = 0; j < part.length; j += 0x8000) s += String.fromCharCode.apply(null, part.subarray(j, j + 0x8000)); await window.saveChunk(btoa(s)); }
      return { seconds: r.seconds, fps: window.lastFps };
    });
    console.log('recorded', res.seconds.toFixed(1), 's at', res.fps.toFixed(1), 'fps,', (fs.statSync(OUT).size / 1048576).toFixed(1), 'MB');
  }
  console.log('errors:', errs.length ? [...new Set(errs)].slice(0, 8) : 'none'); await b.close(); server.close();
})();
