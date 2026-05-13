/**
 * useReducedMotion — returns true if the user has opted out of animations
 * either via system preferences (`prefers-reduced-motion: reduce`) or via
 * the in-app toggle. Components should treat a `true` value as a request
 * to skip flashy motion and snap to the final state instead.
 */

import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

function getSystemPref(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
  const userPref = useGameStore((s) => s.settings.reducedMotion);
  const [systemPref, setSystemPref] = useState(() => getSystemPref());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => setSystemPref(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return userPref || systemPref;
}
