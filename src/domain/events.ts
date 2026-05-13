/**
 * Weather event system.
 *
 * A weather event is a transient buff that strikes growing plots, adds a
 * value bonus, and triggers UI fanfare. Each event has its own per-second
 * trigger probability, bonus range, palette, and sound. Multiple distinct
 * events can stack on the same plot during growth. The total bonus is
 * capped at WEATHER_BONUS_TOTAL_CAP (+500%) in `plots.ts`.
 *
 * Pure data + helpers. No React/DOM.
 */

import {
  isLightningOffCooldown,
  LIGHTNING_BASE_CHANCE_PER_SEC,
  LIGHTNING_BONUS_MAX,
  LIGHTNING_BONUS_MIN,
  LIGHTNING_COOLDOWN_MS,
  rollLightningBonus,
  rollLightningTrigger,
} from './lightning';

// Keep lottery re-exports for compatibility with anything that imports
// from './events'.
export * from './lottery';
export {
  isLightningOffCooldown,
  LIGHTNING_BASE_CHANCE_PER_SEC,
  LIGHTNING_BONUS_MAX,
  LIGHTNING_BONUS_MIN,
  LIGHTNING_COOLDOWN_MS,
  rollLightningBonus,
  rollLightningTrigger,
};

export type WeatherEventId =
  | 'lightning'
  | 'tornado'
  | 'ice'
  | 'rain'
  | 'snow'
  | 'meteor';

export interface WeatherEvent {
  id: WeatherEventId;
  name: string;
  emoji: string;
  /** Trigger probability per growing plot per tick (~1 tick = 1 second). */
  probability: number;
  bonusMin: number;
  bonusMax: number;
  /** True if a single event can push the per-event bonus beyond +100%. */
  canExceed100: boolean;
  /** Foreground accent color (used for badges, glow). */
  badgeColor: string;
  /** Badge / overlay background. */
  badgeBg: string;
  /** Logical sound id used by the sound effects hook. */
  sound: 'lightning' | 'tornado' | 'ice' | 'rain' | 'snow' | 'meteor';
  /** Short Swedish description. */
  description: string;
  /**
   * Global cooldown after the event fires anywhere. Lightning keeps the
   * original 30s cooldown; rarer/more powerful events have longer ones to
   * prevent spammy banner stacking. Each event has its own independent
   * cooldown timer.
   */
  cooldownMs: number;
  /** Order weight for stacking badges (lower = earlier badge). */
  order: number;
}

/**
 * Source of truth for all weather events. The list is also exported as an
 * array under WEATHER_EVENTS for iteration order (rare events last).
 */
export const WEATHER_EVENTS_BY_ID: Readonly<
  Record<WeatherEventId, WeatherEvent>
> = {
  rain: {
    id: 'rain',
    name: 'Regnstorm',
    emoji: '🌧',
    probability: 0.008,
    bonusMin: 0.1,
    bonusMax: 0.35,
    canExceed100: false,
    badgeColor: '#6EE7B7',
    badgeBg: '#065F46',
    sound: 'rain',
    description: 'Friskt regn!',
    cooldownMs: 25_000,
    order: 0,
  },
  lightning: {
    id: 'lightning',
    name: 'Blixt',
    emoji: '⚡',
    probability: 0.005,
    bonusMin: 0.2,
    bonusMax: 0.5,
    canExceed100: false,
    badgeColor: '#FCD34D',
    badgeBg: '#1F2937',
    sound: 'lightning',
    description: 'Elektrisk energi!',
    cooldownMs: LIGHTNING_COOLDOWN_MS,
    order: 1,
  },
  ice: {
    id: 'ice',
    name: 'Isstorm',
    emoji: '🧊',
    probability: 0.003,
    bonusMin: 0.3,
    bonusMax: 0.8,
    canExceed100: false,
    badgeColor: '#BAE6FD',
    badgeBg: '#0369A1',
    sound: 'ice',
    description: 'Frusen perfektion!',
    cooldownMs: 45_000,
    order: 2,
  },
  snow: {
    id: 'snow',
    name: 'Snöstorm',
    emoji: '❄',
    probability: 0.003,
    bonusMin: 0.4,
    bonusMax: 0.9,
    canExceed100: false,
    badgeColor: '#E0F2FE',
    badgeBg: '#0284C7',
    sound: 'snow',
    description: 'Magisk snö!',
    cooldownMs: 50_000,
    order: 3,
  },
  tornado: {
    id: 'tornado',
    name: 'Tornado',
    emoji: '🌪',
    probability: 0.002,
    bonusMin: 0.5,
    bonusMax: 1.5,
    canExceed100: true,
    badgeColor: '#A78BFA',
    badgeBg: '#4C1D95',
    sound: 'tornado',
    description: 'Virvlande kraft!',
    cooldownMs: 80_000,
    order: 4,
  },
  meteor: {
    id: 'meteor',
    name: 'Meteoritregn',
    emoji: '☄',
    probability: 0.001,
    bonusMin: 1.0,
    bonusMax: 3.0,
    canExceed100: true,
    badgeColor: '#FEF3C7',
    badgeBg: '#92400E',
    sound: 'meteor',
    description: 'Kosmisk kraft! MEGA BONUS!',
    cooldownMs: 180_000,
    order: 5,
  },
};

/** Iteration order: common to rare. */
export const WEATHER_EVENTS: readonly WeatherEvent[] = [
  WEATHER_EVENTS_BY_ID.rain,
  WEATHER_EVENTS_BY_ID.lightning,
  WEATHER_EVENTS_BY_ID.ice,
  WEATHER_EVENTS_BY_ID.snow,
  WEATHER_EVENTS_BY_ID.tornado,
  WEATHER_EVENTS_BY_ID.meteor,
];

export function getWeatherEvent(id: string): WeatherEvent | null {
  if ((WEATHER_EVENTS_BY_ID as Record<string, WeatherEvent>)[id]) {
    return (WEATHER_EVENTS_BY_ID as Record<string, WeatherEvent>)[id] ?? null;
  }
  return null;
}

/**
 * Roll a uniform bonus for the given event id. Default rng is Math.random.
 */
export function rollWeatherBonus(
  event: WeatherEvent,
  rng: () => number = Math.random,
): number {
  const span = event.bonusMax - event.bonusMin;
  return event.bonusMin + rng() * span;
}

/**
 * Returns true if a single roll fires for the given event probability.
 */
export function rollWeatherTrigger(
  probability: number,
  rng: () => number = Math.random,
): boolean {
  return rng() < probability;
}

/**
 * Picks the first weather event whose per-event cooldown is satisfied AND
 * whose probability roll fires this tick. Iterates from rarest to most common
 * so that on a very lucky tick the rarer (more interesting) event wins.
 *
 * `cooldownState[eventId]` should hold the last firing time per event.
 */
export function rollAnyWeatherEvent(
  cooldownState: Readonly<Record<string, number | null>>,
  now: number,
  rng: () => number = Math.random,
): WeatherEvent | null {
  // Rarest first so rare upgrades the result.
  for (let i = WEATHER_EVENTS.length - 1; i >= 0; i--) {
    const ev = WEATHER_EVENTS[i];
    if (!ev) continue;
    const last = cooldownState[ev.id] ?? null;
    if (last !== null && now - last < ev.cooldownMs) continue;
    if (rollWeatherTrigger(ev.probability, rng)) {
      return ev;
    }
  }
  return null;
}
