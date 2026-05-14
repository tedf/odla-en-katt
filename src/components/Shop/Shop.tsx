/**
 * Shop — Frön (seeds), Mina frön (inventory), and Uppgraderingar
 * (time-limited speed boosts) tabs. Buying spends coins.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CAT_TYPES, type CatTypeId } from '../../domain/catTypes';
import { visibleSeeds } from '../../domain/economy';
import { formatCoins, formatRemaining } from '../../domain/time';
import {
  UTILITY_UPGRADES,
  activeMultiplier,
  classifySpeedUpgrades,
  getUpgradeById,
  type ActiveSpeedUpgrade,
  type SpeedUpgradeId,
  type SpeedUpgradeStatus,
  type UtilityUpgradeId,
  type UtilityUpgrade,
} from '../../domain/upgrades';
import { useGameStore } from '../../store/useGameStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { CatSprite } from '../CatDisplay/CatSprite';
import './shop.css';

type ShopTab = 'frön' | 'stall' | 'uppgraderingar' | 'verktyg';

interface ShopProps {
  onOpenLottery?: () => void;
}

export function Shop({ onOpenLottery }: ShopProps = {}) {
  const [tab, setTab] = useState<ShopTab>('frön');
  const coins = useGameStore((s) => s.coins);
  const totalEarned = useGameStore((s) => s.totalEarned);
  const catsSold = useGameStore((s) => s.catsSoldByType);
  const seedInventory = useGameStore((s) => s.seedInventory);
  const activeSpeedUpgrade = useGameStore((s) => s.activeSpeedUpgrade);
  const utilityUpgrades = useGameStore((s) => s.utilityUpgrades);
  const buySeed = useGameStore((s) => s.buySeed);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const buyUtilityUpgrade = useGameStore((s) => s.buyUtilityUpgrade);
  const { playBuyUpgrade, playButton } = useSoundEffects();

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
        <button
          role="tab"
          aria-selected={tab === 'uppgraderingar'}
          className={tab === 'uppgraderingar' ? 'active' : ''}
          onClick={() => setTab('uppgraderingar')}
        >
          Uppgraderingar
        </button>
        <button
          role="tab"
          aria-selected={tab === 'verktyg'}
          className={tab === 'verktyg' ? 'active' : ''}
          onClick={() => setTab('verktyg')}
        >
          Verktyg
        </button>
      </div>

      {onOpenLottery && (
        <button
          type="button"
          className="shop-lottery-shortcut"
          onClick={() => {
            playButton();
            onOpenLottery();
          }}
        >
          <span aria-hidden="true">🎰</span> Öppna Lyckohjulet
        </button>
      )}

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

      {tab === 'stall' && <StallTab seedInventory={seedInventory} />}

      {tab === 'uppgraderingar' && (
        <UpgradesTab
          coins={coins}
          activeSpeedUpgrade={activeSpeedUpgrade}
          onBuy={(id) => {
            if (buyUpgrade(id)) playBuyUpgrade();
          }}
        />
      )}

      {tab === 'verktyg' && (
        <UtilityTab
          coins={coins}
          totalEarned={totalEarned}
          owned={utilityUpgrades}
          onBuy={(id) => {
            if (buyUtilityUpgrade(id)) playBuyUpgrade();
          }}
        />
      )}
    </section>
  );
}

interface StallTabProps {
  seedInventory: Record<CatTypeId, number>;
}

/**
 * Stall (Mina frön) — lists every seed the player owns. Renders an empty
 * state if the player only has Gräskatt (the infinite freebie).
 */
function StallTab({ seedInventory }: StallTabProps) {
  const hasRareSeeds = Object.entries(seedInventory).some(
    ([id, count]) => id !== 'graskatt' && count > 0,
  );

  if (!hasRareSeeds) {
    return (
      <div className="shop-empty-state" role="tabpanel">
        <span className="shop-empty-icon" aria-hidden="true">
          🌱
        </span>
        <p className="shop-empty-title">Inga sällsynta frön ännu</p>
        <p className="shop-empty-sub">
          Köp frön i Butik-fliken eller vinn dem på Lyckohjulet — så fylls
          stallet på här.
        </p>
      </div>
    );
  }

  return (
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
  );
}

interface UtilityTabProps {
  coins: number;
  totalEarned: number;
  owned: UtilityUpgradeId[];
  onBuy: (id: UtilityUpgradeId) => void;
}

type UtilityCardState = 'owned' | 'affordable' | 'locked-cost' | 'mystery';

function classifyUtility(
  upgrade: UtilityUpgrade,
  totalEarned: number,
  coins: number,
  owned: boolean,
): UtilityCardState {
  if (owned) return 'owned';
  if (totalEarned < upgrade.unlockThreshold) return 'mystery';
  if (coins >= upgrade.cost) return 'affordable';
  return 'locked-cost';
}

