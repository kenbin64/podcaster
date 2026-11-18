// costume.js
// One job: dress an ordinary model as Captain Hand-Up: a red cape, a domino mask, and a chest emblem of an open
// hand reaching up (a hand up, never a handout). Each piece is fitted to the body by measuring it, then fixed to a
// bone so it moves with the character.
import * as THREE from 'three';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// The emblem: a gold disc with a red ring and a white open hand reaching up.
function emblemTexture() {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#c0262d'; g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f5c242'; g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.strokeStyle = '#7a1418'; g.lineWidth = 5;
    const palm = () => { g.beginPath(); g.roundRect(88, 120, 80, 78, 22); };
    palm(); g.fill(); g.stroke();
    [[92, 60, 70], [114, 44, 86], [136, 46, 84], [158, 62, 68]].forEach(([x, y, len]) => { g.beginPath(); g.roundRect(x - 2, y, 18, len, 9); g.fill(); g.stroke(); });
    g.save(); g.translate(92, 160); g.rotate(-0.9); g.beginPath(); g.roundRect(-9, -60, 18, 56, 9); g.fill(); g.stroke(); g.restore();
    palm(); g.fill();
  });
}

// The mask: a dark band with two eye holes (transparent), wrapped around the front of the head.
function maskTexture() {
  return canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = '#141a33'; g.beginPath(); g.roundRect(0, 18, w, h - 36, 40); g.fill();
    g.globalCompositeOperation = 'destination-out';
    // eyes about 0.34 rad either side of centre, on a band from -1.25 to +1.25 rad
    for (const u of [0.364, 0.636]) { g.beginPath(); g.ellipse(u * w, h / 2, 34, 26, 0, 0, Math.PI * 2); g.fill(); }
  });
}

export function dressHero({ root, bones, face, frontZ }) {
  const u = face.unit;
  // Cape: hangs from the shoulders down the back.
  const spine = bones.Spine2.getWorldPosition(new THREE.Vector3());
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.62 * u, 1.05 * u, 1, 8),
    new THREE.MeshStandardMaterial({ color: '#b3202a', roughness: 0.7, side: THREE.DoubleSide }));
  const pos = cape.geometry.attributes.position;   // flare the bottom a little wider than the top
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), k = 1 + (0.5 - (y / (1.05 * u) + 0.5)) * 0.45; pos.setX(i, pos.getX(i) * k); }
  cape.geometry.computeVertexNormals();
  cape.position.set(face.x, spine.y + 0.1 * u - 0.5 * u, spine.z - 0.15 * u); cape.rotation.x = 0.08;
  bones.Spine2.attach(cape);

  // Mask: a band around the eyes, as wide as the face, centred behind its front surface.
  const r = 0.095 * u, eyeZ = frontZ(face.x, face.eyeY) ?? face.noseZ - 0.02 * u;
  const mask = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05 * u, 40, 1, true, -1.25, 2.5),
    new THREE.MeshStandardMaterial({ map: maskTexture(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 }));
  mask.position.set(face.x, face.eyeY, eyeZ - r + 0.006 * u);
  bones.Head.attach(mask);

  // Emblem: on the chest, a little below the collar.
  const chestY = spine.y + 0.02 * u, chestZ = frontZ(face.x, chestY) ?? spine.z + 0.12 * u;
  const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.075 * u, 40),
    new THREE.MeshStandardMaterial({ map: emblemTexture(), roughness: 0.4, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -4 }));
  emblem.position.set(face.x, chestY, chestZ + 0.006 * u);
  bones.Spine2.attach(emblem);
}
