/**
 * Kattpedia — Pokédex-style collection screen.
 *
 * Two views:
 *  - Grid: every cat type as a card (silhouetted if undiscovered, glowing
 *    if unlocked, with shimmer effects by rarity).
 *  - Detail: a single cat expanded with sprite, lore, stats, and personal
 *    records. Framer Motion's `layoutId` produces the satisfying expand.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  CAT_TYPES,
  CAT_TYPE_ORDER,
  type CatType,
  type CatTypeId,
  type Rarity,
} from '../../domain/catTypes';
import { CAT_TRAITS_BY_ID, type CatTraitId } from '../../domain/catPersonality';
import { useGameStore } from '../../store/useGameStore';
import { formatCoins, formatRemaining } from '../../domain/time';
import { CatSprite } from '../CatDisplay/CatSprite';
import './kattpedia.css';

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Vanlig',
  uncommon: 'Ovanlig',
  rare: 'Sällsynt',
  epic: 'Episk',
  legendary: 'Legendarisk',
  mythic: 'Mytisk',
};

/** Section order for the rarity groups. */
const RARITY_ORDER: readonly Rarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
];

/** Soft per-rarity tint used to colour the locked silhouette circle. */
const RARITY_SILHOUETTE_TINT: Record<Rarity, string> = {
  common: 'rgba(126, 186, 128, 0.25)',
  uncommon: 'rgba(100, 181, 246, 0.25)',
  rare: 'rgba(206, 147, 216, 0.3)',
  epic: 'rgba(255, 167, 38, 0.3)',
  legendary: 'rgba(255, 213, 79, 0.35)',
  mythic: 'rgba(255, 64, 129, 0.35)',
};

interface PersonalRecord {
  count: number;
  totalEarned: number;
  bestWeatherBonus: number;
  topTrait: { id: CatTraitId; count: number } | null;
  lastName: string | null;
}

const ZERO_RECORD: PersonalRecord = {
  count: 0,
  totalEarned: 0,
  bestWeatherBonus: 0,
  topTrait: null,
  lastName: null,
};

