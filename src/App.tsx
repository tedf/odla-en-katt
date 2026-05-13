/**
 * App shell. Desktop = three-panel dashboard (Garden | Tabbed Panel | SideStats).
 * Mobile (< 900px) = single column with bottom tabbar.
 */

import { useEffect, useRef, useState } from 'react';
import { HUD } from './components/HUD/HUD';
import { Garden } from './components/Garden/Garden';
import { Shop } from './components/Shop/Shop';
import { LotteryWheel } from './components/LotteryWheel/LotteryWheel';
import { CatDisplay } from './components/CatDisplay/CatDisplay';
import { Quests } from './components/Quests/Quests';
import { Achievements } from './components/Achievements/Achievements';
import { SideStats } from './components/SideStats/SideStats';
import { Toasts } from './components/effects/Toasts';
import { LightningFlash } from './components/effects/LightningFlash';
import { RecapModal } from './components/effects/RecapModal';
import { OfflineModal } from './components/effects/OfflineModal';
import { FloatingCoins } from './components/effects/FloatingCoins';
import { HarvestReveal } from './components/effects/HarvestReveal';
import { Fireworks } from './components/effects/Fireworks';
import { SellPopUp } from './components/effects/SellPopUp';
import { useGameTick } from './hooks/useGameTick';
import { useSoundEffects } from './hooks/useSoundEffects';
import { useGameStore } from './store/useGameStore';
import './App.css';
import './components/CatDisplay/cat-sprite.css';

type PanelTab = 'shop' | 'lottery' | 'quests' | 'achievements' | 'stall';
type MobileTab = 'garden' | PanelTab;

const TABS: Array<{ id: PanelTab; label: string }> = [
  { id: 'shop', label: 'Butik' },
  { id: 'quests', label: 'Uppdrag' },
  { id: 'achievements', label: 'Trofér' },
  { id: 'stall', label: 'Stall' },
  { id: 'lottery', label: 'Hjulet' },
];

