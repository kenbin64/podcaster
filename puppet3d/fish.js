// fish.js
// One job: the Marlin, a black marlin far too big for his fishbowl. The model has no skeleton, so he is moved
// whole: a slow swim sway, a turn toward whoever is talking, a lift when he speaks, and a mouth under the bill.
// The bowl is glass and water; his bill sticks out of the top, which is the whole problem.
import * as THREE from 'three';

// gltf: black-marlin.glb (1.9 m, bill up, belly toward -z).  bowlAt: {x, y, z} of the desk spot under the bowl.
export function makeMarlin(gltf, bowlAt) {
  const R = 0.34, center = new THREE.Vector3(bowlAt.x, bowlAt.y + R * 0.92, bowlAt.z);
  const group = new THREE.Group();

  // The bowl: a glass sphere opened at the top, with water to three quarters, and a rim.
  const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32, 0, Math.PI * 2, 0.55, Math.PI - 0.55),
    new THREE.MeshPhysicalMaterial({ color: '#cfefff', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0, side: THREE.DoubleSide, depthWrite: false }));
  const water = new THREE.Mesh(new THREE.SphereGeometry(R * 0.97, 48, 32, 0, Math.PI * 2, 1.0, Math.PI - 1.0),
    new THREE.MeshStandardMaterial({ color: '#2f8fd0', transparent: true, opacity: 0.35, roughness: 0.2, depthWrite: false }));
  const surface = new THREE.Mesh(new THREE.CircleGeometry(R * 0.97 * Math.sin(1.0), 48), new THREE.MeshStandardMaterial({ color: '#7fd0ff', transparent: true, opacity: 0.35, depthWrite: false }));
  surface.rotation.x = -Math.PI / 2; surface.position.y = R * 0.97 * Math.cos(1.0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R * Math.sin(0.55), 0.012, 12, 48), new THREE.MeshPhysicalMaterial({ color: '#e8f8ff', transparent: true, opacity: 0.5 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = R * Math.cos(0.55);
  const gravel = new THREE.Mesh(new THREE.SphereGeometry(R * 0.9, 32, 12, 0, Math.PI * 2, Math.PI * 0.8, Math.PI * 0.2), new THREE.MeshStandardMaterial({ color: '#d9b86c', roughness: 1 }));
  for (const m of [gravel, water, surface, glass, rim]) { m.position.add(center); group.add(m); }
  glass.renderOrder = 3; water.renderOrder = 2; surface.renderOrder = 2;

  // The fish: turned to lie along -x (bill toward the others), side to the viewer, scaled to about 1 m (the bowl is 0.68).
  const fish = gltf.scene, holder = new THREE.Group(), body = new THREE.Group();
  fish.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(fish), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  fish.position.sub(mid);                                   // centre it on its own middle
  body.add(fish);
  body.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2, 'ZXY'));   // bill up -> bill toward -x, belly -> down
  body.scale.setScalar(1.0 / size.y);
  holder.add(body);
  holder.position.copy(center).add(new THREE.Vector3(0.05, 0.02, 0));
  holder.rotation.z = -0.55;                                // tilted, bill up and out of the top of the bowl
  group.add(holder);

  // The mouth: at the base of the bill, on the side facing the viewer.
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: '#1a0508' }));
  mouth.position.set(-0.26, -0.035, 0.05);                 // in the holder's frame (metres): forward, a little low, front face
  holder.add(mouth);

  function update(pose, t) {
    holder.rotation.y = pose.headTurn * 0.5 + Math.sin(t * 0.9) * 0.06;
    holder.rotation.z = -0.55 + Math.sin(t * 1.3) * 0.03 - pose.headNod * 0.006 - pose.talking * 0.05;
    holder.position.y = center.y + 0.02 + Math.sin(t * 1.1) * 0.01 + pose.talking * 0.015;
    mouth.visible = pose.open > 0.07;
    mouth.scale.set(0.028 * (0.8 + 0.3 * pose.wide), 0.004 + 0.022 * pose.open, 1);
  }

  return { root: group, holder, center, face: { x: center.x, noseY: center.y + 0.1, mouthY: center.y }, update };
}
