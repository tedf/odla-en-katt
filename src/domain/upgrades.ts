/**
 * Speed upgrades — time-limited consumables that multiply growth speed.
 *
 * Each upgrade is purchased for coins and stays active for a fixed duration.
 * Only one upgrade is active at a time: buying a new one (same or different
 * tier) REPLACES the current one and resets the timer with the new multiplier.
 * Once expired, the upgrade returns to its default (1x) and can be bought
 * again as a fresh consumable.
 */

export interface SpeedUpgrade {
  id: SpeedUpgradeId;
  name: string;
  /** Multiplier applied to the growth rate while active. 1 = baseline. */
  multiplier: number;
  /** Per-purchase coin cost. */
  cost: number;
  /** Active duration in seconds. */
  durationSeconds: number;
  /** Swedish UI description. */
  description: string;
  /** Compact emoji used in HUD chip and shop card. */
  emoji: string;
  /** Tier index (higher = stronger). Retained for ordering/styling. */
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
    cost: 50,
    durationSeconds: 30 * 60,
    description: '1.5x hastighet i 30 min',
    emoji: '💧',
    tier: 1,
  },
  {
    id: 'speed_2',
    name: 'Magisk Jord',
    multiplier: 2.0,
    cost: 200,
    durationSeconds: 60 * 60,
    description: '2x hastighet i 1 timme',
    emoji: '✨',
    tier: 2,
  },
  {
    id: 'speed_3',
    name: 'Trollformelsfrö',
    multiplier: 3.0,
    cost: 800,
    durationSeconds: 2 * 60 * 60,
    description: '3x hastighet i 2 timmar',
    emoji: '🔮',
    tier: 3,
  },
  {
    id: 'speed_4',
    name: 'Tidsmagi',
    multiplier: 5.0,
    cost: 4000,
    durationSeconds: 4 * 60 * 60,
    description: '5x hastighet i 4 timmar',
    emoji: '⏰',
    tier: 4,
  },
];

export interface ActiveSpeedUpgrade {
  upgradeId: SpeedUpgradeId;
  multiplier: number;
  /** Epoch ms when the active boost expires. */
  expiresAt: number;
}

/**
 * Returns the multiplier from an active speed upgrade, or 1 if none/expired.
 */
export function activeMultiplier(
  active: ActiveSpeedUpgrade | null,
  now: number,
): number {
  if (!active) return 1;
  if (active.expiresAt <= now) return 1;
  return active.multiplier;
}

/**
 * Returns the active upgrade if it has not yet expired, otherwise null.
 * Useful for pruning stale state on save load and after each tick.
 */
export function pruneExpired(
  active: ActiveSpeedUpgrade | null,
  now: number,
): ActiveSpeedUpgrade | null {
  if (!active) return null;
  if (active.expiresAt <= now) return null;
  return active;
}

/**
 * Builds an active upgrade record for the given upgrade id starting now.
 * Returns null if the id is unknown.
 */
export function makeActiveUpgrade(
  upgradeId: SpeedUpgradeId,
  now: number,
): ActiveSpeedUpgrade | null {
  const u = getUpgradeById(upgradeId);
  if (!u) return null;
  return {
    upgradeId: u.id,
    multiplier: u.multiplier,
    expiresAt: now + u.durationSeconds * 1000,
  };
}

export function getUpgradeById(id: string): SpeedUpgrade | null {
  return SPEED_UPGRADES.find((u) => u.id === id) ?? null;
}

export function isValidUpgradeId(id: string): id is SpeedUpgradeId {
  return SPEED_UPGRADES.some((u) => u.id === id);
}

// ---------------------------------------------------------------------------
// Utility upgrades — permanent one-time purchases that unlock new behaviour
// (e.g. auto-harvest). Separate catalogue so the speed-boost UI/state stays
// clean.
// ---------------------------------------------------------------------------

export type UtilityUpgradeId = 'auto_harvest';

export interface UtilityUpgrade {
  id: UtilityUpgradeId;
  name: string;
  emoji: string;
  cost: number;
  description: string;
  /** Always true today; reserved for future repeatable utility items. */
  isPermanent: true;
}

export const UTILITY_UPGRADES: readonly UtilityUpgrade[] = [
  {
    id: 'auto_harvest',
    name: 'Auto-Skörda',
    emoji: '🤖',
    cost: 5000,
    description:
      'Katter skördas automatiskt när de är klara — även offline!',
    isPermanent: true,
  },
];

export const UTILITY_UPGRADES_BY_ID: Readonly<
  Record<UtilityUpgradeId, UtilityUpgrade>
> = UTILITY_UPGRADES.reduce(
  (acc, u) => {
    acc[u.id] = u;
    return acc;
  },
  {} as Record<UtilityUpgradeId, UtilityUpgrade>,
);

export function getUtilityUpgradeById(id: string): UtilityUpgrade | null {
  return (UTILITY_UPGRADES_BY_ID as Record<string, UtilityUpgrade>)[id] ?? null;
}

export function isValidUtilityUpgradeId(id: string): id is UtilityUpgradeId {
  return id in UTILITY_UPGRADES_BY_ID;
}
