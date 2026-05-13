/**
 * Plot state machine: empty | growing | ready (+ locked at top level).
 * Pure logic. No React imports.
 */

import type { CatTypeId } from './catTypes';
import { CAT_TYPES } from './catTypes';

export type PlotStateKind = 'empty' | 'growing' | 'ready';

export interface PlotState {
  index: number;
  unlocked: boolean;
  state: PlotStateKind;
  catType: CatTypeId | null;
  /** Epoch ms when the seed was planted, null when empty. */
  plantedAt: number | null;
  /**
   * Additive total bonus from all weather events (sum of breakdown), capped at
   * WEATHER_BONUS_CAP (5.0 = +500%). Kept under the legacy `lightningBonus`
   * name for save-data compatibility. New code should read this via
   * `effectiveSellValue(plot)` or `plot.weatherBonusTotal`.
   */
  lightningBonus: number;
  /** Ordered list of weather event ids that hit this plot during growth. */
  weatherEvents: string[];
  /** Per-event accumulated bonus magnitude (event id → additive bonus). */
  weatherBonusBreakdown: Record<string, number>;
}

export const MAX_PLOTS = 12;

/** Lifetime earned thresholds for each plot index (0-based). */
export const PLOT_UNLOCK_THRESHOLDS: readonly number[] = [
  0, // Plot 1 — always unlocked
  200, // Plot 2
  800, // Plot 3
  3000, // Plot 4
  10000, // Plot 5
  50000, // Plot 6
  150000, // Plot 7
  400000, // Plot 8
  1000000, // Plot 9
  3000000, // Plot 10
  8000000, // Plot 11
  20000000, // Plot 12
];

export function createEmptyPlot(index: number, unlocked: boolean): PlotState {
  return {
    index,
    unlocked,
    state: 'empty',
    catType: null,
    plantedAt: null,
    lightningBonus: 0,
    weatherEvents: [],
    weatherBonusBreakdown: {},
  };
}

export function createDefaultPlots(): PlotState[] {
  return Array.from({ length: MAX_PLOTS }, (_, i) =>
    createEmptyPlot(i, i === 0),
  );
}

