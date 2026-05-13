/**
 * RecapModal — "Medan du var borta..." reveal for offline catch-up.
 */

import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { formatRemaining } from '../../domain/time';

export function RecapModal() {
  const recap = useGameStore((s) => s.pendingRecap);
  const dismissRecap = useGameStore((s) => s.dismissRecap);

  if (!recap) return null;

  return (
    <motion.div
      className="plant-sheet-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={dismissRecap}
    >
      <motion.div
        className="plant-sheet"
        initial={{ y: 60, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Medan du var borta...</h3>
        <p className="plant-sheet-sub">
          Du var iväg i {formatRemaining(recap.awayMs)}. Under tiden växte{' '}
          {recap.readyPlots.length} kat
          {recap.readyPlots.length === 1 ? 't' : 'ter'} klart!
        </p>
        <button className="plant-sheet-close" onClick={dismissRecap}>
          Härligt!
        </button>
      </motion.div>
    </motion.div>
  );
}
