/**
 * Garden — 6-plot grid. Each plot is a PlotCard with depth/lip styling.
 */

import { useGameStore } from '../../store/useGameStore';
import { PlotCard } from './PlotCard';
import './garden.css';

export function Garden() {
  const plots = useGameStore((s) => s.plots);
  const readyCount = plots.filter((p) => p.state === 'ready').length;

  return (
    <section className="section-card garden-section" aria-label="Trädgården">
      <header className="garden-header">
        <h2>
          <LeafIcon /> Trädgården
        </h2>
        {readyCount > 0 && (
          <button
            className="garden-harvest-all"
            onClick={() => useGameStore.getState().harvestAllReady()}
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
