/**
 * Quests — daily-quest panel with progress, claim CTA, streak, and a
 * midnight countdown until the next refresh.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CAT_TYPES } from '../../domain/catTypes';
import {
  getQuestTemplate,
  msUntilMidnight,
  type QuestTemplate,
  type QuestProgressEntry,
} from '../../domain/quests';
import { useGameStore } from '../../store/useGameStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import './quests.css';

export function Quests() {
  const dailyQuests = useGameStore((s) => s.dailyQuests);
  const claimQuestReward = useGameStore((s) => s.claimQuestReward);
  const { playUnlockPlot } = useSoundEffects();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const countdown = msUntilMidnight(now);
  const claimedCount = dailyQuests.quests.filter(
    (q) => q.rewardClaimed,
  ).length;
  const totalCount = dailyQuests.quests.length;

  return (
    <section className="section-card quests-section" aria-label="Uppdrag">
      <header className="quests-header">
        <h2>
          <ScrollIcon /> Uppdrag
        </h2>
        <div className="quests-stats">
          <span
            className="quest-streak-pill"
            aria-label={`${dailyQuests.streak} dagars streak`}
          >
            <span className="streak-flame" aria-hidden="true">
              🔥
            </span>
            <strong className="num">{dailyQuests.streak}</strong>
            <span className="muted">dagar</span>
          </span>
        </div>
      </header>

      <div className="quests-meta">
        <span className="quests-progress-count num">
          {claimedCount}/{totalCount} klara
        </span>
        <span className="quests-refresh-pill" title="Tid till nya uppdrag">
          <ClockSvg /> Nya uppdrag om{' '}
          <strong className="num">{formatHMS(countdown)}</strong>
        </span>
      </div>

      <ul className="quests-list" role="list">
        {dailyQuests.quests.map((entry, idx) => {
          const tpl = getQuestTemplate(entry.templateId);
          if (!tpl) return null;
          return (
            <QuestCard
              key={entry.templateId}
              entry={entry}
              template={tpl}
              onClaim={() => {
                claimQuestReward(idx);
                playUnlockPlot();
              }}
            />
          );
        })}
      </ul>

      <footer className="quests-footer">
        <p className="quests-tip">
          Tips: kombinera Auto-Skörda med en Tidsmagi-flaska för rusningsdagar!
        </p>
      </footer>
    </section>
  );
}

interface QuestCardProps {
  entry: QuestProgressEntry;
  template: QuestTemplate;
  onClaim: () => void;
}

function QuestCard({ entry, template, onClaim }: QuestCardProps) {
  const pct = Math.min(
    100,
    Math.round((entry.progress / template.target) * 100),
  );
  const isReady = entry.completed && !entry.rewardClaimed;
  const isClaimed = entry.rewardClaimed;

  const classes = ['quest-card'];
  if (isReady) classes.push('quest-card-ready');
  if (isClaimed) classes.push('quest-card-claimed');

  return (
    <motion.li
      className={classes.join(' ')}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="quest-emoji" aria-hidden="true">
        {template.emoji}
      </div>
      <div className="quest-info">
        <header className="quest-info-head">
          <span className="quest-title">{template.title}</span>
          <RewardBadge template={template} />
        </header>
        <p className="quest-desc">{template.description}</p>
        <div className="quest-bar-wrap">
          <div className="quest-bar" aria-hidden="true">
            <span className="quest-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="quest-progress-num num">
            {Math.min(entry.progress, template.target)}/{template.target}
          </span>
        </div>
      </div>
      <div className="quest-action">
        {isClaimed ? (
          <span className="quest-claimed-tag">
            <span aria-hidden="true">✓</span> Hämtad
          </span>
        ) : isReady ? (
          <button type="button" className="quest-claim-btn" onClick={onClaim}>
            Hämta belöning!
          </button>
        ) : pct > 0 ? (
          <span className="quest-progress-pill num">{pct}%</span>
        ) : null}
      </div>
    </motion.li>
  );
}

function RewardBadge({ template }: { template: QuestTemplate }) {
  const seedName = template.reward.seedId
    ? CAT_TYPES[template.reward.seedId].name
    : null;
  return (
    <span className="quest-reward-badge">
      <span className="quest-reward-coin">
        <CoinDot /> {template.reward.coins}
      </span>
      {seedName && <span className="quest-reward-seed">+1 {seedName}</span>}
    </span>
  );
}

function formatHMS(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function ScrollIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 4h11a3 3 0 013 3v13a2 2 0 01-2 2H7a3 3 0 01-3-3V5a1 1 0 011-1z"
        fill="#FFE7B0"
        stroke="#D9942A"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8 8h7M8 12h7M8 16h4"
        stroke="#A86A12"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="6" r="2" fill="#FFD56B" stroke="#D9942A" strokeWidth="1.2" />
    </svg>
  );
}

function ClockSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function CoinDot() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#FFD56B" stroke="#E8A93C" strokeWidth="2" />
    </svg>
  );
}
