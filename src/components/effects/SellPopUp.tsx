/**
 * SellPopUp — the big "+1250" number that floats up on a harvest/sell.
 * Text size scales with amount, color matches rarity, slight spin on entry.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const RARITY_COLOR: Record<string, string> = {
  common: '#5a7d63',
  uncommon: '#3f6aa3',
  rare: '#7456ad',
  epic: '#b35a32',
  legendary: '#a8741f',
  mythic: '#a83a6a',
};

function sizeFor(amount: number): number {
  if (amount >= 1000) return 3.4;
  if (amount >= 500) return 2.8;
  if (amount >= 100) return 2.3;
  if (amount >= 50) return 2;
  return 1.7;
}

export function SellPopUp() {
  const items = useGameStore((s) => s.sellPopUps);
  const clear = useGameStore((s) => s.clearSellPopUp);
  const reduced = useReducedMotion();

  return (
    <div className="sell-popup-layer" aria-hidden="true">
      <AnimatePresence>
        {items.map((item, idx) => {
          const offsetX = (item.plotIndex - 2.5) * 80;
          const color = RARITY_COLOR[item.rarity] ?? '#a8741f';
          const sizeRem = sizeFor(item.amount);
          if (reduced) {
            return (
              <motion.span
                key={item.id}
                className="sell-popup"
                style={{
                  ['--popup-x' as string]: `${offsetX}px`,
                  fontSize: `${sizeRem}rem`,
                  color,
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 1, 0] }}
                transition={{ duration: 0.8 }}
                onAnimationComplete={() => clear(item.id)}
              >
                +{item.amount}
              </motion.span>
            );
          }
          const driftX = offsetX + (idx % 2 === 0 ? -8 : 8);
          return (
            <motion.span
              key={item.id}
              className="sell-popup"
              style={{
                ['--popup-x' as string]: `${driftX}px`,
                fontSize: `${sizeRem}rem`,
                color,
              }}
              initial={{
                y: 0,
                opacity: 0,
                rotate: -8,
                scale: 0.6,
              }}
              animate={{
                y: -120,
                opacity: [0, 1, 1, 0],
                rotate: [-8, 4, -2, 0],
                scale: [0.6, 1.3, 1.05, 0.95],
              }}
              transition={{
                duration: 1.5,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.18, 0.7, 1],
              }}
              onAnimationComplete={() => clear(item.id)}
            >
              +{item.amount}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
