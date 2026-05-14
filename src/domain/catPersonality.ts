/**
 * Cat personalities — every harvested cat gets a randomized name + trait.
 *
 * Pure data + helpers. No React/DOM. Personalities affect sell value (and
 * potentially other systems) via small multipliers; growth modifiers are
 * surfaced for completeness but not yet applied to live planting math.
 */

export const CAT_NAMES: readonly string[] = [
  'Mittens',
  'Luna',
  'Zap',
  'Biscuit',
  'Mochi',
  'Pixel',
  'Nova',
  'Cleo',
  'Fuzz',
  'Cosmo',
  'Pebble',
  'Spark',
  'Bramble',
  'Echo',
  'Petal',
  'Storm',
  'Cipher',
  'Marble',
  'Zigzag',
  'Pudding',
  'Comet',
  'Rune',
  'Wisp',
  'Tango',
  'Blaze',
  'Pickle',
  'Nimbus',
  'Quill',
  'Sprout',
  'Vortex',
  'Dewdrop',
  'Ember',
  'Frost',
  'Gizmo',
  'Hazel',
  'Iris',
  'Juniper',
  'Kestrel',
  'Lumi',
  'Mystic',
  'Noodle',
];

export type CatTraitId =
  | 'lazy'
  | 'energetic'
  | 'lucky'
  | 'greedy'
  | 'curious'
  | 'sleepy'
  | 'brave'
  | 'tiny'
  | 'giant'
  | 'magical'
  | 'speedy'
  | 'grumpy';

export interface CatTraitEffect {
  /** Multiplier applied to grow time (>1 slows growth, <1 speeds it up). */
  growthMultiplier?: number;
  /** Multiplier applied to sell value (1 = no change). */
  valueMultiplier?: number;
  /** Extra lottery spins (currently informational). */
  lotteryBonus?: number;
}

export interface CatTrait {
  id: CatTraitId;
  /** Swedish display name */
  name: string;
  emoji: string;
  description: string;
  effect: CatTraitEffect;
}

export const CAT_TRAITS: readonly CatTrait[] = [
  {
    id: 'lazy',
    name: 'Lat',
    emoji: '😴',
    description: '+15% odlingstid',
    effect: { growthMultiplier: 1.15 },
  },
  {
    id: 'energetic',
    name: 'Energisk',
    emoji: '⚡',
    description: '-10% odlingstid',
    effect: { growthMultiplier: 0.9 },
  },
  {
    id: 'lucky',
    name: 'Lycklig',
    emoji: '🍀',
    description: '+20% säljvärde',
    effect: { valueMultiplier: 1.2 },
  },
  {
    id: 'greedy',
    name: 'Girig',
    emoji: '💰',
    description: '+30% säljvärde',
    effect: { valueMultiplier: 1.3 },
  },
  {
    id: 'curious',
    name: 'Nyfiken',
    emoji: '🔍',
    description: '+10% säljvärde',
    effect: { valueMultiplier: 1.1 },
  },
  {
    id: 'sleepy',
    name: 'Dåsig',
    emoji: '💤',
    description: '+20% odlingstid',
    effect: { growthMultiplier: 1.2 },
  },
  {
    id: 'brave',
    name: 'Modig',
    emoji: '🦁',
    description: '+15% säljvärde',
    effect: { valueMultiplier: 1.15 },
  },
  {
    id: 'tiny',
    name: 'Liten',
    emoji: '🔬',
    description: '-5% säljvärde',
    effect: { valueMultiplier: 0.95 },
  },
  {
    id: 'giant',
    name: 'Stor',
    emoji: '🔭',
    description: '+25% säljvärde',
    effect: { valueMultiplier: 1.25 },
  },
  {
    id: 'magical',
    name: 'Magisk',
    emoji: '✨',
    description: '+40% säljvärde',
    effect: { valueMultiplier: 1.4 },
  },
  {
    id: 'speedy',
    name: 'Snabb',
    emoji: '💨',
    description: '-15% odlingstid',
    effect: { growthMultiplier: 0.85 },
  },
  {
    id: 'grumpy',
    name: 'Butter',
    emoji: '😾',
    description: '-10% säljvärde',
    effect: { valueMultiplier: 0.9 },
  },
];

export const CAT_TRAITS_BY_ID: Readonly<Record<CatTraitId, CatTrait>> =
  CAT_TRAITS.reduce(
    (acc, t) => {
      acc[t.id] = t;
      return acc;
    },
    {} as Record<CatTraitId, CatTrait>,
  );

export function getTraitById(id: string): CatTrait | null {
  return (CAT_TRAITS_BY_ID as Record<string, CatTrait>)[id] ?? null;
}

export function isValidTraitId(id: string): id is CatTraitId {
  return id in CAT_TRAITS_BY_ID;
}

export interface RolledPersonality {
  name: string;
  traitId: CatTraitId;
  /** Second trait, populated only when the caller asks for one (cat_whisperer). */
  extraTraitId?: CatTraitId;
}

export interface RollPersonalityOptions {
  /**
   * Probability in [0,1] that the FIRST trait is forced to `lucky` or
   * `magical` (50/50 between them when triggered). Used by `lucky_soil`.
   */
  luckyMagicalBias?: number;
  /** When true, roll a second independent trait (used by `cat_whisperer`). */
  rollExtraTrait?: boolean;
}

/**
 * Picks a random name + trait. `rng` is injectable for testability.
 * `options` lets utility upgrades bias the roll or request a second trait.
 */
export function rollPersonality(
  rng: () => number = Math.random,
  options: RollPersonalityOptions = {},
): RolledPersonality {
  const nameIdx = Math.floor(rng() * CAT_NAMES.length);
  const fallbackName = CAT_NAMES[0] ?? 'Mittens';
  const fallbackTrait = CAT_TRAITS[0]!;
  const name = CAT_NAMES[nameIdx] ?? fallbackName;

  let traitId: CatTraitId;
  const bias = options.luckyMagicalBias ?? 0;
  if (bias > 0 && rng() < bias) {
    // Force lucky or magical.
    traitId = rng() < 0.5 ? 'lucky' : 'magical';
  } else {
    const traitIdx = Math.floor(rng() * CAT_TRAITS.length);
    traitId = (CAT_TRAITS[traitIdx] ?? fallbackTrait).id;
  }

  if (options.rollExtraTrait) {
    const extraIdx = Math.floor(rng() * CAT_TRAITS.length);
    const extraTraitId = (CAT_TRAITS[extraIdx] ?? fallbackTrait).id;
    return { name, traitId, extraTraitId };
  }
  return { name, traitId };
}

/**
 * Returns the trait's sell-value multiplier (1 if trait/effect missing).
 */
export function traitValueMultiplier(traitId: string): number {
  const trait = getTraitById(traitId);
  if (!trait || trait.effect.valueMultiplier === undefined) return 1;
  return trait.effect.valueMultiplier;
}
