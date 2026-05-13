/**
 * PlantSheet — modal sheet that slides up from the bottom on mobile and
 * appears as a centered dialog on desktop. Lets the player pick a seed.
 */

import { motion } from 'framer-motion';
import {
  CAT_TYPE_ORDER,
  CAT_TYPES,
  type CatTypeId,
} from '../../domain/catTypes';
import { useGameStore } from '../../store/useGameStore';
import { formatRemaining } from '../../domain/time';
import { CatSprite } from '../CatDisplay/CatSprite';

interface PlantSheetProps {
  onClose: () => void;
  onPlant: (catType: CatTypeId) => void;
}

export function PlantSheet({ onClose, onPlant }: PlantSheetProps) {
  const inv = useGameStore((s) => s.seedInventory);
  const unlocked = useGameStore((s) => s.unlockedCatTypes);

  return (
    <motion.div
      className="plant-sheet-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-label="Välj frö att plantera"
    >
      <motion.div
        className="plant-sheet"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Välj ett frö</h3>
        <p className="plant-sheet-sub">
          Klicka på ett frö för att plantera det i den valda rutan.
        </p>
        <ul className="plant-sheet-list">
          {CAT_TYPE_ORDER.map((id) => {
            const cat = CAT_TYPES[id];
            const have = inv[id] ?? 0;
            const isUnlocked = unlocked.includes(id);
            const canPlant = isUnlocked && (cat.infinite || have > 0);

            return (
              <li key={id}>
                <button
                  type="button"
                  className="seed-row"
                  disabled={!canPlant}
                  onClick={() => canPlant && onPlant(id)}
                >
                  <CatSprite catType={id} size={48} stage={2} wiggle={false} />
                  <div>
                    <div className="seed-row-name">{cat.name}</div>
                    <div className="seed-row-meta num">
                      Växer {formatRemaining(cat.growMs)} · ger {cat.sellValue} mynt
                    </div>
                  </div>
                  <div className="seed-row-count num">
                    {cat.infinite ? '∞' : `× ${have}`}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <button className="plant-sheet-close" onClick={onClose}>
          Stäng
        </button>
      </motion.div>
    </motion.div>
  );
}
