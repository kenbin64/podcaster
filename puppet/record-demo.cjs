// Records demo.html playing its line, with sound, to talking-character.webm.
//   node record-demo.cjs <folder with puppeteer-core and fix-webm-duration in node_modules>
const path = require('path'), http = require('http'), fs = require('fs');
const MODS = path.resolve(process.argv[2] || '.', 'node_modules');
const puppeteer = require(path.join(MODS, 'puppeteer-core'));
const ROOT = __dirname, OUT = path.join(ROOT, 'talking-character.webm');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(8907);
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
  fs.writeFileSync(OUT, Buffer.alloc(0));
  await p.exposeFunction('saveChunk', (b64) => fs.appendFileSync(OUT, Buffer.from(b64, 'base64')));
  await p.goto('http://127.0.0.1:8907/demo.html'); await p.waitForFunction(() => window.ready, { timeout: 30000 });
  await p.addScriptTag({ path: path.join(MODS, 'fix-webm-duration', 'fix-webm-duration.js') });
  const seconds = await p.evaluate(async () => {
    const r = await window.play(true);
    const fixed = await ysFixWebmDuration(r.blob, Math.round(r.seconds * 1000), { logger: false });
    const bytes = new Uint8Array(await fixed.arrayBuffer());
    for (let i = 0; i < bytes.length; i += 0x100000) { let s = ''; const part = bytes.subarray(i, i + 0x100000); for (let j = 0; j < part.length; j += 0x8000) s += String.fromCharCode.apply(null, part.subarray(j, j + 0x8000)); await window.saveChunk(btoa(s)); }
    return r.seconds;
  });
  await b.close(); server.close();
  console.log('recorded', seconds.toFixed(1), 's,', (fs.statSync(OUT).size / 1048576).toFixed(1), 'MB');
})();
