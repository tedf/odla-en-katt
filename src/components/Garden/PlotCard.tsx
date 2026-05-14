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
  isMature,
  plotUnlockThreshold,
  timeRemaining,
  type PlotState,
} from '../../domain/plots';
import { activeMultiplier } from '../../domain/upgrades';
import { formatRemaining, formatCoins } from '../../domain/time';
import {
  WEATHER_EVENTS_BY_ID,
  getWeatherEvent,
  type WeatherEventId,
} from '../../domain/events';
import { CAT_TRAITS_BY_ID } from '../../domain/catPersonality';
import { useGameStore } from '../../store/useGameStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { CatSprite } from '../CatDisplay/CatSprite';
import { PlantSheet } from './PlantSheet';
import { PlotParticles } from './PlotParticles';

interface PlotCardProps {
  plot: PlotState;
}

export function PlotCard({ plot }: PlotCardProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [splatKey, setSplatKey] = useState<number | null>(null);
  const activeStrike = useGameStore((s) => s.activeStrike);
  const plantSeed = useGameStore((s) => s.plantSeed);
  const harvestCat = useGameStore((s) => s.harvestCat);
  const totalEarned = useGameStore((s) => s.totalEarned);
  const activeSpeedUpgrade = useGameStore((s) => s.activeSpeedUpgrade);
  const recentHarvest = useGameStore((s) => s.recentHarvest);
  const speedMult = activeMultiplier(activeSpeedUpgrade, now);
  const { playPlant, playHarvest } = useSoundEffects();
  const myStrike =
    activeStrike && activeStrike.plotIndex === plot.index ? activeStrike : null;

  // Personality popup is anchored to the plot that was just harvested,
  // and only while the plot is still empty (we don't want it lingering
  // after the player plants a fresh seed).
  const showPersonalityPopup =
    !!recentHarvest &&
    recentHarvest.plotIndex === plot.index &&
    plot.state === 'empty';

  useEffect(() => {
    if (plot.state !== 'growing') return;
    const id = window.setInterval(() => {
      const next = Date.now();
      setNow(next);
      // When the local timer detects maturity, the store's 1s tick may
      // not have run yet — proactively fire one so the harvest button
      // appears immediately instead of after a refresh.
      if (isMature(plot, next, speedMult)) {
        useGameStore.getState().tick();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [plot, speedMult]);

  const handleClick = () => {
    if (!plot.unlocked) return;
    if (plot.state === 'empty') setShowSheet(true);
    else if (plot.state === 'ready') {
      const ok = harvestCat(plot.index);
      if (ok) playHarvest();
    }
  };

  if (!plot.unlocked) {
    return <LockedPlotCard index={plot.index} />;
  }

  const classes = ['plot-card'];
  if (plot.state === 'ready') classes.push('is-ready');
  if (plot.state === 'empty') classes.push('is-empty');
  if (splatKey !== null) classes.push('just-planted');
  if (myStrike) {
    classes.push('fx-active');
    classes.push(`fx-${myStrike.eventId}`);
  }

  // First-time onboarding tooltip for plot 0 when the player has no money.
  const showOnboardTooltip =
    plot.index === 0 && plot.state === 'empty' && totalEarned === 0;

  return (
    <>
      <button
        type="button"
        className={classes.join(' ')}
        onClick={handleClick}
        aria-label={ariaLabelFor(plot, now, speedMult)}
        data-state={plot.state}
      >
        {/* Stacked weather badges (one per event id that hit this plot). */}
        {plot.weatherEvents.length > 0 && (
          <div className="plot-weather-badges" aria-hidden="true">
            {plot.weatherEvents.map((eventId) => {
              const event = getWeatherEvent(eventId);
              const bonus = plot.weatherBonusBreakdown[eventId] ?? 0;
              if (!event) return null;
              return (
                <span
                  key={eventId}
                  className={`plot-weather-badge weather-badge--${eventId}`}
                  style={
                    {
                      ['--weather-fg' as string]: event.badgeColor,
                      ['--weather-bg' as string]: event.badgeBg,
                    } as React.CSSProperties
                  }
                  title={`${event.name}: +${Math.round(bonus * 100)}%`}
                >
                  <span className="badge-emoji">{event.emoji}</span>
                  <span className="num">+{Math.round(bonus * 100)}%</span>
                </span>
              );
            })}
          </div>
        )}

        {speedMult > 1 && plot.state === 'growing' && (
          <span
            className="plot-speed-badge"
            title={`Hastighet: ${speedMult}x`}
          >
            ⚡{speedMult}x
          </span>
        )}

        {myStrike && (
          <>
            <div
              className="plot-weather-burst"
              key={`burst-${myStrike.id}`}
              aria-hidden="true"
            >
              {WEATHER_EVENTS_BY_ID[myStrike.eventId as WeatherEventId]?.emoji ??
                '✨'}
            </div>
            <WeatherParticles
              key={`particles-${myStrike.id}`}
              eventId={myStrike.eventId}
            />
            <WeatherSpecial
              key={`special-${myStrike.id}`}
              eventId={myStrike.eventId}
            />
          </>
        )}

        {splatKey !== null && plot.state === 'growing' && (
          <div className="plot-planting-splat" aria-hidden="true">
            <span className="splat-blob" />
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const dx = Math.cos(angle) * 36;
              const dy = Math.sin(angle) * 28;
              return (
                <span
                  key={i}
                  className="splat-dust"
                  style={{
                    ['--dust-dx' as string]: `${dx}px`,
                    ['--dust-dy' as string]: `${dy}px`,
                    animationDelay: `${i * 30}ms`,
                  }}
                />
              );
            })}
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
            <GrowingStage
              catType={plot.catType}
              now={now}
              plot={plot}
              speedMult={speedMult}
            />
          )}

          {plot.state === 'ready' && plot.catType !== null && (
            <ReadyStage catType={plot.catType} plot={plot} />
          )}
        </div>

        {plot.state === 'empty' && (
          <span className="plot-grass-tufts" aria-hidden="true">
            <span className="tuft tuft-1" />
            <span className="tuft tuft-2" />
            <span className="tuft tuft-3" />
          </span>
        )}
      </button>

      {showOnboardTooltip && (
        <div className="plot-onboarding-bubble" role="note">
          <span>Klicka för att plantera en Gräskatt!</span>
          <span className="bubble-tail" aria-hidden="true" />
        </div>
      )}

      <AnimatePresence>
        {showPersonalityPopup && recentHarvest && (
          <PersonalityPopup key={recentHarvest.key} harvest={recentHarvest} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSheet && (
          <PlantSheet
            onClose={() => setShowSheet(false)}
            onPlant={(catType: CatTypeId) => {
              const ok = plantSeed(plot.index, catType);
              if (ok) {
                playPlant();
                setShowSheet(false);
                const key = Date.now();
                setSplatKey(key);
                window.setTimeout(() => {
                  setSplatKey((current) => (current === key ? null : current));
                }, 900);
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface PersonalityPopupProps {
  harvest: {
    catTypeId: CatTypeId;
    name: string;
    traitId: keyof typeof CAT_TRAITS_BY_ID;
  };
}

function PersonalityPopup({ harvest }: PersonalityPopupProps) {
  const trait = CAT_TRAITS_BY_ID[harvest.traitId];
  return (
    <motion.div
      className="personality-popup"
      role="status"
      initial={{ opacity: 0, y: 12, scale: 0.85 }}
      animate={{ opacity: 1, y: -6, scale: 1 }}
      exit={{ opacity: 0, y: -22, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <span className="personality-popup-sparkle" aria-hidden="true">
        ✨
      </span>
      <span className="personality-popup-name">{harvest.name}</span>
      <span className="personality-popup-trait">
        <span aria-hidden="true">{trait.emoji}</span>
        <span>{trait.name}</span>
      </span>
    </motion.div>
  );
}

function GrowingStage({
  catType,
  now,
  plot,
  speedMult,
}: {
  catType: CatTypeId;
  now: number;
  plot: PlotState;
  speedMult: number;
}) {
  const cat = CAT_TYPES[catType];
  const progress = growthProgress(plot, now, speedMult);
  const stage = growthStage(progress);
  const remaining = timeRemaining(plot, now, speedMult);

  const barStyle: React.CSSProperties = {
    ['--bar-from' as string]: cat.palette.body,
    ['--bar-to' as string]: cat.palette.accent,
  };

  return (
    <>
      <PlotParticles catTypeId={catType} />
      <div className="plot-growing-stage fx-cat-target">
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
        className="fx-cat-target"
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

function ariaLabelFor(plot: PlotState, now: number, speedMult: number): string {
  if (plot.state === 'empty')
    return `Plot ${plot.index + 1}: tom. Klicka för att plantera.`;
  if (plot.state === 'growing' && plot.catType) {
    const cat = CAT_TYPES[plot.catType];
    return `Plot ${plot.index + 1}: ${cat.name} växer, ${formatRemaining(
      timeRemaining(plot, now, speedMult),
    )} kvar.`;
  }
  if (plot.state === 'ready' && plot.catType) {
    const cat = CAT_TYPES[plot.catType];
    return `Plot ${plot.index + 1}: ${cat.name} redo att skördas`;
  }
  return `Plot ${plot.index + 1}`;
}

/**
 * Per-event extra visual flair: a hand-drawn lightning bolt for lightning,
 * a spinning vortex for tornado, a falling meteor + shockwave for meteor.
 */
function WeatherSpecial({ eventId }: { eventId: string }) {
  if (eventId === 'lightning') {
    return (
      <div className="plot-lightning-bolt" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <path
            d="M36 4 L18 32 L30 32 L24 60 L46 28 L34 28 Z"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (eventId === 'tornado') {
    return (
      <>
        <div className="plot-tornado-vortex" aria-hidden="true" />
        <div
          className="plot-tornado-vortex"
          style={{ inset: '25%', animationDelay: '0.15s', borderColor: 'rgba(167,139,250,0.45)' }}
          aria-hidden="true"
        />
      </>
    );
  }
  if (eventId === 'meteor') {
    return (
      <>
        <span className="plot-meteor-fall" aria-hidden="true">
          ☄️
        </span>
        <span className="plot-meteor-shock" aria-hidden="true" />
      </>
    );
  }
  return null;
}

function WeatherParticles({ eventId }: { eventId: string }) {
  const event = getWeatherEvent(eventId);
  // Pick a particle count and colour appropriate for the event.
  const count =
    eventId === 'snow' || eventId === 'meteor'
      ? 14
      : eventId === 'rain'
        ? 12
        : eventId === 'ice'
          ? 8
          : eventId === 'tornado'
            ? 10
            : 8;
  const color = event?.badgeColor ?? '#fff';

  // Deterministic-ish layout via index to avoid layout thrash; falls back
  // to random for natural-looking distribution.
  const dots = Array.from({ length: count }, (_, i) => {
    const left = (i * 53) % 100;
    const size =
      eventId === 'meteor' ? 5 : eventId === 'rain' ? 2 : eventId === 'snow' ? 4 : 3;
    const delay = (i % 7) * 70;
    return (
      <span
        key={i}
        style={{
          color,
          left: `${left}%`,
          width: `${size}px`,
          height: `${eventId === 'rain' ? size * 5 : size}px`,
          borderRadius: eventId === 'rain' ? '2px' : '50%',
          animationDelay: `${delay}ms`,
        }}
      />
    );
  });
  return <div className="plot-weather-particles">{dots}</div>;
}

function LockSvg() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        fill="#fff"
        stroke="#5b4a7c"
        strokeWidth="1.8"
      />
      <path
        d="M8 11V8a4 4 0 018 0v3"
        stroke="#5b4a7c"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="12" cy="16" r="1.6" fill="#5b4a7c" />
    </svg>
  );
}

