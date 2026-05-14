/**
 * useParallax — returns a smoothed, normalized mouse position (-1..1)
 * scaled by `strength`. Used to translate background layers for depth.
 *
 * - Updates via requestAnimationFrame for sub-frame smoothing.
 * - Disabled on touch-only or reduced-motion devices (returns {0,0}).
 * - One global listener attaches per hook instance, removed on unmount.
 */

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

function hasFinePointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: fine)').matches;
}

interface ParallaxPosition {
  x: number;
  y: number;
}

const ZERO: ParallaxPosition = { x: 0, y: 0 };
/** Easing factor for the smoothed pointer position (0..1). */
const SMOOTHING = 0.12;

export function useParallax(strength: number = 1): ParallaxPosition {
  const reducedMotion = useReducedMotion();
  const [pos, setPos] = useState<ParallaxPosition>(ZERO);
  const targetRef = useRef<ParallaxPosition>(ZERO);
  const currentRef = useRef<ParallaxPosition>(ZERO);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setPos(ZERO);
      return;
    }
    if (!hasFinePointer()) {
      setPos(ZERO);
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      // Normalize to -1..1 with 0,0 at viewport centre.
      targetRef.current = {
        x: (event.clientX / w) * 2 - 1,
        y: (event.clientY / h) * 2 - 1,
      };
    };

    let lastEmitted: ParallaxPosition = ZERO;

    const animate = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      const next: ParallaxPosition = {
        x: current.x + (target.x - current.x) * SMOOTHING,
        y: current.y + (target.y - current.y) * SMOOTHING,
      };
      currentRef.current = next;
      // Only update React state when the delta is meaningful, to avoid
      // re-rendering the tree every frame.
      if (
        Math.abs(next.x - lastEmitted.x) > 0.002 ||
        Math.abs(next.y - lastEmitted.y) > 0.002
      ) {
        lastEmitted = next;
        setPos(next);
      }
      rafRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    rafRef.current = window.requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [reducedMotion]);

  return reducedMotion ? ZERO : { x: pos.x * strength, y: pos.y * strength };
}
