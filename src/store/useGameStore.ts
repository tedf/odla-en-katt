/**
 * Zustand store — the bridge between pure domain logic and React UI.
 *
 * Holds the entire game state (coins, plots, inventory, lottery state)
 * and exposes actions. Persists to localStorage on every meaningful change.
 */

import { create } from 'zustand';
import { CAT_TYPES, type CatTypeId } from '../domain/catTypes';
import {
  applyLightningBonus,
  effectiveSellValue,
  emptyPlotAfterHarvest,
  isMature,
  markReady,
  plantInPlot,
  type PlotState,
} from '../domain/plots';
import {
  isLightningOffCooldown,
  rollLightningBonus,
  rollLightningTrigger,
  LIGHTNING_BASE_CHANCE_PER_SEC,
} from '../domain/lightning';
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
  type SaveData,
} from '../domain/persistence';
import { applyOfflineCatchup } from '../domain/time';
import {
  activeSpeedMultiplier,
  getUpgradeById,
  type SpeedUpgradeId,
} from '../domain/upgrades';

export interface ToastMessage {
  id: number;
  kind: 'info' | 'success' | 'lightning' | 'unlock';
  title: string;
  body?: string;
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

export interface GameState {
  // ---- save fields ----
  coins: number;
  totalEarned: number;
  plots: PlotState[];
  seedInventory: Record<CatTypeId, number>;
  unlockedCatTypes: CatTypeId[];
  catsSoldByType: Record<CatTypeId, number>;
  lastStormAt: number | null;
  lottery: {
    lastFreeSpinAt: number | null;
    spinsToday: number;
    spinsTodayDate: string;
  };
  settings: {
    reducedMotion: boolean;
    soundMuted: boolean;
  };
  purchasedUpgrades: SpeedUpgradeId[];
  lastTickAt: number;

  // ---- ephemeral UI state ----
  toasts: ToastMessage[];
  floatingCoins: FloatingCoin[];
  pendingRecap: PendingRecap | null;
  activeStormPlot: number | null;
  lastSpin: SpinResult | null;
  /** Bumps whenever a lottery spin starts (useful for sound triggers). */
  lotterySpinKey: number;
  /** Bumps when the lottery prize-modal opens. */
  lotteryResultKey: number;
  coinPulseKey: number;
  /** Pulses when the pointer should bounce after the wheel stops. */
  pointerBounceKey: number;

