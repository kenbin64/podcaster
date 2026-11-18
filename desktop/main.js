'use strict';
// ButterflyFx Podcast Creator desktop shell. A thin local-only Electron wrapper around studio.html.
// It serves the app from a tiny loopback HTTP server (127.0.0.1) rather than file://, because the
// on-device segmentation model loads its wasm/model via fetch(), which the browser blocks on file://
// but allows on http://localhost. Nothing is exposed off this machine: the server binds to 127.0.0.1
// only. Camera/mic are auto-granted to our own content.
const { app, BrowserWindow, session, powerSaveBlocker, dialog, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');           // the app folder (studio.html, vendor/, assets/)
const RECDIR = path.join(ROOT, 'recordings');      // recorded scenes land here: recordings/<episode>/scene-NN/take-M.webm
const TTSDIR = path.join(ROOT, 'tts');             // local open-source voiceover: tts/piper/piper(.exe) + tts/voices/*.onnx
function _slugify(s) { return String(s || 'episode').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'episode'; }
function _piperBin() { for (const p of [path.join(TTSDIR, 'piper', 'piper.exe'), path.join(TTSDIR, 'piper', 'piper')]) { try { if (fs.existsSync(p)) return p; } catch (e) {} } return null; }
function _piperVoice() { try { const vd = path.join(TTSDIR, 'voices'); const f = fs.readdirSync(vd).find((n) => /\.onnx$/i.test(n)); return f ? path.join(vd, f) : null; } catch (e) { return null; } }
function _piperVoicePath(name) { try { const vd = path.join(TTSDIR, 'voices'); if (name) { const p = path.join(vd, path.basename(name)); if (fs.existsSync(p) && /\.onnx$/i.test(p)) return p; } const f = fs.readdirSync(vd).find((n) => /\.onnx$/i.test(n)); return f ? path.join(vd, f) : null; } catch (e) { return null; } }
// Proxy to a LOCAL Stable Diffusion HTTP API (Automatic1111 / Forge on 127.0.0.1:7860). Free, open source,
// on-device; nothing leaves the machine. Returns {ok:false,error} cleanly when it is not running.
function _sdReq(pathname, method, payload, res, transform) {
  const data = payload ? JSON.stringify(payload) : null;
  const r = http.request({ hostname: '127.0.0.1', port: 7860, path: pathname, method, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (o) => {
    let b = ''; o.on('data', (c) => (b += c)); o.on('end', () => { res.writeHead(200, { 'Content-Type': 'application/json' }); try { res.end(JSON.stringify(transform ? transform(JSON.parse(b)) : JSON.parse(b))); } catch (e) { res.end(JSON.stringify({ ok: false, error: 'bad response' })); } });
  });
  r.on('error', (e) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: e.code })); });
  if (data) r.write(data); r.end();
}
// Is a local video backend (ComfyUI, the de-facto runner for LTX-Video / CogVideoX / SVD) up on 8188?
function _comfyProbe(res) { const r = http.request({ hostname: '127.0.0.1', port: 8188, path: '/system_stats', method: 'GET' }, (o) => { let b = ''; o.on('data', (c) => (b += c)); o.on('end', () => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: o.statusCode === 200 })); }); }); r.on('error', (e) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: e.code })); }); r.end(); }
const BASE_PORT = 8123;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml',
  '.webm': 'video/webm', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v', '.ogv': 'video/ogg',
  '.txt': 'text/plain', '.md': 'text/markdown',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.flac': 'audio/flac',
  '.wasm': 'application/wasm', '.data': 'application/octet-stream',
  '.tflite': 'application/octet-stream', '.binarypb': 'application/octet-stream',
};
const MEDIA_RE = /\.(png|jpe?g|gif|webp|bmp|svg|webm|mp4|mov|m4v|ogv)$/i;

