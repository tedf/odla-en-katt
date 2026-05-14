/**
 * Zustand store — the bridge between pure domain logic and React UI.
 *
 * Holds the entire game state (coins, plots, inventory, lottery state,
 * cat personalities, daily quests, achievements) and exposes actions.
 * Persists to localStorage on every meaningful change.
 */

import { create } from 'zustand';
import { CAT_TYPES, type CatTypeId } from '../domain/catTypes';
import {
  applyWeatherBonus,
  effectiveSellValue,
  emptyPlotAfterHarvest,
  isMature,
  markReady,
  plantInPlot,
  PLOT_UNLOCK_THRESHOLDS,
  type PlotState,
} from '../domain/plots';
import {
  rollAnyWeatherEvent,
  rollWeatherBonus,
  type WeatherEvent,
} from '../domain/events';
import {
  isFreeSpinAvailable,
  localDateString,
  LOTTERY_SECTORS,
  PAID_SPIN_COST,
  rollLottery,
} from '../domain/lottery';
import { plotsUnlockedBy } from '../domain/economy';
import {
  createInitialSave,
  loadSave,
  writeSave,
  SAVE_KEY,
  type HarvestedCatRecord,
  type SavedAchievementStats,
  type SaveData,
} from '../domain/persistence';
import {
  activeMultiplier,
  getUpgradeById,
  hasCatWhisperer,
  luckyMagicalBias,
  makeActiveUpgrade,
  offlineTimeMultiplier,
  pruneExpired,
  seedInventoryCap,
  sellValueMultiplier,
  weatherProbabilityMultipliers,
  type ActiveSpeedUpgrade,
  type SpeedUpgradeId,
  type UtilityUpgradeId,
  getUtilityUpgradeById,
} from '../domain/upgrades';
import {
  rollPersonality,
  traitValueMultiplier,
  type CatTraitId,
} from '../domain/catPersonality';
import { calculateOfflineProgress, type OfflineSummary } from '../domain/offline';
import {
  applyQuestProgress,
  getQuestTemplate,
  refreshDailyQuests,
  type DailyQuestsState,
  type QuestType,
} from '../domain/quests';
import {
  ACHIEVEMENTS_BY_ID,
  newlyUnlocked,
  type AchievementStats,
} from '../domain/achievements';

export interface ToastMessage {
  id: number;
  kind: 'info' | 'success' | 'lightning' | 'unlock' | 'achievement';
  title: string;
  body?: string;
  emoji?: string;
  createdAt: number;
  ttl: number;
}

export interface PendingRecap {
  readyPlots: number[];
  awayMs: number;
}

export interface SpinResult {
  sectorIndex: number;
  /**
   * Deprecated: kept for back-compat. The LotteryWheel component now
   * computes the visible rotation from `sectorIndex` so it can correctly
   * align the winning sector under the pointer regardless of the wheel's
   * previous resting position.
   */
  spinAngle: number;
}

interface FloatingCoin {
  id: number;
  amount: number;
  plotIndex: number | null;
}

export interface HarvestReveal {
  /** Re-trigger key for animation. */
  id: number;
  catTypeId: CatTypeId;
  rarity: string;
  /** Plot the harvest came from — used to anchor coin cascade origin. */
  plotIndex: number;
  createdAt: number;
}

export interface FireworksBurst {
  id: number;
  /** Optional rarity tint — used for lottery + achievement variants. */
  tint: string;
  createdAt: number;
}

export interface SellPopUp {
  id: number;
  amount: number;
  rarity: string;
  plotIndex: number;
  createdAt: number;
}

export interface ActiveWeatherStrike {
  /** Ephemeral monotonic id used as React key for re-trigger animations. */
  id: number;
  plotIndex: number;
  eventId: string;
  bonus: number;
  /** Epoch ms when the strike was applied. */
  triggeredAt: number;
}

export interface RecentHarvest {
  catTypeId: CatTypeId;
  name: string;
  traitId: CatTraitId;
  /** Plot the harvest happened on — used to anchor the popup. */
  plotIndex: number;
  /** Increments each harvest so listeners can re-trigger animations. */
  key: number;
  createdAt: number;
}

export interface GameState {
  // ---- save fields ----
  coins: number;
  totalEarned: number;
  plots: PlotState[];
  seedInventory: Record<CatTypeId, number>;
  unlockedCatTypes: CatTypeId[];
  catsSoldByType: Record<CatTypeId, number>;
  lastStormAt: number | null;
  /** Per-weather-event last-fire timestamps. Used by tick() rolls. */
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
   * @deprecated retained for save back-compat. Speed upgrades are now
   * time-limited consumables; the live state lives in `activeSpeedUpgrade`.
   */
  purchasedUpgrades: SpeedUpgradeId[];
  /** Currently-active speed boost (replaces previous on re-purchase). */
  activeSpeedUpgrade: ActiveSpeedUpgrade | null;
  /** Permanent utility upgrades (e.g. `auto_harvest`). */
  utilityUpgrades: UtilityUpgradeId[];
  /** Personality log per cat type (most recent personalities at the end). */
  harvestedCats: Partial<Record<CatTypeId, HarvestedCatRecord>>;
  /** Daily quest state (date-scoped). */
  dailyQuests: DailyQuestsState;
  /** Live achievement stats (Set in memory, serialized as array). */
  achievementStats: AchievementStats;
  /** Unlocked achievement ids, in unlock-order. */
  unlockedAchievements: string[];
  lastTickAt: number;

