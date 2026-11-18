// Starfall Shepherd — tuning and constants. One place for every number the
// game balances on, so a wave or a score value changes here and nowhere else.
export const BEST_KEY = 'starfall-shepherd-best';
export const STEP = 1 / 60;
export const LIVES = 3;
export const WAVES = 8;
export const COMBO_WINDOW = 2.5; // seconds a catch stays chainable
export const COMBO_MAX = 8; // multiplier cap
export const PULSE_RADIUS = 150;
export const PULSE_COOLDOWN = 1.2;
export const INVULN_TIME = 1.6;

// Seeds to gather before the wave is done and dawn moves one step closer.
export function seedsNeeded(wave) {
  return 10 + wave * 5;
}
export function waveClearBonus(wave) {
  return 100 * wave;
}
