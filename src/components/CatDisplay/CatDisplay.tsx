/**
 * CatDisplay — shows the seed inventory plus a "barn" of cats grown so far.
 * Each row uses a custom SVG sprite (no emoji) plus count badges.
 */

import { CAT_TYPE_ORDER, CAT_TYPES } from '../../domain/catTypes';
import { useGameStore } from '../../store/useGameStore';
import { CatSprite } from './CatSprite';
import './cat-display.css';

export function CatDisplay() {
  const seedInventory = useGameStore((s) => s.seedInventory);
  const catsSold = useGameStore((s) => s.catsSoldByType);
  const unlockedTypes = useGameStore((s) => s.unlockedCatTypes);

  const totalGrown = Object.values(catsSold).reduce((a, b) => a + b, 0);
  const collectionCount = CAT_TYPE_ORDER.filter(
    (id) => (catsSold[id] ?? 0) > 0,
  ).length;

  return (
    <section className="section-card cat-display" aria-label="Stall och frön">
      <header className="cat-display-header">
        <h2>
          <BarnIcon /> Kattstall
        </h2>
        <div className="cat-display-stats num">
          <span>
            <strong>{collectionCount}</strong>
            <span className="muted">/{CAT_TYPE_ORDER.length} arter</span>
          </span>
          <span>
            <strong>{totalGrown}</strong>
            <span className="muted">odlade</span>
          </span>
        </div>
      </header>

      <ul className="cat-display-list">
        {CAT_TYPE_ORDER.map((id) => {
          const cat = CAT_TYPES[id];
          const sold = catsSold[id] ?? 0;
          const seedCount = seedInventory[id] ?? 0;
          const unlocked = unlockedTypes.includes(id);
          const showSilhouette = !unlocked && sold === 0;

          return (
            <li
              key={id}
              className={[
                'cat-row',
                `rarity-${cat.rarity}`,
                showSilhouette ? 'silhouette' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="cat-row-sprite">
                {showSilhouette ? (
                  <SilhouetteSvg />
                ) : (
                  <CatSprite catType={id} size={56} wiggle={!showSilhouette} />
                )}
              </div>
              <div className="cat-row-info">
                <span className="cat-row-name">
                  {showSilhouette ? '???' : cat.name}
                </span>
                <span className="cat-row-rarity">
                  {showSilhouette ? 'Olåst snart...' : rarityLabel(cat.rarity)}
                </span>
              </div>
              <div className="cat-row-badges">
                {cat.infinite && (
                  <span className="badge badge-infinite" title="Obegränsade frön">
                    ∞
                  </span>
                )}
                {!cat.infinite && seedCount > 0 && (
                  <span className="badge badge-seed" title={`${seedCount} frö`}>
                    {seedCount}
                  </span>
                )}
                {sold > 0 && (
                  <span className="badge badge-sold" title={`${sold} sålda`}>
                    {sold}×
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function rarityLabel(r: string): string {
  const map: Record<string, string> = {
    common: 'Vanlig',
    uncommon: 'Ovanlig',
    rare: 'Sällsynt',
    epic: 'Episk',
    legendary: 'Legendarisk',
    mythic: 'Mytisk',
  };
  return map[r] ?? r;
}

function BarnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11l9-7 9 7v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z"
        fill="#FF8FA3"
        stroke="#D96B7F"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 21V13h6v8" stroke="#D96B7F" strokeWidth="1.4" fill="white" />
    </svg>
  );
}

function SilhouetteSvg() {
  return (
    <svg width="56" height="56" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="72" rx="34" ry="28" fill="#cbb8d8" />
      <ellipse cx="60" cy="46" rx="28" ry="26" fill="#cbb8d8" />
      <path d="M 38 30 L 42 12 L 54 26 Z" fill="#a48fb3" />
      <path d="M 82 30 L 78 12 L 66 26 Z" fill="#a48fb3" />
      <text x="60" y="62" textAnchor="middle" fontSize="32" fill="white" fontWeight="700">
        ?
      </text>
    </svg>
  );
}
