/**
 * PlotCard — handles empty / growing / ready / locked plot states.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CAT_TYPES, type CatTypeId } from '../../domain/catTypes';
import {
  effectiveSellValue,
  growthProgress,
  growthStage,
  plotUnlockThreshold,
  timeRemaining,
  type PlotState,
} from '../../domain/plots';
import { formatRemaining, formatCoins } from '../../domain/time';
import { useGameStore } from '../../store/useGameStore';
import { CatSprite } from '../CatDisplay/CatSprite';
import { PlantSheet } from './PlantSheet';

interface PlotCardProps {
  plot: PlotState;
}

export function PlotCard({ plot }: PlotCardProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [now, setNow] = useState(Date.now());
  const activeStormPlot = useGameStore((s) => s.activeStormPlot);
  const plantSeed = useGameStore((s) => s.plantSeed);
  const harvestCat = useGameStore((s) => s.harvestCat);

  useEffect(() => {
    if (plot.state !== 'growing') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [plot.state]);

  const handleClick = () => {
    if (!plot.unlocked) return;
    if (plot.state === 'empty') setShowSheet(true);
    else if (plot.state === 'ready') harvestCat(plot.index);
  };

  if (!plot.unlocked) {
    return <LockedPlotCard index={plot.index} />;
  }

  const classes = ['plot-card'];
  if (plot.state === 'ready') classes.push('is-ready');

  return (
    <>
      <button
        type="button"
        className={classes.join(' ')}
        onClick={handleClick}
        aria-label={ariaLabelFor(plot, now)}
        data-state={plot.state}
      >
        {plot.lightningBonus > 0 && (
          <span
            className="plot-bolt-badge"
            title={`Blixtbonus: +${Math.round(plot.lightningBonus * 100)}%`}
          >
            <BoltSvg /> +{Math.round(plot.lightningBonus * 100)}%
          </span>
        )}

        {activeStormPlot === plot.index && (
          <div className="plot-storm-cloud active" aria-hidden="true">
            <StormCloud />
          </div>
        )}

        <div className="plot-inner">
          {plot.state === 'empty' && (
            <div className="plot-empty-prompt">
              <span className="plus-circle">+</span>
              <span className="plot-empty-label">Plantera frö</span>
            </div>
          )}

          {plot.state === 'growing' && plot.catType !== null && (
            <GrowingStage catType={plot.catType} now={now} plot={plot} />
          )}

          {plot.state === 'ready' && plot.catType !== null && (
            <ReadyStage catType={plot.catType} plot={plot} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {showSheet && (
          <PlantSheet
            onClose={() => setShowSheet(false)}
            onPlant={(catType: CatTypeId) => {
              const ok = plantSeed(plot.index, catType);
              if (ok) setShowSheet(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function GrowingStage({
  catType,
  now,
  plot,
}: {
  catType: CatTypeId;
  now: number;
  plot: PlotState;
}) {
  const cat = CAT_TYPES[catType];
  const progress = growthProgress(plot, now);
  const stage = growthStage(progress);
  const remaining = timeRemaining(plot, now);

  const barStyle: React.CSSProperties = {
    ['--bar-from' as string]: cat.palette.body,
    ['--bar-to' as string]: cat.palette.accent,
  };

  return (
    <>
      <div className="plot-growing-stage">
        <CatSprite catType={catType} size={96} stage={stage} wiggle />
      </div>
      <div className="plot-growing-meta">
        <div className="row">
          <span className="name">{cat.name}</span>
          <span className="time num">{formatRemaining(remaining)}</span>
        </div>
        <div className="plot-bar" style={barStyle}>
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </>
  );
}

function ReadyStage({ catType, plot }: { catType: CatTypeId; plot: PlotState }) {
  const value = effectiveSellValue(plot);
  return (
    <>
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
      >
        <CatSprite catType={catType} size={104} stage={2} glow />
      </motion.div>
      <div className="plot-ready-cta">
        <span aria-hidden="true">✦</span>
        Skörda · {formatCoins(value)} mynt
      </div>
    </>
  );
}

function LockedPlotCard({ index }: { index: number }) {
  const threshold = plotUnlockThreshold(index);
  return (
    <div className="plot-card locked" aria-label={`Plot ${index + 1} låst`}>
      <div className="plot-locked">
        <span className="lock-icon" aria-hidden="true">
          <LockSvg />
        </span>
        <span className="plot-locked-threshold num">
          {formatCoins(threshold)} mynt
        </span>
        <span className="plot-locked-sub">i livstid intjänat</span>
      </div>
    </div>
  );
}

function ariaLabelFor(plot: PlotState, now: number): string {
  if (plot.state === 'empty')
    return `Plot ${plot.index + 1}: tom. Klicka för att plantera.`;
  if (plot.state === 'growing' && plot.catType) {
    const cat = CAT_TYPES[plot.catType];
    return `Plot ${plot.index + 1}: ${cat.name} växer, ${formatRemaining(
      timeRemaining(plot, now),
    )} kvar.`;
  }
  if (plot.state === 'ready' && plot.catType) {
    const cat = CAT_TYPES[plot.catType];
    return `Plot ${plot.index + 1}: ${cat.name} redo att skördas`;
  }
  return `Plot ${plot.index + 1}`;
}

function BoltSvg() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">
      <path
        d="M6 0 L0 8 L4 8 L3 14 L10 5 L6 5 Z"
        fill="#FFEB3B"
        stroke="#5A2B00"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        fill="#fff"
        stroke="#9A8EB0"
        strokeWidth="1.5"
      />
      <path
        d="M8 11V8a4 4 0 018 0v3"
        stroke="#9A8EB0"
        strokeWidth="1.6"
        fill="none"
      />
      <circle cx="12" cy="16" r="1.4" fill="#9A8EB0" />
    </svg>
  );
}

function StormCloud() {
  return (
    <svg width="56" height="40" viewBox="0 0 56 40" aria-hidden="true">
      <ellipse cx="20" cy="20" rx="14" ry="10" fill="#7E57C2" />
      <ellipse cx="38" cy="18" rx="14" ry="10" fill="#9575CD" />
      <path
        d="M 28 28 L 22 38 L 28 34 L 24 40"
        stroke="#FFEB3B"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