  // ---- ephemeral UI state ----
  toasts: ToastMessage[];
  floatingCoins: FloatingCoin[];
  pendingRecap: PendingRecap | null;
  /** Detailed offline summary modal — separate from pendingRecap. */
  offlineSummary: OfflineSummary | null;
  /** @deprecated Kept for any consumer still reading the old field. */
  activeStormPlot: number | null;
  /** Currently-animating strike, if any. */
  activeStrike: ActiveWeatherStrike | null;
  lastSpin: SpinResult | null;
  /** Bumps whenever a lottery spin starts (useful for sound triggers). */
  lotterySpinKey: number;
  /** Bumps when the lottery prize-modal opens. */
  lotteryResultKey: number;
  coinPulseKey: number;
  /** Pulses when the pointer should bounce after the wheel stops. */
  pointerBounceKey: number;
  /** Last harvested cat with personality — used for in-plot popup. */
  recentHarvest: RecentHarvest | null;
  /** Active full-screen harvest reveal animation. */
  harvestReveal: HarvestReveal | null;
  /** Pending fireworks bursts (achievements, lottery rare wins). */
  fireworks: FireworksBurst[];
  /** Floating sell pop-ups (the big "+1250" number above plots). */
  sellPopUps: SellPopUp[];

  // ---- actions ----
  tick: () => void;
  plantSeed: (plotIndex: number, catType: CatTypeId) => boolean;
  harvestCat: (plotIndex: number) => boolean;
  buySeed: (catType: CatTypeId) => boolean;
  buyUpgrade: (upgradeId: SpeedUpgradeId) => boolean;
  buyUtilityUpgrade: (upgradeId: UtilityUpgradeId) => boolean;
  spinLottery: () => SpinResult | null;
  acknowledgeSpin: () => void;
  toggleReducedMotion: () => void;
  toggleSoundMuted: () => void;
  dismissToast: (id: number) => void;
  dismissRecap: () => void;
  dismissOfflineSummary: () => void;
  acceptOfflineHarvest: () => void;
  harvestAllReady: () => void;
  clearFloatingCoin: (id: number) => void;
  clearRecentHarvest: () => void;
  clearHarvestReveal: () => void;
  clearFirework: (id: number) => void;
  clearSellPopUp: (id: number) => void;
  notifyPointerBounce: () => void;
  claimQuestReward: (questIndex: number) => void;
  updateQuestProgress: (
    type: QuestType,
    amount: number,
    meta?: { catTypeId?: CatTypeId; traitId?: string },
  ) => void;
  forceSave: () => void;
}

const TOAST_DEFAULT_TTL = 3500;
const ACHIEVEMENT_TOAST_TTL = 4000;
const AWAY_RECAP_THRESHOLD_MS = 60_000;
/** Active strike animation lifetime before activeStrike auto-clears. */
const STRIKE_DISPLAY_MS = 1800;
const RECENT_HARVEST_TTL_MS = 2200;

let toastIdCounter = 1;
let floatingCoinIdCounter = 1;
let strikeIdCounter = 1;
let recentHarvestKeyCounter = 1;
let harvestRevealIdCounter = 1;
let fireworkIdCounter = 1;
let sellPopUpIdCounter = 1;

function nowMs(): number {
  return Date.now();
}

/** Compact duration label used as a toast fallback (e.g. "30 min", "1 timme"). */
function formatDurationShort(seconds: number): string {
  if (seconds < 60 * 60) {
    const m = Math.round(seconds / 60);
    return `${m} min`;
  }
  const hours = seconds / 3600;
  if (hours === 1) return '1 timme';
  if (Number.isInteger(hours)) return `${hours} timmar`;
  return `${hours.toFixed(1)} timmar`;
}

function pushToast(
  list: ToastMessage[],
  kind: ToastMessage['kind'],
  title: string,
  body?: string,
  emoji?: string,
): ToastMessage[] {
  const toast: ToastMessage = {
    id: toastIdCounter++,
    kind,
    title,
    ...(body !== undefined ? { body } : {}),
    ...(emoji !== undefined ? { emoji } : {}),
    createdAt: nowMs(),
    ttl: kind === 'achievement' ? ACHIEVEMENT_TOAST_TTL : TOAST_DEFAULT_TTL,
  };
  // Keep at most 4 most-recent toasts.
  const next = [...list, toast];
  return next.length > 4 ? next.slice(next.length - 4) : next;
}

/** Serializes runtime achievement stats (Set → array) for save. */
function serializeAchievementStats(
  stats: AchievementStats,
): SavedAchievementStats {
  return {
    totalHarvested: stats.totalHarvested,
    totalCoinsEarned: stats.totalCoinsEarned,
    catTypesHarvested: Array.from(stats.catTypesHarvested),
    weatherEventsExperienced: stats.weatherEventsExperienced,
    lotteriesSpun: stats.lotteriesSpun,
    upgradesPurchased: stats.upgradesPurchased,
    longestStreak: stats.longestStreak,
    meteorHits: stats.meteorHits,
    harvestedWithMagicalTrait: stats.harvestedWithMagicalTrait,
  };
}

/** Inflates saved stats back into the runtime shape (array → Set). */
function inflateAchievementStats(
  saved: SavedAchievementStats,
): AchievementStats {
  return {
    totalHarvested: saved.totalHarvested,
    totalCoinsEarned: saved.totalCoinsEarned,
    catTypesHarvested: new Set(saved.catTypesHarvested),
    weatherEventsExperienced: saved.weatherEventsExperienced,
    lotteriesSpun: saved.lotteriesSpun,
    upgradesPurchased: saved.upgradesPurchased,
    longestStreak: saved.longestStreak,
    meteorHits: saved.meteorHits,
    harvestedWithMagicalTrait: saved.harvestedWithMagicalTrait,
  };
}

