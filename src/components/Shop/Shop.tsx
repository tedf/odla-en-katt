/**
 * Shop — Frön (seeds), Mina frön (inventory), and Uppgraderingar
 * (permanent speed boosts) tabs. Buying spends coins.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CAT_TYPES, type CatTypeId } from '../../domain/catTypes';
import { visibleSeeds } from '../../domain/economy';
import { formatCoins, formatRemaining } from '../../domain/time';
import {
  SPEED_UPGRADES,
  activeSpeedMultiplier,
  type SpeedUpgradeId,
} from '../../domain/upgrades';
import { useGameStore } from '../../store/useGameStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { CatSprite } from '../CatDisplay/CatSprite';
import './shop.css';

type ShopTab = 'frön' | 'stall' | 'uppgraderingar';

export function Shop() {
  const [tab, setTab] = useState<ShopTab>('frön');
  const coins = useGameStore((s) => s.coins);
  const totalEarned = useGameStore((s) => s.totalEarned);
  const catsSold = useGameStore((s) => s.catsSoldByType);
  const seedInventory = useGameStore((s) => s.seedInventory);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const buySeed = useGameStore((s) => s.buySeed);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const { playBuyUpgrade, playButton } = useSoundEffects();

  const seeds = visibleSeeds(totalEarned, catsSold.graskatt ?? 0);
  const activeMult = activeSpeedMultiplier(purchasedUpgrades);

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
        <button
          role="tab"
          aria-selected={tab === 'uppgraderingar'}
          className={tab === 'uppgraderingar' ? 'active' : ''}
          onClick={() => setTab('uppgraderingar')}
        >
          Uppgraderingar
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
              onBuy={() => {
                if (buySeed(cat.id)) playButton();
              }}
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

      {tab === 'uppgraderingar' && (
        <div role="tabpanel">
          <div className="upgrade-banner">
            <div>
              <span className="upgrade-banner-label">Nuvarande hastighet</span>
              <span className="upgrade-banner-value num">{activeMult}x</span>
            </div>
            <div className="upgrade-banner-help">
              En aktiv uppgradering åt gången — högsta nivån räknas.
            </div>
          </div>
          <ul className="shop-list">
            {SPEED_UPGRADES.map((u) => {
              const owned = purchasedUpgrades.includes(u.id);
              const active = activeMult === u.multiplier && owned;
              const canAfford = coins >= u.cost;
              return (
                <UpgradeCard
                  key={u.id}
                  upgradeId={u.id}
                  name={u.name}
                  description={u.description}
                  cost={u.cost}
                  multiplier={u.multiplier}
                  tier={u.tier}
                  owned={owned}
                  active={active}
                  canAfford={canAfford}
                  onBuy={() => {
                    if (buyUpgrade(u.id)) playBuyUpgrade();
                  }}
                />
              );
            })}
          </ul>
        </div>
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

interface UpgradeCardProps {
  upgradeId: SpeedUpgradeId;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  tier: number;
  owned: boolean;
  active: boolean;
  canAfford: boolean;
  onBuy: () => void;
}

function UpgradeCard({
  upgradeId,
  name,
  description,
  cost,
  multiplier,
  tier,
  owned,
  active,
  canAfford,
  onBuy,
}: UpgradeCardProps) {
  const [shake, setShake] = useState(0);

  const handleClick = () => {
    if (owned) return;
    if (!canAfford) {
      setShake(shake + 1);
      return;
    }
    onBuy();
  };

  return (
    <motion.li
      key={upgradeId + ':' + shake}
      className={[
        'upgrade-card',
        owned ? 'owned' : '',
        active ? 'active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      animate={shake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.32 }}
    >
      <div className={`upgrade-tier tier-${tier}`} aria-hidden="true">
        <PotionSvg tier={tier} />
      </div>
      <div className="upgrade-body">
        <div className="upgrade-title">
          <span className="upgrade-name">{name}</span>
          <span className="upgrade-mult num">{multiplier}x</span>
        </div>
        <div className="upgrade-meta">{description}</div>
      </div>
      <div className="upgrade-actions">
        {active ? (
          <span className="upgrade-tag active-tag">Aktiv</span>
        ) : owned ? (
          <span className="upgrade-tag owned-tag">Ägd</span>
        ) : (
          <button
            type="button"
            className="upgrade-buy"
            disabled={!canAfford}
            onClick={handleClick}
          >
            <CoinDot /> {formatCoins(cost)}
          </button>
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

function PotionSvg({ tier }: { tier: number }) {
  const fills = ['#A8D8B9', '#A8C5FF', '#D1C4E9', '#FFE082'];
  const bodyFill = fills[tier - 1] ?? '#A8D8B9';
  const accent = ['#7BA67C', '#6F8FD9', '#9B6DD7', '#E5B83A'][tier - 1] ?? '#7BA67C';
  const sparkleCount = tier;
  return (
    <svg width="46" height="56" viewBox="0 0 46 56" aria-hidden="true">
      {/* Stopper */}
      <rect x="18" y="2" width="10" height="6" rx="1.6" fill="#7d5a44" />
      <rect x="16" y="6" width="14" height="4" rx="1" fill="#a07a5c" />
      {/* Neck */}
      <rect x="20" y="10" width="6" height="8" fill="#dfe7f0" />
      {/* Body */}
      <path
        d="M14 18 Q 12 22 12 28 Q 12 50 23 52 Q 34 50 34 28 Q 34 22 32 18 Z"
        fill={bodyFill}
        stroke={accent}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Highlight */}
      <ellipse cx="18" cy="28" rx="2.2" ry="6" fill="white" opacity="0.5" />
      {/* Sparkles */}
      {Array.from({ length: sparkleCount }, (_, i) => (
        <g key={i} transform={`translate(${24 + i * 3} ${36 - i * 4})`}>
          <path
            d="M0 -3 L1 -1 L3 0 L1 1 L0 3 L-1 1 L-3 0 L-1 -1 Z"
            fill="white"
            opacity="0.9"
          />
        </g>
      ))}
    </svg>
  );
}
