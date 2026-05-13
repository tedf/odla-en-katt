/**
 * Cat type definitions. Pure data — single source of truth.
 * No React imports allowed in this file.
 */

export type Rarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export type CatTypeId =
  | 'graskatt'
  | 'morotskatt'
  | 'bamboukatt'
  | 'blabarskatt'
  | 'jordgubbskatt'
  | 'kokosnotkatt'
  | 'citruskatt'
  | 'isbjornkatt'
  | 'vulkankatt'
  | 'regnbagskatt'
  | 'drakkatt'
  | 'stjarnkatt'
  | 'enhornigskatt'
  | 'rymkatt';

export interface UnlockCondition {
  /** Lifetime earned coins threshold (inclusive). Null = no threshold gate. */
  totalEarned: number | null;
  /** Number of Gräskatts that must have been sold. Null = unused. */
  graskattsSold: number | null;
}

export interface CatType {
  id: CatTypeId;
  /** Swedish display name */
  name: string;
  /** Short flavor description */
  description: string;
  rarity: Rarity;
  /** Grow time in milliseconds */
  growMs: number;
  /** Base sell value in coins (before lightning bonus) */
  sellValue: number;
  /**
   * Seed cost in coins. 0 means free.
   * Gräskatt is treated as infinite — players always have it.
   */
  seedCost: number;
  /** True if this seed is granted infinitely (Gräskatt) */
  infinite: boolean;
  /** Hex color anchors used in CSS variables for this cat */
  palette: {
    body: string;
    accent: string;
    shadow: string;
    glow: string;
  };
  unlock: UnlockCondition;
}

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;

