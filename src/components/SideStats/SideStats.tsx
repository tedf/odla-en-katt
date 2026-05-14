/**
 * SideStats — the desktop right-rail sidebar. Quick read of the player's
 * state: total earned, active boost, today's quests, recent achievement,
 * and weather. Mobile hides this entirely.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { formatCoins } from '../../domain/time';
import { activeMultiplier, getUpgradeById } from '../../domain/upgrades';
import { ACHIEVEMENTS_BY_ID } from '../../domain/achievements';
import { getQuestTemplate } from '../../domain/quests';
import './side-stats.css';

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

export function SideStats() {
  const totalEarned = useGameStore((s) => s.totalEarned);
  const activeSpeedUpgrade = useGameStore((s) => s.activeSpeedUpgrade);
  const dailyQuests = useGameStore((s) => s.dailyQuests);
  const unlocked = useGameStore((s) => s.unlockedAchievements);
  const plots = useGameStore((s) => s.plots);
  const activeStrike = useGameStore((s) => s.activeStrike);
  const catsSoldByType = useGameStore((s) => s.catsSoldByType);
  const totalHarvests = Object.values(catsSoldByType).reduce(
    (sum, n) => sum + n,
    0,
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const speedMult = activeMultiplier(activeSpeedUpgrade, now);
  const speedDef = activeSpeedUpgrade
    ? getUpgradeById(activeSpeedUpgrade.upgradeId)
    : null;
  const speedRemainingMs = activeSpeedUpgrade
    ? Math.max(0, activeSpeedUpgrade.expiresAt - now)
    : 0;

  const hasActiveWeather =
    activeStrike !== null ||
    plots.some((p) => p.state === 'growing' && p.weatherEvents.length > 0);

  const recentAchievementId = unlocked[unlocked.length - 1];
  const recentAchievement = recentAchievementId
    ? ACHIEVEMENTS_BY_ID[recentAchievementId]
    : null;

  const visibleQuests = (() => {
    const sorted = [...dailyQuests.quests].sort((a, b) => {
      const aReady = a.completed && !a.rewardClaimed ? 0 : 1;
      const bReady = b.completed && !b.rewardClaimed ? 0 : 1;
      if (aReady !== bReady) return aReady - bReady;
      const aDone = a.rewardClaimed ? 1 : 0;
      const bDone = b.rewardClaimed ? 1 : 0;
      return aDone - bDone;
    });
    return sorted.slice(0, 3);
  })();

  return (
    <aside className="side-stats" aria-label="Snabb översikt">
      <div className="side-stats-card side-stats-coins">
        <header>
          <span aria-hidden="true">💰</span>
          <span>Mynt &amp; tempo</span>
        </header>
        <dl>
          <div>
            <dt>Totalt intjänat</dt>
            <dd className="num">{formatCoins(totalEarned)}</dd>
          </div>
          <div>
            <dt>Skördade katter</dt>
            <dd className="num">{totalHarvests}</dd>
          </div>
          <div>
            <dt>Aktiv boost</dt>
            <dd>
              {speedMult > 1 && speedDef ? (
                <span className="boost-chip">
                  <span aria-hidden="true">{speedDef.emoji}</span>
                  <strong className="num">{speedMult}x</strong>
                  <span className="boost-time num">
                    {formatCountdown(speedRemainingMs)}
                  </span>
                </span>
              ) : (
                <span className="muted side-stats-boost-hint">
                  Ingen boost aktiv
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="side-stats-card side-stats-quests">
        <header>
          <span aria-hidden="true">📜</span>
          <span>Dagens uppdrag</span>
          {dailyQuests.streak >= 3 && (
            <span
              className="streak-mini"
              title={`${dailyQuests.streak} dagars streak`}
            >
              <span className="streak-flame-mini" aria-hidden="true">
                🔥
              </span>
              <strong className="num">{dailyQuests.streak}</strong>
            </span>
          )}
        </header>
        <ul>
          {visibleQuests.map((q) => {
            const tpl = getQuestTemplate(q.templateId);
            if (!tpl) return null;
            const pct = Math.min(
              100,
              Math.round((q.progress / tpl.target) * 100),
            );
            const isClaim = q.completed && !q.rewardClaimed;
            return (
              <motion.li
                key={q.templateId}
                className={[
                  'mini-quest',
                  q.rewardClaimed ? 'done' : '',
                  isClaim ? 'ready' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="mini-quest-emoji" aria-hidden="true">
                  {tpl.emoji}
                </span>
                <div className="mini-quest-body">
                  <span className="mini-quest-title">{tpl.title}</span>
                  <div className="mini-bar" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="mini-quest-num num">
                  {Math.min(q.progress, tpl.target)}/{tpl.target}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="side-stats-card side-stats-trophy">
        <header>
          <span aria-hidden="true">🏆</span>
          <span>Senaste trofé</span>
        </header>
        {recentAchievement ? (
          <div className="trophy-row">
            <span className="trophy-emoji" aria-hidden="true">
              {recentAchievement.emoji}
            </span>
            <div>
              <strong>{recentAchievement.title}</strong>
              <span className="muted">{recentAchievement.description}</span>
            </div>
          </div>
        ) : (
          <div className="trophy-empty">
            <span className="trophy-empty-icon" aria-hidden="true">🌱</span>
            <span className="muted">Skörda din första katt för att vinna en trofé!</span>
          </div>
        )}
      </div>

      <div
        className={
          hasActiveWeather
            ? 'side-stats-card side-stats-weather weather-active'
            : 'side-stats-card side-stats-weather'
        }
      >
        <header>
          <span aria-hidden="true">{hasActiveWeather ? '⛈️' : '☀️'}</span>
          <span>Väder</span>
        </header>
        <p>
          {hasActiveWeather
            ? 'Stormvarning aktiv — kolla katterna!'
            : 'Lugnt väder. Väder-event ger dina katter bonusvärde!'}
        </p>
      </div>
    </aside>
  );
}
