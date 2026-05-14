/**
 * SkyBackground — the living sky that cycles dawn → day → sunset → night
 * over 10 minutes. Renders behind everything (z-index: -1).
 *
 * Four stacked gradient layers cross-fade between phases. Sun arcs across
 * during day; moon arcs during night; stars fade in for sunset/night;
 * clouds drift during day/dawn.
 */

import { useMemo } from 'react';
import { useDayNight, type DayPhase } from '../../hooks/useDayNight';
import { useParallax } from '../../hooks/useParallax';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './sky-background.css';

const SKY_GRADIENTS: Record<DayPhase, string> = {
  dawn: 'linear-gradient(to bottom, #FF6B6B 0%, #FFE66D 40%, #FFF4E6 100%)',
  day: 'linear-gradient(to bottom, #87CEEB 0%, #B8E4F7 50%, #E8F4FD 100%)',
  sunset:
    'linear-gradient(to bottom, #FF4500 0%, #FF8C00 30%, #FFD700 60%, #C71585 100%)',
  night: 'linear-gradient(to bottom, #0A0A2E 0%, #1A1A4E 40%, #2D1B69 100%)',
};

/** Pseudo-random but deterministic — stable star/cloud layout across renders. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

interface Star {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

function generateStars(count: number): Star[] {
  const rand = seededRandom(42);
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      left: rand() * 100,
      top: rand() * 70, // upper 70% of sky
      size: rand() * 2 + 1,
      delay: rand() * 6,
      duration: 2 + rand() * 4,
    });
  }
  return stars;
}

const STARS = generateStars(48);

interface Cloud {
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function generateClouds(): Cloud[] {
  const rand = seededRandom(101);
  return [
    {
      top: 6 + rand() * 10,
      size: 220 + rand() * 80,
      duration: 80,
      delay: 0,
      opacity: 0.9,
    },
    {
      top: 16 + rand() * 12,
      size: 180 + rand() * 60,
      duration: 110,
      delay: -30,
      opacity: 0.75,
    },
    {
      top: 28 + rand() * 8,
      size: 240 + rand() * 50,
      duration: 130,
      delay: -70,
      opacity: 0.65,
    },
    {
      top: 38 + rand() * 6,
      size: 160 + rand() * 50,
      duration: 95,
      delay: -55,
      opacity: 0.55,
    },
  ];
}

const CLOUDS = generateClouds();

export function SkyBackground() {
  const { phase, progress } = useDayNight();
  const reducedMotion = useReducedMotion();
  const stars = useParallax(8);
  const clouds = useParallax(15);

  const sunPath = useMemo(() => {
    if (phase === 'dawn') {
      return {
        opacity: progress,
        leftPct: 10 + progress * 10,
        topPct: 70 - progress * 35,
      };
    }
    if (phase === 'day') {
      return {
        opacity: 1,
        leftPct: 20 + progress * 60,
        topPct: 35 - Math.sin(progress * Math.PI) * 20,
      };
    }
    if (phase === 'sunset') {
      return {
        opacity: 1 - progress * 0.5,
        leftPct: 80 + progress * 8,
        topPct: 35 + progress * 35,
      };
    }
    return { opacity: 0, leftPct: 90, topPct: 80 };
  }, [phase, progress]);

  const moonPath = useMemo(() => {
    if (phase === 'sunset') {
      return {
        opacity: progress * 0.6,
        leftPct: 75 + progress * 5,
        topPct: 50 - progress * 5,
      };
    }
    if (phase === 'night') {
      return {
        opacity: Math.min(1, progress * 2 + 0.5),
        leftPct: 80 - progress * 50,
        topPct: 18 + Math.sin((1 - progress) * Math.PI) * 4,
      };
    }
    return { opacity: 0, leftPct: 80, topPct: 80 };
  }, [phase, progress]);

  const starOpacity = useMemo(() => {
    if (phase === 'night') return 1;
    if (phase === 'sunset') return progress * 0.9;
    if (phase === 'dawn') return Math.max(0, 1 - progress * 1.4);
    return 0;
  }, [phase, progress]);

  const cloudOpacity = useMemo(() => {
    if (phase === 'day') return 1;
    if (phase === 'dawn') return 0.4 + progress * 0.6;
    if (phase === 'sunset') return Math.max(0, 1 - progress * 1.1);
    return 0;
  }, [phase, progress]);

  return (
    <div
      className={`sky-bg${reducedMotion ? ' is-reduced-motion' : ''}`}
      aria-hidden="true"
    >
      <div
        className={`sky-layer sky-layer--dawn${phase === 'dawn' ? ' is-active' : ''}`}
        style={{ background: SKY_GRADIENTS.dawn }}
      />
      <div
        className={`sky-layer sky-layer--day${phase === 'day' ? ' is-active' : ''}`}
        style={{ background: SKY_GRADIENTS.day }}
      />
      <div
        className={`sky-layer sky-layer--sunset${phase === 'sunset' ? ' is-active' : ''}`}
        style={{ background: SKY_GRADIENTS.sunset }}
      />
      <div
        className={`sky-layer sky-layer--night${phase === 'night' ? ' is-active' : ''}`}
        style={{ background: SKY_GRADIENTS.night }}
      />

      <div
        className="sky-stars"
        style={{
          opacity: starOpacity,
          transform: `translate3d(${stars.x}px, ${stars.y}px, 0)`,
        }}
      >
        {STARS.map((star, i) => (
          <span
            key={i}
            className="sky-star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      <div
        className="sky-sun"
        style={{
          left: `${sunPath.leftPct}%`,
          top: `${sunPath.topPct}%`,
          opacity: sunPath.opacity,
        }}
      />

      <div
        className="sky-moon"
        style={{
          left: `${moonPath.leftPct}%`,
          top: `${moonPath.topPct}%`,
          opacity: moonPath.opacity,
        }}
      >
        <span className="sky-moon-crater sky-moon-crater--a" />
        <span className="sky-moon-crater sky-moon-crater--b" />
        <span className="sky-moon-crater sky-moon-crater--c" />
      </div>

      <div
        className="sky-clouds"
        style={{
          opacity: cloudOpacity,
          transform: `translate3d(${clouds.x}px, ${clouds.y}px, 0)`,
        }}
      >
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className="sky-cloud"
            style={{
              top: `${c.top}%`,
              width: `${c.size}px`,
              height: `${c.size * 0.42}px`,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
              opacity: c.opacity,
            }}
          />
        ))}
      </div>

      <div className="sky-vignette" />
      <div className="sky-ground-overlay" />
    </div>
  );
}
