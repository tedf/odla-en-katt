/**
 * Economy helpers: purchase math, plot unlock checks.
 */

import type { CatType } from './catTypes';
import { CAT_TYPE_ORDER, CAT_TYPES } from './catTypes';
import { plotUnlockThreshold, MAX_PLOTS } from './plots';

export interface PurchaseResult {
  ok: boolean;
  reason?: 'insufficient-funds' | 'locked';
}

export function canAfford(coins: number, cost: number): boolean {
  return coins >= cost;
}

export function tryPurchase(
  coins: number,
  cost: number,
  unlocked: boolean,
): PurchaseResult {
  if (!unlocked) return { ok: false, reason: 'locked' };
  if (!canAfford(coins, cost)) return { ok: false, reason: 'insufficient-funds' };
  return { ok: true };
}

/** Returns plot indices that just unlocked given old and new totals. */
export function plotsUnlockedBy(oldTotal: number, newTotal: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < MAX_PLOTS; i++) {
    const threshold = plotUnlockThreshold(i);
    if (oldTotal < threshold && newTotal >= threshold) {
      out.push(i);
    }
  }
  return out;
}

/** Returns the next plot unlock threshold strictly greater than totalEarned. */
export function nextPlotUnlock(totalEarned: number): {
  index: number;
  threshold: number;
} | null {
  for (let i = 0; i < MAX_PLOTS; i++) {
    const t = plotUnlockThreshold(i);
    if (totalEarned < t) return { index: i, threshold: t };
  }
  return null;
}

/** Iterates cat types in canonical order, returning unlocked status. */
export function visibleSeeds(
  totalEarned: number,
  graskattsSold: number,
): Array<{ cat: CatType; unlocked: boolean }> {
  return CAT_TYPE_ORDER.map((id) => {
    const cat = CAT_TYPES[id];
    const { totalEarned: req, graskattsSold: reqG } = cat.unlock;
    const earnedOk = req === null || totalEarned >= req;
    const sellOk = reqG === null || graskattsSold >= reqG;
    return { cat, unlocked: earnedOk && sellOk };
  });
}
