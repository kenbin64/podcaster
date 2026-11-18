// visemes.js
// One job: turn a written word into the mouth shapes (visemes) a speaker makes saying it.
// English spelling only approximates sound, so this reads letter groups ("th", "oo", "ee"...) and maps each to
// one of a small set of cartoon mouth shapes. For a cartoon that is enough to read as speech.

// Each mouth shape, as the numbers the character's mouth is drawn from:
//   open: how far the jaw drops (0..1), wide: how far the corners pull (0..1), round: how pursed the lips are (0..1)
export const MOUTHS = {
  rest: { open: 0.04, wide: 0.5, round: 0.0 },
  A:    { open: 0.95, wide: 0.6, round: 0.0 },   // a, ah
  E:    { open: 0.55, wide: 0.9, round: 0.0 },   // e, eh, ay
  I:    { open: 0.32, wide: 1.0, round: 0.0 },   // ee, i
  O:    { open: 0.75, wide: 0.3, round: 0.8 },   // o, aw
  U:    { open: 0.35, wide: 0.15, round: 1.0 },  // oo, w
  MBP:  { open: 0.0,  wide: 0.5, round: 0.1 },   // lips pressed together
  FV:   { open: 0.14, wide: 0.6, round: 0.0 },   // lower lip under the teeth
  L:    { open: 0.45, wide: 0.6, round: 0.0 },   // l, t, d, n: tongue up, mouth part open
  S:    { open: 0.2,  wide: 0.8, round: 0.0 },   // s, z, sh, ch: teeth nearly together
};

// Letter groups, longest first so "oo" wins over "o".
const GROUPS = [
  ['ough', 'O'], ['tion', 'S'], ['oo', 'U'], ['ou', 'O'], ['ow', 'O'], ['oa', 'O'], ['ee', 'I'], ['ea', 'I'],
  ['ie', 'I'], ['ai', 'E'], ['ay', 'E'], ['ey', 'E'], ['th', 'L'], ['sh', 'S'], ['ch', 'S'], ['ph', 'FV'],
  ['wh', 'U'], ['qu', 'U'], ['ck', 'E'], ['ng', 'L'],
  ['a', 'A'], ['e', 'E'], ['i', 'I'], ['o', 'O'], ['u', 'U'], ['y', 'I'],
  ['m', 'MBP'], ['b', 'MBP'], ['p', 'MBP'], ['f', 'FV'], ['v', 'FV'], ['w', 'U'],
  ['l', 'L'], ['t', 'L'], ['d', 'L'], ['n', 'L'], ['r', 'O'],
  ['s', 'S'], ['z', 'S'], ['c', 'S'], ['j', 'S'], ['x', 'S'], ['g', 'E'], ['k', 'E'], ['h', 'A'],
];

// The mouth shapes for one word, in order, with repeats merged ("hello" gives A E L O).
export function wordToVisemes(word) {
  const letters = String(word).toLowerCase().replace(/[^a-z]/g, '');
  const shapes = [];
  let i = 0;
  while (i < letters.length) {
    const match = GROUPS.find(([g]) => letters.startsWith(g, i));
    const shape = match ? match[1] : 'rest';
    if (shapes[shapes.length - 1] !== shape) shapes.push(shape);
    i += match ? match[0].length : 1;
  }
  return shapes.length ? shapes : ['L'];   // numbers and symbols still move the mouth
}