// Read an episode folder (or any folder): walk it, pick the cue script (a *.cuescript.txt that is not a
// .prev backup, else any non-readme .txt/.md), and list every image/clip in it (including an assets/
// subfolder). Returns paths so the page can load each asset by its absolute path via /projectfile.
function listProject(dir) {
  let script = null, scriptName = null; const assets = [];
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) { walk(full); continue; }
      if (/\.cuescript\.txt$/i.test(ent.name) && !/\.prev\./i.test(ent.name)) {
        if (!script) { try { script = fs.readFileSync(full, 'utf8'); scriptName = ent.name; } catch (e) {} }
      } else if (MEDIA_RE.test(ent.name)) {
        assets.push({ name: ent.name, path: full });
      }
    }
  }
  walk(dir);
  if (!script) {                                   // fallback: a plain .txt/.md script that is not a doc
    try {
      const flat = fs.readdirSync(dir);
      const cand = flat.find((n) => /\.(txt|md)$/i.test(n) && !/readme|assets/i.test(n) && !/\.prev\./i.test(n));
      if (cand) { script = fs.readFileSync(path.join(dir, cand), 'utf8'); scriptName = cand; }
    } catch (e) {}
  }
  return { folder: dir, scriptName, script, assets };
}

let activePort = BASE_PORT;

// Proxy a Director request to a LOCAL model (Ollama on 127.0.0.1:11434) so dialog rewriting stays private,
// nothing leaves the machine, and the renderer dodges CORS. Returns { text } or a clear error if no model.
function callLocalModel(body, res) {
  let payload; try { payload = JSON.parse(body || '{}'); } catch (_) { payload = {}; }
  const data = JSON.stringify({ model: payload.model || 'llama3.2', prompt: payload.prompt || '', stream: false });
  const r = http.request({ hostname: '127.0.0.1', port: 11434, path: '/api/generate', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, (orsp) => {
    let buf = ''; orsp.on('data', (c) => (buf += c)); orsp.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      try { const j = JSON.parse(buf); res.end(JSON.stringify({ text: (j.response || '').trim() })); }
      catch (e) { res.end(JSON.stringify({ text: '', error: 'model returned an unexpected response' })); }
    });
  });
  r.on('error', (e) => { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'no local model reachable (' + e.code + '). Start Ollama and pull a model.' })); });
  r.write(data); r.end();
}

