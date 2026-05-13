/**
 * Unit tests for the speed-upgrade tier helper.
 */

import { describe, expect, it } from 'vitest';
import {
  SPEED_UPGRADES,
  activeSpeedMultiplier,
  nextAvailableUpgrade,
  getUpgradeById,
} from '../upgrades';

describe('SPEED_UPGRADES', () => {
  it('defines four tiers with strictly increasing cost and multiplier', () => {
    expect(SPEED_UPGRADES).toHaveLength(4);
    for (let i = 1; i < SPEED_UPGRADES.length; i++) {
      const prev = SPEED_UPGRADES[i - 1]!;
      const cur = SPEED_UPGRADES[i]!;
      expect(cur.cost).toBeGreaterThan(prev.cost);
      expect(cur.multiplier).toBeGreaterThan(prev.multiplier);
      expect(cur.tier).toBeGreaterThan(prev.tier);
    }
  });

  it('matches the spec values', () => {
    expect(getUpgradeById('speed_1')?.multiplier).toBe(1.5);
    expect(getUpgradeById('speed_1')?.cost).toBe(100);
    expect(getUpgradeById('speed_2')?.multiplier).toBe(2.0);
    expect(getUpgradeById('speed_2')?.cost).toBe(500);
    expect(getUpgradeById('speed_3')?.multiplier).toBe(3.0);
    expect(getUpgradeById('speed_3')?.cost).toBe(2000);
    expect(getUpgradeById('speed_4')?.multiplier).toBe(5.0);
    expect(getUpgradeById('speed_4')?.cost).toBe(10000);
  });
});

describe('activeSpeedMultiplier', () => {
  it('returns 1 when nothing is purchased', () => {
    expect(activeSpeedMultiplier([])).toBe(1);
  });

  it('returns the multiplier of the highest-owned tier', () => {
    expect(activeSpeedMultiplier(['speed_1'])).toBe(1.5);
    expect(activeSpeedMultiplier(['speed_1', 'speed_3'])).toBe(3.0);
    expect(activeSpeedMultiplier(['speed_4', 'speed_2'])).toBe(5.0);
  });

  it('ignores unknown ids', () => {
    expect(activeSpeedMultiplier(['unknown_id', 'speed_2'])).toBe(2.0);
  });
});

describe('nextAvailableUpgrade', () => {
  it('returns the first tier when nothing is owned', () => {
    const next = nextAvailableUpgrade([]);
    expect(next?.id).toBe('speed_1');
  });

  it('returns the next tier after the highest owned', () => {
    expect(nextAvailableUpgrade(['speed_1'])?.id).toBe('speed_2');
    expect(nextAvailableUpgrade(['speed_1', 'speed_2'])?.id).toBe('speed_3');
  });

  it('returns null when the top tier is owned', () => {
    expect(nextAvailableUpgrade(['speed_4'])).toBeNull();
    expect(
      nextAvailableUpgrade(['speed_1', 'speed_2', 'speed_3', 'speed_4']),
    ).toBeNull();
  });
});
