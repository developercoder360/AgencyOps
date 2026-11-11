/**
 * Deterministic PRNG (Mulberry32) so mock datasets render identically across
 * SSR and client hydration without Math.random() or new Date() mismatches.
 */
export function createSeededRandom(seed = 20261111) {
  let t = seed >>> 0
  return function next(): number {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function pickFrom<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export const REFERENCE_DATE_ISO = "2026-11-11"
