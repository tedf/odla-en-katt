/**
 * Unit tests for the achievement system (pure Node).
 */

import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  CATEGORY_LABELS,
  createEmptyAchievementStats,
  getAchievement,
  newlyUnlocked,
  type AchievementStats,
} from '../achievements';

describe('ACHIEVEMENTS', () => {
  it('has unique ids', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    expect(ids.size).toBe(ACHIEVEMENTS.length);
  });

  it('every category in ACHIEVEMENT_CATEGORIES has a label', () => {
    for (const c of ACHIEVEMENT_CATEGORIES) {
      expect(CATEGORY_LABELS[c]).toBeTruthy();
    }
  });

  it('every achievement belongs to a known category', () => {
    for (const a of ACHIEVEMENTS) {
      expect(ACHIEVEMENT_CATEGORIES).toContain(a.category);
    }
  });

  it('every achievement has a non-empty title and emoji', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.emoji.length).toBeGreaterThan(0);
    }
  });

  it('marks meteor_hit and magical_cat as secret', () => {
    expect(getAchievement('meteor_hit')?.secret).toBe(true);
    expect(getAchievement('magical_cat')?.secret).toBe(true);
  });
});

describe('createEmptyAchievementStats', () => {
  it('starts every counter at 0', () => {
    const s = createEmptyAchievementStats();
    expect(s.totalHarvested).toBe(0);
    expect(s.totalCoinsEarned).toBe(0);
    expect(s.weatherEventsExperienced).toBe(0);
    expect(s.lotteriesSpun).toBe(0);
    expect(s.upgradesPurchased).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.meteorHits).toBe(0);
    expect(s.harvestedWithMagicalTrait).toBe(0);
  });

  it('starts catTypesHarvested as an empty Set', () => {
    const s = createEmptyAchievementStats();
    expect(s.catTypesHarvested.size).toBe(0);
  });
});

describe('newlyUnlocked', () => {
  function statsWith(overrides: Partial<AchievementStats>): AchievementStats {
    return { ...createEmptyAchievementStats(), ...overrides };
  }

  it('returns empty when no thresholds met', () => {
    const stats = createEmptyAchievementStats();
    expect(newlyUnlocked(stats, [])).toEqual([]);
  });

  it('unlocks first_harvest after first cat', () => {
    const ids = newlyUnlocked(statsWith({ totalHarvested: 1 }), []);
    expect(ids).toContain('first_harvest');
  });

  it('unlocks harvest tiers cumulatively', () => {
    const ids = newlyUnlocked(statsWith({ totalHarvested: 100 }), []);
    expect(ids).toContain('first_harvest');
    expect(ids).toContain('harvest_10');
    expect(ids).toContain('harvest_50');
    expect(ids).toContain('harvest_100');
    expect(ids).not.toContain('harvest_500');
  });

  it('does not re-unlock already-claimed achievements', () => {
    const ids = newlyUnlocked(statsWith({ totalHarvested: 100 }), [
      'first_harvest',
      'harvest_10',
    ]);
    expect(ids).not.toContain('first_harvest');
    expect(ids).not.toContain('harvest_10');
    expect(ids).toContain('harvest_50');
    expect(ids).toContain('harvest_100');
  });

  it('unlocks coin milestones', () => {
    const ids = newlyUnlocked(statsWith({ totalCoinsEarned: 12000 }), []);
    expect(ids).toContain('coins_1000');
    expect(ids).toContain('coins_10000');
    expect(ids).not.toContain('coins_100000');
  });

  it('respects collection size via Set', () => {
    const set = new Set<
      | 'graskatt'
      | 'morotskatt'
      | 'blabarskatt'
      | 'jordgubbskatt'
      | 'citruskatt'
    >([
      'graskatt',
      'morotskatt',
      'blabarskatt',
      'jordgubbskatt',
      'citruskatt',
    ]);
    const ids = newlyUnlocked(
      statsWith({
        catTypesHarvested:
          set as unknown as AchievementStats['catTypesHarvested'],
      }),
      [],
    );
    expect(ids).toContain('collect_5types');
    expect(ids).not.toContain('collect_10types');
  });

  it('unlocks meteor_hit secret on first meteor', () => {
    const ids = newlyUnlocked(
      statsWith({ meteorHits: 1, weatherEventsExperienced: 1 }),
      [],
    );
    expect(ids).toContain('meteor_hit');
    expect(ids).toContain('first_lightning');
  });

  it('unlocks weather_master at 20 events', () => {
    const ids = newlyUnlocked(
      statsWith({ weatherEventsExperienced: 20 }),
      [],
    );
    expect(ids).toContain('weather_master');
  });

  it('unlocks magical_cat secret on first magical harvest', () => {
    const ids = newlyUnlocked(
      statsWith({ harvestedWithMagicalTrait: 1 }),
      [],
    );
    expect(ids).toContain('magical_cat');
  });

  it('unlocks streak_7 at 7 days', () => {
    const ids = newlyUnlocked(statsWith({ longestStreak: 7 }), []);
    expect(ids).toContain('streak_7');
  });
});
