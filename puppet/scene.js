// scene.js
// One job: draw the studio around the character, in layers, so the background can drift a little (parallax)
// while staying put. Far layers move least and near layers most, which reads as depth.
//   drawBack  - the wall, acoustic panels, neon waveform signs, the lamp and the shelves (behind the character)
//   drawDesk  - the desk, laptop and mixer (between the character's body and hands)
//   drawFront - the microphone on its boom arm (nearest to the viewer)
// "camera" is a small offset, in pixels, that the layers multiply by their depth.

export function cameraAt(t, pose) {
  return { x: Math.sin(t * 0.21) * 10 + pose.headTurn * 6, y: Math.sin(t * 0.13) * 4 };
}

function neon(ctx, points, colors, width) {
  const g = ctx.createLinearGradient(points[0][0], 0, points[points.length - 1][0], 0);
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = colors[1]; ctx.shadowBlur = 28;
  ctx.beginPath(); points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.shadowBlur = 0; ctx.globalAlpha = 0.6; ctx.lineWidth = width * 0.35; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
}

function wave(x0, y0, width, height, cycles, steps, phase) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, env = Math.sin(u * Math.PI) ** 0.6;
    pts.push([x0 + u * width, y0 + Math.sin(u * cycles * Math.PI * 2 + phase) * height * env * (0.4 + 0.6 * Math.abs(Math.sin(u * 7 + phase)))]);
  }
  return pts;
}

export function drawBack(ctx, cam, t) {
  const far = { x: cam.x * 0.25, y: cam.y * 0.25 }, mid = { x: cam.x * 0.5, y: cam.y * 0.5 };
  ctx.save(); ctx.translate(far.x, far.y);
  const wall = ctx.createLinearGradient(0, -40, 0, 1100); wall.addColorStop(0, '#2b1e44'); wall.addColorStop(0.6, '#1d1830'); wall.addColorStop(1, '#100f1c');
  ctx.fillStyle = wall; ctx.fillRect(-60, -60, 2040, 1200);
  for (const x0 of [-30, 1500]) for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {   // acoustic panels
    ctx.fillStyle = (r + c) % 2 ? '#1b1626' : '#221b30'; ctx.fillRect(x0 + c * 150, 60 + r * 150, 142, 142);
  }
  const glow = 0.85 + 0.15 * Math.sin(t * 1.3);
  ctx.globalAlpha = glow;
  neon(ctx, wave(40, 230, 520, 120, 5.5, 160, 0.3), ['#47e0ff', '#8a7bff', '#ff4fd8'], 9);
  neon(ctx, wave(1330, 170, 520, 110, 4.5, 140, 1.7), ['#ff4fd8', '#ff8a3d', '#ffd23d'], 9);
  neon(ctx, wave(1430, 380, 330, 70, 3, 90, 2.4), ['#ffb13d', '#ff8a3d', '#ffd23d'], 7);
  ctx.globalAlpha = 1; ctx.restore();

  ctx.save(); ctx.translate(mid.x, mid.y);
  const lamp = ctx.createRadialGradient(330, 620, 10, 330, 620, 260); lamp.addColorStop(0, 'rgba(255,190,110,0.55)'); lamp.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = lamp; ctx.fillRect(60, 360, 540, 540);
  ctx.fillStyle = '#f6c98a'; ctx.beginPath(); ctx.roundRect(292, 560, 76, 96, 14); ctx.fill();
  ctx.fillStyle = '#2a2230'; ctx.fillRect(1500, 640, 420, 18); ctx.fillRect(1500, 800, 420, 18);   // shelves
  const books = ['#3d6fb0', '#c4473c', '#d9a441', '#4e8f5a', '#7a4fa0', '#c76f3a', '#3a8f8f'];
  for (let i = 0; i < 9; i++) { ctx.fillStyle = books[i % books.length]; ctx.fillRect(1530 + i * 34, 560 + (i % 3) * 8, 26, 80 - (i % 3) * 8); }
  for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#5fd0b8', '#f08aa8', '#e8c85a', '#8fb2ff'][i]; ctx.beginPath(); ctx.arc(1560 + i * 95, 765, 22, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(1545 + i * 95, 765, 30, 35); }
  const shelfGlow = ctx.createLinearGradient(1500, 0, 1920, 0); shelfGlow.addColorStop(0, 'rgba(70,224,255,0)'); shelfGlow.addColorStop(1, 'rgba(70,224,255,0.25)');
  ctx.fillStyle = shelfGlow; ctx.fillRect(1500, 520, 420, 300);
  ctx.restore();
}