  // ---- actions ----
  tick: () => void;
  plantSeed: (plotIndex: number, catType: CatTypeId) => boolean;
  harvestCat: (plotIndex: number) => boolean;
  buySeed: (catType: CatTypeId) => boolean;
  buyUpgrade: (upgradeId: SpeedUpgradeId) => boolean;
  spinLottery: () => SpinResult | null;
  acknowledgeSpin: () => void;
  toggleReducedMotion: () => void;
  toggleSoundMuted: () => void;
  dismissToast: (id: number) => void;
  dismissRecap: () => void;
  harvestAllReady: () => void;
  clearFloatingCoin: (id: number) => void;
  notifyPointerBounce: () => void;
  forceSave: () => void;
}

const TOAST_DEFAULT_TTL = 3500;
const AWAY_RECAP_THRESHOLD_MS = 60_000;
const PLOT_THRESHOLDS = [0, 200, 800, 3000, 10000, 50000];

let toastIdCounter = 1;
let floatingCoinIdCounter = 1;

function nowMs(): number {
  return Date.now();
}

function pushToast(
  list: ToastMessage[],
  kind: ToastMessage['kind'],
  title: string,
  body?: string,
): ToastMessage[] {
  const toast: ToastMessage = {
    id: toastIdCounter++,
    kind,
    title,
    ...(body !== undefined ? { body } : {}),
    createdAt: nowMs(),
    ttl: TOAST_DEFAULT_TTL,
  };
  // Keep at most 4 most-recent toasts.
  const next = [...list, toast];
  return next.length > 4 ? next.slice(next.length - 4) : next;
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
    lottery: state.lottery,
    settings: state.settings,
    purchasedUpgrades: state.purchasedUpgrades,
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
  | 'spinLottery'
  | 'acknowledgeSpin'
  | 'toggleReducedMotion'
  | 'toggleSoundMuted'
  | 'dismissToast'
  | 'dismissRecap'
  | 'harvestAllReady'
  | 'clearFloatingCoin'
  | 'notifyPointerBounce'
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
    const threshold = PLOT_THRESHOLDS[p.index] ?? Number.MAX_SAFE_INTEGER;
    return { ...p, unlocked: save.totalEarned >= threshold };
  });

  // Offline catch-up — speed multiplier compresses elapsed time.
  const speedMult = activeSpeedMultiplier(save.purchasedUpgrades);
  const awayMs = Math.max(0, now - save.lastTickAt);
  const { plots: caughtUp, recap } = applyOfflineCatchup(
    unlockedPlots,
    now,
    awayMs,
    speedMult,
  );

  const pendingRecap: PendingRecap | null =
    hasSave && awayMs >= AWAY_RECAP_THRESHOLD_MS && recap.totalPlotsAffected > 0
      ? { readyPlots: recap.readyPlots, awayMs }
      : null;

  return {
    coins: save.coins,
    totalEarned: save.totalEarned,
    plots: caughtUp,
    seedInventory: save.seedInventory,
    unlockedCatTypes: save.unlockedCatTypes,
    catsSoldByType: save.catsSoldByType,
    lastStormAt: save.lastStormAt,
    lottery: save.lottery,
    settings: save.settings,
    purchasedUpgrades: save.purchasedUpgrades,
    lastTickAt: now,
    toasts: [],
    floatingCoins: [],
    pendingRecap,
    activeStormPlot: null,
    lastSpin: null,
    lotterySpinKey: 0,
    lotteryResultKey: 0,
    coinPulseKey: 0,
    pointerBounceKey: 0,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...bootstrapInitialState(),

  tick: () => {
    const state = get();
    const now = nowMs();
    const speedMult = activeSpeedMultiplier(state.purchasedUpgrades);

    let plots = state.plots;
    let lastStormAt = state.lastStormAt;
    let activeStormPlot: number | null = state.activeStormPlot;
    let toasts = state.toasts;
    let changed = false;

    // 1. Mature growing plots into ready (speed multiplier accelerates ripening).
    plots = plots.map((p) => {
      if (isMature(p, now, speedMult)) {
        changed = true;
        return markReady(p);
      }
      return p;
    });

    // 2. Lightning roll, respecting global cooldown.
    if (isLightningOffCooldown(lastStormAt, now)) {
      const growingIndices = plots
        .map((p, i) => (p.state === 'growing' ? i : -1))
        .filter((i) => i >= 0);

      for (const idx of growingIndices) {
        if (rollLightningTrigger(LIGHTNING_BASE_CHANCE_PER_SEC)) {
          const bonus = rollLightningBonus();
          const plot = plots[idx];
          if (!plot) continue;
          plots = plots.map((p, i) =>
            i === idx ? applyLightningBonus(p, bonus) : p,
          );
          lastStormAt = now;
          activeStormPlot = idx;
          const bonusPct = Math.round(bonus * 100);
          toasts = pushToast(
            toasts,
            'lightning',
            'Blixtbonus!',
            `Plot ${idx + 1} fick +${bonusPct}% värde`,
          );
          changed = true;
          break; // only one storm per tick
        }
      }
    }

    // Auto-clear active storm visualization after a moment.
    if (activeStormPlot !== null && lastStormAt !== null) {
      if (now - lastStormAt > 1500) {
        activeStormPlot = null;
      }
    }

    // 3. Cull expired toasts by ttl.
    toasts = toasts.filter((t) => now - t.createdAt < t.ttl);

    set({
      plots,
      lastStormAt,
      activeStormPlot,
      toasts,
      lastTickAt: now,
    });

    if (changed) {
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

    const value = effectiveSellValue(plot);
    const catId = plot.catType;
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

    // Per-type sold counter
    const newCatsSold: Record<CatTypeId, number> = { ...state.catsSoldByType };
    newCatsSold[catId] = (newCatsSold[catId] ?? 0) + 1;

    // Unlocked cat types (for shop visibility)
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

    set({
      coins: newCoins,
      totalEarned: newTotalEarned,
      plots: newPlots,
      toasts,
      catsSoldByType: newCatsSold,
      unlockedCatTypes: unlockedTypes,
      floatingCoins: [...state.floatingCoins, floater],
      coinPulseKey: state.coinPulseKey + 1,
    });
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

    const newInv: Record<CatTypeId, number> = {
      ...state.seedInventory,
      [catType]: (state.seedInventory[catType] ?? 0) + 1,
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
    if (state.purchasedUpgrades.includes(upgradeId)) return false;
    if (state.coins < upgrade.cost) return false;

    set({
      coins: state.coins - upgrade.cost,
      purchasedUpgrades: [...state.purchasedUpgrades, upgradeId],
      toasts: pushToast(
        state.toasts,
        'success',
        `${upgrade.name} aktiverad!`,
        `Odlingen är nu ${upgrade.multiplier}x snabbare`,
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

    if (prize.kind === 'coins' && prize.coins !== undefined) {
      newCoins += prize.coins;
      totalEarned += prize.coins;
      toasts = pushToast(
        toasts,
        'success',
        `Vinst: ${prize.coins} mynt!`,
        'Tack för att du snurrade',
      );
    } else if (prize.kind === 'seed' && prize.seedId) {
      newInv[prize.seedId] = (newInv[prize.seedId] ?? 0) + 1;
      if (!unlockedTypes.includes(prize.seedId)) {
        unlockedTypes = [...unlockedTypes, prize.seedId];
      }
      toasts = pushToast(toasts, 'success', `Vinst: ${prize.label}!`);
    }

    // Plot unlocks for newly-added totalEarned (lottery coin prizes)
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

    // spinAngle is informational only; the LotteryWheel component computes
    // its own delta from the current rotation so it always lands precisely
    // under the pointer (see component for the geometry comment).
    const sectorAngle = 360 / LOTTERY_SECTORS.length;
    const sectorCenter = sectorIndex * sectorAngle + sectorAngle / 2;
    const spinAngle = 5 * 360 + ((360 - sectorCenter) % 360);

    const result: SpinResult = { sectorIndex, spinAngle };

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
    });
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

  clearFloatingCoin: (id) => {
    set({ floatingCoins: get().floatingCoins.filter((c) => c.id !== id) });
  },

  forceSave: () => {
    persistFromState(get());
  },
}));
