/**
 * LotteryWheel — animated 8-sector wheel with prize reveal.
 *
 * Geometry note: each sector starts at i * segAngle, measured clockwise
 * from the 12 o'clock position. Sector 0's center sits at segAngle/2.
 * The pointer is fixed at the top (12 o'clock). To stop with the winning
 * sector under the pointer the wheel must rotate by:
 *   target = N * 360 - (sectorCenterAngle)
 * The minus sign is required because positive rotation is clockwise and
 * we want the winning sector — which lives at +sectorCenterAngle clockwise
 * from the top — to end up at the top.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  isFreeSpinAvailable,
  LOTTERY_SECTORS,
  PAID_SPIN_COST,
} from '../../domain/lottery';
import { useGameStore } from '../../store/useGameStore';
import { formatCoins } from '../../domain/time';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import './lottery-wheel.css';

interface LotteryWheelProps {
  onClose?: () => void;
}

export function LotteryWheel({ onClose }: LotteryWheelProps) {
  const lottery = useGameStore((s) => s.lottery);
  const coins = useGameStore((s) => s.coins);
  const spinLottery = useGameStore((s) => s.spinLottery);
  const lastSpin = useGameStore((s) => s.lastSpin);
  const acknowledgeSpin = useGameStore((s) => s.acknowledgeSpin);
  const { playLotterySpin, playLotteryWin, playCoinEarn } = useSoundEffects();

  const [now, setNow] = useState(Date.now());
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [pointerBouncing, setPointerBouncing] = useState(false);
  const lastSectorRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const freeAvailable = isFreeSpinAvailable(lottery.lastFreeSpinAt, now);
  const cost = freeAvailable ? 0 : PAID_SPIN_COST;
  const canSpin = !spinning && (freeAvailable || coins >= PAID_SPIN_COST);

  const handleSpin = () => {
    if (!canSpin) return;
    setShowResult(false);
    const result = spinLottery();
    if (!result) return;
    lastSectorRef.current = result.sectorIndex;
    setSpinning(true);

    // Compute the absolute target rotation so that the winning sector's
    // CENTER ends up at the top (0deg). Sector i's center sits at
    // i*segAngle + segAngle/2 clockwise from the top, so we need the
    // wheel's total rotation R to satisfy:
    //   (sectorCenter + R) mod 360 = 0   =>   R mod 360 = -sectorCenter
    // Add a sub-sector jitter so the pointer never lands on a boundary.
    const sectorAngle = 360 / LOTTERY_SECTORS.length;
    const sectorCenter =
      result.sectorIndex * sectorAngle + sectorAngle / 2;
    const jitter = (Math.random() - 0.5) * sectorAngle * 0.7;
    const targetMod = ((-sectorCenter + jitter) % 360 + 360) % 360;

    // From the current rotation, add enough full rotations and the
    // delta-to-target so the wheel only ever spins forward.
    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const extraSpins = 5;
    setRotation(rotation + extraSpins * 360 + delta);
    playLotterySpin();
    window.setTimeout(() => {
      setSpinning(false);
      setShowResult(true);
      setPointerBouncing(true);
      window.setTimeout(() => setPointerBouncing(false), 900);
      const sector = LOTTERY_SECTORS[result.sectorIndex];
      const isRare =
        !!sector &&
        ((sector.prize.kind === 'seed' &&
          (sector.prize.seedId === 'regnbagskatt' ||
            sector.prize.seedId === 'jordgubbskatt')) ||
          (sector.prize.kind === 'coins' && (sector.prize.coins ?? 0) >= 500));
      playLotteryWin(isRare);
      if (sector?.prize.kind === 'coins') {
        window.setTimeout(() => playCoinEarn(), 200);
      }
    }, 4400);
  };

  const handleClaim = () => {
    setShowResult(false);
    acknowledgeSpin();
  };

  return (
    <section className="section-card lottery" aria-label="Lyckohjulet">
      <header className="lottery-header">
        <h2>
          <SparkleIcon /> Lyckohjulet
        </h2>
        {onClose && (
          <button className="lottery-close" onClick={onClose} aria-label="Stäng">
            ✕
          </button>
        )}
      </header>
      <p className="lottery-sub muted">
        {freeAvailable
          ? 'Du har en gratis snurr i dag!'
          : `Nästa snurr kostar ${PAID_SPIN_COST} mynt`}
      </p>

      <div className="wheel-stage">
        <div
          className={`wheel-pointer${pointerBouncing ? ' bouncing' : ''}`}
          aria-hidden="true"
        >
          <svg width="34" height="44" viewBox="0 0 34 44">
            <defs>
              <linearGradient id="ptrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FF8FA3" />
                <stop offset="1" stopColor="#D96B7F" />
              </linearGradient>
            </defs>
            {/* Pointer points DOWN — base at top, tip at the bottom, aimed
                at the wheel center. Visual: a chunky teardrop. */}
            <path
              d="M17 42 L4 12 Q17 0 30 12 Z"
              fill="url(#ptrGrad)"
              stroke="#9C4F62"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="17" cy="13" r="3" fill="white" />
          </svg>
        </div>
        <motion.div
          className="wheel"
          animate={{ rotate: rotation }}
          transition={{ duration: 4.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <WheelSvg highlightIndex={showResult ? lastSectorRef.current : null} />
        </motion.div>
        <div className="wheel-hub" aria-hidden="true">
          <SparkleIcon />
        </div>
      </div>

      <button
        type="button"
        className="lottery-spin-btn"
        onClick={handleSpin}
        disabled={!canSpin}
      >
        {spinning
          ? 'Snurrar...'
          : freeAvailable
            ? 'Snurra gratis!'
            : `Snurra (${cost} mynt)`}
      </button>

      <ul className="wheel-legend" aria-label="Vinster">
        {LOTTERY_SECTORS.map((sector, i) => (
          <li key={i} className="wheel-legend-item">
            <span
              className="wheel-legend-dot"
              style={{ background: sector.prize.color }}
              aria-hidden="true"
            />
            <span className="wheel-legend-label">{sector.prize.label}</span>
          </li>
        ))}
      </ul>

      <div className="lottery-stats num">
        <span>
          <strong>{lottery.spinsToday}</strong>
          <span className="muted">snurrar i dag</span>
        </span>
        <span>
          <strong>{freeAvailable ? '0' : 'Imorgon'}</strong>
          <span className="muted">nästa gratis snurr</span>
        </span>
      </div>

      {createPortal(
        <AnimatePresence>
          {showResult && lastSpin !== null && (
            <PrizeModal
              sectorIndex={lastSpin.sectorIndex}
              onClaim={handleClaim}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}

interface WheelSvgProps {
  highlightIndex: number | null;
}

function WheelSvg({ highlightIndex }: WheelSvgProps) {
  const cx = 110;
  const cy = 110;
  const r = 102;
  const segments = LOTTERY_SECTORS.length;
  const segAngle = 360 / segments;

  // Each sector spans [i*segAngle, (i+1)*segAngle], measured clockwise from
  // the top (-90deg in svg coordinates). Sector 0 sits at the top-right wedge.
  const arcPath = (i: number) => {
    const start = (i * segAngle - 90) * (Math.PI / 180);
    const end = ((i + 1) * segAngle - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = segAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const labelPos = (i: number) => {
    const midAngle = ((i + 0.5) * segAngle - 90) * (Math.PI / 180);
    const lr = r * 0.6;
    return {
      x: cx + lr * Math.cos(midAngle),
      y: cy + lr * Math.sin(midAngle),
      rotate: i * segAngle + segAngle / 2,
    };
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 220 220" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r + 6} fill="#3a2d4f" />
      {LOTTERY_SECTORS.map((sector, i) => {
        const isHi = highlightIndex === i;
        return (
          <g key={i}>
            <path
              d={arcPath(i)}
              fill={sector.prize.color}
              stroke="white"
              strokeWidth={isHi ? 3 : 2}
              opacity={
                highlightIndex !== null && !isHi ? 0.45 : 1
              }
            />
            {isHi && (
              <path
                d={arcPath(i)}
                fill="none"
                stroke="#3a2d4f"
                strokeWidth="3"
                style={{
                  filter:
                    'drop-shadow(0 0 8px rgba(255,213,107,0.95))',
                }}
              />
            )}
          </g>
        );
      })}
      {LOTTERY_SECTORS.map((sector, i) => {
        const pos = labelPos(i);
        const prize = sector.prize;
        // Short labels only on the wheel — long names live in the legend
        // below. Coin sectors show the amount; seed sectors a sprout glyph.
        const shortLabel =
          prize.kind === 'coins'
            ? `${prize.coins ?? 0}`
            : '🌱';
        return (
          <g
            key={`label-${i}`}
            transform={`translate(${pos.x} ${pos.y}) rotate(${pos.rotate})`}
          >
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Fredoka, sans-serif"
              fontWeight="800"
              fontSize="15"
              fill="#3a2d4f"
            >
              {shortLabel}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="28" fill="white" stroke="#3a2d4f" strokeWidth="3" />
    </svg>
  );
}

interface PrizeModalProps {
  sectorIndex: number;
  onClaim: () => void;
}

function PrizeModal({ sectorIndex, onClaim }: PrizeModalProps) {
  const sector = LOTTERY_SECTORS[sectorIndex];
  if (!sector) return null;
  const prize = sector.prize;
  const headline =
    prize.kind === 'coins'
      ? `${formatCoins(prize.coins ?? 0)} mynt!`
      : `${prize.label}!`;

  const modalStyle: React.CSSProperties = {
    ['--prize-color' as string]: prize.color,
  };

  return (
    <motion.div
      className="prize-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClaim}
    >
      <motion.div
        className="prize-modal"
        initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prize-confetti" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              style={{ ['--i' as string]: i } as React.CSSProperties}
            />
          ))}
        </div>
        <h3>Du vann!</h3>
        <div className="prize-headline">{headline}</div>
        <button className="prize-claim" onClick={onClaim}>
          Ta emot
        </button>
      </motion.div>
    </motion.div>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4"
        stroke="#FFD56B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" fill="#FFD56B" />
    </svg>
  );
}
