// rig.js
// One job: move the character smoothly toward the director's target pose, so nothing snaps.
// Every number eases at its own speed: the mouth is quick, the head is slow, the hands are in between.
// It also adds the things that never stop: breathing, and a gentle sway while talking.

// Where the hands go for each gesture, in stage pixels (the stage is 1920 x 1080, the character at its center),
// and which way the hand is shaped.
export const HAND_POSES = {
  rest:    { L: { x: 770, y: 905, shape: 'flat' },  R: { x: 1150, y: 905, shape: 'flat' } },
  open:    { L: { x: 770, y: 905, shape: 'flat' },  R: { x: 1190, y: 705, shape: 'open' } },
  explain: { L: { x: 715, y: 735, shape: 'open' },  R: { x: 1205, y: 735, shape: 'open' } },
  point:   { L: { x: 770, y: 905, shape: 'flat' },  R: { x: 1120, y: 690, shape: 'point' } },
  shrug:   { L: { x: 680, y: 770, shape: 'open' },  R: { x: 1240, y: 770, shape: 'open' } },
};

const SPEEDS = { open: 30, wide: 26, round: 26, smile: 6, blink: 45, gazeX: 16, gazeY: 16, brow: 7, furrow: 6,
  headTilt: 4, headTurn: 3, headNod: 12, talking: 5, shoulders: 7 };
const HAND_SPEED = 7;

export function createRig() {
  const pose = { open: 0, wide: 0.5, round: 0, smile: 0.3, blink: 0, gazeX: 0, gazeY: 0, brow: 0, furrow: 0,
    headTilt: 0, headTurn: 0, headNod: 0, talking: 0, shoulders: 0, breath: 0, sway: 0,
    hands: { L: { ...HAND_POSES.rest.L }, R: { ...HAND_POSES.rest.R } } };

  // Moves pose toward target over dt seconds; t is the current time in seconds (for breathing and sway).
  function update(target, dt, t) {
    for (const [key, speed] of Object.entries(SPEEDS)) {
      const k = 1 - Math.exp(-speed * dt);
      pose[key] += (target[key] - pose[key]) * k;
    }
    const goal = HAND_POSES[target.gesture] || HAND_POSES.rest, k = 1 - Math.exp(-HAND_SPEED * dt);
    for (const side of ['L', 'R']) {
      const hand = pose.hands[side], aim = goal[side];
      hand.x += (aim.x - hand.x) * k; hand.y += (aim.y - hand.y) * k;
      // The hand changes shape once it is most of the way there.
      if (Math.hypot(aim.x - hand.x, aim.y - hand.y) < 60) hand.shape = aim.shape;
    }
    pose.breath = Math.sin(t * 2 * Math.PI / 4.2);
    pose.sway = Math.sin(t * 1.7) * pose.talking;
    return pose;
  }
  return { pose, update };
}
