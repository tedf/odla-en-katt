/**
 * Unit tests for the weather event system (events.ts) and the plot-level
 * weather bonus accumulator (plots.ts).
 */

import { describe, expect, it } from 'vitest';
import {
  WEATHER_EVENTS,
  WEATHER_EVENTS_BY_ID,
  getWeatherEvent,
  rollAnyWeatherEvent,
  rollWeatherBonus,
  type WeatherEvent,
} from '../events';
import {
  WEATHER_BONUS_TOTAL_CAP,
  applyWeatherBonus,
  effectiveSellValue,
  type PlotState,
} from '../plots';

function basePlot(): PlotState {
  return {
    index: 0,
    unlocked: true,
    state: 'ready',
    catType: 'graskatt',
    plantedAt: 0,
    lightningBonus: 0,
    weatherEvents: [],
    weatherBonusBreakdown: {},
  };
}

describe('WEATHER_EVENTS catalogue', () => {
  it('declares all six events', () => {
    const ids = WEATHER_EVENTS.map((e) => e.id).sort();
    expect(ids).toEqual(
      ['ice', 'lightning', 'meteor', 'rain', 'snow', 'tornado'].sort(),
    );
  });

  it('uses canExceed100 only for tornado and meteor', () => {
    expect(WEATHER_EVENTS_BY_ID.lightning.canExceed100).toBe(false);
    expect(WEATHER_EVENTS_BY_ID.ice.canExceed100).toBe(false);
    expect(WEATHER_EVENTS_BY_ID.rain.canExceed100).toBe(false);
    expect(WEATHER_EVENTS_BY_ID.snow.canExceed100).toBe(false);
    expect(WEATHER_EVENTS_BY_ID.tornado.canExceed100).toBe(true);
    expect(WEATHER_EVENTS_BY_ID.meteor.canExceed100).toBe(true);
  });

  it('matches spec probabilities', () => {
    expect(WEATHER_EVENTS_BY_ID.lightning.probability).toBeCloseTo(0.005);
    expect(WEATHER_EVENTS_BY_ID.tornado.probability).toBeCloseTo(0.002);
    expect(WEATHER_EVENTS_BY_ID.meteor.probability).toBeCloseTo(0.001);
    expect(WEATHER_EVENTS_BY_ID.rain.probability).toBeCloseTo(0.008);
  });

  it('getWeatherEvent returns null for unknown id', () => {
    expect(getWeatherEvent('hurricane')).toBeNull();
    expect(getWeatherEvent('lightning')?.id).toBe('lightning');
  });
});

describe('rollWeatherBonus', () => {
  it('returns min when rng is 0', () => {
    const ev = WEATHER_EVENTS_BY_ID.meteor;
    expect(rollWeatherBonus(ev, () => 0)).toBe(ev.bonusMin);
  });

  it('returns max when rng is 1', () => {
    const ev = WEATHER_EVENTS_BY_ID.tornado;
    expect(rollWeatherBonus(ev, () => 1)).toBe(ev.bonusMax);
  });
});

describe('rollAnyWeatherEvent', () => {
  it('respects per-event cooldown', () => {
    const cooldown: Record<string, number | null> = {
      meteor: 1000,
      tornado: 1000,
      ice: 1000,
      snow: 1000,
      lightning: 1000,
      rain: 1000,
    };
    const now = 5000;
    const result = rollAnyWeatherEvent(cooldown, now, () => 0);
    // All events on cooldown — none should fire.
    expect(result).toBeNull();
  });

  it('returns null when rng exceeds all probabilities', () => {
    const result = rollAnyWeatherEvent({}, 1000, () => 0.999);
    expect(result).toBeNull();
  });

  it('returns an event when rng is very small (always fires)', () => {
    const result = rollAnyWeatherEvent({}, 1000, () => 0);
    expect(result).not.toBeNull();
  });
});

describe('applyWeatherBonus stacking', () => {
  it('adds multiple distinct events to weatherEvents list', () => {
    let plot = basePlot();
    plot = applyWeatherBonus(plot, 'lightning', 0.3);
    plot = applyWeatherBonus(plot, 'rain', 0.2);
    plot = applyWeatherBonus(plot, 'ice', 0.4);
    expect(plot.weatherEvents).toEqual(['lightning', 'rain', 'ice']);
    expect(plot.lightningBonus).toBeCloseTo(0.9);
  });

  it('respects total cap at +500%', () => {
    let plot = basePlot();
    plot = applyWeatherBonus(plot, 'tornado', 3.0);
    plot = applyWeatherBonus(plot, 'meteor', 3.0);
    expect(plot.lightningBonus).toBe(WEATHER_BONUS_TOTAL_CAP);
  });

  it('does not duplicate event id in list on repeat strike', () => {
    let plot = basePlot();
    plot = applyWeatherBonus(plot, 'rain', 0.2);
    plot = applyWeatherBonus(plot, 'rain', 0.1);
    expect(plot.weatherEvents).toEqual(['rain']);
    expect(plot.weatherBonusBreakdown.rain).toBeCloseTo(0.3);
  });

  it('respects per-event cap for non-canExceed100 events', () => {
    let plot = basePlot();
    plot = applyWeatherBonus(plot, 'lightning', 0.6, 1.0);
    plot = applyWeatherBonus(plot, 'lightning', 0.6, 1.0);
    expect(plot.weatherBonusBreakdown.lightning).toBe(1.0);
  });

  it('allows tornado/meteor to exceed +100%', () => {
    let plot = basePlot();
    plot = applyWeatherBonus(plot, 'meteor', 2.5);
    expect(plot.weatherBonusBreakdown.meteor).toBe(2.5);
  });

  it('caps multiplier feed into sellValue at +500%', () => {
    let plot = basePlot();
    const meteorEv: WeatherEvent = WEATHER_EVENTS_BY_ID.meteor;
    plot = applyWeatherBonus(plot, meteorEv.id, 10);
    expect(plot.lightningBonus).toBe(WEATHER_BONUS_TOTAL_CAP);
    // graskatt sellValue = 10, total cap = 5.0 -> 10 * 6 = 60.
    expect(effectiveSellValue(plot)).toBe(60);
  });
});