function UtilityTab({ coins, totalEarned, owned, onBuy }: UtilityTabProps) {
  const classified = UTILITY_UPGRADES.map((u) => ({
    upgrade: u,
    state: classifyUtility(u, totalEarned, coins, owned.includes(u.id)),
  }));

  const nextMystery = classified.find((c) => c.state === 'mystery');
  const nextThreshold = nextMystery
    ? nextMystery.upgrade.unlockThreshold
    : null;

  return (
    <div role="tabpanel">
      <p className="utility-intro">
        Permanenta verktyg som förbättrar trädgården för alltid.
      </p>
      <ul className="shop-list">
        {classified.map(({ upgrade, state }) => (
          <UtilityCard
            key={upgrade.id}
            upgrade={upgrade}
            state={state}
            onBuy={() => onBuy(upgrade.id)}
          />
        ))}
      </ul>
      {nextThreshold !== null && (
        <p className="utility-next-hint num">
          Nästa verktyg låses upp vid {formatCoins(nextThreshold)} intjänat.
        </p>
      )}
    </div>
  );
}

interface UtilityCardProps {
  upgrade: UtilityUpgrade;
  state: UtilityCardState;
  onBuy: () => void;
}

function UtilityCard({ upgrade, state, onBuy }: UtilityCardProps) {
  const [shake, setShake] = useState(0);
  const handleClick = () => {
    if (state === 'owned' || state === 'mystery') return;
    if (state === 'locked-cost') {
      setShake(shake + 1);
      return;
    }
    onBuy();
  };

  if (state === 'mystery') {
    return (
      <li className="utility-card utility-mystery" aria-label="Låst verktyg">
        <div className="utility-emoji utility-mystery-emoji" aria-hidden="true">
          ?
        </div>
        <div className="utility-body">
          <div className="utility-name">???</div>
          <div className="utility-desc">
            Tjäna {formatCoins(upgrade.unlockThreshold)} mynt för att avslöja
            detta verktyg.
          </div>
        </div>
        <div className="utility-action">
          <span className="utility-mystery-tag">
            <LockMini /> Låst
          </span>
        </div>
      </li>
    );
  }

  return (
    <motion.li
      key={`${upgrade.id}-${shake}`}
      className={[
        'utility-card',
        state === 'owned' ? 'owned' : '',
        state === 'locked-cost' ? 'locked-cost' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      animate={shake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.32 }}
    >
      <div className="utility-emoji" aria-hidden="true">
        {upgrade.emoji}
      </div>
      <div className="utility-body">
        <div className="utility-name">{upgrade.name}</div>
        <div className="utility-desc">{upgrade.description}</div>
      </div>
      <div className="utility-action">
        {state === 'owned' ? (
          <span className="utility-owned-tag">
            <span aria-hidden="true">✓</span> Ägd
          </span>
        ) : state === 'locked-cost' ? (
          <button
            type="button"
            className="utility-buy utility-buy-locked"
            onClick={handleClick}
            title="För få mynt"
          >
            <LockMini /> {formatCoins(upgrade.cost)}
          </button>
        ) : (
          <button
            type="button"
            className="utility-buy"
            onClick={handleClick}
          >
            <CoinDot /> {formatCoins(upgrade.cost)}
          </button>
        )}
      </div>
    </motion.li>
  );
}

interface UpgradesTabProps {
  coins: number;
  activeSpeedUpgrade: ActiveSpeedUpgrade | null;
  onBuy: (id: SpeedUpgradeId) => void;
}

function UpgradesTab({ coins, activeSpeedUpgrade, onBuy }: UpgradesTabProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activeSpeedUpgrade) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeSpeedUpgrade]);

  const liveMult = activeMultiplier(activeSpeedUpgrade, now);
  const remainingMs = activeSpeedUpgrade
    ? Math.max(0, activeSpeedUpgrade.expiresAt - now)
    : 0;
  const activeDef = activeSpeedUpgrade
    ? getUpgradeById(activeSpeedUpgrade.upgradeId)
    : null;
  const totalMs = activeDef ? activeDef.durationSeconds * 1000 : 0;
  const progress =
    totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 1;

  return (
    <div role="tabpanel">
      <AnimatePresence mode="popLayout">
        {activeSpeedUpgrade && activeDef && liveMult > 1 ? (
          <motion.div
            key={`active-${activeSpeedUpgrade.upgradeId}-${activeSpeedUpgrade.expiresAt}`}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`upgrade-active-banner tier-${activeDef.tier}`}
            role="status"
            aria-live="polite"
          >
            <div className="upgrade-active-glow" aria-hidden="true" />
            <div className="upgrade-active-icon" aria-hidden="true">
              <span className="upgrade-active-emoji">{activeDef.emoji}</span>
            </div>
            <div className="upgrade-active-body">
              <div className="upgrade-active-tag">Aktiv</div>
              <div className="upgrade-active-title">
                {activeDef.name}
                <span className="upgrade-active-mult num">
                  {activeDef.multiplier}x
                </span>
              </div>
              <div className="upgrade-active-countdown num">
                {formatCountdown(remainingMs)} kvar
              </div>
              <div
                className="upgrade-active-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                <span
                  className="upgrade-active-progress-fill"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="upgrade-empty-banner"
          >
            <span className="upgrade-empty-icon" aria-hidden="true">
              ⚡
            </span>
            <div>
              <div className="upgrade-empty-title">
                Ingen aktiv boost
              </div>
              <div className="upgrade-empty-help">
                Köp en flaska för att snabba upp trädgården en stund.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="shop-list">
        {classifySpeedUpgrades(coins).map(({ upgrade: u, status }) => {
          const isActive =
            !!activeSpeedUpgrade &&
            activeSpeedUpgrade.upgradeId === u.id &&
            liveMult > 1;
          // Always render affordable, the next aspirational boost, and any
          // currently-active boost (in case it's now unaffordable to restart).
          if (status === 'locked' && !isActive) {
            return (
              <LockedUpgradePreview
                key={u.id}
                name={u.name}
                emoji={u.emoji}
                multiplier={u.multiplier}
                cost={u.cost}
              />
            );
          }
          return (
            <UpgradeCard
              key={u.id}
              upgrade={{
                id: u.id,
                name: u.name,
                description: u.description,
                cost: u.cost,
                multiplier: u.multiplier,
                tier: u.tier,
                emoji: u.emoji,
                durationSeconds: u.durationSeconds,
              }}
              isActive={isActive}
              hasOtherActive={
                !!activeSpeedUpgrade && !isActive && liveMult > 1
              }
              canAfford={status === 'affordable'}
              status={status}
              onBuy={() => onBuy(u.id)}
            />
          );
        })}
      </ul>
    </div>
  );
}

