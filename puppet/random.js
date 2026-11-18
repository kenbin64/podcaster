// random.js
// One job: repeatable randomness. The same script and seed always give the same blinks, glances and gestures,
// so a render can be reproduced exactly and checked.

export function seededRandom(seed) {
  let state = seed >>> 0 || 1;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;     // a classic linear congruential generator
    return state / 4294967296;
  };
}
