# Generator State — Iteration 001

## What Was Built

### Domain layer (pure TS, no React)
- `src/domain/catTypes.ts` — single source of truth for all 8 cat types (Gräskatt → Rymkatt) with palette, grow times, sell values, seed costs, unlock conditions, rarity tints
- `src/domain/plots.ts` — plot state machine (empty/growing/ready), growth progress %, 3-stage visual progression, lightning bonus, effective sell value, unlock thresholds [0, 200, 800, 3000, 10000, 50000]
- `src/domain/economy.ts` — purchase math, `plotsUnlockedBy`, `nextPlotUnlock`, `visibleSeeds`
- `src/domain/lottery.ts` — 8 sectors with weights matching spec (total 87), weighted roll, local-date free-spin logic, 50-coin paid spin cost
- `src/domain/lightning.ts` — 0.5% per-plot per-second chance, 30s global cooldown, +20–50% bonus, +100% stacking cap
- `src/domain/persistence.ts` — versioned save schema (`grow-a-cat:save:v1`), migration hook, defensive load
- `src/domain/time.ts` — offline catch-up, `formatRemaining`, `formatCoins`
- Re-export aggregators (`cats.ts`, `seeds.ts`, `events.ts`, `progression.ts`) matching the task spec's filenames

### Store
- `src/store/useGameStore.ts` — Zustand store. Actions: `tick`, `plantSeed`, `harvestCat`, `buySeed`, `spinLottery`, `acknowledgeSpin`, `toggleReducedMotion`, `harvestAllReady`, `dismissToast`, `dismissRecap`, `clearFloatingCoin`, `forceSave`. Persists after every meaningful action.

### Components
- `src/components/CatDisplay/CatSprite.tsx` — custom inline SVG chibi cats (NO emoji). Each of the 8 cats has a distinct identity: clover, carrot leaves, berry cluster, seed dots, lemon collar, rainbow stripes, constellation + halo, nebula swirl + orbiting moonlet. Also renders seedling/sapling stages.
- `src/components/CatDisplay/CatDisplay.tsx` — "Kattstall" inventory panel with rarity-tinted rows, collection counter, seed/sold badges
- `src/components/HUD/HUD.tsx` — animated coin counter (pulse on change via Framer Motion), totalEarned, next-plot progress bar, Butik + Lyckohjul buttons with free-spin pip
- `src/components/Garden/Garden.tsx` + `PlotCard.tsx` + `PlantSheet.tsx` — terrarium-style plot cards with lip/depth shadow, grass tufts, lock state, growing meta + progress bar, ready CTA, ⚡ badge, storm cloud overlay
- `src/components/Shop/Shop.tsx` — tabbed (Frön / Mina frön) with rarity-tinted seed cards, lock silhouettes, insufficient-funds shake animation
- `src/components/LotteryWheel/LotteryWheel.tsx` — 8-sector SVG wheel with eased decel (4.4s, cubic-bezier 0.16,1,0.3,1), pointer, prize modal with confetti burst
- `src/components/effects/Toasts.tsx`, `LightningFlash.tsx`, `RecapModal.tsx`

### Styles
- `src/styles/tokens.css` — full design token palette, type scale, varied directional shadows, radii, motion durations; respects `prefers-reduced-motion`
- `src/index.css` — global reset, Fredoka + Nunito loaded, body grain texture, tabular-nums utility
- `src/App.css` — main layout (1-col mobile, 2-col desktop) + sticky bottom tabbar (mobile-only) + section cards

### Tests
- `src/domain/__tests__/lottery.test.ts` — weighted roll, free-spin reset
- `src/domain/__tests__/plots.test.ts` — growth %, stages, unlock thresholds, lightning bonus stacking

## What Changed This Iteration
- Initial implementation across all sprints (1-6 from spec)
- Replaced Vite boilerplate in `App.tsx`, `App.css`, `index.css`, `main.tsx`

## Known Issues
- Onboarding tooltip ("Klicka för att plantera en Gräskatt!") not yet implemented as overlay — empty plots have a `+` and "Plantera frö" label which mostly conveys the action
- Higher-tier cats not visually pixel-perfect to the spec's prose description (e.g., Rymkatt has nebula CSS but no continuous orbital animation)
- Vitest is not installed in package.json; test files are excluded from `tsc` build. To actually run tests you would add `vitest` as a devDep

## Dev Server
- URL: http://localhost:5173
- Status: running (vite background process id `bsom6pg4m`)
- Command: `npm run dev -- --port 5173 --host`
- Build: clean, 113kb gzipped JS, 6.26kb gzipped CSS
