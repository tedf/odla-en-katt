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
  | 'speed_4'
  | 'speed_5'
  | 'speed_6'
  | 'speed_7'
  | 'speed_8';

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
  {
    id: 'speed_5',
    name: 'Kvanttunnel',
    multiplier: 8.0,
    cost: 15000,
    durationSeconds: 6 * 60 * 60,
    description: '8x hastighet i 6 timmar',
    emoji: '🌀',
    tier: 5,
  },
  {
    id: 'speed_6',
    name: 'Dimensionsrift',
    multiplier: 12.0,
    cost: 50000,
    durationSeconds: 8 * 60 * 60,
    description: '12x hastighet i 8 timmar',
    emoji: '🌌',
    tier: 6,
  },
  {
    id: 'speed_7',
    name: 'Tidskollaps',
    multiplier: 20.0,
    cost: 200000,
    durationSeconds: 12 * 60 * 60,
    description: '20x hastighet i 12 timmar',
    emoji: '💥',
    tier: 7,
  },
  {
    id: 'speed_8',
    name: 'Universum Stopp',
    multiplier: 50.0,
    cost: 1000000,
    durationSeconds: 24 * 60 * 60,
    description: '50x hastighet i 24 timmar — Tid stannar!',
    emoji: '🛑',
    tier: 8,
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

export type UtilityUpgradeId =
  | 'auto_harvest'
  | 'extra_seed_slot'
  | 'lightning_rod'
  | 'lucky_soil'
  | 'golden_watering_can'
  | 'time_capsule'
  | 'cosmic_antenna'
  | 'cat_whisperer';

export interface UtilityUpgrade {
  id: UtilityUpgradeId;
  name: string;
  emoji: string;
  cost: number;
  description: string;
  /** Always true today; reserved for future repeatable utility items. */
  isPermanent: true;
  /**
   * Lifetime-earned coin threshold before this tool is revealed in the shop.
   * 0 = always visible.
   */
  unlockThreshold: number;
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
    unlockThreshold: 0,
  },
  {
    id: 'extra_seed_slot',
    name: 'Extra Fröpåse',
    emoji: '🎒',
    cost: 2000,
    description: 'Håll upp till 10 av varje frö (upp från 5).',
    isPermanent: true,
    unlockThreshold: 1000,
  },
  {
    id: 'lightning_rod',
    name: 'Åskledare',
    emoji: '⚡',
    cost: 8000,
    description: '2x chans för väderhändelser på alla odlingsrutor.',
    isPermanent: true,
    unlockThreshold: 5000,
  },
  {
    id: 'lucky_soil',
    name: 'Lyckojord',
    emoji: '🍀',
    cost: 12000,
    description:
      '+15% chans att skörda en katt med Lycklig- eller Magisk-trait.',
    isPermanent: true,
    unlockThreshold: 8000,
  },
  {
    id: 'golden_watering_can',
    name: 'Gyllene Vattenkanna',
    emoji: '🪣',
    cost: 30000,
    description: 'Alla sålda katter värt +10% extra mynt.',
    isPermanent: true,
    unlockThreshold: 20000,
  },
  {
    id: 'time_capsule',
    name: 'Tidskapsel',
    emoji: '⌛',
    cost: 75000,
    description:
      'Offline-tid räknas dubbelt (offline-katter odlas 2x snabbare).',
    isPermanent: true,
    unlockThreshold: 50000,
  },
  {
    id: 'cosmic_antenna',
    name: 'Kosmisk Antenn',
    emoji: '📡',
    cost: 200000,
    description: '3x chans för Meteoritregn och Tornado-händelser.',
    isPermanent: true,
    unlockThreshold: 150000,
  },
  {
    id: 'cat_whisperer',
    name: 'Kattviskning',
    emoji: '🐾',
    cost: 500000,
    description:
      'Alla katter får en extra slumpmässig trait (2 traits per katt).',
    isPermanent: true,
    unlockThreshold: 400000,
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

/**
 * Pure helper used by the Upgrades tab to decide which boosts to show.
 *
 * Returns boosts the player can afford PLUS the first one they cannot yet
 * afford (the "next goal"). All boosts beyond that are still returned so
 * the UI can decide whether to render them as locked or hide them entirely.
 *
 * Each entry carries a status:
 *   - `affordable`: player has enough coins right now
 *   - `next`     : the cheapest unaffordable boost (preview / aspiration)
 *   - `locked`   : far above current wealth
 */
export type SpeedUpgradeStatus = 'affordable' | 'next' | 'locked';

export interface SpeedUpgradeWithStatus {
  upgrade: SpeedUpgrade;
  status: SpeedUpgradeStatus;
}

export function classifySpeedUpgrades(
  coins: number,
): SpeedUpgradeWithStatus[] {
  let nextAssigned = false;
  return SPEED_UPGRADES.map((u) => {
    if (coins >= u.cost) {
      return { upgrade: u, status: 'affordable' as const };
    }
    if (!nextAssigned) {
      nextAssigned = true;
      return { upgrade: u, status: 'next' as const };
    }
    return { upgrade: u, status: 'locked' as const };
  });
}

// ---------------------------------------------------------------------------
// Utility-upgrade derived constants.
// ---------------------------------------------------------------------------

/** Base maximum number of each seed in the inventory. */
export const BASE_SEED_INVENTORY_CAP = 5;
/** Upgraded cap once the player owns `extra_seed_slot`. */
export const UPGRADED_SEED_INVENTORY_CAP = 10;

/** Returns the seed cap given the player's utility upgrades. */
export function seedInventoryCap(owned: readonly UtilityUpgradeId[]): number {
  return owned.includes('extra_seed_slot')
    ? UPGRADED_SEED_INVENTORY_CAP
    : BASE_SEED_INVENTORY_CAP;
}

/**
 * Build the per-event probability-multiplier map for weather rolls based on
 * the player's owned utility upgrades.
 *  - lightning_rod : 2x for every event
 *  - cosmic_antenna: 3x for meteor + tornado (stacks multiplicatively with lightning_rod)
 */
export function weatherProbabilityMultipliers(
  owned: readonly UtilityUpgradeId[],
): Record<string, number> {
  const out: Record<string, number> = {};
  const hasRod = owned.includes('lightning_rod');
  const hasAntenna = owned.includes('cosmic_antenna');
  for (const evId of [
    'rain',
    'lightning',
    'ice',
    'snow',
    'tornado',
    'meteor',
  ] as const) {
    let m = 1;
    if (hasRod) m *= 2;
    if (hasAntenna && (evId === 'meteor' || evId === 'tornado')) m *= 3;
    if (m !== 1) out[evId] = m;
  }
  return out;
}

/** Sell-value multiplier applied after trait roll. */
export function sellValueMultiplier(
  owned: readonly UtilityUpgradeId[],
): number {
  return owned.includes('golden_watering_can') ? 1.1 : 1;
}

/** Offline time-warp multiplier applied on top of any speed boost. */
export function offlineTimeMultiplier(
  owned: readonly UtilityUpgradeId[],
): number {
  return owned.includes('time_capsule') ? 2 : 1;
}

/** Lucky-soil bias for `rollPersonality`. */
export function luckyMagicalBias(
  owned: readonly UtilityUpgradeId[],
): number {
  return owned.includes('lucky_soil') ? 0.15 : 0;
}

/** Whether the cat-whisperer second-trait roll is active. */
export function hasCatWhisperer(
  owned: readonly UtilityUpgradeId[],
): boolean {
  return owned.includes('cat_whisperer');
}
