/**
 * Daily Quests — a per-day rotating set of small objectives, deterministic
 * by date so every player gets the same quests on the same day.
 *
 * Pure data + helpers. No React/DOM.
 */

import type { CatTypeId } from './catTypes';
import type { CatTraitId } from './catPersonality';

export type QuestType =
  | 'harvest_any'
  | 'harvest_type'
  | 'sell_coins'
  | 'spin_lottery'
  | 'weather_event'
  | 'harvest_with_trait';

export interface QuestReward {
  coins: number;
  seedId?: CatTypeId;
}

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number;
  type: QuestType;
  catTypeId?: CatTypeId;
  traitId?: CatTraitId;
  reward: QuestReward;
}

export const QUEST_POOL: readonly QuestTemplate[] = [
  {
    id: 'harvest_5',
    title: 'Skördedags!',
    description: 'Skörda 5 katter',
    emoji: '🌾',
    target: 5,
    type: 'harvest_any',
    reward: { coins: 100 },
  },
  {
    id: 'harvest_10',
    title: 'Flitig bonde',
    description: 'Skörda 10 katter',
    emoji: '👨‍🌾',
    target: 10,
    type: 'harvest_any',
    reward: { coins: 200 },
  },
  {
    id: 'sell_500',
    title: 'Rikeman',
    description: 'Sälj katter för 500 mynt',
    emoji: '💰',
    target: 500,
    type: 'sell_coins',
    reward: { coins: 150 },
  },
  {
    id: 'sell_2000',
    title: 'Affärsman',
    description: 'Sälj katter för 2000 mynt',
    emoji: '💎',
    target: 2000,
    type: 'sell_coins',
    reward: { coins: 500 },
  },
  {
    id: 'lottery_3',
    title: 'Lyckans hjul',
    description: 'Snurra lyckohjulet 3 gånger',
    emoji: '🎰',
    target: 3,
    type: 'spin_lottery',
    reward: { coins: 75 },
  },
  {
    id: 'weather_2',
    title: 'Stormjägare',
    description: 'Upplev 2 väderhändelser',
    emoji: '⛈️',
    target: 2,
    type: 'weather_event',
    reward: { coins: 200 },
  },
  {
    id: 'morot_3',
    title: 'Morötter!',
    description: 'Skörda 3 Morotskatter',
    emoji: '🥕',
    target: 3,
    type: 'harvest_type',
    catTypeId: 'morotskatt',
    reward: { coins: 120 },
  },
  {
    id: 'rainbow_1',
    title: 'Hitta regnbågen',
    description: 'Skörda en Regnbågskatt',
    emoji: '🌈',
    target: 1,
    type: 'harvest_type',
    catTypeId: 'regnbagskatt',
    reward: { coins: 1000, seedId: 'regnbagskatt' },
  },
  {
    id: 'lucky_trait',
    title: 'Lyckokatt',
    description: 'Skörda en katt med Lycklig-trait',
    emoji: '🍀',
    target: 1,
    type: 'harvest_with_trait',
    traitId: 'lucky',
    reward: { coins: 300 },
  },
  {
    id: 'magical_trait',
    title: 'Magisk morgon',
    description: 'Skörda en katt med Magisk-trait',
    emoji: '✨',
    target: 1,
    type: 'harvest_with_trait',
    traitId: 'magical',
    reward: { coins: 500 },
  },
  {
    id: 'harvest_lazy',
    title: 'Tålamodsprövet',
    description: 'Skörda en Lat katt',
    emoji: '😴',
    target: 1,
    type: 'harvest_with_trait',
    traitId: 'lazy',
    reward: { coins: 150 },
  },
  {
    id: 'sell_10000',
    title: 'Kattmiljonär',
    description: 'Sälj katter för 10000 mynt',
    emoji: '🏆',
    target: 10000,
    type: 'sell_coins',
    reward: { coins: 2000, seedId: 'stjarnkatt' },
  },
];

export const QUEST_POOL_BY_ID: Readonly<Record<string, QuestTemplate>> =
  QUEST_POOL.reduce(
    (acc, q) => {
      acc[q.id] = q;
      return acc;
    },
    {} as Record<string, QuestTemplate>,
  );

export function getQuestTemplate(id: string): QuestTemplate | null {
  return QUEST_POOL_BY_ID[id] ?? null;
}

