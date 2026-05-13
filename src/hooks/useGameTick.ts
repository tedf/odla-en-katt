/**
 * useGameTick — runs the store tick on a 1s interval and registers
 * visibility/beforeunload save hooks.
 */

import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export function useGameTick(): void {
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      useGameStore.getState().tick();
    }, 1000);

    const onVisChange = () => {
      if (document.visibilityState === 'hidden') {
        useGameStore.getState().forceSave();
      } else {
        useGameStore.getState().tick();
      }
    };

    const onUnload = () => {
      useGameStore.getState().forceSave();
    };

    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);
}