function requestHandler(req, res) {
  const u = new URL(req.url || '/', 'http://127.0.0.1');
  const rel = decodeURIComponent(u.pathname);

  if (req.method === 'POST' && rel === '/director') {   // Director -> local model (private dialog rewrite)
    let body = ''; req.on('data', (c) => { body += c; if (body.length > 300000) req.destroy(); });
    req.on('end', () => callLocalModel(body, res));
    return;
  }

  if (req.method === 'POST' && rel === '/savescene') {  // write a recorded take to recordings/<slug>/scene-NN/take-M.webm
    const slug = _slugify(u.searchParams.get('slug'));
    const scene = String(parseInt(u.searchParams.get('scene'), 10) || 1).padStart(2, '0');
    const take = parseInt(u.searchParams.get('take'), 10) || 1;
    const dir = path.join(RECDIR, slug, 'scene-' + scene);
    const chunks = []; req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { fs.mkdirSync(dir, { recursive: true }); const fp = path.join(dir, 'take-' + take + '.webm'); fs.writeFileSync(fp, Buffer.concat(chunks)); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ path: fp })); }
      catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }
  if (req.method === 'POST' && rel === '/savevideo') {    // write the finished video to exports/ and reveal it in the file manager (no fragile dialog)
    const parts = []; req.on('data', (c) => parts.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(parts);
      if (!buf.length) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'empty' })); }
      const name = (u.searchParams.get('name') || 'episode.webm').replace(/[^a-z0-9._-]+/gi, '-');
      const outDir = path.join(ROOT, 'exports');
      try {
        fs.mkdirSync(outDir, { recursive: true });
        const fp = path.join(outDir, name);
        fs.writeFileSync(fp, buf);
        try { shell.showItemInFolder(fp); } catch (_) {}   // pop the folder open so the user can see the file
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ path: fp }));
      } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }
  if (req.method === 'POST' && rel === '/deletetake') {   // delete one take file from disk (only within RECDIR)
    const fp = path.normalize(u.searchParams.get('path') || '');
    if (fp.startsWith(RECDIR) && /\.webm$/i.test(fp)) { try { fs.unlinkSync(fp); } catch (e) {} res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: true })); }
    res.writeHead(403, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'forbidden' }));
  }
  if (rel === '/ttsstatus') {                           // is a local open-source voice (Piper) installed?
    const bin = _piperBin(), voice = _piperVoice(); let voices = [];
    try { voices = fs.readdirSync(path.join(TTSDIR, 'voices')).filter((n) => /\.onnx$/i.test(n)); } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: !!(bin && voice), engine: 'piper', bin: !!bin, voices }));
  }
  if (req.method === 'POST' && rel === '/tts') {        // text -> a private voiceover .wav, generated locally by Piper
    const bin = _piperBin();
    if (!bin || !_piperVoice()) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'No local voice yet. Run tts/get-voice.ps1 once (or put Piper in tts/piper/ and a voice .onnx in tts/voices/). Both free, open source.' })); }
    let body = ''; req.on('data', (c) => { body += c; if (body.length > 200000) req.destroy(); });
    req.on('end', () => {
      let pj = {}; try { pj = JSON.parse(body || '{}'); } catch (e) {}
      const text = String(pj.text || ''), voice = _piperVoicePath(pj.voice);
      if (!text.trim() || !voice) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'no text or no voice installed' })); }
      const out = path.join(TTSDIR, 'vo-' + Date.now() + '.wav'); let err = '';
      let p; try { p = spawn(bin, ['--model', voice, '--output_file', out]); } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'could not start Piper' })); }
      p.stderr.on('data', (d) => { err += d; });
      p.on('error', (e) => { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'piper error: ' + e.code })); });
      p.on('close', () => {
        fs.readFile(out, (e, buf) => {
          try { fs.unlinkSync(out); } catch (_) {}
          if (e || !buf || !buf.length) { res.writeHead(500, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'no audio produced. ' + err.slice(0, 200) })); }
          res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': buf.length }); res.end(buf);
        });
      });
      try { p.stdin.write(text); p.stdin.end(); } catch (e) {}
    });
    return;
  }
  if (rel === '/imgstatus') {                           // is a local image model (Stable Diffusion / A1111 / Forge) up?
    return _sdReq('/sdapi/v1/sd-models', 'GET', null, res, (j) => ({ ok: Array.isArray(j), models: (Array.isArray(j) ? j.map((m) => m.model_name || m.title) : []) }));
  }
  if (req.method === 'POST' && rel === '/txt2img') {    // prompt -> a PNG (base64), generated locally
    let body = ''; req.on('data', (c) => { body += c; if (body.length > 20000) req.destroy(); });
    req.on('end', () => {
      let p = {}; try { p = JSON.parse(body || '{}'); } catch (e) {}
      const payload = { prompt: p.prompt || '', negative_prompt: p.negative || 'text, watermark, blurry, lowres', steps: p.steps || 22, width: p.width || 768, height: p.height || 432, cfg_scale: 6.5 };
      _sdReq('/sdapi/v1/txt2img', 'POST', payload, res, (j) => ({ image: (j.images && j.images[0]) || null, error: (j.images ? null : 'no image returned') }));
    });
    return;
  }
  if (rel === '/vidstatus') { return _comfyProbe(res); } // is a local video backend (ComfyUI) running?
  if (req.method === 'POST' && (rel === '/txt2vid' || rel === '/img2vid')) {   // scaffolded: drain body, return honest guidance
    let body = ''; req.on('data', (c) => { body += c; if (body.length > 15000000) req.destroy(); });
    req.on('end', () => { res.writeHead(501, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Local video generation needs ComfyUI + an LTX-Video workflow set up (see video/README.md). The studio is wired to call it once that is in place.' })); });
    return;
  }
  if (rel === '/modelstatus') {                         // is a local model (Ollama) up? which models are pulled?
    const r2 = http.request({ hostname: '127.0.0.1', port: 11434, path: '/api/tags', method: 'GET' }, (orsp) => {
      let buf = ''; orsp.on('data', (c) => (buf += c)); orsp.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        try { const j = JSON.parse(buf); res.end(JSON.stringify({ ok: true, models: (j.models || []).map((mm) => mm.name) })); }
        catch (e) { res.end(JSON.stringify({ ok: false, error: 'bad response' })); }
      });
    });
    r2.on('error', (e) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: e.code })); });
    r2.end(); return;
  }
  if (rel === '/listscenes') {                          // list the saved scene folders + their takes
    const slug = _slugify(u.searchParams.get('slug')), base = path.join(RECDIR, slug), out = { slug: slug, base: base, scenes: [] };
    try { fs.readdirSync(base).filter((n) => /^scene-\d+/.test(n)).sort().forEach((sd) => { const tk = fs.readdirSync(path.join(base, sd)).filter((n) => /\.webm$/i.test(n)).sort(); out.scenes.push({ scene: sd, takes: tk.map((t) => ({ name: t, path: path.join(base, sd, t) })) }); }); } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out)); return;
  }

  // API: read a project folder by its typed path and return script text + asset list (desktop only).
  if (rel === '/readproject') {
    const dir = u.searchParams.get('path') || '';
    if (!dir) { res.writeHead(400); return res.end('no path'); }
    try {
      const data = listProject(path.resolve(__dirname, '..', dir));   // a relative folder is read from the app's own folder
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data));
    } catch (e) { res.writeHead(500); return res.end('read error: ' + e.message); }
  }
  // API: serve a single asset file by its absolute path (media/text only), so a typed-path project can
  // load its graphics. Loopback-only server, and limited to media/text extensions.
  if (rel === '/projectfile') {
    const fp = path.normalize(u.searchParams.get('path') || '');
    if (!MEDIA_RE.test(fp) && !/\.(txt|md|json)$/i.test(fp)) { res.writeHead(403); return res.end('forbidden'); }
    return fs.readFile(fp, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  }

  // Static: serve the app's own files from ROOT (no path escape).
  let staticRel = rel === '/' ? '/studio.html' : rel;
  const fp = path.normalize(path.join(ROOT, staticRel));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    // NEVER let Chromium cache the app's own files, or it serves a stale studio.html across restarts and
    // edits silently never appear. Always read fresh from disk.
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
    res.end(buf);
  });
}

