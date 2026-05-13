/**
 * FloatingCoins — renders queued floating "+N mynt" labels plus a coin
 * cascade (small coin dots that arc up to the HUD counter).
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { formatCoins } from '../../domain/time';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const CASCADE_COUNT = 8;

export function FloatingCoins() {
  const items = useGameStore((s) => s.floatingCoins);
  const clear = useGameStore((s) => s.clearFloatingCoin);
  const reduced = useReducedMotion();

  return (
    <div className="floating-coins-layer" aria-hidden="true">
      <AnimatePresence>
        {items.map((c) => {
          const offsetX =
            c.plotIndex === null ? 0 : (c.plotIndex - 2.5) * 18;
          return (
            <motion.span
              key={c.id}
              className="floating-coin"
              initial={{ y: 0, opacity: 0, scale: 0.6 }}
              animate={{
                y: -64,
                opacity: [0, 1, 1, 0],
                scale: [0.6, 1.15, 1, 0.95],
              }}
              transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.15, 0.7, 1],
              }}
              onAnimationComplete={() => clear(c.id)}
              style={{ ['--coin-offset' as string]: `${offsetX}px` }}
            >
              <CoinDot /> +{formatCoins(c.amount)}
            </motion.span>
          );
        })}
        {!reduced &&
          items.flatMap((c) =>
            Array.from({ length: CASCADE_COUNT }, (_, i) => {
              const baseX = c.plotIndex === null ? 0 : (c.plotIndex - 2.5) * 18;
              const angle = (i / CASCADE_COUNT) * 2 * Math.PI;
              const radius = 50 + (i % 3) * 18;
              const targetX = baseX + Math.cos(angle) * radius - 10;
              return (
                <motion.span
                  key={`cascade-${c.id}-${i}`}
                  className="coin-cascade-dot"
                  initial={{ x: baseX, y: 0, opacity: 0, scale: 0.5 }}
                  animate={{
                    x: targetX,
                    y: -100 - (i % 4) * 14,
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1.1, 0.9, 0.4],
                    rotate: i * 22,
                  }}
                  transition={{
                    duration: 1.4,
                    delay: i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                    times: [0, 0.15, 0.7, 1],
                  }}
                >
                  🪙
                </motion.span>
              );
            }),
          )}
      </AnimatePresence>
    </div>
  );
}

function CoinDot() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ verticalAlign: 'middle', marginRight: 4 }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="#FFD56B"
        stroke="#E8A93C"
        strokeWidth="2"
      />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontFamily="Fredoka, sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="#A8741F"
      >
        ¢
      </text>
    </svg>
  );
}