/**
 * Tiny deterministic PRNG (mulberry32). Seeding by date string makes the
 * day's quest selection identical for every player worldwide.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hashes a 'YYYY-MM-DD' date to a 32-bit seed. Reasonably uniform over
 * adjacent days. Pure.
 */
export function dateSeed(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const QUESTS_PER_DAY = 3;

/**
 * Picks 3 unique daily quests for the given date. Deterministic by date.
 *
 * Pulls evenly from the pool by shuffling the indices with a date-seeded
 * PRNG and slicing the top N.
 */
export function getDailyQuests(date: string): QuestTemplate[] {
  const rng = mulberry32(dateSeed(date));
  const idx = QUEST_POOL.map((_, i) => i);
  // Fisher-Yates with deterministic rng.
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = idx[i];
    const b = idx[j];
    if (a === undefined || b === undefined) continue;
    idx[i] = b;
    idx[j] = a;
  }
  const picks: QuestTemplate[] = [];
  for (let i = 0; i < Math.min(QUESTS_PER_DAY, idx.length); i++) {
    const id = idx[i];
    if (id === undefined) continue;
    const q = QUEST_POOL[id];
    if (q) picks.push(q);
  }
  return picks;
}

export interface QuestProgressEntry {
  templateId: string;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export interface DailyQuestsState {
  date: string;
  quests: QuestProgressEntry[];
  streak: number;
  lastCompletedDate: string | null;
}

export interface QuestProgressMeta {
  catTypeId?: CatTypeId;
  traitId?: string;
}

/**
 * Returns true if the given progress update matches the template's filters.
 */
function matchesQuest(
  template: QuestTemplate,
  type: QuestType,
  meta: QuestProgressMeta,
): boolean {
  if (template.type !== type) return false;
  if (template.type === 'harvest_type') {
    return !template.catTypeId || meta.catTypeId === template.catTypeId;
  }
  if (template.type === 'harvest_with_trait') {
    return !template.traitId || meta.traitId === template.traitId;
  }
  return true;
}

/**
 * Pure progress update — returns a new quest entry array with progress
 * incremented on quests that match. Caller is responsible for triggering
 * any side effects (toasts, streak bumps).
 */
export function applyQuestProgress(
  quests: readonly QuestProgressEntry[],
  type: QuestType,
  amount: number,
  meta: QuestProgressMeta = {},
): QuestProgressEntry[] {
  if (amount <= 0) return quests.slice();
  return quests.map((entry) => {
    const template = getQuestTemplate(entry.templateId);
    if (!template) return entry;
    if (entry.completed) return entry;
    if (!matchesQuest(template, type, meta)) return entry;
    const nextProgress = entry.progress + amount;
    const completed = nextProgress >= template.target;
    return {
      ...entry,
      progress: Math.min(nextProgress, template.target),
      completed,
    };
  });
}

/**
 * Builds a fresh DailyQuestsState for a given date. Preserves streak
 * across consecutive days; resets if a day was skipped.
 */
export function refreshDailyQuests(
  prev: DailyQuestsState | null,
  date: string,
): DailyQuestsState {
  const picks = getDailyQuests(date);
  const quests: QuestProgressEntry[] = picks.map((t) => ({
    templateId: t.id,
    progress: 0,
    completed: false,
    rewardClaimed: false,
  }));

  if (!prev) {
    return { date, quests, streak: 0, lastCompletedDate: null };
  }

  // Streak update: if any quest was completed yesterday, increment streak.
  // We only bump on transition (new date), the bump itself is done when the
  // previous day ended with at least one claimed reward.
  const yesterday = previousDate(date);
  const completedYesterday =
    prev.date === yesterday &&
    prev.quests.some((q) => q.rewardClaimed);
  const skipped = prev.date !== yesterday && prev.date !== date;

  let streak: number;
  let lastCompletedDate = prev.lastCompletedDate;
  if (completedYesterday) {
    streak = prev.streak + 1;
    lastCompletedDate = prev.date;
  } else if (skipped) {
    streak = 0;
  } else {
    streak = prev.streak;
  }

  return { date, quests, streak, lastCompletedDate };
}

/**
 * Returns the previous YYYY-MM-DD string. Pure.
 */
export function previousDate(date: string): string {
  const [yStr, mStr, dStr] = date.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return date;
  }
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Returns ms until next local midnight (when quests refresh).
 */
export function msUntilMidnight(now: number): number {
  const d = new Date(now);
  const next = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(0, next.getTime() - now);
}