function persistFromState(state: GameState): void {
  const data: SaveData = {
    version: 1,
    coins: state.coins,
    totalEarned: state.totalEarned,
    plots: state.plots,
    seedInventory: state.seedInventory,
    unlockedCatTypes: state.unlockedCatTypes,
    catsSoldByType: state.catsSoldByType,
    lastStormAt: state.lastStormAt,
    weatherCooldowns: state.weatherCooldowns,
    lottery: state.lottery,
    settings: state.settings,
    purchasedUpgrades: state.purchasedUpgrades,
    activeSpeedUpgrade: state.activeSpeedUpgrade,
    utilityUpgrades: state.utilityUpgrades,
    harvestedCats: state.harvestedCats,
    dailyQuests: state.dailyQuests,
    achievementStats: serializeAchievementStats(state.achievementStats),
    unlockedAchievements: state.unlockedAchievements,
    lastTickAt: state.lastTickAt,
  };
  writeSave(data);
}

type InitialStateFields = Omit<
  GameState,
  | 'tick'
  | 'plantSeed'
  | 'harvestCat'
  | 'buySeed'
  | 'buyUpgrade'
  | 'buyUtilityUpgrade'
  | 'spinLottery'
  | 'acknowledgeSpin'
  | 'toggleReducedMotion'
  | 'toggleSoundMuted'
  | 'dismissToast'
  | 'dismissRecap'
  | 'dismissOfflineSummary'
  | 'acceptOfflineHarvest'
  | 'harvestAllReady'
  | 'clearFloatingCoin'
  | 'clearRecentHarvest'
  | 'clearHarvestReveal'
  | 'clearFirework'
  | 'clearSellPopUp'
  | 'notifyPointerBounce'
  | 'claimQuestReward'
  | 'updateQuestProgress'
  | 'forceSave'
>;

function bootstrapInitialState(): InitialStateFields {
  const now = nowMs();
  const hasSave =
    typeof window !== 'undefined' &&
    !!window.localStorage &&
    !!window.localStorage.getItem(SAVE_KEY);
  const save = hasSave ? loadSave(now) : createInitialSave(now);

  // Sync unlocked plots with totalEarned (recompute defensively).
  const unlockedPlots = save.plots.map((p) => {
    const threshold =
      PLOT_UNLOCK_THRESHOLDS[p.index] ?? Number.MAX_SAFE_INTEGER;
    return { ...p, unlocked: save.totalEarned >= threshold };
  });

  // Offline catch-up with personalities, auto-harvest support, etc.
  const activeOnLoad = pruneExpired(save.activeSpeedUpgrade, now);
  const baseSpeedMult = activeMultiplier(activeOnLoad, now);
  // Time capsule doubles offline-time math on top of any active boost.
  const offlineMult = baseSpeedMult * offlineTimeMultiplier(save.utilityUpgrades);
  const autoHarvest = save.utilityUpgrades.includes('auto_harvest');
  const summary = calculateOfflineProgress(
    unlockedPlots,
    save.lastTickAt,
    now,
    offlineMult,
    autoHarvest,
  );

  // Apply offline auto-harvest earnings to coin balances + stats.
  let coins = save.coins + summary.coinsEarned;
  let totalEarned = save.totalEarned + summary.coinsEarned;
  let catsSold = { ...save.catsSoldByType };
  let harvestedCats: Partial<Record<CatTypeId, HarvestedCatRecord>> = {
    ...save.harvestedCats,
  };
  const runtimeStats = inflateAchievementStats(save.achievementStats);

  for (const c of summary.completedPlots) {
    catsSold[c.catTypeId] = (catsSold[c.catTypeId] ?? 0) + 1;
    runtimeStats.totalHarvested += 1;
    runtimeStats.catTypesHarvested.add(c.catTypeId);
    if (c.traitId === 'magical') runtimeStats.harvestedWithMagicalTrait += 1;
    const prev =
      harvestedCats[c.catTypeId] ??
      ({ catTypeId: c.catTypeId, count: 0, personalities: [] } as HarvestedCatRecord);
    harvestedCats[c.catTypeId] = {
      catTypeId: c.catTypeId,
      count: prev.count + 1,
      personalities: [
        ...prev.personalities,
        { name: c.catName, traitId: c.traitId, weatherBonus: c.weatherBonus },
      ],
    };
  }
  runtimeStats.totalCoinsEarned += summary.coinsEarned;

  // Daily quests: refresh if date changed.
  const today = localDateString(now);
  const dailyQuests =
    !save.dailyQuests || save.dailyQuests.date !== today
      ? refreshDailyQuests(save.dailyQuests, today)
      : save.dailyQuests;

  // Update streak in achievement stats from quests data.
  runtimeStats.longestStreak = Math.max(
    runtimeStats.longestStreak,
    dailyQuests.streak,
  );

  const showOfflineSummary =
    hasSave &&
    summary.awayMs >= AWAY_RECAP_THRESHOLD_MS &&
    (summary.completedPlots.length > 0 || summary.readyPlots.length > 0);

  // Legacy pendingRecap is suppressed when the rich OfflineModal will fire.
  const pendingRecap: PendingRecap | null = null;

  return {
    coins,
    totalEarned,
    plots: summary.plots,
    seedInventory: save.seedInventory,
    unlockedCatTypes: save.unlockedCatTypes,
    catsSoldByType: catsSold,
    lastStormAt: save.lastStormAt,
    weatherCooldowns: save.weatherCooldowns ?? {},
    lottery: save.lottery,
    settings: save.settings,
    purchasedUpgrades: save.purchasedUpgrades,
    activeSpeedUpgrade: activeOnLoad,
    utilityUpgrades: save.utilityUpgrades,
    harvestedCats,
    dailyQuests,
    achievementStats: runtimeStats,
    unlockedAchievements: save.unlockedAchievements,
    lastTickAt: now,
    toasts: [],
    floatingCoins: [],
    pendingRecap,
    offlineSummary: showOfflineSummary ? summary : null,
    activeStormPlot: null,
    activeStrike: null,
    lastSpin: null,
    lotterySpinKey: 0,
    lotteryResultKey: 0,
    coinPulseKey: 0,
    pointerBounceKey: 0,
    recentHarvest: null,
    harvestReveal: null,
    fireworks: [],
    sellPopUps: [],
  };
}

