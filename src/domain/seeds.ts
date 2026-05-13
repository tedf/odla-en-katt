/**
 * Seed type aliases — seeds are 1:1 with cat types in this game.
 */

import type { CatType, CatTypeId } from './catTypes';
import { CAT_TYPES, CAT_TYPE_ORDER } from './catTypes';

export interface SeedType {
  id: CatTypeId;
  name: string;
  catType: CatTypeId;
  cost: number;
  infinite: boolean;
  unlockTotalEarned: number | null;
  unlockGraskattsSold: number | null;
}

export function seedFromCat(cat: CatType): SeedType {
  return {
    id: cat.id,
    name: cat.name,
    catType: cat.id,
    cost: cat.seedCost,
    infinite: cat.infinite,
    unlockTotalEarned: cat.unlock.totalEarned,
    unlockGraskattsSold: cat.unlock.graskattsSold,
  };
}

export const SEED_TYPES: readonly SeedType[] = CAT_TYPE_ORDER.map((id) =>
  seedFromCat(CAT_TYPES[id]),
);
