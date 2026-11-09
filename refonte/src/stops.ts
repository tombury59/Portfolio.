/**
 * The itinerary, shared by the page and the 3D scene.
 * Stop k matches the k-th boarding pass in index.html; hop k flies stop k → stop k+1.
 * Each formation comes first, then what was done during it:
 * bac → BTS (Le Champenais, Ecolab) → Bachelor (Blackfox) → MBA (Negocom).
 */

/** Map position of each stop, in scene units (≈ 500 m), Angers centre at 0,0. North is −z. */
export const STOP_XZ: [number, number][] = [
  [-34, -58], // the bac: take-off, up in the north of the map
  [-4, -8], // Lycée Chevrollier, Angers: the BTS
  [40, 12], // Le Champenais, on the north bank of the Loire
  [30, -45], // Ecolab, remote: a hill with a relay mast
  [8, -6], // My Digital School, Angers: the Bachelor
  [-36, 54], // Blackfox, Sèvremoine
  [8, -6], // My Digital School again: the MBA
  [6, 5], // Negocom Atlantique, Angers: landing at the foot of the tower
];

export const STOPS = STOP_XZ.length;

/** Screens of scrolling for each hop. Long hops get more room, the hops inside Angers less. */
export const HOP_SCREENS = [1.4, 1.2, 1.2, 1.3, 1.3, 1.3, 0.9];

/** Screens spent parked at the end, before the page moves on. */
export const ARRIVAL_SCREENS = 0.6;

export const TOTAL_SCREENS = HOP_SCREENS.reduce((a, b) => a + b, 0) + ARRIVAL_SCREENS;

const hopStart: number[] = [];
HOP_SCREENS.reduce((acc, s) => (hopStart.push(acc), acc + s), 0);

/** Scroll position (in screens from the top of the trip) → progress, 0 … STOPS - 1. */
export function progressAt(screens: number): number {
  if (screens <= 0) return 0;
  for (let k = 0; k < HOP_SCREENS.length; k++) {
    if (screens < hopStart[k] + HOP_SCREENS[k]) return k + (screens - hopStart[k]) / HOP_SCREENS[k];
  }
  return STOPS - 1;
}

/** Progress → scroll position, to jump to a stop. */
export function screensAt(progress: number): number {
  const k = Math.min(HOP_SCREENS.length - 1, Math.max(0, Math.floor(progress)));
  return hopStart[k] + (progress - k) * HOP_SCREENS[k];
}