/**
 * Checks for newly-unlocked achievements and merges them into state.
 * Returns the patch fragments and the unlocked-list of ids (for sound etc).
 */
function processAchievementUnlocks(
  state: GameState,
): Pick<GameState, 'unlockedAchievements' | 'coins' | 'seedInventory' | 'toasts'> & {
  newlyUnlockedIds: string[];
  totalEarnedDelta: number;
} {
  const fresh = newlyUnlocked(state.achievementStats, state.unlockedAchievements);
  if (fresh.length === 0) {
    return {
      unlockedAchievements: state.unlockedAchievements,
      coins: state.coins,
      seedInventory: state.seedInventory,
      toasts: state.toasts,
      newlyUnlockedIds: [],
      totalEarnedDelta: 0,
    };
  }
  let coins = state.coins;
  let totalEarnedDelta = 0;
  const inv: Record<CatTypeId, number> = { ...state.seedInventory };
  let toasts = state.toasts;
  for (const id of fresh) {
    const a = ACHIEVEMENTS_BY_ID[id];
    if (!a) continue;
    if (a.reward.coins) {
      coins += a.reward.coins;
      totalEarnedDelta += a.reward.coins;
    }
    if (a.reward.seedId) {
      inv[a.reward.seedId] = (inv[a.reward.seedId] ?? 0) + 1;
    }
    const rewardSummary = describeAchievementReward(a.reward);
    toasts = pushToast(
      toasts,
      'achievement',
      a.title,
      rewardSummary,
      a.emoji,
    );
  }
  return {
    unlockedAchievements: [...state.unlockedAchievements, ...fresh],
    coins,
    seedInventory: inv,
    toasts,
    newlyUnlockedIds: fresh,
    totalEarnedDelta,
  };
}

function describeAchievementReward(reward: {
  coins?: number;
  seedId?: CatTypeId;
}): string {
  const parts: string[] = [];
  if (reward.coins) parts.push(`+${reward.coins} mynt`);
  if (reward.seedId) {
    const cat = CAT_TYPES[reward.seedId];
    parts.push(`+1 ${cat.name}-frö`);
  }
  return parts.join(' · ');
}