// props: false leaves off the laptop and mixer (a panel of several people needs the desk clear for their hands).
export function drawDesk(ctx, cam, props = true) {
  ctx.save(); ctx.translate(cam.x, cam.y * 1.0);
  const top = ctx.createLinearGradient(0, 860, 0, 1080); top.addColorStop(0, '#5a3c28'); top.addColorStop(1, '#2e1f16');
  ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(-80, 870); ctx.lineTo(2000, 870); ctx.lineTo(2000, 1100); ctx.lineTo(-80, 1100); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,180,0.25)'; ctx.fillRect(-80, 866, 2080, 6);
  if (!props) { ctx.restore(); return; }
  ctx.fillStyle = '#1b1d22'; ctx.beginPath(); ctx.moveTo(130, 1000); ctx.lineTo(470, 1000); ctx.lineTo(430, 880); ctx.lineTo(170, 880); ctx.fill();   // laptop
  ctx.fillStyle = '#0f2a3a'; ctx.fillRect(185, 892, 230, 92);
  ctx.strokeStyle = '#5fd8ff'; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const x = 195 + i * 5.3, y = 938 + Math.sin(i * 0.9) * 22 * Math.sin(i / 40 * Math.PI); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  ctx.fillStyle = '#16181d'; ctx.beginPath(); ctx.roundRect(1380, 930, 420, 90, 12); ctx.fill();   // mixer
  const pads = ['#ff4fd8', '#47e0ff', '#7cff8a', '#ffd23d'];
  for (let i = 0; i < 12; i++) { ctx.fillStyle = pads[i % 4]; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.roundRect(1405 + i * 31, 950, 22, 14, 3); ctx.fill(); }
  ctx.globalAlpha = 1; for (let i = 0; i < 6; i++) { ctx.fillStyle = '#3a3e47'; ctx.beginPath(); ctx.arc(1420 + i * 66, 994, 11, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

function drawMicHead(ctx, x, y, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  const body = ctx.createLinearGradient(-40, 0, 40, 0); body.addColorStop(0, '#6b7079'); body.addColorStop(0.5, '#d9dde3'); body.addColorStop(1, '#5b6068');
  ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(-40, -75, 80, 150, 40); ctx.fill();
  ctx.strokeStyle = 'rgba(40,44,52,0.6)'; ctx.lineWidth = 2;
  for (let yy = -60; yy <= 60; yy += 10) { ctx.beginPath(); ctx.moveTo(-36, yy); ctx.lineTo(36, yy); ctx.stroke(); }
  ctx.restore();
}

// With no seats: the single host's microphone on a boom arm from above.
// With seats (the same spots the characters are placed at): a desk-stand microphone beside each person's mouth.
export function drawFront(ctx, cam, seats = null, place = null) {
  ctx.save(); ctx.translate(cam.x * 1.15, cam.y * 1.15);
  ctx.strokeStyle = '#191b20'; ctx.lineCap = 'round';
  if (!seats) {
    ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(1560, 180); ctx.lineTo(1400, 380); ctx.lineTo(1225, 520); ctx.stroke();   // boom arm
    drawMicHead(ctx, 1205, 575, -0.35);
  } else {
    for (const spot of seats) {
      ctx.save(); place(ctx, spot);
      ctx.fillStyle = '#191b20'; ctx.beginPath(); ctx.ellipse(1235, 905, 70, 16, 0, 0, Math.PI * 2); ctx.fill();   // base
      ctx.lineWidth = 14; ctx.strokeStyle = '#191b20'; ctx.beginPath(); ctx.moveTo(1235, 900); ctx.lineTo(1225, 700); ctx.stroke();
      drawMicHead(ctx, 1215, 640, -0.25);
      ctx.restore();
    }
  }
  ctx.restore();
}
