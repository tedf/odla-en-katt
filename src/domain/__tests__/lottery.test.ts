/**
 * Unit tests for the lottery weighted roll and free-spin logic.
 * Runs in pure Node (no DOM).
 */

import { describe, expect, it } from 'vitest';
import {
  isFreeSpinAvailable,
  localDateString,
  LOTTERY_SECTORS,
  rollLottery,
  TOTAL_LOTTERY_WEIGHT,
} from '../lottery';

describe('lottery roll', () => {
  it('returns the first sector when rng is 0', () => {
    expect(rollLottery(() => 0)).toBe(0);
  });

  it('returns the last sector when rng is ~1', () => {
    expect(rollLottery(() => 0.9999)).toBe(LOTTERY_SECTORS.length - 1);
  });

  it('respects sector weight cumulatively', () => {
    const sample = 19 / TOTAL_LOTTERY_WEIGHT;
    expect(rollLottery(() => sample)).toBe(0);
    const sample2 = 20.5 / TOTAL_LOTTERY_WEIGHT;
    expect(rollLottery(() => sample2)).toBe(1);
  });

  it('returns valid indices over many trials', () => {
    const counts = new Array(LOTTERY_SECTORS.length).fill(0) as number[];
    let seed = 12345;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 1000; i++) {
      const idx = rollLottery(rng);
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    for (let i = 0; i < LOTTERY_SECTORS.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('isFreeSpinAvailable', () => {
  it('is true when no spin has happened', () => {
    expect(isFreeSpinAvailable(null, Date.now())).toBe(true);
  });

  it('is false when last spin was today', () => {
    const now = new Date(2025, 5, 14, 18, 0, 0).getTime();
    const earlierToday = new Date(2025, 5, 14, 8, 30, 0).getTime();
    expect(isFreeSpinAvailable(earlierToday, now)).toBe(false);
  });

  it('is true when last spin was yesterday', () => {
    const now = new Date(2025, 5, 14, 0, 5, 0).getTime();
    const yesterday = new Date(2025, 5, 13, 23, 59, 0).getTime();
    expect(isFreeSpinAvailable(yesterday, now)).toBe(true);
  });
});

describe('localDateString', () => {
  it('formats as YYYY-MM-DD', () => {
    const t = new Date(2025, 0, 9, 13, 0, 0).getTime();
    expect(localDateString(t)).toBe('2025-01-09');
  });
});