// Bind to BASE_PORT. If it is already taken (a stray or still-running copy), step up to the next free
// port instead of crashing with EADDRINUSE.
function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer(requestHandler);
    let port = BASE_PORT;
    srv.on('error', (e) => {
      if (e.code === 'EADDRINUSE' && port < BASE_PORT + 25) { port += 1; srv.listen(port, '127.0.0.1'); }
      else { resolve(BASE_PORT); }   // give up gracefully (no crash); the window load may just fail
    });
    srv.on('listening', () => { activePort = port; resolve(port); });
    srv.listen(port, '127.0.0.1');
  });
}

app.commandLine.appendSwitch('disable-background-timer-throttling');

let psbId = -1, mainWin = null;   // hold the display awake (no screen saver / display sleep) the whole time the studio is open
function createWindow() {
  const win = new BrowserWindow({
    width: 1500, height: 950, backgroundColor: '#0a0f17', title: 'ButterflyFx Podcast Creator',
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, backgroundThrottling: false },
  });
  mainWin = win;
  try { win.webContents.session.clearCache(); } catch (_) {}                                  // wipe any stale cached copy from before this fix
  win.loadURL('http://127.0.0.1:' + activePort + '/studio.html?v=' + Date.now());             // cache-bust the URL so a fresh studio.html always loads
  win.webContents.on('before-input-event', (e, input) => {                                    // F5 / Ctrl+R force a clean reload, never from cache
    if (input.type === 'keyDown' && (input.key === 'F5' || (input.control && (input.key === 'r' || input.key === 'R')))) { e.preventDefault(); win.webContents.session.clearCache().then(() => win.loadURL('http://127.0.0.1:' + activePort + '/studio.html?v=' + Date.now())); }
  });
  if (psbId < 0) { try { psbId = powerSaveBlocker.start('prevent-display-sleep'); } catch (_) {} }   // no screen saver mid-shoot
}

// Only one copy runs. A second launch focuses the open window instead of starting a second server.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); } else createWindow();
  });
  app.whenReady().then(async () => {
    const ses = session.defaultSession;
    const isMedia = (p) => ['media', 'audioCapture', 'videoCapture', 'display-capture'].includes(p);
    ses.setPermissionRequestHandler((_wc, perm, cb) => cb(isMedia(perm)));
    ses.setPermissionCheckHandler((_wc, perm) => isMedia(perm));
    await startServer();
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
