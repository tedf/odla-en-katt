/**
 * Unit tests for plot growth, lightning bonus, and unlock thresholds.
 */

import { describe, expect, it } from 'vitest';
import {
  applyLightningBonus,
  effectiveSellValue,
  growthProgress,
  growthStage,
  isMature,
  plantInPlot,
  plotUnlockThreshold,
  shouldPlotBeUnlocked,
} from '../plots';
import { plotsUnlockedBy } from '../economy';

describe('growthProgress', () => {
  it('returns 0 for empty plot', () => {
    const plot = plantInPlot(
      {
        index: 0,
        unlocked: true,
        state: 'empty',
        catType: null,
        plantedAt: null,
        lightningBonus: 0,
      },
      'graskatt',
      0,
    );
    expect(growthProgress(plot, 0)).toBe(0);
    expect(growthProgress(plot, 15_000)).toBeCloseTo(0.5, 1);
    expect(growthProgress(plot, 30_000)).toBe(1);
    expect(growthProgress(plot, 45_000)).toBe(1);
  });
});

describe('growthStage', () => {
  it('maps progress to stages 0/1/2', () => {
    expect(growthStage(0)).toBe(0);
    expect(growthStage(0.32)).toBe(0);
    expect(growthStage(0.34)).toBe(1);
    expect(growthStage(0.65)).toBe(1);
    expect(growthStage(0.67)).toBe(2);
    expect(growthStage(1)).toBe(2);
  });
});

describe('isMature', () => {
  it('is false before grow time', () => {
    const plot = plantInPlot(
      {
        index: 0,
        unlocked: true,
        state: 'empty',
        catType: null,
        plantedAt: null,
        lightningBonus: 0,
      },
      'graskatt',
      0,
    );
    expect(isMature(plot, 10_000)).toBe(false);
    expect(isMature(plot, 30_000)).toBe(true);
  });
});

describe('plot unlocks', () => {
  it('matches spec thresholds', () => {
    expect(plotUnlockThreshold(0)).toBe(0);
    expect(plotUnlockThreshold(1)).toBe(200);
    expect(plotUnlockThreshold(2)).toBe(800);
    expect(plotUnlockThreshold(3)).toBe(3000);
    expect(plotUnlockThreshold(4)).toBe(10000);
    expect(plotUnlockThreshold(5)).toBe(50000);
  });

  it('reports unlock when threshold is hit', () => {
    expect(shouldPlotBeUnlocked(1, 199)).toBe(false);
    expect(shouldPlotBeUnlocked(1, 200)).toBe(true);
  });

  it('plotsUnlockedBy reports newly-crossed thresholds', () => {
    expect(plotsUnlockedBy(0, 200)).toEqual([1]);
    expect(plotsUnlockedBy(199, 3000)).toEqual([1, 2, 3]);
    expect(plotsUnlockedBy(3000, 4000)).toEqual([]);
  });
});

describe('lightning bonus', () => {
  const base = {
    index: 0,
    unlocked: true,
    state: 'ready' as const,
    catType: 'graskatt' as const,
    plantedAt: 0,
    lightningBonus: 0,
  };

  it('caps at +100%', () => {
    let plot = applyLightningBonus(base, 0.5);
    plot = applyLightningBonus(plot, 0.4);
    plot = applyLightningBonus(plot, 0.4);
    expect(plot.lightningBonus).toBe(1);
  });

  it('applies multiplier on sell value', () => {
    const plot = applyLightningBonus(base, 0.3);
    expect(effectiveSellValue(plot)).toBe(13);
  });
});
