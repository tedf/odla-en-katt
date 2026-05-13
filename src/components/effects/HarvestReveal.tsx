/**
 * HarvestReveal — full-screen "cat grows huge" animation that plays on
 * every harvest. Legendary/mythic harvests get extra shockwave rings and
 * a screen color flash. Respects reduced motion (renders nothing).
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { CAT_TYPES } from '../../domain/catTypes';
import type { HarvestReveal as HarvestRevealData } from '../../store/useGameStore';
import { CatSprite } from '../CatDisplay/CatSprite';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const PARTICLE_COUNT = 14;

const RARITY_TINT: Record<string, string> = {
  common: 'rgba(168, 216, 185, 0.4)',
  uncommon: 'rgba(168, 197, 255, 0.4)',
  rare: 'rgba(209, 196, 233, 0.5)',
  epic: 'rgba(255, 204, 188, 0.55)',
  legendary: 'rgba(255, 224, 130, 0.65)',
  mythic: 'rgba(248, 187, 208, 0.65)',
};

export function HarvestReveal() {
  const reveal = useGameStore((s) => s.harvestReveal);
  const clear = useGameStore((s) => s.clearHarvestReveal);
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <AnimatePresence>
      {reveal && (
        <RevealLayer key={reveal.id} reveal={reveal} onDone={clear} />
      )}
    </AnimatePresence>
  );
}

interface RevealLayerProps {
  reveal: HarvestRevealData;
  onDone: () => void;
}

function RevealLayer({ reveal, onDone }: RevealLayerProps) {
  const cat = CAT_TYPES[reveal.catTypeId];
  if (!cat) return null;
  const tint = RARITY_TINT[reveal.rarity] ?? RARITY_TINT.common;
  const dramatic =
    reveal.rarity === 'legendary' || reveal.rarity === 'mythic';

  return (
    <motion.div
      className="harvest-reveal-layer"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onAnimationComplete={() => {
        window.setTimeout(onDone, 50);
      }}
      style={{ ['--reveal-tint' as string]: tint }}
    >
      {dramatic && (
        <motion.div
          className="harvest-reveal-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.8, times: [0, 0.18, 1] }}
        />
      )}

      {dramatic && (
        <>
          <span className="harvest-shockwave shock-1" aria-hidden="true" />
          <span className="harvest-shockwave shock-2" aria-hidden="true" />
          <span className="harvest-shockwave shock-3" aria-hidden="true" />
        </>
      )}

      <motion.div
        className="harvest-reveal-cat"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{
          scale: [0.6, 14, 16, 0],
          opacity: [0, 1, 0.9, 0],
          rotate: [0, -8, 6, 0],
        }}
        transition={{
          duration: 0.95,
          times: [0, 0.45, 0.7, 1],
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <CatSprite catType={cat.id} size={140} wiggle={false} glow />
      </motion.div>

      <div className="harvest-particles">
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
          const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
          const dx = Math.cos(angle) * 280;
          const dy = Math.sin(angle) * 280;
          const palette = [
            cat.palette.body,
            cat.palette.accent,
            cat.palette.glow,
            '#FFD56B',
          ];
          const color = palette[i % palette.length] ?? '#FFD56B';
          return (
            <motion.span
              key={i}
              className="harvest-particle"
              style={{ background: color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
              animate={{
                x: dx,
                y: dy,
                opacity: [1, 1, 0],
                scale: [0.6, 1.4, 0.4],
                rotate: i * 30,
              }}
              transition={{
                duration: 1.0,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1 + (i % 4) * 0.04,
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
