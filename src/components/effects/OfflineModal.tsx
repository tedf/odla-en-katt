/**
 * OfflineModal — "Medan du var borta..." rich summary used when the player
 * has been away long enough that any plot ripened. Replaces the old
 * RecapModal once an OfflineSummary is present.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { CAT_TYPES } from '../../domain/catTypes';
import { CAT_TRAITS_BY_ID } from '../../domain/catPersonality';
import { useGameStore } from '../../store/useGameStore';
import { formatRemaining } from '../../domain/time';
import './offline-modal.css';

export function OfflineModal() {
  const summary = useGameStore((s) => s.offlineSummary);
  const accept = useGameStore((s) => s.acceptOfflineHarvest);
  const dismiss = useGameStore((s) => s.dismissOfflineSummary);

  return createPortal(
    <AnimatePresence>
      {summary && (
        <motion.div
          className="offline-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className="offline-modal"
            initial={{ y: 80, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="offline-title"
          >
            <div className="offline-moon" aria-hidden="true">
              <MoonSvg />
            </div>
            <h3 id="offline-title">Välkommen tillbaka!</h3>
            <p className="offline-sub">
              Du var borta i <strong>{formatRemaining(summary.awayMs)}</strong>
            </p>

            <div className="offline-section">
              <h4>Medan du var borta...</h4>
              {summary.autoHarvestActive ? (
                <>
                  <ul className="offline-list">
                    {summary.completedPlots.map((c) => {
                      const cat = CAT_TYPES[c.catTypeId];
                      const trait = CAT_TRAITS_BY_ID[c.traitId];
                      return (
                        <li
                          key={`${c.plotIndex}-${c.catName}`}
                          className={`offline-row rarity-${cat.rarity}`}
                        >
                          <span className="offline-cat-emoji" aria-hidden="true">
                            🐾
                          </span>
                          <span className="offline-cat-meta">
                            <span className="offline-cat-name">
                              {c.catName}
                            </span>
                            <span className="offline-cat-type">
                              {cat.name}
                            </span>
                          </span>
                          <span className="offline-trait">
                            <span aria-hidden="true">{trait.emoji}</span>{' '}
                            {trait.name}
                          </span>
                          <span className="offline-value num">
                            +{c.sellValue}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="offline-bonus" aria-live="polite">
                    🤖 Auto-Skörda samlade{' '}
                    <strong>+{summary.coinsEarned}</strong> mynt åt dig!
                  </div>
                </>
              ) : summary.readyPlots.length > 0 ? (
                <ul className="offline-list">
                  {summary.readyPlots.map((r) => {
                    const cat = CAT_TYPES[r.catTypeId];
                    return (
                      <li
                        key={r.plotIndex}
                        className={`offline-row offline-row-ready rarity-${cat.rarity}`}
                      >
                        <span className="offline-cat-emoji" aria-hidden="true">
                          ✨
                        </span>
                        <span className="offline-cat-meta">
                          <span className="offline-cat-name">{cat.name}</span>
                          <span className="offline-cat-type">redo att skördas</span>
                        </span>
                        <span className="offline-ready-pill">Redo!</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="offline-empty">
                  Inga katter blev klara den här gången.
                </p>
              )}
            </div>

            <div className="offline-actions">
              {summary.readyPlots.length > 0 && !summary.autoHarvestActive && (
                <button
                  type="button"
                  className="offline-cta"
                  onClick={accept}
                >
                  Skörda alla ({summary.readyPlots.length})
                </button>
              )}
              <button
                type="button"
                className="offline-dismiss"
                onClick={dismiss}
              >
                {summary.autoHarvestActive
                  ? 'Tack, fortsätt'
                  : summary.readyPlots.length === 0
                    ? 'Okej'
                    : 'Stäng'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function MoonSvg() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <defs>
        <radialGradient id="moon-grad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#FFF8E3" />
          <stop offset="55%" stopColor="#FFE7B0" />
          <stop offset="100%" stopColor="#E8A93C" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="28" r="22" fill="url(#moon-grad)" />
      <circle cx="22" cy="22" r="4" fill="#FFD56B" opacity="0.7" />
      <circle cx="36" cy="32" r="3" fill="#FFD56B" opacity="0.55" />
      <circle cx="30" cy="40" r="2" fill="#FFD56B" opacity="0.5" />
      <circle cx="50" cy="14" r="1.5" fill="#fff" />
      <circle cx="6" cy="20" r="1.2" fill="#fff" />
      <circle cx="46" cy="46" r="1" fill="#fff" />
    </svg>
  );
}
