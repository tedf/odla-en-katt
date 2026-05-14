/**
 * useDayNight — drives a 10-minute (600s) sky cycle that loops continuously.
 *
 * Phase split (total 100%):
 *   dawn:    0–15%   ( 0–90s)
 *   day:     15–55%  (90–330s)
 *   sunset:  55–75%  (330–450s)
 *   night:   75–100% (450–600s)
 *
 * `progress` is normalized 0..1 _within_ the current phase so callers
 * can drive sub-animations (sun position, moon rise, etc.).
 */

import { useEffect, useState } from 'react';

export type DayPhase = 'dawn' | 'day' | 'sunset' | 'night';

const CYCLE_MS = 10 * 60 * 1000;

const PHASE_BOUNDS: ReadonlyArray<{
  phase: DayPhase;
  start: number;
  end: number;
}> = [
  { phase: 'dawn', start: 0, end: 0.15 },
  { phase: 'day', start: 0.15, end: 0.55 },
  { phase: 'sunset', start: 0.55, end: 0.75 },
  { phase: 'night', start: 0.75, end: 1 },
];

interface DayNightState {
  phase: DayPhase;
  /** 0..1 progress within the current phase */
  progress: number;
  /** 0..1 progress through the whole cycle (for parallax-style effects) */
  cycleProgress: number;
  /** Phase-aware css variables — ambient tint + warmth */
  cssVars: Record<string, string>;
}

function ambientVarsFor(phase: DayPhase): Record<string, string> {
  switch (phase) {
    case 'dawn':
      return {
        '--ambient-tint': 'rgba(255, 150, 50, 0.06)',
        '--surface-warmth': '1.02',
        '--sky-vignette': 'rgba(255, 180, 120, 0.08)',
      };
    case 'day':
      return {
        '--ambient-tint': 'rgba(180, 220, 255, 0.04)',
        '--surface-warmth': '1.0',
        '--sky-vignette': 'rgba(255, 255, 255, 0)',
      };
    case 'sunset':
      return {
        '--ambient-tint': 'rgba(255, 100, 80, 0.08)',
        '--surface-warmth': '1.01',
        '--sky-vignette': 'rgba(255, 80, 80, 0.1)',
      };
    case 'night':
      return {
        '--ambient-tint': 'rgba(10, 10, 80, 0.18)',
        '--surface-warmth': '0.94',
        '--sky-vignette': 'rgba(20, 20, 60, 0.25)',
      };
  }
}

function getCycleProgress(now: number): number {
  // Anchor the cycle to the unix epoch so reloads pick up roughly where
  // they left off (cycle is global, not per-session).
  return (now % CYCLE_MS) / CYCLE_MS;
}

function classify(cycleProgress: number): {
  phase: DayPhase;
  progress: number;
} {
  for (const bound of PHASE_BOUNDS) {
    if (cycleProgress >= bound.start && cycleProgress < bound.end) {
      const span = bound.end - bound.start;
      return {
        phase: bound.phase,
        progress: span === 0 ? 0 : (cycleProgress - bound.start) / span,
      };
    }
  }
  // Edge case — exactly at 1.0
  return { phase: 'night', progress: 1 };
}

export function useDayNight(): DayNightState {
  const [cycleProgress, setCycleProgress] = useState(() =>
    getCycleProgress(Date.now()),
  );

  useEffect(() => {
    // 1s tick is plenty for a 10-minute cycle; sub-phase CSS transitions
    // smooth the colour shifts between ticks.
    const id = window.setInterval(() => {
      setCycleProgress(getCycleProgress(Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const { phase, progress } = classify(cycleProgress);
  const cssVars = ambientVarsFor(phase);
  return { phase, progress, cycleProgress, cssVars };
}

export function phaseLabel(phase: DayPhase): { emoji: string; label: string } {
  switch (phase) {
    case 'dawn':
      return { emoji: '🌅', label: 'Gryning' };
    case 'day':
      return { emoji: '☀️', label: 'Dag' };
    case 'sunset':
      return { emoji: '🌇', label: 'Solnedgång' };
    case 'night':
      return { emoji: '🌙', label: 'Natt' };
  }
}
