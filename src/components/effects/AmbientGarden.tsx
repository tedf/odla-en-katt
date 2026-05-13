/**
 * AmbientGarden — drifting butterflies, leaves, and sparkle dots that
 * float over the garden background. Pure CSS animations, absolutely
 * positioned. Disabled by reduced motion preference.
 */

import { useMemo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Drifter {
  id: number;
  kind: 'butterfly' | 'leaf' | 'sparkle';
  glyph: string;
  topPct: number;
  duration: number;
  delay: number;
  scale: number;
  swayAmplitude: number;
}

const BUTTERFLY_GLYPHS = ['🦋', '🦋', '🦋'];
const LEAF_GLYPHS = ['🍃', '🌸', '🍃'];

function buildDrifters(): Drifter[] {
  const drifters: Drifter[] = [];
  for (let i = 0; i < 4; i += 1) {
    drifters.push({
      id: i,
      kind: 'butterfly',
      glyph: BUTTERFLY_GLYPHS[i % BUTTERFLY_GLYPHS.length] ?? '🦋',
      topPct: 12 + i * 21,
      duration: 18 + i * 4,
      delay: -i * 6,
      scale: 0.85 + (i % 2) * 0.25,
      swayAmplitude: 16 + (i % 3) * 6,
    });
  }
  for (let i = 0; i < 3; i += 1) {
    drifters.push({
      id: 100 + i,
      kind: 'leaf',
      glyph: LEAF_GLYPHS[i % LEAF_GLYPHS.length] ?? '🍃',
      topPct: 28 + i * 22,
      duration: 26 + i * 3,
      delay: -8 - i * 5,
      scale: 0.7 + (i % 2) * 0.2,
      swayAmplitude: 22,
    });
  }
  for (let i = 0; i < 5; i += 1) {
    drifters.push({
      id: 200 + i,
      kind: 'sparkle',
      glyph: '✨',
      topPct: 18 + i * 16,
      duration: 4 + i * 0.8,
      delay: -i * 1.7,
      scale: 0.5 + (i % 3) * 0.18,
      swayAmplitude: 0,
    });
  }
  return drifters;
}

export function AmbientGarden() {
  const reduced = useReducedMotion();
  const drifters = useMemo(buildDrifters, []);

  if (reduced) return null;

  return (
    <div className="ambient-garden" aria-hidden="true">
      {drifters.map((d) => {
        if (d.kind === 'sparkle') {
          return (
            <span
              key={d.id}
              className="ambient-sparkle"
              style={{
                top: `${d.topPct}%`,
                left: `${(d.id * 37) % 96}%`,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
                fontSize: `${10 + d.scale * 8}px`,
              }}
            >
              {d.glyph}
            </span>
          );
        }
        return (
          <span
            key={d.id}
            className={`ambient-drifter ambient-${d.kind}`}
            style={{
              top: `${d.topPct}%`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
              fontSize: `${18 * d.scale}px`,
              ['--sway' as string]: `${d.swayAmplitude}px`,
            }}
          >
            {d.glyph}
          </span>
        );
      })}
    </div>
  );
}