interface LockedUpgradePreviewProps {
  name: string;
  emoji: string;
  multiplier: number;
  cost: number;
}

function LockedUpgradePreview({
  name,
  emoji,
  multiplier,
  cost,
}: LockedUpgradePreviewProps) {
  return (
    <li className="upgrade-card upgrade-card-locked" aria-label={`Låst: ${name}`}>
      <div className="upgrade-tier upgrade-tier-locked" aria-hidden="true">
        <LockShape />
      </div>
      <div className="upgrade-body">
        <div className="upgrade-title">
          <span className="upgrade-name">
            <span className="upgrade-emoji" aria-hidden="true">
              {emoji}
            </span>
            {name}
          </span>
          <span className="upgrade-mult num">{multiplier}x</span>
        </div>
        <div className="upgrade-meta">
          Lås upp genom att tjäna mer. Kostar {formatCoins(cost)} mynt.
        </div>
      </div>
      <div className="upgrade-actions">
        <span className="upgrade-locked-tag">
          <LockMini /> Låst
        </span>
      </div>
    </li>
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
  upgrade: {
    id: SpeedUpgradeId;
    name: string;
    description: string;
    cost: number;
    multiplier: number;
    tier: number;
    emoji: string;
    durationSeconds: number;
  };
  isActive: boolean;
  hasOtherActive: boolean;
  canAfford: boolean;
  status: SpeedUpgradeStatus;
  onBuy: () => void;
}

function UpgradeCard({
  upgrade,
  isActive,
  hasOtherActive,
  canAfford,
  status,
  onBuy,
}: UpgradeCardProps) {
  const [shake, setShake] = useState(0);

  const handleClick = () => {
    if (!canAfford) {
      setShake(shake + 1);
      return;
    }
    onBuy();
  };

  const buyLabel = isActive
    ? 'Starta om'
    : hasOtherActive
    ? 'Byt boost'
    : null;

  return (
    <motion.li
      key={`${upgrade.id}-${shake}`}
      className={[
        'upgrade-card',
        isActive ? 'active' : '',
        status === 'next' ? 'next-goal' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      animate={shake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.32 }}
    >
      <div className={`upgrade-tier tier-${upgrade.tier}`} aria-hidden="true">
        <PotionSvg tier={Math.min(upgrade.tier, 4)} />
      </div>
      <div className="upgrade-body">
        <div className="upgrade-title">
          <span className="upgrade-name">
            <span className="upgrade-emoji" aria-hidden="true">
              {upgrade.emoji}
            </span>
            {upgrade.name}
          </span>
          <span className="upgrade-mult num">{upgrade.multiplier}x</span>
        </div>
        <div className="upgrade-meta">{upgrade.description}</div>
        {status === 'next' && !isActive && (
          <div className="upgrade-next-pill">Nästa mål</div>
        )}
      </div>
      <div className="upgrade-actions">
        <button
          type="button"
          className={[
            'upgrade-buy',
            buyLabel ? 'upgrade-buy-restart' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={!canAfford}
          onClick={handleClick}
        >
          {buyLabel ? (
            <span className="upgrade-buy-label">{buyLabel}</span>
          ) : null}
          <span className="upgrade-buy-cost">
            <CoinDot /> {formatCoins(upgrade.cost)}
          </span>
        </button>
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

/**
 * Mirrors HUD.formatCountdown — kept local to avoid a circular import
 * between sibling components. Format:
 * - >= 1h: `H:MM:SS`
 * - <  1h: `M:SS`
 */
function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
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
