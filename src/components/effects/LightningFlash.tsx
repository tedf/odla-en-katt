/**
 * LightningFlash — a brief full-screen flash overlay rendered when a storm
 * lands on a plot.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export function LightningFlash() {
  const activeStormPlot = useGameStore((s) => s.activeStormPlot);

  return (
    <AnimatePresence>
      {activeStormPlot !== null && (
        <motion.div
          key="flash"
          className="lightning-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.95, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
