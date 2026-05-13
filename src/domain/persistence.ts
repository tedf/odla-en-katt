/**
 * Save / load schema, migration hook.
 * Schema documented in gan-harness/spec.md lines 161-191.
 *
 * localStorage key: `grow-a-cat:save:v1`
 * Synthetic example:
 *   { version: 1, coins: 10, totalEarned: 0, plots: [...6 plots...],
 *     seedInventory: { graskatt: 3, ... }, ... }
 */

import type { CatTypeId } from './catTypes';
import { CAT_TYPE_ORDER } from './catTypes';
import type { PlotState } from './plots';
import { createDefaultPlots, MAX_PLOTS } from './plots';
import type { SpeedUpgradeId } from './upgrades';

export const SAVE_KEY = 'grow-a-cat:save:v1';
export const CURRENT_SAVE_VERSION = 1;

export interface SaveData {
  version: 1;
  coins: number;
  totalEarned: number;
  plots: PlotState[];
  seedInventory: Record<CatTypeId, number>;
  unlockedCatTypes: CatTypeId[];
  catsSoldByType: Record<CatTypeId, number>;
  /**
   * @deprecated retained for back-compat. Use `weatherCooldowns` for the
   * new event system. Equivalent to weatherCooldowns.lightning.
   */
  lastStormAt: number | null;
  /** Per-event cooldown timestamps (epoch ms). Missing keys mean "never". */
  weatherCooldowns: Record<string, number | null>;
  lottery: {
    lastFreeSpinAt: number | null;
    spinsToday: number;
    spinsTodayDate: string;
  };
  settings: {
    reducedMotion: boolean;
    soundMuted: boolean;
  };
  /** Permanent speed-upgrade purchases. */
  purchasedUpgrades: SpeedUpgradeId[];
  lastTickAt: number;
}

function emptySeedInventory(): Record<CatTypeId, number> {
  return CAT_TYPE_ORDER.reduce(
    (acc, id) => {
      acc[id] = 0;
      return acc;
    },
    {} as Record<CatTypeId, number>,
  );
}

function emptyCatsSold(): Record<CatTypeId, number> {
  return CAT_TYPE_ORDER.reduce(
    (acc, id) => {
      acc[id] = 0;
      return acc;
    },
    {} as Record<CatTypeId, number>,
  );
}

export function createInitialSave(now: number): SaveData {
  const inv = emptySeedInventory();
  // Gräskatt is infinite by spec — no prefill needed. Free starter Gräskatt
  // seeds are available immediately via the infinite flag.
  return {
    version: CURRENT_SAVE_VERSION,
    coins: 10,
    totalEarned: 0,
    plots: createDefaultPlots(),
    seedInventory: inv,
    unlockedCatTypes: ['graskatt'],
    catsSoldByType: emptyCatsSold(),
    lastStormAt: null,
    weatherCooldowns: {},
    lottery: {
      lastFreeSpinAt: null,
      spinsToday: 0,
      spinsTodayDate: '',
    },
    settings: {
      reducedMotion: false,
      soundMuted: false,
    },
    purchasedUpgrades: [],
    lastTickAt: now,
  };
}

function isPlot(p: unknown): p is Partial<PlotState> {
  if (typeof p !== 'object' || p === null) return false;
  const x = p as Record<string, unknown>;
  return (
    typeof x.index === 'number' &&
    typeof x.unlocked === 'boolean' &&
    (x.state === 'empty' || x.state === 'growing' || x.state === 'ready') &&
    (x.catType === null || typeof x.catType === 'string') &&
    (x.plantedAt === null || typeof x.plantedAt === 'number') &&
    typeof x.lightningBonus === 'number'
  );
}

function normalizePlot(p: Partial<PlotState> & Record<string, unknown>): PlotState {
  const weatherEventsRaw = p.weatherEvents;
  const weatherEvents = Array.isArray(weatherEventsRaw)
    ? (weatherEventsRaw.filter((v) => typeof v === 'string') as string[])
    : [];
  const breakdownRaw = p.weatherBonusBreakdown as
    | Record<string, unknown>
    | undefined;
  const weatherBonusBreakdown: Record<string, number> = {};
  if (breakdownRaw && typeof breakdownRaw === 'object') {
    for (const [k, v] of Object.entries(breakdownRaw)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        weatherBonusBreakdown[k] = v;
      }
    }
  }
  return {
    index: (p.index as number) ?? 0,
    unlocked: Boolean(p.unlocked),
    state: (p.state as PlotState['state']) ?? 'empty',
    catType: (p.catType as CatTypeId | null) ?? null,
    plantedAt: (p.plantedAt as number | null) ?? null,
    lightningBonus:
      typeof p.lightningBonus === 'number' ? p.lightningBonus : 0,
    weatherEvents,
    weatherBonusBreakdown,
  };
}

