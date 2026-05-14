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
import { CAT_TYPE_ORDER, CAT_TYPES } from './catTypes';
import type { PlotState } from './plots';
import { createDefaultPlots, MAX_PLOTS } from './plots';
import type {
  ActiveSpeedUpgrade,
  SpeedUpgradeId,
  UtilityUpgradeId,
} from './upgrades';
import { isValidUpgradeId, isValidUtilityUpgradeId } from './upgrades';
import type { DailyQuestsState, QuestProgressEntry } from './quests';
import type { CatTraitId } from './catPersonality';
import { isValidTraitId } from './catPersonality';
import { ACHIEVEMENTS_BY_ID } from './achievements';

export const SAVE_KEY = 'grow-a-cat:save:v1';
export const CURRENT_SAVE_VERSION = 1;

/**
 * A single named/personality-bearing cat stored in the player's collection
 * after harvest. Multiple per type is normal.
 */
export interface HarvestedCatRecord {
  catTypeId: CatTypeId;
  count: number;
  personalities: Array<{
    name: string;
    traitId: CatTraitId;
    /** Sell multiplier from weather applied at harvest time (0 = baseline). */
    weatherBonus: number;
  }>;
}

/** Persisted shape for achievement stats (Set is serialized as array). */
export interface SavedAchievementStats {
  totalHarvested: number;
  totalCoinsEarned: number;
  catTypesHarvested: CatTypeId[];
  weatherEventsExperienced: number;
  lotteriesSpun: number;
  upgradesPurchased: number;
  longestStreak: number;
  meteorHits: number;
  harvestedWithMagicalTrait: number;
}

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
  /**
   * @deprecated retained for back-compat with v1 saves that stored permanent
   * upgrade purchases. The new model uses `activeSpeedUpgrade` and treats
   * upgrades as time-limited consumables. Always serialized as `[]`.
   */
  purchasedUpgrades: SpeedUpgradeId[];
  /** Currently-active time-limited speed boost, if any. */
  activeSpeedUpgrade: ActiveSpeedUpgrade | null;
  /** Permanently-owned utility upgrades (e.g. `auto_harvest`). */
  utilityUpgrades: UtilityUpgradeId[];
  /** Per-cat-type harvested records (name + trait roll log). */
  harvestedCats: Partial<Record<CatTypeId, HarvestedCatRecord>>;
  /** Daily quests state (date-scoped). */
  dailyQuests: DailyQuestsState | null;
  /** Achievement lifetime stats (Set serialized as array). */
  achievementStats: SavedAchievementStats;
  /** Unlocked achievement ids (order = unlock order, ascending time). */
  unlockedAchievements: string[];
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

