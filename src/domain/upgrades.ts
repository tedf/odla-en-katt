/**
 * Speed upgrades — permanent (one-time) growth speed multipliers.
 *
 * Only the most expensive purchased upgrade is "active" (multipliers do not
 * stack). Once a tier is purchased, lower tiers are hidden from the shop.
 * The active multiplier applies to the effective grow rate of every plot.
 */

export interface SpeedUpgrade {
  id: SpeedUpgradeId;
  name: string;
  /** Multiplier applied to the growth rate. 1 = baseline. */
  multiplier: number;
  /** One-time coin cost. */
  cost: number;
  /** Swedish UI description. */
  description: string;
  /** Tier index (higher = better). Used to enforce strict tier ordering. */
  tier: number;
}

export type SpeedUpgradeId =
  | 'speed_1'
  | 'speed_2'
  | 'speed_3'
  | 'speed_4';

export const SPEED_UPGRADES: readonly SpeedUpgrade[] = [
  {
    id: 'speed_1',
    name: 'Gödselvatten',
    multiplier: 1.5,
    cost: 100,
    description: 'Odla 1.5x snabbare',
    tier: 1,
  },
  {
    id: 'speed_2',
    name: 'Magisk Jord',
    multiplier: 2.0,
    cost: 500,
    description: 'Odla 2x snabbare',
    tier: 2,
  },
  {
    id: 'speed_3',
    name: 'Trollformelsfrö',
    multiplier: 3.0,
    cost: 2000,
    description: 'Odla 3x snabbare',
    tier: 3,
  },
  {
    id: 'speed_4',
    name: 'Tidsmagi',
    multiplier: 5.0,
    cost: 10000,
    description: 'Odla 5x snabbare',
    tier: 4,
  },
];

/**
 * Returns the active multiplier given a list of purchased upgrade ids.
 * Multipliers do not stack — the highest tier wins.
 */
export function activeSpeedMultiplier(purchasedIds: readonly string[]): number {
  let best = 1;
  for (const u of SPEED_UPGRADES) {
    if (purchasedIds.includes(u.id) && u.multiplier > best) {
      best = u.multiplier;
    }
  }
  return best;
}

/**
 * Returns the next upgrade tier the player could buy. Null if they own the
 * highest tier already.
 */
export function nextAvailableUpgrade(
  purchasedIds: readonly string[],
): SpeedUpgrade | null {
  const ownedTier = SPEED_UPGRADES.filter((u) => purchasedIds.includes(u.id))
    .map((u) => u.tier)
    .reduce((a, b) => Math.max(a, b), 0);
  return SPEED_UPGRADES.find((u) => u.tier > ownedTier) ?? null;
}

export function getUpgradeById(id: string): SpeedUpgrade | null {
  return SPEED_UPGRADES.find((u) => u.id === id) ?? null;
}
