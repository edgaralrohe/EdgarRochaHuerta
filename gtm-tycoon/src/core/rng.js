// Seeded PRNG (mulberry32) so every week and every test is reproducible.
export function createRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: arr => arr[Math.floor(next() * arr.length)],
    chance: p => next() < p,
  };
}

export function hashSeed(...parts) {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    for (const ch of String(p) + '|') {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h >>> 0;
}