export const useGameStore = create<GameState>((set, get) => ({
  ...bootstrapInitialState(),

  tick: () => {
    const state = get();
    const now = nowMs();

    // 0. Daily-quest rollover at local midnight.
    const today = localDateString(now);
    let dailyQuests = state.dailyQuests;
    if (state.dailyQuests.date !== today) {
      dailyQuests = refreshDailyQuests(state.dailyQuests, today);
    }

    // Prune expired upgrade so growth math uses post-expiry multiplier.
    const prevActive = state.activeSpeedUpgrade;
    const pruned = pruneExpired(prevActive, now);
    let activeSpeedUpgrade: ActiveSpeedUpgrade | null = pruned;
    const speedMult = activeMultiplier(activeSpeedUpgrade, now);

    let plots = state.plots;
    let weatherCooldowns: Record<string, number | null> = state.weatherCooldowns;
    let activeStormPlot: number | null = state.activeStormPlot;
    let activeStrike: ActiveWeatherStrike | null = state.activeStrike;
    let lastStormAt = state.lastStormAt;
    let toasts = state.toasts;
    let changed = false;

    // Auto-harvest hook: track which plots became ready this tick so we can
    // optionally trigger an auto-harvest action after the tick body.
    const autoHarvest = state.utilityUpgrades.includes('auto_harvest');
    const newlyReady: number[] = [];

    // 1. Mature growing plots into ready.
    plots = plots.map((p) => {
      if (isMature(p, now, speedMult)) {
        changed = true;
        newlyReady.push(p.index);
        return markReady(p);
      }
      return p;
    });

    // 2. Roll weather events.
    const growingIndices = plots
      .map((p, i) => (p.state === 'growing' ? i : -1))
      .filter((i) => i >= 0);

    let weatherFired: WeatherEvent | null = null;
    if (growingIndices.length > 0) {
      const weatherMults = weatherProbabilityMultipliers(state.utilityUpgrades);
      const event: WeatherEvent | null = rollAnyWeatherEvent(
        weatherCooldowns,
        now,
        Math.random,
        weatherMults,
      );
      if (event) {
        const pickIdx =
          growingIndices[Math.floor(Math.random() * growingIndices.length)] ??
          growingIndices[0];
        if (typeof pickIdx === 'number') {
          const bonus = rollWeatherBonus(event);
          const perEventCap = event.canExceed100
            ? Number.POSITIVE_INFINITY
            : 1.0;
          plots = plots.map((p, i) =>
            i === pickIdx
              ? applyWeatherBonus(p, event.id, bonus, perEventCap)
              : p,
          );
          weatherCooldowns = { ...weatherCooldowns, [event.id]: now };
          if (event.id === 'lightning') {
            lastStormAt = now;
            activeStormPlot = pickIdx;
          }
          activeStrike = {
            id: strikeIdCounter++,
            plotIndex: pickIdx,
            eventId: event.id,
            bonus,
            triggeredAt: now,
          };
          const bonusPct = Math.round(bonus * 100);
          toasts = pushToast(
            toasts,
            'lightning',
            `${event.emoji} ${event.name}!`,
            `Plot ${pickIdx + 1} fick +${bonusPct}% värde`,
          );
          weatherFired = event;
          changed = true;
        }
      }
    }

    if (activeStrike && now - activeStrike.triggeredAt > STRIKE_DISPLAY_MS) {
      activeStrike = null;
    }
    if (activeStormPlot !== null && lastStormAt !== null) {
      if (now - lastStormAt > STRIKE_DISPLAY_MS) {
        activeStormPlot = null;
      }
    }

    let speedUpgradeJustExpired = false;
    if (prevActive && !pruned) {
      const u = getUpgradeById(prevActive.upgradeId);
      const label = u?.name ?? 'Hastighet';
      toasts = pushToast(
        toasts,
        'info',
        `${u?.emoji ?? '⏳'} ${label} har tagit slut`,
        'Trädgården växer i normal takt igen.',
      );
      speedUpgradeJustExpired = true;
    }

    // Cull expired toasts.
    toasts = toasts.filter((t) => now - t.createdAt < t.ttl);

    // Recent harvest auto-clear.
    let recentHarvest = state.recentHarvest;
    if (recentHarvest && now - recentHarvest.createdAt > RECENT_HARVEST_TTL_MS) {
      recentHarvest = null;
    }

    // Update achievement stats from weather fired.
    let achievementStats = state.achievementStats;
    if (weatherFired) {
      achievementStats = {
        ...state.achievementStats,
        catTypesHarvested: new Set(state.achievementStats.catTypesHarvested),
        weatherEventsExperienced:
          state.achievementStats.weatherEventsExperienced + 1,
        meteorHits:
          state.achievementStats.meteorHits +
          (weatherFired.id === 'meteor' ? 1 : 0),
      };
      // Propagate weather quest progress (mutation through action below).
    }

    set({
      plots,
      lastStormAt,
      weatherCooldowns,
      activeStormPlot,
      activeStrike,
      activeSpeedUpgrade,
      toasts,
      dailyQuests,
      achievementStats,
      recentHarvest,
      lastTickAt: now,
    });

    if (weatherFired) {
      // Update quest progress + check achievements.
      get().updateQuestProgress('weather_event', 1);
      checkAchievementsInline(set, get);
    }

    // Auto-harvest newly-ready plots if owner.
    if (autoHarvest && newlyReady.length > 0) {
      for (const idx of newlyReady) {
        get().harvestCat(idx);
      }
    }

    if (changed || speedUpgradeJustExpired || weatherFired) {
      persistFromState(get());
    }
  },

  plantSeed: (plotIndex, catType) => {
    const state = get();
    const plot = state.plots[plotIndex];
    if (!plot || !plot.unlocked || plot.state !== 'empty') return false;

    const cat = CAT_TYPES[catType];
    if (!cat) return false;

    const inv = state.seedInventory;
    const have = inv[catType] ?? 0;
    if (!cat.infinite && have <= 0) return false;

    const newInv: Record<CatTypeId, number> = { ...inv };
    if (!cat.infinite) {
      newInv[catType] = have - 1;
    }

    const newPlots = state.plots.map((p, i) =>
      i === plotIndex ? plantInPlot(p, catType, nowMs()) : p,
    );

    set({
      plots: newPlots,
      seedInventory: newInv,
    });
    persistFromState(get());
    return true;
  },

  harvestCat: (plotIndex) => {
    const state = get();
    const plot = state.plots[plotIndex];
    if (!plot || plot.state !== 'ready' || plot.catType === null) return false;

    const baseValue = effectiveSellValue(plot);
    const catId = plot.catType;
    const utilities = state.utilityUpgrades;
    const personality = rollPersonality(Math.random, {
      luckyMagicalBias: luckyMagicalBias(utilities),
      rollExtraTrait: hasCatWhisperer(utilities),
    });
    const { name, traitId, extraTraitId } = personality;
    const traitMult = traitValueMultiplier(traitId);
    // cat_whisperer: second trait stacks multiplicatively on value.
    const extraTraitMult = extraTraitId ? traitValueMultiplier(extraTraitId) : 1;
    // golden_watering_can: +10% on every sale.
    const utilityMult = sellValueMultiplier(utilities);
    const value = Math.max(
      0,
      Math.round(baseValue * traitMult * extraTraitMult * utilityMult),
    );
    const newCoins = state.coins + value;
    const newTotalEarned = state.totalEarned + value;

    const unlockedNow = plotsUnlockedBy(state.totalEarned, newTotalEarned);
    const newPlots = state.plots
      .map((p, i) => (i === plotIndex ? emptyPlotAfterHarvest(p) : p))
      .map((p, i) =>
        unlockedNow.includes(i) ? { ...p, unlocked: true } : p,
      );

    let toasts = state.toasts;
    toasts = pushToast(
      toasts,
      'success',
      `Du tjänade ${value} mynt!`,
      `${CAT_TYPES[catId].name} skördad`,
    );
    for (const idx of unlockedNow) {
      toasts = pushToast(
        toasts,
        'unlock',
        'Ny trädgårdsruta!',
        `Plot ${idx + 1} är upplåst`,
      );
    }

    const newCatsSold: Record<CatTypeId, number> = { ...state.catsSoldByType };
    newCatsSold[catId] = (newCatsSold[catId] ?? 0) + 1;

    let unlockedTypes = state.unlockedCatTypes;
    for (const id of Object.keys(CAT_TYPES) as CatTypeId[]) {
      const c = CAT_TYPES[id];
      const earnedOk =
        c.unlock.totalEarned === null || newTotalEarned >= c.unlock.totalEarned;
      const sellOk =
        c.unlock.graskattsSold === null ||
        (newCatsSold.graskatt ?? 0) >= c.unlock.graskattsSold;
      if (earnedOk && sellOk && !unlockedTypes.includes(id)) {
        unlockedTypes = [...unlockedTypes, id];
        if (id !== 'graskatt') {
          toasts = pushToast(toasts, 'unlock', `Nytt frö: ${c.name}!`);
        }
      }
    }

    const floater: FloatingCoin = {
      id: floatingCoinIdCounter++,
      amount: value,
      plotIndex,
    };

    // Personality log.
    const prevRecord = state.harvestedCats[catId];
    const harvestedCats: Partial<Record<CatTypeId, HarvestedCatRecord>> = {
      ...state.harvestedCats,
      [catId]: {
        catTypeId: catId,
        count: (prevRecord?.count ?? 0) + 1,
        personalities: [
          ...(prevRecord?.personalities ?? []),
          { name, traitId, weatherBonus: plot.lightningBonus },
        ],
      },
    };

    // Achievement stats (immutable copy of Set).
    const achievementStats: AchievementStats = {
      ...state.achievementStats,
      catTypesHarvested: new Set(state.achievementStats.catTypesHarvested),
      totalHarvested: state.achievementStats.totalHarvested + 1,
      totalCoinsEarned: state.achievementStats.totalCoinsEarned + value,
      harvestedWithMagicalTrait:
        state.achievementStats.harvestedWithMagicalTrait +
        (traitId === 'magical' ? 1 : 0),
    };
    achievementStats.catTypesHarvested.add(catId);

    const rarity = CAT_TYPES[catId].rarity;
    const harvestReveal: HarvestReveal = {
      id: harvestRevealIdCounter++,
      catTypeId: catId,
      rarity,
      plotIndex,
      createdAt: nowMs(),
    };
    const sellPopUp: SellPopUp = {
      id: sellPopUpIdCounter++,
      amount: value,
      rarity,
      plotIndex,
      createdAt: nowMs(),
    };
    // Fireworks burst only for legendary/mythic harvests.
    const fireworks =
      rarity === 'legendary' || rarity === 'mythic'
        ? [
            ...state.fireworks,
            {
              id: fireworkIdCounter++,
              tint:
                rarity === 'mythic' ? '#f8bbd0' : '#ffe082',
              createdAt: nowMs(),
            },
          ]
        : state.fireworks;

    set({
      coins: newCoins,
      totalEarned: newTotalEarned,
      plots: newPlots,
      toasts,
      catsSoldByType: newCatsSold,
      unlockedCatTypes: unlockedTypes,
      harvestedCats,
      achievementStats,
      floatingCoins: [...state.floatingCoins, floater],
      sellPopUps: [...state.sellPopUps, sellPopUp],
      harvestReveal,
      fireworks,
      coinPulseKey: state.coinPulseKey + 1,
      recentHarvest: {
        catTypeId: catId,
        name,
        traitId,
        plotIndex,
        key: recentHarvestKeyCounter++,
        createdAt: nowMs(),
      },
    });

    // Quest progress (separate from sell-coins — harvest_any + sell_coins both fire).
    get().updateQuestProgress('harvest_any', 1, { catTypeId: catId, traitId });
    get().updateQuestProgress('harvest_type', 1, {
      catTypeId: catId,
      traitId,
    });
    get().updateQuestProgress('harvest_with_trait', 1, {
      catTypeId: catId,
      traitId,
    });
    get().updateQuestProgress('sell_coins', value);

    checkAchievementsInline(set, get);
    persistFromState(get());
    return true;
  },

  harvestAllReady: () => {
    const state = get();
    const readyIndices = state.plots
      .map((p, i) => (p.state === 'ready' ? i : -1))
      .filter((i) => i >= 0);
    for (const idx of readyIndices) {
      get().harvestCat(idx);
    }
  },

  buySeed: (catType) => {
    const state = get();
    const cat = CAT_TYPES[catType];
    if (!cat || cat.infinite) return false;
    if (!state.unlockedCatTypes.includes(catType)) return false;
    if (state.coins < cat.seedCost) return false;

    // Respect inventory cap (5 base, 10 with `extra_seed_slot`).
    const cap = seedInventoryCap(state.utilityUpgrades);
    const have = state.seedInventory[catType] ?? 0;
    if (have >= cap) {
      set({
        toasts: pushToast(
          state.toasts,
          'info',
          `Fröpåsen är full`,
          `Max ${cap} ${cat.name}-frön åt gången`,
        ),
      });
      return false;
    }

    const newInv: Record<CatTypeId, number> = {
      ...state.seedInventory,
      [catType]: have + 1,
    };

    set({
      coins: state.coins - cat.seedCost,
      seedInventory: newInv,
      toasts: pushToast(
        state.toasts,
        'info',
        `Köpte 1 ${cat.name}-frö`,
        `Kostade ${cat.seedCost} mynt`,
      ),
    });
    persistFromState(get());
    return true;
  },

  buyUpgrade: (upgradeId) => {
    const state = get();
    const upgrade = getUpgradeById(upgradeId);
    if (!upgrade) return false;
    if (state.coins < upgrade.cost) return false;

    const now = nowMs();
    const next = makeActiveUpgrade(upgradeId, now);
    if (!next) return false;

    const prev = pruneExpired(state.activeSpeedUpgrade, now);
    const replacing = prev !== null;

    set({
      coins: state.coins - upgrade.cost,
      activeSpeedUpgrade: next,
      achievementStats: {
        ...state.achievementStats,
        catTypesHarvested: new Set(state.achievementStats.catTypesHarvested),
        upgradesPurchased: state.achievementStats.upgradesPurchased + 1,
      },
      toasts: pushToast(
        state.toasts,
        'success',
        `${upgrade.emoji} ${upgrade.name} aktiverad!`,
        replacing
          ? `Ersatte föregående boost — nu ${upgrade.multiplier}x i ${upgrade.description.split(' i ')[1] ?? formatDurationShort(upgrade.durationSeconds)}.`
          : `Odlingen är nu ${upgrade.multiplier}x snabbare i ${upgrade.description.split(' i ')[1] ?? formatDurationShort(upgrade.durationSeconds)}.`,
      ),
    });
    checkAchievementsInline(set, get);
    persistFromState(get());
    return true;
  },

  buyUtilityUpgrade: (upgradeId) => {
    const state = get();
    const upgrade = getUtilityUpgradeById(upgradeId);
    if (!upgrade) return false;
    if (state.utilityUpgrades.includes(upgradeId)) return false;
    if (state.coins < upgrade.cost) return false;

    set({
      coins: state.coins - upgrade.cost,
      utilityUpgrades: [...state.utilityUpgrades, upgradeId],
      toasts: pushToast(
        state.toasts,
        'success',
        `${upgrade.emoji} ${upgrade.name} köpt!`,
        upgrade.description,
      ),
    });
    persistFromState(get());
    return true;
  },

  spinLottery: () => {
    const state = get();
    const now = nowMs();
    const freeAvailable = isFreeSpinAvailable(
      state.lottery.lastFreeSpinAt,
      now,
    );
    const todayKey = localDateString(now);

    let coins = state.coins;
    let lastFreeSpinAt = state.lottery.lastFreeSpinAt;
    let spinsToday = state.lottery.spinsToday;
    if (state.lottery.spinsTodayDate !== todayKey) {
      spinsToday = 0;
    }
    const spinsTodayDate = todayKey;

    if (freeAvailable) {
      lastFreeSpinAt = now;
    } else {
      if (coins < PAID_SPIN_COST) return null;
      coins -= PAID_SPIN_COST;
    }
    spinsToday += 1;

    const sectorIndex = rollLottery();
    const sector = LOTTERY_SECTORS[sectorIndex];
    if (!sector) return null;
    const prize = sector.prize;

    let newCoins = coins;
    let totalEarned = state.totalEarned;
    const newInv: Record<CatTypeId, number> = { ...state.seedInventory };
    let unlockedTypes = state.unlockedCatTypes;
    let toasts = state.toasts;

    let lotteryFireworks: FireworksBurst[] = [];
    if (prize.kind === 'coins' && prize.coins !== undefined) {
      newCoins += prize.coins;
      totalEarned += prize.coins;
      toasts = pushToast(
        toasts,
        'success',
        `Vinst: ${prize.coins} mynt!`,
        'Tack för att du snurrade',
      );
      // Big-coin wins (>= 500) get fireworks.
      if (prize.coins >= 500) {
        lotteryFireworks = [
          {
            id: fireworkIdCounter++,
            tint: '#ffd56b',
            createdAt: nowMs(),
          },
        ];
      }
    } else if (prize.kind === 'seed' && prize.seedId) {
      newInv[prize.seedId] = (newInv[prize.seedId] ?? 0) + 1;
      if (!unlockedTypes.includes(prize.seedId)) {
        unlockedTypes = [...unlockedTypes, prize.seedId];
      }
      toasts = pushToast(toasts, 'success', `Vinst: ${prize.label}!`);
      // Rare seed wins (rare+ rarity) get fireworks.
      const seedRarity = CAT_TYPES[prize.seedId]?.rarity;
      if (
        seedRarity === 'rare' ||
        seedRarity === 'epic' ||
        seedRarity === 'legendary' ||
        seedRarity === 'mythic'
      ) {
        const tintByRarity: Record<string, string> = {
          rare: '#d1c4e9',
          epic: '#ffccbc',
          legendary: '#ffe082',
          mythic: '#f8bbd0',
        };
        lotteryFireworks = [
          {
            id: fireworkIdCounter++,
            tint: tintByRarity[seedRarity] ?? '#ffd56b',
            createdAt: nowMs(),
          },
        ];
      }
    }

    const unlockedPlotIndices = plotsUnlockedBy(state.totalEarned, totalEarned);
    let plots = state.plots;
    for (const idx of unlockedPlotIndices) {
      plots = plots.map((p, i) => (i === idx ? { ...p, unlocked: true } : p));
      toasts = pushToast(
        toasts,
        'unlock',
        'Ny trädgårdsruta!',
        `Plot ${idx + 1} är upplåst`,
      );
    }

    const sectorAngle = 360 / LOTTERY_SECTORS.length;
    const sectorCenter = sectorIndex * sectorAngle + sectorAngle / 2;
    const spinAngle = 5 * 360 + ((360 - sectorCenter) % 360);

    const result: SpinResult = { sectorIndex, spinAngle };

    const achievementStats: AchievementStats = {
      ...state.achievementStats,
      catTypesHarvested: new Set(state.achievementStats.catTypesHarvested),
      lotteriesSpun: state.achievementStats.lotteriesSpun + 1,
      totalCoinsEarned:
        state.achievementStats.totalCoinsEarned +
        (prize.kind === 'coins' && prize.coins ? prize.coins : 0),
    };

    set({
      coins: newCoins,
      totalEarned,
      seedInventory: newInv,
      unlockedCatTypes: unlockedTypes,
      plots,
      lottery: {
        lastFreeSpinAt,
        spinsToday,
        spinsTodayDate,
      },
      toasts,
      lastSpin: result,
      lotterySpinKey: state.lotterySpinKey + 1,
      coinPulseKey:
        prize.kind === 'coins' ? state.coinPulseKey + 1 : state.coinPulseKey,
      achievementStats,
      fireworks: [...state.fireworks, ...lotteryFireworks],
    });

    get().updateQuestProgress('spin_lottery', 1);
    checkAchievementsInline(set, get);
    persistFromState(get());
    return result;
  },

  acknowledgeSpin: () => set({ lastSpin: null }),

  notifyPointerBounce: () =>
    set({ pointerBounceKey: get().pointerBounceKey + 1 }),

  toggleReducedMotion: () => {
    const s = get();
    set({
      settings: { ...s.settings, reducedMotion: !s.settings.reducedMotion },
    });
    persistFromState(get());
  },

  toggleSoundMuted: () => {
    const s = get();
    set({
      settings: { ...s.settings, soundMuted: !s.settings.soundMuted },
    });
    persistFromState(get());
  },

  dismissToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  dismissRecap: () => set({ pendingRecap: null }),
  dismissOfflineSummary: () => set({ offlineSummary: null }),

  acceptOfflineHarvest: () => {
    // If there are non-auto-harvested ready plots from the offline summary,
    // harvest them all now.
    const state = get();
    if (!state.offlineSummary) return;
    const readyIndices = state.offlineSummary.readyPlots.map((r) => r.plotIndex);
    set({ offlineSummary: null, pendingRecap: null });
    for (const idx of readyIndices) {
      get().harvestCat(idx);
    }
  },

  clearFloatingCoin: (id) => {
    set({ floatingCoins: get().floatingCoins.filter((c) => c.id !== id) });
  },

  clearRecentHarvest: () => set({ recentHarvest: null }),

  clearHarvestReveal: () => set({ harvestReveal: null }),

  clearFirework: (id) => {
    set({ fireworks: get().fireworks.filter((f) => f.id !== id) });
  },

  clearSellPopUp: (id) => {
    set({ sellPopUps: get().sellPopUps.filter((p) => p.id !== id) });
  },

  updateQuestProgress: (type, amount, meta) => {
    const state = get();
    const nextQuests = applyQuestProgress(
      state.dailyQuests.quests,
      type,
      amount,
      meta,
    );
    if (nextQuests === state.dailyQuests.quests) return;
    set({
      dailyQuests: { ...state.dailyQuests, quests: nextQuests },
    });
    persistFromState(get());
  },

  claimQuestReward: (questIndex) => {
    const state = get();
    const entry = state.dailyQuests.quests[questIndex];
    if (!entry || !entry.completed || entry.rewardClaimed) return;
    const template = getQuestTemplate(entry.templateId);
    if (!template) return;

    const newInv: Record<CatTypeId, number> = { ...state.seedInventory };
    let coins = state.coins + template.reward.coins;
    let totalEarned = state.totalEarned + template.reward.coins;
    if (template.reward.seedId) {
      newInv[template.reward.seedId] =
        (newInv[template.reward.seedId] ?? 0) + 1;
    }

    const nextQuests = state.dailyQuests.quests.map((q, i) =>
      i === questIndex ? { ...q, rewardClaimed: true } : q,
    );

    // Bump streak if this is the first claim today.
    const hadAnyClaimed = state.dailyQuests.quests.some(
      (q) => q.rewardClaimed,
    );
    const streak = hadAnyClaimed
      ? state.dailyQuests.streak
      : state.dailyQuests.streak + 1;

    let toasts = pushToast(
      state.toasts,
      'success',
      `Uppdrag klart!`,
      `${template.title} · +${template.reward.coins} mynt`,
    );
    if (template.reward.seedId) {
      const cat = CAT_TYPES[template.reward.seedId];
      toasts = pushToast(
        toasts,
        'unlock',
        `Bonus: ${cat.name}-frö!`,
        'Lägg i butiken för att plantera',
      );
    }

    const achievementStats: AchievementStats = {
      ...state.achievementStats,
      catTypesHarvested: new Set(state.achievementStats.catTypesHarvested),
      totalCoinsEarned:
        state.achievementStats.totalCoinsEarned + template.reward.coins,
      longestStreak: Math.max(state.achievementStats.longestStreak, streak),
    };

    set({
      coins,
      totalEarned,
      seedInventory: newInv,
      dailyQuests: {
        ...state.dailyQuests,
        quests: nextQuests,
        streak,
        lastCompletedDate: state.dailyQuests.date,
      },
      toasts,
      achievementStats,
      coinPulseKey: state.coinPulseKey + 1,
    });
    checkAchievementsInline(set, get);
    persistFromState(get());
  },

  forceSave: () => {
    persistFromState(get());
  },
}));