export function plotUnlockThreshold(index: number): number {
  const threshold = PLOT_UNLOCK_THRESHOLDS[index];
  return threshold ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Returns true if the given plot index should be unlocked at the given
 * lifetime earned amount.
 */
export function shouldPlotBeUnlocked(
  index: number,
  totalEarned: number,
): boolean {
  return totalEarned >= plotUnlockThreshold(index);
}

/**
 * Returns elapsed growth ratio in [0, 1]. 0 if not growing.
 * `speedMultiplier` (default 1) accelerates virtual elapsed time.
 */
export function growthProgress(
  plot: PlotState,
  now: number,
  speedMultiplier: number = 1,
): number {
  if (
    plot.state !== 'growing' ||
    plot.catType === null ||
    plot.plantedAt === null
  ) {
    return plot.state === 'ready' ? 1 : 0;
  }
  const cat = CAT_TYPES[plot.catType];
  const elapsed = (now - plot.plantedAt) * Math.max(0.0001, speedMultiplier);
  if (elapsed <= 0) return 0;
  if (elapsed >= cat.growMs) return 1;
  return elapsed / cat.growMs;
}

/**
 * Returns 0/1/2 visual growth stage based on progress.
 */
export function growthStage(progress: number): 0 | 1 | 2 {
  if (progress >= 0.66) return 2;
  if (progress >= 0.33) return 1;
  return 0;
}

/**
 * Returns wall-clock time remaining in ms (clamped to >= 0).
 * `speedMultiplier` (default 1) shortens the perceived remaining time.
 */
export function timeRemaining(
  plot: PlotState,
  now: number,
  speedMultiplier: number = 1,
): number {
  if (
    plot.state !== 'growing' ||
    plot.catType === null ||
    plot.plantedAt === null
  )
    return 0;
  const cat = CAT_TYPES[plot.catType];
  const mult = Math.max(0.0001, speedMultiplier);
  const effectiveGrowMs = cat.growMs / mult;
  return Math.max(0, plot.plantedAt + effectiveGrowMs - now);
}

/**
 * Returns true if a growing plot has reached maturity (state should flip to ready).
 * `speedMultiplier` accelerates ripening.
 */
export function isMature(
  plot: PlotState,
  now: number,
  speedMultiplier: number = 1,
): boolean {
  if (
    plot.state !== 'growing' ||
    plot.catType === null ||
    plot.plantedAt === null
  )
    return false;
  const cat = CAT_TYPES[plot.catType];
  const mult = Math.max(0.0001, speedMultiplier);
  return (now - plot.plantedAt) * mult >= cat.growMs;
}

/**
 * Returns a new plot with the seed planted. Pure.
 */
export function plantInPlot(
  plot: PlotState,
  catType: CatTypeId,
  now: number,
): PlotState {
  return {
    ...plot,
    state: 'growing',
    catType,
    plantedAt: now,
    lightningBonus: 0,
    weatherEvents: [],
    weatherBonusBreakdown: {},
  };
}

/**
 * Returns a new plot reset to empty. Pure.
 */
export function emptyPlotAfterHarvest(plot: PlotState): PlotState {
  return {
    ...plot,
    state: 'empty',
    catType: null,
    plantedAt: null,
    lightningBonus: 0,
    weatherEvents: [],
    weatherBonusBreakdown: {},
  };
}

/**
 * Returns a new plot with state flipped to 'ready'. Pure.
 */
export function markReady(plot: PlotState): PlotState {
  if (plot.state === 'ready') return plot;
  return { ...plot, state: 'ready' };
}

/** Total weather bonus across all events is capped at +500% (5.0). */
export const WEATHER_BONUS_TOTAL_CAP = 5.0;

/**
 * Legacy helper retained for callers/tests that only think in terms of
 * lightning. Caps a single event id ("lightning") at +100% while still
 * obeying the global total cap.
 */
export function applyLightningBonus(
  plot: PlotState,
  bonus: number,
): PlotState {
  return applyWeatherBonus(plot, 'lightning', bonus, 1.0);
}

/**
 * Returns a new plot with an additional bonus from a weather event of the
 * given id. Multiple distinct events stack additively up to
 * WEATHER_BONUS_TOTAL_CAP. Repeat strikes of the same event id are bounded
 * by `perEventCap` (default Infinity — single events such as Tornado or
 * Meteor can exceed 100%).
 *
 * The first time a given event id strikes, it is appended to `weatherEvents`
 * so the UI can render its badge; subsequent strikes of the same event id
 * just increase that event's bonus magnitude.
 */
export function applyWeatherBonus(
  plot: PlotState,
  eventId: string,
  bonus: number,
  perEventCap: number = Number.POSITIVE_INFINITY,
): PlotState {
  const existing = plot.weatherBonusBreakdown[eventId] ?? 0;
  const eventRemaining = Math.max(0, perEventCap - existing);
  const totalRemaining = Math.max(
    0,
    WEATHER_BONUS_TOTAL_CAP - plot.lightningBonus,
  );
  const clamped = Math.min(eventRemaining, totalRemaining, Math.max(0, bonus));
  if (clamped <= 0) return plot;

  const breakdown: Record<string, number> = {
    ...plot.weatherBonusBreakdown,
    [eventId]: existing + clamped,
  };
  const events = plot.weatherEvents.includes(eventId)
    ? plot.weatherEvents
    : [...plot.weatherEvents, eventId];

  return {
    ...plot,
    lightningBonus: plot.lightningBonus + clamped,
    weatherEvents: events,
    weatherBonusBreakdown: breakdown,
  };
}

/**
 * Calculates the effective sell value at harvest including weather bonuses.
 */
export function effectiveSellValue(plot: PlotState): number {
  if (plot.catType === null) return 0;
  const base = CAT_TYPES[plot.catType].sellValue;
  return Math.round(base * (1 + plot.lightningBonus));
}
