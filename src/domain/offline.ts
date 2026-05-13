/**
 * Offline catch-up summary builder.
 *
 * Walks the saved plot state, marks anything that ripened-while-away as
 * ready, and (if the player owns `auto_harvest`) auto-harvests all those
 * plots — rolling personalities, summing coin yields, and returning a
 * detailed summary used by the OfflineModal.
 */

import { CAT_TYPES, type CatTypeId } from './catTypes';
import {
  rollPersonality,
  traitValueMultiplier,
  type CatTraitId,
} from './catPersonality';
import {
  effectiveSellValue,
  emptyPlotAfterHarvest,
  markReady,
  type PlotState,
} from './plots';

export interface OfflineHarvestedPlot {
  plotIndex: number;
  catTypeId: CatTypeId;
  catName: string;
  traitId: CatTraitId;
  /** Per-cat sell value with weather + trait already applied. */
  sellValue: number;
  /** Sum of additive weather bonuses on the plot at harvest time. */
  weatherBonus: number;
}

export interface OfflineReadyPlot {
  plotIndex: number;
  catTypeId: CatTypeId;
}

export interface OfflineSummary {
  /** How long the player was gone, in milliseconds. */
  awayMs: number;
  /** Plots auto-harvested while away. Empty if auto-harvest is not owned. */
  completedPlots: OfflineHarvestedPlot[];
  /** Plots that became ready but were not auto-harvested. */
  readyPlots: OfflineReadyPlot[];
  /** Total coins earned from auto-harvest (already in coin units). */
  coinsEarned: number;
  /** True if auto-harvest was active during the away window. */
  autoHarvestActive: boolean;
  /** New plot state after applying the summary (ready or empty). */
  plots: PlotState[];
}

/**
 * Determines if a plot has ripened given the time-warp speed multiplier.
 */
function hasRipened(
  plot: PlotState,
  now: number,
  speedMultiplier: number,
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
 * Calculates offline progress. Pure — uses an injectable rng for tests.
 *
 * @param plots          Plots loaded from save (unmodified by tick).
 * @param lastSaveTime   `lastTickAt` from save.
 * @param nowMs          Current epoch ms.
 * @param speedMultiplier Active speed boost multiplier (1 = baseline).
 * @param autoHarvestUnlocked True if the player owns the `auto_harvest`
 *                            utility upgrade.
 * @param rng            Random source (default Math.random).
 */
export function calculateOfflineProgress(
  plots: PlotState[],
  lastSaveTime: number,
  nowMs: number,
  speedMultiplier: number,
  autoHarvestUnlocked: boolean,
  rng: () => number = Math.random,
): OfflineSummary {
  const awayMs = Math.max(0, nowMs - lastSaveTime);
  const completedPlots: OfflineHarvestedPlot[] = [];
  const readyPlots: OfflineReadyPlot[] = [];
  let coinsEarned = 0;

  const nextPlots = plots.map((plot) => {
    if (!hasRipened(plot, nowMs, speedMultiplier)) return plot;
    const catId = plot.catType;
    if (catId === null) return plot;

    if (autoHarvestUnlocked) {
      // Roll a personality and apply trait value multiplier on top of weather.
      const { name, traitId } = rollPersonality(rng);
      const baseValue = effectiveSellValue(plot);
      const sellValue = Math.round(baseValue * traitValueMultiplier(traitId));
      coinsEarned += sellValue;
      completedPlots.push({
        plotIndex: plot.index,
        catTypeId: catId,
        catName: name,
        traitId,
        sellValue,
        weatherBonus: plot.lightningBonus,
      });
      return emptyPlotAfterHarvest(plot);
    }

    readyPlots.push({ plotIndex: plot.index, catTypeId: catId });
    return markReady(plot);
  });

  return {
    awayMs,
    completedPlots,
    readyPlots,
    coinsEarned,
    autoHarvestActive: autoHarvestUnlocked && completedPlots.length > 0,
    plots: nextPlots,
  };
}