function padPlots(plots: Partial<PlotState>[]): PlotState[] {
  const result: PlotState[] = plots.map((p) =>
    normalizePlot(p as Partial<PlotState> & Record<string, unknown>),
  );
  while (result.length < MAX_PLOTS) {
    result.push({
      index: result.length,
      unlocked: false,
      state: 'empty',
      catType: null,
      plantedAt: null,
      lightningBonus: 0,
      weatherEvents: [],
      weatherBonusBreakdown: {},
    });
  }
  return result.slice(0, MAX_PLOTS).map((p, i) => ({ ...p, index: i }));
}

function mergeRecord(
  raw: unknown,
  fallback: Record<CatTypeId, number>,
): Record<CatTypeId, number> {
  const result: Record<CatTypeId, number> = { ...fallback };
  if (typeof raw !== 'object' || raw === null) return result;
  const r = raw as Record<string, unknown>;
  for (const key of CAT_TYPE_ORDER) {
    const v = r[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      result[key] = v;
    }
  }
  return result;
}

function migrate(raw: unknown, now: number): SaveData {
  if (typeof raw !== 'object' || raw === null) return createInitialSave(now);
  const r = raw as Partial<SaveData> & Record<string, unknown>;

  if (r.version !== CURRENT_SAVE_VERSION) {
    return createInitialSave(now);
  }

  const base = createInitialSave(now);
  const plots =
    Array.isArray(r.plots) && r.plots.every(isPlot)
      ? padPlots(r.plots as Partial<PlotState>[])
      : base.plots;

  const weatherCooldownsRaw = r.weatherCooldowns as
    | Record<string, unknown>
    | undefined;
  const weatherCooldowns: Record<string, number | null> = {};
  if (weatherCooldownsRaw && typeof weatherCooldownsRaw === 'object') {
    for (const [k, v] of Object.entries(weatherCooldownsRaw)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        weatherCooldowns[k] = v;
      } else if (v === null) {
        weatherCooldowns[k] = null;
      }
    }
  } else if (typeof r.lastStormAt === 'number') {
    // Back-fill old saves: lastStormAt → lightning cooldown.
    weatherCooldowns.lightning = r.lastStormAt;
  }

  const lotteryRaw = r.lottery as
    | { lastFreeSpinAt?: unknown; spinsToday?: unknown; spinsTodayDate?: unknown }
    | undefined;
  const settingsRaw = r.settings as
    | { reducedMotion?: unknown; soundMuted?: unknown }
    | undefined;

  const validUpgradeIds = new Set<string>([
    'speed_1',
    'speed_2',
    'speed_3',
    'speed_4',
  ]);
  const purchasedUpgrades: SpeedUpgradeId[] = Array.isArray(r.purchasedUpgrades)
    ? (r.purchasedUpgrades.filter(
        (v) => typeof v === 'string' && validUpgradeIds.has(v),
      ) as SpeedUpgradeId[])
    : [];

  return {
    version: CURRENT_SAVE_VERSION,
    coins: typeof r.coins === 'number' ? r.coins : base.coins,
    totalEarned:
      typeof r.totalEarned === 'number' ? r.totalEarned : base.totalEarned,
    plots,
    seedInventory: mergeRecord(r.seedInventory, base.seedInventory),
    unlockedCatTypes:
      Array.isArray(r.unlockedCatTypes) &&
      r.unlockedCatTypes.every((s) => typeof s === 'string')
        ? (r.unlockedCatTypes as CatTypeId[])
        : base.unlockedCatTypes,
    catsSoldByType: mergeRecord(r.catsSoldByType, base.catsSoldByType),
    lastStormAt:
      typeof r.lastStormAt === 'number' || r.lastStormAt === null
        ? (r.lastStormAt as number | null)
        : null,
    weatherCooldowns,
    lottery: {
      lastFreeSpinAt:
        typeof lotteryRaw?.lastFreeSpinAt === 'number' ||
        lotteryRaw?.lastFreeSpinAt === null
          ? (lotteryRaw?.lastFreeSpinAt as number | null) ?? null
          : null,
      spinsToday:
        typeof lotteryRaw?.spinsToday === 'number'
          ? lotteryRaw.spinsToday
          : 0,
      spinsTodayDate:
        typeof lotteryRaw?.spinsTodayDate === 'string'
          ? lotteryRaw.spinsTodayDate
          : '',
    },
    settings: {
      reducedMotion: Boolean(settingsRaw?.reducedMotion),
      soundMuted: Boolean(settingsRaw?.soundMuted),
    },
    purchasedUpgrades,
    lastTickAt: typeof r.lastTickAt === 'number' ? r.lastTickAt : now,
  };
}

export function loadSave(now: number): SaveData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialSave(now);
  }
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialSave(now);
    const parsed: unknown = JSON.parse(raw);
    return migrate(parsed, now);
  } catch {
    return createInitialSave(now);
  }
}

export function writeSave(data: SaveData): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Quota or serialization error — silently degrade.
  }
}

export function clearSave(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