export const CAT_TYPES: Readonly<Record<CatTypeId, CatType>> = {
  graskatt: {
    id: 'graskatt',
    name: 'Gräskatt',
    description: 'En knubbig liten gräskatt. Doftar nyklippt sommar.',
    rarity: 'common',
    growMs: 30 * 1000,
    sellValue: 10,
    seedCost: 0,
    infinite: true,
    palette: {
      body: '#C8E6C9',
      accent: '#7BA67C',
      shadow: '#5C8A5E',
      glow: '#A8D8B9',
    },
    unlock: { totalEarned: null, graskattsSold: null },
  },
  morotskatt: {
    id: 'morotskatt',
    name: 'Morotskatt',
    description: 'Crunchy och morotsorange. Älskar morgnar.',
    rarity: 'uncommon',
    growMs: 2 * ONE_MINUTE,
    sellValue: 35,
    seedCost: 25,
    infinite: false,
    palette: {
      body: '#FFCC9E',
      accent: '#E89B5C',
      shadow: '#B67542',
      glow: '#FFD8B5',
    },
    unlock: { totalEarned: null, graskattsSold: 3 },
  },
  bamboukatt: {
    id: 'bamboukatt',
    name: 'Bamboukatt',
    description: 'Fridfull och lat. Tuggar tankfullt på bambu.',
    rarity: 'common',
    growMs: 25 * ONE_MINUTE,
    sellValue: 90,
    seedCost: 70,
    infinite: false,
    palette: {
      body: '#F5F5F5',
      accent: '#4ADE80',
      shadow: '#222428',
      glow: '#C7F0D2',
    },
    unlock: { totalEarned: 70, graskattsSold: null },
  },
  blabarskatt: {
    id: 'blabarskatt',
    name: 'Blåbärskatt',
    description: 'Färgglad som ett blåbärsmoln vid skymning.',
    rarity: 'uncommon',
    growMs: 5 * ONE_MINUTE,
    sellValue: 80,
    seedCost: 60,
    infinite: false,
    palette: {
      body: '#B3D4FC',
      accent: '#6F87C8',
      shadow: '#4A5F9A',
      glow: '#C9DDFB',
    },
    unlock: { totalEarned: 150, graskattsSold: null },
  },
  jordgubbskatt: {
    id: 'jordgubbskatt',
    name: 'Jordgubbskatt',
    description: 'Söt som sommarens första jordgubbe.',
    rarity: 'rare',
    growMs: 10 * ONE_MINUTE,
    sellValue: 150,
    seedCost: 110,
    infinite: false,
    palette: {
      body: '#FFD0DC',
      accent: '#E36B85',
      shadow: '#A8425B',
      glow: '#FFE0E8',
    },
    unlock: { totalEarned: 500, graskattsSold: null },
  },
  kokosnotkatt: {
    id: 'kokosnotkatt',
    name: 'Kokosnötkatt',
    description: 'Tropisk och krämig. Doftar palmsol.',
    rarity: 'uncommon',
    growMs: 45 * ONE_MINUTE,
    sellValue: 350,
    seedCost: 240,
    infinite: false,
    palette: {
      body: '#F1E2C4',
      accent: '#8B6914',
      shadow: '#3D2A0F',
      glow: '#FFF1D0',
    },
    unlock: { totalEarned: 900, graskattsSold: null },
  },
  citruskatt: {
    id: 'citruskatt',
    name: 'Citruskatt',
    description: 'Citronfräsch. Smaskar lite på solen.',
    rarity: 'rare',
    growMs: 15 * ONE_MINUTE,
    sellValue: 220,
    seedCost: 160,
    infinite: false,
    palette: {
      body: '#FFEC9C',
      accent: '#E5B83A',
      shadow: '#9B7E1C',
      glow: '#FFF3BD',
    },
    unlock: { totalEarned: 1200, graskattsSold: null },
  },
  isbjornkatt: {
    id: 'isbjornkatt',
    name: 'Isbjörnkatt',
    description: 'Kylig och stolt. Bor i arktiska drömmar.',
    rarity: 'rare',
    growMs: 75 * ONE_MINUTE,
    sellValue: 580,
    seedCost: 400,
    infinite: false,
    palette: {
      body: '#F4FAFF',
      accent: '#93C5FD',
      shadow: '#3B69A8',
      glow: '#DCEDFF',
    },
    unlock: { totalEarned: 2200, graskattsSold: null },
  },
  vulkankatt: {
    id: 'vulkankatt',
    name: 'Vulkankatt',
    description: 'Het och explosiv. Spinnandet låter som lava.',
    rarity: 'rare',
    growMs: 90 * ONE_MINUTE,
    sellValue: 700,
    seedCost: 480,
    infinite: false,
    palette: {
      body: '#2A1812',
      accent: '#FF8E3C',
      shadow: '#7B1D1D',
      glow: '#FFB97A',
    },
    unlock: { totalEarned: 2800, graskattsSold: null },
  },
  regnbagskatt: {
    id: 'regnbagskatt',
    name: 'Regnbågskatt',
    description: 'Skimrar i alla färger samtidigt. Sällsynt magi.',
    rarity: 'epic',
    growMs: 30 * ONE_MINUTE,
    sellValue: 500,
    seedCost: 350,
    infinite: false,
    palette: {
      body: '#FFB7C5',
      accent: '#9B6DD7',
      shadow: '#5E3F8A',
      glow: '#FFD5E0',
    },
    unlock: { totalEarned: 3500, graskattsSold: null },
  },
  drakkatt: {
    id: 'drakkatt',
    name: 'Drakkatt',
    description: 'Mäktig och eldsprutande. Skrubbar av fjäll varje vår.',
    rarity: 'epic',
    growMs: 2 * ONE_HOUR,
    sellValue: 2500,
    seedCost: 1700,
    infinite: false,
    palette: {
      body: '#3B0B5A',
      accent: '#FFB300',
      shadow: '#160028',
      glow: '#C77DFF',
    },
    unlock: { totalEarned: 6000, graskattsSold: null },
  },
  stjarnkatt: {
    id: 'stjarnkatt',
    name: 'Stjärnkatt',
    description: 'Päls av djup midnatt med stjärnbilder över ryggen.',
    rarity: 'legendary',
    growMs: ONE_HOUR,
    sellValue: 1200,
    seedCost: 800,
    infinite: false,
    palette: {
      body: '#39305F',
      accent: '#FFE082',
      shadow: '#1F1A39',
      glow: '#A89BD6',
    },
    unlock: { totalEarned: 9000, graskattsSold: null },
  },
  enhornigskatt: {
    id: 'enhornigskatt',
    name: 'Enhörningskatt',
    description: 'Magisk och glänsande. Manen är gjord av regnbåge.',
    rarity: 'legendary',
    growMs: 4 * ONE_HOUR,
    sellValue: 8000,
    seedCost: 5500,
    infinite: false,
    palette: {
      body: '#FFF6FB',
      accent: '#EC4899',
      shadow: '#7A1F4F',
      glow: '#FFD9EC',
    },
    unlock: { totalEarned: 18000, graskattsSold: null },
  },
  rymkatt: {
    id: 'rymkatt',
    name: 'Rymkatt',
    description: 'Svävar lite ovanför jorden. Nebulosa i blicken.',
    rarity: 'mythic',
    growMs: 3 * ONE_HOUR,
    sellValue: 5000,
    seedCost: 3000,
    infinite: false,
    palette: {
      body: '#1B0F36',
      accent: '#F8BBD0',
      shadow: '#0A0418',
      glow: '#C99DF2',
    },
    unlock: { totalEarned: 35000, graskattsSold: null },
  },
};

export const CAT_TYPE_ORDER: readonly CatTypeId[] = [
  'graskatt',
  'morotskatt',
  'bamboukatt',
  'blabarskatt',
  'jordgubbskatt',
  'kokosnotkatt',
  'citruskatt',
  'isbjornkatt',
  'vulkankatt',
  'regnbagskatt',
  'drakkatt',
  'stjarnkatt',
  'enhornigskatt',
  'rymkatt',
];

export const RARITY_TINT: Readonly<Record<Rarity, string>> = {
  common: '#C8E6C9',
  uncommon: '#B3E5FC',
  rare: '#D1C4E9',
  epic: '#FFCCBC',
  legendary: '#FFE082',
  mythic: '#F8BBD0',
};

export function getCat(id: CatTypeId): CatType {
  return CAT_TYPES[id];
}

export function isCatUnlocked(
  cat: CatType,
  totalEarned: number,
  graskattsSold: number,
): boolean {
  const { totalEarned: requiredEarned, graskattsSold: requiredGraskatts } =
    cat.unlock;
  if (requiredEarned !== null && totalEarned < requiredEarned) return false;
  if (requiredGraskatts !== null && graskattsSold < requiredGraskatts)
    return false;
  return true;
}
