// character.js
// One job: draw a character in a given pose, from shapes alone (no image files). The stage is 1920 x 1080 and
// the character sits at its center, behind a desk. It is drawn in two passes so the desk can sit between them:
//   drawBody  - torso, shoulders, neck, headphones and head (face, eyes, brows, glasses, mouth, hair)
//   drawHands - forearms and hands, which rest on the desk or rise in front of it to gesture
// A "look" sets the colors and the optional features, so one drawing makes many characters.

// Look options: hairStyle 'swept' | 'short' | 'long' | 'bald'; top 'hoodie' | 'tee' | 'shirt'; beard = a color or false.
export const HOST_LOOK = {
  skin: '#e8b48f', skinShade: '#c98f6c', lips: '#b5645a', hair: '#cfd2d6', hairShade: '#9aa0a8', brows: '#8c8f95',
  iris: '#5b3a22', shirt: '#22262d', shirtLight: '#30353e', frames: '#1a1a1a', stubble: 'rgba(90,80,72,0.22)',
  glasses: true, headphones: true, stubbleOn: true, hairStyle: 'swept', top: 'hoodie', beard: false,
};

// Starting looks to pick from in a script's {cast} line. The guests are placeholders until the real people are described.
export const LOOKS = {
  host: HOST_LOOK,
  guest: { ...HOST_LOOK, skin: '#e2a982', skinShade: '#c0876a', hair: '#6b4a32', hairShade: '#4f3524', brows: '#4f3524',
    iris: '#3f5f7a', shirt: '#6e2a2a', shirtLight: '#8c3636', collar: '#4d1d1d', glasses: false, stubbleOn: false,
    hairStyle: 'short', top: 'shirt', beard: '#5a3e2b' },
  friend: { ...HOST_LOOK, skin: '#c68a64', skinShade: '#a56f4f', lips: '#8e4f45', hair: '#2a211c', hairShade: '#14100d',
    brows: '#2a211c', iris: '#2b1d14', shirt: '#24506e', shirtLight: '#2f6488', headphones: true, stubbleOn: true,
    stubble: 'rgba(40,30,25,0.3)', hairStyle: 'bald', top: 'tee' },
  cohost: { ...HOST_LOOK, skin: '#f0c3a0', skinShade: '#d39f7e', lips: '#c0605f', hair: '#6a4130', hairShade: '#4a2c20',
    brows: '#5a3726', iris: '#3c6b4f', shirt: '#1f6f6a', shirtLight: '#2a8a84', glasses: false, stubbleOn: false,
    hairStyle: 'long', top: 'tee' },
};

const CX = 960, HEAD_Y = 392, SHOULDER_Y = 640;
export const DESK_Y = 870;

// Moves and sizes a character: spot.x is where its center goes on the stage, spot.s its size (1 = full size).
// It scales around the desk edge, so every character stays seated at the same desk.
export function place(ctx, spot) {
  ctx.translate(spot.x, DESK_Y); ctx.scale(spot.s, spot.s); ctx.translate(-CX, -DESK_Y);
}

