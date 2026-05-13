/**
 * App shell. Renders HUD, Garden, side panels (Shop / Lottery / Stable),
 * plus mobile bottom-nav and global effects.
 */

import { useEffect, useRef, useState } from 'react';
import { HUD } from './components/HUD/HUD';
import { Garden } from './components/Garden/Garden';
import { Shop } from './components/Shop/Shop';
import { LotteryWheel } from './components/LotteryWheel/LotteryWheel';
import { CatDisplay } from './components/CatDisplay/CatDisplay';
import { Quests } from './components/Quests/Quests';
import { Achievements } from './components/Achievements/Achievements';
import { Toasts } from './components/effects/Toasts';
import { LightningFlash } from './components/effects/LightningFlash';
import { RecapModal } from './components/effects/RecapModal';
import { OfflineModal } from './components/effects/OfflineModal';
import { FloatingCoins } from './components/effects/FloatingCoins';
import { useGameTick } from './hooks/useGameTick';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useGameStore } from './store/useGameStore';
import './App.css';
import './components/CatDisplay/cat-sprite.css';

type MobileTab =
  | 'garden'
  | 'shop'
  | 'lottery'
  | 'stall'
  | 'quests'
  | 'achievements';

function App() {
  useGameTick();
  useGlobalSoundEffects();
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const soundMuted = useGameStore((s) => s.settings.soundMuted);
  const toggleReducedMotion = useGameStore((s) => s.toggleReducedMotion);
  const toggleSoundMuted = useGameStore((s) => s.toggleSoundMuted);
  const { playButton } = useSoundEffects();
  const [tab, setTab] = useState<MobileTab>('garden');

  return (
    <div className="app-shell" data-reduced-motion={reducedMotion}>
      <div className="app-deco" aria-hidden="true">
        <span className="sun" />
        <span className="cloud cloud-1" />
        <span className="cloud cloud-2" />
        <span className="cloud cloud-3" />
        <span className="meadow" />
      </div>

      <header className="app-header">
        <div className="app-branding">
          <div className="app-branding-mark">
            <Logo />
          </div>
          <div>
            <h1 className="app-branding-title">Odla en Katt</h1>
            <span className="app-branding-sub">en mysig kattträdgård</span>
          </div>
        </div>
        <div className="app-header-actions">
          <button
            type="button"
            className="icon-toggle sound-toggle"
            onClick={() => {
              if (soundMuted) playButton();
              toggleSoundMuted();
            }}
            aria-pressed={!soundMuted}
            aria-label={soundMuted ? 'Slå på ljud' : 'Stäng av ljud'}
            title={soundMuted ? 'Slå på ljud' : 'Stäng av ljud'}
          >
            {soundMuted ? <SpeakerMutedIcon /> : <SpeakerOnIcon />}
          </button>
          <button
            type="button"
            className="reduced-motion-toggle"
            onClick={toggleReducedMotion}
            aria-pressed={reducedMotion}
            title={reducedMotion ? 'Slå på animationer' : 'Stäng av animationer'}
          >
            {reducedMotion ? 'Animationer av' : 'Animationer på'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className={tab === 'garden' ? '' : 'section-hidden-mobile'}>
          <HUD
            onOpenShop={() => setTab('shop')}
            onOpenLottery={() => setTab('lottery')}
          />
          <div style={{ height: '1rem' }} />
          <Garden />
        </div>

        <aside className="side-panels">
          <div className={tab === 'shop' ? '' : 'section-hidden-mobile'}>
            <Shop onOpenLottery={() => setTab('lottery')} />
          </div>
          <div className={tab === 'lottery' ? '' : 'section-hidden-mobile'}>
            <LotteryWheel />
          </div>
          <div className={tab === 'stall' ? '' : 'section-hidden-mobile'}>
            <CatDisplay />
          </div>
          <div className={tab === 'quests' ? '' : 'section-hidden-mobile'}>
            <Quests />
          </div>
          <div
            className={tab === 'achievements' ? '' : 'section-hidden-mobile'}
          >
            <Achievements />
          </div>
        </aside>
      </main>

      <nav className="app-tabbar" aria-label="Sektioner">
        <button aria-pressed={tab === 'garden'} onClick={() => setTab('garden')}>
          Trädgård
        </button>
        <button aria-pressed={tab === 'shop'} onClick={() => setTab('shop')}>
          Butik
        </button>
        <button aria-pressed={tab === 'quests'} onClick={() => setTab('quests')}>
          Uppdrag
          <QuestNotice />
        </button>
        <button
          aria-pressed={tab === 'achievements'}
          onClick={() => setTab('achievements')}
        >
          Trofér
        </button>
        <button aria-pressed={tab === 'stall'} onClick={() => setTab('stall')}>
          Stall
        </button>
      </nav>

      <Toasts />
      <FloatingCoins />
      <LightningFlash />
      <RecapModal />
      <OfflineModal />
    </div>
  );
}

/** Renders a small dot indicator when at least one quest is ready to claim. */
function QuestNotice() {
  const readyToClaim = useGameStore((s) =>
    s.dailyQuests.quests.some((q) => q.completed && !q.rewardClaimed),
  );
  if (!readyToClaim) return null;
  return <span className="tabbar-pip" aria-hidden="true" />;
}

/**
 * Observes a few store fields and plays sound effects in response.
 * Kept in App so any visible component can be silent while a single
 * place owns "what does X event sound like".
 */
function useGlobalSoundEffects(): void {
  const { playWeather, playUnlockPlot, playCoinEarn } = useSoundEffects();
  const activeStrike = useGameStore((s) => s.activeStrike);
  const coinPulseKey = useGameStore((s) => s.coinPulseKey);
  const unlockedTypes = useGameStore((s) => s.unlockedCatTypes);

  const lastStrikeRef = useRef<number | null>(null);
  const lastCoinKeyRef = useRef<number>(coinPulseKey);
  const lastUnlockCountRef = useRef<number>(unlockedTypes.length);

  useEffect(() => {
    if (activeStrike && activeStrike.id !== lastStrikeRef.current) {
      playWeather(activeStrike.eventId);
      lastStrikeRef.current = activeStrike.id;
    }
  }, [activeStrike, playWeather]);

  useEffect(() => {
    if (coinPulseKey !== lastCoinKeyRef.current && coinPulseKey > 0) {
      playCoinEarn();
    }
    lastCoinKeyRef.current = coinPulseKey;
  }, [coinPulseKey, playCoinEarn]);

  useEffect(() => {
    if (unlockedTypes.length > lastUnlockCountRef.current) {
      playUnlockPlot();
    }
    lastUnlockCountRef.current = unlockedTypes.length;
  }, [unlockedTypes.length, playUnlockPlot]);
}

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 14 L9 4 L13 12 Z" fill="#fff" />
      <path d="M26 14 L23 4 L19 12 Z" fill="#fff" />
      <circle cx="16" cy="18" r="11" fill="#fff" />
      <circle cx="12" cy="17" r="1.6" fill="#3a2d4f" />
      <circle cx="20" cy="17" r="1.6" fill="#3a2d4f" />
      <path
        d="M14 21 Q 16 23 18 21"
        stroke="#3a2d4f"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M15.4 20 Q 16 21 16.6 20" fill="#FF8FA3" />
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M16 8c1.5 1.2 2.5 2.5 2.5 4s-1 2.8-2.5 4M18.5 5.5c2.7 1.6 4.5 3.8 4.5 6.5s-1.8 4.9-4.5 6.5"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerMutedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M16 9l6 6M22 9l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default App;
