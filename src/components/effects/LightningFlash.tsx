/**
 * WeatherFlash — full-screen flash overlay rendered when a weather event
 * lands on a plot. The colour gradient is swapped per event type via the
 * data-event attribute (see App.css). Meteor uses a longer, more intense
 * pulse than the rest.
 *
 * Filename retained for backwards compat (App.tsx imports `LightningFlash`).
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export function LightningFlash() {
  const strike = useGameStore((s) => s.activeStrike);

  return (
    <AnimatePresence>
      {strike !== null && (
        <motion.div
          key={`flash-${strike.id}`}
          className="lightning-flash"
          data-event={strike.eventId}
          initial={{ opacity: 0 }}
          animate={
            strike.eventId === 'meteor'
              ? { opacity: [0, 1, 0.6, 0] }
              : { opacity: [0, 0.95, 0] }
          }
          exit={{ opacity: 0 }}
          transition={{
            duration: strike.eventId === 'meteor' ? 1.1 : 0.55,
            ease: 'easeOut',
          }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