export function createEmptySavedAchievementStats(): SavedAchievementStats {
  return {
    totalHarvested: 0,
    totalCoinsEarned: 0,
    catTypesHarvested: [],
    weatherEventsExperienced: 0,
    lotteriesSpun: 0,
    upgradesPurchased: 0,
    longestStreak: 0,
    meteorHits: 0,
    harvestedWithMagicalTrait: 0,
  };
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
    activeSpeedUpgrade: null,
    utilityUpgrades: [],
    harvestedCats: {},
    dailyQuests: null,
    achievementStats: createEmptySavedAchievementStats(),
    unlockedAchievements: [],
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

// Re-evaluate which cat types should be unlocked based on current earnings.
// Merges saved unlocks with any cats that should now be unlocked but weren't
// in the save (e.g. cats added after the save was created, or missed unlocks).
function recomputeUnlockedCatTypes(
  saved: CatTypeId[],
  totalEarned: number,
  catsSold: Record<string, number>,
): CatTypeId[] {
  const result = new Set<CatTypeId>(saved);
  for (const id of CAT_TYPE_ORDER) {
    const cat = CAT_TYPES[id];
    if (!cat) continue;
    const earnedOk = cat.unlock.totalEarned === null || totalEarned >= cat.unlock.totalEarned;
    const soldOk = cat.unlock.graskattsSold === null || (catsSold['graskatt'] ?? 0) >= cat.unlock.graskattsSold;
    if (earnedOk && soldOk) result.add(id);
  }
  return Array.from(result);
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

  // Time-limited consumable upgrades: read the active record and drop it
  // if it has already expired by `now`. We intentionally do not migrate
  // legacy `purchasedUpgrades` into an active record — the new model treats
  // permanently-owned upgrades as a one-off; players keep their coins.
  let activeSpeedUpgrade: ActiveSpeedUpgrade | null = null;
  const rawActive = r.activeSpeedUpgrade as
    | Partial<ActiveSpeedUpgrade>
    | null
    | undefined;
  if (rawActive && typeof rawActive === 'object') {
    const id = rawActive.upgradeId;
    const mult = rawActive.multiplier;
    const exp = rawActive.expiresAt;
    if (
      typeof id === 'string' &&
      isValidUpgradeId(id) &&
      typeof mult === 'number' &&
      Number.isFinite(mult) &&
      typeof exp === 'number' &&
      Number.isFinite(exp) &&
      exp > now
    ) {
      activeSpeedUpgrade = {
        upgradeId: id,
        multiplier: mult,
        expiresAt: exp,
      };
    }
  }

  // ---- New fields (cat personalities, utility upgrades, quests, achievements) ----
  const utilityUpgrades: UtilityUpgradeId[] = Array.isArray(r.utilityUpgrades)
    ? (r.utilityUpgrades.filter(
        (id) => typeof id === 'string' && isValidUtilityUpgradeId(id),
      ) as UtilityUpgradeId[])
    : [];

  const harvestedCats: Partial<Record<CatTypeId, HarvestedCatRecord>> = {};
  if (r.harvestedCats && typeof r.harvestedCats === 'object') {
    for (const [k, rawV] of Object.entries(
      r.harvestedCats as Record<string, unknown>,
    )) {
      if (!CAT_TYPE_ORDER.includes(k as CatTypeId)) continue;
      const v = rawV as Partial<HarvestedCatRecord> | undefined;
      if (!v || typeof v !== 'object') continue;
      const count = typeof v.count === 'number' ? v.count : 0;
      const persRaw: unknown[] = Array.isArray(v.personalities)
        ? (v.personalities as unknown[])
        : [];
      const personalities = persRaw
        .filter((p): p is { name: string; traitId: string; weatherBonus?: number } => {
          if (!p || typeof p !== 'object') return false;
          const x = p as Record<string, unknown>;
          return (
            typeof x.name === 'string' &&
            typeof x.traitId === 'string' &&
            isValidTraitId(x.traitId)
          );
        })
        .map((p) => ({
          name: p.name,
          traitId: p.traitId as CatTraitId,
          weatherBonus:
            typeof p.weatherBonus === 'number' && Number.isFinite(p.weatherBonus)
              ? p.weatherBonus
              : 0,
        }));
      harvestedCats[k as CatTypeId] = {
        catTypeId: k as CatTypeId,
        count,
        personalities,
      };
    }
  }

  const dailyQuestsRaw = r.dailyQuests as DailyQuestsState | null | undefined;
  let dailyQuests: DailyQuestsState | null = null;
  if (dailyQuestsRaw && typeof dailyQuestsRaw === 'object') {
    const dq = dailyQuestsRaw as Partial<DailyQuestsState>;
    if (
      typeof dq.date === 'string' &&
      Array.isArray(dq.quests) &&
      typeof dq.streak === 'number'
    ) {
      const quests: QuestProgressEntry[] = (dq.quests as QuestProgressEntry[])
        .filter(
          (q): q is QuestProgressEntry =>
            !!q &&
            typeof q === 'object' &&
            typeof q.templateId === 'string' &&
            typeof q.progress === 'number' &&
            typeof q.completed === 'boolean' &&
            typeof q.rewardClaimed === 'boolean',
        )
        .map((q) => ({
          templateId: q.templateId,
          progress: q.progress,
          completed: q.completed,
          rewardClaimed: q.rewardClaimed,
        }));
      dailyQuests = {
        date: dq.date,
        quests,
        streak: dq.streak,
        lastCompletedDate:
          typeof dq.lastCompletedDate === 'string'
            ? dq.lastCompletedDate
            : null,
      };
    }
  }

  const statsRaw = r.achievementStats as
    | Partial<SavedAchievementStats>
    | undefined;
  const achievementStats: SavedAchievementStats = {
    totalHarvested:
      typeof statsRaw?.totalHarvested === 'number'
        ? statsRaw.totalHarvested
        : 0,
    totalCoinsEarned:
      typeof statsRaw?.totalCoinsEarned === 'number'
        ? statsRaw.totalCoinsEarned
        : 0,
    catTypesHarvested: Array.isArray(statsRaw?.catTypesHarvested)
      ? (statsRaw.catTypesHarvested.filter(
          (id) =>
            typeof id === 'string' && CAT_TYPE_ORDER.includes(id as CatTypeId),
        ) as CatTypeId[])
      : [],
    weatherEventsExperienced:
      typeof statsRaw?.weatherEventsExperienced === 'number'
        ? statsRaw.weatherEventsExperienced
        : 0,
    lotteriesSpun:
      typeof statsRaw?.lotteriesSpun === 'number'
        ? statsRaw.lotteriesSpun
        : 0,
    upgradesPurchased:
      typeof statsRaw?.upgradesPurchased === 'number'
        ? statsRaw.upgradesPurchased
        : 0,
    longestStreak:
      typeof statsRaw?.longestStreak === 'number'
        ? statsRaw.longestStreak
        : 0,
    meteorHits:
      typeof statsRaw?.meteorHits === 'number' ? statsRaw.meteorHits : 0,
    harvestedWithMagicalTrait:
      typeof statsRaw?.harvestedWithMagicalTrait === 'number'
        ? statsRaw.harvestedWithMagicalTrait
        : 0,
  };

  const unlockedAchievements: string[] = Array.isArray(r.unlockedAchievements)
    ? (r.unlockedAchievements.filter(
        (id) => typeof id === 'string' && id in ACHIEVEMENTS_BY_ID,
      ) as string[])
    : [];

  return {
    version: CURRENT_SAVE_VERSION,
    coins: typeof r.coins === 'number' ? r.coins : base.coins,
    totalEarned:
      typeof r.totalEarned === 'number' ? r.totalEarned : base.totalEarned,
    plots,
    seedInventory: mergeRecord(r.seedInventory, base.seedInventory),
    unlockedCatTypes: recomputeUnlockedCatTypes(
      Array.isArray(r.unlockedCatTypes) &&
      r.unlockedCatTypes.every((s) => typeof s === 'string')
        ? (r.unlockedCatTypes as CatTypeId[])
        : base.unlockedCatTypes,
      typeof r.totalEarned === 'number' ? r.totalEarned : 0,
      typeof r.catsSoldByType === 'object' && r.catsSoldByType !== null
        ? (r.catsSoldByType as Record<string, number>)
        : {},
    ),
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
    purchasedUpgrades: [],
    activeSpeedUpgrade,
    utilityUpgrades,
    harvestedCats,
    dailyQuests,
    achievementStats,
    unlockedAchievements,
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
