/**
 * HUD — top bar with the coin counter, next-unlock hint, and lottery callout.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { nextPlotUnlock } from '../../domain/economy';
import { formatCoins } from '../../domain/time';
import { isFreeSpinAvailable } from '../../domain/lottery';
import { activeMultiplier, getUpgradeById } from '../../domain/upgrades';
import './hud.css';

interface HUDProps {
  onOpenLottery: () => void;
  onOpenShop: () => void;
}

export function HUD({ onOpenLottery, onOpenShop }: HUDProps) {
  const coins = useGameStore((s) => s.coins);
  const totalEarned = useGameStore((s) => s.totalEarned);
  const lottery = useGameStore((s) => s.lottery);
  const coinPulseKey = useGameStore((s) => s.coinPulseKey);
  const activeSpeedUpgrade = useGameStore((s) => s.activeSpeedUpgrade);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    // The lottery pip needs a coarse refresh (every 5s is fine); the speed
    // boost chip needs a per-second tick to render its countdown smoothly.
    const fast = activeSpeedUpgrade ? 1_000 : 5_000;
    const id = window.setInterval(() => setNow(Date.now()), fast);
    return () => window.clearInterval(id);
  }, [activeSpeedUpgrade]);

  const speedMult = activeMultiplier(activeSpeedUpgrade, now);
  const speedEmoji = activeSpeedUpgrade
    ? (getUpgradeById(activeSpeedUpgrade.upgradeId)?.emoji ?? '⚡')
    : '⚡';
  const speedRemainingMs = activeSpeedUpgrade
    ? Math.max(0, activeSpeedUpgrade.expiresAt - now)
    : 0;

  const freeSpin = isFreeSpinAvailable(lottery.lastFreeSpinAt, now);
  const nextUnlock = nextPlotUnlock(totalEarned);

  // Shake the coin chip when the player tries to buy with 0 coins.
  const [coinShake, setCoinShake] = useState(0);
  useEffect(() => {
    if (coins !== 0) return;
    // Listen on the document for clicks on disabled-by-cost buttons.
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target instanceof HTMLButtonElement &&
        target.disabled &&
        (target.classList.contains('seed-card-buy') ||
          target.classList.contains('upgrade-buy') ||
          target.classList.contains('lottery-spin-btn'))
      ) {
        setCoinShake((s) => s + 1);
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [coins]);

  return (
    <section className="hud" aria-label="Spelinformation">
      <motion.div
        className="hud-coins"
        aria-live="polite"
        animate={coinShake > 0 ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        key={`shake-${coinShake}`}
      >
        <CoinIcon />
        <div className="hud-coins-meta">
          <span className="hud-coins-label">Mynt</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={coinPulseKey}
              initial={{ scale: 1.25, color: '#FF8FA3' }}
              animate={{ scale: 1, color: '#3a2d4f' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="hud-coins-value num"
            >
              {formatCoins(coins)}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="hud-coins-sub muted num">
          Totalt intjänat: {formatCoins(totalEarned)}
          {speedMult > 1 && activeSpeedUpgrade && (
            <span
              className="hud-speed-chip"
              title={`Hastighet: ${speedMult}x — ${formatCountdown(speedRemainingMs)} kvar`}
              aria-label={`Hastighetsboost ${speedMult}x, ${formatCountdown(speedRemainingMs)} kvar`}
            >
              <span className="hud-speed-chip-icon" aria-hidden="true">
                {speedEmoji}
              </span>
              <span className="hud-speed-chip-mult">{speedMult}x</span>
              <span className="hud-speed-chip-time">
                {formatCountdown(speedRemainingMs)}
              </span>
            </span>
          )}
        </div>
      </motion.div>

      {nextUnlock !== null && (
        <div className="hud-hint">
          <span className="hud-hint-label">Nästa ruta öppnas vid</span>
          <span className="hud-hint-value num">
            {formatCoins(nextUnlock.threshold)} mynt
          </span>
          <progress
            className="hud-hint-bar"
            value={Math.min(totalEarned, nextUnlock.threshold)}
            max={nextUnlock.threshold}
          />
        </div>
      )}

      <div className="hud-actions">
        <button
          type="button"
          className="hud-action hud-action-shop"
          onClick={onOpenShop}
        >
          <BagIcon /> Butik
        </button>
        <button
          type="button"
          className={`hud-action hud-action-lottery${freeSpin ? ' has-free' : ''}`}
          onClick={onOpenLottery}
        >
          <WheelIcon />
          <span>Lyckohjulet</span>
          {freeSpin && <span className="hud-pip" aria-label="Gratis snurr">●</span>}
        </button>
      </div>
    </section>
  );
}

/**
 * Formats a remaining-time countdown.
 * - >= 1h: `H:MM:SS`
 * - <  1h: `M:SS`
 */
export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

function CoinIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#FFD56B" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="#E8A93C" strokeWidth="3" />
      <circle cx="24" cy="24" r="14" fill="#FFE6A0" />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontFamily="Fredoka, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#A8741F"
      >
        ¢
      </text>
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 9h14l-1.2 11.2A2 2 0 0115.8 22H8.2a2 2 0 01-2-1.8L5 9z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M5 9h14l-1.2 11.2A2 2 0 0115.8 22H8.2a2 2 0 01-2-1.8L5 9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 9V7a3 3 0 016 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WheelIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path
        d="M12 2v20M2 12h20M5 5l14 14M5 19l14-14"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.6"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