export function Kattpedia() {
  const seedInventory = useGameStore((s) => s.seedInventory);
  const catsSold = useGameStore((s) => s.catsSoldByType);
  const unlockedTypes = useGameStore((s) => s.unlockedCatTypes);
  const harvestedCats = useGameStore((s) => s.harvestedCats);
  const [selected, setSelected] = useState<CatTypeId | null>(null);

  const records = useMemo<Partial<Record<CatTypeId, PersonalRecord>>>(() => {
    const map: Partial<Record<CatTypeId, PersonalRecord>> = {};
    for (const id of CAT_TYPE_ORDER) {
      const record = harvestedCats[id];
      const cat = CAT_TYPES[id];
      const sold = catsSold[id] ?? 0;
      if (!record || sold === 0) {
        if (sold > 0) {
          map[id] = {
            ...ZERO_RECORD,
            count: sold,
            totalEarned: sold * cat.sellValue,
          };
        }
        continue;
      }
      let bestWeatherBonus = 0;
      const traitCounts: Partial<Record<CatTraitId, number>> = {};
      let lastName: string | null = null;
      for (const p of record.personalities) {
        if (p.weatherBonus > bestWeatherBonus) bestWeatherBonus = p.weatherBonus;
        traitCounts[p.traitId] = (traitCounts[p.traitId] ?? 0) + 1;
        lastName = p.name;
      }
      let topTrait: PersonalRecord['topTrait'] = null;
      for (const [traitId, count] of Object.entries(traitCounts)) {
        if (!count) continue;
        if (!topTrait || count > topTrait.count) {
          topTrait = { id: traitId as CatTraitId, count };
        }
      }
      map[id] = {
        count: sold,
        totalEarned: sold * cat.sellValue,
        bestWeatherBonus,
        topTrait,
        lastName,
      };
    }
    return map;
  }, [harvestedCats, catsSold]);

  const totalCount = Object.values(catsSold).reduce((a, b) => a + b, 0);
  const discoveredCount = CAT_TYPE_ORDER.filter(
    (id) => (catsSold[id] ?? 0) > 0,
  ).length;

  // Group cats by rarity so the wall of locked silhouettes becomes a real
  // collection sheet ("Vanlig 1/3", "Ovanlig 0/4", ...).
  const groupedByRarity = useMemo(() => {
    const groups: Array<{
      rarity: Rarity;
      ids: CatTypeId[];
      discovered: number;
    }> = [];
    for (const rarity of RARITY_ORDER) {
      const ids = CAT_TYPE_ORDER.filter(
        (id) => CAT_TYPES[id].rarity === rarity,
      );
      if (ids.length === 0) continue;
      const discovered = ids.filter((id) => (catsSold[id] ?? 0) > 0).length;
      groups.push({ rarity, ids, discovered });
    }
    return groups;
  }, [catsSold]);

  const selectedCat = selected ? CAT_TYPES[selected] : null;
  const selectedRecord = selected ? (records[selected] ?? ZERO_RECORD) : null;
  const selectedSeedCount = selected ? (seedInventory[selected] ?? 0) : 0;

  return (
    <section className="section-card kattpedia" aria-label="Kattpedia">
      <header className="kattpedia-header">
        <div className="kattpedia-header-titles">
          <h2>
            <PediaIcon />
            Kattpedia
          </h2>
          <p className="kattpedia-subtitle">
            En vetenskaplig samling av varje upptäckt katt
          </p>
        </div>
        <div className="kattpedia-stats num">
          <div className="kattpedia-stat">
            <span className="kattpedia-stat-num">{discoveredCount}</span>
            <span className="kattpedia-stat-label">
              / {CAT_TYPE_ORDER.length} arter
            </span>
          </div>
          <div className="kattpedia-stat">
            <span className="kattpedia-stat-num">{totalCount}</span>
            <span className="kattpedia-stat-label">odlade</span>
          </div>
        </div>
      </header>

      <LayoutGroup id="kattpedia">
        <div className="kattpedia-groups">
          {groupedByRarity.map((group) => (
            <section
              key={group.rarity}
              className={`kattpedia-group rarity-${group.rarity}`}
              aria-label={RARITY_LABEL[group.rarity]}
            >
              <header className="kattpedia-group-head">
                <span
                  className={`kattpedia-group-label rarity-${group.rarity}`}
                >
                  {RARITY_LABEL[group.rarity]}
                </span>
                <span className="kattpedia-group-count num">
                  {group.discovered}/{group.ids.length}
                </span>
              </header>
              <div className="kattpedia-grid" role="list">
                {group.ids.map((id) => {
                  const cat = CAT_TYPES[id];
                  const sold = catsSold[id] ?? 0;
                  const unlocked = unlockedTypes.includes(id);
                  const discovered = sold > 0;
                  const record = records[id] ?? ZERO_RECORD;
                  return (
                    <KattpediaCard
                      key={id}
                      cat={cat}
                      unlocked={unlocked}
                      discovered={discovered}
                      record={record}
                      onSelect={() => discovered && setSelected(id)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <AnimatePresence>
          {selectedCat && selectedRecord && (
            <KattpediaDetail
              key={selectedCat.id}
              cat={selectedCat}
              record={selectedRecord}
              seedCount={selectedSeedCount}
              onBack={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>
    </section>
  );
}

interface KattpediaCardProps {
  cat: CatType;
  unlocked: boolean;
  discovered: boolean;
  record: PersonalRecord;
  onSelect: () => void;
}

function KattpediaCard({
  cat,
  unlocked,
  discovered,
  record,
  onSelect,
}: KattpediaCardProps) {
  const layoutId = `kattpedia-card-${cat.id}`;
  const unlockTeaser = !discovered ? unlockHint(cat) : null;
  return (
    <motion.button
      layoutId={layoutId}
      type="button"
      role="listitem"
      onClick={onSelect}
      disabled={!discovered}
      className={[
        'kattpedia-card',
        `rarity-${cat.rarity}`,
        discovered ? 'is-discovered' : 'is-locked',
        !unlocked ? 'is-unrevealed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      style={
        {
          ['--card-accent']: cat.palette.accent,
          ['--card-glow']: cat.palette.glow,
          ['--card-body']: cat.palette.body,
          ['--card-silhouette-tint']: RARITY_SILHOUETTE_TINT[cat.rarity],
        } as React.CSSProperties
      }
    >
      <span className="kattpedia-card-shimmer" aria-hidden="true" />
      <span className="kattpedia-card-sprite">
        {discovered ? (
          <CatSprite
            catType={cat.id}
            size={80}
            wiggle
            glow={cat.rarity !== 'common'}
          />
        ) : (
          <UnknownSilhouette />
        )}
      </span>
      <div className="kattpedia-card-meta">
        <span className="kattpedia-card-name">
          {discovered ? cat.name : '??? Okänd katt'}
        </span>
        <span className={`kattpedia-rarity-badge rarity-${cat.rarity}`}>
          {RARITY_LABEL[cat.rarity]}
        </span>
        {unlockTeaser && (
          <span className="kattpedia-card-hint">{unlockTeaser}</span>
        )}
      </div>
      {discovered && record.count > 0 && (
        <span className="kattpedia-card-count num">×{record.count}</span>
      )}
    </motion.button>
  );
}

/**
 * Returns a short Swedish unlock teaser for a locked cat, derived from
 * its `unlock` data. Gräskatt has no unlock condition.
 */
function unlockHint(cat: CatType): string | null {
  if (cat.unlock.totalEarned !== null) {
    return `Låses upp vid ${formatCoins(cat.unlock.totalEarned)} mynt`;
  }
  if (cat.unlock.graskattsSold !== null) {
    return `Sälj ${cat.unlock.graskattsSold} Gräskatter`;
  }
  return null;
}

interface KattpediaDetailProps {
  cat: CatType;
  record: PersonalRecord;
  seedCount: number;
  onBack: () => void;
}

function KattpediaDetail({
  cat,
  record,
  seedCount,
  onBack,
}: KattpediaDetailProps) {
  const layoutId = `kattpedia-card-${cat.id}`;
  const topTrait = record.topTrait
    ? CAT_TRAITS_BY_ID[record.topTrait.id]
    : null;
  return (
    <motion.div
      layoutId={layoutId}
      className={`kattpedia-detail rarity-${cat.rarity}`}
      style={
        {
          ['--card-accent']: cat.palette.accent,
          ['--card-glow']: cat.palette.glow,
          ['--card-body']: cat.palette.body,
        } as React.CSSProperties
      }
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      <motion.div
        className="kattpedia-detail-inner"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
      >
        <button
          type="button"
          className="kattpedia-back"
          onClick={onBack}
          aria-label="Tillbaka till samlingen"
        >
          <BackArrow />
          <span>Tillbaka</span>
        </button>

        <div className="kattpedia-detail-grid">
          <div className="kattpedia-detail-sprite-wrap">
            <span className="kattpedia-detail-glow" aria-hidden="true" />
            <CatSprite catType={cat.id} size={160} wiggle glow />
            {cat.rarity === 'mythic' && (
              <div className="kattpedia-mythic-burst" aria-hidden="true">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className="kattpedia-mythic-mote"
                    style={
                      {
                        ['--mote-angle' as string]: `${(i / 14) * 360}deg`,
                        ['--mote-delay' as string]: `${(i % 7) * 0.07}s`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <div className="kattpedia-detail-meta">
            <span className={`kattpedia-rarity-badge rarity-${cat.rarity}`}>
              {RARITY_LABEL[cat.rarity]}
            </span>
            <h3 className="kattpedia-detail-name">{cat.name}</h3>
            <p className="kattpedia-detail-flavor">{cat.description}</p>
            <p className="kattpedia-detail-lore">{cat.lore}</p>
          </div>
        </div>

        <div className="kattpedia-stat-blocks">
          <div className="kattpedia-stat-block">
            <span className="kattpedia-stat-label">Växttid</span>
            <span className="kattpedia-stat-value num">
              {formatRemaining(cat.growMs)}
            </span>
          </div>
          <div className="kattpedia-stat-block">
            <span className="kattpedia-stat-label">Försäljningsvärde</span>
            <span className="kattpedia-stat-value num">
              {formatCoins(cat.sellValue)} mynt
            </span>
          </div>
          <div className="kattpedia-stat-block">
            <span className="kattpedia-stat-label">Fröpris</span>
            <span className="kattpedia-stat-value num">
              {cat.infinite
                ? '∞ gratis'
                : cat.seedCost === 0
                  ? '0 mynt'
                  : `${formatCoins(cat.seedCost)} mynt`}
            </span>
          </div>
        </div>

        <div className="kattpedia-personal">
          <h4 className="kattpedia-personal-title">
            Din historia med {cat.name}
          </h4>
          <div className="kattpedia-personal-rows">
            <PersonalRow
              label="Du har odlat denna"
              value={`${record.count} ${record.count === 1 ? 'gång' : 'gånger'}`}
            />
            <PersonalRow
              label="Totalt tjänat"
              value={`${formatCoins(record.totalEarned)} mynt`}
            />
            <PersonalRow
              label="Bästa väderbonus"
              value={
                record.bestWeatherBonus > 0
                  ? `+${Math.round(record.bestWeatherBonus * 100)}%`
                  : 'ingen ännu'
              }
            />
            <PersonalRow
              label="Vanligaste personlighet"
              value={
                topTrait ? `${topTrait.emoji} ${topTrait.name}` : 'okänd'
              }
            />
            <PersonalRow
              label="Senast namngiven"
              value={record.lastName ?? '—'}
            />
            <PersonalRow
              label="Frön i påsen"
              value={cat.infinite ? '∞' : `${seedCount}`}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PersonalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="kattpedia-personal-row">
      <span className="kattpedia-personal-label">{label}</span>
      <span className="kattpedia-personal-value num">{value}</span>
    </div>
  );
}

function UnknownSilhouette() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="kattpedia-unknown"
    >
      <ellipse cx="60" cy="78" rx="34" ry="28" fill="currentColor" />
      <ellipse cx="60" cy="50" rx="28" ry="26" fill="currentColor" />
      <path d="M 38 32 L 42 14 L 54 28 Z" fill="currentColor" />
      <path d="M 82 32 L 78 14 L 66 28 Z" fill="currentColor" />
      <text
        x="60"
        y="64"
        textAnchor="middle"
        fontSize="36"
        fill="#fff"
        fontWeight="700"
      >
        ?
      </text>
    </svg>
  );
}

function PediaIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        fill="#FF8FA3"
        stroke="#D96B7F"
        strokeWidth="1.4"
      />
      <path d="M3 8h18" stroke="#D96B7F" strokeWidth="1.4" fill="none" />
      <circle cx="8" cy="6" r="0.9" fill="#fff" />
      <circle cx="11" cy="6" r="0.9" fill="#fff" />
    </svg>
  );
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
