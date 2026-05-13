/**
 * Lottery wheel — weighted roll and daily free-spin logic.
 */

import type { CatTypeId } from './catTypes';

export type LotteryPrizeKind = 'coins' | 'seed';

export interface LotteryPrize {
  kind: LotteryPrizeKind;
  /** Coin amount if kind === 'coins' */
  coins?: number;
  /** Cat seed id if kind === 'seed' */
  seedId?: CatTypeId;
  /** Display label */
  label: string;
  /** Visual color anchor for wheel sector */
  color: string;
}

export interface LotterySector {
  prize: LotteryPrize;
  weight: number;
}

export const LOTTERY_SECTORS: readonly LotterySector[] = [
  {
    prize: { kind: 'coins', coins: 10, label: '10 mynt', color: '#FFD56B' },
    weight: 20,
  },
  {
    prize: { kind: 'coins', coins: 25, label: '25 mynt', color: '#FFCC9E' },
    weight: 18,
  },
  {
    prize: { kind: 'coins', coins: 100, label: '100 mynt', color: '#FF8FA3' },
    weight: 12,
  },
  {
    prize: {
      kind: 'seed',
      seedId: 'morotskatt',
      label: 'Morotsfrö',
      color: '#FFB870',
    },
    weight: 15,
  },
  {
    prize: {
      kind: 'seed',
      seedId: 'blabarskatt',
      label: 'Blåbärsfrö',
      color: '#A8C5FF',
    },
    weight: 10,
  },
  {
    prize: {
      kind: 'seed',
      seedId: 'jordgubbskatt',
      label: 'Jordgubbsfrö',
      color: '#FFB7C5',
    },
    weight: 6,
  },
  {
    prize: { kind: 'coins', coins: 500, label: '500 mynt', color: '#FFE082' },
    weight: 4,
  },
  {
    prize: {
      kind: 'seed',
      seedId: 'regnbagskatt',
      label: 'Mysteriefrö',
      color: '#D1C4E9',
    },
    weight: 2,
  },
];

export const TOTAL_LOTTERY_WEIGHT: number = LOTTERY_SECTORS.reduce(
  (sum, s) => sum + s.weight,
  0,
);

export const PAID_SPIN_COST = 50;

/**
 * Weighted random sector pick. Accepts an optional RNG for testability.
 */
export function rollLottery(rng: () => number = Math.random): number {
  const r = rng() * TOTAL_LOTTERY_WEIGHT;
  let acc = 0;
  for (let i = 0; i < LOTTERY_SECTORS.length; i++) {
    const sector = LOTTERY_SECTORS[i];
    if (!sector) continue;
    acc += sector.weight;
    if (r < acc) return i;
  }
  return LOTTERY_SECTORS.length - 1;
}

/**
 * Returns "YYYY-MM-DD" for the local-time date of the given epoch ms.
 */
export function localDateString(now: number): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * True if a free spin is available today.
 */
export function isFreeSpinAvailable(
  lastFreeSpinAt: number | null,
  now: number,
): boolean {
  if (lastFreeSpinAt === null) return true;
  return localDateString(lastFreeSpinAt) !== localDateString(now);
}
