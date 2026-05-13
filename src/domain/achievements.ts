/**
 * Achievement system — milestone trophies tied to lifetime stats.
 *
 * Pure data + helpers. No React/DOM. The store owns the live stats and
 * calls `checkAchievements` after every action that could trip a new
 * unlock.
 */

import type { CatTypeId } from './catTypes';

export type AchievementCategory =
  | 'harvest'
  | 'coins'
  | 'collection'
  | 'weather'
  | 'special';

export interface AchievementReward {
  coins?: number;
  seedId?: CatTypeId;
}

export interface AchievementStats {
  totalHarvested: number;
  totalCoinsEarned: number;
  /**
   * Set in memory, serialized as string[] in the save. We expose it as a
   * Set in the runtime stats so existence checks stay O(1).
   */
  catTypesHarvested: Set<CatTypeId>;
  weatherEventsExperienced: number;
  lotteriesSpun: number;
  upgradesPurchased: number;
  longestStreak: number;
  meteorHits: number;
  harvestedWithMagicalTrait: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  condition: (stats: AchievementStats) => boolean;
  reward: AchievementReward;
  /** Secret achievements stay locked-silhouette in the wall until unlocked. */
  secret?: boolean;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  // Harvest milestones
  {
    id: 'first_harvest',
    title: 'Första skörden!',
    description: 'Skörda din första katt',
    emoji: '🌱',
    category: 'harvest',
    condition: (s) => s.totalHarvested >= 1,
    reward: { coins: 50 },
  },
  {
    id: 'harvest_10',
    title: 'Kattbonde',
    description: 'Skörda 10 katter totalt',
    emoji: '🐱',
    category: 'harvest',
    condition: (s) => s.totalHarvested >= 10,
    reward: { coins: 200 },
  },
  {
    id: 'harvest_50',
    title: 'Erfaren bonde',
    description: 'Skörda 50 katter totalt',
    emoji: '🐈',
    category: 'harvest',
    condition: (s) => s.totalHarvested >= 50,
    reward: { coins: 500 },
  },
  {
    id: 'harvest_100',
    title: 'Kattmästare',
    description: 'Skörda 100 katter totalt',
    emoji: '👑',
    category: 'harvest',
    condition: (s) => s.totalHarvested >= 100,
    reward: { coins: 1000 },
  },
  {
    id: 'harvest_500',
    title: 'Kattkung',
    description: 'Skörda 500 katter totalt',
    emoji: '🏆',
    category: 'harvest',
    condition: (s) => s.totalHarvested >= 500,
    reward: { coins: 5000 },
  },
  // Coins
  {
    id: 'coins_1000',
    title: 'Tusenär',
    description: 'Tjäna 1000 mynt totalt',
    emoji: '💰',
    category: 'coins',
    condition: (s) => s.totalCoinsEarned >= 1000,
    reward: { coins: 100 },
  },
  {
    id: 'coins_10000',
    title: 'Tiotusenär',
    description: 'Tjäna 10 000 mynt totalt',
    emoji: '💎',
    category: 'coins',
    condition: (s) => s.totalCoinsEarned >= 10000,
    reward: { coins: 500 },
  },
  {
    id: 'coins_100000',
    title: 'Hundratusenär',
    description: 'Tjäna 100 000 mynt totalt',
    emoji: '🌟',
    category: 'coins',
    condition: (s) => s.totalCoinsEarned >= 100000,
    reward: { coins: 2000, seedId: 'stjarnkatt' },
  },
  {
    id: 'coins_1000000',
    title: 'Kattmiljonär!',
    description: 'Tjäna 1 000 000 mynt totalt',
    emoji: '🚀',
    category: 'coins',
    condition: (s) => s.totalCoinsEarned >= 1000000,
    reward: { coins: 10000, seedId: 'rymkatt' },
  },
  // Collection
  {
    id: 'collect_5types',
    title: 'Samlare',
    description: 'Odla 5 olika kattsorter',
    emoji: '📚',
    category: 'collection',
    condition: (s) => s.catTypesHarvested.size >= 5,
    reward: { coins: 300 },
  },
  {
    id: 'collect_10types',
    title: 'Kattexpert',
    description: 'Odla 10 olika kattsorter',
    emoji: '🎓',
    category: 'collection',
    condition: (s) => s.catTypesHarvested.size >= 10,
    reward: { coins: 1000 },
  },
  {
    id: 'collect_all',
    title: 'Fullständig!',
    description: 'Odla alla 14 kattsorter',
    emoji: '🌈',
    category: 'collection',
    condition: (s) => s.catTypesHarvested.size >= 14,
    reward: { coins: 5000, seedId: 'rymkatt' },
  },
  // Weather
  {
    id: 'first_lightning',
    title: 'Åskvädret!',
    description: 'Upplev din första blixt',
    emoji: '⚡',
    category: 'weather',
    condition: (s) => s.weatherEventsExperienced >= 1,
    reward: { coins: 50 },
  },
  {
    id: 'meteor_hit',
    title: 'Kosmisk kraft!',
    description: 'Upplev ett meteoritregn',
    emoji: '☄️',
    category: 'weather',
    condition: (s) => s.meteorHits >= 1,
    reward: { coins: 500 },
    secret: true,
  },
  {
    id: 'weather_master',
    title: 'Vädermagiker',
    description: 'Upplev 20 väderhändelser',
    emoji: '🌦️',
    category: 'weather',
    condition: (s) => s.weatherEventsExperienced >= 20,
    reward: { coins: 1000 },
  },
  // Special
  {
    id: 'magical_cat',
    title: 'Magisk uppenbarelse',
    description: 'Skörda en katt med Magisk-trait',
    emoji: '✨',
    category: 'special',
    condition: (s) => s.harvestedWithMagicalTrait >= 1,
    reward: { coins: 800 },
    secret: true,
  },
  {
    id: 'lottery_10',
    title: 'Lyckohjulssnurrare',
    description: 'Snurra lyckohjulet 10 gånger',
    emoji: '🎰',
    category: 'special',
    condition: (s) => s.lotteriesSpun >= 10,
    reward: { coins: 300 },
  },
  {
    id: 'streak_7',
    title: 'Veckoentusiast',
    description: '7 dagars inloggningsstreak',
    emoji: '🔥',
    category: 'special',
    condition: (s) => s.longestStreak >= 7,
    reward: { coins: 777 },
  },
];

