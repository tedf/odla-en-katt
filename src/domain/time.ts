/**
 * Offline catch-up helper.
 */

import { CAT_TYPES } from './catTypes';
import type { PlotState } from './plots';

export interface OfflineRecap {
  readyPlots: number[];
  totalPlotsAffected: number;
  awayMs: number;
}

/**
 * Walks plots and marks those whose grow time has elapsed as 'ready'.
 * Returns the new plots array plus a recap summary.
 */
export function applyOfflineCatchup(
  plots: PlotState[],
  now: number,
  awayMs: number,
): { plots: PlotState[]; recap: OfflineRecap } {
  const readyPlots: number[] = [];
  const nextPlots = plots.map((plot) => {
    if (
      plot.state === 'growing' &&
      plot.catType !== null &&
      plot.plantedAt !== null
    ) {
      const cat = CAT_TYPES[plot.catType];
      if (now - plot.plantedAt >= cat.growMs) {
        readyPlots.push(plot.index);
        return { ...plot, state: 'ready' as const };
      }
    }
    return plot;
  });
  return {
    plots: nextPlots,
    recap: {
      readyPlots,
      totalPlotsAffected: readyPlots.length,
      awayMs,
    },
  };
}

/** Formats remaining time as "Mm Ss" or "Hh Mm" depending on size. */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const totalMin = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (totalMin < 60) return `${totalMin}m ${String(sec).padStart(2, '0')}s`;
  const hr = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return `${hr}h ${String(min).padStart(2, '0')}m`;
}

/** Formats a coin count with locale-friendly thousands separators. */
export function formatCoins(n: number): string {
  return n.toLocaleString('sv-SE');
}
