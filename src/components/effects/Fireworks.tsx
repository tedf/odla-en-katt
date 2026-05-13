/**
 * Fireworks — full-screen rocket burst overlay. Queued by the store on
 * achievement unlocks, rare lottery wins, and mythic harvests. Each burst
 * has its own tint and runs independently. Respects reduced motion.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import type { FireworksBurst } from '../../store/useGameStore';
import { useGameStore } from '../../store/useGameStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const ROCKET_COUNT = 6;
const CONFETTI_COUNT = 24;

export function Fireworks() {
  const fireworks = useGameStore((s) => s.fireworks);
  const clear = useGameStore((s) => s.clearFirework);
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <div className="fireworks-layer" aria-hidden="true">
      <AnimatePresence>
        {fireworks.map((burst) => (
          <FireworksBurstView
            key={burst.id}
            burst={burst}
            onDone={() => clear(burst.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function FireworksBurstView({
  burst,
  onDone,
}: {
  burst: FireworksBurst;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2800);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fireworks-burst"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ ['--firework-tint' as string]: burst.tint }}
    >
      {Array.from({ length: ROCKET_COUNT }, (_, i) => {
        const left = 10 + i * (80 / ROCKET_COUNT);
        const targetTop = 18 + (i % 3) * 8;
        const delay = i * 0.18;
        return (
          <Rocket
            key={i}
            leftPct={left}
            targetTopPct={targetTop}
            delay={delay}
            tint={burst.tint}
          />
        );
      })}

      {Array.from({ length: CONFETTI_COUNT }, (_, i) => {
        const left = (i * 4.2) % 100;
        const delay = (i % 8) * 0.12;
        const dur = 2.4 + (i % 5) * 0.2;
        const bg =
          i % 3 === 0 ? '#FFD56B' : i % 3 === 1 ? burst.tint : '#FF8FA3';
        return (
          <span
            key={`c${i}`}
            className="firework-confetti"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              background: bg,
            }}
          />
        );
      })}
    </motion.div>
  );
}

function Rocket({
  leftPct,
  targetTopPct,
  delay,
  tint,
}: {
  leftPct: number;
  targetTopPct: number;
  delay: number;
  tint: string;
}) {
  return (
    <div
      className="rocket-track"
      style={{ left: `${leftPct}%`, top: `${targetTopPct}%` }}
    >
      <motion.span
        className="rocket-trail"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 1, 0], opacity: [0, 0.7, 0] }}
        transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        style={{ background: tint }}
      />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 60 + (i % 3) * 14;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        return (
          <motion.span
            key={i}
            className="rocket-star"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: dx,
              y: dy,
              opacity: [0, 1, 0],
              scale: [0, 1, 0.4],
            }}
            transition={{
              duration: 1.1,
              delay: delay + 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ background: tint }}
          />
        );
      })}
      <motion.span
        className="rocket-flash"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.4, 0], opacity: [0, 0.9, 0] }}
        transition={{
          duration: 0.6,
          delay: delay + 0.5,
          ease: 'easeOut',
        }}
        style={{ background: tint }}
      />
    </div>
  );
}
