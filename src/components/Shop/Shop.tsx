/**
 * Shop — Frön (seed) tab + Mina frön (my seeds) tab. Buying spends coins.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CAT_TYPES, type CatTypeId } from '../../domain/catTypes';
import { visibleSeeds } from '../../domain/economy';
import { formatCoins, formatRemaining } from '../../domain/time';
import { useGameStore } from '../../store/useGameStore';
import { CatSprite } from '../CatDisplay/CatSprite';
import './shop.css';

type ShopTab = 'frön' | 'stall';

export function Shop() {
  const [tab, setTab] = useState<ShopTab>('frön');
  const coins = useGameStore((s) => s.coins);
  const totalEarned = useGameStore((s) => s.totalEarned);
  const catsSold = useGameStore((s) => s.catsSoldByType);
  const seedInventory = useGameStore((s) => s.seedInventory);
  const buySeed = useGameStore((s) => s.buySeed);

  const seeds = visibleSeeds(totalEarned, catsSold.graskatt ?? 0);

  return (
    <section className="section-card shop" aria-label="Butik">
      <header className="shop-header">
        <h2>
          <BagIcon /> Butik
        </h2>
        <div className="shop-balance num" aria-live="polite">
          <CoinDot /> {formatCoins(coins)}
        </div>
      </header>

      <div className="shop-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'frön'}
          className={tab === 'frön' ? 'active' : ''}
          onClick={() => setTab('frön')}
        >
          Frön
        </button>
        <button
          role="tab"
          aria-selected={tab === 'stall'}
          className={tab === 'stall' ? 'active' : ''}
          onClick={() => setTab('stall')}
        >
          Mina frön
        </button>
      </div>

      {tab === 'frön' && (
        <ul className="shop-list" role="tabpanel">
          {seeds.map(({ cat, unlocked }) => (
            <SeedCard
              key={cat.id}
              catId={cat.id}
              unlocked={unlocked}
              coins={coins}
              onBuy={() => buySeed(cat.id)}
            />
          ))}
        </ul>
      )}

      {tab === 'stall' && (
        <ul className="shop-list" role="tabpanel">
          {Object.entries(seedInventory).map(([id, count]) => {
            const cat = CAT_TYPES[id as CatTypeId];
            if (!cat) return null;
            if (count === 0 && !cat.infinite) return null;
            return (
              <li key={id} className="shop-stall-row">
                <CatSprite catType={id as CatTypeId} size={48} wiggle={false} />
                <div className="shop-stall-info">
                  <span className="shop-stall-name">{cat.name}</span>
                  <span className="muted num">
                    {cat.infinite ? 'Obegränsat' : `${count} frö kvar`}
                  </span>
                </div>
                <span className="shop-stall-count num">
                  {cat.infinite ? '∞' : `× ${count}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface SeedCardProps {
  catId: CatTypeId;
  unlocked: boolean;
  coins: number;
  onBuy: () => void;
}

function SeedCard({ catId, unlocked, coins, onBuy }: SeedCardProps) {
  const cat = CAT_TYPES[catId];
  const canAfford = coins >= cat.seedCost;
  const isFree = cat.infinite;
  const [shake, setShake] = useState(0);

  const handleClick = () => {
    if (!unlocked || isFree) return;
    if (!canAfford) {
      setShake(shake + 1);
      return;
    }
    onBuy();
  };

  return (
    <motion.li
      className={[
        'seed-card',
        `rarity-${cat.rarity}`,
        unlocked ? '' : 'locked',
      ]
        .filter(Boolean)
        .join(' ')}
      animate={shake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.32 }}
      key={shake}
    >
      <div className="seed-card-sprite">
        {unlocked ? <CatSprite catType={catId} size={64} wiggle /> : <LockShape />}
      </div>
      <div className="seed-card-body">
        <div className="seed-card-title">
          <span className="seed-card-name">{unlocked ? cat.name : '???'}</span>
          <span className="seed-card-rarity">{rarityLabel(cat.rarity)}</span>
        </div>
        <div className="seed-card-meta num">
          {unlocked
            ? `Växer ${formatRemaining(cat.growMs)} · säljs för ${cat.sellValue} mynt`
            : unlockHint(catId)}
        </div>
      </div>
      <div className="seed-card-actions">
        {isFree ? (
          <span className="seed-card-tag">Gratis ∞</span>
        ) : unlocked ? (
          <button
            type="button"
            className="seed-card-buy"
            disabled={!canAfford}
            onClick={handleClick}
          >
            <CoinDot /> {formatCoins(cat.seedCost)}
          </button>
        ) : (
          <span className="seed-card-tag locked-tag">
            <LockMini /> Låst
          </span>
        )}
      </div>
    </motion.li>
  );
}

function unlockHint(catId: CatTypeId): string {
  const cat = CAT_TYPES[catId];
  if (cat.unlock.totalEarned !== null) {
    return `Lås upp vid ${formatCoins(cat.unlock.totalEarned)} mynt intjänat`;
  }
  if (cat.unlock.graskattsSold !== null) {
    return `Sälj ${cat.unlock.graskattsSold} Gräskatter för att låsa upp`;
  }
  return 'Låst';
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

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 9h14l-1.2 11.2A2 2 0 0115.8 22H8.2a2 2 0 01-2-1.8L5 9z"
        fill="#FF8FA3"
        stroke="#D96B7F"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 9V7a3 3 0 016 0v2"
        stroke="#D96B7F"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CoinDot() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#FFD56B" stroke="#E8A93C" strokeWidth="2" />
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

function LockMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="#fff" />
      <path d="M8 11V8a4 4 0 018 0v3" stroke="#9A8EB0" strokeWidth="2" fill="none" />
    </svg>
  );
}

function LockShape() {
  return (
    <div className="seed-locked-shape">
      <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="11" width="16" height="11" rx="3" fill="#cbb8d8" />
        <path
          d="M7.5 11V8a4.5 4.5 0 019 0v3"
          stroke="#9A8EB0"
          strokeWidth="2.4"
          fill="none"
        />
      </svg>
    </div>
  );
}
