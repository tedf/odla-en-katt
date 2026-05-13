/**
 * Unit tests for the daily quests system (pure Node).
 */

import { describe, expect, it } from 'vitest';
import {
  applyQuestProgress,
  dateSeed,
  getDailyQuests,
  getQuestTemplate,
  msUntilMidnight,
  previousDate,
  QUEST_POOL,
  refreshDailyQuests,
  type DailyQuestsState,
  type QuestProgressEntry,
} from '../quests';

describe('QUEST_POOL', () => {
  it('has unique template ids', () => {
    const ids = new Set(QUEST_POOL.map((q) => q.id));
    expect(ids.size).toBe(QUEST_POOL.length);
  });

  it('every template has a positive target', () => {
    for (const q of QUEST_POOL) {
      expect(q.target).toBeGreaterThan(0);
    }
  });

  it('harvest_type templates carry a catTypeId', () => {
    const subset = QUEST_POOL.filter((q) => q.type === 'harvest_type');
    expect(subset.length).toBeGreaterThan(0);
    for (const q of subset) {
      expect(q.catTypeId).toBeDefined();
    }
  });

  it('harvest_with_trait templates carry a traitId', () => {
    const subset = QUEST_POOL.filter((q) => q.type === 'harvest_with_trait');
    expect(subset.length).toBeGreaterThan(0);
    for (const q of subset) {
      expect(q.traitId).toBeDefined();
    }
  });
});

