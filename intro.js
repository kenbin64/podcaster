'use strict';
// Animated cold-open, drawn straight onto the recorded canvas (so it is part of the video).
// Sequence: a bug zapper zaps a few bugs; a butterfly flies in and is NOT zapped (the zapper dims
// and spares it); the butterfly morphs up into the ButterflyFx logo with "PODCAST" and the host;
// then it fades to black; white block-letter cards show the EPISODE number and the TOPIC; then the
// caller crossfades to the live camera. Pure canvas, no assets.
// cfg = { title (series), host, ep, topic }.
(function (global) {
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
  const lerp = (a, b, t) => a + (b - a) * t;

  function drawZapper(ctx, cx, top, bot, intensity, t) {
    const flick = 0.85 + 0.15 * Math.sin(t * 40);
    const I = intensity * flick;
    const halo = ctx.createLinearGradient(cx - 90, 0, cx + 90, 0);
    halo.addColorStop(0, 'rgba(120,60,220,0)');
    halo.addColorStop(0.5, 'rgba(165,120,255,' + (0.55 * I).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(120,60,220,0)');
    ctx.fillStyle = halo; ctx.fillRect(cx - 90, top - 20, 180, (bot - top) + 40);
    ctx.fillStyle = 'rgba(210,190,255,' + (0.9 * I).toFixed(3) + ')';
    ctx.fillRect(cx - 6, top, 12, bot - top);
    ctx.strokeStyle = 'rgba(150,150,175,0.45)'; ctx.lineWidth = 1;
    for (let gx = cx - 70; gx <= cx + 70; gx += 14) { ctx.beginPath(); ctx.moveTo(gx, top); ctx.lineTo(gx, bot); ctx.stroke(); }
    for (let gy = top; gy <= bot; gy += 18) { ctx.beginPath(); ctx.moveTo(cx - 70, gy); ctx.lineTo(cx + 70, gy); ctx.stroke(); }
  }
  function drawZap(ctx, x, y, k) {
    const r = 60 * k;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,' + k.toFixed(2) + ')');
    g.addColorStop(0.4, 'rgba(180,150,255,' + (0.7 * k).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(120,60,220,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * k).toFixed(2) + ')'; ctx.lineWidth = 2;
    for (let a = 0; a < 7; a++) { const an = a * 0.9 + k * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * r * 1.3, y + Math.sin(an) * r * 1.3); ctx.stroke(); }
  }
  function drawBug(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#0c0c10'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.32, 0, 0, 7); ctx.fill();
    const w = Math.abs(Math.sin(t * 30)) * s * 0.6 + s * 0.1;
    ctx.fillStyle = 'rgba(200,210,230,0.5)';
    ctx.beginPath(); ctx.ellipse(-s * 0.2, -w * 0.4, s * 0.3, w, -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.2, -w * 0.4, s * 0.3, w, 0.5, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawButterfly(ctx, x, y, s, flap, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle || 0);
    const open = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(flap));
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1); ctx.scale(open, 1);
      const up = ctx.createLinearGradient(0, 0, s, -s);
      up.addColorStop(0, '#caa24b'); up.addColorStop(1, '#ffe9a8'); ctx.fillStyle = up;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.3, -s * 1.15, s * 1.25, -s * 0.95, s * 1.02, -s * 0.08);
      ctx.bezierCurveTo(s * 0.9, s * 0.06, s * 0.4, s * 0.05, 0, 0); ctx.fill();
      const lo = ctx.createLinearGradient(0, 0, s * 0.8, s);
      lo.addColorStop(0, '#a8842f'); lo.addColorStop(1, '#00ffee'); ctx.fillStyle = lo;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.2, s * 0.55, s * 0.85, s * 0.95, s * 0.72, s * 0.18);
      ctx.bezierCurveTo(s * 0.6, s * 0.04, s * 0.2, 0, 0, 0); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.08, s * 0.5, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1a1208'; ctx.lineWidth = Math.max(1, s * 0.03);
    ctx.beginPath(); ctx.moveTo(0, -s * 0.45); ctx.quadraticCurveTo(s * 0.15, -s * 0.72, s * 0.26, -s * 0.66);
    ctx.moveTo(0, -s * 0.45); ctx.quadraticCurveTo(-s * 0.15, -s * 0.72, -s * 0.26, -s * 0.66); ctx.stroke();
    ctx.restore();
  }
  function wrapCenter(ctx, text, cx, cy, maxW, lh) {
    const words = String(text).split(/\s+/), lines = []; let line = '';
    for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
    if (line) lines.push(line);
    const y0 = cy - (lines.length - 1) * lh / 2;
    lines.forEach((l, i) => ctx.fillText(l, cx, y0 + i * lh));
  }

  const BUGS = [{ x: -0.32, y: -0.18, zt: 0.7 }, { x: 0.34, y: 0.22, zt: 1.25 }, { x: -0.28, y: 0.28, zt: 1.8 }];

  global.drawIntro = function (ctx, t, dur, cfg) {
    cfg = cfg || {};
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const series = cfg.title || 'ButterflyFx';
    const host = cfg.host || 'Ken Bingham';
    const ep = (cfg.ep != null && String(cfg.ep) !== '') ? ('EPISODE ' + cfg.ep) : '';
    const topic = (cfg.topic || cfg.tagline || '').trim();
    const cx = W * 0.5, cy = H * 0.5, zTop = H * 0.16, zBot = H * 0.72, tubeMidY = (zTop + zBot) / 2;
    const P = (f) => f * dur;
    const tZap = P(0.32), tFly = P(0.30), tMorph = P(0.50), tLogo = P(0.58), tBlack = P(0.74), tCards = P(0.80);

    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05060c'); g.addColorStop(1, '#0a0c14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // ---- end: fade to black, then white block-letter cards (EPISODE, then TOPIC) ----
    if (t >= tBlack) {
      const kBlack = ease((t - tBlack) / Math.max(0.01, tCards - tBlack));
      ctx.fillStyle = 'rgba(0,0,0,' + kBlack.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
      if (t >= tCards) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        const span = Math.max(0.01, dur - tCards), half = span / 2;
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
        if (t < tCards + half) {
          ctx.globalAlpha = Math.min(1, ease((t - tCards) / (half * 0.5)));
          ctx.font = '800 ' + Math.round(H * 0.11) + 'px Segoe UI, Arial, sans-serif';
          ctx.fillText(ep || series.toUpperCase(), cx, cy);
        } else {
          ctx.globalAlpha = Math.min(1, ease((t - (tCards + half)) / (half * 0.5)));
          ctx.font = '800 ' + Math.round(H * 0.08) + 'px Segoe UI, Arial, sans-serif';
          wrapCenter(ctx, (topic || series).toUpperCase(), cx, cy, W * 0.82, H * 0.10);
        }
        ctx.restore();
      }
      return;
    }

    // ---- zapper + bugs ----
    const dim = t < tZap ? 1 : Math.max(0.16, 1 - (t - tZap) / P(0.08));
    drawZapper(ctx, cx, zTop, zBot, dim, t);
    for (const b of BUGS) {
      const zt = (b.zt / 2.2) * tZap;
      const sx = cx + b.x * W, sy = tubeMidY + b.y * H;
      if (t < zt) { const k = ease(t / zt); drawBug(ctx, lerp(sx, cx, k), lerp(sy, tubeMidY, k), Math.max(10, H * 0.02), t); }
      else if (t < zt + 0.3) drawZap(ctx, cx, tubeMidY, 1 - (t - zt) / 0.3);
    }

    // ---- butterfly flies in (spared), then morphs up into the logo ----
    if (t >= tFly) {
      const u = ease((t - tFly) / Math.max(0.01, tMorph - tFly));
      const bx = lerp(-W * 0.15, cx, u);
      const flyY = lerp(tubeMidY, cy - H * 0.12, u);
      let size = Math.max(20, H * 0.05), bxx = bx, byy = flyY, ang = Math.sin(t * 2) * 0.12;
      if (t >= tMorph) {
        const m = ease((t - tMorph) / Math.max(0.01, tLogo - tMorph));
        size = lerp(Math.max(20, H * 0.05), H * 0.11, m); bxx = cx; byy = cy - H * 0.12; ang = 0;
      }
      drawButterfly(ctx, bxx, byy, size, t * 14, ang);
    }

    // ---- logo wordmark + PODCAST + host ----
    if (t >= tLogo) {
      const a = ease((t - tLogo) / P(0.06));
      ctx.save(); ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, a);
      ctx.shadowColor = 'rgba(0,255,238,0.5)'; ctx.shadowBlur = 22;
      ctx.fillStyle = '#eaf6ff'; ctx.font = '800 ' + Math.round(H * 0.085) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText(series, cx, cy + H * 0.06);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#c9a24b'; ctx.font = '600 ' + Math.round(H * 0.032) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText('P O D C A S T', cx, cy + H * 0.125);
      ctx.fillStyle = '#8fb9d6'; ctx.font = '500 ' + Math.round(H * 0.030) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText('your host ' + host, cx, cy + H * 0.180);
      ctx.restore();
    }
  };

  // Animated outro, drawn onto the recorded canvas at the end of a take.
  // Sequence: a "coming up next" card over the live frame; fade to black; the butterfly
  // flies a calm loop around an idle bug zapper; it settles and resolves into the
  // ButterflyFx logo. cfg = { title/series, host, next (next episode topic) }.
  global.drawOutro = function (ctx, t, dur, cfg) {
    cfg = cfg || {};
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const series = cfg.title || cfg.series || 'ButterflyFx';
    const next = (cfg.next || cfg.topic || '').trim();
    const cx = W * 0.5, cy = H * 0.5, zTop = H * 0.18, zBot = H * 0.64, midY = (zTop + zBot) / 2;
    const P = (f) => f * dur;
    const tToBlack = P(0.40), tBlack = P(0.50), tOrbit = P(0.53), tSettle = P(0.82), tLogo = P(0.86);

    // ---- the "coming up next" card over the live frame, then deepen to black ----
    if (t < tBlack) {
      let alpha, textA;
      if (t < tToBlack) { alpha = 0.92 * ease(Math.min(1, t / Math.max(0.01, P(0.10)))); textA = ease(Math.min(1, t / Math.max(0.01, P(0.10)))); }
      else { const k = ease((t - tToBlack) / Math.max(0.01, tBlack - tToBlack)); alpha = lerp(0.92, 1, k); textA = lerp(1, 0, k); }
      ctx.fillStyle = 'rgba(5,6,12,' + alpha.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = textA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7cf3ff'; ctx.font = '600 ' + Math.round(H * 0.030) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText('BEFORE YOU GO', cx, H * 0.15);
      ctx.shadowColor = 'rgba(0,255,238,0.4)'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#eaf6ff'; ctx.font = '800 ' + Math.round(H * 0.070) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText('Subscribe', cx, H * 0.27); ctx.shadowBlur = 0;
      ctx.fillStyle = '#c9a24b'; ctx.font = '600 ' + Math.round(H * 0.028) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText('a new video every day', cx, H * 0.345);
      if (cfg.recap) { ctx.fillStyle = '#9aa6bd'; ctx.font = '500 ' + Math.round(H * 0.024) + 'px Segoe UI, Arial, sans-serif'; ctx.fillText('Today: ' + String(cfg.recap).slice(0, 92), cx, H * 0.41); }
      const colA = W * 0.28, colB = W * 0.72, top = H * 0.47, lh = H * 0.058;
      ctx.fillStyle = '#6ee7a8'; ctx.font = '700 ' + Math.round(H * 0.025) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText('PREVIOUSLY', colA, top); ctx.fillText('STAY TUNED FOR', colB, top);
      ctx.fillStyle = '#cdd5e1'; ctx.font = '500 ' + Math.round(H * 0.026) + 'px Segoe UI, Arial, sans-serif';
      (cfg.prev || []).slice(0, 4).forEach((s, i) => ctx.fillText('• ' + s, colA, top + lh * (i + 1)));
      const up = (cfg.upcoming && cfg.upcoming.length) ? cfg.upcoming : (next ? [next] : []);
      up.slice(0, 4).forEach((s, i) => ctx.fillText('• ' + s, colB, top + lh * (i + 1)));
      ctx.fillStyle = '#c9a24b'; ctx.font = '700 ' + Math.round(H * 0.027) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText('Thanks for watching. Share it with a friend.', cx, H * 0.86);
      ctx.restore();
      return;
    }

    // ---- black stage with an idle zapper; butterfly loops it, then settles ----
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t < tLogo) drawZapper(ctx, cx, zTop, zBot, 0.22 + 0.05 * Math.sin(t * 6), t);

    let bx, by, size, ang;
    const orbit = (tt) => { const th = (tt - tOrbit) * 2.0; return { x: cx + Math.cos(th) * W * 0.16, y: midY + Math.sin(th) * H * 0.18, a: Math.sin(th) * 0.25, th }; };
    if (t < tSettle) {
      const o = orbit(t); bx = o.x; by = o.y; ang = o.a; size = Math.max(20, H * 0.05);
    } else {
      const o = orbit(tSettle), m = ease((t - tSettle) / Math.max(0.01, tLogo - tSettle));
      bx = lerp(o.x, cx, m); by = lerp(o.y, cy - H * 0.12, m); ang = lerp(o.a, 0, m);
      size = lerp(Math.max(20, H * 0.05), H * 0.11, m);
    }
    drawButterfly(ctx, bx, by, size, t * 16, ang);

    // ---- logo resolves ----
    if (t >= tLogo) {
      const a = ease((t - tLogo) / Math.max(0.01, dur - tLogo));
      ctx.save(); ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, a);
      ctx.shadowColor = 'rgba(0,255,238,0.5)'; ctx.shadowBlur = 22;
      ctx.fillStyle = '#eaf6ff'; ctx.font = '800 ' + Math.round(H * 0.085) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText(series, cx, cy + H * 0.06);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#c9a24b'; ctx.font = '600 ' + Math.round(H * 0.032) + 'px Segoe UI, Arial, sans-serif';
      ctx.fillText('P O D C A S T', cx, cy + H * 0.125);
      ctx.restore();
    }
  };
  // expose the butterfly so the section transitions (and other overlays) can reuse the brand motif
  global.drawButterflyAt = function (ctx, x, y, s, flap, angle) { drawButterfly(ctx, x, y, s, flap, angle); };
})(window);
