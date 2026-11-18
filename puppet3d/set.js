// set.js
// One job: build the studio around the cast: lights, a back wall with neon waves and a sign, a standing desk
// with a microphone at each person's place. Returns the desk height so the cast and the bowl can sit at it.
import * as THREE from 'three';

export const DESK_Y = 1.05;

function sign(text) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 200;
  const g = c.getContext('2d');
  g.font = '700 92px system-ui, Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#ff4fd8'; g.shadowBlur = 30; g.fillStyle = '#ffd6f6'; g.fillText(text, 512, 104);
  g.shadowBlur = 12; g.fillText(text, 512, 104);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function neonWave(color, x0, y0, width, height, cycles, phase) {
  const pts = [];
  for (let i = 0; i <= 120; i++) { const u = i / 120, env = Math.sin(u * Math.PI) ** 0.6; pts.push(new THREE.Vector3(x0 + u * width, y0 + Math.sin(u * cycles * Math.PI * 2 + phase) * height * env, 0)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.018, 8), new THREE.MeshBasicMaterial({ color }));
}

// seats: [{x, z}] where the people stand (a microphone goes in front of each).
export function buildSet(scene, seats) {
  scene.background = new THREE.Color('#120f1c');
  scene.add(new THREE.HemisphereLight('#c9c6ff', '#2a1d2e', 1.3));
  const key = new THREE.DirectionalLight('#fff2e0', 2.4); key.position.set(1.5, 3, 4); scene.add(key);
  const rimL = new THREE.PointLight('#47e0ff', 6, 6); rimL.position.set(-3, 2.4, -0.8); scene.add(rimL);
  const rimR = new THREE.PointLight('#ff4fd8', 6, 6); rimR.position.set(3, 2.4, -0.8); scene.add(rimR);

  // Back wall and floor.
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshStandardMaterial({ color: '#241c38', roughness: 0.95 }));
  wall.position.set(0, 2.5, -1.6); scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ color: '#17131f', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  for (let i = 0; i < 10; i++) {   // acoustic panels
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.06), new THREE.MeshStandardMaterial({ color: i % 2 ? '#2b2240' : '#30264a', roughness: 1 }));
    p.position.set(-4.3 + (i % 5) * 0.68 + (i < 5 ? 0 : 0.34), 1.6 + Math.floor(i / 5) * 0.68, -1.55); scene.add(p);
    const q = p.clone(); q.position.x = -p.position.x; scene.add(q);
  }
  const waves = new THREE.Group();
  waves.add(neonWave('#47e0ff', -3.8, 2.9, 2.2, 0.32, 5, 0.3), neonWave('#ff4fd8', 1.6, 2.95, 2.2, 0.3, 4.5, 1.7), neonWave('#ffb13d', 2.0, 2.45, 1.4, 0.18, 3, 2.4));
  waves.position.z = -1.5; scene.add(waves);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshBasicMaterial({ map: sign('LIVE FROM THE FISHBOWL'), transparent: true }));
  board.position.set(0, 2.75, -1.5); scene.add(board);

  // The desk: a long standing desk with a lit edge.
  const desk = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.06, 0.7), new THREE.MeshStandardMaterial({ color: '#5a3c28', roughness: 0.6 }));
  desk.position.set(0, DESK_Y, 0.42); scene.add(desk);
  const front = new THREE.Mesh(new THREE.BoxGeometry(4.8, DESK_Y, 0.04), new THREE.MeshStandardMaterial({ color: '#2b2030', roughness: 0.8 }));
  front.position.set(0, DESK_Y / 2, 0.76); scene.add(front);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: '#2dd4bf' }));
  strip.position.set(0, DESK_Y - 0.12, 0.785); scene.add(strip);

  // A desk microphone in front of each person, a little to one side so it does not hide the mouth.
  const metal = new THREE.MeshStandardMaterial({ color: '#c9ced6', metalness: 0.8, roughness: 0.3 }), black = new THREE.MeshStandardMaterial({ color: '#16181d', roughness: 0.6 });
  for (const s of seats) {
    if (s.noMic) continue;
    const mic = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 24), black);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 12), black); pole.position.y = 0.14;
    const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 6, 16), metal); head.position.set(0, 0.3, 0.01); head.rotation.x = 0.35;
    mic.add(base, pole, head); mic.position.set(s.x + 0.18, DESK_Y + 0.03, 0.42); scene.add(mic);
  }
}
