/**
 * LotteryWheel — animated 8-sector wheel with prize reveal.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  isFreeSpinAvailable,
  LOTTERY_SECTORS,
  PAID_SPIN_COST,
} from '../../domain/lottery';
import { useGameStore } from '../../store/useGameStore';
import { formatCoins } from '../../domain/time';
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

  const [now, setNow] = useState(Date.now());
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);

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
    setSpinning(true);
    setRotation(rotation + result.spinAngle);
    window.setTimeout(() => {
      setSpinning(false);
      setShowResult(true);
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
        <div className="wheel-pointer" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 34 34">
            <path
              d="M17 30 L4 6 L30 6 Z"
              fill="#FF8FA3"
              stroke="#D96B7F"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="17" cy="9" r="3" fill="white" />
          </svg>
        </div>
        <motion.div
          className="wheel"
          animate={{ rotate: rotation }}
          transition={{ duration: 4.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <WheelSvg />
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

      <AnimatePresence>
        {showResult && lastSpin !== null && (
          <PrizeModal sectorIndex={lastSpin.sectorIndex} onClaim={handleClaim} />
        )}
      </AnimatePresence>
    </section>
  );
}

function WheelSvg() {
  const cx = 110;
  const cy = 110;
  const r = 102;
  const segments = LOTTERY_SECTORS.length;
  const segAngle = 360 / segments;

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
      {LOTTERY_SECTORS.map((sector, i) => (
        <g key={i}>
          <path
            d={arcPath(i)}
            fill={sector.prize.color}
            stroke="white"
            strokeWidth="2"
          />
        </g>
      ))}
      {LOTTERY_SECTORS.map((sector, i) => {
        const pos = labelPos(i);
        return (
          <g
            key={`label-${i}`}
            transform={`translate(${pos.x} ${pos.y}) rotate(${pos.rotate})`}
          >
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Fredoka, sans-serif"
              fontWeight="700"
              fontSize="11"
              fill="#3a2d4f"
            >
              {sector.prize.label.length > 12
                ? sector.prize.label.slice(0, 10) + '…'
                : sector.prize.label}
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
