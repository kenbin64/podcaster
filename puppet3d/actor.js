// actor.js
// One job: turn a rigged game model (Chomp's people: 20 bones, animations Chat, Idle, Point, Nervous, Cheer, Wave...)
// into a podcast actor that the director can drive.
//
// Rules learned by testing these models (see docs in README.md):
//   - bending the Head bone tears the face mesh; turning the Neck bone does not. So the head moves only at the neck,
//     and every animation has its Head and Neck tracks removed (the arms, spine and legs still play).
//   - the models have no jaw or face shapes, so a small mouth is drawn on the face and opened with the speech.
import * as THREE from 'three';

const TEAR_TRACKS = /^(Head|Neck|headfront)\./;
const FADE = 0.4;

// Finds where a ray straight back (-z in world) first hits the model, at height y and across x. Returns z or null.
function frontZ(root, x, y) {
  const ray = new THREE.Raycaster(new THREE.Vector3(x, y, 5), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(root, true).find((h) => h.object.isMesh);
  return hit ? hit.point.z : null;
}

// gltf: the loaded model.  spot: { x, z, yaw, height }.  Returns the actor.
export function makeActor(gltf, spot) {
  const root = gltf.scene, bones = {};
  root.traverse((o) => { if (o.isBone) bones[o.name] = o; if (o.isMesh) { o.frustumCulled = false; } });

  // Size and place it: feet on the floor at (x, z), turned by yaw, standing `height` metres tall.
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root), s = spot.height / (box.max.y - box.min.y);
  root.scale.setScalar(s); root.position.set(spot.x, -box.min.y * s, spot.z);
  root.updateMatrixWorld(true);

  // Find the face, still facing straight on (yaw is applied after): the nose is the front-most point of the
  // head; the mouth sits a little under it.
  const head = bones.Head.getWorldPosition(new THREE.Vector3()), top = new THREE.Box3().setFromObject(root).max.y;
  let nose = { y: head.y, z: -Infinity };
  for (let y = head.y; y < top; y += 0.004) { const z = frontZ(root, head.x, y); if (z != null && z > nose.z) nose = { y, z }; }
  const unit = spot.height / 1.75;
  const mouthY = nose.y - 0.034 * unit, mouthZ = frontZ(root, head.x, mouthY) ?? nose.z - 0.01;
  const face = { x: head.x, noseY: nose.y, noseZ: nose.z, mouthY, mouthZ, eyeY: nose.y + 0.03 * unit, unit, top };

  // The mouth: a dark opening with a strip of top teeth, hidden while the lips are closed.
  const mouth = new THREE.Group();
  const hole = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: '#2a0c10', polygonOffset: true, polygonOffsetFactor: -4 }));
  const teeth = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.35), new THREE.MeshBasicMaterial({ color: '#f1eee6', polygonOffset: true, polygonOffsetFactor: -5 }));
  teeth.position.set(0, 0.62, 0.0005);
  const shape = new THREE.Group(); shape.add(hole, teeth); mouth.add(shape);   // shape is scaled; mouth only placed
  mouth.position.set(face.x, mouthY, mouthZ + 0.003 * unit);
  bones.Head.attach(mouth);
  const mouthBase = 0.021 * unit;

  if (spot.dress) spot.dress({ root, bones, face, frontZ: (x, y) => frontZ(root, x, y) });   // costume, fitted facing straight on
  root.rotation.y = spot.yaw || 0; root.updateMatrixWorld(true);

  // The animations, with the face-tearing tracks taken out.
  const mixer = new THREE.AnimationMixer(root), actions = {};
  for (const clip of gltf.animations) {
    const safe = clip.clone(); safe.tracks = safe.tracks.filter((t) => !TEAR_TRACKS.test(t.name));
    actions[clip.name] = mixer.clipAction(safe);
  }
  let current = null;
  function playState(name) {
    const next = actions[name] || actions.Idle;
    if (!next || next === current) return;
    next.reset().setEffectiveWeight(1).fadeIn(FADE).play();
    if (current) current.fadeOut(FADE);
    current = next;
  }
  playState('Idle');
  mixer.update(spot.phase || 0);

  // Neck turns are given in world terms (turn toward +x, nod down, tilt) and converted to the bone's own frame.
  const neck = bones.Neck, neckRest = neck.quaternion.clone();
  const neckWorld = neck.getWorldQuaternion(new THREE.Quaternion()), neckWorldInv = neckWorld.clone().invert();
  const euler = new THREE.Euler(), dq = new THREE.Quaternion();

  // Which animation fits the moment: a shrug is Nervous, a point is Point, talking is Chat, otherwise Idle.
  const stateFor = (pose) => (pose.gesture === 'shrug' ? 'Nervous' : pose.gesture === 'point' ? 'Point' : pose.talking > 0.5 || pose.gesture !== 'rest' ? 'Chat' : 'Idle');

  // pose: the eased pose from rig.js.  dt: seconds since the last frame.
  function update(pose, dt) {
    playState(stateFor(pose));
    mixer.update(dt);
    euler.set(pose.headNod * 0.012 + pose.headTilt * 0.0, pose.headTurn * 0.55, -pose.headTilt * 0.7, 'YXZ');
    dq.setFromEuler(euler);
    neck.quaternion.copy(neckRest).multiply(neckWorldInv.clone().multiply(dq).multiply(neckWorld));
    const open = pose.open;
    mouth.visible = open > 0.07;
    const w = mouthBase * (0.75 + 0.45 * pose.wide) * (1 - 0.35 * pose.round), h = mouthBase * (0.15 + 0.85 * open);
    shape.scale.set(w, h, 1); teeth.visible = open > 0.2;
  }

  return { root, bones, face, update, s };
}
