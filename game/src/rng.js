// Gobble Dash — seeded randomness so a screenshot seed always stages the
// same scene, and live play can start from a fresh unpredictable seed.

/** mulberry32: a small deterministic generator. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from the generator. */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

/** Pick one entry of an array. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