describe('getDailyQuests', () => {
  it('returns exactly 3 quests', () => {
    expect(getDailyQuests('2026-05-13')).toHaveLength(3);
  });

  it('is deterministic for the same date', () => {
    const a = getDailyQuests('2026-05-13').map((q) => q.id);
    const b = getDailyQuests('2026-05-13').map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('returns different sets on adjacent days', () => {
    const a = getDailyQuests('2026-05-13').map((q) => q.id).sort();
    const b = getDailyQuests('2026-05-14').map((q) => q.id).sort();
    expect(a.join('|')).not.toBe(b.join('|'));
  });

  it('returns unique quests within a day', () => {
    const ids = getDailyQuests('2026-05-13').map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('dateSeed', () => {
  it('is stable for the same input', () => {
    expect(dateSeed('2026-05-13')).toBe(dateSeed('2026-05-13'));
  });

  it('differs across dates', () => {
    expect(dateSeed('2026-05-13')).not.toBe(dateSeed('2026-05-14'));
  });
});

describe('applyQuestProgress', () => {
  const harvestQ: QuestProgressEntry = {
    templateId: 'harvest_5',
    progress: 0,
    completed: false,
    rewardClaimed: false,
  };

  it('increments matching quests', () => {
    const next = applyQuestProgress([harvestQ], 'harvest_any', 1);
    const entry = next[0]!;
    expect(entry.progress).toBe(1);
    expect(entry.completed).toBe(false);
  });

  it('marks completed when target reached', () => {
    const next = applyQuestProgress([harvestQ], 'harvest_any', 5);
    const entry = next[0]!;
    expect(entry.progress).toBe(5);
    expect(entry.completed).toBe(true);
  });

  it('clamps progress at target', () => {
    const next = applyQuestProgress([harvestQ], 'harvest_any', 99);
    expect(next[0]!.progress).toBe(5);
  });

  it('skips completed quests', () => {
    const completed: QuestProgressEntry = {
      ...harvestQ,
      progress: 5,
      completed: true,
    };
    const next = applyQuestProgress([completed], 'harvest_any', 3);
    expect(next[0]).toEqual(completed);
  });

  it('ignores type mismatches', () => {
    const next = applyQuestProgress([harvestQ], 'sell_coins', 100);
    expect(next[0]!.progress).toBe(0);
  });

  it('respects catTypeId filter on harvest_type quests', () => {
    const q: QuestProgressEntry = {
      templateId: 'morot_3',
      progress: 0,
      completed: false,
      rewardClaimed: false,
    };
    const mismatch = applyQuestProgress([q], 'harvest_type', 1, {
      catTypeId: 'graskatt',
    });
    expect(mismatch[0]!.progress).toBe(0);
    const match = applyQuestProgress([q], 'harvest_type', 1, {
      catTypeId: 'morotskatt',
    });
    expect(match[0]!.progress).toBe(1);
  });

  it('respects traitId filter on harvest_with_trait quests', () => {
    const q: QuestProgressEntry = {
      templateId: 'lucky_trait',
      progress: 0,
      completed: false,
      rewardClaimed: false,
    };
    const mismatch = applyQuestProgress([q], 'harvest_with_trait', 1, {
      traitId: 'lazy',
    });
    expect(mismatch[0]!.progress).toBe(0);
    const match = applyQuestProgress([q], 'harvest_with_trait', 1, {
      traitId: 'lucky',
    });
    expect(match[0]!.progress).toBe(1);
    expect(match[0]!.completed).toBe(true);
  });
});

describe('refreshDailyQuests', () => {
  it('returns a fresh state when prev is null', () => {
    const s = refreshDailyQuests(null, '2026-05-13');
    expect(s.date).toBe('2026-05-13');
    expect(s.streak).toBe(0);
    expect(s.lastCompletedDate).toBeNull();
    expect(s.quests).toHaveLength(3);
    expect(s.quests.every((q) => q.progress === 0)).toBe(true);
  });

  it('increments streak when previous day was completed', () => {
    const prev: DailyQuestsState = {
      date: '2026-05-12',
      quests: [
        {
          templateId: 'harvest_5',
          progress: 5,
          completed: true,
          rewardClaimed: true,
        },
      ],
      streak: 2,
      lastCompletedDate: '2026-05-11',
    };
    const next = refreshDailyQuests(prev, '2026-05-13');
    expect(next.streak).toBe(3);
    expect(next.lastCompletedDate).toBe('2026-05-12');
  });

  it('resets streak when a day was skipped', () => {
    const prev: DailyQuestsState = {
      date: '2026-05-10',
      quests: [
        {
          templateId: 'harvest_5',
          progress: 5,
          completed: true,
          rewardClaimed: true,
        },
      ],
      streak: 5,
      lastCompletedDate: '2026-05-09',
    };
    const next = refreshDailyQuests(prev, '2026-05-13');
    expect(next.streak).toBe(0);
  });

  it('does not bump streak when yesterday had no claims', () => {
    const prev: DailyQuestsState = {
      date: '2026-05-12',
      quests: [
        {
          templateId: 'harvest_5',
          progress: 0,
          completed: false,
          rewardClaimed: false,
        },
      ],
      streak: 2,
      lastCompletedDate: null,
    };
    const next = refreshDailyQuests(prev, '2026-05-13');
    expect(next.streak).toBe(2);
  });
});

describe('previousDate', () => {
  it('returns the day before', () => {
    expect(previousDate('2026-05-13')).toBe('2026-05-12');
  });
  it('rolls month boundary', () => {
    expect(previousDate('2026-06-01')).toBe('2026-05-31');
  });
  it('rolls year boundary', () => {
    expect(previousDate('2026-01-01')).toBe('2025-12-31');
  });
});

describe('msUntilMidnight', () => {
  it('returns approx 24h at the start of a day', () => {
    const startOfDay = new Date(2026, 4, 13, 0, 0, 1, 0).getTime();
    const ms = msUntilMidnight(startOfDay);
    expect(ms).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it('returns a small value just before midnight', () => {
    const justBefore = new Date(2026, 4, 13, 23, 59, 59, 0).getTime();
    const ms = msUntilMidnight(justBefore);
    expect(ms).toBeLessThan(2000);
  });
});

describe('getQuestTemplate', () => {
  it('returns templates by id', () => {
    expect(getQuestTemplate('harvest_5')?.target).toBe(5);
  });
  it('returns null for unknown ids', () => {
    expect(getQuestTemplate('nope')).toBeNull();
  });
});