function App() {
  useGameTick();
  useGlobalSoundEffects();
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const soundMuted = useGameStore((s) => s.settings.soundMuted);
  const toggleReducedMotion = useGameStore((s) => s.toggleReducedMotion);
  const toggleSoundMuted = useGameStore((s) => s.toggleSoundMuted);
  const activeStrike = useGameStore((s) => s.activeStrike);
  const { playButton } = useSoundEffects();
  const [mobileTab, setMobileTab] = useState<MobileTab>('garden');
  const [panelTab, setPanelTab] = useState<PanelTab>('shop');
  const [meteorShakeKey, setMeteorShakeKey] = useState(0);

  useEffect(() => {
    if (activeStrike && activeStrike.eventId === 'meteor') {
      setMeteorShakeKey((k) => k + 1);
      const off = window.setTimeout(() => {
        setMeteorShakeKey(0);
      }, 700);
      return () => window.clearTimeout(off);
    }
    return undefined;
  }, [activeStrike]);

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

      {/* Top HUD spans full width on desktop. */}
      <div className="app-hud-bar">
        <HUD
          onOpenShop={() => {
            setMobileTab('shop');
            setPanelTab('shop');
          }}
          onOpenLottery={() => {
            setMobileTab('lottery');
            setPanelTab('lottery');
          }}
        />
      </div>

      <main
        className={`app-body${meteorShakeKey > 0 ? ' fx-meteor-shake' : ''}`}
        data-shake-id={meteorShakeKey}
      >
        {/* Garden panel (always visible on desktop; mobile shows on garden tab) */}
        <section
          className={
            mobileTab === 'garden'
              ? 'panel panel-main'
              : 'panel panel-main panel-hidden-mobile'
          }
        >
          <Garden />
        </section>

        {/* Center tabbed panel */}
        <section
          className={
            mobileTab === 'garden'
              ? 'panel panel-center panel-hidden-mobile'
              : 'panel panel-center'
          }
          data-active-tab={panelTab}
        >
          <PanelTabBar
            active={panelTab}
            onChange={(t) => {
              setPanelTab(t);
              setMobileTab(t);
              playButton();
            }}
          />
          <div className="panel-center-content">
            {(panelTab === 'shop' || mobileTab === 'shop') && (
              <PanelSlot active={panelTab === 'shop' || mobileTab === 'shop'}>
                <Shop
                  onOpenLottery={() => {
                    setPanelTab('lottery');
                    setMobileTab('lottery');
                  }}
                />
              </PanelSlot>
            )}
            {(panelTab === 'lottery' || mobileTab === 'lottery') && (
              <PanelSlot
                active={panelTab === 'lottery' || mobileTab === 'lottery'}
              >
                <LotteryWheel />
              </PanelSlot>
            )}
            {(panelTab === 'quests' || mobileTab === 'quests') && (
              <PanelSlot
                active={panelTab === 'quests' || mobileTab === 'quests'}
              >
                <Quests />
              </PanelSlot>
            )}
            {(panelTab === 'achievements' || mobileTab === 'achievements') && (
              <PanelSlot
                active={
                  panelTab === 'achievements' || mobileTab === 'achievements'
                }
              >
                <Achievements />
              </PanelSlot>
            )}
            {(panelTab === 'stall' || mobileTab === 'stall') && (
              <PanelSlot
                active={panelTab === 'stall' || mobileTab === 'stall'}
              >
                <CatDisplay />
              </PanelSlot>
            )}
          </div>
        </section>

        {/* Right side stats — desktop only */}
        <section className="panel panel-right">
          <SideStats />
        </section>
      </main>

      <nav className="app-tabbar" aria-label="Sektioner">
        <button
          aria-pressed={mobileTab === 'garden'}
          onClick={() => setMobileTab('garden')}
        >
          Trädgård
        </button>
        <button
          aria-pressed={mobileTab === 'shop'}
          onClick={() => {
            setMobileTab('shop');
            setPanelTab('shop');
          }}
        >
          Butik
        </button>
        <button
          aria-pressed={mobileTab === 'quests'}
          onClick={() => {
            setMobileTab('quests');
            setPanelTab('quests');
          }}
        >
          Uppdrag
          <QuestNotice />
        </button>
        <button
          aria-pressed={mobileTab === 'achievements'}
          onClick={() => {
            setMobileTab('achievements');
            setPanelTab('achievements');
          }}
        >
          Trofér
        </button>
        <button
          aria-pressed={mobileTab === 'stall'}
          onClick={() => {
            setMobileTab('stall');
            setPanelTab('stall');
          }}
        >
          Stall
        </button>
      </nav>

      <Toasts />
      <FloatingCoins />
      <SellPopUp />
      <HarvestReveal />
      <Fireworks />
      <LightningFlash />
      <RecapModal />
      <OfflineModal />
    </div>
  );
}

function PanelSlot({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={active ? 'panel-slot active' : 'panel-slot'}>
      {children}
    </div>
  );
}

function PanelTabBar({
  active,
  onChange,
}: {
  active: PanelTab;
  onChange: (t: PanelTab) => void;
}) {
  const claimReady = useGameStore((s) =>
    s.dailyQuests.quests.some((q) => q.completed && !q.rewardClaimed),
  );
  const freeSpin = useGameStore((s) => s.lottery.lastFreeSpinAt);

  return (
    <div className="desktop-tab-bar" role="tablist">
      {TABS.map((t) => {
        const isActive = active === t.id;
        const showQuestPip = t.id === 'quests' && claimReady;
        const showLotteryPip =
          t.id === 'lottery' && (freeSpin === null || isNewDay(freeSpin));
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'tab-pill active' : 'tab-pill'}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            {showQuestPip && <span className="tab-pill-pip" />}
            {showLotteryPip && (
              <span className="tab-pill-pip tab-pill-pip-secondary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function isNewDay(lastFreeSpinAt: number): boolean {
  const now = new Date();
  const last = new Date(lastFreeSpinAt);
  return (
    now.getFullYear() !== last.getFullYear() ||
    now.getMonth() !== last.getMonth() ||
    now.getDate() !== last.getDate()
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
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" opacity="0.85" />
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
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" opacity="0.85" />
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
