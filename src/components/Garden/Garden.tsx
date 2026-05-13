/**
 * Garden — 6-plot grid with ambient atmosphere (butterflies, leaves,
 * sparkles) and a "next plot unlocks at" progress bar on desktop.
 */

import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { activeMultiplier } from '../../domain/upgrades';
import { nextPlotUnlock } from '../../domain/economy';
import { formatCoins } from '../../domain/time';
import { PlotCard } from './PlotCard';
import { AmbientGarden } from '../effects/AmbientGarden';
import './garden.css';

export function Garden() {
  const plots = useGameStore((s) => s.plots);
  const totalEarned = useGameStore((s) => s.totalEarned);
  const activeSpeedUpgrade = useGameStore((s) => s.activeSpeedUpgrade);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activeSpeedUpgrade) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeSpeedUpgrade]);
  const speedMult = activeMultiplier(activeSpeedUpgrade, now);
  const readyCount = plots.filter((p) => p.state === 'ready').length;
  const { playHarvest } = useSoundEffects();
  const upcoming = nextPlotUnlock(totalEarned);

  return (
    <section className="section-card garden-section" aria-label="Trädgården">
      <AmbientGarden />
      <header className="garden-header">
        <h2>
          <LeafIcon /> Trädgården
          {speedMult > 1 && (
            <span className="garden-speed-chip" title={`Hastighet: ${speedMult}x`}>
              ⚡{speedMult}x
            </span>
          )}
        </h2>
        {readyCount > 0 && (
          <button
            className="garden-harvest-all"
            onClick={() => {
              useGameStore.getState().harvestAllReady();
              playHarvest();
            }}
            type="button"
          >
            Skörda alla ({readyCount})
          </button>
        )}
      </header>
      <div className="garden-grid">
        {plots.map((plot) => (
          <PlotCard key={plot.index} plot={plot} />
        ))}
      </div>

      {upcoming !== null && (
        <div className="garden-unlock-progress" aria-live="polite">
          <div className="garden-unlock-row">
            <span className="garden-unlock-label">
              Nästa odlingsyta öppnas vid
            </span>
            <span className="garden-unlock-value num">
              {formatCoins(upcoming.threshold)} mynt
            </span>
          </div>
          <progress
            className="garden-unlock-bar"
            value={Math.min(totalEarned, upcoming.threshold)}
            max={upcoming.threshold}
          />
          <span className="garden-unlock-now num">
            {formatCoins(totalEarned)} / {formatCoins(upcoming.threshold)}
          </span>
        </div>
      )}
    </section>
  );
}

function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20s2-10 10-12c6-1.5 8 1.5 8 1.5s-2 10-10 12c-6 1.5-8-1.5-8-1.5z"
        fill="#A8D8B9"
        stroke="#7BA67C"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 20c4-6 8-8 14-10" stroke="#7BA67C" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
