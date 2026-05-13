/**
 * Lightning storm event logic.
 */

/** Base chance per second per growing plot. */
export const LIGHTNING_BASE_CHANCE_PER_SEC = 0.005;

/** Global cooldown so storms don't spam (ms). */
export const LIGHTNING_COOLDOWN_MS = 30_000;

/** Bonus is rolled between 20% and 50%. */
export const LIGHTNING_BONUS_MIN = 0.2;
export const LIGHTNING_BONUS_MAX = 0.5;

/** Multiplier cap (stacking max = +100%). */
export const LIGHTNING_BONUS_CAP = 1.0;

/**
 * Returns true if the global cooldown has elapsed.
 */
export function isLightningOffCooldown(
  lastStormAt: number | null,
  now: number,
): boolean {
  if (lastStormAt === null) return true;
  return now - lastStormAt >= LIGHTNING_COOLDOWN_MS;
}

/**
 * Roll a per-tick chance. Default rng is Math.random.
 */
export function rollLightningTrigger(
  perPlotChance: number = LIGHTNING_BASE_CHANCE_PER_SEC,
  rng: () => number = Math.random,
): boolean {
  return rng() < perPlotChance;
}

/**
 * Returns a bonus value in [LIGHTNING_BONUS_MIN, LIGHTNING_BONUS_MAX].
 */
export function rollLightningBonus(rng: () => number = Math.random): number {
  const span = LIGHTNING_BONUS_MAX - LIGHTNING_BONUS_MIN;
  return LIGHTNING_BONUS_MIN + rng() * span;
}
