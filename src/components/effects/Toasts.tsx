/**
 * Toasts — top-anchored ephemeral notifications driven by the store.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export function Toasts() {
  const toasts = useGameStore((s) => s.toasts);
  const dismissToast = useGameStore((s) => s.dismissToast);

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((t) =>
          t.kind === 'achievement' ? (
            <motion.div
              key={t.id}
              className="toast toast-achievement"
              initial={{ y: -28, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -28, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onClick={() => dismissToast(t.id)}
              role="status"
            >
              <span className="achievement-toast-shine" aria-hidden="true" />
              <span className="achievement-toast-emoji" aria-hidden="true">
                {t.emoji ?? '🏆'}
              </span>
              <span className="achievement-toast-body">
                <span className="achievement-toast-tag">
                  🏆 Achievement unlocked!
                </span>
                <span className="achievement-toast-title">{t.title}</span>
                {t.body && (
                  <span className="achievement-toast-reward">{t.body}</span>
                )}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={t.id}
              className={`toast ${t.kind}`}
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={() => dismissToast(t.id)}
              role="status"
            >
              <div>{t.title}</div>
              {t.body && <div className="toast-body">{t.body}</div>}
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </div>
  );
}
