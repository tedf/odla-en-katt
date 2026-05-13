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
  /** Additive bonus from lightning strikes (0..1.0). */
  lightningBonus: number;
}

export const MAX_PLOTS = 6;

/** Lifetime earned thresholds for each plot index (0-based). */
export const PLOT_UNLOCK_THRESHOLDS: readonly number[] = [
  0,
  200,
  800,
  3000,
  10000,
  50000,
];

export function createEmptyPlot(index: number, unlocked: boolean): PlotState {
  return {
    index,
    unlocked,
    state: 'empty',
    catType: null,
    plantedAt: null,
    lightningBonus: 0,
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
  };
}

/**
 * Returns a new plot with state flipped to 'ready'. Pure.
 */
export function markReady(plot: PlotState): PlotState {
  if (plot.state === 'ready') return plot;
  return { ...plot, state: 'ready' };
}

/**
 * Returns a new plot with an added lightning bonus, capped at +100%.
 */
export function applyLightningBonus(
  plot: PlotState,
  bonus: number,
): PlotState {
  const next = Math.min(1.0, plot.lightningBonus + bonus);
  return { ...plot, lightningBonus: next };
}

/**
 * Calculates the effective sell value at harvest including lightning bonus.
 */
export function effectiveSellValue(plot: PlotState): number {
  if (plot.catType === null) return 0;
  const base = CAT_TYPES[plot.catType].sellValue;
  return Math.round(base * (1 + plot.lightningBonus));
}
