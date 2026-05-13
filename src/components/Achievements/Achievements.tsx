/**
 * Achievements — trophy wall grouped by category. Locked & secret states
 * show silhouettes / "???" placeholders.
 */

import { useMemo, useState } from 'react';
import { CAT_TYPES } from '../../domain/catTypes';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  CATEGORY_LABELS,
  type Achievement,
  type AchievementCategory,
} from '../../domain/achievements';
import { useGameStore } from '../../store/useGameStore';
import './achievements.css';

type Tab = AchievementCategory | 'all';

export function Achievements() {
  const unlocked = useGameStore((s) => s.unlockedAchievements);
  const [tab, setTab] = useState<Tab>('all');

  const filtered = useMemo<readonly Achievement[]>(() => {
    if (tab === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter((a) => a.category === tab);
  }, [tab]);

  const unlockedCount = unlocked.length;
  const totalCount = ACHIEVEMENTS.length;
  const visibleCount = ACHIEVEMENTS.filter(
    (a) => !a.secret || unlocked.includes(a.id),
  ).length;

  return (
    <section
      className="section-card achievements-section"
      aria-label="Troféer och utmärkelser"
    >
      <header className="achievements-header">
        <h2>
          <TrophyIcon /> Trofér
        </h2>
        <div className="achievements-progress">
          <div className="achievements-progress-text">
            <span className="num">
              <strong>{unlockedCount}</strong>
              <span className="muted">/{totalCount}</span>
            </span>
            <span className="muted">upplåsta</span>
          </div>
          <div
            className="achievements-progress-bar"
            aria-hidden="true"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={unlockedCount}
          >
            <span
              className="achievements-progress-fill"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <div className="achievements-tabs" role="tablist">
        <TabButton
          label={`Alla (${visibleCount})`}
          active={tab === 'all'}
          onClick={() => setTab('all')}
        />
        {ACHIEVEMENT_CATEGORIES.map((cat) => (
          <TabButton
            key={cat}
            label={CATEGORY_LABELS[cat]}
            active={tab === cat}
            onClick={() => setTab(cat)}
          />
        ))}
      </div>

      <ul className="achievements-grid" role="list">
        {filtered.map((a) => (
          <AchievementCard
            key={a.id}
            achievement={a}
            unlocked={unlocked.includes(a.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={active ? 'tab-btn active' : 'tab-btn'}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function AchievementCard({
  achievement,
  unlocked,
}: {
  achievement: Achievement;
  unlocked: boolean;
}) {
  const isSecret = !!achievement.secret && !unlocked;
  const classes = ['achievement-card', `cat-${achievement.category}`];
  if (unlocked) classes.push('unlocked');
  if (!unlocked) classes.push('locked');
  if (isSecret) classes.push('secret');

  return (
    <li className={classes.join(' ')}>
      <div className="achievement-emoji" aria-hidden="true">
        {isSecret ? <LockSvg /> : achievement.emoji}
      </div>
      <div className="achievement-body">
        <span className="achievement-title">
          {isSecret ? '???' : achievement.title}
        </span>
        <span className="achievement-desc">
          {isSecret ? 'Hemlig — låses upp ovetandes' : achievement.description}
        </span>
        {!isSecret && (
          <span className="achievement-reward-row">
            {unlocked ? (
              <span className="reward-unlocked">
                <CheckIcon /> {describeReward(achievement)}
              </span>
            ) : (
              <span className="reward-pending">
                Belöning: {describeReward(achievement)}
              </span>
            )}
          </span>
        )}
      </div>
    </li>
  );
}

function describeReward(a: Achievement): string {
  const parts: string[] = [];
  if (a.reward.coins) parts.push(`+${a.reward.coins} mynt`);
  if (a.reward.seedId) {
    const cat = CAT_TYPES[a.reward.seedId];
    parts.push(`+1 ${cat.name}-frö`);
  }
  return parts.join(' · ');
}

function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 4h8v3a4 4 0 11-8 0V4z"
        fill="#FFD56B"
        stroke="#D9942A"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M5 5h3v2.5A2.5 2.5 0 015.5 10H5V5zM19 5h-3v2.5A2.5 2.5 0 0018.5 10H19V5z"
        fill="#FFB870"
        stroke="#D9942A"
        strokeWidth="1.4"
      />
      <path d="M10 12h4v3h-4z" fill="#E8A93C" />
      <path d="M8 17h8v3H8z" fill="#D9942A" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 12l5 5 11-12"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockSvg() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        fill="#cbb8d8"
        stroke="#8c7aa3"
        strokeWidth="1.4"
      />
      <path
        d="M8 11V8a4 4 0 018 0v3"
        stroke="#8c7aa3"
        strokeWidth="1.8"
        fill="none"
      />
      <circle cx="12" cy="16" r="1.4" fill="#5b4a7c" />
    </svg>
  );
}
