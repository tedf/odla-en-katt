/**
 * App shell. Renders HUD, Garden, side panels (Shop / Lottery / Stable),
 * plus mobile bottom-nav and global effects.
 */

import { useState } from 'react';
import { HUD } from './components/HUD/HUD';
import { Garden } from './components/Garden/Garden';
import { Shop } from './components/Shop/Shop';
import { LotteryWheel } from './components/LotteryWheel/LotteryWheel';
import { CatDisplay } from './components/CatDisplay/CatDisplay';
import { Toasts } from './components/effects/Toasts';
import { LightningFlash } from './components/effects/LightningFlash';
import { RecapModal } from './components/effects/RecapModal';
import { useGameTick } from './hooks/useGameTick';
import { useGameStore } from './store/useGameStore';
import './App.css';
import './components/CatDisplay/cat-sprite.css';

type MobileTab = 'garden' | 'shop' | 'lottery' | 'stall';

function App() {
  useGameTick();
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const toggleReducedMotion = useGameStore((s) => s.toggleReducedMotion);
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
        <button
          type="button"
          className="reduced-motion-toggle"
          onClick={toggleReducedMotion}
          aria-pressed={reducedMotion}
          title={reducedMotion ? 'Slå på animationer' : 'Stäng av animationer'}
        >
          {reducedMotion ? 'Animationer av' : 'Animationer på'}
        </button>
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
            <Shop />
          </div>
          <div className={tab === 'lottery' ? '' : 'section-hidden-mobile'}>
            <LotteryWheel />
          </div>
          <div className={tab === 'stall' ? '' : 'section-hidden-mobile'}>
            <CatDisplay />
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
        <button
          aria-pressed={tab === 'lottery'}
          onClick={() => setTab('lottery')}
        >
          Lyckohjul
        </button>
        <button aria-pressed={tab === 'stall'} onClick={() => setTab('stall')}>
          Stall
        </button>
      </nav>

      <Toasts />
      <LightningFlash />
      <RecapModal />
    </div>
  );
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

export default App;