function ellipse(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

function drawTorso(ctx, pose, look) {
  const up = pose.shoulders, sy = SHOULDER_Y - up - pose.breath * 2.5;
  const g = ctx.createLinearGradient(0, sy, 0, 1080); g.addColorStop(0, look.shirtLight); g.addColorStop(1, look.shirt);
  ctx.beginPath();
  ctx.moveTo(CX - 72, 585);
  ctx.bezierCurveTo(CX - 150, sy - 18, CX - 250, sy - 12, CX - 292, sy + 55);
  ctx.bezierCurveTo(CX - 318, sy + 140, CX - 318, 1000, CX - 322, 1090);
  ctx.lineTo(CX + 322, 1090);
  ctx.bezierCurveTo(CX + 318, 1000, CX + 318, sy + 140, CX + 292, sy + 55);
  ctx.bezierCurveTo(CX + 250, sy - 12, CX + 150, sy - 18, CX + 72, 585);
  ctx.quadraticCurveTo(CX, 640, CX - 72, 585);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineCap = 'round';
  if (look.top === 'shirt') {          // collar points and buttons
    ctx.fillStyle = look.collar || look.shirtLight;
    ctx.beginPath(); ctx.moveTo(CX - 78, 588); ctx.lineTo(CX - 6, 668); ctx.lineTo(CX - 104, 648); ctx.closePath();
    ctx.moveTo(CX + 78, 588); ctx.lineTo(CX + 6, 668); ctx.lineTo(CX + 104, 648); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (const y of [700, 760, 820]) { ctx.beginPath(); ctx.arc(CX, y - up * 0.3, 6, 0, Math.PI * 2); ctx.fill(); }
  } else if (look.top === 'tee') {     // a plain round neckline
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(CX - 70, 590); ctx.quadraticCurveTo(CX, 655, CX + 70, 590); ctx.stroke();
  } else {                             // hoodie: hood collar and drawstrings
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(CX - 95, 595); ctx.quadraticCurveTo(CX, 680, CX + 95, 595); ctx.stroke();
    ctx.strokeStyle = '#d8dde4'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(CX - 34, 650); ctx.lineTo(CX - 40, 760 - up * 0.3); ctx.moveTo(CX + 34, 650); ctx.lineTo(CX + 42, 755 - up * 0.3); ctx.stroke();
  }
  // Sleeve seams down each side, so the upper arms read against the body.
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(CX - 280, sy + 70); ctx.quadraticCurveTo(CX - 250, sy + 160, CX - 255, 860);
  ctx.moveTo(CX + 280, sy + 70); ctx.quadraticCurveTo(CX + 250, sy + 160, CX + 255, 860); ctx.stroke();
}

function drawNeck(ctx, pose, look) {
  ctx.fillStyle = look.skinShade; ctx.beginPath(); ctx.roundRect(CX - 50, 470 + pose.headNod * 0.5, 100, 150, 30); ctx.fill();
  if (look.headphones) {
    ctx.strokeStyle = '#15171b'; ctx.lineWidth = 18; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(CX, 548, 92, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    for (const s of [-1, 1]) { ctx.fillStyle = '#1d2026'; ctx.beginPath(); ctx.ellipse(CX + s * 92, 596, 34, 42, s * 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2c313a'; ctx.beginPath(); ctx.ellipse(CX + s * 92, 596, 20, 27, s * 0.25, 0, Math.PI * 2); ctx.fill(); }
  }
}

function drawEye(ctx, x, y, pose, look) {
  const open = 1 - pose.blink * 0.94;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y, 25, 17 * open + 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#fbfbf8'; ctx.fill(); ctx.clip();
  const ix = x + pose.gazeX * 9, iy = y + pose.gazeY * 5;
  ellipse(ctx, ix, iy, 11.5, 11.5, look.iris);
  ellipse(ctx, ix, iy, 5.5, 5.5, '#111');
  ellipse(ctx, ix + 3.5, iy - 3.5, 2.8, 2.8, 'rgba(255,255,255,0.9)');
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,25,20,0.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x, y, 25, 17 * open + 0.5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
}

function drawBrow(ctx, x, side, pose, look) {
  const y = -50 - pose.brow * 14 + pose.furrow * 5, inner = pose.furrow * 9;
  ctx.strokeStyle = look.brows; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - side * 26, y + 4); ctx.quadraticCurveTo(x, y - 6, x + side * 22, y + inner); ctx.stroke();
}

function drawMouth(ctx, x, y, pose, look) {
  const w = 74 * (0.55 + 0.45 * pose.wide) * (1 - 0.45 * pose.round), h = 4 + 52 * pose.open, corner = -pose.smile * 11;
  ctx.lineJoin = 'round';
  if (pose.open < 0.07) {
    ctx.strokeStyle = look.lips; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 2, y + corner); ctx.quadraticCurveTo(x, y + 4 + pose.smile * 9, x + w / 2, y + corner); ctx.stroke();
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + corner);
  ctx.quadraticCurveTo(x, y - h * 0.32 - 2, x + w / 2, y + corner);
  ctx.quadraticCurveTo(x, y + h + 4, x - w / 2, y + corner);
  ctx.closePath();
  ctx.fillStyle = '#3b1418'; ctx.fill();
  ctx.clip();
  if (pose.open > 0.18) { ctx.fillStyle = '#f4f1ea'; ctx.fillRect(x - w / 2, y - h * 0.32 - 4, w, 12); }   // top teeth
  ellipse(ctx, x, y + h * 0.75, w * 0.32, h * 0.32, '#c25560');                                           // tongue
  ctx.restore();
  ctx.strokeStyle = look.lips; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + corner); ctx.quadraticCurveTo(x, y - h * 0.32 - 2, x + w / 2, y + corner);
  ctx.quadraticCurveTo(x, y + h + 4, x - w / 2, y + corner); ctx.closePath(); ctx.stroke();
}

// Long hair falls behind the head and shoulders, so it is drawn before the face.
function drawBackHair(ctx, look) {
  if (look.hairStyle !== 'long') return;
  ctx.fillStyle = look.hair;
  ctx.beginPath(); ctx.moveTo(-132, -60);
  ctx.bezierCurveTo(-175, -215, 175, -215, 132, -60);
  ctx.bezierCurveTo(150, 60, 168, 170, 128, 235);
  ctx.lineTo(-128, 235);
  ctx.bezierCurveTo(-168, 170, -150, 60, -132, -60);
  ctx.fill();
}

function drawHair(ctx, look) {
  const style = look.hairStyle || 'swept';
  ctx.fillStyle = look.hair;
  if (style === 'bald') {               // just the sides above the ears, and a shine on top
    ctx.beginPath(); ctx.ellipse(-114, -30, 12, 34, 0.1, 0, Math.PI * 2); ctx.ellipse(114, -30, 12, 34, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-30, -95, 38, 14, -0.2, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (style === 'short') {              // a close crop that follows the skull
    ctx.beginPath(); ctx.moveTo(-121, -36);
    ctx.bezierCurveTo(-132, -150, -50, -186, 10, -183);
    ctx.bezierCurveTo(92, -182, 136, -140, 121, -36);
    ctx.bezierCurveTo(106, -92, 62, -116, 0, -116);
    ctx.bezierCurveTo(-62, -116, -106, -92, -121, -36);
    ctx.fill();
    ctx.beginPath(); ctx.ellipse(-116, -36, 12, 36, 0.1, 0, Math.PI * 2); ctx.ellipse(116, -36, 12, 36, -0.1, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (style === 'long') {               // side curtains over the ears, in front of the face edge
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 128, -70); ctx.quadraticCurveTo(s * 140, 60, s * 124, 170); ctx.lineTo(s * 100, 150); ctx.quadraticCurveTo(s * 112, 40, s * 104, -60); ctx.fill(); }
  }
  ctx.beginPath();
  ctx.moveTo(-122, -30);
  ctx.bezierCurveTo(-140, -150, -60, -205, 20, -200);
  ctx.bezierCurveTo(110, -198, 150, -140, 122, -40);
  ctx.bezierCurveTo(110, -78, 70, -100, 10, -102);
  ctx.bezierCurveTo(-55, -100, -100, -82, -122, -30);
  ctx.fill();
  ctx.strokeStyle = look.hairShade; ctx.lineWidth = 4;
  for (const [a, b, c] of [[-80, -150, -10], [-30, -175, 40], [20, -180, 90]]) { ctx.beginPath(); ctx.moveTo(a, b + 40); ctx.quadraticCurveTo(a + 30, b, c, b + 8); ctx.stroke(); }
  ctx.fillStyle = look.hair;   // short sides above the ears
  ctx.beginPath(); ctx.ellipse(-116, -40, 16, 42, 0.1, 0, Math.PI * 2); ctx.ellipse(116, -40, 16, 42, -0.1, 0, Math.PI * 2); ctx.fill();
}

function drawHead(ctx, pose, look) {
  const fx = pose.headTurn * 14;
  ctx.save();
  ctx.translate(CX + pose.headTurn * 6, HEAD_Y + pose.headNod - pose.breath * 1.5);
  ctx.rotate(pose.headTilt + pose.sway * 0.015);
  drawBackHair(ctx, look);
  ellipse(ctx, -120 - pose.headTurn * 8, 12, 22, 34, look.skinShade);
  ellipse(ctx, 120 - pose.headTurn * 8, 12, 22, 34, look.skinShade);
  const g = ctx.createRadialGradient(-30, -40, 30, 0, 0, 160); g.addColorStop(0, look.skin); g.addColorStop(1, look.skinShade);
  ctx.beginPath(); ctx.moveTo(-118, -20);
  ctx.bezierCurveTo(-122, -150, 122, -150, 118, -20);
  ctx.bezierCurveTo(116, 70, 70, 150, 0, 152);
  ctx.bezierCurveTo(-70, 150, -116, 70, -118, -20);
  ctx.fillStyle = g; ctx.fill();
  if (look.stubbleOn) { ctx.save(); ctx.clip(); ctx.fillStyle = look.stubble; ctx.beginPath(); ctx.ellipse(fx * 0.5, 105, 112, 70, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  if (look.beard) {                     // a full beard along the jaw, with a moustache; the mouth is drawn on top of it
    ctx.fillStyle = look.beard; ctx.beginPath(); ctx.moveTo(-117, 0);
    ctx.bezierCurveTo(-114, 120, -62, 182, fx * 0.5, 184);
    ctx.bezierCurveTo(62, 182, 114, 120, 117, 0);
    ctx.bezierCurveTo(104, 52, 66, 58, fx * 1.1, 56);
    ctx.bezierCurveTo(-66, 58, -104, 52, -117, 0);
    ctx.fill();
  }
  if (pose.smile > 0.3) { ctx.globalAlpha = (pose.smile - 0.3) * 0.35; ellipse(ctx, -68 + fx, 45, 22, 13, '#e0796b'); ellipse(ctx, 68 + fx, 45, 22, 13, '#e0796b'); ctx.globalAlpha = 1; }
  drawEye(ctx, -50 + fx, -12, pose, look);
  drawEye(ctx, 50 + fx, -12, pose, look);
  drawBrow(ctx, -50 + fx, -1, pose, look);
  drawBrow(ctx, 50 + fx, 1, pose, look);
  ctx.strokeStyle = look.skinShade; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(fx * 1.2 + 2, 0); ctx.quadraticCurveTo(fx * 1.3 + 14, 34, fx * 1.2 - 6, 40); ctx.stroke();
  drawMouth(ctx, fx * 1.1, 82, pose, look);
  if (look.glasses) {
    ctx.strokeStyle = look.frames; ctx.lineWidth = 6;
    for (const x of [-50, 50]) { ctx.beginPath(); ctx.roundRect(x + fx - 38, -40, 76, 56, 16); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(fx - 12, -16); ctx.quadraticCurveTo(fx, -22, fx + 12, -16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-88 + fx, -22); ctx.lineTo(-118 - pose.headTurn * 8, -14); ctx.moveTo(88 + fx, -22); ctx.lineTo(118 - pose.headTurn * 8, -14); ctx.stroke();
  }
  drawHair(ctx, look);
  ctx.restore();
}

export function drawBody(ctx, pose, look = HOST_LOOK) {
  ctx.save();
  ctx.translate(CX, 1000); ctx.rotate(pose.sway * 0.01); ctx.translate(-CX, -1000);
  drawTorso(ctx, pose, look);
  drawNeck(ctx, pose, look);
  drawHead(ctx, pose, look);
  ctx.restore();
}

function drawHand(ctx, hand, side, look) {
  ctx.save(); ctx.translate(hand.x, hand.y); ctx.scale(1.5, 1.5);
  ctx.fillStyle = look.skin; ctx.strokeStyle = look.skinShade; ctx.lineWidth = 3;
  if (hand.shape === 'flat') {                       // resting on the desk, palm down
    ctx.beginPath(); ctx.ellipse(0, 0, 40, 24, side * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-side * 30, -10, 13, 10, side * 0.6, 0, Math.PI * 2); ctx.fill();
  } else if (hand.shape === 'open') {                 // open palm toward the viewer, fingers up
    for (let i = 0; i < 4; i++) {
      const angle = side * (-0.32 + i * 0.2), len = [34, 40, 38, 30][i];
      ctx.save(); ctx.rotate(angle); ctx.beginPath(); ctx.roundRect(-7, -len - 20, 14, len, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.rotate(side * 1.0); ctx.beginPath(); ctx.roundRect(-7, -48, 15, 34, 7); ctx.fill(); ctx.stroke(); ctx.restore();   // thumb
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {                                           // pointing: a loose fist with the index finger out
    ctx.save(); ctx.rotate(-side * 0.5 - 0.35); ctx.beginPath(); ctx.roundRect(-8, -78, 16, 56, 8); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

export function drawHands(ctx, pose, look = HOST_LOOK) {
  for (const [side, key] of [[-1, 'L'], [1, 'R']]) {
    const hand = pose.hands[key], elbow = { x: CX + side * 300, y: 905 };
    const wrist = { x: hand.x + (elbow.x - hand.x) * 0.18, y: hand.y + (elbow.y - hand.y) * 0.18 };
    ctx.lineCap = 'round';
    ctx.strokeStyle = look.shirt; ctx.lineWidth = 76; ctx.beginPath(); ctx.moveTo(elbow.x, elbow.y); ctx.lineTo(wrist.x, wrist.y); ctx.stroke();
    ctx.strokeStyle = look.shirtLight; ctx.lineWidth = 64; ctx.beginPath(); ctx.moveTo(elbow.x, elbow.y); ctx.lineTo(wrist.x, wrist.y); ctx.stroke();
    ctx.strokeStyle = look.skinShade; ctx.lineWidth = 40; ctx.beginPath(); ctx.moveTo(wrist.x, wrist.y); ctx.lineTo(hand.x, hand.y); ctx.stroke();
    drawHand(ctx, hand, side, look);
  }
}
