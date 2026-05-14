/**
 * Unit tests for the time-limited speed-upgrade helpers.
 */

import { describe, expect, it } from 'vitest';
import {
  SPEED_UPGRADES,
  activeMultiplier,
  classifySpeedUpgrades,
  getUpgradeById,
  isValidUpgradeId,
  makeActiveUpgrade,
  pruneExpired,
} from '../upgrades';

describe('SPEED_UPGRADES', () => {
  it('defines eight tiers with strictly increasing cost, multiplier, and duration', () => {
    expect(SPEED_UPGRADES).toHaveLength(8);
    for (let i = 1; i < SPEED_UPGRADES.length; i++) {
      const prev = SPEED_UPGRADES[i - 1]!;
      const cur = SPEED_UPGRADES[i]!;
      expect(cur.cost).toBeGreaterThan(prev.cost);
      expect(cur.multiplier).toBeGreaterThan(prev.multiplier);
      expect(cur.tier).toBeGreaterThan(prev.tier);
      expect(cur.durationSeconds).toBeGreaterThan(prev.durationSeconds);
    }
  });

  it('matches the spec values for cost, multiplier, and duration', () => {
    const speed1 = getUpgradeById('speed_1');
    expect(speed1?.multiplier).toBe(1.5);
    expect(speed1?.cost).toBe(50);
    expect(speed1?.durationSeconds).toBe(30 * 60);

    const speed2 = getUpgradeById('speed_2');
    expect(speed2?.multiplier).toBe(2.0);
    expect(speed2?.cost).toBe(200);
    expect(speed2?.durationSeconds).toBe(60 * 60);

    const speed3 = getUpgradeById('speed_3');
    expect(speed3?.multiplier).toBe(3.0);
    expect(speed3?.cost).toBe(800);
    expect(speed3?.durationSeconds).toBe(2 * 60 * 60);

    const speed4 = getUpgradeById('speed_4');
    expect(speed4?.multiplier).toBe(5.0);
    expect(speed4?.cost).toBe(4000);
    expect(speed4?.durationSeconds).toBe(4 * 60 * 60);

    const speed5 = getUpgradeById('speed_5');
    expect(speed5?.multiplier).toBe(8.0);
    expect(speed5?.cost).toBe(15000);
    expect(speed5?.durationSeconds).toBe(6 * 60 * 60);

    const speed8 = getUpgradeById('speed_8');
    expect(speed8?.multiplier).toBe(50.0);
    expect(speed8?.cost).toBe(1000000);
    expect(speed8?.durationSeconds).toBe(24 * 60 * 60);
  });

  it('exposes an emoji for every upgrade', () => {
    for (const u of SPEED_UPGRADES) {
      expect(typeof u.emoji).toBe('string');
      expect(u.emoji.length).toBeGreaterThan(0);
    }
  });
});

describe('activeMultiplier', () => {
  it('returns 1 when no upgrade is active', () => {
    expect(activeMultiplier(null, 1_000)).toBe(1);
  });

  it('returns the active multiplier while not expired', () => {
    const now = 10_000;
    const active = makeActiveUpgrade('speed_2', now)!;
    expect(activeMultiplier(active, now)).toBe(2);
    expect(activeMultiplier(active, now + 1_000)).toBe(2);
    // 1ms before expiry → still active.
    expect(activeMultiplier(active, active.expiresAt - 1)).toBe(2);
  });

  it('returns 1 once the upgrade has expired', () => {
    const now = 10_000;
    const active = makeActiveUpgrade('speed_2', now)!;
    expect(activeMultiplier(active, active.expiresAt)).toBe(1);
    expect(activeMultiplier(active, active.expiresAt + 1)).toBe(1);
  });
});

describe('pruneExpired', () => {
  it('returns null for a null input', () => {
    expect(pruneExpired(null, 0)).toBeNull();
  });

  it('returns the upgrade if not yet expired', () => {
    const now = 10_000;
    const active = makeActiveUpgrade('speed_1', now)!;
    expect(pruneExpired(active, now + 5_000)).toEqual(active);
  });

  it('returns null once expired', () => {
    const now = 10_000;
    const active = makeActiveUpgrade('speed_1', now)!;
    expect(pruneExpired(active, active.expiresAt)).toBeNull();
    expect(pruneExpired(active, active.expiresAt + 100)).toBeNull();
  });
});

describe('makeActiveUpgrade', () => {
  it('builds an active record with correct expiry', () => {
    const now = 1_700_000_000_000;
    const active = makeActiveUpgrade('speed_3', now);
    expect(active).not.toBeNull();
    expect(active!.upgradeId).toBe('speed_3');
    expect(active!.multiplier).toBe(3);
    expect(active!.expiresAt).toBe(now + 2 * 60 * 60 * 1000);
  });

  it('returns null for an unknown id', () => {
    expect(
      makeActiveUpgrade('not_a_real_id' as 'speed_1', 0),
    ).toBeNull();
  });
});

describe('isValidUpgradeId', () => {
  it('accepts all eight known ids', () => {
    for (let i = 1; i <= 8; i++) {
      expect(isValidUpgradeId(`speed_${i}`)).toBe(true);
    }
  });

  it('rejects unknown strings', () => {
    expect(isValidUpgradeId('speed_9')).toBe(false);
    expect(isValidUpgradeId('')).toBe(false);
    expect(isValidUpgradeId('not_an_id')).toBe(false);
  });
});

describe('classifySpeedUpgrades', () => {
  it('marks every boost as affordable when player is wealthy', () => {
    const result = classifySpeedUpgrades(10_000_000);
    expect(result.every((r) => r.status === 'affordable')).toBe(true);
  });

  it('marks the cheapest unaffordable boost as next and the rest as locked', () => {
    // Coins = 250 → can afford speed_1 (50) and speed_2 (200); speed_3 is next.
    const result = classifySpeedUpgrades(250);
    expect(result[0]!.status).toBe('affordable');
    expect(result[1]!.status).toBe('affordable');
    expect(result[2]!.status).toBe('next');
    expect(result[3]!.status).toBe('locked');
    expect(result[7]!.status).toBe('locked');
  });

  it('marks tier 1 as next when player has zero coins', () => {
    const result = classifySpeedUpgrades(0);
    expect(result[0]!.status).toBe('next');
    expect(result[1]!.status).toBe('locked');
  });
});