/**
 * After mutating achievement stats, call this to detect newly-unlocked
 * achievements, apply their rewards, and queue toasts.
 *
 * Note: this is intentionally module-scoped (not an action method) so we
 * can call it from inside other actions without re-binding `this`.
 */
function checkAchievementsInline(
  set: (
    partial:
      | Partial<GameState>
      | ((state: GameState) => Partial<GameState>),
  ) => void,
  get: () => GameState,
): void {
  const state = get();
  const result = processAchievementUnlocks(state);
  if (result.newlyUnlockedIds.length === 0) return;
  // One fireworks burst per newly-unlocked achievement (max 3 stacked).
  const newFireworks = result.newlyUnlockedIds.slice(0, 3).map((_, i) => ({
    id: fireworkIdCounter++,
    tint: i === 0 ? '#ffd56b' : i === 1 ? '#ff8fa3' : '#a8c5ff',
    createdAt: nowMs(),
  }));
  set({
    coins: result.coins,
    seedInventory: result.seedInventory,
    toasts: result.toasts,
    unlockedAchievements: result.unlockedAchievements,
    totalEarned: state.totalEarned + result.totalEarnedDelta,
    fireworks: [...state.fireworks, ...newFireworks],
    coinPulseKey:
      result.totalEarnedDelta > 0 ? state.coinPulseKey + 1 : state.coinPulseKey,
  });
}