export const ACHIEVEMENTS_BY_ID: Readonly<Record<string, Achievement>> =
  ACHIEVEMENTS.reduce(
    (acc, a) => {
      acc[a.id] = a;
      return acc;
    },
    {} as Record<string, Achievement>,
  );

export const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = [
  'harvest',
  'coins',
  'collection',
  'weather',
  'special',
];

export const CATEGORY_LABELS: Readonly<Record<AchievementCategory, string>> = {
  harvest: 'Skörd',
  coins: 'Mynt',
  collection: 'Samling',
  weather: 'Väder',
  special: 'Speciellt',
};

export function getAchievement(id: string): Achievement | null {
  return ACHIEVEMENTS_BY_ID[id] ?? null;
}

export function createEmptyAchievementStats(): AchievementStats {
  return {
    totalHarvested: 0,
    totalCoinsEarned: 0,
    catTypesHarvested: new Set<CatTypeId>(),
    weatherEventsExperienced: 0,
    lotteriesSpun: 0,
    upgradesPurchased: 0,
    longestStreak: 0,
    meteorHits: 0,
    harvestedWithMagicalTrait: 0,
  };
}

/**
 * Returns the list of achievement ids whose condition is satisfied and
 * which are not yet in `alreadyUnlocked`. Pure.
 */
export function newlyUnlocked(
  stats: AchievementStats,
  alreadyUnlocked: readonly string[],
): string[] {
  const owned = new Set(alreadyUnlocked);
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (owned.has(a.id)) continue;
    if (a.condition(stats)) unlocked.push(a.id);
  }
  return unlocked;
}
